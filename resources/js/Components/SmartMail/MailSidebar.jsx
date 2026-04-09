// resources/js/Components/SmartMail/MailSidebar.jsx

export default function MailSidebar({
    activeTab,
    onTabChange,
    unreadCount  = 0,
    inboxCount   = 0,
    sentCount    = 0,
    starredCount = 0,
    mailSetting  = null,
    onCompose,
    onSync,
    onLoadMore,
    hasMore      = false,
    syncing      = false,
    theme,
    darkMode     = false,
}) {
    const tabs = [
        {
            key:   'inbox',
            label: 'Inbox',
            count: inboxCount,
            badge: unreadCount,
            color: theme.primary,
            soft:  theme.primarySoft,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                </svg>
            ),
        },
        {
            key:   'sent',
            label: 'Sent',
            count: sentCount,
            badge: 0,
            color: theme.secondary,
            soft:  theme.secondarySoft,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            ),
        },
        {
            key:   'starred',
            label: 'Starred',
            count: starredCount,
            badge: 0,
            color: theme.warning,
            soft:  theme.warningSoft,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill={activeTab === 'starred' ? theme.warning : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            ),
        },
    ];

    return (
        <div style={{
            width: 230, flexShrink: 0,
            background: theme.panelSolid,
            borderRight: `1px solid ${theme.border}`,
            display: 'flex', flexDirection: 'column',
            height: '100%',
        }}>

            {/* Header */}
            <div style={{ padding: '18px 14px 12px' }}>
                <div style={{
                    fontSize: 10, fontWeight: 900,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: theme.textMute, marginBottom: 12,
                }}>
                    Mailbox
                </div>

                {/* Compose Button */}
                <button
                    onClick={onCompose}
                    style={{
                        width: '100%', padding: '11px 14px',
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        color: '#fff',
                        border: 'none', borderRadius: 14,
                        fontSize: 13, fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8,
                        boxShadow: `0 6px 20px ${theme.primary}35`,
                        transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${theme.primary}45`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 20px ${theme.primary}35`; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Compose
                </button>
            </div>

            {/* Sync Button */}
            <div style={{ padding: '0 14px 10px' }}>
                <button
                    onClick={onSync}
                    disabled={syncing}
                    style={{
                        width: '100%', padding: '8px 14px',
                        background: syncing ? theme.panelSoft : 'transparent',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 12,
                        fontSize: 12, fontWeight: 600,
                        color: syncing ? theme.textMute : theme.textSoft,
                        cursor: syncing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 7,
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!syncing) e.currentTarget.style.background = theme.panelSoft; }}
                    onMouseLeave={e => { if (!syncing) e.currentTarget.style.background = 'transparent'; }}
                >
                    <span style={{
                        display: 'inline-flex',
                        animation: syncing ? 'spin 0.7s linear infinite' : 'none',
                    }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"/>
                            <polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                    </span>
                    {syncing ? 'Syncing...' : 'Sync Inbox'}
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: theme.border, margin: '0 14px 10px' }} />

            {/* Tabs */}
            <div style={{ padding: '0 10px', flex: 1, overflowY: 'auto' }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 12,
                                border: `1px solid ${isActive ? tab.color + '28' : 'transparent'}`,
                                background: isActive
                                    ? (darkMode ? `rgba(${tab.color === theme.primary ? '124,58,237' : tab.color === theme.secondary ? '37,99,235' : '217,119,6'},0.14)` : tab.soft)
                                    : 'transparent',
                                cursor: 'pointer', marginBottom: 3,
                                transition: 'all 0.14s',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = theme.rowHover; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {/* Icon */}
                            <span style={{ color: isActive ? tab.color : theme.textMute, display: 'flex', flexShrink: 0 }}>
                                {tab.icon}
                            </span>

                            {/* Label */}
                            <span style={{
                                flex: 1, textAlign: 'left',
                                fontSize: 13, fontWeight: isActive ? 800 : 500,
                                color: isActive ? tab.color : theme.textSoft,
                            }}>
                                {tab.label}
                            </span>

                            {/* Count chip */}
                            {tab.count > 0 && tab.badge === 0 && (
                                <span style={{
                                    minWidth: 20, height: 18, padding: '0 6px',
                                    background: theme.panelSoft,
                                    border: `1px solid ${theme.border}`,
                                    color: theme.textMute,
                                    borderRadius: 99, fontSize: 10, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {tab.count > 99 ? '99+' : tab.count}
                                </span>
                            )}

                            {/* Unread badge (red) */}
                            {tab.badge > 0 && (
                                <span style={{
                                    minWidth: 20, height: 18, padding: '0 6px',
                                    background: theme.danger,
                                    color: '#fff',
                                    borderRadius: 99, fontSize: 10, fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 2px 8px ${theme.danger}50`,
                                }}>
                                    {tab.badge > 99 ? '99+' : tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Load More */}
                {hasMore && (
                    <button
                        onClick={onLoadMore}
                        disabled={syncing}
                        style={{
                            width: '100%', marginTop: 6,
                            padding: '8px', borderRadius: 10,
                            border: `1px dashed ${theme.border}`,
                            background: 'transparent',
                            color: theme.textMute,
                            fontSize: 11, fontWeight: 600,
                            cursor: syncing ? 'not-allowed' : 'pointer',
                            transition: 'all 0.14s',
                        }}
                        onMouseEnter={e => { if (!syncing) e.currentTarget.style.background = theme.panelSoft; }}
                        onMouseLeave={e => { if (!syncing) e.currentTarget.style.background = 'transparent'; }}
                    >
                        {syncing ? 'Loading...' : '↓ Load More'}
                    </button>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: theme.border, margin: '8px 14px' }} />

            {/* Connected Account */}
            {mailSetting && (
                <div style={{ padding: '8px 14px 18px' }}>
                    <div style={{
                        fontSize: 10, fontWeight: 900,
                        letterSpacing: '0.10em', textTransform: 'uppercase',
                        color: theme.textMute, marginBottom: 8,
                    }}>
                        Connected Account
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px',
                        background: theme.panelSoft,
                        borderRadius: 14,
                        border: `1px solid ${theme.border}`,
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                            color: '#fff',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 13,
                            fontWeight: 800, flexShrink: 0,
                        }}>
                            {mailSetting.mail_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: 12, fontWeight: 700,
                                color: theme.text,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {mailSetting.mail_name}
                            </div>
                            <div style={{
                                fontSize: 10, color: theme.textMute,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                marginTop: 1,
                            }}>
                                {mailSetting.mail_address}
                            </div>
                        </div>

                        {/* Status dot */}
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: mailSetting.is_verified ? theme.success : theme.danger,
                            boxShadow: `0 0 0 2px ${mailSetting.is_verified ? theme.successSoft : theme.dangerSoft}`,
                        }} title={mailSetting.is_verified ? 'Connected' : 'Not connected'} />
                    </div>

                    {mailSetting.last_synced_at && (
                        <div style={{ fontSize: 10, color: theme.textMute, marginTop: 6, textAlign: 'center' }}>
                            Synced · {mailSetting.last_synced_at}
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}