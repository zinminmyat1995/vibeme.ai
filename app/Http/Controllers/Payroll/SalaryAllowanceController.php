<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreSalaryAllowanceRequest;
use App\Models\SalaryAllowance;
use Illuminate\Http\JsonResponse;

class SalaryAllowanceController extends Controller
{
    public function index(SalaryAllowance $salaryAllowance): JsonResponse
    {
        $allowances = SalaryAllowance::where('salary_rule_id', $salaryAllowance->salary_rule_id)
            ->where('is_active', true)
            ->get();

        return response()->json($allowances);
    }

    public function store(StoreSalaryAllowanceRequest $request): JsonResponse
    {
        $allowance = SalaryAllowance::create($request->validated());
        return response()->json($allowance, 201);
    }

    public function update(StoreSalaryAllowanceRequest $request, SalaryAllowance $salaryAllowance): JsonResponse
    {
        $salaryAllowance->update($request->validated());
        return response()->json($salaryAllowance);
    }

    public function destroy(SalaryAllowance $salaryAllowance): JsonResponse
    {
        $salaryAllowance->update(['is_active' => false]);
        return response()->json(['message' => 'Allowance deactivated successfully']);
    }
}