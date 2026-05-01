<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = [
        'created_by',
        'title',
        'content',
        'country',
        'start_at',
        'end_at',
        'file_path',   // ← ထပ်ထည့်
        'file_name',   // ← ထပ်ထည့်
        'file_size',   // ← ထပ်ထည့်
        'link_url',    // ← ထပ်ထည့်
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at'   => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Active = started and not expired
    public function scopeActive($query)
    {
        return $query->where('start_at', '<=', now())
                     ->where('end_at',   '>=', now());
    }
}