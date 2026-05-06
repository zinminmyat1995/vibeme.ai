<?php

namespace App\Http\Controllers;

use App\Models\Mail;
use App\Models\MailAttachment;
use App\Models\MailTemplate;
use App\Models\UserMailSetting;
use App\Services\AiService;
use App\Services\ImapService;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class SmartMailController extends Controller
{
    public function __construct(
        private MailService $mailService,
        private ImapService $imapService,
        private AiService   $aiService,
    ) {}

    // ── Index ───────────────────────────────────────────────────────
    public function index()
    {
        $user        = auth()->user();
        $mailSetting = UserMailSetting::where('user_id', $user->id)->first();

        if (!$mailSetting || !$mailSetting->is_verified) {
            return Inertia::render('SmartMail', [
                'mailSetting' => $mailSetting,
                'needsSetup'  => true,
                'hasApi'      => $this->aiService->hasApiKey(),
            ]);
        }

        // Page load = DB ထဲရှိသမျှ ဆွဲ (limit မပါ — sync လုပ်ထားသမျှ အကုန်ပြ)
        // newest 100 ခု cap ထားမယ် (performance အတွက်)
        $inbox = Mail::where('user_id', $user->id)
            ->where('type', 'received')
            ->whereNull('deleted_at')
            ->with('attachments')
            ->orderByDesc('mail_date')
            ->limit(10)
            ->get()
            ->map(fn($m) => $this->formatMail($m));

        $sent = Mail::where('user_id', $user->id)
            ->where('type', 'sent')
            ->whereNull('deleted_at')
            ->with('attachments')
            ->orderByDesc('mail_date')
            ->limit(100)
            ->get()
            ->map(fn($m) => $this->formatMail($m));

        $unreadCount = Mail::where('user_id', $user->id)
            ->where('type', 'received')
            ->where('is_read', false)
            ->whereNull('deleted_at')
            ->count();
        \Log::info(\App\Models\LeavePolicy::where('is_active', true)
                                ->orderBy('leave_type')
                                ->pluck('leave_type')
                                ->unique()
                                ->values());
        return Inertia::render('SmartMail', [
            'mailSetting' => $this->formatSetting($mailSetting),
            'inbox'       => $inbox,
            'sent'        => $sent,
            'unreadCount' => $unreadCount,
            'templates'   => MailTemplate::all(),
            'systemUsers' => $this->getSystemUsers(),
            'leaveTypes'  => \App\Models\LeavePolicy::where('is_active', true)
                                ->orderBy('leave_type')
                                ->pluck('leave_type')
                                ->unique()
                                ->values(),
            'needsSetup'  => false,
            'hasApi'      => $this->aiService->hasApiKey(),
        ]);
    }

    // ── Save Mail Setting ───────────────────────────────────────────
    public function saveMailSetting(Request $request)
    {
        $request->validate([
            'provider'        => 'required|in:gmail,outlook,yahoo,other',
            'mail_name'       => 'required|string|max:255',
            'mail_address'    => 'required|email',
            'mail_password'   => 'required|string',
            'smtp_host'       => 'required|string',
            'smtp_port'       => 'required|integer',
            'smtp_encryption' => 'required|in:tls,ssl',
            'imap_host'       => 'required|string',
            'imap_port'       => 'required|integer',
        ]);

        $test = $this->imapService->testConnection(
            $request->imap_host,
            $request->imap_port,
            $request->mail_address,
            $request->mail_password
        );

        if (!$test['success']) {
            return back()->withErrors(['connection' => $test['error']]);
        }

        UserMailSetting::updateOrCreate(
            ['user_id' => auth()->id()],
            [
                'provider'        => $request->provider,
                'mail_name'       => $request->mail_name,
                'mail_address'    => $request->mail_address,
                'mail_password'   => $request->mail_password,
                'smtp_host'       => $request->smtp_host,
                'smtp_port'       => $request->smtp_port,
                'smtp_encryption' => $request->smtp_encryption,
                'imap_host'       => $request->imap_host,
                'imap_port'       => $request->imap_port,
                'is_verified'     => true,
            ]
        );

        return back();
    }

    // ── Test Connection ─────────────────────────────────────────────
    public function testConnection(Request $request)
    {
        $request->validate([
            'imap_host'     => 'required|string',
            'imap_port'     => 'required|integer',
            'mail_address'  => 'required|email',
            'mail_password' => 'required|string',
        ]);

        return response()->json(
            $this->imapService->testConnection(
                $request->imap_host,
                $request->imap_port,
                $request->mail_address,
                $request->mail_password
            )
        );
    }

    // ── Send Mail ───────────────────────────────────────────────────
    public function send(Request $request)
    {
        $request->validate([
            'to_addresses'   => 'required|array|min:1',
            'to_addresses.*' => 'email',
            'subject'        => 'nullable|string|max:500',
            'body_html'      => 'required|string',
            'cc_addresses'   => 'nullable|array',
            'bcc_addresses'  => 'nullable|array',
            'attachments'    => 'nullable|array',
            'attachments.*'  => 'file|max:10240',
            'ai_generated'   => 'nullable',
            'template_used'  => 'nullable|string',
        ]);

        $mailSetting = UserMailSetting::where('user_id', auth()->id())
            ->where('is_verified', true)
            ->first();

        if (!$mailSetting) {
            return response()->json(['message' => 'Mail account not connected.'], 422);
        }

        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $slug     = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
                $path     = $file->storeAs('mail-attachments', $slug . '-' . time() . '.' . $file->getClientOriginalExtension(), 'public');
                $attachmentPaths[] = [
                    'path'      => $path,
                    'filename'  => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ];
            }
        }

        $result = $this->mailService->sendMail($mailSetting, [
            'to_addresses'  => $request->to_addresses,
            'cc_addresses'  => $request->cc_addresses  ?? [],
            'bcc_addresses' => $request->bcc_addresses ?? [],
            'subject'       => $request->subject,
            'body_html'     => $request->body_html,
            'ai_generated'  => $request->ai_generated == '1',
            'template_used' => $request->template_used ?? null,
            'attachments'   => array_column($attachmentPaths, 'path'),
        ]);

        if (!$result['success']) {
            return response()->json(['message' => $result['error'] ?? 'Failed to send mail.'], 422);
        }

        foreach ($attachmentPaths as $att) {
            MailAttachment::create([
                'mail_id'      => $result['mail']->id,
                'filename'     => $att['filename'],
                'storage_path' => $att['path'],
                'file_size'    => $att['file_size'],
                'mime_type'    => $att['mime_type'],
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Mail sent successfully!', 'mail' => $this->formatMail($result['mail'])]);
    }

    // ── Sync Inbox ──────────────────────────────────────────────────
    // page=1 → newest 10 UIDs (IMAP) → DB save
    // page=2,3... → older 10 UIDs → DB save
    public function sync(Request $request)
    {
        $setting = UserMailSetting::where('user_id', auth()->id())
            ->where('is_verified', true)
            ->firstOrFail();

        $page = max(1, (int) $request->query('page', 1));

        return response()->json(
            $this->imapService->syncPage($setting, $page)
        );
    }

    // ── Mark Read ───────────────────────────────────────────────────
    public function markRead(Mail $mail)
    {
        $this->authorizeMail($mail);
        $mail->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }

    // ── Toggle Star ─────────────────────────────────────────────────
    public function toggleStar(Mail $mail)
    {
        $this->authorizeMail($mail);
        $mail->update(['is_starred' => !$mail->is_starred]);
        return response()->json(['success' => true, 'is_starred' => $mail->is_starred]);
    }

    // ── Delete ──────────────────────────────────────────────────────
    public function destroy(Mail $mail)
    {
        $this->authorizeMail($mail);
        $mail->delete();
        return back();
    }

    // ── Translate ───────────────────────────────────────────────────
    public function translate(Request $request, Mail $mail)
    {
        $request->validate(['language' => 'required|in:en,ja,my,km,vi,ko']);
        $this->authorizeMail($mail);
        $lang = $request->language;

        if ($mail->hasTranslation($lang)) {
            return response()->json(['success' => true, 'translated' => $mail->translated_body[$lang], 'cached' => true]);
        }
        if (!$this->aiService->hasApiKey()) {
            return response()->json(['success' => true, 'translated' => $mail->body_html ?? $mail->body_text, 'demo' => true]);
        }

        [$translated, $usage] = $this->aiService->translateWithUsage(
            strip_tags($mail->body_html ?? $mail->body_text ?? ''), $lang
        );

        $translations = $mail->translated_body ?? [];
        $translations[$lang] = $translated;
        $mail->update(['translated_body' => $translations]);

        return response()->json(['success' => true, 'translated' => $translated, 'usage' => $usage]);
    }

    // ── AI Generate ─────────────────────────────────────────────────
    public function aiGenerate(Request $request)
    {
        $request->validate(['prompt' => 'required|string|max:500', 'tone' => 'nullable|in:professional,friendly,formal,casual']);
        
        [$result, $usage] = $this->aiService->generateMailWithUsage(
            $request->prompt, $request->tone ?? 'professional'
        );
        
        return response()->json(['success' => true, 'result' => $result, 'usage' => $usage]);
    }

    // ── AI Translate Preview ─────────────────────────────────────────
    public function aiTranslatePreview(Request $request)
    {
        $request->validate(['content' => 'required|string', 'language' => 'required|in:en,ja,my,km,vi,ko']);
        
        [$translated, $usage] = $this->aiService->translateWithUsage($request->content, $request->language);
        
        return response()->json(['success' => true, 'translated' => $translated, 'usage' => $usage]);
    }

    // ── AI Improve ───────────────────────────────────────────────────
    public function aiImprove(Request $request)
    {
        $request->validate(['content' => 'required|string']);
        
        [$improved, $usage] = $this->aiService->improveMailWithUsage($request->content);
        
        return response()->json(['success' => true, 'improved' => $improved, 'usage' => $usage]);
    }

    // ── Template Render ──────────────────────────────────────────────
    public function renderTemplate(Request $request, MailTemplate $template)
    {
        $request->validate(['variables' => 'required|array']);
        return response()->json(['success' => true, 'rendered' => $template->render($request->variables)]);
    }

    // ── Download as HTML ─────────────────────────────────────────────
    public function downloadPdf(Mail $mail)
    {
        $this->authorizeMail($mail);

        $pdf = Pdf::loadHTML($this->buildMailHtml($mail));
        $pdf->setPaper('A4', 'portrait');
        $pdf->set_option('defaultFont', 'DejaVu Sans');
        $pdf->set_option('isHtml5ParserEnabled', true);

        $filename = 'mail-' . now()->format('Ymd-His') . '.pdf';
        return $pdf->download($filename);
    }

    private function buildMailHtml(Mail $mail): string
    {
        $subject = e($mail->subject ?: '(No Subject)');
        $from    = e($mail->from_name ? "{$mail->from_name} <{$mail->from_address}>" : $mail->from_address);
        $to      = e(implode(', ', $mail->to_addresses ?? []));
        $date    = e($mail->mail_date);
        $body    = $mail->body_html ?: nl2br(e($mail->body_text ?? ''));

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'DejaVu Sans', sans-serif;
                    font-size: 13px;
                    color: #1e293b;
                    background: #ffffff;
                }
                .header {
                    background-color: #4f46e5;
                    padding: 32px 40px 28px;
                    color: #ffffff;
                }
                .header-brand {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 10px;
                }
                .header-subject {
                    font-size: 20px;
                    font-weight: 800;
                    margin-bottom: 20px;
                    color: #ffffff;
                }
                .meta-row {
                    margin-bottom: 5px;
                    font-size: 12px;
                    color: rgba(255,255,255,0.85);
                }
                .meta-label {
                    display: inline-block;
                    width: 45px;
                    color: rgba(255,255,255,0.55);
                    font-weight: 700;
                }
                .divider {
                    height: 4px;
                    background-color: #7c3aed;
                }
                .body-wrap {
                    padding: 36px 40px;
                }
                .body-content {
                    font-size: 13px;
                    line-height: 1.85;
                    color: #334155;
                }
                .body-content p { margin-bottom: 12px; }
                .footer {
                    margin-top: 40px;
                    padding: 18px 40px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 10px;
                    color: #94a3b8;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-brand">VibeMe.AI — Smart Mail</div>
                <div class="header-subject">{$subject}</div>
                <div class="meta-row"><span class="meta-label">From</span>{$from}</div>
                <div class="meta-row"><span class="meta-label">To</span>{$to}</div>
                <div class="meta-row"><span class="meta-label">Date</span>{$date}</div>
            </div>
            <div class="divider"></div>
            <div class="body-wrap">
                <div class="body-content">{$body}</div>
            </div>
            <div class="footer">
                VibeMe.AI Smart Mail &nbsp;·&nbsp; Downloaded on {$date}
            </div>
        </body>
        </html>
        HTML;
    }

    // ── Helpers ──────────────────────────────────────────────────────
    private function authorizeMail(Mail $mail): void
    {
        abort_if($mail->user_id !== auth()->id(), 403);
    }

    private function formatMail(Mail $mail): array
    {
        return [
            'id'           => $mail->id,
            'mail_uid'     => $mail->mail_uid,
            'type'         => $mail->type,
            'from_address' => $mail->from_address,
            'from_name'    => $mail->from_name,
            'to_addresses' => $mail->to_addresses ?? [],
            'cc_addresses' => $mail->cc_addresses  ?? [],
            'subject'      => $mail->subject ?? '(No Subject)',
            'body_html'    => $mail->body_html,
            'body_text'    => $mail->body_text,
            'is_read'      => (bool) $mail->is_read,
            'is_starred'   => (bool) $mail->is_starred,
            'ai_generated' => (bool) $mail->ai_generated,
            'attachments'  => $mail->attachments->map(fn($a) => [
                'id'        => $a->id,
                'filename'  => $a->filename,
                'file_size' => $a->getFileSizeFormatted(),
                'mime_type' => $a->mime_type,
            ]),
            'mail_date' => $mail->mail_date
                ? \Carbon\Carbon::parse($mail->mail_date)->format('d M Y H:i')
                : null,
        ];
    }

    private function formatSetting(UserMailSetting $setting): array
    {
        return [
            'id'             => $setting->id,
            'provider'       => $setting->provider,
            'mail_name'      => $setting->mail_name,
            'mail_address'   => $setting->mail_address,
            'smtp_host'      => $setting->smtp_host,
            'smtp_port'      => $setting->smtp_port,
            'imap_host'      => $setting->imap_host,
            'imap_port'      => $setting->imap_port,
            'is_verified'    => $setting->is_verified,
            'last_synced_at' => $setting->last_synced_at?->format('d M Y H:i'),
            'sync_status'    => $setting->sync_status,
        ];
    }

    private function getSystemUsers(): array
    {
        return \App\Models\User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'email')
            ->get()
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email])
            ->toArray();
    }
}