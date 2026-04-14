import { useState, useMemo, useRef, useEffect } from "react";
import { router, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { createPortal } from "react-dom";

// ── Constants ─────────────────────────────────────────────────────
const JOB_TYPE_OPTS = [
    { value:"full_time",  label:"Full Time"  },
    { value:"part_time",  label:"Part Time"  },
    { value:"contract",   label:"Contract"   },
    { value:"internship", label:"Internship" },
];
const APP_STATUS_OPTS = [
    { value:"new",       label:"New",       color:"#6366f1", bg:"#eef2ff",  darkBg:"rgba(99,102,241,0.16)"  },
    { value:"reviewing", label:"Reviewing", color:"#d97706", bg:"#fef3c7",  darkBg:"rgba(217,119,6,0.16)"   },
    { value:"interview", label:"Interview", color:"#0891b2", bg:"#e0f2fe",  darkBg:"rgba(8,145,178,0.16)"   },
    { value:"accepted",  label:"Accepted",  color:"#059669", bg:"#d1fae5",  darkBg:"rgba(5,150,105,0.16)"   },
    { value:"rejected",  label:"Rejected",  color:"#dc2626", bg:"#fee2e2",  darkBg:"rgba(220,38,38,0.16)"   },
];
const JOB_STATUS_OPTS = [
    { value:"open",   label:"Open",   color:"#059669", bg:"#d1fae5", darkBg:"rgba(5,150,105,0.16)"  },
    { value:"paused", label:"Paused", color:"#d97706", bg:"#fef3c7", darkBg:"rgba(217,119,6,0.16)"  },
    { value:"closed", label:"Closed", color:"#6b7280", bg:"#f3f4f6", darkBg:"rgba(107,114,128,0.16)"},
];
const sCfg = (val, opts) => opts.find(o => o.value === val) || opts[0];
const toArr = str => { if (!str) return [""]; const lines = str.split("\n").map(l => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean); return lines.length ? lines : [""]; };
const toStr = arr => arr.filter(s => s.trim()).map(s => `- ${s.trim()}`).join("\n");
const gToast = (msg, type = "success") => window.dispatchEvent(new CustomEvent("global-toast", { detail: { message: msg, type } }));

// ── Dark mode hook ─────────────────────────────────────────────────
function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === "undefined") return false;
        return document.documentElement.getAttribute("data-theme") === "dark"
            || localStorage.getItem("vibeme-theme") === "dark";
    };
    const [dark, setDark] = useState(getDark);
    useEffect(() => {
        const sync = () => setDark(getDark());
        window.addEventListener("vibeme-theme-change", sync);
        window.addEventListener("storage", sync);
        return () => { window.removeEventListener("vibeme-theme-change", sync); window.removeEventListener("storage", sync); };
    }, []);
    return dark;
}

// ── Theme tokens ───────────────────────────────────────────────────
function getTheme(dark) {
    if (dark) return {
        bg: "#0b1324", surface: "#1e293b", surfaceSoft: "rgba(255,255,255,0.04)",
        border: "rgba(148,163,184,0.12)", borderMed: "rgba(148,163,184,0.2)",
        text: "#f8fafc", textSoft: "#cbd5e1", textMute: "#64748b",
        inputBg: "rgba(255,255,255,0.06)", inputBorder: "rgba(148,163,184,0.18)",
        tableHead: "rgba(255,255,255,0.03)", rowAlt: "rgba(255,255,255,0.02)",
        shadow: "0 1px 3px rgba(0,0,0,0.3)",
        primary: "#8b5cf6", primarySoft: "rgba(139,92,246,0.16)",
        success: "#34d399", successSoft: "rgba(52,211,153,0.14)",
        warning: "#fbbf24", warningSoft: "rgba(251,191,36,0.14)",
        danger: "#f87171", dangerSoft: "rgba(248,113,113,0.14)",
        menuBg: "linear-gradient(180deg,rgba(15,23,42,0.99) 0%,rgba(10,18,36,0.99) 100%)",
    };
    return {
        bg: "#f1f5f9", surface: "#ffffff", surfaceSoft: "#f9fafb",
        border: "#e5e7eb", borderMed: "#d1d5db",
        text: "#111827", textSoft: "#374151", textMute: "#9ca3af",
        inputBg: "#ffffff", inputBorder: "#e5e7eb",
        tableHead: "#f9fafb", rowAlt: "#fafafa",
        shadow: "0 1px 3px rgba(0,0,0,0.06)",
        primary: "#7c3aed", primarySoft: "#ede9fe",
        success: "#059669", successSoft: "#d1fae5",
        warning: "#d97706", warningSoft: "#fef3c7",
        danger: "#dc2626", dangerSoft: "#fef2f2",
        menuBg: "#ffffff",
    };
}

// ── PremiumSelect ──────────────────────────────────────────────────
function PremiumSelect({ options = [], value = "", onChange, placeholder = "Select…", disabled = false, width = "auto", zIndex = 3000, dark, theme }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const selected = options.find(o => String(o.value) === String(value) && !o.disabled);

    useEffect(() => {
        const h = e => { if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return; setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    function handleOpen() {
        if (disabled) return;
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            const menuH = Math.min(options.length * 40 + 12, 260);
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow < menuH ? rect.top + window.scrollY - menuH - 4 : rect.bottom + window.scrollY + 4;
            setPos({ top, left: rect.left + window.scrollX, width: rect.width });
        }
        setOpen(v => !v);
    }

    const triggerBg = dark
        ? "linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.04) 100%)"
        : "linear-gradient(180deg,#fff 0%,#f8fafc 100%)";

    return (
        <>
            <button ref={triggerRef} type="button" onClick={handleOpen} style={{
                width, height: 38, padding: "0 12px", borderRadius: 8,
                border: `1.5px solid ${open ? theme.primary : theme.inputBorder}`,
                background: disabled ? theme.surfaceSoft : triggerBg,
                color: selected ? theme.text : theme.textMute,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: selected ? 600 : 400,
                boxShadow: open ? `0 0 0 3px ${dark ? "rgba(139,92,246,0.18)" : "rgba(124,58,237,0.12)"}` : "none",
                transition: "all 0.16s", opacity: disabled ? 0.5 : 1, outline: "none", fontFamily: "inherit",
            }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected?.label ?? placeholder}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5"
                    style={{ flexShrink: 0, transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            {open && createPortal(
                <div ref={menuRef} style={{
                    position: "absolute", top: pos.top, left: pos.left, width: pos.width, zIndex,
                    background: theme.menuBg, border: `1px solid ${theme.borderMed}`, borderRadius: 10,
                    boxShadow: dark ? "0 16px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.04)" : "0 16px 40px rgba(15,23,42,0.14)",
                    overflow: "hidden", animation: "rcDropIn 0.15s ease", backdropFilter: dark ? "blur(20px)" : "none",
                }}>
                    <div style={{ maxHeight: 260, overflowY: "auto", padding: "4px", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                        {options.map(opt => {
                            const isSel = String(opt.value) === String(value);
                            return (
                                <button key={opt.value} type="button"
                                    onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                                    style={{
                                        width: "100%", padding: "8px 11px", border: "none", borderRadius: 7,
                                        background: isSel ? (dark ? theme.primarySoft : "#ede9fe") : "transparent",
                                        color: isSel ? theme.primary : opt.disabled ? theme.textMute : theme.text,
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        cursor: opt.disabled ? "not-allowed" : "pointer", fontSize: 13,
                                        fontWeight: isSel ? 700 : 500, textAlign: "left", marginBottom: 1,
                                        opacity: opt.disabled ? 0.45 : 1, transition: "background 0.1s", fontFamily: "inherit",
                                    }}
                                    onMouseEnter={e => { if (!isSel && !opt.disabled) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f5f3ff"; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <span>{opt.label}</span>
                                    {isSel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                </button>
                            );
                        })}
                    </div>
                </div>, document.body
            )}
        </>
    );
}

// ── Spinner ────────────────────────────────────────────────────────
function Spinner({ size = 14, color = "#7c3aed" }) {
    return <div style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: "50%", animation: "rcSpin 0.7s linear infinite", flexShrink: 0 }} />;
}

// ── StatusPill ─────────────────────────────────────────────────────
function StatusPill({ status, opts, dark, small }) {
    const cfg = sCfg(status, opts);
    const bg = dark ? cfg.darkBg : cfg.bg;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "2px 8px" : "3px 10px", borderRadius: 99, fontSize: small ? 10 : 11, fontWeight: 600, color: cfg.color, background: bg, whiteSpace: "nowrap" }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}

// ── ThemeInput helpers ─────────────────────────────────────────────
function useInpStyle(theme, dark) {
    return (err) => ({
        width: "100%", padding: "10px 13px",
        border: `1.5px solid ${err ? theme.danger : theme.inputBorder}`,
        borderRadius: 10, fontSize: 13, color: theme.text, outline: "none",
        fontFamily: "inherit", background: theme.inputBg,
        transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box",
        boxShadow: err ? `0 0 0 3px ${theme.dangerSoft}` : "none",
    });
}

// ── PillButton ─────────────────────────────────────────────────────
function PillBtn({ active, onClick, color, bg, darkBg, label, dark }) {
    const activeBg = dark ? darkBg : bg;
    return (
        <button type="button" onClick={onClick} style={{
            padding: "7px 16px", borderRadius: 99, cursor: "pointer",
            border: active ? `2px solid ${color}` : "1.5px solid rgba(148,163,184,0.25)",
            background: active ? activeBg : "transparent",
            color: active ? color : "inherit",
            fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s", fontFamily: "inherit",
        }}>{label}</button>
    );
}

// ── ListField ──────────────────────────────────────────────────────
function ListField({ label, required, items, onChange, placeholder, error, theme, dark }) {
    const inp = useInpStyle(theme, dark);
    const add    = () => onChange([...items, ""]);
    const remove = i  => onChange(items.filter((_,idx) => idx !== i));
    const upd    = (i,v) => { const n=[...items]; n[i]=v; onChange(n); };
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}{required && " *"}</label>
                <button type="button" onClick={add} style={{ fontSize: 11, color: theme.primary, background: theme.primarySoft, border: "none", padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>+ Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: theme.primary, fontSize: 15, flexShrink: 0, width: 14 }}>•</span>
                        <input value={item} onChange={e => upd(i, e.target.value)}
                            placeholder={placeholder || "Add item..."}
                            style={{ ...inp(error && !item.trim()), flex: 1, padding: "8px 11px" }}
                            onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                            onBlur={e => { e.target.style.borderColor = error && !item.trim() ? theme.danger : theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        {items.length > 1 && (
                            <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "none", color: theme.textMute, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>×</button>
                        )}
                    </div>
                ))}
            </div>
            {error && <div style={{ fontSize: 11, color: theme.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><span>⚠</span> {error}</div>}
        </div>
    );
}

// ── ModalShell ─────────────────────────────────────────────────────
function ModalShell({ onClose, maxWidth = 600, children }) {
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17,24,39,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth, maxHeight: "92vh", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.26)", animation: "rcPopIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ grad, icon, subtitle, title, onClose }) {
    return (
        <div style={{ background: grad, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{subtitle}</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{title}</div>
                </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}>×</button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
export default function RecruitmentIndex({ offices = [], jobs = [], recentApps = [] }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [tab, setTab]                       = useState("jobs");
    const [selectedJob, setSelectedJob]       = useState(() => jobs.length > 0 ? jobs[0] : null);
    const [jobModal, setJobModal]             = useState(false);
    const [editJob, setEditJob]               = useState(null);
    const [filterOffice, setFilterOffice]     = useState("all");
    const [filterStatus, setFilterStatus]     = useState("all");
    const [appFilter, setAppFilter]           = useState("all");
    const [appSort, setAppSort]               = useState("latest");
    const [jobSearch, setJobSearch]           = useState("");
    const [noteModal, setNoteModal]           = useState(null);
    const [interviewModal, setInterviewModal] = useState(null);
    const [scoreModal, setScoreModal]         = useState(null);
    const [selectedApps, setSelectedApps]     = useState([]);
    const [bulkModal, setBulkModal]           = useState(false);
    const [deleteModal, setDeleteModal]       = useState(null);
    const [deleteJobModal, setDeleteJobModal] = useState(null);

    const totalJobs = jobs.length;
    const openJobs  = jobs.filter(j => j.status === "open").length;
    const totalApps = jobs.reduce((s, j) => s + (j.applications_count || 0), 0);
    const newApps   = recentApps.filter(a => a.status === "new").length;

    const filteredJobs = useMemo(() => jobs.filter(j => {
        if (filterOffice !== "all" && j.office?.id !== parseInt(filterOffice)) return false;
        if (filterStatus !== "all" && j.status !== filterStatus) return false;
        if (jobSearch && !j.title.toLowerCase().includes(jobSearch.toLowerCase()) && !j.office?.company_name?.toLowerCase().includes(jobSearch.toLowerCase())) return false;
        return true;
    }), [jobs, filterOffice, filterStatus, jobSearch]);

    const selectedJobApps = useMemo(() => selectedJob ? recentApps.filter(a => a.job_posting_id === selectedJob.id) : [], [selectedJob, recentApps]);
    const filteredApps = useMemo(() => {
        let apps = appFilter === "all" ? selectedJobApps : selectedJobApps.filter(a => a.status === appFilter);
        if (appSort === "name")  apps = [...apps].sort((a, b) => a.name.localeCompare(b.name));
        if (appSort === "score") apps = [...apps].sort((a, b) => (b.interview?.score ?? -1) - (a.interview?.score ?? -1));
        return apps;
    }, [selectedJobApps, appFilter, appSort]);

    const toggleSelect = id => setSelectedApps(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll    = ()  => setSelectedApps(p => p.length === filteredApps.length ? [] : filteredApps.map(a => a.id));
    const allSelected  = filteredApps.length > 0 && selectedApps.length === filteredApps.length;
    const handleSelectJob = job => { setSelectedJob(job); setAppFilter("all"); setSelectedApps([]); };

    const inp = useInpStyle(theme, dark);
    const lbl = { fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };

    // ── Office & Status options for PremiumSelect ──
    const officeOpts = [{ value: "all", label: "All Countries" }, ...offices.map(o => ({ value: o.id, label: o.company_name }))];
    const jobStatusOpts = [{ value: "all", label: "All Status" }, ...JOB_STATUS_OPTS.map(s => ({ value: s.value, label: s.label }))];
    const appSortOpts = [{ value: "latest", label: "Latest First" }, { value: "name", label: "Name A–Z" }, { value: "score", label: "By Score" }];


    function ActionGlyph({ type, color }) {
        if (type === 'edit') {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
            );
        }

        if (type === 'delete') {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
            );
        }

        return null;
    }
    return (
        <AppLayout title="Recruitment">
            <style>{`
                @keyframes rcSpin   { to { transform: rotate(360deg) } }
                @keyframes rcDropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes rcPopIn  { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes rcFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                .rc-job-item:hover  { background: ${dark ? "rgba(255,255,255,0.04)" : "#fafafa"} !important; }
                .rc-app-card:hover  { box-shadow: ${dark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.07)"} !important; }
                .rc-tbl-row:hover td { background: ${dark ? "rgba(255,255,255,0.03)" : "#fafbff"} !important; }
                .rc-tab-btn:hover   { background: ${dark ? "rgba(255,255,255,0.06)" : "#f0f0f0"} !important; }
            `}</style>

            <div style={{ animation: "rcFadeUp 0.25s ease" }}>

                {/* ── Stats ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
                    {[
                        { n: totalJobs, l: "Total Postings",   icon: "📋", accent: false, grad: dark ? "rgba(139,92,246,0.08)" : "rgba(124,58,237,0.04)", iconBg: dark ? "rgba(139,92,246,0.18)" : "#ede9fe", iconClr: theme.primary },
                        { n: openJobs,  l: "Open Positions",   icon: "🟢", accent: true,  grad: dark ? "rgba(52,211,153,0.08)" : "rgba(5,150,105,0.04)",   iconBg: dark ? "rgba(52,211,153,0.18)" : "#d1fae5", iconClr: theme.success },
                        { n: totalApps, l: "Total Applicants", icon: "👥", accent: false, grad: dark ? "rgba(251,191,36,0.08)" : "rgba(217,119,6,0.04)",   iconBg: dark ? "rgba(251,191,36,0.18)" : "#fef3c7", iconClr: theme.warning },
                        { n: newApps,   l: "New (Unread)",     icon: "🔔", accent: true,  grad: dark ? "rgba(139,92,246,0.08)" : "rgba(124,58,237,0.04)", iconBg: dark ? "rgba(139,92,246,0.18)" : "#ede9fe", iconClr: theme.primary },
                    ].map(s => (
                        <div key={s.l} style={{
                            background: theme.surface,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 14,
                            padding: "18px 20px",
                            boxShadow: theme.shadow,
                            position: "relative",
                            overflow: "hidden",
                        }}>
                            {/* Subtle gradient bg */}
                            <div style={{ position: "absolute", inset: 0, background: s.grad, pointerEvents: "none" }} />
                            {/* Top accent bar */}
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.accent ? `linear-gradient(90deg,${s.iconClr},${s.iconClr}88)` : `linear-gradient(90deg,${theme.border},transparent)`, borderRadius: "14px 14px 0 0" }} />
                            <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>{s.l}</div>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: s.accent ? s.iconClr : theme.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.n}</div>
                                </div>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                    {[
                        { k: "jobs",         l: "Job Postings", icon: "📋", count: jobs.length },
                        { k: "applications", l: "Applications", icon: "👥", count: totalApps  },
                    ].map(t => {
                        const isActive = tab === t.k;
                        return (
                            <button key={t.k} className="rc-tab-btn" onClick={() => setTab(t.k)} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                                border: isActive ? "none" : `1.5px solid ${theme.border}`,
                                cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
                                background: isActive
                                    ? "linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)"
                                    : theme.surface,
                                color: isActive ? "#fff" : theme.textMute,
                                boxShadow: isActive
                                    ? "0 4px 16px rgba(124,58,237,0.3)"
                                    : theme.shadow,
                                transform: isActive ? "translateY(-1px)" : "translateY(0)",
                            }}>
                                <span style={{ fontSize: 14 }}>{t.icon}</span>
                                <span>{t.l}</span>
                                <span style={{
                                    fontSize: 10, fontWeight: 800,
                                    padding: "2px 7px", borderRadius: 99,
                                    background: isActive ? "rgba(255,255,255,0.22)" : (dark ? "rgba(255,255,255,0.08)" : "#f3f4f6"),
                                    color: isActive ? "#fff" : theme.textMute,
                                    minWidth: 20, textAlign: "center",
                                }}>{t.count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ══════════════ JOBS TAB ══════════════ */}
                {tab === "jobs" && (
                    <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <PremiumSelect options={officeOpts} value={filterOffice} onChange={v => setFilterOffice(v)} width={160} dark={dark} theme={theme} />
                                <PremiumSelect options={jobStatusOpts} value={filterStatus} onChange={v => setFilterStatus(v)} width={130} dark={dark} theme={theme} />
                            </div>
                            <button onClick={() => { setEditJob(null); setJobModal(true); }} style={{ padding: "9px 20px", background: theme.primary, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                                + New Job Posting
                            </button>
                        </div>

                        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden", boxShadow: theme.shadow }}>
                            {filteredJobs.length === 0 ? (
                                <div style={{ padding: "56px 24px", textAlign: "center" }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>No job postings yet</div>
                                    <div style={{ fontSize: 13, color: theme.textMute }}>Create your first job posting.</div>
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ background: theme.tableHead, borderBottom: `2px solid ${theme.border}` }}>
                                            {["Position", "Company", "Type", "Positions", "Applications", "Deadline", "Status", "Actions"].map(h => (
                                                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 800, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredJobs.map((job, i) => {
                                            const sc = sCfg(job.status, JOB_STATUS_OPTS);
                                            return (
                                                <tr key={job.id} className="rc-tbl-row" style={{ background: i % 2 === 0 ? theme.surface : theme.rowAlt, borderBottom: `1px solid ${theme.border}` }}>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <div style={{ fontWeight: 700, color: theme.text }}>{job.title}</div>
                                                        {job.department && <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2 }}>{job.department}</div>}
                                                    </td>
                                                    <td style={{ padding: "12px 14px", color: theme.textSoft }}>{job.office?.company_name}</td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <span style={{ background: theme.primarySoft, color: theme.primary, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                                                            {JOB_TYPE_OPTS.find(t => t.value === job.type)?.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 14px", fontWeight: 700, color: theme.text }}>{job.slots} person{job.slots > 1 ? "s" : ""}</td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <button onClick={() => { handleSelectJob(job); setTab("applications"); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${theme.primarySoft}`, background: theme.primarySoft, color: theme.primary, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                                            {job.applications_count || 0} applicants
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: "12px 14px", color: theme.textMute, fontSize: 11 }}>{job.deadline || "—"}</td>
                                                    <td style={{ padding: "12px 14px" }}><StatusPill status={job.status} opts={JOB_STATUS_OPTS} dark={dark} small /></td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            <button onClick={() => { setEditJob(job); setJobModal(true); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.textSoft, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                                                            <button onClick={() => setDeleteJobModal(job)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${theme.dangerSoft}`, background: theme.dangerSoft, color: theme.danger, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* ══════════════ APPLICATIONS TAB ══════════════ */}
                {tab === "applications" && (
                    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>

                        {/* ── Job Sidebar ── */}
                        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden", boxShadow: theme.shadow }}>
                            <div style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Job Postings</div>
                                <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99 }}>{filteredJobs.length}</div>
                            </div>

                            {/* Search */}
                            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }}>
                                <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search jobs…"
                                    style={{ ...inp(false), padding: "7px 10px", fontSize: 12 }}
                                    onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                    onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                            </div>

                            {/* Filters */}
                            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${theme.border}`, display: "flex", gap: 6 }}>
                                <div style={{ flex: 1 }}>
                                    <PremiumSelect options={officeOpts} value={filterOffice} onChange={v => setFilterOffice(v)} width="100%" dark={dark} theme={theme} zIndex={4000} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <PremiumSelect options={jobStatusOpts} value={filterStatus} onChange={v => setFilterStatus(v)} width="100%" dark={dark} theme={theme} zIndex={4000} />
                                </div>
                            </div>

                            {/* List */}
                            <div style={{ maxHeight: 500, overflowY: "auto", scrollbarWidth: "none" }}>
                                {filteredJobs.length === 0 ? (
                                    <div style={{ padding: "32px 18px", textAlign: "center", color: theme.textMute, fontSize: 13 }}>No matching jobs</div>
                                ) : filteredJobs.map(job => {
                                    const isActive = selectedJob?.id === job.id;
                                    const appCount = recentApps.filter(a => a.job_posting_id === job.id).length;
                                    const sc = sCfg(job.status, JOB_STATUS_OPTS);
                                    return (
                                        <div key={job.id} className="rc-job-item" onClick={() => handleSelectJob(job)} style={{
                                            padding: "13px 18px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer",
                                            background: isActive ? (dark ? "rgba(124,58,237,0.12)" : "#faf5ff") : theme.surface,
                                            borderLeft: isActive ? `3px solid ${theme.primary}` : "3px solid transparent",
                                            transition: "all 0.15s",
                                        }}>
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? theme.primary : theme.text, lineHeight: 1.3 }}>{job.title}</div>
                                                {appCount > 0 && (
                                                    <div style={{ flexShrink: 0, minWidth: 20, height: 20, borderRadius: 99, background: isActive ? theme.primary : (dark ? "rgba(255,255,255,0.1)" : "#e5e7eb"), color: isActive ? "#fff" : theme.textMute, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{appCount}</div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 11, color: theme.textMute, marginBottom: 5 }}>{job.office?.company_name}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <StatusPill status={job.status} opts={JOB_STATUS_OPTS} dark={dark} small />
                                                {job.deadline && <span style={{ fontSize: 10, color: theme.textMute }}>· {job.deadline}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Applicants Panel ── */}
                        <div>
                            {selectedJob && (
                                <>
                                    {/* Panel header */}
                                    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 12, boxShadow: theme.shadow }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                                            <div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, letterSpacing: "-0.02em", marginBottom: 3 }}>{selectedJob.title}</div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: theme.textMute, flexWrap: "wrap" }}>
                                                    <span>{selectedJob.office?.company_name}</span>
                                                    <span>·</span>
                                                    <span style={{ fontWeight: 700, color: selectedJobApps.length > 0 ? theme.primary : theme.textMute }}>{selectedJobApps.length} applicant{selectedJobApps.length !== 1 ? "s" : ""}</span>
                                                    {selectedJobApps.length > 0 && (
                                                        <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                                            {APP_STATUS_OPTS.map(s => { const cnt = selectedJobApps.filter(a => a.status === s.value).length; return cnt > 0 ? <StatusPill key={s.value} status={s.value} opts={APP_STATUS_OPTS} dark={dark} small /> : null; })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <PremiumSelect options={appSortOpts} value={appSort} onChange={v => setAppSort(v)} width={140} dark={dark} theme={theme} />
                                                {selectedApps.length > 0 && (
                                                    <button onClick={() => setBulkModal(true)} style={{ padding: "7px 14px", borderRadius: 8, background: theme.primary, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                                        ✏️ Update {selectedApps.length}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Filter pills */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {[{ value: "all", label: "All", color: theme.primary, bg: theme.primarySoft, darkBg: theme.primarySoft }, ...APP_STATUS_OPTS].map(s => (
                                                    <button key={s.value} type="button"
                                                        onClick={() => { setAppFilter(s.value); setSelectedApps([]); }}
                                                        style={{
                                                            padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                                            border: appFilter === s.value ? `1.5px solid ${s.color}` : `1.5px solid ${theme.border}`,
                                                            background: appFilter === s.value ? (dark ? s.darkBg : s.bg) : "transparent",
                                                            color: appFilter === s.value ? s.color : theme.textMute,
                                                        }}>
                                                        {s.label}
                                                        {s.value !== "all" && selectedJobApps.filter(a => a.status === s.value).length > 0 && (
                                                            <span style={{ marginLeft: 4, opacity: 0.7 }}>({selectedJobApps.filter(a => a.status === s.value).length})</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            {filteredApps.length > 1 && (
                                                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.textMute, cursor: "pointer", userSelect: "none" }}>
                                                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 14, height: 14, accentColor: theme.primary, cursor: "pointer" }} />
                                                    Select all ({filteredApps.length})
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Applicant cards */}
                                    {filteredApps.length === 0 ? (
                                        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "48px 32px", textAlign: "center", boxShadow: theme.shadow }}>
                                            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4 }}>No applications yet</div>
                                            <div style={{ fontSize: 12, color: theme.textMute }}>Applications will appear here once candidates apply.</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {filteredApps.map(app => {
                                                const sc = sCfg(app.status, APP_STATUS_OPTS);
                                                const initials = app.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                                                const avatarColors = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#6366f1"];
                                                const avatarBg = avatarColors[app.name.charCodeAt(0) % avatarColors.length];
                                                const isSelected = selectedApps.includes(app.id);
                                                return (
                                                    <div key={app.id} className="rc-app-card" style={{
                                                        background: isSelected ? (dark ? "rgba(124,58,237,0.08)" : "#faf5ff") : theme.surface,
                                                        border: `${isSelected ? "1.5px" : "1px"} solid ${isSelected ? theme.primary : theme.border}`,
                                                        borderRadius: 14, padding: "16px 20px",
                                                        display: "grid", gridTemplateColumns: "20px 46px 1fr auto",
                                                        gap: 14, alignItems: "start", transition: "all 0.15s",
                                                    }}>
                                                        {/* Checkbox */}
                                                        <div style={{ paddingTop: 14 }}>
                                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(app.id)} style={{ width: 14, height: 14, accentColor: theme.primary, cursor: "pointer" }} />
                                                        </div>

                                                        {/* Avatar */}
                                                        <div style={{ width: 46, height: 46, borderRadius: 12, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>

                                                        {/* Info */}
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3, flexWrap: "wrap" }}>
                                                                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{app.name}</div>
                                                                <StatusPill status={app.status} opts={APP_STATUS_OPTS} dark={dark} small />
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
                                                                <a href={`mailto:${app.email}`} style={{ fontSize: 12, color: theme.textMute, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                                                                    <span style={{ opacity: 0.5 }}>✉</span> {app.email}
                                                                </a>
                                                                {app.phone && <span style={{ fontSize: 12, color: theme.textMute, display: "flex", alignItems: "center", gap: 4 }}><span style={{ opacity: 0.5 }}>☎</span> {app.phone}</span>}
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                                                <span style={{ fontSize: 10, color: theme.textMute, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, padding: "2px 8px", borderRadius: 5, fontFamily: "monospace" }}>#{app.reference_code}</span>
                                                                <span style={{ fontSize: 11, color: theme.textMute }}>Applied {app.applied_at}</span>
                                                            </div>
                                                            {app.hr_note && (
                                                                <div style={{ marginTop: 10, fontSize: 12, color: theme.textSoft, background: dark ? "rgba(255,255,255,0.04)" : "#f9fafb", border: `1px solid ${theme.border}`, borderLeft: `3px solid ${theme.primary}`, borderRadius: "0 8px 8px 0", padding: "8px 12px", fontStyle: "italic", lineHeight: 1.6 }}>{app.hr_note}</div>
                                                            )}
                                                            {app.interview && (
                                                                <div style={{ marginTop: 10, background: dark ? "rgba(8,145,178,0.1)" : "#f0f9ff", border: `1px solid ${dark ? "rgba(8,145,178,0.25)" : "#bae6fd"}`, borderLeft: "3px solid #0891b2", borderRadius: "0 8px 8px 0", padding: "10px 12px" }}>
                                                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#0891b2", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Interview Scheduled</div>
                                                                    <div style={{ fontSize: 12, color: dark ? "#7dd3fc" : "#0c4a6e", fontWeight: 500 }}>📅 {app.interview.scheduled_at}</div>
                                                                    {app.interview.meeting_link && <a href={app.interview.meeting_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#0891b2", display: "block", marginTop: 3 }}>🔗 {app.interview.meeting_link}</a>}
                                                                    {app.interview.location && <div style={{ fontSize: 11, color: dark ? "#7dd3fc" : "#0c4a6e", marginTop: 3 }}>📍 {app.interview.location}</div>}
                                                                    {app.interview.score != null && (
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                                                            <div style={{ fontSize: 13, fontWeight: 700, color: app.interview.score >= 70 ? "#059669" : app.interview.score >= 50 ? "#d97706" : "#dc2626" }}>Score: {app.interview.score}/100</div>
                                                                            {app.interview.recommendation && (
                                                                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: app.interview.recommendation === "proceed" ? "#d1fae5" : app.interview.recommendation === "hold" ? "#fef3c7" : "#fee2e2", color: app.interview.recommendation === "proceed" ? "#059669" : app.interview.recommendation === "hold" ? "#d97706" : "#dc2626" }}>
                                                                                    {app.interview.recommendation.charAt(0).toUpperCase() + app.interview.recommendation.slice(1)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end", flexShrink: 0 }}>
                                                            <a href={app.cv_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, color: theme.textSoft, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
                                                                📄 CV
                                                            </a>
                                                            <button onClick={() => setNoteModal(app)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: theme.primarySoft, border: `1px solid ${dark ? "rgba(139,92,246,0.3)" : "#ddd6fe"}`, color: theme.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>✏️ Status</button>
                                                            <button onClick={() => setInterviewModal(app)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: app.interview ? (dark ? "rgba(8,145,178,0.12)" : "#f0f9ff") : "transparent", border: `1px solid ${app.interview ? (dark ? "rgba(8,145,178,0.3)" : "#bae6fd") : theme.border}`, color: app.interview ? "#0891b2" : theme.textMute, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                                                                📅 {app.interview ? "Reschedule" : "Interview"}
                                                            </button>
                                                            {app.status === "interview" && (
                                                                <button onClick={() => setScoreModal(app)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: app.interview?.score != null ? (dark ? "rgba(5,150,105,0.14)" : "#d1fae5") : (dark ? "rgba(217,119,6,0.12)" : "#fff7ed"), border: `1px solid ${app.interview?.score != null ? (dark ? "rgba(5,150,105,0.3)" : "#6ee7b7") : (dark ? "rgba(217,119,6,0.3)" : "#fed7aa")}`, color: app.interview?.score != null ? "#059669" : "#d97706", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                                                                    ⭐ {app.interview?.score != null ? `Score: ${app.interview.score}` : "Add Score"}
                                                                </button>
                                                            )}
                                                            {app.status === "rejected" && (
                                                                <button onClick={() => setDeleteModal(app)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "transparent",  border: `1px solid ${app.interview?.score != null ? (dark ? "rgba(5,150,105,0.3)" : "#6ee7b7") : (dark ? "rgba(73, 67, 61, 0.3)" : "rgba(247, 99, 99, 1)")}`, color: theme.danger, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}><ActionGlyph type="delete" color={theme.danger} /> Delete</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {jobModal && <JobModal offices={offices} editJob={editJob} onClose={() => { setJobModal(false); setEditJob(null); }} dark={dark} theme={theme} />}
            {noteModal && <StatusModal app={noteModal} onClose={() => setNoteModal(null)} dark={dark} theme={theme} />}
            {interviewModal && <InterviewModal app={interviewModal} onClose={() => setInterviewModal(null)} dark={dark} theme={theme} />}
            {scoreModal && <ScoreModal app={scoreModal} onClose={() => setScoreModal(null)} dark={dark} theme={theme} />}
            {bulkModal && <BulkModal ids={selectedApps} onClose={() => setBulkModal(false)} onDone={() => { setBulkModal(false); setSelectedApps([]); }} dark={dark} theme={theme} />}
            {deleteModal && <DeleteModal app={deleteModal} onClose={() => setDeleteModal(null)} />}
            {deleteJobModal && <DeleteJobModal job={deleteJobModal} onClose={() => setDeleteJobModal(null)} />}
        </AppLayout>
    );
}

// ─────────────────────────────────────────────────────────────────
// JobModal
// ─────────────────────────────────────────────────────────────────
function JobModal({ offices, editJob, onClose, dark, theme }) {
    const isEdit = !!editJob;
    const [descItems,  setDescItems]  = useState(() => toArr(editJob?.description || ""));
    const [reqItems,   setReqItems]   = useState(() => toArr(editJob?.requirements || ""));
    const [respItems,  setRespItems]  = useState(() => toArr(editJob?.responsibilities || ""));
    const [negotiate,  setNegotiate]  = useState(() => editJob?.salary_range === "Negotiable" || false);
    const [errs,       setErrs]       = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [data, setDataState] = useState({
        brycen_office_id: editJob?.brycen_office_id ? String(editJob.brycen_office_id) : "",
        title:            editJob?.title || "", department: editJob?.department || "",
        type:             editJob?.type || "full_time", slots: editJob?.slots || 1,
        salary_range:     editJob?.salary_range || "", status: editJob?.status || "open",
        deadline:         editJob?.deadline || "",
    });
    const setData = (k, v) => setDataState(p => ({ ...p, [k]: v }));
    const inp = useInpStyle(theme, dark);

    const officeOpts = offices.map(o => ({ value: String(o.id), label: o.company_name }));

    const validate = () => {
        const e = {};
        if (!data.brycen_office_id) e.brycen_office_id = "Please select a company office.";
        if (!data.type) e.type = "Please select a job type.";
        if (!data.title.trim()) e.title = "Job title is required.";
        if (!data.slots || parseInt(data.slots) < 1) e.slots = "At least 1 position required.";
        if (!negotiate && !data.salary_range.trim()) e.salary_range = "Enter salary range or check Negotiable.";
        if (!descItems.filter(s => s.trim()).length) e.description = "Add at least one description point.";
        if (!reqItems.filter(s => s.trim()).length) e.requirements = "Add at least one requirement.";
        return e;
    };

    const submit = (e) => {
        e.preventDefault();
        const v = validate();
        if (Object.keys(v).length) { setErrs(v); return; }
        setErrs({}); setSubmitting(true);
        const payload = { ...data, description: toStr(descItems), requirements: toStr(reqItems), responsibilities: toStr(respItems), salary_range: negotiate ? "Negotiable" : data.salary_range };
        const opts = { preserveScroll: true, onSuccess: () => { setSubmitting(false); onClose(); }, onError: () => setSubmitting(false) };
        isEdit ? router.put(`/recruitment/jobs/${editJob.id}`, payload, opts) : router.post("/recruitment/jobs", payload, opts);
    };

    const errTxt = (key) => errs[key] ? <div style={{ fontSize: 11, color: theme.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><span>⚠</span> {errs[key]}</div> : null;
    const lbl = { fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };

    return (
        <ModalShell onClose={onClose} maxWidth={620}>
            <ModalHeader grad="linear-gradient(135deg,#5b21b6 0%,#7c3aed 60%,#8b5cf6 100%)" icon={isEdit ? "✏️" : "📋"} subtitle={isEdit ? "Edit Posting" : "Job Recruitment"} title={isEdit ? editJob.title : "New Job Posting"} onClose={onClose} />
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: theme.surface }}>
                <div style={{ overflowY: "auto", flex: 1, padding: "24px 26px 16px", scrollbarWidth: "none" }}>
                    {Object.keys(errs).length > 0 && (
                        <div style={{ background: theme.dangerSoft, border: `1px solid ${theme.danger}44`, borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: theme.danger, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>⚠️</span> Please fill in all required fields before saving.
                        </div>
                    )}

                    {/* Office */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={lbl}>Company Office *</label>
                        <PremiumSelect options={officeOpts} value={data.brycen_office_id} onChange={v => { setData("brycen_office_id", v); setErrs(p => ({ ...p, brycen_office_id: undefined })); }} placeholder="Select office…" width="100%" dark={dark} theme={theme} />
                        {errTxt("brycen_office_id")}
                    </div>

                    {/* Job Type */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={lbl}>Job Type *</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {JOB_TYPE_OPTS.map(t => (
                                <PillBtn key={t.value} active={data.type === t.value} onClick={() => { setData("type", t.value); setErrs(p => ({ ...p, type: undefined })); }} color={theme.primary} bg={theme.primarySoft} darkBg={theme.primarySoft} label={t.label} dark={dark} />
                            ))}
                        </div>
                        {errTxt("type")}
                    </div>

                    <div style={{ height: 1, background: theme.border, margin: "4px 0 20px" }} />

                    {/* Title */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>Job Title *</label>
                        <input style={inp(errs.title)} value={data.title} onChange={e => { setData("title", e.target.value); setErrs(p => ({ ...p, title: undefined })); }}
                            placeholder="e.g. Senior Infrastructure Engineer"
                            onFocus={e => { if (!errs.title) { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; } }}
                            onBlur={e => { if (!errs.title) { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; } }} />
                        {errTxt("title")}
                    </div>

                    {/* Dept + Slots */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={lbl}>Department</label>
                            <input style={inp(false)} value={data.department} onChange={e => setData("department", e.target.value)} placeholder="e.g. Engineering"
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                        <div>
                            <label style={lbl}>Positions *</label>
                            <input type="number" style={inp(errs.slots)} value={data.slots} min={1} onChange={e => { setData("slots", e.target.value); setErrs(p => ({ ...p, slots: undefined })); }}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = errs.slots ? theme.danger : theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                            {errTxt("slots")}
                        </div>
                    </div>

                    {/* Salary + Deadline */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={lbl}>Salary Range{!negotiate && " *"}</label>
                            <input style={{ ...inp(errs.salary_range), opacity: negotiate ? 0.45 : 1 }} value={negotiate ? "Negotiable" : data.salary_range}
                                onChange={e => { setData("salary_range", e.target.value); setErrs(p => ({ ...p, salary_range: undefined })); }} disabled={negotiate} placeholder="e.g. $800 – $1,200"
                                onFocus={e => { if (!errs.salary_range) { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; } }}
                                onBlur={e => { e.target.style.borderColor = errs.salary_range ? theme.danger : theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                            <label style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, cursor: "pointer", fontSize: 13, color: theme.textSoft, userSelect: "none" }}>
                                <input type="checkbox" checked={negotiate} onChange={e => { setNegotiate(e.target.checked); setErrs(p => ({ ...p, salary_range: undefined })); }} style={{ width: 15, height: 15, accentColor: theme.primary, cursor: "pointer" }} />
                                Negotiable
                            </label>
                            {errTxt("salary_range")}
                        </div>
                        <div>
                            <label style={lbl}>Application Deadline</label>
                            <input type="date" style={inp(false)} value={data.deadline} onChange={e => setData("deadline", e.target.value)}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                    </div>

                    {/* Status (edit) */}
                    {isEdit && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={lbl}>Posting Status</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {JOB_STATUS_OPTS.map(s => <PillBtn key={s.value} active={data.status === s.value} onClick={() => setData("status", s.value)} color={s.color} bg={s.bg} darkBg={s.darkBg} label={s.label} dark={dark} />)}
                            </div>
                        </div>
                    )}

                    <div style={{ height: 1, background: theme.border, margin: "8px 0 20px" }} />
                    <ListField label="Description" required items={descItems} onChange={v => { setDescItems(v); setErrs(p => ({ ...p, description: undefined })); }} placeholder="e.g. Lead a team of engineers..." error={errs.description} theme={theme} dark={dark} />
                    <ListField label="Requirements" required items={reqItems} onChange={v => { setReqItems(v); setErrs(p => ({ ...p, requirements: undefined })); }} placeholder="e.g. 3+ years of experience in..." error={errs.requirements} theme={theme} dark={dark} />
                    <ListField label="Responsibilities" items={respItems} onChange={setRespItems} placeholder="e.g. Review and approve pull requests..." theme={theme} dark={dark} />
                </div>
                <div style={{ padding: "14px 26px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: theme.surface, flexShrink: 0 }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button type="submit" disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: theme.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Job Posting"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// StatusModal
// ─────────────────────────────────────────────────────────────────
function StatusModal({ app, onClose, dark, theme }) {
    const { data, setData, patch, processing } = useForm({ status: app.status || "new", hr_note: app.hr_note || "" });
    const inp = useInpStyle(theme, dark);
    const submit = (e) => { e.preventDefault(); patch(`/recruitment/applications/${app.id}`, { preserveScroll: true, onSuccess: onClose }); };
    return (
        <ModalShell onClose={onClose} maxWidth={460}>
            <ModalHeader grad="linear-gradient(135deg,#5b21b6 0%,#7c3aed 60%,#8b5cf6 100%)" icon="👤" subtitle="Application" title={app.name} onClose={onClose} />
            <form onSubmit={submit} style={{ background: theme.surface, padding: "24px 26px 0", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 20 }}>{app.job_posting?.title || ""} · {app.job_posting?.office?.company_name || ""}</div>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>Status</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {APP_STATUS_OPTS.map(s => <PillBtn key={s.value} active={data.status === s.value} onClick={() => setData("status", s.value)} color={s.color} bg={s.bg} darkBg={s.darkBg} label={s.label} dark={dark} />)}
                    </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>HR Note</label>
                    <textarea style={{ ...inp(false), minHeight: 72, resize: "vertical" }} value={data.hr_note} onChange={e => setData("hr_note", e.target.value)} placeholder="Internal note about this applicant..."
                        onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                        onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                </div>
                <div style={{ padding: "16px 0 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button type="submit" disabled={processing} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: theme.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: processing ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: processing ? 0.7 : 1 }}>{processing ? "Saving…" : "Save Changes"}</button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// InterviewModal
// ─────────────────────────────────────────────────────────────────
const PLATFORM_LABELS = { zoom: "Zoom", google_meet: "Google Meet", teams: "Microsoft Teams", physical: "Physical / Onsite", other: "Other" };
function InterviewModal({ app, onClose, dark, theme }) {
    const existing = app.interview;
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [data, setDataState] = useState({ scheduled_at: existing?.scheduled_at_raw || "", type: existing?.type || "online", platform: existing?.platform || "zoom", meeting_link: existing?.meeting_link || "", location: existing?.location || "", interviewer_name: existing?.interviewer_name || "", note_to_candidate: existing?.note_to_candidate || "" });
    const set = (k, v) => { setDataState(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
    const inp = useInpStyle(theme, dark);

    const validate = () => {
        const e = {};
        if (!data.scheduled_at) { e.scheduled_at = "Please select a date and time."; }
        else if (new Date(data.scheduled_at) <= new Date()) { e.scheduled_at = "Interview must be scheduled for a future date and time."; }
        return e;
    };
    const submit = (e) => {
        e.preventDefault();
        const fe = validate();
        if (Object.keys(fe).length) { setErrors(fe); return; }
        setSubmitting(true);
        router.post(`/recruitment/applications/${app.id}/interview`, data, {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onClose(); },
            onError: errs => { setSubmitting(false); const mapped = {}; if (errs.scheduled_at) mapped.scheduled_at = "Interview must be in the future."; if (errs.meeting_link) mapped.meeting_link = errs.meeting_link; setErrors(mapped); },
        });
    };
    const errTxt = key => errors[key] ? <div style={{ fontSize: 11, color: theme.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><span>⚠</span> {errors[key]}</div> : null;
    const lbl = { fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };

    return (
        <ModalShell onClose={onClose} maxWidth={540}>
            <ModalHeader grad="linear-gradient(135deg,#0369a1,#0891b2)" icon="📅" subtitle={existing ? "Reschedule Interview" : "Schedule Interview"} title={app.name} onClose={onClose} />
            <form onSubmit={submit} style={{ background: theme.surface, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: "auto", flex: 1, padding: "24px 26px 16px", scrollbarWidth: "none" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>Date & Time *</label>
                        <input type="datetime-local" style={inp(errors.scheduled_at)} value={data.scheduled_at} onChange={e => set("scheduled_at", e.target.value)}
                            onFocus={e => { if (!errors.scheduled_at) { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; } }}
                            onBlur={e => { if (!errors.scheduled_at) { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; } }} />
                        {errTxt("scheduled_at")}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>Interview Type *</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {["online", "onsite"].map(t => <PillBtn key={t} active={data.type === t} onClick={() => set("type", t)} color="#0891b2" bg="#e0f2fe" darkBg="rgba(8,145,178,0.16)" label={t === "online" ? "💻 Online" : "🏢 Onsite"} dark={dark} />)}
                        </div>
                    </div>
                    {data.type === "online" && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Platform</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {["zoom", "google_meet", "teams", "other"].map(p => <PillBtn key={p} active={data.platform === p} onClick={() => set("platform", p)} color="#0891b2" bg="#e0f2fe" darkBg="rgba(8,145,178,0.16)" label={PLATFORM_LABELS[p]} dark={dark} />)}
                            </div>
                        </div>
                    )}
                    {data.type === "online" ? (
                        <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Meeting Link</label>
                            <input style={inp(errors.meeting_link)} value={data.meeting_link} onChange={e => set("meeting_link", e.target.value)} placeholder="https://zoom.us/j/..."
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = errors.meeting_link ? theme.danger : theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                            {errTxt("meeting_link")}
                        </div>
                    ) : (
                        <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>Location</label>
                            <input style={inp(false)} value={data.location} onChange={e => set("location", e.target.value)} placeholder="Office address or room number"
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>Interviewer Name</label>
                        <input style={inp(false)} value={data.interviewer_name} onChange={e => set("interviewer_name", e.target.value)} placeholder="e.g. Daw Aye Aye (HR Manager)"
                            onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                            onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>Note to Candidate</label>
                        <textarea style={{ ...inp(false), minHeight: 80, resize: "vertical" }} value={data.note_to_candidate} onChange={e => set("note_to_candidate", e.target.value)} placeholder="What to prepare, dress code, documents to bring..."
                            onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                            onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div style={{ background: dark ? "rgba(52,211,153,0.08)" : "#f0fdf4", border: `1px solid ${dark ? "rgba(52,211,153,0.2)" : "#bbf7d0"}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: dark ? "#34d399" : "#166534", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>✉️</span> An invitation email will be sent automatically to <strong>{app.email}</strong>
                    </div>
                </div>
                <div style={{ padding: "14px 26px 22px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: theme.surface, flexShrink: 0 }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button type="submit" disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: "#0891b2", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Scheduling…" : existing ? "Reschedule & Send Email" : "Schedule & Send Email"}</button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// ScoreModal
// ─────────────────────────────────────────────────────────────────
function ScoreModal({ app, onClose, dark, theme }) {
    const existing = app.interview;
    const [submitting, setSubmitting] = useState(false);
    const [data, setDataState] = useState({ score: existing?.score ?? 70, strengths: existing?.strengths || "", weaknesses: existing?.weaknesses || "", recommendation: existing?.recommendation || "proceed", internal_note: existing?.internal_note || "" });
    const set = (k, v) => setDataState(p => ({ ...p, [k]: v }));
    const inp = useInpStyle(theme, dark);
    const submit = (e) => { e.preventDefault(); setSubmitting(true); router.post(`/recruitment/applications/${app.id}/score`, data, { preserveScroll: true, onSuccess: () => { setSubmitting(false); onClose(); }, onError: () => setSubmitting(false) }); };
    const scoreColor = data.score >= 70 ? "#059669" : data.score >= 50 ? "#d97706" : "#dc2626";
    const recOpts = [{ value: "proceed", label: "✅ Proceed", color: "#059669", bg: "#d1fae5", darkBg: "rgba(5,150,105,0.16)" }, { value: "hold", label: "⏸ Hold", color: "#d97706", bg: "#fef3c7", darkBg: "rgba(217,119,6,0.16)" }, { value: "reject", label: "❌ Reject", color: "#dc2626", bg: "#fee2e2", darkBg: "rgba(220,38,38,0.16)" }];
    const lbl = { fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };
    return (
        <ModalShell onClose={onClose} maxWidth={500}>
            <ModalHeader grad="linear-gradient(135deg,#d97706,#f59e0b)" icon="⭐" subtitle="Interview Score" title={app.name} onClose={onClose} />
            <form onSubmit={submit} style={{ background: theme.surface, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: "auto", flex: 1, padding: "24px 26px 16px", scrollbarWidth: "none" }}>
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <label style={lbl}>Score *</label>
                            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, letterSpacing: "-0.04em" }}>{data.score}<span style={{ fontSize: 14, fontWeight: 400, color: theme.textMute }}>/100</span></div>
                        </div>
                        <input type="range" min={0} max={100} step={1} value={data.score} onChange={e => set("score", parseInt(e.target.value))} style={{ width: "100%", accentColor: scoreColor, cursor: "pointer" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: theme.textMute, marginTop: 4 }}><span>Poor</span><span>Average</span><span>Excellent</span></div>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <label style={lbl}>Recommendation *</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {recOpts.map(r => <PillBtn key={r.value} active={data.recommendation === r.value} onClick={() => set("recommendation", r.value)} color={r.color} bg={r.bg} darkBg={r.darkBg} label={r.label} dark={dark} />)}
                        </div>
                    </div>
                    {[["strengths", "Strengths", "What stood out positively..."], ["weaknesses", "Areas for Improvement", "Skills gaps or concerns..."], ["internal_note", "Internal Note", "HR internal notes (not visible to candidate)..."]].map(([k, label, ph]) => (
                        <div key={k} style={{ marginBottom: 14 }}>
                            <label style={lbl}>{label}</label>
                            <textarea style={{ ...inp(false), minHeight: 68, resize: "vertical" }} value={data[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                    ))}
                </div>
                <div style={{ padding: "14px 26px 22px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: theme.surface, flexShrink: 0 }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button type="submit" disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: "#d97706", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Saving…" : "Save Score"}</button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// BulkModal
// ─────────────────────────────────────────────────────────────────
function BulkModal({ ids, onClose, onDone, dark, theme }) {
    const [status, setStatus] = useState("reviewing");
    const [submitting, setSubmitting] = useState(false);
    const submit = () => { setSubmitting(true); router.post("/recruitment/applications/bulk-update", { ids, status }, { preserveScroll: true, onSuccess: onDone, onError: () => setSubmitting(false) }); };
    return (
        <ModalShell onClose={onClose} maxWidth={420}>
            <ModalHeader grad="linear-gradient(135deg,#5b21b6 0%,#7c3aed 100%)" icon="✏️" subtitle="Bulk Action" title={`Update ${ids.length} Applicant${ids.length !== 1 ? "s" : ""}`} onClose={onClose} />
            <div style={{ background: theme.surface, padding: "24px 26px" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>Set Status To</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                    {APP_STATUS_OPTS.map(s => <PillBtn key={s.value} active={status === s.value} onClick={() => setStatus(s.value)} color={s.color} bg={s.bg} darkBg={s.darkBg} label={s.label} dark={dark} />)}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button onClick={submit} disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: theme.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Updating…" : "Apply to All"}</button>
                </div>
            </div>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// DeleteModal
// ─────────────────────────────────────────────────────────────────
function DeleteModal({ app, onClose }) {
    const [submitting, setSubmitting] = useState(false);
    const confirm = () => { setSubmitting(true); router.delete(`/recruitment/applications/${app.id}`, { preserveScroll: true, onSuccess: onClose, onError: () => setSubmitting(false) }); };
    const initials  = app.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const avatarBg  = ["#7c3aed","#0891b2","#059669","#d97706","#dc2626","#6366f1"][app.name.charCodeAt(0) % 6];
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17,24,39,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.26)", animation: "rcPopIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
                <div style={{ padding: "28px 28px 24px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18 }}>🗑️</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Delete Application</div>
                    <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>This will permanently delete the application and CV file. <strong style={{ color: "#dc2626" }}>Cannot be undone.</strong></div>
                    <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: avatarBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{app.name}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>{app.email}</div>
                        </div>
                    </div>
                    {/* Will be deleted checklist */}
                    <div style={{ background: "#fff7f7", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Will be deleted</div>
                        {["Application record & all details", "Uploaded CV file", "Interview record & score"].map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: "#6b7280" }}>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={confirm} disabled={submitting} style={{ flex: 1, padding: 11, border: "none", borderRadius: 10, background: submitting ? "#fca5a5" : "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {submitting ? "Deleting…" : "🗑️ Delete Permanently"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// DeleteJobModal
// ─────────────────────────────────────────────────────────────────
function DeleteJobModal({ job, onClose }) {
    const [submitting, setSubmitting] = useState(false);
    const appCount = job.applications_count || 0;
    const confirm = () => { setSubmitting(true); router.delete(`/recruitment/jobs/${job.id}`, { preserveScroll: true, onSuccess: onClose, onError: () => setSubmitting(false) }); };
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17,24,39,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.26)", animation: "rcPopIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
                <div style={{ padding: "28px 28px 24px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18 }}>📋</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Delete Job Posting</div>
                    <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>Are you sure? <strong style={{ color: "#dc2626" }}>This action cannot be undone.</strong></div>
                    <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{job.office?.company_name} · {job.slots} position{job.slots > 1 ? "s" : ""}</div>
                    </div>
                    {appCount > 0 ? (
                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderLeft: "4px solid #f59e0b", borderRadius: "0 10px 10px 0", padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10 }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                            <div><div style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{appCount} application{appCount > 1 ? "s" : ""} will also be deleted</div><div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>All CVs, interviews, and scores will be permanently removed.</div></div>
                        </div>
                    ) : (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 24, display: "flex", gap: 8, alignItems: "center" }}>
                            <span>✅</span><span style={{ fontSize: 12, color: "#166534" }}>No applications — safe to delete.</span>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={confirm} disabled={submitting} style={{ flex: 1, padding: 11, border: "none", borderRadius: 10, background: submitting ? "#fca5a5" : "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {submitting ? "Deleting…" : "🗑️ Delete Posting"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}