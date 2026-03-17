<?php

namespace App\Services;

use App\Models\Mail;
use App\Models\UserMailSetting;
use Illuminate\Support\Facades\Mail as LaravelMail;
use Illuminate\Mail\Message;

class MailService
{
    public function __construct(private AiService $ai) {}

    // ── Send mail via user's SMTP ──
    public function sendMail(UserMailSetting $setting, array $data): array
    {
        $password = $setting->getDecryptedPassword();

        config([
            'mail.mailers.smtp.host'       => $setting->smtp_host,
            'mail.mailers.smtp.port'       => $setting->smtp_port,
            'mail.mailers.smtp.encryption' => $setting->smtp_encryption,
            'mail.mailers.smtp.username'   => $setting->mail_address,
            'mail.mailers.smtp.password'   => $password,
            'mail.from.address'            => $setting->mail_address,
            'mail.from.name'               => $setting->mail_name,
        ]);

        try {
            // ❌ ဟောင်း — setBody() မသုံးရ
            // LaravelMail::send([], [], function (Message $message) use ($data) {
            //     $message->setBody($data['body_html'], 'text/html');
            // });

            // ✅ အသစ် — html() သုံး
            LaravelMail::html($data['body_html'], function ($message) use ($data) {
                $message->to($data['to_addresses'])
                        ->subject($data['subject']);

                if (!empty($data['cc_addresses'])) {
                    $message->cc($data['cc_addresses']);
                }
                if (!empty($data['bcc_addresses'])) {
                    $message->bcc($data['bcc_addresses']);
                }

                // Attachments
                if (!empty($data['attachments'])) {
                    foreach ($data['attachments'] as $path) {
                        $message->attach(storage_path('app/public/' . $path));
                    }
                }
            });

            // Save to DB
            $mail = Mail::create([
                'user_id'       => $setting->user_id,
                'type'          => 'sent',
                'from_address'  => $setting->mail_address,
                'from_name'     => $setting->mail_name,
                'to_addresses'  => $data['to_addresses'],
                'cc_addresses'  => $data['cc_addresses']  ?? [],
                'bcc_addresses' => $data['bcc_addresses'] ?? [],
                'subject'       => $data['subject'],
                'body_html'     => $data['body_html'],
                'body_text'     => strip_tags($data['body_html']),
                'ai_generated'  => $data['ai_generated']  ?? false,
                'template_used' => $data['template_used'] ?? null,
                'is_read'       => true,
                'mail_date'     => now(),
            ]);

            return ['success' => true, 'mail' => $mail];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}