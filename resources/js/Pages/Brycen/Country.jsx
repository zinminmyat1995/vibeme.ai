import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";

const COUNTRY_LABELS = {
    myanmar: "MM", cambodia: "KH", japan: "JP", vietnam: "VN", korea: "KR",
};

const JOB_TYPE_LABELS = {
    full_time: "Full Time", part_time: "Part Time",
    contract: "Contract", internship: "Internship",
};

function BulletList({ text }) {
    if (!text) return null;
    const items = text.split(String.fromCharCode(10))
        .map(l => l.replace(/^[-•]\s*/, "").trim())
        .filter(Boolean);
    if (items.length === 0) return null;
    return (
        <ul className="bullet-list">
            {items.map((item, i) => (
                <li key={i} className="bullet-item">
                    <span className="bullet-dot" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export default function Country({ office, jobs = [] }) {
    const [selectedJob, setSelectedJob] = useState(null);
    const [applyOpen, setApplyOpen]     = useState(false);
    const [applyJob, setApplyJob]       = useState(null);
    const [refCode, setRefCode]         = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "", email: "", phone: "", cover_letter: "", cv: null,
    });

    const handleApply = (job) => {
        setApplyJob(job);
        setApplyOpen(true);
        setRefCode(null);
        reset();
    };

    const submitApply = (e) => {
        e.preventDefault();
        post(`/brycen/${office.country_key}/jobs/${applyJob.id}/apply`, {
            forceFormData: true,
            onSuccess: (page) => {
                const code = page.props.flash?.reference_code;
                setRefCode(code || "SUCCESS");
            },
        });
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Outfit:wght@300;400;500&display=swap');

                *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
                html { scroll-behavior:smooth; }
                body {
                    background: #07080d;
                    color: #e2dfd8;
                    font-family: 'Outfit', sans-serif;
                    font-weight: 300;
                    overflow-x: hidden;
                }

                /* ── NAV ── */
                .topbar {
                    position: fixed; top:0; left:0; right:0; z-index:100;
                    display: flex; align-items:center; justify-content:space-between;
                    padding: 20px 64px;
                    background: rgba(7,8,13,0.82);
                    backdrop-filter: blur(28px);
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .back-btn {
                    display: flex; align-items:center; gap:8px;
                    font-size: 12px; font-weight:400;
                    color: rgba(255,255,255,0.3);
                    text-decoration: none;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    transition: color 0.2s;
                }
                .back-btn:hover { color: rgba(255,255,255,0.7); }
                .topbar-logo {
                    display: flex; align-items:center; gap:9px;
                    text-decoration: none;
                }
                .logo-mark {
                    width: 26px; height:26px; border-radius:7px;
                    background: linear-gradient(135deg,#5b4fcf,#8b7fef);
                    display: flex; align-items:center; justify-content:center;
                    font-size: 12px; font-weight:600; color:#fff;
                    font-family: 'Outfit', sans-serif;
                }
                .logo-text {
                    font-family: 'Outfit', sans-serif;
                    font-size: 14px; font-weight:500;
                    color: rgba(255,255,255,0.75);
                }

                /* ── BANNER ── */
                .banner {
                    height: 420px;
                    position: relative; overflow:hidden;
                    margin-top: 64px;
                }
                .banner-img {
                    width:100%; height:100%; object-fit:cover;
                    filter: brightness(0.28) saturate(0.6);
                    transition: transform 0.6s ease;
                }
                .banner-grad {
                    position: absolute; inset:0;
                    background: linear-gradient(
                        to bottom,
                        rgba(7,8,13,0.1) 0%,
                        rgba(7,8,13,0.5) 55%,
                        rgba(7,8,13,1) 100%
                    );
                }
                .banner-content {
                    position: absolute; bottom:0; left:0; right:0;
                    padding: 44px 64px;
                    display: flex; align-items:flex-end; justify-content:space-between;
                    gap: 24px;
                }
                .banner-left {}
                .banner-code {
                    font-size: 10px; font-weight:400;
                    letter-spacing: 0.16em; text-transform:uppercase;
                    color: rgba(255,255,255,0.25);
                    margin-bottom: 10px;
                    display: flex; align-items:center; gap:10px;
                }
                .banner-code-line { width:22px; height:1px; background:rgba(255,255,255,0.15); }
                .banner-company {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(32px,4vw,52px);
                    font-weight: 700;
                    color: #ede9e0;
                    letter-spacing: -0.03em;
                    line-height: 1;
                    margin-bottom: 8px;
                }
                .banner-city {
                    font-size: 13px; font-weight:300;
                    color: rgba(255,255,255,0.35);
                    letter-spacing: 0.02em;
                }
                .visit-btn {
                    display: inline-flex; align-items:center; gap:8px;
                    padding: 11px 22px; border-radius:9px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.65);
                    font-size: 12px; font-weight:400;
                    font-family: 'Outfit', sans-serif;
                    text-decoration: none;
                    letter-spacing: 0.04em;
                    transition: all 0.2s;
                    white-space: nowrap; flex-shrink:0;
                }
                .visit-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.22);
                    color: #fff;
                }

                /* ── LAYOUT ── */
                .container { max-width:1240px; margin:0 auto; padding:52px 64px 96px; }
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    gap: 40px;
                    align-items: start;
                }

                /* ── CARDS ── */
                .info-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px;
                    padding: 26px;
                    margin-bottom: 16px;
                }
                .card-label {
                    font-size: 10px; font-weight:400;
                    letter-spacing: 0.14em; text-transform:uppercase;
                    color: rgba(255,255,255,0.2);
                    margin-bottom: 14px;
                }
                .about-text {
                    font-size: 14px; font-weight:300;
                    color: rgba(255,255,255,0.6);
                    line-height: 1.82;
                }
                .meta-row {
                    display: flex; gap:32px;
                    margin-top: 20px;
                    padding-top: 18px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .meta-item {}
                .meta-key {
                    font-size: 10px; letter-spacing:0.1em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.2);
                    margin-bottom: 5px;
                }
                .meta-val {
                    font-family: 'Playfair Display', serif;
                    font-size: 18px; font-weight:500;
                    color: #ede9e0;
                }
                .meta-val-sm {
                    font-size: 12px; font-weight:300;
                    color: rgba(255,255,255,0.45);
                    line-height: 1.5;
                }

                /* contact rows */
                .contact-row {
                    display: flex; align-items:flex-start; gap:12px;
                    padding: 11px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    font-size: 13px;
                }
                .contact-row:last-child { border-bottom:none; }
                .contact-icon {
                    font-size: 13px; width:20px;
                    text-align:center; flex-shrink:0;
                    margin-top: 1px;
                    opacity: 0.5;
                }
                .contact-val { color: rgba(255,255,255,0.55); font-weight:300; line-height:1.5; }
                .contact-link {
                    color: rgba(255,255,255,0.45);
                    text-decoration: none;
                    transition: color 0.2s;
                    font-weight:300;
                }
                .contact-link:hover { color: rgba(255,255,255,0.8); }

                /* map */
                .map-wrap {
                    border-radius: 12px; overflow:hidden;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .map-iframe {
                    width:100%; height:200px;
                    display:block; border:none;
                    filter: grayscale(40%) invert(88%) hue-rotate(180deg);
                }

                /* ── JOBS SECTION ── */
                .jobs-section { margin-top: 40px; }
                .jobs-head {
                    display: flex; align-items:center; justify-content:space-between;
                    margin-bottom: 20px;
                }
                .jobs-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 24px; font-weight:500;
                    color: #ede9e0; letter-spacing:-0.02em;
                }
                .jobs-count-badge {
                    font-size: 11px; font-weight:400;
                    color: #5dba88;
                    background: rgba(93,186,136,0.08);
                    border: 1px solid rgba(93,186,136,0.2);
                    padding: 4px 14px; border-radius:100px;
                }

                /* ── NO JOBS state ── */
                .no-jobs-wrap {
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 56px 40px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    background: rgba(255,255,255,0.015);
                }
                .no-jobs-bg {
                    position: absolute; inset:0;
                    background: radial-gradient(ellipse at 50% 0%, rgba(91,79,207,0.06) 0%, transparent 70%);
                    pointer-events: none;
                }
                .no-jobs-icon {
                    width: 52px; height:52px; border-radius:14px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    display: flex; align-items:center; justify-content:center;
                    font-size: 22px;
                    margin-bottom: 20px;
                    position: relative; z-index:1;
                }
                .no-jobs-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 20px; font-weight:500;
                    color: rgba(255,255,255,0.65);
                    letter-spacing: -0.02em;
                    margin-bottom: 8px;
                    position: relative; z-index:1;
                }
                .no-jobs-sub {
                    font-size: 13px; font-weight:300;
                    color: rgba(255,255,255,0.2);
                    line-height: 1.7;
                    max-width: 320px;
                    position: relative; z-index:1;
                    margin-bottom: 28px;
                }
                .no-jobs-visit {
                    display: inline-flex; align-items:center; gap:7px;
                    padding: 9px 20px; border-radius:9px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    color: rgba(255,255,255,0.35);
                    font-size: 12px; font-weight:400;
                    text-decoration: none;
                    letter-spacing: 0.04em;
                    transition: all 0.2s;
                    position: relative; z-index:1;
                    font-family: 'Outfit', sans-serif;
                }
                .no-jobs-visit:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.16);
                    color: rgba(255,255,255,0.65);
                }

                /* ── JOB CARD ── */
                .job-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 13px; padding:22px;
                    margin-bottom: 10px; cursor:pointer;
                    transition: all 0.25s;
                }
                .job-card:hover {
                    border-color: rgba(91,79,207,0.3);
                    background: rgba(91,79,207,0.04);
                }
                .job-card.active {
                    border-color: rgba(91,79,207,0.35);
                    background: rgba(91,79,207,0.05);
                }
                .job-top {
                    display: flex; align-items:flex-start;
                    justify-content:space-between; gap:14px;
                }
                .job-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 17px; font-weight:500;
                    color: #ede9e0; letter-spacing:-0.01em;
                    margin-bottom: 3px; line-height:1.2;
                }
                .job-dept {
                    font-size: 12px; font-weight:300;
                    color: rgba(255,255,255,0.3);
                    letter-spacing: 0.02em;
                }
                .apply-btn {
                    padding: 8px 18px; border-radius:8px;
                    background: rgba(91,79,207,0.15);
                    border: 1px solid rgba(91,79,207,0.3);
                    color: rgba(167,155,254,0.9);
                    font-size: 12px; font-weight:400;
                    font-family: 'Outfit', sans-serif;
                    letter-spacing: 0.03em;
                    cursor: pointer; transition:all 0.2s;
                    white-space: nowrap; flex-shrink:0;
                }
                .apply-btn:hover {
                    background: rgba(91,79,207,0.25);
                    border-color: rgba(91,79,207,0.5);
                    color: #fff;
                }
                .job-pills {
                    display: flex; gap:7px; flex-wrap:wrap; margin-top:13px;
                }
                .pill {
                    padding: 3px 11px; border-radius:100px;
                    font-size: 10px; font-weight:400;
                    letter-spacing: 0.04em; font-family:'Outfit',sans-serif;
                }
                .pill-type {
                    background: rgba(91,79,207,0.1);
                    border: 1px solid rgba(91,79,207,0.2);
                    color: rgba(162,155,254,0.8);
                }
                .pill-slots {
                    background: rgba(93,186,136,0.08);
                    border: 1px solid rgba(93,186,136,0.18);
                    color: rgba(93,186,136,0.85);
                }
                .pill-salary {
                    background: rgba(245,158,11,0.08);
                    border: 1px solid rgba(245,158,11,0.18);
                    color: rgba(245,158,11,0.75);
                }
                .pill-deadline {
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.18);
                    color: rgba(239,68,68,0.75);
                }

                /* expand */
                .job-expand {
                    border-top: 1px solid rgba(255,255,255,0.05);
                    margin-top: 16px; padding-top:16px;
                }
                .bullet-list {
                    list-style: none; padding:0; margin:0;
                    display:flex; flex-direction:column; gap:8px;
                }
                .bullet-item {
                    display:flex; align-items:flex-start; gap:10px;
                    font-size:13px; font-weight:300;
                    color:rgba(255,255,255,0.55); line-height:1.75;
                }
                .bullet-dot {
                    width:5px; height:5px; border-radius:50%;
                    background:rgba(162,155,254,0.6);
                    flex-shrink:0; margin-top:7px;
                }
                .expand-label {
                    font-size: 10px; font-weight:400;
                    letter-spacing: 0.12em; text-transform:uppercase;
                    color: rgba(255,255,255,0.18);
                    margin-top: 16px; margin-bottom:8px;
                }
                .apply-full-btn {
                    margin-top: 20px; width:100%; padding:11px;
                    border-radius: 9px;
                    background: rgba(91,79,207,0.15);
                    border: 1px solid rgba(91,79,207,0.3);
                    color: rgba(167,155,254,0.9);
                    font-size: 13px; font-weight:400;
                    font-family: 'Outfit', sans-serif;
                    letter-spacing: 0.03em;
                    cursor: pointer; transition:all 0.2s;
                }
                .apply-full-btn:hover {
                    background: rgba(91,79,207,0.25);
                    color: #fff;
                }

                /* ── MODAL ── */
                .modal-bg {
                    position: fixed; inset:0; z-index:200;
                    background: rgba(0,0,0,0.75);
                    backdrop-filter: blur(12px);
                    display: flex; align-items:center; justify-content:center;
                    padding: 24px;
                }
                .modal {
                    background: #0d0e18;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 18px; padding:36px;
                    width:100%; max-width:500px;
                    max-height: 90vh; overflow-y:auto;
                    animation: popIn 0.22s ease;
                }
                @keyframes popIn {
                    from { opacity:0; transform:scale(0.96) translateY(10px); }
                    to   { opacity:1; transform:scale(1) translateY(0); }
                }
                .modal-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 22px; font-weight:500;
                    color: #ede9e0; letter-spacing:-0.02em;
                    margin-bottom: 4px;
                }
                .modal-sub {
                    font-size: 12px; font-weight:300;
                    color: rgba(255,255,255,0.25);
                    margin-bottom: 28px;
                    letter-spacing: 0.02em;
                }
                .form-group { margin-bottom:16px; }
                .form-label {
                    display: block;
                    font-size: 10px; font-weight:400;
                    color: rgba(255,255,255,0.28);
                    margin-bottom: 8px;
                    letter-spacing: 0.1em; text-transform:uppercase;
                }
                .form-input {
                    width:100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 9px; padding:11px 14px;
                    color: #e2dfd8;
                    font-size: 13px; font-weight:300;
                    font-family: 'Outfit', sans-serif;
                    transition: border-color 0.2s; outline:none;
                }
                .form-input:focus { border-color: rgba(91,79,207,0.45); }
                .form-input.err { border-color: rgba(239,68,68,0.4); }
                .form-input::placeholder { color: rgba(255,255,255,0.18); }
                .form-error { font-size:11px; color:rgba(239,68,68,0.7); margin-top:5px; }

                .file-label {
                    display: flex; align-items:center; gap:12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px dashed rgba(255,255,255,0.1);
                    border-radius: 9px; padding:14px;
                    cursor: pointer; transition:all 0.2s;
                    color: rgba(255,255,255,0.25);
                    font-size: 13px; font-weight:300;
                }
                .file-label:hover {
                    border-color: rgba(91,79,207,0.35);
                    color: rgba(162,155,254,0.8);
                }
                .modal-btns { display:flex; gap:10px; margin-top:24px; }
                .btn-cancel {
                    flex:1; padding:11px; border-radius:9px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.35);
                    font-size: 13px; font-family:'Outfit',sans-serif;
                    cursor: pointer; transition:all 0.2s;
                }
                .btn-cancel:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.6); }
                .btn-submit {
                    flex:2; padding:11px; border-radius:9px;
                    background: rgba(91,79,207,0.2);
                    border: 1px solid rgba(91,79,207,0.35);
                    color: rgba(167,155,254,0.95);
                    font-size: 13px; font-weight:400;
                    font-family: 'Outfit', sans-serif;
                    cursor: pointer; transition:all 0.2s;
                }
                .btn-submit:hover:not(:disabled) {
                    background: rgba(91,79,207,0.32);
                    color: #fff;
                }
                .btn-submit:disabled { opacity:0.45; cursor:not-allowed; }

                /* success */
                .success-box { text-align:center; padding:20px 0; }
                .success-emoji { font-size:44px; margin-bottom:16px; }
                .success-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 22px; font-weight:500;
                    color: #ede9e0; letter-spacing:-0.02em;
                    margin-bottom: 6px;
                }
                .ref-code {
                    display: inline-block;
                    background: rgba(91,79,207,0.12);
                    border: 1px solid rgba(91,79,207,0.25);
                    color: rgba(162,155,254,0.9);
                    padding: 10px 28px; border-radius:10px;
                    font-size: 17px; font-weight:500;
                    letter-spacing: 0.1em;
                    margin: 16px 0;
                    font-family: 'Outfit', sans-serif;
                }
                .success-note {
                    font-size: 13px; font-weight:300;
                    color: rgba(255,255,255,0.25);
                    line-height: 1.7;
                }

                @media (max-width:860px) {
                    .topbar { padding:16px 24px; }
                    .banner { height:300px; }
                    .banner-content { padding:24px; flex-direction:column; align-items:flex-start; gap:14px; }
                    .banner-company { font-size:28px; }
                    .container { padding:32px 24px 72px; }
                    .grid-2 { grid-template-columns:1fr; }
                }
            `}</style>

            {/* NAV */}
            <nav className="topbar">
                <Link href="/" className="back-btn">← Back</Link>
                <Link href="/" className="topbar-logo">
                    <div className="logo-mark">V</div>
                    <span className="logo-text">VibeMe.AI</span>
                </Link>
                <div style={{ width:60 }} />
            </nav>

            {/* BANNER */}
            <div className="banner">
                <img src={office.image_path} alt={office.company_name}
                    className="banner-img" onError={e => { e.target.style.display="none"; }} />
                <div className="banner-grad" />
                <div className="banner-content">
                    <div className="banner-left">
                        <div className="banner-code">
                            <span className="banner-code-line" />
                            {COUNTRY_LABELS[office.country_key]} · {office.country_name}
                        </div>
                        <div className="banner-company">{office.company_name}</div>
                        <div className="banner-city">{office.city}, {office.country_name}</div>
                    </div>
                    <a href={office.website_url} target="_blank" rel="noopener noreferrer" className="visit-btn">
                        Visit Website ↗
                    </a>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container">
                <div className="grid-2">

                    {/* LEFT */}
                    <div>
                        {/* About */}
                        <div className="info-card">
                            <div className="card-label">About</div>
                            <div className="about-text">{office.about}</div>
                            {office.founded && (
                                <div className="meta-row">
                                    <div className="meta-item">
                                        <div className="meta-key">Founded</div>
                                        <div className="meta-val">{office.founded}</div>
                                    </div>
                                    <div className="meta-item" style={{ flex:1 }}>
                                        <div className="meta-key">Specialization</div>
                                        <div className="meta-val-sm">{office.specialization}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Jobs */}
                        <div className="jobs-section">
                            <div className="jobs-head">
                                <div className="jobs-title">Open Positions</div>
                                {jobs.length > 0 && (
                                    <div className="jobs-count-badge">{jobs.length} open</div>
                                )}
                            </div>

                            {jobs.length === 0 ? (
                                <div className="no-jobs-wrap">
                                    <div className="no-jobs-bg" />
                                    <div className="no-jobs-icon">📋</div>
                                    <div className="no-jobs-title">No open positions</div>
                                    <div className="no-jobs-sub">
                                        We're not actively hiring at the moment,
                                        but great talent is always welcome.
                                        Check back soon or reach out directly.
                                    </div>
                                    <a href={office.website_url} target="_blank"
                                        rel="noopener noreferrer" className="no-jobs-visit">
                                        Visit {office.company_name} ↗
                                    </a>
                                </div>
                            ) : jobs.map(job => (
                                <div key={job.id}
                                    className={`job-card ${selectedJob === job.id ? "active" : ""}`}
                                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}>
                                    <div className="job-top">
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:4 }}>
                                                <div className="job-title">{job.title}</div>
                                                <span className="pill pill-type" style={{ flexShrink:0 }}>{JOB_TYPE_LABELS[job.type]}</span>
                                            </div>
                                            {job.department && <div className="job-dept">{job.department}</div>}
                                        </div>
                                        <button className="apply-btn"
                                            onClick={e => { e.stopPropagation(); handleApply(job); }}>
                                            Apply
                                        </button>
                                    </div>
                                    <div className="job-pills" style={{ marginTop:12 }}>
                                        <span className="pill pill-slots">
                                            {job.slots} position{job.slots > 1 ? "s" : ""}
                                        </span>
                                        {job.salary_range && (
                                            <span className="pill pill-salary">
                                                {job.currency_code ? job.currency_code + " " : ""}{job.salary_range}
                                            </span>
                                        )}
                                    </div>
                                    {job.deadline && (
                                        <div style={{
                                            display:"flex", alignItems:"center", gap:6,
                                            marginTop:10, fontSize:11, fontWeight:300,
                                            color:"rgba(255,255,255,0.28)", letterSpacing:"0.03em",
                                        }}>
                                            <span style={{ width:5, height:5, borderRadius:"50%", background:"rgba(239,68,68,0.55)", flexShrink:0, display:"inline-block" }} />
                                            Apply by {job.deadline}
                                        </div>
                                    )}

                                    {selectedJob === job.id && (
                                        <div className="job-expand">
                                            <div className="expand-label">Description</div>
                                            <BulletList text={job.description} />
                                            {job.requirements && <>
                                                <div className="expand-label">Requirements</div>
                                                <BulletList text={job.requirements} />
                                            </>}
                                            {job.responsibilities && <>
                                                <div className="expand-label">Responsibilities</div>
                                                <BulletList text={job.responsibilities} />
                                            </>}
                                            <button className="apply-full-btn"
                                                onClick={e => { e.stopPropagation(); handleApply(job); }}>
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
                        <div className="info-card">
                            <div className="card-label">Contact</div>
                            <div className="contact-row">
                                <span className="contact-icon">📍</span>
                                <span className="contact-val">{office.address}</span>
                            </div>
                            <div className="contact-row">
                                <span className="contact-icon">✉</span>
                                <a href={`mailto:${office.email}`} className="contact-link">{office.email}</a>
                            </div>
                            <div className="contact-row">
                                <span className="contact-icon">☎</span>
                                <span className="contact-val">{office.phone}</span>
                            </div>
                            <div className="contact-row">
                                <span className="contact-icon">🌐</span>
                                <a href={office.website_url} target="_blank"
                                    rel="noopener noreferrer" className="contact-link">
                                    {office.website_url.replace("https://","")}
                                </a>
                            </div>
                        </div>

                        <div className="map-wrap">
                            <iframe src={office.map_embed_url} className="map-iframe"
                                allowFullScreen loading="lazy"
                                title={`${office.company_name} location`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {applyOpen && (
                <div className="modal-bg" onClick={() => setApplyOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {refCode ? (
                            <div className="success-box">
                                <div className="success-emoji">✦</div>
                                <div className="success-title">Application Submitted</div>
                                <p style={{ fontSize:12, color:"rgba(255,255,255,0.25)", marginBottom:4 }}>
                                    Your reference code
                                </p>
                                <div className="ref-code">{refCode}</div>
                                <p className="success-note">
                                    Save this code to track your application.<br />
                                    Our HR team will reach out to&nbsp;
                                    <span style={{ color:"rgba(255,255,255,0.45)" }}>{data.email}</span>.
                                </p>
                                <button className="btn-submit"
                                    style={{ width:"100%", marginTop:24 }}
                                    onClick={() => setApplyOpen(false)}>
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="modal-title">Apply — {applyJob?.title}</div>
                                <div className="modal-sub">{office.company_name} · {office.city}</div>

                                <form onSubmit={submitApply}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input className={`form-input ${errors.name ? "err":""}`}
                                            value={data.name}
                                            onChange={e => setData("name", e.target.value)}
                                            placeholder="Your full name" />
                                        {errors.name && <div className="form-error">{errors.name}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input type="email" className={`form-input ${errors.email ? "err":""}`}
                                            value={data.email}
                                            onChange={e => setData("email", e.target.value)}
                                            placeholder="your@email.com" />
                                        {errors.email && <div className="form-error">{errors.email}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input"
                                            value={data.phone}
                                            onChange={e => setData("phone", e.target.value)}
                                            placeholder="+95 9..." />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cover Letter</label>
                                        <textarea className="form-input" rows={3}
                                            value={data.cover_letter}
                                            onChange={e => setData("cover_letter", e.target.value)}
                                            placeholder="Tell us why you're a great fit..."
                                            style={{ resize:"vertical" }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">CV / Resume * — PDF, DOC, DOCX · max 5MB</label>
                                        <label className="file-label">
                                            <span style={{ fontSize:16, opacity:0.5 }}>📎</span>
                                            <span>{data.cv ? data.cv.name : "Click to upload your CV"}</span>
                                            <input type="file" accept=".pdf,.doc,.docx"
                                                style={{ display:"none" }}
                                                onChange={e => setData("cv", e.target.files[0])} />
                                        </label>
                                        {errors.cv && <div className="form-error">{errors.cv}</div>}
                                    </div>

                                    <div className="modal-btns">
                                        <button type="button" className="btn-cancel"
                                            onClick={() => setApplyOpen(false)}>Cancel</button>
                                        <button type="submit" className="btn-submit" disabled={processing}>
                                            {processing ? "Submitting..." : "Submit Application →"}
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