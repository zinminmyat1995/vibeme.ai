// resources/js/Components/SmartMail/MailSetup.jsx

import { useState } from 'react';
import { useForm } from '@inertiajs/react';

const PROVIDERS = {
    gmail: {
        label:     'Gmail',
        icon:      '📧',
        color:     '#EA4335',
        bg:        '#fef2f2',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_enc:  'tls',
        imap_host: 'imap.gmail.com',
        imap_port: 993,
        help_url:  'https://myaccount.google.com/apppasswords',
        help_text: 'Gmail requires an App Password. Enable 2FA first, then generate one.',
    },
    outlook: {
        label:     'Outlook',
        icon:      '💼',
        color:     '#0078D4',
        bg:        '#eff6ff',
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        smtp_enc:  'tls',
        imap_host: 'outlook.office365.com',
        imap_port: 993,
        help_url:  'https://account.microsoft.com/security',
        help_text: 'Use your Outlook password or App Password if 2FA is enabled.',
    },
    yahoo: {
        label:     'Yahoo',
        icon:      '🟣',
        color:     '#6001D2',
        bg:        '#f5f3ff',
        smtp_host: 'smtp.mail.yahoo.com',
        smtp_port: 587,
        smtp_enc:  'tls',
        imap_host: 'imap.mail.yahoo.com',
        imap_port: 993,
        help_url:  'https://login.yahoo.com/account/security',
        help_text: 'Yahoo requires an App Password. Generate one in your account security settings.',
    },
    other: {
        label:     'Other',
        icon:      '⚙️',
        color:     '#374151',
        bg:        '#f9fafb',
        smtp_host: '',
        smtp_port: 587,
        smtp_enc:  'tls',
        imap_host: '',
        imap_port: 993,
        help_url:  null,
        help_text: 'Enter your mail server details manually.',
    },
};

function FieldError({ msg }) {
    if (!msg) return null;
    return <p style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>⚠ {msg}</p>;
}

export default function MailSetup({ mailSetting = null, onSuccess = null }) {
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
        form.setData({
            ...form.data,
            provider:        key,
            smtp_host:       p.smtp_host,
            smtp_port:       p.smtp_port,
            smtp_encryption: p.smtp_enc,
            imap_host:       p.imap_host,
            imap_port:       p.imap_port,
        });
        setTestResult(null);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/smart-mail/test-connection', {
                method:  'POST',
                headers: {
                    'Content-Type':     'application/json',
                    'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    imap_host:     form.data.imap_host,
                    imap_port:     form.data.imap_port,
                    mail_address:  form.data.mail_address,
                    mail_password: form.data.mail_password,
                }),
            });
            const data = await res.json();
            setTestResult(data);
        } catch {
            setTestResult({ success: false, error: 'Network error. Please try again.' });
        }
        setTesting(false);
    };

    const submit = (e) => {
        e.preventDefault();
        form.post('/smart-mail/setup', {
            onSuccess: () => {
                setTestResult(null);
                onSuccess?.(); // modal ပိတ်
            },
        });
    };

    const inp = (field) => ({
        width:'100%', padding:'9px 12px', borderRadius:10, fontSize:13,
        outline:'none', boxSizing:'border-box', fontFamily:'inherit',
        border:`1px solid ${form.errors[field] ? '#fca5a5' : '#e5e7eb'}`,
        background: form.errors[field] ? '#fef9f9' : '#f9fafb',
        color:'#111827',
    });

    const lbl = { fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 };

    return (
        <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f5f3ff 0%,#eff6ff 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div style={{ width:'100%', maxWidth:520 }}>

                {/* Header */}
                <div style={{ textAlign:'center', marginBottom:28 }}>
                    <div style={{ fontSize:52, marginBottom:10 }}>📧</div>
                    <h2 style={{ fontSize:22, fontWeight:900, color:'#111827', margin:0 }}>
                        {isEdit ? 'Update Mail Account' : 'Connect Your Email'}
                    </h2>
                    <p style={{ fontSize:13, color:'#6b7280', marginTop:8 }}>
                        Connect your email to send and receive mail directly from VibeMe.AI
                    </p>
                </div>

                <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 8px 32px rgba(0,0,0,0.08)', overflow:'hidden' }}>

                    {/* Provider Select */}
                    <div style={{ padding:'24px 24px 0' }}>
                        <label style={lbl}>Choose Provider</label>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
                            {Object.entries(PROVIDERS).map(([key, p]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => selectProvider(key)}
                                    style={{
                                        padding:'10px 8px', borderRadius:12, textAlign:'center',
                                        border:`2px solid ${form.data.provider === key ? p.color : '#e5e7eb'}`,
                                        background: form.data.provider === key ? p.bg : '#f9fafb',
                                        cursor:'pointer', transition:'all 0.15s',
                                    }}
                                >
                                    <div style={{ fontSize:20 }}>{p.icon}</div>
                                    <div style={{ fontSize:11, fontWeight:700, color: form.data.provider === key ? p.color : '#374151', marginTop:3 }}>
                                        {p.label}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Help text */}
                        {provider.help_text && (
                            <div style={{ display:'flex', gap:8, padding:'10px 12px', background:'#fef3c7', borderRadius:10, border:'1px solid #fcd34d', marginBottom:20 }}>
                                <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                                <div style={{ fontSize:11, color:'#92400e', lineHeight:1.5 }}>
                                    {provider.help_text}
                                    {provider.help_url && (
                                        <a href={provider.help_url} target="_blank" rel="noreferrer"
                                            style={{ display:'block', marginTop:3, color:'#d97706', fontWeight:700 }}>
                                            Generate App Password →
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={submit}>
                        <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>

                            {/* Display Name + Email */}
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                                <div>
                                    <label style={lbl}>Display Name <span style={{ color:'#ef4444' }}>*</span></label>
                                    <input value={form.data.mail_name} onChange={e => form.setData('mail_name', e.target.value)}
                                        placeholder="John Doe" style={inp('mail_name')} />
                                    <FieldError msg={form.errors.mail_name} />
                                </div>
                                <div>
                                    <label style={lbl}>Email Address <span style={{ color:'#ef4444' }}>*</span></label>
                                    <input value={form.data.mail_address} onChange={e => form.setData('mail_address', e.target.value)}
                                        placeholder="you@gmail.com" type="email" style={inp('mail_address')} />
                                    <FieldError msg={form.errors.mail_address} />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label style={lbl}>
                                    App Password <span style={{ color:'#ef4444' }}>*</span>
                                    {isEdit && <span style={{ fontSize:10, color:'#9ca3af', fontWeight:400, marginLeft:6 }}>(leave blank to keep current)</span>}
                                </label>
                                <div style={{ position:'relative' }}>
                                    <input
                                        value={form.data.mail_password}
                                        onChange={e => form.setData('mail_password', e.target.value)}
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="xxxx xxxx xxxx xxxx"
                                        style={{ ...inp('mail_password'), paddingRight:40 }}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af' }}>
                                        {showPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <FieldError msg={form.errors.mail_password} />
                            </div>

                            {/* Server Config — Other provider ဆိုမှ ပြ */}
                            {form.data.provider === 'other' && (
                                <>
                                    <div style={{ height:1, background:'#f3f4f6' }} />
                                    <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', letterSpacing:'1px' }}>SMTP (SEND)</div>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:10 }}>
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
                                    <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', letterSpacing:'1px' }}>IMAP (RECEIVE)</div>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:10 }}>
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

                            {/* Other provider တွေ SMTP/IMAP info ပြ (readonly) */}
                            {form.data.provider !== 'other' && (
                                <div style={{ padding:'10px 14px', background:'#f9fafb', borderRadius:10, border:'1px solid #e5e7eb' }}>
                                    <div style={{ fontSize:11, color:'#6b7280', display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                                        <span>📤 SMTP: <strong>{form.data.smtp_host}:{form.data.smtp_port}</strong></span>
                                        <span>📥 IMAP: <strong>{form.data.imap_host}:{form.data.imap_port}</strong></span>
                                    </div>
                                </div>
                            )}

                            {/* Connection error */}
                            {form.errors.connection && (
                                <div style={{ padding:'10px 14px', background:'#fef2f2', borderRadius:10, border:'1px solid #fca5a5', fontSize:12, color:'#991b1b' }}>
                                    ❌ {form.errors.connection}
                                </div>
                            )}

                            {/* Test Result */}
                            {testResult && (
                                <div style={{
                                    padding:'10px 14px', borderRadius:10, fontSize:12, fontWeight:600,
                                    background: testResult.success ? '#f0fdf4' : '#fef2f2',
                                    border:     `1px solid ${testResult.success ? '#86efac' : '#fca5a5'}`,
                                    color:      testResult.success ? '#166534' : '#991b1b',
                                }}>
                                    {testResult.success ? '✅ Connection successful!' : `❌ ${testResult.error}`}
                                </div>
                            )}

                            {/* Security note */}
                            <div style={{ display:'flex', gap:8, padding:'10px 12px', background:'#f0fdf4', borderRadius:10, border:'1px solid #86efac' }}>
                                <span style={{ fontSize:16, flexShrink:0 }}>🔒</span>
                                <p style={{ fontSize:11, color:'#166534', margin:0, lineHeight:1.5 }}>
                                    Your password is encrypted with AES-256 and stored securely. We never share your credentials.
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display:'flex', gap:10 }}>
                                <button
                                    type="button"
                                    onClick={handleTest}
                                    disabled={testing || !form.data.mail_address || !form.data.mail_password}
                                    style={{
                                        flex:1, padding:'10px', borderRadius:10,
                                        border:'1px solid #e5e7eb',
                                        background: testing ? '#f9fafb' : '#f9fafb',
                                        color:'#374151', fontSize:13, fontWeight:600,
                                        cursor: testing ? 'not-allowed' : 'pointer',
                                        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                                    }}
                                >
                                    {testing ? (
                                        <>
                                            <span style={{ width:14, height:14, border:'2px solid #e5e7eb', borderTopColor:'#7c3aed', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
                                            Testing...
                                        </>
                                    ) : '🔌 Test Connection'}
                                </button>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    style={{
                                        flex:2, padding:'10px', borderRadius:10, border:'none',
                                        background: form.processing ? '#c4b5fd' : '#7c3aed',
                                        color:'#fff', fontSize:13, fontWeight:700,
                                        cursor: form.processing ? 'not-allowed' : 'pointer',
                                        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                                    }}
                                >
                                    {form.processing ? (
                                        <>
                                            <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
                                            Connecting...
                                        </>
                                    ) : isEdit ? '💾 Update Account' : '🚀 Connect Account'}
                                </button>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}