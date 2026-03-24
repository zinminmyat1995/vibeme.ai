<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeProfileAllowance extends Model
{
    protected $fillable = [
        'employee_payroll_profile_id',
        'payroll_allowance_id',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(EmployeePayrollProfile::class, 'employee_payroll_profile_id');
    }

    public function allowance(): BelongsTo
    {
        return $this->belongsTo(PayrollAllowance::class, 'payroll_allowance_id');
    }
}