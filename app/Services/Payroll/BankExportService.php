<?php

namespace App\Services\Payroll;

use App\Models\PayrollRecord;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BankExportService
{
    public function export(int $payrollPeriodId): BinaryFileResponse
    {
        $records = PayrollRecord::with(['user.employeePayrollProfile'])
            ->where('payroll_period_id', $payrollPeriodId)
            ->where('status', 'confirmed')
            ->get();

        $data = $this->formatForBank($records);
        return $this->generateExcel($data, $payrollPeriodId);
    }

    private function formatForBank(Collection $records): array
    {
        return $records->map(fn($record) => [
            'Employee Name' => $record->user->name,
            'Bank Name' => $record->user->employeePayrollProfile?->bank_name ?? '-',
            'Account Number' => $record->user->employeePayrollProfile?->bank_account_number ?? '-',
            'Account Holder' => $record->user->employeePayrollProfile?->bank_account_holder_name ?? '-',
            'Branch' => $record->user->employeePayrollProfile?->bank_branch ?? '-',
            'Net Salary' => $record->net_salary,
            'Currency' => $record->payrollPeriod->country->currency_code,
        ])->toArray();
    }

    private function generateExcel(array $data, int $periodId): BinaryFileResponse
    {
        // Using maatwebsite/excel or spatie/simple-excel
        $filename = "bank_transfer_payroll_{$periodId}.xlsx";
        $path = storage_path("app/exports/{$filename}");

        // Simple CSV fallback
        $file = fopen($path, 'w');
        fputcsv($file, array_keys($data[0] ?? []));
        foreach ($data as $row) {
            fputcsv($file, $row);
        }
        fclose($file);

        return response()->download($path, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function preview(int $payrollPeriodId): array
    {
        $records = PayrollRecord::with(['user.employeePayrollProfile'])
            ->where('payroll_period_id', $payrollPeriodId)
            ->where('status', 'confirmed')
            ->get();

        return $this->formatForBank($records);
    }
}