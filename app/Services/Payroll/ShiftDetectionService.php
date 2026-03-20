<?php

namespace App\Services\Payroll;

use App\Models\OvertimePolicy;
use App\Models\PublicHoliday;
use App\Models\SalaryRule;
use Carbon\Carbon;

class ShiftDetectionService
{
    /**
     * Multi-day OT detection
     * e.g. start_date=2026-03-20 start_time=15:00
     *      end_date=2026-03-22   end_time=08:00
     */
    public function detectFull(
        string $startDate,
        string $startTime,
        string $endDate,
        string $endTime,
        int    $countryId
    ): array {
        $salaryRule    = SalaryRule::where('country_id', $countryId)->first();
        $dayShiftStart = $this->toMinutes($salaryRule?->day_shift_start ?? '08:00:00');
        $dayShiftEnd   = $this->toMinutes($salaryRule?->day_shift_end   ?? '18:00:00');

        $policies = OvertimePolicy::where('country_id', $countryId)
            ->where('is_active', true)
            ->get();

        // Build list of calendar dates in range
        $start  = Carbon::parse($startDate);
        $end    = Carbon::parse($endDate);
        $dates  = [];
        $cursor = $start->copy();
        while ($cursor <= $end) {
            $dates[] = $cursor->format('Y-m-d');
            $cursor->addDay();
        }

        $allSegments = [];

        foreach ($dates as $idx => $date) {
            $isFirst = $idx === 0;
            $isLast  = $idx === count($dates) - 1;
            $isSingle = count($dates) === 1;

            // Determine OT window for this day (minutes from midnight)
            if ($isSingle) {
                $otStart = $this->toMinutes($startTime);
                $otEnd   = $this->toMinutes($endTime);
                // same-day end < start → overnight within single record (edge case)
                if ($otEnd <= $otStart) $otEnd += 1440;
            } elseif ($isFirst) {
                $otStart = $this->toMinutes($startTime);
                $otEnd   = 1440; // until midnight
            } elseif ($isLast) {
                $otStart = 0;    // from midnight
                $otEnd   = $this->toMinutes($endTime);
                if ($otEnd === 0) $otEnd = 1440; // end_time = 00:00 → full midnight
            } else {
                // Middle days → full 24 hrs
                $otStart = 0;
                $otEnd   = 1440;
            }

            if ($otEnd <= $otStart) continue; // nothing to process

            $dayType = $this->getDayType($date, $countryId);

            // Boundaries within this day's OT window
            $boundaries = array_unique(array_filter(
                [$otStart, $dayShiftStart, $dayShiftEnd, $otEnd],
                fn($b) => $b >= $otStart && $b <= $otEnd
            ));
            sort($boundaries);

            $daySegments = [];
            for ($i = 0; $i < count($boundaries) - 1; $i++) {
                $segStart  = $boundaries[$i];
                $segEnd    = $boundaries[$i + 1];
                if ($segEnd <= $segStart) continue;

                $mid        = ($segStart + $segEnd) / 2;
                $shiftType  = $this->getShiftType((int)$mid, $dayShiftStart, $dayShiftEnd);
                $policy     = $this->matchPolicy($policies, $dayType, $shiftType);

                $daySegments[] = [
                    'ot_policy_id'  => $policy?->id,
                    'policy'        => $policy,
                    'segment_date'  => $date,
                    'start_time'    => $this->fromMinutes($segStart),
                    'end_time'      => $this->fromMinutes($segEnd % 1440),
                    'hours'         => $this->minutesToHours($segEnd - $segStart),
                    'day_type'      => $dayType,
                    'shift_type'    => $shiftType,
                ];
            }

            // Merge adjacent same-policy segments within same day
            $allSegments = array_merge($allSegments, $this->mergeSegments($daySegments));
        }

        return $allSegments;
    }

    // Backward compat alias (single date)
    public function detect(
        string $date,
        string $startTime,
        string $endTime,
        int    $countryId
    ): array {
        return $this->detectFull($date, $startTime, $date, $endTime, $countryId);
    }

    // ─────────────────────────────────────────────────────────
    //  weekday | weekend | public_holiday
    // ─────────────────────────────────────────────────────────
    public function getDayType(string $date, int $countryId): string
    {
        $isHoliday = PublicHoliday::where('country_id', $countryId)
            ->whereDate('date', $date)
            ->exists();
        if ($isHoliday) return 'public_holiday';

        $dow = (int) date('N', strtotime($date));
        return in_array($dow, [6, 7]) ? 'weekend' : 'weekday';
    }

    // ─────────────────────────────────────────────────────────
    //  day | night
    // ─────────────────────────────────────────────────────────
    public function getShiftType(int $minutePoint, int $dayShiftStart, int $dayShiftEnd): string
    {
        $m = $minutePoint % 1440;
        if ($dayShiftStart < $dayShiftEnd) {
            return ($m >= $dayShiftStart && $m < $dayShiftEnd) ? 'day' : 'night';
        }
        // Overnight day shift
        return ($m >= $dayShiftStart || $m < $dayShiftEnd) ? 'day' : 'night';
    }

    // ─────────────────────────────────────────────────────────
    //  Exact policy match: day_type + shift_type
    //  Priority: exact > shift=both > fallback
    // ─────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────
    //  Merge consecutive same-policy segments (same date)
    // ─────────────────────────────────────────────────────────
    private function mergeSegments(array $segments): array
    {
        $merged = [];
        foreach ($segments as $seg) {
            $last = end($merged);
            if ($last
                && $last['ot_policy_id'] === $seg['ot_policy_id']
                && $last['segment_date'] === $seg['segment_date']
            ) {
                $merged[count($merged) - 1]['end_time'] = $seg['end_time'];
                $merged[count($merged) - 1]['hours']    = round(
                    $merged[count($merged) - 1]['hours'] + $seg['hours'], 2
                );
            } else {
                $merged[] = $seg;
            }
        }
        return $merged;
    }

    // ─────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────
    private function toMinutes(string $time): int
    {
        $parts = explode(':', $time);
        return (int) $parts[0] * 60 + (int) ($parts[1] ?? 0);
    }

    private function fromMinutes(int $minutes): string
    {
        $m = ((int) $minutes) % 1440;
        if ($m < 0) $m += 1440;
        return sprintf('%02d:%02d', intdiv($m, 60), $m % 60);
    }

    private function minutesToHours(int $minutes): float
    {
        return round($minutes / 60, 2);
    }
}