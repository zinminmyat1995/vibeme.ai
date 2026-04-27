// resources/js/Pages/Surveys/Public.jsx
// No auth required — public survey form
import { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';

export default function SurveyPublic({ survey, already_responded }) {
    const [answers,   setAnswers]   = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState('');
    const [errors,    setErrors]    = useState({});
    const startTime = useRef(Date.now());

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    // Compute visible questions based on conditional logic
    const visibleQuestions = survey.questions.filter(q => {
        if (!q.depends_on_question_id) return true;
        const parentAnswer = answers[q.depends_on_question_id];
        if (!parentAnswer) return false;
        if (Array.isArray(parentAnswer)) return parentAnswer.includes(q.depends_on_answer);
        return parentAnswer === q.depends_on_answer;
    });

    const totalVisible    = visibleQuestions.length;
    const answered        = visibleQuestions.filter(q => {
        const a = answers[q.id];
        return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
    }).length;
    const progressPct     = totalVisible > 0 ? Math.round((answered / totalVisible) * 100) : 0;

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
            const res = await fetch(`/survey/${survey.token || window.location.pathname.split('/').pop()}/submit`, {
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

    // Styles
    const primary = '#7c3aed';
    const bg = '#f4f0ff';

    if (already_responded) {
        return (
            <>
            <Head title={survey.title}/>
            <div style={{ minHeight:'100vh', background:bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                <div style={{ background:'#fff', borderRadius:20, padding:'48px 40px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(124,58,237,0.1)' }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Already Submitted</h2>
                    <p style={{ fontSize:14, color:'#64748b', lineHeight:1.6 }}>You have already submitted a response to this survey. Thank you!</p>
                </div>
            </div>
            </>
        );
    }

    if (submitted) {
        return (
            <>
            <Head title="Thank You!"/>
            <div style={{ minHeight:'100vh', background:bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                <div style={{ background:'#fff', borderRadius:20, padding:'48px 40px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(124,58,237,0.1)' }}>
                    <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
                    <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Thank You!</h2>
                    <p style={{ fontSize:14, color:'#64748b', lineHeight:1.6 }}>Your response has been recorded. We appreciate your feedback!</p>
                    {survey.is_anonymous && (
                        <div style={{ marginTop:16, padding:'10px 14px', borderRadius:10, background:'#f0fdf4', border:'1px solid #86efac', fontSize:12, color:'#166534' }}>
                            🔒 Your response was submitted anonymously.
                        </div>
                    )}
                </div>
            </div>
            </>
        );
    }

    return (
        <>
        <Head title={survey.title}/>
        <style>{`
            body { margin:0; background:${bg}; }
            @keyframes sv-q { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
            .sv-radio:hover { border-color:${primary} !important; background:rgba(124,58,237,0.05) !important; }
            .sv-star:hover { color:#f59e0b !important; }
        `}</style>

        <div style={{ minHeight:'100vh', background:bg, padding:'32px 20px 60px' }}>
            <div style={{ maxWidth:620, margin:'0 auto' }}>

                {/* Header */}
                <div style={{ background:`linear-gradient(135deg,#4f46e5,#7c3aed)`, borderRadius:20, padding:'32px 36px', marginBottom:20, color:'#fff', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-30, right:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
                    <div style={{ position:'relative' }}>
                        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.65)', marginBottom:10 }}>
                            Employee Survey
                        </div>
                        <h1 style={{ fontSize:24, fontWeight:900, margin:'0 0 8px', letterSpacing:'-0.3px' }}>{survey.title}</h1>
                        {survey.description && <p style={{ fontSize:14, color:'rgba(255,255,255,0.8)', margin:0, lineHeight:1.6 }}>{survey.description}</p>}
                        <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
                            {survey.is_anonymous && <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99, background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.9)' }}>🔒 Anonymous</span>}
                            {survey.closes_at && <span style={{ fontSize:11, padding:'4px 10px', borderRadius:99, background:'rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.85)' }}>📅 Closes {survey.closes_at}</span>}
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div style={{ background:'#fff', borderRadius:14, padding:'14px 18px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>{answered} of {totalVisible} answered</span>
                        <span style={{ fontSize:12, fontWeight:700, color:primary }}>{progressPct}%</span>
                    </div>
                    <div style={{ height:6, borderRadius:99, background:'#e9d5ff', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progressPct}%`, borderRadius:99, background:`linear-gradient(90deg,#7c3aed,#4f46e5)`, transition:'width .3s ease' }}/>
                    </div>
                </div>

                {/* Questions */}
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {visibleQuestions.map((q, idx) => (
                        <div key={q.id} style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', animation:'sv-q .2s ease', border: errors[q.id]?'1.5px solid #fca5a5':'1px solid transparent' }}>
                            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                                <span style={{ width:24, height:24, borderRadius:7, background:'#f3e8ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:primary, flexShrink:0 }}>{idx+1}</span>
                                <div>
                                    <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', lineHeight:1.4 }}>
                                        {q.question}
                                        {q.is_required && <span style={{ color:'#ef4444', marginLeft:4 }}>*</span>}
                                    </div>
                                    {errors[q.id] && <div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>⚠ {errors[q.id]}</div>}
                                </div>
                            </div>

                            {/* single_choice / yes_no */}
                            {(q.type === 'single_choice' || q.type === 'yes_no') && (
                                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                    {q.options.map(opt => {
                                        const selected = answers[q.id] === opt;
                                        return (
                                            <label key={opt} className="sv-radio" style={{
                                                display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
                                                borderRadius:10, border:`1.5px solid ${selected?primary:'#e2e8f0'}`,
                                                background:selected?'rgba(124,58,237,0.06)':'#fafafa',
                                                cursor:'pointer', transition:'all .15s',
                                            }}>
                                                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${selected?primary:'#cbd5e1'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                                                    {selected && <div style={{ width:8, height:8, borderRadius:'50%', background:primary }}/>}
                                                </div>
                                                <input type="radio" checked={selected} onChange={()=>handleAnswer(q.id, opt)} style={{ display:'none' }}/>
                                                <span style={{ fontSize:13, fontWeight:selected?700:500, color:selected?primary:'#374151' }}>{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* multi_choice */}
                            {q.type === 'multi_choice' && (
                                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                    {q.options.map(opt => {
                                        const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                                        return (
                                            <label key={opt} style={{
                                                display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
                                                borderRadius:10, border:`1.5px solid ${checked?primary:'#e2e8f0'}`,
                                                background:checked?'rgba(124,58,237,0.06)':'#fafafa',
                                                cursor:'pointer', transition:'all .15s',
                                            }}>
                                                <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${checked?primary:'#cbd5e1'}`, background:checked?primary:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                    {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                                </div>
                                                <input type="checkbox" checked={checked} onChange={e=>handleMultiChoice(q.id, opt, e.target.checked)} style={{ display:'none' }}/>
                                                <span style={{ fontSize:13, fontWeight:checked?700:500, color:checked?primary:'#374151' }}>{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* rating */}
                            {q.type === 'rating' && (
                                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                                    {[1,2,3,4,5].map(star => {
                                        const selected = Number(answers[q.id]) === star;
                                        const hover    = Number(answers[q.id]) >= star;
                                        return (
                                            <button key={star} type="button" onClick={()=>handleAnswer(q.id, String(star))} className="sv-star" style={{
                                                fontSize:32, background:'none', border:'none', cursor:'pointer',
                                                color: hover ? '#f59e0b' : '#d1d5db',
                                                transition:'color .15s, transform .1s',
                                                transform: selected ? 'scale(1.15)' : 'scale(1)',
                                            }}>★</button>
                                        );
                                    })}
                                    {answers[q.id] && (
                                        <span style={{ alignSelf:'center', fontSize:12, color:'#64748b', marginLeft:4 }}>
                                            {answers[q.id]} / 5 stars
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* text */}
                            {q.type === 'text' && (
                                <textarea value={answers[q.id]||''} onChange={e=>handleAnswer(q.id, e.target.value)}
                                    placeholder="Type your answer here..." rows={3}
                                    style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:`1.5px solid ${errors[q.id]?'#fca5a5':'#e2e8f0'}`, fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box', color:'#0f172a', background:'#fafafa', transition:'border-color .15s' }}
                                    onFocus={e=>e.target.style.borderColor=primary}
                                    onBlur={e=>e.target.style.borderColor=errors[q.id]?'#fca5a5':'#e2e8f0'}/>
                            )}
                        </div>
                    ))}
                </div>

                {/* Submit */}
                {error && (
                    <div style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background:'#fee2e2', border:'1px solid #fca5a5', fontSize:13, color:'#dc2626' }}>{error}</div>
                )}

                <button onClick={handleSubmit} disabled={loading} style={{
                    width:'100%', marginTop:20, padding:'14px', borderRadius:14, border:'none',
                    background: loading ? '#a78bfa' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    color:'#fff', fontSize:15, fontWeight:800, cursor:loading?'not-allowed':'pointer',
                    fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    boxShadow:'0 6px 20px rgba(124,58,237,0.35)', transition:'all .2s',
                }}>
                    {loading && <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'sv-spin .7s linear infinite' }}/>}
                    {loading ? 'Submitting...' : 'Submit Response →'}
                </button>
            </div>
        </div>
        </>
    );
}