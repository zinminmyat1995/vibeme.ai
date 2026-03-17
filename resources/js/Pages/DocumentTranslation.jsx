// resources/js/Pages/DocumentTranslation.jsx

import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import FolderTree from '@/Components/DocumentTranslation/FolderTree';
import DocumentList from '@/Components/DocumentTranslation/DocumentList';
import FolderModal from '@/Components/DocumentTranslation/FolderModal';
import UploadModal from '@/Components/DocumentTranslation/UploadModal';

// ── Toast ──────────────────────────────────────────
function Toast({ message, type, onClose }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [message]);

    if (!message) return null;

    const c = type === 'error'
        ? { bg:'#fef2f2', border:'#fca5a5', color:'#991b1b', icon:'❌' }
        : { bg:'#f0fdf4', border:'#86efac', color:'#166534', icon:'✅' };

    return (
        <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', alignItems:'center', gap:10, padding:'12px 18px', background:c.bg, border:`1px solid ${c.border}`, borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12)', minWidth:300, animation:'slideIn 0.2s ease' }}>
            <span style={{ fontSize:18 }}>{c.icon}</span>
            <span style={{ fontSize:13, fontWeight:600, color:c.color, flex:1 }}>{message}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:c.color, fontSize:18, lineHeight:1 }}>×</button>
        </div>
    );
}

// ── Delete Folder Confirm ──────────────────────────
function DeleteFolderConfirm({ folder, onClose, onConfirm, loading }) {
    if (!folder) return null;
    return (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:380, padding:'28px 24px', textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🗂️</div>
                <h4 style={{ fontSize:15, fontWeight:800, color:'#111827', marginBottom:8 }}>Delete Folder?</h4>
                <p style={{ fontSize:13, color:'#6b7280', marginBottom:6, lineHeight:1.5 }}>
                    Delete <strong style={{ color:'#111827' }}>{folder.icon} {folder.name}</strong>?
                </p>
                <p style={{ fontSize:11, color:'#ef4444', marginBottom:20 }}>
                    ⚠ All files inside this folder will also be permanently deleted.
                </p>
                <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button onClick={onClose} style={{ padding:'9px 24px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        style={{ padding:'9px 24px', borderRadius:10, border:'none', background: loading ? '#fca5a5' : '#ef4444', color:'#fff', fontSize:13, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────
export default function DocumentTranslation({ folders = [], documents = [],stats = { total:0, completed:0, translating:0, failed:0 }, hasApi = false, languages = {} }) {
    const { flash } = usePage().props;

    const [toast, setToast]                 = useState(flash?.success ? { msg: flash.success, type:'success' } : null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folderDocs, setFolderDocs]       = useState(null); // null = show root docs
    const [loadingFolder, setLoadingFolder] = useState(false);

    // Modals
    const [showUpload, setShowUpload]           = useState(false);
    const [folderModal, setFolderModal]         = useState({ open:false, editFolder:null, parentFolder:null });
    const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
    const [deletingFolder, setDeletingFolder]   = useState(false);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    // Select folder → load its contents
    const handleSelectFolder = (folder) => {
        setSelectedFolder(folder);
        if (!folder) {
            setFolderDocs(null);
            return;
        }
        setLoadingFolder(true);
        fetch(`/folders/${folder.id}/contents`)
            .then(r => r.json())
            .then(data => {
                setFolderDocs(data.documents);
                setLoadingFolder(false);
            })
            .catch(() => setLoadingFolder(false));
    };

    // Current docs to show
    const currentDocs = selectedFolder ? (folderDocs || []) : documents;
    const currentFolderName = selectedFolder
        ? `${selectedFolder.icon} ${selectedFolder.name}`
        : 'All Files';

    // Folder CRUD handlers
    const handleCreateFolder = (parentFolder) => {
        setFolderModal({ open:true, editFolder:null, parentFolder });
    };

    const handleEditFolder = (folder) => {
        setFolderModal({ open:true, editFolder:folder, parentFolder:null });
    };

    const handleDeleteFolder = (folder) => {
        setDeleteFolderTarget(folder);
    };

    const confirmDeleteFolder = () => {
        setDeletingFolder(true);
        router.delete(`/folders/${deleteFolderTarget.id}`, {
            onSuccess: () => {
                showToast('Folder deleted successfully!');
                setDeleteFolderTarget(null);
                setDeletingFolder(false);
                if (selectedFolder?.id === deleteFolderTarget.id) {
                    setSelectedFolder(null);
                    setFolderDocs(null);
                }
            },
            onError: () => {
                showToast('Failed to delete folder.', 'error');
                setDeletingFolder(false);
            },
        });
    };

    // Stats
    const statCards = [
        { label:'Total Files',  value: stats.total,       icon:'📁', color:'#7c3aed', bg:'#ede9fe' },
        { label:'Completed',    value: stats.completed,   icon:'✅', color:'#059669', bg:'#d1fae5' },
        { label:'Translating',  value: stats.translating, icon:'🔄', color:'#2563eb', bg:'#dbeafe' },
        { label:'Failed',       value: stats.failed,      icon:'❌', color:'#ef4444', bg:'#fee2e2' },
    ];

    useEffect(() => {
        if (flash?.success) setToast({ msg: flash.success, type:'success' });
        if (flash?.error)   setToast({ msg: flash.error,   type:'error'   });
    }, [flash]);

    return (
        <AppLayout title="Document Translation">
            <style>{`
                @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin    { to { transform: rotate(360deg); } }
            `}</style>

            <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

            {/* Page Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                    <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:0 }}>
                        🌐 Document Translation Platform
                    </h2>
                    <p style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>
                        Upload, organize and translate documents across branches
                        {!hasApi && <span style={{ marginLeft:8, color:'#f59e0b', fontWeight:600 }}>· Demo Mode (API not configured)</span>}
                    </p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#7c3aed', color:'#fff', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 10px rgba(124,58,237,0.3)' }}>
                    <span style={{ fontSize:16 }}>📤</span> Upload Document
                </button>
            </div>

            {/* Stats Row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
               {statCards.map(s => (
                    <div key={s.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ width:42, height:42, borderRadius:11, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                            {s.icon}
                        </div>
                        <div>
                            <div style={{ fontSize:22, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:500, marginTop:2 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content — Folder Tree + Document List */}
            <div style={{ display:'flex', background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', height:'calc(100vh - 300px)', minHeight:400 }}>

                {/* Left — Folder Tree */}
                <FolderTree
                    folders={folders}
                    selectedFolder={selectedFolder}
                    onSelectFolder={handleSelectFolder}
                    onCreateFolder={handleCreateFolder}
                    onEditFolder={handleEditFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onAddChildFolder={handleCreateFolder}
                />

                {/* Right — Document List */}
                {loadingFolder ? (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ textAlign:'center' }}>
                            <div style={{ width:32, height:32, border:'3px solid #ede9fe', borderTopColor:'#7c3aed', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
                            <div style={{ fontSize:13, color:'#9ca3af' }}>Loading files...</div>
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

            {/* Upload Modal */}
            <UploadModal
                open={showUpload}
                onClose={() => setShowUpload(false)}
                onSuccess={showToast}
                folders={folders}
                currentFolderId={selectedFolder?.id}
                hasApi={hasApi}
            />

            {/* Folder Create/Edit Modal */}
            <FolderModal
                open={folderModal.open}
                onClose={() => setFolderModal({ open:false, editFolder:null, parentFolder:null })}
                editFolder={folderModal.editFolder}
                parentFolder={folderModal.parentFolder}
            />

            {/* Delete Folder Confirm */}
            <DeleteFolderConfirm
                folder={deleteFolderTarget}
                onClose={() => setDeleteFolderTarget(null)}
                onConfirm={confirmDeleteFolder}
                loading={deletingFolder}
            />
        </AppLayout>
    );
}