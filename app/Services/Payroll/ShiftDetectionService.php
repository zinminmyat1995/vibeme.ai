<?php

namespace App\Services\Payroll;

use App\Models\OvertimePolicy;
use App\Models\PublicHoliday;
use App\Models\SalaryRule;

class ShiftDetectionService
{
    /**
     * Main entry point
     * end < start → overnight (auto next-day handling)
     */
    public function detectFull(string $date, string $startTime, string $endTime, int $countryId): array
    {
        $salaryRule    = SalaryRule::where('country_id', $countryId)->first();
        $dayShiftStart = $this->toMinutes($salaryRule?->day_shift_start ?? '08:00:00');
        $dayShiftEnd   = $this->toMinutes($salaryRule?->day_shift_end   ?? '18:00:00');

        $policies = OvertimePolicy::where('country_id', $countryId)
            ->where('is_active', true)
            ->get();

        $otStart     = $this->toMinutes($startTime);
        $otEnd       = $this->toMinutes($endTime);
        $isOvernight = $otEnd <= $otStart;
        if ($isOvernight) $otEnd += 1440;

        $nextDate = date('Y-m-d', strtotime($date . ' +1 day'));

        $dayType1 = $this->getDayType($date,     $countryId);
        $dayType2 = $this->getDayType($nextDate,  $countryId);

        $boundaries = array_unique(array_filter([
            $otStart,
            $dayShiftStart,
            $dayShiftEnd,
            1440,
            $dayShiftStart + 1440,
            $dayShiftEnd   + 1440,
            $otEnd,
        ], fn($b) => $b >= $otStart && $b <= $otEnd));
        sort($boundaries);

        $segments = [];
        for ($i = 0; $i < count($boundaries) - 1; $i++) {
            $segStart = $boundaries[$i];
            $segEnd   = $boundaries[$i + 1];
            if ($segEnd <= $segStart) continue;

            $mid       = ($segStart + $segEnd) / 2;
            $isDay2    = $mid >= 1440;
            $segDate   = $isDay2 ? $nextDate : $date;
            $dayType   = $isDay2 ? $dayType2 : $dayType1;
            $shiftType = $this->getShiftType((int)$mid, $dayShiftStart, $dayShiftEnd);
            $policy    = $this->matchPolicy($policies, $dayType, $shiftType);

            $segments[] = [
                'ot_policy_id' => $policy?->id,
                'policy'       => $policy,
                'date'         => $segDate,
                'start_time'   => $this->fromMinutes($segStart % 1440),
                'end_time'     => $this->fromMinutes($segEnd   % 1440),
                'hours'        => $this->minutesToHours($segEnd - $segStart),
                'day_type'     => $dayType,
                'shift_type'   => $shiftType,
            ];
        }

        return $this->mergeSegments($segments);
    }

    // Backward compat alias
    public function detect(string $date, string $startTime, string $endTime, int $countryId): array
    {
        return $this->detectFull($date, $startTime, $endTime, $countryId);
    }

    // weekday | weekend | public_holiday
    public function getDayType(string $date, int $countryId): string
    {
        $isHoliday = PublicHoliday::where('country_id', $countryId)
            ->whereDate('date', $date)
            ->exists();
        if ($isHoliday) return 'public_holiday';

        $dow = (int)date('N', strtotime($date));
        return in_array($dow, [6, 7]) ? 'weekend' : 'weekday';
    }

    // day | night
    public function getShiftType(int $minutePoint, int $dayShiftStart, int $dayShiftEnd): string
    {
        $m = $minutePoint % 1440;
        if ($dayShiftStart < $dayShiftEnd) {
            return ($m >= $dayShiftStart && $m < $dayShiftEnd) ? 'day' : 'night';
        }
        return ($m >= $dayShiftStart || $m < $dayShiftEnd) ? 'day' : 'night';
    }

    // Exact match: day_type + shift_type
    // Priority: exact > shift=both > fallback
    private function matchPolicy($policies, string $dayType, string $shiftType): ?OvertimePolicy
    {
        foreach ($policies as $p) {
            if ($p->day_type === $dayType && $p->shift_type === $shiftType) return $p;
        }
        foreach ($policies as $p) {
            if ($p->day_type === $dayType && $p->shift_type === 'both') return $p;
        }
        if ($dayType === 'public_holiday') {
            foreach ($policies as $p) {
                if ($p->day_type === 'public_holiday') return $p;
            }
        }
        return $policies->first();
    }

    private function mergeSegments(array $segments): array
    {
        $merged = [];
        foreach ($segments as $seg) {
            $last = end($merged);
            if ($last && $last['ot_policy_id'] === $seg['ot_policy_id'] && $last['date'] === $seg['date']) {
                $merged[count($merged) - 1]['end_time'] = $seg['end_time'];
                $merged[count($merged) - 1]['hours']   = round($merged[count($merged) - 1]['hours'] + $seg['hours'], 2);
            } else {
                $merged[] = $seg;
            }
        }
        return $merged;
    }

    private function toMinutes(string $time): int
    {
        $parts = explode(':', $time);
        return (int)$parts[0] * 60 + (int)($parts[1] ?? 0);
    }

    private function fromMinutes(int $minutes): string
    {
        $m = ((int)$minutes) % 1440;
        if ($m < 0) $m += 1440;
        return sprintf('%02d:%02d', intdiv($m, 60), $m % 60);
    }

    private function minutesToHours(int $minutes): float
    {
        return round($minutes / 60, 2);
    }
}