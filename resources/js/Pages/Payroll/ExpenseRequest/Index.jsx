// resources/js/Pages/Payroll/ExpenseRequest/Index.jsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { createPortal } from 'react-dom';

const showToast = (msg, type = 'success') =>
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type } }));

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
        panelSolid:'#0f1b34', panelSoft:'rgba(255,255,255,0.04)', panelSofter:'rgba(255,255,255,0.07)',
        border:'rgba(148,163,184,0.13)', borderStrong:'rgba(148,163,184,0.28)',
        text:'#f8fafc', textSoft:'#cbd5e1', textMute:'#64748b',
        overlay:'rgba(2,8,23,0.78)', shadow:'0 24px 60px rgba(0,0,0,0.45)', shadowSoft:'0 4px 16px rgba(0,0,0,0.28)',
        primary:'#8b5cf6', primarySoft:'rgba(139,92,246,0.16)',
        success:'#10b981', successSoft:'rgba(16,185,129,0.16)',
        danger:'#f87171', dangerSoft:'rgba(248,113,113,0.14)',
        warning:'#fbbf24', warningSoft:'rgba(251,191,36,0.14)',
        inputBg:'rgba(255,255,255,0.06)', inputBorder:'rgba(148,163,184,0.18)',
        tableHead:'rgba(255,255,255,0.03)', rowHover:'rgba(255,255,255,0.025)',
        modalHeader:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
    };
    return {
        panelSolid:'#ffffff', panelSoft:'#f8fafc', panelSofter:'#f1f5f9',
        border:'rgba(15,23,42,0.08)', borderStrong:'rgba(15,23,42,0.2)',
        text:'#0f172a', textSoft:'#475569', textMute:'#94a3b8',
        overlay:'rgba(15,23,42,0.48)', shadow:'0 20px 50px rgba(15,23,42,0.14)', shadowSoft:'0 2px 8px rgba(15,23,42,0.06)',
        primary:'#7c3aed', primarySoft:'#f3e8ff',
        success:'#059669', successSoft:'#ecfdf5',
        danger:'#ef4444', dangerSoft:'#fef2f2',
        warning:'#d97706', warningSoft:'#fef3c7',
        inputBg:'#f8fafc', inputBorder:'#e2e8f0',
        tableHead:'#f8fafc', rowHover:'#fafbff',
        modalHeader:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
    };
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' });
}
function fmtMoney(n, currency='') {
    if (!n && n !== 0) return '—';
    return `${currency} ${Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}`.trim();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_CFG = {
    pending:  { label:'Pending',  color:'#d97706', bg:'#fffbeb', bgDark:'rgba(217,119,6,0.16)' },
    approved: { label:'Approved', color:'#059669', bg:'#ecfdf5', bgDark:'rgba(5,150,105,0.16)' },
    rejected: { label:'Rejected', color:'#ef4444', bg:'#fef2f2', bgDark:'rgba(239,68,68,0.16)' },
};

const CAT_COLORS = {
    transport:     { color:'#2563eb', bg:'#eff6ff', bgDark:'rgba(37,99,235,0.16)' },
    meal:          { color:'#d97706', bg:'#fffbeb', bgDark:'rgba(217,119,6,0.16)' },
    accommodation: { color:'#7c3aed', bg:'#f5f3ff', bgDark:'rgba(124,58,237,0.16)' },
    equipment:     { color:'#0891b2', bg:'#ecfeff', bgDark:'rgba(8,145,178,0.16)' },
    medical:       { color:'#dc2626', bg:'#fef2f2', bgDark:'rgba(220,38,38,0.16)' },
    training:      { color:'#059669', bg:'#ecfdf5', bgDark:'rgba(5,150,105,0.16)' },
    communication: { color:'#9333ea', bg:'#fdf4ff', bgDark:'rgba(147,51,234,0.16)' },
    other:         { color:'#6b7280', bg:'#f9fafb', bgDark:'rgba(107,114,128,0.16)' },
};
const CAT_ICONS = { transport:'🚗', meal:'🍽️', accommodation:'🏨', equipment:'💻', medical:'🏥', training:'📚', communication:'📱', other:'📋' };

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, url, size=34, theme }) {
    const [err, setErr] = useState(false);
    const initials = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const bg = ['#7c3aed','#059669','#2563eb','#d97706','#dc2626','#0891b2'][(name?.charCodeAt(0)||0)%6];
    if (url && !err)
        return <img src={`/storage/${url}`} alt={name} onError={()=>setErr(true)}
            style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`2px solid ${theme?.border||'#e5e7eb'}`}}/>;
    return <div style={{width:size,height:size,borderRadius:'50%',background:bg,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.36,fontWeight:800,color:'#fff'}}>{initials}</div>;
}

// ── Premium Dropdown (portal-based) ──────────────────────────
function PremiumDropdown({ options, value, onChange, theme, dark, width, placeholder='Select...' }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({top:0,left:0,width:0});
    const triggerRef = useRef(null);
    const menuRef    = useRef(null);
    const sel = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const fn = e => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const handleOpen = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) setPos({top:rect.bottom+window.scrollY+6, left:rect.left+window.scrollX, width:rect.width});
        setOpen(v=>!v);
    };

    return (
        <>
            <button ref={triggerRef} type="button" onClick={handleOpen} style={{
                width:width||'auto', minWidth:110, height:40, padding:'0 12px',
                borderRadius:10, border:`1.5px solid ${open?theme.primary:theme.inputBorder}`,
                background:dark?theme.panelSoft:'#fff',
                color:sel?theme.text:theme.textMute,
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                cursor:'pointer', fontSize:13, fontWeight:sel?600:400,
                boxShadow:open?`0 0 0 3px ${theme.primary}22`:'none',
                transition:'all 0.15s', outline:'none',
            }}>
                <span>{sel?.label||placeholder}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{transform:open?'rotate(180deg)':'none',transition:'transform 0.18s',color:theme.textMute,flexShrink:0}}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            {open && createPortal(
                <div ref={menuRef} className="ex-hide" style={{
                    position:'absolute', top:pos.top, left:pos.left, width:Math.max(pos.width,150),
                    zIndex:9999, background:dark?'#111e38':'#fff',
                    border:`1px solid ${theme.borderStrong}`, borderRadius:12,
                    boxShadow:theme.shadow, overflow:'hidden', animation:'exDrop 0.14s ease',
                }}>
                    {options.map(opt => {
                        const active = String(opt.value)===String(value);
                        return (
                            <button key={opt.value} type="button" onClick={()=>{onChange(opt.value);setOpen(false);}}
                                style={{
                                    width:'100%', background:active?(dark?`${theme.primary}22`:theme.primarySoft):'transparent',
                                    border:'none', padding:'9px 14px', fontSize:13,
                                    fontWeight:active?700:500, color:active?theme.primary:theme.textSoft,
                                    cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8,
                                    transition:'background 0.1s',
                                }}
                                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=dark?'rgba(255,255,255,0.05)':'#f8fafc';}}
                                onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}
                            >
                                {active&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                {!active&&<span style={{width:11}}/>}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}

// ── Approver Select (premium with avatar) ─────────────────────
function ApproverSelect({ approvers, value, onChange, error, theme, dark }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({top:0,left:0,width:0});
    const triggerRef = useRef(null);
    const menuRef    = useRef(null);
    const sel = approvers.find(a => String(a.id) === String(value));

    useEffect(() => {
        const fn = e => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const handleOpen = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) setPos({top:rect.bottom+window.scrollY+6, left:rect.left+window.scrollX, width:rect.width});
        setOpen(v=>!v);
    };

    return (
        <>
            <button ref={triggerRef} type="button" onClick={handleOpen} style={{
                width:'100%', height:44, padding:'0 13px',
                borderRadius:10, border:`1.5px solid ${error?theme.danger:open?theme.primary:theme.inputBorder}`,
                background:dark?theme.inputBg:(error?'#fff9f9':'#fff'),
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                cursor:'pointer', fontSize:13,
                boxShadow:open?`0 0 0 3px ${theme.primary}22`:error?`0 0 0 3px ${theme.danger}22`:'none',
                transition:'all 0.15s', outline:'none',
            }}>
                {sel ? (
                    <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                        <Avatar name={sel.name} url={sel.avatar_url} size={24} theme={theme}/>
                        <div style={{minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:theme.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sel.name}</div>
                            {sel.role?.name && <div style={{fontSize:10,color:theme.textMute,textTransform:'capitalize'}}>{sel.role.name}</div>}
                        </div>
                    </div>
                ) : (
                    <span style={{fontSize:13,color:theme.textMute}}>— Select approver —</span>
                )}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{transform:open?'rotate(180deg)':'none',transition:'transform 0.18s',color:theme.textMute,flexShrink:0}}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={menuRef} className="ex-hide" style={{
                    position:'absolute', top:pos.top, left:pos.left, width:Math.max(pos.width,200),
                    zIndex:9999, background:dark?'#111e38':'#fff',
                    border:`1px solid ${theme.borderStrong}`, borderRadius:14,
                    boxShadow:theme.shadow, overflow:'hidden', animation:'exDrop 0.14s ease',
                    padding:6,
                }}>
                    {approvers.length === 0 ? (
                        <div style={{padding:'14px 12px',fontSize:12,color:theme.textMute,textAlign:'center'}}>No approvers available</div>
                    ) : approvers.map(a => {
                        const active = String(a.id) === String(value);
                        return (
                            <button key={a.id} type="button" onClick={()=>{onChange(String(a.id));setOpen(false);}}
                                style={{
                                    width:'100%', background:active?(dark?`${theme.primary}22`:theme.primarySoft):'transparent',
                                    border:'none', padding:'8px 10px', borderRadius:9,
                                    cursor:'pointer', textAlign:'left',
                                    display:'flex', alignItems:'center', gap:10,
                                    transition:'background 0.12s', marginBottom:2,
                                }}
                                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=dark?'rgba(255,255,255,0.06)':theme.panelSoft;}}
                                onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}
                            >
                                <Avatar name={a.name} url={a.avatar_url} size={32} theme={theme}/>
                                <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,fontWeight:700,color:active?theme.primary:theme.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                                    {a.role?.name && <div style={{fontSize:10,color:theme.textMute,marginTop:1,textTransform:'capitalize'}}>{a.role.name}</div>}
                                </div>
                                {active && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color, soft, theme, dark, sub }) {
    return (
        <div className="ex-stat-card" style={{
            background:dark?theme.panelSolid:'#fff',
            border:`1px solid ${theme.border}`,
            borderRadius:16, padding:'16px 20px',
            display:'flex', alignItems:'center', gap:14,
            boxShadow:theme.shadowSoft, transition:'all 0.15s', cursor:'default',
        }}>
            <div style={{width:44,height:44,borderRadius:14,background:soft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                {icon}
            </div>
            <div>
                <div style={{fontSize:20,fontWeight:900,color,lineHeight:1.1}}>{value}</div>
                <div style={{fontSize:11,color:theme.textMute,fontWeight:600,marginTop:2}}>{label}</div>
                {sub && <div style={{fontSize:10,color:theme.textMute,marginTop:1,opacity:0.75}}>{sub}</div>}
            </div>
        </div>
    );
}

// ── Expense Row ───────────────────────────────────────────────
function ExpenseRow({ req, dark, theme, canViewAll, userId, onApprove, onReject, onDelete, isLast }) {
    const sc      = STATUS_CFG[req.status] || STATUS_CFG.pending;
    const catC    = CAT_COLORS[req.category] || CAT_COLORS.other;
    const catIcon = CAT_ICONS[req.category]  || '📋';
    const isMine  = req.user_id === userId;
    const showActions = canViewAll && req.status === 'pending';
    const showDelete  = isMine && req.status === 'pending';

    return (
        <div style={{display:'flex',alignItems:'stretch',borderBottom:isLast?'none':`1px solid ${theme.border}`}}>
            <div style={{width:3,background:catC.color,flexShrink:0,borderRadius:'3px 0 0 3px'}}/>
            <div style={{flex:1,padding:'14px 20px',display:'flex',gap:14,alignItems:'flex-start'}}>

                {/* Category icon */}
                <div style={{width:42,height:42,borderRadius:12,flexShrink:0,background:dark?catC.bgDark:catC.bg,border:`1px solid ${catC.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                    {catIcon}
                </div>

                <div style={{flex:1,minWidth:0}}>
                    {/* Title + badges */}
                    <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:5}}>
                        <span style={{fontSize:14,fontWeight:800,color:theme.text}}>{req.title}</span>
                        <span style={{fontSize:10,fontWeight:700,borderRadius:99,padding:'2px 9px',background:dark?sc.bgDark:sc.bg,color:sc.color}}>{sc.label}</span>
                        <span style={{fontSize:10,fontWeight:700,borderRadius:99,padding:'2px 9px',background:dark?catC.bgDark:catC.bg,color:catC.color,border:`1px solid ${catC.color}22`}}>
                            {catIcon} {req.category?.charAt(0).toUpperCase()+req.category?.slice(1)}
                        </span>
                    </div>

                    {/* Employee (HR view) */}
                    {canViewAll && req.user && (
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                            <Avatar name={req.user.name} url={req.user.avatar_url} size={20} theme={theme}/>
                            <span style={{fontSize:12,fontWeight:700,color:theme.textSoft}}>{req.user.name}</span>
                            {req.user.department && <span style={{fontSize:11,color:theme.textMute}}>· {req.user.department}</span>}
                        </div>
                    )}

                    {/* Date + Amount */}
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:req.description?6:0}}>
                        <span style={{fontSize:12,color:theme.textMute}}>📅 {fmtDate(req.expense_date)}</span>
                        <span style={{fontSize:13,fontWeight:800,color:catC.color,background:dark?catC.bgDark:catC.bg,border:`1px solid ${catC.color}33`,borderRadius:8,padding:'2px 10px'}}>
                            {fmtMoney(req.amount, req.currency)}
                        </span>
                        {req.reimbursed_at && (
                            <span style={{fontSize:10,fontWeight:700,color:theme.success,background:dark?theme.successSoft:'#ecfdf5',borderRadius:99,padding:'2px 8px'}}>
                                ✓ Reimbursed
                            </span>
                        )}
                    </div>

                    {/* Description — styled */}
                    {req.description && (
                        <div style={{marginTop:4,marginBottom:6,padding:'6px 10px',borderRadius:8,background:dark?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${theme.border}`,borderLeft:`3px solid ${theme.border}`,fontSize:11,color:theme.textSoft,lineHeight:1.6}}>
                            {req.description}
                        </div>
                    )}

                    {/* Attachments */}
                    {req.attachments?.length > 0 && (
                        <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap'}}>
                            {req.attachments.map((f,i) => (
                                <a key={i} href={`/payroll/expenses/${req.id}/attachments/${i}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:8,background:dark?theme.panelSofter:'#f1f5f9',border:`1px solid ${theme.border}`,fontSize:10,color:theme.textSoft,fontWeight:600,textDecoration:'none',transition:'all 0.13s'}}
                                    onMouseEnter={e=>{e.currentTarget.style.background=theme.primarySoft;e.currentTarget.style.color=theme.primary;}}
                                    onMouseLeave={e=>{e.currentTarget.style.background=dark?theme.panelSofter:'#f1f5f9';e.currentTarget.style.color=theme.textSoft;}}
                                >
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                    {f.name?.length>18?f.name.slice(0,16)+'…':f.name}
                                    <span style={{color:theme.textMute}}>{f.size}</span>
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Rejection reason card */}
                    {req.status==='rejected' && req.rejection_reason && (
                        <div style={{marginTop:8,display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',borderRadius:12,background:dark?'rgba(239,68,68,0.08)':'#fff5f5',border:`1.5px solid ${dark?'rgba(239,68,68,0.25)':'#fecaca'}`}}>
                            <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:dark?'rgba(239,68,68,0.18)':'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>✕</div>
                            <div>
                                <div style={{fontSize:10,fontWeight:800,color:'#ef4444',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Rejection Reason</div>
                                <div style={{fontSize:12,color:dark?'#fca5a5':'#dc2626',lineHeight:1.6}}>{req.rejection_reason}</div>
                            </div>
                        </div>
                    )}

                    {/* Approval note card */}
                    {req.status==='approved' && req.hr_note && (
                        <div style={{marginTop:8,display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',borderRadius:12,background:dark?'rgba(16,185,129,0.08)':'#f0fdf4',border:`1.5px solid ${dark?'rgba(16,185,129,0.25)':'#86efac'}`}}>
                            <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:dark?'rgba(16,185,129,0.18)':'#dcfce7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>💬</div>
                            <div>
                                <div style={{fontSize:10,fontWeight:800,color:'#059669',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Approver Note</div>
                                <div style={{fontSize:12,color:dark?'#6ee7b7':'#15803d',lineHeight:1.6}}>{req.hr_note}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: actions */}
                <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8,minWidth:120,alignSelf:'stretch',justifyContent:'space-between'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                        {showActions && (
                            <div style={{display:'flex',gap:6}}>
                                <button onClick={onApprove} style={{background:'#059669',border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer'}}>✓ Approve</button>
                                <button onClick={onReject} style={{background:dark?'rgba(239,68,68,0.12)':'#fff',border:`1px solid ${dark?'rgba(239,68,68,0.3)':'#fca5a5'}`,borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:700,color:'#ef4444',cursor:'pointer'}}>✕ Reject</button>
                            </div>
                        )}
                        {req.status==='approved' && <span style={{fontSize:12,color:theme.success,fontWeight:700}}>✓ Approved</span>}
                        {req.status==='rejected' && <span style={{fontSize:12,color:theme.danger,fontWeight:700}}>✕ Rejected</span>}
                        {req.status==='pending' && !showActions && (
                            <div style={{textAlign:'right'}}>
                                <div style={{fontSize:10,color:theme.textMute}}>Awaiting</div>
                                <div style={{fontSize:11,fontWeight:700,color:theme.primary}}>{req.approver?.name||'HR'}</div>
                            </div>
                        )}
                    </div>
                    {showDelete && (
                        <button onClick={onDelete} style={{width:32,height:32,borderRadius:8,background:dark?'rgba(239,68,68,0.12)':'#fee2e2',border:`1px solid ${dark?'rgba(239,68,68,0.22)':'#fca5a5'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.background=dark?'rgba(239,68,68,0.25)':'#fecaca';}}
                            onMouseLeave={e=>{e.currentTarget.style.background=dark?'rgba(239,68,68,0.12)':'#fee2e2';}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={dark?'#f87171':'#dc2626'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Request Modal ─────────────────────────────────────────────
function RequestModal({ open, onClose, approvers, categories, dark, theme, userRole }) {
    if (!open) return null;
    return createPortal(
        <RequestModalInner onClose={onClose} approvers={approvers} categories={categories} dark={dark} theme={theme} userRole={userRole}/>,
        document.body
    );
}

function RequestModalInner({ onClose, approvers, categories, dark, theme, userRole }) {
    // Admin = auto approve, no approver needed
    const isAdmin = userRole === 'admin';
    // HR = selects Admin as approver
    // Employee/Management = selects HR as approver
    const approverLabel = userRole === 'hr' ? 'Admin (Approver)' : 'HR (Approver)';

    const [form, setForm]     = useState({
        title:'', description:'', amount:'', category:'other',
        expense_date:'', approver_id: String(approvers[0]?.id || ''),
    });
    const [files, setFiles]       = useState([]);
    const [previews, setPreviews] = useState([]);
    const [errors, setErrors]     = useState({});
    const [saving, setSaving]     = useState(false);
    const [catOpen, setCatOpen]   = useState(false);
    const catRef = useRef(null);

    useEffect(() => {
        if (!catOpen) return;
        const h = e => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [catOpen]);

    const set = (k,v) => { setForm(f=>({...f,[k]:v})); if(errors[k]) setErrors(e=>({...e,[k]:null})); };

    const handleFiles = e => {
        const newFiles = Array.from(e.target.files);
        setFiles(p=>[...p,...newFiles]);
        setPreviews(p=>[...p,...newFiles.map(f=>({
            name:f.name,
            size:f.size<1024?`${f.size} B`:f.size<1048576?`${(f.size/1024).toFixed(1)} KB`:`${(f.size/1048576).toFixed(1)} MB`,
            type:f.type,
        }))]);
        e.target.value='';
    };
    const removeFile = i => { setFiles(p=>p.filter((_,j)=>j!==i)); setPreviews(p=>p.filter((_,j)=>j!==i)); };

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title='Title is required.';
        if (!form.amount||isNaN(form.amount)||Number(form.amount)<=0) e.amount='Enter a valid amount.';
        if (!form.expense_date) e.expense_date='Expense date is required.';
        if (!form.category) e.category='Category is required.';
        if (!isAdmin && !form.approver_id) e.approver_id='Please select an approver.';
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k,v])=>{ if(v) fd.append(k,v); });
        files.forEach(f=>fd.append('attachments[]',f));

        fetch('/payroll/expenses', {
            method:'POST', body:fd,
            headers:{
                'X-Requested-With':'XMLHttpRequest',
                'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content||'',
                'Accept':'application/json',
            }
        })
        .then(async r => {
            const data = await r.json();
            if (!r.ok || data.errors) {
                const errs = data.errors||{};
                if (Object.keys(errs).length) setErrors(errs);
                else showToast(data.message||'Something went wrong.','error');
                setSaving(false); return;
            }
            showToast(data.message||'Expense submitted! ✅');
            onClose(true);
        })
        .catch(()=>{ showToast('Network error. Please try again.','error'); setSaving(false); });
    };

    const inp = err => ({
        width:'100%', padding:'10px 13px', borderRadius:10, fontSize:13,
        border:`1.5px solid ${err?theme.danger:theme.inputBorder}`,
        background:dark?theme.inputBg:(err?'#fff9f9':'#fff'),
        color:theme.text, outline:'none', boxSizing:'border-box',
        fontFamily:'inherit', transition:'border-color 0.15s',
    });
    const lbl = { display:'block', fontSize:11, fontWeight:700, color:theme.textMute, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' };

    const catOptions = Object.entries(categories).map(([k,v])=>({value:k, label:`${CAT_ICONS[k]||'📋'} ${v}`}));
    const selCat = catOptions.find(o=>o.value===form.category);

    return (
        <div onClick={e=>e.target===e.currentTarget&&onClose(false)}
            style={{position:'fixed',inset:0,background:theme.overlay,backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:dark?'#0f1b34':'#fff',borderRadius:22,width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:theme.shadow,border:`1px solid ${theme.border}`,animation:'exPopIn 0.22s ease'}}>

                {/* Header */}
                <div style={{background:theme.modalHeader,padding:'20px 24px 18px',flexShrink:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{display:'flex',gap:14,alignItems:'center'}}>
                            <div style={{width:44,height:44,borderRadius:14,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>💸</div>
                            <div>
                                <div style={{fontSize:10,color:'rgba(255,255,255,0.55)',fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:3}}>Expense Request</div>
                                <div style={{fontSize:17,fontWeight:900,color:'#fff'}}>Submit Expense</div>
                            </div>
                        </div>
                        <button onClick={()=>onClose(false)} style={{width:32,height:32,borderRadius:10,background:'rgba(255,255,255,0.16)',border:'none',cursor:'pointer',fontSize:20,color:'rgba(255,255,255,0.85)',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                    </div>
                </div>

                {/* Body */}
                <div className="ex-hide" style={{padding:'22px 24px',overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:14}}>

                    <div>
                        <label style={lbl}>Title <span style={{color:theme.danger}}>*</span></label>
                        <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Client dinner, Taxi to airport…" style={inp(errors.title)}/>
                        {errors.title && <p style={{margin:'4px 0 0',fontSize:11,color:theme.danger}}>{errors.title}</p>}
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                        <div>
                            <label style={lbl}>Amount <span style={{color:theme.danger}}>*</span></label>
                            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" style={inp(errors.amount)}/>
                            {errors.amount && <p style={{margin:'4px 0 0',fontSize:11,color:theme.danger}}>{errors.amount}</p>}
                        </div>
                        <div>
                            <label style={lbl}>Category <span style={{color:theme.danger}}>*</span></label>
                            <div ref={catRef} style={{position:'relative'}}>
                                <button type="button" onClick={()=>setCatOpen(v=>!v)} style={{
                                    ...inp(errors.category), display:'flex', alignItems:'center', justifyContent:'space-between',
                                    cursor:'pointer', border:`1.5px solid ${catOpen?theme.primary:(errors.category?theme.danger:theme.inputBorder)}`,
                                    boxShadow:catOpen?`0 0 0 3px ${theme.primary}22`:'none',
                                }}>
                                    <span style={{color:selCat?theme.text:theme.textMute}}>{selCat?.label||'Select…'}</span>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:catOpen?'rotate(180deg)':'none',transition:'transform 0.18s',color:theme.textMute}}>
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </button>
                                {catOpen && (
                                    <div className="ex-hide" style={{position:'absolute',top:'calc(100% + 5px)',left:0,right:0,zIndex:500,background:dark?'#111e38':'#fff',border:`1px solid ${theme.borderStrong}`,borderRadius:12,boxShadow:theme.shadow,maxHeight:220,overflowY:'auto',animation:'exDrop 0.14s ease'}}>
                                        {catOptions.map(opt=>{
                                            const active=form.category===opt.value;
                                            return (
                                                <button key={opt.value} type="button" onClick={()=>{set('category',opt.value);setCatOpen(false);}}
                                                    style={{width:'100%',background:active?(dark?`${theme.primary}22`:theme.primarySoft):'transparent',border:'none',padding:'9px 13px',fontSize:12,fontWeight:active?700:500,color:active?theme.primary:theme.textSoft,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:7,transition:'background 0.1s'}}
                                                    onMouseEnter={e=>{if(!active)e.currentTarget.style.background=dark?'rgba(255,255,255,0.05)':'#f8fafc';}}
                                                    onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}
                                                >
                                                    {active&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {errors.category && <p style={{margin:'4px 0 0',fontSize:11,color:theme.danger}}>{errors.category}</p>}
                        </div>
                    </div>

                    <div>
                        <label style={lbl}>Expense Date <span style={{color:theme.danger}}>*</span></label>
                        <input type="date" value={form.expense_date} max={new Date().toISOString().slice(0,10)} onChange={e=>set('expense_date',e.target.value)} style={inp(errors.expense_date)}/>
                        {errors.expense_date && <p style={{margin:'4px 0 0',fontSize:11,color:theme.danger}}>{errors.expense_date}</p>}
                    </div>

                    <div>
                        <label style={lbl}>Description <span style={{color:theme.textMute,fontWeight:400,textTransform:'none'}}>(optional)</span></label>
                        <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="Additional details about this expense…" style={{...inp(false),resize:'none',lineHeight:1.6}}/>
                    </div>

                    {/* Approver — shown only for non-admin */}
                    {!isAdmin && (
                        <div>
                            <label style={lbl}>
                                {approverLabel} <span style={{color:theme.danger}}>*</span>
                            </label>
                            {approvers.length > 0 ? (
                                <ApproverSelect
                                    approvers={approvers}
                                    value={form.approver_id}
                                    onChange={v=>set('approver_id',v)}
                                    error={errors.approver_id}
                                    theme={theme}
                                    dark={dark}
                                />
                            ) : (
                                <div style={{padding:'10px 13px',borderRadius:10,background:dark?theme.dangerSoft:'#fef2f2',border:`1px solid ${theme.danger}22`,fontSize:12,color:theme.danger}}>
                                    ⚠ No {userRole==='hr'?'admin':'HR'} users found in your country.
                                </div>
                            )}
                            {errors.approver_id && <p style={{margin:'4px 0 0',fontSize:11,color:theme.danger}}>{errors.approver_id}</p>}
                        </div>
                    )}

                    {/* Admin auto-approve notice */}
                    {isAdmin && (
                        <div style={{background:dark?theme.successSoft:'#ecfdf5',border:`1px solid ${dark?'rgba(16,185,129,0.3)':'#6ee7b7'}`,borderRadius:10,padding:'9px 13px',fontSize:12,color:theme.success,fontWeight:600}}>
                            ✓ As Admin, this request will be auto-approved instantly.
                        </div>
                    )}

                    {/* File upload */}
                    <div>
                        <label style={lbl}>
                            Attachments
                            <span style={{color:theme.textMute,fontWeight:400,textTransform:'none'}}> — receipts, invoices, docs (max 5)</span>
                        </label>
                        <label style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',border:`2px dashed ${theme.inputBorder}`,borderRadius:12,cursor:'pointer',background:dark?'rgba(255,255,255,0.02)':'#fafafa',transition:'all 0.15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=theme.primary;e.currentTarget.style.background=dark?theme.primarySoft:'#f5f3ff';}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=theme.inputBorder;e.currentTarget.style.background=dark?'rgba(255,255,255,0.02)':'#fafafa';}}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            <span style={{fontSize:12,color:theme.textMute}}>Click to upload files</span>
                            <input type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFiles} style={{display:'none'}} disabled={files.length>=5}/>
                        </label>
                        {previews.length>0 && (
                            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                                {previews.map((f,i)=>(
                                    <span key={i} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,background:dark?theme.panelSofter:'#f1f5f9',border:`1px solid ${theme.border}`,fontSize:11,color:theme.textSoft}}>
                                        {f.type?.startsWith('image/')?'🖼️':f.type==='application/pdf'?'📄':'📎'}
                                        {f.name.length>20?f.name.slice(0,18)+'…':f.name}
                                        <span style={{color:theme.textMute}}>{f.size}</span>
                                        <button type="button" onClick={()=>removeFile(i)} style={{background:'none',border:'none',cursor:'pointer',color:theme.textMute,fontSize:13,lineHeight:1,padding:0}}>×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{padding:'14px 24px',borderTop:`1px solid ${theme.border}`,display:'flex',justifyContent:'flex-end',gap:10,flexShrink:0,background:dark?'rgba(255,255,255,0.02)':'#f8fafc'}}>
                    <button onClick={()=>onClose(false)} disabled={saving} style={{padding:'9px 18px',borderRadius:10,border:`1px solid ${theme.border}`,background:dark?theme.panelSoft:'#fff',color:theme.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                    <button onClick={handleSubmit} disabled={saving} style={{padding:'9px 22px',borderRadius:10,border:'none',background:saving?theme.textMute:theme.modalHeader,color:'#fff',fontSize:13,fontWeight:800,cursor:saving?'not-allowed':'pointer',opacity:saving?0.65:1,display:'flex',alignItems:'center',gap:8,boxShadow:saving?'none':`0 6px 18px ${theme.primary}35`,transition:'all 0.15s'}}>
                        {saving&&<span style={{width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'exSpin 0.7s linear infinite'}}/>}
                        {saving?'Submitting…':'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Confirm Modal ─────────────────────────────────────────────
function ConfirmModal({ type, req, loading, dark, theme, onCancel, onConfirm }) {
    const isApprove = type==='approve';
    const isDelete  = type==='delete';
    const [note, setNote]     = useState('');
    const [reason, setReason] = useState('');

    return createPortal(
        <div style={{position:'fixed',inset:0,background:theme.overlay,backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:dark?'#0f1b34':'#fff',borderRadius:22,width:'100%',maxWidth:420,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:theme.shadow,border:`1px solid ${theme.border}`,animation:'exPopIn 0.22s ease'}}>
                <div style={{height:4,background:isApprove?'linear-gradient(90deg,#059669,#10b981)':'linear-gradient(90deg,#dc2626,#ef4444)'}}/>
                <div style={{padding:'22px 24px',display:'flex',flexDirection:'column',gap:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:14}}>
                        <div style={{width:46,height:46,borderRadius:14,flexShrink:0,background:isApprove?(dark?theme.successSoft:'#d1fae5'):(dark?theme.dangerSoft:'#fee2e2'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                            {isDelete?'🗑':isApprove?'✓':'✕'}
                        </div>
                        <div>
                            <div style={{fontSize:16,fontWeight:900,color:theme.text}}>
                                {isDelete?'Delete Request':isApprove?'Approve Expense':'Reject Expense'}
                            </div>
                            <div style={{fontSize:11,color:theme.textMute,marginTop:2}}>
                                {isDelete?'This cannot be undone.':isApprove?'Employee will be notified.':'Provide a reason for rejection.'}
                            </div>
                        </div>
                    </div>

                    {req && (
                        <div style={{background:dark?theme.panelSoft:'#f8fafc',border:`1px solid ${theme.border}`,borderRadius:12,padding:'11px 14px'}}>
                            <div style={{fontSize:13,fontWeight:700,color:theme.text}}>{req.title}</div>
                            <div style={{fontSize:12,color:theme.textMute,marginTop:2}}>{fmtMoney(req.amount,req.currency)} · {fmtDate(req.expense_date)}</div>
                        </div>
                    )}

                    {isApprove && (
                        <div>
                            <label style={{display:'block',fontSize:11,fontWeight:700,color:theme.textMute,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                                Note <span style={{fontWeight:400,textTransform:'none'}}>(optional)</span>
                            </label>
                            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Add a note for the employee…"
                                style={{width:'100%',padding:'9px 12px',borderRadius:10,border:`1.5px solid ${theme.inputBorder}`,background:dark?theme.inputBg:'#fff',color:theme.text,fontSize:12,outline:'none',boxSizing:'border-box',resize:'none',fontFamily:'inherit'}}/>
                        </div>
                    )}

                    {!isApprove && !isDelete && (
                        <div>
                            <label style={{display:'block',fontSize:11,fontWeight:700,color:theme.textMute,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                                Rejection Reason <span style={{color:theme.danger}}>*</span>
                            </label>
                            <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} placeholder="Why is this being rejected?…"
                                style={{width:'100%',padding:'9px 12px',borderRadius:10,border:`1.5px solid ${reason.trim()?theme.inputBorder:theme.danger}`,background:dark?theme.inputBg:'#fff',color:theme.text,fontSize:12,outline:'none',boxSizing:'border-box',resize:'none',fontFamily:'inherit'}}/>
                        </div>
                    )}

                    <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4}}>
                        <button onClick={onCancel} disabled={loading} style={{padding:'9px 18px',borderRadius:10,border:`1px solid ${theme.border}`,background:dark?theme.panelSoft:'#fff',color:theme.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                        <button
                            onClick={()=>{ if(!isApprove&&!isDelete&&!reason.trim()) return; onConfirm({hr_note:note,rejection_reason:reason}); }}
                            disabled={loading||(!isApprove&&!isDelete&&!reason.trim())}
                            style={{padding:'9px 20px',borderRadius:10,border:'none',background:isApprove?'linear-gradient(135deg,#059669,#10b981)':'linear-gradient(135deg,#dc2626,#ef4444)',color:'#fff',fontSize:13,fontWeight:800,cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1,boxShadow:isApprove?'0 4px 14px rgba(5,150,105,0.35)':'0 4px 14px rgba(220,38,38,0.35)'}}>
                            {loading?'Processing…':isDelete?'🗑 Delete':isApprove?'✓ Approve':'✕ Reject'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ExpenseRequestIndex({
    requests, approvers=[], stats={}, pendingCount=0,
    canViewAll=false, filters={}, selectedMonth, selectedYear,
    categories={}, userRole='employee',
}) {
    const dark    = useReactiveTheme();
    const theme   = useMemo(()=>getTheme(dark),[dark]);
    const { auth } = usePage().props;
    const userId  = auth?.user?.id;

    const [mainTab,       setMainTab]       = useState('my');
    const [month,         setMonth]         = useState(selectedMonth||new Date().getMonth()+1);
    const [year,          setYear]          = useState(selectedYear||new Date().getFullYear());
    const [statusFilter,  setStatusFilter]  = useState(filters?.status||'');
    const [showModal,     setShowModal]     = useState(false);
    const [confirmModal,  setConfirmModal]  = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleMonthYearFilter = (m,y) =>
        router.get('/payroll/expenses',{month:m,year:y,status:statusFilter},{preserveScroll:true});
    const handleStatusFilter = v => {
        setStatusFilter(v);
        router.get('/payroll/expenses',{month,year,status:v},{preserveState:true,preserveScroll:true});
    };

    const handleConfirm = ({hr_note,rejection_reason}) => {
        if (!confirmModal) return;
        setActionLoading(true);
        const {type,req} = confirmModal;

        if (type==='delete') {
            router.delete(`/payroll/expenses/${req.id}`,{
                onSuccess:()=>{ setConfirmModal(null); setActionLoading(false); },
                onError:()=>{ setActionLoading(false); showToast('Could not delete.','error'); },
            });
            return;
        }

        const url = type==='approve'
            ? `/payroll/expenses/${req.id}/approve`
            : `/payroll/expenses/${req.id}/reject`;

        router.patch(url, type==='approve'?{hr_note}:{rejection_reason}, {
            onSuccess:()=>{ setConfirmModal(null); setActionLoading(false); },
            onError:()=>{ setActionLoading(false); showToast('Something went wrong.','error'); },
        });
    };

    const allRequests      = requests?.data||[];
    const myRequests       = allRequests.filter(r=>r.user_id===userId);
    const approvalRequests = allRequests.filter(r=>r.approver_id===userId&&r.user_id!==userId&&r.status==='pending');
    const displayList      = mainTab==='approvals'?approvalRequests:mainTab==='all'?allRequests:myRequests;

    const monthOpts  = MONTHS.map((m,i)=>({value:i+1,label:m}));
    const yearOpts   = [2024,2025,2026,2027].map(y=>({value:y,label:String(y)}));
    const statusOpts = [
        {value:'',label:'All Status'},
        {value:'pending',label:'⏳ Pending'},
        {value:'approved',label:'✅ Approved'},
        {value:'rejected',label:'✕ Rejected'},
    ];

    const tabs = [
        {key:'my',label:'My Requests',count:myRequests.length,alert:false},
        ...(canViewAll?[{key:'approvals',label:'Pending Approvals',count:pendingCount,alert:pendingCount>0}]:[]),
        ...(canViewAll?[{key:'all',label:'All Requests',count:requests?.total||0,alert:false}]:[]),
    ];

    const selMonthLabel = MONTHS[(month||1)-1];
    const reimbursementDisplay = Number(stats.total_amount??0).toLocaleString('en-US',{minimumFractionDigits:2});

    return (
        <AppLayout title="Expense Request">
            <Head title="Expense Request"/>
            <style>{`
                @keyframes exDrop  { from{opacity:0;transform:translateY(-7px);}to{opacity:1;transform:translateY(0);} }
                @keyframes exPopIn { from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);} }
                @keyframes exSpin  { to{transform:rotate(360deg);} }
                .ex-hide::-webkit-scrollbar{display:none;}.ex-hide{scrollbar-width:none;-ms-overflow-style:none;}
                .ex-stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12) !important;}
            `}</style>

            <div style={{display:'flex',flexDirection:'column',gap:18}}>

                {/* Stats */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:12}}>
                    <StatCard icon="💸" label={`Total · ${selMonthLabel}`} value={stats.total??0} color={theme.primary} soft={theme.primarySoft} theme={theme} dark={dark}/>
                    <StatCard icon="⏳" label={`Pending · ${selMonthLabel}`} value={stats.pending??0} color={theme.warning} soft={theme.warningSoft} theme={theme} dark={dark}/>
                    <StatCard icon="✅" label={`Approved · ${selMonthLabel}`} value={stats.approved??0} color={theme.success} soft={theme.successSoft} theme={theme} dark={dark}/>
                    <StatCard icon="✕" label={`Rejected · ${selMonthLabel}`} value={stats.rejected??0} color={theme.danger} soft={theme.dangerSoft} theme={theme} dark={dark}/>
                    <StatCard icon="💰" label="Unreimbursed" value={reimbursementDisplay} color="#059669" soft={theme.successSoft} theme={theme} dark={dark} sub="All-time · approved, not paid"/>
                </div>

                {/* Filters + Add */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <PremiumDropdown options={monthOpts}  value={month}        onChange={v=>{const m=Number(v);setMonth(m);handleMonthYearFilter(m,year);}} theme={theme} dark={dark} width={145}/>
                        <PremiumDropdown options={yearOpts}   value={year}         onChange={v=>{const y=Number(v);setYear(y);handleMonthYearFilter(month,y);}} theme={theme} dark={dark} width={100}/>
                        <PremiumDropdown options={statusOpts} value={statusFilter} onChange={handleStatusFilter} theme={theme} dark={dark} width={150}/>
                    </div>
                    <button onClick={()=>setShowModal(true)}
                        onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                        onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
                        style={{background:`linear-gradient(135deg,${theme.primary},${dark?'#6d28d9':'#4f46e5'})`,color:'#fff',border:'none',borderRadius:12,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8,boxShadow:`0 8px 22px ${theme.primary}44`,transition:'all 0.15s'}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Submit Expense
                    </button>
                </div>

                {/* Tabbed Panel */}
                <div style={{background:dark?theme.panelSolid:'#fff',borderRadius:18,border:`1px solid ${theme.border}`,boxShadow:theme.shadowSoft,overflow:'hidden'}}>
                    <div className="ex-hide" style={{display:'flex',borderBottom:`1px solid ${theme.border}`,padding:'0 4px',overflowX:'auto'}}>
                        {tabs.map(tab=>{
                            const isActive=mainTab===tab.key;
                            return (
                                <button key={tab.key} onClick={()=>setMainTab(tab.key)} style={{padding:'14px 18px',fontSize:13,fontWeight:isActive?800:500,color:isActive?theme.primary:theme.textMute,background:'none',border:'none',cursor:'pointer',whiteSpace:'nowrap',borderBottom:isActive?`2.5px solid ${theme.primary}`:'2.5px solid transparent',display:'flex',alignItems:'center',gap:8,transition:'all 0.15s'}}>
                                    {tab.label}
                                    {tab.count>0 && (
                                        <span style={{fontSize:10,fontWeight:800,borderRadius:99,padding:'2px 8px',background:tab.alert?(dark?'rgba(245,158,11,0.2)':'#fef3c7'):(isActive?theme.primarySoft:(dark?'rgba(255,255,255,0.08)':'#f3f4f6')),color:tab.alert?theme.warning:(isActive?theme.primary:theme.textMute)}}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {displayList.length===0 ? (
                        <div style={{padding:'56px 24px',textAlign:'center'}}>
                            <div style={{fontSize:40,marginBottom:12}}>{mainTab==='approvals'?'🎉':'💸'}</div>
                            <div style={{fontSize:14,fontWeight:600,color:theme.textSoft,marginBottom:4}}>
                                {mainTab==='approvals'?'No pending approvals':'No expense requests found'}
                            </div>
                            <div style={{fontSize:12,color:theme.textMute}}>
                                {mainTab==='approvals'?'All caught up!':'Click "Submit Expense" to add a new request.'}
                            </div>
                        </div>
                    ) : displayList.map((req,idx)=>(
                        <ExpenseRow key={req.id} req={req} dark={dark} theme={theme}
                            canViewAll={canViewAll} userId={userId}
                            onApprove={()=>setConfirmModal({type:'approve',req})}
                            onReject={()=>setConfirmModal({type:'reject',req})}
                            onDelete={()=>setConfirmModal({type:'delete',req})}
                            isLast={idx===displayList.length-1}
                        />
                    ))}

                    {mainTab==='all' && requests?.last_page>1 && (
                        <div style={{display:'flex',justifyContent:'center',gap:6,padding:'16px 20px',borderTop:`1px solid ${theme.border}`}}>
                            {Array.from({length:requests.last_page},(_,i)=>i+1).map(pg=>{
                                const a=requests.current_page===pg;
                                return <button key={pg} onClick={()=>router.get('/payroll/expenses',{page:pg,month,year,status:statusFilter})} style={{width:34,height:34,borderRadius:10,border:`1px solid ${a?theme.primary:theme.border}`,background:a?theme.primary:'transparent',color:a?'#fff':theme.textSoft,fontWeight:a?700:500,cursor:'pointer',fontSize:13}}>{pg}</button>;
                            })}
                        </div>
                    )}
                </div>
            </div>

            <RequestModal
                open={showModal}
                onClose={saved=>{setShowModal(false);if(saved)router.reload({only:['requests','stats']});}}
                approvers={approvers} categories={categories}
                dark={dark} theme={theme} userRole={userRole}
            />
            {confirmModal && (
                <ConfirmModal type={confirmModal.type} req={confirmModal.req}
                    loading={actionLoading} dark={dark} theme={theme}
                    onCancel={()=>setConfirmModal(null)} onConfirm={handleConfirm}
                />
            )}
        </AppLayout>
    );
}