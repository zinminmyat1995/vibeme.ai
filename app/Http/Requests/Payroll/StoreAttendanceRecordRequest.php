<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id'           => 'required|exists:users,id',
            'date'              => 'required|date',
            'status'            => 'required|in:present,absent,half_day,late',
            'check_in_time'     => 'required|date_format:H:i,H:i:s',
            'check_out_time'    => 'required|date_format:H:i,H:i:s',
            'work_hours_actual' => 'nullable|numeric|min:0|max:24',
            'late_minutes'      => 'nullable|integer|min:0',
            'note'              => 'nullable|string|max:500',
        ];
    }
}