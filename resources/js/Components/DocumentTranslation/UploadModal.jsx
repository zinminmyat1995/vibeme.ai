import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';

const FLAGS = {
    en: (<svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="13"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8"/></svg>),
    ja: (<svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="12" fill="#BC002D"/></svg>),
    my: (<svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#FECB00"/><rect y="13" width="60" height="13" fill="#34B233"/><rect y="27" width="60" height="13" fill="#EA2839"/><polygon points="30,5 34,17 22,10 38,10 26,17" fill="#fff"/></svg>),
    km: (<svg width="20" height="14" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}><rect width="900" height="600" fill="#032EA1"/><rect width="900" height="300" y="150" fill="#E00025"/><g fill="white"><rect x="375" y="215" width="150" height="170"/><rect x="363" y="195" width="40" height="25"/><rect x="430" y="175" width="40" height="45"/><rect x="497" y="195" width="40" height="25"/><rect x="330" y="235" width="48" height="150"/><rect x="522" y="235" width="48" height="150"/></g></svg>),
    vi: (<svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#DA251D"/><polygon points="30,8 33,18 43,18 35,24 38,34 30,28 22,34 25,24 17,18 27,18" fill="#FFFF00"/></svg>),
    ko: (<svg width="18" height="13" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="10" fill="#CD2E3A"/><path d="M30,20 A5,10 0 0,1 30,10 A5,10 0 0,0 30,20z" fill="#0047A0"/><line x1="10" y1="10" x2="18" y2="18" stroke="#000" strokeWidth="2"/><line x1="12" y1="8" x2="20" y2="16" stroke="#000" strokeWidth="2"/><line x1="14" y1="6" x2="22" y2="14" stroke="#000" strokeWidth="2"/><line x1="42" y1="22" x2="50" y2="30" stroke="#000" strokeWidth="2"/><line x1="40" y1="24" x2="48" y2="32" stroke="#000" strokeWidth="2"/><line x1="38" y1="26" x2="46" y2="34" stroke="#000" strokeWidth="2"/></svg>),
};

const LANGUAGES = [
    { code: 'en', label: 'English', flag: FLAGS.en },
    { code: 'ja', label: 'Japanese', flag: FLAGS.ja },
    { code: 'my', label: 'Burmese', flag: FLAGS.my },
    { code: 'km', label: 'Khmer', flag: FLAGS.km },
    { code: 'vi', label: 'Vietnamese', flag: FLAGS.vi },
    { code: 'ko', label: 'Korean', flag: FLAGS.ko },
];

const ACCEPTED = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';

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
            borderStrong: 'rgba(148,163,184,0.22)',
            text: '#f8fafc',
            textSoft: '#cbd5e1',
            textMute: '#8da0b8',
            shadow: '0 28px 80px rgba(0,0,0,0.42)',
            shadowSoft: '0 16px 36px rgba(0,0,0,0.28)',
            overlay: 'rgba(2, 8, 23, 0.74)',
            primary: '#7c3aed',
            primaryHover: '#6d28d9',
            primarySoft: 'rgba(124,58,237,0.18)',
            secondary: '#2563eb',
            secondaryHover: '#1d4ed8',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#f87171',
            inputBg: 'rgba(255,255,255,0.035)',
            inputBorder: 'rgba(148,163,184,0.16)',
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
        success: '#059669',
        warning: '#d97706',
        danger: '#ef4444',
        inputBg: '#f8fafc',
        inputBorder: '#e5e7eb',
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
            shadow: `0 14px 32px ${theme.primary}30`,
        },
        ghost: {
            bg: theme.panelSoft,
            color: theme.textSoft,
            border: `1px solid ${theme.border}`,
            shadow: 'none',
        },
    }[variant];

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                height: 46,
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
        >
            {children}
        </button>
    );
}

function PremiumSelect({ options = [], value = '', onChange, placeholder = 'Select option...', theme, darkMode = false, width = '100%', zIndex = 300 }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const selected = options.find((opt) => String(opt.value) === String(value) && !opt.disabled);

    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const triggerBg = darkMode
        ? 'linear-gradient(180deg, rgba(12,22,44,0.96) 0%, rgba(8,17,36,0.96) 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)';

    const menuBg = darkMode
        ? 'linear-gradient(180deg, rgba(5,17,38,0.99) 0%, rgba(3,12,28,0.99) 100%)'
        : '#ffffff';

    return (
        <div ref={wrapRef} style={{ position: 'relative', width, zIndex }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: '100%',
                    height: 52,
                    padding: '0 16px',
                    borderRadius: 18,
                    border: `1px solid ${open ? theme.borderStrong : theme.inputBorder}`,
                    background: triggerBg,
                    color: selected ? theme.text : theme.textMute,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                    boxShadow: open ? theme.shadowSoft : 'none',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.18s ease',
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}>
                    <path d="M4 6L8 10L12 6" stroke={theme.textMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        left: 0,
                        right: 0,
                        zIndex: zIndex + 50,
                        background: menuBg,
                        border: `1px solid ${theme.borderStrong}`,
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: theme.shadow,
                        backdropFilter: 'blur(16px)',
                    }}
                >
                    {options.map((opt, index) => {
                        const isSelected = String(opt.value) === String(value);
                        return (
                            <button
                                key={String(opt.value) || `opt-${index}`}
                                type="button"
                                onClick={() => {
                                    if (opt.disabled) return;
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    minHeight: 54,
                                    padding: '0 16px',
                                    border: 'none',
                                    borderBottom: index < options.length - 1 ? `1px solid ${theme.border}` : 'none',
                                    background: isSelected ? '#2563eb' : 'transparent',
                                    color: isSelected ? '#fff' : theme.textSoft,
                                    opacity: opt.disabled ? 0.45 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    textAlign: 'left',
                                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontSize: 13,
                                    fontWeight: isSelected ? 800 : 600,
                                }}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FieldError({ msg, theme }) {
    if (!msg) return null;
    return <div style={{ fontSize: 11, color: theme.danger, marginTop: 7, fontWeight: 700 }}>{msg}</div>;
}

function FileGlyph({ ext, theme }) {
    const map = {
        pdf: { icon: 'PDF', soft: theme.panelSolid === '#0b1324' ? 'rgba(248,113,113,0.12)' : '#fee2e2', color: '#ef4444' },
        doc: { icon: 'DOC', soft: theme.panelSolid === '#0b1324' ? 'rgba(37,99,235,0.16)' : '#dbeafe', color: '#2563eb' },
        docx: { icon: 'DOCX', soft: theme.panelSolid === '#0b1324' ? 'rgba(37,99,235,0.16)' : '#dbeafe', color: '#2563eb' },
        txt: { icon: 'TXT', soft: theme.panelSolid === '#0b1324' ? 'rgba(148,163,184,0.14)' : '#e2e8f0', color: '#64748b' },
        png: { icon: 'IMG', soft: theme.panelSolid === '#0b1324' ? 'rgba(16,185,129,0.16)' : '#d1fae5', color: '#059669' },
        jpg: { icon: 'IMG', soft: theme.panelSolid === '#0b1324' ? 'rgba(16,185,129,0.16)' : '#d1fae5', color: '#059669' },
        jpeg: { icon: 'IMG', soft: theme.panelSolid === '#0b1324' ? 'rgba(16,185,129,0.16)' : '#d1fae5', color: '#059669' },
    };
    const meta = map[ext] || { icon: 'FILE', soft: theme.panelSoft, color: theme.textMute };
    return <div style={{ width: 62, height: 62, borderRadius: 20, background: meta.soft, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>{meta.icon}</div>;
}

function flattenFolders(folders, prefix = '') {
    let result = [];
    folders.forEach((f) => {
        result.push({ id: f.id, name: `${prefix}${f.icon} ${f.name}` });
        if (f.children?.length) result = result.concat(flattenFolders(f.children, `${prefix}　`));
    });
    return result;
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function UploadModal({ open, onClose, folders = [], currentFolderId = null, hasApi = false }) {
    const darkMode = useReactiveTheme();
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview] = useState(null);
    const inputRef = useRef(null);

    const form = useForm({
        file: null,
        folder_id: currentFolderId || '',
        source_language: 'en',
        target_languages: [],
        visibility: 'all',
        tags: '',
    });

    useEffect(() => {
        if (open) form.setData('folder_id', currentFolderId || '');
    }, [currentFolderId, open]);

    if (!open) return null;

    const folderOptions = [
        { value: '', label: 'Root (No folder)' },
        ...flattenFolders(folders).map((f) => ({ value: String(f.id), label: f.name })),
    ];

    const visibilityOptions = [
        { value: 'private', label: 'Private', desc: 'Only you', icon: '🔒' },
        { value: 'branch', label: 'My Branch', desc: 'Your branch', icon: '🏢' },
        { value: 'all', label: 'All Branches', desc: 'Everyone', icon: '🌐' },
    ];

    const handleFile = (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        setPreview({ name: file.name, size: formatSize(file.size), ext });
        form.setData('file', file);
    };

    const toggleTargetLang = (code) => {
        const current = form.data.target_languages;
        if (current.includes(code)) {
            form.setData('target_languages', current.filter((l) => l !== code));
        } else {
            form.setData('target_languages', [...current, code]);
        }
    };

    const resetAll = () => {
        setPreview(null);
        form.reset('file', 'tags', 'target_languages');
        form.setData('folder_id', currentFolderId || '');
        form.setData('source_language', 'en');
        form.setData('visibility', 'all');
        if (inputRef.current) inputRef.current.value = '';
    };

    const fireGlobalToast = (message, type = 'success') => {
        window.dispatchEvent(new CustomEvent('global-toast', {
            detail: { message, type }
        }));
    };

    const submit = (e) => {
        e.preventDefault();

        form.post('/documents/upload', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                resetAll();
                fireGlobalToast('File uploaded successfully!', 'success');
            },
            onError: () => {
                fireGlobalToast('Upload failed. Please try again.', 'error');
            },
        });
    };

    return (
        <>
            <style>{`
                @keyframes uploadSpin { to { transform: rotate(360deg); } }
                @keyframes uploadPulse {
                    0%, 100% { transform: scale(1); opacity: 0.88; }
                    50% { transform: scale(1.04); opacity: 1; }
                }
                .dt-upload-scroll-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .dt-upload-scroll-hide::-webkit-scrollbar {
                    display: none;
                    width: 0;
                    height: 0;
                }
            `}</style>

            <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: theme.overlay, backdropFilter: 'blur(12px)' }} />

                <div style={{ ...card(theme, { width: '100%', maxWidth: 760, maxHeight: '92vh', overflow: 'hidden', position: 'relative' }) }}>
                    <div style={{ padding: '30px 24px 26px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 42%, #2563eb 100%)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.22), transparent 34%), radial-gradient(circle at bottom right, rgba(255,255,255,0.10), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 58%)', pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>
                                    Document Translation
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.12 }}>
                                    Premium upload workspace
                                </div>
                                <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6 }}>
                                    Cleaner one-column layout, same route and same upload flow.
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 18,
                                    border: '1px solid rgba(255,255,255,0.16)',
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 28,
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        <div className="dt-upload-scroll-hide" style={{ overflowY: 'auto', maxHeight: 'calc(92vh - 170px)', padding: 24 }}>
                            <div style={{ display: 'grid', gap: 18 }}>
                                <div style={{ ...card(theme, { padding: 20, borderRadius: 22 }) }}>
                                    <div style={{ fontSize: 12, color: theme.primary, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                                        File intake
                                    </div>

                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragOver(false);
                                            handleFile(e.dataTransfer.files[0]);
                                        }}
                                        onClick={() => inputRef.current?.click()}
                                        style={{
                                            border: `2px dashed ${dragOver ? theme.primary : form.errors.file ? theme.danger : theme.inputBorder}`,
                                            borderRadius: 24,
                                            padding: '28px 20px',
                                            background: dragOver ? theme.primarySoft : theme.inputBg,
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                        }}
                                    >
                                        <input
                                            ref={inputRef}
                                            type="file"
                                            accept={ACCEPTED}
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFile(e.target.files[0])}
                                        />

                                        {preview ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <FileGlyph ext={preview.ext} theme={theme} />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 900, color: theme.text, wordBreak: 'break-word' }}>{preview.name}</div>
                                                    <div style={{ marginTop: 6, fontSize: 12, color: theme.textMute }}>{preview.size} · {preview.ext.toUpperCase()}</div>
                                                    <div style={{ marginTop: 8, fontSize: 11, color: theme.textMute }}>Click to replace or drag another file here.</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreview(null);
                                                        form.setData('file', null);
                                                        if (inputRef.current) inputRef.current.value = '';
                                                    }}
                                                    style={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius: 14,
                                                        border: `1px solid ${theme.border}`,
                                                        background: theme.panelSoft,
                                                        color: theme.danger,
                                                        cursor: 'pointer',
                                                        fontSize: 20,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ width: 82, height: 82, margin: '0 auto 14px', borderRadius: 26, background: theme.primarySoft, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'uploadPulse 2.1s ease-in-out infinite' }}>
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <path d="M17 8l-5-5-5 5" />
                                                        <path d="M12 3v12" />
                                                    </svg>
                                                </div>
                                                <div style={{ fontSize: 15, fontWeight: 900, color: theme.text }}>Drop file here or browse</div>
                                                <div style={{ marginTop: 8, fontSize: 12.5, color: theme.textMute, lineHeight: 1.6 }}>PDF, DOC, DOCX, TXT, PNG, JPG, JPEG</div>
                                                <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: theme.panelSoft, color: theme.textSoft, fontSize: 11, fontWeight: 900 }}>Max 20MB</div>
                                            </div>
                                        )}
                                    </div>

                                    <FieldError msg={form.errors.file} theme={theme} />
                                </div>

                                <div style={{ ...card(theme, { padding: 20, borderRadius: 22, position: 'relative', zIndex: 120, overflow: 'visible' }) }}>
                                    <div style={{ fontSize: 12, color: theme.primary, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
                                        Metadata
                                    </div>

                                    <div style={{ display: 'grid', gap: 16 }}>
                                        <div style={{ position: 'relative', zIndex: 150 }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft, marginBottom: 8 }}>Save to folder</div>
                                            <PremiumSelect
                                                options={folderOptions}
                                                value={form.data.folder_id}
                                                onChange={(value) => form.setData('folder_id', value)}
                                                placeholder="Root (No folder)"
                                                theme={theme}
                                                darkMode={darkMode}
                                                width="100%"
                                                zIndex={400}
                                            />
                                        </div>

                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft, marginBottom: 8 }}>Tags</div>
                                            <input
                                                value={form.data.tags}
                                                onChange={(e) => form.setData('tags', e.target.value)}
                                                placeholder="hr, report, 2026"
                                                style={{
                                                    width: '100%',
                                                    height: 52,
                                                    borderRadius: 18,
                                                    border: `1px solid ${form.errors.tags ? theme.danger : theme.inputBorder}`,
                                                    background: theme.inputBg,
                                                    color: theme.text,
                                                    padding: '0 16px',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    fontSize: 13,
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                            <FieldError msg={form.errors.tags} theme={theme} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ ...card(theme, { padding: 20, borderRadius: 22, position: 'relative', zIndex: 40 }) }}>
                                    <div style={{ fontSize: 12, color: theme.primary, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
                                        Language direction
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft, marginBottom: 10 }}>Source language</div>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {LANGUAGES.map((lang) => {
                                                const active = form.data.source_language === lang.code;
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        type="button"
                                                        onClick={() => form.setData('source_language', lang.code)}
                                                        style={{
                                                            height: 42,
                                                            padding: '0 14px',
                                                            borderRadius: 999,
                                                            border: `1px solid ${active ? theme.primary : theme.inputBorder}`,
                                                            background: active ? theme.primarySoft : theme.inputBg,
                                                            color: active ? theme.primary : theme.textSoft,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            cursor: 'pointer',
                                                            fontSize: 12,
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{lang.flag}</span>
                                                        {lang.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <FieldError msg={form.errors.source_language} theme={theme} />
                                    </div>

                                    <div style={{ marginTop: 18 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: theme.textSoft }}>Translate to</div>
                                            {!hasApi && (
                                                <div style={{ padding: '5px 10px', borderRadius: 999, background: darkMode ? 'rgba(245,158,11,0.14)' : '#fef3c7', color: theme.warning, fontSize: 10.5, fontWeight: 900 }}>
                                                    API not configured
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {LANGUAGES.filter((lang) => lang.code !== form.data.source_language).map((lang) => {
                                                const selected = form.data.target_languages.includes(lang.code);
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        type="button"
                                                        onClick={() => toggleTargetLang(lang.code)}
                                                        style={{
                                                            height: 42,
                                                            padding: '0 14px',
                                                            borderRadius: 999,
                                                            border: `1px solid ${selected ? theme.success : theme.inputBorder}`,
                                                            background: selected ? (darkMode ? 'rgba(16,185,129,0.16)' : '#d1fae5') : theme.inputBg,
                                                            color: selected ? theme.success : theme.textSoft,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            cursor: 'pointer',
                                                            fontSize: 12,
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{lang.flag}</span>
                                                        {lang.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ ...card(theme, { padding: 20, borderRadius: 22 }) }}>
                                    <div style={{ fontSize: 12, color: theme.primary, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
                                        Visibility
                                    </div>

                                    <div style={{ display: 'grid', gap: 10 }}>
                                        {visibilityOptions.map((item) => {
                                            const active = form.data.visibility === item.value;
                                            return (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => form.setData('visibility', item.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '15px 16px',
                                                        borderRadius: 18,
                                                        border: `1px solid ${active ? theme.primary : theme.border}`,
                                                        background: active ? theme.primarySoft : theme.panelSoft,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 14,
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: active ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` : theme.inputBg, color: active ? '#fff' : theme.textSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                                                        {item.icon}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 900, color: active ? theme.primary : theme.text }}>{item.label}</div>
                                                        <div style={{ marginTop: 4, fontSize: 11.5, color: theme.textMute }}>{item.desc}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <FieldError msg={form.errors.visibility} theme={theme} />

                                    {!hasApi && (
                                        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 16, border: `1px solid ${theme.border}`, background: darkMode ? 'rgba(245,158,11,0.12)' : '#fef3c7', color: theme.warning, fontSize: 12, fontWeight: 700, lineHeight: 1.6 }}>
                                            Translation API is not configured. The document can still be uploaded and stored using the current flow.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '0 24px 24px', borderTop: `1px solid ${theme.border}`, background: theme.panelSolid }}>
                            <UIButton type="button" onClick={onClose} variant="ghost" theme={theme} style={{ marginTop: 18 }}>
                                Cancel
                            </UIButton>
                            <UIButton type="submit" disabled={form.processing || !form.data.file} theme={theme} style={{ marginTop: 18 }}>
                                {form.processing && (
                                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'uploadSpin 0.7s linear infinite' }} />
                                )}
                                {form.processing ? 'Uploading...' : 'Upload document'}
                            </UIButton>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
