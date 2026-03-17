import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';

// ── Bonus Types ───────────────────────────────────────────────
const defaultTypeForm = {
    name:             '',
    calculation_type: 'flat',
    value:            '',
    is_active:        true,
};

const PRESET_BONUS_TYPES = [
    { name: 'Annual Bonus',        type: 'percentage' },
    { name: 'Year-End Bonus',      type: 'flat'       },
    { name: 'Performance Bonus',   type: 'percentage' },
    { name: 'Festival Bonus',      type: 'flat'       },
    { name: '13th Month Salary',   type: 'percentage' },
    { name: 'Retention Bonus',     type: 'flat'       },
];


export default function BonusSection({ bonusTypes, bonusSchedules }) {
    // ── Bonus Type state ──
    const [showTypeForm, setShowTypeForm]       = useState(false);
    const [editingTypeId, setEditingTypeId]     = useState(null);
    const [deleteTypeTarget, setDeleteTypeTarget] = useState(null);
    const [deletingType, setDeletingType]       = useState(false);
    const [typeErrors, setTypeErrors]           = useState({});

    const { data: typeData, setData: setTypeData, post: storeType, put: updateType, processing: typeProcessing, reset: resetType } = useForm(defaultTypeForm);

    // ── Bonus Schedule state ──
    const defaultScheduleForm = { bonus_type_id: '', frequency: 'yearly', pay_month: '', pay_quarter: '', notes: '', is_active: true };
    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [deleteScheduleTarget, setDeleteScheduleTarget] = useState(null);
    const [deletingSchedule, setDeletingSchedule]   = useState(false);
   

    const { data: scheduleData, setData: setScheduleData, post: storeSchedule, put: updateSchedule, processing: scheduleProcessing, reset: resetSchedule } = useForm(defaultScheduleForm);

    // ── Type handlers ──
    const validateType = () => {
        const errs = {};
        if (!typeData.name.trim()) errs.name  = 'Bonus name is required.';
        if (!typeData.value)       errs.value = 'Value is required.';
        return errs;
    };

    const handleTypeSubmit = (e) => {
        e.preventDefault();
        const errs = validateType();
        if (Object.keys(errs).length > 0) { setTypeErrors(errs); return; }
        setTypeErrors({});
        if (editingTypeId) {
            updateType(`/payroll/hr-policy/bonus-type/${editingTypeId}`, {
                preserveScroll: true,
                onSuccess: () => { resetType(); setShowTypeForm(false); setEditingTypeId(null); },
                onError: (e) => { if (e.name) setTypeErrors(p => ({...p, name: e.name})); },
            });
        } else {
            storeType('/payroll/hr-policy/bonus-type', {
                preserveScroll: true,
                onSuccess: () => { resetType(); setShowTypeForm(false); },
                onError: (e) => { if (e.name) setTypeErrors(p => ({...p, name: e.name})); },
            });
        }
    };

    const handleTypeEdit = (bt) => {
        setTypeErrors({});
        setTypeData({ name: bt.name, calculation_type: bt.calculation_type, value: bt.value, is_active: !!bt.is_active });
        setEditingTypeId(bt.id);
        setShowTypeForm(true);
    };

    const handleTypeDeleteConfirm = () => {
        if (!deleteTypeTarget) return;
        setDeletingType(true);
        router.delete(`/payroll/hr-policy/bonus-type/${deleteTypeTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingType(false); setDeleteTypeTarget(null);
                if (editingTypeId === deleteTypeTarget.id) { resetType(); setTypeErrors({}); setShowTypeForm(false); setEditingTypeId(null); }
            },
            onError: () => { setDeletingType(false); setDeleteTypeTarget(null); },
        });
    };





    const handleScheduleDeleteConfirm = () => {
        if (!deleteScheduleTarget) return;
        setDeletingSchedule(true);
        router.delete(`/payroll/hr-policy/bonus-schedule/${deleteScheduleTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSchedule(false); setDeleteScheduleTarget(null);
                if (editingScheduleId === deleteScheduleTarget.id) { resetSchedule(); setScheduleErrors({}); setShowScheduleForm(false); setEditingScheduleId(null); }
            },
            onError: () => { setDeletingSchedule(false); setDeleteScheduleTarget(null); },
        });
    };



    return (
        <div className="space-y-8">

            {/* ── Delete modals ── */}
            <DeleteModal
                target={deleteTypeTarget}
                deleting={deletingType}
                title="Delete Bonus Type"
                nameKey="name"
                onCancel={() => setDeleteTypeTarget(null)}
                onConfirm={handleTypeDeleteConfirm}
            />
            <DeleteModal
                target={deleteScheduleTarget}
                deleting={deletingSchedule}
                title="Delete Bonus Schedule"
                nameKey="name"
                onCancel={() => setDeleteScheduleTarget(null)}
                onConfirm={handleScheduleDeleteConfirm}
            />

            {/* ══ PART 1: Bonus Types ══ */}
            <div>
                <div className="mb-3">
                    <h3 className="text-sm font-bold text-gray-800">Bonus Types</h3>
                    <p className="text-xs text-gray-400">Define bonus names, calculation method and rate</p>
                </div>

                

                {/* Type list */}
                {bonusTypes.length > 0 && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    <th className="px-4 py-3 text-left">Bonus Name</th>
                                    <th className="px-4 py-3 text-center">Type</th>
                                    <th className="px-4 py-3 text-center">Value</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {bonusTypes.map(bt => (
                                    <tr key={bt.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3.5 font-semibold text-gray-800">{bt.name}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${bt.calculation_type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {bt.calculation_type === 'percentage' ? 'Percentage' : 'Flat'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-semibold text-gray-700">
                                            {bt.calculation_type === 'percentage' ? `${bt.value}%` : Number(bt.value).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${bt.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {bt.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => handleTypeEdit(bt)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors">
                                                    <EditIcon/> Edit
                                                </button>
                                                <button onClick={() => setDeleteTypeTarget(bt)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                                                    <TrashIcon/> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Type form */}
                {showTypeForm && (
                    <form onSubmit={handleTypeSubmit} className="mb-3 rounded-xl border border-violet-100 bg-violet-50/40 p-5 space-y-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-800">{editingTypeId ? '✏️ Edit Bonus Type' : '+ Add Bonus Type'}</p>
                            <button type="button" onClick={() => { resetType(); setTypeErrors({}); setShowTypeForm(false); setEditingTypeId(null); }} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon/>
                            </button>
                        </div>

                        {/* Preset chips */}
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Quick Select</p>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_BONUS_TYPES.map(p => (
                                    <button key={p.name} type="button"
                                        onClick={() => { setTypeData('name', p.name); setTypeData('calculation_type', p.type); setTypeErrors(e => ({...e, name: ''})); }}
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                            typeData.name === p.name
                                                ? 'border-violet-400 bg-violet-100 text-violet-700'
                                                : 'border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-600'
                                        }`}>
                                        {p.name}
                                        <span className={`rounded px-1 py-0.5 text-xs font-bold ${p.type === 'percentage' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            {p.type === 'percentage' ? '%' : 'flat'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="label">Bonus Name</label>
                                <input type="text" value={typeData.name}
                                    onChange={e => { setTypeData('name', e.target.value); setTypeErrors(p => ({...p, name: ''})); }}
                                    className={`input mt-1 ${typeErrors.name ? 'border-red-400' : ''}`}
                                    placeholder="e.g. Annual Bonus, Year-End Bonus"
                                    disabled={typeProcessing}
                                />
                                {typeErrors.name && <ErrMsg msg={typeErrors.name}/>}
                            </div>

                            <div>
                                <label className="label">Calculation Type</label>
                                <div className="mt-1 flex gap-3">
                                    {[
                                        { value: 'percentage', label: 'Percentage (%)', hint: '% of salary'  },
                                        { value: 'flat',       label: 'Flat Amount',    hint: 'Fixed amount' },
                                        
                                    ].map(opt => (
                                        <label key={opt.value}
                                            className={`flex flex-1 cursor-pointer flex-col rounded-xl border px-3 py-2.5 text-xs transition ${
                                                typeData.calculation_type === opt.value
                                                    ? 'border-violet-400 bg-white text-violet-700'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}>
                                            <div className="flex items-center gap-1.5">
                                                <input type="radio" name="calculation_type" value={opt.value}
                                                    checked={typeData.calculation_type === opt.value}
                                                    onChange={e => setTypeData('calculation_type', e.target.value)}
                                                    className="accent-violet-600" disabled={typeProcessing}/>
                                                <span className="font-semibold">{opt.label}</span>
                                            </div>
                                            <span className="mt-0.5 pl-4 text-gray-400">{opt.hint}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">{typeData.calculation_type === 'percentage' ? 'Rate (%)' : 'Amount'}</label>
                                <div className="relative mt-1">
                                    <input type="number" value={typeData.value}
                                        onChange={e => { setTypeData('value', e.target.value); setTypeErrors(p => ({...p, value: ''})); }}
                                        className={`input pr-10 ${typeErrors.value ? 'border-red-400' : ''}`}
                                        placeholder={typeData.calculation_type === 'percentage' ? '20.00' : '500000'}
                                        min="0" step="0.01" disabled={typeProcessing}/>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                        {typeData.calculation_type === 'percentage' ? '%' : '#'}
                                    </span>
                                </div>
                                {typeErrors.value && <ErrMsg msg={typeErrors.value}/>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
                            <Toggle label="Active" checked={typeData.is_active} onChange={v => setTypeData('is_active', v)} disabled={typeProcessing}/>
                        </div>

                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={typeProcessing}
                                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
                                {typeProcessing ? <><Spinner/> Saving...</> : <>{editingTypeId ? 'Update Bonus Type' : 'Add Bonus Type'}</>}
                            </button>
                            <button type="button" onClick={() => { resetType(); setTypeErrors({}); setShowTypeForm(false); setEditingTypeId(null); }} disabled={typeProcessing}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {!showTypeForm && (
                    <button onClick={() => { setEditingTypeId(null); resetType(); setTypeErrors({}); setShowTypeForm(true); }}
                        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 hover:border-violet-400 transition-all">
                        <PlusIcon/> Add Bonus Type
                    </button>
                )}
            </div>           
        </div>
    );
}

// ── Delete Modal ──────────────────────────────────────────────
function DeleteModal({ target, deleting, title, nameKey, onCancel, onConfirm }) {
    if (!target) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !deleting && onCancel()}/>
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </div>
                <h3 className="mt-4 text-center text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-center text-sm text-gray-500">Are you sure you want to delete</p>
                <p className="mt-1 text-center text-sm font-semibold text-gray-800">"{target[nameKey]}"?</p>
                <p className="mt-1 text-center text-xs text-gray-400">This action cannot be undone.</p>
                <div className="mt-6 flex gap-3">
                    <button onClick={onCancel} disabled={deleting}
                        className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={deleting}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                        {deleting ? <><Spinner/> Deleting...</> : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────
function ErrMsg({ msg }) {
    return (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>
            {msg}
        </p>
    );
}

function Toggle({ label, checked, onChange, disabled }) {
    return (
        <label className={`flex items-center gap-2 select-none ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
            <div onClick={() => !disabled && onChange(!checked)} className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`}/>
            </div>
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}

function Spinner() {
    return <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>;
}
function PlusIcon() {
    return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
}
function EditIcon() {
    return <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
}
function TrashIcon() {
    return <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
}
function CloseIcon() {
    return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
}