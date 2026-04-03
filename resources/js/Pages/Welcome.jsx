import { useState } from "react";
import { Link } from "@inertiajs/react";

const FLAGS = { myanmar:"MM", cambodia:"KH", japan:"JP", vietnam:"VN", korea:"KR" };

export default function Welcome({ offices = [] }) {
    const totalOpenJobs = offices.reduce((s, o) => s + (o.open_job_postings_count || 0), 0);
    const hiringOffices = offices.filter(o => o.open_job_postings_count > 0);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Outfit:wght@300;400;500&display=swap');
                *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
                html { scroll-behavior:smooth; }
                body { background:#07080d; color:#e2dfd8; font-family:'Outfit',sans-serif; font-weight:300; overflow-x:hidden; }

                .nav {
                    position:fixed; top:0; left:0; right:0; z-index:50;
                    display:flex; align-items:center; justify-content:space-between;
                    padding:20px 64px;
                    background:rgba(7,8,13,0.82); backdrop-filter:blur(28px);
                    border-bottom:1px solid rgba(255,255,255,0.04);
                }
                .nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
                .logo-mark {
                    width:26px; height:26px; border-radius:7px;
                    background:linear-gradient(135deg,#5b4fcf,#8b7fef);
                    display:flex; align-items:center; justify-content:center;
                    font-size:12px; font-weight:600; color:#fff; font-family:'Outfit',sans-serif;
                }
                .logo-text { font-family:'Outfit',sans-serif; font-size:14px; font-weight:500; color:rgba(255,255,255,0.75); }
                .nav-links { display:flex; align-items:center; gap:40px; }
                .nav-link { font-size:11px; font-weight:400; color:rgba(255,255,255,0.3); text-decoration:none; letter-spacing:0.1em; text-transform:uppercase; transition:color 0.2s; }
                .nav-link:hover { color:rgba(255,255,255,0.65); }

                .hero { padding:128px 64px 70px; max-width:1360px; margin:0 auto; display:grid; grid-template-columns:1.15fr 0.85fr; gap:80px; align-items:center; }

                .eyebrow { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
                .eyebrow-line { width:28px; height:1px; background:rgba(255,255,255,0.16); }
                .eyebrow-text { font-size:10px; font-weight:400; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.22); }

                .hero-title { font-family:'Playfair Display',serif; font-size:clamp(36px,4vw,58px); font-weight:500; line-height:1.06; letter-spacing:-0.025em; color:#ede9e0; margin-bottom:18px; }
                .hero-title .italic { font-style:italic; color:rgba(255,255,255,0.3); }
                .hero-body { font-size:13px; font-weight:300; color:rgba(255,255,255,0.28); line-height:1.88; max-width:400px; margin-bottom:34px; }

                /* hiring status */
                .status-pill {
                    display:inline-flex; align-items:center; gap:10px;
                    padding:9px 16px 9px 10px; border-radius:10px;
                    border:1px solid rgba(255,255,255,0.07);
                    background:rgba(255,255,255,0.02);
                    font-size:12px; font-weight:400; color:rgba(255,255,255,0.4); letter-spacing:0.02em;
                }
                .status-pill.hiring { border-color:rgba(93,186,136,0.2); background:rgba(93,186,136,0.05); color:rgba(255,255,255,0.5); }
                .dot-wrap { position:relative; width:8px; height:8px; flex-shrink:0; }
                .dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.18); position:absolute; }
                .dot.green { background:#5dba88; }
                .dot-ring { width:8px; height:8px; border-radius:50%; border:1.5px solid #5dba88; position:absolute; animation:sonar 2.4s ease-out infinite; opacity:0; }
                @keyframes sonar { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(3);opacity:0} }
                .status-strong { font-weight:500; color:rgba(255,255,255,0.7); }

                /* stats right */
                .hero-right { display:flex; flex-direction:column; }
                .stat-row { display:grid; grid-template-columns:76px 1fr; gap:0 20px; align-items:center; padding:24px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
                .stat-row:first-child { padding-top:0; }
                .stat-row:last-child { border-bottom:none; padding-bottom:0; }
                .stat-num { font-family:'Playfair Display',serif; font-size:46px; font-weight:700; line-height:1; letter-spacing:-0.04em; color:#ede9e0; text-align:right; }
                .stat-num.g { color:#5dba88; }
                .stat-num.dim { color:rgba(255,255,255,0.15); }
                .stat-label { font-size:12px; font-weight:500; color:rgba(255,255,255,0.5); letter-spacing:0.04em; margin-bottom:3px; }
                .stat-sub { font-size:11px; color:rgba(255,255,255,0.16); letter-spacing:0.03em; }
                .chips { display:flex; flex-wrap:wrap; gap:5px; margin-top:7px; }
                .chip { font-size:10px; font-weight:500; letter-spacing:0.06em; padding:3px 8px; border-radius:5px; background:rgba(93,186,136,0.1); border:1px solid rgba(93,186,136,0.2); color:#5dba88; }

                .divider-wrap { max-width:1360px; margin:0 auto; padding:0 64px; }
                .divider-line { height:1px; background:rgba(255,255,255,0.05); }

                .section { max-width:1360px; margin:0 auto; padding:52px 64px 96px; }
                .section-head { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:30px; }
                .s-eyebrow { font-size:10px; font-weight:400; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.18); margin-bottom:6px; }
                .s-title { font-family:'Playfair Display',serif; font-size:26px; font-weight:500; color:#ede9e0; letter-spacing:-0.02em; }
                .s-badge { display:inline-flex; align-items:center; gap:7px; font-size:11px; font-weight:400; color:#5dba88; background:rgba(93,186,136,0.07); border:1px solid rgba(93,186,136,0.18); padding:5px 14px; border-radius:100px; }
                .s-badge-dot { width:5px; height:5px; border-radius:50%; background:#5dba88; animation:sonar 2.4s ease-out infinite; }

                .grid-top { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; }
                .grid-bot { display:grid; grid-template-columns:repeat(2,1fr); gap:13px; max-width:calc(66.66% + 7px); margin:13px auto 0; }

                .card { position:relative; border-radius:14px; overflow:hidden; text-decoration:none; display:block; aspect-ratio:3/2; border:1px solid rgba(255,255,255,0.06); background:#0f1018; transition:transform 0.45s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.45s; }
                .card:hover { transform:translateY(-7px); border-color:rgba(255,255,255,0.11); box-shadow:0 28px 60px rgba(0,0,0,0.55); }
                .card-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:brightness(0.35) saturate(0.6); transition:transform 0.6s cubic-bezier(0.23,1,0.32,1), filter 0.4s; }
                .card:hover .card-img { transform:scale(1.06); filter:brightness(0.24) saturate(0.5); }
                .card-grad { position:absolute; inset:0; background:linear-gradient(165deg,transparent 25%,rgba(7,8,13,0.65) 60%,rgba(7,8,13,0.97) 100%); }

                .card-code { position:absolute; top:13px; left:13px; font-size:9px; font-weight:500; letter-spacing:0.12em; color:rgba(255,255,255,0.28); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07); padding:3px 7px; border-radius:4px; }

                .card-hiring-tag { position:absolute; top:13px; right:13px; display:flex; align-items:center; gap:5px; padding:3px 9px 3px 7px; border-radius:100px; background:rgba(93,186,136,0.14); border:1px solid rgba(93,186,136,0.28); font-size:9px; font-weight:500; color:#5dba88; letter-spacing:0.08em; text-transform:uppercase; }
                .card-hiring-dot { width:5px; height:5px; border-radius:50%; background:#5dba88; animation:sonar 2.4s ease-out infinite; }

                .card-body { position:absolute; bottom:0; left:0; right:0; padding:17px; }
                .card-name { font-family:'Playfair Display',serif; font-size:18px; font-weight:500; color:#ede9e0; letter-spacing:-0.01em; margin-bottom:3px; line-height:1.1; }
                .card-city { font-size:11px; color:rgba(255,255,255,0.25); letter-spacing:0.03em; margin-bottom:10px; }
                .card-foot { display:flex; align-items:center; justify-content:space-between; }
                .card-spec { font-size:10px; color:rgba(255,255,255,0.16); max-width:150px; line-height:1.5; letter-spacing:0.02em; }
                .tag-open { font-size:10px; font-weight:500; padding:3px 9px; border-radius:100px; background:rgba(93,186,136,0.11); border:1px solid rgba(93,186,136,0.24); color:#5dba88; white-space:nowrap; }
                .tag-none { font-size:10px; padding:3px 9px; border-radius:100px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); color:rgba(255,255,255,0.18); white-space:nowrap; }

                footer { border-top:1px solid rgba(255,255,255,0.04); padding:26px 64px; display:flex; align-items:center; justify-content:space-between; max-width:1360px; margin:0 auto; }
                .f-brand { font-size:12px; color:rgba(255,255,255,0.18); }
                .f-copy { font-size:11px; color:rgba(255,255,255,0.1); }
                .f-login { font-size:11px; color:rgba(255,255,255,0.16); text-decoration:none; letter-spacing:0.04em; transition:color 0.2s; }
                .f-login:hover { color:rgba(255,255,255,0.42); }

                @keyframes fu { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                .fu { animation:fu 0.65s ease both; }

                @media(max-width:960px){
                    .nav{padding:16px 24px;}
                    .hero{grid-template-columns:1fr;gap:44px;padding:106px 24px 52px;}
                    .hero-right{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(255,255,255,0.05);padding-top:28px;}
                    .stat-row{grid-template-columns:1fr;text-align:center;border-right:1px solid rgba(255,255,255,0.05);border-bottom:none;padding:0 16px;}
                    .stat-row:last-child{border-right:none;}
                    .stat-num{text-align:center;font-size:36px;}
                    .chips{justify-content:center;}
                    .divider-wrap,.section{padding-left:24px;padding-right:24px;}
                    .grid-top{grid-template-columns:repeat(2,1fr);}
                    .grid-bot{max-width:100%;grid-template-columns:1fr;}
                    footer{flex-direction:column;gap:10px;text-align:center;padding:22px 24px;}
                }
            `}</style>

            {/* NAV */}
            <nav className="nav">
                <Link href="/" className="nav-logo">
                    <div className="logo-mark">V</div>
                    <span className="logo-text">VibeMe.AI</span>
                </Link>
                <div className="nav-links">
                    <a href="#offices" className="nav-link">Offices</a>
                    <a href="#offices" className="nav-link">Open Positions</a>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero">
                <div className="hero-left fu">
                    <div className="eyebrow">
                        <span className="eyebrow-line" />
                        <span className="eyebrow-text">Brycen Group · Asia Pacific</span>
                    </div>
                    <h1 className="hero-title">
                        Building the future<br />
                        of technology,<br />
                        <span className="italic">across Asia.</span>
                    </h1>
                    <p className="hero-body">
                        Five offices. One standard of excellence.
                        Connecting exceptional talent with Japan-quality
                        engineering across the region.
                    </p>

                    {totalOpenJobs > 0 ? (
                        <div className="status-pill hiring">
                            <div className="dot-wrap">
                                <span className="dot green" />
                                <span className="dot-ring" />
                            </div>
                            Actively hiring —&nbsp;
                            <span className="status-strong">
                                {totalOpenJobs} open position{totalOpenJobs > 1 ? "s" : ""}
                            </span>
                            &nbsp;across {hiringOffices.length} office{hiringOffices.length > 1 ? "s" : ""}
                        </div>
                    ) : (
                        <div className="status-pill">
                            <div className="dot-wrap"><span className="dot" /></div>
                            No open positions at this time — check back soon
                        </div>
                    )}
                </div>

                {/* STATS */}
                <div className="hero-right fu" style={{ animationDelay:"0.1s" }}>
                    <div className="stat-row">
                        <div className="stat-num">5</div>
                        <div>
                            <div className="stat-label">Countries</div>
                            <div className="stat-sub">JP · MM · KH · VN · KR</div>
                        </div>
                    </div>
                    <div className="stat-row">
                        <div className="stat-num">30+</div>
                        <div>
                            <div className="stat-label">Years of Experience</div>
                            <div className="stat-sub">Since 1995</div>
                        </div>
                    </div>
                    <div className="stat-row">
                        <div className={`stat-num ${totalOpenJobs > 0 ? "g" : "dim"}`}>
                            {totalOpenJobs}
                        </div>
                        <div>
                            <div className="stat-label">Open Positions</div>
                            {totalOpenJobs > 0 ? (
                                <div className="chips">
                                    {hiringOffices.map(o => (
                                        <span key={o.id} className="chip">{FLAGS[o.country_key]}</span>
                                    ))}
                                </div>
                            ) : (
                                <div className="stat-sub">Check back soon</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="divider-wrap"><div className="divider-line" /></div>

            {/* OFFICES */}
            <section className="section" id="offices">
                <div className="section-head">
                    <div>
                        <div className="s-eyebrow">Our Offices</div>
                        <div className="s-title">Where We Operate</div>
                    </div>
                    {totalOpenJobs > 0 && (
                        <div className="s-badge">
                            <span className="s-badge-dot" />
                            {totalOpenJobs} open position{totalOpenJobs !== 1 ? "s" : ""}
                        </div>
                    )}
                </div>

                <div className="grid-top">
                    {offices.slice(0,3).map((o,i) => <Card key={o.id} office={o} delay={i*0.07} />)}
                </div>
                {offices.length > 3 && (
                    <div className="grid-bot">
                        {offices.slice(3).map((o,i) => <Card key={o.id} office={o} delay={(i+3)*0.07} />)}
                    </div>
                )}
            </section>

            <footer>
                <span className="f-brand">VibeMe.AI</span>
                <span className="f-copy">© {new Date().getFullYear()} Brycen Group. All rights reserved.</span>
                <Link href="/login" className="f-login">Employee Portal →</Link>
            </footer>
        </>
    );
}

function Card({ office, delay }) {
    const hasJobs = office.open_job_postings_count > 0;
    return (
        <Link href={`/brycen/${office.country_key}`} className="card fu" style={{ animationDelay:`${delay}s` }}>
            <img src={office.image_path} alt={office.company_name} className="card-img"
                onError={e => { e.target.style.display="none"; }} />
            <div className="card-grad" />
            <div className="card-code">{FLAGS[office.country_key]}</div>
            {hasJobs && (
                <div className="card-hiring-tag">
                    <span className="card-hiring-dot" />
                    Hiring
                </div>
            )}
            <div className="card-body">
                <div className="card-name">{office.company_name}</div>
                <div className="card-city">{office.city}, {office.country_name}</div>
                <div className="card-foot">
                    <div className="card-spec">{office.specialization}</div>
                    {hasJobs
                        ? <span className="tag-open">{office.open_job_postings_count} Open</span>
                        : <span className="tag-none">No Openings</span>
                    }
                </div>
            </div>
        </Link>
    );
}
