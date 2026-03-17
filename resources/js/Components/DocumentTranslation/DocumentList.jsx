// resources/js/Components/DocumentTranslation/DocumentList.jsx

import { useState } from 'react';
import { router } from '@inertiajs/react';

const LANGUAGES = {
    en: { label:'English',    flag:'🇬🇧' },
    ja: { label:'Japanese',   flag:'🇯🇵' },
    my: { label:'Burmese',    flag:'🇲🇲' },
    km: { label:'Khmer',      flag:'🇰🇭' },
    vi: { label:'Vietnamese', flag:'🇻🇳' },
    ko: { label:'Korean',     flag:'🇰🇷' },
};

const FILE_ICONS = {
    pdf:  { icon:'📄', color:'#ef4444', bg:'#fee2e2' },
    doc:  { icon:'📝', color:'#2563eb', bg:'#dbeafe' },
    docx: { icon:'📝', color:'#2563eb', bg:'#dbeafe' },
    txt:  { icon:'📃', color:'#6b7280', bg:'#f3f4f6' },
    png:  { icon:'🖼️', color:'#059669', bg:'#d1fae5' },
    jpg:  { icon:'🖼️', color:'#059669', bg:'#d1fae5' },
    jpeg: { icon:'🖼️', color:'#059669', bg:'#d1fae5' },
};

const STATUS_MAP = {
    pending:     { label:'Pending',     color:'#d97706', bg:'#fef3c7', dot:'#d97706' },
    translating: { label:'Translating', color:'#2563eb', bg:'#dbeafe', dot:'#2563eb' },
    completed:   { label:'Completed',   color:'#059669', bg:'#d1fae5', dot:'#059669' },
    failed:      { label:'Failed',      color:'#ef4444', bg:'#fee2e2', dot:'#ef4444' },
};

// ── Download Modal ─────────────────────────────────
function DownloadModal({ document, hasApi, onClose }) {
    if (!document) return null;

    const availableLangs = document.translated_paths || [];

    const handleDownload = (language) => {
        window.location.href = `/documents/${document.id}/download/${language}`;
        onClose();
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:400 }}>

                <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6' }}>
                    <h3 style={{ fontSize:15, fontWeight:800, color:'#111827', margin:0 }}>📥 Download</h3>
                    <p style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>{document.original_filename}</p>
                </div>

                <div style={{ padding:'16px 24px 20px', display:'flex', flexDirection:'column', gap:8 }}>

                    {/* Original */}
                    <button onClick={() => handleDownload('original')}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', textAlign:'left' }}>
                        <span style={{ fontSize:20 }}>📎</span>
                        <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Original File</div>
                            <div style={{ fontSize:11, color:'#9ca3af' }}>{document.file_type?.toUpperCase()} · {document.file_size}</div>
                        </div>
                        <span style={{ marginLeft:'auto', fontSize:11, color:'#7c3aed', fontWeight:600 }}>↓ Download</span>
                    </button>

                    {/* Translated versions */}
                    {hasApi && availableLangs.length > 0 && (
                        <>
                            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'0.5px', marginTop:4 }}>TRANSLATED VERSIONS</div>
                            {availableLangs.map(lang => {
                                const l = LANGUAGES[lang];
                                if (!l) return null;
                                return (
                                    <button key={lang} onClick={() => handleDownload(lang)}
                                        style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', textAlign:'left' }}>
                                        <span style={{ fontSize:20 }}>{l.flag}</span>
                                        <div>
                                            <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{l.label}</div>
                                            <div style={{ fontSize:11, color:'#9ca3af' }}>Translated · {document.file_type?.toUpperCase()}</div>
                                        </div>
                                        <span style={{ marginLeft:'auto', fontSize:11, color:'#059669', fontWeight:600 }}>↓ Download</span>
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {!hasApi && (
                        <div style={{ padding:'10px 14px', background:'#fef3c7', borderRadius:10, border:'1px solid #fcd34d', fontSize:12, color:'#92400e' }}>
                            ⚠ API not configured — only original file available
                        </div>
                    )}
                </div>

                <div style={{ padding:'0 24px 20px', display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={onClose} style={{ padding:'8px 20px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm ─────────────────────────────────
function DeleteConfirm({ document, onClose, onConfirm, loading }) {
    if (!document) return null;
    return (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:380, padding:'28px 24px', textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🗑️</div>
                <h4 style={{ fontSize:15, fontWeight:800, color:'#111827', marginBottom:8 }}>Delete Document?</h4>
                <p style={{ fontSize:13, color:'#6b7280', marginBottom:20, lineHeight:1.5 }}>
                    Are you sure you want to delete<br/>
                    <strong style={{ color:'#111827' }}>{document.original_filename}</strong>?<br/>
                    <span style={{ fontSize:11 }}>All translated versions will also be deleted.</span>
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

// ── Document Card (Grid view) ──────────────────────
function DocumentCard({ doc, hasApi, onDownload, onDelete }) {
    const fileInfo = FILE_ICONS[doc.file_type?.toLowerCase()] || FILE_ICONS.txt;
    const status   = STATUS_MAP[doc.status]   || STATUS_MAP.pending;

    return (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.04)', transition:'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}>

            {/* File icon + status */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:fileInfo.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                    {fileInfo.icon}
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:99, background:status.bg, color:status.color }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:status.dot, display:'inline-block' }} />
                    {status.label}
                </span>
            </div>

            {/* Filename */}
            <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:2, wordBreak:'break-word' }}>
                    {doc.original_filename}
                </div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>
                    {doc.file_size} · {doc.file_type?.toUpperCase()} · {doc.created_at}
                </div>
            </div>

            {/* Languages */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#f3f4f6', color:'#6b7280', fontWeight:600 }}>
                    {LANGUAGES[doc.source_language]?.flag} {LANGUAGES[doc.source_language]?.label}
                </span>
                {doc.target_languages?.map(lang => (
                    <span key={lang} style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#d1fae5', color:'#059669', fontWeight:600 }}>
                        → {LANGUAGES[lang]?.flag} {LANGUAGES[lang]?.label}
                    </span>
                ))}
            </div>

            {/* Tags */}
            {doc.tags?.length > 0 && (
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {doc.tags.map(tag => (
                        <span key={tag} style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'#ede9fe', color:'#7c3aed', fontWeight:600 }}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Uploader */}
            <div style={{ fontSize:11, color:'#9ca3af' }}>
                Uploaded by <strong style={{ color:'#374151' }}>{doc.uploader}</strong>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                <button onClick={() => onDownload(doc)}
                    style={{ flex:1, padding:'7px', borderRadius:8, border:'1px solid #7c3aed', background:'#ede9fe', color:'#7c3aed', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    📥 Download
                </button>
                {doc.canDelete && (
                    <button onClick={() => onDelete(doc)}
                        style={{ padding:'7px 10px', borderRadius:8, border:'1px solid #fee2e2', background:'#fef2f2', color:'#ef4444', fontSize:12, cursor:'pointer' }}>
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Document Row (List view) ───────────────────────
function DocumentRow({ doc, hasApi, onDownload, onDelete, isLast }) {
    const fileInfo = FILE_ICONS[doc.file_type?.toLowerCase()] || FILE_ICONS.txt;
    const status   = STATUS_MAP[doc.status] || STATUS_MAP.pending;

    return (
        <tr style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}
            onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>

            {/* File */}
            <td style={{ padding:'12px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:fileInfo.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                        {fileInfo.icon}
                    </div>
                    <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{doc.original_filename}</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>{doc.file_size} · by {doc.uploader}</div>
                    </div>
                </div>
            </td>

            {/* Languages */}
            <td style={{ padding:'12px 16px' }}>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#f3f4f6', color:'#6b7280', fontWeight:600 }}>
                        {LANGUAGES[doc.source_language]?.flag}
                    </span>
                    {doc.target_languages?.map(lang => (
                        <span key={lang} style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#d1fae5', color:'#059669', fontWeight:600 }}>
                            {LANGUAGES[lang]?.flag}
                        </span>
                    ))}
                </div>
            </td>

            {/* Status */}
            <td style={{ padding:'12px 16px' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99, background:status.bg, color:status.color }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:status.dot, display:'inline-block' }} />
                    {status.label}
                </span>
            </td>

            {/* Tags */}
            <td style={{ padding:'12px 16px' }}>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {doc.tags?.slice(0,2).map(tag => (
                        <span key={tag} style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#ede9fe', color:'#7c3aed', fontWeight:600 }}>#{tag}</span>
                    ))}
                </div>
            </td>

            {/* Date */}
            <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af', whiteSpace:'nowrap' }}>{doc.created_at}</td>

            {/* Actions */}
            <td style={{ padding:'12px 16px' }}>
                <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => onDownload(doc)}
                        style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #7c3aed', background:'#ede9fe', color:'#7c3aed', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        📥
                    </button>
                    {doc.canDelete && (
                        <button onClick={() => onDelete(doc)}
                            style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #fee2e2', background:'#fef2f2', color:'#ef4444', fontSize:12, cursor:'pointer' }}>
                            🗑️
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ── Main Component ─────────────────────────────────
export default function DocumentList({ documents = [], hasApi = false, folderName = 'All Files', onShowToast }) {
    const [viewMode, setViewMode]       = useState('list'); // 'grid' | 'list'
    const [search, setSearch]           = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [downloadDoc, setDownloadDoc] = useState(null);
    const [deleteDoc, setDeleteDoc]     = useState(null);
    const [deleting, setDeleting]       = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(`/documents/${deleteDoc.id}`, {
            onSuccess: () => { onShowToast('Document deleted!'); setDeleteDoc(null); setDeleting(false); },
            onError:   () => { onShowToast('Failed to delete.', 'error'); setDeleting(false); },
        });
    };

    const filtered = documents.filter(d => {
        const s = search.toLowerCase();
        const matchSearch = d.original_filename.toLowerCase().includes(s) ||
                            d.tags?.some(t => t.toLowerCase().includes(s)) ||
                            d.uploader?.toLowerCase().includes(s);
        const matchStatus = filterStatus ? d.status === filterStatus : true;
        return matchSearch && matchStatus;
    });

    return (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Toolbar */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#111827', flex:1 }}>
                    {folderName}
                    <span style={{ fontSize:12, color:'#9ca3af', fontWeight:400, marginLeft:8 }}>{documents.length} files</span>
                </div>

                {/* Search */}
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
                        style={{ background:'transparent', border:'none', outline:'none', fontSize:12, color:'#374151', width:160 }} />
                </div>

                {/* Status filter */}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#374151', background:'#f9fafb', cursor:'pointer', outline:'none' }}>
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="translating">Translating</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>

                {/* View toggle */}
                <div style={{ display:'flex', border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
                    {[{v:'list',i:'☰'},{v:'grid',i:'⊞'}].map(({v,i}) => (
                        <button key={v} onClick={() => setViewMode(v)}
                            style={{ padding:'6px 10px', border:'none', cursor:'pointer', fontSize:14, background: viewMode===v ? '#7c3aed' : '#f9fafb', color: viewMode===v ? '#fff' : '#6b7280', transition:'all 0.1s' }}>
                            {i}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'60px 20px' }}>
                        <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#374151' }}>No documents found</div>
                        <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Upload a file to get started</div>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:14 }}>
                        {filtered.map(doc => (
                            <DocumentCard key={doc.id} doc={doc} hasApi={hasApi}
                                onDownload={setDownloadDoc} onDelete={setDeleteDoc} />
                        ))}
                    </div>
                ) : (
                    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                                <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                                    {['File','Languages','Status','Tags','Date','Actions'].map(h => (
                                        <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:800, color:'#6b7280', letterSpacing:'0.5px', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((doc, i) => (
                                    <DocumentRow key={doc.id} doc={doc} hasApi={hasApi}
                                        onDownload={setDownloadDoc} onDelete={setDeleteDoc}
                                        isLast={i === filtered.length - 1} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Download Modal */}
            {downloadDoc && (
                <DownloadModal document={downloadDoc} hasApi={hasApi} onClose={() => setDownloadDoc(null)} />
            )}

            {/* Delete Modal */}
            {deleteDoc && (
                <DeleteConfirm document={deleteDoc} onClose={() => setDeleteDoc(null)} onConfirm={handleDelete} loading={deleting} />
            )}
        </div>
    );
}