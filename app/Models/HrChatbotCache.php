<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrChatbotCache extends Model
{
    protected $table = 'hr_chatbot_cache';
    
    protected $fillable = ['user_id', 'question_hash', 'question', 'answer', 'expires_at'];

    protected $casts = ['expires_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Check if cache entry is still valid
    public function isValid(): bool
    {
        return is_null($this->expires_at) || $this->expires_at->isFuture();
    }
}