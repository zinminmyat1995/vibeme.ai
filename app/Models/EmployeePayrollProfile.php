<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeePayrollProfile extends Model
{
    protected $fillable = [
        'user_id',
        'country_id',
        'salary_rule_id',
        'base_salary',
        'bank_name',
        'bank_account_number',
        'bank_account_holder_name',
        'bank_branch',
        'effective_date',
        'is_active',
    ];

    protected $casts = [
        'base_salary'   => 'decimal:2',
        'effective_date' => 'date',
        'is_active'     => 'boolean',
    ];

    // bank_account_number ကို hidden မထားတော့ — controller မှာ ထိန်းမယ်
    // (frontend table မှာ masked ပြ၊ edit modal မှာ full ပြ)

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function salaryRule(): BelongsTo
    {
        return $this->belongsTo(SalaryRule::class);
    }

    /**
     * Employee ရဲ့ selected allowances (per-profile)
     * SalaryCalculationService မှာ ဒါကို သုံးရမယ်
     */
    public function selectedAllowances(): BelongsToMany
    {
        return $this->belongsToMany(
            PayrollAllowance::class,
            'employee_profile_allowances',
            'employee_payroll_profile_id',
            'payroll_allowance_id'
        );
    }

    /**
     * Junction records (sync လုပ်ဖို့)
     */
    public function profileAllowances(): HasMany
    {
        return $this->hasMany(EmployeeProfileAllowance::class, 'employee_payroll_profile_id');
    }
}