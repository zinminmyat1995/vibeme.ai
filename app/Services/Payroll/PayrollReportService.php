<?php

namespace App\Services\Payroll;

use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;

class PayrollReportService
{
    public function getMonthlySummary(int $periodId): array
    {
        $period = PayrollPeriod::with('country')->findOrFail($periodId);

        $records = PayrollRecord::where('payroll_period_id', $periodId)
            ->with('user')
            ->get();

        return [
            'period' => "{$period->month}/{$period->year}",
            'country' => $period->country->name,
            'currency' => $period->country->currency_code,
            'total_employees' => $records->count(),
            'total_base_salary' => $records->sum('base_salary'),
            'total_allowances' => $records->sum('total_allowances'),
            'total_overtime' => $records->sum('overtime_amount'),
            'total_bonus' => $records->sum('bonus_amount'),
            'total_deductions' => $records->sum('total_deductions'),
            'total_tax' => $records->sum('tax_amount'),
            'total_social_security' => $records->sum('social_security_amount'),
            'total_net_salary' => $records->sum('net_salary'),
            'status' => $period->status,
        ];
    }

    public function getYearlyReport(int $countryId, int $year): array
    {
        $periods = PayrollPeriod::where('country_id', $countryId)
            ->where('year', $year)
            ->with('payrollRecords')
            ->get();

        return $periods->map(fn($period) => [
            'month' => $period->month,
            'total_employees' => $period->payrollRecords->count(),
            'total_net_salary' => $period->payrollRecords->sum('net_salary'),
            'status' => $period->status,
        ])->toArray();
    }

    public function getEmployeeYearlyReport(int $userId, int $year): array
    {
        $records = PayrollRecord::where('user_id', $userId)
            ->whereHas('payrollPeriod', fn($q) => $q->where('year', $year))
            ->with('payrollPeriod', 'bonuses')
            ->get();

        return [
            'total_earned' => $records->sum('net_salary'),
            'total_tax_paid' => $records->sum('tax_amount'),
            'total_bonus' => $records->sum('bonus_amount'),
            'monthly_breakdown' => $records->map(fn($r) => [
                'month' => $r->payrollPeriod->month,
                'net_salary' => $r->net_salary,
                'status' => $r->status,
            ])->toArray(),
        ];
    }
}