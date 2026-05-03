<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\AttendanceRequest;
use App\Models\Country;
use App\Models\LeaveRequest;
use App\Models\Notification;
use App\Models\OvertimeRequest;
use App\Models\SalaryRule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceRequestController extends Controller
{
    private const LOWER_ROLES = ['employee', 'member'];
    private const MANAGE_ROLES = ['management', 'hr', 'admin'];

    public function index(Request $request): Response
    {
        $user     = Auth::user();
        $roleName = $user->role?->name ?? 'employee';
        $month    = $request->integer('month', now()->month);
        $year     = $request->integer('year', now()->year);

        $query = AttendanceRequest::with([
            'user:id,name,avatar_url,position,department,country_id',
            'user.role:id,name',
            'approver:id,name',
            'approvedBy:id,name',
        ])->latest();

        $query->whereYear('date', $year)->whereMonth('date', $month);

        if (in_array($roleName, self::MANAGE_ROLES, true)) {
            $query->where(function ($q) use ($user) {
                $q->where('approver_id', $user->id)
                  ->orWhere('user_id', $user->id);
            });
        } else {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $approvers = match (true) {
            in_array($roleName, ['employee', 'management', 'driver'], true) =>
                User::select('id', 'name', 'avatar_url', 'role_id', 'country_id')
                    ->with('role:id,name')
                    ->where('is_active', 1)
                    ->where('country_id', $user->country_id)
                    ->whereHas('role', fn ($q) => $q->where('name', 'hr'))
                    ->orderBy('name')
                    ->get(),

            $roleName === 'hr' =>
                User::select('id', 'name', 'avatar_url', 'role_id')
                    ->with('role:id,name')
                    ->where('is_active', 1)
                    ->whereHas('role', fn ($q) => $q->where('name', 'admin'))
                    ->orderBy('name')
                    ->get(),

            default => collect(),
        };

        $country = Country::find($user->country_id);
        $salaryRule = $country
            ? SalaryRule::where('country_id', $country->id)->first()
            : null;

        $countryConfig = (object) [
            'work_hours_per_day'  => $country?->work_hours_per_day ?? 8,
            'lunch_break_minutes' => $country?->lunch_break_minutes ?? 60,
            'work_start'          => $salaryRule?->work_start ? substr($salaryRule->work_start, 0, 5) : '08:00',
            'work_end'            => $salaryRule?->work_end ? substr($salaryRule->work_end, 0, 5) : '17:00',
            'lunch_start'         => $salaryRule?->lunch_start ? substr($salaryRule->lunch_start, 0, 5) : '12:00',
            'lunch_end'           => $salaryRule?->lunch_end ? substr($salaryRule->lunch_end, 0, 5) : '13:00',
        ];

        return Inertia::render('Payroll/AttendanceRequests/Index', [
            'requests'      => $query->paginate(20)->withQueryString(),
            'approvers'     => $approvers,
            'filters'       => $request->only(['status', 'month', 'year']),
            'selectedMonth' => $month,
            'selectedYear'  => $year,
            'countryConfig' => $countryConfig,
        ]);
    }

public function store(Request $request): RedirectResponse
{
    $user     = Auth::user();
    $roleName = $user->role?->name ?? 'employee';

    $request->validate([
        'date'           => ['required', 'date'],
        'check_in_time'  => ['nullable', 'date_format:H:i'],
        'check_out_time' => ['nullable', 'date_format:H:i'],
        'note'           => ['required', 'string', 'max:500'],
        'approver_id'    => ['nullable', 'exists:users,id'],
    ]);

    if (!$request->check_in_time && !$request->check_out_time) {
        return back()->withErrors([
            'check_in_time' => 'Please choose Check In only, Check Out only, or both.',
        ])->withInput();
    }

    $allowedApproverIds = $this->resolveApproverIdsForUser($user);

    if ($roleName !== 'admin') {
        $request->validate([
            'approver_id' => [
                'required',
                Rule::in($allowedApproverIds),
            ],
        ], [
            'approver_id.required' => 'Approver is required.',
            'approver_id.in'       => 'Selected approver is invalid.',
        ]);
    }

    $dateStr = Carbon::parse($request->date)->format('Y-m-d');

    $requestType = $this->detectRequestType(
        $request->check_in_time,
        $request->check_out_time
    );

    $this->validateAgainstLeaveAndOT(
        $user,
        $dateStr,
        $request->check_in_time,
        $request->check_out_time
    );

    $this->validateAttendanceRequestFlow(
        userId: $user->id,
        dateStr: $dateStr,
        requestType: $requestType
    );

    [$workHours, $lateMinutes, $shortHours] = $this->calculateAttendanceValues(
        $user,
        $request->check_in_time,
        $request->check_out_time
    );

    $status = $roleName === 'admin' ? 'approved' : 'pending';
    $approverId = $roleName === 'admin' ? $user->id : $request->approver_id;

    $attendanceRequest = AttendanceRequest::create([
        'user_id'                  => $user->id,
        'approver_id'              => $approverId,
        'date'                     => $dateStr,
        'requested_check_in_time'  => $request->check_in_time,
        'requested_check_out_time' => $request->check_out_time,
        'requested_work_hours'     => $workHours,
        'requested_late_minutes'   => $lateMinutes,
        'status'                   => $status,
        'note'                     => $request->note,
        'approved_by'              => $roleName === 'admin' ? $user->id : null,
        'approved_at'              => $roleName === 'admin' ? now() : null,
        'created_by'               => $user->id,
    ]);

    if ($roleName === 'admin') {
        $this->syncToAttendanceRecords($attendanceRequest, $shortHours);
        return back()->with('success', 'Check In/Out request submitted and auto-approved.');
    }

    $this->notifyApprover(
        requesterId: $user->id,
        requesterName: $user->name,
        approverId: (int) $approverId,
        date: $dateStr,
        checkIn: $request->check_in_time,
        checkOut: $request->check_out_time
    );

    return back()->with('success', 'Check In/Out request submitted successfully.');
}

    public function approve(int $id): RedirectResponse
    {
        $attendanceRequest = AttendanceRequest::find($id);

        if (!$attendanceRequest) {
            return back()->with('error', 'Request no longer exists. It may have been deleted by the requester.');
        }

        $approver = Auth::user();

        if ((int) $attendanceRequest->approver_id !== (int) $approver->id
            && ($approver->role?->name ?? '') !== 'admin') {
            abort(403);
        }

        if ($attendanceRequest->status !== 'pending') {
            return back()->with('error', 'This request is already processed.');
        }

        $user = $attendanceRequest->user;
        $dateStr = Carbon::parse($attendanceRequest->date)->format('Y-m-d');

        $this->validateAgainstLeaveAndOT(
            $user,
            $dateStr,
            $attendanceRequest->requested_check_in_time,
            $attendanceRequest->requested_check_out_time
        );

        [$workHours, $lateMinutes, $shortHours] = $this->calculateAttendanceValues(
            $user,
            $attendanceRequest->requested_check_in_time,
            $attendanceRequest->requested_check_out_time
        );

        $attendanceRequest->update([
            'status'                   => 'approved',
            'approved_by'              => $approver->id,
            'approved_at'              => now(),
            'approved_check_in_time'   => $attendanceRequest->requested_check_in_time,
            'approved_check_out_time'  => $attendanceRequest->requested_check_out_time,
            'approved_work_hours'      => $workHours,
            'approved_late_minutes'    => $lateMinutes,
            'approved_short_hours'     => $shortHours,
        ]);

        $this->syncToAttendanceRecords($attendanceRequest->fresh(), $shortHours);

        \App\Models\Notification::send(
            userId: $attendanceRequest->user_id,
            type:   'system',
            title:  'Check-In/Out Request Approved ✓',
            body:   'Your attendance correction for ' . Carbon::parse($attendanceRequest->date)->format('d M Y') . ' has been approved.',
            url:    '/payroll/check-in-out-requests',
        );

        return back()->with('success', 'Check In/Out request approved.');
    }

public function reject(Request $request, int $id): RedirectResponse
{
    $attendanceRequest = AttendanceRequest::find($id);

    if (!$attendanceRequest) {
        return back()->with('error', 'Request no longer exists. It may have been deleted by the requester.');
    }

    $approver = Auth::user();

    if ((int) $attendanceRequest->approver_id !== (int) $approver->id
        && ($approver->role?->name ?? '') !== 'admin') {
        abort(403);
    }

    if ($attendanceRequest->status !== 'pending') {
        return back()->with('error', 'This request is already processed.');
    }

    $request->validate([
        'rejection_reason' => ['nullable', 'string', 'max:500'],
    ]);

    $attendanceRequest->update([
        'status'           => 'rejected',
        'approved_by'      => $approver->id,
        'approved_at'      => now(),
        'rejection_reason' => $request->rejection_reason,
    ]);
    \App\Models\Notification::send(
        userId: $attendanceRequest->user_id,
        type:   'system',
        title:  'Check-In/Out Request Rejected',
        body:   'Your attendance correction for ' . Carbon::parse($attendanceRequest->date)->format('d M Y') . ' has been rejected.',
        url:    '/payroll/check-in-out-requests',
    );


    return back()->with('success', 'Check In/Out request rejected.');
}

    private function resolveApproverIdsForUser(User $user): array
    {
        $roleName = $user->role?->name ?? 'employee';

        return match (true) {
            in_array($roleName, ['employee', 'management', 'driver'], true) =>
                User::where('is_active', 1)
                    ->where('country_id', $user->country_id)
                    ->whereHas('role', fn ($q) => $q->where('name', 'hr'))
                    ->pluck('id')
                    ->map(fn ($id) => (string) $id)
                    ->all(),

            $roleName === 'hr' =>
                User::where('is_active', 1)
                    ->whereHas('role', fn ($q) => $q->where('name', 'admin'))
                    ->pluck('id')
                    ->map(fn ($id) => (string) $id)
                    ->all(),

            default => [],
        };
    }

    private function calculateAttendanceValues(User $targetUser, ?string $checkInTime, ?string $checkOutTime): array
    {
        $country = Country::find($targetUser->country_id);
        $salaryRule = $country
            ? SalaryRule::where('country_id', $country->id)->first()
            : null;

        $workStartT  = $salaryRule?->work_start ? substr($salaryRule->work_start, 0, 5) : '08:00';
        $workEndT    = $salaryRule?->work_end ? substr($salaryRule->work_end, 0, 5) : '17:00';
        $lunchStartT = $salaryRule?->lunch_start ? substr($salaryRule->lunch_start, 0, 5) : '12:00';
        $lunchEndT   = $salaryRule?->lunch_end ? substr($salaryRule->lunch_end, 0, 5) : '13:00';

        $toMin = fn ($t) => (int) explode(':', $t)[0] * 60 + (int) explode(':', $t)[1];

        $rawIn  = $checkInTime ? $toMin(substr($checkInTime, 0, 5)) : null;
        $rawOut = $checkOutTime ? $toMin(substr($checkOutTime, 0, 5)) : null;

        $wsM = $toMin($workStartT);
        $weM = $toMin($workEndT);
        $lsM = $toMin($lunchStartT);
        $leM = $toMin($lunchEndT);

        $workHours = null;
        $lateMin   = 0;
        $shortHours = null;

        if ($rawIn !== null) {
            $lateMin = ($rawIn < $leM) ? max(0, $rawIn - $wsM) : 0;
        }

        if ($rawIn !== null && $rawOut !== null) {
            $effIn  = max($rawIn, $wsM);
            $effOut = min($rawOut, $weM);

            if ($effOut > $effIn) {
                $lunchOverlap = max(0, min($effOut, $leM) - max($effIn, $lsM));
                $workMins = $effOut - $effIn - $lunchOverlap;
                $wh = round($workMins / 60, 2);
                $workHours = $wh;
            } else {
                $workHours = 0;
            }

            $shortRaw = max(0, ($weM - $rawOut) / 60);
            $shortHours = round($shortRaw, 2);
        }

        return [$workHours, $lateMin, $shortHours];
    }

    private function validateAgainstLeaveAndOT(User $user, string $dateStr, ?string $checkInTime, ?string $checkOutTime): void
    {
        $country = Country::find($user->country_id);
        $salaryRule = $country
            ? SalaryRule::where('country_id', $country->id)->first()
            : null;

        $lunchStartT = $salaryRule?->lunch_start ? substr($salaryRule->lunch_start, 0, 5) : '12:00';
        $lunchEndT   = $salaryRule?->lunch_end ? substr($salaryRule->lunch_end, 0, 5) : '13:00';

        $fullLeave = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('day_type', 'full_day')
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date', '>=', $dateStr)
            ->first();

        if ($fullLeave) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'date' => "Full Day Leave exists on {$dateStr}. Cannot request attendance.",
            ]);
        }

        $amLeave = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('day_type', 'half_day_am')
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date', '>=', $dateStr)
            ->first();

        if ($amLeave && $checkInTime && substr($checkInTime, 0, 5) < $lunchEndT) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_in_time' => "AM Half Leave exists. Check-in must be {$lunchEndT} or later.",
            ]);
        }

        $pmLeave = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('day_type', 'half_day_pm')
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date', '>=', $dateStr)
            ->first();

        if ($pmLeave && $checkOutTime && substr($checkOutTime, 0, 5) > $lunchStartT) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_out_time' => "PM Half Leave exists. Check-out must be {$lunchStartT} or earlier.",
            ]);
        }
    }

    private function syncToAttendanceRecords(AttendanceRequest $attendanceRequest, ?float $shortHours = null): void
    {
        $userId = $attendanceRequest->user_id;
        $date   = Carbon::parse($attendanceRequest->date)->format('Y-m-d');

        $existing = AttendanceRecord::where('user_id', $userId)
            ->whereDate('date', $date)
            ->first();

        $requestedIn  = $attendanceRequest->approved_check_in_time ?: $attendanceRequest->requested_check_in_time;
        $requestedOut = $attendanceRequest->approved_check_out_time ?: $attendanceRequest->requested_check_out_time;

        $finalCheckIn  = $requestedIn ?: $existing?->check_in_time;
        $finalCheckOut = $requestedOut ?: $existing?->check_out_time;

        [$workHours, $lateMinutes, $recalculatedShortHours] = $this->calculateAttendanceValues(
            $attendanceRequest->user,
            $finalCheckIn,
            $finalCheckOut
        );

        $finalShortHours = $recalculatedShortHours ?? $shortHours ?? $existing?->short_hours;

        $status = 'present';
        if ($finalCheckIn && $finalCheckOut) {
            $status = ($lateMinutes > 0) ? 'late' : 'present';
        }

        AttendanceRecord::updateOrCreate(
            [
                'user_id' => $userId,
                'date'    => $date,
            ],
            [
                'user_id'           => $userId,
                'date'              => $date,
                'check_in_time'     => $finalCheckIn,
                'check_out_time'    => $finalCheckOut,
                'work_hours_actual' => $workHours,
                'late_minutes'      => $lateMinutes,
                'short_hours'       => $finalShortHours,
                'status'            => $status,
                'note'              => $attendanceRequest->note,
                'created_by'        => Auth::id(),
            ]
        );
    }

    private function notifyApprover(
        int $requesterId,
        string $requesterName,
        ?int $approverId,
        string $date,
        ?string $checkIn,
        ?string $checkOut
    ): void {
        if (!$approverId || $approverId === $requesterId) {
            return;
        }

        $parts = array_filter([
            $checkIn ? "In {$checkIn}" : null,
            $checkOut ? "Out {$checkOut}" : null,
        ]);

        Notification::send(
            userId: $approverId,
            type: 'attendance_request',
            title: 'New Check In/Out Request',
            body: "{$requesterName} submitted a check in/out request for {$date}" . (count($parts) ? ' (' . implode(', ', $parts) . ')' : '') . '.',
            url: '/payroll/check-in-out-requests',
            data: [
                'requester_id'   => $requesterId,
                'requester_name' => $requesterName,
                'date'           => $date,
                'check_in_time'  => $checkIn,
                'check_out_time' => $checkOut,
            ]
        );
    }

private function detectRequestType(?string $checkInTime, ?string $checkOutTime): string
{
    if ($checkInTime && $checkOutTime) {
        return 'both';
    }

    if ($checkInTime) {
        return 'check_in_only';
    }

    if ($checkOutTime) {
        return 'check_out_only';
    }

    throw \Illuminate\Validation\ValidationException::withMessages([
        'check_in_time' => 'Check In or Check Out is required.',
    ]);
}

private function validateAttendanceRequestFlow(int $userId, string $dateStr, string $requestType): void
{
    $attendanceRecord = AttendanceRecord::where('user_id', $userId)
        ->whereDate('date', $dateStr)
        ->first();

    $existingRequestQuery = AttendanceRequest::where('user_id', $userId)
        ->whereDate('date', $dateStr)
        ->whereIn('status', ['pending', 'approved']);

    if ($requestType === 'check_in_only') {
        if ($attendanceRecord && !empty($attendanceRecord->check_in_time)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_in_time' => 'Check in already exists. You cannot request check in again.',
            ]);
        }

        $hasRequestedCheckIn = (clone $existingRequestQuery)
            ->whereNotNull('requested_check_in_time')
            ->exists();

        if ($hasRequestedCheckIn) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_in_time' => 'Check in request already exists for this date.',
            ]);
        }
    }

    if ($requestType === 'check_out_only') {
        if ($attendanceRecord && !empty($attendanceRecord->check_out_time)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_out_time' => 'Check out already exists. You cannot request check out again.',
            ]);
        }

        $hasRequestedCheckOut = (clone $existingRequestQuery)
            ->whereNotNull('requested_check_out_time')
            ->exists();

        if ($hasRequestedCheckOut) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_out_time' => 'Check out request already exists for this date.',
            ]);
        }
    }

    if ($requestType === 'both') {
        if (
            $attendanceRecord &&
            !empty($attendanceRecord->check_in_time) &&
            !empty($attendanceRecord->check_out_time)
        ) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_in_time' => 'Check in and check out already exist. You cannot request both again.',
            ]);
        }

        $hasRequestedBoth = (clone $existingRequestQuery)
            ->whereNotNull('requested_check_in_time')
            ->whereNotNull('requested_check_out_time')
            ->exists();

        if ($hasRequestedBoth) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'check_in_time' => 'Check in/out request already exists for this date.',
            ]);
        }
    }
}

public function destroy(AttendanceRequest $attendanceRequest): RedirectResponse
{
    $user = Auth::user();

    // ကိုယ့် request သာ ဖျက်ခွင့်ရှိတယ်
    if ((int) $attendanceRequest->user_id !== (int) $user->id) {
        abort(403);
    }

    // pending ဖြစ်မှသာ ဖျက်ခွင့်ရှိတယ်
    if ($attendanceRequest->status !== 'pending') {
        return back()->with('error', 'Only pending requests can be deleted.');
    }

    $attendanceRequest->delete();

    return back()->with('success', 'Request deleted successfully.');
}

}