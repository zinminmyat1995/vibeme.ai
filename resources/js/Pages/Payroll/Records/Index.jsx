import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { createPortal } from 'react-dom';

const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const csrf         = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const fmt          = (v, code = '') => `${code ? code+' ' : ''}${Number(v??0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`.trim();
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

// ─── Dark mode hook ────────────────────────────────────────────
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

// ─── Theme tokens ──────────────────────────────────────────────
function getTheme(dark) {
    if (dark) return {
        bg:           '#0f172a',
        surface:      '#1e293b',
        surfaceSoft:  'rgba(255,255,255,0.04)',
        border:       'rgba(148,163,184,0.12)',
        borderMed:    'rgba(148,163,184,0.2)',
        text:         '#f8fafc',
        textSoft:     '#cbd5e1',
        textMute:     '#64748b',
        inputBg:      'rgba(255,255,255,0.06)',
        inputBorder:  'rgba(148,163,184,0.18)',
        tableHead:    'rgba(255,255,255,0.03)',
        rowAlt:       'rgba(255,255,255,0.02)',
        rowHover:     'rgba(255,255,255,0.04)',
        shadow:       '0 1px 3px rgba(0,0,0,0.3)',
        primary:      '#8b5cf6',
        primarySoft:  'rgba(139,92,246,0.16)',
        success:      '#34d399',
        successSoft:  'rgba(52,211,153,0.14)',
        warning:      '#fbbf24',
        warningSoft:  'rgba(251,191,36,0.14)',
        danger:       '#f87171',
        dangerSoft:   'rgba(248,113,113,0.14)',
        menuBg:       'linear-gradient(180deg,rgba(15,23,42,0.99) 0%,rgba(10,18,36,0.99) 100%)',
    };
    return {
        bg:           '#f8fafc',
        surface:      '#ffffff',
        surfaceSoft:  '#f9fafb',
        border:       '#e5e7eb',
        borderMed:    '#d1d5db',
        text:         '#111827',
        textSoft:     '#374151',
        textMute:     '#9ca3af',
        inputBg:      '#ffffff',
        inputBorder:  '#e5e7eb',
        tableHead:    '#f9fafb',
        rowAlt:       '#fafafa',
        rowHover:     '#fafbff',
        shadow:       '0 1px 3px rgba(0,0,0,0.04)',
        primary:      '#7c3aed',
        primarySoft:  '#ede9fe',
        success:      '#059669',
        successSoft:  '#d1fae5',
        warning:      '#d97706',
        warningSoft:  '#fef3c7',
        danger:       '#dc2626',
        dangerSoft:   '#fef2f2',
        menuBg:       '#ffffff',
    };
}

// ─── Premium Select (portal-based, no native <select>) ─────────
function PremiumSelect({ options = [], value = '', onChange, placeholder = 'Select…', disabled = false, width = 'auto', zIndex = 3000, dark, theme }) {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
    const triggerRef      = useRef(null);
    const menuRef         = useRef(null);
    const selected        = options.find(o => String(o.value) === String(value) && !o.disabled);

    useEffect(() => {
        const h = e => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    function handleOpen() {
        if (disabled) return;
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            const menuH = Math.min(options.length * 40 + 12, 260);
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow < menuH
                ? rect.top + window.scrollY - menuH - 4
                : rect.bottom + window.scrollY + 4;
            setPos({ top, left: rect.left + window.scrollX, width: rect.width });
        }
        setOpen(v => !v);
    }

    const triggerBg = dark
        ? 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.04) 100%)'
        : 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)';

    return (
        <>
            <button
                ref={triggerRef} type="button" onClick={handleOpen}
                style={{
                    width, height: 38, padding: '0 12px',
                    borderRadius: 8,
                    border: `1.5px solid ${open ? theme.primary : theme.inputBorder}`,
                    background: disabled ? theme.surfaceSoft : triggerBg,
                    color: selected ? theme.text : theme.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: selected ? 600 : 400,
                    boxShadow: open ? `0 0 0 3px ${dark ? 'rgba(139,92,246,0.18)' : 'rgba(124,58,237,0.12)'}` : 'none',
                    transition: 'all 0.16s', opacity: disabled ? 0.5 : 1, outline: 'none',
                    fontFamily: 'inherit',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected?.label ?? placeholder}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5"
                    style={{ flexShrink: 0, transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={menuRef} style={{
                    position: 'absolute', top: pos.top, left: pos.left, width: pos.width,
                    zIndex,
                    background: theme.menuBg,
                    border: `1px solid ${theme.borderMed}`,
                    borderRadius: 10,
                    boxShadow: dark
                        ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
                        : '0 16px 40px rgba(15,23,42,0.14)',
                    overflow: 'hidden',
                    animation: 'prDropIn 0.15s ease',
                    backdropFilter: dark ? 'blur(20px)' : 'none',
                }}>
                    <div style={{ maxHeight: 260, overflowY: 'auto', padding: '4px' }}>
                        {options.map(opt => {
                            const isSel = String(opt.value) === String(value);
                            return (
                                <button key={opt.value} type="button"
                                    onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                                    style={{
                                        width: '100%', padding: '8px 11px', border: 'none', borderRadius: 7,
                                        background: isSel ? (dark ? theme.primarySoft : '#ede9fe') : 'transparent',
                                        color: isSel ? theme.primary : opt.disabled ? theme.textMute : theme.text,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                        fontSize: 13, fontWeight: isSel ? 700 : 500,
                                        textAlign: 'left', marginBottom: 1,
                                        opacity: opt.disabled ? 0.45 : 1,
                                        transition: 'background 0.1s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => { if (!isSel && !opt.disabled) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f5f3ff'; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span>{opt.label}</span>
                                    {isSel && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3">
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

function Toast({ msg, type, onClose, dark, theme }) {
    useEffect(() => { if (msg) { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); } }, [msg]);
    if (!msg) return null;
    const e = type === 'error';
    return (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: e ? theme.dangerSoft : theme.successSoft, border:`1px solid ${e ? (dark?'rgba(248,113,113,0.35)':'#fca5a5') : (dark?'rgba(52,211,153,0.35)':'#86efac')}`, borderRadius:12, padding:'12px 16px', color: e ? theme.danger : theme.success, fontSize:13, fontWeight:600, maxWidth:360, boxShadow:'0 8px 30px rgba(0,0,0,.12)', display:'flex', alignItems:'center', gap:10, animation:'prSlideIn 0.2s ease' }}>
            <span style={{ fontSize:16 }}>{e ? '❌' : '✅'}</span>
            <span style={{ flex:1 }}>{msg}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, lineHeight:1, color:'inherit', opacity:0.6 }}>×</button>
        </div>
    );
}

function Spinner({ color='#7c3aed', size=14 }) {
    return <div style={{ width:size, height:size, border:`2px solid ${color}33`, borderTopColor:color, borderRadius:'50%', animation:'prSpin 0.7s linear infinite', flexShrink:0 }} />;
}

function StatusPill({ status, dark }) {
    const c = {
        draft:      { label:'Draft',      bg: dark?'rgba(107,114,128,0.18)':'#f3f4f6', color: dark?'#9ca3af':'#6b7280' },
        calculated: { label:'Calculated', bg: dark?'rgba(29,78,216,0.18)':'#dbeafe',   color: dark?'#93c5fd':'#1d4ed8' },
        approved:   { label:'Approved',   bg: dark?'rgba(52,211,153,0.16)':'#d1fae5',  color: dark?'#34d399':'#059669' },
        confirmed:  { label:'Confirmed',  bg: dark?'rgba(139,92,246,0.18)':'#ede9fe',  color: dark?'#a78bfa':'#7c3aed' },
        paid:       { label:'Paid',       bg: dark?'rgba(251,191,36,0.16)':'#fef3c7',  color: dark?'#fbbf24':'#d97706' },
    }[status] ?? { label:'Draft', bg: dark?'rgba(107,114,128,0.18)':'#f3f4f6', color: dark?'#9ca3af':'#6b7280' };
    return <span style={{ fontSize:10, fontWeight:700, background:c.bg, color:c.color, borderRadius:99, padding:'3px 8px', whiteSpace:'nowrap' }}>{c.label}</span>;
}

function Modal({ title, children, onClose, theme }) {
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background: theme.surface, borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', border:`1px solid ${theme.border}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${theme.border}`, flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:theme.text }}>{title}</div>
                    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:theme.textMute, lineHeight:1 }}>×</button>
                </div>
                <div style={{ padding:'16px 20px 20px', overflowY:'auto', flex:1 }}>{children}</div>
            </div>
        </div>
    );
}

function SectionHead({ label, theme }) {
    return <div style={{ padding:'5px 0 4px', fontSize:10, fontWeight:800, color:theme.textMute, letterSpacing:'1.5px', marginTop:10, borderBottom:`1px solid ${theme.border}` }}>{label}</div>;
}
function Row({ label, val, color, theme }) {
    return (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${theme.border}` }}>
            <span style={{ fontSize:12, color:theme.textMute, fontWeight:600, flex:1, marginRight:12 }}>{label}</span>
            <span style={{ fontSize:12, fontWeight:700, color: color||theme.text, flexShrink:0 }}>{val}</span>
        </div>
    );
}

function fmtHours(h) {
    const hrs = Math.floor(h);
    const min = Math.round((h - hrs) * 60);
    if (hrs > 0 && min > 0) return `${hrs}h ${min}min`;
    if (hrs > 0) return `${hrs}h`;
    if (min > 0) return `${min}min`;
    return '0';
}
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
            <div style={{ background: theme.surface, borderRadius:18, width:'100%', maxWidth:420, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.3)', overflow:'hidden', border:`1px solid ${theme.border}` }}>
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
                <div className="ex-hide" style={{ overflowY:'auto', padding:'14px 18px 18px', flex:1 }}>{children}</div>
            </div>
        </div>
    );
}

function ConfirmActionModal({ open, title='Confirm Action', message, confirmText='Confirm', cancelText='Cancel', tone='success', loading=false, onConfirm, onClose }) {
    if (!open) return null;
    const tones = {
        success: { grad:'linear-gradient(135deg,#059669 0%,#047857 100%)', soft:'#ecfdf5', border:'#a7f3d0', iconBg:'rgba(255,255,255,0.18)', confirmBg:'#059669' },
        danger:  { grad:'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)', soft:'#fef2f2', border:'#fecaca', iconBg:'rgba(255,255,255,0.18)', confirmBg:'#dc2626' },
        purple:  { grad:'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)', soft:'#faf5ff', border:'#ddd6fe', iconBg:'rgba(255,255,255,0.18)', confirmBg:'#7c3aed' },
    };
    const ui = tones[tone] || tones.success;
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.55)', backdropFilter:'blur(4px)', zIndex:11000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ width:'100%', maxWidth:460, background:'#fff', borderRadius:22, overflow:'hidden', boxShadow:'0 30px 90px rgba(0,0,0,0.28)', animation:'prFadeIn 0.18s ease' }}>
                <div style={{ background:ui.grad, padding:'22px 22px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                            <div style={{ width:42, height:42, borderRadius:12, background:ui.iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, flexShrink:0 }}>✓</div>
                            <div>
                                <div style={{ fontSize:11, color:'rgba(255,255,255,0.68)', fontWeight:700, letterSpacing:'0.9px', textTransform:'uppercase', marginBottom:4 }}>Payroll Confirmation</div>
                                <div style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.2px' }}>{title}</div>
                            </div>
                        </div>
                        <button onClick={onClose} disabled={loading} style={{ background:'rgba(255,255,255,0.14)', border:'none', borderRadius:10, width:32, height:32, cursor:loading?'not-allowed':'pointer', color:'#fff', fontSize:18, lineHeight:1, flexShrink:0, opacity:loading?0.5:1 }}>×</button>
                    </div>
                </div>
                <div style={{ padding:'20px 22px 22px' }}>
                    <div style={{ background:ui.soft, border:`1px solid ${ui.border}`, borderRadius:16, padding:'14px 16px', marginBottom:18 }}>
                        <div style={{ fontSize:13, color:'#374151', lineHeight:1.7, fontWeight:500 }}>{message}</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
                        <button onClick={onClose} disabled={loading} style={{ padding:'10px 18px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'#fff', color:loading?'#9ca3af':'#374151', fontSize:13, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'inherit' }}>{cancelText}</button>
                        <button onClick={onConfirm} disabled={loading} style={{ padding:'10px 18px', borderRadius:12, border:'none', background:loading?`${ui.confirmBg}99`:ui.confirmBg, color:'#fff', fontSize:13, fontWeight:800, cursor:loading?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 10px 24px rgba(0,0,0,0.14)', fontFamily:'inherit' }}>
                            {loading && <Spinner color="#fff" size={13}/>}
                            {loading ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SalaryDetailModal({ detail, curr, onApprove, onClose, theme, dark }) {
    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,7,46,0.55)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background: theme.surface, borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.3)', overflow:'hidden', border:`1px solid ${theme.border}` }}>
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
    const [expensePop, setExpensePop] = React.useState(false);
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

                {(detail.expense_reimbursement ?? 0) > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:`1px solid ${rowBdr}`, background: rowBg }}>
                        <span style={{ fontSize:12, color: lblClr, fontWeight:500 }}>
                            Expense Reimbursement
                        </span>
                        <span
                            onClick={() => setExpensePop(true)}
                            style={{ fontSize:12, fontWeight:600, color:'#0284c7', cursor:'pointer' }}
                        >
                            + {fmt(detail.expense_reimbursement, curr)}
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

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                {detail.status !== 'approved' && detail.status !== 'confirmed' && (
                    <button onClick={() => onApprove(detail)} style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'#059669', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Approve</button>
                )}
                <button onClick={onClose} style={{ padding:'10px 22px', borderRadius:10, border:`1.5px solid ${theme.border}`, background: theme.surface, color:theme.textSoft, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Close</button>
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

            {expensePop && (
                <MiniModal title="Expense Reimbursement" subtitle="Approved Expenses" icon="🧾" onClose={() => setExpensePop(false)} theme={theme}>
                    {(detail.expense_details ?? []).length === 0 ? (
                        <p style={{ fontSize:12, color: theme.textMute }}>No expense details.</p>
                    ) : (
                        (detail.expense_details ?? []).map((e, i) => (
                            <div key={e.id ?? i} style={{ padding:'12px 0', borderBottom:`1px solid ${theme.border}` }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                                    <div style={{ fontWeight:700, fontSize:13, color: theme.text }}>{e.title}</div>
                                    <span style={{ fontSize:13, fontWeight:700, color:'#0284c7', flexShrink:0, marginLeft:8 }}>
                                        + {fmt(e.amount, e.currency)}
                                    </span>
                                </div>
                                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                                    <span style={{ fontSize:10, background: dark?'rgba(14,165,233,0.18)':'#e0f2fe', color: dark?'#38bdf8':'#0284c7', borderRadius:99, padding:'2px 8px', fontWeight:700, textTransform:'capitalize' }}>
                                        {e.category}
                                    </span>
                                    <span style={{ fontSize:11, color: theme.textMute }}>📅 {e.expense_date}</span>
                                </div>
                                {e.description && (
                                    <div style={{ fontSize:11, color: theme.textMute, marginTop:4, lineHeight:1.5 }}>{e.description}</div>
                                )}
                            </div>
                        ))
                    )}
                    <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${theme.border}`, display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, fontWeight:700, color: theme.textMute }}>Total Reimbursement</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#0284c7' }}>+ {fmt(detail.expense_reimbursement ?? 0, curr)}</span>
                    </div>
                </MiniModal>
            )}
        </div>
    );
}

function PeriodBar({ salaryRule, periodTemplates, value, onChange, dark, theme }) {
    const cycle = salaryRule?.pay_cycle ?? 'monthly';
    const count = cycle==='semi_monthly'?2:cycle==='ten_day'?3:1;
    const now   = new Date();
    const years = Array.from({length:3},(_,i)=>now.getFullYear()-1+i);
    const sel   = { year:now.getFullYear(), month:now.getMonth()+1, period_number:1, ...value };
    const set   = (k,v) => onChange({...sel,[k]:Number(v)});

    const yearOpts   = years.map(y=>({ value:y, label:String(y) }));
    const monthOpts  = MONTHS.map((m,i)=>({ value:i+1, label:m }));
    const periodOpts = Array.from({length:count},(_,i)=>({ value:i+1, label:`Period ${i+1}` }));

    // ── Period date range တွက် (getPeriodRange logic နဲ့ ကိုက်ညီ) ──
    const getPeriodLabel = () => {
        const { year, month, period_number: pNum } = sel;
        const totalPeriods = count;

        const getPDay = (n) => {
            const t = periodTemplates.find(p => p.period_number === n);
            return t ? t.day : (cycle === 'semi_monthly' ? (n===1?12:25) : cycle === 'ten_day' ? n*10 : 25);
        };

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear  = month === 1 ? year - 1 : year;
        const prevMonthDays = new Date(prevYear, prevMonth, 0).getDate();
        const thisMonthDays = new Date(year, month, 0).getDate();

        const clampBase = (d) => Math.min(d, prevMonthDays);
        const clampReq  = (d) => Math.min(d, thisMonthDays);

        const fmt = (y, m, d) => {
            const date = new Date(y, m-1, d);
            return date.toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
        };

        let startD, startM, startY, endD, endM, endY;

        if (totalPeriods === 1) {
            const p1Day = getPDay(1);
            startD = clampBase(p1Day) + 1; startM = prevMonth; startY = prevYear;
            endD   = clampReq(p1Day);      endM   = month;      endY   = year;
            if (startD > prevMonthDays) { startD = 1; startM = month; startY = year; }
        } else if (pNum === totalPeriods) {
            const prevDay = getPDay(totalPeriods - 1);
            const thisDay = getPDay(totalPeriods);
            startD = clampBase(prevDay) + 1; startM = prevMonth; startY = prevYear;
            endD   = clampReq(thisDay);      endM   = month;      endY   = year;
            if (startD > prevMonthDays) { startD = 1; startM = month; startY = year; }
        } else if (pNum === 1) {
            const lastDay = getPDay(totalPeriods);
            const thisDay = getPDay(1);
            startD = clampBase(lastDay) + 1; startM = prevMonth; startY = prevYear;
            endD   = clampBase(thisDay);     endM   = prevMonth; endY   = prevYear;
            if (startD > prevMonthDays) { startD = 1; }
        } else {
            const prevDay = getPDay(pNum - 1);
            const thisDay = getPDay(pNum);
            startD = clampBase(prevDay) + 1; startM = prevMonth; startY = prevYear;
            endD   = clampBase(thisDay);     endM   = prevMonth; endY   = prevYear;
        }

        return `${fmt(startY, startM, startD)} – ${fmt(endY, endM, endD)}`;
    };

    return (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
            <PremiumSelect options={yearOpts}   value={sel.year}          onChange={v=>set('year',v)}          width={90}  dark={dark} theme={theme}/>
            <PremiumSelect options={monthOpts}  value={sel.month}         onChange={v=>set('month',v)}         width={130} dark={dark} theme={theme}/>
            {count>1 && <PremiumSelect options={periodOpts} value={sel.period_number} onChange={v=>set('period_number',v)} width={120} dark={dark} theme={theme}/>}
            <span style={{ fontSize:12, color:theme.textMute, background:theme.surfaceSoft, padding:'5px 12px', borderRadius:99, fontWeight:600, border:`1px solid ${theme.border}` }}>
                {getPeriodLabel()}
            </span>
            <span style={{ fontSize:12, color:theme.primary, background:theme.primarySoft, padding:'5px 12px', borderRadius:99, fontWeight:700 }}>
                {cycle==='semi_monthly'?'SEMI-MONTHLY':cycle==='ten_day'?'10-DAY':'MONTHLY'}
            </span>
        </div>
    );
}

function AttendanceStep({ period, onToast, onDone, theme }) {
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
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[
                    ['⬇️','Download','Get the Excel template pre-filled with employees & dates'],
                    ['✏️','Fill In/Out','Type or select times (HH:MM). Skip weekends.'],
                    ['⬆️','Upload','Work hours & late minutes auto-calculated on save'],
                ].map(([icon,title,desc],i)=>(
                    <div key={i} style={{ flex:1, display:'flex', gap:10, alignItems:'flex-start', padding:'12px 14px', background:theme.surfaceSoft, borderRadius:10, border:`1px solid ${theme.border}` }}>
                        <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{icon}</span>
                        <div>
                            <div style={{ fontSize:12, fontWeight:700, color:theme.text, marginBottom:2 }}>{title}</div>
                            <div style={{ fontSize:11, color:theme.textMute, lineHeight:1.5 }}>{desc}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom: result ? 16 : 0 }}>
                <button onClick={download} disabled={downloading} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:8, border:'none', background:downloading?'#ddd6fe':'#7c3aed', color:'#fff', fontSize:13, fontWeight:700, cursor:downloading?'not-allowed':'pointer', fontFamily:'inherit' }}>
                    {downloading ? <><Spinner color="#fff" size={13}/>Downloading...</> : <>⬇️ Download Template</>}
                </button>
                <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:8, border:'none', background:uploading?'#d1fae5':'#059669', color:'#fff', fontSize:13, fontWeight:700, cursor:uploading?'not-allowed':'pointer', fontFamily:'inherit' }}>
                    {uploading ? <><Spinner color="#fff" size={13}/>Uploading...</> : <>⬆️ Upload & Save</>}
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={upload} disabled={uploading} style={{ display:'none' }} />
                </label>
            </div>
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

function CalculateStep({ period, periodTemplates, employees, salaryRule, onToast, onDone, dark, theme }) {
    const [mode,    setMode]    = useState('all');
    const [selEmp,  setSelEmp]  = useState('');
    const [prog,    setProg]    = useState([]);
    const [running, setRunning] = useState(false);
    const [stopped, setStopped] = useState(null);
    const [loading, setLoading] = useState(false);
    const tmpl      = periodTemplates.find(p=>p.period_number===period.period_number);
    const doneCount = prog.filter(p=>p.status==='done').length;

    const empOptions = [
        { value:'', label:'— Select Employee —', disabled:true },
        ...employees.map(e=>({ value:e.id, label:e.name }))
    ];

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
        else if (evt.type==='complete') { onToast(`All ${evt.done} employees calculated!`,'success'); onDone('calculate'); }
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

    const btnBase = { padding:'9px 18px', borderRadius:8, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, fontFamily:'inherit' };

    return (
        <div>
            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[['all','👥 All Employees'],['single','👤 Single Employee']].map(([m,lbl])=>(
                    <button key={m} onClick={()=>setMode(m)} style={{ padding:'8px 18px', borderRadius:99, border:'1.5px solid', borderColor:mode===m?'#7c3aed':theme.border, background:mode===m?'#7c3aed':theme.surface, color:mode===m?'#fff':theme.textMute, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}>{lbl}</button>
                ))}
            </div>

            {mode==='single' && (
                <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
                    <PremiumSelect
                        options={empOptions}
                        value={selEmp}
                        onChange={v => setSelEmp(v)}
                        placeholder="— Select Employee —"
                        width={220}
                        dark={dark}
                        theme={theme}
                    />
                    <button onClick={handleSingle} disabled={loading||!selEmp} style={{ ...btnBase, background:selEmp?'#7c3aed':'#e5e7eb', color:selEmp?'#fff':'#9ca3af', cursor:selEmp?'pointer':'not-allowed', flexShrink:0 }}>
                        {loading?<><Spinner color="#fff"/>Calculating...</>:'▶ Calculate'}
                    </button>
                </div>
            )}

            {mode==='all' && (
                <div style={{ marginBottom:16 }}>
                    {!running&&!stopped&&<button onClick={()=>startAll()} disabled={!tmpl?.id||employees.length===0} style={{ ...btnBase, background:'#7c3aed', color:'#fff', opacity:!tmpl?.id?0.5:1 }}>▶ Calculate All ({employees.length} employees)</button>}
                    {running && (
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

            {prog.length>0 && (
                <div style={{ border:`1px solid ${theme.border}`, borderRadius:10, overflow:'hidden' }}>
                    {prog.map((p,i)=>(
                        <div key={p.user_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:i%2===0?theme.surface:theme.surfaceSoft, borderBottom:i<prog.length-1?`1px solid ${theme.border}`:'none' }}>
                            <span style={{ fontSize:15, width:20, textAlign:'center' }}>{p.status==='calculating'?'⏳':p.status==='done'?'✅':'❌'}</span>
                            <span style={{ flex:1, fontSize:13, fontWeight:600, color:theme.textSoft }}>{p.name}</span>
                            {p.status==='calculating'&&<span style={{ fontSize:11, color:'#7c3aed', fontWeight:700 }}>Calculating...</span>}
                            {p.status==='done'&&p.net_salary!==undefined&&<span style={{ fontSize:12, fontWeight:800, color:'#059669' }}>{fmt(p.net_salary, salaryRule?.currency_code)}</span>}
                            {p.status==='error'&&<span style={{ fontSize:11, color:'#dc2626' }}>{p.error}</span>}
                        </div>
                    ))}
                </div>
            )}

            {!tmpl?.id && <div style={{ padding:'12px 14px', background:'#fffbeb', borderRadius:8, border:'1px solid #fde68a', fontSize:12, color:'#92400e' }}>⚠️ No payroll period configured. Go to HR Policy → General Settings.</div>}
        </div>
    );
}

function PreviewStep({ period, periodTemplates, salaryRule, onToast, dark, theme }) {
    const [loading,    setLoading]    = useState(false);
    const [records,    setRecords]    = useState([]);
    const [summary,    setSummary]    = useState(null);
    const [detail,     setDetail]     = useState(null);
    const [approving,  setApproving]  = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmState, setConfirmState] = useState({ open:false, type:null, record:null });

    const tmpl = periodTemplates.find(p=>p.period_number===period.period_number);
    const curr = salaryRule?.currency_code ?? '';
    const allConfirmed = records.length > 0 && records.every(r => r.status === 'confirmed');

    const load = useCallback(async()=>{
        if(!tmpl?.id) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({period_id:tmpl.id,year:period.year,month:period.month});
            const res    = await fetch(`/payroll/records/preview?${params}`);
            const data   = await res.json();
            setRecords(data.records??[]);
            setSummary(data.summary??null);
        } catch { onToast('Failed to load records','error'); }
        finally { setLoading(false); }
    },[tmpl?.id, period.year, period.month]);

    useEffect(()=>{load();},[load]);

    const openApproveAllConfirm = () => { if (!tmpl?.id || records.length === 0) return; setConfirmState({ open:true, type:'all', record:null }); };
    const openApproveOneConfirm = (r) => { setConfirmState({ open:true, type:'single', record:r }); };

    const handleConfirmApprove = async () => {
        if (!confirmState.open) return;
        if (confirmState.type === 'all') {
            if (!tmpl?.id) return;
            setApproving(true);
            try {
                const res = await fetch('/payroll/records/approve-all',{method:'PATCH',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf()},body:JSON.stringify({period_id:tmpl.id,year:period.year,month:period.month})});
                const data = await res.json();
                if (!res.ok) throw new Error(data.message ?? 'Approve all failed');
                onToast(data.message, 'success');
                setConfirmState({ open:false, type:null, record:null });
                load();
            } catch(e) { onToast(e.message,'error'); }
            finally { setApproving(false); }
            return;
        }
        if (confirmState.type === 'finalize') {
            if (!tmpl?.id) return;
            setConfirming(true);
            try {
                const res = await fetch('/payroll/records/confirm-all',{method:'PATCH',headers:{'Content-Type':'application/json','X-CSRF-TOKEN':csrf()},body:JSON.stringify({period_id:tmpl.id,year:period.year,month:period.month})});
                const data = await res.json();
                if (!res.ok) throw new Error(data.message ?? 'Confirm failed');
                onToast(data.message, 'success');
                setConfirmState({ open:false, type:null, record:null });
                load();
            } catch(e) { onToast(e.message,'error'); }
            finally { setConfirming(false); }
            return;
        }
        if (confirmState.type === 'single' && confirmState.record) {
            setApproving(true);
            try {
                const r = confirmState.record;
                const res = await fetch(`/payroll/records/${r.id}/approve`,{method:'PATCH',headers:{'X-CSRF-TOKEN':csrf()}});
                const data = await res.json();
                if (!res.ok) throw new Error(data.message ?? 'Approve failed');
                onToast(`${r.name} approved.`, 'success');
                setConfirmState({ open:false, type:null, record:null });
                setDetail(null);
                load();
            } catch(e) { onToast(e.message,'error'); }
            finally { setApproving(false); }
        }
    };

    return (
        <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
                <span style={{ fontSize:12, color:theme.textMute, fontWeight:600 }}>
                    {records.length} employees · {MONTHS_SHORT[period.month-1]} {period.year}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                    <button onClick={load} disabled={loading} style={{ padding:'7px 14px', borderRadius:8, border:`1.5px solid ${theme.border}`, background:theme.surface, color:theme.textMute, fontSize:12, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                        🔄 Refresh
                    </button>
                    {records.length>0 && records.some(r=>r.status!=='approved' && r.status!=='confirmed' && r.status!=='paid') && (
                        <button onClick={openApproveAllConfirm} disabled={approving} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#059669', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                            {approving?<><Spinner color="#fff" size={12}/>Approving...</>:'✅ Approve All'}
                        </button>
                    )}
                    {records.length>0 && records.every(r=>r.status==='approved') && (
                        <button onClick={()=>setConfirmState({ open:true, type:'finalize', record:null })} disabled={confirming} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                            {confirming?<><Spinner color="#fff" size={12}/>Confirming...</>:'🔒 Confirm & Finalize'}
                        </button>
                    )}
                </div>
            </div>

            {loading
                ? <div style={{ textAlign:'center', padding:48, display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'#7c3aed' }}><Spinner size={28}/><span style={{ fontSize:13, fontWeight:600 }}>Loading records...</span></div>
                : records.length===0
                    ? <div style={{ textAlign:'center', padding:48, color:theme.textMute, fontSize:13 }}>No records yet. Calculate salary first (Step 2).</div>
                    : (
                        <div style={{ overflowX:'auto', borderRadius:12, border:`1px solid ${theme.border}`, boxShadow:theme.shadow, scrollbarWidth:'none', msOverflowStyle:'none' }}
                             className="pr-hide-scroll">
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                                <thead>
                                    <tr style={{ background:theme.tableHead, borderBottom:`2px solid ${theme.border}` }}>
                                        {['Employee','Present / WD','Leave','Late','OT','Base','Allowances','Deductions','Bonus','Net Salary','Status',''].map(h=>(
                                            <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:800, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r,i)=>(
                                        <tr key={r.id} className="pr-row" style={{ background:i%2===0?theme.surface:theme.rowAlt, borderBottom:`1px solid ${theme.border}` }}>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                <div style={{ fontWeight:700, color:theme.text, fontSize:13 }}>{r.name}</div>
                                                <div style={{ fontSize:10, color:theme.textMute, marginTop:1 }}>{r.department}</div>
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                <span style={{ fontWeight:700, color:'#059669' }}>{r.present_days}</span>
                                                <span style={{ color:theme.textMute }}> / {r.working_days}</span>
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                {(r.leave_days_paid??0)+(r.leave_days_unpaid??0)>0
                                                    ? <span style={{ fontSize:11, color:'#7c3aed', fontWeight:600 }}>{((r.leave_days_paid??0)+(r.leave_days_unpaid??0)).toFixed(1)}d</span>
                                                    : <span style={{ color:theme.border }}>—</span>}
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                {r.late_minutes_total>0 ? <span style={{ color:'#f59e0b', fontWeight:700, fontSize:11 }}>{r.late_minutes_total}m</span> : <span style={{ color:theme.border }}>—</span>}
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                {r.overtime_hours>0 ? <span style={{ color:'#7c3aed', fontWeight:600, fontSize:11 }}>{fmtHours(r.overtime_hours)}</span> : <span style={{ color:theme.border }}>—</span>}
                                            </td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color:theme.textSoft }}>{fmtC(r.base_salary, curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color: r.total_allowances>0?'#059669':theme.border }}>{fmtC(r.total_allowances, curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color: r.total_deductions>0?'#dc2626':theme.border }}>{fmtC(r.total_deductions, curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontSize:12, color:theme.textSoft }}>{fmtC(r.bonus_amount, curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle', fontWeight:800, fontSize:13, color:'#7c3aed' }}>{fmt(r.net_salary,curr)}</td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}><StatusPill status={r.status} dark={dark}/></td>
                                            <td style={{ padding:'10px 12px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                                                <div style={{ display:'flex', gap:4 }}>
                                                    <button onClick={()=>setDetail(r)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:theme.primarySoft, color:'#7c3aed', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Detail</button>
                                                    {r.status !== 'approved' && r.status !== 'confirmed' && r.status !== 'paid' && (
                                                        <button onClick={()=>openApproveOneConfirm(r)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:theme.successSoft, color:'#059669', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Approve</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
            }

            {detail && (
                <SalaryDetailModal detail={detail} curr={curr} onApprove={openApproveOneConfirm} onClose={()=>setDetail(null)} theme={theme} dark={dark}/>
            )}

            <ConfirmActionModal
                open={confirmState.open}
                tone={confirmState.type === 'finalize' ? 'purple' : 'success'}
                loading={confirmState.type === 'finalize' ? confirming : approving}
                title={confirmState.type==='all'?'Approve All Payroll Records':confirmState.type==='finalize'?'Confirm & Finalize Payroll':'Approve Employee Salary'}
                message={confirmState.type==='all'?`Are you sure you want to approve all ${records.length} payroll records for ${MONTHS_SHORT[period.month-1]} ${period.year} Period ${period.period_number}? This action cannot be undone.`:confirmState.type==='finalize'?`This will lock all ${records.length} payroll records for ${MONTHS_SHORT[period.month-1]} ${period.year} Period ${period.period_number}. Employees will be able to view their payslips. This action cannot be undone.`:`Are you sure you want to approve salary for ${confirmState.record?.name||'this employee'}? This action cannot be undone.`}
                confirmText={confirmState.type==='all'?'Yes, Approve All':confirmState.type==='finalize'?'🔒 Yes, Confirm & Lock':'Yes, Approve'}
                cancelText="Cancel"
                onClose={() => { if (!approving && !confirming) setConfirmState({ open:false, type:null, record:null }); }}
                onConfirm={handleConfirmApprove}
            />
        </div>
    );
}

export default function PayrollRecordsIndex({ salaryRule, periodTemplates, employees }) {
    const dark  = useReactiveTheme();
    const theme = React.useMemo(() => getTheme(dark), [dark]);

    const now = new Date();
    const [period,    setPeriod]    = useState({ year:now.getFullYear(), month:now.getMonth()+1, period_number:1 });
    const [activeKey, setActiveKey] = useState('attendance');
    const [completed, setCompleted] = useState(new Set());
    const [calcVer,   setCalcVer]   = useState(0);

    const showToast = (msg, type = 'success') => {
        window.dispatchEvent(
            new CustomEvent('global-toast', {
                detail: { message: msg, type }
            })
        );
    };

    const handleDone = (key) => {
        setCompleted(prev => new Set([...prev, key]));
        if (key === 'attendance') setActiveKey('calculate');
        if (key === 'calculate')  setActiveKey('preview');
    };

    const stepContent = {
        attendance: <AttendanceStep period={period} onToast={showToast} onDone={handleDone} theme={theme}/>,
        calculate:  <CalculateStep period={period} periodTemplates={periodTemplates} employees={employees} salaryRule={salaryRule} onToast={showToast} onDone={(k)=>{ handleDone(k); setCalcVer(v=>v+1); }} dark={dark} theme={theme}/>,
        preview:    <PreviewStep key={`${period.year}-${period.month}-${period.period_number}-${calcVer}`} period={period} periodTemplates={periodTemplates} salaryRule={salaryRule} onToast={showToast} dark={dark} theme={theme}/>,
    };

    return (
        <AppLayout title="Payroll">
            <Head title="Payroll" />
            <style>{`
                @keyframes prSpin    { to { transform:rotate(360deg) } }
                @keyframes prSlideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes prFadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes prDropIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
                .pr-step-btn:hover { background: ${dark?'rgba(124,58,237,0.08)':'#faf5ff'} !important; }
                .pr-row:hover td   { background: ${dark?'rgba(255,255,255,0.03)':'#fafbff'} !important; }
                .pr-hide-scroll::-webkit-scrollbar { display:none; }
                .sd-hide-scroll::-webkit-scrollbar { display:none; }
                .ex-hide::-webkit-scrollbar { display:none; }
                .ex-hide { scrollbar-width:none; -ms-overflow-style:none; }
            `}</style>


            <div style={{ background: dark ? '#0b1324' : '#f8fafc', minHeight:'100vh' }}>
                <div style={{ paddingBottom:32 }}>
                    <div>
                        {/* Period bar */}
                        <div style={{ background:theme.surface, borderRadius:14, padding:'14px 20px', border:`1px solid ${theme.border}`, marginBottom:16, boxShadow:theme.shadow, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, fontWeight:800, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.8px', flexShrink:0 }}>Pay Period</span>
                            <PeriodBar salaryRule={salaryRule} periodTemplates={periodTemplates} value={period} onChange={setPeriod} dark={dark} theme={theme}/>
                        </div>

                        <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                            {/* Sidebar */}
                            <div style={{ width:220, flexShrink:0, background:theme.surface, borderRadius:14, border:`1px solid ${theme.border}`, boxShadow:theme.shadow, overflow:'hidden' }}>
                                <div style={{ padding:'14px 16px 10px', borderBottom:`1px solid ${theme.border}` }}>
                                    <div style={{ fontSize:10, fontWeight:800, color:theme.textMute, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:2 }}>Workflow</div>
                                    <div style={{ fontSize:11, color:theme.textMute }}>{completed.size}/{STEPS.length} steps done</div>
                                </div>

                                {STEPS.map((step, idx) => {
                                    const isActive = activeKey === step.key;
                                    const isDone   = completed.has(step.key);
                                    return (
                                        <button key={step.key} className="pr-step-btn"
                                            onClick={() => setActiveKey(step.key)}
                                            style={{
                                                width:'100%', display:'flex', alignItems:'center', gap:12,
                                                padding:'13px 16px', border:'none', cursor:'pointer', textAlign:'left',
                                                borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                                                borderBottom: idx < STEPS.length-1 ? `1px solid ${theme.border}` : 'none',
                                                background: isActive ? (dark?'rgba(124,58,237,0.08)':'#faf5ff') : theme.surface,
                                                transition:'all 0.15s', fontFamily:'inherit',
                                            }}>
                                            <div style={{
                                                width:34, height:34, borderRadius:'50%', flexShrink:0,
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                background: isDone ? theme.successSoft : isActive ? theme.primarySoft : theme.surfaceSoft,
                                                border: isActive ? '2px solid #7c3aed' : isDone ? '2px solid #10b981' : `2px solid transparent`,
                                                transition:'all 0.2s',
                                            }}>
                                                {isDone
                                                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                    : <span style={{ width:14, height:14, display:'block', color: isActive?'#7c3aed':theme.textMute }}>{step.icon}</span>
                                                }
                                            </div>
                                            <div>
                                                <div style={{ fontSize:12, fontWeight:700, color: isActive?'#7c3aed': isDone?'#059669':theme.text, marginBottom:1 }}>
                                                    {idx+1}. {step.label}
                                                </div>
                                                <div style={{ fontSize:10, color:theme.textMute, lineHeight:1.4 }}>
                                                    {isDone ? '✓ Completed' : isActive ? 'In progress...' : step.summary?.split('·')[0]?.trim() ?? ''}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}

                                <div style={{ padding:'12px 16px', borderTop:`1px solid ${theme.border}` }}>
                                    <div style={{ height:4, background:theme.surfaceSoft, borderRadius:99, overflow:'hidden' }}>
                                        <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#7c3aed,#059669)', width:`${(completed.size/STEPS.length)*100}%`, transition:'width 0.4s ease' }}/>
                                    </div>
                                </div>
                            </div>

                            {/* Content panel */}
                            <div style={{ flex:1, minWidth:0, background:theme.surface, borderRadius:14, border:`1px solid ${theme.border}`, boxShadow:theme.shadow, overflow:'hidden' }}>
                                <div style={{ padding:'16px 24px 14px', borderBottom:`1px solid ${theme.border}`, display:'flex', alignItems:'center', gap:14 }}>
                                    <div style={{ width:36, height:36, borderRadius:10, background:theme.primarySoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        <span style={{ width:18, height:18, display:'block', color:'#7c3aed' }}>{STEPS.find(s=>s.key===activeKey)?.icon}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:15, fontWeight:800, color:theme.text }}>{STEPS.find(s=>s.key===activeKey)?.label}</div>
                                        <div style={{ fontSize:11, color:theme.textMute, marginTop:1 }}>{STEPS.find(s=>s.key===activeKey)?.summary}</div>
                                    </div>
                                </div>
                                <div style={{ padding:24, animation:'prFadeIn 0.2s ease' }}>
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