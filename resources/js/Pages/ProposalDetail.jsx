import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';

const LANGUAGES = [
    { value: 'english', label: 'English', flag: '🇬🇧' },
    { value: 'myanmar', label: 'Myanmar', flag: '🇲🇲' },
    { value: 'khmer', label: 'Khmer', flag: '🇰🇭' },
    { value: 'vietnamese', label: 'Vietnamese', flag: '🇻🇳' },
    { value: 'korean', label: 'Korean', flag: '🇰🇷' },
    { value: 'japanese', label: 'Japanese', flag: '🇯🇵' },
];

const STATUS_MAP = {
    draft: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
    sent: { label: 'Sent', color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
    accepted: { label: 'Accepted', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
};

const TEMPLATES = [
    { value: 'executive', label: 'Executive', desc: 'Dark Luxury' },
    { value: 'magazine', label: 'Magazine', desc: 'Bold Editorial' },
    { value: 'minimal', label: 'Minimal', desc: 'Swiss Grid' },
];

function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return (
            document.documentElement.getAttribute('data-theme') === 'dark' ||
            localStorage.getItem('vibeme-theme') === 'dark'
        );
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
            previewSurface: '#0f172a',
            browserBar: '#101826',
            browserBorder: 'rgba(148,163,184,0.16)',
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
        previewSurface: '#e5e7eb',
        browserBar: '#ffffff',
        browserBorder: '#e5e7eb',
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

function UIButton({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    disabled = false,
    theme,
    style = {},
}) {
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
        success: {
            bg: theme.success,
            color: '#fff',
            border: 'none',
            hoverBg: '#059669',
            shadow: `0 14px 32px ${theme.success}30`,
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
                textDecoration: 'none',
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
                    height: 46,
                    padding: '0 16px',
                    borderRadius: 16,
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
                }}
            >
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 10,
                        textAlign: 'left',
                    }}
                >
                    {selected ? (
                        renderOption ? renderOption(selected, true, true) : (
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    overflow: 'visible',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {selected.label}
                            </span>
                        )
                    ) : (
                        <span style={{ fontSize: 13, color: theme.textMute }}>{placeholder}</span>
                    )}
                </div>

                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.18s ease',
                        flexShrink: 0,
                    }}
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
                                    minHeight: 50,
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
function SectionTitle({ eyebrow, title, desc, theme, action = null }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                alignItems: 'flex-end',
                flexWrap: 'wrap',
            }}
        >
            <div>
                {eyebrow && (
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: theme.primary,
                            marginBottom: 6,
                        }}
                    >
                        {eyebrow}
                    </div>
                )}
                <div
                    style={{
                        fontSize: 'clamp(24px, 3vw, 34px)',
                        fontWeight: 900,
                        color: theme.text,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.08,
                    }}
                >
                    {title}
                </div>
            </div>
            {action}
        </div>
    );
}

function StatusBadge({ status, darkMode = false }) {
    const s = STATUS_MAP[status] || STATUS_MAP.draft;

    const darkMap = {
        draft: { bg: 'rgba(148,163,184,0.16)', color: '#cbd5e1', dot: '#94a3af' },
        sent: { bg: 'rgba(37,99,235,0.16)', color: '#93c5fd', dot: '#3b82f6' },
        accepted: { bg: 'rgba(16,185,129,0.16)', color: '#86efac', dot: '#10b981' },
        rejected: { bg: 'rgba(239,68,68,0.16)', color: '#fca5a5', dot: '#ef4444' },
    };

    const styleSet = darkMode ? darkMap[status] || darkMap.draft : s;

    return (
        <span
            style={{
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
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: styleSet.dot,
                    display: 'inline-block',
                }}
            />
            {s.label}
        </span>
    );
}

function MiniInfoCard({ title, value, sub, theme, accent }) {
    return (
        <div
            style={{
                ...card(theme, {
                    padding: 18,
                    minHeight: 110,
                    background: `linear-gradient(180deg, ${accent}18 0%, ${theme.panel} 100%)`,
                }),
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    color: theme.textMute,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 10,
                }}
            >
                {title}
            </div>
            <div
                style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: theme.text,
                    lineHeight: 1.1,
                    wordBreak: 'break-word',
                }}
            >
                {value}
            </div>
            {sub ? (
                <div style={{ marginTop: 8, fontSize: 12, color: theme.textMute, lineHeight: 1.5 }}>
                    {sub}
                </div>
            ) : null}
        </div>
    );
}

function BrowserPreviewFrame({
    src,
    iframeKey,
    theme,
    darkMode,
    onMaximize,
    pdfUrl,
    height = '1123px',
    maximized = false,
}) {
    return (
        <div
            style={{
                background: theme.previewSurface,
                borderRadius: 22,
                padding: maximized ? '18px 18px 24px' : 20,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.shadowSoft,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: theme.browserBar,
                    borderRadius: 14,
                    padding: '10px 16px',
                    marginBottom: 14,
                    border: `1px solid ${theme.browserBorder}`,
                    boxShadow: darkMode ? '0 8px 20px rgba(0,0,0,0.16)' : '0 6px 18px rgba(15,23,42,0.05)',
                }}
            >
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                </div>

                <div
                    style={{
                        flex: 1,
                        maxWidth: 360,
                        margin: '0 14px',
                        minHeight: 34,
                        borderRadius: 999,
                        background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                        border: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 14px',
                        overflow: 'hidden',
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            color: theme.textMute,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: 700,
                        }}
                    >
                        Proposal Live Preview
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            background: theme.accentGradient,
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 900,
                            textDecoration: 'none',
                            boxShadow: `0 8px 22px ${theme.primary}30`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        📥 Download PDF
                    </a>

                    <button
                        onClick={onMaximize}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: `1px solid ${theme.border}`,
                            background: theme.panelSoft,
                            color: theme.textSoft,
                            fontSize: 12,
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                        {maximized ? 'Minimize' : 'Maximize'}
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <iframe
                    key={iframeKey}
                    src={src}
                    style={{
                        width: '794px',
                        height,
                        border: 'none',
                        borderRadius: 10,
                        background: '#fff',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
                        display: 'block',
                        margin: '0 auto',
                    }}
                    title="Proposal Preview"
                />
            </div>
        </div>
    );
}

export default function ProposalDetail({ proposal }) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const c = proposal.content ?? {};
    const analysis = proposal.requirement_analysis ?? {};
    const client = analysis.client ?? {};
    const lang = LANGUAGES.find((l) => l.value === proposal.language) ?? LANGUAGES[0];
    const status = STATUS_MAP[proposal.status] ?? STATUS_MAP.draft;

    const [tpl, setTpl] = useState(c.template ?? 'executive');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [maximized, setMaximized] = useState(false);

    const previewUrl = `/proposals/${proposal.id}/preview/${tpl}`;
    const pdfUrl = `/proposals/${proposal.id}/pdf/${tpl}`;

    const handleTpl = (val) => {
        setTpl(val);
        setIframeKey((k) => k + 1);
    };

    const handleStatus = (nextStatus) => {
        setUpdatingStatus(true);
        router.patch(
            `/proposals/${proposal.id}/status`,
            { status: nextStatus },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingStatus(false),
            },
        );
    };

    const handleRegenerate = () => {
        setRegenerating(true);
        router.post(
            `/proposals/${proposal.id}/regenerate`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRegenerating(false),
            },
        );
    };

    const totalInvestment = c.total_investment || c.total_cost || 'Not specified';
    const validity = c.validity_period || 'Not specified';
    const proposalNo = c.proposal_number || 'N/A';
    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
    ];
    return (
        <AppLayout title="Proposal Detail">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 1200px) {
                    .pd-top-grid { grid-template-columns: 1fr 1fr !important; }
                    .pd-main-grid { grid-template-columns: 1fr !important; }
                }

                @media (max-width: 768px) {
                    .pd-top-grid { grid-template-columns: 1fr !important; }
                    .pd-actions-wrap { width: 100%; justify-content: stretch !important; }
                    .pd-actions-wrap > * { flex: 1; }
                    .pd-template-row { flex-wrap: wrap; }
                    .pd-footer-row { flex-direction: column; align-items: stretch !important; }
                    .pd-footer-actions { width: 100%; flex-direction: column; }
                    .pd-footer-actions > * { width: 100%; }
                }
            `}</style>

            {maximized && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9000,
                        background: darkMode ? 'rgba(3, 8, 20, 0.96)' : 'rgba(229, 231, 235, 0.96)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 18,
                        animation: 'fadeIn 0.2s ease',
                    }}
                >
                    <BrowserPreviewFrame
                        src={previewUrl}
                        iframeKey={`max-${iframeKey}`}
                        theme={theme}
                        darkMode={darkMode}
                        onMaximize={() => setMaximized(false)}
                        pdfUrl={pdfUrl}
                        height="calc(100vh - 120px)"
                        maximized
                    />
                </div>
            )}

            <div style={{ display: 'grid', gap: 18 }}>
                <div
                    style={{
                        ...card(theme),
                        padding: 24,
                        position: 'relative',
                        zIndex: 30,
                        overflow: 'visible',
                        animation: 'fadeUp 0.25s ease',
                    }}
                >
                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', display: 'grid', gap: 22 }}>
                        <SectionTitle
                            eyebrow="Proposal Detail"
                            title={analysis.project_title || 'Proposal Detail'}
                            desc="Premium proposal review workspace with template switching, preview, PDF export, status updates, and regeneration while keeping the same backend routes and logic."
                            theme={theme}
                            action={
                                <div className="pd-actions-wrap" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <a
                                        href="/proposals"
                                        style={{
                                            height: 46,
                                            padding: '0 18px',
                                            borderRadius: 16,
                                            border: `1px solid ${theme.border}`,
                                            background: theme.panelSoft,
                                            color: theme.textSoft,
                                            fontSize: 13,
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        ← Back
                                    </a>

                                    <UIButton onClick={handleRegenerate} disabled={regenerating} variant="ghost" theme={theme}>
                                        {regenerating ? (
                                            <span
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    border: `2px solid ${theme.primary}40`,
                                                    borderTopColor: theme.primary,
                                                    borderRadius: '50%',
                                                    display: 'inline-block',
                                                    animation: 'spin 0.7s linear infinite',
                                                }}
                                            />
                                        ) : (
                                            '🔄'
                                        )}
                                        {regenerating ? 'Regenerating...' : 'Regenerate'}
                                    </UIButton>

                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            height: 46,
                                            padding: '0 18px',
                                            borderRadius: 16,
                                            background: theme.accentGradient,
                                            color: '#fff',
                                            fontSize: 13,
                                            fontWeight: 900,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            textDecoration: 'none',
                                            boxShadow: `0 14px 32px ${theme.primary}30`,
                                        }}
                                    >
                                        📥 Download PDF
                                    </a>
                                </div>
                            }
                        />

                   

                        <div
                            style={{
                                ...card(theme, {
                                    padding: 18,
                                    background: darkMode ? theme.metricCard : theme.panelSoft,
                                }),
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 16,
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 900,
                                            color: theme.textMute,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            marginBottom: 10,
                                        }}
                                    >
                                        Proposal Status
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <StatusBadge status={proposal.status} darkMode={darkMode} />
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                minHeight: 34,
                                                padding: '0 12px',
                                                borderRadius: 999,
                                                background: theme.panelSolid,
                                                border: `1px solid ${theme.border}`,
                                                color: theme.textSoft,
                                                fontSize: 12,
                                                fontWeight: 800,
                                            }}
                                        >
                                            Template: {TEMPLATES.find((t) => t.value === tpl)?.label || 'Executive'}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 10,
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        position: 'relative',
                                        zIndex: 50,
                                    }}
                                >
                                    <PremiumSelect
                                        options={statusOptions}
                                        value={proposal.status}
                                        onChange={handleStatus}
                                        placeholder="Select status..."
                                        theme={theme}
                                        darkMode={darkMode}
                                        minWidth={180}
                                        width={180}
                                        zIndex={9999}
                                        renderOption={(opt, isTriggerView, isSelectedItem) => {
                                            const meta = STATUS_MAP[opt.value] || STATUS_MAP.draft;
                                            const primaryColor = isTriggerView ? theme.text : isSelectedItem ? '#ffffff' : theme.textSoft;

                                            return (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        gap: 10,
                                                        width: '100%',
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            background: isTriggerView || isSelectedItem ? '#ffffff' : meta.color,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 800,
                                                            color: primaryColor,
                                                            flex: 1,
                                                            textAlign: 'left',
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </span>
                                                </div>
                                            );
                                        }}
                                    />

                                    {updatingStatus && (
                                        <div
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                color: theme.textMute,
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    border: `2px solid ${theme.primary}40`,
                                                    borderTopColor: theme.primary,
                                                    borderRadius: '50%',
                                                    display: 'inline-block',
                                                    animation: 'spin 0.7s linear infinite',
                                                }}
                                            />
                                            Updating...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            className="pd-template-row"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'nowrap',
                                overflowX: 'auto',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 900,
                                    color: theme.textMute,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    flexShrink: 0,
                                    marginRight: 2,
                                }}
                            >
                                Template
                            </span>

                            {TEMPLATES.map((t) => {
                                const active = tpl === t.value;
                                return (
                                    <button
                                        key={t.value}
                                        onClick={() => handleTpl(t.value)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '9px 16px',
                                            borderRadius: 14,
                                            cursor: 'pointer',
                                            border: `1px solid ${active ? theme.primary : theme.border}`,
                                            background: active ? theme.accentGradient : theme.panelSoft,
                                            color: active ? '#fff' : theme.textSoft,
                                            fontSize: 12,
                                            fontWeight: 800,
                                            transition: 'all 0.15s ease',
                                            whiteSpace: 'nowrap',
                                            boxShadow: active ? `0 10px 24px ${theme.primary}25` : 'none',
                                        }}
                                    >
                                        {t.label}
                                        <span style={{ opacity: active ? 0.86 : 0.66, fontWeight: 600 }}>
                                            — {t.desc}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div
                    className="pd-main-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) 320px',
                        gap: 18,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <BrowserPreviewFrame
                            src={previewUrl}
                            iframeKey={iframeKey}
                            theme={theme}
                            darkMode={darkMode}
                            onMaximize={() => setMaximized(true)}
                            pdfUrl={pdfUrl}
                        />
                    </div>

                    <div style={{ display: 'grid', gap: 18 }}>
                        <div style={{ ...card(theme), padding: 20 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 900,
                                    color: theme.textMute,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 14,
                                }}
                            >
                                Client Summary
                            </div>

                            <div style={{ display: 'grid', gap: 14 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Company</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>
                                        {client.company_name || 'Unknown Client'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Industry</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSoft }}>
                                        {client.industry || 'Not specified'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Email</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSoft }}>
                                        {client.email || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ ...card(theme), padding: 20 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 900,
                                    color: theme.textMute,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 14,
                                }}
                            >
                                Proposal Insights
                            </div>

                            <div style={{ display: 'grid', gap: 14 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Project</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>
                                        {analysis.project_title || 'Untitled Project'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Language</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSoft }}>
                                        {lang.flag} {lang.label}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Template</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSoft }}>
                                        {TEMPLATES.find((t) => t.value === tpl)?.label || 'Executive'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Investment</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSoft }}>
                                        {totalInvestment}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 4 }}>Validity</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.textSoft }}>
                                        {validity}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                ...card(theme, {
                                    padding: 20,
                                    background: `linear-gradient(180deg, ${theme.primarySoft} 0%, ${theme.panel} 100%)`,
                                }),
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 900,
                                    color: theme.text,
                                    marginBottom: 8,
                                }}
                            >
                                Ready for final delivery?
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    color: theme.textMute,
                                    lineHeight: 1.7,
                                    marginBottom: 18,
                                }}
                            >
                                Review the selected template preview, confirm client details, then update the status or download the final PDF.
                            </div>

                            <div className="pd-footer-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <UIButton onClick={() => handleStatus('accepted')} variant="success" theme={theme}>
                                    Mark Accepted
                                </UIButton>

                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        height: 46,
                                        padding: '0 18px',
                                        borderRadius: 16,
                                        background: theme.accentGradient,
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 900,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        textDecoration: 'none',
                                        boxShadow: `0 14px 32px ${theme.primary}30`,
                                    }}
                                >
                                    Download PDF
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            
            </div>
        </AppLayout>
    );
}