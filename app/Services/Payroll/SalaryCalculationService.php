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
use Illuminate\Support\Collection;

class SalaryCalculationService
{
    public function calculateForPeriod(PayrollPeriod $period): array
    {
        $profiles = EmployeePayrollProfile::with([
            'user',
            'salaryRule.allowances',
            'salaryRule.deductions',
            'salaryRule.taxBrackets',
            'salaryRule.socialSecurityRule',
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
        // ── Day-based period range ─────────────────────────────────────────
        // PayrollPeriod မှာ month/year မရှိတော့ — caller ကနေ pass လုပ်ရမယ်
        // default: current month
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
        // ──────────────────────────────────────────────────────────────────

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

        // 5. Allowances
        $totalAllowances = $this->calculateAllowances($profile->salaryRule, $profile->base_salary);

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

        // Save or update payroll record
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
                'bonus_amount'           => 0, // Bonus added separately
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
    //
    // PayrollPeriod မှာ day (end day) ဘဲ သိမ်း — month/year မသိမ်း
    // calculate လုပ်ချင်တဲ့ month/year ကို pass လုပ်ပြီး range တွက်
    //
    // cutoff=24, semi_monthly, March 2026
    //   P1 (endDay=12): Feb 25 → Mar 12
    //   P2 (endDay=24): Mar 13 → Mar 24
    //
    // cutoff=31, semi_monthly, February 2026 (28 days)
    //   P1 (endDay=15): Feb 1  → Feb 15
    //   P2 (endDay=31): effectiveEnd=min(31,28)=28 → Feb 16 → Feb 28
    //
    // cutoff=24, monthly, March 2026
    //   P1 (endDay=24): Feb 25 → Mar 24
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
        $effectiveEndDay = min($endDay, $lastDay); // Feb: min(31,28)=28 ✅

        // Period end date
        $periodEnd = Carbon::create($year, $month, $effectiveEndDay)->endOfDay();

        if ($periodNumber === 1) {
            // First period start
            if ($cutoff >= $lastDay) {
                // month-end mode → start = 1st of this month
                $periodStart = Carbon::create($year, $month, 1)->startOfDay();
            } else {
                // mid-month mode → start = prev_month_(cutoff+1)
                $prev        = Carbon::create($year, $month, 1)->subMonth();
                $prevLastDay = $prev->daysInMonth;
                $prevCutoff  = min($cutoff, $prevLastDay);
                $periodStart = Carbon::create($prev->year, $prev->month, $prevCutoff + 1)->startOfDay();
            }
        } else {
            // P2, P3 → start = prev period end day + 1
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

        // Get public holidays for this country & month
        $holidays = PublicHoliday::where('country_id', $countryId)
            ->whereBetween('date', [$start, $end])
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        // Count working days (exclude weekends & public holidays)
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

    // ── FIX #2 ──────────────────────────────────────────────────────────────
    // Bug: whereBetween('start_date', ...) ဘဲ စစ်တဲ့အတွက်
    //      Leave က Mar 29 – Apr 2 ဆိုရင် April payroll မှာ
    //      start_date=Mar 29 က April range ထဲ မဝင်လို့ paid_days=0 ဖြစ်ကာ
    //      Apr 1, 2 ကို absent ထဲ ထည့်တွက်ပြီး လစာဖြတ်သွားတယ်
    //
    // Fix: overlap ၃ မျိုးလုံး ဖမ်း၊ period ထဲ ကျတဲ့ ရက်ကိုဘဲ proportion ဖြတ်မယ်
    // ────────────────────────────────────────────────────────────────────────
    private function getLeaveSummary(int $userId, Carbon $start, Carbon $end): array
    {
        $leaves = LeaveRequest::where('user_id', $userId)
            ->where('status', 'approved')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])       // leave start က period ထဲ
                  ->orWhereBetween('end_date',  [$start, $end])       // leave end   က period ထဲ
                  ->orWhere(function ($q2) use ($start, $end) {       // leave က period ကိုလုံးဝခြုံနေ
                      $q2->where('start_date', '<=', $start)
                         ->where('end_date',   '>=', $end);
                  });
            })
            ->with('leavePolicy')
            ->get();

        $paidDays   = 0;
        $unpaidDays = 0;

        foreach ($leaves as $leave) {
            // Period နဲ့ overlap ဖြစ်တဲ့ ရက်ကိုဘဲ clamp လုပ်ပြီး count
            $leaveStart   = Carbon::parse($leave->start_date)->max($start);
            $leaveEnd     = Carbon::parse($leave->end_date)->min($end);
            $daysInPeriod = $leaveStart->diffInDays($leaveEnd) + 1;

            // total_days နဲ့ proportion ဖြတ် (half-day safe)
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

    // ── FIX #1 ──────────────────────────────────────────────────────────────
    // Bug: whereBetween('date', ...) → migration မှာ 'date' column ကို
    //      'start_date' rename လုပ်ပြီး multi-day OT ထည့်တဲ့အတွက် SQL crash
    //
    // Fix: segment-level sum သုံး (multi-day OT accurate)
    //      + legacy single-day OT (segment မရှိတာ) fallback
    // ────────────────────────────────────────────────────────────────────────
    private function getOvertimeHours(int $userId, Carbon $start, Carbon $end): float
    {
        // ① Segment ရှိတဲ့ OT — segment_date ကို period နဲ့ filter
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
                $q->whereNull('segment_date')                         // segment_date မရှိ → ဖမ်းထည့်
                  ->orWhereBetween('segment_date', [$start, $end]);   // ဒီ period ထဲ ကျတဲ့ segment သာ
            })
            ->sum('hours_approved');

        // ② Segment မရှိတဲ့ legacy OT — hours_approved direct sum
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
    // Calculation helpers — original အတိုင်း မပြင်
    // ─────────────────────────────────────────

    private function calculateProRatedSalary(float $baseSalary, int $workingDays, float $actualDays): float
    {
        if ($workingDays === 0) return 0;
        return round(($baseSalary / $workingDays) * $actualDays, 2);
    }

    private function calculateAllowances(SalaryRule $rule, float $baseSalary): float
    {
        $total = 0;
        foreach ($rule->allowances->where('is_active', true) as $allowance) {
            if ($allowance->is_percentage) {
                $total += $baseSalary * ($allowance->amount / 100);
            } else {
                $total += $allowance->amount;
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