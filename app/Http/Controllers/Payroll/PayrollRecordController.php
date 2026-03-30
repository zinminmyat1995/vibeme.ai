<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\EmployeePayrollProfile;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\PayrollBonus;
use App\Models\SalaryRule;
use App\Services\Payroll\BankExportService;
use App\Services\Payroll\SalaryCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PayrollRecordController extends Controller
{
    public function __construct(
        private BankExportService        $bankExportService,
        private SalaryCalculationService $salaryCalculationService,
    ) {}

    // ──────────────────────────────────────────────────────────────
    // Inertia Page — /payroll/records  (HR only)
    // ──────────────────────────────────────────────────────────────
    public function page(Request $request): \Inertia\Response
    {
        $hr         = Auth::user();
        $countryId  = $hr->country_id;
        $salaryRule = SalaryRule::where('country_id', $countryId)->first();

        // ── Period templates for this country ──
        $periodTemplates = PayrollPeriod::where('country_id', $countryId)
            ->orderBy('period_number')
            ->get()
            ->map(fn($p) => [
                'id'            => $p->id,
                'period_number' => $p->period_number,
                'day'           => $p->day,
                'status'        => $p->status,
            ]);

        // ── Employees with active profile ──
        $employees = EmployeePayrollProfile::with('user')
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->get()
            ->map(fn($p) => [
                'id'         => $p->user_id,
                'name'       => $p->user?->name,
                'position'   => $p->user?->position,
                'department' => $p->user?->department,
                'avatar_url' => $p->user?->avatar_url,
                'profile_id' => $p->id,
            ]);

        return Inertia::render('Payroll/Records/Index', [
            'salaryRule'      => $salaryRule ? [
                'pay_cycle'           => $salaryRule->pay_cycle,
                'payroll_cutoff_day'  => $salaryRule->payroll_cutoff_day,
                'currency_code'       => $salaryRule->currency?->currency_code,
            ] : null,
            'periodTemplates' => $periodTemplates,
            'employees'       => $employees,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/records/list  (JSON — for current period)
    // ──────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $query = PayrollRecord::with(['user', 'payrollPeriod', 'bonuses']);

        if ($user->hasRole('member')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('management')) {
            $query->whereHas('user', fn($q) => $q->where('country_id', $user->country_id));
        }

        $records = $query
            ->when($request->payroll_period_id, fn($q) => $q->where('payroll_period_id', $request->payroll_period_id))
            ->when($request->user_id,           fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->year,              fn($q) => $q->where('year', $request->year))
            ->when($request->month,             fn($q) => $q->where('month', $request->month))
            ->get()
            ->map(fn($r) => $this->formatRecord($r));

        return response()->json($records);
    }

    // ──────────────────────────────────────────────────────────────
    // POST /payroll/records/calculate-single
    // Calculate salary for one employee
    // ──────────────────────────────────────────────────────────────
    public function calculateSingle(Request $request): JsonResponse
    {
        $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'user_id'   => 'required|exists:users,id',
            'year'      => 'required|integer|min:2020|max:2099',
            'month'     => 'required|integer|min:1|max:12',
        ]);

        $period  = PayrollPeriod::findOrFail($request->period_id);
        $profile = EmployeePayrollProfile::where('user_id', $request->user_id)
            ->where('country_id', $period->country_id)
            ->where('is_active', true)
            ->first();

        if (!$profile) {
            return response()->json(['message' => 'No active payroll profile found for this employee.'], 422);
        }

        $record = $this->salaryCalculationService->calculateForEmployee(
            $period,
            $profile,
            (int) $request->year,
            (int) $request->month
        );

        // Save year/month on record for filtering
        $record->update(['year' => $request->year, 'month' => $request->month]);

        return response()->json([
            'message' => 'Salary calculated successfully.',
            'record'  => $this->formatRecord($record->fresh(['user', 'payrollPeriod', 'bonuses'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // POST /payroll/records/calculate-all  (SSE streaming)
    // Calculate all employees one-by-one with real-time progress
    // ──────────────────────────────────────────────────────────────
    public function calculateAll(Request $request)
    {
        $request->validate([
            'period_id'    => 'required|exists:payroll_periods,id',
            'year'         => 'required|integer|min:2020|max:2099',
            'month'        => 'required|integer|min:1|max:12',
            'resume_from'  => 'nullable|integer', // user_id to resume from after error
        ]);

        $period    = PayrollPeriod::findOrFail($request->period_id);
        $resumeFrom = $request->resume_from ? (int) $request->resume_from : null;

        $profiles = EmployeePayrollProfile::with('user')
            ->where('country_id', $period->country_id)
            ->where('is_active', true)
            ->orderBy('user_id')
            ->get();

        if ($profiles->isEmpty()) {
            return response()->json(['message' => 'No active employee profiles found.'], 422);
        }

        $year  = (int) $request->year;
        $month = (int) $request->month;

        // SSE streaming response
        return response()->stream(function () use ($profiles, $period, $year, $month, $resumeFrom) {
            $total     = $profiles->count();
            $done      = 0;
            $errors    = [];
            $skipping  = $resumeFrom !== null;

            foreach ($profiles as $profile) {
                // Resume: skip already-processed employees
                if ($skipping) {
                    if ($profile->user_id == $resumeFrom) {
                        $skipping = false;
                    } else {
                        $done++;
                        continue;
                    }
                }

                $name = $profile->user?->name ?? "Employee #{$profile->user_id}";

                // Send "calculating" event
                echo "data: " . json_encode([
                    'type'     => 'calculating',
                    'name'     => $name,
                    'user_id'  => $profile->user_id,
                    'progress' => $done,
                    'total'    => $total,
                ]) . "\n\n";
                ob_flush();
                flush();

                try {
                    $record = $this->salaryCalculationService->calculateForEmployee(
                        $period, $profile, $year, $month
                    );

                    $record->update(['year' => $year, 'month' => $month]);

                    $done++;

                    // Send "done" event for this employee
                    echo "data: " . json_encode([
                        'type'       => 'done',
                        'name'       => $name,
                        'user_id'    => $profile->user_id,
                        'net_salary' => $record->net_salary,
                        'progress'   => $done,
                        'total'      => $total,
                    ]) . "\n\n";
                    ob_flush();
                    flush();

                } catch (\Exception $e) {
                    $errors[] = ['user_id' => $profile->user_id, 'name' => $name, 'error' => $e->getMessage()];

                    echo "data: " . json_encode([
                        'type'     => 'error',
                        'name'     => $name,
                        'user_id'  => $profile->user_id,
                        'message'  => $e->getMessage(),
                        'progress' => $done,
                        'total'    => $total,
                    ]) . "\n\n";
                    ob_flush();
                    flush();

                    // Stop on error — HR can continue from here
                    echo "data: " . json_encode([
                        'type'        => 'stopped',
                        'resume_from' => $profile->user_id,
                        'done'        => $done,
                        'total'       => $total,
                        'errors'      => $errors,
                    ]) . "\n\n";
                    ob_flush();
                    flush();
                    return;
                }
            }

            // All done
            echo "data: " . json_encode([
                'type'   => 'complete',
                'done'   => $done,
                'total'  => $total,
                'errors' => $errors,
            ]) . "\n\n";
            ob_flush();
            flush();

        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no', // disable nginx buffering
            'Connection'        => 'keep-alive',
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/records/preview
    // Preview list for a period/year/month
    // ──────────────────────────────────────────────────────────────
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'year'      => 'required|integer',
            'month'     => 'required|integer',
        ]);

        // Query by period_id — always works
        // year/month filter added only if columns exist (after migration)
        $query = PayrollRecord::with(['user', 'payrollPeriod', 'bonuses'])
            ->where('payroll_period_id', $request->period_id);

        // Add year/month filter only if columns exist
        if (\Schema::hasColumn('payroll_records', 'year')) {
            $query->where('year',  $request->year)
                  ->where('month', $request->month);
        }

        $records = $query->get()->map(fn($r) => $this->formatRecord($r));

        $summary = [
            'total_employees'   => $records->count(),
            'total_base_salary' => $records->sum('base_salary'),
            'total_allowances'  => $records->sum('total_allowances'),
            'total_overtime'    => $records->sum('overtime_amount'),
            'total_bonus'       => $records->sum('bonus_amount'),
            'total_deductions'  => $records->sum('total_deductions'),
            'total_tax'         => $records->sum('tax_amount'),
            'total_net_salary'  => $records->sum('net_salary'),
        ];

        return response()->json([
            'records' => $records,
            'summary' => $summary,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/records/{id}  — single record detail
    // ──────────────────────────────────────────────────────────────
    public function show(PayrollRecord $payrollRecord): JsonResponse
    {
        $user = Auth::user();

        if ($user->hasRole('member') && $payrollRecord->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($this->formatRecord(
            $payrollRecord->load(['user', 'payrollPeriod', 'bonuses'])
        ));
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /payroll/records/{id}/approve
    // ──────────────────────────────────────────────────────────────
    public function approve(PayrollRecord $payrollRecord): JsonResponse
    {
        $payrollRecord->update(['status' => 'approved']);

        return response()->json([
            'message' => 'Record approved.',
            'record'  => $this->formatRecord($payrollRecord->fresh(['user', 'payrollPeriod', 'bonuses'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /payroll/records/approve-all
    // Approve all draft/calculated records for a period
    // ──────────────────────────────────────────────────────────────
    public function approveAll(Request $request): JsonResponse
    {
        $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'year'      => 'required|integer',
            'month'     => 'required|integer',
        ]);

        $updated = PayrollRecord::where('payroll_period_id', $request->period_id)
            ->where('year',  $request->year)
            ->where('month', $request->month)
            ->whereIn('status', ['draft', 'calculated'])
            ->update(['status' => 'approved']);

        return response()->json([
            'message' => "{$updated} records approved.",
            'updated' => $updated,
        ]);
    }

// ──────────────────────────────────────────────────────────────
// PATCH /payroll/records/{id}/confirm
// Confirm (lock) a single approved record
// ──────────────────────────────────────────────────────────────
public function confirm(PayrollRecord $payrollRecord): JsonResponse
{
    if ($payrollRecord->status !== 'approved') {
        return response()->json(['message' => 'Only approved records can be confirmed.'], 422);
    }

    $payrollRecord->update(['status' => 'confirmed']);

    return response()->json([
        'message' => 'Record confirmed.',
        'record'  => $this->formatRecord($payrollRecord->fresh(['user', 'payrollPeriod', 'bonuses'])),
    ]);
}

// ──────────────────────────────────────────────────────────────
// PATCH /payroll/records/confirm-all
// Confirm all approved records for a period
// ──────────────────────────────────────────────────────────────
public function confirmAll(Request $request): JsonResponse
{
    $request->validate([
        'period_id' => 'required|exists:payroll_periods,id',
        'year'      => 'required|integer',
        'month'     => 'required|integer',
    ]);

    $total = PayrollRecord::where('payroll_period_id', $request->period_id)
        ->where('year',  $request->year)
        ->where('month', $request->month)
        ->count();

    $approvedCount = PayrollRecord::where('payroll_period_id', $request->period_id)
        ->where('year',  $request->year)
        ->where('month', $request->month)
        ->where('status', 'approved')
        ->count();

    if ($approvedCount < $total) {
        return response()->json([
            'message' => "Cannot confirm — {$approvedCount} of {$total} records are approved. Please approve all records first.",
        ], 422);
    }

    $updated = PayrollRecord::where('payroll_period_id', $request->period_id)
        ->where('year',  $request->year)
        ->where('month', $request->month)
        ->where('status', 'approved')
        ->update(['status' => 'confirmed']);

    return response()->json([
        'message' => "{$updated} records confirmed and locked.",
        'updated' => $updated,
    ]);
}
    // ──────────────────────────────────────────────────────────────
    // PATCH /payroll/records/{id}/add-bonus
    // Add / update bonus amount for a record
    // ──────────────────────────────────────────────────────────────
    public function addBonus(Request $request, PayrollRecord $payrollRecord): JsonResponse
    {
        $request->validate([
            'bonus_type_id' => 'nullable|exists:payroll_bonus_types,id',
            'amount'        => 'required|numeric|min:0',
            'note'          => 'nullable|string|max:255',
        ]);

        // Create bonus entry
        $bonus = PayrollBonus::updateOrCreate(
            [
                'payroll_record_id' => $payrollRecord->id,
                'bonus_type_id'     => $request->bonus_type_id,
            ],
            [
                'amount'     => $request->amount,
                'note'       => $request->note,
                'created_by' => Auth::id(),
            ]
        );

        // Recalculate total bonus on record
        $totalBonus = PayrollBonus::where('payroll_record_id', $payrollRecord->id)->sum('amount');
        $payrollRecord->update([
            'bonus_amount' => $totalBonus,
            'net_salary'   => $payrollRecord->net_salary
                - $payrollRecord->bonus_amount    // remove old bonus
                + $totalBonus,                    // add new total
        ]);

        return response()->json([
            'message' => 'Bonus added.',
            'record'  => $this->formatRecord($payrollRecord->fresh(['user', 'payrollPeriod', 'bonuses'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // DELETE /payroll/records/{record}/bonuses/{bonus}
    // ──────────────────────────────────────────────────────────────
    public function removeBonus(PayrollRecord $payrollRecord, PayrollBonus $payrollBonus): JsonResponse
    {
        $payrollBonus->delete();

        $totalBonus = PayrollBonus::where('payroll_record_id', $payrollRecord->id)->sum('amount');
        $payrollRecord->update([
            'bonus_amount' => $totalBonus,
            'net_salary'   => ($payrollRecord->base_salary
                + $payrollRecord->total_allowances
                + $payrollRecord->overtime_amount
                + $totalBonus)
                - $payrollRecord->total_deductions
                - $payrollRecord->tax_amount
                - $payrollRecord->social_security_amount,
        ]);

        return response()->json([
            'message' => 'Bonus removed.',
            'record'  => $this->formatRecord($payrollRecord->fresh(['user', 'payrollPeriod', 'bonuses'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // Bank Export (existing)
    // ──────────────────────────────────────────────────────────────
    public function exportBank(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        return $this->bankExportService->export($request->input('payroll_period_id'));
    }

    public function exportBankPreview(Request $request): JsonResponse
    {
        return response()->json(
            $this->bankExportService->preview($request->input('payroll_period_id'))
        );
    }

    /**
     * Back-calculate short hours from stored shortDeduct amount
     * shortDeduct = hourly_rate × short_hours
     * hourly_rate = (base_salary_full / full_month_WD) / hours_per_day
     * We approximate using salary rule
     */
    private function calcShortHours(PayrollRecord $r): float
    {
        $shortDeduct = (float) $r->social_security_amount;
        if ($shortDeduct <= 0) return 0;

        $countryId  = $r->payrollPeriod?->country_id;
        $salaryRule = $countryId
            ? \App\Models\SalaryRule::where('country_id', $countryId)->first()
            : null;
        $hoursPerDay = (float)($salaryRule?->working_hours_per_day ?? 8);

        $profile = \App\Models\EmployeePayrollProfile::where('user_id', $r->user_id)
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->first();
        if (!$profile || $hoursPerDay <= 0) return 0;

        // Approximate full_month_WD — use working_days from record × totalPeriods
        $cycle        = $salaryRule?->pay_cycle ?? 'monthly';
        $totalPeriods = match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };
        $approxFullWD = ($r->working_days ?? 10) * $totalPeriods;
        if ($approxFullWD <= 0) return 0;

        $hourlyRate  = ((float)$profile->base_salary / $approxFullWD) / $hoursPerDay;
        if ($hourlyRate <= 0) return 0;

        return round($shortDeduct / $hourlyRate, 2);
    }

    // ──────────────────────────────────────────────────────────────
    // Format helper
    // ──────────────────────────────────────────────────────────────
    private function formatRecord(PayrollRecord $r): array
    {
        // Get salary deductions breakdown for this country
        $period    = $r->payrollPeriod;
        $countryId = $period?->country_id;
        $salaryDeductionBreakdown = [];
        if ($countryId) {
            $deductions = \App\Models\SalaryDeduction::where('country_id', $countryId)
                ->where('is_active', true)
                ->get();
            $baseSalary = (float) $r->base_salary; // stored base_pay for this period
            // Use full base for percentage calc (same as SalaryCalculationService)
            $profile = \App\Models\EmployeePayrollProfile::where('user_id', $r->user_id)
                ->where('country_id', $countryId)
                ->where('is_active', true)
                ->first();
            $fullBase = $profile ? (float)$profile->base_salary : $baseSalary;

            foreach ($deductions as $d) {
                $type   = $d->deduction_type ?? $d->unit_type ?? 'flat';
                $amount = $type === 'percentage'
                    ? round($fullBase * ((float)$d->amount_per_unit / 100), 2)
                    : (float)$d->amount_per_unit;
                $salaryDeductionBreakdown[] = [
                    'name'   => $d->name,
                    'type'   => $type,
                    'rate'   => (float)$d->amount_per_unit,
                    'amount' => $amount,
                ];
            }
        }

        // Determine if this is the last period
        $salaryRule   = \App\Models\SalaryRule::where('country_id', $countryId)->first();
        $cycle        = $salaryRule?->pay_cycle ?? 'monthly';
        $totalPeriods = match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };
        $isLastPeriod = ($r->payrollPeriod?->period_number ?? 1) === $totalPeriods;

        // Calculate late & short = total_deductions - salary_deductions - unpaid_leave
        // salary_deductions only applies on last period
        $salaryDeductTotal = $isLastPeriod
            ? collect($salaryDeductionBreakdown)->sum('amount')
            : 0;

        $unpaidLeaveDeduct = 0;

        $lateAndShort = max(0, round((float)$r->total_deductions - $salaryDeductTotal - $unpaidLeaveDeduct, 2));

        // late_deduction stored in tax_amount, short_deduction in social_security_amount
        $lateDeductStored  = (float) $r->tax_amount;
        $shortDeductStored = (float) $r->social_security_amount;

        // ── Period date range ─────────────────────────────────────
        $salaryRule2  = \App\Models\SalaryRule::where('country_id', $countryId)->first();
        $cutoff       = $salaryRule2?->payroll_cutoff_day ?? 25;
        $cycle2       = $salaryRule2?->pay_cycle ?? 'monthly';
        $periodNum    = $r->payrollPeriod?->period_number ?? 1;
        $endDay       = $r->payrollPeriod?->day ?? $cutoff;
        $year         = $r->year ?? now()->year;
        $month        = $r->month ?? now()->month;

        $periodService = new \App\Services\Payroll\SalaryCalculationService();
        // Use helper to get period range
        $lastDay     = \Carbon\Carbon::create($year, $month, 1)->daysInMonth;
        $effectiveEnd = min($endDay, $lastDay);
        $periodEnd   = \Carbon\Carbon::create($year, $month, $effectiveEnd);

        if ($periodNum === 1) {
            $prev      = \Carbon\Carbon::create($year, $month, 1)->subMonth();
            $lastPeriodRecord = \App\Models\PayrollPeriod::where('country_id', $countryId)
                ->where('period_number', $totalPeriods)->first();
            $prevEndDay = $lastPeriodRecord ? min((int)$lastPeriodRecord->day, $prev->daysInMonth) : min($cutoff, $prev->daysInMonth);
            $periodStart = \Carbon\Carbon::create($prev->year, $prev->month, $prevEndDay + 1);
        } else {
            $prevPeriodRecord = \App\Models\PayrollPeriod::where('country_id', $countryId)
                ->where('period_number', $periodNum - 1)->first();
            $prevEndDay  = $prevPeriodRecord ? min((int)$prevPeriodRecord->day, $lastDay) : 10;
            $periodStart = \Carbon\Carbon::create($year, $month, $prevEndDay + 1);
        }

        // ── Leave details for this period ─────────────────────────
        $leaveDetails = \App\Models\LeaveRequest::where('user_id', $r->user_id)
            ->where('status', 'approved')
            ->where(function ($q) use ($periodStart, $periodEnd) {
                $q->whereBetween('start_date', [$periodStart, $periodEnd])
                  ->orWhereBetween('end_date',  [$periodStart, $periodEnd]);
            })
            ->get()
            ->map(fn($l) => [
                'start_date' => \Carbon\Carbon::parse($l->start_date)->format('d M Y'),
                'end_date'   => \Carbon\Carbon::parse($l->end_date)->format('d M Y'),
                'leave_type' => $l->leave_type,
                'day_type'   => $l->day_type ?? null,
                'total_days' => $l->total_days,
                'is_paid'    => $l->is_paid,
                'note'       => $l->note,
            ])->values()->toArray();

        // ── OT details for this period ────────────────────────────
        $otDetails = \App\Models\OvertimeRequestSegment::with('overtimePolicy')
            ->whereHas('overtimeRequest', function ($q) use ($r) {
                $q->where('user_id', $r->user_id)->where('status', 'approved');
            })
            ->whereBetween('segment_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->where('hours_approved', '>', 0)
            ->get()
            ->map(fn($s) => [
                'date'          => \Carbon\Carbon::parse($s->segment_date)->format('d M Y'),
                'policy'        => $s->overtimePolicy?->title ?? 'OT',
                'rate_type'     => $s->overtimePolicy?->rate_type ?? 'multiplier',
                'rate_value'    => (float)($s->overtimePolicy?->rate_value ?? 1.5),
                'hours'         => (float)$s->hours_approved,
                'start_time'    => $s->start_time,
                'end_time'      => $s->end_time,
            ])->values()->toArray();

        // ── Allowance details ─────────────────────────────────────
        $allowanceDetails = [];
        if ($isLastPeriod && $profile) {
            foreach ($profile->selectedAllowances as $a) {
                $isPercent = $a->type === 'percentage' || ($a->is_percentage ?? false);
                $allowanceDetails[] = [
                    'name'   => $a->name,
                    'type'   => $isPercent ? 'percentage' : 'flat',
                    'rate'   => (float)$a->value,
                    'amount' => $isPercent
                        ? round((float)$profile->base_salary * ((float)$a->value / 100), 2)
                        : (float)$a->value,
                ];
            }
        }

        // ── Late & Short attendance details ───────────────────────
        $attendanceDetails = \App\Models\AttendanceRecord::where('user_id', $r->user_id)
            ->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->whereIn('status', ['late', 'present', 'half_day'])
            ->where(function($q) {
                $q->where('late_minutes', '>', 0)
                  ->orWhere('work_hours_actual', '>', 0);
            })
            ->get()
            ->map(fn($a) => [
                'date'         => \Carbon\Carbon::parse($a->date)->format('d M Y'),
                'check_in'     => $a->check_in_time  ? substr($a->check_in_time, 0, 5)  : null,
                'check_out'    => $a->check_out_time ? substr($a->check_out_time, 0, 5) : null,
                'work_hours'   => (float)$a->work_hours_actual,
                'late_minutes' => (int)$a->late_minutes,
                'status'       => $a->status,
            ])->values()->toArray();

        return [
            'id'                     => $r->id,
            'user_id'                => $r->user_id,
            'name'                   => $r->user?->name,
            'position'               => $r->user?->position,
            'department'             => $r->user?->department,
            'avatar_url'             => $r->user?->avatar_url,
            'payroll_period_id'      => $r->payroll_period_id,
            'period_number'          => $periodNum,
            'period_start'           => $periodStart->format('d M Y'),
            'period_end'             => $periodEnd->format('d M Y'),
            'year'                   => $year,
            'month'                  => $month,
            'base_salary'            => (float) $r->base_salary,
            'total_allowances'       => (float) $r->total_allowances,
            'total_deductions'       => (float) $r->total_deductions,
            'overtime_amount'        => (float) $r->overtime_amount,
            'bonus_amount'           => (float) $r->bonus_amount,
            'tax_amount'             => (float) $r->tax_amount,
            'social_security_amount' => (float) $r->social_security_amount,
            'net_salary'             => (float) $r->net_salary,
            'working_days'           => $r->working_days,
            'present_days'           => $r->present_days,
            'absent_days'            => $r->absent_days,
            'leave_days_paid'        => (float) $r->leave_days_paid,
            'leave_days_unpaid'      => (float) $r->leave_days_unpaid,
            'overtime_hours'         => (float) $r->overtime_hours,
            'short_hours_total'      => $this->calcShortHours($r),
            'late_minutes_total'     => $r->late_minutes_total,
            'status'                 => $r->status,
            // Deduction breakdown
            'late_deduction'              => $lateDeductStored,
            'short_hour_deduction'        => $shortDeductStored,
            'salary_deduction_breakdown'  => $isLastPeriod ? $salaryDeductionBreakdown : [],
            'unpaid_leave_deduction'      =>  0,
            // Detail data for click-to-expand
            'leave_details'          => $leaveDetails,
            'ot_details'             => $otDetails,
            'allowance_details'      => $allowanceDetails,
            'attendance_details'     => $attendanceDetails,
            'bonuses'                => $r->bonuses?->map(fn($b) => [
                'id'            => $b->id,
                'bonus_type_id' => $b->bonus_type_id,
                'type_name'     => $b->bonusType?->name ?? 'Bonus',
                'amount'        => (float) $b->amount,
                'note'          => $b->note,
            ]) ?? [],
        ];
    }
}