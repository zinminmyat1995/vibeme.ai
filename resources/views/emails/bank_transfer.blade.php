<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bank Transfer Request — {{ $companyName }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      color: #1f2937;
      background: #f1f5f9;
  }
  .outer {
      padding: 40px 20px;
  }
  .card {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  }

  /* ── Header ── */
  .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      padding: 32px 36px 28px;
  }
  .header-top {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
  }
  .logo-box {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.18);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
  }
  .company-name {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.3px;
  }
  .doc-label {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.65);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-top: 2px;
  }
  .period-badge {
      display: inline-block;
      background: rgba(255,255,255,0.18);
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 99px;
      border: 1px solid rgba(255,255,255,0.25);
  }

  /* ── Body ── */
  .body {
      padding: 32px 36px;
  }
  .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 10px;
  }
  .intro {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.75;
      margin-bottom: 28px;
  }

  /* ── Summary Table ── */
  .summary-wrap {
      border: 1.5px solid #e0e7ff;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 28px;
  }
  .summary-title {
      background: #eff6ff;
      padding: 10px 18px;
      font-size: 10px;
      font-weight: 800;
      color: #3730a3;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      border-bottom: 1px solid #e0e7ff;
  }
  .summary-body {
      padding: 4px 0;
  }
  .summary-row {
      display: flex;
      align-items: center;
      padding: 10px 18px;
      border-bottom: 1px solid #f1f5f9;
  }
  .summary-row:last-child {
      border-bottom: none;
  }
  .summary-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      width: 175px;
      flex-shrink: 0;
  }
  .summary-value {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
  }
  .total-row {
      background: #1e3a8a;
      padding: 14px 18px;
  }
  .total-row .summary-label {
      color: rgba(255,255,255,0.75);
      font-size: 13px;
      font-weight: 700;
  }
  .total-row .summary-value {
      color: #ffffff;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: -0.3px;
  }

  /* ── Attachment note ── */
  .attachment-box {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 28px;
  }
  .attachment-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 1px;
  }
  .attachment-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.65;
  }
  .attachment-filename {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #2563eb;
      background: #eff6ff;
      padding: 2px 7px;
      border-radius: 5px;
      display: inline-block;
      margin-top: 4px;
      word-break: break-all;
  }

  /* ── Signature ── */
  .signature {
      border-top: 1px solid #f1f5f9;
      padding-top: 22px;
      font-size: 13px;
      color: #4b5563;
      line-height: 1.8;
  }
  .sig-name {
      font-size: 14px;
      font-weight: 800;
      color: #1e3a8a;
      margin-bottom: 2px;
  }
  .sig-sub {
      font-size: 12px;
      color: #6b7280;
  }
  .sig-meta {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
  }

  /* ── Footer ── */
  .footer {
      background: #f8fafc;
      border-top: 1px solid #e5e7eb;
      padding: 16px 36px;
      text-align: center;
  }
  .footer p {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.6;
  }
</style>
</head>
<body>
<div class="outer">
<div class="card">

  {{-- ── HEADER ── --}}
  <div class="header">
      <div class="header-top">
          <div>
              <div class="company-name">{{ $companyName }}</div>
              <div class="doc-label">Salary Bank Transfer Request</div>
          </div>
      </div>
      <div>
          <span class="period-badge">📅 {{ $periodLabel }}</span>
      </div>
  </div>

  {{-- ── BODY ── --}}
  <div class="body">

      <div class="greeting">Dear Finance / Bank Operations Team,</div>
      <div class="intro">
          Please find the attached Bank Transfer List PDF for the payroll period of
          <strong>{{ $periodLabel }}</strong>. Kindly process the salary transfers at your earliest convenience
          and confirm receipt of this request.
      </div>

      {{-- Summary --}}
      <div class="summary-wrap">
          <div class="summary-title">Transfer Summary</div>
          <div class="summary-body">
              <div class="summary-row">
                  <span class="summary-label">Company</span>
                  <span class="summary-value">{{ $companyName }}</span>
              </div>
              <div class="summary-row">
                  <span class="summary-label">Pay Period</span>
                  <span class="summary-value">{{ $periodLabel }}</span>
              </div>
              <div class="summary-row">
                  <span class="summary-label">Number of Employees</span>
                  <span class="summary-value">{{ $employeeCount }} employees</span>
              </div>
              <div class="summary-row">
                  <span class="summary-label">Currency</span>
                  <span class="summary-value">{{ $currency }}</span>
              </div>
              <div class="summary-row">
                  <span class="summary-label">Document Generated</span>
                  <span class="summary-value">{{ $generatedAt }}</span>
              </div>
          </div>
          <div class="summary-row total-row">
              <span class="summary-label">Total Transfer Amount</span>
              <span class="summary-value">{{ $currency }} {{ number_format($totalAmount, 2) }}</span>
          </div>
      </div>

      {{-- Attachment note --}}
      <div class="attachment-box">
          <div class="attachment-icon">📎</div>
          <div class="attachment-text">
              <strong>Attached:</strong> Bank Transfer List PDF<br/>
              Please refer to the attached document for the complete list of
              account holder names, account numbers, and individual transfer amounts.<br/>
              <span class="attachment-filename">{{ $pdfFilename }}</span>
          </div>
      </div>

      {{-- Signature --}}
      <div class="signature">
          Best regards,<br/><br/>
          <div class="sig-name">{{ $companyName }} HR Department</div>
          <div class="sig-sub">Payroll &amp; Compensation Team</div>
          <div class="sig-meta">Generated on {{ $generatedAt }} &nbsp;·&nbsp; {{ $companyName }} HR System</div>
      </div>

  </div>{{-- end body --}}

  {{-- ── FOOTER ── --}}
  <div class="footer">
      <p>
          This email was sent by {{ $companyName }} HR System. Please do not reply to this automated email.<br/>
          © {{ date('Y') }} {{ $companyName }}. All rights reserved.
      </p>
  </div>

</div>{{-- end card --}}
</div>{{-- end outer --}}
</body>
</html>