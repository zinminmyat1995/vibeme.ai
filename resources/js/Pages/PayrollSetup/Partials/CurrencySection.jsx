import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';

const defaultForm = {
    currency_name: '',
    currency_code: '',
    is_active:     true,
};

const PRESET_CURRENCIES = [
    { name: 'US Dollar',          code: 'USD' },
    { name: 'Cambodian Riel',     code: 'KHR' },
    { name: 'Myanmar Kyat',       code: 'MMK' },
    { name: 'Vietnamese Dong',    code: 'VND' },
    { name: 'Japanese Yen',       code: 'JPY' },
    { name: 'Korean Won',         code: 'KRW' },
];

export default function CurrencySection({ currencies }) {
    const [showForm, setShowForm]           = useState(false);
    const [editingId, setEditingId]         = useState(null);
    const [deleteTarget, setDeleteTarget]   = useState(null);
    const [deleting, setDeleting]           = useState(false);
    const [formErrors, setFormErrors]       = useState({});

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
        setData({
            currency_name: currency.currency_name,
            currency_code: currency.currency_code,
            is_active:     !!currency.is_active,
        });
        setEditingId(currency.id);
        setShowForm(true);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/hr-policy/currency/${deleteTarget.id}`, {
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

    const handlePreset = (preset) => {
        setData({ ...data, currency_name: preset.name, currency_code: preset.code });
        setFormErrors(p => ({ ...p, currency_name: '', currency_code: '' }));
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
                        <h3 className="mt-4 text-center text-base font-bold text-gray-900">Delete Currency</h3>
                        <p className="mt-2 text-center text-sm text-gray-500">Are you sure you want to delete</p>
                        <p className="mt-1 text-center text-sm font-semibold text-gray-800">
                            "{deleteTarget.currency_name} ({deleteTarget.currency_code})"?
                        </p>
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

            {/* ── List ── */}
            {currencies.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                <th className="px-4 py-3 text-left">Currency Name</th>
                                <th className="px-4 py-3 text-center">Code</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {currencies.map((currency) => (
                                <tr key={currency.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-4 py-3.5 font-semibold text-gray-800">
                                        {currency.currency_name}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-bold text-gray-700">
                                            {currency.currency_code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            currency.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {currency.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEdit(currency)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget({ id: currency.id, currency_name: currency.currency_name, currency_code: currency.currency_code })}
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
                        <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                        <path d="M14.31 8a4 4 0 0 0-4.62 0C8.31 8.89 8 10.35 8 12s.31 3.11 1.69 4a4 4 0 0 0 4.62 0" strokeWidth="1.5"/>
                    </svg>
                    <p className="text-sm font-medium text-gray-400">No currencies configured yet</p>
                    <p className="mt-0.5 text-xs text-gray-300">Click below to add your first currency</p>
                </div>
            )}

            {/* ── Add / Edit Form ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border border-violet-100 bg-violet-50/40 p-5 space-y-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-800">
                            {editingId ? '✏️ Edit Currency' : '+ Add New Currency'}
                        </p>
                        <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    {/* Preset chips */}
                    <div>
                        <p className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Quick Select</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_CURRENCIES.map(preset => (
                                <button
                                    key={preset.code}
                                    type="button"
                                    onClick={() => handlePreset(preset)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                        data.currency_code === preset.code
                                            ? 'border-violet-400 bg-violet-100 text-violet-700'
                                            : 'border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-600'
                                    }`}
                                >
                                    <span className="font-mono font-bold">{preset.code}</span>
                                    <span className="text-gray-400">·</span>
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Currency Name */}
                        <div>
                            <label className="label">Currency Name</label>
                            <input
                                type="text"
                                value={data.currency_name}
                                onChange={e => { setData('currency_name', e.target.value); setFormErrors(p => ({...p, currency_name: ''})); }}
                                className={`input mt-1 ${formErrors.currency_name ? 'border-red-400' : ''}`}
                                placeholder="e.g. US Dollar, Cambodian Riel"
                                disabled={processing}
                            />
                            {formErrors.currency_name && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
                                    {formErrors.currency_name}
                                </p>
                            )}
                        </div>

                        {/* Currency Code */}
                        <div>
                            <label className="label">Currency Code</label>
                            <input
                                type="text"
                                value={data.currency_code}
                                onChange={e => { setData('currency_code', e.target.value.toUpperCase()); setFormErrors(p => ({...p, currency_code: ''})); }}
                                className={`input mt-1 font-mono tracking-widest ${formErrors.currency_code ? 'border-red-400' : ''}`}
                                placeholder="e.g. USD, KHR, MMK"
                                maxLength={10}
                                disabled={processing}
                            />
                            {formErrors.currency_code && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
                                    {formErrors.currency_code}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
                        <Toggle
                            label="Active"
                            checked={data.is_active}
                            onChange={v => setData('is_active', v)}
                            disabled={processing}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
                        >
                            {processing
                                ? <><Spinner /> Saving...</>
                                : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{editingId ? 'Update Currency' : 'Add Currency'}</>
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
                    Add Currency
                </button>
            )}
        </div>
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