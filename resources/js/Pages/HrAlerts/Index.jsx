// resources/js/Pages/HrAlerts/Index.jsx — Full v2
import { useState, useEffect, useRef, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { createPortal } from 'react-dom';

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
        panelSolid:'#0f1b34', panelSoft:'rgba(255,255,255,0.04)',
        border:'rgba(148,163,184,0.13)', text:'#f8fafc', textSoft:'#cbd5e1',
        textMute:'#64748b', overlay:'rgba(2,8,23,0.78)',
        shadow:'0 24px 60px rgba(0,0,0,0.38)', shadowSoft:'0 4px 16px rgba(0,0,0,0.22)',
        primary:'#8b5cf6', primarySoft:'rgba(139,92,246,0.16)',
        success:'#10b981', danger:'#f87171', warning:'#f59e0b',
        inputBg:'rgba(255,255,255,0.06)', inputBorder:'rgba(148,163,184,0.18)',
        modalHeader:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        rowHover:'rgba(255,255,255,0.03)',
    };
    return {
        panelSolid:'#ffffff', panelSoft:'#f8fafc',
        border:'rgba(15,23,42,0.08)', text:'#0f172a', textSoft:'#475569',
        textMute:'#94a3b8', overlay:'rgba(15,23,42,0.42)',
        shadow:'0 20px 50px rgba(15,23,42,0.14)', shadowSoft:'0 2px 8px rgba(15,23,42,0.06)',
        primary:'#7c3aed', primarySoft:'#f3e8ff',
        success:'#059669', danger:'#ef4444', warning:'#d97706',
        inputBg:'#f8fafc', inputBorder:'#e2e8f0',
        modalHeader:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        rowHover:'#fafbff',
    };
}

const STATUS_CFG = {
    pending:   { label:'Pending',   color:'#d97706', bg:'#fef3c7', bgDark:'rgba(217,119,6,0.18)',   icon:'⏳' },
    sent:      { label:'Sent',      color:'#059669', bg:'#d1fae5', bgDark:'rgba(5,150,105,0.18)',   icon:'✓' },
    dismissed: { label:'Dismissed', color:'#6b7280', bg:'#f3f4f6', bgDark:'rgba(107,114,128,0.16)', icon:'—' },
};
const TYPE_CFG = {
    late:   { label:'Late Alert',   color:'#f59e0b', bg:'#fef3c7', bgDark:'rgba(245,158,11,0.18)', icon:'⏰', accent:'#f59e0b' },
    absent: { label:'Absent Alert', color:'#ef4444', bg:'#fee2e2', bgDark:'rgba(239,68,68,0.18)',  icon:'📅', accent:'#ef4444' },
};

function fmtMonth(m, y) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[(m||1)-1]} ${y}`;
}

function Avatar({ name, avatarUrl, size=32 }) {
    const [err, setErr] = useState(false);
    const initials = (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const colors = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2'];
    const color = colors[(name||'').charCodeAt(0) % colors.length];
    const src = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `/storage/${avatarUrl}`) : null;
    if (src && !err) return <img src={src} alt={name} onError={()=>setErr(true)} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
    return <div style={{width:size,height:size,borderRadius:'50%',background:color+'22',border:`1.5px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.34,fontWeight:700,color,flexShrink:0}}>{initials}</div>;
}

// ── Summary Cards (Leave page style) ──────────────────────────
function AlertSummaryCards({ stats, dark, theme }) {
    const cards = [
        { label:'Pending Alerts',    value:stats.pending,   icon:'⏳', color:'#f59e0b', soft:dark?'rgba(245,158,11,0.14)':'#fef3c7',   border:dark?'rgba(245,158,11,0.25)':'#fde68a' },
        { label:'Late Warnings',     value:stats.late,      icon:'⏰', color:'#f87171', soft:dark?'rgba(248,113,113,0.14)':'#fee2e2', border:dark?'rgba(248,113,113,0.25)':'#fca5a5' },
        { label:'Absent Warnings',   value:stats.absent,    icon:'📅', color:'#ef4444', soft:dark?'rgba(239,68,68,0.14)':'#fee2e2',   border:dark?'rgba(239,68,68,0.25)':'#fca5a5' },
        { label:'Warnings Sent',     value:stats.sent,      icon:'📨', color:'#10b981', soft:dark?'rgba(16,185,129,0.14)':'#d1fae5',  border:dark?'rgba(16,185,129,0.25)':'#6ee7b7' },
        { label:'Dismissed',         value:stats.dismissed, icon:'—',  color:'#6b7280', soft:dark?'rgba(107,114,128,0.14)':'#f3f4f6', border:dark?'rgba(107,114,128,0.25)':'#d1d5db' },
    ];
    return (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {cards.map(c => (
                <div key={c.label} style={{
                    display:'flex', alignItems:'center', gap:12,
                    background: dark?'rgba(255,255,255,0.04)':'#fff',
                    border:`1px solid ${c.border}`, borderRadius:14,
                    padding:'12px 16px', position:'relative', overflow:'hidden',
                    boxShadow: dark?'0 2px 8px rgba(0,0,0,0.18)':'0 1px 4px rgba(0,0,0,0.04)',
                    minWidth:150, flex:1,
                }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c.color }}/>
                    <div style={{
                        width:44, height:44, borderRadius:12, flexShrink:0,
                        background:c.soft, display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, border:`1px solid ${dark?'transparent':c.border}`,
                    }}>{c.icon}</div>
                    <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:24, fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                        <div style={{ fontSize:11, color:theme.textMute, marginTop:3, fontWeight:500 }}>{c.label}</div>
                        <div style={{ marginTop:6, height:3, borderRadius:99, background:dark?'rgba(255,255,255,0.08)':'#f0f0f0', width:80, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:99, background:c.color, width:`${Math.min(100, stats.total>0?(c.value/stats.total)*100:0)}%` }}/>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Alert Row ──────────────────────────────────────────────────
function AlertRow({ alert, dark, theme, onSend, onDismiss, isLast, expandedId, setExpandedId }) {
    const sc = STATUS_CFG[alert.status] || STATUS_CFG.pending;
    const tc = TYPE_CFG[alert.type]     || TYPE_CFG.late;
    const isPending  = alert.status === 'pending';
    const isExpanded = expandedId === alert.id;

    return (
        <div style={{ borderBottom: isLast?'none':`1px solid ${theme.border}`, transition:'background .15s' }}
            onMouseEnter={e=>e.currentTarget.style.background=theme.rowHover}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

            <div style={{ display:'flex', alignItems:'stretch' }}>
                {/* Left accent */}
                <div style={{ width:3, flexShrink:0, background:tc.accent, borderRadius: isLast?'0 0 0 18px':0 }}/>

                <div style={{ flex:1, padding:'13px 18px', minWidth:0 }}>
                    {/* Row 1 */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                            <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>{tc.icon} {tc.label}</span>
                            <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 8px', background:dark?sc.bgDark:sc.bg, color:sc.color }}>{sc.icon} {sc.label}</span>
                            <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 8px', background:dark?tc.bgDark:tc.bg, color:tc.color }}>
                                {alert.type==='late' ? `${alert.trigger_count}x late` : `${alert.trigger_count} days absent`}
                            </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                            {alert.status==='sent' && alert.actioned_by_user && (
                                <div style={{ textAlign:'right', lineHeight:1.5 }}>
                                    <div style={{ fontSize:10, color:theme.textMute }}>Sent by</div>
                                    <div style={{ fontSize:12, fontWeight:800, color:theme.success }}>{alert.actioned_by_user.name}</div>
                                </div>
                            )}
                            {isPending && (
                                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                    <button onClick={()=>onSend(alert)} style={{
                                        background:'linear-gradient(135deg,#ea580c,#f97316)',
                                        border:'none', borderRadius:20, padding:'6px 16px',
                                        fontSize:11, fontWeight:700, cursor:'pointer', color:'#fff',
                                        display:'flex', alignItems:'center', gap:5,
                                        boxShadow:'0 2px 8px rgba(234,88,12,0.35)', transition:'opacity .15s',
                                    }}
                                    onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                                    onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                        </svg>
                                        Send Warning
                                    </button>
                                    <button onClick={()=>onDismiss(alert)} style={{
                                        background: dark?'linear-gradient(135deg,rgba(107,114,128,0.25),rgba(107,114,128,0.15))':'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
                                        border:'none', borderRadius:20, padding:'6px 14px',
                                        fontSize:11, fontWeight:700, cursor:'pointer',
                                        color: dark?'#9ca3af':'#6b7280',
                                        display:'flex', alignItems:'center', gap:5,
                                        boxShadow: dark?'0 2px 8px rgba(0,0,0,0.2)':'0 2px 8px rgba(107,114,128,0.15)',
                                        transition:'opacity .15s',
                                    }}
                                    onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
                                    onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Employee */}
                    {alert.user && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                            <Avatar name={alert.user.name} avatarUrl={alert.user.avatar_url} size={24}/>
                            <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>{alert.user.name}</span>
                            {alert.user.department && <span style={{ fontSize:11, color:'#6366f1' }}>{alert.user.department}</span>}
                            {alert.user.position && <span style={{ fontSize:11, color:theme.textMute }}>{alert.user.position}</span>}
                        </div>
                    )}

                    {/* Period + toggle */}
                    <div style={{ marginTop:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ display:'inline-flex', alignItems:'baseline', gap:5 }}>
                                <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.05em', color:theme.textMute }}>Period</span>
                                <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>{fmtMonth(alert.alert_month, alert.alert_year)}</span>
                            </span>
                            {alert.letter_draft && (
                                <button onClick={()=>setExpandedId(isExpanded ? null : alert.id)} style={{
                                    display:'flex', alignItems:'center', gap:4,
                                    fontSize:10, fontWeight:600, color:theme.primary,
                                    background:'transparent', border:'none', cursor:'pointer',
                                    padding:'2px 6px', borderRadius:6,
                                    transition:'background .15s',
                                }}
                                onMouseEnter={e=>e.currentTarget.style.background=dark?'rgba(124,58,237,0.15)':'rgba(124,58,237,0.08)'}
                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        {isExpanded
                                            ? <polyline points="18 15 12 9 6 15"/>
                                            : <polyline points="6 9 12 15 18 9"/>
                                        }
                                    </svg>
                                    {isExpanded ? 'Hide Letter' : 'View Letter'}
                                </button>
                            )}
                        </div>

                        {/* Collapsed preview */}
                        {!isExpanded && alert.letter_draft && (
                            <div style={{ fontSize:11, color:theme.textMute, fontStyle:'italic', marginTop:3 }}>
                                {alert.letter_draft.substring(0, 90)}...
                            </div>
                        )}

                        {/* Expanded full letter */}
                        {isExpanded && alert.letter_draft && (
                            <div style={{
                                marginTop:10, padding:'12px 14px', borderRadius:10,
                                background: dark ? 'rgba(255,255,255,0.04)' : 'rgb(211 211 211 / 27%)',
                                fontSize:12.5, color:theme.textSoft, lineHeight:1.7,
                                whiteSpace:'pre-wrap',
                            }}>
                                <div style={{
                                    display:'flex', alignItems:'center', gap:6,
                                    marginBottom:6,
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tc.accent} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.07em', color:tc.accent }}>Warning Letter</span>
                                </div>
                                <div style={{
                                    borderRadius:10,
                                  
                                    fontSize:12.5, color:theme.textSoft,
                                    lineHeight:1.75, whiteSpace:'pre-wrap',
                                }}>
                                    {alert.letter_draft}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Send Modal ─────────────────────────────────────────────────
function SendModal({ alert, dark, theme, loading, onCancel, onConfirm }) {
    const [letter, setLetter] = useState('');

    useEffect(() => {
        if (alert?.letter_draft) {
            setLetter(alert.letter_draft);
        }
    }, [alert]);
    const tc = TYPE_CFG[alert?.type] || TYPE_CFG.late;
    if (!alert) return null;
    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:dark?'#0f1b34':'#fff', borderRadius:22, width:'100%', maxWidth:580, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:'haPopIn .22s ease' }}>
                <div style={{ background:theme.modalHeader, padding:'18px 24px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, background:'rgba(255,255,255,0.06)', borderRadius:'50%' }}/>
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⚠️</div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:2 }}>HR Alert</div>
                                <div style={{ fontSize:16, fontWeight:900, color:'#fff' }}>Send Warning Letter</div>
                            </div>
                        </div>
                        <button onClick={onCancel} style={{ width:30, height:30, borderRadius:10, background:'rgba(255,255,255,0.14)', border:'none', cursor:'pointer', fontSize:18, color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                    </div>
                </div>
                <div style={{ padding:'20px 24px', flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
                    <div style={{ background:dark?'rgba(255,255,255,0.04)':'#f9fafb', border:`1px solid ${theme.border}`, borderRadius:14, padding:'13px 15px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <Avatar name={alert.user?.name} avatarUrl={alert.user?.avatar_url} size={32}/>
                            <div>
                                <div style={{ fontSize:13, fontWeight:800, color:theme.text }}>{alert.user?.name}</div>
                                <div style={{ fontSize:11, color:theme.textMute }}>{alert.user?.department} · {alert.user?.position}</div>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:dark?tc.bgDark:tc.bg, color:tc.color }}>
                                {tc.icon} {alert.type==='late' ? `Late ${alert.trigger_count}x` : `Absent ${alert.trigger_count} days`}
                            </span>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:dark?'rgba(255,255,255,0.07)':'#f1f5f9', color:theme.textMute }}>
                                {fmtMonth(alert.alert_month, alert.alert_year)}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize:11, fontWeight:700, color:theme.textMute, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>✏️ Edit Warning Letter</div>
                        <textarea value={letter} onChange={e=>setLetter(e.target.value)} rows={10}
                            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${theme.inputBorder}`, background:dark?theme.inputBg:'#fff', color:theme.text, fontSize:12.5, lineHeight:1.65, fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box' }}
                            onFocus={e=>e.target.style.borderColor='#7c3aed'}
                            onBlur={e=>e.target.style.borderColor=theme.inputBorder}/>
                        <div style={{ fontSize:11, color:theme.textMute, marginTop:6 }}>💡 AI-generated draft — review before sending</div>
                    </div>
                </div>
                <div style={{ borderTop:`1px solid ${theme.border}`, padding:'14px 24px', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
                    <button onClick={onCancel} disabled={loading} style={{ background:dark?'rgba(255,255,255,0.07)':'#f3f4f6', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', color:theme.textSoft }}>Cancel</button>
                    <button onClick={()=>onConfirm(letter)} disabled={loading||!letter.trim()} style={{ background:'linear-gradient(135deg,#ea580c,#f97316)', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:800, color:'#fff', cursor:(loading||!letter.trim())?'not-allowed':'pointer', opacity:(loading||!letter.trim())?.6:1, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(234,88,12,0.35)' }}>
                        {loading && <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'haSpin .7s linear infinite' }}/>}
                        {loading ? 'Sending...' : '📨 Send Warning'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function DismissModal({ alert, dark, theme, loading, onCancel, onConfirm }) {
    if (!alert) return null;
    const tc = TYPE_CFG[alert?.type] || TYPE_CFG.late;
    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:dark?'#0f1b34':'#fff', borderRadius:22, width:'100%', maxWidth:420, overflow:'hidden', boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:'haPopIn .22s ease' }}>
                <div style={{ height:4, background:'#6b7280' }}/>
                <div style={{ padding:'24px 24px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                        <div style={{ width:44, height:44, borderRadius:14, background:dark?'rgba(107,114,128,0.16)':'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>—</div>
                        <div>
                            <div style={{ fontSize:15, fontWeight:900, color:theme.text }}>Dismiss Alert</div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>No warning will be sent</div>
                        </div>
                    </div>
                    <div style={{ background:dark?'rgba(255,255,255,0.04)':'#f9fafb', border:`1px solid ${theme.border}`, borderRadius:12, padding:'12px 14px', fontSize:13, color:theme.textSoft }}>
                        <strong style={{ color:theme.text }}>{alert.user?.name}</strong>
                        {' — '}
                        <span style={{ color:tc.color, fontWeight:600 }}>{alert.type==='late' ? `Late ${alert.trigger_count}x` : `Absent ${alert.trigger_count} days`}</span>
                        {' · '}{fmtMonth(alert.alert_month, alert.alert_year)}
                    </div>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'0 24px 22px' }}>
                    <button onClick={onCancel} disabled={loading} style={{ background:dark?'rgba(255,255,255,0.07)':'#f3f4f6', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', color:theme.textSoft }}>Cancel</button>
                    <button onClick={onConfirm} disabled={loading} style={{ background:dark?'rgba(107,114,128,0.2)':'#6b7280', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color:'#fff', opacity:loading?.6:1 }}>
                        {loading ? 'Dismissing...' : 'Dismiss'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function HrAlertsIndex({ alerts, statusFilter, stats }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [activeStatus,  setActiveStatus]  = useState(statusFilter || 'pending');
    const [expandedId,    setExpandedId]    = useState(null);
    const [sendModal,     setSendModal]     = useState(null);
    const [dismissModal,  setDismissModal]  = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [runLoading,    setRunLoading]    = useState(false);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    const handleStatusChange = s => {
        setActiveStatus(s);
        router.get('/hr-alerts', { status:s }, { preserveState:true, preserveScroll:true });
    };

    const handleSend = letter => {
        setActionLoading(true);
        router.patch(`/hr-alerts/${sendModal.id}/send`, { letter }, {
            onSuccess: () => { setSendModal(null); setActionLoading(false); },
            onError:   () => setActionLoading(false),
        });
    };

    const handleDismiss = () => {
        setActionLoading(true);
        router.patch(`/hr-alerts/${dismissModal.id}/dismiss`, {}, {
            onSuccess: () => { setDismissModal(null); setActionLoading(false); },
            onError:   () => setActionLoading(false),
        });
    };

    const handleManualRun = async () => {
        setRunLoading(true);
        try {
            const res = await fetch('/hr-alerts/run', {
                method:'POST',
                headers:{
                    'X-CSRF-TOKEN': csrf(),
                    'X-Requested-With':'XMLHttpRequest',
                    'Content-Type':'application/json',
                },
            });
            const data = await res.json();
            if (data.success) router.reload();
        } catch(e) { console.error(e); }
        finally { setRunLoading(false); }
    };

    const alertList = alerts?.data || [];

    const tabs = [
        { key:'pending',   label:'Pending',   count:stats?.pending,   alert:stats?.pending > 0 },
        { key:'sent',      label:'Sent',       count:stats?.sent,      alert:false },
        { key:'dismissed', label:'Dismissed',  count:stats?.dismissed, alert:false },
        { key:'all',       label:'All',        count:stats?.total,     alert:false },
    ];

    return (
        <AppLayout title="HR Alerts">
            <Head title="HR Alerts"/>
            <style>{`
                @keyframes haPopIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
                @keyframes haSpin  { to{transform:rotate(360deg)} }
                .ha-hide::-webkit-scrollbar { display:none }
                .ha-hide { scrollbar-width:none; -ms-overflow-style:none }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                {/* ── Summary Cards ── */}
                <AlertSummaryCards stats={stats || {pending:0,late:0,absent:0,sent:0,dismissed:0,total:0}} dark={dark} theme={theme}/>

                {/* ── Header row ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ fontSize:12, color:theme.textMute, margin:0 }}>
                        AI-generated warning letters for attendance violations
                    </p>
                    <button onClick={handleManualRun} disabled={runLoading} style={{
                        height:38, padding:'0 16px', borderRadius:10,
                        border:`1px solid ${theme.border}`,
                        background: dark?'rgba(255,255,255,0.06)':'#f8fafc',
                        color:theme.textSoft, fontSize:12, fontWeight:600,
                        cursor:runLoading?'default':'pointer',
                        display:'flex', alignItems:'center', gap:6,
                        fontFamily:'inherit', transition:'all .15s',
                    }}
                    onMouseEnter={e=>{ if(!runLoading) e.currentTarget.style.background=dark?'rgba(255,255,255,0.1)':'#f1f5f9'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=dark?'rgba(255,255,255,0.06)':'#f8fafc'; }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ animation: runLoading?'haSpin 1s linear infinite':'none' }}>
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        {runLoading ? 'Checking...' : 'Run Check Now'}
                    </button>
                </div>

                {/* ── Tabbed panel ── */}
                <div style={{ background:dark?theme.panelSolid:'#fff', borderRadius:18, border:`1px solid ${theme.border}`, boxShadow:theme.shadowSoft, overflow:'hidden' }}>
                    {/* Tabs */}
                    <div className="ha-hide" style={{ display:'flex', borderBottom:`1px solid ${theme.border}`, padding:'0 4px', overflowX:'auto' }}>
                        {tabs.map(tab => {
                            const isActive = activeStatus === tab.key;
                            return (
                                <button key={tab.key} onClick={()=>handleStatusChange(tab.key)} style={{
                                    padding:'14px 18px', fontSize:13, fontWeight:isActive?800:500,
                                    color:isActive?theme.primary:theme.textMute,
                                    background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap',
                                    borderBottom:isActive?`2.5px solid ${theme.primary}`:'2.5px solid transparent',
                                    display:'flex', alignItems:'center', gap:8, transition:'all .15s',
                                }}>
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span style={{
                                            fontSize:10, fontWeight:800, borderRadius:99, padding:'2px 8px',
                                            background: tab.alert?(dark?'rgba(245,158,11,0.2)':'#fef3c7'):(isActive?theme.primarySoft:(dark?'rgba(255,255,255,0.08)':'#f3f4f6')),
                                            color: tab.alert?theme.warning:(isActive?theme.primary:theme.textMute),
                                        }}>{tab.count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* List */}
                    {alertList.length === 0 ? (
                        <div style={{ padding:'56px 24px', textAlign:'center' }}>
                            <div style={{ fontSize:36, marginBottom:12 }}>🎉</div>
                            <div style={{ fontSize:14, fontWeight:600, color:theme.textSoft, marginBottom:4 }}>
                                {activeStatus==='pending' ? 'No pending alerts' : 'No alerts found'}
                            </div>
                            <div style={{ fontSize:12, color:theme.textMute }}>
                                {activeStatus==='pending' ? 'All attendance within thresholds!' : 'Try a different filter.'}
                            </div>
                        </div>
                    ) : alertList.map((alert, idx) => (
                        <AlertRow
                            key={alert.id} alert={alert} dark={dark} theme={theme}
                            onSend={a=>setSendModal(a)} onDismiss={a=>setDismissModal(a)}
                            isLast={idx===alertList.length-1}
                            expandedId={expandedId} setExpandedId={setExpandedId}
                        />
                    ))}

                    {/* Pagination */}
                    {alerts?.last_page > 1 && (
                        <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'16px 20px', borderTop:`1px solid ${theme.border}` }}>
                            {Array.from({length:alerts.last_page},(_,i)=>i+1).map(pg => {
                                const a = alerts.current_page === pg;
                                return <button key={pg} onClick={()=>router.get('/hr-alerts',{page:pg,status:activeStatus})} style={{ width:34,height:34,borderRadius:10,border:`1px solid ${a?theme.primary:theme.border}`,background:a?theme.primary:'transparent',color:a?'#fff':theme.textSoft,fontWeight:a?700:500,cursor:'pointer',fontSize:13 }}>{pg}</button>;
                            })}
                        </div>
                    )}
                </div>
            </div>

            <SendModal    alert={sendModal}    dark={dark} theme={theme} loading={actionLoading} onCancel={()=>setSendModal(null)}    onConfirm={handleSend}/>
            <DismissModal alert={dismissModal} dark={dark} theme={theme} loading={actionLoading} onCancel={()=>setDismissModal(null)} onConfirm={handleDismiss}/>
        </AppLayout>
    );
}