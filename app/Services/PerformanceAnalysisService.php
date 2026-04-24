<?php
namespace App\Services;

use App\Models\User;
use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PerformanceAnalysisService
{
    private string $model = 'claude-sonnet-4-20250514';

    // ═══════════════════════════════════════════════════════════════
    //  STEP 1 — Get metrics for ALL employees (DB only, no AI)
    // ═══════════════════════════════════════════════════════════════
    public function getMetrics(int $countryId, int $year, array $filters = []): array
    {
        $start = Carbon::create($year, 1, 1)->startOfDay();
        $end   = Carbon::create($year, 12, 31)->endOfDay();

        // Current year → only up to today
        $effectiveEnd = ($end->isFuture() || $end->isToday())
            ? Carbon::today()
            : $end;

        // Total working days (Mon-Fri) Jan 1 → effectiveEnd
        $workingDays = 0;
        $cur = $start->copy();
        while ($cur <= $effectiveEnd) {
            if (!$cur->isWeekend()) $workingDays++;
            $cur->addDay();
        }

        $periodLabel = $start->format('d M Y') . ' – ' . $effectiveEnd->format('d M Y');

        $employees = User::where('country_id', $countryId)
            ->where('is_active', 1)
            ->get(['id', 'name', 'avatar_url', 'department']);

        $results = [];

        foreach ($employees as $emp) {
            $att = AttendanceRecord::where('user_id', $emp->id)
                ->whereYear('date', $year)
                ->whereDate('date', '<=', $effectiveEnd)
                ->get();

            $lateDays         = $att->where('status', 'late')->count();
            $absentDays       = $att->where('status', 'absent')->count();
            $presentDays      = $att->whereIn('status', ['present', 'late'])->count();
            $recordedDays     = $att->count(); // total days with any record
            $totalLateMinutes = (int) $att->sum('late_minutes');

            $leaves = LeaveRequest::where('user_id', $emp->id)
                ->where('status', 'approved')
                ->whereYear('start_date', $year)
                ->get();

            $leaveDays  = (float) $leaves->sum('total_days');
            $leaveCount = $leaves->count();

            $ot = OvertimeRequest::where('user_id', $emp->id)
                ->where('status', 'approved')
                ->whereYear('start_date', $year)
                ->get();

            $otHours = round((float) $ot->sum('hours_approved'), 1);
            $otCount = $ot->count();

            // Attendance rate = present / recorded (only count days that have records)
            // This avoids penalizing employees whose records haven't been entered yet
            $attendanceRate = $workingDays > 0
                ? round(($presentDays / $workingDays) * 100, 1)
                : 0;

            $results[] = [
                'id'                 => $emp->id,
                'name'               => $emp->name,
                'avatar_url'         => $emp->avatar_url,
                'department'         => $emp->department,
                'working_days'       => $workingDays,
                'recorded_days'      => $recordedDays,
                'present_days'       => $presentDays,
                'attendance_rate'    => $attendanceRate,
                'period_label'       => $periodLabel,
                'absent_days'        => $absentDays,
                'late_days'          => $lateDays,
                'total_late_minutes' => $totalLateMinutes,
                'leave_days'         => $leaveDays,
                'leave_count'        => $leaveCount,
                'ot_hours'           => $otHours,
                'ot_count'           => $otCount,
            ];
        }

        // Country averages
        $count    = count($results);
        $averages = $count > 0 ? [
            'avg_late_days'       => round(array_sum(array_column($results, 'late_days'))       / $count, 1),
            'avg_absent_days'     => round(array_sum(array_column($results, 'absent_days'))     / $count, 1),
            'avg_leave_days'      => round(array_sum(array_column($results, 'leave_days'))      / $count, 1),
            'avg_ot_hours'        => round(array_sum(array_column($results, 'ot_hours'))        / $count, 1),
            'avg_attendance_rate' => round(array_sum(array_column($results, 'attendance_rate')) / $count, 1),
            'total_employees'     => $count,
            'working_days'        => $workingDays,
            'period_label'        => $periodLabel,
        ] : [];

        if (!empty($filters)) {
            $results = $this->sortByFilters($results, $filters);
        }

        return [
            'employees'  => $results,
            'averages'   => $averages,
            'year'       => $year,
            'country_id' => $countryId,
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    //  STEP 2 — SSE: Analyze all employees one by one with AI
    // ═══════════════════════════════════════════════════════════════
    public function analyzeAllSSE(int $countryId, int $year, callable $emit): void
    {
        $data      = $this->getMetrics($countryId, $year);
        $employees = $data['employees'];
        $averages  = $data['averages'];
        $total     = count($employees);

        if ($total === 0) {
            $emit('error', ['message' => 'No employees found.']);
            return;
        }

        $emit('start', ['total' => $total, 'year' => $year]);

        $results = [];

        foreach ($employees as $index => $emp) {
            $current = $index + 1;

            $emit('progress', [
                'current' => $current,
                'total'   => $total,
                'name'    => $emp['name'],
                'user_id' => $emp['id'],
                'status'  => 'analyzing',
            ]);

            try {
                $analysis  = $this->analyzeOne($emp, $averages, $year);
                $result    = array_merge($emp, [
                    'rating'   => $analysis['rating'],
                    'remark'   => $analysis['remark'],
                    'score'    => $analysis['score'],
                    'analyzed' => true,
                ]);
                $results[] = $result;

                $emit('result', [
                    'current' => $current, 'total' => $total,
                    'user_id' => $emp['id'], 'name' => $emp['name'],
                    'rating'  => $analysis['rating'], 'remark' => $analysis['remark'],
                    'score'   => $analysis['score'], 'status' => 'done',
                ]);

            } catch (\Exception $e) {
                Log::error("PerformanceAnalysis failed for {$emp['name']}", ['error' => $e->getMessage()]);

                $fallback  = ['score' => 50, 'rating' => 'Average', 'remark' => 'Analysis unavailable.'];
                $results[] = array_merge($emp, [...$fallback, 'analyzed' => false]);

                $emit('result', [
                    'current' => $current, 'total' => $total,
                    'user_id' => $emp['id'], 'name' => $emp['name'],
                    'rating'  => $fallback['rating'], 'remark' => $fallback['remark'],
                    'score'   => $fallback['score'], 'status' => 'error',
                ]);
            }
        }

        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);

        $emit('complete', ['total' => $total, 'results' => $results, 'year' => $year]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Analyze ONE employee
    // ═══════════════════════════════════════════════════════════════
    private function analyzeOne(array $emp, array $averages, int $year): array
    {
        $startTime = microtime(true);

        $prompt = <<<PROMPT
You are an HR performance analyst. Analyze this employee's {$year} performance.

PERIOD: {$emp['period_label']}
TEAM ({$averages['total_employees']} employees) AVERAGES:
- Avg attendance rate : {$averages['avg_attendance_rate']}%
- Avg late days       : {$averages['avg_late_days']}
- Avg absent days     : {$averages['avg_absent_days']}
- Avg leave days      : {$averages['avg_leave_days']}
- Avg OT hours        : {$averages['avg_ot_hours']}

EMPLOYEE: {$emp['name']}
- Recorded days   : {$emp['recorded_days']} (days with any attendance entry)
- Present days    : {$emp['present_days']}
- Attendance rate : {$emp['attendance_rate']}%  (out of recorded days; team avg: {$averages['avg_attendance_rate']}%)
- Late days       : {$emp['late_days']}          (team avg: {$averages['avg_late_days']})
- Absent days     : {$emp['absent_days']}         (team avg: {$averages['avg_absent_days']})
- Leave days      : {$emp['leave_days']}           (team avg: {$averages['avg_leave_days']})
- OT hours        : {$emp['ot_hours']}             (team avg: {$averages['avg_ot_hours']})

NOTE: Attendance rate is calculated from recorded days only (not total working days),
so a low rate means they were frequently absent/late ON THE DAYS THEY WERE RECORDED.

REMARK RULES — check in priority order, use the first matching rule:
1. If recorded_days = 0 → score=0, rating=Poor, remark="No attendance records — treated as absent entire period."
2. If attendance_rate < 50% → "Attendance {attendance_rate}% of recorded days — below team avg {avg}%."
3. If attendance_rate < 80% AND below team avg → "Attendance {attendance_rate}% — below team avg of {avg}%."
4. (attendance ok) If late_days > avg_late_days AND leave_days > avg_leave_days → "Late {X} days and leave {Y} days — both above team avg."
5. (attendance ok) If late_days > avg_late_days → "Late {X} days — above team avg of {avg}."
6. (attendance ok) If leave_days > avg_leave_days → "Leave {X} days — above team avg of {avg}."
7. (attendance ok) If absent_days > avg_absent_days → "Absent {X} days — above team avg."
8. If ot_hours > avg_ot_hours → "OT {X} hrs — above team avg of {avg}." (positive note)
9. If all metrics within or below average → "All metrics within team norms."

IMPORTANT:
- Max 15 words
- Use ACTUAL numbers
- NEVER say: "working days", "present days", "critical attendance", "severe", "failure"

SCORING (0-100):
- Base: 100
- If recorded_days = 0: score = 0, rating = Poor (override everything)
- Subtract: late_days × 8
- Subtract: absent_days × 10
- Subtract: max(0, leave_days - avg_leave_days) × 3
- Add: ot_hours × 2
- If attendance_rate < 50: subtract 30
- Else if attendance_rate < 80: subtract 15
- Clamp 0–100

Rating: 90+=Excellent, 75-89=Good, 60-74=Average, 45-59=Needs Improvement, <45=Poor

Respond ONLY with valid JSON, no markdown:
{"score": <integer>, "rating": "<rating>", "remark": "<remark>"}
PROMPT;

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
            'model'      => $this->model,
            'max_tokens' => 256,
            'messages'   => [['role' => 'user', 'content' => $prompt]],
        ]);

        $elapsed = round((microtime(true) - $startTime) * 1000);

        if (!$response->successful()) {
            throw new \RuntimeException('API call failed: ' . $response->status());
        }

        $json  = $response->json();
        $text  = $json['content'][0]['text'] ?? '{}';
        $usage = $json['usage'] ?? null;

        if ($usage) {
            $cost = (($usage['input_tokens'] / 1_000_000) * 3)
                  + (($usage['output_tokens'] / 1_000_000) * 15);
            Log::info("📊 Performance [{$emp['name']}]", [
                'input'    => $usage['input_tokens'],
                'output'   => $usage['output_tokens'],
                'cost_usd' => '$' . number_format($cost, 6),
                'ms'       => $elapsed,
            ]);
        }

        $clean  = trim(preg_replace('/^```json|```$/m', '', $text));
        $parsed = json_decode($clean, true);

        if ($parsed && isset($parsed['rating'], $parsed['remark'], $parsed['score'])) {
            return $parsed;
        }

        return ['score' => 50, 'rating' => 'Average', 'remark' => 'Performance data recorded.'];
    }

    // ═══════════════════════════════════════════════════════════════
    //  Sort by selected filter metrics
    // ═══════════════════════════════════════════════════════════════
    public function sortByFilters(array $employees, array $filters): array
    {
        usort($employees, function ($a, $b) use ($filters) {
            $scoreA = 0; $scoreB = 0;
            if (in_array('late',   $filters)) { $scoreA += $a['late_days'];   $scoreB += $b['late_days']; }
            if (in_array('absent', $filters)) { $scoreA += $a['absent_days']; $scoreB += $b['absent_days']; }
            if (in_array('leave',  $filters)) { $scoreA += $a['leave_days'];  $scoreB += $b['leave_days']; }
            if (in_array('ot',     $filters)) { $scoreA -= $a['ot_hours'];    $scoreB -= $b['ot_hours']; }
            return $scoreB <=> $scoreA;
        });
        return $employees;
    }
}