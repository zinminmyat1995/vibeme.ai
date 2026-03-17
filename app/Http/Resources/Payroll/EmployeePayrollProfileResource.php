<?php

namespace App\Http\Resources\Payroll;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class EmployeePayrollProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = Auth::user();
        $isHR = $user->hasRole('hr');

        return [
            'id' => $this->id,
            'base_salary' => $this->base_salary,
            'effective_date' => $this->effective_date->toDateString(),
            'is_active' => $this->is_active,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'country' => $this->whenLoaded('country', fn() => [
                'id' => $this->country->id,
                'name' => $this->country->name,
                'currency_code' => $this->country->currency_code,
            ]),
            'salary_rule' => $this->whenLoaded('salaryRule', fn() => [
                'id' => $this->salaryRule->id,
                'name' => $this->salaryRule->name,
            ]),
            // Bank info — HR only
            'bank_info' => $isHR ? [
                'bank_name' => $this->bank_name,
                'account_number' => $this->bank_account_number,
                'account_holder' => $this->bank_account_holder_name,
                'branch' => $this->bank_branch,
            ] : [
                'bank_name' => $this->bank_name,
                'account_number' => $this->maskAccountNumber($this->bank_account_number),
                'account_holder' => $this->bank_account_holder_name,
                'branch' => $this->bank_branch,
            ],
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }

    private function maskAccountNumber(?string $number): ?string
    {
        if (!$number) return null;
        $len = strlen($number);
        if ($len <= 4) return str_repeat('*', $len);
        return str_repeat('*', $len - 4) . substr($number, -4);
    }
}