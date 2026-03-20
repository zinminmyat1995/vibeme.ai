<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OvertimePolicy extends Model
{
    protected $fillable = [
        'country_id',
        'title',
        'day_type',    // weekday | weekend | public_holiday
        'shift_type',  // day | night | both
        'rate_type',   // multiplier | flat
        'rate_value',
        'is_active',
    ];

    protected $casts = [
        'rate_value' => 'decimal:2',
        'is_active'  => 'boolean',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    // ── Helper: check if this policy matches given conditions ──
    public function matches(string $dayType, string $shiftType): bool
    {
        $dayMatch   = $this->day_type === $dayType;
        $shiftMatch = $this->shift_type === 'both' || $this->shift_type === $shiftType;
        return $dayMatch && $shiftMatch;
    }
}