import { useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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
        danger:      '#f87171',
        dangerSoft:  'rgba(248,113,113,0.12)',
        success:     '#34d399',
        successSoft: 'rgba(52,211,153,0.12)',
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
        danger:      '#ef4444',
        dangerSoft:  '#fef2f2',
        success:     '#059669',
        successSoft: '#f0fdf4',
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

// ── Constants ──────────────────────────────────────────────────
const defaultForm = { name: '', type: 'flat', value: '', is_active: true };

const PRESET_ALLOWANCES = [
    { name: 'Housing Allowance',   type: 'flat',       emoji: '🏠' },
    { name: 'Transport Allowance', type: 'flat',       emoji: '🚌' },
    { name: 'Meal Allowance',      type: 'flat',       emoji: '🍱' },
    { name: 'Phone Allowance',     type: 'flat',       emoji: '📱' },
    { name: 'Medical Allowance',   type: 'flat',       emoji: '🏥' },
    { name: 'Performance Bonus',   type: 'percentage', emoji: '⭐' },
    { name: 'Overtime Allowance',  type: 'flat',       emoji: '⏱️' },
    { name: 'Hardship Allowance',  type: 'percentage', emoji: '💪' },
];

// ── Helpers ────────────────────────────────────────────────────
function ErrMsg({ msg }) {
    if (!msg) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11, fontWeight: 600, color: '#ef4444' }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/>
            </svg>
            {msg}
        </div>
    );
}

function ALToggle({ label, checked, onChange, disabled, T, dark }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, userSelect: 'none' }}>
            <div onClick={() => !disabled && onChange(!checked)}
                style={{ position: 'relative', width: 38, height: 22, borderRadius: 99, background: checked ? '#7c3aed' : (dark ? 'rgba(148,163,184,0.2)' : '#d1d5db'), flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 3, left: checked ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }}/>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textSoft }}>{label}</span>
        </label>
    );
}

function ALSpinner() {
    return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ animation: 'alSpin 0.7s linear infinite', display: 'inline-block' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}

// ── Main ───────────────────────────────────────────────────────
export default function AllowanceSection({ allowances }) {
    const dark = useTheme();
    const T    = getTheme(dark);

    const [showForm, setShowForm]         = useState(false);
    const [editingId, setEditingId]       = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);
    const [formErrors, setFormErrors]     = useState({});

    const { data, setData, post, put, processing, reset } = useForm(defaultForm);

    const validate = () => {
        const errs = {};
        if (!data.name.trim()) errs.name  = 'Allowance name is required.';
        if (!data.value)       errs.value = 'Value is required.';
        else if (Number(data.value) < 0) errs.value = 'Must be 0 or greater.';
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        setFormErrors({});
        if (editingId) {
            put(`/payroll/hr-policy/allowance/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); setEditingId(null); },
                onError: (e) => { if (e.name) setFormErrors(p => ({ ...p, name: e.name })); },
            });
        } else {
            post('/payroll/hr-policy/allowance', {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); },
                onError: (e) => { if (e.name) setFormErrors(p => ({ ...p, name: e.name })); },
            });
        }
    };

    const handleEdit = (allowance) => {
        setFormErrors({});
        setData({ name: allowance.name, type: allowance.type, value: allowance.value, is_active: !!allowance.is_active });
        setEditingId(allowance.id);
        setShowForm(true);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/hr-policy/allowance/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(false); setDeleteTarget(null);
                if (editingId === deleteTarget.id) { reset(); setFormErrors({}); setShowForm(false); setEditingId(null); }
            },
            onError: () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    const handleCancel = () => { reset(); setFormErrors({}); setShowForm(false); setEditingId(null); };

    const handlePreset = (preset) => {
        setData(d => ({ ...d, name: preset.name, type: preset.type }));
        setFormErrors(p => ({ ...p, name: '' }));
    };

    const inp = (hasError) => ({
        width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
        fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'all 0.15s', MozAppearance: 'textfield',
        border: `1.5px solid ${hasError ? T.danger : T.inputBorder}`,
        background: hasError ? (dark ? 'rgba(248,113,113,0.08)' : '#fef2f2') : T.inputBg,
        color: T.text,
    });

    // type badge colors — Deduction pattern: percentage=primary, flat=orange
    const typeBadge = (type) => type === 'percentage'
        ? { bg: T.primarySoft, color: T.primary }
        : { bg: T.orangeSoft,  color: T.orange  };

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            .al-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
            .al-row:hover td { background: ${T.rowHover}; }
            .al-inp:focus { border-color: ${T.borderFocus} !important; box-shadow: 0 0 0 3px ${T.primarySoft} !important; }
            .al-inp[type=number]::-webkit-outer-spin-button,
            .al-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            .al-inp[type=number] { -moz-appearance: textfield; }
            @keyframes alSpin  { to { transform: rotate(360deg); } }
            @keyframes al-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
            .al-animate { animation: al-fade 0.2s ease; }
        `}</style>

        <div className="al-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Delete Modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => !deleting && setDeleteTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}/>
                    <div className="al-animate" style={{ position: 'relative', background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 28px 24px', boxShadow: T.shadow }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🗑️</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 8 }}>Delete Allowance</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textAlign: 'center', marginBottom: 4 }}>"{deleteTarget.name}"</div>
                        <div style={{ fontSize: 11, color: T.textMute, textAlign: 'center', marginBottom: 24 }}>This action cannot be undone.</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => !deleting && setDeleteTarget(null)} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, boxShadow: '0 4px 14px rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {deleting ? <><ALSpinner/> Deleting...</> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            {allowances.length > 0 ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadowSoft }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: T.tableHead, borderBottom: `1px solid ${T.divider}` }}>
                                {['Allowance Name', 'Type', 'Value', 'Status', 'Actions'].map((h, i) => (
                                    <th key={h} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMute, whiteSpace: 'nowrap', textAlign: i === 0 ? 'left' : 'center' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allowances.map((allowance, idx) => {
                                const badge  = typeBadge(allowance.type);
                                const preset = PRESET_ALLOWANCES.find(p => p.name === allowance.name);
                                return (
                                    <tr key={allowance.id} className="al-row"
                                        style={{ borderBottom: idx < allowances.length - 1 ? `1px solid ${T.divider}` : 'none', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 16 }}>{preset?.emoji ?? (allowance.type === 'percentage' ? '📊' : '💵')}</span>
                                                <span style={{ fontWeight: 700, color: T.text }}>{allowance.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.color }}>
                                                {allowance.type === 'percentage' ? '% Percentage' : '# Flat'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <span style={{ fontWeight: 800, color: T.primary, fontSize: 14 }}>
                                                    {allowance.type === 'percentage'
                                                        ? `${Number(allowance.value).toFixed(2)}%`
                                                        : Number(allowance.value).toLocaleString()}
                                                </span>
                                                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: badge.bg, color: badge.color }}>
                                                    {allowance.type === 'percentage' ? 'Rate' : 'Flat'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: allowance.is_active ? T.successSoft : T.panelSoft, color: allowance.is_active ? T.success : T.textMute }}>
                                                {allowance.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <button onClick={() => handleEdit(allowance)}
                                                    style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = T.panelSofter; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = T.panelSoft;   e.currentTarget.style.transform = 'translateY(0)'; }}
                                                    title="Edit">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                                    </svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget({ id: allowance.id, name: allowance.name })}
                                                    style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.dangerSoft, color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.75'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.opacity = '1'; }}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `1.5px dashed ${T.emptyBorder}`, background: T.panelSoft, padding: '36px 24px', gap: 8 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: T.panelSofter, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 4 }}>🎁</div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.textSoft, margin: 0 }}>No allowances configured yet</p>
                    <p style={{ fontSize: 12, color: T.textMute, margin: 0 }}>Click below to add your first allowance</p>
                </div>
            )}

            {/* ── Form ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="al-animate" style={{ borderRadius: 16, border: `1.5px solid ${dark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.2)'}`, background: dark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.03)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                {editingId ? '✏️' : '➕'}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                                {editingId ? 'Edit Allowance' : 'Add New Allowance'}
                            </div>
                        </div>
                        <button type="button" onClick={handleCancel} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
                    </div>

                    {/* Quick Select */}
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMute, marginBottom: 10 }}>Quick Select</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 8 }}>
                            {PRESET_ALLOWANCES.map(preset => {
                                const isSelected = data.name === preset.name;
                                const badge = typeBadge(preset.type);
                                return (
                                    <button key={preset.name} type="button" onClick={() => handlePreset(preset)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '11px 14px', borderRadius: 14, textAlign: 'left',
                                            border: `1.5px solid ${isSelected ? T.primary : T.border}`,
                                            background: isSelected ? T.primarySoft : T.panelSolid,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            boxShadow: isSelected ? `0 0 0 3px ${T.primarySoft}` : T.shadowSoft,
                                        }}
                                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.transform = 'translateY(0)';  } }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                                <span style={{ fontSize: 14 }}>{preset.emoji}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? T.primary : T.text }}>{preset.name}</span>
                                            </div>
                                            <div style={{ fontSize: 10, fontWeight: 600, paddingLeft: 20, color: badge.color }}>{preset.type === 'percentage' ? '% Percentage' : '# Flat Amount'}</div>
                                        </div>
                                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary, flexShrink: 0 }}/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name (full width) */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Allowance Name <span style={{ color: T.danger }}>*</span>
                        </label>
                        <input className="al-inp" type="text" value={data.name} disabled={processing}
                            onChange={e => { setData('name', e.target.value); setFormErrors(p => ({ ...p, name: '' })); }}
                            placeholder="e.g. Housing Allowance, Transport Allowance..."
                            style={inp(!!formErrors.name)} />
                        <ErrMsg msg={formErrors.name} />
                    </div>

                    {/* Type + Value */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {/* Type */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Allowance Type</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[
                                    { value: 'percentage', label: 'Percentage', hint: 'e.g. 5%, 10%' },
                                    { value: 'flat',       label: 'Flat Amount', hint: 'e.g. 50,000' },
                                ].map(opt => {
                                    const isSel = data.type === opt.value;
                                    return (
                                        <label key={opt.value} onClick={() => !processing && setData('type', opt.value)}
                                            style={{ flex: 1, padding: '10px 12px', borderRadius: 12, cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.15s', border: `1.5px solid ${isSel ? T.primary : T.border}`, background: isSel ? T.primarySoft : T.panelSoft }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${isSel ? T.primary : T.textMute}`, background: isSel ? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
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

                        {/* Value */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                {data.type === 'percentage' ? 'Rate (%)' : 'Amount'} <span style={{ color: T.danger }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input className="al-inp" type="number" value={data.value} disabled={processing}
                                    onChange={e => { setData('value', e.target.value); setFormErrors(p => ({ ...p, value: '' })); }}
                                    onKeyDown={e => { if (['-', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                                    placeholder={data.type === 'percentage' ? '5.00' : '50000'}
                                    min="0" step={data.type === 'percentage' ? '0.01' : '1'}
                                    style={{ ...inp(!!formErrors.value), paddingRight: 36 }} />
                                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: T.textMute, pointerEvents: 'none' }}>
                                    {data.type === 'percentage' ? '%' : '#'}
                                </span>
                            </div>
                            <ErrMsg msg={formErrors.value} />
                        </div>
                    </div>

                    {/* Toggle + Submit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <ALToggle label="Active" checked={data.is_active} onChange={v => setData('is_active', v)} disabled={processing} T={T} dark={dark} />
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                            <button type="submit" disabled={processing}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, border: 'none', background: processing ? T.textMute : 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', boxShadow: processing ? 'none' : '0 4px 14px rgba(124,58,237,0.35)', transition: 'all 0.15s' }}
                                onMouseEnter={e => { if (!processing) e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                {processing ? <><ALSpinner/> Saving...</> : <>{editingId ? '✅ Update Allowance' : '✅ Add Allowance'}</>}
                            </button>
                            <button type="button" onClick={handleCancel} disabled={processing}
                                style={{ padding: '10px 18px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* ── Add button ── */}
            {!showForm && (
                <button onClick={() => { setEditingId(null); reset(); setFormErrors({}); setShowForm(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `1.5px dashed ${T.primary}`, background: T.primarySoft, color: T.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s', opacity: 0.85 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Allowance
                </button>
            )}
        </div>
        </>
    );
}