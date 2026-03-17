<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageTranslation extends Model
{
    protected $fillable = [
        'message_id', 'language', 'translated',
    ];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}