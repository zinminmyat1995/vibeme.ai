<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OvertimeRequest extends Model
{
    protected $fillable = [
        'user_id',
        'approver_id',
        'date',
        'start_time',
        'end_time',
        'hours_requested',   // total (sum of all segments)
        'hours_approved',    // total approved (sum of segments hours_approved)
        'reason',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'date'            => 'date',
        'hours_requested' => 'decimal:2',
        'hours_approved'  => 'decimal:2',
        'approved_at'     => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function segments(): HasMany
    {
        return $this->hasMany(OvertimeRequestSegment::class);
    }
}