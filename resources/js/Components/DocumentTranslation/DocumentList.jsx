import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

const LANGUAGES = {
    en: { label: 'English', flag: '🇬🇧' },
    ja: { label: 'Japanese', flag: '🇯🇵' },
    my: { label: 'Burmese', flag: '🇲🇲' },
    km: { label: 'Khmer', flag: '🇰🇭' },
    vi: { label: 'Vietnamese', flag: '🇻🇳' },
    ko: { label: 'Korean', flag: '🇰🇷' },
};

const FILE_META = {
    pdf: {
        label: 'PDF',
        color: '#ef4444',
        soft: '#fee2e2',
        note: 'Portable document',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v5h5" />
                <path d="M8 13h3" />
                <path d="M8 17h8" />
            </svg>
        ),
    },
    doc: {
        label: 'DOC',
        color: '#2563eb',
        soft: '#dbeafe',
        note: 'Editable document',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v5h5" />
                <path d="M9 10h1a2 2 0 0 1 0 4H9z" />
                <path d="M14 10v4" />
                <path d="M14 12h2.5" />
            </svg>
        ),
    },
    docx: {
        label: 'DOCX',
        color: '#2563eb',
        soft: '#dbeafe',
        note: 'Editable document',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v5h5" />
                <path d="M8 10l4 6" />
                <path d="M12 10l-4 6" />
                <path d="M15.5 10v6" />
            </svg>
        ),
    },
    txt: {
        label: 'TXT',
        color: '#64748b',
        soft: '#e2e8f0',
        note: 'Plain text',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v5h5" />
                <path d="M8 12h8" />
                <path d="M8 16h6" />
            </svg>
        ),
    },
    png: {
        label: 'PNG',
        color: '#059669',
        soft: '#d1fae5',
        note: 'Image file',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="1.3" />
                <path d="M21 16l-5.2-5.2a1.5 1.5 0 0 0-2.1 0L6 18" />
            </svg>
        ),
    },
    jpg: {
        label: 'JPG',
        color: '#059669',
        soft: '#d1fae5',
        note: 'Image file',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="1.3" />
                <path d="M21 16l-5.2-5.2a1.5 1.5 0 0 0-2.1 0L6 18" />
            </svg>
        ),
    },
    jpeg: {
        label: 'JPEG',
        color: '#059669',
        soft: '#d1fae5',
        note: 'Image file',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="1.3" />
                <path d="M21 16l-5.2-5.2a1.5 1.5 0 0 0-2.1 0L6 18" />
            </svg>
        ),
    },
};

const STATUS_META = {
    pending: {
        label: 'Pending',
        color: '#d97706',
        soft: '#fef3c7',
        note: 'Waiting in queue',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </svg>
        ),
    },
    translating: {
        label: 'Translating',
        color: '#2563eb',
        soft: '#dbeafe',
        note: 'Jobs currently running',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
            </svg>
        ),
    },
    completed: {
        label: 'Completed',
        color: '#059669',
        soft: '#d1fae5',
        note: 'Downloads available',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
            </svg>
        ),
    },
    failed: {
        label: 'Failed',
        color: '#ef4444',
        soft: '#fee2e2',
        note: 'Needs review or retry',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6" />
                <path d="M9 9l6 6" />
            </svg>
        ),
    },
};

function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark'
            || localStorage.getItem('vibeme-theme') === 'dark';
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
            panel: 'linear-gradient(180deg, rgba(10,18,36,0.96) 0%, rgba(9,16,32,0.92) 100%)',
            panelSolid: '#0b1324',
            panelSoft: 'rgba(255,255,255,0.035)',
            panelSofter: 'rgba(255,255,255,0.055)',
            border: 'rgba(148,163,184,0.12)',
            borderStrong: 'rgba(148,163,184,0.22)',
            text: '#f8fafc',
            textSoft: '#cbd5e1',
            textMute: '#8da0b8',
            shadow: '0 28px 80px rgba(0,0,0,0.42)',
            shadowSoft: '0 16px 36px rgba(0,0,0,0.28)',
            overlay: 'rgba(2, 8, 23, 0.74)',
            primary: '#7c3aed',
            primaryHover: '#6d28d9',
            primarySoft: 'rgba(124,58,237,0.18)',
            secondary: '#2563eb',
            secondaryHover: '#1d4ed8',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#f87171',
            dangerHover: '#ef4444',
            tableHead: 'rgba(255,255,255,0.03)',
            rowHover: 'rgba(255,255,255,0.03)',
            glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 40%), radial-gradient(circle at bottom left, rgba(37,99,235,0.12), transparent 36%)',
            inputBg: 'rgba(255,255,255,0.035)',
            inputBorder: 'rgba(148,163,184,0.16)',
        };
    }

    return {
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
        success: '#059669',
        warning: '#d97706',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        tableHead: '#f8fafc',
        rowHover: '#fbfbfe',
        glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 44%), radial-gradient(circle at bottom left, rgba(37,99,235,0.07), transparent 40%)',
        inputBg: '#f8fafc',
        inputBorder: '#e5e7eb',
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

function IconButton({ children, onClick, theme, variant = 'neutral', title }) {
    const styles = {
        neutral: {
            background: theme.panelSoft,
            color: theme.textSoft,
            border: `1px solid ${theme.border}`,
        },
        danger: {
            background: theme.panelSolid === '#0b1324' ? 'rgba(248,113,113,0.12)' : '#fee2e2',
            color: theme.danger,
            border: `1px solid ${theme.border}`,
        },
    }[variant];

    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                ...styles,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {children}
        </button>
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

function PremiumSelect({
    options = [],
    value = '',
    onChange,
    placeholder = 'Select option...',
    theme,
    darkMode = false,
    minWidth = 170,
    width = 'auto',
}) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const selected = options.find((opt) => String(opt.value) === String(value) && !opt.disabled);

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

    return (
        <div ref={wrapRef} style={{ position: 'relative', minWidth, width, zIndex: 50 }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: '100%',
                    height: 46,
                    padding: '0 14px',
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
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}>
                    <path d="M4 6L8 10L12 6" stroke={theme.textMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        left: 0,
                        right: 0,
                        zIndex: 90,
                        background: menuBg,
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 18,
                        overflow: 'hidden',
                        boxShadow: theme.shadow,
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    {options.map((opt, index) => {
                        const isSelected = String(opt.value) === String(value);
                        return (
                            <button
                                key={String(opt.value) || `opt-${index}`}
                                type="button"
                                onClick={() => {
                                    if (opt.disabled) return;
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    minHeight: 48,
                                    padding: '0 14px',
                                    border: 'none',
                                    borderBottom: index < options.length - 1 ? `1px solid ${theme.border}` : 'none',
                                    background: isSelected ? theme.primary : 'transparent',
                                    color: isSelected ? '#fff' : theme.textSoft,
                                    opacity: opt.disabled ? 0.45 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    textAlign: 'left',
                                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontSize: 13,
                                    fontWeight: isSelected ? 800 : 600,
                                }}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function formatDate(dateValue) {
    if (!dateValue) return '—';
    const parsed = new Date(String(dateValue).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return dateValue;
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusFor(doc) {
    return STATUS_META[doc.status] || STATUS_META.pending;
}

function fileMetaFor(doc) {
    return FILE_META[doc.file_type?.toLowerCase()] || FILE_META.txt;
}

function DownloadModal({ document, hasApi, onClose, darkMode = false }) {
    const theme = getTheme(darkMode);
    if (!document) return null;

    const availableLangs = document.translated_paths || [];

    const handleDownload = (language) => {
        window.location.href = `/documents/${document.id}/download/${language}`;
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: theme.overlay, backdropFilter: 'blur(12px)' }} />
            <div style={{ ...card(theme, { width: '100%', maxWidth: 560, overflow: 'hidden', position: 'relative' }) }}>
                <div style={{ padding: '26px 24px 22px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.22), transparent 34%), radial-gradient(circle at bottom right, rgba(255,255,255,0.12), transparent 30%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', marginBottom: 8 }}>
                                Downloads
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
                                Choose file version
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>
                                {document.original_filename}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: 46,
                                height: 46,
                                borderRadius: 16,
                                border: '1px solid rgba(255,255,255,0.16)',
                                background: 'rgba(255,255,255,0.12)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: 26,
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div style={{ padding: 24, display: 'grid', gap: 12 }}>
                    <button
                        type="button"
                        onClick={() => handleDownload('original')}
                        style={{
                            width: '100%',
                            padding: '16px 18px',
                            borderRadius: 18,
                            border: `1px solid ${theme.border}`,
                            background: theme.panelSoft,
                            color: theme.text,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: theme.primarySoft, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <path d="M7 10l5 5 5-5" />
                                <path d="M12 15V3" />
                            </svg>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: theme.text }}>Original file</div>
                            <div style={{ marginTop: 4, fontSize: 11.5, color: theme.textMute }}>
                                {document.file_type?.toUpperCase()} · {document.file_size}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: 11, color: theme.primary, fontWeight: 900 }}>
                            Download
                        </div>
                    </button>

                    {hasApi && availableLangs.length > 0 && (
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ fontSize: 11, color: theme.textMute, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.10em', marginTop: 4 }}>
                                Translated versions
                            </div>

                            {availableLangs.map((lang) => {
                                const meta = LANGUAGES[lang];
                                if (!meta) return null;

                                return (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => handleDownload(lang)}
                                        style={{
                                            width: '100%',
                                            padding: '16px 18px',
                                            borderRadius: 18,
                                            border: `1px solid ${theme.border}`,
                                            background: theme.panelSoft,
                                            color: theme.text,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{ width: 48, height: 48, borderRadius: 16, background: darkMode ? 'rgba(16,185,129,0.16)' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                                            {meta.flag}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: theme.text }}>{meta.label}</div>
                                            <div style={{ marginTop: 4, fontSize: 11.5, color: theme.textMute }}>
                                                Translated · {document.file_type?.toUpperCase()}
                                            </div>
                                        </div>
                                        <div style={{ marginLeft: 'auto', fontSize: 11, color: theme.success, fontWeight: 900 }}>
                                            Download
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!hasApi && (
                        <div style={{ padding: '14px 16px', borderRadius: 16, border: `1px solid ${theme.border}`, background: darkMode ? 'rgba(245,158,11,0.12)' : '#fef3c7', color: theme.warning, fontSize: 12.5, fontWeight: 700 }}>
                            API is not configured, so only the original document is available.
                        </div>
                    )}
                </div>

                <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <UIButton onClick={onClose} variant="ghost" theme={theme}>Close</UIButton>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirm({ document, onClose, onConfirm, loading, darkMode = false }) {
    const theme = getTheme(darkMode);
    if (!document) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: theme.overlay, backdropFilter: 'blur(12px)' }} />
            <div style={{ ...card(theme, { width: '100%', maxWidth: 460, padding: 28, position: 'relative' }) }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 82, height: 82, margin: '0 auto 18px', borderRadius: 26, background: darkMode ? 'rgba(248,113,113,0.14)' : '#fee2e2', border: `1px solid ${theme.border}`, color: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>Delete document?</div>
                    <div style={{ marginTop: 10, fontSize: 13, color: theme.textMute, lineHeight: 1.7 }}>
                        This will remove <strong style={{ color: theme.text }}>{document.original_filename}</strong> and all translated versions linked to it.
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 26 }}>
                    <UIButton onClick={onClose} variant="ghost" theme={theme}>Cancel</UIButton>
                    <UIButton onClick={onConfirm} disabled={loading} variant="danger" theme={theme}>
                        {loading ? 'Deleting...' : 'Delete'}
                    </UIButton>
                </div>
            </div>
        </div>
    );
}

function ListRow({ doc, onDownload, onDelete, darkMode = false, isLast = false }) {
    const theme = getTheme(darkMode);
    const file = fileMetaFor(doc);
    const status = statusFor(doc);

    return (
        <tr
            style={{ borderBottom: isLast ? 'none' : `1px solid ${theme.border}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.rowHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
            <td style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 250 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: file.soft, color: file.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {file.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 900, color: theme.text, wordBreak: 'break-word' }}>
                            {doc.original_filename}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 11.5, color: theme.textMute }}>
                            {doc.file_size} · {file.label} · {file.note}
                        </div>
                    </div>
                </div>
            </td>

            <td style={{ padding: '16px 18px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: status.soft, color: status.color, fontSize: 11, fontWeight: 900 }}>
                    {status.icon}
                    {status.label}
                </span>
            </td>

            <td style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '5px 9px', borderRadius: 999, background: darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: theme.textSoft, fontWeight: 800 }}>
                        {LANGUAGES[doc.source_language]?.flag} {LANGUAGES[doc.source_language]?.label || 'Unknown'}
                    </span>
                    {doc.target_languages?.map((lang) => (
                        <span key={lang} style={{ fontSize: 10, padding: '5px 9px', borderRadius: 999, background: darkMode ? 'rgba(16,185,129,0.16)' : '#d1fae5', color: theme.success, fontWeight: 800 }}>
                            {LANGUAGES[lang]?.flag} {LANGUAGES[lang]?.label}
                        </span>
                    ))}
                </div>
            </td>

            <td style={{ padding: '16px 18px', fontSize: 12.5, color: theme.textSoft, whiteSpace: 'nowrap' }}>
                {formatDate(doc.created_at)}
            </td>

            <td style={{ padding: '16px 18px', fontSize: 12.5, color: theme.textSoft }}>
                {doc.uploader || '—'}
            </td>

            <td style={{ padding: '16px 18px' }}>
                {doc.tags?.length ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 220 }}>
                        {doc.tags.map((tag) => (
                            <span key={tag} style={{ fontSize: 10, padding: '5px 8px', borderRadius: 999, background: darkMode ? 'rgba(124,58,237,0.18)' : '#ede9fe', color: theme.primary, fontWeight: 800 }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span style={{ fontSize: 12, color: theme.textMute }}>—</span>
                )}
            </td>

            <td style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <IconButton onClick={() => onDownload(doc)} theme={theme} title="Download">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="M7 10l5 5 5-5" />
                            <path d="M12 15V3" />
                        </svg>
                    </IconButton>

                    {doc.canDelete && (
                        <IconButton onClick={() => onDelete(doc)} theme={theme} variant="danger" title="Delete">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                        </IconButton>
                    )}
                </div>
            </td>
        </tr>
    );
}

function DocumentCard({ doc, onDownload, onDelete, darkMode = false }) {
    const theme = getTheme(darkMode);
    const file = fileMetaFor(doc);
    const status = statusFor(doc);

    return (
        <div style={{ ...card(theme, { padding: 18, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ position: 'absolute', inset: 0, background: theme.glass, opacity: 0.45, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 54, height: 54, borderRadius: 18, background: file.soft, color: file.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {file.icon}
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 999, background: status.soft, color: status.color, fontSize: 10, fontWeight: 900 }}>
                    {status.icon}
                    {status.label}
                </span>
            </div>

            <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: theme.text, wordBreak: 'break-word' }}>
                    {doc.original_filename}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: theme.textMute }}>
                    {doc.file_size} · {file.label} · {formatDate(doc.created_at)}
                </div>
            </div>

            <div style={{ position: 'relative', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '5px 9px', borderRadius: 999, background: darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: theme.textSoft, fontWeight: 800 }}>
                    {LANGUAGES[doc.source_language]?.flag} {LANGUAGES[doc.source_language]?.label || 'Unknown'}
                </span>
                {doc.target_languages?.map((lang) => (
                    <span key={lang} style={{ fontSize: 10, padding: '5px 9px', borderRadius: 999, background: darkMode ? 'rgba(16,185,129,0.16)' : '#d1fae5', color: theme.success, fontWeight: 800 }}>
                        {LANGUAGES[lang]?.flag} {LANGUAGES[lang]?.label}
                    </span>
                ))}
            </div>

            {doc.tags?.length > 0 && (
                <div style={{ position: 'relative', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {doc.tags.map((tag) => (
                        <span key={tag} style={{ fontSize: 10, padding: '5px 8px', borderRadius: 999, background: darkMode ? 'rgba(124,58,237,0.18)' : '#ede9fe', color: theme.primary, fontWeight: 800 }}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', fontSize: 12, color: theme.textMute }}>
                Uploaded by <strong style={{ color: theme.textSoft }}>{doc.uploader || '—'}</strong>
            </div>

            <div style={{ position: 'relative', display: 'flex', gap: 10, marginTop: 'auto' }}>
                <UIButton onClick={() => onDownload(doc)} variant="primary" theme={theme} style={{ flex: 1, height: 42 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <path d="M7 10l5 5 5-5" />
                        <path d="M12 15V3" />
                    </svg>
                    Download
                </UIButton>

                {doc.canDelete && (
                    <UIButton onClick={() => onDelete(doc)} variant="ghost" theme={theme} style={{ width: 46, padding: 0, color: theme.danger }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </UIButton>
                )}
            </div>
        </div>
    );
}

export default function DocumentList({ documents = [], hasApi = false, folderName = 'All Files', onShowToast,onDeleteSuccess, }) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [downloadTarget, setDownloadTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = useMemo(() => {
        return documents.filter((doc) => {
            const q = query.trim().toLowerCase();
            const searchMatch = !q || [
                doc.original_filename,
                doc.uploader,
                ...(doc.tags || []),
                doc.file_type,
            ].filter(Boolean).join(' ').toLowerCase().includes(q);

            const statusMatch = statusFilter ? doc.status === statusFilter : true;
            const typeMatch = typeFilter ? doc.file_type?.toLowerCase() === typeFilter : true;

            return searchMatch && statusMatch && typeMatch;
        });
    }, [documents, query, statusFilter, typeFilter]);

    const stats = useMemo(() => {
        return {
            total: documents.length,
            completed: documents.filter((d) => d.status === 'completed').length,
            translating: documents.filter((d) => d.status === 'translating').length,
            failed: documents.filter((d) => d.status === 'failed').length,
        };
    }, [documents]);

    const handleDelete = () => {
        if (!deleteTarget?.id) return;

        const deletedId = deleteTarget.id;

        setDeleting(true);
        router.delete(`/documents/${deletedId}`, {
            preserveScroll: true,
            onSuccess: () => {
                onDeleteSuccess?.(deletedId);
                setDeleteTarget(null);
            },
            onError: () => {
                onShowToast?.('Failed to delete document.', 'error');
            },
            onFinish: () => setDeleting(false),
        });
    };

    const statusOptions = [
        { value: '', label: 'All statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'translating', label: 'Translating' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
    ];

    const typeOptions = [
        { value: '', label: 'All file types' },
        { value: 'pdf', label: 'PDF' },
        { value: 'doc', label: 'DOC' },
        { value: 'docx', label: 'DOCX' },
        { value: 'txt', label: 'TXT' },
        { value: 'png', label: 'PNG' },
        { value: 'jpg', label: 'JPG' },
        { value: 'jpeg', label: 'JPEG' },
    ];

    return (
        <>
            <style>{`
                @keyframes dtSpin { to { transform: rotate(360deg); } }
            `}</style>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'transparent' }}>
                <div style={{ padding: 20, borderBottom: `1px solid ${theme.border}`, background: theme.panel, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, opacity: 0.5, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.primary, marginBottom: 8 }}>
                                Document Library
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: theme.text, lineHeight: 1.15 }}>
                                {folderName}
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12.5, color: theme.textMute }}>
                                {filtered.length} visible file{filtered.length !== 1 ? 's' : ''} · Same route/API flow preserved
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: 10,
                            width: '100%',
                        }}>
                            {[
                                { label: 'Total', value: stats.total, color: theme.primary, soft: theme.primarySoft },
                                { label: 'Completed', value: stats.completed, color: theme.success, soft: darkMode ? 'rgba(16,185,129,0.14)' : '#d1fae5' },
                                { label: 'Running', value: stats.translating, color: theme.secondary, soft: darkMode ? 'rgba(37,99,235,0.14)' : '#dbeafe' },
                                { label: 'Failed', value: stats.failed, color: theme.danger, soft: darkMode ? 'rgba(248,113,113,0.12)' : '#fee2e2' },
                            ].map((item) => (
                                <div key={item.label} style={{ ...card(theme, { padding: '14px 14px 12px', borderRadius: 18, background: theme.panelSoft }) }}>
                                    <div style={{ fontSize: 10, color: theme.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 900 }}>
                                        {item.label}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                                        <div style={{ fontSize: 22, lineHeight: 1, fontWeight: 900, color: item.color }}>
                                            {item.value}
                                        </div>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, boxShadow: `0 0 0 6px ${item.soft}` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ padding: 18, borderBottom: `1px solid ${theme.border}`, background: theme.panelSolid, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ ...card(theme, { flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 18 }) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>

                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search documents, uploader, tag..."
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: 13,
                                color: theme.text,
                                flex: 1,
                            }}
                        />

                        {query && (
                            <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMute, fontSize: 16 }}>
                                ×
                            </button>
                        )}
                    </div>

                    <PremiumSelect
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="All statuses"
                        theme={theme}
                        darkMode={darkMode}
                        minWidth={170}
                    />

                    <PremiumSelect
                        options={typeOptions}
                        value={typeFilter}
                        onChange={setTypeFilter}
                        placeholder="All file types"
                        theme={theme}
                        darkMode={darkMode}
                        minWidth={160}
                    />

                    <div style={{ ...card(theme, { display: 'inline-flex', padding: 6, borderRadius: 18, gap: 6, background: theme.panelSoft }) }}>
                        {[
                            {
                                value: 'grid',
                                label: 'Grid',
                                icon: (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                    </svg>
                                ),
                            },
                            {
                                value: 'list',
                                label: 'List',
                                icon: (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                ),
                            },
                        ].map((item) => {
                            const active = viewMode === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setViewMode(item.value)}
                                    style={{
                                        height: 40,
                                        padding: '0 14px',
                                        borderRadius: 14,
                                        border: 'none',
                                        background: active ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` : 'transparent',
                                        color: active ? '#fff' : theme.textSoft,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 18, background: theme.panelSolid }}>
                    {filtered.length === 0 ? (
                        <div style={{
                            ...card(theme, {
                                flex: 1,
                                minHeight: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: 30
                            })
                        }}>
                            <div>
                                <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: 24, background: theme.panelSoft, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMute }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: 16, color: theme.text, fontWeight: 900 }}>No documents found</div>
                                <div style={{ marginTop: 6, fontSize: 12.5, color: theme.textMute }}>
                                    Try adjusting search or filters.
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                            {filtered.map((doc) => (
                                <DocumentCard
                                    key={doc.id}
                                    doc={doc}
                                    onDownload={setDownloadTarget}
                                    onDelete={setDeleteTarget}
                                    darkMode={darkMode}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ ...card(theme, { overflow: 'hidden' }) }}>
                            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style>{`.hide-scroll::-webkit-scrollbar{display:none}`}</style>
                                <table className="hide-scroll" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: theme.tableHead, borderBottom: `1px solid ${theme.border}` }}>
                                            {['Document', 'Status', 'Languages', 'Created', 'Uploader', 'Tags', 'Actions'].map((head) => (
                                                <th
                                                    key={head}
                                                    style={{
                                                        padding: '15px 18px',
                                                        textAlign: 'left',
                                                        fontSize: 11,
                                                        fontWeight: 900,
                                                        color: theme.textMute,
                                                        letterSpacing: '0.08em',
                                                        textTransform: 'uppercase',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {head}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((doc, index) => (
                                            <ListRow
                                                key={doc.id}
                                                doc={doc}
                                                onDownload={setDownloadTarget}
                                                onDelete={setDeleteTarget}
                                                darkMode={darkMode}
                                                isLast={index === filtered.length - 1}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DownloadModal document={downloadTarget} hasApi={hasApi} onClose={() => setDownloadTarget(null)} darkMode={darkMode} />
            <DeleteConfirm document={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} darkMode={darkMode} />
        </>
    );
}
