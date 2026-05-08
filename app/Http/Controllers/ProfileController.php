<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\EmployeePayrollProfile;

class ProfileController extends Controller
{
    public function index()
    {
        $user = Auth::user()->load('role');

        // Payroll profile (salary, bank info, allowances)
        $payrollProfile = EmployeePayrollProfile::with([
                'salaryRule.currency',
                'salaryRule.bank',
                'selectedAllowances',
            ])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        $profileData = null;
        if ($payrollProfile) {
            $profileData = [
                'base_salary'              => $payrollProfile->base_salary,
                'currency_code'            => $payrollProfile->salaryRule?->currency?->currency_code,
                'bank_name'                => $payrollProfile->salaryRule?->bank?->bank_name,
                'bank_account_holder_name' => $payrollProfile->bank_account_holder_name,
                'bank_account_number'      => $payrollProfile->bank_account_number
                    ? '****' . substr($payrollProfile->bank_account_number, -4)
                    : null,
                'bank_branch'              => $payrollProfile->bank_branch,
                'effective_date'           => $payrollProfile->effective_date?->toDateString(),
                'allowances'               => $payrollProfile->selectedAllowances->map(fn($a) => [
                    'id'    => $a->id,
                    'name'  => $a->name,
                    'value' => $a->value,
                    'type'  => $a->type,
                ]),
            ];
        }

        return Inertia::render('Profile/Index', [
            'profileUser' => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'phone'           => $user->phone,
                'avatar_url'      => $user->avatar_url,
                'department'      => $user->department,
                'position'        => $user->position,
                'country'         => $user->country,
                'joined_date'     => $user->joined_date
                    ? \Carbon\Carbon::parse($user->joined_date)->toDateString()
                    : null,
                'employment_type' => $user->employment_type,
                'contract_end_date' => $user->contract_end_date
                    ? \Carbon\Carbon::parse($user->contract_end_date)->toDateString()
                    : null,
                'date_of_birth'   => $user->date_of_birth
                    ? \Carbon\Carbon::parse($user->date_of_birth)->toDateString()
                    : null,
                'is_active'       => $user->is_active,
                'role'            => [
                    'name'         => $user->role?->name,
                    'display_name' => $user->role?->display_name ?? $user->role?->name,
                ],
            ],
            'payrollProfile' => $profileData,
        ]);
    }
}