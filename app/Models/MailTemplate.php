<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailTemplate extends Model
{
    protected $fillable = [
        'name', 'slug', 'icon', 'category',
        'subject_template', 'body_template', 'variables',
    ];

    protected $casts = [
        'variables' => 'array',
    ];

    // {topic} → actual value replace လုပ်
    public function render(array $variables): array
    {
        $subject = $this->subject_template;
        $body    = $this->body_template;

        foreach ($variables as $key => $value) {
            $subject = str_replace("{{$key}}", $value, $subject);
            $body    = str_replace("{{$key}}", $value, $body);
        }

        return ['subject' => $subject, 'body' => $body];
    }
}