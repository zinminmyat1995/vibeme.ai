<?php

namespace App\Services\Payroll;

use App\Models\AttendanceRecord;
use App\Models\EmployeePayrollProfile;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\OvertimeRequestSegment;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\PublicHoliday;
use App\Models\SalaryRule;
use Carbon\Carbon;

class SalaryCalculationService
{
    public function calculateForPeriod(PayrollPeriod $period): array
    {
        $profiles = EmployeePayrollProfile::with([
            'user',
            'selectedAllowances',              // ← per-employee allowances (ပြင်ပြီ)
            'salaryRule.deductions',
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

    public function calculateForEmployee(PayrollPeriod $period, EmployeePayrollProfile $profile, int $year = 0, int $month = 0): PayrollRecord
    {
        if (!$year || !$month) {
            $year  = now()->year;
            $month = now()->month;
        }

        $salaryRule   = $profile->salaryRule;
        $cycle        = $salaryRule?->pay_cycle          ?? 'monthly';
        $cutoff       = $salaryRule?->payroll_cutoff_day ?? 25;
        $periodNumber = $period->period_number           ?? 1;
        $endDay       = $period->day                     ?? $cutoff;

        [$startDate, $endDate] = $this->getPeriodRange(
            $year, $month, $cutoff, $cycle, $periodNumber, $endDay
        );

        // 1. Attendance summary
        $attendance = $this->getAttendanceSummary($profile->user_id, $startDate, $endDate, $period->country_id);

        // 2. Leave summary
        $leave = $this->getLeaveSummary($profile->user_id, $startDate, $endDate);

        // 3. Overtime summary
        $overtimeHours = $this->getOvertimeHours($profile->user_id, $startDate, $endDate);

        // 4. Base salary (pro-rated by present days)
        $baseSalary = $this->calculateProRatedSalary(
            $profile->base_salary,
            $attendance['working_days'],
            $attendance['present_days'] + $leave['paid_days']
        );

        // 5. Allowances — profile မှာ select လုပ်ထားတာဘဲ တွက် (ပြင်ပြီ)
        $totalAllowances = $this->calculateAllowances($profile);

        // 6. Overtime amount
        $overtimeAmount = $this->calculateOvertimeAmount(
            $profile->base_salary,
            $profile->salaryRule,
            $overtimeHours
        );

        // 7. Deductions (late penalty etc.)
        $totalDeductions = $this->calculateDeductions(
            $profile->salaryRule,
            $attendance['late_minutes_total']
        );

        // 8. Tax
        $grossSalary = $baseSalary + $totalAllowances + $overtimeAmount;
        $taxAmount   = $this->calculateTax($profile->salaryRule, $grossSalary);

        // 9. Social Security
        $socialSecurityAmount = $this->calculateSocialSecurity($profile->salaryRule, $baseSalary);

        // 10. Net Salary
        $netSalary = $grossSalary - $totalDeductions - $taxAmount - $socialSecurityAmount;

        $record = PayrollRecord::updateOrCreate(
            [
                'payroll_period_id' => $period->id,
                'user_id'           => $profile->user_id,
            ],
            [
                'base_salary'            => $baseSalary,
                'total_allowances'       => $totalAllowances,
                'total_deductions'       => $totalDeductions,
                'overtime_amount'        => $overtimeAmount,
                'bonus_amount'           => 0,
                'tax_amount'             => $taxAmount,
                'social_security_amount' => $socialSecurityAmount,
                'net_salary'             => $netSalary,
                'working_days'           => $attendance['working_days'],
                'present_days'           => $attendance['present_days'],
                'absent_days'            => $attendance['absent_days'],
                'leave_days_paid'        => $leave['paid_days'],
                'leave_days_unpaid'      => $leave['unpaid_days'],
                'overtime_hours'         => $overtimeHours,
                'late_minutes_total'     => $attendance['late_minutes_total'],
                'status'                 => 'draft',
            ]
        );

        return $record;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Day-based Period Range
    // ─────────────────────────────────────────────────────────────────────────
    private function getPeriodRange(
        int    $year,
        int    $month,
        int    $cutoff,
        string $cycle,
        int    $periodNumber,
        int    $endDay
    ): array {
        $lastDay         = Carbon::create($year, $month, 1)->daysInMonth;
        $effectiveEndDay = min($endDay, $lastDay);

        $periodEnd = Carbon::create($year, $month, $effectiveEndDay)->endOfDay();

        if ($periodNumber === 1) {
            if ($cutoff >= $lastDay) {
                $periodStart = Carbon::create($year, $month, 1)->startOfDay();
            } else {
                $prev        = Carbon::create($year, $month, 1)->subMonth();
                $prevLastDay = $prev->daysInMonth;
                $prevCutoff  = min($cutoff, $prevLastDay);
                $periodStart = Carbon::create($prev->year, $prev->month, $prevCutoff + 1)->startOfDay();
            }
        } else {
            $fullCutoff = min($cutoff, $lastDay);

            $prevEndDay = match($cycle) {
                'semi_monthly' => min((int) round($fullCutoff / 2), $lastDay),
                'ten_day'      => $periodNumber === 2
                    ? min((int) round($fullCutoff / 3), $lastDay)
                    : min((int) round(($fullCutoff / 3) * 2), $lastDay),
                default        => $fullCutoff,
            };

            $periodStart = Carbon::create($year, $month, $prevEndDay + 1)->startOfDay();
        }

        return [$periodStart, $periodEnd];
    }

    // ─────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────

    private function getAttendanceSummary(int $userId, Carbon $start, Carbon $end, int $countryId): array
    {
        $records = AttendanceRecord::where('user_id', $userId)
            ->whereBetween('date', [$start, $end])
            ->get();

        $holidays = PublicHoliday::where('country_id', $countryId)
            ->whereBetween('date', [$start, $end])
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $workingDays = 0;
        $current     = $start->copy();
        while ($current <= $end) {
            if (!$current->isWeekend() && !in_array($current->toDateString(), $holidays)) {
                $workingDays++;
            }
            $current->addDay();
        }

        $presentDays = $records->whereIn('status', ['present', 'late'])->count();
        $halfDays    = $records->where('status', 'half_day')->count();
        $absentDays  = $records->where('status', 'absent')->count();
        $lateMinutes = $records->sum('late_minutes');

        return [
            'working_days'       => $workingDays,
            'present_days'       => $presentDays + ($halfDays * 0.5),
            'absent_days'        => $absentDays,
            'late_minutes_total' => $lateMinutes,
        ];
    }

    private function getLeaveSummary(int $userId, Carbon $start, Carbon $end): array
    {
        $leaves = LeaveRequest::where('user_id', $userId)
            ->where('status', 'approved')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date',  [$start, $end])
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->where('start_date', '<=', $start)
                         ->where('end_date',   '>=', $end);
                  });
            })
            ->with('leavePolicy')
            ->get();

        $paidDays   = 0;
        $unpaidDays = 0;

        foreach ($leaves as $leave) {
            $leaveStart   = Carbon::parse($leave->start_date)->max($start);
            $leaveEnd     = Carbon::parse($leave->end_date)->min($end);
            $daysInPeriod = $leaveStart->diffInDays($leaveEnd) + 1;

            $totalDays   = (float) $leave->total_days ?: 1;
            $fullSpan    = Carbon::parse($leave->start_date)->diffInDays(Carbon::parse($leave->end_date)) + 1;
            $proportion  = $daysInPeriod / $fullSpan;
            $countedDays = round($totalDays * $proportion, 2);

            if (!$leave->is_paid) {
                $unpaidDays += $countedDays;
            } else {
                $paidDays += $countedDays;
            }
        }

        return [
            'paid_days'   => $paidDays,
            'unpaid_days' => $unpaidDays,
        ];
    }

    private function getOvertimeHours(int $userId, Carbon $start, Carbon $end): float
    {
        $fromSegments = OvertimeRequestSegment::whereHas('overtimeRequest', function ($q) use ($userId, $start, $end) {
                $q->where('user_id', $userId)
                  ->where('status', 'approved')
                  ->where(function ($q2) use ($start, $end) {
                      $q2->whereBetween('start_date', [$start, $end])
                         ->orWhereBetween('end_date',  [$start, $end])
                         ->orWhere(function ($q3) use ($start, $end) {
                             $q3->where('start_date', '<=', $start)
                                ->where('end_date',   '>=', $end);
                         });
                  });
            })
            ->where(function ($q) use ($start, $end) {
                $q->whereNull('segment_date')
                  ->orWhereBetween('segment_date', [$start, $end]);
            })
            ->sum('hours_approved');

        $fromLegacy = OvertimeRequest::where('user_id', $userId)
            ->where('status', 'approved')
            ->doesntHave('segments')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                  ->orWhereBetween('end_date',  [$start, $end]);
            })
            ->sum('hours_approved');

        return (float) $fromSegments + (float) $fromLegacy;
    }

    // ─────────────────────────────────────────
    // Calculation helpers
    // ─────────────────────────────────────────

    private function calculateProRatedSalary(float $baseSalary, int $workingDays, float $actualDays): float
    {
        if ($workingDays === 0) return 0;
        return round(($baseSalary / $workingDays) * $actualDays, 2);
    }

    /**
     * Employee ရဲ့ profile မှာ select လုပ်ထားတဲ့ allowances ဘဲ တွက်
     * (salary_rule ထဲက allowance အကုန် မတွက်တော့)
     */
    private function calculateAllowances(EmployeePayrollProfile $profile): float
    {
        $baseSalary = (float) $profile->base_salary;
        $total      = 0;

        foreach ($profile->selectedAllowances as $allowance) {
            if ($allowance->is_percentage) {
                $total += $baseSalary * ($allowance->amount / 100);
            } else {
                $total += (float) $allowance->amount;
            }
        }

        return round($total, 2);
    }

    private function calculateOvertimeAmount(float $baseSalary, SalaryRule $rule, float $overtimeHours): float
    {
        if ($overtimeHours <= 0) return 0;

        $country      = $rule->country;
        $dailyRate    = $baseSalary / ($country->work_days_per_week * 4.33);
        $hourlyRate   = $dailyRate / $country->work_hours_per_day;
        $overtimeRate = $country->overtime_rate_weekday;

        return round($hourlyRate * $overtimeRate * $overtimeHours, 2);
    }

    private function calculateDeductions(SalaryRule $rule, int $lateMinutes): float
    {
        $total = 0;
        foreach ($rule->deductions->where('is_active', true) as $deduction) {
            if ($deduction->unit_type === 'per_minute') {
                $total += $deduction->amount_per_unit * $lateMinutes;
            } elseif ($deduction->unit_type === 'fixed') {
                $total += $deduction->amount_per_unit;
            }
        }
        return round($total, 2);
    }

    private function calculateTax(SalaryRule $rule, float $grossSalary): float
    {
        $taxAmount = 0;
        $brackets  = $rule->taxBrackets->sortBy('min_amount');

        foreach ($brackets as $bracket) {
            if ($grossSalary <= $bracket->min_amount) break;

            $taxableAmount = is_null($bracket->max_amount)
                ? $grossSalary - $bracket->min_amount
                : min($grossSalary, $bracket->max_amount) - $bracket->min_amount;

            $taxAmount += $taxableAmount * ($bracket->tax_percentage / 100);
        }

        return round($taxAmount, 2);
    }

    private function calculateSocialSecurity(SalaryRule $rule, float $baseSalary): float
    {
        $ss = $rule->socialSecurityRule->where('is_active', true)->first();
        if (!$ss) return 0;

        return round($baseSalary * ($ss->employee_rate_percentage / 100), 2);
    }
}