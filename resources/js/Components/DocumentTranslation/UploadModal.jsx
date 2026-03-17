// resources/js/Components/DocumentTranslation/UploadModal.jsx

import { useState } from 'react';
import { useForm } from '@inertiajs/react';

const FLAGS = {
    en: (
        <svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="13"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8"/></svg>
    ),
    ja: (
        <svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="12" fill="#BC002D"/></svg>
    ),
    my: (
        <svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#FECB00"/><rect y="13" width="60" height="13" fill="#34B233"/><rect y="27" width="60" height="13" fill="#EA2839"/><polygon points="30,5 34,17 22,10 38,10 26,17" fill="#fff"/></svg>
    ),
    km: (
        <svg width="20" height="14" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}><rect width="900" height="600" fill="#032EA1"/><rect width="900" height="300" y="150" fill="#E00025"/><g fill="white"><rect x="375" y="215" width="150" height="170"/><rect x="363" y="195" width="40"  height="25"/><rect x="430" y="175" width="40"  height="45"/><rect x="497" y="195" width="40"  height="25"/><rect x="330" y="235" width="48"  height="150"/><rect x="522" y="235" width="48"  height="150"/></g></svg>
    ),
    vi: (
        <svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#DA251D"/><polygon points="30,8 33,18 43,18 35,24 38,34 30,28 22,34 25,24 17,18 27,18" fill="#FFFF00"/></svg>
    ),
    ko: (
        <svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="10" fill="#CD2E3A"/><path d="M30,20 A5,10 0 0,1 30,10 A5,10 0 0,0 30,20z" fill="#0047A0"/><line x1="10" y1="10" x2="18" y2="18" stroke="#000" strokeWidth="2"/><line x1="12" y1="8" x2="20" y2="16" stroke="#000" strokeWidth="2"/><line x1="14" y1="6" x2="22" y2="14" stroke="#000" strokeWidth="2"/><line x1="42" y1="22" x2="50" y2="30" stroke="#000" strokeWidth="2"/><line x1="40" y1="24" x2="48" y2="32" stroke="#000" strokeWidth="2"/><line x1="38" y1="26" x2="46" y2="34" stroke="#000" strokeWidth="2"/></svg>
    ),
};

const LANGUAGES = [
    { code:'en', label:'English',    flag: FLAGS.en },
    { code:'ja', label:'Japanese',   flag: FLAGS.ja },
    { code:'my', label:'Burmese',    flag: FLAGS.my },
    { code:'km', label:'Khmer',      flag: FLAGS.km },
    { code:'vi', label:'Vietnamese', flag: FLAGS.vi },
    { code:'ko', label:'Korean',     flag: FLAGS.ko },
];

const ACCEPTED = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';

function FieldError({ msg }) {
    if (!msg) return null;
    return <p style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>⚠ {msg}</p>;
}

function FileIcon({ type }) {
    const icons = { pdf:'📄', doc:'📝', docx:'📝', txt:'📃', png:'🖼️', jpg:'🖼️', jpeg:'🖼️' };
    return <span style={{ fontSize:28 }}>{icons[type?.toLowerCase()] || '📎'}</span>;
}

export default function UploadModal({ open, onClose, onSuccess, folders = [], currentFolderId = null, hasApi = false }) {
    if (!open) return null;

    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview]   = useState(null);

    const form = useForm({
        file:             null,
        folder_id:        currentFolderId || '',
        source_language:  'en',
        target_languages: [],
        visibility:       'all',
        tags:             '',
    });

    const handleFile = (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        setPreview({ name: file.name, size: formatSize(file.size), ext });
        form.setData('file', file);
    };

    const toggleTargetLang = (code) => {
        const current = form.data.target_languages;
        if (current.includes(code)) {
            form.setData('target_languages', current.filter(l => l !== code));
        } else {
            form.setData('target_languages', [...current, code]);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024)     return bytes + ' B';
        if (bytes < 1048576)  return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const submit = (e) => {
        e.preventDefault();
        form.post('/documents/upload', {
            forceFormData: true,
            onSuccess: () => {
                onClose();
                setPreview(null);
                onSuccess?.('File uploaded successfully! 📄'); // ← ဒါထည့်
            },
            onError: () => {
                onSuccess?.('Upload failed. Please try again.', 'error');
            },
        });
    };

    const inp = (field) => ({
        width:'100%', padding:'9px 12px', borderRadius:10, fontSize:13,
        outline:'none', boxSizing:'border-box', fontFamily:'inherit',
        border:`1px solid ${form.errors[field] ? '#fca5a5' : '#e5e7eb'}`,
        background: form.errors[field] ? '#fef9f9' : '#f9fafb',
        color:'#111827',
    });

    const lbl = { fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 };

    // Flatten folders for select
    const flattenFolders = (folders, prefix = '') => {
        let result = [];
        folders.forEach(f => {
            result.push({ id: f.id, name: prefix + f.icon + ' ' + f.name });
            if (f.children?.length) {
                result = result.concat(flattenFolders(f.children, prefix + '　'));
            }
        });
        return result;
    };
    const flatFolders = flattenFolders(folders);

    return (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto' }}>

                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6' }}>
                    <div>
                        <h3 style={{ fontSize:16, fontWeight:800, color:'#111827', margin:0 }}>📤 Upload Document</h3>
                        <p style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>PDF, DOC, DOCX, TXT, Images — max 20MB</p>
                    </div>
                    <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>×</button>
                </div>

                <form onSubmit={submit}>
                    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

                        {/* Drop Zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                            onClick={() => document.getElementById('file-input').click()}
                            style={{
                                border: `2px dashed ${dragOver ? '#7c3aed' : form.errors.file ? '#fca5a5' : '#d1d5db'}`,
                                borderRadius: 12, padding: '24px 16px',
                                background: dragOver ? '#f5f3ff' : '#f9fafb',
                                textAlign: 'center', cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept={ACCEPTED}
                                style={{ display:'none' }}
                                onChange={e => handleFile(e.target.files[0])}
                            />
                            {preview ? (
                                <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center' }}>
                                    <FileIcon type={preview.ext} />
                                    <div style={{ textAlign:'left' }}>
                                        <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{preview.name}</div>
                                        <div style={{ fontSize:11, color:'#9ca3af' }}>{preview.size} · {preview.ext.toUpperCase()}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setPreview(null); form.setData('file', null); }}
                                        style={{ marginLeft:'auto', background:'#fee2e2', border:'none', width:26, height:26, borderRadius:6, cursor:'pointer', color:'#ef4444', fontSize:14 }}
                                    >×</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize:36, marginBottom:8 }}>📂</div>
                                    <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>
                                        Drop file here or <span style={{ color:'#7c3aed' }}>browse</span>
                                    </div>
                                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>PDF, DOC, DOCX, TXT, PNG, JPG</div>
                                </>
                            )}
                        </div>
                        <FieldError msg={form.errors.file} />

                        {/* Folder */}
                        <div>
                            <label style={lbl}>Save to Folder</label>
                            <select value={form.data.folder_id} onChange={e => form.setData('folder_id', e.target.value)} style={{ ...inp('folder_id'), cursor:'pointer' }}>
                                <option value="">📁 Root (No folder)</option>
                                {flatFolders.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Source Language */}
                        <div>
                            <label style={lbl}>Document Language <span style={{ color:'#ef4444' }}>*</span></label>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l.code}
                                        type="button"
                                        onClick={() => form.setData('source_language', l.code)}
                                        style={{
                                            display:'flex', alignItems:'center', gap:6,
                                            padding:'6px 12px', borderRadius:99,
                                            border:`2px solid ${form.data.source_language === l.code ? '#7c3aed' : '#e5e7eb'}`,
                                            background: form.data.source_language === l.code ? '#ede9fe' : '#f9fafb',
                                            cursor:'pointer', fontSize:12, fontWeight:600,
                                            color: form.data.source_language === l.code ? '#7c3aed' : '#6b7280',
                                        }}
                                    >
                                        <span style={{ display:'flex', alignItems:'center', borderRadius:2, overflow:'hidden' }}>{l.flag}</span>
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                            <FieldError msg={form.errors.source_language} />
                        </div>

                        {/* Target Languages */}
                        <div>
                            <label style={lbl}>
                                Translate To
                                {!hasApi && (
                                    <span style={{ fontSize:10, color:'#f59e0b', fontWeight:500, marginLeft:8, background:'#fef3c7', padding:'2px 8px', borderRadius:99 }}>
                                        ⚠ API not configured — will download original
                                    </span>
                                )}
                            </label>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                {LANGUAGES
                                    .filter(l => l.code !== form.data.source_language)
                                    .map(l => {
                                        const selected = form.data.target_languages.includes(l.code);
                                        return (
                                            <button
                                                key={l.code}
                                                type="button"
                                                onClick={() => toggleTargetLang(l.code)}
                                                style={{
                                                    display:'flex', alignItems:'center', gap:6,
                                                    padding:'6px 12px', borderRadius:99,
                                                    border:`2px solid ${selected ? '#059669' : '#e5e7eb'}`,
                                                    background: selected ? '#d1fae5' : '#f9fafb',
                                                    cursor:'pointer', fontSize:12, fontWeight:600,
                                                    color: selected ? '#059669' : '#6b7280',
                                                }}
                                            >
                                                <span>{l.flag}</span> {l.label}
                                                {selected && <span style={{ fontSize:10 }}>✓</span>}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Visibility */}
                        <div>
                            <label style={lbl}>Visibility <span style={{ color:'#ef4444' }}>*</span></label>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                                {[
                                    { value:'private', label:'Private',     icon:'🔒', desc:'Only you' },
                                    { value:'branch',  label:'My Branch',   icon:'🏢', desc:'Your branch' },
                                    { value:'all',     label:'All Branches',icon:'🌐', desc:'Everyone' },
                                ].map(v => (
                                    <button
                                        key={v.value}
                                        type="button"
                                        onClick={() => form.setData('visibility', v.value)}
                                        style={{
                                            padding:'10px 8px', borderRadius:10,
                                            border:`2px solid ${form.data.visibility === v.value ? '#7c3aed' : '#e5e7eb'}`,
                                            background: form.data.visibility === v.value ? '#ede9fe' : '#f9fafb',
                                            cursor:'pointer', textAlign:'center',
                                        }}
                                    >
                                        <div style={{ fontSize:18 }}>{v.icon}</div>
                                        <div style={{ fontSize:11, fontWeight:700, color: form.data.visibility === v.value ? '#7c3aed' : '#374151', marginTop:3 }}>{v.label}</div>
                                        <div style={{ fontSize:10, color:'#9ca3af' }}>{v.desc}</div>
                                    </button>
                                ))}
                            </div>
                            <FieldError msg={form.errors.visibility} />
                        </div>

                        {/* Tags */}
                        <div>
                            <label style={lbl}>Tags <span style={{ fontSize:10, color:'#9ca3af', fontWeight:500 }}>(comma separated)</span></label>
                            <input
                                value={form.data.tags}
                                onChange={e => form.setData('tags', e.target.value)}
                                placeholder="hr, report, 2026"
                                style={inp('tags')}
                            />
                        </div>

                    </div>

                    {/* Footer */}
                    <div style={{ display:'flex', gap:10, justifyContent:'flex-end', padding:'0 24px 20px' }}>
                        <button type="button" onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing || !form.data.file}
                            style={{
                                padding:'9px 24px', borderRadius:10, border:'none',
                                background: form.processing || !form.data.file ? '#c4b5fd' : '#7c3aed',
                                color:'#fff', fontSize:13, fontWeight:700,
                                cursor: form.processing || !form.data.file ? 'not-allowed' : 'pointer',
                                display:'flex', alignItems:'center', gap:6,
                            }}
                        >
                            {form.processing && (
                                <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
                            )}
                            {form.processing ? 'Uploading...' : '📤 Upload'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}