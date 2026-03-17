<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeRequest extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'hours_requested',
        'hours_approved',
        'reason',
        'status',
        'approved_by',
    ];

    protected $casts = [
        'date' => 'date',
        'hours_requested' => 'decimal:2',
        'hours_approved' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}