<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'status',
        'check_in_time',
        'check_out_time',
        'work_hours_actual',
        'late_minutes',
        'note',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'work_hours_actual' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}