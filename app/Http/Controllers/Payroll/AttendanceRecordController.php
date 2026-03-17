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

    // Target user — HR/Admin ဆိုရင် selected employee, မဟုတ်ရင် ကိုယ်တိုင်
    $targetUserId = $request->filled('employee_id')
        ? $request->employee_id
        : $user->id;

    $query = AttendanceRecord::with('user')
        ->whereMonth('date', $month)
        ->whereYear('date',  $year);

    if (in_array($roleName, ['member', 'employee'])) {
        $query->where('user_id', $user->id);
    } elseif ($roleName === 'management') {
        $query->whereHas('user', fn($q) => $q->where('country', $user->country));
    } elseif ($roleName === 'hr') {
        $query->whereHas('user', fn($q) => $q->where('country', $user->country));
    }

    if ($request->filled('employee_id') && in_array($roleName, ['hr', 'admin'])) {
        $query->where('user_id', $request->employee_id);
    }

    // Employees dropdown
    $employees = [];
    if ($roleName === 'hr') {
        $employees = User::select('id', 'name', 'avatar_url', 'department', 'position', 'country')
            ->with('role:id,name')
            ->where('is_active', 1)
            ->where('country', $user->country)
            ->get();
    } elseif ($roleName === 'admin') {
        $employees = User::select('id', 'name', 'avatar_url', 'department', 'position', 'country')
            ->with('role:id,name')
            ->where('is_active', 1)
            ->get();
    }

    $countryConfig = Country::where('name', $user->country)
        ->select('work_hours_per_day', 'lunch_break_minutes', 'standard_start_time')
        ->first();

    $country = Country::where('name', $user->country)->first();

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

    // ── OT — target user only ──
    $overtimeRecords = OvertimeRequest::where('user_id', $targetUserId)
        ->where('status', 'approved')
        ->whereMonth('date', $month)
        ->whereYear('date', $year)
        ->get()
        ->keyBy(fn($r) => \Carbon\Carbon::parse($r->date)->format('Y-m-d'));

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
        $start   = \Carbon\Carbon::parse($leave->start_date);
        $end     = \Carbon\Carbon::parse($leave->end_date);
        $current = $start->copy();
        while ($current <= $end) {
            $dk = $current->format('Y-m-d');
            $leaveDateMap[$dk] = [
                'type'       => $leave->leave_type,
                'total_days' => $leave->total_days,
                'is_half'    => $leave->total_days < 1,
                'day_type'   => $leave->day_type,  
                'user_id'    => $leave->user_id,
            ];
            $current->addDay();
        }
    }

    return Inertia::render('Payroll/Attendance/Index', [
        'records'              => $query->orderBy('date')->get(),
        'employees'            => $employees,
        'selectedMonth'        => $month,
        'selectedYear'         => $year,
        'selectedEmployee'     => $request->employee_id,
        'countryConfig'        => $countryConfig ?? (object)[
            'work_hours_per_day'   => 8,
            'lunch_break_minutes'  => 60,
            'standard_start_time'  => '09:00',
        ],
        'publicHolidays'       => $publicHolidays,
        'publicHolidayDetails' => $publicHolidayDetails,
        'overtimeMap'          => $overtimeRecords->map(fn($r) => ['hours_approved' => $r->hours_approved])->toArray(),
        'leaveDateMap'         => $leaveDateMap,
    ]);
}

    public function store(StoreAttendanceRecordRequest $request): \Illuminate\Http\RedirectResponse
    {
        AttendanceRecord::updateOrCreate(
            [
                'user_id' => $request->user_id,
                'date'    => $request->date,
            ],
            [
                ...$request->validated(),
                'created_by' => Auth::id(),
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

    public function destroy(AttendanceRecord $attendanceRecord): JsonResponse
    {
        $attendanceRecord->delete();
        return response()->json(['message' => 'Attendance record deleted']);
    }
}