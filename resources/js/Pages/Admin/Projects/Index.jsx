import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const ST = {
    active:    { label: "Active",    color: "#16a34a", bg: "#f0fdf4", border: "#86efac", light: "#dcfce7" },
    upcoming:  { label: "Upcoming",  color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", light: "#dbeafe" },
    completed: { label: "Completed", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", light: "#ede9fe" },
    cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb", border: "#d1d5db", light: "#f3f4f6" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast Notification  ← NEW
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [toast]);

    if (!toast) return null;

    const ok = toast.type === "success";
    const c  = ok
        ? { bg: "#f0fdf4", border: "#86efac", text: "#15803d", icon: "✅", title: "Success!" }
        : { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626", icon: "❌", title: "Error" };

    return (
        <div style={{
            position: "fixed", top: 24, right: 24, zIndex: 9999,
            display: "flex", alignItems: "flex-start", gap: 12,
            background: c.bg, border: `1.5px solid ${c.border}`,
            borderRadius: 12, padding: "14px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            minWidth: 300, maxWidth: 400,
            animation: "piToastIn 0.25s ease",
        }}>
            <style>{`@keyframes piToastIn{from{opacity:0;transform:translateX(48px)}to{opacity:1;transform:translateX(0)}}`}</style>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: c.text, opacity: 0.85 }}>{toast.message}</div>
            </div>
            <button onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer",
                color: c.text, fontSize: 15, padding: 0, opacity: 0.55, flexShrink: 0, marginTop: 1,
            }}>✕</button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmt(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function daysLeft(end, status) {
    if (!end || status === "completed" || status === "cancelled") return null;
    const d = Math.ceil((new Date(end) - new Date()) / 864e5);
    if (d < 0)   return { label: `${Math.abs(d)}d overdue`, color: "#ef4444", bg: "#fef2f2" };
    if (d === 0) return { label: "Due today",                color: "#f59e0b", bg: "#fefce8" };
    if (d <= 7)  return { label: `${d}d left`,               color: "#f59e0b", bg: "#fefce8" };
    return             { label: `${d} days left`,            color: "#6b7280", bg: "#f3f4f6" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar (supports image_url)
// ─────────────────────────────────────────────────────────────────────────────
function Ava({ name, url, size = 28 }) {
    const [err, setErr] = useState(false);
    const letters = name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
    const colors  = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#14b8a6"];
    const bg      = colors[(name?.charCodeAt(0) || 0) % colors.length];
    const src = url
        ? (url.startsWith("http") || url.startsWith("/") ? url : `/storage/${url}`)
        : null;
    if (src && !err) return (
        <img src={src} alt={name} onError={() => setErr(true)}
            style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
                border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", flexShrink: 0 }} />
    );
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
            border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
            {letters}
        </div>
    );
}

function Pill({ status }) {
    const s = ST[status] || ST.cancelled;
    return (
        <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg,
            border: `1px solid ${s.border}`, padding: "3px 9px", borderRadius: 99,
            textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
            {s.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Update Modal  ← NEW
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({ projectName, onConfirm, onCancel }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 60, backdropFilter: "blur(3px)" }}
            onClick={onCancel}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
                width: 380, padding: "28px 24px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>✏️</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
                    Confirm Update
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 22, lineHeight: 1.65 }}>
                    Are you sure you want to update<br />
                    <strong style={{ color: "#111827" }}>"{projectName}"</strong>?
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: "10px", background: "#f9fafb",
                        border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280",
                        fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: "10px",
                        background: "linear-gradient(135deg,#059669,#10b981)", border: "none",
                        borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}>
                        ✅ Yes, Update
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit / Create Modal
// ─────────────────────────────────────────────────────────────────────────────
function ProjectModal({ project, onClose, onSuccess, onError }) {
    const isEdit = !!project;
    const [form, setForm] = useState({
        name:        project?.name        || "",
        description: project?.description || "",
        status:      project?.status      || "upcoming",
        start_date:  project?.start_date  ? project.start_date.slice(0, 10) : "",
        end_date:    project?.end_date    ? project.end_date.slice(0, 10)   : "",
    });
    const [errors, setErrors]       = useState({});
    const [showConfirm, setConfirm] = useState(false);  // ← NEW
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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

    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = () => {
        setConfirm(false);
        setSubmitting(true);
        router.put(`/admin/projects/${project.id}`, form, {
            preserveState:  true,
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                onSuccess("Project updated successfully!");
                onClose();
            },
            onError: () => {
                setSubmitting(false);
                onError("Failed to update project. Please try again.");
            },
        });
    };

    const field = (err) => ({
        width: "100%", padding: "9px 12px", fontSize: 13, color: "#111827",
        background: "#f9fafb", border: `1.5px solid ${err ? "#fca5a5" : "#e5e7eb"}`,
        borderRadius: 8, outline: "none", boxSizing: "border-box",
    });

    return (
        <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex",
                alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(3px)" }}
                onClick={onClose}>
                <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
                    width: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

                    {/* Modal header */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f3f4f6",
                        background: "linear-gradient(135deg,#f8faff,#eef2ff)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>
                                    {isEdit ? "Edit Project" : "New Project"}
                                </h2>
                                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                                    {isEdit ? `Editing: ${project?.name}` : "Fill in the project details"}
                                </p>
                            </div>
                            <button onClick={onClose} style={{ background: "#fff", border: "1px solid #e5e7eb",
                                borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#6b7280",
                                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>✕</button>
                        </div>
                    </div>

                    {/* Form body */}
                    <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 13 }}>
                        {/* Name */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Project Name *
                            </label>
                            <input value={form.name} onChange={e => set("name", e.target.value)}
                                placeholder="e.g. CRM System v2" style={field(errors.name)} />
                            {errors.name && <p style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>{errors.name}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Description
                            </label>
                            <textarea value={form.description} onChange={e => set("description", e.target.value)}
                                placeholder="Brief project description…" rows={2}
                                style={{ ...field(false), resize: "vertical" }} />
                        </div>

                        {/* Status */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Status
                            </label>
                            <select value={form.status} onChange={e => set("status", e.target.value)}
                                style={{ ...field(false), cursor: "pointer" }}>
                                <option value="upcoming">Upcoming</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Dates */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {[["Start Date *","start_date"],["End Date *","end_date"]].map(([lbl,key]) => (
                                <div key={key}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                        marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{lbl}</label>
                                    <input type="date" value={form[key]} onChange={e => set(key, e.target.value)}
                                        style={field(errors[key])} />
                                    {errors[key] && <p style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "0 22px 18px", display: "flex", gap: 8 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#f9fafb",
                            border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280",
                            fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                        {/* ↓ CHANGE 2: "Save Changes" → "Update" */}
                        <button onClick={handleClick} disabled={submitting} style={{ flex: 2, padding: "10px",
                            background: submitting
                                ? (isEdit ? "#6ee7b7" : "#a5b4fc")
                                : isEdit
                                    ? "linear-gradient(135deg,#059669,#10b981)"
                                    : "linear-gradient(135deg,#4f46e5,#3b82f6)",
                            border: "none", borderRadius: 8, color: "#fff",
                            fontSize: 13, fontWeight: 700,
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.85 : 1,
                            boxShadow: submitting ? "none" : isEdit
                                ? "0 4px 12px rgba(5,150,105,0.3)"
                                : "0 4px 12px rgba(79,70,229,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            transition: "all 0.15s" }}>
                            {submitting ? (
                                <>
                                    <span style={{ display: "inline-block", width: 14, height: 14,
                                        border: "2px solid #fff", borderTopColor: "transparent",
                                        borderRadius: "50%", animation: "pmSpin 0.7s linear infinite" }} />
                                    <style>{`@keyframes pmSpin{to{transform:rotate(360deg)}}`}</style>
                                    {isEdit ? "Updating…" : "Creating…"}
                                </>
                            ) : isEdit ? "Update" : "Create Project"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ↓ CHANGE 3: Confirm modal sits on top */}
            {showConfirm && (
                <ConfirmModal
                    projectName={project?.name}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirm(false)}
                />
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ project, onClose, onSuccess, onError }) {
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(3px)" }}
            onClick={isDeleting ? undefined : onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
                width: 380, padding: "24px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 6 }}>Delete Project?</h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                    <strong style={{ color: "#111827" }}>"{project.name}"</strong> will be permanently deleted
                    along with all its assignments.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={onClose} disabled={isDeleting} style={{
                        flex: 1, padding: "10px", background: "#f9fafb",
                        border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280",
                        fontSize: 13, fontWeight: 600,
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        opacity: isDeleting ? 0.5 : 1,
                    }}>Cancel</button>
                    <button onClick={confirm} disabled={isDeleting} style={{
                        flex: 1, padding: "10px",
                        background: isDeleting ? "#fca5a5" : "linear-gradient(135deg,#ef4444,#dc2626)",
                        border: "none", borderRadius: 8, color: "#fff",
                        fontSize: 13, fontWeight: 700,
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        boxShadow: isDeleting ? "none" : "0 4px 12px rgba(239,68,68,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                        {isDeleting ? (
                            <>
                                <span style={{ display: "inline-block", width: 14, height: 14,
                                    border: "2px solid #fff", borderTopColor: "transparent",
                                    borderRadius: "50%", animation: "delSpin 0.7s linear infinite" }} />
                                <style>{`@keyframes delSpin{to{transform:rotate(360deg)}}`}</style>
                                Deleting...
                            </>
                        ) : "🗑 Delete"}
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
    const projects = Array.isArray(projectsProp) ? projectsProp : (projectsProp?.data ?? []);

    const [search, setSearch]        = useState("");
    const [statusFilter, setStatus]  = useState("all");
    const [page, setPage]            = useState(1);
    const [editProject, setEdit]     = useState(null);
    const [deleteProject, setDelete] = useState(null);
    const [toast, setToast]          = useState(null);   // ← NEW
    const PER_PAGE = 10;

    const showSuccess = (msg) => setToast({ type: "success", message: msg });
    const showError   = (msg) => setToast({ type: "error",   message: msg });

    const filtered = projects.filter(p =>
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
         p.description?.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === "all" || p.status === statusFilter)
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const counts = {
        active:    projects.filter(p => p.status === "active").length,
        upcoming:  projects.filter(p => p.status === "upcoming").length,
        completed: projects.filter(p => p.status === "completed").length,
        cancelled: projects.filter(p => p.status === "cancelled").length,
    };

    const handleSearch = v => { setSearch(v); setPage(1); };
    const handleStatus = v => { setStatus(v); setPage(1); };

    return (
        <AppLayout title="Project Assignments">
            <Head title="Projects" />
            <div style={{ background: "#f9fafb", minHeight: "100%" }}>

                {/* ── Toast ── */}
                <Toast toast={toast} onClose={() => setToast(null)} />

                {/* ── Row 1: back arrow only ── */}
                <div style={{ marginBottom: 10, marginTop: "-10px"  }}>
                    <div onClick={() => router.visit("/admin/assignments")} title="Back to Assignments" style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 40, height: 40, borderRadius: 10, textDecoration: "none",
                        color: "#94a3b8", transition: "all 0.15s", cursor: "pointer",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.color = "#4f46e5"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                    >
                        <ChevronLeft size={28} strokeWidth={2} />
                    </div>
                </div>

                {/* ── Row 2: stat cards + New Project ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                    {Object.entries(counts).map(([key, val]) => {
                        const s = ST[key];
                        if (!s) return null;
                        const isActive = statusFilter === key;
                        return (
                            <button key={key} onClick={() => handleStatus(isActive ? "all" : key)} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 16px", minWidth: 100,
                                background: isActive ? s.bg : "#fff",
                                border: `1.5px solid ${isActive ? s.color : "#e5e7eb"}`,
                                borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                                boxShadow: isActive ? `0 2px 8px ${s.color}20` : "0 1px 3px rgba(0,0,0,0.04)",
                                outline: "none",
                            }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = s.bg; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; } }}
                            >
                                <div style={{ width: 32, height: 32, borderRadius: 7,
                                    background: isActive ? s.color : `${s.color}15`,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <div style={{ width: 9, height: 9, borderRadius: "50%",
                                        background: isActive ? "#fff" : s.color }} />
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: isActive ? s.color : "#111827", lineHeight: 1 }}>{val}</div>
                                    <div style={{ fontSize: 10, color: isActive ? s.color : "#6b7280", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                                </div>
                            </button>
                        );
                    })}
                    <div style={{ marginLeft: "auto" }}>
                        <button onClick={() => setEdit(false)} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "9px 18px", background: "linear-gradient(135deg,#4f46e5,#3b82f6)",
                            border: "none", borderRadius: 9, color: "#fff",
                            fontSize: 13, fontWeight: 700, cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(79,70,229,0.35)",
                        }}>
                            + New Project
                        </button>
                    </div>
                </div>

                {/* ── Table card ── */}
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>

                    {/* Table toolbar */}
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6",
                        display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
                            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                                fontSize: 12, color: "#9ca3af" }}>🔍</span>
                            <input value={search} onChange={e => handleSearch(e.target.value)}
                                placeholder="Search projects…"
                                style={{ width: "100%", padding: "8px 10px 8px 30px", fontSize: 12, color: "#111827",
                                    background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8,
                                    outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                            {["all","active","upcoming","completed","cancelled"].map(k => (
                                <button key={k} onClick={() => handleStatus(k)} style={{
                                    padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                                    cursor: "pointer", outline: "none", transition: "all 0.12s",
                                    border: `1.5px solid ${statusFilter === k ? (ST[k]?.color || "#4f46e5") : "#e5e7eb"}`,
                                    background: statusFilter === k ? (ST[k]?.bg || "#eef2ff") : "#fff",
                                    color: statusFilter === k ? (ST[k]?.color || "#4f46e5") : "#6b7280",
                                }}>
                                    {k === "all" ? "All" : ST[k].label}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: 14, color: "#9ca3af" }}>
                            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
                        </div>
                    </div>

                    {/* Table */}
                    {paged.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0", color: "#d1d5db" }}>
                            <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>No projects found</div>
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    {["Project","Status","Duration","Members","Days Left","Actions"].map(h => (
                                        <th key={h} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700,
                                            color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em",
                                            textAlign: h === "Actions" ? "right" : "left", whiteSpace: "nowrap" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((p, i) => {
                                    const members = p.assignments?.filter(a => a.status !== "removed") || [];
                                    const dl      = daysLeft(p.end_date, p.status);
                                    const s       = ST[p.status] || ST.cancelled;
                                    return (
                                        <tr key={p.id} style={{
                                            borderBottom: i < paged.length - 1 ? "1px solid #f9fafb" : "none",
                                            transition: "background 0.1s",
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            {/* Project name */}
                                            <td style={{ padding: "14px 16px", minWidth: 160 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 3, height: 36, borderRadius: 99,
                                                        background: s.color, flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{p.name}</div>
                                                        {p.description && (
                                                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1,
                                                                maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {p.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <Pill status={p.status} />
                                            </td>

                                            {/* Duration */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "inline-flex", flexDirection: "column", gap: 5 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                        <span style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6",
                                                            textTransform: "uppercase", letterSpacing: "0.07em",
                                                            width: 30, flexShrink: 0 }}>FROM</span>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmt(p.start_date)}</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                        <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981",
                                                            textTransform: "uppercase", letterSpacing: "0.07em",
                                                            width: 30, flexShrink: 0 }}>TO</span>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmt(p.end_date)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Members */}
                                            <td style={{ padding: "14px 16px" }}>
                                                {members.length === 0 ? (
                                                    <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                                                ) : (
                                                    <div style={{ display: "flex" }}>
                                                        {members.slice(0, 5).map((m, j) => (
                                                            <div key={j} style={{ marginLeft: j === 0 ? 0 : -8, zIndex: 10 - j }}>
                                                                <Ava name={m.user?.name} url={m.user?.avatar_url} size={30} />
                                                            </div>
                                                        ))}
                                                        {members.length > 5 && (
                                                            <div style={{ marginLeft: -8, width: 30, height: 30, borderRadius: "50%",
                                                                background: "#e5e7eb", border: "2px solid #fff",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize: 9, fontWeight: 700, color: "#6b7280", zIndex: 0 }}>
                                                                +{members.length - 5}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Days left */}
                                            <td style={{ padding: "14px 16px" }}>
                                                {dl ? (
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: dl.color,
                                                        background: dl.bg, padding: "3px 9px", borderRadius: 99,
                                                        whiteSpace: "nowrap" }}>
                                                        {dl.label}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                    <button onClick={() => router.visit(`/admin/projects/${p.id}`)} style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        padding: "5px 11px", background: "#f9fafb",
                                                        border: "1.5px solid #e5e7eb", borderRadius: 7,
                                                        color: "#374151", fontSize: 11, fontWeight: 600,
                                                        cursor: "pointer", transition: "all 0.12s",
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
                                                    >
                                                        👁 View
                                                    </button>
                                                    <button onClick={() => setEdit(p)} style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        padding: "5px 11px", background: "#f0fdf4",
                                                        border: "1.5px solid #86efac", borderRadius: 7,
                                                        color: "#16a34a", fontSize: 11, fontWeight: 600,
                                                        cursor: "pointer", transition: "all 0.12s",
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; }}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button onClick={() => setDelete(p)} style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        padding: "5px 11px", background: "#fef2f2",
                                                        border: "1.5px solid #fca5a5", borderRadius: 7,
                                                        color: "#ef4444", fontSize: 11, fontWeight: 600,
                                                        cursor: "pointer", transition: "all 0.12s",
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; }}
                                                    >
                                                        🗑 Delete
                                                    </button>
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
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
                            gap: 6, padding: "14px", borderTop: "1px solid #f3f4f6" }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                                    border: "1.5px solid #e5e7eb", background: page === 1 ? "#f9fafb" : "#fff",
                                    color: page === 1 ? "#d1d5db" : "#374151", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                                ← Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} onClick={() => setPage(n)} style={{
                                    width: 32, height: 32, borderRadius: 7, fontSize: 12, fontWeight: 700,
                                    border: `1.5px solid ${page === n ? "#4f46e5" : "#e5e7eb"}`,
                                    background: page === n ? "#4f46e5" : "#fff",
                                    color: page === n ? "#fff" : "#374151", cursor: "pointer",
                                }}>
                                    {n}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                                    border: "1.5px solid #e5e7eb", background: page === totalPages ? "#f9fafb" : "#fff",
                                    color: page === totalPages ? "#d1d5db" : "#374151", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {editProject !== null && (
                <ProjectModal
                    project={editProject === false ? null : editProject}
                    onClose={() => setEdit(null)}
                    onSuccess={showSuccess}
                    onError={showError}
                />
            )}
            {deleteProject && (
                <DeleteModal
                    project={deleteProject}
                    onClose={() => setDelete(null)}
                    onSuccess={showSuccess}
                    onError={showError}
                />
            )}
        </AppLayout>
    );
}