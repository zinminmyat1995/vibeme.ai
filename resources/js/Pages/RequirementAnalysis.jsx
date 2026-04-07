import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage, router } from '@inertiajs/react';

// ── Complexity config ──────────────────────────────
const COMPLEXITY = {
    simple:     { label: 'Simple',     color: '#10b981', bg: '#d1fae5' },
    medium:     { label: 'Medium',     color: '#f59e0b', bg: '#fef3c7' },
    complex:    { label: 'Complex',    color: '#ef4444', bg: '#fee2e2' },
    enterprise: { label: 'Enterprise', color: '#8b5cf6', bg: '#ede9fe' },
};

const STATUS = {
    pending:   { label: 'Pending',   color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
    analyzing: { label: 'Analyzing', color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
    completed: { label: 'Completed', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
    failed:    { label: 'Failed',    color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
};

const PLATFORMS = ['web', 'mobile', 'both', 'desktop'];
const BUDGET_RANGES = ['< $5,000', '$5,000 – $15,000', '$15,000 – $50,000', '$50,000 – $100,000', '> $100,000'];
const COMMON_FEATURES = [
    'User Authentication', 'Dashboard & Analytics', 'Role & Permissions',
    'Notifications', 'File Upload', 'Payment Integration',
    'API Integration', 'Reporting & Export', 'Multi-language',
    'Mobile Responsive', 'Real-time Updates', 'Search & Filter',
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
        background: hasError
            ? (theme.panelSolid === '#0b1324' ? 'rgba(127,29,29,0.12)' : '#fef2f2')
            : theme.inputBg,
        color: theme.text,
        transition: 'all 0.18s ease',
        boxShadow: hasError ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
    };
}
const hiddenScrollbar = {
    scrollbarWidth: 'none',      // Firefox
    msOverflowStyle: 'none',     // IE/Edge old
};

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
            <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: ok ? theme.success : theme.danger,
                flexShrink: 0
            }} />
            <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: ok ? theme.successText : theme.errorText,
                flex: 1
            }}>
                {message}
            </span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: theme.textMute,
                    lineHeight: 1
                }}
            >
                ×
            </button>
        </div>
    );
}

function StatusBadge({ status, darkMode = false }) {
    const theme = getTheme(darkMode);
    const s = STATUS[status] || STATUS.pending;

    const darkMap = {
        pending:   { bg: 'rgba(148,163,184,0.16)', color: '#cbd5e1', dot: '#94a3b8' },
        analyzing: { bg: 'rgba(37,99,235,0.16)', color: '#93c5fd', dot: '#3b82f6' },
        completed: { bg: 'rgba(16,185,129,0.16)', color: '#86efac', dot: '#10b981' },
        failed:    { bg: 'rgba(239,68,68,0.16)', color: '#fca5a5', dot: '#ef4444' },
    };

    const styleSet = darkMode ? darkMap[status] || darkMap.pending : s;

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
            <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: styleSet.dot,
                display: 'inline-block',
                ...(status === 'analyzing' ? { animation: 'pulse 1s infinite' } : {}),
            }} />
            {s.label}
        </span>
    );
}

function ComplexityBadge({ complexity, darkMode = false }) {
    const c = COMPLEXITY[complexity];
    if (!c) return null;

    const darkMap = {
        simple:     { bg: 'rgba(16,185,129,0.16)', color: '#86efac' },
        medium:     { bg: 'rgba(245,158,11,0.16)', color: '#fcd34d' },
        complex:    { bg: 'rgba(239,68,68,0.16)', color: '#fca5a5' },
        enterprise: { bg: 'rgba(139,92,246,0.16)', color: '#c4b5fd' },
    };

    const styleSet = darkMode ? darkMap[complexity] || darkMap.simple : c;

    return (
        <span style={{
            fontSize: 10,
            fontWeight: 900,
            padding: '6px 10px',
            borderRadius: 999,
            background: styleSet.bg,
            color: styleSet.color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
        }}>
            {c.label}
        </span>
    );
}

function FeasibilityRing({ score, darkMode = false }) {
    const theme = getTheme(darkMode);
    if (!score && score !== 0) return null;
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const r = 18;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={r} fill="none" stroke={darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6'} strokeWidth="4" />
                <circle
                    cx="22"
                    cy="22"
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={circ / 4}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                />
                <text x="22" y="27" textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{score}</text>
            </svg>
            <span style={{ fontSize: 11, color: theme.textMute, fontWeight: 700 }}>Feasibility</span>
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
            gap: 6
        }}>
            <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: theme.danger,
                display: 'inline-block'
            }} />
            {msg}
        </p>
    );
}

function StepPill({ index, active, completed }) {
    return (
        <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 900,
            flexShrink: 0,
            background: active || completed ? '#fff' : 'rgba(255,255,255,0.25)',
            color: active || completed ? '#6d28d9' : 'rgba(255,255,255,0.6)',
            transition: 'all 0.2s',
            boxShadow: completed ? '0 8px 18px rgba(255,255,255,0.18)' : 'none',
        }}>
            {completed ? '•' : index}
        </div>
    );
}

function NewRequirementModal({ onClose, onSuccess, darkMode = false }) {
    const theme = getTheme(darkMode);
    const [step, setStep] = useState(1);
    const [stepErrors, setStepErrors] = useState({});

    const form = useForm({
        company_name: '', contact_person: '', email: '', phone: '', industry: '',
        project_title: '', project_description: '', core_features: [],
        platform: 'web', expected_users: '', integration_needs: '',
        budget_range: '', expected_deadline: '', special_requirements: '',
    });

    const toggleFeature = (f) => {
        const arr = form.data.core_features;
        form.setData('core_features', arr.includes(f) ? arr.filter(x => x !== f) : [...arr, f]);
        if (stepErrors.core_features) setStepErrors(e => ({ ...e, core_features: '' }));
    };

    const validateStep = (s) => {
        const errs = {};
        if (s === 1) {
            if (!form.data.company_name.trim()) errs.company_name = 'Company name is required.';
            if (!form.data.contact_person.trim()) errs.contact_person = 'Contact person is required.';
            if (form.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.data.email)) {
                errs.email = 'Please enter a valid email address.';
            }
        }
        if (s === 2) {
            if (!form.data.project_title.trim()) errs.project_title = 'Project title is required.';
            if (!form.data.project_description.trim()) errs.project_description = 'Project description is required.';
            if (form.data.project_description.trim().length < 20) {
                errs.project_description = 'Description must be at least 20 characters.';
            }
            if (!form.data.budget_range) errs.budget_range = 'Please select a budget range.';
            if (!form.data.expected_deadline) errs.expected_deadline = 'Please set an expected deadline.';
        }
        if (s === 3) {
            if (form.data.core_features.length === 0) {
                errs.core_features = 'Please select at least one core feature.';
            }
        }
        return errs;
    };

    const handleNext = () => {
        const errs = validateStep(step);
        if (Object.keys(errs).length > 0) {
            setStepErrors(errs);
            return;
        }
        setStepErrors({});
        setStep(s => s + 1);
    };

    const submit = (e) => {
        e.preventDefault();
        const errs = validateStep(3);
        if (Object.keys(errs).length > 0) {
            setStepErrors(errs);
            return;
        }
        form.post('/requirement-analysis', {
            onSuccess: () => {
                onSuccess('Requirement submitted and AI analysis started.');
                onClose();
            },
        });
    };

    const inp = (field) => ({
        ...inputStyle(theme, !!(stepErrors[field] || form.errors[field])),
    });

    const lbl = {
        fontSize: 12,
        fontWeight: 800,
        color: theme.textSoft,
        display: 'block',
        marginBottom: 7,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
    };

    const stepLabels = ['Client Info', 'Project Details', 'Requirements'];

    const platformOptions = PLATFORMS.map(p => ({
        value: p,
        label: p.charAt(0).toUpperCase() + p.slice(1),
    }));

    const budgetOptions = [
        { value: '', label: 'Select budget...', disabled: true },
        ...BUDGET_RANGES.map(b => ({ value: b, label: b })),
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
                                New Requirement Analysis
                            </h2>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', margin: '5px 0 0' }}>
                                AI will analyze and provide insights automatically.
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 18, position: 'relative' }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <StepPill index={s} active={step === s} completed={step > s} />
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: step >= s ? '#fff' : 'rgba(255,255,255,0.55)',
                                        whiteSpace: 'nowrap',
                                        letterSpacing: '0.04em',
                                    }}>
                                        {stepLabels[s - 1]}
                                    </span>
                                </div>
                                {s < 3 && (
                                    <div style={{
                                        flex: 1,
                                        height: 1,
                                        margin: '0 10px',
                                        background: step > s ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                                        transition: 'background 0.3s',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div
                        className="hide-scrollbar"
                        style={{
                            padding: '24px 28px',
                            overflowY: 'auto',
                            maxHeight: 'calc(92vh - 250px)',
                            ...hiddenScrollbar,
                        }}
                    >
                        {step === 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Company Name <span style={{ color: theme.danger }}>*</span></label>
                                    <input
                                        value={form.data.company_name}
                                        onChange={e => { form.setData('company_name', e.target.value); setStepErrors(x => ({ ...x, company_name: '' })); }}
                                        placeholder="Acme Corporation"
                                        style={inp('company_name')}
                                    />
                                    <FieldError msg={stepErrors.company_name || form.errors.company_name} darkMode={darkMode} />
                                </div>

                                <div>
                                    <label style={lbl}>Contact Person <span style={{ color: theme.danger }}>*</span></label>
                                    <input
                                        value={form.data.contact_person}
                                        onChange={e => { form.setData('contact_person', e.target.value); setStepErrors(x => ({ ...x, contact_person: '' })); }}
                                        placeholder="John Smith"
                                        style={inp('contact_person')}
                                    />
                                    <FieldError msg={stepErrors.contact_person || form.errors.contact_person} darkMode={darkMode} />
                                </div>

                                <div>
                                    <label style={lbl}>Industry</label>
                                    <input
                                        value={form.data.industry}
                                        onChange={e => form.setData('industry', e.target.value)}
                                        placeholder="e.g. Healthcare, Finance"
                                        style={inp('industry')}
                                    />
                                </div>

                                <div>
                                    <label style={lbl}>Email</label>
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={e => { form.setData('email', e.target.value); setStepErrors(x => ({ ...x, email: '' })); }}
                                        placeholder="john@company.com"
                                        style={inp('email')}
                                    />
                                    <FieldError msg={stepErrors.email || form.errors.email} darkMode={darkMode} />
                                </div>

                                <div>
                                    <label style={lbl}>Phone</label>
                                    <input
                                        value={form.data.phone}
                                        onChange={e => form.setData('phone', e.target.value)}
                                        placeholder="+1 234 567 8900"
                                        style={inp('phone')}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Project Title <span style={{ color: theme.danger }}>*</span></label>
                                    <input
                                        value={form.data.project_title}
                                        onChange={e => { form.setData('project_title', e.target.value); setStepErrors(x => ({ ...x, project_title: '' })); }}
                                        placeholder="e.g. Hospital Management System"
                                        style={inp('project_title')}
                                    />
                                    <FieldError msg={stepErrors.project_title || form.errors.project_title} darkMode={darkMode} />
                                </div>

                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Project Description <span style={{ color: theme.danger }}>*</span></label>
                                    <textarea
                                        className="hide-scrollbar"
                                        value={form.data.project_description}
                                        onChange={e => { form.setData('project_description', e.target.value); setStepErrors(x => ({ ...x, project_description: '' })); }}
                                        placeholder="Describe what the client needs in detail (min. 20 characters)..."
                                        rows={5}
                                        style={{
                                            ...inp('project_description'),
                                            resize: 'vertical',
                                            lineHeight: 1.6,
                                            minHeight: 130,
                                            ...hiddenScrollbar,
                                        }}
                                    />
                                    <FieldError msg={stepErrors.project_description || form.errors.project_description} darkMode={darkMode} />
                                </div>

                                <div style={{ position: 'relative', zIndex: 220 }}>
                                    <label style={lbl}>Platform <span style={{ color: theme.danger }}>*</span></label>
                                    <PremiumSelect
                                        options={platformOptions}
                                        value={form.data.platform}
                                        onChange={(val) => form.setData('platform', val)}
                                        placeholder="Select platform..."
                                        theme={theme}
                                        darkMode={darkMode}
                                        minWidth={0}
                                        width="100%"
                                        zIndex={220}
                                    />
                                </div>

                                <div>
                                    <label style={lbl}>Expected Users</label>
                                    <input
                                        type="number"
                                        value={form.data.expected_users}
                                        onChange={e => form.setData('expected_users', e.target.value)}
                                        placeholder="e.g. 500"
                                        style={inp('expected_users')}
                                    />
                                </div>

                                <div style={{ position: 'relative', zIndex: 210 }}>
                                    <label style={lbl}>Budget Range <span style={{ color: theme.danger }}>*</span></label>
                                    <PremiumSelect
                                        options={budgetOptions}
                                        value={form.data.budget_range}
                                        onChange={(val) => { form.setData('budget_range', val); setStepErrors(x => ({ ...x, budget_range: '' })); }}
                                        placeholder="Select budget..."
                                        theme={theme}
                                        darkMode={darkMode}
                                        minWidth={0}
                                        width="100%"
                                        zIndex={210}
                                    />
                                    <FieldError msg={stepErrors.budget_range || form.errors.budget_range} darkMode={darkMode} />
                                </div>

                                <div>
                                    <label style={lbl}>Expected Deadline <span style={{ color: theme.danger }}>*</span></label>
                                    <input
                                        type="date"
                                        value={form.data.expected_deadline}
                                        onChange={e => { form.setData('expected_deadline', e.target.value); setStepErrors(x => ({ ...x, expected_deadline: '' })); }}
                                        style={inp('expected_deadline')}
                                    />
                                    <FieldError msg={stepErrors.expected_deadline || form.errors.expected_deadline} darkMode={darkMode} />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div>
                                    <label style={lbl}>
                                        Core Features <span style={{ color: theme.danger }}>*</span>{' '}
                                        <span style={{ fontSize: 10, color: theme.textMute, textTransform: 'none', fontWeight: 600 }}>
                                            (select at least one)
                                        </span>
                                    </label>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                                        {COMMON_FEATURES.map(f => {
                                            const selected = form.data.core_features.includes(f);
                                            return (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() => toggleFeature(f)}
                                                    style={{
                                                        padding: '8px 14px',
                                                        borderRadius: 999,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        border: `1px solid ${selected ? theme.primary : stepErrors.core_features ? '#fca5a5' : theme.borderStrong}`,
                                                        background: selected
                                                            ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                                                            : theme.panelSoft,
                                                        color: selected ? '#fff' : theme.textSoft,
                                                        transition: 'all 0.15s',
                                                        boxShadow: selected ? `0 10px 24px ${theme.primary}25` : 'none',
                                                    }}
                                                >
                                                    {selected ? `• ${f}` : f}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <FieldError msg={stepErrors.core_features} darkMode={darkMode} />
                                </div>

                                <div>
                                    <label style={lbl}>Integration Needs</label>
                                    <textarea
                                        className="hide-scrollbar"
                                        value={form.data.integration_needs}
                                        onChange={e => form.setData('integration_needs', e.target.value)}
                                        placeholder="e.g. Integrate with existing ERP, payment gateway, SMS service..."
                                        rows={4}
                                        style={{
                                            ...inp('integration_needs'),
                                            resize: 'vertical',
                                            lineHeight: 1.6,
                                            ...hiddenScrollbar,
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={lbl}>Special Requirements / Notes</label>
                                    <textarea
                                        className="hide-scrollbar"
                                        value={form.data.special_requirements}
                                        onChange={e => form.setData('special_requirements', e.target.value)}
                                        placeholder="Any other specific requirements, constraints, or notes..."
                                        rows={4}
                                        style={{
                                            ...inp('special_requirements'),
                                            resize: 'vertical',
                                            lineHeight: 1.6,
                                            ...hiddenScrollbar,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{
                        padding: '18px 28px 24px',
                        borderTop: `1px solid ${theme.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: theme.panelSoft,
                    }}>
                        <UIButton
                            type="button"
                            onClick={() => {
                                if (step > 1) {
                                    setStep(s => s - 1);
                                    setStepErrors({});
                                } else {
                                    onClose();
                                }
                            }}
                            variant="ghost"
                            theme={theme}
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </UIButton>

                        {step < 3 ? (
                            <UIButton type="button" onClick={handleNext} variant="primary" theme={theme}>
                                Next
                            </UIButton>
                        ) : (
                            <UIButton type="submit" disabled={form.processing} variant="primary" theme={theme}>
                                {form.processing && (
                                    <span style={{
                                        width: 14,
                                        height: 14,
                                        border: '2px solid rgba(255,255,255,0.35)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite'
                                    }} />
                                )}
                                {form.processing ? 'Analyzing...' : 'Submit & Analyze'}
                            </UIButton>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteConfirm({ onClose, onConfirm, darkMode = false }) {
    const theme = getTheme(darkMode);

    return (
        <div style={{ textAlign: 'center', padding: '8px 0 2px' }}>
            <div style={{
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
                fontSize: 28,
                fontWeight: 900,
            }}>
                D
            </div>

            <h4 style={{ fontSize: 22, fontWeight: 900, color: theme.text, marginBottom: 8 }}>
                Delete Analysis?
            </h4>

            <p style={{ fontSize: 13, color: theme.textMute, marginBottom: 24, lineHeight: 1.7 }}>
                This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <UIButton onClick={onClose} variant="ghost" theme={theme}>Cancel</UIButton>
                <UIButton onClick={onConfirm} variant="danger" theme={theme}>Delete</UIButton>
            </div>
        </div>
    );
}

export default function RequirementAnalysis({ analyses = [], stats = {}, clients = [] }) {
    const { flash } = usePage().props;
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [showNew, setShowNew] = useState(false);
    const [toast, setToast] = useState(flash?.success ? { msg: flash.success, type: 'success' } : null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    const filtered = analyses.filter(a => {
        const matchSearch = a.project_title?.toLowerCase().includes(search.toLowerCase()) ||
            a.client?.company_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus ? a.status === filterStatus : true;
        return matchSearch && matchStatus;
    });

    const handleDelete = (id) => {
        router.delete(`/requirement-analysis/${id}`, {
            onSuccess: () => {
                setToast({ msg: 'Deleted successfully', type: 'success' });
                setDeleteId(null);
            },
        });
    };

    const statusOptions = [
        { value: '', label: 'All Status' },
        ...Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label })),
    ];

    const statCards = [
        { label: 'Total',     value: stats.total     ?? 0, color: theme.text,     bg: theme.metricCard, line: 'All analyses' },
        { label: 'Pending',   value: stats.pending   ?? 0, color: theme.warning,  bg: theme.warningSoft, line: 'Waiting queue' },
        { label: 'Analyzing', value: stats.analyzing ?? 0, color: theme.secondary, bg: theme.secondarySoft, line: 'In progress' },
        { label: 'Completed', value: stats.completed ?? 0, color: theme.success,  bg: theme.successSoft, line: 'Ready to review' },
        { label: 'Failed',    value: stats.failed    ?? 0, color: theme.danger,   bg: theme.dangerSoft, line: 'Needs retry' },
    ];

    return (
        <AppLayout title="Requirement Analysis">
            <style>{`
                @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes popIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
                @keyframes spin { to { transform:rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }

                .hide-scrollbar {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
            `}</style>

            <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} darkMode={darkMode} />

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ ...card(theme), padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <SectionTitle
                            eyebrow="Requirement Analysis"
                            title="Premium AI requirement workspace"
                            desc="Create, analyze, re-run and review requirement analysis with a clean premium flow across light and dark mode."
                            theme={theme}
                            action={
                                <UIButton onClick={() => setShowNew(true)} variant="primary" theme={theme}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14" />
                                        <path d="M5 12h14" />
                                    </svg>
                                    New Analysis
                                </UIButton>
                            }
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14, marginTop: 22 }}>
                            {statCards.map((s, i) => (
                                <div
                                    key={s.label}
                                    style={{
                                        ...card(theme, {
                                            padding: 18,
                                            minHeight: 112,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            background: darkMode ? theme.metricCard : s.bg,
                                        }),
                                        animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
                                    }}
                                >
                                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, opacity: darkMode ? 0.48 : 0.30, pointerEvents: 'none' }} />
                                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, boxShadow: `0 0 0 6px ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)'}` }} />
                                            <div style={{ fontSize: 11, color: theme.textMute, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                {s.label}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: s.color }}>{s.value}</div>
                                            <div style={{ marginTop: 8, fontSize: 12, color: theme.textMute }}>{s.line}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div
                        style={{
                            ...card(theme),
                            flex: 1,
                            minWidth: 270,
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
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by project or client..."
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

                    <PremiumSelect
                        options={statusOptions}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="All Status"
                        theme={theme}
                        darkMode={darkMode}
                        minWidth={180}
                    />
                </div>

                <div style={{ ...card(theme), overflow: 'hidden' }}>
                    <div style={{
                        padding: '18px 20px',
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: theme.text }}>Analysis directory</div>
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
                            boxShadow: theme.chipShadow
                        }}>
                            Live analysis list
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: theme.tableHead, borderBottom: `1px solid ${theme.border}` }}>
                                    {['Project', 'Client', 'Platform', 'Complexity', 'Feasibility', 'Status', 'Date', 'Actions'].map(h => (
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
                                        <td colSpan={8} style={{ padding: 56, textAlign: 'center' }}>
                                            <div style={{
                                                width: 64,
                                                height: 64,
                                                margin: '0 auto 14px',
                                                borderRadius: 20,
                                                border: `1px solid ${theme.border}`,
                                                background: theme.panelSoft,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: 15, color: theme.text, fontWeight: 900 }}>No analyses yet</div>
                                            <div style={{ marginTop: 6, fontSize: 12, color: theme.textMute }}>Click New Analysis to get started.</div>
                                        </td>
                                    </tr>
                                ) : filtered.map((a, i) => (
                                    <tr
                                        key={a.id}
                                        style={{
                                            borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : 'none',
                                            transition: 'background 0.15s ease',
                                            animation: `fadeUp 0.3s ease ${i * 0.04}s both`
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ fontSize: 13.5, fontWeight: 900, color: theme.text, marginBottom: 4 }}>
                                                {a.project_title}
                                            </div>
                                            {a.ai_analysis?.estimated_duration && (
                                                <div style={{ fontSize: 11, color: theme.textMute }}>
                                                    Duration {a.ai_analysis.estimated_duration}
                                                </div>
                                            )}
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textSoft }}>
                                                {a.client?.company_name}
                                            </div>
                                            <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2 }}>
                                                {a.client?.industry}
                                            </div>
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 900,
                                                color: theme.textSoft,
                                                background: theme.panelSoft,
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em'
                                            }}>
                                                {a.platform}
                                            </span>
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <ComplexityBadge complexity={a.ai_analysis?.project_complexity} darkMode={darkMode} />
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <FeasibilityRing score={a.ai_analysis?.feasibility_score} darkMode={darkMode} />
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <StatusBadge status={a.status} darkMode={darkMode} />
                                        </td>

                                        <td style={{ padding: '16px 18px', fontSize: 12, color: theme.textMute, whiteSpace: 'nowrap' }}>
                                            {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>

                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <a
                                                    href={`/requirement-analysis/${a.id}`}
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
                                                    View
                                                </a>

                                                {a.status === 'failed' && (
                                                    <button
                                                        onClick={() => router.post(`/requirement-analysis/${a.id}/reanalyze`)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: 12,
                                                            border: `1px solid ${theme.borderStrong}`,
                                                            background: theme.primarySoft,
                                                            color: theme.primary,
                                                            fontSize: 11,
                                                            fontWeight: 900,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Re-run
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setDeleteId(a.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: 12,
                                                        border: `1px solid ${theme.border}`,
                                                        background: theme.dangerSoft,
                                                        color: theme.danger,
                                                        fontSize: 11,
                                                        fontWeight: 900,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
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

            {showNew && (
                <NewRequirementModal
                    onClose={() => setShowNew(false)}
                    onSuccess={(msg) => setToast({ msg, type: 'success' })}
                    darkMode={darkMode}
                />
            )}

            {deleteId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div onClick={() => setDeleteId(null)} style={{ position: 'absolute', inset: 0, background: theme.overlay, backdropFilter: 'blur(8px)' }} />
                    <div style={{
                        position: 'relative',
                        background: theme.panel,
                        borderRadius: 28,
                        padding: '28px',
                        maxWidth: 420,
                        width: '100%',
                        boxShadow: theme.shadow,
                        border: `1px solid ${theme.borderStrong}`,
                    }}>
                        <DeleteConfirm
                            onClose={() => setDeleteId(null)}
                            onConfirm={() => handleDelete(deleteId)}
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}