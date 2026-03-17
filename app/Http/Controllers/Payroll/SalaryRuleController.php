<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreSalaryRuleRequest;
use App\Models\SalaryRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryRuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rules = SalaryRule::query()
            ->when($request->country_id, fn($q) => $q->where('country_id', $request->country_id))
            ->where('is_active', true)
            ->with(['allowances', 'deductions', 'taxBrackets', 'socialSecurityRule'])
            ->get();

        return response()->json($rules);
    }

    public function store(StoreSalaryRuleRequest $request): JsonResponse
    {
        $rule = SalaryRule::create($request->validated());
        return response()->json($rule, 201);
    }

    public function show(SalaryRule $salaryRule): JsonResponse
    {
        return response()->json($salaryRule->load([
            'allowances',
            'deductions',
            'taxBrackets',
            'socialSecurityRule',
        ]));
    }

    public function update(StoreSalaryRuleRequest $request, SalaryRule $salaryRule): JsonResponse
    {
        $salaryRule->update($request->validated());
        return response()->json($salaryRule);
    }

    public function destroy(SalaryRule $salaryRule): JsonResponse
    {
        $salaryRule->update(['is_active' => false]);
        return response()->json(['message' => 'Salary rule deactivated successfully']);
    }
}