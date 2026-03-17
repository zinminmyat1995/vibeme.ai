<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreSocialSecurityRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'salary_rule_id' => 'required|exists:salary_rules,id',
            'employee_rate_percentage' => 'required|numeric|min:0|max:100',
            'employer_rate_percentage' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ];
    }
}