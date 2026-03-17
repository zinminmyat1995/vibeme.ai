<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalaryDeductionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'salary_rule_id' => 'required|exists:salary_rules,id',
            'name' => 'required|string|max:100',
            'amount_per_unit' => 'required|numeric|min:0',
            'unit_type' => 'required|in:per_minute,per_day,fixed',
            'is_active' => 'boolean',
        ];
    }
}