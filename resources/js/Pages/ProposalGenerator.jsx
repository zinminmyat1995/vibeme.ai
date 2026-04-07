import { useEffect, useMemo,useRef , useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage, router } from '@inertiajs/react';

const STATUS_MAP = {
    draft: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
    sent: { label: 'Sent', color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
    accepted: { label: 'Accepted', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
};

const LANGUAGES = [
    { value: 'english', label: 'English' },
    { value: 'myanmar', label: 'Myanmar' },
    { value: 'khmer', label: 'Khmer' },
    { value: 'vietnamese', label: 'Vietnamese' },
    { value: 'korean', label: 'Korean' },
    { value: 'japanese', label: 'Japanese' },
];

const TEMPLATES = [
    { value: 'executive', label: 'Executive', desc: 'Premium dark luxury feel' },
    { value: 'magazine', label: 'Magazine', desc: 'Bold editorial presentation' },
    { value: 'minimal', label: 'Minimal', desc: 'Clean Swiss-inspired layout' },
];

const FLAGS = {
    english: (
        <svg width="20" height="14" viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="10"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6"/></svg>
    ),
    myanmar: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="6.67" fill="#FECB00"/><rect y="6.67" width="30" height="6.67" fill="#34B233"/><rect y="13.33" width="30" height="6.67" fill="#EA2839"/><polygon points="15,2 16.76,7.42 22.47,7.42 17.86,10.73 19.61,16.16 15,12.84 10.39,16.16 12.14,10.73 7.53,7.42 13.24,7.42" fill="#fff"/></svg>
    ),
    khmer: (
        <svg width="20" height="14" viewBox="0 0 900 600" aria-hidden="true"><rect width="900" height="600" fill="#032EA1"/><rect width="900" height="300" y="150" fill="#E00025"/><g fill="white"><rect x="375" y="215" width="150" height="170"/><rect x="363" y="195" width="40" height="25"/><rect x="430" y="175" width="40" height="45"/><rect x="497" y="195" width="40" height="25"/><rect x="330" y="235" width="48" height="150"/><rect x="522" y="235" width="48" height="150"/></g></svg>
    ),
    vietnamese: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#DA251D"/><polygon points="15,4 16.47,8.91 21.63,8.91 17.58,11.82 19.05,16.73 15,13.82 10.95,16.73 12.42,11.82 8.37,8.91 13.53,8.91" fill="#FFFF00"/></svg>
    ),
    korean: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="4.5" fill="#C60C30"/><path d="M15,5.5 A4.5,4.5 0 0,1 15,14.5" fill="#003478"/></svg>
    ),
    japanese: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5.5" fill="#BC002D"/></svg>
    ),
};

function cls(...values) {
    return values.filter(Boolean).join(' ');
}

function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark' || localStorage.getItem('vibeme-theme') === 'dark';
    };

    const [darkMode, setDarkMode] = useState(getDark);

    useEffect(() => {
        const sync = () => setDarkMode(getDark());
        window.addEventListener('vibeme-theme-change', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('vibeme-theme-change', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    return darkMode;
}

function getTheme(darkMode) {
    if (darkMode) {
        return {
            pageBg: 'transparent',
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
            shadowSoft: '0 16px 36px rgba(0,0,0,0.28)',
            overlay: 'rgba(2, 8, 23, 0.72)',
            primary: '#7c3aed',
            primaryHover: '#6d28d9',
            primarySoft: 'rgba(124,58,237,0.16)',
            secondary: '#2563eb',
            secondaryHover: '#1d4ed8',
            secondarySoft: 'rgba(37,99,235,0.14)',
            success: '#10b981',
            successSoft: 'rgba(16,185,129,0.16)',
            warning: '#f59e0b',
            warningSoft: 'rgba(245,158,11,0.16)',
            danger: '#f87171',
            dangerHover: '#ef4444',
            dangerSoft: 'rgba(248,113,113,0.14)',
            inputBg: 'rgba(255,255,255,0.035)',
            inputBorder: 'rgba(148,163,184,0.16)',
            tableHead: 'rgba(255,255,255,0.028)',
            rowHover: 'rgba(255,255,255,0.03)',
            glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.22), transparent 42%), radial-gradient(circle at bottom left, rgba(37,99,235,0.16), transparent 38%)',
            chipShadow: '0 10px 24px rgba(0,0,0,0.16)',
            accentGradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)',
            successBg: 'rgba(16,185,129,0.12)',
            successText: '#86efac',
            errorBg: 'rgba(239,68,68,0.12)',
            errorText: '#fca5a5',
            neutralBg: 'rgba(255,255,255,0.05)',
            metricCard: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.025) 100%)',
            toolbarBg: 'rgba(255,255,255,0.03)',
            white: '#ffffff',
        };
    }

    return {
        pageBg: 'transparent',
        panel: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,255,0.96) 100%)',
        panelSolid: '#ffffff',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.12)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        shadow: '0 24px 70px rgba(15,23,42,0.08)',
        shadowSoft: '0 14px 30px rgba(15,23,42,0.06)',
        overlay: 'rgba(15,23,42,0.36)',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',
        secondary: '#2563eb',
        secondaryHover: '#1d4ed8',
        secondarySoft: '#dbeafe',
        success: '#059669',
        successSoft: '#d1fae5',
        warning: '#d97706',
        warningSoft: '#fef3c7',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        dangerSoft: '#fee2e2',
        inputBg: '#f8fafc',
        inputBorder: '#e5e7eb',
        tableHead: '#f8fafc',
        rowHover: '#fbfbfe',
        glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 44%), radial-gradient(circle at bottom left, rgba(37,99,235,0.07), transparent 40%)',
        chipShadow: '0 10px 24px rgba(15,23,42,0.05)',
        accentGradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)',
        successBg: '#f0fdf4',
        successText: '#166534',
        errorBg: '#fef2f2',
        errorText: '#991b1b',
        neutralBg: '#ffffff',
        metricCard: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
        toolbarBg: '#ffffff',
        white: '#ffffff',
    };
}

function card(theme, extra = {}) {
    return {
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        boxShadow: theme.shadowSoft,
        backdropFilter: 'blur(16px)',
        ...extra,
    };
}

function inputStyle(theme, hasError = false) {
    return {
        width: '100%',
        padding: '13px 15px',
        borderRadius: 16,
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        border: `1px solid ${hasError ? '#fca5a5' : theme.inputBorder}`,
        background: hasError ? (theme.panelSolid === '#0b1324' ? 'rgba(127,29,29,0.12)' : '#fef2f2') : theme.inputBg,
        color: theme.text,
        transition: 'all 0.18s ease',
        boxShadow: hasError ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
    };
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
}

function SectionTitle({ eyebrow, title, desc, theme, action = null }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
                {eyebrow && (
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.primary, marginBottom: 6 }}>
                        {eyebrow}
                    </div>
                )}
               
                {desc && (
                    <div style={{ marginTop: 8, fontSize: 13, color: theme.textMute, lineHeight: 1.6, maxWidth: 720 }}>
                        {desc}
                    </div>
                )}
            </div>
            {action}
        </div>
    );
}

function UIButton({ children, onClick, type = 'button', variant = 'primary', disabled = false, theme, style = {} }) {
    const cfg = {
        primary: {
            bg: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            color: '#fff',
            border: 'none',
            hoverBg: `linear-gradient(135deg, ${theme.primaryHover} 0%, ${theme.secondaryHover} 100%)`,
            shadow: `0 14px 32px ${theme.primary}30`,
        },
        ghost: {
            bg: theme.panelSoft,
            color: theme.textSoft,
            border: `1px solid ${theme.border}`,
            hoverBg: theme.panelSofter,
            shadow: 'none',
        },
        danger: {
            bg: theme.danger,
            color: '#fff',
            border: 'none',
            hoverBg: theme.dangerHover,
            shadow: `0 14px 32px ${theme.danger}30`,
        },
        softDanger: {
            bg: theme.dangerSoft,
            color: theme.danger,
            border: `1px solid ${theme.border}`,
            hoverBg: theme.dangerSoft,
            shadow: 'none',
        },
    }[variant];

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                height: 46,
                padding: '0 18px',
                borderRadius: 16,
                border: cfg.border,
                background: disabled ? theme.textMute : cfg.bg,
                color: cfg.color,
                fontSize: 13,
                fontWeight: 900,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                boxShadow: disabled ? 'none' : cfg.shadow,
                transition: 'all 0.18s ease',
                ...style,
            }}
            onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.background = cfg.hoverBg;
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                if (disabled) return;
                e.currentTarget.style.background = cfg.bg;
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {children}
        </button>
    );
}

function Toast({ message, type, onClose, darkMode = false }) {
    if (!message) return null;
    const theme = getTheme(darkMode);
    const ok = type !== 'error';

    return (
        <div style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 16,
            background: ok ? theme.successBg : theme.errorBg,
            border: `1px solid ${ok ? theme.success : theme.danger}`,
            boxShadow: theme.shadowSoft,
            animation: 'slideDown 0.3s ease',
            minWidth: 320,
            maxWidth: 440,
            backdropFilter: 'blur(12px)',
        }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: ok ? theme.success : theme.danger, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: ok ? theme.successText : theme.errorText, flex: 1 }}>
                {message}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: theme.textMute, lineHeight: 1 }}>
                ×
            </button>
        </div>
    );
}
function ActionGlyph({ type, color }) {
    if (type === 'edit') {
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
        );
    }

    if (type === 'delete') {
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
        );
    }

    return null;
}
function StatusBadge({ status, darkMode = false }) {
    const s = STATUS_MAP[status] || STATUS_MAP.draft;

    const darkMap = {
        draft: { bg: 'rgba(148,163,184,0.16)', color: '#cbd5e1', dot: '#94a3b8' },
        sent: { bg: 'rgba(37,99,235,0.16)', color: '#93c5fd', dot: '#3b82f6' },
        accepted: { bg: 'rgba(16,185,129,0.16)', color: '#86efac', dot: '#10b981' },
        rejected: { bg: 'rgba(239,68,68,0.16)', color: '#fca5a5', dot: '#ef4444' },
    };

    const styleSet = darkMode ? darkMap[status] || darkMap.draft : s;

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 900,
            padding: '6px 11px',
            borderRadius: 999,
            background: styleSet.bg,
            color: styleSet.color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            boxShadow: darkMode ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.7)',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: styleSet.dot, display: 'inline-block' }} />
            {s.label}
        </span>
    );
}

function LanguageBadge({ language, darkMode = false }) {
    const theme = getTheme(darkMode);
    const lang = LANGUAGES.find((item) => item.value === language);

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 36,
            padding: '0 12px',
            borderRadius: 999,
            background: theme.panelSoft,
            border: `1px solid ${theme.border}`,
            fontSize: 12,
            fontWeight: 800,
            color: theme.textSoft,
        }}>
            <span style={{ display: 'inline-flex', borderRadius: 4, overflow: 'hidden' }}>{FLAGS[language]}</span>
            {lang?.label || 'Unknown'}
        </span>
    );
}

function StatCard({ item, theme, darkMode = false, index = 0 }) {
    return (
        <div
            style={{
                ...card(theme, {
                    padding: 18,
                    minHeight: 112,
                    position: 'relative',
                    overflow: 'hidden',
                    background: darkMode ? theme.metricCard : item.bg,
                }),
                animation: `fadeUp 0.4s ease ${index * 0.06}s both`,
            }}
        >
            <div style={{ position: 'absolute', inset: 0, background: theme.glass, opacity: darkMode ? 0.48 : 0.30, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, boxShadow: `0 0 0 6px ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)'}` }} />
                    <div style={{ fontSize: 11, color: theme.textMute, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {item.label}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: item.color }}>{item.value}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: theme.textMute }}>{item.line}</div>
                </div>
            </div>
        </div>
    );
}

function FieldError({ msg, darkMode = false }) {
    const theme = getTheme(darkMode);
    if (!msg) return null;

    return (
        <p style={{
            color: theme.danger,
            fontSize: 11,
            fontWeight: 700,
            marginTop: 7,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.danger, display: 'inline-block' }} />
            {msg}
        </p>
    );
}

function ChoiceCard({ active, onClick, children, darkMode = false }) {
    const theme = getTheme(darkMode);
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                border: `1px solid ${active ? theme.primary : theme.borderStrong}`,
                background: active ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` : theme.panelSoft,
                color: active ? '#fff' : theme.textSoft,
                borderRadius: 18,
                minHeight: 60,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                textAlign: 'center',
                boxShadow: active ? `0 10px 24px ${theme.primary}25` : 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 800,
                transition: 'all 0.18s ease',
            }}
        >
            {children}
        </button>
    );
}

function TemplateCard({ active, onClick, title, desc, darkMode = false }) {
    const theme = getTheme(darkMode);
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                border: `1px solid ${active ? theme.primary : theme.borderStrong}`,
                background: active ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` : theme.panelSoft,
                color: active ? '#fff' : theme.textSoft,
                borderRadius: 18,
                minHeight: 88,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
                textAlign: 'center',
                boxShadow: active ? `0 10px 24px ${theme.primary}25` : 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
            }}
        >
            <div style={{ fontSize: 14, fontWeight: 900 }}>{title}</div>
            <div style={{ fontSize: 11, opacity: active ? 0.86 : 0.76, lineHeight: 1.4 }}>{desc}</div>
        </button>
    );
}

function PremiumSelect({
    options = [],
    value = '',
    onChange,
    placeholder = 'Select option...',
    theme,
    darkMode = false,
    minWidth = 170,
    width = 'auto',
    renderOption,
    zIndex = 300,
}) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const selected = options.find(
        (opt) => String(opt.value) === String(value) && !opt.disabled,
    );

    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const triggerBg = darkMode
        ? 'linear-gradient(180deg, rgba(12,22,44,0.96) 0%, rgba(8,17,36,0.96) 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)';

    const menuBg = darkMode
        ? 'linear-gradient(180deg, rgba(5,17,38,0.99) 0%, rgba(3,12,28,0.99) 100%)'
        : '#ffffff';

    const selectedBg = darkMode ? 'rgba(37,99,235,0.22)' : '#2563eb';
    const selectedText = '#ffffff';

    return (
        <div ref={wrapRef} style={{ position: 'relative', minWidth, width, zIndex }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: '100%',
                    height: 52,
                    padding: '0 16px',
                    borderRadius: 18,
                    border: `1px solid ${open ? theme.borderStrong : theme.inputBorder}`,
                    background: triggerBg,
                    color: selected ? theme.text : theme.textMute,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                    boxShadow: open ? theme.shadowSoft : 'none',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                }}
            >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, textAlign: 'left' }}>
                    {selected ? (
                        renderOption ? renderOption(selected, true, true) : (
                            <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                                {selected.label}
                            </span>
                        )
                    ) : (
                        <span style={{ fontSize: 13, color: theme.textMute, textAlign: 'left' }}>{placeholder}</span>
                    )}
                </div>

                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', flexShrink: 0 }}
                >
                    <path
                        d="M4 6L8 10L12 6"
                        stroke={theme.textMute}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        left: 0,
                        right: 0,
                        zIndex: zIndex + 50,
                        background: menuBg,
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: theme.shadow,
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    {options.map((opt, index) => {
                        const isSelected = String(opt.value) === String(value);
                        const isDisabled = !!opt.disabled;

                        return (
                            <button
                                key={String(opt.value) || `opt-${index}`}
                                type="button"
                                onClick={() => {
                                    if (isDisabled) return;
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    minHeight: 54,
                                    padding: '0 16px',
                                    border: 'none',
                                    borderBottom: index < options.length - 1 ? `1px solid ${theme.border}` : 'none',
                                    background: isSelected ? selectedBg : 'transparent',
                                    color: isSelected ? selectedText : theme.textSoft,
                                    opacity: isDisabled ? 0.45 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    textAlign: 'left',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected && !isDisabled) {
                                        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected && !isDisabled) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                {renderOption ? renderOption(opt, false, isSelected) : (
                                    <span style={{ fontSize: 13, fontWeight: isSelected ? 800 : 600 }}>
                                        {opt.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
function Modal({ open, onClose, title, subtitle, children, darkMode = false }) {
    if (!open) return null;
    const theme = getTheme(darkMode);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: theme.overlay,
                    backdropFilter: 'blur(12px)',
                }}
            />
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 620,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 30,
                    background: theme.panel,
                    border: `1px solid ${theme.borderStrong}`,
                    boxShadow: theme.shadow,
                    backdropFilter: 'blur(18px)',
                    animation: 'modalIn 0.2s ease',
                }}
            >
                <div
                    style={{
                        padding: '30px 24px 26px',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)',
                        borderBottom: darkMode
                            ? '1px solid rgba(255,255,255,0.10)'
                            : '1px solid rgba(255,255,255,0.22)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: `
                                radial-gradient(circle at top left, rgba(255,255,255,0.22), transparent 34%),
                                radial-gradient(circle at bottom right, rgba(255,255,255,0.10), transparent 28%),
                                linear-gradient(135deg, rgba(255,255,255,0.08), transparent 58%)
                            `,
                            pointerEvents: 'none',
                        }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 20,
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0))',
                            pointerEvents: 'none',
                        }}
                    />

                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 18,
                        }}
                    >
                        <div style={{ paddingRight: 16 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.78)',
                                    fontWeight: 900,
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                    marginBottom: 10,
                                    lineHeight: 1,
                                }}
                            >
                                {subtitle || 'Workspace'}
                            </div>

                            <div
                                style={{
                                    fontSize: 20,
                                    fontWeight: 900,
                                    color: '#ffffff',
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.15,
                                    margin: 0,
                                    textShadow: '0 2px 10px rgba(0,0,0,0.12)',
                                }}
                            >
                                {title}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 18,
                                border: '1px solid rgba(255,255,255,0.16)',
                                background: 'rgba(255,255,255,0.12)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: 28,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.18s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div style={{ overflowY: 'auto', padding: '22px 24px 24px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
function GenerateModal({ analyses, onClose, onSuccess, darkMode = false }) {
    const theme = getTheme(darkMode);
    const [errors, setErrors] = useState({});
    const form = useForm({
        requirement_analysis_id: '',
        language: 'english',
        template: 'executive',
    });

    const validate = () => {
        const next = {};
        if (!form.data.requirement_analysis_id) next.requirement_analysis_id = 'Please select a project analysis first.';
        return next;
    };

    const submit = (e) => {
        e.preventDefault();
        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        form.post('/proposals', {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess('Proposal generated successfully.');
                onClose();
            },
        });
    };

    const lbl = {
        fontSize: 12,
        fontWeight: 800,
        color: theme.textSoft,
        display: 'block',
        marginBottom: 7,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
    };

    const projectOptions = [
        { value: '', label: 'Choose a completed analysis...', disabled: true },
        ...analyses.map((analysis) => ({
            value: analysis.id,
            label: analysis.project_title,
            sublabel: analysis.client?.company_name || 'Unknown Client',
        })),
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: theme.overlay, backdropFilter: 'blur(10px)' }} />
            <div style={{
                position: 'relative',
                background: theme.panel,
                borderRadius: 30,
                boxShadow: theme.shadow,
                width: '100%',
                maxWidth: 720,
                maxHeight: '92vh',
                overflow: 'hidden',
                border: `1px solid ${theme.borderStrong}`,
                animation: 'popIn 0.25s ease',
                backdropFilter: 'blur(20px)',
            }}>
                <div style={{
                    background: theme.accentGradient,
                    padding: '24px 28px 22px',
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.18)',
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at top left, rgba(255,255,255,0.20), transparent 34%), radial-gradient(circle at bottom right, rgba(255,255,255,0.10), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 58%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
                                Generate Proposal
                            </h2>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', margin: '5px 0 0' }}>
                                Same route and API flow, matched to RequirementAnalysis theme system.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 14,
                                border: '1px solid rgba(255,255,255,0.16)',
                                background: 'rgba(255,255,255,0.12)',
                                cursor: 'pointer',
                                fontSize: 22,
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(92vh - 170px)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ position: 'relative', zIndex: 250 }}>
                                <label style={lbl}>Select Project <span style={{ color: theme.danger }}>*</span></label>
                               <PremiumSelect
                                    options={projectOptions}
                                    value={form.data.requirement_analysis_id}
                                    onChange={(val) => {
                                        form.setData('requirement_analysis_id', val);
                                        setErrors((prev) => ({ ...prev, requirement_analysis_id: '' }));
                                    }}
                                    placeholder="Choose a completed analysis..."
                                    theme={theme}
                                    darkMode={darkMode}
                                    minWidth={0}
                                    width="100%"
                                    zIndex={250}
                                    renderOption={(opt, isTriggerView, isSelectedItem) => {
                                        const primaryColor = isTriggerView ? theme.text : isSelectedItem ? '#ffffff' : theme.textSoft;
                                        const secondaryColor = isTriggerView ? theme.textMute : isSelectedItem ? 'rgba(255,255,255,0.78)' : theme.textMute;

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: primaryColor }}>
                                                    {opt.label}
                                                </span>
                                                {!isTriggerView && opt.sublabel && (
                                                    <span style={{ fontSize: 11, color: secondaryColor }}>
                                                        {opt.sublabel}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    }}
                                    />
                                <FieldError msg={errors.requirement_analysis_id} darkMode={darkMode} />
                                {analyses.length === 0 && <div style={{ fontSize: 12, color: theme.textMute, marginTop: 8 }}>No completed analyses available yet.</div>}
                            </div>

                            <div>
                                <label style={lbl}>Proposal Language</label>
                                <div className="pg-language-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {LANGUAGES.map((language) => {
                                        const active = form.data.language === language.value;
                                        return (
                                            <ChoiceCard key={language.value} active={active} onClick={() => form.setData('language', language.value)} darkMode={darkMode}>
                                                <span style={{ display: 'inline-flex', borderRadius: 4, overflow: 'hidden' }}>{FLAGS[language.value]}</span>
                                                <span>{language.label}</span>
                                            </ChoiceCard>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label style={lbl}>Template Style</label>
                                <div className="pg-template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {TEMPLATES.map((template) => {
                                        const active = form.data.template === template.value;
                                        return (
                                            <TemplateCard
                                                key={template.value}
                                                active={active}
                                                onClick={() => form.setData('template', template.value)}
                                                title={template.label}
                                                desc={template.desc}
                                                darkMode={darkMode}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: '18px 28px 24px',
                        borderTop: `1px solid ${theme.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: theme.panelSoft,
                    }}>
                        <UIButton type="button" onClick={onClose} variant="ghost" theme={theme}>Cancel</UIButton>
                        <UIButton type="submit" disabled={form.processing} variant="primary" theme={theme}>
                            {form.processing && (
                                <span style={{
                                    width: 14,
                                    height: 14,
                                    border: '2px solid rgba(255,255,255,0.35)',
                                    borderTopColor: '#fff',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.7s linear infinite',
                                }} />
                            )}
                            {form.processing ? 'Generating...' : 'Generate Proposal'}
                        </UIButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteConfirm({ user, onClose, onConfirm, loading, darkMode = false }) {
    const theme = getTheme(darkMode);

    return (
        <div style={{ textAlign: 'center', padding: '20px 10px 10px' }}>
            
            {/* ICON */}
            <div
                style={{
                    width: 90,
                    height: 90,
                    margin: '0 auto 22px',
                    borderRadius: 28,
                    background: theme.dangerSoft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${theme.border}`,
                }}
            >
                <ActionGlyph type="delete" color={theme.danger} />
            </div>

           
            <h4
                style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: theme.text,
                    marginBottom: 10,
                }}
            >
                Delete Proposal?
            </h4>

     
            <p
                style={{
                    fontSize: 13,
                    color: theme.textMute,
                    marginBottom: 26,
                    lineHeight: 1.7,
                }}
            >
                Are you sure you want to delete{' '}
                <strong style={{ color: theme.text }}>
                    this proposal
                </strong>
                ?<br />
                This action cannot be undone.
            </p>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <UIButton
                    onClick={onClose}
                    variant="ghost"
                    theme={theme}
                    style={{
                        minWidth: 110,
                        borderRadius: 14,
                    }}
                >
                    Cancel
                </UIButton>

                <UIButton
                    onClick={onConfirm}
                    disabled={loading}
                    variant="danger"
                    theme={theme}
                    style={{
                        minWidth: 140,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    }}
                >
                    {loading ? 'Deleting...' : 'Yes, Delete'}
                </UIButton>
            </div>
        </div>
    );
}

export default function ProposalGenerator({ proposals = [], analyses = [], stats = {} }) {
    const { flash } = usePage().props;
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [showGenerate, setShowGenerate] = useState(false);
    const [toast, setToast] = useState(flash?.success ? { msg: flash.success, type: 'success' } : flash?.error ? { msg: flash.error, type: 'error' } : null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (flash?.success) setToast({ msg: flash.success, type: 'success' });
        if (flash?.error) setToast({ msg: flash.error, type: 'error' });
    }, [flash]);

    const filtered = useMemo(() => {
        return proposals.filter((proposal) => {
            const proposalNo = proposal.content?.proposal_number?.toLowerCase?.() || '';
            const project = proposal.requirement_analysis?.project_title?.toLowerCase?.() || '';
            const client = proposal.requirement_analysis?.client?.company_name?.toLowerCase?.() || '';
            const keyword = search.trim().toLowerCase();
            const matchSearch = !keyword || proposalNo.includes(keyword) || project.includes(keyword) || client.includes(keyword);
            const matchStatus = filterStatus ? proposal.status === filterStatus : true;
            return matchSearch && matchStatus;
        });
    }, [proposals, search, filterStatus]);

    const handleDelete = (id) => {
        router.delete(`/proposals/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setToast({ msg: 'Proposal deleted successfully.', type: 'success' });
                setDeleteId(null);
            },
            onError: () => {
                setToast({ msg: 'Unable to delete proposal.', type: 'error' });
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const statCards = [
        { label: 'Total', value: stats.total ?? 0, color: theme.text, bg: theme.metricCard, line: 'All generated proposals' },
        { label: 'Draft', value: stats.draft ?? 0, color: theme.warning, bg: theme.warningSoft, line: 'Waiting next action' },
        { label: 'Sent', value: stats.sent ?? 0, color: theme.secondary, bg: theme.secondarySoft, line: 'Shared with clients' },
        { label: 'Accepted', value: stats.accepted ?? 0, color: theme.success, bg: theme.successSoft, line: 'Ready to celebrate' },
        { label: 'Rejected', value: stats.rejected ?? 0, color: theme.danger, bg: theme.dangerSoft, line: 'Needs revision' },
    ];

    return (
        <AppLayout title="Proposal Generator">
            <style>{`
                @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes popIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
                @keyframes spin { to { transform:rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                @media (max-width: 1200px) {
                    .pg-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                }
                @media (max-width: 960px) {
                    .pg-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .pg-toolbar { grid-template-columns: 1fr !important; }
                    .pg-filter-group { width: 100%; flex-wrap: wrap; }
                    .pg-language-grid, .pg-template-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 640px) {
                    .pg-stats-grid { grid-template-columns: 1fr !important; }
                    .pg-language-grid, .pg-template-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} darkMode={darkMode} />

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ ...card(theme), padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <SectionTitle
                            eyebrow="Proposal Generator"
                            title="Premium AI proposal workspace"
                            desc="Matched to RequirementAnalysis light and dark mode behavior, while keeping the same proposal routes and API flow."
                            theme={theme}
                            action={
                                <UIButton onClick={() => setShowGenerate(true)} variant="primary" theme={theme}>
                                    <span>✨</span>
                                    Generate Proposal
                                </UIButton>
                            }
                        />

                        <div className="pg-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14, marginTop: 22 }}>
                            {statCards.map((item, index) => (
                                <StatCard key={item.label} item={item} theme={theme} darkMode={darkMode} index={index} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pg-toolbar" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                    <div
                        style={{
                            ...card(theme),
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '11px 14px',
                            borderRadius: 18,
                            background: theme.toolbarBg,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by proposal number, project or client..."
                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: theme.text, flex: 1 }}
                        />

                        {search && (
                            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMute, fontSize: 16 }}>
                                ×
                            </button>
                        )}
                    </div>

                    <div className="pg-filter-group" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ ...inputStyle(theme), minWidth: 180, width: 180, padding: '13px 15px' }}
                        >
                            <option value="">All Status</option>
                            {Object.entries(STATUS_MAP).map(([key, item]) => (
                                <option key={key} value={key}>{item.label}</option>
                            ))}
                        </select>

                        <UIButton onClick={() => { setSearch(''); setFilterStatus(''); }} variant="ghost" theme={theme}>Reset Filters</UIButton>
                    </div>
                </div>

                <div style={{ ...card(theme), overflow: 'hidden' }}>
                    <div style={{
                        padding: '18px 20px',
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                    }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: theme.text }}>Proposal directory</div>
                            <div style={{ marginTop: 4, fontSize: 12, color: theme.textMute }}>
                                {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
                            </div>
                        </div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 12px',
                            borderRadius: 999,
                            background: theme.panelSoft,
                            color: theme.textSoft,
                            fontSize: 11,
                            fontWeight: 900,
                            boxShadow: theme.chipShadow,
                        }}>
                            Live proposal list
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: theme.tableHead, borderBottom: `1px solid ${theme.border}` }}>
                                    {['Proposal #', 'Project', 'Client', 'Language', 'Status', 'Date', 'Actions'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '16px 18px',
                                                textAlign: 'left',
                                                fontSize: 11,
                                                fontWeight: 900,
                                                color: theme.textMute,
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 56, textAlign: 'center' }}>
                                            <div style={{
                                                width: 64,
                                                height: 64,
                                                margin: '0 auto 14px',
                                                borderRadius: 20,
                                                border: `1px solid ${theme.border}`,
                                                background: theme.panelSoft,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 28,
                                            }}>
                                                📄
                                            </div>
                                            <div style={{ fontSize: 15, color: theme.text, fontWeight: 900 }}>No proposals yet</div>
                                            <div style={{ marginTop: 6, fontSize: 12, color: theme.textMute }}>Click Generate Proposal to get started.</div>
                                        </td>
                                    </tr>
                                ) : filtered.map((proposal, i) => (
                                    <tr
                                        key={proposal.id}
                                        style={{
                                            borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : 'none',
                                            transition: 'background 0.15s ease',
                                            animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = theme.rowHover; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <td style={{ padding: '16px 18px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                minHeight: 36,
                                                padding: '0 12px',
                                                borderRadius: 999,
                                                background: theme.primarySoft,
                                                color: theme.primary,
                                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
                                                fontSize: 12,
                                                fontWeight: 900,
                                                border: `1px solid ${theme.border}`,
                                            }}>
                                                {proposal.content?.proposal_number ?? '—'}
                                            </span>
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ fontSize: 13.5, fontWeight: 900, color: theme.text, marginBottom: 4 }}>
                                                {proposal.requirement_analysis?.project_title || 'Untitled Project'}
                                            </div>
                                            <div style={{ fontSize: 11, color: theme.textMute }}>
                                                {proposal.content?.total_investment || 'Investment not available'}
                                            </div>
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textSoft }}>
                                                {proposal.requirement_analysis?.client?.company_name || 'Unknown Client'}
                                            </div>
                                            <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2 }}>
                                                Client profile linked from requirement analysis
                                            </div>
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <LanguageBadge language={proposal.language} darkMode={darkMode} />
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <StatusBadge status={proposal.status} darkMode={darkMode} />
                                        </td>

                                        <td style={{ padding: '16px 18px', fontSize: 12, color: theme.textMute, whiteSpace: 'nowrap' }}>
                                            {formatDate(proposal.created_at)}
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <a
                                                    href={`/proposals/${proposal.id}`}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: 12,
                                                        border: `1px solid ${theme.border}`,
                                                        background: theme.panelSoft,
                                                        color: theme.textSoft,
                                                        fontSize: 11,
                                                        fontWeight: 900,
                                                        cursor: 'pointer',
                                                        textDecoration: 'none',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <ActionGlyph type="edit" color={theme.textSoft} />
                                                </a>

                                                <button
                                                    onClick={() => {
                                                        setDeleteId(proposal.id);
                                                        setIsDeleting(false);
                                                    }}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: 12,
                                                        border: `1px solid ${theme.border}`,
                                                        background: theme.dangerSoft,
                                                        color: theme.danger,
                                                        fontSize: 11,
                                                        fontWeight: 900,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <ActionGlyph type="delete" color={theme.danger} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showGenerate && (
                <GenerateModal
                    analyses={analyses}
                    onClose={() => setShowGenerate(false)}
                    onSuccess={(msg) => setToast({ msg, type: 'success' })}
                    darkMode={darkMode}
                />
            )}

        <Modal
            open={!!deleteId}
            onClose={() => setDeleteId(null)}
            title="Confirm Delete"
            subtitle="Danger Zone"
            darkMode={darkMode}
        >
            <DeleteConfirm
                onClose={() => setDeleteId(null)}
                onConfirm={() => {
                    setIsDeleting(true);
                    handleDelete(deleteId);
                }}
                loading={isDeleting}
                darkMode={darkMode}
            />
        </Modal>
        </AppLayout>
    );
}
