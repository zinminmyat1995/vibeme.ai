import { useState, useMemo, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
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
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <button
                        onClick={() => router.get("/hr/pl-report", {
                            from_year:  filter.fromYear  ?? undefined,
                            from_month: filter.fromMonth ?? undefined,
                            to_year:    filter.toYear    ?? undefined,
                            to_month:   filter.toMonth   ?? undefined,
                        })}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "7px 12px", borderRadius: 8,
                            border: `0.5px solid ${t.borderMd}`,
                            background: t.surface, color: t.textSoft,
                            fontSize: 12, fontWeight: 500, cursor: "pointer", outline: "none",
                        }}
                    >
                        ← Back
                    </button>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h1 style={{ fontSize: 18, fontWeight: 500, color: t.text, margin: 0 }}>
                                {project.name}
                            </h1>
                            <span style={{
                                fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
                                background: stSt.bg, color: stSt.color, textTransform: "uppercase",
                            }}>
                                {project.status}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: t.textMute, marginTop: 3 }}>
                            {project.start_date} → {project.end_date ?? "Ongoing"} ·
                            Contract: {fmt(project.contract_value, cur)} ·
                            {months.length} confirmed month{months.length !== 1 ? "s" : ""}
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

                                {trendData.length < 2 ? (
                                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: t.textMute, fontSize: 12 }}>
                                        Need 2+ months of data to show trend
                                    </div>
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
                                            <span style={{ fontWeight: 500, color: t.text }}>
                                                {fmt(selMonth.total_cost, cur)}
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