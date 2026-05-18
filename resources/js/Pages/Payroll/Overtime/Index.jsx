import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/Contexts/LanguageContext';

// ── Theme ─────────────────────────────────────────────────────
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
        panelSolid:  '#0f1b34',
        panelSoft:   'rgba(255,255,255,0.04)',
        panelSofter: 'rgba(255,255,255,0.07)',
        border:      'rgba(148,163,184,0.13)',
        text:        '#f8fafc',
        textSoft:    '#cbd5e1',
        textMute:    '#64748b',
        overlay:     'rgba(2,8,23,0.78)',
        shadow:      '0 24px 60px rgba(0,0,0,0.38)',
        shadowSoft:  '0 4px 16px rgba(0,0,0,0.22)',
        primary:     '#8b5cf6',
        primarySoft: 'rgba(139,92,246,0.16)',
        success:     '#10b981',
        successSoft: 'rgba(16,185,129,0.14)',
        danger:      '#f87171',
        dangerSoft:  'rgba(248,113,113,0.14)',
        warning:     '#fbbf24',
        inputBg:     'rgba(255,255,255,0.06)',
        inputBorder: 'rgba(148,163,184,0.18)',
        modalHeader: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        calBg:       'rgba(255,255,255,0.03)',
    };
    return {
        panelSolid:  '#ffffff',
        panelSoft:   '#f8fafc',
        panelSofter: '#f1f5f9',
        border:      'rgba(15,23,42,0.08)',
        text:        '#0f172a',
        textSoft:    '#475569',
        textMute:    '#94a3b8',
        overlay:     'rgba(15,23,42,0.48)',
        shadow:      '0 20px 50px rgba(15,23,42,0.14)',
        shadowSoft:  '0 2px 8px rgba(15,23,42,0.06)',
        primary:     '#7c3aed',
        primarySoft: '#f3e8ff',
        success:     '#059669',
        successSoft: '#ecfdf5',
        danger:      '#ef4444',
        dangerSoft:  '#fef2f2',
        warning:     '#d97706',
        inputBg:     '#f8fafc',
        inputBorder: '#e2e8f0',
        modalHeader: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        calBg:       '#f8fafc',
    };
}

// ── Helpers ────────────────────────────────────────────────────
function to12h(t) {
    if (!t) return '—';
    const [hStr, mStr] = t.substring(0, 5).split(':');
    const h = parseInt(hStr, 10);
    return `${h % 12 === 0 ? 12 : h % 12}:${mStr ?? '00'} ${h >= 12 ? 'PM' : 'AM'}`;
}
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtHrs(h) {
    const n = parseFloat(h);
    if (!n || isNaN(n)) return '0 hr';
    const hrs = Math.floor(n);
    const mins = Math.round((n - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}hr`;
    return `${hrs}hr ${mins}m`;
}
function initials(name) {
    return (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function pad2(n) { return String(n).padStart(2, '0'); }

// ── OT colors ──────────────────────────────────────────────────
const OT_COLORS = {
    'Day Weekday OT':    { color:'#7c3aed', bg:'#f5f3ff', bgDark:'rgba(124,58,237,0.14)', border:'#ddd6fe', grad:'linear-gradient(135deg,#7c3aed,#a78bfa)' },
    'Night Weekday OT':  { color:'#1d4ed8', bg:'#eff6ff', bgDark:'rgba(29,78,216,0.14)',  border:'#bfdbfe', grad:'linear-gradient(135deg,#1d4ed8,#60a5fa)' },
    'Day Weekend OT':    { color:'#059669', bg:'#ecfdf5', bgDark:'rgba(5,150,105,0.14)',   border:'#6ee7b7', grad:'linear-gradient(135deg,#059669,#34d399)' },
    'Night Weekend OT':  { color:'#0369a1', bg:'#f0f9ff', bgDark:'rgba(3,105,161,0.14)',   border:'#bae6fd', grad:'linear-gradient(135deg,#0369a1,#38bdf8)' },
    'Public Holiday OT': { color:'#dc2626', bg:'#fef2f2', bgDark:'rgba(220,38,38,0.14)',   border:'#fca5a5', grad:'linear-gradient(135deg,#dc2626,#f87171)' },
};
const OT_FALLBACK = { color:'#6b7280', bg:'#f9fafb', bgDark:'rgba(107,114,128,0.14)', border:'#e5e7eb', grad:'linear-gradient(135deg,#6b7280,#9ca3af)' };
const getOTColor = t => OT_COLORS[t] || OT_FALLBACK;

const STATUS_CFG = {
    pending:  { label:'Pending',  color:'#d97706', bg:'#fffbeb', bgDark:'rgba(217,119,6,0.16)',   dot:'#f59e0b' },
    approved: { label:'Approved', color:'#059669', bg:'#ecfdf5', bgDark:'rgba(5,150,105,0.16)',   dot:'#10b981' },
    rejected: { label:'Rejected', color:'#dc2626', bg:'#fef2f2', bgDark:'rgba(220,38,38,0.16)',   dot:'#ef4444' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const otPolicyKey   = title => String(title || 'OT').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
const otPolicyTitle = (tr, title) => tr(`overtime.policyTitles.${otPolicyKey(title)}`);

// ── Premium Dropdown ───────────────────────────────────────────
function PremiumDropdown({ options, value, onChange, placeholder = 'Select...', theme, dark, disabled = false, width = 'auto' }) {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0, above: false });
    const triggerRef = useRef(null);
    const menuRef    = useRef(null);
    const selected   = options.find(o => String(o.value) === String(value) && !o.disabled);

    useEffect(() => {
        const handler = e => {
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
            const MENU_H     = Math.min(options.filter(o => !o.disabled).length * 44, 220);
            const GAP        = 6;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const above      = spaceBelow < MENU_H + GAP || spaceAbove > spaceBelow + 40;
            setPos({ top: above ? rect.top - MENU_H - GAP : rect.bottom + GAP, left: rect.left, width: rect.width, above });
        }
        setOpen(v => !v);
    }

    return (
        <>
            <button ref={triggerRef} type="button" onClick={handleOpen} disabled={disabled}
                style={{ width, height:44, padding:'0 14px', borderRadius:12, border:`1.5px solid ${open ? '#7c3aed' : theme.inputBorder}`, background: dark ? 'linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))' : 'linear-gradient(180deg,#fff,#f8fafc)', color: selected ? theme.text : theme.textMute, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, cursor: disabled ? 'not-allowed' : 'pointer', fontSize:13, fontWeight: selected ? 600 : 400, boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.18)' : 'none', transition:'all 0.18s', opacity: disabled ? 0.5 : 1, outline:'none' }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected ? selected.label : (placeholder || '—')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink:0, transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', color:theme.textMute }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {open && createPortal(
                <div ref={menuRef} className="ot-hide" style={{ position:'fixed', top:pos.top, left:pos.left, width:pos.width, background: dark ? '#111e38' : '#fff', border:`1px solid ${theme.border}`, borderRadius:14, boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.55)' : '0 12px 40px rgba(15,23,42,0.14)', zIndex:99999, maxHeight:220, overflowY:'auto', animation: pos.above ? 'otDropUp 0.16s ease' : 'otDrop 0.16s ease' }}>
                    {options.filter(o => !o.disabled).map(opt => {
                        const isSel = String(opt.value) === String(value);
                        return (
                            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{ padding:'10px 14px', fontSize:13, fontWeight: isSel ? 700 : 500, color: isSel ? '#fff' : theme.text, background: isSel ? '#7c3aed' : 'transparent', cursor:'pointer', transition:'background 0.1s', display:'flex', alignItems:'center', gap:8 }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                                {isSel && <span style={{ fontSize:11 }}>✓</span>}
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

// ── OT Policy Cards ────────────────────────────────────────────
function OTPolicyCards({ overtimePolicies, dark, theme, tr }) {
    if (!overtimePolicies?.length) return null;
    return (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {overtimePolicies.map(pol => {
                const c        = getOTColor(pol.title);
                const bg       = dark ? c.bgDark : c.bg;
                const dayLabel = pol.day_type === 'public_holiday' ? tr('overtime.labels.publicHoliday') : pol.day_type === 'weekend' ? tr('overtime.labels.weekend') : tr('overtime.labels.weekday');
                const shiftLbl = pol.shift_type === 'day' ? tr('overtime.labels.day') : pol.shift_type === 'night' ? tr('overtime.labels.night') : tr('overtime.labels.all');
                const rateVal  = pol.rate_type === 'multiplier' ? `${Number(pol.rate_value).toFixed(1)}×` : Number(pol.rate_value).toLocaleString();
                const pct      = pol.shift_type === 'day' ? 60 : pol.shift_type === 'night' ? 100 : 80;
                return (
                    <div key={pol.id} style={{ display:'flex', alignItems:'center', gap:12, background: dark ? 'rgba(255,255,255,0.04)' : '#fff', border:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : c.border}`, borderRadius:14, padding:'12px 16px', boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden', minWidth:170 }}>
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:c.color }} />
                        <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:bg, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${dark ? 'transparent' : c.border}` }}>
                            <span style={{ fontSize:15, fontWeight:900, color:c.color, lineHeight:1 }}>{rateVal}</span>
                        </div>
                        <div style={{ minWidth:0, flex:1 }}>
                            <div style={{ fontSize:11, fontWeight:800, color:c.color, textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{otPolicyTitle(tr, pol.title)}</div>
                            <div style={{ fontSize:10, color:theme.textMute, marginTop:2 }}>{dayLabel} · {shiftLbl} {tr('overtime.labels.shift')}</div>
                            <div style={{ marginTop:6, height:3, borderRadius:99, background: dark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', width:80, overflow:'hidden' }}>
                                <div style={{ height:'100%', borderRadius:99, background:c.grad, width:`${pct}%` }} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── OT Row ─────────────────────────────────────────────────────
function OTRow({ req, dark, theme, canApprove, userId, onApprove, onReject, onDelete, isLast, tr }) {
    const sc         = STATUS_CFG[req.status] || STATUS_CFG.pending;
    const isMine     = req.user_id === userId;
    const isAssigned = req.approver_id === userId;
    const showActions = canApprove && req.status === 'pending' && isAssigned && !isMine;
    const showDelete  = req.user_id === userId && req.status === 'pending';
    const statusBg   = dark ? sc.bgDark : sc.bg;

    const segments        = req.segments || [];
    const isMultiDay      = req.end_date && req.end_date !== req.start_date;
    const visibleSegments = req.status === 'approved' ? segments.filter(seg => parseFloat(seg.hours_approved) > 0) : segments;

    const grouped = {};
    visibleSegments.forEach(seg => {
        const d = seg.segment_date || req.start_date;
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(seg);
    });
    const groupedDates  = Object.keys(grouped).sort();
    const hasMultiGroup = groupedDates.length > 1;

    const typeTotals = {};
    visibleSegments.forEach(seg => {
        const k = seg.overtime_policy?.title || 'OT';
        const h = parseFloat(req.status === 'approved' ? seg.hours_approved : seg.hours) || 0;
        typeTotals[k] = (typeTotals[k] || 0) + h;
    });

    const barColor  = segments[0] ? getOTColor(segments[0].overtime_policy?.title).color : theme.primary;
    const chipLabel = { fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', marginRight:5 };
    const chipValue = { fontSize:12, fontWeight:700 };

    return (
        <div style={{ display:'flex', alignItems:'stretch', borderBottom: isLast ? 'none' : `1px solid ${theme.border}`, transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.02)' : '#fafbff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width:3, background:barColor, flexShrink:0 }} />
            <div style={{ flex:1, padding:'13px 18px', minWidth:0 }}>

                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>{tr('overtime.titleShort')}</span>
                        <span style={{ fontSize:10, fontWeight:700, background:statusBg, color:sc.color, borderRadius:99, padding:'2px 8px', display:'inline-flex', alignItems:'center', gap:3 }}>{tr(`overtime.status.${req.status}`)}</span>
                        {req.status === 'approved' && parseFloat(req.hours_approved) !== parseFloat(req.hours_requested) ? (
                            <>
                                <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 8px', background: dark ? 'rgba(16,185,129,0.15)' : '#d1fae5', color:'#059669' }}>✓ {fmtHrs(req.hours_approved)}</span>
                                <span style={{ fontSize:10, fontWeight:600, borderRadius:99, padding:'2px 8px', background: dark ? theme.panelSoft : '#f3f4f6', color:theme.textMute, textDecoration:'line-through' }}>{fmtHrs(req.hours_requested)}</span>
                            </>
                        ) : (
                            <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 8px', background: dark ? theme.primarySoft : '#ede9fe', color:theme.primary }}>
                                {req.status === 'approved' ? `✓ ${fmtHrs(req.hours_approved)}` : fmtHrs(req.hours_requested)}
                            </span>
                        )}
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                        {req.status === 'pending' && req.approver && !showActions && (
                            <div style={{ textAlign:'right', lineHeight:1.5 }}>
                                <div style={{ fontSize:10, color:theme.textMute, fontWeight:500 }}>{tr('overtime.labels.awaiting')}</div>
                                <div style={{ fontSize:12, fontWeight:800, color:'#2563eb' }}>{req.approver.name}</div>
                            </div>
                        )}
                        {req.status === 'approved' && req.approvedBy && (
                            <div style={{ textAlign:'right', lineHeight:1.5 }}>
                                <div style={{ fontSize:10, color:theme.textMute, fontWeight:500 }}>{tr('overtime.labels.approvedBy')}</div>
                                <div style={{ fontSize:12, fontWeight:800, color:theme.success }}>{req.approvedBy.name}</div>
                            </div>
                        )}
                        {req.status === 'rejected' && req.approvedBy && (
                            <div style={{ textAlign:'right', lineHeight:1.5 }}>
                                <div style={{ fontSize:10, color:theme.textMute, fontWeight:500 }}>{tr('overtime.labels.rejectedBy')}</div>
                                <div style={{ fontSize:12, fontWeight:800, color:theme.danger }}>{req.approvedBy.name}</div>
                            </div>
                        )}
                        {showActions && (
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                <button onClick={onApprove} style={{ background: dark ? 'linear-gradient(135deg,#065f46,#059669)' : 'linear-gradient(135deg,#059669,#10b981)', border:'none', borderRadius:20, padding:'6px 16px', fontSize:11, fontWeight:700, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:5, boxShadow:'0 2px 8px rgba(16,185,129,0.35)', transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity='0.88'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    {tr('overtime.actions.approve')}
                                </button>
                                <button onClick={onReject} style={{ background: dark ? 'linear-gradient(135deg,rgba(220,38,38,0.28),rgba(239,68,68,0.22))' : 'linear-gradient(135deg,#fef2f2,#fee2e2)', border:'none', borderRadius:20, padding:'6px 16px', fontSize:11, fontWeight:700, cursor:'pointer', color: dark ? '#f87171' : '#dc2626', display:'flex', alignItems:'center', gap:5, boxShadow: dark ? '0 2px 8px rgba(248,113,113,0.15)' : '0 2px 8px rgba(220,38,38,0.10)', transition:'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity='0.82'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    {tr('overtime.actions.reject')}
                                </button>
                            </div>
                        )}
                        {showDelete && (
                            <button onClick={() => onDelete(req)} title={tr('overtime.actions.deleteRequest')} style={{ width:28, height:28, borderRadius:7, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0, color: dark ? 'rgba(248,113,113,0.4)' : '#fca5a5' }}
                                onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(248,113,113,0.16)' : '#fee2e2'; e.currentTarget.style.color = dark ? '#f87171' : '#dc2626'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? 'rgba(248,113,113,0.4)' : '#fca5a5'; }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {req.project && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2, marginBottom:8, paddingBottom:8, borderBottom:`1px dashed ${dark ? 'rgba(148,163,184,0.15)' : '#e2e8f0'}` }}>
                        <span style={{ fontSize:11, fontWeight:700, color: dark ? '#818cf8' : '#6366f1', textTransform:'uppercase', letterSpacing:'0.06em' }}>{tr('overtime.labels.project')}</span>
                        <span style={{ fontSize:13, fontWeight:800, color: dark ? '#a5b4fc' : '#4338ca' }}>{req.project.name}</span>
                    </div>
                )}

                {!isMine && req.user && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                        {req.user.avatar_url
                            ? <img src={`/storage/${req.user.avatar_url}`} alt={req.user.name} style={{ width:22, height:22, borderRadius:6, objectFit:'cover', flexShrink:0 }} />
                            : <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, background: dark ? theme.primarySoft : '#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:theme.primary }}>{initials(req.user.name)}</div>
                        }
                        <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>{req.user.name}</span>
                        {req.user.position   && <span style={{ fontSize:11, color:theme.textMute }}>{req.user.position}</span>}
                        {req.user.department && <span style={{ fontSize:11, color:'#6366f1' }}>{req.user.department}</span>}
                    </div>
                )}

                <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:9, flexWrap:'wrap' }}>
                    {isMultiDay ? (
                        <>
                            <span style={{ ...chipLabel, color:theme.textMute }}>{tr('overtime.labels.date')}</span>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                <span style={{ ...chipValue, color:theme.text }}>{fmtDate(req.start_date)}</span>
                                <span style={{ fontSize:11, color:theme.primary, fontWeight:700 }}>({to12h(req.start_time)})</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                <span style={{ ...chipValue, color:theme.text }}>{fmtDate(req.end_date)}</span>
                                <span style={{ fontSize:11, color:theme.primary, fontWeight:700 }}>({to12h(req.end_time)})</span>
                            </span>
                        </>
                    ) : (
                        <>
                            <span style={{ display:'inline-flex', alignItems:'baseline' }}>
                                <span style={{ ...chipLabel, color:theme.textMute }}>{tr('overtime.labels.date')}</span>
                                <span style={{ ...chipValue, color:theme.text }}>{fmtDate(req.start_date)}</span>
                            </span>
                            <span style={{ color:theme.border, fontSize:12 }}>·</span>
                            <span style={{ display:'inline-flex', alignItems:'baseline' }}>
                                <span style={{ ...chipLabel, color:theme.textMute }}>{tr('overtime.labels.time')}</span>
                                <span style={{ ...chipValue, color:theme.primary }}>{to12h(req.start_time)} — {to12h(req.end_time)}</span>
                            </span>
                        </>
                    )}
                </div>

                {visibleSegments.length > 0 && (
                    <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
                        {groupedDates.map(date => (
                            <div key={date}>
                                {hasMultiGroup && <div style={{ fontSize:10, color:theme.textMute, marginBottom:3, fontStyle:'italic' }}>{fmtDate(date)}</div>}
                                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                                    {grouped[date].map(seg => {
                                        const oc  = getOTColor(seg.overtime_policy?.title);
                                        const hrs = fmtHrs(req.status === 'approved' ? seg.hours_approved : seg.hours);
                                        return (
                                            <div key={seg.id} style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginLeft:'30px' }}>
                                                <span style={{ width:6, height:6, borderRadius:'50%', background:oc.color, flexShrink:0, marginRight:2 }} />
                                                <span style={{ fontSize:11, fontWeight:700, color:oc.color }}>{otPolicyTitle(tr, seg.overtime_policy?.title)}</span>
                                                <span style={{ fontSize:11, color:theme.textMute }}>{to12h(seg.start_time)}–{to12h(seg.end_time)}</span>
                                                <span style={{ fontSize:10, fontWeight:800, color:oc.color, background: dark ? oc.bgDark : oc.bg, borderRadius:99, padding:'1px 7px' }}>{hrs}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {Object.keys(typeTotals).length > 1 && (
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop:4, paddingTop:5, borderTop:`1px dashed ${theme.border}` }}>
                                <span style={{ fontSize:9, fontWeight:700, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.05em' }}>{tr('overtime.labels.total')}</span>
                                {Object.entries(typeTotals).map(([typeTitle, h]) => {
                                    const tc = getOTColor(typeTitle);
                                    return (
                                        <span key={typeTitle} style={{ fontSize:11, fontWeight:700, color:tc.color, background: dark ? tc.bgDark : tc.bg, borderRadius:99, padding:'1px 8px' }}>
                                            {otPolicyTitle(tr, typeTitle).replace(' OT', '')} {fmtHrs(h)}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {req.reason && (
                    <div style={{ display:'inline-flex', alignItems:'baseline', marginTop:7 }}>
                        <span style={{ ...chipLabel, color:theme.textMute }}>{tr('overtime.labels.reason')}</span>
                        <span style={{ fontSize:12, fontWeight:500, color:theme.textSoft }}>{req.reason}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── ✨ MiniCalendar ────────────────────────────────────────────
function MiniCalendar({ month, year, attendanceMap, calLeaveDateMap, publicHolidays, otDateSet, dark, theme }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [calMonth,     setCalMonth]     = useState(month);
    const [calYear,      setCalYear]      = useState(year);
    const [loading,      setLoading]      = useState(false);
    const [calData,      setCalData]      = useState({ attendanceMap, calLeaveDateMap, publicHolidays, otDateSet });

    const prevFilterRef = useRef({ month, year });
    useEffect(() => {
        const prev = prevFilterRef.current;
        if (prev.month !== month || prev.year !== year) {
            prevFilterRef.current = { month, year };
            navigateTo(month, year);
        }
    }, [month, year]);

    useEffect(() => {
        if (calMonth === month && calYear === year) {
            setCalData({ attendanceMap, calLeaveDateMap, publicHolidays, otDateSet });
        }
    }, [attendanceMap, calLeaveDateMap, publicHolidays, otDateSet, calMonth, calYear, month, year]);

    async function navigateTo(m, y) {
        setCalMonth(m); setCalYear(y); setSelectedDate(null);
        if (m === month && y === year) {
            setCalData({ attendanceMap, calLeaveDateMap, publicHolidays, otDateSet });
            return;
        }
        setLoading(true);
        try {
            const res = await window.apiFetch(`/payroll/overtimes/calendar-data?month=${m}&year=${y}`);
            if (res.ok) {
                const data = await res.json();
                setCalData({ attendanceMap: data.attendanceMap || {}, calLeaveDateMap: data.calLeaveDateMap || {}, publicHolidays: data.publicHolidays || [], otDateSet: data.otDateSet || [] });
            }
        } catch (err) { console.error('MiniCalendar fetch failed:', err); }
        finally { setLoading(false); }
    }

    function prevMonth() { navigateTo(calMonth === 1 ? 12 : calMonth - 1, calMonth === 1 ? calYear - 1 : calYear); }
    function nextMonth() { navigateTo(calMonth === 12 ? 1 : calMonth + 1, calMonth === 12 ? calYear + 1 : calYear); }

    const today       = new Date().toISOString().split('T')[0];
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
        if (isSel)                                                   { bg = theme.primary; color = '#fff'; }
        else if (holiday)                                             { bg = dark ? 'rgba(217,119,6,0.22)' : '#fef3c7'; color = dark ? '#fbbf24' : '#b45309'; }
        else if (leave)                                               { bg = dark ? 'rgba(124,58,237,0.22)' : '#ede9fe'; color = dark ? '#a78bfa' : '#6d28d9'; }
        else if (att?.status === 'present' || att?.status === 'late') { bg = dark ? 'rgba(5,150,105,0.22)'  : '#d1fae5'; color = dark ? '#34d399' : '#065f46'; }
        else if (att?.status === 'absent')                            { bg = dark ? 'rgba(248,113,113,0.18)': '#fee2e2'; color = dark ? '#f87171' : '#b91c1c'; }
        else if (isWeekend)                                           { color = theme.textMute; }
        if (isTod && !isSel) outline = `2px solid ${theme.primary}`;
        return { bg, color, outline };
    }

    // အသစ်
    const detail = useMemo(() => {
        if (!selectedDate) return null;
        const otInfo = (calData.otDateSet || []).find(o => o.date === selectedDate) || null;
        return {
            att:     calData.attendanceMap?.[selectedDate],
            leaves:  calData.calLeaveDateMap?.[selectedDate] || [],
            holiday: holidayMap[selectedDate],
            otInfo,   // { date, status, hours } or null
            date:    selectedDate,
        };
    }, [selectedDate, calData, holidayMap]);

    return (
        <div style={{ width:220, flexShrink:0, background: dark ? 'rgba(255,255,255,0.03)' : theme.calBg, borderLeft:`1px solid ${theme.border}`, display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'14px 12px 8px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <button onClick={prevMonth} style={{ width:22, height:22, borderRadius:5, border:`1px solid ${theme.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:theme.textMute, padding:0, transition:'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; e.currentTarget.style.color = theme.text; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMute; }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span style={{ fontSize:12, fontWeight:700, color:theme.textSoft, display:'flex', alignItems:'center', gap:5 }}>
                        {loading && <span style={{ width:10, height:10, border:`1.5px solid ${theme.border}`, borderTopColor:theme.primary, borderRadius:'50%', display:'inline-block', animation:'otSpin 0.7s linear infinite', flexShrink:0 }} />}
                        {MONTHS[calMonth - 1]} {calYear}
                    </span>
                    <button onClick={nextMonth} style={{ width:22, height:22, borderRadius:5, border:`1px solid ${theme.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:theme.textMute, padding:0, transition:'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'; e.currentTarget.style.color = theme.text; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMute; }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
                    {DAY_LABELS.map(d => <div key={d} style={{ fontSize:9, fontWeight:700, color:theme.textMute, textAlign:'center', padding:'2px 0' }}>{d}</div>)}
                </div>
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
                            <div key={day} onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
                                style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:5, cursor:'pointer', background:bg, color, outline, outlineOffset:'-1px', fontSize:10, fontWeight:isSel?700:500, position:'relative', transition:'all 0.12s' }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.opacity = '0.75'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                {day}
                                {hasOT && <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:3, height:3, borderRadius:'50%', background: isSel ? '#fff' : (dark ? '#f59e0b' : '#d97706') }} />}
                            </div>
                        );
                    })}
                </div>
                <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:'4px 10px' }}>
                    {[
                        { color: dark?'#34d399':'#065f46', bg: dark?'rgba(5,150,105,0.22)':'#d1fae5', label:'Attended' },
                        { color: dark?'#a78bfa':'#6d28d9', bg: dark?'rgba(124,58,237,0.22)':'#ede9fe', label:'Leave'    },
                        { color: dark?'#fbbf24':'#b45309', bg: dark?'rgba(217,119,6,0.22)' :'#fef3c7', label:'Holiday'  },
                        { color: dark?'#f59e0b':'#d97706', dot:true, label:'OT' },
                    ].map(l => (
                        <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                            {l.dot ? <div style={{ width:6, height:6, borderRadius:'50%', background:l.color, flexShrink:0 }} /> : <div style={{ width:10, height:10, borderRadius:3, background:l.bg, border:`1px solid ${l.color}33`, flexShrink:0 }} />}
                            <span style={{ fontSize:9, color:theme.textMute }}>{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ flex:1, borderTop:`1px solid ${theme.border}`, padding:'12px', minHeight:120 }}>
                {!detail ? (
                    <div style={{ fontSize:11, color:theme.textMute, textAlign:'center', marginTop:16, lineHeight:1.6 }}>Click a date<br/>to see details</div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        <div>
                            <div style={{ fontSize:13, fontWeight:700, color:theme.text }}>{new Date(detail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</div>
                            {detail.date === today && <span style={{ fontSize:9, fontWeight:700, background:theme.primarySoft, color:theme.primary, borderRadius:4, padding:'1px 6px' }}>Today</span>}
                        </div>
                        {detail.holiday && (
                            <div style={{ display:'flex', alignItems:'center', gap:6, background: dark?'rgba(217,119,6,0.15)':'#fef3c7', borderRadius:6, padding:'5px 8px' }}>
                                <div style={{ width:6, height:6, borderRadius:'50%', background: dark?'#fbbf24':'#d97706', flexShrink:0 }} />
                                <span style={{ fontSize:10, fontWeight:600, color: dark?'#fbbf24':'#92400e' }}>{detail.holiday}</span>
                            </div>
                        )}
                        {detail.att && (
                            <div style={{ fontSize:10, color:theme.textSoft, display:'flex', flexDirection:'column', gap:3 }}>
                                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:theme.textMute }}>Status</span><span style={{ fontWeight:600, color: detail.att.status==='present'?(dark?'#34d399':'#059669'):detail.att.status==='late'?(dark?'#fbbf24':'#d97706'):(dark?'#f87171':'#dc2626') }}>{detail.att.status}</span></div>
                                {detail.att.check_in  && <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:theme.textMute }}>In</span>   <span style={{ fontWeight:600, color:theme.text }}>{detail.att.check_in}</span></div>}
                                {detail.att.check_out && <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:theme.textMute }}>Out</span>  <span style={{ fontWeight:600, color:theme.text }}>{detail.att.check_out}</span></div>}
                                {detail.att.work_hours && <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:theme.textMute }}>Hours</span><span style={{ fontWeight:600, color: dark?'#34d399':'#059669' }}>{detail.att.work_hours}h</span></div>}
                                {detail.att.late_minutes > 0 && <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:theme.textMute }}>Late</span><span style={{ fontWeight:600, color: dark?'#fbbf24':'#d97706' }}>{detail.att.late_minutes}m</span></div>}
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
                        {!detail.att && !detail.holiday && detail.leaves.length === 0 && !detail.hasOT && <div style={{ fontSize:10, color:theme.textMute }}>No records for this day.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function OvertimeIndex({
    requests,
    overtimePolicies,
    employees,
    filters,
    selectedMonth,
    selectedYear,
    userAssignments  = [],
    // ✨ Calendar props
    attendanceMap    = {},
    calLeaveDateMap  = {},
    publicHolidays   = [],
    otDateSet        = [],
}) {
    const { auth }   = usePage().props;
    const { t: tr }  = useTranslation();
    const user       = auth?.user;
    const roleName   = user?.role?.name || 'employee';
    const canApprove = ['management','hr','admin'].includes(roleName);
    const canViewAll = ['hr','admin','management'].includes(roleName);

    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [mainTab,       setMainTab]       = useState('my');
    const [month,         setMonth]         = useState(selectedMonth || new Date().getMonth() + 1);
    const [year,          setYear]          = useState(selectedYear  || new Date().getFullYear());
    const [statusFilter,  setStatusFilter]  = useState(filters?.status || '');
    const [showModal,     setShowModal]     = useState(false);
    const [confirmModal,  setConfirmModal]  = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleStatusFilter    = v => { setStatusFilter(v); router.get('/payroll/overtimes', { month, year, status:v }, { preserveState:true, preserveScroll:true }); };
    const handleMonthYearFilter = (m, y) => router.get('/payroll/overtimes', { month:m, year:y, status:statusFilter }, { preserveScroll:true });

    const handleApprove = (req, segs) => {
        setActionLoading(true);
        router.patch(`/payroll/overtimes/${req.id}/approve`, { segments: segs }, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError: (errors) => { setActionLoading(false); setConfirmModal(null); window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: errors?.message || tr('overtime.messages.requestNoLongerExists'), type:'error' } })); },
        });
    };

    const handleReject = req => {
        setActionLoading(true);
        router.patch(`/payroll/overtimes/${req.id}/reject`, {}, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError: (errors) => { setActionLoading(false); setConfirmModal(null); window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: errors?.message || tr('overtime.messages.requestNoLongerExists'), type:'error' } })); },
        });
    };

    function handleDelete(req) {
        setActionLoading(true);
        router.delete(`/payroll/overtimes/${req.id}`, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError:   () => { setActionLoading(false); setConfirmModal(null); window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: tr('overtime.messages.requestCouldNotBeDeleted'), type:'error' } })); },
        });
    }

    const myRequests       = requests.data.filter(r => r.user_id === user?.id);
    const approvalRequests = requests.data.filter(r => r.approver_id === user?.id && r.user_id !== user?.id && r.status === 'pending');
    const pendingCount     = approvalRequests.length;

    const displayList = mainTab === 'approvals' ? approvalRequests : mainTab === 'all' ? requests.data : myRequests;

    const monthOpts  = MONTHS.map((m, i) => ({ value:i+1, label:tr(`overtime.months.${m}`) }));
    const yearOpts   = [2024,2025,2026,2027].map(y => ({ value:y, label:String(y) }));
    const statusOpts = [
        { value:'',         label:tr('overtime.filters.allStatus') },
        { value:'pending',  label:tr('overtime.status.pending') },
        { value:'approved', label:tr('overtime.status.approved') },
        { value:'rejected', label:tr('overtime.status.rejected') },
    ];

    const tabs = [
        { key:'my',        label:tr('overtime.tabs.myRequests'),      count:myRequests.length,  alert:false },
        ...(canApprove ? [{ key:'approvals', label:tr('overtime.tabs.pendingApprovals'), count:pendingCount, alert:pendingCount>0 }] : []),
        ...(canViewAll  ? [{ key:'all',      label:tr('overtime.tabs.allRequests'),      count:requests.total, alert:false }] : []),
    ];

    return (
        <AppLayout title={tr('overtime.pageTitle')}>
            <Head title={tr('overtime.headTitle')}/>
            <style>{`
                @keyframes otDropUp { from { opacity:0; transform:translateY(6px); }  to { opacity:1; transform:translateY(0); } }
                @keyframes otDrop   { from { opacity:0; transform:translateY(-7px); } to { opacity:1; transform:translateY(0); } }
                @keyframes otPopIn  { from { opacity:0; transform:scale(0.96); }      to { opacity:1; transform:scale(1); } }
                @keyframes otSpin   { to { transform:rotate(360deg); } }
                .ot-hide::-webkit-scrollbar { display:none; }
                .ot-hide { scrollbar-width:none; -ms-overflow-style:none; }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                {/* ── Policy cards ── */}
                <OTPolicyCards overtimePolicies={overtimePolicies} dark={dark} theme={theme} tr={tr}/>

                {/* ── Filters + button ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <PremiumDropdown options={monthOpts}  value={month}        onChange={v => { const m=Number(v); setMonth(m); handleMonthYearFilter(m,year); }} theme={theme} dark={dark} width={145}/>
                        <PremiumDropdown options={yearOpts}   value={year}         onChange={v => { const y=Number(v); setYear(y); handleMonthYearFilter(month,y); }} theme={theme} dark={dark} width={100}/>
                        <PremiumDropdown options={statusOpts} value={statusFilter} onChange={handleStatusFilter} theme={theme} dark={dark} width={145}/>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
                        style={{ background:`linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`, color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 22px ${theme.primary}44`, transition:'all 0.15s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        {tr('overtime.actions.requestOvertime')}
                    </button>
                </div>

                {/* ── ✨ Tabbed panel + MiniCalendar ── */}
                <div style={{ background: dark ? theme.panelSolid : '#fff', borderRadius:18, border:`1px solid ${theme.border}`, boxShadow:theme.shadowSoft, overflow:'hidden', display:'flex', minHeight:320 }}>

                    {/* Left: tabs + list */}
                    <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>

                        {/* Tab bar */}
                        <div className="ot-hide" style={{ display:'flex', borderBottom:`1px solid ${theme.border}`, padding:'0 4px', overflowX:'auto' }}>
                            {tabs.map(tab => {
                                const isActive = mainTab === tab.key;
                                return (
                                    <button key={tab.key} onClick={() => setMainTab(tab.key)} style={{ padding:'14px 18px', fontSize:13, fontWeight: isActive ? 800 : 500, color: isActive ? theme.primary : theme.textMute, background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap', borderBottom: isActive ? `2.5px solid ${theme.primary}` : '2.5px solid transparent', display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}>
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

                        {/* List */}
                        {displayList.length === 0 ? (
                            <div style={{ padding:'56px 24px', textAlign:'center' }}>
                                <div style={{ fontSize:36, marginBottom:12 }}>{mainTab === 'approvals' ? '🎉' : '⏰'}</div>
                                <div style={{ fontSize:14, fontWeight:600, color:theme.textSoft, marginBottom:4 }}>{mainTab === 'approvals' ? tr('overtime.empty.noPendingApprovals') : tr('overtime.empty.noOvertimeRequestsFound')}</div>
                                <div style={{ fontSize:12, color:theme.textMute }}>{mainTab === 'approvals' ? tr('overtime.empty.allCaughtUp') : tr('overtime.empty.clickRequestOvertime')}</div>
                            </div>
                        ) : displayList.map((req, idx) => (
                            <OTRow key={req.id} req={req} dark={dark} theme={theme} canApprove={canApprove} userId={user?.id}
                                onApprove={() => setConfirmModal({ type:'approve', req })}
                                onReject ={() => setConfirmModal({ type:'reject',  req })}
                                onDelete ={() => setConfirmModal({ type:'delete',  req })}
                                isLast={idx === displayList.length - 1} tr={tr}/>
                        ))}

                        {/* Pagination */}
                        {mainTab === 'all' && requests.last_page > 1 && (
                            <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'16px 20px', borderTop:`1px solid ${theme.border}` }}>
                                {Array.from({ length:requests.last_page }, (_,i) => i+1).map(pg => {
                                    const a = requests.current_page === pg;
                                    return <button key={pg} onClick={() => router.get('/payroll/overtimes', { page:pg, month, year, status:statusFilter })} style={{ width:34, height:34, borderRadius:10, border:`1px solid ${a ? theme.primary : theme.border}`, background: a ? theme.primary : 'transparent', color: a ? '#fff' : theme.textSoft, fontWeight: a ? 700 : 500, cursor:'pointer', fontSize:13 }}>{pg}</button>;
                                })}
                            </div>
                        )}
                    </div>

                    {/* ✨ Right: MiniCalendar */}
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

            {showModal    && <OTRequestModal employees={employees} roleName={roleName} dark={dark} theme={theme} userAssignments={userAssignments} tr={tr} onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)}/>}
            {confirmModal && <ConfirmModal   type={confirmModal.type} req={confirmModal.req} loading={actionLoading} dark={dark} theme={theme} tr={tr} onCancel={() => setConfirmModal(null)} onApprove={segs => handleApprove(confirmModal.req, segs)} onReject={() => handleReject(confirmModal.req)} onDelete={() => handleDelete(confirmModal.req)}/>}
        </AppLayout>
    );
}

// ── OT Request Modal ───────────────────────────────────────────
function OTRequestModal({ employees, roleName, dark, theme, onClose, onSuccess, userAssignments = [], tr }) {
    const isAdmin = roleName === 'admin';
    const [form,   setForm]   = useState({ start_date:'', start_time:'', end_date:'', end_time:'', reason:'', approver_id: employees[0]?.id || '', project_id:'' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const set = (k, v) => {
        setForm(f => { const u={...f,[k]:v}; if(k==='start_date'&&u.end_date&&u.end_date<v) u.end_date=v; return u; });
        if (errors[k]) setErrors(e => ({...e,[k]:''}));
    };

    const summary = useMemo(() => {
        if (!form.start_date||!form.start_time||!form.end_date||!form.end_time) return null;
        try {
            const s=new Date(`${form.start_date}T${form.start_time}`), e=new Date(`${form.end_date}T${form.end_time}`);
            if(e<=s) return null;
            const totalMins = Math.round((e - s) / 60000);
            const ph = Math.floor(totalMins / 60), pm = totalMins % 60;
            const hrsLabel = ph === 0 ? `${pm}m` : pm === 0 ? `${ph}hr` : `${ph}hr ${pm}m`;
            return { hrs:hrsLabel, days: Math.ceil((new Date(form.end_date)-new Date(form.start_date))/86400000)+1, isMulti: form.start_date!==form.end_date };
        } catch { return null; }
    }, [form.start_date,form.start_time,form.end_date,form.end_time]);

    const validate = () => {
        const e={};
        if(!form.start_date)    e.start_date   = tr('overtime.validation.startDateRequired');
        if(!form.start_time)    e.start_time   = tr('overtime.validation.startTimeRequired');
        if(!form.end_date)      e.end_date     = tr('overtime.validation.endDateRequired');
        if(!form.end_time)      e.end_time     = tr('overtime.validation.endTimeRequired');
        if(!form.reason.trim()) e.reason       = tr('overtime.validation.reasonRequired');
        if(!isAdmin && !form.approver_id) e.approver_id = tr('overtime.validation.selectApprover');
        if(userAssignments.length > 0 && !form.project_id) e.project_id = tr('overtime.validation.selectProjectForOT');
        if(form.start_date && form.start_time && form.end_date && form.end_time) {
            const start = new Date(`${form.start_date}T${form.start_time}`);
            const end   = new Date(`${form.end_date}T${form.end_time}`);
            if(end <= start) { e.end_date = tr('overtime.validation.endAfterStart'); e.end_time = tr('overtime.validation.endTimeAfterStartTime'); }
        }
        return e;
    };

    const handleSubmit = () => {
        const e=validate(); if(Object.keys(e).length){setErrors(e);return;}
        setSaving(true);
        router.post('/payroll/overtimes', form, {
            onSuccess: () => { setSaving(false); onSuccess(); },
            onError: errs => { setSaving(false); const m={}; ['start_date','start_time','end_date','end_time','reason'].forEach(k=>{if(errs[k])m[k]=errs[k];}); setErrors(m); },
        });
    };

    const inp = err => ({ width:'100%', border:`1.5px solid ${err?theme.danger:theme.inputBorder}`, borderRadius:10, padding:'9px 12px', fontSize:13, color:theme.text, outline:'none', boxSizing:'border-box', background: dark?theme.inputBg:'#fff', transition:'border-color 0.15s', fontFamily:'inherit' });
    const lbl = { fontSize:11, fontWeight:700, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 };

    const approverOptions = [
        { value:'', label:tr('overtime.placeholders.selectApprover'), disabled:true },
        ...employees.map(e => ({ value:e.id, label:e.name })),
    ];

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target===e.currentTarget&&onClose()}>
            <div style={{ background: dark?'#0f1b34':'#fff', borderRadius:22, width:'100%', maxWidth:510, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:'otPopIn 0.22s ease' }}>
                <div style={{ background:theme.modalHeader, padding:'20px 24px 18px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%' }}/>
                    <div style={{ position:'absolute', bottom:-30, left:20, width:90, height:90, borderRadius:'50%' }}/>
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>⏰</div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>{tr('overtime.modal.overtimeManagement')}</div>
                                <div style={{ fontSize:17, fontWeight:900, color:'#fff' }}>{tr('overtime.actions.requestOvertime')}</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.16)', border:'none', cursor:'pointer', fontSize:20, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                    </div>
                </div>
                <div className="ot-hide" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto', flex:1 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div><label style={lbl}>{tr('overtime.fields.startDate')}</label><input type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)} style={inp(errors.start_date)}/>{errors.start_date&&<ErrMsg msg={errors.start_date} theme={theme}/>}</div>
                        <div><label style={lbl}>{tr('overtime.fields.startTime')}</label><TimePicker value={form.start_time} onChange={v=>set('start_time',v)} theme={theme} dark={dark} error={errors.start_time}/>{errors.start_time&&<ErrMsg msg={errors.start_time} theme={theme}/>}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div><label style={lbl}>{tr('overtime.fields.endDate')}</label><input type="date" value={form.end_date} min={form.start_date||undefined} onChange={e=>set('end_date',e.target.value)} style={inp(errors.end_date)}/>{errors.end_date&&<ErrMsg msg={errors.end_date} theme={theme}/>}</div>
                        <div><label style={lbl}>{tr('overtime.fields.endTime')}</label><TimePicker value={form.end_time} onChange={v=>set('end_time',v)} theme={theme} dark={dark} error={errors.end_time}/>{errors.end_time&&<ErrMsg msg={errors.end_time} theme={theme}/>}</div>
                    </div>
                    {summary && (
                        <div style={{ background: summary.isMulti?(dark?'rgba(251,191,36,0.08)':'#fefce8'):(dark?theme.primarySoft:'#f3e8ff'), border:`1px solid ${summary.isMulti?(dark?'rgba(251,191,36,0.25)':'#fde047'):(dark?'rgba(139,92,246,0.3)':'#ddd6fe')}`, borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:18 }}>{summary.isMulti?'📅':'⏱️'}</span>
                            <div>
                                <div style={{ fontSize:12, fontWeight:800, color: summary.isMulti?theme.warning:theme.primary }}>{summary.isMulti?tr('overtime.summary.multiDay').replace('{{days}}', summary.days):tr('overtime.summary.sameDayOT')} <span style={{ marginLeft:8 }}>{tr('overtime.summary.totalHours').replace('{{hrs}}', summary.hrs)}</span></div>
                                <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>{to12h(form.start_time)} ({form.start_date}) → {to12h(form.end_time)} ({form.end_date}) · {tr('overtime.summary.autoSplitPerShift')}</div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label style={lbl}>{tr('overtime.labels.project')}</label>
                        {userAssignments.length === 0 ? (
                            <div style={{ padding:'10px 14px', borderRadius:10, fontSize:12, color:theme.textMute, background: dark ? theme.inputBg : '#f8fafc', border:`1px solid ${theme.inputBorder}` }}>{tr('overtime.empty.noActiveProjectsAssigned')}</div>
                        ) : (
                            <PremiumDropdown options={[{ value:'', label:tr('overtime.placeholders.pleaseSelectProject') }, ...userAssignments.map(a => ({ value:String(a.project_id), label:a.project_name }))]} value={form.project_id} onChange={v => set('project_id', v)} placeholder={tr('overtime.placeholders.selectProject')} theme={theme} dark={dark} width="100%"/>
                        )}
                        {errors.project_id && <ErrMsg msg={errors.project_id} theme={theme}/>}
                    </div>
                    <div><label style={lbl}>{tr('overtime.labels.reason')}</label><textarea value={form.reason} onChange={e=>set('reason',e.target.value)} rows={3} placeholder={tr('overtime.placeholders.describeReason')} className="ot-hide" style={{...inp(errors.reason),resize:'none'}}/>{errors.reason&&<ErrMsg msg={errors.reason} theme={theme}/>}</div>
                    {!isAdmin && employees.length > 0 && (
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            <label style={lbl}>{tr('overtime.labels.approver')}</label>
                            <PremiumDropdown options={approverOptions} value={form.approver_id} onChange={v => set('approver_id', v)} placeholder={tr('overtime.placeholders.selectApprover')} theme={theme} dark={dark} width="100%"/>
                            {errors.approver_id && <ErrMsg msg={errors.approver_id} theme={theme}/>}
                        </div>
                    )}
                    {!isAdmin && employees.length === 0 && (
                        <div style={{ background: dark ? 'rgba(245,158,11,0.1)' : '#fff7ed', border:`1px solid ${dark ? 'rgba(245,158,11,0.25)' : '#fed7aa'}`, borderRadius:12, padding:'12px 16px' }}>
                            <div style={{ fontSize:12, fontWeight:700, color: dark ? '#f59e0b' : '#c2410c' }}>⚠ {tr('overtime.empty.noApproverAvailable')}</div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:4 }}>{tr('overtime.empty.noApproverFound')}</div>
                        </div>
                    )}
                    {isAdmin && <div style={{ background: dark?theme.successSoft:'#ecfdf5', border:`1px solid ${dark?'rgba(16,185,129,0.3)':'#6ee7b7'}`, borderRadius:10, padding:'9px 13px', fontSize:12, color:theme.success, fontWeight:600 }}>{tr('overtime.messages.adminAutoApproved')}</div>}
                </div>
                <div style={{ borderTop:`1px solid ${theme.border}`, padding:'14px 24px', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
                    <button onClick={onClose} disabled={saving} style={{ background: dark?theme.panelSoft:'#fff', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, color:theme.textSoft, cursor:'pointer' }}>{tr('overtime.actions.cancel')}</button>
                    <button onClick={handleSubmit} disabled={saving} style={{ background:theme.modalHeader, border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor: saving?'not-allowed':'pointer', opacity: saving?0.65:1, display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 24px ${theme.primary}44`, transition:'all 0.15s' }}>
                        {saving&&<span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'otSpin 0.7s linear infinite' }}/>}
                        {saving?tr('overtime.actions.submitting'):tr('overtime.actions.submitRequest')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Confirm Modal ──────────────────────────────────────────────
function ConfirmModal({ type, req, loading, dark, theme, onCancel, onApprove, onReject, onDelete, tr }) {
    const isApprove = type === 'approve';
    const isDelete  = type === 'delete';
    const segments  = req.segments || [];
    const [segHours, setSegHours] = useState(segments.reduce((a,s) => ({...a,[s.id]:s.hours}), {}));
    const total = Object.values(segHours).reduce((s,h) => s + parseFloat(h||0), 0);

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background: dark?'#0f1b34':'#fff', borderRadius:22, width:'100%', maxWidth:460, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:'otPopIn 0.22s ease' }}>
                <div style={{ height:4, background: isApprove ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#dc2626,#ef4444)', flexShrink:0 }}/>
                <div className="ot-hide" style={{ overflowY:'auto', padding:'22px 24px', flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                        <div style={{ width:46, height:46, borderRadius:14, flexShrink:0, background: isApprove?(dark?theme.successSoft:'#d1fae5'):(dark?theme.dangerSoft:'#fee2e2'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                            {isDelete ? '🗑' : isApprove ? '✓' : '✕'}
                        </div>
                        <div>
                            <div style={{ fontSize:16, fontWeight:900, color:theme.text }}>{isDelete ? tr('overtime.confirm.deleteOvertimeRequest') : isApprove ? tr('overtime.confirm.approveOvertime') : tr('overtime.confirm.rejectOvertime')}</div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>{isDelete ? tr('overtime.confirm.actionCannotBeUndone') : isApprove ? tr('overtime.confirm.adjustApprovedHours') : tr('overtime.confirm.employeeWillBeNotified')}</div>
                        </div>
                    </div>
                    <div style={{ background: dark?theme.panelSoft:'#f8fafc', border:`1px solid ${theme.border}`, borderRadius:14, padding:'13px 15px', marginBottom: isApprove&&!isDelete ? 18 : 0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                            <span style={{ fontSize:13, fontWeight:800, color:theme.text }}>{isDelete ? tr('overtime.confirm.yourRequest') : req.user?.name}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:theme.primary, background: dark?theme.primarySoft:'#ede9fe', borderRadius:6, padding:'1px 8px' }}>{fmtHrs(req.hours_requested)} total</span>
                        </div>
                        <div style={{ fontSize:12, color:theme.textSoft, fontWeight:600 }}>
                            {req.end_date && req.end_date !== req.start_date
                                ? <>{fmtDate(req.start_date)} {to12h(req.start_time)} — {fmtDate(req.end_date)} {to12h(req.end_time)}</>
                                : <>{fmtDate(req.start_date)} · {to12h(req.start_time)} — {to12h(req.end_time)}</>
                            }
                        </div>
                        {req.reason && <div style={{ fontSize:11, color:theme.textMute, fontStyle:'italic', marginTop:6, paddingTop:6, borderTop:`1px solid ${theme.border}` }}>"{req.reason}"</div>}
                    </div>
                    {isApprove && segments.length > 0 && (
                        <div>
                            <div style={{ fontSize:11, fontWeight:700, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{tr('overtime.confirm.segmentsAdjustHours')}</div>
                            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                {segments.map(seg => {
                                    const c   = getOTColor(seg.overtime_policy?.title);
                                    const max = parseFloat(seg.hours) || 0;
                                    return (
                                        <div key={seg.id} style={{ background: dark?c.bgDark:c.bg, border:`1px solid ${c.border}`, borderRadius:12, padding:'10px 13px', display:'flex', alignItems:'center', gap:10 }}>
                                            <div style={{ flex:1 }}>
                                                <div style={{ fontSize:12, fontWeight:700, color:c.color }}>{otPolicyTitle(tr, seg.overtime_policy?.title)}</div>
                                                <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>
                                                    {seg.segment_date && <span style={{ marginRight:6, fontWeight:600, color:theme.textSoft }}>{fmtDate(seg.segment_date)}</span>}
                                                    {to12h(seg.start_time)} → {to12h(seg.end_time)}
                                                    <span style={{ marginLeft:6, color:theme.textMute }}>{tr('overtime.labels.req')}: {fmtHrs(seg.hours)}</span>
                                                </div>
                                            </div>
                                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                <span style={{ fontSize:11, color:theme.textMute }}>{tr('overtime.actions.approve')}</span>
                                                <input type="number" value={segHours[seg.id] ?? seg.hours} min={0} max={max} step={0.01}
                                                    onKeyDown={e => { const ok=['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','.']; if(!ok.includes(e.key)&&!/^\d$/.test(e.key))e.preventDefault(); if(e.key==='.'&&String(segHours[seg.id]??seg.hours).includes('.'))e.preventDefault(); }}
                                                    onChange={e => { const r=e.target.value; if(r===''||r==='.'){setSegHours(p=>({...p,[seg.id]:r}));return;} const n=parseFloat(r); if(isNaN(n))return; setSegHours(p=>({...p,[seg.id]:Math.round(Math.min(n,max)*100)/100})); }}
                                                    style={{ width:64, border:`1.5px solid ${c.border}`, borderRadius:8, padding:'5px 8px', fontSize:12, fontWeight:700, color:c.color, textAlign:'center', background: dark?'rgba(255,255,255,0.08)':'#fff' }}/>
                                                <span style={{ fontSize:11, color:theme.textMute }}>{tr('overtime.units.hrs')}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8, paddingTop:4 }}>
                                    <span style={{ fontSize:12, color:theme.textMute }}>{tr('overtime.labels.totalApproved')}</span>
                                    <span style={{ fontSize:15, fontWeight:900, color:theme.success }}>{fmtHrs(total)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ borderTop:`1px solid ${theme.border}`, padding:'14px 24px', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
                    <button onClick={onCancel} disabled={loading} style={{ background: dark?theme.panelSoft:'#fff', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, color:theme.textSoft, cursor:'pointer' }}>{tr('overtime.actions.cancel')}</button>
                    {isDelete ? (
                        <button onClick={onDelete} disabled={loading} style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor:'pointer', opacity:loading?0.6:1, boxShadow:'0 4px 14px rgba(220,38,38,0.35)' }}>
                            {loading ? tr('overtime.actions.deleting') : `🗑 ${tr('overtime.actions.delete')}`}
                        </button>
                    ) : isApprove ? (
                        <button onClick={() => onApprove(segments.map(s => ({id:s.id, hours_approved:parseFloat(segHours[s.id]||0)})))} disabled={loading} style={{ background:'linear-gradient(135deg,#059669,#10b981)', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor:'pointer', opacity:loading?0.6:1, boxShadow:'0 4px 14px rgba(5,150,105,0.35)' }}>
                            {loading ? tr('overtime.actions.approving') : tr('overtime.actions.approveWithIcon')}
                        </button>
                    ) : (
                        <button onClick={onReject} disabled={loading} style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor:'pointer', opacity:loading?0.6:1, boxShadow:'0 4px 14px rgba(220,38,38,0.35)' }}>
                            {loading ? tr('overtime.actions.rejecting') : tr('overtime.actions.rejectWithIcon')}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── TimePicker ─────────────────────────────────────────────────
function TimePicker({ value, onChange, theme, dark, error }) {
    const hours   = Array.from({length:12}, (_,i) => String(i+1).padStart(2,'0'));
    const minutes = Array.from({length:60}, (_,i) => String(i).padStart(2,'0'));

    const parseVal = (v) => {
        if (!v) return null;
        const [hStr, mStr] = v.split(':');
        const h24 = parseInt(hStr);
        const p   = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        return { h: String(h12).padStart(2,'0'), m: (mStr||'00').slice(0,2), p };
    };

    const parsed = parseVal(value);
    const h = parsed?.h ?? '--';
    const m = parsed?.m ?? '--';
    const p = parsed?.p ?? 'AM';

    const emit = (nh, nm, np) => {
        const safeH = nh === '--' ? '08' : nh;
        const safeM = nm === '--' ? '00' : nm;
        let h24 = parseInt(safeH);
        if (isNaN(h24)) return;
        if (np === 'PM' && h24 !== 12) h24 += 12;
        if (np === 'AM' && h24 === 12) h24 = 0;
        onChange(`${String(h24).padStart(2,'0')}:${safeM}`);
    };

    const sel = { height:40, border:'none', background:'transparent', color:theme.text, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', outline:'none', appearance:'none', WebkitAppearance:'none', MozAppearance:'none', textAlign:'center', padding:'0 4px', scrollbarWidth:'none', msOverflowStyle:'none' };

    return (
        <>
        <style>{`.tp-sel::-webkit-scrollbar { display: none; } .tp-sel option { background: ${dark ? '#1e2d4a' : '#ffffff'} !important; color: ${dark ? '#f1f5f9' : '#0f172a'} !important; }`}</style>
        <div style={{ display:'inline-flex', alignItems:'center', border:`1.5px solid ${error ? theme.danger : theme.inputBorder}`, borderRadius:12, overflow:'hidden', background: dark ? 'rgba(255,255,255,0.06)' : '#fff', height:44, transition:'border-color 0.15s' }}>
            <div style={{ paddingLeft:10, paddingRight:4, color:theme.textMute, display:'flex', alignItems:'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <select className="tp-sel" value={h} onChange={e => emit(e.target.value, m === '--' ? '00' : m, p)} style={{...sel, width:42}}>
                {!parsed && <option value="--">--</option>}
                {hours.map(hv=><option key={hv} value={hv}>{hv}</option>)}
            </select>
            <span style={{ color:theme.textMute, fontWeight:800, fontSize:15, userSelect:'none' }}>:</span>
            <select className="tp-sel" value={m} onChange={e => emit(h === '--' ? '08' : h, e.target.value, p)} style={{...sel, width:42}}>
                {!parsed && <option value="--">--</option>}
                {minutes.map(mv=><option key={mv} value={mv}>{mv}</option>)}
            </select>
            <div style={{ width:1, height:24, background: dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)', margin:'0 4px' }}/>
            {['AM','PM'].map(period => (
                <button key={period} type="button"
                    onClick={() => {
                        if (!parsed) { const defaultH24 = period === 'PM' ? 20 : 8; onChange(`${String(defaultH24).padStart(2,'0')}:00`); return; }
                        emit(h, m, period);
                    }}
                    style={{ width:36, height:'100%', border:'none', background: parsed && p === period ? (dark?'rgba(124,58,237,0.35)':'#ede9fe') : 'transparent', color: parsed && p === period ? theme.primary : theme.textMute, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', borderLeft: period==='PM' ? `1px solid ${dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}` : 'none' }}>
                    {period}
                </button>
            ))}
        </div>
        </>
    );
}

function ErrMsg({ msg, theme }) {
    return (
        <div style={{ fontSize:11, color:theme.danger, marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
            {msg}
        </div>
    );
}