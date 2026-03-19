import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';

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
    { name: 'Annual Leave',     gender: 'all',    days: 15, paid: true  },
    { name: 'Sick Leave',       gender: 'all',    days: 10, paid: true  },
    { name: 'Maternity Leave',  gender: 'female', days: 90, paid: true  },
    { name: 'Paternity Leave',  gender: 'male',   days: 7,  paid: true  },
    { name: 'Unpaid Leave',     gender: 'all',    days: 30, paid: false },
    { name: 'Emergency Leave',  gender: 'all',    days: 3,  paid: true  },
    { name: 'Marriage Leave',   gender: 'all',    days: 3,  paid: true  },
    { name: 'Bereavement Leave',gender: 'all',    days: 3,  paid: true  },
    { name: 'Public Holiday',   gender: 'all',    days: 12, paid: true  },
    { name: 'Compensation Leave',gender: 'all',   days: 5,  paid: true  },
];

export default function LeavePolicySection({ leavePolicies }) {
    const [showForm, setShowForm]           = useState(false);
    const [editingId, setEditingId]         = useState(null);
    const [deleteTarget, setDeleteTarget]   = useState(null); // { id, leave_type }
    const [deleting, setDeleting]           = useState(false);
    const [formErrors, setFormErrors]       = useState({});

    const { data, setData, post, put, processing, errors, reset } = useForm(defaultForm);

    // Frontend validation
    const validate = () => {
        const errs = {};
        if (!data.leave_type.trim())  errs.leave_type   = 'Leave type name is required.';
        if (!data.days_per_year)      errs.days_per_year = 'Days per year is required.';
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
                onError: (e) => {
                    if (e.leave_type) setFormErrors(p => ({ ...p, leave_type: e.leave_type }));
                },
            });
        } else {
            post('/payroll/hr-policy/leave-policy', {
                preserveScroll: true,
                onSuccess: () => { reset(); setShowForm(false); },
                onError: (e) => {
                    if (e.leave_type) setFormErrors(p => ({ ...p, leave_type: e.leave_type }));
                },
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
                setDeleting(false);
                setDeleteTarget(null);
                // delete လုပ်လိုက်တဲ့ item က edit state မှာရှိနေရင် clear လုပ်မယ်
                if (editingId === deleteTarget.id) {
                    reset();
                    setFormErrors({});
                    setShowForm(false);
                    setEditingId(null);
                }
            },
            onError: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleCancel = () => {
        reset();
        setFormErrors({});
        setShowForm(false);
        setEditingId(null);
    };

    return (
        <div className="space-y-5">

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        onClick={() => !deleting && setDeleteTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </div>
                        <h3 className="mt-4 text-center text-base font-bold text-gray-900">Delete Leave Type</h3>
                        <p className="mt-2 text-center text-sm text-gray-500">Are you sure you want to delete</p>
                        <p className="mt-1 text-center text-sm font-semibold text-gray-800 capitalize">"{deleteTarget.leave_type}"?</p>
                        <p className="mt-1 text-center text-xs text-gray-400">This action cannot be undone.</p>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => !deleting && setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                                {deleting ? <><Spinner /> Deleting...</> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            {leavePolicies.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                <th className="px-4 py-3 text-left">Leave Type</th>
                                <th className="px-4 py-3 text-center">Days/Year</th>
                                <th className="px-4 py-3 text-center">Paid</th>
                                <th className="px-4 py-3 text-center">Carry Over</th>
                                <th className="px-4 py-3 text-center">Gender</th>
                                <th className="px-4 py-3 text-center">Document</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {leavePolicies.map((policy) => (
                                <tr key={policy.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-4 py-3.5 font-semibold text-gray-800 capitalize">{policy.leave_type}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="font-semibold text-gray-700">{policy.days_per_year}</span>
                                        <span className="text-xs text-gray-400"> days</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <Badge value={policy.is_paid} trueLabel="Paid" falseLabel="Unpaid" trueColor="green" falseColor="gray"/>
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 text-xs">{policy.carry_over_days}d</td>
                                    <td className="px-4 py-3.5 text-center capitalize text-gray-500 text-xs">{policy.applicable_gender ?? 'all'}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <Badge value={policy.requires_document} trueLabel="Required" falseLabel="No" trueColor="amber" falseColor="gray"/>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <Badge value={policy.is_active} trueLabel="Active" falseLabel="Inactive" trueColor="green" falseColor="red"/>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEdit(policy)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget({ id: policy.id, leave_type: policy.leave_type })}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-10 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/>
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.5"/>
                    </svg>
                    <p className="text-sm font-medium text-gray-400">No leave types configured yet</p>
                    <p className="mt-0.5 text-xs text-gray-300">Click below to add your first leave type</p>
                </div>
            )}

            {/* ── Add / Edit Form ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border border-violet-100 bg-violet-50/40 p-5 space-y-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-800">
                            {editingId ? '✏️ Edit Leave Type' : '+ Add New Leave Type'}
                        </p>
                        <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    {/* ── Quick Select ── */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Quick Select</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_LEAVE_TYPES.map(preset => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    disabled={processing}
                                    onClick={() => {
                                        setData({
                                            ...data,
                                            leave_type:        preset.name,
                                            days_per_year:     preset.days,
                                            is_paid:           preset.paid,
                                            applicable_gender: preset.gender,
                                        });
                                        setFormErrors(p => ({ ...p, leave_type: '', days_per_year: '' }));
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                        data.leave_type === preset.name
                                            ? 'border-violet-400 bg-violet-100 text-violet-700'
                                            : 'border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-600'
                                    }`}
                                >
                                    {preset.name}
                                    <span className={`rounded px-1 py-0.5 text-xs font-bold ${
                                        preset.paid
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {preset.paid ? 'paid' : 'unpaid'}
                                    </span>
                                    {preset.gender !== 'all' && (
                                        <span className="rounded px-1 py-0.5 text-xs font-bold bg-blue-100 text-blue-600">
                                            {preset.gender}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Leave Type Name</label>
                            <input
                                type="text"
                                value={data.leave_type}
                                onChange={e => { setData('leave_type', e.target.value); setFormErrors(p => ({...p, leave_type: ''})); }}
                                className={`input mt-1 ${formErrors.leave_type ? 'border-red-400' : ''}`}
                                placeholder="e.g. Annual, Sick, Maternity"
                                disabled={processing}
                            />
                            {formErrors.leave_type && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
                                    {formErrors.leave_type}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="label">Days Per Year</label>
                            <input
                                type="number"
                                value={data.days_per_year}
                                onChange={e => { setData('days_per_year', e.target.value); setFormErrors(p => ({...p, days_per_year: ''})); }}
                                className={`input mt-1 ${formErrors.days_per_year ? 'border-red-400' : ''}`}
                                min="1"
                                disabled={processing}
                            />
                            {formErrors.days_per_year && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
                                    {formErrors.days_per_year}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="label">Carry Over Days</label>
                            <input
                                type="number"
                                value={data.carry_over_days}
                                onChange={e => setData('carry_over_days', e.target.value)}
                                className="input mt-1"
                                min="0"
                                disabled={processing}
                            />
                        </div>

                        <div>
                            <label className="label">Applicable Gender</label>
                            <select
                                value={data.applicable_gender}
                                onChange={e => setData('applicable_gender', e.target.value)}
                                className="input mt-1"
                                disabled={processing}
                            >
                                <option value="all">All</option>
                                <option value="male">Male only</option>
                                <option value="female">Female only</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 rounded-lg border border-gray-100 bg-white px-4 py-3">
                        <Toggle label="Paid Leave"        checked={data.is_paid}           onChange={v => setData('is_paid', v)}           disabled={processing}/>
                        <Toggle label="Requires Document" checked={data.requires_document}  onChange={v => setData('requires_document', v)}  disabled={processing}/>
                        <Toggle label="Active"            checked={data.is_active}          onChange={v => setData('is_active', v)}          disabled={processing}/>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
                        >
                            {processing
                                ? <><Spinner /> Saving...</>
                                : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{editingId ? 'Update Leave Type' : 'Add Leave Type'}</>
                            }
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={processing}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* ── Add button ── */}
            {!showForm && (
                <button
                    onClick={() => { setEditingId(null); reset(); setFormErrors({}); setShowForm(true); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 hover:border-violet-400 transition-all"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Leave Type
                </button>
            )}
        </div>
    );
}

// ── Badge ─────────────────────────────────────────────────────
function Badge({ value, trueLabel, falseLabel, trueColor = 'green', falseColor = 'gray' }) {
    const colors = {
        green: 'bg-green-100 text-green-700',
        gray:  'bg-gray-100 text-gray-500',
        red:   'bg-red-100 text-red-600',
        amber: 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${value ? colors[trueColor] : colors[falseColor]}`}>
            {value ? trueLabel : falseLabel}
        </span>
    );
}

// ── Toggle ────────────────────────────────────────────────────
function Toggle({ label, checked, onChange, disabled }) {
    return (
        <label className={`flex items-center gap-2 select-none ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
            <div
                onClick={() => !disabled && onChange(!checked)}
                className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`}/>
            </div>
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
    );
}