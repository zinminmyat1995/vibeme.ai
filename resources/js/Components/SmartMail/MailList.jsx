// resources/js/Components/SmartMail/MailList.jsx

import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function MailList({ mails = [], activeTab, selectedMail, onSelectMail, onShowToast, onDeleteMail }) {
    const [search, setSearch]       = useState('');
    const [hoveredId, setHoveredId] = useState(null);
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
                onDeleteMail?.(deleteTarget.id);  // ✅ parent ကို အသိပေး
            },
        });
        setDeleteTarget(null);
    };

    const handleStar = async (e, mail) => {
        e.stopPropagation();
        await fetch(`/smart-mail/${mail.id}/star`, {
            method:  'PATCH',
            headers: {
                'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').content,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        router.reload({ only: ['inbox', 'sent'] });
    };


    const handleSelect = (mail) => {
        onSelectMail(mail);
        if (!mail.is_read && activeTab === 'inbox') {
            fetch(`/smart-mail/${mail.id}/read`, {
                method:  'PATCH',
                headers: {
                    'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            }).then(() => router.reload({ only: ['inbox', 'unreadCount'] }));
        }
    };

    const getInitial = (name, address) => (name || address || '?').charAt(0).toUpperCase();

    const getAvatarColor = (str = '') => {
        const colors = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#ef4444', '#ec4899', '#0891b2'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const emptyMessages = {
        inbox:   { icon: '📭', text: 'Your inbox is empty',  sub: 'New mails will appear here' },
        sent:    { icon: '📤', text: 'No sent mails',         sub: 'Sent mails will appear here' },
        starred: { icon: '⭐', text: 'No starred mails',      sub: 'Star important mails to find them here' },
    };
    const empty = emptyMessages[activeTab] || emptyMessages.inbox;

    // ── Delete Confirm Modal ── (component အစမှာ ထည့်)
    function DeleteConfirmModal({ open, onConfirm, onCancel }) {
        if (!open) return null;
        return (
            <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                <div onClick={onCancel} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} />
                <div style={{ position:'relative', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', width:'100%', maxWidth:360, padding:'28px 24px', textAlign:'center' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>🗑️</div>
                    <h3 style={{ fontSize:16, fontWeight:800, color:'#111827', margin:'0 0 8px' }}>Delete this mail?</h3>
                    <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 24px' }}>This action cannot be undone.</p>
                    <div style={{ display:'flex', gap:10 }}>
                        <button onClick={onCancel}
                            style={{ flex:1, padding:'10px', borderRadius:12, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                            Cancel
                        </button>
                        <button onClick={onConfirm}
                            style={{ flex:1, padding:'10px', borderRadius:12, border:'none', background:'#ef4444', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: 320, flexShrink: 0,
            borderRight: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column',
            background: '#fafafa', height: '100%',
        }}>
            <DeleteConfirmModal
                open={!!deleteTarget}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />
            {/* Header */}
            <div style={{ padding: '14px 14px 10px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>
                        {activeTab === 'inbox' ? '📥 Inbox' : activeTab === 'sent' ? '📤 Sent' : '⭐ Starred'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{filtered.length} mails</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search mails..."
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#374151', flex: 1 }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>×</button>
                    )}
                </div>
            </div>

            {/* Mail List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>{empty.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{empty.text}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{empty.sub}</div>
                    </div>
                ) : filtered.map(mail => {
                    const isSelected = selectedMail?.id === mail.id;
                    const isUnread   = !mail.is_read && activeTab === 'inbox';
                    const isHovered  = hoveredId === mail.id;

                    // inbox → show who sent (From)
                    // sent  → show who received (To)
                    const senderLabel = mail.type === 'sent'
                        ? `To: ${mail.to_addresses?.[0] || 'Unknown'}`
                        : (mail.from_name || mail.from_address || 'Unknown');

                    const avatarColor = getAvatarColor(mail.from_name || mail.from_address || '');
                    const avatarChar  = getInitial(mail.from_name, mail.from_address);

                    return (
                        <div
                            key={mail.id}
                            onClick={() => handleSelect(mail)}
                            onMouseEnter={() => setHoveredId(mail.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{
                                padding: '12px 14px',
                                borderBottom: '1px solid #e5e7eb',
                                background: isSelected ? '#ede9fe' : isHovered ? '#f5f3ff' : isUnread ? '#fafafa' : '#fff',
                                cursor: 'pointer',
                                borderLeft: `3px solid ${isSelected ? '#7c3aed' : isUnread ? '#7c3aed' : 'transparent'}`,
                                transition: 'background 0.1s',
                                position: 'relative',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: avatarColor, color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                                }}>
                                    {avatarChar}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0, paddingRight: (isHovered || isSelected) ? 60 : 4 }}>
                                    {/* Sender + date */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                        <span style={{
                                            fontSize: 12, fontWeight: isUnread ? 800 : 600, color: '#111827',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150,
                                        }}>
                                            {senderLabel}
                                        </span>
                                        <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>
                                            {mail.mail_date}
                                        </span>
                                    </div>

                                    {/* Subject */}
                                    <div style={{
                                        fontSize: 12, fontWeight: isUnread ? 700 : 500,
                                        color: isUnread ? '#111827' : '#374151',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3,
                                    }}>
                                        {typeof mail.subject === 'string' ? (mail.subject || '(No Subject)') : '(No Subject)'}
                                    </div>

                                    {/* Preview */}
                                    <div style={{
                                        fontSize: 11, color: '#9ca3af',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {typeof mail.body_text === 'string' ? mail.body_text.slice(0, 80) : '...'}
                                    </div>

                                    {/* Tags */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                                        {isUnread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />}
                                        {mail.ai_generated && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}>AI</span>}
                                        {mail.attachments?.length > 0 && <span style={{ fontSize: 10, color: '#9ca3af' }}>📎 {mail.attachments.length}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons — only on hover or selected */}
                            {(isHovered || isSelected) && (
                                <div style={{ position: 'absolute', right: 8, top: 10, display: 'flex', gap: 4 }}>
                                    <button
                                        onClick={e => handleStar(e, mail)}
                                        style={{
                                            background: mail.is_starred ? '#fef3c7' : '#f3f4f6',
                                            border: 'none', width: 26, height: 26, borderRadius: 6,
                                            cursor: 'pointer', fontSize: 12,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                        title={mail.is_starred ? 'Unstar' : 'Star'}
                                    >
                                        {mail.is_starred ? '⭐' : '☆'}
                                    </button>
                                    <button
                                        onClick={e => handleDeleteClick(e, mail)}
                                        style={{
                                            background: '#fee2e2', border: 'none',
                                            width: 26, height: 26, borderRadius: 6,
                                            cursor: 'pointer', fontSize: 11,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                        title="Delete"
                                    >
                                        🗑️
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