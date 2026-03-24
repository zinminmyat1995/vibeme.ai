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
        'bonus_for_contract',
        'bank_id',
        'working_hours_per_day',
        'working_days_per_week',
        'day_shift_start',
        'day_shift_end',
        'work_start',
        'work_end',
        'overtime_base',
        'late_deduction_unit',
        'late_deduction_rate',
        'currency_id',
        'payroll_cutoff_day',   // ← NEW: လစာတွက်မဲ့ ရက် (default 25)
    ];

    protected $casts = [
        'late_deduction_rate'    => 'decimal:2',
        'bonus_during_probation' => 'boolean',
        'bonus_for_contract'     => 'boolean',
        'payroll_cutoff_day'     => 'integer', // ← NEW
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

    public function isDayShift(string $time): bool
    {
        if (!$this->day_shift_start || !$this->day_shift_end) return true;
        $t     = strtotime($time);
        $start = strtotime($this->day_shift_start);
        $end   = strtotime($this->day_shift_end);
        if ($start < $end) return $t >= $start && $t < $end;
        return $t >= $start || $t < $end;
    }

    /**
     * လစာ period ရဲ့ start/end date တွက်ပေး
     * cutoff_day=25 ဆိုရင်: prev_month_26 → this_month_25
     * cutoff_day=31 ဆိုရင်: this_month_1  → this_month_last
     */
    public function getPayrollPeriod(int $year, int $month): array
    {
        $cutoff = $this->payroll_cutoff_day ?? 25;

        // month ရဲ့ actual last day (Feb=28/29, Apr=30 etc.)
        $lastDay = \Carbon\Carbon::create($year, $month, 1)->daysInMonth;
        $effectiveCutoff = min($cutoff, $lastDay);

        if ($cutoff >= $lastDay) {
            // month-end mode: 1st → last day
            $start = \Carbon\Carbon::create($year, $month, 1)->startOfDay();
            $end   = \Carbon\Carbon::create($year, $month, $effectiveCutoff)->endOfDay();
        } else {
            // mid-month mode: prev_month_(cutoff+1) → this_month_cutoff
            $prevMonth = \Carbon\Carbon::create($year, $month, 1)->subMonth();
            $prevLastDay = $prevMonth->daysInMonth;
            $prevCutoff  = min($cutoff, $prevLastDay);

            $start = \Carbon\Carbon::create($prevMonth->year, $prevMonth->month, $prevCutoff + 1)->startOfDay();
            $end   = \Carbon\Carbon::create($year, $month, $effectiveCutoff)->endOfDay();
        }

        return ['start' => $start, 'end' => $end];
    }
}