import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '@/Layouts/AppLayout';
import { usePage, router } from '@inertiajs/react';

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

function getTheme(dark) {
    if (dark) return {
        panel: 'rgba(11,23,48,0.88)',
        panelSolid: '#0f1b34',
        panelSoft: 'rgba(255,255,255,0.04)',
        panelSofter: 'rgba(255,255,255,0.07)',
        border: 'rgba(148,163,184,0.13)',
        borderStrong: 'rgba(148,163,184,0.22)',
        text: '#f8fafc',
        textSoft: '#cbd5e1',
        textMute: '#64748b',
        overlay: 'rgba(2,8,23,0.72)',
        shadow: '0 24px 60px rgba(0,0,0,0.38)',
        shadowSoft: '0 4px 16px rgba(0,0,0,0.22)',
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primarySoft: 'rgba(139,92,246,0.16)',
        secondary: '#3b82f6',
        secondarySoft: 'rgba(59,130,246,0.16)',
        success: '#10b981',
        successSoft: 'rgba(16,185,129,0.16)',
        warning: '#f59e0b',
        warningSoft: 'rgba(245,158,11,0.16)',
        danger: '#f87171',
        dangerSoft: 'rgba(248,113,113,0.16)',
        inputBg: 'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148,163,184,0.16)',
        inputBorderFocus: '#8b5cf6',
        modalHeader: 'linear-gradient(135deg,#312e81 0%,#1e40af 100%)',
        rowHover: 'rgba(255,255,255,0.03)',
    };
    return {
        panel: 'rgba(255,255,255,0.92)',
        panelSolid: '#ffffff',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.14)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        overlay: 'rgba(15,23,42,0.42)',
        shadow: '0 20px 50px rgba(15,23,42,0.10)',
        shadowSoft: '0 4px 14px rgba(15,23,42,0.06)',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',
        secondary: '#2563eb',
        secondarySoft: '#dbeafe',
        success: '#059669',
        successSoft: '#d1fae5',
        warning: '#d97706',
        warningSoft: '#fef3c7',
        danger: '#ef4444',
        dangerSoft: '#fee2e2',
        inputBg: '#f8fafc',
        inputBorder: '#e2e8f0',
        inputBorderFocus: '#7c3aed',
        modalHeader: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)',
        rowHover: '#fafbff',
    };
}

const STATUS_CONFIG = {
    pending:  { label: 'Pending',  color: '#d97706', bg: '#fef3c7', bgDark: 'rgba(217,119,6,0.18)', icon: '⏳' },
    approved: { label: 'Approved', color: '#059669', bg: '#d1fae5', bgDark: 'rgba(5,150,105,0.18)', icon: '✓' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', bgDark: 'rgba(220,38,38,0.18)', icon: '✕' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(String(dateStr).split('T')[0] + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function to12h(t) {
    if (!t) return '—';
    const [hStr, mStr] = String(t).substring(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    return `${h % 12 === 0 ? 12 : h % 12}:${m}${h >= 12 ? 'PM' : 'AM'}`;
}

function timeToMinutes(t) {
    if (!t) return 0;
    const [h, min] = t.split(':').map(Number);
    return h * 60 + min;
}

function calcWorkHours(checkIn, checkOut, lunchStart, lunchEnd, workStart, workEnd) {
    if (!checkIn || !checkOut) return '';
    const inM  = timeToMinutes(checkIn);
    const outM = timeToMinutes(checkOut);
    if (outM <= inM) return '';
    const wsM = timeToMinutes(workStart || '08:00');
    const weM = timeToMinutes(workEnd || '17:00');
    const effIn  = Math.max(inM, wsM);
    const effOut = Math.min(outM, weM);
    if (effOut <= effIn) return 0;
    const ls = timeToMinutes(lunchStart || '12:00');
    const le = timeToMinutes(lunchEnd || '13:00');
    const lunchDeduct = Math.max(0, Math.min(effOut, le) - Math.max(effIn, ls));
    const workMins = effOut - effIn - lunchDeduct;
    return Math.max(0, Math.round((workMins / 60) * 100) / 100);
}

function calcLateMinutes(checkIn, workStart, lunchEnd) {
    if (!checkIn || !workStart) return 0;
    const inM = timeToMinutes(checkIn);
    const wsM = timeToMinutes(workStart);
    const leM = timeToMinutes(lunchEnd || '13:00');
    if (inM >= leM) return 0;
    return Math.max(0, inM - wsM);
}

function hToHM(h) {
    if (h === null || h === undefined || h === '') return '—';
    const total = Math.round(parseFloat(h) * 60);
    const hrs   = Math.floor(total / 60);
    const mins  = total % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
}

function PremiumDropdown({ options, value, onChange, placeholder = 'Select...', theme, dark, disabled = false, width = 'auto' }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState({ top: 0, left: 0, width: 0 });
    const triggerRef      = useRef(null);
    const menuRef         = useRef(null);
    const selected        = options.find(o => String(o.value) === String(value) && !o.disabled);

    useEffect(() => {
        const handler = (e) => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function handleOpen() {
        if (disabled) return;
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
        setOpen(v => !v);
    }

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                style={{
                    width, height: 44, padding: '0 14px', borderRadius: 12,
                    border: `1.5px solid ${open ? theme.inputBorderFocus : theme.inputBorder}`,
                    background: dark
                        ? 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
                    color: selected ? theme.text : theme.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: selected ? 600 : 400,
                    boxShadow: open ? `0 0 0 3px ${theme.primary}22` : 'none',
                    transition: 'all 0.18s', opacity: disabled ? 0.5 : 1, outline: 'none'
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    className="hide-scrollbar"
                    style={{
                        position: 'absolute', top: pos.top, left: pos.left, width: pos.width,
                        background: dark ? '#0d1b38' : '#fff',
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 14,
                        boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 40px rgba(15,23,42,0.14)',
                        zIndex: 99999, overflow: 'hidden', animation: 'dropIn 0.18s ease',
                        maxHeight: 240, overflowY: 'auto'
                    }}
                >
                    {options.filter(o => !o.disabled).map(opt => {
                        const isSel = String(opt.value) === String(value);
                        return (
                            <div
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    padding: '10px 14px', fontSize: 13, fontWeight: isSel ? 700 : 500,
                                    color: isSel ? '#fff' : theme.text,
                                    background: isSel ? theme.primary : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.12s'
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}

function RequestFormModal({ saving, setSaving, approvers, roleName, dark, theme, countryConfig, onClose, onSuccess, onError }) {
    const WORK_START  = countryConfig?.work_start || '08:00';
    const WORK_END    = countryConfig?.work_end || '17:00';
    const LUNCH_START = countryConfig?.lunch_start || '12:00';
    const LUNCH_END   = countryConfig?.lunch_end || '13:00';

    const [form, setForm] = useState({
        request_type: 'both',
        date: '',
        check_in_time: '',
        check_out_time: '',
        note: '',
        approver_id: approvers[0]?.id || '',
    });
    const [errors, setErrors] = useState({});

    const set = (k, v) => {
        setForm(f => {
            const next = { ...f, [k]: v };

            if (k === 'request_type') {
                if (v === 'check_in_only') {
                    next.check_out_time = '';
                } else if (v === 'check_out_only') {
                    next.check_in_time = '';
                }
            }

            return next;
        });

        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    const workHoursPreview = useMemo(() => {
        return calcWorkHours(form.check_in_time, form.check_out_time, LUNCH_START, LUNCH_END, WORK_START, WORK_END);
    }, [form.check_in_time, form.check_out_time, LUNCH_START, LUNCH_END, WORK_START, WORK_END]);

    const latePreview = useMemo(() => {
        return form.check_in_time ? calcLateMinutes(form.check_in_time, WORK_START, LUNCH_END) : 0;
    }, [form.check_in_time, WORK_START, LUNCH_END]);

    function validate() {
        const e = {};

        if (!form.date) e.date = 'Date is required';

        if (form.request_type === 'check_in_only' && !form.check_in_time) {
            e.check_in_time = 'Check In is required';
        }

        if (form.request_type === 'check_out_only' && !form.check_out_time) {
            e.check_out_time = 'Check Out is required';
        }

        if (form.request_type === 'both') {
            if (!form.check_in_time) e.check_in_time = 'Check In is required';
            if (!form.check_out_time) e.check_out_time = 'Check Out is required';
        }

        if (!form.note) e.note = 'Reason is required';
        if (roleName !== 'admin' && !form.approver_id) e.approver_id = 'Approver is required';

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;

        setSaving(true);

        router.post('/payroll/check-in-out-requests', form, {
            onSuccess: () => {
                setSaving(false);
                onSuccess();
            },
            onError: (errs) => {
                setSaving(false);
                setErrors(errs);
                const firstErr = Object.values(errs)[0];
                onError(Array.isArray(firstErr) ? firstErr[0] : firstErr || 'Validation error');
            },
        });
    }

    const inp = (hasErr) => ({
        background: theme.inputBg,
        border: `1.5px solid ${hasErr ? theme.danger : theme.inputBorder}`,
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 13,
        color: theme.text,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border 0.15s',
        colorScheme: dark ? 'dark' : 'light',
    });

    const lbl = {
        fontSize: 11,
        fontWeight: 800,
        color: theme.textSoft,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const approverOptions = [
        { value: '', label: 'Select approver', disabled: true },
        ...approvers.map(a => ({ value: a.id, label: a.name })),
    ];

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: theme.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 8000, padding: 20 }}>
            <div style={{
                background: dark ? '#0f1b34' : '#fff',
                borderRadius: 24,
                width: '100%',
                maxWidth: 560,
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: dark ? '0 40px 100px rgba(0,0,0,0.65)' : '0 32px 80px rgba(15,23,42,0.22)',
                border: `1px solid ${theme.border}`,
                animation: 'popIn 0.22s ease'
            }}>
                <div style={{ background: theme.modalHeader, padding: '20px 24px 18px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>
                                Attendance Request
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                                Check In/Out Request
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                            ×
                        </button>
                    </div>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <label style={lbl}>Date <span style={{ color: theme.danger }}>*</span></label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp(errors.date)} />
                            {errors.date && <span style={{ fontSize: 11, color: theme.danger, fontWeight: 600 }}>{errors.date}</span>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <label style={lbl}>Approver {roleName !== 'admin' && <span style={{ color: theme.danger }}>*</span>}</label>
                            {roleName === 'admin' ? (
                                <div style={{ ...inp(false), display: 'flex', alignItems: 'center', color: theme.success, fontWeight: 700 }}>
                                    Auto Approved
                                </div>
                            ) : (
                                <PremiumDropdown
                                    options={approverOptions}
                                    value={form.approver_id}
                                    onChange={v => set('approver_id', v)}
                                    placeholder="Select approver"
                                    theme={theme}
                                    dark={dark}
                                    width="100%"
                                />
                            )}
                            {errors.approver_id && <span style={{ fontSize: 11, color: theme.danger, fontWeight: 600 }}>{errors.approver_id}</span>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <label style={lbl}>Request Type <span style={{ color: theme.danger }}>*</span></label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            {[
                                { value: 'check_in_only', label: 'Check In Only' },
                                { value: 'check_out_only', label: 'Check Out Only' },
                                { value: 'both', label: 'Both In/Out' },
                            ].map(opt => {
                                const active = form.request_type === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => set('request_type', opt.value)}
                                        style={{
                                            border: `1.5px solid ${active ? theme.primary : theme.inputBorder}`,
                                            borderRadius: 12,
                                            padding: '10px 12px',
                                            background: active ? theme.primarySoft : theme.inputBg,
                                            color: active ? theme.primary : theme.textSoft,
                                            fontSize: 12,
                                            fontWeight: active ? 800 : 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <label style={lbl}>
                                Requested Check In
                                {form.request_type !== 'check_out_only' && <span style={{ color: theme.danger }}> *</span>}
                            </label>
                            <input
                                type="time"
                                value={form.check_in_time}
                                disabled={form.request_type === 'check_out_only'}
                                onChange={e => set('check_in_time', e.target.value)}
                                style={{
                                    ...inp(errors.check_in_time),
                                    opacity: form.request_type === 'check_out_only' ? 0.5 : 1,
                                    cursor: form.request_type === 'check_out_only' ? 'not-allowed' : 'default',
                                }}
                            />

                            {errors.check_in_time && (
                                <span style={{ fontSize: 11, color: theme.danger, fontWeight: 600 }}>
                                    {errors.check_in_time}
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <label style={lbl}>
                                Requested Check Out
                                {form.request_type !== 'check_in_only' && <span style={{ color: theme.danger }}> *</span>}
                            </label>
                            <input
                                type="time"
                                value={form.check_out_time}
                                disabled={form.request_type === 'check_in_only'}
                                onChange={e => set('check_out_time', e.target.value)}
                                style={{
                                    ...inp(errors.check_out_time),
                                    opacity: form.request_type === 'check_in_only' ? 0.5 : 1,
                                    cursor: form.request_type === 'check_in_only' ? 'not-allowed' : 'default',
                                }}
                            />

                            {errors.check_out_time && (
                                <span style={{ fontSize: 11, color: theme.danger, fontWeight: 600 }}>
                                    {errors.check_out_time}
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ background: dark ? 'rgba(139,92,246,0.16)' : '#ede9fe', border: `1px solid ${dark ? 'rgba(139,92,246,0.3)' : '#ddd6fe'}`, borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <div>
                            <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 700, textTransform: 'uppercase' }}>Work Schedule</div>
                            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: theme.text }}>
                                {WORK_START} - {WORK_END}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 700, textTransform: 'uppercase' }}>Lunch Break</div>
                            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: theme.text }}>
                                {LUNCH_START} - {LUNCH_END}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 700, textTransform: 'uppercase' }}>Auto Preview</div>
                            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: theme.primary }}>
                                {form.request_type === 'check_in_only' && form.check_in_time
                                    ? `Late ${latePreview}m`
                                    : form.request_type === 'check_out_only' && form.check_out_time
                                    ? `Check Out only`
                                    : workHoursPreview !== ''
                                    ? `${hToHM(workHoursPreview)} / Late ${latePreview}m`
                                    : '—'}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <label style={lbl}>Reason <span style={{ color: theme.danger }}>*</span></label>
                        <textarea
                            value={form.note}
                            onChange={e => set('note', e.target.value)}
                            placeholder="Why are you requesting this check in/out update?"
                            style={{ ...inp(errors.note), height: 88, resize: 'vertical' }}
                        />
                        {errors.note && <span style={{ fontSize: 11, color: theme.danger, fontWeight: 600 }}>{errors.note}</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${theme.border}`, flexShrink: 0, background: dark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
                    <button onClick={onClose}
                        style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border: `1px solid ${theme.border}`, borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: theme.textSoft }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`, border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', color: '#fff', opacity: saving ? 0.65 : 1, display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 24px ${theme.primary}44`, transition: 'all 0.15s' }}>
                        {saving && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                        {saving ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function ConfirmModal({ type, request, loading, dark, theme, onCancel, onApprove, onReject, onDelete }) {
    const isApprove = type === 'approve';
    const isDelete  = type === 'delete';

    const accentColor = isDelete  ? (dark ? '#f87171' : '#dc2626')
                      : isApprove ? (dark ? '#34d399' : '#059669')
                      :             (dark ? '#f87171' : '#dc2626');

    const accentBg = isDelete  ? (dark ? 'rgba(248,113,113,0.14)' : '#fee2e2')
                   : isApprove ? (dark ? 'rgba(16,185,129,0.15)' : '#d1fae5')
                   :             (dark ? 'rgba(248,113,113,0.14)' : '#fee2e2');

    const title   = isDelete ? 'Delete Request' : isApprove ? 'Approve Request' : 'Reject Request';
    const icon    = isDelete ? '🗑' : isApprove ? '✓' : '✕';
    const subtext = isDelete ? 'This action cannot be undone' : 'Employee will be notified';

    return createPortal(
        <div style={{ position:'fixed', inset:0, background:theme.overlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:9000, padding:20 }}>
            <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius:22, width:'100%', maxWidth:420, boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6)' : '0 24px 60px rgba(15,23,42,0.18)', overflow:'hidden', border:`1px solid ${theme.border}`, animation:'popIn 0.22s ease' }}>
                <div style={{ height:4, background: isDelete ? '#ef4444' : isApprove ? '#059669' : '#ef4444' }} />
                <div style={{ padding:'26px 26px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                        <div style={{ width:46, height:46, borderRadius:14, background:accentBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, border:`1px solid ${accentColor}33` }}>
                            {icon}
                        </div>
                        <div>
                            <div style={{ fontSize:16, fontWeight:900, color:theme.text }}>{title}</div>
                            <div style={{ fontSize:11, color:theme.textMute, marginTop:3 }}>{subtext}</div>
                        </div>
                    </div>

                    <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border:`1px solid ${theme.border}`, borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:theme.text }}>
                            {isDelete ? 'Your request' : request.user?.name}
                        </div>
                        <div style={{ fontSize:12, color:theme.textSoft }}>{formatDate(request.date)}</div>
                        <div style={{ display:'flex', gap:12, fontSize:12, color:theme.textSoft }}>
                            <span>In: <strong>{to12h(request.requested_check_in_time)}</strong></span>
                            <span>Out: <strong>{to12h(request.requested_check_out_time)}</strong></span>
                        </div>
                        {request.note && (
                            <div style={{ fontSize:11, color:theme.textMute, fontStyle:'italic', borderTop:`1px solid ${theme.border}`, paddingTop:8 }}>
                                "{request.note}"
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'0 26px 22px' }}>
                    <button onClick={onCancel} disabled={loading}
                        style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border:`1px solid ${theme.border}`, borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', color:theme.textSoft }}>
                        Cancel
                    </button>

                    {isDelete ? (
                        <button onClick={onDelete} disabled={loading}
                            style={{ background: dark ? 'rgba(248,113,113,0.18)' : '#ef4444', border:`1px solid ${dark ? 'rgba(248,113,113,0.35)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#f87171' : '#fff', opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'Deleting...' : '🗑 Delete'}
                        </button>
                    ) : isApprove ? (
                        <button onClick={onApprove} disabled={loading}
                            style={{ background: dark ? 'rgba(16,185,129,0.2)' : '#059669', border:`1px solid ${dark ? 'rgba(16,185,129,0.4)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#34d399' : '#fff', opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'Approving...' : '✓ Approve'}
                        </button>
                    ) : (
                        <button onClick={onReject} disabled={loading}
                            style={{ background: dark ? 'rgba(248,113,113,0.18)' : '#ef4444', border:`1px solid ${dark ? 'rgba(248,113,113,0.35)' : 'transparent'}`, borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', color: dark ? '#f87171' : '#fff', opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'Rejecting...' : '✕ Reject'}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── REPLACE the entire RequestRow function with this ───────────────────────
// UI ONLY — logic unchanged

function RequestRow({ req, dark, theme, canApprove, userId, onApprove, onReject, onDelete, isLast }) {
    const statusCfg       = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
    const isMyRequest     = req.user_id === userId;
    const isAssignedToMe  = req.approver_id === userId;
    const showActions     = canApprove && req.status === 'pending' && isAssignedToMe && !isMyRequest;
    const showDelete      = isMyRequest && req.status === 'pending';

    const statusBg    = dark ? statusCfg.bgDark : statusCfg.bg;
    const accentColor = req.status === 'approved' ? theme.success
                      : req.status === 'rejected' ? theme.danger
                      : theme.primary;

    const typeLabel = req.requested_check_in_time && req.requested_check_out_time
        ? 'Both'
        : req.requested_check_in_time ? 'In Only' : 'Out Only';

    // Shared chip label style (IN / OUT / WH / Late / Reason)
    const chipLabel = {
        fontSize: 9,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginRight: 5,
    };
    const chipValue = {
        fontSize: 12,
        fontWeight: 700,
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'stretch',
                borderBottom: isLast ? 'none' : `1px solid ${theme.border}`,
                transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            {/* Left accent bar */}
            <div style={{ width: 3, flexShrink: 0, background: accentColor }} />

            {/* Main content */}
            <div style={{ flex: 1, padding: '13px 18px', minWidth: 0 }}>

                {/* ── Row 1: date · status · type  /  right: approver + delete ── */}
                <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 10,
                }}>
                    {/* Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>
                            {formatDate(req.date)}
                        </span>
                        <span style={{
                            fontSize: 10, fontWeight: 700,
                            background: statusBg, color: statusCfg.color,
                            borderRadius: 99, padding: '2px 8px',
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                        }}>
                            {statusCfg.icon} {statusCfg.label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMute }}>
                            {typeLabel}
                        </span>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

                        {/* CHANGE 1: Awaiting stacked — "Awaiting" label + name below */}
                        {req.status === 'pending' && req.approver && !showActions && (
                            <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                                <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 500 }}>
                                    Awaiting
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.secondary }}>
                                    {req.approver.name}
                                </div>
                            </div>
                        )}

                        {/* Approved by */}
                        {req.status === 'approved' && req.approvedBy && (
                            <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                                <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 500 }}>
                                    Approved by
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.success }}>
                                    {req.approvedBy.name}
                                </div>
                            </div>
                        )}

                        {/* Rejected by */}
                        {req.status === 'rejected' && req.approvedBy && (
                            <div style={{ textAlign: 'right', lineHeight: 1.5 }}>
                                <div style={{ fontSize: 10, color: theme.textMute, fontWeight: 500 }}>
                                    Rejected by
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: theme.danger }}>
                                    {req.approvedBy.name}
                                </div>
                            </div>
                        )}

                        {/* Approve / Reject buttons */}
                        {showActions && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                {/* Approve — solid green pill */}
                                <button
                                    onClick={() => onApprove(req)}
                                    style={{
                                        background: dark
                                            ? 'linear-gradient(135deg,#065f46,#059669)'
                                            : 'linear-gradient(135deg,#059669,#10b981)',
                                        border: 'none',
                                        borderRadius: 20,
                                        padding: '6px 16px',
                                        fontSize: 11, fontWeight: 700,
                                        cursor: 'pointer',
                                        color: '#fff',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                                        transition: 'opacity 0.15s, box-shadow 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.opacity = '0.88';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.45)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.opacity = '1';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.35)';
                                    }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="3"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    Approve
                                </button>

                                {/* Reject — solid red pill, same shape */}
                                <button
                                    onClick={() => onReject(req)}
                                    style={{
                                        background: dark
                                            ? 'linear-gradient(135deg,rgba(220,38,38,0.28),rgba(239,68,68,0.22))'
                                            : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                                        border: 'none',
                                        borderRadius: 20,
                                        padding: '6px 16px',
                                        fontSize: 11, fontWeight: 700,
                                        cursor: 'pointer',
                                        color: dark ? '#f87171' : '#dc2626',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        boxShadow: dark
                                            ? '0 2px 8px rgba(248,113,113,0.15)'
                                            : '0 2px 8px rgba(220,38,38,0.10)',
                                        transition: 'opacity 0.15s, box-shadow 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.opacity = '0.82';
                                        e.currentTarget.style.boxShadow = dark
                                            ? '0 4px 14px rgba(248,113,113,0.25)'
                                            : '0 4px 14px rgba(220,38,38,0.18)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.opacity = '1';
                                        e.currentTarget.style.boxShadow = dark
                                            ? '0 2px 8px rgba(248,113,113,0.15)'
                                            : '0 2px 8px rgba(220,38,38,0.10)';
                                    }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                    Reject
                                </button>
                            </div>
                        )}

                        {/* CHANGE 2: Delete — border none, faint icon, hover shows color */}
                        {showDelete && (
                            <button
                                onClick={() => onDelete(req)}
                                title="Delete request"
                                style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s', flexShrink: 0,
                                    color: dark ? 'rgba(248,113,113,0.4)' : '#fca5a5',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = dark ? 'rgba(248,113,113,0.16)' : '#fee2e2';
                                    e.currentTarget.style.color = dark ? '#f87171' : '#dc2626';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = dark ? 'rgba(248,113,113,0.4)' : '#fca5a5';
                                }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Employee info row (approver/all view) ── */}
                {req.user && !isMyRequest && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        {req.user.avatar_url ? (
                            <img src={`/storage/${req.user.avatar_url}`} alt={req.user.name}
                                style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                            <div style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                background: theme.primarySoft,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800, color: theme.primary,
                            }}>
                                {req.user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{req.user.name}</span>
                        {req.user.position && (
                            <span style={{ fontSize: 11, color: theme.textMute }}>{req.user.position}</span>
                        )}
                        {req.user.department && (
                            <span style={{ fontSize: 11, color: theme.secondary }}>{req.user.department}</span>
                        )}
                    </div>
                )}

                {/* ── Times row: IN → OUT · WH · Late ── */}
                {/* CHANGE 3 & 4: WH and Late use same chipLabel+chipValue style as IN/OUT */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 14, marginTop: 9, flexWrap: 'wrap',
                }}>
                    {req.requested_check_in_time && (
                        <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                            <span style={{ ...chipLabel, color: theme.textMute }}>IN</span>
                            <span style={{ ...chipValue, color: theme.text }}>
                                {to12h(req.requested_check_in_time)}
                            </span>
                        </span>
                    )}

                    {req.requested_check_in_time && req.requested_check_out_time && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                            stroke={theme.textMute} strokeWidth="2.5" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                        </svg>
                    )}

                    {req.requested_check_out_time && (
                        <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                            <span style={{ ...chipLabel, color: theme.textMute }}>OUT</span>
                            <span style={{ ...chipValue, color: theme.text }}>
                                {to12h(req.requested_check_out_time)}
                            </span>
                        </span>
                    )}

                    {/* CHANGE 3: WH — same chip style, neutral color */}
                    {req.requested_work_hours && (
                        <>
                            <span style={{ color: theme.border, fontSize: 12, lineHeight: 1 }}>·</span>
                            <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                                <span style={{ ...chipLabel, color: theme.textMute }}>WH</span>
                                <span style={{ ...chipValue, color: theme.text }}>
                                    {hToHM(req.requested_work_hours)}
                                </span>
                            </span>
                        </>
                    )}

                    {/* CHANGE 4: Late — same chip style, warning color */}
                    {req.requested_late_minutes > 0 && (
                        <>
                            <span style={{ color: theme.border, fontSize: 12, lineHeight: 1 }}>·</span>
                            <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                                <span style={{ ...chipLabel, color: theme.warning }}>Late</span>
                                <span style={{ ...chipValue, color: theme.warning }}>
                                    {req.requested_late_minutes}m
                                </span>
                            </span>
                        </>
                    )}
                </div>

                {/* CHANGE 5: Reason — separate row, no quotes, same chip style */}
                {req.note && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'baseline',
                        marginTop: 6,
                    }}>
                        <span style={{ ...chipLabel, color: theme.textMute }}>Reason</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: theme.textSoft }}>
                            {req.note}
                        </span>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function AttendanceRequestIndex({ requests, approvers, filters, selectedMonth, selectedYear, countryConfig }) {
    const { auth } = usePage().props;
    const user     = auth?.user;
    const roleName = user?.role?.name || 'employee';
    const dark     = useReactiveTheme();
    const theme    = useMemo(() => getTheme(dark), [dark]);

    const canApprove = ['management', 'hr', 'admin'].includes(roleName);
    const canViewAll = ['hr', 'admin', 'management'].includes(roleName);

    const [mainTab, setMainTab]             = useState('my');
    const [month, setMonth]                 = useState(selectedMonth || new Date().getMonth() + 1);
    const [year, setYear]                   = useState(selectedYear || new Date().getFullYear());
    const [statusFilter, setStatusFilter]   = useState(filters?.status || '');
    const [showModal, setShowModal]         = useState(false);
    const [saving, setSaving]               = useState(false);
    const [confirmModal, setConfirmModal]   = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    function handleMonthYearFilter(m, y) {
        router.get('/payroll/check-in-out-requests', { month: m, year: y, status: statusFilter });
    }

    function handleStatusFilter(s) {
        setStatusFilter(s);
        router.get('/payroll/check-in-out-requests', { status: s, month, year }, { preserveState: true });
    }

    function handleApprove(req) {
        setActionLoading(true);
        router.patch(`/payroll/check-in-out-requests/${req.id}/approve`, {}, {
            onSuccess: () => {
                setConfirmModal(null);
                setActionLoading(false);
            },
            onError: (errors) => {
                setActionLoading(false);
                setConfirmModal(null);
                // 404 — request ကို requester က ဖျက်သွားပြီ
                const msg = errors?.message || 'Request no longer exists. It may have been deleted by the requester.';
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: { message: msg, type: 'error' }
                }));
            },
        });
    }

    function handleReject(req) {
        setActionLoading(true);
        router.patch(`/payroll/check-in-out-requests/${req.id}/reject`, {}, {
            onSuccess: () => {
                setConfirmModal(null);
                setActionLoading(false);
            },
            onError: (errors) => {
                setActionLoading(false);
                setConfirmModal(null);
                const msg = errors?.message || 'Request no longer exists. It may have been deleted by the requester.';
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: { message: msg, type: 'error' }
                }));
            },
        });
    }

    // handleDelete function ထည့်
    function handleDelete(req) {
        setActionLoading(true);
        router.delete(`/payroll/check-in-out-requests/${req.id}`, {
            onSuccess: () => {
                setConfirmModal(null);
                setActionLoading(false);
            },
            onError: () => {
                setActionLoading(false);
                setConfirmModal(null);
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: { message: 'Request no longer exists or could not be deleted.', type: 'error' }
                }));
            },
        });
    }

    const myRequests   = requests.data.filter(r => r.user_id === user?.id);
    const pendingForMe = requests.data.filter(r => r.approver_id === user?.id && r.user_id !== user?.id);
    const pendingCount = pendingForMe.filter(r => r.status === 'pending').length;

    let displayList = [];
    if (mainTab === 'my') displayList = myRequests;
    else if (mainTab === 'approvals') displayList = pendingForMe;
    else displayList = requests.data;

    const monthOpts = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
    const yearOpts  = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: String(y) }));
    const statusOpts = [
        { value: '', label: 'All Status' },
        { value: 'pending', label: '⏳ Pending' },
        { value: 'approved', label: '✓ Approved' },
        { value: 'rejected', label: '✕ Rejected' },
    ];

    const tabs = [
        { key: 'my', label: 'My Requests', count: myRequests.length, alert: false },
        ...(canApprove ? [{ key: 'approvals', label: 'Pending Approvals', count: pendingCount, alert: pendingCount > 0 }] : []),
        ...(canViewAll ? [{ key: 'all', label: 'All Requests', count: requests.total, alert: false }] : []),
    ];

    return (
        <AppLayout title="Check In/Out Request">
            <style>{`
                @keyframes popIn   { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
                @keyframes spin    { to { transform:rotate(360deg); } }
                @keyframes dropIn  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
                .hide-scrollbar::-webkit-scrollbar { display:none; }
                .hide-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <PremiumDropdown
                            options={monthOpts}
                            value={month}
                            onChange={v => {
                                const m = Number(v);
                                setMonth(m);
                                handleMonthYearFilter(m, year);
                            }}
                            theme={theme}
                            dark={dark}
                            width={145}
                        />
                        <PremiumDropdown
                            options={yearOpts}
                            value={year}
                            onChange={v => {
                                const y = Number(v);
                                setYear(y);
                                handleMonthYearFilter(month, y);
                            }}
                            theme={theme}
                            dark={dark}
                            width={110}
                        />
                        <PremiumDropdown
                            options={statusOpts}
                            value={statusFilter}
                            onChange={v => handleStatusFilter(v)}
                            theme={theme}
                            dark={dark}
                            width={150}
                        />
                    </div>

                    <button onClick={() => setShowModal(true)}
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${dark ? '#6d28d9' : '#4f46e5'})`, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 22px ${theme.primary}44`, transition: 'all 0.15s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Request Check In/Out
                    </button>
                </div>

                <div style={{ background: dark ? '#0f1b34' : '#fff', borderRadius: 18, border: `1px solid ${theme.border}`, boxShadow: theme.shadowSoft, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, padding: '0 4px', overflowX: 'auto' }} className="hide-scrollbar">
                        {tabs.map(tab => {
                            const isActive = mainTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setMainTab(tab.key)}
                                    style={{
                                        padding: '14px 18px', fontSize: 13, fontWeight: isActive ? 800 : 500,
                                        color: isActive ? theme.primary : theme.textMute,
                                        background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                        borderBottom: isActive ? `2.5px solid ${theme.primary}` : '2.5px solid transparent',
                                        display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
                                    }}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '2px 8px', background: tab.alert ? (dark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : (isActive ? theme.primarySoft : (dark ? 'rgba(255,255,255,0.08)' : '#f3f4f6')), color: tab.alert ? theme.warning : (isActive ? theme.primary : theme.textMute) }}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {displayList.length === 0 ? (
                        <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>{mainTab === 'approvals' ? '🎉' : '📭'}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: theme.textSoft, marginBottom: 4 }}>
                                {mainTab === 'approvals' ? 'No pending approvals' : 'No check in/out requests found'}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textMute }}>
                                {mainTab === 'approvals' ? 'All caught up!' : 'Click "Request Check In/Out" to submit a new request.'}
                            </div>
                        </div>
                    ) : (
                        displayList.map((req, idx) => (
                            <RequestRow
                                key={req.id}
                                req={req}
                                dark={dark}
                                theme={theme}
                                canApprove={canApprove}
                                userId={user?.id}
                                onApprove={r => setConfirmModal({ type: 'approve', request: r })}
                                onReject={r => setConfirmModal({ type: 'reject', request: r })}
                                onDelete={r => setConfirmModal({ type: 'delete', request: r })}
                                isLast={idx === displayList.length - 1}
                            />
                        ))
                    )}

                    {mainTab === 'all' && requests.last_page > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 20px', borderTop: `1px solid ${theme.border}` }}>
                            {Array.from({ length: requests.last_page }, (_, i) => i + 1).map(page => {
                                const isActive = requests.current_page === page;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => router.get('/payroll/check-in-out-requests', { page, status: statusFilter, month, year })}
                                        style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${isActive ? theme.primary : theme.border}`, background: isActive ? theme.primary : 'transparent', color: isActive ? '#fff' : theme.textSoft, fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <RequestFormModal
                    saving={saving}
                    setSaving={setSaving}
                    approvers={approvers}
                    roleName={roleName}
                    dark={dark}
                    theme={theme}
                    countryConfig={countryConfig}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => setShowModal(false)}
                    onError={msg => window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'error' } }))}
                />
            )}

            {confirmModal && (
                <ConfirmModal
                    type={confirmModal.type}
                    request={confirmModal.request}
                    loading={actionLoading}
                    dark={dark}
                    theme={theme}
                    onCancel={() => setConfirmModal(null)}
                    onApprove={() => handleApprove(confirmModal.request)}
                    onReject={() => handleReject(confirmModal.request)}
                    onDelete={() => handleDelete(confirmModal.request)}

                />
            )}
        </AppLayout>
    );
}