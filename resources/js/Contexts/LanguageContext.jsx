// resources/js/Contexts/LanguageContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import en from '../locales/en.json';
import my from '../locales/my.json';
import km from '../locales/km.json';
import vi from '../locales/vi.json';
import ko from '../locales/ko.json';
import ja from '../locales/ja.json';

const TRANSLATIONS = { en, my, km, vi, ko, ja };
const STORAGE_KEY  = 'vibeme-lang';

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function getSavedLang() {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem(STORAGE_KEY) || 'en';
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(getSavedLang);

    const setLang = useCallback((code) => {
        if (!TRANSLATIONS[code]) return;
        localStorage.setItem(STORAGE_KEY, code);
        setLangState(code);
        window.dispatchEvent(new CustomEvent('vibeme-lang-change', { detail: { lang: code } }));
    }, []);

    const t = useCallback((key) => {
        return (
            getNestedValue(TRANSLATIONS[lang], key) ??
            getNestedValue(TRANSLATIONS['en'], key) ??
            key
        );
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useTranslation must be used inside <LanguageProvider>');
    return ctx;
}

// ── Flag SVGs ─────────────────────────────────────────────────
const FLAG = {
    en: (
        <svg width="20" height="14" viewBox="0 0 60 40" aria-hidden="true">
            <rect width="60" height="40" fill="#012169"/>
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4"/>
            <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6"/>
        </svg>
    ),
    my: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true">
            <rect width="30" height="6.67" fill="#FECB00"/>
            <rect y="6.67" width="30" height="6.67" fill="#34B233"/>
            <rect y="13.33" width="30" height="6.67" fill="#EA2839"/>
            <polygon points="15,2 16.76,7.42 22.47,7.42 17.86,10.73 19.61,16.16 15,12.84 10.39,16.16 12.14,10.73 7.53,7.42 13.24,7.42" fill="#fff"/>
        </svg>
    ),
    km: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true">
            <rect width="30" height="20" fill="#032EA1"/>
            <rect y="5" width="30" height="10" fill="#E00025"/>
            <g fill="#fff" transform="translate(5.4 5.1) scale(0.88)">
                <rect x="2.2" y="7.5" width="14.8" height="1.2" rx="0.15"/>
                <rect x="3.0" y="6.5" width="13.2" height="0.95" rx="0.12"/>
                <path d="M8.85 0.4 L9.8 1.55 L10.75 0.4 L10.35 2.1 L10.35 5.75 L9.25 5.75 L9.25 2.1 Z"/>
                <rect x="8.85" y="5.75" width="1.9" height="0.9"/>
                <path d="M6.15 1.55 L6.9 2.45 L7.65 1.55 L7.35 2.9 L7.35 5.55 L6.45 5.55 L6.45 2.9 Z"/>
                <rect x="6.05" y="5.55" width="1.6" height="0.82"/>
                <path d="M11.95 1.55 L12.7 2.45 L13.45 1.55 L13.15 2.9 L13.15 5.55 L12.25 5.55 L12.25 2.9 Z"/>
                <rect x="11.85" y="5.55" width="1.6" height="0.82"/>
            </g>
        </svg>
    ),
    vi: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true">
            <rect width="30" height="20" fill="#DA251D"/>
            <polygon points="15,4 16.76,9.42 22.47,9.42 17.86,12.73 19.61,18.16 15,14.84 10.39,18.16 12.14,12.73 7.53,9.42 13.24,9.42" fill="#FFFF00"/>
        </svg>
    ),
    ko: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true">
            <rect width="30" height="20" fill="#fff"/>
            {/* Trigrams - top left */}
            <line x1="2" y1="3"   x2="7" y2="3"   stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="4.8" x2="7" y2="4.8" stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="6.6" x2="4" y2="6.6" stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="6.6" x2="7" y2="6.6" stroke="#000" strokeWidth="1.2"/>
            {/* Trigrams - top right */}
            <line x1="23" y1="3"   x2="28" y2="3"   stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="4.8" x2="25" y2="4.8" stroke="#000" strokeWidth="1.2"/>
            <line x1="26" y1="4.8" x2="28" y2="4.8" stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="6.6" x2="28" y2="6.6" stroke="#000" strokeWidth="1.2"/>
            {/* Trigrams - bottom left */}
            <line x1="2" y1="13.4" x2="4" y2="13.4" stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="13.4" x2="7" y2="13.4" stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="15.2" x2="4" y2="15.2" stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="15.2" x2="7" y2="15.2" stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="17"   x2="4" y2="17"   stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="17"   x2="7" y2="17"   stroke="#000" strokeWidth="1.2"/>
            {/* Trigrams - bottom right */}
            <line x1="23" y1="13.4" x2="28" y2="13.4" stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="15.2" x2="28" y2="15.2" stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="17"   x2="28" y2="17"   stroke="#000" strokeWidth="1.2"/>
            {/* Taegeuk circle */}
            <circle cx="15" cy="10" r="4" fill="#CD2E3A"/>
            <path d="M15,6 A4,4 0 0,1 15,14 A2,2 0 0,1 15,10 A2,2 0 0,0 15,6" fill="#0047A0"/>
        </svg>
    ),
    ja: (
        <svg width="20" height="14" viewBox="0 0 30 20" aria-hidden="true">
            <rect width="30" height="20" fill="#fff"/>
            <circle cx="15" cy="10" r="5.5" fill="#BC002D"/>
        </svg>
    ),
};

const LANG_NATIVE = {
    en: 'EN',
    my: 'မြ',
    km: 'ខ្មែ',
    vi: 'VI',
    ko: '한',
    ja: '日',
};

const LANG_FULL = {
    en: 'English',
    my: 'မြန်မာ',
    km: 'ខ្មែរ',
    vi: 'Tiếng Việt',
    ko: '한국어',
    ja: '日本語',
};

// ── Language Switcher ─────────────────────────────────────────
export function LanguageSwitcher({ darkMode }) {
    const { lang, setLang } = useTranslation();
    const [open, setOpen]   = useState(false);

    const text    = darkMode ? '#94a3b8' : '#64748b';
    const menuBg  = darkMode ? '#1e293b' : '#ffffff';
    const menuBdr = darkMode ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)';
    const hoverBg = darkMode ? 'rgba(255,255,255,0.06)' : '#f8fafc';

    return (
        <div style={{ position: 'relative' }}>

            {/* ── Trigger — no border, ghost ── */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    height: 36,
                    padding: '0 8px',
                    border: 'none',
                    borderRadius: 10,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: text,
                    fontFamily: 'inherit',
                    opacity: 0.85,
                    transition: 'opacity 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.background = darkMode
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(15,23,42,0.05)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.opacity = '0.85';
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                {/* Flag */}
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    lineHeight: 1,
                    borderRadius: 2,
                    overflow: 'hidden',
                }}>
                    {FLAG[lang]}
                </span>

                {/* Native label — minWidth ထည့်ထားတဲ့အတွက် မြ/한/日 စာလုံးတွေ ပြည့်ပြည့်မြင်ရမည် */}
                <span style={{
                    minWidth: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    color: text,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.01em',
                    display: 'inline-block',
                    textAlign: 'center',
                }}>
                    {LANG_NATIVE[lang]}
                </span>

                {/* Chevron */}
                <svg
                    width="10" height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                        flexShrink: 0,
                        opacity: 0.45,
                        transition: 'transform 0.18s',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                >
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                        onClick={() => setOpen(false)}
                    />

                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        zIndex: 9999,
                        background: menuBg,
                        border: `1px solid ${menuBdr}`,
                        borderRadius: 16,
                        padding: 6,
                        minWidth: 180,
                        boxShadow: darkMode
                            ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
                            : '0 16px 40px rgba(15,23,42,0.13)',
                        backdropFilter: darkMode ? 'blur(20px)' : 'none',
                        animation: 'langDrop 0.14s ease',
                    }}>
                        <style>{`
                            @keyframes langDrop {
                                from { opacity: 0; transform: translateY(-6px); }
                                to   { opacity: 1; transform: translateY(0);    }
                            }
                        `}</style>

                        {Object.keys(TRANSLATIONS).map((code) => {
                            const isActive = lang === code;
                            return (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => { setLang(code); setOpen(false); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '9px 12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: 10,
                                        background: isActive
                                            ? (darkMode ? 'rgba(124,58,237,0.22)' : '#ede9fe')
                                            : 'transparent',
                                        color: isActive
                                            ? (darkMode ? '#c4b5fd' : '#7c3aed')
                                            : text,
                                        fontSize: 13,
                                        fontWeight: isActive ? 700 : 500,
                                        fontFamily: 'inherit',
                                        textAlign: 'left',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) e.currentTarget.style.background = hoverBg;
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {/* Flag */}
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexShrink: 0,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                    }}>
                                        {FLAG[code]}
                                    </span>

                                    {/* Full name */}
                                    <span style={{ flex: 1, whiteSpace: 'nowrap' }}>
                                        {LANG_FULL[code]}
                                    </span>

                                    {/* Short code */}
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        opacity: isActive ? 1 : 0.45,
                                        color: isActive
                                            ? (darkMode ? '#c4b5fd' : '#7c3aed')
                                            : text,
                                        minWidth: 20,
                                        textAlign: 'right',
                                    }}>
                                        {LANG_NATIVE[code]}
                                    </span>

                                    {/* Active check */}
                                    {isActive && (
                                        <svg
                                            width="12" height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={darkMode ? '#c4b5fd' : '#7c3aed'}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            style={{ flexShrink: 0 }}
                                        >
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}