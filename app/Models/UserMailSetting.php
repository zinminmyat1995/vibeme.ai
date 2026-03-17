<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class UserMailSetting extends Model
{
    protected $fillable = [
        'user_id', 'provider', 'mail_name', 'mail_address',
        'smtp_host', 'smtp_port', 'smtp_encryption',
        'imap_host', 'imap_port', 'mail_password',
        'is_verified', 'last_synced_at', 'sync_status', 'sync_error',
    ];

    protected $casts = [
        'is_verified'    => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    // Password encrypt/decrypt
    public function setMailPasswordAttribute(string $value): void
    {
        $this->attributes['mail_password'] = Crypt::encryptString($value);
    }

    public function getDecryptedPassword(): string
    {
        return Crypt::decryptString($this->mail_password);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}