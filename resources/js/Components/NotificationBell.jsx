// ─────────────────────────────────────────────────────────────────────────────
//  NotificationBell.jsx
//  Drop-in component for AppLayout header.
//
//  Features:
//    • REST fetch on mount (GET /notifications)
//    • WebSocket (Reverb) listener on private-user.{id} → notification.sent
//    • Unread count badge (purple dot)
//    • Dropdown panel — grouped by date, type icons, relative timestamps
//    • Click item → markRead (PATCH) → count decreases
//    • "Mark all read" button
//    • Smooth open/close animation
//    • Dark / Light mode via props
//
//  Usage in AppLayout.jsx header:
//    import NotificationBell from '@/Components/NotificationBell';
//    ...
//    <NotificationBell userId={user?.id} theme={theme} darkMode={darkMode} />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// ── Type → icon + color map (extensible) ─────────────────────
const TYPE_CONFIG = {
    leave_request: {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        ),
        color:  '#7c3aed',
        bgDay:  '#f3e8ff',
        bgNight:'rgba(124,58,237,0.18)',
        label:  'Leave',
    },
    overtime_request: {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
        ),
        color:  '#d97706',
        bgDay:  '#fef3c7',
        bgNight:'rgba(217,119,6,0.18)',
        label:  'Overtime',
    },
    payroll: {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
        ),
        color:  '#059669',
        bgDay:  '#d1fae5',
        bgNight:'rgba(5,150,105,0.18)',
        label:  'Payroll',
    },
    system: {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
        ),
        color:  '#2563eb',
        bgDay:  '#dbeafe',
        bgNight:'rgba(37,99,235,0.18)',
        label:  'System',
    },
};

const getTypeCfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.system;

// ── Relative time ─────────────────────────────────────────────
function relTime(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Group notifications by date ───────────────────────────────
function groupByDate(items) {
    const groups = {};
    items.forEach(n => {
        const d = new Date(n.created_at);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let key;
        if (d.toDateString() === today.toDateString())     key = 'Today';
        else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
        else key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(n);
    });
    return groups;
}

// ═════════════════════════════════════════════════════════════
//  Main component
// ═════════════════════════════════════════════════════════════
export default function NotificationBell({ userId, theme, darkMode }) {
    const [open, setOpen]           = useState(false);
    const [items, setItems]         = useState([]);
    const [unread, setUnread]       = useState(0);
    const [loading, setLoading]     = useState(false);
    const [pulse, setPulse]         = useState(false);   // badge pulse on new notification
    const panelRef                  = useRef(null);
    const btnRef                    = useRef(null);
    const fetchedRef                = useRef(false);

    // ── Fetch from REST on first open ────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await axios.get('/notifications');
            setItems(res.data.notifications || []);
            setUnread(res.data.unread_count || 0);
        } catch (e) {
            console.error('Notification fetch error', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch unread count silently on mount (for badge)
    useEffect(() => {
        if (!userId) return;
        axios.get('/notifications').then(res => {
            setItems(res.data.notifications || []);
            setUnread(res.data.unread_count || 0);
            fetchedRef.current = true;
        }).catch(() => {});
    }, [userId]);

    // ── WebSocket listener ────────────────────────────────────
    useEffect(() => {
        if (!userId || !window.Echo) return;

        const channel = window.Echo.private(`user.${userId}`);

        channel.listen('.notification.sent', (payload) => {
            // Prepend new notification
            setItems(prev => [payload, ...prev]);
            setUnread(prev => prev + 1);

            // Pulse animation on badge
            setPulse(true);
            setTimeout(() => setPulse(false), 1000);

            // Browser notification (optional — only if tab not focused)
            if (document.hidden && Notification?.permission === 'granted') {
                new Notification(payload.title, { body: payload.body, icon: '/favicon.ico' });
            }
        });

        return () => {
            channel.stopListening('.notification.sent');
        };
    }, [userId]);

    // ── Close panel on outside click ─────────────────────────
    useEffect(() => {
        const fn = (e) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                btnRef.current   && !btnRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    // ── Mark single read ──────────────────────────────────────
    const markRead = async (item) => {
        if (item.read_at) {
            // Already read — just navigate
            if (item.url) window.location.href = item.url;
            return;
        }
        try {
            await axios.patch(`/notifications/${item.id}/read`);
            setItems(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnread(prev => Math.max(0, prev - 1));
        } catch (e) { /* ignore */ }
        if (item.url) window.location.href = item.url;
    };

    // ── Mark all read ─────────────────────────────────────────
    const markAllRead = async () => {
        try {
            await axios.patch('/notifications/read-all');
            setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
            setUnread(0);
        } catch (e) { /* ignore */ }
    };

    // ── Toggle panel ──────────────────────────────────────────
    const toggle = () => setOpen(v => !v);

    // ── Grouped items ─────────────────────────────────────────
    const groups = groupByDate(items);

    // ── Styles ────────────────────────────────────────────────
    const isDark = darkMode;
    const T = {
        panelBg:     isDark ? '#0f1729' : '#ffffff',
        panelBorder: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)',
        shadow:      isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(15,23,42,0.14)',
        headerBg:    isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
        headerBorder:isDark ? 'rgba(148,163,184,0.1)'  : 'rgba(15,23,42,0.06)',
        text:        isDark ? '#f1f5f9' : '#0f172a',
        textSoft:    isDark ? '#94a3b8' : '#64748b',
        textMute:    isDark ? '#475569' : '#94a3b8',
        groupLabel:  isDark ? 'rgba(148,163,184,0.6)' : '#94a3b8',
        itemHov:     isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
        itemUnread:  isDark ? 'rgba(124,58,237,0.08)'  : '#faf5ff',
        divider:     isDark ? 'rgba(148,163,184,0.07)' : 'rgba(15,23,42,0.05)',
        emptyIcon:   isDark ? '#334155' : '#e2e8f0',
        btnBg:       isDark ? 'rgba(255,255,255,0.05)'  : '#ffffff',
        btnBorder:   isDark ? 'rgba(148,163,184,0.14)'  : 'rgba(15,23,42,0.06)',
        btnColor:    isDark ? '#e2e8f0' : '#334155',
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* ── Bell button ── */}
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                style={{
                    position: 'relative',
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    border: `1px solid ${T.btnBorder}`,
                    background: open ? (isDark ? 'rgba(124,58,237,0.15)' : '#f3e8ff') : T.btnBg,
                    color: open ? '#7c3aed' : T.btnColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.18s',
                    outline: 'none',
                }}
                onMouseEnter={e => {
                    if (!open) {
                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9';
                        e.currentTarget.style.borderColor = isDark ? 'rgba(148,163,184,0.25)' : 'rgba(15,23,42,0.12)';
                    }
                }}
                onMouseLeave={e => {
                    if (!open) {
                        e.currentTarget.style.background = T.btnBg;
                        e.currentTarget.style.borderColor = T.btnBorder;
                    }
                }}
                title="Notifications"
            >
                {/* Bell icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>

                {/* Unread badge */}
                {unread > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        minWidth: 17,
                        height: 17,
                        borderRadius: 99,
                        background: '#7c3aed',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        lineHeight: 1,
                        border: `2px solid ${isDark ? '#0f1729' : '#ffffff'}`,
                        animation: pulse ? 'ntfPulse 0.6s ease' : 'none',
                        fontFamily: 'inherit',
                    }}>
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* ── Dropdown panel ── */}
            {open && (
                <div
                    ref={panelRef}
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: 380,
                        maxHeight: 520,
                        borderRadius: 20,
                        border: `1px solid ${T.panelBorder}`,
                        background: T.panelBg,
                        boxShadow: T.shadow,
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 9999,
                        animation: 'ntfSlide 0.18s ease',
                    }}
                >
                    {/* ── Header ── */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: T.headerBg,
                        borderBottom: `1px solid ${T.headerBorder}`,
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Notifications</span>
                            {unread > 0 && (
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: 99,
                                    background: isDark ? 'rgba(124,58,237,0.2)' : '#f3e8ff',
                                    color: '#7c3aed',
                                    fontSize: 11,
                                    fontWeight: 800,
                                }}>
                                    {unread} new
                                </span>
                            )}
                        </div>
                        {unread > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#7c3aed',
                                    padding: '4px 8px',
                                    borderRadius: 8,
                                    fontFamily: 'inherit',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(124,58,237,0.12)' : '#f3e8ff'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* ── Body ── */}
                    <div style={{
                        overflowY: 'auto',
                        flex: 1,
                        scrollbarWidth: 'thin',
                        scrollbarColor: isDark ? 'rgba(255,255,255,0.1) transparent' : 'rgba(0,0,0,0.08) transparent',
                    }}>
                        {loading && items.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                                    borderTopColor: '#7c3aed',
                                    animation: 'ntfSpin 0.7s linear infinite',
                                    margin: '0 auto',
                                }}/>
                            </div>
                        ) : items.length === 0 ? (
                            /* ── Empty state ── */
                            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 18,
                                    background: T.emptyIcon,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 14px',
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                    </svg>
                                </div>
                                <div style={{ fontSize: 12, color: T.textMute }}>No notifications yet</div>
                            </div>
                        ) : (
                            Object.entries(groups).map(([dateLabel, groupItems]) => (
                                <div key={dateLabel}>
                                    {/* Date group label */}
                                    <div style={{
                                        padding: '10px 18px 4px',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: T.groupLabel,
                                    }}>
                                        {dateLabel}
                                    </div>

                                    {groupItems.map((item, idx) => {
                                        const cfg     = getTypeCfg(item.type);
                                        const isUnread = !item.read_at;
                                        const isLast   = idx === groupItems.length - 1;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => markRead(item)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 12,
                                                    padding: '12px 18px',
                                                    cursor: 'pointer',
                                                    borderBottom: isLast ? 'none' : `1px solid ${T.divider}`,
                                                    background: isUnread ? T.itemUnread : 'transparent',
                                                    transition: 'background 0.15s',
                                                    position: 'relative',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = isUnread
                                                    ? (isDark ? 'rgba(124,58,237,0.12)' : '#f5f0ff')
                                                    : T.itemHov}
                                                onMouseLeave={e => e.currentTarget.style.background = isUnread ? T.itemUnread : 'transparent'}
                                            >
                                                {/* Unread dot */}
                                                {isUnread && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: 6,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: '#7c3aed',
                                                    }}/>
                                                )}

                                                {/* Type icon */}
                                                <div style={{
                                                    width: 38,
                                                    height: 38,
                                                    borderRadius: 12,
                                                    background: isDark ? cfg.bgNight : cfg.bgDay,
                                                    color: cfg.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    marginLeft: 4,
                                                }}>
                                                    {cfg.icon}
                                                </div>

                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: 13,
                                                        fontWeight: isUnread ? 700 : 600,
                                                        color: T.text,
                                                        lineHeight: 1.3,
                                                        marginBottom: 3,
                                                    }}>
                                                        {item.title}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 12,
                                                        color: T.textSoft,
                                                        lineHeight: 1.5,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}>
                                                        {item.body}
                                                    </div>
                                                    <div style={{
                                                        marginTop: 5,
                                                        fontSize: 11,
                                                        color: T.textMute,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}>
                                                        <span style={{
                                                            padding: '1px 7px',
                                                            borderRadius: 99,
                                                            background: isDark ? cfg.bgNight : cfg.bgDay,
                                                            color: cfg.color,
                                                            fontWeight: 700,
                                                            fontSize: 10,
                                                        }}>
                                                            {cfg.label}
                                                        </span>
                                                        <span>{relTime(item.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    {/* ── Footer ── */}
                    {items.length > 0 && (
                        <div style={{
                            padding: '10px 18px',
                            borderTop: `1px solid ${T.headerBorder}`,
                            background: T.headerBg,
                            flexShrink: 0,
                            textAlign: 'center',
                        }}>
                            <span style={{ fontSize: 12, color: T.textMute }}>
                                Showing latest {items.length} notifications
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Animations ── */}
            <style>{`
                @keyframes ntfSlide {
                    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
                @keyframes ntfPulse {
                    0%   { transform: scale(1);   }
                    40%  { transform: scale(1.35); }
                    70%  { transform: scale(0.9);  }
                    100% { transform: scale(1);    }
                }
                @keyframes ntfSpin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}