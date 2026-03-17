<?php

namespace App\Http\Controllers;

use App\Models\LeavePolicy;
use App\Models\OvertimePolicy;
use App\Models\PayrollCurrency;
use App\Models\SalaryDeduction;
use App\Models\PayrollAllowance;
use App\Models\SalaryRule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use App\Models\PayrollBank;
use App\Models\PayrollBonusType;
use App\Models\PayrollBonusSchedule;

class HRPolicySetupController extends Controller
{
    private function getCountryId()
    {
        return auth()->user()->country_id;
    }

    public function index()
    {
        $countryId = $this->getCountryId();

        
        return Inertia::render('PayrollSetup/Index', [
            'leavePolicies' => LeavePolicy::where('country_id', $countryId)
                ->orderBy('leave_type')
                ->get(),

            'overtimePolicies' => OvertimePolicy::where('country_id', $countryId)
                ->orderBy('title')
                ->get(),

            'currencies' => PayrollCurrency::where('country_id', $countryId)
                ->orderBy('currency_name')
                ->get(),

            'deductions' => SalaryDeduction::where('country_id', $countryId)
                ->orderBy('name')
                ->get(),

            'allowances' => PayrollAllowance::where('country_id', $countryId)
                ->orderBy('name')
                ->get(),

            'salaryRule' => SalaryRule::where('country_id', $countryId)
                ->first(),

            'country' => auth()->user()->country,

            'banks' => PayrollBank::where('country_id', $countryId)->orderBy('bank_name')->get(),
            'bonusTypes'     => PayrollBonusType::where('country_id', $countryId)
                ->orderBy('name')->get(),
            'bonusSchedules' => PayrollBonusSchedule::where('country_id', $countryId)
                ->with('bonusType')
                ->orderBy('created_at')
                ->get(),


        ]);
    }

    // ── Leave Policy ──────────────────────────────────────────
    public function storeLeavePolicy(Request $request)
    {
        $countryId = $this->getCountryId();

        $validated = $request->validate([
            'leave_type' => [
                'required',
                'string',
                'max:100',
                Rule::unique('leave_policies')
                    ->where('country_id', $countryId),
            ],
            'days_per_year'     => 'required|integer|min:1',
            'is_paid'           => 'required|boolean',
            'carry_over_days'   => 'required|integer|min:0',
            'applicable_gender' => 'required|in:all,male,female',
            'requires_document' => 'required|boolean',
            'is_active'         => 'required|boolean',
        ]);

        LeavePolicy::create([...$validated, 'country_id' => $countryId]);

        return back()->with('success', 'Leave type added successfully.');
    }

    public function updateLeavePolicy(Request $request, LeavePolicy $leavePolicy)
    {
        $this->authorizeCountry($leavePolicy->country_id);

        $validated = $request->validate([
            'leave_type' => [
                'required',
                'string',
                'max:100',
                Rule::unique('leave_policies')
                    ->where('country_id', $leavePolicy->country_id)
                    ->ignore($leavePolicy->id),
            ],
            'days_per_year'     => 'required|integer|min:1',
            'is_paid'           => 'required|boolean',
            'carry_over_days'   => 'required|integer|min:0',
            'applicable_gender' => 'required|in:all,male,female',
            'requires_document' => 'required|boolean',
            'is_active'         => 'required|boolean',
        ]);

        $leavePolicy->update($validated);

        return back()->with('success', 'Leave type updated successfully.');
    }

    public function destroyLeavePolicy(LeavePolicy $leavePolicy)
    {
        $this->authorizeCountry($leavePolicy->country_id);
        $leavePolicy->delete();

        return back()->with('success', 'Leave type removed.');
    }

    // ── Overtime Policy ───────────────────────────────────────
    public function storeOvertimePolicy(Request $request)
    {
        $countryId = $this->getCountryId();

        $validated = $request->validate([
            'title'      => [
                'required',
                'string',
                'max:100',
                // ဒီ country မှာ title မရှိသေးရဘူး
                Rule::unique('overtime_policies')
                    ->where('country_id', $countryId),
            ],
            'rate_type'  => 'required|in:multiplier,flat',
            'rate_value' => 'required|numeric|min:0',
            'is_active'  => 'required|boolean',
        ]);

        OvertimePolicy::create([...$validated, 'country_id' => $countryId]);

        return back()->with('success', 'Overtime rate added.');
    }

    public function updateOvertimePolicy(Request $request, OvertimePolicy $overtimePolicy)
    {
        $this->authorizeCountry($overtimePolicy->country_id);

        $validated = $request->validate([
            'title'      => [
                'required',
                'string',
                'max:100',
                // update မှာ ကိုယ့် id ကိုပဲ ignore လုပ်မယ်
                Rule::unique('overtime_policies')
                    ->where('country_id', $overtimePolicy->country_id)
                    ->ignore($overtimePolicy->id),
            ],
            'rate_type'  => 'required|in:multiplier,flat',
            'rate_value' => 'required|numeric|min:0',
            'is_active'  => 'required|boolean',
        ]);

        $overtimePolicy->update($validated);

        return back()->with('success', 'Overtime rate updated.');
    }

public function destroyOvertimePolicy(OvertimePolicy $overtimePolicy)
{
    $this->authorizeCountry($overtimePolicy->country_id);
    $overtimePolicy->delete();

    return back()->with('success', 'Overtime rate deleted.');
}

    // ── Currency ──────────────────────────────────────────────
    public function storeCurrency(Request $request)
    {
        $countryId = $this->getCountryId();

        $validated = $request->validate([
            'currency_name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('payroll_currencies')
                    ->where('country_id', $countryId),
            ],
            'currency_code' => 'required|string|max:10',
            'is_active'     => 'required|boolean',
        ]);

        PayrollCurrency::create([...$validated, 'country_id' => $countryId]);

        return back()->with('success', 'Currency added successfully.');
    }

    public function updateCurrency(Request $request, PayrollCurrency $currency)
    {
        $this->authorizeCountry($currency->country_id);

        $validated = $request->validate([
            'currency_name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('payroll_currencies')
                    ->where('country_id', $currency->country_id)
                    ->ignore($currency->id),
            ],
            'currency_code' => 'required|string|max:10',
            'is_active'     => 'required|boolean',
        ]);

        $currency->update($validated);

        return back()->with('success', 'Currency updated successfully.');
    }

    public function destroyCurrency(PayrollCurrency $currency)
    {
        $this->authorizeCountry($currency->country_id);
        $currency->delete();

        return back()->with('success', 'Currency removed successfully.');
    }

// ── Deductions ────────────────────────────────────────────
public function storeDeduction(Request $request)
{
    $countryId = $this->getCountryId();

    $validated = $request->validate([
        'name' => [
            'required', 'string', 'max:100',
            Rule::unique('salary_deductions')
                ->where('country_id', $countryId),
        ],
        'deduction_type' => 'required|in:percentage,flat',
        'amount_per_unit' => 'required|numeric|min:0',
        'is_active'       => 'required|boolean',
    ]);

    SalaryDeduction::create([...$validated, 'country_id' => $countryId]);

    return back()->with('success', 'Deduction added successfully.');
}

public function updateDeduction(Request $request, SalaryDeduction $deduction)
{
    $this->authorizeCountry($deduction->country_id);

    $validated = $request->validate([
        'name' => [
            'required', 'string', 'max:100',
            Rule::unique('salary_deductions')
                ->where('country_id', $deduction->country_id)
                ->ignore($deduction->id),
        ],
        'deduction_type'  => 'required|in:percentage,flat',
        'amount_per_unit' => 'required|numeric|min:0',
        'is_active'       => 'required|boolean',
    ]);

    $deduction->update($validated);

    return back()->with('success', 'Deduction updated successfully.');
}

public function destroyDeduction(SalaryDeduction $deduction)
{
    $this->authorizeCountry($deduction->country_id);
    $deduction->delete();

    return back()->with('success', 'Deduction removed successfully.');
}

// ── Allowances ────────────────────────────────────────────
public function storeAllowance(Request $request)
{
    $countryId = $this->getCountryId();

    $validated = $request->validate([
        'name' => [
            'required', 'string', 'max:100',
            Rule::unique('payroll_allowances')
                ->where('country_id', $countryId),
        ],
        'type'      => 'required|in:percentage,flat',
        'value'     => 'required|numeric|min:0',
        'is_active' => 'required|boolean',
    ]);

    PayrollAllowance::create([...$validated, 'country_id' => $countryId]);

    return back()->with('success', 'Allowance added successfully.');
}

public function updateAllowance(Request $request, PayrollAllowance $allowance)
{
    $this->authorizeCountry($allowance->country_id);

    $validated = $request->validate([
        'name' => [
            'required', 'string', 'max:100',
            Rule::unique('payroll_allowances')
                ->where('country_id', $allowance->country_id)
                ->ignore($allowance->id),
        ],
        'type'      => 'required|in:percentage,flat',
        'value'     => 'required|numeric|min:0',
        'is_active' => 'required|boolean',
    ]);

    $allowance->update($validated);

    return back()->with('success', 'Allowance updated successfully.');
}

public function destroyAllowance(PayrollAllowance $allowance)
{
    $this->authorizeCountry($allowance->country_id);
    $allowance->delete();

    return back()->with('success', 'Allowance removed successfully.');
}


// ── Payroll Banks ─────────────────────────────────────────
public function storeBank(Request $request)
{
    $countryId = $this->getCountryId();

    $validated = $request->validate([
        'bank_name' => [
            'required', 'string', 'max:100',
            Rule::unique('payroll_banks')
                ->where('country_id', $countryId),
        ],
        'bank_code' => 'nullable|string|max:20',
        'is_active' => 'required|boolean',
    ]);

    PayrollBank::create([...$validated, 'country_id' => $countryId]);

    return back()->with('success', 'Bank added successfully.');
}

public function updateBank(Request $request, PayrollBank $bank)
{
    $this->authorizeCountry($bank->country_id);

    $validated = $request->validate([
        'bank_name' => [
            'required', 'string', 'max:100',
            Rule::unique('payroll_banks')
                ->where('country_id', $bank->country_id)
                ->ignore($bank->id),
        ],
        'bank_code' => 'nullable|string|max:20',
        'is_active' => 'required|boolean',
    ]);

    $bank->update($validated);

    return back()->with('success', 'Bank updated successfully.');
}

public function destroyBank(PayrollBank $bank)
{
    $this->authorizeCountry($bank->country_id);
    $bank->delete();

    return back()->with('success', 'Bank removed successfully.');
}

    // ── Salary Rule (General Settings) ────────────────────────
    public function saveSalaryRule(Request $request)
    {
        $countryId = $this->getCountryId();

        $validated = $request->validate([
            'pay_cycle'              => 'required|in:monthly,semi_monthly,ten_day',
            'probation_days'         => 'required|integer|min:0',
            'bank_id'                => 'nullable|exists:payroll_banks,id',
            'working_hours_per_day'  => 'required|integer|min:1|max:24',
            'working_days_per_week'  => 'required|integer|min:1|max:7',
            'overtime_base'          => 'required|in:daily_rate,hourly_rate',
            'late_deduction_unit'    => 'required|in:per_minute,per_hour',
            'late_deduction_rate'    => 'nullable|numeric|min:0',
            'currency_id'            => 'nullable|exists:payroll_currencies,id',
        ]);

        // late_deduction_rate default 0
        $validated['late_deduction_rate'] = $validated['late_deduction_rate'] ?? 0;

        SalaryRule::updateOrCreate(
            ['country_id' => $countryId],
            $validated
        );

        return back()->with('success', 'General settings saved successfully.');
    }

    // ── Helper ────────────────────────────────────────────────
    private function authorizeCountry(int $resourceCountryId): void
    {
        if (auth()->user()->country_id !== $resourceCountryId) {
            abort(403, 'Unauthorized.');
        }
    }


    // ── Bonus Types ───────────────────────────────────────────
    public function storeBonusType(Request $request)
    {
        $countryId = $this->getCountryId();

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('payroll_bonus_types')
                    ->where('country_id', $countryId),
            ],
            'calculation_type' => 'required|in:flat,percentage',
            'value'            => 'required|numeric|min:0',
            'is_active'        => 'required|boolean',
        ]);

        PayrollBonusType::create([...$validated, 'country_id' => $countryId]);

        return back()->with('success', 'Bonus type added successfully.');
    }

    public function updateBonusType(Request $request, PayrollBonusType $bonusType)
    {
        $this->authorizeCountry($bonusType->country_id);

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('payroll_bonus_types')
                    ->where('country_id', $bonusType->country_id)
                    ->ignore($bonusType->id),
            ],
            'calculation_type' => 'required|in:flat,percentage',
            'value'            => 'required|numeric|min:0',
            'is_active'        => 'required|boolean',
        ]);

        $bonusType->update($validated);

        return back()->with('success', 'Bonus type updated successfully.');
    }

    public function destroyBonusType(PayrollBonusType $bonusType)
    {
        $this->authorizeCountry($bonusType->country_id);
        $bonusType->delete();

        return back()->with('success', 'Bonus type removed successfully.');
    }

    // ── Bonus Schedules ───────────────────────────────────────
    public function storeBonusSchedule(Request $request)
    {
        $countryId = $this->getCountryId();

        $request->validate([
            'bonus_type_id' => 'required|exists:payroll_bonus_types,id',
            'frequency'     => 'required|in:monthly,quarterly,yearly,once',
            'pay_month'     => 'required_if:frequency,yearly|required_if:frequency,once|nullable|integer|min:1|max:12',
            'pay_quarter'   => 'required_if:frequency,quarterly|nullable|integer|min:1|max:4',
            'notes'         => 'required|string|max:200',
            'is_active'     => 'required|boolean',
        ], [
            'pay_month.required_if'   => 'Pay month is required for this frequency.',
            'pay_quarter.required_if' => 'Pay quarter is required.',
            'notes.required'          => 'Notes is required.',
        ]);

        // duplicate check
        $exists = \App\Models\PayrollBonusSchedule::where('country_id', $countryId)
            ->where('bonus_type_id', $request->bonus_type_id)
            ->where('frequency', $request->frequency)
            ->exists();

        if ($exists) {
            return back()->withErrors(['bonus_type_id' => 'This bonus type already has a schedule with the same frequency.'])->withInput();
        }

        PayrollBonusSchedule::create([
            'country_id'    => $countryId,
            'bonus_type_id' => $request->bonus_type_id,
            'frequency'     => $request->frequency,
            'pay_month'     => $request->pay_month,
            'pay_quarter'   => $request->pay_quarter,
            'notes'         => $request->notes,
            'is_active'     => $request->is_active,
        ]);

        return back()->with('success', 'Bonus schedule added successfully.');
    }

    public function updateBonusSchedule(Request $request, PayrollBonusSchedule $bonusSchedule)
    {
        $this->authorizeCountry($bonusSchedule->country_id);

        $request->validate([
            'bonus_type_id' => 'required|exists:payroll_bonus_types,id',
            'frequency'     => 'required|in:monthly,quarterly,yearly,once',
            'pay_month'     => 'required_if:frequency,yearly|required_if:frequency,once|nullable|integer|min:1|max:12',
            'pay_quarter'   => 'required_if:frequency,quarterly|nullable|integer|min:1|max:4',
            'notes'         => 'required|string|max:200',
            'is_active'     => 'required|boolean',
        ], [
            'pay_month.required_if'   => 'Pay month is required for this frequency.',
            'pay_quarter.required_if' => 'Pay quarter is required.',
            'notes.required'          => 'Notes is required.',
        ]);

        $exists = \App\Models\PayrollBonusSchedule::where('country_id', $bonusSchedule->country_id)
            ->where('bonus_type_id', $request->bonus_type_id)
            ->where('frequency', $request->frequency)
            ->where('id', '!=', $bonusSchedule->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['bonus_type_id' => 'This bonus type already has a schedule with the same frequency.'])->withInput();
        }

        $bonusSchedule->update([
            'bonus_type_id' => $request->bonus_type_id,
            'frequency'     => $request->frequency,
            'pay_month'     => $request->pay_month,
            'pay_quarter'   => $request->pay_quarter,
            'notes'         => $request->notes,
            'is_active'     => $request->is_active,
        ]);

        return back()->with('success', 'Bonus schedule updated successfully.');
    }
}