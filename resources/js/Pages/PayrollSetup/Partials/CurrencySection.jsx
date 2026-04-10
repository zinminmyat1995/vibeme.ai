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
        shadow:      '0 8px 32px rgba(0,0,0,0.4)',
        shadowSoft:  '0 2px 12px rgba(0,0,0,0.25)',
        inputBg:     'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148,163,184,0.15)',
        tableHead:   'rgba(255,255,255,0.03)',
        rowHover:    'rgba(255,255,255,0.03)',
        divider:     'rgba(148,163,184,0.08)',
        emptyBorder: 'rgba(148,163,184,0.15)',
        codeBg:      'rgba(255,255,255,0.08)',
        codeColor:   '#a5b4fc',
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
        shadow:      '0 8px 32px rgba(15,23,42,0.1)',
        shadowSoft:  '0 2px 8px rgba(15,23,42,0.06)',
        inputBg:     '#f8fafc',
        inputBorder: '#e2e8f0',
        tableHead:   '#f8fafc',
        rowHover:    '#fafbff',
        divider:     'rgba(15,23,42,0.06)',
        emptyBorder: 'rgba(15,23,42,0.12)',
        codeBg:      '#f1f5f9',
        codeColor:   '#6366f1',
    };
}

const defaultForm = { currency_name: '', currency_code: '', is_active: true };

const PRESET_CURRENCIES = [
    { name: 'US Dollar',       code: 'USD', flag: '🇺🇸' },
    { name: 'Cambodian Riel',  code: 'KHR', flag: '🇰🇭' },
    { name: 'Myanmar Kyat',    code: 'MMK', flag: '🇲🇲' },
    { name: 'Vietnamese Dong', code: 'VND', flag: '🇻🇳' },
    { name: 'Japanese Yen',    code: 'JPY', flag: '🇯🇵' },
    { name: 'Korean Won',      code: 'KRW', flag: '🇰🇷' },
];

export default function CurrencySection({ currencies }) {
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
        if (!data.currency_name.trim()) errs.currency_name = 'Currency name is required.';
        if (!data.currency_code.trim()) errs.currency_code = 'Currency code is required.';
        else if (data.currency_code.length > 10) errs.currency_code = 'Max 10 characters.';
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        setFormErrors({});
        if (editingId) {
            put(`/payroll/hr-policy/currency/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); setEditingId(null); },
                onError: (e) => {
                    if (e.currency_name) setFormErrors(p => ({ ...p, currency_name: e.currency_name }));
                    if (e.currency_code) setFormErrors(p => ({ ...p, currency_code: e.currency_code }));
                },
            });
        } else {
            post('/payroll/hr-policy/currency', {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); },
                onError: (e) => {
                    if (e.currency_name) setFormErrors(p => ({ ...p, currency_name: e.currency_name }));
                    if (e.currency_code) setFormErrors(p => ({ ...p, currency_code: e.currency_code }));
                },
            });
        }
    };

    const handleEdit = (currency) => {
        setFormErrors({});
        setData({ currency_name: currency.currency_name, currency_code: currency.currency_code, is_active: !!currency.is_active });
        setEditingId(currency.id);
        setShowForm(true);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/hr-policy/currency/${deleteTarget.id}`, {
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
        setData({ ...data, currency_name: preset.name, currency_code: preset.code });
        setFormErrors(p => ({ ...p, currency_name: '', currency_code: '' }));
    };

    const inp = (hasError) => ({
        width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
        fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'all 0.15s',
        border: `1.5px solid ${hasError ? T.danger : T.inputBorder}`,
        background: hasError ? (dark ? 'rgba(248,113,113,0.08)' : '#fef2f2') : T.inputBg,
        color: T.text,
    });

    return (
        <>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            .cur-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
            .cur-row:hover td { background: ${T.rowHover}; }
            .cur-inp:focus { border-color: ${T.borderFocus} !important; box-shadow: 0 0 0 3px ${T.primarySoft} !important; }
            @keyframes cur-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
            .cur-animate { animation: cur-fade 0.2s ease; }
        `}</style>

        <div className="cur-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => !deleting && setDeleteTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}/>
                    <div className="cur-animate" style={{ position: 'relative', background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 28px 24px', boxShadow: T.shadow }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🗑️</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 8 }}>Delete Currency</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textAlign: 'center', marginBottom: 4 }}>
                            "{deleteTarget.currency_name} ({deleteTarget.currency_code})"
                        </div>
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
            {currencies.length > 0 ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadowSoft }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: T.tableHead, borderBottom: `1px solid ${T.divider}` }}>
                                {['Currency Name', 'Code', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMute, textAlign: h === 'Currency Name' ? 'left' : 'center', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currencies.map((currency, idx) => {
                                const preset = PRESET_CURRENCIES.find(p => p.code === currency.currency_code);
                                return (
                                    <tr key={currency.id} className="cur-row" style={{ borderBottom: idx < currencies.length - 1 ? `1px solid ${T.divider}` : 'none', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {preset && <span style={{ fontSize: 18 }}>{preset.flag}</span>}
                                                <span style={{ fontWeight: 700, color: T.text }}>{currency.currency_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 8, background: T.codeBg, color: T.codeColor, fontSize: 12, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                                                {currency.currency_code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: currency.is_active ? T.successSoft : T.panelSoft, color: currency.is_active ? T.success : T.textMute }}>
                                                {currency.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <button onClick={() => handleEdit(currency)}
                                                    style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = T.panelSofter; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = T.panelSoft; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                    title="Edit">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                                    </svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget({ id: currency.id, currency_name: currency.currency_name, currency_code: currency.currency_code })}
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
                    <div style={{ fontSize: 32, marginBottom: 4 }}>💱</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textSoft }}>No currencies configured yet</div>
                    <div style={{ fontSize: 11, color: T.textMute }}>Click below to add your first currency</div>
                </div>
            )}

            {/* ── Add / Edit Form ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="cur-animate" style={{ borderRadius: 16, border: `1.5px solid ${dark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.2)'}`, background: dark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.03)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                {editingId ? '✏️' : '➕'}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                                {editingId ? 'Edit Currency' : 'Add New Currency'}
                            </div>
                        </div>
                        <button type="button" onClick={handleCancel} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
                    </div>

                    {/* Quick Select presets */}
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMute, marginBottom: 8 }}>Quick Select</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {PRESET_CURRENCIES.map(preset => {
                                const isSelected = data.currency_code === preset.code;
                                return (
                                    <button key={preset.code} type="button" disabled={processing}
                                        onClick={() => handlePreset(preset)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 7,
                                            padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            border: `1.5px solid ${isSelected ? T.primary : T.border}`,
                                            background: isSelected ? T.primarySoft : T.panelSolid,
                                            color: isSelected ? T.primary : T.textSoft,
                                        }}
                                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; } }}
                                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSoft; } }}>
                                        <span style={{ fontSize: 14 }}>{preset.flag}</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11 }}>{preset.code}</span>
                                        <span style={{ color: T.textMute, fontSize: 10 }}>·</span>
                                        <span style={{ fontSize: 11 }}>{preset.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Currency Name <span style={{ color: T.danger }}>*</span>
                            </label>
                            <input className="cur-inp" type="text" value={data.currency_name} disabled={processing}
                                onChange={e => { setData('currency_name', e.target.value); setFormErrors(p => ({ ...p, currency_name: '' })); }}
                                placeholder="e.g. US Dollar, Cambodian Riel"
                                style={inp(!!formErrors.currency_name)} />
                            {formErrors.currency_name && <ErrMsg msg={formErrors.currency_name} />}
                        </div>

                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Currency Code <span style={{ color: T.danger }}>*</span>
                            </label>
                            <input className="cur-inp" type="text" value={data.currency_code} disabled={processing}
                                onChange={e => { setData('currency_code', e.target.value.toUpperCase()); setFormErrors(p => ({ ...p, currency_code: '' })); }}
                                placeholder="e.g. USD, KHR, MMK"
                                maxLength={10}
                                style={{ ...inp(!!formErrors.currency_code), fontFamily: 'monospace', letterSpacing: '0.1em', fontWeight: 700 }} />
                            {formErrors.currency_code && <ErrMsg msg={formErrors.currency_code} />}
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 18px', borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft }}>
                        <CurToggle label="Active" checked={data.is_active} onChange={v => setData('is_active', v)} disabled={processing} T={T} dark={dark} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button type="submit" disabled={processing}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, border: 'none', background: processing ? T.textMute : 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', boxShadow: processing ? 'none' : '0 4px 14px rgba(124,58,237,0.35)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { if (!processing) e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            {processing ? <><CurSpinner /> Saving...</> : <>{editingId ? '✅ Update Currency' : '✅ Add Currency'}</>}
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
                <button onClick={() => { setEditingId(null); reset(); setFormErrors({}); setShowForm(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `1.5px dashed ${T.primary}`, background: T.primarySoft, color: T.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s', opacity: 0.85 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Currency
                </button>
            )}
        </div>
        </>
    );
}

// ── Helpers ───────────────────────────────────────────────────
function CurToggle({ label, checked, onChange, disabled, T, dark }) {
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

function CurSpinner() {
    return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 0.7s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}