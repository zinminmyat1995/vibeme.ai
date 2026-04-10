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

// ── Constants ──────────────────────────────────────────────────
const defaultTypeForm = { name: '', calculation_type: 'flat', value: '', is_active: true };
const defaultScheduleForm = { bonus_type_id: '', frequency: 'yearly', pay_month: '', pay_quarter: '', notes: '', is_active: true };

const PRESET_BONUS_TYPES = [
    { name: 'Annual Bonus',      type: 'percentage', emoji: '🎯' },
    { name: 'Year-End Bonus',    type: 'flat',       emoji: '🎁' },
    { name: 'Performance Bonus', type: 'percentage', emoji: '⭐' },
    { name: 'Festival Bonus',    type: 'flat',       emoji: '🎉' },
    { name: '13th Month Salary', type: 'percentage', emoji: '💼' },
    { name: 'Retention Bonus',   type: 'flat',       emoji: '🤝' },
];

const FREQ_LABELS = {
    monthly:   { label: 'Monthly',   emoji: '📅' },
    quarterly: { label: 'Quarterly', emoji: '📊' },
    yearly:    { label: 'Yearly',    emoji: '🗓️' },
    once:      { label: 'One-Time',  emoji: '💫' },
};

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const QUARTER_NAMES = ['','Q1 (Jan-Mar)','Q2 (Apr-Jun)','Q3 (Jul-Sep)','Q4 (Oct-Dec)'];

// ── Shared helpers ─────────────────────────────────────────────
function calcTypeBadge(type, T) {
    return type === 'percentage'
        ? { bg: T.primarySoft, color: T.primary }
        : { bg: T.orangeSoft,  color: T.orange  };
}

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

function BSToggle({ label, checked, onChange, disabled, T, dark }) {
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

function BSSpinner() {
    return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ animation: 'bsSpin 0.7s linear infinite', display: 'inline-block' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}

function DeleteModal({ target, deleting, title, nameKey, onCancel, onConfirm, T, dark }) {
    if (!target) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={() => !deleting && onCancel()} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}/>
            <div style={{ position: 'relative', background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 28px 24px', boxShadow: T.shadow, animation: 'bsFade 0.2s ease' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🗑️</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textAlign: 'center', marginBottom: 4 }}>"{target[nameKey]}"</div>
                <div style={{ fontSize: 11, color: T.textMute, textAlign: 'center', marginBottom: 24 }}>This action cannot be undone.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onCancel} disabled={deleting}
                        style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={deleting}
                        style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, boxShadow: '0 4px 14px rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {deleting ? <><BSSpinner/> Deleting...</> : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── SectionBlock ───────────────────────────────────────────────
function SectionBlock({ title, desc, emoji, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'inherit', letterSpacing: '-0.2px' }}>{title}</div>
                    <div style={{ fontSize: 11, marginTop: 1 }}>{desc}</div>
                </div>
            </div>
            {children}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────
export default function BonusSection({ bonusTypes, bonusSchedules }) {
    const dark = useTheme();
    const T    = getTheme(dark);

    // ── Bonus Type state ──
    const [showTypeForm, setShowTypeForm]         = useState(false);
    const [editingTypeId, setEditingTypeId]       = useState(null);
    const [deleteTypeTarget, setDeleteTypeTarget] = useState(null);
    const [deletingType, setDeletingType]         = useState(false);
    const [typeErrors, setTypeErrors]             = useState({});

    const { data: td, setData: setTD, post: storeType, put: updateType, processing: typeProc, reset: resetType } = useForm(defaultTypeForm);

    // ── Bonus Schedule state ──
    const [showScheduleForm, setShowScheduleForm]         = useState(false);
    const [editingScheduleId, setEditingScheduleId]       = useState(null);
    const [deleteScheduleTarget, setDeleteScheduleTarget] = useState(null);
    const [deletingSchedule, setDeletingSchedule]         = useState(false);
    const [scheduleErrors, setScheduleErrors]             = useState({});

    const { data: sd, setData: setSD, post: storeSchedule, put: updateSchedule, processing: schedProc, reset: resetSchedule } = useForm(defaultScheduleForm);

    // ── Type handlers ──
    const validateType = () => {
        const errs = {};
        if (!td.name.trim()) errs.name  = 'Bonus name is required.';
        if (!td.value)       errs.value = 'Value is required.';
        return errs;
    };

    const handleTypeSubmit = (e) => {
        e.preventDefault();
        const errs = validateType();
        if (Object.keys(errs).length > 0) { setTypeErrors(errs); return; }
        setTypeErrors({});
        if (editingTypeId) {
            updateType(`/payroll/hr-policy/bonus-type/${editingTypeId}`, {
                preserveScroll: true,
                onSuccess: () => { resetType(); setShowTypeForm(false); setEditingTypeId(null); },
                onError: (e) => { if (e.name) setTypeErrors(p => ({...p, name: e.name})); },
            });
        } else {
            storeType('/payroll/hr-policy/bonus-type', {
                preserveScroll: true,
                onSuccess: () => { resetType(); setShowTypeForm(false); },
                onError: (e) => { if (e.name) setTypeErrors(p => ({...p, name: e.name})); },
            });
        }
    };

    const handleTypeEdit = (bt) => {
        setTypeErrors({});
        setTD({ name: bt.name, calculation_type: bt.calculation_type, value: bt.value, is_active: !!bt.is_active });
        setEditingTypeId(bt.id);
        setShowTypeForm(true);
    };

    const handleTypeDeleteConfirm = () => {
        if (!deleteTypeTarget) return;
        setDeletingType(true);
        router.delete(`/payroll/hr-policy/bonus-type/${deleteTypeTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingType(false); setDeleteTypeTarget(null);
                if (editingTypeId === deleteTypeTarget.id) { resetType(); setTypeErrors({}); setShowTypeForm(false); setEditingTypeId(null); }
            },
            onError: () => { setDeletingType(false); setDeleteTypeTarget(null); },
        });
    };

    // ── Schedule handlers ──
    const validateSchedule = () => {
        const errs = {};
        if (!sd.bonus_type_id) errs.bonus_type_id = 'Please select a bonus type.';
        if (!sd.notes.trim())  errs.notes         = 'Notes is required.';
        if ((sd.frequency === 'yearly' || sd.frequency === 'once') && !sd.pay_month)
            errs.pay_month = 'Pay month is required.';
        if (sd.frequency === 'quarterly' && !sd.pay_quarter)
            errs.pay_quarter = 'Pay quarter is required.';
        return errs;
    };

    const handleScheduleSubmit = (e) => {
        e.preventDefault();
        const errs = validateSchedule();
        if (Object.keys(errs).length > 0) { setScheduleErrors(errs); return; }
        setScheduleErrors({});
        if (editingScheduleId) {
            updateSchedule(`/payroll/hr-policy/bonus-schedule/${editingScheduleId}`, {
                preserveScroll: true,
                onSuccess: () => { resetSchedule(); setShowScheduleForm(false); setEditingScheduleId(null); },
                onError: (e) => { setScheduleErrors(e); },
            });
        } else {
            storeSchedule('/payroll/hr-policy/bonus-schedule', {
                preserveScroll: true,
                onSuccess: () => { resetSchedule(); setShowScheduleForm(false); },
                onError: (e) => { setScheduleErrors(e); },
            });
        }
    };

    const handleScheduleEdit = (bs) => {
        setScheduleErrors({});
        setSD({ bonus_type_id: String(bs.bonus_type_id), frequency: bs.frequency, pay_month: bs.pay_month || '', pay_quarter: bs.pay_quarter || '', notes: bs.notes || '', is_active: !!bs.is_active });
        setEditingScheduleId(bs.id);
        setShowScheduleForm(true);
    };

    const handleScheduleDeleteConfirm = () => {
        if (!deleteScheduleTarget) return;
        setDeletingSchedule(true);
        router.delete(`/payroll/hr-policy/bonus-schedule/${deleteScheduleTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSchedule(false); setDeleteScheduleTarget(null);
                if (editingScheduleId === deleteScheduleTarget.id) { resetSchedule(); setScheduleErrors({}); setShowScheduleForm(false); setEditingScheduleId(null); }
            },
            onError: () => { setDeletingSchedule(false); setDeleteScheduleTarget(null); },
        });
    };

    // input style helper
    const inp = (hasError) => ({
        width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
        fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'all 0.15s', MozAppearance: 'textfield',
        border: `1.5px solid ${hasError ? T.danger : T.inputBorder}`,
        background: hasError ? (dark ? 'rgba(248,113,113,0.08)' : '#fef2f2') : T.inputBg,
        color: T.text,
    });

    const formSectionStyle = {
        borderRadius: 16,
        border: `1.5px solid ${dark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.2)'}`,
        background: dark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.03)',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    };

    const typeOptions = bonusTypes.map(bt => ({ value: String(bt.id), label: bt.name }));

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            .bs-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
            .bs-row:hover td { background: ${T.rowHover}; }
            .bs-inp:focus { border-color: ${T.borderFocus} !important; box-shadow: 0 0 0 3px ${T.primarySoft} !important; }
            .bs-inp[type=number]::-webkit-outer-spin-button,
            .bs-inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            .bs-inp[type=number] { -moz-appearance: textfield; }
            @keyframes bsSpin { to { transform: rotate(360deg); } }
            @keyframes bsFade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
            .bs-animate { animation: bsFade 0.2s ease; }
        `}</style>

        <div className="bs-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Delete modals */}
            <DeleteModal target={deleteTypeTarget} deleting={deletingType} title="Delete Bonus Type" nameKey="name" onCancel={() => setDeleteTypeTarget(null)} onConfirm={handleTypeDeleteConfirm} T={T} dark={dark} />


            {/* ══ PART 1: Bonus Types ══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        
                {/* Type table */}
                {bonusTypes.length > 0 && (
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadowSoft }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: T.tableHead, borderBottom: `1px solid ${T.divider}` }}>
                                    {['Bonus Name','Type','Value','Status','Actions'].map((h, i) => (
                                        <th key={h} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMute, whiteSpace: 'nowrap', textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bonusTypes.map((bt, idx) => {
                                    const badge  = calcTypeBadge(bt.calculation_type, T);
                                    const preset = PRESET_BONUS_TYPES.find(p => p.name === bt.name);
                                    return (
                                        <tr key={bt.id} className="bs-row" style={{ borderBottom: idx < bonusTypes.length - 1 ? `1px solid ${T.divider}` : 'none', transition: 'background 0.1s' }}>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 16 }}>{preset?.emoji ?? '💰'}</span>
                                                    <span style={{ fontWeight: 700, color: T.text }}>{bt.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.color }}>
                                                    {bt.calculation_type === 'percentage' ? '% Percentage' : '# Flat'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <span style={{ fontWeight: 800, color: T.primary, fontSize: 14 }}>
                                                        {bt.calculation_type === 'percentage' ? `${Number(bt.value).toFixed(2)}%` : Number(bt.value).toLocaleString()}
                                                    </span>
                                                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: badge.bg, color: badge.color }}>
                                                        {bt.calculation_type === 'percentage' ? 'Rate' : 'Flat'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: bt.is_active ? T.successSoft : T.panelSoft, color: bt.is_active ? T.success : T.textMute }}>
                                                    {bt.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    <button onClick={() => handleTypeEdit(bt)}
                                                        style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = T.panelSofter; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = T.panelSoft;   e.currentTarget.style.transform = 'translateY(0)'; }}
                                                        title="Edit">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => setDeleteTypeTarget(bt)}
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
                )}

                {bonusTypes.length === 0 && !showTypeForm && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `1.5px dashed ${T.emptyBorder}`, background: T.panelSoft, padding: '32px 24px', gap: 8 }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>⭐</div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textSoft, margin: 0 }}>No bonus types configured yet</p>
                        <p style={{ fontSize: 12, color: T.textMute, margin: 0 }}>Click below to add your first bonus type</p>
                    </div>
                )}

                {/* Type form */}
                {showTypeForm && (
                    <form onSubmit={handleTypeSubmit} className="bs-animate" style={formSectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{editingTypeId ? '✏️' : '➕'}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{editingTypeId ? 'Edit Bonus Type' : 'Add Bonus Type'}</div>
                            </div>
                            <button type="button" onClick={() => { resetType(); setTypeErrors({}); setShowTypeForm(false); setEditingTypeId(null); }}
                                style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
                        </div>

                        {/* Presets */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMute, marginBottom: 10 }}>Quick Select</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 8 }}>
                                {PRESET_BONUS_TYPES.map(preset => {
                                    const isSelected = td.name === preset.name;
                                    const badge = calcTypeBadge(preset.type, T);
                                    return (
                                        <button key={preset.name} type="button"
                                            onClick={() => { setTD('name', preset.name); setTD('calculation_type', preset.type); setTypeErrors(p => ({...p, name: ''})); }}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 14, textAlign: 'left', border: `1.5px solid ${isSelected ? T.primary : T.border}`, background: isSelected ? T.primarySoft : T.panelSolid, cursor: 'pointer', transition: 'all 0.15s', boxShadow: isSelected ? `0 0 0 3px ${T.primarySoft}` : T.shadowSoft }}
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

                        {/* Name */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Bonus Name <span style={{ color: T.danger }}>*</span></label>
                            <input className="bs-inp" type="text" value={td.name} disabled={typeProc}
                                onChange={e => { setTD('name', e.target.value); setTypeErrors(p => ({...p, name: ''})); }}
                                placeholder="e.g. Annual Bonus, Performance Bonus"
                                style={inp(!!typeErrors.name)} />
                            <ErrMsg msg={typeErrors.name} />
                        </div>

                        {/* Calc Type + Value */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Calculation Type</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[{ value: 'percentage', label: 'Percentage', hint: '% of salary' }, { value: 'flat', label: 'Flat Amount', hint: 'Fixed amount' }].map(opt => {
                                        const isSel = td.calculation_type === opt.value;
                                        return (
                                            <label key={opt.value} onClick={() => !typeProc && setTD('calculation_type', opt.value)}
                                                style={{ flex: 1, padding: '10px 12px', borderRadius: 12, cursor: typeProc ? 'not-allowed' : 'pointer', transition: 'all 0.15s', border: `1.5px solid ${isSel ? T.primary : T.border}`, background: isSel ? T.primarySoft : T.panelSoft }}>
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
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    {td.calculation_type === 'percentage' ? 'Rate (%)' : 'Amount'} <span style={{ color: T.danger }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input className="bs-inp" type="number" value={td.value} disabled={typeProc}
                                        onChange={e => { setTD('value', e.target.value); setTypeErrors(p => ({...p, value: ''})); }}
                                        onKeyDown={e => { if (['-','e','E'].includes(e.key)) e.preventDefault(); }}
                                        placeholder={td.calculation_type === 'percentage' ? '20.00' : '500000'}
                                        min="0" step={td.calculation_type === 'percentage' ? '0.01' : '1'}
                                        style={{ ...inp(!!typeErrors.value), paddingRight: 36 }} />
                                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: T.textMute, pointerEvents: 'none' }}>
                                        {td.calculation_type === 'percentage' ? '%' : '#'}
                                    </span>
                                </div>
                                <ErrMsg msg={typeErrors.value} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 18px', borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft }}>
                            <BSToggle label="Active" checked={td.is_active} onChange={v => setTD('is_active', v)} disabled={typeProc} T={T} dark={dark} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                           
                            <button type="submit" disabled={typeProc}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, border: 'none', background: typeProc ? T.textMute : 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: typeProc ? 'not-allowed' : 'pointer', boxShadow: typeProc ? 'none' : '0 4px 14px rgba(124,58,237,0.35)', transition: 'all 0.15s' }}
                                onMouseEnter={e => { if (!typeProc) e.currentTarget.style.opacity = '0.9'; }}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                {typeProc ? <><BSSpinner/> Saving...</> : <>{editingTypeId ? '✅ Update Bonus Type' : '✅ Add Bonus Type'}</>}
                            </button>
                            <button type="button" onClick={() => { resetType(); setTypeErrors({}); setShowTypeForm(false); setEditingTypeId(null); }} disabled={typeProc}
                                style={{ padding: '10px 18px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {!showTypeForm && (
                    <button onClick={() => { setEditingTypeId(null); resetType(); setTypeErrors({}); setShowTypeForm(true); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `1.5px dashed ${T.primary}`, background: T.primarySoft, color: T.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s', opacity: 0.85 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                        Add Bonus Type
                    </button>
                )}
            </div>


        </div>
        </>
    );
}