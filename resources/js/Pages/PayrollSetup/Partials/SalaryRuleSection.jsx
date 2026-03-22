import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';

const PAY_CYCLE_OPTIONS = [
    { value: 'monthly',      label: 'Monthly',      hint: '12x / year', desc: 'Once a month'   },
    { value: 'semi_monthly', label: 'Semi-Monthly', hint: '24x / year', desc: 'Twice a month'  },
    { value: 'ten_day',      label: '10-Day',       hint: '36x / year', desc: 'Every 10 days'  },
];

const MONTHS = [
    { value: 1,  label: 'January'   }, { value: 2,  label: 'February'  },
    { value: 3,  label: 'March'     }, { value: 4,  label: 'April'     },
    { value: 5,  label: 'May'       }, { value: 6,  label: 'June'      },
    { value: 7,  label: 'July'      }, { value: 8,  label: 'August'    },
    { value: 9,  label: 'September' }, { value: 10, label: 'October'   },
    { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
];

const FREQ_OPTIONS = [
    { value: 'monthly',   label: 'Monthly',   hint: 'Every month'    },
    { value: 'quarterly', label: 'Quarterly', hint: 'Every 3 months' },
    { value: 'yearly',    label: 'Yearly',    hint: 'Once a year'    },
    { value: 'once',      label: 'One-Time',  hint: 'Special bonus'  },
];

export default function SalaryRuleSection({ salaryRule, banks, currencies, bonusTypes, bonusSchedules }) {
    const isEdit = !!salaryRule;

    // ── General settings state ──
    const [showConfirm, setShowConfirm]     = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [formErrors, setFormErrors]       = useState({});

    const { data, setData, post, processing, reset } = useForm(
        salaryRule ? {
            pay_cycle:               salaryRule.pay_cycle              ?? 'monthly',
            probation_days:          salaryRule.probation_days         ?? '',
            bonus_during_probation: salaryRule.bonus_during_probation ?? false,
            bonus_for_contract:     salaryRule.bonus_for_contract     ?? false,
            bank_id:                 salaryRule.bank_id                ?? '',
            working_hours_per_day:   salaryRule.working_hours_per_day  ?? '',
            working_days_per_week:   salaryRule.working_days_per_week  ?? '',
            // ── Shift times ──
            day_shift_start:         salaryRule.day_shift_start?.substring(0, 5) ?? '08:00',
            day_shift_end:           salaryRule.day_shift_end?.substring(0, 5)   ?? '18:00',
            lunch_start: salaryRule?.lunch_start?.substring(0, 5) ?? '12:00',
            lunch_end:   salaryRule?.lunch_end?.substring(0, 5)   ?? '13:00',
            work_start:  salaryRule?.work_start?.substring(0, 5)  ?? '08:00',
            work_end:    salaryRule?.work_end?.substring(0, 5)    ?? '17:00',
            overtime_base:           salaryRule.overtime_base          ?? 'hourly_rate',
            late_deduction_unit:     salaryRule.late_deduction_unit    ?? 'per_minute',
            late_deduction_rate:     salaryRule.late_deduction_rate    ?? 0,
            currency_id:             salaryRule.currency_id            ?? '',
        } : {
            pay_cycle:              'monthly',
            probation_days:         '',
            bonus_during_probation: false,
            bonus_for_contract:     false,
            bank_id:                '',
            working_hours_per_day:  '',
            working_days_per_week:  '',
            // ── Shift times ──
            day_shift_start:        '08:00',
            day_shift_end:          '18:00',
            lunch_start: '12:00',
            lunch_end:   '13:00',
            work_start:  '08:00',
            work_end:    '17:00',
            overtime_base:          'hourly_rate',
            late_deduction_unit:    'per_minute',
            late_deduction_rate:    0,
            currency_id:            '',
        }
    );

    // ── Bonus schedule state ──
    const defaultSF = { bonus_type_id: '', frequency: 'yearly', pay_month: '', pay_quarter: '', notes: '', is_active: true };
    const [showSF, setShowSF]                 = useState(false);
    const [editingSFId, setEditingSFId]       = useState(null);
    const [deleteSFTarget, setDeleteSFTarget] = useState(null);
    const [deletingSF, setDeletingSF]         = useState(false);
    const [sfErrors, setSFErrors]             = useState({});

    const { data: sf, setData: setSF, post: storeSF, put: updateSF, processing: sfProc, reset: resetSF } = useForm(defaultSF);

    // ── General settings handlers ──
    const validate = () => {
        const errs = {};
        if (!data.probation_days && data.probation_days !== 0) errs.probation_days = 'Required.';
        if (!data.currency_id)           errs.currency_id           = 'Payroll currency is required.';
        if (!data.bank_id)               errs.bank_id               = 'Bank payment is required.';
        if (!data.working_hours_per_day) errs.working_hours_per_day = 'Required.';
        if (!data.working_days_per_week) errs.working_days_per_week = 'Required.';
        // ── Shift time validation ──
        if (!data.day_shift_start) errs.day_shift_start = 'Day shift start is required.';
        if (!data.day_shift_end)   errs.day_shift_end   = 'Day shift end is required.';
        if (data.day_shift_start && data.day_shift_end && data.day_shift_start === data.day_shift_end) {
            errs.day_shift_end = 'Start and end cannot be the same time.';
        }
        return errs;
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        setFormErrors({});
        setShowConfirm(true);
    };

    const handleConfirmedSave = () => {
        setShowConfirm(false);
        post('/payroll/hr-policy/salary-rule', { preserveScroll: true });
    };

    // ── Bonus schedule handlers ──
    const validateSF = () => {
        const errs = {};
        if (!sf.bonus_type_id) errs.bonus_type_id = 'Please select a bonus type.';
        if ((sf.frequency === 'yearly' || sf.frequency === 'once') && !sf.pay_month)
            errs.pay_month = 'Pay month is required.';
        if (sf.frequency === 'quarterly' && !sf.pay_quarter)
            errs.pay_quarter = 'Pay quarter is required.';
        if (!sf.notes?.trim()) errs.notes = 'Notes is required.';
        return errs;
    };

    const handleSFSubmit = (e) => {
        e.preventDefault();
        const errs = validateSF();
        if (Object.keys(errs).length > 0) { setSFErrors(errs); return; }
        setSFErrors({});
        if (editingSFId) {
            updateSF(`/payroll/hr-policy/bonus-schedule/${editingSFId}`, {
                preserveScroll: true,
                onSuccess: () => { resetSF(); setShowSF(false); setEditingSFId(null); },
                onError: (e) => { if (e.bonus_type_id) setSFErrors(p => ({...p, bonus_type_id: e.bonus_type_id})); },
            });
        } else {
            storeSF('/payroll/hr-policy/bonus-schedule', {
                preserveScroll: true,
                onSuccess: () => { resetSF(); setShowSF(false); },
                onError: (e) => { if (e.bonus_type_id) setSFErrors(p => ({...p, bonus_type_id: e.bonus_type_id})); },
            });
        }
    };

    const handleSFEdit = (s) => {
        setSFErrors({});
        setSF({ bonus_type_id: s.bonus_type_id, frequency: s.frequency, pay_month: s.pay_month ?? '', pay_quarter: s.pay_quarter ?? '', notes: s.notes ?? '', is_active: !!s.is_active });
        setEditingSFId(s.id);
        setShowSF(true);
    };

    const handleSFDeleteConfirm = () => {
        if (!deleteSFTarget) return;
        setDeletingSF(true);
        router.delete(`/payroll/hr-policy/bonus-schedule/${deleteSFTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSF(false); setDeleteSFTarget(null);
                if (editingSFId === deleteSFTarget.id) { resetSF(); setSFErrors({}); setShowSF(false); setEditingSFId(null); }
            },
            onError: () => { setDeletingSF(false); setDeleteSFTarget(null); },
        });
    };

    const getWhen = (s) => {
        if ((s.frequency === 'yearly' || s.frequency === 'once') && s.pay_month)
            return MONTHS.find(m => m.value == s.pay_month)?.label ?? '—';
        if (s.frequency === 'quarterly' && s.pay_quarter)
            return `Q${s.pay_quarter}`;
        if (s.frequency === 'monthly')
            return 'Every month';
        return '—';
    };

    const selectedBank     = banks?.find(b => b.id == data.bank_id);
    const selectedCurrency = currencies?.find(c => c.id == data.currency_id);
    const selectedCycle    = PAY_CYCLE_OPTIONS.find(o => o.value === data.pay_cycle);

    return (
        <div className="space-y-6">

            {/* ── Confirm Modal ── */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)}/>
                    <div className="relative z-10 w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
                        <div className="bg-violet-600 px-8 py-6 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">{isEdit ? 'Update Settings?' : 'Save Settings?'}</h3>
                            <p className="mt-1 text-sm text-violet-200">{isEdit ? 'This will overwrite existing settings.' : 'This will save general payroll settings.'}</p>
                        </div>
                        <div className="px-8 py-6 space-y-1 max-h-[55vh] overflow-y-auto
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-track]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-gray-100
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-thumb]:bg-violet-300
                            hover:[&::-webkit-scrollbar-thumb]:bg-violet-400">
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Review before saving</p>
                            <ConfirmRow icon="📅" label="Pay Cycle"    value={selectedCycle?.label ?? '—'}/>
                            <ConfirmRow icon="⏳" label="Probation"    value={`${data.probation_days} days`}/>
                            <ConfirmRow icon="💱" label="Currency"     value={selectedCurrency ? `${selectedCurrency.currency_name} (${selectedCurrency.currency_code})` : '—'}/>
                            <ConfirmRow icon="🏦" label="Bank"         value={selectedBank?.bank_name ?? '—'}/>
                            <ConfirmRow icon="🕐" label="Required Hours"   value={`${data.working_hours_per_day}h/day · ${data.working_days_per_week}d/week`}/>
                            {/* ── Shift time rows ── */}
                            <ConfirmRow icon="🌤️" label="Day Shift"   value={`${to12h(data.day_shift_start)} – ${to12h(data.day_shift_end)}`}/>
                            <ConfirmRow icon="🌙" label="Night Shift"  value={`${to12h(data.day_shift_end)} – ${to12h(data.day_shift_start)} (auto)`}/>
                            <ConfirmRow icon="🍽️" label="Lunch Break"  value={`${data.lunch_start ?? '12:00'} — ${data.lunch_end ?? '13:00'}`}/>
                            <ConfirmRow icon="💼" label="Work Hours"   value={`${to12h(data.work_start ?? '08:00')} – ${to12h(data.work_end ?? '17:00')}`}/>
                            <ConfirmRow icon="⚡" label="OT Base"      value={data.overtime_base === 'hourly_rate' ? 'Hourly Rate' : 'Daily Rate'}/>
                            <ConfirmRow icon="⚠️" label="Late Deduct"  value={`${data.late_deduction_rate || 0} / ${data.late_deduction_unit === 'per_minute' ? 'min' : 'hr'}`}/>
                            <ConfirmRow icon="🎁" label="Bonus in Probation" value={data.bonus_during_probation ? 'Yes — pay bonus' : 'No — skip bonus'}/>
                            <ConfirmRow icon="📋" label="Bonus for Contract" value={data.bonus_for_contract ? 'Yes — pay bonus' : 'No — skip bonus'}/>
                        </div>
                        <div className="border-t border-gray-100 px-8 py-5 flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleConfirmedSave} disabled={processing}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60">
                                {processing ? <><Spinner/> Saving...</> : isEdit ? '✓ Yes, Update' : '✓ Yes, Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bank Modal ── */}
            {showBankModal && <BankModal banks={banks} onClose={() => setShowBankModal(false)}/>}

            {/* ── Delete Schedule Modal ── */}
            {deleteSFTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !deletingSF && setDeleteSFTarget(null)}/>
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </div>
                        <h3 className="mt-4 text-center text-base font-bold text-gray-900">Delete Bonus Schedule</h3>
                        <p className="mt-2 text-center text-sm text-gray-500">Are you sure you want to delete</p>
                        <p className="mt-1 text-center text-sm font-semibold text-gray-800">"{deleteSFTarget.bonus_type?.name}" schedule?</p>
                        <p className="mt-1 text-center text-xs text-gray-400">This action cannot be undone.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => !deletingSF && setDeleteSFTarget(null)} disabled={deletingSF}
                                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                            <button onClick={handleSFDeleteConfirm} disabled={deletingSF}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                                {deletingSF ? <><Spinner/> Deleting...</> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ FORM ══ */}
            <form onSubmit={handleSaveClick} className="space-y-6">

                {/* Pay Cycle */}
                <div>
                    <label className="label">Pay Cycle</label>
                    <div className="mt-2 flex gap-3">
                        {PAY_CYCLE_OPTIONS.map(opt => (
                            <label key={opt.value} className={`flex flex-1 cursor-pointer flex-col rounded-xl border px-4 py-3 transition ${data.pay_cycle === opt.value ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                    <input type="radio" name="pay_cycle" value={opt.value} checked={data.pay_cycle === opt.value} onChange={e => setData('pay_cycle', e.target.value)} className="accent-violet-600"/>
                                    <span className={`text-sm font-bold ${data.pay_cycle === opt.value ? 'text-violet-700' : 'text-gray-700'}`}>{opt.label}</span>
                                </div>
                                <span className="mt-1 pl-5 text-xs text-gray-400">{opt.desc}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    {/* Probation */}
                    <div>
                        <label className="label">Probation Period</label>
                        <div className="relative mt-1">
                            <input type="number" value={data.probation_days}
                                onChange={e => { setData('probation_days', e.target.value); setFormErrors(p => ({...p, probation_days: ''})); }}
                                className={`input pr-14 ${formErrors.probation_days ? 'border-red-400' : ''}`}
                                min="0" placeholder="e.g. 90"/>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">days</span>
                        </div>
                        {formErrors.probation_days && <ErrMsg msg={formErrors.probation_days}/>}

                        {/* Bonus during probation toggle */}
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Pay bonus during probation?</p>
                                <p className="text-xs text-gray-400">If off, bonuses are skipped for probation employees</p>
                            </div>
                            <Toggle label="" checked={data.bonus_during_probation} onChange={v => setData('bonus_during_probation', v)} />
                        </div>

                        {/* Bonus for contract toggle */}
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Pay bonus for contract employees?</p>
                                <p className="text-xs text-gray-400">If off, bonuses are skipped for contract employees</p>
                            </div>
                            <Toggle label="" checked={data.bonus_for_contract} onChange={v => setData('bonus_for_contract', v)} />
                        </div>
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="label">Payroll Currency</label>
                        <select value={data.currency_id} onChange={e => { setData('currency_id', e.target.value); setFormErrors(p => ({...p, currency_id: ''})); }}
                            className={`input mt-1 ${formErrors.currency_id ? 'border-red-400' : ''}`}>
                            <option value="">— Select currency —</option>
                            {currencies?.map(c => <option key={c.id} value={c.id}>{c.currency_name} ({c.currency_code})</option>)}
                        </select>
                        {formErrors.currency_id && <ErrMsg msg={formErrors.currency_id}/>}
                        {currencies?.length === 0 && <p className="mt-1 text-xs text-amber-500">No currencies. Add in Currency Setup first.</p>}
                    </div>

                    {/* Bank */}
                    <div>
                        <label className="label">Bank Payment</label>
                        <div className="flex gap-2 mt-1">
                            <select value={data.bank_id} onChange={e => { setData('bank_id', e.target.value); setFormErrors(p => ({...p, bank_id: ''})); }}
                                className={`input flex-1 ${formErrors.bank_id ? 'border-red-400' : ''}`}>
                                <option value="">— Select bank —</option>
                                {banks?.filter(b => b.is_active).map(b => <option key={b.id} value={b.id}>{b.bank_name}{b.bank_code ? ` (${b.bank_code})` : ''}</option>)}
                            </select>
                            <button type="button" onClick={() => setShowBankModal(true)}
                                className="flex-shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-100">
                                Manage
                            </button>
                        </div>
                        {formErrors.bank_id && <ErrMsg msg={formErrors.bank_id}/>}
                    </div>

                    {/* Working Hours */}
                    <div>
                        <label className="label">Working Hours / Day</label>
                        <div className="relative mt-1">
                            <input type="number" value={data.working_hours_per_day} onChange={e => { setData('working_hours_per_day', e.target.value); setFormErrors(p => ({...p, working_hours_per_day: ''})); }}
                                className={`input pr-14 ${formErrors.working_hours_per_day ? 'border-red-400' : ''}`} min="1" max="24" placeholder="e.g. 8"/>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">hrs</span>
                        </div>
                        {formErrors.working_hours_per_day && <ErrMsg msg={formErrors.working_hours_per_day}/>}
                    </div>

                    {/* Working Days */}
                    <div>
                        <label className="label">Working Days / Week</label>
                        <div className="relative mt-1">
                            <input type="number" value={data.working_days_per_week} onChange={e => { setData('working_days_per_week', e.target.value); setFormErrors(p => ({...p, working_days_per_week: ''})); }}
                                className={`input pr-14 ${formErrors.working_days_per_week ? 'border-red-400' : ''}`} min="1" max="7" placeholder="e.g. 5"/>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">days</span>
                        </div>
                        {formErrors.working_days_per_week && <ErrMsg msg={formErrors.working_days_per_week}/>}
                    </div>

                    {/* OT Base */}
                    <div>
                        <label className="label">Overtime Calculation Base</label>
                        <div className="mt-1 flex gap-3">
                            {[
                                { value: 'hourly_rate', label: 'Hourly Rate', hint: 'Daily ÷ working hrs'    },
                                { value: 'daily_rate',  label: 'Daily Rate',  hint: 'Monthly ÷ working days' },
                            ].map(opt => (
                                <label key={opt.value} className={`flex flex-1 cursor-pointer flex-col rounded-xl border px-3 py-2.5 text-xs transition ${data.overtime_base === opt.value ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-1.5">
                                        <input type="radio" name="overtime_base" value={opt.value} checked={data.overtime_base === opt.value} onChange={e => setData('overtime_base', e.target.value)} className="accent-violet-600"/>
                                        <span className="font-semibold">{opt.label}</span>
                                    </div>
                                    <span className="mt-0.5 pl-4 text-gray-400">{opt.hint}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══ SHIFT HOURS ══ */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Shift Hours</p>
                        <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-100">
                            Used for OT type auto-detection
                        </span>
                    </div>

                    {/* Visual timeline bar */}
                    <ShiftTimeline start={data.day_shift_start} end={data.day_shift_end} />

                    {/* Inputs row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Day shift start */}
                        <div>
                            <label className="label flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"/>
                                Day shift starts
                            </label>
                            <input
                                type="time"
                                value={data.day_shift_start}
                                onChange={e => {
                                    setData('day_shift_start', e.target.value);
                                    setFormErrors(p => ({ ...p, day_shift_start: '' }));
                                }}
                                className={`input mt-1 ${formErrors.day_shift_start ? 'border-red-400' : ''}`}
                            />
                            {formErrors.day_shift_start && <ErrMsg msg={formErrors.day_shift_start}/>}
                        </div>

                        {/* Day shift end */}
                        <div>
                            <label className="label flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-400"/>
                                Day shift ends
                            </label>
                            <input
                                type="time"
                                value={data.day_shift_end}
                                onChange={e => {
                                    setData('day_shift_end', e.target.value);
                                    setFormErrors(p => ({ ...p, day_shift_end: '' }));
                                }}
                                className={`input mt-1 ${formErrors.day_shift_end ? 'border-red-400' : ''}`}
                            />
                            {formErrors.day_shift_end && <ErrMsg msg={formErrors.day_shift_end}/>}
                        </div>
                    </div>

                    {/* Auto-derived night shift info */}
                    <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 border border-indigo-100">
                        <span className="text-sm flex-shrink-0">🌙</span>
                        <p className="text-xs text-indigo-700">
                            Night shift is automatically{' '}
                            <span className="font-semibold">
                            {to12h(data.day_shift_end)} → {to12h(data.day_shift_start)}
                            </span>{' '}
                            (everything outside day shift)
                        </p>
                    </div>
                </div>
                {/* Lunch break */}
                <div className="rounded-xl border border-gray-200 bg-amber-50/50 p-4 space-y-3 mt-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        🍽 Lunch Break
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"/>
                                Lunch starts
                            </label>
                            <input
                                type="time"
                                value={data.lunch_start ?? '12:00'}
                                onChange={e => setData('lunch_start', e.target.value)}
                                className="input mt-1"
                            />
                        </div>
                        <div>
                            <label className="label flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400"/>
                                Lunch ends
                            </label>
                            <input
                                type="time"
                                value={data.lunch_end ?? '13:00'}
                                onChange={e => setData('lunch_end', e.target.value)}
                                className="input mt-1"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                        Work hours will auto-deduct lunch if check-in/out overlaps this period.
                    </p>
                </div>
                {/* ══ WORK HOURS ══ */}
                <div className="rounded-xl border border-gray-200 bg-green-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Work Hours</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400"/>
                                Work starts
                            </label>
                            <input type="time" value={data.work_start ?? '08:00'}
                                onChange={e => setData('work_start', e.target.value)}
                                className="input mt-1"/>
                        </div>
                        <div>
                            <label className="label flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"/>
                                Work ends
                            </label>
                            <input type="time" value={data.work_end ?? '17:00'}
                                onChange={e => setData('work_end', e.target.value)}
                                className="input mt-1"/>
                        </div>
                    </div>
                </div>
                {/* Late Deduction */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Late Deduction Rule</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Deduction Unit</label>
                            <div className="mt-1 flex gap-3">
                                {[{ value: 'per_minute', label: 'Per Minute' }, { value: 'per_hour', label: 'Per Hour' }].map(opt => (
                                    <label key={opt.value} className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition ${data.late_deduction_unit === opt.value ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                        <input type="radio" name="late_deduction_unit" value={opt.value} checked={data.late_deduction_unit === opt.value} onChange={e => setData('late_deduction_unit', e.target.value)} className="accent-violet-600"/>
                                        <span className="font-semibold">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="label">Deduction Rate <span className="ml-1 text-xs text-gray-400">(per {data.late_deduction_unit === 'per_minute' ? 'minute' : 'hour'} · default 0)</span></label>
                            <div className="relative mt-1">
                                <input type="number" value={data.late_deduction_rate} onChange={e => setData('late_deduction_rate', e.target.value)} className="input pr-10" min="0" step="0.01" placeholder="0"/>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">#</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ BONUS SCHEDULE ══ */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Bonus Schedule</p>
                        {bonusTypes?.length === 0 && (
                            <span className="text-xs text-amber-500">Add bonus types in Bonus section first</span>
                        )}
                    </div>

                    {/* Schedule list */}
                    {bonusSchedules?.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        <th className="px-4 py-2.5 text-left">Bonus</th>
                                        <th className="px-4 py-2.5 text-center">Rate</th>
                                        <th className="px-4 py-2.5 text-center">Frequency</th>
                                        <th className="px-4 py-2.5 text-center">Pay When</th>
                                        <th className="px-4 py-2.5 text-left">Notes</th>
                                        <th className="px-4 py-2.5 text-center">Status</th>
                                        <th className="px-4 py-2.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bonusSchedules.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-800">{s.bonus_type?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                                {s.bonus_type?.calculation_type === 'percentage' ? `${s.bonus_type.value}%` : Number(s.bonus_type?.value ?? 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                                                    {FREQ_OPTIONS.find(f => f.value === s.frequency)?.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">{getWhen(s)}</td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{s.notes || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {s.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button type="button" onClick={() => handleSFEdit(s)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50">
                                                        <EditIcon/> Edit
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteSFTarget(s)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">
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

                    {/* Schedule form */}
                    {showSF && (
                        <div className="rounded-xl border border-violet-100 bg-white p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-800">{editingSFId ? '✏️ Edit Schedule' : '+ Add Bonus Schedule'}</p>
                                <button type="button" onClick={() => { resetSF(); setSFErrors({}); setShowSF(false); setEditingSFId(null); }} className="text-gray-400 hover:text-gray-600">
                                    <CloseIcon/>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label">Bonus Type</label>
                                    <select value={sf.bonus_type_id} onChange={e => { setSF('bonus_type_id', e.target.value); setSFErrors(p => ({...p, bonus_type_id: ''})); }}
                                        className={`input mt-1 ${sfErrors.bonus_type_id ? 'border-red-400' : ''}`} disabled={sfProc}>
                                        <option value="">— Select bonus type —</option>
                                        {bonusTypes?.filter(bt => bt.is_active).map(bt => (
                                            <option key={bt.id} value={bt.id}>
                                                {bt.name} · {bt.calculation_type === 'percentage' ? `${bt.value}%` : Number(bt.value).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                    {sfErrors.bonus_type_id && <ErrMsg msg={sfErrors.bonus_type_id}/>}
                                </div>

                                <div className="col-span-2">
                                    <label className="label">Frequency</label>
                                    <div className="mt-1 grid grid-cols-4 gap-2">
                                        {FREQ_OPTIONS.map(opt => (
                                            <label key={opt.value} className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 text-xs transition ${sf.frequency === opt.value ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                                <div className="flex items-center gap-1.5">
                                                    <input type="radio" name="sf_freq" value={opt.value} checked={sf.frequency === opt.value}
                                                        onChange={e => { setSF('frequency', e.target.value); setSF('pay_month', ''); setSF('pay_quarter', ''); }}
                                                        className="accent-violet-600" disabled={sfProc}/>
                                                    <span className="font-semibold">{opt.label}</span>
                                                </div>
                                                <span className="mt-0.5 pl-4 text-gray-400">{opt.hint}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {(sf.frequency === 'yearly' || sf.frequency === 'once') && (
                                    <div>
                                        <label className="label">Pay Month</label>
                                        <select value={sf.pay_month} onChange={e => { setSF('pay_month', e.target.value); setSFErrors(p => ({...p, pay_month: ''})); }}
                                            className={`input mt-1 ${sfErrors.pay_month ? 'border-red-400' : ''}`} disabled={sfProc}>
                                            <option value="">— Select month —</option>
                                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                        {sfErrors.pay_month && <ErrMsg msg={sfErrors.pay_month}/>}
                                    </div>
                                )}

                                {sf.frequency === 'quarterly' && (
                                    <div>
                                        <label className="label">Pay Quarter</label>
                                        <div className="mt-1 flex gap-2">
                                            {[1,2,3,4].map(q => (
                                                <label key={q} className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition ${sf.pay_quarter == q ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                                    <input type="radio" name="sf_quarter" value={q} checked={sf.pay_quarter == q} onChange={e => { setSF('pay_quarter', e.target.value); setSFErrors(p => ({...p, pay_quarter: ''})); }} className="sr-only" disabled={sfProc}/>
                                                    Q{q}
                                                </label>
                                            ))}
                                        </div>
                                        {sfErrors.pay_quarter && <ErrMsg msg={sfErrors.pay_quarter}/>}
                                    </div>
                                )}

                                <div className={sf.frequency === 'monthly' ? 'col-span-2' : ''}>
                                    <label className="label">Notes</label>
                                    <input type="text" value={sf.notes}
                                        onChange={e => { setSF('notes', e.target.value); setSFErrors(p => ({...p, notes: ''})); }}
                                        className={`input mt-1 ${sfErrors.notes ? 'border-red-400' : ''}`}
                                        placeholder="e.g. Paid with December payroll"
                                        disabled={sfProc}/>
                                    {sfErrors.notes && <ErrMsg msg={sfErrors.notes}/>}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                <Toggle label="Active" checked={sf.is_active} onChange={v => setSF('is_active', v)} disabled={sfProc}/>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={handleSFSubmit} disabled={sfProc}
                                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                                    {sfProc ? <><Spinner/> Saving...</> : editingSFId ? 'Update Schedule' : 'Add Schedule'}
                                </button>
                                <button type="button" onClick={() => { resetSF(); setSFErrors({}); setShowSF(false); setEditingSFId(null); }} disabled={sfProc}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {!showSF && (
                        <button type="button" onClick={() => { setEditingSFId(null); resetSF(); setSFErrors({}); setShowSF(true); }}
                            disabled={!bonusTypes?.length}
                            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 hover:border-violet-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <PlusIcon/> Add Bonus Schedule
                        </button>
                    )}
                </div>

                {/* Current Settings */}
                {isEdit && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Settings</p>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600 border border-green-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"/> Saved
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <SavedCard label="Pay Cycle"     value={PAY_CYCLE_OPTIONS.find(o => o.value === salaryRule.pay_cycle)?.label ?? '—'} sub={PAY_CYCLE_OPTIONS.find(o => o.value === salaryRule.pay_cycle)?.hint}/>
                            <SavedCard label="Probation"     value={salaryRule.probation_days != null ? `${salaryRule.probation_days} days` : '—'}/>
                            <SavedCard label="Currency"      value={currencies?.find(c => c.id == salaryRule.currency_id)?.currency_code ?? '—'} sub={currencies?.find(c => c.id == salaryRule.currency_id)?.currency_name}/>
                            <SavedCard label="Bank"          value={banks?.find(b => b.id == salaryRule.bank_id)?.bank_name ?? '—'} sub={banks?.find(b => b.id == salaryRule.bank_id)?.bank_code}/>
                            <SavedCard label="Working Hours" value={`${salaryRule.working_hours_per_day}h / day`}/>
                            <SavedCard label="Working Days"  value={`${salaryRule.working_days_per_week} days / week`}/>
                            <SavedCard label="Work Hours" value={salaryRule.work_start && salaryRule.work_end ? `${to12h(salaryRule.work_start)} – ${to12h(salaryRule.work_end)}` : '—'} sub="Attendance window"/>
                            <SavedCard label="Day Shift"   value={salaryRule.day_shift_start && salaryRule.day_shift_end ? `${to12h(salaryRule.day_shift_start)} – ${to12h(salaryRule.day_shift_end)}` : '—'} sub="Day shift hours"/>
                            <SavedCard label="Night Shift" value={salaryRule.day_shift_end && salaryRule.day_shift_start ? `${to12h(salaryRule.day_shift_end)} – ${to12h(salaryRule.day_shift_start)}` : '—'} sub="Auto-derived"/>
                            <SavedCard label="Lunch Break" value={salaryRule.lunch_start && salaryRule.lunch_end ? `${salaryRule.lunch_start?.substring(0,5)} — ${salaryRule.lunch_end?.substring(0,5)}` : '12:00 — 13:00'} sub="Auto-deducted from work hours"/>
                            <SavedCard label="OT Base"       value={salaryRule.overtime_base === 'hourly_rate' ? 'Hourly Rate' : 'Daily Rate'} sub={salaryRule.overtime_base === 'hourly_rate' ? 'Daily ÷ working hrs' : 'Monthly ÷ working days'}/>
                            <SavedCard label="Late Deduct"   value={`${salaryRule.late_deduction_rate ?? 0} / ${salaryRule.late_deduction_unit === 'per_minute' ? 'min' : 'hr'}`}/>
                            <SavedCard label="Bonus in Probation" value={salaryRule.bonus_during_probation ? 'Yes — pay bonus' : 'No — skip bonus'} sub={salaryRule.bonus_during_probation ? 'Probation employees receive bonuses' : 'Bonuses skipped during probation'}/>
                            <SavedCard label="Bonus for Contract" value={salaryRule.bonus_for_contract ? 'Yes — pay bonus' : 'No — skip bonus'} sub={salaryRule.bonus_for_contract ? 'Contract employees receive bonuses' : 'Bonuses skipped for contract'}/>
                            
                            {bonusSchedules?.length > 0 && (
                                <div className="col-span-3 overflow-hidden rounded-xl border border-gray-100">
                                    <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Bonus Schedules</p>
                                    </div>
                                    <div className="divide-y divide-gray-50 bg-white">
                                        {bonusSchedules.map(s => {
                                            const when  = getWhen(s);
                                            const freq  = FREQ_OPTIONS.find(f => f.value === s.frequency)?.label;
                                            const isPct = s.bonus_type?.calculation_type === 'percentage';
                                            return (
                                                <div key={s.id} className={`px-4 py-3.5 hover:bg-gray-50/60 transition-colors ${!s.is_active ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* Left: name + tags */}
                                                        <div className="flex items-start gap-2.5">
                                                            <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${s.is_active ? 'bg-green-400' : 'bg-gray-300'}`}/>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{s.bonus_type?.name ?? '—'}</p>
                                                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{freq}</span>
                                                                    {when !== '—' && when !== 'Every month' && (
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                                                                            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                                            {when}
                                                                        </span>
                                                                    )}
                                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                                                        {s.is_active ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </div>
                                                                {s.notes && <p className="mt-1 text-xs italic text-gray-400">{s.notes}</p>}
                                                            </div>
                                                        </div>
                                                        {/* Right: rate */}
                                                        <div className="flex-shrink-0 text-right">
                                                            <p className={`text-base font-bold ${isPct ? 'text-blue-600' : 'text-green-600'}`}>
                                                                {isPct ? `${formatRate(s.bonus_type.value)}%` : formatRate(s.bonus_type?.value ?? 0)}
                                                            </p>
                                                            <p className="text-xs text-gray-400">{isPct ? 'of salary' : 'flat amount'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex items-center gap-4">
                    <button type="submit" disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-sm">
                        {processing ? <><Spinner/> Saving...</> : <><CheckIcon/>{isEdit ? 'Update Settings' : 'Save Settings'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Shift Timeline Component ──────────────────────────────────
function ShiftTimeline({ start, end }) {
    const toMin = (t) => {
        if (!t) return null;
        // Handle both "HH:MM" and "HH:MM AM/PM" formats
        const clean = t.substring(0, 5); // take first 5 chars = "HH:MM"
        const [h, m] = clean.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return null;
        return h * 60 + m;
    }

    const startMin  = toMin(start) ?? 8 * 60;
    const endMin    = toMin(end)   ?? 18 * 60;
    const totalMin  = 24 * 60;
    const dayStart  = (startMin / totalMin) * 100;
    const isNormal  = endMin > startMin;
    const dayWidth  = isNormal
        ? ((endMin - startMin) / totalMin) * 100
        : ((totalMin - startMin + endMin) / totalMin) * 100;
    const nightWidth = 100 - dayWidth;

    return (
        <div className="space-y-1.5">
            <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-200">
                {/* Night left portion */}
                {dayStart > 0 && (
                    <div className="absolute inset-y-0 left-0 bg-indigo-200" style={{ width: `${dayStart}%` }}/>
                )}
                {/* Day portion */}
                <div
                    className="absolute inset-y-0 bg-amber-300"
                    style={{ left: `${dayStart}%`, width: `${Math.min(dayWidth, 100)}%` }}
                />
                {/* Night right portion (normal range only) */}
                {isNormal && nightWidth > 0 && (
                    <div className="absolute inset-y-0 bg-indigo-200"
                        style={{ left: `${dayStart + dayWidth}%`, width: `${nightWidth}%` }}/>
                )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
                <span>00:00</span>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-sm bg-amber-300"/>
                        Day ({to12h(start)}–{to12h(end)})
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-sm bg-indigo-200"/>
                        Night (auto)
                    </span>
                </div>
                <span>24:00</span>
            </div>
        </div>
    );
}

// ── Bank Modal ────────────────────────────────────────────────
function BankModal({ banks, onClose }) {
    const defaultBankForm = { bank_name: '', bank_code: '', is_active: true };
    const [showForm, setShowForm]         = useState(false);
    const [editingId, setEditingId]       = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);
    const [bankErrors, setBankErrors]     = useState({});
    const { data, setData, post, put, processing, reset } = useForm(defaultBankForm);

    const validate = () => { const errs = {}; if (!data.bank_name.trim()) errs.bank_name = 'Bank name is required.'; return errs; };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setBankErrors(errs); return; }
        setBankErrors({});
        if (editingId) {
            put(`/payroll/hr-policy/bank/${editingId}`, { preserveScroll: true, onSuccess: () => { reset(); setShowForm(false); setEditingId(null); }, onError: (e) => { if (e.bank_name) setBankErrors(p => ({...p, bank_name: e.bank_name})); } });
        } else {
            post('/payroll/hr-policy/bank', { preserveScroll: true, onSuccess: () => { reset(); setShowForm(false); }, onError: (e) => { if (e.bank_name) setBankErrors(p => ({...p, bank_name: e.bank_name})); } });
        }
    };

    const handleEdit = (bank) => { setBankErrors({}); setData({ bank_name: bank.bank_name, bank_code: bank.bank_code ?? '', is_active: !!bank.is_active }); setEditingId(bank.id); setShowForm(true); };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/hr-policy/bank/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => { setDeleting(false); setDeleteTarget(null); if (editingId === deleteTarget.id) { reset(); setBankErrors({}); setShowForm(false); setEditingId(null); } },
            onError: () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
                {deleteTarget && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl">
                        <div className="text-center px-8">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </div>
                            <h3 className="mt-3 text-sm font-bold text-gray-900">Delete "{deleteTarget.bank_name}"?</h3>
                            <p className="mt-1 text-xs text-gray-400">This action cannot be undone.</p>
                            <div className="mt-4 flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                                <button onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                                    {deleting ? <><Spinner/> Deleting...</> : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div><h3 className="text-base font-bold text-gray-900">Bank Management</h3><p className="text-xs text-gray-400">Register banks for salary payment</p></div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div className="max-h-96 overflow-y-auto px-6 py-4 space-y-4">
                    {banks?.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-400"><th className="px-4 py-2.5 text-left">Bank Name</th><th className="px-4 py-2.5 text-center">Code</th><th className="px-4 py-2.5 text-center">Status</th><th className="px-4 py-2.5 text-center">Actions</th></tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {banks.map(bank => (
                                        <tr key={bank.id} className="hover:bg-gray-50/60">
                                            <td className="px-4 py-2.5 font-semibold text-gray-800">{bank.bank_name}</td>
                                            <td className="px-4 py-2.5 text-center">{bank.bank_code ? <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-bold text-gray-600">{bank.bank_code}</span> : <span className="text-xs text-gray-300">—</span>}</td>
                                            <td className="px-4 py-2.5 text-center"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${bank.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{bank.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleEdit(bank)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-50"><EditIcon/> Edit</button>
                                                    <button onClick={() => setDeleteTarget(bank)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"><TrashIcon/> Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-center"><p className="text-sm font-medium text-gray-400">No banks registered yet</p></div>
                    )}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-800">{editingId ? '✏️ Edit Bank' : '+ Add Bank'}</p>
                                <button type="button" onClick={() => { reset(); setBankErrors({}); setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600"><CloseIcon/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Bank Name</label>
                                    <input type="text" value={data.bank_name} onChange={e => { setData('bank_name', e.target.value); setBankErrors(p => ({...p, bank_name: ''})); }} className={`input mt-1 ${bankErrors.bank_name ? 'border-red-400' : ''}`} placeholder="e.g. ABA Bank" disabled={processing}/>
                                    {bankErrors.bank_name && <ErrMsg msg={bankErrors.bank_name}/>}
                                </div>
                                <div>
                                    <label className="label">Code <span className="text-gray-400 text-xs">(optional)</span></label>
                                    <input type="text" value={data.bank_code} onChange={e => setData('bank_code', e.target.value.toUpperCase())} className="input mt-1 font-mono" placeholder="ABA" disabled={processing}/>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Toggle label="Active" checked={data.is_active} onChange={v => setData('is_active', v)} disabled={processing}/>
                                <div className="flex gap-2 ml-auto">
                                    <button type="submit" disabled={processing} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{processing ? <><Spinner/> Saving...</> : editingId ? 'Update' : 'Add Bank'}</button>
                                    <button type="button" onClick={() => { reset(); setBankErrors({}); setShowForm(false); setEditingId(null); }} disabled={processing} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
                <div className="border-t border-gray-100 px-6 py-4">
                    {!showForm && (
                        <button onClick={() => { setEditingId(null); reset(); setBankErrors({}); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-violet-300 px-4 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50 hover:border-violet-400">
                            <PlusIcon/> Add Bank
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────
// Convert "HH:MM" → "h:MM AM/PM"
function to12h(t) {
    if (!t) return '—';
    const [hStr, mStr] = t.substring(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${period}`;
}

function SavedCard({ label, value, sub }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-sm font-bold text-gray-800">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}
function ConfirmRow({ icon, label, value }) {
    return (
        <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50">
            <div className="flex items-center gap-2"><span className="text-base">{icon}</span><span className="text-sm text-gray-500">{label}</span></div>
            <span className="text-sm font-bold text-gray-800">{value}</span>
        </div>
    );
}
function ErrMsg({ msg }) {
    return <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500"><svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"/></svg>{msg}</p>;
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
const formatRate = (value) => {
    const num = parseFloat(value);
    return num % 1 === 0 ? num.toLocaleString() : num.toFixed(2);
};
function Spinner()   { return <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>; }
function PlusIcon()  { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>; }
function EditIcon()  { return <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>; }
function TrashIcon() { return <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>; }
function CloseIcon() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>; }
function CheckIcon() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>; }