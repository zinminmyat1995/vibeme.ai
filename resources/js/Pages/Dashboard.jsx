// resources/js/Pages/Dashboard.jsx
import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
function Spinner({ size=14, color='#fff' }) { return <span style={{ display:'inline-block', width:size, height:size, border:`2px solid ${color}33`, borderTop:`2px solid ${color}`, borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }}/>; }

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, height=100, color='#6366f1' }) {
    if (!data?.length) return <div style={{ fontSize:12, color:'#9ca3af', padding:'20px 0', textAlign:'center' }}>No payroll data yet</div>;
    const max = Math.max(...data.map(d=>d.value), 1);
    return (
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height }}>
            {data.map((d,i)=>(
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    {d.total > 0 && <div style={{ fontSize:9, color:'#9ca3af', fontWeight:600, whiteSpace:'nowrap' }}>${(d.total/1000).toFixed(0)}k</div>}
                    <div title={`${d.value} records`} style={{ width:'100%', background:`linear-gradient(180deg, ${color}cc, ${color})`, borderRadius:'4px 4px 0 0', minHeight:4, height:`${Math.max((d.value/max)*(height - (d.total>0?20:4)),4)}px`, transition:'height 0.4s ease', cursor:'default' }}/>
                    <div style={{ fontSize:9, color:'#9ca3af', fontWeight:600 }}>{d.label||d.month}</div>
                </div>
            ))}
        </div>
    );
}

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ data, size=120 }) {
    const total = data?.reduce((s,d)=>s+d.value,0)||0;
    if (!total) return <div style={{ textAlign:'center', color:'#9ca3af', fontSize:12 }}>No data</div>;
    const r=44, cx=60, cy=60, circ=2*Math.PI*r;
    let offset=0;
    return (
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <svg width={size+20} height={size+20} viewBox="0 0 120 120" style={{ flexShrink:0 }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="14"/>
                {data.map((d,i)=>{
                    const pct=d.value/total, dash=pct*circ, gap=circ-dash;
                    const seg=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="14"
                        strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset*circ}
                        transform="rotate(-90 60 60)" style={{ transition:'stroke-dasharray 0.5s ease' }}/>;
                    offset+=pct; return seg;
                })}
                <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="900" fill="#111827">{total}</text>
                <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#9ca3af">employees</text>
            </svg>
            <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                {data.map((d,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:'#374151', fontWeight:600, flex:1 }}>{d.label}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:d.color }}>{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Announcement Banner ────────────────────────────────────────────────────────
function AnnouncementBanner({ announcements, roleName, onCreated }) {
    const [showModal, setShowModal] = useState(false);
    const canCreate = ['admin','hr'].includes(roleName);
    return (
        <>
            {/* New Announcement button — always outside, top right of section */}
            {canCreate && (
                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom: announcements.length > 0 ? 8 : 16 }}>
                    <button onClick={()=>setShowModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:99, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(124,58,237,0.3)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        New Announcement
                    </button>
                </div>
            )}
            {announcements.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                    {announcements.map(a=>(
                        <div key={a.id} style={{ background:'#fff', borderRadius:12, border:'1.5px solid #e0e7ff', overflow:'hidden', boxShadow:'0 1px 6px rgba(99,102,241,0.08)' }}>
                            <div style={{ background:'linear-gradient(90deg,#6366f1,#8b5cf6)', height:3 }}/>
                            <div style={{ padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
                                <div style={{ width:34, height:34, borderRadius:9, background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📢</div>
                                <div style={{ flex:1 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                        <span style={{ fontSize:9, fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.8px', background:'#eef2ff', borderRadius:99, padding:'2px 8px' }}>Announcement</span>
                                        <span style={{ fontSize:10, color:'#9ca3af' }}>Until {new Date(a.end_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                                    </div>
                                    <div style={{ fontSize:13, fontWeight:800, color:'#111827', marginBottom:3 }}>{a.title}</div>
                                    <div style={{ fontSize:12, color:'#4b5563', lineHeight:1.6 }}>{a.content}</div>
                                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:4 }}>By {a.created_by}{a.country ? ` · ${a.country}` : ' · All countries'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showModal && <AnnouncementModal onClose={()=>setShowModal(false)} onCreated={()=>{ setShowModal(false); onCreated(); }}/>}
        </>
    );
}

// ── Announcement Modal ─────────────────────────────────────────────────────────
function AnnouncementModal({ onClose, onCreated }) {
    const [form,setForm]=useState({title:'',content:'',start_at:'',end_at:''});
    const [saving,setSaving]=useState(false);
    const [errors,setErrors]=useState({});
    const today=new Date().toISOString().slice(0,16);
    const inp=f=>({ width:'100%', padding:'8px 11px', borderRadius:8, border:`1.5px solid ${errors[f]?'#fca5a5':'#e5e7eb'}`, fontSize:13, color:'#374151', background:'#f9fafb', outline:'none', boxSizing:'border-box' });
    const save=async()=>{
        const e={};
        if(!form.title.trim()) e.title='Required';
        if(!form.content.trim()) e.content='Required';
        if(!form.start_at) e.start_at='Required';
        if(!form.end_at) e.end_at='Required';
        if(Object.keys(e).length){setErrors(e);return;}
        setSaving(true);
        try {
            const res=await fetch('/dashboard/announcements',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf(),'Accept':'application/json','X-Inertia':'true'},body:JSON.stringify(form)});
            if(!res.ok){const d=await res.json().catch(()=>{}); if(d?.errors) setErrors(d.errors); return;}
            window.dispatchEvent(new CustomEvent('global-toast',{detail:{message:'Announcement created!',type:'success'}}));
            onCreated();
        } catch { window.dispatchEvent(new CustomEvent('global-toast',{detail:{message:'Failed',type:'error'}})); }
        finally { setSaving(false); }
    };
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.55)', backdropFilter:'blur(4px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:440, boxShadow:'0 30px 90px rgba(0,0,0,0.22)', overflow:'hidden' }}>
                <div style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>📢 New Announcement</div>
                    <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:28, height:28, cursor:'pointer', color:'#fff', fontSize:16 }}>×</button>
                </div>
                <div style={{ padding:'18px 20px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                    <div><label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Title</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Title..." style={inp('title')}/>{errors.title&&<div style={{ fontSize:10, color:'#ef4444', marginTop:2 }}>{errors.title}</div>}</div>
                    <div><label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Content</label><textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} rows={3} placeholder="Details..." style={{...inp('content'),resize:'vertical'}}/>{errors.content&&<div style={{ fontSize:10, color:'#ef4444', marginTop:2 }}>{errors.content}</div>}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <div><label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Start</label><input type="datetime-local" min={today} value={form.start_at} onChange={e=>setForm(p=>({...p,start_at:e.target.value}))} style={inp('start_at')}/></div>
                        <div><label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>End</label><input type="datetime-local" min={today} value={form.end_at} onChange={e=>setForm(p=>({...p,end_at:e.target.value}))} style={inp('end_at')}/></div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
                        <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                        <button onClick={save} disabled={saving} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>{saving?<><Spinner size={11}/> Saving...</>:'Post'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, bg, accent }) {
    return (
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px', border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent||color }}/>
            <div style={{ width:38, height:38, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:10 }}>{icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color, letterSpacing:'-0.8px', lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.6px', marginTop:5 }}>{label}</div>
            {sub && <div style={{ fontSize:10, color:sub.includes('⚠')?'#d97706':'#9ca3af', marginTop:3, fontWeight:sub.includes('⚠')?700:400 }}>{sub}</div>}
        </div>
    );
}

// ── Alert List ─────────────────────────────────────────────────────────────────
function AlertRow({ icon, name, department, daysLeft, endDate, color }) {
    const urgent = daysLeft <= 3;
    return (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9, background:urgent?'#fef2f2':'#f9fafb', border:`1px solid ${urgent?'#fecaca':'#f3f4f6'}`, marginBottom:6 }}>
            <span style={{ fontSize:15, flexShrink:0 }}>{icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{name}</div>
                {department && <div style={{ fontSize:10, color:'#9ca3af' }}>{department}</div>}
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:urgent?'#dc2626':color }}>{daysLeft}d left</div>
                <div style={{ fontSize:9, color:'#9ca3af' }}>{endDate}</div>
            </div>
        </div>
    );
}

// ── My Stat Card ───────────────────────────────────────────────────────────────
function MyCard({ icon, label, value, sub, color, bg, accent, children }) {
    return (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent||color }}/>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
            </div>
            {children || (
                <>
                    <div style={{ fontSize:26, fontWeight:900, color, letterSpacing:'-0.5px', lineHeight:1 }}>{value}</div>
                    {sub && <div style={{ fontSize:10, color:'#9ca3af', marginTop:4 }}>{sub}</div>}
                </>
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard({
    announcements=[], employeeStats, probationAlerts=[], contractAlerts=[],
    employmentChart=[], countryChart=[], payrollTrend=[],
    myStats, todayStatus, upcomingHolidays=[], roleName
}) {
    const { auth } = usePage().props;
    const firstName = auth?.user?.name?.split(' ')[0]||'there';
    const now=new Date(), hour=now.getHours();
    const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
    const isHRAdmin = ['hr','admin'].includes(roleName);

    const payslipCfg = {
        confirmed:{color:'#7c3aed',bg:'#ede9fe',label:'Confirmed'},
        paid:{color:'#059669',bg:'#d1fae5',label:'Paid'},
        approved:{color:'#2563eb',bg:'#dbeafe',label:'Approved'},
        calculated:{color:'#d97706',bg:'#fef3c7',label:'Calculated'},
    }[myStats?.payslip_status]??null;

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard"/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div style={{ animation:'fadeUp 0.3s ease' }}>

                {/* ── Welcome Banner ── */}
                <div style={{ background:'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)', borderRadius:16, padding:'18px 24px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 4px 20px rgba(30,58,95,0.2)' }}>
                    <div>
                        <div style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.3px', marginBottom:3 }}>{greeting}, {firstName} 👋</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>{now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {todayStatus?.checked_in ? (
                            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.4)', borderRadius:99, padding:'6px 14px' }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399' }}/>
                                <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>In {todayStatus.check_in?.slice(0,5)||''}{todayStatus.check_out?` · Out ${todayStatus.check_out.slice(0,5)}`:''}</span>
                            </div>
                        ) : (
                            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(251,191,36,0.2)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:99, padding:'6px 14px' }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:'#fbbf24' }}/>
                                <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>Not Checked In</span>
                            </div>
                        )}
                        {upcomingHolidays[0] && (
                            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.12)', borderRadius:99, padding:'6px 12px' }}>
                                <span>🎌</span>
                                <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{upcomingHolidays[0].name} · {new Date(upcomingHolidays[0].date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Announcements (button outside, cards below) ── */}
                <AnnouncementBanner announcements={announcements} roleName={roleName} onCreated={()=>router.reload()}/>

                {/* ── HR/Admin: Employee Overview ── */}
                {isHRAdmin && employeeStats && (
                    <>
                        {/* Row 1: 4 stat cards */}
                        <div style={{ fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>Employee Overview</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                            <StatCard icon="👥" label="Total" value={employeeStats.total} color="#1e3a5f" bg="#eef2ff" accent="#1e3a5f"/>
                            <StatCard icon="🎓" label="Probation" value={employeeStats.probation} color="#d97706" bg="#fef3c7" accent="#f59e0b"
                                sub={probationAlerts.length>0?`⚠ ${probationAlerts.length} ending soon`:'All on track'}/>
                            <StatCard icon="📄" label="Contract" value={employeeStats.contract} color="#2563eb" bg="#dbeafe" accent="#3b82f6"
                                sub={contractAlerts.length>0?`⚠ ${contractAlerts.length} expiring soon`:'All on track'}/>
                            <StatCard icon="✅" label="Permanent" value={employeeStats.permanent} color="#059669" bg="#d1fae5" accent="#10b981"/>
                        </div>

                        {/* Row 2: Donut chart (left) + Payroll Trend bar chart (right) */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:14, marginBottom:16 }}>
                            {/* Donut */}
                            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize:12, fontWeight:800, color:'#374151', marginBottom:14 }}>Employment Mix</div>
                                <DonutChart data={employmentChart} size={120}/>
                            </div>
                            {/* Payroll Trend */}
                            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                                    <div style={{ fontSize:12, fontWeight:800, color:'#374151' }}>📊 Payroll Trend — Last 6 Months</div>
                                    <div style={{ fontSize:10, color:'#9ca3af' }}>records · net salary total</div>
                                </div>
                                <BarChart data={payrollTrend.map(d=>({label:d.month,value:d.count,total:d.total}))} height={100} color="#6366f1"/>
                            </div>
                        </div>

                        {/* Row 3: Probation + Contract alerts — always equal 2 columns */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
                            {/* Probation Alerts */}
                            <div style={{ background:'#fff', borderRadius:14, border:`1.5px solid ${probationAlerts.length>0?'#fde68a':'#e5e7eb'}`, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                                    <div style={{ width:32, height:32, borderRadius:9, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>⏳</div>
                                    <div>
                                        <div style={{ fontSize:12, fontWeight:800, color:'#92400e' }}>Probation Ending Soon</div>
                                        <div style={{ fontSize:10, color:'#9ca3af' }}>within 10 days</div>
                                    </div>
                                    <span style={{ marginLeft:'auto', fontSize:11, fontWeight:800, color:'#d97706', background:'#fef3c7', borderRadius:99, padding:'3px 10px', border:'1px solid #fde68a' }}>{probationAlerts.length}</span>
                                </div>
                                {probationAlerts.length === 0 ? (
                                    <div style={{ textAlign:'center', padding:'16px 0', color:'#9ca3af' }}>
                                        <div style={{ fontSize:22, marginBottom:6 }}>✅</div>
                                        <div style={{ fontSize:12, fontWeight:600 }}>All probation employees on track</div>
                                    </div>
                                ) : probationAlerts.map(a=>(
                                    <AlertRow key={a.id} icon="🎓" name={a.name} department={a.department} daysLeft={a.days_left} endDate={a.probation_end} color="#d97706"/>
                                ))}
                            </div>

                            {/* Contract Alerts */}
                            <div style={{ background:'#fff', borderRadius:14, border:`1.5px solid ${contractAlerts.length>0?'#bfdbfe':'#e5e7eb'}`, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                                    <div style={{ width:32, height:32, borderRadius:9, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>📋</div>
                                    <div>
                                        <div style={{ fontSize:12, fontWeight:800, color:'#1e40af' }}>Contract Expiring Soon</div>
                                        <div style={{ fontSize:10, color:'#9ca3af' }}>within 30 days</div>
                                    </div>
                                    <span style={{ marginLeft:'auto', fontSize:11, fontWeight:800, color:'#2563eb', background:'#dbeafe', borderRadius:99, padding:'3px 10px', border:'1px solid #bfdbfe' }}>{contractAlerts.length}</span>
                                </div>
                                {contractAlerts.length === 0 ? (
                                    <div style={{ textAlign:'center', padding:'16px 0', color:'#9ca3af' }}>
                                        <div style={{ fontSize:22, marginBottom:6 }}>✅</div>
                                        <div style={{ fontSize:12, fontWeight:600 }}>No contracts expiring soon</div>
                                    </div>
                                ) : contractAlerts.map(a=>(
                                    <AlertRow key={a.id} icon="📄" name={a.name} department={a.department} daysLeft={a.days_left} endDate={a.contract_end} color="#2563eb"/>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ── My Overview ── */}
                <div style={{ fontSize:10, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>My Overview</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                    <MyCard icon="🏖️" label="Pending Leaves"
                        value={myStats.pending_leaves}
                        sub={myStats.pending_leaves>0?'awaiting approval':'no pending'}
                        color={myStats.pending_leaves>0?'#d97706':'#059669'}
                        bg={myStats.pending_leaves>0?'#fef3c7':'#d1fae5'}
                        accent={myStats.pending_leaves>0?'#f59e0b':'#10b981'}/>
                    <MyCard icon="⚡" label="OT This Month" value={`${myStats.ot_hours_month}h`} sub="approved overtime" color="#7c3aed" bg="#ede9fe" accent="#7c3aed"/>
                    <MyCard icon="📅" label="Present Days" value={myStats.present_days} sub="this month" color="#2563eb" bg="#dbeafe" accent="#3b82f6"/>
                    <MyCard icon="💰" label="Latest Payslip" color={payslipCfg?.color||'#9ca3af'} bg={payslipCfg?.bg||'#f3f4f6'} accent={payslipCfg?.color||'#e5e7eb'}>
                        {payslipCfg ? (
                            <>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:800, color:payslipCfg.color, background:payslipCfg.bg, borderRadius:99, padding:'4px 10px' }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:payslipCfg.color }}/>{payslipCfg.label}
                                </span>
                                {myStats.net_salary && <div style={{ fontSize:15, fontWeight:900, color:'#111827', marginTop:6, letterSpacing:'-0.3px' }}>${Number(myStats.net_salary).toLocaleString('en-US',{minimumFractionDigits:2})}</div>}
                            </>
                        ) : <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>No payslip yet</div>}
                    </MyCard>
                </div>

                {/* ── Bottom: Holidays + Quick Actions ── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    {/* Holidays */}
                    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                            <div style={{ width:30, height:30, borderRadius:8, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🎌</div>
                            <div style={{ fontSize:12, fontWeight:800, color:'#374151' }}>Upcoming Holidays</div>
                        </div>
                        {upcomingHolidays.length===0 ? (
                            <div style={{ fontSize:12, color:'#9ca3af', padding:'8px 0' }}>No upcoming holidays</div>
                        ) : upcomingHolidays.map((h,i)=>(
                            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<upcomingHolidays.length-1?'1px solid #f3f4f6':'none' }}>
                                <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{h.name}</span>
                                <span style={{ fontSize:10, color:'#7c3aed', fontWeight:700, background:'#ede9fe', borderRadius:99, padding:'3px 10px' }}>{new Date(h.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                            <div style={{ width:30, height:30, borderRadius:8, background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚡</div>
                            <div style={{ fontSize:12, fontWeight:800, color:'#374151' }}>Quick Actions</div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            {[
                                {icon:'📅',label:'Attendance',href:'/payroll/attendance',color:'#2563eb',bg:'#dbeafe', count:null},
                                {icon:'🏖️',label:'Leave',href:'/payroll/leaves',color:'#d97706',bg:'#fef3c7', count:myStats.pending_leave_approvals||0},
                                {icon:'⏰',label:'Overtime',href:'/payroll/overtimes',color:'#7c3aed',bg:'#ede9fe', count:myStats.pending_ot_approvals||0},
                                {icon:'📄',label:'Payslip',href:'/payroll/payslip',color:'#059669',bg:'#d1fae5', count:null},
                            ].map((item,i)=>(
                                <a key={i} href={item.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'1px solid #f3f4f6', background:'#f9fafb', textDecoration:'none', transition:'all 0.12s' }}
                                    onMouseEnter={e=>{ e.currentTarget.style.background=item.bg; e.currentTarget.style.borderColor=item.color+'44'; }}
                                    onMouseLeave={e=>{ e.currentTarget.style.background='#f9fafb'; e.currentTarget.style.borderColor='#f3f4f6'; }}>
                                    <div style={{ width:28, height:28, borderRadius:7, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{item.icon}</div>
                                    <span style={{ fontSize:12, fontWeight:600, color:'#374151', flex:1 }}>{item.label}</span>
                                    {item.count > 0 && (
                                        <span style={{ fontSize:10, fontWeight:800, color:'#fff', background:item.color, borderRadius:99, padding:'2px 7px', minWidth:18, textAlign:'center' }}>
                                            {item.count}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}