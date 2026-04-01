<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use App\Models\SalaryRule;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\PayrollRecord;
use App\Models\AttendanceRecord;
use App\Models\PublicHoliday;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user      = Auth::user();
        $role      = $user->role?->name;
        $country   = $user->country;
        $countryId = $user->countryRecord?->id;

        // ── Announcements ──────────────────────────────────────────────────
        $announcementsQuery = Announcement::with('creator:id,name')
            ->where(fn($q) => $q->whereNull('start_at')->orWhere('start_at', '<=', now()))
            ->where(fn($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', now()));

        if ($role !== 'admin') {
            $announcementsQuery->where(function ($q) use ($country) {
                $q->where('country', $country)->orWhereNull('country');
            });
        }

        $announcements = $announcementsQuery->orderBy('start_at', 'desc')->get()
            ->map(fn($a) => [
                'id'         => $a->id,
                'title'      => $a->title,
                'content'    => $a->content,
                'country'    => $a->country,
                'start_at'   => $a->start_at?->toDateTimeString(),
                'end_at'     => $a->end_at?->toDateTimeString(),
                'created_by' => $a->creator?->name,
            ]);

        // ── Employee Stats (HR / Admin) ────────────────────────────────────
        $employeeStats   = null;
        $probationAlerts = [];
        $contractAlerts  = [];
        $employmentChart = [];
        $countryChart    = [];
        $payrollTrend    = [];

        if (in_array($role, ['hr', 'admin'])) {
            $empQuery = User::where('is_active', true);
            if ($role === 'hr') $empQuery->where('country', $country);
            $employees = $empQuery->get();

            $salaryRule    = SalaryRule::where('country_id', $countryId)->first();
            $probationDays = $salaryRule?->probation_days ?? 90;

            $probationEmps = $employees->where('employment_type', 'probation');
            $contractEmps  = $employees->where('employment_type', 'contract');
            $permanentEmps = $employees->where('employment_type', 'permanent');

            $employeeStats = [
                'total'     => $employees->count(),
                'probation' => $probationEmps->count(),
                'contract'  => $contractEmps->count(),
                'permanent' => $permanentEmps->count(),
            ];

            $employmentChart = [
                ['label' => 'Permanent', 'value' => $permanentEmps->count(), 'color' => '#059669'],
                ['label' => 'Probation', 'value' => $probationEmps->count(), 'color' => '#d97706'],
                ['label' => 'Contract',  'value' => $contractEmps->count(),  'color' => '#2563eb'],
            ];

            if ($role === 'admin') {
                $byCountry = $employees->groupBy('country');
                foreach ($byCountry as $c => $grp) {
                    $countryChart[] = ['label' => ucfirst($c ?: 'Unknown'), 'value' => $grp->count()];
                }
            }

            // Last 6 months payroll trend
            for ($i = 5; $i >= 0; $i--) {
                $m   = now()->subMonths($i);
                $qry = PayrollRecord::whereMonth('created_at', $m->month)
                    ->whereYear('created_at', $m->year);
                if ($role === 'hr') {
                    $qry->whereHas('user', fn($q) => $q->where('country', $country));
                }
                $payrollTrend[] = [
                    'month' => $m->format('M'),
                    'count' => $qry->count(),
                    'total' => (float) $qry->sum('net_salary'),
                ];
            }

            // Probation alerts ≤10 days
            foreach ($probationEmps as $emp) {
                if (!$emp->joined_date) continue;
                $end      = Carbon::parse($emp->joined_date)->addDays($probationDays);
                $daysLeft = (int) now()->diffInDays($end, false);
                if ($daysLeft >= 0 && $daysLeft <= 10) {
                    $probationAlerts[] = [
                        'id'           => $emp->id,
                        'name'         => $emp->name,
                        'department'   => $emp->department,
                        'days_left'    => $daysLeft,
                        'probation_end'=> $end->toDateString(),
                    ];
                }
            }

            // Contract alerts ≤30 days
            foreach ($contractEmps as $emp) {
                if (!$emp->contract_end_date) continue;
                $daysLeft = (int) now()->diffInDays(Carbon::parse($emp->contract_end_date), false);
                if ($daysLeft >= 0 && $daysLeft <= 30) {
                    $contractAlerts[] = [
                        'id'           => $emp->id,
                        'name'         => $emp->name,
                        'department'   => $emp->department,
                        'days_left'    => $daysLeft,
                        'contract_end' => Carbon::parse($emp->contract_end_date)->toDateString(),
                    ];
                }
            }
        }

        // ── My Stats ──────────────────────────────────────────────────────
        $pendingLeaves = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'pending')->count();

        $approvedLeaves = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereMonth('start_date', now()->month)
            ->whereYear('start_date', now()->year)->count();

        $otHours = OvertimeRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereMonth('start_date', now()->month)
            ->whereYear('start_date', now()->year)
            ->get()->flatMap(fn($r) => $r->segments)->sum('hours_approved');

        $latestPayroll = PayrollRecord::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')->first();

        $presentDays = AttendanceRecord::where('user_id', $user->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->whereIn('status', ['present', 'late'])->count();

        // Pending leave approvals (where I am approver)
        $pendingLeaveApprovals = LeaveRequest::where('approver_id', $user->id)
            ->where('status', 'pending')
            ->count();

        // Pending OT approvals (where I am approver)  
        $pendingOtApprovals = OvertimeRequest::where('approver_id', $user->id)
            ->where('status', 'pending')
            ->count();
    
        $myStats = [
            'pending_leaves'  => $pendingLeaves,
            'approved_leaves' => $approvedLeaves,
            'ot_hours_month'  => round((float) $otHours, 1),
            'payslip_status'  => $latestPayroll?->status ?? null,
            'net_salary'      => $latestPayroll?->net_salary ?? null,
            'present_days'    => $presentDays,
            'pending_leave_approvals' => $pendingLeaveApprovals,
            'pending_ot_approvals'    => $pendingOtApprovals,
        ];

        // ── Today Attendance ──────────────────────────────────────────────
        $todayAtt    = AttendanceRecord::where('user_id', $user->id)
            ->where('date', now()->toDateString())->first();
        $todayStatus = $todayAtt
            ? ['checked_in' => true,  'check_in' => $todayAtt->check_in_time,  'check_out' => $todayAtt->check_out_time]
            : ['checked_in' => false, 'check_in' => null, 'check_out' => null];

        // ── Upcoming Holidays ─────────────────────────────────────────────
        $upcomingHolidays = [];
        if ($countryId) {
            $upcomingHolidays = PublicHoliday::where('country_id', $countryId)
                ->where('date', '>=', now()->toDateString())
                ->orderBy('date')->limit(3)->get()
                ->map(fn($h) => ['name' => $h->name, 'date' => Carbon::parse($h->date)->toDateString()])
                ->toArray();
        }

        return Inertia::render('Dashboard', [
            'announcements'   => $announcements,
            'employeeStats'   => $employeeStats,
            'probationAlerts' => $probationAlerts,
            'contractAlerts'  => $contractAlerts,
            'employmentChart' => $employmentChart,
            'countryChart'    => $countryChart,
            'payrollTrend'    => $payrollTrend,
            'myStats'         => $myStats,
            'todayStatus'     => $todayStatus,
            'upcomingHolidays'=> $upcomingHolidays,
            'roleName'        => $role,
            'userCountry'     => $country,
        ]);
    }

    public function storeAnnouncement(Request $request)
    {
        $user = Auth::user();
        $role = $user->role?->name;
        if (!in_array($role, ['admin', 'hr'])) abort(403);

        $v = $request->validate([
            'title'    => 'required|string|max:255',
            'content'  => 'required|string',
            'start_at' => 'required|date',
            'end_at'   => 'required|date|after:start_at',
        ]);

        Announcement::create([
            'created_by' => $user->id,
            'title'      => $v['title'],
            'content'    => $v['content'],
            'country'    => $role === 'hr' ? $user->country : null,
            'start_at'   => $v['start_at'],
            'end_at'     => $v['end_at'],
        ]);

        return back()->with('success', 'Announcement created!');
    }

    public function deleteAnnouncement(Announcement $announcement)
    {
        $user = Auth::user();
        $role = $user->role?->name;
        if (!in_array($role, ['admin', 'hr'])) abort(403);
        if ($role === 'hr' && $announcement->country !== $user->country) abort(403);
        $announcement->delete();
        return back()->with('success', 'Announcement deleted.');
    }
}