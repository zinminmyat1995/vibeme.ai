<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = [
        'name',
        'currency_code',
        'work_hours_per_day',
        'lunch_break_minutes',      // ← ထည့်
        'standard_start_time',      // ← ထည့်
        'work_days_per_week',
        'overtime_rate_weekday',
        'overtime_rate_weekend',
        'overtime_rate_holiday',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'work_hours_per_day' => 'decimal:2',
        'overtime_rate_weekday' => 'decimal:2',
        'overtime_rate_weekend' => 'decimal:2',
        'overtime_rate_holiday' => 'decimal:2',
    ];

    public function publicHolidays(): HasMany
    {
        return $this->hasMany(PublicHoliday::class);
    }

    public function salaryRules(): HasMany
    {
        return $this->hasMany(SalaryRule::class);
    }

    public function leavePolicies(): HasMany
    {
        return $this->hasMany(LeavePolicy::class);
    }

    public function payrollPeriods(): HasMany
    {
        return $this->hasMany(PayrollPeriod::class);
    }

    public function employeePayrollProfiles(): HasMany
    {
        return $this->hasMany(EmployeePayrollProfile::class);
    }
}