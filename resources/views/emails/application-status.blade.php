<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Update</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            background:#f0f0f5;
            font-family:'Segoe UI', -apple-system, Arial, sans-serif;
            -webkit-font-smoothing:antialiased;
        }
        .wrap {
            max-width:600px; margin:48px auto;
            background:#fff; border-radius:16px; overflow:hidden;
            box-shadow:0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05);
        }

        /* HEADERS — color per status */
        .header {
            padding:48px 48px 40px; text-align:center;
            position:relative; overflow:hidden;
        }
        .header.reviewing { background:linear-gradient(145deg,#0c4a6e,#0369a1,#0891b2); }
        .header.accepted  { background:linear-gradient(145deg,#052e16,#065f46,#059669); }
        .header.rejected  { background:linear-gradient(145deg,#1f2937,#374151,#6b7280); }

        .header::before {
            content:''; position:absolute; top:-60px; right:-60px;
            width:200px; height:200px; background:rgba(255,255,255,0.04); border-radius:50%;
        }
        .header-badge {
            display:inline-block;
            background:rgba(255,255,255,0.12); color:rgba(255,255,255,0.85);
            font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
            padding:5px 16px; border-radius:100px; margin-bottom:20px;
            border:1px solid rgba(255,255,255,0.15);
        }
        .header-icon { font-size:48px; margin-bottom:16px; display:block; position:relative; z-index:1; }
        .header h1 {
            color:#fff; font-size:26px; font-weight:700;
            letter-spacing:-0.4px; line-height:1.2; margin-bottom:8px;
            position:relative; z-index:1;
        }
        .header-sub { color:rgba(255,255,255,0.65); font-size:14px; position:relative; z-index:1; }

        /* BODY */
        .body { padding:40px 48px; }
        .greeting { font-size:18px; font-weight:600; color:#111827; margin-bottom:14px; }
        .message { font-size:14px; color:#4b5563; line-height:1.85; margin-bottom:32px; }
        .message strong { color:#111827; font-weight:600; }

        /* JOB CARD */
        .job-card {
            background:#f9fafb; border:1px solid #f3f4f6;
            border-radius:12px; padding:20px 24px;
            margin-bottom:28px;
            display:flex; align-items:center; gap:24px;
        }
        .job-icon {
            font-size:32px; flex-shrink:0;
            line-height:1; width:48px; text-align:center;
        }
        .job-title { font-size:16px; font-weight:700; color:#111827; margin-bottom:4px; letter-spacing:-0.2px; }
        .job-meta  { font-size:13px; color:#9ca3af; line-height:1.5; }

        /* NEXT STEPS (accepted only) */
        .steps-box {
            background:#f0fdf4; border:1px solid #bbf7d0;
            border-radius:12px; padding:20px 24px; margin-bottom:28px;
        }
        .steps-label {
            font-size:10px; font-weight:700; color:#059669;
            text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;
        }
        .step-row {
            display:flex; align-items:flex-start; gap:16px; margin-bottom:14px;
        }
        .step-row:last-child { margin-bottom:0; }
        .step-dash {
            color:#059669; font-size:14px; font-weight:700;
            flex-shrink:0; margin-top:0; line-height:1.65;
        }
        .step-text { font-size:13px; color:#166534; line-height:1.65; }

        /* REFERENCE */
        .ref-wrap { text-align:center; margin-bottom:28px; }
        .ref-label {
            font-size:11px; color:#9ca3af; text-transform:uppercase;
            letter-spacing:0.08em; margin-bottom:10px;
        }
        .ref-code {
            display:inline-block;
            background:#f9fafb; border:1px solid #e5e7eb;
            color:#374151; padding:11px 28px; border-radius:10px;
            font-size:16px; font-weight:700; letter-spacing:0.12em;
            font-family:'Courier New',monospace;
        }

        /* TRACK BUTTON — solid color, no gradient (email client compatibility) */
        .track-btn {
            display:block; text-align:center;
            background:#7c3aed;
            color:#ffffff !important;
            text-decoration:none;
            font-size:14px; font-weight:700;
            padding:16px 32px; border-radius:10px;
            margin-bottom:32px;
            letter-spacing:0.02em;
            mso-padding-alt:0;
        }

        /* CLOSING */
        .closing {
            font-size:13px; color:#6b7280; line-height:1.8;
            padding-top:24px; border-top:1px solid #f3f4f6;
        }

        /* FOOTER */
        .footer {
            background:#f9fafb; padding:24px 48px;
            text-align:center; border-top:1px solid #f3f4f6;
        }
        .footer-company { font-size:13px; font-weight:600; color:#374151; margin-bottom:4px; }
        .footer-email   { font-size:12px; color:#9ca3af; margin-bottom:12px; }
        .footer-note    { font-size:11px; color:#d1d5db; line-height:1.6; }
    </style>
</head>
<body>
<div class="wrap">

    {{-- ── HEADER ── --}}
    @if($status === 'reviewing')
    <div class="header reviewing">
        <div class="header-badge">Application Update</div>
        <span class="header-icon">📬</span>
        <h1>Application Received</h1>
        <p class="header-sub">We're currently reviewing your profile</p>
    </div>

    @elseif($status === 'accepted')
    <div class="header accepted">
        <div class="header-badge">Congratulations</div>
        <span class="header-icon">🎉</span>
        <h1>You've Been Selected!</h1>
        <p class="header-sub">Welcome to the next chapter of your career</p>
    </div>

    @elseif($status === 'rejected')
    <div class="header rejected">
        <div class="header-badge">Application Update</div>
        <span class="header-icon">📋</span>
        <h1>Thank You for Applying</h1>
        <p class="header-sub">We truly appreciate your time and interest</p>
    </div>
    @endif

    {{-- ── BODY ── --}}
    <div class="body">

        <p class="greeting">Hello, {{ $application->name }} 👋</p>

        @if($status === 'reviewing')
        <p class="message">
            We've successfully received your application for
            <strong>{{ $application->jobPosting->title }}</strong>
            at <strong>{{ $application->jobPosting->office->company_name }}</strong>.
            Our team is currently going through applications carefully, and we'll be in touch
            with you as soon as we have an update. Thank you for your patience.
        </p>

        @elseif($status === 'accepted')
        <p class="message">
            We are absolutely thrilled to inform you that after a thorough review,
            you have been <strong>selected</strong> for the
            <strong>{{ $application->jobPosting->title }}</strong> position
            at <strong>{{ $application->jobPosting->office->company_name }}</strong>.
            This is a reflection of your outstanding profile and we can't wait to have you on board.
        </p>
        <div class="steps-box">
            <div class="steps-label">What Happens Next</div>
            <div class="step-row">
                <div class="step-dash">—</div>
                <div class="step-text">Our HR team will contact you within 1–2 business days with the official offer details.</div>
            </div>
            <div class="step-row">
                <div class="step-dash">—</div>
                <div class="step-text">You'll receive onboarding information and documentation requirements.</div>
            </div>
            <div class="step-row">
                <div class="step-dash">—</div>
                <div class="step-text">We'll confirm your start date and introduce you to your team. Welcome aboard! 🚀</div>
            </div>
        </div>

        @elseif($status === 'rejected')
        <p class="message">
            After careful consideration, we have decided to move forward with other candidates
            whose qualifications more closely align with our current requirements for
            the <strong>{{ $application->jobPosting->title }}</strong> position
            at <strong>{{ $application->jobPosting->office->company_name }}</strong>.
            This was a very competitive process and we genuinely appreciate the effort
            you put into your application. Please don't be discouraged — we encourage
            you to apply for future openings that match your skills.
        </p>
        @endif

        {{-- Job card --}}
        <div class="job-card">
            <div class="job-icon">💼</div>
            <div>
                <div class="job-title">{{ $application->jobPosting->title }}</div>
                <div class="job-meta">
                    {{ $application->jobPosting->office->company_name }}
                    &nbsp;&middot;&nbsp;
                    {{ $application->jobPosting->office->city }},
                    {{ $application->jobPosting->office->country_name }}
                </div>
            </div>
        </div>

        {{-- Reference --}}
        <div class="ref-wrap">
            <div class="ref-label">Your Application Reference</div>
            <div class="ref-code">{{ $application->reference_code }}</div>
        </div>

        {{-- Track button --}}
        <a href="{{ url('/track/' . $application->reference_code) }}" class="track-btn">
            Track Your Application Status →
        </a>

        <p class="closing">
            @if($status === 'rejected')
                We wish you all the best in your journey ahead and hope our paths will cross again in the future.
            @else
                If you have any questions, feel free to reach out to us at
                <strong>{{ $application->jobPosting->office->email }}</strong>.
                We're happy to help anytime.
            @endif
        </p>
    </div>

    <div class="footer">
        <div class="footer-company">{{ $application->jobPosting->office->company_name }}</div>
        <div class="footer-email">{{ $application->jobPosting->office->email }}</div>
        <div class="footer-note">
            This email was sent regarding your application.<br>
            Reference: {{ $application->reference_code }}
        </div>
    </div>

</div>
</body>
</html>