<?php

namespace App\Services;

use App\Models\Mail;
use App\Models\UserMailSetting;
use App\Events\NewMailReceived;

class ImapService
{
    private $socket = null;
    private int $tag = 1;

    // ── Connection ────────────────────────────────────────────────────

    private function connect(UserMailSetting $setting): void
    {
        $ctx = stream_context_create([
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
        ]);

        $this->socket = stream_socket_client(
            "ssl://{$setting->imap_host}:{$setting->imap_port}",
            $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $ctx
        );

        if (!$this->socket) {
            throw new \Exception("Connect failed: {$errstr}");
        }

        stream_set_timeout($this->socket, 30);
        $this->readLine(); // greeting

        $user = $setting->mail_address;
        $pass = $setting->getDecryptedPassword();
        $resp = $this->cmd("LOGIN \"{$user}\" \"{$pass}\"");
        if (!$this->isOk($resp)) {
            throw new \Exception("LOGIN failed: " . implode(' ', array_slice($resp, -1)));
        }
    }

    private function disconnect(): void
    {
        if ($this->socket) {
            try { $this->cmd('LOGOUT'); } catch (\Throwable $e) {}
            fclose($this->socket);
            $this->socket = null;
            $this->tag    = 1;
        }
    }

    // ── Raw IMAP I/O ──────────────────────────────────────────────────

    private function cmd(string $command): array
    {
        $tag = 'T' . str_pad($this->tag++, 4, '0', STR_PAD_LEFT);
        fwrite($this->socket, "{$tag} {$command}\r\n");

        $lines = [];
        while (true) {
            $line = $this->readLine();
            if ($line === false) break;
            $lines[] = $line;
            if (str_starts_with($line, $tag . ' ')) break;
        }
        return $lines;
    }

    /**
     * Read one line — also handles IMAP literal strings {N}
     * Returns accumulated string including the literal bytes
     */
    private function readLine(): string|false
    {
        $line = fgets($this->socket, 65536);
        return $line !== false ? rtrim($line, "\r\n") : false;
    }

    /**
     * Read exactly N bytes from socket (for IMAP literals)
     */
    private function readBytes(int $n): string
    {
        $buf = '';
        $remaining = $n;
        while ($remaining > 0) {
            $chunk = fread($this->socket, min($remaining, 8192));
            if ($chunk === false || $chunk === '') break;
            $buf       .= $chunk;
            $remaining -= strlen($chunk);
        }
        return $buf;
    }

    private function isOk(array $lines): bool
    {
        foreach ($lines as $l) {
            if (preg_match('/^T\d+ OK/i', $l)) return true;
        }
        return false;
    }

    // ── IMAP Commands ─────────────────────────────────────────────────

    private function selectInbox(): int
    {
        $resp = $this->cmd('SELECT INBOX');
        foreach ($resp as $line) {
            if (preg_match('/^\* (\d+) EXISTS/i', $line, $m)) {
                return (int) $m[1];
            }
        }
        return 0;
    }

    private function searchAllUids(): array
    {
        $resp = $this->cmd('UID SEARCH ALL');
        foreach ($resp as $line) {
            if (preg_match('/^\* SEARCH([\d ]*)/i', $line, $m)) {
                $parts = array_filter(explode(' ', trim($m[1])), 'is_numeric');
                return array_map('intval', array_values($parts));
            }
        }
        return [];
    }

    /**
     * Fetch ENVELOPE + FLAGS for one UID
     * Returns: subject, from_address, from_name, date
     */
    private function fetchEnvelope(int $uid): array
    {
        $resp = $this->cmd("UID FETCH {$uid} (ENVELOPE FLAGS)");
        $raw  = implode(' ', $resp);

        \Log::debug('ENVELOPE raw uid=' . $uid, ['raw' => substr($raw, 0, 500)]);

        $subject     = '(No Subject)';
        $fromAddress = '';
        $fromName    = '';
        $date        = '';

        // ── Extract full ENVELOPE(...) block ──────────────────────────
        // ENVELOPE format:
        // ("date" "subject" (from) (sender) (reply-to) (to) (cc) (bcc) in-reply-to message-id)
        // Each address: (("personal" NIL "mailbox" "host"))
        if (preg_match('/ENVELOPE\s*\(/i', $raw, $startM, PREG_OFFSET_CAPTURE)) {
            $start = $startM[0][1] + strlen($startM[0][0]);
            $env   = $this->extractBalancedParens($raw, $start - 1);

            // 1) Date — first "..."
            if (preg_match('/"((?:[^"\\\\]|\\\\.)*)"/s', $env, $dm)) {
                $date = $dm[1];
            }

            // 2) Subject — second "..."
            if (preg_match('/"((?:[^"\\\\]|\\\\.)*)"[^"]*"((?:[^"\\\\]|\\\\.)*)"/s', $env, $sm)) {
                $subject = $this->decodeMimeHeader($sm[2]) ?: '(No Subject)';
            }

            // 3) FROM address list: (("name" NIL "mailbox" "host"))
            // Find first ((...)) after subject
            if (preg_match('/"[^"]*"\s*"[^"]*"\s*(\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\))/s', $env, $fromM)) {
                $fromBlock = $fromM[1];
                // Inner address tuple: ("name" NIL "mailbox" "host")
                if (preg_match('/\(\s*"([^"]*)"\s+NIL\s+"([^"]*)"\s+"([^"]*)"\s*\)/s', $fromBlock, $addrM)) {
                    $fromName    = $this->decodeMimeHeader($addrM[1]);
                    $fromAddress = $addrM[2] . '@' . $addrM[3];
                } elseif (preg_match('/\(\s*NIL\s+NIL\s+"([^"]*)"\s+"([^"]*)"\s*\)/s', $fromBlock, $addrM)) {
                    // No display name
                    $fromAddress = $addrM[1] . '@' . $addrM[2];
                    $fromName    = '';
                }
            }
        }

        \Log::debug('Parsed envelope', [
            'uid'     => $uid,
            'subject' => $subject,
            'from'    => $fromAddress,
            'name'    => $fromName,
            'date'    => $date,
        ]);

        return [
            'subject'      => $subject,
            'from_address' => $fromAddress,
            'from_name'    => $fromName,
            'date'         => $date,
        ];
    }

    /**
     * Extract balanced parentheses block starting at $pos
     */
    private function extractBalancedParens(string $str, int $pos): string
    {
        $depth  = 0;
        $start  = null;
        $len    = strlen($str);
        $inStr  = false;

        for ($i = $pos; $i < $len; $i++) {
            $c = $str[$i];
            if ($c === '"' && ($i === 0 || $str[$i - 1] !== '\\')) {
                $inStr = !$inStr;
            }
            if ($inStr) continue;
            if ($c === '(') {
                if ($depth === 0) $start = $i;
                $depth++;
            } elseif ($c === ')') {
                $depth--;
                if ($depth === 0 && $start !== null) {
                    return substr($str, $start, $i - $start + 1);
                }
            }
        }
        return '';
    }

    /**
     * Fetch full message body for one UID
     * Uses BODY.PEEK[] to avoid marking as read
     * Returns [html|null, text|null]
     */
    private function fetchBody(int $uid): array
    {
        // First fetch the structure to know encoding
        $structResp = $this->cmd("UID FETCH {$uid} (BODYSTRUCTURE)");
        $structRaw  = implode(' ', $structResp);

        // Fetch full raw message
        fwrite($this->socket, "T{$this->tag} UID FETCH {$uid} (BODY.PEEK[])\r\n");
        $tag = 'T' . $this->tag++;

        $bodyLines = [];
        $bodyBytes = 0;
        $inBody    = false;
        $collected = '';

        while (true) {
            $line = fgets($this->socket, 65536);
            if ($line === false) break;
            $line = rtrim($line, "\r\n");

            // Detect literal: BODY[] {12345}
            if (!$inBody && preg_match('/BODY\[\]\s+\{(\d+)\}/i', $line, $m)) {
                $bodyBytes = (int) $m[1];
                $collected = $this->readBytes($bodyBytes);
                $inBody    = true;
                continue;
            }

            if (str_starts_with($line, $tag . ' ')) break;
        }

        if (!$collected) {
            return [null, null];
        }

        return $this->parseRawMessage($collected);
    }

    /**
     * Parse a raw RFC822 message into [html, text]
     */
    private function parseRawMessage(string $raw): array
    {
        // Split headers and body
        $parts = preg_split('/\r?\n\r?\n/', $raw, 2);
        if (count($parts) < 2) return [null, null];

        $headers = $parts[0];
        $body    = $parts[1];

        // Content-Type
        $contentType = '';
        if (preg_match('/Content-Type:\s*([^\r\n]+(?:\r?\n\s+[^\r\n]+)*)/i', $headers, $m)) {
            $contentType = strtolower(preg_replace('/\s+/', ' ', $m[1]));
        }

        // Content-Transfer-Encoding
        $encoding = '';
        if (preg_match('/Content-Transfer-Encoding:\s*([^\r\n]+)/i', $headers, $m)) {
            $encoding = strtolower(trim($m[1]));
        }

        // Multipart?
        if (str_contains($contentType, 'multipart/')) {
            if (preg_match('/boundary="?([^";\r\n]+)"?/i', $contentType, $bm)) {
                return $this->parseMultipart($body, trim($bm[1]));
            }
        }

        // Decode body
        $decoded = $this->decodeBody($body, $encoding);

        // Charset conversion
        $charset = 'UTF-8';
        if (preg_match('/charset="?([^";\s]+)"?/i', $contentType, $cm)) {
            $charset = $cm[1];
        }
        $decoded = $this->toUtf8($decoded, $charset);

        if (str_contains($contentType, 'text/html')) {
            return [$decoded, strip_tags($decoded)];
        }

        return [null, $decoded];
    }

    /**
     * Parse multipart message, extract text/plain and text/html
     */
    private function parseMultipart(string $body, string $boundary): array
    {
        $html = null;
        $text = null;

        $boundary = trim($boundary, '"\'  ');
        $escaped  = preg_quote($boundary, '/');
        $rawParts = preg_split('/--' . $escaped . '(?:--)?\r?\n?/', $body);

        foreach ($rawParts as $part) {
            $part = ltrim($part, "\r\n");
            if (trim($part) === '' || trim($part) === '--') continue;

            // Split on first blank line
            if (!preg_match('/^(.*?)\r?\n\r?\n(.*)/s', $part, $split)) continue;
            $partHeaders = $split[1];
            $partBody    = $split[2];

            // Content-Type (may be folded)
            $partContentType = '';
            if (preg_match('/Content-Type:\s*([^\r\n]+(?:\r?\n[ \t]+[^\r\n]+)*)/i', $partHeaders, $m)) {
                $partContentType = strtolower(preg_replace('/\s+/', ' ', trim($m[1])));
            }

            // Content-Transfer-Encoding
            $partEncoding = '';
            if (preg_match('/Content-Transfer-Encoding:\s*([^\r\n]+)/i', $partHeaders, $m)) {
                $partEncoding = strtolower(trim($m[1]));
            }

            // Charset
            $charset = 'UTF-8';
            if (preg_match('/charset=["\']?([^"\';\s\r\n]+)["\']?/i', $partHeaders, $cm)) {
                $charset = $cm[1];
            }

            // Nested multipart
            if (str_contains($partContentType, 'multipart/')) {
                if (preg_match('/boundary=["\'\']?([^"\'\';\r\n]+)["\'\']?/i', $partContentType, $bm)) {
                    [$nestedHtml, $nestedText] = $this->parseMultipart($partBody, trim($bm[1], '"\' '));
                    if ($nestedHtml && !$html) $html = $nestedHtml;
                    if ($nestedText && !$text) $text = $nestedText;
                }
                continue;
            }

            $decoded = $this->decodeBody($partBody, $partEncoding);
            $decoded = $this->toUtf8($decoded, $charset);

            if (str_contains($partContentType, 'text/html') && !$html) {
                $html = $decoded;
            } elseif (str_contains($partContentType, 'text/plain') && !$text) {
                $text = $decoded;
            }
        }

        if ($html && !$text) {
            $text = strip_tags($html);
        }

        return [$html, $text];
    }

    private function decodeBody(string $body, string $encoding): string
    {
        $enc = strtolower(trim($encoding));
        if ($enc === 'base64') {
            return base64_decode(str_replace(["\r", "\n", " ", "\t"], '', $body));
        }
        if ($enc === 'quoted-printable') {
            $body = str_replace("\r\n", "\n", $body);
            $body = str_replace("=\n", '', $body);
            return quoted_printable_decode($body);
        }
        // ✅ encoding မပါသည့် case မှာလည်း quoted-printable ဟုတ်မဟုတ် check
        if (preg_match('/=[0-9A-F]{2}/i', $body)) {
            $body = str_replace("\r\n", "\n", $body);
            $body = str_replace("=\n", '', $body);
            return quoted_printable_decode($body);
        }
        return $body;
    }
    private function toUtf8(string $str, string $charset = 'UTF-8'): string
    {
        $charset = strtoupper(trim($charset));
        if ($charset === 'UTF-8' || $charset === '') {
            // Still sanitize
            return mb_convert_encoding($str, 'UTF-8', 'UTF-8');
        }
        return mb_convert_encoding($str, 'UTF-8', $charset);
    }

    private function decodeMimeHeader(string $str): string
    {
        if (!str_contains($str, '=?')) return $str;

        return preg_replace_callback(
            '/=\?([^?]+)\?([BQbq])\?([^?]*)\?=/',
            function ($m) {
                [$charset, $enc, $text] = [$m[1], strtoupper($m[2]), $m[3]];
                $decoded = $enc === 'B'
                    ? base64_decode($text)
                    : quoted_printable_decode(str_replace('_', ' ', $text));
                return $this->toUtf8($decoded, $charset);
            },
            $str
        );
    }

    // ── UTF-8 sanitize for JSON ───────────────────────────────────────
    private function utf8(?string $str): string
    {
        if ($str === null || $str === '') return '';
        
        // Already valid UTF-8 — don't re-encode
        if (mb_check_encoding($str, 'UTF-8')) {
            return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $str) ?? $str;
        }
        
        // Fallback for broken encoding
        $detected = mb_detect_encoding($str, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII'], true);
        $str = mb_convert_encoding($str, 'UTF-8', $detected ?: 'ISO-8859-1');
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $str) ?? $str;
    }

    // ── Public API ────────────────────────────────────────────────────

    public function syncPage(UserMailSetting $setting, int $page = 1): array
    {
        try {
            \Log::info('ImapService::syncPage', ['user' => $setting->user_id, 'page' => $page]);

            $this->connect($setting);

            $total = $this->selectInbox();
            \Log::info('INBOX total: ' . $total);

            if ($total === 0) {
                $this->disconnect();
                return $this->okResponse([], 0, false, 1, 0);
            }

            $allUids = $this->searchAllUids();
            rsort($allUids); // newest first

            $perPage  = 10;
            $hasMore  = count($allUids) > $page * $perPage;
            $pageUids = array_slice($allUids, ($page - 1) * $perPage, $perPage);

            \Log::info('Processing UIDs', ['page' => $page, 'uids' => $pageUids]);

            $mails    = [];
            $newCount = 0;

            foreach ($pageUids as $uid) {
                // Cache hit
                $existing = Mail::where('user_id', $setting->user_id)
                    ->where('mail_uid', $uid)->first();

                if ($existing) {
                    $mails[] = $this->formatMailArray($existing);
                    continue;
                }

                // Envelope (headers)
                $envelope = $this->fetchEnvelope($uid);

                // Body
                [$bodyHtml, $bodyText] = $this->fetchBody($uid);

                // Date
                $mailDate = now();
                if ($envelope['date']) {
                    try { $mailDate = \Carbon\Carbon::parse($envelope['date']); }
                    catch (\Throwable $e) {}
                }

                \Log::info('Saving uid=' . $uid, [
                    'from'    => $envelope['from_address'],
                    'subject' => $envelope['subject'],
                    'date'    => $mailDate->format('Y-m-d H:i'),
                ]);

                $mail = Mail::updateOrCreate(
                    [
                        'user_id'  => $setting->user_id,
                        'mail_uid' => $uid,
                    ],
                    [
                        'type'         => 'received',
                        'from_address' => $this->utf8($envelope['from_address']),
                        'from_name'    => $this->utf8($envelope['from_name']),
                        'to_addresses' => [$setting->mail_address],
                        'subject'      => $this->utf8($envelope['subject']),
                        'body_html'    => $bodyHtml ? $this->utf8($bodyHtml) : null,
                        'body_text'    => $bodyText ? $this->utf8($bodyText) : null,
                        'mail_date'    => $mailDate,
                    ]
                );

                if ($mail->wasRecentlyCreated) {
                    $mail->update(['is_read' => false]);
                    try { event(new NewMailReceived($mail)); } catch (\Throwable $e) {}
                    $newCount++;
                }

                
                $mails[] = $this->formatMailArray($mail);
            }

            $this->disconnect();

            $setting->update([
                'sync_status'    => 'idle',
                'last_synced_at' => now(),
                'sync_error'     => null,
            ]);

            \Log::info('SyncPage done', [
                'page'     => $page,
                'loaded'   => count($mails),
                'new'      => $newCount,
                'has_more' => $hasMore,
            ]);

            return $this->okResponse($mails, $newCount, $hasMore, $page + 1, $total);

        } catch (\Throwable $e) {
            \Log::error('IMAP Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            try { $this->disconnect(); } catch (\Throwable $e2) {}
            $setting->update(['sync_status' => 'failed', 'sync_error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage(), 'mails' => []];
        }
    }

    public function testConnection(string $host, int $port, string $username, string $password): array
    {
        $ctx = stream_context_create([
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
        ]);

        // Step 1: SSL Connect
        $sock = @stream_socket_client(
            "ssl://{$host}:{$port}",
            $errno, $errstr, 15,
            STREAM_CLIENT_CONNECT, $ctx
        );

        if (!$sock) {
            return ['success' => false, 'error' => "Cannot connect to {$host}:{$port} — {$errstr}"];
        }

        stream_set_timeout($sock, 15);

        // Step 2: Read greeting
        $greeting = fgets($sock, 1024);
        if ($greeting === false) {
            fclose($sock);
            return ['success' => false, 'error' => 'No response from mail server.'];
        }

        // Step 3: IMAP LOGIN with actual credentials
        $tag = 'T0001';
        $cmd = "{$tag} LOGIN \"{$username}\" \"{$password}\"\r\n";
        fwrite($sock, $cmd);

        $response = '';
        $deadline = time() + 15;
        while (time() < $deadline) {
            $line = fgets($sock, 1024);
            if ($line === false) break;
            $response .= $line;
            if (str_starts_with($line, $tag . ' ')) break;
        }

        // Step 4: Logout cleanly
        @fwrite($sock, "T0002 LOGOUT\r\n");
        @fclose($sock);

        // Step 5: Check result
        if (preg_match('/^' . preg_quote($tag) . '\s+OK/im', $response)) {
            return ['success' => true, 'message' => 'Connection and login successful'];
        }

        // Extract server error message
        $errorLine = '';
        foreach (explode("\n", $response) as $line) {
            if (str_starts_with(trim($line), $tag . ' ')) {
                $errorLine = trim($line);
                break;
            }
        }

        // Friendly error messages
        if (str_contains(strtoupper($errorLine), 'AUTHENTICATIONFAILED')
            || str_contains(strtoupper($errorLine), 'INVALID CREDENTIALS')) {
            return ['success' => false, 'error' => 'Login failed — Email or App Password is incorrect.'];
        }

        if (str_contains(strtoupper($errorLine), 'NO')) {
            return ['success' => false, 'error' => 'Login rejected by server — check your App Password.'];
        }

        return ['success' => false, 'error' => 'Login failed — ' . ($errorLine ?: 'Unknown error')];
    }

    // ── Format ────────────────────────────────────────────────────────

    private function formatMailArray(Mail $mail): array
    {
        $preview = strip_tags($mail->body_text ?? $mail->body_html ?? '');
        $preview = trim(preg_replace('/\s+/', ' ', $preview));
        $preview = mb_substr($preview, 0, 120);

        return [
            'id'           => $mail->id,
            'mail_uid'     => $mail->mail_uid,
            'type'         => $mail->type,
            'from_address' => $this->utf8($mail->from_address),
            'from_name'    => $this->utf8($mail->from_name),
            'to_addresses' => $mail->to_addresses ?? [],
            'subject'      => $this->utf8($mail->subject ?: '(No Subject)'),
            'body_html'    => $this->utf8($mail->body_html),
            'body_text'    => $this->utf8($preview),
            'is_read'      => (bool) $mail->is_read,
            'is_starred'   => (bool) $mail->is_starred,
            'ai_generated' => (bool) $mail->ai_generated,
            'attachments'  => [],
            'mail_date'    => $mail->mail_date
                ? \Carbon\Carbon::parse($mail->mail_date)->format('d M Y H:i')
                : now()->format('d M Y H:i'),
        ];
    }

    private function okResponse(array $mails, int $newCount, bool $hasMore, int $nextPage, int $total): array
    {
        return [
            'success'   => true,
            'mails'     => $mails,
            'new_count' => $newCount,
            'has_more'  => $hasMore,
            'next_page' => $nextPage,
            'total'     => $total,
        ];
    }
}