<?php

namespace App\Policies\Payroll;

use App\Models\PayrollRecord;
use App\Models\User;

class PayrollPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin', 'management', 'member']);
    }

    public function view(User $user, PayrollRecord $payrollRecord): bool
    {
        // Member can only view own payslip
        if ($user->hasRole('member')) {
            return $payrollRecord->user_id === $user->id;
        }

        // Management can only view own country
        if ($user->hasRole('management')) {
            return $payrollRecord->user->country_id === $user->country_id;
        }

        // HR & Admin can view all
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('hr');
    }

    public function update(User $user, PayrollRecord $payrollRecord): bool
    {
        // Only HR can update & only draft records
        return $user->hasRole('hr') && $payrollRecord->status === 'draft';
    }

    public function delete(User $user, PayrollRecord $payrollRecord): bool
    {
        return $user->hasRole('hr') && $payrollRecord->status === 'draft';
    }

    public function export(User $user): bool
    {
        // Only HR can export bank transfer report
        return $user->hasRole('hr');
    }

    public function approve(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }
}