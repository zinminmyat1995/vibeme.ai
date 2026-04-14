import { useEffect, useMemo, useState } from "react";
import { Link, useForm } from "@inertiajs/react";

const COUNTRY_LABELS = {
    myanmar: "MM",
    cambodia: "KH",
    japan: "JP",
    vietnam: "VN",
    korea: "KR",
};

const JOB_TYPE_LABELS = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    internship: "Internship",
};

function BulletList({ text }) {
    if (!text) return null;

    const items = text
        .split(String.fromCharCode(10))
        .map((l) => l.replace(/^[-•]\s*/, "").trim())
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
    const [theme, setTheme] = useState("dark");
    const [selectedJob, setSelectedJob] = useState(null);
    const [applyOpen, setApplyOpen] = useState(false);
    const [applyJob, setApplyJob] = useState(null);
    const [refCode, setRefCode] = useState(null);

    useEffect(() => {
        const saved =
            localStorage.getItem("brycen-theme") ||
            localStorage.getItem("vibeme-theme");

        const initial =
            saved ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light");

        setTheme(initial);
        document.documentElement.setAttribute("data-theme", initial);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("brycen-theme", theme);
    }, [theme]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone: "",
        cover_letter: "",
        cv: null,
    });

    const totalOpenPositions = useMemo(
        () => jobs.reduce((sum, job) => sum + (job.slots || 0), 0),
        [jobs]
    );

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

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
                reset();
            },
        });
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

                :root {
                    --bg: #f5f7f2;
                    --bg-soft: #edf1e8;
                    --panel: rgba(255,255,255,0.86);
                    --panel-strong: rgba(255,255,255,0.96);
                    --card: rgba(255,255,255,0.94);
                    --text: #131b12;
                    --muted: rgba(19,27,18,0.72);
                    --soft: rgba(19,27,18,0.48);
                    --line: rgba(17,26,13,0.08);
                    --line-strong: rgba(17,26,13,0.14);
                    --green: #2e7d3a;
                    --green-2: #4aaa58;
                    --green-soft: rgba(46,125,58,0.10);
                    --green-soft-2: rgba(46,125,58,0.16);
                    --green-text: #1f5e28;
                    --shadow: 0 20px 60px rgba(0,0,0,0.10);
                    --hero-overlay:
                        linear-gradient(to bottom, rgba(245,247,242,0.04), rgba(245,247,242,0.82) 72%, var(--bg) 100%);
                }

                html[data-theme="dark"] {
                    --bg: #0b0f09;
                    --bg-soft: #111609;
                    --panel: rgba(17,22,9,0.80);
                    --panel-strong: rgba(15,20,11,0.92);
                    --card: rgba(17,22,9,0.86);
                    --text: #e2e9d8;
                    --muted: rgba(226,233,216,0.72);
                    --soft: rgba(226,233,216,0.42);
                    --line: rgba(255,255,255,0.07);
                    --line-strong: rgba(255,255,255,0.12);
                    --green: #4aaa58;
                    --green-2: #6fcb7d;
                    --green-soft: rgba(74,170,88,0.12);
                    --green-soft-2: rgba(74,170,88,0.18);
                    --green-text: #84d891;
                    --shadow: 0 22px 60px rgba(0,0,0,0.40);
                    --hero-overlay:
                        linear-gradient(to bottom, rgba(11,15,9,0.12), rgba(11,15,9,0.56) 46%, rgba(11,15,9,0.95) 100%);
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }
                html { scroll-behavior: smooth; }
                body {
                    background:
                        radial-gradient(circle at top left, rgba(74,170,88,0.12), transparent 24%),
                        linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 100%);
                    color: var(--text);
                    font-family: 'DM Sans', sans-serif;
                    overflow-x: hidden;
                    transition: background 0.3s, color 0.3s;
                }

                a { color: inherit; text-decoration: none; }
                img { display: block; max-width: 100%; }

                .page-shell { min-height: 100vh; }

                .topbar {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 14px 28px;
                    backdrop-filter: blur(18px);
                    background: color-mix(in srgb, var(--bg) 86%, transparent);
                    border-bottom: 1px solid var(--line);
                }

                .topbar-left,
                .topbar-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }

                .brand-logo {
                    width: 40px;
                    height: 40px;
                    object-fit: contain;
                    flex-shrink: 0;
                }

                .brand-meta {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.1;
                }

                .brand-name {
                    font-family: 'DM Serif Display', serif;
                    font-size: 20px;
                    color: var(--text);
                }

                .brand-sub {
                    font-size: 10px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: var(--soft);
                    margin-top: 2px;
                }

                .nav-link,
                .theme-btn,
                .back-btn,
                .hero-btn,
                .hero-btn-secondary,
                .visit-btn,
                .apply-btn,
                .apply-full-btn,
                .btn-cancel,
                .btn-submit,
                .done-btn,
                .modal-close {
                    font-family: 'DM Sans', sans-serif;
                    border: none;
                    cursor: pointer;
                }

                .nav-link,
                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: var(--muted);
                    padding: 8px 12px;
                    border-radius: 10px;
                    transition: 0.2s ease;
                }

                .nav-link:hover,
                .back-btn:hover {
                    background: var(--green-soft);
                    color: var(--green-text);
                }

                .theme-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    height: 38px;
                    padding: 0 14px;
                    border-radius: 999px;
                    background: var(--panel);
                    border: 1px solid var(--line-strong);
                    color: var(--text);
                    font-size: 12px;
                    font-weight: 700;
                    box-shadow: var(--shadow);
                }

                .hero {
                    position: relative;
                    min-height: 480px;
                    overflow: hidden;
                    border-bottom: 1px solid var(--line);
                }

                .hero-image {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: brightness(0.42) saturate(0.78);
                }

                html[data-theme="light"] .hero-image {
                    filter: brightness(0.62) saturate(0.86);
                }

                .hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: var(--hero-overlay);
                }

                .hero-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 58px 28px 42px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    min-height: 480px;
                }

                .hero-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
                    gap: 24px;
                    align-items: end;
                }

                .hero-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: clamp(40px, 5vw, 64px);
                    line-height: 0.98;
                    letter-spacing: -0.03em;
                    color: var(--text);
                    margin-bottom: 10px;
                }

                .hero-city {
                    font-size: 15px;
                    color: var(--muted);
                    margin-bottom: 18px;
                }

                .hero-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .hero-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 13px 18px;
                    border-radius: 12px;
                    background: var(--green);
                    color: #fff;
                    font-size: 13px;
                    font-weight: 700;
                    transition: 0.2s ease;
                }

                .hero-btn:hover {
                    background: var(--green-2);
                    transform: translateY(-1px);
                }

                .hero-btn-secondary,
                .visit-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 13px 18px;
                    border-radius: 12px;
                    background: var(--panel);
                    border: 1px solid var(--line-strong);
                    color: var(--text);
                    font-size: 13px;
                    font-weight: 600;
                }

                .content {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 34px 28px 90px;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 360px;
                    gap: 26px;
                    align-items: start;
                }

                .section-card,
                .job-card,
                .no-jobs-wrap,
                .map-wrap {
                    background: var(--panel);
                    border: 1px solid var(--line);
                    box-shadow: var(--shadow);
                }

                .section-card {
                    border-radius: 20px;
                    padding: 24px;
                    margin-bottom: 18px;
                }

                .card-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: var(--soft);
                    margin-bottom: 14px;
                }

                .about-text {
                    font-size: 14px;
                    line-height: 1.9;
                    color: var(--muted);
                }

                .meta-row {
                    display: grid;
                    grid-template-columns: 180px 1fr;
                    gap: 18px;
                    margin-top: 20px;
                    padding-top: 18px;
                    border-top: 1px solid var(--line);
                }

                .meta-key {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.10em;
                    text-transform: uppercase;
                    color: var(--soft);
                    margin-bottom: 6px;
                }

                .meta-val {
                    font-family: 'DM Serif Display', serif;
                    font-size: 24px;
                    color: var(--text);
                    line-height: 1.05;
                }

                .meta-val-sm {
                    font-size: 13px;
                    color: var(--muted);
                    line-height: 1.7;
                }

                .jobs-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    margin: 8px 0 18px;
                    flex-wrap: wrap;
                }

                .jobs-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 30px;
                    color: var(--text);
                    letter-spacing: -0.02em;
                }

                .jobs-count-badge {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--green-text);
                    background: var(--green-soft);
                    border: 1px solid var(--green-soft-2);
                    padding: 6px 14px;
                    border-radius: 999px;
                }

                .job-card {
                    border-radius: 18px;
                    padding: 22px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: 0.25s ease;
                }

                .job-card:hover {
                    border-color: var(--green-soft-2);
                    transform: translateY(-2px);
                }

                .job-card.active {
                    border-color: var(--green);
                    background: color-mix(in srgb, var(--panel) 84%, var(--green-soft));
                }

                .job-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 14px;
                }

                .job-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 23px;
                    line-height: 1.08;
                    letter-spacing: -0.01em;
                    color: var(--text);
                    margin-bottom: 5px;
                }

                .job-dept {
                    font-size: 12px;
                    color: var(--soft);
                }

                .apply-btn {
                    padding: 9px 16px;
                    border-radius: 10px;
                    background: var(--green-soft);
                    border: 1px solid var(--green-soft-2);
                    color: var(--green-text);
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    transition: 0.2s ease;
                }

                .apply-btn:hover,
                .apply-full-btn:hover,
                .btn-submit:hover:not(:disabled),
                .done-btn:hover {
                    background: var(--green);
                    border-color: var(--green);
                    color: #fff;
                }

                .job-pills {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 14px;
                }

                .pill {
                    padding: 5px 12px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                }

                .pill-type {
                    background: rgba(99,102,241,0.10);
                    border: 1px solid rgba(99,102,241,0.18);
                    color: #7b82ff;
                }

                .pill-slots {
                    background: var(--green-soft);
                    border: 1px solid var(--green-soft-2);
                    color: var(--green-text);
                }

                .pill-salary {
                    background: rgba(245,158,11,0.10);
                    border: 1px solid rgba(245,158,11,0.18);
                    color: #c88918;
                }

                .job-deadline {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    margin-top: 12px;
                    font-size: 12px;
                    color: var(--muted);
                }

                .job-deadline-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 999px;
                    background: #ef4444;
                    display: inline-block;
                }

                .job-expand {
                    border-top: 1px solid var(--line);
                    margin-top: 18px;
                    padding-top: 18px;
                }

                .expand-label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.11em;
                    text-transform: uppercase;
                    color: var(--soft);
                    margin-top: 16px;
                    margin-bottom: 8px;
                }

                .bullet-list {
                    list-style: none;
                    display: grid;
                    gap: 8px;
                }

                .bullet-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 13px;
                    color: var(--muted);
                    line-height: 1.8;
                }

                .bullet-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 999px;
                    background: var(--green);
                    flex-shrink: 0;
                    margin-top: 8px;
                }

                .apply-full-btn,
                .btn-submit,
                .done-btn {
                    width: 100%;
                    margin-top: 20px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    background: var(--green-soft);
                    border: 1px solid var(--green-soft-2);
                    color: var(--green-text);
                    font-size: 13px;
                    font-weight: 700;
                    transition: 0.2s ease;
                }

                .no-jobs-wrap {
                    position: relative;
                    border-radius: 20px;
                    padding: 48px 32px;
                    text-align: center;
                    overflow: hidden;
                }

                .no-jobs-bg {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at top, rgba(74,170,88,0.10), transparent 64%);
                    pointer-events: none;
                }

                .no-jobs-icon {
                    position: relative;
                    z-index: 1;
                    width: 56px;
                    height: 56px;
                    margin: 0 auto 18px;
                    border-radius: 16px;
                    background: var(--green-soft);
                    border: 1px solid var(--green-soft-2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }

                .no-jobs-title {
                    position: relative;
                    z-index: 1;
                    font-family: 'DM Serif Display', serif;
                    font-size: 26px;
                    color: var(--text);
                    margin-bottom: 8px;
                }

                .no-jobs-sub {
                    position: relative;
                    z-index: 1;
                    font-size: 13px;
                    color: var(--muted);
                    line-height: 1.8;
                    max-width: 360px;
                    margin: 0 auto 24px;
                }

                .contact-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--line);
                }

                .contact-row:last-child { border-bottom: none; }

                .contact-icon {
                    width: 20px;
                    text-align: center;
                    flex-shrink: 0;
                    color: var(--soft);
                }

                .contact-val,
                .contact-link {
                    font-size: 13px;
                    color: var(--muted);
                    line-height: 1.7;
                    word-break: break-word;
                }

                .contact-link:hover {
                    color: var(--green-text);
                }

                .map-wrap {
                    border-radius: 18px;
                    overflow: hidden;
                    margin-top: 18px;
                }

                .map-iframe {
                    width: 100%;
                    height: 240px;
                    border: none;
                    display: block;
                }

                /* Premium Modal */
                .modal-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 200;
                    background:
                        radial-gradient(circle at top, rgba(74,170,88,0.10), transparent 32%),
                        rgba(3, 5, 4, 0.72);
                    backdrop-filter: blur(16px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .modal {
                    width: 100%;
                    max-width: 620px;
                    max-height: min(90vh, 860px);
                    overflow-y: auto;
                    background:
                        linear-gradient(180deg, color-mix(in srgb, var(--panel-strong) 92%, transparent), var(--panel));
                    border: 1px solid color-mix(in srgb, var(--green) 18%, var(--line-strong));
                    border-radius: 28px;
                    padding: 30px;
                    box-shadow:
                        0 30px 80px rgba(0,0,0,0.38),
                        inset 0 1px 0 rgba(255,255,255,0.04);
                    animation: modalPop 0.25s ease;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .modal::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                    display: none;
                }

                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.965) translateY(14px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .modal-head {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 14px;
                    margin-bottom: 22px;
                    padding-bottom: 18px;
                    border-bottom: 1px solid var(--line);
                }

                .modal-head-left {
                    min-width: 0;
                }

                .modal-kicker {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 999px;
                    background: var(--green-soft);
                    border: 1px solid var(--green-soft-2);
                    color: var(--green-text);
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }

                .modal-kicker-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 999px;
                    background: var(--green);
                    animation: pulseDot 2s ease-in-out infinite;
                }

                .modal-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 34px;
                    line-height: 1.02;
                    color: var(--text);
                    letter-spacing: -0.03em;
                    margin-bottom: 6px;
                }

                .modal-sub {
                    font-size: 13px;
                    color: var(--muted);
                    line-height: 1.7;
                }

                .modal-close {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: color-mix(in srgb, var(--panel) 84%, transparent);
                    border: 1px solid var(--line-strong);
                    color: var(--soft);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    transition: 0.2s ease;
                    flex-shrink: 0;
                }

                .modal-close:hover {
                    color: var(--text);
                    border-color: var(--green-soft-2);
                    background: var(--green-soft);
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 14px;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group.full {
                    grid-column: 1 / -1;
                }

                .form-label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--soft);
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .form-input {
                    width: 100%;
                    padding: 14px 16px;
                    border-radius: 16px;
                    background: color-mix(in srgb, var(--panel) 76%, transparent);
                    border: 1px solid var(--line-strong);
                    color: var(--text);
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    transition: 0.2s ease;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
                }

                .form-input:focus {
                    border-color: color-mix(in srgb, var(--green) 60%, transparent);
                    box-shadow: 0 0 0 4px rgba(74,170,88,0.10);
                }

                .form-input.err {
                    border-color: rgba(239,68,68,0.45);
                }

                .form-input::placeholder {
                    color: var(--soft);
                }

                textarea.form-input {
                    min-height: 128px;
                    resize: vertical;
                }

                .form-error {
                    margin-top: 6px;
                    font-size: 11px;
                    color: #ef4444;
                }

                .file-label {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border-radius: 18px;
                    background:
                        linear-gradient(180deg, color-mix(in srgb, var(--panel) 80%, transparent), color-mix(in srgb, var(--panel) 92%, transparent));
                    border: 1px dashed color-mix(in srgb, var(--green) 22%, var(--line-strong));
                    cursor: pointer;
                    color: var(--muted);
                    font-size: 14px;
                    transition: 0.2s ease;
                }

                .file-label:hover {
                    border-color: color-mix(in srgb, var(--green) 45%, transparent);
                    background: var(--green-soft);
                    color: var(--text);
                }

                .file-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.05);
                    flex-shrink: 0;
                    font-size: 16px;
                }

                .file-meta {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                }

                .file-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text);
                    margin-bottom: 2px;
                }

                .file-sub {
                    font-size: 12px;
                    color: var(--soft);
                }

                .modal-btns {
                    display: flex;
                    gap: 12px;
                    margin-top: 26px;
                    padding-top: 6px;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 13px 16px;
                    border-radius: 14px;
                    background: color-mix(in srgb, var(--panel) 90%, transparent);
                    border: 1px solid var(--line-strong);
                    color: var(--muted);
                    font-size: 13px;
                    font-weight: 700;
                    transition: 0.2s ease;
                }

                .btn-cancel:hover {
                    color: var(--text);
                    background: color-mix(in srgb, var(--panel) 70%, transparent);
                }

                .btn-submit {
                    flex: 1.4;
                    margin-top: 0;
                    padding: 13px 16px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, var(--green), var(--green-2));
                    border: 1px solid transparent;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 800;
                    box-shadow: 0 12px 26px rgba(74,170,88,0.18);
                }

                .btn-submit:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                .success-box {
                    text-align: center;
                    padding: 18px 4px 6px;
                }

                .success-emoji {
                    font-size: 52px;
                    margin-bottom: 14px;
                }

                .success-title {
                    font-family: 'DM Serif Display', serif;
                    font-size: 30px;
                    color: var(--text);
                    margin-bottom: 6px;
                }

                .success-caption {
                    font-size: 12px;
                    color: var(--soft);
                    margin-bottom: 6px;
                }

                .ref-code {
                    display: inline-block;
                    padding: 12px 26px;
                    border-radius: 12px;
                    background: var(--green-soft);
                    border: 1px solid var(--green-soft-2);
                    color: var(--green-text);
                    font-size: 18px;
                    font-weight: 700;
                    letter-spacing: 0.10em;
                    margin: 14px 0 16px;
                }

                .success-note {
                    font-size: 13px;
                    color: var(--muted);
                    line-height: 1.8;
                }

                .done-btn {
                    margin-top: 24px;
                }

                @media (max-width: 1024px) {
                    .hero-grid,
                    .content-grid {
                        grid-template-columns: 1fr;
                    }

                    .hero-inner,
                    .content {
                        padding-left: 22px;
                        padding-right: 22px;
                    }

                    .topbar {
                        padding: 14px 22px;
                    }
                }

                @media (max-width: 680px) {
                    .topbar {
                        flex-wrap: wrap;
                        justify-content: space-between;
                    }

                    .topbar-right {
                        width: 100%;
                        justify-content: flex-end;
                    }

                    .hero {
                        min-height: 400px;
                    }

                    .hero-inner {
                        min-height: 400px;
                        padding-top: 32px;
                        padding-bottom: 28px;
                    }

                    .hero-title {
                        font-size: 40px;
                    }

                    .hero-actions {
                        width: 100%;
                    }

                    .hero-btn,
                    .hero-btn-secondary,
                    .visit-btn {
                        width: 100%;
                    }

                    .section-card,
                    .job-card {
                        padding: 20px;
                    }

                    .meta-row {
                        grid-template-columns: 1fr;
                    }

                    .job-top {
                        flex-direction: column;
                    }

                    .apply-btn {
                        width: 100%;
                    }

                    .modal {
                        padding: 20px;
                        border-radius: 22px;
                    }

                    .modal-title {
                        font-size: 28px;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .modal-btns {
                        flex-direction: column;
                    }
                    .nav-logo-txt{font-family:'DM Serif Display',serif;font-size:16px;color:var(--text);}
                    .nav-logo-txt b{color:var(--green);font-weight:400;}
                }
            `}</style>

            <div className="page-shell">
                <nav className="topbar">
                    <div className="topbar-left">
                        <Link href="/" className="back-btn">← Back</Link>

                        <Link href="/" className="brand">
                            <img
                                src="/images/main-logo.svg"
                                alt="VibeMe.AI"
                                className="brand-logo"
                            />
                            <span className="nav-logo-txt" style={{fontFamily: "DM Serif Display",fontSize: "16px", color: "var(--text)"}}>VibeMe<b style={{color: "var(--green)", fontWeight: "400"}}>.AI</b></span>
                        </Link>
                    </div>

                    <div className="topbar-right">
                        <a href="#open-jobs" className="nav-link">Open Positions</a>

                        <button type="button" className="theme-btn" onClick={toggleTheme}>
                            <span>{theme === "dark" ? "☀" : "☾"}</span>
                            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                        </button>
                    </div>
                </nav>

                <section className="hero">
                    <img
                        src={office.image_path}
                        alt={office.company_name}
                        className="hero-image"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div className="hero-overlay" />

                    <div className="hero-inner">
                        <div className="hero-grid">
                            <div>
                                <h1 className="hero-title">{office.company_name}</h1>
                                <div className="hero-city">{office.city}, {office.country_name}</div>

                                <div className="hero-actions">
                                    {jobs.length > 0 && (
                                        <a href="#open-jobs" className="hero-btn">
                                            View Open Positions →
                                        </a>
                                    )}

                                    <a
                                        href={office.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="visit-btn"
                                    >
                                        Visit Website ↗
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="content">
                    <div className="content-grid">
                        <div>
                            <div className="section-card">
                                <div className="card-label">Company Overview</div>
                                <div className="about-text">{office.about}</div>

                                <div className="meta-row">
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

                            <div className="jobs-section" id="open-jobs">
                                <div className="jobs-head">
                                    <div className="jobs-title">Open Positions</div>
                                    {jobs.length > 0 && (
                                        <div className="jobs-count-badge">
                                            {jobs.length} job{jobs.length > 1 ? "s" : ""} open
                                        </div>
                                    )}
                                </div>

                                {jobs.length === 0 ? (
                                    <div className="no-jobs-wrap">
                                        <div className="no-jobs-bg" />
                                        <div className="no-jobs-icon">📋</div>
                                        <div className="no-jobs-title">No open positions</div>
                                        <div className="no-jobs-sub">
                                            We are not actively hiring for this office right now.
                                            You can still review the company profile and visit the official website.
                                        </div>
                                        <a
                                            href={office.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hero-btn-secondary"
                                            style={{ position: "relative", zIndex: 1, width: "fit-content", margin: "0 auto" }}
                                        >
                                            Visit {office.company_name} ↗
                                        </a>
                                    </div>
                                ) : (
                                    jobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className={`job-card ${selectedJob === job.id ? "active" : ""}`}
                                            onClick={() =>
                                                setSelectedJob(selectedJob === job.id ? null : job.id)
                                            }
                                        >
                                            <div className="job-top">
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="job-title">{job.title}</div>
                                                    {job.department && (
                                                        <div className="job-dept">{job.department}</div>
                                                    )}

                                                    <div className="job-pills">
                                                        <span className="pill pill-type">
                                                            {JOB_TYPE_LABELS[job.type] || job.type}
                                                        </span>

                                                        <span className="pill pill-slots">
                                                            {job.slots} position{job.slots > 1 ? "s" : ""}
                                                        </span>

                                                        {job.salary_range && (
                                                            <span className="pill pill-salary">
                                                                {job.currency_code ? `${job.currency_code} ` : ""}
                                                                {job.salary_range}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {job.deadline && (
                                                        <div className="job-deadline">
                                                            <span className="job-deadline-dot" />
                                                            Apply by {job.deadline}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    className="apply-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApply(job);
                                                    }}
                                                >
                                                    Apply
                                                </button>
                                            </div>

                                            {selectedJob === job.id && (
                                                <div className="job-expand">
                                                    <div className="expand-label">Description</div>
                                                    <BulletList text={job.description} />

                                                    {job.requirements && (
                                                        <>
                                                            <div className="expand-label">Requirements</div>
                                                            <BulletList text={job.requirements} />
                                                        </>
                                                    )}

                                                    {job.responsibilities && (
                                                        <>
                                                            <div className="expand-label">Responsibilities</div>
                                                            <BulletList text={job.responsibilities} />
                                                        </>
                                                    )}

                                                    <button
                                                        className="apply-full-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApply(job);
                                                        }}
                                                    >
                                                        Apply for this position →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="section-card">
                                <div className="card-label">Contact</div>

                                <div className="contact-row">
                                    <span className="contact-icon">📍</span>
                                    <span className="contact-val">{office.address}</span>
                                </div>

                                <div className="contact-row">
                                    <span className="contact-icon">✉</span>
                                    <a href={`mailto:${office.email}`} className="contact-link">
                                        {office.email}
                                    </a>
                                </div>

                                <div className="contact-row">
                                    <span className="contact-icon">☎</span>
                                    <span className="contact-val">{office.phone}</span>
                                </div>

                                <div className="contact-row">
                                    <span className="contact-icon">🌐</span>
                                    <a
                                        href={office.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="contact-link"
                                    >
                                        {office.website_url.replace(/^https?:\/\//, "")}
                                    </a>
                                </div>
                            </div>

                            <div className="map-wrap">
                                <iframe
                                    src={office.map_embed_url}
                                    className="map-iframe"
                                    allowFullScreen
                                    loading="lazy"
                                    title={`${office.company_name} location`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {applyOpen && (
                    <div className="modal-bg" onClick={() => setApplyOpen(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            {refCode ? (
                                <div className="success-box">
                                    <div className="success-emoji">✦</div>
                                    <div className="success-title">Application Submitted</div>
                                    <div className="success-caption">Your reference code</div>
                                    <div className="ref-code">{refCode}</div>
                                    <div className="success-note">
                                        Save this code to track your application.<br />
                                        Our HR team will reach out to{" "}
                                        <span style={{ color: "var(--text)" }}>{data.email}</span>.
                                    </div>

                                    <button
                                        className="done-btn"
                                        onClick={() => setApplyOpen(false)}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="modal-head">
                                        <div className="modal-head-left">
                                            <div className="modal-kicker">
                                                <span className="modal-kicker-dot" />
                                                Job Application
                                            </div>
                                            <div className="modal-title">{applyJob?.title}</div>
                                            <div className="modal-sub">
                                                {office.company_name} · {office.city}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="modal-close"
                                            onClick={() => setApplyOpen(false)}
                                            aria-label="Close"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <form onSubmit={submitApply}>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label className="form-label">Full Name *</label>
                                                <input
                                                    className={`form-input ${errors.name ? "err" : ""}`}
                                                    value={data.name}
                                                    onChange={(e) => setData("name", e.target.value)}
                                                    placeholder="Your full name"
                                                />
                                                {errors.name && <div className="form-error">{errors.name}</div>}
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Email *</label>
                                                <input
                                                    type="email"
                                                    className={`form-input ${errors.email ? "err" : ""}`}
                                                    value={data.email}
                                                    onChange={(e) => setData("email", e.target.value)}
                                                    placeholder="your@email.com"
                                                />
                                                {errors.email && <div className="form-error">{errors.email}</div>}
                                            </div>

                                            <div className="form-group full">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    className="form-input"
                                                    value={data.phone}
                                                    onChange={(e) => setData("phone", e.target.value)}
                                                    placeholder="+95 9..."
                                                />
                                            </div>

                                            <div className="form-group full">
                                                <label className="form-label">Cover Letter</label>
                                                <textarea
                                                    className="form-input"
                                                    rows={4}
                                                    value={data.cover_letter}
                                                    onChange={(e) => setData("cover_letter", e.target.value)}
                                                    placeholder="Tell us why you're a great fit..."
                                                />
                                            </div>

                                            <div className="form-group full">
                                                <label className="form-label">
                                                    CV / Resume * — PDF, DOC, DOCX · max 5MB
                                                </label>

                                                <label className="file-label">
                                                    <span className="file-icon">📎</span>

                                                    <span className="file-meta">
                                                        <span className="file-title">
                                                            {data.cv ? data.cv.name : "Upload your CV"}
                                                        </span>
                                                        <span className="file-sub">
                                                            {data.cv ? "File selected" : "Click to browse from your device"}
                                                        </span>
                                                    </span>

                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        style={{ display: "none" }}
                                                        onChange={(e) => setData("cv", e.target.files[0])}
                                                    />
                                                </label>

                                                {errors.cv && <div className="form-error">{errors.cv}</div>}
                                            </div>
                                        </div>

                                        <div className="modal-btns">
                                            <button
                                                type="button"
                                                className="btn-cancel"
                                                onClick={() => setApplyOpen(false)}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                className="btn-submit"
                                                disabled={processing}
                                            >
                                                {processing ? "Applying..." : "Apply Application →"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}