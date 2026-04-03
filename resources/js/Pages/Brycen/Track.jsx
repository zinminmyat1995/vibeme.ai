import { Link } from "@inertiajs/react";

const STATUS_CONFIG = {
    new:       { label:"Received",          color:"#6366f1", bg:"#eef2ff", icon:"📬", desc:"Your application has been received and is in the queue." },
    reviewing: { label:"Under Review",      color:"#d97706", bg:"#fef3c7", icon:"🔍", desc:"Our HR team is currently reviewing your profile." },
    interview: { label:"Interview Stage",   color:"#0891b2", bg:"#e0f2fe", icon:"🗓️", desc:"You've been invited for an interview. Check your email for details." },
    accepted:  { label:"Selected",          color:"#059669", bg:"#d1fae5", icon:"🎉", desc:"Congratulations! You've been selected for this position." },
    rejected:  { label:"Not Proceeding",    color:"#6b7280", bg:"#f3f4f6", icon:"📋", desc:"We've decided to move forward with other candidates at this time." },
};

const STEPS = ["new","reviewing","interview","accepted"];

const PLATFORM_LABELS = {
    zoom:"Zoom", google_meet:"Google Meet",
    teams:"Microsoft Teams", physical:"In Person", other:"Other",
};

export default function Track({ application, interview }) {
    const sc    = STATUS_CONFIG[application.status] || STATUS_CONFIG.new;
    const stepIdx = STEPS.indexOf(application.status);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
                *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
                body { background:#f5f5fa; font-family:'Outfit',sans-serif; color:#1a1a2e; }

                .topbar {
                    background:#fff; border-bottom:1px solid #f3f4f6;
                    padding:16px 32px;
                    display:flex; align-items:center; justify-content:space-between;
                }
                .logo-wrap { display:flex; align-items:center; gap:8px; text-decoration:none; }
                .logo-mark {
                    width:28px; height:28px; border-radius:8px;
                    background:linear-gradient(135deg,#5b21b6,#7c3aed);
                    display:flex; align-items:center; justify-content:center;
                    font-size:13px; font-weight:700; color:#fff;
                }
                .logo-text { font-size:14px; font-weight:600; color:#374151; }

                .page { max-width:640px; margin:0 auto; padding:40px 20px 80px; }

                /* STATUS HERO */
                .status-hero {
                    background:#fff; border-radius:20px;
                    overflow:hidden; margin-bottom:20px;
                    box-shadow:0 2px 12px rgba(0,0,0,0.06);
                }
                .status-hero-band {
                    height:6px;
                }
                .status-hero-body { padding:32px; }
                .status-icon-wrap {
                    width:64px; height:64px; border-radius:16px;
                    display:flex; align-items:center; justify-content:center;
                    font-size:30px; margin-bottom:16px;
                }
                .status-badge {
                    display:inline-flex; align-items:center; gap:6px;
                    padding:5px 14px; border-radius:100px;
                    font-size:12px; font-weight:600;
                    margin-bottom:8px;
                }
                .status-hero-title {
                    font-size:22px; font-weight:700; color:#111827;
                    letter-spacing:-0.3px; margin-bottom:6px;
                }
                .status-hero-desc { font-size:14px; color:#6b7280; line-height:1.65; }

                /* PROGRESS */
                .progress-wrap {
                    background:#fff; border-radius:16px;
                    padding:24px 28px; margin-bottom:20px;
                    box-shadow:0 2px 12px rgba(0,0,0,0.04);
                }
                .progress-title {
                    font-size:11px; font-weight:700; color:#9ca3af;
                    text-transform:uppercase; letter-spacing:0.08em; margin-bottom:20px;
                }
                .steps-row {
                    display:flex; align-items:center; gap:0;
                }
                .step-item { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; }
                .step-dot {
                    width:32px; height:32px; border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    font-size:13px; font-weight:700; margin-bottom:8px; z-index:1;
                    transition:all 0.2s;
                }
                .step-line {
                    position:absolute; top:16px; left:calc(50% + 16px);
                    right:calc(-50% + 16px); height:2px;
                }
                .step-label { font-size:10px; font-weight:500; text-align:center; line-height:1.3; }

                /* JOB INFO */
                .info-card {
                    background:#fff; border-radius:16px; padding:22px 26px;
                    margin-bottom:20px; box-shadow:0 2px 12px rgba(0,0,0,0.04);
                }
                .info-label {
                    font-size:11px; font-weight:700; color:#9ca3af;
                    text-transform:uppercase; letter-spacing:0.08em; margin-bottom:14px;
                }
                .info-row {
                    display:flex; align-items:center; gap:14px;
                    padding:10px 0; border-bottom:1px solid #f9fafb;
                }
                .info-row:last-child { border-bottom:none; padding-bottom:0; }
                .info-icon { font-size:18px; width:24px; text-align:center; flex-shrink:0; line-height:1; }
                .info-key { font-size:11px; color:#9ca3af; margin-bottom:2px; }
                .info-val { font-size:13px; font-weight:500; color:#111827; }
                .info-link { color:#7c3aed; text-decoration:none; font-size:13px; font-weight:500; word-break:break-all; }

                /* INTERVIEW CARD */
                .interview-card {
                    background:linear-gradient(135deg,#f0f9ff,#e0f2fe);
                    border:1px solid #bae6fd; border-radius:16px;
                    padding:22px 26px; margin-bottom:20px;
                }
                .interview-card-title {
                    font-size:11px; font-weight:700; color:#0369a1;
                    text-transform:uppercase; letter-spacing:0.08em; margin-bottom:16px;
                    display:flex; align-items:center; gap:8px;
                }

                /* REF */
                .ref-card {
                    background:#fff; border-radius:16px; padding:20px 26px;
                    box-shadow:0 2px 12px rgba(0,0,0,0.04);
                    display:flex; align-items:center; justify-content:space-between;
                    flex-wrap:wrap; gap:12px;
                }
                .ref-label-sm { font-size:11px; color:#9ca3af; margin-bottom:4px; }
                .ref-code {
                    font-size:15px; font-weight:700; color:#374151;
                    font-family:'Courier New',monospace; letter-spacing:0.06em;
                }
                .back-btn {
                    padding:9px 20px; border-radius:9px;
                    background:#f3f4f6; color:#374151;
                    font-size:13px; font-weight:500;
                    text-decoration:none; transition:background 0.15s;
                }
            `}</style>

            {/* Topbar */}
            <nav className="topbar">
                <Link href="/" className="logo-wrap">
                    <div className="logo-mark">V</div>
                    <span className="logo-text">VibeMe.AI</span>
                </Link>
                <Link href="/" className="back-btn">← Back to Jobs</Link>
            </nav>

            <div className="page">

                {/* Status Hero */}
                <div className="status-hero">
                    <div className="status-hero-band" style={{background:sc.color}}/>
                    <div className="status-hero-body">
                        <div className="status-icon-wrap" style={{background:sc.bg}}>
                            {sc.icon}
                        </div>
                        <div className="status-badge" style={{background:sc.bg,color:sc.color}}>
                            <span style={{width:6,height:6,borderRadius:"50%",background:sc.color,display:"inline-block"}}/>
                            {sc.label}
                        </div>
                        <div className="status-hero-title">
                            {application.job_title}
                        </div>
                        <div className="status-hero-desc">{sc.desc}</div>
                    </div>
                </div>

                {/* Progress Steps — not shown for rejected */}
                {application.status !== "rejected" && (
                    <div className="progress-wrap">
                        <div className="progress-title">Application Progress</div>
                        <div className="steps-row">
                            {STEPS.map((step,i) => {
                                const cfg   = STATUS_CONFIG[step];
                                const done  = i <= stepIdx;
                                const active= i === stepIdx;
                                return (
                                    <div key={step} className="step-item">
                                        {i < STEPS.length-1 && (
                                            <div className="step-line"
                                                style={{background: done?"#7c3aed":"#e5e7eb"}}/>
                                        )}
                                        <div className="step-dot" style={{
                                            background: done ? "#7c3aed" : "#f3f4f6",
                                            color:      done ? "#fff"    : "#9ca3af",
                                            boxShadow:  active ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
                                        }}>
                                            {done ? "✓" : i+1}
                                        </div>
                                        <div className="step-label" style={{color: done?"#7c3aed":"#9ca3af", fontWeight: active?600:400}}>
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
                        <div className="interview-card-title">
                            🗓️ Interview Details
                        </div>
                        <div className="info-row" style={{borderBottom:"1px solid #bae6fd",paddingBottom:10,marginBottom:0}}>
                            <div className="info-icon">📅</div>
                            <div>
                                <div className="info-key">Date & Time</div>
                                <div className="info-val" style={{color:"#0c4a6e"}}>{interview.scheduled_at}</div>
                            </div>
                        </div>
                        {interview.type && (
                            <div className="info-row" style={{borderBottom:"1px solid #bae6fd"}}>
                                <div className="info-icon">💻</div>
                                <div>
                                    <div className="info-key">Format</div>
                                    <div className="info-val" style={{color:"#0c4a6e"}}>
                                        {interview.type === "online" ? "Online Interview" : "In-Person Interview"}
                                        {interview.platform && interview.platform !== "physical" && ` — ${PLATFORM_LABELS[interview.platform] || interview.platform}`}
                                    </div>
                                </div>
                            </div>
                        )}
                        {interview.meeting_link && (
                            <div className="info-row" style={{borderBottom:"1px solid #bae6fd"}}>
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
                            <div className="info-row" style={{borderBottom:"1px solid #bae6fd"}}>
                                <div className="info-icon">📍</div>
                                <div>
                                    <div className="info-key">Location</div>
                                    <div className="info-val" style={{color:"#0c4a6e"}}>{interview.location}</div>
                                </div>
                            </div>
                        )}
                        {interview.note_to_candidate && (
                            <div className="info-row" style={{borderBottom:"none"}}>
                                <div className="info-icon">📝</div>
                                <div>
                                    <div className="info-key">Note from HR</div>
                                    <div className="info-val" style={{color:"#0c4a6e",lineHeight:1.6}}>{interview.note_to_candidate}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Application Info */}
                <div className="info-card">
                    <div className="info-label">Application Details</div>
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
                                    {application.website.replace("https://","")}
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reference Code */}
                <div className="ref-card">
                    <div>
                        <div className="ref-label-sm">Your Reference Code</div>
                        <div className="ref-code">{application.reference_code}</div>
                    </div>
                    <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>
                        Keep this code<br/>to track your application
                    </div>
                </div>

            </div>
        </>
    );
}