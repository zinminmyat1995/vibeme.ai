// resources/js/Pages/Surveys/Results.jsx — v2
import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
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
        textMute:'#64748b', primary:'#8b5cf6', primarySoft:'rgba(139,92,246,0.16)',
        success:'#10b981', rowHover:'rgba(255,255,255,0.03)',
        inputBg:'rgba(255,255,255,0.05)', shadow:'0 4px 20px rgba(0,0,0,0.3)',
    };
    return {
        panelSolid:'#ffffff', panelSoft:'#f8fafc',
        border:'rgba(15,23,42,0.08)', text:'#0f172a', textSoft:'#475569',
        textMute:'#94a3b8', primary:'#7c3aed', primarySoft:'#f3e8ff',
        success:'#059669', rowHover:'#fafbff',
        inputBg:'#f8fafc', shadow:'0 2px 12px rgba(15,23,42,0.08)',
    };
}

const CHART_COLORS = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#0891b2','#059669'];

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, avatarUrl, size=28 }) {
    const [err, setErr] = useState(false);
    const initials = (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const colors = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2'];
    const color  = colors[(name||'').charCodeAt(0) % colors.length];
    const src    = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `/storage/${avatarUrl}`) : null;
    if (src && !err) return <img src={src} alt={name} onError={()=>setErr(true)} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
    return <div style={{width:size,height:size,borderRadius:'50%',background:color+'22',border:`1.5px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.36,fontWeight:700,color,flexShrink:0}}>{initials}</div>;
}

// ── Choice bar ─────────────────────────────────────────────────
function ChoiceBar({ label, count, pct, color, dark, theme }) {
    return (
        <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
                <span style={{ fontSize:13, fontWeight:600, color:theme.textSoft }}>{label}</span>
                <span style={{ fontSize:11, color:theme.textMute, fontWeight:600 }}>{count} · {pct}%</span>
            </div>
            <div style={{ height:8, borderRadius:99, background:dark?'rgba(255,255,255,0.07)':'#f1f5f9', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:color, transition:'width .7s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
        </div>
    );
}

// ── Question result card ───────────────────────────────────────
function QuestionResult({ qr, idx, dark, theme }) {
    const typeColor = {
        single_choice:'#7c3aed', multi_choice:'#0891b2',
        yes_no:'#059669', rating:'#d97706', text:'#dc2626',
    };
    const typeLabel = {
        single_choice:'Single Choice', multi_choice:'Multi Choice',
        yes_no:'Yes / No', rating:'Rating', text:'Text Answer',
    };
    const c = typeColor[qr.type] || '#7c3aed';

    return (
        <div style={{
            background: dark ? theme.panelSolid : '#fff',
            border:`1px solid ${theme.border}`, borderRadius:18,
            overflow:'hidden', marginBottom:14,
            boxShadow: theme.shadow,
        }}>
            {/* Top accent */}
            <div style={{ height:3, background:c }}/>

            <div style={{ padding:'16px 20px' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16 }}>
                    <div style={{ width:30, height:30, borderRadius:9, background:`${c}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:c, flexShrink:0 }}>
                        {idx+1}
                    </div>
                    <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:theme.text, lineHeight:1.4 }}>{qr.question}</div>
                        <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center' }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:`${c}18`, color:c }}>
                                {typeLabel[qr.type]||qr.type}
                            </span>
                            <span style={{ fontSize:11, color:theme.textMute }}>{qr.answered} responses</span>
                        </div>
                    </div>
                </div>

                {/* single / yes_no / multi breakdown */}
                {qr.breakdown && (
                    <div>
                        {qr.breakdown.map((b,i) => (
                            <ChoiceBar key={i} label={b.label} count={b.count} pct={b.pct}
                                color={CHART_COLORS[i % CHART_COLORS.length]} dark={dark} theme={theme}/>
                        ))}
                    </div>
                )}

                {/* Rating */}
                {qr.type === 'rating' && qr.distribution && (
                    <div>
                        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:14 }}>
                            <span style={{ fontSize:36, fontWeight:900, color:'#f59e0b', lineHeight:1 }}>
                                {qr.avg || '—'}
                            </span>
                            <span style={{ fontSize:13, color:theme.textMute }}>/ 5 avg</span>
                            <div style={{ marginLeft:8, display:'flex', gap:2 }}>
                                {[1,2,3,4,5].map(s => (
                                    <span key={s} style={{ fontSize:16, color: s <= Math.round(qr.avg||0) ? '#f59e0b' : (dark?'rgba(255,255,255,0.12)':'#e2e8f0') }}>★</span>
                                ))}
                            </div>
                        </div>
                        {qr.distribution.map(d => (
                            <ChoiceBar key={d.star}
                                label={`${'★'.repeat(d.star)} (${d.star})`}
                                count={d.count} pct={d.pct} color='#f59e0b' dark={dark} theme={theme}/>
                        ))}
                    </div>
                )}

                {/* Text answers */}
                {qr.type === 'text' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:260, overflowY:'auto' }}>
                        {!qr.answers?.length ? (
                            <div style={{ fontSize:13, color:theme.textMute, fontStyle:'italic', padding:'12px 0' }}>No text answers yet.</div>
                        ) : qr.answers.map((a,i) => (
                            <div key={i} style={{
                                padding:'10px 14px', borderRadius:10,
                                background: dark?'rgba(255,255,255,0.04)':theme.inputBg,
                                border:`1px solid ${theme.border}`,
                                fontSize:13, color:theme.textSoft, lineHeight:1.6,
                                position:'relative',
                            }}>
                                <span style={{ position:'absolute', top:10, left:14, fontSize:18, color:dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', fontFamily:'Georgia,serif', lineHeight:1 }}>"</span>
                                <span style={{ paddingLeft:14 }}>{a}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Individual response row ────────────────────────────────────
function ResponseRow({ resp, idx, survey, questions, dark, theme, isLast }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{ borderBottom: isLast?'none':`1px solid ${theme.border}` }}>
            {/* Row header */}
            <div style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 18px',
                cursor:'pointer', transition:'background .15s',
            }}
            onClick={()=>setExpanded(v=>!v)}
            onMouseEnter={e=>e.currentTarget.style.background=theme.rowHover}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:11, fontWeight:700, color:theme.textMute, minWidth:28 }}>#{idx+1}</span>
                {survey.is_anonymous ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:dark?'rgba(255,255,255,0.08)':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👤</div>
                        <span style={{ fontSize:13, fontWeight:600, color:theme.textMute }}>Anonymous</span>
                    </div>
                ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar name={resp.respondent?.name} avatarUrl={resp.respondent?.avatar_url}/>
                        <div>
                            <div style={{ fontSize:13, fontWeight:700, color:theme.text }}>{resp.respondent?.name || 'Unknown'}</div>
                            {resp.respondent?.department && <div style={{ fontSize:11, color:theme.textMute }}>{resp.respondent.department}</div>}
                        </div>
                    </div>
                )}
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:11, color:theme.textMute }}>{resp.submitted_at}</span>
                    {resp.completion_seconds && (
                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:dark?'rgba(255,255,255,0.06)':theme.inputBg, color:theme.textMute }}>
                            ⏱ {resp.completion_seconds < 60 ? `${resp.completion_seconds}s` : `${Math.floor(resp.completion_seconds/60)}m`}
                        </span>
                    )}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5"
                        style={{ transition:'transform .2s', transform:expanded?'rotate(180deg)':'none' }}>
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
            </div>

            {/* Expanded answers */}
            {expanded && (
                <div style={{ padding:'0 18px 14px 58px', display:'flex', flexDirection:'column', gap:8 }}>
                    {questions.map((q, qi) => {
                        const ans = resp.answers?.[q.id];
                        if (ans === undefined || ans === null || ans === '') return null;
                        return (
                            <div key={q.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                                <span style={{ fontSize:10, fontWeight:800, color:theme.textMute, minWidth:20, paddingTop:2 }}>Q{qi+1}</span>
                                <div style={{ flex:1 }}>
                                    <div style={{ fontSize:11, color:theme.textMute, marginBottom:3 }}>{q.question}</div>
                                    <div style={{ fontSize:13, fontWeight:600, color:theme.text, padding:'6px 10px', borderRadius:8, background:dark?'rgba(255,255,255,0.04)':theme.inputBg, border:`1px solid ${theme.border}` }}>
                                        {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                                        {q.type === 'rating' && ' ★'}
                                    </div>
                                </div>
                            </div>
                        );
                    }).filter(Boolean)}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════
export default function SurveysResults({ survey, results, responses = [] }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [tab,           setTab]           = useState('results');
    const [insight,       setInsight]       = useState(survey.ai_insight || '');
    const [insightLoading,setInsightLoading]= useState(false);
    const [insightTime,   setInsightTime]   = useState(survey.ai_insight_generated_at || '');

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    const generateInsight = async () => {
        setInsightLoading(true);
        try {
            const res = await fetch(`/hr/surveys/${survey.id}/insight`, {
                method:'POST',
                headers:{ 'X-CSRF-TOKEN':csrf(), 'X-Requested-With':'XMLHttpRequest', 'Content-Type':'application/json' },
            });
            const data = await res.json();
            if (data.insight) { setInsight(data.insight); setInsightTime('Just now'); }
        } catch(e) { console.error(e); }
        finally { setInsightLoading(false); }
    };

    const fmtSec = (s) => { if (!s) return '—'; if (s<60) return `${s}s`; return `${Math.floor(s/60)}m ${s%60}s`; };
    const totalResp = results.total_responses || 0;

    const tabs = [
        { key:'results',   label:'Question Results', count:null },
        { key:'responses', label:'Individual Responses', count:totalResp },
        { key:'insight',   label:'AI Insight', count:null },
    ];

    return (
        <AppLayout title="Survey Results">
            <Head title="Survey Results"/>
            <style>{`
                @keyframes sv-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes sv-spin { to{transform:rotate(360deg)} }
                .sv-hide::-webkit-scrollbar { display:none }
                .sv-hide { scrollbar-width:none }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:18, animation:'sv-fade .25s ease' }}>

                {/* ── Hero header ── */}
                <div style={{
                    background:'linear-gradient(135deg,#3b0764 0%,#4f46e5 50%,#7c3aed 100%)',
                    borderRadius:20, padding:'24px 28px', position:'relative', overflow:'hidden',
                }}>
                    <div style={{ position:'absolute', top:-30, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
                    <div style={{ position:'relative' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                            <button onClick={()=>router.visit('/hr/surveys')} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                ← Surveys
                            </button>
                            <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Survey Results</span>
                        </div>
                        <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', margin:'8px 0 4px', letterSpacing:'-0.3px' }}>{survey.title}</h1>
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                            <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>{totalResp} responses · Avg {fmtSec(results.avg_completion_sec)}</span>
                            {survey.is_anonymous && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)' }}>🔒 Anonymous</span>}
                            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', textTransform:'capitalize' }}>{survey.status}</span>
                        </div>
                    </div>
                </div>

                {/* ── Summary cards ── */}
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {[
                        { label:'Total Responses', value:totalResp,                              icon:'💬', color:'#7c3aed', soft:dark?'rgba(124,58,237,0.14)':'#f3e8ff' },
                        { label:'Avg Completion',  value:fmtSec(results.avg_completion_sec),    icon:'⏱',  color:'#0891b2', soft:dark?'rgba(8,145,178,0.14)':'#e0f2fe'  },
                        { label:'Questions',       value:results.questions?.length||0,           icon:'📋', color:'#059669', soft:dark?'rgba(5,150,105,0.14)':'#d1fae5'  },
                    ].map(c => (
                        <div key={c.label} style={{
                            display:'flex', alignItems:'center', gap:12, flex:1, minWidth:140,
                            background:dark?'rgba(255,255,255,0.04)':'#fff',
                            border:`1px solid ${theme.border}`, borderRadius:14, padding:'12px 16px',
                            position:'relative', overflow:'hidden', boxShadow:theme.shadow,
                        }}>
                            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c.color }}/>
                            <div style={{ width:42, height:42, borderRadius:12, background:c.soft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{c.icon}</div>
                            <div>
                                <div style={{ fontSize:22, fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                                <div style={{ fontSize:11, color:theme.textMute, marginTop:3 }}>{c.label}</div>
                            </div>
                        </div>
                    ))}
                    {/* Export button */}
                    <a href={`/hr/surveys/${survey.id}/export`} style={{
                        display:'flex', alignItems:'center', gap:8, padding:'12px 16px',
                        borderRadius:14, border:`1px solid ${theme.border}`,
                        background:dark?'rgba(255,255,255,0.04)':'#fff',
                        color:theme.textSoft, fontSize:12, fontWeight:600,
                        textDecoration:'none', boxShadow:theme.shadow,
                        transition:'all .15s',
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export CSV
                    </a>
                </div>

                {/* ── Tab panel ── */}
                <div style={{ background:dark?theme.panelSolid:'#fff', borderRadius:18, border:`1px solid ${theme.border}`, boxShadow:theme.shadow, overflow:'hidden' }}>

                    {/* Tabs */}
                    <div className="sv-hide" style={{ display:'flex', borderBottom:`1px solid ${theme.border}`, padding:'0 4px', overflowX:'auto' }}>
                        {tabs.map(t => {
                            const isActive = tab === t.key;
                            return (
                                <button key={t.key} onClick={()=>setTab(t.key)} style={{
                                    padding:'14px 18px', fontSize:13, fontWeight:isActive?800:500,
                                    color:isActive?theme.primary:theme.textMute,
                                    background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap',
                                    borderBottom:isActive?`2.5px solid ${theme.primary}`:'2.5px solid transparent',
                                    display:'flex', alignItems:'center', gap:7, transition:'all .15s',
                                }}>
                                    {t.label}
                                    {t.count !== null && t.count > 0 && (
                                        <span style={{ fontSize:10, fontWeight:800, borderRadius:99, padding:'2px 7px', background:isActive?theme.primarySoft:(dark?'rgba(255,255,255,0.08)':'#f3f4f6'), color:isActive?theme.primary:theme.textMute }}>
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Tab: Question Results ── */}
                    {tab === 'results' && (
                        <div style={{ padding:'18px 20px' }}>
                            {!results.questions?.length ? (
                                <div style={{ padding:'40px', textAlign:'center', color:theme.textMute }}>No responses yet.</div>
                            ) : results.questions.map((qr, idx) => (
                                <QuestionResult key={idx} qr={qr} idx={idx} dark={dark} theme={theme}/>
                            ))}
                        </div>
                    )}

                    {/* ── Tab: Individual Responses ── */}
                    {tab === 'responses' && (
                        <div>
                            {!responses.length ? (
                                <div style={{ padding:'56px 24px', textAlign:'center' }}>
                                    <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
                                    <div style={{ fontSize:14, fontWeight:600, color:theme.textSoft }}>No responses yet</div>
                                </div>
                            ) : responses.map((resp, idx) => (
                                <ResponseRow
                                    key={resp.id} resp={resp} idx={idx}
                                    survey={survey}
                                    questions={results.questions_raw || []}
                                    dark={dark} theme={theme}
                                    isLast={idx === responses.length - 1}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Tab: AI Insight ── */}
                    {tab === 'insight' && (
                        <div style={{ padding:'24px' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                                <div>
                                    <div style={{ fontSize:15, fontWeight:800, color:theme.text, display:'flex', alignItems:'center', gap:8 }}>
                                        🤖 AI Analysis
                                    </div>
                                    {insightTime && <div style={{ fontSize:11, color:theme.textMute, marginTop:2 }}>Generated {insightTime}</div>}
                                </div>
                                <button onClick={generateInsight} disabled={insightLoading || totalResp === 0} style={{
                                    padding:'9px 18px', borderRadius:10, border:'none',
                                    background:(insightLoading||totalResp===0)?theme.primarySoft:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                                    color:(insightLoading||totalResp===0)?theme.primary:'#fff',
                                    fontSize:12, fontWeight:700, cursor:(insightLoading||totalResp===0)?'default':'pointer',
                                    fontFamily:'inherit', display:'flex', alignItems:'center', gap:7,
                                    boxShadow:(insightLoading||totalResp===0)?'none':'0 4px 14px rgba(124,58,237,0.3)',
                                }}>
                                    {insightLoading
                                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'sv-spin 1s linear infinite'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                                        : <span>✨</span>
                                    }
                                    {insightLoading ? 'Analyzing...' : insight ? 'Regenerate' : 'Generate Insight'}
                                </button>
                            </div>

                            {insight ? (
                                <div style={{ padding:'20px 22px', borderRadius:14, background:dark?'rgba(124,58,237,0.08)':'#f3e8ff', border:`1px solid ${dark?'rgba(124,58,237,0.2)':'#ddd6fe'}` }}>
                                    <div style={{ fontSize:13, color:theme.textSoft, lineHeight:1.85, whiteSpace:'pre-wrap' }}>
                                        {insight}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding:'56px 24px', textAlign:'center' }}>
                                    <div style={{ fontSize:42, marginBottom:12 }}>🤖</div>
                                    <div style={{ fontSize:14, fontWeight:600, color:theme.textSoft, marginBottom:6 }}>No insight generated yet</div>
                                    <div style={{ fontSize:12, color:theme.textMute }}>
                                        {totalResp === 0 ? 'Collect responses before generating AI insights.' : 'Click "Generate Insight" to analyze all responses with AI.'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}