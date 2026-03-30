<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Bank Transfer — {{ $company_name }}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }

body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 10px;
    color: #111827;
    background: #fff;
    width: 210mm;
}

/* ══ HEADER ══════════════════════════════ */
.header {
    padding: 24px 32px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #1e3a5f;
}

.company-block {
    display: flex;
    align-items: center;
    gap: 14px;
}

/* Logo image — square with slight radius */
.logo-img {
    width: 80px;
    height: 65px;
    object-fit: contain;
    border-radius: 8px;
    display: block;
    flex-shrink: 0;
}

/* Fallback if image missing */
.logo-fallback {
    width: 54px;
    height: 54px;
    border-radius: 8px;
    background: #1e3a5f;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 26px;
    font-weight: 900;
    color: #fff;
}

.company-name {
    font-size: 20px;
    font-weight: 900;
    color: #1e3a5f;
    letter-spacing: -0.6px;
    line-height: 0.75;
}

.company-sub {
    font-size: 8px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 1.6px;
    margin-top: 4px;
}

.doc-title-block {
    text-align: right;
}

.doc-title {
    font-size: 16px;
    font-weight: 900;
    color: #1e3a5f;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 1.25;
}

.doc-subtitle {
    font-size: 8.5px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-top: 4px;
}

/* ══ DATE BAR ══════════════════════════════ */
.date-bar {
    background: #1e3a5f;
    padding: 7px 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
}

.date-bar-text {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.5px;
}

/* ══ TABLE ══════════════════════════════ */
.table-wrap {
    padding: 0 32px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

thead tr {
    background: #eef2ff;
    border-top: none;
    border-bottom: 2px solid #1e3a5f;
}

thead th {
    padding: 10px 14px;
    font-size: 7.5px;
    font-weight: 800;
    color: #1e3a5f;
    text-transform: uppercase;
    letter-spacing: 1px;
}

thead th.th-num    { text-align: center; width: 36px; }
thead th.th-name   { text-align: left; }
thead th.th-bank   { text-align: left; }
thead th.th-acc    { text-align: left; }
thead th.th-salary { text-align: right; }

tbody tr {
    border-bottom: 1px solid #e5e7eb;
}

tbody tr:nth-child(even) { background: #f8faff; }
tbody tr:nth-child(odd)  { background: #fff; }

tbody td {
    padding: 13px 14px;
    vertical-align: middle;
}

.td-num {
    text-align: center;
    font-size: 10px;
    color: #9ca3af;
    font-weight: 600;
    width: 36px;
}

.td-name {
    font-size: 12.5px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.2px;
}

.td-bank {
    font-size: 11px;
    color: #374151;
    font-weight: 500;
}

.td-acc {
    font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
    font-size: 12.5px;
    font-weight: 700;
    color: #1e3a5f;
    letter-spacing: 2px;
}

.td-acc-empty {
    font-size: 10px;
    color: #d1d5db;
    font-style: italic;
}

.td-salary {
    text-align: right;
    white-space: nowrap;
}

.salary-cur {
    font-size: 8.5px;
    font-weight: 700;
    color: #6b7280;
    margin-right: 3px;
}

.salary-amt {
    font-size: 13px;
    font-weight: 800;
    color: #1e3a5f;
    letter-spacing: -0.3px;
}

/* Total row */
.total-row td {
    background: #1e3a5f !important;
    padding: 12px 14px;
    border: none !important;
}

.total-label {
    font-size: 9.5px;
    font-weight: 800;
    color: rgba(255,255,255,0.85);
    text-transform: uppercase;
    letter-spacing: 0.6px;
}

.total-amount {
    text-align: right;
    white-space: nowrap;
}

.total-cur {
    font-size: 9px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    margin-right: 4px;
}

.total-amt {
    font-size: 15px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.4px;
}

/* ══ AUTH BLOCK ══════════════════════════════ */
.auth-wrap {
    padding: 22px 32px 28px;
    display: flex;
    justify-content: flex-end;
}

.auth-block {
    text-align: right;
    min-width: 200px;
}

.auth-label {
    font-size: 7.5px;
    font-weight: 800;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 1.2px;
}

.auth-line {
    padding-top: 2px;
}

.auth-name {
    font-size: 11px;
    font-weight: 800;
    color: #1e3a5f;
}

.auth-company {
    font-size: 8.5px;
    color: #6b7280;
    margin-top: 2px;
}

/* ══ DOC FOOTER ══════════════════════════════ */
.doc-footer {
    padding: 8px 32px 14px;
    font-size: 7px;
    color: #9ca3af;
    text-align: center;
    font-style: italic;
}
</style>
</head>
<body>

{{-- ══ HEADER ══ --}}
<div class="header">
    <div class="company-block">
        {{--
            Logo image path: public/images/logo.png
            ထည့်ရမည့်နေရာ: <laravel_root>/public/images/logo.png
        --}}
        @php
            $logoPath = public_path('images/logo.png');
        @endphp
        @if(file_exists($logoPath))
            <img src="{{ $logoPath }}" class="logo-img" alt="Logo" />
        @else
            <div class="logo-fallback">B</div>
        @endif

        <div>
            <div class="company-name">{{ $company_name }}</div>
            <div class="company-sub">VibeMe.AI System</div>
        </div>
    </div>

    <div class="doc-title-block">
        <div class="doc-title">Bank Transfer</div>
        <div class="doc-title" style="font-size:12px; color:#4b6cb7;">Instruction</div>
        <div class="doc-subtitle">Salary Payment Authorization</div>
    </div>
</div>

{{-- ══ DATE BAR — generated date only ══ --}}
<div class="date-bar">
    <div class="date-bar-text">{{ now()->format('d F Y') }}</div>
</div>

{{-- ══ TABLE ══ --}}
<div class="table-wrap">
    <table>
        <thead>
            <tr>
                <th class="th-num">#</th>
                <th class="th-name">Account Holder Name</th>
                <th class="th-bank">Bank Name</th>
                <th class="th-acc">Account Number</th>
                <th class="th-salary">Net Salary</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $i => $row)
            <tr>
                <td class="td-num">{{ $i + 1 }}</td>
                <td class="td-name">{{ $row['account_holder_name'] }}</td>
                <td class="td-bank">{{ $row['bank_name'] !== '-' ? $row['bank_name'] : '—' }}</td>
                <td>
                    @if($row['account_number'] !== '-')
                        <span class="td-acc">{{ $row['account_number'] }}</span>
                    @else
                        <span class="td-acc-empty">not set</span>
                    @endif
                </td>
                <td class="td-salary">
                    <span class="salary-cur">{{ $currency }}</span><span class="salary-amt">{{ number_format($row['net_salary'], 2) }}</span>
                </td>
            </tr>
            @endforeach

            <tr class="total-row">
                <td colspan="4" class="total-label">
                    Total Transfer Amount &mdash; {{ count($rows) }} {{ count($rows) === 1 ? 'Employee' : 'Employees' }}
                </td>
                <td class="total-amount">
                    <span class="total-cur">{{ $currency }}</span><span class="total-amt">{{ number_format($total, 2) }}</span>
                </td>
            </tr>
        </tbody>
    </table>
</div>

{{-- ══ AUTH BLOCK — bottom right, no line above ══ --}}
<div class="auth-wrap">
    <div class="auth-block">
        <div class="auth-label">Authorized by</div>
        <div class="auth-line">
            <div class="auth-name">HR Department</div>
            <div class="auth-company">{{ $company_name }}</div>
        </div>
    </div>
</div>

{{-- ══ DOC FOOTER ══ --}}
<div class="doc-footer">
    Confidential &nbsp;&middot;&nbsp; {{ $company_name }} VibeMe.AI System &nbsp;&middot;&nbsp; {{ $generated_at }}
</div>

</body>
</html>