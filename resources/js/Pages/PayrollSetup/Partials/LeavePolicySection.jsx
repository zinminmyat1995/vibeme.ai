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
        dangerHover: '#ef4444',
        success:     '#34d399',
        successSoft: 'rgba(52,211,153,0.12)',
        warning:     '#fbbf24',
        warningSoft: 'rgba(251,191,36,0.12)',
        info:        '#60a5fa',
        infoSoft:    'rgba(96,165,250,0.12)',
        shadow:      '0 8px 32px rgba(0,0,0,0.4)',
        shadowSoft:  '0 2px 12px rgba(0,0,0,0.25)',
        inputBg:     'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148,163,184,0.15)',
        tableHead:   'rgba(255,255,255,0.03)',
        rowHover:    'rgba(255,255,255,0.03)',
        divider:     'rgba(148,163,184,0.08)',
        emptyBorder: 'rgba(148,163,184,0.15)',
        glass:       'radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 50%)',
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
        dangerHover: '#dc2626',
        success:     '#059669',
        successSoft: '#f0fdf4',
        warning:     '#d97706',
        warningSoft: '#fffbeb',
        info:        '#2563eb',
        infoSoft:    '#eff6ff',
        shadow:      '0 8px 32px rgba(15,23,42,0.1)',
        shadowSoft:  '0 2px 8px rgba(15,23,42,0.06)',
        inputBg:     '#f8fafc',
        inputBorder: '#e2e8f0',
        tableHead:   '#f8fafc',
        rowHover:    '#fafbff',
        divider:     'rgba(15,23,42,0.06)',
        emptyBorder: 'rgba(15,23,42,0.12)',
        glass:       'radial-gradient(circle at top right, rgba(124,58,237,0.05), transparent 50%)',
    };
}

const defaultForm = {
    leave_type:        '',
    days_per_year:     '',
    is_paid:           true,
    carry_over_days:   0,
    applicable_gender: 'all',
    requires_document: false,
    is_active:         true,
};

const PRESET_LEAVE_TYPES = [
    { name: 'Annual Leave',      gender: 'all',    days: 15, paid: true  },
    { name: 'Sick Leave',        gender: 'all',    days: 10, paid: true  },
    { name: 'Maternity Leave',   gender: 'female', days: 90, paid: true  },
    { name: 'Paternity Leave',   gender: 'male',   days: 7,  paid: true  },
    { name: 'Unpaid Leave',      gender: 'all',    days: 30, paid: false },
    { name: 'Emergency Leave',   gender: 'all',    days: 3,  paid: true  },
    { name: 'Marriage Leave',    gender: 'all',    days: 3,  paid: true  },
    { name: 'Bereavement Leave', gender: 'all',    days: 3,  paid: true  },
    { name: 'Public Holiday',    gender: 'all',    days: 12, paid: true  },
    { name: 'Compensation Leave',gender: 'all',    days: 5,  paid: true  },
];


// ── PremiumSelect (UserRoles pattern) ────────────────────────
function PremiumSelect({ options = [], value = '', onChange, placeholder = 'Select...', T, dark, disabled = false, zIndex = 300 }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const triggerBg = T.inputBg;
    const menuBg = dark ? T.panelSolid : '#ffffff';

    return (
        <div ref={wrapRef} style={{ position: 'relative', zIndex }}>
            <button type="button" onClick={() => !disabled && setOpen(v => !v)}
                style={{
                    width: '100%', height: 44, padding: '0 14px', borderRadius: 14,
                    border: `1.5px solid ${open ? T.primary : T.inputBorder}`,
                    background: disabled ? T.panelSoft : triggerBg,
                    color: selected ? T.text : T.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: open ? `0 0 0 3px ${T.primarySoft}` : T.shadowSoft,
                    backdropFilter: 'blur(12px)', transition: 'all 0.18s ease', outline: 'none',
                    opacity: disabled ? 0.6 : 1,
                }}>
                <span style={{ fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? T.text : T.textMute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                                {isSel && (
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                )}
                                {!isSel && <span style={{ width: 13 }}/>}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function LeavePolicySection({ leavePolicies }) {
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
        if (!data.leave_type.trim()) errs.leave_type = 'Leave type name is required.';
        if (!data.days_per_year)     errs.days_per_year = 'Days per year is required.';
        else if (Number(data.days_per_year) < 1) errs.days_per_year = 'Must be at least 1 day.';
        if (data.carry_over_days === '' || data.carry_over_days === null || data.carry_over_days === undefined)
            errs.carry_over_days = 'Carry over days is required.';
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        setFormErrors({});
        if (editingId) {
            put(`/payroll/hr-policy/leave-policy/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); setEditingId(null); },
                onError: (e) => { if (e.leave_type) setFormErrors(p => ({ ...p, leave_type: e.leave_type })); },
            });
        } else {
            post('/payroll/hr-policy/leave-policy', {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); },
                onError: (e) => { if (e.leave_type) setFormErrors(p => ({ ...p, leave_type: e.leave_type })); },
            });
        }
    };

    const handleEdit = (policy) => {
        setFormErrors({});
        setData({
            leave_type:        policy.leave_type,
            days_per_year:     policy.days_per_year,
            is_paid:           !!policy.is_paid,
            carry_over_days:   policy.carry_over_days,
            applicable_gender: policy.applicable_gender ?? 'all',
            requires_document: !!policy.requires_document,
            is_active:         !!policy.is_active,
        });
        setEditingId(policy.id);
        setShowForm(true);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/hr-policy/leave-policy/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(false); setDeleteTarget(null);
                if (editingId === deleteTarget.id) { reset(); setFormErrors({}); setShowForm(false); setEditingId(null); }
            },
            onError: () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    const handleCancel = () => { reset(); setFormErrors({}); setShowForm(false); setEditingId(null); };

    // input style helper
    const inp = (hasError) => ({
        width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
        fontWeight: 500, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'all 0.15s',
        border: `1.5px solid ${hasError ? T.danger : T.inputBorder}`,
        background: hasError ? (dark ? 'rgba(248,113,113,0.08)' : '#fef2f2') : T.inputBg,
        color: T.text,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            .lp-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
            .lp-row:hover td { background: ${T.rowHover}; }
            .lp-inp:focus { border-color: ${T.borderFocus} !important; box-shadow: 0 0 0 3px ${T.primarySoft} !important; }
            .lp-inp[type=number]::-webkit-outer-spin-button,
            .lp-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            .lp-inp[type=number] { -moz-appearance: textfield; }
            .lp-preset:hover { border-color: ${T.primary} !important; color: ${T.primary} !important; }
            @keyframes lp-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
            .lp-animate { animation: lp-fade 0.2s ease; }
        `}</style>

        <div className="lp-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => !deleting && setDeleteTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}/>
                    <div className="lp-animate" style={{ position: 'relative', background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 28px 24px', boxShadow: T.shadow }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: T.dangerSoft, border: `1px solid ${dark ? 'rgba(248,113,113,0.2)' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🗑️</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 8 }}>Delete Leave Type</div>
                        <div style={{ fontSize: 13, color: T.textMute, textAlign: 'center', lineHeight: 1.6, marginBottom: 4 }}>Are you sure you want to delete</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textAlign: 'center', marginBottom: 4 }}>"{deleteTarget.leave_type}"?</div>
                        <div style={{ fontSize: 11, color: T.textMute, textAlign: 'center', marginBottom: 24 }}>This action cannot be undone.</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => !deleting && setDeleteTarget(null)} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, #ef4444, #dc2626)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                                {deleting ? '⏳ Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            {leavePolicies.length > 0 ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadowSoft }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: T.tableHead, borderBottom: `1px solid ${T.divider}` }}>
                                {['Leave Type','Days/Yr','Paid','Carry Over','Gender','Document','Status','Actions'].map(h => (
                                    <th key={h} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMute, textAlign: h === 'Leave Type' ? 'left' : 'center', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {leavePolicies.map((policy, idx) => (
                                <tr key={policy.id} className="lp-row" style={{ borderBottom: idx < leavePolicies.length - 1 ? `1px solid ${T.divider}` : 'none', transition: 'background 0.1s' }}>
                                    <td style={{ padding: '12px 14px' }}>
                                        <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{policy.leave_type}</span>
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <span style={{ fontWeight: 800, color: T.primary, fontSize: 14 }}>{policy.days_per_year}</span>
                                        <span style={{ fontSize: 10, color: T.textMute, marginLeft: 2 }}>d</span>
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <LPBadge value={policy.is_paid} trueLabel="Paid" falseLabel="Unpaid" trueColor={T.success} trueSoft={T.successSoft} falseColor={T.textMute} falseSoft={T.panelSoft} dark={dark} />
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center', color: T.textSoft, fontSize: 12, fontWeight: 600 }}>{policy.carry_over_days}d</td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center', color: T.textSoft, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{policy.applicable_gender ?? 'all'}</td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <LPBadge value={policy.requires_document} trueLabel="Required" falseLabel="No" trueColor={T.warning} trueSoft={T.warningSoft} falseColor={T.textMute} falseSoft={T.panelSoft} dark={dark} />
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <LPBadge value={policy.is_active} trueLabel="Active" falseLabel="Inactive" trueColor={T.success} trueSoft={T.successSoft} falseColor={T.danger} falseSoft={T.dangerSoft} dark={dark} />
                                    </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <button onClick={() => handleEdit(policy)}
                                                style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = T.panelSofter; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = T.panelSoft; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                title="Edit">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9"/>
                                                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                                </svg>
                                            </button>
                                            <button onClick={() => setDeleteTarget({ id: policy.id, leave_type: policy.leave_type })}
                                                style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.dangerSoft, color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.85'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
                                                title="Delete">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"/>
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                    <path d="M10 11v6"/><path d="M14 11v6"/>
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', borderRadius: 16, border: `1.5px dashed ${T.emptyBorder}`, background: T.panelSoft, textAlign: 'center', gap: 6 }}>
                    <div style={{ fontSize: 32, marginBottom: 4 }}>📅</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textSoft }}>No leave types configured yet</div>
                    <div style={{ fontSize: 11, color: T.textMute }}>Click below to add your first leave type</div>
                </div>
            )}

            {/* ── Add / Edit Form ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="lp-animate" style={{ borderRadius: 16, border: `1.5px solid ${T.primarySoft === '#f3e8ff' ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.25)'}`, background: dark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.03)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Form header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                {editingId ? '✏️' : '➕'}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                                {editingId ? 'Edit Leave Type' : 'Add New Leave Type'}
                            </div>
                        </div>
                        <button type="button" onClick={handleCancel} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
                    </div>

                    {/* Quick Select */}
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMute, marginBottom: 8 }}>Quick Select</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {PRESET_LEAVE_TYPES.map(preset => {
                                const isSelected = data.leave_type === preset.name;
                                return (
                                    <button key={preset.name} type="button" disabled={processing}
                                        className="lp-preset"
                                        onClick={() => {
                                            setData({ ...data, leave_type: preset.name, days_per_year: preset.days, is_paid: preset.paid, applicable_gender: preset.gender });
                                            setFormErrors(p => ({ ...p, leave_type: '', days_per_year: '' }));
                                        }}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            border: `1.5px solid ${isSelected ? T.primary : T.border}`,
                                            background: isSelected ? T.primarySoft : T.panelSolid,
                                            color: isSelected ? T.primary : T.textSoft,
                                        }}>
                                        {preset.name}
                                        <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: preset.paid ? (dark ? 'rgba(52,211,153,0.15)' : '#d1fae5') : (dark ? 'rgba(148,163,184,0.12)' : '#f1f5f9'), color: preset.paid ? T.success : T.textMute }}>
                                            {preset.paid ? 'paid' : 'unpaid'}
                                        </span>
                                        {preset.gender !== 'all' && (
                                            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: dark ? 'rgba(96,165,250,0.15)' : '#eff6ff', color: T.info }}>
                                                {preset.gender}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fields grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Leave Type Name <span style={{ color: T.danger }}>*</span>
                            </label>
                            <input className="lp-inp" type="text" value={data.leave_type} disabled={processing}
                                onChange={e => { setData('leave_type', e.target.value); setFormErrors(p => ({ ...p, leave_type: '' })); }}
                                placeholder="e.g. Annual, Sick, Maternity"
                                style={inp(!!formErrors.leave_type)} />
                            {formErrors.leave_type && <ErrMsg msg={formErrors.leave_type} />}
                        </div>

                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Days Per Year <span style={{ color: T.danger }}>*</span>
                            </label>
                            <input className="lp-inp" type="number" value={data.days_per_year} min="0" disabled={processing}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setData('days_per_year', val === '' ? '' : Math.max(0, parseInt(val, 10)));
                                    setFormErrors(p => ({ ...p, days_per_year: '' }));
                                }}
                                onKeyDown={e => { if (['-','e','E','+','.'].includes(e.key)) e.preventDefault(); }}
                                inputMode="numeric"
                                style={{ ...inp(!!formErrors.days_per_year), MozAppearance: 'textfield' }} />
                            {formErrors.days_per_year && <ErrMsg msg={formErrors.days_per_year} />}
                        </div>

                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Carry Over Days <span style={{ color: T.danger }}>*</span>
                            </label>
                            <input className="lp-inp" type="number" value={data.carry_over_days} min="0" disabled={processing}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setData('carry_over_days', val === '' ? '' : Math.max(0, parseInt(val, 10)));
                                }}
                                onKeyDown={e => { if (['-','e','E','+','.'].includes(e.key)) e.preventDefault(); }}
                                inputMode="numeric"
                                style={{ ...inp(!!formErrors.carry_over_days), MozAppearance: 'textfield' }} />
                            {formErrors.carry_over_days && <ErrMsg msg={formErrors.carry_over_days} />}
                        </div>

                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Applicable Gender
                            </label>
                            <PremiumSelect
                                options={[
                                    { value: 'all', label: 'All' },
                                    { value: 'male', label: 'Male only' },
                                    { value: 'female', label: 'Female only' },
                                ]}
                                value={data.applicable_gender}
                                onChange={v => setData('applicable_gender', v)}
                                placeholder="Select gender..."
                                T={T} dark={dark}
                                disabled={processing}
                                zIndex={200}
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: '14px 18px', borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft, alignItems: 'center' }}>
                        <LPToggle label="Paid Leave"        checked={data.is_paid}           onChange={v => setData('is_paid', v)}           disabled={processing} T={T} />
                        <LPToggle label="Requires Document" checked={data.requires_document}  onChange={v => setData('requires_document', v)}  disabled={processing} T={T} />
                        <LPToggle label="Active"            checked={data.is_active}          onChange={v => setData('is_active', v)}          disabled={processing} T={T} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button type="submit" disabled={processing}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, border: 'none', background: processing ? T.textMute : 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', boxShadow: processing ? 'none' : '0 4px 14px rgba(124,58,237,0.35)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { if (!processing) e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            {processing
                                ? <><LPSpinner /> Saving...</>
                                : <>{editingId ? '✅ Update Leave Type' : '✅ Add Leave Type'}</>
                            }
                        </button>
                        <button type="button" onClick={handleCancel} disabled={processing}
                            style={{ padding: '10px 18px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* ── Add button ── */}
            {!showForm && (
                <button
                    onClick={() => { setEditingId(null); reset(); setFormErrors({}); setShowForm(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `1.5px dashed ${T.primary}`, background: T.primarySoft, color: T.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s', opacity: 0.85 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Leave Type
                </button>
            )}
        </div>
        </>
    );
}

// ── Badge ─────────────────────────────────────────────────────
function LPBadge({ value, trueLabel, falseLabel, trueColor, trueSoft, falseColor, falseSoft }) {
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 99,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.03em',
            background: value ? trueSoft : falseSoft,
            color: value ? trueColor : falseColor,
        }}>
            {value ? trueLabel : falseLabel}
        </span>
    );
}

// ── Toggle ────────────────────────────────────────────────────
function LPToggle({ label, checked, onChange, disabled, T }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, userSelect: 'none' }}>
            <div onClick={() => !disabled && onChange(!checked)}
                style={{ position: 'relative', width: 38, height: 22, borderRadius: 99, transition: 'background 0.2s', background: checked ? T.primary : (T.panelSolid === '#0b1324' ? 'rgba(148,163,184,0.2)' : '#d1d5db'), flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                <span style={{ position: 'absolute', top: 3, left: checked ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }}/>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textSoft }}>{label}</span>
        </label>
    );
}

// ── Error message ─────────────────────────────────────────────
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

// ── Spinner ───────────────────────────────────────────────────
function LPSpinner() {
    return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 0.7s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}