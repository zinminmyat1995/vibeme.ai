<?php

namespace App\Http\Resources\Payroll;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,

            // Earnings
            'earnings' => [
                'base_salary' => $this->base_salary,
                'allowances' => $this->total_allowances,
                'overtime' => $this->overtime_amount,
                'bonus' => $this->bonus_amount,
                'gross_total' => $this->base_salary
                    + $this->total_allowances
                    + $this->overtime_amount
                    + $this->bonus_amount,
            ],

            // Deductions
            'deductions' => [
                'deductions' => $this->total_deductions,
                'tax' => $this->tax_amount,
                'social_security' => $this->social_security_amount,
                'total_deductions' => $this->total_deductions
                    + $this->tax_amount
                    + $this->social_security_amount,
            ],

            // Net
            'net_salary' => $this->net_salary,

            // Attendance summary
            'attendance' => [
                'working_days' => $this->working_days,
                'present_days' => $this->present_days,
                'absent_days' => $this->absent_days,
                'leave_days_paid' => $this->leave_days_paid,
                'leave_days_unpaid' => $this->leave_days_unpaid,
                'overtime_hours' => $this->overtime_hours,
                'late_minutes_total' => $this->late_minutes_total,
            ],

            // Relations
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'payroll_period' => $this->whenLoaded('payrollPeriod', fn() => [
                'id' => $this->payrollPeriod->id,
                'month' => $this->payrollPeriod->month,
                'year' => $this->payrollPeriod->year,
                'status' => $this->payrollPeriod->status,
                'currency' => $this->payrollPeriod->country->currency_code,
            ]),
            'bonuses' => $this->whenLoaded('bonuses', fn() =>
                $this->bonuses->map(fn($b) => [
                    'id' => $b->id,
                    'type' => $b->bonus_type,
                    'amount' => $b->amount,
                    'note' => $b->note,
                ])
            ),
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}