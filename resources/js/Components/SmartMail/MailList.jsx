// resources/js/Components/SmartMail/MailList.jsx

import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function MailList({
    mails = [], activeTab, selectedMail,
    onSelectMail, onShowToast, onDeleteMail, onStarMail,
    theme, darkMode = false,
}) {
    const [search, setSearch]           = useState('');
    const [hoveredId, setHoveredId]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const filtered = mails.filter(m => {
        if (!m) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (typeof m.subject      === 'string' ? m.subject      : '').toLowerCase().includes(q) ||
            (typeof m.from_name    === 'string' ? m.from_name    : '').toLowerCase().includes(q) ||
            (typeof m.from_address === 'string' ? m.from_address : '').toLowerCase().includes(q) ||
            (typeof m.body_text    === 'string' ? m.body_text    : '').toLowerCase().includes(q)
        );
    });

    const handleDeleteClick = (e, mail) => {
        e.stopPropagation();
        setDeleteTarget(mail);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        await router.delete(`/smart-mail/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onShowToast('Mail deleted.', 'success');
                onDeleteMail?.(deleteTarget.id);
            },
        });
        setDeleteTarget(null);
    };

    const handleStar = async (e, mail) => {
        e.stopPropagation();
        // ── Optimistic update — ချက်ချင်း parent state ပြောင်း ──
        const newStarred = !mail.is_starred;
        onStarMail?.(mail.id, newStarred);

        try {
            await fetch(`/smart-mail/${mail.id}/star`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch {
            // revert on failure
            onStarMail?.(mail.id, !newStarred);
        }
    };

    const handleSelect = (mail) => {
        onSelectMail(mail);
        if (!mail.is_read && activeTab === 'inbox') {
            fetch(`/smart-mail/${mail.id}/read`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            }).then(() => router.reload({ only: ['inbox', 'unreadCount'] }));
        }
    };

    const getInitial = (name, address) =>
        (name || address || '?').charAt(0).toUpperCase();

    const getAvatarColor = (str = '') => {
        const colors = [
            theme.primary, theme.secondary,
            theme.success, theme.warning,
            '#ec4899', '#0891b2', '#f97316',
        ];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const tabMeta = {
        inbox:   { label: 'Inbox',   emptyIcon: '📭', emptyText: 'Your inbox is empty',   emptySub: 'New mails will appear here' },
        sent:    { label: 'Sent',    emptyIcon: '📤', emptyText: 'No sent mails yet',      emptySub: 'Sent mails will appear here' },
        starred: { label: 'Starred', emptyIcon: '⭐', emptyText: 'No starred mails',       emptySub: 'Star important mails to find them here' },
    };
    const meta = tabMeta[activeTab] || tabMeta.inbox;

    // ── Delete Confirm Modal ──────────────────────────────────
    function DeleteConfirmModal({ open, onConfirm, onCancel }) {
        if (!open) return null;
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}>
                <div onClick={onCancel} style={{
                    position: 'absolute', inset: 0,
                    background: theme.overlay,
                    backdropFilter: 'blur(6px)',
                }} />
                <div style={{
                    position: 'relative',
                    background: theme.panelSolid,
                    border: `1px solid ${theme.borderStrong}`,
                    borderRadius: 24,
                    boxShadow: theme.shadow,
                    width: '100%', maxWidth: 360,
                    padding: '32px 28px',
                    textAlign: 'center',
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 64, height: 64, margin: '0 auto 18px',
                        borderRadius: 20,
                        background: theme.dangerSoft,
                        border: `1px solid ${theme.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: theme.danger,
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 900, color: theme.text, margin: '0 0 8px' }}>
                        Delete this mail?
                    </h3>
                    <p style={{ fontSize: 13, color: theme.textMute, margin: '0 0 24px', lineHeight: 1.6 }}>
                        This action cannot be undone.
                    </p>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onCancel} style={{
                            flex: 1, padding: '11px',
                            borderRadius: 14,
                            border: `1px solid ${theme.border}`,
                            background: theme.panelSoft,
                            color: theme.textSoft,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = theme.panelSofter}
                            onMouseLeave={e => e.currentTarget.style.background = theme.panelSoft}
                        >
                            Cancel
                        </button>
                        <button onClick={onConfirm} style={{
                            flex: 1, padding: '11px',
                            borderRadius: 14, border: 'none',
                            background: theme.danger,
                            color: '#fff',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            boxShadow: `0 6px 18px ${theme.danger}40`,
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = theme.dangerHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = theme.danger; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: 300, flexShrink: 0,
            borderRight: `1px solid ${theme.border}`,
            display: 'flex', flexDirection: 'column',
            background: theme.panelSolid,
            height: '100%',
        }}>
            <DeleteConfirmModal
                open={!!deleteTarget}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* ── Header ── */}
            <div style={{
                padding: '16px 14px 12px',
                background: theme.panelSolid,
                borderBottom: `1px solid ${theme.border}`,
                flexShrink: 0,
            }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: theme.text }}>
                        {meta.label}
                    </span>
                    <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 9px', borderRadius: 99,
                        background: theme.panelSoft,
                        border: `1px solid ${theme.border}`,
                        color: theme.textMute,
                    }}>
                        {filtered.length}
                    </span>
                </div>

                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: 12, padding: '8px 12px',
                    transition: 'border-color 0.15s',
                }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search mails..."
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 12, color: theme.text, flex: 1,
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: theme.textMute, fontSize: 14, lineHeight: 1,
                            display: 'flex', alignItems: 'center',
                        }}>×</button>
                    )}
                </div>
            </div>

            {/* ── Mail List ── */}
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="hide-scrollbar"
            >
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '52px 20px' }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: 20, margin: '0 auto 14px',
                            background: theme.panelSoft,
                            border: `1px solid ${theme.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26,
                        }}>{meta.emptyIcon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{meta.emptyText}</div>
                        <div style={{ fontSize: 11, color: theme.textMute, marginTop: 4 }}>{meta.emptySub}</div>
                    </div>
                ) : filtered.map(mail => {
                    const isSelected = selectedMail?.id === mail.id;
                    const isUnread   = !mail.is_read && activeTab === 'inbox';
                    const isHovered  = hoveredId === mail.id;

                    const senderLabel = mail.type === 'sent'
                        ? `To: ${mail.to_addresses?.[0] || 'Unknown'}`
                        : (mail.from_name || mail.from_address || 'Unknown');

                    const avatarColor = getAvatarColor(mail.from_name || mail.from_address || '');
                    const avatarChar  = getInitial(mail.from_name, mail.from_address);

                    // Row background
                    let rowBg = 'transparent';
                    if (isSelected) rowBg = darkMode ? `rgba(124,58,237,0.18)` : theme.primarySoft;
                    else if (isHovered) rowBg = theme.rowHover;

                    return (
                        <div
                            key={mail.id}
                            onClick={() => handleSelect(mail)}
                            onMouseEnter={() => setHoveredId(mail.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{
                                padding: '13px 14px',
                                borderBottom: `1px solid ${theme.border}`,
                                background: rowBg,
                                cursor: 'pointer',
                                borderLeft: `3px solid ${isSelected ? theme.primary : isUnread ? theme.primary : 'transparent'}`,
                                transition: 'background 0.12s',
                                position: 'relative',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: 12,
                                    background: avatarColor,
                                    color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                                    boxShadow: `0 2px 8px ${avatarColor}40`,
                                }}>
                                    {avatarChar}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0, paddingRight: (isHovered || isSelected) ? 58 : 0 }}>
                                    {/* Sender + date */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                        <span style={{
                                            fontSize: 12, fontWeight: isUnread ? 800 : 600,
                                            color: theme.text,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            maxWidth: 140,
                                        }}>
                                            {senderLabel}
                                        </span>
                                        <span style={{ fontSize: 10, color: theme.textMute, flexShrink: 0, marginLeft: 4 }}>
                                            {mail.mail_date}
                                        </span>
                                    </div>

                                    {/* Subject */}
                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: isUnread ? 700 : 500,
                                        color: isUnread ? theme.text : theme.textSoft,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        marginBottom: 3,
                                    }}>
                                        {typeof mail.subject === 'string' ? (mail.subject || '(No Subject)') : '(No Subject)'}
                                    </div>

                                    {/* Preview */}
                                    <div style={{
                                        fontSize: 11, color: theme.textMute,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {typeof mail.body_text === 'string' ? mail.body_text.slice(0, 80) : '...'}
                                    </div>

                                    {/* Tags row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                                        {isUnread && (
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: theme.primary,
                                                boxShadow: `0 0 0 2px ${theme.primarySoft}`,
                                                display: 'inline-block', flexShrink: 0,
                                            }} />
                                        )}
                                        {mail.ai_generated && (
                                            <span style={{
                                                fontSize: 9, padding: '1px 7px', borderRadius: 99,
                                                background: theme.primarySoft,
                                                color: theme.primary, fontWeight: 800,
                                                border: `1px solid ${theme.primary}22`,
                                            }}>AI</span>
                                        )}
                                        {mail.attachments?.length > 0 && (
                                            <span style={{ fontSize: 10, color: theme.textMute, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                                </svg>
                                                {mail.attachments.length}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Hover action buttons */}
                            {(isHovered || isSelected) && (
                                <div style={{
                                    position: 'absolute', right: 10, top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: 'flex', gap: 4,
                                }}>
                                    {/* Star */}
                                    <button
                                        onClick={e => handleStar(e, mail)}
                                        title={mail.is_starred ? 'Unstar' : 'Star'}
                                        style={{
                                            width: 28, height: 28, borderRadius: 9,
                                            border: `1px solid ${theme.border}`,
                                            background: mail.is_starred ? theme.warningSoft : theme.panelSoft,
                                            color: mail.is_starred ? theme.warning : theme.textMute,
                                            cursor: 'pointer', fontSize: 12,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.12s',
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24"
                                            fill={mail.is_starred ? 'currentColor' : 'none'}
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                        </svg>
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={e => handleDeleteClick(e, mail)}
                                        title="Delete"
                                        style={{
                                            width: 28, height: 28, borderRadius: 9,
                                            border: `1px solid ${theme.border}`,
                                            background: theme.dangerSoft,
                                            color: theme.danger,
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.12s',
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                            <path d="M10 11v6M14 11v6"/>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}