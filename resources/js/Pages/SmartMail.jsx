// resources/js/Pages/SmartMail.jsx

import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MailSetup from '@/Components/SmartMail/MailSetup';
import MailSidebar from '@/Components/SmartMail/MailSidebar';
import MailList from '@/Components/SmartMail/MailList';
import MailView from '@/Components/SmartMail/MailView';
import ComposeModal from '@/Components/SmartMail/ComposeModal';

function Toast({ message, type, onClose }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [message]);
    if (!message) return null;
    const s = {
        success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✅' },
        error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '❌' },
        warning: { bg: '#fef3c7', border: '#fcd34d', color: '#92400e', icon: '⚠️' },
        info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', icon: 'ℹ️' },
    };
    const c = s[type] || s.info;
    return (
        <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', alignItems:'center', gap:10, padding:'12px 18px', background:c.bg, border:`1px solid ${c.border}`, borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12)', minWidth:300, animation:'slideIn 0.2s ease' }}>
            <span style={{ fontSize:18 }}>{c.icon}</span>
            <span style={{ fontSize:13, fontWeight:600, color:c.color, flex:1 }}>{message}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:c.color, fontSize:18 }}>×</button>
        </div>
    );
}

function NewMailNotif({ mail, onClose, onView }) {
    useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, []);
    if (!mail) return null;
    return (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9998, background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', padding:'14px 16px', width:300, animation:'slideUp 0.3s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#7c3aed', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0 }}>
                    {(mail.from_name || mail.from_address || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'#7c3aed', marginBottom:1 }}>📬 New Mail</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {mail.from_name || mail.from_address}
                    </div>
                </div>
                <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18 }}>×</button>
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {typeof mail.subject === 'string' ? mail.subject : '(No Subject)'}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <button onClick={onClose} style={{ flex:1, padding:'6px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:11, fontWeight:600, cursor:'pointer' }}>Dismiss</button>
                <button onClick={() => { onView(); onClose(); }} style={{ flex:1, padding:'6px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>View Mail</button>
            </div>
        </div>
    );
}

export default function SmartMail({
    mailSetting = null, inbox = [], sent = [], unreadCount = 0,
    templates = [], systemUsers = [], needsSetup = false, hasApi = false,
}) {
    const { flash } = usePage().props;

    const [toast, setToast]               = useState(flash?.success ? { msg:flash.success, type:'success' } : null);
    const [activeTab, setActiveTab]       = useState('inbox');
    const [selectedMail, setSelectedMail] = useState(null);
    const [syncing, setSyncing]           = useState(false);
    const [newMailNotif, setNewMailNotif] = useState(null);
    const [showCompose, setShowCompose]   = useState(false);
    const [replyTo, setReplyTo]           = useState(null);
    const [forwardMail, setForwardMail]   = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // Sync state
    const [syncPage, setSyncPage]       = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [inboxMails, setInboxMails]   = useState(inbox);
    const [sentMails, setSentMails]     = useState(sent);
    const [totalMails, setTotalMails]   = useState(0);

    // unreadCount ကို local state ထဲထည့်
    const [unreadMails, setUnreadMails] = useState(
        inbox.filter(m => !m.is_read).length
    );

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    useEffect(() => {
        if (flash?.success) setToast({ msg:flash.success, type:'success' });
        if (flash?.error)   setToast({ msg:flash.error,   type:'error'   });
    }, [flash]);

    // Realtime
    useEffect(() => {
        if (needsSetup || !window.Echo || !window.userId) return;
        const channel = window.Echo.private(`user.${window.userId}`);
        channel.listen('.new-mail', (data) => {
            setNewMailNotif(data);
            setInboxMails(prev => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [data, ...prev];
            });
        });
        return () => window.Echo.leave(`user.${window.userId}`);
    }, [needsSetup]);


    // sync response လာရင် merge လုပ်
    const handleSync = async (page = 1) => {
        setSyncing(true);
        try {
            const res = await fetch(`/smart-mail/sync?page=${page}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            const data = await res.json();
            if (data.success) {
                setInboxMails(prev => {
                    const existingIds = new Set(prev.map(m => m.mail_uid));
                    const newMails = data.mails.filter(m => !existingIds.has(m.mail_uid));
                    const updated = prev.map(m => {
                        const fresh = data.mails.find(f => f.mail_uid === m.mail_uid);
                        return fresh ? { ...fresh, is_read: m.is_read } : m;
                    });
                    const merged = [...newMails, ...updated].sort(
                        (a, b) => new Date(b.mail_date) - new Date(a.mail_date)
                    );

                    // ✅ merged ထဲမှာ တွက်တာ — prev scope မှာမဟုတ်
                    const newUnread = merged.filter(m => !m.is_read).length;
                    setUnreadMails(newUnread);

                    return merged;
                });

                if (data.has_more !== undefined) setHasMore(data.has_more);
                if (data.total)                  setTotalMails(data.total);
                if (data.next_page)              setSyncPage(data.next_page);
            }
        } finally {
            setSyncing(false);
        }
    };

    const handleCompose = () => { setReplyTo(null); setForwardMail(null); setShowCompose(true); };
    const handleReply   = (m) => { setReplyTo(m);   setForwardMail(null); setShowCompose(true); };
    const handleForward = (m) => { setForwardMail(m); setReplyTo(null);   setShowCompose(true); };

    const handleSendSuccess = (msg, sentMail = null) => {
        showToast(msg);
        if (sentMail) {
            setSentMails(prev => [sentMail, ...prev]);
        } else {
            // sentMail မပါလာရင် sent list ကိုပဲ reload
            router.reload({ only: ['sent'], preserveScroll: true });
        }
    };

    const currentMails = activeTab === 'inbox'
        ? inboxMails
        : activeTab === 'sent'
            ? sentMails
            : [...inboxMails, ...sentMails].filter(m => m.is_starred);

    const starredCount = [...inboxMails, ...sentMails].filter(m => m.is_starred).length;

    if (needsSetup) {
        return (
            <AppLayout title="Smart Mail">
                <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
                <MailSetup mailSetting={mailSetting} />
            </AppLayout>
        );
    }

    // mail select လုပ်တဲ့အချိန် read mark လုပ်
    const handleSelectMail = async (mail) => {
        setSelectedMail(mail);
        
        if (!mail.is_read) {
            // ✅ UI ချက်ချင်း update
            setInboxMails(prev => prev.map(m =>
                m.id === mail.id ? { ...m, is_read: true } : m
            ));
            setUnreadMails(prev => Math.max(0, prev - 1));
            
            // ✅ Backend mark read
            await fetch(`/smart-mail/${mail.id}/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
        }
    };

    const handleDeleteMail = (mailId) => {
        setInboxMails(prev => prev.filter(m => m.id !== mailId));
        setSentMails(prev => prev.filter(m => m.id !== mailId));
        if (selectedMail?.id === mailId) setSelectedMail(null);
    };

    return (
        <AppLayout title="Smart Mail">
            <style>{`
                @keyframes slideIn { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
                @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
                @keyframes spin    { to{transform:rotate(360deg)} }
            `}</style>

            <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

            {newMailNotif && (
                <NewMailNotif
                    mail={newMailNotif}
                    onClose={() => setNewMailNotif(null)}
                    onView={() => {
                        setActiveTab('inbox');
                        setSelectedMail(inboxMails.find(m => m.id === newMailNotif.id) || null);
                    }}
                />
            )}

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                    <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:0 }}>📧 Smart Mail</h2>
                    <p style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>
                        Send & receive with AI translation · {mailSetting?.mail_address}
                        {!hasApi && <span style={{ marginLeft:8, color:'#f59e0b', fontWeight:600 }}>· Demo Mode</span>}
                    </p>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:'1px solid #e5e7eb', background:'#f9fafb', borderRadius:10, fontSize:12, fontWeight:600, color:'#374151', cursor:'pointer' }}>
                    ⚙️ Mail Settings
                </button>
            </div>

            {/* Main Layout */}
            <div style={{ display:'flex', background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', height:'calc(100vh - 220px)', minHeight:500 }}>
                <MailSidebar
                    activeTab={activeTab}
                    onTabChange={(tab) => { setActiveTab(tab); setSelectedMail(null); }}
                    unreadCount={unreadMails}
                    inboxCount={inboxMails.length}
                    sentCount={sentMails.length}
                    starredCount={starredCount}
                    mailSetting={mailSetting}
                    onCompose={handleCompose}
                    onSync={() => handleSync(1)}         // Sync Inbox = fresh
                    onLoadMore={() => handleSync(syncPage)}    // Load More = next page
                    hasMore={hasMore}
                    syncing={syncing}
                />
                <MailList
                    mails={currentMails}
                    activeTab={activeTab}
                    selectedMail={selectedMail}
                    onSelectMail={handleSelectMail}
                    onShowToast={showToast}
                    onDeleteMail={handleDeleteMail}
                />
                <MailView
                    mail={selectedMail}
                    hasApi={hasApi}
                    onReply={handleReply}
                    onForward={handleForward}
                    onShowToast={showToast}
                />
            </div>

            <ComposeModal
                open={showCompose}
                onClose={() => { setShowCompose(false); setReplyTo(null); setForwardMail(null); }}
                onSuccess={handleSendSuccess}
                systemUsers={systemUsers}
                templates={templates}
                hasApi={hasApi}
                replyTo={replyTo}
                forwardMail={forwardMail}
            />

            {/* Mail Settings Modal */}
            {showSettings && (
                <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                    <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', position:'relative', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
                        <button
                            onClick={() => setShowSettings(false)}
                            style={{ position:'absolute', top:16, right:16, zIndex:10, background:'rgba(255,255,255,0.9)', border:'1px solid #e5e7eb', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:18, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>×
                        </button>
                        <MailSetup
                            mailSetting={mailSetting}
                            onSuccess={() => {
                                setShowSettings(false);
                                showToast('Mail settings updated! ✓');
                                router.reload({ only:['mailSetting'] });
                            }}
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}