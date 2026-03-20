<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeRequestSegment extends Model
{
    protected $fillable = [
        'overtime_request_id',
        'ot_policy_id',
        'segment_date',   // ← ဘယ်ရက် segment ဆိုတာ
        'start_time',
        'end_time',
        'hours',
        'hours_approved',
    ];

    protected $casts = [
        'segment_date'   => 'date',
        'hours'          => 'decimal:2',
        'hours_approved' => 'decimal:2',
    ];

    public function overtimeRequest(): BelongsTo
    {
        return $this->belongsTo(OvertimeRequest::class);
    }

    public function overtimePolicy(): BelongsTo
    {
        return $this->belongsTo(OvertimePolicy::class, 'ot_policy_id');
    }
}