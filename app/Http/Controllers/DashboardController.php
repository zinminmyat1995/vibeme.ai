<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\PayrollRecord;
use App\Models\PublicHoliday;
use App\Models\SalaryRule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $role = strtolower($user->role?->name ?? 'employee');
        $country = $user->country;
        $countryId = $user->countryRecord?->id;
        $department = $user->department;
        $timezoneMap = [
            'cambodia'    => 'Asia/Phnom_Penh',
            'myanmar'     => 'Asia/Rangoon',
            'vietnam'     => 'Asia/Ho_Chi_Minh',
            'japan'       => 'Asia/Tokyo',
            'korea'       => 'Asia/Seoul',
            'south korea' => 'Asia/Seoul',

        ];

        $userTimezone = $timezoneMap[strtolower($country ?? '')] ?? 'UTC';
        $nowString    = Carbon::now($userTimezone)->toDateTimeString();
        $today        = Carbon::now($userTimezone)->toDateString();

        $isHrAdmin = in_array($role, ['admin', 'hr'], true);
        $isManagement = $role === 'management';

        $announcementsQuery = Announcement::with('creator:id,name')
            ->where(function ($q) use ($nowString) {
                $q->whereNull('start_at')->orWhere('start_at', '<=', $nowString);
            })
            ->where(function ($q) use ($nowString) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', $nowString);
            });

        if ($role !== 'admin') {
            $announcementsQuery->where(function ($q) use ($country) {
                $q->whereNull('country')->orWhere('country', $country);
            });
        }

        $announcements = $announcementsQuery
            ->orderByDesc('start_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'content' => $item->content,
                'country' => $item->country,
                'start_at' => optional($item->start_at)->toDateTimeString(),
                'end_at' => optional($item->end_at)->toDateTimeString(),
                'created_by' => $item->creator?->name,
            ])
            ->values();

        $heroAnnouncement = $announcements->first();

        $scopeUsersQuery = User::query()->where('is_active', true);

        if ($role === 'hr') {
            $scopeUsersQuery->where('country', $country);
        } elseif ($isManagement) {
            if ($department) {
                $scopeUsersQuery->where('department', $department);
            } elseif ($country) {
                $scopeUsersQuery->where('country', $country);
            }
        }

        $scopeUsers = $scopeUsersQuery->get();
        $employeeStats = [
            'total' => $scopeUsers->count(),
            'probation' => $scopeUsers->where('employment_type', 'probation')->count(),
            'contract' => $scopeUsers->where('employment_type', 'contract')->count(),
            'permanent' => $scopeUsers->where('employment_type', 'permanent')->count(),
        ];

        $employmentChart = [
            ['label' => 'Permanent', 'value' => $employeeStats['permanent'], 'color' => '#10b981'],
            ['label' => 'Probation', 'value' => $employeeStats['probation'], 'color' => '#f59e0b'],
            ['label' => 'Contract', 'value' => $employeeStats['contract'], 'color' => '#3b82f6'],
        ];

        $departmentChart = $scopeUsers
            ->groupBy(fn ($item) => $item->department ?: 'No Dept')
            ->map(fn ($group, $label) => ['label' => $label, 'value' => $group->count()])
            ->sortByDesc('value')
            ->take(6)
            ->values();

        $orgSummary = [
            'total_employees' => $employeeStats['total'],
            'total_departments' => $scopeUsers->pluck('department')->filter()->unique()->count(),
        ];

        $teamSummary = [
            'headcount' => $scopeUsers->count(),
            'present_today' => AttendanceRecord::whereIn('user_id', $scopeUsers->pluck('id'))
                ->where('date', $today)
                ->whereIn('status', ['present', 'late'])
                ->count(),
            'on_leave_today' => LeaveRequest::whereIn('user_id', $scopeUsers->pluck('id'))
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today)
                ->count(),
        ];

        $approvalQueue = [
            'pending_leave_requests' => LeaveRequest::where('approver_id', $user->id)->where('status', 'pending')->count(),
            'pending_ot_requests' => OvertimeRequest::where('approver_id', $user->id)->where('status', 'pending')->count(),
        ];

        $salaryRule = $countryId ? SalaryRule::where('country_id', $countryId)->first() : null;
        $probationDays = $salaryRule?->probation_days ?? 90;
        $probationAlerts = [];
        $contractAlerts = [];

        foreach ($scopeUsers->where('employment_type', 'probation') as $employee) {
            if (!$employee->joined_date) {
                continue;
            }

            $probationEnd = Carbon::parse($employee->joined_date)->addDays($probationDays);
            $daysLeft = (int) now()->diffInDays($probationEnd, false);

            if ($daysLeft >= 0 && $daysLeft <= 10) {
                $probationAlerts[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'department' => $employee->department,
                    'days_left' => $daysLeft,
                    'probation_end' => $probationEnd->toDateString(),
                ];
            }
        }

        foreach ($scopeUsers->where('employment_type', 'contract') as $employee) {
            if (!$employee->contract_end_date) {
                continue;
            }

            $contractEnd = Carbon::parse($employee->contract_end_date);
            $daysLeft = (int) now()->diffInDays($contractEnd, false);

            if ($daysLeft >= 0 && $daysLeft <= 30) {
                $contractAlerts[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'department' => $employee->department,
                    'days_left' => $daysLeft,
                    'contract_end' => $contractEnd->toDateString(),
                ];
            }
        }

        $payrollTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $query = PayrollRecord::query()
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month);

            if ($role === 'hr') {
                $query->whereHas('user', fn ($q) => $q->where('country', $country));
            } elseif ($isManagement) {
                $userIds = $scopeUsers->pluck('id');
                $query->whereIn('user_id', $userIds);
            }

            $payrollTrend->push([
                'month' => $month->format('M'),
                'count' => $query->count(),
                'total' => (float) $query->sum('net_salary'),
            ]);
        }

        $attendanceTrend = collect(range(0, 6))->map(function ($offset) use ($scopeUsers) {
            $date = now()->subDays(6 - $offset)->toDateString();  // 6 days ago → today
            $present = AttendanceRecord::whereIn('user_id', $scopeUsers->pluck('id'))
                ->where('date', $date)
                ->whereIn('status', ['present', 'late'])
                ->count();

            return [
                'label' => Carbon::parse($date)->format('D'),
                'value' => $present,
            ];
        })->values();

        $pendingLeaves = LeaveRequest::where('user_id', $user->id)->where('status', 'pending')->count();

        $otHours = OvertimeRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereMonth('start_date', now()->month)
            ->whereYear('start_date', now()->year)
            ->get()
            ->flatMap(fn ($record) => $record->segments)
            ->sum('hours_approved');

        $latestPayroll = PayrollRecord::where('user_id', $user->id)->latest()->first();

        $presentDays = AttendanceRecord::where('user_id', $user->id)
            ->whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
            ->whereIn('status', ['present', 'late'])
            ->count();

        $myStats = [
            'pending_leaves' => $pendingLeaves,
            'ot_hours_month' => round((float) $otHours, 1),
            'present_days' => $presentDays,
            'payslip_status' => $latestPayroll?->status,
            'net_salary' => $latestPayroll?->net_salary,
        ];

        $todayAttendance = AttendanceRecord::where('user_id', $user->id)->where('date', $today)->first();
        $todayStatus = [
            'checked_in' => (bool) $todayAttendance,
            'check_in' => $todayAttendance?->check_in_time,
            'check_out' => $todayAttendance?->check_out_time,
        ];

        $weeklyAttendance = collect(range(0, 6))->map(function ($offset) use ($user) {
            $date = now()->subDays(6 - $offset)->toDateString();  // 6 days ago → today
            $record = AttendanceRecord::where('user_id', $user->id)
                ->where('date', $date)
                ->first();

            $hours = $record ? (float) ($record->work_hours_actual ?? 0) : null;

            return [
                'label'  => Carbon::parse($date)->format('D'),
                'value'  => $hours ?? 0,
                'absent' => is_null($hours),
                'hours'  => $hours,
            ];
        })->values();

        $upcomingHolidays = [];
        if ($countryId) {
            $upcomingHolidays = PublicHoliday::where('country_id', $countryId)
                ->whereDate('date', '>', $today)
                ->orderBy('date')
                ->limit(4)
                ->get()
                ->map(fn ($holiday) => [
                    'name' => $holiday->name,
                    'date' => Carbon::parse($holiday->date)->format('d M'),
                ]);
        }

        // ── Birthdays this week ──
        $birthdaysThisWeek = [];
        $weekStart = Carbon::now($userTimezone)->startOfWeek()->format('m-d');
        $weekEnd   = Carbon::now($userTimezone)->endOfWeek()->format('m-d');

        $birthdaysThisWeek = $scopeUsers
            ->filter(fn($u) => !empty($u->date_of_birth))
            ->filter(function($u) use ($userTimezone) {
                $dob        = Carbon::parse($u->date_of_birth);
                $thisYear   = Carbon::now($userTimezone)->year;
                $birthday   = Carbon::createFromDate($thisYear, $dob->month, $dob->day);
                $weekStart  = Carbon::now($userTimezone)->startOfWeek();
                $weekEnd    = Carbon::now($userTimezone)->endOfWeek();
                return $birthday->between($weekStart, $weekEnd);
            })
            ->map(fn($u) => [
                'id'            => $u->id,
                'name'          => $u->name,
                'department'    => $u->department,
                'birthday_date' => Carbon::parse($u->date_of_birth)->format('d M'),
            ])
            ->values();

        // ── On leave today ──
        $onLeaveToday = LeaveRequest::with('user:id,name,department')
            ->whereIn('user_id', $scopeUsers->pluck('id'))
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->get()
            ->map(fn($leave) => [
                'id'         => $leave->user?->id,
                'name'       => $leave->user?->name,
                'department' => $leave->user?->department,
                'leave_type' => $leave->leave_type ?? 'Leave',
            ])
            ->values();

        return Inertia::render('Dashboard', [
            'dashboardMode' => $isHrAdmin ? 'organization' : ($isManagement ? 'management' : 'personal'),
            'roleName' => $role,
            'heroAnnouncement' => $heroAnnouncement,
            'announcements' => $announcements,
            'orgSummary' => $orgSummary,
            'teamSummary' => $teamSummary,
            'approvalQueue' => $approvalQueue,
            'employeeStats' => $employeeStats,
            'employmentChart' => $employmentChart,
            'departmentChart' => $departmentChart,
            'payrollTrend' => $payrollTrend,
            'attendanceTrend' => $attendanceTrend,
            'probationAlerts' => $probationAlerts,
            'contractAlerts' => $contractAlerts,
            'myStats' => $myStats,
            'todayStatus' => $todayStatus,
            'upcomingHolidays' => $upcomingHolidays,
            'weeklyAttendance' => $weeklyAttendance,
            'birthdaysThisWeek' => $birthdaysThisWeek,
            'onLeaveToday'      => $onLeaveToday,
        ]);
    }

    public function storeAnnouncement(Request $request)
    {
        $user = Auth::user();
        $role = strtolower($user->role?->name ?? 'employee');

        abort_unless(in_array($role, ['admin', 'hr'], true), 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after:start_at',
        ]);

        Announcement::create([
            'created_by' => $user->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'country' => $role === 'hr' ? $user->country : null,
            'start_at' => $validated['start_at'],
            'end_at' => $validated['end_at'],
        ]);

        return back()->with('success', 'Announcement created.');
    }

    public function deleteAnnouncement(Announcement $announcement)
    {
        $user = Auth::user();
        $role = strtolower($user->role?->name ?? 'employee');

        abort_unless(in_array($role, ['admin', 'hr'], true), 403);
        if ($role === 'hr' && $announcement->country !== $user->country) {
            abort(403);
        }

        $announcement->delete();

        return back()->with('success', 'Announcement deleted.');
    }
}
