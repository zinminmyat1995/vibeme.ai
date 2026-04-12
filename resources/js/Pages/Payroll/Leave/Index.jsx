import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '@/Layouts/AppLayout';
import { usePage, router } from '@inertiajs/react';

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
    pending:  { label:'Pending',  color:'#d97706', bg:'#fef3c7', bgDark:'rgba(217,119,6,0.18)',  icon:'⏳' },
    approved: { label:'Approved', color:'#059669', bg:'#d1fae5', bgDark:'rgba(5,150,105,0.18)', icon:'✓' },
    rejected: { label:'Rejected', color:'#dc2626', bg:'#fee2e2', bgDark:'rgba(220,38,38,0.18)', icon:'✕' },
};

const DAY_TYPE_CONFIG = {
    full_day:    { label:'Full Day',    color:'#374151', bg:'#f3f4f6', bgDark:'rgba(55,65,81,0.3)'   },
    half_day_am: { label:'AM Half Day', color:'#2563eb', bg:'#dbeafe', bgDark:'rgba(37,99,235,0.2)'  },
    half_day_pm: { label:'PM Half Day', color:'#7c3aed', bg:'#ede9fe', bgDark:'rgba(124,58,237,0.2)' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

// ─── Premium Portal Dropdown ──────────────────────────────────
function PremiumDropdown({ options, value, onChange, placeholder = 'Select...', theme, dark, disabled = false, width = 'auto' }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({ top:0, left:0, width:0 });
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
        if (rect) setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
        setOpen(v => !v);
    }

    return (
        <>
            <button ref={triggerRef} type="button" onClick={handleOpen}
                style={{ width, height:44, padding:'0 14px', borderRadius:12,
                    border:`1.5px solid ${open ? theme.inputBorderFocus : theme.inputBorder}`,
                    background: dark
                        ? 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
                    color: selected ? theme.text : theme.textMute,
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize:13, fontWeight: selected ? 600 : 400,
                    boxShadow: open ? `0 0 0 3px ${theme.primary}22` : 'none',
                    transition:'all 0.18s', opacity: disabled ? 0.5 : 1, outline:'none' }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ flexShrink:0, transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            {open && createPortal(
                <div ref={menuRef} className="hide-scrollbar"
                    style={{ position:'absolute', top:pos.top, left:pos.left, width:pos.width,
                        background: dark ? '#0d1b38' : '#fff',
                        border:`1px solid ${theme.borderStrong}`,
                        borderRadius:14,
                        boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 40px rgba(15,23,42,0.14)',
                        zIndex:99999, overflow:'hidden', animation:'dropIn 0.18s ease',
                        maxHeight:240, overflowY:'auto' }}>
                    {options.filter(o => !o.disabled).map(opt => {
                        const isSel = String(opt.value) === String(value);
                        return (
                            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{ padding:'10px 14px', fontSize:13, fontWeight: isSel ? 700 : 500,
                                    color: isSel ? '#fff' : theme.text,
                                    background: isSel ? theme.primary : 'transparent',
                                    cursor:'pointer', transition:'all 0.12s' }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
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

// ─── Leave Balance Cards (top section) ───────────────────────
function LeaveBalanceCards({ leavePolicies, leaveTypeConfig, balanceMap, dark, theme }) {
    return (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(195px,1fr))', gap:12 }}>
            {leavePolicies.map((pol) => {
                const cfg       = leaveTypeConfig[pol.leave_type] || COLOR_POOL[0];
                const bal       = balanceMap[pol.leave_type];
                const remaining = bal?.remaining_days ?? pol.days_per_year;
                const used      = bal?.used_days ?? 0;
                const total     = pol.days_per_year;
                const pct       = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

                return (
                    <div key={pol.id} style={{
                        background: dark ? 'rgba(255,255,255,0.04)' : '#fff',
                        borderRadius:16, border: dark ? `1px solid rgba(255,255,255,0.08)` : `1px solid ${cfg.border}`,
                        padding:'18px 20px',
                        boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                        display:'flex', flexDirection:'column', gap:12, position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:cfg.color, borderRadius:'16px 16px 0 0' }} />
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <div style={{ minWidth:0, flex:1 }}>
                                <div style={{ fontSize:10, fontWeight:800, color:cfg.color, textTransform:'uppercase', letterSpacing:'0.7px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                    {pol.leave_type}
                                </div>
                                <div style={{ fontSize:10, color:theme.textMute, marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                                    <span style={{ width:5, height:5, borderRadius:'50%', background: pol.is_paid ? '#059669' : '#d97706', display:'inline-block' }} />
                                    {pol.is_paid ? 'Paid Leave' : 'Unpaid'}
                                </div>
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                                <div style={{ fontSize:28, fontWeight:900, color:theme.text, lineHeight:1, letterSpacing:'-1.5px' }}>
                                    {formatNum(remaining)}
                                </div>
                                <div style={{ fontSize:10, color:theme.textMute, marginTop:2 }}>/ {formatNum(total)} days</div>
                            </div>
                        </div>
                        <div style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', borderRadius:99, height:5, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:99, background:`linear-gradient(90deg, ${cfg.color}bb, ${cfg.color})`, width:`${pct}%`, transition:'width 0.5s ease' }} />
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                            <span style={{ color:theme.textMute }}>Used <span style={{ color:theme.textSoft, fontWeight:700 }}>{formatNum(used)}</span></span>
                            <span style={{ color:theme.textMute }}>Left <span style={{ color:cfg.color, fontWeight:800 }}>{formatNum(remaining)}</span></span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Request Row ──────────────────────────────────────────────
function RequestRow({ req, leaveTypeConfig, dark, theme, canApprove, userId, onApprove, onReject, isLast }) {
    const typeCfg    = leaveTypeConfig[req.leave_type] || COLOR_POOL[0];
    const statusCfg  = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
    const dayTypeCfg = DAY_TYPE_CONFIG[req.day_type || 'full_day'];
    const isMyRequest    = req.user_id === userId;
    const isAssignedToMe = req.approver_id === userId;
    const showActions    = canApprove && req.status === 'pending' && isAssignedToMe && !isMyRequest;

    const statusBg  = dark ? statusCfg.bgDark  : statusCfg.bg;
    const dayTypeBg = dark ? dayTypeCfg.bgDark : dayTypeCfg.bg;
    const typeBg    = dark ? typeCfg.bgDark    : typeCfg.bg;

    return (
        <div style={{ display:'flex', alignItems:'stretch', borderBottom: isLast ? 'none' : `1px solid ${theme.border}` }}>
            <div style={{ width:4, background:typeCfg.color, flexShrink:0 }} />
            <div style={{ display:'flex', flex:1, alignItems:'flex-start', gap:14, padding:'18px 20px', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:8 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:theme.text }}>{req.leave_type}</span>
                        <span style={{ fontSize:10, fontWeight:700, background:statusBg, color:statusCfg.color, borderRadius:99, padding:'2px 9px', display:'inline-flex', alignItems:'center', gap:3 }}>
                            {statusCfg.icon} {statusCfg.label}
                        </span>
                        <span style={{ fontSize:10, fontWeight:600, background:dayTypeBg, color:dayTypeCfg.color, borderRadius:99, padding:'2px 9px' }}>
                            {dayTypeCfg.label}
                        </span>
                    </div>

                    {req.user && !isMyRequest && (
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            {req.user.avatar_url
                                ? <img src={`/storage/${req.user.avatar_url}`} alt={req.user.name}
                                    style={{ width:30, height:30, borderRadius:10, objectFit:'cover', flexShrink:0, border:`1.5px solid ${theme.border}` }} />
                                : <div style={{ width:30, height:30, borderRadius:10, flexShrink:0,
                                    background:typeBg, border:`1.5px solid ${dark ? 'transparent' : typeCfg.border}`,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:12, fontWeight:800, color:typeCfg.color }}>
                                    {req.user.name?.charAt(0).toUpperCase()}
                                  </div>
                            }
                            <div>
                                <div style={{ fontSize:13, fontWeight:700, color:theme.text }}>{req.user.name}</div>
                                {(req.user.position || req.user.department) && (
                                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:1 }}>
                                        {req.user.position && <span style={{ fontSize:10, fontWeight:600, color:theme.textSoft }}>{req.user.position}</span>}
                                        {req.user.position && req.user.department && <span style={{ color:theme.border, fontSize:10 }}>·</span>}
                                        {req.user.department && <span style={{ fontSize:10, fontWeight:500, color:theme.secondary }}>{req.user.department}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: req.note ? 8 : 0 }}>
                        <span style={{ fontSize:12, color:theme.textSoft, fontWeight:600 }}>{formatDate(req.start_date)}</span>
                        {req.day_type === 'full_day' && req.start_date !== req.end_date && (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                <span style={{ fontSize:12, color:theme.textSoft, fontWeight:600 }}>{formatDate(req.end_date)}</span>
                            </>
                        )}
                        <span style={{ fontSize:11, fontWeight:700, color:typeCfg.color,
                            background:typeBg, borderRadius:7, padding:'2px 9px',
                            border:`1px solid ${dark ? 'transparent' : typeCfg.border}` }}>
                            {formatNum(req.total_days)} {req.total_days === 0.5 ? 'half day' : req.total_days == 1 ? 'day' : 'days'}
                        </span>
                    </div>

                    {req.note && (
                        <div style={{ display:'flex', gap:8, background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
                            border:`1px solid ${theme.border}`, borderRadius:10, padding:'8px 12px' }}>
                            <span style={{ fontSize:10, fontWeight:800, color:theme.textMute, flexShrink:0, marginTop:1, textTransform:'uppercase', letterSpacing:'0.4px' }}>Reason</span>
                            <span style={{ fontSize:12, color:theme.textSoft, lineHeight:1.5 }}>{req.note}</span>
                        </div>
                    )}
                </div>

                <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    {showActions && (
                        <div style={{ display:'flex', gap:7 }}>
                            <button onClick={() => onApprove(req)} style={{
                                background: dark ? 'rgba(16,185,129,0.14)' : '#d1fae5',
                                border:`1px solid ${dark ? 'rgba(16,185,129,0.3)' : '#6ee7b7'}`,
                                borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
                                color: dark ? '#34d399' : '#059669', transition:'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(16,185,129,0.25)' : '#a7f3d0'}
                                onMouseLeave={e => e.currentTarget.style.background = dark ? 'rgba(16,185,129,0.14)' : '#d1fae5'}>
                                ✓ Approve
                            </button>
                            <button onClick={() => onReject(req)} style={{
                                background: dark ? 'rgba(248,113,113,0.12)' : '#fee2e2',
                                border:`1px solid ${dark ? 'rgba(248,113,113,0.25)' : '#fca5a5'}`,
                                borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
                                color: dark ? '#f87171' : '#dc2626', transition:'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(248,113,113,0.22)' : '#fecaca'}
                                onMouseLeave={e => e.currentTarget.style.background = dark ? 'rgba(248,113,113,0.12)' : '#fee2e2'}>
                                ✕ Reject
                            </button>
                        </div>
                    )}
                    {req.status === 'approved' && <span style={{ fontSize:12, color: dark ? '#34d399' : '#059669', fontWeight:700 }}>✓ Approved</span>}
                    {req.status === 'rejected' && <span style={{ fontSize:12, color: dark ? '#f87171' : '#dc2626', fontWeight:700 }}>✕ Rejected</span>}
                    {req.status === 'pending' && !showActions && req.approver && (
                        <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:10, color:theme.textMute, fontWeight:500 }}>Awaiting</div>
                            <div style={{ fontSize:11, color:theme.secondary, fontWeight:800 }}>{req.approver.name}</div>
                        </div>
                    )}
                    {req.status === 'pending' && !showActions && !req.approver && isMyRequest && (
                        <span style={{ fontSize:11, color:theme.textMute, fontStyle:'italic' }}>Pending review</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────
function ConfirmModal({ type, request, loading, leaveTypeConfig, dark, theme, onCancel, onApprove, onReject }) {
    const typeCfg    = leaveTypeConfig[request.leave_type] || COLOR_POOL[0];
    const dayTypeCfg = DAY_TYPE_CONFIG[request.day_type || 'full_day'];
    const isApprove  = type === 'approve';
    const accentColor = isApprove ? (dark ? '#34d399' : '#059669') : (dark ? '#f87171' : '#dc2626');
    const accentBg    = isApprove ? (dark ? 'rgba(16,185,129,0.15)' : '#d1fae5') : (dark ? 'rgba(248,113,113,0.14)' : '#fee2e2');
    const typeBg      = dark ? typeCfg.bgDark : typeCfg.bg;
    const dayBg       = dark ? dayTypeCfg.bgDark : dayTypeCfg.bg;

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:9000, padding:20 }}>
            <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius:22, width:'100%', maxWidth:420,
                boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 24px 60px rgba(15,23,42,0.18)',
                overflow:'hidden', border:`1px solid ${theme.border}`, animation:'popIn 0.22s ease' }}>
                <div style={{ height:4, background: isApprove ? '#059669' : '#ef4444' }} />
                <div style={{ padding:'26px 26px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                        <div style={{ width:46, height:46, borderRadius:14, background:accentBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, border:`1px solid ${accentColor}33` }}>
                            {isApprove ? '✓' : '✕'}
                        </div>
                        <div>
                            <div style={{ fontSize:16, fontWeight:900, color:theme.text }}>{isApprove ? 'Approve Leave Request' : 'Reject Leave Request'}</div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:3 }}>Employee will be notified</div>
                        </div>
                    </div>
                    <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : typeCfg.border}`, borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:14, fontWeight:800, color:typeCfg.color }}>{request.leave_type}</span>
                            <span style={{ fontSize:10, fontWeight:700, background:dayBg, color:dayTypeCfg.color, borderRadius:99, padding:'2px 9px' }}>{dayTypeCfg.label}</span>
                        </div>
                        {request.user && (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:24, height:24, borderRadius:8, background:typeBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:typeCfg.color }}>{request.user.name?.charAt(0).toUpperCase()}</div>
                                <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>{request.user.name}</span>
                            </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:theme.textSoft }}>
                            <span style={{ fontWeight:600 }}>{formatDate(request.start_date)}</span>
                            {request.start_date !== request.end_date && <><span style={{ color:theme.textMute }}>→</span><span style={{ fontWeight:600 }}>{formatDate(request.end_date)}</span></>}
                            <span style={{ fontSize:11, fontWeight:700, color:typeCfg.color, background:typeBg, borderRadius:6, padding:'1px 8px' }}>
                                {formatNum(request.total_days)} {request.total_days===0.5?'half day':request.total_days==1?'day':'days'}
                            </span>
                        </div>
                        {request.note && <div style={{ fontSize:11, color:theme.textMute, fontStyle:'italic', borderTop:`1px solid ${theme.border}`, paddingTop:8 }}>"{request.note}"</div>}
                    </div>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'0 26px 22px' }}>
                    <button onClick={onCancel} disabled={loading}
                        style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', color:theme.textSoft }}>
                        Cancel
                    </button>
                    {isApprove
                        ? <button onClick={onApprove} disabled={loading}
                            style={{ background: dark ? 'rgba(16,185,129,0.2)' : '#059669', border:`1px solid ${dark ? 'rgba(16,185,129,0.4)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#34d399' : '#fff', opacity:loading?0.6:1 }}>
                            {loading ? 'Approving...' : '✓ Approve'}
                          </button>
                        : <button onClick={onReject} disabled={loading}
                            style={{ background: dark ? 'rgba(248,113,113,0.18)' : '#ef4444', border:`1px solid ${dark ? 'rgba(248,113,113,0.35)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#f87171' : '#fff', opacity:loading?0.6:1 }}>
                            {loading ? 'Rejecting...' : '✕ Reject'}
                          </button>
                    }
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Leave Request Modal ──────────────────────────────────────
function LeaveRequestModal({ saving, setSaving, policyMap, balanceMap, leaveTypeConfig, approvers, roleName, dark, theme, onClose, onSuccess, onError }) {
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
        const end   = new Date(form.end_date + 'T00:00:00');
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
        if (!allowed.includes(file.type)) { setErrors(e => ({...e, document:'Only PDF, JPG, PNG allowed.'})); return; }
        if (file.size > 5*1024*1024)       { setErrors(e => ({...e, document:'File must be under 5MB.'})); return; }
        setDocFile(file);
        setErrors(e => ({...e, document:null}));
    }

    function validate() {
        const e = {};
        if (!form.leave_type) e.leave_type = 'Leave type is required';
        if (!form.start_date) e.start_date = 'Start date is required';
        if (!isHalfDay && !form.end_date) e.end_date = 'End date is required';
        if (!form.note) e.note = 'Reason is required';
        if (!['hr','admin'].includes(roleName) && !form.approver_id) e.approver_id = 'Please select an approver';
        if (!isHalfDay && form.start_date && form.end_date && form.end_date < form.start_date) e.end_date = 'End date must be after start date';
        if (requiresDoc && !docFile) e.document = 'Supporting document is required for this leave type.';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;
        setSaving(true);
        const payload = { leave_type:form.leave_type, day_type:form.day_type, start_date:form.start_date,
            end_date: isHalfDay ? form.start_date : form.end_date, note:form.note, approver_id:form.approver_id||'' };
        if (docFile) {
            const fd = new FormData();
            Object.entries(payload).forEach(([k,v]) => fd.append(k,v));
            fd.append('document', docFile);
            router.post('/payroll/leaves', fd, { forceFormData:true,
                onSuccess: () => { setSaving(false); onSuccess(); },
                onError: (errs) => { setSaving(false); setErrors(errs); const m = Object.values(errs)[0]; onError(Array.isArray(m)?m[0]:m||'Validation error'); },
            });
        } else {
            router.post('/payroll/leaves', payload, {
                onSuccess: () => { setSaving(false); onSuccess(); },
                onError: (errs) => { setSaving(false); setErrors(errs); const m = Object.values(errs)[0]; onError(Array.isArray(m)?m[0]:m||'Validation error'); },
            });
        }
    }

    const inp = (hasErr) => ({
        background: theme.inputBg, border:`1.5px solid ${hasErr ? theme.danger : theme.inputBorder}`,
        borderRadius:12, padding:'10px 14px', fontSize:13, color:theme.text, outline:'none',
        width:'100%', boxSizing:'border-box', transition:'border 0.15s', colorScheme: dark ? 'dark' : 'light',
    });

    const lbl = { fontSize:11, fontWeight:800, color:theme.textSoft, textTransform:'uppercase', letterSpacing:'0.5px' };

    const approverOptions = [
        { value:'', label:'Select approver', disabled:true },
        ...approvers.map(a => ({ value:a.id, label:a.name })),
    ];

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:8000, padding:20 }}>
            <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius:24, width:'100%', maxWidth:556,
                maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden',
                boxShadow: dark ? '0 40px 100px rgba(0,0,0,0.65)' : '0 32px 80px rgba(15,23,42,0.22)',
                border:`1px solid ${theme.border}`, animation:'popIn 0.22s ease' }}>

                {/* Header */}
                <div style={{ background:theme.modalHeader, padding:'20px 24px 18px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
                    <div style={{ position:'absolute', bottom:-30, left:20, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.16)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏖️</div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Leave Management</div>
                                <div style={{ fontSize:17, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Request Leave</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.14)', border:'none', cursor:'pointer', fontSize:20, color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1 }}>×</button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16, overflowY:'auto', flex:1 }} className="hide-scrollbar">

                    {/* Leave Type */}
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        <label style={lbl}>Leave Type <span style={{ color:theme.danger }}>*</span></label>
                        {leaveTypes.length === 0
                            ? <div style={{ fontSize:12, color:theme.textMute, background:theme.panelSoft, borderRadius:10, padding:'10px 14px', border:`1px solid ${theme.border}` }}>No leave types configured. Please contact HR.</div>
                            : <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                {leaveTypes.map(type => {
                                    const cfg2 = leaveTypeConfig[type];
                                    const pol2 = policyMap[type];
                                    const isActive = form.leave_type === type;
                                    return (
                                        <button key={type} onClick={() => { set('leave_type', type); setDocFile(null); setErrors(e => ({...e, document:null})); }}
                                            style={{ border:`1.5px solid ${isActive ? cfg2.color : theme.inputBorder}`, borderRadius:10, padding:'7px 14px', fontSize:12, cursor:'pointer',
                                                background: isActive ? (dark ? cfg2.bgDark : cfg2.bg) : (dark ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
                                                color: isActive ? cfg2.color : theme.textSoft, fontWeight: isActive ? 800 : 500,
                                                display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}>
                                            {type}
                                            {pol2?.requires_document == 1 && (
                                                <span style={{ fontSize:9, background: isActive ? cfg2.color : (dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), color: isActive ? '#fff' : theme.textMute, borderRadius:4, padding:'1px 5px', fontWeight:800 }}>DOC</span>
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
                        <label style={lbl}>Day Type <span style={{ color:theme.danger }}>*</span></label>
                        <div style={{ display:'flex', gap:8 }}>
                            {Object.entries(DAY_TYPE_CONFIG).map(([type, cfg2]) => {
                                const isActive = form.day_type === type;
                                return (
                                    <button key={type} onClick={() => set('day_type', type)}
                                        style={{ flex:1, border:`1.5px solid ${isActive ? cfg2.color : theme.inputBorder}`, borderRadius:10, padding:'9px 10px', fontSize:11, cursor:'pointer',
                                            background: isActive ? (dark ? cfg2.bgDark : cfg2.bg) : (dark ? 'rgba(255,255,255,0.04)' : '#f9fafb'),
                                            color: isActive ? cfg2.color : theme.textSoft, fontWeight: isActive ? 800 : 500, textAlign:'center', transition:'all 0.15s' }}>
                                        {cfg2.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Balance */}
                    {pol && (
                        <div style={{ background:typeBg, borderRadius:12, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${dark ? 'transparent' : typeCfg.border}` }}>
                            <div>
                                <div style={{ fontSize:11, color:typeCfg.color, fontWeight:700 }}>Available Balance</div>
                                <div style={{ fontSize:10, color:theme.textMute, marginTop:2 }}>Used: {bal?.used_days ?? 0} · Total: {pol.days_per_year} days</div>
                            </div>
                            <div style={{ fontSize:24, fontWeight:900, color:typeCfg.color }}>
                                {bal?.remaining_days ?? pol.days_per_year}<span style={{ fontSize:12, fontWeight:500, color:theme.textMute }}> days</span>
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div style={isHalfDay ? {} : { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            <label style={lbl}>{isHalfDay ? 'Date' : 'Start Date'} <span style={{ color:theme.danger }}>*</span></label>
                            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inp(errors.start_date)} />
                            {errors.start_date && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.start_date}</span>}
                        </div>
                        {!isHalfDay && (
                            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                <label style={lbl}>End Date <span style={{ color:theme.danger }}>*</span></label>
                                <input type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} style={inp(errors.end_date)} />
                                {errors.end_date && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.end_date}</span>}
                            </div>
                        )}
                    </div>

                    {/* Approver */}
                    {roleName === 'hr' ? (
                        approvers.length > 0 && (
                            <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius:12, padding:'12px 16px', border:`1px solid ${theme.border}` }}>
                                <div style={{ fontSize:10, color:theme.textMute, fontWeight:800, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Sending Approval To</div>
                                <div style={{ fontSize:13, fontWeight:700, color:theme.text }}>{approvers[0]?.name} <span style={{ fontSize:11, color:theme.primary, fontWeight:600 }}>(Admin)</span></div>
                            </div>
                        )
                    ) : !['admin'].includes(roleName) && approvers.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            <label style={lbl}>Approver <span style={{ color:theme.danger }}>*</span></label>
                            <PremiumDropdown options={approverOptions} value={form.approver_id}
                                onChange={v => set('approver_id', v)} placeholder="Select approver"
                                theme={theme} dark={dark} width="100%" />
                            {errors.approver_id && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.approver_id}</span>}
                        </div>
                    ) : null}

                    {/* Preview */}
                    {form.start_date && (previewDays > 0 || isHalfDay) && (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            <div style={{ background: dark ? 'rgba(139,92,246,0.16)' : '#ede9fe', border:`1px solid ${dark ? 'rgba(139,92,246,0.3)' : '#ddd6fe'}`, borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span style={{ fontSize:12, color: dark ? '#a78bfa' : '#7c3aed', fontWeight:600 }}>
                                    {isHalfDay ? `${DAY_TYPE_CONFIG[form.day_type].label} — ${formatDate(form.start_date)}` : 'Total leave days:'}
                                </span>
                                <span style={{ fontSize:16, fontWeight:900, color: dark ? '#a78bfa' : '#7c3aed' }}>
                                    {previewDays} {previewDays===0.5?'half day':previewDays===1?'day':'days'}
                                </span>
                            </div>
                            {pol?.is_paid && !isHalfDay && (() => {
                                const avail = bal ? (bal.remaining_days ?? 0) : (pol?.days_per_year ?? 0);
                                return avail > 0 && previewDays > avail ? (
                                    <div style={{ background: dark ? 'rgba(245,158,11,0.12)' : '#fff7ed', border:`1px solid ${dark ? 'rgba(245,158,11,0.25)' : '#fed7aa'}`, borderRadius:10, padding:'10px 14px' }}>
                                        <div style={{ fontSize:12, fontWeight:700, color: dark ? '#f59e0b' : '#c2410c', marginBottom:4 }}>⚠ Balance exceeded — will be split automatically</div>
                                        <div style={{ fontSize:11, color: dark ? '#d97706' : '#9a3412', lineHeight:1.8 }}>
                                            <span style={{ fontWeight:600 }}>{avail} day(s)</span> → <span style={{ fontWeight:600 }}>{form.leave_type}</span> (paid)<br/>
                                            <span style={{ fontWeight:600 }}>{previewDays - avail} day(s)</span> → <span style={{ fontWeight:600 }}>Absent</span> (unpaid)
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                            {pol?.is_paid && !isHalfDay && bal && (bal.remaining_days ?? 0) <= 0 && previewDays > 0 && (
                                <div style={{ background: dark ? 'rgba(245,158,11,0.12)' : '#fff7ed', border:`1px solid ${dark ? 'rgba(245,158,11,0.25)' : '#fed7aa'}`, borderRadius:10, padding:'10px 14px' }}>
                                    <div style={{ fontSize:12, fontWeight:700, color: dark ? '#f59e0b' : '#c2410c', marginBottom:2 }}>⚠ No {form.leave_type} balance remaining</div>
                                    <div style={{ fontSize:11, color: dark ? '#d97706' : '#9a3412' }}>
                                        All <span style={{ fontWeight:600 }}>{previewDays} day(s)</span> will be submitted as <span style={{ fontWeight:600 }}>Absent</span> (unpaid).
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Document Upload */}
                    {(requiresDoc || pol) && (
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                <label style={lbl}>Supporting Document</label>
                                {requiresDoc
                                    ? <span style={{ fontSize:10, fontWeight:700, background: dark ? 'rgba(248,113,113,0.15)' : '#fee2e2', color:theme.danger, borderRadius:5, padding:'2px 8px' }}>Required</span>
                                    : <span style={{ fontSize:10, fontWeight:600, background:theme.panelSoft, color:theme.textMute, borderRadius:5, padding:'2px 8px' }}>Optional</span>
                                }
                            </div>
                            {!docFile ? (
                                <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ border:`2px dashed ${errors.document ? theme.danger : dragOver ? theme.primary : theme.inputBorder}`, borderRadius:14, padding:'22px 16px', textAlign:'center', cursor:'pointer',
                                        background: dark ? (dragOver ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)') : (dragOver ? '#faf5ff' : '#fafafa'), transition:'all 0.2s' }}>
                                    <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                                        <div style={{ width:40, height:40, borderRadius:12, background: dark ? (dragOver ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)') : (dragOver ? '#ede9fe' : '#f3f4f6'), display:'flex', alignItems:'center', justifyContent:'center' }}>
                                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={dragOver ? theme.primary : theme.textMute} strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div style={{ fontSize:12, fontWeight:600, color: dragOver ? theme.primary : theme.textSoft }}>
                                        {dragOver ? 'Drop to upload' : <><span>Drop file here or </span><span style={{ color:theme.primary, textDecoration:'underline' }}>browse</span></>}
                                    </div>
                                    <div style={{ fontSize:10, color:theme.textMute, marginTop:4 }}>PDF, JPG, PNG · max 5MB</div>
                                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
                                </div>
                            ) : (
                                <div style={{ display:'flex', alignItems:'center', gap:12, background: dark ? 'rgba(16,185,129,0.08)' : '#fff',
                                    border:`1.5px solid ${dark ? 'rgba(16,185,129,0.25)' : '#d1fae5'}`, borderRadius:12, padding:'10px 14px' }}>
                                    <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                                        background: docFile.type==='application/pdf' ? (dark ? 'rgba(245,158,11,0.15)' : '#fef3c7') : (dark ? 'rgba(37,99,235,0.15)' : '#dbeafe') }}>
                                        <span style={{ fontSize:18 }}>{docFile.type==='application/pdf' ? '📄' : '🖼️'}</span>
                                    </div>
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ fontSize:12, fontWeight:700, color:theme.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{docFile.name}</div>
                                        <div style={{ fontSize:10, color: dark ? '#34d399' : '#059669', fontWeight:600, marginTop:2 }}>✓ Ready · {(docFile.size/1024).toFixed(1)} KB</div>
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
                            placeholder="Please provide reason for leave..."
                            style={{ ...inp(errors.note), height:80, resize:'vertical' }} />
                        {errors.note && <span style={{ fontSize:11, color:theme.danger, fontWeight:600 }}>{errors.note}</span>}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 24px', borderTop:`1px solid ${theme.border}`, flexShrink:0, background: dark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
                    <button onClick={onClose}
                        style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border:`1px solid ${theme.border}`, borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', color:theme.textSoft }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        style={{ background:`linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`,
                            border:'none', borderRadius:12, padding:'10px 24px', fontSize:13, fontWeight:700,
                            cursor: saving ? 'not-allowed' : 'pointer', color:'#fff', opacity:saving?0.65:1,
                            display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 24px ${theme.primary}44`, transition:'all 0.15s' }}>
                        {saving && <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />}
                        {saving ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Main Page ────────────────────────────────────────────────
export default function LeaveIndex({ requests, leaveBalances, leavePolicies, employees, filters, selectedMonth, selectedYear }) {
    const { auth } = usePage().props;
    const user     = auth?.user;
    const roleName = user?.role?.name || 'employee';
    const dark     = useReactiveTheme();
    const theme    = useMemo(() => getTheme(dark), [dark]);

    const canApprove = ['management','hr','admin'].includes(roleName);
    const canViewAll = ['hr','admin','management'].includes(roleName);

    const LEAVE_TYPE_CONFIG = useMemo(() => buildLeaveTypeConfig(leavePolicies), [leavePolicies]);

    const [mainTab, setMainTab]           = useState('my');
    const [month, setMonth]               = useState(selectedMonth || new Date().getMonth() + 1);
    const [year, setYear]                 = useState(selectedYear  || new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [showModal, setShowModal]       = useState(false);
    const [saving, setSaving]             = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    function handleMonthYearFilter(m, y) { router.get('/payroll/leaves', { month:m, year:y, status:statusFilter }); }
    function handleStatusFilter(s) { setStatusFilter(s); router.get('/payroll/leaves', { status:s, month, year }, { preserveState:true }); }

    function handleApprove(req) {
        setActionLoading(true);
        router.patch(`/payroll/leaves/${req.id}/approve`, {}, {
            // ── GlobalToast က flash.success ကို ကောက်မည် ──
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError:   () => {
                setActionLoading(false);
                window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'Something went wrong', type: 'error' } }));
            },
        });
    }

    function handleReject(req) {
        setActionLoading(true);
        router.patch(`/payroll/leaves/${req.id}/reject`, {}, {
            // ── GlobalToast က flash.success ကို ကောက်မည် ──
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError:   () => {
                setActionLoading(false);
                window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'Something went wrong', type: 'error' } }));
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

    const monthOpts  = MONTHS.map((m, i) => ({ value:i+1, label:m }));
    const yearOpts   = [2024,2025,2026,2027].map(y => ({ value:y, label:String(y) }));
    const statusOpts = [
        { value:'', label:'All Status' },
        { value:'pending',  label:'⏳ Pending'  },
        { value:'approved', label:'✓ Approved' },
        { value:'rejected', label:'✕ Rejected' },
    ];

    const tabs = [
        { key:'my',        label:'My Requests',      count: myRequests.length,   alert: false },
        ...(canApprove ? [{ key:'approvals', label:'Pending Approvals', count: pendingCount, alert: pendingCount > 0 }] : []),
        ...(canViewAll  ? [{ key:'all',      label:'All Requests',      count: requests.total, alert: false }] : []),
    ];

    return (
        <AppLayout title="Leave Management">
            <style>{`
                @keyframes popIn   { from { opacity:0; transform:scale(0.96); }    to { opacity:1; transform:scale(1); } }
                @keyframes spin    { to   { transform:rotate(360deg); } }
                @keyframes dropIn  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
                .hide-scrollbar::-webkit-scrollbar { display:none; }
                .hide-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                {/* ── Leave Balance Cards ── */}
                {leavePolicies.length > 0 && (
                    <LeaveBalanceCards leavePolicies={leavePolicies} leaveTypeConfig={LEAVE_TYPE_CONFIG} balanceMap={balanceMap} dark={dark} theme={theme} />
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
                        style={{ background:`linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`,
                            color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:700,
                            cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                            boxShadow:`0 8px 22px ${theme.primary}44`, transition:'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Request Leave
                    </button>
                </div>

                {/* ── Tabbed Panel ── */}
                <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius:18, border:`1px solid ${theme.border}`, boxShadow:theme.shadowSoft, overflow:'hidden' }}>

                    {/* Tab bar */}
                    <div style={{ display:'flex', borderBottom:`1px solid ${theme.border}`, padding:'0 4px', overflowX:'auto' }} className="hide-scrollbar">
                        {tabs.map(tab => {
                            const isActive = mainTab === tab.key;
                            return (
                                <button key={tab.key} onClick={() => setMainTab(tab.key)}
                                    style={{ padding:'14px 18px', fontSize:13, fontWeight: isActive ? 800 : 500,
                                        color: isActive ? theme.primary : theme.textMute,
                                        background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap',
                                        borderBottom: isActive ? `2.5px solid ${theme.primary}` : '2.5px solid transparent',
                                        display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}>
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span style={{ fontSize:10, fontWeight:800, borderRadius:99, padding:'2px 8px',
                                            background: tab.alert ? (dark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : (isActive ? theme.primarySoft : (dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6')),
                                            color: tab.alert ? theme.warning : (isActive ? theme.primary : theme.textMute) }}>
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
                                {mainTab === 'approvals' ? 'No pending approvals' : 'No leave requests found'}
                            </div>
                            <div style={{ fontSize:12, color:theme.textMute }}>
                                {mainTab === 'approvals' ? 'All caught up!' : 'Click "Request Leave" to submit a new request.'}
                            </div>
                        </div>
                    ) : (
                        displayList.map((req, idx) => (
                            <RequestRow key={req.id} req={req} leaveTypeConfig={LEAVE_TYPE_CONFIG}
                                dark={dark} theme={theme} canApprove={canApprove} userId={user?.id}
                                onApprove={r => setConfirmModal({ type:'approve', request:r })}
                                onReject={r  => setConfirmModal({ type:'reject',  request:r })}
                                isLast={idx === displayList.length - 1} />
                        ))
                    )}

                    {/* Pagination */}
                    {mainTab === 'all' && requests.last_page > 1 && (
                        <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'16px 20px', borderTop:`1px solid ${theme.border}` }}>
                            {Array.from({ length:requests.last_page }, (_,i) => i+1).map(page => {
                                const isActive = requests.current_page === page;
                                return (
                                    <button key={page} onClick={() => router.get('/payroll/leaves', { page, status:statusFilter, month, year })}
                                        style={{ width:34, height:34, borderRadius:10,
                                            border:`1px solid ${isActive ? theme.primary : theme.border}`,
                                            background: isActive ? theme.primary : 'transparent',
                                            color: isActive ? '#fff' : theme.textSoft, fontWeight:600, cursor:'pointer', fontSize:13, transition:'all 0.15s' }}>
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                    )}
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
                    onError={msg => window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'error' } }))}
                />
            )}

            {confirmModal && (
                <ConfirmModal type={confirmModal.type} request={confirmModal.request}
                    loading={actionLoading} leaveTypeConfig={LEAVE_TYPE_CONFIG}
                    dark={dark} theme={theme}
                    onCancel={() => setConfirmModal(null)}
                    onApprove={() => handleApprove(confirmModal.request)}
                    onReject={()  => handleReject(confirmModal.request)} />
            )}
        </AppLayout>
    );
}