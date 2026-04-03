<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Invitation</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            background:#f0f0f5;
            font-family:'Segoe UI', -apple-system, Arial, sans-serif;
            color:#1a1a2e;
            -webkit-font-smoothing:antialiased;
        }
        .wrap {
            max-width:600px; margin:48px auto;
            background:#ffffff; border-radius:16px; overflow:hidden;
            box-shadow:0 8px 40px rgba(91,33,182,0.10), 0 2px 8px rgba(0,0,0,0.06);
        }

        /* HEADER */
        .header {
            background:linear-gradient(145deg,#3b0764 0%,#5b21b6 45%,#7c3aed 100%);
            padding:48px 48px 40px; text-align:center; position:relative; overflow:hidden;
        }
        .header::before {
            content:''; position:absolute; top:-60px; right:-60px;
            width:200px; height:200px; background:rgba(255,255,255,0.04); border-radius:50%;
        }
        .header::after {
            content:''; position:absolute; bottom:-80px; left:-40px;
            width:240px; height:240px; background:rgba(255,255,255,0.03); border-radius:50%;
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
            color:#fff; font-size:28px; font-weight:700; letter-spacing:-0.5px;
            line-height:1.2; margin-bottom:8px; position:relative; z-index:1;
        }
        .header-sub { color:rgba(255,255,255,0.65); font-size:14px; position:relative; z-index:1; }

        /* BODY */
        .body { padding:40px 48px; }
        .greeting { font-size:18px; font-weight:600; color:#111827; margin-bottom:12px; letter-spacing:-0.2px; }
        .intro { font-size:14px; color:#6b7280; line-height:1.8; margin-bottom:32px; }
        .intro strong { color:#374151; font-weight:600; }

        /* CARD */
        .card {
            background:#fafafa; border:1px solid #f3f4f6;
            border-radius:14px; padding:28px; margin-bottom:28px;
        }
        .card-title {
            font-size:11px; font-weight:700; color:#7c3aed;
            letter-spacing:0.12em; text-transform:uppercase;
            margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid #f3f4f6;
        }

        /* DETAIL ROWS — clean, no bg/border on icon */
        .detail-row {
            display:flex; align-items:flex-start;
            gap:16px; padding:14px 0;
            border-bottom:1px solid #f3f4f6;
        }
        .detail-row:last-child { border-bottom:none; padding-bottom:0; }

        .detail-icon {
            font-size:18px; flex-shrink:0;
            width:28px; text-align:center;
            margin-top:2px; line-height:1;
        }

        .detail-label {
            font-size:10px; color:#9ca3af; font-weight:700;
            text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px;
        }
        .detail-val { font-size:14px; color:#111827; font-weight:500; line-height:1.5; }
        .detail-link {
            color:#7c3aed; text-decoration:none; font-weight:500;
            font-size:14px; word-break:break-all;
        }

        /* NOTE */
        .note-box {
            background:#fffbeb; border:1px solid #fde68a;
            border-left:4px solid #f59e0b;
            border-radius:0 10px 10px 0;
            padding:16px 20px; margin-bottom:28px;
        }
        .note-label {
            font-size:10px; font-weight:700; color:#d97706;
            text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px;
        }
        .note-box p { font-size:13px; color:#92400e; line-height:1.75; }

        /* REFERENCE */
        .ref-wrap { text-align:center; margin-bottom:32px; }
        .ref-label {
            font-size:11px; color:#9ca3af; text-transform:uppercase;
            letter-spacing:0.08em; margin-bottom:10px;
        }
        .ref-code {
            display:inline-block;
            background:linear-gradient(135deg,#f5f3ff,#ede9fe);
            border:1px solid #ddd6fe; color:#5b21b6;
            padding:12px 32px; border-radius:10px;
            font-size:18px; font-weight:700; letter-spacing:0.12em;
            font-family:'Courier New',monospace;
        }

        /* CLOSING */
        .closing {
            font-size:13px; color:#6b7280; line-height:1.8;
            padding-top:24px; border-top:1px solid #f3f4f6;
        }
        .closing strong { color:#374151; }

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

    <div class="header">
        <div class="header-badge">Interview Invitation</div>
        <span class="header-icon">🗓️</span>
        <h1>You're Invited to Interview</h1>
        <p class="header-sub">{{ $interview->application->jobPosting->office->company_name }}</p>
    </div>

    <div class="body">

        <p class="greeting">Hello, {{ $interview->application->name }} 👋</p>

        <p class="intro">
            Thank you for applying for the
            <strong>{{ $interview->application->jobPosting->title }}</strong> position.
            After reviewing your profile, we are pleased to invite you for an interview.
            Please review the details below and make sure you're available at the scheduled time.
        </p>

        <div class="card">
            <div class="card-title">Interview Details</div>

            <div class="detail-row">
                <div class="detail-icon">🗓️</div>
                <div>
                    <div class="detail-label">Date &amp; Time</div>
                    <div class="detail-val">
                        {{ $interview->scheduled_at->format('l, d F Y') }}
                        &nbsp;&middot;&nbsp;
                        {{ $interview->scheduled_at->format('h:i A') }}
                    </div>
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-icon">💻</div>
                <div>
                    <div class="detail-label">Interview Format</div>
                    <div class="detail-val">
                        {{ $interview->type === 'online' ? 'Online Interview' : 'In-Person Interview' }}
                        @if($interview->platform && $interview->platform !== 'physical')
                            &nbsp;&mdash;&nbsp;{{ ['zoom'=>'Zoom','google_meet'=>'Google Meet','teams'=>'Microsoft Teams','other'=>'Other'][$interview->platform] ?? $interview->platform }}
                        @endif
                    </div>
                </div>
            </div>

            @if($interview->meeting_link)
            <div class="detail-row">
                <div class="detail-icon">🔗</div>
                <div>
                    <div class="detail-label">Meeting Link</div>
                    <a href="{{ $interview->meeting_link }}" class="detail-link">{{ $interview->meeting_link }}</a>
                </div>
            </div>
            @endif

            @if($interview->location)
            <div class="detail-row">
                <div class="detail-icon">📍</div>
                <div>
                    <div class="detail-label">Location</div>
                    <div class="detail-val">{{ $interview->location }}</div>
                </div>
            </div>
            @endif

            @if($interview->interviewer_name)
            <div class="detail-row">
                <div class="detail-icon">👤</div>
                <div>
                    <div class="detail-label">You'll Be Speaking With</div>
                    <div class="detail-val">{{ $interview->interviewer_name }}</div>
                </div>
            </div>
            @endif

        </div>

        @if($interview->note_to_candidate)
        <div class="note-box">
            <div class="note-label">Note from Our Team</div>
            <p>{{ $interview->note_to_candidate }}</p>
        </div>
        @endif

        <div class="ref-wrap">
            <div class="ref-label">Your Application Reference</div>
            <div class="ref-code">{{ $interview->application->reference_code }}</div>
        </div>

        <p class="closing">
            If you have any questions or need to reschedule, please reply to this email or contact us at
            <strong>{{ $interview->application->jobPosting->office->email }}</strong>.
            We look forward to speaking with you. Best of luck! 🌟
        </p>
    </div>

    <div class="footer">
        <div class="footer-company">{{ $interview->application->jobPosting->office->company_name }}</div>
        <div class="footer-email">{{ $interview->application->jobPosting->office->email }}</div>
        <div class="footer-note">
            This email was sent regarding your job application.<br>
            Reference: {{ $interview->application->reference_code }}
        </div>
    </div>

</div>
</body>
</html>