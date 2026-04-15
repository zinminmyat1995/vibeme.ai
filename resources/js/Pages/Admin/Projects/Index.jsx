import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Theme System  (identical to Show.jsx / Assignments/Index.jsx)
// ─────────────────────────────────────────────────────────────────────────────
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
        return () => {
            window.removeEventListener("vibeme-theme-change", sync);
            window.removeEventListener("storage", sync);
        };
    }, []);
    return dark;
}

function getTheme(dark) {
    if (dark) return {
        bg:            "#080e1a",
        surface:       "rgba(15,26,50,0.92)",
        surfaceSoft:   "rgba(255,255,255,0.04)",
        surfaceSofter: "rgba(255,255,255,0.06)",
        border:        "rgba(148,163,184,0.10)",
        borderStrong:  "rgba(148,163,184,0.18)",
        text:          "#f1f5f9",
        textSoft:      "#94a3b8",
        textMute:      "#475569",
        shadow:        "0 24px 64px rgba(0,0,0,0.48)",
        shadowSoft:    "0 8px 24px rgba(0,0,0,0.32)",
        primary:       "#6366f1",
        primarySoft:   "rgba(99,102,241,0.18)",
        danger:        "#ef4444",
        inputBg:       "rgba(255,255,255,0.04)",
        inputBorder:   "rgba(148,163,184,0.14)",
        rowHover:      "rgba(255,255,255,0.03)",
        overlay:       "rgba(2,8,23,0.78)",
        headerGrad:    "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(59,130,246,0.08))",
    };
    return {
        bg:            "#f1f5f9",
        surface:       "#ffffff",
        surfaceSoft:   "#f8fafc",
        surfaceSofter: "#f1f5f9",
        border:        "rgba(15,23,42,0.07)",
        borderStrong:  "rgba(15,23,42,0.12)",
        text:          "#0f172a",
        textSoft:      "#475569",
        textMute:      "#94a3b8",
        shadow:        "0 20px 60px rgba(15,23,42,0.08)",
        shadowSoft:    "0 6px 20px rgba(15,23,42,0.06)",
        primary:       "#6366f1",
        primarySoft:   "#eef2ff",
        danger:        "#ef4444",
        inputBg:       "#f8fafc",
        inputBorder:   "#e2e8f0",
        rowHover:      "#f8fafc",
        overlay:       "rgba(15,23,42,0.42)",
        headerGrad:    "linear-gradient(135deg,#f8faff,#eef2ff)",
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const ST = {
    active:    { label:"Active",    color:"#16a34a", bg:"#f0fdf4", bgDark:"rgba(22,163,74,0.15)",   border:"#86efac" },
    upcoming:  { label:"Upcoming",  color:"#2563eb", bg:"#eff6ff", bgDark:"rgba(37,99,235,0.15)",   border:"#93c5fd" },
    completed: { label:"Completed", color:"#7c3aed", bg:"#f5f3ff", bgDark:"rgba(124,58,237,0.15)", border:"#c4b5fd" },
    cancelled: { label:"Cancelled", color:"#9ca3af", bg:"#f9fafb", bgDark:"rgba(156,163,175,0.12)",border:"#d1d5db" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmt(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
function daysLeft(end, status) {
    if (!end || status === "completed" || status === "cancelled") return null;
    const d = Math.ceil((new Date(end) - new Date()) / 864e5);
    if (d < 0)   return { label:`${Math.abs(d)}d overdue`, color:"#ef4444", bgLight:"#fef2f2", bgDark:"rgba(239,68,68,0.14)" };
    if (d === 0) return { label:"Due today",               color:"#f59e0b", bgLight:"#fefce8", bgDark:"rgba(245,158,11,0.14)" };
    if (d <= 7)  return { label:`${d}d left`,              color:"#f59e0b", bgLight:"#fefce8", bgDark:"rgba(245,158,11,0.14)" };
    return             { label:`${d} days left`,           color:"#6b7280", bgLight:"#f3f4f6", bgDark:"rgba(107,114,128,0.14)" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
function Ava({ name, url, size = 28 }) {
    const [err, setErr] = useState(false);
    const letters = name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";
    const colors  = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#14b8a6"];
    const bg      = colors[(name?.charCodeAt(0)||0) % colors.length];
    const src     = url ? (url.startsWith("http")||url.startsWith("/")||url.startsWith("data:") ? url : `/storage/${url}`) : null;
    if (src && !err) return <img src={src} alt={name} onError={() => setErr(true)}
        style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover",
            border:"2px solid rgba(255,255,255,0.2)", boxShadow:"0 1px 4px rgba(0,0,0,0.15)", flexShrink:0 }} />;
    return <div style={{ width:size, height:size, borderRadius:"50%", background:bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:size*0.36, fontWeight:700, color:"#fff", flexShrink:0,
        border:"2px solid rgba(255,255,255,0.2)", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }}>{letters}</div>;
}

function StatusPill({ status, dark }) {
    const s = ST[status] || ST.cancelled;
    return <span style={{ fontSize:10, fontWeight:700, color:s.color,
        background: dark ? s.bgDark : s.bg,
        border:`1px solid ${dark ? s.color+"44" : s.border}`,
        padding:"3px 10px", borderRadius:99, textTransform:"uppercase",
        letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{s.label}</span>;
}

function Spinner({ color = "#fff" }) {
    return <>
        <span style={{ display:"inline-block", width:13, height:13,
            border:`2px solid ${color}44`, borderTopColor:color,
            borderRadius:"50%", animation:"idxSpin 0.7s linear infinite" }} />
        <style>{`@keyframes idxSpin{to{transform:rotate(360deg)}}`}</style>
    </>;
}

function FieldLabel({ children, t }) {
    return <label style={{ fontSize:11, fontWeight:700, color:t.textMute, display:"block",
        marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>{children}</label>;
}

function inp(t, err=false) {
    return { width:"100%", background:t.inputBg, border:`1.5px solid ${err?"#fca5a5":t.inputBorder}`,
        borderRadius:10, padding:"9px 13px", color:t.text, fontSize:13, outline:"none",
        boxSizing:"border-box", transition:"border-color 0.15s", fontFamily:"inherit" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Update Modal
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({ projectName, onConfirm, onCancel, t, dark }) {
    return (
        <div style={{ position:"fixed", inset:0, background:t.overlay,
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:1000, backdropFilter:"blur(6px)" }} onClick={onCancel}>
            <div onClick={e => e.stopPropagation()} style={{
                background: dark?"rgba(12,20,42,0.98)":"#ffffff",
                border:`1.5px solid ${t.borderStrong}`,
                borderRadius:20, width:400, padding:"32px 28px",
                boxShadow:t.shadow, textAlign:"center", backdropFilter:"blur(20px)" }}>
                <div style={{ width:52, height:52, borderRadius:14, margin:"0 auto 14px",
                    background: dark?"rgba(16,185,129,0.16)":"#d1fae5",
                    border:`1.5px solid ${dark?"rgba(16,185,129,0.3)":"#6ee7b7"}`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>✏️</div>
                <h3 style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:8 }}>Confirm Update</h3>
                <p style={{ fontSize:13, color:t.textSoft, marginBottom:24, lineHeight:1.7 }}>
                    Are you sure you want to update<br/>
                    <strong style={{ color:t.text }}>"{projectName}"</strong>?
                </p>
                <div style={{ display:"flex", gap:10 }}>
                    <button onClick={onCancel} style={{ flex:1, padding:"11px", background:t.surfaceSoft,
                        border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSoft,
                        fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
                    <button onClick={onConfirm} style={{ flex:1, padding:"11px",
                        background:"linear-gradient(135deg,#059669,#10b981)",
                        border:"none", borderRadius:12, color:"#fff",
                        fontSize:13, fontWeight:700, cursor:"pointer",
                        boxShadow:"0 4px 14px rgba(5,150,105,0.38)",
                        fontFamily:"inherit" }}>✅ Yes, Update</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Modal (Create / Edit) — all original logic preserved
// ─────────────────────────────────────────────────────────────────────────────
function ProjectModal({ project, onClose, onSuccess, onError, t, dark }) {
    const isEdit = !!project;
    const [form, setForm] = useState({
        name:        project?.name        || "",
        description: project?.description || "",
        status:      project?.status      || "upcoming",
        start_date:  project?.start_date  ? project.start_date.slice(0,10) : "",
        end_date:    project?.end_date    ? project.end_date.slice(0,10)   : "",
    });
    const [errors, setErrors]       = useState({});
    const [showConfirm, setConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const set = (k,v) => setForm(f => ({...f,[k]:v}));

    const validate = () => {
        const e = {};
        if (!form.name)       e.name       = "Required";
        if (!form.start_date) e.start_date = "Required";
        if (!form.end_date)   e.end_date   = "Required";
        if (form.start_date && form.end_date && form.end_date < form.start_date)
            e.end_date = "Must be after start date";
        return e;
    };

    const handleClick = () => {
        const e = validate();
        if (Object.keys(e).length) return setErrors(e);
        if (isEdit) {
            setConfirm(true);
        } else {
            if (submitting) return;
            setSubmitting(true);
            router.post("/admin/projects", form, {
                onSuccess: () => { setSubmitting(false); onSuccess("Project created successfully!"); onClose(); },
                onError:   () => { setSubmitting(false); onError("Failed to create project. Please try again."); },
            });
        }
    };

    const handleConfirm = () => {
        setConfirm(false);
        setSubmitting(true);
        router.put(`/admin/projects/${project.id}`, form, {
            preserveState:  true,
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onSuccess("Project updated successfully!"); onClose(); },
            onError:   () => { setSubmitting(false); onError("Failed to update project. Please try again."); },
        });
    };

    const statusOpts = [
        { value:"upcoming",  label:"Upcoming",  icon:"🕐" },
        { value:"active",    label:"Active",    icon:"⚡" },
        { value:"completed", label:"Completed", icon:"✅" },
        { value:"cancelled", label:"Cancelled", icon:"🚫" },
    ];

    return (
        <>
            <div style={{ position:"fixed", inset:0, background:t.overlay,
                display:"flex", alignItems:"center", justifyContent:"center",
                zIndex:1000, padding:20, backdropFilter:"blur(6px)" }} onClick={onClose}>
                <div onClick={e => e.stopPropagation()} style={{
                    background: dark?"rgba(10,17,38,0.99)":"#ffffff",
                    border:`1.5px solid ${t.borderStrong}`,
                    borderRadius:20, width:"100%", maxWidth:480,
                    boxShadow:t.shadow, overflow:"hidden", backdropFilter:"blur(20px)" }}>

                    {/* Header */}
                    <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${t.border}`, background:t.headerGrad }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                    <h2 style={{ fontSize:16, fontWeight:800, color:t.text, margin:0 }}>
                                        {isEdit ? "Edit Project" : "New Project"}
                                    </h2>
                                    {isEdit && (
                                        <span style={{ fontSize:12, color:t.textMute }}>—</span>
                                    )}
                                    {isEdit && (
                                        <span style={{ fontSize:13, fontWeight:600, color:t.primary }}>{project?.name}</span>
                                    )}
                                </div>
                                <p style={{ fontSize:12, color:t.textMute, marginTop:3, margin:"4px 0 0 0" }}>
                                    {isEdit ? "Update the project details below" : "Fill in the project details below"}
                                </p>
                            </div>
                            <button onClick={onClose} style={{ background:t.surfaceSoft, border:`1.5px solid ${t.border}`,
                                borderRadius:10, width:32, height:32, cursor:"pointer", color:t.textMute, fontSize:16,
                                display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>

                        {/* Name */}
                        <div>
                            <FieldLabel t={t}>Project Name *</FieldLabel>
                            <input value={form.name} onChange={e => set("name",e.target.value)}
                                placeholder="e.g. CRM System v2" style={inp(t, !!errors.name)} />
                            {errors.name && <p style={{ fontSize:11, color:"#ef4444", marginTop:3 }}>{errors.name}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <FieldLabel t={t}>Description <span style={{ fontWeight:400, textTransform:"none" }}>(optional)</span></FieldLabel>
                            <textarea value={form.description} onChange={e => set("description",e.target.value)}
                                placeholder="Brief project description…" rows={2}
                                style={{ ...inp(t), resize:"vertical" }} />
                        </div>

                        {/* Status — segmented buttons */}
                        <div>
                            <FieldLabel t={t}>Status</FieldLabel>
                            <div style={{ display:"flex", gap:6 }}>
                                {statusOpts.map(opt => {
                                    const s   = ST[opt.value];
                                    const sel = form.status === opt.value;
                                    return (
                                        <button key={opt.value} type="button"
                                            onClick={() => set("status", opt.value)}
                                            style={{ flex:1, padding:"8px 4px", borderRadius:10, cursor:"pointer",
                                                border:`1.5px solid ${sel ? (dark?s.color+"88":s.border) : t.inputBorder}`,
                                                background: sel ? (dark?s.bgDark:s.bg) : t.inputBg,
                                                color: sel ? s.color : t.textMute,
                                                fontSize:11, fontWeight:700, transition:"all 0.15s",
                                                display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                                                fontFamily:"inherit" }}>
                                            <span style={{ fontSize:14 }}>{opt.icon}</span>
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dates */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                            {[["Start Date *","start_date"],["End Date *","end_date"]].map(([lbl,key]) => (
                                <div key={key}>
                                    <FieldLabel t={t}>{lbl}</FieldLabel>
                                    <input type="date" value={form[key]} onChange={e => set(key,e.target.value)}
                                        style={inp(t, !!errors[key])} />
                                    {errors[key] && <p style={{ fontSize:11, color:"#ef4444", marginTop:3 }}>{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding:"0 24px 22px", display:"flex", gap:10 }}>
                        <button onClick={onClose} style={{ flex:1, padding:"11px", background:t.surfaceSoft,
                            border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSoft,
                            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
                        <button onClick={handleClick} disabled={submitting} style={{ flex:2, padding:"11px",
                            background: submitting
                                ? (isEdit?"#6ee7b7":"#a5b4fc")
                                : isEdit
                                    ? "linear-gradient(135deg,#059669,#10b981)"
                                    : "linear-gradient(135deg,#4f46e5,#3b82f6)",
                            border:"none", borderRadius:12, color:"#fff",
                            fontSize:13, fontWeight:700, cursor:submitting?"not-allowed":"pointer",
                            opacity:submitting?0.85:1,
                            boxShadow: submitting?"none":isEdit
                                ?"0 4px 14px rgba(5,150,105,0.35)"
                                :"0 4px 14px rgba(79,70,229,0.35)",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                            transition:"all 0.15s", fontFamily:"inherit" }}>
                            {submitting
                                ? <><Spinner/> {isEdit?"Updating…":"Creating…"}</>
                                : isEdit ? "💾 Update" : "✨ Create Project"
                            }
                        </button>
                    </div>
                </div>
            </div>

            {showConfirm && (
                <ConfirmModal projectName={project?.name}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirm(false)}
                    t={t} dark={dark} />
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Modal — all original logic preserved
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ project, onClose, onSuccess, onError, t, dark }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const confirm = () => {
        if (isDeleting) return;
        setIsDeleting(true);
        router.delete(`/admin/projects/${project.id}`, {
            onSuccess: () => { onSuccess("Project deleted successfully."); onClose(); },
            onError:   () => { onError("Failed to delete project."); setIsDeleting(false); },
        });
    };

    return (
        <div style={{ position:"fixed", inset:0, background:t.overlay,
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:1000, backdropFilter:"blur(6px)" }}
            onClick={isDeleting ? undefined : onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: dark?"rgba(12,20,42,0.98)":"#ffffff",
                border:`1.5px solid ${t.borderStrong}`,
                borderRadius:20, width:400, padding:"32px 28px",
                boxShadow:t.shadow, textAlign:"center", backdropFilter:"blur(20px)" }}>
                <div style={{ width:52, height:52, borderRadius:14, margin:"0 auto 14px",
                    background: dark?"rgba(239,68,68,0.16)":"#fee2e2",
                    border:`1.5px solid ${dark?"rgba(239,68,68,0.3)":"#fca5a5"}`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🗑️</div>
                <h3 style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:8 }}>Delete Project?</h3>
                <p style={{ fontSize:13, color:t.textSoft, marginBottom:24, lineHeight:1.7 }}>
                    <strong style={{ color:t.text }}>"{project.name}"</strong> will be permanently deleted
                    along with all its assignments.<br/>
                    <span style={{ fontSize:12, color:t.textMute }}>This action cannot be undone.</span>
                </p>
                <div style={{ display:"flex", gap:10 }}>
                    <button onClick={onClose} disabled={isDeleting} style={{
                        flex:1, padding:"11px", background:t.surfaceSoft,
                        border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSoft,
                        fontSize:13, fontWeight:600, cursor:isDeleting?"not-allowed":"pointer",
                        opacity:isDeleting?0.5:1, fontFamily:"inherit" }}>Cancel</button>
                    <button onClick={confirm} disabled={isDeleting} style={{
                        flex:1, padding:"11px",
                        background: isDeleting?"#fca5a5":"linear-gradient(135deg,#ef4444,#dc2626)",
                        border:"none", borderRadius:12, color:"#fff",
                        fontSize:13, fontWeight:700, cursor:isDeleting?"not-allowed":"pointer",
                        boxShadow: isDeleting?"none":"0 4px 14px rgba(239,68,68,0.38)",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                        fontFamily:"inherit" }}>
                        {isDeleting ? <><Spinner/> Deleting…</> : "🗑 Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProjectsIndex({ projects: projectsProp = [], auth }) {
    const dark = useReactiveTheme();
    const t    = getTheme(dark);

    const projects = Array.isArray(projectsProp) ? projectsProp : (projectsProp?.data ?? []);

    const [search, setSearch]        = useState("");
    const [statusFilter, setStatus]  = useState("all");
    const [page, setPage]            = useState(1);
    const [editProject, setEdit]     = useState(null);
    const [deleteProject, setDelete] = useState(null);
    const PER_PAGE = 10;

    // Original filter + pagination logic — unchanged
    const filtered = projects.filter(p =>
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
         p.description?.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === "all" || p.status === statusFilter)
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged      = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

    const counts = {
        active:    projects.filter(p => p.status==="active").length,
        upcoming:  projects.filter(p => p.status==="upcoming").length,
        completed: projects.filter(p => p.status==="completed").length,
        cancelled: projects.filter(p => p.status==="cancelled").length,
    };

    const handleSearch = v => { setSearch(v); setPage(1); };
    const handleStatus = v => { setStatus(v); setPage(1); };

    // Flash via Inertia page props
    const { props } = typeof window !== "undefined" && window.__inertia ? {} : {};

    const focusCSS = `
        input:focus,textarea:focus,select:focus{
            outline:none;
            border-color:${t.primary}!important;
            box-shadow:0 0 0 3px ${t.primary}22!important;
        }
        *{scrollbar-width:none;}
        ::-webkit-scrollbar{display:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    `;

    return (
        <AppLayout title="Project Assignments">
            <Head title="Projects" />
            <style>{focusCSS}</style>

            <div style={{ minHeight:"100%", transition:"background 0.3s" }}>

                {/* ── Back button ── */}
                <div style={{ marginBottom:16, marginTop:"-8px" }}>
                    <div onClick={() => router.visit("/admin/assignments")} title="Back to Assignments" style={{
                        display:"inline-flex", alignItems:"center", justifyContent:"center",
                        width:40, height:40, borderRadius:12, cursor:"pointer",
                        color:t.textMute, transition:"all 0.15s", border:"1px solid transparent",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background=t.primarySoft; e.currentTarget.style.color=t.primary; e.currentTarget.style.borderColor=t.borderStrong; }}
                        onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=t.textMute; e.currentTarget.style.borderColor="transparent"; }}
                    >
                        <ChevronLeft size={26} strokeWidth={2.5} />
                    </div>
                </div>

                {/* ── Header row: stat cards + New Project ── */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                    {Object.entries(counts).map(([key, val], i) => {
                        const s = ST[key];
                        if (!s) return null;
                        const isActive = statusFilter === key;
                        return (
                            <button key={key} onClick={() => handleStatus(isActive ? "all" : key)} style={{
                                display:"flex", alignItems:"center", gap:10,
                                padding:"10px 16px", minWidth:110,
                                background: isActive ? (dark?s.bgDark:s.bg) : (dark?"rgba(255,255,255,0.04)":"#ffffff"),
                                border:`1.5px solid ${isActive ? (dark?s.color+"66":s.border) : t.border}`,
                                borderRadius:14, cursor:"pointer", transition:"all 0.15s",
                                boxShadow: isActive ? `0 4px 14px ${s.color}22` : t.shadowSoft,
                                animation:`fadeUp 0.3s ease ${i*0.05}s both`,
                                fontFamily:"inherit",
                            }}
                                onMouseEnter={e => { if(!isActive){ e.currentTarget.style.borderColor=dark?s.color+"44":s.border; e.currentTarget.style.background=dark?s.bgDark:s.bg; }}}
                                onMouseLeave={e => { if(!isActive){ e.currentTarget.style.borderColor=t.border; e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"#ffffff"; }}}
                            >
                                <div style={{ width:34, height:34, borderRadius:9,
                                    background: isActive ? s.color : (dark?s.bgDark:s.bg),
                                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                                    border:`1px solid ${dark?s.color+"44":s.border}` }}>
                                    <div style={{ width:8, height:8, borderRadius:"50%",
                                        background: isActive ? "#fff" : s.color }} />
                                </div>
                                <div style={{ textAlign:"left" }}>
                                    <div style={{ fontSize:20, fontWeight:800, color:isActive?s.color:t.text, lineHeight:1 }}>{val}</div>
                                    <div style={{ fontSize:10, color:isActive?s.color:t.textMute, fontWeight:600, marginTop:2, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</div>
                                </div>
                            </button>
                        );
                    })}

                    <div style={{ marginLeft:"auto" }}>
                        <button onClick={() => setEdit(false)} style={{
                            display:"inline-flex", alignItems:"center", gap:7,
                            padding:"10px 20px",
                            background:"linear-gradient(135deg,#4f46e5,#3b82f6)",
                            border:"none", borderRadius:12, color:"#fff",
                            fontSize:13, fontWeight:700, cursor:"pointer",
                            boxShadow:"0 4px 16px rgba(79,70,229,0.38)",
                            transition:"all 0.15s", fontFamily:"inherit",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.opacity="0.9"; e.currentTarget.style.transform="translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity="1";   e.currentTarget.style.transform="translateY(0)"; }}
                        >
                            <span style={{ fontSize:16 }}>+</span> New Project
                        </button>
                    </div>
                </div>

                {/* ── Table card ── */}
                <div style={{ background:dark?t.surface:"#ffffff",
                    border:`1px solid ${t.borderStrong}`,
                    borderRadius:18, overflow:"hidden",
                    boxShadow:t.shadowSoft, animation:"fadeUp 0.3s ease 0.15s both" }}>

                    {/* Toolbar */}
                    <div style={{ padding:"14px 20px", borderBottom:`1px solid ${t.border}`,
                        display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        {/* Search */}
                        <div style={{ position:"relative", width:260 }}>
                            <svg style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)",
                                width:14, height:14, color:t.textMute, flexShrink:0 }}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input value={search} onChange={e => handleSearch(e.target.value)}
                                placeholder="Search projects…"
                                style={{ width:"100%", paddingLeft:32, paddingRight:12, paddingTop:8, paddingBottom:8,
                                    fontSize:12, color:t.text, background:t.inputBg,
                                    border:`1.5px solid ${t.inputBorder}`, borderRadius:10,
                                    outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
                        </div>

                        {/* Status filter pills */}
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            {["all","active","upcoming","completed","cancelled"].map(k => {
                                const s   = ST[k];
                                const sel = statusFilter === k;
                                return (
                                    <button key={k} onClick={() => handleStatus(k)} style={{
                                        padding:"5px 13px", borderRadius:99, fontSize:11, fontWeight:700,
                                        cursor:"pointer", outline:"none", transition:"all 0.12s",
                                        border:`1.5px solid ${sel ? (s?dark?s.color+"66":s.border:"#6366f1") : t.border}`,
                                        background: sel ? (s?dark?s.bgDark:s.bg:t.primarySoft) : "transparent",
                                        color: sel ? (s?s.color:t.primary) : t.textMute,
                                        fontFamily:"inherit",
                                    }}>
                                        {k === "all" ? "All" : s.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ marginLeft:"auto", fontSize:12, color:t.textMute, fontWeight:500 }}>
                            <span style={{ fontWeight:700, color:t.text }}>{filtered.length}</span> project{filtered.length!==1?"s":""}
                        </div>
                    </div>

                    {/* Table */}
                    {paged.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"64px 0" }}>
                            <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
                            <div style={{ fontSize:14, fontWeight:600, color:t.textMute }}>No projects found</div>
                            {search && <div style={{ fontSize:12, color:t.textMute, marginTop:4 }}>Try a different search term</div>}
                        </div>
                    ) : (
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                                <tr style={{ borderBottom:`1px solid ${t.border}`, background:t.surfaceSoft }}>
                                    {["Project","Status","Duration","Members","Days Left","Actions"].map(h => (
                                        <th key={h} style={{ padding:"11px 16px", fontSize:10, fontWeight:800,
                                            color:t.textMute, textTransform:"uppercase", letterSpacing:"0.07em",
                                            textAlign: h==="Actions" ? "right" : "left", whiteSpace:"nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((p, i) => {
                                    const members = p.assignments?.filter(a => a.status!=="removed") || [];
                                    const dl      = daysLeft(p.end_date, p.status);
                                    const s       = ST[p.status] || ST.cancelled;
                                    return (
                                        <tr key={p.id} style={{
                                            borderBottom: i<paged.length-1 ? `1px solid ${t.border}` : "none",
                                            transition:"background 0.12s",
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background=t.rowHover}
                                            onMouseLeave={e => e.currentTarget.style.background="transparent"}
                                        >
                                            {/* Project name */}
                                            <td style={{ padding:"14px 16px", minWidth:160 }}>
                                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                    <div style={{ width:3, height:38, borderRadius:99,
                                                        background:`linear-gradient(180deg,${s.color},${s.color}66)`,
                                                        flexShrink:0 }} />
                                                    <div>
                                                        <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{p.name}</div>
                                                        {p.description && (
                                                            <div style={{ fontSize:11, color:t.textMute, marginTop:2,
                                                                maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                                                {p.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding:"14px 16px" }}>
                                                <StatusPill status={p.status} dark={dark} />
                                            </td>

                                            {/* Duration FROM/TO */}
                                            <td style={{ padding:"14px 16px" }}>
                                                <div style={{ display:"inline-flex", flexDirection:"column", gap:5 }}>
                                                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                                        <span style={{ fontSize:9, fontWeight:800, color:"#3b82f6",
                                                            textTransform:"uppercase", letterSpacing:"0.08em",
                                                            width:28, flexShrink:0 }}>FROM</span>
                                                        <span style={{ fontSize:12, fontWeight:600, color:t.text }}>{fmt(p.start_date)}</span>
                                                    </div>
                                                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                                        <span style={{ fontSize:9, fontWeight:800, color:"#10b981",
                                                            textTransform:"uppercase", letterSpacing:"0.08em",
                                                            width:28, flexShrink:0 }}>TO</span>
                                                        <span style={{ fontSize:12, fontWeight:600, color:t.text }}>{fmt(p.end_date)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Members avatar stack */}
                                            <td style={{ padding:"14px 16px" }}>
                                                {members.length === 0 ? (
                                                    <span style={{ fontSize:11, color:t.textMute }}>—</span>
                                                ) : (
                                                    <div style={{ display:"flex", alignItems:"center" }}>
                                                        {members.slice(0,5).map((m,j) => (
                                                            <div key={j} style={{ marginLeft:j===0?0:-8, zIndex:10-j }}>
                                                                <Ava name={m.user?.name} url={m.user?.avatar_url} size={30} />
                                                            </div>
                                                        ))}
                                                        {members.length > 5 && (
                                                            <div style={{ marginLeft:-8, width:30, height:30, borderRadius:"50%",
                                                                background: dark?"rgba(255,255,255,0.08)":"#e5e7eb",
                                                                border:"2px solid rgba(255,255,255,0.2)",
                                                                display:"flex", alignItems:"center", justifyContent:"center",
                                                                fontSize:9, fontWeight:700, color:t.textSoft, zIndex:0 }}>
                                                                +{members.length-5}
                                                            </div>
                                                        )}
                                                        <span style={{ marginLeft:8, fontSize:11, color:t.textMute }}>
                                                            {members.length}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Days left */}
                                            <td style={{ padding:"14px 16px" }}>
                                                {dl ? (
                                                    <span style={{ fontSize:11, fontWeight:700, color:dl.color,
                                                        background: dark?dl.bgDark:dl.bgLight,
                                                        padding:"3px 10px", borderRadius:99, whiteSpace:"nowrap",
                                                        border:`1px solid ${dl.color}${dark?"44":"33"}` }}>
                                                        {dl.label}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize:11, color:t.textMute }}>—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding:"14px 16px", textAlign:"right" }}>
                                                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                                    <button onClick={() => router.visit(`/admin/projects/${p.id}`)} style={{
                                                        display:"inline-flex", alignItems:"center", gap:4,
                                                        padding:"6px 12px",
                                                        background: dark?"rgba(99,102,241,0.12)":"#f5f3ff",
                                                        border:`1.5px solid ${dark?"#6366f144":"#c4b5fd"}`,
                                                        borderRadius:9, color:dark?"#a5b4fc":"#7c3aed",
                                                        fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
                                                        fontFamily:"inherit" }}
                                                        onMouseEnter={e => e.currentTarget.style.background=dark?"rgba(99,102,241,0.22)":"#ede9fe"}
                                                        onMouseLeave={e => e.currentTarget.style.background=dark?"rgba(99,102,241,0.12)":"#f5f3ff"}
                                                    >👁 View</button>
                                                    <button onClick={() => setEdit(p)} style={{
                                                        display:"inline-flex", alignItems:"center", gap:4,
                                                        padding:"6px 12px",
                                                        background: dark?"rgba(16,185,129,0.12)":"#f0fdf4",
                                                        border:`1.5px solid ${dark?"#10b98144":"#86efac"}`,
                                                        borderRadius:9, color:dark?"#34d399":"#16a34a",
                                                        fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
                                                        fontFamily:"inherit" }}
                                                        onMouseEnter={e => e.currentTarget.style.background=dark?"rgba(16,185,129,0.22)":"#dcfce7"}
                                                        onMouseLeave={e => e.currentTarget.style.background=dark?"rgba(16,185,129,0.12)":"#f0fdf4"}
                                                    >✏️ Edit</button>
                                                    <button onClick={() => setDelete(p)} style={{
                                                        display:"inline-flex", alignItems:"center", gap:4,
                                                        padding:"6px 12px",
                                                        background: dark?"rgba(239,68,68,0.12)":"#fef2f2",
                                                        border:`1.5px solid ${dark?"#ef444444":"#fca5a5"}`,
                                                        borderRadius:9, color:dark?"#f87171":"#ef4444",
                                                        fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
                                                        fontFamily:"inherit" }}
                                                        onMouseEnter={e => e.currentTarget.style.background=dark?"rgba(239,68,68,0.22)":"#fee2e2"}
                                                        onMouseLeave={e => e.currentTarget.style.background=dark?"rgba(239,68,68,0.12)":"#fef2f2"}
                                                    >🗑 Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display:"flex", justifyContent:"center", alignItems:"center",
                            gap:6, padding:"16px", borderTop:`1px solid ${t.border}` }}>
                            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                                style={{ padding:"6px 14px", borderRadius:9, fontSize:12, fontWeight:700,
                                    border:`1.5px solid ${t.border}`,
                                    background: page===1 ? t.surfaceSoft : t.surface,
                                    color: page===1 ? t.textMute : t.textSoft,
                                    cursor: page===1 ? "not-allowed":"pointer", fontFamily:"inherit" }}>
                                ← Prev
                            </button>
                            {Array.from({ length:totalPages },(_,i)=>i+1).map(n => (
                                <button key={n} onClick={() => setPage(n)} style={{
                                    width:34, height:34, borderRadius:9, fontSize:12, fontWeight:800,
                                    border:`1.5px solid ${page===n?"#4f46e5":t.border}`,
                                    background: page===n ? "linear-gradient(135deg,#4f46e5,#3b82f6)" : t.surface,
                                    color: page===n ? "#fff" : t.textSoft,
                                    cursor:"pointer", fontFamily:"inherit",
                                    boxShadow: page===n ? "0 4px 12px rgba(79,70,229,0.35)" : "none",
                                }}>{n}</button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                                style={{ padding:"6px 14px", borderRadius:9, fontSize:12, fontWeight:700,
                                    border:`1.5px solid ${t.border}`,
                                    background: page===totalPages ? t.surfaceSoft : t.surface,
                                    color: page===totalPages ? t.textMute : t.textSoft,
                                    cursor: page===totalPages ? "not-allowed":"pointer", fontFamily:"inherit" }}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            {editProject !== null && (
                <ProjectModal
                    project={editProject === false ? null : editProject}
                    onClose={() => setEdit(null)}
                    onSuccess={() => {}}
                    onError={() => {}}
                    t={t} dark={dark}
                />
            )}
            {deleteProject && (
                <DeleteModal
                    project={deleteProject}
                    onClose={() => setDelete(null)}
                    onSuccess={() => {}}
                    onError={() => {}}
                    t={t} dark={dark}
                />
            )}
        </AppLayout>
    );
}