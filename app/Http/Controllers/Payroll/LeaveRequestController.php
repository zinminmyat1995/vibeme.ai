<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Models\AttendanceRecord;
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
    $leavePolicies = LeavePolicy::where('country_id', $user->country_id)
        ->where('is_active', true)
        ->get();

    $employees = match($roleName) {
        'member', 'employee' => User::select('id','name','avatar_url','role_id')
            ->with('role:id,name')
            ->where('is_active', 1)
            ->where('country_id', $user->country_id)
            ->whereHas('role', fn($q) => $q->where('name', 'management'))
            ->get(),

        'management' => User::select('id','name','avatar_url','role_id')
            ->with('role:id,name')
            ->where('is_active', 1)
            ->where('country_id', $user->country_id)
            ->whereHas('role', fn($q) => $q->where('name', 'hr'))
            ->get(),

        'hr' => User::select('id','name','avatar_url','role_id')
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
    $user      = Auth::user();
    $userId    = $user->id;
    $roleName  = $user->role?->name;
    $countryId = $user->country_id;

    $policy = \App\Models\LeavePolicy::where('country_id', $countryId)
        ->where('leave_type', $request->leave_type)
        ->first();

    $requiresDoc = $policy?->requires_document ?? false;

    $rules = [
        'leave_type'  => 'required|string|max:100',
        'day_type'    => 'required|in:full_day,half_day_am,half_day_pm',
        'start_date'  => 'required|date',
        'end_date'    => 'required|date|after_or_equal:start_date',
        'note'        => 'required|string|max:500',
        'approver_id' => 'nullable|exists:users,id',
    ];

    if ($requiresDoc) {
        $rules['document'] = 'required|file|mimes:pdf,jpg,jpeg,png|max:5120';
    } else {
        $rules['document'] = 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120';
    }

    $request->validate($rules, [
        'document.required' => 'This leave type requires a supporting document.',
        'document.mimes'    => 'Document must be PDF, JPG, or PNG.',
        'document.max'      => 'Document must be under 5MB.',
    ]);

    $dayType   = $request->day_type;
    $isHalfDay = in_array($dayType, ['half_day_am', 'half_day_pm']);
    $startDate = Carbon::parse($request->start_date);
    $endDate   = Carbon::parse($isHalfDay ? $request->start_date : $request->end_date);

    // ── Salary rule for lunch times ──
    $targetUser  = \App\Models\User::find($userId);
    $country     = $targetUser ? \App\Models\Country::where('id', $targetUser->country_id)->first() : null;
    $salaryRule  = $country ? \App\Models\SalaryRule::where('country_id', $country->id)->first() : null;
    $lunchStartT = $salaryRule?->lunch_start ? substr($salaryRule->lunch_start, 0, 5) : '12:00';
    $lunchEndT   = $salaryRule?->lunch_end   ? substr($salaryRule->lunch_end,   0, 5) : '13:00';

    // ── Attendance conflict check ──
    // AM Half Leave = work_start to lunch_start (08:00 - 12:00)
    // PM Half Leave = lunch_end to work_end (13:00 - 17:00)
    $checkCurrent = $startDate->copy();
    while ($checkCurrent <= $endDate) {
        $checkDateStr = $checkCurrent->format('Y-m-d');

        $attendance = AttendanceRecord::where('user_id', $userId)
            ->whereDate('date', $checkDateStr)
            ->first();

        if ($attendance) {
            $checkIn  = $attendance->check_in_time  ? substr($attendance->check_in_time,  0, 5) : null;
            $checkOut = $attendance->check_out_time ? substr($attendance->check_out_time, 0, 5) : null;

            if ($dayType === 'full_day') {
                // Full Day → attendance ရှိရင် block
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'start_date' => "Attendance record already exists on {$checkDateStr}. Cannot apply full day leave.",
                ]);

            } elseif ($dayType === 'half_day_am') {
                // AM Leave (08:00–12:00) → check_in < lunch_start ဆိုရင် AM overlap → block
                if ($checkIn && $checkIn < $lunchStartT) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'start_date' => "Attendance already exists in AM hours on {$checkDateStr}. Cannot apply AM Half Day leave.",
                    ]);
                }

            } elseif ($dayType === 'half_day_pm') {
                // PM Leave (13:00–17:00) → check_out > lunch_end ဆိုရင် PM overlap → block
                // check_out <= lunch_start ဆိုရင် AM ပိုင်းဘဲ → allow
                if ($checkOut && $checkOut > $lunchEndT) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'start_date' => "Attendance already exists in PM hours on {$checkDateStr}. Cannot apply PM Half Day leave.",
                    ]);
                }
            }
        }

        $checkCurrent->addDay();
    }

    // ── OT request ရှိပြီးသား date မှာ leave တင်ခွင့်မပေး ──
    $otCheck = $startDate->copy();
    while ($otCheck <= $endDate) {
        $otDateStr = $otCheck->format('Y-m-d');

        $hasOT = \App\Models\OvertimeRequest::where('user_id', $userId)
            ->where('status', '!=', 'rejected')
            ->where(function($q) use ($otDateStr) {
                $q->whereDate('start_date', '<=', $otDateStr)
                  ->whereDate('end_date',   '>=', $otDateStr);
            })
            ->exists();

        if ($hasOT) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'start_date' => "You have an overtime request on {$otDateStr}. Cannot apply leave for this date.",
            ]);
        }

        $otCheck->addDay();
    }

    // ── Leave conflict check ──
    $current = $startDate->copy();
    while ($current <= $endDate) {
        $dateStr        = $current->format('Y-m-d');
        $existingOnDate = LeaveRequest::where('user_id', $userId)
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date',   '>=', $dateStr)
            ->where('status', '!=', 'rejected')
            ->get();

        foreach ($existingOnDate as $existing) {
            if ($existing->day_type === 'full_day') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'start_date' => "You already have {$existing->leave_type} (Full Day) on {$dateStr}.",
                ]);
            }

            if ($dayType === 'full_day') {
                $halfLabel = $existing->day_type === 'half_day_am' ? 'AM Half Day' : 'PM Half Day';
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'start_date' => "You already have {$existing->leave_type} ({$halfLabel}) on {$dateStr}. Cannot add a full day leave.",
                ]);
            }

            if ($dayType === $existing->day_type) {
                $label = $dayType === 'half_day_am' ? 'AM Half Day' : 'PM Half Day';
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'start_date' => "You already have {$existing->leave_type} ({$label}) on {$dateStr}.",
                ]);
            }
        }
        $current->addDay();
    }

    // ── Total days ──
    $totalDays = $isHalfDay ? 0.5 : 0;
    if (!$isHalfDay) {
        $cur = $startDate->copy();
        while ($cur <= $endDate) {
            if (!$cur->isWeekend()) $totalDays++;
            $cur->addDay();
        }
    }

    // ── Document upload ──
    $documentPath = null;
    if ($request->hasFile('document')) {
        $file         = $request->file('document');
        $fileName     = "user_{$userId}_{$request->start_date}_" . time() . '.' . $file->getClientOriginalExtension();
        $documentPath = $file->storeAs("leave_documents/{$userId}", $fileName, 'public');
    }

    // ── Admin → auto approve ──
    $isAdmin       = $roleName === 'admin';
    $initialStatus = $isAdmin ? 'approved' : 'pending';
    $approvedBy    = $isAdmin ? $userId : null;

    $leaveRequest = LeaveRequest::create([
        'user_id'       => $userId,
        'leave_type'    => $request->leave_type,
        'day_type'      => $dayType,
        'start_date'    => $request->start_date,
        'end_date'      => $isHalfDay ? $request->start_date : $request->end_date,
        'total_days'    => $totalDays,
        'status'        => $initialStatus,
        'note'          => $request->note,
        'approver_id'   => $isAdmin ? $userId : $request->approver_id,
        'approved_by'   => $approvedBy,
        'document_path' => $documentPath,
    ]);

    // ── Admin ဆိုရင် balance ပါ တပြိုင်နက် deduct ──
    if ($isAdmin) {
        $year = Carbon::parse($request->start_date)->year;

        $policy = LeavePolicy::where('country_id', $countryId)
            ->where('leave_type', $request->leave_type)
            ->first();

        $entitledDays = $policy?->days_per_year ?? 0;

        $balance = LeaveBalance::firstOrCreate(
            [
                'user_id'    => $userId,
                'leave_type' => $request->leave_type,
                'year'       => $year,
            ],
            [
                'entitled_days'  => $entitledDays,
                'used_days'      => 0,
                'remaining_days' => $entitledDays,
            ]
        );

        $balance->increment('used_days',      $totalDays);
        $balance->decrement('remaining_days', $totalDays);
    }

    $message = $isAdmin
        ? 'Leave request submitted and auto-approved.'
        : 'Leave request submitted successfully.';

    return redirect()->back()->with('success', $message);
}

public function approve(LeaveRequest $leaveRequest): \Illuminate\Http\RedirectResponse
{
    $leaveRequest->update([
        'status'      => 'approved',
        'approved_by' => Auth::id(),
    ]);

    $year = \Carbon\Carbon::parse($leaveRequest->start_date)->year;

    $policy = \App\Models\LeavePolicy::whereHas('country', function($q) use ($leaveRequest) {
        $q->where('name', $leaveRequest->user->country);
    })
    ->where('leave_type', $leaveRequest->leave_type)
    ->first();

    $entitledDays = $policy?->days_per_year ?? 0;

    $balance = LeaveBalance::firstOrCreate(
        [
            'user_id'    => $leaveRequest->user_id,
            'leave_type' => $leaveRequest->leave_type,
            'year'       => $year,
        ],
        [
            'entitled_days'  => $entitledDays,
            'used_days'      => 0,
            'remaining_days' => $entitledDays,
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