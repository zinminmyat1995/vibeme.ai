import { useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/Contexts/LanguageContext';
const trPresetName = (tr, value) => tr(`hrPolicy.presets.${String(value || '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}`) || value;

const makeTrText = (tr) => (key, fallback = '') => {
    const value = tr ? tr(key) : null;
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && typeof value._self === 'string') return value._self;
    return fallback || key;
};

const trMonthName = (tr, name) => tr(`hrPolicy.months.${name}`) || name;

/* ── useTheme ── */
function useTheme() {
    const getDark = () => typeof window === 'undefined' ? false :
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        localStorage.getItem('vibeme-theme') === 'dark';
    const [dark, setDark] = useState(getDark);
    useEffect(() => {
        const sync = () => setDark(getDark());
        window.addEventListener('vibeme-theme-change', sync);
        window.addEventListener('storage', sync);
        return () => { window.removeEventListener('vibeme-theme-change', sync); window.removeEventListener('storage', sync); };
    }, []);
    return dark;
}

/* ── getTheme ── */
function getTheme(dark) {
    if (dark) return {
        panelSolid:'#0b1324', panelSoft:'rgba(255,255,255,0.04)', panelSofter:'rgba(255,255,255,0.07)',
        border:'rgba(148,163,184,0.12)', borderStrong:'rgba(148,163,184,0.22)', borderFocus:'rgba(124,58,237,0.5)',
        text:'#f8fafc', textSoft:'#cbd5e1', textMute:'#64748b',
        primary:'#7c3aed', primarySoft:'rgba(124,58,237,0.15)', primaryHover:'#6d28d9',
        danger:'#f87171', dangerSoft:'rgba(248,113,113,0.12)',
        success:'#34d399', successSoft:'rgba(52,211,153,0.12)',
        warning:'#fbbf24', warningSoft:'rgba(251,191,36,0.12)',
        info:'#60a5fa', infoSoft:'rgba(96,165,250,0.12)',
        orange:'#fb923c', orangeSoft:'rgba(251,146,60,0.12)',
        shadow:'0 8px 32px rgba(0,0,0,0.4)', shadowSoft:'0 2px 12px rgba(0,0,0,0.25)',
        inputBg:'rgba(255,255,255,0.05)', inputBorder:'rgba(148,163,184,0.15)',
        tableHead:'rgba(255,255,255,0.03)', rowHover:'rgba(255,255,255,0.03)',
        divider:'rgba(148,163,184,0.08)', overlay:'rgba(2,8,23,0.78)',
    };
    return {
        panelSolid:'#ffffff', panelSoft:'#f8fafc', panelSofter:'#f1f5f9',
        border:'rgba(15,23,42,0.08)', borderStrong:'rgba(15,23,42,0.15)', borderFocus:'rgba(124,58,237,0.4)',
        text:'#0f172a', textSoft:'#475569', textMute:'#94a3b8',
        primary:'#7c3aed', primarySoft:'#f3e8ff', primaryHover:'#6d28d9',
        danger:'#ef4444', dangerSoft:'#fef2f2',
        success:'#059669', successSoft:'#f0fdf4',
        warning:'#d97706', warningSoft:'#fffbeb',
        info:'#2563eb', infoSoft:'#eff6ff',
        orange:'#ea580c', orangeSoft:'#fff7ed',
        shadow:'0 8px 32px rgba(15,23,42,0.1)', shadowSoft:'0 2px 8px rgba(15,23,42,0.06)',
        inputBg:'#f8fafc', inputBorder:'#e2e8f0',
        tableHead:'#f8fafc', rowHover:'#fafbff',
        divider:'rgba(15,23,42,0.06)', overlay:'rgba(15,23,42,0.45)',
    };
}

/* ── Constants ── */
const PAY_CYCLE_OPTIONS = [
    { value:'monthly',      labelKey:'hrPolicy.salary.monthly',      label:'Monthly',      hint:'12× / year', descKey:'hrPolicy.salary.onceAMonth',  desc:'Once a month',  emoji:'📅' },
    { value:'semi_monthly', labelKey:'hrPolicy.salary.semiMonthly',  label:'Semi-Monthly', hint:'24× / year', descKey:'hrPolicy.salary.twiceAMonth', desc:'Twice a month', emoji:'📆' },
    { value:'ten_day',      labelKey:'hrPolicy.salary.tenDay',       label:'10-Day',       hint:'36× / year', descKey:'hrPolicy.salary.everyTenDays', desc:'Every 10 days', emoji:'🗓️' },
];
const MONTHS = [
    {value:1,label:'January',labelKey:'hrPolicy.months.January'},{value:2,label:'February',labelKey:'hrPolicy.months.February'},{value:3,label:'March',labelKey:'hrPolicy.months.March'},
    {value:4,label:'April',labelKey:'hrPolicy.months.April'},{value:5,label:'May',labelKey:'hrPolicy.months.May'},{value:6,label:'June',labelKey:'hrPolicy.months.June'},
    {value:7,label:'July',labelKey:'hrPolicy.months.July'},{value:8,label:'August',labelKey:'hrPolicy.months.August'},{value:9,label:'September',labelKey:'hrPolicy.months.September'},
    {value:10,label:'October',labelKey:'hrPolicy.months.October'},{value:11,label:'November',labelKey:'hrPolicy.months.November'},{value:12,label:'December',labelKey:'hrPolicy.months.December'},
];
const FREQ_OPTIONS = [
    {value:'monthly',  labelKey:'hrPolicy.salary.monthly',              label:'Monthly',   hintKey:'hrPolicy.salary.everyMonth',       hint:'Every month',    emoji:'📅'},
    {value:'quarterly',labelKey:'hrPolicy.bonus.frequency.quarterly',   label:'Quarterly', hintKey:'hrPolicy.salary.everyThreeMonths', hint:'Every 3 months', emoji:'📊'},
    {value:'yearly',   labelKey:'hrPolicy.bonus.frequency.yearly',      label:'Yearly',    hintKey:'hrPolicy.salary.onceAYear',        hint:'Once a year',    emoji:'🗓️'},
    {value:'once',     labelKey:'hrPolicy.bonus.frequency.once',        label:'One-Time',  hintKey:'hrPolicy.salary.specialBonus',     hint:'Special bonus',  emoji:'💫'},
];

/* ── Utilities ── */
function to12h(t) {
    if (!t) return '—';
    const [hStr, mStr] = t.substring(0,5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    return `${h%12===0?12:h%12}:${m} ${h>=12?'PM':'AM'}`;
}
const formatRate = v => { const n=parseFloat(v); return n%1===0?n.toLocaleString():n.toFixed(2); };

/* ── Portal — renders children into document.body, bypasses ALL CSS containment ── */
function Portal({ children }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return createPortal(children, document.body);
}

/* ── PremiumSelect ── */
function PremiumSelect({ options=[], value='', onChange, placeholder='Select...', T, dark, disabled=false, zIndex=300, tr }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const sel = options.find(o => String(o.value)===String(value) && !o.disabled);
    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div ref={ref} style={{position:'relative',zIndex}}>
            <button type="button" onClick={()=>!disabled&&setOpen(v=>!v)}
                style={{width:'100%',height:48,padding:'0 16px',borderRadius:14,border:`1.5px solid ${open?T.primary:T.inputBorder}`,background:T.inputBg,color:sel?T.text:T.textMute,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,cursor:disabled?'not-allowed':'pointer',boxShadow:open?`0 0 0 3px ${T.primarySoft}`:T.shadowSoft,backdropFilter:'blur(12px)',transition:'all 0.18s',outline:'none',opacity:disabled?0.6:1}}>
                <span style={{fontSize:13,fontWeight:sel?700:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sel ? (sel.labelKey && tr ? makeTrText(tr)(sel.labelKey, sel.label) : sel.label) : placeholder}</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{transform:open?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.18s',flexShrink:0}}>
                    <path d="M4 6L8 10L12 6" stroke={T.textMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            {open && (
                <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,zIndex:zIndex+50,background:dark?T.panelSolid:'#fff',border:`1.5px solid ${T.borderStrong}`,borderRadius:16,overflow:'auto',boxShadow:T.shadow,backdropFilter:'blur(16px)',maxHeight:240}}>
                    {options.map((opt,i) => {
                        const isSel=String(opt.value)===String(value);
                        const isD=!!opt.disabled;
                        return (
                            <button key={opt.value||i} type="button"
                                onClick={()=>{if(isD)return;onChange(opt.value);setOpen(false);}}
                                style={{width:'100%',minHeight:46,padding:'0 16px',border:'none',borderBottom:i<options.length-1?`1px solid ${T.divider}`:'none',background:isSel?(dark?'rgba(37,99,235,0.22)':'#2563eb'):'transparent',color:isSel?'#fff':T.textSoft,opacity:isD?0.4:1,display:'flex',alignItems:'center',gap:8,cursor:isD?'not-allowed':'pointer',transition:'all 0.15s',fontSize:13,fontWeight:isSel?800:600}}
                                onMouseEnter={e=>{if(!isSel&&!isD)e.currentTarget.style.background=dark?'rgba(255,255,255,0.04)':'#f8fafc';}}
                                onMouseLeave={e=>{if(!isSel&&!isD)e.currentTarget.style.background='transparent';}}>
                                <span style={{width:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    {isSel&&<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                                </span>
                                {opt.labelKey && tr ? makeTrText(tr)(opt.labelKey, opt.label) : opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── PremiumTimePicker ─────────────────────────────────────────
   Dropdown rendered via Portal → document.body so it escapes ALL
   CSS stacking contexts (overflow:hidden, transform, will-change).
   Position computed from trigger's getBoundingClientRect.
   ─────────────────────────────────────────────────────────── */
function PremiumTimePicker({ value, onChange, T, dark, error, tr }) {
    const [open, setOpen] = useState(false);
    const [dropPos, setDropPos] = useState({ top:0, left:0, width:280 });
    const triggerRef = useRef(null);
    const dropRef    = useRef(null);

    const parts = (value||'08:00').split(':');
    const hh = parseInt(parts[0]||0);
    const mm = parseInt(parts[1]||0);
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;

    /* Close on outside click — must check both trigger and portal dropdown */
    useEffect(() => {
        if (!open) return;
        const fn = e => {
            if (triggerRef.current && triggerRef.current.contains(e.target)) return;
            if (dropRef.current   && dropRef.current.contains(e.target))    return;
            setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [open]);

    /* Recompute position whenever opened */
    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const dropH = 310;
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow >= dropH ? rect.bottom + 6 : rect.top - dropH - 6;
            setDropPos({ top, left: rect.left, width: Math.max(rect.width, 280) });
        }
    }, [open]);

    const setHour12 = h12v => {
        let h24 = h12v % 12;
        if (period === 'PM') h24 += 12;
        onChange(`${String(h24).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    };
    const setMinute = mv => {
        onChange(`${String(hh).padStart(2,'0')}:${String(mv).padStart(2,'0')}`);
    };
    const togglePeriod = () => {
        let newH = period === 'AM' ? hh + 12 : hh - 12;
        newH = Math.max(0, Math.min(23, newH));
        onChange(`${String(newH).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    };

    const hours12 = [12,1,2,3,4,5,6,7,8,9,10,11];
    // Full 0–59 minutes
    const minutes = Array.from({length:60},(_,i)=>i);
    const displayVal = value ? `${String(h12).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${period}` : (tr ? tr('common.selectTime') : 'Select time...');

    return (
        <div ref={triggerRef} style={{position:'relative'}}>
            <button type="button" onClick={()=>setOpen(v=>!v)} style={{
                width:'100%', height:40, padding:'0 12px', borderRadius:10,
                border:`1.5px solid ${error?T.danger:open?T.primary:T.inputBorder}`,
                background:T.inputBg, color:value?T.text:T.textMute,
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                cursor:'pointer', outline:'none', transition:'all 0.15s',
                boxShadow:open?`0 0 0 3px ${T.primarySoft}`:'none', fontFamily:'inherit',
            }}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:13}}>🕐</span>
                    <span style={{fontSize:12,fontWeight:value?700:400}}>{displayVal}</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{transform:open?'rotate(180deg)':'rotate(0)',transition:'transform 0.18s',flexShrink:0}}>
                    <path d="M4 6L8 10L12 6" stroke={T.textMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            {open && (
                <Portal>
                    <div ref={dropRef} style={{
                        position:'fixed',
                        top: dropPos.top,
                        left: dropPos.left,
                        width: Math.max(dropPos.width, 300),
                        zIndex: 999999,
                        background: dark ? '#0f1729' : '#fff',
                        border: `1.5px solid ${T.borderStrong}`,
                        borderRadius: 14,
                        boxShadow: T.shadow,
                        padding: '12px 12px 10px',
                    }}>
                        {/* Header: current time display + AM/PM */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                            <div style={{fontSize:9,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.1em'}}>{tr ? makeTrText(tr)('common.selectTime', 'Select Time') : 'Select Time'}</div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{fontSize:16,fontWeight:900,color:T.primary,fontFamily:'monospace',letterSpacing:'-0.02em'}}>
                                    {String(h12).padStart(2,'0')}:{String(mm).padStart(2,'0')}
                                    <span style={{fontSize:11,marginLeft:4}}>{period}</span>
                                </div>
                                <div style={{display:'flex',gap:3}}>
                                    {['AM','PM'].map(p=>{
                                        const isSel=p===period;
                                        return <button key={p} type="button" onClick={()=>{if(p!==period)togglePeriod();}} style={{padding:'3px 9px',borderRadius:6,border:`1px solid ${isSel?T.primary:T.border}`,background:isSel?T.primary:'transparent',color:isSel?'#fff':T.textSoft,fontSize:11,fontWeight:800,cursor:'pointer',transition:'all 0.12s'}}>{p}</button>;
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Hour */}
                        <div style={{marginBottom:8}}>
                            <div style={{fontSize:9,fontWeight:700,color:T.textMute,marginBottom:4,letterSpacing:'0.06em',textTransform:'uppercase'}}>{tr ? makeTrText(tr)('common.hour', 'Hour') : 'Hour'}</div>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:3}}>
                                {hours12.map(h=>{
                                    const isSel=h===h12;
                                    return <button key={h} type="button" onClick={()=>setHour12(h)} style={{height:26,borderRadius:6,border:`1px solid ${isSel?T.primary:T.border}`,background:isSel?T.primary:'transparent',color:isSel?'#fff':T.textSoft,fontSize:11,fontWeight:isSel?800:500,cursor:'pointer',transition:'all 0.1s'}}>{String(h).padStart(2,'0')}</button>;
                                })}
                            </div>
                        </div>

                        {/* Minute — 0-59, scrollable */}
                        <div style={{marginBottom:10}}>
                            <div style={{fontSize:9,fontWeight:700,color:T.textMute,marginBottom:4,letterSpacing:'0.06em',textTransform:'uppercase'}}>{tr ? makeTrText(tr)('common.minute', 'Minute') : 'Minute'}</div>
                            <div style={{
                                display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:3,
                                maxHeight:86, overflowY:'auto',
                                scrollbarWidth:'thin',
                                scrollbarColor:`${T.primary}44 transparent`,
                            }}>
                                {minutes.map(m=>{
                                    const isSel=m===mm;
                                    return <button key={m} type="button" onClick={()=>setMinute(m)} style={{height:24,borderRadius:5,border:`1px solid ${isSel?T.primary:T.border}`,background:isSel?T.primary:'transparent',color:isSel?'#fff':T.textSoft,fontSize:10,fontWeight:isSel?800:500,cursor:'pointer',transition:'all 0.1s'}}>{String(m).padStart(2,'0')}</button>;
                                })}
                            </div>
                        </div>

                        {/* Confirm */}
                        <button type="button" onClick={()=>setOpen(false)} style={{width:'100%',padding:'7px',borderRadius:8,border:'none',background:T.primary,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>✓ {tr ? makeTrText(tr)('common.confirm', 'Confirm') : 'Confirm'}</button>
                    </div>
                </Portal>
            )}
        </div>
    );
}

/* ── ErrMsg ── */
function ErrMsg({ msg }) {
    if (!msg) return null;
    return (
        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:6,fontSize:11,fontWeight:600,color:'#ef4444'}}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
            {msg}
        </div>
    );
}

/* ── SRSpinner ── */
function SRSpinner() {
    return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{animation:'srSpin 0.7s linear infinite',display:'inline-block'}}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}

/* ── SRToggle ── */
function SRToggle({ label, sublabel, checked, onChange, disabled, T, dark }) {
    return (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderRadius:12,border:`1px solid ${T.border}`,background:T.panelSoft}}>
            <div>
                {label&&<div style={{fontSize:12,fontWeight:700,color:T.textSoft}}>{label}</div>}
                {sublabel&&<div style={{fontSize:10,color:T.textMute,marginTop:2}}>{sublabel}</div>}
            </div>
            <div onClick={()=>!disabled&&onChange(!checked)}
                style={{position:'relative',width:42,height:24,borderRadius:99,background:checked?'#7c3aed':(dark?'rgba(148,163,184,0.2)':'#d1d5db'),flexShrink:0,cursor:disabled?'not-allowed':'pointer',transition:'background 0.2s',opacity:disabled?0.6:1}}>
                <span style={{position:'absolute',top:3,left:checked?21:3,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transition:'left 0.2s'}}/>
            </div>
        </div>
    );
}

/* ── SectionCard ── */
function SectionCard({ emoji, title, badge, children, T }) {
    return (
        <div style={{borderRadius:16,border:`1.5px solid ${T.border}`,background:T.panelSoft}}>
            <div style={{borderRadius:'16px 16px 0 0',display:'flex',alignItems:'center',gap:10,padding:'14px 18px',borderBottom:`1px solid ${T.divider}`,background:T.panelSolid}}>
                <span style={{fontSize:18}}>{emoji}</span>
                <div style={{flex:1,fontSize:13,fontWeight:800,color:T.text}}>{title}</div>
                {badge&&<span style={{fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:99,background:T.infoSoft,color:T.info}}>{badge}</span>}
            </div>
            <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:14}}>{children}</div>
        </div>
    );
}

/* ── ShiftTimeline ── */
function ShiftTimeline({ start, end, T, dark, tr }) {
    const trText = makeTrText(tr);
    const toMin = t => { if(!t)return null; const[h,m]=t.substring(0,5).split(':').map(Number); if(isNaN(h)||isNaN(m))return null; return h*60+m; };
    const sMin=toMin(start)??480, eMin=toMin(end)??1080, tot=1440;
    const ds=(sMin/tot)*100, isN=eMin>sMin;
    const dw=isN?((eMin-sMin)/tot)*100:((tot-sMin+eMin)/tot)*100;
    return (
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <div style={{position:'relative',height:22,width:'100%',overflow:'hidden',borderRadius:99,background:dark?'rgba(255,255,255,0.08)':'#e2e8f0'}}>
                {ds>0&&<div style={{position:'absolute',inset:'0 auto 0 0',width:`${ds}%`,background:dark?'rgba(96,165,250,0.3)':'#bfdbfe'}}/>}
                <div style={{position:'absolute',inset:'0 auto 0 0',marginLeft:`${ds}%`,width:`${Math.min(dw,100)}%`,background:'#fbbf24'}}/>
                {isN&&(100-dw)>0&&<div style={{position:'absolute',inset:'0 auto 0 0',marginLeft:`${ds+dw}%`,width:`${100-dw}%`,background:dark?'rgba(96,165,250,0.3)':'#bfdbfe'}}/>}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:10,color:T.textMute}}>
                <span>00:00</span>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:2,background:'#fbbf24',display:'inline-block'}}/>{tr ? trText('common.day', 'Day') : 'Day'} ({to12h(start)}–{to12h(end)})</span>
                    <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:2,background:dark?'rgba(96,165,250,0.4)':'#bfdbfe',display:'inline-block'}}/>{tr ? trText('common.night', 'Night') : 'Night'} ({tr ? trText('hrPolicy.salary.auto', 'auto') : 'auto'})</span>
                </div>
                <span>24:00</span>
            </div>
        </div>
    );
}

/* ── PayrollPreview ── */
function PayrollPreview({ payCycle, cutoffDay, T, tr }) {
    const trText = makeTrText(tr);
    const d=parseInt(cutoffDay)||25;
    const now=new Date(),y=now.getFullYear(),m=now.getMonth();
    const fmt=date=>date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const lastDay=new Date(y,m+1,0).getDate(),cutoff=Math.min(d,lastDay);
    const prevLastDay=new Date(y,m,0).getDate(),prevCutoff=Math.min(d,prevLastDay);
    let pS,pE;
    if(d>=lastDay){pS=new Date(y,m,1);pE=new Date(y,m,cutoff);}
    else{pS=new Date(y,m-1,prevCutoff+1);pE=new Date(y,m,cutoff);}
    const total=Math.round((pE-pS)/86400000)+1;
    if(payCycle==='semi_monthly'){const mid=Math.floor(total/2);const p1E=new Date(pS.getTime()+(mid-1)*86400000);const p2S=new Date(p1E.getTime()+86400000);
        return <div style={{display:'flex',flexDirection:'column',gap:4}}><div style={{fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.07em'}}>{tr ? makeTrText(tr)('hrPolicy.salary.twoPeriodsMonth', '2 periods / month') : '2 periods / month'}</div><div style={{fontSize:12,fontWeight:700,color:T.primary}}>P1: {fmt(pS)} → {fmt(p1E)}</div><div style={{fontSize:12,fontWeight:700,color:T.primary}}>P2: {fmt(p2S)} → {fmt(pE)}</div></div>;}
    if(payCycle==='ten_day'){const c=Math.floor(total/3);const p1E=new Date(pS.getTime()+(c-1)*86400000);const p2S=new Date(p1E.getTime()+86400000);const p2E=new Date(p2S.getTime()+(c-1)*86400000);const p3S=new Date(p2E.getTime()+86400000);
        return <div style={{display:'flex',flexDirection:'column',gap:4}}><div style={{fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.07em'}}>{tr ? makeTrText(tr)('hrPolicy.salary.threePeriodsMonth', '3 periods / month') : '3 periods / month'}</div><div style={{fontSize:12,fontWeight:700,color:T.primary}}>P1: {fmt(pS)} → {fmt(p1E)}</div><div style={{fontSize:12,fontWeight:700,color:T.primary}}>P2: {fmt(p2S)} → {fmt(p2E)}</div><div style={{fontSize:12,fontWeight:700,color:T.primary}}>P3: {fmt(p3S)} → {fmt(pE)}</div></div>;}
    return <div><div style={{fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{tr ? makeTrText(tr)('hrPolicy.salary.monthly', 'Monthly') : 'Monthly'}</div><div style={{fontSize:12,fontWeight:700,color:T.primary}}>{fmt(pS)} → {fmt(pE)}</div></div>;
}

/* ── SavedCard ── */
function SavedCard({ label, value, sub, T }) {
    return (
        <div style={{padding:'12px 14px',borderRadius:12,border:`1px solid ${T.border}`,background:T.panelSolid}}>
            <div style={{fontSize:9,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5}}>{label}</div>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>{value}</div>
            {sub&&<div style={{fontSize:10,color:T.textMute,marginTop:3}}>{sub}</div>}
        </div>
    );
}

/* ── ConfirmModal — via Portal ── */
function ConfirmModal({ open, onClose, onConfirm, data, isEdit, processing, T, dark, currencies, banks, tr }) {
    const trText = makeTrText(tr);
    if (!open) return null;
    const bank=banks?.find(b=>b.id==data.bank_id);
    const currency=currencies?.find(c=>c.id==data.currency_id);
    const cycle=PAY_CYCLE_OPTIONS.find(o=>o.value===data.pay_cycle);
    const payDates=()=>{
        const d=parseInt(data.payroll_cutoff_day)||25;
        const now=new Date();const y=now.getFullYear();const m=now.getMonth();
        const lastDay=new Date(y,m+1,0).getDate();const cutoff=Math.min(d,lastDay);
        const prevLastDay=new Date(y,m,0).getDate();const prevCutoff=Math.min(d,prevLastDay);
        let pS,pE;if(d>=lastDay){pS=new Date(y,m,1);pE=new Date(y,m,cutoff);}else{pS=new Date(y,m-1,prevCutoff+1);pE=new Date(y,m,cutoff);}
        const total=Math.round((pE-pS)/86400000)+1;
        if(data.pay_cycle==='semi_monthly'){const mid=Math.floor(total/2);const p1E=new Date(pS.getTime()+(mid-1)*86400000);return `${p1E.getDate()} & ${pE.getDate()} ${trText('hrPolicy.salary.ofEachMonth', 'of each month')}`;}
        if(data.pay_cycle==='ten_day'){const c=Math.floor(total/3);const p1E=new Date(pS.getTime()+(c-1)*86400000);const p2E=new Date(pS.getTime()+(c*2-1)*86400000);return `${p1E.getDate()}, ${p2E.getDate()} & ${pE.getDate()} ${trText('hrPolicy.salary.ofEachMonth', 'of each month')}`;}
        return `${pE.getDate()} ${trText('hrPolicy.salary.ofEachMonth', 'of each month')}`;
    };
    const rows=[
        {icon:'📅',label: tr ? tr('hrPolicy.salary.payCycle') : 'Pay Cycle',value: cycle ? (cycle.labelKey && tr ? tr(cycle.labelKey) : cycle.label) : '—'},
        {icon:'⏳',label: tr ? tr('hrPolicy.salary.probation') : 'Probation',value:`${data.probation_days} ${trText('common.days', 'days')}`},
        {icon:'💱',label: tr ? tr('hrPolicy.salary.currency') : 'Currency',value:currency?`${currency.currency_name} (${currency.currency_code})`:'—'},
        {icon:'🏦',label: tr ? tr('hrPolicy.salary.bank') : 'Bank',value:bank?.bank_name??'—'},
        {icon:'🌤️',label: tr ? tr('hrPolicy.salary.dayShift') : 'Day Shift',value:`${to12h(data.day_shift_start)} – ${to12h(data.day_shift_end)}`},
        {icon:'🌙',label: tr ? tr('hrPolicy.salary.nightShift') : 'Night Shift',value:`${to12h(data.day_shift_end)} – ${to12h(data.day_shift_start)} (${trText('hrPolicy.salary.auto', 'auto')})`},
        {icon:'🍽️',label: tr ? tr('hrPolicy.salary.lunchBreak') : 'Lunch Break',value:`${data.lunch_start??'12:00'} – ${data.lunch_end??'13:00'}`},
        {icon:'💼',label: tr ? tr('hrPolicy.salary.workHours') : 'Work Hours',value:`${to12h(data.work_start??'08:00')} – ${to12h(data.work_end??'17:00')}`},
        {icon:'⚡',label: tr ? tr('hrPolicy.salary.otBase') : 'OT Base',value:data.overtime_base==='hourly_rate' ? (tr ? tr('hrPolicy.salary.hourlyRate') : 'Hourly Rate') : (tr ? tr('hrPolicy.salary.dailyRate') : 'Daily Rate')},
        {icon:'⚠️',label: tr ? tr('hrPolicy.salary.lateDeduction') : 'Late Deduction',value:`${data.late_deduction_rate||0} / ${data.late_deduction_unit==='per_minute'?'min':'hr'}`},
        {icon:'⏰',label:trText('hrPolicy.salary.lateWarning', 'Late Warning'),  value: data.late_alert_enabled
            ? `${trText('common.enabled', 'Enabled')} — ≥ ${data.late_alert_threshold} ${trText('hrPolicy.salary.timesPerMonth', 'times/month')}`
            : (tr ? trText('common.disabled', 'Disabled') : 'Disabled')},
        {icon:'📅',label:trText('hrPolicy.salary.absentWarning', 'Absent Warning'), value: data.absent_alert_enabled
            ? `${trText('common.enabled', 'Enabled')} — ≥ ${data.absent_alert_threshold} ${trText('hrPolicy.salary.daysPerMonth', 'days/month')}`
            : (tr ? trText('common.disabled', 'Disabled') : 'Disabled')},
        {icon:'🎁',label:trText('hrPolicy.salary.bonusProbation', 'Bonus (Probation)'),value:data.bonus_during_probation ? trText('hrPolicy.salary.yesPayBonus', 'Yes — pay bonus') : trText('hrPolicy.salary.noSkip', 'No — skip')},
        {icon:'📋',label:trText('hrPolicy.salary.bonusContract', 'Bonus (Contract)'),value:data.bonus_for_contract ? trText('hrPolicy.salary.yesPayBonus', 'Yes — pay bonus') : trText('hrPolicy.salary.noSkip', 'No — skip')},
        {icon:'📆',label:trText('hrPolicy.salary.payDates', 'Pay Dates'),value:payDates()},
    ];
    return (
        <Portal>
            <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                <div onClick={onClose} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:T.overlay,backdropFilter:'blur(10px)'}}/>
                <div style={{position:'relative',width:'100%',maxWidth:520,maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',borderRadius:24,background:T.panelSolid,border:`1px solid ${T.borderStrong}`,boxShadow:T.shadow,animation:'srFade 0.2s ease'}}>
                    <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb)',borderBottom:'1px solid rgba(255,255,255,0.12)',flexShrink:0}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                            <div>
                                <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{isEdit ? `✏️ ${trText('hrPolicy.salary.updateSettings', 'Update Settings?')}` : `💾 ${trText('hrPolicy.salary.saveSettings', 'Save Settings?')}`}</div>
                                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:2}}>{isEdit ? trText('hrPolicy.salary.overwriteSettings', 'This will overwrite existing settings.') : trText('hrPolicy.salary.settingsWillBeSaved', 'Payroll settings will be saved.')}</div>
                            </div>
                            <button onClick={onClose} style={{width:28,height:28,borderRadius:8,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.12)',color:'#fff',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.22)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>×</button>
                        </div>
                    </div>
                    <div className="sr-confirm-scroll" style={{overflowY:'auto',padding:'12px 16px',flex:1,scrollbarWidth:'none',msOverflowStyle:'none'}}>
                        <div style={{fontSize:9,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{trText('hrPolicy.salary.reviewBeforeSaving', 'Review before saving')}</div>
                        <div style={{display:'flex',flexDirection:'column',gap:2}}>
                            {rows.map(r=>(
                                <div key={r.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:8,transition:'background 0.1s'}} onMouseEnter={e=>e.currentTarget.style.background=T.panelSoft} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                    <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:14}}>{r.icon}</span><span style={{fontSize:13,color:T.textSoft}}>{r.label}</span></div>
                                    <span style={{fontSize:13,fontWeight:700,color:T.text}}>{r.value}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{marginTop:14,padding:'12px 14px',borderRadius:12,background:T.warningSoft,border:`1px solid ${dark?'rgba(251,191,36,0.25)':'#fde68a'}`}}>
                            <div style={{fontSize:12,fontWeight:700,color:T.warning}}>⚠️ {trText('hrPolicy.salary.regeneratePayrollWarning', 'This will regenerate payroll period templates and affect future salary calculations.')}</div>
                        </div>
                    </div>
                    <div style={{padding:'16px 24px',borderTop:`1px solid ${T.border}`,display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0}}>
                        <button onClick={onClose} style={{padding:'10px 18px',borderRadius:12,border:`1.5px solid ${T.border}`,background:'transparent',color:T.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=T.panelSoft} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{tr ? trText('common.cancel', 'Cancel') : 'Cancel'}</button>
                        <button onClick={onConfirm} disabled={processing} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 22px',borderRadius:12,border:'none',background:processing?T.textMute:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'#fff',fontSize:13,fontWeight:700,cursor:processing?'not-allowed':'pointer',boxShadow:processing?'none':'0 4px 14px rgba(124,58,237,0.35)',transition:'all 0.15s'}} onMouseEnter={e=>{if(!processing)e.currentTarget.style.opacity='0.9';}} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                            {processing?<><SRSpinner/> {tr ? tr('common.saving') : 'Saving...'}</>:<>{isEdit?`✅ ${tr ? trText('common.update', 'Update') : 'Update'}`:`✅ ${tr ? trText('common.save', 'Save') : 'Save'}`}</>}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

/* ── BankModal — via Portal ── */
function BankModal({ banks, onClose, T, dark, tr }) {
    const trText = makeTrText(tr);
    const [showForm,setShowForm]=useState(false);
    const [editingId,setEditingId]=useState(null);
    const [deleteTarget,setDeleteTarget]=useState(null);
    const [deleting,setDeleting]=useState(false);
    const [bankErrors,setBankErrors]=useState({});
    const {data,setData,post,put,processing,reset}=useForm({bank_name:'',bank_code:'',email:'',is_active:true});
    const validate=()=>{
        const e={};
        if(!data.bank_name.trim()) e.bank_name='Bank name is required.';
        if(!data.email.trim()) e.email='Email is required.';
        else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email='Invalid email address.';
        return e;
    };
    const handleSubmit=e=>{
        e.preventDefault();const errs=validate();if(Object.keys(errs).length>0){setBankErrors(errs);return;}setBankErrors({});
        if(editingId){put(`/payroll/hr-policy/bank/${editingId}`,{preserveScroll:true,onSuccess:()=>{reset();setShowForm(false);setEditingId(null);},onError:e=>{if(e.bank_name)setBankErrors(p=>({...p,bank_name:e.bank_name}));}});}
        else{post('/payroll/hr-policy/bank',{preserveScroll:true,onSuccess:()=>{reset();setShowForm(false);},onError:e=>{if(e.bank_name)setBankErrors(p=>({...p,bank_name:e.bank_name}));}});}
    };
    const handleEdit=bank=>{setBankErrors({});setData({bank_name:bank.bank_name,bank_code:bank.bank_code??'',email:bank.email??'',is_active:bank.is_active});
    setEditingId(bank.id);setShowForm(true);};
    const handleDel=()=>{
        if(!deleteTarget)return;setDeleting(true);
        router.delete(`/payroll/hr-policy/bank/${deleteTarget.id}`,{preserveScroll:true,onSuccess:()=>{setDeleting(false);setDeleteTarget(null);if(editingId===deleteTarget.id){reset();setBankErrors({});setShowForm(false);setEditingId(null);}},onError:()=>{setDeleting(false);setDeleteTarget(null);}});
    };
    const inp=err=>({width:'100%',padding:'10px 14px',borderRadius:12,fontSize:13,fontWeight:500,outline:'none',boxSizing:'border-box',fontFamily:'inherit',transition:'all 0.15s',border:`1.5px solid ${err?T.danger:T.inputBorder}`,background:err?(dark?'rgba(248,113,113,0.08)':'#fef2f2'):T.inputBg,color:T.text});
    return (
        <Portal>
            <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                <div onClick={onClose} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:T.overlay,backdropFilter:'blur(10px)'}}/>
                <div style={{position:'relative',width:'100%',maxWidth:560,borderRadius:24,background:T.panelSolid,border:`1px solid ${T.borderStrong}`,boxShadow:T.shadow,overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'90vh',animation:'srFade 0.2s ease'}}>
                    {deleteTarget&&(
                        <div style={{position:'absolute',inset:0,zIndex:10,background:dark?'rgba(11,19,36,0.92)':'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:24}}>
                            <div style={{textAlign:'center',padding:'0 32px'}}>
                                <div style={{width:52,height:52,borderRadius:16,background:T.dangerSoft,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:22}}>🗑️</div>
                                <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:6}}>{trText('hrPolicy.salary.deleteBank', 'Delete')} "{deleteTarget.bank_name}"?</div>
                                <div style={{fontSize:12,color:T.textMute,marginBottom:20}}>{tr ? tr('common.thisActionCannotBeUndone') : 'This action cannot be undone.'}</div>
                                <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                                    <button onClick={()=>setDeleteTarget(null)} disabled={deleting} style={{padding:'9px 18px',borderRadius:12,border:`1.5px solid ${T.border}`,background:'transparent',color:T.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}}>{tr ? trText('common.cancel', 'Cancel') : 'Cancel'}</button>
                                    <button onClick={handleDel} disabled={deleting} style={{padding:'9px 18px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',fontSize:13,fontWeight:700,cursor:deleting?'not-allowed':'pointer',opacity:deleting?0.6:1,boxShadow:'0 4px 14px rgba(239,68,68,0.35)',display:'flex',alignItems:'center',gap:6}}>
                                        {deleting?<><SRSpinner/> {tr ? tr('common.deleting') : 'Deleting...'}</>:(tr ? trText('common.yesDelete', 'Yes, Delete') : 'Yes, Delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:`1px solid ${T.border}`,background:T.panelSolid,flexShrink:0}}>
                        <div><div style={{fontSize:15,fontWeight:800,color:T.text}}>🏦 {trText('hrPolicy.salary.bankManagement', 'Bank Management')}</div><div style={{fontSize:11,color:T.textMute,marginTop:2}}>{trText('hrPolicy.salary.registerBanks', 'Register banks for salary payment')}</div></div>
                        <button onClick={onClose} style={{width:34,height:34,borderRadius:10,border:`1px solid ${T.border}`,background:T.panelSoft,color:T.textMute,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>×</button>
                    </div>
                    <div style={{overflowY:'auto',padding:'16px 22px',flex:1,display:'flex',flexDirection:'column',gap:12}}>
                        {banks?.length>0?(
                            <div style={{borderRadius:14,overflow:'hidden',border:`1px solid ${T.border}`}}>
                                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                                    <thead><tr style={{background:T.tableHead,borderBottom:`1px solid ${T.divider}`}}>{[trText('hrPolicy.salary.bankName', 'Bank Name'), trText('hrPolicy.salary.code', 'Code'), trText('common.status', 'Status'), trText('common.actions', 'Actions')].map((h,i)=><th key={h} style={{padding:'10px 14px',fontSize:10,fontWeight:800,letterSpacing:'0.07em',textTransform:'uppercase',color:T.textMute,textAlign:i===0?'left':'center'}}>{h}</th>)}</tr></thead>
                                    <tbody>{banks.map((bank,idx)=>(
                                        <tr key={bank.id} style={{borderBottom:idx<banks.length-1?`1px solid ${T.divider}`:'none',transition:'background 0.1s'}} onMouseEnter={e=>e.currentTarget.style.background=T.rowHover} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                            <td style={{padding:'10px 14px',fontWeight:700,color:T.text}}>{bank.bank_name}</td>
                                            <td style={{padding:'10px 14px',textAlign:'center'}}>{bank.bank_code?<span style={{fontFamily:'monospace',fontSize:11,fontWeight:800,padding:'3px 8px',borderRadius:6,background:T.panelSofter,color:T.primary}}>{bank.bank_code}</span>:<span style={{color:T.textMute}}>—</span>}</td>
                                            <td style={{padding:'10px 14px',textAlign:'center'}}><span style={{display:'inline-block',padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:800,background:bank.is_active?T.successSoft:T.panelSoft,color:bank.is_active?T.success:T.textMute}}>{bank.is_active ? (tr ? trText('common.active', 'Active') : 'Active') : (tr ? trText('common.inactive', 'Inactive') : 'Inactive')}</span></td>
                                            <td style={{padding:'10px 14px',textAlign:'center'}}>
                                                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                                                    <button onClick={()=>handleEdit(bank)} style={{width:34,height:34,borderRadius:10,border:`1px solid ${T.border}`,background:T.panelSoft,color:T.textSoft,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.panelSofter;e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.background=T.panelSoft;e.currentTarget.style.transform='translateY(0)';}}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                                                    </button>
                                                    <button onClick={()=>setDeleteTarget(bank)} style={{width:34,height:34,borderRadius:10,border:`1px solid ${T.border}`,background:T.dangerSoft,color:T.danger,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.opacity='0.75';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='1';}}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        ):(
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:14,border:`1.5px dashed ${T.border}`,background:T.panelSoft,padding:'28px 20px',gap:6}}>
                                <div style={{fontSize:24,marginBottom:4}}>🏦</div><div style={{fontSize:13,fontWeight:700,color:T.textSoft}}>{trText('hrPolicy.salary.noBanksRegistered', 'No banks registered yet')}</div>
                            </div>
                        )}
                        {showForm&&(
                            <form onSubmit={handleSubmit} style={{borderRadius:14,border:`1.5px solid ${dark?'rgba(124,58,237,0.25)':'rgba(124,58,237,0.2)'}`,background:dark?'rgba(124,58,237,0.06)':'rgba(124,58,237,0.03)',padding:16,display:'flex',flexDirection:'column',gap:12}}>
                                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                    <div style={{fontSize:13,fontWeight:800,color:T.text}}>{editingId ? `✏️ ${trText('hrPolicy.salary.editBank', 'Edit Bank')}` : `➕ ${trText('hrPolicy.salary.addBank', 'Add Bank')}`}</div>
                                    <button type="button" onClick={()=>{reset();setBankErrors({});setShowForm(false);setEditingId(null);}} style={{width:26,height:26,borderRadius:7,border:`1px solid ${T.border}`,background:T.panelSoft,color:T.textMute,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>✕</button>
                                </div>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                                    <div>
                                        <label style={{fontSize:11,fontWeight:800,color:T.textSoft,display:'block',marginBottom:5,letterSpacing:'0.04em',textTransform:'uppercase'}}>{trText('hrPolicy.salary.bankName', 'Bank Name')} <span style={{color:T.danger}}>*</span></label>
                                        <input type="text" value={data.bank_name} onChange={e=>{setData('bank_name',e.target.value);setBankErrors(p=>({...p,bank_name:''}));}} placeholder="e.g. ABA Bank" disabled={processing} style={inp(!!bankErrors.bank_name)}/>
                                        <ErrMsg msg={bankErrors.bank_name}/>
                                    </div>
                                    <div>
                                        <label style={{fontSize:11,fontWeight:800,color:T.textSoft,display:'block',marginBottom:5,letterSpacing:'0.04em',textTransform:'uppercase'}}>{trText('hrPolicy.salary.code', 'Code')} <span style={{color:T.textMute,fontWeight:500,textTransform:'none'}}>({trText('common.optional', 'optional')})</span></label>
                                        <input type="text" value={data.bank_code} onChange={e=>setData('bank_code',e.target.value.toUpperCase())} placeholder="ABA" disabled={processing} style={{...inp(false),fontFamily:'monospace',letterSpacing:'0.08em'}}/>
                                    </div>
                                </div>
                                <div>
                                    <label style={{fontSize:11,fontWeight:800,color:T.textSoft,display:'block',marginBottom:5,letterSpacing:'0.04em',textTransform:'uppercase'}}>
                                        Email <span style={{color:T.danger}}>*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e=>{setData('email',e.target.value);setBankErrors(p=>({...p,email:''}));}}
                                        placeholder="e.g. finance@ababank.com"
                                        disabled={processing}
                                        style={inp(!!bankErrors.email)}
                                    />
                                    {bankErrors.email&&<div style={{fontSize:11,color:T.danger,marginTop:3}}>{bankErrors.email}</div>}
                                </div>
                                <SRToggle label={tr ? trText('common.active', 'Active') : 'Active'} checked={data.is_active} onChange={v=>setData('is_active',v)} T={T} dark={dark}/>
                                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                                    <button type="button" onClick={()=>{reset();setBankErrors({});setShowForm(false);setEditingId(null);}} disabled={processing} style={{padding:'8px 14px',borderRadius:10,border:`1.5px solid ${T.border}`,background:'transparent',color:T.textSoft,fontSize:12,fontWeight:600,cursor:'pointer'}}>{tr ? trText('common.cancel', 'Cancel') : 'Cancel'}</button>
                                    <button type="submit" disabled={processing} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,border:'none',background:processing?T.textMute:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'#fff',fontSize:12,fontWeight:700,cursor:processing?'not-allowed':'pointer',boxShadow:processing?'none':'0 3px 10px rgba(124,58,237,0.3)'}}>
                                        {processing?<><SRSpinner/> {trText('common.saving', 'Saving...')}</>:<>{editingId ? (tr ? trText('common.update', 'Update') : 'Update') : (tr ? tr('hrPolicy.salary.addBank') : 'Add Bank')}</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                    <div style={{padding:'14px 22px',borderTop:`1px solid ${T.border}`,flexShrink:0}}>
                        {!showForm&&<button onClick={()=>{setEditingId(null);reset();setBankErrors({});setShowForm(true);}} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:11,border:`1.5px dashed ${T.primary}`,background:T.primarySoft,color:T.primary,fontSize:12,fontWeight:700,cursor:'pointer',opacity:0.85,transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.85'}>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>{trText('hrPolicy.salary.addBank', 'Add Bank')}
                        </button>}
                    </div>
                </div>
            </div>
        </Portal>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function SalaryRuleSection({ salaryRule, banks, currencies, bonusTypes, bonusSchedules }) {
    const { t: tr } = useTranslation();
    const dark = useTheme();
    const T    = getTheme(dark);
    const trText = makeTrText(tr);

    const isEdit = !!salaryRule;

    const [showConfirm,setShowConfirm]   = useState(false);
    const [showBankModal,setShowBankModal] = useState(false);
    const [formErrors,setFormErrors]     = useState({});
    const formRef    = useRef(null);
    const errorRefs  = useRef({});
    const sfFormRef  = useRef(null);

    const scrollToFirstError = (errs) => {
        const firstKey = Object.keys(errs).find(k => errorRefs.current[k]);
        if (firstKey && errorRefs.current[firstKey]) {
            errorRefs.current[firstKey].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const { data, setData, processing } = useForm(
        salaryRule ? {
            pay_cycle:              salaryRule.pay_cycle             ?? 'monthly',
            probation_days:         salaryRule.probation_days        ?? '',
            bonus_during_probation: salaryRule.bonus_during_probation ?? false,
            bonus_for_contract:     salaryRule.bonus_for_contract    ?? false,
            bank_id:                salaryRule.bank_id               ?? '',
            day_shift_start:        salaryRule.day_shift_start?.substring(0,5) ?? '08:00',
            day_shift_end:          salaryRule.day_shift_end?.substring(0,5)   ?? '18:00',
            lunch_start:            salaryRule.lunch_start?.substring(0,5)     ?? '12:00',
            lunch_end:              salaryRule.lunch_end?.substring(0,5)       ?? '13:00',
            work_start:             salaryRule.work_start?.substring(0,5)      ?? '08:00',
            work_end:               salaryRule.work_end?.substring(0,5)        ?? '17:00',
            overtime_base:          salaryRule.overtime_base          ?? 'hourly_rate',
            late_deduction_unit:    salaryRule.late_deduction_unit    ?? 'per_minute',
            late_deduction_rate:    salaryRule.late_deduction_rate    ?? 0,
            currency_id:            salaryRule.currency_id            ?? '',
            payroll_cutoff_day:     salaryRule.payroll_cutoff_day     ?? 25,
            late_alert_threshold:    salaryRule.late_alert_threshold   ?? 3,
            late_alert_enabled:      salaryRule.late_alert_enabled     ?? true,
            absent_alert_threshold:  salaryRule.absent_alert_threshold ?? 2,
            absent_alert_enabled:    salaryRule.absent_alert_enabled   ?? true,
            period_days:            salaryRule.period_days            ?? {},
        } : {
            pay_cycle:'monthly', probation_days:'',
            bonus_during_probation:false, bonus_for_contract:false,
            bank_id:'',
            day_shift_start:'08:00', day_shift_end:'18:00',
            lunch_start:'12:00', lunch_end:'13:00',
            work_start:'08:00', work_end:'17:00',
            overtime_base:'hourly_rate', late_deduction_unit:'per_minute',
            late_deduction_rate:0, currency_id:'', payroll_cutoff_day:25, period_days:{},
            late_alert_threshold:   3,
            late_alert_enabled:     true,
            absent_alert_threshold: 2,
            absent_alert_enabled:   true,
        }
    );

    const defSF={bonus_type_id:'',frequency:'yearly',pay_month:'',pay_quarter:'',notes:'',is_active:true};
    const [showSF,setShowSF]=useState(false);
    const [editingSFId,setEditingSFId]=useState(null);
    const [deleteSFTarget,setDeleteSFTarget]=useState(null);
    const [deletingSF,setDeletingSF]=useState(false);
    const [sfErrors,setSFErrors]=useState({});
    const {data:sf,setData:setSF,post:storeSF,put:updateSF,processing:sfProc,reset:resetSF}=useForm(defSF);

    const validate=()=>{
        const errs={};
        if(!data.probation_days&&data.probation_days!==0) errs.probation_days=trText('common.required', 'Required.');
        if(!data.currency_id)           errs.currency_id=trText('hrPolicy.salary.payrollCurrencyRequired', 'Payroll currency is required.');
        if(!data.bank_id)               errs.bank_id=trText('hrPolicy.salary.bankPaymentRequired', 'Bank payment is required.');
        if(!data.day_shift_start)       errs.day_shift_start=trText('hrPolicy.salary.dayShiftStartRequired', 'Day shift start is required.');
        if(!data.day_shift_end)         errs.day_shift_end=trText('hrPolicy.salary.dayShiftEndRequired', 'Day shift end is required.');
        if(data.day_shift_start&&data.day_shift_end&&data.day_shift_start===data.day_shift_end)
            errs.day_shift_end=trText('hrPolicy.salary.startEndSameTime', 'Start and end cannot be the same time.');
        return errs;
    };

    const handleSaveClick=e=>{
        e.preventDefault();
        const errs=validate();
        if(Object.keys(errs).length>0){setFormErrors(errs);setTimeout(()=>scrollToFirstError(errs),60);return;}
        setFormErrors({});setShowConfirm(true);
    };

    const handleConfirmedSave=()=>{
        setShowConfirm(false);
        const d=parseInt(data.payroll_cutoff_day)||25;
        const now=new Date();const y=now.getFullYear();const m=now.getMonth();
        const lastDay=new Date(y,m+1,0).getDate();const cutoff=Math.min(d,lastDay);
        const prevLastDay=new Date(y,m,0).getDate();const prevCutoff=Math.min(d,prevLastDay);
        let pS,pE;
        if(d>=lastDay){pS=new Date(y,m,1);pE=new Date(y,m,cutoff);}
        else{pS=new Date(y,m-1,prevCutoff+1);pE=new Date(y,m,cutoff);}
        const total=Math.round((pE-pS)/86400000)+1;
        let periodDays={};
        if(data.pay_cycle==='semi_monthly'){const mid=Math.floor(total/2);const p1E=new Date(pS.getTime()+(mid-1)*86400000);periodDays={1:p1E.getDate(),2:pE.getDate()};}
        else if(data.pay_cycle==='ten_day'){const c=Math.floor(total/3);const p1E=new Date(pS.getTime()+(c-1)*86400000);const p2E=new Date(pS.getTime()+(c*2-1)*86400000);periodDays={1:p1E.getDate(),2:p2E.getDate(),3:pE.getDate()};}
        else{periodDays={1:pE.getDate()};}
        router.post('/payroll/hr-policy/salary-rule',{...data,period_days:periodDays},{preserveScroll:true});
    };

    const validateSF=()=>{
        const errs={};
        if(!sf.bonus_type_id||sf.bonus_type_id==='') errs.bonus_type_id=trText('hrPolicy.salary.selectBonusType', 'Please select a bonus type.');
        if((sf.frequency==='yearly'||sf.frequency==='once')&&!sf.pay_month) errs.pay_month=trText('hrPolicy.salary.payMonthRequired', 'Pay month is required.');
        if(sf.frequency==='quarterly'&&(!sf.pay_quarter||sf.pay_quarter==='')) errs.pay_quarter=trText('hrPolicy.salary.payQuarterRequired', 'Pay quarter is required.');
        if(!sf.notes?.trim()) errs.notes=trText('hrPolicy.salary.notesRequired', 'Notes is required.');
        return errs;
    };

    const handleSFSubmit=()=>{
        const errs=validateSF();
        if(Object.keys(errs).length>0){
            setSFErrors(errs);
            setTimeout(()=>{
                if(sfFormRef.current){
                    const firstErrEl=sfFormRef.current.querySelector('[data-sf-err="true"]');
                    if(firstErrEl)firstErrEl.scrollIntoView({behavior:'smooth',block:'center'});
                }
            },60);
            return;
        }
        setSFErrors({});
        if(editingSFId){updateSF(`/payroll/hr-policy/bonus-schedule/${editingSFId}`,{preserveScroll:true,onSuccess:()=>{resetSF();setShowSF(false);setEditingSFId(null);},onError:e=>{if(e.bonus_type_id)setSFErrors(p=>({...p,bonus_type_id:e.bonus_type_id}));}});}
        else{storeSF('/payroll/hr-policy/bonus-schedule',{preserveScroll:true,onSuccess:()=>{resetSF();setShowSF(false);},onError:e=>{if(e.bonus_type_id)setSFErrors(p=>({...p,bonus_type_id:e.bonus_type_id}));}});}
    };

    const handleSFEdit=s=>{
        setSFErrors({});
        setSF({bonus_type_id:String(s.bonus_type_id),frequency:s.frequency,pay_month:s.pay_month??'',pay_quarter:s.pay_quarter??'',notes:s.notes??'',is_active:!!s.is_active});
        setEditingSFId(s.id);setShowSF(true);
    };

    const handleSFDeleteConfirm=()=>{
        if(!deleteSFTarget)return;setDeletingSF(true);
        router.delete(`/payroll/hr-policy/bonus-schedule/${deleteSFTarget.id}`,{preserveScroll:true,onSuccess:()=>{setDeletingSF(false);setDeleteSFTarget(null);if(editingSFId===deleteSFTarget.id){resetSF();setSFErrors({});setShowSF(false);setEditingSFId(null);}},onError:()=>{setDeletingSF(false);setDeleteSFTarget(null);}});
    };

    const getWhen=s=>{
        if((s.frequency==='yearly'||s.frequency==='once')&&s.pay_month) return MONTHS.find(m=>m.value==s.pay_month)?.labelKey ? trText(MONTHS.find(m=>m.value==s.pay_month)?.labelKey, MONTHS.find(m=>m.value==s.pay_month)?.label) : (MONTHS.find(m=>m.value==s.pay_month)?.label??'—');
        if(s.frequency==='quarterly'&&s.pay_quarter) return `Q${s.pay_quarter}`;
        if(s.frequency==='monthly') return tr('hrPolicy.salary.everyMonth');
        return '—';
    };

    const inp=(err,extra={})=>({width:'100%',padding:'10px 14px',borderRadius:12,fontSize:13,fontWeight:500,outline:'none',boxSizing:'border-box',fontFamily:'inherit',transition:'all 0.15s',border:`1.5px solid ${err?T.danger:T.inputBorder}`,background:err?(dark?'rgba(248,113,113,0.08)':'#fef2f2'):T.inputBg,color:T.text,...extra});

    const bankOpts=(banks||[]).filter(b=>b.is_active).map(b=>({value:String(b.id),label:b.bank_name+(b.bank_code?` (${b.bank_code})`:'')}));
    const currOpts=(currencies||[]).map(c=>({value:String(c.id),label:`${c.currency_code} – ${c.currency_name}`}));
    const btOpts=[{value:'',label:'Select bonus type...',disabled:true},...(bonusTypes||[]).filter(bt=>bt.is_active).map(bt=>({value:String(bt.id),label:`${bt.name} · ${bt.calculation_type==='percentage'?`${bt.value}%`:Number(bt.value).toLocaleString()}`}))];
    const lbl={fontSize:11,fontWeight:800,color:T.textSoft,display:'block',marginBottom:6,letterSpacing:'0.04em',textTransform:'uppercase'};

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            .sr-wrap * { font-family:'Plus Jakarta Sans',sans-serif; box-sizing:border-box; }
            .sr-row:hover td { background:${T.rowHover}; }
            .sr-inp:focus { border-color:${T.borderFocus}!important; box-shadow:0 0 0 3px ${T.primarySoft}!important; }
            .sr-inp[type=number]::-webkit-outer-spin-button,.sr-inp[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
            .sr-inp[type=number]{-moz-appearance:textfield;}
            @keyframes srSpin{to{transform:rotate(360deg);}}
            @keyframes srFade{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
            .sr-animate{animation:srFade 0.2s ease;}
        `}</style>

        <ConfirmModal open={showConfirm} onClose={()=>setShowConfirm(false)} onConfirm={handleConfirmedSave} data={data} isEdit={isEdit} processing={processing} T={T} dark={dark} currencies={currencies} banks={banks} tr={tr}/>
        {showBankModal&&<BankModal banks={banks} onClose={()=>setShowBankModal(false)} T={T} dark={dark} tr={tr}/>}

        {/* Delete SF modal — via Portal */}
        {deleteSFTarget&&(
            <Portal>
                <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                    <div onClick={()=>!deletingSF&&setDeleteSFTarget(null)} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)'}}/>
                    <div className="sr-animate" style={{position:'relative',background:T.panelSolid,border:`1px solid ${T.border}`,borderRadius:20,width:'100%',maxWidth:400,padding:'28px 28px 24px',boxShadow:T.shadow}}>
                        <div style={{width:52,height:52,borderRadius:16,background:T.dangerSoft,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:24}}>🗑️</div>
                        <div style={{fontSize:16,fontWeight:800,color:T.text,textAlign:'center',marginBottom:8}}>{trText('hrPolicy.bonus.deleteBonusSchedule', 'Delete Bonus Schedule')}</div>
                        <div style={{fontSize:13,fontWeight:700,color:T.text,textAlign:'center',marginBottom:4}}>"{deleteSFTarget.bonus_type?.name}" {trText('hrPolicy.bonus.schedule', 'schedule')}?</div>
                        <div style={{fontSize:11,color:T.textMute,textAlign:'center',marginBottom:24}}>{tr ? tr('common.thisActionCannotBeUndone') : 'This action cannot be undone.'}</div>
                        <div style={{display:'flex',gap:10}}>
                            <button onClick={()=>!deletingSF&&setDeleteSFTarget(null)} disabled={deletingSF} style={{flex:1,padding:'10px',borderRadius:12,border:`1.5px solid ${T.border}`,background:'transparent',color:T.textSoft,fontSize:13,fontWeight:700,cursor:'pointer'}}>{tr ? trText('common.cancel', 'Cancel') : 'Cancel'}</button>
                            <button onClick={handleSFDeleteConfirm} disabled={deletingSF} style={{flex:1,padding:'10px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',fontSize:13,fontWeight:700,cursor:deletingSF?'not-allowed':'pointer',opacity:deletingSF?0.6:1,boxShadow:'0 4px 14px rgba(239,68,68,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                                {deletingSF?<><SRSpinner/> {trText('common.deleting', 'Deleting...')}</>:trText('common.yesDelete', 'Yes, Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            </Portal>
        )}

        <div className="sr-wrap" style={{display:'flex',flexDirection:'column',gap:18}}>
        <form ref={formRef} onSubmit={handleSaveClick} style={{display:'flex',flexDirection:'column',gap:18}}>

            {/* ── 1. Pay Cycle ── */}
            <SectionCard emoji="📅" title={tr('hrPolicy.salary.payCycle')} T={T}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    {PAY_CYCLE_OPTIONS.map(opt=>{
                        const isSel=data.pay_cycle===opt.value;
                        return <label key={opt.value} onClick={()=>setData('pay_cycle',opt.value)}
                            style={{padding:'14px 16px',borderRadius:14,cursor:'pointer',transition:'all 0.15s',border:`1.5px solid ${isSel?T.primary:T.border}`,background:isSel?T.primarySoft:T.panelSolid,display:'flex',flexDirection:'column',gap:5}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:15,height:15,borderRadius:'50%',border:`2px solid ${isSel?T.primary:T.textMute}`,background:isSel?T.primary:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                                    {isSel&&<div style={{width:5,height:5,borderRadius:'50%',background:'#fff'}}/>}
                                </div>
                                <span style={{fontSize:13,fontWeight:700,color:isSel?T.primary:T.text}}>{opt.emoji} {opt.labelKey && tr ? makeTrText(tr)(opt.labelKey, opt.label) : opt.label}</span>
                                <span style={{marginLeft:'auto',fontSize:10,fontWeight:800,color:isSel?T.primary:T.textMute,padding:'2px 8px',borderRadius:99,background:isSel?(dark?'rgba(124,58,237,0.2)':'rgba(124,58,237,0.08)'):T.panelSoft}}>{opt.hint}</span>
                            </div>
                            <div style={{fontSize:11,color:T.textMute,paddingLeft:23}}>{opt.descKey ? trText(opt.descKey, opt.desc) : opt.desc}</div>
                        </label>;
                    })}
                </div>
            </SectionCard>

            {/* ── 2. General Settings ── */}
            <SectionCard emoji="⚙️" title={trText('hrPolicy.salary.generalSettings', 'General Settings')} T={T}>

                {/* Row 1: Probation | Bonus probation | Bonus contract — 3 column */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14}}>
                    {/* Probation */}
                    <div>
                        <label style={lbl}>{trText('hrPolicy.salary.probationPeriod', 'Probation Period')} <span style={{color:T.danger}}>*</span></label>
                        <div data-error={!!formErrors.probation_days} ref={el=>errorRefs.current.probation_days=el} style={{position:'relative'}}>
                            <input className="sr-inp" type="number" value={data.probation_days} min="0"
                                onKeyDown={e=>{if(['-','e','E'].includes(e.key))e.preventDefault();}}
                                onChange={e=>{setData('probation_days',e.target.value);setFormErrors(p=>({...p,probation_days:''}));}}
                                placeholder="e.g. 90" style={{...inp(!!formErrors.probation_days),paddingRight:44}}/>
                            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:12,color:T.textMute,fontWeight:600,pointerEvents:'none'}}>{trText('common.days', 'days')}</span>
                        </div>
                        <ErrMsg msg={formErrors.probation_days}/>
                    </div>

                    {/* Bonus during probation */}
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <label style={lbl}>{trText('hrPolicy.salary.bonusProbation', 'Bonus / Probation')}</label>
                        <div
                            onClick={()=>setData('bonus_during_probation', !data.bonus_during_probation)}
                            style={{
                                flex:1, padding:'12px 14px', borderRadius:12, cursor:'pointer',
                                border:`1.5px solid ${data.bonus_during_probation ? T.primary : T.border}`,
                                background: data.bonus_during_probation ? T.primarySoft : T.panelSolid,
                                display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                                transition:'all 0.15s',
                            }}
                        >
                            <div style={{minWidth:0}}>
                                <div style={{fontSize:12, fontWeight:700, color: data.bonus_during_probation ? T.primary : T.textSoft}}>
                                    {data.bonus_during_probation ? `✓ ${trText('hrPolicy.salary.payBonus', 'Pay bonus')}` : trText('hrPolicy.salary.skipBonus', 'Skip bonus')}
                                </div>
                                <div style={{fontSize:10, color:T.textMute, marginTop:2, lineHeight:1.4}}>
                                    {trText('hrPolicy.salary.duringProbationPeriod', 'During probation period')}
                                </div>
                            </div>
                            <div style={{
                                position:'relative', width:36, height:20, borderRadius:99, flexShrink:0,
                                background: data.bonus_during_probation ? T.primary : (dark?'rgba(148,163,184,0.2)':'#d1d5db'),
                                transition:'background 0.2s',
                            }}>
                                <span style={{
                                    position:'absolute', top:2,
                                    left: data.bonus_during_probation ? 18 : 2,
                                    width:16, height:16, borderRadius:'50%', background:'#fff',
                                    boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.2s',
                                }}/>
                            </div>
                        </div>
                    </div>

                    {/* Bonus for contract */}
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <label style={lbl}>{trText('hrPolicy.salary.bonusContract', 'Bonus / Contract')}</label>
                        <div
                            onClick={()=>setData('bonus_for_contract', !data.bonus_for_contract)}
                            style={{
                                flex:1, padding:'12px 14px', borderRadius:12, cursor:'pointer',
                                border:`1.5px solid ${data.bonus_for_contract ? T.primary : T.border}`,
                                background: data.bonus_for_contract ? T.primarySoft : T.panelSolid,
                                display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                                transition:'all 0.15s',
                            }}
                        >
                            <div style={{minWidth:0}}>
                                <div style={{fontSize:12, fontWeight:700, color: data.bonus_for_contract ? T.primary : T.textSoft}}>
                                    {data.bonus_for_contract ? `✓ ${trText('hrPolicy.salary.payBonus', 'Pay bonus')}` : trText('hrPolicy.salary.skipBonus', 'Skip bonus')}
                                </div>
                                <div style={{fontSize:10, color:T.textMute, marginTop:2, lineHeight:1.4}}>
                                    {trText('hrPolicy.salary.forContractEmployees', 'For contract employees')}
                                </div>
                            </div>
                            <div style={{
                                position:'relative', width:36, height:20, borderRadius:99, flexShrink:0,
                                background: data.bonus_for_contract ? T.primary : (dark?'rgba(148,163,184,0.2)':'#d1d5db'),
                                transition:'background 0.2s',
                            }}>
                                <span style={{
                                    position:'absolute', top:2,
                                    left: data.bonus_for_contract ? 18 : 2,
                                    width:16, height:16, borderRadius:'50%', background:'#fff',
                                    boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.2s',
                                }}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Currency | Bank — 2 column */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                    <div data-error={!!formErrors.currency_id} ref={el=>errorRefs.current.currency_id=el} style={{position:'relative',zIndex:500}}>
                        <label style={lbl}>{trText('hrPolicy.salary.payrollCurrency', 'Payroll Currency')} <span style={{color:T.danger}}>*</span></label>
                        <PremiumSelect options={currOpts} value={data.currency_id}
                            onChange={v=>{setData('currency_id',v);setFormErrors(p=>({...p,currency_id:''}));}}
                            placeholder="Select currency..." T={T} dark={dark} zIndex={500}/>
                        <ErrMsg msg={formErrors.currency_id}/>
                        {!currencies?.length&&<div style={{marginTop:5,fontSize:11,color:T.warning}}>⚠️ {trText('hrPolicy.salary.noCurrenciesHint', 'No currencies. Add in Currency section first.')}</div>}
                    </div>

                    <div data-error={!!formErrors.bank_id} ref={el=>errorRefs.current.bank_id=el}>
                        <label style={lbl}>{trText('hrPolicy.salary.bankPayment', 'Bank Payment')} <span style={{color:T.danger}}>*</span></label>
                        <div style={{display:'flex',gap:8}}>
                            <div style={{flex:1,position:'relative',zIndex:400}}>
                                <PremiumSelect options={bankOpts} value={data.bank_id}
                                    onChange={v=>{setData('bank_id',v);setFormErrors(p=>({...p,bank_id:''}));}}
                                    placeholder="Select bank..." T={T} dark={dark} zIndex={400}/>
                            </div>
                            <button type="button" onClick={()=>setShowBankModal(true)}
                                style={{flexShrink:0,padding:'0 14px',borderRadius:12,border:`1.5px solid ${T.primary}`,background:T.primarySoft,color:T.primary,fontSize:11,fontWeight:800,cursor:'pointer',whiteSpace:'nowrap',height:48}}>
                                Manage
                            </button>
                        </div>
                        <ErrMsg msg={formErrors.bank_id}/>
                    </div>
                </div>

            </SectionCard>

            {/* ── 3. Shift Hours ── */}
            <SectionCard emoji="🌤️" title={trText('hrPolicy.salary.shiftHours', 'Shift Hours')} badge={trText('hrPolicy.salary.otAutoDetection', 'Used for OT type auto-detection')} T={T}>
                <ShiftTimeline start={data.day_shift_start} end={data.day_shift_end} T={T} dark={dark} tr={tr}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div>
                        <label style={lbl}><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#fbbf24',marginRight:6,verticalAlign:'middle'}}/>{trText('hrPolicy.salary.dayShiftStarts', 'Day shift starts')} <span style={{color:T.danger}}>*</span></label>
                        <div ref={el=>errorRefs.current.day_shift_start=el} data-error={!!formErrors.day_shift_start}>
                            <PremiumTimePicker value={data.day_shift_start} onChange={v=>{setData('day_shift_start',v);setFormErrors(p=>({...p,day_shift_start:''}));}} T={T} dark={dark} error={!!formErrors.day_shift_start}/>
                        </div>
                        <ErrMsg msg={formErrors.day_shift_start}/>
                    </div>
                    <div>
                        <label style={lbl}><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#818cf8',marginRight:6,verticalAlign:'middle'}}/>{trText('hrPolicy.salary.dayShiftEnds', 'Day shift ends')} <span style={{color:T.danger}}>*</span></label>
                        <PremiumTimePicker value={data.day_shift_end} onChange={v=>{setData('day_shift_end',v);setFormErrors(p=>({...p,day_shift_end:''}));}} T={T} dark={dark} error={!!formErrors.day_shift_end}/>
                        <ErrMsg msg={formErrors.day_shift_end}/>
                    </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:12,background:T.infoSoft,border:`1px solid ${dark?'rgba(96,165,250,0.2)':'#bfdbfe'}`}}>
                    <span style={{fontSize:16,flexShrink:0}}>🌙</span>
                    <div style={{fontSize:12,color:T.info,fontWeight:600}}>{trText('hrPolicy.salary.nightShiftAutoPrefix', 'Night shift is automatically')} <strong>{to12h(data.day_shift_end)} → {to12h(data.day_shift_start)}</strong> ({trText('hrPolicy.salary.outsideDayShift', 'everything outside day shift')})</div>
                </div>
            </SectionCard>

            {/* ── 4. Lunch Break ── */}
            <SectionCard emoji="🍽️" title={tr('hrPolicy.salary.lunchBreak')} T={T}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div>
                        <label style={lbl}><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#fbbf24',marginRight:6,verticalAlign:'middle'}}/>{trText('hrPolicy.salary.lunchStarts', 'Lunch starts')}</label>
                        <PremiumTimePicker value={data.lunch_start??'12:00'} onChange={v=>setData('lunch_start',v)} T={T} dark={dark}/>
                    </div>
                    <div>
                        <label style={lbl}><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#f97316',marginRight:6,verticalAlign:'middle'}}/>{trText('hrPolicy.salary.lunchEnds', 'Lunch ends')}</label>
                        <PremiumTimePicker value={data.lunch_end??'13:00'} onChange={v=>setData('lunch_end',v)} T={T} dark={dark}/>
                    </div>
                </div>
                <div style={{padding:'10px 14px',borderRadius:12,background:T.warningSoft,border:`1px solid ${dark?'rgba(251,191,36,0.2)':'#fde68a'}`,fontSize:12,color:T.warning,fontWeight:600}}>
                    ⚠️ {trText('hrPolicy.salary.lunchAutoDeductWarning', 'Work hours will auto-deduct lunch if check-in/out overlaps this period.')}
                </div>
            </SectionCard>

            {/* ── 5. Work Hours ── */}
            <SectionCard emoji="💼" title={tr('hrPolicy.salary.workHours')} T={T}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div>
                        <label style={lbl}><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#34d399',marginRight:6,verticalAlign:'middle'}}/>{trText('hrPolicy.salary.workStarts', 'Work starts')}</label>
                        <PremiumTimePicker value={data.work_start??'08:00'} onChange={v=>setData('work_start',v)} T={T} dark={dark}/>
                    </div>
                    <div>
                        <label style={lbl}><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#059669',marginRight:6,verticalAlign:'middle'}}/>{trText('hrPolicy.salary.workEnds', 'Work ends')}</label>
                        <PremiumTimePicker value={data.work_end??'17:00'} onChange={v=>setData('work_end',v)} T={T} dark={dark}/>
                    </div>
                </div>
            </SectionCard>

            <SectionCard emoji="⚠️" title={trText('hrPolicy.salary.attendanceWarning', 'Attendance Warning')} T={T}>

                {/* Late Warning */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                    <div>
                        <label style={lbl}>
                            <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#f59e0b',marginRight:6,verticalAlign:'middle'}}/>
                            {trText('hrPolicy.salary.lateWarningThreshold', 'Late Warning Threshold')}
                            <span style={{color:T.textMute,fontWeight:500,textTransform:'none',fontSize:9,marginLeft:4}}>({trText('hrPolicy.salary.timesPerMonth', 'times/month')})</span>
                        </label>
                        <div ref={el=>errorRefs.current.late_alert_threshold=el} style={{position:'relative'}}>
                            <input
                                className="sr-inp"
                                type="number"
                                value={data.late_alert_threshold}
                                min="1" max="31"
                                disabled={!data.late_alert_enabled}
                                onKeyDown={e=>{if(['-','e','E','.'].includes(e.key))e.preventDefault();}}
                                onChange={e=>setData('late_alert_threshold', e.target.value)}
                                placeholder="e.g. 3"
                                style={{
                                    ...inp(false),
                                    paddingRight:52,
                                    opacity: data.late_alert_enabled ? 1 : 0.45,
                                }}
                            />
                            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:12,color:T.textMute,fontWeight:600,pointerEvents:'none'}}>{trText('common.times', 'times')}</span>
                        </div>
                        <div style={{fontSize:10,color:T.textMute,marginTop:4}}>
                            {trText('hrPolicy.salary.lateWarningHint', 'Warning fires when late ≥ threshold times in a month.')}
                        </div>
                    </div>

                    {/* Late active/inactive toggle */}
                    <div style={{display:'flex',flexDirection:'column'}}>
                        <label style={lbl}>{trText('hrPolicy.salary.lateWarning', 'Late Warning')}</label>
                        <div
                            onClick={()=>setData('late_alert_enabled', !data.late_alert_enabled)}
                            style={{
                                flex:1, padding:'12px 14px', borderRadius:12, cursor:'pointer',
                                border:`1.5px solid ${data.late_alert_enabled ? '#f59e0b' : T.border}`,
                                background: data.late_alert_enabled
                                    ? (dark ? 'rgba(245,158,11,0.12)' : '#fffbeb')
                                    : T.panelSolid,
                                display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                                transition:'all 0.15s',
                            }}
                        >
                            <div style={{minWidth:0}}>
                                <div style={{fontSize:12, fontWeight:700, color: data.late_alert_enabled ? '#d97706' : T.textMute}}>
                                    {data.late_alert_enabled ? `✓ ${trText('common.active', 'Active')}` : trText('common.inactive', 'Inactive')}
                                </div>
                                <div style={{fontSize:10, color:T.textMute, marginTop:2, lineHeight:1.4}}>
                                    {data.late_alert_enabled ? trText('hrPolicy.salary.lateWarningEnabled', 'Late warning is enabled') : trText('hrPolicy.salary.lateWarningDisabled', 'Late warning is disabled')}
                                </div>
                            </div>
                            <div style={{
                                position:'relative', width:36, height:20, borderRadius:99, flexShrink:0,
                                background: data.late_alert_enabled ? '#f59e0b' : (dark?'rgba(148,163,184,0.2)':'#d1d5db'),
                                transition:'background 0.2s',
                            }}>
                                <span style={{
                                    position:'absolute', top:2,
                                    left: data.late_alert_enabled ? 18 : 2,
                                    width:16, height:16, borderRadius:'50%', background:'#fff',
                                    boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.2s',
                                }}/>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{height:1, background:T.divider}}/>

                {/* Absent Warning */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                    <div>
                        <label style={lbl}>
                            <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#ef4444',marginRight:6,verticalAlign:'middle'}}/>
                            {trText('hrPolicy.salary.absentWarningThreshold', 'Absent Warning Threshold')}
                            <span style={{color:T.textMute,fontWeight:500,textTransform:'none',fontSize:9,marginLeft:4}}>({trText('hrPolicy.salary.daysPerMonth', 'days/month')})</span>
                        </label>
                        <div ref={el=>errorRefs.current.absent_alert_threshold=el} style={{position:'relative'}}>
                            <input
                                className="sr-inp"
                                type="number"
                                value={data.absent_alert_threshold}
                                min="1" max="31"
                                disabled={!data.absent_alert_enabled}
                                onKeyDown={e=>{if(['-','e','E','.'].includes(e.key))e.preventDefault();}}
                                onChange={e=>setData('absent_alert_threshold', e.target.value)}
                                placeholder="e.g. 2"
                                style={{
                                    ...inp(false),
                                    paddingRight:36,
                                    opacity: data.absent_alert_enabled ? 1 : 0.45,
                                }}
                            />
                            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:12,color:T.textMute,fontWeight:600,pointerEvents:'none'}}>{trText('common.days', 'days')}</span>
                        </div>
                        <div style={{fontSize:10,color:T.textMute,marginTop:4}}>
                            {trText('hrPolicy.salary.absentWarningHint', 'Warning fires when absent ≥ threshold days in a month.')}
                        </div>
                    </div>

                    {/* Absent active/inactive toggle */}
                    <div style={{display:'flex',flexDirection:'column'}}>
                        <label style={lbl}>{trText('hrPolicy.salary.absentWarning', 'Absent Warning')}</label>
                        <div
                            onClick={()=>setData('absent_alert_enabled', !data.absent_alert_enabled)}
                            style={{
                                flex:1, padding:'12px 14px', borderRadius:12, cursor:'pointer',
                                border:`1.5px solid ${data.absent_alert_enabled ? '#ef4444' : T.border}`,
                                background: data.absent_alert_enabled
                                    ? (dark ? 'rgba(239,68,68,0.10)' : '#fef2f2')
                                    : T.panelSolid,
                                display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                                transition:'all 0.15s',
                            }}
                        >
                            <div style={{minWidth:0}}>
                                <div style={{fontSize:12, fontWeight:700, color: data.absent_alert_enabled ? '#dc2626' : T.textMute}}>
                                    {data.absent_alert_enabled ? `✓ ${trText('common.active', 'Active')}` : trText('common.inactive', 'Inactive')}
                                </div>
                                <div style={{fontSize:10, color:T.textMute, marginTop:2, lineHeight:1.4}}>
                                    {data.absent_alert_enabled ? trText('hrPolicy.salary.absentWarningEnabled', 'Absent warning is enabled') : trText('hrPolicy.salary.absentWarningDisabled', 'Absent warning is disabled')}
                                </div>
                            </div>
                            <div style={{
                                position:'relative', width:36, height:20, borderRadius:99, flexShrink:0,
                                background: data.absent_alert_enabled ? '#ef4444' : (dark?'rgba(148,163,184,0.2)':'#d1d5db'),
                                transition:'background 0.2s',
                            }}>
                                <span style={{
                                    position:'absolute', top:2,
                                    left: data.absent_alert_enabled ? 18 : 2,
                                    width:16, height:16, borderRadius:'50%', background:'#fff',
                                    boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.2s',
                                }}/>
                            </div>
                        </div>
                    </div>
                </div>

            </SectionCard>
            {/* ── 6. OT & Late ── */}
            <SectionCard emoji="⏰" title={trText('hrPolicy.salary.overtimeLateDeduction', 'Overtime & Late Deduction')} T={T}>
                <div>
                    <label style={lbl}>{trText('hrPolicy.salary.otCalculationBase', 'OT Calculation Base')}</label>
                    <div style={{display:'flex',gap:10,marginTop:6}}>
                        {[{value:'hourly_rate',label:tr('hrPolicy.salary.hourlyRate'),hintKey:'hrPolicy.salary.dailyWorkingHours',hint:'Daily ÷ working hrs',icon:'⏱️'},{value:'daily_rate',label:tr('hrPolicy.salary.dailyRate'),hintKey:'hrPolicy.salary.monthlyWorkingDays',hint:'Monthly ÷ working days',icon:'📅'}].map(opt=>{
                            const isSel=data.overtime_base===opt.value;
                            return <label key={opt.value} onClick={()=>setData('overtime_base',opt.value)} style={{flex:1,padding:'12px 16px',borderRadius:13,cursor:'pointer',transition:'all 0.15s',border:`1.5px solid ${isSel?T.primary:T.border}`,background:isSel?T.primarySoft:T.panelSolid}}>
                                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                                    <div style={{width:15,height:15,borderRadius:'50%',border:`2px solid ${isSel?T.primary:T.textMute}`,background:isSel?T.primary:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                                        {isSel&&<div style={{width:5,height:5,borderRadius:'50%',background:'#fff'}}/>}
                                    </div>
                                    <span style={{fontSize:13,fontWeight:700,color:isSel?T.primary:T.text}}>{opt.icon} {opt.labelKey && tr ? makeTrText(tr)(opt.labelKey, opt.label) : opt.label}</span>
                                </div>
                                <div style={{fontSize:11,color:T.textMute,paddingLeft:23}}>{opt.hintKey ? trText(opt.hintKey, opt.hint) : opt.hint}</div>
                            </label>;
                        })}
                    </div>
                </div>
                <div style={{height:1,background:T.divider}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div>
                        <label style={lbl}>{trText('hrPolicy.salary.lateDeductionUnit', 'Late Deduction Unit')}</label>
                        <div style={{display:'flex',gap:8,marginTop:6}}>
                            {[{value:'per_minute',labelKey:'hrPolicy.salary.perMinute',label:'Per Minute',hintKey:'hrPolicy.salary.rateMinutes',hint:'Rate × minutes'},{value:'per_hour',labelKey:'hrPolicy.salary.perHour',label:'Per Hour',hintKey:'hrPolicy.salary.rateHours',hint:'Rate × hours'}].map(opt=>{
                                const isSel=data.late_deduction_unit===opt.value;
                                return <label key={opt.value} onClick={()=>setData('late_deduction_unit',opt.value)} style={{flex:1,padding:'10px 12px',borderRadius:12,cursor:'pointer',transition:'all 0.15s',border:`1.5px solid ${isSel?T.primary:T.border}`,background:isSel?T.primarySoft:T.panelSolid}}>
                                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                                        <div style={{width:13,height:13,borderRadius:'50%',border:`2px solid ${isSel?T.primary:T.textMute}`,background:isSel?T.primary:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                                            {isSel&&<div style={{width:4,height:4,borderRadius:'50%',background:'#fff'}}/>}
                                        </div>
                                        <span style={{fontSize:12,fontWeight:700,color:isSel?T.primary:T.textSoft}}>{opt.labelKey && tr ? makeTrText(tr)(opt.labelKey, opt.label) : opt.label}</span>
                                    </div>
                                    <div style={{fontSize:10,color:T.textMute,paddingLeft:19}}>{opt.hintKey ? trText(opt.hintKey, opt.hint) : opt.hint}</div>
                                </label>;
                            })}
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>{trText('hrPolicy.salary.deductionRate', 'Deduction Rate')} <span style={{color:T.textMute,fontWeight:500,textTransform:'none'}}>({trText('hrPolicy.salary.per', 'per')} {data.late_deduction_unit==='per_minute'?trText('common.min', 'min'):trText('common.hr', 'hr')} · {trText('hrPolicy.salary.defaultZero', 'default 0')})</span></label>
                        <div style={{position:'relative',marginTop:6}}>
                            <input className="sr-inp" type="number" value={data.late_deduction_rate} min="0" step="0.01" onChange={e=>setData('late_deduction_rate',e.target.value)} placeholder="0" style={{...inp(false),paddingRight:36}}/>
                            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:14,fontWeight:700,color:T.textMute,pointerEvents:'none'}}>#</span>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 7. Payroll Cutoff ── */}
            <SectionCard emoji="💰" title={trText('hrPolicy.salary.salaryPaymentDate', 'Salary Payment Date')} T={T}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div>
                        <label style={lbl}>{trText('hrPolicy.salary.paymentDayOfMonth', 'Payment Day of Month')} <span style={{color:T.danger}}>*</span></label>
                        <div style={{position:'relative'}}>
                            <input className="sr-inp" type="number" min="1" max="31" value={data.payroll_cutoff_day??''} onChange={e=>{const r=e.target.value;if(r===''){setData('payroll_cutoff_day','');}else{const v=parseInt(r);if(!isNaN(v))setData('payroll_cutoff_day',Math.min(31,Math.max(1,v)));}setFormErrors(p=>({...p,payroll_cutoff_day:null}));}} placeholder="e.g. 25" style={{...inp(!!formErrors.payroll_cutoff_day),paddingRight:50}}/>
                            <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:12,color:T.textMute,fontWeight:600,pointerEvents:'none'}}>/ 31</span>
                        </div>
                        <ErrMsg msg={formErrors.payroll_cutoff_day}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'14px 16px',borderRadius:12,border:`1px solid ${T.border}`,background:T.panelSolid,gap:8}}>
                        <div style={{fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.07em'}}>{trText('hrPolicy.salary.preview', 'Preview')}</div>
                        <PayrollPreview payCycle={data.pay_cycle} cutoffDay={data.payroll_cutoff_day} T={T} tr={tr}/>
                    </div>
                </div>
            </SectionCard>

            {/* ── 8. Bonus Schedule ── */}
            <SectionCard emoji="🎁" title={trText('hrPolicy.salary.bonusSchedule', 'Bonus Schedule')} T={T}>
                {!bonusTypes?.length&&(
                    <div style={{padding:'10px 14px',borderRadius:12,background:T.warningSoft,border:`1px solid ${dark?'rgba(251,191,36,0.2)':'#fde68a'}`,fontSize:12,color:T.warning,fontWeight:600}}>
                        ⚠️ {trText('hrPolicy.salary.addBonusTypesFirst', 'Add bonus types in the Bonus section first before creating schedules.')}
                    </div>
                )}
                {bonusSchedules?.length>0&&(
                    <div style={{borderRadius:14,overflow:'hidden',border:`1px solid ${T.border}`}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                            <thead><tr style={{background:T.tableHead,borderBottom:`1px solid ${T.divider}`}}>
                                {[trText('hrPolicy.sections.bonus', 'Bonus'), trText('hrPolicy.bonus.rate', trText('hrPolicy.bonus.rate', 'Rate')), trText('hrPolicy.bonus.frequency', 'Frequency'), trText('hrPolicy.bonus.payWhen', trText('hrPolicy.bonus.payWhen', 'Pay When')), trText('hrPolicy.bonus.notes', 'Notes'), trText('common.status', 'Status'), trText('common.actions', 'Actions')].map((h,i)=><th key={h} style={{padding:'10px 14px',fontSize:10,fontWeight:800,letterSpacing:'0.07em',textTransform:'uppercase',color:T.textMute,whiteSpace:'nowrap',textAlign:i===0?'left':'center'}}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {bonusSchedules.map((s,idx)=>{
                                    const freq=FREQ_OPTIONS.find(f=>f.value===s.frequency)||{label:s.frequency,emoji:'📅'};
                                    const isPct=s.bonus_type?.calculation_type==='percentage';
                                    return <tr key={s.id} className="sr-row" style={{borderBottom:idx<bonusSchedules.length-1?`1px solid ${T.divider}`:'none',transition:'background 0.1s'}}>
                                        <td style={{padding:'10px 14px',fontWeight:700,color:T.text}}>{s.bonus_type?.name??'—'}</td>
                                        <td style={{padding:'10px 14px',textAlign:'center'}}>
                                            <span style={{fontSize:12,fontWeight:800,color:T.primary}}>{isPct?`${formatRate(s.bonus_type.value)}%`:formatRate(s.bonus_type?.value??0)}</span>
                                            <div style={{fontSize:9,color:T.textMute,marginTop:1}}>{isPct?trText('hrPolicy.bonus.ofSalary', 'of salary'):trText('hrPolicy.bonus.flatAmount', 'flat amount')}</div>
                                        </td>
                                        <td style={{padding:'10px 14px',textAlign:'center'}}><span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:99,fontSize:10,fontWeight:800,background:T.primarySoft,color:T.primary}}>{freq.emoji} {freq.labelKey ? trText(freq.labelKey, freq.label) : freq.label}</span></td>
                                        <td style={{padding:'10px 14px',textAlign:'center',fontSize:12,fontWeight:600,color:T.textSoft}}>{getWhen(s)}</td>
                                        <td style={{padding:'10px 14px',textAlign:'center',fontSize:11,color:T.textMute,maxWidth:140}}><span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.notes||'—'}</span></td>
                                        <td style={{padding:'10px 14px',textAlign:'center'}}><span style={{display:'inline-block',padding:'3px 9px',borderRadius:99,fontSize:10,fontWeight:800,background:s.is_active?T.successSoft:T.panelSoft,color:s.is_active?T.success:T.textMute}}>{s.is_active?trText('common.active', 'Active'):trText('common.inactive', 'Inactive')}</span></td>
                                        <td style={{padding:'10px 14px',textAlign:'center'}}>
                                            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                                                <button type="button" onClick={()=>handleSFEdit(s)} style={{width:36,height:36,borderRadius:11,border:`1px solid ${T.border}`,background:T.panelSoft,color:T.textSoft,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=T.panelSofter;e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.background=T.panelSoft;e.currentTarget.style.transform='translateY(0)';}}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                                                </button>
                                                <button type="button" onClick={()=>setDeleteSFTarget(s)} style={{width:36,height:36,borderRadius:11,border:`1px solid ${T.border}`,background:T.dangerSoft,color:T.danger,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.opacity='0.75';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='1';}}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>;
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {showSF&&(
                    <div ref={sfFormRef} className="sr-animate" style={{borderRadius:14,border:`1.5px solid ${dark?'rgba(124,58,237,0.25)':'rgba(124,58,237,0.2)'}`,background:dark?'rgba(124,58,237,0.06)':'rgba(124,58,237,0.03)',padding:16,display:'flex',flexDirection:'column',gap:14}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:30,height:30,borderRadius:9,background:T.primarySoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{editingSFId?'✏️':'➕'}</div>
                                <div style={{fontSize:13,fontWeight:800,color:T.text}}>{editingSFId ? trText('hrPolicy.salary.editSchedule', 'Edit Schedule') : trText('hrPolicy.salary.addBonusSchedule', 'Add Bonus Schedule')}</div>
                            </div>
                            <button type="button" onClick={()=>{resetSF();setSFErrors({});setShowSF(false);setEditingSFId(null);}} style={{width:26,height:26,borderRadius:7,border:`1px solid ${T.border}`,background:T.panelSoft,color:T.textMute,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>✕</button>
                        </div>
                        <div data-sf-err={!!sfErrors.bonus_type_id} style={{position:'relative',zIndex:300}}>
                            <label style={lbl}>{trText('hrPolicy.salary.bonusType', 'Bonus Type')} <span style={{color:T.danger}}>*</span></label>
                            <PremiumSelect options={btOpts} value={String(sf.bonus_type_id)} onChange={v=>{setSF('bonus_type_id',v);setSFErrors(p=>({...p,bonus_type_id:''}));}} placeholder={trText('hrPolicy.salary.selectBonusTypePlaceholder', 'Select bonus type...')} T={T} dark={dark} disabled={!bonusTypes?.length} zIndex={300}/>
                            <ErrMsg msg={sfErrors.bonus_type_id}/>
                        </div>
                        <div>
                            <label style={lbl}>{trText('hrPolicy.bonus.frequency', 'Frequency')}</label>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                                {FREQ_OPTIONS.map(opt=>{
                                    const isSel=sf.frequency===opt.value;
                                    return <label key={opt.value} onClick={()=>{setSF('frequency',opt.value);setSF('pay_month','');setSF('pay_quarter','');}} style={{padding:'10px',borderRadius:12,cursor:'pointer',transition:'all 0.15s',border:`1.5px solid ${isSel?T.primary:T.border}`,background:isSel?T.primarySoft:T.panelSoft,display:'flex',flexDirection:'column',gap:3}}>
                                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                                            <div style={{width:13,height:13,borderRadius:'50%',border:`2px solid ${isSel?T.primary:T.textMute}`,background:isSel?T.primary:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                                                {isSel&&<div style={{width:4,height:4,borderRadius:'50%',background:'#fff'}}/>}
                                            </div>
                                            <span style={{fontSize:11,fontWeight:700,color:isSel?T.primary:T.textSoft}}>{opt.labelKey && tr ? makeTrText(tr)(opt.labelKey, opt.label) : opt.label}</span>
                                        </div>
                                        <div style={{fontSize:9,color:T.textMute,paddingLeft:19}}>{opt.hintKey ? trText(opt.hintKey, opt.hint) : opt.hint}</div>
                                    </label>;
                                })}
                            </div>
                        </div>
                        {(sf.frequency==='yearly'||sf.frequency==='once')&&(
                            <div data-sf-err={!!sfErrors.pay_month} style={{position:'relative',zIndex:200}}>
                                <label style={lbl}>{trText('hrPolicy.salary.payMonth', 'Pay Month')} <span style={{color:T.danger}}>*</span></label>
                                <PremiumSelect options={MONTHS.map(m=>({value:String(m.value),labelKey:m.labelKey,label:m.label}))} value={String(sf.pay_month)} onChange={v=>{setSF('pay_month',v);setSFErrors(p=>({...p,pay_month:''}));}} placeholder={trText('hrPolicy.salary.selectMonth', 'Select month...')} T={T} dark={dark} zIndex={200}/>
                                <ErrMsg msg={sfErrors.pay_month}/>
                            </div>
                        )}
                        {sf.frequency==='quarterly'&&(
                            <div data-sf-err={!!sfErrors.pay_quarter}>
                                <label style={lbl}>{trText('hrPolicy.salary.payQuarter', 'Pay Quarter')} <span style={{color:T.danger}}>*</span></label>
                                <div style={{display:'flex',gap:8}}>
                                    {[1,2,3,4].map(q=>{
                                        const isSel=sf.pay_quarter==q;
                                        return <label key={q} onClick={()=>{setSF('pay_quarter',q);setSFErrors(p=>({...p,pay_quarter:''}));}} style={{flex:1,padding:'10px',borderRadius:11,cursor:'pointer',border:`1.5px solid ${isSel?T.primary:T.border}`,background:isSel?T.primarySoft:T.panelSoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:isSel?T.primary:T.textSoft,transition:'all 0.15s'}}>Q{q}</label>;
                                    })}
                                </div>
                                <ErrMsg msg={sfErrors.pay_quarter}/>
                            </div>
                        )}
                        <div data-sf-err={!!sfErrors.notes}>
                            <label style={lbl}>{trText('hrPolicy.bonus.notes', 'Notes')} <span style={{color:T.danger}}>*</span></label>
                            <input className="sr-inp" type="text" value={sf.notes} onChange={e=>{setSF('notes',e.target.value);setSFErrors(p=>({...p,notes:''}));}} placeholder={trText('hrPolicy.salary.notesPlaceholder', 'e.g. Paid with December payroll')} disabled={sfProc} style={inp(!!sfErrors.notes)}/>
                            <ErrMsg msg={sfErrors.notes}/>
                        </div>
                        <SRToggle label={tr ? trText('common.active', 'Active') : 'Active'} checked={sf.is_active} onChange={v=>setSF('is_active',v)} T={T} dark={dark}/>
                        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                            <button type="button" onClick={()=>{resetSF();setSFErrors({});setShowSF(false);setEditingSFId(null);}} disabled={sfProc} style={{padding:'10px 18px',borderRadius:12,border:`1.5px solid ${T.border}`,background:'transparent',color:T.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=T.panelSoft} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{tr ? trText('common.cancel', 'Cancel') : 'Cancel'}</button>
                            <button type="button" onClick={handleSFSubmit} disabled={sfProc} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:12,border:'none',background:sfProc?T.textMute:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'#fff',fontSize:13,fontWeight:700,cursor:sfProc?'not-allowed':'pointer',boxShadow:sfProc?'none':'0 4px 14px rgba(124,58,237,0.35)',transition:'all 0.15s'}} onMouseEnter={e=>{if(!sfProc)e.currentTarget.style.opacity='0.9';}} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                                {sfProc?<><SRSpinner/> {trText('common.saving', 'Saving...')}</>:<>{editingSFId ? `✅ ${trText('hrPolicy.salary.updateSchedule', 'Update Schedule')}` : `✅ ${trText('hrPolicy.salary.addSchedule', 'Add Schedule')}`}</>}
                            </button>
                        </div>
                    </div>
                )}

                {!showSF&&<button type="button" onClick={()=>{setEditingSFId(null);resetSF();setSFErrors({});setShowSF(true);}} disabled={!bonusTypes?.length}
                    style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:12,border:`1.5px dashed ${T.primary}`,background:T.primarySoft,color:T.primary,fontSize:13,fontWeight:700,cursor:bonusTypes?.length?'pointer':'not-allowed',alignSelf:'flex-start',transition:'all 0.15s',opacity:bonusTypes?.length?0.85:0.4}} onMouseEnter={e=>{if(bonusTypes?.length)e.currentTarget.style.opacity='1';}} onMouseLeave={e=>{if(bonusTypes?.length)e.currentTarget.style.opacity='0.85';}}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>{trText('hrPolicy.salary.addBonusSchedule', 'Add Bonus Schedule')}
                </button>}
            </SectionCard>

            {/* ── Current Settings ── */}
            {isEdit&&(
                <SectionCard emoji="✅" title={trText('hrPolicy.salary.currentSavedSettings', 'Current Saved Settings')} T={T}>
                    <div style={{display:'flex',justifyContent:'flex-end',marginTop:-8}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,background:T.successSoft,color:T.success,fontSize:10,fontWeight:800}}>
                            <span style={{width:6,height:6,borderRadius:'50%',background:T.success,display:'inline-block'}}/>{trText('hrPolicy.saved', 'Saved')}
                        </span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                        <SavedCard label={tr('hrPolicy.salary.payCycle')}       value={PAY_CYCLE_OPTIONS.find(o=>o.value===salaryRule.pay_cycle)?.labelKey ? trText(PAY_CYCLE_OPTIONS.find(o=>o.value===salaryRule.pay_cycle)?.labelKey, PAY_CYCLE_OPTIONS.find(o=>o.value===salaryRule.pay_cycle)?.label) : (PAY_CYCLE_OPTIONS.find(o=>o.value===salaryRule.pay_cycle)?.label??'—')} sub={PAY_CYCLE_OPTIONS.find(o=>o.value===salaryRule.pay_cycle)?.hint} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.probation')}       value={salaryRule.probation_days!=null?`${salaryRule.probation_days} days`:'—'} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.currency')}        value={currencies?.find(c=>c.id==salaryRule.currency_id)?.currency_code??'—'} sub={currencies?.find(c=>c.id==salaryRule.currency_id)?.currency_name} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.bank')}            value={banks?.find(b=>b.id==salaryRule.bank_id)?.bank_name??'—'} sub={banks?.find(b=>b.id==salaryRule.bank_id)?.bank_code} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.workHours')}      value={salaryRule.work_start&&salaryRule.work_end?`${to12h(salaryRule.work_start)} – ${to12h(salaryRule.work_end)}`:'—'} sub={trText('hrPolicy.salary.attendanceWindow', 'Attendance window')} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.dayShift')}       value={salaryRule.day_shift_start&&salaryRule.day_shift_end?`${to12h(salaryRule.day_shift_start)} – ${to12h(salaryRule.day_shift_end)}`:'—'} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.nightShift')}     value={salaryRule.day_shift_end&&salaryRule.day_shift_start?`${to12h(salaryRule.day_shift_end)} – ${to12h(salaryRule.day_shift_start)}`:'—'} sub={trText('hrPolicy.salary.autoDerived', 'Auto-derived')} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.lunchBreak')}     value={salaryRule.lunch_start&&salaryRule.lunch_end?`${salaryRule.lunch_start?.substring(0,5)} – ${salaryRule.lunch_end?.substring(0,5)}`:'12:00 – 13:00'} sub={trText('hrPolicy.salary.autoDeducted', 'Auto-deducted')} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.otBase')}         value={salaryRule.overtime_base==='hourly_rate'?tr('hrPolicy.salary.hourlyRate'):tr('hrPolicy.salary.dailyRate')} sub={salaryRule.overtime_base==='hourly_rate'? trText('hrPolicy.salary.dailyWorkingHours', 'Daily ÷ working hrs') : trText('hrPolicy.salary.monthlyWorkingDays', 'Monthly ÷ working days')} T={T}/>
                        <SavedCard label={tr('hrPolicy.salary.lateDeduction')}  value={`${salaryRule.late_deduction_rate??0} / ${salaryRule.late_deduction_unit==='per_minute'?'min':'hr'}`} T={T}/>
                        <SavedCard label={trText('hrPolicy.salary.paymentDate', 'Payment Date')}    value={(() => {
                            const d=salaryRule?.payroll_cutoff_day??25;const cycle=salaryRule?.pay_cycle??'monthly';
                            const now=new Date();const y=now.getFullYear();const m=now.getMonth();
                            const lastDay=new Date(y,m+1,0).getDate();const cutoff=Math.min(d,lastDay);
                            const prevLastDay=new Date(y,m,0).getDate();const prevCutoff=Math.min(d,prevLastDay);
                            let pS,pE;if(d>=lastDay){pS=new Date(y,m,1);pE=new Date(y,m,cutoff);}else{pS=new Date(y,m-1,prevCutoff+1);pE=new Date(y,m,cutoff);}
                            const total=Math.round((pE-pS)/86400000)+1;
                            if(cycle==='semi_monthly'){const mid=Math.floor(total/2);const p1E=new Date(pS.getTime()+(mid-1)*86400000);return`${p1E.getDate()} & ${pE.getDate()} of month`;}
                            if(cycle==='ten_day'){const c=Math.floor(total/3);const p1E=new Date(pS.getTime()+(c-1)*86400000);const p2E=new Date(pS.getTime()+(c*2-1)*86400000);return`${p1E.getDate()}, ${p2E.getDate()} & ${pE.getDate()} of month`;}
                            return `${pE.getDate()} ${trText('hrPolicy.salary.ofEachMonth', 'of each month')}`;
                        })()} T={T}/>
                        <SavedCard
                            label={trText('hrPolicy.salary.lateWarning', 'Late Warning')}
                            value={salaryRule.late_alert_enabled ? `≥ ${salaryRule.late_alert_threshold ?? 3}x / month` : (tr ? trText('common.disabled', 'Disabled') : 'Disabled')}
                            sub={salaryRule.late_alert_enabled ? trText('common.active', 'Active') : trText('common.inactive', 'Inactive')}
                            T={T}
                        />
                        <SavedCard
                            label={trText('hrPolicy.salary.absentWarning', 'Absent Warning')}
                            value={salaryRule.absent_alert_enabled ? `≥ ${salaryRule.absent_alert_threshold ?? 2} days / month` : (tr ? trText('common.disabled', 'Disabled') : 'Disabled')}
                            sub={salaryRule.absent_alert_enabled ? trText('common.active', 'Active') : trText('common.inactive', 'Inactive')}
                            T={T}
                        />
                        <SavedCard label={trText('hrPolicy.salary.bonusProbation', 'Bonus (Probation)')} value={salaryRule.bonus_during_probation ? trText('hrPolicy.salary.yesPayBonus', 'Yes — pay bonus') : trText('hrPolicy.salary.noSkip', 'No — skip')} T={T}/>
                        <SavedCard label={trText('hrPolicy.salary.bonusContract', 'Bonus (Contract)')}  value={salaryRule.bonus_for_contract ? trText('hrPolicy.salary.yesPayBonus', 'Yes — pay bonus') : trText('hrPolicy.salary.noSkip', 'No — skip')} T={T}/>
                    </div>
                    {bonusSchedules?.length>0&&(
                        <div style={{borderRadius:14,overflow:'hidden',border:`1px solid ${T.border}`,marginTop:4}}>
                            <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.divider}`,background:T.panelSolid,fontSize:10,fontWeight:800,color:T.textMute,textTransform:'uppercase',letterSpacing:'0.08em'}}>{tr('hrPolicy.bonus.bonusSchedules')}</div>
                            <div>
                                {bonusSchedules.map((s,idx)=>{
                                    const when=getWhen(s);const freq=FREQ_OPTIONS.find(f=>f.value===s.frequency)?.label??s.frequency;
                                    const isPct=s.bonus_type?.calculation_type==='percentage';
                                    return <div key={s.id} style={{padding:'12px 14px',borderBottom:idx<bonusSchedules.length-1?`1px solid ${T.divider}`:'none',opacity:s.is_active?1:0.5,transition:'background 0.1s'}} onMouseEnter={e=>e.currentTarget.style.background=T.rowHover} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                                            <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                                                <div style={{width:8,height:8,borderRadius:'50%',background:s.is_active?T.success:T.textMute,flexShrink:0,marginTop:4}}/>
                                                <div>
                                                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{s.bonus_type?.name??'—'}</div>
                                                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:5}}>
                                                        <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:800,background:T.primarySoft,color:T.primary}}>{freq}</span>
                                                        {when!=='—'&&when!==tr('hrPolicy.salary.everyMonth')&&<span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:700,background:T.panelSofter,color:T.textSoft}}>📅 {when}</span>}
                                                        <span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:800,background:s.is_active?T.successSoft:T.panelSoft,color:s.is_active?T.success:T.textMute}}>{s.is_active?trText('common.active', 'Active'):trText('common.inactive', 'Inactive')}</span>
                                                    </div>
                                                    {s.notes&&<div style={{marginTop:4,fontSize:11,color:T.textMute,fontStyle:'italic'}}>{s.notes}</div>}
                                                </div>
                                            </div>
                                            <div style={{textAlign:'right',flexShrink:0}}>
                                                <div style={{fontSize:15,fontWeight:800,color:isPct?T.info:T.success}}>{isPct?`${formatRate(s.bonus_type.value)}%`:formatRate(s.bonus_type?.value??0)}</div>
                                                <div style={{fontSize:10,color:T.textMute}}>{isPct?trText('hrPolicy.bonus.ofSalary', 'of salary'):trText('hrPolicy.bonus.flatAmount', 'flat amount')}</div>
                                            </div>
                                        </div>
                                    </div>;
                                })}
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* Submit */}
            <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button type="submit" disabled={processing} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:14,border:'none',background:processing?T.textMute:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'#fff',fontSize:14,fontWeight:800,cursor:processing?'not-allowed':'pointer',boxShadow:processing?'none':'0 4px 18px rgba(124,58,237,0.4)',transition:'all 0.15s'}} onMouseEnter={e=>{if(!processing)e.currentTarget.style.opacity='0.9';}} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                    {processing?<><SRSpinner/> {trText('common.saving', 'Saving...')}</>:<><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{isEdit ? trText('hrPolicy.salary.reviewUpdate', 'Review & Update') : trText('hrPolicy.salary.reviewSave', 'Review & Save')}</>}
                </button>
            </div>

        </form>
        </div>
        </>
    );
}