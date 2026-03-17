<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'base_salary' => 'decimal:2',
        'effective_date' => 'date',
        'is_active' => 'boolean',
    ];

    // bank info တွေ sensitive မို့ hidden
    protected $hidden = [
        'bank_account_number',
    ];

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
}