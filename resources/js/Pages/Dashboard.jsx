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

function DonutChart({ data = [], size = 80, t }) {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    if (!total) return <div style={{ fontSize: 11, color: t.textMute, textAlign: 'center', padding: 12 }}>No data</div>;
    const r = 32, cx = size / 2, cy = size / 2, stroke = 12, circ = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.surface3} strokeWidth={stroke} />
                {data.map((d, i) => {
                    const pct = d.value / total, dash = pct * circ;
                    const seg = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset * circ} transform={`rotate(-90 ${cx} ${cy})`} />;
                    offset += pct; return seg;
                })}
            </svg>
            <div style={{ flex: 1 }}>
                {data.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: t.textSoft, flex: 1 }}>{d.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
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
// ③ Approval Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
function ApprovalConfirmModal({ item, action, onConfirm, onCancel, t }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    if (!item) return null;
    const isApprove = action === 'approve';
    const typeLabel = { leave: 'Leave Request', ot: 'Overtime Request', attendance: 'Attendance Request', expense: 'Expense Request' }[item.type] || 'Request';
    const accentColor = isApprove ? t.green : t.red;
    const accentSoft  = isApprove ? t.greenSoft : t.redSoft;
    const confirm = async () => { setBusy(true); try { await onConfirm(item, action, note); } finally { setBusy(false); } };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ ...card(t, { padding: 0, width: '100%', maxWidth: 500, overflow: 'hidden' }) }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', background: accentSoft, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{isApprove ? '✓' : '✕'}</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: accentColor }}>{isApprove ? 'Confirm Approval' : 'Confirm Rejection'}</div>
                        <div style={{ fontSize: 12, color: t.textSoft }}>{typeLabel}</div>
                    </div>
                    <button onClick={onCancel} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: t.textMute, cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                {/* Requester */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textMute, marginBottom: 8 }}>Requested by</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.blueSoft, color: t.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{item.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{item.name}</div><div style={{ fontSize: 11, color: t.textMute }}>{item.department}</div></div>
                    </div>
                </div>
                {/* Detail grid */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textMute, marginBottom: 10 }}>Request Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {(item.details || []).map((d, i) => (
                            <div key={i} style={{ background: t.surface2, borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10, color: t.textMute, marginBottom: 2 }}>{d.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: d.highlight ? accentColor : t.text }}>{d.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Note + buttons */}
                <div style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.textMute, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{isApprove ? 'Note (optional)' : 'Rejection reason'}</div>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder={isApprove ? 'Add a note…' : 'Reason for rejection…'} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12, border: `1px solid ${t.borderMid}`, background: t.surface2, color: t.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                        <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface2, color: t.textSoft, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={confirm} disabled={busy} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: accentColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1 }}>{busy ? 'Processing…' : isApprove ? 'Approve' : 'Reject'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ③ Pending Approvals Panel — 4 request types
// ─────────────────────────────────────────────────────────────────────────────
function PendingApprovalsPanel({ approvalQueue = {}, onReload, t }) {
    const [confirm, setConfirm] = useState(null);
    const [tab, setTab] = useState('all');

    const allItems = [
        ...(approvalQueue.pending_leave_list || []).map(x => ({ ...x, type: 'leave' })),
        ...(approvalQueue.pending_ot_list || []).map(x => ({ ...x, type: 'ot' })),
        ...(approvalQueue.pending_attendance_list || []).map(x => ({ ...x, type: 'attendance' })),
        ...(approvalQueue.pending_expense_list || []).map(x => ({ ...x, type: 'expense' })),
    ];

    const counts = {
        all:        allItems.length,
        leave:      approvalQueue.pending_leave_requests || 0,
        ot:         approvalQueue.pending_ot_requests || 0,
        attendance: approvalQueue.pending_attendance_requests || 0,
        expense:    approvalQueue.pending_expense_requests || 0,
    };

    const filtered = tab === 'all' ? allItems : allItems.filter(x => x.type === tab);
    const typeColors = { leave: t.amber, ot: t.violet, attendance: t.blue, expense: t.green };
    const typeIcons  = { leave: '🌴', ot: '⏱', attendance: '🕐', expense: '💳' };
    const tabLabels  = [['all','All'],['leave','Leave'],['ot','OT'],['attendance','Attendance'],['expense','Expense']];

    const handleConfirm = async (item, action, note) => {
        const urlMap = {
            leave:      ['/api/payroll/leave-requests/',      '/approve', '/reject'],
            ot:         ['/api/payroll/overtime-requests/',   '/approve', '/reject'],
            attendance: ['/api/payroll/attendance-requests/', '/approve', '/reject'],
            expense:    ['/api/payroll/expense-requests/',    '/approve', '/reject'],
        };
        const [base, appSuffix, rejSuffix] = urlMap[item.type] || ['', '', ''];
        const url  = `${base}${item.id}${action === 'approve' ? appSuffix : rejSuffix}`;
        const body = action === 'reject' && note ? JSON.stringify({ reason: note }) : (note ? JSON.stringify({ note }) : undefined);
        try {
            const res = await fetch(url, { method: 'PATCH', headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json', Accept: 'application/json' }, body });
            if (res.ok) { toast(action === 'approve' ? 'Approved.' : 'Rejected.', action === 'approve' ? 'success' : 'error'); setConfirm(null); onReload(); }
            else { const d = await res.json(); toast(d.message || 'Failed.', 'error'); }
        } catch { toast('Network error.', 'error'); }
    };

    return (
        <>
            <Panel title="Pending approvals" subtitle="Leave · OT · Attendance · Expense" t={t}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
                    {tabLabels.map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)} style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${tab === key ? t.blue : t.border}`, background: tab === key ? t.blueSoft : t.surface2, color: tab === key ? t.blue : t.textSoft, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {label}
                            {counts[key] > 0 && <span style={{ background: tab === key ? t.blue : t.surface3, color: tab === key ? '#fff' : t.textMute, borderRadius: 99, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>{counts[key]}</span>}
                        </button>
                    ))}
                </div>
                {filtered.length === 0
                    ? <div style={{ fontSize: 12, color: t.textMute, padding: '16px 0', textAlign: 'center' }}>No pending items</div>
                    : filtered.map((item, i) => {
                        const clr = typeColors[item.type] || t.blue;
                        const initials = item.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: t.surface2, marginBottom: 8, border: `1px solid ${t.border}` }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: clr + '22', color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{item.name}</span>
                                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: clr + '22', color: clr, fontWeight: 700 }}>{typeIcons[item.type]} {item.type.toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: t.textMute, marginTop: 1 }}>{item.detail}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                                    <button onClick={() => setConfirm({ item, action: 'approve' })} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: t.greenSoft, color: t.green, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Approve</button>
                                    <button onClick={() => setConfirm({ item, action: 'reject'  })} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: t.redSoft,   color: t.red,   fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Reject</button>
                                </div>
                            </div>
                        );
                    })
                }
            </Panel>
            {confirm && <ApprovalConfirmModal item={confirm.item} action={confirm.action} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} t={t} />}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ④ Leave usage bar chart — top 20 employees this month
// ─────────────────────────────────────────────────────────────────────────────
function LeaveUsageChart({ data = [], t }) {
    if (!data.length) return <div style={{ fontSize: 12, color: t.textMute, padding: '8px 0' }}>No leave data this month</div>;
    const max = Math.max(...data.map(d => d.total_days || 0), 1);
    const colors = [t.blue, t.violet, t.green, t.amber, t.pink, t.teal, t.red];
    return data.slice(0, 20).map((d, i) => (
        <BarRow key={i} label={d.name} value={d.total_days} max={max} color={colors[i % colors.length]} t={t} extra={`${d.total_days}d`} />
    ));
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑤ OT by active project — top 10
// ─────────────────────────────────────────────────────────────────────────────
function OtByProjectChart({ data = [], t }) {
    if (!data.length) return <div style={{ fontSize: 12, color: t.textMute, padding: '8px 0' }}>No OT project data</div>;
    const max = Math.max(...data.map(d => d.ot_hours || 0), 1);
    const colors = [t.violet, t.blue, t.pink, t.amber, t.teal, t.green, t.red];
    return data.slice(0, 10).map((d, i) => (
        <BarRow key={i} label={d.project_name} value={d.ot_hours} max={max} color={colors[i % colors.length]} t={t} extra={`${d.ot_hours}h`} />
    ));
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑥ Monthly attendance bar chart — full month with daily count labels
// ─────────────────────────────────────────────────────────────────────────────
function MonthlyAttendanceChart({ data = [], t }) {
    if (!data.length) return <div style={{ fontSize: 12, color: t.textMute, padding: 12 }}>No data</div>;
    const max = Math.max(...data.map(d => d.present || 0), 1);
    const h = 80;
    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, minWidth: data.length * 22, height: h + 30, padding: '4px 0' }}>
                {data.map((d, i) => {
                    const barH = Math.max(4, Math.round((d.present / max) * h));
                    const isToday = d.isToday;
                    const isWeekend = d.weekend;
                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 18, flexShrink: 0 }}>
                            {d.present > 0 && <div style={{ fontSize: 7, color: isToday ? t.blue : t.textMute, fontWeight: isToday ? 700 : 400, lineHeight: 1 }}>{d.present}</div>}
                            {d.present === 0 && <div style={{ fontSize: 7, lineHeight: 1 }}>&nbsp;</div>}
                            <div title={`${d.date}: ${d.present} present`} style={{ width: '100%', height: barH, borderRadius: '3px 3px 0 0', background: isWeekend ? t.surface3 : isToday ? t.blue : t.green, opacity: isWeekend ? 0.5 : 1 }} />
                            <div style={{ fontSize: 7, color: isToday ? t.blue : t.textMute, fontWeight: isToday ? 700 : 400, transform: 'rotate(-45deg)', transformOrigin: 'top center', whiteSpace: 'nowrap', marginTop: 2 }}>{d.day}</div>
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
// ⑦ Late arrivals list — top 20 sorted by count
// ─────────────────────────────────────────────────────────────────────────────
function LateArrivalsList({ data = [], t }) {
    if (!data.length) return <div style={{ fontSize: 12, color: t.textMute, padding: '8px 0' }}>No late arrivals this month</div>;
    return data.slice(0, 20).map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < data.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.surface3, color: t.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: e.late_count >= 5 ? t.redSoft : t.amberSoft, color: e.late_count >= 5 ? t.red : t.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{e.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{e.name}</div>
                <div style={{ fontSize: 10, color: t.textMute }}>{e.department}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: e.late_count >= 5 ? t.red : t.amber }}>{e.late_count}x</div>
                <div style={{ fontSize: 10, color: t.textMute }}>avg +{e.avg_late_minutes}m</div>
            </div>
        </div>
    ));
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

            {/* ⑥ Monthly attendance — full width */}
            <Panel title="Monthly attendance" subtitle={`${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · daily present count`} t={t}>
                <MonthlyAttendanceChart data={monthlyAttendance} t={t} />
            </Panel>

            {/* Employment + Department */}
            <div style={col2}>
                <Panel title="Employment mix" subtitle="By type" t={t}>
                    <DonutChart size={80} t={t} data={employmentChart.length ? employmentChart : [
                        { label: 'Permanent', value: orgSummary.permanent || teamSummary.permanent || 0, color: t.blue },
                        { label: 'Probation', value: orgSummary.probation || teamSummary.probation || 0, color: t.amber },
                        { label: 'Contract',  value: orgSummary.contract  || teamSummary.contract  || 0, color: t.violet },
                    ]} />
                </Panel>
                <Panel title="Department headcount" t={t}>
                    {departmentChart.slice(0, 6).map((d, i) => <BarRow key={i} label={d.label} value={d.value} max={Math.max(...departmentChart.map(x => x.value), 1)} color={[t.blue,t.green,t.violet,t.amber,t.pink,t.teal][i%6]} t={t} />)}
                    {!departmentChart.length && <div style={{ fontSize: 12, color: t.textMute }}>No data</div>}
                </Panel>
            </div>

            {/* ⑦ Late arrivals — HR only */}
            {isHrOnly && (
                <Panel title="Late check-in frequency" subtitle="This month · sorted by count · top 20" t={t}>
                    <LateArrivalsList data={chronicallyLate} t={t} />
                </Panel>
            )}

            {/* Probation + Contract alerts */}
            <div style={col2}>
                <Panel title="Probation ending soon" subtitle="Within 10 days" t={t}>
                    {probationAlerts.length ? probationAlerts.slice(0,5).map((a,i) => <AlertRow key={i} name={a.name} dept={`${a.department} · ${a.country||''}`} tag={`${a.days_left}d`} color={t.amber} soft={t.amberSoft} urgent={a.days_left<=3} t={t} />) : <div style={{fontSize:12,color:t.textMute}}>No alerts</div>}
                </Panel>
                <Panel title="Contract expiring" subtitle="Within 30 days" t={t}>
                    {contractAlerts.length ? contractAlerts.slice(0,5).map((a,i) => <AlertRow key={i} name={a.name} dept={`${a.department} · ${a.country||''}`} tag={`${a.days_left}d`} color={t.red} soft={t.redSoft} urgent={a.days_left<=7} t={t} />) : <div style={{fontSize:12,color:t.textMute}}>No alerts</div>}
                </Panel>
            </div>

            {/* ⑧ On leave today (date-filtered on backend) + Birthdays + Holidays */}
            <div style={col3}>
                <Panel title="🎂 Birthdays this week" t={t}>
                    {birthdaysThisWeek.slice(0,4).map((b,i) => <PersonRow key={i} name={b.name} meta={`${b.department} · ${b.date}`} avatarBg={t.pinkSoft} avatarColor={t.pink} last={i===birthdaysThisWeek.length-1} t={t} />)}
                    {!birthdaysThisWeek.length && <div style={{fontSize:12,color:t.textMute}}>None this week</div>}
                </Panel>
                <Panel title="🌴 On leave today" subtitle="Approved leave covering today" t={t}>
                    {onLeaveToday.slice(0,5).map((b,i) => <PersonRow key={i} name={b.name} meta={`${ucfirst(b.leave_type)} · ${b.department}`} avatarBg={t.greenSoft} avatarColor={t.green} last={i===onLeaveToday.length-1} t={t} />)}
                    {!onLeaveToday.length && <div style={{fontSize:12,color:t.textMute}}>No one on leave today</div>}
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
                { icon: '↑', label: 'Import attendance', soft: t.blueSoft,   onClick: () => router.visit('/payroll/records') },
                { icon: '$', label: 'Payroll records',   soft: t.amberSoft,  onClick: () => router.visit('/payroll/records') },
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
                { icon: '↑', label: 'Import attendance', soft: t.blueSoft,   onClick: () => router.visit('/payroll/records') },
                { icon: '$', label: 'Payroll records',   soft: t.amberSoft,  onClick: () => router.visit('/payroll/records') },
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
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Today check-in status */}
            <div style={{ ...card(t, { padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }) }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: todayStatus.checked_in ? t.greenSoft : t.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{todayStatus.checked_in ? '✅' : '🕐'}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{todayStatus.checked_in ? `Checked in at ${todayStatus.check_in || '—'}` : 'Not checked in yet'}</div>
                    <div style={{ fontSize: 11, color: t.textMute, marginTop: 2 }}>{todayStatus.check_out ? `Checked out at ${todayStatus.check_out}` : todayStatus.checked_in ? 'Still at work' : 'Today is a working day'}</div>
                </div>
                {todayStatus.work_hours > 0 && <div style={{ background: t.greenSoft, color: t.green, padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{todayStatus.work_hours}h worked</div>}
            </div>

            <div style={col2}>
                <KpiCard label="Present days"  value={myStats.present_days||0}       sub="This month"        color={t.green}  soft={t.greenSoft}  t={t} />
                <KpiCard label="OT this month" value={`${myStats.ot_hours_month||0}h`} sub="Approved"       color={t.violet} soft={t.violetSoft} t={t} />
                <KpiCard label="Pending leave" value={myStats.pending_leaves||0}     sub="Awaiting approval" color={t.amber}  soft={t.amberSoft}  t={t} />
                <KpiCard label="Absent days"   value={myStats.absent_days||0}        sub="This month"        color={t.red}    soft={t.redSoft}    t={t} />
            </div>

            {/* My pending requests */}
            {(approvalQueue.my_pending_list || []).length > 0 && (
                <Panel title="My pending requests" subtitle="Waiting for approval" t={t}>
                    {(approvalQueue.my_pending_list || []).map((item, i) => {
                        const typeColors = { leave: t.amber, ot: t.violet, attendance: t.blue, expense: t.green };
                        const typeIcons  = { leave: '🌴', ot: '⏱', attendance: '🕐', expense: '💳' };
                        const clr = typeColors[item.type] || t.blue;
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: t.surface2, marginBottom: 8 }}>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{typeIcons[item.type]}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{item.detail}</div>
                                    <div style={{ fontSize: 10, color: t.textMute, marginTop: 1 }}>Submitted {item.submitted_at}</div>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: clr + '22', color: clr }}>Pending</span>
                            </div>
                        );
                    })}
                </Panel>
            )}

            <div style={col2}>
                <Panel title="Latest payslip" subtitle={`${myStats.payslip_period||'This month'} · ${ucfirst(myStats.payslip_status||'pending')}`} t={t}>
                    <div style={{ background: t.blueSoft, borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: t.blue, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Net salary</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: t.blue, letterSpacing: '-1px', lineHeight: 1 }}>{myStats.net_salary ? `$${fmtMoney(myStats.net_salary)}` : '—'}</div>
                    </div>
                    <div style={col2}>
                        {[['Base salary',myStats.base_salary,t.text,'$'],['OT pay',myStats.overtime_amount,t.green,'+$'],['Allowances',myStats.total_allowances,t.teal,'+$'],['Deductions',myStats.total_deductions,t.red,'-$']].map(([lbl,val,clr,pref]) => (
                            <div key={lbl} style={{ background: t.surface2, borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ fontSize: 10, color: t.textMute }}>{lbl}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: clr, marginTop: 2 }}>{val ? `${pref}${fmtMoney(val)}` : '—'}</div>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Leave balances" subtitle="Remaining days" t={t}>
                    {(myStats.leave_balances || []).map((lb, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <div style={{ fontSize: 12, color: t.textSoft }}>{lb.type}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: [t.blue,t.green,t.amber,t.violet,t.pink][i%5] }}>{lb.remaining}d / {lb.entitled}d</div>
                            </div>
                            <div style={{ height: 6, background: t.surface3, borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min((lb.remaining/Math.max(lb.entitled,1))*100,100)}%`, background: [t.blue,t.green,t.amber,t.violet,t.pink][i%5], borderRadius: 99 }} />
                            </div>
                        </div>
                    ))}
                    {!(myStats.leave_balances||[]).length && <div style={{fontSize:12,color:t.textMute}}>No data</div>}
                </Panel>
            </div>

            <div style={col2}>
                <Panel title="My weekly attendance" subtitle="Work hours per day" t={t}>
                    <Sparkline color={t.green} height={56} data={weeklyAttendance.map(d => d.value||0)} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        {weeklyAttendance.map(d => <div key={d.label} style={{ fontSize: 9, color: t.textMute }}>{d.label}</div>)}
                    </div>
                </Panel>
                <Panel title="📅 Upcoming holidays" t={t}>
                    <HolidayList items={upcomingHolidays.slice(0,4)} t={t} />
                </Panel>
            </div>

            {birthdaysThisWeek.length > 0 && (
                <Panel title="🎂 Birthdays this week" t={t}>
                    {birthdaysThisWeek.slice(0,4).map((b,i) => <PersonRow key={i} name={b.name} meta={`${b.department} · ${b.date}`} avatarBg={t.pinkSoft} avatarColor={t.pink} last={i===birthdaysThisWeek.length-1} t={t} />)}
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
        router.reload({ only: ['announcements','approvalQueue','orgSummary','teamSummary','onLeaveToday','leaveUsageChart','otByProjectChart','chronicallyLate','monthlyAttendance'] });
        forceReload(n => n + 1);
    }, []);

    const allProps = { roleName, dashboardMode, announcements, orgSummary, teamSummary, approvalQueue, employmentChart, departmentChart, monthlyAttendance, probationAlerts, contractAlerts, leaveUsageChart, otByProjectChart, chronicallyLate, myStats, todayStatus, upcomingHolidays, weeklyAttendance, birthdaysThisWeek, onLeaveToday };

    const totalPending = (approvalQueue.pending_leave_requests||0) + (approvalQueue.pending_ot_requests||0) + (approvalQueue.pending_attendance_requests||0) + (approvalQueue.pending_expense_requests||0);

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />
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
                            {isEmployee && todayStatus.checked_in && (
                                <div style={{ background: t.greenSoft, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 72 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: t.green }}>{todayStatus.check_in}</div>
                                    <div style={{ fontSize: 10, color: t.green, fontWeight: 600, marginTop: 2 }}>Checked in</div>
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