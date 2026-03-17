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
    { value: 'executive', label: 'Executive', icon: '◆', accent: '#c9a84c', dark: '#0a0a0a', desc: 'Dark Luxury'    },
    { value: 'magazine',  label: 'Magazine',  icon: '▲', accent: '#ff4500', dark: '#111111', desc: 'Bold Editorial' },
    { value: 'minimal',   label: 'Minimal',   icon: '●', accent: '#00b4a0', dark: '#ffffff', desc: 'Swiss Grid'     },
];

export default function ProposalDetail({ proposal }) {
    const c        = proposal.content ?? {};
    const analysis = proposal.requirement_analysis ?? {};
    const client   = analysis.client ?? {};
    const lang     = LANGUAGES.find(l => l.value === proposal.language) ?? LANGUAGES[0];
    const status   = STATUS_MAP[proposal.status] ?? STATUS_MAP.draft;

    const [tpl, setTpl]           = useState(c.template ?? 'executive');
    const [updatingStatus, setUS] = useState(false);
    const [regenerating,  setReg] = useState(false);
    const [toast, setToast]       = useState(null);
    const [iframeKey, setIKey]    = useState(0);

    const currentTpl  = TEMPLATES.find(t => t.value === tpl) ?? TEMPLATES[0];
    const previewUrl  = `/proposals/${proposal.id}/preview/${tpl}`;
    const pdfUrl      = `/proposals/${proposal.id}/pdf/${tpl}`;
    const isLightBg   = tpl === 'minimal';

    const handleTpl = (val) => { setTpl(val); setIKey(k => k + 1); };

    const handleStatus = (s) => {
        setUS(true);
        router.patch(`/proposals/${proposal.id}/status`, { status: s }, {
            onSuccess: () => { setToast({ msg: `Status → ${s}`, ok: true }); setUS(false); },
            onError:   () => setUS(false),
        });
    };

    const handleRegenerate = () => {
        setReg(true);
        router.post(`/proposals/${proposal.id}/regenerate`, {}, {
            onSuccess: () => { setToast({ msg: 'Regenerated!', ok: true }); setReg(false); },
            onError:   () => setReg(false),
        });
    };

    return (
        <AppLayout title="Proposal Detail">
            <style>{`
                @keyframes spin      { to { transform:rotate(360deg) } }
                @keyframes slideDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position:'fixed', top:24, right:24, zIndex:9999,
                    display:'flex', alignItems:'center', gap:10,
                    padding:'12px 18px', borderRadius:12,
                    background: toast.ok ? '#f0fdf4' : '#fef2f2',
                    border:`1px solid ${toast.ok ? '#86efac' : '#fca5a5'}`,
                    boxShadow:'0 8px 24px rgba(0,0,0,0.1)',
                    animation:'slideDown 0.25s ease',
                }}>
                    <span>{toast.ok ? '✅' : '❌'}</span>
                    <span style={{fontSize:13, fontWeight:600, color: toast.ok ? '#166534' : '#991b1b', flex:1}}>{toast.msg}</span>
                    <button onClick={()=>setToast(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#9ca3af'}}>×</button>
                </div>
            )}

            {/* Top Bar */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, gap:12}}>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <a href="/proposals" style={{
                        width:36, height:36, borderRadius:10, border:'1.5px solid #e5e7eb',
                        background:'#fff', display:'flex', alignItems:'center',
                        justifyContent:'center', color:'#374151', textDecoration:'none', fontSize:16,
                    }}>←</a>
                    <div>
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                            <h1 style={{fontSize:17, fontWeight:900, color:'#111827', margin:0}}>{analysis.project_title}</h1>
                            <span style={{fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:8, background:status.bg, color:status.color}}>{status.label}</span>
                        </div>
                        <p style={{fontSize:12, color:'#9ca3af', margin:'3px 0 0'}}>
                            {c.proposal_number} · {lang.flag} {lang.label} · {client.company_name}
                        </p>
                    </div>
                </div>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <select value={proposal.status} onChange={e => handleStatus(e.target.value)} disabled={updatingStatus}
                        style={{padding:'8px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none'}}>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={handleRegenerate} disabled={regenerating} style={{
                        padding:'8px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
                        background:'#fff', color:'#374151', fontSize:12, fontWeight:700,
                        cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                    }}>
                        {regenerating
                            ? <span style={{width:12, height:12, border:'2px solid #ddd', borderTopColor:'#374151', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite'}} />
                            : '🔄'}
                        Regenerate
                    </button>
                    <a href={pdfUrl} target="_blank" style={{
                        padding:'8px 16px', borderRadius:10,
                        background: currentTpl.dark === '#ffffff' ? currentTpl.accent : currentTpl.dark,
                        border:`1.5px solid ${currentTpl.accent}`,
                        color: currentTpl.dark === '#ffffff' ? '#fff' : currentTpl.accent,
                        fontSize:12, fontWeight:800, textDecoration:'none',
                        display:'flex', alignItems:'center', gap:6,
                    }}>
                        📥 Download PDF
                    </a>
                </div>
            </div>

            {/* Template Switcher */}
            <div style={{
                display:'flex', gap:8, marginBottom:16,
                background:'#fff', border:'1.5px solid #e5e7eb',
                borderRadius:14, padding:'10px 16px', alignItems:'center',
            }}>
                <span style={{fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px', marginRight:4, flexShrink:0}}>
                    Template:
                </span>
                {TEMPLATES.map(t => {
                    const active = tpl === t.value;
                    return (
                        <button key={t.value} onClick={() => handleTpl(t.value)} style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'8px 18px', borderRadius:10, cursor:'pointer',
                            border:`1.5px solid ${active ? t.accent : '#e5e7eb'}`,
                            background: active ? (t.dark === '#ffffff' ? '#f8f8f8' : t.dark) : '#fff',
                            color: active ? t.accent : '#374151',
                            fontSize:12, fontWeight:800, transition:'all 0.15s',
                        }}>
                            <span>{t.icon}</span>
                            {t.label}
                            {active && <span style={{fontSize:10, opacity:0.7}}>— {t.desc}</span>}
                        </button>
                    );
                })}
                <span style={{marginLeft:'auto', fontSize:11, color:'#9ca3af', flexShrink:0}}>
                    Preview = PDF 100% တူ ✓
                </span>
            </div>

            {/* iframe Preview — Blade template directly */}
            <div style={{background:'#e5e7eb', borderRadius:16, padding:20}}>
                {/* Browser chrome bar */}
                <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'#fff', borderRadius:10, padding:'8px 16px', marginBottom:12,
                }}>
                    <div style={{display:'flex', gap:6}}>
                        <div style={{width:12, height:12, borderRadius:'50%', background:'#ff5f57'}} />
                        <div style={{width:12, height:12, borderRadius:'50%', background:'#febc2e'}} />
                        <div style={{width:12, height:12, borderRadius:'50%', background:'#28c840'}} />
                    </div>
                    <span style={{fontSize:11, color:'#9ca3af'}}>{previewUrl}</span>
                    <a href={previewUrl} target="_blank" style={{fontSize:11, color:currentTpl.accent, fontWeight:700, textDecoration:'none'}}>
                        ↗ New Tab
                    </a>
                </div>

                {/* iframe — A4 fixed size, centered */}
                <div style={{ overflowX:'auto' }}>
                    <iframe
                        key={iframeKey}
                        src={previewUrl}
                        style={{
                            width:'794px',
                            height:'1123px',
                            border:'none',
                            borderRadius:8,
                            background:'#fff',
                            boxShadow:'0 4px 24px rgba(0,0,0,0.15)',
                            display:'block',
                            margin:'0 auto',
                        }}
                        title="Proposal Preview"
                    />
                </div>
            </div>

            {/* Action Footer */}
            <div style={{
                marginTop:16,
                background: isLightBg ? '#f9fafb' : '#111827',
                border:`1.5px solid ${currentTpl.accent}33`,
                borderRadius:16, padding:'22px 30px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
                <div>
                    <div style={{fontSize:14, fontWeight:900, color: isLightBg ? '#111827' : '#fff', marginBottom:3}}>
                        Ready to send this proposal?
                    </div>
                    <div style={{fontSize:12, color: isLightBg ? '#6b7280' : '#888'}}>
                        Valid for {c.validity_period} · {client.email}
                    </div>
                </div>
                <div style={{display:'flex', gap:10}}>
                    <button onClick={() => handleStatus('accepted')} style={{
                        padding:'10px 22px', borderRadius:10, border:'none',
                        background:'#10b981', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer',
                    }}>✅ Accept</button>
                    <a href={pdfUrl} target="_blank" style={{
                        padding:'10px 22px', borderRadius:10,
                        background:currentTpl.accent, border:'none',
                        color: isLightBg ? '#fff' : (tpl === 'executive' ? '#000' : '#fff'),
                        fontSize:13, fontWeight:800, textDecoration:'none',
                        display:'inline-flex', alignItems:'center', gap:6,
                    }}>📥 Download PDF</a>
                </div>
            </div>
        </AppLayout>
    );
}