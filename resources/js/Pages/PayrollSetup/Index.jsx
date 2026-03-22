import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import LeavePolicySection from './Partials/LeavePolicySection';
import OvertimePolicySection from './Partials/OvertimePolicySection';
import CurrencySection from './Partials/CurrencySection';
import DeductionSection from './Partials/DeductionSection';
import AllowanceSection from './Partials/AllowanceSection';
import SalaryRuleSection from './Partials/SalaryRuleSection';
import BonusSection from './Partials/BonusSection';
import PublicHolidaySection from './Partials/PublicHolidaySection';

const SECTIONS = [
    {
        key: 'leave',
        label: 'Leave Policy',
        summary: 'Leave types · Paid/Unpaid · Carry over',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01"/>
            </svg>
        ),
    },
    {
        key: 'overtime',
        label: 'Overtime Policy',
        summary: 'Weekday · Weekend · Holiday rates',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
        ),
    },
    {
        key: 'currency',
        label: 'Currency Setup',
        summary: 'Code · Symbol · Decimal format',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M14.31 8a4 4 0 0 0-4.62 0C8.31 8.89 8 10.35 8 12s.31 3.11 1.69 4a4 4 0 0 0 4.62 0"/>
                <line x1="12" y1="6" x2="12" y2="8"/>
                <line x1="12" y1="16" x2="12" y2="18"/>
            </svg>
        ),
    },
    {
        key: 'deduction',
        label: 'Deduction Rules',
        summary: 'Tax · Social security · Dynamic rows',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
        ),
    },
    {
        key: 'allowance',
        label: 'Allowance',
        summary: 'Housing · Transport · Meal · Custom',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        ),
    },
    {
        key: 'bonus',
        label: 'Bonus',
        summary: 'Bonus types · Schedules · Pay when',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        ),
    },
    {
        key: 'holiday',
        label: 'Public Holidays',
        summary: 'National · Recurring · Year filter',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
        ),
    },
    {
        key: 'salary',
        label: 'General Payroll Settings',
        summary: 'Pay cycle · Probation · Bank export',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
            </svg>
        ),
    },
];

export default function Index({
    leavePolicies,
    overtimePolicies,
    currencies,
    deductions,
    allowances,
    salaryRule,
    country,
    bonusTypes,
    bonusSchedules,
    banks,
    completedSections,
    publicHolidays
}) {
    const [activeKey, setActiveKey] = useState(null);

    const [completed, setCompleted] = useState(() => {
        const set = new Set();
        Object.entries(completedSections).forEach(([key, isDone]) => {
            if (isDone) set.add(key);
        });
        return set;
    });

    // Inertia reload တိုင်း completedSections နဲ့ sync
    useEffect(() => {
        const set = new Set();
        Object.entries(completedSections).forEach(([key, isDone]) => {
            if (isDone) set.add(key);
        });
        setCompleted(set);
    }, [completedSections]);

    const activeSection = SECTIONS.find(s => s.key === activeKey);

    const handleSelect = (key) => {
        setActiveKey(prev => prev === key ? null : key);
    };

    const sectionContent = {
        leave:     <LeavePolicySection leavePolicies={leavePolicies} />,
        overtime:  <OvertimePolicySection overtimePolicies={overtimePolicies} />,
        currency:  <CurrencySection currencies={currencies} />,
        deduction: <DeductionSection deductions={deductions} />,
        allowance: <AllowanceSection allowances={allowances} />,
        bonus:     <BonusSection bonusTypes={bonusTypes} bonusSchedules={bonusSchedules} />,
        holiday: <PublicHolidaySection publicHolidays={publicHolidays} />,
        salary:    <SalaryRuleSection salaryRule={salaryRule} banks={banks} currencies={currencies} bonusTypes={bonusTypes} bonusSchedules={bonusSchedules}/>,
    };

    return (
        <AppLayout title="HR Policy Setup">
            <Head title="HR Policy Setup" />

            <div className="min-h-screen bg-gray-50/60">

                {/* ── Page Header ── */}
                <div className="px-8 pt-6 pb-2">
                    <div className="mx-auto max-w-5xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-extrabold tracking-tight text-gray-800">
                                    {activeSection ? activeSection.label : 'Configure HR Policies'}
                                </h1>
                                <p className="mt-0.5 text-sm text-gray-400">
                                    {activeSection ? activeSection.summary : 'Set up leave, overtime, payroll rules and more'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Progress */}
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">
                                        {completed.size} of {SECTIONS.length} completed
                                    </p>
                                    <div className="mt-1 flex items-center gap-1">
                                        {SECTIONS.map(s => (
                                            <div key={s.key} className={`h-1 w-6 rounded-full transition-all ${
                                                completed.has(s.key)
                                                    ? 'bg-green-400'
                                                    : s.key === activeKey
                                                    ? 'bg-violet-500'
                                                    : 'bg-gray-200'
                                            }`}/>
                                        ))}
                                    </div>
                                </div>

                                {/* Country pill */}
                                {country && (
                                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                                        <span className="flex h-2 w-2 rounded-full bg-green-400 ring-2 ring-green-100"/>
                                        <div>
                                            <p className="text-xs text-gray-400 leading-none">Country</p>
                                            <p className="mt-0.5 text-sm font-bold text-gray-800 leading-none">{country.name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Step tabs ── */}
                <div className="px-8 py-4">
                    <div className="mx-auto max-w-5xl">
                        <div className="flex items-center justify-center">
                            {SECTIONS.map((section, idx) => {
                                const isActive = activeKey === section.key;
                                const isDone   = completed.has(section.key);
                                return (
                                    <div key={section.key} className="flex items-center">
                                        <button
                                            onClick={() => handleSelect(section.key)}
                                            className="flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                                                isDone
                                                    ? 'border-green-500 bg-green-500 text-white'
                                                    : isActive
                                                    ? 'border-violet-600 bg-violet-600 text-white'
                                                    : 'border-gray-300 bg-white text-gray-400'
                                            }`}>
                                                {isDone
                                                    ? <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                                    : idx + 1
                                                }
                                            </span>
                                            <span className={`text-xs font-semibold transition-colors ${
                                                isDone   ? 'text-green-600'  :
                                                isActive ? 'text-violet-700' :
                                                           'text-gray-400'
                                            }`}>
                                                {section.label}
                                            </span>
                                        </button>
                                        {idx < SECTIONS.length - 1 && (
                                            <div className={`mx-3 h-px w-8 flex-shrink-0 rounded-full transition-all ${
                                                isDone ? 'bg-green-300' : 'bg-gray-200'
                                            }`}/>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="mx-auto max-w-6xl px-8 py-8">

                    {/* Overview grid */}
                    {!activeKey && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {SECTIONS.map((section) => {
                                const isDone = completed.has(section.key);
                                return (
                                    <button
                                        key={section.key}
                                        onClick={() => handleSelect(section.key)}
                                        className="group flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
                                    >
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                                            isDone
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-400 group-hover:bg-violet-100 group-hover:text-violet-600'
                                        }`}>
                                            {isDone
                                                ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                                : <span className="h-5 w-5">{section.icon}</span>
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                                            <p className="mt-0.5 text-xs text-gray-400">{section.summary}</p>
                                        </div>
                                        {isDone && (
                                            <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                                                Saved ✓
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Active section */}
                    {activeKey && (
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                            {/* Section header */}
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                        <span className="h-5 w-5">{activeSection?.icon}</span>
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-900">{activeSection?.label}</h2>
                                        <p className="text-xs text-gray-400">{activeSection?.summary}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveKey(null)}
                                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                                    </svg>
                                    Overview
                                </button>
                            </div>

                            {/* Section content */}
                            <div className="px-6 py-6">
                                {sectionContent[activeKey]}
                            </div>

                            {/* Footer nav */}
                            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-3 rounded-b-2xl">
                                <span className="text-xs text-gray-400">
                                    Step {SECTIONS.findIndex(s => s.key === activeKey) + 1} of {SECTIONS.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    {SECTIONS.map(s => (
                                        <button
                                            key={s.key}
                                            onClick={() => setActiveKey(s.key)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                s.key === activeKey
                                                    ? 'w-6 bg-violet-600'
                                                    : completed.has(s.key)
                                                    ? 'w-1.5 bg-green-400'
                                                    : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}