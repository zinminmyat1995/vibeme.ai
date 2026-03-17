<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'currency_code' => 'required|string|max:10',
            'work_hours_per_day' => 'required|numeric|min:1|max:24',
            'work_days_per_week' => 'required|integer|min:1|max:7',
            'overtime_rate_weekday' => 'required|numeric|min:1',
            'overtime_rate_weekend' => 'required|numeric|min:1',
            'overtime_rate_holiday' => 'required|numeric|min:1',
            'is_active' => 'boolean',
        ];
    }
}