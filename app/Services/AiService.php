<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;

class AiService
{
    private bool $hasApi;
    private string $model = 'claude-opus-4-6';

    public function __construct()
    {
        $this->hasApi = !empty(config('services.anthropic.key'));
    }

    public function hasApiKey(): bool { return $this->hasApi; }

    // ── Translate text (original — backward compatible) ──
    public function translate(string $text, string $targetLang): string
    {
        [$translated] = $this->translateWithUsage($text, $targetLang);
        return $translated;
    }

    // ── Translate text + return usage (for console logging) ──
    public function translateWithUsage(string $text, string $targetLang): array
    {
        if (!$this->hasApi) return [$text, null];

        $langs = [
            'en' => 'English',
            'ja' => 'Japanese',
            'my' => 'Burmese',
            'km' => 'Khmer',
            'vi' => 'Vietnamese',
            'ko' => 'Korean',
        ];
        $lang = $langs[$targetLang] ?? $targetLang;

        $result = $this->callWithUsage(
            "Translate the following to {$lang}. Return only the translated text:\n\n{$text}"
        );

        return [$result['text'], $result['usage']];
    }

    // ── Generate mail from prompt ──
    public function generateMail(string $prompt, string $tone = 'professional'): array
    {
        if (!$this->hasApi) {
            return [
                'subject' => 'Sample Subject',
                'body'    => '<p>This is a demo mail. Configure API key for AI generation.</p>',
            ];
        }

        $response = $this->call(
            "Write a {$tone} email for: {$prompt}\n\n" .
            "Return JSON only — no markdown fences: {\"subject\": \"...\", \"body\": \"...HTML only, no code blocks...\"}"
        );

        try {
            $clean = preg_replace('/```json|```/', '', $response);
            return json_decode(trim($clean), true) ?? [
                'subject' => 'Generated Subject',
                'body'    => $response,
            ];
        } catch (\Exception $e) {
            return ['subject' => 'Generated Subject', 'body' => $response];
        }
    }

    // ── Improve existing mail ──
    public function improveMail(string $body): string
    {
        if (!$this->hasApi) return $body;

        return $this->call(
            "Improve this email to be more professional and clear. " .
            "Return only the improved HTML body:\n\n{$body}"
        );
    }

    // ── Summarize mail ──
    public function summarize(string $body): string
    {
        if (!$this->hasApi) return substr(strip_tags($body), 0, 200) . '...';

        return $this->call("Summarize this email in 2-3 sentences:\n\n" . strip_tags($body));
    }

    // ── Core API call (text only — backward compatible) ──
    private function call(string $prompt): string
    {
        return $this->callWithUsage($prompt)['text'];
    }

    // ── Core API call with usage tracking ──
    private function callWithUsage(string $prompt): array
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => $this->model,
            'max_tokens' => 2048,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        if ($response->successful()) {
            $json = $response->json();

            // usage: { input_tokens: x, output_tokens: y }
            $usage = isset($json['usage']) ? [
                'input_tokens'  => $json['usage']['input_tokens']  ?? 0,
                'output_tokens' => $json['usage']['output_tokens'] ?? 0,
            ] : null;

            return [
                'text'  => $json['content'][0]['text'] ?? '',
                'usage' => $usage,
            ];
        }

        return ['text' => '', 'usage' => null];
    }

    // ── Generate mail + usage ──
    public function generateMailWithUsage(string $prompt, string $tone = 'professional'): array
    {
        if (!$this->hasApi) {
            return [
                ['subject' => 'Sample Subject', 'body' => '<p>Demo mail. Configure API key.</p>'],
                null
            ];
        }

        $result = $this->callWithUsage(
            "Write a {$tone} email for: {$prompt}\n\n" .
            "Return JSON only — no markdown fences: {\"subject\": \"...\", \"body\": \"...HTML only, no code blocks...\"}"
        );

        try {
            $clean = preg_replace('/```json|```/', '', $result['text']);
            $parsed = json_decode(trim($clean), true) ?? [
                'subject' => 'Generated Subject',
                'body'    => $result['text'],
            ];
            return [$parsed, $result['usage']];
        } catch (\Exception $e) {
            return [['subject' => 'Generated Subject', 'body' => $result['text']], $result['usage']];
        }
    }

    // ── Improve mail + usage ──
    public function improveMailWithUsage(string $body): array
    {
        if (!$this->hasApi) return [$body, null];

        $result = $this->callWithUsage(
            "Improve this email to be more professional and clear. " .
            "Return only the improved HTML body:\n\n{$body}"
        );

        return [$result['text'], $result['usage']];
    }

}