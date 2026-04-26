<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'payroll_cutoff_day',
        'lunch_start',
        'lunch_end',
        'late_alert_threshold',    // ← ထည့်
        'late_alert_enabled',      // ← ထည့်
        'absent_alert_threshold',  // ← ထည့်
        'absent_alert_enabled',  
    ];

    protected $casts = [
        'late_deduction_rate'    => 'decimal:2',
        'bonus_during_probation' => 'boolean',
        'bonus_for_contract'     => 'boolean',
        'payroll_cutoff_day'     => 'integer',
        'late_alert_enabled'     => 'boolean',   // ← ထည့်
        'absent_alert_enabled'   => 'boolean',   // ← ထည့်
        'late_alert_threshold'   => 'integer',   // ← ထည့်
        'absent_alert_threshold' => 'integer',   // ← ထည့်
    ];

    // ── Belongs To ────────────────────────────────────────────────────────────

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(PayrollBank::class, 'bank_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(PayrollCurrency::class, 'currency_id');
    }

    // ── Has Many ──────────────────────────────────────────────────────────────

    public function allowances(): HasMany
    {
        return $this->hasMany(SalaryAllowance::class);
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(SalaryDeduction::class);
    }

    public function taxBrackets(): HasMany
    {
        return $this->hasMany(TaxBracket::class);
    }

    // ── Has One ───────────────────────────────────────────────────────────────

    public function socialSecurityRule(): HasOne
    {
        return $this->hasOne(SocialSecurityRule::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
     */
    public function getPayrollPeriod(int $year, int $month): array
    {
        $cutoff  = $this->payroll_cutoff_day ?? 25;
        $lastDay = \Carbon\Carbon::create($year, $month, 1)->daysInMonth;
        $effectiveCutoff = min($cutoff, $lastDay);

        if ($cutoff >= $lastDay) {
            $start = \Carbon\Carbon::create($year, $month, 1)->startOfDay();
            $end   = \Carbon\Carbon::create($year, $month, $effectiveCutoff)->endOfDay();
        } else {
            $prevMonth   = \Carbon\Carbon::create($year, $month, 1)->subMonth();
            $prevLastDay = $prevMonth->daysInMonth;
            $prevCutoff  = min($cutoff, $prevLastDay);
            $start = \Carbon\Carbon::create($prevMonth->year, $prevMonth->month, $prevCutoff + 1)->startOfDay();
            $end   = \Carbon\Carbon::create($year, $month, $effectiveCutoff)->endOfDay();
        }

        return ['start' => $start, 'end' => $end];
    }
}