import { Head } from "@inertiajs/react";
import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Theme — vibeme-theme pattern
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
        surface:      "#0f1a32",
        surfaceSoft:  "rgba(255,255,255,0.04)",
        border:       "rgba(148,163,184,0.10)",
        borderStrong: "rgba(148,163,184,0.18)",
        text:         "#f1f5f9",
        textSoft:     "#94a3b8",
        textMute:     "#475569",
        shadow:       "0 24px 64px rgba(0,0,0,0.48)",
        shadowSoft:   "0 6px 20px rgba(0,0,0,0.32)",
        inputBg:      "rgba(255,255,255,0.04)",
        inputBorder:  "rgba(148,163,184,0.14)",
        rowHover:     "rgba(255,255,255,0.03)",
    };
    return {
        bg:           "#f4f7fb",
        surface:      "#ffffff",
        surfaceSoft:  "#f8fafc",
        border:       "rgba(15,23,42,0.08)",
        borderStrong: "rgba(15,23,42,0.14)",
        text:         "#0f172a",
        textSoft:     "#475569",
        textMute:     "#94a3b8",
        shadow:       "0 12px 40px rgba(15,23,42,0.10)",
        shadowSoft:   "0 4px 12px rgba(15,23,42,0.06)",
        inputBg:      "#ffffff",
        inputBorder:  "rgba(15,23,42,0.12)",
        rowHover:     "#f8fafc",
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Time slot logic
// ─────────────────────────────────────────────────────────────────────────────
function toMins(t) {
    const [h, m] = (t || "00:00").split(":").map(Number);
    return h * 60 + m;
}
function fromMins(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
function fmt12(t) {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

/**
 * Compute time blocks for a given priority project, given that earlier-priority
 * projects have already consumed some hours from the start of the day.
 *
 * usedHours = total hours already allocated to higher-priority projects this day
 * hoursPerDay = hours for THIS project
 * workStart, lunchStart, lunchEnd = from SalaryRule (strings "HH:MM")
 *
 * Algorithm:
 *   1. Start offset = usedHours already consumed → find real clock time
 *      (skipping lunch if lunch falls in the gap)
 *   2. Allocate hoursPerDay minutes from that clock time
 *   3. Split blocks around lunch break
 *
 * Returns: { slots: [{from, to}], lunchInside: bool }
 */
function computeSlotsForProject(workStart, usedHours, hoursPerDay, lunchStart, lunchEnd) {
    if (!workStart || hoursPerDay == null) return { slots: null, lunchInside: false };

    const wsM  = toMins(workStart);
    const lsM  = toMins(lunchStart || "12:00");
    const leM  = toMins(lunchEnd   || "13:00");
    const lDur = Math.max(0, leM - lsM);       // lunch duration in minutes
    const wM   = hoursPerDay * 60;             // minutes we need to fill

    // --- Step 1: where does this project START (clock time)?
    // Walk from workStart, skipping lunch if needed
    let startClock = wsM;
    let remaining  = usedHours * 60; // minutes of prior projects to skip

    if (remaining > 0) {
        // morning capacity (before lunch)
        const morningCap = Math.max(0, lsM - wsM);
        if (remaining <= morningCap) {
            startClock = wsM + remaining;
        } else {
            // used up all morning, cross lunch, continue afternoon
            remaining -= morningCap;
            startClock = leM + remaining;
        }
    }

    // --- Step 2: allocate wM minutes from startClock, splitting around lunch ---
    const slots = [];
    let allocated = 0;
    let cursor    = startClock;
    let lunchInside = false;

    while (allocated < wM) {
        const need = wM - allocated;

        // If cursor is inside lunch → jump to lunch end
        if (cursor >= lsM && cursor < leM) {
            cursor = leM;
            continue;
        }

        // How much can we fill before next boundary?
        // Boundary is either lunchStart (if we haven't passed it) or EOD
        let boundary;
        if (cursor < lsM) {
            boundary = lsM;          // stop at lunch start
        } else {
            boundary = cursor + need; // no more lunch in the way
        }

        const canFill = Math.min(boundary - cursor, need);
        slots.push({ from: fromMins(cursor), to: fromMins(cursor + canFill) });
        allocated += canFill;
        cursor    += canFill;

        // If we just hit lunchStart → mark lunch break inside & skip
        if (cursor === lsM && allocated < wM) {
            lunchInside = true;
            cursor      = leM;
        }
    }

    return { slots, lunchInside };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
    active:    { label: "Active",    color: "#16a34a", bg: "#dcfce7", bgDark: "rgba(22,163,74,0.13)",   border: "#bbf7d0", borderDark: "rgba(22,163,74,0.22)" },
    upcoming:  { label: "Upcoming",  color: "#2563eb", bg: "#dbeafe", bgDark: "rgba(37,99,235,0.13)",   border: "#bfdbfe", borderDark: "rgba(37,99,235,0.22)" },
    completed: { label: "Completed", color: "#7c3aed", bg: "#ede9fe", bgDark: "rgba(124,58,237,0.13)",  border: "#ddd6fe", borderDark: "rgba(124,58,237,0.22)" },
    removed:   { label: "Removed",   color: "#6b7280", bg: "#f3f4f6", bgDark: "rgba(107,114,128,0.13)", border: "#e5e7eb", borderDark: "rgba(107,114,128,0.22)" },
};

const WL_CFG = {
    free: { label: "FREE", color: "#16a34a", bg: "#dcfce7", bgDark: "rgba(22,163,74,0.14)", bar: "#16a34a" },
    "2h": { label: "2H",   color: "#2563eb", bg: "#dbeafe", bgDark: "rgba(37,99,235,0.14)", bar: "#2563eb" },
    "4h": { label: "4H",   color: "#f59e0b", bg: "#fef3c7", bgDark: "rgba(245,158,11,0.14)",bar: "#f59e0b" },
    "6h": { label: "6H",   color: "#f97316", bg: "#ffedd5", bgDark: "rgba(249,115,22,0.14)",bar: "#f97316" },
    full: { label: "FULL", color: "#dc2626", bg: "#fee2e2", bgDark: "rgba(220,38,38,0.14)", bar: "#dc2626" },
};

function wlKey(h) {
    if (!h || h === 0) return "free";
    if (h <= 2) return "2h";
    if (h <= 4) return "4h";
    if (h <= 6) return "6h";
    return "full";
}

function fmtShort(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function daysLeft(endDate, status) {
    if (status === "completed" || status === "removed") return null;
    const diff = Math.ceil((new Date(endDate) - new Date()) / 864e5);
    if (diff < 0)   return { label: "Ended",        color: "#94a3b8" };
    if (diff === 0) return { label: "Ends today",   color: "#dc2626" };
    if (diff <= 7)  return { label: `${diff}d left`, color: "#dc2626" };
    if (diff <= 30) return { label: `${diff}d left`, color: "#f59e0b" };
    return               { label: `${diff}d left`,   color: "#64748b" };
}

function progPct(start, end) {
    const s = new Date(start).getTime(), e = new Date(end).getTime(), n = Date.now();
    if (n <= s) return 0; if (n >= e) return 100;
    return Math.round(((n - s) / (e - s)) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, url, size = 36 }) {
    const COLS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#8b5cf6","#ec4899","#14b8a6"];
    const bg   = COLS[(name || "").charCodeAt(0) % COLS.length];
    const ini  = (name || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
    // DB မှာ "user/filename.jpg" သာ သိမ်းထားတာ → /storage/ prefix ထည့်ရမယ်
    // Leave/Index.jsx pattern: `/storage/${req.user.avatar_url}`
    const src  = url ? (url.startsWith("http") ? url : `/storage/${url}`) : null;
    if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1.5px solid rgba(15,23,42,0.08)" }} />;
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            {ini}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TimeSlotDisplay — shows "8:00 AM – 12:00 PM  [LUNCH]  1:00 PM – 5:00 PM"
// lunchInside = whether lunch break splits the slots
// ─────────────────────────────────────────────────────────────────────────────
function TimeSlotDisplay({ slots, lunchInside, dark }) {
    if (!slots || slots.length === 0) return null;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            {slots.map((s, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {/* Lunch break badge between blocks — only if lunch actually interrupts */}
                    {i > 0 && lunchInside && (
                        <span style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                            color: dark ? "#fbbf24" : "#92400e",
                            background: dark ? "rgba(251,191,36,0.15)" : "#fef9c3",
                            border: dark ? "1px solid rgba(251,191,36,0.28)" : "1px solid #fde68a",
                            padding: "2px 7px", borderRadius: 6,
                        }}>LUNCH</span>
                    )}
                    <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.01em",
                        fontVariantNumeric: "tabular-nums",
                        color: dark ? "#93c5fd" : "#1e40af",
                        background: dark ? "rgba(37,99,235,0.14)" : "#eff6ff",
                        border: dark ? "1px solid rgba(37,99,235,0.26)" : "1px solid #bfdbfe",
                        padding: "3px 10px", borderRadius: 8,
                    }}>
                        {fmt12(s.from)} – {fmt12(s.to)}
                    </span>
                </span>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AssignmentCard
// usedHours = hours already occupied by higher-priority projects (same employee)
// ─────────────────────────────────────────────────────────────────────────────
function AssignmentCard({ a, dark, theme, countryConfig, usedHours = 0 }) {
    const st  = STATUS_CFG[a.status] || STATUS_CFG.active;
    const dl  = daysLeft(a.end_date, a.status);
    const p   = progPct(a.start_date, a.end_date);
    const d   = Math.max(0, Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 864e5));
    const hpd = a.hours_per_day || 8;

    const { slots, lunchInside } = useMemo(() => computeSlotsForProject(
        countryConfig?.work_start  || "08:00",
        usedHours,
        hpd,
        countryConfig?.lunch_start || "12:00",
        countryConfig?.lunch_end   || "13:00",
    ), [countryConfig, usedHours, hpd]);

    return (
        <div
            style={{
                background: dark ? theme.surface : "#ffffff",
                border: `1px solid ${dark ? theme.border : st.border}`,
                borderRadius: 14, overflow: "hidden",
                boxShadow: dark ? theme.shadowSoft : `0 2px 10px ${st.color}18`,
                transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = dark ? "0 10px 36px rgba(0,0,0,0.44)" : `0 8px 24px ${st.color}28`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = dark ? theme.shadowSoft : `0 2px 10px ${st.color}18`; }}
        >
            {/* Top accent */}
            <div style={{ height: 3, background: st.color, opacity: a.status === "active" ? 1 : 0.45 }} />

            <div style={{ padding: "16px 18px" }}>
                {/* Header: project name + status */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 11 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: theme.text, lineHeight: 1.35, flex: 1, letterSpacing: "-0.01em" }}>
                        {a.project?.name || "—"}
                    </span>
                    <span style={{
                        fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em",
                        color: st.color,
                        background: dark ? st.bgDark : st.bg,
                        border: `1px solid ${dark ? st.borderDark : st.border}`,
                        padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0,
                    }}>{st.label}</span>
                </div>

                {/* Time slots only (no P1/P2 badge) */}
                <div style={{ marginBottom: 13 }}>
                    <TimeSlotDisplay slots={slots} lunchInside={lunchInside} dark={dark} />
                </div>

                {/* Date + total grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                        { lbl: "START", val: fmtShort(a.start_date) },
                        { lbl: "END",   val: fmtShort(a.end_date)   },
                        { lbl: "TOTAL", val: `~${(d * hpd).toLocaleString()}h` },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: dark ? theme.surfaceSoft : "#f8fafc",
                            border: `1px solid ${dark ? theme.border : "#f1f5f9"}`,
                            borderRadius: 9, padding: "8px 10px",
                        }}>
                            <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.textMute, marginBottom: 3 }}>{item.lbl}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textSoft }}>{item.val}</div>
                        </div>
                    ))}
                </div>

                {/* Progress */}
                {(a.status === "active" || a.status === "upcoming") && (
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMute }}>Progress</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: st.color }}>{p}%</span>
                        </div>
                        <div style={{ height: 5, background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", borderRadius: 99 }}>
                            <div style={{ height: "100%", width: `${p}%`, background: `linear-gradient(90deg,${st.color}aa,${st.color})`, borderRadius: 99, transition: "width 0.4s" }} />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${dark ? theme.border : "#f1f5f9"}` }}>
                    <span style={{ fontSize: 11, color: theme.textMute }}>{d} days · {hpd}h/day</span>
                    {dl && <span style={{ fontSize: 11, fontWeight: 800, color: dl.color }}>{dl.label}</span>}
                </div>

                {/* Notes */}
                {a.notes && (
                    <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 9,
                        background: dark ? "rgba(245,158,11,0.10)" : "#fffbeb",
                        border: dark ? "1px solid rgba(245,158,11,0.22)" : "1px solid #fde68a" }}>
                        <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: dark ? "#fbbf24" : "#92400e", marginBottom: 3 }}>NOTE</div>
                        <div style={{ fontSize: 11, color: dark ? "#fcd34d" : "#78350f", lineHeight: 1.5 }}>{a.notes}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter Pills
// ─────────────────────────────────────────────────────────────────────────────
function FilterPills({ value, onChange, dark, theme }) {
    return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
                { k: "all",  l: "ALL"  },
                { k: "free", l: "FREE" },
                { k: "2h",   l: "2H"   },
                { k: "4h",   l: "4H"   },
                { k: "6h",   l: "6H"   },
                { k: "full", l: "FULL" },
            ].map(({ k, l }) => {
                const active = value === k;
                return (
                    <button key={k} onClick={() => onChange(k)} style={{
                        padding: "5px 14px", borderRadius: 99,
                        fontSize: 11, fontWeight: 800, letterSpacing: "0.06em",
                        border: active
                            ? `2px solid ${dark ? "rgba(99,102,241,0.55)" : "#818cf8"}`
                            : `2px solid ${dark ? theme.border : "#e2e8f0"}`,
                        background: active
                            ? (dark ? "rgba(99,102,241,0.20)" : "#eef2ff")
                            : (dark ? theme.surfaceSoft : "#ffffff"),
                        color: active ? (dark ? "#a5b4fc" : "#4f46e5") : theme.textSoft,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.12s", outline: "none",
                    }}>{l}</button>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MemberCountBadge — ❸ nice member count display
// ─────────────────────────────────────────────────────────────────────────────
function MemberCountBadge({ count, dark, theme }) {
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            {/* Number bubble */}
            <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: dark ? "rgba(99,102,241,0.22)" : "#eef2ff",
                border: dark ? "1px solid rgba(99,102,241,0.38)" : "1px solid #c7d2fe",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900, color: dark ? "#a5b4fc" : "#4f46e5",
            }}>{count}</div>
            {/* Label */}
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.textMute, letterSpacing: "0.02em" }}>
                member{count !== 1 ? "s" : ""}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeRow — collapsible, with priority-aware time slots per card
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeRow({ group, defaultOpen, dark, theme, countryConfig }) {
    const [open, setOpen] = useState(defaultOpen);
    const wk = wlKey(group.total_hours_per_day);
    const wl = WL_CFG[wk];
    const activeCount   = group.assignments.filter(a => a.status === "active").length;
    const upcomingCount = group.assignments.filter(a => a.status === "upcoming").length;

    // Sort by priority for display + time slot calculation
    const sorted = useMemo(() =>
        [...group.assignments].sort((a, b) => (a.priority_order || 99) - (b.priority_order || 99)),
        [group.assignments]
    );

    // Accumulate usedHours per priority position (only active/upcoming count toward slots)
    const sortedWithUsed = useMemo(() => {
        let used = 0;
        return sorted.map(a => {
            const usedHours = used;
            if (a.status === "active" || a.status === "upcoming") {
                used += (a.hours_per_day || 0);
            }
            return { ...a, usedHours };
        });
    }, [sorted]);

    return (
        <div style={{
            background: dark ? theme.surface : "#ffffff",
            border: `1px solid ${dark ? theme.border : "rgba(15,23,42,0.08)"}`,
            borderRadius: 16, overflow: "hidden",
            boxShadow: dark ? theme.shadowSoft : "0 2px 8px rgba(15,23,42,0.06)",
            marginBottom: 12,
        }}>
            {/* Header */}
            <div
                onClick={() => setOpen(v => !v)}
                style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                    cursor: "pointer",
                    background: open ? (dark ? theme.surfaceSoft : "#f8fafc") : "transparent",
                    borderBottom: open ? `1px solid ${dark ? theme.border : "#f1f5f9"}` : "none",
                    transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!open) e.currentTarget.style.background = dark ? theme.rowHover : "#fafbff"; }}
                onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
            >
                <Avatar name={group.user.name} url={group.user.avatar_url} size={42} />

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: theme.text, letterSpacing: "-0.01em" }}>{group.user.name}</span>
                        {group.user.role === "management" && (
                            <span style={{
                                fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em",
                                color: dark ? "#93c5fd" : "#2563eb",
                                background: dark ? "rgba(37,99,235,0.15)" : "#dbeafe",
                                border: dark ? "1px solid rgba(37,99,235,0.28)" : "1px solid #bfdbfe",
                                padding: "2px 8px", borderRadius: 99,
                            }}>Mgmt</span>
                        )}
                    </div>
                    {(group.user.position || group.user.department) && (
                        <div style={{ fontSize: 12, color: theme.textSoft, marginTop: 2 }}>
                            {[group.user.position, group.user.department].filter(Boolean).join(" · ")}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {/* Capacity bar */}
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: theme.textMute, marginBottom: 4 }}>H/DAY</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 60, height: 5, background: dark ? "rgba(255,255,255,0.07)" : "#f1f5f9", borderRadius: 99 }}>
                                <div style={{ height: "100%", width: `${Math.min(100,(group.total_hours_per_day/8)*100)}%`, background: `linear-gradient(90deg,${wl.bar}88,${wl.bar})`, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: wl.color }}>{group.total_hours_per_day}h</span>
                        </div>
                    </div>

                    {/* Workload pill */}
                    <span style={{
                        fontSize: 10, fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase",
                        color: wl.color, background: dark ? wl.bgDark : wl.bg,
                        border: `1px solid ${wl.color}40`, padding: "4px 12px", borderRadius: 99,
                    }}>{wl.label}</span>

                    {/* Active/upcoming counts */}
                    <div style={{ display: "flex", gap: 5 }}>
                        {activeCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: dark ? "rgba(22,163,74,0.14)" : "#dcfce7", border: dark ? "1px solid rgba(22,163,74,0.28)" : "1px solid #bbf7d0", padding: "3px 9px", borderRadius: 99 }}>{activeCount} active</span>
                        )}
                        {upcomingCount > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", background: dark ? "rgba(37,99,235,0.14)" : "#dbeafe", border: dark ? "1px solid rgba(37,99,235,0.28)" : "1px solid #bfdbfe", padding: "3px 9px", borderRadius: 99 }}>{upcomingCount} upcoming</span>
                        )}
                        {activeCount === 0 && upcomingCount === 0 && (
                            <span style={{ fontSize: 10, color: theme.textMute }}>No active</span>
                        )}
                    </div>

                    {/* Chevron */}
                    <div style={{ color: theme.textMute, transition: "transform 0.22s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
            </div>

            {/* Expanded assignments — priority ordered, each knows its usedHours */}
            {open && (
                <div style={{ padding: "16px 20px" }}>
                    {sortedWithUsed.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMute }}>
                            <div style={{ fontSize: 30, marginBottom: 8 }}>📋</div>
                            <div style={{ fontSize: 13 }}>No assignments</div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                            {sortedWithUsed.map(a => (
                                <AssignmentCard
                                    key={a.id}
                                    a={a}
                                    dark={dark}
                                    theme={theme}
                                    countryConfig={countryConfig}
                                    usedHours={a.usedHours}   // ← priority-offset hours
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Management View
// ─────────────────────────────────────────────────────────────────────────────
function ManagementView({ groupedUsers, dark, theme, countryConfig }) {
    const [search,    setSearch]    = useState("");
    const [filterWl,  setFilterWl]  = useState("all");
    const [expandAll, setExpandAll] = useState(false);

    const filtered = useMemo(() => groupedUsers.filter(g => {
        const q  = search.toLowerCase();
        const ms = !q || g.user.name.toLowerCase().includes(q) || (g.user.position || "").toLowerCase().includes(q) || (g.user.department || "").toLowerCase().includes(q);
        const mw = filterWl === "all" || wlKey(g.total_hours_per_day) === filterWl;
        return ms && mw;
    }), [groupedUsers, search, filterWl]);

    const N     = groupedUsers.length;
    const onA   = groupedUsers.filter(g => g.active_count > 0).length;
    const freeN = groupedUsers.filter(g => g.total_hours_per_day === 0).length;
    const fullN = groupedUsers.filter(g => g.total_hours_per_day >= 8).length;

    const STATS = [
        { lbl: "Team Members",  val: N,     c: "#6366f1", bd: "rgba(99,102,241,0.14)",  bl: "#eef2ff", br: "rgba(99,102,241,0.25)" },
        { lbl: "On Active Work",val: onA,   c: "#16a34a", bd: "rgba(22,163,74,0.14)",   bl: "#dcfce7", br: "rgba(22,163,74,0.25)" },
        { lbl: "Available",     val: freeN, c: "#2563eb", bd: "rgba(37,99,235,0.14)",   bl: "#dbeafe", br: "rgba(37,99,235,0.25)" },
        { lbl: "Fully Booked",  val: fullN, c: "#dc2626", bd: "rgba(220,38,38,0.14)",   bl: "#fee2e2", br: "rgba(220,38,38,0.25)" },
    ];

    return (
        <div>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{ background: dark ? s.bd : s.bl, border: `1px solid ${s.br}`, borderRadius: 14, padding: "18px 20px" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: s.c, marginTop: 5, fontWeight: 700, opacity: 0.85 }}>{s.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Search + filter row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: theme.textMute, pointerEvents: "none" }}
                        width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search members..."
                        style={{ width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: 12, height: 38, border: `1.5px solid ${dark ? theme.inputBorder : "#e2e8f0"}`, borderRadius: 10, fontSize: 13, outline: "none", background: dark ? theme.inputBg : "#fff", color: theme.text, fontFamily: "inherit" }}
                        onFocus={e => e.target.style.borderColor = dark ? "rgba(99,102,241,0.6)" : "#818cf8"}
                        onBlur={e  => e.target.style.borderColor = dark ? theme.inputBorder : "#e2e8f0"}
                    />
                </div>
                <FilterPills value={filterWl} onChange={setFilterWl} dark={dark} theme={theme} />
               
            </div>

            {/* ③ Member count — nice badge */}
            <MemberCountBadge count={filtered.length} dark={dark} theme={theme} />

            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "64px 0", color: theme.textMute }}>
                    <div style={{ fontSize: 38, marginBottom: 10 }}>🔍</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>No members match</div>
                </div>
            ) : filtered.map(g => (
                <EmployeeRow key={g.user.id} group={g} defaultOpen={expandAll} dark={dark} theme={theme} countryConfig={countryConfig} />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Self View — priority-sorted, each card knows its usedHours
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeSelfView({ assignments, dark, theme, countryConfig }) {
    const active    = assignments.filter(a => a.status === "active");
    const upcoming  = assignments.filter(a => a.status === "upcoming");
    const completed = assignments.filter(a => a.status === "completed");
    const totalHPD  = active.reduce((s, a) => s + (a.hours_per_day || 0), 0);

    // Sort active by priority, compute usedHours offsets
    const activeSorted = useMemo(() => {
        const sorted = [...active].sort((a, b) => (a.priority_order || 99) - (b.priority_order || 99));
        let used = 0;
        return sorted.map(a => {
            const usedHours = used;
            used += (a.hours_per_day || 0);
            return { ...a, usedHours };
        });
    }, [active]);

    // Upcoming sorted by priority (continues after active hours)
    const upcomingSorted = useMemo(() => {
        const sorted = [...upcoming].sort((a, b) => (a.priority_order || 99) - (b.priority_order || 99));
        let used = totalHPD; // upcoming slots continue after all active
        return sorted.map(a => {
            const usedHours = used;
            used += (a.hours_per_day || 0);
            return { ...a, usedHours };
        });
    }, [upcoming, totalHPD]);

    const STATS = [
        { lbl: "Active",       val: active.length,    c: "#16a34a", bd: "rgba(22,163,74,0.14)",   bl: "#dcfce7", br: "rgba(22,163,74,0.25)" },
        { lbl: "Upcoming",     val: upcoming.length,  c: "#2563eb", bd: "rgba(37,99,235,0.14)",   bl: "#dbeafe", br: "rgba(37,99,235,0.25)" },
        { lbl: "Completed",    val: completed.length, c: "#7c3aed", bd: "rgba(124,58,237,0.14)",  bl: "#ede9fe", br: "rgba(124,58,237,0.25)" },
        { lbl: "Hours/Day",    val: `${totalHPD}h`,   c: "#d97706", bd: "rgba(217,119,6,0.14)",   bl: "#fef3c7", br: "rgba(217,119,6,0.25)" },
    ];

    const Section = ({ label, color, items, dim }) => items.length === 0 ? null : (
        <section style={{ opacity: dim ? 0.65 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 0 3px ${color}28` }} />
                <h2 style={{ fontSize: 11, fontWeight: 900, color, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                    {label} ({items.length})
                </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                {items.map(a => (
                    <AssignmentCard key={a.id} a={a} dark={dark} theme={theme} countryConfig={countryConfig} usedHours={a.usedHours || 0} />
                ))}
            </div>
        </section>
    );

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{ background: dark ? s.bd : s.bl, border: `1px solid ${s.br}`, borderRadius: 14, padding: "18px 20px" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: s.c, marginTop: 5, fontWeight: 700, opacity: 0.85 }}>{s.lbl}</div>
                    </div>
                ))}
            </div>

            {assignments.length === 0 ? (
                <div style={{ background: dark ? theme.surface : "#fff", border: `1px solid ${dark ? theme.border : "rgba(15,23,42,0.08)"}`, borderRadius: 16, padding: "80px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 42, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 15, color: theme.textSoft, fontWeight: 600 }}>No assignments yet</div>
                    <div style={{ fontSize: 12, color: theme.textMute, marginTop: 5 }}>You'll be notified when a project is assigned</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <Section label="Active"    color="#16a34a" items={activeSorted}   />
                    <Section label="Upcoming"  color="#2563eb" items={upcomingSorted} />
                    <Section label="Completed" color="#7c3aed" items={completed.map(a => ({ ...a, usedHours: 0 }))} dim />
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Export
// ─────────────────────────────────────────────────────────────────────────────
export default function MyAssignments({
    assignments   = [],
    groupedUsers  = [],
    isManagement  = false,
    authUserName  = "",
    countryConfig = null,
}) {
    const dark  = useReactiveTheme();
    const theme = getTheme(dark);

    // ① No double page wrapper — AppLayout already provides its own bg
    // ② Title logic: management sees username only (not "Team Assignments" again)
    const pageTitle = isManagement ? "Team Assignments" : "My Assignments";
    const subtitle  = isManagement
        ? `${authUserName} · Overview of all assigned team members`
        : `${authUserName} · Your current project assignments`;

    return (
        <AppLayout title={pageTitle}>
            <Head title={pageTitle} />
            <style>{`
                @keyframes ma-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
                .ma-root { animation: ma-up 0.22s ease; }
            `}</style>

            {/* Single layer */}
            <div className="ma-root" style={{ minHeight: "100%" }}>

                {/* Premium header */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <span style={{
                            fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em",
                            color: dark ? "#818cf8" : "#4f46e5",
                            lineHeight: 1.15,
                        }}>{authUserName}</span>

                        <span style={{
                            fontSize: 20, fontWeight: 900,
                            color: dark ? "rgba(148,163,184,0.28)" : "rgba(15,23,42,0.16)",
                        }}>·</span>

                        <span style={{
                            fontSize: 15, fontWeight: 500,
                            color: theme.textMute,
                            lineHeight: 1.4,
                        }}>
                            {isManagement ? "Overview of all assigned team members" : "Your current project assignments"}
                        </span>
                    </div>

                    <div style={{
                        marginTop: 10, height: 2, width: 48, borderRadius: 99,
                        background: dark
                            ? "linear-gradient(90deg,#818cf8,#6366f1aa)"
                            : "linear-gradient(90deg,#6366f1,#818cf8aa)",
                    }} />
                </div>

                {isManagement
                    ? <ManagementView groupedUsers={groupedUsers} dark={dark} theme={theme} countryConfig={countryConfig} />
                    : <EmployeeSelfView assignments={assignments} dark={dark} theme={theme} countryConfig={countryConfig} />}
            </div>
        </AppLayout>
    );
}