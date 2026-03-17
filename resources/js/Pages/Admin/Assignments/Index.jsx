import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const WL = {
    free:     { label: "Free",     color: "#22c55e", bg: "#f0fdf4", border: "#86efac", dot: "#22c55e", pct: 0   },
    light:    { label: "Light",    color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd", dot: "#3b82f6", pct: 25  },
    moderate: { label: "Moderate", color: "#f59e0b", bg: "#fefce8", border: "#fde047", dot: "#f59e0b", pct: 50  },
    heavy:    { label: "Heavy",    color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444", pct: 75  },
    full:     { label: "Full",     color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", dot: "#7c3aed", pct: 100 },
};

// Compute workload key from hours_per_day
function getWorkload(usedHours) {
    if (usedHours === 0)           return "free";
    if (usedHours <= 2)            return "light";
    if (usedHours <= 4)            return "moderate";
    if (usedHours <= 6)            return "heavy";
    return "full";                 // 7-8h
}

const ST = {
    active:    { label: "Active",    color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
    upcoming:  { label: "Upcoming",  color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
    completed: { label: "Completed", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
    cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb", border: "#d1d5db" },
};

const CC = {
    "myanmar":"mm","burma":"mm","japan":"jp","thailand":"th","cambodia":"kh",
    "vietnam":"vn","singapore":"sg","malaysia":"my","indonesia":"id","philippines":"ph",
    "china":"cn","korea":"kr","south korea":"kr","india":"in","usa":"us",
    "united states":"us","uk":"gb","united kingdom":"gb","australia":"au",
    "germany":"de","france":"fr","canada":"ca","brazil":"br","laos":"la",
    "russia":"ru","italy":"it","spain":"es","netherlands":"nl","sweden":"se",
};

const cc = (c) => { if (!c) return null; const k = c.toLowerCase().trim(); return CC[k] || (k.length===2?k:null); };

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
function Flag({ country, size = 18 }) {
    const [err, setErr] = useState(false);
    const code = cc(country);
    if (!code || err) return <span style={{ fontSize: size * 0.8 }}>🌐</span>;
    return (
        <img src={`https://flagcdn.com/w40/${code}.png`} alt={country}
            onError={() => setErr(true)}
            style={{ width: size, height: size * 0.67, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
    );
}

function Ava({ name, url, size = 32 }) {
    const [err, setErr] = useState(false);
    const letters = name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
    const colors  = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#14b8a6"];
    const bg      = colors[(name?.charCodeAt(0) || 0) % colors.length];
    // Normalize: relative path → /storage/..., absolute/data URLs → use as-is
    const src = url
        ? (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:") ? url : `/storage/${url}`)
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

function Pill({ label, color, bg, border }) {
    return (
        <span style={{ fontSize: 10, fontWeight: 700, color, background: bg,
            border: `1px solid ${border}`, padding: "2px 8px", borderRadius: 99,
            textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
            {label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Workload filter bar
// ─────────────────────────────────────────────────────────────────────────────
function FilterBar({ active, onChange }) {
    const opts = [
        { k: "all",      label: "All",       color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
        { k: "free",     label: "Free",      ...WL.free },
        { k: "light",    label: "Light",     ...WL.light },
        { k: "moderate", label: "Moderate",  ...WL.moderate },
        { k: "heavy",    label: "Heavy",     ...WL.heavy },
        { k: "full",     label: "Full",      ...WL.full  },
    ];
    return (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {opts.map(o => (
                <button key={o.k} onClick={() => onChange(o.k)} style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", border: `1.5px solid ${active === o.k ? o.color : "#e5e7eb"}`,
                    background: active === o.k ? o.bg : "#fff",
                    color: active === o.k ? o.color : "#6b7280",
                    transition: "all 0.12s", outline: "none",
                }}>{o.label}</button>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Member row (list item, not a card)
// ─────────────────────────────────────────────────────────────────────────────
function MemberRow({ user, selected, onClick }) {
    const wlKey = user.used_hours_per_day != null ? getWorkload(user.used_hours_per_day) : (user.workload || "free");
    const wl    = WL[wlKey] || WL.free;
    return (
        <div onClick={() => onClick(user)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, cursor: "pointer",
            background: selected ? "#eef2ff" : "transparent",
            border: `1.5px solid ${selected ? "#6366f1" : "transparent"}`,
            transition: "all 0.12s",
        }}
            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
        >
            {/* Avatar + workload dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
                <Ava name={user.name} url={user.avatar_url} size={36} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8,
                    borderRadius: "50%", background: wl.dot, border: "1.5px solid #fff" }} />
            </div>

            {/* Name + flag (no email, no A/U) */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
                    {user.country && <Flag country={user.country} size={13} />}
                </div>
            </div>
            {/* Workload pill only */}
            <div style={{ flexShrink: 0 }}>
                <Pill label={wl.label} color={wl.color} bg={wl.bg} border={wl.border} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project card — compact
// ─────────────────────────────────────────────────────────────────────────────
function ProjectCard({ project }) {
    const st      = ST[project.status] || ST.active;
    const members = (project.assignments || []).filter(a => a.status !== "removed");
    const days    = project.end_date
        ? Math.ceil((new Date(project.end_date) - new Date()) / 864e5) : null;

    return (
        <div onClick={() => router.visit(`/admin/projects/${project.id}`)} style={{ textDecoration: "none", cursor: "pointer" }}>
            <div style={{
                background: "#fff", borderRadius: 10, padding: "12px 14px",
                border: `1.5px solid ${st.color}50`, borderLeft: `3px solid ${st.color}`,
                transition: "all 0.12s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.08)`; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
            >
                {/* Name + badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                        {project.name}
                    </span>
                    <Pill label={st.label} color={st.color} bg={st.bg} border={st.border} />
                </div>

                {/* Avatars */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex" }}>
                        {members.slice(0, 4).map((m, i) => (
                            <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }}>
                                <Ava name={m.user?.name} url={m.user?.avatar_url} size={22} />
                            </div>
                        ))}
                        {members.length > 4 && (
                            <div style={{ marginLeft: -8, width: 22, height: 22, borderRadius: "50%",
                                background: "#e5e7eb", border: "2px solid #fff", display: "flex",
                                alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#6b7280" }}>
                                +{members.length - 4}
                            </div>
                        )}
                    </div>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                    {days !== null && project.status === "active" && (
                        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600,
                            color: days <= 7 ? "#ef4444" : "#6b7280" }}>
                            {days > 0 ? `${days}d left` : "Ended"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Member detail panel
// ─────────────────────────────────────────────────────────────────────────────
function MemberDetail({ user, onClose }) {
    const wlKey = user.used_hours_per_day != null ? getWorkload(user.used_hours_per_day) : (user.workload || "free");
    const wl    = WL[wlKey] || WL.free;
    const countryDisplay = user.country
        ? user.country.charAt(0).toUpperCase() + user.country.slice(1).toLowerCase() : "";

    return (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>

            {/* Header band */}
            <div style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)",
                padding: "16px 18px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative" }}>
                        <Ava name={user.name} url={user.avatar_url} size={46} />
                        <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10,
                            borderRadius: "50%", background: wl.dot, border: "2px solid #fff" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{user.email}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <Pill label={`${wl.label} workload`} color={wl.color} bg={wl.bg} border={wl.border} />
                            {user.department && (
                                <span style={{ fontSize: 11, color: "#6b7280", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    🏢 {user.department}
                                </span>
                            )}
                            {user.position && (
                                <span style={{ fontSize: 11, color: "#6b7280", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    💼 {user.position}
                                </span>
                            )}
                            {user.country && (
                                <span style={{ fontSize: 11, color: "#6b7280", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <Flag country={user.country} size={14} />
                                    {countryDisplay}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Mini stats */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>{user.active_count}</div>
                            <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active</div>
                        </div>
                        <div style={{ width: 1, background: "#e5e7eb" }} />
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#2563eb", lineHeight: 1 }}>{user.upcoming_count}</div>
                            <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Upcoming</div>
                        </div>
                    </div>
                </div>

                {/* Workload bar — based on hours_per_day / 8h capacity */}
                {(() => {
                    const used  = user.used_hours_per_day ?? 0;
                    const pct   = Math.min(100, Math.round(used / 8 * 100));
                    const barColor = pct === 0 ? "#22c55e" : pct <= 25 ? "#3b82f6" : pct <= 50 ? "#f59e0b" : pct <= 75 ? "#ef4444" : "#7c3aed";
                    return (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 10, color: "#9ca3af" }}>Daily capacity  ({used}h / 8h used)</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: barColor }}>{pct}%</span>
                            </div>
                            <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99,
                                    background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                                    transition: "width 0.6s ease" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                                {[0,2,4,6,8].map(h => (
                                    <span key={h} style={{ fontSize: 9, color: "#d1d5db" }}>{h}h</span>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Assignments list */}
            <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
                    letterSpacing: "0.06em", marginBottom: 10 }}>
                    Assignments · {user.assignments?.length || 0}
                </div>

                {!user.assignments?.length ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#d1d5db" }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
                        <div style={{ fontSize: 12 }}>No assignments yet</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {user.assignments.map((a, i) => {
                            const s   = ST[a.status] || ST.active;
                            const sd  = new Date(a.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                            const ed  = new Date(a.end_date).toLocaleDateString("en-GB",   { day: "2-digit", month: "short", year: "2-digit" });
                            return (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                                    padding: "9px 12px", borderRadius: 8,
                                    background: "#fafafa", border: `1px solid #f3f4f6`,
                                    borderLeft: `3px solid ${s.color}` }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.project?.name}
                                        </div>
                                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                                            {sd} → {ed}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                        <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 500 }}>
                                            {a.hours_per_day}h/day
                                        </span>
                                        <Pill label={s.label} color={s.color} bg={s.bg} border={s.border} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Project Modal
// ─────────────────────────────────────────────────────────────────────────────
function NewProjectModal({ onClose }) {
    const [form, setForm]         = useState({ name: "", description: "", status: "upcoming", start_date: "", end_date: "" });
    const [errors, setErrors]     = useState({});
    const [isSubmitting, setSub]  = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = () => {
        const e = {};
        if (!form.name)       e.name       = "Required";
        if (!form.start_date) e.start_date = "Required";
        if (!form.end_date)   e.end_date   = "Required";
        if (form.start_date && form.end_date && form.end_date < form.start_date) e.end_date = "Must be after start";
        if (Object.keys(e).length) return setErrors(e);
        if (isSubmitting) return;
        setSub(true);
        router.post("/admin/projects", form, {
            onSuccess: () => { setSub(false); onClose(); },
            onError:   () => setSub(false),
        });
    };

    const inp = (err) => ({
        width: "100%", padding: "9px 11px", fontSize: 13, color: "#111827",
        background: "#f9fafb", border: `1.5px solid ${err ? "#fca5a5" : "#e5e7eb"}`,
        borderRadius: 8, outline: "none", boxSizing: "border-box", transition: "border 0.15s",
    });

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(3px)" }}
            onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24,
                width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>New Project</h2>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Fill in the project details</p>
                    </div>
                    <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 8,
                        width: 30, height: 30, cursor: "pointer", color: "#6b7280", fontSize: 14,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                        { label: "Project Name *", key: "name", type: "text", placeholder: "e.g. CRM System v2" },
                    ].map(f => (
                        <div key={f.key}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                            <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                                placeholder={f.placeholder} style={inp(errors[f.key])} />
                            {errors[f.key] && <p style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>{errors[f.key]}</p>}
                        </div>
                    ))}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                            marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
                        <textarea value={form.description} onChange={e => set("description", e.target.value)}
                            placeholder="Brief description..." rows={2}
                            style={{ ...inp(false), resize: "vertical" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                            marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
                        <select value={form.status} onChange={e => set("status", e.target.value)}
                            style={{ ...inp(false), cursor: "pointer" }}>
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[["Start Date *","start_date"],["End Date *","end_date"]].map(([lbl, key]) => (
                            <div key={key}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block",
                                    marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{lbl}</label>
                                <input type="date" value={form[key]} onChange={e => set(key, e.target.value)}
                                    style={inp(errors[key])} />
                                {errors[key] && <p style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>{errors[key]}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                    <button onClick={onClose} disabled={isSubmitting} style={{ flex: 1, padding: "10px", background: "#f9fafb",
                        border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280",
                        fontSize: 13, fontWeight: 600,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        opacity: isSubmitting ? 0.5 : 1 }}>Cancel</button>
                    <button onClick={submit} disabled={isSubmitting} style={{ flex: 2, padding: "10px",
                        background: isSubmitting ? "#a5b4fc" : "linear-gradient(135deg,#4f46e5,#3b82f6)",
                        border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        boxShadow: isSubmitting ? "none" : "0 4px 12px rgba(79,70,229,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        opacity: isSubmitting ? 0.8 : 1, transition: "all 0.15s" }}>
                        {isSubmitting ? (
                            <>
                                <span style={{ display: "inline-block", width: 14, height: 14,
                                    border: "2px solid #fff", borderTopColor: "transparent",
                                    borderRadius: "50%", animation: "npSpin 0.7s linear infinite" }} />
                                <style>{`@keyframes npSpin{to{transform:rotate(360deg)}}`}</style>
                                Creating...
                            </>
                        ) : "Create Project"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AssignmentsDashboard({ users = [], projects = [] }) {
    const [selected, setSelected]   = useState(null);
    const [search, setSearch]       = useState("");
    const [wlFilter, setWlFilter]   = useState("all");
    const [showNew, setShowNew]     = useState(false);

    const filtered = users.filter(u => {
        const uKey = u.used_hours_per_day != null ? getWorkload(u.used_hours_per_day) : (u.workload || "free");
        return (u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase())) &&
               (wlFilter === "all" || uKey === wlFilter);
    });

    const liveProj   = projects.filter(p => p.status === "active").length;
    const upcoming   = projects.filter(p => ["active","upcoming"].includes(p.status));
    // Hours-based utilization: avg used hours across all members
    const totalCapacity  = users.length * 8;
    const totalUsed      = users.reduce((s, u) => s + (u.used_hours_per_day ?? 0), 0);
    const activePct      = totalCapacity > 0 ? Math.round(totalUsed / totalCapacity * 100) : 0;
    const availableCount = users.filter(u => (u.used_hours_per_day ?? 0) === 0).length;

    return (
        <AppLayout title="Project Assignments">
            <Head title="Project Assignments" />

            <div style={{ background: "#f9fafb", minHeight: "100%", fontFamily: "inherit" }}>

                {/* ── Top bar — buttons only, title shown by AppLayout ── */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
                    <button onClick={() => router.visit("/admin/projects")} style={{ display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8,
                        color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        📁 All Projects
                    </button>
                    <button onClick={() => setShowNew(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", background: "linear-gradient(135deg,#4f46e5,#3b82f6)", border: "none",
                        borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
                        + New Project
                    </button>
                </div>

                {/* ── 4 stat cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                    {[
                        { icon: "👥", val: users.length,                           label: "Total Members",  sub: "Active employees",    color: "#4f46e5" },
                        { icon: "✅", val: availableCount, label: "Available",  sub: "0h assigned today",   color: "#16a34a" },
                        { icon: "🔥", val: `${activePct}%`,                        label: "Utilization",   sub: `${totalUsed}h / ${totalCapacity}h today`, color: "#f59e0b" },
                        { icon: "🚀", val: liveProj,                               label: "Active Projects",sub: "Currently running",   color: "#2563eb" },
                    ].map((s, i) => (
                        <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px",
                            border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginTop: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{s.sub}</div>
                                </div>
                                <span style={{ fontSize: 20 }}>{s.icon}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main 2-col layout ── */}
                <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>

                    {/* LEFT: member list panel */}
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>

                        {/* Panel header */}
                        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10,
                                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Team Members
                            </div>
                            {/* Search */}
                            <div style={{ position: "relative", marginBottom: 8 }}>
                                <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
                                    fontSize: 12, color: "#9ca3af" }}>🔍</span>
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search…"
                                    style={{ width: "100%", padding: "7px 10px 7px 28px", fontSize: 12, color: "#111827",
                                        background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8,
                                        outline: "none", boxSizing: "border-box" }} />
                            </div>
                            {/* Filter */}
                            <FilterBar active={wlFilter} onChange={setWlFilter} />
                        </div>

                        {/* Count */}
                        <div style={{ padding: "6px 14px 4px", fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>
                            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
                        </div>

                        {/* List */}
                        <div style={{ padding: "4px 6px 8px", maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
                            {filtered.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "32px 0", color: "#d1d5db" }}>
                                    <div style={{ fontSize: 24, marginBottom: 6 }}>👥</div>
                                    <div style={{ fontSize: 12 }}>No members found</div>
                                </div>
                            ) : filtered.map(u => (
                                <MemberRow key={u.id} user={u}
                                    selected={selected?.id === u.id}
                                    onClick={u => setSelected(p => p?.id === u.id ? null : u)} />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: projects + detail */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Projects section */}
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: "16px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                <span style={{ fontSize: 14 }}>🚀</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Active & Upcoming</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5",
                                    background: "#eef2ff", border: "1px solid #c7d2fe",
                                    padding: "1px 7px", borderRadius: 99 }}>{upcoming.length}</span>
                            </div>

                            {upcoming.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "28px 0", color: "#d1d5db" }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                                    <div style={{ fontSize: 12, marginBottom: 12 }}>No active or upcoming projects</div>
                                    <button onClick={() => setShowNew(true)} style={{ padding: "7px 14px",
                                        background: "linear-gradient(135deg,#4f46e5,#3b82f6)", border: "none",
                                        borderRadius: 8, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                                        + Create Project
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                    {upcoming.map(p => (
                                        <div key={p.id} style={{ width: 210, flexShrink: 0 }}>
                                            <ProjectCard project={p} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Member detail */}
                        {selected && <MemberDetail user={selected} onClose={() => setSelected(null)} />}
                    </div>
                </div>
            </div>

            {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
        </AppLayout>
    );
}