// resources/js/Components/DocumentTranslation/FolderModal.jsx

import { useForm } from '@inertiajs/react';

const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#ef4444','#ec4899','#0891b2','#374151'];
const ICONS  = ['📁','📂','🗂️','💼','📋','📊','📌','🗃️','💡','🔒','🌐','⭐'];

function FieldError({ msg }) {
    if (!msg) return null;
    return <p style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>⚠ {msg}</p>;
}

export default function FolderModal({ open, onClose, editFolder = null, parentFolder = null }) {
    if (!open) return null;

    const isEdit = !!editFolder;

    const form = useForm({
        name:        editFolder?.name        || '',
        description: editFolder?.description || '',
        visibility:  editFolder?.visibility  || 'all',
        color:       editFolder?.color       || '#7c3aed',
        icon:        editFolder?.icon        || '📁',
        parent_id:   parentFolder?.id        || editFolder?.parent_id || null,
        _method:     isEdit ? 'PUT' : 'POST',
    });

    const submit = (e) => {
        e.preventDefault();
        const url = isEdit ? `/folders/${editFolder.id}` : '/folders';
        form.post(url, {
            onSuccess: () => onClose(),
        });
    };

    const inp = (field) => ({
        width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13,
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        border: `1px solid ${form.errors[field] ? '#fca5a5' : '#e5e7eb'}`,
        background: form.errors[field] ? '#fef9f9' : '#f9fafb',
        color: '#111827',
    });

    const lbl = { fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:460 }}>

                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6' }}>
                    <div>
                        <h3 style={{ fontSize:16, fontWeight:800, color:'#111827', margin:0 }}>
                            {isEdit ? '✏️ Edit Folder' : '📁 New Folder'}
                        </h3>
                        {parentFolder && (
                            <p style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>
                                Inside: {parentFolder.icon} {parentFolder.name}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>×</button>
                </div>

                {/* Form */}
                <form onSubmit={submit}>
                    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>

                        {/* Preview */}
                        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:form.data.color + '15', borderRadius:12, border:`1px solid ${form.data.color}30` }}>
                            <div style={{ width:44, height:44, borderRadius:12, background:form.data.color + '25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                                {form.data.icon}
                            </div>
                            <div>
                                <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{form.data.name || 'Folder Name'}</div>
                                <div style={{ fontSize:11, color:'#9ca3af' }}>{form.data.description || 'No description'}</div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label style={lbl}>Folder Name <span style={{ color:'#ef4444' }}>*</span></label>
                            <input
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                                placeholder="e.g. HR Documents"
                                style={inp('name')}
                                autoFocus
                            />
                            <FieldError msg={form.errors.name} />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={lbl}>Description</label>
                            <textarea
                                value={form.data.description}
                                onChange={e => form.setData('description', e.target.value)}
                                placeholder="Optional description..."
                                rows={2}
                                style={{ ...inp('description'), resize:'none' }}
                            />
                        </div>

                        {/* Visibility */}
                        <div>
                            <label style={lbl}>Visibility <span style={{ color:'#ef4444' }}>*</span></label>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                                {[
                                    { value:'private', label:'Private',    icon:'🔒', desc:'Only you' },
                                    { value:'branch',  label:'My Branch',  icon:'🏢', desc:'Your branch' },
                                    { value:'all',     label:'All Branches',icon:'🌐', desc:'Everyone' },
                                ].map(v => (
                                    <button
                                        key={v.value}
                                        type="button"
                                        onClick={() => form.setData('visibility', v.value)}
                                        style={{
                                            padding:'10px 8px', borderRadius:10, border:`2px solid ${form.data.visibility === v.value ? '#7c3aed' : '#e5e7eb'}`,
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
                        </div>

                        {/* Color */}
                        <div>
                            <label style={lbl}>Color</label>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => form.setData('color', c)}
                                        style={{
                                            width:28, height:28, borderRadius:8, background:c, border:'none', cursor:'pointer',
                                            outline: form.data.color === c ? `3px solid ${c}` : 'none',
                                            outlineOffset: 2,
                                            transform: form.data.color === c ? 'scale(1.15)' : 'scale(1)',
                                            transition:'transform 0.1s',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Icon */}
                        <div>
                            <label style={lbl}>Icon</label>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                {ICONS.map(ic => (
                                    <button
                                        key={ic}
                                        type="button"
                                        onClick={() => form.setData('icon', ic)}
                                        style={{
                                            width:36, height:36, borderRadius:8, fontSize:18,
                                            border:`2px solid ${form.data.icon === ic ? '#7c3aed' : '#e5e7eb'}`,
                                            background: form.data.icon === ic ? '#ede9fe' : '#f9fafb',
                                            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                                        }}
                                    >
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display:'flex', gap:10, justifyContent:'flex-end', padding:'0 24px 20px' }}>
                        <button type="button" onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={form.processing} style={{ padding:'9px 24px', borderRadius:10, border:'none', background: form.processing ? '#c4b5fd' : '#7c3aed', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                            {form.processing ? 'Saving...' : isEdit ? 'Update Folder' : 'Create Folder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}