import { useEffect, useMemo, useState } from "react";
import { Link, useForm } from "@inertiajs/react";

const JOB_TYPE_LABELS = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    internship: "Internship",
};

function BulletList({ text }) {
    if (!text) return null;
    const items = text.split("\n").map(l => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    if (!items.length) return null;
    return (
        <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
            {items.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--text2)", lineHeight: 1.75 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", flexShrink: 0, marginTop: 8 }} />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function useTheme() {
    const [dark, setDark] = useState(() => {
        if (typeof window === "undefined") return false;
        const saved = localStorage.getItem("brycen-theme") || localStorage.getItem("vibeme-theme");
        return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    });
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        localStorage.setItem("brycen-theme", dark ? "dark" : "light");
        localStorage.setItem("vibeme-theme", dark ? "dark" : "light");
    }, [dark]);
    return [dark, setDark];
}

export default function Country({ office, jobs = [] }) {
    const [dark, setDark] = useTheme();
    const [selectedJob, setSelectedJob] = useState(null);
    const [applyOpen, setApplyOpen] = useState(false);
    const [applyJob, setApplyJob] = useState(null);
    const [refCode, setRefCode] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "", email: "", phone: "", cover_letter: "", cv: null,
    });

    const handleApply = (job) => {
        setApplyJob(job); setApplyOpen(true); setRefCode(null); reset();
    };

    const submitApply = (e) => {
        e.preventDefault();
        post(`/brycen/${office.country_key}/jobs/${applyJob.id}/apply`, {
            forceFormData: true,
            onSuccess: (page) => {
                const code = page.props.flash?.reference_code;
                setRefCode(code || "SUCCESS");
                reset();
            },
        });
    };

    return (
        <>
        <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

*,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior: smooth; }

/* ── LIGHT ── */
:root {
    --bg:        #f5f5f7;
    --bg2:       #ffffff;
    --bg3:       #f0f0f3;
    --line:      rgba(0,0,0,0.08);
    --line2:     rgba(0,0,0,0.14);
    --text:      #1d1d1f;
    --text2:     #6e6e73;
    --text3:     #a1a1a6;
    --acc:       #0071e3;
    --acc-soft:  rgba(0,113,227,0.08);
    --acc-txt:   #0071e3;
    --green:     #1d8348;
    --green-bg:  rgba(29,131,72,0.08);
    --green-bg2: rgba(29,131,72,0.14);
    --green-txt: #1d8348;
    --nav-bg:    rgba(245,245,247,0.88);
    --card-bg:   #ffffff;
    --card-sh:   0 2px 20px rgba(0,0,0,0.07);
    --card-sh2:  0 8px 40px rgba(0,0,0,0.11);
}

/* ── DARK ── */
[data-theme=dark] {
    --bg:        #0a0e1a;
    --bg2:       #111827;
    --bg3:       #1a2236;
    --line:      rgba(255,255,255,0.07);
    --line2:     rgba(255,255,255,0.12);
    --text:      #e8eaf0;
    --text2:     #8892a4;
    --text3:     #4a5568;
    --acc:       #4f8ef7;
    --acc-soft:  rgba(79,142,247,0.12);
    --acc-txt:   #7aabff;
    --green:     #34d399;
    --green-bg:  rgba(52,211,153,0.10);
    --green-bg2: rgba(52,211,153,0.16);
    --green-txt: #34d399;
    --nav-bg:    rgba(10,14,26,0.90);
    --card-bg:   #111827;
    --card-sh:   0 2px 20px rgba(0,0,0,0.4);
    --card-sh2:  0 8px 40px rgba(0,0,0,0.5);
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    transition: background 0.3s, color 0.3s;
}

a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }

/* ── NAV (matches Welcome.jsx exactly) ── */
.nav {
    position: sticky; top: 0; left: 0; right: 0; z-index: 100;
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
.nav-back {
    font-size:13px; font-weight:500; color:var(--text2);
    background:none; border:none; cursor:pointer; font-family:inherit;
    padding:0 12px; height:32px; border-radius:8px;
    transition:all 0.15s; display:inline-flex; align-items:center; gap:5px;
    text-decoration:none;
}
.nav-back:hover { color:var(--text); background:var(--bg3); }
.nav-link {
    font-size:13px; font-weight:500; color:var(--text2);
    background:none; border:1px solid var(--line2); cursor:pointer; font-family:inherit;
    padding:0 14px; height:32px; border-radius:8px;
    transition:all 0.15s; display:inline-flex; align-items:center;
    text-decoration:none; letter-spacing:-0.1px;
}
.nav-link:hover { color:var(--text); background:var(--bg3); }
.theme-toggle {
    display:inline-flex; align-items:center; gap:6px;
    height:32px; padding:0 12px; border-radius:8px;
    border:none; background:transparent;
    color:var(--text2); font-size:12px; font-weight:500;
    cursor:pointer; transition:all 0.18s; font-family:inherit;
}
.theme-toggle:hover { background:var(--bg3); color:var(--text); }

/* ── HERO ── */
.hero {
    position: relative;
    height: 420px;
    overflow: hidden;
    border-bottom: 1px solid var(--line);
}
.hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 8s ease;
}
[data-theme=light] .hero-img { filter: brightness(0.58) saturate(0.72); }
[data-theme=dark]  .hero-img { filter: brightness(0.35) saturate(0.5); }
.hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, transparent 100%);
}
[data-theme=dark] .hero-overlay {
    background: linear-gradient(to top, rgba(10,14,26,0.95) 0%, rgba(10,14,26,0.4) 55%, transparent 100%);
}
.hero-body {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 0 40px 36px;
    max-width: 1100px; margin: 0 auto;
}
.hero-title {
    font-size: clamp(32px, 4.5vw, 52px);
    font-weight: 700; letter-spacing: -0.04em;
    color: #fff; line-height: 1.05;
    margin-bottom: 6px;
}
.hero-city {
    font-size: 14px; color: rgba(255,255,255,0.55);
    margin-bottom: 20px; font-weight: 400;
}
.hero-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.hero-btn {
    display:inline-flex; align-items:center; gap:6px;
    height:36px; padding:0 18px; border-radius:8px;
    background:var(--green); color:#fff;
    font-size:12px; font-weight:700; font-family:inherit;
    border:none; cursor:pointer; transition:all 0.18s;
    text-decoration:none; letter-spacing:-0.1px;
    box-shadow: 0 4px 16px rgba(29,131,72,0.35);
}
.hero-btn:hover { opacity:0.88; transform:translateY(-1px); }
.hero-btn-sec {
    display:inline-flex; align-items:center; gap:6px;
    height:36px; padding:0 18px; border-radius:8px;
    background:rgba(255,255,255,0.14);
    border:1px solid rgba(255,255,255,0.22);
    color:#fff; font-size:12px; font-weight:600;
    font-family:inherit; cursor:pointer; transition:all 0.18s;
    text-decoration:none; backdrop-filter:blur(8px);
}
.hero-btn-sec:hover { background:rgba(255,255,255,0.22); }

/* ── CONTENT ── */
.content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 36px 40px 100px;
}
.content-grid {
    display: grid;
    grid-template-columns: minmax(0,1fr) 340px;
    gap: 24px;
    align-items: start;
}

/* ── CARDS ── */
.card {
    background: var(--card-bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 22px;
    box-shadow: var(--card-sh);
    margin-bottom: 16px;
}
.card-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--text3); margin-bottom: 12px;
}
.about-text { font-size: 14px; line-height: 1.85; color: var(--text2); }
.meta-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-top: 18px; padding-top: 16px;
    border-top: 1px solid var(--line);
}
.meta-key {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--text3); margin-bottom: 4px;
}
.meta-val {
    font-size: 22px; font-weight: 700;
    color: var(--text); letter-spacing: -0.03em;
}
.meta-val-sm { font-size: 13px; color: var(--text2); line-height: 1.65; }

/* ── CONTACT ── */
.contact-row {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 11px 0; border-bottom: 1px solid var(--line);
    font-size: 13px;
}
.contact-row:last-child { border-bottom: none; }
.contact-icon { width: 18px; text-align: center; flex-shrink: 0; color: var(--text3); font-size: 13px; margin-top: 1px; }
.contact-val { color: var(--text2); line-height: 1.6; word-break: break-word; }
.contact-link { color: var(--text2); transition: color 0.15s; }
.contact-link:hover { color: var(--green-txt); }

/* ── MAP ── */
.map-wrap {
    border-radius: 14px; overflow: hidden;
    border: 1px solid var(--line); margin-top: 0;
    box-shadow: var(--card-sh);
}
.map-iframe { width: 100%; height: 220px; border: none; display: block; }

/* ── JOBS ── */
.jobs-head {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
    margin-bottom: 16px; flex-wrap: wrap;
}
.jobs-title { font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -0.03em; }
.jobs-badge {
    font-size: 11px; font-weight: 700;
    color: var(--green-txt); background: var(--green-bg);
    border: 1px solid var(--green-bg2);
    padding: 4px 12px; border-radius: 100px;
}

.job-card {
    background: var(--card-bg);
    border: 1px solid var(--line);
    border-radius: 14px; padding: 18px;
    margin-bottom: 10px; cursor: pointer;
    transition: all 0.22s cubic-bezier(0.23,1,0.32,1);
    box-shadow: var(--card-sh);
}
.job-card:hover { transform: translateY(-2px); box-shadow: var(--card-sh2); border-color: var(--line2); }
.job-card.active { border-color: var(--green); background: color-mix(in srgb, var(--card-bg) 90%, var(--green-bg)); }
[data-theme=dark] .job-card.active { background: color-mix(in srgb, var(--card-bg) 85%, rgba(52,211,153,0.05)); }

.job-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.job-title { font-size:18px; font-weight:700; color:var(--text); letter-spacing:-0.02em; margin-bottom:3px; }
.job-dept { font-size:11px; color:var(--text3); }
.job-pills { display:flex; gap:7px; flex-wrap:wrap; margin-top:12px; }
.pill {
    padding: 4px 10px; border-radius: 100px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.03em;
}
.pill-type   { background:rgba(99,102,241,0.09); border:1px solid rgba(99,102,241,0.16); color:#7b82ff; }
.pill-slots  { background:var(--green-bg); border:1px solid var(--green-bg2); color:var(--green-txt); }
.pill-salary { background:rgba(245,158,11,0.09); border:1px solid rgba(245,158,11,0.16); color:#c88918; }

.job-deadline {
    display:inline-flex; align-items:center; gap:6px;
    margin-top:10px; font-size:11px; color:var(--text3);
}
.deadline-dot { width:5px; height:5px; border-radius:50%; background:#ef4444; flex-shrink:0; }

.apply-btn {
    display:inline-flex; align-items:center;
    height:32px; padding:0 14px; border-radius:8px;
    background:var(--green-bg); border:1px solid var(--green-bg2);
    color:var(--green-txt); font-size:11px; font-weight:700;
    font-family:inherit; cursor:pointer; white-space:nowrap;
    transition:all 0.18s; flex-shrink:0;
}
.apply-btn:hover { background:var(--green); border-color:var(--green); color:#fff; }

.job-expand {
    border-top: 1px solid var(--line);
    margin-top: 16px; padding-top: 16px;
    animation: expandIn 0.2s ease;
}
@keyframes expandIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

.expand-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--text3); margin-bottom: 8px; margin-top: 14px;
}
.expand-label:first-child { margin-top: 0; }

.apply-full-btn {
    width: 100%; margin-top: 18px;
    height: 40px; border-radius: 10px;
    background: var(--green-bg); border: 1px solid var(--green-bg2);
    color: var(--green-txt); font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer; transition: all 0.18s;
}
.apply-full-btn:hover { background:var(--green); border-color:var(--green); color:#fff; }

/* ── NO JOBS ── */
.no-jobs {
    background: var(--card-bg); border: 1px solid var(--line);
    border-radius: 16px; padding: 48px 32px;
    text-align: center; box-shadow: var(--card-sh);
}
.no-jobs-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: var(--bg3); border: 1px solid var(--line2);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin: 0 auto 16px;
}
.no-jobs-title { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -0.02em; }
.no-jobs-sub { font-size: 13px; color: var(--text2); line-height: 1.75; max-width: 340px; margin: 0 auto 20px; }

/* ── MODAL ── */
.modal-bg {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: bgIn 0.2s ease;
}
@keyframes bgIn { from{opacity:0} to{opacity:1} }
.modal {
    width: 100%; max-width: 580px;
    max-height: 90vh; overflow-y: auto;
    background: var(--card-bg);
    border: 1px solid var(--line2);
    border-radius: 20px; padding: 28px;
    box-shadow: var(--card-sh2);
    animation: modalIn 0.25s cubic-bezier(0.23,1,0.32,1);
    scrollbar-width: none;
}
.modal::-webkit-scrollbar { display: none; }
@keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }

.modal-head {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 12px;
    margin-bottom: 20px; padding-bottom: 18px;
    border-bottom: 1px solid var(--line);
}
.modal-kicker {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--green-txt); background: var(--green-bg);
    border: 1px solid var(--green-bg2);
    padding: 4px 10px; border-radius: 100px;
    margin-bottom: 10px;
}
.kicker-dot { width:5px; height:5px; border-radius:50%; background:var(--green); animation:kpulse 2s infinite; }
@keyframes kpulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
.modal-title { font-size: 24px; font-weight: 700; color: var(--text); letter-spacing: -0.03em; margin-bottom: 4px; }
.modal-sub { font-size: 12px; color: var(--text2); }
.modal-close {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--bg3); border: 1px solid var(--line2);
    color: var(--text2); font-size: 16px;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-family: inherit;
    transition: all 0.15s; flex-shrink: 0;
}
.modal-close:hover { color: var(--text); background: var(--bg); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 0; }
.form-group.full { grid-column: 1/-1; }
.form-label {
    display: block; margin-bottom: 7px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: var(--text3);
}
.form-input {
    width: 100%; padding: 11px 14px; border-radius: 10px;
    background: var(--bg3); border: 1px solid var(--line2);
    color: var(--text); font-size: 13px; font-family: inherit;
    outline: none; transition: all 0.18s;
}
.form-input:focus { border-color: var(--acc); box-shadow: 0 0 0 3px var(--acc-soft); }
.form-input.err { border-color: rgba(239,68,68,0.5); }
.form-input::placeholder { color: var(--text3); }
textarea.form-input { min-height: 96px; resize: vertical; }
.form-error { margin-top: 5px; font-size: 11px; color: #ef4444; }

.file-label {
    display: flex; align-items: center; gap: 12px;
    padding: 14px; border-radius: 12px;
    background: var(--bg3);
    border: 1.5px dashed var(--line2);
    cursor: pointer; color: var(--text2);
    transition: all 0.18s;
}
.file-label:hover { border-color: var(--green); background: var(--green-bg); }
.file-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--line); flex-shrink: 0; font-size: 15px;
}
.file-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.file-sub { font-size: 11px; color: var(--text3); }

.modal-btns { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel {
    flex: 1; height: 40px; border-radius: 10px;
    background: var(--bg3); border: 1px solid var(--line2);
    color: var(--text2); font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { color: var(--text); background: var(--bg); }
.btn-submit {
    flex: 1.4; height: 40px; border-radius: 10px;
    background: var(--green); border: none;
    color: #fff; font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 4px 16px rgba(29,131,72,0.3);
}
.btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-submit:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

/* ── SUCCESS ── */
.success-box { text-align: center; padding: 16px 8px; }
.success-icon {
    width: 56px; height: 56px; border-radius: 16px;
    background: var(--green-bg); border: 1px solid var(--green-bg2);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin: 0 auto 16px;
}
.success-title { font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; margin-bottom: 6px; }
.success-caption { font-size: 12px; color: var(--text3); margin-bottom: 4px; }
.ref-code {
    display: inline-block; padding: 10px 24px;
    border-radius: 10px; background: var(--green-bg);
    border: 1px solid var(--green-bg2); color: var(--green-txt);
    font-size: 16px; font-weight: 700; letter-spacing: 0.1em;
    margin: 12px 0 14px;
}
.success-note { font-size: 13px; color: var(--text2); line-height: 1.75; }
.done-btn {
    margin-top: 20px; width: 100%; height: 40px; border-radius: 10px;
    background: var(--green-bg); border: 1px solid var(--green-bg2);
    color: var(--green-txt); font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer; transition: all 0.18s;
}
.done-btn:hover { background: var(--green); border-color: var(--green); color: #fff; }

/* ── RESPONSIVE ── */
@media(max-width:900px) {
    .content-grid { grid-template-columns: 1fr; }
    .nav { padding: 0 20px; }
    .content { padding: 28px 20px 80px; }
    .hero-body { padding: 0 20px 28px; }
}
@media(max-width:600px) {
    .hero { height: 340px; }
    .hero-title { font-size: 30px; }
    .form-grid { grid-template-columns: 1fr; }
    .modal-btns { flex-direction: column; }
    .meta-grid { grid-template-columns: 1fr; }
    .job-top { flex-direction: column; }
    .apply-btn { width: 100%; justify-content: center; }
}
        `}</style>

        {/* ── NAV ── */}
        <nav className="nav">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Link href="/" className="nav-back">←</Link>
                <Link href="/" className="nav-logo">
                    <img src="/images/main-logo.svg" alt="VibeMe.AI"/>
                    <span className="nav-logo-name">VibeMe<span>.AI</span></span>
                </Link>
            </div>
            <div className="nav-r">
                
                <button className="theme-toggle" onClick={() => setDark(d => !d)}>
                    <span>{dark ? "☀" : "☾"}</span>
                    <span>{dark ? "Light" : "Dark"}</span>
                </button>
            </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
            {office.image_path && (
                <img src={office.image_path} alt={office.company_name} className="hero-img"
                    onError={e => e.target.style.display = "none"}/>
            )}
            <div className="hero-overlay"/>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                <div className="hero-body">
                    <h1 className="hero-title">{office.company_name}</h1>
                    <div className="hero-city">{office.city}, {office.country_name}</div>
                    <div className="hero-actions">
                      
                        {office.website_url && (
                            <a href={office.website_url} target="_blank" rel="noopener noreferrer" className="hero-btn-sec">
                                Visit Website ↗
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>

        {/* ── CONTENT ── */}
        <div className="content">
            <div className="content-grid">

                {/* LEFT */}
                <div>
                    {/* About */}
                    <div className="card">
                        <div className="card-label">Company Overview</div>
                        <div className="about-text">{office.about}</div>
                        <div className="meta-grid">
                            <div>
                                <div className="meta-key">Founded</div>
                                <div className="meta-val">{office.founded || "—"}</div>
                            </div>
                            <div>
                                <div className="meta-key">Specialization</div>
                                <div className="meta-val-sm">{office.specialization}</div>
                            </div>
                        </div>
                    </div>

                    {/* Jobs */}
                    <div id="open-jobs">
                        <div className="jobs-head">
                            <div className="jobs-title">Open Positions</div>
                            {jobs.length > 0 && (
                                <div className="jobs-badge">{jobs.length} job{jobs.length !== 1 ? "s" : ""} open</div>
                            )}
                        </div>

                        {jobs.length === 0 ? (
                            <div className="no-jobs">
                                <div className="no-jobs-icon">📋</div>
                                <div className="no-jobs-title">No open positions</div>
                                <div className="no-jobs-sub">
                                    We're not actively hiring for this office right now.
                                    Check back soon or visit the official website.
                                </div>
                                {office.website_url && (
                                    <a href={office.website_url} target="_blank" rel="noopener noreferrer"
                                        style={{ display:"inline-flex", alignItems:"center", height:36, padding:"0 18px", borderRadius:8, background:"var(--bg3)", border:"1px solid var(--line2)", color:"var(--text2)", fontSize:12, fontWeight:600, transition:"all 0.15s" }}>
                                        Visit {office.company_name} ↗
                                    </a>
                                )}
                            </div>
                        ) : jobs.map(job => (
                            <div key={job.id}
                                className={`job-card${selectedJob === job.id ? " active" : ""}`}
                                onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                            >
                                <div className="job-top">
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div className="job-title">{job.title}</div>
                                        {job.department && <div className="job-dept">{job.department}</div>}
                                        <div className="job-pills">
                                            <span className="pill pill-type">{JOB_TYPE_LABELS[job.type] || job.type}</span>
                                            <span className="pill pill-slots">{job.slots} position{job.slots > 1 ? "s" : ""}</span>
                                            {job.salary_range && (
                                                <span className="pill pill-salary">{job.currency_code ? `${job.currency_code} ` : ""}{job.salary_range}</span>
                                            )}
                                        </div>
                                        {job.deadline && (
                                            <div className="job-deadline">
                                                <span className="deadline-dot"/>
                                                Apply by {job.deadline}
                                            </div>
                                        )}
                                    </div>
                                    <button className="apply-btn" onClick={e => { e.stopPropagation(); handleApply(job); }}>
                                        Apply
                                    </button>
                                </div>

                                {selectedJob === job.id && (
                                    <div className="job-expand">
                                        {job.description && <>
                                            <div className="expand-label">Description</div>
                                            <BulletList text={job.description}/>
                                        </>}
                                        {job.requirements && <>
                                            <div className="expand-label">Requirements</div>
                                            <BulletList text={job.requirements}/>
                                        </>}
                                        {job.responsibilities && <>
                                            <div className="expand-label">Responsibilities</div>
                                            <BulletList text={job.responsibilities}/>
                                        </>}
                                        <button className="apply-full-btn" onClick={e => { e.stopPropagation(); handleApply(job); }}>
                                            Apply for this position →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT */}
                <div>
                    <div className="card">
                        <div className="card-label">Contact</div>
                        {office.address && (
                            <div className="contact-row">
                                <span className="contact-icon">📍</span>
                                <span className="contact-val">{office.address}</span>
                            </div>
                        )}
                        {office.email && (
                            <div className="contact-row">
                                <span className="contact-icon">✉</span>
                                <a href={`mailto:${office.email}`} className="contact-link">{office.email}</a>
                            </div>
                        )}
                        {office.phone && (
                            <div className="contact-row">
                                <span className="contact-icon">☎</span>
                                <span className="contact-val">{office.phone}</span>
                            </div>
                        )}
                        {office.website_url && (
                            <div className="contact-row">
                                <span className="contact-icon">🌐</span>
                                <a href={office.website_url} target="_blank" rel="noopener noreferrer" className="contact-link">
                                    {office.website_url.replace(/^https?:\/\//, "")}
                                </a>
                            </div>
                        )}
                    </div>

                    {office.map_embed_url && (
                        <div className="map-wrap">
                            <iframe src={office.map_embed_url} className="map-iframe"
                                allowFullScreen loading="lazy"
                                title={`${office.company_name} location`}/>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* ── APPLY MODAL ── */}
        {applyOpen && (
            <div className="modal-bg" onClick={() => setApplyOpen(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    {refCode ? (
                        <div className="success-box">
                            <div className="success-icon">✦</div>
                            <div className="success-title">Application Submitted</div>
                            <div className="success-caption">Your reference code</div>
                            <div className="ref-code">{refCode}</div>
                            <div className="success-note">
                                Save this code to track your application.<br/>
                                Our HR team will reach out to <strong style={{ color:"var(--text)" }}>{data.email}</strong>.
                            </div>
                            <button className="done-btn" onClick={() => setApplyOpen(false)}>Done</button>
                        </div>
                    ) : (
                        <>
                            <div className="modal-head">
                                <div style={{ minWidth:0 }}>
                                    <div className="modal-kicker">
                                        <span className="kicker-dot"/>
                                        Job Application
                                    </div>
                                    <div className="modal-title">{applyJob?.title}</div>
                                    <div className="modal-sub">{office.company_name} · {office.city}</div>
                                </div>
                                <button className="modal-close" onClick={() => setApplyOpen(false)}>×</button>
                            </div>

                            <form onSubmit={submitApply}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input className={`form-input${errors.name ? " err" : ""}`}
                                            value={data.name} onChange={e => setData("name", e.target.value)}
                                            placeholder="Your full name"/>
                                        {errors.name && <div className="form-error">{errors.name}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input type="email" className={`form-input${errors.email ? " err" : ""}`}
                                            value={data.email} onChange={e => setData("email", e.target.value)}
                                            placeholder="your@email.com"/>
                                        {errors.email && <div className="form-error">{errors.email}</div>}
                                    </div>
                                    <div className="form-group full">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" value={data.phone}
                                            onChange={e => setData("phone", e.target.value)} placeholder="+95 9..."/>
                                    </div>
                                    <div className="form-group full">
                                        <label className="form-label">Cover Letter</label>
                                        <textarea className="form-input" rows={4} value={data.cover_letter}
                                            onChange={e => setData("cover_letter", e.target.value)}
                                            placeholder="Tell us why you're a great fit..."/>
                                    </div>
                                    <div className="form-group full">
                                        <label className="form-label">CV / Resume * — PDF, DOC, DOCX · max 5MB</label>
                                        <label className="file-label">
                                            <span className="file-icon">📎</span>
                                            <span>
                                                <div className="file-title">{data.cv ? data.cv.name : "Upload your CV"}</div>
                                                <div className="file-sub">{data.cv ? "File selected" : "Click to browse from your device"}</div>
                                            </span>
                                            <input type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }}
                                                onChange={e => setData("cv", e.target.files[0])}/>
                                        </label>
                                        {errors.cv && <div className="form-error">{errors.cv}</div>}
                                    </div>
                                </div>
                                <div className="modal-btns">
                                    <button type="button" className="btn-cancel" onClick={() => setApplyOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit" disabled={processing}>
                                        {processing ? "Applying..." : "Apply Application →"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        )}
        </>
    );
}