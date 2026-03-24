<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeavePolicy extends Model
{
    protected $fillable = [
        'country_id',
        'leave_type',
        'days_per_year',
        'is_paid',
        'carry_over_days',
        'applicable_gender',
        'requires_document',
        'allow_exceed_balance', // ← NEW
        'is_active',
    ];

    protected $casts = [
        'is_paid'              => 'boolean',
        'is_active'            => 'boolean',
        'requires_document'    => 'boolean',
        'allow_exceed_balance' => 'boolean', // ← NEW
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}