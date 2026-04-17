import { useState, useEffect, useRef } from "react";
import { Link } from "@inertiajs/react";

const FLAGS = { myanmar:"MM", cambodia:"KH", japan:"JP", vietnam:"VN", korea:"KR" };

const FLAG_SVGS = {
    JP: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#FFFFFF" />
            <circle cx="15" cy="10" r="6" fill="#BC002D" />
        </svg>
    ),
    MM: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#FECB00" />
            <rect y="6.666" width="30" height="6.666" fill="#34B233" />
            <rect y="13.333" width="30" height="6.667" fill="#EA2839" />
            <polygon points="15,4 16.6,8.8 21.7,8.8 17.55,11.8 19.15,16.6 15,13.6 10.85,16.6 12.45,11.8 8.3,8.8 13.4,8.8" fill="#FFFFFF" />
        </svg>
    ),
    KH: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#032EA1" />
            <rect y="5" width="30" height="10" fill="#E00025" />
            <g fill="#FFFFFF" transform="translate(5.4 5.1)">
                <rect x="2.2" y="7.5" width="14.8" height="1.2" rx="0.15" />
                <rect x="3.0" y="6.5" width="13.2" height="0.95" rx="0.12" />
                <path d="M8.85 0.4 L9.8 1.55 L10.75 0.4 L10.35 2.1 L10.35 5.75 L9.25 5.75 L9.25 2.1 Z" />
                <rect x="8.85" y="5.75" width="1.9" height="0.9" />
                <path d="M6.15 1.55 L6.9 2.45 L7.65 1.55 L7.35 2.9 L7.35 5.55 L6.45 5.55 L6.45 2.9 Z" />
                <rect x="6.05" y="5.55" width="1.6" height="0.82" />
                <path d="M11.95 1.55 L12.7 2.45 L13.45 1.55 L13.15 2.9 L13.15 5.55 L12.25 5.55 L12.25 2.9 Z" />
                <rect x="11.85" y="5.55" width="1.6" height="0.82" />
                <path d="M3.95 2.6 L4.55 3.35 L5.15 2.6 L4.9 3.7 L4.9 5.35 L4.2 5.35 L4.2 3.7 Z" />
                <rect x="3.85" y="5.35" width="1.4" height="0.72" />
                <path d="M14.45 2.6 L15.05 3.35 L15.65 2.6 L15.4 3.7 L15.4 5.35 L14.7 5.35 L14.7 3.7 Z" />
                <rect x="14.35" y="5.35" width="1.4" height="0.72" />
                <rect x="3.5" y="6.05" width="11.8" height="0.52" />
                <rect x="2.9" y="6.65" width="13.0" height="0.48" />
            </g>
        </svg>
    ),
    VN: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#DA251D" />
            <polygon points="15,4.2 16.55,8.9 21.5,8.9 17.5,11.8 19.05,16.5 15,13.6 10.95,16.5 12.5,11.8 8.5,8.9 13.45,8.9" fill="#FFCD00" />
        </svg>
    ),
    KR: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#FFFFFF" />
            <g transform="translate(15 10)">
                <path d="M0,-4.2 A4.2,4.2 0 0 1 0,4.2 A2.1,2.1 0 0 0 0,0 A2.1,2.1 0 0 1 0,-4.2Z" fill="#CD2E3A" />
                <path d="M0,4.2 A4.2,4.2 0 0 1 0,-4.2 A2.1,2.1 0 0 0 0,0 A2.1,2.1 0 0 1 0,4.2Z" fill="#0047A0" />
            </g>
            <g fill="#000000" transform="rotate(-35 8 5)">
                <rect x="5.2" y="3.6" width="4.2" height="0.8" rx="0.15" />
                <rect x="5.2" y="5" width="4.2" height="0.8" rx="0.15" />
                <rect x="5.2" y="6.4" width="4.2" height="0.8" rx="0.15" />
            </g>
            <g fill="#000000" transform="rotate(35 22 5)">
                <rect x="20.6" y="3.6" width="1.8" height="0.8" rx="0.15" /><rect x="22.8" y="3.6" width="1.8" height="0.8" rx="0.15" />
                <rect x="20.6" y="5" width="1.8" height="0.8" rx="0.15" /><rect x="22.8" y="5" width="1.8" height="0.8" rx="0.15" />
                <rect x="20.6" y="6.4" width="1.8" height="0.8" rx="0.15" /><rect x="22.8" y="6.4" width="1.8" height="0.8" rx="0.15" />
            </g>
            <g fill="#000000" transform="rotate(35 8 15)">
                <rect x="5.2" y="13.6" width="4.2" height="0.8" rx="0.15" />
                <rect x="5.2" y="15" width="1.8" height="0.8" rx="0.15" /><rect x="7.6" y="15" width="1.8" height="0.8" rx="0.15" />
                <rect x="5.2" y="16.4" width="4.2" height="0.8" rx="0.15" />
            </g>
            <g fill="#000000" transform="rotate(-35 22 15)">
                <rect x="20.6" y="13.6" width="1.8" height="0.8" rx="0.15" /><rect x="22.8" y="13.6" width="1.8" height="0.8" rx="0.15" />
                <rect x="20.6" y="15" width="4.2" height="0.8" rx="0.15" />
                <rect x="20.6" y="16.4" width="1.8" height="0.8" rx="0.15" /><rect x="22.8" y="16.4" width="1.8" height="0.8" rx="0.15" />
            </g>
        </svg>
    ),
};

function FlagIcon({ code, size = 28 }) {
    const svg = FLAG_SVGS[code];
    const h = Math.round(size * (20/30));
    return (
        <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:size,height:h,borderRadius:3,overflow:'hidden',boxShadow:'0 0 0 1px rgba(0,0,0,0.12)',flexShrink:0}}>
            {svg || <span style={{fontSize:10,background:'#e5e5e5',width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>{code}</span>}
        </span>
    );
}

function useTheme() {
    const [dark, setDark] = useState(() => {
        if (typeof window === "undefined") return false;
        const saved = localStorage.getItem("brycen-theme");
        return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    });
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        localStorage.setItem("brycen-theme", dark ? "dark" : "light");
    }, [dark]);
    return [dark, setDark];
}

function useInView(threshold = 0.1) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, visible];
}

export default function Welcome({ offices = [] }) {
    const [dark, setDark] = useTheme();
    const [aboutOpen, setAboutOpen] = useState(false);
    const total = offices.reduce((s, o) => s + (o.open_job_postings_count || 0), 0);
    const hiring = offices.filter(o => o.open_job_postings_count > 0);
    const notHiring = offices.filter(o => !o.open_job_postings_count);

    return (
        <>
        <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}

/* ── LIGHT: Apple-inspired ── */
:root {
    --bg:       #f5f5f7;
    --bg2:      #ffffff;
    --bg3:      #f0f0f3;
    --line:     rgba(0,0,0,0.08);
    --line2:    rgba(0,0,0,0.14);
    --text:     #1d1d1f;
    --text2:    #6e6e73;
    --text3:    #a1a1a6;
    --acc:      #0071e3;
    --acc-soft: rgba(0,113,227,0.08);
    --acc-txt:  #0071e3;
    --green:    #1d8348;
    --green-bg: rgba(29,131,72,0.08);
    --green-txt:#1d8348;
    --nav-bg:   rgba(245,245,247,0.88);
    --card-bg:  #ffffff;
    --card-sh:  0 2px 20px rgba(0,0,0,0.08);
    --card-sh2: 0 8px 40px rgba(0,0,0,0.12);
}

/* ── DARK: Deep navy ── */
[data-theme=dark] {
    --bg:       #0a0e1a;
    --bg2:      #111827;
    --bg3:      #1a2236;
    --line:     rgba(255,255,255,0.07);
    --line2:    rgba(255,255,255,0.12);
    --text:     #e8eaf0;
    --text2:    #8892a4;
    --text3:    #4a5568;
    --acc:      #4f8ef7;
    --acc-soft: rgba(79,142,247,0.12);
    --acc-txt:  #7aabff;
    --green:    #34d399;
    --green-bg: rgba(52,211,153,0.1);
    --green-txt:#34d399;
    --nav-bg:   rgba(10,14,26,0.9);
    --card-bg:  #111827;
    --card-sh:  0 2px 20px rgba(0,0,0,0.4);
    --card-sh2: 0 8px 40px rgba(0,0,0,0.5);
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    transition: background 0.3s, color 0.3s;
}

/* ── NAV ── */
.nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: 52px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px;
    background: var(--nav-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--line);
}
.nav-logo { display:flex; align-items:center; gap:8px; text-decoration:none; }
.nav-logo img { width:32px; height:32px; object-fit:contain; }
.nav-logo-name { font-size:15px; font-weight:600; color:var(--text); letter-spacing:-0.3px; }
.nav-logo-name span { color: var(--acc); }

.nav-r { display:flex; align-items:center; gap:10px; }

.nav-about {
    font-size: 13px; font-weight: 500;
    color: var(--text2);
    background: none;
    border: none;
    cursor: pointer; font-family: inherit;
    padding: 0 14px;
    height: 32px;
    border-radius: 8px;
    transition: all 0.15s;
    text-decoration: none;
    display: inline-flex; align-items: center;
    letter-spacing: -0.1px;
}
.nav-about:hover {
    color: var(--text);
    background: var(--bg3);
    border-color: var(--line2);
}
.theme-toggle {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 12px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text2);
    font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
    font-family: inherit;
}
.theme-toggle:hover { background: var(--bg3); color: var(--text); }

.nav-cta {
    display: inline-flex; align-items: center;
    height: 32px; padding: 0 16px;
    border-radius: 8px;
    background: var(--acc);
    color: #fff;
    font-size: 12px; font-weight: 600;
    text-decoration: none;
    transition: all 0.18s;
    letter-spacing: -0.1px;
}
.nav-cta:hover { opacity: 0.88; transform: translateY(-1px); }

/* ── HERO ── */
.hero {
    padding-top: 70px;
    padding-bottom: 0px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-left: 24px; padding-right: 24px;
    position: relative;
    overflow: hidden;
}

/* subtle background texture */
.hero::before {
    content: '';
    position: absolute;
    top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(ellipse, var(--acc-soft) 0%, transparent 70%);
    pointer-events: none;
}

.hero-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--acc-txt);
    margin-bottom: 20px;
    opacity: 0; animation: fadeUp 0.6s ease 0.1s forwards;
}
.eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--green);
    animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.8)} }

.hero-title {
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.05;
    color: var(--text);
    margin-bottom: 16px;
    opacity: 0; animation: fadeUp 0.6s ease 0.18s forwards;
    max-width: 720px;
}
.hero-title .accent { color: var(--acc); }

.hero-sub {
    font-size: 17px;
    color: var(--text2);
    line-height: 1.6;
    font-weight: 400;
    margin-bottom: 0;
    max-width: 440px;
    opacity: 0; animation: fadeUp 0.6s ease 0.26s forwards;
}

/* ── ABOUT MODAL ── */

/* ── OFFICES SECTION ── */
.offices-section {
    max-width: 1100px;
    margin: 0 auto;
    padding: 16px 40px 100px;
}

.section-header {
    text-align: center;
    margin-bottom: 20px;
}
.section-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text3);
    margin-bottom: 10px;
}
.section-title {
    font-size: 32px; font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--text);
}

/* ── OFFICE GRID ── */
.office-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}
.office-grid-bottom {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: calc((100% - 16px) * 2/3 + 16px);
    margin: 16px auto 0;
}

.ocard {
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    aspect-ratio: 4/3;
    background: #111;
    text-decoration: none;
    display: block;
    border: 1px solid var(--line);
    transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s;
    opacity: 0; transform: translateY(20px);
}
.ocard.vis { animation: cardIn 0.55s ease forwards; }
@keyframes cardIn { to { opacity:1; transform:translateY(0); } }
.ocard:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 24px 60px rgba(0,0,0,0.18); }
[data-theme=dark] .ocard:hover { box-shadow: 0 24px 60px rgba(0,0,0,0.5); }

.ocard-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.23,1,0.32,1);
}
[data-theme=light] .ocard-img { filter: brightness(0.62) saturate(0.7); }
[data-theme=dark] .ocard-img { filter: brightness(0.38) saturate(0.5); }
.ocard:hover .ocard-img { transform: scale(1.06); }

.ocard-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
}
.ocard.active .ocard-overlay {
    background: linear-gradient(to top, rgba(0,20,8,0.9) 0%, rgba(0,15,5,0.25) 50%, transparent 100%);
}

.ocard-flag { position: absolute; top: 12px; left: 12px; border-radius: 4px; overflow: hidden; }

.ocard-chip {
    position: absolute; top: 12px; right: 12px;
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: #fff;
    background: var(--green);
    padding: 4px 10px; border-radius: 100px;
    box-shadow: 0 2px 12px rgba(29,131,72,0.4);
}
.chip-ring {
    width: 5px; height: 5px; border-radius: 50%; background: #fff;
    position: relative; flex-shrink: 0;
}
.chip-ring::after {
    content: ''; position: absolute; inset: -3px;
    border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.7);
    animation: ring 1.8s ease-out infinite;
}
@keyframes ring { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(3.5);opacity:0} }

.ocard-body { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; }
.ocard-name {
    font-size: 16px; font-weight: 700;
    color: #fff; letter-spacing: -0.3px;
    margin-bottom: 3px;
}
.ocard-city { font-size: 11px; color: rgba(255,255,255,0.45); margin-bottom: 10px; }
.ocard-pos {
    display: inline-block;
    font-size: 11px; font-weight: 600;
    color: #fff; background: var(--green);
    padding: 3px 10px; border-radius: 100px;
}
.ocard-none {
    display: inline-block;
    font-size: 10px; color: rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.06);
    padding: 3px 9px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.08);
}

/* ── ABOUT MODAL ── */
.about-modal-bg {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: bgIn 0.2s ease;
}
@keyframes bgIn { from{opacity:0} to{opacity:1} }
.about-modal {
    background: var(--card-bg);
    border: 1px solid var(--line2);
    border-radius: 20px;
    padding: 40px;
    max-width: 520px; width: 100%;
    box-shadow: var(--card-sh2);
    animation: modalIn 0.3s cubic-bezier(0.23,1,0.32,1);
}
@keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
.about-modal-close {
    float: right; background: none; border: none;
    font-size: 20px; cursor: pointer;
    color: var(--text2); line-height: 1;
    transition: color 0.15s;
    margin-left: 16px;
}
.about-modal-close:hover { color: var(--text); }
.about-modal-logo { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
.about-modal-logo img { width:40px; height:40px; object-fit:contain; }
.about-modal-logo-txt { font-size:18px; font-weight:700; color:var(--text); letter-spacing:-0.4px; }
.about-modal-logo-txt span { color:var(--acc); }
.about-modal-body { font-size:14px; color:var(--text2); line-height:1.75; }
.about-modal-stats {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: var(--line);
    border-radius: 12px; overflow: hidden;
    margin-top: 24px;
}
.about-stat {
    background: var(--bg3);
    padding: 16px;
    text-align: center;
}
.about-stat-n { font-size: 24px; font-weight: 700; color: var(--text); letter-spacing: -0.04em; }
.about-stat-l { font-size: 11px; color: var(--text3); margin-top: 2px; font-weight: 500; }

/* ── FOOTER ── */
footer {
    text-align: center;
    padding: 24px;
    font-size: 12px;
    color: var(--text3);
    border-top: 1px solid var(--line);
}

/* ── ANIMATIONS ── */
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

/* ── RESPONSIVE ── */
@media(max-width:900px){
    .office-grid { grid-template-columns:repeat(2,1fr); }
    .office-grid-bottom { grid-template-columns:1fr; max-width:100%; }
    .nav { padding:0 20px; }
    .offices-section { padding:60px 20px 80px; }
    .hero-title { font-size: clamp(32px,8vw,56px); }
}
@media(max-width:600px){
    .office-grid { grid-template-columns:1fr; }
    .hero-title { font-size: 34px; }
    .hero::before {
        width: 400px;
        height: 300px;
        top: -100px;
    }
    .hero-sub { font-size: 15px; }
}
        `}</style>

        {/* ── NAV ── */}
        <nav className="nav">
            <Link href="/" className="nav-logo">
                <img src="/images/main-logo.svg" alt="Brycen"/>
                <span className="nav-logo-name">VibeMe<span>.AI</span></span>
            </Link>
            <div className="nav-r">
                <button className="nav-about" onClick={() => setAboutOpen(true)}>
                    About
                </button>
                <button className="theme-toggle" onClick={() => setDark(d => !d)}>
                    <span>{dark ? "☀" : "☾"}</span>
                    <span>{dark ? "Light" : "Dark"}</span>
                </button>
            
            </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
            <div className="hero-eyebrow">
                <span className="eyebrow-dot"/>
                Brycen Group · Asia Pacific
            </div>

            <h1 className="hero-title">
                {total > 0 ? (
                    <>We're hiring<br/><span className="accent">{total} position{total !== 1 ? "s" : ""}</span> across Asia.</>
                ) : (
                    <>Engineering careers<br/>across <span className="accent">Asia Pacific.</span></>
                )}
            </h1>

            <p className="hero-sub">
                Japan-quality engineering. {offices.length} offices.
                Find where you belong.
            </p>
        </section>

        {/* ── OFFICES GRID ── */}
        <section className="offices-section" id="offices">
            <div className="section-header">
                <div className="section-title">Where We Operate</div>
            </div>
            <OfficeGrid offices={[...hiring, ...notHiring]} />
        </section>

        <footer>
            © {new Date().getFullYear()} Brycen Group · Powered by VibeMe.AI
        </footer>

        {/* ── About Modal ── */}
        {aboutOpen && (
            <div className="about-modal-bg" onClick={() => setAboutOpen(false)}>
                <div className="about-modal" onClick={e => e.stopPropagation()}>
                    <button className="about-modal-close" onClick={() => setAboutOpen(false)}>×</button>
                    <div className="about-modal-logo">
                        <img src="/images/main-logo.svg" alt="Brycen"/>
                        <span className="about-modal-logo-txt">Brycen <span>Group</span></span>
                    </div>
                    <p className="about-modal-body">
                        Brycen is a Japan-based technology group with offices across Asia Pacific.
                        We deliver enterprise software, cloud infrastructure, and digital transformation
                        solutions — maintaining Japan-quality engineering standards in every market we operate.
                    </p>
                    <div className="about-modal-stats">
                        <div className="about-stat">
                            <div className="about-stat-n">30+</div>
                            <div className="about-stat-l">Years</div>
                        </div>
                        <div className="about-stat">
                            <div className="about-stat-n">5</div>
                            <div className="about-stat-l">Countries</div>
                        </div>
                        <div className="about-stat">
                            <div className="about-stat-n">500+</div>
                            <div className="about-stat-l">Engineers</div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

function OfficeGrid({ offices }) {
    const top = offices.slice(0, 3);
    const bot = offices.slice(3);
    return (
        <>
            <div className="office-grid">
                {top.map((o, i) => <OfficeCard key={o.id} office={o} delay={i * 0.08}/>)}
            </div>
            {bot.length > 0 && (
                <div className="office-grid-bottom">
                    {bot.map((o, i) => <OfficeCard key={o.id} office={o} delay={(i + 3) * 0.08}/>)}
                </div>
            )}
        </>
    );
}

function OfficeCard({ office, delay }) {
    const [ref, visible] = useInView(0.1);
    const hasJobs = office.open_job_postings_count > 0;
    return (
        <Link
            ref={ref}
            href={`/brycen/${office.country_key}`}
            className={`ocard${hasJobs ? " active" : ""}${visible ? " vis" : ""}`}
            style={{ animationDelay: `${delay}s` }}
        >
            {office.image_path && (
                <img src={office.image_path} alt={office.company_name} className="ocard-img"
                    onError={e => e.target.style.display = "none"}/>
            )}
            <div className="ocard-overlay"/>
            <div className="ocard-flag">
                <FlagIcon code={FLAGS[office.country_key]} size={32}/>
            </div>
            {hasJobs && (
                <div className="ocard-chip">
                    <span className="chip-ring"/>
                    Hiring
                </div>
            )}
            <div className="ocard-body">
                <div className="ocard-name">{office.company_name}</div>
                <div className="ocard-city">{office.city}, {office.country_name}</div>
                {hasJobs
                    ? <span className="ocard-pos">{office.open_job_postings_count} position{office.open_job_postings_count !== 1 ? "s" : ""}</span>
                    : <span className="ocard-none">Not hiring now</span>
                }
            </div>
        </Link>
    );
}