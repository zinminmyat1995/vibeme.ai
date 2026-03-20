import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';

// ── Helpers ───────────────────────────────────────────────────
function to12h(t) {
    if (!t) return '—';
    const [hStr, mStr] = t.substring(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtHrs(h) {
    const n = parseFloat(h);
    if (!n) return '0 hr';
    return n % 1 === 0 ? `${n} hr${n !== 1 ? 's' : ''}` : `${n} hrs`;
}
function initials(name) {
    return (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Status config ─────────────────────────────────────────────
const STATUS = {
    pending:  { label: 'Pending',  color: '#d97706', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b' },
    approved: { label: 'Approved', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444' },
};

// ── Months ────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Styles ────────────────────────────────────────────────────
const s = {
    wrap:       { maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 },
    card:       { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' },
    listCard:   { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' },
    overlay:    { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    select:     { border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer' },
    input:      { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' },
    label:      { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 },
    btnPrimary: { background: '#0ea5e9', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' },
    btnApprove: { background: '#059669', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' },
    btnReject:  { background: '#fff', border: '1px solid #fca5a5', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#dc2626', cursor: 'pointer' },
    btnCancel:  { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#6b7280', cursor: 'pointer' },
    err:        { fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 },
    empty:      { padding: '48px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 },
};

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function OvertimeIndex({ requests, overtimePolicies, employees, filters, selectedMonth, selectedYear }) {
    const { auth } = usePage().props;
    const user     = auth?.user;
    const roleName = user?.role?.name || 'employee';
    const canApprove = ['management', 'hr', 'admin'].includes(roleName);

    const [month, setMonth]             = useState(selectedMonth || new Date().getMonth() + 1);
    const [year, setYear]               = useState(selectedYear  || new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [showModal, setShowModal]     = useState(false);
    const [confirmModal, setConfirmModal] = useState(null); // { type:'approve'|'reject', req }
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast]             = useState(null);

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }
    function handleFilter(status) {
        setStatusFilter(status);
        router.get('/payroll/overtimes', { month, year, status }, { preserveState: true });
    }
    function handleMonthYear(m, y) {
        router.get('/payroll/overtimes', { month: m, year: y, status: statusFilter });
    }
    function handleApprove(req, segmentsApproved) {
        setActionLoading(true);
        router.patch(`/payroll/overtimes/${req.id}/approve`, { segments: segmentsApproved }, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); showToast('Overtime approved!'); },
            onError:   () => { setActionLoading(false); showToast('Something went wrong.', 'error'); },
        });
    }
    function handleReject(req) {
        setActionLoading(true);
        router.patch(`/payroll/overtimes/${req.id}/reject`, {}, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); showToast('Overtime rejected.'); },
            onError:   () => { setActionLoading(false); showToast('Something went wrong.', 'error'); },
        });
    }

    return (
        <AppLayout title="Overtime Management">
            <Head title="Overtime" />
            <style>{`
                @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
                @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
                .ot-row:hover { background: #f9fafb !important; }
                .ot-seg { transition: background 0.15s; }
                .ot-seg:hover { background: #f0f9ff !important; }
            `}</style>

            {/* Toast */}
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div style={s.wrap}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select style={s.select} value={month} onChange={e => { const m = +e.target.value; setMonth(m); handleMonthYear(m, year); }}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <select style={s.select} value={year} onChange={e => { const y = +e.target.value; setYear(y); handleMonthYear(month, y); }}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button style={s.btnPrimary} onClick={() => setShowModal(true)}>+ Request Overtime</button>
                </div>

                {/* ── Status Tabs ── */}
                <div style={{ ...s.card, padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[{ val: '', label: 'All' }, { val: 'pending', label: 'Pending' }, { val: 'approved', label: 'Approved' }, { val: 'rejected', label: 'Rejected' }].map(tab => (
                            <button key={tab.val} style={{ border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: statusFilter === tab.val ? '#0ea5e9' : 'transparent', color: statusFilter === tab.val ? '#fff' : '#6b7280', transition: 'all 0.15s' }}
                                onClick={() => handleFilter(tab.val)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontSize: 12, color: '#9ca3af', paddingRight: 8 }}>
                        <b style={{ color: '#374151' }}>{requests.total}</b> {requests.total === 1 ? 'request' : 'requests'}
                    </span>
                </div>

                {/* ── Request List ── */}
                <div style={s.listCard}>
                    {requests.data.length === 0 ? (
                        <div style={s.empty}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>⏰</div>
                            No overtime requests found
                        </div>
                    ) : requests.data.map((req, idx) => {
                        const statusCfg      = STATUS[req.status] || STATUS.pending;
                        const isLast         = idx === requests.data.length - 1;
                        const isMyRequest    = req.user_id === user?.id;
                        const isAssignedToMe = req.approver_id === user?.id;
                        const showActions    = canApprove && req.status === 'pending' && isAssignedToMe && !isMyRequest;
                        const segments       = req.segments || [];

                        return (
                            <div key={req.id} className="ot-row" style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6', padding: '16px 20px', transition: 'background 0.15s' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

                                    {/* Avatar */}
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0369a1', flexShrink: 0 }}>
                                        {req.user?.avatar_url
                                            ? <img src={req.user.avatar_url} style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }} />
                                            : initials(req.user?.name)}
                                    </div>

                                    {/* Main content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Top row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{req.user?.name || 'You'}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', borderRadius: 6, padding: '2px 8px' }}>
                                                {fmtDate(req.date)}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>
                                                {to12h(req.start_time)} → {to12h(req.end_time)}
                                            </span>
                                            {/* Total hours badge */}
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#0ea5e9', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '2px 8px' }}>
                                                {fmtHrs(req.hours_requested)} total
                                            </span>
                                            {/* Status badge */}
                                            <span style={{ fontSize: 11, fontWeight: 700, color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, borderRadius: 20, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot, display: 'inline-block' }}/>
                                                {statusCfg.label}
                                            </span>
                                        </div>

                                        {/* Segments */}
                                        {segments.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                                                {segments.map(seg => (
                                                    <div key={seg.id} className="ot-seg" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px' }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0ea5e9', flexShrink: 0 }}/>
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                                                            {seg.overtime_policy?.title || 'OT'}
                                                        </span>
                                                        <span style={{ fontSize: 11, color: '#64748b' }}>
                                                            {to12h(seg.start_time)}–{to12h(seg.end_time)}
                                                        </span>
                                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#0ea5e9' }}>
                                                            {fmtHrs(req.status === 'approved' ? seg.hours_approved : seg.hours)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reason */}
                                        {req.reason && (
                                            <div style={{ fontSize: 12, color: '#6b7280', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 7, padding: '5px 10px', display: 'inline-block', maxWidth: '100%' }}>
                                                {req.reason}
                                            </div>
                                        )}

                                        {/* Approved by */}
                                        {req.status === 'approved' && req.approved_by_user && (
                                            <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                                                ✓ Approved by {req.approved_by_user?.name} · {fmtHrs(req.hours_approved)} approved
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        {showActions && (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button style={s.btnApprove} onClick={() => setConfirmModal({ type: 'approve', req })}>✓ Approve</button>
                                                <button style={s.btnReject}  onClick={() => setConfirmModal({ type: 'reject',  req })}>✕ Reject</button>
                                            </div>
                                        )}
                                        {req.approver && req.status === 'pending' && (
                                            <span style={{ fontSize: 11, color: '#9ca3af' }}>→ {req.approver.name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        {Array.from({ length: requests.last_page }, (_, i) => i + 1).map(pg => (
                            <button key={pg} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: requests.current_page === pg ? '#0ea5e9' : '#fff', color: requests.current_page === pg ? '#fff' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                                onClick={() => router.get('/payroll/overtimes', { page: pg, month, year, status: statusFilter })}>
                                {pg}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {showModal && (
                <OTRequestModal
                    employees={employees}
                    roleName={roleName}
                    onClose={() => setShowModal(false)}
                    onSuccess={(msg) => { setShowModal(false); showToast(msg); }}
                    onError={(msg) => showToast(msg, 'error')}
                />
            )}

            {confirmModal && (
                <ConfirmModal
                    type={confirmModal.type}
                    req={confirmModal.req}
                    loading={actionLoading}
                    onCancel={() => setConfirmModal(null)}
                    onApprove={(segs) => handleApprove(confirmModal.req, segs)}
                    onReject={() => handleReject(confirmModal.req)}
                />
            )}
        </AppLayout>
    );
}

// ─────────────────────────────────────────────────────────────
//  OT REQUEST MODAL
// ─────────────────────────────────────────────────────────────
function OTRequestModal({ employees, roleName, onClose, onSuccess, onError }) {
    const isAdmin = roleName === 'admin';
    const [form, setForm]     = useState({ date: '', start_time: '', end_time: '', reason: '', approver_id: employees[0]?.id || '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(null); // segments preview from API (future: real-time)

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.date)       e.date       = 'Date is required.';
        if (!form.start_time) e.start_time = 'Start time is required.';
        if (!form.end_time)   e.end_time   = 'End time is required.';
        if (form.start_time && form.end_time && form.start_time === form.end_time)
            e.end_time = 'Start and end time cannot be the same.';
        if (!form.reason.trim()) e.reason  = 'Reason is required.';
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        router.post('/payroll/overtimes', form, {
            onSuccess: (page) => {
                setSaving(false);
                const flash = page?.props?.flash;
                onSuccess(flash?.success || 'Overtime submitted!');
            },
            onError: (errs) => {
                setSaving(false);
                if (errs.date)       setErrors(p => ({ ...p, date: errs.date }));
                if (errs.start_time) setErrors(p => ({ ...p, start_time: errs.start_time }));
                if (errs.end_time)   setErrors(p => ({ ...p, end_time: errs.end_time }));
                if (errs.reason)     setErrors(p => ({ ...p, reason: errs.reason }));
                const msg = errs.date || errs.start_time || errs.end_time || errs.reason || 'Validation error.';
                onError(msg);
            },
        });
    };

    return (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', animation: 'slideDown 0.2s ease' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Request Overtime</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>OT type will be auto-detected from shift settings</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Date */}
                    <div>
                        <label style={s.label}>Date</label>
                        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                            style={{ ...s.input, borderColor: errors.date ? '#fca5a5' : '#e5e7eb' }}/>
                        {errors.date && <ErrMsg msg={errors.date}/>}
                    </div>

                    {/* Time range */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={s.label}>Start time</label>
                            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
                                style={{ ...s.input, borderColor: errors.start_time ? '#fca5a5' : '#e5e7eb' }}/>
                            {errors.start_time && <ErrMsg msg={errors.start_time}/>}
                        </div>
                        <div>
                            <label style={s.label}>End time</label>
                            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
                                style={{ ...s.input, borderColor: errors.end_time ? '#fca5a5' : '#e5e7eb' }}/>
                            {errors.end_time && <ErrMsg msg={errors.end_time}/>}
                        </div>
                    </div>

                    {/* Auto-detect info box */}
                    {form.start_time && form.end_time && form.start_time !== form.end_time && (
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>⏱️</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 2 }}>OT type will be auto-detected</div>
                                <div style={{ fontSize: 11, color: '#0284c7' }}>
                                    {to12h(form.start_time)} → {to12h(form.end_time)} — segments will be split by day/night shift boundary automatically.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label style={s.label}>Reason</label>
                        <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
                            placeholder="Describe the reason for overtime..."
                            style={{ ...s.input, resize: 'none', borderColor: errors.reason ? '#fca5a5' : '#e5e7eb' }}/>
                        {errors.reason && <ErrMsg msg={errors.reason}/>}
                    </div>

                    {/* Approver — hide for admin */}
                    {!isAdmin && employees.length > 0 && (
                        <div>
                            <label style={s.label}>Approver</label>
                            <select value={form.approver_id} onChange={e => set('approver_id', e.target.value)}
                                style={{ ...s.input, cursor: 'pointer' }}>
                                <option value="">— Select approver —</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role?.name})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Admin note */}
                    {isAdmin && (
                        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065f46', fontWeight: 600 }}>
                            ✓ As admin, this request will be auto-approved.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button style={s.btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
                    <button style={{ ...s.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  CONFIRM MODAL (Approve / Reject)
// ─────────────────────────────────────────────────────────────
function ConfirmModal({ type, req, loading, onCancel, onApprove, onReject }) {
    const isApprove = type === 'approve';
    const segments  = req.segments || [];

    // Approver can adjust hours per segment
    const [segHours, setSegHours] = useState(
        segments.reduce((acc, seg) => ({ ...acc, [seg.id]: seg.hours }), {})
    );

    const totalApproved = Object.values(segHours).reduce((sum, h) => sum + parseFloat(h || 0), 0);

    const handleApproveSubmit = () => {
        const segs = segments.map(seg => ({ id: seg.id, hours_approved: parseFloat(segHours[seg.id] || 0) }));
        onApprove(segs);
    };

    return (
        <div style={s.overlay}>
            <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'slideDown 0.2s ease' }}>

                {/* Top stripe */}
                <div style={{ height: 4, background: isApprove ? '#059669' : '#dc2626' }}/>

                <div style={{ padding: '20px 24px' }}>
                    {/* Icon + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: isApprove ? '#d1fae5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {isApprove ? '✓' : '✕'}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                                {isApprove ? 'Approve Overtime' : 'Reject Overtime'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                {isApprove ? 'Review and adjust approved hours if needed' : 'This will notify the employee'}
                            </div>
                        </div>
                    </div>

                    {/* Request summary */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{req.user?.name}</span>
                            <span style={{ fontSize: 11, color: '#0369a1', background: '#e0f2fe', borderRadius: 5, padding: '1px 7px', fontWeight: 700 }}>
                                {fmtDate(req.date)}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                                {to12h(req.start_time)} → {to12h(req.end_time)}
                            </span>
                        </div>
                        {req.reason && (
                            <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>"{req.reason}"</div>
                        )}
                    </div>

                    {/* Segments — approver can adjust hours */}
                    {isApprove && segments.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                OT Segments — adjust hours if needed
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {segments.map(seg => (
                                    <div key={seg.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                                                {seg.overtime_policy?.title || 'OT'}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                                                {to12h(seg.start_time)} → {to12h(seg.end_time)}
                                                <span style={{ marginLeft: 6, color: '#94a3b8' }}>requested: {fmtHrs(seg.hours)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: '#6b7280' }}>Approve</span>
                                            <input
                                                type="number"
                                                value={segHours[seg.id] ?? seg.hours}
                                                min={0}
                                                max={seg.hours}
                                                step={0.5}
                                                onChange={e => setSegHours(p => ({ ...p, [seg.id]: e.target.value }))}
                                                style={{ width: 60, border: '1px solid #cbd5e1', borderRadius: 7, padding: '4px 8px', fontSize: 12, fontWeight: 700, color: '#0ea5e9', textAlign: 'center' }}
                                            />
                                            <span style={{ fontSize: 11, color: '#6b7280' }}>hrs</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>Total approved:</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{fmtHrs(totalApproved)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button style={s.btnCancel} onClick={onCancel} disabled={loading}>Cancel</button>
                    {isApprove
                        ? <button style={{ ...s.btnApprove, padding: '9px 20px', fontSize: 13, opacity: loading ? 0.6 : 1 }} onClick={handleApproveSubmit} disabled={loading}>
                            {loading ? 'Approving...' : '✓ Approve'}
                          </button>
                        : <button style={{ background: '#dc2626', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: loading ? 0.6 : 1 }} onClick={onReject} disabled={loading}>
                            {loading ? 'Rejecting...' : '✕ Reject'}
                          </button>
                    }
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function ErrMsg({ msg }) {
    return (
        <div style={s.err}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
            {msg}
        </div>
    );
}

function Toast({ msg, type, onClose }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: isErr ? '#fef2f2' : '#ecfdf5', border: `1px solid ${isErr ? '#fca5a5' : '#6ee7b7'}`, borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, minWidth: 260, animation: 'slideDown 0.2s ease' }}>
            <span style={{ fontSize: 16 }}>{isErr ? '⚠️' : '✓'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: isErr ? '#dc2626' : '#059669', flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>✕</button>
        </div>
    );
}