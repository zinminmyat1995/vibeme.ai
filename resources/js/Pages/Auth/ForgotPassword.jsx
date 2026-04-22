import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

const LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzk5IiBoZWlnaHQ9IjM5MyIgdmlld0JveD0iMCAwIDM5OSAzOTMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgo8cmVjdCB3aWR0aD0iMzk5IiBoZWlnaHQ9IjM5MyIgZmlsbD0idXJsKCNwYXR0ZXJuMF8xNl8yKSIvPgo8ZGVmcz4KPHBhdHRlcm4gaWQ9InBhdHRlcm4wXzE2XzIiIHBhdHRlcm5Db250ZW50VW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiB3aWR0aD0iMSIgaGVpZ2h0PSIxIj4KPHVzZSB4bGluazpocmVmPSIjaW1hZ2UwXzE2XzIiIHRyYW5zZm9ybT0ic2NhbGUoMC4wMDI1MDYyNyAwLjAwMjU0NDUzKSIvPgo8L3BhdHRlcm4+CjxpbWFnZSBpZD0iaW1hZ2UwXzE2XzIiIHdpZHRoPSIzOTkiIGhlaWdodD0iMzkzIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bGluazpocmVmPSJkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQWI4QUFBR0pDQVlBQUFCeXc3LzZBQUFBQVhOU1IwSUFyczRjNlFBQUFBbHdTRmx6QUFBQW5nQUFBSjRCdThBQ1ZRQUFBQUEiLz4KPC9kZWZzPgo8L3N2Zz4K";

const SLIDES_BG = [
    { icon: "🧠", headline: "Intelligent at Its Core", sub: "AI-powered analysis and proposal generation." },
    { icon: "🌐", headline: "Speak Every Language", sub: "Break barriers instantly with real-time translation." },
    { icon: "👥", headline: "HR & Recruitment, Simplified", sub: "From hiring pipelines to payroll — all in one." },
    { icon: "⚡", headline: "Work Without Friction", sub: "Smart mail, AI chat — built for every level." },
];

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const [clientError, setClientError] = useState('');
    const [slide, setSlide] = useState(0);
    const [fading, setFading] = useState(false);
    const [sent, setSent] = useState(status === 'sent');

    useEffect(() => {
        const timer = setInterval(() => {
            setFading(true);
            setTimeout(() => { setSlide(s => (s + 1) % SLIDES_BG.length); setFading(false); }, 400);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (status === 'sent') setSent(true);
    }, [status]);

    const submit = (e) => {
        e.preventDefault();
        setClientError('');
        if (!data.email.trim()) { setClientError('Please enter your email address.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { setClientError('Please enter a valid email address.'); return; }
        post('/forgot-password', {
            onSuccess: () => setSent(true),
        });
    };

    return (
        <div style={S.page}>
            {/* Background orbs */}
            <div style={S.orb1} />
            <div style={S.orb2} />
            <div style={S.orb3} />
            <div style={S.gridOverlay} />

            <div style={S.card}>
                {/* LEFT — same as login */}
                <div style={S.leftPanel}>
                    <div style={S.leftInner}>
                        <div style={S.badge}>
                            <span style={S.badgeDot} />
                            <span style={S.badgeText}>AI-Powered Platform</span>
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

                {/* RIGHT — Forgot Password */}
                <div style={S.rightPanel}>
                    <div style={S.formWrap}>

                        {/* Logo */}
                        <div style={S.logoArea}>
                            <img src={LOGO} alt="VibeMe.AI" style={S.logoImg} />
                        </div>

                        {sent ? (
                            /* ── SUCCESS STATE ── */
                            <div style={S.successBox}>
                                <div style={S.successIconWrap}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5"/>
                                        <path d="M7 12.5l3.5 3.5L17 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <h2 style={S.heading}>Check your inbox</h2>
                                <p style={S.successDesc}>
                                    We've sent a password reset link to <br/>
                                    <strong style={{ color: '#3b9ae0' }}>{data.email || 'your email'}</strong>
                                </p>
                                <div style={S.successSteps}>
                                    {[
                                        { n: '1', t: 'Open the email from VibeMe.AI' },
                                        { n: '2', t: 'Click the "Reset Password" button' },
                                        { n: '3', t: 'Create your new password' },
                                    ].map(step => (
                                        <div key={step.n} style={S.stepRow}>
                                            <div style={S.stepNum}>{step.n}</div>
                                            <span style={S.stepText}>{step.t}</span>
                                        </div>
                                    ))}
                                </div>
                                <p style={S.expireNote}>Link expires in <strong style={{ color: '#f59e0b' }}>60 minutes</strong>. Check spam if not received.</p>
                                <button onClick={() => { setSent(false); setData('email', ''); }} style={S.resendBtn}>
                                    Send to a different email
                                </button>
                                <a href="/login" style={S.backLink}>← Back to Sign In</a>
                            </div>
                        ) : (
                            /* ── FORM STATE ── */
                            <>
                                <div style={S.lockIconWrap}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#7eb8f5" strokeWidth="1.4"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                        <circle cx="12" cy="16" r="1.5" fill="#7eb8f5"/>
                                    </svg>
                                </div>
                                <h2 style={S.heading}>Forgot password?</h2>
                                <p style={S.subHeading}>Enter your email and we'll send you<br/>a secure reset link.</p>

                                <form onSubmit={submit} style={S.form}>
                                    <div style={S.fieldGroup}>
                                        <label style={S.label}>Email address</label>
                                        <div style={S.inputWrap}>
                                            <svg style={S.fieldIcon} viewBox="0 0 20 20" fill="none">
                                                <rect x="2" y="4" width="16" height="12" rx="2" stroke="#7eb8f5" strokeWidth="1.4"/>
                                                <path d="M2.5 6.5L10 11l7.5-4.5" stroke="#7eb8f5" strokeWidth="1.4" strokeLinecap="round"/>
                                            </svg>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={e => { setData('email', e.target.value); setClientError(''); }}
                                                placeholder="you@example.com"
                                                style={S.input}
                                                onFocus={e => e.target.style.borderColor = 'rgba(59,154,224,0.7)'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                                autoFocus
                                            />
                                        </div>
                                        {(clientError || errors.email) && (
                                            <p style={S.errMsg}>{clientError || errors.email}</p>
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
                                                Sending...
                                            </span>
                                        ) : 'Send Reset Link'}
                                    </button>
                                </form>

                                <a href="/login" style={S.backLink}>← Back to Sign In</a>
                            </>
                        )}

                        <p style={S.copyright}>© 2026 VibeMe.AI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    page: {
        minHeight: '100vh', background: '#0d1117',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'Segoe UI', system-ui, sans-serif",
        position: 'relative', overflow: 'hidden',
    },
    orb1: { position: 'fixed', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,200,0.18) 0%, transparent 70%)', pointerEvents: 'none' },
    orb2: { position: 'fixed', bottom: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)', pointerEvents: 'none' },
    orb3: { position: 'fixed', top: '40%', left: '50%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' },
    gridOverlay: { position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' },
    card: { position: 'relative', zIndex: 2, width: '100%', maxWidth: '920px', borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(24px)', display: 'flex', minHeight: '580px' },
    leftPanel: { flex: '1.1', background: 'linear-gradient(145deg, #0f1523 0%, #0e1d3a 50%, #091428 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 40px', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.06)' },
    leftInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, width: '100%', maxWidth: '340px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(37,99,200,0.18)', border: '1px solid rgba(37,99,200,0.35)', borderRadius: '50px', padding: '6px 15px', marginBottom: '20px' },
    badgeDot: { display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#3b9ae0', boxShadow: '0 0 6px rgba(59,154,224,0.8)' },
    badgeText: { fontSize: '11px', color: '#7eb8f5', letterSpacing: '0.08em' },
    illustWrap: { width: '100%', maxWidth: '290px', marginBottom: '20px' },
    illus: { width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(37,99,200,0.3))' },
    slideText: { textAlign: 'center', transition: 'opacity 0.4s ease, transform 0.4s ease', minHeight: '88px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '0 8px' },
    slideIcon: { fontSize: '20px', marginBottom: '2px', lineHeight: 1 },
    leftTitle: { fontSize: '16px', fontWeight: '600', color: '#dde8f5', margin: 0 },
    leftSub: { fontSize: '12.5px', color: 'rgba(180,200,230,0.55)', margin: 0, lineHeight: '1.6', maxWidth: '270px' },
    dots: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '18px' },
    dot: { display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s ease' },
    dotActive: { width: '22px', borderRadius: '4px', background: '#3b9ae0' },
    rightPanel: { flex: '0.9', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 44px' },
    formWrap: { width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    logoArea: { width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '6px' },
    logoImg: { height: '80px', width: 'auto', objectFit: 'contain' },
    lockIconWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(37,99,200,0.15)', border: '1px solid rgba(37,99,200,0.3)', marginBottom: '14px' },
    heading: { fontSize: '24px', fontWeight: '300', color: '#dde8f5', letterSpacing: '-0.5px', textAlign: 'center', margin: '0 0 6px', width: '100%' },
    subHeading: { fontSize: '13px', color: 'rgba(180,200,230,0.45)', textAlign: 'center', margin: '0 0 24px', lineHeight: '1.6', width: '100%' },
    form: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' },
    fieldGroup: { display: 'flex', flexDirection: 'column', marginBottom: '16px' },
    label: { fontSize: '11px', color: 'rgba(180,200,230,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '7px', paddingLeft: '4px' },
    inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
    fieldIcon: { position: 'absolute', left: '14px', width: '18px', height: '18px', opacity: 0.6, pointerEvents: 'none' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '13px 18px 13px 44px', fontSize: '14px', color: '#dde8f5', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    errMsg: { fontSize: '11px', color: '#f87171', margin: '5px 0 0 4px' },
    submitBtn: { width: '100%', padding: '14px', border: 'none', borderRadius: '12px', background: 'linear-gradient(90deg, #1560a8, #2b83d4)', color: '#fff', fontSize: '13px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 8px 24px rgba(21,96,168,0.4)', fontFamily: 'inherit' },
    loadingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    spinner: { width: '16px', height: '16px', animation: 'spin 1s linear infinite' },
    backLink: { display: 'block', textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'rgba(180,200,230,0.4)', textDecoration: 'none' },
    copyright: { marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'rgba(180,200,230,0.18)', letterSpacing: '0.15em', width: '100%' },
    // Success state
    successBox: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    successIconWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '14px' },
    successDesc: { fontSize: '13.5px', color: 'rgba(180,200,230,0.55)', textAlign: 'center', lineHeight: '1.7', margin: '0 0 20px' },
    successSteps: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' },
    stepRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    stepNum: { width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(37,99,200,0.2)', border: '1px solid rgba(37,99,200,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#7eb8f5', fontWeight: '600', flexShrink: 0 },
    stepText: { fontSize: '13px', color: 'rgba(180,200,230,0.6)' },
    expireNote: { fontSize: '12px', color: 'rgba(180,200,230,0.35)', textAlign: 'center', marginBottom: '18px', lineHeight: '1.6' },
    resendBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 20px', color: 'rgba(180,200,230,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '4px', width: '100%' },
};