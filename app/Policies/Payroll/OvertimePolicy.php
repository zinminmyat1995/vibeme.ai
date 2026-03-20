<?php

namespace App\Policies\Payroll;

use App\Models\OvertimeRequest;
use App\Models\User;

class OvertimePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin', 'management', 'member']);
    }

    public function view(User $user, OvertimeRequest $overtimeRequest): bool
    {
        if ($user->hasRole('member')) {
            return $overtimeRequest->user_id === $user->id;
        }

        if ($user->hasRole('management')) {
            return $overtimeRequest->user->country_id === $user->country_id;
        }

        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin', 'management', 'member']);
    }

    /**
     * Approve: assigned approver သာ approve လုပ်နိုင်
     * (Leave Request logic နဲ့ consistent)
     */
    public function approve(User $user, OvertimeRequest $overtimeRequest): bool
    {
        // Admin → always
        if ($user->hasRole('admin')) return true;

        // Assigned approver → approve ခွင့်ရှိ
        if ($overtimeRequest->approver_id === $user->id) return true;

        // HR → same country requests
        if ($user->hasRole('hr')) {
            return $overtimeRequest->user->country_id === $user->country_id;
        }

        return false;
    }

    public function reject(User $user, OvertimeRequest $overtimeRequest): bool
    {
        return $this->approve($user, $overtimeRequest);
    }

    public function delete(User $user, OvertimeRequest $overtimeRequest): bool
    {
        if ($overtimeRequest->status !== 'pending') return false;

        return $user->hasRole('admin') || $overtimeRequest->user_id === $user->id;
    }
}