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
        // Member can only view own
        if ($user->hasRole('member')) {
            return $overtimeRequest->user_id === $user->id;
        }

        // Management can only view own country
        if ($user->hasRole('management')) {
            return $overtimeRequest->user->country_id === $user->country_id;
        }

        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function create(User $user): bool
    {
        // All roles can request overtime
        return $user->hasAnyRole(['hr', 'admin', 'management', 'member']);
    }

    public function approve(User $user, OvertimeRequest $overtimeRequest): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function reject(User $user, OvertimeRequest $overtimeRequest): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function delete(User $user, OvertimeRequest $overtimeRequest): bool
    {
        if ($overtimeRequest->status !== 'pending') return false;

        return $user->hasRole('hr') || $overtimeRequest->user_id === $user->id;
    }
}