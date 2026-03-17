<?php

namespace App\Policies\Payroll;

use App\Models\AttendanceRecord;
use App\Models\User;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['hr', 'admin', 'management', 'member']);
    }

    public function view(User $user, AttendanceRecord $record): bool
    {
        // Member can only view own
        if ($user->hasRole('member')) {
            return $record->user_id === $user->id;
        }

        // Management can only view own country
        if ($user->hasRole('management')) {
            return $record->user->country_id === $user->country_id;
        }

        // HR & Admin can view all
        return $user->hasAnyRole(['hr', 'admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('hr');
    }

    public function update(User $user, AttendanceRecord $record): bool
    {
        return $user->hasRole('hr');
    }

    public function delete(User $user, AttendanceRecord $record): bool
    {
        return $user->hasRole('hr');
    }
}