import { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';

const LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzk5IiBoZWlnaHQ9IjM5MyIgdmlld0JveD0iMCAwIDM5OSAzOTMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgo8cmVjdCB3aWR0aD0iMzk5IiBoZWlnaHQ9IjM5MyIgZmlsbD0idXJsKCNwYXR0ZXJuMF8xNl8yKSIvPgo8ZGVmcz4KPHBhdHRlcm4gaWQ9InBhdHRlcm4wXzE2XzIiIHBhdHRlcm5Db250ZW50VW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIj4KPHVzZSB4bGluazpocmVmPSIjaW1hZ2UwXzE2XzIiIHRyYW5zZm9ybT0ic2NhbGUoMC4wMDI1MDYyNyAwLjAwMjU0NDUzKSIvPgo8L3BhdHRlcm4+CjxpbWFnZSBpZD0iaW1hZ2UwXzE2XzIiIHdpZHRoPSIzOTkiIGhlaWdodD0iMzkzIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bGluazpocmVmPSJkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQWI4QUFBR0pDQVlBQUFCeXc3LzZBQUFBQVhOU1IwSUFyczRjNlFBQUFBbHdTRmx6QUFBQW5nQUFBSjRCdThBQ1ZRQUFBQUEiLz4KPC9kZWZzPgo8L3N2Zz4K";

const SLIDES_BG = [
    { icon: "🔐", headline: "Secure by Design", sub: "Your data is protected with enterprise-grade security." },
    { icon: "🧠", headline: "Intelligent at Its Core", sub: "AI-powered analysis and proposal generation." },
    { icon: "⚡", headline: "Work Without Friction", sub: "Smart mail, AI chat — built for every level." },
    { icon: "🌐", headline: "Speak Every Language", sub: "Break barriers instantly with real-time translation." },
];

export default function ResetPassword({ token, email }) {
    const { props } = usePage();
    const serverErrors = props.errors || {};

    const { data, setData, post, processing } = useForm({
        token: token || '',
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const [clientErrors, setClientErrors] = useState({});
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [slide, setSlide] = useState(0);
    const [fading, setFading] = useState(false);
    const [strength, setStrength] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setFading(true);
            setTimeout(() => { setSlide(s => (s + 1) % SLIDES_BG.length); setFading(false); }, 400);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    // Password strength calculator
    useEffect(() => {
        const p = data.password;
        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        setStrength(s);
    }, [data.password]);

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

    const validate = () => {
        const errs = {};
        if (!data.password) errs.password = 'Password is required.';
        else if (data.password.length < 8) errs.password = 'Password must be at least 8 characters.';
        if (!data.password_confirmation) errs.password_confirmation = 'Please confirm your password.';
        else if (data.password !== data.password_confirmation) errs.password_confirmation = 'Passwords do not match.';
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        post('/reset-password');
    };

    return (
        <div style={S.page}>
            <div style={S.orb1} />
            <div style={S.orb2} />
            <div style={S.orb3} />
            <div style={S.gridOverlay} />

            <div style={S.card}>
                {/* LEFT PANEL */}
                <div style={S.leftPanel}>
                    <div style={S.leftInner}>
                        <div style={S.badge}>
                            <span style={S.badgeDot} />
                            <span style={S.badgeText}>Secure Password Reset</span>
                        </div>
                        <div style={S.illustWrap}>
                            <img src="/images/login-illustration.svg" alt="" style={S.illus} />
                        </div>
                        <div style={{ ...S.slideText, opacity: fading ? 0 : 1, transform: fading ? 'translateY(8px)' : 'translateY(0)' }}>
                            <span style={S.slideIcon}>{SLIDES_BG[slide].icon}</span>
                            <p style={S.leftTitle}>{SLIDES_BG[slide].headline}</p>
                            <p style={S.leftSub}>{SLIDES_BG[slide].sub}</p>
                        </div>
                        <div style={S.dots}>
                            {SLIDES_BG.map((_, i) => (
                                <span key={i} style={i === slide ? { ...S.dot, ...S.dotActive } : S.dot} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div style={S.rightPanel}>
                    <div style={S.formWrap}>
                        <div style={S.logoArea}>
                            <img src={LOGO} alt="VibeMe.AI" style={S.logoImg} />
                        </div>

                        <div style={S.lockIconWrap}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="#7eb8f5" strokeWidth="1.4" strokeLinejoin="round"/>
                                <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>

                        <h2 style={S.heading}>Create new password</h2>
                        <p style={S.subHeading}>
                            Resetting for <strong style={{ color: '#3b9ae0' }}>{email}</strong>
                        </p>

                        {(serverErrors.token || serverErrors.email) && (
                            <div style={S.alertBox}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.5"/>
                                    <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span>{serverErrors.token || serverErrors.email}</span>
                            </div>
                        )}

                        <form onSubmit={submit} style={S.form}>
                            {/* New Password */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>New Password</label>
                                <div style={S.inputWrap}>
                                    <svg style={S.fieldIcon} viewBox="0 0 20 20" fill="none">
                                        <rect x="5" y="9" width="10" height="8" rx="2" stroke="#7eb8f5" strokeWidth="1.4"/>
                                        <path d="M7 9V7a3 3 0 0 1 6 0v2" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                    </svg>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => { setData('password', e.target.value); setClientErrors(p => ({ ...p, password: '' })); }}
                                        placeholder="Min. 8 characters"
                                        style={S.input}
                                        onFocus={e => e.target.style.borderColor = 'rgba(59,154,224,0.7)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setShowPass(p => !p)} style={S.eyeBtn}>
                                        {showPass ? (
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                                <path d="M3 3l14 14M8.5 8.5A2.5 2.5 0 0 0 12.5 12.5" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                                <path d="M6.3 5.3C4.1 6.6 2.5 8.6 2 10c1.2 3.4 4.7 6 8 6a9 9 0 0 0 3.7-.8M10 4c3.3 0 6.8 2.6 8 6-.4 1-1 2-1.9 2.9" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                                <ellipse cx="10" cy="10" rx="8" ry="4.5" stroke="#7eb8f5" strokeWidth="1.4"/>
                                                <circle cx="10" cy="10" r="2.5" stroke="#7eb8f5" strokeWidth="1.4"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {data.password.length > 0 && (
                                    <div style={S.strengthWrap}>
                                        <div style={S.strengthBarWrap}>
                                            {[1, 2, 3, 4].map(n => (
                                                <div key={n} style={{
                                                    ...S.strengthBar,
                                                    background: n <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.08)',
                                                    transition: 'background 0.3s ease',
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ ...S.strengthLabel, color: strengthColor[strength] }}>
                                            {strengthLabel[strength]}
                                        </span>
                                    </div>
                                )}

                                {(clientErrors.password || serverErrors.password) && (
                                    <p style={S.errMsg}>{clientErrors.password || serverErrors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div style={S.fieldGroup}>
                                <label style={S.label}>Confirm Password</label>
                                <div style={S.inputWrap}>
                                    <svg style={S.fieldIcon} viewBox="0 0 20 20" fill="none">
                                        <rect x="5" y="9" width="10" height="8" rx="2" stroke="#7eb8f5" strokeWidth="1.4"/>
                                        <path d="M7 9V7a3 3 0 0 1 6 0v2" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                    </svg>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={e => { setData('password_confirmation', e.target.value); setClientErrors(p => ({ ...p, password_confirmation: '' })); }}
                                        placeholder="Repeat password"
                                        style={{
                                            ...S.input,
                                            borderColor: data.password_confirmation && data.password === data.password_confirmation
                                                ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(59,154,224,0.7)'}
                                        onBlur={e => {
                                            if (data.password_confirmation && data.password === data.password_confirmation) {
                                                e.target.style.borderColor = 'rgba(16,185,129,0.5)';
                                            } else {
                                                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                            }
                                        }}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(p => !p)} style={S.eyeBtn}>
                                        {showConfirm ? (
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                                <path d="M3 3l14 14M8.5 8.5A2.5 2.5 0 0 0 12.5 12.5" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                                <path d="M6.3 5.3C4.1 6.6 2.5 8.6 2 10c1.2 3.4 4.7 6 8 6a9 9 0 0 0 3.7-.8M10 4c3.3 0 6.8 2.6 8 6-.4 1-1 2-1.9 2.9" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                                <ellipse cx="10" cy="10" rx="8" ry="4.5" stroke="#7eb8f5" strokeWidth="1.4"/>
                                                <circle cx="10" cy="10" r="2.5" stroke="#7eb8f5" strokeWidth="1.4"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {data.password_confirmation && data.password === data.password_confirmation && (
                                    <p style={S.matchMsg}>✓ Passwords match</p>
                                )}
                                {(clientErrors.password_confirmation || serverErrors.password_confirmation) && (
                                    <p style={S.errMsg}>{clientErrors.password_confirmation || serverErrors.password_confirmation}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                style={{ ...S.submitBtn, opacity: processing ? 0.6 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}
                            >
                                {processing ? (
                                    <span style={S.loadingRow}>
                                        <svg style={S.spinner} viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                                        </svg>
                                        Resetting...
                                    </span>
                                ) : 'Reset Password'}
                            </button>
                        </form>

                        <a href="/login" style={S.backLink}>← Back to Sign In</a>
                        <p style={S.copyright}>© 2026 VibeMe.AI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    page: { minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Segoe UI', system-ui, sans-serif", position: 'relative', overflow: 'hidden' },
    orb1: { position: 'fixed', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,200,0.18) 0%, transparent 70%)', pointerEvents: 'none' },
    orb2: { position: 'fixed', bottom: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)', pointerEvents: 'none' },
    orb3: { position: 'fixed', top: '40%', left: '50%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' },
    gridOverlay: { position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' },
    card: { position: 'relative', zIndex: 2, width: '100%', maxWidth: '920px', borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(24px)', display: 'flex', minHeight: '580px' },
    leftPanel: { flex: '1.1', background: 'linear-gradient(145deg, #0f1523 0%, #0e1d3a 50%, #091428 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 40px', borderRight: '1px solid rgba(255,255,255,0.06)' },
    leftInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '340px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(37,99,200,0.18)', border: '1px solid rgba(37,99,200,0.35)', borderRadius: '50px', padding: '6px 15px', marginBottom: '20px' },
    badgeDot: { display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#3b9ae0', boxShadow: '0 0 6px rgba(59,154,224,0.8)' },
    badgeText: { fontSize: '11px', color: '#7eb8f5', letterSpacing: '0.08em' },
    illustWrap: { width: '100%', maxWidth: '290px', marginBottom: '20px' },
    illus: { width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(37,99,200,0.3))' },
    slideText: { textAlign: 'center', transition: 'opacity 0.4s ease, transform 0.4s ease', minHeight: '88px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '0 8px' },
    slideIcon: { fontSize: '20px', marginBottom: '2px' },
    leftTitle: { fontSize: '16px', fontWeight: '600', color: '#dde8f5', margin: 0 },
    leftSub: { fontSize: '12.5px', color: 'rgba(180,200,230,0.55)', margin: 0, lineHeight: '1.6', maxWidth: '270px' },
    dots: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '18px' },
    dot: { display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s ease' },
    dotActive: { width: '22px', borderRadius: '4px', background: '#3b9ae0' },
    rightPanel: { flex: '0.9', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 44px' },
    formWrap: { width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    logoArea: { width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '6px' },
    logoImg: { height: '72px', width: 'auto', objectFit: 'contain' },
    lockIconWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(37,99,200,0.15)', border: '1px solid rgba(37,99,200,0.3)', marginBottom: '12px' },
    heading: { fontSize: '22px', fontWeight: '300', color: '#dde8f5', letterSpacing: '-0.5px', textAlign: 'center', margin: '0 0 6px', width: '100%' },
    subHeading: { fontSize: '12.5px', color: 'rgba(180,200,230,0.45)', textAlign: 'center', margin: '0 0 20px', lineHeight: '1.6', width: '100%' },
    alertBox: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', width: '100%', fontSize: '12.5px', color: '#f87171' },
    form: { display: 'flex', flexDirection: 'column', width: '100%' },
    fieldGroup: { display: 'flex', flexDirection: 'column', marginBottom: '14px' },
    label: { fontSize: '11px', color: 'rgba(180,200,230,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '7px', paddingLeft: '4px' },
    inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
    fieldIcon: { position: 'absolute', left: '14px', width: '18px', height: '18px', opacity: 0.6, pointerEvents: 'none' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '13px 18px 13px 44px', fontSize: '14px', color: '#dde8f5', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
    strengthWrap: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingLeft: '4px' },
    strengthBarWrap: { display: 'flex', gap: '4px', flex: 1 },
    strengthBar: { height: '3px', flex: 1, borderRadius: '2px' },
    strengthLabel: { fontSize: '11px', fontWeight: '600', minWidth: '40px', textAlign: 'right' },
    errMsg: { fontSize: '11px', color: '#f87171', margin: '5px 0 0 4px' },
    matchMsg: { fontSize: '11px', color: '#10b981', margin: '5px 0 0 4px' },
    submitBtn: { width: '100%', padding: '14px', border: 'none', borderRadius: '12px', background: 'linear-gradient(90deg, #1560a8, #2b83d4)', color: '#fff', fontSize: '13px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 8px 24px rgba(21,96,168,0.4)', fontFamily: 'inherit', marginTop: '4px' },
    loadingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    spinner: { width: '16px', height: '16px', animation: 'spin 1s linear infinite' },
    backLink: { display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(180,200,230,0.4)', textDecoration: 'none' },
    copyright: { marginTop: '16px', textAlign: 'center', fontSize: '11px', color: 'rgba(180,200,230,0.18)', letterSpacing: '0.15em', width: '100%' },
};