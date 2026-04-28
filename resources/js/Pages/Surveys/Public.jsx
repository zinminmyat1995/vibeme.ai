// resources/js/Pages/Surveys/Public.jsx — v2
import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';

export default function SurveyPublic({ survey, already_responded }) {
    const [answers,   setAnswers]   = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState('');
    const [errors,    setErrors]    = useState({});
    const startTime = useRef(Date.now());

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    const visibleQuestions = survey.questions.filter(q => {
        if (!q.depends_on_question_id) return true;
        const parentAnswer = answers[q.depends_on_question_id];
        if (!parentAnswer) return false;
        if (Array.isArray(parentAnswer)) return parentAnswer.includes(q.depends_on_answer);
        return parentAnswer === q.depends_on_answer;
    });

    const totalVisible = visibleQuestions.length;
    const answered     = visibleQuestions.filter(q => {
        const a = answers[q.id];
        return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
    }).length;
    const progressPct = totalVisible > 0 ? Math.round((answered / totalVisible) * 100) : 0;
    const allRequired = visibleQuestions.filter(q => q.is_required).every(q => {
        const a = answers[q.id];
        return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
    });

    const handleAnswer = (qId, value) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
        if (errors[qId]) setErrors(prev => ({ ...prev, [qId]: null }));
    };

    const handleMultiChoice = (qId, option, checked) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[qId]) ? prev[qId] : [];
            return { ...prev, [qId]: checked ? [...current, option] : current.filter(o => o !== option) };
        });
    };

    const validate = () => {
        const e = {};
        visibleQuestions.forEach(q => {
            if (!q.is_required) return;
            const a = answers[q.id];
            if (a === undefined || a === '' || (Array.isArray(a) && a.length === 0)) {
                e[q.id] = 'This question is required.';
            }
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        setError('');
        const completionSeconds = Math.round((Date.now() - startTime.current) / 1000);
        try {
            const res = await fetch(`/survey/${survey.token || window.location.pathname.split('/')[2]}/submit`, {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'X-CSRF-TOKEN':csrf(), 'X-Requested-With':'XMLHttpRequest' },
                body: JSON.stringify({ answers, completion_seconds: completionSeconds }),
            });
            const data = await res.json();
            if (data.success) setSubmitted(true);
            else setError(data.error || 'Something went wrong.');
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const P = '#7c3aed';

    if (already_responded) return (
        <>
        <Head title={survey.title}/>
        <style>{`
            body{margin:0;background:#f5f3ff;font-family:'Segoe UI',system-ui,sans-serif;}
            @keyframes sv-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
            @keyframes sv-fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        `}</style>
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)' }}>
            <div style={{ maxWidth:440, width:'100%', animation:'sv-fade .4s ease' }}>

                {/* Card */}
                <div style={{ background:'#fff', borderRadius:24, overflow:'hidden', boxShadow:'0 12px 48px rgba(124,58,237,0.14)', border:'1px solid #ede9fe' }}>

                    {/* Top accent */}
                    <div style={{ height:5, background:'linear-gradient(90deg,#7c3aed,#4f46e5)' }}/>

                    <div style={{ padding:'40px 36px', textAlign:'center' }}>
                        {/* Icon */}
                        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', boxShadow:'0 8px 24px rgba(124,58,237,0.3)', animation:'sv-bounce 2s ease-in-out infinite' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>

                        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 10px', letterSpacing:'-0.3px' }}>
                            Already Submitted
                        </h2>
                        <p style={{ fontSize:14, color:'#64748b', lineHeight:1.65, margin:'0 0 24px' }}>
                            You've already shared your feedback for <strong style={{ color:'#0f172a' }}>{survey.title}</strong>. Each person can only respond once.
                        </p>

                        {/* Info pill */}
                        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:99, background:'#f3e8ff', border:'1px solid #ddd6fe' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span style={{ fontSize:12, fontWeight:600, color:'#7c3aed' }}>
                                {survey.is_anonymous ? 'Your anonymous response was recorded.' : 'Your response has been saved.'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Subtext */}
                <p style={{ textAlign:'center', fontSize:12, color:'#a78bfa', marginTop:16 }}>
                    Thank you for participating 💜
                </p>
            </div>
        </div>
        </>
    );

    // ── Submitted ────────────────────────────────────────────────
    if (submitted) return (
        <>
        <Head title="Thank You!"/>
        <style>{`body{margin:0;background:#f5f3ff;font-family:'Segoe UI',system-ui,sans-serif;}`}</style>
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div style={{ background:'#fff', borderRadius:24, padding:'52px 40px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(124,58,237,0.12)', border:'1px solid #ede9fe' }}>
                <div style={{ fontSize:64, marginBottom:16, lineHeight:1 }}>🎉</div>
                <h2 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 10px', letterSpacing:'-0.3px' }}>Response Recorded!</h2>
                <p style={{ fontSize:14, color:'#64748b', lineHeight:1.65, margin:'0 0 20px' }}>Your feedback has been submitted. We appreciate your time and input — it helps us improve.</p>
                {survey.is_anonymous && (
                    <div style={{ padding:'10px 16px', borderRadius:12, background:'#f0fdf4', border:'1px solid #86efac', fontSize:12, color:'#166534', display:'inline-flex', alignItems:'center', gap:6 }}>
                        🔒 Submitted anonymously — your identity is protected.
                    </div>
                )}
            </div>
        </div>
        </>
    );

    // ── Main survey form ─────────────────────────────────────────
    return (
        <>
        <Head title={survey.title}/>
        <style>{`
            * { box-sizing: border-box; }
            body { margin:0; background:#f5f3ff; font-family:'Segoe UI',system-ui,sans-serif; }
            @keyframes sv-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
            @keyframes sv-spin { to{transform:rotate(360deg)} }
            .sv-opt:hover { border-color:${P} !important; background:rgba(124,58,237,0.04) !important; }
            .sv-star-btn:hover span { color:#f59e0b !important; transform:scale(1.2) !important; }
        `}</style>

        <div style={{ minHeight:'100vh', background:'#f5f3ff', padding:'28px 16px 72px' }}>
            <div style={{ maxWidth:600, margin:'0 auto' }}>

                {/* ── Compact header ── */}
                <div style={{
                    background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
                    borderRadius:20, padding:'22px 26px', marginBottom:16,
                    position:'relative', overflow:'hidden',
                }}>
                    <div style={{ position:'absolute', top:-40, right:-40, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
                    <div style={{ position:'absolute', bottom:-50, left:-10, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
                    <div style={{ position:'relative' }}>
                        <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.55)', marginBottom:6 }}>
                            📋 Employee Survey
                        </div>
                        <h1 style={{ fontSize:20, fontWeight:900, color:'#fff', margin:'0 0 6px', letterSpacing:'-0.2px', lineHeight:1.2 }}>
                            {survey.title}
                        </h1>
                        {survey.description && (
                            <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', margin:'0 0 10px', lineHeight:1.5 }}>
                                {survey.description}
                            </p>
                        )}
                        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                            {survey.is_anonymous && (
                                <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99, background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.9)' }}>
                                    🔒 Anonymous
                                </span>
                            )}
                            {survey.closes_at && (
                                <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, background:'rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.8)' }}>
                                    📅 Closes {survey.closes_at}
                                </span>
                            )}
                            <span style={{ fontSize:10, padding:'3px 9px', borderRadius:99, background:'rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.8)' }}>
                                {totalVisible} questions
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Progress bar ── */}
                <div style={{ background:'#fff', borderRadius:14, padding:'12px 16px', marginBottom:14, boxShadow:'0 1px 6px rgba(124,58,237,0.08)', border:'1px solid #ede9fe' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>
                            {answered === totalVisible && totalVisible > 0 ? '✓ All questions answered' : `${answered} of ${totalVisible} answered`}
                        </span>
                        <span style={{ fontSize:12, fontWeight:800, color:P }}>{progressPct}%</span>
                    </div>
                    <div style={{ height:5, borderRadius:99, background:'#ede9fe', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progressPct}%`, borderRadius:99, background:`linear-gradient(90deg,${P},#4f46e5)`, transition:'width .4s cubic-bezier(.4,0,.2,1)' }}/>
                    </div>
                </div>

                {/* ── Questions ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {visibleQuestions.map((q, idx) => {
                        const hasError = !!errors[q.id];
                        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && !(Array.isArray(answers[q.id]) && answers[q.id].length === 0);

                        return (
                            <div key={q.id} style={{
                                background:'#fff', borderRadius:16,
                                border:`1.5px solid ${hasError?'#fca5a5':isAnswered?'#c4b5fd':'#e8e3ff'}`,
                                overflow:'hidden', animation:'sv-in .2s ease',
                                boxShadow: isAnswered ? '0 2px 12px rgba(124,58,237,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                                transition:'border-color .2s, box-shadow .2s',
                            }}>
                                {/* Q header strip */}
                                <div style={{
                                    height:3,
                                    background: isAnswered ? `linear-gradient(90deg,${P},#4f46e5)` : '#e8e3ff',
                                    transition:'background .3s',
                                }}/>

                                <div style={{ padding:'18px 20px' }}>
                                    {/* Question label */}
                                    <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'flex-start' }}>
                                        <div style={{
                                            width:26, height:26, borderRadius:8, flexShrink:0,
                                            background: isAnswered ? P : '#f3e8ff',
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            fontSize:11, fontWeight:900,
                                            color: isAnswered ? '#fff' : P,
                                            transition:'all .2s',
                                        }}>{idx+1}</div>
                                        <div style={{ flex:1 }}>
                                            <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', lineHeight:1.45 }}>
                                                {q.question}
                                                {q.is_required && <span style={{ color:'#f43f5e', marginLeft:4, fontSize:13 }}>*</span>}
                                            </div>
                                            {hasError && (
                                                <div style={{ fontSize:11, color:'#ef4444', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                    {errors[q.id]}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Single / Yes No */}
                                    {(q.type === 'single_choice' || q.type === 'yes_no') && (
                                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                            {q.options.map(opt => {
                                                const sel = answers[q.id] === opt;
                                                return (
                                                    <label key={opt} className="sv-opt" style={{
                                                        display:'flex', alignItems:'center', gap:12,
                                                        padding:'11px 14px', borderRadius:10,
                                                        border:`1.5px solid ${sel?P:'#e2e8f0'}`,
                                                        background:sel?'rgba(124,58,237,0.06)':'#fafafa',
                                                        cursor:'pointer', transition:'all .15s',
                                                    }}>
                                                        <div style={{ width:18, height:18, borderRadius:'50%', border:`2.5px solid ${sel?P:'#cbd5e1'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s', background:sel?`${P}15`:'transparent' }}>
                                                            {sel && <div style={{ width:7, height:7, borderRadius:'50%', background:P }}/>}
                                                        </div>
                                                        <input type="radio" checked={sel} onChange={()=>handleAnswer(q.id, opt)} style={{ display:'none' }}/>
                                                        <span style={{ fontSize:13, fontWeight:sel?700:500, color:sel?P:'#374151', transition:'color .15s' }}>{opt}</span>
                                                        {sel && <svg style={{ marginLeft:'auto', flexShrink:0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Multi choice */}
                                    {q.type === 'multi_choice' && (
                                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                            {q.options.map(opt => {
                                                const chk = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                                                return (
                                                    <label key={opt} className="sv-opt" style={{
                                                        display:'flex', alignItems:'center', gap:12,
                                                        padding:'11px 14px', borderRadius:10,
                                                        border:`1.5px solid ${chk?P:'#e2e8f0'}`,
                                                        background:chk?'rgba(124,58,237,0.06)':'#fafafa',
                                                        cursor:'pointer', transition:'all .15s',
                                                    }}>
                                                        <div style={{ width:18, height:18, borderRadius:5, border:`2.5px solid ${chk?P:'#cbd5e1'}`, background:chk?P:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                                                            {chk && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                                        </div>
                                                        <input type="checkbox" checked={chk} onChange={e=>handleMultiChoice(q.id, opt, e.target.checked)} style={{ display:'none' }}/>
                                                        <span style={{ fontSize:13, fontWeight:chk?700:500, color:chk?P:'#374151', transition:'color .15s' }}>{opt}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Rating */}
                                    {q.type === 'rating' && (
                                        <div>
                                            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                                                {[1,2,3,4,5].map(star => {
                                                    const filled = Number(answers[q.id]) >= star;
                                                    const active = Number(answers[q.id]) === star;
                                                    return (
                                                        <button key={star} type="button" className="sv-star-btn"
                                                            onClick={()=>handleAnswer(q.id, String(star))}
                                                            style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 2px' }}>
                                                            <span style={{
                                                                display:'block', fontSize:34,
                                                                color: filled?'#f59e0b':'#e2e8f0',
                                                                transition:'color .15s, transform .15s',
                                                                transform: active?'scale(1.2)':'scale(1)',
                                                            }}>★</span>
                                                        </button>
                                                    );
                                                })}
                                                {answers[q.id] && (
                                                    <span style={{ fontSize:12, color:'#94a3b8', marginLeft:4 }}>
                                                        {answers[q.id]} / 5
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display:'flex', justifyContent:'space-between', padding:'0 6px', marginTop:4 }}>
                                                <span style={{ fontSize:10, color:'#94a3b8' }}>Poor</span>
                                                <span style={{ fontSize:10, color:'#94a3b8' }}>Excellent</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text */}
                                    {q.type === 'text' && (
                                        <textarea
                                            value={answers[q.id]||''}
                                            onChange={e=>handleAnswer(q.id, e.target.value)}
                                            placeholder="Share your thoughts here..."
                                            rows={3}
                                            style={{
                                                width:'100%', padding:'11px 14px', borderRadius:10,
                                                border:`1.5px solid ${hasError?'#fca5a5':answers[q.id]?'#c4b5fd':'#e2e8f0'}`,
                                                fontSize:13, fontFamily:'inherit', outline:'none',
                                                resize:'vertical', color:'#0f172a', background:'#fafafa',
                                                transition:'border-color .15s', lineHeight:1.55,
                                            }}
                                            onFocus={e=>e.target.style.borderColor=P}
                                            onBlur={e=>e.target.style.borderColor=answers[q.id]?'#c4b5fd':hasError?'#fca5a5':'#e2e8f0'}/>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Error msg ── */}
                {error && (
                    <div style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background:'#fee2e2', border:'1px solid #fca5a5', fontSize:13, color:'#dc2626', display:'flex', alignItems:'center', gap:8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {error}
                    </div>
                )}

                {/* ── Submit button ── */}
                <div style={{ marginTop:20 }}>
                    <button onClick={handleSubmit} disabled={loading} style={{
                        width:'100%', padding:'15px', borderRadius:14, border:'none',
                        background: loading
                            ? 'linear-gradient(135deg,#a78bfa,#818cf8)'
                            : allRequired
                                ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                                : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                        color:'#fff', fontSize:15, fontWeight:800,
                        cursor:loading?'not-allowed':'pointer',
                        fontFamily:'inherit',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                        boxShadow: loading?'none':'0 8px 24px rgba(124,58,237,0.4)',
                        transition:'all .2s', letterSpacing:'0.02em',
                    }}
                    onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
                    onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                        {loading ? (
                            <>
                                <span style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'sv-spin .7s linear infinite' }}/>
                                Submitting your response...
                            </>
                        ) : (
                            <>
                                Send Feedback
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                            </>
                        )}
                    </button>
                    <div style={{ textAlign:'center', marginTop:10, fontSize:11, color:'#94a3b8' }}>
                        {survey.is_anonymous ? '🔒 Your response is anonymous and confidential.' : '📋 Your name will be recorded with your response.'}
                    </div>
                </div>

            </div>
        </div>
        </>
    );
}