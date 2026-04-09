// resources/js/Components/SmartMail/MailSetup.jsx

import { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';

// ── Theme helpers (same as UserRoles) ────────────────────────
function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark'
            || localStorage.getItem('vibeme-theme') === 'dark';
    };
    const [darkMode, setDarkMode] = useState(getDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useState(() => {
        const sync = () => setDarkMode(getDark());
        window.addEventListener('vibeme-theme-change', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('vibeme-theme-change', sync);
            window.removeEventListener('storage', sync);
        };
    });
    return darkMode;
}

function getTheme(darkMode) {
    if (darkMode) {
        return {
            panel: 'linear-gradient(180deg, rgba(10,18,36,0.96) 0%, rgba(9,16,32,0.92) 100%)',
            panelSolid: '#0b1324',
            panelSoft: 'rgba(255,255,255,0.035)',
            panelSofter: 'rgba(255,255,255,0.055)',
            border: 'rgba(148,163,184,0.12)',
            borderStrong: 'rgba(148,163,184,0.2)',
            text: '#f8fafc',
            textSoft: '#cbd5e1',
            textMute: '#8da0b8',
            shadow: '0 28px 80px rgba(0,0,0,0.42)',
            primary: '#7c3aed',
            primaryHover: '#6d28d9',
            primarySoft: 'rgba(124,58,237,0.16)',
            secondary: '#2563eb',
            secondaryHover: '#1d4ed8',
            success: '#10b981',
            successSoft: 'rgba(16,185,129,0.16)',
            warning: '#f59e0b',
            warningSoft: 'rgba(245,158,11,0.16)',
            danger: '#f87171',
            dangerHover: '#ef4444',
            dangerSoft: 'rgba(248,113,113,0.14)',
            inputBg: 'rgba(255,255,255,0.04)',
            inputBorder: 'rgba(148,163,184,0.16)',
            inputBorderError: 'rgba(248,113,113,0.5)',
            inputBgError: 'rgba(127,29,29,0.10)',
        };
    }
    return {
        panel: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,255,0.96) 100%)',
        panelSolid: '#ffffff',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.14)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        shadow: '0 24px 70px rgba(15,23,42,0.10)',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',
        secondary: '#2563eb',
        secondaryHover: '#1d4ed8',
        success: '#059669',
        successSoft: '#d1fae5',
        warning: '#d97706',
        warningSoft: '#fef3c7',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        dangerSoft: '#fee2e2',
        inputBg: '#f8fafc',
        inputBorder: '#e2e8f0',
        inputBorderError: '#fca5a5',
        inputBgError: '#fef9f9',
    };
}

// ── Provider config ───────────────────────────────────────────
const PROVIDERS = {
    gmail: {
        label: 'Gmail', color: '#EA4335',
        darkSoft: 'rgba(234,67,53,0.14)', lightSoft: '#fef2f2',
        smtp_host: 'smtp.gmail.com',  smtp_port: 587, smtp_enc: 'tls',
        imap_host: 'imap.gmail.com',  imap_port: 993,
        help_url:  'https://myaccount.google.com/apppasswords',
        help_text: 'Gmail requires an App Password. Enable 2FA first, then generate one.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <path d="M6 14l18 12L42 14" stroke="#EA4335" strokeWidth="3" strokeLinecap="round"/>
                <rect x="4" y="10" width="40" height="28" rx="4" stroke="#EA4335" strokeWidth="2.5" fill="none"/>
            </svg>
        ),
    },
    outlook: {
        label: 'Outlook', color: '#0078D4',
        darkSoft: 'rgba(0,120,212,0.14)', lightSoft: '#eff6ff',
        smtp_host: 'smtp-mail.outlook.com', smtp_port: 587, smtp_enc: 'tls',
        imap_host: 'outlook.office365.com', imap_port: 993,
        help_url:  'https://account.microsoft.com/security',
        help_text: 'Use your Outlook password or App Password if 2FA is enabled.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="24" height="32" rx="3" fill="#0078D4" opacity="0.9"/>
                <rect x="22" y="14" width="22" height="20" rx="2" stroke="#0078D4" strokeWidth="2.5" fill="none"/>
                <line x1="22" y1="22" x2="44" y2="22" stroke="#0078D4" strokeWidth="2"/>
            </svg>
        ),
    },
    yahoo: {
        label: 'Yahoo', color: '#6001D2',
        darkSoft: 'rgba(96,1,210,0.14)', lightSoft: '#f5f3ff',
        smtp_host: 'smtp.mail.yahoo.com', smtp_port: 587, smtp_enc: 'tls',
        imap_host: 'imap.mail.yahoo.com', imap_port: 993,
        help_url:  'https://login.yahoo.com/account/security',
        help_text: 'Yahoo requires an App Password. Generate one in your account security settings.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <text x="4" y="36" fontSize="32" fontWeight="900" fill="#6001D2">Y!</text>
            </svg>
        ),
    },
    other: {
        label: 'Other', color: '#475569',
        darkSoft: 'rgba(71,85,105,0.14)', lightSoft: '#f1f5f9',
        smtp_host: '', smtp_port: 587, smtp_enc: 'tls',
        imap_host: '', imap_port: 993,
        help_url:  null,
        help_text: 'Enter your mail server details manually.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
        ),
    },
};

// ── Field Error ───────────────────────────────────────────────
function FieldError({ msg, theme }) {
    if (!msg) return null;
    return (
        <p style={{ fontSize: 11, color: theme.danger, marginTop: 5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {msg}
        </p>
    );
}

// ── Main Component ────────────────────────────────────────────
export default function MailSetup({ mailSetting = null, onSuccess = null }) {
    const darkMode = useReactiveTheme();
    const theme    = useMemo(() => getTheme(darkMode), [darkMode]);

    const isEdit = !!mailSetting?.is_verified;
    const [testing, setTesting]       = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showPass, setShowPass]     = useState(false);

    const form = useForm({
        provider:        mailSetting?.provider        || 'gmail',
        mail_name:       mailSetting?.mail_name       || '',
        mail_address:    mailSetting?.mail_address    || '',
        mail_password:   '',
        smtp_host:       mailSetting?.smtp_host       || PROVIDERS.gmail.smtp_host,
        smtp_port:       mailSetting?.smtp_port       || PROVIDERS.gmail.smtp_port,
        smtp_encryption: 'tls',
        imap_host:       mailSetting?.imap_host       || PROVIDERS.gmail.imap_host,
        imap_port:       mailSetting?.imap_port       || PROVIDERS.gmail.imap_port,
    });

    const provider = PROVIDERS[form.data.provider] || PROVIDERS.other;

    const selectProvider = (key) => {
        const p = PROVIDERS[key];
        form.setData({ ...form.data, provider: key, smtp_host: p.smtp_host, smtp_port: p.smtp_port, smtp_encryption: p.smtp_enc, imap_host: p.imap_host, imap_port: p.imap_port });
        setTestResult(null);
    };

    const [testError, setTestError] = useState('');

    const handleTest = async () => {
        setTestError('');
        setTestResult(null);
        form.clearErrors(); 
        // ── Client-side validation ──
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.data.mail_address || !emailRegex.test(form.data.mail_address)) {
            setTestError('Please enter a valid email address (e.g. you@gmail.com)');
            return;
        }
        if (!form.data.mail_password) {
            setTestError('Please enter your App Password before testing.');
            return;
        }

        setTesting(true);
        try {
            const res = await fetch('/smart-mail/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ imap_host: form.data.imap_host, imap_port: form.data.imap_port, mail_address: form.data.mail_address, mail_password: form.data.mail_password }),
            });
            const data = await res.json();
            // Ensure error message always exists
            setTestResult({
                success: !!data.success,
                error: data.error || data.message || 'Connection failed. Check your credentials.',
            });
        } catch {
            setTestResult({ success: false, error: 'Network error. Please try again.' });
        }
        setTesting(false);
    };
    const submit = (e) => {
        e.preventDefault();
        setTestResult(null);
        setTestError('');
        form.clearErrors();
        form.post('/smart-mail/setup', {
            onSuccess: () => {
                // Global toast — UserRoles pattern အတိုင်း
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: {
                        message: isEdit ? 'Mail account updated successfully!' : 'Mail account connected successfully!',
                        type: 'success',
                    }
                }));
                onSuccess?.();  // modal ပိတ် + reload (modal mode မှာ)
            },
            onError: (errors) => {
                // connection error ကို toast မဟုတ်ဘဲ form.errors မှာ ထားမယ်
                // (form.errors.connection box က handle လုပ်မယ်)
            },
        });
    };

    // Input style helper
    const inp = (field) => ({
        width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        border: `1px solid ${form.errors[field] ? theme.inputBorderError : theme.inputBorder}`,
        background: form.errors[field] ? theme.inputBgError : theme.inputBg,
        color: theme.text,
        transition: 'border-color 0.15s, background 0.15s',
    });

    const lbl = { fontSize: 12, fontWeight: 700, color: theme.textSoft, display: 'block', marginBottom: 6 };
    const sectionLabel = { fontSize: 10, fontWeight: 900, letterSpacing: '0.10em', textTransform: 'uppercase', color: theme.textMute, marginBottom: 8 };

    // Standalone page or inside modal?
    const isStandalone = !onSuccess;

    const card = (
        <div style={{
            background: theme.panel,
            border: `1px solid ${theme.borderStrong}`,
            borderRadius: 24,
            boxShadow: theme.shadow,
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '28px 28px 20px',
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', gap: 14,
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 18,
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, boxShadow: `0 8px 24px ${theme.primary}40`, flexShrink: 0,
                }}>📬</div>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.primary, marginBottom: 4 }}>Mail Setup</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>
                        {isEdit ? 'Update Mail Account' : 'Connect Your Email'}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMute, marginTop: 2 }}>
                        Connect your email to send and receive mail directly from VibeMe.AI
                    </div>
                </div>
            </div>

            {/* Provider picker */}
            <div style={{ padding: '24px 28px 0' }}>
                <div style={sectionLabel}>Choose Provider</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                    {Object.entries(PROVIDERS).map(([key, p]) => {
                        const isActive = form.data.provider === key;
                        const soft = darkMode ? p.darkSoft : p.lightSoft;
                        return (
                            <button
                                key={key} type="button"
                                onClick={() => selectProvider(key)}
                                style={{
                                    padding: '12px 8px', borderRadius: 16, textAlign: 'center',
                                    border: `2px solid ${isActive ? p.color : theme.border}`,
                                    background: isActive ? soft : theme.panelSoft,
                                    cursor: 'pointer', transition: 'all 0.16s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = theme.panelSofter; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = theme.panelSoft; }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>{p.icon}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? p.color : theme.textMute }}>
                                    {p.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Help banner */}
                {provider.help_text && (
                    <div style={{
                        display: 'flex', gap: 10, padding: '12px 14px',
                        background: theme.warningSoft,
                        borderRadius: 14,
                        border: `1px solid ${theme.warning}30`,
                        marginBottom: 22,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.warning} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <div style={{ fontSize: 11, color: theme.warning, lineHeight: 1.6, fontWeight: 600 }}>
                            {provider.help_text}
                            {provider.help_url && (
                                <a href={provider.help_url} target="_blank" rel="noreferrer"
                                    style={{ display: 'block', marginTop: 4, color: theme.warning, fontWeight: 800, textDecoration: 'none' }}>
                                    Generate App Password →
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Form */}
            <form onSubmit={submit}>
                <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Name + Email */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={lbl}>Display Name <span style={{ color: theme.danger }}>*</span></label>
                            <input value={form.data.mail_name} onChange={e => form.setData('mail_name', e.target.value)}
                                placeholder="John Doe" style={inp('mail_name')} />
                            <FieldError msg={form.errors.mail_name} theme={theme} />
                        </div>
                        <div>
                            <label style={lbl}>Email Address <span style={{ color: theme.danger }}>*</span></label>
                            <input value={form.data.mail_address} onChange={e => { form.setData('mail_address', e.target.value); setTestError(''); }}
                                placeholder="you@gmail.com" type="email" style={inp('mail_address')} />
                            <FieldError msg={form.errors.mail_address} theme={theme} />
                            {/* Inline test error — email field အောက်မှာ ပြ */}
                            {testError && (
                                <p style={{ fontSize: 11, color: theme.danger, marginTop: 5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    {testError}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={lbl}>
                            App Password <span style={{ color: theme.danger }}>*</span>
                            {isEdit && <span style={{ fontSize: 10, color: theme.textMute, fontWeight: 400, marginLeft: 6 }}>(leave blank to keep current)</span>}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                value={form.data.mail_password}
                                onChange={e => form.setData('mail_password', e.target.value)}
                                type={showPass ? 'text' : 'password'}
                                placeholder="xxxx xxxx xxxx xxxx"
                                style={{ ...inp('mail_password'), paddingRight: 44 }}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: theme.textMute, display: 'flex', alignItems: 'center',
                            }}>
                                {showPass ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                            </button>
                        </div>
                        <FieldError msg={form.errors.mail_password} theme={theme} />
                    </div>

                    {/* Server config — other only */}
                    {form.data.provider === 'other' && (
                        <>
                            <div style={{ height: 1, background: theme.border }} />
                            <div style={sectionLabel}>SMTP (Send)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                                <div>
                                    <label style={lbl}>SMTP Host</label>
                                    <input value={form.data.smtp_host} onChange={e => form.setData('smtp_host', e.target.value)}
                                        placeholder="smtp.example.com" style={inp('smtp_host')} />
                                </div>
                                <div>
                                    <label style={lbl}>Port</label>
                                    <input value={form.data.smtp_port} onChange={e => form.setData('smtp_port', e.target.value)}
                                        type="number" style={inp('smtp_port')} />
                                </div>
                            </div>
                            <div style={sectionLabel}>IMAP (Receive)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                                <div>
                                    <label style={lbl}>IMAP Host</label>
                                    <input value={form.data.imap_host} onChange={e => form.setData('imap_host', e.target.value)}
                                        placeholder="imap.example.com" style={inp('imap_host')} />
                                </div>
                                <div>
                                    <label style={lbl}>Port</label>
                                    <input value={form.data.imap_port} onChange={e => form.setData('imap_port', e.target.value)}
                                        type="number" style={inp('imap_port')} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Server info readonly (non-other) */}
                    {form.data.provider !== 'other' && (
                        <div style={{
                            padding: '12px 14px',
                            background: theme.panelSoft,
                            borderRadius: 12,
                            border: `1px solid ${theme.border}`,
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: theme.textMute, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                Server Configuration
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: theme.textSoft }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    <span>SMTP: <strong style={{ color: theme.text }}>{form.data.smtp_host}:{form.data.smtp_port}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.secondary} strokeWidth="2.5"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                                    <span>IMAP: <strong style={{ color: theme.text }}>{form.data.imap_host}:{form.data.imap_port}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Connection error */}
                    {form.errors.connection && !testResult && (
                        <div style={{
                            padding: '12px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: theme.dangerSoft, border: `1px solid ${theme.danger}30`, color: theme.danger,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            {/* ဒါကို ပြောင်း — circle မဟုတ်ဘဲ X icon သုံး */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            {form.errors.connection}
                        </div>
                    )}

                    {/* Test result — success သို့မဟုတ် real error message ရှိမှပဲ ပြ */}
                    {testResult && (testResult.success || testResult.error) && (
                        <div style={{
                            padding: '12px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                            background: testResult.success ? theme.successSoft : theme.dangerSoft,
                            border: `1px solid ${testResult.success ? theme.success + '30' : theme.danger + '30'}`,
                            color: testResult.success ? theme.success : theme.danger,
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            {testResult.success ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            )}
                            {testResult.success ? 'Connection successful!' : testResult.error}
                        </div>
                    )}

                    {/* Security note */}
                    <div style={{
                        display: 'flex', gap: 10, padding: '12px 14px',
                        background: theme.successSoft,
                        borderRadius: 14,
                        border: `1px solid ${theme.success}30`,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <p style={{ fontSize: 11, color: theme.success, margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                            Your password is encrypted with AES-256 and stored securely. We never share your credentials.
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                        {/* Test */}
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={testing || !form.data.mail_address || !form.data.mail_password}
                            style={{
                                flex: 1, padding: '11px', borderRadius: 14,
                                border: `1px solid ${theme.border}`,
                                background: theme.panelSoft,
                                color: theme.textSoft,
                                fontSize: 13, fontWeight: 700,
                                cursor: (testing || !form.data.mail_address || !form.data.mail_password) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                opacity: (!form.data.mail_address || !form.data.mail_password) ? 0.5 : 1,
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!testing) e.currentTarget.style.background = theme.panelSofter; }}
                            onMouseLeave={e => { if (!testing) e.currentTarget.style.background = theme.panelSoft; }}
                        >
                            {testing ? (
                                <>
                                    <span style={{ width: 14, height: 14, border: `2px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                    </svg>
                                    Test Connection
                                </>
                            )}
                        </button>

                        {/* Save */}
                        <button
                            type="submit"
                            disabled={form.processing}
                            style={{
                                flex: 2, padding: '11px', borderRadius: 14, border: 'none',
                                background: form.processing
                                    ? theme.textMute
                                    : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                color: '#fff', fontSize: 13, fontWeight: 900,
                                cursor: form.processing ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: form.processing ? 'none' : `0 8px 24px ${theme.primary}35`,
                                transition: 'all 0.18s',
                            }}
                            onMouseEnter={e => { if (!form.processing) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {form.processing ? (
                                <>
                                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                                    </svg>
                                    {isEdit ? 'Update Account' : 'Connect & Save'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );

    // Standalone (needsSetup screen) vs inside modal
    if (isStandalone) {
        return (
            <div style={{
                minHeight: '100%',
               
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
            }}>
                <div style={{ width: '100%', maxWidth: 540 }}>
                    {card}
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            {card}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
}