import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";

const STATUS_CONFIG = {
    new:       { label:"Received",        color:"#6366f1", bg:"rgba(99,102,241,0.08)",  border:"rgba(99,102,241,0.18)",  icon:"📬", desc:"Your application has been received and is in the queue." },
    reviewing: { label:"Under Review",    color:"#d97706", bg:"rgba(217,119,6,0.08)",   border:"rgba(217,119,6,0.18)",   icon:"🔍", desc:"Our HR team is currently reviewing your profile." },
    interview: { label:"Interview Stage", color:"#0891b2", bg:"rgba(8,145,178,0.08)",   border:"rgba(8,145,178,0.18)",   icon:"🗓️", desc:"You've been invited for an interview. Check your email for details." },
    accepted:  { label:"Selected",        color:"#059669", bg:"rgba(5,150,105,0.08)",   border:"rgba(5,150,105,0.18)",   icon:"🎉", desc:"Congratulations! You've been selected for this position." },
    rejected:  { label:"Not Proceeding",  color:"#6b7280", bg:"rgba(107,114,128,0.08)", border:"rgba(107,114,128,0.16)", icon:"📋", desc:"We've decided to move forward with other candidates at this time." },
};

const STEPS = ["new", "reviewing", "interview", "accepted"];

const PLATFORM_LABELS = {
    zoom: "Zoom", google_meet: "Google Meet",
    teams: "Microsoft Teams", physical: "In Person", other: "Other",
};

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

export default function Track({ application, interview }) {
    const [dark, setDark] = useTheme();
    const sc = STATUS_CONFIG[application.status] || STATUS_CONFIG.new;
    const stepIdx = STEPS.indexOf(application.status);
    const isRejected = application.status === "rejected";

    return (
        <>
        <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

*,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior: smooth; }

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
    --green:     #1d8348;
    --green-bg:  rgba(29,131,72,0.08);
    --green-bg2: rgba(29,131,72,0.14);
    --green-txt: #1d8348;
    --nav-bg:    rgba(245,245,247,0.88);
    --card-bg:   #ffffff;
    --card-sh:   0 2px 20px rgba(0,0,0,0.07);
}
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
    --green:     #34d399;
    --green-bg:  rgba(52,211,153,0.10);
    --green-bg2: rgba(52,211,153,0.16);
    --green-txt: #34d399;
    --nav-bg:    rgba(10,14,26,0.90);
    --card-bg:   #111827;
    --card-sh:   0 2px 20px rgba(0,0,0,0.4);
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    transition: background 0.3s, color 0.3s;
}
a { color: inherit; text-decoration: none; }

/* NAV */
.nav {
    position: sticky; top: 0; z-index: 100;
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
    background:none; border:1px solid var(--line2);
    padding:0 14px; height:32px; border-radius:8px;
    transition:all 0.15s; display:inline-flex; align-items:center; gap:5px;
    text-decoration:none; letter-spacing:-0.1px;
}
.nav-back:hover { color:var(--text); background:var(--bg3); }
.theme-toggle {
    display:inline-flex; align-items:center; gap:6px;
    height:32px; padding:0 12px; border-radius:8px;
    border:1px solid var(--line2); background:transparent;
    color:var(--text2); font-size:12px; font-weight:500;
    cursor:pointer; transition:all 0.18s; font-family:inherit;
}
.theme-toggle:hover { background:var(--bg3); color:var(--text); }

/* PAGE */
.page { max-width: 620px; margin: 0 auto; padding: 36px 24px 80px; }

/* STATUS HERO */
.status-hero {
    background: var(--card-bg);
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 14px;
    box-shadow: var(--card-sh);
    animation: fadeUp 0.4s ease 0.05s both;
}
.status-band { height: 4px; }
.status-body { padding: 24px; }
.status-icon {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 14px;
}
.status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
    margin-bottom: 8px; border: 1px solid transparent;
}
.status-badge-dot { width:5px; height:5px; border-radius:50%; }
.status-title { font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.03em; margin-bottom: 6px; }
.status-desc { font-size: 13px; color: var(--text2); line-height: 1.7; }

/* PROGRESS */
.card {
    background: var(--card-bg);
    border: 1px solid var(--line);
    border-radius: 16px; padding: 22px;
    margin-bottom: 14px;
    box-shadow: var(--card-sh);
}
.card-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--text3); margin-bottom: 18px;
}
.steps-row { display:flex; align-items:flex-start; gap:0; }
.step-item { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; }
.step-connector {
    position: absolute; top: 15px;
    left: calc(50% + 15px); right: calc(-50% + 15px);
    height: 2px; border-radius: 1px;
}
.step-dot {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; margin-bottom: 8px; z-index: 1;
    transition: all 0.25s;
}
.step-label {
    font-size: 10px; font-weight: 500;
    text-align: center; line-height: 1.35;
    max-width: 64px;
}

/* INTERVIEW */
.interview-card {
    background: var(--card-bg);
    border: 1px solid rgba(8,145,178,0.22);
    border-radius: 16px; padding: 22px;
    margin-bottom: 14px; box-shadow: var(--card-sh);
}
[data-theme=dark] .interview-card { border-color: rgba(8,145,178,0.28); }
.interview-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: #0891b2; margin-bottom: 14px;
    display: flex; align-items: center; gap: 7px;
}

/* INFO ROWS */
.info-row {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 11px 0; border-bottom: 1px solid var(--line);
}
.info-row:last-child { border-bottom: none; padding-bottom: 0; }
.info-icon { font-size: 14px; width: 20px; text-align: center; flex-shrink: 0; margin-top: 1px; }
.info-key { font-size: 10px; color: var(--text3); margin-bottom: 2px; font-weight: 500; }
.info-val { font-size: 13px; font-weight: 500; color: var(--text); line-height: 1.6; }
.info-link { font-size: 13px; font-weight: 500; color: var(--acc); word-break: break-all; }
.info-link:hover { opacity: 0.8; }

/* REF */
.ref-card {
    background: var(--card-bg);
    border: 1px solid var(--line);
    border-radius: 16px; padding: 18px 22px;
    box-shadow: var(--card-sh);
    display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap; gap: 12px;
    animation: fadeUp 0.4s ease 0.3s both;
}
.ref-label { font-size: 10px; color: var(--text3); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 5px; }
.ref-code {
    font-size: 15px; font-weight: 700;
    color: var(--text); letter-spacing: 0.08em;
    font-family: 'Courier New', monospace;
}
.ref-note { font-size: 11px; color: var(--text3); line-height: 1.55; text-align: right; }

/* ANIMATIONS */
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
.card { animation: fadeUp 0.4s ease both; }
.card:nth-child(1) { animation-delay: 0.08s; }
.card:nth-child(2) { animation-delay: 0.14s; }
.card:nth-child(3) { animation-delay: 0.20s; }
.interview-card { animation: fadeUp 0.4s ease 0.18s both; }

/* RESPONSIVE */
@media(max-width:600px) {
    .nav { padding: 0 20px; }
    .page { padding: 24px 16px 60px; }
    .step-label { font-size: 9px; }
    .ref-card { flex-direction: column; }
    .ref-note { text-align: left; }
}
        `}</style>

        {/* NAV */}
        <nav className="nav">
            <Link href="/" className="nav-logo">
                <img src="/images/main-logo.svg" alt="VibeMe.AI"/>
                <span className="nav-logo-name">VibeMe<span>.AI</span></span>
            </Link>
            <div className="nav-r">
                <Link href="/" className="nav-back">← Back to Jobs</Link>
                <button className="theme-toggle" onClick={() => setDark(d => !d)}>
                    <span>{dark ? "☀" : "☾"}</span>
                    <span>{dark ? "Light" : "Dark"}</span>
                </button>
            </div>
        </nav>

        <div className="page">

            {/* Status Hero */}
            <div className="status-hero">
                <div className="status-band" style={{ background: sc.color }}/>
                <div className="status-body">
                    <div className="status-icon" style={{ background: sc.bg }}>
                        {sc.icon}
                    </div>
                    <div className="status-badge" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                        <span className="status-badge-dot" style={{ background: sc.color }}/>
                        {sc.label}
                    </div>
                    <div className="status-title">{application.job_title}</div>
                    <div className="status-desc">{sc.desc}</div>
                </div>
            </div>

            {/* Progress */}
            {!isRejected && (
                <div className="card">
                    <div className="card-label">Application Progress</div>
                    <div className="steps-row">
                        {STEPS.map((step, i) => {
                            const cfg    = STATUS_CONFIG[step];
                            const done   = i <= stepIdx;
                            const active = i === stepIdx;
                            return (
                                <div key={step} className="step-item">
                                    {i < STEPS.length - 1 && (
                                        <div className="step-connector"
                                            style={{ background: done ? "var(--acc)" : "var(--line2)" }}/>
                                    )}
                                    <div className="step-dot" style={{
                                        background: done ? "var(--acc)" : "var(--bg3)",
                                        color:      done ? "#fff"       : "var(--text3)",
                                        boxShadow:  active ? `0 0 0 4px var(--acc-soft)` : "none",
                                        border:     done ? "none" : "1px solid var(--line2)",
                                    }}>
                                        {done ? "✓" : i + 1}
                                    </div>
                                    <div className="step-label" style={{
                                        color: done ? "var(--text)" : "var(--text3)",
                                        fontWeight: active ? 600 : 400,
                                    }}>
                                        {cfg.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Interview Details */}
            {interview && (
                <div className="interview-card">
                    <div className="interview-label">
                        🗓️ Interview Details
                    </div>
                    <div className="info-row">
                        <div className="info-icon">📅</div>
                        <div>
                            <div className="info-key">Date & Time</div>
                            <div className="info-val" style={{ color:"#0891b2" }}>{interview.scheduled_at}</div>
                        </div>
                    </div>
                    {interview.type && (
                        <div className="info-row">
                            <div className="info-icon">💻</div>
                            <div>
                                <div className="info-key">Format</div>
                                <div className="info-val">
                                    {interview.type === "online" ? "Online Interview" : "In-Person Interview"}
                                    {interview.platform && interview.platform !== "physical" && ` — ${PLATFORM_LABELS[interview.platform] || interview.platform}`}
                                </div>
                            </div>
                        </div>
                    )}
                    {interview.meeting_link && (
                        <div className="info-row">
                            <div className="info-icon">🔗</div>
                            <div>
                                <div className="info-key">Meeting Link</div>
                                <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="info-link">
                                    {interview.meeting_link}
                                </a>
                            </div>
                        </div>
                    )}
                    {interview.location && (
                        <div className="info-row">
                            <div className="info-icon">📍</div>
                            <div>
                                <div className="info-key">Location</div>
                                <div className="info-val">{interview.location}</div>
                            </div>
                        </div>
                    )}
                    {interview.interviewer_name && (
                        <div className="info-row">
                            <div className="info-icon">👤</div>
                            <div>
                                <div className="info-key">Interviewer</div>
                                <div className="info-val">{interview.interviewer_name}</div>
                            </div>
                        </div>
                    )}
                    {interview.note_to_candidate && (
                        <div className="info-row">
                            <div className="info-icon">📝</div>
                            <div>
                                <div className="info-key">Note from HR</div>
                                <div className="info-val" style={{ lineHeight:1.7 }}>{interview.note_to_candidate}</div>
                            </div>
                        </div>
                    )}
                    {interview.score != null && (
                        <div className="info-row">
                            <div className="info-icon">⭐</div>
                            <div>
                                <div className="info-key">Interview Score</div>
                                <div className="info-val"
                                    style={{ color: interview.score >= 70 ? "#059669" : interview.score >= 50 ? "#d97706" : "#dc2626", fontWeight:700, fontSize:15 }}>
                                    {interview.score} / 100
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Application Details */}
            <div className="card">
                <div className="card-label">Application Details</div>
                <div className="info-row">
                    <div className="info-icon">👤</div>
                    <div>
                        <div className="info-key">Applicant</div>
                        <div className="info-val">{application.name}</div>
                    </div>
                </div>
                <div className="info-row">
                    <div className="info-icon">💼</div>
                    <div>
                        <div className="info-key">Position</div>
                        <div className="info-val">{application.job_title}</div>
                    </div>
                </div>
                <div className="info-row">
                    <div className="info-icon">🏢</div>
                    <div>
                        <div className="info-key">Company</div>
                        <div className="info-val">{application.company} · {application.city}, {application.country}</div>
                    </div>
                </div>
                <div className="info-row">
                    <div className="info-icon">📅</div>
                    <div>
                        <div className="info-key">Applied On</div>
                        <div className="info-val">{application.applied_at}</div>
                    </div>
                </div>
                {application.website && (
                    <div className="info-row">
                        <div className="info-icon">🌐</div>
                        <div>
                            <div className="info-key">Company Website</div>
                            <a href={application.website} target="_blank" rel="noopener noreferrer" className="info-link">
                                {application.website.replace(/^https?:\/\//, "")}
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* Reference Code */}
            <div className="ref-card">
                <div>
                    <div className="ref-label">Reference Code</div>
                    <div className="ref-code">{application.reference_code}</div>
                </div>
                <div className="ref-note">
                    Keep this code<br/>to track your application
                </div>
            </div>

        </div>
        </>
    );
}