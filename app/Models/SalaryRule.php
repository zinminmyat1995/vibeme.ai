<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalaryRule extends Model
{
    protected $fillable = [
        'country_id',
        'pay_cycle',
        'probation_days',
        'bonus_during_probation',
        'bank_id',
        'working_hours_per_day',
        'working_days_per_week',
        'day_shift_start',          // ← အသစ်
        'day_shift_end',            // ← အသစ်
        'overtime_base',
        'late_deduction_unit',
        'late_deduction_rate',
        'currency_id',
    ];

    protected $casts = [
        'late_deduction_rate'    => 'decimal:2',
        'bonus_during_probation' => 'boolean',
        // time columns — string အနေနဲ့ ထိန်းမယ် (H:i format)
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function bank()
    {
        return $this->belongsTo(PayrollBank::class, 'bank_id');
    }

    public function currency()
    {
        return $this->belongsTo(PayrollCurrency::class, 'currency_id');
    }

    // ── Helper: night shift ဟုတ်မဟုတ် check ──
    // ပေးလိုက်တဲ့ time string (H:i) က day shift ထဲ ဝင်ရဲ့လားစစ်
    public function isDayShift(string $time): bool
    {
        if (!$this->day_shift_start || !$this->day_shift_end) return true;

        $t     = strtotime($time);
        $start = strtotime($this->day_shift_start);
        $end   = strtotime($this->day_shift_end);

        // Normal range (e.g. 08:00–18:00)
        if ($start < $end) {
            return $t >= $start && $t < $end;
        }

        // Overnight range (e.g. 22:00–06:00) — reverse check
        return $t >= $start || $t < $end;
    }
}