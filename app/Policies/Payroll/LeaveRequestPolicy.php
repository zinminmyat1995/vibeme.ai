<?php

namespace App\Policies\Payroll;

use App\Models\LeaveRequest;
use App\Models\User;

class LeaveRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin', 'management', 'member']);
    }

    public function view(User $user, LeaveRequest $leaveRequest): bool
    {
        // Member can only view own
        if ($user->hasRole('member')) {
            return $leaveRequest->user_id === $user->id;
        }

        // Management can only view own country
        if ($user->hasRole('management')) {
            return $leaveRequest->user->country_id === $user->country_id;
        }

        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function create(User $user): bool
    {
        // All roles can request leave
        return $user->hasAnyRole(['hr', 'admin', 'management', 'member']);
    }

    public function approve(User $user, LeaveRequest $leaveRequest): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function reject(User $user, LeaveRequest $leaveRequest): bool
    {
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function delete(User $user, LeaveRequest $leaveRequest): bool
    {
        // Only pending requests can be deleted by owner or HR
        if ($leaveRequest->status !== 'pending') return false;

        return $user->hasRole('hr') || $leaveRequest->user_id === $user->id;
    }
}