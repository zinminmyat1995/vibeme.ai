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
use App\Models\PayrollBonusSchedule;

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

        $periodTemplates = PayrollPeriod::where('country_id', $countryId)
            ->orderBy('period_number')
            ->get()
            ->map(fn($p) => [
                'id'            => $p->id,
                'period_number' => $p->period_number,
                'day'           => $p->day,
                'status'        => $p->status,
            ]);

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
    // GET /payroll/records/list
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

        $record->update(['year' => $request->year, 'month' => $request->month]);

        return response()->json([
            'message' => 'Salary calculated successfully.',
            'record'  => $this->formatRecord($record->fresh(['user', 'payrollPeriod', 'bonuses'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/records/calculate-all  (SSE streaming)
    // ──────────────────────────────────────────────────────────────
    public function calculateAll(Request $request)
    {
        $request->validate([
            'period_id'    => 'required|exists:payroll_periods,id',
            'year'         => 'required|integer|min:2020|max:2099',
            'month'        => 'required|integer|min:1|max:12',
            'resume_from'  => 'nullable|integer',
        ]);

        $period     = PayrollPeriod::findOrFail($request->period_id);
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

        return response()->stream(function () use ($profiles, $period, $year, $month, $resumeFrom) {
            $total    = $profiles->count();
            $done     = 0;
            $errors   = [];
            $skipping = $resumeFrom !== null;

            foreach ($profiles as $profile) {
                if ($skipping) {
                    if ($profile->user_id == $resumeFrom) {
                        $skipping = false;
                    } else {
                        $done++;
                        continue;
                    }
                }

                $name = $profile->user?->name ?? "Employee #{$profile->user_id}";

                echo "data: " . json_encode([
                    'type'     => 'calculating',
                    'name'     => $name,
                    'user_id'  => $profile->user_id,
                    'progress' => $done,
                    'total'    => $total,
                ]) . "\n\n";
                ob_flush(); flush();

                try {
                    $record = $this->salaryCalculationService->calculateForEmployee(
                        $period, $profile, $year, $month
                    );
                    $record->update(['year' => $year, 'month' => $month]);
                    $done++;

                    echo "data: " . json_encode([
                        'type'       => 'done',
                        'name'       => $name,
                        'user_id'    => $profile->user_id,
                        'net_salary' => $record->net_salary,
                        'progress'   => $done,
                        'total'      => $total,
                    ]) . "\n\n";
                    ob_flush(); flush();

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
                    ob_flush(); flush();

                    echo "data: " . json_encode([
                        'type'        => 'stopped',
                        'resume_from' => $profile->user_id,
                        'done'        => $done,
                        'total'       => $total,
                        'errors'      => $errors,
                    ]) . "\n\n";
                    ob_flush(); flush();
                    return;
                }
            }

            echo "data: " . json_encode([
                'type'   => 'complete',
                'done'   => $done,
                'total'  => $total,
                'errors' => $errors,
            ]) . "\n\n";
            ob_flush(); flush();

        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/records/preview
    // ──────────────────────────────────────────────────────────────
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'year'      => 'required|integer',
            'month'     => 'required|integer',
        ]);

        $query = PayrollRecord::with(['user', 'payrollPeriod', 'bonuses'])
            ->where('payroll_period_id', $request->period_id);

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

        return response()->json(['records' => $records, 'summary' => $summary]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/records/{id}
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

        return response()->json(['message' => "{$updated} records approved.", 'updated' => $updated]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /payroll/records/{id}/confirm
    // ──────────────────────────────────────────────────────────────
    public function confirm(PayrollRecord $payrollRecord): JsonResponse
    {
        if ($payrollRecord->status !== 'approved') {
            return response()->json(['message' => 'Only approved records can be confirmed.'], 422);
        }

        $payrollRecord->update(['status' => 'confirmed']);

        if ($payrollRecord->expense_reimbursement > 0) {
            \App\Models\ExpenseRequest::where('user_id', $payrollRecord->user_id)
                ->where('status', 'approved')
                ->whereNull('reimbursed_at')
                ->whereBetween('expense_date', [
                    $payrollRecord->payrollPeriod->start_date ?? now()->startOfMonth(),
                    $payrollRecord->payrollPeriod->end_date   ?? now()->endOfMonth(),
                ])
                ->update(['reimbursed_at' => now()]);
        }

        return response()->json([
            'message' => 'Record confirmed.',
            'record'  => $this->formatRecord($payrollRecord->fresh(['user', 'payrollPeriod', 'bonuses'])),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /payroll/records/confirm-all
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
    // POST /payroll/records/{id}/bonus
    // ──────────────────────────────────────────────────────────────
    public function addBonus(Request $request, PayrollRecord $payrollRecord): JsonResponse
    {
        $request->validate([
            'bonus_type_id' => 'nullable|exists:payroll_bonus_types,id',
            'amount'        => 'required|numeric|min:0',
            'note'          => 'nullable|string|max:255',
        ]);

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

        $totalBonus = PayrollBonus::where('payroll_record_id', $payrollRecord->id)->sum('amount');
        $payrollRecord->update([
            'bonus_amount' => $totalBonus,
            'net_salary'   => $payrollRecord->net_salary
                - $payrollRecord->bonus_amount
                + $totalBonus,
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
    // Bank Export
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

    // ──────────────────────────────────────────────────────────────
    // ✅ FIX: resolveHoursPerDay helper (work_start→work_end−lunch)
    // working_hours_per_day field ကို လုံးဝမသုံး
    // SalaryCalculationService::resolveHoursPerDay() နဲ့ logic တူညီ
    // ──────────────────────────────────────────────────────────────
    private function resolveHoursPerDay(?\App\Models\SalaryRule $rule): float
    {
        $workStart  = $rule?->work_start;
        $workEnd    = $rule?->work_end;
        $lunchStart = $rule?->lunch_start;
        $lunchEnd   = $rule?->lunch_end;

        if ($workStart && $workEnd) {
            $wsMin    = $this->timeToMinutes($workStart);
            $weMin    = $this->timeToMinutes($workEnd);
            $grossMin = $weMin - $wsMin;

            if ($grossMin > 0) {
                $lunchMin = 0;
                if ($lunchStart && $lunchEnd) {
                    $lsMin    = $this->timeToMinutes($lunchStart);
                    $leMin    = $this->timeToMinutes($lunchEnd);
                    $lunchMin = max(0, min($leMin, $weMin) - max($lsMin, $wsMin));
                }
                $netHours = ($grossMin - $lunchMin) / 60;
                if ($netHours > 0) return round($netHours, 4);
            }
        }

        // Fallback: 8h
        return 8.0;
    }

    private function timeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        return (int)($parts[0] ?? 0) * 60 + (int)($parts[1] ?? 0);
    }

    // ──────────────────────────────────────────────────────────────
    // ✅ FIX: calcShortHours — working_hours_per_day မသုံး
    // resolveHoursPerDay() (work_start→work_end−lunch) သုံး
    // ──────────────────────────────────────────────────────────────
    private function calcShortHours(PayrollRecord $r): float
    {
        $shortDeduct = (float) $r->social_security_amount;
        if ($shortDeduct <= 0) return 0;

        $countryId  = $r->payrollPeriod?->country_id;
        $salaryRule = $countryId
            ? \App\Models\SalaryRule::where('country_id', $countryId)->first()
            : null;

        // ✅ working_hours_per_day မသုံး — work_start/end/lunch နဲ့ တွက်
        $hoursPerDay = $this->resolveHoursPerDay($salaryRule);

        $profile = \App\Models\EmployeePayrollProfile::where('user_id', $r->user_id)
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->first();
        if (!$profile || $hoursPerDay <= 0) return 0;

        $cycle        = $salaryRule?->pay_cycle ?? 'monthly';
        $totalPeriods = match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };
        $approxFullWD = ($r->working_days ?? 10) * $totalPeriods;
        if ($approxFullWD <= 0) return 0;

        $hourlyRate = ((float)$profile->base_salary / $approxFullWD) / $hoursPerDay;
        if ($hourlyRate <= 0) return 0;

        return round($shortDeduct / $hourlyRate, 2);
    }

    // ──────────────────────────────────────────────────────────────
    // Format helper
    // ──────────────────────────────────────────────────────────────
    private function formatRecord(PayrollRecord $r): array
    {
        $period    = $r->payrollPeriod;
        $countryId = $period?->country_id;

        // ── Salary deductions breakdown ───────────────────────────
        $salaryDeductionBreakdown = [];
        $profile = null;
        if ($countryId) {
            $deductions = \App\Models\SalaryDeduction::where('country_id', $countryId)
                ->where('is_active', true)
                ->get();
            $profile = \App\Models\EmployeePayrollProfile::where('user_id', $r->user_id)
                ->where('country_id', $countryId)
                ->where('is_active', true)
                ->first();
            $fullBase = $profile ? (float)$profile->base_salary : (float)$r->base_salary;

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

        // ── SalaryRule & cycle ────────────────────────────────────
        $salaryRule   = \App\Models\SalaryRule::where('country_id', $countryId)->first();
        $cycle        = $salaryRule?->pay_cycle ?? 'monthly';
        $totalPeriods = match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };
        $isLastPeriod = ($r->payrollPeriod?->period_number ?? 1) === $totalPeriods;

        // ✅ FIX: hours_per_day — working_hours_per_day မသုံး
        $hoursPerDay = $this->resolveHoursPerDay($salaryRule);

        // ── Deduction amounts stored ──────────────────────────────
        $lateDeductStored  = (float) $r->tax_amount;
        $shortDeductStored = (float) $r->social_security_amount;

        $salaryDeductTotal = $isLastPeriod
            ? collect($salaryDeductionBreakdown)->sum('amount')
            : 0;

        // ── Period date range (this period) ──────────────────────
        $cutoff    = $salaryRule?->payroll_cutoff_day ?? 25;
        $periodNum = $r->payrollPeriod?->period_number ?? 1;
        $endDay    = $r->payrollPeriod?->day ?? $cutoff;
        $year      = $r->year ?? now()->year;
        $month     = $r->month ?? now()->month;

        // ── Period dates — getPeriodRange() နဲ့ exact same logic ──
        $base     = \Carbon\Carbon::create($year, $month, 1)->subMonth();
        $baseLast = $base->daysInMonth;
        $reqLast  = \Carbon\Carbon::create($year, $month, 1)->daysInMonth;

        $baseDate = fn(int $day) => \Carbon\Carbon::create($base->year, $base->month, min($day, $baseLast));
        $reqDate  = fn(int $day) => \Carbon\Carbon::create($year, $month, min($day, $reqLast));

        $getPeriodDay = function(int $pNum) use ($countryId, $cycle, $salaryRule, $cutoff, $totalPeriods): int {
            $rec = \App\Models\PayrollPeriod::where('country_id', $countryId)
                ->where('period_number', $pNum)->first();
            if ($rec) return (int) $rec->day;
            return match ($cycle) {
                'semi_monthly' => $pNum === 1 ? (int)round($cutoff / 2) : $cutoff,
                'ten_day'      => (int)round($cutoff * $pNum / $totalPeriods),
                default        => $cutoff,
            };
        };

        if ($totalPeriods === 1) {
            // Monthly — prev month cutoff+1 → this month cutoff
            $p1Day       = $getPeriodDay(1);
            $periodStart = $baseDate($p1Day)->addDay();
            $periodEnd   = $reqDate($p1Day);

        } elseif ($periodNum === $totalPeriods) {
            // Last period — base month prev+1 → this month end
            $prevDay     = $getPeriodDay($totalPeriods - 1);
            $thisDay     = $getPeriodDay($totalPeriods);
            $periodStart = $baseDate($prevDay)->addDay();
            $periodEnd   = $reqDate($thisDay);

        } elseif ($periodNum === 1) {
            // First period (not last) — entirely in base month
            $lastDay2    = $getPeriodDay($totalPeriods);
            $thisDay     = $getPeriodDay(1);
            $periodStart = $baseDate($lastDay2)->addDay();
            $periodEnd   = $baseDate($thisDay);

        } else {
            // Middle periods — entirely in base month
            $prevDay     = $getPeriodDay($periodNum - 1);
            $thisDay     = $getPeriodDay($periodNum);
            $periodStart = $baseDate($prevDay)->addDay();
            $periodEnd   = $baseDate($thisDay);
        }

        // ✅ FIX: Full month range for attendance_details query
        // attendance records (late/short) က payroll period ထက် ပိုကျယ်တဲ့
        // full month range ထဲမှာ ရှိတဲ့အတွက် fullStart→fullEnd သုံးရမယ်
        //
        // Full month = P1 start → last period end
        // P1 start: previous month's last period end day + 1
        // Last period end: this month's last period day
        if ($totalPeriods > 1) {
            // P1 start (always from previous month's last period + 1)
            $lastDay         = \Carbon\Carbon::create($year, $month, 1)->daysInMonth; // ← ထည့်
            $prevMonth       = \Carbon\Carbon::create($year, $month, 1)->subMonth();
            $lastPRevRecord  = \App\Models\PayrollPeriod::where('country_id', $countryId)
                ->where('period_number', $totalPeriods)->first();
            $prevLastDay     = $lastPRevRecord
                ? min((int)$lastPRevRecord->day, $prevMonth->daysInMonth)
                : min($cutoff, $prevMonth->daysInMonth);
            $fullStart = \Carbon\Carbon::create($prevMonth->year, $prevMonth->month, $prevLastDay + 1)->startOfDay();

            // Last period end: this month's last period day
            $lastPRecord = \App\Models\PayrollPeriod::where('country_id', $countryId)
                ->where('period_number', $totalPeriods)->first();
            $lastPEndDay = $lastPRecord ? min((int)$lastPRecord->day, $lastDay) : min($cutoff, $lastDay);
            $fullEnd     = \Carbon\Carbon::create($year, $month, $lastPEndDay)->endOfDay();
        }  else {
            // Monthly: full month = periodStart → periodEnd (same as this period)
            $fullStart = $periodStart->copy()->startOfDay();
            $fullEnd   = $periodEnd->copy()->endOfDay();
        }

        // ── Leave details ─────────────────────────────────────────
        // IMPORTANT:
        // leave badge summary က payroll full month range ကိုအခြေခံပြီးတွက်ထားတာဖြစ်လို့
        // modal detail query ကလည်း fullStart → fullEnd နဲ့တူရမယ်
        $leaveDetails = \App\Models\LeaveRequest::where('user_id', $r->user_id)
            ->where('status', 'approved')
            ->where(function ($q) use ($fullStart, $fullEnd) {
                $q->whereBetween('start_date', [$fullStart->toDateString(), $fullEnd->toDateString()])
                ->orWhereBetween('end_date',  [$fullStart->toDateString(), $fullEnd->toDateString()])
                ->orWhere(function ($q2) use ($fullStart, $fullEnd) {
                    $q2->where('start_date', '<=', $fullStart->toDateString())
                        ->where('end_date',   '>=', $fullEnd->toDateString());
                });
            })
            ->orderBy('start_date')
            ->get()
            ->map(fn($l) => [
                'start_date' => \Carbon\Carbon::parse($l->start_date)->format('d M Y'),
                'end_date'   => \Carbon\Carbon::parse($l->end_date)->format('d M Y'),
                'leave_type' => $l->leave_type,
                'day_type'   => $l->day_type ?? null,
                'total_days' => (float) $l->total_days,
                'is_paid'    => (bool) $l->is_paid,
                'note'       => $l->note,
            ])->values()->toArray();

            // ── OT details ────────────────────────────────────────────
            // IMPORTANT:
            // OT summary (overtime_hours / overtime_amount) က full payroll range အပေါ်မူတည်ပြီးတွက်ထားတာဖြစ်လို့
            // modal detail query ကလည်း fullStart → fullEnd သုံးရမယ်
            $otDetails = \App\Models\OvertimeRequestSegment::with('overtimePolicy')
                ->whereHas('overtimeRequest', function ($q) use ($r) {
                    $q->where('user_id', $r->user_id)
                    ->where('status', 'approved');
                })
                ->whereBetween('segment_date', [
                    $fullStart->toDateString(),
                    $fullEnd->toDateString()
                ])
                ->where('hours_approved', '>', 0)
                ->get()
                ->map(fn($s) => [
                    'date'       => \Carbon\Carbon::parse($s->segment_date)->format('d M Y'),
                    'policy'     => $s->overtimePolicy?->title ?? 'OT',
                    'rate_type'  => $s->overtimePolicy?->rate_type ?? 'multiplier',
                    'rate_value' => (float)($s->overtimePolicy?->rate_value ?? 1.5),
                    'hours'      => (float)$s->hours_approved,
                    'start_time' => $s->start_time,
                    'end_time'   => $s->end_time,
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

        // ✅ FIX: attendance_details — fullStart→fullEnd သုံး
        // (payroll period range မဟုတ်ဘဲ full month range သုံးမှ
        //  late records တွေ ပါလာမှာ — e.g. March 25 late)
        $attendanceDetails = \App\Models\AttendanceRecord::where('user_id', $r->user_id)
            ->whereBetween('date', [$fullStart->toDateString(), $fullEnd->toDateString()])
            ->whereIn('status', ['late', 'present', 'half_day'])
            ->where(function ($q) {
                $q->where('late_minutes', '>', 0)
                  ->orWhere('work_hours_actual', '>', 0);
            })
            ->orderBy('date')
            ->get()
            ->map(fn($a) => [
                'date'         => \Carbon\Carbon::parse($a->date)->format('d M Y'),
                'check_in'     => $a->check_in_time  ? substr($a->check_in_time,  0, 5) : null,
                'check_out'    => $a->check_out_time ? substr($a->check_out_time, 0, 5) : null,
                'work_hours'   => (float)$a->work_hours_actual,
                'late_minutes' => (int)$a->late_minutes,
                'status'       => $a->status,
            ])->values()->toArray();

        // ── Bonus details ─────────────────────────────────────
        $bonusDetails = $r->bonuses?->map(fn($b) => [
            'id'               => $b->id,
            'bonus_type_id'    => $b->bonus_type_id,
            'type_name'        => $b->bonusType?->name ?? 'Bonus',
            'calculation_type' => $b->bonusType?->calculation_type ?? 'flat',
            'rate'             => (float)($b->bonusType?->value ?? 0),
            'amount'           => (float) $b->amount,
            'note'             => $b->note,
        ])->values()->toArray() ?? [];

        // Fallback for scheduled bonus:
        // manual bonus rows မရှိပေမယ့် bonus_amount ရှိနေတဲ့ case
        if (empty($bonusDetails) && (float)$r->bonus_amount > 0 && $countryId && $profile) {
            $payMonth = (int)($r->month ?? now()->month);
            $quarter  = (int) ceil($payMonth / 3);
            $empType  = $profile->user?->employment_type ?? 'permanent';

            $scheduledRows = [];

            foreach (
                PayrollBonusSchedule::with('bonusType')
                    ->where('country_id', $countryId)
                    ->where('is_active', true)
                    ->get() as $sched
            ) {
                $bt = $sched->bonusType;
                if (!$bt || !$bt->is_active) continue;

                if ($empType === 'probation' && !($salaryRule?->bonus_during_probation ?? false)) continue;
                if ($empType === 'contract'  && !($salaryRule?->bonus_for_contract ?? true)) continue;

                $qualifies = match ($sched->frequency) {
                    'monthly'   => true,

                    // quarter end month only
                    'quarterly' => match ((int)$sched->pay_quarter) {
                        1 => $payMonth === 3,
                        2 => $payMonth === 6,
                        3 => $payMonth === 9,
                        4 => $payMonth === 12,
                        default => false,
                    },

                    'yearly',
                    'once'      => (int)$sched->pay_month === $payMonth,

                    default     => false,
                };

                if (!$qualifies) continue;

                $amount = $bt->calculation_type === 'percentage'
                    ? round((float)$profile->base_salary * ((float)$bt->value / 100), 2)
                    : round((float)$bt->value, 2);

                $scheduledRows[] = [
                    'id'               => null,
                    'bonus_type_id'    => $bt->id,
                    'type_name'        => $bt->name,
                    'calculation_type' => $bt->calculation_type,
                    'rate'             => (float)$bt->value,
                    'amount'           => $amount,
                    'note'             => null,
                ];
            }

            if (!empty($scheduledRows)) {
                $bonusDetails = $scheduledRows;
            }
        }

        // ── Expense details for popup ─────────────────────────────
        $expenseDetails = \App\Models\ExpenseRequest::where('user_id', $r->user_id)
            ->where('status', 'approved')
            ->whereNull('reimbursed_at')
            ->whereBetween('expense_date', [
                $periodStart->toDateString(),
                $periodEnd->toDateString(),
            ])
            ->get()
            ->map(fn($e) => [
                'id'           => $e->id,
                'title'        => $e->title,
                'category'     => $e->category,
                'amount'       => (float) $e->amount,
                'currency'     => $e->currency,
                'expense_date' => \Carbon\Carbon::parse($e->expense_date)->format('d M Y'),
                'description'  => $e->description,
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
            'expense_reimbursement'  => (float) ($r->expense_reimbursement ?? 0),
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
            // ✅ FIX: hours_per_day ထည့် — JSX မှာ hard-coded 8 မသုံးနဲ့တော့
            'hours_per_day'               => $hoursPerDay,
            // Deduction breakdown
            'late_deduction'              => $lateDeductStored,
            'short_hour_deduction'        => $shortDeductStored,
            'salary_deduction_breakdown'  => $isLastPeriod ? $salaryDeductionBreakdown : [],
            'unpaid_leave_deduction'      => 0,
            // Detail data for click-to-expand
            'leave_details'      => $leaveDetails,
            'ot_details'         => $otDetails,
            'allowance_details'  => $allowanceDetails,
            'attendance_details' => $attendanceDetails,
            'bonuses' => $bonusDetails,
            'expense_details' => $expenseDetails,
        ];
    }
}