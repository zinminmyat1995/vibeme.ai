<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailAttachment extends Model
{
    protected $fillable = [
        'mail_id', 'filename', 'storage_path', 'file_size', 'mime_type',
    ];

    public function mail()
    {
        return $this->belongsTo(Mail::class);
    }

    public function getFileSizeFormatted(): string
    {
        $bytes = $this->file_size;
        if ($bytes < 1024)     return $bytes . ' B';
        if ($bytes < 1048576)  return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }
}