import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const csrf         = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const fmt          = (v, code = '') => `${code ? code+' ' : ''}${Number(v??0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`.trim();
// fmtC: show currency + compact number, hide .00 decimals, show — if zero
const fmtC = (v, code='') => {
    const n = Number(v??0);
    if (n === 0) return '—';
    const s = n % 1 === 0 ? n.toLocaleString('en-US') : n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    return code ? `${code} ${s}` : s;
};

const STEPS = [
    { key:'attendance', label:'Attendance Import',   summary:'Download template · fill check-in/out · upload',
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
    { key:'calculate',  label:'Salary Calculation',  summary:'Calculate based on attendance, leave, OT & HR policy',
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg> },
    { key:'preview',    label:'Preview & Approve',   summary:'Review salary breakdown · add bonus · approve',
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
];

function Toast({ msg, type, onClose }) {
    useEffect(() => { if (msg) { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); } }, [msg]);
    if (!msg) return null;
    const e = type === 'error';
    return (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: e?'#fef2f2':'#f0fdf4', border:`1px solid ${e?'#fca5a5':'#86efac'}`, borderRadius:12, padding:'12px 16px', color: e?'#991b1b':'#166534', fontSize:13, fontWeight:600, maxWidth:360, boxShadow:'0 8px 30px rgba(0,0,0,.12)', display:'flex', alignItems:'center', gap:10, animation:'slideIn 0.2s ease' }}>
            <span style={{ fontSize:16 }}>{e ? '❌' : '✅'}</span>
            <span style={{ flex:1 }}>{msg}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, lineHeight:1, color:'inherit', opacity:0.6 }}>×</button>
        </div>
    );
}

function Spinner({ color='#7c3aed', size=14 }) {
    return <div style={{ width:size, height:size, border:`2px solid ${color}33`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }} />;
}

function StatusPill({ status }) {
    const c = { draft:{label:'Draft',bg:'#f3f4f6',color:'#6b7280'}, calculated:{label:'Calculated',bg:'#dbeafe',color:'#1d4ed8'}, approved:{label:'Approved',bg:'#d1fae5',color:'#059669'}, paid:{label:'Paid',bg:'#fef3c7',color:'#d97706'} }[status] ?? {label:'Draft',bg:'#f3f4f6',color:'#6b7280'};
    return <span style={{ fontSize:10, fontWeight:700, background:c.bg, color:c.color, borderRadius:99, padding:'3px 8px', whiteSpace:'nowrap' }}>{c.label}</span>;
}

function Modal({ title, children, onClose }) {
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#111827' }}>{title}</div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#9ca3af', lineHeight:1 }}>×</button>
                </div>
                <div style={{ padding:'16px 20px 20px', overflowY:'auto', flex:1 }}>{children}</div>
            </div>
        </div>
    );
}

function SectionHead({ label }) {
    return <div style={{ padding:'5px 0 4px', fontSize:10, fontWeight:800, color:'#9ca3af', letterSpacing:'1.5px', marginTop:10, borderBottom:'1px solid #f3f4f6' }}>{label}</div>;
}
function Row({ label, val, color }) {
    return (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f9fafb' }}>
            <span style={{ fontSize:12, color:'#6b7280', fontWeight:600, flex:1, marginRight:12 }}>{label}</span>
            <span style={{ fontSize:12, fontWeight:700, color: color||'#111827', flexShrink:0 }}>{val}</span>
        </div>
    );
}



// ── Helper: decimal hours → "Xh Ymin" ─────────────────────────────────────────
function fmtHours(h) {
    const hrs = Math.floor(h);
    const min = Math.round((h - hrs) * 60);
    if (hrs > 0 && min > 0) return `${hrs}h ${min}min`;
    if (hrs > 0) return `${hrs}h`;
    if (min > 0) return `${min}min`;
    return '0';
}

// ── Helper: "17:00:00" → "5:00 PM" ────────────────────────────────────────────
function fmtTime(t) {
    if (!t) return '';
    const [hStr, mStr] = t.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${ampm}`;
}

// ── Clickable badge ────────────────────────────────────────────────────────────
function ClickBadge({ label, color, bg, onClick }) {
    return (
        <span onClick={onClick} style={{ fontSize:10, background:bg, color, borderRadius:99, padding:'2px 8px', fontWeight:700, cursor:'pointer', border:`1px solid ${color}22`, userSelect:'none', whiteSpace:'nowrap' }}>
            {label}
        </span>
    );
}

// ── Mini popup modal with styled header ───────────────────────────────────────
function MiniModal({ title, subtitle, icon, onClose, children }) {
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,7,46,0.55)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:420, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.3)', overflow:'hidden' }}>
                {/* Styled header */}
                <div style={{ background:'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding:'16px 18px 14px', flexShrink:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'0.8px', marginBottom:3 }}>
                                {icon} {subtitle?.toUpperCase() || 'DETAILS'}
                            </div>
                            <div style={{ fontSize:15, fontWeight:900, color:'#fff', letterSpacing:'-0.2px' }}>{title}</div>
                        </div>
                        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
                    </div>
                </div>
                {/* Body */}
                <div style={{ overflowY:'auto', padding:'14px 18px 18px', flex:1 }}>{children}</div>
            </div>
        </div>
    );
}

// ── Salary Detail Modal — header with employee info ───────────────────────────
function SalaryDetailModal({ detail, curr, onApprove, onClose }) {
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,7,46,0.55)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.3)', overflow:'hidden' }}>
                {/* Purple header */}
                <div style={{ background:'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding:'20px 22px 16px', flexShrink:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600, letterSpacing:'0.5px', marginBottom:3 }}>SALARY DETAIL</div>
                            <div style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{detail.name}</div>
                            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:4 }}>
                                {detail.position && <span>{detail.position}</span>}
                                {detail.department && <span> · {detail.department}</span>}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
                    </div>
                    {/* Period badge */}
                    <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11, background:'rgba(255,255,255,0.18)', color:'#fff', borderRadius:99, padding:'3px 12px', fontWeight:700 }}>
                            {detail.period_start} — {detail.period_end}
                        </span>
                        <span style={{ fontSize:11, background: detail.status==='approved'?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.12)', color:'#fff', borderRadius:99, padding:'3px 10px', fontWeight:700 }}>
                            {detail.status?.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Scrollable body */}
                <div style={{ overflowY:'auto', flex:1, padding:'16px 20px 20px' }}>
                    <DetailModalContent detail={detail} curr={curr} onApprove={onApprove} onClose={onClose} />
                </div>
            </div>
        </div>
    );
}

// ── Detail card section ────────────────────────────────────────────────────────
function DetailCard({ icon, title, color, titleColor, children }) {
    return (
        <div style={{ borderRadius:12, overflow:'hidden', border:`1.5px solid ${color}`, marginBottom:12 }}>
            <div style={{ background:color, padding:'9px 16px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13 }}>{icon}</span>
                <span style={{ fontSize:11, fontWeight:800, color:titleColor, letterSpacing:'0.8px', textTransform:'uppercase' }}>{title}</span>
            </div>
            <div style={{ background:'#fafafa', padding:'2px 0' }}>
                {children}
            </div>
        </div>
    );
}

// ── Single data row ────────────────────────────────────────────────────────────
function DetailRow({ label, val, color, bold }) {
    return (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
            <span style={{ fontSize:12, color:'#6b7280', fontWeight:500, flex:1, marginRight:12 }}>{label}</span>
            <span style={{ fontSize:12, fontWeight:bold?800:600, color:color||'#111827', flexShrink:0 }}>{val}</span>
        </div>
    );
}

// ── Short hour deduction row ───────────────────────────────────────────────────
function ShortHourRow({ detail, curr }) {
    const [popup, setPopup] = React.useState(false);
    const shortAmt = detail.short_hour_deduction ?? 0;
    const attRows  = (detail.attendance_details ?? []).filter(a => (8 - a.work_hours - (a.late_minutes/60)) > 0.01);
    const totalSH  = attRows.reduce((s,a) => s + Math.max(0, 8 - a.work_hours - (a.late_minutes/60)), 0);
    const label    = totalSH > 0.01 ? fmtHours(totalSH) : '';

    return (
        <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                <span style={{ fontSize:12, color:'#6b7280', fontWeight:500, flex:1, marginRight:12, display:'flex', alignItems:'center', gap:6 }}>
                    Insufficient Hours
                    {label && <ClickBadge label={label} color="#dc2626" bg="#fee2e2" onClick={()=>setPopup(true)} />}
                </span>
                <span style={{ fontSize:12, fontWeight:600, color:'#dc2626' }}>− {fmt(shortAmt, curr)}</span>
            </div>
            {popup && (
                <MiniModal title="Insufficient Hours" subtitle="Working Hours" icon="⏱" onClose={()=>setPopup(false)}>
                    {attRows.length===0 ? <p style={{ fontSize:12, color:'#9ca3af' }}>No short records.</p>
                    : attRows.map((a,i) => {
                        const sh = Math.max(0, 8 - a.work_hours - (a.late_minutes/60));
                        return (
                            <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
                                <div style={{ fontWeight:700, fontSize:13, color:'#374151', marginBottom:4 }}>{a.date}</div>
                                <div style={{ fontSize:11, color:'#6b7280', display:'flex', gap:14 }}>
                                    <span>In: <b>{fmtTime(a.check_in+':00')}</b></span>
                                    <span>Out: <b>{fmtTime(a.check_out+':00')}</b></span>
                                    <span style={{ color:'#dc2626' }}>Short: <b>{fmtHours(sh)}</b></span>
                                </div>
                            </div>
                        );
                    })}
                </MiniModal>
            )}
        </>
    );
}

// ── Late arrival row ───────────────────────────────────────────────────────────
function LateArrivalRow({ detail, curr }) {
    const [popup, setPopup] = React.useState(false);
    const lateAmt  = detail.late_deduction ?? 0;
    const lateMins = detail.late_minutes_total ?? 0;
    const attRows  = (detail.attendance_details ?? []).filter(a => a.late_minutes > 0);

    return (
        <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                <span style={{ fontSize:12, color:'#6b7280', fontWeight:500, flex:1, marginRight:12, display:'flex', alignItems:'center', gap:6 }}>
                    Late Arrival
                    {lateMins > 0 && <ClickBadge label={`${lateMins}min`} color="#d97706" bg="#fef3c7" onClick={()=>setPopup(true)} />}
                </span>
                <span style={{ fontSize:12, fontWeight:600, color:'#dc2626' }}>− {fmt(lateAmt, curr)}</span>
            </div>
            {popup && (
                <MiniModal title="Late Arrival" subtitle="Attendance" icon="⏰" onClose={()=>setPopup(false)}>
                    {attRows.length===0 ? <p style={{ fontSize:12, color:'#9ca3af' }}>No late records.</p>
                    : attRows.map((a,i) => (
                        <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
                            <div style={{ fontWeight:700, fontSize:13, color:'#374151', marginBottom:4 }}>{a.date}</div>
                            <div style={{ fontSize:11, color:'#6b7280', display:'flex', gap:14 }}>
                                <span>In: <b style={{ color:'#f59e0b' }}>{fmtTime(a.check_in+':00')}</b></span>
                                <span style={{ color:'#dc2626' }}>Late: <b>{a.late_minutes}min</b></span>
                            </div>
                        </div>
                    ))}
                </MiniModal>
            )}
        </>
    );
}

// ── Detail modal body ──────────────────────────────────────────────────────────
function DetailModalContent({ detail, curr, onApprove, onClose }) {
    const [leavePop,  setLeavePop]  = React.useState(false);
    const [otPop,     setOtPop]     = React.useState(false);
    const [allowPop,  setAllowPop]  = React.useState(false);

    const otHrs   = detail.overtime_hours ?? 0;
    const otLabel = otHrs > 0 ? fmtHours(otHrs) : null;
    const gross   = (detail.base_salary??0)+(detail.total_allowances??0)+(detail.overtime_amount??0)+(detail.bonus_amount??0);

    const dayTypeLabel = (t) => ({ full_day:'Full Day', half_day_am:'AM Half', half_day_pm:'PM Half', half_day:'Half Day' }[t] || t || '');

    return (
        <div>
            {/* ATTENDANCE */}
            <DetailCard icon="📅" title="Attendance" color="#ede9fe" titleColor="#7c3aed">
                <DetailRow label="Working Days" val={`${detail.working_days} days`} />
                <DetailRow label="Present"      val={`${detail.present_days} days`} color={detail.present_days>0?'#059669':null} />
                <DetailRow label="Absent"       val={`${detail.absent_days} days`}  color={detail.absent_days>0?'#ef4444':null} />
                <DetailRow label="Late"         val={detail.late_minutes_total>0?`${detail.late_minutes_total} min`:'—'} color={detail.late_minutes_total>0?'#f59e0b':null} />

                {(detail.leave_days_paid??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                        <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Paid Leave</span>
                        <ClickBadge label={`${detail.leave_days_paid} days`} color="#059669" bg="#d1fae5" onClick={()=>setLeavePop('paid')} />
                    </div>
                )}
                {(detail.leave_days_unpaid??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                        <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Unpaid Leave</span>
                        <ClickBadge label={`${detail.leave_days_unpaid} days`} color="#ef4444" bg="#fee2e2" onClick={()=>setLeavePop('unpaid')} />
                    </div>
                )}
                {otHrs>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                        <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Overtime</span>
                        <ClickBadge label={otLabel} color="#7c3aed" bg="#ede9fe" onClick={()=>setOtPop(true)} />
                    </div>
                )}
            </DetailCard>

            {/* EARNINGS */}
            <DetailCard icon="💰" title="Earnings" color="#d1fae5" titleColor="#059669">
                <DetailRow label="Base Salary" val={fmt(detail.base_salary, curr)} bold />
                {(detail.total_allowances??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                        <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Allowances</span>
                        <span onClick={()=>setAllowPop(true)} style={{ fontSize:12, fontWeight:600, color:'#059669', cursor:'pointer' }}>+ {fmt(detail.total_allowances, curr)}</span>
                    </div>
                )}
                {(detail.overtime_amount??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid #f3f4f6', background:'#fff' }}>
                        <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>Overtime Pay</span>
                        <span onClick={()=>setOtPop(true)} style={{ fontSize:12, fontWeight:600, color:'#059669', cursor:'pointer' }}>+ {fmt(detail.overtime_amount, curr)}</span>
                    </div>
                )}
                {(detail.bonus_amount??0)>0 && <DetailRow label="Bonus" val={`+ ${fmt(detail.bonus_amount, curr)}`} color="#059669" />}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px', background:'#f0fdf4' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>Total Before Deductions</span>
                    <span style={{ fontSize:12, fontWeight:800, color:'#059669' }}>{fmt(gross, curr)}</span>
                </div>
            </DetailCard>

            {/* DEDUCTIONS */}
            {((detail.late_deduction??0)+(detail.short_hour_deduction??0)+(detail.unpaid_leave_deduction??0)+((detail.salary_deduction_breakdown??[]).reduce((s,d)=>s+d.amount,0)))>0 && (
                <DetailCard icon="✂️" title="Deductions" color="#fee2e2" titleColor="#dc2626">
                    {(detail.late_deduction??0)>0       && <LateArrivalRow detail={detail} curr={curr} />}
                    {(detail.short_hour_deduction??0)>0 && <ShortHourRow   detail={detail} curr={curr} />}
                    {(detail.unpaid_leave_deduction??0)>0 && <DetailRow label="Unpaid Leave" val={`− ${fmt(detail.unpaid_leave_deduction, curr)}`} color="#dc2626" />}
                    {(detail.salary_deduction_breakdown??[]).map((d,i)=>(
                        <DetailRow key={i}
                            label={<span>{d.name} <span style={{ fontSize:10, color:'#9ca3af' }}>{d.type==='percentage'?`(${d.rate}%)`:'(flat)'}</span></span>}
                            val={`− ${fmt(d.amount, curr)}`} color="#dc2626"
                        />
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px', background:'#fff5f5' }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>Total Deductions</span>
                        <span style={{ fontSize:12, fontWeight:800, color:'#dc2626' }}>− {fmt(detail.total_deductions, curr)}</span>
                    </div>
                </DetailCard>
            )}

            {/* NET */}
            <div style={{ background:'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius:14, padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:700, letterSpacing:'1px', marginBottom:2 }}>NET SALARY</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{detail.period_start} — {detail.period_end}</div>
                </div>
                <div style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-1px' }}>{fmt(detail.net_salary, curr)}</div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                {detail.status!=='approved' && (
                    <button onClick={()=>{ if(window.confirm(`Approve salary for ${detail.name}?\n\nThis action cannot be undone.`)){onApprove(detail);onClose();} }} style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'#059669', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        ✅ Approve
                    </button>
                )}
                <button onClick={onClose} style={{ padding:'10px 22px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    Close
                </button>
            </div>

            {/* Leave popup */}
            {leavePop && (
                <MiniModal
                    title={leavePop==='paid' ? 'Paid Leave' : 'Unpaid Leave'}
                    subtitle="Leave Records"
                    icon={leavePop==='paid' ? '✅' : '📋'}
                    onClose={()=>setLeavePop(false)}
                >
                    {(detail.leave_details??[]).filter(l=>leavePop==='paid'?l.is_paid:!l.is_paid).length===0
                        ? <p style={{ fontSize:12, color:'#9ca3af' }}>No records.</p>
                        : (detail.leave_details??[]).filter(l=>leavePop==='paid'?l.is_paid:!l.is_paid).map((l,i)=>(
                            <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
                                <div style={{ fontWeight:800, fontSize:14, color:'#111827', marginBottom:6 }}>
                                    {l.start_date === l.end_date ? l.start_date : `${l.start_date} — ${l.end_date}`}
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{l.leave_type}</span>
                                    {l.day_type && (
                                        <span style={{ fontSize:10, background:'#ede9fe', color:'#7c3aed', borderRadius:99, padding:'2px 8px', fontWeight:700 }}>
                                            {dayTypeLabel(l.day_type)}
                                        </span>
                                    )}
                                    <span style={{ fontSize:11, color:'#9ca3af', marginLeft:'auto' }}>{l.total_days} day(s)</span>
                                </div>
                            </div>
                        ))
                    }
                </MiniModal>
            )}

            {/* OT popup */}
            {otPop && (
                <MiniModal title="Overtime" subtitle="OT Records" icon="⚡" onClose={()=>setOtPop(false)}>
                    {(detail.ot_details??[]).length===0
                        ? <p style={{ fontSize:12, color:'#9ca3af' }}>No OT records.</p>
                        : (detail.ot_details??[]).map((o,i)=>(
                            <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                                    <span style={{ fontWeight:800, fontSize:14, color:'#111827' }}>{o.date}</span>
                                    <span style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>
                                        {o.rate_type==='multiplier'?`${o.rate_value}×`:`flat`}
                                    </span>
                                </div>
                                <div style={{ fontSize:11, color:'#6b7280', display:'flex', gap:10, alignItems:'center' }}>
                                    <span style={{ color:'#7c3aed', fontWeight:600 }}>{o.policy}</span>
                                    <span style={{ color:'#9ca3af' }}>{fmtTime(o.start_time)}–{fmtTime(o.end_time)}</span>
                                    <span style={{ fontWeight:700, color:'#374151', marginLeft:'auto' }}>{fmtHours(o.hours)}</span>
                                </div>
                            </div>
                        ))
                    }
                    <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>OT Pay (this period)</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#7c3aed' }}>{fmt(detail.overtime_amount??0, curr)}</span>
                    </div>
                </MiniModal>
            )}

            {/* Allowance popup */}
            {allowPop && (
                <MiniModal title="Allowances" subtitle="Breakdown" icon="💰" onClose={()=>setAllowPop(false)}>
                    {(detail.allowance_details??[]).length===0
                        ? <p style={{ fontSize:12, color:'#9ca3af' }}>No allowance details.</p>
                        : (detail.allowance_details??[]).map((a,i)=>(
                            <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <div>
                                    <div style={{ fontWeight:700, fontSize:13, color:'#374151' }}>{a.name}</div>
                                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{a.type==='percentage'?`${a.rate}% of base salary`:`Fixed amount`}</div>
                                </div>
                                <span style={{ fontSize:13, fontWeight:700, color:'#059669' }}>+ {fmt(a.amount, curr)}</span>
                            </div>
                        ))
                    }
                    <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>Total Allowances</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#059669' }}>+ {fmt(detail.total_allowances??0, curr)}</span>
                    </div>
                </MiniModal>
            )}
        </div>
    );
}



// ── Period Bar ────────────────────────────────────────────────────────────────
function PeriodBar({ salaryRule, periodTemplates, value, onChange }) {
    const cycle = salaryRule?.pay_cycle ?? 'monthly';
    const count = cycle==='semi_monthly'?2:cycle==='ten_day'?3:1;
    const now   = new Date();
    const years = Array.from({length:3},(_,i)=>now.getFullYear()-1+i);
    const sel   = { year:now.getFullYear(), month:now.getMonth()+1, period_number:1, ...value };
    const set   = (k,v) => onChange({...sel,[k]:Number(v)});
    const tmpl  = periodTemplates.find(p=>p.period_number===sel.period_number);
    const S = { padding:'7px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:13, fontWeight:600, color:'#374151', background:'#fff', cursor:'pointer', outline:'none' };
    return (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
            <select value={sel.year} onChange={e=>set('year',e.target.value)} style={S}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
            <select value={sel.month} onChange={e=>set('month',e.target.value)} style={S}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{MONTHS[i]}</option>)}</select>
            {count>1&&<select value={sel.period_number} onChange={e=>set('period_number',e.target.value)} style={S}>{Array.from({length:count},(_,i)=><option key={i+1} value={i+1}>Period {i+1}</option>)}</select>}
            {tmpl&&<span style={{ fontSize:12, color:'#6b7280', background:'#f3f4f6', padding:'5px 12px', borderRadius:99, fontWeight:600 }}>ends day {tmpl.day}</span>}
            <span style={{ fontSize:12, color:'#7c3aed', background:'#ede9fe', padding:'5px 12px', borderRadius:99, fontWeight:700 }}>{cycle==='semi_monthly'?'SEMI-MONTHLY':cycle==='ten_day'?'10-DAY':'MONTHLY'}</span>
        </div>
    );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function AttendanceStep({ period, onToast, onDone }) {
    const [downloading, setDownloading] = useState(false);
    const [uploading,   setUploading]   = useState(false);
    const [result,      setResult]      = useState(null);
    const fileRef = useRef();

    const download = async () => {
        setDownloading(true);
        try {
            const params = new URLSearchParams({ year:period.year, month:period.month, period_number:period.period_number });
            const res = await fetch(`/payroll/attendance/template?${params}`, { headers:{'X-CSRF-TOKEN':csrf()} });
            if (!res.ok) throw new Error((await res.json().catch(()=>({}))).message ?? 'Download failed');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a'); a.href=url; a.download=`attendance_${period.year}_${period.month}_P${period.period_number}.xlsx`; a.click();
            URL.revokeObjectURL(url);
            onToast('Template downloaded.', 'success');
        } catch(e) { onToast(e.message,'error'); }
        finally { setDownloading(false); }
    };

    const upload = async (e) => {
        const file = e.target.files?.[0]; if(!file) return;
        setUploading(true); setResult(null);
        const fd = new FormData(); fd.append('file',file); fd.append('year',period.year); fd.append('month',period.month); fd.append('period_number',period.period_number); fd.append('_token',csrf());
        try {
            const res  = await fetch('/payroll/attendance/import',{method:'POST',body:fd});
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Upload failed');
            setResult(data);
            onToast(data.message, 'success');
            if (data.saved > 0) onDone('attendance');
        } catch(e) { onToast(e.message,'error'); }
        finally { setUploading(false); if(fileRef.current) fileRef.current.value=''; }
    };

    return (
        <div>
            {/* How-to steps — horizontal, compact */}
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[
                    ['⬇️','Download','Get the Excel template pre-filled with employees & dates'],
                    ['✏️','Fill In/Out','Type or select times (HH:MM). Skip weekends.'],
                    ['⬆️','Upload','Work hours & late minutes auto-calculated on save'],
                ].map(([icon,title,desc],i)=>(
                    <div key={i} style={{ flex:1, display:'flex', gap:10, alignItems:'flex-start', padding:'12px 14px', background:'#f9fafb', borderRadius:10, border:'1px solid #f3f4f6' }}>
                        <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{icon}</span>
                        <div>
                            <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:2 }}>{title}</div>
                            <div style={{ fontSize:11, color:'#9ca3af', lineHeight:1.5 }}>{desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Buttons */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom: result ? 16 : 0 }}>
                <button onClick={download} disabled={downloading} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:8, border:'none', background:downloading?'#ddd6fe':'#7c3aed', color:'#fff', fontSize:13, fontWeight:700, cursor:downloading?'not-allowed':'pointer' }}>
                    {downloading ? <><Spinner color="#fff" size={13}/>Downloading...</> : <>⬇️ Download Template</>}
                </button>
                <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:8, border:'none', background:uploading?'#d1fae5':'#059669', color:'#fff', fontSize:13, fontWeight:700, cursor:uploading?'not-allowed':'pointer' }}>
                    {uploading ? <><Spinner color="#fff" size={13}/>Uploading...</> : <>⬆️ Upload & Save</>}
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={upload} disabled={uploading} style={{ display:'none' }} />
                </label>
            </div>

            {/* Result */}
            {result && (
                <div style={{ padding:'12px 14px', borderRadius:8, background:result.errors?.length?'#fffbeb':'#f0fdf4', border:`1px solid ${result.errors?.length?'#fde68a':'#86efac'}` }}>
                    <div style={{ display:'flex', gap:20, fontSize:13, marginBottom:result.errors?.length?8:0 }}>
                        <span>✅ Saved: <strong style={{ color:'#059669' }}>{result.saved}</strong></span>
                        <span style={{ color:'#6b7280' }}>Skipped: {result.skipped}</span>
                    </div>
                    {result.errors?.length>0&&<div>{result.errors.slice(0,3).map((e,i)=><div key={i} style={{ fontSize:11, color:'#b45309', marginTop:2 }}>• {e}</div>)}{result.errors.length>3&&<div style={{ fontSize:11, color:'#b45309', marginTop:2 }}>...and {result.errors.length-3} more</div>}</div>}
                </div>
            )}
        </div>
    );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function CalculateStep({ period, periodTemplates, employees, salaryRule, onToast, onDone }) {
    const [mode,    setMode]    = useState('all');
    const [selEmp,  setSelEmp]  = useState('');
    const [prog,    setProg]    = useState([]);
    const [running, setRunning] = useState(false);
    const [stopped, setStopped] = useState(null);
    const [loading, setLoading] = useState(false);
    const tmpl      = periodTemplates.find(p=>p.period_number===period.period_number);
    const doneCount = prog.filter(p=>p.status==='done').length;

    const startAll = async (resumeFrom=null) => {
        setRunning(true); setStopped(null);
        if (!resumeFrom) setProg([]);
        const params = new URLSearchParams({ period_id:tmpl?.id, year:period.year, month:period.month });
        if (resumeFrom) params.set('resume_from', resumeFrom);
        try {
            const res    = await fetch(`/payroll/records/calculate-all?${params}`, { headers:{'Accept':'text/event-stream','X-CSRF-TOKEN':csrf()} });
            const reader = res.body.getReader(); const dec = new TextDecoder(); let buf='';
            while (true) {
                const {done,value} = await reader.read(); if(done) break;
                buf += dec.decode(value,{stream:true});
                const lines = buf.split('\n\n'); buf = lines.pop();
                for (const chunk of lines) { const line=chunk.replace(/^data:\s*/,'').trim(); if(!line) continue; try{handleEvt(JSON.parse(line));}catch{} }
            }
        } catch(e) { onToast('Connection error: '+e.message,'error'); }
        finally { setRunning(false); }
    };

    const handleEvt = (evt) => {
        if (evt.type==='calculating') setProg(prev=>{ const ex=prev.find(p=>p.user_id===evt.user_id); if(ex) return prev.map(p=>p.user_id===evt.user_id?{...p,status:'calculating'}:p); return [...prev,{user_id:evt.user_id,name:evt.name,status:'calculating'}]; });
        else if (evt.type==='done') setProg(prev=>prev.map(p=>p.user_id===evt.user_id?{...p,status:'done',net_salary:evt.net_salary}:p));
        else if (evt.type==='error') setProg(prev=>prev.map(p=>p.user_id===evt.user_id?{...p,status:'error',error:evt.message}:p));
        else if (evt.type==='stopped') { setStopped({resume_from:evt.resume_from,done:evt.done,total:evt.total}); onToast(`Stopped. ${evt.done}/${evt.total} done. Click Continue.`,'error'); }
        else if (evt.type==='complete') { onToast(`✅ All ${evt.done} employees calculated!`,'success'); onDone('calculate'); }
    };

    const handleSingle = async () => {
        if(!selEmp||!tmpl?.id){onToast('Select an employee first.','error');return;}
        setLoading(true);
        try {
            const res  = await fetch('/payroll/records/calculate-single',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf()},body:JSON.stringify({period_id:tmpl.id,user_id:selEmp,year:period.year,month:period.month})});
            const data = await res.json();
            if(!res.ok) throw new Error(data.message??'Failed');
            onToast(`✅ ${data.record?.name??'Employee'} calculated!`,'success');
            onDone('calculate');
        } catch(e){onToast(e.message,'error');}
        finally{setLoading(false);}
    };

    const btnBase = { padding:'9px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 };

    return (
        <div>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[['all','👥 All Employees'],['single','👤 Single Employee']].map(([m,lbl])=>(
                    <button key={m} onClick={()=>setMode(m)} style={{ padding:'8px 18px', borderRadius:99, border:'1.5px solid', borderColor:mode===m?'#7c3aed':'#e5e7eb', background:mode===m?'#7c3aed':'#fff', color:mode===m?'#fff':'#6b7280', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>{lbl}</button>
                ))}
            </div>

            {mode==='single'&&(
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                    <select value={selEmp} onChange={e=>setSelEmp(e.target.value)} style={{ flex:1, minWidth:200, padding:'9px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:13, fontWeight:600, color:'#374151', background:'#fff', cursor:'pointer' }}>
                        <option value="">— Select Employee —</option>
                        {employees.map(e=><option key={e.id} value={e.id}>{e.name}{e.department?` (${e.department})`:''}</option>)}
                    </select>
                    <button onClick={handleSingle} disabled={loading||!selEmp} style={{ ...btnBase, background:selEmp?'#7c3aed':'#e5e7eb', color:selEmp?'#fff':'#9ca3af', cursor:selEmp?'pointer':'not-allowed' }}>
                        {loading?<><Spinner color="#fff"/>Calculating...</>:'▶ Calculate'}
                    </button>
                </div>
            )}

            {mode==='all'&&(
                <div style={{ marginBottom:16 }}>
                    {!running&&!stopped&&<button onClick={()=>startAll()} disabled={!tmpl?.id||employees.length===0} style={{ ...btnBase, background:'#7c3aed', color:'#fff', opacity:!tmpl?.id?0.5:1 }}>▶ Calculate All ({employees.length} employees)</button>}
                    {running&&(
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <Spinner/><span style={{ fontSize:13, color:'#7c3aed', fontWeight:700 }}>Calculating... {doneCount} / {employees.length}</span>
                            <div style={{ flex:1, height:6, background:'#ede9fe', borderRadius:99, overflow:'hidden' }}>
                                <div style={{ height:'100%', borderRadius:99, background:'#7c3aed', width:`${employees.length?(doneCount/employees.length)*100:0}%`, transition:'width 0.3s ease' }}/>
                            </div>
                        </div>
                    )}
                    {stopped&&!running&&<button onClick={()=>startAll(stopped.resume_from)} style={{ ...btnBase, background:'#f59e0b', color:'#fff' }}>▶ Continue ({stopped.done}/{stopped.total} done)</button>}
                </div>
            )}

            {prog.length>0&&(
                <div style={{ border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
                    {prog.map((p,i)=>(
                        <div key={p.user_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:i%2===0?'#fff':'#fafafa', borderBottom:i<prog.length-1?'1px solid #f3f4f6':'none' }}>
                            <span style={{ fontSize:15, width:20, textAlign:'center' }}>{p.status==='calculating'?'⏳':p.status==='done'?'✅':'❌'}</span>
                            <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#374151' }}>{p.name}</span>
                            {p.status==='calculating'&&<span style={{ fontSize:11, color:'#7c3aed', fontWeight:700 }}>Calculating...</span>}
                            {p.status==='done'&&p.net_salary!==undefined&&<span style={{ fontSize:12, fontWeight:800, color:'#059669' }}>{fmt(p.net_salary, salaryRule?.currency_code)}</span>}
                            {p.status==='error'&&<span style={{ fontSize:11, color:'#dc2626' }}>{p.error}</span>}
                        </div>
                    ))}
                </div>
            )}

            {!tmpl?.id&&<div style={{ padding:'12px 14px', background:'#fffbeb', borderRadius:8, border:'1px solid #fde68a', fontSize:12, color:'#92400e' }}>⚠️ No payroll period configured. Go to HR Policy → General Settings.</div>}
        </div>
    );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function PreviewStep({ period, periodTemplates, salaryRule, onToast }) {
    const [loading,  setLoading]  = useState(false);
    const [records,  setRecords]  = useState([]);
    const [summary,  setSummary]  = useState(null);
    const [detail,   setDetail]   = useState(null);
    const [approving,setApproving]= useState(false);
    const tmpl = periodTemplates.find(p=>p.period_number===period.period_number);
    const curr = salaryRule?.currency_code ?? '';

    const load = useCallback(async()=>{
        if(!tmpl?.id) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({period_id:tmpl.id,year:period.year,month:period.month});
            const res    = await fetch(`/payroll/records/preview?${params}`);
            const data   = await res.json();
            setRecords(data.records??[]); setSummary(data.summary??null);
        } catch{onToast('Failed to load records','error');}
        finally{setLoading(false);}
    },[tmpl?.id,period.year,period.month]);

    useEffect(()=>{load();},[load]);

    const approveAll = async()=>{
        if(!tmpl?.id) return;
        if(!window.confirm(`Approve all ${records.length} employees for ${MONTHS_SHORT[period.month-1]} ${period.year} Period ${period.period_number}?\n\nThis action cannot be undone.`)) return;
        setApproving(true);
        try{const res=await fetch('/payroll/records/approve-all',{method:'PATCH',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf()},body:JSON.stringify({period_id:tmpl.id,year:period.year,month:period.month})});const data=await res.json();if(!res.ok)throw new Error(data.message);onToast(data.message,'success');load();}catch(e){onToast(e.message,'error');}finally{setApproving(false);}
    };
    const approveOne = async(r)=>{
        if(!window.confirm(`Approve salary for ${r.name}?\n\nThis action cannot be undone.`)) return;
        try{const res=await fetch(`/payroll/records/${r.id}/approve`,{method:'PATCH',headers:{'X-CSRF-TOKEN':csrf()}});const data=await res.json();if(!res.ok)throw new Error(data.message);onToast(`${r.name} approved.`,'success');load();}catch(e){onToast(e.message,'error');}
    };

    const td = { padding:'9px 10px', whiteSpace:'nowrap', verticalAlign:'middle' };

    return (
        <div>
            {/* Top bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
                <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600 }}>
                    {records.length} employees · {MONTHS_SHORT[period.month-1]} {period.year}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                    <button onClick={load} disabled={loading} style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
                        🔄 Refresh
                    </button>
                    {records.some(r=>r.status!=='approved')&&records.length>0&&(
                        <button onClick={approveAll} disabled={approving} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#059669', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
                            {approving?<><Spinner color="#fff" size={12}/>Approving...</>:'✅ Approve All'}
                        </button>
                    )}
                </div>
            </div>

            {loading
                ? <div style={{ textAlign:'center', padding:48, display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'#7c3aed' }}><Spinner size={28}/><span style={{ fontSize:13, fontWeight:600 }}>Loading records...</span></div>
                : records.length===0
                    ? <div style={{ textAlign:'center', padding:48, color:'#9ca3af', fontSize:13 }}>No records yet. Calculate salary first (Step 2).</div>
                    : (
                        <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                                <thead>
                                    <tr style={{ background:'#f9fafb', borderBottom:'2px solid #e5e7eb' }}>
                                        {['Employee','Present / WD','Leave','Late','OT','Base','Allowances','Deductions','Bonus','Net Salary','Status',''].map(h=>(
                                            <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r,i)=>(
                                        <tr key={r.id} style={{ background:i%2===0?'#fff':'#fafafa', borderBottom:'1px solid #f3f4f6' }}>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                <div style={{ fontWeight:700, color:'#111827', fontSize:13 }}>{r.name}</div>
                                                <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>{r.department}</div>
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                <span style={{ fontWeight:700, color:'#059669' }}>{r.present_days}</span>
                                                <span style={{ color:'#9ca3af' }}> / {r.working_days}</span>
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                {(r.leave_days_paid??0)+(r.leave_days_unpaid??0)>0
                                                    ? <span style={{ fontSize:11, color:'#7c3aed', fontWeight:600 }}>{((r.leave_days_paid??0)+(r.leave_days_unpaid??0)).toFixed(1)}d</span>
                                                    : <span style={{ color:'#d1d5db' }}>—</span>}
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                {r.late_minutes_total>0
                                                    ? <span style={{ color:'#f59e0b', fontWeight:700, fontSize:11 }}>{r.late_minutes_total}m</span>
                                                    : <span style={{ color:'#d1d5db' }}>—</span>}
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                {r.overtime_hours>0
                                                    ? <span style={{ color:'#7c3aed', fontWeight:600, fontSize:11 }}>{fmtHours(r.overtime_hours)}</span>
                                                    : <span style={{ color:'#d1d5db' }}>—</span>}
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color:'#374151' }}>{fmtC(r.base_salary, curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color: r.total_allowances>0?'#059669':'#d1d5db' }}>{fmtC(r.total_allowances, curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color: r.total_deductions>0?'#dc2626':'#d1d5db' }}>{fmtC(r.total_deductions, curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color:'#374151' }}>
                                                {fmtC(r.bonus_amount, curr)}
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontWeight:800, fontSize:13, color:'#7c3aed' }}>{fmt(r.net_salary,curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}><StatusPill status={r.status}/></td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                <div style={{ display:'flex', gap:4 }}>
                                                    <button onClick={()=>setDetail(r)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'#ede9fe', color:'#7c3aed', fontSize:11, fontWeight:700, cursor:'pointer' }}>Detail</button>
                                                    {r.status!=='approved'&&<button onClick={()=>approveOne(r)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'#d1fae5', color:'#059669', fontSize:11, fontWeight:700, cursor:'pointer' }}>Approve</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
            }

            {detail&&<SalaryDetailModal detail={detail} curr={curr} onApprove={approveOne} onClose={()=>setDetail(null)} />}
        </div>
    );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PayrollRecordsIndex({ salaryRule, periodTemplates, employees }) {
    const now = new Date();
    const [period,    setPeriod]    = useState({ year:now.getFullYear(), month:now.getMonth()+1, period_number:1 });
    const [activeKey, setActiveKey] = useState('attendance');
    const [completed, setCompleted] = useState(new Set());
    const [toast,     setToast]     = useState(null);
    const [calcVer,   setCalcVer]   = useState(0);

    const showToast  = (msg, type='success') => setToast({ msg, type });
    const handleDone = (key) => {
        setCompleted(prev => new Set([...prev, key]));
        if (key === 'attendance') setActiveKey('calculate');
        if (key === 'calculate')  setActiveKey('preview');
    };

    const stepContent = {
        attendance: <AttendanceStep period={period} onToast={showToast} onDone={handleDone} />,
        calculate:  <CalculateStep period={period} periodTemplates={periodTemplates} employees={employees} salaryRule={salaryRule} onToast={showToast} onDone={(k)=>{ handleDone(k); setCalcVer(v=>v+1); }} />,
        preview:    <PreviewStep key={`${period.year}-${period.month}-${period.period_number}-${calcVer}`} period={period} periodTemplates={periodTemplates} salaryRule={salaryRule} onToast={showToast} />,
    };

    return (
        <AppLayout title="Payroll">
            <Head title="Payroll" />
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                .step-btn:hover { background: #faf5ff !important; }
            `}</style>
            <Toast msg={toast?.msg} type={toast?.type} onClose={()=>setToast(null)} />

            <div className="min-h-screen bg-gray-50/60">
                <div className=" pb-8">
                    <div className="mx-auto">

                        {/* ── Period selector bar ── */}
                        <div style={{ background:'#fff', borderRadius:14, padding:'14px 20px', border:'1px solid #e5e7eb', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,.04)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px', flexShrink:0 }}>Pay Period</span>
                            <PeriodBar salaryRule={salaryRule} periodTemplates={periodTemplates} value={period} onChange={setPeriod} />
                        </div>

                        {/* ── Main workflow layout: left sidebar steps + right content ── */}
                        <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>

                            {/* Left sidebar — step navigation */}
                            <div style={{ width:220, flexShrink:0, background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,.04)', overflow:'hidden' }}>
                                {/* Sidebar header */}
                                <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #f3f4f6' }}>
                                    <div style={{ fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:2 }}>Workflow</div>
                                    <div style={{ fontSize:11, color:'#6b7280' }}>{completed.size}/{STEPS.length} steps done</div>
                                </div>

                                {/* Step items */}
                                {STEPS.map((step, idx) => {
                                    const isActive = activeKey === step.key;
                                    const isDone   = completed.has(step.key);
                                    const isNext   = !isDone && !isActive && STEPS.findIndex(s=>s.key===activeKey)===idx-1;
                                    return (
                                        <button key={step.key} className="step-btn"
                                            onClick={() => setActiveKey(step.key)}
                                            style={{
                                                width:'100%', display:'flex', alignItems:'center', gap:12,
                                                padding:'13px 16px', border:'none', cursor:'pointer', textAlign:'left',
                                                borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                                                borderBottom: idx < STEPS.length-1 ? '1px solid #f9fafb' : 'none',
                                                background: isActive ? '#faf5ff' : '#fff',
                                                transition:'all 0.15s',
                                            }}>
                                            {/* Icon circle */}
                                            <div style={{
                                                width:34, height:34, borderRadius:'50%', flexShrink:0,
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                background: isDone ? '#d1fae5' : isActive ? '#ede9fe' : '#f3f4f6',
                                                border: isActive ? '2px solid #7c3aed' : isDone ? '2px solid #10b981' : '2px solid transparent',
                                                transition:'all 0.2s',
                                            }}>
                                                {isDone
                                                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                    : <span style={{ width:14, height:14, display:'block', color: isActive?'#7c3aed':'#9ca3af' }}>{step.icon}</span>
                                                }
                                            </div>
                                            {/* Text */}
                                            <div>
                                                <div style={{ fontSize:12, fontWeight:700, color: isActive?'#7c3aed': isDone?'#059669':'#374151', marginBottom:1 }}>
                                                    {idx+1}. {step.label}
                                                </div>
                                                <div style={{ fontSize:10, color:'#9ca3af', lineHeight:1.4 }}>
                                                    {isDone ? '✓ Completed' : isActive ? 'In progress...' : step.summary?.split('·')[0]?.trim() ?? ''}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}

                                {/* Progress bar */}
                                <div style={{ padding:'12px 16px', borderTop:'1px solid #f3f4f6' }}>
                                    <div style={{ height:4, background:'#f3f4f6', borderRadius:99, overflow:'hidden' }}>
                                        <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#7c3aed,#059669)', width:`${(completed.size/STEPS.length)*100}%`, transition:'width 0.4s ease' }}/>
                                    </div>
                                </div>
                            </div>

                            {/* Right content area */}
                            <div style={{ flex:1, minWidth:0, background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,.04)', overflow:'hidden' }}>
                                {/* Content header */}
                                <div style={{ padding:'16px 24px 14px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:14 }}>
                                    <div style={{ width:36, height:36, borderRadius:10, background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        <span style={{ width:18, height:18, display:'block', color:'#7c3aed' }}>{STEPS.find(s=>s.key===activeKey)?.icon}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:15, fontWeight:800, color:'#111827' }}>{STEPS.find(s=>s.key===activeKey)?.label}</div>
                                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{STEPS.find(s=>s.key===activeKey)?.summary}</div>
                                    </div>
                                </div>
                                {/* Step body */}
                                <div style={{ padding:24, animation:'fadeIn 0.2s ease' }}>
                                    {stepContent[activeKey]}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}