<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StoreSalaryDeductionRequest;
use App\Models\SalaryDeduction;
use Illuminate\Http\JsonResponse;

class SalaryDeductionController extends Controller
{
    public function index(SalaryDeduction $salaryDeduction): JsonResponse
    {
        $deductions = SalaryDeduction::where('salary_rule_id', $salaryDeduction->salary_rule_id)
            ->where('is_active', true)
            ->get();

        return response()->json($deductions);
    }

    public function store(StoreSalaryDeductionRequest $request): JsonResponse
    {
        $deduction = SalaryDeduction::create($request->validated());
        return response()->json($deduction, 201);
    }

    public function update(StoreSalaryDeductionRequest $request, SalaryDeduction $salaryDeduction): JsonResponse
    {
        $salaryDeduction->update($request->validated());
        return response()->json($salaryDeduction);
    }

    public function destroy(SalaryDeduction $salaryDeduction): JsonResponse
    {
        $salaryDeduction->update(['is_active' => false]);
        return response()->json(['message' => 'Deduction deactivated successfully']);
    }
}