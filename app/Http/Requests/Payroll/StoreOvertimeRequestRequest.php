<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreOvertimeRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'hours_requested' => 'required|numeric|min:0.5|max:12',
            'reason' => 'nullable|string|max:500',
        ];
    }
}