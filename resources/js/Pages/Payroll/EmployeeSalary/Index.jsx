import { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
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
        panelSolid:   '#0f1b34',
        panelSoft:    'rgba(255,255,255,0.04)',
        border:       'rgba(148,163,184,0.13)',
        borderStrong: 'rgba(148,163,184,0.28)',
        text:         '#f8fafc',
        textSoft:     '#cbd5e1',
        textMute:     '#64748b',
        overlay:      'rgba(2,8,23,0.78)',
        shadow:       '0 24px 60px rgba(0,0,0,0.45)',
        shadowSoft:   '0 4px 16px rgba(0,0,0,0.28)',
        primary:      '#8b5cf6',
        primarySoft:  'rgba(139,92,246,0.16)',
        danger:       '#f87171',
        dangerSoft:   'rgba(248,113,113,0.14)',
        warning:      '#fbbf24',
        inputBg:      'rgba(255,255,255,0.06)',
        inputBorder:  'rgba(148,163,184,0.18)',
        tableHead:    'rgba(255,255,255,0.03)',
        rowHover:     'rgba(255,255,255,0.025)',
        modalHeader:  'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        menuBg:       'linear-gradient(180deg,rgba(5,17,38,0.99) 0%,rgba(3,12,28,0.99) 100%)',
        menuItemHover:'rgba(255,255,255,0.06)',
        menuSelected: 'rgba(139,92,246,0.22)',
    };
    return {
        panelSolid:   '#ffffff',
        panelSoft:    '#f8fafc',
        border:       'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.2)',
        text:         '#0f172a',
        textSoft:     '#475569',
        textMute:     '#94a3b8',
        overlay:      'rgba(15,23,42,0.48)',
        shadow:       '0 20px 50px rgba(15,23,42,0.14)',
        shadowSoft:   '0 2px 8px rgba(15,23,42,0.06)',
        primary:      '#7c3aed',
        primarySoft:  '#f3e8ff',
        danger:       '#ef4444',
        dangerSoft:   '#fef2f2',
        warning:      '#d97706',
        inputBg:      '#f8fafc',
        inputBorder:  '#e2e8f0',
        tableHead:    '#f8fafc',
        rowHover:     '#fafbff',
        modalHeader:  'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        menuBg:       '#ffffff',
        menuItemHover:'#f5f3ff',
        menuSelected: '#ede9fe',
    };
}

// ─── Helpers ──────────────────────────────────────────────────
const showToast = (msg, type = 'success') =>
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type } }));

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

const EMP_CFG = {
    probation: { label:'Probation', color:'#d97706', bg:'#fef3c7', bgDark:'rgba(217,119,6,0.16)' },
    permanent: { label:'Permanent', color:'#059669', bg:'#d1fae5', bgDark:'rgba(5,150,105,0.16)' },
    contract:  { label:'Contract',  color:'#2563eb', bg:'#dbeafe', bgDark:'rgba(37,99,235,0.16)' },
};

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ name, url, size = 34, theme }) {
    const [err, setErr] = useState(false);
    const initials = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const bg = ['#7c3aed','#059669','#2563eb','#d97706','#dc2626','#0891b2'][(name?.charCodeAt(0)||0)%6];
    if (url && !err)
        return <img src={`/storage/${url}`} alt={name} onError={()=>setErr(true)}
            style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`2px solid ${theme?.border||'#e5e7eb'}` }}/>;
    return (
        <div style={{ width:size, height:size, borderRadius:'50%', background:bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.36, fontWeight:800, color:'#fff' }}>
            {initials}
        </div>
    );
}

// ─── Premium Employee Dropdown (Portal-based for use inside Modal) ─────────
function PremiumEmployeeSelect({ employees, value, onChange, error, theme, dark }) {
    const [open, setOpen]   = useState(false);
    const [pos,  setPos]    = useState({ top:0, left:0, width:0 });
    const [search, setSearch] = useState('');
    const triggerRef        = useRef(null);
    const menuRef           = useRef(null);
    const searchRef         = useRef(null);

    const selected = employees.find(e => String(e.id) === String(value));

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
            setSearch('');
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search when opens
    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 60);
    }, [open]);

    function handleOpen() {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            // Check if there's space below; if not, open upward
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuH = Math.min(employees.length * 52 + 60, 280);
            const top = spaceBelow < menuH
                ? rect.top + window.scrollY - menuH - 6
                : rect.bottom + window.scrollY + 6;
            setPos({ top, left: rect.left + window.scrollX, width: rect.width });
        }
        setOpen(v => !v);
        setSearch('');
    }

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        return employees.filter(e =>
            e.name?.toLowerCase().includes(s) ||
            e.position?.toLowerCase().includes(s) ||
            e.department?.toLowerCase().includes(s)
        );
    }, [employees, search]);

    const triggerBg = dark
        ? 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.04) 100%)'
        : 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)';

    return (
        <>
            {/* Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                style={{
                    width: '100%',
                    height: 44,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${error ? theme.danger : open ? theme.primary : theme.inputBorder}`,
                    background: error
                        ? (dark ? 'rgba(248,113,113,0.08)' : '#fff9f9')
                        : triggerBg,
                    color: selected ? theme.text : theme.textMute,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    boxShadow: open ? `0 0 0 3px ${dark ? 'rgba(139,92,246,0.18)' : 'rgba(124,58,237,0.12)'}` : 'none',
                    transition: 'all 0.18s ease',
                    outline: 'none',
                    fontFamily: 'inherit',
                }}
            >
                {selected ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                        <Avatar name={selected.name} url={selected.avatar_url} size={24} theme={theme} />
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13, fontWeight:700, color:theme.text }}>
                            {selected.name}
                        </span>
                        {selected.position && (
                            <span style={{ fontSize:11, color:theme.textMute, whiteSpace:'nowrap' }}>
                                · {selected.position}
                            </span>
                        )}
                    </div>
                ) : (
                    <span style={{ fontSize:13, color:theme.textMute }}>— Select employee —</span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ flexShrink:0, transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: theme.textMute }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {/* Portal dropdown menu */}
            {open && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                        zIndex: 9999,
                        background: theme.menuBg,
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 14,
                        boxShadow: dark
                            ? '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
                            : '0 16px 40px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.06)',
                        overflow: 'hidden',
                        animation: 'esDropIn 0.18s ease',
                        backdropFilter: dark ? 'blur(20px)' : 'none',
                    }}
                >
                    {/* Search box */}
                    {employees.length > 5 && (
                        <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${theme.border}` }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '7px 10px',
                                background: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                                borderRadius: 8,
                                border: `1px solid ${theme.border}`,
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                                <input
                                    ref={searchRef}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search employee…"
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: 12,
                                        color: theme.text,
                                        flex: 1,
                                        fontFamily: 'inherit',
                                    }}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:theme.textMute, fontSize:14, lineHeight:1, padding:0 }}>×</button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Options list */}
                    <div className="es-hide" style={{ maxHeight: 240, overflowY: 'auto', padding: '6px' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '16px', textAlign:'center', fontSize:12, color:theme.textMute }}>
                                No employees found
                            </div>
                        ) : filtered.map(emp => {
                            const isSelected = String(emp.id) === String(value);
                            const empCfg = EMP_CFG[emp.employment_type] || EMP_CFG.probation;
                            return (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => { onChange(String(emp.id)); setOpen(false); setSearch(''); }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: 9,
                                        border: 'none',
                                        background: isSelected
                                            ? theme.menuSelected
                                            : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        textAlign: 'left',
                                        transition: 'background 0.13s',
                                        marginBottom: 2,
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = theme.menuItemHover; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <Avatar name={emp.name} url={emp.avatar_url} size={30} theme={theme} />
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: isSelected ? theme.primary : theme.text,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {emp.name}
                                        </div>
                                        {(emp.position || emp.department) && (
                                            <div style={{ fontSize:11, color:theme.textMute, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {emp.position || emp.department}
                                            </div>
                                        )}
                                    </div>
                                    {emp.employment_type && (
                                        <span style={{
                                            fontSize: 9,
                                            fontWeight: 800,
                                            padding: '2px 7px',
                                            borderRadius: 99,
                                            background: dark ? empCfg.bgDark : empCfg.bg,
                                            color: empCfg.color,
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}>
                                            {empCfg.label}
                                        </span>
                                    )}
                                    {isSelected && (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ─── Modal ────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, icon, children, width=520, dark, theme }) {
    if (!open) return null;
    return createPortal(
        <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:theme.overlay, backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background: dark?'#0f1b34':'#fff', borderRadius:22, width:'100%', maxWidth:width, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:'esPopIn 0.22s ease' }}>
                <div style={{ background:theme.modalHeader, padding:'20px 24px 18px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%',  }}/>
                    <div style={{ position:'absolute', bottom:-30, left:20, width:90, height:90, borderRadius:'50%', }}/>
                    <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{icon||'💼'}</div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Employee Salary</div>
                                <div style={{ fontSize:17, fontWeight:900, color:'#fff' }}>{title}</div>
                                {subtitle && <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{subtitle}</div>}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.16)', border:'none', cursor:'pointer', fontSize:20, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                    </div>
                </div>
                <div className="es-hide" style={{ padding:'22px 24px 26px', overflowY:'auto', flex:1 }}>{children}</div>
            </div>
        </div>,
        document.body
    );
}

// ─── Profile Form ─────────────────────────────────────────────
function ProfileForm({ employees, salaryRule, editProfile, onClose, dark, theme }) {
    const isEdit     = !!editProfile;
    const allowances = salaryRule?.allowances || [];
    const currency   = salaryRule?.currency?.currency_code || '';
    const bankName   = salaryRule?.bank?.bank_name || '';

    const [form, setForm] = useState({
        user_id:                  editProfile?.user_id ?? '',
        base_salary:              editProfile?.base_salary ?? '',
        bank_account_holder_name: editProfile?.bank_account_holder_name ?? '',
        bank_account_number:      editProfile?.bank_account_number ?? '',
        allowance_ids:            editProfile?.allowances?.map(a=>a.id) ?? [],
    });
    const [errors,       setErrors]       = useState({});
    const [saving,       setSaving]       = useState(false);
    const [generalError, setGeneralError] = useState('');

    const set = (k,v) => setForm(p=>({...p,[k]:v}));
    const selEmp = useMemo(() => employees.find(e=>String(e.id)===String(form.user_id)), [form.user_id, employees]);
    const toggleAllowance = id => setForm(p=>({ ...p, allowance_ids: p.allowance_ids.includes(id)?p.allowance_ids.filter(x=>x!==id):[...p.allowance_ids,id] }));

    const validate = () => {
        const e={};
        if (!isEdit && !form.user_id) e.user_id='Please select an employee.';
        if (!form.base_salary||isNaN(form.base_salary)||Number(form.base_salary)<0) e.base_salary='Please enter a valid salary amount.';
        return e;
    };

    const handleSubmit = () => {
        const e=validate(); if(Object.keys(e).length){setErrors(e);return;}
        setSaving(true);
        const payload = { base_salary:parseFloat(form.base_salary), bank_account_holder_name:form.bank_account_holder_name||null, bank_account_number:form.bank_account_number||null, allowance_ids:form.allowance_ids };
        if (!isEdit) { payload.user_id=form.user_id; payload.country_id=salaryRule?.country_id; payload.salary_rule_id=salaryRule?.id; payload.effective_date=selEmp?.joined_date?selEmp.joined_date.slice(0,10):new Date().toISOString().slice(0,10); }
        const url=isEdit?`/payroll/employee-profiles/${editProfile.id}`:'/payroll/employee-profiles';
        fetch(url,{method:isEdit?'PUT':'POST',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content,'Accept':'application/json'},body:JSON.stringify(payload)})
            .then(r=>r.json())
            .then(data=>{
                if(data.errors||data.message==='The given data was invalid.'){
                    const errs=data.errors||{};
                    if(errs.user_id){setGeneralError(Array.isArray(errs.user_id)?errs.user_id[0]:errs.user_id);setErrors({});}
                    else{setErrors(errs);setGeneralError('');}
                    setSaving(false);return;
                }
                showToast(isEdit?'Salary profile updated.':'Salary profile saved.');
                onClose(true,data);
            })
            .catch(()=>{showToast('Something went wrong.','error');setSaving(false);});
    };

    const inp = err=>({ width:'100%', padding:'10px 13px', border:`1.5px solid ${err?theme.danger:theme.inputBorder}`, borderRadius:10, fontSize:13, color:theme.text, background:dark?theme.inputBg:(err?'#fff9f9':'#fff'), outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s' });
    const lbl = { display:'block', fontSize:11, fontWeight:700, color:theme.textMute, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {generalError && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:dark?theme.dangerSoft:'#fef2f2', border:`1px solid ${dark?'rgba(248,113,113,0.3)':'#fecaca'}`, borderRadius:12, padding:'12px 14px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p style={{ margin:0, fontSize:12, color:theme.danger, lineHeight:1.5 }}>{generalError}</p>
                </div>
            )}

            {/* ── Employee selector (Premium dropdown) ── */}
            {!isEdit && (
                <div>
                    <label style={lbl}>Employee <span style={{color:theme.danger}}>*</span></label>
                    <PremiumEmployeeSelect
                        employees={employees}
                        value={form.user_id}
                        onChange={v => { set('user_id', v); setErrors(p=>({...p,user_id:null})); }}
                        error={errors.user_id}
                        theme={theme}
                        dark={dark}
                    />
                    {errors.user_id && <p style={{margin:'4px 0 0',fontSize:11,color:theme.danger}}>{errors.user_id}</p>}

                    {/* Selected employee info card */}
                    {selEmp && (
                        <div style={{ marginTop:10, background:dark?theme.panelSoft:'#f9fafb', border:`1px solid ${theme.border}`, borderRadius:12, padding:'12px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px' }}>
                            {[['Position',selEmp.position||'—'],['Department',selEmp.department||'—'],['Employment',EMP_CFG[selEmp.employment_type]?.label||'—'],['Joined',fmtDate(selEmp.joined_date)]].map(([k,v])=>(
                                <div key={k}>
                                    <div style={{fontSize:9,fontWeight:700,color:theme.textMute,textTransform:'uppercase',letterSpacing:'0.5px'}}>{k}</div>
                                    <div style={{fontSize:12,fontWeight:700,color:theme.textSoft,marginTop:2}}>{v}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isEdit && (
                <div style={{ display:'flex', alignItems:'center', gap:12, background:dark?theme.panelSoft:'#f9fafb', border:`1px solid ${theme.border}`, borderRadius:14, padding:'13px 15px' }}>
                    <Avatar name={editProfile.name} url={editProfile.avatar_url} size={40} theme={theme}/>
                    <div>
                        <div style={{fontSize:14,fontWeight:800,color:theme.text}}>{editProfile.name}</div>
                        <div style={{fontSize:12,color:theme.textMute,marginTop:2}}>
                            {editProfile.position||editProfile.department||'—'}{' · '}
                            <span style={{color:EMP_CFG[editProfile.employment_type]?.color||theme.textMute,fontWeight:700}}>
                                {EMP_CFG[editProfile.employment_type]?.label||'—'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label style={lbl}>Base Salary{currency?` (${currency})`:''} <span style={{color:theme.danger}}>*</span></label>
                <div style={{position:'relative'}}>
                    {currency && <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:12,fontWeight:700,color:theme.textMute,pointerEvents:'none'}}>{currency}</span>}
                    <input type="number" min="0" step="0.01" value={form.base_salary} onChange={e=>{set('base_salary',e.target.value);setErrors(p=>({...p,base_salary:null}));}} placeholder="0.00" style={{...inp(errors.base_salary),paddingLeft:currency?52:13}}/>
                </div>
                {errors.base_salary && <p style={{margin:'4px 0 0',fontSize:11,color:theme.danger}}>{errors.base_salary}</p>}
            </div>

            {allowances.length>0 && (
                <div>
                    <label style={lbl}>Allowances</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                        {allowances.map(a=>{
                            const on=form.allowance_ids.includes(a.id);
                            return (
                                <button key={a.id} type="button" onClick={()=>toggleAllowance(a.id)}
                                    style={{padding:'7px 14px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',border:`1.5px solid ${on?theme.primary:theme.border}`,background:on?(dark?theme.primarySoft:'#ede9fe'):(dark?theme.panelSoft:'#fafafa'),color:on?theme.primary:theme.textMute,transition:'all 0.15s',display:'flex',alignItems:'center',gap:6}}>
                                    {on&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                    {a.name}
                                    <span style={{fontSize:11,opacity:0.65}}>{a.type==='percentage'?`${a.value}%`:`${currency} ${Number(a.value).toLocaleString()}`}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p style={{margin:'6px 0 0',fontSize:11,color:theme.textMute}}>Select allowances that apply to this employee.</p>
                </div>
            )}

            <div style={{background:dark?theme.panelSoft:'#f9fafb',border:`1px solid ${theme.border}`,borderRadius:14,padding:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span style={{fontSize:11,fontWeight:800,color:theme.textMute,textTransform:'uppercase',letterSpacing:'0.7px'}}>Bank Information</span>
                    <span style={{fontSize:11,color:theme.textMute}}>— optional</span>
                </div>
                {bankName && (
                    <div style={{marginBottom:12}}>
                        <label style={{...lbl,color:theme.textMute}}>Bank</label>
                        <input value={bankName} readOnly style={{...inp(false),background:dark?'rgba(255,255,255,0.03)':'#f0f0f0',color:theme.textMute,cursor:'default'}}/>
                    </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                        <label style={lbl}>Account Holder Name</label>
                        <input value={form.bank_account_holder_name} onChange={e=>set('bank_account_holder_name',e.target.value)} placeholder="Full name" style={inp(false)}/>
                    </div>
                    <div>
                        <label style={lbl}>Account Number</label>
                        <input value={form.bank_account_number} onChange={e=>set('bank_account_number',e.target.value)} placeholder="Account number" style={inp(false)}/>
                    </div>
                </div>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:4}}>
                <button onClick={()=>onClose(false)} disabled={saving} style={{padding:'10px 20px',borderRadius:10,border:`1px solid ${theme.border}`,background:dark?theme.panelSoft:'#fff',color:theme.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{padding:'10px 26px',borderRadius:10,border:'none',background:theme.modalHeader,color:'#fff',fontSize:13,fontWeight:800,cursor:saving?'not-allowed':'pointer',opacity:saving?0.65:1,display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 14px rgba(124,58,237,0.35)',transition:'all 0.15s'}}>
                    {saving&&<span style={{width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'esSpin 0.7s linear infinite'}}/>}
                    {saving?'Saving…':isEdit?'Update Profile':'Save Profile'}
                </button>
            </div>
        </div>
    );
}

// ─── Delete Confirm ───────────────────────────────────────────
function DeleteConfirm({ profile, onClose, onConfirm, loading, dark, theme }) {
    return (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
                <Avatar name={profile?.name} url={profile?.avatar_url} size={44} theme={theme}/>
                <div>
                    <div style={{fontSize:15,fontWeight:800,color:theme.text}}>{profile?.name}</div>
                    <div style={{fontSize:12,color:theme.textMute,marginTop:2}}>{profile?.position||profile?.department||'—'}</div>
                </div>
            </div>
            <div style={{background:dark?theme.dangerSoft:'#fef2f2',border:`1px solid ${dark?'rgba(248,113,113,0.3)':'#fecaca'}`,borderRadius:12,padding:'12px 14px',fontSize:13,color:dark?theme.danger:'#dc2626',lineHeight:1.6}}>
                This will deactivate the salary profile. Past payroll records will remain intact.
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
                <button onClick={onClose} disabled={loading} style={{padding:'9px 20px',borderRadius:10,border:`1px solid ${theme.border}`,background:dark?theme.panelSoft:'#fff',color:theme.textSoft,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button onClick={onConfirm} disabled={loading} style={{padding:'9px 20px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#dc2626,#ef4444)',color:'#fff',fontSize:13,fontWeight:800,cursor:loading?'not-allowed':'pointer',opacity:loading?0.65:1,boxShadow:'0 4px 14px rgba(220,38,38,0.35)'}}>
                    {loading?'Removing…':'Remove Profile'}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EmployeeSalaryIndex({ employees, salaryRule, profiles: init }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(()=>getTheme(dark),[dark]);

    const [profiles,        setProfiles]        = useState(init||[]);
    const [search,          setSearch]          = useState('');
    const [showAdd,         setShowAdd]         = useState(false);
    const [editP,           setEditP]           = useState(null);
    const [deleteP,         setDeleteP]         = useState(null);
    const [deleting,        setDeleting]        = useState(false);
    const [visibleSalaries, setVisibleSalaries] = useState(new Set());

    const toggleSalary = id => setVisibleSalaries(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

    const filtered = useMemo(()=>{
        const s=search.toLowerCase();
        return profiles.filter(p=>p.name?.toLowerCase().includes(s)||p.position?.toLowerCase().includes(s)||p.department?.toLowerCase().includes(s));
    },[profiles,search]);

    const handleFormClose = (saved, updatedProfile) => {
        setShowAdd(false);setEditP(null);
        if(saved&&updatedProfile){setProfiles(prev=>{const e=prev.find(p=>p.id===updatedProfile.id);return e?prev.map(p=>p.id===updatedProfile.id?updatedProfile:p):[updatedProfile,...prev];});}
        else if(saved){router.reload({only:['profiles']});}
    };

    const handleDelete = () => {
        if(!deleteP)return;setDeleting(true);
        fetch(`/payroll/employee-profiles/${deleteP.id}`,{method:'DELETE',headers:{'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content,'Accept':'application/json'}})
            .then(r=>{if(!r.ok)throw new Error();setProfiles(prev=>prev.filter(p=>p.id!==deleteP.id));showToast('Salary profile removed.');setDeleteP(null);setDeleting(false);})
            .catch(()=>{showToast('Failed to remove profile.','error');setDeleting(false);});
    };

    const currency = salaryRule?.currency?.currency_code||'';

    const thS = minW => ({ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:800, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.7px', whiteSpace:'nowrap', minWidth:minW, background:theme.tableHead });

    function ActionGlyph({ type, color }) {
        if (type === 'edit') {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
            );
        }

        if (type === 'delete') {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
            );
        }

        return null;
    }

    return (
        <AppLayout title="Employee Salary">
            <Head title="Employee Salary"/>
            <style>{`
                @keyframes esPopIn  { from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);} }
                @keyframes esSpin   { to{transform:rotate(360deg);} }
                @keyframes esDropIn { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }
                .es-hide::-webkit-scrollbar{display:none;}.es-hide{scrollbar-width:none;-ms-overflow-style:none;}
                .es-row:hover td { background:${dark?'rgba(255,255,255,0.025)':'#fafbff'}; }
            `}</style>

            <div style={{display:'flex',flexDirection:'column',gap:20}}>

                {/* ── Compact Summary Bar + Toolbar ── */}
                <div style={{
                    background: dark ? theme.panelSolid : '#fff',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 16,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    boxShadow: dark ? 'none' : theme.shadowSoft,
                    flexWrap: 'wrap',
                    rowGap: 10,
                }}>
                    {/* Stat pills */}
                    {[
                        { label:'Total', value: profiles.length,                                    color:'#7c3aed', dotBg: dark?'rgba(139,92,246,0.2)':'#ede9fe' },
                        { label:'With Bank', value: profiles.filter(p=>p.bank_account_number).length, color:'#059669', dotBg: dark?'rgba(5,150,105,0.18)':'#d1fae5' },
                        { label:'Missing Bank', value: profiles.filter(p=>!p.bank_account_number).length, color:'#d97706', dotBg: dark?'rgba(217,119,6,0.18)':'#fef3c7' },
                    ].map((s, i) => (
                        <div key={s.label} style={{ display:'flex', alignItems:'center', gap:10, paddingRight:16, marginRight:16, borderRight: i < 2 ? `1px solid ${theme.border}` : 'none' }}>
                            <div style={{ width:30, height:30, borderRadius:9, background:s.dotBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <span style={{ fontSize:15, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</span>
                            </div>
                            <span style={{ fontSize:12, fontWeight:600, color:theme.textMute, whiteSpace:'nowrap' }}>{s.label}</span>
                        </div>
                    ))}

                    {/* Employment type pills */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, paddingRight:16, marginRight:16, borderRight:`1px solid ${theme.border}`, flexWrap:'wrap' }}>
                        {[
                            { key:'probation', label:'Probation', color:'#d97706' },
                            { key:'permanent', label:'Permanent', color:'#059669' },
                            { key:'contract',  label:'Contract',  color:'#2563eb' },
                        ].map(({ key, label, color }) => {
                            const count = profiles.filter(p => p.employment_type === key).length;
                            const cfg = EMP_CFG[key];
                            return (
                                <span key={key} style={{
                                    display:'inline-flex', alignItems:'center', gap:5,
                                    padding:'4px 10px', borderRadius:99,
                                    background: dark ? cfg.bgDark : cfg.bg,
                                    fontSize:11, fontWeight:700, color, whiteSpace:'nowrap',
                                }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block' }}/>
                                    {label} <span style={{ opacity:0.75 }}>{count}</span>
                                </span>
                            );
                        })}
                    </div>

                    {/* Search — flex grow */}
                    <div style={{ position:'relative', flex:1, minWidth:160 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            value={search} onChange={e=>setSearch(e.target.value)}
                            placeholder="Search employee…"
                            style={{ width:'100%', padding:'7px 10px 7px 30px', border:`1px solid ${theme.border}`, borderRadius:9, fontSize:13, color:theme.text, background:dark?theme.panelSoft:'#f8fafc', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                        />
                    </div>

                    {/* Add Profile button */}
                    <button
                        onClick={()=>setShowAdd(true)}
                        onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
                        onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                        style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', background:theme.modalHeader, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:'0 3px 12px rgba(124,58,237,0.3)', transition:'opacity 0.15s', whiteSpace:'nowrap', marginLeft:10, flexShrink:0 }}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Profile
                    </button>
                </div>

                {/* ── Table Panel ── */}
                <div style={{background:dark?theme.panelSolid:'#fff',borderRadius:18,border:`1px solid ${theme.border}`,boxShadow:theme.shadowSoft,overflow:'hidden'}}>
                    {filtered.length===0?(
                        <div style={{padding:'60px 24px',textAlign:'center'}}>
                            <div style={{fontSize:40,marginBottom:10}}>💼</div>
                            <div style={{fontSize:14,fontWeight:700,color:theme.textSoft,marginBottom:4}}>{search?'No results found':'No salary profiles yet'}</div>
                            <div style={{fontSize:12,color:theme.textMute}}>{search?'Try a different search term.':'Click "Add Profile" to assign a salary.'}</div>
                        </div>
                    ):(
                        <div className="es-hide" style={{overflowX:'auto'}}>
                            <table style={{width:'100%',minWidth:860,borderCollapse:'collapse'}}>
                                <thead>
                                    <tr style={{borderBottom:`1px solid ${theme.border}`}}>
                                        <th style={thS('180px')}>Employee</th>
                                        <th style={thS('110px')}>Employment</th>
                                        <th style={thS('110px')}>Joined</th>
                                        <th style={thS('220px')}>Allowances</th>
                                        <th style={thS('140px')}>{`Salary${currency?` (${currency})`:''}`}</th>
                                        <th style={thS('140px')}>Bank</th>
                                        <th style={thS('120px')}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((p,i)=>{
                                        const salaryOn=visibleSalaries.has(p.id);
                                        const empCfg=EMP_CFG[p.employment_type]||EMP_CFG.probation;
                                        const empBg=dark?empCfg.bgDark:empCfg.bg;
                                        return (
                                            <tr key={p.id} className="es-row" style={{borderBottom:i<filtered.length-1?`1px solid ${theme.border}`:'none'}}>
                                                <td style={{padding:'13px 16px'}}>
                                                    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                                                        <Avatar name={p.name} url={p.avatar_url} size={34} theme={theme}/>
                                                        <div style={{minWidth:0}}>
                                                            <div style={{fontSize:13,fontWeight:700,color:theme.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                                                            <div style={{fontSize:11,color:theme.textMute,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:1}}>{p.position||p.department||'—'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{padding:'13px 16px'}}>
                                                    <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99,background:empBg,color:empCfg.color,whiteSpace:'nowrap'}}>{empCfg.label}</span>
                                                </td>
                                                <td style={{padding:'13px 16px',fontSize:12,color:theme.textSoft,whiteSpace:'nowrap'}}>{fmtDate(p.joined_date)}</td>
                                                <td style={{padding:'13px 16px'}}>
                                                    {p.allowances?.length>0?(
                                                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                                                            {p.allowances.map(a=>(
                                                                <span key={a.id} style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:6,background:dark?theme.primarySoft:'#ede9fe',color:theme.primary,whiteSpace:'nowrap'}}>{a.name}</span>
                                                            ))}
                                                        </div>
                                                    ):<span style={{fontSize:12,color:theme.border}}>—</span>}
                                                </td>
                                                <td style={{padding:'13px 16px',whiteSpace:'nowrap'}}>
                                                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                                                        <span style={{fontSize:13,fontWeight:800,color:theme.text,fontVariantNumeric:'tabular-nums',letterSpacing:salaryOn?'0':'2px'}}>
                                                            {salaryOn?Number(p.base_salary).toLocaleString():'••••••'}
                                                        </span>
                                                        <button onClick={()=>toggleSalary(p.id)} style={{background:'none',border:'none',cursor:'pointer',padding:3,color:salaryOn?theme.primary:theme.textMute,display:'flex',alignItems:'center',transition:'color 0.15s'}}>
                                                            {salaryOn?(
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                            ):(
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={{padding:'13px 16px'}}>
                                                    {p.bank_account_number_masked?(
                                                        <div>
                                                            <div style={{fontSize:11,fontWeight:700,color:theme.textSoft,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.bank_name||'—'}</div>
                                                            <div style={{fontSize:11,color:theme.textMute,fontFamily:'monospace',whiteSpace:'nowrap',marginTop:1}}>{p.bank_account_number_masked}</div>
                                                        </div>
                                                    ):(
                                                        <span style={{fontSize:11,color:theme.warning,fontWeight:700,display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                            Not set
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{padding:'13px 16px'}}>
                                                    <div style={{display:'flex',gap:6}}>
                                                        <button onClick={()=>setEditP(p)}
                                                            onMouseEnter={e=>{e.currentTarget.style.borderColor=theme.primary;e.currentTarget.style.color=theme.primary;}}
                                                            onMouseLeave={e=>{e.currentTarget.style.borderColor=theme.border;e.currentTarget.style.color=theme.textSoft;}}
                                                            style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${theme.border}`,background:dark?theme.panelSoft:'#f9fafb',color:theme.textSoft,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>
                                                            <ActionGlyph type="edit" color={theme.textSoft} />
                                                        </button>
                                                        <button onClick={()=>setDeleteP(p)}
                                                            style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${dark?'rgba(248,113,113,0.25)':'#fee2e2'}`,background:dark?theme.dangerSoft:'#fef2f2',color:theme.danger,fontSize:12,cursor:'pointer',transition:'all 0.15s'}}>
                                                            <ActionGlyph type="delete" color={theme.textSoft} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Salary Profile" subtitle="Set up salary, allowances and bank info." icon="➕" dark={dark} theme={theme}>
                <ProfileForm employees={employees} salaryRule={salaryRule} onClose={handleFormClose} dark={dark} theme={theme}/>
            </Modal>
            <Modal open={!!editP} onClose={()=>setEditP(null)} title="Edit Salary Profile" subtitle="Update salary, allowances or bank info." icon="✏️" dark={dark} theme={theme}>
                {editP&&<ProfileForm key={editP.id} employees={employees} salaryRule={salaryRule} editProfile={editP} onClose={handleFormClose} dark={dark} theme={theme}/>}
            </Modal>
            <Modal open={!!deleteP} onClose={()=>setDeleteP(null)} title="Remove Profile" subtitle="This will deactivate the salary profile." icon="🗑️" width={440} dark={dark} theme={theme}>
                <DeleteConfirm profile={deleteP} onClose={()=>setDeleteP(null)} onConfirm={handleDelete} loading={deleting} dark={dark} theme={theme}/>
            </Modal>
        </AppLayout>
    );
}