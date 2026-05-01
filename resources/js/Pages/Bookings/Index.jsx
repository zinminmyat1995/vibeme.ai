import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

// ─── Global toast helper ─────────────────────────────────────────
const toast = (message, type = "success") =>
    window.dispatchEvent(new CustomEvent("global-toast", { detail: { message, type } }));

// ─────────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────────
function useReactiveTheme() {
    const getDark = () => typeof window !== "undefined" && (
        document.documentElement.getAttribute("data-theme") === "dark" ||
        localStorage.getItem("vibeme-theme") === "dark"
    );
    const [dark, setDark] = useState(getDark);
    useEffect(() => {
        const sync = () => setDark(getDark());
        window.addEventListener("vibeme-theme-change", sync);
        window.addEventListener("storage", sync);
        return () => { window.removeEventListener("vibeme-theme-change", sync); window.removeEventListener("storage", sync); };
    }, []);
    return dark;
}

function getTheme(dark) {
    return dark ? {
        bg: "#060c18", surface: "rgba(13,22,42,0.97)", surfaceSoft: "rgba(255,255,255,0.04)",
        surfaceSofter: "rgba(255,255,255,0.06)", border: "rgba(148,163,184,0.10)", borderStrong: "rgba(148,163,184,0.20)",
        text: "#f1f5f9", textSoft: "#94a3b8", textMute: "#475569",
        shadow: "0 20px 60px rgba(0,0,0,0.5)", shadowSm: "0 2px 12px rgba(0,0,0,0.3)",
        overlay: "rgba(2,8,23,0.82)", primary: "#6366f1", primarySoft: "rgba(99,102,241,0.18)",
        success: "#10b981", successSoft: "rgba(16,185,129,0.15)", warning: "#f59e0b", warningSoft: "rgba(245,158,11,0.15)",
        danger: "#ef4444", dangerSoft: "rgba(239,68,68,0.14)",
        inputBg: "rgba(255,255,255,0.06)", inputBorder: "rgba(148,163,184,0.15)",
        triggerBg: "linear-gradient(180deg,rgba(13,22,42,0.97) 0%,rgba(8,15,30,0.97) 100%)",
        menuBg: "rgba(8,15,30,0.99)", roomColor: "#6366f1", roomSoft: "rgba(99,102,241,0.12)",
        carColor: "#f59e0b", carSoft: "rgba(245,158,11,0.12)", calLine: "rgba(148,163,184,0.06)",
    } : {
        bg: "#f1f5f9", surface: "#ffffff", surfaceSoft: "#f8fafc",
        surfaceSofter: "#f1f5f9", border: "#e2e8f0", borderStrong: "#cbd5e1",
        text: "#0f172a", textSoft: "#64748b", textMute: "#94a3b8",
        shadow: "0 8px 40px rgba(0,0,0,0.12)", shadowSm: "0 2px 8px rgba(0,0,0,0.06)",
        overlay: "rgba(15,23,42,0.55)", primary: "#6366f1", primarySoft: "rgba(99,102,241,0.10)",
        success: "#10b981", successSoft: "rgba(16,185,129,0.10)", warning: "#f59e0b", warningSoft: "rgba(245,158,11,0.10)",
        danger: "#ef4444", dangerSoft: "rgba(239,68,68,0.08)",
        inputBg: "#ffffff", inputBorder: "#e2e8f0",
        triggerBg: "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
        menuBg: "#ffffff", roomColor: "#6366f1", roomSoft: "rgba(99,102,241,0.08)",
        carColor: "#f59e0b", carSoft: "rgba(245,158,11,0.08)", calLine: "#f1f5f9",
    };
}

// ─────────────────────────────────────────────────────────────────
// TimePicker — same as AttendanceRequests
// ─────────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, theme, dark, error, disabled = false }) {
    const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

    const parseVal = (v) => {
        if (!v) return null;
        const [hStr, mStr] = v.split(":");
        const h24 = parseInt(hStr);
        if (isNaN(h24)) return null;
        const p   = h24 >= 12 ? "PM" : "AM";
        const h12 = h24 % 12 || 12;
        return { h: String(h12).padStart(2, "0"), m: (mStr || "00").slice(0, 2), p };
    };

    const parsed = parseVal(value);
    const h = parsed?.h ?? "--";
    const m = parsed?.m ?? "--";
    const p = parsed?.p ?? "AM";

    const emit = (nh, nm, np) => {
        if (disabled) return;
        const safeH = nh === "--" ? "08" : nh;
        const safeM = nm === "--" ? "00" : nm;
        const safeP = np ?? "AM";
        let h24 = parseInt(safeH);
        if (isNaN(h24)) return;
        if (safeP === "PM" && h24 !== 12) h24 += 12;
        if (safeP === "AM" && h24 === 12) h24 = 0;
        onChange(`${String(h24).padStart(2, "0")}:${safeM}`);
    };

    const sel = {
        height: 42, border: "none", background: "transparent",
        color: disabled ? theme.textMute : theme.text,
        fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", outline: "none",
        appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
        textAlign: "center", padding: "0 4px",
    };

    return (
        <>
            <style>{`.bk-tp-sel::-webkit-scrollbar{display:none}.bk-tp-sel option{background:${dark ? "#1e2d4a" : "#fff"} !important;color:${dark ? "#f1f5f9" : "#0f172a"} !important;}`}</style>
            <div style={{
                display: "inline-flex", alignItems: "center",
                border: `1.5px solid ${error ? theme.danger : theme.inputBorder}`,
                borderRadius: 12, overflow: "hidden",
                background: disabled ? (dark ? "rgba(255,255,255,0.03)" : "#f3f4f6") : theme.inputBg,
                height: 46, transition: "border-color .15s", opacity: disabled ? 0.5 : 1, width: "100%",
            }}>
                <div style={{ paddingLeft: 12, paddingRight: 4, color: theme.textMute, display: "flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <select className="bk-tp-sel" value={h} onChange={e => emit(e.target.value, m === "--" ? "00" : m, p)} style={{ ...sel, width: 38 }}>
                    {!parsed && <option value="--">--</option>}
                    {hours.map(hv => <option key={hv} value={hv}>{hv}</option>)}
                </select>
                <span style={{ color: theme.textMute, fontWeight: 800, fontSize: 15, userSelect: "none" }}>:</span>
                <select className="bk-tp-sel" value={m} onChange={e => emit(h === "--" ? "08" : h, e.target.value, p)} style={{ ...sel, width: 38 }}>
                    {!parsed && <option value="--">--</option>}
                    {minutes.map(mv => <option key={mv} value={mv}>{mv}</option>)}
                </select>
                <div style={{ width: 1, height: 24, background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", margin: "0 4px", flexShrink: 0 }} />
                {["AM", "PM"].map(period => (
                    <button key={period} type="button"
                        onClick={() => {
                            if (disabled) return;
                            if (!parsed) { onChange(`${period === "PM" ? "20" : "08"}:00`); return; }
                            emit(h, m, period);
                        }}
                        style={{
                            width: 38, height: "100%", border: "none",
                            background: parsed && p === period ? (dark ? "rgba(99,102,241,0.35)" : "#ede9fe") : "transparent",
                            color: parsed && p === period ? theme.primary : theme.textMute,
                            fontSize: 11, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
                            fontFamily: "inherit", transition: "all .15s",
                            borderLeft: period === "PM" ? `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` : "none",
                        }}>{period}</button>
                ))}
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────
// PremiumSelect
// ─────────────────────────────────────────────────────────────────
function PremiumSelect({ options = [], value = "", onChange, placeholder = "Select…", theme, dark, disabled = false }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div ref={wrapRef} style={{ position: "relative", width: "100%", zIndex: 500 }}>
            <button type="button" onClick={() => !disabled && setOpen(v => !v)} style={{
                width: "100%", height: 46, padding: "0 14px", borderRadius: 12,
                border: `1.5px solid ${open ? theme.primary : theme.inputBorder}`,
                background: theme.triggerBg, color: selected ? theme.text : theme.textMute,
                fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                fontFamily: "inherit", boxShadow: open ? `0 0 0 3px ${theme.primarySoft}` : "none",
                opacity: disabled ? 0.5 : 1, transition: "all .15s",
            }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {open && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999, background: theme.menuBg, border: `1px solid ${theme.borderStrong}`, borderRadius: 12, boxShadow: theme.shadow, overflow: "hidden", animation: "bk-drop .15s ease" }}>
                    <div style={{ maxHeight: 220, overflowY: "auto", scrollbarWidth: "none", padding: "6px" }}>
                        {options.map(o => {
                            const isSel = String(o.value) === String(value);
                            return (
                                <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                                    style={{ padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: isSel ? 600 : 400, background: isSel ? theme.primary : "transparent", color: isSel ? "#fff" : theme.text, transition: "background .1s" }}
                                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = theme.surfaceSofter; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                                    {o.label}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const HOURS   = Array.from({ length: 24 }, (_, i) => i); // 00–23 full 24hr
const HOUR_H  = 52; // px per hour
const TOTAL_H = HOUR_H * 24;

function toISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtDate(d) { return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }); }
function timeToMin(t) { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minToY(min) { return Math.max(0, min / 60 * HOUR_H); } // 0-based: 00:00 = top

function statusCfg(status, theme) {
    return ({
        pending:    { label: "Pending",    color: theme.warning,  bg: theme.warningSoft },
        approved:   { label: "Approved",   color: theme.success,  bg: theme.successSoft },
        rejected:   { label: "Rejected",   color: theme.danger,   bg: theme.dangerSoft },
        cancelled:  { label: "Cancelled",  color: theme.textMute, bg: theme.surfaceSoft },
        waitlisted: { label: "Waitlisted", color: "#a78bfa",      bg: "rgba(167,139,250,0.12)" },
        completed:  { label: "Completed",  color: theme.success,  bg: theme.successSoft },
    }[status] || { label: status, color: theme.textMute, bg: theme.surfaceSoft });
}

function StatusBadge({ status, theme }) {
    const c = statusCfg(status, theme);
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: c.color, background: c.bg }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, display: "inline-block" }} />
            {c.label}
        </span>
    );
}

function Avatar({ name = "?", url, size = 32 }) {
    const bg = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"][name.charCodeAt(0) % 6];
    return url
        ? <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{name.slice(0, 2).toUpperCase()}</div>;
}

function Lbl({ children, theme }) {
    return <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textSoft, marginBottom: 6 }}>{children}</label>;
}

function Inp({ value, onChange, placeholder, type = "text", disabled, theme, error }) {
    const [f, setF] = useState(false);
    return <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13, fontFamily: "inherit", background: theme.inputBg, color: theme.text, border: `1.5px solid ${error ? theme.danger : f ? theme.primary : theme.inputBorder}`, boxShadow: f ? `0 0 0 3px ${theme.primarySoft}` : "none", outline: "none", boxSizing: "border-box", transition: "all .15s", opacity: disabled ? 0.5 : 1 }} />;
}

function Txt({ value, onChange, placeholder, rows = 3, theme }) {
    const [f, setF] = useState(false);
    return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13, fontFamily: "inherit", resize: "none", background: theme.inputBg, color: theme.text, border: `1.5px solid ${f ? theme.primary : theme.inputBorder}`, boxShadow: f ? `0 0 0 3px ${theme.primarySoft}` : "none", outline: "none", boxSizing: "border-box", transition: "all .15s" }} />;
}

function Toggle({ value, onChange, color }) {
    return (
        <div onClick={() => onChange(!value)} style={{ width: 42, height: 23, borderRadius: 12, background: value ? color : "#cbd5e1", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 17, height: 17, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Modal Shell
// ─────────────────────────────────────────────────────────────────
function Modal({ onClose, theme, title, subtitle, icon, grad, children, maxWidth = 560 }) {
    useEffect(() => {
        const h = e => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [onClose]);
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ position: "absolute", inset: 0, background: theme.overlay, backdropFilter: "blur(6px)" }} onClick={onClose} />
            <div style={{ position: "relative", width: "100%", maxWidth, maxHeight: "92vh", background: theme.surface, borderRadius: 24, overflow: "hidden", border: `1px solid ${theme.borderStrong}`, boxShadow: theme.shadow, display: "flex", flexDirection: "column", animation: "bk-modal .22s ease" }} onClick={e => e.stopPropagation()}>
                <div style={{ background: grad, padding: "20px 26px 16px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "1.5px solid rgba(255,255,255,0.2)", flexShrink: 0 }}>{icon}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>{subtitle}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-.3px" }}>{title}</div>
                        </div>
                        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}>×</button>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px", scrollbarWidth: "none" }}>{children}</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Time Calendar
// Layout:
//   ┌──────────┬────────────────────────────────────┐
//   │ (corner) │ 00:00  01:00  02:00  ...  23:00    │  ← time header (top)
//   ├──────────┼────────────────────────────────────┤
//   │  Room 1  │  ███ booking ███                   │  ← resource rows
//   ├──────────┼────────────────────────────────────┤
//   │  Room 2  │                                    │
//   └──────────┴────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────
function TimeCalendar({ bookings, resources, type, theme, dark }) {
    const typeColor  = type === "room" ? theme.roomColor : theme.carColor;
    const filtered   = resources.filter(r => r.type === type);
    const isEmpty    = filtered.length === 0;
    const TOTAL_MINS = 24 * 60;
    const RES_W      = 140;
    const ROW_H      = 68;
    const HDR_H      = 40;
    const MIN_TL_W   = 1080; // minimum timeline width (scroll appears below this)
    const timeMarks  = Array.from({ length: 24 }, (_, i) => i);

    const byResource = useMemo(() => {
        const map = {};
        filtered.forEach(r => { map[r.id] = { resource: r, bookings: [] }; });
        bookings.forEach(b => { if (b.resource && map[b.resource.id]) map[b.resource.id].bookings.push(b); });
        return Object.values(map);
    }, [bookings, filtered.map(r => r.id).join(","), type]);

    const pct = (min) => `${Math.max(0, Math.min(100, (min / TOTAL_MINS) * 100))}%`;

    const TimelineCell = ({ rBk, rowIdx }) => (
        <div style={{ flex: 1, minWidth: MIN_TL_W, position: "relative", height: ROW_H, overflow: "hidden", background: rowIdx % 2 === 0 ? "transparent" : theme.surfaceSoft }}>
            {timeMarks.map(h => h > 0 && (
                <div key={h} style={{ position: "absolute", left: `${(h / 24) * 100}%`, top: 0, bottom: 0, width: 1, background: h % 6 === 0 ? theme.border : theme.calLine }} />
            ))}
            {rBk.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: 10, color: theme.textMute, opacity: 0.3 }}>Free</span>
                </div>
            )}
            {rBk.map(b => {
                const sMin  = timeToMin(b.start_time);
                const eMin  = b.end_time ? timeToMin(b.end_time) : TOTAL_MINS;
                const left  = pct(sMin);
                const width = `${Math.max(0.5, (eMin - sMin) / TOTAL_MINS * 100)}%`;
                const isApp = b.status === "approved";
                const color = isApp ? typeColor : theme.warning;
                return (
                    <div key={b.id}
                        title={[b.user?.name, `${b.start_time}${b.end_time ? `–${b.end_time}` : "→"}`, b.purpose && `Reason: ${b.purpose}`].filter(Boolean).join(" · ")}
                        style={{ position: "absolute", left, width, top: 5, bottom: 5, borderRadius: 7, background: isApp ? `${color}22` : `${color}0e`, border: `1.5px ${isApp ? "solid" : "dashed"} ${color}`, borderLeft: `3px solid ${color}`, padding: "3px 7px", overflow: "hidden", cursor: "default", minWidth: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.user?.name || "—"}</div>
                        <div style={{ fontSize: 9, color: theme.textMute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.start_time}{b.end_time ? `–${b.end_time}` : "→"}</div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto", scrollbarWidth: "none" }}>
                {/* Header */}
                <div style={{ display: "flex", borderBottom: `2px solid ${theme.border}`, background: theme.surfaceSoft, position: "sticky", top: 0, zIndex: 10 }}>
                    <div style={{ width: RES_W, flexShrink: 0, height: HDR_H, borderRight: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".1em" }}>{type === "room" ? "Rooms" : "Cars"}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: MIN_TL_W, height: HDR_H, position: "relative" }}>
                        {timeMarks.map(h => (
                            <div key={h} style={{ position: "absolute", left: `${(h / 24) * 100}%`, top: 0, bottom: 0, display: "flex", alignItems: "flex-end", paddingBottom: 5, paddingLeft: 3 }}>
                                {h > 0 && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 1, background: h % 6 === 0 ? theme.border : theme.calLine }} />}
                                <span style={{ fontSize: h % 6 === 0 ? 10 : 9, fontWeight: h % 6 === 0 ? 700 : 400, color: h % 6 === 0 ? theme.textSoft : theme.textMute, whiteSpace: "nowrap" }}>
                                    {String(h).padStart(2, "0")}:00
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                {isEmpty ? (
                    <div style={{ display: "flex" }}>
                        <div style={{ width: RES_W, flexShrink: 0, borderRight: `1px solid ${theme.border}`, height: ROW_H * 3 }} />
                        <div style={{ flex: 1, minWidth: MIN_TL_W, height: ROW_H * 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <div style={{ fontSize: 32, opacity: 0.12 }}>{type === "room" ? "🏢" : "🚗"}</div>
                            <div style={{ fontSize: 13, color: theme.textMute, fontWeight: 600 }}>No {type === "room" ? "meeting rooms" : "cars"} registered yet</div>
                            <div style={{ fontSize: 11, color: theme.textMute, opacity: 0.6 }}>Go to Manage Resources to add one</div>
                        </div>
                    </div>
                ) : byResource.map(({ resource: r, bookings: rBk }, idx) => (
                    <div key={r.id} style={{ display: "flex", borderBottom: idx < byResource.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                        <div style={{ width: RES_W, flexShrink: 0, height: ROW_H, borderRight: `1px solid ${theme.border}`, padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center", background: type === "room" ? theme.roomSoft : theme.carSoft }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: typeColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                            <div style={{ fontSize: 10, color: theme.textMute, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {type === "room" && [r.location && `Floor ${r.location}`, r.capacity && `${r.capacity} seats`].filter(Boolean).join(" · ")}
                                {type === "car" && [r.plate_number, r.driver?.name].filter(Boolean).join(" · ")}
                            </div>
                        </div>
                        <TimelineCell rBk={rBk} rowIdx={idx} />
                    </div>
                ))}
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────
// Booking Modal — 3 steps, premium UI, TimePicker
// ─────────────────────────────────────────────────────────────────
function BookingModal({ type, defaultDate, onClose, theme, dark, onSuccess }) {
    const isCar = type === "car";
    const typeColor = isCar ? theme.carColor : theme.primary;
    const typeGrad  = isCar ? "linear-gradient(135deg,#92400e,#d97706)" : "linear-gradient(135deg,#3730a3,#6366f1)";

    const [step, setStep]             = useState(1);
    const [date, setDate]             = useState(defaultDate || toISO(new Date()));
    const [startTime, setStartTime]   = useState("");
    const [endTime, setEndTime]       = useState("");
    const [capacity, setCapacity]     = useState("");
    const [isOpenEnded, setOpenEnded] = useState(false);
    const [resources, setResources]   = useState([]);
    const [loading, setLoading]       = useState(false);
    const [selected, setSelected]     = useState(null);
    const [purpose, setPurpose]       = useState("");
    const [errors, setErrors]         = useState({});
    const [submitting, setSubmitting] = useState(false);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        const p = new URLSearchParams({ type, date, start_time: startTime });
        if (endTime && !isOpenEnded) p.append("end_time", endTime);
        if (!isCar && capacity) p.append("capacity", capacity);
        try {
            const res = await fetch(`/bookings/available-resources?${p}`, { headers: { "X-Requested-With": "XMLHttpRequest" } });
            const data = await res.json();
            setResources(data.resources || []);
        } catch {}
        setLoading(false);
    }, [type, date, startTime, endTime, capacity, isOpenEnded, isCar]);

    useEffect(() => { if (step === 2) fetchResources(); }, [step]);

    const submit = () => {
        const e = {};
        if (!purpose.trim()) e.purpose = "Please describe the purpose";
        if (!selected) e.resource = "Please select a resource";
        if (Object.keys(e).length) { setErrors(e); return; }
        setSubmitting(true);
        router.post("/bookings", {
            resource_id: selected.id, booking_date: date,
            start_time: startTime, end_time: isOpenEnded ? null : endTime || null,
            purpose, is_open_ended: isOpenEnded,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                onSuccess({ type, date, startTime, endTime });
                onClose();
            },
            onError: errs => {
                setSubmitting(false);
                setErrors(errs);
                if (errs.time) {
                    // go back to step 1 to show error
                    setStep(1);
                }
                toast(errs.time || "Failed to submit. Please try again.", "error");
            },
        });
    };

    const canNext = (() => {
        if (!date || !startTime) return false;
        if (!isOpenEnded && !endTime) return false;
        if (!isOpenEnded && endTime && startTime >= endTime) return false;
        return true;
    })();

    const handleNext = () => {
        if (!isOpenEnded && startTime && endTime && startTime >= endTime) {
            setErrors(e => ({ ...e, time: "End time must be later than start time." }));
            return;
        }
        setErrors({});
        setStep(2);
    };

    const stepBar = (
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {[1,2,3].map(s => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: step >= s ? typeColor : theme.border, transition: "background .25s" }} />
            ))}
        </div>
    );

    const BtnPrimary = ({ onClick, disabled, children }) => (
        <button onClick={onClick} disabled={disabled} style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: !disabled ? `linear-gradient(135deg,${typeColor},${typeColor}cc)` : theme.border,
            color: !disabled ? "#fff" : theme.textMute, fontSize: 14, fontWeight: 700,
            cursor: !disabled ? "pointer" : "not-allowed", fontFamily: "inherit",
            boxShadow: !disabled ? `0 4px 16px ${typeColor}40` : "none", transition: "all .2s",
        }}>{children}</button>
    );

    return (
        <Modal onClose={onClose} theme={theme}
            title={isCar ? "Request Company Car" : "Reserve Meeting Room"}
            subtitle={step === 1 ? "Step 1 — Set Date & Time" : step === 2 ? "Step 2 — Select Resource" : "Step 3 — Confirm & Submit"}
            icon={isCar ? "🚗" : "🏢"} grad={typeGrad}>

            {stepBar}

            {/* ─ Step 1 ─ */}
            {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                        <Lbl theme={theme}>Date</Lbl>
                        <Inp type="date" value={date} onChange={e => setDate(e.target.value)} theme={theme} />
                    </div>

                    {/* Time pickers — fit-content width */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                            <Lbl theme={theme}>Start Time</Lbl>
                            <TimePicker value={startTime} onChange={v => { setStartTime(v); if (errors.time) setErrors(e => ({...e, time: ""})); }} theme={theme} dark={dark} />
                        </div>
                        <div>
                            <Lbl theme={theme}>End Time</Lbl>
                            <TimePicker value={endTime} onChange={v => { setEndTime(v); if (errors.time) setErrors(e => ({...e, time: ""})); }} theme={theme} dark={dark} disabled={isOpenEnded} />
                        </div>
                    </div>
                    {errors.time && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: theme.dangerSoft, border: `1px solid ${theme.danger}40`, fontSize: 12, color: theme.danger, fontWeight: 500 }}>
                            ⚠️ {errors.time}
                        </div>
                    )}

                    {isCar && (
                        <div style={{ padding: "14px 16px", borderRadius: 14, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>Return time unknown</div>
                                <div style={{ fontSize: 11, color: theme.textMute, marginTop: 3 }}>Open-ended — join the waitlist if the car is out</div>
                            </div>
                            <Toggle value={isOpenEnded} onChange={setOpenEnded} color={theme.carColor} />
                        </div>
                    )}

                    {/* Car conflict warning for open-ended */}
                    {isCar && !isOpenEnded && startTime && endTime && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: theme.warningSoft, border: `1px solid ${theme.warning}30`, fontSize: 12, color: theme.warning }}>
                            ℹ️ If another booking exists without a return time, your request will be added to the waitlist.
                        </div>
                    )}

                    {!isCar && (
                        <div>
                            <Lbl theme={theme}>Number of Attendees <span style={{ color: theme.textMute, fontWeight: 400 }}>(optional — filters by seat capacity)</span></Lbl>
                            <Inp type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 8" theme={theme} />
                        </div>
                    )}

                    <BtnPrimary onClick={handleNext} disabled={!canNext}>
                        Continue — View Available {isCar ? "Cars" : "Rooms"} →
                    </BtnPrimary>
                </div>
            )}

            {/* ─ Step 2 ─ */}
            {step === 2 && (
                <div>
                    <div style={{ padding: "10px 14px", borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, fontSize: 12, color: theme.textSoft, marginBottom: 16 }}>
                        📅 {date} · ⏰ {startTime}{endTime && !isOpenEnded ? `–${endTime}` : isOpenEnded ? " (open-ended)" : ""}
                        {!isCar && capacity ? ` · 👥 ${capacity} attendees` : ""}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "48px", color: theme.textMute, fontSize: 13 }}>⏳ Checking availability…</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                            {resources.length === 0 && <p style={{ color: theme.textMute, fontSize: 13, textAlign: "center", padding: "32px" }}>No {isCar ? "cars" : "rooms"} found.</p>}
                            {resources.map(r => {
                                const isAvail = r.is_available, isSel = selected?.id === r.id;
                                return (
                                    <div key={r.id} onClick={() => isAvail && setSelected(isSel ? null : r)}
                                        style={{ padding: "14px 16px", borderRadius: 14, border: `2px solid ${isSel ? typeColor : isAvail ? theme.border : theme.border}`, background: isSel ? (isCar ? theme.carSoft : theme.roomSoft) : theme.surfaceSoft, cursor: isAvail ? "pointer" : "not-allowed", opacity: isAvail ? 1 : 0.5, transition: "all .15s" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 12, background: isCar ? theme.carSoft : theme.roomSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{isCar ? "🚗" : "🏢"}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{r.name}</span>
                                                    {isSel && <span style={{ fontSize: 10, fontWeight: 700, color: typeColor, background: `${typeColor}18`, padding: "2px 8px", borderRadius: 8 }}>✓ Selected</span>}
                                                    {isAvail
                                                        ? <span style={{ fontSize: 10, color: theme.success, background: theme.successSoft, padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>✓ Available</span>
                                                        : <span style={{ fontSize: 10, color: theme.danger, background: theme.dangerSoft, padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>
                                                            {r.is_open_ended_out ? "Currently out" : r.available_from ? `Free from ${r.available_from}` : "Unavailable"}
                                                        </span>
                                                    }
                                                </div>
                                                <div style={{ fontSize: 11, color: theme.textSoft, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                                    {r.location && <span>📍 {r.location}</span>}
                                                    {r.capacity && <span>👥 {r.capacity} {isCar ? "passengers" : "seats"}</span>}
                                                    {isCar && r.driver && <span>🧑‍✈️ {r.driver.name}</span>}
                                                    {isCar && r.plate_number && <span style={{ fontFamily: "monospace" }}>{r.plate_number}</span>}
                                                </div>
                                                {r.rules && <div style={{ fontSize: 10, color: theme.textMute, marginTop: 4 }}>📋 {r.rules}</div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {errors.resource && <p style={{ color: theme.danger, fontSize: 11, marginBottom: 10 }}>{errors.resource}</p>}
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => { setStep(1); setSelected(null); }} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                        <button onClick={() => selected && setStep(3)} disabled={!selected} style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: !selected ? theme.border : `linear-gradient(135deg,${typeColor},${typeColor}cc)`, color: !selected ? theme.textMute : "#fff", fontSize: 14, fontWeight: 700, cursor: !selected ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: !selected ? "none" : `0 4px 16px ${typeColor}40`, transition: "all .2s" }}>Continue — Add Details →</button>
                    </div>
                </div>
            )}

            {/* ─ Step 3 ─ */}
            {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ padding: "16px 18px", borderRadius: 16, background: isCar ? theme.carSoft : theme.roomSoft, border: `1px solid ${typeColor}30` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${typeColor}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{isCar ? "🚗" : "🏢"}</div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>{selected?.name}</div>
                                <div style={{ fontSize: 12, color: theme.textSoft, marginTop: 3 }}>
                                    {selected?.location && (isCar ? `Location: ${selected.location} · ` : `Floor ${selected.location} · `)}
                                    📅 {date} · ⏰ {startTime}{endTime && !isOpenEnded ? `–${endTime}` : " (open-ended)"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Lbl theme={theme}>Purpose / Reason *</Lbl>
                        <Txt value={purpose} onChange={e => setPurpose(e.target.value)}
                            placeholder={isCar ? "e.g. Airport pickup, Client site visit, Errands…" : "e.g. Weekly team standup, Client presentation, Workshop…"}
                            rows={3} theme={theme} />
                        {errors.purpose && <p style={{ color: theme.danger, fontSize: 11, margin: "5px 0 0" }}>{errors.purpose}</p>}
                    </div>

                    {errors.time && <p style={{ color: theme.danger, fontSize: 12 }}>⚠️ {errors.time}</p>}

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setStep(2)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                        <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${typeColor},${typeColor}cc)`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${typeColor}40`, opacity: submitting ? 0.7 : 1, transition: "all .2s" }}>
                            {submitting ? "Confirming…" : selected?.is_open_ended_out ? "Join Waitlist" : "Confirm Booking"}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────
// Resource Form Modal
// ─────────────────────────────────────────────────────────────────
function ResourceModal({ resource, users, onClose, theme, dark }) {
    const isEdit = !!resource;
    const [form, setForm] = useState({
        type: resource?.type || "room", name: resource?.name || "",
        location: resource?.location || "", capacity: resource?.capacity || "",
        rules: resource?.rules || "", plate_number: resource?.plate_number || "",
        driver_id: resource?.driver?.id ? String(resource.driver.id) : "",
        is_active: resource?.is_active ?? true,
    });
    const [errors, setErrors]       = useState({});
    const [submitting, setSubmitting] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (form.type === "car" && !form.plate_number.trim()) e.plate_number = "Plate number is required";
        if (form.type === "car" && !form.driver_id) e.driver_id = "Please assign a driver";
        return e;
    };

    const submit = () => {
        const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
        setSubmitting(true);
        const payload = { ...form, capacity: form.capacity || null };
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                toast(isEdit ? "Resource updated successfully." : `${form.type === "room" ? "Room" : "Car"} registered successfully.`);
                onClose();
            },
            onError: errs => { setSubmitting(false); setErrors(errs); toast("Failed to save resource.", "error"); },
        };
        isEdit ? router.put(`/bookings/resources/${resource.id}`, payload, opts) : router.post("/bookings/resources", payload, opts);
    };

    const driverOpts = (users || []).map(u => ({ value: String(u.id), label: u.name }));

    return (
        <Modal onClose={onClose} theme={theme}
            title={isEdit ? `Edit ${resource.type === "car" ? "Car" : "Room"}` : "Register New Resource"}
            subtitle="Resource Management" icon={form.type === "car" ? "🚗" : "🏢"}
            grad={form.type === "car"
                ? "linear-gradient(135deg,#92400e,#d97706)"
                : "linear-gradient(135deg,#3730a3,#6366f1)"
            }>

            {!isEdit && (
                <div style={{ display: "flex", gap: 8, marginBottom: 22, padding: 4, background: theme.surfaceSoft, borderRadius: 14, border: `1px solid ${theme.border}` }}>
                    {[{ v: "room", l: "🏢 Meeting Room", c: theme.primary }, { v: "car", l: "🚗 Company Car", c: theme.carColor }].map(t => (
                        <button key={t.v} onClick={() => set("type", t.v)} style={{
                            flex: 1, padding: "11px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .18s",
                            background: form.type === t.v ? t.c : "transparent", border: `2px solid ${form.type === t.v ? t.c : "transparent"}`,
                            color: form.type === t.v ? "#fff" : theme.textSoft, boxShadow: form.type === t.v ? `0 4px 14px ${t.c}40` : "none",
                        }}>{t.l}</button>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                    <Lbl theme={theme}>Name *</Lbl>
                    <Inp value={form.name} onChange={e => set("name", e.target.value)} placeholder={form.type === "room" ? "e.g. Meeting Room A, Boardroom" : "e.g. Toyota Camry 2023"} theme={theme} error={errors.name} />
                    {errors.name && <p style={{ color: theme.danger, fontSize: 11, margin: "5px 0 0" }}>{errors.name}</p>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                        <Lbl theme={theme}>{form.type === "room" ? "Floor / Location" : "Parking Location"}</Lbl>
                        <Inp value={form.location} onChange={e => set("location", e.target.value)} placeholder={form.type === "room" ? "e.g. Floor 2" : "e.g. Parking B1"} theme={theme} />
                    </div>
                    <div>
                        <Lbl theme={theme}>{form.type === "room" ? "Seat Capacity" : "Passenger Capacity"}</Lbl>
                        <Inp type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="e.g. 10" theme={theme} />
                    </div>
                </div>

                {form.type === "car" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                            <Lbl theme={theme}>Plate Number *</Lbl>
                            <Inp value={form.plate_number} onChange={e => set("plate_number", e.target.value)} placeholder="e.g. PP-1234" theme={theme} error={errors.plate_number} />
                            {errors.plate_number && <p style={{ color: theme.danger, fontSize: 11, margin: "5px 0 0" }}>{errors.plate_number}</p>}
                        </div>
                        <div>
                            <Lbl theme={theme}>Assigned Driver *</Lbl>
                            <PremiumSelect options={driverOpts} value={form.driver_id} onChange={v => set("driver_id", v)} placeholder="Select driver…" theme={theme} dark={dark} />
                            {errors.driver_id && <p style={{ color: theme.danger, fontSize: 11, margin: "5px 0 0" }}>{errors.driver_id}</p>}
                        </div>
                    </div>
                )}

                <div>
                    <Lbl theme={theme}>{form.type === "room" ? "Room Rules" : "Usage Notes"}</Lbl>
                    <Txt value={form.rules} onChange={e => set("rules", e.target.value)} placeholder={form.type === "room" ? "e.g. No food allowed, Max 2 hours per booking" : "e.g. Return with full fuel, Clean interior after use"} rows={2} theme={theme} />
                </div>

                {isEdit && (
                    <div style={{ padding: "14px 16px", borderRadius: 14, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>Active</div>
                            <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2 }}>Inactive resources are hidden from bookings</div>
                        </div>
                        <Toggle value={form.is_active} onChange={v => set("is_active", v)} color={theme.success} />
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(99,102,241,0.3)", opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Register Resource"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────
// Reject Modal
// ─────────────────────────────────────────────────────────────────
function RejectModal({ booking, onClose, theme, dark }) {
    const [reason, setReason]         = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr]               = useState("");
    const submit = () => {
        if (!reason.trim()) { setErr("A reason is required."); return; }
        setSubmitting(true);
        router.patch(`/bookings/${booking.id}/reject`, { reject_reason: reason }, {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); toast("Booking rejected."); onClose(); },
            onError: () => { setSubmitting(false); toast("Failed to reject.", "error"); },
        });
    };
    return (
        <Modal onClose={onClose} theme={theme} title="Reject Booking" subtitle="HR Action" icon="❌"
            grad="linear-gradient(135deg,#7f1d1d,#dc2626)" maxWidth={460}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: "12px 14px", borderRadius: 12, background: theme.dangerSoft, border: `1px solid ${theme.danger}30`, fontSize: 13, color: theme.textSoft }}>
                    Rejecting <strong style={{ color: theme.text }}>{booking.user?.name}</strong>'s booking for <strong style={{ color: theme.text }}>{booking.resource?.name}</strong>
                </div>
                <div>
                    <Lbl theme={theme}>Reason for Rejection *</Lbl>
                    <Txt value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this booking cannot be approved…" rows={3} theme={theme} />
                    {err && <p style={{ color: theme.danger, fontSize: 11, margin: "5px 0 0" }}>{err}</p>}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1, boxShadow: "0 4px 14px rgba(239,68,68,0.3)" }}>
                        {submitting ? "Rejecting…" : "Reject Booking"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────
// Booking Row — Leave Index style
// ─────────────────────────────────────────────────────────────────
function BookingRow({ booking: b, isHR, onReject, onMarkReturned, onDelete, theme, dark, isLast }) {
    const [approving, setApproving] = useState(false);
    const isCar  = b.resource?.type === "car";
    const color  = isCar ? theme.carColor : theme.primary;
    const cfg    = statusCfg(b.status, theme);
    const accentColor = b.status === "approved" ? theme.success : b.status === "rejected" ? theme.danger : theme.primary;

    const approve = () => {
        setApproving(true);
        router.patch(`/bookings/${b.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => setApproving(false),
            onError: () => { setApproving(false); toast("Failed to approve.", "error"); },
        });
    };

    return (
        <div style={{
            display: "flex", alignItems: "stretch",
            borderBottom: isLast ? "none" : `1px solid ${theme.border}`,
        }}>
            {/* Left accent */}
            <div style={{ width: 3, flexShrink: 0, background: accentColor, borderRadius: "3px 0 0 3px" }} />

            {/* Content */}
            <div style={{ flex: 1, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                {isHR && <Avatar name={b.user?.name} url={b.user?.avatar_url} size={36} />}

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                        {isHR && <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{b.user?.name}</span>}
                        <StatusBadge status={b.status} theme={theme} />
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>
                            {isCar ? "🚗" : "🏢"} {b.resource?.name}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: theme.textMute, marginBottom: b.purpose ? 6 : 0 }}>
                        <span>📅 {b.booking_date}</span>
                        <span>⏰ {b.start_time}{b.end_time ? `–${b.end_time}` : " (open-ended)"}</span>
                    </div>
                    {/* Reason — Leave Request style */}
                    {b.purpose && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 1, flexShrink: 0 }}>Reason</span>
                            <span style={{ fontSize: 12, color: theme.textSoft }}>{b.purpose}</span>
                        </div>
                    )}
                    {b.reject_reason && (
                        <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 8, background: theme.dangerSoft, fontSize: 12, color: theme.danger, display: "flex", gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0, marginTop: 1 }}>Rejected</span>
                            <span>{b.reject_reason}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {isHR && b.status === "pending" && (
                        <>
                            <button onClick={approve} disabled={approving}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 10, border: "none", background: dark ? "rgba(16,185,129,0.2)" : "#059669", color: dark ? "#34d399" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(16,185,129,0.2)" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                {approving ? "…" : "Approve"}
                            </button>
                            <button onClick={() => onReject(b)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 10, border: "none", background: dark ? "rgba(239,68,68,0.18)" : "#ef4444", color: dark ? "#f87171" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(239,68,68,0.15)" }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Reject
                            </button>
                        </>
                    )}
                    {isHR && b.status === "approved" && isCar && b.is_open_ended && !b.returned_at && (
                        <button onClick={() => onMarkReturned(b.id)}
                            style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: theme.warning, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            🏁 Mark Returned
                        </button>
                    )}
                    {!isHR && (b.status === "pending" || b.status === "approved") && (
                        <button onClick={() => onDelete(b)} title="Cancel booking"
                            style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "rgba(248,113,113,0.4)" : "#fca5a5", transition: "all .15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = dark ? "rgba(248,113,113,0.16)" : "#fee2e2"; e.currentTarget.style.color = dark ? "#f87171" : "#dc2626"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = dark ? "rgba(248,113,113,0.4)" : "#fca5a5"; }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Delete Confirm Modal — Leave Request style
// ─────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ booking, onClose, theme, dark }) {
    const [deleting, setDeleting] = useState(false);
    const isCar = booking.resource?.type === "car";

    const confirm = () => {
        setDeleting(true);
        router.patch(`/bookings/${booking.id}/cancel`, {}, {
            preserveScroll: true,
            onSuccess: () => { setDeleting(false); onClose(); },
            onError: () => { setDeleting(false); toast("Failed to cancel.", "error"); },
        });
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ position: "absolute", inset: 0, background: theme.overlay, backdropFilter: "blur(4px)" }} onClick={onClose} />
            <div style={{ position: "relative", width: "100%", maxWidth: 400, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.borderStrong}`, boxShadow: theme.shadow, overflow: "hidden", animation: "bk-modal .2s ease" }} onClick={e => e.stopPropagation()}>
                <div style={{ background: "linear-gradient(135deg,#7f1d1d,#dc2626)", padding: "18px 22px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🗑️</div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>Confirm Cancellation</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Cancel this booking?</div>
                        </div>
                        <button onClick={onClose} style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                </div>
                <div style={{ padding: "20px 22px" }}>
                    <div style={{ padding: "12px 14px", borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, marginBottom: 18 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                            {isCar ? "🚗" : "🏢"} {booking.resource?.name}
                        </div>
                        <div style={{ fontSize: 12, color: theme.textMute }}>
                            📅 {booking.booking_date} · ⏰ {booking.start_time}{booking.end_time ? `–${booking.end_time}` : " (open-ended)"}
                        </div>
                        {booking.purpose && (
                            <div style={{ fontSize: 12, color: theme.textSoft, marginTop: 4 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".06em" }}>Reason </span>
                                {booking.purpose}
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: 13, color: theme.textSoft, marginBottom: 18 }}>This booking will be cancelled and cannot be undone.</p>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 11, border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Keep Booking</button>
                        <button onClick={confirm} disabled={deleting} style={{ flex: 1, padding: "11px", borderRadius: 11, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: deleting ? 0.7 : 1, boxShadow: "0 4px 14px rgba(239,68,68,0.3)" }}>
                            {deleting ? "Cancelling…" : "Yes, Cancel"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Resource Card (Manage tab)
// ─────────────────────────────────────────────────────────────────
function ResourceCard({ resource: r, onEdit, theme, dark }) {
    const isCar = r.type === "car";
    const color = isCar ? theme.carColor : theme.primary;

    const InfoRow = ({ label, value }) => value ? (
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0, minWidth: 52 }}>{label}</span>
            <span style={{ fontSize: 12, color: theme.textSoft, fontWeight: 500 }}>{value}</span>
        </div>
    ) : null;

    return (
        <div style={{ background: theme.surface, borderRadius: 16, border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: theme.shadowSm, transition: "transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = theme.shadow; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = theme.shadowSm; }}>
            <div style={{ height: 3, background: `linear-gradient(90deg,${color},${color}88)` }} />
            <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: isCar ? theme.carSoft : theme.roomSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{isCar ? "🚗" : "🏢"}</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{r.name}</div>
                            {isCar && r.plate_number && (
                                <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "monospace" }}>{r.plate_number}</span>
                            )}
                        </div>
                    </div>
                    <button onClick={() => onEdit(r)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${theme.border}`, background: "transparent", color: theme.textMute, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "all .15s", flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMute; }}>✏️</button>
                </div>

                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
                    {!isCar && <InfoRow label="Floor" value={r.location} />}
                    {isCar && <InfoRow label="Location" value={r.location} />}
                    <InfoRow label={isCar ? "Seats" : "Capacity"} value={r.capacity ? `${r.capacity} ${isCar ? "passengers" : "seats"}` : null} />
                    {isCar && <InfoRow label="Driver" value={r.driver?.name} />}
                    {r.rules && <InfoRow label="Rules" value={r.rules} />}
                </div>

                {(!r.is_active || r.is_open_ended_active) && (
                    <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {!r.is_active && <span style={{ fontSize: 10, fontWeight: 700, color: theme.danger, background: theme.dangerSoft, padding: "2px 8px", borderRadius: 6 }}>Inactive</span>}
                        {r.is_open_ended_active && <span style={{ fontSize: 10, fontWeight: 700, color: theme.warning, background: theme.warningSoft, padding: "2px 8px", borderRadius: 6 }}>⚠️ Currently Out</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function BookingsIndex({ resources, pendingBookings, myBookings, stats, isHR, users }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [calType, setCalType]           = useState("room");
    const [calDate, setCalDate]           = useState(new Date());
    const [calBookings, setCalBookings]   = useState([]);
    const [calLoading, setCalLoading]     = useState(false);
    const [tab, setTab]                   = useState("calendar");
    const [myType, setMyType]             = useState("room");
    const [bookingModal, setBookingModal] = useState(null);
    const [resourceModal, setResourceModal] = useState(false);
    const [rejectModal, setRejectModal]   = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // booking to cancel

    const latestCalRequest = useRef(0);

    const fetchCalDirect = useCallback(async (t, d) => {
        const requestId = ++latestCalRequest.current;

        setCalLoading(true);
        setCalBookings([]);

        try {
            const params = new URLSearchParams({
                type: t,
                date: d,
                _: String(Date.now()),
            });

            const res = await fetch(`/bookings/calendar?${params.toString()}`, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "application/json",
                    "Cache-Control": "no-cache",
                },
                cache: "no-store",
            });

            const data = await res.json();

            // Latest request ပဲ UI ကို update လုပ်ခွင့်ရှိမယ်။
            // April 30 request က May 1 request ထက်နောက်မှပြန်လာရင် ignore လုပ်မယ်။
            if (requestId === latestCalRequest.current) {
                setCalBookings(data.bookings || []);
            }
        } catch {
            if (requestId === latestCalRequest.current) {
                setCalBookings([]);
            }
        } finally {
            if (requestId === latestCalRequest.current) {
                setCalLoading(false);
            }
        }
    }, []);

    // Fetch when tab/type/date changes (normal navigation)
    useEffect(() => {
        if (tab === "calendar") {
            fetchCalDirect(calType, toISO(calDate));
        }
    }, [calType, calDate, tab, fetchCalDirect]);

    // After booking success:
    // 1. Switch to correct calendar (type + date from the booking form)
    // 2. Fetch with explicit args — no state dependency, always correct
    const handleBookingSuccess = useCallback(({ type: bType, date: bDate }) => {
        const targetDate = bDate;

        setTab("calendar");
        setCalType(bType);
        setCalDate(new Date(`${targetDate}T00:00:00`));

        fetchCalDirect(bType, targetDate);
    }, [fetchCalDirect]);

    const markReturned = id => router.patch(`/bookings/${id}/returned`, {}, {
        preserveScroll: true,
        onSuccess: () => toast("Car marked as returned."),
    });

    const rooms = resources.filter(r => r.type === "room");
    const cars  = resources.filter(r => r.type === "car");
    const filteredMyBookings = myBookings.filter(b => b.resource?.type === myType);
    const myRoomCount = myBookings.filter(b => b.resource?.type === "room").length;
    const myCarCount  = myBookings.filter(b => b.resource?.type === "car").length;


    const tabBtn = (t, label, active, badgeCount) => (
        <button onClick={() => setTab(t)} style={{
            padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all .15s",
            background: active ? theme.primary : "transparent", color: active ? "#fff" : theme.textSoft,
            boxShadow: active ? `0 2px 10px ${theme.primarySoft}` : "none",
            display: "flex", alignItems: "center", gap: 6,
        }}>
            {label}
            {badgeCount > 0 && <span style={{ background: active ? "rgba(255,255,255,0.25)" : theme.danger, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{badgeCount}</span>}
        </button>
    );

    return (
        <AppLayout title="Bookings">
            <Head title="Meeting Room & Car Booking" />
            <style>{`
                @keyframes bk-modal { from{opacity:0;transform:translateY(14px)scale(.97)} to{opacity:1;transform:none} }
                @keyframes bk-drop  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
                @keyframes bk-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
                .bk-page { animation: bk-fade .3s ease; }
                *::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="bk-page">

                {/* ── Hero Banner ── */}
                <div style={{
                    background: dark ? "linear-gradient(135deg,#0a0f1e,#1a1040 50%,#0a0f1e)" : "linear-gradient(135deg,#3730a3,#6366f1 50%,#4338ca)",
                    borderRadius: 20, padding: "24px 32px", marginBottom: 20,
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                    <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Resource Booking</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-.4px", marginBottom: 6 }}>Meeting Rooms & Cars</div>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>Book meeting rooms and company cars for your work needs.</p>
                        </div>
                        {isHR && stats && (
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {[
                                    { l: "Today",    v: stats.today_count,   c: "#34d399" },
                                    { l: "Rooms",    v: stats.room_count,    c: "#818cf8" },
                                    { l: "Cars",     v: stats.car_count,     c: "#fb923c" },
                                ].map(s => (
                                    <div key={s.l} style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 18px", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 600, marginTop: 3 }}>{s.l}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Tabs + Book buttons ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", gap: 4, background: theme.surface, padding: 5, borderRadius: 14, border: `1px solid ${theme.border}`, boxShadow: theme.shadowSm }}>
                        {tabBtn("calendar", "📅 Calendar", tab === "calendar", 0)}
                        {tabBtn("mine", "📋 My Bookings", tab === "mine", 0)}
                        {isHR && tabBtn("manage", "⚙️ Manage Resources", tab === "manage", 0)}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setBookingModal("room")} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(99,102,241,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
                            🏢 Book Room
                        </button>
                        <button onClick={() => setBookingModal("car")} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
                            🚗 Book Car
                        </button>
                    </div>
                </div>

                {/* ── Calendar Tab ── */}
                {tab === "calendar" && (
                    <div style={{ background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: theme.shadowSm }}>
                        {/* Calendar controls */}
                        <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${theme.border}`, gap: 12 }}>
                            {/* Left: Room/Car switch */}
                            <div style={{ display: "flex", gap: 4, background: theme.surfaceSoft, padding: 4, borderRadius: 12, border: `1px solid ${theme.border}`, flexShrink: 0 }}>
                                {[{ v: "room", l: "🏢 Rooms", c: theme.primary }, { v: "car", l: "🚗 Cars", c: theme.carColor }].map(t => (
                                    <button key={t.v} onClick={() => setCalType(t.v)} style={{
                                        padding: "7px 18px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                        border: "none", fontFamily: "inherit", transition: "all .15s",
                                        background: calType === t.v ? t.c : "transparent", color: calType === t.v ? "#fff" : theme.textSoft,
                                        boxShadow: calType === t.v ? `0 2px 8px ${t.c}40` : "none",
                                    }}>{t.l}</button>
                                ))}
                            </div>

                            {/* Center: Date nav */}
                            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                <button onClick={() => setCalDate(d => addDays(d, -1))} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.text, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                                <div style={{ textAlign: "center", minWidth: 200 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{fmtDate(calDate)}</div>
                                    {toISO(calDate) === toISO(new Date()) && <div style={{ fontSize: 10, color: theme.primary, fontWeight: 700, letterSpacing: ".05em" }}>TODAY</div>}
                                </div>
                                <button onClick={() => setCalDate(d => addDays(d, 1))} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.text, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                                <button onClick={() => setCalDate(new Date())} style={{ padding: "7px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.textSoft, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Today</button>
                            </div>

                            {/* Right: spacer to balance left side */}
                            <div style={{ flexShrink: 0, width: 160 }} />
                        </div>

                        <div style={{ padding: "16px 20px" }}>
                            {calLoading
                                ? <div style={{ textAlign: "center", padding: "80px", color: theme.textMute, fontSize: 13 }}>⏳ Loading schedule…</div>
                                :   <TimeCalendar
                                        key={`${calType}-${toISO(calDate)}`}
                                        bookings={calBookings}
                                        resources={resources}
                                        type={calType}
                                        theme={theme}
                                        dark={dark}
                                    />
                            }
                        </div>
                    </div>
                )}

                {/* ── Pending Tab (HR) ── */}
                {tab === "pending" && isHR && (
                    <div style={{ background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: theme.shadowSm }}>
                        {pendingBookings.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", color: theme.textMute, fontSize: 13 }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                                <div style={{ fontWeight: 600 }}>No pending approvals</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>All caught up!</div>
                            </div>
                        ) : pendingBookings.map((b, i) => (
                            <BookingRow key={b.id} booking={b} isHR theme={theme} dark={dark} onReject={setRejectModal} onMarkReturned={markReturned} isLast={i === pendingBookings.length - 1} />
                        ))}
                    </div>
                )}

                {/* ── My Bookings Tab ── */}
                {tab === "mine" && (
                    <div style={{ background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: theme.shadowSm }}>

                        <div style={{
                            display: "flex",
                            gap: 6,
                            padding: "14px 16px",
                            borderBottom: `1px solid ${theme.border}`,
                            background: theme.surfaceSoft,
                        }}>
                            {[
                                { v: "room", l: "🏢 My Room Booking", count: myRoomCount, c: theme.primary },
                                { v: "car",  l: "🚗 My Car Booking",  count: myCarCount,  c: theme.carColor },
                            ].map(t => (
                                <button
                                    key={t.v}
                                    onClick={() => setMyType(t.v)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 10,
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        background: myType === t.v ? t.c : theme.surface,
                                        color: myType === t.v ? "#fff" : theme.textSoft,
                                        boxShadow: myType === t.v ? `0 2px 10px ${t.c}35` : "none",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    {t.l}
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        padding: "1px 7px",
                                        borderRadius: 10,
                                        background: myType === t.v ? "rgba(255,255,255,0.25)" : theme.surfaceSofter,
                                        color: myType === t.v ? "#fff" : theme.textMute,
                                    }}>
                                        {t.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {filteredMyBookings.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", color: theme.textMute, fontSize: 13 }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>{myType === "room" ? "🏢" : "🚗"}</div>
                                <div style={{ fontWeight: 600 }}>
                                    No upcoming {myType === "room" ? "room" : "car"} bookings
                                </div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>
                                    Click "{myType === "room" ? "Book Room" : "Book Car"}" to get started.
                                </div>
                            </div>
                        ) : filteredMyBookings.map((b, i) => (
                            <BookingRow
                                key={b.id}
                                booking={b}
                                isHR={false}
                                theme={theme}
                                dark={dark}
                                onReject={() => {}}
                                onMarkReturned={() => {}}
                                onDelete={setDeleteConfirm}
                                isLast={i === filteredMyBookings.length - 1}
                            />
                        ))}
                    </div>
                )}

                {/* ── Manage Resources Tab (HR) ── */}
                {tab === "manage" && isHR && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                            <button onClick={() => setResourceModal(null)} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(99,102,241,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
                                ＋ Register Resource
                            </button>
                        </div>

                        {/* Rooms */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{ height: 1, flex: 1, background: theme.border }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap" }}>🏢 Meeting Rooms ({rooms.length})</span>
                                <div style={{ height: 1, flex: 1, background: theme.border }} />
                            </div>
                            {rooms.length === 0
                                ? <div style={{ background: theme.surface, borderRadius: 14, border: `2px dashed ${theme.border}`, padding: "28px", textAlign: "center", color: theme.textMute, fontSize: 13 }}>No meeting rooms yet — click <strong>+ Register Resource</strong> to add one</div>
                                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                                    {rooms.map(r => <ResourceCard key={r.id} resource={r} onEdit={setResourceModal} theme={theme} dark={dark} />)}
                                </div>
                            }
                        </div>

                        {/* Cars */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{ height: 1, flex: 1, background: theme.border }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap" }}>🚗 Company Cars ({cars.length})</span>
                                <div style={{ height: 1, flex: 1, background: theme.border }} />
                            </div>
                            {cars.length === 0
                                ? <div style={{ background: theme.surface, borderRadius: 14, border: `2px dashed ${theme.border}`, padding: "28px", textAlign: "center", color: theme.textMute, fontSize: 13 }}>No cars yet — click <strong>+ Register Resource</strong> to add one</div>
                                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                                    {cars.map(r => <ResourceCard key={r.id} resource={r} onEdit={setResourceModal} theme={theme} dark={dark} />)}
                                </div>
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {bookingModal && (
                <BookingModal type={bookingModal} defaultDate={toISO(calDate)} onClose={() => setBookingModal(null)} theme={theme} dark={dark} onSuccess={handleBookingSuccess} />
            )}
            {resourceModal !== false && (
                <ResourceModal resource={resourceModal} users={users} onClose={() => setResourceModal(false)} theme={theme} dark={dark} />
            )}
            {rejectModal && (
                <RejectModal booking={rejectModal} onClose={() => setRejectModal(null)} theme={theme} dark={dark} />
            )}
            {deleteConfirm && (
                <DeleteConfirmModal booking={deleteConfirm} onClose={() => setDeleteConfirm(null)} theme={theme} dark={dark} />
            )}
        </AppLayout>
    );
}