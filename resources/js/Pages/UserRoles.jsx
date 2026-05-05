import { useState, useEffect, useRef, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';

const COUNTRIES = [
    { code: 'myanmar', label: 'Myanmar' },
    { code: 'vietnam', label: 'Vietnam' },
    { code: 'korea', label: 'Korea' },
    { code: 'cambodia', label: 'Cambodia' },
    { code: 'japan', label: 'Japan' },
];

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
            modalHeader: 'linear-gradient(135deg, rgba(76,29,149,0.96) 0%, rgba(30,64,175,0.96) 100%)',
            rowHover: 'rgba(255,255,255,0.03)',
            glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.22), transparent 42%), radial-gradient(circle at bottom left, rgba(37,99,235,0.16), transparent 38%)',
            chipShadow: '0 10px 24px rgba(0,0,0,0.16)',
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
        modalHeader: 'linear-gradient(135deg, #6d28d9 0%, #1d4ed8 100%)',
        rowHover: '#fbfbfe',
        glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 44%), radial-gradient(circle at bottom left, rgba(37,99,235,0.07), transparent 40%)',
        chipShadow: '0 10px 24px rgba(15,23,42,0.05)',
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
        background: hasError
            ? (theme.panelSolid === '#0b1324' ? 'rgba(127,29,29,0.12)' : '#fef2f2')
            : theme.inputBg,
        color: theme.text,
        transition: 'all 0.18s ease',
        boxShadow: hasError ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
    };
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
                    <div style={{ marginTop: 6, fontSize: 13, color: theme.textMute, lineHeight: 1.6 }}>
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

// FIX 1: scrollbar hidden inside dropdown list
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
        opt => String(opt.value) === String(value) && !opt.disabled
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
                onClick={() => setOpen(v => !v)}
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
                }}
            >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selected ? (
                        renderOption ? renderOption(selected, true, true) : (
                            <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    {/* FIX 1: scrollbar hidden */}
                    <div style={{ maxHeight: 260, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                </div>
            )}
        </div>
    );
}

function CountryFlag({ code, size = 20 }) {
    const h = Math.round(size * 0.6);
    const flags = {
        myanmar: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, display: 'block' }}>
                <rect width="900" height="200" y="0" fill="#FECB00"/>
                <rect width="900" height="200" y="200" fill="#34B233"/>
                <rect width="900" height="200" y="400" fill="#EA2839"/>
                <polygon points="450,30 480,140 600,140 505,210 540,320 450,250 360,320 395,210 300,140 420,140" fill="white"/>
            </svg>
        ),
        vietnam: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, display: 'block' }}>
                <rect width="900" height="600" fill="#DA251D"/>
                <polygon points="450,120 492,250 630,250 518,330 560,460 450,380 340,460 382,330 270,250 408,250" fill="#FFFF00"/>
            </svg>
        ),
        korea: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, display: 'block' }}>
                <rect width="900" height="600" fill="#ffffff"/>
                <circle cx="450" cy="300" r="150" fill="#C60C30"/>
                <path d="M450,150 A150,150 0 0,1 450,450" fill="#003478"/>
                <circle cx="450" cy="225" r="75" fill="#C60C30"/>
                <circle cx="450" cy="375" r="75" fill="#003478"/>
            </svg>
        ),
        cambodia: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, display: 'block' }}>
                <rect width="900" height="600" fill="#032EA1"/>
                <rect width="900" height="300" y="150" fill="#E00025"/>
                <g fill="white">
                    <rect x="375" y="215" width="150" height="170"/>
                    <rect x="363" y="195" width="40" height="25"/>
                    <rect x="430" y="175" width="40" height="45"/>
                    <rect x="497" y="195" width="40" height="25"/>
                    <rect x="330" y="235" width="48" height="150"/>
                    <rect x="522" y="235" width="48" height="150"/>
                </g>
            </svg>
        ),
        japan: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, display: 'block' }}>
                <rect width="900" height="600" fill="#ffffff"/>
                <circle cx="450" cy="300" r="180" fill="#BC002D"/>
            </svg>
        ),
    };
    return flags[code] || <span style={{ fontSize: size * 0.7 }}>•</span>;
}

function Avatar({ user, size = 42, darkMode = false }) {
    const colors = { admin: '#7c3aed', hr: '#059669', management: '#2563eb', employee: '#d97706' };
    const color = colors[user?.role?.name] || '#6b7280';
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

    if (user?.avatar_url) {
        return (
            <img
                src={`/storage/${user.avatar_url}`}
                alt={user.name}
                style={{
                    width: size,
                    height: size,
                    borderRadius: 16,
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.06)',
                    boxShadow: '0 12px 24px rgba(15,23,42,0.12)',
                }}
            />
        );
    }

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 16,
                background: darkMode
                    ? `linear-gradient(135deg, ${color}38, rgba(255,255,255,0.06))`
                    : `linear-gradient(135deg, ${color}20, rgba(255,255,255,0.9))`,
                color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: size * 0.34,
                flexShrink: 0,
                border: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.05)',
            }}
        >
            {initials}
        </div>
    );
}

function RoleBadge({ role, darkMode = false }) {
    const map = {
        admin: { bg: darkMode ? 'rgba(124,58,237,0.16)' : '#ede9fe', color: '#7c3aed' },
        hr: { bg: darkMode ? 'rgba(5,150,105,0.16)' : '#d1fae5', color: '#059669' },
        management: { bg: darkMode ? 'rgba(37,99,235,0.16)' : '#dbeafe', color: '#2563eb' },
        employee: { bg: darkMode ? 'rgba(217,119,6,0.16)' : '#fef3c7', color: '#d97706' },
    };
    const c = map[role?.name] || { bg: darkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: '#6b7280' };

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
                background: c.bg,
                color: c.color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                boxShadow: darkMode ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
            {role?.display_name || 'No Role'}
        </span>
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

// FIX 4: Modal scrollbar hidden
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
                        position: 'relative',
                        flexShrink: 0,
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

                {/* FIX 4: scrollbarWidth none */}
                <div style={{ overflowY: 'auto', padding: '22px 24px 24px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function FieldError({ msg, darkMode = false }) {
    const theme = getTheme(darkMode);
    if (!msg) return null;

    return (
        <p style={{ fontSize: 11, color: theme.danger, marginTop: 7, fontWeight: 700 }}>
            {msg}
        </p>
    );
}

// FIX 3: currentUser prop added — HR role sees read-only country badge
function UserForm({ roles, editUser, onClose, darkMode = false, currentUser = null }) {
    const theme = getTheme(darkMode);
    const isEdit = !!editUser;
    const isHR = currentUser?.role === 'hr';

    const form = useForm({
        name: editUser?.name || '',
        email: editUser?.email || '',
        password: '',
        role_id: editUser?.role?.id ? String(editUser.role.id) : '',
        department: editUser?.department || '',
        position: editUser?.position || '',
        phone: editUser?.phone || '',
        date_of_birth: editUser?.date_of_birth ? String(editUser.date_of_birth).split('T')[0] : '',
        is_active: editUser?.is_active ?? true,
        avatar: null,
        remove_avatar: false,
        _method: isEdit ? 'PUT' : 'POST',
        // FIX 3: HR → auto-fill own country; admin → empty for manual selection
        country: editUser?.country || (isHR ? (currentUser?.country || '') : ''),
        joined_date: editUser?.joined_date ? String(editUser.joined_date).split('T')[0] : new Date().toISOString().split('T')[0],
        employment_type: editUser?.employment_type || 'probation',
        contract_end_date: editUser?.contract_end_date ? String(editUser.contract_end_date).split('T')[0] : '',
    });

    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(editUser?.avatar_url ? `/storage/${editUser.avatar_url}` : null);

    const lbl = {
        fontSize: 12,
        fontWeight: 800,
        color: theme.textSoft,
        display: 'block',
        marginBottom: 7,
    };

    const roleOptions = [
        { value: '', label: 'Select role...' },
        ...roles.map(r => ({
            value: String(r.id),
            label: r.display_name,
        })),
    ];

    const employmentTypeOptions = [
        { value: 'probation', label: 'Probation' },
        { value: 'permanent', label: 'Permanent' },
        { value: 'contract', label: 'Contract' },
    ];

    const countryOptions = [
        { value: '', label: 'Select country...', disabled: true },
        ...COUNTRIES.map(c => ({
            value: c.code,
            label: c.label,
            code: c.code,
        })),
    ];

    const submit = (e) => {
        e.preventDefault();

        const url = isEdit ? `/users/${editUser.id}` : '/users';

        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                // window.dispatchEvent(new CustomEvent('global-toast', {
                //     detail: {
                //         message: isEdit ? 'User updated successfully!' : 'User created successfully!',
                //         type: 'success'
                //     }
                // }));
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                if (firstErr) {
                    window.dispatchEvent(new CustomEvent('global-toast', {
                        detail: { message: firstErr, type: 'error' }
                    }));
                }
            },
        });
    };

    return (
        <form onSubmit={submit} encType="multipart/form-data">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Full Name <span style={{ color: theme.danger }}>*</span></label>
                    <input value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="John Doe" style={inputStyle(theme, !!form.errors.name)} />
                    <FieldError msg={form.errors.name} darkMode={darkMode} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Email Address <span style={{ color: theme.danger }}>*</span></label>
                    <input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} placeholder="john@vibeme.ai" style={inputStyle(theme, !!form.errors.email)} />
                    <FieldError msg={form.errors.email} darkMode={darkMode} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Date of Birth <span style={{ color: theme.danger }}>*</span></label>
                    <input
                        type="date"
                        value={form.data.date_of_birth || ''}
                        onChange={e => form.setData('date_of_birth', e.target.value)}
                        style={inputStyle(theme, !!form.errors.date_of_birth)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                    <FieldError msg={form.errors.date_of_birth} darkMode={darkMode} />
                </div>

                {/* FIX 3: HR → read-only country badge; admin → dropdown selector */}
                {isHR ? (
                    <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbl}>Country</label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 15px',
                            borderRadius: 16,
                            background: theme.panelSoft,
                            border: `1px solid ${theme.border}`,
                        }}>
                            {currentUser?.country && <CountryFlag code={currentUser.country} size={20} />}
                            <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>
                                {currentUser?.country
                                    ? currentUser.country.charAt(0).toUpperCase() + currentUser.country.slice(1)
                                    : '—'}
                            </span>
                            <span style={{ fontSize: 11, color: theme.textMute, marginLeft: 'auto' }}>
                                Auto-assigned
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{ gridColumn: '1/-1', position: 'relative', zIndex: 900 }}>
                        <label style={lbl}>Country <span style={{ color: theme.danger }}>*</span></label>
                        <PremiumSelect
                            options={countryOptions}
                            value={form.data.country}
                            onChange={(val) => form.setData('country', val)}
                            placeholder="Select country..."
                            theme={theme}
                            darkMode={darkMode}
                            minWidth={0}
                            width="100%"
                            zIndex={900}
                            renderOption={(opt, isTriggerView, isSelectedItem) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' }}>
                                    {opt.code ? <CountryFlag code={opt.code} size={22} /> : null}
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: isTriggerView || isSelectedItem ? 800 : 600,
                                            color: isTriggerView
                                                ? theme.text
                                                : isSelectedItem
                                                    ? '#ffffff'
                                                    : theme.textSoft,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {opt.label}
                                    </span>
                                </div>
                            )}
                        />
                        <FieldError msg={form.errors.country} darkMode={darkMode} />
                    </div>
                )}

                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>{isEdit ? 'New Password' : 'Password'} {!isEdit && <span style={{ color: theme.danger }}>*</span>}</label>
                    <input type="password" value={form.data.password} onChange={e => form.setData('password', e.target.value)} placeholder="••••••••" style={inputStyle(theme, !!form.errors.password)} />
                    <FieldError msg={form.errors.password} darkMode={darkMode} />
                </div>

                <div>
                    <label style={lbl}>Role <span style={{ color: theme.danger }}>*</span></label>
                    <PremiumSelect
                        options={roleOptions}
                        value={form.data.role_id}
                        onChange={(val) => form.setData('role_id', val)}
                        placeholder="Select role..."
                        theme={theme}
                        darkMode={darkMode}
                        minWidth={0}
                        width="100%"
                        zIndex={300}
                    />
                    <FieldError msg={form.errors.role_id} darkMode={darkMode} />
                </div>

                <div>
                    <label style={lbl}>Department</label>
                    <input value={form.data.department} onChange={e => form.setData('department', e.target.value)} placeholder="Engineering" style={inputStyle(theme, !!form.errors.department)} />
                    <FieldError msg={form.errors.department} darkMode={darkMode} />
                </div>

                <div>
                    <label style={lbl}>Position</label>
                    <input value={form.data.position} onChange={e => form.setData('position', e.target.value)} placeholder="Senior Developer" style={inputStyle(theme, !!form.errors.position)} />
                    <FieldError msg={form.errors.position} darkMode={darkMode} />
                </div>

                <div>
                    <label style={lbl}>Phone</label>
                    <input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} placeholder="+855 12 345 678" style={inputStyle(theme, !!form.errors.phone)} />
                    <FieldError msg={form.errors.phone} darkMode={darkMode} />
                </div>

                <div>
                    <label style={lbl}>Joined Date</label>
                    <input type="date" value={form.data.joined_date || ''} onChange={e => form.setData('joined_date', e.target.value)} style={inputStyle(theme, !!form.errors.joined_date)} />
                    <FieldError msg={form.errors.joined_date} darkMode={darkMode} />
                </div>

                <div>
                    <label style={lbl}>Employment Type</label>
                    <PremiumSelect
                        options={employmentTypeOptions}
                        value={form.data.employment_type || 'probation'}
                        onChange={(val) => form.setData('employment_type', val)}
                        placeholder="Select employment type..."
                        theme={theme}
                        darkMode={darkMode}
                        minWidth={0}
                        width="100%"
                    />
                    <FieldError msg={form.errors.employment_type} darkMode={darkMode} />
                </div>

                {form.data.employment_type === 'contract' && (
                    <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbl}>Contract End Date <span style={{ color: theme.danger }}>*</span></label>
                        <input type="date" value={form.data.contract_end_date || ''} onChange={e => form.setData('contract_end_date', e.target.value)} style={inputStyle(theme, !!form.errors.contract_end_date)} min={new Date().toISOString().split('T')[0]} />
                        <FieldError msg={form.errors.contract_end_date} darkMode={darkMode} />
                    </div>
                )}

                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Profile Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, border: `1px solid ${theme.inputBorder}`, borderRadius: 16, padding: '10px 12px', background: theme.inputBg }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        form.setData('avatar', file);
                                        setPreviewUrl(URL.createObjectURL(file));
                                    }
                                }}
                                style={{ fontSize: 13, color: theme.textSoft, width: '100%' }}
                            />
                        </div>

                        {previewUrl && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewUrl(null);
                                    form.setData('avatar', null);
                                    form.setData('remove_avatar', true);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 14,
                                    border: `1px solid ${theme.border}`,
                                    background: theme.dangerSoft,
                                    cursor: 'pointer',
                                    color: theme.danger,
                                    fontSize: 18,
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {previewUrl && (
                        <div style={{ marginTop: 14 }}>
                            <img src={previewUrl} alt="preview" style={{ width: 86, height: 86, borderRadius: 20, objectFit: 'cover', border: `1px solid ${theme.borderStrong}`, boxShadow: theme.shadowSoft }} />
                        </div>
                    )}

                    <FieldError msg={form.errors.avatar} darkMode={darkMode} />
                </div>

                {isEdit && (
                    <div
                        style={{
                            gridColumn: '1/-1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '13px 15px',
                            background: theme.panelSoft,
                            borderRadius: 18,
                            border: `1px solid ${theme.border}`,
                        }}
                    >
                        <label style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft, flex: 1 }}>
                            Active Status
                        </label>

                        <button
                            type="button"
                            onClick={() => form.setData('is_active', !form.data.is_active)}
                            style={{
                                width: 50,
                                height: 28,
                                borderRadius: 999,
                                border: 'none',
                                cursor: 'pointer',
                                background: form.data.is_active ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : '#cbd5e1',
                                position: 'relative',
                            }}
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 3,
                                    left: form.data.is_active ? 25 : 3,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                                    transition: 'left 0.2s ease',
                                }}
                            />
                        </button>

                        <span style={{ fontSize: 12, color: form.data.is_active ? theme.success : theme.textMute, fontWeight: 900, minWidth: 55 }}>
                            {form.data.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 26, justifyContent: 'flex-end' }}>
                <UIButton type="button" onClick={onClose} variant="ghost" theme={theme}>
                    Cancel
                </UIButton>

                <UIButton type="submit" disabled={form.processing} variant="primary" theme={theme}>
                    {form.processing && (
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    )}
                    {form.processing ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
                </UIButton>
            </div>
        </form>
    );
}

function DeleteConfirm({ user, onClose, onConfirm, loading, darkMode = false }) {
    const theme = getTheme(darkMode);

    return (
        <div style={{ textAlign: 'center', padding: '8px 0 2px' }}>
            <div
                style={{
                    width: 78,
                    height: 78,
                    margin: '0 auto 18px',
                    borderRadius: 24,
                    background: theme.dangerSoft,
                    color: theme.danger,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${theme.border}`,
                }}
            >
                <ActionGlyph type="delete" color={theme.danger} />
            </div>

            <h4 style={{ fontSize: 22, fontWeight: 900, color: theme.text, marginBottom: 8 }}>
                Delete User?
            </h4>

            <p style={{ fontSize: 13, color: theme.textMute, marginBottom: 24, lineHeight: 1.7 }}>
                Are you sure you want to delete <strong style={{ color: theme.text }}>{user?.name}</strong>?<br />
                This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <UIButton onClick={onClose} variant="ghost" theme={theme}>Cancel</UIButton>
                <UIButton onClick={onConfirm} disabled={loading} variant="danger" theme={theme}>
                    {loading ? 'Deleting...' : 'Yes, Delete'}
                </UIButton>
            </div>
        </div>
    );
}

// FIX 3: currentUser prop added to component signature
export default function UserRoles({ users = [], roles = [], roleName = '', currentUser = null }) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [filterCountry, setFilterCountry] = useState('');
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        if (!deleteUser?.id) return;

        setDeleting(true);

        router.delete(`/users/${deleteUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                // window.dispatchEvent(new CustomEvent('global-toast', {
                //     detail: { message: 'User deleted successfully!', type: 'success' }
                // }));
                setDeleteUser(null);
            },
            onError: () => {
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: { message: 'Failed to delete user.', type: 'error' }
                }));
            },
            onFinish: () => {
                setDeleting(false);
            },
        });
    };

    const handleToggle = (user) => {
        if (!user?.id) return;

        router.patch(`/users/${user.id}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                // window.dispatchEvent(new CustomEvent('global-toast', {
                //     detail: {
                //         message: `${user.name} marked as ${user.is_active ? 'inactive' : 'active'}!`,
                //         type: 'success'
                //     }
                // }));
            },
            onError: () => {
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: { message: 'Failed to update status.', type: 'error' }
                }));
            },
        });
    };

    const filtered = users.filter(u => {
        const s = search.toLowerCase();
        const matchSearch = u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
        const matchRole = filterRole ? u.role?.name === filterRole : true;
        const matchCountry = filterCountry ? u.country === filterCountry : true;
        return matchSearch && matchRole && matchCountry;
    });

    const roleMap = {
        admin: { bg: darkMode ? 'rgba(124,58,237,0.16)' : '#ede9fe', color: '#7c3aed', line: 'System control' },
        hr: { bg: darkMode ? 'rgba(5,150,105,0.16)' : '#d1fae5', color: '#059669', line: 'People operations' },
        management: { bg: darkMode ? 'rgba(37,99,235,0.16)' : '#dbeafe', color: '#2563eb', line: 'Team leadership' },
        employee: { bg: darkMode ? 'rgba(217,119,6,0.16)' : '#fef3c7', color: '#d97706', line: 'Workspace members' },
        driver:     { bg: darkMode ? 'rgba(234,88,12,0.16)'  : '#ffedd5', color: '#ea580c', line: 'Vehicle operator' }, // ← ထည့်
    };

    const totalActive = users.filter(u => u.is_active).length;

    const countryOptions = [
        { value: '', label: 'All Countries' },
        { value: 'cambodia', label: 'Cambodia', code: 'cambodia' },
        { value: 'myanmar', label: 'Myanmar', code: 'myanmar' },
        { value: 'vietnam', label: 'Vietnam', code: 'vietnam' },
        { value: 'korea', label: 'Korea', code: 'korea' },
        { value: 'japan', label: 'Japan', code: 'japan' },
    ];

    const roleOptions = [
        { value: '', label: 'All Roles' },           // ← disabled မပါ၊ ပြန်ရွေးနိုင်
        ...roles.map(r => ({
            value: r.name,                            // ← id မဟုတ်ဘဲ name သိမ်း
            label: r.display_name,
        })),
    ];

    return (
        <AppLayout title="User & Roles">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes modalIn {
                    from { opacity:0; transform:translateY(10px) scale(0.98); }
                    to { opacity:1; transform:translateY(0) scale(1); }
                }
                /* FIX 1: dropdown inner scrollbar webkit hidden */
                .ur-dd-inner::-webkit-scrollbar { display: none; }
                /* FIX 2: table horizontal scrollbar hidden */
                .ur-table-wrap { scrollbar-width: none; -ms-overflow-style: none; }
                .ur-table-wrap::-webkit-scrollbar { display: none; }
                /* FIX 4: modal body scrollbar webkit hidden */
                .ur-modal-body::-webkit-scrollbar { display: none; }
            `}</style>

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ ...card(theme), padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <SectionTitle
                            eyebrow="User Management"
                            title="Premium workspace overview"
                            desc="Same flow and same logic, upgraded with a cleaner, more professional interface."
                            theme={theme}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(4, 1fr)', gap: 14, marginTop: 22 }}>
                            <div style={{ ...card(theme, { padding: 18, minHeight: 112, position: 'relative', overflow: 'hidden' }) }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.textMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Members</div>
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 32, lineHeight: 1, fontWeight: 900, color: theme.text }}>{users.length}</div>
                                        <div style={{ marginTop: 7, fontSize: 12, color: theme.textMute }}>Total registered users</div>
                                    </div>
                                    <div style={{ padding: '7px 11px', borderRadius: 999, background: theme.successSoft, color: theme.success, fontSize: 11, fontWeight: 900 }}>
                                        {totalActive} active
                                    </div>
                                </div>
                            </div>

                            {roles.map(role => {
                                const count = users.filter(u => u.role?.name === role.name).length;
                                const c = roleMap[role.name] || { bg: theme.panelSoft, color: theme.textMute, line: 'Team members' };

                                return (
                                    <div
                                        key={role.id}
                                        style={{
                                            ...card(theme),
                                            padding: 18,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            minHeight: 112,
                                        }}
                                    >
                                        <div style={{ position: 'absolute', inset: 0, background: theme.glass, opacity: 0.55, pointerEvents: 'none' }} />
                                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, boxShadow: `0 0 0 6px ${c.bg}` }} />
                                                <div style={{ fontSize: 11, color: theme.textMute, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    {role.display_name}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: c.color }}>{count}</div>
                                                <div style={{ marginTop: 8, fontSize: 12, color: theme.textMute }}>{c.line}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div
                        style={{
                            ...card(theme),
                            flex: 1,           // ← flex:1 မဟုတ်တော့ဘဲ fixed width
                            minWidth: 200,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '11px 14px',
                            borderRadius: 18,
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>

                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: 13,
                                color: theme.text,
                                flex: 1,
                            }}
                        />

                        {search && (
                            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMute, fontSize: 16 }}>
                                ×
                            </button>
                        )}
                    </div>

                    {roleName === 'admin' && (
                        <PremiumSelect
                            options={countryOptions}
                            value={filterCountry}
                            onChange={setFilterCountry}
                            placeholder="All Countries"
                            theme={theme}
                            darkMode={darkMode}
                            minWidth={180}
                            renderOption={(opt, isSelected) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    {opt.code ? <CountryFlag code={opt.code} size={20} /> : null}
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: isSelected ? 700 : 600,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {opt.label}
                                    </span>
                                </div>
                            )}
                        />
                    )}

                    <PremiumSelect
                        options={roleOptions}
                        value={filterRole}
                        onChange={setFilterRole}
                        placeholder="All Roles"
                        theme={theme}
                        darkMode={darkMode}
                        minWidth={170}
                    />

                    <UIButton onClick={() => setShowCreate(true)} variant="primary" theme={theme}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                        </svg>
                        Add New User
                    </UIButton>
                </div>

                <div style={{ ...card(theme), overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: theme.text }}>Team members</div>
                            <div style={{ marginTop: 4, fontSize: 12, color: theme.textMute }}>
                                {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
                            </div>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: theme.panelSoft, color: theme.textSoft, fontSize: 11, fontWeight: 900, boxShadow: theme.chipShadow }}>
                            Live directory
                        </div>
                    </div>

                    {/* FIX 2: horizontal scrollbar hidden */}
                    <div className="ur-table-wrap" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: theme.tableHead, borderBottom: `1px solid ${theme.border}` }}>
                                    {['User', 'Country', 'Role', 'Department', 'Position', 'Phone', 'Date of Birth', 'Employment', 'Joined', 'Status', 'Actions'].map(h => (
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
                                                whiteSpace: 'nowrap'
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
                                        <td colSpan={11} style={{ padding: 56, textAlign: 'center' }}>
                                            <div style={{ width: 64, height: 64, margin: '0 auto 14px', borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.panelSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: 15, color: theme.text, fontWeight: 900 }}>No users found</div>
                                            <div style={{ marginTop: 6, fontSize: 12, color: theme.textMute }}>Try adjusting search or filters.</div>
                                        </td>
                                    </tr>
                                ) : filtered.map((user, i) => (
                                    <tr
                                        key={user.id}
                                        style={{
                                            borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : 'none',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Avatar user={user} size={42} darkMode={darkMode} />
                                                <div>
                                                    <div style={{ fontSize: 13.5, fontWeight: 900, color: theme.text }}>{user.name}</div>
                                                    <div style={{ fontSize: 11, color: theme.textMute }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            {user.country ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <CountryFlag code={user.country} size={20} />
                                                    <span style={{ fontSize: 13, color: theme.textSoft, fontWeight: 700 }}>
                                                        {user.country.charAt(0).toUpperCase() + user.country.slice(1)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: theme.textMute }}>—</span>
                                            )}
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <RoleBadge role={user.role} darkMode={darkMode} />
                                        </td>

                                        <td style={{ padding: '16px 18px', fontSize: 12.5, color: theme.textSoft }}>
                                            {user.department || '—'}
                                        </td>

                                        <td style={{ padding: '16px 18px', fontSize: 12.5, color: theme.textSoft }}>
                                            {user.position || '—'}
                                        </td>

                                        <td style={{ padding: '16px 18px', fontSize: 12.5, color: theme.textSoft }}>
                                            {user.phone || '—'}
                                        </td>
                                        <td style={{ padding: '16px 18px', fontSize: 12, color: theme.textSoft, whiteSpace: 'nowrap' }}>
                                            {user.date_of_birth
                                                ? new Date(String(user.date_of_birth).split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })
                                                : '—'}
                                        </td>
                                        <td style={{ padding: '16px 18px' }}>
                                            {(() => {
                                                const cfg = {
                                                    probation: { bg: darkMode ? 'rgba(245,158,11,0.16)' : '#fef3c7', color: '#d97706', label: 'Probation' },
                                                    permanent: { bg: darkMode ? 'rgba(16,185,129,0.16)' : '#d1fae5', color: '#059669', label: 'Permanent' },
                                                    contract: { bg: darkMode ? 'rgba(59,130,246,0.16)' : '#dbeafe', color: '#2563eb', label: 'Contract' },
                                                };
                                                const c = cfg[user.employment_type] || cfg.probation;

                                                return (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 900, padding: '6px 10px', borderRadius: 999, background: c.bg, color: c.color }}>
                                                        {c.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>

                                        <td style={{ padding: '16px 18px', fontSize: 12, color: theme.textSoft, whiteSpace: 'nowrap' }}>
                                            {user.joined_date
                                                ? new Date(String(user.joined_date).split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : '—'}

                                            {user.employment_type === 'contract' && user.contract_end_date && (
                                                <div style={{ fontSize: 10, color: theme.secondary, fontWeight: 800, marginTop: 4 }}>
                                                    ends {new Date(String(user.contract_end_date).split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            )}
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <button
                                                onClick={() => handleToggle(user)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 7,
                                                    fontSize: 11,
                                                    fontWeight: 900,
                                                    padding: '6px 12px',
                                                    borderRadius: 999,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: user.is_active ? (darkMode ? 'rgba(16,185,129,0.16)' : '#d1fae5') : (darkMode ? 'rgba(248,113,113,0.16)' : '#fee2e2'),
                                                    color: user.is_active ? theme.success : theme.danger
                                                }}
                                            >
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.is_active ? theme.success : theme.danger, display: 'inline-block' }} />
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => setEditUser(user)}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 14,
                                                        border: `1px solid ${theme.border}`,
                                                        background: theme.panelSoft,
                                                        color: theme.textSoft,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <ActionGlyph type="edit" color={theme.textSoft} />
                                                </button>

                                                <button
                                                    onClick={() => setDeleteUser(user)}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 14,
                                                        border: `1px solid ${theme.border}`,
                                                        background: theme.dangerSoft,
                                                        color: theme.danger,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
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

            {/* FIX 3: pass currentUser to UserForm */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New User" subtitle="User Management" darkMode={darkMode}>
                <UserForm roles={roles} onClose={() => setShowCreate(false)} darkMode={darkMode} currentUser={currentUser} />
            </Modal>

            <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" subtitle="Update Profile" darkMode={darkMode}>
                {editUser && (
                    <UserForm key={editUser.id} roles={roles} editUser={editUser} onClose={() => setEditUser(null)} darkMode={darkMode} currentUser={currentUser} />
                )}
            </Modal>

            <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="Confirm Delete" subtitle="Danger Zone" darkMode={darkMode}>
                <DeleteConfirm user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDelete} loading={deleting} darkMode={darkMode} />
            </Modal>
        </AppLayout>
    );
}