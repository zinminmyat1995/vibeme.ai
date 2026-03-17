// resources/js/Components/SmartMail/ComposeModal.jsx

import { useState, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

const FLAGS = {
    en: <svg width="16" height="12" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="13"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8"/></svg>,
    ja: <svg width="16" height="12" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="12" fill="#BC002D"/></svg>,
    my: <svg width="16" height="12" viewBox="0 0 60 40"><rect width="60" height="40" fill="#FECB00"/><rect y="13" width="60" height="14" fill="#34B233"/><rect y="27" width="60" height="13" fill="#EA2839"/><polygon points="30,4 33,14 43,14 35,20 38,30 30,24 22,30 25,20 17,14 27,14" fill="#fff"/></svg>,
    km: <svg width="20" height="14" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}><rect width="900" height="600" fill="#032EA1"/><rect width="900" height="300" y="150" fill="#E00025"/><g fill="white"><rect x="375" y="215" width="150" height="170"/><rect x="363" y="195" width="40"  height="25"/><rect x="430" y="175" width="40"  height="45"/><rect x="497" y="195" width="40"  height="25"/><rect x="330" y="235" width="48"  height="150"/><rect x="522" y="235" width="48"  height="150"/></g></svg>,
    vi: <svg width="16" height="12" viewBox="0 0 60 40"><rect width="60" height="40" fill="#DA251D"/><polygon points="30,7 33,18 44,18 35,25 38,36 30,29 22,36 25,25 16,18 27,18" fill="#FFFF00"/></svg>,
    ko: <svg width="16" height="12" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="10" fill="#CD2E3A"/><path d="M30,10 A10,10 0 0,1 30,20 A5,5 0 0,1 30,10z" fill="#0047A0"/><line x1="8" y1="8" x2="16" y2="16" stroke="#000" strokeWidth="2"/><line x1="10" y1="6" x2="18" y2="14" stroke="#000" strokeWidth="2"/><line x1="44" y1="24" x2="52" y2="32" stroke="#000" strokeWidth="2"/><line x1="42" y1="26" x2="50" y2="34" stroke="#000" strokeWidth="2"/></svg>,
};

const LANGUAGES = [
    { code:'en', label:'English',    flag: FLAGS.en },
    { code:'ja', label:'Japanese',   flag: FLAGS.ja },
    { code:'my', label:'Burmese',    flag: FLAGS.my },
    { code:'km', label:'Khmer',      flag: FLAGS.km },
    { code:'vi', label:'Vietnamese', flag: FLAGS.vi },
    { code:'ko', label:'Korean',     flag: FLAGS.ko },
];

const TONES = [
    { value:'professional', label:'Professional' },
    { value:'friendly',     label:'Friendly'     },
    { value:'formal',       label:'Formal'       },
    { value:'casual',       label:'Casual'       },
];

// highlight {variable} in HTML
function highlightVars(html) {
    return html.replace(/\{(\w+)\}/g, (match) =>
        `<mark data-var="${match}" style="background:#ede9fe;color:#7c3aed;border-radius:4px;padding:1px 6px;font-weight:700;cursor:pointer;">${match}</mark>`
    );
}

// ── Rich Toolbar ───────────────────────────
function RichToolbar({ editorRef }) {
    const exec = (cmd, val = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
    };
    const b = (onClick, children, title) => (
        <button type="button" title={title}
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            style={{ padding:'4px 8px', border:'1px solid #e5e7eb', borderRadius:6, background:'#f9fafb', cursor:'pointer', fontSize:12, fontWeight:700, color:'#374151', minWidth:28 }}>
            {children}
        </button>
    );
    return (
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', padding:'8px 10px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', alignItems:'center' }}>
            {b(() => exec('bold'),          <strong>B</strong>, 'Bold')}
            {b(() => exec('italic'),        <em>I</em>,         'Italic')}
            {b(() => exec('underline'),     <u>U</u>,           'Underline')}
            {b(() => exec('strikeThrough'), <s>S</s>,           'Strike')}
            <div style={{ width:1, background:'#e5e7eb', height:20, margin:'0 2px' }} />
            {b(() => exec('insertUnorderedList'), '• List', 'Bullet')}
            {b(() => exec('insertOrderedList'),   '1. List','Numbered')}
            <div style={{ width:1, background:'#e5e7eb', height:20, margin:'0 2px' }} />
            {b(() => exec('justifyLeft'),   '⬅', 'Left')}
            {b(() => exec('justifyCenter'), '≡',  'Center')}
            {b(() => exec('justifyRight'),  '➡', 'Right')}
            <div style={{ width:1, background:'#e5e7eb', height:20, margin:'0 2px' }} />
            <select onMouseDown={e => e.stopPropagation()}
                onChange={e => exec('fontSize', e.target.value)} defaultValue="3"
                style={{ padding:'3px 6px', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, background:'#f9fafb', cursor:'pointer' }}>
                <option value="1">Small</option>
                <option value="3">Normal</option>
                <option value="5">Large</option>
                <option value="7">X-Large</option>
            </select>
        </div>
    );
}

// ── Template Variables Modal ───────────────
function TemplateVarsModal({ open, template, onClose, onApply }) {
    const [vars, setVars] = useState({});

    useEffect(() => {
        if (template?.variables) {
            const init = {};
            template.variables.forEach(v => { init[v] = ''; });
            setVars(init);
        }
    }, [template]);

    if (!open || !template) return null;

    return (
        <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', width:'100%', maxWidth:460, maxHeight:'80vh', overflowY:'auto' }}>
                <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                        <h3 style={{ fontSize:15, fontWeight:800, color:'#111827', margin:0 }}>{template.icon} {template.name}</h3>
                        <p style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>Fill in the template variables below</p>
                    </div>
                    <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:18, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                </div>
                <div style={{ padding:'16px 24px', display:'flex', flexDirection:'column', gap:12 }}>
                    {template.variables?.map(v => (
                        <div key={v}>
                            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>
                                {v.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                                <span style={{ fontSize:10, color:'#9ca3af', fontWeight:400, marginLeft:6 }}>{`{${v}}`}</span>
                            </label>
                            <input value={vars[v]||''} onChange={e => setVars(p => ({...p,[v]:e.target.value}))}
                                placeholder={`Enter ${v.replace(/_/g,' ')}...`}
                                style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:13, outline:'none', color:'#111827', boxSizing:'border-box' }} />
                        </div>
                    ))}
                </div>
                <div style={{ padding:'0 24px 20px', display:'flex', gap:10, justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'8px 20px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                    <button onClick={() => { onApply(vars); onClose(); }}
                        style={{ padding:'8px 24px', borderRadius:10, border:'none', background:'#7c3aed', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        ✓ Apply Template
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── To Field ──────────────────────────────
function ToField({ value = [], onChange, systemUsers = [] }) {
    const [query, setQuery] = useState('');
    const [show, setShow]   = useState(false);
    const inputRef          = useRef(null);

    const filtered = query.length > 0
        ? systemUsers.filter(u =>
            (u.name.toLowerCase().includes(query.toLowerCase()) ||
             u.email.toLowerCase().includes(query.toLowerCase())) &&
            !value.includes(u.email)
          )
        : [];

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    const addEmail = (email) => {
        const e = email.trim().toLowerCase();
        if (!e || !isValidEmail(e) || value.includes(e)) return;
        onChange([...value, e]);
        setQuery('');
        setShow(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const removeEmail = (email) => onChange(value.filter(e => e !== email));

    const handleKeyDown = (e) => {
        if (['Enter',',' ,'Tab'].includes(e.key) && query.trim()) {
            e.preventDefault();
            addEmail(query);
            return;
        }
        if (e.key === 'Backspace' && !query && value.length > 0) {
            removeEmail(value[value.length - 1]);
        }
    };

    // FIX 4: show dropdown after adding a tag too
    const handleChange = (e) => {
        setQuery(e.target.value);
        setShow(e.target.value.length > 0);
    };

    return (
        <div style={{ position:'relative' }}>
            <div onClick={() => inputRef.current?.focus()}
                style={{ display:'flex', flexWrap:'wrap', gap:4, padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:10, background:'#f9fafb', minHeight:38, alignItems:'center', cursor:'text' }}>
                {value.map(email => (
                    <span key={email} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', background:'#ede9fe', color:'#7c3aed', borderRadius:99, fontSize:12, fontWeight:600 }}>
                        {email}
                        <button type="button" onClick={e => { e.stopPropagation(); removeEmail(email); }}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#7c3aed', fontSize:14, lineHeight:1, padding:0, display:'flex', alignItems:'center' }}>×</button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        // FIX 3: if valid email typed but not confirmed, add it on blur
                        if (query.trim() && isValidEmail(query)) {
                            addEmail(query);
                        }
                        setTimeout(() => setShow(false), 200);
                    }}
                    onFocus={() => { if (query.length > 0) setShow(true); }}
                    placeholder={value.length === 0 ? 'Type email + Enter, or search user...' : ''}
                    style={{ border:'none', outline:'none', background:'transparent', fontSize:12, color:'#374151', flex:1, minWidth:160, padding:'2px 0' }}
                />
            </div>

            {/* Autocomplete */}
            {show && filtered.length > 0 && (
                <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:500, background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', maxHeight:200, overflowY:'auto' }}>
                    {filtered.map(u => (
                        <button key={u.id} type="button"
                            onMouseDown={e => { e.preventDefault(); addEmail(u.email); }}
                            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', border:'none', background:'transparent', cursor:'pointer', textAlign:'left' }}
                            onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <div style={{ width:30, height:30, borderRadius:'50%', background:'#7c3aed', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{u.name}</div>
                                <div style={{ fontSize:11, color:'#9ca3af' }}>{u.email}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────
export default function ComposeModal({
    open, onClose, onSuccess,
    systemUsers  = [],
    templates    = [],
    hasApi       = false,
    replyTo      = null,
    forwardMail  = null,
}) {
    // FIX 5: don't render at all when closed — prevents React hook errors
    if (!open) return null;

    return <ComposeInner
        onClose={onClose} onSuccess={onSuccess}
        systemUsers={systemUsers} templates={templates}
        hasApi={hasApi} replyTo={replyTo} forwardMail={forwardMail}
    />;
}

// Separate inner component so hooks always run consistently
function ComposeInner({ onClose, onSuccess, systemUsers, templates, hasApi, replyTo, forwardMail }) {

    // FIX 1: use ref only for editor, never dangerouslySetInnerHTML
    const editorRef          = useRef(null);
    const editorReady        = useRef(false);

    const [toAddresses, setToAddresses]   = useState(replyTo ? [replyTo.from_address].filter(Boolean) : []);
    const [ccAddresses, setCcAddresses]   = useState([]);
    const [bccAddresses, setBccAddresses] = useState([]);
    const [subject, setSubject]           = useState(replyTo ? `Re: ${replyTo.subject||''}` : forwardMail ? `Fwd: ${forwardMail.subject||''}` : '');
    const [aiGenerated, setAiGenerated]   = useState(false);
    const [templateUsed, setTemplateUsed] = useState(null);
    const [attachFiles, setAttachFiles]   = useState([]);
    const [attachPreviews, setAttachPreviews] = useState([]);
    const [showCC, setShowCC]             = useState(false);
    const [showBCC, setShowBCC]           = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateModal, setTemplateModal] = useState({ open:false, template:null });
    const [aiMode, setAiMode]             = useState(null);
    const [aiPrompt, setAiPrompt]         = useState('');
    const [aiTone, setAiTone]             = useState('professional');
    const [aiLoading, setAiLoading]       = useState(false);
    const [translateLang, setTranslateLang] = useState('');
    const [translatePreview, setTranslatePreview] = useState(null);
    const [errors, setErrors]             = useState({});
    const [sending, setSending]           = useState(false);

    const { props } = usePage();
    
    // FIX 1: set initial content via ref ONCE after mount
    useEffect(() => {
        if (editorRef.current && !editorReady.current) {
            editorReady.current = true;
            let initial = '';
            if (forwardMail) initial = `<br><br>---------- Forwarded message ----------<br>${forwardMail.body_html||''}`;
            else if (replyTo) initial = `<br><br><blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#6b7280">${replyTo.body_html||''}</blockquote>`;
            editorRef.current.innerHTML = initial;

            // Place cursor at the beginning
            const range = document.createRange();
            range.setStart(editorRef.current, 0);
            range.collapse(true);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            editorRef.current.focus();
        }
    }, []);

    const getContent = () => editorRef.current?.innerHTML || '';

    const setContent = (html, highlight = false) => {
        if (editorRef.current) {
            editorRef.current.innerHTML = highlight ? highlightVars(html) : html;
        }
    };

    const csrf = () => props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';

    // FIX 2: Template — show variable fill modal
    const handleTemplateClick = (t) => {
        setShowTemplates(false);
        setTemplateModal({ open:true, template:t });
    };

    const handleTemplateApply = (vars) => {
        let body = templateModal.template.body_template;
        let subj = templateModal.template.subject_template;
        Object.entries(vars).forEach(([k, v]) => {
            if (v) {
                body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
                subj = subj.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
            }
        });
        setSubject(subj);
        setContent(body, true); // remaining {vars} highlighted purple
        setTemplateUsed(templateModal.template.slug);
    };

    // AI
    const aiPost = async (url, body) => {
        const res = await window.apiFetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
        });
        return res.json();
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt) return;
        setAiLoading(true);
        try {
            const data = await aiPost('/smart-mail/ai/generate', { prompt:aiPrompt, tone:aiTone });
            if (data.success) { setSubject(data.result.subject); setContent(data.result.body); setAiGenerated(true); setAiMode(null); }
        } catch {}
        setAiLoading(false);
    };

    const handleAiImprove = async () => {
        setAiLoading(true);
        try {
            const data = await aiPost('/smart-mail/ai/improve', { content:getContent() });
            if (data.success) { setContent(data.improved); setAiMode(null); }
        } catch {}
        setAiLoading(false);
    };

    const handleTranslatePreview = async () => {
        if (!translateLang) return;
        setAiLoading(true);
        try {
            const data = await aiPost('/smart-mail/ai/translate-preview', { content:getContent(), language:translateLang });
            if (data.success) setTranslatePreview(data.translated);
        } catch {}
        setAiLoading(false);
    };

    const handleAttach = (e) => {
        const files = Array.from(e.target.files);
        setAttachPreviews(p => [...p, ...files.map(f => ({ name:f.name, size:(f.size/1024).toFixed(1)+' KB' }))]);
        setAttachFiles(p => [...p, ...files]);
    };

    // FIX 3: validate toAddresses array length
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (toAddresses.length === 0) {
            setErrors({ to:'Please add at least one recipient.' });
            return;
        }

        setSending(true);

        const fd = new FormData();
        toAddresses.forEach(a      => fd.append('to_addresses[]', a));
        ccAddresses.forEach(a      => fd.append('cc_addresses[]', a));
        bccAddresses.forEach(a     => fd.append('bcc_addresses[]', a));
        fd.append('subject', subject.trim() || '(No Subject)');
        fd.append('body_html',      getContent());
        fd.append('ai_generated',   aiGenerated ? '1' : '0');
        if (templateUsed) fd.append('template_used', templateUsed);
        attachFiles.forEach(f => fd.append('attachments[]', f));

        try {
            // ✅ window.apiFetch သုံး — Content-Type မထည့်ရ (FormData က auto set လုပ်တယ်)
            const res = await window.apiFetch('/smart-mail/send', {
                method: 'POST',
                body:   fd,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                onSuccess?.('Mail sent successfully! ✉️', data.mail ?? null);
                onClose();
            } else {
                setErrors(data.errors || { send: data.message || 'Failed to send.' });
            }
        } catch (err) {
            console.error('Send error:', err);
            setErrors({ send: 'Network error. Please try again.' });
        }

        setSending(false);
    };

    const spin = { width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' };

    return (
        <>
            <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:20, pointerEvents:'none' }}>
                <div style={{ pointerEvents:'all', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', width:'100%', maxWidth:660, maxHeight:'92vh', display:'flex', flexDirection:'column', animation:'slideUp 0.2s ease' }}>

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#7c3aed', borderRadius:'20px 20px 0 0', flexShrink:0 }}>
                        <h3 style={{ fontSize:15, fontWeight:800, color:'#fff', margin:0 }}>
                            {replyTo ? '↩️ Reply' : forwardMail ? '↪️ Forward' : '✏️ New Message'}
                        </h3>
                        <div style={{ display:'flex', gap:8 }}>
                            <div style={{ position:'relative' }}>
                                <button type="button" onClick={() => setShowTemplates(!showTemplates)}
                                    style={{ padding:'5px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                                    📋 Templates
                                </button>
                                {showTemplates && (
                                    <div style={{ position:'absolute', top:'110%', right:0, zIndex:300, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', padding:8, minWidth:230, maxHeight:320, overflowY:'auto' }}>
                                        {templates.map(t => (
                                            <button key={t.id} type="button" onClick={() => handleTemplateClick(t)}
                                                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:'none', background:'transparent', cursor:'pointer', borderRadius:8, textAlign:'left' }}
                                                onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                                                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                                                <span style={{ fontSize:20 }}>{t.icon}</span>
                                                <div>
                                                    <div style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{t.name}</div>
                                                    <div style={{ fontSize:10, color:'#9ca3af', textTransform:'capitalize' }}>{t.category}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:18, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>

                        {/* To / CC / BCC / Subject */}
                        <div style={{ padding:'14px 20px', display:'flex', flexDirection:'column', gap:10, borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
                            <div>
                                <div style={{ display:'flex', alignItems:'center', marginBottom:4 }}>
                                    <label style={{ fontSize:12, fontWeight:700, color:'#374151', minWidth:32 }}>To</label>
                                    <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                                        <button type="button" onClick={() => setShowCC(!showCC)}
                                            style={{ fontSize:11, color:showCC?'#7c3aed':'#9ca3af', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>CC</button>
                                        <button type="button" onClick={() => setShowBCC(!showBCC)}
                                            style={{ fontSize:11, color:showBCC?'#7c3aed':'#9ca3af', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>BCC</button>
                                    </div>
                                </div>
                                {replyTo ? (
                                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:10, background:'#f3f4f6', minHeight:38 }}>
                                        <span style={{ padding:'2px 8px', background:'#ede9fe', color:'#7c3aed', borderRadius:99, fontSize:12, fontWeight:600 }}>
                                            {replyTo.from_address}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <ToField value={toAddresses} onChange={setToAddresses} systemUsers={systemUsers} />
                                        {errors.to && <p style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>⚠ {errors.to}</p>}
                                    </>
                                )}
                            </div>
                            {showCC && (
                                <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>CC</label>
                                    <ToField value={ccAddresses} onChange={setCcAddresses} systemUsers={systemUsers} />
                                </div>
                            )}
                            {showBCC && (
                                <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>BCC</label>
                                    <ToField value={bccAddresses} onChange={setBccAddresses} systemUsers={systemUsers} />
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }}>Subject</label>
                                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..."
                                    style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:13, outline:'none', color:'#111827', boxSizing:'border-box' }} />
                            </div>
                        </div>

                        {/* AI Toolbar */}
                        <div style={{ display:'flex', gap:6, padding:'8px 20px', borderBottom:'1px solid #f3f4f6', background:'#fafafa', flexWrap:'wrap', flexShrink:0, alignItems:'center' }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginRight:4 }}>AI:</span>
                            {[
                                { mode:'generate',  label:'✨ Write',    color:'#7c3aed', bg:'#ede9fe' },
                                { mode:'improve',   label:'🔧 Improve',  color:'#059669', bg:'#d1fae5' },
                                { mode:'translate', label:'🌐 Translate', color:'#2563eb', bg:'#dbeafe' },
                            ].map(a => (
                                <button key={a.mode} type="button" onClick={() => setAiMode(aiMode===a.mode?null:a.mode)}
                                    style={{ padding:'5px 12px', borderRadius:99, border:`1px solid ${aiMode===a.mode?a.color:'#e5e7eb'}`, background:aiMode===a.mode?a.bg:'#fff', color:aiMode===a.mode?a.color:'#6b7280', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                    {a.label}
                                </button>
                            ))}
                            {!hasApi && <span style={{ fontSize:10, color:'#f59e0b', background:'#fef3c7', padding:'2px 8px', borderRadius:99 }}>⚠ Demo mode</span>}
                        </div>

                        {/* AI Panel */}
                        {aiMode && (
                            <div style={{ padding:'12px 20px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
                                {aiMode === 'generate' && (
                                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe the email..."
                                            style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid #e5e7eb', background:'#fff', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                                        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                                            <span style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>Tone:</span>
                                            {TONES.map(t => (
                                                <button key={t.value} type="button" onClick={() => setAiTone(t.value)}
                                                    style={{ padding:'4px 10px', borderRadius:99, border:`1px solid ${aiTone===t.value?'#7c3aed':'#e5e7eb'}`, background:aiTone===t.value?'#ede9fe':'#fff', color:aiTone===t.value?'#7c3aed':'#6b7280', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                                                    {t.label}
                                                </button>
                                            ))}
                                            <button type="button" onClick={handleAiGenerate} disabled={aiLoading||!aiPrompt}
                                                style={{ marginLeft:'auto', padding:'5px 14px', borderRadius:8, border:'none', background:aiLoading?'#c4b5fd':'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                                                {aiLoading?<><span style={spin}/>Generating...</>:'✨ Generate'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {aiMode === 'improve' && (
                                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                        <span style={{ fontSize:12, color:'#6b7280', flex:1 }}>AI will improve grammar, tone and clarity.</span>
                                        <button type="button" onClick={handleAiImprove} disabled={aiLoading}
                                            style={{ padding:'5px 14px', borderRadius:8, border:'none', background:aiLoading?'#86efac':'#059669', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                                            {aiLoading?<><span style={spin}/>Improving...</>:'🔧 Improve Now'}
                                        </button>
                                    </div>
                                )}
                                {aiMode === 'translate' && (
                                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                                            {LANGUAGES.map(l => (
                                                <button key={l.code} type="button" onClick={() => setTranslateLang(l.code)}
                                                    style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, border:`1px solid ${translateLang===l.code?'#2563eb':'#e5e7eb'}`, background:translateLang===l.code?'#dbeafe':'#fff', color:translateLang===l.code?'#2563eb':'#6b7280', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                                                    <span style={{ display:'flex', alignItems:'center', borderRadius:2, overflow:'hidden', flexShrink:0 }}>{l.flag}</span>
                                                    {l.label}
                                                </button>
                                            ))}
                                            <button type="button" onClick={handleTranslatePreview} disabled={aiLoading||!translateLang}
                                                style={{ padding:'5px 14px', borderRadius:8, border:'none', background:aiLoading?'#bfdbfe':'#2563eb', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                                                {aiLoading?<><span style={spin}/>Translating...</>:'👁 Preview'}
                                            </button>
                                        </div>
                                        {translatePreview && (
                                            <div style={{ padding:'10px 12px', background:'#eff6ff', borderRadius:10, border:'1px solid #bfdbfe', fontSize:12, color:'#1e40af', maxHeight:100, overflowY:'auto' }}>
                                                <strong style={{ display:'block', marginBottom:4, fontSize:11 }}>Preview:</strong>
                                                {translatePreview}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Editor — FIX 1: ref only, no dangerouslySetInnerHTML */}
                        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
                            <RichToolbar editorRef={editorRef} />
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                style={{ flex:1, padding:'14px 20px', outline:'none', overflowY:'auto', fontSize:13, color:'#374151', lineHeight:1.7, minHeight:140, wordBreak:'break-word' }}
                            />
                        </div>

                        {/* Attachments */}
                        {attachPreviews.length > 0 && (
                            <div style={{ padding:'8px 20px', borderTop:'1px solid #f3f4f6', display:'flex', gap:8, flexWrap:'wrap', flexShrink:0 }}>
                                {attachPreviews.map((a,i) => (
                                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8 }}>
                                        <span>📎</span>
                                        <span style={{ fontSize:11, fontWeight:600, color:'#374151' }}>{a.name}</span>
                                        <span style={{ fontSize:10, color:'#9ca3af' }}>{a.size}</span>
                                        <button type="button" onClick={() => {
                                            setAttachPreviews(p => p.filter((_,idx)=>idx!==i));
                                            setAttachFiles(p => p.filter((_,idx)=>idx!==i));
                                        }} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14 }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderTop:'1px solid #f3f4f6', flexShrink:0 }}>
                            <label style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                                📎 Attach <input type="file" multiple style={{ display:'none' }} onChange={handleAttach} />
                            </label>
                            {errors.send && <span style={{ fontSize:11, color:'#ef4444' }}>❌ {errors.send}</span>}
                            <div style={{ flex:1 }} />
                            <button type="button" onClick={onClose}
                                style={{ padding:'8px 20px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                                Discard
                            </button>
                            <button type="submit" disabled={sending}
                                style={{ padding:'8px 24px', borderRadius:10, border:'none', background:sending?'#c4b5fd':'#7c3aed', color:'#fff', fontSize:13, fontWeight:700, cursor:sending?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
                                {sending?<><span style={spin}/>Sending...</>:'📤 Send'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Template Vars Modal */}
            <TemplateVarsModal
                open={templateModal.open}
                template={templateModal.template}
                onClose={() => setTemplateModal({ open:false, template:null })}
                onApply={handleTemplateApply}
            />

            <style>{`
                @keyframes spin    { to { transform:rotate(360deg); } }
                @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
                [contenteditable] { caret-color: #7c3aed; }
            `}</style>
        </>
    );
}