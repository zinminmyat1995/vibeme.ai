import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { createPortal } from 'react-dom';

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
        return () => { window.removeEventListener('vibeme-theme-change', sync); window.removeEventListener('storage', sync); };
    }, []);
    return dark;
}

// Records/Index.jsx ကနေ ယူ — file အပေါ်ဆုံးမှာ ထည့်
const fmtHours = h => {
    if (!h) return '0h';
    const total = Math.round(parseFloat(h) * 60);
    const hrs = Math.floor(total / 60);
    const mins = total % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
};
const fmtTime = t => {
    if (!t) return '—';
    const [hStr, mStr] = String(t).substring(0,5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    return `${h%12===0?12:h%12}:${m} ${h>=12?'PM':'AM'}`;
};

function ClickBadge({ label, color, bg, onClick }) {
    return (
        <span onClick={onClick} style={{ fontSize:10, background:bg, color, borderRadius:99, padding:'2px 8px', fontWeight:700, cursor:'pointer', border:`1px solid ${color}22`, userSelect:'none', whiteSpace:'nowrap' }}>
            {label}
        </span>
    );
}

function MiniModal({ title, subtitle, icon, onClose, children, theme }) {
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,7,46,0.55)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{
                background: theme.panelSolid,  // ← surface → panelSolid
                borderRadius:18, width:'100%', maxWidth:420, maxHeight:'80vh',
                display:'flex', flexDirection:'column',
                boxShadow:'0 32px 80px rgba(0,0,0,0.3)',
                overflow:'hidden', border:`1px solid ${theme.border}`
            }}>
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
                <div style={{ overflowY:'auto', padding:'14px 18px 18px', flex:1 }}>{children}</div>
            </div>
        </div>
    );
}

function DetailCard({ icon, title, color, titleColor, children, dark }) {
    const bodyBg = dark ? 'rgba(255,255,255,0.03)' : '#fafafa';
    return (
        <div style={{ borderRadius:12, overflow:'hidden', border:`1.5px solid ${dark ? color+'44' : color}`, marginBottom:12 }}>
            <div style={{ background: dark ? color+'22' : color, padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13 }}>{icon}</span>
                <span style={{ fontSize:11, fontWeight:800, color: dark ? color : titleColor, letterSpacing:'0.8px', textTransform:'uppercase' }}>{title}</span>
            </div>
            <div style={{ background: bodyBg, padding:'2px 0' }}>{children}</div>
        </div>
    );
}
function DetailRow({ label, val, color, bold, dark }) {
    const rowBg  = dark ? 'rgba(255,255,255,0.02)' : '#fff';
    const border = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
    const lblClr = dark ? '#94a3b8' : '#6b7280';
    const valClr = color || (dark ? '#f1f5f9' : '#111827');
    return (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${border}`, background: rowBg }}>
            <span style={{ fontSize:12, color: lblClr, fontWeight:500, flex:1, marginRight:12 }}>{label}</span>
            <span style={{ fontSize:12, fontWeight:bold?800:600, color: valClr, flexShrink:0 }}>{val}</span>
        </div>
    );
}

function ShortHourRow({ detail, curr, theme, dark }) {
    const [popup, setPopup] = React.useState(false);
    const shortAmt = detail.short_hour_deduction ?? 0;
    // ✅ FIX: working_hours_per_day မသုံး — server ကနေ resolve လုပ်ထားတဲ့
    // hours_per_day သုံး (work_start→work_end−lunch တွက်ထားတာ)
    const hpd = detail.hours_per_day ?? 8;
    const attRows  = (detail.attendance_details ?? []).filter(a => (hpd - a.work_hours - (a.late_minutes/60)) > 0.01);
    const totalSH  = attRows.reduce((s,a) => s + Math.max(0, hpd - a.work_hours - (a.late_minutes/60)), 0);
    const label    = totalSH > 0.01 ? fmtHours(totalSH) : '';
    const rowBg  = dark ? 'rgba(255,255,255,0.02)' : '#fff';
    const rowBdr = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
    const lblClr = dark ? '#94a3b8' : '#6b7280';
    return (
        <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                <span style={{ fontSize:12, color: lblClr, fontWeight:500, flex:1, marginRight:12, display:'flex', alignItems:'center', gap:6 }}>
                    Insufficient Hours
                    {label && <ClickBadge label={label} color="#dc2626" bg={dark?'rgba(220,38,38,0.18)':'#fee2e2'} onClick={()=>setPopup(true)} />}
                </span>
                <span style={{ fontSize:12, fontWeight:600, color:'#dc2626' }}>− {fmt(shortAmt, curr)}</span>
            </div>
            {popup && (
                <MiniModal title="Insufficient Hours" subtitle="Working Hours" icon="⏱" onClose={()=>setPopup(false)} theme={theme}>
                    {attRows.length===0 ? <p style={{ fontSize:12, color:'#9ca3af' }}>No short records.</p>
                    : attRows.map((a,i) => {
                        // ✅ FIX: hard-coded 8 မသုံး
                        const sh = Math.max(0, hpd - a.work_hours - (a.late_minutes/60));
                        return (
                            <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
                                <div style={{ fontWeight:700, fontSize:13, color:'#374151', marginBottom:4 }}>{a.date}</div>
                                <div style={{ fontSize:11, color:'#6b7280', display:'flex', gap:14 }}>
                                    <span>In: <b>{fmtTime(a.check_in+':00')}</b></span>
                                    <span>Out: <b>{fmtTime(a.check_out+':00')}</b></span>
                                    <span style={{ color:'#dc2626' }}>Missing: <b>{fmtHours(sh)}</b></span>
                                </div>
                            </div>
                        );
                    })}
                </MiniModal>
            )}
        </>
    );
}

function LateArrivalRow({ detail, curr, theme, dark }) {
    const [popup, setPopup] = React.useState(false);
    const lateAmt  = detail.late_deduction ?? 0;
    const lateMins = detail.late_minutes_total ?? 0;
    const attRows  = (detail.attendance_details ?? []).filter(a => a.late_minutes > 0);
    const rowBg  = dark ? 'rgba(255,255,255,0.02)' : '#fff';
    const rowBdr = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
    const lblClr = dark ? '#94a3b8' : '#6b7280';
    return (
        <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                <span style={{ fontSize:12, color: lblClr, fontWeight:500, flex:1, marginRight:12, display:'flex', alignItems:'center', gap:6 }}>
                    Late Arrival
                    {lateMins > 0 && <ClickBadge label={`${lateMins}min`} color="#d97706" bg={dark?'rgba(217,119,6,0.18)':'#fef3c7'} onClick={()=>setPopup(true)} />}
                </span>
                <span style={{ fontSize:12, fontWeight:600, color:'#dc2626' }}>− {fmt(lateAmt, curr)}</span>
            </div>
            {popup && (
                <MiniModal title="Late Arrival" subtitle="Attendance" icon="⏰" onClose={()=>setPopup(false)} theme={theme}>
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

function DetailModalContent({ detail, curr, onApprove, onClose, theme, dark }) {
    const [leavePop,  setLeavePop]  = React.useState(false);
    const [otPop,     setOtPop]     = React.useState(false);
    const [allowPop,  setAllowPop]  = React.useState(false);
    const [bonusPop,  setBonusPop]  = React.useState(false);
    const otHrs   = detail.overtime_hours ?? 0;
    const otLabel = otHrs > 0 ? fmtHours(otHrs) : null;
    const gross   = (detail.base_salary??0)+(detail.total_allowances??0)+(detail.overtime_amount??0)+(detail.bonus_amount??0);
    const dayTypeLabel = (t) => ({ full_day:'Full Day', half_day_am:'AM Half', half_day_pm:'PM Half', half_day:'Half Day' }[t] || t || '');

    const rowBg  = dark ? 'rgba(255,255,255,0.02)' : '#fff';
    const rowBdr = dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
    const lblClr = dark ? '#94a3b8' : '#6b7280';

    return (
        <div>
            <DetailCard icon="📅" title="Attendance" color="#ede9fe" titleColor="#7c3aed" dark={dark}>
                <DetailRow label="Working Days" val={`${detail.working_days} days`} dark={dark} />
                <DetailRow label="Present"      val={`${detail.present_days} days`} color={detail.present_days>0?'#059669':null} dark={dark} />
                <DetailRow label="Absent"       val={`${detail.absent_days} days`}  color={detail.absent_days>0?'#ef4444':null} dark={dark} />
                <DetailRow label="Late"         val={detail.late_minutes_total>0?`${detail.late_minutes_total} min`:'—'} color={detail.late_minutes_total>0?'#f59e0b':null} dark={dark} />
                {(detail.leave_days_paid??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                        <span style={{ fontSize:12, color: lblClr, fontWeight:500 }}>Paid Leave</span>
                        <ClickBadge label={`${detail.leave_days_paid} days`} color="#059669" bg={dark?'rgba(5,150,105,0.18)':'#d1fae5'} onClick={()=>setLeavePop('paid')} />
                    </div>
                )}
                {(detail.leave_days_unpaid??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                        <span style={{ fontSize:12, color: lblClr, fontWeight:500 }}>Unpaid Leave</span>
                        <ClickBadge label={`${detail.leave_days_unpaid} days`} color="#ef4444" bg={dark?'rgba(239,68,68,0.16)':'#fee2e2'} onClick={()=>setLeavePop('unpaid')} />
                    </div>
                )}
                {otHrs>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                        <span style={{ fontSize:12, color: lblClr, fontWeight:500 }}>Overtime</span>
                        <ClickBadge label={otLabel} color="#7c3aed" bg={dark?'rgba(124,58,237,0.18)':'#ede9fe'} onClick={()=>setOtPop(true)} />
                    </div>
                )}
            </DetailCard>

            <DetailCard icon="💰" title="Earnings" color="#d1fae5" titleColor="#059669" dark={dark}>
                <DetailRow label="Base Salary" val={fmt(detail.base_salary, curr)} bold dark={dark} />
                {(detail.total_allowances??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                        <span style={{ fontSize:12, color: lblClr, fontWeight:500 }}>Allowances</span>
                        <span onClick={()=>setAllowPop(true)} style={{ fontSize:12, fontWeight:600, color:'#059669', cursor:'pointer' }}>+ {fmt(detail.total_allowances, curr)}</span>
                    </div>
                )}
                {(detail.overtime_amount??0)>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                        <span style={{ fontSize:12, color: lblClr, fontWeight:500 }}>Overtime Pay</span>
                        <span onClick={()=>setOtPop(true)} style={{ fontSize:12, fontWeight:600, color:'#059669', cursor:'pointer' }}>+ {fmt(detail.overtime_amount, curr)}</span>
                    </div>
                )}
                {(detail.bonus_amount ?? 0) > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                        <span style={{ fontSize:12, color: lblClr, fontWeight:500 }}>Bonus</span>
                        <span
                            onClick={() => setBonusPop(true)}
                            style={{ fontSize:12, fontWeight:600, color:'#059669', cursor:'pointer' }}
                        >
                            + {fmt(detail.bonus_amount, curr)}
                        </span>
                    </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px', background: dark?'rgba(5,150,105,0.1)':'#f0fdf4' }}>
                    <span style={{ fontSize:11, fontWeight:700, color: lblClr }}>Total Before Deductions</span>
                    <span style={{ fontSize:12, fontWeight:800, color:'#059669' }}>{fmt(gross, curr)}</span>
                </div>
            </DetailCard>

            {((detail.late_deduction??0)+(detail.short_hour_deduction??0)+(detail.unpaid_leave_deduction??0)+((detail.salary_deduction_breakdown??[]).reduce((s,d)=>s+d.amount,0)))>0 && (
                <DetailCard icon="✂️" title="Deductions" color="#fee2e2" titleColor="#dc2626" dark={dark}>
                    {(detail.late_deduction??0)>0       && <LateArrivalRow detail={detail} curr={curr} theme={theme} dark={dark} />}
                    {(detail.short_hour_deduction??0)>0 && <ShortHourRow   detail={detail} curr={curr} theme={theme} dark={dark} />}
                    {(detail.salary_deduction_breakdown??[]).map((d,i)=>(
                        <DetailRow key={i} label={<span>{d.name} <span style={{ fontSize:10, color: lblClr }}>{d.type==='percentage'?`(${d.rate}%)`:'(flat)'}</span></span>} val={`− ${fmt(d.amount, curr)}`} color="#dc2626" dark={dark}/>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 16px', background: dark?'rgba(220,38,38,0.08)':'#fff5f5' }}>
                        <span style={{ fontSize:11, fontWeight:700, color: lblClr }}>Total Deductions</span>
                        <span style={{ fontSize:12, fontWeight:800, color:'#dc2626' }}>− {fmt(detail.total_deductions, curr)}</span>
                    </div>
                </DetailCard>
            )}

            <div style={{ background:'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius:14, padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:700, letterSpacing:'1px', marginBottom:2 }}>NET SALARY</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{detail.period_start} — {detail.period_end}</div>
                </div>
                <div style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-1px' }}>{fmt(detail.net_salary, curr)}</div>
            </div>


            {leavePop && (
                <MiniModal title={leavePop==='paid' ? 'Paid Leave' : 'Unpaid Leave'} subtitle="Leave Records" icon={leavePop==='paid' ? '✅' : '📋'} onClose={()=>setLeavePop(false)} theme={theme}>
                    {(detail.leave_details??[]).filter(l=>leavePop==='paid'?l.is_paid:!l.is_paid).length===0
                        ? <p style={{ fontSize:12, color: theme.textMute }}>No records.</p>
                        : (detail.leave_details??[]).filter(l=>leavePop==='paid'?l.is_paid:!l.is_paid).map((l,i)=>(
                            <div key={i} style={{ padding:'12px 0', borderBottom:`1px solid ${theme.border}` }}>
                                <div style={{ fontWeight:800, fontSize:14, color: theme.text, marginBottom:6 }}>{l.start_date === l.end_date ? l.start_date : `${l.start_date} — ${l.end_date}`}</div>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <span style={{ fontSize:12, color: theme.textSoft, fontWeight:600 }}>{l.leave_type}</span>
                                    {l.day_type && <span style={{ fontSize:10, background: dark?'rgba(124,58,237,0.18)':'#ede9fe', color:'#7c3aed', borderRadius:99, padding:'2px 8px', fontWeight:700 }}>{dayTypeLabel(l.day_type)}</span>}
                                    <span style={{ fontSize:11, color: theme.textMute, marginLeft:'auto' }}>{l.total_days} day(s)</span>
                                </div>
                            </div>
                        ))
                    }
                </MiniModal>
            )}
            {otPop && (
                <MiniModal title="Overtime" subtitle="OT Records" icon="⚡" onClose={()=>setOtPop(false)} theme={theme}>
                    {(detail.ot_details??[]).length===0 ? <p style={{ fontSize:12, color: theme.textMute }}>No OT records.</p>
                    : (detail.ot_details??[]).map((o,i)=>(
                        <div key={i} style={{ padding:'12px 0', borderBottom:`1px solid ${theme.border}` }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                                <span style={{ fontWeight:800, fontSize:14, color: theme.text }}>{o.date}</span>
                                <span style={{ fontSize:11, color: theme.textMute, fontWeight:600 }}>{o.rate_type==='multiplier'?`${o.rate_value}×`:`flat`}</span>
                            </div>
                            <div style={{ fontSize:11, color: theme.textMute, display:'flex', gap:10, alignItems:'center' }}>
                                <span style={{ color:'#7c3aed', fontWeight:600 }}>{o.policy}</span>
                                <span style={{ color: theme.textMute }}>{fmtTime(o.start_time)}–{fmtTime(o.end_time)}</span>
                                <span style={{ fontWeight:700, color: theme.textSoft, marginLeft:'auto' }}>{fmtHours(o.hours)}</span>
                            </div>
                        </div>
                    ))}
                    <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${theme.border}`, display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, fontWeight:700, color: theme.textMute }}>OT Pay (this period)</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#7c3aed' }}>{fmt(detail.overtime_amount??0, curr)}</span>
                    </div>
                </MiniModal>
            )}
            {allowPop && (
                <MiniModal title="Allowances" subtitle="Breakdown" icon="💰" onClose={()=>setAllowPop(false)} theme={theme}>
                    {(detail.allowance_details??[]).length===0 ? <p style={{ fontSize:12, color: theme.textMute }}>No allowance details.</p>
                    : (detail.allowance_details??[]).map((a,i)=>(
                        <div key={i} style={{ padding:'12px 0', borderBottom:`1px solid ${theme.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                                <div style={{ fontWeight:700, fontSize:13, color: theme.textSoft }}>{a.name}</div>
                                <div style={{ fontSize:10, color: theme.textMute, marginTop:2 }}>{a.type==='percentage'?`${a.rate}% of base salary`:`Fixed amount`}</div>
                            </div>
                            <span style={{ fontSize:13, fontWeight:700, color:'#059669' }}>+ {fmt(a.amount, curr)}</span>
                        </div>
                    ))}
                    <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>Total Allowances</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#059669' }}>+ {fmt(detail.total_allowances??0, curr)}</span>
                    </div>
                </MiniModal>
            )}

            {bonusPop && (
                <MiniModal title="Bonuses" subtitle="Breakdown" icon="🎁" onClose={() => setBonusPop(false)} theme={theme}>
                    {(detail.bonuses ?? []).length === 0 ? (
                        <p style={{ fontSize:12, color: theme.textMute }}>No bonus details.</p>
                    ) : (
                        (detail.bonuses ?? []).map((b, i) => (
                            <div
                                key={b.id ?? `${b.bonus_type_id ?? 'bonus'}-${i}`}
                                style={{
                                    padding:'12px 0',
                                    borderBottom:`1px solid ${theme.border}`,
                                    display:'flex',
                                    justifyContent:'space-between',
                                    alignItems:'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight:700, fontSize:13, color: theme.textSoft }}>
                                        {b.type_name}
                                    </div>
                                    <div style={{ fontSize:10, color: theme.textMute, marginTop:2 }}>
                                        {b.calculation_type === 'percentage'
                                            ? `${b.rate}% of base salary`
                                            : 'Fixed amount'}
                                    </div>
                                </div>

                                <span style={{ fontSize:13, fontWeight:700, color:'#059669' }}>
                                    + {fmt(b.amount, curr)}
                                </span>
                            </div>
                        ))
                    )}

                    <div
                        style={{
                            marginTop:10,
                            paddingTop:10,
                            borderTop:`1px solid ${theme.border}`,
                            display:'flex',
                            justifyContent:'space-between'
                        }}
                    >
                        <span style={{ fontSize:11, fontWeight:700, color: theme.textMute }}>
                            Total Bonus
                        </span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#059669' }}>
                            + {fmt(detail.bonus_amount ?? 0, curr)}
                        </span>
                    </div>
                </MiniModal>
            )}
        </div>
    );
}
function SalaryDetailModal({ detail, curr, onApprove, onClose, theme, dark }) {
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,7,46,0.55)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{
                background: theme.panelSolid,  // ← surface → panelSolid
                borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh',
                display:'flex', flexDirection:'column',
                boxShadow:'0 32px 80px rgba(0,0,0,0.3)',
                overflow:'hidden', border:`1px solid ${theme.border}`
            }}>
                {/* ── Compact header ── */}
                <div style={{ background:'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding:'10px 16px', flexShrink:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                            <div style={{ minWidth:0 }}>
                                <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase' }}>Salary Detail</div>
                                <div style={{ fontSize:14, fontWeight:800, color:'#fff', letterSpacing:'-0.2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {detail.name}
                                    {detail.position && <span style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.65)', marginLeft:5 }}>· {detail.position}</span>}
                                    {detail.department && <span style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.55)', marginLeft:4 }}>· {detail.department}</span>}
                                </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                                <span style={{ fontSize:10, background:'rgba(255,255,255,0.18)', color:'#fff', borderRadius:99, padding:'2px 8px', fontWeight:600, whiteSpace:'nowrap' }}>{detail.period_start} — {detail.period_end}</span>
                                <span style={{ fontSize:10, background: detail.status==='approved'?'rgba(16,185,129,0.3)':detail.status==='confirmed'?'rgba(124,58,237,0.3)':'rgba(255,255,255,0.12)', color:'#fff', borderRadius:99, padding:'2px 8px', fontWeight:700, whiteSpace:'nowrap' }}>{detail.status?.toUpperCase()}</span>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:26, height:26, cursor:'pointer', color:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
                    </div>
                </div>
                {/* ── Scrollable body, scrollbar hidden ── */}
                <div style={{ overflowY:'auto', flex:1, padding:'14px 18px 18px', scrollbarWidth:'none', msOverflowStyle:'none' }}
                     className="sd-hide-scroll">
                    <DetailModalContent detail={detail} curr={curr} onApprove={onApprove} onClose={onClose} theme={theme} dark={dark}/>
                </div>
            </div>
        </div>
    );
}

function getTheme(dark) {
    if (dark) return {
        panelSolid:      '#0f1b34',
        panelSoft:       'rgba(255,255,255,0.04)',
        panelSofter:     'rgba(255,255,255,0.07)',
        border:          'rgba(148,163,184,0.13)',
        borderStrong:    'rgba(148,163,184,0.22)',
        text:            '#f8fafc',
        textSoft:        '#cbd5e1',
        textMute:        '#64748b',
        overlay:         'rgba(2,8,23,0.78)',
        shadow:          '0 24px 60px rgba(0,0,0,0.45)',
        shadowSoft:      '0 4px 16px rgba(0,0,0,0.22)',
        primary:         '#8b5cf6',
        primarySoft:     'rgba(139,92,246,0.16)',
        success:         '#10b981',
        successSoft:     'rgba(16,185,129,0.14)',
        danger:          '#f87171',
        dangerSoft:      'rgba(248,113,113,0.14)',
        warning:         '#fbbf24',
        warningSoft:     'rgba(251,191,36,0.14)',
        inputBg:         'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.03) 100%)',
        inputBorder:     'rgba(148,163,184,0.18)',
        inputBorderFocus:'rgba(139,92,246,0.5)',
        tableHead:       'rgba(255,255,255,0.03)',
        rowHover:        'rgba(255,255,255,0.025)',
    };
    return {
        panelSolid:      '#ffffff',
        panelSoft:       '#f8fafc',
        panelSofter:     '#f1f5f9',
        border:          'rgba(15,23,42,0.08)',
        borderStrong:    'rgba(15,23,42,0.15)',
        text:            '#0f172a',
        textSoft:        '#475569',
        textMute:        '#94a3b8',
        overlay:         'rgba(15,23,42,0.48)',
        shadow:          '0 20px 50px rgba(15,23,42,0.14)',
        shadowSoft:      '0 2px 8px rgba(15,23,42,0.06)',
        primary:         '#7c3aed',
        primarySoft:     '#f3e8ff',
        success:         '#059669',
        successSoft:     '#ecfdf5',
        danger:          '#ef4444',
        dangerSoft:      '#fef2f2',
        warning:         '#d97706',
        warningSoft:     '#fffbeb',
        inputBg:         'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
        inputBorder:     '#e2e8f0',
        inputBorderFocus:'rgba(124,58,237,0.45)',
        tableHead:       '#f8fafc',
        rowHover:        '#fafbff',
    };
}

// ─── Constants ────────────────────────────────────────────────
const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const csrf         = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const fmt          = (v, code='') => `${code ? code+' ' : ''}${Number(v??0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`.trim();

// ─── Spinner ──────────────────────────────────────────────────
function Spinner({ color='#7c3aed', size=14 }) {
    return <div style={{ width:size, height:size, border:`2px solid ${color}33`, borderTopColor:color, borderRadius:'50%', animation:'psSpin 0.7s linear infinite', flexShrink:0 }}/>;
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ name, size=34, theme }) {
    const initials = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const bg = ['#7c3aed','#059669','#2563eb','#d97706','#dc2626','#0891b2'][(name?.charCodeAt(0)||0)%6];
    return (
        <div style={{ width:size, height:size, borderRadius:'50%', background:bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.36, fontWeight:800, color:'#fff', border:`2px solid ${theme.border}` }}>
            {initials}
        </div>
    );
}

// ─── Premium Dropdown (UserRole pattern) ──────────────────────
function PremiumDropdown({ options, value, onChange, placeholder='Select...', theme, dark, width='auto', minWidth=130, zIndex=200 }) {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top:0, left:0, width:0 });
    const triggerRef      = useRef(null);
    const menuRef         = useRef(null);
    const selected        = options.find(o => String(o.value) === String(value));

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
        if (rect) setPos({ top:rect.bottom+window.scrollY+6, left:rect.left+window.scrollX, width:rect.width });
        setOpen(v=>!v);
    };

    return (
        <>
            <button ref={triggerRef} type="button" onClick={handleOpen} style={{
                width, minWidth, height:44, padding:'0 14px', borderRadius:14,
                border:`1.5px solid ${open?theme.inputBorderFocus:theme.inputBorder}`,
                background: dark
                    ? 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.03) 100%)'
                    : 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
                color: selected ? theme.text : theme.textMute,
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                cursor:'pointer', fontSize:13, fontWeight: selected?600:400,
                boxShadow: open?`0 0 0 3px ${theme.primary}22`:'none',
                transition:'all 0.18s', outline:'none',
            }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {selected?.label || placeholder}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ flexShrink:0, transition:'transform 0.2s', transform:open?'rotate(180deg)':'rotate(0deg)', color:theme.textMute }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={menuRef} style={{
                    position:'absolute', top:pos.top, left:pos.left, width:Math.max(pos.width,180),
                    background: dark
                        ? 'linear-gradient(180deg,rgba(5,17,38,0.99) 0%,rgba(3,12,28,0.99) 100%)'
                        : '#fff',
                    border:`1px solid ${theme.borderStrong}`, borderRadius:16,
                    boxShadow: dark
                        ? '0 24px 60px rgba(0,0,0,0.55),0 0 0 1px rgba(148,163,184,0.08)'
                        : '0 12px 40px rgba(15,23,42,0.16),0 0 0 1px rgba(15,23,42,0.06)',
                    zIndex:9999, overflow:'hidden', animation:'psDrop 0.15s ease',
                    backdropFilter: dark?'blur(20px)':'none',
                }}>
                    {options.map(opt => {
                        const isSelected = String(opt.value)===String(value);
                        return (
                            <button key={opt.value} type="button" onClick={()=>{onChange(opt.value);setOpen(false);}}
                                style={{
                                    width:'100%', padding:'11px 16px', background: isSelected
                                        ? (dark?'rgba(37,99,235,0.22)':'#7c3aed')
                                        : 'transparent',
                                    border:'none', cursor:'pointer', textAlign:'left',
                                    display:'flex', alignItems:'center', gap:10,
                                    fontSize:13, fontWeight: isSelected?700:500,
                                    color: isSelected?'#fff':(dark?theme.textSoft:'#374151'),
                                    transition:'background 0.12s',
                                }}
                                onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background=dark?'rgba(255,255,255,0.06)':'#f5f3ff'; }}
                                onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background='transparent'; }}>
                                {isSelected && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
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

// ─── Group by employee ────────────────────────────────────────
function groupByEmployee(records) {
    const map = new Map();
    records.forEach(r => { if(!map.has(r.user_id)) map.set(r.user_id,[]); map.get(r.user_id).push(r); });
    const rows=[]; let idx=1;
    map.forEach(recs=>{
        recs.forEach((r,i)=>rows.push({...r,isFirst:i===0,rowspan:i===0?recs.length:0,groupIdx:idx,isLast:i===recs.length-1}));
        idx++;
    });
    return rows;
}

// ─── Download Button ──────────────────────────────────────────
function DownloadBtn({ recordId, type, name, year, month, periodLabel, onToast, theme, dark }) {
    const [loading, setLoading] = useState(false);
    const isPdf = type==='pdf';

    const download = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/payroll/payslip/${recordId}/${type}`,{headers:{'X-CSRF-TOKEN':csrf()}});
            if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.message??'Download failed');}
            const blob=await res.blob();
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');
            a.href=url;
            const safeName=(name||'employee').replace(/\s+/g,'_').toLowerCase();
            const safeDate=(periodLabel||`${year}_${month}`).replace(/\s+–\s+/g,'_to_').replace(/\s+/g,'_');
            a.download=`payslip_${safeName}_${safeDate}.${isPdf?'pdf':'xlsx'}`;
            a.click();URL.revokeObjectURL(url);
            onToast('Payslip downloaded successfully');
        } catch(e){onToast(e.message,'error');}
        finally{setLoading(false);}
    };

    return (
        <button onClick={download} disabled={loading} style={{
            padding:'6px 14px', borderRadius:8,
            border: isPdf?'none':`1.5px solid ${dark?'rgba(16,185,129,0.4)':theme.success}`,
            background: loading
                ? (isPdf?(dark?theme.primarySoft:'#ddd6fe'):(dark?theme.successSoft:'#d1fae5'))
                : (isPdf?`linear-gradient(135deg,${theme.primary},${dark?'#6d28d9':'#4f46e5'})`:'transparent'),
            color: isPdf?'#fff':theme.success,
            fontSize:11, fontWeight:700, cursor:loading?'not-allowed':'pointer',
            display:'inline-flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
            boxShadow: isPdf&&!loading?`0 2px 8px ${theme.primary}44`:'none',
            transition:'all 0.15s',
        }}>
            {loading?<Spinner color={isPdf?'#fff':theme.success} size={11}/>:<span>{isPdf?'📄':'📊'}</span>}
            {loading?'…':(isPdf?'PDF':'Excel')}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────
export default function PayslipIndex({ salaryRule, periodTemplates, employees, isHR }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(()=>getTheme(dark),[dark]);

    const now   = new Date();
    const cycle = salaryRule?.pay_cycle ?? 'monthly';
    const count = cycle==='semi_monthly'?2:cycle==='ten_day'?3:1;
    const years = Array.from({length:3},(_,i)=>now.getFullYear()-1+i);

    const [filterYear,   setFilterYear]   = useState(now.getFullYear());
    const [filterMonth,  setFilterMonth]  = useState(now.getMonth()+1);
    const [filterPeriod, setFilterPeriod] = useState('');
    const [search,       setSearch]       = useState('');
    const [records,      setRecords]      = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [toast,        setToast]        = useState(null);
    const [bulkPdfLoad,  setBulkPdfLoad]  = useState(false);
    const [bulkXlsLoad,  setBulkXlsLoad]  = useState(false);
    const [detailModal, setDetailModal] = useState(null);
    const [detailLoading, setDetailLoading] = useState(null); 

    const openDetail = async (recordId) => {
        setDetailLoading(recordId);  // ← specific recordId
        try {
            const res = await fetch(`/payroll/records/${recordId}/show`, {
                headers: { 'X-CSRF-TOKEN': csrf() }
            });
            const data = await res.json();
            setDetailModal(data);
        } catch {
            showToast('Failed to load detail', 'error');
        } finally {
            setDetailLoading(null);
        }
    };

    const showToast = (msg, type='success') => {
        window.dispatchEvent(
            new CustomEvent('global-toast', {
                detail: { message: msg, type }
            })
        );
    };

    const load = useCallback(async()=>{
        setLoading(true);
        try {
            const p=new URLSearchParams();
            if(filterYear)   p.set('year',filterYear);
            if(filterMonth)  p.set('month',filterMonth);
            if(filterPeriod) p.set('period_id',filterPeriod);
            const res=await fetch(`/payroll/payslip/records?${p}`);
            const data=await res.json();
            setRecords(Array.isArray(data)?data:[]);
        } catch{showToast('Failed to load payslips','error');}
        finally{setLoading(false);}
    },[filterYear,filterMonth,filterPeriod]);

    useEffect(()=>{load();},[load]);

    const periodDateLabels = useMemo(()=>{
        const m={};
        records.forEach(r=>{if(r.period_id&&r.period_start&&r.period_end) m[r.period_id]=`${r.period_start} – ${r.period_end}`;});
        return m;
    },[records]);

    const filtered = isHR&&search.trim()
        ? records.filter(r=>r.name?.toLowerCase().includes(search.toLowerCase())||r.department?.toLowerCase().includes(search.toLowerCase())||r.position?.toLowerCase().includes(search.toLowerCase()))
        : records;

    const grouped  = isHR
        ? groupByEmployee(filtered)
        : filtered.map((r,i)=>({...r,isFirst:true,rowspan:1,groupIdx:i+1,isLast:true}));

    const currency = filtered[0]?.currency??'';
    const totalNet = filtered.reduce((s,r)=>s+(r.net_salary??0),0);

    const bulkDownload = async(type,setLoad,ext)=>{
        setLoad(true);
        try {
            const p=new URLSearchParams();
            if(filterYear)   p.set('year',filterYear);
            if(filterMonth)  p.set('month',filterMonth);
            if(filterPeriod) p.set('period_id',filterPeriod);
            const res=await fetch(`/payroll/payslip/bulk/${type}?${p}`,{headers:{'X-CSRF-TOKEN':csrf()}});
            if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.message??'Download failed');}
            const blob=await res.blob();
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');
            a.href=url;
            a.download=`payslips_${filterYear}_${filterMonth?MONTHS_SHORT[filterMonth-1]:'all'}${ext}`;
            a.click();URL.revokeObjectURL(url);
            onToast('Payslip downloaded successfully');
        }catch(e){showToast(e.message,'error');}
        finally{setLoad(false);}
    };

    // Dropdown options
    const yearOpts   = years.map(y=>({value:y,label:String(y)}));
    const monthOpts  = [{value:'',label:'All Months'},...MONTHS.map((m,i)=>({value:i+1,label:m}))];
    const periodOpts = [{value:'',label:'All Periods'},...(periodTemplates||[]).map(p=>({value:p.id,label:periodDateLabels[p.id]?periodDateLabels[p.id]:`Period ${p.period_number}`}))];
    const cycleLabel = cycle==='semi_monthly'?'Semi-Monthly':cycle==='ten_day'?'10-Day':'Monthly';

    // Summary bar stats (slim, meaningful only)
    const uniqueEmps   = isHR ? new Set(filtered.map(r=>r.user_id)).size : 1;
    const highestNet   = filtered.length ? Math.max(...filtered.map(r=>r.net_salary??0)) : 0;
    const avgNet       = filtered.length ? totalNet / filtered.length : 0;

    const thS = (w,align='left') => ({ padding:'11px 18px', textAlign:align, fontSize:10, fontWeight:800, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.7px', whiteSpace:'nowrap', minWidth:w, background:theme.tableHead });
console.log("grouped",grouped)
    return (
        <AppLayout title="Payslip">
            <Head title="Payslip"/>
            <style>{`
                @keyframes psSpin  { to{transform:rotate(360deg);} }
                @keyframes psDrop  { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }
                @keyframes psFadeIn{ from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);} }
                .ps-hide::-webkit-scrollbar{display:none;}.ps-hide{scrollbar-width:none;-ms-overflow-style:none;}
                .ps-row:hover td { background:${dark?'rgba(139,92,246,0.05)':'#faf5ff'} !important; }
                .ps-row td { transition:background 0.12s; }
            `}</style>

            <div style={{display:'flex',flexDirection:'column',gap:20}}>

                {/* ── Filter Bar ── */}
                <div style={{background:dark?theme.panelSolid:'#fff',borderRadius:18,border:`1px solid ${theme.border}`,padding:'16px 20px',boxShadow:dark?'none':theme.shadowSoft,display:'flex',flexDirection:'column',gap:14}}>
                    {/* Filter row */}
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                        <span style={{fontSize:10,fontWeight:800,color:theme.textMute,textTransform:'uppercase',letterSpacing:'0.8px',flexShrink:0}}>Pay Period</span>
                        <PremiumDropdown options={yearOpts}   value={filterYear}   onChange={v=>setFilterYear(Number(v))}   theme={theme} dark={dark} minWidth={100}/>
                        <PremiumDropdown options={monthOpts}  value={filterMonth}  onChange={v=>setFilterMonth(v===''?'':Number(v))} theme={theme} dark={dark} minWidth={145}/>
                        {count>1 && (
                            <PremiumDropdown options={periodOpts} value={filterPeriod} onChange={setFilterPeriod} theme={theme} dark={dark} minWidth={165}/>
                        )}
                        <span style={{fontSize:11,fontWeight:700,color:theme.primary,background:dark?theme.primarySoft:'#ede9fe',padding:'5px 12px',borderRadius:99,flexShrink:0}}>{cycleLabel.toUpperCase()}</span>
                        <button onClick={load} disabled={loading} style={{marginLeft:'auto',padding:'9px 16px',borderRadius:10,border:`1px solid ${theme.border}`,background:dark?theme.panelSoft:'#fff',color:theme.textSoft,fontSize:12,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6,transition:'all 0.15s'}}>
                            {loading?<><Spinner size={12} color={theme.textMute}/>Loading…</>:'🔄 Refresh'}
                        </button>
                    </div>

                    {/* Summary bar — slim, meaningful */}
                    {!loading && filtered.length > 0 && (
                        <div style={{display:'flex',alignItems:'stretch',gap:0,background:dark?'rgba(255,255,255,0.03)':'#f8fafc',borderRadius:12,border:`1px solid ${theme.border}`,overflow:'hidden'}}>
                            {[
                                { label:'Payslips',   value: filtered.length,           color: theme.primary,  icon:'📄' },
                                { label:'Total Net',  value: fmt(totalNet, currency),   color: '#059669',       icon:'💰', big:true },
                                ...(isHR ? [
                                    { label:'Employees',  value: uniqueEmps,                color: '#2563eb',       icon:'👥' },
                                    { label:'Avg Net',    value: fmt(avgNet, currency),    color: theme.warning,   icon:'📊' },
                                ] : [
                                    { label:'Highest',    value: fmt(highestNet, currency),color: theme.warning,   icon:'📊' },
                                ]),
                            ].map((s, i, arr) => (
                                <div key={s.label} style={{flex:1,padding:'12px 18px',display:'flex',alignItems:'center',gap:12,borderRight:i<arr.length-1?`1px solid ${theme.border}`:'none'}}>
                                    <div style={{width:34,height:34,borderRadius:10,background:dark?`${s.color}18`:`${s.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{s.icon}</div>
                                    <div>
                                        <div style={{fontSize:s.big?13:15,fontWeight:900,color:s.color,lineHeight:1,whiteSpace:'nowrap'}}>{s.value}</div>
                                        <div style={{fontSize:10,color:theme.textMute,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:2}}>{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Main Table Panel ── */}
                <div style={{background:dark?theme.panelSolid:'#fff',borderRadius:18,border:`1px solid ${theme.border}`,boxShadow:dark?'none':theme.shadowSoft,overflow:'hidden'}}>

                    {/* Toolbar */}
                    <div style={{padding:'14px 20px',borderBottom:`1px solid ${theme.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                        {/* Left */}
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <span style={{fontSize:14,fontWeight:800,color:theme.text}}>
                                {loading?'Loading…':`${filtered.length} Payslip${filtered.length!==1?'s':''}`}
                            </span>
                            {!loading&&filtered.length>0&&(
                                <span style={{fontSize:12,fontWeight:700,color:theme.primary,background:dark?theme.primarySoft:'#ede9fe',padding:'3px 10px',borderRadius:99}}>
                                    Total: {fmt(totalNet,currency)}
                                </span>
                            )}
                        </div>

                        {/* Right */}
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                            {isHR&&(
                                <div style={{position:'relative'}}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)'}}>
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                    <input type="text" placeholder="Search employee…" value={search} onChange={e=>setSearch(e.target.value)}
                                        style={{padding:'8px 30px 8px 32px',borderRadius:10,border:`1px solid ${theme.border}`,fontSize:12,color:theme.text,background:dark?theme.panelSoft:'#fff',outline:'none',width:200}}/>
                                    {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:theme.textMute,fontSize:15}}>×</button>}
                                </div>
                            )}
                            {isHR&&records.length>0&&(
                                <>
                                    <button onClick={()=>bulkDownload('pdf',setBulkPdfLoad,'.zip')} disabled={bulkPdfLoad}
                                        style={{padding:'8px 14px',borderRadius:10,border:'none',background:bulkPdfLoad?(dark?theme.primarySoft:'#ddd6fe'):`linear-gradient(135deg,${theme.primary},${dark?'#6d28d9':'#4f46e5'})`,color:'#fff',fontSize:12,fontWeight:700,cursor:bulkPdfLoad?'not-allowed':'pointer',display:'inline-flex',alignItems:'center',gap:6,boxShadow:bulkPdfLoad?'none':`0 4px 12px ${theme.primary}44`}}>
                                        {bulkPdfLoad?<><Spinner color="#fff" size={11}/>Preparing…</>:'📦 All PDFs (ZIP)'}
                                    </button>
                                    <button onClick={()=>bulkDownload('excel',setBulkXlsLoad,'.xlsx')} disabled={bulkXlsLoad}
                                        style={{padding:'8px 14px',borderRadius:10,border:`1.5px solid ${dark?'rgba(16,185,129,0.4)':theme.success}`,background:bulkXlsLoad?(dark?theme.successSoft:'#d1fae5'):'transparent',color:theme.success,fontSize:12,fontWeight:700,cursor:bulkXlsLoad?'not-allowed':'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                                        {bulkXlsLoad?<><Spinner color={theme.success} size={11}/>Preparing…</>:'📊 All Excel'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ps-hide" style={{overflowX:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse'}}>
                            <thead>
                                <tr style={{borderBottom:`1px solid ${theme.border}`}}>
                                    {isHR&&<th style={thS('44px','center')}>#</th>}
                                    {isHR&&<th style={thS('170px')}>Employee</th>}
                                    <th style={thS('180px')}>Pay Period</th>
                                    <th style={thS('140px','right')}>Net Salary</th>
                                    <th style={thS('100px', 'center')}>Detail</th>
                                    <th style={thS('160px','center')}>Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading?(
                                    <tr><td colSpan={isHR?5:3} style={{textAlign:'center',padding:64}}>
                                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                                            <Spinner size={32} color={theme.primary}/>
                                            <span style={{fontSize:13,fontWeight:600,color:theme.textMute}}>Loading payslips…</span>
                                        </div>
                                    </td></tr>
                                ):grouped.length===0?(
                                    <tr><td colSpan={isHR?5:3} style={{textAlign:'center',padding:64}}>
                                        <div style={{fontSize:38,marginBottom:10}}>📭</div>
                                        <div style={{fontSize:14,fontWeight:700,color:theme.textSoft,marginBottom:4}}>
                                            {search?`No results for "${search}"`:'No confirmed payslips found'}
                                        </div>
                                        <div style={{fontSize:12,color:theme.textMute}}>Try adjusting the period filter above.</div>
                                    </td></tr>
                                ):grouped.map(r=>(
                                    <tr key={r.id} className="ps-row"
                                        style={{borderBottom:r.isLast?`1px solid ${theme.border}`:`1px dashed ${theme.border}`,animation:'psFadeIn 0.15s ease'}}>

                                        {/* # */}
                                        {isHR&&r.isFirst&&(
                                            <td rowSpan={r.rowspan} style={{padding:'14px 18px',textAlign:'center',width:44,color:theme.textMute,fontWeight:700,fontSize:11,borderRight:`1px solid ${theme.border}`,background:dark?'rgba(255,255,255,0.02)':theme.panelSoft,verticalAlign:'middle'}}>
                                                {r.groupIdx}
                                            </td>
                                        )}

                                        {/* Employee */}
                                        {isHR&&r.isFirst&&(
                                            <td rowSpan={r.rowspan} style={{padding:'14px 18px',verticalAlign:'middle',borderRight:`1px solid ${theme.border}`,minWidth:160}}>
                                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                    <Avatar name={r.name} size={34} theme={theme}/>
                                                    <div>
                                                        <div style={{fontSize:13,fontWeight:800,color:theme.text}}>{r.name}</div>
                                                        <div style={{fontSize:11,color:theme.textMute,marginTop:1}}>{[r.position,r.department].filter(Boolean).join(' · ')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* Pay Period */}
                                        <td style={{padding:'14px 18px', paddingLeft:isHR?22:18}}>
                                            <div style={{fontSize:13, fontWeight:700, color:theme.text}}>
                                                {r.period_start} – {r.period_end}
                                            </div>
                                            <div style={{marginTop:4}}>
                                                <span style={{
                                                    fontSize:10,
                                                    fontWeight:700,
                                                    background: r.status === 'paid'
                                                        ? (dark ? 'rgba(59,130,246,0.16)' : '#dbeafe')
                                                        : (dark ? theme.successSoft : theme.successSoft),
                                                    color: r.status === 'paid' ? '#2563eb' : theme.success,
                                                    borderRadius:99,
                                                    padding:'2px 9px'
                                                }}>
                                                    {r.status === 'paid' ? '💳 Paid' : '✓ Confirmed'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Net Salary */}
                                        <td style={{padding:'14px 18px',textAlign:'right',whiteSpace:'nowrap'}}>
                                            <span style={{fontSize:15,fontWeight:900,color:r.net_salary>0?theme.primary:theme.textMute}}>
                                                {fmt(r.net_salary,r.currency)}
                                            </span>
                                        </td>
                                       <td style={{padding:'14px 18px', textAlign:'center', width:100}}>
                                            <button
                                                onClick={() => openDetail(r.id)}
                                                disabled={detailLoading === r.id}
                                                style={{
                                                    padding:'6px 14px', borderRadius:8,
                                                    border:`1.5px solid ${dark?'rgba(124,58,237,0.35)':theme.primary}`,
                                                    background:'transparent',
                                                    color: detailLoading === r.id ? theme.textMute : theme.primary,
                                                    fontSize:11, fontWeight:700,
                                                    cursor: detailLoading === r.id ? 'not-allowed' : 'pointer',
                                                    display:'inline-flex', alignItems:'center', justifyContent:'center', // ← ထည့်
                                                    gap:5,
                                                    transition:'all 0.15s',
                                                    width: "80px"
                                                }}
                                                onMouseEnter={e => { if(detailLoading !== r.id) e.currentTarget.style.background = dark?'rgba(124,58,237,0.12)':theme.primarySoft; }}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                            
                                                {detailLoading === r.id ? 'Loading…' : 'Detail'}
                                            </button>
                                        </td>
                                        {/* Download */}
                                        <td style={{padding:'14px 18px',textAlign:'center',width:160}}>
                                            <div style={{display:'inline-flex',gap:7}}>
                                                <DownloadBtn recordId={r.id} type="pdf"   name={r.name} year={r.year} month={r.month} periodLabel={r.period_label} onToast={showToast} theme={theme} dark={dark}/>
                                                <DownloadBtn recordId={r.id} type="excel" name={r.name} year={r.year} month={r.month} periodLabel={r.period_label} onToast={showToast} theme={theme} dark={dark}/>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {detailModal && (
                <SalaryDetailModal
                    detail={detailModal}
                    curr={detailModal.currency ?? ''}
                    onApprove={() => {}}     // payslip မှာ approve action မလိုဘူး — view only
                    onClose={() => setDetailModal(null)}
                    theme={theme}
                    dark={dark}
                />
            )}
        </AppLayout>
    );
}