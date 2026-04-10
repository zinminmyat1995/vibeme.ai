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
        shadow:      '0 8px 32px rgba(0,0,0,0.4)',
        shadowSoft:  '0 2px 12px rgba(0,0,0,0.25)',
        inputBg:     'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148,163,184,0.15)',
        tableHead:   'rgba(255,255,255,0.03)',
        rowHover:    'rgba(255,255,255,0.03)',
        divider:     'rgba(148,163,184,0.08)',
        emptyBorder: 'rgba(148,163,184,0.15)',
        yearActive:  'rgba(124,58,237,0.2)',
        yearActiveBg:'rgba(255,255,255,0.06)',
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
        shadow:      '0 8px 32px rgba(15,23,42,0.1)',
        shadowSoft:  '0 2px 8px rgba(15,23,42,0.06)',
        inputBg:     '#f8fafc',
        inputBorder: '#e2e8f0',
        tableHead:   '#f8fafc',
        rowHover:    '#fafbff',
        divider:     'rgba(15,23,42,0.06)',
        emptyBorder: 'rgba(15,23,42,0.12)',
        yearActive:  'rgba(124,58,237,0.1)',
        yearActiveBg:'#ffffff',
    };
}

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

function PHSpinner() {
    return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ animation: 'phSpin 0.7s linear infinite', display: 'inline-block' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}

// ── Main ───────────────────────────────────────────────────────
export default function PublicHolidaySection({ publicHolidays = [] }) {
    const dark = useTheme();
    const T    = getTheme(dark);

    const currentYear = new Date().getFullYear();
    const [yearFilter, setYearFilter] = useState(currentYear);
    const [showForm, setShowForm]     = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]     = useState(false);
    const [errors, setErrors]         = useState({});

    const { data, setData, post, put, processing, reset } = useForm({
        name: '', date: '', is_recurring: true,
    });

    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    const filtered = publicHolidays.filter(h => {
        const dateStr = (h.date || '').substring(0, 10);
        const y = new Date(dateStr + 'T00:00:00').getFullYear();
        return y === yearFilter;
    });

    const validate = () => {
        const e = {};
        if (!data.name.trim()) e.name = 'Holiday name is required.';
        if (!data.date)        e.date = 'Date is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        setErrors({});
        if (editingId) {
            put(`/payroll/hr-policy/public-holiday/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); setEditingId(null); },
                onError: (errs) => setErrors(errs),
            });
        } else {
            post('/payroll/hr-policy/public-holiday', {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); },
                onError: (errs) => setErrors(errs),
            });
        }
    };

    const handleEdit = (h) => {
        setErrors({});
        setData({ name: h.name, date: h.date.substring(0, 10), is_recurring: !!h.is_recurring });
        setEditingId(h.id);
        setShowForm(true);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/hr-policy/public-holiday/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => { setDeleting(false); setDeleteTarget(null); },
            onError:   () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const getDayName = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

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
            .ph-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
            .ph-row:hover td { background: ${T.rowHover}; }
            .ph-inp:focus { border-color: ${T.borderFocus} !important; box-shadow: 0 0 0 3px ${T.primarySoft} !important; }
            @keyframes phSpin { to { transform: rotate(360deg); } }
            @keyframes ph-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
            .ph-animate { animation: ph-fade 0.2s ease; }
            .ph-year-btn:hover { opacity: 1 !important; }
        `}</style>

        <div className="ph-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Delete Modal ── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => !deleting && setDeleteTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}/>
                    <div className="ph-animate" style={{ position: 'relative', background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 28px 24px', boxShadow: T.shadow }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🗑️</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, textAlign: 'center', marginBottom: 8 }}>Delete Holiday</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textAlign: 'center', marginBottom: 4 }}>"{deleteTarget.name}"</div>
                        <div style={{ fontSize: 11, color: T.textMute, textAlign: 'center', marginBottom: 24 }}>{formatDate(deleteTarget.date.substring(0,10))}</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => !deleting && setDeleteTarget(null)} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={deleting}
                                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, boxShadow: '0 4px 14px rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {deleting ? <><PHSpinner/> Deleting...</> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Year filter + count ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: T.panelSoft, border: `1px solid ${T.border}` }}>
                    {years.map(y => {
                        const isActive = yearFilter === y;
                        return (
                            <button key={y} className="ph-year-btn" onClick={() => setYearFilter(y)}
                                style={{
                                    padding: '6px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 800,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    background: isActive ? T.yearActiveBg : 'transparent',
                                    color: isActive ? T.primary : T.textMute,
                                    boxShadow: isActive ? T.shadowSoft : 'none',
                                    opacity: isActive ? 1 : 0.7,
                                }}>
                                {y}
                            </button>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: T.panelSoft, border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 14 }}>🎌</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: T.primary }}>{filtered.length}</span>
                    <span style={{ fontSize: 12, color: T.textMute, fontWeight: 500 }}>holidays in {yearFilter}</span>
                </div>
            </div>

            {/* ── Table ── */}
            {filtered.length > 0 ? (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadowSoft }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: T.tableHead, borderBottom: `1px solid ${T.divider}` }}>
                                {['Holiday Name','Date','Day','Recurring','Actions'].map((h, i) => (
                                    <th key={h} style={{ padding: '11px 14px', fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMute, whiteSpace: 'nowrap', textAlign: i === 0 ? 'left' : 'center' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((h, idx) => {
                                const dateStr = h.date.substring(0, 10);
                                return (
                                    <tr key={h.id} className="ph-row" style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${T.divider}` : 'none', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '12px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 10, background: T.dangerSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🎌</div>
                                                <span style={{ fontWeight: 700, color: T.text }}>{h.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: T.textSoft }}>{formatDate(dateStr)}</span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: T.panelSoft, color: T.textSoft, border: `1px solid ${T.border}` }}>
                                                {getDayName(dateStr)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: h.is_recurring ? T.successSoft : T.panelSoft, color: h.is_recurring ? T.success : T.textMute }}>
                                                {h.is_recurring ? '↻ Recurring' : 'One-time'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <button onClick={() => handleEdit(h)}
                                                    style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = T.panelSofter; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = T.panelSoft;   e.currentTarget.style.transform = 'translateY(0)'; }}
                                                    title="Edit">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                                    </svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget(h)}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `1.5px dashed ${T.emptyBorder}`, background: T.panelSoft, padding: '40px 24px', gap: 8 }}>
                    <div style={{ fontSize: 32, marginBottom: 4 }}>🎌</div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.textSoft, margin: 0 }}>No public holidays for {yearFilter}</p>
                    <p style={{ fontSize: 12, color: T.textMute, margin: 0 }}>Click "Add Holiday" to get started</p>
                </div>
            )}

            {/* ── Add / Edit Form ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="ph-animate" style={{ borderRadius: 16, border: `1.5px solid ${dark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.2)'}`, background: dark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.03)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{editingId ? '✏️' : '➕'}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{editingId ? 'Edit Holiday' : 'Add Public Holiday'}</div>
                        </div>
                        <button type="button" onClick={() => { reset(); setErrors({}); setShowForm(false); setEditingId(null); }}
                            style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: T.panelSoft, color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
                    </div>

                    {/* Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {/* Name — full width */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Holiday Name <span style={{ color: T.danger }}>*</span>
                            </label>
                            <input className="ph-inp" type="text" value={data.name} disabled={processing}
                                onChange={e => { setData('name', e.target.value); setErrors(v => ({...v, name:''})); }}
                                placeholder="e.g. Khmer New Year, National Day"
                                style={inp(!!errors.name)} />
                            <ErrMsg msg={errors.name} />
                        </div>

                        {/* Date */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Date <span style={{ color: T.danger }}>*</span>
                            </label>
                            <input className="ph-inp" type="date" value={data.date} disabled={processing}
                                onChange={e => { setData('date', e.target.value); setErrors(v => ({...v, date:''})); }}
                                style={inp(!!errors.date)} />
                            <ErrMsg msg={errors.date} />
                        </div>

                        {/* Recurring toggle */}
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${data.is_recurring ? T.primary : T.border}`, background: data.is_recurring ? T.primarySoft : T.panelSoft, cursor: 'pointer', transition: 'all 0.15s' }}
                                onClick={() => setData('is_recurring', !data.is_recurring)}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: data.is_recurring ? T.primary : T.textSoft }}>↻ Recurring Annually</div>
                                    <div style={{ fontSize: 10, color: T.textMute, marginTop: 2 }}>Repeats every year</div>
                                </div>
                                {/* Toggle */}
                                <div style={{ position: 'relative', width: 38, height: 22, borderRadius: 99, background: data.is_recurring ? '#7c3aed' : (dark ? 'rgba(148,163,184,0.2)' : '#d1d5db'), flexShrink: 0, transition: 'background 0.2s' }}>
                                    <span style={{ position: 'absolute', top: 3, left: data.is_recurring ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                        
                        <button type="submit" disabled={processing}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, border: 'none', background: processing ? T.textMute : 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', boxShadow: processing ? 'none' : '0 4px 14px rgba(124,58,237,0.35)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { if (!processing) e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            {processing ? <><PHSpinner/> Saving...</> : <>{editingId ? '✅ Update Holiday' : '✅ Add Holiday'}</>}
                        </button>
                        <button type="button" onClick={() => { reset(); setErrors({}); setShowForm(false); setEditingId(null); }} disabled={processing}
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
                <button onClick={() => { setEditingId(null); reset(); setErrors({}); setShowForm(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `1.5px dashed ${T.primary}`, background: T.primarySoft, color: T.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s', opacity: 0.85 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Holiday
                </button>
            )}
        </div>
        </>
    );
}