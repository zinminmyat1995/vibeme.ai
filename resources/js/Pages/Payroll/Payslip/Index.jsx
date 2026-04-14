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
                                        <td style={{padding:'14px 18px',paddingLeft:isHR?22:18}}>
                                            <div style={{fontSize:13,fontWeight:700,color:theme.text}}>{r.period_start} – {r.period_end}</div>
                                            <div style={{marginTop:4}}>
                                                <span style={{fontSize:10,fontWeight:700,background:dark?theme.successSoft:theme.successSoft,color:theme.success,borderRadius:99,padding:'2px 9px'}}>
                                                    ✓ Confirmed
                                                </span>
                                            </div>
                                        </td>

                                        {/* Net Salary */}
                                        <td style={{padding:'14px 18px',textAlign:'right',whiteSpace:'nowrap'}}>
                                            <span style={{fontSize:15,fontWeight:900,color:r.net_salary>0?theme.primary:theme.textMute}}>
                                                {fmt(r.net_salary,r.currency)}
                                            </span>
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
        </AppLayout>
    );
}