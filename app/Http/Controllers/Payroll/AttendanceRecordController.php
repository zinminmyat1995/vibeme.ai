<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreAttendanceRecordRequest;
use App\Models\AttendanceRecord;
use App\Models\User;
use App\Models\OvertimeRequest;
use App\Models\PublicHoliday;
use App\Models\LeaveRequest;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceRecordController extends Controller
{
    // ── Web (Inertia) ──
    public function index(Request $request): Response
    {
        $user     = Auth::user();
        $roleName = $user->role?->name;
        $month    = $request->integer('month', now()->month);
        $year     = $request->integer('year',  now()->year);

        // ── Target user ──
        // HR/Admin: use selected employee_id if provided, otherwise use own id
        // Member/Management: always own id
        $targetUserId = in_array($roleName, ['hr', 'admin'])
            ? ($request->filled('employee_id') ? $request->employee_id : $user->id)
            : $user->id;

        // ── Attendance query ──
        $query = AttendanceRecord::with('user')
            ->whereMonth('date', $month)
            ->whereYear('date',  $year)
            ->where('user_id', $targetUserId);

        // ── Employees dropdown (HR and Admin only) ──
        $employees = [];
        if ($roleName === 'hr') {
            $employees = User::select('id', 'name', 'avatar_url', 'department', 'position', 'country')
                ->with('role:id,name')
                ->where('is_active', 1)
                ->where('country', $user->country)
                ->orderByRaw("CASE WHEN id = ? THEN 0 ELSE 1 END", [$user->id])
                ->orderBy('name')
                ->get();
        } elseif ($roleName === 'admin') {
            $employees = User::select('id', 'name', 'avatar_url', 'department', 'position', 'country')
                ->with('role:id,name')
                ->where('is_active', 1)
                ->orderByRaw("CASE WHEN id = ? THEN 0 ELSE 1 END", [$user->id])
                ->orderBy('name')
                ->get();
        }

        // ── Country config ──
        $country    = Country::where('name', $user->country)->first();
        $salaryRule = $country
            ? \App\Models\SalaryRule::where('country_id', $country->id)->first()
            : null;

        $countryConfig = $country ? (object)[
            'work_hours_per_day'   => $country->work_hours_per_day   ?? 8,
            'lunch_break_minutes'  => $country->lunch_break_minutes  ?? 60,
            'standard_start_time'  => $salaryRule?->work_start ? substr($salaryRule->work_start, 0, 5) : '08:00',
            'work_start'           => $salaryRule?->work_start ? substr($salaryRule->work_start, 0, 5) : '08:00',
            'work_end'             => $salaryRule?->work_end   ? substr($salaryRule->work_end,   0, 5) : '17:00',
            'lunch_start'          => $salaryRule?->lunch_start ? substr($salaryRule->lunch_start, 0, 5) : '12:00',
            'lunch_end'            => $salaryRule?->lunch_end   ? substr($salaryRule->lunch_end,   0, 5) : '13:00',
        ] : null;

        // ── Public holidays ──
        $publicHolidays = $country ? PublicHoliday::where('country_id', $country->id)
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->pluck('date')
            ->map(fn($d) => \Carbon\Carbon::parse($d)->format('Y-m-d'))
            ->toArray() : [];

        $publicHolidayDetails = $country ? PublicHoliday::where('country_id', $country->id)
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->select('date', 'name')
            ->get()
            ->map(fn($h) => [
                'date' => \Carbon\Carbon::parse($h->date)->format('Y-m-d'),
                'name' => $h->name,
            ]) : [];

        // ── OT — target user only, per-day from segments ──
        $overtimeRecords = OvertimeRequest::with(['segments.overtimePolicy'])
            ->where('user_id', $targetUserId)
            ->where('status', 'approved')
            ->where(function($q) use ($month, $year) {
                $q->whereMonth('start_date', $month)->whereYear('start_date', $year)
                ->orWhereMonth('end_date', $month)->whereYear('end_date', $year);
            })
            ->get();

        $overtimeMap = [];
        foreach ($overtimeRecords as $r) {
            foreach ($r->segments as $seg) {
                $segDate = $seg->segment_date
                    ? \Carbon\Carbon::parse($seg->segment_date)
                    : \Carbon\Carbon::parse($r->start_date);

                // ← ဒီ month မဟုတ်ရင် skip
                if ($segDate->month !== $month || $segDate->year !== $year) {
                    continue;
                }

                $dk = $segDate->format('Y-m-d');

                if (!isset($overtimeMap[$dk])) {
                    $overtimeMap[$dk] = [
                        'hours_approved' => 0,
                        'start_time'     => $r->start_time,
                        'end_time'       => $r->end_time,
                        'reason'         => $r->reason,
                        'segments'       => [],
                    ];
                }

                $overtimeMap[$dk]['hours_approved'] += (float) $seg->hours_approved;
                $overtimeMap[$dk]['segments'][] = [
                    'title'      => $seg->overtimePolicy?->title ?? 'OT',
                    'start_time' => $seg->start_time,
                    'end_time'   => $seg->end_time,
                    'hours'      => (float) $seg->hours_approved,
                ];
            }
        }

        // ── Leave — target user only ──
        $leaveRecords = LeaveRequest::where('user_id', $targetUserId)
            ->where('status', 'approved')
            ->where(function($q) use ($month, $year) {
                $q->whereMonth('start_date', $month)->whereYear('start_date', $year)
                ->orWhereMonth('end_date',   $month)->whereYear('end_date',   $year);
            })
            ->get();

        $leaveDateMap = [];
        foreach ($leaveRecords as $leave) {
            $start      = \Carbon\Carbon::parse($leave->start_date);
            $end        = \Carbon\Carbon::parse($leave->end_date);
            $totalSpan  = max(1, $start->diffInDays($end) + 1); // leave ကြာချိန် (calendar days)
            $dayValue   = round((float)$leave->total_days / $totalSpan, 4); // တစ်ရက်ကျ days

            $current = $start->copy();
            while ($current <= $end) {
                $dk = $current->format('Y-m-d');
                if (!isset($leaveDateMap[$dk])) {
                    $leaveDateMap[$dk] = [];
                }
                $leaveDateMap[$dk][] = [
                    'type'       => $leave->leave_type,
                    'total_days' => $dayValue,        // ← proportional ထည့်
                    'is_half'    => $leave->total_days < 1,
                    'day_type'   => $leave->day_type,
                    'user_id'    => $leave->user_id,
                    'reason'     => $leave->note,
                ];
                $current->addDay();
            }
        }

        return Inertia::render('Payroll/Attendance/Index', [
            'records'              => $query->orderBy('date')->get(),
            'employees'            => $employees,
            'selectedMonth'        => $month,
            'selectedYear'         => $year,
            'selectedEmployee'     => (string) $targetUserId,
            'countryConfig'        => $countryConfig ?? (object)[
                'work_hours_per_day'   => 8,
                'lunch_break_minutes'  => 60,
                'standard_start_time'  => '08:00',
                'lunch_start'          => '12:00',
                'lunch_end'            => '13:00',
            ],
            'publicHolidays'       => $publicHolidays,
            'publicHolidayDetails' => $publicHolidayDetails,
            'overtimeMap'          => $overtimeMap,
            'leaveDateMap'         => $leaveDateMap,
        ]);
    }

public function store(StoreAttendanceRecordRequest $request): \Illuminate\Http\RedirectResponse
{
    $dateStr  = \Carbon\Carbon::parse($request->date)->format('Y-m-d');
    $userId   = $request->user_id;

    // ── Salary rule ──
    $targetUser  = \App\Models\User::find($userId);
    $country     = $targetUser ? \App\Models\Country::where('id', $targetUser->country_id)->first() : null;
    $salaryRule  = $country ? \App\Models\SalaryRule::where('country_id', $country->id)->first() : null;

    $workStartT  = $salaryRule?->work_start      ? substr($salaryRule->work_start, 0, 5)      : '08:00';
    $workEndT    = $salaryRule?->work_end        ? substr($salaryRule->work_end,   0, 5)       : '17:00';
    $lunchStartT = $salaryRule?->lunch_start     ? substr($salaryRule->lunch_start, 0, 5)     : '12:00';
    $lunchEndT   = $salaryRule?->lunch_end       ? substr($salaryRule->lunch_end,   0, 5)      : '13:00';

    // ── Full Day Leave check → block ──
    $fullLeave = \App\Models\LeaveRequest::where('user_id', $userId)
        ->where('status', 'approved')
        ->where('day_type', 'full_day')
        ->whereDate('start_date', '<=', $dateStr)
        ->whereDate('end_date',   '>=', $dateStr)
        ->first();

    if ($fullLeave) {
        return redirect()->back()->withErrors([
            'date' => "Full Day Leave exists on {$dateStr}. Cannot add attendance.",
        ])->withInput();
    }

    // ── AM Half Leave check → check_in must be >= lunch_end ──
    $amLeave = \App\Models\LeaveRequest::where('user_id', $userId)
        ->where('status', 'approved')
        ->where('day_type', 'half_day_am')
        ->whereDate('start_date', '<=', $dateStr)
        ->whereDate('end_date',   '>=', $dateStr)
        ->first();

    if ($amLeave) {
        $checkIn = substr($request->check_in_time, 0, 5);
        if ($checkIn < $lunchEndT) {
            return redirect()->back()->withErrors([
                'check_in_time' => "AM Half Leave on this date. Check-in must be {$lunchEndT} or later.",
            ])->withInput();
        }
    }

    // ── PM Half Leave check → check_out must be <= lunch_start ──
    $pmLeave = \App\Models\LeaveRequest::where('user_id', $userId)
        ->where('status', 'approved')
        ->where('day_type', 'half_day_pm')
        ->whereDate('start_date', '<=', $dateStr)
        ->whereDate('end_date',   '>=', $dateStr)
        ->first();

    if ($pmLeave) {
        $checkOut = substr($request->check_out_time, 0, 5);
        if ($checkOut > $lunchStartT) {
            return redirect()->back()->withErrors([
                'check_out_time' => "PM Half Leave on this date. Check-out must be {$lunchStartT} or earlier.",
            ])->withInput();
        }
    }

    // ── Calculate WH / Late / Short Hours ──
    $toMin = fn($t) => (int)explode(':', $t)[0] * 60 + (int)explode(':', $t)[1];

    $checkIn  = substr($request->check_in_time,  0, 5);
    $checkOut = substr($request->check_out_time, 0, 5);

    $rawIn  = $toMin($checkIn);
    $rawOut = $toMin($checkOut);
    $wsM    = $toMin($workStartT);
    $weM    = $toMin($workEndT);
    $lsM    = $toMin($lunchStartT);
    $leM    = $toMin($lunchEndT);

    // Clamp to work window
    $effIn  = max($rawIn,  $wsM);
    $effOut = min($rawOut, $weM);

    if ($effOut > $effIn) {
        $lunchOverlap = max(0, min($effOut, $leM) - max($effIn, $lsM));
        $workMins     = $effOut - $effIn - $lunchOverlap;
        $wh           = round($workMins / 60, 2);
        $workHours    = $wh == (int)$wh
            ? (int)$wh
            : rtrim(rtrim(number_format($wh, 2), '0'), '.');
    } else {
        $workHours = 0;
    }

    // Late — raw check_in vs work_start (PM shift ဆိုရင် late မဟုတ်ဘူး)
    $lateMin = ($rawIn < $leM) ? max(0, $rawIn - $wsM) : 0;

    // Short hours — raw check_out vs work_end
    $shortRaw   = max(0, ($weM - $rawOut) / 60);
    $shortHours = round($shortRaw, 2);
    $shortHours = $shortHours == (int)$shortHours ? (int)$shortHours : $shortHours;

    // Status
    $status = $lateMin > 0 ? 'late' : 'present';

    // ── Save ──
    AttendanceRecord::updateOrCreate(
        ['user_id' => $userId, 'date' => $request->date],
        [
            'user_id'           => $userId,
            'date'              => $request->date,
            'check_in_time'     => $request->check_in_time,
            'check_out_time'    => $request->check_out_time,
            'work_hours_actual' => $workHours,
            'short_hours'       => $shortHours,
            'late_minutes'      => $lateMin,
            'status'            => $status,
            'note'              => $request->note,
            'created_by'        => Auth::id(),
        ]
    );

    return redirect()->back()->with('success', 'Attendance saved successfully');
}

    public function bulkStore(Request $request): JsonResponse
    {
        $records = $request->input('records', []);
        $created = 0;

        foreach ($records as $record) {
            AttendanceRecord::updateOrCreate(
                [
                    'user_id' => $record['user_id'],
                    'date'    => $record['date'],
                ],
                [
                    ...$record,
                    'created_by' => Auth::id(),
                ]
            );
            $created++;
        }

        return response()->json(['message' => "{$created} attendance records saved"]);
    }

    public function update(StoreAttendanceRecordRequest $request, AttendanceRecord $attendanceRecord): JsonResponse
    {
        $attendanceRecord->update($request->validated());
        return response()->json($attendanceRecord);
    }

    public function destroy(AttendanceRecord $attendanceRecord): \Illuminate\Http\RedirectResponse
    {
        $attendanceRecord->delete();
        return redirect()->back()->with('success', 'Attendance record deleted');
    }
}