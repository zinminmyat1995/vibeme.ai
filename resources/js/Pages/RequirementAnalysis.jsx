// resources/js/Pages/RequirementAnalysis.jsx
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage, router } from '@inertiajs/react';

// ── Complexity config ──────────────────────────────
const COMPLEXITY = {
    simple:     { label: 'Simple',     color: '#10b981', bg: '#d1fae5' },
    medium:     { label: 'Medium',     color: '#f59e0b', bg: '#fef3c7' },
    complex:    { label: 'Complex',    color: '#ef4444', bg: '#fee2e2' },
    enterprise: { label: 'Enterprise', color: '#8b5cf6', bg: '#ede9fe' },
};

const STATUS = {
    pending:   { label: 'Pending',   color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
    analyzing: { label: 'Analyzing', color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
    completed: { label: 'Completed', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
    failed:    { label: 'Failed',    color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
};

const PLATFORMS = ['web', 'mobile', 'both', 'desktop'];
const BUDGET_RANGES = ['< $5,000', '$5,000 – $15,000', '$15,000 – $50,000', '$50,000 – $100,000', '> $100,000'];
const COMMON_FEATURES = [
    'User Authentication', 'Dashboard & Analytics', 'Role & Permissions',
    'Notifications', 'File Upload', 'Payment Integration',
    'API Integration', 'Reporting & Export', 'Multi-language',
    'Mobile Responsive', 'Real-time Updates', 'Search & Filter',
];

// ── Toast ──────────────────────────────────────────
function Toast({ message, type, onClose }) {
    if (!message) return null;
    const ok = type !== 'error';
    return (
        <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 20px', borderRadius: 14,
            background: ok ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            animation: 'slideDown 0.3s ease',
            minWidth: 320,
        }}>
            <span style={{ fontSize: 20 }}>{ok ? '✅' : '❌'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: ok ? '#166534' : '#991b1b', flex: 1 }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>×</button>
        </div>
    );
}

// ── Status Badge ───────────────────────────────────
function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 99, background: s.bg, color: s.color,
            textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%', background: s.dot,
                ...(status === 'analyzing' ? { animation: 'pulse 1s infinite' } : {}),
            }} />
            {s.label}
        </span>
    );
}

// ── Complexity Badge ───────────────────────────────
function ComplexityBadge({ complexity }) {
    const c = COMPLEXITY[complexity];
    if (!c) return null;
    return (
        <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px',
            borderRadius: 6, background: c.bg, color: c.color,
            textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
            {c.label}
        </span>
    );
}

// ── Feasibility Ring ───────────────────────────────
function FeasibilityRing({ score }) {
    if (!score) return null;
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const r = 18, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
                <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                <text x="22" y="27" textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{score}</text>
            </svg>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Feasibility</span>
        </div>
    );
}

// ── Field Error ────────────────────────────────────
function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚠</span> {msg}
        </p>
    );
}

// ── New Requirement Modal ──────────────────────────
function NewRequirementModal({ onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [stepErrors, setStepErrors] = useState({});

    const form = useForm({
        company_name: '', contact_person: '', email: '', phone: '', industry: '',
        project_title: '', project_description: '', core_features: [],
        platform: 'web', expected_users: '', integration_needs: '',
        budget_range: '', expected_deadline: '', special_requirements: '',
    });

    const toggleFeature = (f) => {
        const arr = form.data.core_features;
        form.setData('core_features', arr.includes(f) ? arr.filter(x => x !== f) : [...arr, f]);
        // clear feature error when user selects one
        if (stepErrors.core_features) setStepErrors(e => ({ ...e, core_features: '' }));
    };

    // ── Validate per step ──────────────────────────
    const validateStep = (s) => {
        const errs = {};
        if (s === 1) {
            if (!form.data.company_name.trim())   errs.company_name   = 'Company name is required.';
            if (!form.data.contact_person.trim()) errs.contact_person = 'Contact person is required.';
            if (form.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.data.email))
                errs.email = 'Please enter a valid email address.';
        }
        if (s === 2) {
            if (!form.data.project_title.trim())       errs.project_title       = 'Project title is required.';
            if (!form.data.project_description.trim()) errs.project_description = 'Project description is required.';
            if (form.data.project_description.trim().length < 20)
                errs.project_description = 'Description must be at least 20 characters.';
            if (!form.data.budget_range)   errs.budget_range   = 'Please select a budget range.';
            if (!form.data.expected_deadline) errs.expected_deadline = 'Please set an expected deadline.';
        }
        if (s === 3) {
            if (form.data.core_features.length === 0)
                errs.core_features = 'Please select at least one core feature.';
        }
        return errs;
    };

    const handleNext = () => {
        const errs = validateStep(step);
        if (Object.keys(errs).length > 0) {
            setStepErrors(errs);
            return;
        }
        setStepErrors({});
        setStep(s => s + 1);
    };

    const submit = (e) => {
        e.preventDefault();
        const errs = validateStep(3);
        if (Object.keys(errs).length > 0) {
            setStepErrors(errs);
            return;
        }
        form.post('/requirement-analysis', {
            onSuccess: () => { onSuccess('Requirement submitted & AI analysis started! 🚀'); onClose(); },
        });
    };

    const inp = (field) => ({
        width: '100%', padding: '10px 13px', borderRadius: 10, fontSize: 13,
        border: `1.5px solid ${(stepErrors[field] || form.errors[field]) ? '#fca5a5' : '#e5e7eb'}`,
        background: '#fafafa', color: '#111827', outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit',
        transition: 'border-color 0.15s',
    });
    const lbl = { fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }} />
            <div style={{
                position: 'relative', background: '#fff', borderRadius: 24,
                boxShadow: '0 32px 80px rgba(0,0,0,0.2)', width: '100%', maxWidth: 640,
                maxHeight: '92vh', overflowY: 'auto', animation: 'popIn 0.25s ease',
            }}>
                {/* Modal Header */}
                <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>
                                New Requirement Analysis
                            </h2>
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>AI will analyze and provide insights automatically</p>
                        </div>
                        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: '#f3f4f6', cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800,
                                    background: step >= s ? '#111827' : '#f3f4f6',
                                    color: step >= s ? '#fff' : '#9ca3af',
                                    transition: 'all 0.2s',
                                }}>{s}</div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: step >= s ? '#111827' : '#9ca3af' }}>
                                    {s === 1 ? 'Client Info' : s === 2 ? 'Project Details' : 'Requirements'}
                                </span>
                                {s < 3 && <div style={{ width: 20, height: 1, background: step > s ? '#111827' : '#e5e7eb' }} />}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div style={{ padding: '24px 28px' }}>

                        {/* Step 1 — Client Info */}
                        {step === 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        value={form.data.company_name}
                                        onChange={e => { form.setData('company_name', e.target.value); setStepErrors(x => ({ ...x, company_name: '' })); }}
                                        placeholder="Acme Corporation" style={inp('company_name')}
                                    />
                                    <FieldError msg={stepErrors.company_name || form.errors.company_name} />
                                </div>
                                <div>
                                    <label style={lbl}>Contact Person <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        value={form.data.contact_person}
                                        onChange={e => { form.setData('contact_person', e.target.value); setStepErrors(x => ({ ...x, contact_person: '' })); }}
                                        placeholder="John Smith" style={inp('contact_person')}
                                    />
                                    <FieldError msg={stepErrors.contact_person || form.errors.contact_person} />
                                </div>
                                <div>
                                    <label style={lbl}>Industry</label>
                                    <input value={form.data.industry} onChange={e => form.setData('industry', e.target.value)} placeholder="e.g. Healthcare, Finance" style={inp('industry')} />
                                </div>
                                <div>
                                    <label style={lbl}>Email</label>
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={e => { form.setData('email', e.target.value); setStepErrors(x => ({ ...x, email: '' })); }}
                                        placeholder="john@company.com" style={inp('email')}
                                    />
                                    <FieldError msg={stepErrors.email || form.errors.email} />
                                </div>
                                <div>
                                    <label style={lbl}>Phone</label>
                                    <input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} placeholder="+1 234 567 8900" style={inp('phone')} />
                                </div>
                            </div>
                        )}

                        {/* Step 2 — Project Details */}
                        {step === 2 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Project Title <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        value={form.data.project_title}
                                        onChange={e => { form.setData('project_title', e.target.value); setStepErrors(x => ({ ...x, project_title: '' })); }}
                                        placeholder="e.g. Hospital Management System" style={inp('project_title')}
                                    />
                                    <FieldError msg={stepErrors.project_title || form.errors.project_title} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Project Description <span style={{ color: '#ef4444' }}>*</span></label>
                                    <textarea
                                        value={form.data.project_description}
                                        onChange={e => { form.setData('project_description', e.target.value); setStepErrors(x => ({ ...x, project_description: '' })); }}
                                        placeholder="Describe what the client needs in detail (min. 20 characters)..."
                                        rows={4}
                                        style={{ ...inp('project_description'), resize: 'vertical', lineHeight: 1.6 }}
                                    />
                                    <FieldError msg={stepErrors.project_description || form.errors.project_description} />
                                </div>
                                <div>
                                    <label style={lbl}>Platform <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select value={form.data.platform} onChange={e => form.setData('platform', e.target.value)} style={{ ...inp('platform'), cursor: 'pointer' }}>
                                        {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Expected Users</label>
                                    <input type="number" value={form.data.expected_users} onChange={e => form.setData('expected_users', e.target.value)} placeholder="e.g. 500" style={inp('expected_users')} />
                                </div>
                                <div>
                                    <label style={lbl}>Budget Range <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select
                                        value={form.data.budget_range}
                                        onChange={e => { form.setData('budget_range', e.target.value); setStepErrors(x => ({ ...x, budget_range: '' })); }}
                                        style={{ ...inp('budget_range'), cursor: 'pointer' }}
                                    >
                                        <option value="">Select budget...</option>
                                        {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <FieldError msg={stepErrors.budget_range || form.errors.budget_range} />
                                </div>
                                <div>
                                    <label style={lbl}>Expected Deadline <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={form.data.expected_deadline}
                                        onChange={e => { form.setData('expected_deadline', e.target.value); setStepErrors(x => ({ ...x, expected_deadline: '' })); }}
                                        style={inp('expected_deadline')}
                                    />
                                    <FieldError msg={stepErrors.expected_deadline || form.errors.expected_deadline} />
                                </div>
                            </div>
                        )}

                        {/* Step 3 — Requirements */}
                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={lbl}>Core Features <span style={{ color: '#ef4444' }}>*</span> <span style={{ fontSize: 10, color: '#9ca3af', textTransform: 'none', fontWeight: 500 }}>(select at least one)</span></label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                        {COMMON_FEATURES.map(f => {
                                            const selected = form.data.core_features.includes(f);
                                            return (
                                                <button key={f} type="button" onClick={() => toggleFeature(f)} style={{
                                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                    border: `1.5px solid ${selected ? '#111827' : stepErrors.core_features ? '#fca5a5' : '#e5e7eb'}`,
                                                    background: selected ? '#111827' : '#fff',
                                                    color: selected ? '#fff' : '#6b7280',
                                                    transition: 'all 0.15s',
                                                }}>
                                                    {selected && '✓ '}{f}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <FieldError msg={stepErrors.core_features} />
                                </div>
                                <div>
                                    <label style={lbl}>Integration Needs</label>
                                    <textarea value={form.data.integration_needs} onChange={e => form.setData('integration_needs', e.target.value)}
                                        placeholder="e.g. Integrate with existing ERP, payment gateway, SMS service..."
                                        rows={3} style={{ ...inp('integration_needs'), resize: 'vertical', lineHeight: 1.6 }} />
                                </div>
                                <div>
                                    <label style={lbl}>Special Requirements / Notes</label>
                                    <textarea value={form.data.special_requirements} onChange={e => form.setData('special_requirements', e.target.value)}
                                        placeholder="Any other specific requirements, constraints, or notes..."
                                        rows={3} style={{ ...inp('special_requirements'), resize: 'vertical', lineHeight: 1.6 }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button type="button" onClick={() => { if (step > 1) { setStep(s => s - 1); setStepErrors({}); } else onClose(); }}
                            style={{ padding: '10px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            {step === 1 ? 'Cancel' : '← Back'}
                        </button>
                        {step < 3 ? (
                            <button type="button" onClick={handleNext}
                                style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                Next →
                            </button>
                        ) : (
                            <button type="submit" disabled={form.processing}
                                style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: form.processing ? '#6b7280' : '#111827', color: '#fff', fontSize: 13, fontWeight: 700, cursor: form.processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {form.processing ? (
                                    <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Analyzing...</>
                                ) : '🚀 Submit & Analyze'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────
export default function RequirementAnalysis({ analyses = [], stats = {}, clients = [] }) {
    const { flash } = usePage().props;
    const [showNew, setShowNew] = useState(false);
    const [toast, setToast] = useState(flash?.success ? { msg: flash.success, type: 'success' } : null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    const filtered = analyses.filter(a => {
        const matchSearch = a.project_title?.toLowerCase().includes(search.toLowerCase()) ||
            a.client?.company_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus ? a.status === filterStatus : true;
        return matchSearch && matchStatus;
    });

    const handleDelete = (id) => {
        router.delete(`/requirement-analysis/${id}`, {
            onSuccess: () => { setToast({ msg: 'Deleted successfully', type: 'success' }); setDeleteId(null); },
        });
    };

    return (
        <AppLayout title="Requirement Analysis">
            <style>{`
                @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes popIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
                @keyframes spin { to { transform:rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
            `}</style>

            <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total', value: stats.total ?? 0, icon: '📋', color: '#111827', bg: '#f9fafb' },
                    { label: 'Pending', value: stats.pending ?? 0, icon: '⏳', color: '#d97706', bg: '#fffbeb' },
                    { label: 'Analyzing', value: stats.analyzing ?? 0, icon: '🤖', color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Completed', value: stats.completed ?? 0, icon: '✅', color: '#059669', bg: '#f0fdf4' },
                    { label: 'Failed', value: stats.failed ?? 0, icon: '❌', color: '#dc2626', bg: '#fef2f2' },
                ].map((s, i) => (
                    <div key={s.label} style={{
                        background: s.bg, border: `1px solid ${s.color}18`,
                        borderRadius: 14, padding: '16px 18px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
                    }}>
                        <div style={{ fontSize: 26 }}>{s.icon}</div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by project or client..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#374151', flex: 1 }} />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>}
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                    <option value="">All Status</option>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />
                <button onClick={() => setShowNew(true)} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                    background: '#111827', color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.15s',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
                    onMouseLeave={e => e.currentTarget.style.background = '#111827'}
                >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                    New Analysis
                </button>
            </div>

            {/* ── Table ── */}
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid #e5e7eb' }}>
                            {['Project', 'Client', 'Platform', 'Complexity', 'Feasibility', 'Status', 'Date', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: 64, textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No analyses yet</div>
                                    <div style={{ fontSize: 13, color: '#9ca3af' }}>Click "New Analysis" to get started</div>
                                </td>
                            </tr>
                        ) : filtered.map((a, i) => (
                            <tr key={a.id}
                                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.1s', animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '13px 16px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{a.project_title}</div>
                                    {a.ai_analysis?.estimated_duration && (
                                        <div style={{ fontSize: 11, color: '#9ca3af' }}>⏱ {a.ai_analysis.estimated_duration}</div>
                                    )}
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{a.client?.company_name}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{a.client?.industry}</div>
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', background: '#f3f4f6', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                                        {a.platform}
                                    </span>
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <ComplexityBadge complexity={a.ai_analysis?.project_complexity} />
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <FeasibilityRing score={a.ai_analysis?.feasibility_score} />
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <StatusBadge status={a.status} />
                                </td>
                                <td style={{ padding: '13px 16px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <a href={`/requirement-analysis/${a.id}`}
                                            style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                                            View →
                                        </a>
                                        {a.status === 'failed' && (
                                            <button onClick={() => router.post(`/requirement-analysis/${a.id}/reanalyze`)}
                                                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                                🔄
                                            </button>
                                        )}
                                        <button onClick={() => setDeleteId(a.id)}
                                            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── New Requirement Modal ── */}
            {showNew && <NewRequirementModal onClose={() => setShowNew(false)} onSuccess={(msg) => setToast({ msg, type: 'success' })} />}

            {/* ── Delete Confirm ── */}
            {deleteId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={() => setDeleteId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} />
                    <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Delete Analysis?</h3>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button onClick={() => setDeleteId(null)} style={{ padding: '9px 24px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}