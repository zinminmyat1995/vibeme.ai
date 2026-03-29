import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toast = (message, type = 'success') =>
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { message, type } }));

const EMP_CFG = {
    probation: { label: 'Probation', bg: '#fef3c7', color: '#d97706' },
    permanent: { label: 'Permanent', bg: '#d1fae5', color: '#059669' },
    contract:  { label: 'Contract',  bg: '#dbeafe', color: '#2563eb' },
};

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, url, size = 34 }) {
    const [err, setErr] = useState(false);
    const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    const bg = ['#7c3aed','#059669','#2563eb','#d97706','#dc2626','#0891b2'][(name?.charCodeAt(0)||0) % 6];
    if (url && !err)
        return <img src={`/storage/${url}`} alt={name} onError={() => setErr(true)}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.36, fontWeight: 700, color: '#fff' }}>
            {initials}
        </div>
    );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, children, width = 520 }) {
    if (!open) return null;
    return (
        <div onClick={e => e.target === e.currentTarget && onClose()}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,25,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' }}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: width,
                maxHeight: '92vh', overflowY: 'auto',
                boxShadow: '0 32px 80px rgba(0,0,0,0.22)' }}>

                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    borderRadius: '20px 20px 0 0',
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10,
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="rgba(255,255,255,0.9)" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                                <line x1="17" y1="11" x2="22" y2="11"/>
                                <line x1="19.5" y1="8.5" x2="19.5" y2="13.5"/>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800,
                                color: '#fff', letterSpacing: '-0.2px' }}>{title}</h2>
                            {subtitle && (
                                <p style={{ margin: '2px 0 0', fontSize: 12,
                                    color: 'rgba(255,255,255,0.65)' }}>{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
                            cursor: 'pointer', width: 30, height: 30, borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255,255,255,0.8)', fontSize: 18, flexShrink: 0,
                            transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                        ×
                    </button>
                </div>

                <div style={{ padding: '22px 24px 26px', overflowY: 'auto', maxHeight: 'calc(92vh - 90px)' }}>{children}</div>
            </div>
        </div>
    );
}

// ─── Profile Form ─────────────────────────────────────────────────────────────
function ProfileForm({ employees, salaryRule, editProfile, onClose }) {
    const isEdit     = !!editProfile;
    const allowances = salaryRule?.allowances || [];
    const currency   = salaryRule?.currency?.currency_code || '';
    const bankName   = salaryRule?.bank?.bank_name || '';

    const [form, setForm] = useState({
        user_id:                  editProfile?.user_id ?? '',
        base_salary:              editProfile?.base_salary ?? '',
        bank_account_holder_name: editProfile?.bank_account_holder_name ?? '',
        bank_account_number:      editProfile?.bank_account_number ?? '',
        allowance_ids:            editProfile?.allowances?.map(a => a.id) ?? [],
    });
    const [errors,  setErrors]  = useState({});
    const [saving,  setSaving]  = useState(false);
    const [generalError, setGeneralError] = useState('');

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const selEmp = useMemo(() =>
        employees.find(e => String(e.id) === String(form.user_id)),
        [form.user_id, employees]);

    const toggleAllowance = id =>
        setForm(p => ({
            ...p,
            allowance_ids: p.allowance_ids.includes(id)
                ? p.allowance_ids.filter(x => x !== id)
                : [...p.allowance_ids, id],
        }));

    const validate = () => {
        const e = {};
        if (!isEdit && !form.user_id) e.user_id = 'Please select an employee.';
        if (!form.base_salary || isNaN(form.base_salary) || Number(form.base_salary) < 0)
            e.base_salary = 'Please enter a valid salary amount.';
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);

        const payload = {
            base_salary:              parseFloat(form.base_salary),
            bank_account_holder_name: form.bank_account_holder_name || null,
            bank_account_number:      form.bank_account_number      || null,
            allowance_ids:            form.allowance_ids,
        };

        if (!isEdit) {
            payload.user_id        = form.user_id;
            payload.country_id     = salaryRule?.country_id;
            payload.salary_rule_id = salaryRule?.id;
            // effective_date = joined_date of employee (backend defaults to today if null)
            payload.effective_date = selEmp?.joined_date
                ? selEmp.joined_date.slice(0, 10)
                : new Date().toISOString().slice(0, 10);
        }

        const url    = isEdit
            ? `/payroll/employee-profiles/${editProfile.id}`
            : '/payroll/employee-profiles';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':  document.querySelector('meta[name="csrf-token"]')?.content,
                'Accept':        'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(r => r.json())
        .then(data => {
            if (data.errors || data.message === 'The given data was invalid.') {
                const errs = data.errors || {};
                // user_id error က duplicate profile error — general banner ပြ
                if (errs.user_id) {
                    setGeneralError(errs.user_id);
                    setErrors({});
                } else {
                    setErrors(errs);
                    setGeneralError('');
                }
                setSaving(false);
                return;
            }
            toast(isEdit ? 'Salary profile updated successfully.' : 'Salary profile saved successfully.');
            onClose(true, data);
        })
        .catch(() => { toast('Something went wrong. Please try again.', 'error'); setSaving(false); });
    };

    // ── styles ──
    const inpStyle = (hasErr) => ({
        width: '100%', padding: '10px 13px',
        border: `1.5px solid ${hasErr ? '#fca5a5' : '#e5e7eb'}`,
        borderRadius: 10, fontSize: 13, color: '#111827',
        background: hasErr ? '#fff9f9' : '#fff',
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'border-color 0.15s',
    });

    const labelStyle = {
        display: 'block', fontSize: 12, fontWeight: 700,
        color: '#374151', marginBottom: 5, letterSpacing: '0.1px',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── General error banner ── */}
            {generalError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 10, padding: '11px 14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ margin: 0, fontSize: 12, color: '#dc2626', lineHeight: 1.5 }}>
                        {generalError}
                    </p>
                </div>
            )}

            {/* ── Employee select (add only) ── */}
            {!isEdit && (
                <div>
                    <label style={labelStyle}>
                        Employee <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                        value={form.user_id}
                        onChange={e => { set('user_id', e.target.value); setErrors(p => ({ ...p, user_id: null })); }}
                        style={{ ...inpStyle(errors.user_id), cursor: 'pointer',
                            background: errors.user_id ? '#fff9f9' : '#fafafa' }}>
                        <option value="">— Select employee —</option>
                        {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                    {errors.user_id && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.user_id}</p>
                    )}

                    {/* Auto-fill info card */}
                    {selEmp && (
                        <div style={{ marginTop: 10, background: '#f9fafb', border: '1px solid #f0f0f0',
                            borderRadius: 12, padding: '12px 14px',
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                            {[
                                ['Position',   selEmp.position       || '—'],
                                ['Department', selEmp.department      || '—'],
                                ['Employment', EMP_CFG[selEmp.employment_type]?.label || selEmp.employment_type || '—'],
                                ['Joined',     fmtDate(selEmp.joined_date)],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700,
                                        color: '#b0b0b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {k}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: 12,
                                        fontWeight: 600, color: '#374151' }}>{v}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit mode — show who we're editing */}
            {isEdit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                    background: '#f9fafb', borderRadius: 12, padding: '12px 14px' }}>
                    <Avatar name={editProfile.name} url={editProfile.avatar_url} size={38} />
                    <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                            {editProfile.name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
                            {editProfile.position || editProfile.department || '—'}
                            {' · '}
                            <span style={{
                                color: EMP_CFG[editProfile.employment_type]?.color || '#9ca3af',
                                fontWeight: 600,
                            }}>
                                {EMP_CFG[editProfile.employment_type]?.label || editProfile.employment_type || '—'}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* ── Base Salary ── */}
            <div>
                <label style={labelStyle}>
                    Base Salary{currency ? ` (${currency})` : ''} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                    {currency && (
                        <span style={{ position: 'absolute', left: 13, top: '50%',
                            transform: 'translateY(-50%)', fontSize: 12,
                            fontWeight: 700, color: '#9ca3af', pointerEvents: 'none' }}>
                            {currency}
                        </span>
                    )}
                    <input
                        type="number" min="0" step="0.01"
                        value={form.base_salary}
                        onChange={e => { set('base_salary', e.target.value); setErrors(p => ({ ...p, base_salary: null })); }}
                        placeholder="0.00"
                        style={{ ...inpStyle(errors.base_salary), paddingLeft: currency ? 46 : 13 }}
                    />
                </div>
                {errors.base_salary && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ef4444' }}>{errors.base_salary}</p>
                )}
            </div>

            {/* ── Allowances ── */}
            {allowances.length > 0 && (
                <div>
                    <label style={labelStyle}>Allowances</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {allowances.map(a => {
                            const on = form.allowance_ids.includes(a.id);
                            return (
                                <button key={a.id} type="button" onClick={() => toggleAllowance(a.id)}
                                    style={{
                                        padding: '7px 14px', borderRadius: 10, fontSize: 12,
                                        fontWeight: 600, cursor: 'pointer',
                                        border: `1.5px solid ${on ? '#7c3aed' : '#e5e7eb'}`,
                                        background: on ? '#ede9fe' : '#fafafa',
                                        color: on ? '#7c3aed' : '#6b7280',
                                        transition: 'all 0.15s',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                    {on && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    )}
                                    {a.name}
                                    <span style={{ fontSize: 11, opacity: 0.65 }}>
                                        {a.type === 'percentage'
                                            ? `${a.value}%`
                                            : `${currency} ${Number(a.value).toLocaleString()}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#b0b0b0' }}>
                        Select allowances that apply to this employee.
                    </p>
                </div>
            )}

            {/* ── Bank Info ── */}
            <div style={{ background: '#f9fafb', border: '1px solid #f0f0f0',
                borderRadius: 14, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af',
                        textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                        Bank Information
                    </span>
                    <span style={{ fontSize: 11, color: '#c4c4c4', fontWeight: 400 }}>— optional</span>
                </div>

                {/* Bank name (read-only from salary rule) */}
                {bankName && (
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ ...labelStyle, color: '#9ca3af' }}>Bank</label>
                        <input value={bankName} readOnly
                            style={{ ...inpStyle(false), background: '#f0f0f0',
                                color: '#9ca3af', cursor: 'default' }} />
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label style={labelStyle}>Account Holder Name</label>
                        <input
                            value={form.bank_account_holder_name}
                            onChange={e => set('bank_account_holder_name', e.target.value)}
                            placeholder="Full name"
                            style={inpStyle(false)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Account Number</label>
                        <input
                            value={form.bank_account_number}
                            onChange={e => set('bank_account_number', e.target.value)}
                            placeholder="Account number"
                            style={inpStyle(false)} />
                    </div>
                </div>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button onClick={() => onClose(false)} disabled={saving}
                    style={{ padding: '10px 22px', borderRadius: 10,
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving}
                    style={{ padding: '10px 26px', borderRadius: 10, border: 'none',
                        background: saving ? '#a78bfa' : '#7c3aed', color: '#fff',
                        fontSize: 13, fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: saving ? 'none' : '0 3px 10px rgba(124,58,237,0.3)',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 7 }}>
                    {saving && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            style={{ animation: 'spin 0.8s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                    )}
                    {saving ? 'Saving…' : isEdit ? 'Update Profile' : 'Save Profile'}
                </button>
            </div>
        </div>
    );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ profile, onClose, onConfirm, loading }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar name={profile?.name} url={profile?.avatar_url} size={40} />
                <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{profile?.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
                        {profile?.position || profile?.department || '—'}
                    </p>
                </div>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px',
                lineHeight: 1.6, background: '#fef2f2', borderRadius: 10,
                padding: '10px 14px', border: '1px solid #fecaca' }}>
                This will deactivate the salary profile. Past payroll records will remain intact.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={onClose} disabled={loading}
                    style={{ padding: '9px 20px', borderRadius: 10,
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={loading}
                    style={{ padding: '9px 20px', borderRadius: 10, border: 'none',
                        background: loading ? '#fca5a5' : '#ef4444', color: '#fff',
                        fontSize: 13, fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Removing…' : 'Remove Profile'}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployeeSalaryIndex({ employees, salaryRule, profiles: init }) {
    const [profiles,         setProfiles]         = useState(init || []);
    const [search,           setSearch]           = useState('');
    const [showAdd,          setShowAdd]          = useState(false);
    const [editP,            setEditP]            = useState(null);
    const [deleteP,          setDeleteP]          = useState(null);
    const [deleting,         setDeleting]         = useState(false);
    const [visibleSalaries,  setVisibleSalaries]  = useState(new Set());

    const toggleSalary = id =>
        setVisibleSalaries(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        return profiles.filter(p =>
            p.name?.toLowerCase().includes(s) ||
            p.position?.toLowerCase().includes(s) ||
            p.department?.toLowerCase().includes(s)
        );
    }, [profiles, search]);

    const reload = () => router.reload({ only: ['profiles'] });

    const handleFormClose = (saved, updatedProfile) => {
        setShowAdd(false);
        setEditP(null);
        if (saved && updatedProfile) {
            setProfiles(prev => {
                const exists = prev.find(p => p.id === updatedProfile.id);
                if (exists) {
                    // update existing
                    return prev.map(p => p.id === updatedProfile.id ? updatedProfile : p);
                } else {
                    // add new
                    return [updatedProfile, ...prev];
                }
            });
        } else if (saved) {
            router.reload({ only: ['profiles'] });
        }
    };

    const handleDelete = () => {
        if (!deleteP) return;
        setDeleting(true);
        fetch(`/payroll/employee-profiles/${deleteP.id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                'Accept': 'application/json',
            },
        })
        .then(r => {
            if (!r.ok) throw new Error();
            // state ကနေ တိုက်ရိုက် ဖြုတ်
            setProfiles(prev => prev.filter(p => p.id !== deleteP.id));
            toast('Salary profile removed.');
            setDeleteP(null);
            setDeleting(false);
        })
        .catch(() => { toast('Failed to remove profile.', 'error'); setDeleting(false); });
    };

    const currency = salaryRule?.currency?.currency_code || '';

    const thStyle = (minWidth) => ({
        padding: '11px 14px', textAlign: 'left',
        fontSize: 10, fontWeight: 800, color: '#b0b0b0',
        textTransform: 'uppercase', letterSpacing: '0.7px',
        whiteSpace: 'nowrap', minWidth,
    });
    return (
        <AppLayout title="Employee Salary">
            <Head title="Employee Salary" />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ margin: '0 auto' }}>

                {/* ── Page header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 26, gap: 16, flexWrap: 'wrap' }}>

                    <button onClick={() => setShowAdd(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 7,
                            padding: '10px 22px', background: '#7c3aed', color: '#fff',
                            border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 3px 10px rgba(124,58,237,0.28)',
                            whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 'auto' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Profile
                    </button>
                </div>

                {/* ── Stat cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 14, marginBottom: 22 }}>
                    {[
                        { label: 'Total Profiles', value: profiles.length,
                          icon: '👤', color: '#7c3aed', bg: '#ede9fe' },
                        { label: 'With Bank Info',
                          value: profiles.filter(p => p.bank_account_number).length,
                          icon: '🏦', color: '#059669', bg: '#d1fae5' },
                        { label: 'Pending Bank',
                          value: profiles.filter(p => !p.bank_account_number).length,
                          icon: '⚠️', color: '#d97706', bg: '#fef3c7' },
                    ].map(s => (
                        <div key={s.label} style={{ background: '#fff',
                            border: '1px solid #f3f4f6', borderRadius: 14,
                            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12,
                                background: s.bg, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af',
                                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    {s.label}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Employment Type breakdown */}
                    <div style={{ background: '#fff', border: '1px solid #f3f4f6',
                        borderRadius: 14, padding: '16px 20px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9ca3af',
                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Employment Type
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { key: 'probation', label: 'Probation', color: '#d97706', bg: '#fef3c7' },
                                { key: 'permanent', label: 'Permanent', color: '#059669', bg: '#d1fae5' },
                                { key: 'contract',  label: 'Contract',  color: '#2563eb', bg: '#dbeafe' },
                            ].map(({ key, label, color, bg }) => {
                                const count = profiles.filter(p => p.employment_type === key).length;
                                const pct   = profiles.length > 0 ? Math.round((count / profiles.length) * 100) : 0;
                                return (
                                    <div key={key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', marginBottom: 3 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600,
                                                color, padding: '1px 7px', borderRadius: 99,
                                                background: bg }}>
                                                {label}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                                                {count}
                                            </span>
                                        </div>
                                        <div style={{ height: 4, borderRadius: 99,
                                            background: '#f3f4f6', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: 99,
                                                background: color, width: `${pct}%`,
                                                transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Search bar ── */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ position: 'relative', maxWidth: 300 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="#c4c4c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search employee…"
                            style={{ width: '100%', padding: '9px 12px 9px 34px',
                                border: '1.5px solid #e5e7eb', borderRadius: 10,
                                fontSize: 13, color: '#374151', outline: 'none',
                                background: '#fff', boxSizing: 'border-box' }} />
                    </div>
                </div>

                {/* ── Table ── */}
                <div style={{ background: '#fff', borderRadius: 16,
                    border: '1px solid #f3f4f6',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                    {filtered.length === 0 ? (
                        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>💼</div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', margin: '0 0 4px' }}>
                                {search ? 'No results found' : 'No salary profiles yet'}
                            </p>
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                                {search ? 'Try a different search term.' : 'Click "Add Profile" to assign a salary.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520 }}>
                            <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#fafafa' }}>
                                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <th style={thStyle('160px')}>Employee</th>
                                        <th style={thStyle('100px')}>Employment</th>
                                        <th style={thStyle('110px')}>Joined</th>
                                        <th style={thStyle('260px')}>Allowances</th>
                                        <th style={thStyle('130px')}>{`Salary${currency ? ` (${currency})` : ''}`}</th>
                                        <th style={thStyle('130px')}>Bank</th>
                                        <th style={thStyle('130px')}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((p, i) => {
                                        const salaryOn = visibleSalaries.has(p.id);
                                        return (
                                            <tr key={p.id}
                                                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                                {/* Employee */}
                                                <td style={{ padding: '13px 14px', overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                        <Avatar name={p.name} url={p.avatar_url} size={34} />
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
                                                                color: '#111827', overflow: 'hidden',
                                                                textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {p.name}
                                                            </p>
                                                            <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af',
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {p.position || p.department || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Employment */}
                                                <td style={{ padding: '13px 14px' }}>
                                                    {(() => {
                                                        const c = EMP_CFG[p.employment_type] || EMP_CFG.probation;
                                                        return (
                                                            <span style={{ fontSize: 10, fontWeight: 700,
                                                                padding: '3px 9px', borderRadius: 99,
                                                                background: c.bg, color: c.color,
                                                                whiteSpace: 'nowrap' }}>
                                                                {c.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>

                                                {/* Joined */}
                                                <td style={{ padding: '13px 14px', fontSize: 12,
                                                    color: '#6b7280', whiteSpace: 'nowrap' }}>
                                                    {fmtDate(p.joined_date)}
                                                </td>

                                                {/* Allowances */}
                                                <td style={{ padding: '13px 14px' }}>
                                                    {p.allowances?.length > 0 ? (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {p.allowances.map(a => (
                                                                <span key={a.id} style={{
                                                                    fontSize: 10, fontWeight: 600,
                                                                    padding: '3px 8px', borderRadius: 6,
                                                                    background: '#ede9fe', color: '#7c3aed',
                                                                    whiteSpace: 'nowrap' }}>
                                                                    {a.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: '#e5e7eb' }}>—</span>
                                                    )}
                                                </td>

                                                {/* Salary with eye toggle */}
                                                <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 700,
                                                            color: '#111827', fontVariantNumeric: 'tabular-nums',
                                                            letterSpacing: salaryOn ? '0' : '2px' }}>
                                                            {salaryOn
                                                                ? Number(p.base_salary).toLocaleString()
                                                                : '••••••'}
                                                        </span>
                                                        <button onClick={() => toggleSalary(p.id)}
                                                            title={salaryOn ? 'Hide salary' : 'Show salary'}
                                                            style={{ background: 'none', border: 'none',
                                                                cursor: 'pointer', padding: 3, flexShrink: 0,
                                                                color: salaryOn ? '#7c3aed' : '#c4c4c4',
                                                                display: 'flex', alignItems: 'center',
                                                                transition: 'color 0.15s' }}>
                                                            {salaryOn ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                                    stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                                                </svg>
                                                            ) : (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                                    stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                                    <circle cx="12" cy="12" r="3"/>
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Bank */}
                                                <td style={{ padding: '13px 14px', overflow: 'hidden' }}>
                                                    {p.bank_account_number_masked ? (
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 11,
                                                                fontWeight: 600, color: '#374151',
                                                                overflow: 'hidden', textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap' }}>
                                                                {p.bank_name || '—'}
                                                            </p>
                                                            <p style={{ margin: '1px 0 0', fontSize: 11,
                                                                color: '#9ca3af', fontFamily: 'monospace',
                                                                whiteSpace: 'nowrap' }}>
                                                                {p.bank_account_number_masked}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: 11, color: '#f59e0b',
                                                            fontWeight: 600, display: 'flex',
                                                            alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"/>
                                                                <line x1="12" y1="8" x2="12" y2="12"/>
                                                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                                                            </svg>
                                                            Not set
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: '13px 14px' }}>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => setEditP(p)}
                                                            style={{ padding: '6px 12px', borderRadius: 8,
                                                                border: '1px solid #e5e7eb', background: '#f9fafb',
                                                                color: '#374151', fontSize: 12, fontWeight: 600,
                                                                cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                            ✏️ Edit
                                                        </button>
                                                        <button onClick={() => setDeleteP(p)}
                                                            style={{ padding: '6px 10px', borderRadius: 8,
                                                                border: '1px solid #fee2e2', background: '#fef2f2',
                                                                color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                                                            🗑️
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
                </div>
            </div>

            {/* ── Modals ── */}
            <Modal open={showAdd} onClose={() => setShowAdd(false)}
                title="Add Salary Profile"
                subtitle="Set up salary, allowances and bank info for an employee.">
                <ProfileForm employees={employees} salaryRule={salaryRule} onClose={handleFormClose} />
            </Modal>

            <Modal open={!!editP} onClose={() => setEditP(null)}
                title="Edit Salary Profile"
                subtitle="Update salary, allowances or bank information.">
                {editP && (
                    <ProfileForm key={editP.id} employees={employees}
                        salaryRule={salaryRule} editProfile={editP} onClose={handleFormClose} />
                )}
            </Modal>

            <Modal open={!!deleteP} onClose={() => setDeleteP(null)}
                title="Remove Profile" subtitle="This action will deactivate the salary profile." width={440}>
                <DeleteConfirm profile={deleteP} onClose={() => setDeleteP(null)}
                    onConfirm={handleDelete} loading={deleting} />
            </Modal>
        </AppLayout>
    );
}