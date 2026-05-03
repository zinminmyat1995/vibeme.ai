<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\Notification;        // ← NEW
use App\Models\User;
use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    private const LOWER_ROLES  = ['member', 'employee'];
    private const MANAGE_ROLES = ['management', 'hr', 'admin'];

    // ─────────────────────────────────────────────────────────────────────────
    //  INDEX
    // ─────────────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $user     = Auth::user();
        $roleName = $user->role?->name;
        $month    = $request->integer('month', now()->month);
        $year     = $request->integer('year',  now()->year);

        $query = LeaveRequest::with([
            'user:id,name,avatar_url,position,department',
            'approver:id,name',
        ])->latest();

        // Overlap query — leave က selected month နဲ့ overlap ဖြစ်ရင် အကုန်ဖမ်း
        $query->where(function ($q) use ($month, $year) {
            $periodStart = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $periodEnd   = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();
            $q->where('start_date', '<=', $periodEnd)
              ->where('end_date',   '>=', $periodStart);
        });

        if (in_array($roleName, self::MANAGE_ROLES)) {
            $query->where(function ($q) use ($user) {
                $q->where('approver_id', $user->id)->orWhere('user_id', $user->id);
            });
        } elseif (in_array($roleName, self::LOWER_ROLES) || $roleName === 'driver') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) $query->where('status', $request->status);

        $leaveBalances = LeaveBalance::where('user_id', $user->id)->where('year', now()->year)->get();
        $leavePolicies = LeavePolicy::where('country_id', $user->country_id)->where('is_active', true)->get();

        $employees = match (true) {
            // Employee / Member → ကိုယ့် country ထဲက management role
            in_array($roleName, self::LOWER_ROLES) =>
                User::select('id', 'name', 'avatar_url', 'role_id')->with('role:id,name')
                    ->where('is_active', 1)
                    ->where('country_id', $user->country_id)
                    ->whereHas('role', fn($q) => $q->where('name', 'management'))
                    ->get(),
        
            
            // Driver → ကိုယ့် country ထဲက hr role
            $roleName === 'driver' =>
                User::select('id', 'name', 'avatar_url', 'role_id')->with('role:id,name')
                    ->where('is_active', 1)
                    ->where('country_id', $user->country_id)
                    ->whereHas('role', fn($q) => $q->where('name', 'hr'))
                    ->get(),

            // Management → ကိုယ့် country ထဲက hr role
            $roleName === 'management' =>
                User::select('id', 'name', 'avatar_url', 'role_id')->with('role:id,name')
                    ->where('is_active', 1)
                    ->where('country_id', $user->country_id)
                    ->whereHas('role', fn($q) => $q->where('name', 'hr'))
                    ->get(),
        
            // HR → ကိုယ့် country ထဲက admin role (country filter ထည့်)
            $roleName === 'hr' =>
                User::select('id', 'name', 'avatar_url', 'role_id')->with('role:id,name')
                    ->where('is_active', 1)
                    ->where('country_id', $user->country_id)   // ← ဒါထည့်
                    ->whereHas('role', fn($q) => $q->where('name', 'admin'))
                    ->get(),
        
            default => collect(),
        };


        // Mobile API request ဆိုရင်
        if ($request->expectsJson()) {
            return response()->json([
                'requests'      => $query->paginate(20),
                'leaveBalances' => $leaveBalances,
                'leavePolicies' => $leavePolicies,
                'approvers'     => $employees, // approver list
            ]);
        }

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

    // ─────────────────────────────────────────────────────────────────────────
    //  STORE
    // ─────────────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $user      = Auth::user();
        $userId    = $user->id;
        $roleName  = $user->role?->name;
        $countryId = $user->country_id;

        $policy      = LeavePolicy::where('country_id', $countryId)->where('leave_type', $request->leave_type)->first();
        $requiresDoc = $policy?->requires_document ?? false;

        $rules = [
            'leave_type'  => 'required|string|max:100',
            'day_type'    => 'required|in:full_day,half_day_am,half_day_pm',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'note'        => 'required|string|max:500',
            'approver_id' => 'nullable|exists:users,id',
            'document'    => $requiresDoc
                ? 'required|file|mimes:pdf,jpg,jpeg,png|max:5120'
                : 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];

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
        $country     = \App\Models\Country::find($user->country_id);
        $salaryRule  = $country ? \App\Models\SalaryRule::where('country_id', $country->id)->first() : null;
        $lunchStartT = $salaryRule?->lunch_start ? substr($salaryRule->lunch_start, 0, 5) : '12:00';
        $lunchEndT   = $salaryRule?->lunch_end   ? substr($salaryRule->lunch_end,   0, 5) : '13:00';

        // ── Attendance conflict check ──
        $checkCurrent = $startDate->copy();
        while ($checkCurrent <= $endDate) {
            $checkDateStr = $checkCurrent->format('Y-m-d');
            $attendance   = AttendanceRecord::where('user_id', $userId)->whereDate('date', $checkDateStr)->first();
            if ($attendance) {
                $checkIn  = $attendance->check_in_time  ? substr($attendance->check_in_time,  0, 5) : null;
                $checkOut = $attendance->check_out_time ? substr($attendance->check_out_time, 0, 5) : null;
                if ($dayType === 'full_day') {
                    throw \Illuminate\Validation\ValidationException::withMessages(['start_date' => "Attendance record already exists on {$checkDateStr}. Cannot apply full day leave."]);
                } elseif ($dayType === 'half_day_am' && $checkIn && $checkIn < $lunchStartT) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['start_date' => "Attendance already exists in AM hours on {$checkDateStr}. Cannot apply AM Half Day leave."]);
                } elseif ($dayType === 'half_day_pm' && $checkOut && $checkOut > $lunchEndT) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['start_date' => "Attendance already exists in PM hours on {$checkDateStr}. Cannot apply PM Half Day leave."]);
                }
            }
            $checkCurrent->addDay();
        }

        // ── OT conflict check ──
        $otCheck = $startDate->copy();
        while ($otCheck <= $endDate) {
            $otDateStr = $otCheck->format('Y-m-d');
            $hasOT     = \App\Models\OvertimeRequest::where('user_id', $userId)
                ->where('status', '!=', 'rejected')
                ->where(fn($q) => $q->whereDate('start_date', '<=', $otDateStr)->whereDate('end_date', '>=', $otDateStr))
                ->exists();
            if ($hasOT) {
                throw \Illuminate\Validation\ValidationException::withMessages(['start_date' => "You have an overtime request on {$otDateStr}. Cannot apply leave for this date."]);
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
                    throw \Illuminate\Validation\ValidationException::withMessages(['start_date' => "You already have {$existing->leave_type} (Full Day) on {$dateStr}."]);
                }
                if ($dayType === 'full_day') {
                    $halfLabel = $existing->day_type === 'half_day_am' ? 'AM Half Day' : 'PM Half Day';
                    throw \Illuminate\Validation\ValidationException::withMessages(['start_date' => "You already have {$existing->leave_type} ({$halfLabel}) on {$dateStr}. Cannot add a full day leave."]);
                }
                if ($dayType === $existing->day_type) {
                    $label = $dayType === 'half_day_am' ? 'AM Half Day' : 'PM Half Day';
                    throw \Illuminate\Validation\ValidationException::withMessages(['start_date' => "You already have {$existing->leave_type} ({$label}) on {$dateStr}."]);
                }
            }
            $current->addDay();
        }

        // ── Total days = calendar days (weekend မ skip) ──
        $totalDays = $isHalfDay ? 0.5 : (int) $startDate->diffInDays($endDate) + 1;

        // ── is_paid: policy ကနေ ယူ ──
        $isPaidLeave = $policy?->is_paid ?? true;

        // ── Document upload ──
        $documentPath = null;
        if ($request->hasFile('document')) {
            $file         = $request->file('document');
            $fileName     = "user_{$userId}_{$request->start_date}_" . time() . '.' . $file->getClientOriginalExtension();
            $documentPath = $file->storeAs("leave_documents/{$userId}", $fileName, 'public');
        }

        $isAdmin       = $roleName === 'admin';
        $initialStatus = $isAdmin ? 'approved' : 'pending';
        $approvedBy    = $isAdmin ? $userId : null;

        // ── Balance မရှိသေးရင် policy ကနေ entitled_days ယူ ──
        $balance   = LeaveBalance::where('user_id', $userId)
            ->where('leave_type', $request->leave_type)
            ->where('year', $startDate->year)
            ->first();
        $remaining = $balance
            ? (float) $balance->remaining_days
            : (float) ($policy?->days_per_year ?? 0);

        // ─────────────────────────────────────────────────────────────────────
        // AUTO-SPLIT — calendar days အတိုင်း
        //
        // Emergency Leave remaining=3, requested Mar28→Apr2 (6 days)
        //   paidEnd    = Mar28 + (3-1) = Mar30
        //   absentStart= Mar31
        //   absentEnd  = Apr2
        //   absentDays = 3
        //
        //   → Part 1: Emergency Leave  Mar28→Mar30  3 days  is_paid=true
        //   → Part 2: Absent           Mar31→Apr2   3 days  is_paid=false
        // ─────────────────────────────────────────────────────────────────────
        if ($isPaidLeave && !$isHalfDay && $totalDays > $remaining) {

            if ($remaining > 0) {
                // ── Part 1: Paid leave — start + (remaining-1) days ──
                $paidEnd = $startDate->copy()->addDays((int) $remaining - 1);

                LeaveRequest::create([
                    'user_id'       => $userId,
                    'leave_type'    => $request->leave_type,
                    'day_type'      => $dayType,
                    'start_date'    => $startDate->toDateString(),
                    'end_date'      => $paidEnd->toDateString(),
                    'total_days'    => (int) $remaining,
                    'is_paid'       => true,
                    'status'        => $initialStatus,
                    'note'          => $request->note,
                    'approver_id'   => $isAdmin ? $userId : $request->approver_id,
                    'approved_by'   => $approvedBy,
                    'document_path' => $documentPath,
                ]);

                if ($isAdmin) {
                    $this->deductBalance($userId, $request->leave_type, $remaining, $startDate->year, $countryId);
                }

                // ── Part 2: Absent — paidEnd+1 → endDate ──
                $absentStart = $paidEnd->copy()->addDay();
                $absentDays  = $totalDays - (int) $remaining;

            } else {
                // remaining = 0 → all days = Absent
                $absentStart = $startDate->copy();
                $absentDays  = $totalDays;
            }

            LeaveRequest::create([
                'user_id'       => $userId,
                'leave_type'    => 'Absent',
                'day_type'      => $dayType,
                'start_date'    => $absentStart->toDateString(),
                'end_date'      => $endDate->toDateString(),
                'total_days'    => $absentDays,
                'is_paid'       => false,
                'status'        => $initialStatus,
                'note'          => $request->note,
                'approver_id'   => $isAdmin ? $userId : $request->approver_id,
                'approved_by'   => $approvedBy,
                'document_path' => $documentPath,
            ]);

            // ── Notify approver ── (NEW)
            $this->notifyApprover(
                $userId,
                $user->name,
                $isAdmin ? null : $request->approver_id,
                $request->leave_type,
                $startDate->toDateString(),
                $endDate->toDateString(),
                $totalDays,
            );

            $paidMsg   = $remaining > 0 ? "{$remaining} day(s) as {$request->leave_type}" : null;
            $absentMsg = "{$absentDays} day(s) as Absent";
            $msg       = implode(', ', array_filter([$paidMsg, $absentMsg]));

            return redirect()->back()->with('success', "Leave submitted: {$msg}.");
        }

        // ── Normal leave ──
        LeaveRequest::create([
            'user_id'       => $userId,
            'leave_type'    => $request->leave_type,
            'day_type'      => $dayType,
            'start_date'    => $request->start_date,
            'end_date'      => $isHalfDay ? $request->start_date : $request->end_date,
            'total_days'    => $totalDays,
            'is_paid'       => $isPaidLeave,
            'status'        => $initialStatus,
            'note'          => $request->note,
            'approver_id'   => $isAdmin ? $userId : $request->approver_id,
            'approved_by'   => $approvedBy,
            'document_path' => $documentPath,
        ]);

        // ── Notify approver ── (NEW)
        $this->notifyApprover(
            $userId,
            $user->name,
            $isAdmin ? null : $request->approver_id,
            $request->leave_type,
            $request->start_date,
            $isHalfDay ? $request->start_date : $request->end_date,
            $totalDays,
        );

        if ($isAdmin) {
            $this->deductBalance($userId, $request->leave_type, $totalDays, $startDate->year, $countryId);
        }

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' =>  $isAdmin ? 'Leave request submitted and auto-approved.' : 'Leave request submitted successfully.']);
        }

        return redirect()->back()->with('success',
            $isAdmin ? 'Leave request submitted and auto-approved.' : 'Leave request submitted successfully.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  APPROVE
    // ─────────────────────────────────────────────────────────────────────────
    public function approve(Request $request, int $id)
    {
        $leaveRequest = LeaveRequest::find($id);

        if (!$leaveRequest) {
            return back()->with('error', 'Request no longer exists. It may have been deleted.');
        }

        if ($leaveRequest->status !== 'pending') {
            return back()->with('error', 'This request is already processed.');
        }

        // ── Salary rule for lunch times ──
        $countryId   = $leaveRequest->user->country_id;
        $salaryRule  = \App\Models\SalaryRule::where('country_id', $countryId)->first();
        $lunchStartT = $salaryRule?->lunch_start ? substr($salaryRule->lunch_start, 0, 5) : '12:00';
        $lunchEndT   = $salaryRule?->lunch_end   ? substr($salaryRule->lunch_end,   0, 5) : '13:00';

        $dayType   = $leaveRequest->day_type;
        $startDate = Carbon::parse($leaveRequest->start_date);
        $endDate   = Carbon::parse($leaveRequest->end_date);

        // ── Attendance conflict check before approve ──
        $checkCurrent = $startDate->copy();
        while ($checkCurrent <= $endDate) {
            $checkDateStr = $checkCurrent->format('Y-m-d');

            $attendance = AttendanceRecord::where('user_id', $leaveRequest->user_id)
                ->whereDate('date', $checkDateStr)
                ->first();

            if ($attendance) {
                $checkIn  = $attendance->check_in_time ? substr($attendance->check_in_time, 0, 5) : null;
                $checkOut = $attendance->check_out_time ? substr($attendance->check_out_time, 0, 5) : null;

                if ($dayType === 'full_day' && ($checkIn || $checkOut)) {
                    return redirect()->back()->with('error',
                        "Cannot approve leave request. Attendance check in/check out already exists on {$checkDateStr}."
                    );
                }

                if ($dayType === 'half_day_am' && $checkIn && $checkIn < $lunchStartT) {
                    return redirect()->back()->with('error',
                        "Cannot approve leave request. Attendance already exists in AM hours on {$checkDateStr}."
                    );
                }

                if ($dayType === 'half_day_pm' && $checkOut && $checkOut > $lunchEndT) {
                    return redirect()->back()->with('error',
                        "Cannot approve leave request. Attendance already exists in PM hours on {$checkDateStr}."
                    );
                }
            }

            $checkCurrent->addDay();
        }

        $leaveRequest->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
        ]);

        // Absent / unpaid → balance deduct မလုပ်
        if (!$leaveRequest->is_paid) {
            return redirect()->back()->with('success', 'Leave request approved');
        }

        $year      = Carbon::parse($leaveRequest->start_date)->year;
        $userId    = $leaveRequest->user_id;
        $leaveType = $leaveRequest->leave_type;

        $policy       = LeavePolicy::where('country_id', $countryId)
            ->where('leave_type', $leaveType)
            ->first();
        $entitledDays = $policy?->days_per_year ?? 0;

        $balance = LeaveBalance::firstOrCreate(
            ['user_id' => $userId, 'leave_type' => $leaveType, 'year' => $year],
            ['entitled_days' => $entitledDays, 'used_days' => 0, 'remaining_days' => $entitledDays]
        );

        $balance->update([
            'used_days'      => $balance->used_days + $leaveRequest->total_days,
            'remaining_days' => max(0, $balance->remaining_days - $leaveRequest->total_days),
        ]);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Leave request approved']);
        }

        \App\Models\Notification::send(
            userId: $leaveRequest->user_id,
            type:   'leave_request',
            title:  'Leave Request Approved ✓',
            body:   "Your {$leaveRequest->leave_type} leave ({$leaveRequest->total_days} days) has been approved.",
            url:    '/payroll/leaves',
        );

        return redirect()->back()->with('success', 'Leave request approved');
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  REJECT
    // ─────────────────────────────────────────────────────────────────────────
    public function reject(Request $request, int $id)
    {
        $leaveRequest = LeaveRequest::find($id);

        if (!$leaveRequest) {
            return back()->with('error', 'Request no longer exists. It may have been deleted.');
        }

        if ($leaveRequest->status !== 'pending') {
            return back()->with('error', 'This request is already processed.');
        }

        $leaveRequest->update(['status' => 'rejected', 'approved_by' => Auth::id()]);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Leave request rejected']);
        }

        \App\Models\Notification::send(
            userId: $leaveRequest->user_id,
            type:   'leave_request',
            title:  'Leave Request Rejected',
            body:   "Your {$leaveRequest->leave_type} leave request has been rejected.",
            url:    '/payroll/leaves',
        );
        return redirect()->back()->with('success', 'Leave request rejected');
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Private Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function deductBalance(int $userId, string $leaveType, float $days, int $year, int $countryId): void
    {
        if (strtolower($leaveType) === 'absent') return;

        $policy       = LeavePolicy::where('country_id', $countryId)->where('leave_type', $leaveType)->first();
        $entitledDays = $policy?->days_per_year ?? 0;

        $balance = LeaveBalance::firstOrCreate(
            ['user_id' => $userId, 'leave_type' => $leaveType, 'year' => $year],
            ['entitled_days' => $entitledDays, 'used_days' => 0, 'remaining_days' => $entitledDays]
        );

        $balance->update([
            'used_days'      => $balance->used_days + $days,
            'remaining_days' => max(0, $balance->remaining_days - $days),
        ]);
    }

    // ── NEW: Real-time notification to approver ───────────────────────────────
    private function notifyApprover(
        int    $requesterId,
        string $requesterName,
        ?int   $approverId,
        string $leaveType,
        string $startDate,
        string $endDate,
        float  $totalDays
    ): void {
        // approver_id မရှိရင် skip
        if (!$approverId) return;

        // requester ကိုယ်တိုင် approver ဆိုလည်း skip (admin auto-approve case)
        if ($approverId === $requesterId) return;

        $dateRange = $startDate === $endDate
            ? $startDate
            : "{$startDate} – {$endDate}";

        $dayLabel = $totalDays === 0.5
            ? '0.5 day'
            : ($totalDays == 1 ? '1 day' : "{$totalDays} days");

        Notification::send(
            userId: $approverId,
            type:   'leave_request',
            title:  'New Leave Request',
            body:   "{$requesterName} requested {$leaveType} ({$dayLabel}) on {$dateRange}.",
            url:    '/payroll/leaves',
            data:   [
                'requester_id'   => $requesterId,
                'requester_name' => $requesterName,
                'leave_type'     => $leaveType,
                'start_date'     => $startDate,
                'end_date'       => $endDate,
                'total_days'     => $totalDays,
            ]
        );
    }

public function destroy(Request $request, int $id)
{
    $leaveRequest = LeaveRequest::find($id);

    if (!$leaveRequest) {
        if ($request->expectsJson()) {
            return response()->json(['success' => false, 'message' => 'Request no longer exists.'], 404);
        }
        return back()->with('error', 'Request no longer exists.');
    }

    if ((int) $leaveRequest->user_id !== (int) Auth::id()) {
        abort(403);
    }

    if ($leaveRequest->status !== 'pending') {
        if ($request->expectsJson()) {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be deleted.'], 422);
        }
        return back()->with('error', 'Only pending requests can be deleted.');
    }

    $leaveRequest->delete();

    if ($request->expectsJson()) {
        return response()->json(['success' => true, 'message' => 'Leave request deleted successfully.']);
    }

    return back()->with('success', 'Leave request deleted successfully.');
}

}