// resources/js/Pages/SmartMail.jsx

import { useState, useEffect, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MailSetup from '@/Components/SmartMail/MailSetup';
import MailSidebar from '@/Components/SmartMail/MailSidebar';
import MailList from '@/Components/SmartMail/MailList';
import MailView from '@/Components/SmartMail/MailView';
import ComposeModal from '@/Components/SmartMail/ComposeModal';

// ── Theme System (identical to UserRoles) ─────────────────────
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

function getTheme(darkMode) {
    if (darkMode) {
        return {
            pageBg: 'transparent',
            panel: 'linear-gradient(180deg, rgba(10,18,36,0.96) 0%, rgba(9,16,32,0.92) 100%)',
            panelSolid: '#0b1324',
            panelSoft: 'rgba(255,255,255,0.035)',
            panelSofter: 'rgba(255,255,255,0.055)',
            border: 'rgba(148,163,184,0.12)',
            borderStrong: 'rgba(148,163,184,0.2)',
            text: '#f8fafc',
            textSoft: '#cbd5e1',
            textMute: '#8da0b8',
            shadow: '0 28px 80px rgba(0,0,0,0.42)',
            shadowSoft: '0 16px 36px rgba(0,0,0,0.28)',
            overlay: 'rgba(2,8,23,0.72)',
            primary: '#7c3aed',
            primaryHover: '#6d28d9',
            primarySoft: 'rgba(124,58,237,0.16)',
            secondary: '#2563eb',
            secondaryHover: '#1d4ed8',
            secondarySoft: 'rgba(37,99,235,0.14)',
            success: '#10b981',
            successSoft: 'rgba(16,185,129,0.16)',
            warning: '#f59e0b',
            warningSoft: 'rgba(245,158,11,0.16)',
            danger: '#f87171',
            dangerHover: '#ef4444',
            dangerSoft: 'rgba(248,113,113,0.14)',
            inputBg: 'rgba(255,255,255,0.04)',
            inputBorder: 'rgba(148,163,184,0.16)',
            glass: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            rowHover: 'rgba(255,255,255,0.03)',
            tableHead: 'rgba(255,255,255,0.03)',
        };
    }
    return {
        pageBg: 'transparent',
        panel: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,255,0.96) 100%)',
        panelSolid: '#ffffff',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.14)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        shadow: '0 24px 70px rgba(15,23,42,0.10)',
        shadowSoft: '0 8px 24px rgba(15,23,42,0.07)',
        overlay: 'rgba(15,23,42,0.36)',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',
        secondary: '#2563eb',
        secondaryHover: '#1d4ed8',
        secondarySoft: '#eff6ff',
        success: '#059669',
        successSoft: '#d1fae5',
        warning: '#d97706',
        warningSoft: '#fef3c7',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        dangerSoft: '#fee2e2',
        inputBg: '#f8fafc',
        inputBorder: '#e2e8f0',
        glass: 'linear-gradient(135deg, rgba(124,58,237,0.03) 0%, rgba(37,99,235,0.02) 100%)',
        rowHover: '#fafbff',
        tableHead: '#f8fafc',
    };
}

// ── Shared UIButton ───────────────────────────────────────────
function UIButton({ children, onClick, type = 'button', variant = 'primary', disabled = false, theme, style = {} }) {
    const cfg = {
        primary: {
            bg: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            color: '#fff',
            border: 'none',
            hoverBg: `linear-gradient(135deg, ${theme.primaryHover} 0%, ${theme.secondaryHover} 100%)`,
            shadow: `0 8px 24px ${theme.primary}30`,
        },
        ghost: {
            bg: theme.panelSoft,
            color: theme.textSoft,
            border: `1px solid ${theme.border}`,
            hoverBg: theme.panelSofter,
            shadow: 'none',
        },
        danger: {
            bg: theme.danger,
            color: '#fff',
            border: 'none',
            hoverBg: theme.dangerHover,
            shadow: `0 8px 24px ${theme.danger}30`,
        },
    }[variant] || {};

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 14,
                border: cfg.border,
                background: disabled ? theme.textMute : cfg.bg,
                color: cfg.color,
                fontSize: 13,
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                whiteSpace: 'nowrap',
                boxShadow: disabled ? 'none' : cfg.shadow,
                transition: 'all 0.18s ease',
                ...style,
            }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = cfg.hoverBg; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = cfg.bg; e.currentTarget.style.transform = 'translateY(0)'; } }}
        >
            {children}
        </button>
    );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, type, onClose, theme }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [message]);
    if (!message) return null;

    const cfg = {
        success: { bg: theme.successSoft, border: theme.success, color: theme.success, icon: '✓' },
        error:   { bg: theme.dangerSoft,  border: theme.danger,  color: theme.danger,  icon: '✕' },
        warning: { bg: theme.warningSoft, border: theme.warning, color: theme.warning, icon: '!' },
        info:    { bg: theme.primarySoft, border: theme.primary, color: theme.primary, icon: 'i' },
    };
    const c = cfg[type] || cfg.info;

    return (
        <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px',
            background: theme.panelSolid,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            boxShadow: theme.shadow,
            minWidth: 300,
            animation: 'slideIn 0.22s ease',
        }}>
            <span style={{
                width: 28, height: 28, borderRadius: 10,
                background: c.bg, color: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, flexShrink: 0,
            }}>{c.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, flex: 1 }}>{message}</span>
            <button onClick={onClose} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: theme.textMute, fontSize: 16, lineHeight: 1,
            }}>×</button>
        </div>
    );
}

// ── New Mail Notification ─────────────────────────────────────
function NewMailNotif({ mail, onClose, onView, theme }) {
    useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, []);
    if (!mail) return null;

    const initial = (mail.from_name || mail.from_address || '?').charAt(0).toUpperCase();

    return (
        <div style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9998,
            background: theme.panelSolid,
            border: `1px solid ${theme.borderStrong}`,
            borderRadius: 20,
            boxShadow: theme.shadow,
            padding: '16px 18px',
            width: 310,
            animation: 'slideUp 0.3s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0,
                }}>{initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>New Mail</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mail.from_name || mail.from_address}
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMute, fontSize: 16 }}>×</button>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: theme.textSoft, marginBottom: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {typeof mail.subject === 'string' ? mail.subject : '(No Subject)'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{
                    flex: 1, padding: '8px', borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: theme.panelSoft, color: theme.textSoft,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Dismiss</button>
                <button onClick={() => { onView(); onClose(); }} style={{
                    flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>View Mail</button>
            </div>
        </div>
    );
}

// ── Settings Modal ────────────────────────────────────────────
function SettingsModal({ open, onClose, mailSetting, theme, onShowToast }) {
    if (!open) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: theme.overlay,
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />
            <div style={{
                position: 'relative',
                background: theme.panelSolid,
                border: `1px solid ${theme.borderStrong}`,
                borderRadius: 24,
                width: '100%', maxWidth: 540,
                maxHeight: '90vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'none',      // ← Firefox
                msOverflowStyle: 'none',     // ← IE
                boxShadow: theme.shadow,
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: 16, right: 16, zIndex: 10,
                    background: theme.panelSoft,
                    border: `1px solid ${theme.border}`,
                    width: 34, height: 34, borderRadius: 10,
                    cursor: 'pointer', fontSize: 16,
                    color: theme.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
                <MailSetup
                    mailSetting={mailSetting}
                    onSuccess={() => {
                        onClose();
                        router.reload({ only: ['mailSetting'] });
                    }}
                />
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────
export default function SmartMail({
    mailSetting = null, inbox = [], sent = [], unreadCount = 0,
    templates = [], systemUsers = [], leaveTypes = [], needsSetup = false, hasApi = false,
}) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [toast, setToast]               = useState(null);
    const [activeTab, setActiveTab]       = useState('inbox');
    const [selectedMail, setSelectedMail] = useState(null);
    const [syncing, setSyncing]           = useState(false);
    const [newMailNotif, setNewMailNotif] = useState(null);
    const [showCompose, setShowCompose]   = useState(false);
    const [replyTo, setReplyTo]           = useState(null);
    const [forwardMail, setForwardMail]   = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    const [syncPage, setSyncPage]     = useState(1);
    const [hasMore, setHasMore]       = useState(true);
    const [inboxMails, setInboxMails] = useState(inbox);
    const [sentMails, setSentMails]   = useState(sent);
    const [totalMails, setTotalMails] = useState(0);
    const [unreadMails, setUnreadMails] = useState(inbox.filter(m => !m.is_read).length);

    // ref guard မလိုတော့ဘူး — flash useEffect ဖြုတ်ပစ်ပြီ
    // toast က SettingsModal onSuccess callback ကနေပဲ ပြမယ်
    const showToast = (msg, type = 'success') => setToast({ msg, type });

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
                    setUnreadMails(merged.filter(m => !m.is_read).length);
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
            router.reload({ only: ['sent'], preserveScroll: true });
        }
    };

    const handleSelectMail = async (mail) => {
        setSelectedMail(mail);
        if (!mail.is_read) {
            setInboxMails(prev => prev.map(m => m.id === mail.id ? { ...m, is_read: true } : m));
            setUnreadMails(prev => Math.max(0, prev - 1));
            fetch(`/smart-mail/${mail.id}/read`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        }
    };

    const handleDeleteMail = (id) => {
        setInboxMails(prev => prev.filter(m => m.id !== id));
        setSentMails(prev => prev.filter(m => m.id !== id));
        if (selectedMail?.id === id) setSelectedMail(null);
    };

    // Star toggle — optimistic, no reload
    const handleStarMail = (id, starred) => {
        const toggle = m => m.id === id ? { ...m, is_starred: starred } : m;
        setInboxMails(prev => prev.map(toggle));
        setSentMails(prev => prev.map(toggle));
    };

    const currentMails = activeTab === 'inbox'
        ? inboxMails
        : activeTab === 'sent'
            ? sentMails
            : [...inboxMails, ...sentMails].filter(m => m.is_starred);

    const starredCount = [...inboxMails, ...sentMails].filter(m => m.is_starred).length;

    // NeedsSetup screen
    if (needsSetup) {
        return (
            <AppLayout title="Smart Mail">
                <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }`}</style>
                <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} theme={theme} />
                <div style={{
                    background: theme.panel,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 24,
                    boxShadow: theme.shadow,
                    overflow: 'hidden',
                }}>
                    <MailSetup mailSetting={mailSetting} />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Smart Mail">
            <style>{`
                @keyframes slideIn  { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
                @keyframes slideUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin     { to { transform:rotate(360deg); } }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            `}</style>

            <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} theme={theme} />
            <NewMailNotif
                mail={newMailNotif}
                onClose={() => setNewMailNotif(null)}
                onView={() => { setActiveTab('inbox'); setSelectedMail(newMailNotif); }}
                theme={theme}
            />

            {/* Page wrapper */}
            <div style={{ display: 'grid', gap: 18 }}>

                {/* Header Card */}
                <div style={{
                    background: theme.panel,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 24,
                    boxShadow: theme.shadowSoft,
                    padding: '20px 26px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative glow */}
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: theme.primarySoft, pointerEvents: 'none', filter: 'blur(40px)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 16,
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, boxShadow: `0 8px 24px ${theme.primary}40`,
                        }}>📬</div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.primary, marginBottom: 3 }}>
                                Smart Mail
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: theme.text, lineHeight: 1.1 }}>
                                {mailSetting?.mail_name || 'Mail'}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textMute, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{mailSetting?.mail_address}</span>
                                {!hasApi && (
                                    <span style={{ padding: '1px 8px', borderRadius: 99, background: theme.warningSoft, color: theme.warning, fontSize: 10, fontWeight: 800 }}>
                                        Demo Mode
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
                        {/* Unread badge */}
                        {unreadMails > 0 && (
                            <div style={{
                                padding: '6px 14px', borderRadius: 99,
                                background: theme.primarySoft,
                                color: theme.primary,
                                fontSize: 12, fontWeight: 800,
                                border: `1px solid ${theme.primary}30`,
                            }}>
                                {unreadMails} unread
                            </div>
                        )}
                        <UIButton variant="ghost" theme={theme} onClick={() => setShowSettings(true)} style={{ height: 38 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                            Mail Settings
                        </UIButton>
                    </div>
                </div>

                {/* Main Mail Panel */}
                <div style={{
                    background: theme.panel,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 24,
                    boxShadow: theme.shadow,
                    overflow: 'hidden',
                    display: 'flex',
                    height: 'calc(100vh - 220px)',
                    minHeight: 520,
                }}>
                    <MailSidebar
                        activeTab={activeTab}
                        onTabChange={(tab) => { setActiveTab(tab); setSelectedMail(null); }}
                        unreadCount={unreadMails}
                        inboxCount={inboxMails.length}
                        sentCount={sentMails.length}
                        starredCount={starredCount}
                        mailSetting={mailSetting}
                        onCompose={handleCompose}
                        onSync={() => handleSync(1)}
                        onLoadMore={() => handleSync(syncPage)}
                        hasMore={hasMore}
                        syncing={syncing}
                        theme={theme}
                        darkMode={darkMode}
                    />
                    <MailList
                        mails={currentMails}
                        activeTab={activeTab}
                        selectedMail={selectedMail}
                        onSelectMail={handleSelectMail}
                        onShowToast={showToast}
                        onDeleteMail={handleDeleteMail}
                        onStarMail={handleStarMail}
                        theme={theme}
                        darkMode={darkMode}
                    />
                    <MailView
                        mail={selectedMail}
                        hasApi={hasApi}
                        onReply={handleReply}
                        onForward={handleForward}
                        onShowToast={showToast}
                        theme={theme}
                        darkMode={darkMode}
                    />
                </div>
            </div>

            <ComposeModal
                open={showCompose}
                onClose={() => { setShowCompose(false); setReplyTo(null); setForwardMail(null); }}
                onSuccess={handleSendSuccess}
                systemUsers={systemUsers}
                templates={templates}
                leaveTypes={leaveTypes}
                hasApi={hasApi}
                replyTo={replyTo}
                forwardMail={forwardMail}
                theme={theme}
                darkMode={darkMode}
            />

            <SettingsModal
                open={showSettings}
                onClose={() => setShowSettings(false)}
                mailSetting={mailSetting}
                theme={theme}
                onShowToast={showToast}
            />
        </AppLayout>
    );
}