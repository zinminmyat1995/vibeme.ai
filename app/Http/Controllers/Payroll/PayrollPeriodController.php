<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StorePayrollPeriodRequest;
use App\Models\PayrollPeriod;
use App\Models\SalaryRule;
use App\Services\Payroll\SalaryCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollPeriodController extends Controller
{
    public function __construct(
        private SalaryCalculationService $salaryCalculationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $periods = PayrollPeriod::with('country')
            ->when($request->country_id, fn($q) => $q->where('country_id', $request->country_id))
            ->when($request->year,       fn($q) => $q->where('year',       $request->year))
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->orderBy('period_number') // ← P1 before P2 before P3
            ->get();

        return response()->json($periods);
    }

    public function store(StorePayrollPeriodRequest $request): JsonResponse
    {
        $period = PayrollPeriod::create([
            ...$request->validated(),
            'period_number' => $request->validated()['period_number'] ?? 1,
            'status'        => 'draft',
            'generated_by'  => Auth::id(),
        ]);

        return response()->json($period, 201);
    }

    public function calculate(PayrollPeriod $payrollPeriod): JsonResponse
    {
        $result = $this->salaryCalculationService->calculateForPeriod($payrollPeriod);
        $payrollPeriod->update(['status' => 'calculated']);

        return response()->json([
            'message'          => 'Payroll calculated successfully',
            'total_employees'  => $result['total_employees'],
            'total_net_salary' => $result['total_net_salary'],
        ]);
    }

    public function approve(PayrollPeriod $payrollPeriod): JsonResponse
    {
        $payrollPeriod->update(['status' => 'approved']);
        return response()->json(['message' => 'Payroll period approved']);
    }

    public function markAsPaid(PayrollPeriod $payrollPeriod): JsonResponse
    {
        $payrollPeriod->update(['status' => 'paid']);
        return response()->json(['message' => 'Payroll marked as paid']);
    }
}