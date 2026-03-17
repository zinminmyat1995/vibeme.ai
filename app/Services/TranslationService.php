<?php

namespace App\Services;

class TranslationService
{
    private bool $hasApi;

    private array $languageNames = [
        'en' => 'English',
        'ja' => 'Japanese',
        'my' => 'Burmese',
        'km' => 'Khmer',
        'vi' => 'Vietnamese',
        'ko' => 'Korean',
    ];

    public function __construct()
    {
        $this->hasApi = !empty(config('services.anthropic.key'));
    }

    public function hasApiKey(): bool
    {
        return $this->hasApi;
    }

    public function translate(string $text, string $targetLang): string
    {
        // API မရှိရင် original ပြန်ပေး
        if (!$this->hasApi) {
            return $text;
        }

        $langName = $this->languageNames[$targetLang] ?? $targetLang;

        $response = \Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-opus-4-6',
            'max_tokens' => 4096,
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => "Translate the following text to {$langName}. Return only the translated text, no explanations:\n\n{$text}",
                ],
            ],
        ]);

        if ($response->successful()) {
            return $response->json('content.0.text', $text);
        }

        return $text; // error ဖြစ်ရင် original ပြန်ပေး
    }
}