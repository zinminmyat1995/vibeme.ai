<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StorePayrollPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'country_id' => 'required|exists:countries,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2100',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Duplicate period check
            $exists = \App\Models\PayrollPeriod::where('country_id', $this->country_id)
                ->where('month', $this->month)
                ->where('year', $this->year)
                ->exists();

            if ($exists) {
                $validator->errors()->add('month', 'Payroll period already exists for this month.');
            }
        });
    }
}