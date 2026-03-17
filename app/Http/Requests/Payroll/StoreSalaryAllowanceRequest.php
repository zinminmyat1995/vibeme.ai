<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalaryAllowanceRequest extends FormRequest
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
            'amount' => 'required|numeric|min:0',
            'is_percentage' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}