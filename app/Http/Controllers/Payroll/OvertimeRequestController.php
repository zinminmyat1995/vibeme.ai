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

class OvertimeRequestController extends Controller
{
    public function __construct(
        private ShiftDetectionService $shiftDetection
    ) {}

    // INDEX
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

        $query->whereMonth('date', $month)->whereYear('date', $year);

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

    // STORE — auto-split into segments
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user      = Auth::user();
        $userId    = $user->id;
        $roleName  = $user->role?->name;
        $countryId = $user->country_id;
        $isAdmin   = $roleName === 'admin';

        $validated = $request->validate([
            'date'        => 'required|date',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i',
            'reason'      => 'required|string|max:500',
            'approver_id' => 'nullable|exists:users,id',
        ], [
            'start_time.date_format' => 'Start time must be HH:MM format.',
            'end_time.date_format'   => 'End time must be HH:MM format.',
        ]);

        if ($validated['start_time'] === $validated['end_time']) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'end_time' => 'Start and end time cannot be the same.',
            ]);
        }

        $dateStr = Carbon::parse($validated['date'])->format('Y-m-d');

        // Leave conflict check
        $leaveOnDate = LeaveRequest::where('user_id', $userId)
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date',   '>=', $dateStr)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($leaveOnDate) {
            $label = match ($leaveOnDate->day_type) {
                'full_day'    => 'Full Day',
                'half_day_am' => 'AM Half Day',
                'half_day_pm' => 'PM Half Day',
                default       => $leaveOnDate->day_type,
            };
            throw \Illuminate\Validation\ValidationException::withMessages([
                'date' => "You have a {$leaveOnDate->leave_type} leave ({$label}) on {$dateStr}. Cannot submit overtime on a leave day.",
            ]);
        }

        // Duplicate OT check
        $existingOT = OvertimeRequest::where('user_id', $userId)
            ->whereDate('date', $dateStr)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existingOT) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'date' => "You already have an overtime request on {$dateStr}.",
            ]);
        }

        // Auto-detect segments
        $segments = $this->shiftDetection->detect(
            $dateStr,
            $validated['start_time'],
            $validated['end_time'],
            $countryId
        );

        if (empty($segments)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'start_time' => 'Could not calculate OT duration. Please check the times.',
            ]);
        }

        $totalHours  = collect($segments)->sum('hours');
        $status      = $isAdmin ? 'approved' : 'pending';
        $approvedBy  = $isAdmin ? $userId    : null;
        $approvedAt  = $isAdmin ? now()      : null;

        DB::transaction(function () use (
            $userId, $validated, $dateStr, $totalHours,
            $segments, $status, $approvedBy, $approvedAt, $isAdmin
        ) {
            $otRequest = OvertimeRequest::create([
                'user_id'         => $userId,
                'approver_id'     => $isAdmin ? $userId : ($validated['approver_id'] ?? null),
                'date'            => $dateStr,
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
                    'start_time'          => $seg['start_time'],
                    'end_time'            => $seg['end_time'],
                    'hours'               => $seg['hours'],
                    'hours_approved'      => $isAdmin ? $seg['hours'] : 0,
                ]);
            }
        });

        $segCount = count($segments);
        $msg = $isAdmin
            ? "Overtime created & auto-approved. ({$segCount} segment" . ($segCount > 1 ? 's' : '') . ", {$totalHours} hrs)"
            : "Overtime submitted. ({$segCount} segment" . ($segCount > 1 ? 's' : '') . ", {$totalHours} hrs)";

        return back()->with('success', $msg);
    }

    // APPROVE
    public function approve(Request $request, OvertimeRequest $overtimeRequest): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('approve', $overtimeRequest);

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
                        $approved = min((float)$seg['hours_approved'], (float)$segment->hours);
                        $segment->update(['hours_approved' => $approved]);
                        $totalApproved += $approved;
                    }
                }
            } else {
                // Approve all segments at full hours
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

    // REJECT
    public function reject(OvertimeRequest $overtimeRequest): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('reject', $overtimeRequest);

        $overtimeRequest->update([
            'status'      => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Overtime request rejected.');
    }
}