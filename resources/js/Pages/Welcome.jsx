import { useState, useEffect, useRef } from "react";
import { Link } from "@inertiajs/react";

const FLAGS = { myanmar:"MM", cambodia:"KH", japan:"JP", vietnam:"VN", korea:"KR" };

/* ─── SVG Flag component — browser-safe, no emoji font issues ─── */
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
            <polygon
                points="15,4 16.6,8.8 21.7,8.8 17.55,11.8 19.15,16.6 15,13.6 10.85,16.6 12.45,11.8 8.3,8.8 13.4,8.8"
                fill="#FFFFFF"
            />
        </svg>
    ),

    KH: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#032EA1" />
            <rect y="5" width="30" height="10" fill="#E00025" />

            {/* Angkor Wat */}
            <g fill="#FFFFFF" transform="translate(5.4 5.1)">
                {/* base */}
                <rect x="2.2" y="7.5" width="14.8" height="1.2" rx="0.15" />
                <rect x="3.0" y="6.5" width="13.2" height="0.95" rx="0.12" />

                {/* center tower */}
                <path d="M8.85 0.4 L9.8 1.55 L10.75 0.4 L10.35 2.1 L10.35 5.75 L9.25 5.75 L9.25 2.1 Z" />
                <rect x="8.85" y="5.75" width="1.9" height="0.9" />

                {/* mid left tower */}
                <path d="M6.15 1.55 L6.9 2.45 L7.65 1.55 L7.35 2.9 L7.35 5.55 L6.45 5.55 L6.45 2.9 Z" />
                <rect x="6.05" y="5.55" width="1.6" height="0.82" />

                {/* mid right tower */}
                <path d="M11.95 1.55 L12.7 2.45 L13.45 1.55 L13.15 2.9 L13.15 5.55 L12.25 5.55 L12.25 2.9 Z" />
                <rect x="11.85" y="5.55" width="1.6" height="0.82" />

                {/* outer left tower */}
                <path d="M3.95 2.6 L4.55 3.35 L5.15 2.6 L4.9 3.7 L4.9 5.35 L4.2 5.35 L4.2 3.7 Z" />
                <rect x="3.85" y="5.35" width="1.4" height="0.72" />

                {/* outer right tower */}
                <path d="M14.45 2.6 L15.05 3.35 L15.65 2.6 L15.4 3.7 L15.4 5.35 L14.7 5.35 L14.7 3.7 Z" />
                <rect x="14.35" y="5.35" width="1.4" height="0.72" />

                {/* lower galleries */}
                <rect x="3.5" y="6.05" width="11.8" height="0.52" />
                <rect x="2.9" y="6.65" width="13.0" height="0.48" />
            </g>
        </svg>
    ),

    VN: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#DA251D" />
            <polygon
                points="15,4.2 16.55,8.9 21.5,8.9 17.5,11.8 19.05,16.5 15,13.6 10.95,16.5 12.5,11.8 8.5,8.9 13.45,8.9"
                fill="#FFCD00"
            />
        </svg>
    ),

    KR: (
        <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="20" fill="#FFFFFF" />

            {/* Taegeuk */}
            <g transform="translate(15 10)">
                <path
                    d="M0,-4.2
                       A4.2,4.2 0 0 1 0,4.2
                       A2.1,2.1 0 0 0 0,0
                       A2.1,2.1 0 0 1 0,-4.2Z"
                    fill="#CD2E3A"
                />
                <path
                    d="M0,4.2
                       A4.2,4.2 0 0 1 0,-4.2
                       A2.1,2.1 0 0 0 0,0
                       A2.1,2.1 0 0 1 0,4.2Z"
                    fill="#0047A0"
                />
            </g>

            {/* Trigrams */}
            <g fill="#000000" transform="rotate(-35 8 5)">
                <rect x="5.2" y="3.6" width="4.2" height="0.8" rx="0.15" />
                <rect x="5.2" y="5" width="4.2" height="0.8" rx="0.15" />
                <rect x="5.2" y="6.4" width="4.2" height="0.8" rx="0.15" />
            </g>

            <g fill="#000000" transform="rotate(35 22 5)">
                <rect x="20.6" y="3.6" width="1.8" height="0.8" rx="0.15" />
                <rect x="22.8" y="3.6" width="1.8" height="0.8" rx="0.15" />
                <rect x="20.6" y="5" width="1.8" height="0.8" rx="0.15" />
                <rect x="22.8" y="5" width="1.8" height="0.8" rx="0.15" />
                <rect x="20.6" y="6.4" width="1.8" height="0.8" rx="0.15" />
                <rect x="22.8" y="6.4" width="1.8" height="0.8" rx="0.15" />
            </g>

            <g fill="#000000" transform="rotate(35 8 15)">
                <rect x="5.2" y="13.6" width="4.2" height="0.8" rx="0.15" />
                <rect x="5.2" y="15" width="1.8" height="0.8" rx="0.15" />
                <rect x="7.6" y="15" width="1.8" height="0.8" rx="0.15" />
                <rect x="5.2" y="16.4" width="4.2" height="0.8" rx="0.15" />
            </g>

            <g fill="#000000" transform="rotate(-35 22 15)">
                <rect x="20.6" y="13.6" width="1.8" height="0.8" rx="0.15" />
                <rect x="22.8" y="13.6" width="1.8" height="0.8" rx="0.15" />
                <rect x="20.6" y="15" width="4.2" height="0.8" rx="0.15" />
                <rect x="20.6" y="16.4" width="1.8" height="0.8" rx="0.15" />
                <rect x="22.8" y="16.4" width="1.8" height="0.8" rx="0.15" />
            </g>
        </svg>
    ),
};

function FlagIcon({ code, size = 28 }) {
    const svg = FLAG_SVGS[code];
    const h = Math.round(size * (20/30));
    return (
        <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:size,height:h,borderRadius:4,overflow:'hidden',boxShadow:'0 0 0 1px rgba(0,0,0,0.18)',flexShrink:0}}>
            {svg || <span style={{fontSize:12,background:'#eee',width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>{code}</span>}
        </span>
    );
}

/* ─── useTheme ─── */
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

/* ─── useCompactGrid ─── */
function useCompactGrid() {
    const [compact, setCompact] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.innerWidth <= 1024;
    });

    useEffect(() => {
        const onResize = () => setCompact(window.innerWidth <= 1024);
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return compact;
}

/* ─── AnimatedCount ─── */
function AnimatedCount({ target, duration = 1400 }) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || target === 0) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
        }, { threshold: 0.5 });
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, [target]);

    useEffect(() => {
        if (!started || target === 0) return;
        let t0 = null;
        const frame = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / duration, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(e * target));
            if (p < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }, [started, target, duration]);

    return (
        <span ref={ref} style={{
            display:'inline-block',
            animation: started && target > 0 ? 'countPop 0.45s ease both' : 'none',
        }}>{count}</span>
    );
}

/* ─── useInView ─── */
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

/* ════════════════════════════════════════════ MAIN ════════════════════════════════════════════ */
export default function Welcome({ offices = [] }) {
    const [dark, setDark] = useTheme();
    const isCompactGrid = useCompactGrid();

    const total = offices.reduce((s, o) => s + (o.open_job_postings_count || 0), 0);
    const hiring = offices.filter(o => o.open_job_postings_count > 0);
    const notHiring = offices.filter(o => !o.open_job_postings_count);

    const orderedOffices = [...hiring, ...notHiring];

    const topRow = isCompactGrid
        ? orderedOffices.slice(0, 2)
        : orderedOffices.slice(0, 3);

    const bottomRow = isCompactGrid
        ? orderedOffices.slice(2, 5)
        : orderedOffices.slice(3, 5);

    return (
        <>
        <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
:root{
  --bg:#f5f7f2;--bg2:#eaede4;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.13);
  --text:#111a0d;--text2:#455240;--text3:#8a9882;
  --green:#2e7d3a;--green2:#4aaa58;--gsoft:rgba(46,125,58,0.13);--gxsoft:rgba(46,125,58,0.06);
  --gtxt:#1f5e28;--navbg:rgba(245,247,242,0.9);
  --shadowlg:0 20px 60px rgba(0,0,0,0.12);
}
[data-theme=dark]{
  --bg:#0b0f09;--bg2:#111609;--border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.14);
  --text:#e2e9d8;--text2:#8da882;--text3:#4e6045;
  --green:#4aaa58;--green2:#6fcb7d;--gsoft:rgba(74,170,88,0.15);--gxsoft:rgba(74,170,88,0.06);
  --gtxt:#7ecb8a;--navbg:rgba(11,15,9,0.9);
  --shadowlg:0 20px 60px rgba(0,0,0,0.55);
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;overflow-x:hidden;transition:background 0.3s,color 0.3s;}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;background:var(--navbg);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);transition:background 0.3s;}
.nav-logo{display:flex;align-items:center;gap:8px;text-decoration:none;}
.nav-logo img{width:40px;height:40px;object-fit:contain;}
.nav-logo-txt{font-family:'DM Serif Display',serif;font-size:16px;color:var(--text);}
.nav-logo-txt b{color:var(--green);font-weight:400;}
.nav-mid{display:flex;gap:4px;}
.nlnk{font-size:13px;color:var(--text2);text-decoration:none;padding:5px 12px;border-radius:7px;transition:all 0.18s;}
.nlnk:hover{background:var(--gsoft);color:var(--gtxt);}
.nav-r{display:flex;align-items:center;gap:10px;}
.thm{width:32px;height:32px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:14px;transition:all 0.2s;}
.thm:hover{background:var(--gsoft);border-color:var(--green);}
.cta{font-size:13px;font-weight:500;color:#fff;background:var(--green);padding:6px 16px;border-radius:8px;text-decoration:none;transition:all 0.18s;}
.cta:hover{background:var(--green2);transform:translateY(-1px);}

/* HERO */
.hero{padding:78px 48px 0;max-width:1280px;margin:0 auto;}
.h-inner{display:grid;grid-template-columns:1fr 1fr;align-items:start;border-bottom:1px solid var(--border);padding-bottom:44px;}
.h-left{padding-right:52px;padding-top:14px;}
.eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:500;letter-spacing:0.11em;text-transform:uppercase;color:var(--gtxt);background:var(--gsoft);border:1px solid rgba(46,125,58,0.25);padding:4px 12px;border-radius:100px;margin-bottom:18px;opacity:0;animation:fu 0.5s ease 0.05s forwards;}
.edot{width:5px;height:5px;border-radius:50%;background:var(--green);flex-shrink:0;animation:glow 2s infinite;}
@keyframes glow{0%,100%{opacity:1}50%{opacity:0.5}}
h1.ht{font-family:'DM Serif Display',serif;font-size:clamp(30px,3.4vw,48px);line-height:1.07;letter-spacing:-0.025em;color:var(--text);margin-bottom:12px;opacity:0;animation:fu 0.6s ease 0.1s forwards;}
h1.ht em{font-style:italic;color:var(--green);}
.hsub{font-size:13px;color:var(--text3);line-height:1.75;max-width:360px;margin-bottom:24px;opacity:0;animation:fu 0.6s ease 0.15s forwards;}
.hstats{display:flex;gap:26px;align-items:center;opacity:0;animation:fu 0.6s ease 0.2s forwards;}
.sv{font-family:'DM Serif Display',serif;font-size:26px;color:var(--text);letter-spacing:-0.03em;line-height:1;}
.sv.g{color:var(--green);}
.sl{font-size:11px;color:var(--text3);margin-top:2px;}
.sdv{width:1px;height:26px;background:var(--border2);}

/* HERO RIGHT */
.h-right{border-left:1px solid var(--border);padding-left:44px;padding-top:14px;opacity:0;animation:fu 0.6s ease 0.22s forwards;}
.hlbl{font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text3);margin-bottom:13px;}
.hlist{display:flex;flex-direction:column;gap:6px;}
.hrow{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:11px;text-decoration:none;transition:all 0.2s;border:1px solid transparent;}
.hrow.on{background:var(--gxsoft);border-color:var(--gsoft);}
.hrow.on:hover{background:var(--gsoft);border-color:var(--green);transform:translateX(3px);}
.hrow.off{opacity:0.4;}
.hrow.off:hover{opacity:0.65;background:var(--bg2);border-color:var(--border);}
.hri{flex:1;}
.hrn{font-size:13px;font-weight:500;color:var(--text);}
.hrc{font-size:11px;color:var(--text3);margin-top:1px;}
.hbadge{font-size:11px;font-weight:600;color:var(--gtxt);background:var(--gsoft);border:1px solid rgba(46,125,58,0.28);padding:3px 9px;border-radius:100px;white-space:nowrap;}
.hnone{font-size:10px;color:var(--text3);}

/* SECTION */
.sec{max-width:1280px;margin:0 auto;padding:44px 48px 72px;}
.sechd{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}
.seceye{font-size:11px;font-weight:500;letter-spacing:0.11em;text-transform:uppercase;color:var(--text3);margin-bottom:5px;}
.sectit{font-family:'DM Serif Display',serif;font-size:26px;color:var(--text);letter-spacing:-0.02em;}
.lbadge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--gtxt);background:var(--gxsoft);border:1px solid var(--gsoft);padding:5px 13px;border-radius:100px;}
.ldot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:glow 2s infinite;}

/* GRID */
.og{display:flex;flex-direction:column;gap:16px;}
.ogr{display:flex;gap:16px;}
.ogr.r3{justify-content:flex-start;}
.ogr.r2{justify-content:center;}

.ogr.r3 .ocard{flex:1;min-width:0;}
.ogr.r2 .ocard{flex:0 0 calc(33.333% - 10.67px);min-width:0;}

/* compact 2 / 2 / 1 */
.ogr.compact{flex-wrap:wrap;}
.ogr.compact .ocard{
  flex:0 0 calc(50% - 8px);
  min-width:0;
}
.ogr.compact .ocard.last{
  flex:0 0 calc(50% - 8px);
  margin-left:auto;
  margin-right:auto;
}

/* CARD */
.ocard{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:#111;text-decoration:none;display:block;aspect-ratio:4/3;transition:transform 0.35s cubic-bezier(0.23,1,0.32,1),box-shadow 0.35s,border-color 0.2s;opacity:0;transform:translateY(16px);}
.ocard.vis{animation:cin 0.5s ease forwards;}
@keyframes cin{to{opacity:1;transform:translateY(0)}}
.ocard:hover{transform:translateY(-5px) !important;box-shadow:var(--shadowlg);}
.ocard.hi:hover{border-color:var(--green);box-shadow:0 20px 60px rgba(46,125,58,0.18);}
.cimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.5s cubic-bezier(0.23,1,0.32,1),filter 0.3s;}
[data-theme=dark] .cimg{filter:brightness(0.45) saturate(0.6);}
[data-theme=light] .cimg{filter:brightness(0.58) saturate(0.72);}
.ocard:hover .cimg{transform:scale(1.05);}
.cov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.87) 0%,rgba(0,0,0,0.22) 55%,transparent 100%);}
.ocard.hi .cov{background:linear-gradient(to top,rgba(5,25,8,0.93) 0%,rgba(8,32,10,0.3) 55%,transparent 100%);}
.cflag{position:absolute;top:11px;left:11px;border-radius:5px;overflow:hidden;}
.chip{position:absolute;top:11px;right:11px;display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#fff;background:var(--green);padding:4px 10px;border-radius:100px;box-shadow:0 2px 12px rgba(46,125,58,0.45);}
.cring{width:6px;height:6px;border-radius:50%;background:#fff;position:relative;flex-shrink:0;}
.cring::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.7);animation:ring 1.8s ease-out infinite;}
@keyframes ring{0%{transform:scale(1);opacity:0.8}100%{transform:scale(3);opacity:0}}
.cbody{position:absolute;bottom:0;left:0;right:0;padding:14px;}
.cname{font-family:'DM Serif Display',serif;font-size:16px;color:#fff;margin-bottom:2px;letter-spacing:-0.01em;line-height:1.15;}
.ccity{font-size:11px;color:rgba(255,255,255,0.42);margin-bottom:8px;}
.cft{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.cspec{font-size:10px;color:rgba(255,255,255,0.28);line-height:1.5;max-width:58%;}
.topen{font-size:11px;font-weight:600;white-space:nowrap;color:#fff;background:var(--green);padding:3px 10px;border-radius:100px;}
.tnone{font-size:10px;white-space:nowrap;color:rgba(255,255,255,0.25);background:rgba(255,255,255,0.05);padding:3px 9px;border-radius:100px;border:1px solid rgba(255,255,255,0.07);}

/* FOOTER */
footer{padding:22px 48px;text-align:center;}
.fcopy{font-size:12px;color:var(--text3);}

/* ANIMATIONS */
@keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes countPop{0%{transform:scale(1.7);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}

/* RESPONSIVE */
@media(max-width:1024px){
  .nav{padding:0 24px;}
  .hero{padding:70px 24px 0;}
  .h-inner{grid-template-columns:1fr;}
  .h-left{padding-right:0;}
  .h-right{border-left:none;border-top:1px solid var(--border);padding-left:0;padding-top:22px;}
  .sec{padding:32px 24px 56px;}
  footer{padding:18px 24px;}
}

@media(max-width:640px){
  .nav-mid{display:none;}
  .hstats{gap:14px;}
  .sv{font-size:22px;}
  .sechd{flex-direction:column;align-items:flex-start;gap:10px;}
}
        `}</style>

        <nav className="nav">
            <Link href="/" className="nav-logo">
                <img src="/images/main-logo.svg" alt="VibeMe.AI"/>
                <span className="nav-logo-txt">VibeMe<b>.AI</b></span>
            </Link>
            
            <div className="nav-r">
                <button className="thm" onClick={()=>setDark(d=>!d)} aria-label="Toggle theme">
                    {dark ? "☀" : "☽"}
                </button>
                {total > 0 && (
                    <a href="#offices" className="cta">View {total} Openings</a>
                )}
            </div>
        </nav>

        <div className="hero">
            <div className="h-inner">
                <div className="h-left">
                    <div className="eyebrow"><span className="edot"/>Brycen Group · Asia Pacific</div>
                    <h1 className="ht">Where talent meets<br/><em>opportunity in Asia.</em></h1>
                    <p className="hsub">5 offices across Asia. One standard of excellence. Find your next role with a Japan-quality engineering group.</p>
                    <div className="hstats">
                        <div><div className="sv">5</div><div className="sl">Countries</div></div>
                        <div className="sdv"/>
                        <div><div className="sv">30+</div><div className="sl">Years</div></div>
                        <div className="sdv"/>
                        <div>
                            <div className={`sv${total>0?" g":""}`}><AnimatedCount target={total}/></div>
                            <div className="sl">Hiring Now</div>
                        </div>
                    </div>
                </div>

                <div className="h-right">
                    <div className="hlbl">{total > 0 ? "🟢  Currently Hiring" : "Our Offices"}</div>
                    <div className="hlist">
                        {hiring.map(o => (
                            <Link key={o.id} href={`/brycen/${o.country_key}`} className="hrow on">
                                <FlagIcon code={FLAGS[o.country_key]} size={28}/>
                                <div className="hri"><div className="hrn">{o.company_name}</div><div className="hrc">{o.city}, {o.country_name}</div></div>
                                <span className="hbadge">{o.open_job_postings_count} positions open</span>
                            </Link>
                        ))}
                        {notHiring.map(o => (
                            <Link key={o.id} href={`/brycen/${o.country_key}`} className="hrow off">
                                <FlagIcon code={FLAGS[o.country_key]} size={28}/>
                                <div className="hri"><div className="hrn">{o.company_name}</div><div className="hrc">{o.city}, {o.country_name}</div></div>
                                <span className="hnone">Not hiring now</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <section className="sec" id="offices">
            <div className="sechd">
                <div><div className="seceye">Our Offices</div><div className="sectit">Where We Operate</div></div>
                {total > 0 && <div className="lbadge"><span className="ldot"/>{total} positions open now</div>}
            </div>

            <div className="og">
                <div className={`ogr ${isCompactGrid ? "compact" : "r3"}`}>
                    {topRow.map((o,i)=><OfficeCard key={o.id} office={o} delay={i*0.07}/>)}
                    {isCompactGrid && bottomRow.map((o,i)=>(
                        <OfficeCard
                            key={o.id}
                            office={o}
                            delay={(i+2)*0.07}
                            extraClass={i === bottomRow.length - 1 ? "last" : ""}
                        />
                    ))}
                </div>

                {!isCompactGrid && bottomRow.length > 0 && (
                    <div className="ogr r2">
                        {bottomRow.map((o,i)=><OfficeCard key={o.id} office={o} delay={(i+3)*0.07}/>)}
                    </div>
                )}
            </div>
        </section>

        <footer>
            <span className="fcopy">© {new Date().getFullYear()} Brycen Group · Powered by VibeMe.AI</span>
        </footer>
        </>
    );
}

function OfficeCard({ office, delay, extraClass = "" }) {
    const [ref, visible] = useInView(0.1);
    const hasJobs = office.open_job_postings_count > 0;

    return (
        <Link
            ref={ref}
            href={`/brycen/${office.country_key}`}
            className={`ocard${hasJobs?" hi":""}${visible?" vis":""}${extraClass ? ` ${extraClass}` : ""}`}
            style={{animationDelay:`${delay}s`}}
        >
            {office.image_path && (
                <img src={office.image_path} alt={office.company_name} className="cimg"
                    onError={e=>{e.target.style.display="none";}}/>
            )}
            <div className="cov"/>
            <div className="cflag"><FlagIcon code={FLAGS[office.country_key]} size={32}/></div>
            {hasJobs && (
                <div className="chip"><span className="cring"/>Hiring</div>
            )}
            <div className="cbody">
                <div className="cname">{office.company_name}</div>
                <div className="ccity">{office.city}, {office.country_name}</div>
                <div className="cft">
                   
                    {hasJobs
                        ? <span className="topen">{office.open_job_postings_count} positions</span>
                        : <span className="tnone">Not hiring now</span>
                    }
                </div>
            </div>
        </Link>
    );
}