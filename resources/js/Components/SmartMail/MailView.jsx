// resources/js/Components/SmartMail/MailView.jsx

import { useState } from 'react';

const LANGUAGES = [
    { code:'en', label:'English',    flag:'🇬🇧' },
    { code:'ja', label:'Japanese',   flag:'🇯🇵' },
    { code:'my', label:'Burmese',    flag:'🇲🇲' },
    { code:'km', label:'Khmer',      flag:'🇰🇭' },
    { code:'vi', label:'Vietnamese', flag:'🇻🇳' },
    { code:'ko', label:'Korean',     flag:'🇰🇷' },
];

export default function MailView({ mail, hasApi, onReply, onForward, onShowToast }) {
    const [translating, setTranslating]       = useState(false);
    const [translated, setTranslated]         = useState(null);
    const [showTranslated, setShowTranslated] = useState(false);
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [selectedLang, setSelectedLang]     = useState(null);

    if (!mail) {
        return (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa' }}>
                <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:56, marginBottom:12 }}>📬</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#374151' }}>Select a mail to read</div>
                    <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Click any mail from the list</div>
                </div>
            </div>
        );
    }

    const handleTranslate = async (lang) => {
        setShowLangPicker(false);
        setSelectedLang(lang);
        setTranslating(true);
        setShowTranslated(false);
        try {
            const res = await fetch(`/smart-mail/${mail.id}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type':     'application/json',
                    'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ language: lang.code }),
            });
            const data = await res.json();
            if (data.success) {
                setTranslated(data.translated);
                setShowTranslated(true);
                if (data.demo) onShowToast('Demo mode — configure API for real translation', 'warning');
            }
        } catch {
            onShowToast('Translation failed.', 'error');
        }
        setTranslating(false);
    };

    const getInitial  = (name, addr) => (name || addr || '?').charAt(0).toUpperCase();
    const getAvatarBg = (str) => {
        const colors = ['#7c3aed','#2563eb','#059669','#d97706','#ef4444','#ec4899'];
        let h = 0;
        for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
        return colors[Math.abs(h) % colors.length];
    };
    const avatarColor = getAvatarBg(mail.from_name || mail.from_address || '');

    return (
        <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>

            {/* Toolbar */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderBottom:'1px solid #e5e7eb' }}>
                <button onClick={() => onReply(mail)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    ↩️ Reply
                </button>
                <button onClick={() => onForward(mail)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    ↪️ Forward
                </button>

                <div style={{ flex:1 }} />

                {/* Translate dropdown */}
                <div style={{ position:'relative' }}>
                    <button onClick={() => setShowLangPicker(!showLangPicker)} disabled={translating}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #7c3aed', background:'#ede9fe', color:'#7c3aed', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {translating ? (
                            <><span style={{ width:12, height:12, border:'2px solid #c4b5fd', borderTopColor:'#7c3aed', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Translating...</>
                        ) : '🌐 Translate'}
                    </button>
                    {showLangPicker && (
                        <div style={{ position:'absolute', top:'110%', right:0, zIndex:100, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', padding:8, minWidth:180 }}>
                            {!hasApi && <div style={{ padding:'6px 10px', fontSize:10, color:'#d97706', background:'#fef3c7', borderRadius:8, marginBottom:6 }}>⚠ Demo mode</div>}
                            {LANGUAGES.map(l => (
                                <button key={l.code} onClick={() => handleTranslate(l)}
                                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'none', background: selectedLang?.code === l.code ? '#ede9fe' : 'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color:'#374151' }}>
                                    <span>{l.flag}</span> {l.label}
                                    {selectedLang?.code === l.code && showTranslated && <span style={{ marginLeft:'auto', fontSize:10, color:'#7c3aed' }}>✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {translated && (
                    <button onClick={() => setShowTranslated(!showTranslated)}
                        style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #059669', background: showTranslated ? '#d1fae5' : '#f9fafb', color:'#059669', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {showTranslated ? '📄 Original' : `${selectedLang?.flag} Translated`}
                    </button>
                )}

                <button onClick={() => window.location.href = `/smart-mail/${mail.id}/download`}
                    style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:12, cursor:'pointer' }}>
                    ⬇️
                </button>
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>

                <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 16px' }}>
                    {mail.subject || '(No Subject)'}
                    {mail.ai_generated && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'#ede9fe', color:'#7c3aed', fontWeight:700, marginLeft:8 }}>✨ AI</span>}
                </h2>

                {/* Sender card */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'14px 16px', background:'#f9fafb', borderRadius:12, border:'1px solid #e5e7eb' }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', background:avatarColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, flexShrink:0 }}>
                        {getInitial(mail.from_name, mail.from_address)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{mail.from_name || mail.from_address}</div>
                        {mail.from_name && <div style={{ fontSize:11, color:'#9ca3af' }}>{mail.from_address}</div>}
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                            To: {mail.to_addresses?.join(', ')}
                            {mail.cc_addresses?.length > 0 && ` · CC: ${mail.cc_addresses.join(', ')}`}
                        </div>
                    </div>
                    <div style={{ fontSize:11, color:'#9ca3af', flexShrink:0 }}>{mail.mail_date}</div>
                </div>

                {/* Translate banner */}
                {showTranslated && selectedLang && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#d1fae5', borderRadius:10, border:'1px solid #86efac', marginBottom:16, fontSize:12, color:'#065f46', fontWeight:600 }}>
                        <span>{selectedLang.flag}</span> Showing {selectedLang.label} translation
                        <button onClick={() => setShowTranslated(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#065f46', fontSize:14 }}>×</button>
                    </div>
                )}

                {/* Mail body */}
                <div style={{ fontSize:14, color:'#374151', lineHeight:1.7 }}>
                    {showTranslated && translated ? (
                        <div style={{ whiteSpace:'pre-wrap' }}>{translated}</div>
                    ) : mail.body_html ? (
                        <iframe
                            srcDoc={mail.body_html}
                            sandbox="allow-same-origin allow-scripts allow-popups"
                            style={{
                                width: '100%',
                                minHeight: 400,
                                border: 'none',
                                borderRadius: 8,
                            }}
                            onLoad={e => {
                                const doc = e.target.contentDocument;
                                if (doc) {
                                    e.target.style.height = doc.body.scrollHeight + 'px';
                                }
                            }}
                        />
                    ) : (
                        <div style={{ whiteSpace:'pre-wrap' }}>{mail.body_text || '(No content)'}</div>
                    )}
                </div>

                {/* Attachments */}
                {mail.attachments?.length > 0 && (
                    <div style={{ marginTop:24 }}>
                        <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', letterSpacing:'0.5px', marginBottom:10 }}>ATTACHMENTS ({mail.attachments.length})</div>
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                            {mail.attachments.map(att => (
                                <div key={att.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10 }}>
                                    <span style={{ fontSize:20 }}>📎</span>
                                    <div>
                                        <div style={{ fontSize:12, fontWeight:600, color:'#111827' }}>{att.filename}</div>
                                        <div style={{ fontSize:10, color:'#9ca3af' }}>{att.file_size}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}