import { useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// ── Theme hook ─────────────────────────────────────────────────
function useTheme() {
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
        panel:       'linear-gradient(180deg, rgba(10,18,36,0.97) 0%, rgba(9,16,32,0.93) 100%)',
        panelSolid:  '#0b1324',
        panelSoft:   'rgba(255,255,255,0.04)',
        panelSofter: 'rgba(255,255,255,0.07)',
        border:      'rgba(148,163,184,0.12)',
        borderFocus: 'rgba(124,58,237,0.5)',
        text:        '#f8fafc',
        textSoft:    '#cbd5e1',
        textMute:    '#64748b',
        primary:     '#7c3aed',
        primarySoft: 'rgba(124,58,237,0.15)',
        primaryHover:'#6d28d9',
        danger:      '#f87171',
        dangerSoft:  'rgba(248,113,113,0.12)',
        success:     '#34d399',
        successSoft: 'rgba(52,211,153,0.12)',
        warning:     '#fbbf24',
        warningSoft: 'rgba(251,191,36,0.12)',
        info:        '#60a5fa',
        infoSoft:    'rgba(96,165,250,0.12)',
        orange:      '#fb923c',
        orangeSoft:  'rgba(251,146,60,0.12)',
        shadow:      '0 8px 32px rgba(0,0,0,0.4)',
        shadowSoft:  '0 2px 12px rgba(0,0,0,0.25)',
        inputBg:     'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148,163,184,0.15)',
        tableHead:   'rgba(255,255,255,0.03)',
        rowHover:    'rgba(255,255,255,0.03)',
        divider:     'rgba(148,163,184,0.08)',
        emptyBorder: 'rgba(148,163,184,0.15)',
    };
    return {
        panel:       'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,255,0.96) 100%)',
        panelSolid:  '#ffffff',
        panelSoft:   '#f8fafc',
        panelSofter: '#f1f5f9',
        border:      'rgba(15,23,42,0.08)',
        borderFocus: 'rgba(124,58,237,0.4)',
        text:        '#0f172a',
        textSoft:    '#475569',
        textMute:    '#94a3b8',
        primary:     '#7c3aed',
        primarySoft: '#f3e8ff',
        primaryHover:'#6d28d9',
        danger:      '#ef4444',
        dangerSoft:  '#fef2f2',
        success:     '#059669',
        successSoft: '#f0fdf4',
        warning:     '#d97706',
        warningSoft: '#fffbeb',
        info:        '#2563eb',
        infoSoft:    '#eff6ff',
        orange:      '#ea580c',
        orangeSoft:  '#fff7ed',
        shadow:      '0 8px 32px rgba(15,23,42,0.1)',
        shadowSoft:  '0 2px 8px rgba(15,23,42,0.06)',
        inputBg:     '#f8fafc',
        inputBorder: '#e2e8f0',
        tableHead:   '#f8fafc',
        rowHover:    '#fafbff',
        divider:     'rgba(15,23,42,0.06)',
        emptyBorder: 'rgba(15,23,42,0.12)',
    };
}

// ── OT constants ──────────────────────────────────────────────
const OT_PRESETS = [
    { title: 'Day Weekday OT',    day_type: 'weekday',        shift_type: 'day',   rate_type: 'multiplier', rate_value: '1.5', emoji: '☀️' },
    { title: 'Night Weekday OT',  day_type: 'weekday',        shift_type: 'night', rate_type: 'multiplier', rate_value: '2.0', emoji: '🌙' },
    { title: 'Day Weekend OT',    day_type: 'weekend',        shift_type: 'day',   rate_type: 'multiplier', rate_value: '2.0', emoji: '🌤️' },
    { title: 'Night Weekend OT',  day_type: 'weekend',        shift_type: 'night', rate_type: 'multiplier', rate_value: '3.0', emoji: '🌃' },
    { title: 'Public Holiday OT', day_type: 'public_holiday', shift_type: 'both',  rate_type: 'multiplier', rate_value: '3.0', emoji: '🎌' },
];

const DAY_TYPE_LABELS  = { weekday: 'Weekday', weekend: 'Weekend', public_holiday: 'Public Holiday' };
const SHIFT_LABELS     = { day: '☀️ Day', night: '🌙 Night', both: '🕐 All Day' };

const defaultForm = { title: '', day_type: '', shift_type: '', rate_type: 'multiplier', rate_value: '', is_active: true };

// ── PremiumSelect ─────────────────────────────────────────────
function PremiumSelect({ options = [], value = '', onChange, placeholder = 'Select...', T, dark, disabled = false, zIndex = 300 }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const menuBg = dark ? T.panelSolid : '#ffffff';

    return (
        <div ref={wrapRef} style={{ position: 'relative', zIndex }}>
            <button type="button" onClick={() => !disabled && setOpen(v => !v)}
                style={{
                    width: '100%', height: 44, padding: '0 14px', borderRadius: 14,
                    border: `1.5px solid ${open ? T.primary : T.inputBorder}`,
                    background: disabled ? T.panelSoft : T.inputBg,
                    color: selected ? T.text : T.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: open ? `0 0 0 3px ${T.primarySoft}` : T.shadowSoft,
                    backdropFilter: 'blur(12px)', transition: 'all 0.18s ease', outline: 'none',
                    opacity: disabled ? 0.6 : 1,
                }}>
                <span style={{ fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? T.text : T.textMute }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', flexShrink: 0 }}>
                    <path d="M4 6L8 10L12 6" stroke={T.textMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                    background: menuBg, border: `1.5px solid ${T.inputBorder}`,
                    borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow,
                    backdropFilter: 'blur(16px)', zIndex: zIndex + 50,
                }}>
                    {options.map((opt, idx) => {
                        const isSel = String(opt.value) === String(value);
                        return (
                            <button key={opt.value} type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    width: '100%', minHeight: 44, padding: '0 14px',
                                    border: 'none', borderBottom: idx < options.length - 1 ? `1px solid ${T.divider}` : 'none',
                                    background: isSel ? (dark ? 'rgba(37,99,235,0.22)' : '#2563eb') : 'transparent',
                                    color: isSel ? '#ffffff' : T.textSoft,
                                    fontSize: 13, fontWeight: isSel ? 800 : 600,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : '#f8fafc'; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                                {isSel ? (
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                ) : <span style={{ width: 13 }}/>}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function OvertimePolicySection({ overtimePolicies }) {
    const dark = useTheme();
    const T    = getTheme(dark);

    const [showForm, setShowForm]         = useState(false);
    const [editingId, setEditingId]       = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);
    const [formErrors, setFormErrors]     = useState({});

    const { data, setData, post, put, processing, reset } = useForm(defaultForm);

    const usedCombinations = overtimePolicies.map(p => `${p.day_type}__${p.shift_type}`);

    const validate = () => {
        const errs = {};
        if (!data.title)      errs.title     = 'Please select an OT type.';
        if (!data.rate_value) errs.rate_value = 'Rate is required.';
        else if (isNaN(data.rate_value) || Number(data.rate_value) < 0)
                              errs.rate_value = 'Enter a valid number.';
        return errs;
    };

    const handlePresetClick = (preset) => { setData({ ...preset, is_active: true }); setFormErrors({}); };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        setFormErrors({});
        if (editingId) {
            put(`/payroll/hr-policy/overtime-policy/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); setEditingId(null); },
                onError: (e) => { if (e.day_type) setFormErrors(p => ({ ...p, title: e.day_type })); },
            });
        } else {
            post('/payroll/hr-policy/overtime-policy', {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); },
                onError: (e) => { if (e.day_type) setFormErrors(p => ({ ...p, title: e.day_type })); },
            });
        }
    };

    const handleEdit = (policy) => {
        setFormErrors({});
        setData({ title: policy.title, day_type: policy.day_type, shift_type: policy.shift_type, rate_type: policy.rate_type, rate_value: policy.rate_value, is_active: !!policy.is_active });
        setEditingId(policy.id);
        setShowForm(true);
    };

    const handleCancel = () => { reset(); setFormErrors({}); setShowForm(false); setEditingId(null); };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/hr-policy/overtime-policy/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => { setDeleting(false); setDeleteTarget(null); },
            onError:   () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    // input style
    const inp = (hasError) => ({
        width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
        fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'all 0.15s', MozAppearance: 'textfield',
        border: `1.5px solid ${hasError ? T.danger : T.inputBorder}`,
        background: hasError ? (dark ? 'rgba(248,113,113,0.08)' : '#fef2f2') : T.inputBg,
        color: T.text,
    });

    // day_type badge colors
    const dayTypeBadge = (type) => {
        if (type === 'public_holiday') return { bg: T.dangerSoft, color: T.danger };
        if (type === 'weekend')        return { bg: T.infoSoft,   color: T.info   };
        return { bg: T.panelSoft, color: T.textSoft };
    };

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            .otp-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
            .otp-row:hover td { background: ${T.rowHover}; }
            .otp-inp:focus { border-color: ${T.borderFocus} !important; box-shadow: 0 0 0 3px ${T.primarySoft} !important; }
            .otp-inp[type=number]::-webkit-outer-spin-button,
            .otp-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            .otp-inp[type=number] { -moz-appearance: textfield; }
            @keyframes otp-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
            .otp-animate { animation: otp-fade 0.2s ease; }
        `}</style>

        <div className="otp-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => !deleting && setDeleteTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}/>
                    <div className="otp-animate" style={{ position: 'relative', background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 28px 24px', boxShadow: T.shadow }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🗑️</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 8 }}>Delete OT Rate</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textAlign: 'center', marginBottom: 4 }}>"{deleteTarget.title}"</div>
                        <div style={{ fontSize: 11, color: T.textMute, textAlign: 'center', marginBottom: 24 }}>This action cannot be undone.</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => !deleting && setDeleteTarget(null)} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                                {deleting ? '⏳ Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            {overtimePolicies.length > 0 ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadowSoft }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: T.tableHead, borderBottom: `1px solid ${T.divider}` }}>
                                {['Title','Applies To','Shift','Rate','Status','Actions'].map(h => (
                                    <th key={h} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMute, textAlign: h === 'Title' ? 'left' : 'center', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {overtimePolicies.map((policy, idx) => {
                                const badge = dayTypeBadge(policy.day_type);
                                const preset = OT_PRESETS.find(p => p.day_type === policy.day_type && p.shift_type === policy.shift_type);
                                return (
                                    <tr key={policy.id} className="otp-row" style={{ borderBottom: idx < overtimePolicies.length - 1 ? `1px solid ${T.divider}` : 'none', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 16 }}>{preset?.emoji || '⏰'}</span>
                                                <span style={{ fontWeight: 700, color: T.text }}>{policy.title}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.color }}>
                                                {DAY_TYPE_LABELS[policy.day_type] ?? policy.day_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.textSoft }}>
                                            {SHIFT_LABELS[policy.shift_type] ?? policy.shift_type}
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <span style={{ fontWeight: 800, color: T.primary, fontSize: 14 }}>
                                                    {policy.rate_type === 'multiplier'
                                                        ? `${Number(policy.rate_value).toFixed(2)}×`
                                                        : Number(policy.rate_value).toLocaleString()}
                                                </span>
                                                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: policy.rate_type === 'multiplier' ? T.primarySoft : T.orangeSoft, color: policy.rate_type === 'multiplier' ? T.primary : T.orange }}>
                                                    {policy.rate_type === 'multiplier' ? 'Multiplier' : 'Flat'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: policy.is_active ? T.successSoft : T.panelSoft, color: policy.is_active ? T.success : T.textMute }}>
                                                {policy.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <button onClick={() => handleEdit(policy)}
                                                    style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = T.panelSofter; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = T.panelSoft; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                    title="Edit">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                                    </svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget(policy)}
                                                    style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.dangerSoft, color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.85'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
                                                    title="Delete">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', borderRadius: 16, border: `1.5px dashed ${T.emptyBorder}`, background: T.panelSoft, textAlign: 'center', gap: 6 }}>
                    <div style={{ fontSize: 32, marginBottom: 4 }}>⏰</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textSoft }}>No overtime rates configured yet</div>
                    <div style={{ fontSize: 11, color: T.textMute }}>Select one of the 5 standard OT types below</div>
                </div>
            )}

            {/* ── Add / Edit Form ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="otp-animate" style={{ borderRadius: 16, border: `1.5px solid ${dark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.2)'}`, background: dark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.03)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Form header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                {editingId ? '✏️' : '➕'}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                                {editingId ? 'Edit OT Rate' : 'Add OT Rate'}
                            </div>
                        </div>
                        <button type="button" onClick={handleCancel} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
                    </div>

                    {/* OT Type Selector */}
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMute, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            Select OT Type
                            {overtimePolicies.length >= 5 && !editingId && (
                                <span style={{ fontSize: 10, color: T.success, fontWeight: 700, background: T.successSoft, padding: '2px 8px', borderRadius: 99 }}>✓ All 5 configured!</span>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                            {OT_PRESETS.map(preset => {
                                const isUsed = usedCombinations.includes(`${preset.day_type}__${preset.shift_type}`)
                                    && !(editingId && data.day_type === preset.day_type && data.shift_type === preset.shift_type);
                                const isSelected = data.day_type === preset.day_type && data.shift_type === preset.shift_type;
                                return (
                                    <button key={preset.title} type="button" disabled={isUsed || processing}
                                        onClick={() => handlePresetClick(preset)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 14px', borderRadius: 14, textAlign: 'left',
                                            border: `1.5px solid ${isSelected ? T.primary : isUsed ? T.border : T.border}`,
                                            background: isSelected ? T.primarySoft : isUsed ? T.panelSoft : T.panelSolid,
                                            cursor: isUsed ? 'not-allowed' : 'pointer',
                                            opacity: isUsed ? 0.4 : 1,
                                            transition: 'all 0.15s',
                                            boxShadow: isSelected ? `0 0 0 3px ${T.primarySoft}` : T.shadowSoft,
                                        }}
                                        onMouseEnter={e => { if (!isUsed && !isSelected) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                        onMouseLeave={e => { if (!isUsed && !isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; } }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                                <span style={{ fontSize: 14 }}>{preset.emoji}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? T.primary : T.text }}>{preset.title}</span>
                                            </div>
                                            <div style={{ fontSize: 10, color: T.textMute, fontWeight: 500 }}>
                                                {DAY_TYPE_LABELS[preset.day_type]} · {SHIFT_LABELS[preset.shift_type]}
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0 }}>
                                            {isUsed && <span style={{ fontSize: 12, color: T.success, fontWeight: 800 }}>✓</span>}
                                            {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary }}/>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {formErrors.title && <ErrMsg msg={formErrors.title} />}
                    </div>

                    {/* Rate section */}
                    {data.title && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {/* Rate Type */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Rate Type</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[
                                        { value: 'multiplier', label: 'Multiplier', hint: 'e.g. 1.5×' },
                                        { value: 'flat',       label: 'Flat Amount', hint: 'e.g. 50,000' },
                                    ].map(opt => {
                                        const isSel = data.rate_type === opt.value;
                                        return (
                                            <label key={opt.value} onClick={() => !processing && setData('rate_type', opt.value)}
                                                style={{ flex: 1, padding: '10px 12px', borderRadius: 12, cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.15s', border: `1.5px solid ${isSel ? T.primary : T.border}`, background: isSel ? T.primarySoft : T.panelSoft }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${isSel ? T.primary : T.textMute}`, background: isSel ? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {isSel && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }}/>}
                                                    </div>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: isSel ? T.primary : T.textSoft }}>{opt.label}</span>
                                                </div>
                                                <div style={{ fontSize: 10, color: T.textMute, paddingLeft: 20 }}>{opt.hint}</div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rate Value */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    {data.rate_type === 'multiplier' ? 'Multiplier Value' : 'Flat Amount'} <span style={{ color: T.danger }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input className="otp-inp" type="number" value={data.rate_value}
                                        onChange={e => { setData('rate_value', e.target.value); setFormErrors(p => ({ ...p, rate_value: '' })); }}
                                        onKeyDown={e => { if (['-','e','E'].includes(e.key)) e.preventDefault(); }}
                                        placeholder={data.rate_type === 'multiplier' ? '1.50' : '50000'}
                                        step={data.rate_type === 'multiplier' ? '0.25' : '1'}
                                        min="0" disabled={processing}
                                        style={{ ...inp(!!formErrors.rate_value), paddingRight: 36 }} />
                                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: T.textMute, pointerEvents: 'none' }}>
                                        {data.rate_type === 'multiplier' ? '×' : '#'}
                                    </span>
                                </div>
                                {formErrors.rate_value && <ErrMsg msg={formErrors.rate_value} />}
                            </div>
                        </div>
                    )}

                    {/* Active toggle + submit */}
                    {data.title && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <OTPToggle label="Active" checked={data.is_active} onChange={v => setData('is_active', v)} disabled={processing} T={T} dark={dark} />
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                                <button type="submit" disabled={processing}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, border: 'none', background: processing ? T.textMute : 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', boxShadow: processing ? 'none' : '0 4px 14px rgba(124,58,237,0.35)', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { if (!processing) e.currentTarget.style.opacity = '0.9'; }}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                    {processing ? <><OTPSpinner /> Saving...</> : <>{editingId ? '✅ Update OT Rate' : '✅ Add OT Rate'}</>}
                                </button>
                                <button type="button" onClick={handleCancel} disabled={processing}
                                    style={{ padding: '10px 18px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            )}

            {/* ── Add button ── */}
            {!showForm && overtimePolicies.length < 5 && (
                <button onClick={() => { setEditingId(null); reset(); setFormErrors({}); setShowForm(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `1.5px dashed ${T.primary}`, background: T.primarySoft, color: T.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s', opacity: 0.85 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add OT Rate <span style={{ fontSize: 11, opacity: 0.7 }}>({5 - overtimePolicies.length} remaining)</span>
                </button>
            )}

            {/* All 5 configured */}
            {!showForm && overtimePolicies.length >= 5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, border: `1.5px solid ${T.successSoft === '#f0fdf4' ? '#bbf7d0' : 'rgba(52,211,153,0.2)'}`, background: T.successSoft }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.success }}>All 5 OT types configured</div>
                        <div style={{ fontSize: 11, color: T.success, opacity: 0.75, marginTop: 1 }}>Edit individual rates using the Edit button above.</div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

// ── Helpers ───────────────────────────────────────────────────
function OTPToggle({ label, checked, onChange, disabled, T, dark }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, userSelect: 'none' }}>
            <div onClick={() => !disabled && onChange(!checked)}
                style={{ position: 'relative', width: 38, height: 22, borderRadius: 99, transition: 'background 0.2s', background: checked ? '#7c3aed' : (dark ? 'rgba(148,163,184,0.2)' : '#d1d5db'), flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                <span style={{ position: 'absolute', top: 3, left: checked ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }}/>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textSoft }}>{label}</span>
        </label>
    );
}

function ErrMsg({ msg }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, fontWeight: 600, color: '#ef4444' }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/>
            </svg>
            {msg}
        </div>
    );
}

function OTPSpinner() {
    return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 0.7s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}