import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const statusConfig = {
    active:    { label: "Active",    color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
    upcoming:  { label: "Upcoming",  color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
    completed: { label: "Completed", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
    cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb", border: "#d1d5db" },
    removed:   { label: "Removed",   color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
};

// Country → flag code map (same as AssignmentsDashboard)
const CC = {
    "myanmar":"mm","burma":"mm","japan":"jp","thailand":"th","cambodia":"kh",
    "vietnam":"vn","singapore":"sg","malaysia":"my","indonesia":"id","philippines":"ph",
    "china":"cn","korea":"kr","south korea":"kr","india":"in","usa":"us",
    "united states":"us","uk":"gb","united kingdom":"gb","australia":"au",
    "germany":"de","france":"fr","canada":"ca","brazil":"br","laos":"la",
    "russia":"ru","italy":"it","spain":"es","netherlands":"nl","sweden":"se",
};
const cc = (c) => { if (!c) return null; const k = c.toLowerCase().trim(); return CC[k] || (k.length === 2 ? k : null); };

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
function Flag({ country, size = 18 }) {
    const [err, setErr] = useState(false);
    const code = cc(country);
    if (!code || err) return <span style={{ fontSize: size * 0.75 }}>🌐</span>;
    return (
        <img src={`https://flagcdn.com/w40/${code}.png`} alt={country}
            onError={() => setErr(true)}
            style={{ width: size * 1.4, height: size * 0.95, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
    );
}

// Avatar: shows image if avatar_url exists, else colored initials
function Ava({ name, url, size = 34 }) {
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
                border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", flexShrink: 0 }} />
    );
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
            border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
            {letters}
        </div>
    );
}

function Badge({ status }) {
    const cfg = statusConfig[status] || statusConfig.active;
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            padding: "3px 10px", borderRadius: 99,
            textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{cfg.label}</span>
    );
}

function fmt(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDT(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// Capitalize first letter of each word
function titleCase(str) {
    if (!str) return "";
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast Notification
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
            animation: "psToastIn 0.25s ease",
        }}>
            <style>{`@keyframes psToastIn{from{opacity:0;transform:translateX(48px)}to{opacity:1;transform:translateX(0)}}`}</style>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: c.text, opacity: 0.85 }}>{toast.message}</div>
            </div>
            <button onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer",
                color: c.text, fontSize: 15, padding: 0, opacity: 0.55, flexShrink: 0,
            }}>✕</button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Remove Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
function RemoveConfirmModal({ assignment, onConfirm, onCancel, isRemoving }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 60, backdropFilter: "blur(3px)" }}
            onClick={isRemoving ? undefined : onCancel}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
                width: 380, padding: "28px 24px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
                textAlign: "center" }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>🗑️</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
                    Remove Member?
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 22, lineHeight: 1.65 }}>
                    Remove <strong style={{ color: "#111827" }}>{assignment?.user?.name}</strong> from this project?<br />
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>This action cannot be undone.</span>
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={onCancel} disabled={isRemoving} style={{
                        flex: 1, padding: "10px", background: "#f9fafb",
                        border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280",
                        fontSize: 13, fontWeight: 600,
                        cursor: isRemoving ? "not-allowed" : "pointer",
                        opacity: isRemoving ? 0.5 : 1,
                    }}>Cancel</button>
                    <button onClick={onConfirm} disabled={isRemoving} style={{
                        flex: 1, padding: "10px",
                        background: isRemoving
                            ? "#fca5a5"
                            : "linear-gradient(135deg,#ef4444,#dc2626)",
                        border: "none", borderRadius: 8, color: "#fff",
                        fontSize: 13, fontWeight: 700,
                        cursor: isRemoving ? "not-allowed" : "pointer",
                        boxShadow: isRemoving ? "none" : "0 4px 12px rgba(239,68,68,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                        {isRemoving ? (
                            <>
                                <span style={{ display: "inline-block", width: 14, height: 14,
                                    border: "2px solid #fff", borderTopColor: "transparent",
                                    borderRadius: "50%", animation: "rmSpin 0.7s linear infinite" }} />
                                <style>{`@keyframes rmSpin{to{transform:rotate(360deg)}}`}</style>
                                Removing...
                            </>
                        ) : "🗑 Yes, Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Modal  (custom dropdown + capacity warning + over-capacity confirm)
// ─────────────────────────────────────────────────────────────────────────────
function AssignModal({ project, availableUsers, onClose }) {
    const [form, setForm] = useState({
        user_id:       "",
        start_date:    project.start_date?.slice(0, 10) || "",
        end_date:      project.end_date?.slice(0, 10)   || "",
        hours_per_day: null,
        notes:         "",
    });
    const [errors, setErrors]         = useState({});
    const [dropOpen, setDropOpen]     = useState(false);
    const [showOverConfirm, setOverC] = useState(false);
    const [isSubmitting, setSubmit]   = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const selectedUser  = availableUsers?.find(u => u.id == form.user_id);
    // total hours already assigned per day for this user across all active projects
    // Use explicit used_hours_per_day from backend; fallback to 0 (never estimate from active_count)
    const usedHours     = selectedUser?.used_hours_per_day ?? 0;
    const CAPACITY      = 8;
    const availableHrs  = Math.max(0, CAPACITY - usedHours);
    const isOverCap       = form.user_id && (usedHours + form.hours_per_day) > CAPACITY;
    // Detect if user is already assigned to THIS project (active or upcoming)
    const existingAssign  = form.user_id
        ? project.assignments?.find(a => a.user_id == form.user_id && ["active","upcoming"].includes(a.status))
        : null;

    const validate = () => {
        const e = {};
        if (!form.user_id)       e.user_id       = "Please select a member";
        if (!form.hours_per_day) e.hours_per_day = "Please select hours per day";
        if (!form.start_date)    e.start_date    = "Start date is required";
        if (!form.end_date)      e.end_date      = "End date is required";
        if (form.start_date && form.end_date && form.end_date < form.start_date)
            e.end_date = "End date must be after start date";
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length) return setErrors(e);
        // Hard block: never allow submitting if hours > available capacity
        if (form.user_id && form.hours_per_day > availableHrs) return;
        doPost();
    };

    const doPost = () => {
        setSubmit(true);
        router.post("/admin/assignments", { ...form, project_id: project.id }, {
            onSuccess: () => { setSubmit(false); onClose(); },
            onError:   () => { setSubmit(false); },
        });
    };

    const field = (err) => ({
        width: "100%", background: "#fff",
        border: `1px solid ${err ? "#fca5a5" : "#e2e8f0"}`,
        borderRadius: 8, padding: "9px 12px",
        color: "#0f172a", fontSize: 13, outline: "none", boxSizing: "border-box",
    });

    // Hours button logic — strictly disable buttons that exceed available capacity
    // existingAssign (Update Hours) mode: allow only up to remaining available hours
    const hBtn = (h) => {
        const selected   = form.hours_per_day === h;
        // In both modes: block if h > availableHrs (remaining capacity)
        const isDisabled = form.user_id && (h > availableHrs);
        if (isDisabled) return {
            border: "1px solid #e5e7eb", bg: "#f9fafb", color: "#d1d5db",
            disabled: true, cursor: "not-allowed",
        };
        if (selected) return { border: "1.5px solid #3b82f6", bg: "#eff6ff", color: "#2563eb", disabled: false, cursor: "pointer" };
        return { border: "1px solid #e2e8f0", bg: "#fff", color: "#374151", disabled: false, cursor: "pointer" };
    };

    return (
        <>
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 50, padding: 20, backdropFilter: "blur(3px)" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500,
                boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f3f4f6",
                    background: "linear-gradient(135deg,#f8faff,#eef2ff)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>Assign Member</h2>
                            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Add a member to {project.name}</p>
                        </div>
                        <button onClick={onClose} style={{ background: "#fff", border: "1px solid #e5e7eb",
                            borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#6b7280",
                            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                </div>

                <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* ── Custom Member Dropdown ── */}
                    <div style={{ position: "relative" }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Member *</label>

                        {/* Trigger */}
                        <div onClick={() => setDropOpen(o => !o)} style={{
                            width: "100%", background: "#fff", cursor: "pointer",
                            border: `1px solid ${errors.user_id ? "#fca5a5" : dropOpen ? "#6366f1" : "#e2e8f0"}`,
                            borderRadius: 8, padding: "9px 12px", boxSizing: "border-box",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            boxShadow: dropOpen ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
                            transition: "all 0.15s",
                        }}>
                            {selectedUser ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Ava name={selectedUser.name} url={selectedUser.avatar_url} size={22} />
                                    <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{selectedUser.name}</span>
                                    <Flag country={selectedUser.country} size={13} />
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{titleCase(selectedUser.country)}</span>
                                </div>
                            ) : (
                                <span style={{ fontSize: 13, color: "#9ca3af" }}>Select a member...</span>
                            )}
                            <span style={{ fontSize: 10, color: "#9ca3af", transform: dropOpen ? "rotate(180deg)" : "none",
                                transition: "transform 0.15s", display: "inline-block" }}>▼</span>
                        </div>

                        {/* Dropdown list */}
                        {dropOpen && (
                            <div style={{
                                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100,
                                maxHeight: 220, overflowY: "auto",
                            }}>
                                {availableUsers?.map(u => {
                                    const uUsed = u.used_hours_per_day ?? 0;
                                    const uAvail = Math.max(0, CAPACITY - uUsed);
                                    const isFull = uAvail === 0;
                                    return (
                                        <div key={u.id} onClick={() => { set("user_id", u.id); setDropOpen(false); }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                padding: "9px 14px", cursor: "pointer",
                                                background: form.user_id == u.id ? "#eef2ff" : "#fff",
                                                borderBottom: "1px solid #f9fafb",
                                                transition: "background 0.1s",
                                            }}
                                            onMouseEnter={e => { if (form.user_id != u.id) e.currentTarget.style.background = "#f8fafc"; }}
                                            onMouseLeave={e => { if (form.user_id != u.id) e.currentTarget.style.background = "#fff"; }}
                                        >
                                            <Ava name={u.name} url={u.avatar_url} size={28} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{u.name}</span>
                                                    <Flag country={u.country} size={13} />
                                                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{titleCase(u.country)}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1,
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {u.email}
                                                </div>
                                            </div>
                                            {/* Capacity badge */}
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, flexShrink: 0,
                                                padding: "2px 7px", borderRadius: 99,
                                                color:  isFull ? "#dc2626" : uAvail <= 4 ? "#d97706" : "#16a34a",
                                                background: isFull ? "#fef2f2" : uAvail <= 4 ? "#fefce8" : "#f0fdf4",
                                                border: `1px solid ${isFull ? "#fca5a5" : uAvail <= 4 ? "#fde68a" : "#86efac"}`,
                                            }}>
                                                {isFull ? "Full" : `${uAvail}h free`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {errors.user_id && <p style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>{errors.user_id}</p>}

                        {/* Already assigned notice */}
                        {existingAssign && (
                            <div style={{ marginTop: 8, padding: "9px 12px", borderRadius: 8,
                                background: "#eff6ff", border: "1px solid #93c5fd",
                                display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 18 }}>ℹ️</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>
                                        Already assigned to this project
                                    </div>
                                    <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 1 }}>
                                        Current: <strong>{existingAssign.hours_per_day}h/day</strong>
                                        {" · "}Submitting will add <strong>+{form.hours_per_day}h</strong> → total{" "}
                                        <strong>{Math.min(24, existingAssign.hours_per_day + form.hours_per_day)}h/day</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selected user capacity info card */}
                        {selectedUser && !existingAssign && (
                            <div style={{ marginTop: 8, padding: "9px 12px", borderRadius: 8,
                                background: isOverCap ? "#fefce8" : "#f0fdf4",
                                border: `1px solid ${isOverCap ? "#fde68a" : "#86efac"}`,
                                display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 18 }}>{isOverCap ? "⚠️" : "✅"}</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600,
                                        color: isOverCap ? "#b45309" : "#15803d" }}>
                                        {isOverCap
                                            ? `Over capacity — ${usedHours}h already assigned, adding ${form.hours_per_day}h = ${usedHours + form.hours_per_day}h/day`
                                            : `Capacity OK — ${usedHours}h used · ${availableHrs}h available`
                                        }
                                    </div>
                                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                                        On {selectedUser.active_count} active project(s) · daily limit: {CAPACITY}h
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[["Start Date *","start_date"],["End Date *","end_date"]].map(([lbl,key]) => (
                            <div key={key}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{lbl}</label>
                                <input type="date" value={form[key]} onChange={e => set(key, e.target.value)} style={field(errors[key])} />
                                {errors[key] && <p style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>{errors[key]}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Hours per Day */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151",
                                textTransform: "uppercase", letterSpacing: "0.05em" }}>Hours per Day</label>
                            {selectedUser && (
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                    Available: <strong style={{ color: availableHrs === 0 ? "#dc2626" : availableHrs <= 4 ? "#d97706" : "#16a34a" }}>
                                        {availableHrs}h
                                    </strong> / {CAPACITY}h
                                </span>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {[2,4,6,8].map(h => {
                                const b = hBtn(h);
                                return (
                                    <button key={h}
                                        onClick={() => { if (!b.disabled) set("hours_per_day", h); }}
                                        disabled={b.disabled}
                                        title={b.disabled ? `Exceeds ${CAPACITY}h daily limit` : `${h}h per day`}
                                        style={{
                                            flex: 1, padding: "8px", borderRadius: 8,
                                            cursor: b.cursor,
                                            border: b.border, background: b.bg, color: b.color,
                                            fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                                            opacity: b.disabled ? 0.45 : 1,
                                        }}>{h}h</button>
                                );
                            })}
                        </div>
                        {errors.hours_per_day && (
                            <p style={{ fontSize: 11, color: "#ef4444", marginTop: 5, fontWeight: 500 }}>
                                {errors.hours_per_day}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</label>
                        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                            placeholder="Optional notes..." rows={2} style={{ ...field(false), resize: "vertical" }} />
                    </div>
                </div>

                <div style={{ padding: "0 24px 20px", display: "flex", gap: 8 }}>
                    <button onClick={onClose} disabled={isSubmitting} style={{ flex: 1, padding: "10px", background: "#f9fafb",
                        border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280",
                        fontSize: 13, fontWeight: 600,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        opacity: isSubmitting ? 0.5 : 1 }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 2, padding: "10px",
                        background: isSubmitting
                            ? "#a5b4fc"
                            : existingAssign
                                ? "linear-gradient(135deg,#2563eb,#3b82f6)"
                                : "linear-gradient(135deg,#4f46e5,#3b82f6)",
                        border: "none", borderRadius: 8, color: "#fff",
                        fontSize: 13, fontWeight: 700,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        boxShadow: isSubmitting ? "none"
                            : existingAssign
                                ? "0 4px 12px rgba(37,99,235,0.3)"
                                : "0 4px 12px rgba(79,70,229,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        opacity: isSubmitting ? 0.8 : 1, transition: "all 0.15s" }}>
                        {isSubmitting ? (
                            <>
                                <span style={{ display: "inline-block", width: 14, height: 14,
                                    border: "2px solid #fff", borderTopColor: "transparent",
                                    borderRadius: "50%", animation: "asSpin 0.7s linear infinite" }} />
                                <style>{`@keyframes asSpin{to{transform:rotate(360deg)}}`}</style>
                                Assigning...
                            </>
                        ) : existingAssign ? "➕ Update Hours" : isOverCap ? "⚠ Assign Anyway" : "Assign Member"}
                    </button>
                </div>
            </div>
        </div>


        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Assignment Modal
// ─────────────────────────────────────────────────────────────────────────────
function EditModal({ assignment, onClose }) {
    const [form, setForm] = useState({
        start_date:    assignment.start_date?.slice(0, 10) || "",
        end_date:      assignment.end_date?.slice(0, 10)   || "",
        hours_per_day: assignment.hours_per_day || 8,
        status:        assignment.status || "active",
        notes:         assignment.notes  || "",
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const [isSaving, setIsSaving] = useState(false);
    const submit = () => {
        if (isSaving) return;
        setIsSaving(true);
        router.put(`/admin/assignments/${assignment.id}`, form, {
            onSuccess: () => { setIsSaving(false); onClose(); },
            onError:   () => setIsSaving(false),
        });
    };

    const field = {
        width: "100%", background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 8, padding: "9px 12px", color: "#0f172a", fontSize: 13, outline: "none",
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 50, padding: 20, backdropFilter: "blur(3px)" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460,
                boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
            }}>
                <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f3f4f6",
                    background: "linear-gradient(135deg,#f8faff,#eef2ff)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>Edit Assignment</h2>
                            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{assignment.user?.name}</p>
                        </div>
                        <button onClick={onClose} style={{ background: "#fff", border: "1px solid #e5e7eb",
                            borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#6b7280",
                            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                </div>

                <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[["Start Date","start_date"],["End Date","end_date"]].map(([lbl,key]) => (
                            <div key={key}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{lbl}</label>
                                <input type="date" value={form[key]} onChange={e => set(key, e.target.value)} style={field} />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hours per Day</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {[2,4,6,8].map(h => (
                                <button key={h} onClick={() => set("hours_per_day", h)} style={{
                                    flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer",
                                    border: `1px solid ${form.hours_per_day === h ? "#3b82f6" : "#e2e8f0"}`,
                                    background: form.hours_per_day === h ? "#eff6ff" : "#fff",
                                    color: form.hours_per_day === h ? "#2563eb" : "#64748b",
                                    fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                                }}>{h}h</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
                        <select value={form.status} onChange={e => set("status", e.target.value)}
                            style={{ ...field, cursor: "pointer" }}>
                            {["upcoming","active","completed","removed"].map(s => (
                                <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</label>
                        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                            rows={2} style={{ ...field, resize: "vertical" }} />
                    </div>
                </div>

                <div style={{ padding: "0 24px 20px", display: "flex", gap: 8 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#f9fafb",
                        border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280",
                        fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                    <button onClick={submit} disabled={isSaving} style={{ flex: 2, padding: "10px",
                        background: isSaving ? "#6ee7b7" : "linear-gradient(135deg,#059669,#10b981)",
                        border: "none", borderRadius: 8, color: "#fff",
                        fontSize: 13, fontWeight: 700,
                        cursor: isSaving ? "not-allowed" : "pointer",
                        boxShadow: isSaving ? "none" : "0 4px 12px rgba(5,150,105,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        opacity: isSaving ? 0.85 : 1, transition: "all 0.15s" }}>
                        {isSaving ? (
                            <>
                                <span style={{ display: "inline-block", width: 14, height: 14,
                                    border: "2px solid #fff", borderTopColor: "transparent",
                                    borderRadius: "50%", animation: "eaSpin 0.7s linear infinite" }} />
                                <style>{`@keyframes eaSpin{to{transform:rotate(360deg)}}`}</style>
                                Updating…
                            </>
                        ) : "💾 Update"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProjectShow({ project, availableUsers = [] }) {
    const [showAssign,    setShowAssign]  = useState(false);
    const [editTarget,    setEditTarget]  = useState(null);
    const [removeTarget,  setRemoveTgt]   = useState(null);
    const [isRemoving,    setIsRemoving]  = useState(false);
    const [activeTab,     setActiveTab]   = useState("members");
    const [toast,         setToast]       = useState(null);

    const showSuccess = (msg) => setToast({ type: "success", message: msg });
    const showError   = (msg) => setToast({ type: "error",   message: msg });

    const assignments = project.assignments?.filter(a => a.status !== "removed") || [];
    const logs        = project.logs || [];

    const confirmRemove = () => {
        if (isRemoving) return;          // prevent double-click
        setIsRemoving(true);
        router.delete(`/admin/assignments/${removeTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                showSuccess(`${removeTarget.user?.name} removed successfully.`);
                setRemoveTgt(null);
                setIsRemoving(false);
            },
            onError: () => {
                showError("Failed to remove member. Please try again.");
                setRemoveTgt(null);
                setIsRemoving(false);
            },
        });
    };

    const totalHours = assignments.reduce((sum, a) => {
        const days = Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 864e5);
        return sum + days * a.hours_per_day;
    }, 0);

    const s = statusConfig[project.status] || statusConfig.active;

    return (
        <AppLayout title="Project Assignments">
            <Head title={project.name} />
            <div style={{ background: "#f9fafb", minHeight: "100%" }}>

                {/* ── (1) Back button — ChevronLeft like ProjectsIndex ── */}
                <div style={{ marginBottom: 14, marginTop: "-10px" }}>
                    <div onClick={() => router.visit("/admin/assignments")} title="Back to Projects" style={{
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

                {/* ── (2) Header card — project info with polished design ── */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 16, overflow: "hidden" }}>

                    {/* Color bar accent */}
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${s.color}, ${s.color}80)` }} />

                    <div style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                                {/* Title + badge */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>{project.name}</h1>
                                    <Badge status={project.status} />
                                </div>

                                {/* Description */}
                                {project.description && (
                                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14, lineHeight: 1.6,
                                        maxWidth: 600, margin: "0 0 14px 0" }}>
                                        {project.description}
                                    </p>
                                )}

                                {/* Info pills row */}
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: project.description ? 0 : 4 }}>
                                    {/* Date range */}
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                                        background: "#f8fafc", border: "1px solid #e2e8f0",
                                        borderRadius: 8, padding: "6px 12px" }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6",
                                            textTransform: "uppercase", letterSpacing: "0.06em", width: 26, flexShrink: 0 }}>FROM</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmt(project.start_date)}</span>
                                        <span style={{ color: "#d1d5db", fontSize: 12 }}>→</span>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981",
                                            textTransform: "uppercase", letterSpacing: "0.06em", width: 14, flexShrink: 0 }}>TO</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmt(project.end_date)}</span>
                                    </div>

                                    {/* Created by */}
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                                        background: "#f8fafc", border: "1px solid #e2e8f0",
                                        borderRadius: 8, padding: "6px 12px" }}>
                                        <span style={{ fontSize: 11, color: "#9ca3af" }}>Created by</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{project.creator?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* (3) Assign Member button — New Project style */}
                            <button onClick={() => setShowAssign(true)} style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "9px 18px",
                                background: "linear-gradient(135deg,#4f46e5,#3b82f6)",
                                border: "none", borderRadius: 9, color: "#fff",
                                fontSize: 13, fontWeight: 700, cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(79,70,229,0.35)",
                                flexShrink: 0, marginLeft: 16,
                            }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                            >
                                + Assign Member
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                        { label: "Total Members", value: assignments.length,                                        color: "#6366f1", bg: "#f5f3ff", border: "#c4b5fd" },
                        { label: "Active",         value: assignments.filter(a => a.status === "active").length,     color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
                        { label: "Upcoming",       value: assignments.filter(a => a.status === "upcoming").length,   color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
                        { label: "Est. Hours",     value: `~${totalHours.toLocaleString()}h`,                       color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                    ].map((stat, i) => (
                        <div key={i} style={{ background: stat.bg, border: `1px solid ${stat.border}`,
                            borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 11, color: stat.color, marginTop: 2, fontWeight: 500 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
                    {[
                        { key: "members", label: `Members (${assignments.length})` },
                        { key: "logs",    label: `Activity Log (${logs.length})` },
                    ].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                            padding: "10px 18px", background: "none", border: "none",
                            borderBottom: `2px solid ${activeTab === t.key ? "#4f46e5" : "transparent"}`,
                            color: activeTab === t.key ? "#4f46e5" : "#9ca3af",
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                            marginBottom: -1, transition: "all 0.15s",
                        }}>{t.label}</button>
                    ))}
                </div>

                {/* ── Members Tab ── */}
                {activeTab === "members" && (
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb",
                        borderRadius: 12, overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        {assignments.length === 0 ? (
                            <div style={{ padding: "60px", textAlign: "center", color: "#d1d5db" }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                                <div style={{ fontSize: 14, marginBottom: 16 }}>No members assigned yet</div>
                                <button onClick={() => setShowAssign(true)} style={{
                                    padding: "8px 20px",
                                    background: "linear-gradient(135deg,#4f46e5,#3b82f6)",
                                    border: "none", borderRadius: 8, color: "#fff",
                                    fontSize: 13, cursor: "pointer", fontWeight: 600,
                                }}>+ Assign Member</button>
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
                                        {["Member","Period","Hours/Day","Status","Assigned By","Notes","Actions"].map(h => (
                                            <th key={h} style={{ padding: "10px 16px", textAlign: "left",
                                                fontSize: 10, color: "#9ca3af", fontWeight: 700,
                                                textTransform: "uppercase", letterSpacing: "0.06em",
                                                whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a, i) => (
                                        <tr key={a.id} style={{
                                            borderBottom: i < assignments.length - 1 ? "1px solid #f9fafb" : "none",
                                            transition: "background 0.1s",
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            {/* (4) Member — with image support */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <Ava name={a.user?.name} url={a.user?.avatar_url} size={36} />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{a.user?.name}</div>
                                                        {/* <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.user?.email}</div> */}
                                                        {/* (5) Country — flag SVG + TitleCase name */}
                                                        {a.user?.country && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                                                                <Flag country={a.user.country} size={13} />
                                                                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
                                                                    {titleCase(a.user.country)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* (6) Period — FROM/TO style like ProjectsIndex */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "inline-flex", flexDirection: "column", gap: 5 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                        <span style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6",
                                                            textTransform: "uppercase", letterSpacing: "0.07em",
                                                            width: 28, flexShrink: 0 }}>FROM</span>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmt(a.start_date)}</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                        <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981",
                                                            textTransform: "uppercase", letterSpacing: "0.07em",
                                                            width: 28, flexShrink: 0 }}>TO</span>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmt(a.end_date)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Hours */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{a.hours_per_day}</span>
                                                <span style={{ fontSize: 13, color: "#9ca3af" }}> h</span>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <Badge status={a.status} />
                                            </td>

                                            {/* (7) Assigned By — text only, styled */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                                                    {a.assigned_by?.name || "—"}
                                                </span>
                                            </td>

                                            {/* Notes */}
                                            <td style={{ padding: "14px 16px", maxWidth: 180 }}>
                                                {a.notes ? (
                                                    <span style={{
                                                        fontSize: 11, color: "#6b7280", lineHeight: 1.5,
                                                        display: "-webkit-box", WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical", overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }} title={a.notes}>
                                                        {a.notes}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                                                )}
                                            </td>

                                            {/* (8) Actions — same style as ProjectsIndex */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button onClick={() => setEditTarget(a)} style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        padding: "5px 11px", background: "#f0fdf4",
                                                        border: "1.5px solid #86efac", borderRadius: 7,
                                                        color: "#16a34a", fontSize: 11, fontWeight: 600,
                                                        cursor: "pointer", transition: "all 0.12s",
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#dcfce7"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "#f0fdf4"}
                                                    >✏️ Edit</button>
                                                    <button onClick={() => setRemoveTgt(a)} style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        padding: "5px 11px", background: "#fef2f2",
                                                        border: "1.5px solid #fca5a5", borderRadius: 7,
                                                        color: "#ef4444", fontSize: 11, fontWeight: 600,
                                                        cursor: "pointer", transition: "all 0.12s",
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
                                                    >🗑 Remove</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ── Activity Log Tab ── */}
                {activeTab === "logs" && (
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb",
                        borderRadius: 12, overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        {logs.length === 0 ? (
                            <div style={{ padding: "60px", textAlign: "center", color: "#d1d5db", fontSize: 14 }}>
                                No activity yet
                            </div>
                        ) : (
                            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 0 }}>
                                {logs.map((log, i) => {
                                    const actionColor = { assigned: "#16a34a", edited: "#2563eb", removed: "#dc2626" }[log.action] || "#64748b";
                                    const actionLabel = { assigned: "assigned", edited: "edited assignment of", removed: "removed" }[log.action] || log.action;
                                    const actionIcon  = { assigned: "✅", edited: "✏️", removed: "❌" }[log.action];
                                    return (
                                        <div key={log.id} style={{
                                            display: "flex", gap: 14,
                                            paddingBottom: i < logs.length - 1 ? 16 : 0,
                                            marginBottom:  i < logs.length - 1 ? 16 : 0,
                                            borderBottom:  i < logs.length - 1 ? "1px solid #f1f5f9" : "none",
                                        }}>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%",
                                                    background: `${actionColor}10`, border: `1px solid ${actionColor}25`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 14, flexShrink: 0 }}>{actionIcon}</div>
                                                {i < logs.length - 1 && (
                                                    <div style={{ width: 1, flex: 1, background: "#f1f5f9" }} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, paddingTop: 4 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{log.changed_by?.name}</span>
                                                    <span style={{ fontSize: 12, color: actionColor, fontWeight: 500 }}>{actionLabel}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{log.user?.name}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDT(log.created_at)}</div>
                                                {log.action === "edited" && log.old_values && log.new_values && (
                                                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#f8fafc",
                                                        borderRadius: 6, fontSize: 11, color: "#64748b",
                                                        border: "1px solid #e2e8f0" }}>
                                                        {log.old_values.start_date !== log.new_values.start_date && (
                                                            <div>start: <span style={{ color: "#dc2626" }}>{log.old_values.start_date}</span> → <span style={{ color: "#16a34a" }}>{log.new_values.start_date}</span></div>
                                                        )}
                                                        {log.old_values.end_date !== log.new_values.end_date && (
                                                            <div>end: <span style={{ color: "#dc2626" }}>{log.old_values.end_date}</span> → <span style={{ color: "#16a34a" }}>{log.new_values.end_date}</span></div>
                                                        )}
                                                        {log.old_values.status !== log.new_values.status && (
                                                            <div>status: <span style={{ color: "#dc2626" }}>{log.old_values.status}</span> → <span style={{ color: "#16a34a" }}>{log.new_values.status}</span></div>
                                                        )}
                                                        {log.old_values.hours_per_day !== log.new_values.hours_per_day && (
                                                            <div>hours/day: <span style={{ color: "#dc2626" }}>{log.old_values.hours_per_day}h</span> → <span style={{ color: "#16a34a" }}>{log.new_values.hours_per_day}h</span></div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showAssign && (
                <AssignModal project={project} availableUsers={availableUsers} onClose={() => setShowAssign(false)} />
            )}
            {editTarget && (
                <EditModal assignment={editTarget} onClose={() => setEditTarget(null)} />
            )}
            {removeTarget && (
                <RemoveConfirmModal
                    assignment={removeTarget}
                    onConfirm={confirmRemove}
                    onCancel={() => { if (!isRemoving) setRemoveTgt(null); }}
                    isRemoving={isRemoving}
                />
            )}
            <Toast toast={toast} onClose={() => setToast(null)} />
        </AppLayout>
    );
}