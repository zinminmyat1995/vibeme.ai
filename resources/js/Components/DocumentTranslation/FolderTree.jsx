import { useEffect, useMemo, useRef, useState } from 'react';

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
            panel: 'linear-gradient(180deg, rgba(9,16,32,0.98) 0%, rgba(7,13,27,0.96) 100%)',
            panelSoft: 'rgba(255,255,255,0.035)',
            panelSofter: 'rgba(255,255,255,0.055)',
            border: 'rgba(148,163,184,0.12)',
            borderStrong: 'rgba(148,163,184,0.20)',
            text: '#f8fafc',
            textSoft: '#dbe4f0',
            textMute: '#90a4bc',
            accent: '#7c3aed',
            accentSoft: 'rgba(124,58,237,0.18)',
            shadow: '0 24px 60px rgba(0,0,0,0.30)',
            rowHover: 'rgba(255,255,255,0.032)',
            input: 'rgba(255,255,255,0.03)',
            dangerSoft: 'rgba(248,113,113,0.14)',
        };
    }

    return {
        panel: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,250,255,0.96) 100%)',
        panelSoft: '#f8fafc',
        panelSofter: '#f1f5f9',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.12)',
        text: '#0f172a',
        textSoft: '#334155',
        textMute: '#94a3b8',
        accent: '#7c3aed',
        accentSoft: '#f3e8ff',
        shadow: '0 18px 40px rgba(15,23,42,0.08)',
        rowHover: '#fbfbff',
        input: '#f8fafc',
        dangerSoft: '#fee2e2',
    };
}

function ActionButton({ title, onClick, children, theme, danger = false }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: danger ? theme.dangerSoft : theme.panelSoft,
                color: danger ? '#ef4444' : theme.textSoft,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            {children}
        </button>
    );
}

function FolderActionMenu({ folder, onAddChild, onEdit, onDelete, theme }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <ActionButton title="More" onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} theme={theme}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>⋯</span>
            </ActionButton>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: 176,
                        background: theme.panel,
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 18,
                        boxShadow: theme.shadow,
                        overflow: 'hidden',
                        zIndex: 60,
                        backdropFilter: 'blur(14px)',
                    }}
                >
                    {folder.depth < 3 && (
                        <button onClick={(e) => { e.stopPropagation(); setOpen(false); onAddChild(folder); }} style={menuBtn(theme)}>
                            <span>＋</span>
                            <span>Add subfolder</span>
                        </button>
                    )}

                    {folder.canEdit && (
                        <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(folder); }} style={menuBtn(theme)}>
                            <span>✎</span>
                            <span>Edit folder</span>
                        </button>
                    )}

                    {folder.canDelete && (
                        <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(folder); }} style={{ ...menuBtn(theme), color: '#ef4444' }}>
                            <span>🗑</span>
                            <span>Delete folder</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function menuBtn(theme) {
    return {
        width: '100%',
        padding: '12px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 12.5,
        fontWeight: 700,
        color: theme.textSoft,
        cursor: 'pointer',
        textAlign: 'left',
    };
}

function FolderItem({ folder, depth = 0, selectedId, onSelect, onEdit, onDelete, onAddChild, theme, darkMode }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = folder.children?.length > 0;
    const isSelected = selectedId === folder.id;
    const visIcon = { private: '🔒', branch: '🏢', all: '🌐' };

    return (
        <div>
            <div
                onClick={() => onSelect(folder)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: `10px 10px 10px ${10 + depth * 18}px`,
                    borderRadius: 18,
                    marginBottom: 6,
                    cursor: 'pointer',
                    background: isSelected ? `${folder.color}1f` : 'transparent',
                    border: `1px solid ${isSelected ? `${folder.color}55` : 'transparent'}`,
                    boxShadow: isSelected ? `inset 0 1px 0 ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}` : 'none',
                    transition: 'all 0.16s ease',
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = theme.rowHover;
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
            >
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) setExpanded(v => !v);
                    }}
                    style={{
                        width: 18,
                        height: 18,
                        border: 'none',
                        background: 'transparent',
                        color: theme.textMute,
                        cursor: hasChildren ? 'pointer' : 'default',
                        padding: 0,
                        flexShrink: 0,
                    }}
                >
                    {hasChildren ? (expanded ? '▾' : '▸') : ''}
                </button>

                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 14,
                        background: `${folder.color}22`,
                        border: `1px solid ${folder.color}33`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 17,
                        flexShrink: 0,
                    }}
                >
                    {folder.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: isSelected ? theme.text : theme.textSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {folder.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: theme.textMute }}>{visIcon[folder.visibility]}</span>
                        <span style={{ fontSize: 10, color: theme.textMute }}>{folder.documentCount} files</span>
                        {hasChildren && <span style={{ fontSize: 10, color: theme.textMute }}>{folder.children.length} subfolders</span>}
                    </div>
                </div>

                {isSelected && (
                    <FolderActionMenu folder={folder} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} theme={theme} />
                )}
            </div>

            {expanded && hasChildren && (
                <div>
                    {folder.children.map((child) => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            theme={theme}
                            darkMode={darkMode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({
    folders = [],
    selectedFolder,
    onSelectFolder,
    onCreateFolder,
    onEditFolder,
    onDeleteFolder,
    onAddChildFolder,
}) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);
    const [search, setSearch] = useState('');

    const filtered = search
        ? folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
        : folders;

    return (
        <>
            <style>{`
                .dt-scroll-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .dt-scroll-hide::-webkit-scrollbar {
                    display: none;
                    width: 0;
                    height: 0;
                }
            `}</style>

            <div
                style={{
                    width: '100%',
                    minWidth: 0,
                    flex: 1,
                    background: theme.panel,
                    borderRight: `1px solid ${theme.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: darkMode
                            ? 'radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(37,99,235,0.12), transparent 28%)'
                            : 'radial-gradient(circle at top right, rgba(124,58,237,0.08), transparent 32%), radial-gradient(circle at bottom left, rgba(37,99,235,0.06), transparent 28%)',
                        pointerEvents: 'none',
                    }}
                />

                <div style={{ position: 'relative', padding: '18px 16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.accent }}>
                                Library
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: theme.text, marginTop: 5 }}>
                                Smart folders
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onCreateFolder(null)}
                            style={{
                                height: 40,
                                minWidth: 84,
                                padding: '0 14px',
                                borderRadius: 14,
                                border: 'none',
                                background: `linear-gradient(135deg, ${theme.accent} 0%, #2563eb 100%)`,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 12px 24px rgba(124,58,237,0.22)',
                                flexShrink: 0,
                            }}
                        >
                            + New
                        </button>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: theme.input,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 16,
                            padding: '11px 12px',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search folders..."
                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: theme.text, flex: 1, minWidth: 0 }}
                        />
                    </div>
                </div>

                <div style={{ position: 'relative', padding: '0 12px 10px' }}>
                    <button
                        type="button"
                        onClick={() => onSelectFolder(null)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 12px',
                            borderRadius: 18,
                            border: `1px solid ${!selectedFolder ? `${theme.accent}33` : theme.border}`,
                            background: !selectedFolder ? theme.accentSoft : theme.panelSoft,
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{ width: 38, height: 38, borderRadius: 14, background: darkMode ? 'rgba(124,58,237,0.22)' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                            🏠
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 900, color: !selectedFolder ? theme.accent : theme.textSoft }}>All Files</div>
                            <div style={{ marginTop: 3, fontSize: 10.5, color: theme.textMute }}>Browse every uploaded document</div>
                        </div>
                    </button>
                </div>

                <div style={{ position: 'relative', height: 1, background: theme.border, margin: '0 16px 10px' }} />

                <div className="dt-scroll-hide" style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '0 12px 14px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 14px' }}>
                            <div style={{ width: 66, height: 66, borderRadius: 22, background: theme.panelSoft, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>
                                📂
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: theme.text }}>
                                {search ? 'No folders found' : 'No folders yet'}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 11.5, color: theme.textMute }}>
                                {search ? 'Try another keyword.' : 'Create the first folder for cleaner document organization.'}
                            </div>
                            {!search && (
                                <button
                                    type="button"
                                    onClick={() => onCreateFolder(null)}
                                    style={{
                                        marginTop: 14,
                                        height: 40,
                                        padding: '0 16px',
                                        borderRadius: 14,
                                        border: `1px solid ${theme.borderStrong}`,
                                        background: theme.panelSoft,
                                        color: theme.textSoft,
                                        fontSize: 12,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Create first folder
                                </button>
                            )}
                        </div>
                    ) : (
                        filtered.map((folder) => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                selectedId={selectedFolder?.id}
                                onSelect={onSelectFolder}
                                onEdit={onEditFolder}
                                onDelete={onDeleteFolder}
                                onAddChild={onAddChildFolder}
                                theme={theme}
                                darkMode={darkMode}
                            />
                        ))
                    )}
                </div>

                <div style={{ position: 'relative', padding: '12px 16px 14px', borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: 11, color: theme.textMute, textAlign: 'center', fontWeight: 700 }}>
                        {folders.length} folders total
                    </div>
                </div>
            </div>
        </>
    );
}
