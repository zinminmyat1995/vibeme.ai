<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\SalaryRule;
use App\Models\EmployeePayrollProfile;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use ZipArchive;

class PayslipController extends Controller
{
    // ──────────────────────────────────────────────────────────────
    // GET /payroll/payslip
    // ──────────────────────────────────────────────────────────────
    public function index(): \Inertia\Response
    {
        $user       = Auth::user();
        $isHR       = $user->hasAnyRole(['hr', 'admin']);
        $countryId  = $user->countryRecord?->id;
        $salaryRule = SalaryRule::where('country_id', $countryId)->with('currency')->first();

        $periodTemplates = PayrollPeriod::where('country_id', $countryId)
            ->orderBy('period_number')
            ->get()
            ->map(fn($p) => ['id' => $p->id, 'period_number' => $p->period_number, 'day' => $p->day]);

        $employees = [];
        if ($isHR) {
            $employees = EmployeePayrollProfile::with('user')
                ->where('country_id', $countryId)
                ->where('is_active', true)
                ->get()
                ->map(fn($p) => [
                    'id'         => $p->user_id,
                    'name'       => $p->user?->name,
                    'position'   => $p->user?->position,
                    'department' => $p->user?->department,
                ])
                ->sortBy('name')->values();
        }

        return Inertia::render('Payroll/Payslip/Index', [
            'salaryRule'      => $salaryRule ? [
                'pay_cycle'     => $salaryRule->pay_cycle,
                'currency_code' => $salaryRule->currency?->currency_code ?? '',
            ] : null,
            'periodTemplates' => $periodTemplates,
            'employees'       => $employees,
            'isHR'            => $isHR,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/payslip/records
    // ──────────────────────────────────────────────────────────────
    public function records(Request $request)
    {
        $user      = Auth::user();
        $isHR      = $user->hasAnyRole(['hr', 'admin']);
        $countryId = $user->countryRecord?->id;

        $query = PayrollRecord::with(['user', 'payrollPeriod.country', 'bonuses'])
            ->where('status', 'confirmed')
            ->whereHas('payrollPeriod', fn($q) => $q->where('country_id', $countryId));

        if (!$isHR) $query->where('user_id', $user->id);

        if ($request->filled('year'))      $query->where('year',  $request->year);
        if ($request->filled('month'))     $query->where('month', $request->month);
        if ($request->filled('period_id')) $query->where('payroll_period_id', $request->period_id);
        if ($request->filled('user_id') && $isHR) $query->where('user_id', $request->user_id);

        $records = $query->orderByDesc('year')->orderByDesc('month')
            ->orderBy('payroll_period_id')->get()
            ->map(fn($r) => $this->formatPayslip($r));

        return response()->json($records);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/payslip/{id}/pdf
    // ──────────────────────────────────────────────────────────────
    public function downloadPdf(PayrollRecord $payrollRecord)
    {
        $this->authorizeView($payrollRecord);
        $data = $this->buildPayslipData($payrollRecord);
        return Pdf::loadView('payroll.payslip', $data)
            ->setPaper('a4', 'portrait')
            ->download($this->pdfFilename($payrollRecord));
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/payslip/{id}/excel  — Single period, clean sheet
    // ──────────────────────────────────────────────────────────────
    public function downloadExcel(PayrollRecord $payrollRecord)
    {
        $this->authorizeView($payrollRecord);
        $data        = $this->buildPayslipData($payrollRecord);
        $spreadsheet = new Spreadsheet();
        $ws          = $spreadsheet->getActiveSheet();
        $ws->setTitle(mb_substr($payrollRecord->user?->name ?? 'Payslip', 0, 31));
        $this->buildSingleSheet($ws, $data);
        return $this->streamExcel($spreadsheet, 'payslip_' . $this->slugName($payrollRecord) . '.xlsx');
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/payslip/bulk/pdf  — ZIP of PDFs
    // ──────────────────────────────────────────────────────────────
    public function bulkPdf(Request $request)
    {
        $this->authorizeHR();
        $records = $this->getBulkRecords($request);
        if ($records->isEmpty()) abort(404, 'No confirmed payslip records found.');

        $tmpDir = sys_get_temp_dir() . '/payslip_' . time();
        mkdir($tmpDir);

        foreach ($records as $r) {
            $data = $this->buildPayslipData($r);
            $pdf  = Pdf::loadView('payroll.payslip', $data)->setPaper('a4', 'portrait');
            file_put_contents($tmpDir . '/' . $this->pdfFilename($r), $pdf->output());
        }

        $zipPath = sys_get_temp_dir() . '/payslips_bulk_' . time() . '.zip';
        $zip     = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach (glob($tmpDir . '/*.pdf') as $f) $zip->addFile($f, basename($f));
        $zip->close();
        foreach (glob($tmpDir . '/*') as $f) unlink($f);
        rmdir($tmpDir);

        return response()->download($zipPath, 'payslips_' . $this->periodLabel($request) . '.zip', [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/payslip/bulk/excel
    // Employee တစ်ယောက် = 1 sheet, sheet ထဲ period sections ခွဲ
    // ──────────────────────────────────────────────────────────────
    public function bulkExcel(Request $request)
    {
        $this->authorizeHR();
        $records = $this->getBulkRecords($request);
        if ($records->isEmpty()) abort(404, 'No confirmed payslip records found.');

        $grouped     = $records->groupBy('user_id');
        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $tabColors = ['7C3AED','059669','2563EB','D97706','DC2626','0891B2','9333EA'];
        $sheetIdx  = 0;

        foreach ($grouped as $userId => $userRecords) {
            $first     = $userRecords->first();
            $sheetName = mb_substr($first->user?->name ?? "Employee_{$userId}", 0, 31);
            $ws        = $spreadsheet->createSheet($sheetIdx);
            $ws->setTitle($sheetName);
            $ws->getTabColor()->setRGB($tabColors[$sheetIdx % count($tabColors)]);
            $this->buildMultiPeriodSheet($ws, $userRecords->values()->all());
            $sheetIdx++;
        }

        return $this->streamExcel($spreadsheet, 'payslips_' . $this->periodLabel($request) . '.xlsx');
    }

    // ══════════════════════════════════════════════════════════════
    //  EXCEL SHEET BUILDERS
    // ══════════════════════════════════════════════════════════════

    // ── Single period sheet ──────────────────────────────────────
    private function buildSingleSheet(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, array $d): void
    {
        $curr = $d['currency'];
        $row  = 1;

        // ── Header ──
        $this->xlsHeader($ws, $row, $d['company_name']);
        $row++;

        // ── Employee info ──
        $row = $this->xlsEmployeeInfo($ws, $row, $d, showStatus: false);
        $row++;

        // ── Attendance ──
        $row = $this->xlsAttendanceRow($ws, $row, $d);
        $row++;

        // ── Earnings ──
        $row = $this->xlsEarningsSection($ws, $row, $d, $curr);
        $row++;

        // ── Deductions ──
        $row = $this->xlsDeductionsSection($ws, $row, $d, $curr);
        $row++;

        // ── Net salary ──
        $this->xlsNetSalary($ws, $row, $d['period_start'] . ' – ' . $d['period_end'], $d['net_salary'], $curr);

        $this->xlsSetColumnWidths($ws);
    }

    // ── Multi-period sheet (bulk excel, 1 employee N periods) ────
    private function buildMultiPeriodSheet(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, array $records): void
    {
        $first   = $records[0];
        $first->loadMissing(['user', 'payrollPeriod.country', 'bonuses']);
        $company = config('app.name', 'VibeMe.AI');
        $srCurr = SalaryRule::where('country_id', $first->payrollPeriod?->country_id)->with('currency')->first();
        $curr   = $srCurr?->currency?->currency_code ?? $first->payrollPeriod?->country?->currency_code ?? '';
        $row     = 1;

        // ── Compute full date range label (first period start → last period end) ──
        $allDates  = array_map(fn($r) => $this->getPeriodDates($r), $records);
        $dateRange = $allDates[0]['start'] . ' – ' . end($allDates)['end'];

        // ── Header ──
        $this->xlsHeader($ws, $row, $company);
        $row++;

        // Employee info (no status, no generated)
        $empInfoData = [
            'employee'   => $first->user,
            'company_name' => $company,
        ];
        $ws->setCellValue("A{$row}", 'Employee');
        $ws->setCellValue("C{$row}", $first->user?->name ?? '—');
        $ws->getStyle("A{$row}")->getFont()->setBold(true)->getColor()->setRGB('6B7280');
        $ws->getStyle("C{$row}")->getFont()->setBold(true)->getColor()->setRGB('111827');
        $ws->getStyle("A{$row}:F{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F9FAFB');
        $row++;

        foreach ([
            ['Position',   $first->user?->position   ?? '—'],
            ['Department', $first->user?->department  ?? '—'],
            ['Pay Period', $dateRange],
            ['Generated',  now()->format('d M Y H:i')],
        ] as [$lbl, $val]) {
            $ws->setCellValue("A{$row}", $lbl);
            $ws->setCellValue("C{$row}", $val);
            $ws->getStyle("A{$row}")->getFont()->setBold(true)->getColor()->setRGB('6B7280');
            $ws->getStyle("C{$row}")->getFont()->getColor()->setRGB('374151');
            $ws->getStyle("A{$row}:F{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F9FAFB');
            $ws->getStyle("A{$row}:F{$row}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_HAIR)->getColor()->setRGB('E5E7EB');
            $row++;
        }
        $row++;

        // ── Per-period sections ──
        foreach ($records as $idx => $rec) {
            $d    = $this->buildPayslipData($rec);
            $pRow = $row;

            // Period divider bar
            $ws->mergeCells("A{$row}:F{$row}");
            $ws->setCellValue("A{$row}", '  ' . $d['period_start'] . ' – ' . $d['period_end']);
            $ws->getStyle("A{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '5B21B6']],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
            $ws->getRowDimension($row)->setRowHeight(22);
            $row++;

            // Attendance mini-row
            $row = $this->xlsAttendanceRow($ws, $row, $d);
            $row++;

            // Earnings
            $row = $this->xlsEarningsSection($ws, $row, $d, $curr);
            $row++;

            // Deductions
            $row = $this->xlsDeductionsSection($ws, $row, $d, $curr);
            $row++;

            // Net salary for this period
            $this->xlsNetSalary($ws, $row, $d['period_start'] . ' – ' . $d['period_end'], $d['net_salary'], $curr);
            $row += 2; // spacer
        }

        $this->xlsSetColumnWidths($ws, true);
    }

    // ══════════════════════════════════════════════════════════════
    //  EXCEL COMPONENT HELPERS
    // ══════════════════════════════════════════════════════════════

    private function xlsHeader(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, string $company, string $dateRange = ''): void
    {
        $ws->mergeCells("A{$row}:F{$row}");
        $title = $company . '  —  PAYSLIP' . ($dateRange ? '  |  ' . $dateRange : '');
        $ws->setCellValue("A{$row}", $title);
        $ws->getStyle("A{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '7C3AED']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $ws->getRowDimension($row)->setRowHeight(30);
    }

    private function xlsEmployeeInfo(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, array $d, bool $showStatus = false): int
    {
        $rows = [
            ['Employee',   $d['employee']?->name      ?? '—'],
            ['Position',   $d['employee']?->position  ?? '—'],
            ['Department', $d['employee']?->department ?? '—'],
            ['Pay Period',  $d['period_start'] . ' – ' . $d['period_end']],
            ['Generated',  now()->format('d M Y H:i')],
        ];

        foreach ($rows as [$lbl, $val]) {
            $ws->setCellValue("A{$row}", $lbl);
            $ws->setCellValue("C{$row}", $val);
            $ws->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '6B7280']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'F9FAFB']],
            ]);
            $ws->getStyle("C{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '111827']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'F9FAFB']],
            ]);
            $ws->getStyle("A{$row}:F{$row}")->getBorders()->getBottom()
                ->setBorderStyle(Border::BORDER_HAIR)->getColor()->setRGB('E5E7EB');
            $row++;
        }

        return $row;
    }

    private function xlsAttendanceRow(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, array $d): int
    {
        // OT Hours: decimal → "Xh Ym"
        $otH   = (float)($d['overtime_hours'] ?? 0);
        $otHrs = (int) floor($otH);
        $otMin = (int) round(($otH - $otHrs) * 60);
        $otLabel = $otH > 0
            ? ($otHrs > 0 && $otMin > 0 ? "{$otHrs}h {$otMin}min" : ($otHrs > 0 ? "{$otHrs}h" : "{$otMin}min"))
            : '—';

        $cols = [
            ['Working Days', $d['working_days']],
            ['Present',      $d['present_days']],
            ['Absent',       $d['absent_days']],
            ['Late (min)',   $d['late_minutes'] > 0 ? $d['late_minutes'] . 'min' : '—'],
            ['OT Hours',     $otLabel],
        ];

        // Labels row
        $col = 'A';
        foreach ($cols as [$lbl, $_]) {
            $ws->setCellValue("{$col}{$row}", $lbl);
            $ws->getStyle("{$col}{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 9, 'color' => ['rgb' => '9CA3AF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'F9FAFB']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $col++;
        }
        $row++;

        // Values row
        $col   = 'A';
        $valColors = ['374151','059669','DC2626','D97706','7C3AED'];
        foreach ($cols as $i => [$_, $val]) {
            $ws->setCellValue("{$col}{$row}", $val);
            $ws->getStyle("{$col}{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 12, 'color' => ['rgb' => $valColors[$i]]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'FFFFFF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => 'E5E7EB']]],
            ]);
            $col++;
        }
        $ws->getRowDimension($row)->setRowHeight(20);

        return $row + 1;
    }

    private function xlsEarningsSection(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, array $d, string $curr): int
    {
        // Section header
        $ws->mergeCells("A{$row}:F{$row}");
        $ws->setCellValue("A{$row}", '  EARNINGS');
        $ws->getStyle("A{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '047857']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $ws->getRowDimension($row)->setRowHeight(18);
        $row++;

        $items = [['Base Salary', $d['base_salary']]];
        if ($d['total_allowances'] > 0) $items[] = ['Allowances',   $d['total_allowances']];
        if ($d['overtime_amount']  > 0) $items[] = ['Overtime Pay', $d['overtime_amount']];
        if ($d['bonus_amount']     > 0) $items[] = ['Bonus',        $d['bonus_amount']];
        foreach ($d['bonuses'] as $b) {
            $items[] = [($b->bonusType?->name ?? 'Bonus') . ($b->note ? " ({$b->note})" : ''), (float)$b->amount];
        }

        foreach ($items as [$lbl, $amt]) {
            $row = $this->xlsDataRow($ws, $row, $lbl, (float)$amt, $curr, false);
        }

        $gross = $d['base_salary'] + $d['total_allowances'] + $d['overtime_amount'] + $d['bonus_amount'];
        $row   = $this->xlsSubtotalRow($ws, $row, 'Total Earnings', $gross, $curr, '047857', 'F0FDF4');

        return $row;
    }

    private function xlsDeductionsSection(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, array $d, string $curr): int
    {
        if ($d['total_deductions'] <= 0) return $row;

        // Section header
        $ws->mergeCells("A{$row}:F{$row}");
        $ws->setCellValue("A{$row}", '  DEDUCTIONS');
        $ws->getStyle("A{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'DC2626']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $ws->getRowDimension($row)->setRowHeight(18);
        $row++;

        if ($d['late_deduction']      > 0) $row = $this->xlsDataRow($ws, $row, 'Late Arrival',        $d['late_deduction'],      $curr, true);
        if ($d['short_deduction']     > 0) $row = $this->xlsDataRow($ws, $row, 'Insufficient Hours',  $d['short_deduction'],     $curr, true);
        foreach ($d['deduction_breakdown'] as $db) {
            $lbl = $db['name'] . ' (' . ($db['type'] === 'percentage' ? $db['rate'] . '%' : 'flat') . ')';
            $row = $this->xlsDataRow($ws, $row, $lbl, $db['amount'], $curr, true);
        }

        $row = $this->xlsSubtotalRow($ws, $row, 'Total Deductions', $d['total_deductions'], $curr, 'DC2626', 'FEF2F2');

        return $row;
    }

    private function xlsDataRow(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, string $label, float $amount, string $curr, bool $negative): int
    {
        $ws->setCellValue("A{$row}", $label);
        $ws->setCellValue("F{$row}", ($negative ? '− ' : '+ ') . $curr . ' ' . number_format($amount, 2));
        $ws->getStyle("A{$row}")->applyFromArray([
            'font' => ['size' => 10, 'color' => ['rgb' => '374151']],
        ]);
        $ws->getStyle("F{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $negative ? 'DC2626' : '059669']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $ws->getStyle("A{$row}:F{$row}")->getBorders()->getBottom()
            ->setBorderStyle(Border::BORDER_HAIR)->getColor()->setRGB('F3F4F6');
        $ws->getRowDimension($row)->setRowHeight(18);
        return $row + 1;
    }

    private function xlsSubtotalRow(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, string $label, float $amount, string $curr, string $color, string $bg): int
    {
        $ws->setCellValue("A{$row}", $label);
        $ws->setCellValue("F{$row}", $curr . ' ' . number_format($amount, 2));
        $ws->getStyle("A{$row}:F{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $color]],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bg]],
        ]);
        $ws->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $ws->getStyle("A{$row}:F{$row}")->getBorders()->getBottom()
            ->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('E5E7EB');
        $ws->getRowDimension($row)->setRowHeight(18);
        return $row + 1;
    }

    private function xlsNetSalary(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, int $row, string $dateRange, float $netSalary, string $curr): void
    {
        $ws->mergeCells("A{$row}:D{$row}");
        $ws->setCellValue("A{$row}", 'NET SALARY  —  ' . $dateRange);
        $ws->setCellValue("F{$row}", $curr . ' ' . number_format($netSalary, 2));
        $ws->getStyle("A{$row}:F{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '7C3AED']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $ws->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $ws->getRowDimension($row)->setRowHeight(26);
    }

    private function xlsSetColumnWidths(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $ws, bool $wide = false): void
    {
        $ws->getColumnDimension('A')->setWidth(24);
        $ws->getColumnDimension('B')->setWidth(16);
        $ws->getColumnDimension('C')->setWidth(18);
        $ws->getColumnDimension('D')->setWidth(16);
        $ws->getColumnDimension('E')->setWidth(16);
        $ws->getColumnDimension('F')->setWidth(22);
    }

    // ══════════════════════════════════════════════════════════════
    //  DATA HELPERS
    // ══════════════════════════════════════════════════════════════

    private function authorizeView(PayrollRecord $record): void
    {
        $user = Auth::user();
        if (!$user->hasAnyRole(['hr', 'admin']) && $record->user_id !== $user->id) abort(403);
        if ($record->status !== 'confirmed') abort(403, 'Payslip is not yet confirmed.');
    }

    private function authorizeHR(): void
    {
        if (!Auth::user()->hasAnyRole(['hr', 'admin'])) abort(403);
    }

    private function getBulkRecords(Request $request)
    {
        $user      = Auth::user();
        $countryId = $user->countryRecord?->id;

        $query = PayrollRecord::with(['user', 'payrollPeriod.country', 'bonuses'])
            ->where('status', 'confirmed')
            ->whereHas('payrollPeriod', fn($q) => $q->where('country_id', $countryId));

        if ($request->filled('year'))      $query->where('year',  $request->year);
        if ($request->filled('month'))     $query->where('month', $request->month);
        if ($request->filled('period_id')) $query->where('payroll_period_id', $request->period_id);

        return $query->orderBy('user_id')->orderBy('payroll_period_id')->get();
    }

    private function getPeriodDates(PayrollRecord $r): array
    {
        $period    = $r->payrollPeriod;
        $countryId = $period?->country_id;
        $year      = $r->year  ?? now()->year;
        $month     = $r->month ?? now()->month;
        $periodNum = $period?->period_number ?? 1;
        $endDay    = $period?->day ?? 25;

        $salaryRule   = SalaryRule::where('country_id', $countryId)->first();
        $cycle        = $salaryRule?->pay_cycle ?? 'monthly';
        $totalPeriods = match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };

        $lastDay         = Carbon::create($year, $month, 1)->daysInMonth;
        $effectiveEndDay = min($endDay, $lastDay);
        $periodEnd       = Carbon::create($year, $month, $effectiveEndDay);

        if ($periodNum === 1) {
            $prev          = Carbon::create($year, $month, 1)->subMonth();
            $lastPeriodRec = PayrollPeriod::where('country_id', $countryId)->where('period_number', $totalPeriods)->first();
            $prevEndDay    = $lastPeriodRec ? min((int)$lastPeriodRec->day, $prev->daysInMonth) : min(25, $prev->daysInMonth);
            $periodStart   = Carbon::create($prev->year, $prev->month, $prevEndDay + 1);
        } else {
            $prevPeriodRec = PayrollPeriod::where('country_id', $countryId)->where('period_number', $periodNum - 1)->first();
            $prevEndDay    = $prevPeriodRec ? min((int)$prevPeriodRec->day, $lastDay) : 10;
            $periodStart   = Carbon::create($year, $month, $prevEndDay + 1);
        }

        return [
            'start' => $periodStart->format('d M Y'),
            'end'   => $periodEnd->format('d M Y'),
            'label' => $periodStart->format('d M') . ' – ' . $periodEnd->format('d M Y'),
        ];
    }

    private function buildPayslipData(PayrollRecord $r): array
    {
        $r->loadMissing(['user', 'payrollPeriod.country', 'bonuses']);

        $period    = $r->payrollPeriod;
        $countryId = $period?->country_id;
        $salaryRuleForCurr = SalaryRule::where('country_id', $countryId)->with('currency')->first();
        $curr = $salaryRuleForCurr?->currency?->currency_code ?? $period?->country?->currency_code ?? '';

        $salaryRule = SalaryRule::where('country_id', $countryId)->first();
        $cycle      = $salaryRule?->pay_cycle ?? 'monthly';
        $totalP     = match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };
        $isLastP    = ($period?->period_number ?? 1) === $totalP;

        $deductions = \App\Models\SalaryDeduction::where('country_id', $countryId)->where('is_active', true)->get();
        $profile    = EmployeePayrollProfile::where('user_id', $r->user_id)->where('country_id', $countryId)->where('is_active', true)->first();
        $fullBase   = $profile ? (float)$profile->base_salary : (float)$r->base_salary;

        $deductionBreakdown = [];
        if ($isLastP) {
            foreach ($deductions as $d) {
                $type   = $d->deduction_type ?? $d->unit_type ?? 'flat';
                $amount = $type === 'percentage' ? round($fullBase * ((float)$d->amount_per_unit / 100), 2) : (float)$d->amount_per_unit;
                $deductionBreakdown[] = ['name' => $d->name, 'type' => $type, 'rate' => (float)$d->amount_per_unit, 'amount' => $amount];
            }
        }

        $dates = $this->getPeriodDates($r);

        return [
            'record'              => $r,
            'employee'            => $r->user,
            'currency'            => $curr,
            'period_label'        => $dates['label'],
            'period_start'        => $dates['start'],
            'period_end'          => $dates['end'],
            'year'                => $r->year,
            'month'               => $r->month,
            'period_number'       => $period?->period_number ?? 1,
            'base_salary'         => (float) $r->base_salary,
            'total_allowances'    => (float) $r->total_allowances,
            'overtime_amount'     => (float) $r->overtime_amount,
            'bonus_amount'        => (float) $r->bonus_amount,
            'total_deductions'    => (float) $r->total_deductions,
            'late_deduction'      => (float) $r->tax_amount,
            'short_deduction'     => (float) $r->social_security_amount,
            'unpaid_leave_deduct' => 0,
            'deduction_breakdown' => $deductionBreakdown,
            'net_salary'          => (float) $r->net_salary,
            'present_days'        => $r->present_days,
            'working_days'        => $r->working_days,
            'absent_days'         => $r->absent_days,
            'leave_days_paid'     => (float) $r->leave_days_paid,
            'leave_days_unpaid'   => (float) $r->leave_days_unpaid,
            'overtime_hours'      => (float) $r->overtime_hours,
            'late_minutes'        => $r->late_minutes_total,
            'bonuses'             => $r->bonuses ?? collect(),
            'is_last_period'      => $isLastP,
            'company_name'        => config('app.name', 'VibeMe.AI'),
        ];
    }

    private function formatPayslip(PayrollRecord $r): array
    {
        $dates = $this->getPeriodDates($r);
        return [
            'id'           => $r->id,
            'user_id'      => $r->user_id,
            'name'         => $r->user?->name,
            'department'   => $r->user?->department,
            'position'     => $r->user?->position,
            'period_label' => $dates['label'],
            'period_start' => $dates['start'],
            'period_end'   => $dates['end'],
            'year'         => $r->year,
            'month'        => $r->month,
            'period_id'    => $r->payroll_period_id,
            'period_num'   => $r->payrollPeriod?->period_number ?? 1,
            'net_salary'   => (float) $r->net_salary,
            'status'       => $r->status,
            'currency'     => (function() use ($r) {
                                $sr = SalaryRule::where('country_id', $r->payrollPeriod?->country_id)->with('currency')->first();
                                return $sr?->currency?->currency_code ?? $r->payrollPeriod?->country?->currency_code ?? '';
                            })(),
        ];
    }

    private function streamExcel(Spreadsheet $spreadsheet, string $filename)
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'payslip_') . '.xlsx';
        (new Xlsx($spreadsheet))->save($tmpFile);
        return response()->download($tmpFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function pdfFilename(PayrollRecord $r): string
    {
        return 'payslip_' . $this->slugName($r) . '.pdf';
    }

    private function slugName(PayrollRecord $r): string
    {
        $name = str_replace(' ', '_', strtolower($r->user?->name ?? 'employee'));
        return "{$name}_{$r->year}_{$r->month}_p" . ($r->payrollPeriod?->period_number ?? 1);
    }

    private function periodLabel(Request $request): string
    {
        $months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        $m      = (int)$request->month;
        $label  = ($m >= 1 && $m <= 12) ? "{$months[$m-1]}_{$request->year}" : "period_{$request->year}";
        if ($request->filled('period_id')) $label .= '_p' . $request->period_id;
        return $label;
    }
}