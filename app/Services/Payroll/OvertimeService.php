<?php

namespace App\Services\Payroll;

use App\Models\AttendanceRecord;
use App\Models\Country;
use App\Models\OvertimeRequest;
use App\Models\PublicHoliday;
use Carbon\Carbon;

class OvertimeService
{
    public function getOvertimeRate(int $countryId, Carbon $date): float
    {
        $country = Country::find($countryId);

        $isHoliday = PublicHoliday::where('country_id', $countryId)
            ->whereDate('date', $date)
            ->exists();

        if ($isHoliday) return $country->overtime_rate_holiday;
        if ($date->isWeekend()) return $country->overtime_rate_weekend;

        return $country->overtime_rate_weekday;
    }

    public function getMonthlySummary(int $userId, int $month, int $year): array
    {
        $requests = OvertimeRequest::where('user_id', $userId)
            ->whereMonth('start_date', $month)
            ->whereYear('start_date', $year)
            ->get();

        return [
            'total_requested' => $requests->sum('hours_requested'),
            'total_approved' => $requests->where('status', 'approved')->sum('hours_approved'),
            'pending_count' => $requests->where('status', 'pending')->count(),
            'approved_count' => $requests->where('status', 'approved')->count(),
            'rejected_count' => $requests->where('status', 'rejected')->count(),
        ];
    }
}