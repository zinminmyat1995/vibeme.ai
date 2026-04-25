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
    //  MAIN — ask()
    // ─────────────────────────────────────────────────────────────
    public function ask(User $user, string $message): array
    {
        // Cache check
        $cacheHit = $this->getCache($user->id, $message);
        if ($cacheHit) {
            Log::info('💾 HrChatbot Cache HIT', ['user' => $user->name, 'q' => substr($message, 0, 60)]);
            $this->saveMessage($user->id, 'user',      $message,   false);
            $this->saveMessage($user->id, 'assistant', $cacheHit,  true);
            return ['reply' => $cacheHit, 'cached' => true];
        }

        $context      = $this->buildUserContext($user);
        $systemPrompt = $this->buildSystemPrompt($user, $context);
        $history      = $this->getHistory($user->id);
        $messages     = array_merge($history, [['role' => 'user', 'content' => $message]]);

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
            Log::error('❌ HrChatbot API failed', ['status' => $response->status()]);
            return ['reply' => 'Sorry, I\'m having trouble connecting. Please try again.', 'cached' => false];
        }

        $json  = $response->json();
        $reply = $json['content'][0]['text'] ?? 'Sorry, I could not process that.';
        $usage = $json['usage'] ?? null;

        if ($usage) {
            $cost = (($usage['input_tokens'] / 1_000_000) * 3) + (($usage['output_tokens'] / 1_000_000) * 15);
            Log::info('🤖 HrChatbot API Usage', [
                'user'         => $user->name . ' (id:' . $user->id . ')',
                'input_tokens' => $usage['input_tokens'],
                'output_tokens'=> $usage['output_tokens'],
                'cost_usd'     => '$' . number_format($cost, 6),
                'time_ms'      => $elapsed,
            ]);
        }

        $this->saveMessage($user->id, 'user',      $message, false);
        $this->saveMessage($user->id, 'assistant', $reply,   false);
        $this->setCache($user->id, $message, $reply);

        return ['reply' => $reply, 'cached' => false];
    }

    // ─────────────────────────────────────────────────────────────
    //  MESSAGES — paginated (scroll-up to load more)
    // ─────────────────────────────────────────────────────────────
    public function getMessages(int $userId, int $limit = 10, ?string $beforeId = null): array
    {
        $query = HrChatbotMessage::where('user_id', $userId)->orderByDesc('id');
        if ($beforeId) $query->where('id', '<', $beforeId);

        return $query->limit($limit)->get()
            ->reverse()->values()
            ->map(fn($m) => [
                'id'         => $m->id,
                'role'       => $m->role,
                'content'    => $m->content,
                'from_cache' => $m->from_cache,
                'time'       => $m->created_at->toISOString(),
            ])->toArray();
    }

    public function hasMoreMessages(int $userId, ?string $beforeId, int $limit): bool
    {
        $query = HrChatbotMessage::where('user_id', $userId);
        if ($beforeId) $query->where('id', '<', $beforeId);
        return $query->count() > $limit;
    }

    public function clearMessages(int $userId): void
    {
        HrChatbotMessage::where('user_id', $userId)->delete();
    }

    // ─────────────────────────────────────────────────────────────
    //  QUICK ACTIONS — role-based
    // ─────────────────────────────────────────────────────────────
    public function getQuickActions(string $role): array
    {
        $common = [
            ['label' => '🗓 Leave Balance',     'message' => 'How many leave days do I have left?'],
            ['label' => '⏰ My Attendance',      'message' => 'Show my attendance this month'],
            ['label' => '💰 Payroll Status',     'message' => 'Has my salary been processed this month?'],
            ['label' => '⚡ OT Requests',        'message' => 'Show my pending overtime requests'],
        ];

        $hrExtra = [
            ['label' => '👥 Team Leave Today',   'message' => 'Who is on leave today?'],
            ['label' => '📋 Pending Approvals',  'message' => 'How many requests are pending approval?'],
            ['label' => '📅 Working Hours',       'message' => 'What are the working hours and late policy?'],
            ['label' => '💼 Leave Policies',      'message' => 'What are the leave policies for our company?'],
        ];

        $mgmtExtra = [
            ['label' => '👥 Team Leave Today',   'message' => 'Who is on leave today?'],
            ['label' => '📋 Pending Approvals',  'message' => 'How many requests are pending approval?'],
            ['label' => '📈 Late Policy',         'message' => 'What is the late deduction policy?'],
        ];

        return match($role) {
            'hr', 'admin' => array_merge($common, $hrExtra),
            'management'  => array_merge($common, $mgmtExtra),
            default       => $common,
        };
    }

    // ─────────────────────────────────────────────────────────────
    //  COLLECT USER CONTEXT FROM DB
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
            ->map(fn($p) => ['type' => $p->leave_type, 'days_per_year' => $p->days_per_year])->toArray();

        $att = AttendanceRecord::where('user_id', $user->id)
            ->whereMonth('date', $month)->whereYear('date', $year)->get();

        $pendingOT = OvertimeRequest::where('user_id', $user->id)->where('status', 'pending')->count();
        $approvedOTHours = OvertimeRequest::where('user_id', $user->id)->where('status', 'approved')
            ->whereMonth('start_date', $month)->whereYear('start_date', $year)->sum('hours_approved');

        $pendingLeave = LeaveRequest::where('user_id', $user->id)->where('status', 'pending')->count();

        $latestPayroll = PayrollRecord::where('user_id', $user->id)
            ->orderByDesc('year')->orderByDesc('month')->first();

        // ── Colleagues data (same country, for HR/Management questions) ──
        $colleagues = \App\Models\User::where('country_id', $countryId)
            ->where('id', '!=', $user->id)
            ->where('is_active', 1)
            ->whereHas('role', fn($q) => $q->whereIn('name', ['employee', 'member', 'hr', 'management']))
            ->get(['id', 'name', 'department', 'position'])
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'department' => $u->department,
                'position'   => $u->position,
                // Is on leave today?
                'on_leave_today' => LeaveRequest::where('user_id', $u->id)
                    ->where('status', 'approved')
                    ->whereDate('start_date', '<=', $now->toDateString())
                    ->whereDate('end_date',   '>=', $now->toDateString())
                    ->exists(),
            ])->toArray();
            // ── Public Holidays (this month + upcoming) ──
            $thisMonthHolidays = \App\Models\PublicHoliday::where('country_id', $countryId)
                ->whereMonth('date', $now->month)
                ->whereYear('date', $now->year)
                ->orderBy('date')
                ->get()
                ->map(fn($h) => [
                    'name' => $h->name,
                    'date' => $h->date->format('d M Y (l)'),
                ])->toArray();

            $upcomingHolidays = \App\Models\PublicHoliday::where('country_id', $countryId)
                ->whereDate('date', '>', $now->toDateString())
                ->whereDate('date', '<=', $now->copy()->addDays(30)->toDateString())
                ->orderBy('date')
                ->get()
                ->map(fn($h) => [
                    'name' => $h->name,
                    'date' => $h->date->format('d M Y (l)'),
                    'days_away' => $now->diffInDays($h->date),
                ])->toArray();

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
                'present_days'       => $att->whereIn('status', ['present', 'late'])->count(),
                'late_days'          => $att->where('status', 'late')->count(),
                'absent_days'        => $att->where('status', 'absent')->count(),
                'total_late_minutes' => (int) $att->sum('late_minutes'),
            ],
            'overtime'       => [
                'pending_requests'          => $pendingOT,
                'approved_hours_this_month' => round((float) $approvedOTHours, 2),
            ],
            'leave_requests' => ['pending_count' => $pendingLeave],
            'latest_payroll' => $latestPayroll ? [
                'period'     => Carbon::createFromDate($latestPayroll->year, $latestPayroll->month, 1)->format('F Y'),
                'net_salary' => number_format($latestPayroll->net_salary, 2),
                'status'     => $latestPayroll->status,
            ] : null,
            'colleagues'     => $colleagues,
            'holidays_this_month' => $thisMonthHolidays,
            'upcoming_holidays'   => $upcomingHolidays,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    //  SYSTEM PROMPT
    // ─────────────────────────────────────────────────────────────
    private function buildSystemPrompt(User $user, array $ctx): string
    {
        $now = Carbon::now();
        
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

        $att = $ctx['attendance'];
        $payrollText = $ctx['latest_payroll']
            ? "Period: {$ctx['latest_payroll']['period']}, Net: {$ctx['latest_payroll']['net_salary']}, Status: {$ctx['latest_payroll']['status']}"
            : 'No payroll record found.';

        // Colleagues list
        $colleaguesText = 'No colleague data.';
        if (!empty($ctx['colleagues'])) {
            $onLeave = array_filter($ctx['colleagues'], fn($c) => $c['on_leave_today']);
            $colleaguesList = implode("\n", array_map(
                fn($c) => "  - {$c['name']} | Dept: {$c['department']} | Position: {$c['position']} | On leave today: " . ($c['on_leave_today'] ? 'Yes' : 'No'),
                $ctx['colleagues']
            ));
            $onLeaveNames = implode(', ', array_map(fn($c) => $c['name'], $onLeave));
            $colleaguesText = $colleaguesList;
            $colleaguesText .= "\nOn leave today: " . ($onLeaveNames ?: 'None');
        }

        $holidaysThisMonth = 'No holidays this month.';
        if (!empty($ctx['holidays_this_month'])) {
            $holidaysThisMonth = implode("\n", array_map(
                fn($h) => "  - {$h['name']}: {$h['date']}",
                $ctx['holidays_this_month']
            ));
        }

        $upcomingHolidaysText = 'No upcoming holidays in next 30 days.';
        if (!empty($ctx['upcoming_holidays'])) {
            $upcomingHolidaysText = implode("\n", array_map(
                fn($h) => "  - {$h['name']}: {$h['date']} ({$h['days_away']} days away)",
                $ctx['upcoming_holidays']
            ));
        }


        return <<<PROMPT
You are HRBot, the friendly internal HR assistant for Brycen {$country}.

━━━ YOUR SCOPE ━━━
You answer questions about:
1. HR SYSTEM: attendance, leave, overtime, payroll, policies, working hours, system features
2. SELF DATA: anything about the current user's own records (leave balance, attendance, salary, OT)
3. COLLEAGUE GENERAL INFO: department, position, whether someone is on leave today — using the colleagues data below
   - You MAY answer: "Is So Yi on leave today?", "What department is Ko Ko in?", "Who is on leave today?"
   - You MAY NOT answer: personal salary, personal leave balance, personal attendance of other employees

For unrelated questions: politely decline and redirect to HR topics.
Respond in the same language the user writes in (English or Myanmar).
Be warm, concise, and helpful. Use bullet points for lists.

━━━ COMPANY RULES — Brycen {$country} ━━━
- Working hours  : {$workStart} – {$workEnd}
- Lunch break    : {$lunchStart} – {$lunchEnd}
- Late definition: Check-in after {$workStart} = LATE
- Late deduction : {$lateRate} {$lateUnit}
- Pay cycle      : {$payCycle}

━━━ CURRENT USER ━━━
- Name    : {$user->name}
- Role    : {$role}
- Country : {$country}

━━━ MY LEAVE BALANCES ━━━
{$leaveBalanceText}

━━━ LEAVE POLICIES ━━━
{$leavePoliciesText}

━━━ MY ATTENDANCE ({$att['this_month']}) ━━━
Present: {$att['present_days']} | Late: {$att['late_days']} | Absent: {$att['absent_days']} | Total late: {$att['total_late_minutes']} min

━━━ MY OVERTIME ━━━
Pending: {$ctx['overtime']['pending_requests']} | Approved this month: {$ctx['overtime']['approved_hours_this_month']} hrs

━━━ MY LEAVE REQUESTS ━━━
Pending: {$ctx['leave_requests']['pending_count']}

━━━ MY LATEST PAYROLL ━━━
{$payrollText}

━━━ COLLEAGUES (same country) ━━━
{$colleaguesText}

━━━ PUBLIC HOLIDAYS ━━━
This month ({$now->format('F Y')}):
{$holidaysThisMonth}

Upcoming (next 30 days):
{$upcomingHolidaysText}

PROMPT;
    }

    // ─────────────────────────────────────────────────────────────
    //  HISTORY for multi-turn
    // ─────────────────────────────────────────────────────────────
    private function getHistory(int $userId): array
    {
        return HrChatbotMessage::where('user_id', $userId)
            ->orderByDesc('id')->limit(20)->get()
            ->reverse()->values()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();
    }

    // ─────────────────────────────────────────────────────────────
    //  DB helpers
    // ─────────────────────────────────────────────────────────────
    private function saveMessage(int $userId, string $role, string $content, bool $fromCache): void
    {
        HrChatbotMessage::create(['user_id' => $userId, 'role' => $role, 'content' => $content, 'from_cache' => $fromCache]);
    }

    private function hashQuestion(string $q): string
    {
        return hash('sha256', mb_strtolower(trim(preg_replace('/\s+/', ' ', $q))));
    }

    private function getCache(int $userId, string $question): ?string
    {
        $entry = HrChatbotCache::where('user_id', $userId)
            ->where('question_hash', $this->hashQuestion($question))->first();
        if (!$entry || !$entry->isValid()) { $entry?->delete(); return null; }
        return $entry->answer;
    }

    private function setCache(int $userId, string $question, string $answer): void
    {
        HrChatbotCache::updateOrCreate(
            ['user_id' => $userId, 'question_hash' => $this->hashQuestion($question)],
            ['question' => $question, 'answer' => $answer, 'expires_at' => null]
        );
    }
}