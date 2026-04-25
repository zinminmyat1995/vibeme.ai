// resources/js/Components/HrChatbotWidget.jsx
// v3 — Quick actions + Date separators + Lazy load + Expanded scope
import { useState, useRef, useEffect, useCallback } from 'react';

// ── Date separator helpers ─────────────────────────────────────
function getDateLabel(isoString) {
    const d    = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const fmt = (dt) => dt.toDateString();
    if (fmt(d) === fmt(today))     return 'Today';
    if (fmt(d) === fmt(yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
}

function shouldShowDateSep(messages, index) {
    if (index === 0) return true;
    const cur  = new Date(messages[index].time);
    const prev = new Date(messages[index - 1].time);
    return cur.toDateString() !== prev.toDateString();
}

// ── Formatted text ─────────────────────────────────────────────
function FormattedText({ text, mutedColor }) {
    return (
        <span>
            {text.split('\n').map((line, li, arr) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <span key={li}>
                        {parts.map((part, pi) => {
                            if (part.startsWith('**') && part.endsWith('**'))
                                return <strong key={pi} style={{ fontWeight:600 }}>{part.slice(2,-2)}</strong>;
                            if (part.startsWith('- ') || part.startsWith('• '))
                                return (
                                    <span key={pi} style={{ display:'block', paddingLeft:12, marginTop:2 }}>
                                        <span style={{ color:mutedColor, marginRight:6 }}>•</span>
                                        {part.slice(2)}
                                    </span>
                                );
                            return <span key={pi}>{part}</span>;
                        })}
                        {li < arr.length - 1 && <br/>}
                    </span>
                );
            })}
        </span>
    );
}

// ── Typing dots ────────────────────────────────────────────────
function TypingDots({ color }) {
    return (
        <span style={{ display:'inline-flex', gap:3, alignItems:'center', padding:'2px 0' }}>
            {[0,1,2].map(i => (
                <span key={i} style={{
                    width:6, height:6, borderRadius:'50%', background:color,
                    display:'inline-block',
                    animation:`hrbot-bounce 1.2s ease-in-out ${i*0.2}s infinite`,
                }}/>
            ))}
        </span>
    );
}

function makeWelcome(userName) {
    return {
        id:'welcome', role:'assistant', from_cache:false,
        content:`Hi ${userName || 'there'}! 👋 I'm your HR assistant. Tap a quick action or ask me anything about leave, attendance, payroll, or HR policies.`,
        time: new Date().toISOString(),
    };
}

export default function HrChatbotWidget({ user, darkMode }) {
    const userName = user?.name?.split(' ')[0] || 'there';
    const userRole = user?.role?.name || 'employee';

    const [open, setOpen]           = useState(false);
    const [input, setInput]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore]     = useState(false);
    const [messages, setMessages]   = useState([makeWelcome(userName)]);
    const [quickActions, setQuickActions] = useState([]);
    const [pulse, setPulse]         = useState(false);
    const [unread, setUnread]       = useState(0);
    const [initialized, setInitialized] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesTopRef = useRef(null);
    const inputRef       = useRef(null);
    const scrollRef      = useRef(null);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    // ── Theme ──────────────────────────────────────────────────
    const t = darkMode ? {
        bg:'#0f1b34', header:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        border:'rgba(148,163,184,0.12)', inputBg:'rgba(255,255,255,0.06)',
        inputBorder:'rgba(148,163,184,0.18)', inputText:'#f1f5f9',
        userBubble:'linear-gradient(135deg,#4f46e5,#7c3aed)', userText:'#ffffff',
        botBubble:'rgba(255,255,255,0.07)', botText:'#e2e8f0', botMuted:'#94a3b8',
        time:'#64748b', dateSep:'rgba(148,163,184,0.12)', dateSepText:'#64748b',
        qaBg:'rgba(255,255,255,0.05)', qaBorder:'rgba(148,163,184,0.15)', qaText:'#94a3b8',
        shadow:'0 24px 60px rgba(0,0,0,0.55),0 8px 20px rgba(79,70,229,0.2)',
        fabBg:'linear-gradient(135deg,#4f46e5,#7c3aed)', fabShadow:'0 8px 24px rgba(124,58,237,0.45)',
        scrollThumb:'rgba(148,163,184,0.15)', sendBg:'linear-gradient(135deg,#4f46e5,#7c3aed)',
        sendDisabled:'rgba(255,255,255,0.08)',
        cachedBadgeBg:'rgba(74,222,128,0.15)', cachedBadgeText:'#4ade80',
        loadMoreBg:'rgba(255,255,255,0.04)', loadMoreText:'#64748b',
    } : {
        bg:'#ffffff', header:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
        border:'rgba(15,23,42,0.08)', inputBg:'#f8fafc',
        inputBorder:'rgba(15,23,42,0.1)', inputText:'#0f172a',
        userBubble:'linear-gradient(135deg,#4f46e5,#7c3aed)', userText:'#ffffff',
        botBubble:'#f1f5f9', botText:'#1e293b', botMuted:'#64748b',
        time:'#94a3b8', dateSep:'rgba(15,23,42,0.06)', dateSepText:'#94a3b8',
        qaBg:'#f8fafc', qaBorder:'rgba(15,23,42,0.07)', qaText:'#64748b',
        shadow:'0 24px 60px rgba(15,23,42,0.18),0 8px 20px rgba(79,70,229,0.12)',
        fabBg:'linear-gradient(135deg,#4f46e5,#7c3aed)', fabShadow:'0 8px 24px rgba(79,70,229,0.35)',
        scrollThumb:'rgba(15,23,42,0.08)', sendBg:'linear-gradient(135deg,#4f46e5,#7c3aed)',
        sendDisabled:'rgba(15,23,42,0.08)',
        cachedBadgeBg:'rgba(22,163,74,0.1)', cachedBadgeText:'#16a34a',
        loadMoreBg:'#f8fafc', loadMoreText:'#94a3b8',
    };

    // ── Load messages from DB ───────────────────────────────────
    useEffect(() => {
        if (!open || initialized) return;
        setLoadingMsgs(true);
        fetch('/hr-chatbot/messages?limit=10', {
            headers:{ 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':csrf() },
        }).then(r => r.json()).then(data => {
            const dbMsgs = data.messages || [];
            if (dbMsgs.length > 0) setMessages(dbMsgs);
            setHasMore(data.has_more || false);
            setInitialized(true);
        }).catch(() => setInitialized(true))
        .finally(() => setLoadingMsgs(false));
    }, [open]);

    // ── Load quick actions ──────────────────────────────────────
    useEffect(() => {
        fetch('/hr-chatbot/quick-actions', {
            headers:{ 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':csrf() },
        }).then(r => r.json()).then(data => setQuickActions(data.actions || []));
    }, []);

    // ── Load more (scroll up) ───────────────────────────────────
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || messages.length === 0) return;
        const firstId = messages[0]?.id;
        if (!firstId || firstId === 'welcome') return;
        setLoadingMore(true);
        try {
            const res  = await fetch(`/hr-chatbot/messages?limit=10&before_id=${firstId}`, {
                headers:{ 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':csrf() },
            });
            const data = await res.json();
            const older = data.messages || [];
            if (older.length > 0) {
                const scrollEl = scrollRef.current;
                const prevScrollH = scrollEl?.scrollHeight || 0;
                setMessages(prev => [...older, ...prev]);
                setHasMore(data.has_more || false);
                // Maintain scroll position after prepend
                requestAnimationFrame(() => {
                    if (scrollEl) {
                        scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollH;
                    }
                });
            } else {
                setHasMore(false);
            }
        } catch(e) { console.error(e); }
        finally { setLoadingMore(false); }
    }, [loadingMore, hasMore, messages]);

    // ── Scroll to bottom on new messages ───────────────────────
    useEffect(() => {
        if (!loadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
        }
    }, [messages]);

    // ── Scroll to bottom when opened ───────────────────────────
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior:'instant' });
                inputRef.current?.focus();
            }, 120);
            setUnread(0);
        }
    }, [open, initialized]);

    const triggerPulse = useCallback(() => {
        if (!open) { setPulse(true); setUnread(n => n+1); setTimeout(() => setPulse(false), 600); }
    }, [open]);

    const clearChat = useCallback(() => {
        fetch('/hr-chatbot/messages', {
            method:'DELETE',
            headers:{ 'X-CSRF-TOKEN':csrf(), 'X-Requested-With':'XMLHttpRequest' },
        });
        setMessages([makeWelcome(userName)]);
        setHasMore(false);
    }, [userName]);

    // ── Send message ────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || loading) return;
        setInput('');

        const userMsg = { id:`u_${Date.now()}`, role:'user', content:trimmed, time:new Date().toISOString(), from_cache:false };
        const typingId = `typing_${Date.now()}`;
        const botTyping = { id:typingId, role:'assistant', content:'__typing__', time:new Date().toISOString(), from_cache:false };

        setMessages(prev => [...prev, userMsg, botTyping]);
        setLoading(true);

        try {
            const res  = await fetch('/hr-chatbot/ask', {
                method:'POST',
                headers:{ 'Content-Type':'application/json', 'X-CSRF-TOKEN':csrf(), 'X-Requested-With':'XMLHttpRequest' },
                body: JSON.stringify({ message: trimmed }),
            });
            const data  = await res.json();
            const reply = data.reply || 'Sorry, something went wrong.';

            setMessages(prev => prev.filter(m => m.id !== typingId).concat({
                id:`b_${Date.now()}`, role:'assistant', content:reply,
                time:new Date().toISOString(), from_cache: data.cached || false,
            }));
            triggerPulse();
        } catch {
            setMessages(prev => prev.filter(m => m.id !== typingId).concat({
                id:`err_${Date.now()}`, role:'assistant',
                content:'Connection error. Please try again.',
                time:new Date().toISOString(), from_cache:false,
            }));
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [input, loading, triggerPulse]);

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
    const fmtTime   = (iso) => { try { return new Date(iso).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}); } catch { return ''; } };

    const [showQA, setShowQA] = useState(true);

    return (
        <>
        <style>{`
            @keyframes hrbot-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
            @keyframes hrbot-slide-up{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
            @keyframes hrbot-msg-user{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
            @keyframes hrbot-msg-bot{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
            @keyframes hrbot-spin{to{transform:rotate(360deg)}}
            .hrbot-msgs::-webkit-scrollbar{width:4px}
            .hrbot-msgs::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:2px}
            .hrbot-msgs::-webkit-scrollbar-track{background:transparent}
            .hrbot-qa:hover{background:${darkMode?'rgba(124,58,237,0.18)':'rgba(79,70,229,0.08)'}!important;border-color:${darkMode?'rgba(124,58,237,0.4)':'rgba(79,70,229,0.3)'}!important;color:${darkMode?'#c4b5fd':'#4f46e5'}!important}
            .hrbot-hdr-btn:hover{background:rgba(255,255,255,0.22)!important}
            .hrbot-send:hover:not(:disabled){transform:scale(1.06);filter:brightness(1.1)}
            .hrbot-load-more:hover{background:${darkMode?'rgba(255,255,255,0.08)':'#f1f5f9'}!important}
        `}</style>

        {/* ── Chat Panel ──────────────────────────────────────── */}
        {open && (
            <div style={{
                position:'fixed', bottom:88, right:24,
                width:380, maxWidth:'calc(100vw - 32px)',
                height:560, maxHeight:'calc(100vh - 120px)',
                borderRadius:20, overflow:'hidden',
                display:'flex', flexDirection:'column',
                background:t.bg, border:`1px solid ${t.border}`,
                boxShadow:t.shadow, zIndex:9999,
                animation:'hrbot-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                fontFamily:"'Outfit','Segoe UI',sans-serif",
            }}>

                {/* Header */}
                <div style={{background:t.header, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,border:'2px solid rgba(255,255,255,0.3)'}}>🤖</div>
                    <div style={{flex:1,minWidth:0}}>
                        <div style={{color:'#fff',fontWeight:700,fontSize:14,lineHeight:1.2}}>HR Assistant</div>
                        <div style={{color:'rgba(255,255,255,0.75)',fontSize:11,marginTop:2,display:'flex',alignItems:'center',gap:5}}>
                            <span style={{width:6,height:6,borderRadius:'50%',background:'#4ade80',display:'inline-block'}}/>
                            Always here to help
                        </div>
                    </div>
                    <button onClick={clearChat} className="hrbot-hdr-btn" title="Clear chat" style={{width:30,height:30,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.8)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s',marginRight:4}}>↺</button>
                    <button onClick={()=>setOpen(false)} className="hrbot-hdr-btn" style={{width:30,height:30,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.8)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}>✕</button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="hrbot-msgs" style={{flex:1,overflowY:'auto',padding:'0 14px 8px',display:'flex',flexDirection:'column',gap:0}}>

                    {/* Load more button */}
                    {hasMore && (
                        <div style={{padding:'10px 0', display:'flex', justifyContent:'center', flexShrink:0}}>
                            <button onClick={loadMore} disabled={loadingMore} className="hrbot-load-more" style={{
                                padding:'5px 14px', borderRadius:99, fontSize:11, fontWeight:600,
                                border:`1px solid ${t.border}`, background:t.loadMoreBg,
                                color:t.loadMoreText, cursor:loadingMore?'default':'pointer',
                                display:'flex', alignItems:'center', gap:6, transition:'background .15s',
                                fontFamily:'inherit',
                            }}>
                                {loadingMore ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'hrbot-spin 1s linear infinite'}}>
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                                    </svg>
                                ) : '↑'}
                                {loadingMore ? 'Loading...' : 'Load earlier messages'}
                            </button>
                        </div>
                    )}

                    {loadingMsgs ? (
                        <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:t.botMuted,fontSize:13}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'hrbot-spin 1s linear infinite',marginRight:8}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                            Loading messages...
                        </div>
                    ) : (
                        <>
                        {messages.map((msg, i) => {
                            const isUser   = msg.role === 'user';
                            const isTyping = msg.content === '__typing__';
                            const showSep  = shouldShowDateSep(messages, i);
                            return (
                                <div key={msg.id}>
                                    {/* Date separator */}
                                    {showSep && (
                                        <div style={{display:'flex',alignItems:'center',gap:8,margin:'12px 0 8px',flexShrink:0}}>
                                            <div style={{flex:1,height:1,background:t.dateSep}}/>
                                            <span style={{fontSize:10,fontWeight:600,color:t.dateSepText,padding:'2px 10px',borderRadius:99,border:`1px solid ${t.dateSep}`,background:darkMode?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)',whiteSpace:'nowrap'}}>
                                                {getDateLabel(msg.time)}
                                            </span>
                                            <div style={{flex:1,height:1,background:t.dateSep}}/>
                                        </div>
                                    )}
                                    {/* Message bubble */}
                                    <div style={{display:'flex',flexDirection:isUser?'row-reverse':'row',alignItems:'flex-end',gap:8,marginBottom:6,animation:isUser?'hrbot-msg-user .18s ease':'hrbot-msg-bot .18s ease'}}>
                                        {!isUser && (
                                            <div style={{width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>🤖</div>
                                        )}
                                        <div style={{maxWidth:'78%'}}>
                                            <div style={{
                                                padding:isTyping?'10px 14px':'10px 13px',
                                                borderRadius:isUser?'16px 16px 4px 16px':'16px 16px 16px 4px',
                                                background:isUser?t.userBubble:t.botBubble,
                                                color:isUser?t.userText:t.botText,
                                                fontSize:13, lineHeight:1.55, wordBreak:'break-word',
                                            }}>
                                                {isTyping ? <TypingDots color={t.botMuted}/> : <FormattedText text={msg.content} mutedColor={t.botMuted}/>}
                                            </div>
                                            {!isTyping && (
                                                <div style={{fontSize:10,color:t.time,marginTop:3,textAlign:isUser?'right':'left',paddingLeft:isUser?0:4,display:'flex',gap:5,justifyContent:isUser?'flex-end':'flex-start',alignItems:'center'}}>
                                                    {msg.from_cache && !isUser && (
                                                        <span style={{fontSize:9,fontWeight:600,padding:'1px 5px',borderRadius:99,background:t.cachedBadgeBg,color:t.cachedBadgeText}}>⚡ cached</span>
                                                    )}
                                                    <span>{fmtTime(msg.time)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef}/>
                        </>
                    )}
                </div>

                {/* Quick actions */}
                {quickActions.length > 0 && showQA && !loadingMsgs && (
                    <div style={{padding:'8px 14px 10px',borderTop:`1px solid ${t.border}`,flexShrink:0}}>
                        <div style={{fontSize:9,fontWeight:700,color:t.time,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Quick Actions</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                            {quickActions.map((qa, i) => (
                                <button key={i} onClick={()=>sendMessage(qa.message)} className="hrbot-qa" style={{
                                    padding:'5px 10px', borderRadius:99, fontSize:11, fontWeight:600,
                                    cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                                    border:`1px solid ${t.qaBorder}`, background:t.qaBg, color:t.qaText,
                                    whiteSpace:'nowrap',
                                }}>{qa.label}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div style={{padding:'10px 12px 12px',borderTop:`1px solid ${t.border}`,flexShrink:0,display:'flex',gap:8,alignItems:'flex-end'}}>
                    <button onClick={() => setShowQA(v => !v)} title="Quick Actions" style={{
                        width:38, height:38, borderRadius:12, border:'none',
                        background: showQA
                            ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
                            : (darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                        color: showQA ? '#fff' : t.time,
                        cursor:'pointer', display:'flex', alignItems:'center',
                        justifyContent:'center', flexShrink:0, fontSize:16,
                        transition:'all .2s',
                    }}>⚡</button>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e=>setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask about leave, attendance, payroll..."
                        rows={1}
                        style={{flex:1,padding:'9px 13px',borderRadius:14,border:'none',background:t.inputBg,color:t.inputText,fontSize:13,fontFamily:'inherit',resize:'none',outline:'none',lineHeight:1.5,minHeight:38,maxHeight:90,overflowY:'hidden'}}
                        onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,90)+'px'}}
                    />
                    <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} className="hrbot-send" style={{
                        width:40,height:38,borderRadius:12,border:'none',
                        background:(!input.trim()||loading)?t.sendDisabled:t.sendBg,
                        color:(!input.trim()||loading)?t.time:'#fff',
                        cursor:(!input.trim()||loading)?'default':'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        transition:'all .15s',flexShrink:0,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        )}

        {/* FAB */}
        <button onClick={()=>setOpen(o=>!o)} style={{
            position:'fixed', bottom:24, right:24,
            width:54, height:54, borderRadius:'50%', border:'none',
            background:t.fabBg,
            boxShadow:pulse?'0 8px 32px rgba(124,58,237,0.7),0 0 0 10px rgba(124,58,237,0.12)':t.fabShadow,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:10000, transition:'transform .18s cubic-bezier(0.34,1.56,0.64,1),box-shadow .3s',
            transform:open?'scale(0.92) rotate(90deg)':'scale(1)',
        }}>
            {open
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="10" r="1.2" fill="#fff"/>
                    <circle cx="12" cy="10" r="1.2" fill="#fff"/>
                    <circle cx="15" cy="10" r="1.2" fill="#fff"/>
                  </svg>
            }
            {!open && unread > 0 && (
                <span style={{position:'absolute',top:-2,right:-2,width:18,height:18,borderRadius:'50%',background:'#ef4444',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid '+(darkMode?'#0f1b34':'#fff')}}>
                    {unread > 9 ? '9+' : unread}
                </span>
            )}
        </button>
        </>
    );
}