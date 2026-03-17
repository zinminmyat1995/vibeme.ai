<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationMember extends Model
{
    protected $fillable = [
        'conversation_id', 'user_id', 'role',
        'is_muted', 'is_archived', 'last_read_at', 'joined_at',
    ];

    protected $casts = [
        'is_muted'     => 'boolean',
        'is_archived'  => 'boolean',
        'last_read_at' => 'datetime',
        'joined_at'    => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}