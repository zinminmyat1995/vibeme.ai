// resources/js/Contexts/LanguageContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import en from '../locales/en.json';
import my from '../locales/my.json';
import km from '../locales/km.json';
import vi from '../locales/vi.json';
import ko from '../locales/ko.json';
import ja from '../locales/ja.json';

const TRANSLATIONS = { en, my, km, vi, ko, ja };
const STORAGE_KEY = 'vibeme-lang';

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

// ── Flag SVGs ─────────────────────────────────────────────────────────────────
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
    km: <svg width="20" height="14" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{borderRadius:2,display:'block'}}><rect width="900" height="600" fill="#032EA1"/><rect width="900" height="300" y="150" fill="#E00025"/><g fill="white"><rect x="375" y="215" width="150" height="170"/><rect x="363" y="195" width="40" height="25"/><rect x="430" y="175" width="40" height="45"/><rect x="497" y="195" width="40" height="25"/><rect x="330" y="235" width="48" height="150"/><rect x="522" y="235" width="48" height="150"/></g></svg>,

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
            <line x1="2" y1="3" x2="7" y2="3" stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="4.8" x2="7" y2="4.8" stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="6.6" x2="4" y2="6.6" stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="6.6" x2="7" y2="6.6" stroke="#000" strokeWidth="1.2"/>
            {/* Trigrams - top right */}
            <line x1="23" y1="3" x2="28" y2="3" stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="4.8" x2="25" y2="4.8" stroke="#000" strokeWidth="1.2"/>
            <line x1="26" y1="4.8" x2="28" y2="4.8" stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="6.6" x2="28" y2="6.6" stroke="#000" strokeWidth="1.2"/>
            {/* Trigrams - bottom left */}
            <line x1="2" y1="13.4" x2="4" y2="13.4" stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="13.4" x2="7" y2="13.4" stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="15.2" x2="4" y2="15.2" stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="15.2" x2="7" y2="15.2" stroke="#000" strokeWidth="1.2"/>
            <line x1="2" y1="17" x2="4" y2="17" stroke="#000" strokeWidth="1.2"/>
            <line x1="5" y1="17" x2="7" y2="17" stroke="#000" strokeWidth="1.2"/>
            {/* Trigrams - bottom right */}
            <line x1="23" y1="13.4" x2="28" y2="13.4" stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="15.2" x2="28" y2="15.2" stroke="#000" strokeWidth="1.2"/>
            <line x1="23" y1="17" x2="28" y2="17" stroke="#000" strokeWidth="1.2"/>
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

// ── Language Switcher ─────────────────────────────────────────────────────────
export function LanguageSwitcher({ darkMode }) {
    const { lang, setLang, t } = useTranslation();
    const [open, setOpen] = useState(false);

    const border   = darkMode ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.10)';
    const bg       = darkMode ? 'rgba(255,255,255,0.06)' : '#ffffff';
    const text     = darkMode ? '#e2e8f0' : '#334155';
    const menuBg   = darkMode ? '#1e293b' : '#ffffff';
    const hoverBg  = darkMode ? 'rgba(255,255,255,0.07)' : '#f1f5f9';

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 36, padding: '0 10px',
                    border: `1px solid ${border}`,
                    borderRadius: 10,
                    background: bg,
                    cursor: 'pointer',
                    color: text,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    fontFamily: 'inherit',
                }}
                title={t('lang.label')}
            >
                {FLAG[lang]}
                <span>{LANG_NATIVE[lang]}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </button>

            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setOpen(false)} />
                    <div style={{
                        position: 'absolute', top: 42, right: 0, zIndex: 1000,
                        background: menuBg,
                        border: `1px solid ${border}`,
                        borderRadius: 14,
                        padding: 6,
                        minWidth: 150,
                        boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
                    }}>
                        {Object.keys(TRANSLATIONS).map((code) => (
                            <button
                                key={code}
                                onClick={() => { setLang(code); setOpen(false); }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 10px', border: 'none', cursor: 'pointer',
                                    borderRadius: 9,
                                    background: lang === code
                                        ? (darkMode ? 'rgba(124,58,237,0.22)' : '#ede9fe')
                                        : 'transparent',
                                    color: lang === code
                                        ? (darkMode ? '#c4b5fd' : '#7c3aed')
                                        : text,
                                    fontSize: 12.5,
                                    fontWeight: lang === code ? 800 : 600,
                                    fontFamily: 'inherit',
                                    transition: 'background 0.12s',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => { if (lang !== code) e.currentTarget.style.background = hoverBg; }}
                                onMouseLeave={e => { if (lang !== code) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                                    {FLAG[code]}
                                </span>
                                <span>{t(`lang.${code}`)}</span>
                                {lang === code && (
                                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
