<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\EmployeePayrollProfile;
use App\Models\PayrollPeriod;
use App\Models\SalaryRule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

class AttendanceImportController extends Controller
{
    public function downloadTemplate(Request $request)
    {
        $request->validate([
            'year'          => 'required|integer|min:2020|max:2099',
            'month'         => 'required|integer|min:1|max:12',
            'period_number' => 'nullable|integer|min:1|max:3',
        ]);

        $hr        = Auth::user();
        $countryId = $hr->country_id;
        $year      = (int) $request->year;
        $month     = (int) $request->month;
        $periodNum = (int) ($request->period_number ?? 1);

        $salaryRule = SalaryRule::where('country_id', $countryId)->first();
        [$startDate, $endDate] = $this->getPeriodRange($salaryRule, $year, $month, $periodNum);

        $profiles = EmployeePayrollProfile::with('user')
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->get();

        if ($profiles->isEmpty()) {
            return response()->json(['message' => 'No active payroll profiles found.'], 422);
        }

        $userIds  = $profiles->pluck('user_id')->toArray();
        $existing = AttendanceRecord::whereIn('user_id', $userIds)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get()
            ->keyBy(fn($r) => $r->user_id . '_' . Carbon::parse($r->date)->format('Y-m-d'));

        $spreadsheet = $this->buildSpreadsheet(
            $profiles, $year, $month, $periodNum, $startDate, $endDate, $existing
        );

        $filename = "attendance_{$year}_{$month}_P{$periodNum}.xlsx";
        $tempDir  = storage_path('app/temp');
        if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);
        $tempPath = "{$tempDir}/{$filename}";

        (new Xlsx($spreadsheet))->save($tempPath);

        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function buildSpreadsheet(
        $profiles, int $year, int $month, int $periodNum,
        Carbon $startDate, Carbon $endDate, $existing
    ): Spreadsheet {

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $times = [];
        for ($h = 6; $h <= 22; $h++) {
            foreach ([0, 30] as $m) {
                $times[] = sprintf('%02d:%02d', $h, $m);
            }
        }
        $timeFormula = '"' . implode(',', $times) . '"';

        $tabColors = ['4F46E5','7C3AED','0891B2','059669','D97706','DC2626','9333EA'];
        $thin      = ['borderStyle' => Border::BORDER_THIN,  'color' => ['rgb' => 'E5E7EB']];
        $medium    = ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => 'A5B4FC']];
        $allThin   = ['borders' => ['allBorders' => $thin]];

        foreach ($profiles as $idx => $profile) {
            $name = $profile->user?->name ?? "Employee #{$profile->user_id}";
            $ws   = $spreadsheet->createSheet($idx);
            $ws->setTitle(mb_substr($name, 0, 31));
            $ws->getSheetView()->setZoomScale(100);
            $ws->getTabColor()->setRGB($tabColors[$idx % count($tabColors)]);
            $ws->freezePane('A7');

            // Row 1: Title
            $ws->mergeCells('A1:E1');
            $ws->setCellValue('A1', 'ATTENDANCE RECORD  -  ' . strtoupper($name));
            $ws->getStyle('A1')->applyFromArray([
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 13, 'name' => 'Arial'],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '4F46E5']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $ws->getRowDimension(1)->setRowHeight(32);

            // Row 2: A=Year B=Month C=Period D+E=DateRange(merged)
            $ws->mergeCells('D2:E2');
            foreach ([
                'A2' => "Year: {$year}",
                'B2' => 'Month: ' . str_pad($month, 2, '0', STR_PAD_LEFT),
                'C2' => "Period: P{$periodNum}",
                'D2' => $startDate->format('d M Y') . '  to  ' . $endDate->format('d M Y'),
            ] as $cell => $val) {
                $ws->setCellValue($cell, $val);
                $ws->getStyle($cell)->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => '3730A3'], 'size' => 9, 'name' => 'Arial'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'EEF2FF']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);
            }
            $ws->getColumnDimension('D')->setWidth(16);
            $ws->getColumnDimension('E')->setWidth(16);
            $ws->getRowDimension(2)->setRowHeight(20);

            // Row 3: Employee ID (full width)
            $ws->mergeCells('A3:E3');
            $ws->setCellValue('A3', "Employee ID: {$profile->user_id}  |  {$name}");
            $ws->getStyle('A3')->applyFromArray([
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 9, 'name' => 'Arial'],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '6D28D9']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $ws->getRowDimension(3)->setRowHeight(16);

            // Row 4: Spacer
            $ws->getStyle('A4:E4')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F8F9FF');
            $ws->getRowDimension(4)->setRowHeight(4);

            // Row 5: Instructions
            $ws->mergeCells('A5:E5');
            $ws->setCellValue('A5', '  Select Check In / Check Out from dropdown OR type manually (HH:MM 24-hour). Weekends are shaded - leave blank if not working.');
            $ws->getStyle('A5')->applyFromArray([
                'font'      => ['italic' => true, 'color' => ['rgb' => '6B7280'], 'size' => 9, 'name' => 'Arial'],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'FFFBEB']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ]);
            $ws->getRowDimension(5)->setRowHeight(20);

            // Row 6: Headers
            foreach ([
                'A' => ['Date',      16, Alignment::HORIZONTAL_CENTER],
                'B' => ['Day',       11, Alignment::HORIZONTAL_CENTER],
                'C' => ['Check In',  14, Alignment::HORIZONTAL_CENTER],
                'D' => ['Check Out', 14, Alignment::HORIZONTAL_CENTER],
                'E' => ['Note',      18, Alignment::HORIZONTAL_LEFT],
            ] as $col => [$label, $width, $ha]) {
                $ws->setCellValue("{$col}6", $label);
                $ws->getStyle("{$col}6")->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10, 'name' => 'Arial'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '7C3AED']],
                    'alignment' => ['horizontal' => $ha, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders'   => ['bottom' => $medium, 'left' => $thin, 'right' => $thin, 'top' => $thin],
                ]);
                $ws->getColumnDimension($col)->setWidth($width);
            }
            $ws->getRowDimension(6)->setRowHeight(26);

            // DataValidation — start from row 7
            $ciSqref = [];
            $coSqref = [];
            $tmp = $startDate->copy();
            $r   = 7;
            while ($tmp <= $endDate) {
                if (!$tmp->isWeekend()) {
                    $ciSqref[] = "C{$r}";
                    $coSqref[] = "D{$r}";
                }
                $tmp->addDay();
                $r++;
            }
            if (!empty($ciSqref)) {
                $dvCi = $ws->getDataValidation(implode(' ', $ciSqref));
                $dvCi->setType(DataValidation::TYPE_LIST)->setFormula1($timeFormula)
                     ->setAllowBlank(true)->setShowDropDown(false)->setShowErrorMessage(false);
                $dvCo = $ws->getDataValidation(implode(' ', $coSqref));
                $dvCo->setType(DataValidation::TYPE_LIST)->setFormula1($timeFormula)
                     ->setAllowBlank(true)->setShowDropDown(false)->setShowErrorMessage(false);
            }

            // Data rows — start from row 7
            $current = $startDate->copy();
            $row     = 7;
            while ($current <= $endDate) {
                $isWe    = $current->isWeekend();
                $dayName = $current->format('l');
                $dateStr = $current->format('Y-m-d');
                $bgDate  = $isWe ? 'E5E7EB' : 'EDE9FE';
                $bgCell  = $isWe ? 'F3F4F6' : ($row % 2 === 0 ? 'FAFAFA' : 'FFFFFF');
                $fgDate  = $isWe ? '9CA3AF' : '4C1D95';
                $fgCell  = $isWe ? '9CA3AF' : '111827';

                $key    = $profile->user_id . '_' . $dateStr;
                $rec    = $existing->get($key);
                $exCi   = $rec ? substr($rec->check_in_time  ?? '', 0, 5) : '';
                $exCo   = $rec ? substr($rec->check_out_time ?? '', 0, 5) : '';
                $exNote = $rec ? ($rec->note ?? '') : '';

                $ws->setCellValue("A{$row}", $dateStr);
                $ws->getStyle("A{$row}")->applyFromArray(array_merge($allThin, [
                    'font'      => ['bold' => !$isWe, 'color' => ['rgb' => $fgDate], 'size' => 10, 'name' => 'Arial'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bgDate]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]));
                $ws->getStyle("A{$row}")->getNumberFormat()->setFormatCode('DD-MMM-YYYY');

                $ws->setCellValue("B{$row}", $dayName);
                $ws->getStyle("B{$row}")->applyFromArray(array_merge($allThin, [
                    'font'      => ['bold' => $isWe, 'italic' => $isWe, 'color' => ['rgb' => $fgCell], 'size' => 9, 'name' => 'Arial'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bgCell]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]));

                if ($exCi) $ws->setCellValue("C{$row}", $exCi);
                $ws->getStyle("C{$row}")->applyFromArray(array_merge($allThin, [
                    'font'      => ['bold' => (bool)$exCi, 'color' => ['rgb' => $exCi ? '059669' : $fgCell], 'size' => 10, 'name' => 'Arial'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $isWe ? $bgCell : 'ECFDF5']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]));

                if ($exCo) $ws->setCellValue("D{$row}", $exCo);
                $ws->getStyle("D{$row}")->applyFromArray(array_merge($allThin, [
                    'font'      => ['bold' => (bool)$exCo, 'color' => ['rgb' => $exCo ? '059669' : $fgCell], 'size' => 10, 'name' => 'Arial'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $isWe ? $bgCell : 'ECFDF5']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]));

                // E: Note — pre-fill if existing
                if ($exNote) $ws->setCellValue("E{$row}", $exNote);
                $ws->getStyle("E{$row}")->applyFromArray(array_merge($allThin, [
                    'font'      => ['color' => ['rgb' => '6B7280'], 'size' => 9, 'name' => 'Arial'],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bgCell]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
                ]));

                $ws->getRowDimension($row)->setRowHeight(20);
                $current->addDay();
                $row++;
            }

            // Summary row
            $lastData = $row - 1;
            $ws->mergeCells("A{$row}:B{$row}");
            $ws->setCellValue("A{$row}", 'Total Filled');
            $ws->getStyle("A{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10, 'name' => 'Arial'],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '4F46E5']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $ws->mergeCells("C{$row}:D{$row}");
            $ws->setCellValue("C{$row}", "=COUNTA(C7:C{$lastData})&\" / \"&(COUNTA(A7:A{$lastData})-COUNTIF(B7:B{$lastData},\"Saturday\")-COUNTIF(B7:B{$lastData},\"Sunday\"))&\" days\"");
            $ws->getStyle("C{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10, 'name' => 'Arial'],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '7C3AED']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $ws->getStyle("E{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
            $ws->getRowDimension($row)->setRowHeight(22);
        }

        $spreadsheet->setActiveSheetIndex(0);
        return $spreadsheet;
    }

    public function import(Request $request)
    {
        $request->validate([
            'file'  => 'required|file|max:10240',
            'year'  => 'required|integer',
            'month' => 'required|integer',
        ]);

        $hr         = Auth::user();
        $countryId  = $hr->country_id;
        $salaryRule = SalaryRule::where('country_id', $countryId)->first();
        $workStart  = substr($salaryRule?->work_start  ?? '08:00:00', 0, 5);
        $workEnd    = substr($salaryRule?->work_end    ?? '17:00:00', 0, 5);
        $lunchStart = substr($salaryRule?->lunch_start ?? '12:00:00', 0, 5);
        $lunchEnd   = substr($salaryRule?->lunch_end   ?? '13:00:00', 0, 5);

        $file    = $request->file('file');
        $saved   = 0;
        $skipped = 0;
        $errors  = [];

        $fh    = fopen($file->getRealPath(), 'rb');
        $magic = fread($fh, 2);
        fclose($fh);

        if ($magic === 'PK') {
            $reader = new \PhpOffice\PhpSpreadsheet\Reader\Xlsx();
            $reader->setReadDataOnly(false);
            try {
                $spreadsheet = $reader->load($file->getRealPath());
            } catch (\Exception $e) {
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            }

            foreach ($spreadsheet->getAllSheets() as $ws) {
                // Scan Row 2 + Row 3 cols 1-5 for "Employee ID: X"
                $employeeId = null;
                foreach ([2, 3] as $scanRow) {
                    for ($col = 1; $col <= 5; $col++) {
                        $val = (string) $ws->getCell([$col, $scanRow])->getValue();
                        if (preg_match('/Employee\s*ID\s*[:\-]?\s*(\d+)/i', $val, $m)) {
                            $employeeId = (int) $m[1];
                            break 2;
                        }
                    }
                }

                if (!$employeeId) {
                    $errors[] = "Sheet '{$ws->getTitle()}': Employee ID not found. Skipped.";
                    continue;
                }

                $user = User::where('id', $employeeId)
                    ->where(function($q) use ($countryId, $hr) {
                        $q->where('country_id', $countryId)
                          ->orWhere('country', $hr->country);
                    })
                    ->first();
                if (!$user) {
                    $errors[] = "Sheet '{$ws->getTitle()}': Employee ID {$employeeId} not found in your country.";
                    continue;
                }

                for ($row = 7; $row <= $ws->getHighestRow(); $row++) {
                    $dateCell = $ws->getCell([1, $row]);
                    $dateRaw  = $dateCell->getValue();
                    if ($dateRaw === null || $dateRaw === '') continue;

                    $dateFmt = trim((string) $dateCell->getFormattedValue());
                    if ($dateFmt === 'Total Filled' || str_starts_with($dateFmt, '#')) continue;

                    try {
                        if ((is_int($dateRaw) || is_float($dateRaw)) && $dateRaw > 1000) {
                            $date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateRaw)->format('Y-m-d');
                        } else {
                            $date = Carbon::parse((string) $dateRaw)->format('Y-m-d');
                        }
                    } catch (\Exception $e) {
                        $errors[] = "Sheet '{$ws->getTitle()}' Row {$row}: Invalid date.";
                        continue;
                    }

                    $checkIn  = $this->readTimeCell($ws->getCell([3, $row]));
                    $checkOut = $this->readTimeCell($ws->getCell([4, $row]));

                    if ($checkIn === '' && $checkOut === '') { $skipped++; continue; }

                    $note = trim((string) ($ws->getCell([5, $row])->getValue() ?? ''));

                    [$wh, $late, $short, $status] = $this->calcAttendance(
                        $checkIn, $checkOut, $workStart, $workEnd, $lunchStart, $lunchEnd
                    );

                    AttendanceRecord::updateOrCreate(
                        ['user_id' => $employeeId, 'date' => $date],
                        ['check_in_time' => $checkIn ?: null, 'check_out_time' => $checkOut ?: null,
                         'work_hours_actual' => $wh, 'short_hours' => $short, 'late_minutes' => $late,
                         'status' => $status, 'note' => $note ?: null, 'created_by' => Auth::id()]
                    );
                    $saved++;
                }
            }
        } else {
            // CSV fallback
            $handle = fopen($file->getRealPath(), 'r');
            $header = null;
            while (($line = fgetcsv($handle)) !== false) {
                if (empty(array_filter($line))) continue;
                if (isset($line[0]) && str_starts_with(trim($line[0]), '#')) continue;
                if ($header === null) {
                    $norm = array_map('strtolower', array_map('trim', $line));
                    if (in_array('employee_id', $norm)) $header = $norm;
                    continue;
                }
                $row        = array_combine(array_slice($header, 0, count($line)), array_slice($line, 0, count($header)));
                $employeeId = trim($row['employee_id'] ?? '');
                $dateStr    = preg_replace('/\s*\(.*\)/', '', trim($row['date'] ?? ''));
                $checkIn    = substr(trim($row['check_in_time']  ?? ''), 0, 5);
                $checkOut   = substr(trim($row['check_out_time'] ?? ''), 0, 5);
                $note       = trim($row['note'] ?? '');
                if ($checkIn === '' && $checkOut === '') { $skipped++; continue; }
                $user = User::where('id', $employeeId)
                    ->where(function($q) use ($countryId, $hr) {
                        $q->where('country_id', $countryId)
                          ->orWhere('country', $hr->country);
                    })
                    ->first();
                if (!$user) { $errors[] = "Employee ID {$employeeId} not found."; continue; }
                try { $date = Carbon::parse($dateStr)->format('Y-m-d'); }
                catch (\Exception $e) { $errors[] = "Invalid date."; continue; }
                [$wh, $late, $short, $status] = $this->calcAttendance($checkIn, $checkOut, $workStart, $workEnd, $lunchStart, $lunchEnd);
                AttendanceRecord::updateOrCreate(
                    ['user_id' => $employeeId, 'date' => $date],
                    ['check_in_time' => $checkIn ?: null, 'check_out_time' => $checkOut ?: null,
                     'work_hours_actual' => $wh, 'short_hours' => $short, 'late_minutes' => $late,
                     'status' => $status, 'note' => $note ?: null, 'created_by' => Auth::id()]
                );
                $saved++;
            }
            fclose($handle);
        }

        return response()->json([
            'message' => "{$saved} attendance records saved successfully.",
            'saved'   => $saved,
            'skipped' => $skipped,
            'errors'  => $errors,
        ]);
    }

    private function readTimeCell(\PhpOffice\PhpSpreadsheet\Cell\Cell $cell): string
    {
        $raw = $cell->getValue();
        if ($raw === null || $raw === '') return '';

        // DateTime object (PhpSpreadsheet returns this for time cells with HH:MM format)
        if ($raw instanceof \DateTimeInterface) {
            return $raw->format('H:i');
        }

        // Float fraction 0.333 = 08:00
        if (is_float($raw) && $raw > 0 && $raw < 1) {
            $totalMin = (int) round($raw * 24 * 60);
            return sprintf('%02d:%02d', intdiv($totalMin, 60), $totalMin % 60);
        }

        // String "08:00" or "08:00:00"
        $str = trim((string) $cell->getFormattedValue());
        if (preg_match('/^(\d{1,2}):(\d{2})/', $str, $m)) {
            return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
        }

        return '';
    }

    public function periodInfo(Request $request)
    {
        $request->validate(['year' => 'required|integer', 'month' => 'required|integer', 'period_number' => 'nullable|integer']);
        $hr         = Auth::user();
        $salaryRule = SalaryRule::where('country_id', $hr->country_id)->first();
        $pNum       = (int) ($request->period_number ?? 1);
        [$s, $e]    = $this->getPeriodRange($salaryRule, (int) $request->year, (int) $request->month, $pNum);
        return response()->json([
            'start_date'   => $s->format('Y-m-d'), 'end_date'     => $e->format('Y-m-d'),
            'start_label'  => $s->format('d M Y'),  'end_label'    => $e->format('d M Y'),
            'total_days'   => $s->diffInDays($e)+1, 'pay_cycle'    => $salaryRule?->pay_cycle ?? 'monthly',
            'period_count' => $this->getPeriodCount($salaryRule),
        ]);
    }

    private function calcAttendance(string $ci, string $co, string $ws, string $we, string $ls, string $le): array
    {
        if ($ci === '' || $co === '') return [0, 0, 0, 'present'];

        $inM  = $this->toMin($ci);
        $outM = $this->toMin($co);
        $wsM  = $this->toMin($ws);
        $weM  = $this->toMin($we);
        $lsM  = $this->toMin($ls);
        $leM  = $this->toMin($le);

        // Lunch deduction — only if employee was actually present during lunch period
        // overlap = actual time worked that falls within lunch window
        $lunchOverlap = max(0, min($outM, $leM) - max($inM, $lsM));

        $grossMinutes = max(0, $outM - $inM);
        $netMinutes   = max(0, $grossMinutes - $lunchOverlap);
        $wh           = round($netMinutes / 60, 2);

        $late  = max(0, $inM - $wsM);
        $short = round(max(0, ($weM - $wsM - ($leM - $lsM) - ($outM - $inM - $lunchOverlap)) / 60), 2);

        return [$wh, $late, $short, $late > 0 ? 'late' : 'present'];
    }

    private function toMin(string $t): int
    {
        if (!str_contains($t, ':')) return 0;
        [$h, $m] = explode(':', $t);
        return (int) $h * 60 + (int) $m;
    }

    private function getPeriodRange(?SalaryRule $rule, int $year, int $month, int $pNum): array
    {
        $cutoff    = $rule?->payroll_cutoff_day ?? 25;
        $lastDay   = Carbon::create($year, $month, 1)->daysInMonth;
        $countryId = $rule?->country_id;

        $thisPeriod = PayrollPeriod::where('country_id', $countryId)->where('period_number', $pNum)->first();
        $endDay     = min($thisPeriod?->day ?? $cutoff, $lastDay);
        $end        = Carbon::create($year, $month, $endDay)->endOfDay();

        if ($pNum === 1) {
            $prev    = Carbon::create($year, $month, 1)->subMonth();
            $prevEnd = min($cutoff, $prev->daysInMonth);
            $start   = Carbon::create($prev->year, $prev->month, $prevEnd + 1)->startOfDay();
        } else {
            $prevPeriod = PayrollPeriod::where('country_id', $countryId)->where('period_number', $pNum - 1)->first();
            $prevEndDay = min($prevPeriod?->day ?? (int) round($cutoff * ($pNum-1) / $this->getPeriodCount($rule)), $lastDay);
            $start      = Carbon::create($year, $month, $prevEndDay + 1)->startOfDay();
        }
        return [$start, $end];
    }

    private function getPeriodCount(?SalaryRule $rule): int
    {
        return match ($rule?->pay_cycle ?? 'monthly') { 'semi_monthly' => 2, 'ten_day' => 3, default => 1 };
    }
}