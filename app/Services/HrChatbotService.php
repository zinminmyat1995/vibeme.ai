<?php

namespace App\Services;

use App\Models\User;
use App\Models\HrChatbotMessage;
use App\Models\HrChatbotCache;
use App\Models\SalaryRule;
use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\AttendanceRecord;
use App\Models\OvertimeRequest;
use App\Models\LeaveRequest;
use App\Models\PayrollRecord;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HrChatbotService
{
    private string $model = 'claude-sonnet-4-20250514';

    // ─────────────────────────────────────────────────────────────
    //  MAIN ENTRY — ask()
    // ─────────────────────────────────────────────────────────────
    public function ask(User $user, string $message): array
    {
        // 1. Check DB cache first
        $cacheHit = $this->getCache($user->id, $message);
        if ($cacheHit) {
            Log::info('💾 HrChatbot Cache HIT', [
                'user'     => $user->name,
                'question' => substr($message, 0, 80),
            ]);

            // Save both messages to DB
            $this->saveMessage($user->id, 'user',      $message,          false);
            $this->saveMessage($user->id, 'assistant', $cacheHit,         true);

            return ['reply' => $cacheHit, 'cached' => true];
        }

        // 2. Build history from DB (last 10 pairs = 20 messages)
        $history = $this->getHistory($user->id);

        // 3. Build context + system prompt
        $context      = $this->buildUserContext($user);
        $systemPrompt = $this->buildSystemPrompt($user, $context);

        // 4. Add current message
        $messages   = $history;
        $messages[] = ['role' => 'user', 'content' => $message];

        // 5. Call Claude API
        $startTime = microtime(true);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
            'model'      => $this->model,
            'max_tokens' => 1024,
            'system'     => $systemPrompt,
            'messages'   => $messages,
        ]);

        $elapsed = round((microtime(true) - $startTime) * 1000);

        if (!$response->successful()) {
            Log::error('❌ HrChatbot API failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return ['reply' => 'Sorry, I\'m having trouble connecting right now. Please try again.', 'cached' => false];
        }

        $json  = $response->json();
        $reply = $json['content'][0]['text'] ?? 'Sorry, I could not process your request.';
        $usage = $json['usage'] ?? null;

        // 6. Log token usage
        if ($usage) {
            $inputTokens  = $usage['input_tokens']  ?? 0;
            $outputTokens = $usage['output_tokens'] ?? 0;
            $inputCost    = ($inputTokens  / 1_000_000) * 3;
            $outputCost   = ($outputTokens / 1_000_000) * 15;

            Log::info('🤖 HrChatbot API Usage', [
                'user'          => $user->name . ' (id:' . $user->id . ')',
                'input_tokens'  => $inputTokens,
                'output_tokens' => $outputTokens,
                'total_tokens'  => $inputTokens + $outputTokens,
                'cost_usd'      => '$' . number_format($inputCost + $outputCost, 6),
                'time_ms'       => $elapsed,
            ]);
        }

        // 7. Save to DB (messages + cache)
        $this->saveMessage($user->id, 'user',      $message, false);
        $this->saveMessage($user->id, 'assistant', $reply,   false);
        $this->setCache($user->id, $message, $reply);

        return ['reply' => $reply, 'cached' => false];
    }

    // ─────────────────────────────────────────────────────────────
    //  GET MESSAGES — for frontend to load on open
    // ─────────────────────────────────────────────────────────────
    public function getMessages(int $userId, int $limit = 50): array
    {
        return HrChatbotMessage::where('user_id', $userId)
            ->orderBy('created_at')
            ->limit($limit)
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'role'       => $m->role,
                'content'    => $m->content,
                'from_cache' => $m->from_cache,
                'time'       => $m->created_at->toISOString(),
            ])
            ->toArray();
    }

    // ─────────────────────────────────────────────────────────────
    //  CLEAR MESSAGES — for ↺ button
    // ─────────────────────────────────────────────────────────────
    public function clearMessages(int $userId): void
    {
        HrChatbotMessage::where('user_id', $userId)->delete();
    }

    // ─────────────────────────────────────────────────────────────
    //  PRIVATE: DB Cache helpers
    // ─────────────────────────────────────────────────────────────
    private function hashQuestion(string $question): string
    {
        return hash('sha256', mb_strtolower(trim(preg_replace('/\s+/', ' ', $question))));
    }

    private function getCache(int $userId, string $question): ?string
    {
        $entry = HrChatbotCache::where('user_id', $userId)
            ->where('question_hash', $this->hashQuestion($question))
            ->first();

        if (!$entry) return null;
        if (!$entry->isValid()) {
            $entry->delete();
            return null;
        }
        return $entry->answer;
    }

    private function setCache(int $userId, string $question, string $answer): void
    {
        HrChatbotCache::updateOrCreate(
            [
                'user_id'       => $userId,
                'question_hash' => $this->hashQuestion($question),
            ],
            [
                'question'   => $question,
                'answer'     => $answer,
                'expires_at' => null, // never expires (HR rules don't change often)
            ]
        );
    }

    // ─────────────────────────────────────────────────────────────
    //  PRIVATE: Save message to DB
    // ─────────────────────────────────────────────────────────────
    private function saveMessage(int $userId, string $role, string $content, bool $fromCache): void
    {
        HrChatbotMessage::create([
            'user_id'    => $userId,
            'role'       => $role,
            'content'    => $content,
            'from_cache' => $fromCache,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  PRIVATE: Get recent history for multi-turn context
    // ─────────────────────────────────────────────────────────────
    private function getHistory(int $userId): array
    {
        return HrChatbotMessage::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(20) // last 10 pairs
            ->get()
            ->reverse()
            ->values()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();
    }

    // ─────────────────────────────────────────────────────────────
    //  COLLECT USER DATA FROM DB
    // ─────────────────────────────────────────────────────────────
    private function buildUserContext(User $user): array
    {
        $now       = Carbon::now();
        $month     = $now->month;
        $year      = $now->year;
        $countryId = $user->country_id;

        $salaryRule = SalaryRule::where('country_id', $countryId)->first();

        $leaveBalances = LeaveBalance::where('user_id', $user->id)
            ->where('year', $year)->get()
            ->map(fn($b) => [
                'type'      => $b->leave_type,
                'total'     => $b->total_days,
                'used'      => $b->used_days,
                'remaining' => $b->remaining_days,
            ])->toArray();

        $leavePolicies = LeavePolicy::where('country_id', $countryId)->get()
            ->map(fn($p) => [
                'type'          => $p->leave_type,
                'days_per_year' => $p->days_per_year,
            ])->toArray();

        $attendanceRecords = AttendanceRecord::where('user_id', $user->id)
            ->whereMonth('date', $month)->whereYear('date', $year)->get();

        $pendingOT = OvertimeRequest::where('user_id', $user->id)
            ->where('status', 'pending')->count();

        $approvedOTHours = OvertimeRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereMonth('start_date', $month)->whereYear('start_date', $year)
            ->sum('hours_approved');

        $pendingLeave = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'pending')->count();

        $latestPayroll = PayrollRecord::where('user_id', $user->id)
            ->orderByDesc('year')->orderByDesc('month')->first();

        return [
            'salary_rule'    => $salaryRule ? [
                'work_start'          => substr($salaryRule->work_start  ?? '08:00:00', 0, 5),
                'work_end'            => substr($salaryRule->work_end    ?? '17:00:00', 0, 5),
                'lunch_start'         => substr($salaryRule->lunch_start ?? '12:00:00', 0, 5),
                'lunch_end'           => substr($salaryRule->lunch_end   ?? '13:00:00', 0, 5),
                'late_deduction_unit' => $salaryRule->late_deduction_unit ?? 'per_minute',
                'late_deduction_rate' => $salaryRule->late_deduction_rate ?? 0,
                'pay_cycle'           => $salaryRule->pay_cycle ?? 'monthly',
            ] : null,
            'leave_balances' => $leaveBalances,
            'leave_policies' => $leavePolicies,
            'attendance'     => [
                'this_month'         => $now->format('F Y'),
                'present_days'       => $attendanceRecords->whereIn('status', ['present','late'])->count(),
                'late_days'          => $attendanceRecords->where('status', 'late')->count(),
                'absent_days'        => $attendanceRecords->where('status', 'absent')->count(),
                'total_late_minutes' => $attendanceRecords->sum('late_minutes'),
            ],
            'overtime'       => [
                'pending_requests'          => $pendingOT,
                'approved_hours_this_month' => round((float)$approvedOTHours, 2),
            ],
            'leave_requests' => ['pending_count' => $pendingLeave],
            'latest_payroll' => $latestPayroll ? [
                'period'     => Carbon::createFromDate($latestPayroll->year, $latestPayroll->month, 1)->format('F Y'),
                'net_salary' => number_format($latestPayroll->net_salary, 2),
                'status'     => $latestPayroll->status,
            ] : null,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    //  BUILD SYSTEM PROMPT
    // ─────────────────────────────────────────────────────────────
    private function buildSystemPrompt(User $user, array $ctx): string
    {
        $country    = $user->country?->name ?? 'Cambodia';
        $role       = $user->role?->name    ?? 'employee';
        $workStart  = $ctx['salary_rule']['work_start']  ?? '08:00';
        $workEnd    = $ctx['salary_rule']['work_end']    ?? '17:00';
        $lunchStart = $ctx['salary_rule']['lunch_start'] ?? '12:00';
        $lunchEnd   = $ctx['salary_rule']['lunch_end']   ?? '13:00';
        $payCycle   = $ctx['salary_rule']['pay_cycle']   ?? 'monthly';
        $lateRate   = $ctx['salary_rule']['late_deduction_rate'] ?? 0;
        $lateUnit   = $ctx['salary_rule']['late_deduction_unit'] ?? 'per_minute';

        $leaveBalanceText = 'No leave balance data.';
        if (!empty($ctx['leave_balances'])) {
            $leaveBalanceText = implode("\n", array_map(
                fn($b) => "  - {$b['type']}: {$b['remaining']} days remaining (used {$b['used']} / total {$b['total']})",
                $ctx['leave_balances']
            ));
        }

        $leavePoliciesText = 'No leave policy data.';
        if (!empty($ctx['leave_policies'])) {
            $leavePoliciesText = implode("\n", array_map(
                fn($p) => "  - {$p['type']}: {$p['days_per_year']} days/year",
                $ctx['leave_policies']
            ));
        }

        $att         = $ctx['attendance'];
        $payrollText = $ctx['latest_payroll']
            ? "Period: {$ctx['latest_payroll']['period']}, Net: {$ctx['latest_payroll']['net_salary']}, Status: {$ctx['latest_payroll']['status']}"
            : 'No payroll record.';

        return <<<PROMPT
You are HRBot, the friendly internal HR assistant for Brycen {$country}.
You assist employees and HR staff with questions about this HR system ONLY.

━━━ YOUR RULES ━━━
- Answer ONLY: attendance, leave, overtime, payroll, HR policies, working hours, system features.
- For unrelated questions: politely decline and redirect.
- Be warm, helpful, concise. Use bullet points for lists.
- Respond in the same language the user writes in (English or Myanmar).

━━━ COMPANY RULES ━━━
- Working hours  : {$workStart} – {$workEnd}
- Lunch break    : {$lunchStart} – {$lunchEnd}
- Late definition: Check-in after {$workStart} = LATE
- Late deduction : {$lateRate} {$lateUnit}
- Pay cycle      : {$payCycle}

━━━ CURRENT USER ━━━
- Name    : {$user->name}
- Role    : {$role}
- Country : {$country}

━━━ LEAVE BALANCES ━━━
{$leaveBalanceText}

━━━ LEAVE POLICIES ━━━
{$leavePoliciesText}

━━━ ATTENDANCE ({$att['this_month']}) ━━━
Present: {$att['present_days']} days | Late: {$att['late_days']} days | Absent: {$att['absent_days']} days | Total late: {$att['total_late_minutes']} min

━━━ OVERTIME ━━━
Pending: {$ctx['overtime']['pending_requests']} | Approved this month: {$ctx['overtime']['approved_hours_this_month']} hrs

━━━ LEAVE REQUESTS ━━━
Pending: {$ctx['leave_requests']['pending_count']}

━━━ LATEST PAYROLL ━━━
{$payrollText}

━━━ PAYROLL CALCULATION FORMULA ━━━
Net Salary = Base Salary + Allowances + Overtime + Bonus - Late Deduction - Short Hour Deduction - Salary Deductions - Tax - Social Security

Step by step:
1. DAILY RATE     = Base Salary ÷ Working Days in month
2. HOURLY RATE    = Daily Rate ÷ Hours per day (work_end - work_start - lunch)
3. ALLOWANCES     = Fixed amount OR percentage of Base Salary (per country setup)
4. OVERTIME PAY   = Hourly Rate × OT multiplier (default 1.5x) × Approved OT hours
5. LATE DEDUCTION = Late minutes × {$lateRate} per minute
6. SHORT HOUR     = (Standard hours - Actual work hours) × Hourly Rate (per day)
7. UNPAID LEAVE   = Daily Rate × Unpaid leave days
8. TAX            = Progressive brackets (applied on gross salary, last period only)
9. SOCIAL SEC.    = Base Salary × Employee rate % (last period only)
10. BONUS         = Scheduled bonus (quarterly/monthly, last period only)

Pay cycle: {$payCycle} (semi_monthly = 2 payroll runs/month, last run includes tax/bonus/allowances)
PROMPT;

    }
}