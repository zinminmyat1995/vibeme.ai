import { useState, useEffect, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Theme System  (identical pattern to Assignments/Index.jsx)
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
        bgSoft:        "#0d1526",
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
        success:       "#10b981",
        successSoft:   "rgba(16,185,129,0.16)",
        warning:       "#f59e0b",
        warningSoft:   "rgba(245,158,11,0.16)",
        danger:        "#ef4444",
        dangerSoft:    "rgba(239,68,68,0.14)",
        inputBg:       "rgba(255,255,255,0.04)",
        inputBorder:   "rgba(148,163,184,0.14)",
        rowHover:      "rgba(255,255,255,0.03)",
        overlay:       "rgba(2,8,23,0.78)",
        headerGrad:    "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(59,130,246,0.08))",
        tabActiveBg:   "rgba(99,102,241,0.18)",
        tabActiveText: "#818cf8",
        stat1: "rgba(99,102,241,0.14)",  stat1c: "#818cf8",
        stat2: "rgba(16,185,129,0.14)",  stat2c: "#34d399",
        stat3: "rgba(245,158,11,0.14)",  stat3c: "#fbbf24",
        stat4: "rgba(59,130,246,0.14)",  stat4c: "#60a5fa",
        hBtnSel:  { bg:"rgba(99,102,241,0.22)", border:"#6366f1",              color:"#a5b4fc" },
        hBtnNorm: { bg:"rgba(255,255,255,0.04)", border:"rgba(148,163,184,0.14)", color:"#94a3b8" },
        hBtnDis:  { bg:"rgba(255,255,255,0.02)", border:"rgba(148,163,184,0.06)", color:"#2d3748" },
    };
    return {
        bg:            "#f1f5f9",
        bgSoft:        "#e8edf5",
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
        success:       "#059669",
        successSoft:   "#d1fae5",
        warning:       "#d97706",
        warningSoft:   "#fef3c7",
        danger:        "#ef4444",
        dangerSoft:    "#fee2e2",
        inputBg:       "#f8fafc",
        inputBorder:   "#e2e8f0",
        rowHover:      "#f8fafc",
        overlay:       "rgba(15,23,42,0.42)",
        headerGrad:    "linear-gradient(135deg,#f8faff,#eef2ff)",
        tabActiveBg:   "#eef2ff",
        tabActiveText: "#6366f1",
        stat1: "#eef2ff",  stat1c: "#6366f1",
        stat2: "#d1fae5",  stat2c: "#059669",
        stat3: "#fef3c7",  stat3c: "#d97706",
        stat4: "#dbeafe",  stat4c: "#2563eb",
        hBtnSel:  { bg:"#eff6ff",  border:"#93c5fd", color:"#2563eb" },
        hBtnNorm: { bg:"#ffffff",  border:"#e2e8f0", color:"#374151" },
        hBtnDis:  { bg:"#f9fafb",  border:"#e5e7eb", color:"#d1d5db" },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
    active:    { label:"Active",    color:"#16a34a", bg:"#f0fdf4", bgDark:"rgba(22,163,74,0.15)",   border:"#86efac" },
    upcoming:  { label:"Upcoming",  color:"#2563eb", bg:"#eff6ff", bgDark:"rgba(37,99,235,0.15)",   border:"#93c5fd" },
    completed: { label:"Completed", color:"#7c3aed", bg:"#f5f3ff", bgDark:"rgba(124,58,237,0.15)", border:"#c4b5fd" },
    cancelled: { label:"Cancelled", color:"#9ca3af", bg:"#f9fafb", bgDark:"rgba(156,163,175,0.12)",border:"#d1d5db" },
    removed:   { label:"Removed",   color:"#dc2626", bg:"#fef2f2", bgDark:"rgba(220,38,38,0.14)",  border:"#fca5a5" },
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
function titleCase(str) { if (!str) return ""; return str.replace(/\b\w/g, c => c.toUpperCase()); }
function fmt(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }); }
function fmtDT(d) { if (!d) return "—"; return new Date(d).toLocaleString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }); }

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
function Flag({ country, size = 16 }) {
    const [err, setErr] = useState(false);
    const code = cc(country);
    if (!code || err) return <span style={{ fontSize: size * 0.8 }}>🌐</span>;
    return <img src={`https://flagcdn.com/w40/${code}.png`} alt={country} onError={() => setErr(true)}
        style={{ width: size * 1.4, height: size * 0.95, objectFit:"cover", borderRadius:2, flexShrink:0 }} />;
}

function Ava({ name, url, size = 34 }) {
    const [err, setErr] = useState(false);
    const letters = name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";
    const colors  = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#14b8a6"];
    const bg      = colors[(name?.charCodeAt(0) || 0) % colors.length];
    const src     = url ? (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:") ? url : `/storage/${url}`) : null;
    if (src && !err) return <img src={src} alt={name} onError={() => setErr(true)}
        style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover",
            border:"2px solid rgba(255,255,255,0.2)", boxShadow:"0 2px 8px rgba(0,0,0,0.18)", flexShrink:0 }} />;
    return <div style={{ width:size, height:size, borderRadius:"50%", background:bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:size*0.36, fontWeight:700, color:"#fff", flexShrink:0,
        border:"2px solid rgba(255,255,255,0.2)", boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>{letters}</div>;
}

function StatusPill({ status, dark }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.active;
    return <span style={{ fontSize:10, fontWeight:700, color:cfg.color,
        background: dark ? cfg.bgDark : cfg.bg,
        border:`1px solid ${dark ? cfg.color+"44" : cfg.border}`,
        padding:"3px 10px", borderRadius:99, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>
        {cfg.label}</span>;
}

function Spinner() {
    return <>
        <span style={{ display:"inline-block", width:14, height:14,
            border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff",
            borderRadius:"50%", animation:"showSpin 0.7s linear infinite" }} />
        <style>{`@keyframes showSpin{to{transform:rotate(360deg)}}`}</style>
    </>;
}

function FieldLabel({ children, t }) {
    return <label style={{ fontSize:11, fontWeight:700, color:t.textMute, display:"block",
        marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>{children}</label>;
}

function inp(t, err = false) {
    return { width:"100%", background:t.inputBg, border:`1.5px solid ${err ? "#fca5a5" : t.inputBorder}`,
        borderRadius:10, padding:"9px 13px", color:t.text, fontSize:13, outline:"none",
        boxSizing:"border-box", transition:"border-color 0.15s", fontFamily:"inherit" };
}

// ─────────────────────────────────────────────────────────────────────────────
// PremiumSelect — portal-free dropdown (same as Assignments/Index.jsx)
// ─────────────────────────────────────────────────────────────────────────────
function PremiumSelect({ options=[], value="", onChange, placeholder="Select…", t, dark, zIndex=200 }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = options.find(o => String(o.value) === String(value));
    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const trigBg  = dark ? "linear-gradient(180deg,rgba(15,26,50,0.98),rgba(10,18,38,0.98))" : "linear-gradient(180deg,#fff,#f8fafc)";
    const menuBg  = dark ? "linear-gradient(180deg,rgba(8,18,40,0.99),rgba(5,12,28,0.99))" : "#ffffff";
    return (
        <div ref={ref} style={{ position:"relative", width:"100%", zIndex }}>
            <button type="button" onClick={() => setOpen(v => !v)} style={{
                width:"100%", height:40, padding:"0 14px", borderRadius:12,
                border:`1.5px solid ${open ? t.borderStrong : t.inputBorder}`,
                background:trigBg, color: selected ? t.text : t.textMute,
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
                cursor:"pointer", backdropFilter:"blur(10px)", transition:"all 0.15s",
                boxShadow: open ? `0 0 0 3px ${t.primary}22` : "none", fontFamily:"inherit",
            }}>
                <span style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {selected?.label || <span style={{ color:t.textMute }}>{placeholder}</span>}
                </span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                    style={{ transform: open?"rotate(180deg)":"none", transition:"transform 0.15s", flexShrink:0 }}>
                    <path d="M4 6L8 10L12 6" stroke={t.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            {open && (
                <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:zIndex+50,
                    background:menuBg, border:`1.5px solid ${t.borderStrong}`, borderRadius:14,
                    overflow:"hidden", boxShadow:t.shadow, backdropFilter:"blur(16px)" }}>
                    <div style={{ maxHeight:220, overflowY:"auto", scrollbarWidth:"none", msOverflowStyle:"none" }}>
                        {options.map((opt, i) => {
                            const isSel = String(opt.value) === String(value);
                            return (
                                <button key={String(opt.value)+i} type="button"
                                    onClick={() => { if(!opt.disabled){onChange(opt.value);setOpen(false);} }}
                                    style={{ width:"100%", minHeight:40, padding:"0 14px", border:"none",
                                        borderBottom: i < options.length-1 ? `1px solid ${t.border}` : "none",
                                        background: isSel ? (dark?"rgba(99,102,241,0.22)":"#eef2ff") : "transparent",
                                        color: isSel ? t.primary : opt.disabled ? t.textMute : t.text,
                                        display:"flex", alignItems:"center", gap:8, cursor: opt.disabled?"not-allowed":"pointer",
                                        fontSize:13, fontWeight: isSel?700:500, opacity: opt.disabled?0.45:1,
                                        textAlign:"left", fontFamily:"inherit", transition:"background 0.12s" }}
                                    onMouseEnter={e => { if(!isSel&&!opt.disabled) e.currentTarget.style.background = dark?"rgba(255,255,255,0.04)":"#f8fafc"; }}
                                    onMouseLeave={e => { if(!isSel) e.currentTarget.style.background="transparent"; }}>
                                    {opt.icon && <span>{opt.icon}</span>}
                                    <span>{opt.label}</span>
                                    {isSel && <svg style={{ marginLeft:"auto",flexShrink:0 }} width="14" height="14" viewBox="0 0 20 20" fill={t.primary}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
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
// Remove Confirm Modal
// ─────────────────────────────────────────────────────────────────────────────
function RemoveConfirmModal({ assignment, onConfirm, onCancel, isRemoving, t, dark }) {
    return (
        <div style={{ position:"fixed", inset:0, background:t.overlay,
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:1000, backdropFilter:"blur(6px)" }}
            onClick={isRemoving ? undefined : onCancel}>
            <div onClick={e => e.stopPropagation()} style={{
                background: dark ? "rgba(12,20,42,0.98)" : "#ffffff",
                border:`1.5px solid ${t.borderStrong}`,
                borderRadius:20, width:400, padding:"32px 28px",
                boxShadow:t.shadow, textAlign:"center", backdropFilter:"blur(20px)",
            }}>
                <div style={{ width:56, height:56, borderRadius:16, margin:"0 auto 16px",
                    background: dark?"rgba(239,68,68,0.16)":"#fee2e2",
                    border:`1.5px solid ${dark?"rgba(239,68,68,0.3)":"#fca5a5"}`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🗑️</div>
                <h3 style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:8 }}>Remove Member?</h3>
                <p style={{ fontSize:13, color:t.textSoft, marginBottom:24, lineHeight:1.7 }}>
                    Remove <strong style={{ color:t.text }}>{assignment?.user?.name}</strong> from this project?<br/>
                    <span style={{ fontSize:12, color:t.textMute }}>This action cannot be undone.</span>
                </p>
                <div style={{ display:"flex", gap:10 }}>
                    <button onClick={onCancel} disabled={isRemoving} style={{
                        flex:1, padding:"11px", background:t.surfaceSoft,
                        border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSoft,
                        fontSize:13, fontWeight:600, cursor:isRemoving?"not-allowed":"pointer",
                        opacity:isRemoving?0.5:1, fontFamily:"inherit" }}>Cancel</button>
                    <button onClick={onConfirm} disabled={isRemoving} style={{
                        flex:1, padding:"11px",
                        background: isRemoving ? "#fca5a5" : "linear-gradient(135deg,#ef4444,#dc2626)",
                        border:"none", borderRadius:12, color:"#fff",
                        fontSize:13, fontWeight:700, cursor:isRemoving?"not-allowed":"pointer",
                        boxShadow: isRemoving?"none":"0 4px 14px rgba(239,68,68,0.38)",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                        fontFamily:"inherit" }}>
                        {isRemoving ? <><Spinner/> Removing…</> : "🗑 Yes, Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Modal — all original logic: capacity check, existingAssign, hBtn
// ─────────────────────────────────────────────────────────────────────────────
function AssignModal({ project, availableUsers, onClose, t, dark }) {
    const [form, setForm] = useState({
        user_id:       "",
        start_date:    project.start_date?.slice(0,10) || "",
        end_date:      project.end_date?.slice(0,10)   || "",
        hours_per_day: null,
        notes:         "",
    });
    const [errors, setErrors] = useState({});
    const [dropOpen, setDropOpen] = useState(false);
    const [isSubmitting, setSub]  = useState(false);
    const dropRef = useRef(null);
    const set = (k,v) => setForm(f => ({...f,[k]:v}));

    useEffect(() => {
        const h = e => { if(dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const selectedUser   = availableUsers?.find(u => u.id == form.user_id);
    const usedHours      = selectedUser?.used_hours_per_day ?? 0;
    const CAPACITY       = 8;
    const availableHrs   = Math.max(0, CAPACITY - usedHours);
    const isOverCap      = form.user_id && (usedHours + form.hours_per_day) > CAPACITY;
    const existingAssign = form.user_id
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
        if (form.user_id && form.hours_per_day > availableHrs) return;
        setSub(true);
        router.post("/admin/assignments", { ...form, project_id: project.id }, {
            onSuccess: () => { setSub(false); onClose(); },
            onError:   () => { setSub(false); },
        });
    };

    const hBtn = (h) => {
        const selected   = form.hours_per_day === h;
        const isDisabled = form.user_id && (h > availableHrs);
        if (isDisabled) return { ...t.hBtnDis, disabled:true,  cursor:"not-allowed" };
        if (selected)   return { ...t.hBtnSel, disabled:false, cursor:"pointer" };
        return              { ...t.hBtnNorm, disabled:false, cursor:"pointer" };
    };

    const trigBg = dark
        ? "linear-gradient(180deg,rgba(15,26,50,0.98),rgba(10,18,38,0.98))"
        : "linear-gradient(180deg,#fff,#f8fafc)";

    return (
        <div style={{ position:"fixed", inset:0, background:t.overlay,
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:1000, padding:20, backdropFilter:"blur(6px)" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: dark ? "rgba(10,17,38,0.99)" : "#ffffff",
                border:`1.5px solid ${t.borderStrong}`,
                borderRadius:20, width:"100%", maxWidth:520,
                boxShadow:t.shadow, overflow:"hidden", backdropFilter:"blur(20px)",
            }}>
                {/* Header */}
                <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${t.border}`, background:t.headerGrad }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                            <h2 style={{ fontSize:16, fontWeight:800, color:t.text, margin:0 }}>Assign Member</h2>
                            <p style={{ fontSize:12, color:t.textMute, marginTop:3 }}>
                                Add a member to <span style={{ color:t.primary, fontWeight:600 }}>{project.name}</span>
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background:t.surfaceSoft, border:`1.5px solid ${t.border}`,
                            borderRadius:10, width:32, height:32, cursor:"pointer", color:t.textMute, fontSize:16,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                    </div>
                </div>

                <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>

                    {/* Custom Member Dropdown */}
                    <div style={{ position:"relative" }} ref={dropRef}>
                        <FieldLabel t={t}>Member *</FieldLabel>
                        <div onClick={() => setDropOpen(o => !o)} style={{
                            width:"100%", background:trigBg, cursor:"pointer",
                            border:`1.5px solid ${errors.user_id ? "#fca5a5" : dropOpen ? t.primary : t.inputBorder}`,
                            borderRadius:12, padding:"10px 14px", boxSizing:"border-box",
                            display:"flex", alignItems:"center", justifyContent:"space-between",
                            boxShadow: dropOpen ? `0 0 0 3px ${t.primary}22` : "none",
                            transition:"all 0.15s", backdropFilter:"blur(10px)",
                        }}>
                            {selectedUser ? (
                                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                    <Ava name={selectedUser.name} url={selectedUser.avatar_url} size={24} />
                                    <span style={{ fontSize:13, color:t.text, fontWeight:600 }}>{selectedUser.name}</span>
                                    <Flag country={selectedUser.country} size={13} />
                                    <span style={{ fontSize:11, color:t.textMute }}>{titleCase(selectedUser.country)}</span>
                                </div>
                            ) : (
                                <span style={{ fontSize:13, color:t.textMute }}>Select a member…</span>
                            )}
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                                style={{ transform:dropOpen?"rotate(180deg)":"none", transition:"transform 0.15s", flexShrink:0 }}>
                                <path d="M4 6L8 10L12 6" stroke={t.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>

                        {/* Dropdown list */}
                        {dropOpen && (
                            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
                                background: dark?"rgba(8,18,40,0.99)":"#ffffff",
                                border:`1.5px solid ${t.borderStrong}`, borderRadius:14,
                                boxShadow:t.shadow, zIndex:1000,
                                maxHeight:240, overflowY:"auto",
                                scrollbarWidth:"none", msOverflowStyle:"none",
                                backdropFilter:"blur(16px)" }}>
                                {availableUsers?.map((u, i) => {
                                    const uUsed  = u.used_hours_per_day ?? 0;
                                    const uAvail = Math.max(0, CAPACITY - uUsed);
                                    const isFull = uAvail === 0;
                                    const isSel  = form.user_id == u.id;
                                    const capCol = isFull ? "#ef4444" : uAvail<=4 ? "#d97706" : "#16a34a";
                                    return (
                                        <div key={u.id} onClick={() => { set("user_id",u.id); setDropOpen(false); }}
                                            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                                                cursor:"pointer",
                                                background: isSel ? (dark?"rgba(99,102,241,0.2)":"#eef2ff") : "transparent",
                                                borderBottom: i<availableUsers.length-1 ? `1px solid ${t.border}` : "none",
                                                transition:"background 0.1s" }}
                                            onMouseEnter={e => { if(!isSel) e.currentTarget.style.background = dark?"rgba(255,255,255,0.04)":"#f8fafc"; }}
                                            onMouseLeave={e => { if(!isSel) e.currentTarget.style.background = "transparent"; }}>
                                            <Ava name={u.name} url={u.avatar_url} size={30} />
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                                    <span style={{ fontSize:13, fontWeight:600, color:t.text }}>{u.name}</span>
                                                    <Flag country={u.country} size={12} />
                                                    <span style={{ fontSize:11, color:t.textMute }}>{titleCase(u.country)}</span>
                                                </div>
                                                <div style={{ fontSize:11, color:t.textMute, marginTop:1,
                                                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                                    {u.email}
                                                </div>
                                            </div>
                                            <span style={{ fontSize:10, fontWeight:700, flexShrink:0,
                                                padding:"2px 8px", borderRadius:99, color:capCol,
                                                background: dark ? capCol+"22" : (isFull?"#fef2f2":uAvail<=4?"#fefce8":"#f0fdf4"),
                                                border:`1px solid ${dark ? capCol+"44" : (isFull?"#fca5a5":uAvail<=4?"#fde68a":"#86efac")}`,
                                            }}>
                                                {isFull ? "Full" : `${uAvail}h free`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {errors.user_id && <p style={{ fontSize:11, color:"#ef4444", marginTop:4 }}>{errors.user_id}</p>}

                        {/* Already assigned notice */}
                        {existingAssign && (
                            <div style={{ marginTop:8, padding:"10px 13px", borderRadius:10,
                                background: dark?"rgba(37,99,235,0.14)":"#eff6ff",
                                border:`1px solid ${dark?"#3b82f644":"#93c5fd"}`,
                                display:"flex", alignItems:"center", gap:10 }}>
                                <span style={{ fontSize:18 }}>ℹ️</span>
                                <div>
                                    <div style={{ fontSize:12, fontWeight:700, color:dark?"#60a5fa":"#1d4ed8" }}>
                                        Already assigned to this project
                                    </div>
                                    <div style={{ fontSize:11, color:dark?"#93c5fd":"#3b82f6", marginTop:1 }}>
                                        Current: <strong>{existingAssign.hours_per_day}h/day</strong>
                                        {" · "}Submitting will add <strong>+{form.hours_per_day}h</strong> → total{" "}
                                        <strong>{Math.min(24, existingAssign.hours_per_day + (form.hours_per_day||0))}h/day</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Capacity card */}
                        {selectedUser && !existingAssign && (
                            <div style={{ marginTop:8, padding:"10px 13px", borderRadius:10,
                                background: isOverCap
                                    ? (dark?"rgba(245,158,11,0.14)":"#fefce8")
                                    : (dark?"rgba(16,185,129,0.14)":"#f0fdf4"),
                                border:`1px solid ${isOverCap
                                    ? (dark?"#f59e0b44":"#fde68a")
                                    : (dark?"#10b98144":"#86efac")}`,
                                display:"flex", alignItems:"center", gap:10 }}>
                                <span style={{ fontSize:18 }}>{isOverCap?"⚠️":"✅"}</span>
                                <div>
                                    <div style={{ fontSize:12, fontWeight:600,
                                        color: isOverCap?(dark?"#fbbf24":"#b45309"):(dark?"#34d399":"#15803d") }}>
                                        {isOverCap
                                            ? `Over capacity — ${usedHours}h already, +${form.hours_per_day}h = ${usedHours+form.hours_per_day}h/day`
                                            : `Capacity OK — ${usedHours}h used · ${availableHrs}h available`}
                                    </div>
                                    <div style={{ fontSize:11, color:t.textMute, marginTop:1 }}>
                                        On {selectedUser.active_count} active project(s) · daily limit: {CAPACITY}h
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        {[["Start Date *","start_date"],["End Date *","end_date"]].map(([lbl,key]) => (
                            <div key={key}>
                                <FieldLabel t={t}>{lbl}</FieldLabel>
                                <input type="date" value={form[key]} onChange={e => set(key,e.target.value)} style={inp(t,!!errors[key])} />
                                {errors[key] && <p style={{ fontSize:11, color:"#ef4444", marginTop:3 }}>{errors[key]}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Hours per Day (capacity-aware) */}
                    <div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                            <FieldLabel t={t}>Hours per Day</FieldLabel>
                            {selectedUser && (
                                <span style={{ fontSize:11, color:t.textMute }}>
                                    Available:{" "}
                                    <strong style={{ color:availableHrs===0?"#ef4444":availableHrs<=4?"#d97706":"#16a34a" }}>
                                        {availableHrs}h
                                    </strong> / {CAPACITY}h
                                </span>
                            )}
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                            {[2,4,6,8].map(h => {
                                const b = hBtn(h);
                                return (
                                    <button key={h} onClick={() => { if(!b.disabled) set("hours_per_day",h); }}
                                        disabled={b.disabled} title={b.disabled?`Exceeds ${CAPACITY}h daily limit`:`${h}h per day`}
                                        style={{ flex:1, padding:"9px 0", borderRadius:10, cursor:b.cursor,
                                            border:`1.5px solid ${b.border}`, background:b.bg, color:b.color,
                                            fontSize:13, fontWeight:700, transition:"all 0.15s",
                                            opacity:b.disabled?0.4:1, fontFamily:"inherit" }}>{h}h</button>
                                );
                            })}
                        </div>
                        {errors.hours_per_day && <p style={{ fontSize:11, color:"#ef4444", marginTop:4 }}>{errors.hours_per_day}</p>}
                    </div>

                    {/* Notes */}
                    <div>
                        <FieldLabel t={t}>Notes <span style={{ fontWeight:400, textTransform:"none" }}>(optional)</span></FieldLabel>
                        <textarea value={form.notes} onChange={e => set("notes",e.target.value)}
                            placeholder="Optional notes…" rows={2}
                            style={{ ...inp(t), resize:"vertical" }} />
                    </div>
                </div>

                <div style={{ padding:"0 24px 22px", display:"flex", gap:10 }}>
                    <button onClick={onClose} disabled={isSubmitting} style={{
                        flex:1, padding:"11px", background:t.surfaceSoft,
                        border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSoft,
                        fontSize:13, fontWeight:600, cursor:isSubmitting?"not-allowed":"pointer",
                        opacity:isSubmitting?0.5:1, fontFamily:"inherit" }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} style={{
                        flex:2, padding:"11px",
                        background: isSubmitting?"#a5b4fc":existingAssign
                            ?"linear-gradient(135deg,#2563eb,#3b82f6)"
                            :"linear-gradient(135deg,#4f46e5,#3b82f6)",
                        border:"none", borderRadius:12, color:"#fff",
                        fontSize:13, fontWeight:700, cursor:isSubmitting?"not-allowed":"pointer",
                        boxShadow: isSubmitting?"none":existingAssign
                            ?"0 4px 14px rgba(37,99,235,0.35)":"0 4px 14px rgba(79,70,229,0.35)",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                        opacity:isSubmitting?0.8:1, transition:"all 0.15s", fontFamily:"inherit" }}>
                        {isSubmitting ? <><Spinner/> Assigning…</>
                            : existingAssign ? "➕ Update Hours" : isOverCap ? "⚠ Assign Anyway" : "Assign Member"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Assignment Modal — all original logic preserved
// ─────────────────────────────────────────────────────────────────────────────
function EditModal({ assignment, onClose, t, dark }) {
    const [form, setForm] = useState({
        start_date:    assignment.start_date?.slice(0,10) || "",
        end_date:      assignment.end_date?.slice(0,10)   || "",
        hours_per_day: assignment.hours_per_day || 8,
        status:        assignment.status || "active",
        notes:         assignment.notes  || "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const set = (k,v) => setForm(f => ({...f,[k]:v}));

    const submit = () => {
        if (isSaving) return;
        setIsSaving(true);
        router.put(`/admin/assignments/${assignment.id}`, form, {
            onSuccess: () => { setIsSaving(false); onClose(); },
            onError:   () => setIsSaving(false),
        });
    };

    const statusOpts = ["upcoming","active","completed","removed"].map(s => ({
        value:s, label:STATUS_CFG[s]?.label||s,
        icon:{ upcoming:"🕐",active:"⚡",completed:"✅",removed:"🗑" }[s],
    }));

    return (
        <div style={{ position:"fixed", inset:0, background:t.overlay,
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:1000, padding:20, backdropFilter:"blur(6px)" }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: dark?"rgba(10,17,38,0.99)":"#ffffff",
                border:`1.5px solid ${t.borderStrong}`,
                borderRadius:20, width:"100%", maxWidth:480,
                boxShadow:t.shadow, overflow:"hidden", backdropFilter:"blur(20px)",
            }}>
                <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${t.border}`, background:t.headerGrad }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                            <h2 style={{ fontSize:16, fontWeight:800, color:t.text, margin:0 }}>Edit Assignment</h2>
                            <p style={{ fontSize:12, color:t.textMute, marginTop:3 }}>
                                <span style={{ color:t.primary, fontWeight:600 }}>{assignment.user?.name}</span>
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background:t.surfaceSoft, border:`1.5px solid ${t.border}`,
                            borderRadius:10, width:32, height:32, cursor:"pointer", color:t.textMute, fontSize:16,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                    </div>
                </div>

                <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
                    {/* Dates */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        {[["Start Date","start_date"],["End Date","end_date"]].map(([lbl,key]) => (
                            <div key={key}>
                                <FieldLabel t={t}>{lbl}</FieldLabel>
                                <input type="date" value={form[key]} onChange={e => set(key,e.target.value)} style={inp(t)} />
                            </div>
                        ))}
                    </div>

                    {/* Hours */}
                    <div>
                        <FieldLabel t={t}>Hours per Day</FieldLabel>
                        <div style={{ display:"flex", gap:8 }}>
                            {[2,4,6,8].map(h => (
                                <button key={h} onClick={() => set("hours_per_day",h)} style={{
                                    flex:1, padding:"9px 0", borderRadius:10, cursor:"pointer",
                                    border:`1.5px solid ${form.hours_per_day===h ? t.hBtnSel.border : t.hBtnNorm.border}`,
                                    background: form.hours_per_day===h ? t.hBtnSel.bg : t.hBtnNorm.bg,
                                    color: form.hours_per_day===h ? t.hBtnSel.color : t.hBtnNorm.color,
                                    fontSize:13, fontWeight:700, transition:"all 0.15s", fontFamily:"inherit" }}>{h}h</button>
                            ))}
                        </div>
                    </div>

                    {/* Status — PremiumSelect */}
                    <div>
                        <FieldLabel t={t}>Status</FieldLabel>
                        <PremiumSelect options={statusOpts} value={form.status} onChange={v => set("status",v)} t={t} dark={dark} zIndex={300} />
                    </div>

                    {/* Notes */}
                    <div>
                        <FieldLabel t={t}>Notes</FieldLabel>
                        <textarea value={form.notes} onChange={e => set("notes",e.target.value)}
                            rows={2} style={{ ...inp(t), resize:"vertical" }} />
                    </div>
                </div>

                <div style={{ padding:"0 24px 22px", display:"flex", gap:10 }}>
                    <button onClick={onClose} style={{ flex:1, padding:"11px", background:t.surfaceSoft,
                        border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSoft,
                        fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
                    <button onClick={submit} disabled={isSaving} style={{
                        flex:2, padding:"11px",
                        background: isSaving?"#6ee7b7":"linear-gradient(135deg,#059669,#10b981)",
                        border:"none", borderRadius:12, color:"#fff",
                        fontSize:13, fontWeight:700, cursor:isSaving?"not-allowed":"pointer",
                        boxShadow: isSaving?"none":"0 4px 14px rgba(5,150,105,0.35)",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                        opacity:isSaving?0.85:1, transition:"all 0.15s", fontFamily:"inherit" }}>
                        {isSaving ? <><Spinner/> Updating…</> : "💾 Update"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ start, end, t }) {
    const pct = (() => {
        if (!start || !end) return 0;
        const total   = new Date(end)  - new Date(start);
        const elapsed = new Date()      - new Date(start);
        return Math.min(100, Math.max(0, Math.round((elapsed/total)*100)));
    })();
    const color = pct>=90?"#ef4444":pct>=60?"#f59e0b":"#10b981";
    return (
        <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:t.textMute, marginBottom:5 }}>
                <span>Timeline</span>
                <span style={{ fontWeight:700, color:t.text }}>{pct}%</span>
            </div>
            <div style={{ height:6, background:t.surfaceSofter, borderRadius:99, overflow:"hidden", border:`1px solid ${t.border}` }}>
                <div style={{ height:"100%", width:`${pct}%`,
                    background:`linear-gradient(90deg,${color}cc,${color})`,
                    borderRadius:99, transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ProjectShow({ project, availableUsers = [] }) {
    const dark = useReactiveTheme();
    const t    = getTheme(dark);

    const [showAssign,   setShowAssign] = useState(false);
    const [editTarget,   setEditTarget] = useState(null);
    const [removeTarget, setRemoveTgt]  = useState(null);
    const [isRemoving,   setIsRemoving] = useState(false);
    const [activeTab,    setActiveTab]  = useState("members");

    // Original logic — unchanged
    const assignments = project.assignments?.filter(a => a.status !== "removed") || [];
    const logs        = project.logs || [];

    const confirmRemove = () => {
        if (isRemoving) return;
        setIsRemoving(true);
        router.delete(`/admin/assignments/${removeTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => { setRemoveTgt(null); setIsRemoving(false); },
            onError:   () => { setRemoveTgt(null); setIsRemoving(false); },
        });
    };

    const totalHours = assignments.reduce((sum, a) => {
        const days = Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 864e5);
        return sum + days * a.hours_per_day;
    }, 0);

    const s = STATUS_CFG[project.status] || STATUS_CFG.active;

    const stats = [
        { label:"Total Members", value:assignments.length,                                         bg:t.stat1, color:t.stat1c, icon:"👥" },
        { label:"Active",        value:assignments.filter(a => a.status==="active").length,        bg:t.stat2, color:t.stat2c, icon:"⚡" },
        { label:"Upcoming",      value:assignments.filter(a => a.status==="upcoming").length,      bg:t.stat3, color:t.stat3c, icon:"🕐" },
        { label:"Est. Hours",    value:`~${totalHours.toLocaleString()}h`,                         bg:t.stat4, color:t.stat4c, icon:"⏱" },
    ];

    return (
        <AppLayout title="Project Assignments">
            <Head title={project.name} />
            <style>{`
                input[type=date]:focus,textarea:focus{
                    outline:none;
                    border-color:${t.primary}!important;
                    box-shadow:0 0 0 3px ${t.primary}22!important;
                }
                *{scrollbar-width:none;}
                ::-webkit-scrollbar{display:none;}
                @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
            `}</style>

            <div style={{ minHeight:"100%", transition:"background 0.3s" }}>

                {/* ── Back button ── */}
                <div style={{ marginBottom:16, marginTop:"-8px" }}>
                    <div onClick={() => router.visit("/admin/projects")} title="Back to Projects" style={{
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

                {/* ── Header Card ── */}
                <div style={{ background: dark?t.surface:"#ffffff",
                    border:`1px solid ${t.borderStrong}`,
                    borderRadius:18, marginBottom:16, overflow:"hidden",
                    boxShadow:t.shadowSoft, backdropFilter:"blur(12px)",
                    animation:"fadeUp 0.3s ease" }}>
                    {/* Status accent bar */}
                    <div style={{ height:4, background:`linear-gradient(90deg,${s.color},${s.color}80)` }} />

                    <div style={{ padding:"22px 26px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8, flexWrap:"wrap" }}>
                                    <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, lineHeight:1.2 }}>{project.name}</h1>
                                    <StatusPill status={project.status} dark={dark} />
                                </div>

                                {project.description && (
                                    <p style={{ fontSize:13, color:t.textSoft, marginBottom:16, lineHeight:1.65, maxWidth:620, margin:"0 0 16px 0" }}>
                                        {project.description}
                                    </p>
                                )}

                                {/* Info pills */}
                                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:project.description?0:4 }}>
                                    <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                                        background:t.surfaceSoft, border:`1px solid ${t.border}`,
                                        borderRadius:10, padding:"7px 14px" }}>
                                        <span style={{ fontSize:9, fontWeight:800, color:"#3b82f6",
                                            textTransform:"uppercase", letterSpacing:"0.08em" }}>FROM</span>
                                        <span style={{ fontSize:12, fontWeight:700, color:t.text }}>{fmt(project.start_date)}</span>
                                        <span style={{ color:t.textMute, fontSize:12 }}>→</span>
                                        <span style={{ fontSize:9, fontWeight:800, color:"#10b981",
                                            textTransform:"uppercase", letterSpacing:"0.08em" }}>TO</span>
                                        <span style={{ fontSize:12, fontWeight:700, color:t.text }}>{fmt(project.end_date)}</span>
                                    </div>

                                    {project.creator && (
                                        <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                                            background:t.surfaceSoft, border:`1px solid ${t.border}`,
                                            borderRadius:10, padding:"7px 14px" }}>
                                            <Ava name={project.creator.name} url={project.creator.avatar_url} size={20} />
                                            <span style={{ fontSize:11, color:t.textMute }}>Created by</span>
                                            <span style={{ fontSize:12, fontWeight:700, color:t.text }}>{project.creator.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress bar */}
                                {["active","upcoming"].includes(project.status) && project.start_date && project.end_date && (
                                    <div style={{ marginTop:16, maxWidth:480 }}>
                                        <ProgressBar start={project.start_date} end={project.end_date} t={t} />
                                    </div>
                                )}
                            </div>

                            {/* Assign Member button */}
                            <button onClick={() => setShowAssign(true)} style={{
                                display:"inline-flex", alignItems:"center", gap:7,
                                padding:"10px 20px",
                                background:"linear-gradient(135deg,#4f46e5,#3b82f6)",
                                border:"none", borderRadius:12, color:"#fff",
                                fontSize:13, fontWeight:700, cursor:"pointer",
                                boxShadow:"0 4px 16px rgba(79,70,229,0.38)",
                                flexShrink:0, marginLeft:8, transition:"all 0.15s", fontFamily:"inherit",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.opacity="0.9"; e.currentTarget.style.transform="translateY(-1px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="translateY(0)"; }}
                            >
                                <span style={{ fontSize:16 }}>+</span> Assign Member
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                    {stats.map((st, i) => (
                        <div key={i} style={{
                            background:st.bg,
                            border:`1px solid ${dark ? st.color+"33" : st.color+"55"}`,
                            borderRadius:14, padding:"16px 18px",
                            boxShadow:t.shadowSoft, transition:"transform 0.15s",
                            animation:`fadeUp 0.3s ease ${i*0.06}s both`,
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                            onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
                        >
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                                <span style={{ fontSize:18 }}>{st.icon}</span>
                                <span style={{ fontSize:11, fontWeight:600, color:st.color,
                                    textTransform:"uppercase", letterSpacing:"0.05em" }}>{st.label}</span>
                            </div>
                            <div style={{ fontSize:26, fontWeight:800, color:st.color, lineHeight:1 }}>{st.value}</div>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div style={{ display:"flex", gap:4, marginBottom:16,
                    background: dark?"rgba(255,255,255,0.04)":"#f1f5f9",
                    border:`1px solid ${t.border}`, borderRadius:14, padding:4, width:"fit-content" }}>
                    {[
                        { key:"members", label:"Members",      count:assignments.length },
                        { key:"logs",    label:"Activity Log", count:logs.length },
                    ].map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                padding:"9px 20px",
                                background: isActive
                                    ? (dark ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "linear-gradient(135deg,#2563eb,#3b82f6)")
                                    : "transparent",
                                border:"1px solid transparent",
                                borderRadius:11,
                                color: isActive ? "#ffffff" : t.textMute,
                                fontSize:13, fontWeight:700, cursor:"pointer",
                                transition:"all 0.15s", fontFamily:"inherit",
                                display:"flex", alignItems:"center", gap:7,
                                boxShadow: isActive ? (dark ? "0 4px 14px rgba(37,99,235,0.45)" : "0 4px 14px rgba(37,99,235,0.35)") : "none",
                            }}>
                                {tab.label}
                                <span style={{ fontSize:10, fontWeight:800,
                                    color: isActive ? "#bfdbfe" : t.textMute,
                                    background: isActive ? "rgba(255,255,255,0.2)" : t.surfaceSoft,
                                    padding:"1px 7px", borderRadius:99, transition:"all 0.15s",
                                }}>{tab.count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Members Tab ── */}
                {activeTab === "members" && (
                    <div style={{ background:dark?t.surface:"#ffffff",
                        border:`1px solid ${t.borderStrong}`,
                        borderRadius:16, overflow:"hidden",
                        boxShadow:t.shadowSoft, animation:"fadeUp 0.25s ease" }}>
                        {assignments.length === 0 ? (
                            <div style={{ padding:"60px", textAlign:"center" }}>
                                <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                                <div style={{ fontSize:14, color:t.textMute, marginBottom:18, fontWeight:500 }}>No members assigned yet</div>
                                <button onClick={() => setShowAssign(true)} style={{
                                    padding:"10px 24px",
                                    background:"linear-gradient(135deg,#4f46e5,#3b82f6)",
                                    border:"none", borderRadius:10, color:"#fff",
                                    fontSize:13, cursor:"pointer", fontWeight:700,
                                    boxShadow:"0 4px 14px rgba(79,70,229,0.35)", fontFamily:"inherit" }}>
                                    + Assign Member
                                </button>
                            </div>
                        ) : (
                            <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom:`1px solid ${t.border}`, background:t.surfaceSoft }}>
                                        {["Member","Period","Hours/Day","Status","Assigned By","Notes","Actions"].map(h => (
                                            <th key={h} style={{ padding:"11px 16px", textAlign:"left",
                                                fontSize:10, color:t.textMute, fontWeight:800,
                                                textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a, i) => (
                                        <tr key={a.id} style={{
                                            borderBottom: i<assignments.length-1 ? `1px solid ${t.border}` : "none",
                                            transition:"background 0.12s",
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background=t.rowHover}
                                            onMouseLeave={e => e.currentTarget.style.background="transparent"}
                                        >
                                            {/* Member */}
                                            <td style={{ padding:"14px 16px" }}>
                                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                    <Ava name={a.user?.name} url={a.user?.avatar_url} size={36} />
                                                    <div>
                                                        <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{a.user?.name}</div>
                                                        {a.user?.country && (
                                                            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                                                                <Flag country={a.user.country} size={13} />
                                                                <span style={{ fontSize:11, color:t.textSoft, fontWeight:500 }}>
                                                                    {titleCase(a.user.country)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Period FROM/TO */}
                                            <td style={{ padding:"14px 16px" }}>
                                                <div style={{ display:"inline-flex", flexDirection:"column", gap:5 }}>
                                                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                                        <span style={{ fontSize:9, fontWeight:800, color:"#3b82f6",
                                                            textTransform:"uppercase", letterSpacing:"0.08em", width:28, flexShrink:0 }}>FROM</span>
                                                        <span style={{ fontSize:12, fontWeight:600, color:t.text }}>{fmt(a.start_date)}</span>
                                                    </div>
                                                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                                        <span style={{ fontSize:9, fontWeight:800, color:"#10b981",
                                                            textTransform:"uppercase", letterSpacing:"0.08em", width:28, flexShrink:0 }}>TO</span>
                                                        <span style={{ fontSize:12, fontWeight:600, color:t.text }}>{fmt(a.end_date)}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Hours/Day */}
                                            <td style={{ padding:"14px 16px" }}>
                                                <div style={{ display:"inline-flex", alignItems:"baseline", gap:3,
                                                    background: dark?"rgba(99,102,241,0.15)":"#eef2ff",
                                                    border:`1px solid ${dark?"#6366f144":"#c7d2fe"}`,
                                                    borderRadius:8, padding:"4px 10px" }}>
                                                    <span style={{ fontSize:17, fontWeight:800, color:t.primary }}>{a.hours_per_day}</span>
                                                    <span style={{ fontSize:11, color:t.textMute, fontWeight:600 }}>h/day</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding:"14px 16px" }}>
                                                <StatusPill status={a.status} dark={dark} />
                                            </td>

                                            {/* Assigned By */}
                                            <td style={{ padding:"14px 16px" }}>
                                                {a.assigned_by ? (
                                                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                                        <Ava name={a.assigned_by.name} url={a.assigned_by.avatar_url} size={22} />
                                                        <span style={{ fontSize:12, fontWeight:600, color:t.textSoft }}>{a.assigned_by.name}</span>
                                                    </div>
                                                ) : <span style={{ fontSize:12, color:t.textMute }}>—</span>}
                                            </td>

                                            {/* Notes */}
                                            <td style={{ padding:"14px 16px", maxWidth:180 }}>
                                                {a.notes ? (
                                                    <span style={{ fontSize:11, color:t.textSoft, lineHeight:1.5,
                                                        display:"-webkit-box", WebkitLineClamp:2,
                                                        WebkitBoxOrient:"vertical", overflow:"hidden", textOverflow:"ellipsis" }}
                                                        title={a.notes}>{a.notes}</span>
                                                ) : <span style={{ fontSize:11, color:t.textMute }}>—</span>}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding:"14px 16px" }}>
                                                <div style={{ display:"flex", gap:7 }}>
                                                    <button onClick={() => setEditTarget(a)} style={{
                                                        display:"inline-flex", alignItems:"center", gap:5,
                                                        padding:"6px 12px",
                                                        background: dark?"rgba(16,185,129,0.14)":"#f0fdf4",
                                                        border:`1.5px solid ${dark?"#10b98144":"#86efac"}`,
                                                        borderRadius:9, color:dark?"#34d399":"#16a34a",
                                                        fontSize:11, fontWeight:700, cursor:"pointer",
                                                        transition:"all 0.15s", fontFamily:"inherit" }}
                                                        onMouseEnter={e => e.currentTarget.style.background=dark?"rgba(16,185,129,0.24)":"#dcfce7"}
                                                        onMouseLeave={e => e.currentTarget.style.background=dark?"rgba(16,185,129,0.14)":"#f0fdf4"}
                                                    >✏️ Edit</button>
                                                    <button onClick={() => setRemoveTgt(a)} style={{
                                                        display:"inline-flex", alignItems:"center", gap:5,
                                                        padding:"6px 12px",
                                                        background: dark?"rgba(239,68,68,0.14)":"#fef2f2",
                                                        border:`1.5px solid ${dark?"#ef444444":"#fca5a5"}`,
                                                        borderRadius:9, color:dark?"#f87171":"#ef4444",
                                                        fontSize:11, fontWeight:700, cursor:"pointer",
                                                        transition:"all 0.15s", fontFamily:"inherit" }}
                                                        onMouseEnter={e => e.currentTarget.style.background=dark?"rgba(239,68,68,0.24)":"#fee2e2"}
                                                        onMouseLeave={e => e.currentTarget.style.background=dark?"rgba(239,68,68,0.14)":"#fef2f2"}
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
                    <div style={{ background:dark?t.surface:"#ffffff",
                        border:`1px solid ${t.borderStrong}`,
                        borderRadius:16, overflow:"hidden",
                        boxShadow:t.shadowSoft, animation:"fadeUp 0.25s ease" }}>
                        {logs.length === 0 ? (
                            <div style={{ padding:"60px", textAlign:"center" }}>
                                <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
                                <div style={{ fontSize:14, color:t.textMute, marginBottom:18, fontWeight:500 }}>No Activity yet</div>
                            </div>
                        ) : (
                            <div style={{ padding:22, display:"flex", flexDirection:"column", gap:0 }}>
                                {logs.map((log, i) => {
                                    const aColor = { assigned:"#16a34a", edited:"#2563eb", removed:"#dc2626" }[log.action] || "#64748b";
                                    const aLabel = { assigned:"assigned", edited:"edited assignment of", removed:"removed" }[log.action] || log.action;
                                    const aIcon  = { assigned:"✅", edited:"✏️", removed:"❌" }[log.action];
                                    return (
                                        <div key={log.id} style={{
                                            display:"flex", gap:14,
                                            paddingBottom: i<logs.length-1?18:0,
                                            marginBottom:  i<logs.length-1?18:0,
                                            borderBottom:  i<logs.length-1?`1px solid ${t.border}`:"none",
                                        }}>
                                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                                                <div style={{ width:34, height:34, borderRadius:"50%",
                                                    background:dark?`${aColor}22`:`${aColor}10`,
                                                    border:`1.5px solid ${aColor}${dark?"55":"30"}`,
                                                    display:"flex", alignItems:"center", justifyContent:"center",
                                                    fontSize:15, flexShrink:0 }}>{aIcon}</div>
                                                {i<logs.length-1 && (
                                                    <div style={{ width:1, flex:1, background:t.border, minHeight:16 }} />
                                                )}
                                            </div>
                                            <div style={{ flex:1, paddingTop:4 }}>
                                                <div style={{ display:"flex", alignItems:"center", gap:7,
                                                    marginBottom:4, flexWrap:"wrap" }}>
                                                    <span style={{ fontSize:13, fontWeight:700, color:t.text }}>{log.changed_by?.name}</span>
                                                    <span style={{ fontSize:12, color:aColor, fontWeight:600 }}>{aLabel}</span>
                                                    <span style={{ fontSize:13, fontWeight:600, color:t.textSoft }}>{log.user?.name}</span>
                                                </div>
                                                <div style={{ fontSize:11, color:t.textMute }}>{fmtDT(log.created_at)}</div>

                                                {/* Diff view for edited */}
                                                {log.action === "edited" && log.old_values && log.new_values && (
                                                    <div style={{ marginTop:9, padding:"9px 12px",
                                                        background:t.surfaceSoft, borderRadius:10,
                                                        fontSize:11, color:t.textSoft,
                                                        border:`1px solid ${t.border}` }}>
                                                        {log.old_values.start_date !== log.new_values.start_date && (
                                                            <div style={{ marginBottom:3 }}>start:{" "}
                                                                <span style={{ color:"#ef4444", fontWeight:600 }}>{log.old_values.start_date}</span>
                                                                {" → "}
                                                                <span style={{ color:"#16a34a", fontWeight:600 }}>{log.new_values.start_date}</span>
                                                            </div>
                                                        )}
                                                        {log.old_values.end_date !== log.new_values.end_date && (
                                                            <div style={{ marginBottom:3 }}>end:{" "}
                                                                <span style={{ color:"#ef4444", fontWeight:600 }}>{log.old_values.end_date}</span>
                                                                {" → "}
                                                                <span style={{ color:"#16a34a", fontWeight:600 }}>{log.new_values.end_date}</span>
                                                            </div>
                                                        )}
                                                        {log.old_values.status !== log.new_values.status && (
                                                            <div style={{ marginBottom:3 }}>status:{" "}
                                                                <span style={{ color:"#ef4444", fontWeight:600 }}>{log.old_values.status}</span>
                                                                {" → "}
                                                                <span style={{ color:"#16a34a", fontWeight:600 }}>{log.new_values.status}</span>
                                                            </div>
                                                        )}
                                                        {log.old_values.hours_per_day !== log.new_values.hours_per_day && (
                                                            <div>hours/day:{" "}
                                                                <span style={{ color:"#ef4444", fontWeight:600 }}>{log.old_values.hours_per_day}h</span>
                                                                {" → "}
                                                                <span style={{ color:"#16a34a", fontWeight:600 }}>{log.new_values.hours_per_day}h</span>
                                                            </div>
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

            {/* ── Modals ── */}
            {showAssign && (
                <AssignModal project={project} availableUsers={availableUsers}
                    onClose={() => setShowAssign(false)} t={t} dark={dark} />
            )}
            {editTarget && (
                <EditModal assignment={editTarget} onClose={() => setEditTarget(null)} t={t} dark={dark} />
            )}
            {removeTarget && (
                <RemoveConfirmModal
                    assignment={removeTarget}
                    onConfirm={confirmRemove}
                    onCancel={() => { if(!isRemoving) setRemoveTgt(null); }}
                    isRemoving={isRemoving}
                    t={t} dark={dark}
                />
            )}
        </AppLayout>
    );
}