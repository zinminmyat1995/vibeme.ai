<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Account Updated — VibeMe.AI</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f766e 0%,#0891b2 100%);padding:40px 48px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🤖</div>
            <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0;letter-spacing:-0.5px;">VibeMe.AI</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;">HR Management Platform</p>
          </td>
        </tr>

        <!-- Update Banner -->
        <tr>
          <td style="background:#f0fdfa;padding:28px 48px;text-align:center;border-bottom:1px solid #99f6e4;">
            <div style="font-size:28px;margin-bottom:8px;">✏️</div>
            <h2 style="color:#0f766e;font-size:20px;font-weight:800;margin:0;">Account Updated</h2>
            <p style="color:#6b7280;font-size:14px;margin:8px 0 0;">Your profile information has been updated by an administrator.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 48px;">

            <p style="color:#374151;font-size:15px;margin:0 0 24px;">
              Hi <strong style="color:#111827;">{{ $user->name }}</strong>,
            </p>
            <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">
              Your account on <strong>VibeMe.AI</strong> has been updated. Here is a summary of your current profile information.
            </p>

            <!-- Profile Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Full Name</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111827;">{{ $user->name }}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Email Address</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827;">{{ $user->email }}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Role</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827;">{{ $user->role?->display_name ?? 'N/A' }}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Department · Position</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827;">
                    {{ $user->department ?: '—' }} · {{ $user->position ?: '—' }}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Phone</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827;">{{ $user->phone ?: '—' }}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Country</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827;">
                    @php
                      $flags = ['myanmar'=>'🇲🇲','vietnam'=>'🇻🇳','korea'=>'🇰🇷','cambodia'=>'🇰🇭','japan'=>'🇯🇵'];
                      $flag = $flags[$user->country] ?? '🌏';
                      $name = ucfirst($user->country ?? 'N/A');
                    @endphp
                    {{ $flag }} {{ $name }}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Status</p>
                  <p style="margin:4px 0 0;">
                    @if($user->is_active)
                      <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#065f46;background:#d1fae5;padding:4px 12px;border-radius:99px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:#059669;display:inline-block;"></span> Active
                      </span>
                    @else
                      <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#991b1b;background:#fee2e2;padding:4px 12px;border-radius:99px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Inactive
                      </span>
                    @endif
                  </p>
                </td>
              </tr>
            </table>

            <!-- Notice -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
                ℹ️ If you did not expect this update or believe this is an error, please contact your administrator immediately.
              </p>
            </div>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="{{ config('app.url') }}/login"
                     style="display:inline-block;background:linear-gradient(135deg,#0f766e,#0891b2);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 40px;border-radius:12px;box-shadow:0 4px 14px rgba(8,145,178,0.3);">
                    🔐 Go to Dashboard
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
              This email was sent by <strong style="color:#0f766e;">VibeMe.AI</strong> HR Platform.<br/>
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