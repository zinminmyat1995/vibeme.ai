import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────
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

// ── Status config ──────────────────────────────────────────────
const STATUS = {
    pending:  { label: 'Pending',  color: '#d97706', bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b' },
    approved: { label: 'Approved', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', dot: '#10b981' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444' },
};

// OT type color mapping
const OT_COLORS = {
    'Day Weekday OT':    { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    'Night Weekday OT':  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    'Day Weekend OT':    { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
    'Night Weekend OT':  { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
    'Public Holiday OT': { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
};
function getOTColor(title) {
    return OT_COLORS[title] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const s = {
    wrap:       {  margin: '0 auto',  display: 'flex', flexDirection: 'column', gap: 20 },
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
    const user      = auth?.user;
    const roleName  = user?.role?.name || 'employee';
    const canApprove = ['management', 'hr', 'admin'].includes(roleName);

    const [month, setMonth]               = useState(selectedMonth || new Date().getMonth() + 1);
    const [year, setYear]                 = useState(selectedYear  || new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [showModal, setShowModal]       = useState(false);
    const [confirmModal, setConfirmModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast]               = useState(null);

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
                .ot-row { background: #fff; }
                .ot-row:hover { background: #f8fafc; }
            `}</style>

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

                {/* ── OT Policy Cards (Leave-style summary) ── */}
                {overtimePolicies && overtimePolicies.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                        {overtimePolicies.map((pol) => {
                            const c = getOTColor(pol.title);
                            const shiftLabel = pol.shift_type === 'day' ? '☀️ Day' : pol.shift_type === 'night' ? '🌙 Night' : '🕐 All Day';
                            const dayLabel   = pol.day_type === 'public_holiday' ? 'Public Holiday' : pol.day_type === 'weekend' ? 'Weekend' : 'Weekday';
                            const rateLabel  = pol.rate_type === 'multiplier' ? `${Number(pol.rate_value).toFixed(1)}x` : Number(pol.rate_value).toLocaleString();
                            return (
                                <div key={pol.id} style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                    {/* Title + active dot */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: c.color }}>{pol.title}</span>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: pol.is_active ? '#10b981' : '#d1d5db', flexShrink: 0 }}/>
                                    </div>
                                    {/* Day type + shift */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{dayLabel}</span>
                                        <span style={{ fontSize: 11, color: '#6b7280' }}>{shiftLabel}</span>
                                    </div>
                                    {/* Rate */}
                                    <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 8 }}>
                                        <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Rate</div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: c.color, lineHeight: 1 }}>{rateLabel}</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{pol.rate_type === 'multiplier' ? 'of base rate' : 'flat amount'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Status Tabs ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 10, padding: 3 }}>
                        {[{ val: '', label: 'All' }, { val: 'pending', label: 'Pending' }, { val: 'approved', label: 'Approved' }, { val: 'rejected', label: 'Rejected' }].map(tab => (
                            <button key={tab.val} style={{ border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', background: statusFilter === tab.val ? '#0ea5e9' : 'transparent', color: statusFilter === tab.val ? '#fff' : '#6b7280', fontWeight: statusFilter === tab.val ? 700 : 500 }}
                                onClick={() => handleFilter(tab.val)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>{requests.total}</span> {requests.total === 1 ? 'request' : 'requests'}
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
                        const isMultiDay     = req.end_date && req.end_date !== req.start_date;

                        // Group segments by segment_date
                        const grouped = {};
                        segments.forEach(seg => {
                            const d = seg.segment_date || req.start_date;
                            if (!grouped[d]) grouped[d] = [];
                            grouped[d].push(seg);
                        });
                        const groupedDates = Object.keys(grouped).sort();
                        const hasMultiGroup = groupedDates.length > 1;

                        // Per-type totals for summary
                        const typeTotals = {};
                        segments.forEach(seg => {
                            const title = seg.overtime_policy?.title || 'OT';
                            const hrs   = parseFloat(req.status === 'approved' ? seg.hours_approved : seg.hours) || 0;
                            typeTotals[title] = (typeTotals[title] || 0) + hrs;
                        });

                        return (
                            <div key={req.id} className="ot-row" style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6', padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                                    {/* Left color bar */}
                                    <div style={{ width: 3, minHeight: 60, borderRadius: 2, background: statusCfg.dot, flexShrink: 0, alignSelf: 'stretch' }}/>

                                    <div style={{ flex: 1, minWidth: 0 }}>

                                        {/* Row 1: label + status + total hours */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Overtime</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, borderRadius: 99, padding: '2px 8px' }}>
                                                {statusCfg.label}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', borderRadius: 99, padding: '2px 10px' }}>
                                                {fmtHrs(req.hours_requested)} total
                                            </span>
                                           
                                        </div>

                                        {/* Row 2: user info (approver view) */}
                                        {!isMyRequest && req.user && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                {req.user.avatar_url
                                                    ? <img src={`/storage/${req.user.avatar_url}`} alt={req.user.name} style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'cover', flexShrink: 0, border: '1px solid #f3f4f6' }}/>
                                                    : <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0369a1' }}>{initials(req.user.name)}</div>
                                                }
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{req.user.name}</span>
                                                {req.user.position && <span style={{ fontSize: 11, color: '#6b7280' }}>{req.user.position}</span>}
                                                {req.user.department && <><span style={{ color: '#d1d5db' }}>·</span><span style={{ fontSize: 11, color: '#6366f1' }}>{req.user.department}</span></>}
                                            </div>
                                        )}

                                        {/* Row 3: date + time — single or multi */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                            {isMultiDay ? (
                                                <>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{fmtDate(req.start_date)}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>{to12h(req.start_time)}</span>
                                                    <span style={{ color: '#d1d5db' }}>—</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{fmtDate(req.end_date)}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>{to12h(req.end_time)}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{fmtDate(req.start_date)}</span>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', borderRadius: 6, padding: '2px 8px' }}>
                                                        {to12h(req.start_time)} — {to12h(req.end_time)}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Row 4: segments grouped by date */}
                                        {segments.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: hasMultiGroup ? 8 : 4, marginBottom: req.reason ? 8 : 0 }}>
                                                {groupedDates.map(date => (
                                                    <div key={date}>
                                                        {/* Date label above segments */}
                                                        <div style={{ fontSize: 11,color: 'rgba(55, 65, 81, 0.69)', marginBottom: 5 ,fontStyle: "italic"}}>
                                                            {fmtDate(date)}
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                                            {grouped[date].map(seg => {
                                                                const c   = getOTColor(seg.overtime_policy?.title);
                                                                const hrs = fmtHrs(req.status === 'approved' ? seg.hours_approved : seg.hours);
                                                                return (
                                                                    <div key={seg.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '4px 10px' }}>
                                                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, flexShrink: 0 }}/>
                                                                        <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>
                                                                            {seg.overtime_policy?.title || 'OT'}
                                                                        </span>
                                                                        <span style={{ fontSize: 11, color: '#64748b' }}>
                                                                            {to12h(seg.start_time)}–{to12h(seg.end_time)}
                                                                        </span>
                                                                        <span style={{ fontSize: 11, fontWeight: 800, color: c.color }}>{hrs}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Per-type total summary */}
                                                {Object.keys(typeTotals).length > 1 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4, paddingTop: 6, borderTop: '1px dashed #e5e7eb' }}>
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginRight: 4, alignSelf: 'center' }}>TOTAL BY TYPE:</span>
                                                        {Object.entries(typeTotals).map(([title, hrs]) => {
                                                            const c = getOTColor(title);
                                                            return (
                                                                <span key={title} style={{ fontSize: 11, fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 99, padding: '2px 8px' }}>
                                                                    {title.replace(' OT', '')} · {fmtHrs(hrs)}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Row 5: reason */}
                                        {req.reason && (
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                <span style={{ fontWeight: 600, color: '#9ca3af', marginRight: 4 }}>Reason</span>
                                                {req.reason}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: actions */}
                                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        {showActions && (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button style={s.btnApprove} onClick={() => setConfirmModal({ type: 'approve', req })}>✓ Approve</button>
                                                <button style={s.btnReject}  onClick={() => setConfirmModal({ type: 'reject',  req })}>✕ Reject</button>
                                            </div>
                                        )}
                                        {req.status === 'approved' && !showActions && (
                                            <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>✓ Approved</span>
                                        )}
                                        {req.status === 'rejected' && (
                                            <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>✕ Rejected</span>
                                        )}
                                        {req.approver && req.status === 'pending' && !showActions && (
                                            <span style={{ fontSize: 11 }}>
                                                <span style={{ color: '#94a3b8', fontWeight: 500, fontStyle: 'italic' }}>Awaiting </span>
                                                <span style={{ color: '#0369a1', fontWeight: 800 }}>{req.approver.name}</span>
                                            </span>
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

            {/* Modals */}
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
    const [form, setForm] = useState({
        start_date: '', start_time: '',
        end_date:   '', end_time:   '',
        reason: '', approver_id: employees[0]?.id || '',
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const set = (k, v) => {
        setForm(f => {
            const u = { ...f, [k]: v };
            if (k === 'start_date' && u.end_date && u.end_date < v) u.end_date = v;
            return u;
        });
        if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
    };

    const getDurationSummary = () => {
        if (!form.start_date || !form.start_time || !form.end_date || !form.end_time) return null;
        try {
            const start = new Date(`${form.start_date}T${form.start_time}`);
            const end   = new Date(`${form.end_date}T${form.end_time}`);
            if (end <= start) return null;
            const hrs  = ((end - start) / 3600000).toFixed(1);
            const days = Math.ceil((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
            return { hrs, days, isMulti: form.start_date !== form.end_date };
        } catch { return null; }
    };
    const summary = getDurationSummary();

    const validate = () => {
        const e = {};
        if (!form.start_date) e.start_date = 'Start date is required.';
        if (!form.start_time) e.start_time = 'Start time is required.';
        if (!form.end_date)   e.end_date   = 'End date is required.';
        if (!form.end_time)   e.end_time   = 'End time is required.';
        if (form.start_date && form.end_date && form.end_date < form.start_date)
            e.end_date = 'End date must be on or after start date.';
        if (form.start_date === form.end_date && form.start_time === form.end_time)
            e.end_time = 'Start and end cannot be the same.';
        if (!form.reason.trim()) e.reason = 'Reason is required.';
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        router.post('/payroll/overtimes', form, {
            onSuccess: (page) => {
                setSaving(false);
                onSuccess(page?.props?.flash?.success || 'Overtime submitted!');
            },
            onError: (errs) => {
                setSaving(false);
                ['start_date','start_time','end_date','end_time','reason'].forEach(k => {
                    if (errs[k]) setErrors(p => ({ ...p, [k]: errs[k] }));
                });
                onError(errs.start_date || errs.start_time || errs.end_date || errs.end_time || errs.reason || 'Validation error.');
            },
        });
    };

    return (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', animation: 'slideDown 0.2s ease' }}>
                <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Request Overtime</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Multi-day supported · OT type auto-detected</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={s.label}>Start date</label>
                            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={{ ...s.input, borderColor: errors.start_date ? '#fca5a5' : '#e5e7eb' }}/>
                            {errors.start_date && <ErrMsg msg={errors.start_date}/>}
                        </div>
                        <div>
                            <label style={s.label}>Start time</label>
                            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} style={{ ...s.input, borderColor: errors.start_time ? '#fca5a5' : '#e5e7eb' }}/>
                            {errors.start_time && <ErrMsg msg={errors.start_time}/>}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={s.label}>End date</label>
                            <input type="date" value={form.end_date} min={form.start_date || undefined} onChange={e => set('end_date', e.target.value)} style={{ ...s.input, borderColor: errors.end_date ? '#fca5a5' : '#e5e7eb' }}/>
                            {errors.end_date && <ErrMsg msg={errors.end_date}/>}
                        </div>
                        <div>
                            <label style={s.label}>End time</label>
                            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} style={{ ...s.input, borderColor: errors.end_time ? '#fca5a5' : '#e5e7eb' }}/>
                            {errors.end_time && <ErrMsg msg={errors.end_time}/>}
                        </div>
                    </div>

                    {summary && (
                        <div style={{ background: summary.isMulti ? '#fefce8' : '#f0f9ff', border: `1px solid ${summary.isMulti ? '#fde047' : '#bae6fd'}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 16 }}>{summary.isMulti ? '📅' : '⏱️'}</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: summary.isMulti ? '#854d0e' : '#0369a1' }}>
                                    {summary.isMulti ? `Multi-day OT · ${summary.days} days` : 'Same-day OT'}
                                    <span style={{ marginLeft: 8, fontWeight: 800 }}>{summary.hrs} hrs total</span>
                                </div>
                                <div style={{ fontSize: 11, color: summary.isMulti ? '#92400e' : '#0284c7', marginTop: 2 }}>
                                    {to12h(form.start_time)} ({form.start_date}) → {to12h(form.end_time)} ({form.end_date}) · OT types auto-split per day/shift
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label style={s.label}>Reason</label>
                        <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
                            placeholder="Describe the reason for overtime..."
                            style={{ ...s.input, resize: 'none', borderColor: errors.reason ? '#fca5a5' : '#e5e7eb' }}/>
                        {errors.reason && <ErrMsg msg={errors.reason}/>}
                    </div>

                    {!isAdmin && employees.length > 0 && (
                        <div>
                            <label style={s.label}>Approver</label>
                            <select value={form.approver_id} onChange={e => set('approver_id', e.target.value)} style={{ ...s.input, cursor: 'pointer' }}>
                                <option value="">— Select approver —</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role?.name})</option>)}
                            </select>
                        </div>
                    )}
                    {isAdmin && (
                        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065f46', fontWeight: 600 }}>
                            ✓ As admin, this request will be auto-approved.
                        </div>
                    )}
                </div>

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
//  CONFIRM MODAL
// ─────────────────────────────────────────────────────────────
function ConfirmModal({ type, req, loading, onCancel, onApprove, onReject }) {
    const isApprove = type === 'approve';
    const segments  = req.segments || [];
    const [segHours, setSegHours] = useState(
        segments.reduce((acc, seg) => ({ ...acc, [seg.id]: seg.hours }), {})
    );
    const totalApproved = Object.values(segHours).reduce((sum, h) => sum + parseFloat(h || 0), 0);
    const handleApproveSubmit = () => {
        onApprove(segments.map(seg => ({ id: seg.id, hours_approved: parseFloat(segHours[seg.id] || 0) })));
    };

    return (
        <div style={s.overlay}>
            <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'slideDown 0.2s ease', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div style={{ height: 4, background: isApprove ? '#059669' : '#dc2626', flexShrink: 0 }}/>

                {/* Scrollable body */}
                <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: isApprove ? '#d1fae5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {isApprove ? '✓' : '✕'}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{isApprove ? 'Approve Overtime' : 'Reject Overtime'}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{isApprove ? 'Adjust approved hours per segment if needed' : 'This will notify the employee'}</div>
                        </div>
                    </div>

                    {/* Request summary */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{req.user?.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', background: '#e0f2fe', borderRadius: 5, padding: '1px 7px' }}>
                                {fmtHrs(req.hours_requested)} total
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
                            {req.end_date && req.end_date !== req.start_date
                                ? <>{fmtDate(req.start_date)} {to12h(req.start_time)} — {fmtDate(req.end_date)} {to12h(req.end_time)}</>
                                : <>{fmtDate(req.start_date)} · {to12h(req.start_time)} — {to12h(req.end_time)}</>
                            }
                        </div>
                        {req.reason && <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>"{req.reason}"</div>}
                    </div>

                    {/* Segments */}
                    {isApprove && segments.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Segments — adjust hours if needed
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {segments.map(seg => {
                                    const c      = getOTColor(seg.overtime_policy?.title);
                                    const maxHrs = parseFloat(seg.hours) || 0;
                                    return (
                                        <div key={seg.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{seg.overtime_policy?.title || 'OT'}</div>
                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                    {seg.segment_date && <span style={{ marginRight: 6, fontWeight: 600, color: '#374151' }}>{fmtDate(seg.segment_date)}</span>}
                                                    {to12h(seg.start_time)} → {to12h(seg.end_time)}
                                                    <span style={{ marginLeft: 6, color: '#94a3b8' }}>req: {fmtHrs(seg.hours)}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 11, color: '#6b7280' }}>Approve</span>
                                                <input
                                                    type="number"
                                                    value={segHours[seg.id] ?? seg.hours}
                                                    min={0}
                                                    max={maxHrs}
                                                    step={0.01}
                                                    onKeyDown={e => {
                                                        // Allow: backspace, delete, tab, escape, enter, dot, digits, arrow keys
                                                        const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','.'];
                                                        if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                        // Block second dot
                                                        if (e.key === '.' && String(segHours[seg.id] ?? seg.hours).includes('.')) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onChange={e => {
                                                        const raw = e.target.value;
                                                        // Allow empty string (user clearing) or valid number
                                                        if (raw === '' || raw === '.') {
                                                            setSegHours(p => ({ ...p, [seg.id]: raw }));
                                                            return;
                                                        }
                                                        const num = parseFloat(raw);
                                                        if (isNaN(num)) return;
                                                        // Clamp to max (requested hours)
                                                        const clamped = Math.min(num, maxHrs);
                                                        // Only allow 2 decimal places
                                                        const rounded = Math.round(clamped * 100) / 100;
                                                        setSegHours(p => ({ ...p, [seg.id]: rounded }));
                                                    }}
                                                    style={{ width: 64, border: `1px solid ${c.border}`, borderRadius: 7, padding: '4px 8px', fontSize: 12, fontWeight: 700, color: c.color, textAlign: 'center', background: '#fff' }}
                                                />
                                                <span style={{ fontSize: 11, color: '#6b7280' }}>hrs</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>Total approved:</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{fmtHrs(totalApproved)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — always visible */}
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
                    <button style={s.btnCancel} onClick={onCancel} disabled={loading}>Cancel</button>
                    {isApprove
                        ? <button style={{ ...s.btnApprove, padding: '9px 20px', fontSize: 13, opacity: loading ? 0.6 : 1 }} onClick={handleApproveSubmit} disabled={loading}>{loading ? 'Approving...' : '✓ Approve'}</button>
                        : <button style={{ background: '#dc2626', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: loading ? 0.6 : 1 }} onClick={onReject} disabled={loading}>{loading ? 'Rejecting...' : '✕ Reject'}</button>
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