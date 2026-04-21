<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\AttendanceRequest;
use App\Models\ExpenseRequest;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\PayrollRecord;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\PublicHoliday;
use App\Models\SalaryRule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Timezone helper
    // ─────────────────────────────────────────────────────────────────────────
    private function timezone(string $country): string
    {
        return match (strtolower($country)) {
            'cambodia'             => 'Asia/Phnom_Penh',
            'myanmar'              => 'Asia/Rangoon',
            'vietnam'              => 'Asia/Ho_Chi_Minh',
            'japan'                => 'Asia/Tokyo',
            'korea', 'south korea' => 'Asia/Seoul',
            default                => 'UTC',
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Main
    // ─────────────────────────────────────────────────────────────────────────
    public function index()
    {
        $user       = Auth::user();
        $role       = strtolower($user->role?->name ?? 'employee');
        $country    = $user->country;
        $countryId  = $user->country_id ?? $user->countryRecord?->id;
        $department = $user->department;
        $tz         = $this->timezone($country ?? '');
        $today      = Carbon::now($tz)->toDateString();
        $nowStr     = Carbon::now($tz)->toDateTimeString();

        $isAdmin      = $role === 'admin';
        $isHr         = $role === 'hr';
        $isHrAdmin    = in_array($role, ['admin', 'hr'], true);
        $isManagement = $role === 'management';
        $isEmployee   = in_array($role, ['employee', 'member'], true);

        // ── Scope users ────────────────────────────────────────────────────
        $scopeUsersQuery = User::query()->where('is_active', true);
        if ($isHr) {
            $scopeUsersQuery->where('country', $country);
        } elseif ($isManagement) {
            $department
                ? $scopeUsersQuery->where('department', $department)
                : $scopeUsersQuery->where('country', $country);
        } elseif (!$isAdmin) {
            $scopeUsersQuery->where('id', $user->id);
        }
        $scopeUsers   = $scopeUsersQuery->get();
        $scopeUserIds = $scopeUsers->pluck('id');

        // ── Announcements — all roles see active ones ──────────────────────
        $annQuery = Announcement::with('creator:id,name')
            ->where(fn($q) => $q->whereNull('start_at')->orWhere('start_at', '<=', $nowStr))
            ->where(fn($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', $nowStr));
        if (!$isAdmin) {
            $annQuery->where(fn($q) => $q->whereNull('country')->orWhere('country', $country));
        }
        $announcements = $annQuery->orderByDesc('start_at')->get()->map(fn($a) => [
            'id'         => $a->id,
            'title'      => $a->title,
            'content'    => $a->content,
            'country'    => $a->country,
            'start_at'   => $a->start_at?->format('d M Y'),
            'end_at'     => $a->end_at?->format('d M Y'),
            'created_by' => $a->creator?->name,
        ])->values();

        // ── Upcoming holidays ──────────────────────────────────────────────
        $upcomingHolidays = collect();
        if ($countryId) {
            $upcomingHolidays = PublicHoliday::where('country_id', $countryId)
                ->whereDate('date', '>=', $today)
                ->orderBy('date')->limit(5)->get()
                ->map(fn($h) => [
                    'name'      => $h->name,
                    'date'      => Carbon::parse($h->date)->format('d M Y'),
                    'day'       => Carbon::parse($h->date)->format('d'),
                    'month'     => Carbon::parse($h->date)->format('M'),
                    'days_left' => (int) Carbon::now($tz)->diffInDays(Carbon::parse($h->date), false),
                ]);
        }

        // ── Birthdays this week ────────────────────────────────────────────
        $weekStart = Carbon::now($tz)->startOfWeek();
        $weekEnd   = Carbon::now($tz)->endOfWeek();
        $thisYear  = Carbon::now($tz)->year;
        $birthdaysThisWeek = $scopeUsers
            ->filter(fn($u) => !empty($u->date_of_birth))
            ->filter(function ($u) use ($weekStart, $weekEnd, $thisYear) {
                $dob      = Carbon::parse($u->date_of_birth);
                $birthday = Carbon::createFromDate($thisYear, $dob->month, $dob->day);
                return $birthday->between($weekStart, $weekEnd);
            })
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'department' => $u->department,
                'date'       => Carbon::parse($u->date_of_birth)->format('d M'),
            ])->values();

        // ── ⑧ On leave today — properly filtered (start_date <= today <= end_date) ─
        // Using distinct user_id to avoid duplicates when user has overlapping leaves
        $onLeaveTodayIds = LeaveRequest::whereIn('user_id', $scopeUserIds)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->pluck('user_id')
            ->unique();

        $onLeaveToday = User::whereIn('id', $onLeaveTodayIds)->get()->map(function ($u) use ($today) {
            // Get the specific leave record for today
            $leave = LeaveRequest::where('user_id', $u->id)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today)
                ->first();
            return [
                'id'         => $u->id,
                'name'       => $u->name,
                'department' => $u->department,
                'leave_type' => $leave?->leave_type ?? 'leave',
            ];
        })->values();

        // ─────────────────────────────────────────────────────────────────
        // HR / Admin / Management data
        // ─────────────────────────────────────────────────────────────────
        $orgSummary      = [];
        $teamSummary     = [];
        $approvalQueue   = [];
        $employmentChart = [];
        $departmentChart = [];
        $monthlyAttendance = [];
        $probationAlerts = [];
        $contractAlerts  = [];
        $leaveUsageChart  = [];
        $otByProjectChart = [];
        $chronicallyLate  = [];
        $payrollTrend     = collect();

        if ($isHrAdmin || $isManagement) {

            // ── Attendance stats ───────────────────────────────────────────
            $presentToday = AttendanceRecord::whereIn('user_id', $scopeUserIds)
                ->where('date', $today)->whereIn('status', ['present', 'late'])->count();
            $onLeaveTodayCount = $onLeaveTodayIds->count();
            $yesterday = Carbon::now($tz)->subDay()->toDateString();
            $presentYesterday = AttendanceRecord::whereIn('user_id', $scopeUserIds)
                ->where('date', $yesterday)->whereIn('status', ['present', 'late'])->count();
            $attendanceRate = $scopeUsers->count() > 0
                ? round(($presentToday / $scopeUsers->count()) * 100, 1) : 0;

            // ── OT hours this month ────────────────────────────────────────
            $otHoursMonth = (float) OvertimeRequest::whereIn('user_id', $scopeUserIds)
                ->where('status', 'approved')
                ->whereYear('start_date', Carbon::now($tz)->year)
                ->whereMonth('start_date', Carbon::now($tz)->month)
                ->sum('hours_approved');

            // ── Leave rate ─────────────────────────────────────────────────
            $leaveDaysThisMonth = (float) LeaveRequest::whereIn('user_id', $scopeUserIds)
                ->where('status', 'approved')
                ->whereYear('start_date', Carbon::now($tz)->year)
                ->whereMonth('start_date', Carbon::now($tz)->month)
                ->sum('total_days');
            $leaveRate = ($scopeUsers->count() * 22) > 0
                ? round(($leaveDaysThisMonth / ($scopeUsers->count() * 22)) * 100, 1) : 0;

            // ── Turnover ───────────────────────────────────────────────────
            $quarterStart    = Carbon::now($tz)->startOfQuarter()->toDateString();
            $joinedQuarter   = $scopeUsers->filter(fn($u) => $u->joined_date && $u->joined_date >= $quarterStart)->count();
            $resignedQuarter = User::where('is_active', false)->where('updated_at', '>=', $quarterStart)
                ->when($isHr, fn($q) => $q->where('country', $country))->count();
            $turnoverRate = ($scopeUsers->count() + $resignedQuarter) > 0
                ? round(($resignedQuarter / ($scopeUsers->count() + $resignedQuarter)) * 100, 1) : 0;

            // ── Employment mix ─────────────────────────────────────────────
            $permanentCount = $scopeUsers->where('employment_type', 'permanent')->count();
            $probationCount = $scopeUsers->where('employment_type', 'probation')->count();
            $contractCount  = $scopeUsers->where('employment_type', 'contract')->count();
            $employmentChart = [
                ['label' => 'Permanent', 'value' => $permanentCount, 'color' => '#2563eb'], // blue
                ['label' => 'Probation', 'value' => $probationCount, 'color' => '#dc2626'], // red
                ['label' => 'Contract',  'value' => $contractCount,  'color' => '#059669'], // green
            ];

            // ── Department chart ───────────────────────────────────────────
            $departmentChart = $scopeUsers
                ->groupBy(fn($u) => $u->department ?: 'No Dept')
                ->map(fn($g, $label) => ['label' => $label, 'value' => $g->count()])
                ->sortByDesc('value')->take(8)->values()->toArray();

            // ── ⑥ Monthly attendance — every day of current month ──────────
            $monthStart = Carbon::now($tz)->startOfMonth();
            $monthEnd   = Carbon::now($tz)->endOfMonth();
            $monthlyAttendance = collect();
            for ($d = $monthStart->copy(); $d->lte($monthEnd) && $d->lte(Carbon::now($tz)); $d->addDay()) {
                $dateStr = $d->toDateString();
                $present = AttendanceRecord::whereIn('user_id', $scopeUserIds)
                    ->where('date', $dateStr)->whereIn('status', ['present', 'late'])->count();
                $monthlyAttendance->push([
                    'date'    => $dateStr,
                    'day'     => $d->format('d'),
                    'present' => $present,
                    'weekend' => $d->isWeekend(),
                    'isToday' => $dateStr === $today,
                ]);
            }
            $monthlyAttendance = $monthlyAttendance->values();

            // ── Probation alerts ───────────────────────────────────────────
            $salaryRule    = $countryId ? SalaryRule::where('country_id', $countryId)->first() : null;
            $probationDays = $salaryRule?->probation_days ?? 90;
            $probationAlerts = [];
            foreach ($scopeUsers->where('employment_type', 'probation') as $emp) {
                if (!$emp->joined_date) continue;
                $end      = Carbon::parse($emp->joined_date)->addDays($probationDays);
                $daysLeft = (int) Carbon::now($tz)->diffInDays($end, false);
                if ($daysLeft >= 0 && $daysLeft <= 10) {
                    $probationAlerts[] = ['id' => $emp->id, 'name' => $emp->name, 'department' => $emp->department, 'country' => $emp->country, 'days_left' => $daysLeft, 'probation_end' => $end->toDateString()];
                }
            }
            usort($probationAlerts, fn($a, $b) => $a['days_left'] - $b['days_left']);

            // ── Contract alerts ────────────────────────────────────────────
            $contractAlerts = [];
            foreach ($scopeUsers->where('employment_type', 'contract') as $emp) {
                if (!$emp->contract_end_date) continue;
                $end      = Carbon::parse($emp->contract_end_date);
                $daysLeft = (int) Carbon::now($tz)->diffInDays($end, false);
                if ($daysLeft >= 0 && $daysLeft <= 30) {
                    $contractAlerts[] = ['id' => $emp->id, 'name' => $emp->name, 'department' => $emp->department, 'country' => $emp->country, 'days_left' => $daysLeft, 'contract_end' => $end->toDateString()];
                }
            }
            usort($contractAlerts, fn($a, $b) => $a['days_left'] - $b['days_left']);

            // ── ④ Leave usage chart — top 20 employees this month ──────────
            $leaveUsageChart = LeaveRequest::selectRaw('user_id, SUM(total_days) as total_days, MIN(start_date) as first_date, MAX(end_date) as last_date')
                ->whereIn('user_id', $scopeUserIds)
                ->where('status', 'approved')
                ->whereYear('start_date', Carbon::now($tz)->year)
                ->whereMonth('start_date', Carbon::now($tz)->month)
                ->groupBy('user_id')
                ->orderByDesc('total_days')
                ->limit(20)->get()
                ->map(function ($row) {
                    $u = User::find($row->user_id);
                    return [
                        'name'       => $u?->name,
                        'department' => $u?->department,
                        'total_days' => (float) $row->total_days,
                        'date_range' => $row->first_date . ' – ' . $row->last_date,
                    ];
                })->filter(fn($r) => $r['name'])->values()->toArray();

            // ── ⑤ OT by active project — via project_assignments ──────────
            // Get active project IDs
            $activeProjectIds = Project::where('status', 'active')->pluck('id');

            // Get user→project mapping from active assignments
            $assignments = ProjectAssignment::whereIn('project_id', $activeProjectIds)
                ->whereIn('user_id', $scopeUserIds)
                ->whereIn('status', ['active', 'upcoming'])
                ->with('project:id,name')->get();

            // For each active project, sum OT hours of assigned employees this month
            $otByProjectRaw = [];
            foreach ($assignments->groupBy('project_id') as $projectId => $assigns) {
                $projectUserIds = $assigns->pluck('user_id')->unique();
                $projectName    = $assigns->first()?->project?->name ?? "Project #{$projectId}";
                $otHours = (float) OvertimeRequest::whereIn('user_id', $projectUserIds)
                    ->where('status', 'approved')
                    ->whereYear('start_date', Carbon::now($tz)->year)
                    ->whereMonth('start_date', Carbon::now($tz)->month)
                    ->sum('hours_approved');
                if ($otHours > 0) {
                    $otByProjectRaw[] = ['project_name' => $projectName, 'ot_hours' => round($otHours, 1)];
                }
            }
            usort($otByProjectRaw, fn($a, $b) => $b['ot_hours'] <=> $a['ot_hours']);
            $otByProjectChart = array_slice($otByProjectRaw, 0, 10);

            // ── ⑦ Chronically late — top 20 sorted by count ───────────────
            $chronicallyLate = AttendanceRecord::selectRaw('user_id, COUNT(*) as late_count, AVG(late_minutes) as avg_late_minutes')
                ->whereIn('user_id', $scopeUserIds)
                ->where('status', 'late')
                ->whereYear('date', Carbon::now($tz)->year)
                ->whereMonth('date', Carbon::now($tz)->month)
                ->groupBy('user_id')
                ->orderByDesc('late_count')
                ->limit(20)->get()
                ->map(function ($row) {
                    $u = User::find($row->user_id);
                    return ['id' => $row->user_id, 'name' => $u?->name, 'department' => $u?->department, 'late_count' => $row->late_count, 'avg_late_minutes' => (int) round($row->avg_late_minutes)];
                })->filter(fn($r) => $r['name'])->values()->toArray();

            // ── Payroll trend (last 6 months) ─────────────────────────────
            // payroll_records.year + month columns track which period the record belongs to
            $payrollTrend = collect();
            for ($i = 5; $i >= 0; $i--) {
                $m = Carbon::now($tz)->subMonths($i);
                $q = PayrollRecord::where('year', $m->year)
                    ->where('month', $m->month)
                    ->whereIn('user_id', $scopeUserIds);
                $payrollTrend->push([
                    'month' => $m->format('M'),
                    'count' => $q->count(),
                    'total' => (float) $q->sum('net_salary'),
                ]);
            }

            // ── ③ Pending approval lists — 4 types ────────────────────────
            // Leave — include raw fields for frontend modal
            $pendingLeaveList = LeaveRequest::with('user:id,name,department')
                ->where('approver_id', $user->id)->where('status', 'pending')
                ->latest()->limit(10)->get()
                ->map(fn($l) => [
                    'id'         => $l->id,
                    'name'       => $l->user?->name,
                    'department' => $l->user?->department,
                    'type'       => 'leave',
                    // raw fields — frontend ApprovalItemRow / ApprovalConfirmModal reads these
                    'leave_type' => $l->leave_type,
                    'start_date' => $l->start_date ? $l->start_date->toDateString() : null,
                    'end_date'   => $l->end_date   ? $l->end_date->toDateString()   : null,
                    'total_days' => (float)$l->total_days == (int)$l->total_days ? (int)$l->total_days : (float)$l->total_days,
                    'note'          => $l->note,
                    'status'        => $l->status,
                    'document_path' => $l->document_path,
                ])->filter(fn($r) => $r['name'])->values()->toArray();

            // OT — include segments with policy for frontend segment-adjust modal
            $pendingOtList = OvertimeRequest::with([
                    'user:id,name,department',
                    'segments.overtimePolicy',
                ])
                ->where('approver_id', $user->id)->where('status', 'pending')
                ->latest()->limit(8)->get()
                ->map(fn($ot) => [
                    'id'              => $ot->id,
                    'name'            => $ot->user?->name,
                    'department'      => $ot->user?->department,
                    'type'            => 'ot',
                    // raw fields
                    'start_date'      => $ot->start_date ? (is_string($ot->start_date) ? $ot->start_date : $ot->start_date->toDateString()) : null,
                    'end_date'        => $ot->end_date   ? (is_string($ot->end_date)   ? $ot->end_date   : $ot->end_date->toDateString())   : null,
                    'start_time'      => $ot->start_time ? substr($ot->start_time, 0, 5) : null,
                    'end_time'        => $ot->end_time   ? substr($ot->end_time,   0, 5) : null,
                    'hours_requested' => $ot->hours_requested,
                    'reason'          => $ot->reason,
                    // segments for adjust
                    'segments'        => $ot->segments->map(fn($s) => [
                        'id'               => $s->id,
                        'segment_date'     => $s->segment_date ? (is_string($s->segment_date) ? $s->segment_date : $s->segment_date->toDateString()) : null,
                        'start_time'       => $s->start_time ? substr($s->start_time, 0, 5) : null,
                        'end_time'         => $s->end_time   ? substr($s->end_time,   0, 5) : null,
                        'hours'            => $s->hours,
                        'hours_approved'   => $s->hours_approved,
                        'overtime_policy'  => $s->overtimePolicy ? ['id' => $s->overtimePolicy->id, 'title' => $s->overtimePolicy->title] : null,
                    ])->values()->toArray(),
                ])->filter(fn($r) => $r['name'])->values()->toArray();

            // Attendance requests — raw fields for frontend modal
            $pendingAttendanceList = [];
            if (class_exists(\App\Models\AttendanceRequest::class)) {
                $pendingAttendanceList = \App\Models\AttendanceRequest::with('user:id,name,department')
                    ->where('approver_id', $user->id)->where('status', 'pending')
                    ->latest()->limit(8)->get()
                    ->map(fn($ar) => [
                        'id'                         => $ar->id,
                        'name'                       => $ar->user?->name,
                        'department'                 => $ar->user?->department,
                        'type'                       => 'attendance',
                        // raw fields
                        'date'                       => $ar->date ? (is_string($ar->date) ? $ar->date : $ar->date->toDateString()) : null,
                        'requested_check_in_time'    => $ar->requested_check_in_time  ? substr($ar->requested_check_in_time,  0, 5) : null,
                        'requested_check_out_time'   => $ar->requested_check_out_time ? substr($ar->requested_check_out_time, 0, 5) : null,
                        'requested_work_hours'       => $ar->requested_work_hours,
                        'requested_late_minutes'     => $ar->requested_late_minutes ?? 0,
                        'note'                       => $ar->note,
                    ])->filter(fn($r) => $r['name'])->values()->toArray();
            }

            // Expense requests — raw fields + attachments for frontend modal
            $pendingExpenseList = [];
            if (class_exists(\App\Models\ExpenseRequest::class)) {
                $pendingExpenseList = \App\Models\ExpenseRequest::with('user:id,name,department')
                    ->where('approver_id', $user->id)->where('status', 'pending')
                    ->latest()->limit(8)->get()
                    ->map(fn($ex) => [
                        'id'           => $ex->id,
                        'name'         => $ex->user?->name,
                        'department'   => $ex->user?->department,
                        'type'         => 'expense',
                        // raw fields
                        'title'        => $ex->title,
                        'amount'       => $ex->amount,
                        'currency'     => $ex->currency ?? 'USD',
                        'category'     => $ex->category,
                        'expense_date' => $ex->expense_date ? (is_string($ex->expense_date) ? $ex->expense_date : $ex->expense_date->toDateString()) : null,
                        'description'  => $ex->description,
                        'attachments'  => is_array($ex->attachments) ? $ex->attachments : (json_decode($ex->attachments, true) ?? []),
                    ])->filter(fn($r) => $r['name'])->values()->toArray();
            }

            $approvalQueue = [
                'pending_leave_requests'      => LeaveRequest::where('approver_id', $user->id)->where('status', 'pending')->count(),
                'pending_ot_requests'         => OvertimeRequest::where('approver_id', $user->id)->where('status', 'pending')->count(),
                'pending_attendance_requests' => class_exists(\App\Models\AttendanceRequest::class) ? \App\Models\AttendanceRequest::where('approver_id', $user->id)->where('status', 'pending')->count() : 0,
                'pending_expense_requests'    => class_exists(\App\Models\ExpenseRequest::class) ? \App\Models\ExpenseRequest::where('approver_id', $user->id)->where('status', 'pending')->count() : 0,
                'pending_leave_list'          => $pendingLeaveList,
                'pending_ot_list'             => $pendingOtList,
                'pending_attendance_list'     => $pendingAttendanceList,
                'pending_expense_list'        => $pendingExpenseList,
            ];

            // ── orgSummary ─────────────────────────────────────────────────
            $orgSummary = [
                'total_employees'   => $scopeUsers->count(),
                'total_departments' => $scopeUsers->pluck('department')->filter()->unique()->count(),
                'present_today'     => $presentToday,
                'absent_today'      => max(0, $scopeUsers->count() - $presentToday - $onLeaveTodayCount),
                'absent_delta'      => max(0, $scopeUsers->count() - $presentToday) - max(0, $scopeUsers->count() - $presentYesterday),
                'attendance_rate'   => $attendanceRate,
                'ot_hours_month'    => round($otHoursMonth, 1),
                'leave_rate'        => $leaveRate,
                'permanent'         => $permanentCount,
                'probation'         => $probationCount,
                'contract'          => $contractCount,
                'joined_quarter'    => $joinedQuarter,
                'resigned_quarter'  => $resignedQuarter,
                'turnover_rate'     => $turnoverRate,
                'country'           => $country,
                'on_leave_today'    => $onLeaveTodayCount,
            ];

            $teamSummary = [
                'headcount'       => $scopeUsers->count(),
                'present_today'   => $presentToday,
                'on_leave_today'  => $onLeaveTodayCount,
                'attendance_rate' => $attendanceRate,
                'ot_hours_month'  => round($otHoursMonth, 1),
                'permanent'       => $permanentCount,
                'probation'       => $probationCount,
                'contract'        => $contractCount,
            ];
        }

        // ─────────────────────────────────────────────────────────────────
        // Personal / Employee data
        // ─────────────────────────────────────────────────────────────────
        $myStats      = [];
        $todayStatus  = [];
        $weeklyAttend = collect();

        // Today attendance status
        $todayAtt    = AttendanceRecord::where('user_id', $user->id)->where('date', $today)->first();
        $todayStatus = ['checked_in' => (bool) $todayAtt, 'check_in' => $todayAtt?->check_in_time, 'check_out' => $todayAtt?->check_out_time, 'work_hours' => $todayAtt ? round((float) $todayAtt->work_hours_actual, 1) : 0];

        // Weekly attendance (personal)
        $weeklyAttend = collect(range(6, 0))->map(function ($offset) use ($user, $tz) {
            $date   = Carbon::now($tz)->subDays($offset)->toDateString();
            $record = AttendanceRecord::where('user_id', $user->id)->where('date', $date)->first();
            return ['label' => Carbon::parse($date)->format('D'), 'value' => $record ? (float) ($record->work_hours_actual ?? 0) : 0, 'absent' => !$record];
        })->values();

        // Stats
        $presentDays     = AttendanceRecord::where('user_id', $user->id)->whereYear('date', Carbon::now($tz)->year)->whereMonth('date', Carbon::now($tz)->month)->whereIn('status', ['present', 'late'])->count();
        $absentDays      = AttendanceRecord::where('user_id', $user->id)->whereYear('date', Carbon::now($tz)->year)->whereMonth('date', Carbon::now($tz)->month)->where('status', 'absent')->count();
        $pendingLeaves   = LeaveRequest::where('user_id', $user->id)->where('status', 'pending')->count();
        $otHoursPersonal = (float) OvertimeRequest::where('user_id', $user->id)->where('status', 'approved')->whereYear('start_date', Carbon::now($tz)->year)->whereMonth('start_date', Carbon::now($tz)->month)->sum('hours_approved');
        $latestPayroll   = PayrollRecord::where('user_id', $user->id)->orderByDesc('created_at')->first();

        // Leave balances
        $leaveBalances = \App\Models\LeaveBalance::where('user_id', $user->id)->where('year', Carbon::now($tz)->year)->get()
            ->map(fn($lb) => ['type' => ucfirst($lb->leave_type), 'remaining' => (float) $lb->remaining_days, 'entitled' => (float) $lb->entitled_days, 'used' => (float) $lb->used_days])->values()->toArray();

        // Personal late stats (this month)
        $lateRow = AttendanceRecord::selectRaw('COUNT(*) as late_count, AVG(late_minutes) as avg_late_minutes')
            ->where('user_id', $user->id)->where('status', 'late')
            ->whereYear('date', Carbon::now($tz)->year)->whereMonth('date', Carbon::now($tz)->month)
            ->first();

        // My pending requests (employee view)
        $myPendingList = [];
        $myPendingLeave = LeaveRequest::where('user_id', $user->id)->where('status', 'pending')->latest()->limit(5)->get()
            ->map(fn($l) => ['id' => $l->id, 'type' => 'leave', 'detail' => ucfirst($l->leave_type) . ' · ' . $l->start_date . ' – ' . $l->end_date . ' · ' . $l->total_days . 'd', 'submitted_at' => $l->created_at?->format('d M Y')])->toArray();
        $myPendingOt = OvertimeRequest::where('user_id', $user->id)->where('status', 'pending')->latest()->limit(5)->get()
            ->map(fn($ot) => ['id' => $ot->id, 'type' => 'ot', 'detail' => 'OT request · ' . $ot->start_date . ' · ' . $ot->hours_requested . 'h', 'submitted_at' => $ot->created_at?->format('d M Y')])->toArray();
        $myPendingAttendance = class_exists(\App\Models\AttendanceRequest::class)
            ? \App\Models\AttendanceRequest::where('user_id', $user->id)->where('status', 'pending')->latest()->limit(5)->get()
                ->map(fn($ar) => ['id' => $ar->id, 'type' => 'attendance', 'detail' => 'Attendance correction · ' . ($ar->date ? (is_string($ar->date) ? $ar->date : $ar->date->toDateString()) : '—'), 'submitted_at' => $ar->created_at?->format('d M Y')])->toArray()
            : [];
        $myPendingExpense = class_exists(\App\Models\ExpenseRequest::class)
            ? \App\Models\ExpenseRequest::where('user_id', $user->id)->where('status', 'pending')->latest()->limit(5)->get()
                ->map(fn($ex) => ['id' => $ex->id, 'type' => 'expense', 'detail' => $ex->title . ' · ' . $ex->currency . ' ' . number_format($ex->amount, 2) . ' · ' . ($ex->expense_date ? (is_string($ex->expense_date) ? $ex->expense_date : $ex->expense_date->toDateString()) : '—'), 'submitted_at' => $ex->created_at?->format('d M Y')])->toArray()
            : [];
        $myPendingList = array_merge($myPendingLeave, $myPendingOt, $myPendingAttendance, $myPendingExpense);

        $myStats = [
            'present_days'      => $presentDays,
            'absent_days'       => $absentDays,
            'pending_leaves'    => $pendingLeaves,
            'ot_hours_month'    => round($otHoursPersonal, 1),
            'net_salary'        => $latestPayroll?->net_salary,
            'base_salary'       => $latestPayroll?->base_salary,
            'overtime_amount'   => $latestPayroll?->overtime_amount,
            'total_allowances'  => $latestPayroll?->total_allowances,
            'total_deductions'  => $latestPayroll?->total_deductions,
            'payslip_status'    => $latestPayroll?->status,
            'payslip_period'    => $latestPayroll ? Carbon::parse($latestPayroll->created_at)->format('M Y') : null,
            'leave_balances'    => $leaveBalances,
            'late_count'        => $lateRow?->late_count ?? 0,
            'avg_late_minutes'  => (int) round($lateRow?->avg_late_minutes ?? 0),
        ];

        // Add my pending list to approvalQueue for employee view
        if ($isEmployee) {
            $approvalQueue = ['my_pending_list' => $myPendingList];
        }

        // ─────────────────────────────────────────────────────────────────
        // Render
        // ─────────────────────────────────────────────────────────────────
        return Inertia::render('Dashboard', [
            'dashboardMode'    => $isHrAdmin ? 'organization' : ($isManagement ? 'management' : 'personal'),
            'roleName'         => $role,

            // All roles
            'announcements'    => $announcements,
            'upcomingHolidays' => $upcomingHolidays,
            'birthdaysThisWeek'=> $birthdaysThisWeek,
            'onLeaveToday'     => $onLeaveToday,

            // HR/Admin/Management
            'orgSummary'       => $orgSummary,
            'teamSummary'      => $teamSummary,
            'approvalQueue'    => $approvalQueue,
            'employmentChart'  => $employmentChart,
            'departmentChart'  => $departmentChart,
            'monthlyAttendance'=> $monthlyAttendance,
            'probationAlerts'  => $probationAlerts,
            'contractAlerts'   => $contractAlerts,
            'leaveUsageChart'  => $leaveUsageChart,
            'otByProjectChart' => $otByProjectChart,
            'chronicallyLate'  => $chronicallyLate,
            'payrollTrend'     => $payrollTrend,

            // Personal
            'myStats'          => $myStats,
            'todayStatus'      => $todayStatus,
            'weeklyAttendance' => $weeklyAttend,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Store announcement
    // ─────────────────────────────────────────────────────────────────────────
    public function storeAnnouncement(Request $request)
    {
        $user = Auth::user();
        $role = strtolower($user->role?->name ?? 'employee');
        abort_unless(in_array($role, ['admin', 'hr'], true), 403);

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'content'  => 'required|string',
            'start_at' => 'required|date',
            'end_at'   => 'required|date|after:start_at',
        ]);

        Announcement::create([
            'created_by' => $user->id,
            'title'      => $validated['title'],
            'content'    => $validated['content'],
            'country'    => $role === 'hr' ? $user->country : null,
            'start_at'   => $validated['start_at'],
            'end_at'     => $validated['end_at'],
        ]);

        return back()->with('success', 'Announcement created.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Delete announcement
    // ─────────────────────────────────────────────────────────────────────────
    public function deleteAnnouncement(Announcement $announcement)
    {
        $user = Auth::user();
        $role = strtolower($user->role?->name ?? 'employee');
        abort_unless(in_array($role, ['admin', 'hr'], true), 403);
        if ($role === 'hr' && $announcement->country !== $user->country) abort(403);
        $announcement->delete();
        return back()->with('success', 'Announcement deleted.');
    }
}