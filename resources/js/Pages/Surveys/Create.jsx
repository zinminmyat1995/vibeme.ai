// resources/js/Pages/Surveys/Create.jsx — v2 redesign
import { useState, useEffect, useMemo, useCallback } from 'react';
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
        bg: '#080f1e',
        panel: '#0f1b34',
        panelSoft: 'rgba(255,255,255,0.04)',
        border: 'rgba(148,163,184,0.12)',
        borderFocus: '#8b5cf6',
        text: '#f1f5f9',
        textSoft: '#94a3b8',
        textMute: '#475569',
        primary: '#8b5cf6',
        primarySoft: 'rgba(139,92,246,0.14)',
        success: '#10b981',
        danger: '#f87171',
        inputBg: 'rgba(255,255,255,0.05)',
        inputBorder: 'rgba(148,163,184,0.15)',
        cardBg: 'rgba(255,255,255,0.03)',
        shadow: '0 20px 50px rgba(0,0,0,0.4)',
    };
    return {
        bg: '#f0f4fa',
        panel: '#ffffff',
        panelSoft: '#f8fafc',
        border: 'rgba(15,23,42,0.08)',
        borderFocus: '#7c3aed',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        primary: '#7c3aed',
        primarySoft: 'rgba(124,58,237,0.08)',
        success: '#059669',
        danger: '#ef4444',
        inputBg: '#ffffff',
        inputBorder: '#e2e8f0',
        cardBg: '#f8fafc',
        shadow: '0 4px 24px rgba(15,23,42,0.08)',
    };
}

const TYPE_OPTIONS = [
    { value:'single_choice', label:'Single',  icon:'🔘' },
    { value:'multi_choice',  label:'Multiple', icon:'☑️' },
    { value:'yes_no',        label:'Yes/No',   icon:'✅' },
    { value:'rating',        label:'Rating',   icon:'⭐' },
    { value:'text',          label:'Text',     icon:'✏️' },
];

function newQuestion() {
    return {
        _key: Math.random().toString(36).slice(2),
        question: '',
        type: 'single_choice',
        options: ['', ''],
        is_required: true,
        depends_on_question_index: null,
        depends_on_answer: null,
    };
}

// ── Input / Textarea helpers ───────────────────────────────────
function Field({ label, children, error }) {
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {label && (
                <label style={{ fontSize:11, fontWeight:700, color:'#6366f1',
                    textTransform:'uppercase', letterSpacing:'.07em' }}>
                    {label}
                </label>
            )}
            {children}
            {error && <div style={{ fontSize:11, color:'#ef4444', marginTop:2 }}>⚠ {error}</div>}
        </div>
    );
}

// ── Question Card ──────────────────────────────────────────────
function QuestionCard({ q, idx, total, questions, dark, theme, onChange, onRemove, onMove }) {
    const showOptions = ['single_choice','multi_choice'].includes(q.type);
    const parentQs    = questions.slice(0, idx);

    const inp = (err) => ({
        width:'100%', padding:'10px 14px', borderRadius:10,
        border:`1.5px solid ${err ? theme.danger : theme.inputBorder}`,
        background: theme.inputBg, color: theme.text,
        fontSize:13, fontFamily:'inherit', outline:'none',
        boxSizing:'border-box', transition:'border-color .15s',
    });

    // Type button colors
    const typeColor = (v) => {
        const active = q.type === v;
        const map = {
            single_choice: '#7c3aed',
            multi_choice:  '#0891b2',
            yes_no:        '#059669',
            rating:        '#d97706',
            text:          '#dc2626',
        };
        return active ? map[v] : null;
    };

    return (
        <div style={{
            background: theme.panel,
            border:`1.5px solid ${theme.border}`,
            borderRadius:18, overflow:'hidden',
            boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(15,23,42,0.06)',
        }}>
            {/* Top accent strip by type */}
            <div style={{ height:3, background: (() => {
                const map = { single_choice:'#7c3aed', multi_choice:'#0891b2', yes_no:'#059669', rating:'#d97706', text:'#dc2626' };
                return map[q.type] || '#7c3aed';
            })() }}/>

            {/* Card header */}
            <div style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 16px',
                background: dark ? 'rgba(255,255,255,0.02)' : '#fafbff',
                borderBottom:`1px solid ${theme.border}`,
            }}>
                {/* Number badge */}
                <div style={{
                    width:28, height:28, borderRadius:9, flexShrink:0,
                    background: (() => {
                        const map = { single_choice:'rgba(124,58,237,0.12)', multi_choice:'rgba(8,145,178,0.12)', yes_no:'rgba(5,150,105,0.12)', rating:'rgba(217,119,6,0.12)', text:'rgba(220,38,38,0.12)' };
                        return dark ? (map[q.type]||theme.primarySoft) : (map[q.type]||theme.primarySoft);
                    })(),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:900,
                    color: (() => {
                        const map = { single_choice:'#7c3aed', multi_choice:'#0891b2', yes_no:'#059669', rating:'#d97706', text:'#dc2626' };
                        return map[q.type] || theme.primary;
                    })(),
                }}>Q{idx+1}</div>

                <span style={{ fontSize:11, fontWeight:600, color:theme.textSoft, flex:1 }}>
                    {TYPE_OPTIONS.find(t=>t.value===q.type)?.icon}{' '}
                    {TYPE_OPTIONS.find(t=>t.value===q.type)?.label}
                    {q.is_required && <span style={{ color:'#ef4444', marginLeft:4 }}>*</span>}
                </span>

                {/* Move + Delete */}
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    <button disabled={idx===0} onClick={()=>onMove(idx,-1)} style={{ width:26,height:26,borderRadius:7,border:`1px solid ${theme.border}`,background:'transparent',cursor:idx===0?'not-allowed':'pointer',color:theme.textMute,display:'flex',alignItems:'center',justifyContent:'center',opacity:idx===0?0.3:1,flexShrink:0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button disabled={idx===total-1} onClick={()=>onMove(idx,1)} style={{ width:26,height:26,borderRadius:7,border:`1px solid ${theme.border}`,background:'transparent',cursor:idx===total-1?'not-allowed':'pointer',color:theme.textMute,display:'flex',alignItems:'center',justifyContent:'center',opacity:idx===total-1?0.3:1,flexShrink:0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button onClick={()=>onRemove(idx)} style={{ width:26,height:26,borderRadius:7,border:'none',background:'transparent',cursor:'pointer',color:dark?'rgba(248,113,113,0.45)':'#fca5a5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}
                        onMouseEnter={e=>{e.currentTarget.style.background=dark?'rgba(248,113,113,0.12)':'#fee2e2';e.currentTarget.style.color='#ef4444';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=dark?'rgba(248,113,113,0.45)':'#fca5a5';}}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>

            {/* Card body */}
            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>

                {/* Question text */}
                <Field label="Question">
                    <textarea value={q.question} onChange={e=>onChange(idx,'question',e.target.value)}
                        placeholder="Type your question here..." rows={2}
                        style={{...inp(!q.question&&false), resize:'none'}}
                        onFocus={e=>e.target.style.borderColor=theme.borderFocus}
                        onBlur={e=>e.target.style.borderColor=theme.inputBorder}/>
                </Field>

                {/* Type pills */}
                <Field label="Type">
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {TYPE_OPTIONS.map(t => {
                            const active = q.type === t.value;
                            const c = typeColor(t.value);
                            return (
                                <button key={t.value} type="button" onClick={()=>onChange(idx,'type',t.value)} style={{
                                    display:'flex', alignItems:'center', gap:5,
                                    padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:700,
                                    cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                                    border:`1.5px solid ${active ? c : theme.inputBorder}`,
                                    background: active ? `${c}18` : 'transparent',
                                    color: active ? c : theme.textSoft,
                                }}>
                                    <span>{t.icon}</span>{t.label}
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {/* Options */}
                {showOptions && (
                    <Field label="Options">
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            {(q.options||[]).map((opt,oi) => (
                                <div key={oi} style={{ display:'flex', gap:7, alignItems:'center' }}>
                                    <div style={{ width:7, height:7, borderRadius:'50%', background:theme.primary, flexShrink:0 }}/>
                                    <input value={opt} onChange={e=>{
                                        const opts=[...(q.options||[])];
                                        opts[oi]=e.target.value;
                                        onChange(idx,'options',opts);
                                    }} placeholder={`Option ${oi+1}`}
                                    style={{...inp(false), flex:1}}
                                    onFocus={e=>e.target.style.borderColor=theme.borderFocus}
                                    onBlur={e=>e.target.style.borderColor=theme.inputBorder}/>
                                    {(q.options||[]).length > 2 && (
                                        <button onClick={()=>{
                                            onChange(idx,'options',(q.options||[]).filter((_,i)=>i!==oi));
                                        }} style={{ width:28,height:38,borderRadius:8,border:`1px solid ${theme.border}`,background:'transparent',cursor:'pointer',color:theme.textMute,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={()=>onChange(idx,'options',[...(q.options||[]),''])} style={{
                                padding:'6px 12px', borderRadius:8, border:`1.5px dashed ${theme.inputBorder}`,
                                background:'transparent', color:theme.primary, fontSize:11, fontWeight:700,
                                cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-start', transition:'all .15s',
                            }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=theme.primary; e.currentTarget.style.background=theme.primarySoft;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=theme.inputBorder; e.currentTarget.style.background='transparent';}}>
                                + Add Option
                            </button>
                        </div>
                    </Field>
                )}

                {/* Conditional logic */}
                {idx > 0 && (
                    <div style={{
                        padding:'12px 14px', borderRadius:12,
                        background: dark ? 'rgba(99,102,241,0.07)' : '#f5f3ff',
                        border:`1px solid ${dark?'rgba(99,102,241,0.2)':'#ddd6fe'}`,
                    }}>
                        <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.07em', color:'#6366f1', marginBottom:10 }}>
                            ⚡ Conditional Logic
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                            <span style={{ fontSize:12, color:theme.textSoft, fontWeight:500, whiteSpace:'nowrap' }}>Show if</span>
                            <select
                                value={q.depends_on_question_index ?? ''}
                                onChange={e=>onChange(idx,'depends_on_question_index', e.target.value===''?null:Number(e.target.value))}
                                style={{ flex:1, minWidth:140, padding:'7px 10px', borderRadius:9, border:`1.5px solid ${dark?'rgba(99,102,241,0.25)':'#c4b5fd'}`, background:dark?'rgba(99,102,241,0.08)':  '#fff', color:theme.text, fontSize:12, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
                                <option value=''>Always show</option>
                                {parentQs.map((pq,pi)=>(
                                    <option key={pi} value={pi}>Q{pi+1}: {pq.question?.slice(0,35)||'(empty)'}</option>
                                ))}
                            </select>
                            {q.depends_on_question_index !== null && q.depends_on_question_index !== undefined && (
                                <>
                                    <span style={{ fontSize:12, color:theme.textSoft, fontWeight:500, whiteSpace:'nowrap' }}>answer is</span>
                                    <select
                                        value={q.depends_on_answer ?? ''}
                                        onChange={e=>onChange(idx,'depends_on_answer',e.target.value||null)}
                                        style={{ flex:1, minWidth:120, padding:'7px 10px', borderRadius:9, border:`1.5px solid ${dark?'rgba(99,102,241,0.25)':'#c4b5fd'}`, background:dark?'rgba(99,102,241,0.08)':'#fff', color:theme.text, fontSize:12, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
                                        <option value=''>Select answer...</option>
                                        {(()=>{
                                            const pq = questions[q.depends_on_question_index];
                                            if (!pq) return null;
                                            if (pq.type === 'yes_no') return ['Yes','No'].map(a=><option key={a} value={a}>{a}</option>);
                                            if (pq.type === 'rating') return ['1','2','3','4','5'].map(a=><option key={a} value={a}>★ {a}</option>);
                                            return (pq.options||[]).filter(Boolean).map((a,i)=><option key={i} value={a}>{a}</option>);
                                        })()}
                                    </select>
                                </>
                            )}
                        </div>
                        {q.depends_on_question_index !== null && q.depends_on_answer && (
                            <div style={{ marginTop:8, fontSize:11, color:'#6366f1', fontWeight:500 }}>
                                ✓ This question shows only when Q{Number(q.depends_on_question_index)+1} answer is "{q.depends_on_answer}"
                            </div>
                        )}
                    </div>
                )}

                {/* Required toggle */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button type="button" onClick={()=>onChange(idx,'is_required',!q.is_required)} style={{
                        width:38, height:21, borderRadius:99, border:'none', cursor:'pointer', flexShrink:0,
                        background: q.is_required ? theme.primary : (dark?'rgba(148,163,184,0.25)':'#cbd5e1'),
                        position:'relative', transition:'background .2s',
                    }}>
                        <span style={{ position:'absolute', top:2.5, left:q.is_required?19:2.5, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.18)' }}/>
                    </button>
                    <span style={{ fontSize:12, fontWeight:600, color:theme.textSoft }}>
                        {q.is_required ? 'Required' : 'Optional'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
export default function SurveysCreate({ mode='create', survey: editSurvey }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [title,       setTitle]       = useState(editSurvey?.title || '');
    const [description, setDescription] = useState(editSurvey?.description || '');
    const [status,      setStatus]      = useState(editSurvey?.status || 'draft');
    const [isAnonymous, setIsAnonymous] = useState(editSurvey?.is_anonymous ?? false);
    const [closesAt,    setClosesAt]    = useState(editSurvey?.closes_at || '');
    const [errors,      setErrors]      = useState({});
    const [saving,      setSaving]      = useState(false);

    const [questions, setQuestions] = useState(() => {
        if (editSurvey?.questions?.length) {
            const qs = editSurvey.questions.map(q => ({
                ...q,
                _key: Math.random().toString(36).slice(2),
                options: q.options || [],
                depends_on_question_index: null,
                depends_on_answer: q.depends_on_answer || null,
            }));
            // Rebuild depends_on_question_index from depends_on_question_id
            qs.forEach((q, i) => {
                if (q.depends_on_question_id) {
                    const parentIdx = qs.findIndex(pq => pq.id === q.depends_on_question_id);
                    if (parentIdx !== -1) qs[i].depends_on_question_index = parentIdx;
                }
            });
            return qs;
        }
        return [newQuestion()];
    });

    const handleQuestionChange = useCallback((idx, field, value) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== idx) return q;
            const updated = { ...q, [field]: value };
            if (field === 'type') {
                if (['single_choice','multi_choice'].includes(value)) updated.options = ['',''];
                else updated.options = [];
                updated.depends_on_question_index = null;
                updated.depends_on_answer = null;
            }
            if (field === 'depends_on_question_index') {
                updated.depends_on_answer = null; // reset answer when parent changes
            }
            return updated;
        }));
    }, []);

    const handleMove = (idx, dir) => {
        setQuestions(prev => {
            const arr = [...prev];
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= arr.length) return arr;
            [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
            return arr;
        });
    };

    const validate = () => {
        const e = {};
        if (!title.trim()) e.title = 'Survey title is required.';
        if (!questions.length) e.questions = 'Add at least one question.';
        questions.forEach((q, i) => {
            if (!q.question.trim()) e[`q_${i}`] = 'required';
            if (['single_choice','multi_choice'].includes(q.type)) {
                const filled = (q.options||[]).filter(o=>o.trim());
                if (filled.length < 2) e[`q_${i}_opts`] = 'Need at least 2 options';
            }
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (submitStatus) => {
        if (!validate()) return;
        setSaving(true);
        const payload = {
            title, description, status: submitStatus,
            is_anonymous: isAnonymous,
            closes_at: closesAt || null,
            questions: questions.map(q => ({
                id: q.id,
                question: q.question,
                type: q.type,
                options: (q.options||[]).filter(o=>o.trim()),
                is_required: q.is_required,
                depends_on_question_index: q.depends_on_question_index,
                depends_on_answer: q.depends_on_answer,
            })),
        };
        if (mode==='edit' && editSurvey?.id) {
            router.put(`/hr/surveys/${editSurvey.id}`, payload, {
                onSuccess:()=>setSaving(false),
                onError:(errs)=>{ setSaving(false); setErrors(errs); },
            });
        } else {
            router.post('/hr/surveys', payload, {
                onSuccess:()=>setSaving(false),
                onError:(errs)=>{ setSaving(false); setErrors(errs); },
            });
        }
    };

    const isEdit = mode === 'edit';
console.log('editSurvey questions:', editSurvey?.questions);
    return (
        <AppLayout title={isEdit ? 'Edit Survey' : 'Create Survey'}>
            <Head title={isEdit ? 'Edit Survey' : 'Create Survey'}/>
            <style>{`
                @keyframes sv-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes sv-spin { to{transform:rotate(360deg)} }
                .sv-q-enter { animation: sv-fade .2s ease both; }
            `}</style>

            <div style={{ maxWidth:860, margin:'0 auto', animation:'sv-fade .3s ease' }}>

                {/* ── Hero Header ──────────────────────────── */}
                <div style={{
                    background: isEdit
                        ? 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)'
                        : 'linear-gradient(135deg,#3b0764 0%,#4f46e5 50%,#7c3aed 100%)',
                    borderRadius:20, padding:'28px 32px 0', marginBottom:20,
                    position:'relative', overflow:'hidden',
                }}>
                    {/* Decorative circles */}
                    <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
                    <div style={{ position:'absolute', bottom:-60, left:20, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

                    <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                        <div>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                                <div style={{ width:42, height:42, borderRadius:13, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, border:'1.5px solid rgba(255,255,255,0.2)' }}>
                                    {isEdit ? '✏️' : '📋'}
                                </div>
                                <div>
                                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.55)' }}>
                                        Survey Builder
                                    </div>
                                    <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.3px', lineHeight:1.2 }}>
                                        {isEdit ? 'Edit Survey' : 'New Survey'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:20, maxWidth:480 }}>
                                {isEdit
                                    ? 'Update your survey content, questions, and settings.'
                                    : 'Build a survey with conditional logic, multiple question types, and smart settings.'}
                            </div>
                        </div>
                        <button onClick={()=>router.visit('/hr/surveys')} style={{
                            padding:'8px 16px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.2)',
                            background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.8)',
                            fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                            display:'flex', alignItems:'center', gap:6, flexShrink:0, backdropFilter:'blur(4px)',
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                            Back
                        </button>
                    </div>

                   
                </div>

                {/* ── Main content: 2-column ─────────────── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'start' }}>

                    {/* Left — Questions */}
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                        {/* Survey Details card */}
                        <div style={{ background:theme.panel, borderRadius:18, border:`1px solid ${theme.border}`, overflow:'hidden', boxShadow:theme.shadow }}>
                            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${theme.border}`, display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:8, background:theme.primarySoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>📝</div>
                                <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>Survey Details</span>
                            </div>
                            <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
                                <Field label="Title *" error={errors.title}>
                                    <input value={title} onChange={e=>setTitle(e.target.value)}
                                        placeholder="e.g. Q2 Employee Satisfaction Survey"
                                        style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${errors.title?theme.danger:theme.inputBorder}`, background:theme.inputBg, color:theme.text, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color .15s' }}
                                        onFocus={e=>e.target.style.borderColor=theme.borderFocus}
                                        onBlur={e=>e.target.style.borderColor=errors.title?theme.danger:theme.inputBorder}/>
                                </Field>
                                <Field label="Description">
                                    <textarea value={description} onChange={e=>setDescription(e.target.value)}
                                        placeholder="Optional — briefly describe what this survey is about."
                                        rows={2}
                                        style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${theme.inputBorder}`, background:theme.inputBg, color:theme.text, fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box' }}
                                        onFocus={e=>e.target.style.borderColor=theme.borderFocus}
                                        onBlur={e=>e.target.style.borderColor=theme.inputBorder}/>
                                </Field>
                            </div>
                        </div>

                        {/* Questions */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <span style={{ fontSize:14, fontWeight:800, color:theme.text }}>Questions</span>
                                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:theme.primarySoft, color:theme.primary }}>{questions.length}</span>
                            </div>
                            {errors.questions && <span style={{ fontSize:11, color:theme.danger }}>{errors.questions}</span>}
                        </div>

                        {questions.map((q, idx) => (
                            <div key={q._key} className="sv-q-enter">
                                <QuestionCard
                                    q={q} idx={idx} total={questions.length}
                                    questions={questions} dark={dark} theme={theme}
                                    onChange={handleQuestionChange}
                                    onRemove={(i)=>setQuestions(prev=>prev.filter((_,x)=>x!==i))}
                                    onMove={handleMove}
                                />
                            </div>
                        ))}

                        {/* Add Question */}
                        <button onClick={()=>setQuestions(prev=>[...prev, newQuestion()])} style={{
                            padding:'14px', borderRadius:16, border:`2px dashed ${theme.border}`,
                            background:'transparent', color:theme.primary, fontSize:13, fontWeight:700,
                            cursor:'pointer', fontFamily:'inherit',
                            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                            transition:'all .2s',
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=theme.primary;e.currentTarget.style.background=theme.primarySoft;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=theme.border;e.currentTarget.style.background='transparent';}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add Question
                        </button>
                    </div>

                    {/* Right sidebar — Settings + Actions */}
                    <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:20 }}>

                        {/* Settings card */}
                        <div style={{ background:theme.panel, borderRadius:18, border:`1px solid ${theme.border}`, overflow:'hidden', boxShadow:theme.shadow }}>
                            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${theme.border}`, display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:8, background:'rgba(5,150,105,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚙️</div>
                                <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>Settings</span>
                            </div>
                            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:16 }}>

                                {/* Close date */}
                                <Field label="Close Date">
                                    <input type="date" value={closesAt} onChange={e=>setClosesAt(e.target.value)}
                                        style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:`1.5px solid ${theme.inputBorder}`, background:theme.inputBg, color:theme.text, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                                        onFocus={e=>e.target.style.borderColor=theme.borderFocus}
                                        onBlur={e=>e.target.style.borderColor=theme.inputBorder}/>
                                </Field>

                                {/* Anonymous toggle */}
                                <div style={{ padding:'12px 14px', borderRadius:12, background:isAnonymous?(dark?'rgba(99,102,241,0.08)':'#f5f3ff'):(dark?theme.panelSoft:theme.cardBg), border:`1px solid ${isAnonymous?(dark?'rgba(99,102,241,0.2)':'#ddd6fe'):theme.border}`, transition:'all .2s' }}>
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                                        <span style={{ fontSize:13, fontWeight:700, color:isAnonymous?'#6366f1':theme.text }}>
                                            🔒 Anonymous
                                        </span>
                                        <button type="button" onClick={()=>setIsAnonymous(v=>!v)} style={{
                                            width:40, height:22, borderRadius:99, border:'none', cursor:'pointer', flexShrink:0,
                                            background: isAnonymous ? '#6366f1' : (dark?'rgba(148,163,184,0.25)':'#cbd5e1'),
                                            position:'relative', transition:'background .2s',
                                        }}>
                                            <span style={{ position:'absolute', top:3, left:isAnonymous?21:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
                                        </button>
                                    </div>
                                    <div style={{ fontSize:11, color:isAnonymous?'#6366f1':theme.textMute, lineHeight:1.5 }}>
                                        {isAnonymous
                                            ? 'Responses collected without names. HR cannot see who answered.'
                                            : 'Respondent names are recorded. HR can see who answered.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary card */}
                        <div style={{ background:theme.panel, borderRadius:18, border:`1px solid ${theme.border}`, padding:'16px 18px', boxShadow:theme.shadow }}>
                            <div style={{ fontSize:11, fontWeight:700, color:theme.textMute, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:12 }}>Summary</div>
                            {[
                                { label:'Questions', value:questions.length, color:theme.primary },
                                { label:'Required',  value:questions.filter(q=>q.is_required).length, color:'#059669' },
                                { label:'Conditional', value:questions.filter(q=>q.depends_on_question_index!==null&&q.depends_on_question_index!==undefined).length, color:'#6366f1' },
                            ].map(s => (
                                <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${theme.border}` }}>
                                    <span style={{ fontSize:12, color:theme.textSoft }}>{s.label}</span>
                                    <span style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            <button onClick={()=>handleSubmit('draft')} disabled={saving} style={{
                                width:'100%', padding:'11px', borderRadius:12,
                                border:`1.5px solid ${theme.border}`,
                                background: dark?'rgba(255,255,255,0.05)':theme.cardBg,
                                color:theme.textSoft, fontSize:13, fontWeight:700,
                                cursor:'pointer', fontFamily:'inherit',
                                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                                transition:'all .15s', opacity:saving?.7:1,
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                Save as Draft
                            </button>
                            <button onClick={()=>handleSubmit('active')} disabled={saving} style={{
                                width:'100%', padding:'12px',borderRadius:12, border:'none',
                                background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                                color:'#fff', fontSize:13, fontWeight:800,
                                cursor:saving?'not-allowed':'pointer', fontFamily:'inherit',
                                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                                boxShadow:'0 6px 20px rgba(124,58,237,0.35)',
                                transition:'all .2s', opacity:saving?.7:1,
                            }}
                            onMouseEnter={e=>{if(!saving)e.currentTarget.style.transform='translateY(-1px)';}}
                            onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                                {saving
                                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'sv-spin .7s linear infinite'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                }
                                {saving ? 'Saving...' : 'Publish Survey'}
                            </button>
                          
                        </div>
                    </div>
                </div>

                <div style={{ height:40 }}/>
            </div>
        </AppLayout>
    );
}