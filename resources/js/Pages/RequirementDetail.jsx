import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';

// ── Helpers ────────────────────────────────────────
const RISK_COLOR  = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const RISK_BG     = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' };
const PRIO_COLOR  = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const PRIO_BG     = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' };
const FEASIBILITY_COLOR = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
const FEASIBILITY_LABEL = (s) => s >= 75 ? 'Highly Feasible' : s >= 50 ? 'Moderately Feasible' : 'Challenging';

const COMPLEXITY_MAP = {
    simple:     { label: 'Simple',     color: '#10b981', bg: '#d1fae5', icon: 'S' },
    medium:     { label: 'Medium',     color: '#f59e0b', bg: '#fef3c7', icon: 'M' },
    complex:    { label: 'Complex',    color: '#ef4444', bg: '#fee2e2', icon: 'C' },
    enterprise: { label: 'Enterprise', color: '#8b5cf6', bg: '#ede9fe', icon: 'E' },
};

const TIMELINE_MAP = {
    feasible:    { label: 'Feasible',    color: '#059669', bg: '#d1fae5', icon: 'OK' },
    tight:       { label: 'Tight',       color: '#d97706', bg: '#fef3c7', icon: 'TG' },
    unrealistic: { label: 'Unrealistic', color: '#dc2626', bg: '#fee2e2', icon: 'NO' },
};

const BUDGET_MAP = {
    under:  { label: 'Under Budget',  color: '#059669', bg: '#d1fae5', icon: 'UN' },
    within: { label: 'Within Budget', color: '#2563eb', bg: '#dbeafe', icon: 'IN' },
    over:   { label: 'Over Budget',   color: '#dc2626', bg: '#fee2e2', icon: 'OV' },
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
            rowHover: 'rgba(255,255,255,0.03)',
            glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.22), transparent 42%), radial-gradient(circle at bottom left, rgba(37,99,235,0.16), transparent 38%)',
            chipShadow: '0 10px 24px rgba(0,0,0,0.16)',
            accentGradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)',
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
        rowHover: '#fbfbfe',
        glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 44%), radial-gradient(circle at bottom left, rgba(37,99,235,0.07), transparent 40%)',
        chipShadow: '0 10px 24px rgba(15,23,42,0.05)',
        accentGradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)',
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

function SectionCard({ icon, title, children, accent, theme }) {
    return (
        <div style={{
            ...card(theme),
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '16px 22px',
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: theme.panelSoft,
            }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: theme.text, letterSpacing: '-0.02em' }}>
                    {title}
                </h3>
            </div>
            <div style={{ padding: '18px 22px' }}>{children}</div>
        </div>
    );
}

function ScoreMeter({ score, darkMode = false }) {
    const theme = getTheme(darkMode);
    const color = FEASIBILITY_COLOR(score);
    const r = 52, stroke = 7, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
                <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.65" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>
                <circle cx="65" cy="65" r={r} fill="none" stroke={darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6'} strokeWidth={stroke} />
                <circle
                    cx="65"
                    cy="65"
                    r={r}
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeDashoffset={circ / 4}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.5s ease' }}
                />
                <text x="65" y="58" textAnchor="middle" fontSize="28" fontWeight="900" fill={color}>{score}</text>
                <text x="65" y="75" textAnchor="middle" fontSize="11" fontWeight="700" fill={theme.textMute}>/100</text>
            </svg>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color }}>
                    {FEASIBILITY_LABEL(score)}
                </div>
                <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2 }}>Feasibility Score</div>
            </div>
        </div>
    );
}

function RiskCard({ risk, darkMode = false }) {
    const theme = getTheme(darkMode);
    const lvl = risk.level?.toLowerCase() || 'low';
    const bgMap = darkMode
        ? {
            high: 'rgba(239,68,68,0.14)',
            medium: 'rgba(245,158,11,0.14)',
            low: 'rgba(16,185,129,0.14)',
        }
        : RISK_BG;

    const colorMap = darkMode
        ? {
            high: '#fca5a5',
            medium: '#fcd34d',
            low: '#86efac',
        }
        : RISK_COLOR;

    return (
        <div style={{
            padding: '12px 14px',
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
            background: bgMap[lvl],
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>{risk.risk}</span>
                <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: colorMap[lvl] + '20',
                    color: colorMap[lvl],
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap'
                }}>
                    {lvl}
                </span>
            </div>
            {risk.mitigation && (
                <div style={{ fontSize: 12, color: theme.textSoft, lineHeight: 1.6 }}>
                    {risk.mitigation}
                </div>
            )}
        </div>
    );
}

function ModuleCard({ mod, idx, darkMode = false }) {
    const theme = getTheme(darkMode);
    const prio = mod.priority?.toLowerCase() || 'medium';
    const prioBg = darkMode
        ? {
            high: 'rgba(239,68,68,0.16)',
            medium: 'rgba(245,158,11,0.16)',
            low: 'rgba(16,185,129,0.16)',
        }
        : PRIO_BG;
    const prioColor = darkMode
        ? {
            high: '#fca5a5',
            medium: '#fcd34d',
            low: '#86efac',
        }
        : PRIO_COLOR;

    return (
        <div
            style={{
                padding: '14px 16px',
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                background: theme.panelSoft,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = theme.panelSofter;
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = theme.panelSoft;
                e.currentTarget.style.transform = 'none';
            }}
        >
            <div style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: theme.accentGradient,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 900,
                flexShrink: 0,
                boxShadow: '0 12px 24px rgba(124,58,237,0.22)',
            }}>
                {idx + 1}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>{mod.name}</span>
                    <span style={{
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: prioBg[prio],
                        color: prioColor[prio],
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}>
                        {prio}
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSoft, lineHeight: 1.6 }}>{mod.description}</p>
            </div>
        </div>
    );
}

function PhaseTimeline({ phases, darkMode = false }) {
    const theme = getTheme(darkMode);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {phases.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 34, flexShrink: 0 }}>
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: theme.accentGradient,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 900,
                            flexShrink: 0,
                            zIndex: 1,
                            boxShadow: '0 12px 22px rgba(124,58,237,0.18)',
                        }}>
                            {i + 1}
                        </div>
                        {i < phases.length - 1 && (
                            <div style={{ width: 2, flex: 1, background: theme.borderStrong, minHeight: 20, marginTop: 4 }} />
                        )}
                    </div>

                    <div style={{ paddingLeft: 14, paddingBottom: i < phases.length - 1 ? 20 : 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>{p.name || p.phase}</span>
                            <span style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: theme.textSoft,
                                background: theme.panelSoft,
                                padding: '4px 9px',
                                borderRadius: 999
                            }}>
                                {p.duration}
                            </span>
                        </div>

                        {p.deliverables?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {p.deliverables.map((d, j) => (
                                    <span
                                        key={j}
                                        style={{
                                            fontSize: 11,
                                            color: theme.textSoft,
                                            background: theme.panelSoft,
                                            border: `1px solid ${theme.border}`,
                                            padding: '4px 9px',
                                            borderRadius: 999
                                        }}
                                    >
                                        {d}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function TeamCard({ member, darkMode = false }) {
    const theme = getTheme(darkMode);

    return (
        <div style={{
            padding: '12px 14px',
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
            background: theme.panelSoft,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
        }}>
            <div style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: theme.accentGradient,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 900,
                flexShrink: 0,
                boxShadow: '0 12px 24px rgba(124,58,237,0.22)',
            }}>
                {member.count}
            </div>
            <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>{member.role}</div>
                {member.reason && <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2 }}>{member.reason}</div>}
            </div>
        </div>
    );
}

function TinyPill({ label, color, bg }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 900,
            padding: '6px 11px',
            borderRadius: 999,
            background: bg,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
        }}>
            {label}
        </span>
    );
}

export default function RequirementDetail({ analysis }) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const ai = analysis.ai_analysis || {};
    const client = analysis.client || {};
    const [reanalyzing, setReanalyzing] = useState(false);

    const handleReanalyze = () => {
        setReanalyzing(true);
        router.post(`/requirement-analysis/${analysis.id}/reanalyze`, {}, {
            onFinish: () => setReanalyzing(false),
        });
    };

    const complexity = COMPLEXITY_MAP[ai.project_complexity] || COMPLEXITY_MAP.medium;
    const timeline   = TIMELINE_MAP[ai.timeline_feasibility] || null;
    const budget     = BUDGET_MAP[ai.budget_assessment] || null;

    const darkComplexity = darkMode
        ? {
            simple:     { label: 'Simple', color: '#86efac', bg: 'rgba(16,185,129,0.16)', icon: 'S' },
            medium:     { label: 'Medium', color: '#fcd34d', bg: 'rgba(245,158,11,0.16)', icon: 'M' },
            complex:    { label: 'Complex', color: '#fca5a5', bg: 'rgba(239,68,68,0.16)', icon: 'C' },
            enterprise: { label: 'Enterprise', color: '#c4b5fd', bg: 'rgba(139,92,246,0.16)', icon: 'E' },
        }
        : COMPLEXITY_MAP;

    const complexityView = (darkComplexity[ai.project_complexity] || darkComplexity.medium);

    return (
        <AppLayout title="Requirement Detail">
            <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin { to { transform:rotate(360deg); } }
                .card-anim { animation: fadeUp 0.4s ease both; }
            `}</style>

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ ...card(theme), padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <a
                                    href="/requirement-analysis"
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 14,
                                        border: `1px solid ${theme.border}`,
                                        background: theme.panelSoft,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: theme.textSoft,
                                        textDecoration: 'none',
                                        fontSize: 16,
                                        flexShrink: 0,
                                    }}
                                >
                                    ←
                                </a>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: theme.text, lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                                            {analysis.project_title}
                                        </div>

                                        {ai.project_complexity && (
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 900,
                                                padding: '6px 11px',
                                                borderRadius: 999,
                                                background: complexityView.bg,
                                                color: complexityView.color,
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                            }}>
                                                {complexityView.icon} {complexityView.label}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ fontSize: 12, color: theme.textMute, marginTop: 8 }}>
                                        {client.company_name} · {client.industry} · {new Date(analysis.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                                {analysis.status === 'completed' && (
                                    <button
                                        onClick={handleReanalyze}
                                        disabled={reanalyzing}
                                        style={{
                                            height: 46,
                                            padding: '0 16px',
                                            borderRadius: 16,
                                            border: `1px solid ${theme.borderStrong}`,
                                            background: theme.primarySoft,
                                            color: theme.primary,
                                            fontSize: 12,
                                            fontWeight: 900,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        {reanalyzing
                                            ? <span style={{ width: 14, height: 14, border: `2px solid ${theme.borderStrong}`, borderTopColor: theme.primary, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                            : '↻'}
                                        Re-analyze
                                    </button>
                                )}

                                <a
                                    href={`/proposals?from=${analysis.id}`}
                                    onClick={(e) => { e.preventDefault(); router.visit(`/proposals?from=${analysis.id}`); }}
                                    style={{
                                        height: 46,
                                        padding: '0 18px',
                                        borderRadius: 16,
                                        border: 'none',
                                        background: theme.accentGradient,
                                        color: '#fff',
                                        fontSize: 12,
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        boxShadow: '0 14px 32px rgba(124,58,237,0.22)',
                                    }}
                                >
                                    Generate Proposal
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {analysis.status !== 'completed' ? (
                    <div style={{
                        ...card(theme),
                        padding: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}>
                        {analysis.status === 'analyzing' ? (
                            <>
                                <div style={{ fontSize: 56, marginBottom: 16, animation: 'spin 3s linear infinite' }}>•</div>
                                <h3 style={{ fontSize: 18, fontWeight: 900, color: theme.text, margin: '0 0 8px' }}>AI is analyzing...</h3>
                                <p style={{ color: theme.textMute, fontSize: 14 }}>Please wait while we process the requirements.</p>
                            </>
                        ) : analysis.status === 'failed' ? (
                            <>
                                <div style={{ fontSize: 56, marginBottom: 16, color: theme.danger }}>×</div>
                                <h3 style={{ fontSize: 18, fontWeight: 900, color: theme.text, margin: '0 0 8px' }}>Analysis failed</h3>
                                <p style={{ color: theme.textMute, fontSize: 14, marginBottom: 20 }}>Something went wrong. Please try again.</p>
                                <button
                                    onClick={handleReanalyze}
                                    style={{
                                        padding: '11px 24px',
                                        borderRadius: 14,
                                        border: 'none',
                                        background: theme.accentGradient,
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        boxShadow: '0 14px 32px rgba(124,58,237,0.22)',
                                    }}
                                >
                                    Retry Analysis
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 56, marginBottom: 16, color: theme.warning }}>•</div>
                                <h3 style={{ fontSize: 18, fontWeight: 900, color: theme.text, margin: '0 0 8px' }}>Pending analysis</h3>
                                <p style={{ color: theme.textMute, fontSize: 14 }}>Analysis will start shortly.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {ai.summary && (
                                <div className="card-anim" style={{ animationDelay: '0.05s' }}>
                                    <SectionCard icon="AI" title="AI Summary" accent={theme.warning} theme={theme}>
                                        <p style={{ margin: 0, fontSize: 14, color: theme.textSoft, lineHeight: 1.8 }}>{ai.summary}</p>
                                    </SectionCard>
                                </div>
                            )}

                            {ai.core_modules?.length > 0 && (
                                <div className="card-anim" style={{ animationDelay: '0.1s' }}>
                                    <SectionCard icon={ai.core_modules.length} title={`Core Modules (${ai.core_modules.length})`} accent={theme.primary} theme={theme}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {ai.core_modules.map((m, i) => <ModuleCard key={i} mod={m} idx={i} darkMode={darkMode} />)}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                            {ai.timeline_phases?.length > 0 && (
                                <div className="card-anim" style={{ animationDelay: '0.15s' }}>
                                    <SectionCard icon="TL" title="Project Timeline" accent={theme.secondary} theme={theme}>
                                        <PhaseTimeline phases={ai.timeline_phases} darkMode={darkMode} />
                                    </SectionCard>
                                </div>
                            )}

                            {ai.potential_risks?.length > 0 && (
                                <div className="card-anim" style={{ animationDelay: '0.2s' }}>
                                    <SectionCard icon={ai.potential_risks.length} title={`Risk Assessment (${ai.potential_risks.length})`} accent={theme.danger} theme={theme}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {ai.potential_risks.map((r, i) => <RiskCard key={i} risk={r} darkMode={darkMode} />)}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                            {ai.recommendations?.length > 0 && (
                                <div className="card-anim" style={{ animationDelay: '0.25s' }}>
                                    <SectionCard icon="RC" title="Recommendations" accent={theme.success} theme={theme}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {ai.recommendations.map((r, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <div style={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 8,
                                                        background: theme.primarySoft,
                                                        color: theme.primary,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 12,
                                                        fontWeight: 900,
                                                        flexShrink: 0,
                                                        marginTop: 1,
                                                    }}>
                                                        {i + 1}
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: 13, color: theme.textSoft, lineHeight: 1.7 }}>{r}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                            {ai.clarification_needed?.length > 0 && (
                                <div className="card-anim" style={{ animationDelay: '0.3s' }}>
                                    <SectionCard icon="Q" title="Clarifications Needed" accent={theme.warning} theme={theme}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {ai.clarification_needed.map((q, i) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    gap: 10,
                                                    padding: '12px 14px',
                                                    borderRadius: 14,
                                                    background: darkMode ? 'rgba(245,158,11,0.12)' : '#fffbeb',
                                                    border: `1px solid ${darkMode ? 'rgba(245,158,11,0.16)' : '#fde68a'}`
                                                }}>
                                                    <span style={{ color: theme.warning, fontWeight: 900, fontSize: 13 }}>Q{i + 1}</span>
                                                    <p style={{ margin: 0, fontSize: 13, color: theme.textSoft, lineHeight: 1.6 }}>{q}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {ai.feasibility_score && (
                                <div className="card-anim" style={{ animationDelay: '0.05s' }}>
                                    <div style={{ ...card(theme), padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <ScoreMeter score={ai.feasibility_score} darkMode={darkMode} />
                                    </div>
                                </div>
                            )}

                            <div className="card-anim" style={{ animationDelay: '0.1s' }}>
                                <div style={{ ...card(theme), overflow: 'hidden' }}>
                                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, fontWeight: 900, color: theme.text }}>
                                        Quick Overview
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {[
                                            { label: 'Duration', value: ai.estimated_duration },
                                            { label: 'Platform', value: analysis.platform?.toUpperCase() },
                                            { label: 'Users', value: analysis.expected_users?.toLocaleString() },
                                            { label: 'Budget', value: analysis.budget_range },
                                            { label: 'Deadline', value: analysis.expected_deadline },
                                        ].filter(x => x.value).map((item, i, arr) => (
                                            <div key={item.label} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '11px 18px',
                                                borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none'
                                            }}>
                                                <span style={{ fontSize: 12, color: theme.textMute }}>{item.label}</span>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft, textAlign: 'right' }}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {(timeline || budget) && (
                                <div className="card-anim" style={{ animationDelay: '0.15s' }}>
                                    <div style={{ ...card(theme), overflow: 'hidden' }}>
                                        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, fontWeight: 900, color: theme.text }}>
                                            Assessments
                                        </div>
                                        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {timeline && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '11px 14px',
                                                    borderRadius: 14,
                                                    background: darkMode ? 'rgba(255,255,255,0.04)' : timeline.bg
                                                }}>
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft }}>Timeline</span>
                                                    <TinyPill label={`${timeline.icon} ${timeline.label}`} color={timeline.color} bg={darkMode ? 'rgba(255,255,255,0.04)' : timeline.bg} />
                                                </div>
                                            )}

                                            {budget && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '11px 14px',
                                                    borderRadius: 14,
                                                    background: darkMode ? 'rgba(255,255,255,0.04)' : budget.bg
                                                }}>
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft }}>Budget</span>
                                                    <TinyPill label={`${budget.icon} ${budget.label}`} color={budget.color} bg={darkMode ? 'rgba(255,255,255,0.04)' : budget.bg} />
                                                </div>
                                            )}

                                            {ai.budget_notes && (
                                                <p style={{ margin: 0, fontSize: 12, color: theme.textSoft, lineHeight: 1.6 }}>{ai.budget_notes}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {ai.recommended_tech_stack?.length > 0 && (
                                <div className="card-anim" style={{ animationDelay: '0.2s' }}>
                                    <SectionCard icon="TS" title="Tech Stack" accent={theme.secondary} theme={theme}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                            {ai.recommended_tech_stack.map((t, i) => (
                                                <span key={i} style={{
                                                    fontSize: 12,
                                                    fontWeight: 800,
                                                    padding: '6px 12px',
                                                    borderRadius: 999,
                                                    background: darkMode ? 'rgba(124,58,237,0.14)' : '#f5f3ff',
                                                    color: darkMode ? '#c4b5fd' : '#6d28d9',
                                                    border: `1px solid ${darkMode ? 'rgba(196,181,253,0.12)' : '#ddd6fe'}`
                                                }}>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                            {ai.team_structure?.length > 0 && (
                                <div className="card-anim" style={{ animationDelay: '0.25s' }}>
                                    <SectionCard icon="TM" title="Recommended Team" accent={theme.primary} theme={theme}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {ai.team_structure.map((m, i) => <TeamCard key={i} member={m} darkMode={darkMode} />)}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                            <div className="card-anim" style={{ animationDelay: '0.3s' }}>
                                <div style={{
                                    ...card(theme),
                                    padding: '18px'
                                }}>
                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: theme.textMute,
                                        marginBottom: 12,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em'
                                    }}>
                                        Client Info
                                    </div>

                                    {[
                                        { label: 'Company', value: client.company_name },
                                        { label: 'Contact', value: client.contact_person },
                                        { label: 'Email', value: client.email },
                                        { label: 'Phone', value: client.phone },
                                        { label: 'Industry', value: client.industry },
                                    ].filter(x => x.value).map((item, idx, arr) => (
                                        <div key={item.label} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            paddingBottom: idx < arr.length - 1 ? 10 : 0,
                                            marginBottom: idx < arr.length - 1 ? 10 : 0,
                                            borderBottom: idx < arr.length - 1 ? `1px solid ${theme.border}` : 'none'
                                        }}>
                                            <span style={{ fontSize: 12, color: theme.textMute }}>{item.label}</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft, maxWidth: '60%', textAlign: 'right' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}