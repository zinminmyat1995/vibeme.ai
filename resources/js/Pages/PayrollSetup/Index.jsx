import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// ── DocumentTranslation-style theme ───────────────────────────
function getTheme(dark) {
    if (dark) return {
        panel:       'linear-gradient(180deg, rgba(10,18,36,0.97) 0%, rgba(9,16,32,0.93) 100%)',
        panelSolid:  '#0b1324',
        panelSoft:   'rgba(255,255,255,0.035)',
        panelSofter: 'rgba(255,255,255,0.055)',
        border:      'rgba(148,163,184,0.12)',
        text:        '#f8fafc',
        textSoft:    '#cbd5e1',
        textMute:    '#8da0b8',
        shadow:      '0 28px 80px rgba(0,0,0,0.42)',
        shadowSoft:  '0 16px 36px rgba(0,0,0,0.28)',
        primary:     '#7c3aed',
        primarySoft: 'rgba(124,58,237,0.18)',
        secondary:   '#2563eb',
        success:     '#10b981',
        successSoft: 'rgba(16,185,129,0.15)',
        glass:       'radial-gradient(circle at top right, rgba(124,58,237,0.22), transparent 42%), radial-gradient(circle at bottom left, rgba(37,99,235,0.16), transparent 38%)',
        cardOverlay: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        stepBg:      'rgba(255,255,255,0.04)',
        stepBorder:  'rgba(148,163,184,0.12)',
        stepActive:  'rgba(124,58,237,0.15)',
        stepActiveBorder: 'rgba(124,58,237,0.4)',
        iconBg:      'rgba(255,255,255,0.06)',
        iconBgDone:  'rgba(16,185,129,0.15)',
        iconColorDone:'#34d399',
        iconBgActive:'rgba(124,58,237,0.2)',
        progressBg:  'rgba(255,255,255,0.08)',
        footerBg:    'rgba(255,255,255,0.02)',
        divider:     'rgba(148,163,184,0.08)',
        savedBg:     'rgba(16,185,129,0.1)',
        savedBorder: 'rgba(16,185,129,0.2)',
        savedColor:  '#34d399',
        pillBg:      'rgba(16,185,129,0.12)',
        pillBorder:  'rgba(16,185,129,0.2)',
        pillColor:   '#34d399',
        cardHoverBorder:'rgba(124,58,237,0.35)',
        cardShadowHov:'0 8px 40px rgba(0,0,0,0.4)',
        overviewBtn:  'rgba(124,58,237,0.1)',
        overviewBtnBorder:'rgba(124,58,237,0.25)',
        overviewBtnColor:'#a78bfa',
        sectionBg:   'rgba(255,255,255,0.03)',
        sectionBorder:'rgba(148,163,184,0.08)',
    };
    return {
        panel:       'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,255,0.96) 100%)',
        panelSolid:  '#ffffff',
        panelSoft:   '#f8fafc',
        panelSofter: '#f1f5f9',
        border:      'rgba(15,23,42,0.08)',
        text:        '#0f172a',
        textSoft:    '#475569',
        textMute:    '#94a3b8',
        shadow:      '0 24px 70px rgba(15,23,42,0.08)',
        shadowSoft:  '0 14px 30px rgba(15,23,42,0.06)',
        primary:     '#7c3aed',
        primarySoft: '#f3e8ff',
        secondary:   '#2563eb',
        success:     '#059669',
        successSoft: '#d1fae5',
        glass:       'radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 44%), radial-gradient(circle at bottom left, rgba(37,99,235,0.07), transparent 40%)',
        cardOverlay: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(37,99,235,0.02))',
        stepBg:      '#ffffff',
        stepBorder:  'rgba(15,23,42,0.08)',
        stepActive:  'rgba(124,58,237,0.06)',
        stepActiveBorder:'rgba(124,58,237,0.25)',
        iconBg:      '#f1f5f9',
        iconBgDone:  '#dcfce7',
        iconColorDone:'#16a34a',
        iconBgActive:'rgba(124,58,237,0.1)',
        progressBg:  '#e2e8f0',
        footerBg:    'rgba(248,250,252,0.8)',
        divider:     'rgba(15,23,42,0.06)',
        savedBg:     '#f0fdf4',
        savedBorder: '#bbf7d0',
        savedColor:  '#16a34a',
        pillBg:      'rgba(16,185,129,0.08)',
        pillBorder:  'rgba(16,185,129,0.15)',
        pillColor:   '#059669',
        cardHoverBorder:'rgba(124,58,237,0.25)',
        cardShadowHov:'0 8px 32px rgba(124,58,237,0.12)',
        overviewBtn:  'rgba(124,58,237,0.06)',
        overviewBtnBorder:'rgba(124,58,237,0.15)',
        overviewBtnColor:'#7c3aed',
        sectionBg:   '#ffffff',
        sectionBorder:'rgba(15,23,42,0.07)',
    };
}
function cardStyle(theme, extra = {}) {
    return {
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        boxShadow: theme.shadowSoft,
        backdropFilter: 'blur(16px)',
        ...extra,
    };
}
import LeavePolicySection from './Partials/LeavePolicySection';
import OvertimePolicySection from './Partials/OvertimePolicySection';
import CurrencySection from './Partials/CurrencySection';
import DeductionSection from './Partials/DeductionSection';
import AllowanceSection from './Partials/AllowanceSection';
import SalaryRuleSection from './Partials/SalaryRuleSection';
import BonusSection from './Partials/BonusSection';
import PublicHolidaySection from './Partials/PublicHolidaySection';

// ── Theme hook ─────────────────────────────────────────────────
function useTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark'
            || localStorage.getItem('vibeme-theme') === 'dark';
    };
    const [dark, setDark] = useState(getDark);
    useEffect(() => {
        const sync = () => setDark(getDark());
        window.addEventListener('vibeme-theme-change', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('vibeme-theme-change', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return dark;
}

const SECTIONS = [
    {
        key: 'leave',
        label: 'Leave Policy',
        summary: 'Leave types · Paid/Unpaid · Carry over',
        emoji: '📅',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01"/>
            </svg>
        ),
    },
    {
        key: 'overtime',
        label: 'Overtime Policy',
        summary: 'Weekday · Weekend · Holiday rates',
        emoji: '⏰',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
        ),
    },
    {
        key: 'currency',
        label: 'Currency Setup',
        summary: 'Code · Symbol · Decimal format',
        emoji: '💱',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M14.31 8a4 4 0 0 0-4.62 0C8.31 8.89 8 10.35 8 12s.31 3.11 1.69 4a4 4 0 0 0 4.62 0"/>
                <line x1="12" y1="6" x2="12" y2="8"/>
                <line x1="12" y1="16" x2="12" y2="18"/>
            </svg>
        ),
    },
    {
        key: 'deduction',
        label: 'Deduction Rules',
        summary: 'Tax · Social security · Dynamic rows',
        emoji: '💸',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
        ),
    },
    {
        key: 'allowance',
        label: 'Allowance',
        summary: 'Housing · Transport · Meal · Custom',
        emoji: '🎁',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        ),
    },
    {
        key: 'bonus',
        label: 'Bonus',
        summary: 'Bonus types · Schedules · Pay when',
        emoji: '⭐',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        ),
    },
    {
        key: 'holiday',
        label: 'Public Holidays',
        summary: 'National · Recurring · Year filter',
        emoji: '🎌',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
        ),
    },
    {
        key: 'salary',
        label: 'Payroll Settings',
        summary: 'Pay cycle · Probation · Bank export',
        emoji: '⚙️',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
            </svg>
        ),
    },
];

export default function Index({
    leavePolicies,
    overtimePolicies,
    currencies,
    deductions,
    allowances,
    salaryRule,
    country,
    bonusTypes,
    bonusSchedules,
    banks,
    completedSections,
    publicHolidays
}) {
    const dark = useTheme();
    const [activeKey, setActiveKey] = useState(null);

    const [completed, setCompleted] = useState(() => {
        const set = new Set();
        Object.entries(completedSections).forEach(([key, isDone]) => {
            if (isDone) set.add(key);
        });
        return set;
    });

    useEffect(() => {
        const set = new Set();
        Object.entries(completedSections).forEach(([key, isDone]) => {
            if (isDone) set.add(key);
        });
        setCompleted(set);
    }, [completedSections]);

    const activeSection = SECTIONS.find(s => s.key === activeKey);

    const handleSelect = (key) => {
        setActiveKey(prev => prev === key ? null : key);
    };

    const sectionContent = {
        leave:     <LeavePolicySection leavePolicies={leavePolicies} />,
        overtime:  <OvertimePolicySection overtimePolicies={overtimePolicies} />,
        currency:  <CurrencySection currencies={currencies} />,
        deduction: <DeductionSection deductions={deductions} />,
        allowance: <AllowanceSection allowances={allowances} />,
        bonus:     <BonusSection bonusTypes={bonusTypes} bonusSchedules={bonusSchedules} />,
        holiday:   <PublicHolidaySection publicHolidays={publicHolidays} />,
        salary:    <SalaryRuleSection salaryRule={salaryRule} banks={banks} currencies={currencies} bonusTypes={bonusTypes} bonusSchedules={bonusSchedules}/>,
    };

    const T = getTheme(dark);

    const completedCount = completed.size;

    return (
        <AppLayout title="HR Policy Setup">
            <Head title="HR Policy Setup" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
                .hrp-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
                .hrp-wrap ::-webkit-scrollbar { display: none; }
                .hrp-steps-row::-webkit-scrollbar { display: none; }
                .hrp-card { transition: all 0.2s ease; }
                .hrp-step-btn { transition: all 0.15s ease; }
                .hrp-step-btn:hover { transform: translateY(-1px); }
                @keyframes hrp-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
                .hrp-animate { animation: hrp-fade 0.25s ease forwards; }
            `}</style>

            <div className="hrp-wrap" style={{ minHeight: '100%', paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* ── Page Header — DocumentTranslation glass card style ── */}
                <div style={{ ...cardStyle(T, { padding: 24, position: 'relative', overflow: 'hidden', marginBottom: 0, borderRadius: 20 }) }}>
                    {/* Glass overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: T.glass, pointerEvents: 'none', borderRadius: 20 }} />
                    <div style={{ position: 'absolute', inset: 0, background: T.cardOverlay, pointerEvents: 'none', borderRadius: 20 }} />

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                        {/* Left: eyebrow + title + desc */}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.primary, marginBottom: 6 }}>
                                HR Policy Setup
                            </div>
                          
                            <div style={{ fontSize: 13, color: T.textMute, marginTop: 6, fontWeight: 500, lineHeight: 1.6, maxWidth: 560 }}>
                                {activeSection ? activeSection.summary : 'Set up leave, overtime, payroll rules and more for your organization'}
                            </div>
                        </div>

                        {/* Right: stats + country */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                            {/* Progress stat chip */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                padding: '12px 20px', borderRadius: 16,
                                background: T.panelSoft, border: `1px solid ${T.border}`,
                                gap: 6,
                            }}>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {SECTIONS.map(s => (
                                        <div key={s.key} style={{
                                            width: completed.has(s.key) ? 18 : s.key === activeKey ? 14 : 5,
                                            height: 5, borderRadius: 99,
                                            background: completed.has(s.key) ? '#10b981'
                                                : s.key === activeKey ? T.primary
                                                : T.progressBg,
                                            transition: 'all 0.3s ease',
                                        }}/>
                                    ))}
                                </div>
                                <span style={{ fontSize: 11, color: T.textSoft, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    <span style={{ color: T.primary, fontSize: 13, fontWeight: 900 }}>{completedCount}</span>
                                    <span style={{ color: T.textMute }}> / {SECTIONS.length} completed</span>
                                </span>
                            </div>

                            {/* Country pill */}
                            {country && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: T.pillBg, border: `1px solid ${T.pillBorder}`,
                                    borderRadius: 16, padding: '12px 18px',
                                }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                                        display: 'block', flexShrink: 0,
                                        boxShadow: '0 0 0 3px rgba(16,185,129,0.15)',
                                    }}/>
                                    <div>
                                        <div style={{ fontSize: 9, color: T.pillColor, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Country</div>
                                        <div style={{ fontSize: 13, fontWeight: 900, color: T.text, lineHeight: 1.2, marginTop: 2 }}>{country.name}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Step Navigator — 2×4 grid, always fits ── */}
                <div style={{ marginTop: 16 }}>
                    <div className="hrp-steps-row" style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                        paddingBottom: 2,
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}>
                        {SECTIONS.map((section, idx) => {
                            const isActive = activeKey === section.key;
                            const isDone   = completed.has(section.key);
                            return (
                                <button
                                    key={section.key}
                                    className="hrp-step-btn"
                                    onClick={() => handleSelect(section.key)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '9px 14px', borderRadius: 12,
                                        border: `1.5px solid ${isActive ? T.stepActiveBorder : isDone ? 'rgba(16,185,129,0.3)' : T.border}`,
                                        background: isActive ? T.stepActive : isDone ? (dark ? 'rgba(16,185,129,0.07)' : '#f0fdf4') : T.panel,
                                        cursor: 'pointer', textAlign: 'left',
                                        boxShadow: isActive ? `0 0 0 3px ${dark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)'}` : T.shadowSoft,
                                        flex: '1 1 0', minWidth: 110, whiteSpace: 'nowrap',
                                        backdropFilter: 'blur(12px)',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {/* Number / check */}
                                    <span style={{
                                        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: isDone ? 13 : 11, fontWeight: 800,
                                        background: isDone ? '#10b981' : isActive ? '#6366f1' : T.iconBg,
                                        color: isDone || isActive ? '#fff' : T.textMute,
                                        boxShadow: isDone ? '0 2px 8px rgba(16,185,129,0.3)' : isActive ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                                    }}>
                                        {isDone
                                            ? <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                            : idx + 1
                                        }
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                                            color: isDone ? '#10b981' : isActive ? (dark ? '#a5b4fc' : '#6366f1') : T.textSoft,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>{section.label}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Body ── */}
                <div style={{ marginTop: 16 }}>

                    {/* Overview grid */}
                    {!activeKey && (
                        <div className="hrp-animate" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 12,
                        }}>
                            {SECTIONS.map((section) => {
                                const isDone = completed.has(section.key);
                                return (
                                    <button
                                        key={section.key}
                                        className="hrp-card"
                                        onClick={() => handleSelect(section.key)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                            gap: 12, padding: '18px 20px', borderRadius: 18, textAlign: 'left',
                                            border: `1.5px solid ${isDone ? 'rgba(16,185,129,0.35)' : T.border}`,
                                            background: isDone ? (dark ? 'rgba(16,185,129,0.07)' : '#f0fdf4') : T.panel,
                                            cursor: 'pointer',
                                            boxShadow: T.shadowSoft,
                                            backdropFilter: 'blur(16px)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = isDone ? 'rgba(16,185,129,0.6)' : T.cardHoverBorder;
                                            e.currentTarget.style.background = isDone ? (dark ? 'rgba(16,185,129,0.12)' : '#dcfce7') : (dark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.03)');
                                            e.currentTarget.style.boxShadow = T.cardShadowHov;
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = isDone ? 'rgba(16,185,129,0.35)' : T.border;
                                            e.currentTarget.style.background = isDone ? (dark ? 'rgba(16,185,129,0.07)' : '#f0fdf4') : T.panel;
                                            e.currentTarget.style.boxShadow = T.shadowSoft;
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {/* Icon + emoji */}
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: isDone ? T.iconBgDone : T.iconBg,
                                            fontSize: 20,
                                        }}>
                                            {isDone
                                                ? <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.iconColorDone} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                                : section.emoji
                                            }
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 3, letterSpacing: '-0.2px' }}>{section.label}</div>
                                            <div style={{ fontSize: 11, color: T.textMute, fontWeight: 500, lineHeight: 1.5 }}>{section.summary}</div>
                                        </div>

                                        {/* Footer */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            {isDone ? (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
                                                    background: T.savedBg, border: `1px solid ${T.savedBorder}`,
                                                    color: T.savedColor, borderRadius: 99, padding: '3px 10px',
                                                }}>✓ Saved</span>
                                            ) : (
                                                <span style={{ fontSize: 10, color: T.textMute, fontWeight: 600 }}>Not configured</span>
                                            )}
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={T.textMute} strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                            </svg>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Active section */}
                    {activeKey && (
                        <div className="hrp-animate" style={{
                            background: T.sectionBg, border: `1px solid ${T.sectionBorder}`,
                            borderRadius: 20, overflow: 'hidden',
                            boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.3)' : '0 4px 24px rgba(15,23,42,0.08)',
                        }}>
                            {/* Section header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 24px', borderBottom: `1px solid ${T.divider}`,
                                background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.6)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12, fontSize: 20,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: T.iconBgActive,
                                    }}>
                                        {activeSection?.emoji}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: '-0.2px' }}>{activeSection?.label}</div>
                                        <div style={{ fontSize: 11, color: T.textMute, marginTop: 1, fontWeight: 500 }}>{activeSection?.summary}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveKey(null)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                                        border: `1.5px solid ${T.overviewBtnBorder}`,
                                        background: T.overviewBtn, color: T.overviewBtnColor, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                                    </svg>
                                    Overview
                                </button>
                            </div>

                            {/* Section content */}
                            <div style={{ padding: '24px' }}>
                                {sectionContent[activeKey]}
                            </div>

                            {/* Footer nav */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 24px', borderTop: `1px solid ${T.divider}`,
                                background: T.footerBg,
                            }}>
                                <span style={{ fontSize: 11, color: T.textMute, fontWeight: 600 }}>
                                    Step {SECTIONS.findIndex(s => s.key === activeKey) + 1} of {SECTIONS.length}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {SECTIONS.map(s => (
                                        <button
                                            key={s.key}
                                            onClick={() => setActiveKey(s.key)}
                                            style={{
                                                height: 6, borderRadius: 99, border: 'none', cursor: 'pointer',
                                                width: s.key === activeKey ? 24 : 6,
                                                background: s.key === activeKey ? '#6366f1'
                                                    : completed.has(s.key) ? '#10b981'
                                                    : T.progressBg,
                                                transition: 'all 0.3s ease',
                                                padding: 0,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}