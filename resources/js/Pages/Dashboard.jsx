import { useMemo, useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ─────────────────────────────────────────────────────────────────────────────
// Theme system — identical pattern to DocumentTranslation.jsx
// ─────────────────────────────────────────────────────────────────────────────
function useReactiveTheme() {
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

function getTheme(dark) {
    if (dark) return {
        bg:          '#080e1a',
        surface:     'rgba(15,26,50,0.92)',
        surfaceSoft: 'rgba(255,255,255,0.04)',
        border:      'rgba(148,163,184,0.12)',
        text:        '#f1f5f9',
        textSoft:    '#94a3b8',
        textMute:    '#475569',
        shadow:      '0 2px 12px rgba(0,0,0,0.32)',
        primary:     '#6366f1',
        primarySoft: 'rgba(99,102,241,0.18)',
        success:     '#10b981',
        successSoft: 'rgba(16,185,129,0.16)',
        warning:     '#f59e0b',
        warningSoft: 'rgba(245,158,11,0.16)',
        danger:      '#ef4444',
        dangerSoft:  'rgba(239,68,68,0.14)',
        blue:        '#3b82f6',
        blueSoft:    'rgba(59,130,246,0.16)',
        violet:      '#8b5cf6',
        violetSoft:  'rgba(139,92,246,0.16)',
        amber:       '#f59e0b',
        amberSoft:   'rgba(245,158,11,0.16)',
        emerald:     '#10b981',
        emeraldSoft: 'rgba(16,185,129,0.16)',
        rose:        '#f43f5e',
        roseSoft:    'rgba(244,63,94,0.16)',
        rowBg:       'rgba(255,255,255,0.03)',
        inputBg:     'rgba(255,255,255,0.06)',
        inputBorder: 'rgba(148,163,184,0.18)',
    };
    return {
        bg:          '#f1f5f9',
        surface:     '#ffffff',
        surfaceSoft: '#f8fafc',
        border:      'rgba(15,23,42,0.08)',
        text:        '#0f172a',
        textSoft:    '#475569',
        textMute:    '#94a3b8',
        shadow:      '0 2px 12px rgba(15,23,42,0.06)',
        primary:     '#6366f1',
        primarySoft: '#eef2ff',
        success:     '#059669',
        successSoft: '#d1fae5',
        warning:     '#d97706',
        warningSoft: '#fef3c7',
        danger:      '#ef4444',
        dangerSoft:  '#fee2e2',
        blue:        '#2563eb',
        blueSoft:    '#dbeafe',
        violet:      '#7c3aed',
        violetSoft:  '#ede9fe',
        amber:       '#d97706',
        amberSoft:   '#fef3c7',
        emerald:     '#059669',
        emeraldSoft: '#d1fae5',
        rose:        '#e11d48',
        roseSoft:    '#ffe4e6',
        rowBg:       '#f8fafc',
        inputBg:     '#f8fafc',
        inputBorder: '#e2e8f0',
    };
}

// Card style helper
function card(t, extra = {}) {
    return {
        background:    t.surface,
        border:        `1px solid ${t.border}`,
        borderRadius:  28,
        boxShadow:     t.shadow,
        ...extra,
    };
}

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const roleIn = (role, roles) => roles.includes(String(role || '').toLowerCase());
function formatMoney(v) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v || 0)); }

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, helper, color, soft, t }) {
    return (
        <div style={{ ...card(t, { padding: 20 }) }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: soft, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
                {icon}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: t.text, lineHeight: 1 }}>{value}</div>
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color }}>{label}</div>
            {helper ? <div style={{ marginTop: 6, fontSize: 12, color: t.textMute }}>{helper}</div> : null}
        </div>
    );
}

// StatCard ကို ဒီတိုင်းထားပြီး payslip card ကိုသာ locally manage လုပ်
function PayslipCard({ value, helper, t }) {
    const [show, setShow] = useState(false);

    return (
        <div style={{ ...card(t, { padding: 20, position: 'relative' }) }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: t.emeraldSoft, color: t.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
                💵
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: t.text, lineHeight: 1, letterSpacing: '-1px' }}>
                    {show ? value : '••••••'}
                </div>

                <button
                    onClick={() => setShow(v => !v)}
                    title={show ? 'Hide amount' : 'Show amount'}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: t.textMute,
                        transition: 'color 0.15s',
                        marginTop: 2,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = t.text}
                    onMouseLeave={e => e.currentTarget.style.color = t.textMute}
                >
                    {show ? (
                        // Eye-off icon
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    ) : (
                        // Eye icon
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    )}
                </button>
            </div>

            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: t.emerald }}>Latest payslip</div>
            {helper ? <div style={{ marginTop: 6, fontSize: 12, color: t.textMute }}>{helper}</div> : null}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────────────────
function Panel({ title, subtitle, children, t, action }) {
    return (
        <div style={{ ...card(t, { padding: 20 }) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: t.text }}>{title}</div>
                    {subtitle ? <div style={{ marginTop: 3, fontSize: 12, color: t.textMute }}>{subtitle}</div> : null}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle, t, compact }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: compact ? 120 : 180, borderRadius: 20, border: `1.5px dashed ${t.border}`, background: t.surfaceSoft, textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{title}</div>
            {subtitle ? <div style={{ marginTop: 4, fontSize: 12, color: t.textMute }}>{subtitle}</div> : null}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DonutChart
// ─────────────────────────────────────────────────────────────────────────────
function DonutChart({ data = [], centerLabel = 'total', t }) {
    const total = data.reduce((s, i) => s + Number(i.value || 0), 0);
    if (!total) return <EmptyState icon="📊" title="No chart data yet" subtitle="This block will fill itself when records exist." t={t} compact />;
    const r = 42, circ = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 160, height: 160, margin: '0 auto' }}>
                <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r={r} fill="none" stroke={t.border} strokeWidth="12" />
                    {data.map((item, i) => {
                        const pct  = Number(item.value || 0) / total;
                        const dash = pct * circ;
                        const seg  = <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={item.color} strokeWidth="12" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset * circ} strokeLinecap="round" />;
                        offset += pct;
                        return seg;
                    })}
                    <g transform="rotate(90 60 60)">
                        <text x="60" y="55" textAnchor="middle" style={{ fontSize: 18, fontWeight: 900, fill: t.text }}>{total}</text>
                        <text x="60" y="70" textAnchor="middle" style={{ fontSize: 8, fontWeight: 600, fill: t.textMute, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{centerLabel}</text>
                    </g>
                </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.surfaceSoft, border: `1px solid ${t.border}`, borderRadius: 12, padding: '8px 12px' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: t.text }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: item.color }}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// BarChart
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ data = [], color = '#4f46e5', valueKey = 'value', labelKey = 'label', formatter = v => v, t }) {
    const max = Math.max(...data.map(i => Number(i[valueKey] || 0)), 0);
    if (!max) return <EmptyState icon="📈" title="No trend data yet" subtitle="Once records are created, trend bars will appear here." t={t} compact />;
    return (
        <div style={{ display: 'flex', height: 200, alignItems: 'flex-end', gap: 10, paddingTop: 24, overflowX: 'auto' }}>
            {data.map((item, i) => {
                const val = Number(item[valueKey] || 0);
                const h   = Math.max(12, (val / max) * 140);
                return (
                    <div key={i} style={{ flex: 1, minWidth: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: t.textMute }}>{formatter(val, item)}</div>
                        <div style={{ width: '100%', height: h, borderRadius: '8px 8px 0 0', background: `linear-gradient(180deg, ${color}, ${color}bb)` }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: t.textMute, textTransform: 'uppercase' }}>{item[labelKey]}</div>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// LineChart — with hover tooltip
// ─────────────────────────────────────────────────────────────────────────────
function LineChart({ data = [], stroke = '#2563eb', labelKey = 'label', valueKey = 'value', t, tooltipLabel = 'present', formatTooltip }) {
    const W = 420, H = 180;
    const [hovered, setHovered] = useState(null);

    if (!data.length) return <EmptyState icon="📉" title="No weekly pattern yet" subtitle="Attendance line will show once enough daily data exists." t={t} compact />;

    const max    = Math.max(...data.map(d => Number(d[valueKey] || 0)), 1);
    const points = data.map((item, i) => [
        (i / Math.max(data.length - 1, 1)) * (W - 30) + 15,
        H - ((Number(item[valueKey] || 0) / max) * 110 + 25),
    ]);
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 176, overflow: 'visible' }}>
                <path d={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
                {points.map((p, i) => {
                    const item    = data[i];
                    const absent  = item.absent || item.value === 0;
                    const dotFill = absent ? (hovered?.index === i ? '#fff' : t.border) : (hovered?.index === i ? '#fff' : stroke);
                    const dotStroke = absent ? t.textMute : stroke;

                    return (
                        <g key={i}>
                            <circle cx={p[0]} cy={p[1]} r="14" fill="transparent"
                                onMouseEnter={() => setHovered({ index: i, x: p[0], y: p[1], item })}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: 'pointer' }}
                            />
                            <circle cx={p[0]} cy={p[1]} r={hovered?.index === i ? 6 : 4}
                                fill={dotFill}
                                stroke={dotStroke}
                                strokeWidth={hovered?.index === i ? 2.5 : (absent ? 1.5 : 0)}
                                style={{ transition: 'r 0.12s', pointerEvents: 'none' }}
                            />
                        </g>
                    );
                })}

                {/* Tooltip */}
                {hovered && (() => {
                    const tx     = Math.min(Math.max(hovered.x, 50), W - 50);
                    const ty     = hovered.y - 14;
                    const absent = hovered.item?.absent || hovered.item?.value === 0;

                    const label  = formatTooltip
                        ? formatTooltip(hovered.item)
                        : `${hovered.item[valueKey]} ${tooltipLabel}`;

                    const bgColor = absent ? t.textMute : stroke;
                    const txtW    = label.length * 7 + 20;

                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            <rect x={tx - txtW / 2} y={ty - 30} width={txtW} height={28} rx="8" fill={bgColor} opacity="0.93" />
                            <text x={tx} y={ty - 13} textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: '#fff' }}>
                                {label}
                            </text>
                        </g>
                    );
                })()}
            </svg>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 4, marginTop: 6, textAlign: 'center' }}>
                {data.map((item, i) => (
                    <div key={i} style={{ fontSize: 11, fontWeight: 700, color: item.absent || item.value === 0 ? t.textMute : t.textSoft }}>
                        {item[labelKey]}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AlertList
// ─────────────────────────────────────────────────────────────────────────────
function AlertList({ items = [], emptyTitle, emptySubtitle, icon, color, soft, t, dateKey = 'date' }) {
    if (!items.length) return <EmptyState icon={icon} title={emptyTitle} subtitle={emptySubtitle} t={t} compact />;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 16, border: `1px solid ${t.border}`, background: soft }}>
                    <div style={{ fontSize: 18, marginTop: 1 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ marginTop: 3, fontSize: 11, color: t.textSoft }}>{item.department || 'No department'} · {item[dateKey]}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color, background: t.surface, padding: '3px 10px', borderRadius: 99, border: `1px solid ${t.border}`, flexShrink: 0 }}>{item.days_left}d</div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// BirthdayList
// ─────────────────────────────────────────────────────────────────────────────
function BirthdayList({ items = [], t }) {
    if (!items.length) return <EmptyState icon="🎂" title="No birthdays this week" subtitle="Team birthday reminders will appear here." t={t} compact />;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 16, border: `1px solid ${t.border}`, background: t.roseSoft }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#f43f5e,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎂</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ marginTop: 2, fontSize: 11, color: t.textSoft }}>{item.department || 'No department'}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: t.rose, background: t.surface, padding: '3px 10px', borderRadius: 99, border: `1px solid ${t.border}`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {item.birthday_date}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// OnLeaveList
// ─────────────────────────────────────────────────────────────────────────────
function OnLeaveList({ items = [], t }) {
    if (!items.length) return <EmptyState icon="✅" title="Everyone is in today" subtitle="No approved leave for today." t={t} compact />;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 16, border: `1px solid ${t.border}`, background: t.amberSoft }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🌴</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ marginTop: 2, fontSize: 11, color: t.textSoft }}>{item.department || 'No department'}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.amber, background: t.surface, padding: '3px 10px', borderRadius: 99, border: `1px solid ${t.border}`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {item.leave_type || 'Leave'}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Announcement Modal
// ─────────────────────────────────────────────────────────────────────────────
function AnnouncementModal({ onClose, onCreated, t }) {
    const [form, setForm]     = useState({ title: '', content: '', start_at: '', end_at: '' });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const submit = async () => {
        const e = {};
        if (!form.title.trim())   e.title    = 'Title is required';
        if (!form.content.trim()) e.content  = 'Content is required';
        if (!form.start_at)       e.start_at = 'Start time is required';
        if (!form.end_at)         e.end_at   = 'End time is required';
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        try {
            const res = await fetch('/dashboard/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), Accept: 'application/json', 'X-Inertia': 'true' },
                body: JSON.stringify(form),
            });
            if (!res.ok) { const d = await res.json().catch(() => ({})); setErrors(d.errors || { general: 'Unable to save.' }); return; }
            window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'Announcement created.', type: 'success' } }));
            onCreated();
        } catch {
            window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'Unable to create announcement.', type: 'error' } }));
        } finally { setSaving(false); }
    };

    const fieldStyle = name => ({
        width: '100%', background: errors[name] ? '#fef2f2' : t.inputBg,
        border: `1.5px solid ${errors[name] ? '#fca5a5' : t.inputBorder}`,
        borderRadius: 12, padding: '10px 14px', fontSize: 13,
        color: t.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    });

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,8,23,0.55)', backdropFilter: 'blur(6px)', padding: 20 }}>
            <div style={{ ...card(t, { width: '100%', maxWidth: 520, overflow: 'hidden' }) }}>
                <div style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed)', padding: '20px 24px' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Create announcement</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Make it visible at the top of the dashboard for everyone in scope.</div>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: t.textMute, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Title</div>
                        <input style={fieldStyle('title')} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Khmer New Year office arrangement" />
                        {errors.title ? <div style={{ marginTop: 4, fontSize: 11, color: '#ef4444' }}>{errors.title}</div> : null}
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: t.textMute, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Message</div>
                        <textarea rows="4" style={{ ...fieldStyle('content'), resize: 'vertical' }} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Explain what changed, who should care, and what action is needed." />
                        {errors.content ? <div style={{ marginTop: 4, fontSize: 11, color: '#ef4444' }}>{errors.content}</div> : null}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[['Start at', 'start_at'], ['End at', 'end_at']].map(([lbl, key]) => (
                            <div key={key}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: t.textMute, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{lbl}</div>
                                <input type="datetime-local" style={fieldStyle(key)} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                                {errors[key] ? <div style={{ marginTop: 4, fontSize: 11, color: '#ef4444' }}>{errors[key]}</div> : null}
                            </div>
                        ))}
                    </div>
                    {errors.general ? <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ef4444' }}>{errors.general}</div> : null}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: t.surfaceSoft, color: t.textSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={submit} disabled={saving} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: saving ? '#a5b4fc' : 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.8 : 1 }}>
                            {saving ? 'Saving…' : 'Publish'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnnouncementHero
// ─────────────────────────────────────────────────────────────────────────────
function AnnouncementHero({ roleName, announcements = [], onReload, t }) {
    const [showModal, setShowModal] = useState(false);
    const canManage = roleIn(roleName, ['admin', 'hr']);

    const deleteAnnouncement = async id => {
        try {
            const res = await fetch(`/dashboard/announcements/${id}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf(), Accept: 'application/json', 'X-Inertia': 'true' } });
            if (res.ok) { window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'Announcement deleted.', type: 'success' } })); onReload(); }
        } catch { window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'Unable to delete.', type: 'error' } })); }
    };

    return (
        <>
            {announcements.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {announcements.slice(0, 3).map(item => (
                        <div key={item.id} style={{ ...card(t, { padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }) }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: t.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📢</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: t.text }}>{item.title}</div>
                                <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.6, color: t.textSoft }}>{item.content}</div>
                                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMute, background: t.surfaceSoft, border: `1px solid ${t.border}`, padding: '2px 10px', borderRadius: 99 }}>By {item.created_by || 'System'}</span>
                                    {item.department ? <span style={{ fontSize: 11, fontWeight: 600, color: t.textMute, background: t.surfaceSoft, border: `1px solid ${t.border}`, padding: '2px 10px', borderRadius: 99 }}>{item.department}</span> : null}
                                </div>
                            </div>
                            {canManage && (
                                <button onClick={() => deleteAnnouncement(item.id)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {canManage && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
                    >
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>+</span>
                        New announcement
                    </button>
                </div>
            )}

            {showModal ? <AnnouncementModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); onReload(); }} t={t} /> : null}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard(props) {
    const { roleName, dashboardMode, announcements = [], orgSummary = {}, teamSummary = {}, approvalQueue = {}, employeeStats = {}, employmentChart = [], departmentChart = [], payrollTrend = [], attendanceTrend = [], probationAlerts = [], contractAlerts = [], myStats = {}, todayStatus = {}, upcomingHolidays = [], weeklyAttendance = [], birthdaysThisWeek = [], onLeaveToday = [] } = props;

    const dark = useReactiveTheme();
    const t    = useMemo(() => getTheme(dark), [dark]);

    const { auth } = usePage().props;
    const firstName = auth?.user?.name?.split(' ')?.[0] || 'there';
    const now       = new Date();
    const hour      = now.getHours();
    const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const isHrAdmin    = roleIn(roleName, ['admin', 'hr']);
    const isManagement = roleIn(roleName, ['management']);


    const G  = { display: 'grid', gap: 16 };
    const G4 = { ...G, gridTemplateColumns: 'repeat(4,1fr)' };
    const G3a = { ...G, gridTemplateColumns: '1.1fr 1.2fr 1fr' };
    const G3b = { ...G, gridTemplateColumns: '1.1fr 1.1fr 1.4fr' };
    const G2  = { ...G, gridTemplateColumns: '1fr 1fr 1.2fr' };

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>

                {/* ── Hero ── */}
                <div style={{ ...card(t, { padding: 24 }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.blue }}>{dashboardMode || 'personal'} dashboard</div>
                            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: '-0.5px' }}>{greeting}, {firstName}</div>
                            <div style={{ marginTop: 6, fontSize: 13, color: t.textMute }}>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minWidth: 360 }}>
                            {/* Today status */}
                            <div style={{ background: t.surfaceSoft, border: `1px solid ${t.border}`, borderRadius: 20, padding: '14px 18px' }}>
                                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', color: t.textMute }}>Today status</div>
                                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 900, color: t.text }}>{todayStatus.checked_in ? `Checked in ${todayStatus.check_in || ''}` : 'Not checked in yet'}</div>
                                <div style={{ marginTop: 4, fontSize: 11, color: t.textMute }}>{todayStatus.check_out ? `Checked out ${todayStatus.check_out}` : 'Waiting for today activity'}</div>
                            </div>
                            {/* Next holiday */}
                            <div style={{ background: t.blueSoft, border: `1px solid ${t.blue}22`, borderRadius: 20, padding: '14px 18px' }}>
                                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', color: t.blue }}>Next holiday</div>
                                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 900, color: t.text }}>{upcomingHolidays[0]?.name || 'No upcoming holiday'}</div>
                                <div style={{ marginTop: 4, fontSize: 11, color: t.textMute }}>{upcomingHolidays[0]?.date || 'Calendar is clear for now'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Announcements ── */}
                <AnnouncementHero roleName={roleName} announcements={announcements} onReload={() => router.reload({ only: ['announcements'] })} t={t} />

                {/* ── HR / Admin ── */}
                {isHrAdmin ? (
                    <>
                        <div style={G4}>
                            <StatCard icon="👥" label="Headcount"               value={orgSummary.total_employees || employeeStats.total || 0} helper="Active employees in your scope"  color={t.blue}    soft={t.blueSoft}    t={t} />
                            <StatCard icon="🧾" label="Pending leave approvals" value={approvalQueue.pending_leave_requests || 0}              helper="Needs HR/Admin review"            color={t.amber}   soft={t.amberSoft}   t={t} />
                            <StatCard icon="⏱️" label="Pending OT approvals"   value={approvalQueue.pending_ot_requests || 0}                 helper="Awaiting action"                  color={t.violet}  soft={t.violetSoft}  t={t} />
                            <StatCard icon="🏢" label="Departments"             value={orgSummary.total_departments || 0}                     helper="Distinct teams represented"       color={t.emerald} soft={t.emeraldSoft} t={t} />
                        </div>
                        <div style={G3a}>
                            <Panel title="Employment mix"          subtitle="Permanent, probation and contract breakdown" t={t}><DonutChart data={employmentChart} centerLabel="employees" t={t} /></Panel>
                            <Panel title="Payroll trend"           subtitle="Last 6 months payroll records and salary total" t={t}><BarChart data={payrollTrend} valueKey="count" labelKey="month" formatter={(v, item) => `$${formatMoney(item.total || 0)}`} t={t} /></Panel>
                            <Panel title="Department distribution" subtitle="Which departments have the highest headcount" t={t}><BarChart data={departmentChart} valueKey="value" labelKey="label" color="#10b981" t={t} /></Panel>
                        </div>
                        <div style={G3b}>
                            <Panel title="Probation ending soon"   subtitle="Within 10 days" t={t}><AlertList items={probationAlerts} emptyTitle="No probation alert"  emptySubtitle="Everyone is on track."       icon="⏳" color={t.amber}  soft={t.amberSoft}  t={t} dateKey="probation_end" /></Panel>
                            <Panel title="Contract expiring soon"  subtitle="Within 30 days" t={t}><AlertList items={contractAlerts}  emptyTitle="No contract alert"   emptySubtitle="No contract is near expiry." icon="📄" color={t.blue}   soft={t.blueSoft}   t={t} dateKey="contract_end"  /></Panel>
                            <Panel title="Weekly attendance trend" subtitle="Hover a dot to see daily headcount" t={t}>
                                <LineChart data={attendanceTrend} stroke="#7c3aed" t={t} tooltipLabel="present" />
                            </Panel>
                        </div>
                        <div style={{ ...G, gridTemplateColumns: '1fr 1fr' }}>
                            <Panel title="🎂 Birthdays this week" subtitle="Team member birthdays coming up" t={t}>
                                <BirthdayList items={birthdaysThisWeek} t={t} />
                            </Panel>
                            <Panel title="🌴 On leave today" subtitle="Employees with approved leave today" t={t}>
                                <OnLeaveList items={onLeaveToday} t={t} />
                            </Panel>
                        </div>
                    </>
                ) : null}

                {/* ── Management ── */}
                {isManagement ? (
                    <>
                        <div style={G4}>
                            <StatCard icon="🧩" label="Team members"   value={teamSummary.headcount || 0}                                                                            helper="Visible in your team scope"    color={t.blue}    soft={t.blueSoft}    t={t} />
                            <StatCard icon="🟢" label="Present today"  value={teamSummary.present_today || 0}                                                                        helper="Attendance records for today"  color={t.emerald} soft={t.emeraldSoft} t={t} />
                            <StatCard icon="🟠" label="On leave today" value={teamSummary.on_leave_today || 0}                                                                       helper="Approved leave covering today" color={t.amber}   soft={t.amberSoft}   t={t} />
                            <StatCard icon="🔔" label="Need approvals" value={(approvalQueue.pending_leave_requests || 0) + (approvalQueue.pending_ot_requests || 0)}                helper="Your approver queue"           color={t.violet}  soft={t.violetSoft}  t={t} />
                        </div>
                        <div style={G2}>
                            <Panel title="Team composition"       subtitle="Employment type distribution in your scope" t={t}><DonutChart data={employmentChart} centerLabel="team" t={t} /></Panel>
                            <Panel title="Approval queue"         subtitle="Fast action area for managers" t={t}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ background: t.amberSoft, border: `1px solid ${t.amber}22`, borderRadius: 14, padding: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.amber }}>Pending leave</div>
                                        <div style={{ marginTop: 8, fontSize: 30, fontWeight: 900, color: t.text }}>{approvalQueue.pending_leave_requests || 0}</div>
                                    </div>
                                    <div style={{ background: t.violetSoft, border: `1px solid ${t.violet}22`, borderRadius: 14, padding: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.violet }}>Pending overtime</div>
                                        <div style={{ marginTop: 8, fontSize: 30, fontWeight: 900, color: t.text }}>{approvalQueue.pending_ot_requests || 0}</div>
                                    </div>
                                </div>
                            </Panel>
                            <Panel title="Team attendance pattern" subtitle="Hover a dot to see daily headcount" t={t}>
                                <LineChart data={attendanceTrend} stroke="#2563eb" t={t} tooltipLabel="present" />
                            </Panel>
                        </div>
                        <div style={{ ...G, gridTemplateColumns: '1fr 1fr' }}>
                            <Panel title="🎂 Birthdays this week" subtitle="Team member birthdays coming up" t={t}>
                                <BirthdayList items={birthdaysThisWeek} t={t} />
                            </Panel>
                            <Panel title="🌴 On leave today" subtitle="Employees with approved leave today" t={t}>
                                <OnLeaveList items={onLeaveToday} t={t} />
                            </Panel>
                        </div>
                    </>
                ) : null}

                {/* ── Personal stats ── */}
                <div style={G4}>
                    <StatCard icon="🌴" label="Pending leaves"  value={myStats.pending_leaves || 0}                                         helper={myStats.pending_leaves ? 'Waiting for approval' : 'No pending leave'}           color={t.amber}   soft={t.amberSoft}   t={t} />
                    <StatCard icon="⏱️" label="OT this month"  value={`${myStats.ot_hours_month || 0}h`}                                   helper="Approved overtime hours"                                                         color={t.violet}  soft={t.violetSoft}  t={t} />
                    <StatCard icon="🗓️" label="Present days"   value={myStats.present_days || 0}                                          helper="This month attendance"                                                           color={t.blue}    soft={t.blueSoft}    t={t} />
                    <PayslipCard
                        value={myStats.net_salary ? `$${formatMoney(myStats.net_salary)}` : '—'}
                        helper={myStats.payslip_status ? `Status: ${myStats.payslip_status}` : 'No payslip yet'}
                        t={t}
                    />
                </div>

                <div style={{ ...G, gridTemplateColumns: '1.2fr 1fr' }}>
                    <Panel title="My weekly attendance" subtitle="Hover a dot to see your attendance" t={t}>
                       
                        <LineChart
                            data={weeklyAttendance}
                            stroke="#10b981"
                            t={t}
                            tooltipLabel="day"
                            formatTooltip={(item) => {
                                if (item.absent || item.value === 0) return 'Absent';
                                const h = Math.floor(item.value);
                                const m = Math.round((item.value - h) * 60);
                                if (h === 0) return `${m}m`;
                                if (m === 0) return `${h}h`;
                                return `${h}h ${m}m`;
                            }}
                        />
                    </Panel>
                    <Panel title="Upcoming holidays" subtitle="Country based public holiday list" t={t}>
                        {upcomingHolidays.length ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {upcomingHolidays.map((h, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.surfaceSoft, border: `1px solid ${t.border}`, borderRadius: 14, padding: '10px 14px' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{h.name}</div>
                                            <div style={{ fontSize: 11, color: t.textMute }}>Public holiday</div>
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: t.violet, background: t.violetSoft, padding: '3px 10px', borderRadius: 99 }}>{h.date}</div>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState icon="🎌" title="No holiday scheduled" subtitle="Nothing upcoming in your country calendar." t={t} compact />}
                    </Panel>
                </div>

            </div>
        </AppLayout>
    );
}