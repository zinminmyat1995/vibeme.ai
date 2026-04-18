<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreEmployeePayrollProfileRequest;
use App\Models\Country;
use App\Models\EmployeePayrollProfile;
use App\Models\PayrollAllowance;
use App\Models\SalaryAllowance;
use App\Models\SalaryRule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeePayrollProfileController extends Controller
{
    // ──────────────────────────────────────────────────────────────
    // Inertia Page — /payroll/employee-salary
    // ──────────────────────────────────────────────────────────────
    public function page(): \Inertia\Response
    {
        $hr        = Auth::user();
        $countryId = $hr->country_id;

        // HR ရဲ့ country နဲ့ same employee တွေ (ကိုယ်တိုင်မပါ)
        $employees = User::with('role')
            ->where('is_active', true)
            ->where('country', $hr->country)
            ->get()
            ->map(fn($u) => [
                'id'              => $u->id,
                'name'            => $u->name,
                'position'        => $u->position,
                'department'      => $u->department,
                'employment_type' => $u->employment_type,
                'joined_date'     => $u->joined_date,
                'avatar_url'      => $u->avatar_url,
            ]);

        // ဒီ country ရဲ့ salary rule + payroll allowances (HR Policy မှာ define ထားတာ)
        $salaryRule = SalaryRule::with(['bank', 'currency'])
            ->where('country_id', $countryId)
            ->first();

        // payroll_allowances table ကနေ ဆွဲ (HR Policy Setup > Allowance tab မှာ သိမ်းထားတာ)
        $allowances = PayrollAllowance::where('country_id', $countryId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        if ($salaryRule) {
            $salaryRule->setRelation('allowances', $allowances);
        }

        // Active profiles (HR country ထဲ)
        $profiles = EmployeePayrollProfile::with([
                'user',
                'salaryRule.currency',
                'salaryRule.bank',
                'selectedAllowances',
            ])
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->get()
            ->map(fn($p) => $this->formatProfile($p));

        return Inertia::render('Payroll/EmployeeSalary/Index', [
            'employees'  => $employees,
            'salaryRule' => $salaryRule,
            'profiles'   => $profiles,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // API index (ကြိုတင်ရှိတဲ့ route — တျones မပြိုင်ဘဲ ထိန်းထား)
    // ──────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $hr        = Auth::user();
        $countryId = $hr->country_id ?? $request->country_id;

        $profiles = EmployeePayrollProfile::with([
                'user',
                'salaryRule.currency',
                'salaryRule.bank',
                'selectedAllowances',
            ])
            ->when($countryId, fn($q) => $q->where('country_id', $countryId))
            ->where('is_active', true)
            ->get()
            ->map(fn($p) => $this->formatProfile($p));

        return response()->json($profiles);
    }

    public function show(EmployeePayrollProfile $employeePayrollProfile): JsonResponse
    {
        $user = Auth::user();
        if ($user->hasRole('member') && $employeePayrollProfile->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $this->formatProfile($employeePayrollProfile->load(['user', 'country', 'salaryRule.currency', 'salaryRule.bank', 'selectedAllowances']))
        );
    }

    // ──────────────────────────────────────────────────────────────
    // Store
    // ──────────────────────────────────────────────────────────────
    public function store(StoreEmployeePayrollProfileRequest $request): JsonResponse
    {
        $validated    = $request->validated();
        $allowanceIds = $validated['allowance_ids'] ?? [];
        unset($validated['allowance_ids']);

        // ── ဒီ user ရဲ့ profile ရှိမရှိ စစ် ─────────────────────────────
        $existing = EmployeePayrollProfile::where('user_id', $validated['user_id'])->first();

        if ($existing) {
            if ($existing->is_active) {
                // is_active = 1 → already active → error
                return response()->json([
                    'errors' => [
                        'user_id' => 'This employee already has an active salary profile. Please edit the existing one instead.',
                    ],
                ], 422);
            }

            // is_active = 0 → reactivate + update data
            $existing->update([
                ...$validated,
                'is_active' => true,
            ]);
            $existing->selectedAllowances()->sync($allowanceIds);
            $existing->load(['user', 'salaryRule.currency', 'salaryRule.bank', 'selectedAllowances']);

            return response()->json($this->formatProfile($existing), 200);
        }

        // ── မရှိဘူး → new record create ─────────────────────────────────
        $profile = EmployeePayrollProfile::create($validated);

        if (!empty($allowanceIds)) {
            $profile->selectedAllowances()->sync($allowanceIds);
        }

        $profile->load(['user', 'salaryRule.currency', 'salaryRule.bank', 'selectedAllowances']);

        return response()->json($this->formatProfile($profile), 201);
    }

    // ──────────────────────────────────────────────────────────────
    // Update (salary, bank info, allowances ဘဲ — user မပြင်ရ)
    // ──────────────────────────────────────────────────────────────
    public function update(Request $request, EmployeePayrollProfile $employeePayrollProfile): JsonResponse
    {
        $validated = $request->validate([
            'base_salary'              => 'required|numeric|min:0',
            'bank_account_holder_name' => 'nullable|string|max:150',
            'bank_account_number'      => 'nullable|string|max:50',
            'bank_branch'              => 'nullable|string|max:100',
            'effective_date'           => 'nullable|date',   // ← required မဟုတ်တော့
            'allowance_ids'            => 'nullable|array',
            'allowance_ids.*'          => 'exists:payroll_allowances,id',
        ]);

        $allowanceIds = $validated['allowance_ids'] ?? [];
        unset($validated['allowance_ids']);

        // effective_date မပါလာရင် မထိ
        if (empty($validated['effective_date'])) {
            unset($validated['effective_date']);
        }

        $employeePayrollProfile->update($validated);
        $employeePayrollProfile->selectedAllowances()->sync($allowanceIds);

        $employeePayrollProfile->load(['user', 'salaryRule.currency', 'salaryRule.bank', 'selectedAllowances']);

        return response()->json($this->formatProfile($employeePayrollProfile));
    }

    // ──────────────────────────────────────────────────────────────
    // Destroy
    // ──────────────────────────────────────────────────────────────
    public function destroy(EmployeePayrollProfile $employeePayrollProfile): JsonResponse
    {
        $employeePayrollProfile->update(['is_active' => false]);
        return response()->json(['message' => 'Profile deactivated successfully.']);
    }

    // ──────────────────────────────────────────────────────────────
    // Helper — format for frontend
    // ──────────────────────────────────────────────────────────────
    private function formatProfile(EmployeePayrollProfile $p): array
    {
        $u = $p->user;
        return [
            'id'                       => $p->id,
            'user_id'                  => $p->user_id,
            'name'                     => $u?->name,
            'position'                 => $u?->position,
            'department'               => $u?->department,
            'employment_type'          => $u?->employment_type,
            'joined_date'              => $u?->joined_date,
            'avatar_url'               => $u?->avatar_url,
            'salary_rule_id'           => $p->salary_rule_id,
            'currency_code'            => $p->salaryRule?->currency?->currency_code,
            'bank_name'                => $p->salaryRule?->bank?->bank_name,
            'base_salary'              => $p->base_salary,
            'bank_account_holder_name' => $p->bank_account_holder_name,
            // masked — eye toggle ကို frontend မှာ handle မယ်
            'bank_account_number_masked' => $p->bank_account_number
                ? '****' . substr($p->bank_account_number, -4)
                : null,
            'bank_account_number'      => $p->bank_account_number, // edit modal မှာ သုံး
            'bank_branch'              => $p->bank_branch,
            'effective_date'           => $p->effective_date,
            'allowances'               => $p->selectedAllowances->map(fn($a) => [
                'id'            => $a->id,
                'name'          => $a->name,
                'value'         => $a->value,
                'type'          => $a->type, // 'flat' or 'percentage'
            ]),
        ];
    }
}