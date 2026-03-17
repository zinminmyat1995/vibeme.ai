<?php

namespace App\Http\Resources\Payroll;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalaryRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'base_salary_type' => $this->base_salary_type,
            'is_active' => $this->is_active,
            'country' => $this->whenLoaded('country', fn() => [
                'id' => $this->country->id,
                'name' => $this->country->name,
                'currency_code' => $this->country->currency_code,
            ]),
            'allowances' => $this->whenLoaded('allowances', fn() =>
                $this->allowances->where('is_active', true)->map(fn($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'amount' => $a->amount,
                    'is_percentage' => $a->is_percentage,
                ])
            ),
            'deductions' => $this->whenLoaded('deductions', fn() =>
                $this->deductions->where('is_active', true)->map(fn($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'amount_per_unit' => $d->amount_per_unit,
                    'unit_type' => $d->unit_type,
                ])
            ),
            'tax_brackets' => $this->whenLoaded('taxBrackets', fn() =>
                $this->taxBrackets->sortBy('min_amount')->map(fn($t) => [
                    'id' => $t->id,
                    'min_amount' => $t->min_amount,
                    'max_amount' => $t->max_amount,
                    'tax_percentage' => $t->tax_percentage,
                ])
            ),
            'social_security' => $this->whenLoaded('socialSecurityRule', fn() =>
                $this->socialSecurityRule->where('is_active', true)->first()
                    ? [
                        'employee_rate' => $this->socialSecurityRule->first()->employee_rate_percentage,
                        'employer_rate' => $this->socialSecurityRule->first()->employer_rate_percentage,
                    ]
                    : null
            ),
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}