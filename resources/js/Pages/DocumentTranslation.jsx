import { useEffect, useMemo, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import FolderTree from '@/Components/DocumentTranslation/FolderTree';
import DocumentList from '@/Components/DocumentTranslation/DocumentList';
import FolderModal from '@/Components/DocumentTranslation/FolderModal';
import UploadModal from '@/Components/DocumentTranslation/UploadModal';

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
            overlay: 'rgba(2, 8, 23, 0.72)',
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
            glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.22), transparent 42%), radial-gradient(circle at bottom left, rgba(37,99,235,0.16), transparent 38%)',
            chipShadow: '0 10px 24px rgba(0,0,0,0.16)',
            cardOverlay: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        };
    }

    return {
        panel: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,255,0.96) 100%)',
        panelSolid: '#ffffff',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.12)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        shadow: '0 24px 70px rgba(15,23,42,0.08)',
        shadowSoft: '0 14px 30px rgba(15,23,42,0.06)',
        overlay: 'rgba(15,23,42,0.36)',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',
        secondary: '#2563eb',
        secondaryHover: '#1d4ed8',
        secondarySoft: '#dbeafe',
        success: '#059669',
        successSoft: '#d1fae5',
        warning: '#d97706',
        warningSoft: '#fef3c7',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        dangerSoft: '#fee2e2',
        glass: 'radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 44%), radial-gradient(circle at bottom left, rgba(37,99,235,0.07), transparent 40%)',
        chipShadow: '0 10px 24px rgba(15,23,42,0.05)',
        cardOverlay: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(37,99,235,0.02))',
    };
}

function card(theme, extra = {}) {
    return {
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 24,
        boxShadow: theme.shadowSoft,
        backdropFilter: 'blur(16px)',
        ...extra,
    };
}

function UIButton({ children, onClick, type = 'button', variant = 'primary', disabled = false, theme, style = {} }) {
    const cfg = {
        primary: {
            bg: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            color: '#fff',
            border: 'none',
            hoverBg: `linear-gradient(135deg, ${theme.primaryHover} 0%, ${theme.secondaryHover} 100%)`,
            shadow: `0 14px 32px ${theme.primary}30`,
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
            shadow: `0 14px 32px ${theme.danger}30`,
        },
    }[variant];

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                height: 48,
                padding: '0 18px',
                borderRadius: 16,
                border: cfg.border,
                background: disabled ? theme.textMute : cfg.bg,
                color: cfg.color,
                fontSize: 13,
                fontWeight: 900,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                boxShadow: disabled ? 'none' : cfg.shadow,
                transition: 'all 0.18s ease',
                ...style,
            }}
            onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.background = cfg.hoverBg;
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                if (disabled) return;
                e.currentTarget.style.background = cfg.bg;
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {children}
        </button>
    );
}

function SectionTitle({ eyebrow, title, desc, theme, action = null }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
                {eyebrow && (
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.primary, marginBottom: 6 }}>
                        {eyebrow}
                    </div>
                )}
                {desc && (
                    <div style={{ marginTop: 8, fontSize: 13, color: theme.textMute, lineHeight: 1.7, maxWidth: 720 }}>
                        {desc}
                    </div>
                )}
            </div>
            {action}
        </div>
    );
}

function StatCard({ item, theme }) {
    return (
        <div style={{ ...card(theme, { padding: 18, minHeight: 120, position: 'relative', overflow: 'hidden' }) }}>
            <div style={{ position: 'absolute', inset: 0, background: theme.cardOverlay, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: theme.textMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {item.label}
                    </div>
                    <div style={{ marginTop: 14, fontSize: 30, lineHeight: 1, fontWeight: 900, color: item.color }}>
                        {item.value}
                    </div>
                    <div style={{ marginTop: 9, fontSize: 12, color: theme.textMute }}>{item.note}</div>
                </div>
                <div style={{ width: 52, height: 52, borderRadius: 18, background: item.soft, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.chipShadow, flexShrink: 0 }}>
                    {item.icon}
                </div>
            </div>
        </div>
    );
}

function DeleteFolderConfirm({ folder, onClose, onConfirm, loading, darkMode = false }) {
    if (!folder) return null;
    const theme = getTheme(darkMode);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: theme.overlay, backdropFilter: 'blur(12px)' }} />
            <div style={{ position: 'relative', width: '100%', maxWidth: 460, borderRadius: 30, background: theme.panel, border: `1px solid ${theme.borderStrong}`, boxShadow: theme.shadow, overflow: 'hidden' }}>
                <div style={{ padding: '30px 24px 22px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.22), transparent 34%), radial-gradient(circle at bottom right, rgba(255,255,255,0.10), transparent 28%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>
                            Danger Zone
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                            Delete folder
                        </div>
                    </div>
                </div>

                <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ width: 76, height: 76, margin: '0 auto 18px', borderRadius: 24, background: theme.dangerSoft, color: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                        </svg>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>Delete this folder?</div>
                    <div style={{ marginTop: 10, fontSize: 13, color: theme.textMute, lineHeight: 1.75 }}>
                        You are about to remove <strong style={{ color: theme.text }}>{folder.icon} {folder.name}</strong>.<br />
                        All files inside this folder will also be permanently deleted.
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 26 }}>
                        <UIButton onClick={onClose} variant="ghost" theme={theme}>Cancel</UIButton>
                        <UIButton onClick={onConfirm} disabled={loading} variant="danger" theme={theme}>
                            {loading ? 'Deleting...' : 'Yes, Delete'}
                        </UIButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DocumentTranslation({
    folders = [],
    documents = [],
    stats = { total: 0, completed: 0, translating: 0, failed: 0 },
    hasApi = false,
}) {
    const { flash } = usePage().props;
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folderDocs, setFolderDocs] = useState(null);
    const [loadingFolder, setLoadingFolder] = useState(false);

    const [showUpload, setShowUpload] = useState(false);
    const [folderModal, setFolderModal] = useState({ open: false, editFolder: null, parentFolder: null });
    const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
    const [deletingFolder, setDeletingFolder] = useState(false);

    const showToast = (message, type = 'success') => {
        window.dispatchEvent(new CustomEvent('global-toast', {
            detail: { message, type }
        }));
    };

    const handleSelectFolder = (folder) => {
        setSelectedFolder(folder);

        if (!folder) {
            setFolderDocs(null);
            return;
        }

        setLoadingFolder(true);
        fetch(`/folders/${folder.id}/contents`)
            .then((r) => r.json())
            .then((data) => {
                setFolderDocs(data.documents);
                setLoadingFolder(false);
            })
            .catch(() => {
                setLoadingFolder(false);
                showToast('Unable to load folder contents.', 'error');
            });
    };

    const currentDocs = selectedFolder ? (folderDocs || []) : documents;
    const currentFolderName = selectedFolder ? `${selectedFolder.icon} ${selectedFolder.name}` : 'All Files';

    const handleCreateFolder = (parentFolder) => {
        setFolderModal({ open: true, editFolder: null, parentFolder });
    };

    const handleEditFolder = (folder) => {
        setFolderModal({ open: true, editFolder: folder, parentFolder: null });
    };

    const handleDeleteFolder = (folder) => {
        setDeleteFolderTarget(folder);
    };

    const confirmDeleteFolder = () => {
        if (!deleteFolderTarget?.id) return;

        setDeletingFolder(true);
        router.delete(`/folders/${deleteFolderTarget.id}`, {
            onSuccess: () => {
                showToast('Folder deleted successfully.');
                if (selectedFolder?.id === deleteFolderTarget.id) {
                    setSelectedFolder(null);
                    setFolderDocs(null);
                }
                setDeleteFolderTarget(null);
                setDeletingFolder(false);
            },
            onError: () => {
                showToast('Failed to delete folder.', 'error');
                setDeletingFolder(false);
            },
        });
    };

    const statCards = [
        {
            label: 'Total Files',
            value: stats.total || 0,
            color: theme.primary,
            soft: theme.primarySoft,
            note: 'All uploaded documents',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                </svg>
            ),
        },
        {
            label: 'Completed',
            value: stats.completed || 0,
            color: theme.success,
            soft: theme.successSoft,
            note: 'Ready to review or download',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            ),
        },
        {
            label: 'Translating',
            value: stats.translating || 0,
            color: theme.secondary,
            soft: theme.secondarySoft,
            note: 'Jobs currently running',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
                    <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
                </svg>
            ),
        },
        {
            label: 'Failed',
            value: stats.failed || 0,
            color: theme.danger,
            soft: theme.dangerSoft,
            note: 'Needs review or retry',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
            ),
        },
    ];

    useEffect(() => {
        if (flash?.success) showToast(flash.success, 'success');
        if (flash?.error) showToast(flash.error, 'error');
    }, [flash]);

    return (
        <AppLayout title="Document Translation">
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ ...card(theme, { padding: 24, position: 'relative', overflow: 'hidden' }) }}>
                    <div style={{ position: 'absolute', inset: 0, background: theme.glass, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', display: 'grid', gap: 22 }}>
                        <SectionTitle
                            eyebrow="Document Translation"
                            title="Premium translation workspace"
                            desc={`Same logic flow, same routes, same upload and folder actions. Upgraded into a cleaner professional UI that works well in both light and dark mode.${!hasApi ? ' API is not configured right now, so the page stays in demo mode.' : ''}`}
                            theme={theme}
                            action={
                                <UIButton onClick={() => setShowUpload(true)} variant="primary" theme={theme}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    Upload Document
                                </UIButton>
                            }
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    {statCards.map((item) => (
                        <StatCard key={item.label} item={item} theme={theme} />
                    ))}
                </div>

                <div style={{ ...card(theme, { overflow: 'hidden', padding: 12 }) }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '280px minmax(0, 1fr)',
                            gap: 12,
                            minHeight: 520,
                            height: 'calc(100vh - 280px)',
                        }}
                    >
                        <div style={{ minWidth: 0, height: '100%', borderRadius: 22, overflow: 'hidden', border: `1px solid ${theme.border}`, boxShadow: theme.shadowSoft }}>
                            <FolderTree
                                folders={folders}
                                selectedFolder={selectedFolder}
                                onSelectFolder={handleSelectFolder}
                                onCreateFolder={handleCreateFolder}
                                onEditFolder={handleEditFolder}
                                onDeleteFolder={handleDeleteFolder}
                                onAddChildFolder={handleCreateFolder}
                            />
                        </div>

                        <div style={{ minWidth: 0, height: '100%', borderRadius: 22, overflow: 'hidden', border: `1px solid ${theme.border}`, boxShadow: theme.shadowSoft, background: theme.panelSolid, position: 'relative' }}>
                            {loadingFolder ? (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.panel }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: 42, height: 42, border: `3px solid ${theme.primarySoft}`, borderTopColor: theme.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
                                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Loading files</div>
                                        <div style={{ marginTop: 4, fontSize: 12, color: theme.textMute }}>Fetching folder contents from /folders/{selectedFolder?.id || 'id'}/contents</div>
                                    </div>
                                </div>
                            ) : (
                                <DocumentList
                                    documents={currentDocs}
                                    hasApi={hasApi}
                                    folderName={currentFolderName}
                                    onShowToast={showToast}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <UploadModal
                open={showUpload}
                onClose={() => setShowUpload(false)}
                folders={folders}
                currentFolderId={selectedFolder?.id}
                hasApi={hasApi}
            />

            <FolderModal
                open={folderModal.open}
                onClose={() => setFolderModal({ open: false, editFolder: null, parentFolder: null })}
                editFolder={folderModal.editFolder}
                parentFolder={folderModal.parentFolder}
            />

            <DeleteFolderConfirm
                folder={deleteFolderTarget}
                onClose={() => setDeleteFolderTarget(null)}
                onConfirm={confirmDeleteFolder}
                loading={deletingFolder}
                darkMode={darkMode}
            />
        </AppLayout>
    );
}
