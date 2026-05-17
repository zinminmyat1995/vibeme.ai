import { useState, useMemo, useRef, useEffect } from "react";
import { router, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { createPortal } from "react-dom";
import { useTranslation } from "@/Contexts/LanguageContext";

// ── Constants ─────────────────────────────────────────────────────
const JOB_TYPE_OPTS = [
    { value:"full_time",  labelKey:"recruitment.jobTypes.fullTime", label:"Full Time"  },
    { value:"part_time",  labelKey:"recruitment.jobTypes.partTime", label:"Part Time"  },
    { value:"contract",   labelKey:"recruitment.jobTypes.contract", label:"Contract"   },
    { value:"internship", labelKey:"recruitment.jobTypes.internship", label:"Internship" },
];
const APP_STATUS_OPTS = [
    { value:"new",       labelKey:"recruitment.appStatus.new", label:"New",       color:"#6366f1", bg:"#eef2ff",  darkBg:"rgba(99,102,241,0.16)"  },
    { value:"reviewing", labelKey:"recruitment.appStatus.reviewing", label:"Reviewing", color:"#d97706", bg:"#fef3c7",  darkBg:"rgba(217,119,6,0.16)"   },
    { value:"interview", labelKey:"recruitment.appStatus.interview", label:"Interview", color:"#0891b2", bg:"#e0f2fe",  darkBg:"rgba(8,145,178,0.16)"   },
    { value:"accepted",  labelKey:"recruitment.appStatus.accepted", label:"Accepted",  color:"#059669", bg:"#d1fae5",  darkBg:"rgba(5,150,105,0.16)"   },
    { value:"rejected",  labelKey:"recruitment.appStatus.rejected", label:"Rejected",  color:"#dc2626", bg:"#fee2e2",  darkBg:"rgba(220,38,38,0.16)"   },
];
const JOB_STATUS_OPTS = [
    { value:"open",   labelKey:"recruitment.jobStatus.open", label:"Open",   color:"#059669", bg:"#d1fae5", darkBg:"rgba(5,150,105,0.16)"  },
    { value:"paused", labelKey:"recruitment.jobStatus.paused", label:"Paused", color:"#d97706", bg:"#fef3c7", darkBg:"rgba(217,119,6,0.16)"  },
    { value:"closed", labelKey:"recruitment.jobStatus.closed", label:"Closed", color:"#6b7280", bg:"#f3f4f6", darkBg:"rgba(107,114,128,0.16)"},
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
function PremiumSelect({ options = [], value = "", onChange, placeholder = "Select…", disabled = false, width = "auto", zIndex = 3000, dark, theme, tr }) {
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
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? (selected.labelKey ? (tr(selected.labelKey) === selected.labelKey ? selected.label : tr(selected.labelKey)) : selected.label) : placeholder}</span>
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
                                    <span>{opt.labelKey ? (tr(opt.labelKey) === opt.labelKey ? opt.label : tr(opt.labelKey)) : opt.label}</span>
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
function StatusPill({ status, opts, dark, small, tr }) {
    const cfg = sCfg(status, opts);
    const bg = dark ? cfg.darkBg : cfg.bg;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "2px 8px" : "3px 10px", borderRadius: 99, fontSize: small ? 10 : 11, fontWeight: 600, color: cfg.color, background: bg, whiteSpace: "nowrap" }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
            {cfg.labelKey ? (tr(cfg.labelKey) === cfg.labelKey ? cfg.label : tr(cfg.labelKey)) : cfg.label}
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
function ListField({ label, required, items, onChange, placeholder, error, theme, dark, tr }) {
    const inp = useInpStyle(theme, dark);
    const add    = () => onChange([...items, ""]);
    const remove = i  => onChange(items.filter((_,idx) => idx !== i));
    const upd    = (i,v) => { const n=[...items]; n[i]=v; onChange(n); };
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}{required && " *"}</label>
                <button type="button" onClick={add} style={{ fontSize: 11, color: theme.primary, background: theme.primarySoft, border: "none", padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>{tr("recruitment.actions.add")}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: theme.primary, fontSize: 15, flexShrink: 0, width: 14 }}>•</span>
                        <input value={item} onChange={e => upd(i, e.target.value)}
                            placeholder={placeholder || tr("recruitment.placeholders.addItem")}
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
export default function RecruitmentIndex({
    offices = [],
    jobs = [],
    recentApps = [],
    isAdmin = false,
    isHR = false,
    hrOffice = null,
}) {
    const { t: tr } = useTranslation();
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

    // ── HR ဆိုရင် office filter မသုံးဘဲ all jobs ပဲပြ (backend မှာ filter ပြီးပြီ)
    const filteredJobs = useMemo(() => jobs.filter(j => {
        // Admin ဆိုရင်ဘဲ country filter အလုပ်လုပ်မယ်
        if (isAdmin && filterOffice !== "all" && j.office?.id !== parseInt(filterOffice)) return false;
        if (filterStatus !== "all" && j.status !== filterStatus) return false;
        if (jobSearch && !j.title.toLowerCase().includes(jobSearch.toLowerCase()) && !j.office?.company_name?.toLowerCase().includes(jobSearch.toLowerCase())) return false;
        return true;
    }), [jobs, filterOffice, filterStatus, jobSearch, isAdmin]);

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

    // Admin ဆိုရင်ဘဲ All Countries dropdown options ထည့်မယ်
    const officeOpts = [{ value: "all", label: tr("recruitment.filters.allCountries") }, ...offices.map(o => ({ value: o.id, label: o.company_name }))];
    const jobStatusOpts = [{ value: "all", label: tr("recruitment.filters.allStatus") }, ...JOB_STATUS_OPTS.map(s => ({ value: s.value, labelKey: s.labelKey, label: s.label }))];
    const appSortOpts = [{ value: "latest", label: tr("recruitment.sort.latestFirst") }, { value: "name", label: tr("recruitment.sort.nameAZ") }, { value: "score", label: tr("recruitment.sort.byScore") }];

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
                    <path d="M10 11v6" /><path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
            );
        }
        return null;
    }

    return (
        <AppLayout title={tr("recruitment.pageTitle")}>
            <style>{`
                @keyframes rcSpin   { to { transform: rotate(360deg) } }
                @keyframes rcDropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes rcPopIn  { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes rcFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                .rc-job-item:hover  { background: ${dark ? "rgba(255,255,255,0.04)" : "#fafafa"} !important; }
                .rc-app-card:hover  { box-shadow: ${dark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 2px 12px rgba(0,0,0,0.06)"} !important; }
                .rc-tbl-row:hover td { background: ${dark ? "rgba(255,255,255,0.03)" : "#fafbff"} !important; }
                .rc-hide::-webkit-scrollbar { display:none; }
                .rc-hide { scrollbar-width:none; -ms-overflow-style:none; }
            `}</style>

            <div style={{ animation: "rcFadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ═══ ① STATS — compact horizontal strip ═══ */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                        { n: totalJobs,  l: tr("recruitment.stats.totalPostings"),   icon: "📋", color: theme.primary,  soft: theme.primarySoft  },
                        { n: openJobs,   l: tr("recruitment.stats.openPositions"),   icon: "🟢", color: theme.success,  soft: theme.successSoft  },
                        { n: totalApps,  l: tr("recruitment.stats.totalApplicants"), icon: "👥", color: theme.warning,  soft: theme.warningSoft  },
                        { n: newApps,    l: tr("recruitment.stats.newUnread"),     icon: "🔔", color: theme.primary,  soft: theme.primarySoft  },
                    ].map(s => (
                        <div key={s.l} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            background: dark ? "rgba(255,255,255,0.04)" : "#fff",
                            border: `1px solid ${theme.border}`,
                            borderRadius: 14, padding: "10px 16px",
                            boxShadow: theme.shadow, minWidth: 160,
                            position: "relative", overflow: "hidden",
                        }}>
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, borderRadius: "14px 14px 0 0" }} />
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                background: s.soft,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                            }}>{s.icon}</div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: "-0.04em" }}>{s.n}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.l}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ═══ ② TABS ═══ */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{
                        display: "flex", gap: 0,
                        background: theme.surface, border: `1px solid ${theme.border}`,
                        borderRadius: 10, padding: 3, width: "fit-content", boxShadow: theme.shadow,
                    }}>
                        {[
                            { k: "jobs",         l: tr("recruitment.tabs.jobPostings"), count: jobs.length  },
                            { k: "applications", l: tr("recruitment.tabs.applications"),  count: totalApps   },
                        ].map(t => {
                            const isActive = tab === t.k;
                            return (
                                <button key={t.k} className="rc-tab-btn" onClick={() => setTab(t.k)} style={{
                                    display: "flex", alignItems: "center", gap: 7,
                                    padding: "7px 16px", borderRadius: 7,
                                    fontSize: 12, fontWeight: 700, border: "none",
                                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
                                    background: isActive ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "transparent",
                                    color: isActive ? "#fff" : theme.textMute,
                                    boxShadow: isActive ? "0 2px 8px rgba(124,58,237,0.28)" : "none",
                                }}>
                                    {t.l}
                                    <span style={{
                                        fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 99,
                                        background: isActive ? "rgba(255,255,255,0.22)" : (dark ? "rgba(255,255,255,0.08)" : "#f3f4f6"),
                                        color: isActive ? "#fff" : theme.textMute,
                                    }}>{t.count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Controls row — changes based on tab */}
                    {tab === "jobs" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isAdmin && (
                                <PremiumSelect options={officeOpts} value={filterOffice} onChange={v => setFilterOffice(v)} width={150} dark={dark} theme={theme} tr={tr} />
                            )}
                            <PremiumSelect options={jobStatusOpts} value={filterStatus} onChange={v => setFilterStatus(v)} width={120} dark={dark} theme={theme} tr={tr} />
                            {!isAdmin && (
                                <button onClick={() => { setEditJob(null); setJobModal(true); }} style={{
                                    padding: "8px 16px", background: theme.primary, border: "none",
                                    borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
                                    boxShadow: `0 4px 14px ${theme.primary}44`,
                                }}>
                                    {tr("recruitment.actions.newPosting")}
                                </button>
                            )}
                        </div>
                    )}

                    {tab === "applications" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <PremiumSelect options={appSortOpts} value={appSort} onChange={v => setAppSort(v)} width={130} dark={dark} theme={theme} tr={tr} />
                            {!isAdmin && selectedApps.length > 0 && (
                                <button onClick={() => setBulkModal(true)} style={{
                                    padding: "7px 14px", borderRadius: 8, background: theme.primary, border: "none",
                                    color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                }}>
                                    ✏️ {tr("recruitment.actions.update")} {selectedApps.length}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══ JOBS TAB — full width table ═══ */}
                {tab === "jobs" && (
                    <div style={{
                        background: theme.surface, border: `1px solid ${theme.border}`,
                        borderRadius: 14, overflow: "hidden", boxShadow: theme.shadow,
                    }}>
                        {filteredJobs.length === 0 ? (
                            <div style={{ padding: "56px 24px", textAlign: "center" }}>
                                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{tr("recruitment.empty.noJobPostings")}</div>
                                <div style={{ fontSize: 12, color: theme.textMute }}>{tr("recruitment.empty.createFirstJobPosting")}</div>
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: theme.tableHead, borderBottom: `1px solid ${theme.border}` }}>
                                        {[tr("recruitment.table.position"), tr("recruitment.table.company"), tr("recruitment.table.type"), tr("recruitment.table.slots"), tr("recruitment.table.applicants"), tr("recruitment.table.deadline"), tr("recruitment.table.status"), tr("recruitment.table.actions")].map(h => (
                                            <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 800, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJobs.map((job, i) => (
                                        <tr key={job.id} className="rc-tbl-row" style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            <td style={{ padding: "11px 14px", maxWidth: 240, width: 240 }}>
                                                <div style={{
                                                    fontWeight: 700, color: theme.text, fontSize: 13,
                                                    overflow: "hidden", textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap", maxWidth: 220,
                                                }} title={job.title}>{job.title}</div>
                                                {job.department && <div style={{ fontSize: 10, color: theme.textMute, marginTop: 2 }}>{job.department}</div>}
                                            </td>
                                            <td style={{ padding: "11px 14px", color: theme.textSoft, fontSize: 12 }}>{job.office?.company_name}</td>
                                            <td style={{ padding: "11px 14px" }}>
                                                <span style={{ background: theme.primarySoft, color: theme.primary, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                                                    {(() => { const opt = JOB_TYPE_OPTS.find(t => t.value === job.type); const v = opt?.labelKey ? tr(opt.labelKey) : opt?.label; return v === opt?.labelKey ? opt?.label : v; })()}
                                                </span>
                                            </td>
                                            <td style={{ padding: "11px 14px", fontWeight: 700, color: theme.text, fontSize: 12 }}>{job.slots}</td>
                                            <td style={{ padding: "11px 14px" }}>
                                                <button onClick={() => { handleSelectJob(job); setTab("applications"); }} style={{
                                                    padding: "3px 10px", borderRadius: 6,
                                                    border: `1px solid ${theme.primarySoft}`,
                                                    background: theme.primarySoft, color: theme.primary,
                                                    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                                }}>
                                                    {job.applications_count || 0}
                                                </button>
                                            </td>
                                            <td style={{ padding: "11px 14px", color: theme.textMute, fontSize: 11 }}>{job.deadline || "—"}</td>
                                            <td style={{ padding: "11px 14px" }}><StatusPill status={job.status} opts={JOB_STATUS_OPTS} dark={dark} small tr={tr} /></td>
                                            <td style={{ padding: "11px 14px" }}>
                                                {isAdmin ? (
                                                    <span style={{ fontSize: 11, color: theme.textMute }}>{tr("recruitment.labels.viewOnly")}</span>
                                                ) : (
                                                    <div style={{ display: "flex", gap: 5 }}>
                                                        <button onClick={() => { setEditJob(job); setJobModal(true); }} style={{
                                                            padding: "4px 10px", borderRadius: 6,
                                                            border: `1px solid ${theme.border}`, background: "transparent",
                                                            color: theme.textSoft, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                                        }}>{tr("recruitment.actions.edit")}</button>
                                                        <button onClick={() => setDeleteJobModal(job)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${theme.dangerSoft}`, background: theme.dangerSoft, color: theme.danger, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.delete")}</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ═══ APPLICATIONS TAB — full width ═══ */}
                {tab === "applications" && (
                    <div>
                        {/* ── Job selector: Search+Status fixed left, chips scroll right ── */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>

                            {/* Fixed left: search + status filters */}
                            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                                <div style={{ position: "relative" }}>
                                    <input value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                                        placeholder={tr("recruitment.placeholders.searchJobs")}
                                        style={{
                                            height: 34, padding: "0 12px 0 30px",
                                            border: `1px solid ${theme.border}`, borderRadius: 8,
                                            background: theme.surface, color: theme.text,
                                            fontSize: 12, outline: "none", width: 150, fontFamily: "inherit",
                                        }}
                                        onFocus={e => e.target.style.borderColor = theme.primary}
                                        onBlur={e => e.target.style.borderColor = theme.border}
                                    />
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                </div>

                                {isAdmin && (
                                    <PremiumSelect options={officeOpts} value={filterOffice} onChange={v => setFilterOffice(v)} width={130} dark={dark} theme={theme} zIndex={4000} tr={tr} />
                                )}
                                <PremiumSelect options={jobStatusOpts} value={filterStatus} onChange={v => setFilterStatus(v)} width={110} dark={dark} theme={theme} zIndex={4000} tr={tr} />

                                {/* Separator */}
                                <div style={{ width: 1, height: 22, background: theme.border, flexShrink: 0 }} />
                            </div>

                            {/* Scrollable chips — only the job chips scroll */}
                            <div style={{
                                display: "flex", gap: 6,
                                overflowX: "auto", flex: 1,
                                paddingBottom: 2,
                            }} className="rc-hide">
                                {filteredJobs.map(job => {
                                    const isActive = selectedJob?.id === job.id;
                                    const appCount = recentApps.filter(a => a.job_posting_id === job.id).length;
                                    return (
                                        <button key={job.id} onClick={() => handleSelectJob(job)} style={{
                                            height: 34, padding: "0 12px", borderRadius: 8, flexShrink: 0,
                                            border: `1px solid ${isActive ? theme.primary : theme.border}`,
                                            background: isActive ? (dark ? "rgba(124,58,237,0.14)" : "#faf5ff") : theme.surface,
                                            color: isActive ? theme.primary : theme.textSoft,
                                            fontSize: 12, fontWeight: isActive ? 700 : 500,
                                            cursor: "pointer", fontFamily: "inherit",
                                            display: "flex", alignItems: "center", gap: 6,
                                            transition: "all 0.15s",
                                            boxShadow: isActive ? `0 0 0 2px ${theme.primary}22` : "none",
                                            maxWidth: 180,
                                        }}>
                                            <span style={{
                                                overflow: "hidden", textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }} title={job.title}>{job.title}</span>
                                            {appCount > 0 && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 99,
                                                    flexShrink: 0,
                                                    background: isActive ? theme.primary : (dark ? "rgba(255,255,255,0.1)" : "#f3f4f6"),
                                                    color: isActive ? "#fff" : theme.textMute,
                                                }}>{appCount}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedJob && (
                            <>
                                {/* ── Selected job info + filter pills ── */}
                                <div style={{
                                    background: theme.surface, border: `1px solid ${theme.border}`,
                                    borderRadius: 12, padding: "12px 18px", marginBottom: 10,
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    gap: 12, flexWrap: "wrap", boxShadow: theme.shadow,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{selectedJob.title}</span>
                                            <span style={{ fontSize: 12, color: theme.textMute, marginLeft: 8 }}>{selectedJob.office?.company_name}</span>
                                            <span style={{ fontSize: 12, color: theme.textMute, marginLeft: 6 }}>· <span style={{ fontWeight: 700, color: selectedJobApps.length > 0 ? theme.primary : theme.textMute }}>{selectedJobApps.length} {selectedJobApps.length !== 1 ? tr("recruitment.labels.applicants") : tr("recruitment.labels.applicant")}</span></span>
                                        </div>
                                    </div>

                                    {/* Filter pills */}
                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                                        {[{ value: "all", label: tr("recruitment.status.all"), color: theme.primary, bg: theme.primarySoft, darkBg: theme.primarySoft }, ...APP_STATUS_OPTS].map(s => (
                                            <button key={s.value} type="button"
                                                onClick={() => { setAppFilter(s.value); setSelectedApps([]); }}
                                                style={{
                                                    padding: "4px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                                                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                                    border: appFilter === s.value ? `1.5px solid ${s.color}` : `1px solid ${theme.border}`,
                                                    background: appFilter === s.value ? (dark ? s.darkBg : s.bg) : "transparent",
                                                    color: appFilter === s.value ? s.color : theme.textMute,
                                                }}>
                                                {s.labelKey ? (tr(s.labelKey) === s.labelKey ? s.label : tr(s.labelKey)) : s.label}
                                                {s.value !== "all" && selectedJobApps.filter(a => a.status === s.value).length > 0 && (
                                                    <span style={{ marginLeft: 4, opacity: 0.7 }}>({selectedJobApps.filter(a => a.status === s.value).length})</span>
                                                )}
                                            </button>
                                        ))}

                                        {!isAdmin && filteredApps.length > 1 && (
                                            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: theme.textMute, cursor: "pointer", userSelect: "none", marginLeft: 4 }}>
                                                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 13, height: 13, accentColor: theme.primary, cursor: "pointer" }} />
                                                {tr("recruitment.status.all")}
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* ── Applicant cards — full width, clean ── */}
                                {filteredApps.length === 0 ? (
                                    <div style={{
                                        background: theme.surface, border: `1px solid ${theme.border}`,
                                        borderRadius: 12, padding: "44px 24px", textAlign: "center",
                                    }}>
                                        <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{tr("recruitment.empty.noApplicationsYet")}</div>
                                        <div style={{ fontSize: 11, color: theme.textMute }}>{tr("recruitment.empty.applicationsWillAppear")}</div>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: theme.surface, border: `1px solid ${theme.border}`,
                                        borderRadius: 12, overflow: "hidden", boxShadow: theme.shadow,
                                    }}>
                                        {filteredApps.map((app, idx) => {
                                            const initials = app.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                                            const avatarBg = ["#7c3aed","#0891b2","#059669","#d97706","#dc2626","#6366f1"][app.name.charCodeAt(0) % 6];
                                            const isSelected = selectedApps.includes(app.id);
                                            const isLast = idx === filteredApps.length - 1;

                                            return (
                                                <div key={app.id} className="rc-app-card" style={{
                                                    display: "flex", alignItems: "stretch",
                                                    borderBottom: isLast ? "none" : `1px solid ${theme.border}`,
                                                    background: isSelected ? (dark ? "rgba(124,58,237,0.06)" : "#fdf8ff") : "transparent",
                                                    transition: "all 0.15s",
                                                }}>
                                                    {/* Left accent */}
                                                    <div style={{ width: 3, background: avatarBg, flexShrink: 0 }} />

                                                    <div style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>

                                                        {/* Checkbox */}
                                                        {!isAdmin && (
                                                            <div style={{ paddingTop: 2, flexShrink: 0 }}>
                                                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(app.id)}
                                                                    style={{ width: 13, height: 13, accentColor: theme.primary, cursor: "pointer" }} />
                                                            </div>
                                                        )}

                                                        {/* Avatar */}
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                                            background: avatarBg, display: "flex", alignItems: "center",
                                                            justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff",
                                                        }}>{initials}</div>

                                                        {/* Info */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            {/* Row 1: name + status */}
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                                                <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{app.name}</span>
                                                                <StatusPill status={app.status} opts={APP_STATUS_OPTS} dark={dark} small tr={tr} />
                                                            </div>

                                                            {/* Row 2: email · phone · ref · date — inline chips */}
                                                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                                                                <a href={`mailto:${app.email}`} style={{ fontSize: 11, color: theme.textMute, textDecoration: "none" }}>
                                                                    {app.email}
                                                                </a>
                                                                {app.phone && <span style={{ fontSize: 11, color: theme.textMute }}>{app.phone}</span>}
                                                                <span style={{ fontSize: 10, color: theme.textMute, fontFamily: "monospace", background: dark ? "rgba(255,255,255,0.06)" : "#f3f4f6", padding: "1px 6px", borderRadius: 4 }}>
                                                                    #{app.reference_code}
                                                                </span>
                                                                <span style={{ fontSize: 10, color: theme.textMute }}>{tr("recruitment.labels.applied")} {app.applied_at}</span>
                                                            </div>

                                                            {/* HR note — inline, no box */}
                                                            {app.hr_note && (
                                                                <div style={{ display: "inline-flex", alignItems: "baseline", marginBottom: 6 }}>
                                                                    <span style={{ fontSize: 9, fontWeight: 800, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.5px", marginRight: 6 }}>{tr("recruitment.labels.note")}</span>
                                                                    <span style={{ fontSize: 11, color: theme.textSoft, fontStyle: "italic" }}>{app.hr_note}</span>
                                                                </div>
                                                            )}

                                                            {/* Interview info — compact, no heavy box */}
                                                            {app.interview && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 5 }}>
                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tr("recruitment.labels.interview")}</span>
                                                                    <span style={{ fontSize: 11, color: dark ? "#7dd3fc" : "#0c4a6e", fontWeight: 600 }}>📅 {app.interview.scheduled_at}</span>
                                                                    {app.interview.meeting_link && (
                                                                        <a href={app.interview.meeting_link} target="_blank" rel="noopener noreferrer"
                                                                            style={{ fontSize: 11, color: "#0891b2", textDecoration: "none" }}>
                                                                            🔗 {tr("recruitment.labels.link")}
                                                                        </a>
                                                                    )}
                                                                    {app.interview.location && (
                                                                        <span style={{ fontSize: 11, color: theme.textMute }}>📍 {app.interview.location}</span>
                                                                    )}
                                                                    {app.interview.score != null && (
                                                                        <>
                                                                            <span style={{ color: theme.border }}>·</span>
                                                                            <span style={{ fontSize: 11, fontWeight: 700, color: app.interview.score >= 70 ? "#059669" : app.interview.score >= 50 ? "#d97706" : "#dc2626" }}>
                                                                                {app.interview.score}/100
                                                                            </span>
                                                                            {app.interview.recommendation && (
                                                                                <span style={{
                                                                                    fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                                                                                    background: app.interview.recommendation === "proceed" ? (dark ? "rgba(5,150,105,0.16)" : "#d1fae5") : app.interview.recommendation === "hold" ? (dark ? "rgba(217,119,6,0.16)" : "#fef3c7") : (dark ? "rgba(220,38,38,0.16)" : "#fee2e2"),
                                                                                    color: app.interview.recommendation === "proceed" ? "#059669" : app.interview.recommendation === "hold" ? "#d97706" : "#dc2626",
                                                                                }}>
                                                                                    {app.interview.recommendation.charAt(0).toUpperCase() + app.interview.recommendation.slice(1)}
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* ── Action buttons — compact right column ── */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                                            {/* CV */}
                                                            <a href={app.cv_download_url || `/recruitment/applications/${app.id}/cv`} style={{
                                                                display: "inline-flex", alignItems: "center", gap: 4,
                                                                padding: "5px 10px", borderRadius: 7,
                                                                background: "transparent",
                                                                border: `1px solid ${theme.border}`,
                                                                color: theme.textSoft, fontSize: 11, fontWeight: 600,
                                                                textDecoration: "none", whiteSpace: "nowrap",
                                                                transition: "all 0.15s",
                                                            }}
                                                                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary; }}
                                                                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textSoft; }}
                                                            >
                                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                                    <polyline points="7 10 12 15 17 10"/>
                                                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                                                </svg>
                                                                CV
                                                            </a>

                                                            {/* HR actions */}
                                                            {!isAdmin && (
                                                                <>
                                                                    <button onClick={() => setNoteModal(app)} style={{
                                                                        padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                                                                        border: "none", background: theme.primarySoft,
                                                                        color: theme.primary, cursor: "pointer", fontFamily: "inherit",
                                                                        transition: "opacity 0.15s",
                                                                    }}
                                                                        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                                                                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                                                    >
                                                                        {tr("recruitment.table.status")}
                                                                    </button>

                                                                    <button onClick={() => setInterviewModal(app)} style={{
                                                                        padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                                                                        border: "none",
                                                                        background: app.interview ? (dark ? "rgba(8,145,178,0.14)" : "#e0f2fe") : (dark ? "rgba(255,255,255,0.06)" : "#f3f4f6"),
                                                                        color: app.interview ? "#0891b2" : theme.textMute,
                                                                        cursor: "pointer", fontFamily: "inherit",
                                                                        transition: "opacity 0.15s",
                                                                    }}
                                                                        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                                                                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                                                    >
                                                                        {app.interview ? tr("recruitment.actions.reschedule") : tr("recruitment.labels.interview")}
                                                                    </button>

                                                                    {app.status === "interview" && (
                                                                        <button onClick={() => setScoreModal(app)} style={{
                                                                            padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                                                                            border: "none",
                                                                            background: app.interview?.score != null ? (dark ? "rgba(5,150,105,0.14)" : "#d1fae5") : (dark ? "rgba(217,119,6,0.12)" : "#fef3c7"),
                                                                            color: app.interview?.score != null ? "#059669" : "#d97706",
                                                                            cursor: "pointer", fontFamily: "inherit",
                                                                            transition: "opacity 0.15s",
                                                                        }}
                                                                            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                                                                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                                                        >
                                                                            {app.interview?.score != null ? `⭐ ${app.interview.score}` : tr("recruitment.labels.score")}
                                                                        </button>
                                                                    )}

                                                                    {app.status === "rejected" && (
                                                                        <button onClick={() => setDeleteModal(app)} style={{
                                                                            width: 28, height: 28, padding: 0, borderRadius: 7, fontSize: 11,
                                                                            border: "none", background: "transparent",
                                                                            color: dark ? "rgba(248,113,113,0.4)" : "#fca5a5",
                                                                            cursor: "pointer", fontFamily: "inherit",
                                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                                            transition: "all 0.15s",
                                                                        }}
                                                                            onMouseEnter={e => { e.currentTarget.style.background = dark ? "rgba(248,113,113,0.16)" : "#fee2e2"; e.currentTarget.style.color = dark ? "#f87171" : "#dc2626"; }}
                                                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = dark ? "rgba(248,113,113,0.4)" : "#fca5a5"; }}
                                                                        >
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="3 6 5 6 21 6"/>
                                                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                                                <path d="M10 11v6M14 11v6"/>
                                                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Modals — unchanged */}
            {jobModal && !isAdmin && <JobModal offices={offices} editJob={editJob} hrOffice={hrOffice} onClose={() => { setJobModal(false); setEditJob(null); }} dark={dark} theme={theme} tr={tr} />}
            {noteModal && !isAdmin && <StatusModal app={noteModal} onClose={() => setNoteModal(null)} dark={dark} theme={theme} tr={tr} />}
            {interviewModal && !isAdmin && <InterviewModal app={interviewModal} onClose={() => setInterviewModal(null)} dark={dark} theme={theme} tr={tr} />}
            {scoreModal && !isAdmin && <ScoreModal app={scoreModal} onClose={() => setScoreModal(null)} dark={dark} theme={theme} tr={tr} />}
            {bulkModal && !isAdmin && <BulkModal ids={selectedApps} onClose={() => setBulkModal(false)} onDone={() => { setBulkModal(false); setSelectedApps([]); }} dark={dark} theme={theme} tr={tr} />}
            {deleteModal && !isAdmin && <DeleteModal app={deleteModal} onClose={() => setDeleteModal(null)} tr={tr} />}
            {deleteJobModal && !isAdmin && <DeleteJobModal job={deleteJobModal} onClose={() => setDeleteJobModal(null)} tr={tr} />}
        </AppLayout>
    );
}

// ─────────────────────────────────────────────────────────────────
// JobModal
// ─────────────────────────────────────────────────────────────────
function JobModal({ offices, editJob, hrOffice, onClose, dark, theme, tr }) {
    const isEdit = !!editJob;
    const [descItems,  setDescItems]  = useState(() => toArr(editJob?.description || ""));
    const [reqItems,   setReqItems]   = useState(() => toArr(editJob?.requirements || ""));
    const [respItems,  setRespItems]  = useState(() => toArr(editJob?.responsibilities || ""));
    const [negotiate,  setNegotiate]  = useState(() => editJob?.salary_range === "Negotiable" || false);
    const [errs,       setErrs]       = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [data, setDataState] = useState({
        // hrOffice ရှိရင် auto-set, မရှိရင် (admin case) empty
        brycen_office_id: editJob?.brycen_office_id
            ? String(editJob.brycen_office_id)
            : (hrOffice ? String(hrOffice.id) : ""),
        title:            editJob?.title || "",
        department:       editJob?.department || "",
        type:             editJob?.type || "full_time",
        slots:            editJob?.slots || 1,
        salary_range:     editJob?.salary_range || "",
        status:           editJob?.status || "open",
        deadline:         editJob?.deadline || "",
    });
    const setData = (k, v) => setDataState(p => ({ ...p, [k]: v }));
    const inp = useInpStyle(theme, dark);
    const officeOpts = offices.map(o => ({ value: String(o.id), label: o.company_name }));

    const validate = () => {
        const e = {};
        if (!data.brycen_office_id) e.brycen_office_id = tr("recruitment.validation.selectCompanyOffice");
        if (!data.type) e.type = tr("recruitment.validation.selectJobType");
        if (!data.title.trim()) e.title = tr("recruitment.validation.jobTitleRequired");
        if (!data.slots || parseInt(data.slots) < 1) e.slots = tr("recruitment.validation.atLeastOnePosition");
        if (!negotiate && !data.salary_range.trim()) e.salary_range = tr("recruitment.validation.salaryOrNegotiable");
        if (!descItems.filter(s => s.trim()).length) e.description = tr("recruitment.validation.descriptionPoint");
        if (!reqItems.filter(s => s.trim()).length) e.requirements = tr("recruitment.validation.requirementPoint");
        return e;
    };

    const submit = (e) => {
        e.preventDefault();
        const v = validate();
        if (Object.keys(v).length) { setErrs(v); return; }
        setErrs({}); setSubmitting(true);
        const payload = { ...data, description: toStr(descItems), requirements: toStr(reqItems), responsibilities: toStr(respItems), salary_range: negotiate ? "Negotiable" : data.salary_range };
        const opts = {
            preserveScroll: true,
            preserveState: false,   // ← fresh props ယူ
            onSuccess: () => {
                setSubmitting(false);
                onClose();
            },
            onError: () => setSubmitting(false)
        };
        isEdit
            ? router.put(`/recruitment/jobs/${editJob.id}`, payload, opts)
            : router.post("/recruitment/jobs", payload, opts);
    };

    const errTxt = (key) => errs[key] ? <div style={{ fontSize: 11, color: theme.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><span>⚠</span> {errs[key]}</div> : null;
    const lbl = { fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };

    return (
        <ModalShell onClose={onClose} maxWidth={620}>
            <ModalHeader grad="linear-gradient(135deg,#5b21b6 0%,#7c3aed 60%,#8b5cf6 100%)" icon={isEdit ? "✏️" : "📋"} subtitle={isEdit ? tr("recruitment.modal.editPosting") : tr("recruitment.modal.jobRecruitment")} title={isEdit ? editJob.title : tr("recruitment.modal.newJobPosting")} onClose={onClose} />
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: theme.surface }}>
                <div style={{ overflowY: "auto", flex: 1, padding: "24px 26px 16px", scrollbarWidth: "none" }}>
                    
                    {/* Company Office:
                        - hrOffice ရှိရင် (HR role) → read-only display, auto-selected
                        - hrOffice မရှိ → dropdown (admin မဝင်သင့်ဘဲ safeguard) */}
                    {hrOffice ? (
                        <div style={{ marginBottom: 20 }}>
                            <label style={lbl}>{tr("recruitment.fields.companyOffice")}</label>
                            <div style={{
                                padding: "10px 13px", borderRadius: 10,
                                border: `1.5px solid ${theme.inputBorder}`,
                                background: dark ? "rgba(255,255,255,0.03)" : theme.surfaceSoft,
                                fontSize: 13, fontWeight: 600, color: theme.text,
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                                🏢 {hrOffice.company_name}
                                <span style={{ fontSize: 10, color: theme.textMute, marginLeft: "auto", background: dark ? "rgba(139,92,246,0.16)" : "#ede9fe", color: theme.primary, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{tr("recruitment.labels.autoSelected")}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginBottom: 20 }}>
                            <label style={lbl}>{tr("recruitment.fields.companyOffice")} *</label>
                            <PremiumSelect options={officeOpts} value={data.brycen_office_id}
                                onChange={v => { setData("brycen_office_id", v); setErrs(p => ({ ...p, brycen_office_id: undefined })); }}
                                placeholder={tr("recruitment.placeholders.selectOffice")} width="100%" dark={dark} theme={theme} tr={tr} />
                            {errTxt("brycen_office_id")}
                        </div>
                    )}

                    {/* Job Type */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={lbl}>{tr("recruitment.fields.jobType")} *</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {JOB_TYPE_OPTS.map(t => (
                                <PillBtn key={t.value} active={data.type === t.value} onClick={() => { setData("type", t.value); setErrs(p => ({ ...p, type: undefined })); }} color={theme.primary} bg={theme.primarySoft} darkBg={theme.primarySoft} label={tr(t.labelKey)} dark={dark} />
                            ))}
                        </div>
                        {errTxt("type")}
                    </div>

                    <div style={{ height: 1, background: theme.border, margin: "4px 0 20px" }} />

                    {/* Title */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>{tr("recruitment.fields.jobTitle")} *</label>
                        <input style={inp(errs.title)} value={data.title} onChange={e => { setData("title", e.target.value); setErrs(p => ({ ...p, title: undefined })); }}
                            placeholder={tr("recruitment.placeholders.jobTitle")}
                            onFocus={e => { if (!errs.title) { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; } }}
                            onBlur={e => { if (!errs.title) { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; } }} />
                        {errTxt("title")}
                    </div>

                    {/* Dept + Slots */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={lbl}>{tr("recruitment.fields.department")}</label>
                            <input style={inp(false)} value={data.department} onChange={e => setData("department", e.target.value)} placeholder={tr("recruitment.placeholders.department")}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                        <div>
                            <label style={lbl}>{tr("recruitment.fields.positions")} *</label>
                            <input type="number" style={inp(errs.slots)} value={data.slots} min={1} onChange={e => { setData("slots", e.target.value); setErrs(p => ({ ...p, slots: undefined })); }}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = errs.slots ? theme.danger : theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                            {errTxt("slots")}
                        </div>
                    </div>

                    {/* Salary + Deadline */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={lbl}>{tr("recruitment.fields.salaryRange")}{!negotiate && " *"}</label>
                            <input style={{ ...inp(errs.salary_range), opacity: negotiate ? 0.45 : 1 }} value={negotiate ? tr("recruitment.labels.negotiable") : data.salary_range}
                                onChange={e => { setData("salary_range", e.target.value); setErrs(p => ({ ...p, salary_range: undefined })); }} disabled={negotiate} placeholder={tr("recruitment.placeholders.salaryRange")}
                                onFocus={e => { if (!errs.salary_range) { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; } }}
                                onBlur={e => { e.target.style.borderColor = errs.salary_range ? theme.danger : theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                            <label style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, cursor: "pointer", fontSize: 13, color: theme.textSoft, userSelect: "none" }}>
                                <input type="checkbox" checked={negotiate} onChange={e => { setNegotiate(e.target.checked); setErrs(p => ({ ...p, salary_range: undefined })); }} style={{ width: 15, height: 15, accentColor: theme.primary, cursor: "pointer" }} />
                                {tr("recruitment.labels.negotiable")}
                            </label>
                            {errTxt("salary_range")}
                        </div>
                        <div>
                            <label style={lbl}>{tr("recruitment.fields.applicationDeadline")}</label>
                            <input type="date" style={inp(false)} value={data.deadline} onChange={e => setData("deadline", e.target.value)}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                    </div>

                    {/* Status (edit only) */}
                    {isEdit && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={lbl}>{tr("recruitment.fields.postingStatus")}</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {JOB_STATUS_OPTS.map(s => <PillBtn key={s.value} active={data.status === s.value} onClick={() => setData("status", s.value)} color={s.color} bg={s.bg} darkBg={s.darkBg} label={s.labelKey ? (tr(s.labelKey) === s.labelKey ? s.label : tr(s.labelKey)) : s.label} dark={dark} />)}
                            </div>
                        </div>
                    )}

                    <div style={{ height: 1, background: theme.border, margin: "8px 0 20px" }} />
                        <ListField
                            label={tr("recruitment.fields.description")}
                            required
                            items={descItems}
                            onChange={v => {
                                setDescItems(v);
                                setErrs(p => ({ ...p, description: undefined }));
                            }}
                            placeholder={tr("recruitment.placeholders.descriptionPoint")}
                            error={errs.description}
                            theme={theme}
                            dark={dark}
                            tr={tr}
                        />

                        <ListField
                            label={tr("recruitment.fields.requirements")}
                            required
                            items={reqItems}
                            onChange={v => {
                                setReqItems(v);
                                setErrs(p => ({ ...p, requirements: undefined }));
                            }}
                            placeholder={tr("recruitment.placeholders.requirementPoint")}
                            error={errs.requirements}
                            theme={theme}
                            dark={dark}
                            tr={tr}
                        />

                        <ListField
                            label={tr("recruitment.fields.responsibilities")}
                            items={respItems}
                            onChange={setRespItems}
                            placeholder={tr("recruitment.placeholders.responsibilityPoint")}
                            theme={theme}
                            dark={dark}
                            tr={tr}
                        />
                </div>
                <div style={{ padding: "14px 26px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: theme.surface, flexShrink: 0 }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.cancel")}</button>
                    <button type="submit" disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: theme.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? tr("recruitment.actions.saving") : isEdit ? tr("recruitment.actions.saveChanges") : tr("recruitment.actions.createJobPosting")}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// StatusModal
// ─────────────────────────────────────────────────────────────────
function StatusModal({ app, onClose, dark, theme, tr }) {
    const { data, setData, patch, processing } = useForm({ status: app.status || "new", hr_note: app.hr_note || "" });
    const inp = useInpStyle(theme, dark);
    const submit = (e) => { e.preventDefault(); patch(`/recruitment/applications/${app.id}`, { preserveScroll: true, onSuccess: onClose }); };
    return (
        <ModalShell onClose={onClose} maxWidth={460}>
            <ModalHeader grad="linear-gradient(135deg,#5b21b6 0%,#7c3aed 60%,#8b5cf6 100%)" icon="👤" subtitle={tr("recruitment.modal.application")} title={app.name} onClose={onClose} />
            <form onSubmit={submit} style={{ background: theme.surface, padding: "24px 26px 0", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, color: theme.textMute, marginBottom: 20 }}>{app.job_posting?.title || ""} · {app.job_posting?.office?.company_name || ""}</div>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>{tr("recruitment.table.status")}</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {APP_STATUS_OPTS.map(s => <PillBtn key={s.value} active={data.status === s.value} onClick={() => setData("status", s.value)} color={s.color} bg={s.bg} darkBg={s.darkBg} label={s.labelKey ? (tr(s.labelKey) === s.labelKey ? s.label : tr(s.labelKey)) : s.label} dark={dark} />)}
                    </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>{tr("recruitment.fields.hrNote")}</label>
                    <textarea style={{ ...inp(false), minHeight: 72, resize: "vertical" }} value={data.hr_note} onChange={e => setData("hr_note", e.target.value)} placeholder={tr("recruitment.placeholders.hrNote")}
                        onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                        onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                </div>
                <div style={{ padding: "16px 0 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.cancel")}</button>
                    <button type="submit" disabled={processing} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: theme.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: processing ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: processing ? 0.7 : 1 }}>{processing ? tr("recruitment.actions.saving") : tr("recruitment.actions.saveChanges")}</button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// InterviewModal
// ─────────────────────────────────────────────────────────────────
const PLATFORM_LABELS = { zoom: "Zoom", google_meet: "Google Meet", teams: "Microsoft Teams", physical: "Physical / Onsite", other: "Other" };
function InterviewModal({ app, onClose, dark, theme, tr }) {
    const existing = app.interview;
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [data, setDataState] = useState({ scheduled_at: existing?.scheduled_at_raw || "", type: existing?.type || "online", platform: existing?.platform || "zoom", meeting_link: existing?.meeting_link || "", location: existing?.location || "", interviewer_name: existing?.interviewer_name || "", note_to_candidate: existing?.note_to_candidate || "" });
    const set = (k, v) => { setDataState(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
    const inp = useInpStyle(theme, dark);

    const validate = () => {
        const e = {};
        if (!data.scheduled_at) { e.scheduled_at = tr("recruitment.validation.selectDateTime"); }
        else if (new Date(data.scheduled_at) <= new Date()) { e.scheduled_at = tr("recruitment.validation.interviewFuture"); }
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
            onError: errs => { setSubmitting(false); const mapped = {}; if (errs.scheduled_at) mapped.scheduled_at = tr("recruitment.validation.interviewFuture"); if (errs.meeting_link) mapped.meeting_link = errs.meeting_link; setErrors(mapped); },
        });
    };
    const errTxt = key => errors[key] ? <div style={{ fontSize: 11, color: theme.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><span>⚠</span> {errors[key]}</div> : null;
    const lbl = { fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };

    return (
        <ModalShell onClose={onClose} maxWidth={540}>
            <ModalHeader grad="linear-gradient(135deg,#0369a1,#0891b2)" icon="📅" subtitle={existing ? tr("recruitment.modal.rescheduleInterview") : tr("recruitment.modal.scheduleInterview")} title={app.name} onClose={onClose} />
            <form onSubmit={submit} style={{ background: theme.surface, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: "auto", flex: 1, padding: "24px 26px 16px", scrollbarWidth: "none" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>{tr("recruitment.fields.dateTime")} *</label>
                        <input type="datetime-local" style={inp(errors.scheduled_at)} value={data.scheduled_at} onChange={e => set("scheduled_at", e.target.value)}
                            onFocus={e => { if (!errors.scheduled_at) { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; } }}
                            onBlur={e => { if (!errors.scheduled_at) { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; } }} />
                        {errTxt("scheduled_at")}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>{tr("recruitment.fields.interviewType")} *</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {["online", "onsite"].map(t => <PillBtn key={t} active={data.type === t} onClick={() => set("type", t)} color="#0891b2" bg="#e0f2fe" darkBg="rgba(8,145,178,0.16)" label={t === "online" ? `💻 ${tr("recruitment.labels.online")}` : `🏢 ${tr("recruitment.labels.onsite")}`} dark={dark} />)}
                        </div>
                    </div>
                    {data.type === "online" && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>{tr("recruitment.fields.platform")}</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {["zoom", "google_meet", "teams", "other"].map(p => <PillBtn key={p} active={data.platform === p} onClick={() => set("platform", p)} color="#0891b2" bg="#e0f2fe" darkBg="rgba(8,145,178,0.16)" label={tr(`recruitment.platforms.${p}`)} dark={dark} />)}
                            </div>
                        </div>
                    )}
                    {data.type === "online" ? (
                        <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>{tr("recruitment.fields.meetingLink")}</label>
                            <input style={inp(errors.meeting_link)} value={data.meeting_link} onChange={e => set("meeting_link", e.target.value)} placeholder="https://zoom.us/j/..."
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = errors.meeting_link ? theme.danger : theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                            {errTxt("meeting_link")}
                        </div>
                    ) : (
                        <div style={{ marginBottom: 16 }}>
                            <label style={lbl}>{tr("recruitment.fields.location")}</label>
                            <input style={inp(false)} value={data.location} onChange={e => set("location", e.target.value)} placeholder={tr("recruitment.placeholders.location")}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>{tr("recruitment.fields.interviewerName")}</label>
                        <input style={inp(false)} value={data.interviewer_name} onChange={e => set("interviewer_name", e.target.value)} placeholder={tr("recruitment.placeholders.interviewerName")}
                            onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                            onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>{tr("recruitment.fields.noteToCandidate")}</label>
                        <textarea style={{ ...inp(false), minHeight: 80, resize: "vertical" }} value={data.note_to_candidate} onChange={e => set("note_to_candidate", e.target.value)} placeholder={tr("recruitment.placeholders.noteToCandidate")}
                            onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                            onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div style={{ background: dark ? "rgba(52,211,153,0.08)" : "#f0fdf4", border: `1px solid ${dark ? "rgba(52,211,153,0.2)" : "#bbf7d0"}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: dark ? "#34d399" : "#166534", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>✉️</span> {tr("recruitment.messages.invitationEmailSent")}  <strong>{app.email}</strong>
                    </div>
                </div>
                <div style={{ padding: "14px 26px 22px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: theme.surface, flexShrink: 0 }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.cancel")}</button>
                    <button type="submit" disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: "#0891b2", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>{submitting ? tr("recruitment.actions.scheduling") : existing ? tr("recruitment.actions.rescheduleSendEmail") : tr("recruitment.actions.scheduleSendEmail")}</button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// ScoreModal
// ─────────────────────────────────────────────────────────────────
function ScoreModal({ app, onClose, dark, theme, tr }) {
    const existing = app.interview;
    const [submitting, setSubmitting] = useState(false);
    const [data, setDataState] = useState({ score: existing?.score ?? 70, strengths: existing?.strengths || "", weaknesses: existing?.weaknesses || "", recommendation: existing?.recommendation || "proceed", internal_note: existing?.internal_note || "" });
    const set = (k, v) => setDataState(p => ({ ...p, [k]: v }));
    const inp = useInpStyle(theme, dark);
    const submit = (e) => { e.preventDefault(); setSubmitting(true); router.post(`/recruitment/applications/${app.id}/score`, data, { preserveScroll: true, onSuccess: () => { setSubmitting(false); onClose(); }, onError: () => setSubmitting(false) }); };
    const scoreColor = data.score >= 70 ? "#059669" : data.score >= 50 ? "#d97706" : "#dc2626";
    const recOpts = [{ value: "proceed", label: `✅ ${tr("recruitment.recommendations.proceed")}`, color: "#059669", bg: "#d1fae5", darkBg: "rgba(5,150,105,0.16)" }, { value: "hold", label: `⏸ ${tr("recruitment.recommendations.hold")}`, color: "#d97706", bg: "#fef3c7", darkBg: "rgba(217,119,6,0.16)" }, { value: "reject", label: `❌ ${tr("recruitment.recommendations.reject")}`, color: "#dc2626", bg: "#fee2e2", darkBg: "rgba(220,38,38,0.16)" }];
    const lbl = { fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };
    return (
        <ModalShell onClose={onClose} maxWidth={500}>
            <ModalHeader grad="linear-gradient(135deg,#d97706,#f59e0b)" icon="⭐" subtitle={tr("recruitment.modal.interviewScore")} title={app.name} onClose={onClose} />
            <form onSubmit={submit} style={{ background: theme.surface, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: "auto", flex: 1, padding: "24px 26px 16px", scrollbarWidth: "none" }}>
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <label style={lbl}>{tr("recruitment.labels.score")} *</label>
                            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, letterSpacing: "-0.04em" }}>{data.score}<span style={{ fontSize: 14, fontWeight: 400, color: theme.textMute }}>/100</span></div>
                        </div>
                        <input type="range" min={0} max={100} step={1} value={data.score} onChange={e => set("score", parseInt(e.target.value))} style={{ width: "100%", accentColor: scoreColor, cursor: "pointer" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: theme.textMute, marginTop: 4 }}><span>{tr("recruitment.score.poor")}</span><span>{tr("recruitment.score.average")}</span><span>{tr("recruitment.score.excellent")}</span></div>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <label style={lbl}>{tr("recruitment.fields.recommendation")} *</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {recOpts.map(r => <PillBtn key={r.value} active={data.recommendation === r.value} onClick={() => set("recommendation", r.value)} color={r.color} bg={r.bg} darkBg={r.darkBg} label={r.label} dark={dark} />)}
                        </div>
                    </div>
                    {[[ "strengths", tr("recruitment.fields.strengths"), tr("recruitment.placeholders.strengths") ], [ "weaknesses", tr("recruitment.fields.areasForImprovement"), tr("recruitment.placeholders.weaknesses") ], [ "internal_note", tr("recruitment.fields.internalNote"), tr("recruitment.placeholders.internalNote") ]].map(([k, label, ph]) => (
                        <div key={k} style={{ marginBottom: 14 }}>
                            <label style={lbl}>{label}</label>
                            <textarea style={{ ...inp(false), minHeight: 68, resize: "vertical" }} value={data[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                                onFocus={e => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primarySoft}`; }}
                                onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                        </div>
                    ))}
                </div>
                <div style={{ padding: "14px 26px 22px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: theme.surface, flexShrink: 0 }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.cancel")}</button>
                    <button type="submit" disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: "#d97706", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>{submitting ? tr("recruitment.actions.saving") : tr("recruitment.actions.saveScore")}</button>
                </div>
            </form>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// BulkModal
// ─────────────────────────────────────────────────────────────────
function BulkModal({ ids, onClose, onDone, dark, theme, tr }) {
    const [status, setStatus] = useState("reviewing");
    const [submitting, setSubmitting] = useState(false);
    const submit = () => { setSubmitting(true); router.post("/recruitment/applications/bulk-update", { ids, status }, { preserveScroll: true, onSuccess: onDone, onError: () => setSubmitting(false) }); };
    return (
        <ModalShell onClose={onClose} maxWidth={420}>
            <ModalHeader grad="linear-gradient(135deg,#5b21b6 0%,#7c3aed 100%)" icon="✏️" subtitle={tr("recruitment.modal.bulkAction")} title={`${tr("recruitment.actions.update")} ${ids.length} ${ids.length !== 1 ? tr("recruitment.labels.applicants") : tr("recruitment.labels.applicant")}`} onClose={onClose} />
            <div style={{ background: theme.surface, padding: "24px 26px" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>{tr("recruitment.fields.setStatusTo")}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                    {APP_STATUS_OPTS.map(s => <PillBtn key={s.value} active={status === s.value} onClick={() => setStatus(s.value)} color={s.color} bg={s.bg} darkBg={s.darkBg} label={s.labelKey ? (tr(s.labelKey) === s.labelKey ? s.label : tr(s.labelKey)) : s.label} dark={dark} />)}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "10px 22px", border: `1.5px solid ${theme.border}`, borderRadius: 10, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.cancel")}</button>
                    <button onClick={submit} disabled={submitting} style={{ padding: "10px 26px", border: "none", borderRadius: 10, background: theme.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>{submitting ? tr("recruitment.actions.updating") : tr("recruitment.actions.applyToAll")}</button>
                </div>
            </div>
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────
// DeleteModal
// ─────────────────────────────────────────────────────────────────
function DeleteModal({ app, onClose, tr }) {
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
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{tr("recruitment.modal.deleteApplication")}</div>
                    <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>{tr("recruitment.delete.applicationWarning")} <strong style={{ color: "#dc2626" }}>{tr("recruitment.delete.cannotBeUndone")}</strong></div>
                    <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: avatarBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{app.name}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>{app.email}</div>
                        </div>
                    </div>
                    <div style={{ background: "#fff7f7", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{tr("recruitment.delete.willBeDeleted")}</div>
                        {[tr("recruitment.delete.applicationRecord"), tr("recruitment.delete.uploadedCv"), tr("recruitment.delete.interviewRecord")].map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: "#6b7280" }}>{item}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.cancel")}</button>
                        <button onClick={confirm} disabled={submitting} style={{ flex: 1, padding: 11, border: "none", borderRadius: 10, background: submitting ? "#fca5a5" : "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {submitting ? tr("recruitment.actions.deleting") : `🗑️ ${tr("recruitment.actions.deletePermanently")}`}
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
function DeleteJobModal({ job, onClose, tr }) {
    const [submitting, setSubmitting] = useState(false);
    const appCount = job.applications_count || 0;
    const confirm = () => { setSubmitting(true); router.delete(`/recruitment/jobs/${job.id}`, { preserveScroll: true, onSuccess: onClose, onError: () => setSubmitting(false) }); };
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17,24,39,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.26)", animation: "rcPopIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ height: 4, background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
                <div style={{ padding: "28px 28px 24px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18 }}>📋</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{tr("recruitment.modal.deleteJobPosting")}</div>
                    <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, marginBottom: 20 }}>{tr("recruitment.delete.areYouSure")} <strong style={{ color: "#dc2626" }}>{tr("recruitment.delete.cannotBeUndone")}</strong></div>
                    <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{job.office?.company_name} · {job.slots} {job.slots > 1 ? tr("recruitment.labels.positions") : tr("recruitment.labels.position")}</div>
                    </div>
                    {appCount > 0 ? (
                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderLeft: "4px solid #f59e0b", borderRadius: "0 10px 10px 0", padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10 }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                            <div><div style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{appCount} {appCount > 1 ? tr("recruitment.labels.applications") : tr("recruitment.labels.application")} {tr("recruitment.delete.willAlsoBeDeleted")}</div><div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>{tr("recruitment.delete.allDataRemoved")}</div></div>
                        </div>
                    ) : (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 24, display: "flex", gap: 8, alignItems: "center" }}>
                            <span>✅</span><span style={{ fontSize: 12, color: "#166534" }}>{tr("recruitment.delete.noApplicationsSafe")}</span>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{tr("recruitment.actions.cancel")}</button>
                        <button onClick={confirm} disabled={submitting} style={{ flex: 1, padding: 11, border: "none", borderRadius: 10, background: submitting ? "#fca5a5" : "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {submitting ? tr("recruitment.actions.deleting") : `🗑️ ${tr("recruitment.actions.deletePosting")}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}