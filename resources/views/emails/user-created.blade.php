<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Welcome to VibeMe.AI</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:40px 48px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🤖</div>
            <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0;letter-spacing:-0.5px;">VibeMe.AI</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;">HR Management Platform</p>
          </td>
        </tr>

        <!-- Welcome Banner -->
        <tr>
          <td style="background:#faf5ff;padding:28px 48px;text-align:center;border-bottom:1px solid #ede9fe;">
            <div style="font-size:28px;margin-bottom:8px;">🎉</div>
            <h2 style="color:#7c3aed;font-size:20px;font-weight:800;margin:0;">Welcome Aboard!</h2>
            <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">Your account has been successfully created.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 48px;">

            <p style="color:#374151;font-size:15px;margin:0 0 24px;">
              Hi <strong style="color:#111827;">{{ $user->name }}</strong>,
            </p>
            <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">
              An administrator has created your account on <strong>VibeMe.AI</strong>. Below are your login credentials. Please keep them safe and change your password after your first login.
            </p>

            <!-- Credentials Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Email Address</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">{{ $user->email }}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#7c3aed;letter-spacing:2px;font-family:monospace;">{{ $plainPassword }}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Role</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#111827;">{{ $user->role?->display_name ?? 'N/A' }}</p>
                </td>
              </tr>
            </table>

            <!-- User Info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;">Department</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111827;">{{ $user->department ?: '—' }}</p>
                  </div>
                </td>
                <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;">Country</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111827;">
                      @php
                        $flags = ['myanmar'=>'🇲🇲','vietnam'=>'🇻🇳','korea'=>'🇰🇷','cambodia'=>'🇰🇭','japan'=>'🇯🇵'];
                        $flag = $flags[$user->country] ?? '🌏';
                        $name = ucfirst($user->country ?? 'N/A');
                      @endphp
                      {{ $flag }} {{ $name }}
                    </p>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Warning -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:flex-start;gap:10px;">
              <span style="font-size:18px;">⚠️</span>
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                For security, please <strong>change your password</strong> immediately after your first login. Do not share your credentials with anyone.
              </p>
            </div>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="{{ config('app.url') }}/login"
                     style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 40px;border-radius:12px;box-shadow:0 4px 14px rgba(124,58,237,0.35);">
                    🚀 Login to VibeMe.AI
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 48px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              This email was sent by <strong style="color:#7c3aed;">VibeMe.AI</strong> HR Platform.<br/>
              If you did not expect this email, please contact your administrator.
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">© {{ date('Y') }} VibeMe.AI · All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>