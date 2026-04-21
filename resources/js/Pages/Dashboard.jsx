// resources/js/Pages/Dashboard.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const roleIn = (role, roles) => roles.includes(String(role || '').toLowerCase());
const fmtMoney = v => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v || 0));
const ucfirst = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const toast = (msg, type = 'success') =>
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type } }));


// Date/time formatters — strip T00:00:00.000000Z raw ISO strings
const fmtDate = v => {
    if (!v) return '—';
    const s = String(v);
    // Already clean date like "2026-04-20"
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
    }
    const dt = new Date(s);
    if (isNaN(dt)) return s.replace(/T.*/, '');
    return dt.toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' });
};
const fmtTime = v => {
    if (!v) return '—';
    return String(v).substring(0, 5); // "HH:MM"
};
const to12h = v => {
    if (!v) return '—';
    const clean = String(v).substring(0, 5);
    const [hStr, mStr] = clean.split(':');
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return clean;
    return `${h % 12 === 0 ? 12 : h % 12}:${mStr ?? '00'} ${h >= 12 ? 'PM' : 'AM'}`;
};
const fmtHrs = h => {
    const n = parseFloat(h);
    if (!n || isNaN(n)) return '0h';
    const hrs  = Math.floor(n);
    const mins = Math.round((n - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
};
// OT policy colors
const OT_COLORS = {
    'Day Weekday OT':    { color:'#7c3aed', bg:'#f5f3ff', bgDark:'rgba(124,58,237,0.14)', border:'#ddd6fe', grad:'linear-gradient(135deg,#7c3aed,#a78bfa)' },
    'Night Weekday OT':  { color:'#1d4ed8', bg:'#eff6ff', bgDark:'rgba(29,78,216,0.14)',  border:'#bfdbfe', grad:'linear-gradient(135deg,#1d4ed8,#60a5fa)' },
    'Day Weekend OT':    { color:'#059669', bg:'#ecfdf5', bgDark:'rgba(5,150,105,0.14)',   border:'#6ee7b7', grad:'linear-gradient(135deg,#059669,#34d399)' },
    'Night Weekend OT':  { color:'#0369a1', bg:'#f0f9ff', bgDark:'rgba(3,105,161,0.14)',   border:'#bae6fd', grad:'linear-gradient(135deg,#0369a1,#38bdf8)' },
    'Public Holiday OT': { color:'#dc2626', bg:'#fef2f2', bgDark:'rgba(220,38,38,0.14)',   border:'#fca5a5', grad:'linear-gradient(135deg,#dc2626,#f87171)' },
};
const OT_FALLBACK = { color:'#6b7280', bg:'#f9fafb', bgDark:'rgba(107,114,128,0.14)', border:'#e5e7eb', grad:'linear-gradient(135deg,#6b7280,#9ca3af)' };
const getOTColor = title => OT_COLORS[title] || OT_FALLBACK;

// Format day count: 8.0 → "8", 1.5 → "1.5" (strip unnecessary .0)
const fmtDays = v => { const n = parseFloat(v); if (isNaN(n)) return String(v || ''); return n % 1 === 0 ? String(Math.round(n)) : String(n); };

// ─────────────────────────────────────────────────────────────────────────────
// Theme
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
        return () => { window.removeEventListener('vibeme-theme-change', sync); window.removeEventListener('storage', sync); };
    }, []);
    return dark;
}

function getTheme(dark) {
    if (dark) return {
        bg: 'transparent', surface: 'rgba(17,25,45,0.92)', surface2: 'rgba(255,255,255,0.04)', surface3: 'rgba(255,255,255,0.07)',
        border: 'rgba(148,163,184,0.10)', borderMid: 'rgba(148,163,184,0.16)',
        text: '#f1f5f9', textSoft: '#94a3b8', textMute: '#475569', shadow: '0 2px 16px rgba(0,0,0,0.35)',
        blue: '#3b82f6', blueSoft: 'rgba(59,130,246,0.15)',
        green: '#10b981', greenSoft: 'rgba(16,185,129,0.15)',
        amber: '#f59e0b', amberSoft: 'rgba(245,158,11,0.15)',
        red: '#f87171', redSoft: 'rgba(248,113,113,0.15)',
        violet: '#a78bfa', violetSoft: 'rgba(167,139,250,0.15)',
        pink: '#f472b6', pinkSoft: 'rgba(244,114,182,0.15)',
        teal: '#2dd4bf', tealSoft: 'rgba(45,212,191,0.15)',
    };
    return {
        bg: 'transparent', surface: '#ffffff', surface2: '#f8fafc', surface3: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)', borderMid: 'rgba(15,23,42,0.13)',
        text: '#0f172a', textSoft: '#475569', textMute: '#94a3b8', shadow: '0 1px 8px rgba(15,23,42,0.06)',
        blue: '#2563eb', blueSoft: '#dbeafe',
        green: '#059669', greenSoft: '#d1fae5',
        amber: '#d97706', amberSoft: '#fef3c7',
        red: '#dc2626', redSoft: '#fee2e2',
        violet: '#7c3aed', violetSoft: '#ede9fe',
        pink: '#db2777', pinkSoft: '#fce7f3',
        teal: '#0d9488', tealSoft: '#ccfbf1',
    };
}

const card = (t, extra = {}) => ({ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, boxShadow: t.shadow, ...extra });
const col2  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const col3  = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 };

// ─────────────────────────────────────────────────────────────────────────────
// Base components
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, soft, t }) {
    return (
        <div style={{ ...card(t, { padding: '16px 18px', position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '20px 20px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.textMute, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: t.textSoft, marginTop: 3 }}>{sub}</div>}
        </div>
    );
}

function Panel({ title, subtitle, t, children, action }) {
    return (
        <div style={card(t, { padding: '18px 20px' })}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{title}</div>
                    {subtitle && <div style={{ fontSize: 11, color: t.textMute, marginTop: 2 }}>{subtitle}</div>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function BarRow({ label, value, max = 100, color, extra, t }) {
    const pct = Math.min(Math.round((Number(value) / Math.max(max, 1)) * 100), 100);
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 48px', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: t.textSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
            <div style={{ height: 7, background: t.surface3, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color, textAlign: 'right' }}>{extra ?? value}</div>
        </div>
    );
}

function DonutChart({ data = [], size = 130, t }) {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    if (!total) return <div style={{ fontSize: 11, color: t.textMute, textAlign: 'center', padding: 12 }}>No data</div>;
    const r = 46, cx = size / 2, cy = size / 2, stroke = 18, circ = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Donut — left side */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.surface3} strokeWidth={stroke} />
                {data.map((d, i) => {
                    const pct = d.value / total, dash = pct * circ;
                    const seg = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={stroke}
                        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset * circ}
                        transform={`rotate(-90 ${cx} ${cy})`} />;
                    offset += pct; return seg;
                })}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="24" fontWeight="900" fill={t.text}>{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill={t.textMute}>employees</text>
            </svg>
            {/* Legend — right side: compact, square · label · count */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: t.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{d.label}</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: d.color, lineHeight: 1, marginLeft: 6 }}>{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PersonRow({ name, meta, badge, badgeColor, badgeSoft, avatarBg, avatarColor, last, t }) {
    const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${t.border}` }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{name}</div>
                <div style={{ fontSize: 10, color: t.textMute }}>{meta}</div>
            </div>
            {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: badgeSoft, color: badgeColor, flexShrink: 0 }}>{badge}</span>}
        </div>
    );
}

function AlertRow({ name, dept, tag, color, soft, urgent, t }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: urgent ? soft : t.surface2, border: `1px solid ${urgent ? color + '33' : t.border}`, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: urgent ? color : t.textMute, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                {dept && <div style={{ fontSize: 10, color: t.textMute }}>{dept}</div>}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: urgent ? color : t.surface3, color: urgent ? '#fff' : t.textSoft, flexShrink: 0 }}>{tag}</span>
        </div>
    );
}

function HolidayList({ items = [], t }) {
    if (!items.length) return <div style={{ fontSize: 12, color: t.textMute, padding: '8px 0' }}>No upcoming holidays</div>;
    return items.map((h, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.tealSoft, color: t.teal, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{h.day}</div>
                <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase' }}>{h.month}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{h.name}</div>
                <div style={{ fontSize: 10, color: t.textMute }}>{h.date}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: t.tealSoft, color: t.teal }}>{h.days_left}d</span>
        </div>
    ));
}

// On leave today — collapsible, approved only, max 4 visible then "show more"
function OnLeaveTodayList({ items = [], t }) {
    const [showAll, setShowAll] = useState(false);
    if (!items.length) return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'18px 0' }}>
            <div style={{ fontSize:24 }}>🌴</div>
            <div style={{ fontSize:12, color:t.textMute }}>No one on leave today</div>
        </div>
    );
    const MAX_VISIBLE = 4;
    const visible = showAll ? items : items.slice(0, MAX_VISIBLE);
    const extra = items.length - MAX_VISIBLE;
    return (
        <div>
            {visible.map((b, i) => {
                const inits = b.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
                return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < visible.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:t.greenSoft, color:t.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{inits}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:t.text }}>{b.name}</div>
                            <div style={{ fontSize:10, color:t.textMute }}>{ucfirst(b.leave_type || 'Leave')} · {b.department}</div>
                        </div>
                    </div>
                );
            })}
            {items.length > MAX_VISIBLE && (
                <button onClick={() => setShowAll(v => !v)}
                    style={{ marginTop:8, width:'100%', padding:'6px', borderRadius:8, border:`1px solid ${t.border}`, background:t.surface2, color:t.textSoft, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s' }}>
                    {showAll ? '▲ Show less' : `▼ Show ${extra} more`}
                </button>
            )}
        </div>
    );
}

function QuickActions({ items, t }) {
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {items.map((item, i) => (
                <button key={i} onClick={item.onClick} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: t.textSoft, fontFamily: 'inherit', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.surface2; e.currentTarget.style.color = t.text; }}
                    onMouseLeave={e => { e.currentTarget.style.background = t.surface; e.currentTarget.style.color = t.textSoft; }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: item.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{item.icon}</span>
                    {item.label}
                </button>
            ))}
        </div>
    );
}

function Sparkline({ data = [], color = '#2563eb', height = 40 }) {
    if (!data.length) return null;
    const w = 200, h = height, max = Math.max(...data, 1);
    const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - (v / max) * (h - 4) - 2}`);
    const path = `M${pts.join('L')}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
            <path d={`${path}L${w},${h}L0,${h}Z`} fill={color} opacity={0.12} />
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ① Announcement Banner — shows below hero for ALL roles
// ─────────────────────────────────────────────────────────────────────────────
function AnnouncementBanner({ announcements = [], t }) {
    const [idx, setIdx] = useState(0);
    if (!announcements.length) return null;
    const a = announcements[Math.min(idx, announcements.length - 1)];
    return (
        <div style={{ ...card(t, { padding: '14px 20px', marginBottom: 16, borderLeft: `4px solid ${t.amber}`, borderRadius: '0 20px 20px 0' }) }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.amberSoft, color: t.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📢</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.amber }}>Announcement</span>
                        <span style={{ fontSize: 10, color: t.textMute }}>By {a.created_by}</span>
                        {announcements.length > 1 && <span style={{ marginLeft: 'auto', fontSize: 10, color: t.textMute }}>{idx + 1} / {announcements.length}</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: t.textSoft, marginTop: 3, lineHeight: 1.5 }}>{a.content}</div>
                    <div style={{ fontSize: 10, color: t.textMute, marginTop: 4 }}>{a.start_at} → {a.end_at}</div>
                </div>
                {announcements.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{ padding: '4px 8px', borderRadius: 7, border: `1px solid ${t.border}`, background: t.surface2, color: t.textSoft, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', opacity: idx === 0 ? 0.4 : 1 }}>‹</button>
                        <button onClick={() => setIdx(i => Math.min(announcements.length - 1, i + 1))} disabled={idx === announcements.length - 1} style={{ padding: '4px 8px', borderRadius: 7, border: `1px solid ${t.border}`, background: t.surface2, color: t.textSoft, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', opacity: idx === announcements.length - 1 ? 0.4 : 1 }}>›</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Announcement create modal
function AnnouncementModal({ t, onClose, onCreated }) {
    const [form, setForm] = useState({ title: '', content: '', start_at: '', end_at: '' });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const inp = key => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })), style: { width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, border: `1px solid ${errors[key] ? t.red + '66' : t.borderMid}`, background: t.surface2, color: t.text, fontFamily: 'inherit', outline: 'none' } });
    const submit = async () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Required';
        if (!form.content.trim()) errs.content = 'Required';
        if (!form.start_at) errs.start_at = 'Required';
        if (!form.end_at) errs.end_at = 'Required';
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        try {
            const res = await fetch('/dashboard/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) { toast('Announcement published.'); onCreated(); }
            else { const d = await res.json(); setErrors(d.errors || { general: 'Failed.' }); }
        } catch { setErrors({ general: 'Network error.' }); }
        finally { setSaving(false); }
    };
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ ...card(t, { padding: 24, width: '100%', maxWidth: 480 }) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>New Announcement</div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMute, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: t.textMute, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</div><input {...inp('title')} />{errors.title && <div style={{ fontSize: 11, color: t.red, marginTop: 3 }}>{errors.title}</div>}</div>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: t.textMute, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Content</div><textarea {...inp('content')} rows={3} style={{ ...inp('content').style, resize: 'vertical', minHeight: 72 }} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />{errors.content && <div style={{ fontSize: 11, color: t.red, marginTop: 3 }}>{errors.content}</div>}</div>
                    <div style={col2}>
                        {[['Start date', 'start_at'], ['End date', 'end_at']].map(([lbl, key]) => (
                            <div key={key}><div style={{ fontSize: 11, fontWeight: 600, color: t.textMute, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</div><input type="datetime-local" {...inp(key)} />{errors[key] && <div style={{ fontSize: 11, color: t.red, marginTop: 3 }}>{errors[key]}</div>}</div>
                        ))}
                    </div>
                    {errors.general && <div style={{ background: t.redSoft, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: t.red }}>{errors.general}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface2, color: t.textSoft, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    <button onClick={submit} disabled={saving} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: t.blue, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'Publishing…' : 'Publish'}</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Date/time helpers (add near top if not present — safe to duplicate-guard)
// ─────────────────────────────────────────────────────────────────────────────
// fmtDate / fmtTime / to12h / fmtHrs / OT_COLORS / getOTColor
// already declared above (hoisted) — referenced below

// ─────────────────────────────────────────────────────────────────────────────
// ApprovalItem row — clean display, no raw timestamps
// ─────────────────────────────────────────────────────────────────────────────
function ApprovalItemRow({ item, t, onApprove, onReject }) {
    const typeColors = { leave: t.amber, ot: t.violet, attendance: t.blue, expense: t.green };
    const typeLabels = { leave: 'LEAVE', ot: 'OT', attendance: 'ATTENDANCE', expense: 'EXPENSE' };
    const clr = typeColors[item.type] || t.blue;
    const inits = item.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

    const renderSummary = () => {
        const d = item.raw || {};
        if (item.type === 'leave') {
            const leaveType = ucfirst(d.leave_type || item.leave_type || '');
            const days      = d.total_days || item.total_days || '';
            const start     = fmtDate(d.start_date || item.start_date);
            const end       = fmtDate(d.end_date   || item.end_date);
            return (
                <>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
                        {leaveType && <span style={{ fontSize:11, fontWeight:700, color:clr }}>{leaveType}</span>}
                        {days      && <span style={{ fontSize:11, fontWeight:700, color:t.text, background:t.amberSoft, borderRadius:99, padding:'1px 7px' }}>{fmtDays(days)}d</span>}
                    </div>
                    <div style={{ fontSize:11, color:t.textMute }}>{start} → {end}</div>
                </>
            );
        }
        if (item.type === 'ot') {
            const totalH   = d.hours_requested || item.hours_requested;
            const startD   = fmtDate(d.start_date || item.start_date);
            const endD     = fmtDate(d.end_date   || item.end_date);
            const startT   = to12h(d.start_time || item.start_time);
            const endT     = to12h(d.end_time   || item.end_time);
            const isMulti  = (d.start_date || item.start_date) !== (d.end_date || item.end_date) && (d.end_date || item.end_date);
            return (
                <>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
                        {totalH && <span style={{ fontSize:11, fontWeight:700, color:clr }}>{fmtHrs(totalH)} total</span>}
                    </div>
                    <div style={{ fontSize:11, color:t.textMute }}>
                        {isMulti ? `${startD} ${startT} → ${endD} ${endT}` : `${startD} · ${startT} – ${endT}`}
                    </div>
                </>
            );
        }
        if (item.type === 'attendance') {
            const date   = fmtDate(d.date || item.date);
            const rawCi  = d.requested_check_in_time  || item.requested_check_in_time  || item.check_in;
            const rawCo  = d.requested_check_out_time || item.requested_check_out_time || item.check_out;
            const ci     = rawCi ? fmtTime(rawCi) : null;
            const co     = rawCo ? fmtTime(rawCo) : null;
            const wh     = d.requested_work_hours || item.requested_work_hours || item.work_hours;
            const timeStr = (ci || co) ? `${ci || '—'} – ${co || '—'}` : 'Time not recorded';
            return (
                <>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
                        {wh && <span style={{ fontSize:11, fontWeight:700, color:clr }}>{fmtHrs(wh)}</span>}
                        {!wh && !ci && !co && <span style={{ fontSize:11, color:t.textMute }}>Attendance correction</span>}
                    </div>
                    <div style={{ fontSize:11, color:t.textMute }}>{date} · {timeStr}</div>
                </>
            );
        }
        if (item.type === 'expense') {
            const title    = d.title    || item.title    || '';
            const amount   = d.amount   || item.amount   || '';
            const currency = d.currency || item.currency || 'USD';
            const cat      = ucfirst(d.category || item.category || '');
            const expDate  = fmtDate(d.expense_date || item.expense_date);
            return (
                <>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
                        {title  && <span style={{ fontSize:11, fontWeight:700, color:t.text }}>{title}</span>}
                        {amount && <span style={{ fontSize:11, fontWeight:700, color:clr }}>{currency} {Number(amount).toFixed(2)}</span>}
                    </div>
                    <div style={{ fontSize:11, color:t.textMute }}>{cat}{cat && expDate ? ' · ' : ''}{expDate}</div>
                </>
            );
        }
        return <div style={{ fontSize:11, color:t.textMute }}>{item.detail}</div>;
    };

    return (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:12, background:t.surface2, marginBottom:8, border:`1px solid ${t.border}` }}>
            {/* Avatar */}
            <div style={{ width:34, height:34, borderRadius:'50%', background:clr+'22', color:clr, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{inits}</div>
            {/* Content */}
            <div style={{ flex:1, minWidth:0 }}>
                {/* Row 1: name + type badge */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:t.text }}>{item.name}</span>
                    <span style={{ fontSize:9, padding:'1px 7px', borderRadius:99, background:clr+'22', color:clr, fontWeight:800, letterSpacing:'0.04em' }}>{typeLabels[item.type]}</span>
                </div>
                {/* Row 2-3: type-specific summary */}
                {renderSummary()}
            </div>
            {/* Actions */}
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                <button onClick={onApprove} style={{ padding:'5px 11px', borderRadius:8, border:'none', background:t.greenSoft, color:t.green, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Approve</button>
                <button onClick={onReject}  style={{ padding:'5px 11px', borderRadius:8, border:'none', background:t.redSoft,   color:t.red,   fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Reject</button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ③ Approval Confirmation Modal — type-specific detail + OT segment adjust
// ─────────────────────────────────────────────────────────────────────────────
function ApprovalConfirmModal({ item, action, onConfirm, onCancel, t, externalBusy = false }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    // OT segment hours state
    const segs = item?.raw?.segments || item?.segments || [];
    const [segHours, setSegHours] = useState(() =>
        segs.reduce((a, s) => ({ ...a, [s.id]: s.hours }), {})
    );
    if (!item) return null;

    const isApprove = action === 'approve';
    const accentColor = isApprove ? t.green : t.red;
    const accentSoft  = isApprove ? t.greenSoft : t.redSoft;
    const typeLabel   = { leave:'Leave Request', ot:'Overtime Request', attendance:'Attendance Request', expense:'Expense Request' }[item.type] || 'Request';
    const inits = item.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
    const d = item.raw || {};

    const confirm = async () => {
        // Expense reject requires rejection_reason
        if (item.type === 'expense' && !isApprove && !note.trim()) return;
        setBusy(true);
        try {
            const segPayload = item.type === 'ot' && isApprove
                ? segs.map(s => ({ id: s.id, hours_approved: parseFloat(segHours[s.id] || 0) }))
                : null;
            await onConfirm(item, action, note, segPayload);
        } finally { setBusy(false); }
    };

    // ── Detail panel per type ──────────────────────────────────────────────
    const renderDetail = () => {
        if (item.type === 'leave') {
            const leaveType   = ucfirst(d.leave_type || item.leave_type || '');
            const start       = fmtDate(d.start_date || item.start_date);
            const end         = fmtDate(d.end_date   || item.end_date);
            const days        = d.total_days || item.total_days || '';
            const noteVal     = d.note || item.note || '';
            const docPath     = d.document_path || item.document_path || null;
            const docName     = docPath ? docPath.split('/').pop() : null;
            const docUrl      = docPath ? `/storage/${docPath}` : null;
            return (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <Cell label="Leave type" value={leaveType} t={t} />
                        <Cell label="Total days" value={days ? `${fmtDays(days)} day(s)` : '—'} t={t} highlight color={accentColor} />
                        <Cell label="Start date" value={start} t={t} />
                        <Cell label="End date"   value={end}   t={t} />
                    </div>
                    {(noteVal || docUrl) && (
                        <div style={{ display:'grid', gridTemplateColumns: docUrl ? '1fr 1fr' : '1fr', gap:8 }}>
                            {noteVal && <Cell label="Note" value={noteVal} t={t} />}
                            {docUrl && (
                                <div style={{ background:t.surface2, borderRadius:10, padding:'10px 12px' }}>
                                    <div style={{ fontSize:10, color:t.textMute, marginBottom:6 }}>Document</div>
                                    <a href={docUrl} download={docName} target="_blank" rel="noopener noreferrer"
                                        style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8, background:t.blueSoft, border:`1px solid ${t.blue}33`, color:t.blue, fontSize:11, fontWeight:600, textDecoration:'none', cursor:'pointer', maxWidth:'100%', overflow:'hidden' }}>
                                        <span style={{ fontSize:14, flexShrink:0 }}>📎</span>
                                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{docName || 'Download'}</span>
                                        <span style={{ fontSize:9, opacity:0.7, flexShrink:0 }}>↓</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }
        if (item.type === 'ot') {
            // Full OT segment display — matches OvertimeIndex ConfirmModal exactly
            const startD  = fmtDate(d.start_date || item.start_date);
            const endD    = fmtDate(d.end_date   || item.end_date);
            const startT  = to12h(d.start_time   || item.start_time);
            const endT    = to12h(d.end_time     || item.end_time);
            const isMulti = (d.start_date || item.start_date) !== (d.end_date || item.end_date) && (d.end_date || item.end_date);
            const totalReq = d.hours_requested || item.hours_requested;
            const reason   = d.reason || item.reason || '';
            const totalApproved = Object.values(segHours).reduce((s, h) => s + parseFloat(h || 0), 0);

            return (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {/* Date/time summary */}
                    <div style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:12, padding:'11px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                            <span style={{ fontSize:13, fontWeight:800, color:t.text }}>
                                {isMulti ? `${startD} – ${endD}` : startD}
                            </span>
                            <span style={{ fontSize:11, fontWeight:700, color:t.violet, background:t.violetSoft, borderRadius:6, padding:'1px 8px' }}>
                                {startT} → {endT}
                            </span>
                            {totalReq && <span style={{ fontSize:11, fontWeight:700, color:t.violet, background:t.violetSoft, borderRadius:99, padding:'1px 8px' }}>{fmtHrs(totalReq)} total</span>}
                        </div>
                        {reason && <div style={{ fontSize:11, color:t.textMute, fontStyle:'italic' }}>"{reason}"</div>}
                    </div>

                    {/* Segments — approve only */}
                    {isApprove && segs.length > 0 && (
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:t.textMute, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:7 }}>Segments — adjust approved hours</div>
                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                {segs.map(seg => {
                                    const oc  = getOTColor(seg.overtime_policy?.title);
                                    const isDk = t.text === '#f1f5f9'; const obg = isDk ? oc.bgDark : oc.bg;
                                    const max = parseFloat(seg.hours) || 0;
                                    const segDate = seg.segment_date ? fmtDate(seg.segment_date) : '';
                                    return (
                                        <div key={seg.id} style={{ background:obg, border:`1px solid ${oc.border}`, borderRadius:11, padding:'10px 13px', display:'flex', alignItems:'center', gap:10 }}>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontSize:12, fontWeight:700, color:oc.color }}>{seg.overtime_policy?.title || 'OT'}</div>
                                                <div style={{ fontSize:11, color:t.textMute, marginTop:2 }}>
                                                    {segDate && <span style={{ marginRight:6, fontWeight:600 }}>{segDate}</span>}
                                                    {to12h(seg.start_time)} → {to12h(seg.end_time)}
                                                    <span style={{ marginLeft:6 }}>req: {fmtHrs(seg.hours)}</span>
                                                </div>
                                            </div>
                                            <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                                                <span style={{ fontSize:10, color:t.textMute }}>Approve</span>
                                                <input type="number" value={segHours[seg.id] ?? seg.hours} min={0} max={max} step={0.01}
                                                    onKeyDown={e => { const ok=['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','.']; if(!ok.includes(e.key)&&!/^\d$/.test(e.key))e.preventDefault(); if(e.key==='.'&&String(segHours[seg.id]??seg.hours).includes('.'))e.preventDefault(); }}
                                                    onChange={e => { const r=e.target.value; if(r===''||r==='.'){setSegHours(p=>({...p,[seg.id]:r}));return;} const n=parseFloat(r); if(isNaN(n))return; setSegHours(p=>({...p,[seg.id]:Math.round(Math.min(n,max)*100)/100})); }}
                                                    style={{ width:58, border:`1.5px solid ${oc.border}`, borderRadius:8, padding:'5px 7px', fontSize:12, fontWeight:700, color:oc.color, textAlign:'center', background:t.surface, outline:'none', boxSizing:'border-box' }}
                                                />
                                                <span style={{ fontSize:10, color:t.textMute }}>hrs</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8, paddingTop:4 }}>
                                    <span style={{ fontSize:12, color:t.textMute }}>Total approved:</span>
                                    <span style={{ fontSize:15, fontWeight:900, color:t.green }}>{fmtHrs(totalApproved)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Reject: just show summary, no segment editing */}
                    {!isApprove && segs.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                            {segs.map(seg => {
                                const oc = getOTColor(seg.overtime_policy?.title);
                                return (
                                    <div key={seg.id} style={{ display:'inline-flex', alignItems:'center', gap:5, background: t.text==='#f1f5f9' ? oc.bgDark : oc.bg, border:`1px solid ${oc.border}`, borderRadius:8, padding:'3px 9px' }}>
                                        <span style={{ width:5, height:5, borderRadius:'50%', background:oc.color, flexShrink:0 }}/>
                                        <span style={{ fontSize:11, fontWeight:700, color:oc.color }}>{seg.overtime_policy?.title || 'OT'}</span>
                                        <span style={{ fontSize:11, color:t.textMute }}>{fmtHrs(seg.hours)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }
        if (item.type === 'attendance') {
            const date  = fmtDate(d.date || item.date);
            const rawCi  = d.requested_check_in_time  || item.requested_check_in_time  || item.check_in;
            const rawCo  = d.requested_check_out_time || item.requested_check_out_time || item.check_out;
            const ci    = rawCi ? fmtTime(rawCi) : '—';
            const co    = rawCo ? fmtTime(rawCo) : '—';
            const wh    = d.requested_work_hours || item.requested_work_hours || item.work_hours;
            const late  = d.requested_late_minutes || item.requested_late_minutes || item.late_minutes || 0;
            const noteV = d.note || item.note || '';
            return (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <Cell label="Date"       value={date} t={t} />
                        <Cell label="Work hours" value={wh ? fmtHrs(wh) : '—'} t={t} highlight color={accentColor} />
                        <Cell label="Check in"   value={ci} t={t} />
                        <Cell label="Check out"  value={co} t={t} />
                        {Number(late) > 0 && <Cell label="Late" value={`+${late}m`} t={t} color={t.red} />}
                    </div>
                    {noteV && <Cell label="Note" value={noteV} t={t} />}
                </div>
            );
        }
        if (item.type === 'expense') {
            const title       = d.title    || item.title    || '';
            const amount      = d.amount   || item.amount   || '';
            const currency    = d.currency || item.currency || 'USD';
            const cat         = ucfirst(d.category || item.category || '');
            const expDate     = fmtDate(d.expense_date || item.expense_date);
            const desc        = d.description || item.description || '';
            const attachments = d.attachments || item.attachments || [];
            const hasDesc     = Boolean(desc);
            const hasAtt      = attachments.length > 0;
            return (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {/* Row 1: Title + Amount */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <Cell label="Title"        value={title}  t={t} />
                        <Cell label="Amount"       value={amount ? `${currency} ${Number(amount).toFixed(2)}` : '—'} t={t} highlight color={accentColor} />
                        <Cell label="Category"     value={cat}    t={t} />
                        <Cell label="Expense date" value={expDate} t={t} />
                    </div>
                    {/* Row 2: Description (left) + Attachments (right) — side by side */}
                    {(hasDesc || hasAtt) && (
                        <div style={{ display:'grid', gridTemplateColumns: hasDesc && hasAtt ? '1fr 1fr' : '1fr', gap:8 }}>
                            {hasDesc && (
                                <div style={{ background:t.surface2, borderRadius:10, padding:'10px 12px' }}>
                                    <div style={{ fontSize:10, color:t.textMute, marginBottom:4 }}>Description</div>
                                    <div style={{ fontSize:13, fontWeight:600, color:t.text, lineHeight:1.5, wordBreak:'break-word' }}>{desc}</div>
                                </div>
                            )}
                            {hasAtt && (
                                <div style={{ background:t.surface2, borderRadius:10, padding:'10px 12px' }}>
                                    <div style={{ fontSize:10, color:t.textMute, marginBottom:6 }}>Attachments</div>
                                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                                        {attachments.map((att, i) => (
                                            <a key={i} href={`/storage/${att.path}`} download={att.name} target="_blank" rel="noopener noreferrer"
                                                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 9px', borderRadius:7, background:t.blueSoft, border:`1px solid ${t.blue}33`, color:t.blue, fontSize:11, fontWeight:600, textDecoration:'none', cursor:'pointer', overflow:'hidden' }}>
                                                <span style={{ fontSize:13, flexShrink:0 }}>📎</span>
                                                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{att.name || `File ${i+1}`}</span>
                                                <span style={{ fontSize:9, opacity:0.6, flexShrink:0 }}>↓</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Note (approve) or Rejection reason (reject) — expense only */}
                    {isApprove ? (
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:t.textMute, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Note (optional)</div>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Add a note for the employee…" style={{ width:'100%', padding:'9px 12px', borderRadius:10, fontSize:12, border:`1px solid ${t.borderMid}`, background:t.surface2, color:t.text, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
                        </div>
                    ) : (
                        <div>
                            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:t.textMute, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                                Rejection reason <span style={{ color:t.red }}>*</span>
                            </div>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Why is this being rejected?…"
                                style={{ width:'100%', padding:'9px 12px', borderRadius:10, fontSize:12,
                                    border:`1px solid ${note.trim() ? t.borderMid : t.red + '88'}`,
                                    background:t.surface2, color:t.text, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
                            {!note.trim() && <div style={{ fontSize:10, color:t.red, marginTop:3 }}>Rejection reason is required</div>}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
            <div style={{ ...card(t, { padding:0, width:'100%', maxWidth:520, overflow:'hidden', margin:'auto' }) }}>
                {/* Accent bar */}
                <div style={{ height:4, background: isApprove ? `linear-gradient(90deg,${t.green},#34d399)` : `linear-gradient(90deg,${t.red},#f87171)` }} />
                {/* Header */}
                <div style={{ padding:'16px 20px', background:accentSoft, borderBottom:`1px solid ${t.border}`, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:13, background:accentColor+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{isApprove ? '✓' : '✕'}</div>
                    <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:800, color:accentColor }}>{isApprove ? 'Confirm Approval' : 'Confirm Rejection'}</div>
                        <div style={{ fontSize:12, color:t.textSoft }}>{typeLabel}</div>
                    </div>
                    <button onClick={onCancel} style={{ background:'none', border:'none', color:t.textMute, cursor:'pointer', fontSize:20, lineHeight:1 }}>✕</button>
                </div>
                {/* Requester */}
                <div style={{ padding:'14px 20px', borderBottom:`1px solid ${t.border}` }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:t.textMute, marginBottom:8 }}>Requested by</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:t.blueSoft, color:t.blue, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{inits}</div>
                        <div>
                            <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{item.name}</div>
                            <div style={{ fontSize:11, color:t.textMute }}>{item.department || ''}</div>
                        </div>
                    </div>
                </div>
                {/* Detail */}
                <div className='dash-scroll-hide' style={{ padding:'14px 20px', borderBottom:`1px solid ${t.border}`, maxHeight:380, overflowY:'auto', scrollbarWidth:'none' }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:t.textMute, marginBottom:10 }}>Request Details</div>
                    {renderDetail()}
                </div>
                {/* No rejection reason field — expense has it inside renderDetail; others need no extra input */}
                {/* Buttons */}
                <div style={{ padding:'14px 20px', display:'flex', justifyContent:'flex-end', gap:8 }}>
                    <button onClick={onCancel} style={{ padding:'9px 18px', borderRadius:10, border:`1px solid ${t.border}`, background:t.surface2, color:t.textSoft, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                    <button onClick={confirm} disabled={busy || externalBusy} style={{ padding:'9px 22px', borderRadius:10, border:'none', background:accentColor, color:'#fff', fontSize:13, fontWeight:700, cursor:(busy||externalBusy)?'not-allowed':'pointer', fontFamily:'inherit', opacity:(busy||externalBusy)?0.7:1 }}>
                        {(busy || externalBusy) ? 'Processing…' : isApprove ? 'Approve' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Cell helper for detail grids
function Cell({ label, value, t, highlight, color, span2 }) {
    return (
        <div style={{ background:t.surface2, borderRadius:10, padding:'10px 12px', gridColumn: span2 ? '1 / -1' : undefined }}>
            <div style={{ fontSize:10, color:t.textMute, marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:13, fontWeight:600, color: highlight ? (color||t.green) : t.text }}>{value || '—'}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ③ Pending Approvals Panel — 4 request types, scrollable list (max 7 rows)
// ─────────────────────────────────────────────────────────────────────────────
function PendingApprovalsPanel({ approvalQueue = {}, onReload, t }) {
    const [confirm, setConfirm] = useState(null);
    const [tab, setTab] = useState('all');

    const allItems = [
        ...(approvalQueue.pending_leave_list      || []).map(x => ({ ...x, type: 'leave'      })),
        ...(approvalQueue.pending_ot_list         || []).map(x => ({ ...x, type: 'ot'         })),
        ...(approvalQueue.pending_attendance_list || []).map(x => ({ ...x, type: 'attendance' })),
        ...(approvalQueue.pending_expense_list    || []).map(x => ({ ...x, type: 'expense'    })),
    ];

    const counts = {
        all:        allItems.length,
        leave:      approvalQueue.pending_leave_requests      || 0,
        ot:         approvalQueue.pending_ot_requests         || 0,
        attendance: approvalQueue.pending_attendance_requests || 0,
        expense:    approvalQueue.pending_expense_requests    || 0,
    };

    const filtered   = tab === 'all' ? allItems : allItems.filter(x => x.type === tab);
    const tabLabels  = [['all','All'],['leave','Leave'],['ot','OT'],['attendance','Attendance'],['expense','Expense']];

    const ITEM_H = 82; // approx height per item in px
    const MAX_VISIBLE = 7;
    const listHeight  = Math.min(filtered.length, MAX_VISIBLE) * ITEM_H;

    const [actionBusy, setActionBusy] = useState(false);

    const handleConfirm = (item, action, note, segPayload) => {
        // Correct web routes matching routes/web.php exactly
        const routeMap = {
            leave:      { approve: `/payroll/leaves/${item.id}/approve`,                reject: `/payroll/leaves/${item.id}/reject` },
            ot:         { approve: `/payroll/overtimes/${item.id}/approve`,             reject: `/payroll/overtimes/${item.id}/reject` },
            attendance: { approve: `/payroll/check-in-out-requests/${item.id}/approve`, reject: `/payroll/check-in-out-requests/${item.id}/reject` },
            expense:    { approve: `/payroll/expenses/${item.id}/approve`,              reject: `/payroll/expenses/${item.id}/reject` },
        };
        const urls = routeMap[item.type];
        if (!urls) { toast('Unknown request type.', 'error'); return Promise.resolve(); }
        const url = action === 'approve' ? urls.approve : urls.reject;

        // Build payload with correct field names per type
        const data = {};
        if (item.type === 'expense') {
            // ExpenseRequestController validates: hr_note (approve) / rejection_reason (reject)
            if (action === 'approve') {
                // hr_note is optional — send even if empty so controller gets the param
                data.hr_note = note || '';
            } else {
                // rejection_reason is required — validated server-side
                data.rejection_reason = note || '';
            }
        } else {
            if (action === 'reject' && note) data.reason = note;
        }
        if (action === 'approve' && segPayload) data.segments = segPayload;

        setActionBusy(true);

        // Return a Promise so the modal confirm() await resolves correctly
        return new Promise((resolve) => {
            router.patch(url, data, {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirm(null);
                    setActionBusy(false);
                    onReload();
                    resolve();
                },
                onError: (errors) => {
                    setActionBusy(false);
                    const errValues = Object.values(errors || {});
                    const msg = errors?.message || errors?.error || (errValues.length ? String(errValues[0]) : null) || 'Action failed.';
                    toast(msg, 'error');
                    resolve(); // resolve so modal busy resets
                },
            });
        });
    };

    return (
        <>
            <Panel title="Pending approvals" subtitle="Leave · OT · Attendance · Expense" t={t}>
                {/* Tab pills */}
                <div style={{ display:'flex', gap:5, marginBottom:12, flexWrap:'wrap' }}>
                    {tabLabels.map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} style={{ padding:'4px 12px', borderRadius:99, border:`1px solid ${tab===key ? t.blue : t.border}`, background:tab===key ? t.blueSoft : t.surface2, color:tab===key ? t.blue : t.textSoft, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                            {label}
                            {counts[key] > 0 && <span style={{ background:tab===key ? t.blue : t.surface3, color:tab===key ? '#fff' : t.textMute, borderRadius:99, padding:'0 5px', fontSize:10, fontWeight:700 }}>{counts[key]}</span>}
                        </button>
                    ))}
                </div>
                {/* Scrollable list — hidden scrollbar, max 7 rows */}
                {filtered.length === 0
                    ? (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', gap:12 }}>
                            <div style={{ width:52, height:52, borderRadius:16, background:t.greenSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🎉</div>
                            <div style={{ fontSize:13, fontWeight:700, color:t.text }}>All caught up!</div>
                            <div style={{ fontSize:11, color:t.textMute, textAlign:'center' }}>No pending approvals right now.</div>
                        </div>
                    )
                    : (
                        <div style={{ maxHeight: listHeight || ITEM_H, overflowY: filtered.length > MAX_VISIBLE ? 'auto' : 'visible', scrollbarWidth:'none', msOverflowStyle:'none' }}
                            className="dash-scroll-hide">
                            {filtered.map((item, i) => (
                                <ApprovalItemRow key={item.id || i} item={item} t={t}
                                    onApprove={() => setConfirm({ item, action:'approve' })}
                                    onReject ={() => setConfirm({ item, action:'reject'  })}
                                />
                            ))}
                        </div>
                    )
                }
            </Panel>
            {confirm && (
                <ApprovalConfirmModal
                    item={confirm.item} action={confirm.action}
                    onConfirm={handleConfirm} onCancel={() => { setConfirm(null); setActionBusy(false); }} t={t}
                    externalBusy={actionBusy}
                />
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ④ Leave usage — vertical bar chart, top 20 sorted desc, like monthly attendance
// ─────────────────────────────────────────────────────────────────────────────
function LeaveUsageChart({ data = [], t }) {
    if (!data.length) return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0', gap:8 }}>
            <div style={{ fontSize:22 }}>📋</div>
            <div style={{ fontSize:12, color:t.textMute }}>No leave data this month</div>
        </div>
    );
    // Sort desc by days, take top 20
    const sorted = [...data].sort((a, b) => (b.total_days || 0) - (a.total_days || 0)).slice(0, 20);
    const max = Math.max(...sorted.map(d => d.total_days || 0), 1);
    const colors = [t.blue, t.violet, t.green, t.amber, t.pink, t.teal, t.red, t.rose || t.red];
    const barW = Math.max(24, Math.min(36, Math.floor(320 / Math.max(sorted.length, 1)) - 3));
    const h = 90;
    return (
        <div style={{ overflowX:'auto' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:4, minWidth: sorted.length * (barW + 4), height: h + 38, padding:'4px 2px 0' }}>
                {sorted.map((d, i) => {
                    const barH = Math.max(6, Math.round(((d.total_days || 0) / max) * h));
                    const clr = colors[i % colors.length];
                    const firstName = (d.name || '').split(' ')[0];
                    return (
                        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, width:barW, flexShrink:0 }}>
                            <div style={{ fontSize:8, fontWeight:700, color:clr, lineHeight:1 }}>{fmtDays(d.total_days)}d</div>
                            <div title={`${d.name}: ${d.total_days} days`}
                                style={{ width:'100%', height:barH, borderRadius:'4px 4px 0 0', background:clr, transition:'height 0.3s ease', cursor:'default' }} />
                            <div style={{ fontSize:8, color:t.textMute, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:barW+4, textAlign:'center' }}
                                title={d.name}>{firstName}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑤ OT by active project — vertical bar chart, top 10, sorted desc
// ─────────────────────────────────────────────────────────────────────────────
function OtByProjectChart({ data = [], t }) {
    if (!data.length) return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0', gap:8 }}>
            <div style={{ fontSize:22 }}>⏱️</div>
            <div style={{ fontSize:12, color:t.textMute }}>No OT project data this month</div>
        </div>
    );
    const sorted = [...data].sort((a, b) => (b.ot_hours || 0) - (a.ot_hours || 0)).slice(0, 10);
    const max    = Math.max(...sorted.map(d => d.ot_hours || 0), 1);
    const colors = [t.violet, t.blue, t.pink, t.amber, t.teal, t.green, t.red];
    const barW   = Math.max(28, Math.min(48, Math.floor(320 / Math.max(sorted.length, 1)) - 4));
    const h      = 90;
    return (
        <div style={{ overflowX:'auto' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:4, minWidth: sorted.length * (barW + 4), height: h + 40, padding:'4px 2px 0' }}>
                {sorted.map((d, i) => {
                    const barH  = Math.max(6, Math.round(((d.ot_hours || 0) / max) * h));
                    const clr   = colors[i % colors.length];
                    // Shorten long project names: "Customer Portal" → "Customer..."
                    const label = (d.project_name || '').length > 8
                        ? (d.project_name || '').slice(0, 7) + '…'
                        : (d.project_name || '—');
                    return (
                        <div key={i} title={`${d.project_name}: ${d.ot_hours}h`}
                            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, width:barW, flexShrink:0, cursor:'default' }}>
                            <div style={{ fontSize:8, fontWeight:700, color:clr, lineHeight:1 }}>{d.ot_hours}h</div>
                            <div style={{ width:'100%', height:barH, borderRadius:'4px 4px 0 0', background:clr, opacity:0.85, transition:'height 0.3s ease' }} />
                            <div style={{ fontSize:7, color:t.textMute, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:barW+4, textAlign:'center' }}
                                title={d.project_name}>{label}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Payroll trend — vertical bar chart (6 months)
// ─────────────────────────────────────────────────────────────────────────────
function PayrollTrendMini({ data = [], t }) {
    if (!data.length) return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0', gap:8 }}>
            <div style={{ fontSize:22 }}>💰</div>
            <div style={{ fontSize:12, color:t.textMute }}>No payroll data</div>
        </div>
    );
    const max = Math.max(...data.map(d => d.total || 0), 1);
    const h = 90;
    const fmtK = v => v >= 1000 ? `$${Math.round(v/1000)}k` : `$${Math.round(v)}`;
    return (
        <div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, height: h + 36 }}>
                {data.map((d, i) => {
                    const barH = Math.max(6, Math.round(((d.total || 0) / max) * h));
                    const isLatest = i === data.length - 1;
                    return (
                        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, height:'100%', justifyContent:'flex-end' }}>
                            <div style={{ fontSize:8, fontWeight:700, color: isLatest ? t.blue : t.textMute, lineHeight:1 }}>{fmtK(d.total || 0)}</div>
                            <div title={`${d.month}: ${fmtK(d.total)}`}
                                style={{ width:'100%', height:barH, borderRadius:'4px 4px 0 0', background: isLatest ? t.blue : t.blueSoft, border: isLatest ? `1px solid ${t.blue}` : 'none', transition:'height 0.3s ease' }} />
                            <div style={{ fontSize:9, color: isLatest ? t.blue : t.textMute, fontWeight: isLatest ? 700 : 400 }}>{d.month}</div>
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop:8, fontSize:11, color:t.textMute }}>
                Latest: <strong style={{ color:t.blue }}>{data.length ? `$${Math.round(data[data.length-1]?.total || 0).toLocaleString()}` : '—'}</strong>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑥ Monthly attendance bar chart — full month with daily count labels
// ─────────────────────────────────────────────────────────────────────────────
function MonthlyAttendanceChart({ data = [], t }) {
    // Build full month: data comes from backend (days 1→today).
    // Fill remaining days of the month as future (no bar, just label).
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const todayDay = now.getDate();

    // Map existing data by day number
    const byDay = {};
    data.forEach(d => { const day = parseInt(d.day); if (day) byDay[day] = d; });

    // Build full 30/31 day array
    const fullData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const existing = byDay[day];
        const isFuture = day > todayDay;
        const isWeekend = (() => {
            const d = new Date(now.getFullYear(), now.getMonth(), day);
            return d.getDay() === 0 || d.getDay() === 6;
        })();
        return existing
            ? { ...existing, future: false }
            : { day: String(day).padStart(2, '0'), present: 0, weekend: isWeekend, isToday: day === todayDay, future: isFuture, date: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` };
    });

    const max = Math.max(...fullData.map(d => d.present || 0), 1);
    const h = 80;
    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, minWidth: daysInMonth * 20, height: h + 32, padding: '4px 0' }}>
                {fullData.map((d, i) => {
                    const barH = d.present > 0 ? Math.max(4, Math.round((d.present / max) * h)) : (d.future ? 0 : 3);
                    const isToday = d.isToday;
                    const isWeekend = d.weekend;
                    const isFuture = d.future;
                    const barColor = isFuture ? 'transparent' : isWeekend ? t.surface3 : isToday ? t.blue : t.green;
                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 18, flexShrink: 0 }}>
                            <div style={{ fontSize: 7, color: isToday ? t.blue : t.textMute, fontWeight: isToday ? 700 : 400, lineHeight: 1, minHeight: 9 }}>
                                {d.present > 0 ? d.present : ''}
                            </div>
                            <div title={`${d.date}: ${isFuture ? 'future' : d.present + ' present'}`}
                                style={{ width: '100%', height: barH || (isFuture ? 0 : 3), borderRadius: '3px 3px 0 0', background: barColor, opacity: isWeekend ? 0.4 : 1, minHeight: isFuture ? 0 : 3 }} />
                            <div style={{ fontSize: 7, color: isToday ? t.blue : isFuture ? t.textMute + '66' : t.textMute, fontWeight: isToday ? 700 : 400, transform: 'rotate(-45deg)', transformOrigin: 'top center', whiteSpace: 'nowrap', marginTop: 2 }}>{d.day}</div>
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                {[['Weekday', t.green], ['Today', t.blue], ['Weekend', t.surface3]].map(([l, c]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: t.textMute }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{l}</div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑦ Late arrivals — vertical bar chart, top 20 sorted desc
// ─────────────────────────────────────────────────────────────────────────────
function LateArrivalsList({ data = [], t }) {
    if (!data.length) return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0', gap:8 }}>
            <div style={{ fontSize:22 }}>✅</div>
            <div style={{ fontSize:12, color:t.textMute }}>No late arrivals this month</div>
        </div>
    );
    const sorted = [...data].sort((a, b) => (b.late_count || 0) - (a.late_count || 0)).slice(0, 20);
    const max = Math.max(...sorted.map(e => e.late_count || 0), 1);
    const barW = Math.max(22, Math.min(38, Math.floor(320 / Math.max(sorted.length, 1)) - 4));
    const h = 90;
    return (
        <div style={{ overflowX:'auto' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:4, minWidth: sorted.length * (barW + 4), height: h + 38, padding:'4px 2px 0' }}>
                {sorted.map((e, i) => {
                    const barH = Math.max(6, Math.round(((e.late_count || 0) / max) * h));
                    const clr = (e.late_count || 0) >= 5 ? t.red : t.amber;
                    const firstName = (e.name || '').split(' ')[0];
                    return (
                        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, width:barW, flexShrink:0 }}>
                            <div style={{ fontSize:8, fontWeight:700, color:clr, lineHeight:1 }}>{e.late_count}x</div>
                            <div title={`${e.name}: ${e.late_count}x late, avg +${e.avg_late_minutes}m`}
                                style={{ width:'100%', height:barH, borderRadius:'4px 4px 0 0', background:clr, opacity:0.85, transition:'height 0.3s ease', cursor:'default' }} />
                            <div style={{ fontSize:8, color:t.textMute, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:barW+4, textAlign:'center' }}
                                title={e.name}>{firstName}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// ⑨ Shared approver sections — same UI for Admin, HR, Management
// ─────────────────────────────────────────────────────────────────────────────
function SharedApproverSections({ props, t, onReload, isHrOnly }) {
    const {
        approvalQueue = {}, employmentChart = [], departmentChart = [],
        monthlyAttendance = [], probationAlerts = [], contractAlerts = [],
        birthdaysThisWeek = [], onLeaveToday = [], upcomingHolidays = [],
        leaveUsageChart = [], otByProjectChart = [], chronicallyLate = [],
        orgSummary = {}, teamSummary = {},
    } = props;

    const summary = (orgSummary.total_employees || orgSummary.present_today !== undefined) ? orgSummary : teamSummary;
    const headcount = summary.total_employees || summary.headcount || 0;
    const totalPending = (approvalQueue.pending_leave_requests || 0) + (approvalQueue.pending_ot_requests || 0) + (approvalQueue.pending_attendance_requests || 0) + (approvalQueue.pending_expense_requests || 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <KpiCard label="Headcount"         value={headcount}                        sub={summary.country || ''}                   color={t.blue}   soft={t.blueSoft}   t={t} />
                <KpiCard label="Present today"     value={summary.present_today || 0}       sub={`${summary.attendance_rate || 0}%`}      color={t.green}  soft={t.greenSoft}  t={t} />
                <KpiCard label="On leave today"    value={summary.on_leave_today || onLeaveToday.length || 0} sub="Approved"             color={t.amber}  soft={t.amberSoft}  t={t} />
                <KpiCard label="All pending"       value={totalPending}                     sub="Leave · OT · Attend · Expense"           color={t.violet} soft={t.violetSoft} t={t} />
                <KpiCard label="OT hours / month"  value={`${summary.ot_hours_month || 0}h`} sub="Approved"                             color={t.pink}   soft={t.pinkSoft}   t={t} />
            </div>

            {/* ③ Pending approvals — full width */}
            <PendingApprovalsPanel approvalQueue={approvalQueue} onReload={onReload} t={t} />

            {/* ④ Leave usage + ⑤ OT by project */}
            <div style={col2}>
                <Panel title="Leave usage this month" subtitle="Top 20 employees by days taken" t={t}>
                    <LeaveUsageChart data={leaveUsageChart} t={t} />
                </Panel>
                <Panel title="OT by active project" subtitle="Top 10 · hours approved this month" t={t}>
                    <OtByProjectChart data={otByProjectChart} t={t} />
                </Panel>
            </div>

            {/* ⑥ Monthly attendance (left) + Payroll trend (right) */}
            <div style={col2}>
                <Panel title="Monthly attendance" subtitle={`${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · daily present count`} t={t}>
                    <MonthlyAttendanceChart data={monthlyAttendance} t={t} />
                </Panel>
                <Panel title="Payroll trend" subtitle="Last 6 months · net salary total" t={t}>
                    <PayrollTrendMini data={props.payrollTrend || []} t={t} />
                </Panel>
            </div>

            {/* Employment + Department */}
            <div style={col2}>
                <Panel title="Employment mix" subtitle="By type — active employees" t={t}>
                    <div style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
                        <DonutChart size={140} t={t} data={employmentChart.length ? employmentChart : [
                            { label: 'Permanent', value: orgSummary.permanent || teamSummary.permanent || 0, color: t.blue },
                            { label: 'Probation', value: orgSummary.probation || teamSummary.probation || 0, color: t.red },
                            { label: 'Contract',  value: orgSummary.contract  || teamSummary.contract  || 0, color: t.green },
                        ]} />
                    </div>
                </Panel>
                <Panel title="Department headcount" t={t}>
                    {departmentChart.slice(0, 6).map((d, i) => <BarRow key={i} label={d.label} value={d.value} max={Math.max(...departmentChart.map(x => x.value), 1)} color={[t.blue,t.green,t.violet,t.amber,t.pink,t.teal][i%6]} t={t} />)}
                    {!departmentChart.length && <div style={{ fontSize: 12, color: t.textMute }}>No data</div>}
                </Panel>
            </div>

            {/* ⑦ Late arrivals (left) + Probation/Contract alerts (right, stacked) */}
            {isHrOnly ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    {/* Late check-in — left */}
                    <Panel title="Late check-in frequency" subtitle="This month · sorted by count desc · top 20" t={t}>
                        <LateArrivalsList data={chronicallyLate} t={t} />
                    </Panel>
                    {/* Probation + Contract — right, stacked vertically */}
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        <Panel title="Probation ending soon" subtitle="Within 10 days" t={t}>
                            {probationAlerts.length ? probationAlerts.slice(0,5).map((a,i) => <AlertRow key={i} name={a.name} dept={`${a.department} · ${a.country||''}`} tag={`${a.days_left}d`} color={t.amber} soft={t.amberSoft} urgent={a.days_left<=3} t={t} />) : <div style={{fontSize:12,color:t.textMute}}>No alerts</div>}
                        </Panel>
                        <Panel title="Contract expiring" subtitle="Within 30 days" t={t}>
                            {contractAlerts.length ? contractAlerts.slice(0,5).map((a,i) => <AlertRow key={i} name={a.name} dept={`${a.department} · ${a.country||''}`} tag={`${a.days_left}d`} color={t.red} soft={t.redSoft} urgent={a.days_left<=7} t={t} />) : <div style={{fontSize:12,color:t.textMute}}>No alerts</div>}
                        </Panel>
                    </div>
                </div>
            ) : (
                /* Non-HR: Probation + Contract side by side (no late check-in) */
                <div style={col2}>
                    <Panel title="Probation ending soon" subtitle="Within 10 days" t={t}>
                        {probationAlerts.length ? probationAlerts.slice(0,5).map((a,i) => <AlertRow key={i} name={a.name} dept={`${a.department} · ${a.country||''}`} tag={`${a.days_left}d`} color={t.amber} soft={t.amberSoft} urgent={a.days_left<=3} t={t} />) : <div style={{fontSize:12,color:t.textMute}}>No alerts</div>}
                    </Panel>
                    <Panel title="Contract expiring" subtitle="Within 30 days" t={t}>
                        {contractAlerts.length ? contractAlerts.slice(0,5).map((a,i) => <AlertRow key={i} name={a.name} dept={`${a.department} · ${a.country||''}`} tag={`${a.days_left}d`} color={t.red} soft={t.redSoft} urgent={a.days_left<=7} t={t} />) : <div style={{fontSize:12,color:t.textMute}}>No alerts</div>}
                    </Panel>
                </div>
            )}

            {/* ⑧ On leave today (date-filtered on backend) + Birthdays + Holidays */}
            <div style={col3}>
                <Panel title="🎂 Birthdays this week" t={t}>
                    {birthdaysThisWeek.slice(0,4).map((b,i) => <PersonRow key={i} name={b.name} meta={`${b.department} · ${b.date}`} avatarBg={t.pinkSoft} avatarColor={t.pink} last={i===birthdaysThisWeek.length-1} t={t} />)}
                    {!birthdaysThisWeek.length && (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'18px 0' }}>
                            <div style={{ fontSize:28 }}>🎂</div>
                            <div style={{ fontSize:12, fontWeight:600, color:t.textSoft }}>No birthdays this week</div>
                            <div style={{ fontSize:10, color:t.textMute }}>Check back next week!</div>
                        </div>
                    )}
                </Panel>
                <Panel title="🌴 On leave today"
                    subtitle={onLeaveToday.length ? `${onLeaveToday.length} employee${onLeaveToday.length > 1 ? 's' : ''} on approved leave` : 'Approved leave covering today'}
                    t={t}>
                    <OnLeaveTodayList items={onLeaveToday} t={t} />
                </Panel>
                <Panel title="📅 Upcoming holidays" t={t}>
                    <HolidayList items={upcomingHolidays.slice(0,4)} t={t} />
                </Panel>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role views — Admin, HR, Management all use SharedApproverSections (⑨)
// ─────────────────────────────────────────────────────────────────────────────
function AdminView({ props, t, onReload }) {
    const [showAnn, setShowAnn] = useState(false);
    const { orgSummary = {} } = props;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <QuickActions t={t} items={[
                { icon: '↑', label: 'Import attendance', soft: t.blueSoft,   onClick: () => router.visit('/payroll/attendance') },
                { icon: '+', label: 'Announcement',      soft: t.violetSoft, onClick: () => setShowAnn(true) },
            ]} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
                <KpiCard label="Leave rate"  value={`${orgSummary.leave_rate||0}%`}     sub="of working days"                        color={t.pink}  soft={t.pinkSoft}  t={t} />
                <KpiCard label="Turnover Q"  value={`${orgSummary.turnover_rate||0}%`}  sub={`${orgSummary.resigned_quarter||0} resigned`} color={t.red} soft={t.redSoft} t={t} />
                <KpiCard label="Countries"   value={5}                                   sub="All offices"                           color={t.teal}  soft={t.tealSoft}  t={t} />
            </div>
            <SharedApproverSections props={props} t={t} onReload={onReload} isHrOnly={false} />
            {showAnn && <AnnouncementModal t={t} onClose={() => setShowAnn(false)} onCreated={() => { setShowAnn(false); onReload(); }} />}
        </div>
    );
}

function HrView({ props, t, onReload }) {
    const [showAnn, setShowAnn] = useState(false);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <QuickActions t={t} items={[
                { icon: '↑', label: 'Import attendance', soft: t.blueSoft,   onClick: () => router.visit('/payroll/attendance') },
                { icon: '+', label: 'Announcement',      soft: t.violetSoft, onClick: () => setShowAnn(true) },
            ]} />
            <SharedApproverSections props={props} t={t} onReload={onReload} isHrOnly={true} />
            {showAnn && <AnnouncementModal t={t} onClose={() => setShowAnn(false)} onCreated={() => { setShowAnn(false); onReload(); }} />}
        </div>
    );
}

function ManagementView({ props, t, onReload }) {
    return <SharedApproverSections props={props} t={t} onReload={onReload} isHrOnly={false} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee view
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeView({ props, t }) {
    const { myStats = {}, todayStatus = {}, weeklyAttendance = [], upcomingHolidays = [], birthdaysThisWeek = [], approvalQueue = {} } = props;
    const [showSalary, setShowSalary] = useState(false);

    // ── helpers ──
    const typeColors = { leave: t.amber, ot: t.violet, attendance: t.blue, expense: t.green };
    const typeIcons  = { leave: '🌴', ot: '⏱', attendance: '🕐', expense: '💳' };
    const typeLabels = { leave: 'Leave', ot: 'Overtime', attendance: 'Attendance', expense: 'Expense' };

    // clean detail string — strip raw timestamps like 2026-06-05 00:00:00
    const cleanDetail = (str) => String(str || '').replace(/\s00:00:00/g, '').replace(/T00:00:00\.000000Z/g, '').replace(/(\d+)\.0\s*d/g, '$1d');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ② 5-card KPI row: Present · OT · Pending Leave · Absent · Late */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                    { label: 'Present days',   value: myStats.present_days || 0,           sub: 'This month',      color: t.green,  icon: '📅' },
                    { label: 'OT this month',  value: `${myStats.ot_hours_month || 0}h`,   sub: 'Approved',        color: t.violet, icon: '⏱' },
                    { label: 'Pending leave',  value: myStats.pending_leaves || 0,         sub: 'Awaiting approval', color: t.amber, icon: '🌴' },
                    { label: 'Absent days',    value: myStats.absent_days || 0,            sub: 'This month',      color: t.red,    icon: '❌' },
                    { label: 'Late arrivals',  value: myStats.late_count || 0,             sub: `avg +${myStats.avg_late_minutes || 0}m`, color: t.pink, icon: '⏰' },
                ].map(({ label, value, sub, color, icon }) => (
                    <div key={label} style={{ ...card(t, { padding: '14px 14px', position: 'relative', overflow: 'hidden' }) }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '20px 20px 0 0' }} />
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.textMute, marginBottom: 5 }}>{label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
                        <div style={{ fontSize: 10, color: t.textSoft, marginTop: 3 }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* ③ My pending requests — show all 4 types, clean timestamps, type badge */}
            {(approvalQueue.my_pending_list || []).length > 0 && (
                <Panel title="My pending requests" subtitle="Waiting for approval" t={t}>
                    {(approvalQueue.my_pending_list || []).map((item, i) => {
                        const clr = typeColors[item.type] || t.blue;
                        const lbl = typeLabels[item.type] || item.type;
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: t.surface2, marginBottom: 8, border: `1px solid ${t.border}` }}>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{typeIcons[item.type] || '📋'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 8px', borderRadius: 99, background: clr + '22', color: clr, letterSpacing: '0.04em' }}>{lbl}</span>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cleanDetail(item.detail)}</div>
                                    <div style={{ fontSize: 10, color: t.textMute, marginTop: 1 }}>Submitted {item.submitted_at}</div>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: t.amberSoft, color: t.amber, flexShrink: 0 }}>Pending</span>
                            </div>
                        );
                    })}
                </Panel>
            )}

            {/* Latest payslip + Leave balances */}
            <div style={col2}>
                {/* ④ Latest payslip with eye icon toggle */}
                <Panel title="Latest payslip" subtitle={`${myStats.payslip_period || 'This month'} · ${ucfirst(myStats.payslip_status || 'pending')}`} t={t}
                    action={
                        <button onClick={() => setShowSalary(v => !v)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface2, color: t.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            title={showSalary ? 'Hide amounts' : 'Show amounts'}>
                            {showSalary
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            }
                        </button>
                    }>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: t.textMute, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Net salary</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: t.blue, letterSpacing: '-1px', lineHeight: 1, filter: showSalary ? 'none' : 'blur(7px)', transition: 'filter 0.2s', userSelect: showSalary ? 'auto' : 'none' }}>
                            {myStats.net_salary ? `$${fmtMoney(myStats.net_salary)}` : '—'}
                        </div>
                    </div>
                    <div style={col2}>
                        {[['Base salary', myStats.base_salary, t.text, '$'], ['OT pay', myStats.overtime_amount, t.green, '+$'], ['Allowances', myStats.total_allowances, t.teal, '+$'], ['Deductions', myStats.total_deductions, t.red, '-$']].map(([lbl, val, clr, pref]) => (
                            <div key={lbl} style={{ background: t.surface2, borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10, color: t.textMute }}>{lbl}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: clr, marginTop: 2, filter: showSalary ? 'none' : 'blur(5px)', transition: 'filter 0.2s' }}>
                                    {val ? `${pref}${fmtMoney(val)}` : '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel title="Leave balances" subtitle="Remaining days" t={t}>
                    {(myStats.leave_balances || []).map((lb, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <div style={{ fontSize: 12, color: t.textSoft }}>{lb.type}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: [t.blue, t.green, t.amber, t.violet, t.pink][i % 5] }}>{lb.remaining}d / {lb.entitled}d</div>
                            </div>
                            <div style={{ height: 6, background: t.surface3, borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min((lb.remaining / Math.max(lb.entitled, 1)) * 100, 100)}%`, background: [t.blue, t.green, t.amber, t.violet, t.pink][i % 5], borderRadius: 99 }} />
                            </div>
                        </div>
                    ))}
                    {!(myStats.leave_balances || []).length && <div style={{ fontSize: 12, color: t.textMute }}>No data</div>}
                </Panel>
            </div>

            <div style={col2}>
                <Panel title="My weekly attendance" subtitle="Work hours per day" t={t}>
                    <Sparkline color={t.green} height={56} data={weeklyAttendance.map(d => d.value || 0)} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        {weeklyAttendance.map(d => <div key={d.label} style={{ fontSize: 9, color: t.textMute }}>{d.label}</div>)}
                    </div>
                </Panel>
                <Panel title="📅 Upcoming holidays" t={t}>
                    <HolidayList items={upcomingHolidays.slice(0, 4)} t={t} />
                </Panel>
            </div>

            {birthdaysThisWeek.length > 0 && (
                <Panel title="🎂 Birthdays this week" t={t}>
                    {birthdaysThisWeek.slice(0, 4).map((b, i) => <PersonRow key={i} name={b.name} meta={`${b.department} · ${b.date}`} avatarBg={t.pinkSoft} avatarColor={t.pink} last={i === birthdaysThisWeek.length - 1} t={t} />)}
                </Panel>
            )}
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard(props) {
    const {
        roleName, dashboardMode, announcements = [], orgSummary = {}, teamSummary = {},
        approvalQueue = {}, employmentChart = [], departmentChart = [],
        monthlyAttendance = [], probationAlerts = [], contractAlerts = [],
        leaveUsageChart = [], otByProjectChart = [], chronicallyLate = [],
        payrollTrend = [],
        myStats = {}, todayStatus = {}, upcomingHolidays = [],
        weeklyAttendance = [], birthdaysThisWeek = [], onLeaveToday = [],
    } = props;

    const dark = useReactiveTheme();
    const t    = useMemo(() => getTheme(dark), [dark]);
    const { auth } = usePage().props;
    const firstName = auth?.user?.name?.split(' ')?.[0] || 'there';
    const now  = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const isHrAdmin    = roleIn(roleName, ['admin', 'hr']);
    const isManagement = roleIn(roleName, ['management']);
    const isEmployee   = roleIn(roleName, ['employee', 'member']);

    const [, forceReload] = useState(0);
    const onReload = useCallback(() => {
        router.reload({ only: ['announcements','approvalQueue','orgSummary','teamSummary','onLeaveToday','leaveUsageChart','otByProjectChart','chronicallyLate','monthlyAttendance','payrollTrend'] });
        forceReload(n => n + 1);
    }, []);

    const allProps = { roleName, dashboardMode, announcements, orgSummary, teamSummary, approvalQueue, employmentChart, departmentChart, monthlyAttendance, probationAlerts, contractAlerts, leaveUsageChart, otByProjectChart, chronicallyLate, payrollTrend, myStats, todayStatus, upcomingHolidays, weeklyAttendance, birthdaysThisWeek, onLeaveToday };

    const totalPending = (approvalQueue.pending_leave_requests||0) + (approvalQueue.pending_ot_requests||0) + (approvalQueue.pending_attendance_requests||0) + (approvalQueue.pending_expense_requests||0);

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />
            <style>{`.dash-scroll-hide::-webkit-scrollbar{display:none}.dash-scroll-hide{scrollbar-width:none;-ms-overflow-style:none}`}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 40 }}>

                {/* Hero */}
                <div style={{ ...card(t, { padding: '20px 24px', marginBottom: 16 }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.blue, marginBottom: 4 }}>{dashboardMode || 'personal'} dashboard</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{greeting}, {firstName}</div>
                            <div style={{ fontSize: 12, color: t.textMute, marginTop: 4 }}>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {(isHrAdmin || isManagement) && (
                                <>
                                    <div style={{ background: t.amberSoft, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 72 }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: t.amber }}>{totalPending}</div>
                                        <div style={{ fontSize: 10, color: t.amber, fontWeight: 600, marginTop: 2 }}>Pending</div>
                                    </div>
                                    <div style={{ background: t.greenSoft, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 72 }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: t.green }}>{orgSummary.present_today || teamSummary.present_today || 0}</div>
                                        <div style={{ fontSize: 10, color: t.green, fontWeight: 600, marginTop: 2 }}>Present</div>
                                    </div>
                                    <div style={{ background: t.blueSoft, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 72 }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: t.blue }}>{orgSummary.total_employees || teamSummary.headcount || 0}</div>
                                        <div style={{ fontSize: 10, color: t.blue, fontWeight: 600, marginTop: 2 }}>Staff</div>
                                    </div>
                                </>
                            )}
                            {isEmployee && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 14, background: todayStatus.checked_in ? t.greenSoft : t.surface2, border: `1px solid ${todayStatus.checked_in ? t.green + '44' : t.border}`, minWidth: 160 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: todayStatus.checked_in ? t.green + '22' : t.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                        {todayStatus.checked_in ? '✅' : '🕐'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: todayStatus.checked_in ? t.green : t.text }}>
                                            {todayStatus.checked_in ? `Checked in · ${todayStatus.check_in || '—'}` : 'Not checked in yet'}
                                        </div>
                                        <div style={{ fontSize: 10, color: t.textMute, marginTop: 1 }}>
                                            {todayStatus.check_out ? `Out · ${todayStatus.check_out}` : todayStatus.checked_in ? 'Currently at work' : 'Today is a working day'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ① Announcement banner — ALL roles see this */}
                <AnnouncementBanner announcements={announcements} t={t} />

                {/* Role-specific views */}
                {roleIn(roleName, ['admin'])      && <AdminView      props={allProps} t={t} onReload={onReload} />}
                {roleIn(roleName, ['hr'])          && <HrView        props={allProps} t={t} onReload={onReload} />}
                {isManagement                      && <ManagementView props={allProps} t={t} onReload={onReload} />}
                {isEmployee                        && <EmployeeView   props={allProps} t={t} />}

            </div>
        </AppLayout>
    );
}