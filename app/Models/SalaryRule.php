<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalaryRule extends Model
{
    protected $fillable = [
        'country_id',
        'pay_cycle',
        'probation_days',
        'bank_id',
        'working_hours_per_day',
        'working_days_per_week',
        'overtime_base',
        'late_deduction_unit',
        'late_deduction_rate',
        'currency_id',
    ];

    protected $casts = [
        'late_deduction_rate' => 'decimal:2',
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
}