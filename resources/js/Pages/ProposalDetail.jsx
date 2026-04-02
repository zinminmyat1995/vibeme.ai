// resources/js/Pages/ProposalDetail.jsx
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';

const LANGUAGES = [
    { value: 'english',    label: 'English',    flag: '🇬🇧' },
    { value: 'myanmar',    label: 'Myanmar',    flag: '🇲🇲' },
    { value: 'khmer',      label: 'Khmer',      flag: '🇰🇭' },
    { value: 'vietnamese', label: 'Vietnamese', flag: '🇻🇳' },
    { value: 'korean',     label: 'Korean',     flag: '🇰🇷' },
    { value: 'japanese',   label: 'Japanese',   flag: '🇯🇵' },
];

const STATUS_MAP = {
    draft:    { label: 'Draft',    color: '#6b7280', bg: '#f3f4f6' },
    sent:     { label: 'Sent',     color: '#2563eb', bg: '#dbeafe' },
    accepted: { label: 'Accepted', color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
};

const TEMPLATES = [
    { value: 'executive', label: 'Executive', desc: 'Dark Luxury'    },
    { value: 'magazine',  label: 'Magazine',  desc: 'Bold Editorial' },
    { value: 'minimal',   label: 'Minimal',   desc: 'Swiss Grid'     },
];

const PURPLE = {
    main:  '#7c3aed',
    light: '#ede9fe',
    border:'#c4b5fd',
    text:  '#5b21b6',
    grad:  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
};

export default function ProposalDetail({ proposal }) {
    const c        = proposal.content ?? {};
    const analysis = proposal.requirement_analysis ?? {};
    const client   = analysis.client ?? {};
    const lang     = LANGUAGES.find(l => l.value === proposal.language) ?? LANGUAGES[0];
    const status   = STATUS_MAP[proposal.status] ?? STATUS_MAP.draft;

    const [tpl, setTpl]           = useState(c.template ?? 'executive');
    const [updatingStatus, setUS] = useState(false);
    const [regenerating,  setReg] = useState(false);
    const [iframeKey, setIKey]    = useState(0);
    const [maximized, setMaximized] = useState(false);

    const previewUrl = `/proposals/${proposal.id}/preview/${tpl}`;
    const pdfUrl     = `/proposals/${proposal.id}/pdf/${tpl}`;

    const handleTpl = (val) => { setTpl(val); setIKey(k => k + 1); };

    const handleStatus = (s) => {
        setUS(true);
        router.patch(`/proposals/${proposal.id}/status`, { status: s }, {
            onFinish: () => setUS(false),
        });
    };

    const handleRegenerate = () => {
        setReg(true);
        router.post(`/proposals/${proposal.id}/regenerate`, {}, {
            onFinish: () => setReg(false),
        });
    };

    return (
        <AppLayout title="Proposal Detail">
            <style>{`
                @keyframes spin      { to { transform:rotate(360deg) } }
                @keyframes slideDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn    { from{opacity:0}to{opacity:1} }
            `}</style>

            {/* ── Maximized overlay ── */}
            {maximized && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9000,
                    background: '#1a1a2e',
                    display: 'flex', flexDirection: 'column',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {/* Overlay top bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 20px',
                        background: '#111827',
                        borderBottom: '1px solid #374151',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                            </div>
                            
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <a href={pdfUrl} target="_blank" style={{
                                padding: '7px 16px', borderRadius: 8, border: 'none',
                                background: PURPLE.grad, color: '#fff',
                                fontSize: 12, fontWeight: 700, textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
                            }}>📥 Download PDF</a>
                            {/* Minimize button */}
                            <button onClick={() => setMaximized(false)} style={{
                                padding: '7px 14px', borderRadius: 8,
                                border: '1px solid #374151',
                                background: '#1f2937', color: '#d1d5db',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                                Minimize
                            </button>
                        </div>
                    </div>
                    {/* Full iframe */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 0', background: '#e5e7eb' }}>
                        <iframe
                            key={`max-${iframeKey}`}
                            src={previewUrl}
                            style={{
                                width: '794px',
                                minHeight: '1123px',
                                border: 'none',
                                borderRadius: 8,
                                background: '#fff',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                                display: 'block',
                            }}
                            title="Proposal Preview Maximized"
                        />
                    </div>
                </div>
            )}

            {/* ── Unified Header Card ── */}
            <div style={{
                background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20,
                marginBottom: 16, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}>
                {/* Top row: back + info + actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: 12 }}>
                    {/* Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <a href="/proposals" style={{
                            width: 34, height: 34, borderRadius: 9, border: '1.5px solid #e5e7eb',
                            background: '#f9fafb', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#374151', textDecoration: 'none',
                            fontSize: 15, flexShrink: 0, transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = PURPLE.light; e.currentTarget.style.borderColor = PURPLE.border; e.currentTarget.style.color = PURPLE.main; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                        >←</a>

                        <div style={{ minWidth: 0 }}>
                            {/* Project title + status badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                <h1 style={{ fontSize: 15, fontWeight: 900, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
                                    {analysis.project_title}
                                </h1>
                                <span style={{
                                    fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 20,
                                    background: status.bg, color: status.color,
                                    textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0,
                                }}>{status.label}</span>
                            </div>
                            {/* Meta pills row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{
                                    fontFamily: 'monospace', background: '#f3f4f6',
                                    padding: '2px 8px', borderRadius: 5,
                                    fontSize: 10, fontWeight: 800, color: '#374151',
                                    letterSpacing: '0.3px',
                                }}>{c.proposal_number}</span>
                                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                                <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {lang.flag} <span style={{ fontWeight: 600 }}>{lang.label}</span>
                                </span>
                                {client.company_name && <>
                                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{client.company_name}</span>
                                </>}
                            </div>
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <select value={proposal.status} onChange={e => handleStatus(e.target.value)} disabled={updatingStatus}
                            style={{
                                padding: '8px 12px', borderRadius: 9,
                                border: '1.5px solid #e5e7eb', background: '#f9fafb',
                                color: '#374151', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', outline: 'none',
                            }}>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <button onClick={handleRegenerate} disabled={regenerating} style={{
                            padding: '8px 14px', borderRadius: 9,
                            border: `1.5px solid ${PURPLE.border}`,
                            background: PURPLE.light, color: PURPLE.text,
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'opacity 0.15s',
                        }}>
                            {regenerating
                                ? <span style={{ width: 12, height: 12, border: `2px solid ${PURPLE.border}`, borderTopColor: PURPLE.main, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                : '🔄'}
                            Regenerate
                        </button>

                        <a href={pdfUrl} target="_blank" style={{
                            padding: '8px 18px', borderRadius: 9, border: 'none',
                            background: PURPLE.grad, color: '#fff',
                            fontSize: 12, fontWeight: 800, textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                        }}>
                            📥 Download PDF
                        </a>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f3f4f6', margin: '0 20px' }} />

                {/* Template switcher row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0, marginRight: 4 }}>
                        Template
                    </span>
                    {TEMPLATES.map(t => {
                        const active = tpl === t.value;
                        return (
                            <button key={t.value} onClick={() => handleTpl(t.value)} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                                border: `1.5px solid ${active ? PURPLE.main : '#e5e7eb'}`,
                                background: active ? PURPLE.grad : '#f9fafb',
                                color: active ? '#fff' : '#6b7280',
                                fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                            }}>
                                {t.label}
                                {active && <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 500 }}>— {t.desc}</span>}
                            </button>
                        );
                    })}
                   
                </div>
            </div>

            {/* ── iframe Preview ── */}
            <div style={{ background: '#e5e7eb', borderRadius: 16, padding: 20 }}>
                {/* Browser chrome bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff', borderRadius: 10, padding: '8px 16px', marginBottom: 12,
                }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                    </div>
                    
                    {/* Maximize button */}
                    <button onClick={() => setMaximized(true)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 700, color: PURPLE.main,
                        padding: '4px 8px', borderRadius: 6,
                        transition: 'background 0.15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = PURPLE.light}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                        Maximize
                    </button>
                </div>

                {/* iframe — A4 fixed, centered */}
                <div style={{ overflowX: 'auto' }}>
                    <iframe
                        key={iframeKey}
                        src={previewUrl}
                        style={{
                            width: '794px', height: '1123px',
                            border: 'none', borderRadius: 8,
                            background: '#fff',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                            display: 'block', margin: '0 auto',
                        }}
                        title="Proposal Preview"
                    />
                </div>
            </div>

            {/* ── Action Footer ── */}
            <div style={{
                marginTop: 16,
                background: '#fff',
                border: `1.5px solid ${PURPLE.border}`,
                borderRadius: 16, padding: '20px 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
            }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#111827', marginBottom: 3 }}>
                        Ready to send this proposal?
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Valid for {c.validity_period}{client.email ? ` · ${client.email}` : ''}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleStatus('accepted')} style={{
                        padding: '10px 22px', borderRadius: 10, border: 'none',
                        background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}>✅ Mark Accepted</button>
                    <a href={pdfUrl} target="_blank" style={{
                        padding: '10px 22px', borderRadius: 10, border: 'none',
                        background: PURPLE.grad, color: '#fff',
                        fontSize: 13, fontWeight: 800, textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                    }}>📥 Download PDF</a>
                </div>
            </div>
        </AppLayout>
    );
}