<?php

namespace App\Policies\Payroll;

use App\Models\SalaryRule;
use App\Models\User;

class PayrollSetupPolicy
{
    // Country Setup
    public function manageCountry(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    // Public Holidays
    public function manageHolidays(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    // Salary Rules
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function update(User $user, SalaryRule $salaryRule): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function delete(User $user, SalaryRule $salaryRule): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    // Leave Policy Setup
    public function manageLeavePolicy(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    // Employee Payroll Profile
    public function manageEmployeeProfile(User $user): bool
    {
        return $user->hasRole('hr');
    }

    // Bank Export
    public function exportBank(User $user): bool
    {
        return $user->hasRole('hr');
    }
}