<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentDownload extends Model
{
    protected $fillable = [
        'document_id', 'user_id', 'language', 'ip_address',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}