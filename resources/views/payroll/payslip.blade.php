<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 11px;
    color: #1f2937;
    background: #fff;
    padding: 36px 40px;
}

/* ────────────────────────────
   HEADER — Logo left, Company right
──────────────────────────────*/
.header {
    display: table;
    width: 100%;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #3b5998;
}
.header-logo {
    display: table-cell;
    width: 80px;
    vertical-align: middle;
}
.logo-placeholder {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #3b5998 0%, #1e3a8a 100%);
    border-radius: 10px;
    display: block;
    text-align: center;
    line-height: 64px;
    font-size: 28px;
    color: #fff;
    font-weight: 900;
    letter-spacing: -2px;
}
.header-title {
    display: table-cell;
    vertical-align: middle;
    text-align: right;
}
.company-name {
    font-size: 22px;
    font-weight: 900;
    color: #1e3a8a;
    letter-spacing: -0.5px;
    margin-bottom: 2px;
}
.doc-title {
    font-size: 15px;
    font-weight: 800;
    color: #3b5998;
    letter-spacing: 2px;
    text-transform: uppercase;
}

/* ────────────────────────────
   EMPLOYEE INFO — clean rows
──────────────────────────────*/
.info-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}
.info-row {
    display: table;
    width: 100%;
    margin-bottom: 5px;
}
.info-label {
    display: table-cell;
    width: 140px;
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    vertical-align: middle;
}
.info-sep {
    display: table-cell;
    width: 20px;
    color: #374151;
    font-weight: 600;
    vertical-align: middle;
}
.info-value {
    display: table-cell;
    font-size: 11px;
    color: #1f2937;
    font-weight: 500;
    vertical-align: middle;
}

/* ────────────────────────────
   ATTENDANCE SUMMARY
──────────────────────────────*/
.att-section {
    margin-bottom: 20px;
}
.att-title {
    font-size: 13px;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 8px;
}
.att-row {
    display: table;
    width: 100%;
    border-collapse: separate;
    border-spacing: 5px 0;
}
.att-cell {
    display: table-cell;
    text-align: center;
    border-radius: 6px;
    padding: 8px 4px;
    background: #f0f4ff;
    border: 1px solid #c7d2fe;
}
.att-num { font-size: 16px; font-weight: 900; color: #1e3a8a; line-height: 1; }
.att-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 3px; color: #6b7280; }

/* ────────────────────────────
   SECTION TABLES
──────────────────────────────*/
.section-title {
    font-size: 13px;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 6px;
    margin-top: 16px;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
}

/* Header row */
.data-table .thead td {
    background: #3b5998;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 14px;
}
.data-table .thead td:last-child {
    text-align: right;
}

/* Data rows */
.data-table .trow td {
    padding: 8px 14px;
    font-size: 11px;
    color: #374151;
    border-bottom: 1px solid #f3f4f6;
    background: #fff;
}
.data-table .trow:nth-child(even) td {
    background: #f8faff;
}
.data-table .trow td:last-child {
    text-align: right;
    font-weight: 600;
    color: #1f2937;
}

/* Total row */
.data-table .ttotal td {
    padding: 9px 14px;
    font-size: 11px;
    font-weight: 800;
    background: #e8edf8;
    border-top: 2px solid #3b5998;
    color: #1e3a8a;
}
.data-table .ttotal td:last-child {
    text-align: right;
}

/* ────────────────────────────
   NET PAY SUMMARY
──────────────────────────────*/
.net-section {
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid #e5e7eb;
}
.net-row {
    display: table;
    width: 100%;
    margin-bottom: 5px;
}
.net-label {
    display: table-cell;
    font-size: 11px;
    font-weight: 800;
    color: #1e3a8a;
    width: 140px;
    vertical-align: middle;
}
.net-sep {
    display: table-cell;
    width: 20px;
    font-weight: 700;
    color: #374151;
    vertical-align: middle;
}
.net-value {
    display: table-cell;
    font-size: 11px;
    font-weight: 700;
    color: #1f2937;
    vertical-align: middle;
}
.net-value.highlight {
    font-size: 13px;
    font-weight: 900;
    color: #1e3a8a;
}

/* ────────────────────────────
   FOOTER
──────────────────────────────*/
.footer-section {
    margin-top: 24px;
    display: table;
    width: 100%;
}
.footer-left {
    display: table-cell;
    vertical-align: bottom;
    width: 50%;
}
.footer-right {
    display: table-cell;
    vertical-align: bottom;
    text-align: right;
    width: 50%;
}
.auth-label {
    font-size: 10px;
    color: #9ca3af;
    margin-bottom: 3px;
}
.auth-name {
    font-size: 11px;
    font-weight: 700;
    color: #1e3a8a;
}
.confidential {
    font-size: 8px;
    color: #9ca3af;
    text-align: center;
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
}
</style>
</head>
<body>

{{-- ── HEADER ── --}}
<div class="header">
    <div class="header-logo">
        <div class="logo-placeholder">V</div>
    </div>
    <div class="header-title">
        <div class="company-name">{{ $company_name }}</div>
        <div class="doc-title">Payroll Slip</div>
    </div>
</div>

{{-- ── EMPLOYEE INFO ── --}}
@php
    $otH    = (float)($overtime_hours ?? 0);
    $otHrs  = (int) floor($otH);
    $otMin  = (int) round(($otH - $otHrs) * 60);
    $otLbl  = $otH > 0
        ? ($otHrs > 0 && $otMin > 0 ? "{$otHrs}h {$otMin}m" : ($otHrs > 0 ? "{$otHrs}h" : "{$otMin}m"))
        : '—';
    $totalLeave = ($leave_days_paid ?? 0) + ($leave_days_unpaid ?? 0);
    $gross  = ($base_salary ?? 0) + ($total_allowances ?? 0) + ($overtime_amount ?? 0) + ($bonus_amount ?? 0);
@endphp
<div class="info-section">
    <div class="info-row">
        <div class="info-label">Employee Name</div>
        <div class="info-sep">:</div>
        <div class="info-value" style="font-weight:700;">{{ $employee?->name ?? '—' }}</div>
    </div>
    @if($employee?->position)
    <div class="info-row">
        <div class="info-label">Position</div>
        <div class="info-sep">:</div>
        <div class="info-value">{{ $employee->position }}</div>
    </div>
    @endif
    @if($employee?->department)
    <div class="info-row">
        <div class="info-label">Department</div>
        <div class="info-sep">:</div>
        <div class="info-value">{{ $employee->department }}</div>
    </div>
    @endif
    <div class="info-row">
        <div class="info-label">Pay Period</div>
        <div class="info-sep">:</div>
        <div class="info-value">{{ $period_start }} – {{ $period_end }}</div>
    </div>
    <div class="info-row">
        <div class="info-label">Pay Date</div>
        <div class="info-sep">:</div>
        <div class="info-value">{{ now()->format('d M Y') }}</div>
    </div>
</div>

{{-- ── ATTENDANCE SUMMARY ── --}}
<div class="att-section">
    <div class="att-title">Attendance Summary</div>
    <div class="att-row">
        <div class="att-cell">
            <div class="att-num">{{ $working_days }}</div>
            <div class="att-lbl">Work Days</div>
        </div>
        <div class="att-cell">
            <div class="att-num">{{ $present_days }}</div>
            <div class="att-lbl">Present</div>
        </div>
        <div class="att-cell">
            <div class="att-num">{{ $absent_days }}</div>
            <div class="att-lbl">Absent</div>
        </div>
        <div class="att-cell">
            <div class="att-num">{{ number_format($totalLeave, 1) }}</div>
            <div class="att-lbl">Leave</div>
        </div>
        <div class="att-cell">
            <div class="att-num">{{ ($late_minutes ?? 0) > 0 ? $late_minutes.'m' : '—' }}</div>
            <div class="att-lbl">Late</div>
        </div>
        <div class="att-cell">
            <div class="att-num">{{ $otLbl }}</div>
            <div class="att-lbl">OT</div>
        </div>
    </div>
</div>

{{-- ── EARNINGS ── --}}
<div class="section-title">Earnings</div>
<table class="data-table">
    <tr class="thead">
        <td>Description</td>
        <td>Amount ({{ $currency }})</td>
    </tr>
    <tr class="trow">
        <td>Base Salary</td>
        <td>{{ number_format($base_salary ?? 0, 2) }}</td>
    </tr>
    @if(($total_allowances ?? 0) > 0)
    <tr class="trow">
        <td>Allowances</td>
        <td>{{ number_format($total_allowances, 2) }}</td>
    </tr>
    @endif
    @if(($overtime_amount ?? 0) > 0)
    <tr class="trow">
        <td>Overtime Pay</td>
        <td>{{ number_format($overtime_amount, 2) }}</td>
    </tr>
    @endif
    @if(($bonus_amount ?? 0) > 0)
    <tr class="trow">
        <td>Bonus</td>
        <td>{{ number_format($bonus_amount, 2) }}</td>
    </tr>
    @endif
    @foreach($bonuses ?? [] as $b)
    <tr class="trow">
        <td>{{ $b->bonusType?->name ?? 'Bonus' }}@if($b->note) ({{ $b->note }})@endif</td>
        <td>{{ number_format((float)$b->amount, 2) }}</td>
    </tr>
    @endforeach
    <tr class="ttotal">
        <td>Total Earnings</td>
        <td>{{ number_format($gross, 2) }}</td>
    </tr>
</table>

{{-- ── DEDUCTIONS ── --}}
<div class="section-title">Deductions</div>
<table class="data-table">
    <tr class="thead">
        <td>Description</td>
        <td>Amount ({{ $currency }})</td>
    </tr>
    @if(($total_deductions ?? 0) > 0)
        @if(($late_deduction ?? 0) > 0)
        <tr class="trow">
            <td>Late Arrival</td>
            <td>{{ number_format($late_deduction, 2) }}</td>
        </tr>
        @endif
        @if(($short_deduction ?? 0) > 0)
        <tr class="trow">
            <td>Insufficient Hours</td>
            <td>{{ number_format($short_deduction, 2) }}</td>
        </tr>
        @endif
        @foreach($deduction_breakdown ?? [] as $d)
        <tr class="trow">
            <td>{{ $d['name'] }} ({{ $d['type']==='percentage' ? $d['rate'].'%' : 'flat' }})</td>
            <td>{{ number_format($d['amount'], 2) }}</td>
        </tr>
        @endforeach
        <tr class="ttotal">
            <td>Total Deductions</td>
            <td>{{ number_format($total_deductions, 2) }}</td>
        </tr>
    @else
        <tr class="trow">
            <td colspan="2" style="text-align:center;color:#9ca3af;font-style:italic;">No deductions this period</td>
        </tr>
    @endif
</table>

{{-- ── NET PAY SUMMARY ── --}}
<div class="net-section">
    <div class="net-row">
        <div class="net-label">Net Pay</div>
        <div class="net-sep">:</div>
        <div class="net-value highlight">{{ $currency }} {{ number_format($net_salary ?? 0, 2) }}</div>
    </div>
    <div class="net-row">
        <div class="net-label">Payment Mode</div>
        <div class="net-sep">:</div>
        <div class="net-value">Bank Transfer</div>
    </div>
    @php
        $profile = \App\Models\EmployeePayrollProfile::where('user_id', $record->user_id)
            ->where('is_active', true)->first();
    @endphp
    @if($profile?->bank_name)
    <div class="net-row">
        <div class="net-label">Bank Name</div>
        <div class="net-sep">:</div>
        <div class="net-value">{{ $profile->bank_name }}</div>
    </div>
    @endif
    @if($profile?->bank_account_number)
    <div class="net-row">
        <div class="net-label">Account Number</div>
        <div class="net-sep">:</div>
        <div class="net-value">{{ $profile->bank_account_number }}</div>
    </div>
    @endif
    @if($profile?->bank_account_holder_name)
    <div class="net-row">
        <div class="net-label">Account Holder</div>
        <div class="net-sep">:</div>
        <div class="net-value">{{ $profile->bank_account_holder_name }}</div>
    </div>
    @endif
</div>

{{-- ── FOOTER / AUTHORIZED ── --}}
<div class="footer-section">
    <div class="footer-left"></div>
    <div class="footer-right">
        <div class="auth-label">Authorized by:</div>
        <div class="auth-name">HR Department</div>
    </div>
</div>

<div class="confidential">
    This payslip is confidential and intended solely for the named employee.
    &nbsp;·&nbsp; Generated by {{ $company_name }} HR System &nbsp;·&nbsp; {{ now()->format('d M Y H:i') }}
</div>

</body>
</html>