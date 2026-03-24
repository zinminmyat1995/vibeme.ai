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
            'country_id'    => 'required|exists:countries,id',
            'day'           => 'required|integer|min:1|max:31',
            'period_number' => 'required|integer|min:1|max:3',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $exists = \App\Models\PayrollPeriod::where('country_id',    $this->country_id)
                ->where('day',           $this->day)
                ->where('period_number', $this->period_number ?? 1)
                ->exists();

            if ($exists) {
                $validator->errors()->add('day', 'This period template already exists.');
            }
        });
    }
}