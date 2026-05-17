import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTranslation } from "@/Contexts/LanguageContext";
import {
    ComposedChart, Bar, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
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
        return () => { window.removeEventListener("vibeme-theme-change", s); window.removeEventListener("storage", s); };
    }, []);
    return dark;
}

const T = (dark) => dark ? {
    surface: "rgba(15,26,50,0.95)", soft: "rgba(255,255,255,0.04)",
    border: "rgba(148,163,184,0.10)", borderMd: "rgba(148,163,184,0.18)",
    text: "#f1f5f9", textSoft: "#94a3b8", textMute: "#475569",
    shadow: "0 1px 6px rgba(0,0,0,0.25)",
    primary: "#6366f1", primarySoft: "rgba(99,102,241,0.15)",
    success: "#10b981", successSoft: "rgba(16,185,129,0.12)",
    warning: "#f59e0b", warningSoft: "rgba(245,158,11,0.12)",
    danger: "#ef4444", dangerSoft: "rgba(239,68,68,0.12)",
    grid: "rgba(148,163,184,0.08)",
    inputBg: "rgba(255,255,255,0.07)", inputBorder: "rgba(148,163,184,0.20)",
    menuBg: "rgba(15,23,42,0.98)", menuShadow: "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
} : {
    surface: "#fff", soft: "rgba(15,23,42,0.03)",
    border: "rgba(15,23,42,0.09)", borderMd: "rgba(15,23,42,0.16)",
    text: "#0f172a", textSoft: "#475569", textMute: "#94a3b8",
    shadow: "0 1px 6px rgba(15,23,42,0.07)",
    primary: "#6366f1", primarySoft: "rgba(99,102,241,0.08)",
    success: "#059669", successSoft: "rgba(5,150,105,0.08)",
    warning: "#d97706", warningSoft: "rgba(217,119,6,0.08)",
    danger: "#dc2626", dangerSoft: "rgba(220,38,38,0.08)",
    grid: "rgba(15,23,42,0.06)",
    inputBg: "#fff", inputBorder: "rgba(15,23,42,0.14)",
    menuBg: "#fff", menuShadow: "0 16px 40px rgba(15,23,42,0.14)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n, cur = "USD", locale = "en-US") => n == null ? "—" :
    new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
const fmtK = (n) => {
    if (n == null) return "—";
    const abs = Math.abs(n);
    if (abs >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `$${(n/1e3).toFixed(0)}K`;
    return `$${Math.round(n)}`;
};
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthName = (tr, month, type = "full") => tr(`plReport.months.${type}.${month}`) || MONTHS_FULL[month - 1] || "";
const monthLabel = (tr, item) => item?.month ? `${monthName(tr, item.month, "short")} ${item.year ?? ""}`.trim() : item?.label;
const deptName = (tr, dept) => tr(`plReport.departments.${dept}`) || dept;
const DEPT_COLORS = { HR:"#7F77DD", IT:"#1D9E75", BPO:"#EF9F27", SST:"#D4537E", Driver:"#378ADD", Other:"#888780" };

function PremiumSelect({ options=[], value='', onChange, width='auto', dark, t }) {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top:0, left:0, width:0 });
    const triggerRef = useRef(null);
    const menuRef    = useRef(null);
    const selected   = options.find(o => String(o.value) === String(value) && !o.disabled);

    useEffect(() => {
        const h = e => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    function handleOpen() {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            const menuH = Math.min(options.length * 40 + 12, 260);
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow < menuH
                ? rect.top + window.scrollY - menuH - 4
                : rect.bottom + window.scrollY + 4;
            setPos({ top, left: rect.left + window.scrollX, width: rect.width });
        }
        setOpen(v => !v);
    }

    const trigBg = dark
        ? "linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.04) 100%)"
        : "linear-gradient(180deg,#fff 0%,#f8fafc 100%)";

    return (
        <>
            <button ref={triggerRef} type="button" onClick={handleOpen} style={{
                width, height:36, padding:"0 12px",
                borderRadius:8, border:`1.5px solid ${open ? t.primary : t.inputBorder}`,
                background: trigBg, color: selected ? t.text : t.textMute,
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
                cursor:"pointer", fontSize:13, fontWeight: selected ? 600 : 400,
                boxShadow: open ? `0 0 0 3px ${t.primarySoft}` : "none",
                transition:"all 0.16s", outline:"none", fontFamily:"inherit",
            }}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {selected?.label ?? "—"}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textMute} strokeWidth="2.5"
                    style={{ flexShrink:0, transition:"transform 0.18s", transform: open ? "rotate(180deg)" : "none" }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={menuRef} style={{
                    position:"absolute", top:pos.top, left:pos.left, width:pos.width,
                    zIndex:9999,
                    background: t.menuBg,
                    border:`1px solid ${t.borderMd}`,
                    borderRadius:10,
                    boxShadow: t.menuShadow,
                    overflow:"hidden",
                }}>
                    <div style={{ maxHeight:260, overflowY:"auto", padding:4, scrollbarWidth:"none" }}>
                        {options.map(opt => {
                            const isSel = String(opt.value) === String(value);
                            return (
                                <button key={opt.value} type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    style={{
                                        width:"100%", padding:"8px 11px", border:"none", borderRadius:7,
                                        background: isSel ? t.primarySoft : "transparent",
                                        color: isSel ? t.primary : t.text,
                                        display:"flex", alignItems:"center", justifyContent:"space-between",
                                        cursor:"pointer", fontSize:13, fontWeight: isSel ? 700 : 500,
                                        textAlign:"left", marginBottom:1,
                                        transition:"background 0.1s", fontFamily:"inherit",
                                    }}
                                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f5f3ff"; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <span>{opt.label}</span>
                                    {isSel && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.primary} strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ── Chart Tooltip — always dark background ────────────────────────────────────
function ChartTip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#1e293b", border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 10, padding: "10px 14px", fontSize: 11,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)", pointerEvents: "none",
        }}>
            <div style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <span style={{ width:8, height:8, borderRadius:2, background: p.color ?? p.fill, display:"inline-block", flexShrink:0 }} />
                    <span style={{ color:"#94a3b8" }}>{p.name}:</span>
                    <span style={{ color:"#f1f5f9", fontWeight:500 }}>
                        {p.name?.includes("%") ? `${p.value}%` : fmtK(p.value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── ChartLegend ───────────────────────────────────────────────────────────────
function ChartLegend({ items }) {
    return (
        <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:10 }}>
            {items.map((item,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}>
                    {item.line
                        ? <div style={{ width:16, height:2, background:item.color, borderRadius:2 }} />
                        : <div style={{ width:9, height:9, borderRadius:2, background:item.color }} />
                    }
                    <span style={{ color:"var(--color-text-secondary)" }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
}

// ── Card — no focus/click border ─────────────────────────────────────────────
function Card({ title, sub, children, t, style }) {
    return (
        <div tabIndex={-1} style={{
            background: t.surface, border:`0.5px solid ${t.border}`,
            borderRadius:12, padding:"14px 16px", boxShadow:t.shadow,
            outline:"none", WebkitTapHighlightColor:"transparent",
            ...style,
        }}>
            {title && (
                <div style={{ marginBottom: sub ? 2 : 10 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:t.text }}>{title}</div>
                    {sub && <div style={{ fontSize:11, color:t.textMute, marginTop:2, marginBottom:10 }}>{sub}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, changePct, color, accentColor, t }) {
    const up = changePct >= 0;
    return (
        <div style={{
            background:t.surface, border:`0.5px solid ${t.border}`,
            borderRadius:12, padding:"12px 14px", boxShadow:t.shadow,
            borderTop:`2px solid ${accentColor}`,
        }}>
            <div style={{ fontSize:10, fontWeight:500, color:t.textMute, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>
                {label}
            </div>
            <div style={{ fontSize:19, fontWeight:500, color:color ?? t.text, marginBottom:4 }}>
                {value}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10 }}>
                {changePct != null && (
                    <span style={{ color: up ? t.success : t.danger, fontWeight:500 }}>
                        {up ? "▲" : "▼"} {Math.abs(changePct)}%
                    </span>
                )}
                {sub && <span style={{ color:t.textMute }}>{sub}</span>}
            </div>
        </div>
    );
}

// ── Sticky Header ─────────────────────────────────────────────────────────────
function StickyHeader({ fromYear, fromMonth, toYear, toMonth, setFromYear, setFromMonth, setToYear, setToMonth, available, t, dark, onApply, tr }) {
    const [visible, setVisible] = useState(true);
    const [lastY,   setLastY]   = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setVisible(y < lastY || y < 60);
            setLastY(y);
        };
        window.addEventListener("scroll", onScroll, { passive:true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [lastY]);

    const years  = [...new Set(available.map(m => m.year))];
    const yearOpts  = years.map(y => ({ value:y, label:String(y) }));
    const fromMonthOpts = available.filter(m => m.year === fromYear).map(m => ({ value:m.month, label:monthName(tr, m.month, 'full') }));
    const toMonthOpts   = available.filter(m => m.year === toYear).map(m => ({ value:m.month, label:monthName(tr, m.month, 'full') }));

    return (
        <div style={{
            position:"sticky", top:0, zIndex:50,
            transform: visible ? "translateY(0)" : "translateY(-110%)",
            transition:"transform 0.25s ease",
            background:t.surface, border:`0.5px solid ${t.border}`,
            borderRadius:12, padding:"12px 18px", boxShadow:t.shadow,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:12,
        }}>
            <div>
                <div style={{ fontSize:16, fontWeight:500, color:t.text }}>{tr('plReport.header.title')}</div>
                <div style={{ fontSize:11, color:t.textMute, marginTop:2 }}>{tr('plReport.header.subtitle')}</div>
            </div>

            <div style={{ display:"flex", alignItems:"flex-end", gap:10, flexWrap:"wrap" }}>
                {/* FROM */}
                <div>
                    <div style={{ fontSize:10, fontWeight:600, color:t.textMute, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{tr('plReport.filters.from')}</div>
                    <div style={{ display:"flex", gap:6 }}>
                        <PremiumSelect options={yearOpts} value={fromYear} onChange={v => setFromYear(+v)} width={76} dark={dark} t={t} />
                        <PremiumSelect options={fromMonthOpts} value={fromMonth} onChange={v => setFromMonth(+v)} width={120} dark={dark} t={t} />
                    </div>
                </div>

                <span style={{ fontSize:14, color:t.textMute, paddingBottom:8 }}>→</span>

                {/* TO */}
                <div>
                    <div style={{ fontSize:10, fontWeight:600, color:t.textMute, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{tr('plReport.filters.to')}</div>
                    <div style={{ display:"flex", gap:6 }}>
                        <PremiumSelect options={yearOpts} value={toYear} onChange={v => setToYear(+v)} width={76} dark={dark} t={t} />
                        <PremiumSelect options={toMonthOpts} value={toMonth} onChange={v => setToMonth(+v)} width={120} dark={dark} t={t} />
                    </div>
                </div>

                <button onClick={onApply} style={{
                    height:36, padding:"0 18px", borderRadius:8, border:"none",
                    background:"linear-gradient(135deg,#6366f1,#4f46e5)",
                    color:"#fff", fontSize:12, fontWeight:600,
                    cursor:"pointer", marginBottom:1, letterSpacing:"0.02em",
                    boxShadow:"0 2px 8px rgba(99,102,241,0.35)", outline:"none",
                }}>
                    {tr('plReport.actions.applyFilter')}
                </button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PLReportIndex({
    availableMonths=[], filter={}, summary={},
    monthlyTrend=[], projects=[], overheadByDept={},
}) {
    const { t: tr, locale = "en" } = useTranslation();
    const fmtMoney = (n, cur = "USD") => fmt(n, cur, locale === "ja" ? "ja-JP" : locale === "ko" ? "ko-KR" : locale === "vi" ? "vi-VN" : "en-US");
    const dark = useTheme();
    const t    = useMemo(() => T(dark), [dark]);

    const [fromYear,  setFromYear]  = useState(filter.fromYear  ?? availableMonths[0]?.year  ?? 2026);
    const [fromMonth, setFromMonth] = useState(filter.fromMonth ?? availableMonths[0]?.month ?? 1);
    const [toYear,    setToYear]    = useState(filter.toYear    ?? availableMonths.at(-1)?.year  ?? 2026);
    const [toMonth,   setToMonth]   = useState(filter.toMonth   ?? availableMonths.at(-1)?.month ?? 12);

    const apply = () => router.get("/hr/pl-report", {
        from_year:fromYear, from_month:fromMonth, to_year:toYear, to_month:toMonth,
    }, { preserveScroll:true });

    const isProfit = (summary.net_profit ?? 0) >= 0;
    const maxRev   = Math.max(...projects.map(p => p.revenue), 1);
    const maxDept  = Math.max(...Object.values(overheadByDept), 1);
    const expenseTotal = (summary.total_project_cost ?? 0) + (summary.total_overhead ?? 0);

    const pieData = [
        { name:tr("plReport.expense.salary"),   value:summary.total_project_cost ?? 0, color:"#7F77DD" },
        { name:tr("plReport.expense.overhead"), value:summary.total_overhead ?? 0,     color:"#EF9F27" },
    ].filter(d => d.value > 0);

    const trendData = monthlyTrend.map(m => ({
        label: monthLabel(tr, m),
        grossProfit: m.gross_profit,
        marginPercent: m.revenue > 0 ? Math.round((m.gross_profit / m.revenue) * 100) : 0,
    }));

    const incomeData = monthlyTrend.map(m => ({
        label: monthLabel(tr, m),
        revenue: m.revenue,
        totalCost: m.total_cost,
        netMarginPercent: m.revenue > 0 ? Math.round((m.net_profit / m.revenue) * 100) : 0,
    }));

    const deptList = Object.entries(overheadByDept).sort((a,b)=>b[1]-a[1]).slice(0,5);

    const expenseItems = [
        { label:tr("plReport.expense.salary"),   value:summary.total_project_cost ?? 0, color:"#7F77DD" },
        { label:tr("plReport.expense.overhead"), value:summary.total_overhead ?? 0,     color:"#EF9F27" },
        { label:tr("plReport.expense.ot"),       value:0,                               color:"#1D9E75" },
        { label:tr("plReport.expense.leave"),    value:0,                               color:"#D4537E" },
    ];

    if (availableMonths.length === 0) {
        return (
            <AppLayout title={tr("plReport.pageTitle")}>
                <Head title={tr("plReport.pageTitle")} />
                <div style={{ background:t.surface, border:`0.5px solid ${t.border}`, borderRadius:12, padding:"48px 20px", textAlign:"center", color:t.textMute, fontSize:13 }}>
                    {tr('plReport.empty.noPayrollData')}
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={tr("plReport.pageTitle")}>
            <Head title={tr("plReport.pageTitle")} />
            {/* Global style: remove focus outline on all chart containers */}
            <style>{`
                .pl-chart-wrap *:focus { outline: none !important; }
                .pl-chart-wrap { -webkit-tap-highlight-color: transparent; }
            `}</style>

            <div style={{ display:"flex", flexDirection:"column", gap:14, paddingBottom:100 }}>

                {/* ── Sticky Header ── */}
                <StickyHeader
                    fromYear={fromYear} fromMonth={fromMonth}
                    toYear={toYear}     toMonth={toMonth}
                    setFromYear={setFromYear} setFromMonth={setFromMonth}
                    setToYear={setToYear}     setToMonth={setToMonth}
                    available={availableMonths} t={t} dark={dark} onApply={apply} tr={tr}
                />

                {/* ── Row 1: KPI Cards ── */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
                    <KPI label={tr("plReport.kpi.totalRevenue")}  value={fmtMoney(summary.total_revenue)}
                        changePct={summary.revenue_change_pct}
                        color="#534AB7" accentColor="#7F77DD" t={t} />
                    <KPI label={tr("plReport.kpi.projectCost")}   value={fmtMoney(summary.total_project_cost)}
                        changePct={summary.project_cost_change_pct}
                        accentColor="#AFA9EC" t={t} />
                    <KPI label={tr("plReport.kpi.overheadCost")}  value={fmtMoney(summary.total_overhead)}
                        changePct={summary.overhead_change_pct}
                        color={t.warning} accentColor="#EF9F27" t={t} />
                    <KPI label={tr("plReport.kpi.grossProfit")}   value={fmtMoney(summary.gross_profit)}
                        changePct={summary.gross_profit_change_pct}
                        color={t.success} accentColor="#5DCAA5" t={t}
                        sub={tr("plReport.labels.beforeOverhead")} />
                    <KPI label={tr("plReport.kpi.netProfit")}     value={fmtMoney(summary.net_profit)}
                        changePct={summary.net_profit_change_pct}
                        color={isProfit ? t.success : t.danger}
                        accentColor={isProfit ? "#1D9E75" : "#E24B4A"} t={t}
                        sub={summary.net_margin_pct != null ? `${summary.net_margin_pct}% ${tr("plReport.labels.margin")}` : undefined} />
                    <KPI label={tr("plReport.kpi.outstanding")}    value={fmtMoney(summary.outstanding_revenue)}
                        color={t.warning} accentColor="#BA7517" t={t}
                        sub={`${tr("plReport.labels.of")} ${fmtMoney(summary.total_contract_value)} ${tr("plReport.labels.contract")}`} />
                </div>

                {/* ── Row 2: Operating Income (3fr) + Period Comparison (1fr) ── */}
                <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr", gap:12 }}>

                    <Card title={tr("plReport.cards.operatingIncomeTitle")}
                        sub={tr("plReport.cards.operatingIncomeSub")} t={t}>
                        <div className="pl-chart-wrap">
                            <ChartLegend items={[
                                { color:"#AFA9EC", label:tr("plReport.kpi.totalRevenue") },
                                { color:"#EF9F27", label:tr("plReport.chart.totalCost") },
                                { color:"#E24B4A", label:tr("plReport.chart.netMarginPercent"), line:true },
                            ]} />
                            <ResponsiveContainer width="100%" height={210}>
                                <ComposedChart data={incomeData} barCategoryGap="30%"
                                    style={{ outline:"none", userSelect:"none" }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize:10, fill:t.textMute }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{ fontSize:10, fill:t.textMute }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:"#E24B4A" }} axisLine={false} tickLine={false} tickFormatter={v => v+"%"} />
                                    <Tooltip content={<ChartTip />} cursor={{ fill:"rgba(148,163,184,0.06)" }} />
                                    <Bar yAxisId="left" dataKey="revenue" name={tr("plReport.chart.revenue")}    fill="#AFA9EC" radius={[4,4,0,0]} maxBarSize={44} />
                                    <Bar yAxisId="left" dataKey="totalCost" name={tr("plReport.chart.totalCost")} fill="#EF9F27" radius={[4,4,0,0]} maxBarSize={44} />
                                    <Line yAxisId="right" type="monotone" dataKey="netMarginPercent" name={tr("plReport.chart.netMarginPercent")} stroke="#E24B4A" strokeWidth={2} dot={{ r:4, fill:"#E24B4A", strokeWidth:0 }} activeDot={{ r:6, strokeWidth:0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title={tr("plReport.cards.periodComparisonTitle")} sub={tr("plReport.cards.periodComparisonSub")} t={t}>
                        {[
                            { label:tr("plReport.kpi.totalRevenue"),      value:fmtMoney(summary.total_revenue),      pct:summary.revenue_change_pct },
                            { label:tr("plReport.kpi.projectCost"), value:fmtMoney(summary.total_project_cost), pct:summary.project_cost_change_pct },
                            { label:tr("plReport.kpi.overheadCost"),     value:fmtMoney(summary.total_overhead),     pct:summary.overhead_change_pct },
                            { label:tr("plReport.kpi.grossProfit"), value:fmtMoney(summary.gross_profit),       pct:summary.gross_profit_change_pct, bold:true },
                            { label:tr("plReport.kpi.netProfit"),   value:fmtMoney(summary.net_profit),         pct:summary.net_profit_change_pct,   bold:true },
                        ].map((row,i,arr) => (
                            <div key={i} style={{
                                display:"flex", justifyContent:"space-between", alignItems:"center",
                                padding:"9px 0",
                                borderBottom: i < arr.length-1 ? `0.5px solid ${t.border}` : "none",
                            }}>
                                <span style={{ fontSize:11, color:t.textMute }}>{row.label}</span>
                                <div style={{ textAlign:"right" }}>
                                    <div style={{ fontSize:12, fontWeight:row.bold ? 600 : 400, color:t.text }}>{row.value}</div>
                                    {row.pct != null && (
                                        <div style={{ fontSize:10, color:row.pct >= 0 ? t.success : t.danger, marginTop:1 }}>
                                            {row.pct >= 0 ? "▲" : "▼"} {Math.abs(row.pct)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>

                {/* ── Row 3: Gross Profit Trend (3fr) + Expense Breakdown (1fr) ── */}
                <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr", gap:12 }}>

                    <Card title={tr("plReport.cards.grossProfitTrendTitle")}
                        sub={tr("plReport.cards.grossProfitTrendSub")} t={t}>
                        <div className="pl-chart-wrap">
                            <ChartLegend items={[
                                { color:"#534AB7", label:tr("plReport.kpi.grossProfit"), line:true },
                                { color:"#EF9F27", label:tr("plReport.chart.grossMarginPercent"), line:true },
                            ]} />
                            {trendData.length === 0 ? (
                                <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", color:t.textMute, fontSize:12 }}>
                                    {tr('plReport.empty.noDataAvailable')}
                                </div>
                            ) : trendData.length === 1 ? (
                                <ResponsiveContainer width="100%" height={180}>
                                    <ComposedChart data={trendData} style={{ outline:"none", userSelect:"none" }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize:10, fill:t.textMute }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="left" tick={{ fontSize:10, fill:t.textMute }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:"#EF9F27" }} axisLine={false} tickLine={false} tickFormatter={v => v+"%"} />
                                        <Tooltip content={<ChartTip />} cursor={{ fill:"rgba(148,163,184,0.06)" }} />
                                        <Bar yAxisId="left" dataKey="grossProfit" name={tr("plReport.chart.grossProfit")} fill="#AFA9EC" radius={[4,4,0,0]} maxBarSize={60} />
                                        <Bar yAxisId="right" dataKey="marginPercent" name={tr("plReport.chart.marginPercent")}    fill="#EF9F27" radius={[4,4,0,0]} maxBarSize={60} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <ComposedChart data={trendData} style={{ outline:"none", userSelect:"none" }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize:10, fill:t.textMute }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="left" tick={{ fontSize:10, fill:t.textMute }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:"#EF9F27" }} axisLine={false} tickLine={false} tickFormatter={v => v+"%"} />
                                        <Tooltip content={<ChartTip />} cursor={{ fill:"rgba(148,163,184,0.06)" }} />
                                        <Line yAxisId="left" type="monotone" dataKey="grossProfit" name={tr("plReport.chart.grossProfit")} stroke="#534AB7" strokeWidth={2.5} dot={{ r:4, fill:"#534AB7", strokeWidth:0 }} activeDot={{ r:6, strokeWidth:0 }} />
                                        <Line yAxisId="right" type="monotone" dataKey="marginPercent" name={tr("plReport.chart.marginPercent")} stroke="#EF9F27" strokeWidth={2} strokeDasharray="5 3" dot={{ r:3, fill:"#EF9F27", strokeWidth:0 }} activeDot={{ r:5, strokeWidth:0 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    <Card title={tr("plReport.cards.expenseBreakdownTitle")}
                        sub={tr("plReport.cards.expenseBreakdownSub")} t={t}>
                        <div className="pl-chart-wrap">
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart style={{ outline:"none", userSelect:"none" }}>
                                    <Pie data={pieData} cx="50%" cy="50%"
                                        innerRadius={45} outerRadius={68}
                                        paddingAngle={2} dataKey="value">
                                        {pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
                                    </Pie>
                                    <Tooltip
                                        formatter={v => [fmtMoney(v),""]}
                                        contentStyle={{ background:"#1e293b", border:"1px solid rgba(148,163,184,0.2)", borderRadius:8, fontSize:11, color:"#f1f5f9" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Labels — right corner */}
                            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                                {expenseItems.map((item,i) => (
                                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                            <div style={{ width:8, height:8, borderRadius:2, background:item.color, flexShrink:0 }} />
                                            <span style={{ fontSize:10, color:t.textMute }}>{item.label}</span>
                                        </div>
                                        <div style={{ textAlign:"right" }}>
                                            <div style={{ fontSize:11, fontWeight:500, color:t.text }}>{fmtMoney(item.value)}</div>
                                            <div style={{ fontSize:9, color:t.textMute }}>
                                                {expenseTotal > 0 ? Math.round((item.value/expenseTotal)*100) : 0}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Row 4: Projects + Departments ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

                    <Card title={tr("plReport.cards.revenueByProjectTitle")}
                        sub={tr("plReport.cards.revenueByProjectSub")} t={t}>
                        {projects.length === 0 ? (
                            <div style={{ textAlign:"center", color:t.textMute, fontSize:12, padding:"24px 0" }}>{tr('plReport.empty.noProjects')}</div>
                        ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                                {projects.map(p => {
                                    const isP    = p.profit >= 0;
                                    const barPct = maxRev > 0 ? (p.revenue/maxRev)*100 : 0;
                                    return (
                                        <div key={p.id}
                                            onClick={() => router.visit(`/hr/pl-report/${p.id}`, {
                                                data: { from_year: fromYear, from_month: fromMonth, to_year: toYear, to_month: toMonth }
                                            })}
                                            style={{
                                                cursor:"pointer", borderRadius:10,
                                                padding:"10px 12px", margin:"0 -12px",
                                                transition:"background 0.15s, box-shadow 0.15s",
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = dark
                                                    ? "rgba(99,102,241,0.10)"
                                                    : "rgba(99,102,241,0.05)";
                                                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.18)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                                                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#1D9E75", flexShrink:0 }} />
                                                    <span style={{ fontSize:13, fontWeight:500, color:t.text }}>{p.name}</span>
                                                    {p.margin_pct != null && (
                                                        <span style={{
                                                            fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:99,
                                                            background: isP ? t.successSoft : t.dangerSoft,
                                                            color: isP ? t.success : t.danger,
                                                        }}>{isP ? "+" : ""}{p.margin_pct}%</span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize:13, fontWeight:600, color:"#534AB7" }}>{fmtMoney(p.revenue, p.currency)}</span>
                                            </div>
                                            <div style={{ height:7, borderRadius:99, background:t.soft, overflow:"hidden", border:`0.5px solid ${t.border}` }}>
                                                <div style={{
                                                    height:"100%", width:`${barPct}%`,
                                                    background: isP
                                                        ? "linear-gradient(90deg,#7F77DD,#AFA9EC)"
                                                        : "linear-gradient(90deg,#E24B4A,#F09595)",
                                                    borderRadius:99, transition:"width 0.4s ease",
                                                }} />
                                            </div>
                                            <div style={{ display:"flex", gap:12, marginTop:5, fontSize:10, color:t.textMute }}>
                                                <span>{tr('plReport.labels.cost')} {fmtMoney(p.total_cost, p.currency)}</span>
                                                <span style={{ color:isP ? t.success : t.danger, fontWeight:600 }}>
                                                    {isP ? "+" : ""}{fmtMoney(p.profit, p.currency)}
                                                </span>
                                                {p.member_count > 0 && <span>{p.member_count} {p.member_count > 1 ? tr("plReport.units.members") : tr("plReport.units.member")}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    <Card title={tr("plReport.cards.overheadByDepartmentTitle")}
                        sub={tr("plReport.cards.overheadByDepartmentSub")} t={t}>
                        {deptList.length === 0 ? (
                            <div style={{ textAlign:"center", color:t.textMute, fontSize:12, padding:"24px 0" }}>{tr('plReport.empty.noOverheadData')}</div>
                        ) : (
                            <>
                                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                                    {deptList.map(([dept, amount]) => {
                                        const barPct = maxDept > 0 ? (amount/maxDept)*100 : 0;
                                        const color  = DEPT_COLORS[dept] ?? "#888780";
                                        return (
                                            <div key={dept}>
                                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                                                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                                        <div style={{ width:10, height:10, borderRadius:3, background:color, flexShrink:0 }} />
                                                        <span style={{ fontSize:12, fontWeight:500, color:t.text }}>{deptName(tr, dept)}</span>
                                                    </div>
                                                    <span style={{ fontSize:12, fontWeight:600, color:t.text }}>{fmtMoney(amount)}</span>
                                                </div>
                                                <div style={{ height:7, borderRadius:99, background:t.soft, overflow:"hidden", border:`0.5px solid ${t.border}` }}>
                                                    <div style={{
                                                        height:"100%", width:`${barPct}%`,
                                                        background:color, borderRadius:99,
                                                        opacity:0.8, transition:"width 0.4s ease",
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ borderTop:`0.5px solid ${t.border}`, marginTop:16, paddingTop:12, display:"flex", justifyContent:"space-between", fontSize:12 }}>
                                    <span style={{ color:t.textMute }}>{tr('plReport.labels.totalOverhead')}</span>
                                    <span style={{ fontWeight:600, color:t.text }}>{fmtMoney(summary.total_overhead)}</span>
                                </div>
                            </>
                        )}
                    </Card>
                </div>

            </div>
        </AppLayout>
    );
}