import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

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

// ── Premium Dropdown ───────────────────────────────────────────
function PremiumDropdown({ options, value, onChange, theme, dark, width }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const sel = options.find(o => String(o.value) === String(value));
    useEffect(() => {
        const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);
    return (
        <div ref={ref} style={{ position:'relative', width: width||'auto', minWidth:110 }}>
            <button onClick={() => setOpen(v => !v)} style={{ width:'100%', border:`1px solid ${open ? '#7c3aed' : theme.border}`, borderRadius:10, padding:'8px 12px', fontSize:13, fontWeight:600, color:theme.text, background: dark ? theme.panelSoft : '#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.18)' : 'none', outline:'none', transition:'all 0.15s' }}>
                <span>{sel?.label || '—'}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.18s', color:theme.textMute, flexShrink:0 }}><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {open && (
                <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, minWidth:'100%', background: dark ? '#111e38' : '#fff', border:`1px solid ${theme.border}`, borderRadius:12, boxShadow:theme.shadow, zIndex:300, overflow:'hidden', animation:'otDrop 0.14s ease' }}>
                    {options.map(opt => {
                        const active = String(opt.value) === String(value);
                        return (
                            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{ width:'100%', background: active ? (dark ? 'rgba(139,92,246,0.16)' : '#f3e8ff') : 'transparent', border:'none', padding:'9px 14px', fontSize:13, fontWeight: active ? 700 : 500, color: active ? '#7c3aed' : theme.textSoft, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8, transition:'background 0.1s' }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : '#f8fafc'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                                {active && <span style={{ color:'#7c3aed', fontSize:11 }}>✓</span>}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  OT POLICY CARDS  ← matches LeaveBalanceCards layout exactly
// ─────────────────────────────────────────────────────────────
function OTPolicyCards({ overtimePolicies, dark, theme }) {
    if (!overtimePolicies?.length) return null;
    return (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(175px, 1fr))', gap:12 }}>
            {overtimePolicies.map(pol => {
                const c        = getOTColor(pol.title);
                const bg       = dark ? c.bgDark : c.bg;
                const dayLabel = pol.day_type === 'public_holiday' ? 'Public Holiday' : pol.day_type === 'weekend' ? 'Weekend' : 'Weekday';
                const shiftLbl = pol.shift_type === 'day' ? '☀️ Day' : pol.shift_type === 'night' ? '🌙 Night' : '🕐 All';
                const rateVal  = pol.rate_type === 'multiplier' ? `${Number(pol.rate_value).toFixed(1)}x` : Number(pol.rate_value).toLocaleString();
                const pct      = pol.shift_type === 'day' ? 60 : pol.shift_type === 'night' ? 100 : 80;

                return (
                    <div key={pol.id} style={{ background: dark ? theme.panelSolid : '#fff', border:`1px solid ${dark ? theme.border : c.border}`, borderRadius:16, padding:'16px', boxShadow: dark ? 'none' : '0 1px 6px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }}>
                        {/* blob */}
                        <div style={{ position:'relative' }}>
                            {/* title + active dot */}
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                                <span style={{ fontSize:10, fontWeight:800, color:c.color, textTransform:'uppercase', letterSpacing:'0.05em' }}>{pol.title}</span>
                               
                            </div>
                            {/* big rate number — like leave balance number */}
                            <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                                <span style={{ fontSize:28, fontWeight:900, color:theme.text, lineHeight:1 }}>{rateVal}</span>
                                <span style={{ fontSize:11, color:theme.textMute }}>{pol.rate_type === 'multiplier' ? '/ base' : 'flat'}</span>
                            </div>
                            {/* progress bar */}
                            <div style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', borderRadius:99, height:4, overflow:'hidden', marginBottom:8 }}>
                                <div style={{ height:'100%', borderRadius:99, background:c.grad, width:`${pct}%`, transition:'width 0.5s ease' }}/>
                            </div>
                            {/* footer */}
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                                <span style={{ color:theme.textMute }}>{dayLabel}</span>
                                <span style={{ color:c.color, fontWeight:700 }}>{shiftLbl}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  OT REQUEST ROW  ← matches Leave RequestRow layout exactly
// ─────────────────────────────────────────────────────────────
function OTRow({ req, dark, theme, canApprove, userId, onApprove, onReject, onDelete, isLast }) {
    const sc          = STATUS_CFG[req.status] || STATUS_CFG.pending;
    const isMine      = req.user_id === userId;
    const isAssigned  = req.approver_id === userId;
    const showActions = canApprove && req.status === 'pending' && isAssigned && !isMine;
    const statusBg    = dark ? sc.bgDark : sc.bg;

    const segments   = req.segments || [];
    const isMultiDay = req.end_date && req.end_date !== req.start_date;

    // approved ဆိုရင် hours_approved=0 ဖြစ်တဲ့ segments ဖယ်ထုတ်
    const visibleSegments = req.status === 'approved'
        ? segments.filter(seg => parseFloat(seg.hours_approved) > 0)
        : segments;

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

    // accent bar color from first segment
    const barColor = segments[0] ? getOTColor(segments[0].overtime_policy?.title).color : theme.primary;
    const showDelete = req.user_id === userId && req.status === 'pending';

    return (
        <div style={{ display:'flex', alignItems:'stretch', borderBottom: isLast ? 'none' : `1px solid ${theme.border}` }}>
            {/* left bar */}
            <div style={{ width:3, background:barColor, flexShrink:0 }}/>

            <div style={{ flex:1, padding:'14px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ flex:1, minWidth:0 }}>

                    {/* Row 1 */}
                    <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:5 }}>
                        <span style={{ fontSize:14, fontWeight:800, color:theme.text }}>Overtime</span>
                        <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 9px', background:statusBg, color:sc.color }}>
                            {sc.label}
                        </span>
                        {req.status === 'approved' && parseFloat(req.hours_approved) !== parseFloat(req.hours_requested) ? (
                            <>
                                <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 9px',
                                    background: dark ? 'rgba(16,185,129,0.15)' : '#d1fae5', color:'#059669' }}>
                                    ✓ {fmtHrs(req.hours_approved)} approved
                                </span>
                                <span style={{ fontSize:10, fontWeight:600, borderRadius:99, padding:'2px 9px',
                                    background: dark ? theme.panelSoft : '#f3f4f6',
                                    color: theme.textMute, textDecoration:'line-through' }}>
                                    {fmtHrs(req.hours_requested)}
                                </span>
                            </>
                        ) : (
                            <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 9px',
                                background: dark ? theme.primarySoft : '#ede9fe', color:theme.primary }}>
                                {req.status === 'approved'
                                    ? `✓ ${fmtHrs(req.hours_approved)} approved`
                                    : `${fmtHrs(req.hours_requested)} total`}
                            </span>
                        )}
                    </div>

                    {/* Row 2: employee (approver view) */}
                    {!isMine && req.user && (
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                            {req.user.avatar_url
                                ? <img src={`/storage/${req.user.avatar_url}`} alt={req.user.name} style={{ width:24, height:24, borderRadius:7, objectFit:'cover', border:`1px solid ${theme.border}`, flexShrink:0 }}/>
                                : <div style={{ width:24, height:24, borderRadius:7, flexShrink:0, background: dark ? theme.primarySoft : '#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:theme.primary }}>{initials(req.user.name)}</div>
                            }
                            <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>{req.user.name}</span>
                            {req.user.position && <span style={{ fontSize:11, color:theme.textMute }}>{req.user.position}</span>}
                            {req.user.department && <><span style={{ color:theme.border }}>·</span><span style={{ fontSize:11, color:'#6366f1' }}>{req.user.department}</span></>}
                        </div>
                    )}

                    {/* Row 3: date */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:theme.textSoft }}>{fmtDate(req.start_date)}</span>
                        {isMultiDay && (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            <span style={{ fontSize:12, fontWeight:700, color:theme.textSoft }}>{fmtDate(req.end_date)}</span></>
                        )}
                        <span style={{ fontSize:11, fontWeight:700, color:theme.primary, background: dark ? theme.primarySoft : '#ede9fe', borderRadius:6, padding:'2px 8px' }}>
                            {to12h(req.start_time)} — {to12h(req.end_time)}
                        </span>
                    </div>

                    {/* Row 4: segments */}
                    {segments.length > 0 && (
                        <div style={{ display:'flex', flexDirection:'column', gap: hasMultiGroup ? 7 : 4, marginBottom: req.reason ? 8 : 0 }}>
                            {groupedDates.map(date => (
                                <div key={date}>
                                    {hasMultiGroup && <div style={{ fontSize:10, color:theme.textMute, marginBottom:4, fontStyle:'italic' }}>{fmtDate(date)}</div>}
                                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                        {grouped[date].map(seg => {
                                            const oc  = getOTColor(seg.overtime_policy?.title);
                                            const obg = dark ? oc.bgDark : oc.bg;
                                            const hrs = fmtHrs(req.status === 'approved' ? seg.hours_approved : seg.hours);
                                            return (
                                                <div key={seg.id} style={{ display:'inline-flex', alignItems:'center', gap:5, background:obg, border:`1px solid ${oc.border}`, borderRadius:8, padding:'3px 9px' }}>
                                                    <span style={{ width:5, height:5, borderRadius:'50%', background:oc.color, flexShrink:0 }}/>
                                                    <span style={{ fontSize:11, fontWeight:700, color:oc.color }}>{seg.overtime_policy?.title || 'OT'}</span>
                                                    <span style={{ fontSize:11, color:theme.textMute }}>{to12h(seg.start_time)}–{to12h(seg.end_time)}</span>
                                                    <span style={{ fontSize:11, fontWeight:800, color:oc.color }}>{hrs}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(typeTotals).length > 1 && (
                                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:3, paddingTop:5, borderTop:`1px dashed ${theme.border}` }}>
                                    <span style={{ fontSize:9, fontWeight:700, color:theme.textMute, alignSelf:'center', textTransform:'uppercase', letterSpacing:'0.05em' }}>TOTAL BY TYPE</span>
                                    {Object.entries(typeTotals).map(([t, h]) => {
                                        const tc = getOTColor(t);
                                        return <span key={t} style={{ fontSize:11, fontWeight:700, color:tc.color, background: dark ? tc.bgDark : tc.bg, border:`1px solid ${tc.border}`, borderRadius:99, padding:'1px 8px' }}>{t.replace(' OT','')} · {fmtHrs(h)}</span>;
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Row 5: reason — same style as Leave */}
                    {req.reason && (
                        <div style={{ display:'flex', gap:8, background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
                            border:`1px solid ${theme.border}`, borderRadius:10, padding:'8px 12px' }}>
                            <span style={{ fontSize:12, fontWeight:800, color:theme.textMute, flexShrink:0, marginTop:1, textTransform:'uppercase', letterSpacing:'0.4px' }}>Reason</span>
                            <span style={{ fontSize:12, color:theme.textSoft, lineHeight:1.5 }}>{req.reason}</span>
                        </div>
                    )}
                </div>

                {/* Right side */}
                <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 6,
                    minWidth: 130,
                    alignSelf: 'stretch',
                }}>
                    {/* အပေါ် — actions/status */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                        {showActions && (
                            <div style={{ display:'flex', gap:6 }}>
                                <button onClick={onApprove} style={{ background:'#059669', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer' }}>✓ Approve</button>
                                <button onClick={onReject}  style={{ background: dark ? 'rgba(248,113,113,0.12)' : '#fff', border:`1px solid ${dark ? 'rgba(248,113,113,0.3)' : '#fca5a5'}`, borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, color:'#ef4444', cursor:'pointer' }}>✕ Reject</button>
                            </div>
                        )}
                        {req.status === 'approved' && !showActions && <span style={{ fontSize:12, color:'#059669', fontWeight:700 }}>✓ Approved</span>}
                        {req.status === 'rejected' && <span style={{ fontSize:12, color:'#ef4444', fontWeight:700 }}>✕ Rejected</span>}
                        {req.approver && req.status === 'pending' && !showActions && (
                            <div style={{ textAlign:'right' }}>
                                <div style={{ fontSize:10, color:theme.textMute }}>Awaiting</div>
                                <div style={{ fontSize:12, fontWeight:800, color:theme.primary }}>{req.approver.name}</div>
                            </div>
                        )}
                    </div>

                    {/* အောက် — delete icon */}
                    {showDelete ? (
                        <button
                            onClick={() => onDelete(req)}
                            title="Delete request"
                            style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: dark ? 'rgba(248,113,113,0.12)' : '#fee2e2',
                                border: `1px solid ${dark ? 'rgba(248,113,113,0.22)' : '#fca5a5'}`,
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = dark ? 'rgba(248,113,113,0.25)' : '#fecaca';
                                e.currentTarget.style.borderColor = dark ? 'rgba(248,113,113,0.45)' : '#f87171';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = dark ? 'rgba(248,113,113,0.12)' : '#fee2e2';
                                e.currentTarget.style.borderColor = dark ? 'rgba(248,113,113,0.22)' : '#fca5a5';
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke={dark ? '#f87171' : '#dc2626'}
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" /><path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                        </button>
                    ) : (
                        <div style={{ width: 32, height: 32 }} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function OvertimeIndex({ requests, overtimePolicies, employees, filters, selectedMonth, selectedYear }) {
    const { auth } = usePage().props;
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

    const handleStatusFilter  = v => { setStatusFilter(v); router.get('/payroll/overtimes', { month, year, status:v }, { preserveState:true, preserveScroll:true }); };
    const handleMonthYearFilter = (m, y) => router.get('/payroll/overtimes', { month:m, year:y, status:statusFilter }, { preserveScroll:true });

const handleApprove = (req, segs) => {
    setActionLoading(true);
    router.patch(`/payroll/overtimes/${req.id}/approve`, { segments: segs }, {
        onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
        onError: (errors) => {
            setActionLoading(false);
            setConfirmModal(null);
            const msg = errors?.message || 'Request no longer exists. It may have been deleted.';
            window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'error' } }));
        },
    });
};

const handleReject = req => {
    setActionLoading(true);
    router.patch(`/payroll/overtimes/${req.id}/reject`, {}, {
        onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
        onError: (errors) => {
            setActionLoading(false);
            setConfirmModal(null);
            const msg = errors?.message || 'Request no longer exists. It may have been deleted.';
            window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'error' } }));
        },
    });
};

    const myRequests       = requests.data.filter(r => r.user_id === user?.id);
    const approvalRequests = requests.data.filter(r => r.approver_id === user?.id && r.user_id !== user?.id && r.status === 'pending');
    const pendingCount     = approvalRequests.length;

    const displayList = mainTab === 'approvals' ? approvalRequests
        : mainTab === 'all' ? requests.data
        : myRequests;

    const monthOpts  = MONTHS.map((m, i) => ({ value: i+1, label: m }));
    const yearOpts   = [2024,2025,2026,2027].map(y => ({ value:y, label:String(y) }));
    const statusOpts = [
        { value:'',         label:'All Status' },
        { value:'pending',  label:'Pending' },
        { value:'approved', label:'Approved' },
        { value:'rejected', label:'Rejected' },
    ];

    const tabs = [
        { key:'my',        label:'My Requests',      count:myRequests.length,  alert:false },
        ...(canApprove ? [{ key:'approvals', label:'Pending Approvals', count:pendingCount, alert:pendingCount>0 }] : []),
        ...(canViewAll  ? [{ key:'all',      label:'All Requests',      count:requests.total, alert:false }] : []),
    ];


    function handleDelete(req) {
        setActionLoading(true);
        router.delete(`/payroll/overtimes/${req.id}`, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); },
            onError: () => {
                setActionLoading(false);
                setConfirmModal(null);
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: { message: 'Request could not be deleted.', type: 'error' }
                }));
            },
        });
    }

    return (
        <AppLayout title="Overtime Request">
            <Head title="Overtime"/>
            <style>{`
                @keyframes otDrop  { from { opacity:0; transform:translateY(-7px); } to { opacity:1; transform:translateY(0); } }
                @keyframes otPopIn { from { opacity:0; transform:scale(0.96); }    to { opacity:1; transform:scale(1); } }
                @keyframes otSpin  { to   { transform:rotate(360deg); } }
                .ot-hide::-webkit-scrollbar { display:none; }
                .ot-hide { scrollbar-width:none; -ms-overflow-style:none; }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                {/* ── Row 1: Policy cards ── */}
                <OTPolicyCards overtimePolicies={overtimePolicies} dark={dark} theme={theme}/>

                {/* ── Row 2: Filters + button ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        <PremiumDropdown options={monthOpts}  value={month}        onChange={v => { const m=Number(v); setMonth(m); handleMonthYearFilter(m,year); }} theme={theme} dark={dark} width={145}/>
                        <PremiumDropdown options={yearOpts}   value={year}         onChange={v => { const y=Number(v); setYear(y); handleMonthYearFilter(month,y); }} theme={theme} dark={dark} width={100}/>
                        <PremiumDropdown options={statusOpts} value={statusFilter} onChange={handleStatusFilter} theme={theme} dark={dark} width={145}/>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
                        style={{ background:`linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`, color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 22px ${theme.primary}44`, transition:'all 0.15s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Request Overtime
                    </button>
                </div>

                {/* ── Row 3: Tabbed panel ── */}
                <div style={{ background: dark ? theme.panelSolid : '#fff', borderRadius:18, border:`1px solid ${theme.border}`, boxShadow:theme.shadowSoft, overflow:'hidden' }}>

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
                            <div style={{ fontSize:14, fontWeight:600, color:theme.textSoft, marginBottom:4 }}>{mainTab === 'approvals' ? 'No pending approvals' : 'No overtime requests found'}</div>
                            <div style={{ fontSize:12, color:theme.textMute }}>{mainTab === 'approvals' ? 'All caught up!' : 'Click "Request Overtime" to submit a new request.'}</div>
                        </div>
                    ) : displayList.map((req, idx) => (
                        <OTRow key={req.id} req={req} dark={dark} theme={theme} canApprove={canApprove} userId={user?.id}
                            onApprove={() => setConfirmModal({ type:'approve', req })}
                            onReject ={() => setConfirmModal({ type:'reject',  req })}
                            onDelete ={() => setConfirmModal({ type:'delete',  req })}
                            isLast={idx === displayList.length - 1}/>
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
            </div>

            {showModal    && <OTRequestModal employees={employees} roleName={roleName} dark={dark} theme={theme} onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)}/>}
            {confirmModal && <ConfirmModal   type={confirmModal.type} req={confirmModal.req} loading={actionLoading} dark={dark} theme={theme} onCancel={() => setConfirmModal(null)} onApprove={segs => handleApprove(confirmModal.req, segs)} onReject={() => handleReject(confirmModal.req)} onDelete={() => handleDelete(confirmModal.req)}/>}
        </AppLayout>
    );
}

// ─────────────────────────────────────────────────────────────
//  OT REQUEST MODAL
// ─────────────────────────────────────────────────────────────
function OTRequestModal({ employees, roleName, dark, theme, onClose, onSuccess }) {
    const isAdmin = roleName === 'admin';
    const [form,   setForm]   = useState({ start_date:'', start_time:'', end_date:'', end_time:'', reason:'', approver_id: employees[0]?.id || '' });
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
            const ph = Math.floor(totalMins / 60);
            const pm = totalMins % 60;
            const hrsLabel = ph === 0 ? `${pm}m` : pm === 0 ? `${ph}hr` : `${ph}hr ${pm}m`;
            return {
                hrs: hrsLabel,
                days: Math.ceil((new Date(form.end_date)-new Date(form.start_date))/86400000)+1,
                isMulti: form.start_date!==form.end_date,
            };
        } catch { return null; }
    }, [form.start_date,form.start_time,form.end_date,form.end_time]);

    const validate = () => {
        const e={};
        if(!form.start_date) e.start_date='Start date is required.';
        if(!form.start_time) e.start_time='Start time is required.';
        if(!form.end_date)   e.end_date='End date is required.';
        if(!form.end_time)   e.end_time='End time is required.';
        if(form.start_date&&form.end_date&&form.end_date<form.start_date) e.end_date='End date must be on or after start date.';
        if(form.start_date===form.end_date&&form.start_time===form.end_time) e.end_time='Start and end cannot be the same.';
        if(!form.reason.trim()) e.reason='Reason is required.';
        if(!isAdmin && !form.approver_id) e.approver_id='Please select an approver.';
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

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => e.target===e.currentTarget&&onClose()}>
            <div style={{ background: dark?'#0f1b34':'#fff', borderRadius:22, width:'100%', maxWidth:510, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:'otPopIn 0.22s ease' }}>

                <div style={{ background:theme.modalHeader, padding:'20px 24px 18px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%',  }}/>
                    <div style={{ position:'absolute', bottom:-30, left:20, width:90, height:90, borderRadius:'50%',  }}/>
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>⏰</div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Overtime Management</div>
                                <div style={{ fontSize:17, fontWeight:900, color:'#fff' }}>Request Overtime</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.16)', border:'none', cursor:'pointer', fontSize:20, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                    </div>
                </div>

                <div className="ot-hide" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto', flex:1 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div><label style={lbl}>Start date</label><input type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)} style={inp(errors.start_date)}/>{errors.start_date&&<ErrMsg msg={errors.start_date} theme={theme}/>}</div>
                        <div><label style={lbl}>Start time</label><input type="time" value={form.start_time} onChange={e=>set('start_time',e.target.value)} style={inp(errors.start_time)}/>{errors.start_time&&<ErrMsg msg={errors.start_time} theme={theme}/>}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div><label style={lbl}>End date</label><input type="date" value={form.end_date} min={form.start_date||undefined} onChange={e=>set('end_date',e.target.value)} style={inp(errors.end_date)}/>{errors.end_date&&<ErrMsg msg={errors.end_date} theme={theme}/>}</div>
                        <div><label style={lbl}>End time</label><input type="time" value={form.end_time} onChange={e=>set('end_time',e.target.value)} style={inp(errors.end_time)}/>{errors.end_time&&<ErrMsg msg={errors.end_time} theme={theme}/>}</div>
                    </div>

                    {summary && (
                        <div style={{ background: summary.isMulti?(dark?'rgba(251,191,36,0.08)':'#fefce8'):(dark?theme.primarySoft:'#f3e8ff'), border:`1px solid ${summary.isMulti?(dark?'rgba(251,191,36,0.25)':'#fde047'):(dark?'rgba(139,92,246,0.3)':'#ddd6fe')}`, borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:18 }}>{summary.isMulti?'📅':'⏱️'}</span>
                            <div>
                                <div style={{ fontSize:12, fontWeight:800, color: summary.isMulti?theme.warning:theme.primary }}>{summary.isMulti?`Multi-day · ${summary.days} days`:'Same-day OT'} <span style={{ marginLeft:8 }}>{summary.hrs} total</span></div>
                                <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>{to12h(form.start_time)} ({form.start_date}) → {to12h(form.end_time)} ({form.end_date}) · Auto-split per shift</div>
                            </div>
                        </div>
                    )}

                    <div><label style={lbl}>Reason</label><textarea value={form.reason} onChange={e=>set('reason',e.target.value)} rows={3} placeholder="Describe the reason for overtime..." className="ot-hide" style={{...inp(errors.reason),resize:'none'}}/>{errors.reason&&<ErrMsg msg={errors.reason} theme={theme}/>}</div>

                    {!isAdmin && employees.length>0 && (
                        <div><label style={lbl}>Approver</label>
                        <select value={form.approver_id} onChange={e=>set('approver_id',e.target.value)} style={{...inp(false),cursor:'pointer'}}>
                            <option value="">— Select approver —</option>
                            {employees.map(emp=><option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                        {errors.approver_id&&<ErrMsg msg={errors.approver_id} theme={theme}/>} 
                        </div>
                    )}
                    {isAdmin && <div style={{ background: dark?theme.successSoft:'#ecfdf5', border:`1px solid ${dark?'rgba(16,185,129,0.3)':'#6ee7b7'}`, borderRadius:10, padding:'9px 13px', fontSize:12, color:theme.success, fontWeight:600 }}>✓ As admin, this request will be auto-approved.</div>}
                </div>

                <div style={{ borderTop:`1px solid ${theme.border}`, padding:'14px 24px', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
                    <button onClick={onClose} disabled={saving} style={{ background: dark?theme.panelSoft:'#fff', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, color:theme.textSoft, cursor:'pointer' }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={saving} style={{ background:theme.modalHeader, border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor: saving?'not-allowed':'pointer', opacity: saving?0.65:1, display:'flex', alignItems:'center', gap:8, boxShadow:`0 8px 24px ${theme.primary}44`, transition:'all 0.15s' }}>
                        {saving&&<span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'otSpin 0.7s linear infinite' }}/>}
                        {saving?'Submitting...':'Submit Request'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─────────────────────────────────────────────────────────────
//  CONFIRM MODAL
// ─────────────────────────────────────────────────────────────
function ConfirmModal({ type, req, loading, dark, theme, onCancel, onApprove, onReject, onDelete }) {
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
                        <div style={{ width:46, height:46, borderRadius:14, flexShrink:0,
                            background: isApprove ? (dark?theme.successSoft:'#d1fae5') : (dark?theme.dangerSoft:'#fee2e2'),
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                            {isDelete ? '🗑' : isApprove ? '✓' : '✕'}
                        </div>
                        <div>
                            <div style={{ fontSize:16, fontWeight:900, color:theme.text }}>
                                {isDelete ? 'Delete Overtime Request' : isApprove ? 'Approve Overtime' : 'Reject Overtime'}
                            </div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>
                                {isDelete ? 'This action cannot be undone' : isApprove ? 'Adjust approved hours per segment if needed' : 'Employee will be notified'}
                            </div>
                        </div>
                    </div>

                    <div style={{ background: dark?theme.panelSoft:'#f8fafc', border:`1px solid ${theme.border}`, borderRadius:14, padding:'13px 15px', marginBottom: isApprove&&!isDelete ? 18 : 0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                            <span style={{ fontSize:13, fontWeight:800, color:theme.text }}>
                                {isDelete ? 'Your request' : req.user?.name}
                            </span>
                            <span style={{ fontSize:11, fontWeight:700, color:theme.primary, background: dark?theme.primarySoft:'#ede9fe', borderRadius:6, padding:'1px 8px' }}>
                                {fmtHrs(req.hours_requested)} total
                            </span>
                        </div>
                        <div style={{ fontSize:12, color:theme.textSoft, fontWeight:600 }}>
                            {req.end_date && req.end_date !== req.start_date
                                ? <>{fmtDate(req.start_date)} {to12h(req.start_time)} — {fmtDate(req.end_date)} {to12h(req.end_time)}</>
                                : <>{fmtDate(req.start_date)} · {to12h(req.start_time)} — {to12h(req.end_time)}</>
                            }
                        </div>
                        {req.reason && (
                            <div style={{ fontSize:11, color:theme.textMute, fontStyle:'italic', marginTop:6, paddingTop:6, borderTop:`1px solid ${theme.border}` }}>
                                "{req.reason}"
                            </div>
                        )}
                    </div>

                    {/* Segments — approve only */}
                    {isApprove && segments.length > 0 && (
                        <div>
                            <div style={{ fontSize:11, fontWeight:700, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Segments — adjust hours if needed</div>
                            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                {segments.map(seg => {
                                    const c = getOTColor(seg.overtime_policy?.title);
                                    const max = parseFloat(seg.hours) || 0;
                                    return (
                                        <div key={seg.id} style={{ background: dark?c.bgDark:c.bg, border:`1px solid ${c.border}`, borderRadius:12, padding:'10px 13px', display:'flex', alignItems:'center', gap:10 }}>
                                            <div style={{ flex:1 }}>
                                                <div style={{ fontSize:12, fontWeight:700, color:c.color }}>{seg.overtime_policy?.title||'OT'}</div>
                                                <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>
                                                    {seg.segment_date && <span style={{ marginRight:6, fontWeight:600, color:theme.textSoft }}>{fmtDate(seg.segment_date)}</span>}
                                                    {to12h(seg.start_time)} → {to12h(seg.end_time)}
                                                    <span style={{ marginLeft:6, color:theme.textMute }}>req: {fmtHrs(seg.hours)}</span>
                                                </div>
                                            </div>
                                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                <span style={{ fontSize:11, color:theme.textMute }}>Approve</span>
                                                <input type="number" value={segHours[seg.id] ?? seg.hours} min={0} max={max} step={0.01}
                                                    onKeyDown={e => { const ok=['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','.']; if(!ok.includes(e.key)&&!/^\d$/.test(e.key))e.preventDefault(); if(e.key==='.'&&String(segHours[seg.id]??seg.hours).includes('.'))e.preventDefault(); }}
                                                    onChange={e => { const r=e.target.value; if(r===''||r==='.'){setSegHours(p=>({...p,[seg.id]:r}));return;} const n=parseFloat(r); if(isNaN(n))return; setSegHours(p=>({...p,[seg.id]:Math.round(Math.min(n,max)*100)/100})); }}
                                                    style={{ width:64, border:`1.5px solid ${c.border}`, borderRadius:8, padding:'5px 8px', fontSize:12, fontWeight:700, color:c.color, textAlign:'center', background: dark?'rgba(255,255,255,0.08)':'#fff' }}/>
                                                <span style={{ fontSize:11, color:theme.textMute }}>hrs</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8, paddingTop:4 }}>
                                    <span style={{ fontSize:12, color:theme.textMute }}>Total approved:</span>
                                    <span style={{ fontSize:15, fontWeight:900, color:theme.success }}>{fmtHrs(total)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ borderTop:`1px solid ${theme.border}`, padding:'14px 24px', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
                    <button onClick={onCancel} disabled={loading} style={{ background: dark?theme.panelSoft:'#fff', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, color:theme.textSoft, cursor:'pointer' }}>Cancel</button>

                    {isDelete ? (
                        <button onClick={onDelete} disabled={loading}
                            style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor:'pointer', opacity:loading?0.6:1, boxShadow:'0 4px 14px rgba(220,38,38,0.35)' }}>
                            {loading ? 'Deleting...' : '🗑 Delete'}
                        </button>
                    ) : isApprove ? (
                        <button onClick={() => onApprove(segments.map(s => ({id:s.id, hours_approved:parseFloat(segHours[s.id]||0)})))} disabled={loading}
                            style={{ background:'linear-gradient(135deg,#059669,#10b981)', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor:'pointer', opacity:loading?0.6:1, boxShadow:'0 4px 14px rgba(5,150,105,0.35)' }}>
                            {loading ? 'Approving…' : '✓ Approve'}
                        </button>
                    ) : (
                        <button onClick={onReject} disabled={loading}
                            style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor:'pointer', opacity:loading?0.6:1, boxShadow:'0 4px 14px rgba(220,38,38,0.35)' }}>
                            {loading ? 'Rejecting…' : '✕ Reject'}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
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