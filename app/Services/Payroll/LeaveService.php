<?php

namespace App\Services\Payroll;

use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;

class LeaveService
{
    public function initializeLeaveBalance(User $user, int $year): void
    {
        $countryId = $user->employeePayrollProfile?->country_id;
        if (!$countryId) return;

        $policies = LeavePolicy::where('country_id', $countryId)->get();

        foreach ($policies as $policy) {
            LeaveBalance::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'leave_type' => $policy->leave_type,
                    'year' => $year,
                ],
                [
                    'entitled_days' => $policy->days_per_year,
                    'used_days' => 0,
                    'remaining_days' => $policy->days_per_year,
                ]
            );
        }
    }

    public function checkBalance(int $userId, string $leaveType, float $requestedDays, int $year): bool
    {
        $balance = LeaveBalance::where('user_id', $userId)
            ->where('leave_type', $leaveType)
            ->where('year', $year)
            ->first();

        if (!$balance) return false;

        return $balance->remaining_days >= $requestedDays;
    }

    public function calculateLeaveDays(Carbon $startDate, Carbon $endDate): float
    {
        $days = 0;
        $current = $startDate->copy();

        while ($current <= $endDate) {
            if (!$current->isWeekend()) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }

    public function getLeaveBalanceSummary(int $userId, int $year): array
    {
        return LeaveBalance::where('user_id', $userId)
            ->where('year', $year)
            ->get()
            ->map(fn($b) => [
                'leave_type' => $b->leave_type,
                'entitled_days' => $b->entitled_days,
                'used_days' => $b->used_days,
                'remaining_days' => $b->remaining_days,
            ])
            ->toArray();
    }
}