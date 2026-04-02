// resources/js/Pages/RequirementDetail.jsx
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';

// ── Helpers ────────────────────────────────────────
const RISK_COLOR  = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const RISK_BG     = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' };
const PRIO_COLOR  = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const PRIO_BG     = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' };
const FEASIBILITY_COLOR = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
const FEASIBILITY_LABEL = (s) => s >= 75 ? 'Highly Feasible' : s >= 50 ? 'Moderately Feasible' : 'Challenging';

const COMPLEXITY_MAP = {
    simple:     { label: 'Simple',     color: '#10b981', bg: '#d1fae5', icon: '🟢' },
    medium:     { label: 'Medium',     color: '#f59e0b', bg: '#fef3c7', icon: '🟡' },
    complex:    { label: 'Complex',    color: '#ef4444', bg: '#fee2e2', icon: '🔴' },
    enterprise: { label: 'Enterprise', color: '#8b5cf6', bg: '#ede9fe', icon: '💎' },
};

const TIMELINE_MAP = {
    feasible:    { label: 'Feasible',    color: '#059669', bg: '#d1fae5', icon: '✅' },
    tight:       { label: 'Tight',       color: '#d97706', bg: '#fef3c7', icon: '⚠️' },
    unrealistic: { label: 'Unrealistic', color: '#dc2626', bg: '#fee2e2', icon: '❌' },
};

const BUDGET_MAP = {
    under:  { label: 'Under Budget',  color: '#059669', bg: '#d1fae5', icon: '💰' },
    within: { label: 'Within Budget', color: '#2563eb', bg: '#dbeafe', icon: '✅' },
    over:   { label: 'Over Budget',   color: '#dc2626', bg: '#fee2e2', icon: '⚠️' },
};

// ── Purple theme ───────────────────────────────────
const PURPLE = {
    main:  '#7c3aed',
    hover: '#6d28d9',
    light: '#ede9fe',
    border:'#c4b5fd',
    text:  '#5b21b6',
    grad:  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
};

// ── Sub-components ─────────────────────────────────
function SectionCard({ icon, title, children, accent = '#111827' }) {
    return (
        <div style={{
            background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 18,
            overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
            <div style={{
                padding: '16px 22px', borderBottom: '1px solid #f5f5f5',
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${accent}08, ${accent}04)`,
            }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827', letterSpacing: '-0.2px' }}>{title}</h3>
            </div>
            <div style={{ padding: '18px 22px' }}>{children}</div>
        </div>
    );
}

function ScoreMeter({ score }) {
    const color = FEASIBILITY_COLOR(score);
    const r = 52, stroke = 7, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
                <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>
                <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
                <circle cx="65" cy="65" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.5s ease' }} />
                <text x="65" y="58" textAnchor="middle" fontSize="28" fontWeight="900" fill={color}>{score}</text>
                <text x="65" y="75" textAnchor="middle" fontSize="11" fontWeight="600" fill="#9ca3af">/100</text>
            </svg>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color }}>
                    {FEASIBILITY_LABEL(score)}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Feasibility Score</div>
            </div>
        </div>
    );
}

function Tag({ label, color = '#6b7280', bg = '#f3f4f6' }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px', borderRadius: 99,
            fontSize: 12, fontWeight: 600,
            background: bg, color,
        }}>{label}</span>
    );
}

function RiskCard({ risk }) {
    const lvl = risk.level?.toLowerCase() || 'low';
    return (
        <div style={{
            padding: '12px 14px', borderRadius: 12,
            border: `1px solid ${RISK_COLOR[lvl]}30`,
            background: RISK_BG[lvl],
            display: 'flex', flexDirection: 'column', gap: 6,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{risk.risk}</span>
                <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                    background: RISK_COLOR[lvl] + '20', color: RISK_COLOR[lvl],
                    textTransform: 'uppercase', letterSpacing: '0.4px',
                }}>{lvl}</span>
            </div>
            {risk.mitigation && (
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                    💡 {risk.mitigation}
                </div>
            )}
        </div>
    );
}

function ModuleCard({ mod, idx }) {
    const prio = mod.priority?.toLowerCase() || 'medium';
    return (
        <div style={{
            padding: '14px 16px', borderRadius: 12,
            border: '1.5px solid #f0f0f0', background: '#fafafa',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            transition: 'all 0.15s',
        }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'none'; }}
        >
            {/* ── Number badge → purple ── */}
            <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: PURPLE.grad,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, flexShrink: 0,
            }}>{idx + 1}</div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{mod.name}</span>
                    <span style={{
                        fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5,
                        background: PRIO_BG[prio], color: PRIO_COLOR[prio],
                        textTransform: 'uppercase', letterSpacing: '0.3px',
                    }}>{prio}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{mod.description}</p>
            </div>
        </div>
    );
}

function PhaseTimeline({ phases }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {phases.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 0 }}>
                    {/* Line + dot → purple */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: PURPLE.grad,
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, flexShrink: 0, zIndex: 1,
                        }}>{i + 1}</div>
                        {i < phases.length - 1 && (
                            <div style={{ width: 2, flex: 1, background: '#e5e7eb', minHeight: 20, marginTop: 4 }} />
                        )}
                    </div>
                    {/* Content */}
                    <div style={{ paddingLeft: 14, paddingBottom: i < phases.length - 1 ? 20 : 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{p.name || p.phase}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 6 }}>
                                ⏱ {p.duration}
                            </span>
                        </div>
                        {p.deliverables?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {p.deliverables.map((d, j) => (
                                    <span key={j} style={{ fontSize: 11, color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: 6 }}>
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

function TeamCard({ member }) {
    return (
        <div style={{
            padding: '12px 14px', borderRadius: 12, border: '1.5px solid #f0f0f0',
            background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12,
        }}>
            {/* Team count badge → purple */}
            <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: PURPLE.grad,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, flexShrink: 0,
            }}>
                {member.count}
            </div>
            <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{member.role}</div>
                {member.reason && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{member.reason}</div>}
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────
export default function RequirementDetail({ analysis }) {
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

    return (
        <AppLayout title="Requirement Detail">
            <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin   { to { transform:rotate(360deg); } }
                .card-anim { animation: fadeUp 0.4s ease both; }
            `}</style>

            {/* ── Top Bar ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <a href="/requirement-analysis" style={{
                        width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e5e7eb',
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#374151', textDecoration: 'none', fontSize: 16,
                    }}>←</a>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>
                                {analysis.project_title}
                            </h1>
                            {ai.project_complexity && (
                                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: complexity.bg, color: complexity.color }}>
                                    {complexity.icon} {complexity.label}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                            {client.company_name} · {client.industry} · {new Date(analysis.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {analysis.status === 'completed' && (
                        <button onClick={handleReanalyze} disabled={reanalyzing}
                            style={{
                                padding: '9px 16px', borderRadius: 10,
                                border: `1.5px solid ${PURPLE.border}`,
                                background: PURPLE.light, color: PURPLE.text,
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            {reanalyzing
                                ? <span style={{ width: 13, height: 13, border: `2px solid ${PURPLE.border}`, borderTopColor: PURPLE.main, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                : '🔄'}
                            Re-analyze
                        </button>
                    )}
                    {/* Generate Proposal → purple */}
                    <a href={`/proposals?from=${analysis.id}`}
                        onClick={(e) => { e.preventDefault(); router.visit(`/proposals?from=${analysis.id}`); }}
                        style={{
                            padding: '9px 18px', borderRadius: 10, border: 'none',
                            background: PURPLE.grad,
                            color: '#fff', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                        }}>
                        📄 Generate Proposal
                    </a>
                </div>
            </div>

            {analysis.status !== 'completed' ? (
                /* ── Not completed state ── */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, background: '#fff', borderRadius: 20, border: '1.5px solid #f0f0f0' }}>
                    {analysis.status === 'analyzing' ? (
                        <>
                            <div style={{ fontSize: 56, marginBottom: 16, animation: 'spin 3s linear infinite' }}>🤖</div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>AI is Analyzing...</h3>
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Please wait while we process the requirements</p>
                        </>
                    ) : analysis.status === 'failed' ? (
                        <>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Analysis Failed</h3>
                            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>Something went wrong. Please try again.</p>
                            {/* Retry → purple */}
                            <button onClick={handleReanalyze} style={{
                                padding: '10px 24px', borderRadius: 10, border: 'none',
                                background: PURPLE.grad, color: '#fff',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                            }}>
                                🔄 Retry Analysis
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Pending Analysis</h3>
                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Analysis will start shortly</p>
                        </>
                    )}
                </div>
            ) : (
                /* ── Full Analysis Layout ── */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

                    {/* ── LEFT COLUMN ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Summary */}
                        {ai.summary && (
                            <div className="card-anim" style={{ animationDelay: '0.05s' }}>
                                <SectionCard icon="💡" title="AI Summary" accent="#f59e0b">
                                    <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{ai.summary}</p>
                                </SectionCard>
                            </div>
                        )}

                        {/* Core Modules */}
                        {ai.core_modules?.length > 0 && (
                            <div className="card-anim" style={{ animationDelay: '0.1s' }}>
                                <SectionCard icon="🧩" title={`Core Modules (${ai.core_modules.length})`} accent="#8b5cf6">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {ai.core_modules.map((m, i) => <ModuleCard key={i} mod={m} idx={i} />)}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Timeline Phases */}
                        {ai.timeline_phases?.length > 0 && (
                            <div className="card-anim" style={{ animationDelay: '0.15s' }}>
                                <SectionCard icon="🗓️" title="Project Timeline" accent="#2563eb">
                                    <PhaseTimeline phases={ai.timeline_phases} />
                                </SectionCard>
                            </div>
                        )}

                        {/* Risks */}
                        {ai.potential_risks?.length > 0 && (
                            <div className="card-anim" style={{ animationDelay: '0.2s' }}>
                                <SectionCard icon="⚠️" title={`Risk Assessment (${ai.potential_risks.length})`} accent="#ef4444">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {ai.potential_risks.map((r, i) => <RiskCard key={i} risk={r} />)}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Recommendations */}
                        {ai.recommendations?.length > 0 && (
                            <div className="card-anim" style={{ animationDelay: '0.25s' }}>
                                <SectionCard icon="🎯" title="Recommendations" accent="#10b981">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {ai.recommendations.map((r, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                {/* Recommendation number → purple */}
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: 6,
                                                    background: PURPLE.light, color: PURPLE.main,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 1,
                                                }}>{i + 1}</div>
                                                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{r}</p>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Clarifications Needed */}
                        {ai.clarification_needed?.length > 0 && (
                            <div className="card-anim" style={{ animationDelay: '0.3s' }}>
                                <SectionCard icon="❓" title="Clarifications Needed" accent="#f59e0b">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {ai.clarification_needed.map((q, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                                                <span style={{ color: '#d97706', fontWeight: 800, fontSize: 13 }}>Q{i + 1}</span>
                                                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{q}</p>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Score Card */}
                        {ai.feasibility_score && (
                            <div className="card-anim" style={{ animationDelay: '0.05s' }}>
                                <div style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 18, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                    <ScoreMeter score={ai.feasibility_score} />
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="card-anim" style={{ animationDelay: '0.1s' }}>
                            <div style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', fontSize: 13, fontWeight: 800, color: '#111827' }}>
                                    📊 Quick Overview
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {[
                                        { label: 'Duration', value: ai.estimated_duration, icon: '⏱️' },
                                        { label: 'Platform', value: analysis.platform?.toUpperCase(), icon: '💻' },
                                        { label: 'Users', value: analysis.expected_users?.toLocaleString(), icon: '👥' },
                                        { label: 'Budget', value: analysis.budget_range, icon: '💰' },
                                        { label: 'Deadline', value: analysis.expected_deadline, icon: '📅' },
                                    ].filter(x => x.value).map((item, i, arr) => (
                                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                                            <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {item.icon} {item.label}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Status Indicators */}
                        {(timeline || budget) && (
                            <div className="card-anim" style={{ animationDelay: '0.15s' }}>
                                <div style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', fontSize: 13, fontWeight: 800, color: '#111827' }}>
                                        🔍 Assessments
                                    </div>
                                    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {timeline && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: timeline.bg }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Timeline</span>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: timeline.color }}>
                                                    {timeline.icon} {timeline.label}
                                                </span>
                                            </div>
                                        )}
                                        {budget && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: budget.bg }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Budget</span>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: budget.color }}>
                                                    {budget.icon} {budget.label}
                                                </span>
                                            </div>
                                        )}
                                        {ai.budget_notes && (
                                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{ai.budget_notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tech Stack */}
                        {ai.recommended_tech_stack?.length > 0 && (
                            <div className="card-anim" style={{ animationDelay: '0.2s' }}>
                                <SectionCard icon="⚙️" title="Tech Stack" accent="#6366f1">
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                        {ai.recommended_tech_stack.map((t, i) => (
                                            <span key={i} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Team Structure */}
                        {ai.team_structure?.length > 0 && (
                            <div className="card-anim" style={{ animationDelay: '0.25s' }}>
                                <SectionCard icon="👥" title="Recommended Team" accent="#0ea5e9">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {ai.team_structure.map((m, i) => <TeamCard key={i} member={m} />)}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* Client Info */}
                        <div className="card-anim" style={{ animationDelay: '0.3s' }}>
                            <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 18, padding: '18px' }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    🏢 Client Info
                                </div>
                                {[
                                    { label: 'Company', value: client.company_name },
                                    { label: 'Contact', value: client.contact_person },
                                    { label: 'Email', value: client.email },
                                    { label: 'Phone', value: client.phone },
                                    { label: 'Industry', value: client.industry },
                                ].filter(x => x.value).map((item) => (
                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{item.label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', maxWidth: '60%', textAlign: 'right' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </AppLayout>
    );
}