<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StorePayrollBonusRequest;
use App\Models\PayrollBonus;
use Illuminate\Http\JsonResponse;

class PayrollBonusController extends Controller
{
    public function store(StorePayrollBonusRequest $request): JsonResponse
    {
        $bonus = PayrollBonus::create($request->validated());
        return response()->json($bonus, 201);
    }

    public function update(StorePayrollBonusRequest $request, PayrollBonus $payrollBonus): JsonResponse
    {
        $payrollBonus->update($request->validated());
        return response()->json($payrollBonus);
    }

    public function destroy(PayrollBonus $payrollBonus): JsonResponse
    {
        $payrollBonus->delete();
        return response()->json(['message' => 'Bonus deleted successfully']);
    }
}