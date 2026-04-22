// resources/js/Components/SmartMail/MailView.jsx

import { useState } from 'react';

const LANGUAGES = [
    { code: 'en', label: 'English',    flag: '🇬🇧' },
    { code: 'ja', label: 'Japanese',   flag: '🇯🇵' },
    { code: 'my', label: 'Myanmar',    flag: '🇲🇲' },  // Burmese → Myanmar
    { code: 'km', label: 'Khmer',      flag: '🇰🇭' },
    { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
    { code: 'ko', label: 'Korean',     flag: '🇰🇷' },
];

export default function MailView({ mail, hasApi, onReply, onForward, onShowToast, theme, darkMode = false }) {
    const [translating, setTranslating]       = useState(false);
    const [translated, setTranslated]         = useState(null);
    const [showTranslated, setShowTranslated] = useState(false);
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [selectedLang, setSelectedLang]     = useState(null);

    // ── Empty state ────────────────────────────────────────────
    if (!mail) {
        return (
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: theme.panelSolid,
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 28,
                        margin: '0 auto 18px',
                        background: theme.panelSoft,
                        border: `1px solid ${theme.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 34,
                    }}>📬</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>Select a mail to read</div>
                    <div style={{ fontSize: 12, color: theme.textMute, marginTop: 6 }}>Click any mail from the list</div>
                </div>
            </div>
        );
    }

    // ── Translate ──────────────────────────────────────────────
    const handleTranslate = async (lang) => {
        setShowLangPicker(false);
        setSelectedLang(lang);
        setTranslating(true);
        setShowTranslated(false);
        const startTime = Date.now();
        try {
            const res = await fetch(`/smart-mail/${mail.id}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type':     'application/json',
                    'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ language: lang.code }),
            });
            const data = await res.json();
            const elapsed = Date.now() - startTime;

            if (data.success) {
                setTranslated(data.translated);
                setShowTranslated(true);
                if (data.demo) onShowToast('Demo mode — configure API for real translation', 'warning');

                // ── Token console ──────────────────────────
                const usage = data.usage;
                console.group(`🌐 AI Translate → ${lang.label} — SmartMail [mail #${mail.id}]`);
                console.log(`⏱️  Time:    ${elapsed}ms`);
                console.log(`⚡ Cached:  ${data.cached ? '✅ Yes (no API call)' : '❌ No (API used)'}`);
                if (usage) {
                    const inputCost  = (usage.input_tokens  / 1_000_000) * 15;
                    const outputCost = (usage.output_tokens / 1_000_000) * 75;
                    const total      = inputCost + outputCost;
                    console.log(`🔢 Tokens:`);
                    console.log(`   Input:   ${usage.input_tokens}`);
                    console.log(`   Output:  ${usage.output_tokens}`);
                    console.log(`   Total:   ${usage.input_tokens + usage.output_tokens}`);
                    console.log(`💰 Cost:    ~$${total.toFixed(6)} USD`);
                }
                console.groupEnd();
            }
        } catch {
            onShowToast('Translation failed.', 'error');
        }
        setTranslating(false);
    };

    const getInitial  = (name, addr) => (name || addr || '?').charAt(0).toUpperCase();
    const getAvatarBg = (str = '') => {
        const colors = [theme.primary, theme.secondary, theme.success, theme.warning, '#ec4899', '#0891b2'];
        let h = 0;
        for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
        return colors[Math.abs(h) % colors.length];
    };
    const avatarColor = getAvatarBg(mail.from_name || mail.from_address || '');

    // ── Toolbar button helper ──────────────────────────────────
    const ToolBtn = ({ onClick, children, active = false, color = null }) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 12,
                border: `1px solid ${active ? (color || theme.primary) + '40' : theme.border}`,
                background: active
                    ? (color ? `rgba(${color === theme.primary ? '124,58,237' : '5,150,105'},0.12)` : theme.primarySoft)
                    : theme.panelSoft,
                color: active ? (color || theme.primary) : theme.textSoft,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = theme.panelSofter; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => {
                e.currentTarget.style.background = active ? (theme.primarySoft) : theme.panelSoft;
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {children}
        </button>
    );

    return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: theme.panelSolid,
            overflow: 'hidden',
        }}>

            {/* ── Toolbar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                padding: '12px 20px',
                borderBottom: `1px solid ${theme.border}`,
                background: theme.panelSolid,
                flexShrink: 0,
            }}>
                {/* Reply */}
                <ToolBtn onClick={() => onReply(mail)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 17 4 12 9 7"/>
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                    </svg>
                    Reply
                </ToolBtn>

                {/* Forward */}
                <ToolBtn onClick={() => onForward(mail)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 17 20 12 15 7"/>
                        <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
                    </svg>
                    Forward
                </ToolBtn>

                <div style={{ flex: 1 }} />

                {/* Toggle translated / original */}
                {showTranslated && (
                    <ToolBtn
                        onClick={() => setShowTranslated(v => !v)}
                        active={!showTranslated}
                        theme={theme}
                    >
                        {showTranslated ? `Original` : `${selectedLang?.label} Translated`}
                    </ToolBtn>
                )}

                {/* Translate dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowLangPicker(v => !v)}
                        disabled={translating}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 12,
                            border: `1px solid ${showLangPicker ? theme.primary + '50' : theme.border}`,
                            background: showLangPicker ? theme.primarySoft : theme.panelSoft,
                            color: showLangPicker ? theme.primary : theme.textSoft,
                            fontSize: 12, fontWeight: 700,
                            cursor: translating ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        {translating ? (
                            <>
                                <span style={{
                                    width: 12, height: 12,
                                    border: `2px solid ${theme.primarySoft}`,
                                    borderTopColor: theme.primary,
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.7s linear infinite',
                                }} />
                                Translating...
                            </>
                        ) : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="2" y1="12" x2="22" y2="12"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                </svg>
                                Translate
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </>
                        )}
                    </button>

                    {/* Dropdown */}
                    {showLangPicker && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                            background: theme.panelSolid,
                            border: `1px solid ${theme.borderStrong}`,
                            borderRadius: 16,
                            boxShadow: theme.shadow,
                            padding: 6,
                            minWidth: 120,
                            animation: 'slideIn 0.15s ease',
                        }}>
                            {!hasApi && (
                                <div style={{
                                    padding: '7px 10px', fontSize: 10, fontWeight: 700,
                                    color: theme.warning,
                                    background: theme.warningSoft,
                                    borderRadius: 10, marginBottom: 6,
                                    border: `1px solid ${theme.warning}30`,
                                }}>
                                    ⚠ Demo mode — no API key
                                </div>
                            )}
                            {LANGUAGES.map(l => (
                                <button key={l.code} onClick={() => handleTranslate(l)} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 12px', borderRadius: 10,
                                    border: 'none',
                                    background: selectedLang?.code === l.code && showTranslated
                                        ? theme.primarySoft
                                        : 'transparent',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    color: selectedLang?.code === l.code && showTranslated ? theme.primary : theme.textSoft,
                                    transition: 'background 0.12s',
                                    textAlign: 'left',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = selectedLang?.code === l.code && showTranslated
                                            ? theme.primarySoft : 'transparent';
                                    }}
                                >
                                 
                                    <span style={{ flex: 1 }}>{l.label}</span>
                                    
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Download */}
                <button
                    onClick={() => window.location.href = `/smart-mail/${mail.id}/download-pdf`}
                    title="Download"
                    style={{
                        width: 36, height: 36, borderRadius: 12,
                        border: `1px solid ${theme.border}`,
                        background: theme.panelSoft,
                        color: theme.textMute,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = theme.panelSofter; e.currentTarget.style.color = theme.text; }}
                    onMouseLeave={e => { e.currentTarget.style.background = theme.panelSoft; e.currentTarget.style.color = theme.textMute; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none',padding: '24px 28px'}}>

                {/* Subject */}
                <h2 style={{
                    fontSize: 19, fontWeight: 900, color: theme.text,
                    margin: '0 0 18px', lineHeight: 1.3,
                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                }}>
                    {mail.subject || '(No Subject)'}
                    {mail.ai_generated && (
                        <span style={{
                            fontSize: 10, padding: '3px 10px', borderRadius: 99,
                            background: theme.primarySoft, color: theme.primary,
                            fontWeight: 800, border: `1px solid ${theme.primary}22`,
                        }}>✨ AI</span>
                    )}
                </h2>

                {/* Sender card */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginBottom: 20, padding: '14px 16px',
                    background: theme.panelSoft,
                    borderRadius: 16,
                    border: `1px solid ${theme.border}`,
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: avatarColor,
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 800, flexShrink: 0,
                        boxShadow: `0 4px 12px ${avatarColor}40`,
                    }}>
                        {getInitial(mail.from_name, mail.from_address)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>
                            {mail.from_name || mail.from_address}
                        </div>
                        {mail.from_name && (
                            <div style={{ fontSize: 11, color: theme.textMute, marginTop: 1 }}>{mail.from_address}</div>
                        )}
                        <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2 }}>
                            To: {mail.to_addresses?.join(', ')}
                            {mail.cc_addresses?.length > 0 && ` · CC: ${mail.cc_addresses.join(', ')}`}
                        </div>
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMute, flexShrink: 0 }}>{mail.mail_date}</div>
                </div>

                {/* Translation banner */}
                {showTranslated && selectedLang && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px',
                        background: theme.successSoft,
                        borderRadius: 10,
                        border: `1px solid ${theme.success}25`,
                        marginBottom: 14,
                        fontSize: 12, fontWeight: 600,
                        color: theme.success,
                    }}>
                        <span style={{ fontSize: 14 }}>🌐</span>
                        Showing {selectedLang.label} translation
                        <button onClick={() => setShowTranslated(false)} style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            cursor: 'pointer', color: theme.success, fontSize: 14, lineHeight: 1,
                            padding: '0 2px',
                        }}>×</button>
                    </div>
                )}

                {/* Mail body */}
                <div style={{ fontSize: 14, color: theme.textSoft, lineHeight: 1.75 }}>
                    {showTranslated && translated ? (
                        <div style={{ whiteSpace: 'pre-wrap', color: theme.text }}>{translated}</div>
                    ) : mail.body_html ? (
                        <iframe
                            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
                                * { box-sizing: border-box; }
                                body {
                                    font-family: -apple-system, 'Segoe UI', sans-serif;
                                    font-size: 14px;
                                    background: transparent;
                                    margin: 0; padding: 0;
                                    line-height: 1.7;
                                    color: ${darkMode ? '#cbd5e1' : '#374151'};
                                }
                                a { color: ${theme.primary}; }
                                ${darkMode ? `
                                /* Override all hardcoded template colors in dark mode */
                                *[style] { color: inherit !important; }
                                p, div, span, td, li, blockquote {
                                    color: #cbd5e1 !important;
                                }
                                h1, h2, h3, h4, strong, b {
                                    color: #f1f5f9 !important;
                                }
                                /* Colored accent text (purple, green, blue labels) — keep them */
                                [style*="color:#7c3aed"] { color: #a78bfa !important; }
                                [style*="color:#059669"] { color: #34d399 !important; }
                                [style*="color:#2563eb"] { color: #60a5fa !important; }
                                [style*="color:#d97706"] { color: #fbbf24 !important; }
                                [style*="color:#dc2626"] { color: #f87171 !important; }
                                [style*="color:#475569"] { color: #94a3b8 !important; }
                                /* Backgrounds */
                                div[style*="background:#f"], div[style*="background: #f"] {
                                    background: rgba(255,255,255,0.05) !important;
                                    border-color: rgba(148,163,184,0.15) !important;
                                }
                                /* Left border accents — keep color */
                                [style*="border-left:4px"] { border-left-color: currentColor; }
                                ` : ''}
                            </style></head><body>${mail.body_html}</body></html>`}
                            sandbox="allow-same-origin allow-scripts allow-popups"
                            style={{
                                width: '100%', minHeight: 400, border: 'none',
                                borderRadius: 12, background: 'transparent',
                            }}
                            onLoad={e => {
                                const doc = e.target.contentDocument;
                                if (doc) e.target.style.height = doc.body.scrollHeight + 32 + 'px';
                            }}
                        />
                    ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{mail.body_text || '(No content)'}</div>
                    )}
                </div>

                {/* Attachments */}
                {mail.attachments?.length > 0 && (
                    <div style={{ marginTop: 28 }}>
                        <div style={{
                            fontSize: 10, fontWeight: 900,
                            letterSpacing: '0.10em', textTransform: 'uppercase',
                            color: theme.textMute, marginBottom: 10,
                        }}>
                            Attachments ({mail.attachments.length})
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {mail.attachments.map(att => (
                                <div key={att.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 14px',
                                    background: theme.panelSoft,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 14,
                                    transition: 'all 0.14s',
                                    cursor: 'default',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = theme.panelSofter; e.currentTarget.style.borderColor = theme.borderStrong; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = theme.panelSoft; e.currentTarget.style.borderColor = theme.border; }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: theme.primarySoft,
                                        border: `1px solid ${theme.primary}22`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: theme.primary,
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{att.filename}</div>
                                        <div style={{ fontSize: 10, color: theme.textMute, marginTop: 1 }}>{att.file_size}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
    );
}