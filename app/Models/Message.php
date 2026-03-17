<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'conversation_id', 'sender_id', 'type', 'body',
        'file_path', 'file_name', 'file_size', 'mime_type',
        'reply_to_id', 'is_edited', 'edited_at',
    ];

    protected $casts = [
        'is_edited' => 'boolean',
        'edited_at' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo()
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function replies()
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    public function translations()
    {
        return $this->hasMany(MessageTranslation::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function reads()
    {
        return $this->hasMany(MessageRead::class);
    }

    public function getTranslation(string $lang): ?string
    {
        return $this->translations()->where('language', $lang)->value('translated');
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path
            ? asset('storage/' . $this->file_path)
            : null;
    }
}