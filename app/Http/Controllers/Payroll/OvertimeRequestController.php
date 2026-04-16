<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\OvertimePolicy;
use App\Models\OvertimeRequest;
use App\Models\OvertimeRequestSegment;
use App\Models\User;
use App\Services\Payroll\ShiftDetectionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Notification;

class OvertimeRequestController extends Controller
{
    public function __construct(
        private ShiftDetectionService $shiftDetection
    ) {}

    // ─────────────────────────────────────────────────────────
    //  INDEX
    // ─────────────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $user     = Auth::user();
        $roleName = $user->role?->name;
        $month    = $request->integer('month', now()->month);
        $year     = $request->integer('year',  now()->year);

        $query = OvertimeRequest::with([
            'user:id,name,avatar_url,position,department',
            'approver:id,name',
            'approvedBy:id,name',
            'segments.overtimePolicy:id,title,rate_type,rate_value',
        ])->latest();

        // Filter by month/year using start_date
        $query->whereMonth('start_date', $month)->whereYear('start_date', $year);

        if (in_array($roleName, ['management', 'hr', 'admin'])) {
            $query->where(function ($q) use ($user) {
                $q->where('approver_id', $user->id)->orWhere('user_id', $user->id);
            });
        } elseif (in_array($roleName, ['member', 'employee'])) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $overtimePolicies = OvertimePolicy::where('country_id', $user->country_id)
            ->where('is_active', true)->get();

        $employees = match ($roleName) {
            'member', 'employee' => User::select('id','name','avatar_url','role_id')
                ->with('role:id,name')->where('is_active',1)
                ->where('country_id',$user->country_id)
                ->whereHas('role',fn($q)=>$q->where('name','management'))->get(),
            'management' => User::select('id','name','avatar_url','role_id')
                ->with('role:id,name')->where('is_active',1)
                ->where('country_id',$user->country_id)
                ->whereHas('role',fn($q)=>$q->where('name','hr'))->get(),
            'hr' => User::select('id','name','avatar_url','role_id')
                ->with('role:id,name')->where('is_active',1)
                ->whereHas('role',fn($q)=>$q->where('name','admin'))->get(),
            default => collect(),
        };

        return Inertia::render('Payroll/Overtime/Index', [
            'requests'         => $query->paginate(20),
            'overtimePolicies' => $overtimePolicies,
            'employees'        => $employees,
            'filters'          => $request->only(['status','month','year']),
            'selectedMonth'    => $month,
            'selectedYear'     => $year,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  STORE
    // ─────────────────────────────────────────────────────────
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user      = Auth::user();
        $userId    = $user->id;
        $roleName  = $user->role?->name;
        $countryId = $user->country_id;
        $isAdmin   = $roleName === 'admin';

        $validated = $request->validate([
            'start_date'  => 'required|date',
            'start_time'  => 'required|date_format:H:i',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'end_time'    => 'required|date_format:H:i',
            'reason'      => 'required|string|max:500',
            'approver_id' => 'nullable|exists:users,id',
        ], [
            'end_date.after_or_equal' => 'End date must be on or after start date.',
        ]);

        $startDate = Carbon::parse($validated['start_date'])->format('Y-m-d');
        $endDate   = Carbon::parse($validated['end_date'])->format('Y-m-d');

        // Same date + same time → invalid
        if ($startDate === $endDate && $validated['start_time'] === $validated['end_time']) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'end_time' => 'Start and end time cannot be the same on the same date.',
            ]);
        }

        // ─────────────────────────────────────────────────────
        //  Leave conflict check — any leave within date range
        // ─────────────────────────────────────────────────────
        $leaveConflict = LeaveRequest::where('user_id', $userId)
            ->whereIn('status', ['pending', 'approved'])
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date',  [$startDate, $endDate])
                  ->orWhere(function ($q2) use ($startDate, $endDate) {
                      $q2->where('start_date', '<=', $startDate)
                         ->where('end_date',   '>=', $endDate);
                  });
            })
            ->first();

        if ($leaveConflict) {
            $label = match ($leaveConflict->day_type ?? '') {
                'full_day'    => 'Full Day',
                'half_day_am' => 'AM Half Day',
                'half_day_pm' => 'PM Half Day',
                default       => 'Leave',
            };
            throw \Illuminate\Validation\ValidationException::withMessages([
                'start_date' => "You have a {$leaveConflict->leave_type} leave ({$label}) overlapping this period.",
            ]);
        }

        // ─────────────────────────────────────────────────────
        //  Overlap OT check — time-aware exclusive boundary
        //  e.g. existing: 20-Mar 9:25AM → 27-Mar 9:25AM
        //       new:       27-Mar 9:25AM → ...  → ALLOWED (starts exactly where previous ended)
        //       new:       27-Mar 9:24AM → ...  → BLOCKED (overlap)
        // ─────────────────────────────────────────────────────
        $startDateTime = $startDate . ' ' . $validated['start_time'] . ':00';
        $endDateTime   = $endDate   . ' ' . $validated['end_time']   . ':00';

        $otConflict = OvertimeRequest::where('user_id', $userId)
            ->whereIn('status', ['pending', 'approved'])
            ->where(function ($q) use ($startDateTime, $endDateTime, $startDate, $endDate, $validated) {
                // Existing request's datetime range overlaps with new request
                // Overlap exists when: existing_start < new_end AND existing_end > new_start
                $q->whereRaw("CONCAT(start_date, ' ', start_time, ':00') < ?", [$endDateTime])
                  ->whereRaw("CONCAT(end_date, ' ', end_time, ':00') > ?", [$startDateTime]);
            })
            ->first();

        if ($otConflict) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'start_date' => "You already have an overtime request overlapping this date range.",
            ]);
        }

        // ─────────────────────────────────────────────────────
        //  Auto-detect segments (multi-day)
        // ─────────────────────────────────────────────────────
        $segments = $this->shiftDetection->detectFull(
            $startDate,
            $validated['start_time'],
            $endDate,
            $validated['end_time'],
            $countryId
        );

        if (empty($segments)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'start_time' => 'Could not calculate OT duration. Please check the times.',
            ]);
        }

        $totalHours = collect($segments)->sum('hours');
        $status     = $isAdmin ? 'approved' : 'pending';
        $approvedBy = $isAdmin ? $userId    : null;
        $approvedAt = $isAdmin ? now()      : null;

        DB::transaction(function () use (
            $userId, $validated, $startDate, $endDate, $totalHours,
            $segments, $status, $approvedBy, $approvedAt, $isAdmin
        ) {
            $otRequest = OvertimeRequest::create([
                'user_id'         => $userId,
                'approver_id'     => $isAdmin ? $userId : ($validated['approver_id'] ?? null),
                'start_date'      => $startDate,
                'end_date'        => $endDate,
                'start_time'      => $validated['start_time'],
                'end_time'        => $validated['end_time'],
                'hours_requested' => $totalHours,
                'hours_approved'  => $isAdmin ? $totalHours : 0,
                'reason'          => $validated['reason'],
                'status'          => $status,
                'approved_by'     => $approvedBy,
                'approved_at'     => $approvedAt,
            ]);

            foreach ($segments as $seg) {
                OvertimeRequestSegment::create([
                    'overtime_request_id' => $otRequest->id,
                    'ot_policy_id'        => $seg['ot_policy_id'],
                    'segment_date'        => $seg['segment_date'],
                    'start_time'          => $seg['start_time'],
                    'end_time'            => $seg['end_time'],
                    'hours'               => $seg['hours'],
                    'hours_approved'      => $isAdmin ? $seg['hours'] : 0,
                ]);
            }
        });

        $segCount = count($segments);
        $days     = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;
        $msg = $isAdmin
            ? "Overtime created & auto-approved. ({$days} day(s), {$segCount} segments, {$totalHours} hrs total)"
            : "Overtime submitted. ({$days} day(s), {$segCount} segments, {$totalHours} hrs total)";



        // ── Notify approver ──
        if (!$isAdmin && !empty($validated['approver_id'])) {
            $dateRange = $startDate === $endDate
                ? $startDate
                : "{$startDate} – {$endDate}";

            $hrsLabel = "{$totalHours} hr" . ($totalHours != 1 ? 's' : '');

            Notification::send(
                userId: $validated['approver_id'],
                type:   'overtime_request',
                title:  'New Overtime Request',
                body:   "{$user->name} requested overtime ({$hrsLabel}) on {$dateRange}.",
                url:    '/payroll/overtimes',
                data:   [
                    'requester_id'   => $userId,
                    'requester_name' => $user->name,
                    'start_date'     => $startDate,
                    'end_date'       => $endDate,
                    'total_hours'    => $totalHours,
                ]
            );
        }
  
        return back()->with('success', $msg);
    }

    // ─────────────────────────────────────────────────────────
    //  APPROVE
    // ─────────────────────────────────────────────────────────
    public function approve(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        $overtimeRequest = OvertimeRequest::with('segments')->find($id);

        if (!$overtimeRequest) {
            return back()->with('error', 'Request no longer exists. It may have been deleted.');
        }

        if ($overtimeRequest->status !== 'pending') {
            return back()->with('error', 'This request is already processed.');
        }

        $user     = Auth::user();
        $roleName = $user->role?->name;

        $canApprove = $roleName === 'admin'
            || $overtimeRequest->approver_id === $user->id
            || ($roleName === 'hr' && $overtimeRequest->user->country_id === $user->country_id);

        if (!$canApprove) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'segments'                  => 'nullable|array',
            'segments.*.id'             => 'required|exists:overtime_request_segments,id',
            'segments.*.hours_approved' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($overtimeRequest, $validated) {
            $totalApproved = 0;

            if (!empty($validated['segments'])) {
                foreach ($validated['segments'] as $seg) {
                    $segment = OvertimeRequestSegment::find($seg['id']);
                    if ($segment && $segment->overtime_request_id === $overtimeRequest->id) {
                        $approved = min((float) $seg['hours_approved'], (float) $segment->hours);
                        $segment->update(['hours_approved' => $approved]);
                        $totalApproved += $approved;
                    }
                }
            } else {
                $totalApproved = $overtimeRequest->segments->sum('hours');
                $overtimeRequest->segments()->update(['hours_approved' => DB::raw('hours')]);
            }

            $overtimeRequest->update([
                'status'         => 'approved',
                'hours_approved' => $totalApproved,
                'approved_by'    => Auth::id(),
                'approved_at'    => now(),
            ]);
        });

        return back()->with('success', 'Overtime request approved.');
    }

    // ─────────────────────────────────────────────────────────
    //  REJECT
    // ─────────────────────────────────────────────────────────
    public function reject(int $id): \Illuminate\Http\RedirectResponse
    {
        $overtimeRequest = OvertimeRequest::find($id);

        if (!$overtimeRequest) {
            return back()->with('error', 'Request no longer exists. It may have been deleted.');
        }

        if ($overtimeRequest->status !== 'pending') {
            return back()->with('error', 'This request is already processed.');
        }

        $overtimeRequest->update([
            'status'      => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Overtime request rejected.');
    }
    
public function destroy(int $id): \Illuminate\Http\RedirectResponse
{
    $overtimeRequest = OvertimeRequest::find($id);

    if (!$overtimeRequest) {
        return back()->with('error', 'Request no longer exists.');
    }

    if ((int) $overtimeRequest->user_id !== (int) Auth::id()) {
        abort(403);
    }

    if ($overtimeRequest->status !== 'pending') {
        return back()->with('error', 'Only pending requests can be deleted.');
    }

    // segments ပါ cascade delete ဖြစ်ဖို့ (DB cascade မရှိရင် manual)
    $overtimeRequest->segments()->delete();
    $overtimeRequest->delete();

    return back()->with('success', 'Overtime request deleted successfully.');
}

}