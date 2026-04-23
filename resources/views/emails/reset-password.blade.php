<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password — VibeMe.AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0d1117;
            padding: 40px 20px;
            min-height: 100vh;
        }
        .wrapper {
            max-width: 560px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 28px 0 20px;
        }
        .main-logo {
            height: 72px;
            width: auto;
            display: inline-block;
        }
        .card {
            background: #161b26;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px;
            overflow: hidden;
        }
        .card-top {
            background: linear-gradient(135deg, #0e1d3a 0%, #091428 100%);
            padding: 36px 40px 28px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .card-top-logo {
            margin-bottom: 20px;
        }
        .card-top-logo img {
            height: 64px;
            width: auto;
        }
        .card-top h1 {
            font-size: 22px;
            font-weight: 600;
            color: #dde8f5;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
        }
        .card-top p {
            font-size: 14px;
            color: rgba(180,200,230,0.5);
            line-height: 1.6;
        }
        .card-body {
            padding: 32px 40px 36px;
        }
        .greeting {
            font-size: 15px;
            color: rgba(180,200,230,0.7);
            margin-bottom: 16px;
            line-height: 1.6;
        }
        .greeting strong {
            color: #dde8f5;
        }
        .desc {
            font-size: 14px;
            color: rgba(180,200,230,0.5);
            line-height: 1.7;
            margin-bottom: 28px;
        }
        .btn-wrap {
            text-align: center;
            margin-bottom: 28px;
        }
        .btn {
            display: inline-block;
            padding: 14px 40px;
            background: linear-gradient(90deg, #1560a8, #2b83d4);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            box-shadow: 0 8px 24px rgba(21,96,168,0.35);
        }
        .divider {
            height: 1px;
            background: rgba(255,255,255,0.06);
            margin: 24px 0;
        }
        .url-label {
            font-size: 12px;
            color: rgba(180,200,230,0.35);
            margin-bottom: 8px;
        }
        .url-box {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 11px;
            color: #3b9ae0;
            word-break: break-all;
            line-height: 1.5;
        }
        .warning {
            background: rgba(245,158,11,0.08);
            border: 1px solid rgba(245,158,11,0.2);
            border-radius: 10px;
            padding: 12px 16px;
            font-size: 12px;
            color: rgba(245,158,11,0.8);
            line-height: 1.6;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            padding: 20px 0 8px;
            font-size: 11px;
            color: rgba(180,200,230,0.18);
            letter-spacing: 0.1em;
        }
    </style>
</head>
<body>
    <div class="wrapper">
    
        <div class="card">
            <div class="card-top">
                <div class="card-top-logo">
                    <img src="{{ $logoUrl }}" alt="VibeMe.AI" />
                </div>
                <h1>Reset Your Password</h1>
                <p>We received a request to reset the password<br>for your VibeMe.AI account.</p>
            </div>

            <div class="card-body">
                <p class="greeting">Hello, <strong>{{ $user->name }}</strong> 👋</p>
                <p class="desc">
                    Click the button below to create a new password for your account.
                    This link is valid for <strong style="color: #dde8f5;">1 minutes</strong> only.
                    If you didn't request this, you can safely ignore this email.
                </p>

                <div class="btn-wrap">
                    <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
                </div>

                <div class="warning">
                    ⚠️ This link will expire in 1 minutes. If you didn't request a password reset,
                    please contact our support team immediately.
                </div>
            </div>
        </div>

        <div class="footer">© {{ date('Y') }} VibeMe.AI — All rights reserved</div>
    </div>
</body>
</html>