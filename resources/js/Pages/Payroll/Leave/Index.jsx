import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '@/Layouts/AppLayout';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from '@/Contexts/LanguageContext';

// ─── Theme ────────────────────────────────────────────────────
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
        panel: 'rgba(11,23,48,0.88)',
        panelSolid: '#0f1b34',
        panelSoft: 'rgba(255,255,255,0.04)',
        panelSofter: 'rgba(255,255,255,0.07)',
        border: 'rgba(148,163,184,0.13)',
        borderStrong: 'rgba(148,163,184,0.22)',
        text: '#f8fafc',
        textSoft: '#cbd5e1',
        textMute: '#64748b',
        overlay: 'rgba(2,8,23,0.72)',
        shadow: '0 24px 60px rgba(0,0,0,0.38)',
        shadowSoft: '0 4px 16px rgba(0,0,0,0.22)',
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primarySoft: 'rgba(139,92,246,0.16)',
        secondary: '#3b82f6',
        secondarySoft: 'rgba(59,130,246,0.16)',
        success: '#10b981',
        successSoft: 'rgba(16,185,129,0.16)',
        warning: '#f59e0b',
        warningSoft: 'rgba(245,158,11,0.16)',
        danger: '#f87171',
        dangerSoft: 'rgba(248,113,113,0.16)',
        inputBg: 'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148,163,184,0.16)',
        inputBorderFocus: '#8b5cf6',
        modalHeader: 'linear-gradient(135deg,#312e81 0%,#1e40af 100%)',
        rowHover: 'rgba(255,255,255,0.03)',
        calBg: 'rgba(255,255,255,0.03)',
    };
    return {
        panel: 'rgba(255,255,255,0.92)',
        panelSolid: '#ffffff',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.14)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        overlay: 'rgba(15,23,42,0.42)',
        shadow: '0 20px 50px rgba(15,23,42,0.10)',
        shadowSoft: '0 4px 14px rgba(15,23,42,0.06)',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',
        secondary: '#2563eb',
        secondarySoft: '#dbeafe',
        success: '#059669',
        successSoft: '#d1fae5',
        warning: '#d97706',
        warningSoft: '#fef3c7',
        danger: '#ef4444',
        dangerSoft: '#fee2e2',
        inputBg: '#f8fafc',
        inputBorder: '#e2e8f0',
        inputBorderFocus: '#7c3aed',
        modalHeader: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)',
        rowHover: '#fafbff',
        calBg: '#f8fafc',
    };
}

// ─── Constants ────────────────────────────────────────────────
const COLOR_POOL = [
    { color:'#7c3aed', bg:'#faf5ff', bgDark:'rgba(124,58,237,0.16)', border:'#ddd6fe' },
    { color:'#2563eb', bg:'#eff6ff', bgDark:'rgba(37,99,235,0.16)',  border:'#bfdbfe' },
    { color:'#059669', bg:'#f0fdf4', bgDark:'rgba(5,150,105,0.16)',  border:'#bbf7d0' },
    { color:'#d97706', bg:'#fffbeb', bgDark:'rgba(217,119,6,0.16)',  border:'#fde68a' },
    { color:'#dc2626', bg:'#fef2f2', bgDark:'rgba(220,38,38,0.16)',  border:'#fecaca' },
    { color:'#0891b2', bg:'#ecfeff', bgDark:'rgba(8,145,178,0.16)',  border:'#a5f3fc' },
    { color:'#9333ea', bg:'#fdf4ff', bgDark:'rgba(147,51,234,0.16)', border:'#e9d5ff' },
    { color:'#6b7280', bg:'#f9fafb', bgDark:'rgba(107,114,128,0.16)',border:'#e5e7eb' },
];

const STATUS_CONFIG = {
    pending:  { label:'leaveRequest.status.pending',  color:'#d97706', bg:'#fef3c7', bgDark:'rgba(217,119,6,0.18)',  icon:'⏳' },
    approved: { label:'leaveRequest.status.approved', color:'#059669', bg:'#d1fae5', bgDark:'rgba(5,150,105,0.18)', icon:'✓' },
    rejected: { label:'leaveRequest.status.rejected', color:'#dc2626', bg:'#fee2e2', bgDark:'rgba(220,38,38,0.18)', icon:'✕' },
};

const DAY_TYPE_CONFIG = {
    full_day:    { label:'leaveRequest.dayTypes.full_day',    color:'#374151', bg:'#f3f4f6', bgDark:'rgba(55,65,81,0.3)'   },
    half_day_am: { label:'leaveRequest.dayTypes.half_day_am', color:'#2563eb', bg:'#dbeafe', bgDark:'rgba(37,99,235,0.2)'  },
    half_day_pm: { label:'leaveRequest.dayTypes.half_day_pm', color:'#7c3aed', bg:'#ede9fe', bgDark:'rgba(124,58,237,0.2)' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr.split('T')[0] + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function formatNum(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return n % 1 === 0 ? String(Math.round(n)) : String(n);
}
function buildLeaveTypeConfig(leavePolicies) {
    const config = {};
    leavePolicies.forEach((pol, idx) => {
        const c = COLOR_POOL[idx % COLOR_POOL.length];
        config[pol.leave_type] = { label:pol.leave_type, color:c.color, bg:c.bg, bgDark:c.bgDark, border:c.border };
    });
    return config;
}
function pad2(n) { return String(n).padStart(2, '0'); }

// ─── Premium Portal Dropdown ──────────────────────────────────
function PremiumDropdown({ options, value, onChange, placeholder = 'Select...', theme, dark, disabled = false, width = 'auto' }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({ top: 0, left: 0, width: 0, above: false });
    const triggerRef      = useRef(null);
    const menuRef         = useRef(null);
    const selected        = options.find(o => String(o.value) === String(value) && !o.disabled);

    useEffect(() => {
        const handler = (e) => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function handleOpen() {
        if (disabled) return;
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            const MENU_H   = Math.min(options.filter(o => !o.disabled).length * 44, 240);
            const GAP      = 6;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const above = spaceBelow < MENU_H + GAP || spaceAbove > spaceBelow;
            setPos({
                top:   above ? rect.top - MENU_H - GAP : rect.bottom + GAP,
                left:  rect.left,
                width: rect.width,
                above,
            });
        }
        setOpen(v => !v);
    }

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                style={{
                    width, height: 44, padding: '0 14px', borderRadius: 12,
                    border: `1.5px solid ${open ? theme.inputBorderFocus : theme.inputBorder}`,
                    background: dark
                        ? 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
                    color: selected ? theme.text : theme.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: selected ? 600 : 400,
                    boxShadow: open ? `0 0 0 3px ${theme.primary}22` : 'none',
                    transition: 'all 0.18s', opacity: disabled ? 0.5 : 1, outline: 'none',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
                >
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    className="hide-scrollbar"
                    style={{
                        position: 'absolute',
                        top: pos.top, left: pos.left, width: pos.width,
                        background: dark ? '#0d1b38' : '#fff',
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 14,
                        boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 40px rgba(15,23,42,0.14)',
                        zIndex: 99999, overflow: 'hidden',
                        animation: pos.above ? 'dropUp 0.18s ease' : 'dropIn 0.18s ease',
                        maxHeight: 240, overflowY: 'auto',
                    }}
                >
                    {options.filter(o => !o.disabled).map(opt => {
                        const isSel = String(opt.value) === String(value);
                        return (
                            <div
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    padding: '10px 14px', fontSize: 13,
                                    fontWeight: isSel ? 700 : 500,
                                    color: isSel ? '#fff' : theme.text,
                                    background: isSel ? theme.primary : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.12s',
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}

// ─── Leave Balance Cards ──────────────────────────────────────
function LeaveBalanceCards({ leavePolicies, leaveTypeConfig, balanceMap, dark, theme, tr }) {
    return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {leavePolicies.map((pol) => {
                const cfg       = leaveTypeConfig[pol.leave_type] || COLOR_POOL[0];
                const bal       = balanceMap[pol.leave_type];
                const remaining = bal?.remaining_days ?? pol.days_per_year;
                const used      = bal?.used_days ?? 0;
                const total     = pol.days_per_year;
                const pct       = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

                return (
                    <div key={pol.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: dark ? 'rgba(255,255,255,0.04)' : '#fff',
                        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : cfg.border}`,
                        borderRadius: 14, padding: '12px 16px',
                        boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
                        position: 'relative', overflow: 'hidden', minWidth: 170,
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: cfg.color }} />
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: dark ? cfg.bgDark : cfg.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${dark ? 'transparent' : cfg.border}`,
                        }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                                {formatNum(remaining)}
                            </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontSize: 11, fontWeight: 800, color: cfg.color,
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {pol.leave_type}
                            </div>
                            <div style={{ fontSize: 10, color: theme.textMute, marginTop: 2 }}>
                                {tr('leaveRequest.labels.used')} {formatNum(used)} · {tr('leaveRequest.labels.total')} {formatNum(total)}
                            </div>
                            <div style={{ marginTop: 6, height: 3, borderRadius: 99, background: dark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', width: 80, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: cfg.color, width: `${pct}%` }} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Request Row ──────────────────────────────────────────────
function RequestRow({ req, leaveTypeConfig, dark, theme, canApprove, userId, onApprove, onReject, onDelete, isLast, tr }) {
    const typeCfg    = leaveTypeConfig[req.leave_type] || COLOR_POOL[0];
    const statusCfg  = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
    const dayTypeCfg = DAY_TYPE_CONFIG[req.day_type || 'full_day'];

    const isMyRequest    = req.user_id === userId;
    const isAssignedToMe = req.approver_id === userId;
    const showActions    = canApprove && req.status === 'pending' && isAssignedToMe && !isMyRequest;
    const showDelete     = req.user_id === userId && req.status === 'pending';

    const statusBg = dark ? statusCfg.bgDark : statusCfg.bg;
    const typeBg   = dark ? typeCfg.bgDark   : typeCfg.bg;

    const chipLabel = { fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: 5 };
    const chipValue = { fontSize: 12, fontWeight: 700 };

    return (
        <div
            style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${theme.border}`, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            <div style={{ width: 3, flexShrink: 0, background: typeCfg.color }} />
            <div style={{ flex: 1, padding: '13px 18px', minWidth: 0 }}>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{req.leave_type}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: statusBg, color: statusCfg.color, borderRadius: 99, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            {statusCfg.icon} {tr(statusCfg.label)}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMute }}>{tr(dayTypeCfg.label)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {req.status === 'pending' && req.approver && !showActions && (
                            <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                                <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 500 }}>{tr('leaveRequest.labels.awaiting')}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.secondary }}>{req.approver.name}</div>
                            </div>
                        )}
                        {req.status === 'approved' && req.approvedBy && (
                            <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                                <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 500 }}>{tr('leaveRequest.labels.approvedBy')}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.success }}>{req.approvedBy.name}</div>
                            </div>
                        )}
                        {req.status === 'rejected' && req.approvedBy && (
                            <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                                <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 500 }}>{tr('leaveRequest.labels.rejectedBy')}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.danger }}>{req.approvedBy.name}</div>
                            </div>
                        )}
                        {showActions && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <button onClick={() => onApprove(req)} style={{
                                    background: dark ? 'linear-gradient(135deg,#065f46,#059669)' : 'linear-gradient(135deg,#059669,#10b981)',
                                    border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 5,
                                    boxShadow: '0 2px 8px rgba(16,185,129,0.35)', transition: 'opacity 0.15s, box-shadow 0.15s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Approve
                                </button>
                                <button onClick={() => onReject(req)} style={{
                                    background: dark ? 'linear-gradient(135deg,rgba(220,38,38,0.28),rgba(239,68,68,0.22))' : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                                    border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', color: dark ? '#f87171' : '#dc2626', display: 'flex', alignItems: 'center', gap: 5,
                                    boxShadow: dark ? '0 2px 8px rgba(248,113,113,0.15)' : '0 2px 8px rgba(220,38,38,0.10)', transition: 'opacity 0.15s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    Reject
                                </button>
                            </div>
                        )}
                        {showDelete && (
                            <button onClick={() => onDelete(req)} title={tr('leaveRequest.actions.deleteRequest')} style={{
                                width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s', flexShrink: 0, color: dark ? 'rgba(248,113,113,0.4)' : '#fca5a5',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(248,113,113,0.16)' : '#fee2e2'; e.currentTarget.style.color = dark ? '#f87171' : '#dc2626'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? 'rgba(248,113,113,0.4)' : '#fca5a5'; }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {req.user && !isMyRequest && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        {req.user.avatar_url ? (
                            <img src={`/storage/${req.user.avatar_url}`} alt={req.user.name} style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                            <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: typeCfg.color }}>
                                {req.user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{req.user.name}</span>
                        {req.user.position   && <span style={{ fontSize: 11, color: theme.textMute }}>{req.user.position}</span>}
                        {req.user.department && <span style={{ fontSize: 11, color: theme.secondary }}>{req.user.department}</span>}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 9, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                        <span style={{ ...chipLabel, color: theme.textMute }}>{tr('leaveRequest.labels.from')}</span>
                        <span style={{ ...chipValue, color: theme.text }}>{formatDate(req.start_date)}</span>
                    </span>
                    {req.day_type === 'full_day' && req.start_date !== req.end_date && (
                        <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                            </svg>
                            <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                                <span style={{ ...chipLabel, color: theme.textMute }}>{tr('leaveRequest.labels.to')}</span>
                                <span style={{ ...chipValue, color: theme.text }}>{formatDate(req.end_date)}</span>
                            </span>
                        </>
                    )}
                    <span style={{ color: theme.border, fontSize: 12 }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                        <span style={{ ...chipLabel, color: typeCfg.color }}>{tr('leaveRequest.labels.days')}</span>
                        <span style={{ ...chipValue, color: typeCfg.color }}>
                            {formatNum(req.total_days)}{req.total_days === 0.5 ? ` ${tr('leaveRequest.units.half')}` : ''}
                        </span>
                    </span>
                </div>

                {req.document_path && (
                    <div style={{ marginTop: 7 }}>
                        <a href={`/storage/${req.document_path}`} target="_blank" rel="noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
                                background: dark ? 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(37,99,235,0.12))' : 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                                color: dark ? '#60a5fa' : '#2563eb', fontSize: 11, fontWeight: 700, textDecoration: 'none',
                                boxShadow: dark ? '0 1px 6px rgba(59,130,246,0.15)' : '0 1px 4px rgba(37,99,235,0.10)', transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download Document
                        </a>
                    </div>
                )}

                {req.note && (
                    <div style={{ display: 'inline-flex', alignItems: 'baseline', marginTop: 6 }}>
                        <span style={{ ...chipLabel, color: theme.textMute }}>{tr('leaveRequest.fields.reason')}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: theme.textSoft }}>{req.note}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────
function ConfirmModal({ type, request, loading, leaveTypeConfig, dark, theme, onCancel, onApprove, onReject, onDelete, tr }) {
    const isApprove = type === 'approve';
    const isDelete  = type === 'delete';

    const typeCfg    = leaveTypeConfig[request.leave_type] || COLOR_POOL[0];
    const dayTypeCfg = DAY_TYPE_CONFIG[request.day_type || 'full_day'];

    const accentColor = isDelete  ? (dark ? '#f87171' : '#dc2626') : isApprove ? (dark ? '#34d399' : '#059669') : (dark ? '#f87171' : '#dc2626');
    const accentBg    = isDelete  ? (dark ? 'rgba(248,113,113,0.14)' : '#fee2e2') : isApprove ? (dark ? 'rgba(16,185,129,0.15)' : '#d1fae5') : (dark ? 'rgba(248,113,113,0.14)' : '#fee2e2');
    const title       = isDelete  ? tr('leaveRequest.confirm.deleteTitle') : isApprove ? tr('leaveRequest.confirm.approveTitle') : tr('leaveRequest.confirm.rejectTitle');
    const subtext     = isDelete  ? tr('leaveRequest.confirm.deleteSubtext') : tr('leaveRequest.confirm.notifySubtext');
    const icon        = isDelete  ? '🗑' : isApprove ? '✓' : '✕';
    const typeBg      = dark ? typeCfg.bgDark : typeCfg.bg;
    const dayBg       = dark ? dayTypeCfg.bgDark : dayTypeCfg.bg;

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:9000, padding:20 }}>
            <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius:22, width:'100%', maxWidth:420, boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 24px 60px rgba(15,23,42,0.18)', overflow:'hidden', border:`1px solid ${theme.border}`, animation:'popIn 0.22s ease' }}>
                <div style={{ height:4, background: isApprove ? '#059669' : '#ef4444' }} />
                <div style={{ padding:'26px 26px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                        <div style={{ width:46, height:46, borderRadius:14, background:accentBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, border:`1px solid ${accentColor}33` }}>
                            {icon}
                        </div>
                        <div>
                            <div style={{ fontSize:16, fontWeight:900, color:theme.text }}>{title}</div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:3 }}>{subtext}</div>
                        </div>
                    </div>
                    <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : typeCfg.border}`, borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:14, fontWeight:800, color:typeCfg.color }}>{request.leave_type}</span>
                            <span style={{ fontSize:10, fontWeight:700, background:dayBg, color:dayTypeCfg.color, borderRadius:99, padding:'2px 9px' }}>{tr(dayTypeCfg.label)}</span>
                        </div>
                        {!isDelete && request.user && (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:24, height:24, borderRadius:8, background:typeBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:typeCfg.color }}>
                                    {request.user.name?.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>{request.user.name}</span>
                            </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:theme.textSoft }}>
                            <span style={{ fontWeight:600 }}>{formatDate(request.start_date)}</span>
                            {request.start_date !== request.end_date && (
                                <><span style={{ color:theme.textMute }}>→</span><span style={{ fontWeight:600 }}>{formatDate(request.end_date)}</span></>
                            )}
                            <span style={{ fontSize:11, fontWeight:700, color:typeCfg.color, background:typeBg, borderRadius:6, padding:'1px 8px' }}>
                                {formatNum(request.total_days)} {request.total_days===0.5 ? tr('leaveRequest.units.halfDay') : request.total_days==1 ? tr('leaveRequest.units.day') : tr('leaveRequest.units.days')}
                            </span>
                        </div>
                        {request.note && (
                            <div style={{ fontSize:11, color:theme.textMute, fontStyle:'italic', borderTop:`1px solid ${theme.border}`, paddingTop:8 }}>
                                "{request.note}"
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'0 26px 22px' }}>
                    <button onClick={onCancel} disabled={loading}
                        style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', color:theme.textSoft }}>
                        Cancel
                    </button>
                    {isDelete ? (
                        <button onClick={onDelete} disabled={loading}
                            style={{ background: dark ? 'rgba(248,113,113,0.18)' : '#ef4444', border:`1px solid ${dark ? 'rgba(248,113,113,0.35)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#f87171' : '#fff', opacity:loading?0.6:1 }}>
                            {loading ? tr('leaveRequest.actions.deleting') : `🗑 ${tr('leaveRequest.actions.delete')}`}
                        </button>
                    ) : isApprove ? (
                        <button onClick={onApprove} disabled={loading}
                            style={{ background: dark ? 'rgba(16,185,129,0.2)' : '#059669', border:`1px solid ${dark ? 'rgba(16,185,129,0.4)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#34d399' : '#fff', opacity:loading?0.6:1 }}>
                            {loading ? tr('leaveRequest.actions.approving') : `✓ ${tr('leaveRequest.actions.approve')}`}
                        </button>
                    ) : (
                        <button onClick={onReject} disabled={loading}
                            style={{ background: dark ? 'rgba(248,113,113,0.18)' : '#ef4444', border:`1px solid ${dark ? 'rgba(248,113,113,0.35)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#f87171' : '#fff', opacity:loading?0.6:1 }}>
                            {loading ? tr('leaveRequest.actions.rejecting') : `✕ ${tr('leaveRequest.actions.reject')}`}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Leave Request Modal ──────────────────────────────────────
function LeaveRequestModal({ saving, setSaving, policyMap, balanceMap, leaveTypeConfig, approvers, roleName, dark, theme, onClose, onSuccess, onError, tr }) {
    const leaveTypes = Object.keys(policyMap);
    const [form, setForm] = useState({
        leave_type:  leaveTypes[0] || '',
        day_type:    'full_day',
        start_date:  '',
        end_date:    '',
        note:        '',
        approver_id: approvers[0]?.id || '',
    });
    const [docFile, setDocFile]   = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [errors, setErrors]     = useState({});
    const fileInputRef            = useRef();

    const set = (k, v) => {
        setForm(f => {
            const u = { ...f, [k]: v };
            if (k === 'day_type' && (v === 'half_day_am' || v === 'half_day_pm')) u.end_date = u.start_date;
            return u;
        });
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    function calcDays() {
        if (form.day_type === 'half_day_am' || form.day_type === 'half_day_pm') return form.start_date ? 0.5 : 0;
        if (!form.start_date || !form.end_date) return 0;
        const start = new Date(form.start_date + 'T00:00:00');
        const end   = new Date(form.end_date   + 'T00:00:00');
        if (end < start) return 0;
        return Math.round((end - start) / (1000*60*60*24)) + 1;
    }

    const previewDays = calcDays();
    const isHalfDay   = form.day_type !== 'full_day';
    const bal         = balanceMap[form.leave_type];
    const pol         = policyMap[form.leave_type];
    const typeCfg     = leaveTypeConfig[form.leave_type] || COLOR_POOL[0];
    const requiresDoc = pol?.requires_document == 1;
    const typeBg      = dark ? typeCfg.bgDark : typeCfg.bg;

    function handleFile(file) {
        if (!file) return;
        const allowed = ['application/pdf','image/jpeg','image/jpg','image/png'];
        if (!allowed.includes(file.type)) { setErrors(e => ({...e, document:tr('leaveRequest.validation.fileType')})); return; }
        if (file.size > 5*1024*1024)       { setErrors(e => ({...e, document:tr('leaveRequest.validation.fileSize')})); return; }
        setDocFile(file);
        setErrors(e => ({...e, document:null}));
    }

    function validate() {
        const e = {};
        if (!form.leave_type) e.leave_type = tr('leaveRequest.validation.leaveTypeRequired');
        if (!form.start_date) e.start_date = tr('leaveRequest.validation.startDateRequired');
        if (!isHalfDay && !form.end_date) e.end_date = tr('leaveRequest.validation.endDateRequired');
        if (!form.note) e.note = tr('leaveRequest.validation.reasonRequired');
        if (!['hr','admin'].includes(roleName) && !form.approver_id) e.approver_id = tr('leaveRequest.validation.approverRequired');
        if (!isHalfDay && form.start_date && form.end_date && form.end_date < form.start_date) e.end_date = tr('leaveRequest.validation.endDateAfterStart');
        if (requiresDoc && !docFile) e.document = tr('leaveRequest.validation.documentRequired');
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;
        setSaving(true);
        const payload = {
            leave_type:  form.leave_type,
            day_type:    form.day_type,
            start_date:  form.start_date,
            end_date:    isHalfDay ? form.start_date : form.end_date,
            note:        form.note,
            approver_id: form.approver_id || '',
        };
        if (docFile) {
            const fd = new FormData();
            Object.entries(payload).forEach(([k,v]) => fd.append(k,v));
            fd.append('document', docFile);
            router.post('/payroll/leaves', fd, { forceFormData:true,
                onSuccess: () => { setSaving(false); onSuccess(); },
                onError: (errs) => { setSaving(false); setErrors(errs); const m = Object.values(errs)[0]; onError(Array.isArray(m)?m[0]:m||tr('leaveRequest.validation.validationError')); },
            });
        } else {
            router.post('/payroll/leaves', payload, {
                onSuccess: () => { setSaving(false); onSuccess(); },
                onError: (errs) => { setSaving(false); setErrors(errs); const m = Object.values(errs)[0]; onError(Array.isArray(m)?m[0]:m||tr('leaveRequest.validation.validationError')); },
            });
        }
    }

    const inp = (hasErr) => ({
        background: theme.inputBg,
        border: `1.5px solid ${hasErr ? theme.danger : theme.inputBorder}`,
        borderRadius: 12, padding: '10px 14px', fontSize: 13, color: theme.text,
        outline: 'none', width: '100%', boxSizing: 'border-box',
        transition: 'border 0.15s', colorScheme: dark ? 'dark' : 'light',
    });
    const lbl = { fontSize:11, fontWeight:800, color:theme.textSoft, textTransform:'uppercase', letterSpacing:'0.5px' };

    const approverOptions = [
        { value:'', label:tr('leaveRequest.placeholders.selectApprover'), disabled:true },
        ...approvers.map(a => ({ value:a.id, label:a.name })),
    ];

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:8000, padding:20 }}>
            <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius:24, width:'100%', maxWidth:556, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow: dark ? '0 40px 100px rgba(0,0,0,0.65)' : '0 32px 80px rgba(15,23,42,0.22)', border:`1px solid ${theme.border}`, animation:'popIn 0.22s ease' }}>

                {/* Header */}
                <div style={{ background:theme.modalHeader, padding:'20px 24px 18px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%' }} />
                    <div style={{ position:'absolute', bottom:-30, left:20, width:90, height:90, borderRadius:'50%' }} />
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.16)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏖️</div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>{tr('leaveRequest.modal.badge')}</div>
                                <div style={{ fontSize:17, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{tr('leaveRequest.actions.requestLeave')}</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.14)', border:'none', cursor:'pointer', fontSize:20, color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1 }}>×</button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16, overflowY:'auto', flex:1 }} className="hide-scrollbar">

                    {/* Leave Type */}
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        <label style={lbl}>{tr('leaveRequest.fields.leaveType')} <span style={{ color:theme.danger }}>*</span></label>
                        {leaveTypes.length === 0
                            ? <div style={{ fontSize:12, color:theme.textMute, background:theme.panelSoft, borderRadius:10, padding:'10px 14px', border:`1px solid ${theme.border}` }}>{tr('leaveRequest.messages.noLeaveTypes')}</div>
                            : <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                {leaveTypes.map(type => {
                                    const pol2    = policyMap[type];
                                    const isActive = form.leave_type === type;
                                    return (
                                        <button key={type} onClick={() => { set('leave_type', type); setDocFile(null); setErrors(e => ({...e, document:null})); }}
                                            style={{
                                                border: `1.5px solid ${isActive ? theme.primary : theme.inputBorder}`,
                                                borderRadius: 20, padding: '6px 16px', fontSize: 12, cursor: 'pointer',
                                                background: isActive ? (dark ? 'rgba(139,92,246,0.18)' : '#f3e8ff') : (dark ? 'rgba(255,255,255,0.04)' : '#f9fafb'),
                                                color: isActive ? theme.primary : theme.textSoft,
                                                fontWeight: isActive ? 800 : 500,
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                transition: 'all 0.15s',
                                                boxShadow: isActive ? `0 0 0 3px ${theme.primary}18` : 'none',
                                            }}>
                                            {type}
                                            {pol2?.requires_document == 1 && (
                                                <span style={{ fontSize:9, background: isActive ? theme.primary : (dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), color: isActive ? '#fff' : theme.textMute, borderRadius:4, padding:'1px 5px', fontWeight:800 }}>
                                                    {tr('leaveRequest.labels.doc')}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                              </div>
                        }
                        {errors.leave_type && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.leave_type}</span>}
                    </div>

                    {/* Day Type */}
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        <label style={lbl}>{tr('leaveRequest.fields.dayType')} <span style={{ color:theme.danger }}>*</span></label>
                        <div style={{ display:'flex', gap:8 }}>
                            {Object.entries(DAY_TYPE_CONFIG).map(([type, cfg2]) => {
                                const isActive = form.day_type === type;
                                return (
                                    <button key={type} onClick={() => set('day_type', type)}
                                        style={{
                                            flex: 1, border: `1.5px solid ${isActive ? theme.primary : theme.inputBorder}`,
                                            borderRadius: 20, padding: '8px 10px', fontSize: 12, cursor: 'pointer',
                                            background: isActive ? (dark ? 'rgba(139,92,246,0.18)' : '#f3e8ff') : (dark ? 'rgba(255,255,255,0.04)' : '#f9fafb'),
                                            color: isActive ? theme.primary : theme.textSoft,
                                            fontWeight: isActive ? 800 : 500, textAlign: 'center',
                                            transition: 'all 0.15s',
                                            boxShadow: isActive ? `0 0 0 3px ${theme.primary}18` : 'none',
                                        }}>
                                        {tr(cfg2.label)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Balance */}
                    {pol && (
                        <div style={{ background:typeBg, borderRadius:12, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${dark ? 'transparent' : typeCfg.border}` }}>
                            <div>
                                <div style={{ fontSize:11, color:typeCfg.color, fontWeight:700 }}>{tr('leaveRequest.labels.availableBalance')}</div>
                                <div style={{ fontSize:10, color:theme.textMute, marginTop:2 }}>{tr('leaveRequest.labels.used')}: {bal?.used_days ?? 0} · {tr('leaveRequest.labels.total')}: {pol.days_per_year} {tr('leaveRequest.units.days')}</div>
                            </div>
                            <div style={{ fontSize:24, fontWeight:900, color:typeCfg.color }}>
                                {bal?.remaining_days ?? pol.days_per_year}<span style={{ fontSize:12, fontWeight:500, color:theme.textMute }}> {tr('leaveRequest.units.days')}</span>
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div style={isHalfDay ? {} : { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            <label style={lbl}>{isHalfDay ? tr('leaveRequest.fields.date') : tr('leaveRequest.fields.startDate')} <span style={{ color:theme.danger }}>*</span></label>
                            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inp(errors.start_date)} />
                            {errors.start_date && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.start_date}</span>}
                        </div>
                        {!isHalfDay && (
                            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                <label style={lbl}>{tr('leaveRequest.fields.endDate')} <span style={{ color:theme.danger }}>*</span></label>
                                <input type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} style={inp(errors.end_date)} />
                                {errors.end_date && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.end_date}</span>}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    {form.start_date && (previewDays > 0 || isHalfDay) && (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            <div style={{ background: dark ? 'rgba(139,92,246,0.16)' : '#ede9fe', border:`1px solid ${dark ? 'rgba(139,92,246,0.3)' : '#ddd6fe'}`, borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span style={{ fontSize:12, color: dark ? '#a78bfa' : '#7c3aed', fontWeight:600 }}>
                                    {isHalfDay ? `${tr(DAY_TYPE_CONFIG[form.day_type].label)} — ${formatDate(form.start_date)}` : tr('leaveRequest.preview.totalLeaveDays')}
                                </span>
                                <span style={{ fontSize:16, fontWeight:900, color: dark ? '#a78bfa' : '#7c3aed' }}>
                                    {previewDays} {previewDays===0.5 ? tr('leaveRequest.units.halfDay') : previewDays===1 ? tr('leaveRequest.units.day') : tr('leaveRequest.units.days')}
                                </span>
                            </div>
                            {pol?.is_paid && !isHalfDay && (() => {
                                const avail = bal ? (bal.remaining_days ?? 0) : (pol?.days_per_year ?? 0);
                                return avail > 0 && previewDays > avail ? (
                                    <div style={{ background: dark ? 'rgba(245,158,11,0.12)' : '#fff7ed', border:`1px solid ${dark ? 'rgba(245,158,11,0.25)' : '#fed7aa'}`, borderRadius:10, padding:'10px 14px' }}>
                                        <div style={{ fontSize:12, fontWeight:700, color: dark ? '#f59e0b' : '#c2410c', marginBottom:4 }}>⚠ {tr('leaveRequest.messages.balanceExceeded')}</div>
                                        <div style={{ fontSize:11, color: dark ? '#d97706' : '#9a3412', lineHeight:1.8 }}>
                                            <span style={{ fontWeight:600 }}>{avail} {tr('leaveRequest.units.daysShort')}</span> → <span style={{ fontWeight:600 }}>{form.leave_type}</span> (paid)<br/>
                                            <span style={{ fontWeight:600 }}>{previewDays - avail} {tr('leaveRequest.units.daysShort')}</span> → <span style={{ fontWeight:600 }}>{tr('leaveRequest.labels.absent')}</span> ({tr('leaveRequest.labels.unpaid')})
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                            {pol?.is_paid && !isHalfDay && bal && (bal.remaining_days ?? 0) <= 0 && previewDays > 0 && (
                                <div style={{ background: dark ? 'rgba(245,158,11,0.12)' : '#fff7ed', border:`1px solid ${dark ? 'rgba(245,158,11,0.25)' : '#fed7aa'}`, borderRadius:10, padding:'10px 14px' }}>
                                    <div style={{ fontSize:12, fontWeight:700, color: dark ? '#f59e0b' : '#c2410c', marginBottom:2 }}>⚠ {tr('leaveRequest.messages.noBalance', { type: form.leave_type })}</div>
                                    <div style={{ fontSize:11, color: dark ? '#d97706' : '#9a3412' }}>
                                        All <span style={{ fontWeight:600 }}>{previewDays} day(s)</span> will be submitted as <span style={{ fontWeight:600 }}>{tr('leaveRequest.labels.absent')}</span> ({tr('leaveRequest.labels.unpaid')}).
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Document Upload */}
                    {(requiresDoc || pol) && (
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                <label style={lbl}>{tr('leaveRequest.fields.supportingDocument')}</label>
                                {requiresDoc
                                    ? <span style={{ fontSize:10, fontWeight:700, background: dark ? 'rgba(248,113,113,0.15)' : '#fee2e2', color:theme.danger, borderRadius:5, padding:'2px 8px' }}>{tr('leaveRequest.labels.required')}</span>
                                    : <span style={{ fontSize:10, fontWeight:600, background:theme.panelSoft, color:theme.textMute, borderRadius:5, padding:'2px 8px' }}>{tr('leaveRequest.labels.optional')}</span>
                                }
                            </div>
                            {!docFile ? (
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ border:`2px dashed ${errors.document ? theme.danger : dragOver ? theme.primary : theme.inputBorder}`, borderRadius:14, padding:'22px 16px', textAlign:'center', cursor:'pointer', background: dark ? (dragOver ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)') : (dragOver ? '#faf5ff' : '#fafafa'), transition:'all 0.2s' }}>
                                    <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                                        <div style={{ width:40, height:40, borderRadius:12, background: dark ? (dragOver ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)') : (dragOver ? '#ede9fe' : '#f3f4f6'), display:'flex', alignItems:'center', justifyContent:'center' }}>
                                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={dragOver ? theme.primary : theme.textMute} strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div style={{ fontSize:12, fontWeight:600, color: dragOver ? theme.primary : theme.textSoft }}>
                                        {dragOver ? tr('leaveRequest.upload.dropToUpload') : <><span>{tr('leaveRequest.upload.dropFileHereOr')} </span><span style={{ color:theme.primary, textDecoration:'underline' }}>{tr('leaveRequest.upload.browse')}</span></>}
                                    </div>
                                    <div style={{ fontSize:10, color:theme.textMute, marginTop:4 }}>{tr('leaveRequest.upload.fileHint')}</div>
                                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
                                </div>
                            ) : (
                                <div style={{ display:'flex', alignItems:'center', gap:12, background: dark ? 'rgba(16,185,129,0.08)' : '#fff', border:`1.5px solid ${dark ? 'rgba(16,185,129,0.25)' : '#d1fae5'}`, borderRadius:12, padding:'10px 14px' }}>
                                    <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: docFile.type==='application/pdf' ? (dark ? 'rgba(245,158,11,0.15)' : '#fef3c7') : (dark ? 'rgba(37,99,235,0.15)' : '#dbeafe') }}>
                                        <span style={{ fontSize:18 }}>{docFile.type==='application/pdf' ? '📄' : '🖼️'}</span>
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ fontSize:12, fontWeight:700, color:theme.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{docFile.name}</div>
                                        <div style={{ fontSize:10, color: dark ? '#34d399' : '#059669', fontWeight:600, marginTop:2 }}>{tr('leaveRequest.upload.ready')} · {(docFile.size/1024).toFixed(1)} KB</div>
                                    </div>
                                    <button onClick={() => { setDocFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                        style={{ background:'none', border:`1px solid ${dark ? 'rgba(248,113,113,0.3)' : '#fca5a5'}`, borderRadius:8, width:28, height:28, cursor:'pointer', color:theme.danger, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                                </div>
                            )}
                            {errors.document && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.document}</span>}
                        </div>
                    )}

                    {/* Reason */}
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        <label style={lbl}>Reason <span style={{ color:theme.danger }}>*</span></label>
                        <textarea value={form.note} onChange={e => set('note', e.target.value)}
                            placeholder={tr('leaveRequest.placeholders.reason')}
                            style={{ ...inp(errors.note), height:80, resize:'vertical' }} />
                        {errors.note && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.note}</span>}
                    </div>

                    {/* Approver */}
                    {!['admin'].includes(roleName) && approvers.length > 0 && (
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            <label style={lbl}>{tr('leaveRequest.fields.approver')} <span style={{ color:theme.danger }}>*</span></label>
                            <PremiumDropdown
                                options={approverOptions} value={form.approver_id}
                                onChange={v => set('approver_id', v)}
                                placeholder={tr('leaveRequest.placeholders.selectApprover')}
                                theme={theme} dark={dark} width="100%"
                            />
                            {errors.approver_id && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.approver_id}</span>}
                        </div>
                    )}
                    {!['admin'].includes(roleName) && approvers.length === 0 && (
                        <div style={{ background: dark ? 'rgba(245,158,11,0.1)' : '#fff7ed', border:`1px solid ${dark ? 'rgba(245,158,11,0.25)' : '#fed7aa'}`, borderRadius:12, padding:'12px 16px' }}>
                            <div style={{ fontSize:12, fontWeight:700, color: dark ? '#f59e0b' : '#c2410c' }}>⚠ No approver available</div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:4 }}>No admin found for your branch. Please contact HR.</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 24px', borderTop:`1px solid ${theme.border}`, flexShrink:0, background: dark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
                    <button onClick={onClose}
                        style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border:`1px solid ${theme.border}`, borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', color:theme.textSoft }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        style={{ background:`linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`, border:'none', borderRadius:12, padding:'10px 24px', fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', color:'#fff', opacity:saving?0.65:1, display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 24px ${theme.primary}44`, transition:'all 0.15s' }}>
                        {saving && <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />}
                        {saving ? tr('leaveRequest.actions.submitting') : tr('leaveRequest.actions.submitRequest')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function fmtHrs(h) {
    const n = parseFloat(h);
    if (!n || isNaN(n)) return '0hr';
    const hrs = Math.floor(n);
    const mins = Math.round((n - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}hr`;
    return `${hrs}hr ${mins}m`;
}

// ─── ✨ Mini Calendar ─────────────────────────────────────────
function MiniCalendar({ month, year, attendanceMap, calLeaveDateMap, publicHolidays, otDateSet, dark, theme }) {
    const [selectedDate, setSelectedDate] = useState(null);

    // ── Local nav state — filter month/year နဲ့ သပ်သပ် ──
    const [calMonth,  setCalMonth]  = useState(month);
    const [calYear,   setCalYear]   = useState(year);
    const [loading,   setLoading]   = useState(false);

    // ── Calendar data — initially from Inertia props, updates via API ──
    const [calData, setCalData] = useState({
        attendanceMap:   attendanceMap,
        calLeaveDateMap: calLeaveDateMap,
        publicHolidays:  publicHolidays,
        otDateSet:       otDateSet,
    });

    // filter month/year ပြောင်းရင် calendar ကို sync + data refresh
    const prevFilterRef = useRef({ month, year });
    useEffect(() => {
        const prev = prevFilterRef.current;
        if (prev.month !== month || prev.year !== year) {
            prevFilterRef.current = { month, year };
            navigateTo(month, year);
        }
    }, [month, year]);

    // Inertia props ပြောင်းရင် (initial load) calData sync
    useEffect(() => {
        if (calMonth === month && calYear === year) {
            setCalData({ attendanceMap, calLeaveDateMap, publicHolidays, otDateSet });
        }
    }, [attendanceMap, calLeaveDateMap, publicHolidays, otDateSet]);

    async function navigateTo(m, y) {
        setCalMonth(m);
        setCalYear(y);
        setSelectedDate(null);

        // filter month/year နဲ့ တူရင် Inertia props ကနေ ယူ (API မခေါ်)
        if (m === month && y === year) {
            setCalData({ attendanceMap, calLeaveDateMap, publicHolidays, otDateSet });
            return;
        }

        // တခြား month ဆိုရင် API fetch
        setLoading(true);
        try {
            const res = await window.apiFetch(
                `/payroll/leaves/calendar-data?month=${m}&year=${y}`
            );
            if (res.ok) {
                const data = await res.json();
                setCalData({
                    attendanceMap:   data.attendanceMap   || {},
                    calLeaveDateMap: data.calLeaveDateMap || {},
                    publicHolidays:  data.publicHolidays  || [],
                    otDateSet:       data.otDateSet       || [],
                });
            }
        } catch (err) {
            console.error('Calendar data fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }

    function prevMonth() {
        const m = calMonth === 1  ? 12        : calMonth - 1;
        const y = calMonth === 1  ? calYear - 1 : calYear;
        navigateTo(m, y);
    }
    function nextMonth() {
        const m = calMonth === 12 ? 1         : calMonth + 1;
        const y = calMonth === 12 ? calYear + 1 : calYear;
        navigateTo(m, y);
    }

    const today = new Date().toISOString().split('T')[0];

    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const firstDow    = new Date(calYear, calMonth - 1, 1).getDay();

    const holidayMap = useMemo(() => {
        const m = {};
        (calData.publicHolidays || []).forEach(h => { m[h.date] = h.name; });
        return m;
    }, [calData.publicHolidays]);

    function getDayStyle(dateStr, isWeekend) {
        const holiday = holidayMap[dateStr];
        const leave   = calData.calLeaveDateMap?.[dateStr];
        const att     = calData.attendanceMap?.[dateStr];
        const isSel   = dateStr === selectedDate;
        const isTod   = dateStr === today;

        let bg = 'transparent', color = theme.text, outline = 'none';

        if (isSel) {
            bg = theme.primary; color = '#fff';
        } else if (holiday) {
            bg = dark ? 'rgba(217,119,6,0.22)' : '#fef3c7'; color = dark ? '#fbbf24' : '#b45309';
        } else if (leave) {
            bg = dark ? 'rgba(124,58,237,0.22)' : '#ede9fe'; color = dark ? '#a78bfa' : '#6d28d9';
        } else if (att?.status === 'present' || att?.status === 'late') {
            bg = dark ? 'rgba(5,150,105,0.22)' : '#d1fae5'; color = dark ? '#34d399' : '#065f46';
        } else if (att?.status === 'absent') {
            bg = dark ? 'rgba(248,113,113,0.18)' : '#fee2e2'; color = dark ? '#f87171' : '#b91c1c';
        } else if (isWeekend) {
            color = theme.textMute;
        }
        if (isTod && !isSel) outline = `2px solid ${theme.primary}`;
        return { bg, color, outline };
    }

    // အသစ်
    const detail = useMemo(() => {
        if (!selectedDate) return null;
        const otInfo = (calData.otDateSet || []).find(o => o.date === selectedDate) || null;
        return {
            att:    calData.attendanceMap?.[selectedDate],
            leaves: calData.calLeaveDateMap?.[selectedDate] || [],
            holiday: holidayMap[selectedDate],
            otInfo,
            date:   selectedDate,
        };
    }, [selectedDate, calData, holidayMap]);

    return (
        <div style={{ width:220, flexShrink:0, background: dark ? 'rgba(255,255,255,0.03)' : theme.calBg, borderLeft:`1px solid ${theme.border}`, display:'flex', flexDirection:'column' }}>

            {/* Calendar grid */}
            <div style={{ padding:'14px 12px 8px' }}>

                {/* Month nav header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <button onClick={prevMonth} style={{ width:22, height:22, borderRadius:5, border:`1px solid ${theme.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:theme.textMute, transition:'all 0.12s', padding:0 }}
                        onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; e.currentTarget.style.color = theme.text; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMute; }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span style={{ fontSize:12, fontWeight:700, color:theme.textSoft, display:'flex', alignItems:'center', gap:5 }}>
                        {loading && (
                            <span style={{ width:10, height:10, border:`1.5px solid ${theme.border}`, borderTopColor:theme.primary, borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite', flexShrink:0 }} />
                        )}
                        {MONTHS[calMonth - 1]} {calYear}
                    </span>
                    <button onClick={nextMonth} style={{ width:22, height:22, borderRadius:5, border:`1px solid ${theme.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:theme.textMute, transition:'all 0.12s', padding:0 }}
                        onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; e.currentTarget.style.color = theme.text; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMute; }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>

                {/* Day headers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
                    {DAY_LABELS.map(d => (
                        <div key={d} style={{ fontSize:9, fontWeight:700, color:theme.textMute, textAlign:'center', padding:'2px 0' }}>{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                    {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day     = i + 1;
                        const dateStr = `${calYear}-${pad2(calMonth)}-${pad2(day)}`;
                        const dow     = new Date(calYear, calMonth - 1, day).getDay();
                        const isWknd  = dow === 0 || dow === 6;
                        const hasOT = (calData.otDateSet || []).some(o => o.date === dateStr);
                        const isSel   = dateStr === selectedDate;
                        const { bg, color, outline } = getDayStyle(dateStr, isWknd);
                        return (
                            <div key={day}
                                onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
                                style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:5, cursor:'pointer', background:bg, color, outline, outlineOffset:'-1px', fontSize:10, fontWeight: isSel ? 700 : 500, position:'relative', transition:'all 0.12s' }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.opacity = '0.75'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                            >
                                {day}
                                {hasOT && (
                                    <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:3, height:3, borderRadius:'50%', background: isSel ? '#fff' : (dark ? '#f59e0b' : '#d97706') }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:'4px 10px' }}>
                    {[
                        { color: dark?'#34d399':'#065f46', bg: dark?'rgba(5,150,105,0.22)':'#d1fae5', label:'Attended' },
                        { color: dark?'#a78bfa':'#6d28d9', bg: dark?'rgba(124,58,237,0.22)':'#ede9fe', label:'Leave' },
                        { color: dark?'#fbbf24':'#b45309', bg: dark?'rgba(217,119,6,0.22)':'#fef3c7',  label:'Holiday' },
                        { color: dark?'#f59e0b':'#d97706', dot:true, label:'OT' },
                    ].map(l => (
                        <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                            {l.dot
                                ? <div style={{ width:6, height:6, borderRadius:'50%', background:l.color, flexShrink:0 }} />
                                : <div style={{ width:10, height:10, borderRadius:3, background:l.bg, border:`1px solid ${l.color}33`, flexShrink:0 }} />
                            }
                            <span style={{ fontSize:9, color:theme.textMute }}>{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Day detail */}
            <div style={{ flex:1, borderTop:`1px solid ${theme.border}`, padding:'12px', minHeight:120 }}>
                {!detail ? (
                    <div style={{ fontSize:11, color:theme.textMute, textAlign:'center', marginTop:16, lineHeight:1.6 }}>
                        Click a date<br/>to see details
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        <div>
                            <div style={{ fontSize:13, fontWeight:700, color:theme.text }}>
                                {new Date(detail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
                            </div>
                            {detail.date === today && (
                                <span style={{ fontSize:9, fontWeight:700, background:theme.primarySoft, color:theme.primary, borderRadius:4, padding:'1px 6px' }}>Today</span>
                            )}
                        </div>
                        {detail.holiday && (
                            <div style={{ display:'flex', alignItems:'center', gap:6, background: dark?'rgba(217,119,6,0.15)':'#fef3c7', borderRadius:6, padding:'5px 8px' }}>
                                <div style={{ width:6, height:6, borderRadius:'50%', background: dark?'#fbbf24':'#d97706', flexShrink:0 }} />
                                <span style={{ fontSize:10, fontWeight:600, color: dark?'#fbbf24':'#92400e' }}>{detail.holiday}</span>
                            </div>
                        )}
                        {detail.att && (
                            <div style={{ fontSize:10, color:theme.textSoft, display:'flex', flexDirection:'column', gap:3 }}>
                                <div style={{ display:'flex', justifyContent:'space-between' }}>
                                    <span style={{ color:theme.textMute }}>Status</span>
                                    <span style={{ fontWeight:600, color: detail.att.status==='present'?(dark?'#34d399':'#059669'):detail.att.status==='late'?(dark?'#fbbf24':'#d97706'):(dark?'#f87171':'#dc2626') }}>
                                        {detail.att.status}
                                    </span>
                                </div>
                                {detail.att.check_in && (
                                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:theme.textMute }}>In</span>
                                        <span style={{ fontWeight:600, color:theme.text }}>{detail.att.check_in}</span>
                                    </div>
                                )}
                                {detail.att.check_out && (
                                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:theme.textMute }}>Out</span>
                                        <span style={{ fontWeight:600, color:theme.text }}>{detail.att.check_out}</span>
                                    </div>
                                )}
                                {detail.att.work_hours && (
                                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:theme.textMute }}>Hours</span>
                                        <span style={{ fontWeight:600, color: dark?'#34d399':'#059669' }}>{detail.att.work_hours}h</span>
                                    </div>
                                )}
                                {detail.att.late_minutes > 0 && (
                                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                                        <span style={{ color:theme.textMute }}>Late</span>
                                        <span style={{ fontWeight:600, color: dark?'#fbbf24':'#d97706' }}>{detail.att.late_minutes}m</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {detail.leaves.length > 0 && (
                            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                {detail.leaves.map((lv, i) => (
                                    <div key={i} style={{ fontSize:10, fontWeight:600, borderRadius:5, padding:'3px 7px', background: dark?'rgba(124,58,237,0.2)':'#ede9fe', color: dark?'#a78bfa':'#6d28d9', display:'flex', alignItems:'center', gap:4 }}>
                                        <span>{lv.type}</span>
                                        {lv.is_half && <span style={{ opacity:0.7 }}>· {lv.day_type==='half_day_am'?'AM':'PM'}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {detail.otInfo && (
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:theme.textSoft }}>
                                <span style={{ color:theme.textMute }}>OT</span>
                                <span style={{ display:'flex', gap:6, alignItems:'center' }}>
                                    {detail.otInfo.status !== 'approved' && (
                                        <span style={{ fontWeight:700, fontSize:9, borderRadius:99, padding:'1px 6px',
                                            background: detail.otInfo.status === 'rejected' ? (dark?'rgba(248,113,113,0.18)':'#fee2e2') : (dark?'rgba(245,158,11,0.18)':'#fef3c7'),
                                            color: detail.otInfo.status === 'rejected' ? (dark?'#f87171':'#dc2626') : (dark?'#fbbf24':'#d97706')
                                        }}>
                                            {detail.otInfo.status.charAt(0).toUpperCase() + detail.otInfo.status.slice(1)}
                                        </span>
                                    )}
                                    <span style={{ fontWeight:600, color:theme.text }}>{fmtHrs(detail.otInfo.hours)}</span>
                                </span>
                            </div>
                        )}
                        {!detail.att && !detail.holiday && detail.leaves.length === 0 && !detail.otInfo && (
                            <div style={{ fontSize:10, color:theme.textMute }}>No records for this day.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────
export default function LeaveIndex({
    requests,
    leaveBalances,
    leavePolicies,
    employees,
    filters,
    selectedMonth,
    selectedYear,
    // ✨ Calendar props အသစ်
    attendanceMap   = {},
    calLeaveDateMap = {},
    publicHolidays  = [],
    otDateSet       = [],
}) {
    const { t: tr } = useTranslation();
    const { auth }  = usePage().props;
    const user      = auth?.user;
    const roleName  = user?.role?.name || 'employee';
    const dark      = useReactiveTheme();
    const theme     = useMemo(() => getTheme(dark), [dark]);

    const canApprove = ['management','hr','admin'].includes(roleName);
    const canViewAll = ['hr','admin','management'].includes(roleName);

    const LEAVE_TYPE_CONFIG = useMemo(() => buildLeaveTypeConfig(leavePolicies), [leavePolicies]);

    const [mainTab,       setMainTab]       = useState('my');
    const [month,         setMonth]         = useState(selectedMonth || new Date().getMonth() + 1);
    const [year,          setYear]          = useState(selectedYear  || new Date().getFullYear());
    const [statusFilter,  setStatusFilter]  = useState(filters?.status || '');
    const [showModal,     setShowModal]     = useState(false);
    const [saving,        setSaving]        = useState(false);
    const [confirmModal,  setConfirmModal]  = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    function handleMonthYearFilter(m, y) { router.get('/payroll/leaves', { month:m, year:y, status:statusFilter }); }
    function handleStatusFilter(s) { setStatusFilter(s); router.get('/payroll/leaves', { status:s, month, year }, { preserveState:true }); }

    function handleApprove(req) {
        setActionLoading(true);
        router.patch(`/payroll/leaves/${req.id}/approve`, {}, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError: (errors) => {
                setActionLoading(false);
                setConfirmModal(null);
                const msg = errors?.message || tr('leaveRequest.messages.requestNoLongerExists');
                window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'error' } }));
            },
        });
    }

    function handleReject(req) {
        setActionLoading(true);
        router.patch(`/payroll/leaves/${req.id}/reject`, {}, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError: (errors) => {
                setActionLoading(false);
                setConfirmModal(null);
                const msg = errors?.message || tr('leaveRequest.messages.requestNoLongerExists');
                window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'error' } }));
            },
        });
    }

    function handleDelete(req) {
        setActionLoading(true);
        router.delete(`/payroll/leaves/${req.id}`, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError: () => {
                setActionLoading(false);
                setConfirmModal(null);
                window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: tr('leaveRequest.messages.requestDeleteFailed'), type: 'error' } }));
            },
        });
    }

    const policyMap  = useMemo(() => { const m={}; leavePolicies.forEach(p => m[p.leave_type]=p); return m; }, [leavePolicies]);
    const balanceMap = useMemo(() => { const m={}; leaveBalances.forEach(b => m[b.leave_type]=b); return m; }, [leaveBalances]);

    const myRequests   = requests.data.filter(r => r.user_id === user?.id);
    const pendingForMe = requests.data.filter(r => r.approver_id === user?.id && r.user_id !== user?.id);
    const pendingCount = pendingForMe.filter(r => r.status === 'pending').length;

    let displayList = [];
    if (mainTab === 'my')             displayList = myRequests;
    else if (mainTab === 'approvals') displayList = pendingForMe;
    else                              displayList = requests.data;

    const monthOpts  = MONTHS.map((m, i) => ({ value:i+1, label:tr(`leaveRequest.months.${m}`) }));
    const yearOpts   = [2024,2025,2026,2027].map(y => ({ value:y, label:String(y) }));
    const statusOpts = [
        { value:'',         label:tr('leaveRequest.filters.allStatus') },
        { value:'pending',  label:`⏳ ${tr('leaveRequest.status.pending')}`  },
        { value:'approved', label:`✓ ${tr('leaveRequest.status.approved')}` },
        { value:'rejected', label:`✕ ${tr('leaveRequest.status.rejected')}` },
    ];

    const tabs = [
        { key:'my',        label:tr('leaveRequest.tabs.myRequests'),      count: myRequests.length,   alert: false },
        ...(canApprove ? [{ key:'approvals', label:tr('leaveRequest.tabs.pendingApprovals'), count: pendingCount,    alert: pendingCount > 0 }] : []),
        ...(canViewAll  ? [{ key:'all',      label:tr('leaveRequest.tabs.allRequests'),      count: requests.total,  alert: false }] : []),
    ];

    return (
        <AppLayout title={tr('leaveRequest.pageTitle')}>
            <style>{`
                @keyframes popIn   { from { opacity:0; transform:scale(0.96); }     to { opacity:1; transform:scale(1); } }
                @keyframes spin    { to   { transform:rotate(360deg); } }
                @keyframes dropIn  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
                .hide-scrollbar::-webkit-scrollbar { display:none; }
                .hide-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                {/* ── Leave Balance Cards ── */}
                {leavePolicies.length > 0 && (
                    <LeaveBalanceCards leavePolicies={leavePolicies} leaveTypeConfig={LEAVE_TYPE_CONFIG} balanceMap={balanceMap} dark={dark} theme={theme} tr={tr} />
                )}

                {/* ── Controls row ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <PremiumDropdown options={monthOpts} value={month}
                            onChange={v => { const m = Number(v); setMonth(m); handleMonthYearFilter(m, year); }}
                            theme={theme} dark={dark} width={145} />
                        <PremiumDropdown options={yearOpts} value={year}
                            onChange={v => { const y = Number(v); setYear(y); handleMonthYearFilter(month, y); }}
                            theme={theme} dark={dark} width={110} />
                        <PremiumDropdown options={statusOpts} value={statusFilter}
                            onChange={v => handleStatusFilter(v)}
                            theme={theme} dark={dark} width={150} />
                    </div>
                    <button onClick={() => setShowModal(true)}
                        style={{ background:`linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`, color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 22px ${theme.primary}44`, transition:'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        {tr('leaveRequest.actions.requestLeave')}
                    </button>
                </div>

                {/* ── ✨ Main panel: list (left) + calendar (right) ── */}
                <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius:18, border:`1px solid ${theme.border}`, boxShadow:theme.shadowSoft, overflow:'hidden', display:'flex',minHeight: 320, }}>

                    {/* Left: tabs + list */}
                    <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>

                        {/* Tab bar */}
                        <div style={{ display:'flex', borderBottom:`1px solid ${theme.border}`, padding:'0 4px', overflowX:'auto' }} className="hide-scrollbar">
                            {tabs.map(tab => {
                                const isActive = mainTab === tab.key;
                                return (
                                    <button key={tab.key} onClick={() => setMainTab(tab.key)}
                                        style={{ padding:'14px 18px', fontSize:13, fontWeight: isActive ? 800 : 500, color: isActive ? theme.primary : theme.textMute, background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap', borderBottom: isActive ? `2.5px solid ${theme.primary}` : '2.5px solid transparent', display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}>
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span style={{ fontSize:10, fontWeight:800, borderRadius:99, padding:'2px 8px', background: tab.alert ? (dark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : (isActive ? theme.primarySoft : (dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6')), color: tab.alert ? theme.warning : (isActive ? theme.primary : theme.textMute) }}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Request list */}
                        {displayList.length === 0 ? (
                            <div style={{ padding:'56px 24px', textAlign:'center' }}>
                                <div style={{ fontSize:36, marginBottom:12 }}>{mainTab === 'approvals' ? '🎉' : '📭'}</div>
                                <div style={{ fontSize:14, fontWeight:600, color:theme.textSoft, marginBottom:4 }}>
                                    {mainTab === 'approvals' ? tr('leaveRequest.empty.noPendingApprovals') : tr('leaveRequest.empty.noRequestsFound')}
                                </div>
                                <div style={{ fontSize:12, color:theme.textMute }}>
                                    {mainTab === 'approvals' ? tr('leaveRequest.empty.allCaughtUp') : tr('leaveRequest.empty.clickToSubmit')}
                                </div>
                            </div>
                        ) : (
                            displayList.map((req, idx) => (
                                <RequestRow key={req.id} req={req} leaveTypeConfig={LEAVE_TYPE_CONFIG}
                                    dark={dark} theme={theme} canApprove={canApprove} userId={user?.id}
                                    onApprove={r => setConfirmModal({ type:'approve', request:r })}
                                    onReject={r  => setConfirmModal({ type:'reject',  request:r })}
                                    onDelete={r  => setConfirmModal({ type:'delete',  request:r })}
                                    isLast={idx === displayList.length - 1} tr={tr} />
                            ))
                        )}

                        {/* Pagination */}
                        {mainTab === 'all' && requests.last_page > 1 && (
                            <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'16px 20px', borderTop:`1px solid ${theme.border}` }}>
                                {Array.from({ length:requests.last_page }, (_,i) => i+1).map(page => {
                                    const isActive = requests.current_page === page;
                                    return (
                                        <button key={page} onClick={() => router.get('/payroll/leaves', { page, status:statusFilter, month, year })}
                                            style={{ width:34, height:34, borderRadius:10, border:`1px solid ${isActive ? theme.primary : theme.border}`, background: isActive ? theme.primary : 'transparent', color: isActive ? '#fff' : theme.textSoft, fontWeight:600, cursor:'pointer', fontSize:13, transition:'all 0.15s' }}>
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ✨ Right: MiniCalendar — always visible */}
                    <MiniCalendar
                        month={month}
                        year={year}
                        attendanceMap={attendanceMap}
                        calLeaveDateMap={calLeaveDateMap}
                        publicHolidays={publicHolidays}
                        otDateSet={otDateSet}
                        dark={dark}
                        theme={theme}
                    />
                </div>
            </div>

            {/* Modals */}
            {showModal && (
                <LeaveRequestModal saving={saving} setSaving={setSaving}
                    policyMap={policyMap} balanceMap={balanceMap}
                    leaveTypeConfig={LEAVE_TYPE_CONFIG} approvers={employees}
                    roleName={roleName} dark={dark} theme={theme}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => setShowModal(false)}
                    tr={tr}
                    onError={msg => window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'error' } }))}
                />
            )}
            {confirmModal && (
                <ConfirmModal type={confirmModal.type} request={confirmModal.request}
                    loading={actionLoading} leaveTypeConfig={LEAVE_TYPE_CONFIG}
                    dark={dark} theme={theme}
                    onCancel={() => setConfirmModal(null)}
                    onApprove={() => handleApprove(confirmModal.request)}
                    onReject={()  => handleReject(confirmModal.request)}
                    onDelete={()  => handleDelete(confirmModal.request)}
                    tr={tr} />
            )}
        </AppLayout>
    );
}