<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\EmployeePayrollProfile;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\SalaryRule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Barryvdh\DomPDF\Facade\Pdf;

class BankExportController extends Controller
{
    // ──────────────────────────────────────────────────────────────
    // GET /payroll/export  — Inertia page
    // ──────────────────────────────────────────────────────────────
    public function index(): \Inertia\Response
    {
        $user      = Auth::user();
        $countryId = $user->countryRecord?->id;

        $salaryRule = SalaryRule::where('country_id', $countryId)
            ->with('currency')
            ->first();

        $periodTemplates = PayrollPeriod::where('country_id', $countryId)
            ->orderBy('period_number')
            ->get()
            ->map(fn($p) => [
                'id'            => $p->id,
                'period_number' => $p->period_number,
                'day'           => $p->day,
            ]);

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
            ->sortBy('name')
            ->values();

        return Inertia::render('Payroll/BankExport/Index', [
            'salaryRule' => $salaryRule ? [
                'pay_cycle'     => $salaryRule->pay_cycle,
                'currency_code' => $salaryRule->currency?->currency_code ?? 'USD',
            ] : null,
            'periodTemplates' => $periodTemplates,
            'employees'       => $employees,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/export/preview  — JSON preview data
    // ──────────────────────────────────────────────────────────────
    public function preview(Request $request): JsonResponse
    {
        $records = $this->getRecords($request);

        $user      = Auth::user();
        $countryId = $user->countryRecord?->id;
        $salaryRule = \App\Models\SalaryRule::where('country_id', $countryId)->with('bank')->first();
        $bankEmail  = $salaryRule?->bank?->email ?? '';

        return response()->json([
            'records'      => $records->map(fn($r) => $this->formatRow($r)),
            'total'        => $records->sum('net_salary'),
            'count'        => $records->count(),
            'period_label' => $this->buildPeriodLabel($request),
            'currency'     => $this->getCurrencyCode($request),
            'bank_email'   => $bankEmail,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/export/excel  — Download .xlsx  (matches PDF layout)
    // ──────────────────────────────────────────────────────────────
    public function exportExcel(Request $request)
    {
        $records = $this->getRecords($request);

        if ($records->isEmpty()) {
            return response()->json(['message' => 'No confirmed payroll records found for this period.'], 404);
        }

        $rows        = $records->map(fn($r) => $this->formatRow($r))->values()->toArray();
        $periodLabel = $this->buildPeriodLabel($request);
        $currency    = $this->getCurrencyCode($request);

        // Company name (same logic as PDF)
        $countryName = strtolower($records->first()?->payrollPeriod?->country?->name ?? '');
        $regionMap   = ['cambodia' => 'Brycen Cambodia', 'myanmar' => 'Brycen Myanmar', 'japan' => 'Brycen Japan', 'vietnam' => 'Brycen Vietnam', 'korea' => 'Brycen Korea'];
        $companyName = $regionMap[$countryName] ?? 'Brycen ' . ucfirst($countryName ?: 'International');

        // Colors matching PDF navy theme
        $navy     = '1E3A5F';
        $navyDark = '17304F';
        $navyLight= 'EEF2FF';
        $white    = 'FFFFFF';
        $gray1    = 'F8FAFF';
        $gray2    = 'FFFFFF';
        $text     = '111827';
        $textMid  = '6B7280';
        $green    = '059669';

        $spreadsheet = new Spreadsheet();
        $ws          = $spreadsheet->getActiveSheet();
        $ws->setTitle('Bank Transfer');

        // ── Column widths (5 cols: A#, B name, C bank, D account, E salary) ──
        $ws->getColumnDimension('A')->setWidth(6);
        $ws->getColumnDimension('B')->setWidth(32);
        $ws->getColumnDimension('C')->setWidth(22);
        $ws->getColumnDimension('D')->setWidth(26);
        $ws->getColumnDimension('E')->setWidth(20);

        $row = 1;

        // ── Company name (B1) ──
        $ws->setCellValue("B{$row}", $companyName);
        $ws->getStyle("B{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 18, 'color' => ['rgb' => $navy]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $ws->getRowDimension($row)->setRowHeight(28);
        $row++;

        // ── Subtitle (B2) ──
        $ws->setCellValue("B{$row}", 'VibeMe.AI System');
        $ws->getStyle("B{$row}")->applyFromArray([
            'font' => ['size' => 8, 'color' => ['rgb' => $textMid], 'bold' => false],
        ]);
        $ws->getRowDimension($row)->setRowHeight(14);
        $row++;

        // ── Doc title right side (E1:E2) ──
        $ws->setCellValue("E1", 'BANK TRANSFER');
        $ws->getStyle("E1")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 13, 'color' => ['rgb' => $navy]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $ws->setCellValue("E2", 'INSTRUCTION');
        $ws->getStyle("E2")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 9, 'color' => ['rgb' => '4B6CB7']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);

        // ── Spacer ──
        $ws->getRowDimension($row)->setRowHeight(8);
        $row++;

        // ── Date bar (navy background, full width) ──
        $ws->mergeCells("A{$row}:E{$row}");
        $ws->setCellValue("A{$row}", now()->format('d F Y'));
        $ws->getStyle("A{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $white]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 2],
        ]);
        $ws->getRowDimension($row)->setRowHeight(24);
        $row++;

        // ── Table header (matches PDF: #, Account Holder, Bank, Account Number, Net Salary) ──
        $headers = ['#', 'Account Holder Name', 'Bank Name', 'Account Number', 'Net Salary'];
        foreach ($headers as $col => $header) {
            $colLetter = chr(65 + $col);
            $ws->setCellValue("{$colLetter}{$row}", $header);
        }
        $ws->getStyle("A{$row}:E{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 8, 'color' => ['rgb' => $navy]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navyLight]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $navy]]],
        ]);
        $ws->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $ws->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $ws->getRowDimension($row)->setRowHeight(22);
        $headerRow = $row;
        $row++;

        // ── Data rows ──
        $total = 0;
        foreach ($rows as $i => $r) {
            $bgRgb = $i % 2 === 0 ? $gray2 : $gray1;
            $accNum = $r['account_number'] !== '-' ? $r['account_number'] : 'not set';
            $bankNm = $r['bank_name']      !== '-' ? $r['bank_name']      : '—';

            $ws->setCellValue("A{$row}", $i + 1);
            $ws->setCellValue("B{$row}", $r['account_holder_name']);
            $ws->setCellValue("C{$row}", $bankNm);
            $ws->setCellValue("D{$row}", $accNum);
            $ws->setCellValue("E{$row}", $currency . ' ' . number_format((float)$r['net_salary'], 2));

            $ws->getStyle("A{$row}:E{$row}")->applyFromArray([
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bgRgb]],
                'font'      => ['size' => 10, 'color' => ['rgb' => $text]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['rgb' => 'E5E7EB']]],
            ]);
            // # center
            $ws->getStyle("A{$row}")->applyFromArray([
                'font'      => ['size' => 9, 'color' => ['rgb' => '9CA3AF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            // Account holder bold
            $ws->getStyle("B{$row}")->getFont()->setBold(true)->setSize(11);
            // Account number monospace-like
            $ws->getStyle("D{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $navy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
            // Net salary right, bold, navy
            $ws->getStyle("E{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $navy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
            ]);

            $total += (float)$r['net_salary'];
            $ws->getRowDimension($row)->setRowHeight(24);
            $row++;
        }

        // ── Total row (navy, full width) ──
        $ws->mergeCells("A{$row}:D{$row}");
        $ws->setCellValue("A{$row}", 'TOTAL TRANSFER AMOUNT — ' . count($rows) . ' ' . (count($rows) === 1 ? 'EMPLOYEE' : 'EMPLOYEES'));
        $ws->setCellValue("E{$row}", $currency . ' ' . number_format($total, 2));
        $ws->getStyle("A{$row}:E{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $white]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $ws->getStyle("A{$row}")->applyFromArray([
            'font'      => ['size' => 9, 'color' => ['rgb' => 'FFFFFFAA']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'indent' => 1],
        ]);
        $ws->getStyle("E{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 14, 'color' => ['rgb' => $white]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $ws->getRowDimension($row)->setRowHeight(28);
        $row += 2;

        // ── Authorized by (right-aligned) ──
        $ws->setCellValue("E{$row}", 'AUTHORIZED BY');
        $ws->getStyle("E{$row}")->applyFromArray([
            'font'      => ['size' => 7, 'bold' => true, 'color' => ['rgb' => $textMid]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $ws->getRowDimension($row)->setRowHeight(14);
        $row++;

        $ws->setCellValue("E{$row}", 'HR Department');
        $ws->getStyle("E{$row}")->applyFromArray([
            'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $navy]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $ws->getRowDimension($row)->setRowHeight(18);
        $row++;

        $ws->setCellValue("E{$row}", $companyName);
        $ws->getStyle("E{$row}")->applyFromArray([
            'font'      => ['size' => 9, 'color' => ['rgb' => $textMid]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $ws->getRowDimension($row)->setRowHeight(16);
        $row += 2;

        // ── Footer note ──
        $ws->mergeCells("A{$row}:E{$row}");
        $ws->setCellValue("A{$row}", 'Confidential  ·  ' . $companyName . ' VibeMe.AI System  ·  ' . now()->format('d M Y H:i'));
        $ws->getStyle("A{$row}")->applyFromArray([
            'font'      => ['size' => 7, 'italic' => true, 'color' => ['rgb' => $textMid]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // ── Freeze header ──
        $ws->freezePane('A' . ($headerRow + 1));

        $filename = 'bank_transfer_' . str_replace([' ', '/'], '_', $periodLabel) . '_' . now()->format('Ymd') . '.xlsx';
        $path     = storage_path('app/exports/' . $filename);

        if (!is_dir(storage_path('app/exports'))) {
            mkdir(storage_path('app/exports'), 0755, true);
        }

        $writer = new Xlsx($spreadsheet);
        $writer->save($path);

        return response()->download($path, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    // ──────────────────────────────────────────────────────────────
    // GET /payroll/export/pdf  — Download .pdf
    // ──────────────────────────────────────────────────────────────
    public function exportPdf(Request $request)
    {
        $records     = $this->getRecords($request);

        if ($records->isEmpty()) {
            return response()->json(['message' => 'No confirmed payroll records found for this period.'], 404);
        }

        $rows        = $records->map(fn($r) => $this->formatRow($r))->values()->toArray();
        $periodLabel = $this->buildPeriodLabel($request);
        $total       = collect($rows)->sum('net_salary');
        $currency    = $this->getCurrencyCode($request);
        $countryId   = Auth::user()->countryRecord?->id;
        $salaryRule  = SalaryRule::where('country_id', $countryId)->with('currency')->first();

        // Country → Brycen [Region] company name mapping
        $countryName = strtolower($records->first()?->payrollPeriod?->country?->name ?? '');
        $regionMap   = [
            'cambodia'   => 'Brycen Cambodia',
            'myanmar'    => 'Brycen Myanmar',
            'japan'      => 'Brycen Japan',
            'vietnam'    => 'Brycen Vietnam',
            'korea'      => 'Brycen Korea',
        ];
        $companyName = $regionMap[$countryName] ?? 'Brycen ' . ucfirst($countryName ?: 'International');

        $data = [
            'rows'         => $rows,
            'period_label' => $periodLabel,
            'total'        => $total,
            'currency'     => $currency,
            'generated_at' => now()->format('d M Y H:i'),
            'company_name' => $companyName,
        ];

        $filename = 'bank_transfer_' . str_replace([' ', '/'], '_', $periodLabel) . '_' . now()->format('Ymd') . '.pdf';

        return Pdf::loadView('payroll.bank_transfer', $data)
            ->setPaper('a4', 'portrait')
            ->download($filename);
    }

    // ──────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────
    private function getRecords(Request $request)
    {
        $user      = Auth::user();
        $countryId = $user->countryRecord?->id;

        $query = PayrollRecord::with([
            'user',
            'payrollPeriod.country',
        ])
        ->whereIn('status', ['confirmed', 'paid'])
        ->whereHas('payrollPeriod', fn($q) => $q->where('country_id', $countryId));

        if ($request->filled('period_id')) {
            $query->where('payroll_period_id', $request->period_id);
        }
        if ($request->filled('year'))    $query->where('year',    $request->year);
        if ($request->filled('month'))   $query->where('month',   $request->month);
        if ($request->filled('user_id')) $query->where('user_id', $request->user_id);

        $records = $query->orderBy('user_id')->get();

        // Batch-load EmployeePayrollProfile (avoid N+1, no User relationship needed)
        $userIds  = $records->pluck('user_id')->unique();
        $profiles = EmployeePayrollProfile::whereIn('user_id', $userIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('user_id');

        // Attach profile to each record as a custom attribute
        $records->each(fn($r) => $r->_profile = $profiles->get($r->user_id));

        return $records;
    }

    private function formatRow(PayrollRecord $r): array
    {
        // Use pre-loaded _profile (set in getRecords batch load)
        $profile = $r->_profile
            ?? EmployeePayrollProfile::where('user_id', $r->user_id)
                ->where('is_active', true)
                ->first();

        // Bank name: salary_rules.bank_id → payroll_banks.bank_name
        // Priority: employee profile bank_name override → salary rule bank
        $bankName = $profile?->bank_name ?? null;
        if (!$bankName) {
            $countryId  = $r->payrollPeriod?->country_id;
            $salaryRule = \App\Models\SalaryRule::where('country_id', $countryId)->with('bank')->first();
            $bankName   = $salaryRule?->bank?->bank_name;
        }

        return [
            'id'                  => $r->id,
            'status'              => $r->status,
            'employee_name'       => $r->user?->name ?? '-',
            'account_holder_name' => $profile?->bank_account_holder_name ?? $r->user?->name ?? '-',
            'bank_name'           => $bankName ?? '-',
            'account_number'      => $profile?->bank_account_number ?? '-',
            'branch'              => $profile?->bank_branch ?? '-',
            'department'          => $r->user?->department ?? '-',
            'position'            => $r->user?->position ?? '-',
            'net_salary'          => (float) $r->net_salary,
            'period_start'        => $r->payrollPeriod ? $this->getPeriodStart($r) : '-',
            'period_end'          => $r->payrollPeriod ? $this->getPeriodEnd($r) : '-',
        ];
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /payroll/export/mark-paid/{record}  — single record
    // ──────────────────────────────────────────────────────────────
    public function markAsPaid(\App\Models\PayrollRecord $record): \Illuminate\Http\JsonResponse
    {
        if ($record->status !== 'confirmed') {
            return response()->json(['message' => 'Only confirmed records can be marked as paid.'], 422);
        }

        $record->load(['user', 'payrollPeriod']);
        $record->update(['status' => 'paid']);

        $months = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

        $monthName   = $months[($record->month ?? now()->month) - 1];
        $periodNum   = $record->payrollPeriod?->period_number ?? 1;
        $periodLabel = "Period {$periodNum}";

        \App\Models\Notification::send(
            userId: $record->user_id,
            type:   'salary_paid',
            title:  'Salary Processed & Paid 💰',
            body:   "Your salary for {$monthName} {$record->year} ({$periodLabel}) has been processed and transferred to your bank account. Please check your account within 1–3 business days.",
            url:    '/payroll/payslip',
            data:   [
                'year'          => $record->year,
                'month'         => $record->month,
                'period_number' => $periodNum,
                'net_salary'    => $record->net_salary,
            ]
        );

        return response()->json(['message' => 'Record marked as paid.', 'status' => 'paid']);
    }

    // ──────────────────────────────────────────────────────────────
    // PATCH /payroll/export/mark-all-paid  — all confirmed in period
    // ──────────────────────────────────────────────────────────────
    public function markAllPaid(Request $request): \Illuminate\Http\JsonResponse
    {
        $user      = Auth::user();
        $countryId = $user->countryRecord?->id;

        $query = PayrollRecord::with(['user', 'payrollPeriod'])
            ->where('status', 'confirmed')
            ->whereHas('payrollPeriod', fn($q) => $q->where('country_id', $countryId));

        if ($request->filled('period_id')) $query->where('payroll_period_id', $request->period_id);
        if ($request->filled('year'))      $query->where('year',  $request->year);
        if ($request->filled('month'))     $query->where('month', $request->month);
        if ($request->filled('user_id'))   $query->where('user_id', $request->user_id);

        $records = $query->get();
        $updated = $records->count();

        // Update status
        $records->each(fn($r) => $r->update(['status' => 'paid']));

        // Send notification to each employee
        $months = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

        foreach ($records as $record) {
            $monthName  = $months[($record->month ?? now()->month) - 1];
            $periodNum  = $record->payrollPeriod?->period_number ?? 1;
            $periodLabel = "Period {$periodNum}";

            \App\Models\Notification::send(
                userId: $record->user_id,
                type:   'salary_paid',
                title:  'Salary Processed & Paid 💰',
                body:   "Your salary for {$monthName} {$record->year} ({$periodLabel}) has been processed and transferred to your bank account. Please check your account within 1–3 business days.",
                url:    '/payroll/payslip',
                data:   [
                    'year'         => $record->year,
                    'month'        => $record->month,
                    'period_number'=> $periodNum,
                    'net_salary'   => $record->net_salary,
                ]
            );
        }

        return response()->json([
            'message' => "{$updated} records marked as paid.",
            'updated' => $updated,
        ]);
    }


    // ──────────────────────────────────────────────────────────────
    // POST /payroll/export/send-to-bank
    // ──────────────────────────────────────────────────────────────
    public function sendToBank(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'email'     => 'required|email',
            'period_id' => 'nullable|exists:payroll_periods,id',
            'year'      => 'nullable|integer',
            'month'     => 'nullable|integer',
        ]);

        $records     = $this->getRecords($request);
        $rows        = $records->map(fn($r) => $this->formatRow($r))->values()->toArray();
        $periodLabel = $this->buildPeriodLabel($request);
        $currency    = $this->getCurrencyCode($request);
        $total       = array_sum(array_column($rows, 'net_salary'));

        // Company name
        $countryName = strtolower($records->first()?->payrollPeriod?->country?->name ?? '');
        $regionMap   = ['cambodia'=>'Brycen Cambodia','myanmar'=>'Brycen Myanmar','japan'=>'Brycen Japan','vietnam'=>'Brycen Vietnam','korea'=>'Brycen Korea'];
        $companyName = $regionMap[$countryName] ?? 'Brycen ' . ucfirst($countryName ?: 'International');

        // Generate PDF to temp file
        $filename = 'bank_transfer_' . str_replace([' ', '/'], '_', $periodLabel) . '_' . now()->format('Ymd') . '.pdf';
        $tempPath = storage_path('app/exports/' . $filename);

        if (!file_exists(storage_path('app/exports'))) {
            mkdir(storage_path('app/exports'), 0755, true);
        }

        $data = [
            'rows'         => $rows,
            'period_label' => $periodLabel,
            'total'        => $total,
            'currency'     => $currency,
            'generated_at' => now()->format('d M Y H:i'),
            'company_name' => $companyName,
        ];

        Pdf::loadView('payroll.bank_transfer', $data)
            ->setPaper('a4', 'portrait')
            ->save($tempPath);

        // Send mail
        \Illuminate\Support\Facades\Mail::to($request->email)
            ->send(new \App\Mail\BankTransferMail(
                companyName:   $companyName,
                periodLabel:   $periodLabel,
                currency:      $currency,
                totalAmount:   $total,
                employeeCount: count($rows),
                pdfPath:       $tempPath,
                pdfFilename:   $filename,
                generatedAt:   now()->format('d M Y H:i'),
            ));

        // Clean up temp file
        if (file_exists($tempPath)) {
            unlink($tempPath);
        }

        return response()->json([
            'message' => "Bank transfer PDF sent to {$request->email} successfully.",
        ]);
    }

    private function buildPeriodLabel(Request $request): string
    {
        $parts = [];
        if ($request->filled('year') && $request->filled('month')) {
            $parts[] = Carbon::create($request->year, $request->month, 1)->format('M Y');
        }
        if ($request->filled('period_id')) {
            $period = PayrollPeriod::find($request->period_id);
            if ($period) $parts[] = 'Period ' . $period->period_number;
        }
        return implode(' – ', $parts) ?: 'All Periods';
    }

    private function getCurrencyCode(Request $request): string
    {
        $countryId  = Auth::user()->countryRecord?->id;
        $salaryRule = SalaryRule::where('country_id', $countryId)->with('currency')->first();
        return $salaryRule?->currency?->currency_code ?? 'USD';
    }

    private function getPeriodStart(PayrollRecord $r): string
    {
        $period    = $r->payrollPeriod;
        $countryId = $period?->country_id;
        $year      = $r->year ?? now()->year;
        $month     = $r->month ?? now()->month;
        $periodNum = $period?->period_number ?? 1;
        $endDay    = $period?->day ?? 25;

        $salaryRule   = SalaryRule::where('country_id', $countryId)->first();
        $cycle        = $salaryRule?->pay_cycle ?? 'monthly';
        $totalPeriods = match ($cycle) { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };

        if ($periodNum === 1) {
            $prev          = Carbon::create($year, $month, 1)->subMonth();
            $lastPeriodRec = PayrollPeriod::where('country_id', $countryId)->where('period_number', $totalPeriods)->first();
            $prevEndDay    = $lastPeriodRec ? min((int)$lastPeriodRec->day, $prev->daysInMonth) : 25;
            return Carbon::create($prev->year, $prev->month, $prevEndDay + 1)->format('d M Y');
        }

        $prevPeriodRec = PayrollPeriod::where('country_id', $countryId)->where('period_number', $periodNum - 1)->first();
        $prevEndDay    = $prevPeriodRec ? min((int)$prevPeriodRec->day, Carbon::create($year, $month, 1)->daysInMonth) : 10;
        return Carbon::create($year, $month, $prevEndDay + 1)->format('d M Y');
    }

    private function getPeriodEnd(PayrollRecord $r): string
    {
        $period  = $r->payrollPeriod;
        $year    = $r->year ?? now()->year;
        $month   = $r->month ?? now()->month;
        $lastDay = Carbon::create($year, $month, 1)->daysInMonth;
        $endDay  = min($period?->day ?? 25, $lastDay);
        return Carbon::create($year, $month, $endDay)->format('d M Y');
    }
}