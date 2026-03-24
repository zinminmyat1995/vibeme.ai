<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    protected $fillable = [
        'user_id',
        'leave_type',
        'day_type',
        'start_date',
        'end_date',
        'total_days',
        'is_paid',       // ← NEW: policy ကနေ inherit, Absent = false
        'status',
        'note',
        'approver_id',
        'approved_by',
        'document_path',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'total_days' => 'decimal:1',
        'is_paid'    => 'boolean', // ← NEW
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}