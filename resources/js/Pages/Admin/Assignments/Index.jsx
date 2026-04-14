import { useState, useEffect, useRef, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Theme System
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
        bg:           "#080e1a",
        bgSoft:       "#0d1526",
        surface:      "rgba(15,26,50,0.92)",
        surfaceSoft:  "rgba(255,255,255,0.04)",
        surfaceSofter:"rgba(255,255,255,0.06)",
        border:       "rgba(148,163,184,0.10)",
        borderStrong: "rgba(148,163,184,0.18)",
        text:         "#f1f5f9",
        textSoft:     "#94a3b8",
        textMute:     "#475569",
        shadow:       "0 24px 64px rgba(0,0,0,0.48)",
        shadowSoft:   "0 8px 24px rgba(0,0,0,0.32)",
        primary:      "#6366f1",
        primarySoft:  "rgba(99,102,241,0.18)",
        secondary:    "#3b82f6",
        success:      "#10b981",
        successSoft:  "rgba(16,185,129,0.16)",
        warning:      "#f59e0b",
        warningSoft:  "rgba(245,158,11,0.16)",
        danger:       "#ef4444",
        dangerSoft:   "rgba(239,68,68,0.14)",
        inputBg:      "rgba(255,255,255,0.04)",
        inputBorder:  "rgba(148,163,184,0.14)",
        rowHover:     "rgba(255,255,255,0.03)",
        overlay:      "rgba(2,8,23,0.75)",
        glass:        "radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 48%), radial-gradient(circle at bottom left, rgba(59,130,246,0.12), transparent 44%)",
        stat1: "rgba(99,102,241,0.14)", stat1c: "#818cf8",
        stat2: "rgba(16,185,129,0.14)", stat2c: "#34d399",
        stat3: "rgba(245,158,11,0.14)", stat3c: "#fbbf24",
        stat4: "rgba(59,130,246,0.14)", stat4c: "#60a5fa",
    };
    return {
        bg:           "#f1f5f9",
        bgSoft:       "#e8edf5",
        surface:      "#ffffff",
        surfaceSoft:  "#f8fafc",
        surfaceSofter:"#f1f5f9",
        border:       "rgba(15,23,42,0.07)",
        borderStrong: "rgba(15,23,42,0.12)",
        text:         "#0f172a",
        textSoft:     "#475569",
        textMute:     "#94a3b8",
        shadow:       "0 20px 60px rgba(15,23,42,0.08)",
        shadowSoft:   "0 6px 20px rgba(15,23,42,0.06)",
        primary:      "#6366f1",
        primarySoft:  "#eef2ff",
        secondary:    "#3b82f6",
        success:      "#059669",
        successSoft:  "#d1fae5",
        warning:      "#d97706",
        warningSoft:  "#fef3c7",
        danger:       "#ef4444",
        dangerSoft:   "#fee2e2",
        inputBg:      "#f8fafc",
        inputBorder:  "#e2e8f0",
        rowHover:     "#f8fafc",
        overlay:      "rgba(15,23,42,0.4)",
        glass:        "radial-gradient(circle at top right, rgba(99,102,241,0.06), transparent 48%), radial-gradient(circle at bottom left, rgba(59,130,246,0.05), transparent 44%)",
        stat1: "#eef2ff", stat1c: "#6366f1",
        stat2: "#d1fae5", stat2c: "#059669",
        stat3: "#fef3c7", stat3c: "#d97706",
        stat4: "#dbeafe", stat4c: "#2563eb",
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Config (original — unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const WL = {
    free:     { label: "Free",     color: "#22c55e", bg: "#f0fdf4", bgDark: "rgba(34,197,94,0.14)",  border: "#86efac", dot: "#22c55e", pct: 0   },
    light:    { label: "Light",    color: "#3b82f6", bg: "#eff6ff", bgDark: "rgba(59,130,246,0.14)", border: "#93c5fd", dot: "#3b82f6", pct: 25  },
    moderate: { label: "Moderate", color: "#f59e0b", bg: "#fefce8", bgDark: "rgba(245,158,11,0.14)", border: "#fde047", dot: "#f59e0b", pct: 50  },
    heavy:    { label: "Heavy",    color: "#ef4444", bg: "#fef2f2", bgDark: "rgba(239,68,68,0.14)",  border: "#fca5a5", dot: "#ef4444", pct: 75  },
    full:     { label: "Full",     color: "#7c3aed", bg: "#f5f3ff", bgDark: "rgba(124,58,237,0.14)", border: "#c4b5fd", dot: "#7c3aed", pct: 100 },
};

function getWorkload(usedHours) {
    if (usedHours === 0) return "free";
    if (usedHours <= 2)  return "light";
    if (usedHours <= 4)  return "moderate";
    if (usedHours <= 6)  return "heavy";
    return "full";
}

const ST = {
    active:    { label: "Active",    color: "#16a34a", bg: "#f0fdf4", bgDark: "rgba(22,163,74,0.15)",   border: "#86efac" },
    upcoming:  { label: "Upcoming",  color: "#2563eb", bg: "#eff6ff", bgDark: "rgba(37,99,235,0.15)",   border: "#93c5fd" },
    completed: { label: "Completed", color: "#7c3aed", bg: "#f5f3ff", bgDark: "rgba(124,58,237,0.15)", border: "#c4b5fd" },
    cancelled: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb", bgDark: "rgba(156,163,175,0.12)", border: "#d1d5db" },
};

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
    const src = url
        ? (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:") ? url : `/storage/${url}`)
        : null;
    if (src && !err) return (
        <img src={src} alt={name} onError={() => setErr(true)}
            style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", flexShrink: 0 }} />
    );
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
            {letters}
        </div>
    );
}

function Pill({ label, color, bg, bgDark, border, dark = false }) {
    return (
        <span style={{ fontSize: 10, fontWeight: 700, color,
            background: dark ? (bgDark || bg) : bg,
            border: `1px solid ${dark ? (color + "44") : border}`,
            padding: "3px 9px", borderRadius: 99,
            textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            {label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PremiumSelect — portal-free, scrollbar hidden
// ─────────────────────────────────────────────────────────────────────────────
function PremiumSelect({ options = [], value = "", onChange, placeholder = "Select…", theme, dark, width = "auto", minWidth = 140, zIndex = 200 }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const triggerBg = dark
        ? "linear-gradient(180deg, rgba(15,26,50,0.98) 0%, rgba(10,18,38,0.98) 100%)"
        : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)";
    const menuBg = dark
        ? "linear-gradient(180deg, rgba(8,18,40,0.99) 0%, rgba(5,12,28,0.99) 100%)"
        : "#ffffff";

    return (
        <div ref={ref} style={{ position: "relative", width, minWidth, zIndex }}>
            <button type="button" onClick={() => setOpen(v => !v)} style={{
                width: "100%", height: 40, padding: "0 14px",
                borderRadius: 12, border: `1px solid ${open ? theme.borderStrong : theme.inputBorder}`,
                background: triggerBg, color: selected ? theme.text : theme.textMute,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.15s ease",
                boxShadow: open ? theme.shadowSoft : "none", fontFamily: "inherit",
            }}>
                <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selected?.label || <span style={{ color: theme.textMute }}>{placeholder}</span>}
                </span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }}>
                    <path d="M4 6L8 10L12 6" stroke={theme.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                    zIndex: zIndex + 50, background: menuBg,
                    border: `1px solid ${theme.borderStrong}`, borderRadius: 14,
                    overflow: "hidden", boxShadow: theme.shadow, backdropFilter: "blur(16px)",
                }}>
                    {/* scrollbar hidden */}
                    <div style={{ maxHeight: 220, overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                        {options.map((opt, i) => {
                            const isSel = String(opt.value) === String(value);
                            return (
                                <button key={String(opt.value) || i} type="button"
                                    onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                                    style={{
                                        width: "100%", minHeight: 40, padding: "0 14px",
                                        border: "none",
                                        borderBottom: i < options.length - 1 ? `1px solid ${theme.border}` : "none",
                                        background: isSel ? (dark ? "rgba(99,102,241,0.22)" : "#eef2ff") : "transparent",
                                        color: isSel ? theme.primary : opt.disabled ? theme.textMute : theme.text,
                                        display: "flex", alignItems: "center", gap: 8,
                                        cursor: opt.disabled ? "not-allowed" : "pointer",
                                        fontSize: 12, fontWeight: isSel ? 700 : 500,
                                        opacity: opt.disabled ? 0.45 : 1,
                                        textAlign: "left", fontFamily: "inherit",
                                        transition: "background 0.12s",
                                    }}
                                    onMouseEnter={e => { if (!isSel && !opt.disabled) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#f8fafc"; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                                    {opt.icon && <span>{opt.icon}</span>}
                                    {opt.label}
                                    {isSel && <svg style={{ marginLeft: "auto" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Workload FilterBar — premium pill style
// ─────────────────────────────────────────────────────────────────────────────
function FilterBar({ active, onChange, theme, dark }) {
    const opts = [
        { k: "all",      label: "All",      color: theme.primary, bg: theme.primarySoft, icon: "◉" },
        { k: "free",     label: "Free",     ...WL.free },
        { k: "light",    label: "Light",    ...WL.light },
        { k: "moderate", label: "Moderate", ...WL.moderate },
        { k: "heavy",    label: "Heavy",    ...WL.heavy },
        { k: "full",     label: "Full",     ...WL.full  },
    ];
    return (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {opts.map(o => {
                const isAct = active === o.k;
                return (
                    <button key={o.k} onClick={() => onChange(o.k)} style={{
                        padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                        cursor: "pointer", border: `1.5px solid ${isAct ? o.color : theme.border}`,
                        background: isAct
                            ? (dark ? (o.bgDark || o.bg || theme.primarySoft) : (o.bg || theme.primarySoft))
                            : "transparent",
                        color: isAct ? o.color : theme.textMute,
                        transition: "all 0.12s", outline: "none", fontFamily: "inherit",
                        letterSpacing: "0.04em", textTransform: "uppercase",
                    }}>{o.label}</button>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MemberRow — premium
// ─────────────────────────────────────────────────────────────────────────────
function MemberRow({ user, selected, onClick, theme, dark }) {
    const wlKey = user.used_hours_per_day != null ? getWorkload(user.used_hours_per_day) : (user.workload || "free");
    const wl    = WL[wlKey] || WL.free;
    return (
        <div onClick={() => onClick(user)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px", borderRadius: 10, cursor: "pointer",
            background: selected
                ? (dark ? "rgba(99,102,241,0.16)" : "#eef2ff")
                : "transparent",
            border: `1.5px solid ${selected ? theme.primary + "60" : "transparent"}`,
            transition: "all 0.12s",
        }}
            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = theme.rowHover; }}
            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
        >
            <div style={{ position: "relative", flexShrink: 0 }}>
                <Ava name={user.name} url={user.avatar_url} size={34} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8,
                    borderRadius: "50%", background: wl.dot, border: "2px solid " + (dark ? "#0d1526" : "#fff"),
                    boxShadow: `0 0 0 1px ${wl.dot}44` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
                    {user.country && <Flag country={user.country} size={12} />}
                </div>
                {user.position && (
                    <div style={{ fontSize: 10, color: theme.textMute, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.position}
                    </div>
                )}
            </div>
            <div style={{ flexShrink: 0 }}>
                <Pill label={wl.label} color={wl.color} bg={wl.bg} bgDark={wl.bgDark} border={wl.border} dark={dark} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectCard — premium
// ─────────────────────────────────────────────────────────────────────────────
function ProjectCard({ project, theme, dark }) {
    const st      = ST[project.status] || ST.active;
    const members = (project.assignments || []).filter(a => a.status !== "removed");
    const days    = project.end_date
        ? Math.ceil((new Date(project.end_date) - new Date()) / 864e5) : null;

    return (
        <div onClick={() => router.visit(`/admin/projects/${project.id}`)} style={{ cursor: "pointer" }}>
            <div style={{
                background: theme.surface, borderRadius: 14, padding: "14px 16px",
                border: `1px solid ${theme.border}`,
                borderLeft: `3px solid ${st.color}`,
                transition: "all 0.15s", boxShadow: theme.shadowSoft,
                backdropFilter: "blur(10px)",
            }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = theme.shadowSoft; e.currentTarget.style.transform = "translateY(0)"; }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: theme.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130, flex: 1 }}>
                        {project.name}
                    </span>
                    <Pill label={st.label} color={st.color} bg={st.bg} bgDark={st.bgDark} border={st.border} dark={dark} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                        {members.slice(0, 4).map((m, i) => (
                            <div key={i} style={{ marginLeft: i === 0 ? 0 : -7, zIndex: 10 - i }}>
                                <Ava name={m.user?.name} url={m.user?.avatar_url} size={22} />
                            </div>
                        ))}
                        {members.length > 4 && (
                            <div style={{ marginLeft: -7, width: 22, height: 22, borderRadius: "50%",
                                background: theme.surfaceSoft, border: `2px solid ${dark ? "#0d1526" : "#fff"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 8, fontWeight: 700, color: theme.textMute }}>
                                +{members.length - 4}
                            </div>
                        )}
                    </div>
                    <span style={{ fontSize: 10, color: theme.textMute }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                    {days !== null && project.status === "active" && (
                        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700,
                            color: days <= 7 ? "#ef4444" : theme.textMute }}>
                            {days > 0 ? `${days}d left` : "Ended"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MemberDetail — premium panel
// ─────────────────────────────────────────────────────────────────────────────
function MemberDetail({ user, onClose, theme, dark }) {
    const wlKey = user.used_hours_per_day != null ? getWorkload(user.used_hours_per_day) : (user.workload || "free");
    const wl    = WL[wlKey] || WL.free;
    const countryDisplay = user.country
        ? user.country.charAt(0).toUpperCase() + user.country.slice(1).toLowerCase() : "";

    return (
        <div style={{
            background: theme.surface, borderRadius: 16,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadow, overflow: "hidden",
            animation: "slideUp 0.22s ease",
            backdropFilter: "blur(16px)",
        }}>
            {/* Header */}
            <div style={{
                background: dark
                    ? "linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(59,130,246,0.10) 100%)"
                    : "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)",
                padding: "18px 20px",
                borderBottom: `1px solid ${theme.border}`,
                position: "relative",
            }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <Ava name={user.name} url={user.avatar_url} size={50} />
                        <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11,
                            borderRadius: "50%", background: wl.dot,
                            border: `2px solid ${dark ? "#0d1526" : "#fff"}`,
                            boxShadow: `0 0 0 2px ${wl.dot}44` }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, letterSpacing: "-0.02em" }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: theme.textMute, marginTop: 2 }}>{user.email}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <Pill label={`${wl.label} workload`} color={wl.color} bg={wl.bg} bgDark={wl.bgDark} border={wl.border} dark={dark} />
                            {user.department && <span style={{ fontSize: 10, color: theme.textSoft, display: "inline-flex", alignItems: "center", gap: 3 }}>🏢 {user.department}</span>}
                            {user.position && <span style={{ fontSize: 10, color: theme.textSoft, display: "inline-flex", alignItems: "center", gap: 3 }}>💼 {user.position}</span>}
                            {user.country && (
                                <span style={{ fontSize: 10, color: theme.textSoft, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <Flag country={user.country} size={13} />
                                    {countryDisplay}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                        {[
                            { val: user.active_count,   label: "Active",    color: "#16a34a" },
                            { val: user.upcoming_count, label: "Upcoming",  color: "#2563eb" },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: "center", padding: "8px 12px", borderRadius: 10,
                                background: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                                border: `1px solid ${theme.border}` }}>
                                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                                <div style={{ fontSize: 9, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Workload bar */}
                {(() => {
                    const used = user.used_hours_per_day ?? 0;
                    const pct  = Math.min(100, Math.round(used / 8 * 100));
                    const bc   = pct === 0 ? "#22c55e" : pct <= 25 ? "#3b82f6" : pct <= 50 ? "#f59e0b" : pct <= 75 ? "#ef4444" : "#7c3aed";
                    return (
                        <div style={{ marginTop: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: 10, color: theme.textMute }}>Daily capacity ({used}h / 8h used)</span>
                                <span style={{ fontSize: 10, fontWeight: 800, color: bc }}>{pct}%</span>
                            </div>
                            <div style={{ height: 6, background: dark ? "rgba(255,255,255,0.08)" : "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99,
                                    background: `linear-gradient(90deg, ${bc}88, ${bc})`,
                                    transition: "width 0.6s ease", boxShadow: `0 0 8px ${bc}66` }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                                {[0,2,4,6,8].map(h => (
                                    <span key={h} style={{ fontSize: 9, color: theme.textMute }}>{h}h</span>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Assignments */}
            <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: theme.textMute, textTransform: "uppercase",
                    letterSpacing: "0.08em", marginBottom: 12 }}>
                    Assignments · {user.assignments?.length || 0}
                </div>

                {!user.assignments?.length ? (
                    <div style={{ textAlign: "center", padding: "28px 0", color: theme.textMute }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                        <div style={{ fontSize: 12 }}>No assignments yet</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {user.assignments.map((a, i) => {
                            const s  = ST[a.status] || ST.active;
                            const sd = new Date(a.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                            const ed = new Date(a.end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
                            return (
                                <div key={i} style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "10px 14px", borderRadius: 10,
                                    background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                    border: `1px solid ${theme.border}`,
                                    borderLeft: `3px solid ${s.color}`,
                                    transition: "background 0.12s",
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}
                                    onMouseLeave={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "#f8fafc"}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: theme.text,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.project?.name}
                                        </div>
                                        <div style={{ fontSize: 10, color: theme.textMute, marginTop: 2 }}>
                                            {sd} → {ed}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: theme.textSoft,
                                            background: theme.surfaceSoft, padding: "2px 8px", borderRadius: 6,
                                            border: `1px solid ${theme.border}` }}>
                                            {a.hours_per_day}h/day
                                        </span>
                                        <Pill label={s.label} color={s.color} bg={s.bg} bgDark={s.bgDark} border={s.border} dark={dark} />
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
// New Project Modal — premium
// ─────────────────────────────────────────────────────────────────────────────
function NewProjectModal({ onClose, theme, dark }) {
    const [form, setForm]        = useState({ name: "", description: "", status: "upcoming", start_date: "", end_date: "" });
    const [errors, setErrors]    = useState({});
    const [isSubmitting, setSub] = useState(false);
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
            onSuccess: () => {
                setSub(false);
                onClose();
               
            },
            onError: () => {
                setSub(false);
                window.dispatchEvent(new CustomEvent("global-toast", { detail: { message: "Failed to create project.", type: "error" } }));
            },
        });
    };

    const statusOptions = [
        { value: "upcoming",  label: "Upcoming"  },
        { value: "active",    label: "Active"    },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    const inp = (err) => ({
        width: "100%", padding: "11px 13px", fontSize: 13, color: theme.text,
        background: theme.inputBg, border: `1px solid ${err ? "#fca5a5" : theme.inputBorder}`,
        borderRadius: 12, outline: "none", boxSizing: "border-box", transition: "all 0.15s",
        fontFamily: "inherit",
    });

    return (
        <div style={{ position: "fixed", inset: 0, background: theme.overlay,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(8px)", padding: 24 }}
            onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: theme.surface, borderRadius: 20, padding: 28,
                width: "100%", maxWidth: 460, boxShadow: theme.shadow,
                border: `1px solid ${theme.borderStrong}`,
                backdropFilter: "blur(20px)",
                animation: "modalIn 0.2s ease",
            }}>
                {/* Header */}
                <div style={{ padding: "22px 24px 20px", margin: "-28px -28px 24px -28px",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)",
                    borderRadius: "20px 20px 0 0",
                    position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(255,255,255,0.2), transparent 40%)", pointerEvents: "none" }} />
                    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Project Management</div>
                            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>New Project</h2>
                        </div>
                        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "all 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}>×</button>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Project Name */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: theme.textSoft, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Project Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input value={form.name} onChange={e => set("name", e.target.value)}
                            placeholder="e.g. CRM System v2" style={inp(errors.name)} />
                        {errors.name && <p style={{ fontSize: 10, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: theme.textSoft, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
                        <textarea value={form.description} onChange={e => set("description", e.target.value)}
                            placeholder="Brief description..." rows={2}
                            style={{ ...inp(false), resize: "vertical", minHeight: 70 }} />
                    </div>

                    {/* Status — PremiumSelect */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: theme.textSoft, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</label>
                        <PremiumSelect options={statusOptions} value={form.status} onChange={v => set("status", v)}
                            theme={theme} dark={dark} width="100%" minWidth={0} zIndex={600} />
                    </div>

                    {/* Dates */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[["Start Date", "start_date"], ["End Date", "end_date"]].map(([lbl, key]) => (
                            <div key={key}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textSoft, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                    {lbl} <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input type="date" value={form[key]} onChange={e => set(key, e.target.value)} style={inp(errors[key])} />
                                {errors[key] && <p style={{ fontSize: 10, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{errors[key]}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                    <button onClick={onClose} disabled={isSubmitting} style={{
                        flex: 1, padding: "12px", background: theme.surfaceSoft,
                        border: `1px solid ${theme.border}`, borderRadius: 12,
                        color: theme.textSoft, fontSize: 13, fontWeight: 700,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        fontFamily: "inherit", transition: "all 0.15s",
                        opacity: isSubmitting ? 0.5 : 1,
                    }}
                        onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = theme.surfaceSofter; }}
                        onMouseLeave={e => e.currentTarget.style.background = theme.surfaceSoft}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={isSubmitting} style={{
                        flex: 2, padding: "12px",
                        background: isSubmitting ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #3b82f6)",
                        border: "none", borderRadius: 12, color: "#fff",
                        fontSize: 13, fontWeight: 800,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        boxShadow: isSubmitting ? "none" : "0 6px 18px rgba(99,102,241,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        opacity: isSubmitting ? 0.8 : 1, transition: "all 0.15s",
                        fontFamily: "inherit",
                    }}>
                        {isSubmitting ? (
                            <>
                                <span style={{ display: "inline-block", width: 14, height: 14,
                                    border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
                                    borderRadius: "50%", animation: "adSpin 0.7s linear infinite" }} />
                                Creating…
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
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [selected, setSelected] = useState(null);
    const [search,   setSearch]   = useState("");
    const [wlFilter, setWlFilter] = useState("all");
    const [showNew,  setShowNew]  = useState(false);

    const filtered = users.filter(u => {
        const uKey = u.used_hours_per_day != null ? getWorkload(u.used_hours_per_day) : (u.workload || "free");
        return (u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase())) &&
               (wlFilter === "all" || uKey === wlFilter);
    });

    const liveProj       = projects.filter(p => p.status === "active").length;
    const upcoming       = projects.filter(p => ["active","upcoming"].includes(p.status));
    const totalCapacity  = users.length * 8;
    const totalUsed      = users.reduce((s, u) => s + (u.used_hours_per_day ?? 0), 0);
    const activePct      = totalCapacity > 0 ? Math.round(totalUsed / totalCapacity * 100) : 0;
    const availableCount = users.filter(u => (u.used_hours_per_day ?? 0) === 0).length;

    const stats = [
        { icon: "👥", val: users.length,    label: "Total Members",   sub: "Active employees",            color: theme.stat1c, bg: theme.stat1 },
        { icon: "✅", val: availableCount,   label: "Available",       sub: "0h assigned today",           color: theme.stat2c, bg: theme.stat2 },
        { icon: "🔥", val: `${activePct}%`, label: "Utilization",     sub: `${totalUsed}h / ${totalCapacity}h today`, color: theme.stat3c, bg: theme.stat3 },
        { icon: "🚀", val: liveProj,         label: "Active Projects", sub: "Currently running",           color: theme.stat4c, bg: theme.stat4 },
    ];

    return (
        <AppLayout title="Project Assignments">
            <Head title="Project Assignments" />
            <style>{`
                @keyframes adSpin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes modalIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                /* scrollbar hidden in member list */
                .ad-member-list::-webkit-scrollbar { display: none; }
                .ad-member-list { scrollbar-width: none; -ms-overflow-style: none; }
            `}</style>

            <div style={{ fontFamily: "inherit", minHeight: "100%" }}>

                {/* Top action bar */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 22 }}>
                    <button onClick={() => router.visit("/admin/projects")} style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "9px 16px", background: theme.surface,
                        border: `1px solid ${theme.border}`, borderRadius: 12,
                        color: theme.textSoft, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        boxShadow: theme.shadowSoft, transition: "all 0.15s", fontFamily: "inherit",
                        backdropFilter: "blur(10px)",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = theme.shadow; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = theme.shadowSoft; }}>
                        📁 All Projects
                    </button>
                    <button onClick={() => setShowNew(true)} style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "9px 18px",
                        background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                        border: "none", borderRadius: 12,
                        color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                        boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
                        transition: "all 0.15s", fontFamily: "inherit",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(99,102,241,0.45)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(99,102,241,0.35)"; }}>
                        + New Project
                    </button>
                </div>

                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{
                            background: theme.surface, borderRadius: 16,
                            padding: "16px 18px",
                            border: `1px solid ${theme.border}`,
                            boxShadow: theme.shadowSoft,
                            position: "relative", overflow: "hidden",
                            backdropFilter: "blur(16px)",
                        }}>
                            {/* Accent top bar */}
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
                                background: `linear-gradient(90deg, ${s.color}, ${s.color}66)`,
                                borderRadius: "16px 16px 0 0" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
                                    <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: "-0.04em" }}>{s.val}</div>
                                    <div style={{ fontSize: 10, color: theme.textMute, marginTop: 6 }}>{s.sub}</div>
                                </div>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg,
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                    {s.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main 2-col layout */}
                <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 18, alignItems: "start" }}>

                    {/* LEFT: member list */}
                    <div style={{
                        background: theme.surface, borderRadius: 16,
                        border: `1px solid ${theme.border}`,
                        boxShadow: theme.shadowSoft, overflow: "hidden",
                        backdropFilter: "blur(16px)",
                    }}>
                        <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${theme.border}` }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMute, marginBottom: 12,
                                textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Team Members
                            </div>
                            {/* Search */}
                            <div style={{ position: "relative", marginBottom: 10 }}>
                                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                                    fontSize: 12, color: theme.textMute, pointerEvents: "none" }}>🔍</span>
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search members…"
                                    style={{ width: "100%", padding: "8px 10px 8px 30px", fontSize: 12,
                                        color: theme.text, background: theme.inputBg,
                                        border: `1px solid ${theme.inputBorder}`, borderRadius: 10,
                                        outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                                        transition: "border 0.15s" }}
                                    onFocus={e => e.currentTarget.style.borderColor = theme.primary + "66"}
                                    onBlur={e => e.currentTarget.style.borderColor = theme.inputBorder}
                                />
                            </div>
                            {/* Workload filter */}
                            <FilterBar active={wlFilter} onChange={setWlFilter} theme={theme} dark={dark} />
                        </div>

                        <div style={{ padding: "6px 8px 4px 14px", fontSize: 10, color: theme.textMute, fontWeight: 600 }}>
                            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
                        </div>

                        {/* Member list — scrollbar hidden */}
                        <div className="ad-member-list" style={{ padding: "4px 6px 10px", maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
                            {filtered.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "36px 0", color: theme.textMute }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                                    <div style={{ fontSize: 12 }}>No members found</div>
                                </div>
                            ) : filtered.map(u => (
                                <MemberRow key={u.id} user={u}
                                    selected={selected?.id === u.id}
                                    onClick={u => setSelected(p => p?.id === u.id ? null : u)}
                                    theme={theme} dark={dark} />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: projects + detail */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* Projects section */}
                        <div style={{
                            background: theme.surface, borderRadius: 16,
                            border: `1px solid ${theme.border}`,
                            boxShadow: theme.shadowSoft, padding: "18px 20px",
                            backdropFilter: "blur(16px)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <span style={{ fontSize: 16 }}>🚀</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: theme.text, letterSpacing: "-0.01em" }}>Active & Upcoming</span>
                                <span style={{ fontSize: 10, fontWeight: 800, color: theme.primary,
                                    background: theme.primarySoft,
                                    border: `1px solid ${theme.primary}44`,
                                    padding: "2px 9px", borderRadius: 99 }}>{upcoming.length}</span>
                            </div>

                            {upcoming.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "32px 0", color: theme.textMute }}>
                                    <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                                    <div style={{ fontSize: 13, marginBottom: 16, fontWeight: 600, color: theme.textSoft }}>No active or upcoming projects</div>
                                    <button onClick={() => setShowNew(true)} style={{
                                        padding: "9px 18px",
                                        background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                                        border: "none", borderRadius: 10, color: "#fff",
                                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                                        boxShadow: "0 4px 14px rgba(99,102,241,0.3)", fontFamily: "inherit",
                                    }}>+ Create Project</button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                                    {upcoming.map(p => (
                                        <div key={p.id} style={{ width: 220, flexShrink: 0 }}>
                                            <ProjectCard project={p} theme={theme} dark={dark} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Member detail */}
                        {selected && <MemberDetail user={selected} onClose={() => setSelected(null)} theme={theme} dark={dark} />}
                    </div>
                </div>
            </div>

            {showNew && <NewProjectModal onClose={() => setShowNew(false)} theme={theme} dark={dark} />}
        </AppLayout>
    );
}