<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\OvertimeRequestSegment;
use App\Models\LeaveRequest;
use App\Models\PayrollRecord;
use App\Models\SalaryRule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PLReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user      = Auth::user();
        $countryId = $user->countryRecord?->id;

        // ── Available confirmed months ──
        $availableMonths = PayrollRecord::whereIn('status', ['confirmed', 'approved', 'paid'])
            ->whereHas('payrollPeriod', fn($q) => $q->where('country_id', $countryId))
            ->selectRaw('DISTINCT year, month')
            ->orderBy('year')->orderBy('month')
            ->get()
            ->map(fn($r) => [
                'year'  => (int)$r->year,
                'month' => (int)$r->month,
                'label' => Carbon::create($r->year, $r->month, 1)->format('M Y'),
            ]);

        $earliest = $availableMonths->first();
        $latest   = $availableMonths->last();

        $fromYear  = (int)($request->from_year  ?? $earliest?->year  ?? now()->year);
        $fromMonth = (int)($request->from_month ?? $earliest?->month ?? now()->month);
        $toYear    = (int)($request->to_year    ?? $latest?->year    ?? now()->year);
        $toMonth   = (int)($request->to_month   ?? $latest?->month   ?? now()->month);

        $periodStart = Carbon::create($fromYear, $fromMonth, 1)->startOfMonth();
        $periodEnd   = Carbon::create($toYear,   $toMonth,   1)->endOfMonth();

        $salaryRule   = SalaryRule::where('country_id', $countryId)->first();
        $workHoursDay = (float)($salaryRule?->working_hours_per_day ?? 8);

        $monthsInRange = $availableMonths->filter(fn($m) =>
            Carbon::create($m['year'], $m['month'], 1)->between($periodStart, $periodEnd)
        )->values();

        // ── Previous period (same duration, just before) for % change ──
        $rangeMonths  = $monthsInRange->count() ?: 1;
        $prevEnd      = $periodStart->copy()->subDay()->endOfMonth();
        $prevStart    = $prevEnd->copy()->subMonths($rangeMonths - 1)->startOfMonth();

        $prevMonths = $availableMonths->filter(fn($m) =>
            Carbon::create($m['year'], $m['month'], 1)->between($prevStart, $prevEnd)
        )->values();

        // ── Projects ──
        $projects = Project::whereIn('status', ['active', 'upcoming', 'completed'])
            ->where('start_date', '<=', $periodEnd->toDateString())
            ->where(fn($q) => $q->whereNull('end_date')
                ->orWhere('end_date', '>=', $periodStart->toDateString()))
            ->get();

        // ── All users with payroll ──
        $allUserIds = PayrollRecord::whereIn('status', ['confirmed', 'approved', 'paid'])
            ->whereHas('payrollPeriod', fn($q) => $q->where('country_id', $countryId))
            ->select('user_id')->distinct()->pluck('user_id');

        // ── Accumulate current period ──
        [$totalRevenue, $totalProjectCost, $totalOverhead, $monthlyTrend, $projectTotals, $overheadByDept] =
            $this->accumulatePeriod($monthsInRange, $projects, $allUserIds, $workHoursDay, $countryId);

        // ── Accumulate previous period for % change ──
        [$prevRevenue, $prevProjectCost, $prevOverhead] =
            $this->accumulatePrevPeriod($prevMonths, $projects, $allUserIds, $workHoursDay, $countryId);

        // ── Project rows ──
        $projectRows = collect($projectTotals)->map(function ($p) {
            $p['profit']      = round($p['revenue'] - $p['total_cost'], 2);
            $p['revenue']     = round($p['revenue'], 2);
            $p['salary_cost'] = round($p['salary_cost'], 2);
            $p['ot_cost']     = round($p['ot_cost'], 2);
            $p['leave_cost']  = round($p['leave_cost'], 2);
            $p['total_cost']  = round($p['total_cost'], 2);
            $p['margin_pct']  = $p['revenue'] > 0
                ? round(($p['profit'] / $p['revenue']) * 100, 1) : null;
            return $p;
        })->sortByDesc('revenue')->values();

        // ── Outstanding Revenue ──
        $totalContractValue = $projects->sum('contract_value');
        $outstandingRevenue = max(0, $totalContractValue - $totalRevenue);

        // ── Summary ──
        $grossProfit = $totalRevenue - $totalProjectCost;
        $netProfit   = $totalRevenue - $totalProjectCost - $totalOverhead;

        $pct = fn($cur, $prev) => $prev > 0 ? round((($cur - $prev) / $prev) * 100, 1) : null;

        $prevGross = $prevRevenue - $prevProjectCost;
        $prevNet   = $prevRevenue - $prevProjectCost - $prevOverhead;

        return Inertia::render('HR/PLReport/Index', [
            'availableMonths'  => $availableMonths,
            'filter'           => compact('fromYear', 'fromMonth', 'toYear', 'toMonth'),
            'summary'          => [
                'total_revenue'        => round($totalRevenue, 2),
                'total_project_cost'   => round($totalProjectCost, 2),
                'total_overhead'       => round($totalOverhead, 2),
                'total_cost'           => round($totalProjectCost + $totalOverhead, 2),
                'gross_profit'         => round($grossProfit, 2),
                'net_profit'           => round($netProfit, 2),
                'net_margin_pct'       => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 1) : null,
                'total_contract_value' => round($totalContractValue, 2),
                'outstanding_revenue'  => round($outstandingRevenue, 2),
                // vs previous period
                'revenue_change_pct'      => $pct($totalRevenue, $prevRevenue),
                'project_cost_change_pct' => $pct($totalProjectCost, $prevProjectCost),
                'overhead_change_pct'     => $pct($totalOverhead, $prevOverhead),
                'gross_profit_change_pct' => $pct($grossProfit, $prevGross),
                'net_profit_change_pct'   => $pct($netProfit, $prevNet),
            ],
            'monthlyTrend'     => $monthlyTrend,
            'projects'         => $projectRows,
            'overheadByDept'   => $overheadByDept,  // dept breakdown
        ]);
    }

    // ══════════════════════════════════════════════════════════════
    private function accumulatePeriod($monthsInRange, $projects, $allUserIds, $workHoursDay, $countryId): array
    {
        $totalRevenue     = 0;
        $totalProjectCost = 0;
        $totalOverhead    = 0;
        $monthlyTrend     = [];
        $overheadByDept   = [];

        $projectTotals = [];
        foreach ($projects as $p) {
            $projectTotals[$p->id] = [
                'id'             => $p->id,
                'name'           => $p->name,
                'status'         => $p->status,
                'currency'       => $p->currency ?? 'USD',
                'contract_value' => (float)$p->contract_value,
                'start_date'     => $p->start_date?->format('Y-m-d'),
                'end_date'       => $p->end_date?->format('Y-m-d'),
                'revenue'        => 0,
                'salary_cost'    => 0,
                'ot_cost'        => 0,
                'leave_cost'     => 0,
                'total_cost'     => 0,
            ];
        }

        foreach ($monthsInRange as $mInfo) {
            $mStart = Carbon::create($mInfo['year'], $mInfo['month'], 1)->startOfMonth();
            $mEnd   = $mStart->copy()->endOfMonth();

            $mRevenue = 0;
            $mPCost   = 0;

            foreach ($projects as $project) {
                $pl = $this->calcProjectMonth($project, $mStart, $mEnd, $workHoursDay);
                $mRevenue += $pl['revenue'];
                $mPCost   += $pl['total_cost'];

                $projectTotals[$project->id]['revenue']     += $pl['revenue'];
                $projectTotals[$project->id]['salary_cost'] += $pl['salary_cost'];
                $projectTotals[$project->id]['ot_cost']     += $pl['ot_cost'];
                $projectTotals[$project->id]['leave_cost']  += $pl['leave_cost'];
                $projectTotals[$project->id]['total_cost']  += $pl['total_cost'];
            }

            [$mOverhead, $mDeptBreakdown] = $this->calcOverheadMonth($mStart, $mEnd, $workHoursDay, $allUserIds->toArray(), $countryId);

            // Merge dept breakdown
            foreach ($mDeptBreakdown as $dept => $amount) {
                $overheadByDept[$dept] = ($overheadByDept[$dept] ?? 0) + $amount;
            }

            $totalRevenue     += $mRevenue;
            $totalProjectCost += $mPCost;
            $totalOverhead    += $mOverhead;

            $monthlyTrend[] = [
                'label'        => $mInfo['label'],
                'year'         => $mInfo['year'],
                'month'        => $mInfo['month'],
                'revenue'      => round($mRevenue, 2),
                'project_cost' => round($mPCost, 2),
                'overhead'     => round($mOverhead, 2),
                'total_cost'   => round($mPCost + $mOverhead, 2),
                'gross_profit' => round($mRevenue - $mPCost, 2),
                'net_profit'   => round($mRevenue - $mPCost - $mOverhead, 2),
            ];
        }

        // Round dept breakdown
        foreach ($overheadByDept as $k => $v) {
            $overheadByDept[$k] = round($v, 2);
        }

        // Sort desc
        arsort($overheadByDept);

        return [$totalRevenue, $totalProjectCost, $totalOverhead, $monthlyTrend, $projectTotals, $overheadByDept];
    }

    private function accumulatePrevPeriod($prevMonths, $projects, $allUserIds, $workHoursDay, $countryId): array
    {
        $prevRevenue = 0; $prevCost = 0; $prevOverhead = 0;

        foreach ($prevMonths as $mInfo) {
            $mStart = Carbon::create($mInfo['year'], $mInfo['month'], 1)->startOfMonth();
            $mEnd   = $mStart->copy()->endOfMonth();

            foreach ($projects as $project) {
                $pl = $this->calcProjectMonth($project, $mStart, $mEnd, $workHoursDay);
                $prevRevenue += $pl['revenue'];
                $prevCost    += $pl['total_cost'];
            }

            [$mOH] = $this->calcOverheadMonth($mStart, $mEnd, $workHoursDay, $allUserIds->toArray(), $countryId);
            $prevOverhead += $mOH;
        }

        return [$prevRevenue, $prevCost, $prevOverhead];
    }

    // ══════════════════════════════════════════════════════════════
    //  SHOW
    // ══════════════════════════════════════════════════════════════
    public function show(Request $request, Project $project): Response
    {
       
        $filter = [
            'fromYear'  => (int)($request->from_year  ?? now()->year),
            'fromMonth' => (int)($request->from_month ?? now()->month),
            'toYear'    => (int)($request->to_year    ?? now()->year),
            'toMonth'   => (int)($request->to_month   ?? now()->month),
        ];
        $user      = Auth::user();
        $countryId = $user->countryRecord?->id;

        $salaryRule   = SalaryRule::where('country_id', $countryId)->first();
        $workHoursDay = (float)($salaryRule?->working_hours_per_day ?? 8);

        $trendStart = Carbon::parse($project->start_date)->startOfMonth();
        $trendEnd   = ($project->end_date
            ? Carbon::parse($project->end_date)->endOfMonth()
            : now()->endOfMonth())->min(now()->endOfMonth());

        $confirmedMonths = PayrollRecord::whereIn('status', ['confirmed', 'approved', 'paid'])
            ->whereHas('payrollPeriod', fn($q) => $q->where('country_id', $countryId))
            ->where(fn($q) => $q
                ->where('year', '>', $trendStart->year)
                ->orWhere(fn($q2) => $q2->where('year', $trendStart->year)
                    ->where('month', '>=', $trendStart->month))
            )
            ->where(fn($q) => $q
                ->where('year', '<', $trendEnd->year)
                ->orWhere(fn($q2) => $q2->where('year', $trendEnd->year)
                    ->where('month', '<=', $trendEnd->month))
            )
            ->selectRaw('DISTINCT year, month')
            ->orderBy('year')->orderBy('month')
            ->get();

        $months    = [];
        $overallPL = ['revenue' => 0, 'salary_cost' => 0, 'ot_cost' => 0, 'leave_cost' => 0, 'total_cost' => 0, 'profit' => 0];

        foreach ($confirmedMonths as $m) {
            $mStart = Carbon::create($m->year, $m->month, 1)->startOfMonth();
            $mEnd   = $mStart->copy()->endOfMonth();

            $pl          = $this->calcProjectMonth($project, $mStart, $mEnd, $workHoursDay, detailed: true);
            $monthProfit = round($pl['revenue'] - $pl['total_cost'], 2);

            $months[] = [
                'year'         => (int)$m->year,
                'month'        => (int)$m->month,
                'label'        => Carbon::create($m->year, $m->month, 1)->format('M Y'),
                'revenue'      => $pl['revenue'],
                'salary_cost'  => $pl['salary_cost'],
                'ot_cost'      => $pl['ot_cost'],
                'leave_cost'   => $pl['leave_cost'],
                'total_cost'   => $pl['total_cost'],
                'profit'       => $monthProfit,
                'member_count' => $pl['member_count'],
                'members'      => $pl['members'] ?? [],
            ];

            $overallPL['revenue']     += $pl['revenue'];
            $overallPL['salary_cost'] += $pl['salary_cost'];
            $overallPL['ot_cost']     += $pl['ot_cost'];
            $overallPL['leave_cost']  += $pl['leave_cost'];
            $overallPL['total_cost']  += $pl['total_cost'];
            $overallPL['profit']      += $monthProfit;
        }

        foreach ($overallPL as $k => $v) $overallPL[$k] = round($v, 2);

        return Inertia::render('HR/PLReport/Show', [
            'project'     => [
                'id'             => $project->id,
                'name'           => $project->name,
                'status'         => $project->status,
                'currency'       => $project->currency ?? 'USD',
                'contract_value' => (float)$project->contract_value,
                'start_date'     => $project->start_date?->format('Y-m-d'),
                'end_date'       => $project->end_date?->format('Y-m-d'),
            ],
            'months'      => $months,
            'overallPL'   => $overallPL,
            'latestMonth' => !empty($months) ? end($months) : null,
            'filter'      => $filter,
        ]);
    }

    // ── Project month calc ───────────────────────────────────────
    private function calcProjectMonth(
        Project $project, Carbon $mStart, Carbon $mEnd,
        float $workHoursDay, bool $detailed = false
    ): array {
        $revenue = $this->calcMonthlyRevenue($project, $mStart, $mEnd);

        $assignments = \App\Models\ProjectAssignment::where('project_id', $project->id)
            ->whereIn('status', ['active', 'upcoming', 'completed'])
            ->where('start_date', '<=', $mEnd->toDateString())
            ->where('end_date',   '>=', $mStart->toDateString())
            ->with('user')->orderBy('priority_order')->get();

        $salaryCost = 0; $otCost = 0; $leaveCost = 0; $memberRows = [];

        foreach ($assignments as $a) {
            $userId      = $a->user_id;
            $assignStart = Carbon::parse($a->start_date)->max($mStart);
            $assignEnd   = Carbon::parse($a->end_date)->min($mEnd);
            $days        = $this->countWorkingDays($assignStart, $assignEnd);
            if ($days <= 0) continue;

            $recs = PayrollRecord::whereIn('status', ['confirmed', 'approved', 'paid'])
                ->where('user_id', $userId)
                ->where('year', $mStart->year)
                ->where('month', $mStart->month)->get();
            if ($recs->isEmpty()) continue;

            $tSalary   = $recs->sum('base_salary');
            $tWDays    = $recs->sum('working_days');
            $dailyRate = $tWDays > 0 ? $tSalary / $tWDays : 0;
            if ($dailyRate <= 0) continue;

            $ratio  = min((float)$a->hours_per_day / $workHoursDay, 1.0);
            $mSal   = round($dailyRate * $ratio * $days, 2);
            $salaryCost += $mSal;

            $hourly = $workHoursDay > 0 ? $dailyRate / $workHoursDay : 0;
            $mOT    = $this->calcOTCost($userId, $project->id, $hourly, $assignStart, $assignEnd);
            $otCost += $mOT;

            $mLeave    = $this->calcLeaveCost($userId, $a->priority_order, $dailyRate, $assignStart, $assignEnd);
            $leaveCost += $mLeave;

            if ($detailed) {
                $memberRows[] = [
                    'user_id'        => $userId,
                    'name'           => $a->user?->name,
                    'avatar_url'     => $a->user?->avatar_url,
                    'priority_order' => $a->priority_order,
                    'hours_per_day'  => $a->hours_per_day,
                    'assigned_days'  => $days,
                    'daily_rate'     => round($dailyRate, 2),
                    'salary_cost'    => $mSal,
                    'ot_cost'        => round($mOT, 2),
                    'leave_cost'     => round($mLeave, 2),
                    'total_cost'     => round($mSal + $mOT + $mLeave, 2),
                ];
            }
        }

        $result = [
            'revenue'      => round($revenue, 2),
            'salary_cost'  => round($salaryCost, 2),
            'ot_cost'      => round($otCost, 2),
            'leave_cost'   => round($leaveCost, 2),
            'total_cost'   => round($salaryCost + $otCost + $leaveCost, 2),
            'member_count' => $assignments->count(),
        ];
        if ($detailed) $result['members'] = $memberRows;
        return $result;
    }

    // ── Overhead with dept breakdown ─────────────────────────────
    private function calcOverheadMonth(
        Carbon $mStart, Carbon $mEnd, float $workHoursDay,
        array $allUserIds, int $countryId
    ): array {
        $overhead    = 0;
        $deptBreak   = [];
        $workingDays = $this->countWorkingDays($mStart, $mEnd);

        // Load all users with their department
        $users = User::whereIn('id', $allUserIds)
            ->select('id', 'department')
            ->get()->keyBy('id');

        foreach ($allUserIds as $userId) {
            $recs = PayrollRecord::whereIn('status', ['confirmed', 'approved', 'paid'])
                ->where('user_id', $userId)
                ->where('year', $mStart->year)
                ->where('month', $mStart->month)->get();
            if ($recs->isEmpty()) continue;

            $tSalary   = $recs->sum('base_salary');
            $tWDays    = $recs->sum('working_days');
            if ($tWDays <= 0) continue;
            $dailyRate = $tSalary / $tWDays;

            $assignedHours = \App\Models\ProjectAssignment::where('user_id', $userId)
                ->whereIn('status', ['active', 'upcoming', 'completed'])
                ->where('start_date', '<=', $mEnd->toDateString())
                ->where('end_date',   '>=', $mStart->toDateString())
                ->sum('hours_per_day');

            $overheadRatio = max(0, min(1, ($workHoursDay - $assignedHours) / $workHoursDay));
            if ($overheadRatio <= 0) continue;

            $amount  = $dailyRate * $overheadRatio * $workingDays;
            $overhead += $amount;

            $dept = $users->get($userId)?->department ?? 'Other';
            $deptBreak[$dept] = ($deptBreak[$dept] ?? 0) + $amount;
        }

        return [round($overhead, 2), $deptBreak];
    }

    // ── Revenue portion ──────────────────────────────────────────
    private function calcMonthlyRevenue(Project $project, Carbon $mStart, Carbon $mEnd): float
    {
        if (!$project->contract_value || $project->contract_value <= 0) return 0;
        if (!$project->start_date || !$project->end_date) return (float)$project->contract_value;

        $pStart      = Carbon::parse($project->start_date)->startOfMonth();
        $pEnd        = Carbon::parse($project->end_date)->endOfMonth();
        $totalMonths = max(1, $pStart->diffInMonths($pEnd) + 1);

        $ovStart = $mStart->max($pStart);
        $ovEnd   = $mEnd->min($pEnd);
        if ($ovStart->gt($ovEnd)) return 0;

        $ratio = ($ovStart->diffInDays($ovEnd) + 1) / $mStart->daysInMonth;
        return (float)$project->contract_value / $totalMonths * $ratio;
    }

    // ── OT Cost ──────────────────────────────────────────────────
    private function calcOTCost(int $userId, int $projectId, float $hourlyRate, Carbon $start, Carbon $end): float
    {
        $segments = \App\Models\OvertimeRequestSegment::with('overtimePolicy')
            ->whereHas('overtimeRequest', fn($q) => $q
                ->where('user_id', $userId)->where('project_id', $projectId)->where('status', 'approved'))
            ->whereBetween('segment_date', [$start->toDateString(), $end->toDateString()])
            ->where('hours_approved', '>', 0)->get();

        $total = 0;
        foreach ($segments as $seg) {
            $p = $seg->overtimePolicy;
            $h = (float)$seg->hours_approved;
            $total += match ($p?->rate_type) {
                'multiplier' => $hourlyRate * (float)$p->rate_value * $h,
                'flat'       => (float)$p->rate_value * $h,
                default      => $hourlyRate * 1.5 * $h,
            };
        }
        return $total;
    }

    // ── Leave Cost ───────────────────────────────────────────────
    private function calcLeaveCost(int $userId, int $priority, float $dailyRate, Carbon $start, Carbon $end): float
    {
        $ratio  = match (true) { $priority <= 1 => 1.0, $priority == 2 => 0.5, default => 0.25 };
        $leaves = LeaveRequest::where('user_id', $userId)->where('status', 'approved')
            ->where('is_paid', true)
            ->where('start_date', '<=', $end->toDateString())
            ->where('end_date',   '>=', $start->toDateString())->get();

        $totalDays = 0;
        foreach ($leaves as $l) {
            $ls  = Carbon::parse($l->start_date)->max($start);
            $le  = Carbon::parse($l->end_date)->min($end);
            if ($ls->gt($le)) continue;
            $dur = Carbon::parse($l->start_date)->diffInDays(Carbon::parse($l->end_date)) + 1;
            $ov  = $ls->diffInDays($le) + 1;
            $totalDays += (float)$l->total_days * ($dur > 0 ? $ov / $dur : 1);
        }
        return round($dailyRate * $ratio * $totalDays, 2);
    }

    // ── Working Days ─────────────────────────────────────────────
    private function countWorkingDays(Carbon $start, Carbon $end): int
    {
        if ($start->gt($end)) return 0;
        $days = 0; $cur = $start->copy();
        while ($cur->lte($end)) { if (!$cur->isWeekend()) $days++; $cur->addDay(); }
        return $days;
    }
}