<?php

namespace App\Services\Payroll;

use App\Models\AttendanceRecord;
use App\Models\EmployeePayrollProfile;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\OvertimeRequestSegment;
use App\Models\PayrollBonusSchedule;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\PublicHoliday;
use App\Models\SalaryDeduction;
use App\Models\SalaryRule;
use Carbon\Carbon;

class SalaryCalculationService
{
    // ══════════════════════════════════════════════════════════════
    //  PUBLIC: Calculate all employees in a period
    // ══════════════════════════════════════════════════════════════
    public function calculateForPeriod(PayrollPeriod $period): array
    {
        $profiles = EmployeePayrollProfile::with([
            'user',
            'selectedAllowances',
            'salaryRule.taxBrackets',
            'salaryRule.socialSecurityRule',
            'salaryRule.country',
        ])
            ->where('country_id', $period->country_id)
            ->where('is_active', true)
            ->get();

        $totalNetSalary = 0;
        foreach ($profiles as $profile) {
            $record = $this->calculateForEmployee($period, $profile);
            $totalNetSalary += $record->net_salary;
        }

        return [
            'total_employees'  => $profiles->count(),
            'total_net_salary' => $totalNetSalary,
        ];
    }

    // ══════════════════════════════════════════════════════════════
    //  PUBLIC: Calculate single employee
    //
    //  FLOW:
    //  ─────
    //  daily_rate  = base_salary / full_month_working_days
    //  hourly_rate = daily_rate  / working_hours_per_day
    //
    //  Every period (P1, P2, P3):
    //    base = daily_rate × (present_days + paid_leave_days)
    //    - late_deduction   (period's late minutes × rate)
    //    - short_deduction  (per day: standard_hrs - actual_hrs)
    //
    //  Last period only (+ extras):
    //    + allowances
    //    + overtime_pay   (full month OT hours × hourly_rate × OT_rate)
    //    + bonus          (schedule-based)
    //    - salary_deductions (country rules)
    //    - unpaid_leave_deduction (daily_rate × unpaid_days)
    //    - tax            (progressive on full gross)
    //    - social_security
    // ══════════════════════════════════════════════════════════════
    public function calculateForEmployee(
        PayrollPeriod $period,
        EmployeePayrollProfile $profile,
        int $year  = 0,
        int $month = 0
    ): PayrollRecord {
        if (!$year || !$month) {
            $year  = now()->year;
            $month = now()->month;
        }

        $salaryRule   = $profile->salaryRule;
        $cycle        = $salaryRule?->pay_cycle          ?? 'monthly';
        $cutoff       = $salaryRule?->payroll_cutoff_day ?? 25;
        $periodNumber = $period->period_number           ?? 1;
        $endDay       = $period->day                     ?? $cutoff;
        $countryId    = $period->country_id;

        $totalPeriods = match ($cycle) {
            'semi_monthly' => 2,
            'ten_day'      => 3,
            default        => 1,
        };
        $isLastPeriod = ($periodNumber === $totalPeriods);

        // ── This period date range ────────────────────────────────
        [$startDate, $endDate] = $this->getPeriodRange(
            $year, $month, $cutoff, $cycle, $periodNumber, $endDay, $countryId
        );

        // ── Full month range (Feb25 → Mar24) ─────────────────────
        [$fullStart, $fullEnd] = $this->getFullMonthRange(
            $year, $month, $cutoff, $cycle, $totalPeriods, $endDay, $countryId
        );

        // ── Full month working days (for daily/hourly rate) ───────
        // IMPORTANT: count WD from fullStart to fullEnd (entire payroll month)
        // NOT just this period's range
        $fullMonthWD  = $this->countWorkingDays($fullStart, $fullEnd, $countryId);
        $hoursPerDay  = $this->resolveHoursPerDay($salaryRule);
        $dailyRate    = $fullMonthWD > 0 ? $profile->base_salary / $fullMonthWD : 0;
        $hourlyRate   = $hoursPerDay > 0 ? $dailyRate / $hoursPerDay : 0;

        // ── This period attendance ────────────────────────────────
        $attendance = $this->getAttendanceSummary(
            $profile->user_id, $startDate, $endDate, $countryId
        );

        // ── This period leave ─────────────────────────────────────
        $leave = $this->getLeaveSummary($profile->user_id, $startDate, $endDate);

        // ── Base = daily_rate × (present + paid_leave) ───────────
        $paidDays  = $attendance['present_days'] + $leave['paid_days'];
        $basePay   = round($dailyRate * $paidDays, 2);

        // ── Late deduction (this period) ──────────────────────────
        $lateDeduct = $salaryRule
            ? $this->calculateLateDeduction($salaryRule, $attendance['late_minutes_total'])
            : 0;

        // ── Short hour deduction (this period, per day) ───────────
        $shortDeduct = $this->calculateShortHourDeduction(
            $profile->user_id, $startDate, $endDate, $hoursPerDay, $hourlyRate, $salaryRule
        );

        // ── OT: each period pays its OWN period's OT ─────────────
        // P1→P1 OT, P2→P2 OT, P3→P3 OT (never cross-period)
        $allOtHours     = $this->getOvertimeHours($profile->user_id, $startDate, $endDate);
        $overtimeAmount = $this->calculateOvertimeAmount(
            $dailyRate, $hoursPerDay, $salaryRule, $allOtHours,
            $profile->user_id, $startDate, $endDate
        );

        // ── Init extras (last period only) ───────────────────────
        $totalAllowances      = 0;
        $bonusAmount          = 0;
        $salaryDeductions     = 0;
        $unpaidLeaveDeduct    = 0;
        $taxAmount            = 0;
        $socialSecurityAmount = 0;

        if ($isLastPeriod) {
            // ── Full month leave (for unpaid deduction) ───────────
            $fullLeave = $this->getLeaveSummary($profile->user_id, $fullStart, $fullEnd);

            // ── Allowances (last period only) ─────────────────────
            $totalAllowances = $this->calculateAllowances($profile);

            // ── Bonus (last period only) ──────────────────────────
            $bonusAmount = $this->calculateScheduledBonus(
                $countryId, $profile, $month, $profile->base_salary
            );

            // ── Salary deductions (last period only) ──────────────
            $salaryDeductions = $this->calculateSalaryDeductions(
                $countryId, $profile->base_salary
            );

            // ── Unpaid leave deduction (last period only) ─────────
            $unpaidLeaveDeduct = 0;
        }


        $expenseReimbursement = \App\Models\ExpenseRequest::where('user_id', $profile->user_id)
            ->where('status', 'approved')
            ->whereNull('reimbursed_at')
            ->whereBetween('expense_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->sum('amount');
        $expenseReimbursement = round((float) $expenseReimbursement, 2);

        // ── Net salary ────────────────────────────────────────────
        $periodNet = $basePay
            - $lateDeduct
            - $shortDeduct
            + $overtimeAmount
            + $totalAllowances
            + $bonusAmount
            + $expenseReimbursement
            - $salaryDeductions;

            
        $netSalary = max(0, round($periodNet, 2));

        // ── Total deductions to store in record ───────────────────
        $totalDeductionsStored = round(
            $lateDeduct + $shortDeduct
            + $salaryDeductions,
            2
        );

        \Log::info('SALARY_FINAL_DEBUG', [
            'user_id'          => $profile->user_id,
            'period_id'        => $period->id,
            'period_number'    => $periodNumber,
            'base_pay'         => $basePay,
            'late_deduct'      => $lateDeduct,
            'short_deduct'     => $shortDeduct,
            'salary_deductions'=> $salaryDeductions,
            'unpaid_leave'     => $unpaidLeaveDeduct,
            'total_deductions' => $totalDeductionsStored,
            'allowances'       => $totalAllowances,
            'expense_reimbursement' => $expenseReimbursement,
            'net_salary'       => $netSalary,
        ]);

        // ── Save / update record ──────────────────────────────────
        // Note: tax_amount stores late_deduction, social_security_amount stores short_deduction
        // (reusing existing columns — no migration needed)
        $record = PayrollRecord::updateOrCreate(
            [
                'payroll_period_id' => $period->id,
                'user_id'           => $profile->user_id,
            ],
            [
                'year'                   => $year,
                'month'                  => $month,
                'base_salary'            => $basePay,
                'total_allowances'       => $totalAllowances,
                'total_deductions'       => $totalDeductionsStored,
                'overtime_amount'        => $overtimeAmount,
                'bonus_amount'           => $bonusAmount,
                'expense_reimbursement'  => $expenseReimbursement,
                'tax_amount'             => $lateDeduct,       // stores late deduction
                'social_security_amount' => $shortDeduct,      // stores short hour deduction amount
                'net_salary'             => $netSalary,
                'working_days'           => $attendance['working_days'],
                'present_days'           => $attendance['present_days'],
                'absent_days'            => $attendance['absent_days'],
                'leave_days_paid'        => $leave['paid_days'],
                'leave_days_unpaid'      => $leave['unpaid_days'],
                'overtime_hours'         => $allOtHours,        // actual OT hours
                'late_minutes_total'     => $attendance['late_minutes_total'],
                'status'                 => 'draft',
            ]
        );

        return $record;
    }

    // ══════════════════════════════════════════════════════════════
    //  PERIOD RANGE
    //
    //  P1 start = prev month's last period end day + 1
    //             (e.g. semi: prev P2.day=24 → Feb 25)
    //  P1 end   = this month P1.day (e.g. 10 → Mar 10)
    //  P2 start = P1.day + 1 (e.g. Mar 11)
    //  P2 end   = this month P2.day (e.g. 24 → Mar 24)
    // ══════════════════════════════════════════════════════════════
    private function getPeriodRange(
        int $year, int $month, int $cutoff,
        string $cycle, int $periodNumber, int $endDay, int $countryId = 0
    ): array {
        $totalPeriods = $this->getTotalPeriods($cycle);

        // base month = request month - 1
        $base      = Carbon::create($year, $month, 1)->subMonth();
        $baseY     = $base->year;
        $baseM     = $base->month;
        $baseLast  = $base->daysInMonth;
        $reqLast   = Carbon::create($year, $month, 1)->daysInMonth;

        // Clamp a day to the month's last day
        $baseDate = fn(int $day): Carbon => Carbon::create($baseY, $baseM, min($day, $baseLast));
        $reqDate  = fn(int $day): Carbon => Carbon::create($year, $month, min($day, $reqLast));

        // ── monthly (1 period) ───────────────────────────────────
        if ($totalPeriods === 1) {
            $p1Day = $this->getPeriodEndDay(1, $cycle, $cutoff, $countryId);
            $start = $baseDate($p1Day)->addDay()->startOfDay();
            $end   = $reqDate($p1Day)->endOfDay();
            return [$start, $end];
        }

        // ── multi-period (semi_monthly=2 or ten_day=3) ───────────
        //  Last period  → end in request month
        //  Other periods → start & end in base month
        //  Start of each period = previous period's end day + 1

        if ($periodNumber === $totalPeriods) {
            // Last period
            $prevDay = $this->getPeriodEndDay($totalPeriods - 1, $cycle, $cutoff, $countryId);
            $thisDay = $this->getPeriodEndDay($totalPeriods,     $cycle, $cutoff, $countryId);
            $start   = $baseDate($prevDay)->addDay()->startOfDay();
            $end     = $reqDate($thisDay)->endOfDay();

        } elseif ($periodNumber === 1) {
            // First period — start after last period's day in base month
            $lastDay = $this->getPeriodEndDay($totalPeriods, $cycle, $cutoff, $countryId);
            $thisDay = $this->getPeriodEndDay(1,             $cycle, $cutoff, $countryId);
            $start   = $baseDate($lastDay)->addDay()->startOfDay();
            $end     = $baseDate($thisDay)->endOfDay();

        } else {
            // Middle period(s) — entirely in base month
            $prevDay = $this->getPeriodEndDay($periodNumber - 1, $cycle, $cutoff, $countryId);
            $thisDay = $this->getPeriodEndDay($periodNumber,     $cycle, $cutoff, $countryId);
            $start   = $baseDate($prevDay)->addDay()->startOfDay();
            $end     = $baseDate($thisDay)->endOfDay();
        }

        return [$start, $end];
    }

    // ══════════════════════════════════════════════════════════════
    //  FULL MONTH RANGE (P1 start → LAST period end)
    //  Always fetches last period's day from payroll_periods table
    // ══════════════════════════════════════════════════════════════
    private function getFullMonthRange(
        int $year, int $month, int $cutoff,
        string $cycle, int $totalPeriods, int $endDay, int $countryId = 0
    ): array {
        // P1 start (uses corrected getPeriodRange)
        $p1EndDay = $this->getPeriodEndDay(1, $cycle, $cutoff, $countryId);
        [$fullStart] = $this->getPeriodRange(
            $year, $month, $cutoff, $cycle, 1, $p1EndDay, $countryId
        );

        // Last period end (uses corrected getPeriodRange)
        $lastEndDay = $this->getPeriodEndDay($totalPeriods, $cycle, $cutoff, $countryId);
        [, $fullEnd] = $this->getPeriodRange(
            $year, $month, $cutoff, $cycle, $totalPeriods, $lastEndDay, $countryId
        );

        return [$fullStart, $fullEnd];
    }

    // ══════════════════════════════════════════════════════════════
    //  COUNT WORKING DAYS in a date range (excl. weekends & holidays)
    // ══════════════════════════════════════════════════════════════
    private function countWorkingDays(Carbon $start, Carbon $end, int $countryId): int
    {
        $holidays = PublicHoliday::where('country_id', $countryId)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $count = 0;
        $cur   = $start->copy();
        while ($cur <= $end) {
            if (!$cur->isWeekend() && !in_array($cur->toDateString(), $holidays)) {
                $count++;
            }
            $cur->addDay();
        }
        return $count;
    }

    // ══════════════════════════════════════════════════════════════
    //  ATTENDANCE SUMMARY
    // ══════════════════════════════════════════════════════════════
    private function getAttendanceSummary(
        int $userId, Carbon $start, Carbon $end, int $countryId
    ): array {
        $records = AttendanceRecord::where('user_id', $userId)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get();

        $workingDays = $this->countWorkingDays($start, $end, $countryId);
        $presentDays = $records->whereIn('status', ['present', 'late', 'half_day'])->count();

        \Log::info('ATTENDANCE_DEBUG', [
            'user_id'     => $userId,
            'range'       => $start->toDateString().' → '.$end->toDateString(),
            'records_count' => $records->count(),
            'records'     => $records->map(fn($r) => [
                'date'         => $r->date,
                'status'       => $r->status,
                'late_minutes' => $r->late_minutes,
                'work_hours'   => $r->work_hours_actual,
            ])->toArray(),
            'present_days'       => $presentDays,
            'working_days'       => $workingDays,
            'late_minutes_total' => (int) $records->sum('late_minutes'),
        ]);

        return [
            'working_days'       => $workingDays,
            'present_days'       => $presentDays,
            'absent_days'        => max(0, $workingDays - $presentDays),
            'late_minutes_total' => (int) $records->sum('late_minutes'),
            'records'            => $records, // for short_hour calc
        ];
    }

    // ══════════════════════════════════════════════════════════════
    //  LEAVE SUMMARY
    // ══════════════════════════════════════════════════════════════
    private function getLeaveSummary(int $userId, Carbon $start, Carbon $end): array
    {
        $leaves = LeaveRequest::where('user_id', $userId)
            ->where('status', 'approved')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date',  [$start, $end])
                  ->orWhere(fn($q2) => $q2->where('start_date', '<=', $start)
                                          ->where('end_date',   '>=', $end));
            })
            ->get();

        $paidDays   = 0;
        $unpaidDays = 0;
        $halfDates  = [];

        foreach ($leaves as $leave) {
            $leaveStart = Carbon::parse($leave->start_date)->max($start);
            $leaveEnd   = Carbon::parse($leave->end_date)->min($end);
            $daysIn     = max(0, $leaveStart->diffInDays($leaveEnd) + 1);
            $fullSpan   = max(1, Carbon::parse($leave->start_date)->diffInDays($leave->end_date) + 1);
            $counted    = round((float)($leave->total_days ?? $fullSpan) * ($daysIn / $fullSpan), 2);

            if ($leave->is_paid) {
                $paidDays += $counted;
            } else {
                $unpaidDays += $counted;
            }

            // Track half-day dates for short_hour calc
            if ((float)($leave->total_days ?? 1) <= 0.5 || ($leave->leave_type ?? '') === 'half_day') {
                $cur = $leaveStart->copy();
                while ($cur <= $leaveEnd) {
                    $halfDates[$cur->toDateString()] = true;
                    $cur->addDay();
                }
            }
        }

        return [
            'paid_days'      => $paidDays,
            'unpaid_days'    => $unpaidDays,
            'half_day_dates' => $halfDates,
        ];
    }

    // ══════════════════════════════════════════════════════════════
    //  OVERTIME HOURS — total approved hours (for display)
    // ══════════════════════════════════════════════════════════════
    private function getOvertimeHours(int $userId, Carbon $start, Carbon $end): float
    {
        // Filter by segment_date — authoritative date per segment
        return (float) OvertimeRequestSegment::whereHas('overtimeRequest', function ($q) use ($userId) {
            $q->where('user_id', $userId)->where('status', 'approved');
        })
        ->whereBetween('segment_date', [$start->toDateString(), $end->toDateString()])
        ->sum('hours_approved');
    }

    // ══════════════════════════════════════════════════════════════
    //  OVERTIME PAY — calculated per segment × policy rate
    //
    //  overtime_request_segments.ot_policy_id → overtime_policies
    //  rate_type = multiplier: hourly_rate × rate_value × hours
    //  rate_type = flat:       rate_value × hours
    // ══════════════════════════════════════════════════════════════
    private function calculateOvertimeAmount(
        float $dailyRate, float $hoursPerDay, ?SalaryRule $rule, float $overtimeHours,
        int $userId = 0, ?Carbon $start = null, ?Carbon $end = null
    ): float {
        if ($hoursPerDay <= 0) return 0;
        $hourlyRate = $dailyRate / $hoursPerDay;

        // Calculate from segments with individual policy rates
        if ($userId > 0 && $start && $end) {
            // Query segments by segment_date within period range
            // segment_date is the authoritative date — do NOT filter by parent request dates
            $segments = OvertimeRequestSegment::with('overtimePolicy')
                ->whereHas('overtimeRequest', function ($q) use ($userId) {
                    $q->where('user_id', $userId)
                      ->where('status', 'approved');
                })
                ->whereBetween('segment_date', [$start->toDateString(), $end->toDateString()])
                ->where('hours_approved', '>', 0)
                ->get();

            if ($segments->isEmpty()) return 0;

            $total = 0;
            $debugRows = [];
            foreach ($segments as $seg) {
                $policy        = $seg->overtimePolicy;
                $hoursApproved = (float)$seg->hours_approved;
                $segPay = 0;

                if ($policy && $policy->rate_type === 'multiplier') {
                    $segPay = $hourlyRate * (float)$policy->rate_value * $hoursApproved;
                } elseif ($policy && $policy->rate_type === 'flat') {
                    $segPay = (float)$policy->rate_value * $hoursApproved;
                } else {
                    // No policy — fallback 1.5×
                    $segPay = $hourlyRate * 1.5 * $hoursApproved;
                }

                $total += $segPay;
                $debugRows[] = [
                    'date'          => $seg->segment_date,
                    'policy'        => $policy?->title ?? 'fallback 1.5x',
                    'rate_type'     => $policy?->rate_type ?? 'multiplier',
                    'rate_value'    => $policy?->rate_value ?? 1.5,
                    'hours_approved'=> $hoursApproved,
                    'seg_pay'       => round($segPay, 2),
                ];
            }

            \Log::info('OT_CALC_DEBUG', [
                'user_id'      => $userId,
                'period'       => $start->toDateString().' → '.$end->toDateString(),
                'hourly_rate'  => round($hourlyRate, 4),
                'segments'     => $debugRows,
                'total_ot_pay' => round($total, 2),
            ]);

            return round($total, 2);
        }

        // Fallback (no segments context)
        if ($overtimeHours <= 0) return 0;
        return round($hourlyRate * 1.5 * $overtimeHours, 2);
    }

    // ══════════════════════════════════════════════════════════════
    //  SHORT HOUR DEDUCTION
    //  Per attended day:
    //    standard = hours_per_day  (or /2 if half_day leave)
    //    short    = standard - work_hours_actual
    //    deduct   = short × hourly_rate  (if short > 0)
    // ══════════════════════════════════════════════════════════════
    private function calculateShortHourDeduction(
        int $userId, Carbon $start, Carbon $end,
        float $hoursPerDay, float $hourlyRate,
        ?SalaryRule $rule = null          // ← NEW parameter
    ): float {
        if ($hourlyRate <= 0) return 0;

        $records = AttendanceRecord::where('user_id', $userId)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->whereIn('status', ['present', 'late', 'half_day'])
            ->whereNotNull('work_hours_actual')
            ->get();

             \Log::info('SHORT_DEBUG_RECORDS', [
        'start'   => $start->toDateString(),
        'end'     => $end->toDateString(),
        'count'   => $records->count(),
        'records' => $records->map(fn($r) => [
            'date'  => $r->date,
            'hours' => $r->work_hours_actual,
            'late'  => $r->late_minutes,
        ])->toArray(),
        'fullDayHrs' => $fullDayHrs ?? $hoursPerDay,
    ]);

        if ($records->isEmpty()) return 0;

        // ── standard hours per full day ───────────────────────────
        // resolveHoursPerDay() — work_start→work_end-lunch နဲ့ တွက်
        // (rule NULL ဆိုရင် fallback = hoursPerDay parameter)
        $fullDayHrs = $rule
            ? $this->resolveHoursPerDay($rule)
            : $hoursPerDay;

        // ── half-day leave dates ───────────────────────────────────
        $halfDates  = [];
        $halfLeaves = LeaveRequest::where('user_id', $userId)
            ->where('status', 'approved')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date',  [$start, $end]);
            })
            ->where(function ($q) {
                $q->where('leave_type', 'half_day')
                  ->orWhere('total_days', '<=', 0.5);
            })
            ->get();

        foreach ($halfLeaves as $hl) {
            $cur  = Carbon::parse($hl->start_date)->max($start);
            $last = Carbon::parse($hl->end_date)->min($end);
            while ($cur <= $last) {
                $halfDates[$cur->toDateString()] = true;
                $cur->addDay();
            }
        }

        $totalDeduct = 0;
        $debugRows   = [];

        foreach ($records as $rec) {
            $dateStr     = Carbon::parse($rec->date)->toDateString();
            $actualHours = (float) $rec->work_hours_actual;
            $lateHours   = (float) $rec->late_minutes / 60;

            // half_day ဆိုရင် standard = full ÷ 2
            $standardHrs = isset($halfDates[$dateStr])
                ? $fullDayHrs / 2
                : $fullDayHrs;

            // short = standard - actual - late
            // (late ကိုနှုတ်: late_deduction မှာ ဖြတ်ပြီးသားမို့ double-penalize မဖြစ်ရ)
            $shortHours = $standardHrs - $actualHours - $lateHours;
            $deductAmt  = $shortHours > 0 ? round($hourlyRate * $shortHours, 4) : 0;

            $debugRows[] = [
                'date'        => $dateStr,
                'actual_hrs'  => $actualHours,
                'late_hrs'    => round($lateHours, 4),
                'standard'    => $standardHrs,
                'full_day_hrs'=> $fullDayHrs,
                'short_hrs'   => round($shortHours, 4),
                'deduct'      => $deductAmt,
                'half_day'    => isset($halfDates[$dateStr]),
            ];

            if ($shortHours > 0) {
                $totalDeduct += $hourlyRate * $shortHours;
            }
        }

        \Log::info('SHORT_HOUR_DEBUG', [
            'user_id'            => $userId,
            'period'             => $start->toDateString().' → '.$end->toDateString(),
            'hourly_rate'        => $hourlyRate,
            'full_day_hrs'       => $fullDayHrs,
            'rows'               => $debugRows,
            'total_short_deduct' => round($totalDeduct, 2),
        ]);

        return round($totalDeduct, 2);
    }

    // ══════════════════════════════════════════════════════════════
    //  LATE DEDUCTION
    //  per_minute: rate × minutes
    //  per_hour:   rate × (minutes / 60)
    // ══════════════════════════════════════════════════════════════
    private function calculateLateDeduction(SalaryRule $rule, int $lateMinutes): float
    {
        if ($lateMinutes <= 0) return 0;
        $rate = (float)($rule->late_deduction_rate ?? 0);
        if ($rate <= 0) return 0;

        $result = match ($rule->late_deduction_unit) {
            'per_minute' => round($rate * $lateMinutes, 2),
            'per_hour'   => round($rate * ($lateMinutes / 60), 2),
            default      => 0,
        };

        \Log::info('LATE_DEDUCTION_DEBUG', [
            'late_minutes'       => $lateMinutes,
            'rate'               => $rate,
            'unit'               => $rule->late_deduction_unit,
            'result'             => $result,
        ]);

        return $result;
    }

    // ══════════════════════════════════════════════════════════════
    //  ALLOWANCES (employee profile selected — last period only)
    // ══════════════════════════════════════════════════════════════
    private function calculateAllowances(EmployeePayrollProfile $profile): float
    {
        $base  = (float)$profile->base_salary;
        $total = 0;
        foreach ($profile->selectedAllowances as $a) {
            $isPercent = $a->type === 'percentage' || ($a->is_percentage ?? false);
            $total += $isPercent
                ? $base * ((float)$a->value / 100)
                : (float)$a->value;
        }
        return round($total, 2);
    }

    // ══════════════════════════════════════════════════════════════
    //  SALARY DEDUCTIONS (country rules — last period only)
    // ══════════════════════════════════════════════════════════════
    private function calculateSalaryDeductions(int $countryId, float $baseSalary): float
    {
        $total = 0;
        $rows  = [];
        foreach (SalaryDeduction::where('country_id', $countryId)->where('is_active', true)->get() as $d) {
            $type   = $d->deduction_type ?? $d->unit_type ?? 'flat';
            $amount = $type === 'percentage'
                ? $baseSalary * ((float)$d->amount_per_unit / 100)
                : (float)$d->amount_per_unit;
            $total += $amount;
            $rows[] = ['name'=>$d->name,'type'=>$type,'rate'=>$d->amount_per_unit,'base'=>$baseSalary,'amount'=>round($amount,2)];
        }
        \Log::info('SALARY_DEDUCTIONS_DEBUG', ['rows'=>$rows,'total'=>round($total,2)]);
        return round($total, 2);
    }

    // ══════════════════════════════════════════════════════════════
    //  TAX (progressive brackets — last period only)
    // ══════════════════════════════════════════════════════════════
    private function calculateTax(SalaryRule $rule, float $grossSalary): float
    {
        $tax = 0;
        foreach ($rule->taxBrackets()->orderBy('min_amount')->get() as $b) {
            if ($grossSalary <= (float)$b->min_amount) break;
            $taxable = is_null($b->max_amount)
                ? $grossSalary - (float)$b->min_amount
                : min($grossSalary, (float)$b->max_amount) - (float)$b->min_amount;
            $tax += $taxable * ((float)$b->tax_percentage / 100);
        }
        return round($tax, 2);
    }

    // ══════════════════════════════════════════════════════════════
    //  SOCIAL SECURITY (employee portion — last period only)
    // ══════════════════════════════════════════════════════════════
    private function calculateSocialSecurity(SalaryRule $rule, float $baseSalary): float
    {
        $ss = $rule->socialSecurityRule;
        if (!$ss || !$ss->is_active) return 0;
        return round($baseSalary * ((float)$ss->employee_rate_percentage / 100), 2);
    }

    // ══════════════════════════════════════════════════════════════
    //  BONUS (schedule-based — last period only)
    // ══════════════════════════════════════════════════════════════
    private function calculateScheduledBonus(
        int $countryId, EmployeePayrollProfile $profile, int $month, float $baseSalary
    ): float {
        $total      = 0;
        $quarter    = (int)ceil($month / 3);
        $salaryRule = $profile->salaryRule;
        $empType    = $profile->user?->employment_type ?? 'permanent';

        foreach (PayrollBonusSchedule::with('bonusType')->where('country_id', $countryId)->where('is_active', true)->get() as $sched) {
            $bt = $sched->bonusType;
            if (!$bt || !$bt->is_active) continue;

            if ($empType === 'probation' && !($salaryRule?->bonus_during_probation ?? false)) continue;
            if ($empType === 'contract'  && !($salaryRule?->bonus_for_contract     ?? true))  continue;

            $qualifies = match ($sched->frequency) {
                'monthly'   => true,
                'quarterly' => match ((int)$sched->pay_quarter) {
                    1 => $month === 3,
                    2 => $month === 6,
                    3 => $month === 9,
                    4 => $month === 12,
                    default => false,
                },
                'yearly',
                'once'      => (int)$sched->pay_month === $month,
                default     => false,
            };
            if (!$qualifies) continue;

            $total += $bt->calculation_type === 'percentage'
                ? $baseSalary * ((float)$bt->value / 100)
                : (float)$bt->value;
        }

        return round($total, 2);
    }

    // ══════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════
    private function getTotalPeriods(string $cycle): int
    {
        return match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };
    }

    private function fallbackPeriodEndDay(string $cycle, int $cutoff, int $pNum, int $total): int
    {
        return match ($cycle) {
            'semi_monthly' => $pNum === 1 ? (int)round($cutoff / 2) : $cutoff,
            'ten_day'      => (int)round($cutoff * $pNum / $total),
            default        => $cutoff,
        };
    }


    private function getPeriodEndDay(int $periodNumber, string $cycle, int $cutoff, int $countryId): int
    {
        if ($countryId) {
            $record = PayrollPeriod::where('country_id', $countryId)
                ->where('period_number', $periodNumber)
                ->first();
            if ($record) return (int) $record->day;
        }
        return $this->fallbackPeriodEndDay($cycle, $cutoff, $periodNumber, $this->getTotalPeriods($cycle));
    }

    private function resolveHoursPerDay(?SalaryRule $rule): float
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

        return 8.0;
    }

    private function timeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        return (int)($parts[0] ?? 0) * 60 + (int)($parts[1] ?? 0);
    }
}