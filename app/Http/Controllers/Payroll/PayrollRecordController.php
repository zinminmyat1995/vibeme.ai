<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\PayrollRecord;
use App\Services\Payroll\BankExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollRecordController extends Controller
{
    public function __construct(
        private BankExportService $bankExportService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = PayrollRecord::with(['user', 'payrollPeriod', 'bonuses']);

        $user = Auth::user();

        // Role-based access
        if ($user->hasRole('member')) {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('management')) {
            $query->whereHas('user', fn($q) => $q->where('country_id', $user->country_id));
        }
        // HR & Admin can see all

        $records = $query
            ->when($request->payroll_period_id, fn($q) => $q->where('payroll_period_id', $request->payroll_period_id))
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->get();

        return response()->json($records);
    }

    public function show(PayrollRecord $payrollRecord): JsonResponse
    {
        $user = Auth::user();

        if ($user->hasRole('member') && $payrollRecord->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payrollRecord->load(['user', 'payrollPeriod', 'bonuses']));
    }

    public function exportBank(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        // HR only — export bank transfer report
        $periodId = $request->input('payroll_period_id');
        return $this->bankExportService->export($periodId);
    }
}