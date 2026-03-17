<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeavePolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'country_id' => 'required|exists:countries,id',
            'leave_type' => 'required|in:annual,medical,emergency,unpaid,maternity,paternity',
            'days_per_year' => 'required|integer|min:0',
            'is_paid' => 'boolean',
            'carry_over_days' => 'integer|min:0',
        ];
    }
}