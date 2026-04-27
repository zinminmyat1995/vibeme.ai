// resources/js/Pages/Surveys/Index.jsx
import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark'
            || localStorage.getItem('vibeme-theme') === 'dark';
    };
    const [dark, setDark] = useState(getDark);
    useEffect(() => {
        const sync = () => setDark(getDark());
        window.addEventListener('vibeme-theme-change', sync);
        window.addEventListener('storage', sync);
        return () => { window.removeEventListener('vibeme-theme-change', sync); window.removeEventListener('storage', sync); };
    }, []);
    return dark;
}

function getTheme(dark) {
    if (dark) return {
        panelSolid:'#0f1b34', panelSoft:'rgba(255,255,255,0.04)',
        border:'rgba(148,163,184,0.13)', text:'#f8fafc', textSoft:'#cbd5e1',
        textMute:'#64748b', overlay:'rgba(2,8,23,0.78)',
        shadow:'0 24px 60px rgba(0,0,0,0.38)', shadowSoft:'0 4px 16px rgba(0,0,0,0.22)',
        primary:'#8b5cf6', primarySoft:'rgba(139,92,246,0.16)',
        success:'#10b981', successSoft:'rgba(16,185,129,0.16)',
        danger:'#f87171', dangerSoft:'rgba(248,113,113,0.16)',
        warning:'#f59e0b', warningSoft:'rgba(245,158,11,0.16)',
        rowHover:'rgba(255,255,255,0.03)',
    };
    return {
        panelSolid:'#ffffff', panelSoft:'#f8fafc',
        border:'rgba(15,23,42,0.08)', text:'#0f172a', textSoft:'#475569',
        textMute:'#94a3b8', overlay:'rgba(15,23,42,0.42)',
        shadow:'0 20px 50px rgba(15,23,42,0.14)', shadowSoft:'0 2px 8px rgba(15,23,42,0.06)',
        primary:'#7c3aed', primarySoft:'#f3e8ff',
        success:'#059669', successSoft:'#ecfdf5',
        danger:'#ef4444', dangerSoft:'#fee2e2',
        warning:'#d97706', warningSoft:'#fef3c7',
        rowHover:'#fafbff',
    };
}

const STATUS_CFG = {
    draft:  { label:'Draft',  color:'#6b7280', bg:'#f3f4f6', bgDark:'rgba(107,114,128,0.16)', dot:'#9ca3af' },
    active: { label:'Active', color:'#059669', bg:'#d1fae5', bgDark:'rgba(5,150,105,0.16)',   dot:'#10b981' },
    closed: { label:'Closed', color:'#dc2626', bg:'#fee2e2', bgDark:'rgba(220,38,38,0.16)',   dot:'#ef4444' },
};

function StatusBadge({ status, dark }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
    return (
        <span style={{
            display:'inline-flex', alignItems:'center', gap:5,
            fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99,
            background: dark ? cfg.bgDark : cfg.bg, color: cfg.color,
        }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot }}/>
            {cfg.label}
        </span>
    );
}

function CopyLinkButton({ url, dark, theme }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button onClick={handleCopy} title="Copy survey link" style={{
            display:'flex', alignItems:'center', gap:5,
            padding:'5px 10px', borderRadius:8, fontSize:11, fontWeight:600,
            border:`1px solid ${theme.border}`,
            background: copied ? (dark?'rgba(16,185,129,0.15)':'#d1fae5') : (dark?'rgba(255,255,255,0.06)':'#f8fafc'),
            color: copied ? '#059669' : theme.textSoft,
            cursor:'pointer', transition:'all .15s', fontFamily:'inherit',
        }}>
            {copied ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
            {copied ? 'Copied!' : 'Copy Link'}
        </button>
    );
}

function SurveyRow({ survey, dark, theme, onDelete, isLast }) {
    const [delConfirm, setDelConfirm] = useState(false);

    return (
        <div style={{
            display:'flex', alignItems:'stretch',
            borderBottom: isLast ? 'none' : `1px solid ${theme.border}`,
            transition:'background .15s',
        }}
        onMouseEnter={e=>e.currentTarget.style.background=theme.rowHover}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {/* Left accent */}
            <div style={{
                width:3, flexShrink:0,
                background: survey.status === 'active' ? '#10b981' : survey.status === 'closed' ? '#ef4444' : '#9ca3af',
            }}/>

            <div style={{ flex:1, padding:'14px 18px', minWidth:0 }}>
                {/* Row 1 */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:theme.text }}>{survey.title}</span>
                            <StatusBadge status={survey.status} dark={dark}/>
                            {survey.is_anonymous && (
                                <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:99, background:dark?'rgba(99,102,241,0.15)':'#e0e7ff', color:'#4f46e5' }}>
                                    🔒 Anonymous
                                </span>
                            )}
                        </div>
                        {survey.description && (
                            <div style={{ fontSize:12, color:theme.textMute, marginBottom:6 }}>{survey.description}</div>
                        )}
                        {/* Meta row */}
                        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                            <span style={{ display:'inline-flex', alignItems:'baseline', gap:4 }}>
                                <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.05em', color:theme.textMute }}>Questions</span>
                                <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>{survey.question_count}</span>
                            </span>
                            <span style={{ display:'inline-flex', alignItems:'baseline', gap:4 }}>
                                <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.05em', color:theme.textMute }}>Responses</span>
                                <span style={{ fontSize:12, fontWeight:700, color:theme.primary }}>{survey.response_count}</span>
                            </span>
                            {survey.closes_at && (
                                <span style={{ display:'inline-flex', alignItems:'baseline', gap:4 }}>
                                    <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.05em', color:theme.textMute }}>Closes</span>
                                    <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>{survey.closes_at}</span>
                                </span>
                            )}
                            <span style={{ fontSize:11, color:theme.textMute }}>by {survey.created_by} · {survey.created_at}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:'wrap' }}>
                        <CopyLinkButton url={survey.public_url} dark={dark} theme={theme}/>

                        {survey.response_count > 0 && (
                            <button onClick={()=>router.visit(`/hr/surveys/${survey.id}/results`)} style={{
                                display:'flex', alignItems:'center', gap:5,
                                padding:'5px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                                border:`1px solid ${dark?'rgba(139,92,246,0.3)':'#ddd6fe'}`,
                                background: dark?'rgba(139,92,246,0.12)':'#f3e8ff',
                                color:theme.primary, cursor:'pointer', fontFamily:'inherit',
                            }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                Results
                            </button>
                        )}

                        {survey.status !== 'closed' && (
                            <button onClick={()=>router.patch(`/hr/surveys/${survey.id}/toggle`)} style={{
                                display:'flex', alignItems:'center', gap:5,
                                padding:'5px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                                border:`1px solid ${survey.status==='draft'?(dark?'rgba(5,150,105,0.3)':'#6ee7b7'):(dark?'rgba(239,68,68,0.3)':'#fca5a5')}`,
                                background: survey.status==='draft'?(dark?'rgba(5,150,105,0.12)':'#d1fae5'):(dark?'rgba(239,68,68,0.12)':'#fee2e2'),
                                color: survey.status==='draft'?'#059669':'#dc2626',
                                cursor:'pointer', fontFamily:'inherit',
                            }}>
                                {survey.status === 'draft' ? '▶ Activate' : '■ Close'}
                            </button>
                        )}

                        <button onClick={()=>router.visit(`/hr/surveys/${survey.id}/edit`)} style={{
                            width:30, height:30, borderRadius:8, border:'none',
                            background:'transparent', cursor:'pointer', color:theme.textMute,
                            display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
                        }}
                        onMouseEnter={e=>{ e.currentTarget.style.background=dark?'rgba(255,255,255,0.08)':'#f1f5f9'; e.currentTarget.style.color=theme.text; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=theme.textMute; }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>

                        {!delConfirm ? (
                            <button onClick={()=>setDelConfirm(true)} style={{
                                width:30, height:30, borderRadius:8, border:'none',
                                background:'transparent', cursor:'pointer',
                                color: dark?'rgba(248,113,113,0.4)':'#fca5a5',
                                display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
                            }}
                            onMouseEnter={e=>{ e.currentTarget.style.background=dark?'rgba(248,113,113,0.12)':'#fee2e2'; e.currentTarget.style.color=dark?'#f87171':'#dc2626'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=dark?'rgba(248,113,113,0.4)':'#fca5a5'; }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                            </button>
                        ) : (
                            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                                <button onClick={()=>{ onDelete(survey.id); setDelConfirm(false); }} style={{
                                    padding:'4px 10px', borderRadius:8, border:'none', fontSize:11, fontWeight:700,
                                    background:'#ef4444', color:'#fff', cursor:'pointer',
                                }}>Delete</button>
                                <button onClick={()=>setDelConfirm(false)} style={{
                                    padding:'4px 8px', borderRadius:8, border:`1px solid ${theme.border}`,
                                    fontSize:11, fontWeight:600, background:'transparent',
                                    color:theme.textMute, cursor:'pointer',
                                }}>Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SurveysIndex({ surveys = [], stats = {} }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);
    const [tab, setTab] = useState('all');

    const handleDelete = (id) => {
        router.delete(`/hr/surveys/${id}`, { preserveScroll:true });
    };

    const filtered = tab === 'all' ? surveys : surveys.filter(s => s.status === tab);

    const statCards = [
        { label:'Total Surveys',    value:stats.total||0,     icon:'📋', color:'#7c3aed', soft:dark?'rgba(124,58,237,0.14)':'#f3e8ff',  border:dark?'rgba(124,58,237,0.25)':'#ddd6fe' },
        { label:'Active',           value:stats.active||0,    icon:'▶',  color:'#059669', soft:dark?'rgba(5,150,105,0.14)':'#d1fae5',   border:dark?'rgba(5,150,105,0.25)':'#6ee7b7'  },
        { label:'Draft',            value:stats.draft||0,     icon:'✏️', color:'#6b7280', soft:dark?'rgba(107,114,128,0.14)':'#f3f4f6', border:dark?'rgba(107,114,128,0.25)':'#d1d5db' },
        { label:'Closed',           value:stats.closed||0,    icon:'■',  color:'#dc2626', soft:dark?'rgba(220,38,38,0.14)':'#fee2e2',   border:dark?'rgba(220,38,38,0.25)':'#fca5a5'  },
        { label:'Total Responses',  value:stats.responses||0, icon:'💬', color:'#0891b2', soft:dark?'rgba(8,145,178,0.14)':'#e0f2fe',   border:dark?'rgba(8,145,178,0.25)':'#7dd3fc'  },
    ];

    const tabs = [
        { key:'all',    label:'All',    count:surveys.length },
        { key:'active', label:'Active', count:surveys.filter(s=>s.status==='active').length },
        { key:'draft',  label:'Draft',  count:surveys.filter(s=>s.status==='draft').length },
        { key:'closed', label:'Closed', count:surveys.filter(s=>s.status==='closed').length },
    ];

    return (
        <AppLayout title="Surveys">
            <Head title="Surveys"/>
            <style>{`
                @keyframes sv-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                .sv-hide::-webkit-scrollbar { display:none }
                .sv-hide { scrollbar-width:none; -ms-overflow-style:none }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:18, animation:'sv-fade .25s ease' }}>

                {/* ── Summary Cards ── */}
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {statCards.map(c => (
                        <div key={c.label} style={{
                            display:'flex', alignItems:'center', gap:12,
                            background: dark?'rgba(255,255,255,0.04)':'#fff',
                            border:`1px solid ${c.border}`, borderRadius:14,
                            padding:'12px 16px', position:'relative', overflow:'hidden',
                            boxShadow: dark?'0 2px 8px rgba(0,0,0,0.18)':'0 1px 4px rgba(0,0,0,0.04)',
                            minWidth:150, flex:1,
                        }}>
                            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c.color }}/>
                            <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:c.soft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                                {c.icon}
                            </div>
                            <div>
                                <div style={{ fontSize:24, fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                                <div style={{ fontSize:11, color:theme.textMute, marginTop:3, fontWeight:500 }}>{c.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main Panel ── */}
                <div style={{ background:dark?theme.panelSolid:'#fff', borderRadius:18, border:`1px solid ${theme.border}`, boxShadow:theme.shadowSoft, overflow:'hidden' }}>

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:`1px solid ${theme.border}` }}>
                        {/* Tab bar */}
                        <div className="sv-hide" style={{ display:'flex', gap:0, overflowX:'auto' }}>
                            {tabs.map(tab_ => {
                                const isActive = tab === tab_.key;
                                return (
                                    <button key={tab_.key} onClick={()=>setTab(tab_.key)} style={{
                                        padding:'8px 16px', fontSize:13, fontWeight:isActive?800:500,
                                        color:isActive?theme.primary:theme.textMute,
                                        background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap',
                                        borderBottom:isActive?`2.5px solid ${theme.primary}`:'2.5px solid transparent',
                                        display:'flex', alignItems:'center', gap:6, transition:'all .15s',
                                    }}>
                                        {tab_.label}
                                        {tab_.count > 0 && (
                                            <span style={{
                                                fontSize:10, fontWeight:800, borderRadius:99, padding:'2px 7px',
                                                background:isActive?theme.primarySoft:(dark?'rgba(255,255,255,0.08)':'#f3f4f6'),
                                                color:isActive?theme.primary:theme.textMute,
                                            }}>{tab_.count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Create button */}
                        <button onClick={()=>router.visit('/hr/surveys/create')} style={{
                            height:36, padding:'0 16px', borderRadius:10, border:'none',
                            background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                            color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
                            display:'flex', alignItems:'center', gap:7, fontFamily:'inherit',
                            boxShadow:'0 4px 14px rgba(124,58,237,0.35)', transition:'all .2s',
                        }}
                        onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                        onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create Survey
                        </button>
                    </div>

                    {/* Survey list */}
                    {filtered.length === 0 ? (
                        <div style={{ padding:'56px 24px', textAlign:'center' }}>
                            <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
                            <div style={{ fontSize:14, fontWeight:600, color:theme.textSoft, marginBottom:4 }}>
                                No surveys found
                            </div>
                            <div style={{ fontSize:12, color:theme.textMute }}>
                                Click "Create Survey" to create your first survey.
                            </div>
                        </div>
                    ) : filtered.map((s, idx) => (
                        <SurveyRow
                            key={s.id} survey={s} dark={dark} theme={theme}
                            onDelete={handleDelete}
                            isLast={idx === filtered.length - 1}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}