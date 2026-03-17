<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'type', 'name', 'avatar', 'created_by', 'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function members()
    {
        return $this->hasMany(ConversationMember::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_members')
                    ->withPivot('role', 'is_muted', 'is_archived', 'last_read_at')
                    ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Unread count for current user
    public function unreadCount(int $userId): int
    {
        $member = $this->members()->where('user_id', $userId)->first();
        if (!$member) return 0;

        return $this->messages()
            ->where('sender_id', '!=', $userId)
            ->where('created_at', '>', $member->last_read_at ?? '1970-01-01')
            ->count();
    }
}