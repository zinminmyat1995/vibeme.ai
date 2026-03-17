<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mail extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'mail_uid', 'type',
        'from_address', 'from_name',
        'to_addresses', 'cc_addresses', 'bcc_addresses',
        'subject', 'body_html', 'body_text',
        'translated_body', 'detected_language',
        'ai_generated', 'template_used',
        'is_read', 'is_starred', 'mail_date',
    ];

    protected $casts = [
        'to_addresses'   => 'array',
        'cc_addresses'   => 'array',
        'bcc_addresses'  => 'array',
        'translated_body'=> 'array',
        'is_read'        => 'boolean',
        'is_starred'     => 'boolean',
        'ai_generated'   => 'boolean',
        'mail_date'      => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attachments()
    {
        return $this->hasMany(MailAttachment::class);
    }

    public function hasTranslation(string $lang): bool
    {
        return isset($this->translated_body[$lang]);
    }
}