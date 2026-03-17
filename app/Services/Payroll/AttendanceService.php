<?php

namespace App\Services\Payroll;

use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceService
{
    public function getMonthlyCalendar(int $userId, int $month, int $year): Collection
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $records = AttendanceRecord::where('user_id', $userId)
            ->whereBetween('date', [$startDate, $endDate])
            ->get()
            ->keyBy(fn($r) => Carbon::parse($r->date)->toDateString());

        $calendar = collect();
        $current = $startDate->copy();

        while ($current <= $endDate) {
            $dateStr = $current->toDateString();
            $calendar->push([
                'date' => $dateStr,
                'day' => $current->day,
                'day_of_week' => $current->dayOfWeek,
                'is_weekend' => $current->isWeekend(),
                'record' => $records->get($dateStr),
            ]);
            $current->addDay();
        }

        return $calendar;
    }

    public function bulkImport(array $records, int $createdBy): array
    {
        $success = 0;
        $errors = [];

        foreach ($records as $index => $row) {
            try {
                AttendanceRecord::updateOrCreate(
                    ['user_id' => $row['user_id'], 'date' => $row['date']],
                    [
                        'status' => $row['status'] ?? 'present',
                        'check_in_time' => $row['check_in_time'] ?? null,
                        'check_out_time' => $row['check_out_time'] ?? null,
                        'work_hours_actual' => $row['work_hours_actual'] ?? 0,
                        'late_minutes' => $row['late_minutes'] ?? 0,
                        'note' => $row['note'] ?? null,
                        'created_by' => $createdBy,
                    ]
                );
                $success++;
            } catch (\Exception $e) {
                $errors[] = ['row' => $index + 1, 'error' => $e->getMessage()];
            }
        }

        return ['success' => $success, 'errors' => $errors];
    }

    public function getMonthlySummary(int $userId, int $month, int $year): array
    {
        $records = AttendanceRecord::where('user_id', $userId)
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        return [
            'present' => $records->where('status', 'present')->count(),
            'absent' => $records->where('status', 'absent')->count(),
            'late' => $records->where('status', 'late')->count(),
            'half_day' => $records->where('status', 'half_day')->count(),
            'total_late_minutes' => $records->sum('late_minutes'),
            'total_work_hours' => $records->sum('work_hours_actual'),
        ];
    }
}