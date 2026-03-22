import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function PublicHolidaySection({ publicHolidays = [] }) {
    const currentYear = new Date().getFullYear();
    const [yearFilter, setYearFilter] = useState(currentYear);
    const [showForm, setShowForm]     = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]     = useState(false);
    const [errors, setErrors]         = useState({});

    const { data, setData, post, put, processing, reset } = useForm({
        name:         '',
        date:         '',
        is_recurring: true,
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
        setData({
            name:         h.name,
            date:         h.date.substring(0, 10),
            is_recurring: !!h.is_recurring,
        });
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

    const formatDate = (d) => {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDayName = (d) => {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('en-US', { weekday: 'short' });
    };

    return (
        <div className="space-y-5">

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}/>
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </div>
                        <h3 className="text-center text-sm font-bold text-gray-900 mb-1">Delete Holiday?</h3>
                        <p className="text-center text-xs text-gray-500 mb-1">"{deleteTarget.name}"</p>
                        <p className="text-center text-xs text-gray-400 mb-5">{formatDate(deleteTarget.date.substring(0,10))}</p>
                        <div className="flex gap-3">
                            <button onClick={() => !deleting && setDeleteTarget(null)} disabled={deleting}
                                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Year Filter */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
                    {years.map(y => (
                        <button key={y}
                            onClick={() => setYearFilter(y)}
                            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                                yearFilter === y
                                    ? 'bg-white text-violet-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}>
                            {y}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-gray-400">
                    <span className="font-bold text-gray-700">{filtered.length}</span> holidays
                </span>
            </div>

            {/* Holiday List */}
            {filtered.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                <th className="px-4 py-2.5 text-left">Holiday Name</th>
                                <th className="px-4 py-2.5 text-center">Date</th>
                                <th className="px-4 py-2.5 text-center">Day</th>
                                <th className="px-4 py-2.5 text-center">Recurring</th>
                                <th className="px-4 py-2.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(h => {
                                const dateStr = h.date.substring(0, 10);
                                return (
                                    <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-base">🎌</span>
                                                <span className="font-semibold text-gray-800">{h.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                            {formatDate(dateStr)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                                                {getDayName(dateStr)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                h.is_recurring
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {h.is_recurring ? '↻ Recurring' : 'One-time'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => handleEdit(h)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                    Edit
                                                </button>
                                                <button onClick={() => setDeleteTarget(h)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                    Delete
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
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center">
                    <div className="mb-2 text-3xl">🎌</div>
                    <p className="text-sm font-medium text-gray-400">No public holidays for {yearFilter}</p>
                    <p className="mt-1 text-xs text-gray-300">Click "+ Add Holiday" to get started</p>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border border-violet-100 bg-violet-50/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-800">
                            {editingId ? '✏️ Edit Holiday' : '+ Add Public Holiday'}
                        </p>
                        <button type="button"
                            onClick={() => { reset(); setErrors({}); setShowForm(false); setEditingId(null); }}
                            className="text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="label">Holiday Name <span className="text-red-500">*</span></label>
                            <input type="text" value={data.name}
                                onChange={e => { setData('name', e.target.value); setErrors(v => ({...v, name:''})); }}
                                className={`input mt-1 ${errors.name ? 'border-red-400' : ''}`}
                                placeholder="e.g. Khmer New Year" disabled={processing}/>
                            {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="label">Date <span className="text-red-500">*</span></label>
                            <input type="date" value={data.date}
                                onChange={e => { setData('date', e.target.value); setErrors(v => ({...v, date:''})); }}
                                className={`input mt-1 ${errors.date ? 'border-red-400' : ''}`}
                                disabled={processing}/>
                            {errors.date && <p className="mt-1 text-xs text-red-500 font-medium">{errors.date}</p>}
                        </div>

                        <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 cursor-pointer hover:bg-gray-50">
                                <div onClick={() => setData('is_recurring', !data.is_recurring)}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${data.is_recurring ? 'bg-violet-600' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${data.is_recurring ? 'translate-x-4' : ''}`}/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700">Recurring annually</p>
                                    <p className="text-xs text-gray-400">Repeats every year</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                            {processing ? 'Saving...' : editingId ? 'Update Holiday' : 'Add Holiday'}
                        </button>
                        <button type="button"
                            onClick={() => { reset(); setErrors({}); setShowForm(false); setEditingId(null); }}
                            disabled={processing}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {!showForm && (
                <button onClick={() => { setEditingId(null); reset(); setErrors({}); setShowForm(true); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 hover:border-violet-400 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    Add Holiday
                </button>
            )}
        </div>
    );
}