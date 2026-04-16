<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRequest extends Model
{
    protected $fillable = [
        'user_id',
        'approver_id',
        'date',
        'requested_check_in_time',
        'requested_check_out_time',
        'approved_check_in_time',
        'approved_check_out_time',
        'requested_work_hours',
        'requested_late_minutes',
        'approved_work_hours',
        'approved_late_minutes',
        'approved_short_hours',
        'status',
        'note',
        'rejection_reason',
        'approved_by',
        'approved_at',
        'created_by',
    ];

    protected $casts = [
        'date'                  => 'date',
        'approved_at'           => 'datetime',
        'requested_work_hours'  => 'decimal:2',
        'approved_work_hours'   => 'decimal:2',
        'approved_short_hours'  => 'decimal:2',
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

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}