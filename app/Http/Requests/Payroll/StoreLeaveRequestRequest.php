<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Services\Payroll\LeaveService;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'leave_type' => 'required|in:annual,medical,emergency,unpaid,maternity,paternity',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'note' => 'nullable|string|max:500',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $leaveService = app(LeaveService::class);
            $startDate = \Carbon\Carbon::parse($this->start_date);
            $endDate = \Carbon\Carbon::parse($this->end_date);

            $totalDays = $leaveService->calculateLeaveDays($startDate, $endDate);

            // Check leave balance (skip for unpaid)
            if ($this->leave_type !== 'unpaid') {
                $hasBalance = $leaveService->checkBalance(
                    Auth::id(),
                    $this->leave_type,
                    $totalDays,
                    $startDate->year
                );

                if (!$hasBalance) {
                    $validator->errors()->add('leave_type', 'Insufficient leave balance.');
                }
            }
        });
    }
}