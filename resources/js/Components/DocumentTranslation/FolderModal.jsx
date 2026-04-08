import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#ef4444', '#ec4899', '#0891b2', '#374151'];
const ICONS = ['📁', '📂', '🗂️', '💼', '📋', '📊', '📌', '🗃️', '💡', '🔒', '🌐', '⭐'];

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
            panel: 'linear-gradient(180deg, rgba(10,18,36,0.96) 0%, rgba(9,16,32,0.92) 100%)',
            panelSoft: 'rgba(255,255,255,0.035)',
            panelSofter: 'rgba(255,255,255,0.055)',
            border: 'rgba(148,163,184,0.12)',
            borderStrong: 'rgba(148,163,184,0.22)',
            text: '#f8fafc',
            textSoft: '#cbd5e1',
            textMute: '#8da0b8',
            overlay: 'rgba(2, 8, 23, 0.72)',
            primary: '#7c3aed',
            primaryHover: '#6d28d9',
            primarySoft: 'rgba(124,58,237,0.16)',
            shadow: '0 28px 80px rgba(0,0,0,0.42)',
            danger: '#f87171',
            inputBg: 'rgba(255,255,255,0.035)',
            inputBorder: 'rgba(148,163,184,0.16)',
        };
    }

    return {
        panel: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,255,0.96) 100%)',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.12)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        overlay: 'rgba(15,23,42,0.36)',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',
        shadow: '0 24px 70px rgba(15,23,42,0.10)',
        danger: '#ef4444',
        inputBg: '#f8fafc',
        inputBorder: '#e5e7eb',
    };
}

function FieldError({ msg, theme }) {
    if (!msg) return null;
    return <p style={{ marginTop: 7, fontSize: 11, fontWeight: 700, color: theme.danger }}>{msg}</p>;
}

export default function FolderModal({ open, onClose, editFolder = null, parentFolder = null }) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const isEdit = !!editFolder;

    const form = useForm({
        name: editFolder?.name || '',
        description: editFolder?.description || '',
        visibility: editFolder?.visibility || 'all',
        color: editFolder?.color || '#7c3aed',
        icon: editFolder?.icon || '📁',
        parent_id: parentFolder?.id || editFolder?.parent_id || null,
        _method: isEdit ? 'PUT' : 'POST',
    });

    useEffect(() => {
        form.setData({
            name: editFolder?.name || '',
            description: editFolder?.description || '',
            visibility: editFolder?.visibility || 'all',
            color: editFolder?.color || '#7c3aed',
            icon: editFolder?.icon || '📁',
            parent_id: parentFolder?.id || editFolder?.parent_id || null,
            _method: editFolder ? 'PUT' : 'POST',
        });
    }, [editFolder, parentFolder]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        const url = isEdit ? `/folders/${editFolder.id}` : '/folders';

        form.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
            onError: () => {
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: {
                        message: isEdit ? 'Failed to update folder.' : 'Failed to create folder.',
                        type: 'error',
                    },
                }));
            },
        });
    };

    const inputStyle = (field) => ({
        width: '100%',
        padding: '13px 15px',
        borderRadius: 16,
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        border: `1px solid ${form.errors[field] ? theme.danger : theme.inputBorder}`,
        background: theme.inputBg,
        color: theme.text,
    });

    const visOptions = [
        { value: 'all', label: 'All Branches', desc: 'Visible to all branches', icon: '🌐' },
        { value: 'branch', label: 'My Branch', desc: 'Visible to your branch only', icon: '🏢' },
        { value: 'private', label: 'Private', desc: 'Only visible to you', icon: '🔒' },
    ];

    return (
        <>
            <style>{`
                .dt-modal-scroll-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .dt-modal-scroll-hide::-webkit-scrollbar {
                    display: none;
                    width: 0;
                    height: 0;
                }
            `}</style>

            <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: theme.overlay, backdropFilter: 'blur(12px)' }} />
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 620,
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        borderRadius: 30,
                        background: theme.panel,
                        border: `1px solid ${theme.borderStrong}`,
                        boxShadow: theme.shadow,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            padding: '28px 24px 24px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)',
                            borderBottom: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.22)',
                        }}
                    >
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.22), transparent 30%), radial-gradient(circle at bottom right, rgba(255,255,255,0.10), transparent 28%)' }} />
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)', marginBottom: 8 }}>
                                    Folder Workspace
                                </div>
                                <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
                                    {isEdit ? 'Edit Folder' : 'Create Folder'}
                                </div>
                                <div style={{ marginTop: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.82)' }}>
                                    {parentFolder ? `Parent: ${parentFolder.icon} ${parentFolder.name}` : 'Root level folder'}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 18,
                                    border: '1px solid rgba(255,255,255,0.16)',
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 28,
                                    lineHeight: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    <form onSubmit={submit} className="dt-modal-scroll-hide" style={{ overflowY: 'auto', padding: 24 }}>
                        <div style={{ display: 'grid', gap: 18 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 800, color: theme.textSoft }}>
                                    Folder Name
                                </label>
                                <input
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Enter folder name"
                                    style={inputStyle('name')}
                                />
                                <FieldError msg={form.errors.name} theme={theme} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 800, color: theme.textSoft }}>
                                    Description
                                </label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Optional short description"
                                    rows={3}
                                    style={{ ...inputStyle('description'), resize: 'vertical', minHeight: 96, paddingTop: 14 }}
                                />
                                <FieldError msg={form.errors.description} theme={theme} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 800, color: theme.textSoft }}>
                                    Visibility
                                </label>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    {visOptions.map((opt) => {
                                        const active = form.data.visibility === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => form.setData('visibility', opt.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: 18,
                                                    border: `1px solid ${active ? theme.primary : theme.border}`,
                                                    background: active ? theme.primarySoft : theme.panelSoft,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <div style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 14,
                                                    background: active ? `linear-gradient(135deg, ${theme.primary} 0%, #2563eb 100%)` : theme.panelSofter,
                                                    color: active ? '#fff' : theme.textSoft,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 18,
                                                    flexShrink: 0,
                                                }}>
                                                    {opt.icon}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 900, color: active ? theme.primary : theme.text }}>
                                                        {opt.label}
                                                    </div>
                                                    <div style={{ marginTop: 4, fontSize: 11.5, color: theme.textMute }}>{opt.desc}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <FieldError msg={form.errors.visibility} theme={theme} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 800, color: theme.textSoft }}>
                                    Folder Color
                                </label>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {COLORS.map((color) => {
                                        const active = form.data.color === color;
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => form.setData('color', color)}
                                                style={{
                                                    width: 38,
                                                    height: 38,
                                                    borderRadius: 14,
                                                    border: active ? `3px solid ${theme.text}` : `1px solid ${theme.border}`,
                                                    background: color,
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                <FieldError msg={form.errors.color} theme={theme} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 10, fontSize: 12, fontWeight: 800, color: theme.textSoft }}>
                                    Folder Icon
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 10 }}>
                                    {ICONS.map((icon) => {
                                        const active = form.data.icon === icon;
                                        return (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => form.setData('icon', icon)}
                                                style={{
                                                    height: 56,
                                                    borderRadius: 18,
                                                    border: `1px solid ${active ? theme.primary : theme.border}`,
                                                    background: active ? theme.primarySoft : theme.panelSoft,
                                                    cursor: 'pointer',
                                                    fontSize: 24,
                                                }}
                                            >
                                                {icon}
                                            </button>
                                        );
                                    })}
                                </div>
                                <FieldError msg={form.errors.icon} theme={theme} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 26 }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    height: 46,
                                    padding: '0 18px',
                                    borderRadius: 16,
                                    border: `1px solid ${theme.border}`,
                                    background: theme.panelSoft,
                                    color: theme.textSoft,
                                    fontSize: 13,
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                style={{
                                    height: 46,
                                    padding: '0 18px',
                                    borderRadius: 16,
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${theme.primary} 0%, #2563eb 100%)`,
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 900,
                                    cursor: form.processing ? 'not-allowed' : 'pointer',
                                    opacity: form.processing ? 0.7 : 1,
                                }}
                            >
                                {form.processing ? 'Saving...' : isEdit ? 'Update Folder' : 'Create Folder'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
