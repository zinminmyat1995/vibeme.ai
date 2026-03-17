import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage, router } from '@inertiajs/react';

function Toast({ message, type, onClose }) {
    if (!message) return null;
    const bg    = type === 'success' ? '#d1fae5' : '#fee2e2';
    const color = type === 'success' ? '#059669' : '#dc2626';
    return (
        <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', alignItems:'center', gap:12, background:bg, border:`1px solid ${color}`, borderRadius:12, padding:'14px 20px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', minWidth:300 }}>
            <span style={{ width:24, height:24, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>{type === 'success' ? '✓' : '✕'}</span>
            <span style={{ fontSize:13, fontWeight:600, color, flex:1 }}>{message}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color, fontSize:18, padding:0 }}>×</button>
        </div>
    );
}

const LEAVE_TYPE_CONFIG = {
    annual:    { label:'Annual Leave',    color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
    medical:   { label:'Medical Leave',   color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
    emergency: { label:'Emergency Leave', color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
    unpaid:    { label:'Unpaid Leave',    color:'#6b7280', bg:'#f9fafb', border:'#e5e7eb' },
    maternity: { label:'Maternity Leave', color:'#7c3aed', bg:'#faf5ff', border:'#ddd6fe' },
    paternity: { label:'Paternity Leave', color:'#059669', bg:'#f0fdf4', border:'#bbf7d0' },
};

const STATUS_CONFIG = {
    pending:  { label:'Pending',  color:'#d97706', bg:'#fef3c7' },
    approved: { label:'Approved', color:'#059669', bg:'#d1fae5' },
    rejected: { label:'Rejected', color:'#dc2626', bg:'#fee2e2' },
};

const DAY_TYPE_CONFIG = {
    full_day:    { label:'Full Day',    color:'#374151', bg:'#f3f4f6' },
    half_day_am: { label:'AM Half Day', color:'#2563eb', bg:'#dbeafe' },
    half_day_pm: { label:'PM Half Day', color:'#7c3aed', bg:'#ede9fe' },
};

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr.split('T')[0] + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function formatNum(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return n % 1 === 0 ? String(Math.round(n)) : String(n);
}

export default function LeaveIndex({ requests, leaveBalances, leavePolicies, employees, filters ,selectedMonth,selectedYear,}) {
    const { auth } = usePage().props;
    const user     = auth?.user;
    const roleName = user?.role?.name || 'employee';

    // ── Flow: Member→Management, Management→HR, HR→Admin ──
    const canApprove = ['management', 'hr', 'admin'].includes(roleName);
    const canViewAll = ['hr', 'admin', 'management'].includes(roleName);

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const [month, setMonth]               = useState(selectedMonth || new Date().getMonth() + 1);
    const [year, setYear]                 = useState(selectedYear  || new Date().getFullYear());
    const [showModal, setShowModal]           = useState(false);
    const [saving, setSaving]                 = useState(false);
    const [actionLoading, setActionLoading]   = useState(false);
    const [toast, setToast]                   = useState(null);
    const [statusFilter, setStatusFilter]     = useState(filters?.status || '');
    const [confirmModal, setConfirmModal]     = useState(null);

    function handleMonthYearFilter(newMonth, newYear) {
        router.get('/payroll/leaves', {
            month:  newMonth,
            year:   newYear,
            status: statusFilter,
        });
    }

    function showToast(msg, type = 'success') {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    function handleFilter(status) {
        setStatusFilter(status);
        router.get('/payroll/leaves', { status }, { preserveState: true });
    }

    function handleApprove(req) {
        setActionLoading(true);
        router.patch(`/payroll/leaves/${req.id}/approve`, {}, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); showToast('Leave approved!'); },
            onError:   () => { setActionLoading(false); showToast('Something went wrong', 'error'); },
        });
    }

    function handleReject(req) {
        setActionLoading(true);
        router.patch(`/payroll/leaves/${req.id}/reject`, {}, {
            onSuccess: () => { setConfirmModal(null); setActionLoading(false); showToast('Leave rejected!'); },
            onError:   () => { setActionLoading(false); showToast('Something went wrong', 'error'); },
        });
    }

    const policyMap  = {};
    leavePolicies.forEach(p => { policyMap[p.leave_type] = p; });
    const balanceMap = {};
    leaveBalances.forEach(b => { balanceMap[b.leave_type] = b; });
    const approvers = employees;

    return (
        <AppLayout title="Leave Management">
            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
            <div style={s.wrap}>

                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    {/* Month/Year Filter */}
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <select
                            style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'7px 11px', fontSize:13, color:'#374151', cursor:'pointer' }}
                            value={month}
                            onChange={e => {
                                const m = Number(e.target.value);
                                setMonth(m);
                                handleMonthYearFilter(m, year);
                            }}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i+1}>{m}</option>
                            ))}
                        </select>
                        <select
                            style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'7px 11px', fontSize:13, color:'#374151', cursor:'pointer' }}
                            value={year}
                            onChange={e => {
                                const y = Number(e.target.value);
                                setYear(y);
                                handleMonthYearFilter(month, y);
                            }}
                        >
                            {[2024,2025,2026,2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button style={s.btnPrimary} onClick={() => setShowModal(true)}>+ Request Leave</button>
                </div>

                {/* Balance Cards */}
                <div style={s.balanceGrid}>
                    {Object.entries(LEAVE_TYPE_CONFIG).map(([type, cfg]) => {
                        const bal  = balanceMap[type];
                        const pol  = policyMap[type];
                        if (!pol) return null;
                        const remaining = bal?.remaining_days ?? pol.days_per_year;
                        const used      = bal?.used_days ?? 0;
                        const total     = pol.days_per_year;
                        const pct       = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;
                        return (
                            <div key={type} style={{ background:'#fff', borderRadius:12, border:`1px solid ${cfg.border}`, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', gap:10 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize:11, fontWeight:800, color:cfg.color, textTransform:'uppercase', letterSpacing:'0.6px' }}>{cfg.label}</div>
                                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{pol.is_paid ? 'Paid Leave' : 'Unpaid Leave'}</div>
                                    </div>
                                    <div style={{ textAlign:'right' }}>
                                        <div style={{ fontSize:26, fontWeight:800, color:'#111827', lineHeight:1 }}>{formatNum(remaining)}</div>
                                        <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>of {formatNum(total)} days</div>
                                    </div>
                                </div>
                                <div style={{ background:'#f3f4f6', borderRadius:99, height:5, overflow:'hidden' }}>
                                    <div style={{ height:'100%', borderRadius:99, background:cfg.color, width:`${pct}%`, transition:'width 0.4s' }} />
                                </div>
                                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                                    <span style={{ color:'#9ca3af' }}>Used <span style={{ color:'#374151', fontWeight:700 }}>{formatNum(used)}</span></span>
                                    <span style={{ color:'#9ca3af' }}>Left <span style={{ color:cfg.color, fontWeight:700 }}>{formatNum(remaining)}</span></span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filter Tabs + Count */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={s.filterTabs}>
                        {[
                            { val:'', label:'All' },
                            { val:'pending',  label:'Pending' },
                            { val:'approved', label:'Approved' },
                            { val:'rejected', label:'Rejected' },
                        ].map(tab => (
                            <button key={tab.val} style={{
                                ...s.filterTab,
                                background: statusFilter === tab.val ? '#7c3aed' : 'transparent',
                                color:      statusFilter === tab.val ? '#fff' : '#6b7280',
                                fontWeight: statusFilter === tab.val ? 700 : 500,
                            }} onClick={() => handleFilter(tab.val)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontSize:13, color:'#9ca3af', fontWeight:500 }}>
                        <span style={{ fontSize:16, fontWeight:800, color:'#374151' }}>{requests.total}</span>
                        {' '}{requests.total === 1 ? 'request' : 'requests'}
                    </span>
                </div>

                {/* Requests List */}
                <div style={s.listCard}>
                    {requests.data.length === 0 ? (
                        <div style={s.empty}>
                            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                            No leave requests found
                        </div>
                    ) : requests.data.map((req, idx) => {
                        const typeCfg    = LEAVE_TYPE_CONFIG[req.leave_type] || LEAVE_TYPE_CONFIG.annual;
                        const statusCfg  = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                        const dayTypeCfg = DAY_TYPE_CONFIG[req.day_type || 'full_day'];
                        const isLast     = idx === requests.data.length - 1;

                        // ── Only show approve/reject if assigned to me ──
                        const isMyRequest       = req.user_id === user?.id;
                        const isAssignedToMe    = req.approver_id === user?.id;
                        const showApproveReject = canApprove && req.status === 'pending' && isAssignedToMe && !isMyRequest;

                        return (
                            <div key={req.id} style={{
                                display:'flex', alignItems:'flex-start', gap:14,
                                padding:'18px 20px',
                                borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                            }}>
                                {/* Color accent */}
                                <div style={{ width:3, height:'100%', minHeight:60, borderRadius:2, background:typeCfg.color, flexShrink:0, alignSelf:'stretch' }} />

                                {/* Main info */}
                                <div style={{ flex:1, minWidth:0 }}>

                                    {/* Row 1 — type + status + day type */}
                                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                                        <span style={{ fontSize:14, fontWeight:800, color:'#111827' }}>
                                            {typeCfg.label}
                                        </span>
                                        <span style={{ fontSize:10, fontWeight:700, background:statusCfg.bg, color:statusCfg.color, borderRadius:99, padding:'2px 8px' }}>
                                            {statusCfg.label}
                                        </span>
                                        <span style={{ fontSize:10, fontWeight:700, background:dayTypeCfg.bg, color:dayTypeCfg.color, borderRadius:99, padding:'2px 8px' }}>
                                            {dayTypeCfg.label}
                                        </span>
                                    </div>

                                    {/* Employee info — canViewAll only */}
                                    {canViewAll && req.user && !isMyRequest && (
                                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                                            {req.user.avatar_url ? (
                                                <img src={`/storage/${req.user.avatar_url}`} alt={req.user.name}
                                                    style={{ width:28, height:28, borderRadius:8, objectFit:'cover', flexShrink:0, border:'1px solid #f3f4f6' }} />
                                            ) : (
                                                <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, background:typeCfg.bg, border:`1px solid ${typeCfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:typeCfg.color }}>
                                                    {req.user.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div style={{ minWidth:0 }}>
                                                <div style={{ fontSize:13, fontWeight:700, color:'#111827', lineHeight:1.2 }}>
                                                    {req.user.name}
                                                </div>
                                                {(req.user.position || req.user.department) && (
                                                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2, flexWrap:'wrap' }}>
                                                        {req.user.position && (
                                                            <span style={{ fontSize:10, fontWeight:600, color:'#6b7280' }}>{req.user.position}</span>
                                                        )}
                                                        {req.user.position && req.user.department && (
                                                            <span style={{ color:'#d1d5db', fontSize:10 }}>·</span>
                                                        )}
                                                        {req.user.department && (
                                                            <span style={{ fontSize:10, fontWeight:500, color:'#6366f1' }}>{req.user.department}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Date row */}
                                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                                        <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>
                                            {formatDate(req.start_date)}
                                        </span>
                                        {req.day_type === 'full_day' && req.start_date !== req.end_date && (
                                            <>
                                                <span style={{ color:'#d1d5db' }}>→</span>
                                                <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>
                                                    {formatDate(req.end_date)}
                                                </span>
                                            </>
                                        )}
                                        <span style={{ fontSize:11, fontWeight:700, color:typeCfg.color, background:typeCfg.bg, borderRadius:6, padding:'2px 8px', border:`1px solid ${typeCfg.border}` }}>
                                            {formatNum(req.total_days)} {req.total_days === 0.5 ? 'half day' : req.total_days == 1 ? 'day' : 'days'}
                                        </span>
                                    </div>

                                    {/* Note */}
                                    {req.note && (
                                        <div style={{ display:'flex', alignItems:'flex-start', gap:6, background:'#f9fafb', border:'1px solid #f3f4f6', borderRadius:8, padding:'8px 12px', marginTop:4 }}>
                                            <span style={{ fontSize:10, fontWeight:800, color:'#9ca3af', letterSpacing:'0.4px', flexShrink:0, marginTop:1 }}>Reason</span>
                                            <span style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{req.note}</span>
                                        </div>
                                    )}

                                </div>

                                {/* Actions */}
                                <div style={{ flexShrink:0, display:'flex', gap:8 }}>
                                    {showApproveReject && (
                                        <>
                                            <button style={s.btnApprove}
                                                onClick={() => setConfirmModal({ type:'approve', request:req })}>
                                                ✓ Approve
                                            </button>
                                            <button style={s.btnReject}
                                                onClick={() => setConfirmModal({ type:'reject', request:req })}>
                                                ✕ Reject
                                            </button>
                                        </>
                                    )}
                                    {req.status === 'approved' && (
                                        <span style={{ fontSize:12, color:'#059669', fontWeight:700 }}>✓ Approved</span>
                                    )}
                                    {req.status === 'rejected' && (
                                        <span style={{ fontSize:12, color:'#dc2626', fontWeight:700 }}>✕ Rejected</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:6 }}>
                        {Array.from({ length: requests.last_page }, (_, i) => i + 1).map(page => (
                            <button key={page} style={{
                                width:32, height:32, borderRadius:8, border:'1px solid #e5e7eb',
                                background: requests.current_page === page ? '#7c3aed' : '#fff',
                                color: requests.current_page === page ? '#fff' : '#374151',
                                fontWeight:600, cursor:'pointer', fontSize:13,
                            }} onClick={() => router.get('/payroll/leaves', { page, status: statusFilter })}>
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {showModal && (
                <LeaveRequestModal
                    saving={saving} setSaving={setSaving}
                    policyMap={policyMap} balanceMap={balanceMap}
                    approvers={approvers} roleName={roleName}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); showToast('Leave request submitted!'); }}
                    onError={(msg) => showToast(msg, 'error')}
                />
            )}

            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    type={confirmModal.type}
                    request={confirmModal.request}
                    loading={actionLoading}
                    onCancel={() => setConfirmModal(null)}
                    onApprove={() => handleApprove(confirmModal.request)}
                    onReject={() => handleReject(confirmModal.request)}
                />
            )}
        </AppLayout>
    );
}

// ─── Confirm Modal ────────────────────────
function ConfirmModal({ type, request, loading, onCancel, onApprove, onReject }) {
    const typeCfg    = LEAVE_TYPE_CONFIG[request.leave_type] || LEAVE_TYPE_CONFIG.annual;
    const dayTypeCfg = DAY_TYPE_CONFIG[request.day_type || 'full_day'];
    const isApprove  = type === 'approve';

    return (
        <div style={s.overlay}>
            <div style={{ background:'#fff', borderRadius:16, width:400, boxShadow:'0 20px 60px rgba(0,0,0,0.18)', overflow:'hidden' }}>
                <div style={{ height:4, background: isApprove ? '#059669' : '#dc2626' }} />
                <div style={{ padding:'24px 24px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background: isApprove ? '#d1fae5' : '#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                            {isApprove ? '✓' : '✕'}
                        </div>
                        <div>
                            <div style={{ fontSize:15, fontWeight:800, color:'#111827' }}>
                                {isApprove ? 'Approve Leave Request' : 'Reject Leave Request'}
                            </div>
                            <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                                {isApprove ? 'This will approve and notify the employee' : 'This will reject and notify the employee'}
                            </div>
                        </div>
                    </div>
                    <div style={{ background:'#f9fafb', border:`1px solid ${typeCfg.border}`, borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:13, fontWeight:700, color:typeCfg.color }}>{typeCfg.label}</span>
                            <span style={{ fontSize:10, fontWeight:700, background:dayTypeCfg.bg, color:dayTypeCfg.color, borderRadius:99, padding:'2px 8px' }}>{dayTypeCfg.label}</span>
                        </div>
                        {request.user && (
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                <div style={{ width:22, height:22, borderRadius:6, background:typeCfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:typeCfg.color }}>
                                    {request.user.name?.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{request.user.name}</span>
                            </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6b7280' }}>
                            <span style={{ fontWeight:600 }}>{formatDate(request.start_date)}</span>
                            {request.start_date !== request.end_date && (
                                <><span style={{ color:'#d1d5db' }}>→</span><span style={{ fontWeight:600 }}>{formatDate(request.end_date)}</span></>
                            )}
                            <span style={{ fontSize:11, fontWeight:700, color:typeCfg.color, background:typeCfg.bg, borderRadius:5, padding:'1px 7px' }}>
                                {formatNum(request.total_days)} {request.total_days === 0.5 ? 'half day' : request.total_days == 1 ? 'day' : 'days'}
                            </span>
                        </div>
                        {request.note && (
                            <div style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic', borderTop:'1px solid #e5e7eb', paddingTop:6 }}>"{request.note}"</div>
                        )}
                    </div>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'0 24px 20px' }}>
                    <button style={s.btnCancel} onClick={onCancel} disabled={loading}>Cancel</button>
                    {isApprove ? (
                        <button style={{ ...s.btnApprove, padding:'9px 22px', fontSize:13, opacity:loading?0.6:1, cursor:loading?'not-allowed':'pointer' }}
                            onClick={onApprove} disabled={loading}>
                            {loading ? 'Approving...' : '✓ Approve'}
                        </button>
                    ) : (
                        <button style={{ ...s.btnReject, padding:'9px 22px', fontSize:13, opacity:loading?0.6:1, cursor:loading?'not-allowed':'pointer' }}
                            onClick={onReject} disabled={loading}>
                            {loading ? 'Rejecting...' : '✕ Reject'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Leave Request Modal ───────────────────
function LeaveRequestModal({ saving, setSaving, policyMap, balanceMap, approvers, roleName, onClose, onSuccess, onError }) {
    const [form, setForm] = useState({
        leave_type:  'annual',
        day_type:    'full_day',
        start_date:  '',
        end_date:    '',
        note:        '',
        approver_id: approvers[0]?.id || '',
    });
    const [errors, setErrors] = useState({});

    const set = (k, v) => {
        setForm(f => {
            const u = { ...f, [k]: v };
            if (k === 'day_type' && (v === 'half_day_am' || v === 'half_day_pm')) {
                u.end_date = u.start_date;
            }
            return u;
        });
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    function calcDays() {
        if (form.day_type === 'half_day_am' || form.day_type === 'half_day_pm') {
            return form.start_date ? 0.5 : 0;
        }
        if (!form.start_date || !form.end_date) return 0;
        let days = 0;
        const cur = new Date(form.start_date + 'T00:00:00');
        const end = new Date(form.end_date   + 'T00:00:00');
        while (cur <= end) {
            if (cur.getDay() !== 0 && cur.getDay() !== 6) days++;
            cur.setDate(cur.getDate() + 1);
        }
        return days;
    }

    const previewDays = calcDays();
    const isHalfDay   = form.day_type !== 'full_day';
    const bal         = balanceMap[form.leave_type];
    const pol         = policyMap[form.leave_type];
    const typeCfg     = LEAVE_TYPE_CONFIG[form.leave_type];

    function validate() {
        const e = {};
        if (!form.leave_type) e.leave_type = 'Leave type is required';
        if (!form.start_date) e.start_date = 'Start date is required';
        if (!isHalfDay && !form.end_date) e.end_date = 'End date is required';
        if (!form.note) e.note = 'Reason is required';
        if (!['hr','admin'].includes(roleName) && !form.approver_id) {
            e.approver_id = 'Please select an approver';
        }
        if (!isHalfDay && form.start_date && form.end_date && form.end_date < form.start_date) {
            e.end_date = 'End date must be after start date';
        }
        if (pol?.is_paid && bal && previewDays > bal.remaining_days) {
            e.end_date = `Insufficient balance. Available: ${bal.remaining_days} days`;
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;
        setSaving(true);
        const submitData = { ...form, end_date: isHalfDay ? form.start_date : form.end_date };
        router.post('/payroll/leaves', submitData, {
            onSuccess: () => { setSaving(false); onSuccess(); },
            onError: (errs) => { setSaving(false); setErrors(errs); onError(Object.values(errs)[0] || 'Error'); },
        });
    }

    return (
        <div style={s.overlay}>
            <div style={s.modal}>
                <div style={s.modalHeader}>
                    <div style={{ fontSize:15, fontWeight:800, color:'#111827' }}>Request Leave</div>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={s.modalBody}>
                    <div style={s.field}>
                        <label style={s.label}>Leave Type <span style={{ color:'#dc2626' }}>*</span></label>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                            {Object.entries(LEAVE_TYPE_CONFIG).map(([type, cfg]) => {
                                if (!policyMap[type]) return null;
                                return (
                                    <button key={type} style={{
                                        border: form.leave_type === type ? `1.5px solid ${cfg.color}` : '1.5px solid #e5e7eb',
                                        borderRadius:8, padding:'6px 12px', fontSize:11, cursor:'pointer',
                                        background: form.leave_type === type ? cfg.bg : '#fff',
                                        color: form.leave_type === type ? cfg.color : '#6b7280',
                                        fontWeight: form.leave_type === type ? 700 : 500,
                                    }} onClick={() => set('leave_type', type)}>
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.leave_type && <span style={s.errMsg}>{errors.leave_type}</span>}
                    </div>

                    <div style={s.field}>
                        <label style={s.label}>Day Type <span style={{ color:'#dc2626' }}>*</span></label>
                        <div style={{ display:'flex', gap:7 }}>
                            {Object.entries(DAY_TYPE_CONFIG).map(([type, cfg]) => (
                                <button key={type} style={{
                                    flex:1, border: form.day_type === type ? `1.5px solid ${cfg.color}` : '1.5px solid #e5e7eb',
                                    borderRadius:8, padding:'8px 10px', fontSize:11, cursor:'pointer',
                                    background: form.day_type === type ? cfg.bg : '#fff',
                                    color: form.day_type === type ? cfg.color : '#6b7280',
                                    fontWeight: form.day_type === type ? 700 : 500, textAlign:'center',
                                }} onClick={() => set('day_type', type)}>
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {pol && (
                        <div style={{ background:typeCfg.bg, borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${typeCfg.border}` }}>
                            <div>
                                <div style={{ fontSize:11, color:typeCfg.color, fontWeight:700 }}>Available Balance</div>
                                <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>Used: {bal?.used_days ?? 0} · Total: {pol.days_per_year} days</div>
                            </div>
                            <div style={{ fontSize:22, fontWeight:800, color:typeCfg.color }}>
                                {bal?.remaining_days ?? pol.days_per_year}<span style={{ fontSize:12, fontWeight:500, color:'#9ca3af' }}> days</span>
                            </div>
                        </div>
                    )}

                    {/* Approver — HR တင်ရင် admin ဆီ auto ပို့ / တခြားသူတွေ ရွေးရမယ် */}
                    {roleName === 'hr' ? (
                        approvers.length > 0 && (
                            <div style={{ background:'#f9fafb', borderRadius:8, padding:'10px 14px', border:'1px solid #e5e7eb' }}>
                                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, marginBottom:4 }}>SENDING APPROVAL TO</div>
                                <div style={{ fontSize:13, fontWeight:700, color:'#374151' }}>{approvers[0]?.name} (Admin)</div>
                            </div>
                        )
                    ) : !['admin'].includes(roleName) && approvers.length > 0 ? (
                        <div style={s.field}>
                            <label style={s.label}>Send Approval To <span style={{ color:'#dc2626' }}>*</span></label>
                            <select style={{ ...s.input, border: errors.approver_id ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                value={form.approver_id} onChange={e => set('approver_id', e.target.value)}>
                                <option value="">Select approver</option>
                                {approvers.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            {errors.approver_id && <span style={s.errMsg}>{errors.approver_id}</span>}
                        </div>
                    ) : null}

                    <div style={isHalfDay ? {} : s.row2}>
                        <div style={s.field}>
                            <label style={s.label}>{isHalfDay ? 'Date' : 'Start Date'} <span style={{ color:'#dc2626' }}>*</span></label>
                            <input style={{ ...s.input, border: errors.start_date ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                            {errors.start_date && <span style={s.errMsg}>{errors.start_date}</span>}
                        </div>
                        {!isHalfDay && (
                            <div style={s.field}>
                                <label style={s.label}>End Date <span style={{ color:'#dc2626' }}>*</span></label>
                                <input style={{ ...s.input, border: errors.end_date ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                    type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} />
                                {errors.end_date && <span style={s.errMsg}>{errors.end_date}</span>}
                            </div>
                        )}
                    </div>

                    {form.start_date && (previewDays > 0 || isHalfDay) && (
                        <div style={{ background:'#ede9fe', border:'1px solid #ddd6fe', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:12, color:'#7c3aed', fontWeight:600 }}>
                                {isHalfDay ? `${DAY_TYPE_CONFIG[form.day_type].label} — ${formatDate(form.start_date)}` : 'Total working days:'}
                            </span>
                            <span style={{ fontSize:16, fontWeight:800, color:'#7c3aed' }}>
                                {previewDays} {previewDays === 0.5 ? 'half day' : previewDays === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                    )}

                    <div style={s.field}>
                        <label style={s.label}>Reason <span style={{ color:'#dc2626' }}>*</span></label>
                        <textarea style={{ ...s.input, height:75, resize:'vertical', border: errors.note ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                            value={form.note} onChange={e => set('note', e.target.value)}
                            placeholder="Please provide reason for leave..." />
                        {errors.note && <span style={s.errMsg}>{errors.note}</span>}
                    </div>
                </div>
                <div style={s.modalFooter}>
                    <button style={s.btnCancel} onClick={onClose}>Cancel</button>
                    <button style={{ ...s.btnPrimary, opacity:saving?0.6:1, cursor:saving?'not-allowed':'pointer' }}
                        onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const s = {
    wrap:        { display:'flex', flexDirection:'column', gap:16 },
    btnPrimary:  { background:'#7c3aed', color:'#fff', border:'none', borderRadius:9, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' },
    btnCancel:   { background:'#f3f4f6', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#6b7280' },
    btnApprove:  { background:'#d1fae5', border:'1px solid #6ee7b7', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color:'#059669' },
    btnReject:   { background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color:'#dc2626' },
    balanceGrid: { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12 },
    filterTabs:  { display:'flex', gap:2, background:'#f3f4f6', borderRadius:10, padding:3 },
    filterTab:   { border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, cursor:'pointer', transition:'all 0.15s' },
    listCard:    { background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
    empty:       { padding:'48px', textAlign:'center', color:'#9ca3af', fontSize:13 },
    overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
    modal:       { background:'#fff', borderRadius:16, width:540, maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
    modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px 14px', borderBottom:'1px solid #f3f4f6' },
    modalBody:   { padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 },
    modalFooter: { display:'flex', justifyContent:'flex-end', gap:8, padding:'14px 22px', borderTop:'1px solid #f3f4f6' },
    closeBtn:    { background:'#f3f4f6', border:'none', borderRadius:7, width:27, height:27, cursor:'pointer', fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' },
    field:       { display:'flex', flexDirection:'column', gap:5 },
    label:       { fontSize:11, fontWeight:700, color:'#374151' },
    input:       { background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 11px', fontSize:13, color:'#374151', outline:'none', width:'100%', boxSizing:'border-box' },
    errMsg:      { fontSize:11, color:'#dc2626', fontWeight:600 },
    row2:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
};