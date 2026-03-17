<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StorePayrollBonusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payroll_record_id' => 'required|exists:payroll_records,id',
            'bonus_type' => 'required|in:performance,festival,annual,other',
            'amount' => 'required|numeric|min:0',
            'note' => 'nullable|string|max:500',
        ];
    }
}