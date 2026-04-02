// resources/js/Pages/ProposalGenerator.jsx
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage, router } from '@inertiajs/react';

const STATUS_MAP = {
    draft:    { label: 'Draft',    color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
    sent:     { label: 'Sent',     color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
    accepted: { label: 'Accepted', color: '#059669', bg: '#d1fae5', dot: '#10b981' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
};

const PURPLE = {
    main:  '#7c3aed',
    hover: '#6d28d9',
    light: '#ede9fe',
    border:'#c4b5fd',
    text:  '#5b21b6',
    grad:  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
};

const FLAGS = {
    english: (
        <svg width="20" height="14" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="10"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6"/></svg>
    ),
    myanmar: (
        <svg width="20" height="14" viewBox="0 0 30 20"><rect width="30" height="6.67" fill="#FECB00"/><rect y="6.67" width="30" height="6.67" fill="#34B233"/><rect y="13.33" width="30" height="6.67" fill="#EA2839"/><polygon points="15,2 16.76,7.42 22.47,7.42 17.86,10.73 19.61,16.16 15,12.84 10.39,16.16 12.14,10.73 7.53,7.42 13.24,7.42" fill="#fff"/></svg>
    ),
    khmer: (
        <svg width="20" height="14" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"><rect width="900" height="600" fill="#032EA1"/><rect width="900" height="300" y="150" fill="#E00025"/><g fill="white"><rect x="375" y="215" width="150" height="170"/><rect x="363" y="195" width="40" height="25"/><rect x="430" y="175" width="40" height="45"/><rect x="497" y="195" width="40" height="25"/><rect x="330" y="235" width="48" height="150"/><rect x="522" y="235" width="48" height="150"/></g></svg>
    ),
    vietnamese: (
        <svg width="20" height="14" viewBox="0 0 30 20"><rect width="30" height="20" fill="#DA251D"/><polygon points="15,4 16.47,8.91 21.63,8.91 17.58,11.82 19.05,16.73 15,13.82 10.95,16.73 12.42,11.82 8.37,8.91 13.53,8.91" fill="#FFFF00"/></svg>
    ),
    korean: (
        <svg width="20" height="14" viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="4.5" fill="#C60C30"/><path d="M15,5.5 A4.5,4.5 0 0,1 15,14.5" fill="#003478"/></svg>
    ),
    japanese: (
        <svg width="20" height="14" viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5.5" fill="#BC002D"/></svg>
    ),
};

const LANGUAGES = [
    { value: 'english',    label: 'English'    },
    { value: 'myanmar',    label: 'Myanmar'    },
    { value: 'khmer',      label: 'Khmer'      },
    { value: 'vietnamese', label: 'Vietnamese' },
    { value: 'korean',     label: 'Korean'     },
    { value: 'japanese',   label: 'Japanese'   },
];

const TEMPLATES = [
    { value: 'executive', label: 'Executive', desc: 'Dark Luxury'    },
    { value: 'magazine',  label: 'Magazine',  desc: 'Bold Editorial' },
    { value: 'minimal',   label: 'Minimal',   desc: 'Swiss Grid'     },
];

function StatusBadge({ status }) {
    const s = STATUS_MAP[status] || STATUS_MAP.draft;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 99, background: s.bg, color: s.color,
            textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
            {s.label}
        </span>
    );
}

function GenerateModal({ analyses, onClose, onSuccess }) {
    const [errors, setErrors] = useState({});
    const form = useForm({
        requirement_analysis_id: '',
        language: 'english',
        template: 'executive',
    });

    const validate = () => {
        const e = {};
        if (!form.data.requirement_analysis_id) e.requirement_analysis_id = 'Please select a project.';
        return e;
    };

    const submit = (e) => {
        e.preventDefault();
        const e2 = validate();
        if (Object.keys(e2).length) { setErrors(e2); return; }
        form.post('/proposals', {
            onSuccess: () => { onSuccess('Proposal generated! 🎉'); onClose(); },
        });
    };

    const inp = (field) => ({
        width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
        border: `1.5px solid ${errors[field] ? '#fca5a5' : '#e5e7eb'}`,
        background: '#f8f7ff', color: '#111827', outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer',
    });

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }} />
            <div style={{
                position: 'relative', background: '#fff', borderRadius: 24,
                boxShadow: '0 32px 80px rgba(124,58,237,0.18)', width: '100%', maxWidth: 520,
                animation: 'popIn 0.25s ease', overflow: 'hidden',
            }}>
                {/* Purple Header */}
                <div style={{ background: PURPLE.grad, padding: '24px 28px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, marginBottom: 12,
                            }}>📄</div>
                            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>Generate Proposal</h2>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>Select a project and language to generate</p>
                        </div>
                        <button onClick={onClose} style={{
                            width: 32, height: 32, borderRadius: 10, border: 'none',
                            background: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                            fontSize: 18, color: '#fff', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>×</button>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Project Select */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Select Project <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={form.data.requirement_analysis_id}
                                onChange={e => { form.setData('requirement_analysis_id', e.target.value); setErrors(x => ({ ...x, requirement_analysis_id: '' })); }}
                                style={inp('requirement_analysis_id')}
                            >
                                <option value="">Choose a completed analysis...</option>
                                {analyses.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.project_title} — {a.client?.company_name}
                                    </option>
                                ))}
                            </select>
                            {errors.requirement_analysis_id && (
                                <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠ {errors.requirement_analysis_id}</p>
                            )}
                            {analyses.length === 0 && (
                                <p style={{ color: '#f59e0b', fontSize: 11, marginTop: 4 }}>⚠ No completed analyses found.</p>
                            )}
                        </div>

                        {/* Language */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Proposal Language
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                {LANGUAGES.map(l => {
                                    const selected = form.data.language === l.value;
                                    return (
                                        <button key={l.value} type="button"
                                            onClick={() => form.setData('language', l.value)}
                                            style={{
                                                padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                                                border: `1.5px solid ${selected ? PURPLE.main : '#e5e7eb'}`,
                                                background: selected ? PURPLE.grad : '#fff',
                                                color: selected ? '#fff' : '#374151',
                                                fontSize: 12, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                transition: 'all 0.15s',
                                            }}>
                                            <span style={{ display: 'flex', alignItems: 'center', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                                                {FLAGS[l.value]}
                                            </span>
                                            {l.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Template */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Template Style
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {TEMPLATES.map(t => {
                                    const selected = form.data.template === t.value;
                                    return (
                                        <button key={t.value} type="button"
                                            onClick={() => form.setData('template', t.value)}
                                            style={{
                                                flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                                                border: `1.5px solid ${selected ? PURPLE.main : '#e5e7eb'}`,
                                                background: selected ? PURPLE.grad : '#fff',
                                                color: selected ? '#fff' : '#374151',
                                                textAlign: 'center', transition: 'all 0.15s',
                                            }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
                                            <div style={{ fontSize: 10, opacity: selected ? 0.85 : 0.6 }}>{t.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '0 28px 24px', borderTop: '1px solid #f3f4f6', paddingTop: 16, background: '#fafafa', display: 'flex', justifyContent: 'space-between' }}>
                        <button type="button" onClick={onClose}
                            style={{ padding: '10px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={form.processing}
                            style={{
                                padding: '10px 28px', borderRadius: 10, border: 'none',
                                background: form.processing ? '#9ca3af' : PURPLE.grad,
                                color: '#fff', fontSize: 13, fontWeight: 700,
                                cursor: form.processing ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8,
                                boxShadow: form.processing ? 'none' : '0 4px 14px rgba(124,58,237,0.35)',
                            }}>
                            {form.processing
                                ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Generating...</>
                                : '✨ Generate Proposal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProposalGenerator({ proposals = [], analyses = [], stats = {} }) {
    const { flash } = usePage().props;
    const [showGenerate, setShowGenerate] = useState(false);
    // ── global flash toast only, no local toast ──
    const [toast, setToast] = useState(flash?.success ? { msg: flash.success, type: 'success' } : null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    const filtered = proposals.filter(p => {
        const matchSearch =
            p.content?.proposal_number?.toLowerCase().includes(search.toLowerCase()) ||
            p.requirement_analysis?.project_title?.toLowerCase().includes(search.toLowerCase()) ||
            p.requirement_analysis?.client?.company_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus ? p.status === filterStatus : true;
        return matchSearch && matchStatus;
    });

    const handleDelete = (id) => {
        router.delete(`/proposals/${id}`, {
            onSuccess: () => { setToast({ msg: 'Deleted!', type: 'success' }); setDeleteId(null); },
        });
    };

    return (
        <AppLayout title="Proposal Generator">
            <style>{`
                @keyframes slideDown { from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)} }
                @keyframes popIn    { from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)} }
                @keyframes spin     { to{transform:rotate(360deg)} }
                @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* Toast — flash/global only */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 24, right: 24, zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
                    borderRadius: 14,
                    background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', animation: 'slideDown 0.3s ease', minWidth: 300,
                }}>
                    <span style={{ fontSize: 18 }}>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: toast.type === 'success' ? '#166534' : '#991b1b', flex: 1 }}>{toast.msg}</span>
                    <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>×</button>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total',    value: stats.total    ?? 0, icon: '📄', color: '#111827', bg: '#f9fafb' },
                    { label: 'Draft',    value: stats.draft    ?? 0, icon: '✏️',  color: '#6b7280', bg: '#f3f4f6' },
                    { label: 'Sent',     value: stats.sent     ?? 0, icon: '📨', color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Accepted', value: stats.accepted ?? 0, icon: '✅', color: '#059669', bg: '#f0fdf4' },
                    { label: 'Rejected', value: stats.rejected ?? 0, icon: '❌', color: '#dc2626', bg: '#fef2f2' },
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

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search proposals..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#374151', flex: 1 }} />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>}
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                    <option value="">All Status</option>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />
                {/* Generate Proposal → purple */}
                <button onClick={() => setShowGenerate(true)} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                    background: PURPLE.grad, color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.35)', transition: 'opacity 0.15s',
                }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <span style={{ fontSize: 14 }}>✨</span> Generate Proposal
                </button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid #e5e7eb' }}>
                            {['Proposal #', 'Project', 'Client', 'Language', 'Status', 'Date', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: 64, textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No proposals yet</div>
                                    <div style={{ fontSize: 13, color: '#9ca3af' }}>Click "Generate Proposal" to create one</div>
                                </td>
                            </tr>
                        ) : filtered.map((p, i) => {
                            const lang = LANGUAGES.find(l => l.value === p.language);
                            return (
                                <tr key={p.id}
                                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.1s', animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#111827', fontFamily: 'monospace', background: '#f3f4f6', padding: '3px 8px', borderRadius: 6 }}>
                                            {p.content?.proposal_number ?? '—'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{p.requirement_analysis?.project_title}</div>
                                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.content?.total_investment}</div>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.requirement_analysis?.client?.company_name}</div>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#374151' }}>
                                            <span style={{ display: 'flex', borderRadius: 3, overflow: 'hidden' }}>{FLAGS[p.language]}</span>
                                            {lang?.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <StatusBadge status={p.status} />
                                    </td>
                                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                        {new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <a href={`/proposals/${p.id}`}
                                                style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                                                View →
                                            </a>
                                            <button onClick={() => setDeleteId(p.id)}
                                                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
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

            {showGenerate && (
                <GenerateModal
                    analyses={analyses}
                    onClose={() => setShowGenerate(false)}
                    onSuccess={msg => setToast({ msg, type: 'success' })}
                />
            )}

            {deleteId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={() => setDeleteId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} />
                    <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Delete Proposal?</h3>
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