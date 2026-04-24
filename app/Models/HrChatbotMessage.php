<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrChatbotMessage extends Model
{
    protected $fillable = ['user_id', 'role', 'content', 'from_cache'];

    protected $casts = ['from_cache' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}