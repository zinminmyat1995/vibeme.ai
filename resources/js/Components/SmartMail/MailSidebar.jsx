// resources/js/Components/SmartMail/MailSidebar.jsx

export default function MailSidebar({
    activeTab,
    onTabChange,
    unreadCount   = 0,
    inboxCount    = 0,
    sentCount     = 0,
    starredCount  = 0,
    mailSetting   = null,
    onCompose,
    onSync,
    syncing       = false,
}) {
    const tabs = [
        {
            key:   'inbox',
            label: 'Inbox',
            icon:  '📥',
            count: inboxCount,
            badge: unreadCount,
            color: '#7c3aed',
            bg:    '#ede9fe',
        },
        {
            key:   'sent',
            label: 'Sent',
            icon:  '📤',
            count: sentCount,
            badge: 0,
            color: '#2563eb',
            bg:    '#dbeafe',
        },
        {
            key:   'starred',
            label: 'Starred',
            icon:  '⭐',
            count: starredCount,
            badge: 0,
            color: '#d97706',
            bg:    '#fef3c7',
        },
    ];

    return (
        <div style={{
            width: 220, flexShrink: 0,
            background: '#fff',
            borderRight: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column',
            height: '100%',
        }}>

            {/* Compose Button */}
            <div style={{ padding: '16px 12px 10px' }}>
                <button
                    onClick={onCompose}
                    style={{
                        width: '100%', padding: '10px',
                        background: '#7c3aed', color: '#fff',
                        border: 'none', borderRadius: 12,
                        fontSize: 13, fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8,
                        boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
                >
                    <span style={{ fontSize: 16 }}>✏️</span> Compose
                </button>
            </div>

            {/* Sync Button */}
            <div style={{ padding: '0 12px 10px' }}>
                <button
                    onClick={onSync}
                    disabled={syncing}
                    style={{
                        width: '100%', padding: '7px',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        fontSize: 12, fontWeight: 600,
                        color: '#6b7280',
                        cursor: syncing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 6,
                    }}
                >
                    <span style={{
                        display: 'inline-block',
                        animation: syncing ? 'spin 0.7s linear infinite' : 'none',
                        fontSize: 14,
                    }}>🔄</span>
                    {syncing ? 'Syncing...' : 'Sync Inbox'}
                </button>
            </div>

            <div style={{ height: 1, background: '#f3f4f6', margin: '0 12px 8px' }} />

            {/* Tabs */}
            <div style={{ padding: '0 8px', flex: 1 }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 10px', borderRadius: 10,
                                border: `1px solid ${isActive ? tab.color + '30' : 'transparent'}`,
                                background: isActive ? tab.bg : 'transparent',
                                cursor: 'pointer', marginBottom: 4,
                                transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {/* Icon */}
                            <span style={{ fontSize: 18 }}>{tab.icon}</span>

                            {/* Label */}
                            <span style={{
                                flex: 1, textAlign: 'left',
                                fontSize: 13, fontWeight: isActive ? 700 : 500,
                                color: isActive ? tab.color : '#374151',
                            }}>
                                {tab.label}
                            </span>

                            {/* Unread badge */}
                            {tab.badge > 0 && (
                                <span style={{
                                    minWidth: 20, height: 20,
                                    background: '#ef4444', color: '#fff',
                                    borderRadius: 99, fontSize: 10,
                                    fontWeight: 800, padding: '0 5px',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {tab.badge > 99 ? '99+' : tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ height: 1, background: '#f3f4f6', margin: '8px 12px' }} />

            {/* Mail Account Info */}
            {mailSetting && (
                <div style={{ padding: '10px 12px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.5px', marginBottom: 8 }}>
                        CONNECTED ACCOUNT
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px',
                        background: '#f9fafb', borderRadius: 10,
                        border: '1px solid #e5e7eb',
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#7c3aed', color: '#fff',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 13,
                            fontWeight: 800, flexShrink: 0,
                        }}>
                            {mailSetting.mail_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {mailSetting.mail_name}
                            </div>
                            <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {mailSetting.mail_address}
                            </div>
                        </div>

                        {/* Status dot */}
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: mailSetting.is_verified ? '#059669' : '#ef4444',
                        }} title={mailSetting.is_verified ? 'Connected' : 'Not connected'} />
                    </div>

                    {/* Last synced */}
                    {mailSetting.last_synced_at && (
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
                            Last synced: {mailSetting.last_synced_at}
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}