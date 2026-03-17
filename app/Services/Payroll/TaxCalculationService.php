<?php

namespace App\Services\Payroll;

use App\Models\SalaryRule;

class TaxCalculationService
{
    public function calculate(SalaryRule $rule, float $grossSalary): array
    {
        $taxAmount = 0;
        $breakdown = [];

        $brackets = $rule->taxBrackets->sortBy('min_amount');

        foreach ($brackets as $bracket) {
            if ($grossSalary <= $bracket->min_amount) break;

            $taxableAmount = is_null($bracket->max_amount)
                ? $grossSalary - $bracket->min_amount
                : min($grossSalary, $bracket->max_amount) - $bracket->min_amount;

            $bracketTax = round($taxableAmount * ($bracket->tax_percentage / 100), 2);
            $taxAmount += $bracketTax;

            $breakdown[] = [
                'range' => $bracket->min_amount . ' - ' . ($bracket->max_amount ?? '∞'),
                'rate' => $bracket->tax_percentage . '%',
                'taxable_amount' => $taxableAmount,
                'tax' => $bracketTax,
            ];
        }

        return [
            'gross_salary' => $grossSalary,
            'total_tax' => round($taxAmount, 2),
            'breakdown' => $breakdown,
        ];
    }

    public function preview(int $salaryRuleId, float $grossSalary): array
    {
        $rule = SalaryRule::with('taxBrackets')->findOrFail($salaryRuleId);
        return $this->calculate($rule, $grossSalary);
    }
}