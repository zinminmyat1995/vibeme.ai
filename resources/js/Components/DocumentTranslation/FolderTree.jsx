// resources/js/Components/DocumentTranslation/FolderTree.jsx

import { useState } from 'react';

function FolderItem({ folder, depth = 0, selectedId, onSelect, onEdit, onDelete, onAddChild }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = folder.children?.length > 0;
    const isSelected  = selectedId === folder.id;

    const visIcon = { private:'🔒', branch:'🏢', all:'🌐' };

    return (
        <div>
            <div
                onClick={() => onSelect(folder)}
                style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:`7px 8px 7px ${8 + depth * 14}px`,
                    borderRadius:8, cursor:'pointer', marginBottom:2,
                    background: isSelected ? folder.color + '20' : 'transparent',
                    border: `1px solid ${isSelected ? folder.color + '30' : 'transparent'}`,
                    transition:'all 0.12s',
                }}
            >
                {/* Expand toggle */}
                <button
                    onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
                    style={{ background:'none', border:'none', cursor:'pointer', width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#9ca3af', fontSize:9, padding:0 }}
                >
                    {hasChildren ? (expanded ? '▼' : '▶') : <span style={{ width:14 }} />}
                </button>

                {/* Icon */}
                <div style={{ width:28, height:28, borderRadius:7, background:folder.color+'25', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                    {folder.icon}
                </div>

                {/* Name + meta */}
                <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#111827' : '#374151', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {folder.name}
                    </div>
                    <div style={{ display:'flex', gap:4, marginTop:1 }}>
                        <span style={{ fontSize:9, color:'#9ca3af' }}>{visIcon[folder.visibility]}</span>
                        <span style={{ fontSize:9, color:'#9ca3af' }}>{folder.documentCount} files</span>
                    </div>
                </div>

                {/* Actions — selected မှာပဲ ပြမည် */}
                {isSelected && (
                    <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                        {folder.depth < 3 && (
                            <button onClick={e => { e.stopPropagation(); onAddChild(folder); }} title="Add subfolder"
                                style={{ background:'#f3f4f6', border:'none', width:22, height:22, borderRadius:5, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontWeight:700 }}>
                                +
                            </button>
                        )}
                        {folder.canEdit && (
                            <button onClick={e => { e.stopPropagation(); onEdit(folder); }} title="Edit"
                                style={{ background:'#f3f4f6', border:'none', width:22, height:22, borderRadius:5, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                ✏️
                            </button>
                        )}
                        {folder.canDelete && (
                            <button onClick={e => { e.stopPropagation(); onDelete(folder); }} title="Delete"
                                style={{ background:'#fee2e2', border:'none', width:22, height:22, borderRadius:5, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                🗑️
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Children */}
            {expanded && hasChildren && (
                <div>
                    {folder.children.map(child => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({ folders = [], selectedFolder, onSelectFolder, onCreateFolder, onEditFolder, onDeleteFolder, onAddChildFolder }) {
    const [search, setSearch] = useState('');

    const filtered = search
        ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
        : folders;

    return (
        <div style={{ width:240, flexShrink:0, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', height:'100%' }}>

            {/* Header */}
            <div style={{ padding:'16px 12px 10px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:11, fontWeight:800, color:'#374151', letterSpacing:'1px' }}>FOLDERS</span>
                    <button onClick={() => onCreateFolder(null)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:7, background:'#7c3aed', color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                        + New
                    </button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 10px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search folders..."
                        style={{ background:'transparent', border:'none', outline:'none', fontSize:12, color:'#374151', flex:1 }} />
                </div>
            </div>

            {/* All Files */}
            <div style={{ padding:'0 8px' }}>
                <button onClick={() => onSelectFolder(null)}
                    style={{
                        width:'100%', display:'flex', alignItems:'center', gap:8,
                        padding:'7px 8px', borderRadius:8, cursor:'pointer', marginBottom:2,
                        border:`1px solid ${!selectedFolder ? '#ede9fe' : 'transparent'}`,
                        background: !selectedFolder ? '#f5f3ff' : 'transparent',
                    }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏠</div>
                    <span style={{ fontSize:12, fontWeight: !selectedFolder ? 700 : 500, color: !selectedFolder ? '#7c3aed' : '#374151' }}>All Files</span>
                </button>
            </div>

            <div style={{ height:1, background:'#f3f4f6', margin:'6px 12px' }} />

            {/* Folder List */}
            <div style={{ flex:1, overflowY:'auto', padding:'0 8px 12px' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'24px 12px' }}>
                        <div style={{ fontSize:28, marginBottom:6 }}>📂</div>
                        <div style={{ fontSize:11, color:'#9ca3af' }}>{search ? 'No folders found' : 'No folders yet'}</div>
                        {!search && (
                            <button onClick={() => onCreateFolder(null)}
                                style={{ marginTop:8, fontSize:11, color:'#7c3aed', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                                + Create first folder
                            </button>
                        )}
                    </div>
                ) : filtered.map(folder => (
                    <FolderItem
                        key={folder.id}
                        folder={folder}
                        selectedId={selectedFolder?.id}
                        onSelect={onSelectFolder}
                        onEdit={onEditFolder}
                        onDelete={onDeleteFolder}
                        onAddChild={onAddChildFolder}
                    />
                ))}
            </div>

            {/* Footer */}
            <div style={{ padding:'10px 12px', borderTop:'1px solid #f3f4f6' }}>
                <div style={{ fontSize:10, color:'#9ca3af', textAlign:'center' }}>{folders.length} folders total</div>
            </div>
        </div>
    );
}