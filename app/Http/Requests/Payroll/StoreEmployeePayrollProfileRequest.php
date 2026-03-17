<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeePayrollProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'country_id' => 'required|exists:countries,id',
            'salary_rule_id' => 'required|exists:salary_rules,id',
            'base_salary' => 'required|numeric|min:0',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_holder_name' => 'nullable|string|max:150',
            'bank_branch' => 'nullable|string|max:100',
            'effective_date' => 'required|date',
            'is_active' => 'boolean',
        ];
    }
}