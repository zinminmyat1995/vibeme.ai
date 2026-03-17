<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
public function index(Request $request): Response
{
    $user     = Auth::user();
    $roleName = $user->role?->name;

    $month = $request->integer('month', now()->month);
    $year  = $request->integer('year',  now()->year);

    $query = LeaveRequest::with([
        'user:id,name,avatar_url,position,department',
        'approver:id,name',
    ])->latest();

    // ── Date filter ──
    $query->where(function($q) use ($month, $year) {
        $q->whereMonth('start_date', $month)->whereYear('start_date', $year)
          ->orWhereMonth('end_date',   $month)->whereYear('end_date',   $year);
    });

    // ── Role filter ──
    if (in_array($roleName, ['management', 'hr', 'admin'])) {
        $query->where(function($q) use ($user) {
            $q->where('approver_id', $user->id)
              ->orWhere('user_id', $user->id);
        });
    } elseif (in_array($roleName, ['member', 'employee'])) {
        $query->where('user_id', $user->id);
    }

    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    // ── Leave balances for current user ──
    $leaveBalances = LeaveBalance::where('user_id', $user->id)
        ->where('year', now()->year)
        ->get();

    // ── Leave policies for current user's country ──
    $leavePolicies = LeavePolicy::where('country_id', function($q) use ($user) {
        $q->select('id')->from('countries')->where('name', $user->country)->limit(1);
    })->get();

    // ── Employees for approver selection ──
    $employees = match($roleName) {
        'member', 'employee' => User::select('id','name','avatar_url')
            ->with('role:id,name')
            ->where('is_active', 1)
            ->where('country', $user->country)
            ->whereHas('role', fn($q) => $q->where('name', 'management'))
            ->get(),

        'management' => User::select('id','name','avatar_url')
            ->with('role:id,name')
            ->where('is_active', 1)
            ->where('country', $user->country)
            ->whereHas('role', fn($q) => $q->where('name', 'hr'))
            ->get(),

        'hr' => User::select('id','name','avatar_url')
            ->with('role:id,name')
            ->where('is_active', 1)
            ->whereHas('role', fn($q) => $q->where('name', 'admin'))
            ->get(),

        default => collect(),
    };

    return Inertia::render('Payroll/Leave/Index', [
        'requests'      => $query->paginate(20),
        'leaveBalances' => $leaveBalances,
        'leavePolicies' => $leavePolicies,
        'employees'     => $employees,
        'filters'       => $request->only(['status', 'month', 'year']),
        'selectedMonth' => $month,
        'selectedYear'  => $year,
    ]);
}

public function store(Request $request): \Illuminate\Http\RedirectResponse
{
    $request->validate([
        'leave_type'  => 'required|in:annual,medical,emergency,unpaid,maternity,paternity',
        'day_type'    => 'required|in:full_day,half_day_am,half_day_pm',
        'start_date'  => 'required|date',
        'end_date'    => 'required|date|after_or_equal:start_date',
        'note'        => 'required|string|max:500',
        'approver_id' => 'nullable|exists:users,id',
    ]);

    $userId    = Auth::id();
    $dayType   = $request->day_type;
    $isHalfDay = in_array($dayType, ['half_day_am', 'half_day_pm']);
    $startDate = Carbon::parse($request->start_date);
    $endDate   = Carbon::parse($isHalfDay ? $request->start_date : $request->end_date);

    // ── Date range conflict check ──────────────────────────
    $current = $startDate->copy();
    while ($current <= $endDate) {
        $dateStr = $current->format('Y-m-d');

        $existingOnDate = LeaveRequest::where('user_id', $userId)
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date',   '>=', $dateStr)
            ->where('status', '!=', 'rejected')
            ->get();

        foreach ($existingOnDate as $existing) {
            // Full day ရှိပြီးသား — ဘာမှ မတင်နိုင်
            if ($existing->day_type === 'full_day') {
                return redirect()->back()->withErrors([
                    'start_date' => "Full day leave already exists on {$dateStr}. Cannot add more leave on this date."
                ])->withInput();
            }

            // ကိုယ်တင်မယ့်ဟာ full day — range ထဲမှာ half day ရှိနေပြီ
            if ($dayType === 'full_day') {
                $existingLabel = $existing->day_type === 'half_day_am' ? 'AM Half Day' : 'PM Half Day';
                return redirect()->back()->withErrors([
                    'start_date' => "{$existingLabel} leave already exists on {$dateStr}. Cannot add full day leave."
                ])->withInput();
            }

            // Same half day type ထပ်တင်မရ
            if ($dayType === $existing->day_type) {
                $label = $dayType === 'half_day_am' ? 'AM Half Day' : 'PM Half Day';
                return redirect()->back()->withErrors([
                    'start_date' => "{$label} leave already exists on {$dateStr}."
                ])->withInput();
            }
        }

        $current->addDay();
    }
    // ───────────────────────────────────────────────────────

    // Total days calculate
    $totalDays = $isHalfDay ? 0.5 : 0;

    if (!$isHalfDay) {
        $cur = $startDate->copy();
        while ($cur <= $endDate) {
            if (!$cur->isWeekend()) $totalDays++;
            $cur->addDay();
        }
    }

    LeaveRequest::create([
        'user_id'     => $userId,
        'leave_type'  => $request->leave_type,
        'day_type'    => $dayType,
        'start_date'  => $request->start_date,
        'end_date'    => $isHalfDay ? $request->start_date : $request->end_date,
        'total_days'  => $totalDays,
        'status'      => 'pending',
        'note'        => $request->note,
        'approver_id' => $request->approver_id,
    ]);

    return redirect()->back()->with('success', 'Leave request submitted successfully');
}

public function approve(LeaveRequest $leaveRequest): \Illuminate\Http\RedirectResponse
{
    $leaveRequest->update([
        'status'      => 'approved',
        'approved_by' => Auth::id(),
    ]);

    $year = \Carbon\Carbon::parse($leaveRequest->start_date)->year;

    // Policy ကနေ entitled days ယူမယ်
    $policy = \App\Models\LeavePolicy::whereHas('country', function($q) use ($leaveRequest) {
        $q->where('name', $leaveRequest->user->country);
    })
    ->where('leave_type', $leaveRequest->leave_type)
    ->first();

    $entitledDays = $policy?->days_per_year ?? 0;

    // Balance ရှိပြီးသားဆိုရင် ယူ မရှိရင် policy days နဲ့ create
    $balance = LeaveBalance::firstOrCreate(
        [
            'user_id'    => $leaveRequest->user_id,
            'leave_type' => $leaveRequest->leave_type,
            'year'       => $year,
        ],
        [
            'entitled_days'  => $entitledDays,
            'used_days'      => 0,
            'remaining_days' => $entitledDays, // ← ဒါ important
        ]
    );

    $balance->increment('used_days', $leaveRequest->total_days);
    $balance->decrement('remaining_days', $leaveRequest->total_days);

    return redirect()->back()->with('success', 'Leave request approved');
}

    public function reject(Request $request, LeaveRequest $leaveRequest): \Illuminate\Http\RedirectResponse
    {
        $leaveRequest->update([
            'status'      => 'rejected',
            'approved_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Leave request rejected');
    }
}