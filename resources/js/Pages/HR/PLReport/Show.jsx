import { useState, useMemo, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from "recharts";

// ── Theme ─────────────────────────────────────────────────────────────────────
function useTheme() {
    const get = () => typeof window !== "undefined" &&
        (document.documentElement.getAttribute("data-theme") === "dark" ||
            localStorage.getItem("vibeme-theme") === "dark");
    const [dark, setDark] = useState(get);
    useEffect(() => {
        const s = () => setDark(get());
        window.addEventListener("vibeme-theme-change", s);
        window.addEventListener("storage", s);
        return () => {
            window.removeEventListener("vibeme-theme-change", s);
            window.removeEventListener("storage", s);
        };
    }, []);
    return dark;
}

const T = (dark) => dark ? {
    surface: "rgba(15,26,50,0.95)", soft: "rgba(255,255,255,0.04)",
    border: "rgba(148,163,184,0.10)", borderMd: "rgba(148,163,184,0.20)",
    text: "#f1f5f9", textSoft: "#94a3b8", textMute: "#475569",
    shadow: "0 1px 6px rgba(0,0,0,0.25)",
    primary: "#6366f1", primarySoft: "rgba(99,102,241,0.18)",
    success: "#10b981", successSoft: "rgba(16,185,129,0.14)",
    warning: "#f59e0b", warningSoft: "rgba(245,158,11,0.14)",
    danger: "#ef4444", dangerSoft: "rgba(239,68,68,0.14)",
    grid: "rgba(148,163,184,0.08)",
} : {
    surface: "#fff", soft: "rgba(15,23,42,0.03)",
    border: "rgba(15,23,42,0.09)", borderMd: "rgba(15,23,42,0.16)",
    text: "#0f172a", textSoft: "#475569", textMute: "#94a3b8",
    shadow: "0 1px 6px rgba(15,23,42,0.07)",
    primary: "#6366f1", primarySoft: "rgba(99,102,241,0.10)",
    success: "#059669", successSoft: "rgba(5,150,105,0.08)",
    warning: "#d97706", warningSoft: "rgba(217,119,6,0.08)",
    danger: "#dc2626", dangerSoft: "rgba(220,38,38,0.08)",
    grid: "rgba(15,23,42,0.06)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n, cur = "USD") => n == null ? "—" :
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

const fmtK = (n) => {
    if (n == null) return "—";
    const abs = Math.abs(n);
    if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${Math.round(n)}`;
};

const initials = (name) =>
    (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

const P_COLORS = {
    1: { bg: "#EEEDFE", color: "#534AB7" },
    2: { bg: "#E1F5EE", color: "#0F6E56" },
    3: { bg: "#E6F1FB", color: "#0C447C" },
};

const STATUS_STYLE = {
    active:    { bg: "#E1F5EE", color: "#0F6E56" },
    upcoming:  { bg: "#EEEDFE", color: "#534AB7" },
    completed: { bg: "rgba(148,163,184,0.15)", color: "#475569" },
};

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label, currency }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#1e293b", border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 10, padding: "9px 13px", fontSize: 11,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)", pointerEvents: "none",
        }}>
            <div style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: 5 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: p.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ color: "#94a3b8" }}>{p.name}:</span>
                    <span style={{ color: "#f1f5f9", fontWeight: 500 }}>{fmt(p.value, currency)}</span>
                </div>
            ))}
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, color, t }) {
    return (
        <div style={{
            background: t.soft, borderRadius: 10,
            padding: "12px 14px", flex: 1, minWidth: 110,
        }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: t.textMute, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
                {label}
            </div>
            <div style={{ fontSize: 19, fontWeight: 500, color }}>{value}</div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PLReportShow({
    project = {},
    months = [],
    overallPL = {},
    latestMonth = null,
    filter = {},  
}) {
    const dark = useTheme();
    const t    = useMemo(() => T(dark), [dark]);
    const cur  = project?.currency ?? "USD";

    const isProfit  = (overallPL.profit ?? 0) >= 0;
    const profitClr = isProfit ? t.success : t.danger;

    const [selIdx, setSelIdx] = useState(months.length > 0 ? months.length - 1 : 0);
    const selMonth = months[selIdx] ?? latestMonth;

    const trendData = months.map(m => ({
        label:    m.label,
        Revenue:  m.revenue,
        Cost:     m.total_cost,
        Profit:   m.profit,
    }));

    const stSt = STATUS_STYLE[project.status] ?? STATUS_STYLE.completed;

    if (!project?.id) {
        return (
            <AppLayout title="P&L Report">
                <Head title="P&L" />
                <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: "48px 20px", textAlign: "center", color: t.textMute, fontSize: 13 }}>
                    Project not found.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={`P&L — ${project.name}`}>
            <Head title={`P&L — ${project.name}`} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 80 }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                    {/* Row 1 — Back button */}
                    <div>
                        <button
                            onClick={() => router.get("/hr/pl-report", {
                                from_year:  filter?.fromYear,
                                from_month: filter?.fromMonth,
                                to_year:    filter?.toYear,
                                to_month:   filter?.toMonth,
                            })}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                border: "none", background: "transparent",
                                color: t.textMute, fontSize: 12, fontWeight: 500,
                                cursor: "pointer", outline: "none", padding: "2px 0",
                                transition: "color 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = t.primary}
                            onMouseLeave={e => e.currentTarget.style.color = t.textMute}
                        >
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Back
                        </button>
                    </div>

                    {/* Row 2 — Project card */}
                    <div style={{
                        background: t.surface, border: `0.5px solid ${t.border}`,
                        borderRadius: 12, padding: "16px 20px", boxShadow: t.shadow,
                        display: "flex", alignItems: "center", gap: 16,
                    }}>
                        {/* Left accent bar */}
                        <div style={{
                            width: 4, height: 44, borderRadius: 99,
                            background: stSt.color, flexShrink: 0,
                        }} />

                        {/* Project info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                                <h1 style={{ fontSize: 18, fontWeight: 500, color: t.text, margin: 0 }}>
                                    {project.name}
                                </h1>
                                <span style={{
                                    fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
                                    background: stSt.bg, color: stSt.color,
                                    textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
                                }}>
                                    {project.status}
                                </span>
                            </div>
                            {/* Meta Info Pills — REPLACE ဒီ section တစ်ခုကိုပဲ */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                                marginTop: 6,
                            }}>
                                {/* ── Date pill ── */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "5px 11px", borderRadius: 8,
                                    background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                    border: `1px solid ${dark ? "rgba(148,163,184,0.14)" : "rgba(15,23,42,0.10)"}`,
                                }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M8 2V5M16 2V5M3 9H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z"
                                            stroke={t.textMute}
                                            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: t.textSoft }}>
                                        {project.start_date} → {project.end_date ?? "Ongoing"}
                                    </span>
                                </div>

                                {/* ── Contract pill ── */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "5px 11px", borderRadius: 8,
                                    background: dark ? "rgba(99,102,241,0.12)" : "#eef2ff",
                                    border: `1px solid ${dark ? "rgba(99,102,241,0.25)" : "#c7d2fe"}`,
                                }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 1V23M17 5H9.5C8.11929 5 7 6.11929 7 7.5C7 8.88071 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5C17 13.8807 15.8807 15 14.5 15H7M12 15V19"
                                            stroke={dark ? "#818cf8" : "#4f46e5"}
                                            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span style={{ fontSize: 12, color: dark ? "#a5b4fc" : "#4338ca" }}>Contract:</span>
                                    <strong style={{ fontSize: 12, fontWeight: 700, color: dark ? "#e0e7ff" : "#1e1b4b" }}>
                                        {fmt(project.contract_value, cur)}
                                    </strong>
                                </div>

                                {/* ── Confirmed months pill ── */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 7,
                                    padding: "5px 11px", borderRadius: 8,
                                    background: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
                                    border: `1px solid ${dark ? "rgba(16,185,129,0.25)" : "#a7f3d0"}`,
                                }}>
                                    <div style={{
                                        minWidth: 18, height: 18, borderRadius: "50%",
                                        background: dark ? "#059669" : "#10b981",
                                        color: "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 800,
                                    }}>
                                        {months.length}
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: dark ? "#6ee7b7" : "#065f46" }}>
                                        Confirmed month{months.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        
                    </div>
                </div>

                {months.length === 0 ? (
                    <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: "48px 20px", textAlign: "center", color: t.textMute, fontSize: 13 }}>
                        No confirmed payroll data yet for this project.
                    </div>
                ) : (
                    <>
                        {/* ── KPI Row ── */}
                        <div style={{
                            background: t.surface, border: `0.5px solid ${t.border}`,
                            borderRadius: 12, padding: "14px 16px", boxShadow: t.shadow,
                            display: "flex", gap: 10, flexWrap: "wrap",
                        }}>
                            <KPI label="Total Revenue"  value={fmt(overallPL.revenue, cur)}     color="#534AB7"   t={t} />
                            <KPI label="Salary Cost"    value={fmt(overallPL.salary_cost, cur)} color="#7F77DD"   t={t} />
                            <KPI label="OT Cost"        value={fmt(overallPL.ot_cost, cur)}     color={t.warning} t={t} />
                            <KPI label="Leave Cost"     value={fmt(overallPL.leave_cost, cur)}  color={t.success} t={t} />
                            <KPI
                                label={isProfit ? "Net Profit" : "Net Loss"}
                                value={`${isProfit ? "+" : ""}${fmt(overallPL.profit, cur)}`}
                                color={profitClr} t={t}
                            />
                        </div>

                        {/* ── Row 2: Monthly breakdown + Trend chart ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                            {/* Monthly breakdown */}
                            <div style={{
                                background: t.surface, border: `0.5px solid ${t.border}`,
                                borderRadius: 12, overflow: "hidden", boxShadow: t.shadow,
                            }}>
                                <div style={{
                                    padding: "12px 14px", borderBottom: `0.5px solid ${t.border}`,
                                    fontSize: 12, fontWeight: 500, color: t.text,
                                    display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    📅 Monthly breakdown
                                </div>

                                {/* Column headers */}
                                <div style={{
                                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 72px",
                                    gap: 8, padding: "7px 14px",
                                    fontSize: 9, fontWeight: 600, color: t.textMute,
                                    textTransform: "uppercase", letterSpacing: "0.07em",
                                    background: t.soft,
                                }}>
                                    <div>Month</div>
                                    <div style={{ textAlign: "right" }}>Revenue</div>
                                    <div style={{ textAlign: "right" }}>Cost</div>
                                    <div style={{ textAlign: "right" }}>Profit</div>
                                    <div style={{ textAlign: "right" }}>Margin</div>
                                </div>

                                {months.map((m, idx) => {
                                    const mP  = m.profit >= 0;
                                    const mg  = m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100) : null;
                                    const sel = idx === selIdx;
                                    return (
                                        <div
                                            key={`${m.year}-${m.month}`}
                                            onClick={() => setSelIdx(idx)}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr 1fr 1fr 72px",
                                                gap: 8, padding: "11px 14px",
                                                borderBottom: `0.5px solid ${t.border}`,
                                                cursor: "pointer",
                                                background: sel
                                                    ? (dark ? "rgba(99,102,241,0.10)" : "#f0f0ff")
                                                    : "transparent",
                                                borderLeft: sel ? `2px solid ${t.primary}` : "2px solid transparent",
                                                transition: "background 0.1s",
                                                alignItems: "center",
                                            }}
                                            onMouseEnter={e => { if (!sel) e.currentTarget.style.background = t.soft; }}
                                            onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                                        >
                                            <div style={{ fontSize: 12, fontWeight: sel ? 500 : 400, color: t.text }}>
                                                {m.label}
                                            </div>
                                            <div style={{ textAlign: "right", fontSize: 12, fontWeight: 500, color: "#534AB7" }}>
                                                {fmt(m.revenue, cur)}
                                            </div>
                                            <div style={{ textAlign: "right", fontSize: 12, color: t.warning }}>
                                                {fmt(m.total_cost, cur)}
                                            </div>
                                            <div style={{ textAlign: "right", fontSize: 12, fontWeight: 500, color: mP ? t.success : t.danger }}>
                                                {mP ? "+" : ""}{fmt(m.profit, cur)}
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                {mg != null ? (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 99,
                                                        background: mP ? t.successSoft : t.dangerSoft,
                                                        color: mP ? t.success : t.danger,
                                                    }}>{mg > 0 ? "+" : ""}{mg}%</span>
                                                ) : "—"}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Total footer */}
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 14px", fontSize: 12,
                                }}>
                                    <span style={{ color: t.textMute }}>Total ({months.length} months)</span>
                                    <span style={{ fontWeight: 500, color: profitClr }}>
                                        {isProfit ? "+" : ""}{fmt(overallPL.profit, cur)}
                                    </span>
                                </div>
                            </div>

                            {/* Trend Chart */}
                            <div style={{
                                background: t.surface, border: `0.5px solid ${t.border}`,
                                borderRadius: 12, padding: "14px 16px", boxShadow: t.shadow,
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: t.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                    📈 Revenue vs cost trend
                                </div>

                                {/* Chart legend */}
                                <div style={{ display: "flex", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
                                    {[
                                        { color: "#AFA9EC", label: "Revenue" },
                                        { color: "#EF9F27", label: "Cost" },
                                        { color: "#1D9E75", label: "Profit" },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                                            <div style={{ width: 16, height: 2, background: item.color, borderRadius: 2 }} />
                                            <span style={{ color: t.textMute }}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {trendData.length === 0 ? (
                                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: t.textMute, fontSize: 12 }}>
                                        No data available
                                    </div>
                                ) : trendData.length === 1 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <BarChart data={trendData} barCategoryGap="40%"
                                            margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.textMute }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: t.textMute }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                                            <Tooltip content={<ChartTip currency={cur} />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
                                            <Bar dataKey="Revenue" fill="#AFA9EC" radius={[4,4,0,0]} maxBarSize={52} />
                                            <Bar dataKey="Cost"    fill="#EF9F27" radius={[4,4,0,0]} maxBarSize={52} />
                                            <Bar dataKey="Profit"  fill="#1D9E75" radius={[4,4,0,0]} maxBarSize={52} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <LineChart data={trendData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.textMute }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: t.textMute }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                                            <Tooltip content={<ChartTip currency={cur} />} cursor={{ stroke: t.borderMd, strokeWidth: 1 }} />
                                            <Line type="monotone" dataKey="Revenue" stroke="#AFA9EC" strokeWidth={2.5} dot={{ r: 4, fill: "#AFA9EC", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                            <Line type="monotone" dataKey="Cost"    stroke="#EF9F27" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: "#EF9F27", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                            <Line type="monotone" dataKey="Profit"  stroke="#1D9E75" strokeWidth={2} strokeDasharray="2 3" dot={{ r: 3, fill: "#1D9E75", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* ── Member Cost Cards ── */}
                        {selMonth && (
                            <div style={{
                                background: t.surface, border: `0.5px solid ${t.border}`,
                                borderRadius: 12, overflow: "hidden", boxShadow: t.shadow,
                            }}>
                                {/* Header with month switcher */}
                                <div style={{
                                    padding: "12px 16px",
                                    borderBottom: `0.5px solid ${t.border}`,
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    flexWrap: "wrap", gap: 8,
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                                        👥 Member cost — {selMonth.label}
                                    </div>
                                    {months.length > 1 && (
                                        <div style={{ display: "flex", gap: 5 }}>
                                            {months.map((m, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelIdx(idx)}
                                                    style={{
                                                        padding: "3px 10px", borderRadius: 99, fontSize: 11,
                                                        fontWeight: idx === selIdx ? 500 : 400, cursor: "pointer",
                                                        border: `1px solid ${idx === selIdx ? t.primary : t.border}`,
                                                        background: idx === selIdx ? t.primarySoft : "transparent",
                                                        color: idx === selIdx ? t.primary : t.textSoft,
                                                        outline: "none", transition: "all 0.15s",
                                                    }}
                                                >{m.label}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Member cards grid */}
                                {(!selMonth.members || selMonth.members.length === 0) ? (
                                    <div style={{ padding: "32px 20px", textAlign: "center", color: t.textMute, fontSize: 12 }}>
                                        No member data for this month.
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                            gap: 12, padding: 16,
                                        }}>
                                            {selMonth.members.map((m, idx) => {
                                                const pc  = P_COLORS[m.priority_order] ?? P_COLORS[3];
                                                return (
                                                    <div key={m.user_id} style={{
                                                        background: t.soft, borderRadius: 10,
                                                        padding: "14px 16px",
                                                        border: `0.5px solid ${t.border}`,
                                                    }}>
                                                        {/* Avatar + name */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                                            {m.avatar_url ? (
                                                                <img
                                                                    src={`/storage/${m.avatar_url}`}
                                                                    style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <div style={{
                                                                    width: 34, height: 34, borderRadius: "50%",
                                                                    background: t.primarySoft, color: t.primary,
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    fontSize: 11, fontWeight: 500, flexShrink: 0,
                                                                }}>
                                                                    {initials(m.name)}
                                                                </div>
                                                            )}
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <div style={{ fontSize: 13, fontWeight: 500, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                    {m.name}
                                                                </div>
                                                                <div style={{ fontSize: 10, color: t.textMute, marginTop: 1 }}>
                                                                    {m.hours_per_day}h · {m.assigned_days} days
                                                                </div>
                                                            </div>
                                                            <span style={{
                                                                flexShrink: 0,
                                                                fontSize: 10, fontWeight: 500,
                                                                padding: "2px 7px", borderRadius: 6,
                                                                background: pc.bg, color: pc.color,
                                                            }}>P{m.priority_order}</span>
                                                        </div>

                                                        {/* Cost rows */}
                                                        {[
                                                            { label: "Salary", value: m.salary_cost, color: "#7F77DD" },
                                                            { label: "OT",     value: m.ot_cost,     color: t.warning },
                                                            { label: "Leave",  value: m.leave_cost,  color: t.success },
                                                        ].map((row, ri) => (
                                                            <div key={ri} style={{
                                                                display: "flex", justifyContent: "space-between",
                                                                padding: "5px 0",
                                                                borderBottom: ri < 2 ? `0.5px solid ${t.border}` : "none",
                                                                fontSize: 12,
                                                            }}>
                                                                <span style={{ color: t.textMute }}>{row.label}</span>
                                                                <span style={{ fontWeight: row.value > 0 ? 500 : 400, color: row.value > 0 ? row.color : t.textMute }}>
                                                                    {row.value > 0 ? fmt(row.value, cur) : "—"}
                                                                </span>
                                                            </div>
                                                        ))}

                                                        {/* Total */}
                                                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, fontSize: 13, fontWeight: 500 }}>
                                                            <span style={{ color: t.textSoft }}>Total</span>
                                                            <span style={{ color: t.text }}>{fmt(m.total_cost, cur)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Footer total */}
                                        <div style={{
                                            padding: "11px 16px",
                                            borderTop: `0.5px solid ${t.border}`,
                                            display: "flex", justifyContent: "space-between", fontSize: 12,
                                        }}>
                                            <span style={{ color: t.textMute }}>
                                                Total cost — {selMonth.label}
                                            </span>
                                        
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}