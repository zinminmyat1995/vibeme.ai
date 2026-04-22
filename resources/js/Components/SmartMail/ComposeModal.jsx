// resources/js/Components/SmartMail/ComposeModal.jsx

import { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

// ── Highlight template vars ───────────────────────────────────
function highlightVars(html) {
    return html.replace(/\{(\w+)\}/g, (match) =>
        `<mark data-var="${match}" style="background:#ede9fe;color:#7c3aed;border-radius:4px;padding:1px 6px;font-weight:700;cursor:pointer;">${match}</mark>`
    );
}

    const FONT_SIZES = [
        { value: '1', label: 'Small' },
        { value: '3', label: 'Normal' },
        { value: '5', label: 'Large' },
        { value: '7', label: 'X-Large' },
    ];

    function FontSizeDropdown({ exec, theme, darkMode }) {
        const [open, setOpen]       = useState(false);
        const [current, setCurrent] = useState('3');
        const ref                   = useRef(null);

        useEffect(() => {
            const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
            document.addEventListener('mousedown', h);
            return () => document.removeEventListener('mousedown', h);
        }, []);

        const selected = FONT_SIZES.find(f => f.value === current);

        const handleSelect = (val) => {
            exec('fontSize', val);
            setCurrent(val);
            setOpen(false);
        };

        return (
            <div ref={ref} style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    style={{
                        height: 28,
                        padding: '0 10px',
                        borderRadius: 7,
                        border: `1px solid ${open ? theme.primary : theme.border}`,
                        background: open ? theme.primarySoft : theme.panelSoft,
                        color: open ? theme.primary : theme.textSoft,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                        boxShadow: open ? `0 0 0 2px ${theme.primary}22` : 'none',
                    }}
                >
                    {selected?.label ?? 'Normal'}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>

                {open && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 5px)',
                        left: 0,
                        zIndex: 9999,
                        background: darkMode ? theme.panelSolid : '#fff',
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 10,
                        boxShadow: theme.shadow,
                        overflow: 'hidden',
                        minWidth: 110,
                        animation: 'slideIn 0.12s ease',
                    }}>
                        {FONT_SIZES.map(f => {
                            const isSel = f.value === current;
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => handleSelect(f.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 14px',
                                        border: 'none',
                                        background: isSel ? theme.primarySoft : 'transparent',
                                        color: isSel ? theme.primary : theme.textSoft,
                                        fontSize: 12,
                                        fontWeight: isSel ? 700 : 500,
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 8,
                                        transition: 'background 0.1s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : '#f5f3ff'; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span>{f.label}</span>
                                    {isSel && (
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
// ── Rich Toolbar ──────────────────────────────────────────────
function RichToolbar({ editorRef, theme, darkMode }) {
    const exec = (cmd, val = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
    };

    const Btn = ({ onClick, children, title }) => (
        <button type="button" title={title}
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            style={{
                padding: '4px 8px',
                border: `1px solid ${theme.border}`,
                borderRadius: 7, background: theme.panelSoft,
                cursor: 'pointer', fontSize: 12, fontWeight: 700,
                color: theme.textSoft, minWidth: 28,
                transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = theme.panelSofter; e.currentTarget.style.color = theme.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = theme.panelSoft; e.currentTarget.style.color = theme.textSoft; }}
        >
            {children}
        </button>
    );

    const Divider = () => (
        <div style={{ width: 1, background: theme.border, height: 20, margin: '0 2px' }} />
    );



    return (
        <div style={{
            display: 'flex', gap: 4, flexWrap: 'wrap',
            padding: '8px 12px',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.panelSoft,
            alignItems: 'center',
            flexShrink: 0,
        }}>
            <Btn onClick={() => exec('bold')}          title="Bold"><strong>B</strong></Btn>
            <Btn onClick={() => exec('italic')}        title="Italic"><em>I</em></Btn>
            <Btn onClick={() => exec('underline')}     title="Underline"><u>U</u></Btn>
            <Btn onClick={() => exec('strikeThrough')} title="Strike"><s>S</s></Btn>
            <Divider />
            <Btn onClick={() => exec('insertUnorderedList')} title="Bullet List">• List</Btn>
            <Btn onClick={() => exec('insertOrderedList')}   title="Numbered">1. List</Btn>
            <Divider />
            <Btn onClick={() => exec('justifyLeft')}   title="Left">⬅</Btn>
            <Btn onClick={() => exec('justifyCenter')} title="Center">≡</Btn>
            <Btn onClick={() => exec('justifyRight')}  title="Right">➡</Btn>
            <Divider />
            <FontSizeDropdown exec={exec} theme={theme} darkMode={darkMode} />
        </div>
    );
}

// ── Smart field renderer per variable ────────────────────────
const LEAVE_SESSIONS = ['Full Day','Morning (AM Half)','Afternoon (PM Half)'];
const DATE_FIELDS    = ['date','from_date','to_date','deadline','effective_date','start_date'];

function SmartField({ varKey, value, onChange, theme, leaveTypes = [] }) {
    const [dropOpen, setDropOpen] = useState(false);
    const isDate    = DATE_FIELDS.includes(varKey);
    const isLeave   = varKey === 'leave_type';
    const isSession = varKey === 'session';
    const label     = varKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: 12,
        border: `1px solid ${theme.inputBorder}`,
        background: theme.inputBg, color: theme.text,
        fontSize: 13, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit',
    };

    // Custom dropdown (themed — no native OS white bg)
    const CustomDropdown = ({ options, placeholder }) => (
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setDropOpen(v => !v)}
                style={{
                    ...inputStyle,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <span style={{ color: value ? theme.text : theme.textMute }}>
                    {value || placeholder}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            {dropOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    zIndex: 999,
                    background: theme.panelSolid,
                    border: `1px solid ${theme.borderStrong}`,
                    borderRadius: 12,
                    boxShadow: theme.shadow,
                    maxHeight: 220, overflowY: 'auto',
                    scrollbarWidth: 'none',
                }}>
                    <div
                        onClick={() => { onChange(''); setDropOpen(false); }}
                        style={{
                            padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                            color: theme.textMute,
                            borderBottom: `1px solid ${theme.border}`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >{placeholder}</div>
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => { onChange(opt); setDropOpen(false); }}
                            style={{
                                padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                                color: theme.text,
                                background: value === opt ? theme.primarySoft : 'transparent',
                                fontWeight: value === opt ? 700 : 400,
                            }}
                            onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = theme.rowHover; }}
                            onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}
                        >{opt}</div>
                    ))}
                </div>
            )}
        </div>
    );

    let field;
    if (isLeave) {
        // Use DB leave types, fallback to common ones
        const opts = leaveTypes.length > 0 ? leaveTypes : [];
        field = <CustomDropdown options={opts} placeholder="Select leave type..." />;
    } else if (isSession) {
        field = <CustomDropdown options={LEAVE_SESSIONS} placeholder="Select session..." />;
    } else if (isDate) {
        field = (
            <input
                type="datetime-local"
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }}
            />
        );
    } else {
        field = (
            <input
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}...`}
                style={inputStyle}
            />
        );
    }

    return (
        <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: theme.textSoft, display: 'block', marginBottom: 6 }}>
                {label}
            </label>
            {field}
        </div>
    );
}

// ── Template Variables Modal ──────────────────────────────────
function TemplateVarsModal({ open, template, onClose, onApply, leaveTypes = [], theme }) {
    const [vars, setVars] = useState({});

    useEffect(() => {
        if (template?.variables) {
            const init = {};
            // Leave Request template — add session field
            const vars = template.slug === 'leave_request'
                ? [...template.variables, 'session']
                : template.variables;
            vars.forEach(v => { init[v] = ''; });
            setVars(init);
        }
    }, [template]);

    if (!open || !template) return null;

    // Final variable list for leave_request
    const fields = template.slug === 'leave_request'
        ? [...(template.variables || []), 'session']
        : template.variables || [];

    // Format datetime value for display in template
    const formatVal = (key, val) => {
        if (!val) return '';
        if (DATE_FIELDS.includes(key)) {
            try {
                return new Date(val).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                });
            } catch { return val; }
        }
        return val;
    };

    const handleApply = () => {
        const formatted = {};
        Object.entries(vars).forEach(([k, v]) => { formatted[k] = formatVal(k, v); });
        onApply(formatted);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
            <div onClick={onClose} style={{
                position: 'absolute', inset: 0,
                background: theme.overlay,
                backdropFilter: 'blur(6px)',
            }} />
            <div style={{
                position: 'relative',
                background: theme.panelSolid,
                border: `1px solid ${theme.borderStrong}`,
                borderRadius: 24,
                boxShadow: theme.shadow,
                width: '100%', maxWidth: 460,
                maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Template</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: theme.text }}>{template.name}</div>
                    </div>
                    <button onClick={onClose} style={{
                        background: theme.panelSoft, border: `1px solid ${theme.border}`,
                        width: 32, height: 32, borderRadius: 10, cursor: 'pointer',
                        color: theme.textMute, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                </div>

                {/* Fields — scrollable */}
                <div style={{
                    padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14,
                    overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
                }}>
                    {fields.map(v => (
                        <SmartField
                            key={v}
                            varKey={v}
                            value={vars[v] || ''}
                            onChange={val => setVars(p => ({ ...p, [v]: val }))}
                            leaveTypes={leaveTypes}
                            theme={theme}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div style={{ padding: '12px 24px 22px', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0, borderTop: `1px solid ${theme.border}` }}>
                    <button onClick={onClose} style={{
                        padding: '9px 20px', borderRadius: 12,
                        border: `1px solid ${theme.border}`, background: theme.panelSoft,
                        color: theme.textSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={handleApply} style={{
                        padding: '9px 22px', borderRadius: 12, border: 'none',
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        boxShadow: `0 6px 18px ${theme.primary}35`,
                    }}>Apply Template</button>
                </div>
            </div>
        </div>
    );
}

// ── Email Input (To / CC / BCC) ───────────────────────────────
function ToField({ value = [], onChange, systemUsers = [], theme }) {
    const [query, setQuery]   = useState('');
    const [show, setShow]     = useState(false);
    const inputRef            = useRef(null);

    const filtered = query.length > 0
        ? systemUsers.filter(u =>
            (u.name.toLowerCase().includes(query.toLowerCase()) ||
             u.email.toLowerCase().includes(query.toLowerCase())) &&
            !value.includes(u.email)
          )
        : [];

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const addEmail = (email) => {
        const e = email.trim().toLowerCase();
        if (isValidEmail(e) && !value.includes(e)) {
            onChange([...value, e]);
        }
        setQuery('');
        setShow(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && query) {
            e.preventDefault();
            addEmail(query);
        }
        if (e.key === 'Backspace' && !query && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
                minHeight: 36, padding: '4px 6px',
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: 12,
                background: theme.inputBg,
            }}>
                {value.map(email => (
                    <span key={email} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 99,
                        background: theme.primarySoft,
                        border: `1px solid ${theme.primary}22`,
                        color: theme.primary, fontSize: 11, fontWeight: 700,
                    }}>
                        {email}
                        <button type="button" onClick={() => onChange(value.filter(e => e !== email))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setShow(true); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShow(true)}
                    onBlur={() => setTimeout(() => setShow(false), 150)}
                    placeholder={value.length === 0 ? 'Type email + Enter, or search...' : ''}
                    style={{
                        border: 'none', outline: 'none',
                        background: 'transparent',
                        fontSize: 12, color: theme.text,
                        flex: 1, minWidth: 160, padding: '2px 0',
                    }}
                />
            </div>

            {/* Autocomplete dropdown */}
            {show && filtered.length > 0 && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 500,
                    background: theme.panelSolid,
                    border: `1px solid ${theme.borderStrong}`,
                    borderRadius: 14,
                    boxShadow: theme.shadow,
                    maxHeight: 200, overflowY: 'auto',
                    padding: 6,
                }}>
                    {filtered.map(u => (
                        <button key={u.id} type="button"
                            onMouseDown={e => { e.preventDefault(); addEmail(u.email); }}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', borderRadius: 10,
                                border: 'none', background: 'transparent',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                color: '#fff', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0,
                            }}>
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: theme.textMute }}>{u.email}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Export ───────────────────────────────────────────────
export default function ComposeModal({
    open, onClose, onSuccess,
    systemUsers = [], templates = [], leaveTypes = [],
    hasApi = false, replyTo = null, forwardMail = null,
    theme, darkMode = false,
}) {
    if (!open) return null;
    return (
        <ComposeInner
            onClose={onClose} onSuccess={onSuccess}
            systemUsers={systemUsers} templates={templates} leaveTypes={leaveTypes}
            hasApi={hasApi} replyTo={replyTo} forwardMail={forwardMail}
            theme={theme} darkMode={darkMode}
        />
    );
}

// ── Inner Component ───────────────────────────────────────────
function ComposeInner({ onClose, onSuccess, systemUsers, templates, leaveTypes, hasApi, replyTo, forwardMail, theme, darkMode }) {
    const editorRef    = useRef(null);
    const editorReady  = useRef(false);
    const { props }    = usePage();

    const [maximized, setMaximized]         = useState(false);

    const [toAddresses, setToAddresses]     = useState(replyTo ? [replyTo.from_address].filter(Boolean) : []);
    const [ccAddresses, setCcAddresses]     = useState([]);
    const [bccAddresses, setBccAddresses]   = useState([]);
    const [subject, setSubject]             = useState(replyTo ? `Re: ${replyTo.subject || ''}` : forwardMail ? `Fwd: ${forwardMail.subject || ''}` : '');
    const [aiGenerated, setAiGenerated]     = useState(false);
    const [templateUsed, setTemplateUsed]   = useState(null);
    const [attachFiles, setAttachFiles]     = useState([]);
    const [attachPreviews, setAttachPreviews] = useState([]);
    const [showCC, setShowCC]               = useState(false);
    const [showBCC, setShowBCC]             = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateModal, setTemplateModal] = useState({ open: false, template: null });
    const [aiMode, setAiMode]               = useState(null);
    const [aiPrompt, setAiPrompt]           = useState('');
    const [aiTone, setAiTone]               = useState('professional');
    const [aiLoading, setAiLoading]         = useState(false);
    const [translateLang, setTranslateLang] = useState('');
    const [translatePreview, setTranslatePreview] = useState(null);
    const [errors, setErrors]               = useState({});
    const [sending, setSending]             = useState(false);
    const templateRef = useRef(null);

    const [toneOpen, setToneOpen] = useState(false);
    const toneRef = useRef(null);

    useEffect(() => {
        if (!toneOpen) return;
        const h = (e) => {
            if (toneRef.current && !toneRef.current.contains(e.target)) setToneOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [toneOpen]);

    useEffect(() => {
        if (!showTemplates) return;
        const handler = (e) => {
            if (templateRef.current && !templateRef.current.contains(e.target)) {
                setShowTemplates(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showTemplates]);

    useEffect(() => {
        if (editorRef.current && !editorReady.current) {
            editorReady.current = true;
            let initial = '';
            if (forwardMail) initial = `<br><br>---------- Forwarded message ----------<br>${forwardMail.body_html || ''}`;
            else if (replyTo) initial = `<br><br><blockquote style="border-left:3px solid ${theme.border};padding-left:12px;color:${theme.textMute}">${replyTo.body_html || ''}</blockquote>`;
            editorRef.current.innerHTML = initial;
            const range = document.createRange();
            range.setStart(editorRef.current, 0);
            range.collapse(true);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            editorRef.current.focus();
        }
    }, []);

    const getContent = () => editorRef.current?.innerHTML || '';
    const setContent = (html, highlight = false) => {
        if (editorRef.current) {
            editorRef.current.innerHTML = highlight ? highlightVars(html) : html;
        }
    };

    const csrf = () => props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';

    const handleTemplateClick = (t) => {
        setShowTemplates(false);
        setTemplateModal({ open: true, template: t });
    };

    const handleTemplateApply = (vars) => {
        let body = templateModal.template.body_template;
        let subj = templateModal.template.subject_template;
        Object.entries(vars).forEach(([k, v]) => {
            if (v) {
                body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
                subj = subj.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
            }
        });
        setSubject(subj);
        setContent(body, true);
        setTemplateUsed(templateModal.template.slug);
    };

    const aiPost = async (url, body) => {
        const startTime = Date.now();
        const res = await window.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        const elapsed = Date.now() - startTime;

        // ── Token usage console ──────────────────────────
        const feature = url.includes('generate')  ? '✨ AI Write'
                    : url.includes('improve')   ? '🔧 AI Improve'
                    : url.includes('translate') ? '🌐 AI Translate'
                    : '🤖 AI';

        const usage = data.usage;
        console.group(`${feature} — SmartMail`);
        console.log(`⏱️  Time:    ${elapsed}ms`);
        console.log(`⚡ Cached:  ${data.cached ? '✅ Yes' : '❌ No (API used)'}`);
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

        return data;
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt) return;
        setAiLoading(true);
        try {
            const data = await aiPost('/smart-mail/ai/generate', { prompt: aiPrompt, tone: aiTone });
            if (data.success) {
                setSubject(data.result.subject);

                // ── ```html fence တွေ strip ──
                let body = data.result.body || '';
                body = body.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

                setContent(body);
                setAiGenerated(true);
                setAiMode(null);
            }
        } catch {}
        setAiLoading(false);
    };

    const handleAiImprove = async () => {
        setAiLoading(true);
        try {
            const data = await aiPost('/smart-mail/ai/improve', { content: getContent() });
            if (data.success) { setContent(data.improved); setAiMode(null); }
        } catch {}
        setAiLoading(false);
    };

    const handleTranslatePreview = async () => {
        if (!translateLang) return;
        setAiLoading(true);
        setTranslatePreview(null); // ← reset အရင်
        try {
            const data = await aiPost('/smart-mail/ai/translate-preview', {
                content: getContent(),
                language: translateLang,
            });

            if (data.success) setTranslatePreview(data.translated);
        } catch (e) {
            console.error('Translate preview error:', e);
        }
        setAiLoading(false);
    };

    const handleAttach = (e) => {
        const files = Array.from(e.target.files);
        setAttachPreviews(p => [...p, ...files.map(f => ({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' }))]);
        setAttachFiles(p => [...p, ...files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (toAddresses.length === 0) { setErrors({ to: 'Please add at least one recipient.' }); return; }
        setSending(true);
        const fd = new FormData();
        toAddresses.forEach(a  => fd.append('to_addresses[]', a));
        ccAddresses.forEach(a  => fd.append('cc_addresses[]', a));
        bccAddresses.forEach(a => fd.append('bcc_addresses[]', a));
        fd.append('subject',      subject.trim() || '(No Subject)');
        fd.append('body_html',    getContent());
        fd.append('ai_generated', aiGenerated ? '1' : '0');
        if (templateUsed) fd.append('template_used', templateUsed);
        attachFiles.forEach(f => fd.append('attachments[]', f));
        try {
            const res = await window.apiFetch('/smart-mail/send', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.success) { onSuccess?.('Mail sent successfully! ✉️', data.mail ?? null); onClose(); }
            else setErrors(data.errors || { send: data.message || 'Failed to send.' });
        } catch { setErrors({ send: 'Network error. Please try again.' }); }
        setSending(false);
    };

    // Shared input style
    const inp = {
        width: '100%', padding: '9px 12px', borderRadius: 12, fontSize: 13,
        border: `1px solid ${theme.inputBorder}`, background: theme.inputBg,
        color: theme.text, outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    };

    const lbl = { fontSize: 12, fontWeight: 700, color: theme.textMute, minWidth: 40 };

    // AI mode configs
    const aiActions = [
        { mode: 'generate',  label: 'Write',     color: theme.primary,  soft: theme.primarySoft },
        { mode: 'improve',   label: 'Improve',   color: theme.success,  soft: theme.successSoft },
        { mode: 'translate', label: 'Translate', color: theme.secondary, soft: theme.secondarySoft },
    ];

    const TONES = ['professional', 'friendly', 'formal', 'casual', 'persuasive'];
    const LANGS = [
        { code: 'en', label: 'English',    flag: '🇬🇧' },
        { code: 'ja', label: 'Japanese',   flag: '🇯🇵' },
        { code: 'my', label: 'Burmese',    flag: '🇲🇲' },
        { code: 'km', label: 'Khmer',      flag: '🇰🇭' },
        { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
        { code: 'ko', label: 'Korean',     flag: '🇰🇷' },
    ];

    return (
        <>
            {/* Backdrop (dim) */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 999,
                background: 'transparent',
                pointerEvents: 'none',
            }} />

            {/* Compose window — bottom right, or maximized */}
            <div style={{
                position: 'fixed',
                ...(maximized ? {
                    inset: 20,
                    bottom: 20, right: 20,
                    width: 'auto', maxWidth: 'none',
                    maxHeight: 'none',
                } : {
                    bottom: 24, right: 24,
                    width: '100%', maxWidth: 680,
                    maxHeight: '92vh',
                }),
                zIndex: 1000,
                display: 'flex', flexDirection: 'column',
                background: theme.panelSolid,
                border: `1px solid ${theme.borderStrong}`,
                borderRadius: 24,
                boxShadow: theme.shadow,
                animation: 'slideUp 0.22s ease',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
            }}>

                {/* ── Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15,
                        }}>
                            {replyTo ? '↩' : forwardMail ? '↪' : '✉'}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>
                            {replyTo ? 'Reply' : forwardMail ? 'Forward' : 'New Message'}
                        </h3>
                        {aiGenerated && (
                            <span style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 99,
                                background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800,
                            }}>✨ AI</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Templates button — always visible in header */}
                        <div ref={templateRef} style={{ position: 'relative' }}>
                            <button type="button" onClick={() => setShowTemplates(!showTemplates)} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.3)',
                                background: showTemplates ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                onMouseLeave={e => e.currentTarget.style.background = showTemplates ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <line x1="10" y1="9" x2="8" y2="9"/>
                                </svg>
                                Templates
                            </button>

                            {showTemplates && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300,
                                    background: theme.panelSolid,
                                    border: `1px solid ${theme.borderStrong}`,
                                    borderRadius: 16, boxShadow: theme.shadow,
                                    padding: 6, minWidth: 220, maxHeight: 300, overflowY: 'auto',
                                    animation: 'slideIn 0.15s ease',
                                    scrollbarWidth: 'none', msOverflowStyle: 'none',
                                }}>
                                    {templates.filter(t => !['job_offer','project_update'].includes(t.slug)).length === 0 ? (
                                        <div style={{ padding: '14px 16px', fontSize: 12, color: theme.textMute, textAlign: 'center' }}>
                                            No templates available
                                        </div>
                                    ) : templates.filter(t => !['job_offer','project_update'].includes(t.slug)).map(t => (
                                        <button key={t.id} type="button" onClick={() => handleTemplateClick(t)} style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 12px', borderRadius: 10,
                                            border: 'none', background: 'transparent',
                                            cursor: 'pointer', textAlign: 'left',
                                            transition: 'background 0.12s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                                background: theme.primarySoft,
                                                border: `1px solid ${theme.primary}22`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 15,
                                            }}>{t.icon || '📋'}</div>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{t.name}</div>
                                                {t.category && <div style={{ fontSize: 10, color: theme.textMute, marginTop: 1, textTransform: 'capitalize' }}>{t.category}</div>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Maximize / Minimize */}
                        <button onClick={() => setMaximized(v => !v)} title={maximized ? 'Minimize' : 'Maximize'} style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            width: 30, height: 30, borderRadius: 8,
                            cursor: 'pointer', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {maximized ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/><line x1="3" y1="21" x2="14" y2="10"/>
                                </svg>
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                                    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                                </svg>
                            )}
                        </button>

                        {/* Close */}
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            width: 30, height: 30, borderRadius: 8,
                            cursor: 'pointer', fontSize: 16, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>×</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

                    {/* ── To / CC / BCC / Subject ── */}
                    <div style={{
                        padding: '14px 20px',
                        display: 'flex', flexDirection: 'column', gap: 10,
                        borderBottom: `1px solid ${theme.border}`,
                        flexShrink: 0,
                    }}>
                        {/* To row */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                                <label style={lbl}>To</label>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                    <button type="button" onClick={() => setShowCC(!showCC)}
                                        style={{ fontSize: 11, color: showCC ? theme.primary : theme.textMute, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>CC</button>
                                    <button type="button" onClick={() => setShowBCC(!showBCC)}
                                        style={{ fontSize: 11, color: showBCC ? theme.primary : theme.textMute, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>BCC</button>
                                </div>
                            </div>
                            {replyTo ? (
                                <div style={{
                                    padding: '8px 12px', borderRadius: 12,
                                    background: theme.primarySoft,
                                    border: `1px solid ${theme.primary}22`,
                                    fontSize: 12, color: theme.primary, fontWeight: 700,
                                }}>{replyTo.from_address}</div>
                            ) : (
                                <ToField value={toAddresses} onChange={setToAddresses} systemUsers={systemUsers} theme={theme} />
                            )}
                            {errors.to && <p style={{ fontSize: 11, color: theme.danger, marginTop: 4, fontWeight: 700 }}>{errors.to}</p>}
                        </div>

                        {/* CC */}
                        {showCC && (
                            <div>
                                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>CC</label>
                                <ToField value={ccAddresses} onChange={setCcAddresses} systemUsers={systemUsers} theme={theme} />
                            </div>
                        )}

                        {/* BCC */}
                        {showBCC && (
                            <div>
                                <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>BCC</label>
                                <ToField value={bccAddresses} onChange={setBccAddresses} systemUsers={systemUsers} theme={theme} />
                            </div>
                        )}

                        {/* Subject */}
                        <div>
                            <label style={{ ...lbl, display: 'block', marginBottom: 5 }}>Subject</label>
                            <input value={subject} onChange={e => setSubject(e.target.value)}
                                placeholder="Email subject..."
                                style={inp} />
                        </div>
                    </div>

                    {/* ── AI Toolbar ── */}
                    <div style={{
                        display: 'flex', gap: 6, padding: '8px 16px',
                        borderBottom: `1px solid ${theme.border}`,
                        background: theme.panelSoft,
                        flexWrap: 'wrap', flexShrink: 0, alignItems: 'center',
                    }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 4 }}>AI</span>
                        {aiActions.map(a => (
                            <button key={a.mode} type="button"
                                onClick={() => setAiMode(aiMode === a.mode ? null : a.mode)}
                                style={{
                                    padding: '5px 12px', borderRadius: 99,
                                    border: `1px solid ${aiMode === a.mode ? a.color : theme.border}`,
                                    background: aiMode === a.mode ? a.soft : 'transparent',
                                    color: aiMode === a.mode ? a.color : theme.textMute,
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.13s',
                                }}
                            >{a.label}</button>
                        ))}


                    </div>

                    {/* ── AI Panel ── */}
                    {aiMode && (
                        <div style={{
                            padding: '12px 16px',
                            background: theme.panelSoft,
                            borderBottom: `1px solid ${theme.border}`,
                            flexShrink: 0,
                        }}>
                            {aiMode === 'generate' && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                                            placeholder="Describe what to write..."
                                            onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                                            style={{ ...inp, padding: '8px 12px' }} />
                                    </div>
                                    <div ref={toneRef} style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            onClick={() => setToneOpen(v => !v)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: 12,
                                                border: `1px solid ${toneOpen ? theme.primary : theme.inputBorder}`,
                                                background: theme.inputBg,
                                                color: theme.text,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                outline: 'none',
                                                minWidth: 130,
                                                justifyContent: 'space-between',
                                                boxShadow: toneOpen ? `0 0 0 3px ${theme.primary}22` : 'none',
                                                transition: 'all 0.15s',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            <span>{aiTone.charAt(0).toUpperCase() + aiTone.slice(1)}</span>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                                style={{ transform: toneOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', color: theme.textMute, flexShrink: 0 }}>
                                                <polyline points="6 9 12 15 18 9"/>
                                            </svg>
                                        </button>

                                        {toneOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 6px)',
                                                left: 0,
                                                minWidth: '100%',
                                                background: darkMode ? '#111e38' : '#fff',
                                                border: `1px solid ${theme.borderStrong}`,
                                                borderRadius: 12,
                                                boxShadow: theme.shadow,
                                                zIndex: 9999,
                                                overflow: 'hidden',
                                                animation: 'slideIn 0.14s ease',
                                            }}>
                                                {TONES.map(tone => {
                                                    const active = aiTone === tone;
                                                    return (
                                                        <button
                                                            key={tone}
                                                            type="button"
                                                            onClick={() => { setAiTone(tone); setToneOpen(false); }}
                                                            style={{
                                                                width: '100%',
                                                                background: active
                                                                    ? (darkMode ? 'rgba(124,58,237,0.18)' : '#f3e8ff')
                                                                    : 'transparent',
                                                                border: 'none',
                                                                padding: '9px 14px',
                                                                fontSize: 12,
                                                                fontWeight: active ? 700 : 500,
                                                                color: active ? theme.primary : theme.textSoft,
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 8,
                                                                transition: 'background 0.1s',
                                                                fontFamily: 'inherit',
                                                            }}
                                                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'; }}
                                                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                                        >
                                                            {active && <span style={{ color: theme.primary, fontSize: 10 }}>✓</span>}
                                                            {!active && <span style={{ width: 14 }} />}
                                                            {tone.charAt(0).toUpperCase() + tone.slice(1)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt} style={{
                                        padding: '8px 16px', borderRadius: 12, border: 'none',
                                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        opacity: !aiPrompt ? 0.5 : 1,
                                    }}>
                                        {aiLoading ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Writing...</> : '✨ Write'}
                                    </button>
                                </div>
                            )}

                            {aiMode === 'improve' && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" onClick={handleAiImprove} disabled={aiLoading} style={{
                                        padding: '8px 16px', borderRadius: 12, border: 'none',
                                        background: `linear-gradient(135deg, ${theme.success}, #059669)`,
                                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        {aiLoading ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Improving...</> : '🔧 Improve Content'}
                                    </button>
                                    <span style={{ fontSize: 11, color: theme.textMute, alignSelf: 'center' }}>Rewrites your current draft professionally</span>
                                </div>
                            )}

                            {aiMode === 'translate' && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {/* Language buttons — scroll လုပ်လို့ရ */}
                                    <div style={{
                                        display: 'flex', gap: 6, flex: 1,
                                        overflowX: 'auto', paddingBottom: 2,
                                    }}>
                                        {LANGS.map(l => (
                                            <button key={l.code} type="button"
                                                onClick={() => setTranslateLang(l.code)}
                                                style={{
                                                    padding: '5px 12px', borderRadius: 99, whiteSpace: 'nowrap',
                                                    border: `1px solid ${translateLang === l.code ? theme.secondary : theme.border}`,
                                                    background: translateLang === l.code ? theme.secondarySoft : 'transparent',
                                                    color: translateLang === l.code ? theme.secondary : theme.textMute,
                                                    fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                                                }}
                                            >{l.flag} {l.label}</button>
                                        ))}
                                    </div>

                                    {/* Preview button — အမြဲ right မှာ */}
                                    {translateLang && (
                                        <button type="button" onClick={handleTranslatePreview} disabled={aiLoading}
                                            style={{
                                                padding: '5px 14px', borderRadius: 99, border: 'none', flexShrink: 0,
                                                background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
                                                color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                opacity: aiLoading ? 0.7 : 1, minWidth: 80, textAlign: 'center',
                                            }}
                                        >
                                            {aiLoading ? 'Translating...' : 'Preview'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {translatePreview && aiMode === 'translate' && (
                                <div style={{
                                    marginTop: 10, padding: '10px 14px', borderRadius: 12,
                                    background: theme.secondarySoft,
                                    border: `1px solid ${theme.secondary}33`,
                                    fontSize: 12, color: theme.textSoft,
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', marginBottom: 6,
                                    }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: theme.secondary }}>
                                            Preview
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setContent(translatePreview);  // ← body မှာ replace
                                                setTranslatePreview(null);
                                                setAiMode(null);               // ← AI panel ပိတ်
                                            }}
                                            style={{
                                                padding: '4px 12px', borderRadius: 8, border: 'none',
                                                background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
                                                color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                            }}
                                        >
                                            ✓ Apply to Body
                                        </button>
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>
                                        {translatePreview}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Rich Toolbar + Editor ── */}
                    <RichToolbar editorRef={editorRef} theme={theme} darkMode={darkMode} />

                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Write your message..."
                        style={{
                            flex: 1, padding: maximized ? '24px 32px' : '16px 20px',
                            outline: 'none', overflowY: 'auto',
                            fontSize: 13, color: theme.text,
                            lineHeight: 1.7, minHeight: 160,
                            background: theme.panelSolid,
                        }}
                    />

                    {/* ── Send Error ── */}
                    {errors.send && (
                        <div style={{ margin: '0 16px', padding: '8px 14px', borderRadius: 10, background: theme.dangerSoft, border: `1px solid ${theme.danger}30`, color: theme.danger, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {errors.send}
                        </div>
                    )}

                    {/* ── Attachments preview ── */}
                    {attachPreviews.length > 0 && (
                        <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
                            {attachPreviews.map((f, i) => (
                                <span key={i} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '4px 10px', borderRadius: 99,
                                    background: theme.panelSoft,
                                    border: `1px solid ${theme.border}`,
                                    fontSize: 11, color: theme.textSoft,
                                }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                    {f.name} <span style={{ color: theme.textMute }}>{f.size}</span>
                                    <button type="button" onClick={() => { setAttachFiles(p => p.filter((_, j) => j !== i)); setAttachPreviews(p => p.filter((_, j) => j !== i)); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMute, fontSize: 13, lineHeight: 1 }}>×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px',
                        borderTop: `1px solid ${theme.border}`,
                        background: theme.panelSoft,
                        flexShrink: 0,
                    }}>
                        {/* Attach */}
                        <label title="Attach files" style={{
                            width: 36, height: 36, borderRadius: 12,
                            border: `1px solid ${theme.border}`,
                            background: theme.panelSolid,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: theme.textMute,
                            transition: 'all 0.14s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = theme.panelSofter; e.currentTarget.style.color = theme.text; }}
                            onMouseLeave={e => { e.currentTarget.style.background = theme.panelSolid; e.currentTarget.style.color = theme.textMute; }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            <input type="file" multiple onChange={handleAttach} style={{ display: 'none' }} />
                        </label>

                        {!hasApi && (
                            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: theme.warningSoft, color: theme.warning, fontWeight: 800 }}>
                                Demo Mode
                            </span>
                        )}

                        <div style={{ flex: 1 }} />

                        {/* Cancel */}
                        <button type="button" onClick={onClose} style={{
                            padding: '9px 18px', borderRadius: 12,
                            border: `1px solid ${theme.border}`,
                            background: theme.panelSolid, color: theme.textSoft,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = theme.panelSofter}
                            onMouseLeave={e => e.currentTarget.style.background = theme.panelSolid}
                        >Cancel</button>

                        {/* Send */}
                        <button type="submit" disabled={sending} style={{
                            padding: '9px 22px', borderRadius: 12, border: 'none',
                            background: sending
                                ? theme.textMute
                                : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                            color: '#fff', fontSize: 13, fontWeight: 900,
                            cursor: sending ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 7,
                            boxShadow: sending ? 'none' : `0 6px 18px ${theme.primary}35`,
                            transition: 'all 0.18s',
                        }}
                            onMouseEnter={e => { if (!sending) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {sending ? (
                                <>
                                    <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                    Send
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Template Vars Modal */}
            <TemplateVarsModal
                open={templateModal.open}
                template={templateModal.template}
                onClose={() => setTemplateModal({ open: false, template: null })}
                onApply={handleTemplateApply}
                leaveTypes={leaveTypes}
                theme={theme}
            />

            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
                [contenteditable]:empty:before { content: attr(data-placeholder); color: ${theme.textMute}; pointer-events: none; }
                [contenteditable] { caret-color: ${theme.primary}; }

                /* ── Dark mode: template HTML hardcoded colors override ── */
                ${darkMode ? `
                [contenteditable] * { color: ${theme.text} !important; }
                [contenteditable] h1,
                [contenteditable] h2,
                [contenteditable] h3 { color: ${theme.text} !important; }
                [contenteditable] strong { color: ${theme.text} !important; }
                [contenteditable] p { color: ${theme.textSoft} !important; }
                [contenteditable] [style*="color:#9ca3af"],
                [contenteditable] [style*="color:#6b7280"],
                [contenteditable] [style*="color:#4b5563"],
                [contenteditable] [style*="color:#374151"],
                [contenteditable] [style*="color:#475569"],
                [contenteditable] [style*="color:#64748b"] { color: ${theme.textSoft} !important; }
                [contenteditable] [style*="color:#0f172a"],
                [contenteditable] [style*="color:#111827"],
                [contenteditable] [style*="color:#1a1a2e"] { color: ${theme.text} !important; }
                [contenteditable] div[style*="background:#f"],
                [contenteditable] div[style*="background:#e"] { background: ${theme.panelSoft} !important; border-color: ${theme.border} !important; }
                ` : ''}

                /* ── Maximize: editor content full width ── */
                [contenteditable] > div[style*="max-width"] { max-width: 100% !important; }
            `}</style>
        </>
    );
}