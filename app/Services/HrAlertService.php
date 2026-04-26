<?php
namespace App\Services;

use App\Models\HrAlert;
use App\Models\SalaryRule;
use App\Models\User;
use App\Models\AttendanceRecord;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HrAlertService
{
    private string $model = 'claude-sonnet-4-20250514';

    // ═══════════════════════════════════════════════════════════
    //  MAIN — run daily check for all countries
    // ═══════════════════════════════════════════════════════════
    public function runDailyCheck(): array
    {
        $now     = Carbon::now();
        $month   = $now->month;
        $year    = $now->year;
        $results = ['late' => 0, 'absent' => 0, 'errors' => 0];

        // Get all salary rules (one per country)
        $rules = SalaryRule::with('country')->get();

        foreach ($rules as $rule) {
            try {
                if ($rule->late_alert_enabled) {
                    $count = $this->checkLateAlerts($rule, $month, $year);
                    $results['late'] += $count;
                }
                if ($rule->absent_alert_enabled) {
                    $count = $this->checkAbsentAlerts($rule, $now);
                    $results['absent'] += $count;
                }
            } catch (\Exception $e) {
                Log::error('HrAlertService error', ['country_id' => $rule->country_id, 'error' => $e->getMessage()]);
                $results['errors']++;
            }
        }

        return $results;
    }

    // ═══════════════════════════════════════════════════════════
    //  LATE ALERT — X times late this month
    // ═══════════════════════════════════════════════════════════
    private function checkLateAlerts(SalaryRule $rule, int $month, int $year): int
    {
        $threshold = $rule->late_alert_threshold ?? 3;
        $countryId = $rule->country_id;
        $created   = 0;

        // Get all employees in country
        $employees = User::where('country_id', $countryId)
            ->where('is_active', 1)
            ->get();

        foreach ($employees as $emp) {
            $lateCount = AttendanceRecord::where('user_id', $emp->id)
                ->where('status', 'late')
                ->whereMonth('date', $month)
                ->whereYear('date', $year)
                ->count();

            if ($lateCount < $threshold) continue;

            // Skip if alert already exists this month
            $exists = HrAlert::where('user_id', $emp->id)
                ->where('type', 'late')
                ->where('alert_month', $month)
                ->where('alert_year', $year)
                ->exists();

            if ($exists) continue;

            // Generate letter + create alert
            $letter = $this->generateWarningLetter($emp, 'late', $lateCount, $threshold, $month, $year);

            $alert = HrAlert::create([
                'country_id'    => $countryId,
                'user_id'       => $emp->id,
                'type'          => 'late',
                'trigger_count' => $lateCount,
                'letter_draft'  => $letter,
                'status'        => 'pending',
                'alert_month'   => $month,
                'alert_year'    => $year,
            ]);

            $this->notifyHR($alert, $emp, 'late', $lateCount);
            $created++;
        }

        return $created;
    }

    // ═══════════════════════════════════════════════════════════
    //  ABSENT ALERT — X consecutive days absent
    // ═══════════════════════════════════════════════════════════
private function checkAbsentAlerts(SalaryRule $rule, Carbon $now): int
{
    $threshold = $rule->absent_alert_threshold ?? 2;
    $countryId = $rule->country_id;
    $created   = 0;
    $month     = $now->month;
    $year      = $now->year;
    $start     = Carbon::create($year, $month, 1)->startOfDay();
    $end       = $now->copy()->subDay()->endOfDay(); // up to yesterday

    $employees = User::where('country_id', $countryId)
        ->where('is_active', 1)
        ->get();

    foreach ($employees as $emp) {
        $absentCount = $this->countAbsentDays($emp, $countryId, $start, $end);

        if ($absentCount < $threshold) continue;

        $exists = HrAlert::where('user_id', $emp->id)
            ->where('type', 'absent')
            ->where('alert_month', $month)
            ->where('alert_year', $year)
            ->exists();

        if ($exists) continue;

        $letter = $this->generateWarningLetter($emp, 'absent', $absentCount, $threshold, $month, $year);

        $alert = HrAlert::create([
            'country_id'    => $countryId,
            'user_id'       => $emp->id,
            'type'          => 'absent',
            'trigger_count' => $absentCount,
            'letter_draft'  => $letter,
            'status'        => 'pending',
            'alert_month'   => $month,
            'alert_year'    => $year,
        ]);

        $this->notifyHR($alert, $emp, 'absent', $absentCount);
        $created++;
    }

    return $created;
}

private function countAbsentDays(User $emp, int $countryId, Carbon $start, Carbon $end): int
{
    $absentCount = 0;
    $check = $start->copy();

    // Get approved leave dates for this period (batch query)
    $leaves = \App\Models\LeaveRequest::where('user_id', $emp->id)
        ->where('status', 'approved')
        ->where('start_date', '<=', $end->toDateString())
        ->where('end_date',   '>=', $start->toDateString())
        ->get();

    // Get public holidays for this period (batch query)
    $holidays = \App\Models\PublicHoliday::where('country_id', $countryId)
        ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
        ->pluck('date')
        ->map(fn($d) => Carbon::parse($d)->toDateString())
        ->toArray();

    // Get all attendance records for this period (batch query)
    $records = AttendanceRecord::where('user_id', $emp->id)
        ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
        ->get()
        ->keyBy(fn($r) => Carbon::parse($r->date)->toDateString());

    while ($check <= $end) {
        $dateStr = $check->toDateString();

        // 1. Skip weekends
        if ($check->isWeekend()) {
            $check->addDay();
            continue;
        }

        // 2. Skip public holidays
        if (in_array($dateStr, $holidays)) {
            $check->addDay();
            continue;
        }

        // 3. Skip approved leave days
        $onLeave = $leaves->first(fn($l) =>
            $dateStr >= Carbon::parse($l->start_date)->toDateString() &&
            $dateStr <= Carbon::parse($l->end_date)->toDateString()
        );
        if ($onLeave) {
            $check->addDay();
            continue;
        }

        // 4. Check attendance record
        $record = $records->get($dateStr);
        if ($record && in_array($record->status, ['present', 'late'])) {
            // Present or late = not absent
            $check->addDay();
            continue;
        }

        // No record (and not weekend/holiday/leave) = absent
        $absentCount++;
        $check->addDay();
    }

    return $absentCount;
}

    // Count consecutive absent working days up to today
    private function getConsecutiveAbsentDays(int $userId, Carbon $now, int $threshold): int
    {
        $consecutive = 0;
        $check = $now->copy()->subDay();

        for ($i = 0; $i < ($threshold + 5); $i++) {
            // Skip weekends
            if ($check->isWeekend()) { $check->subDay(); continue; }

            $record = AttendanceRecord::where('user_id', $userId)
                ->whereDate('date', $check->toDateString())
                ->first();

            // Skip approved leave days — not absent
            $onLeave = \App\Models\LeaveRequest::where('user_id', $userId)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $check->toDateString())
                ->whereDate('end_date',   '>=', $check->toDateString())
                ->exists();

            if ($onLeave) { $check->subDay(); continue; }

            if ($record && $record->status === 'absent') {
                $consecutive++;
            } elseif ($record && in_array($record->status, ['present','late'])) {
                break; // Present/Late = streak broken
            }
            // No record + not on leave + not weekend = skip (unrecorded, not absent)

            $check->subDay();
        }

        return $consecutive;
    }

    // ═══════════════════════════════════════════════════════════
    //  AI Warning Letter Generation
    // ═══════════════════════════════════════════════════════════
    private function generateWarningLetter(User $emp, string $type, int $count, int $threshold, int $month, int $year): string
    {
        $monthName   = Carbon::create($year, $month)->format('F Y');
        $countryName = $emp->country?->name ?? 'Cambodia';
        $company     = "Brycen {$countryName}";
        $date        = Carbon::now()->format('d F Y');

        $typeDesc = $type === 'late'
            ? "late arrivals ({$count} times this month, threshold: {$threshold})"
            : "consecutive absent days ({$count} days, threshold: {$threshold})";


        $empName       = $emp->name;
        $empDepartment = $emp->department ?? 'N/A';
        $empPosition   = $emp->position   ?? 'N/A';

        $prompt = <<<PROMPT
Write a professional HR warning letter for the following situation.

Company: {$company}
Date: {$date}
Employee: {$empName}
Department: {$empDepartment}
Position: {$empPosition}
Issue: {$typeDesc} in {$monthName}

Requirements:
- Maximum 2 short paragraphs, 5-6 sentences total
- Paragraph 1: State the violation with specific numbers
- Paragraph 2: Expectation + consequence if not improved
- Professional but direct and concise
- Do NOT include signature lines, greetings, or "Dear [name]" — HR will add those
- Plain text only, absolutely no markdown, no asterisks, no bold formatting

Write the letter body only:
PROMPT;

        try {
            $response = Http::withHeaders([
                'x-api-key'         => config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
                'model'      => $this->model,
                'max_tokens' => 512,
                'messages'   => [['role' => 'user', 'content' => $prompt]],
            ]);

            if ($response->successful()) {
                $text = $response->json()['content'][0]['text'] ?? '';
                if ($text) return $text;
            }
        } catch (\Exception $e) {
            Log::error('HrAlertService: letter generation failed', ['error' => $e->getMessage()]);
        }

        // Fallback
        return "Dear {$emp->name},\n\nThis letter serves as a formal warning regarding your {$typeDesc} in {$monthName}. This falls below the company's attendance standards.\n\nWe expect immediate improvement. Continued violations may result in further disciplinary action.\n\nPlease treat this matter seriously.";
    }

    // ═══════════════════════════════════════════════════════════
    //  Notify HR users in same country
    // ═══════════════════════════════════════════════════════════
    private function notifyHR(HrAlert $alert, User $employee, string $type, int $count): void
    {
        $hrUsers = User::where('country_id', $employee->country_id)
            ->whereHas('role', fn($q) => $q->whereIn('name', ['hr', 'admin']))
            ->get();

        $typeLabel = $type === 'late' ? "late {$count}x this month" : "{$count} consecutive absent days";
        $title     = '⚠️ Attendance Alert — ' . $employee->name;
        $body      = "{$employee->name} has {$typeLabel}. Warning letter draft ready for review.";

        foreach ($hrUsers as $hr) {
            Notification::send(
                userId: $hr->id,
                type:   'system',
                title:  $title,
                body:   $body,
                url:    '/hr-alerts',
                data:   ['alert_id' => $alert->id, 'employee_id' => $employee->id],
            );
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  HR Actions — Send / Dismiss
    // ═══════════════════════════════════════════════════════════
    public function sendWarning(HrAlert $alert, User $actionedBy, string $finalLetter): void
    {
        $alert->update([
            'status'        => 'sent',
            'letter_draft'  => $finalLetter,
            'actioned_by'   => $actionedBy->id,
            'actioned_at'   => now(),
        ]);

        // Notify employee
        Notification::send(
            userId: $alert->user_id,
            type:   'system',
            title:  '⚠️ Warning Letter Issued',
            body:   'HR has issued a formal warning regarding your attendance. Please check with your HR department.',
            url:    '/dashboard',
            data:   ['alert_id' => $alert->id, 'type' => 'warning'],
        );

        Log::info('HrAlert: warning sent', ['alert_id' => $alert->id, 'user_id' => $alert->user_id]);
    }

    public function dismiss(HrAlert $alert, User $actionedBy): void
    {
        $alert->update([
            'status'      => 'dismissed',
            'actioned_by' => $actionedBy->id,
            'actioned_at' => now(),
        ]);
    }
}