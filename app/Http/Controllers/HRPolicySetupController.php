<?php

namespace App\Http\Controllers;

use App\Models\LeavePolicy;
use App\Models\OvertimePolicy;
use App\Models\PayrollCurrency;
use App\Models\SalaryDeduction;
use App\Models\PayrollAllowance;
use App\Models\SalaryRule;
use App\Models\PublicHoliday;
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
            'country' => \App\Models\Country::find(auth()->user()->country_id),
            'publicHolidays' => PublicHoliday::where('country_id', $countryId)->orderBy('date')->get(),
            'completedSections' => [
                'holiday' => PublicHoliday::where('country_id', $countryId)->exists(),
                'leave'     => LeavePolicy::where('country_id', $countryId)->exists(),
                'overtime'  => OvertimePolicy::where('country_id', $countryId)->exists(),
                'currency'  => PayrollCurrency::where('country_id', $countryId)->exists(),
                'deduction' => SalaryDeduction::where('country_id', $countryId)->exists(),
                'allowance' => PayrollAllowance::where('country_id', $countryId)->exists(),
                'bonus'     => PayrollBonusType::where('country_id', $countryId)->exists(),
                'salary'    => SalaryRule::where('country_id', $countryId)->exists(),
            ],

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
            'title'      => 'required|string|max:100',
            'day_type'   => 'required|in:weekday,weekend,public_holiday',
            'shift_type' => 'required|in:day,night,both',
            'rate_type'  => 'required|in:multiplier,flat',
            'rate_value' => 'required|numeric|min:0',
            'is_active'  => 'required|boolean',
        ], [
            'day_type.required'   => 'Please select Applies To (Weekday / Weekend / Public Holiday).',
            'shift_type.required' => 'Please select Shift (Day / Night / Both).',
        ]);
    
        // Duplicate combination check
        $exists = \App\Models\OvertimePolicy::where('country_id', $countryId)
            ->where('day_type',   $validated['day_type'])
            ->where('shift_type', $validated['shift_type'])
            ->exists();
    
        if ($exists) {
            $label = ucfirst(str_replace('_', ' ', $validated['day_type']));
            $shift = ucfirst($validated['shift_type']);
            return back()->withErrors([
                'day_type' => "A policy for {$shift} shift + {$label} already exists for this country.",
            ])->withInput();
        }
    
        \App\Models\OvertimePolicy::create([...$validated, 'country_id' => $countryId]);
    
        return back()->with('success', 'Overtime rate added.');
    }
    
    public function updateOvertimePolicy(Request $request, \App\Models\OvertimePolicy $overtimePolicy)
    {
        $this->authorizeCountry($overtimePolicy->country_id);
    
        $validated = $request->validate([
            'title'      => 'required|string|max:100',
            'day_type'   => 'required|in:weekday,weekend,public_holiday',
            'shift_type' => 'required|in:day,night,both',
            'rate_type'  => 'required|in:multiplier,flat',
            'rate_value' => 'required|numeric|min:0',
            'is_active'  => 'required|boolean',
        ]);
    
        // Duplicate check — ignore self
        $exists = \App\Models\OvertimePolicy::where('country_id', $overtimePolicy->country_id)
            ->where('day_type',   $validated['day_type'])
            ->where('shift_type', $validated['shift_type'])
            ->where('id', '!=', $overtimePolicy->id)
            ->exists();
    
        if ($exists) {
            $label = ucfirst(str_replace('_', ' ', $validated['day_type']));
            $shift = ucfirst($validated['shift_type']);
            return back()->withErrors([
                'day_type' => "A policy for {$shift} shift + {$label} already exists.",
            ])->withInput();
        }
    
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
            'bonus_during_probation' => 'required|boolean',
            'bonus_for_contract'     => 'nullable|boolean',
            'bank_id'                => 'nullable|exists:payroll_banks,id',
            'working_hours_per_day'  => 'required|integer|min:1|max:24',
            'working_days_per_week'  => 'required|integer|min:1|max:7',
            'day_shift_start'        => 'required|date_format:H:i',
            'day_shift_end'          => 'required|date_format:H:i',
            'work_start'             => 'nullable|date_format:H:i',
            'work_end'               => 'nullable|date_format:H:i',
            'overtime_base'          => 'required|in:daily_rate,hourly_rate',
            'late_deduction_unit'    => 'required|in:per_minute,per_hour',
            'late_deduction_rate'    => 'nullable|numeric|min:0',
            'currency_id'            => 'nullable|exists:payroll_currencies,id',
            'lunch_start'            => 'nullable|date_format:H:i',
            'lunch_end'              => 'nullable|date_format:H:i',
            'payroll_cutoff_day'     => 'required|integer|min:1|max:31',
        ], [
            'day_shift_start.required'    => 'Day shift start time is required.',
            'day_shift_start.date_format' => 'Day shift start must be in HH:MM format.',
            'day_shift_end.required'      => 'Day shift end time is required.',
            'day_shift_end.date_format'   => 'Day shift end must be in HH:MM format.',
            'payroll_cutoff_day.required' => 'Payroll cutoff day is required.',
            'payroll_cutoff_day.min'      => 'Cutoff day must be between 1 and 31.',
            'payroll_cutoff_day.max'      => 'Cutoff day must be between 1 and 31.',
        ]);
    
        if ($validated['day_shift_start'] === $validated['day_shift_end']) {
            return back()->withErrors([
                'day_shift_end' => 'Day shift start and end cannot be the same time.',
            ])->withInput();
        }
    
        $validated['late_deduction_rate'] = $validated['late_deduction_rate'] ?? 0;
    
        SalaryRule::updateOrCreate(
            ['country_id' => $countryId],
            $validated
        );

        // ── Payroll period templates ──────────────────────────────────────────
        // Frontend ကနေ period_days ပို့ရင် ဒါကိုသုံး (preview နဲ့ တူညီ)
        // မပို့ဘူးဆိုရင် backend fallback နဲ့ တွက်
        // ─────────────────────────────────────────────────────────────────────
        $cycle  = $validated['pay_cycle'];
        $cutoff = (int) $validated['payroll_cutoff_day'];

        // Frontend ကနေ period_days receive — e.g. {"1": 10, "2": 24}
        $frontendPeriodDays = $request->input('period_days');

        if (!empty($frontendPeriodDays) && is_array($frontendPeriodDays)) {
            // Frontend ကနေ ပို့တဲ့ days သုံး — preview နဲ့ exact match ✅
            $periodDays = [];
            foreach ($frontendPeriodDays as $num => $day) {
                $periodDays[(int) $num] = (int) $day;
            }
            ksort($periodDays); // period_number order အတိုင်း စီ
        } else {
            // Fallback — backend တွက် (frontend မပို့တဲ့ edge case)
            $periodDays = match($cycle) {
                'semi_monthly' => [
                    1 => (int) round($cutoff / 2),
                    2 => $cutoff,
                ],
                'ten_day' => [
                    1 => (int) round($cutoff / 3),
                    2 => (int) round(($cutoff / 3) * 2),
                    3 => $cutoff,
                ],
                default => [
                    1 => $cutoff,
                ],
            };
        }

        // Cycle ပြောင်းရင် old templates delete ပြီး new templates create
        \App\Models\PayrollPeriod::where('country_id', $countryId)->delete();

        foreach ($periodDays as $periodNumber => $day) {
            \App\Models\PayrollPeriod::create([
                'country_id'    => $countryId,
                'day'           => $day,
                'period_number' => $periodNumber,
                'status'        => 'draft',
                'generated_by'  => auth()->id(),
            ]);
        }

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
public function storePublicHoliday(Request $request): \Illuminate\Http\RedirectResponse
{
    $countryId = $this->getCountryId();

    $request->validate([
        'name'         => 'required|string|max:100',
        'date'         => 'required|date',
        'is_recurring' => 'required|boolean',
    ]);

    // ── Duplicate check: same name + date + country ──
    $exists = \App\Models\PublicHoliday::where('country_id', $countryId)
        ->whereDate('date', $request->date)
        ->where('name', $request->name)
        ->exists();

    if ($exists) {
        return back()->withErrors([
            'date' => "'{$request->name}' on {$request->date} already exists.",
        ])->withInput();
    }

    // ── Same date different name → warn but allow ──
    // (ဥပမာ Khmer New Year 3 ရက်ဆက် — same date မဟုတ်ဘူး)

    \App\Models\PublicHoliday::create([
        'country_id'   => $countryId,
        'name'         => $request->name,
        'date'         => $request->date,
        'is_recurring' => $request->is_recurring,
    ]);

    return back()->with('success', 'Public holiday added successfully.');
}

public function updatePublicHoliday(Request $request, \App\Models\PublicHoliday $publicHoliday): \Illuminate\Http\RedirectResponse
{
    $this->authorizeCountry($publicHoliday->country_id);

    $request->validate([
        'name'         => 'required|string|max:100',
        'date'         => 'required|date',
        'is_recurring' => 'required|boolean',
    ]);

    // ── Duplicate check: same name + date + country (excluding self) ──
    $exists = \App\Models\PublicHoliday::where('country_id', $publicHoliday->country_id)
        ->whereDate('date', $request->date)
        ->where('name', $request->name)
        ->where('id', '!=', $publicHoliday->id)
        ->exists();

    if ($exists) {
        return back()->withErrors([
            'date' => "'{$request->name}' on {$request->date} already exists.",
        ])->withInput();
    }

    $publicHoliday->update($request->only(['name', 'date', 'is_recurring']));
    return back()->with('success', 'Public holiday updated successfully.');
}

public function destroyPublicHoliday(\App\Models\PublicHoliday $publicHoliday): \Illuminate\Http\RedirectResponse
{
    $this->authorizeCountry($publicHoliday->country_id);
    $publicHoliday->delete();
    return back()->with('success', 'Public holiday deleted.');
}
}