// resources/js/Pages/AiChat.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';

// ── Theme System ───────────────────────────────────────────────
function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark'
            || localStorage.getItem('vibeme-theme') === 'dark';
    };
    const [darkMode, setDarkMode] = useState(getDark);
    useEffect(() => {
        const sync = () => setDarkMode(getDark());
        window.addEventListener('vibeme-theme-change', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('vibeme-theme-change', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return darkMode;
}

function getTheme(dark) {
    if (dark) return {
        bg:                '#080e1a',
        surface:           'linear-gradient(180deg, rgba(10,18,36,0.96) 0%, rgba(9,16,32,0.92) 100%)',
        surfaceSoft:       'rgba(255,255,255,0.035)',
        surfaceSofter:     'rgba(255,255,255,0.055)',
        border:            'rgba(148,163,184,0.12)',
        borderSoft:        'rgba(148,163,184,0.08)',
        text:              '#f8fafc',
        textSoft:          '#cbd5e1',
        textMute:          '#8da0b8',
        textSecondary:     '#94a3b8',
        bubbleOther:       'rgba(10,18,36,0.96)',
        bubbleOtherBorder: 'rgba(148,163,184,0.12)',
        bubbleTextOther:   '#f8fafc',
        inputBg:           'rgba(255,255,255,0.04)',
        inputBorder:       'rgba(148,163,184,0.16)',
        convActive:        'rgba(99,102,241,0.15)',
        convHover:         'rgba(255,255,255,0.035)',
        menuBg:            '#0b1324',
        menuBorder:        'rgba(148,163,184,0.15)',
        dateDivider:       'rgba(148,163,184,0.08)',
        replyBg:           'rgba(255,255,255,0.055)',
        reactionBg:        'rgba(255,255,255,0.055)',
        reactionBorder:    'rgba(255,255,255,0.1)',
        shadow:            '0 28px 80px rgba(0,0,0,0.42)',
        shadowSm:          '0 1px 4px rgba(0,0,0,0.3)',
        headerBg:          'rgba(10,18,36,0.97)',
        sidebarBg:         'rgba(10,18,36,0.97)',
        sidebarBorder:     'rgba(148,163,184,0.10)',
        msgAreaBg:         '#080e1a',
        scrollThumb:       'rgba(255,255,255,0.12)',
        modalBg:           '#0b1324',
        modalBorder:       'rgba(148,163,184,0.15)',
        inputFocusBorder:  '#6366f1',
        tagBg:             'rgba(99,102,241,0.15)',
        tagBorder:         'rgba(99,102,241,0.3)',
        tagText:           '#a5b4fc',
        fileCardBg:        'rgba(255,255,255,0.04)',
        fileCardBorder:    'rgba(148,163,184,0.12)',
        bannerBlockBg:     'rgba(239,68,68,0.08)',
        bannerBlockBorder: 'rgba(239,68,68,0.2)',
    };
    return {
        bg:                '#f8fafc',
        surface:           '#ffffff',
        surfaceSoft:       '#f8fafc',
        surfaceSofter:     '#f1f5f9',
        border:            '#e2e8f0',
        borderSoft:        '#f1f5f9',
        text:              '#0f172a',
        textSoft:          '#374151',
        textMute:          '#94a3b8',
        textSecondary:     '#475569',
        bubbleOther:       '#ffffff',
        bubbleOtherBorder: '#f1f5f9',
        bubbleTextOther:   '#1e293b',
        inputBg:           '#f8fafc',
        inputBorder:       '#e2e8f0',
        convActive:        'rgba(99,102,241,0.1)',
        convHover:         '#f8fafc',
        menuBg:            '#ffffff',
        menuBorder:        '#e2e8f0',
        dateDivider:       '#f1f5f9',
        replyBg:           '#f1f5f9',
        reactionBg:        'rgba(0,0,0,0.04)',
        reactionBorder:    'rgba(0,0,0,0.08)',
        shadow:            '0 8px 32px rgba(0,0,0,0.12)',
        shadowSm:          '0 1px 4px rgba(0,0,0,0.08)',
        headerBg:          '#ffffff',
        sidebarBg:         '#ffffff',
        sidebarBorder:     '#f1f5f9',
        msgAreaBg:         '#f8fafc',
        scrollThumb:       'rgba(0,0,0,0.12)',
        modalBg:           '#ffffff',
        modalBorder:       '#e2e8f0',
        inputFocusBorder:  '#6366f1',
        tagBg:             'rgba(99,102,241,0.08)',
        tagBorder:         'rgba(99,102,241,0.2)',
        tagText:           '#6366f1',
        fileCardBg:        '#f8fafc',
        fileCardBorder:    '#f1f5f9',
        bannerBlockBg:     'linear-gradient(135deg, #fff5f5, #fef2f2)',
        bannerBlockBorder: '#fee2e2',
    };
}

// ── Format timestamp ───────────────────────────────────────────
const fmt = (iso) => {
    if (!iso) return '';
    let normalized = iso;
    if (typeof iso === 'string' && iso.includes(' ') && !iso.includes('T')) {
        normalized = iso.replace(' ', 'T') + 'Z';
    }
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return '';
    const now  = new Date();
    const diff = Math.floor((now - d) / 1000);
    const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: true };
    const dateOpts = { month: 'short', day: 'numeric' };
    const fullOpts = { year: 'numeric', month: 'short', day: 'numeric' };
    if (diff < 10)    return 'Just now';
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    if (d >= todayStart) return d.toLocaleTimeString([], timeOpts);
    const yestStart = new Date(todayStart); yestStart.setDate(yestStart.getDate() - 1);
    if (d >= yestStart) return 'Yesterday';
    if (now.getFullYear() === d.getFullYear()) return d.toLocaleDateString([], dateOpts);
    return d.toLocaleDateString([], fullOpts);
};

const getInitial = (name = '') => name.charAt(0).toUpperCase() || '?';
const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
const avatarColor = (str = '') => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const FLAG_SVGS = {
    en: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" style={{width:22,height:11,borderRadius:2,display:'block'}}><clipPath id="a"><path d="M0 0h60v30H0z"/></clipPath><clipPath id="b"><path d="M30 15h30v15zM0 0h30v15z"/></clipPath><g clipPath="url(#a)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/><path d="M0 0l60 30m0-30L0 30" clipPath="url(#b)" stroke="#C8102E" strokeWidth="4"/><path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/></g></svg>,
    ja: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" style={{width:22,height:15,borderRadius:2,display:'block'}}><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#BC002D"/></svg>,
    my: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 30" style={{width:22,height:15,borderRadius:2,display:'block'}}><rect width="45" height="10" fill="#FECB00"/><rect y="10" width="45" height="10" fill="#34B233"/><rect y="20" width="45" height="10" fill="#EA2839"/><polygon points="22.5,3 25.9,13 15.5,6.9 29.5,6.9 19.1,13" fill="#fff"/></svg>,
    km: <svg width="20" height="14" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{borderRadius:2,display:'block'}}><rect width="900" height="600" fill="#032EA1"/><rect width="900" height="300" y="150" fill="#E00025"/><g fill="white"><rect x="375" y="215" width="150" height="170"/><rect x="363" y="195" width="40" height="25"/><rect x="430" y="175" width="40" height="45"/><rect x="497" y="195" width="40" height="25"/><rect x="330" y="235" width="48" height="150"/><rect x="522" y="235" width="48" height="150"/></g></svg>,
    vi: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" style={{width:22,height:15,borderRadius:2,display:'block'}}><rect width="30" height="20" fill="#DA251D"/><polygon points="15,4 16.8,9.5 22.5,9.5 17.9,12.9 19.6,18.4 15,15 10.4,18.4 12.1,12.9 7.5,9.5 13.2,9.5" fill="#FFFF00"/></svg>,
    ko: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" style={{width:22,height:15,borderRadius:2,display:'block'}}><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5" fill="#CD2E3A"/><path d="M12.5,7.5 Q15,10 17.5,12.5" stroke="#003478" strokeWidth="1.5" fill="none"/><path d="M12.5,12.5 Q15,10 17.5,7.5" stroke="#CD2E3A" strokeWidth="1.5" fill="none"/></svg>,
};
const FLAGS = { en: '🇺🇸', ja: '🇯🇵', my: '🇲🇲', km: '🇰🇭', vi: '🇻🇳', ko: '🇰🇷' };
const LANG_LABELS = { en: 'English', ja: 'Japanese', my: 'Burmese', km: 'Khmer', vi: 'Vietnamese', ko: 'Korean' };
const EMOJIS = ['👍','❤️','😂','😮','😢','🔥'];

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name = '', size = 36, online = false, photo = null }) {
    const bg = avatarColor(name);
    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            {photo ? (
                <img src={photo.startsWith('http') ? photo : `/storage/${photo}`} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', boxShadow: `0 2px 8px rgba(0,0,0,0.15)` }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            ) : null}
            <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: photo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: `0 2px 8px ${bg}50` }}>{getInitial(name)}</div>
            {online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.28, height: size * 0.28, background: '#22c55e', borderRadius: '50%', border: '2px solid #fff', zIndex: 1 }} />}
        </div>
    );
}

// ── ConvItem ───────────────────────────────────────────────────
function ConvItem({ conv, active, onClick, authId, t }) {
    const unread = conv.unread_count || 0;
    const last   = conv.last_message;
    const isMine = last?.sender_id === authId;
    return (
        <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: active ? t.convActive : 'transparent', borderLeft: `3px solid ${active ? '#6366f1' : 'transparent'}`, transition: 'all 0.15s', position: 'relative' }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.convHover; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
        >
            <Avatar name={conv.name || '?'} size={42} online={conv.is_online} photo={conv.avatar_url || conv.avatar || null} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: unread ? 800 : 600, color: unread ? t.text : t.textSoft, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{conv.name}</span>
                    <span style={{ fontSize: 10, color: t.textMute, flexShrink: 0 }}>{fmt(last?.created_at || conv.last_message_at || '')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: unread ? t.textSecondary : t.textMute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        {last ? (isMine ? `You: ${last.body || `[${last.type}]`}` : (last.body || `[${last.type}]`)) : 'No messages yet'}
                    </span>
                    {unread > 0 && (
                        <span style={{ minWidth: 20, height: 20, borderRadius: 99, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>{unread > 99 ? '99+' : unread}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── MItem ──────────────────────────────────────────────────────
function MItem({ icon, label, onClick, highlight = false, danger = false, t }) {
    return (
        <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: highlight ? 'rgba(99,102,241,0.08)' : 'none', border: 'none', cursor: 'pointer', color: danger ? '#ef4444' : highlight ? '#6366f1' : t.textSoft, fontSize: 12, borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'background 0.1s', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = highlight ? 'rgba(99,102,241,0.08)' : 'none'}
        >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>{label}
        </button>
    );
}

// ── MessageBubble ──────────────────────────────────────────────
function MessageBubble({ msg, isMine, onReact, onReply, onEdit, onDelete, onTranslate, showAvatar, openMenuId, setOpenMenuId, highlight = '', t }) {
    const [translation, setTranslation]         = useState(null);
    const [showLangPicker, setShowLangPicker]   = useState(false);
    const [translating, setTranslating]         = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [menuDir, setMenuDir] = useState('up'); // 'up' | 'down'
    const dotBtnRef = useRef(null);

    const isMenuOpen = openMenuId === msg.id;
    const myReaction = msg.reactions?.find(r => r.reacted_by_me)?.emoji || null;
    const isDeleted  = !msg.body && !msg.file_url && msg.type === 'text';

    const toggleMenu = (e) => {
        e.stopPropagation();
        if (isMenuOpen) { setOpenMenuId(null); setShowEmojiPicker(false); setShowLangPicker(false); }
        else {
            // Detect if menu should open up or down
            if (dotBtnRef.current) {
                const rect = dotBtnRef.current.getBoundingClientRect();
                const spaceAbove = rect.top;
                // If less than 220px above (header ~64px + menu ~160px), open downward
                setMenuDir(spaceAbove < 220 ? 'down' : 'up');
            }
            setOpenMenuId(msg.id); setShowEmojiPicker(false); setShowLangPicker(false);
        }
    };
    const handleReactClick = (e, emoji) => { e.stopPropagation(); onReact(msg.id, emoji); setShowEmojiPicker(false); setOpenMenuId(null); };
    const handleRemoveReact = (e) => { e.stopPropagation(); if (myReaction) onReact(msg.id, myReaction); };
    const handleTranslate = async (lang) => {
        setShowLangPicker(false);
        setOpenMenuId(null);
        setTranslating(true);
        setTranslation(null); // ← ဟောင်းတာကို ချက်ချင်း ဖျက်
        const result = await onTranslate(msg.id, lang);
        if (result) setTranslation({ lang, text: result });
        setTranslating(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 2, marginBottom: 2, padding: '2px 16px' }}>
            {!isMine && <div style={{ width: 32, flexShrink: 0 }}>{showAvatar && <Avatar name={msg.sender?.name || '?'} size={32} photo={msg.sender?.avatar_url || msg.sender?.avatar || null} />}</div>}

            {!isDeleted && (
                <div style={{ position: 'relative', alignSelf: 'flex-end', flexShrink: 0, order: isMine ? -1 : 1, marginBottom: 6 }}>
                    <button ref={dotBtnRef} onClick={toggleMenu} style={{ width: 26, height: 26, borderRadius: 8, background: isMenuOpen ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMenuOpen ? '#6366f1' : t.textMute, fontSize: 15, fontWeight: 900, letterSpacing: '-1px', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.1)'; e.currentTarget.style.color='#6366f1'; }}
                        onMouseLeave={e => { if (!isMenuOpen) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=t.textMute; } }}
                    >⋯</button>

                    {isMenuOpen && (
                        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', ...(menuDir === 'down' ? { top: '110%' } : { bottom: '110%' }), [isMine ? 'right' : 'left']: 0, background: t.menuBg, border: `1px solid ${t.menuBorder}`, borderRadius: 14, padding: '6px', zIndex: 9999, boxShadow: t.shadow, minWidth: 160, animation: 'fadeIn 0.15s ease' }}>
                            {!showEmojiPicker && !showLangPicker && (
                                <div>
                                    {!isMine && <MItem icon={myReaction || '😊'} label="React" onClick={e => { e.stopPropagation(); setShowEmojiPicker(true); }} highlight={!!myReaction} t={t} />}
                                    {!isMine && <MItem icon="🌐" label={translating ? 'Translating…' : 'Translate'} onClick={e => { e.stopPropagation(); setShowLangPicker(true); }} t={t} />}
                                    <MItem icon="↩️" label="Reply" onClick={e => { e.stopPropagation(); onReply(msg); setOpenMenuId(null); }} t={t} />
                                    {isMine && msg.type === 'text' && <MItem icon="✏️" label="Edit" onClick={e => { e.stopPropagation(); onEdit(msg); setOpenMenuId(null); }} t={t} />}
                                    {isMine && <MItem icon="🗑️" label="Delete" onClick={e => { e.stopPropagation(); onDelete(msg.id); setOpenMenuId(null); }} danger t={t} />}
                                </div>
                            )}
                            {showEmojiPicker && (
                                <div>
                                    <button onClick={e => { e.stopPropagation(); setShowEmojiPicker(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMute, fontSize: 11, padding: '2px 6px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>← Back</button>
                                    <div style={{ display: 'flex', gap: 4, padding: '4px 2px' }}>
                                        {EMOJIS.map(e => (
                                            <button key={e} onClick={ev => handleReactClick(ev, e)} style={{ background: myReaction === e ? 'rgba(99,102,241,0.1)' : t.surfaceSoft, border: myReaction === e ? '1px solid #6366f1' : `1px solid ${t.border}`, cursor: 'pointer', fontSize: 20, padding: '5px 4px', borderRadius: 8, transition: 'all 0.1s', flex: 1, lineHeight: 1 }}
                                                onMouseEnter={ev => ev.currentTarget.style.transform = 'scale(1.25)'}
                                                onMouseLeave={ev => ev.currentTarget.style.transform = 'scale(1)'}
                                            >{e}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {showLangPicker && (
                                <div>
                                    <button onClick={e => { e.stopPropagation(); setShowLangPicker(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMute, fontSize: 11, padding: '2px 6px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>← Back</button>
                                    {Object.entries(LANG_LABELS).map(([code, label]) => (
                                        <button key={code} onClick={e => { e.stopPropagation(); handleTranslate(code); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', color: t.textSoft, fontSize: 12, borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                            onMouseEnter={e => e.currentTarget.style.background = t.surfaceSoft}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>{FLAG_SVGS[code]}</span>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                {!isMine && showAvatar && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: avatarColor(msg.sender?.name || ''), marginBottom: 3, marginLeft: 4 }}>{msg.sender?.name}</span>
                )}

                {msg.reply_to && (
                    <div
                        onClick={() => {
                            const el = document.getElementById(`msg-${msg.reply_to.id}`);
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.style.transition = 'background 0.2s';
                                el.style.background = 'rgba(99,102,241,0.15)';
                                setTimeout(() => { el.style.background = ''; }, 1200);
                            }
                        }}
                        style={{ padding: '4px 10px', marginBottom: 4, background: t.replyBg, borderLeft: '3px solid #6366f1', borderRadius: 8, fontSize: 11, color: t.textSecondary, maxWidth: '100%', cursor: 'pointer' }}
                    >
                        <span style={{ fontWeight: 700, color: '#6366f1' }}>{msg.reply_to.sender_name}</span>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.reply_to.body || `[${msg.reply_to.type}]`}</div>
                    </div>
                )}

                <div style={{ padding: msg.type === 'text' ? '9px 14px' : '6px', background: isMine ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : t.bubbleOther, borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', boxShadow: isMine ? '0 4px 16px rgba(99,102,241,0.25)' : t.shadowSm, border: isMine ? 'none' : `1px solid ${t.bubbleOtherBorder}` }}>
                    {msg.type === 'text' && (
                        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: isMine ? '#fff' : t.bubbleTextOther, fontFamily: "'Plus Jakarta Sans', sans-serif", wordBreak: 'break-word' }}>
                            {highlight && msg.body?.toLowerCase().includes(highlight.toLowerCase())
                                ? msg.body.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                                    part.toLowerCase() === highlight.toLowerCase()
                                        ? <mark key={i} style={{ background: '#fbbf24', color: '#0f172a', borderRadius: 3, padding: '0 1px' }}>{part}</mark>
                                        : part
                                )
                                : msg.body
                            }
                            {msg.is_edited && <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 6 }}>(edited)</span>}
                        </p>
                    )}
                    {msg.type === 'image' && <img src={msg.file_url} alt={msg.file_name} style={{ maxWidth: 260, maxHeight: 200, borderRadius: 12, display: 'block', cursor: 'pointer' }} onClick={() => window.open(msg.file_url, '_blank')} />}
                    {msg.type === 'video' && <video controls style={{ maxWidth: 260, borderRadius: 12 }}><source src={msg.file_url} type={msg.mime_type} /></video>}
                    {msg.type === 'audio' && <audio controls style={{ width: 220, display: 'block' }}><source src={msg.file_url} type={msg.mime_type || 'audio/webm'} /></audio>}
                    {msg.type === 'file' && (
                        <a href={msg.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: isMine ? '#fff' : t.text, textDecoration: 'none' }}>
                            <span style={{ fontSize: 24 }}>📎</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{msg.file_name}</div>
                                <div style={{ fontSize: 10, opacity: 0.6 }}>{msg.file_size ? `${(msg.file_size / 1024).toFixed(1)} KB` : ''}</div>
                            </div>
                        </a>
                    )}
                    {msg.type === 'sticker' && <div style={{ fontSize: 52, lineHeight: 1, padding: '4px 2px', userSelect: 'none' }}>{msg.body}</div>}
                </div>

                {translating && (
                    <div style={{
                        marginTop: 4, padding: '6px 12px',
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: 10, fontSize: 12,
                        color: '#6366f1',
                    }}>
                        <span style={{ opacity: 0.7 }}>Translating...</span>
                    </div>
                )}

                {!translating && translation && (
                    <div style={{
                        marginTop: 4, padding: '6px 12px',
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: 10, fontSize: 12,
                        color: t.text, maxWidth: '100%',
                    }}>
                        {translation.text}
                    </div>
                )}

                {msg.reactions?.filter(r => r.count > 0).length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {msg.reactions.filter(r => r.count > 0).map((r, i) => (
                            <div key={`${r.emoji}-${i}`} style={{ position: 'relative' }} className="react-badge-wrap">
                                <button onClick={handleRemoveReact} style={{ padding: '2px 8px', borderRadius: 99, background: r.reacted_by_me ? 'rgba(99,102,241,0.1)' : t.reactionBg, border: `1px solid ${r.reacted_by_me ? '#6366f1' : t.reactionBorder}`, cursor: r.reacted_by_me ? 'pointer' : 'default', fontSize: 12, color: t.textSoft, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }} title={r.reacted_by_me ? 'Click to remove' : ''}>
                                    {r.emoji}
                                    <span style={{ fontSize: 10, fontWeight: 700 }}>{r.count}</span>
                                </button>
                                {r.users?.length > 0 && (
                                    <div className="react-tooltip" style={{ position: 'absolute', bottom: '110%', [isMine ? 'right' : 'left']: 0, background: '#1e293b', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#f1f5f9', whiteSpace: 'nowrap', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s' }}>
                                        <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 2 }}>{r.emoji}</div>
                                        {r.users.map((u, ui) => <div key={ui} style={{ color: '#94a3b8' }}>{u}</div>)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: t.textMute }}>{fmt(msg.created_at)}</span>
                    {isMine && (
                        <span style={{ fontSize: 11, color: msg.status === 'failed' ? '#ef4444' : '#6366f1' }}>
                            {msg.status === 'pending' ? '⏳' : msg.status === 'failed' ? '❌' : '✓✓'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── NewConvModal ───────────────────────────────────────────────
function NewConvModal({ open, onClose, users, onCreate, t }) {
    const [mode, setMode]           = useState('private');
    const [search, setSearch]       = useState('');
    const [selected, setSelected]   = useState([]);
    const [groupName, setGroupName] = useState('');

    const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    const toggle = (u) => setSelected(prev => prev.find(s => s.id === u.id) ? prev.filter(s => s.id !== u.id) : [...prev, u]);
    const handleCreate = () => {
        if (mode === 'private' && selected.length === 1) onCreate({ type: 'private', user_id: selected[0].id });
        else if (mode === 'group' && selected.length >= 2 && groupName) onCreate({ type: 'group', name: groupName, user_ids: selected.map(s => s.id) });
        onClose(); setSelected([]); setSearch(''); setGroupName('');
    };

    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }} />
            <div style={{ position: 'relative', background: t.modalBg, border: `1px solid ${t.modalBorder}`, borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: t.shadow, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${t.borderSoft}` }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>New Conversation</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {['private', 'group'].map(m => (
                            <button key={m} onClick={() => { setMode(m); setSelected([]); }} style={{ padding: '6px 16px', borderRadius: 99, border: `1px solid ${mode === m ? '#6366f1' : t.border}`, background: mode === m ? 'rgba(99,102,241,0.08)' : 'transparent', color: mode === m ? '#6366f1' : t.textMute, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{m === 'private' ? '👤 Direct' : '👥 Group'}</button>
                        ))}
                    </div>
                </div>
                <div style={{ padding: '16px 24px', maxHeight: 420, overflowY: 'auto' }}>
                    {mode === 'group' && (
                        <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name..." style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
                    )}
                    {selected.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {selected.map(u => (
                                <span key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: t.tagBg, border: `1px solid ${t.tagBorder}`, color: t.tagText, fontSize: 12, fontWeight: 600 }}>
                                    {u.name}
                                    <button onClick={() => toggle(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.tagText, fontSize: 14, padding: 0 }}>×</button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
                    </div>
                    {filtered.map(u => {
                        const isSelected = selected.find(s => s.id === u.id);
                        return (
                            <div key={u.id} onClick={() => mode === 'private' ? setSelected([u]) : toggle(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', background: isSelected ? t.tagBg : 'transparent', border: `1px solid ${isSelected ? t.tagBorder : 'transparent'}`, marginBottom: 4, transition: 'all 0.1s' }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.surfaceSoft; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Avatar name={u.name} size={36} photo={u.avatar_url || u.avatar || null} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{u.name}</div>
                                    <div style={{ fontSize: 11, color: t.textMute }}>{u.email}</div>
                                </div>
                                {isSelected && <span style={{ color: '#6366f1', fontSize: 16 }}>✓</span>}
                            </div>
                        );
                    })}
                </div>
                <div style={{ padding: '12px 24px 20px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${t.border}`, background: 'transparent', color: t.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleCreate} disabled={mode === 'private' ? selected.length !== 1 : selected.length < 2 || !groupName} style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (mode === 'private' ? selected.length !== 1 : selected.length < 2 || !groupName) ? 0.4 : 1 }}>{mode === 'private' ? '💬 Start Chat' : '👥 Create Group'}</button>
                </div>
            </div>
        </div>
    );
}

// ── VoiceRecorder ──────────────────────────────────────────────
function VoiceRecorder({ activeConv, authUser, csrf, onSent, t }) {
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds]     = useState(0);
    const stateRef = useRef({ mr: null, stream: null, chunks: [], timer: null, sent: false });
    const fmtT = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

    const handleClick = async () => {
        const s = stateRef.current;
        if (s.mr && s.mr.state !== 'inactive') { s.mr.stop(); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            s.chunks = []; s.sent = false; s.mr = mr; s.stream = stream;
            mr.ondataavailable = e => { if (e.data.size > 0) s.chunks.push(e.data); };
            mr.onstop = async () => {
                if (s.sent) return; s.sent = true;
                clearInterval(s.timer); s.stream?.getTracks().forEach(t => t.stop());
                setRecording(false); setSeconds(0); s.mr = null;
                const blob = new Blob(s.chunks, { type: 'audio/webm' });
                if (blob.size < 500 || !activeConv) return;
                const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
                const fd = new FormData(); fd.append('type', 'audio'); fd.append('file', file);
                const socketId = window.Echo?.socketId();
                const res = await fetch(`/ai-chat/conversations/${activeConv.id}/messages`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...(socketId ? { 'X-Socket-ID': socketId } : {}) }, body: fd });
                const data = await res.json();
                if (data.success) onSent(data.message);
            };
            mr.start(100); setRecording(true); setSeconds(0);
            s.timer = setInterval(() => setSeconds(p => p + 1), 1000);
        } catch { alert('Microphone access denied'); }
    };

    return (
        <button onClick={handleClick} title={recording ? `Stop (${fmtT(seconds)})` : 'Record voice message'} style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: recording ? 'rgba(239,68,68,0.1)' : t.surfaceSoft, border: `1px solid ${recording ? 'rgba(239,68,68,0.3)' : t.border}`, position: 'relative', overflow: 'visible', transition: 'all 0.15s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill={recording ? '#ef4444' : t.textMute} style={recording ? { animation: 'pulse 1s infinite' } : {}} />
                <path d="M5 11a7 7 0 0 0 14 0" stroke={recording ? '#ef4444' : t.textMute} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <line x1="12" y1="18" x2="12" y2="22" stroke={recording ? '#ef4444' : t.textMute} strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="9" y1="22" x2="15" y2="22" stroke={recording ? '#ef4444' : t.textMute} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {recording && (
                <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{fmtT(seconds)}</span>
            )}
        </button>
    );
}

// ── HeaderBtn ──────────────────────────────────────────────────
function HeaderBtn({ icon, title, onClick, active = false, t }) {
    return (
        <button onClick={onClick} title={title} style={{ width: 34, height: 34, borderRadius: 10, background: active ? 'rgba(99,102,241,0.1)' : t.surfaceSoft, border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : t.border}`, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#6366f1' : t.textMute, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = active ? 'rgba(99,102,241,0.15)' : t.surfaceSofter; e.currentTarget.style.color = active ? '#6366f1' : t.textSoft; }}
            onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(99,102,241,0.1)' : t.surfaceSoft; e.currentTarget.style.color = active ? '#6366f1' : t.textMute; }}
        >{icon}</button>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AiChat({ conversations: initConvs = [], users = [] }) {
    // authUser — usePage() live + WS avatar override
    const { auth } = usePage().props;
    const baseAuthUser = auth?.user;
    const [avatarOverride, setAvatarOverride] = useState(undefined); // undefined=not yet set
    // live authUser: WS override wins over Inertia shared prop
    const authUser = avatarOverride !== undefined
        ? { ...baseAuthUser, avatar_url: avatarOverride }
        : baseAuthUser;
    const darkMode = useReactiveTheme();
    const t = getTheme(darkMode);

    const normalizeTs = (ts) => { if (!ts) return null; if (typeof ts !== 'string') return null; return ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z'; };
    const normalizeConv = (c) => ({ ...c, last_message_at: normalizeTs(c.last_message_at), last_message: c.last_message ? { ...c.last_message, created_at: normalizeTs(c.last_message.created_at) || normalizeTs(c.last_message_at) } : null });

    const [conversations, setConversations]         = useState((initConvs || []).map(normalizeConv));
    const [activeConv, setActiveConv]               = useState(null);
    const [messages, setMessages]                   = useState([]);
    const [input, setInput]                         = useState('');
    const [loading, setLoading]                     = useState(false);
    const [typing, setTyping]                       = useState(null); // { name, userId } | null
    const [replyTo, setReplyTo]                     = useState(null);
    const [editMsg, setEditMsg]                     = useState(null);
    const [showNewConv, setShowNewConv]             = useState(false);
    const [search, setSearch]                       = useState('');
    const [showMedia, setShowMedia]                 = useState(false);
    const [mediaFiles, setMediaFiles]               = useState([]);
    const [tab, setTab]                             = useState('all');
    const [tick, setTick]                           = useState(0);
    const [openMenuId, setOpenMenuId]               = useState(null);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showMsgSearch, setShowMsgSearch]         = useState(false);
    const [msgSearch, setMsgSearch]                 = useState('');
    const [searchIdx, setSearchIdx]                 = useState(0);
    const [mediaTab, setMediaTab]                   = useState('image');
    const [showConvMenu, setShowConvMenu]           = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMembersPanel, setShowMembersPanel]   = useState(false);
    const [addMemberSearch, setAddMemberSearch]     = useState('');
    const [membersPanelTab, setMembersPanelTab]     = useState('members');
    const [showGroupEdit, setShowGroupEdit]         = useState(false);
    const [groupEditName, setGroupEditName]         = useState('');
    const [groupEditFile, setGroupEditFile]         = useState(null);
    const [groupEditPreview, setGroupEditPreview]   = useState(null);
    const [groupEditLoading, setGroupEditLoading]   = useState(false);
    const groupEditFileRef                          = useRef(null);

    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);
    const typingTimer        = useRef(null);  // send typing stop timer
    const typingReceiveTimer = useRef(null);  // receive typing auto-clear timer
    const fileInputRef   = useRef(null);
    const isTypingRef    = useRef(false);
    const msgSearchRef   = useRef(null);
    const activeConvRef  = useRef(null);

    useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
    useEffect(() => { const ti = setInterval(() => setTick(p => p + 1), 30000); return () => clearInterval(ti); }, []);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';
    const api  = async (url, opts = {}) => { const res = await fetch(url, { ...opts, headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...(opts.headers || {}) } }); return res.json(); };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        if (!activeConv) return;
        setShowMsgSearch(false); setMsgSearch(''); setSearchIdx(0); setLoading(true); setShowConvMenu(false);
        api(`/ai-chat/conversations/${activeConv.id}/messages`).then(d => { setMessages(d.messages || []); setLoading(false); }).catch(() => setLoading(false));
        api(`/ai-chat/conversations/${activeConv.id}/read`, { method: 'POST' });
        setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, unread_count: 0 } : c));
    }, [activeConv?.id]);

    useEffect(() => {
        if (!window.Echo || !authUser?.id) return;
        const ch = window.Echo.private(`user.${authUser.id}`);
        ch.listen('.conversation.created', ({ conversation }) => { const nc = normalizeConv(conversation); setConversations(prev => { if (prev.find(c => c.id === nc.id)) return prev; return [nc, ...prev]; }); });
        ch.listen('.conversation.deleted', ({ conversation_id }) => { setConversations(prev => prev.filter(c => c.id !== conversation_id)); setActiveConv(prev => { if (prev?.id === conversation_id) return null; return prev; }); });

        // Real-time block/unblock — they_blocked_me updates without refresh
        ch.listen('.user.blocked', ({ conversation_id, is_blocked }) => {
            setConversations(prev => prev.map(c =>
                c.id !== conversation_id ? c : { ...c, they_blocked_me: is_blocked }
            ));
            setActiveConv(prev =>
                prev?.id !== conversation_id ? prev : { ...prev, they_blocked_me: is_blocked }
            );
        });

        // Real-time avatar update
        ch.listen('.user.avatar.updated', ({ user_id, avatar_url }) => {
            // ── ကိုယ်ရဲ့ own avatar ──
            if (user_id === baseAuthUser?.id) {
                setAvatarOverride(avatar_url ?? null);
            }
            // ── Conversations list ထဲ member avatar update ──
            setConversations(prev => prev.map(c => ({
                ...c,
                members: (c.members || []).map(m =>
                    m.id === user_id ? { ...m, avatar_url } : m
                ),
                ...(c.type === 'private' && c.members?.find(m => m.id === user_id)
                    ? { avatar_url }
                    : {}),
            })));
            // ── Active conversation ──
            setActiveConv(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    members: (prev.members || []).map(m =>
                        m.id === user_id ? { ...m, avatar_url } : m
                    ),
                    ...(prev.type === 'private' && prev.members?.find(m => m.id === user_id)
                        ? { avatar_url }
                        : {}),
                };
            });
            // ── Message bubbles sender avatar ──
            setMessages(prev => prev.map(m =>
                m.sender_id === user_id
                    ? { ...m, sender: { ...m.sender, avatar_url } }
                    : m
            ));
        });

        return () => { try { window.Echo.leave(`user.${authUser.id}`); } catch(e) {} };
    }, [authUser?.id]);

    useEffect(() => {
        if (!window.Echo || conversations.length === 0) return;
        let cleanupFn = () => {};
        const subscribe = () => {
            const ids = conversations.map(conv => {
                const ch = window.Echo.private(`conversation.${conv.id}`);
                ch.listen('.message.sent', ({ message }) => {
                    setConversations(prev => { const updated = prev.map(c => c.id !== conv.id ? c : { ...c, last_message: message, last_message_at: message.created_at, unread_count: (activeConvRef.current?.id !== conv.id && message.sender_id !== authUser?.id) ? (c.unread_count || 0) + 1 : c.unread_count }); return updated.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)); });
                    if (conv.id === activeConvRef.current?.id) { setMessages(prev => { if (prev.find(m => m.id === message.id)) return prev; return [...prev, message]; }); if (message.sender_id !== authUser?.id) { api(`/ai-chat/conversations/${conv.id}/read`, { method: 'POST' }); setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)); } }
                });
                ch.listen('.message.edited', ({ message_id, body, edited_at }) => { if (conv.id === activeConvRef.current?.id) setMessages(prev => prev.map(m => m.id === message_id ? { ...m, body, is_edited: true, edited_at } : m)); });
                ch.listen('.message.deleted', ({ message_id }) => { if (conv.id === activeConvRef.current?.id) setMessages(prev => prev.filter(m => m.id !== message_id)); });
                ch.listen('.message.reacted', ({ message_id, user_id, emoji, removed, old_emoji, user_name }) => {
                    const isMe = user_id === authUser?.id;
                    if (isMe) return;
                    if (conv.id === activeConvRef.current?.id) {
                        setMessages(prev => prev.map(m => {
                            if (m.id !== message_id) return m;
                            let reactions = JSON.parse(JSON.stringify(m.reactions || []));
                            const removeFrom = (tgt) => { const i = reactions.findIndex(r => r.emoji === tgt); if (i < 0) return; reactions[i].count = Math.max(0, reactions[i].count - 1); if (user_name && reactions[i].users) reactions[i].users = reactions[i].users.filter(u => u !== user_name); if (reactions[i].count <= 0) reactions.splice(i, 1); };
                            const addTo = (tgt) => { const i = reactions.findIndex(r => r.emoji === tgt); if (i >= 0) { reactions[i].count += 1; if (user_name && reactions[i].users && !reactions[i].users.includes(user_name)) reactions[i].users.push(user_name); } else { reactions.push({ emoji: tgt, count: 1, reacted_by_me: false, users: user_name ? [user_name] : [] }); } };
                            if (removed) removeFrom(emoji);
                            else if (old_emoji) { removeFrom(old_emoji); addTo(emoji); }
                            else addTo(emoji);
                            return { ...m, reactions };
                        }));
                    }
                });
                ch.listen('.user.typing', ({ user_name, user_id, is_typing }) => {
                    if (conv.id !== activeConvRef.current?.id) return;
                    clearTimeout(typingReceiveTimer.current);
                    if (is_typing) {
                        setTyping({ name: user_name, userId: user_id });
                        typingReceiveTimer.current = setTimeout(() => setTyping(null), 3500);
                    } else {
                        typingReceiveTimer.current = setTimeout(() => setTyping(null), 500);
                    }
                });
                ch.listen('.member.added', ({ conversation_id, member }) => { const updateMembers = (prev) => prev.map(c => c.id !== conversation_id ? c : { ...c, members: c.members?.find(m => m.id === member.id) ? c.members : [...(c.members || []), member] }); setConversations(updateMembers); setActiveConv(prev => { if (prev?.id !== conversation_id) return prev; const already = prev.members?.find(m => m.id === member.id); return already ? prev : { ...prev, members: [...(prev.members || []), member] }; }); });
                ch.listen('.member.removed', ({ conversation_id, user_id }) => { const updateMembers = (prev) => prev.map(c => c.id !== conversation_id ? c : { ...c, members: (c.members || []).filter(m => m.id !== user_id) }); setConversations(updateMembers); setActiveConv(prev => { if (prev?.id !== conversation_id) return prev; return { ...prev, members: (prev.members || []).filter(m => m.id !== user_id) }; }); });
                ch.listen('.group.updated', ({ conversation_id, name, avatar, avatar_url }) => { setConversations(prev => prev.map(c => c.id !== conversation_id ? c : { ...c, name, avatar, avatar_url })); setActiveConv(prev => prev?.id !== conversation_id ? prev : { ...prev, name, avatar, avatar_url }); });

                // Avatar update via conversation channel (for other members to receive)
                ch.listen('.user.avatar.updated', ({ user_id, avatar_url }) => {
                    if (user_id === baseAuthUser?.id) {
                        setAvatarOverride(avatar_url ?? null);
                    }
                    setConversations(prev => prev.map(c => ({
                        ...c,
                        members: (c.members || []).map(m => m.id === user_id ? { ...m, avatar_url } : m),
                        ...(c.type === 'private' && c.members?.find(m => m.id === user_id) ? { avatar_url } : {}),
                    })));
                    setActiveConv(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            members: (prev.members || []).map(m => m.id === user_id ? { ...m, avatar_url } : m),
                            ...(prev.type === 'private' && prev.members?.find(m => m.id === user_id) ? { avatar_url } : {}),
                        };
                    });
                    setMessages(prev => prev.map(m =>
                        m.sender_id === user_id ? { ...m, sender: { ...m.sender, avatar_url } } : m
                    ));
                });

                return conv.id;
            });
            cleanupFn = () => { ids.forEach(id => { try { window.Echo.leave(`conversation.${id}`); } catch(e) {} }); };
        };
        const state = window.Echo?.connector?.pusher?.connection?.state;
        if (state === 'connected') subscribe();
        else window.Echo?.connector?.pusher?.connection?.bind('connected', subscribe);
        return () => { window.Echo?.connector?.pusher?.connection?.unbind('connected', subscribe); cleanupFn(); };
    }, [conversations.length]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text && !editMsg) return;
        if (!activeConv) return;
        if (editMsg) { setInput(''); setEditMsg(null); const data = await api(`/ai-chat/messages/${editMsg.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) }); if (data.success) setMessages(prev => prev.map(m => m.id === editMsg.id ? data.message : m)); return; }
        const tempId = `temp_${Date.now()}`;
        const tempMsg = { id: tempId, conversation_id: activeConv.id, sender_id: authUser.id, sender: authUser, type: 'text', body: text, reply_to: replyTo ? { id: replyTo.id, body: replyTo.body, type: replyTo.type, sender_name: replyTo.sender?.name } : null, reactions: [], reads: [], is_edited: false, created_at: new Date().toISOString(), status: 'pending' };
        setMessages(prev => [...prev, tempMsg]); setInput(''); setReplyTo(null);
        try {
            const fd = new FormData(); fd.append('type', 'text'); fd.append('body', text); if (replyTo) fd.append('reply_to_id', replyTo.id);
            const socketId = window.Echo?.socketId();
            const res = await fetch(`/ai-chat/conversations/${activeConv.id}/messages`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...(socketId ? { 'X-Socket-ID': socketId } : {}) }, body: fd });
            const data = await res.json();
            if (data.success) { setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, status: 'sent' } : m)); updateConvLastMessage(data.message); }
            else setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        } catch { setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)); }
    };

    const handleRetry = async (msg) => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'pending' } : m));
        try {
            const fd = new FormData(); fd.append('type', 'text'); fd.append('body', msg.body);
            const socketId = window.Echo?.socketId();
            const res = await fetch(`/ai-chat/conversations/${activeConv.id}/messages`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...(socketId ? { 'X-Socket-ID': socketId } : {}) }, body: fd });
            const data = await res.json();
            if (data.success) { setMessages(prev => prev.map(m => m.id === msg.id ? { ...data.message, status: 'sent' } : m)); updateConvLastMessage(data.message); }
            else setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
        } catch { setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m)); }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeConv) return;
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file';
        const fd = new FormData(); fd.append('type', type); fd.append('file', file);
        const tempId = `temp_${Date.now()}`;
        const tempMsg = { id: tempId, conversation_id: activeConv.id, sender_id: authUser.id, sender: authUser, type, body: null, file_name: file.name, file_size: file.size, file_url: URL.createObjectURL(file), reactions: [], reads: [], is_edited: false, created_at: new Date().toISOString(), status: 'pending' };
        setMessages(prev => [...prev, tempMsg]);
        try {
            const socketId = window.Echo?.socketId();
            const res = await fetch(`/ai-chat/conversations/${activeConv.id}/messages`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...(socketId ? { 'X-Socket-ID': socketId } : {}) }, body: fd });
            const data = await res.json();
            if (data.success) { setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, status: 'sent' } : m)); updateConvLastMessage(data.message); }
            else setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        } catch { setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)); }
        e.target.value = '';
    };

    const updateConvLastMessage = (msg) => { setConversations(prev => { const updated = prev.map(c => c.id === activeConv.id ? { ...c, last_message: msg, last_message_at: msg.created_at } : c); return updated.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)); }); };

    const handleReact = async (messageId, emoji) => {
        const myName = authUser?.name || '';
        setMessages(prev => prev.map(m => {
            if (m.id !== messageId) return m;
            let reactions = JSON.parse(JSON.stringify(m.reactions || []));
            const myIdx = reactions.findIndex(r => r.reacted_by_me);
            const myEmoji = myIdx >= 0 ? reactions[myIdx].emoji : null;
            if (myEmoji === emoji) { reactions[myIdx].count = Math.max(0, reactions[myIdx].count - 1); reactions[myIdx].reacted_by_me = false; if (reactions[myIdx].users) reactions[myIdx].users = reactions[myIdx].users.filter(u => u !== myName); if (reactions[myIdx].count <= 0) reactions.splice(myIdx, 1); }
            else { if (myIdx >= 0) { reactions[myIdx].count = Math.max(0, reactions[myIdx].count - 1); reactions[myIdx].reacted_by_me = false; if (reactions[myIdx].users) reactions[myIdx].users = reactions[myIdx].users.filter(u => u !== myName); if (reactions[myIdx].count <= 0) reactions.splice(myIdx, 1); } const newIdx = reactions.findIndex(r => r.emoji === emoji); if (newIdx >= 0) { reactions[newIdx].count += 1; reactions[newIdx].reacted_by_me = true; if (reactions[newIdx].users && !reactions[newIdx].users.includes(myName)) reactions[newIdx].users.push(myName); } else reactions.push({ emoji, count: 1, reacted_by_me: true, users: [myName] }); }
            return { ...m, reactions };
        }));
        await api(`/ai-chat/messages/${messageId}/react`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) });
    };

    const handleDelete    = async (messageId) => { const data = await api(`/ai-chat/messages/${messageId}`, { method: 'DELETE' }); if (data.success) setMessages(prev => prev.filter(m => m.id !== messageId)); };
    // AiChat.jsx ထဲမှာ ရှိပြီးသား handleTranslate function ကို ဒါနဲ့ replace:

    const handleTranslate = async (messageId, lang) => {
        const startTime = Date.now();
        
        const data = await api(
            `/ai-chat/messages/${messageId}/translate`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: lang }),
            }
        );

        const elapsed = Date.now() - startTime;

        if (data.success) {
            // ── Token & cost console ──────────────────────────
            const usage = data.usage; // backend မှာ return လုပ်ရင်
            
            console.group(`🌐 AI Translate → ${lang.toUpperCase()} [msg #${messageId}]`);
            console.log(`📝 Translated:   "${data.translated?.slice(0, 80)}..."`);
            console.log(`⚡ Cached:       ${data.cached ? '✅ Yes (no API call)' : '❌ No (API used)'}`);
            console.log(`⏱️  Time:         ${elapsed}ms`);
            
            if (usage) {
                const inputCost  = (usage.input_tokens  / 1_000_000) * 15;   // $15/1M input
                const outputCost = (usage.output_tokens / 1_000_000) * 75;   // $75/1M output
                const totalCost  = inputCost + outputCost;
                
                console.log(`🔢 Tokens Used:`);
                console.log(`   Input:   ${usage.input_tokens} tokens`);
                console.log(`   Output:  ${usage.output_tokens} tokens`);
                console.log(`   Total:   ${usage.input_tokens + usage.output_tokens} tokens`);
                console.log(`💰 Cost:     ~$${totalCost.toFixed(6)} USD`);
            } else if (!data.cached) {
                console.log(`💡 Token info: Backend မှာ usage return မလုပ်ထားသေးဘူး`);
                console.log(`   (MessageController@translate မှာ usage ထည့်ဖို့ လိုသေး)`);
            }
            console.groupEnd();
        } else {
            console.error(`❌ Translate failed for msg #${messageId}`);
        }

        return data.success ? data.translated : null;
    };

    const handleTyping = useCallback(() => {
        if (!activeConv) return;

        // ── Throttle: send is_typing:true every 2s max (not every keystroke) ──
        const now = Date.now();
        if (!isTypingRef.current || (now - (isTypingRef.lastSent || 0)) > 2000) {
            isTypingRef.current = true;
            isTypingRef.lastSent = now;
            fetch(`/ai-chat/conversations/${activeConv.id}/typing`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_typing: true })
            });
        }

        // ── Reset stop timer on every keystroke ──
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            isTypingRef.current = false;
            isTypingRef.lastSent = 0;
            fetch(`/ai-chat/conversations/${activeConv.id}/typing`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_typing: false })
            });
        }, 2500);
    }, [activeConv]);

    const handleNewConv = async ({ type, user_id, name, user_ids }) => {
        let data;
        if (type === 'private') data = await api('/ai-chat/conversations/private', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id }) });
        else data = await api('/ai-chat/conversations/group', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, user_ids }) });
        if (data.conversation) { const nc = normalizeConv(data.conversation); setConversations(prev => { if (prev.find(c => c.id === nc.id)) return prev; return [nc, ...prev]; }); setActiveConv(nc); }
    };

    const handleGroupEdit = async () => {
        if (!groupEditName.trim() && !groupEditFile) return;
        setGroupEditLoading(true);
        const formData = new FormData();
        if (groupEditName.trim()) formData.append('name', groupEditName.trim());
        if (groupEditFile) formData.append('avatar', groupEditFile);
        try {
            const res = await fetch(`/ai-chat/conversations/${activeConv.id}/group`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }, body: formData });
            const data = await res.json();
            if (data.success) { const updated = { ...activeConv, name: data.name || activeConv.name, avatar: data.avatar || activeConv.avatar, avatar_url: data.avatar_url || activeConv.avatar_url }; setActiveConv(updated); setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, ...updated } : c)); setShowGroupEdit(false); setGroupEditFile(null); setGroupEditPreview(null); setGroupEditName(''); }
        } finally { setGroupEditLoading(false); }
    };

    const handleAddMember = async (userId) => { const data = await api(`/ai-chat/conversations/${activeConv.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) }); if (data.success && data.member) { const updatedMembers = [...(activeConv.members || []), data.member]; setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, members: updatedMembers } : c)); setActiveConv(prev => ({ ...prev, members: updatedMembers })); } };
    const handleRemoveMember = async (userId) => { const data = await api(`/ai-chat/conversations/${activeConv.id}/members/${userId}`, { method: 'DELETE' }); if (data.success) { const updatedMembers = (activeConv.members || []).filter(m => m.id !== userId); setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, members: updatedMembers } : c)); setActiveConv(prev => ({ ...prev, members: updatedMembers })); } };
    const loadMedia = async () => { if (!activeConv) return; const data = await api(`/ai-chat/conversations/${activeConv.id}/media`); setMediaFiles(data.media || []); setMediaTab('image'); setShowMedia(true); };

    const filteredConvs  = conversations.filter(c => tab === 'unread' ? c.unread_count > 0 : c.name?.toLowerCase().includes(search.toLowerCase()));
    const groupedMessages = messages.reduce((acc, msg) => { const date = new Date(msg.created_at).toDateString(); if (!acc[date]) acc[date] = []; acc[date].push(msg); return acc; }, {});
    const otherMember    = activeConv?.type === 'private' ? activeConv.members?.find(m => m.id !== authUser?.id) : null;

    return (
        <AppLayout title="AI Chat" hideWidget={true}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                .vibeme-chat * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
                .vibeme-chat ::-webkit-scrollbar { width: 4px; }
                .vibeme-chat ::-webkit-scrollbar-track { background: transparent; }
                .vibeme-chat ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 99px; }
                @keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
                @keyframes pulse  { 0%,100%{opacity:1}50%{opacity:0.4} }
                .msg-anim { animation: fadeIn 0.2s ease; }
                .react-badge-wrap:hover .react-tooltip { opacity: 1 !important; }
            `}</style>

            <div className="vibeme-chat" onClick={() => { setOpenMenuId(null); setShowStickerPicker(false); setShowConvMenu(false); }} style={{ display: 'flex', height: 'calc(100vh - 112px)', background: t.bg, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: t.shadow }}>

                {/* ══ LEFT SIDEBAR ══ */}
                <div style={{ width: 280, flexShrink: 0, background: t.sidebarBg, borderRight: `1px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 14px 12px' }}>
    
                        {/* Search + New Conversation — same row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." 
                                    style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor='#6366f1'} 
                                    onBlur={e => e.target.style.borderColor=t.border} />
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: t.textMute }}>🔍</span>
                            </div>

                            <button onClick={() => setShowNewConv(true)} title="New Conversation" 
                                style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, boxShadow: '0 3px 10px rgba(99,102,241,0.35)', transition: 'transform 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                ✏️
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[['all','All'],['unread','Unread']].map(([k,l]) => (
                                <button key={k} onClick={() => setTab(k)} style={{ padding: '4px 12px', borderRadius: 7, border: `1px solid ${tab===k ? 'rgba(99,102,241,0.3)' : t.border}`, background: tab===k ? 'rgba(99,102,241,0.08)' : 'transparent', color: tab===k ? '#6366f1' : t.textMute, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
                            ))}
                        </div>

                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredConvs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textMute }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>No conversations yet</div>
                                <button onClick={() => setShowNewConv(true)} style={{ marginTop: 10, padding: '6px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Start chatting</button>
                            </div>
                        ) : filteredConvs.map(conv => (
                            <ConvItem key={conv.id} conv={conv} active={activeConv?.id === conv.id} onClick={() => setActiveConv(conv)} authId={authUser?.id} tick={tick} t={t} />
                        ))}
                    </div>

                    <div style={{ padding: '10px 12px', borderTop: `1px solid ${t.sidebarBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={authUser?.name || '?'} size={32} online photo={authUser?.avatar_url || authUser?.avatar || null} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser?.name}</div>
                            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>● Online</div>
                        </div>
                    </div>
                </div>

                {/* ══ CHAT AREA ══ */}
                {activeConv ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.msgAreaBg, position: 'relative', minWidth: 0 }}>

                        {/* Header */}
                        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.headerBg, flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div onClick={() => { if (activeConv.type === 'group') { setGroupEditName(activeConv.name || ''); setGroupEditPreview(null); setGroupEditFile(null); setShowGroupEdit(true); } }} style={{ cursor: activeConv.type === 'group' ? 'pointer' : 'default', position: 'relative' }} title={activeConv.type === 'group' ? 'Edit group info' : ''}>
                                    <Avatar name={activeConv.name || '?'} size={36} online={otherMember?.is_online} photo={activeConv.avatar_url || activeConv.avatar || null} />
                                    {activeConv.type === 'group' && (<div style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', border: '1.5px solid #fff' }}>✎</div>)}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{activeConv.name}</div>
                                    <div style={{ fontSize: 11, color: t.textMute }}>
                                        {activeConv.type === 'group'
                                            ? <span onClick={() => { setShowMembersPanel(true); setMembersPanelTab('members'); setAddMemberSearch(''); }} style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 700, padding: '1px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', transition: 'all 0.15s', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.15)'} onMouseLeave={e => e.currentTarget.style.background='rgba(99,102,241,0.08)'}>{activeConv.members?.length || 0} members</span>
                                            : (typing && typing.userId !== authUser?.id) ? <span style={{ color: '#6366f1', animation: 'pulse 1s infinite' }}>typing...</span> : 'Online'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <HeaderBtn icon="🔍" title="Search messages" onClick={() => setShowMsgSearch(p => !p)} active={showMsgSearch} t={t} />
                                <HeaderBtn icon="🖼️" title="Media & Files" onClick={loadMedia} t={t} />
                                <div style={{ position: 'relative' }}>
                                    <button onClick={(e) => { e.stopPropagation(); setShowConvMenu(p => !p); }} style={{ width: 34, height: 34, borderRadius: 10, background: showConvMenu ? 'rgba(99,102,241,0.1)' : t.surfaceSoft, border: `1px solid ${showConvMenu ? 'rgba(99,102,241,0.3)' : t.border}`, cursor: 'pointer', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: showConvMenu ? '#6366f1' : t.textMute, transition: 'all 0.15s' }}>⋮</button>
                                    {showConvMenu && (
                                        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '110%', right: 0, background: t.menuBg, border: `1px solid ${t.menuBorder}`, borderRadius: 14, padding: '6px', zIndex: 500, boxShadow: t.shadow, minWidth: 180, animation: 'fadeIn 0.15s ease' }}>
                                            {activeConv.type === 'private' && otherMember && (
                                                <button onClick={async () => { const iBlocked = activeConv.i_blocked_them; const url = iBlocked ? '/ai-chat/unblock' : '/ai-chat/block'; await api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: otherMember.id }) }); setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, i_blocked_them: !iBlocked } : c)); setActiveConv(prev => ({ ...prev, i_blocked_them: !iBlocked })); setShowConvMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: activeConv.i_blocked_them ? '#6366f1' : '#ef4444', fontSize: 12, borderRadius: 8, transition: 'background 0.1s', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = activeConv.i_blocked_them ? 'rgba(99,102,241,0.06)' : 'rgba(239,68,68,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                    <span style={{ fontSize: 15 }}>{activeConv.i_blocked_them ? '✅' : '🚫'}</span>{activeConv.i_blocked_them ? 'Unblock User' : 'Block User'}
                                                </button>
                                            )}
                                            <button onClick={() => { setShowDeleteConfirm(true); setShowConvMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, borderRadius: 8, transition: 'background 0.1s', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                <span style={{ fontSize: 15 }}>🗑️</span> Delete Conversation
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Message Search Bar */}
                        {showMsgSearch && (
                            <div onClick={e => e.stopPropagation()} style={{ padding: '8px 16px', background: t.headerBg, borderBottom: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: t.textMute }}>🔍</span>
                                    <input ref={msgSearchRef} value={msgSearch} onChange={e => { setMsgSearch(e.target.value); setSearchIdx(0); }} placeholder="Search in conversation..." autoFocus style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 9, border: '1px solid rgba(99,102,241,0.3)', background: t.inputBg, color: t.text, fontSize: 12, outline: 'none' }} />
                                </div>
                                {msgSearch && (() => {
                                    const matched = messages.map((m, i) => ({ m, i })).filter(({ m }) => m.body?.toLowerCase().includes(msgSearch.toLowerCase()));
                                    const total = matched.length;
                                    const cur   = total > 0 ? searchIdx % total : 0;
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                            <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>{total > 0 ? `${cur + 1} / ${total}` : '0 results'}</span>
                                            <button disabled={total === 0} onClick={() => { if (total === 0) return; const prev2 = ((searchIdx - 1) % total + total) % total; setSearchIdx(prev2); const m2 = messages.map((m,i)=>({m,i})).filter(({m})=>m.body?.toLowerCase().includes(msgSearch.toLowerCase())); const tgt = m2[prev2]; if (tgt) document.getElementById(`msg-${tgt.m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} style={{ background: 'none', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, cursor: total===0?'not-allowed':'pointer', color: '#6366f1', width: 24, height: 24, display:'flex',alignItems:'center',justifyContent:'center', padding:0, fontSize: 11 }} title="Previous">▲</button>
                                            <button disabled={total === 0} onClick={() => { if (total === 0) return; const next = (searchIdx + 1) % total; setSearchIdx(next); const m2 = messages.map((m,i)=>({m,i})).filter(({m})=>m.body?.toLowerCase().includes(msgSearch.toLowerCase())); const tgt = m2[next]; if (tgt) document.getElementById(`msg-${tgt.m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} style={{ background: 'none', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, cursor: total===0?'not-allowed':'pointer', color: '#6366f1', width: 24, height: 24, display:'flex',alignItems:'center',justifyContent:'center', padding:0, fontSize: 11 }} title="Next">▼</button>
                                        </div>
                                    );
                                })()}
                                <button onClick={() => { setShowMsgSearch(false); setMsgSearch(''); setSearchIdx(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMute, fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                            </div>
                        )}

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 8 }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 40, color: t.textMute }}><div style={{ fontSize: 24, marginBottom: 8 }}>💬</div><div style={{ fontSize: 12 }}>Loading messages...</div></div>
                            ) : messages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 48, marginBottom: 12 }}>👋</div><div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Start the conversation!</div><div style={{ fontSize: 12, marginTop: 6, color: t.textMute }}>Say hi to {activeConv.name}</div></div>
                            ) : Object.entries(groupedMessages).map(([date, msgs]) => (
                                <div key={date}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', margin: '6px 0' }}>
                                        <div style={{ flex: 1, height: 1, background: t.dateDivider }} />
                                        <span style={{ fontSize: 11, color: t.textMute, fontWeight: 600, whiteSpace: 'nowrap' }}>{new Date(date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                        <div style={{ flex: 1, height: 1, background: t.dateDivider }} />
                                    </div>
                                    {msgs.map((msg, idx) => {
                                        const isMine     = msg.sender_id === authUser?.id;
                                        const prevMsg    = msgs[idx - 1];
                                        const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                        const isFailed   = msg.status === 'failed';
                                        const matchedList = msgSearch ? messages.map((m,i)=>({m,i})).filter(({m})=>m.body?.toLowerCase().includes(msgSearch.toLowerCase())) : [];
                                        const total2  = matchedList.length;
                                        const cur2    = total2 > 0 ? searchIdx % total2 : -1;
                                        const isMatch   = msgSearch && msg.body?.toLowerCase().includes(msgSearch.toLowerCase());
                                        const isCurrent = isMatch && matchedList[cur2]?.m.id === msg.id;
                                        return (
                                            <div key={msg.id} id={`msg-${msg.id}`} className="msg-anim" style={isCurrent ? { background: 'rgba(99,102,241,0.08)', borderRadius: 12, margin: '2px 8px', boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' } : isMatch ? { background: 'rgba(99,102,241,0.04)', borderRadius: 12, margin: '2px 8px' } : {}}>
                                                <MessageBubble msg={msg} isMine={isMine} showAvatar={showAvatar} onReact={handleReact} onReply={setReplyTo} onEdit={(m) => { setEditMsg(m); setInput(m.body); inputRef.current?.focus(); }} onDelete={handleDelete} onTranslate={handleTranslate} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} highlight={msgSearch} t={t} />
                                                {isFailed && (
                                                    <div style={{ textAlign: 'right', paddingRight: 20, marginTop: -4, marginBottom: 6 }}>
                                                        <button onClick={() => handleRetry(msg)} style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>🔄 Tap to retry</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply / Edit banner */}
                        {(replyTo || editMsg) && (
                            <div style={{ padding: '8px 18px', background: 'rgba(99,102,241,0.05)', borderTop: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 2 }}>{editMsg ? '✏️ Editing message' : `↩️ Replying to ${replyTo?.sender?.name}`}</div>
                                    <div style={{ fontSize: 12, color: t.textMute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editMsg?.body || replyTo?.body || `[${replyTo?.type}]`}</div>
                                </div>
                                <button onClick={() => { setReplyTo(null); setEditMsg(null); setInput(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMute, fontSize: 18 }}>×</button>
                            </div>
                        )}

                        {/* Sticker Picker */}
                        {showStickerPicker && (
                            <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 66, left: 14, width: 360, background: t.menuBg, border: `1px solid ${t.menuBorder}`, borderRadius: 14, padding: '10px', zIndex: 600, boxShadow: t.shadow, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 5 }}>
                                {['🎉','😂','🔥','❤️','👍','😎','🥳','😭','🤔','😍','🫡','💀','🙏','👀','✨','🫂','💪','🤣','😅','🫠','🤩','😤','🥹','🫶','🤝','👋','🎊','🌟','💯','🎶','🍕','🐱'].map(s => (
                                    <button key={s} onClick={() => {
                                        if (!activeConv) return;
                                        setShowStickerPicker(false);
                                        const tempId = `temp_${Date.now()}`;
                                        const tempMsg = { id: tempId, conversation_id: activeConv.id, sender_id: authUser.id, sender: authUser, type: 'sticker', body: s, reactions: [], reads: [], is_edited: false, created_at: new Date().toISOString(), status: 'pending' };
                                        setMessages(prev => [...prev, tempMsg]);
                                        const fd = new FormData(); fd.append('type', 'sticker'); fd.append('body', s);
                                        const socketId = window.Echo?.socketId();
                                        fetch(`/ai-chat/conversations/${activeConv.id}/messages`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...(socketId ? { 'X-Socket-ID': socketId } : {}) }, body: fd })
                                            .then(r => r.json()).then(data => { if (data.success) { setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, status: 'sent' } : m)); updateConvLastMessage(data.message); } else setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)); }).catch(() => setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)));
                                    }} style={{ background: t.surfaceSoft, border: `1px solid ${t.borderSoft}`, borderRadius: 9, cursor: 'pointer', fontSize: 20, padding: '5px 3px', transition: 'all 0.12s', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.1)'; e.currentTarget.style.transform='scale(1.2)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background=t.surfaceSoft; e.currentTarget.style.transform='scale(1)'; }}
                                    >{s}</button>
                                ))}
                            </div>
                        )}

                        {/* Input Bar / Block Banner */}
                        {(() => {
                            const iBlocked   = activeConv.i_blocked_them;
                            const theyBlocked = activeConv.they_blocked_me;
                            const isBlocked  = iBlocked || theyBlocked;
                            if (isBlocked) {
                                return (
                                    <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.bannerBlockBorder}`, background: t.bannerBlockBg, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, animation: 'fadeIn 0.2s ease' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚫</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', marginBottom: 2 }}>{iBlocked ? 'You have blocked this user' : 'You have been blocked'}</div>
                                            <div style={{ fontSize: 11, color: '#f87171' }}>{iBlocked ? 'Unblock them to send messages again.' : 'You cannot send messages to this person.'}</div>
                                        </div>
                                        {iBlocked && (
                                            <button onClick={async () => { const data = await api('/ai-chat/unblock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: otherMember?.id }) }); if (data.success) { const upd = { i_blocked_them: false }; setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, ...upd } : c)); setActiveConv(prev => ({ ...prev, ...upd })); } }} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', flexShrink: 0, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(99,102,241,0.3)', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity='0.9'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>✅ Unblock</button>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.borderSoft}`, background: t.headerBg, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    <button onClick={() => fileInputRef.current?.click()} title="Attach file" style={{ background: t.surfaceSoft, border: `1px solid ${t.border}`, width: 34, height: 34, borderRadius: 9, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMute, flexShrink: 0 }}>📎</button>
                                    <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xlsx,.zip" style={{ display: 'none' }} onChange={handleFileSelect} />

                                    <VoiceRecorder activeConv={activeConv} authUser={authUser} csrf={csrf} onSent={(msg) => { setMessages(prev => [...prev, { ...msg, status: 'sent' }]); updateConvLastMessage(msg); }} t={t} />

                                    <button onClick={(e) => { e.stopPropagation(); setShowStickerPicker(p => !p); }} title="Send sticker" style={{ background: showStickerPicker ? 'rgba(99,102,241,0.1)' : t.surfaceSoft, border: `1px solid ${showStickerPicker ? 'rgba(99,102,241,0.3)' : t.border}`, width: 34, height: 34, borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke={showStickerPicker ? '#6366f1' : t.textMute} strokeWidth="1.8"/>
                                            <circle cx="9" cy="10" r="1.2" fill={showStickerPicker ? '#6366f1' : t.textMute}/>
                                            <circle cx="15" cy="10" r="1.2" fill={showStickerPicker ? '#6366f1' : t.textMute}/>
                                            <path d="M8 14.5c1 1.5 2.5 2 4 2s3-0.5 4-2" stroke={showStickerPicker ? '#6366f1' : t.textMute} strokeWidth="1.5" strokeLinecap="round"/>
                                            <path d="M16 16.5 Q19 14 18.5 11" stroke={showStickerPicker ? '#6366f1' : t.textMute} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                                        </svg>
                                    </button>

                                    <input ref={inputRef} value={input} onChange={e => { setInput(e.target.value); handleTyping(); }}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder={editMsg ? 'Edit message...' : `Message ${activeConv.name}...`}
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.text, fontSize: 13, outline: 'none', transition: 'border-color 0.15s' }}
                                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                                        onBlur={e => e.target.style.borderColor = t.inputBorder}
                                    />

                                    <button onClick={handleSend} disabled={!input.trim() && !editMsg} style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: input.trim() || editMsg ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : t.surfaceSoft, cursor: input.trim() || editMsg ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: input.trim() || editMsg ? '0 3px 10px rgba(99,102,241,0.35)' : 'none', transition: 'all 0.15s' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M22 2L11 13" stroke={input.trim() || editMsg ? 'white' : t.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() || editMsg ? 'white' : t.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={input.trim() || editMsg ? 'rgba(255,255,255,0.15)' : 'none'}/>
                                        </svg>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 56, marginBottom: 14, opacity: 0.3 }}>💬</div>
                            <h3 style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 6 }}>Select a conversation</h3>
                            <p style={{ fontSize: 13, color: t.textMute, marginBottom: 18 }}>Choose a chat or start a new one</p>
                            <button onClick={() => setShowNewConv(true)} style={{ padding: '9px 22px', borderRadius: 11, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>✏️ New Conversation</button>
                        </div>
                    </div>
                )}

                {/* ══ MEDIA PANEL ══ */}
                {showMedia && (
                    <div style={{ width: 260, flexShrink: 0, background: t.sidebarBg, borderLeft: `1px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 12px 0', borderBottom: `1px solid ${t.borderSoft}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: t.text }}>🖼️ Media & Files</span>
                                <button onClick={() => setShowMedia(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMute, fontSize: 18, lineHeight: 1 }}>×</button>
                            </div>
                            <div style={{ display: 'flex' }}>
                                {[['image','Images'],['video','Videos'],['audio','Audio'],['file','Files']].map(([type, label]) => (
                                    <button key={type} onClick={() => setMediaTab(type)} style={{ flex: 1, padding: '6px 2px', background: 'none', border: 'none', borderBottom: `2px solid ${mediaTab === type ? '#6366f1' : 'transparent'}`, color: mediaTab === type ? '#6366f1' : t.textMute, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
                            {mediaTab === 'image' && (mediaFiles.filter(m => m.type === 'image').length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: t.textMute, fontSize: 12 }}>No images yet</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>{mediaFiles.filter(m => m.type === 'image').map(m => <img key={m.id} src={m.file_url} alt={m.file_name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(m.file_url, '_blank')} />)}</div>)}
                            {mediaTab === 'video' && (mediaFiles.filter(m => m.type === 'video').length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: t.textMute, fontSize: 12 }}>No videos yet</div> : mediaFiles.filter(m => m.type === 'video').map(m => <div key={m.id} style={{ marginBottom: 8, borderRadius: 10, overflow: 'hidden', background: t.fileCardBg, border: `1px solid ${t.fileCardBorder}` }}><video controls style={{ width: '100%', display: 'block' }}><source src={m.file_url} /></video><div style={{ padding: '5px 8px', fontSize: 10, color: t.textMute }}>{m.file_name}</div></div>))}
                            {mediaTab === 'audio' && (mediaFiles.filter(m => m.type === 'audio').length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: t.textMute, fontSize: 12 }}>No audio yet</div> : mediaFiles.filter(m => m.type === 'audio').map(m => <div key={m.id} style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 10, background: t.fileCardBg, border: `1px solid ${t.fileCardBorder}` }}><audio controls style={{ width: '100%', height: 32 }}><source src={m.file_url} /></audio><div style={{ fontSize: 10, color: t.textMute, marginTop: 4 }}>{m.file_name}</div></div>))}
                            {mediaTab === 'file' && (mediaFiles.filter(m => m.type === 'file').length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: t.textMute, fontSize: 12 }}>No files yet</div> : mediaFiles.filter(m => m.type === 'file').map(m => <a key={m.id} href={m.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 10, background: t.fileCardBg, border: `1px solid ${t.fileCardBorder}`, marginBottom: 6, textDecoration: 'none' }}><span style={{ fontSize: 18 }}>📎</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.file_name}</div><div style={{ fontSize: 10, color: t.textMute }}>{m.created_at}</div></div></a>))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Group Edit Modal ── */}
            {showGroupEdit && activeConv?.type === 'group' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => { setShowGroupEdit(false); setGroupEditFile(null); setGroupEditPreview(null); setGroupEditName(''); }} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }} />
                    <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: t.modalBg, borderRadius: 20, width: '100%', maxWidth: 400, boxShadow: t.shadow, border: `1px solid ${t.modalBorder}`, animation: 'fadeIn 0.2s ease', overflow: 'hidden' }}>
                        <div style={{ height: 80, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)', position: 'relative' }}>
                            <button onClick={() => { setShowGroupEdit(false); setGroupEditFile(null); setGroupEditPreview(null); setGroupEditName(''); }} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 16, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -44, paddingBottom: 0, position: 'relative', zIndex: 1 }}>
                            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => groupEditFileRef.current?.click()}>
                                {groupEditPreview || activeConv.avatar_url || activeConv.avatar ? (
                                    <img src={groupEditPreview || ((activeConv.avatar_url || activeConv.avatar || '').startsWith('http') ? (activeConv.avatar_url || activeConv.avatar) : `/storage/${activeConv.avatar_url || activeConv.avatar}`)} alt="group" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${t.modalBg}`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
                                ) : (
                                    <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: `4px solid ${t.modalBg}`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 800 }}>{(activeConv.name || 'G')[0].toUpperCase()}</div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0'}><span style={{ fontSize: 22 }}>📷</span></div>
                                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: `2px solid ${t.modalBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✎</div>
                            </div>
                            <input ref={groupEditFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; setGroupEditFile(f); const reader = new FileReader(); reader.onload = ev => setGroupEditPreview(ev.target.result); reader.readAsDataURL(f); }} />
                            <div style={{ marginTop: 8, fontSize: 11, color: t.textMute }}>Click to change photo</div>
                        </div>
                        <div style={{ padding: '16px 24px 24px' }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Group Name</label>
                            <input value={groupEditName} onChange={e => setGroupEditName(e.target.value)} placeholder={activeConv.name} style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor=t.border} onKeyDown={e => e.key === 'Enter' && handleGroupEdit()} />
                            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                                <button onClick={() => { setShowGroupEdit(false); setGroupEditFile(null); setGroupEditPreview(null); setGroupEditName(''); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.surfaceSoft, color: t.textSecondary, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleGroupEdit} disabled={groupEditLoading || (!groupEditName.trim() && !groupEditFile)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: (groupEditLoading || (!groupEditName.trim() && !groupEditFile)) ? t.surfaceSofter : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: (groupEditLoading || (!groupEditName.trim() && !groupEditFile)) ? t.textMute : '#fff', fontSize: 13, fontWeight: 700, cursor: (groupEditLoading || (!groupEditName.trim() && !groupEditFile)) ? 'not-allowed' : 'pointer', boxShadow: (groupEditLoading || (!groupEditName.trim() && !groupEditFile)) ? 'none' : '0 4px 12px rgba(99,102,241,0.35)', transition: 'all 0.15s' }}>
                                    {groupEditLoading ? '⏳ Saving...' : '✅ Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Group Members Panel ── */}
            {showMembersPanel && activeConv?.type === 'group' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => setShowMembersPanel(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }} />
                    <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: t.modalBg, borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: t.shadow, border: `1px solid ${t.modalBorder}`, animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👥</div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{activeConv.name}</div>
                                        <div style={{ fontSize: 11, color: t.textMute }}>{activeConv.members?.length || 0} members</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowMembersPanel(false)} style={{ background: t.surfaceSoft, border: 'none', cursor: 'pointer', color: t.textMute, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                            </div>
                            {(() => {
                                const isAdmin = activeConv.members?.find(m => m.id === authUser?.id)?.role === 'admin';
                                return isAdmin ? (
                                    <div style={{ display: 'flex', gap: 0, background: t.surfaceSoft, borderRadius: 10, padding: 3, marginBottom: 16 }}>
                                        {[['members','👥 Members'],['add','➕ Add Members']].map(([tab2, label]) => (
                                            <button key={tab2} onClick={() => setMembersPanelTab(tab2)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: membersPanelTab === tab2 ? t.surface : 'transparent', color: membersPanelTab === tab2 ? '#6366f1' : t.textMute, fontSize: 12, fontWeight: 700, boxShadow: membersPanelTab === tab2 ? t.shadowSm : 'none', transition: 'all 0.15s' }}>{label}</button>
                                        ))}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px' }}>
                            {membersPanelTab === 'members' && (() => {
                                const isAdmin = activeConv.members?.find(m => m.id === authUser?.id)?.role === 'admin';
                                const adminCount = activeConv.members?.filter(m => m.role === 'admin').length || 0;
                                return (
                                    <div>
                                        {(activeConv.members || []).map(member => {
                                            const isSelf = member.id === authUser?.id;
                                            const isOnlyAdmin = member.role === 'admin' && adminCount <= 1;
                                            const canRemove = isAdmin && !isSelf && !isOnlyAdmin;
                                            const canLeave  = isSelf && !isOnlyAdmin;
                                            return (
                                                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.borderSoft}` }}>
                                                    <Avatar name={member.name || '?'} size={40} photo={member.avatar_url || null} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{member.name}{isSelf ? ' (You)' : ''}</span>
                                                            {member.role === 'admin' && (<span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, padding: '1px 7px' }}>ADMIN</span>)}
                                                        </div>
                                                        {isOnlyAdmin && isSelf && (<div style={{ fontSize: 10, color: t.textMute, marginTop: 1 }}>Transfer admin to leave</div>)}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                        {canLeave && (<button onClick={() => handleRemoveMember(member.id)} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surfaceSoft, color: t.textSecondary, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background=t.surfaceSofter; }} onMouseLeave={e => { e.currentTarget.style.background=t.surfaceSoft; }}>Leave</button>)}
                                                        {canRemove && (<button onClick={() => handleRemoveMember(member.id)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.05)'; }}>Remove</button>)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                            {membersPanelTab === 'add' && (() => {
                                const memberIds = new Set((activeConv.members || []).map(m => m.id));
                                const available = users.filter(u => !memberIds.has(u.id));
                                const filtered2  = available.filter(u => u.name.toLowerCase().includes(addMemberSearch.toLowerCase()) || u.email.toLowerCase().includes(addMemberSearch.toLowerCase()));
                                return (
                                    <div>
                                        <div style={{ position: 'relative', marginBottom: 12 }}>
                                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: t.textMute }}>🔍</span>
                                            <input value={addMemberSearch} onChange={e => setAddMemberSearch(e.target.value)} placeholder="Search users to add..." style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor=t.border} />
                                        </div>
                                        {filtered2.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '30px 0', color: t.textMute, fontSize: 12 }}>{available.length === 0 ? '✅ All users are already in this group' : 'No users found'}</div>
                                        ) : filtered2.map(u => (
                                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.borderSoft}` }}>
                                                <Avatar name={u.name} size={38} photo={u.avatar_url || null} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{u.name}</div>
                                                    <div style={{ fontSize: 11, color: t.textMute }}>{u.email}</div>
                                                </div>
                                                <button onClick={async () => { await handleAddMember(u.id); setMembersPanelTab('members'); setAddMemberSearch(''); }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', transition: 'all 0.15s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.opacity='0.9'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>+ Add</button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => setShowDeleteConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }} />
                    <div style={{ position: 'relative', background: t.modalBg, borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 28px 24px', boxShadow: t.shadow, border: `1px solid ${t.bannerBlockBorder}`, animation: 'fadeIn 0.2s ease' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16 }}>🗑️</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: t.text }}>Delete Conversation</h3>
                        <p style={{ margin: '0 0 6px', fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }}>Are you sure you want to delete your conversation with <strong style={{ color: t.text }}>{activeConv?.name}</strong>?</p>
                        <p style={{ margin: '0 0 24px', fontSize: 12, color: '#ef4444', lineHeight: 1.5, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '8px 12px' }}>⚠️ This will permanently delete all messages, files, and media in this conversation. This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '10px 22px', borderRadius: 11, border: `1px solid ${t.border}`, background: t.surfaceSoft, color: t.textSecondary, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background=t.surfaceSofter; }} onMouseLeave={e => { e.currentTarget.style.background=t.surfaceSoft; }}>Cancel</button>
                            <button onClick={async () => { setShowDeleteConfirm(false); await api(`/ai-chat/conversations/${activeConv.id}`, { method: 'DELETE' }); setConversations(prev => prev.filter(c => c.id !== activeConv.id)); setActiveConv(null); }} style={{ padding: '10px 22px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.35)', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity='0.9'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>🗑️ Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <NewConvModal open={showNewConv} onClose={() => setShowNewConv(false)} users={users} onCreate={handleNewConv} t={t} />
        </AppLayout>
    );
}