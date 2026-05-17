import { useState, useEffect, useCallback, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTranslation } from "@/Contexts/LanguageContext";

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
    if (dark) return {
        surface: "rgba(15,26,50,0.95)", surfaceSoft: "rgba(255,255,255,0.04)",
        border: "rgba(148,163,184,0.10)", borderStrong: "rgba(148,163,184,0.18)",
        text: "#f1f5f9", textSoft: "#94a3b8", textMute: "#475569",
        shadow: "0 24px 64px rgba(0,0,0,0.48)", shadowSm: "0 4px 16px rgba(0,0,0,0.28)",
        primary: "#f59e0b", primarySoft: "rgba(245,158,11,0.15)",
        success: "#10b981", successSoft: "rgba(16,185,129,0.15)",
        danger: "#f87171", dangerSoft: "rgba(248,113,113,0.15)",
        inputBg: "rgba(255,255,255,0.05)", overlay: "rgba(2,8,23,0.80)",
    };
    return {
        surface: "#ffffff", surfaceSoft: "#f8fafc",
        border: "#e2e8f0", borderStrong: "#cbd5e1",
        text: "#0f172a", textSoft: "#475569", textMute: "#94a3b8",
        shadow: "0 8px 32px rgba(15,23,42,0.10)", shadowSm: "0 2px 8px rgba(15,23,42,0.06)",
        primary: "#d97706", primarySoft: "rgba(217,119,6,0.10)",
        success: "#059669", successSoft: "rgba(5,150,105,0.10)",
        danger: "#dc2626", dangerSoft: "rgba(220,38,38,0.08)",
        inputBg: "#f8fafc", overlay: "rgba(15,23,42,0.45)",
    };
}

const makeDS = (tr) => ({
    start:      { label: tr("driverSchedule.driverStatus.start"), color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
    on_the_way: { label: tr("driverSchedule.driverStatus.onTheWay"),  color: "#3b82f6", bg: "rgba(59,130,246,0.10)"  },
    returned:   { label: tr("driverSchedule.driverStatus.returned"),   color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
    ended:      { label: tr("driverSchedule.driverStatus.ended"),      color: "#10b981", bg: "rgba(16,185,129,0.10)"  },
});
const makeBS = (tr) => ({
    approved:   { label: tr("driverSchedule.bookingStatus.approved"),   color: "#059669", bg: "rgba(5,150,105,0.09)"  },
    waitlisted: { label: tr("driverSchedule.bookingStatus.waitlisted"), color: "#d97706", bg: "rgba(217,119,6,0.09)"  },
    completed:  { label: tr("driverSchedule.bookingStatus.completed"),  color: "#6366f1", bg: "rgba(99,102,241,0.09)" },
    cancelled:  { label: tr("driverSchedule.bookingStatus.cancelled"),  color: "#dc2626", bg: "rgba(220,38,38,0.09)"  },
});
const makeTripLabel = (tr) => ({
    one_way: tr("driverSchedule.tripTypes.oneWay"),
    multi_stop: tr("driverSchedule.tripTypes.multiStop"),
    pickup: tr("driverSchedule.tripTypes.pickup"),
    round_trip: tr("driverSchedule.tripTypes.roundTrip"),
    wait_return: tr("driverSchedule.tripTypes.waitReturn"),
});
function toISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}
const fmtDate = (iso, locale = "en-US") => new Date(iso + "T00:00:00").toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
const fmtShort = (iso, locale = "en-US") => new Date(iso + "T00:00:00").toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });

function Pill({ label, color, bg }) {
    return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:20, background:bg, fontSize:11, fontWeight:700, color, whiteSpace:"nowrap" }}><span style={{ width:5, height:5, borderRadius:"50%", background:color, flexShrink:0 }}/>{label}</span>;
}
function Spinner({ size=14, color="#fff" }) {
    return <span style={{ width:size, height:size, border:`2px solid ${color}33`, borderTopColor:color, borderRadius:"50%", display:"inline-block", animation:"ds-spin .7s linear infinite", flexShrink:0 }}/>;
}
function Av({ name, url, size=30 }) {
    const [err, setErr] = useState(false);
    const ini = (name||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
    const cols = ["#7c3aed","#2563eb","#059669","#d97706","#dc2626","#0891b2"];
    const bg = cols[(name||"").charCodeAt(0)%cols.length];
    const src = url ? (url.startsWith("http")?url:`/storage/${url}`) : null;
    if (src && !err) return <img src={src} onError={()=>setErr(true)} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
    return <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:size*0.36, fontWeight:800, flexShrink:0 }}>{ini}</div>;
}

// ── Modals ────────────────────────────────────────────────────────
function CancelModal({ booking, onClose, theme, tr, locale }) {
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const submit = () => {
        if (!reason.trim()) { setErr(tr("driverSchedule.validation.reasonRequired")); return; }
        setSaving(true);
        router.post(`/driver/schedule/${booking.id}/cancel`, { cancel_reason: reason }, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => { setSaving(false); setErr(tr("driverSchedule.messages.failedTryAgain")); },
        });
    };
    return (
        <div style={{ position:"fixed", inset:0, background:theme.overlay, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }} onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, borderRadius:20, padding:"26px 24px", width:"100%", maxWidth:420, boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:"ds-modal .2s ease" }}>
                <div style={{ fontSize:15, fontWeight:800, color:theme.text, marginBottom:3 }}> {tr("driverSchedule.cancelModal.title")}</div>
                <div style={{ fontSize:12, color:theme.textMute, marginBottom:18 }}>{fmtShort(booking.booking_date, locale)} · {booking.start_time}{booking.end_time?`–${booking.end_time}`:""} · {booking.organizer?.name}</div>
                <label style={{ fontSize:12, fontWeight:600, color:theme.textSoft, display:"block", marginBottom:6 }}> {tr("driverSchedule.fields.reasonRequired")}</label>
                <textarea value={reason} onChange={e=>{setReason(e.target.value);setErr("");}} placeholder={tr("driverSchedule.placeholders.cancelReason")} rows={3} autoFocus
                    style={{ width:"100%", padding:"10px 13px", borderRadius:12, border:`1.5px solid ${err?theme.danger:theme.border}`, background:theme.inputBg, color:theme.text, fontSize:13, fontFamily:"inherit", resize:"none", outline:"none", boxSizing:"border-box" }}/>
                {err && <p style={{ color:theme.danger, fontSize:11, margin:"5px 0 0" }}>{err}</p>}
                <div style={{ display:"flex", gap:8, marginTop:18 }}>
                    <button onClick={onClose} style={{ padding:"10px 20px", borderRadius:10, border:`1px solid ${theme.border}`, background:"transparent", color:theme.textSoft, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{tr("driverSchedule.actions.back")}</button>
                    <button onClick={submit} disabled={saving} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:theme.danger, color:"#fff", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", opacity:saving?0.75:1, display:"flex", alignItems:"center", gap:7 }}>
                        {saving&&<Spinner size={13}/>}{saving ? tr("driverSchedule.actions.cancelling") : tr("driverSchedule.actions.confirmCancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}

function NoteModal({ booking, onClose, theme, tr }) {
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const skip = () => onClose();
    const submit = () => {
        if (!note.trim()) { skip(); return; }
        setSaving(true);
        window.apiFetch(`/driver/schedule/${booking.id}/note`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ note }) })
            .then(()=>{ setSaving(false); onClose(); }).catch(()=>{ setSaving(false); onClose(); });
    };
    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }} onClick={skip}>
            <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, borderRadius:20, padding:"26px 24px", width:"100%", maxWidth:400, boxShadow:theme.shadow, border:`1px solid ${theme.border}`, animation:"ds-modal .2s ease" }}>
                <div style={{ textAlign:"center", marginBottom:18 }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>🏁</div>
                    <div style={{ fontSize:16, fontWeight:800, color:theme.text }}> {tr("driverSchedule.noteModal.tripCompleted")}</div>
                    <div style={{ fontSize:12, color:theme.textMute, marginTop:4 }}> {tr("driverSchedule.noteModal.addNoteOptional")}</div>
                </div>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder={tr("driverSchedule.placeholders.note")} rows={3} autoFocus
                    style={{ width:"100%", padding:"10px 13px", borderRadius:12, border:`1.5px solid ${theme.border}`, background:theme.inputBg, color:theme.text, fontSize:13, fontFamily:"inherit", resize:"none", outline:"none", boxSizing:"border-box", marginBottom:14 }}/>
                <div style={{ display:"flex", gap:8 }}>
                    <button onClick={skip} style={{ padding:"10px 20px", borderRadius:10, border:`1px solid ${theme.border}`, background:"transparent", color:theme.textSoft, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{tr("driverSchedule.actions.skip")}</button>
                    <button onClick={submit} disabled={saving} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#059669,#10b981)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7 }}>
                        {saving&&<Spinner size={13}/>}{saving ? tr("driverSchedule.actions.saving") : tr("driverSchedule.actions.saveNote")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Booking Card ──────────────────────────────────────────────────
function BookingCard({ booking, onStatusUpdate, onCancel, theme, dark, tr, locale }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("info");
    const [actLoading, setActLoading] = useState(false);

    const DS = useMemo(() => makeDS(tr), [tr]);
    const BS = useMemo(() => makeBS(tr), [tr]);
    const TRIP_LABEL = useMemo(() => makeTripLabel(tr), [tr]);

    const ds = booking.driver_status || "start";
    const dCfg = DS[ds] || DS.start;
    const bCfg = BS[booking.status] || BS.approved;
    const cancelled = booking.status === "cancelled";
    const completed = booking.status === "completed" || ds === "ended";

    const isExpiredNotStarted = (() => {
        if (!booking.end_time) return false;
        if (booking.driver_status !== "start") return false;

        const now = new Date();
        const end = new Date(`${booking.booking_date}T${booking.end_time}:00`);

        return now > end;
    })();

    const nextAct = !cancelled && !completed && !isExpiredNotStarted ? {
        start:      { label: tr("driverSchedule.actions.startTrip"),     next: "on_the_way", color: "#2563eb" },
        on_the_way: { label: tr("driverSchedule.actions.markReturning"), next: "returned",   color: "#d97706" },
        returned:   { label: tr("driverSchedule.actions.endTrip"),       next: "ended",      color: "#059669" },
    }[ds] : null;

    const doAction = () => {
        if (!nextAct || actLoading) return;
        setActLoading(true);
        onStatusUpdate(booking, nextAct.next, () => setActLoading(false));
    };

    // Compact stop string: "1. Office → 2. Bank → 3. Hotel"
    const stopLine = booking.stops?.length > 0
        ? booking.stops.map((s,i) => `${i+1}. ${s.location}`).join("  →  ")
        : null;

    return (
        <div style={{ background:theme.surface, borderRadius:18, border:`1px solid ${cancelled?theme.danger+"25":theme.border}`, overflow:"hidden", transition:"box-shadow .2s" }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=theme.shadowSm}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>

            {/* ── Header row ── */}
            <div onClick={()=>setOpen(v=>!v)} style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 20px", cursor:"pointer" }}>
                {/* Time pill */}
                <div style={{ flexShrink:0, textAlign:"center", minWidth:56 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:cancelled?theme.danger:theme.primary, lineHeight:1 }}>{booking.start_time}</div>
                    {booking.end_time && <div style={{ fontSize:10, color:theme.textMute, marginTop:2 }}>{booking.end_time}</div>}
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:theme.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:5 }}>{booking.purpose}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <Pill label={bCfg.label} color={bCfg.color} bg={bCfg.bg}/>
                        {!cancelled && <Pill label={dCfg.label} color={dCfg.color} bg={dCfg.bg}/>}
                        <span style={{ fontSize:11, color:theme.textMute }}>{booking.organizer?.name}{booking.attendees?.length>0?` +${booking.attendees.length}`:""}</span>
                    </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5" style={{ flexShrink:0, transition:"transform .2s", transform:open?"rotate(180deg)":"none" }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {/* ── Expanded ── */}
            {open && (
                <div style={{ borderTop:`1px solid ${theme.border}` }}>
                    {/* Tab bar — underline style */}
                    <div style={{ display:"flex", paddingTop:4 }}>
                        {[
                            { k:"info",       l: tr("driverSchedule.tabs.tripInfo") },
                            { k:"passengers", l: `${tr("driverSchedule.tabs.passengers")} (${(booking.attendees?.length||0)+1})` },
                            { k:"notes",      l: `${tr("driverSchedule.tabs.notes")} (${booking.driver_notes?.length||0})` },
                        ].map(t=>(
                            <button key={t.k} onClick={()=>setTab(t.k)} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, border:"none", cursor:"pointer", fontFamily:"inherit", background:"transparent", color:tab===t.k?theme.primary:theme.textMute, borderBottom:`2px solid ${tab===t.k?theme.primary:"transparent"}`, transition:"all .15s" }}>{t.l}</button>
                        ))}
                    </div>

                    <div style={{ padding:"16px 20px" }}>

                        {/* ── Info tab ── */}
                        {tab==="info" && (
                            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                                {/* Compact meta line */}
                                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 20px", paddingBottom:10, marginBottom:10 }}>
                                    {booking.trip_type && (
                                        <span style={{ fontSize:12, color:theme.textSoft }}>
                                            <span style={{ fontSize:10, fontWeight:700, color:theme.textMute, textTransform:"uppercase", letterSpacing:".06em", marginRight:5 }}>{tr("driverSchedule.labels.type")}</span>
                                            {TRIP_LABEL[booking.trip_type]||booking.trip_type}
                                        </span>
                                    )}
                                    {booking.pickup_location && (
                                        <span style={{ fontSize:12, color:theme.textSoft }}>
                                            <span style={{ fontSize:10, fontWeight:700, color:theme.textMute, textTransform:"uppercase", letterSpacing:".06em", marginRight:5 }}>{tr("driverSchedule.labels.from")}</span>
                                            {booking.pickup_location}
                                        </span>
                                    )}
                                    {booking.return_time && (
                                        <span style={{ fontSize:12, color:theme.textSoft }}>
                                            <span style={{ fontSize:10, fontWeight:700, color:theme.textMute, textTransform:"uppercase", letterSpacing:".06em", marginRight:5 }}>{tr("driverSchedule.labels.return")}</span>
                                            {booking.return_time}
                                        </span>
                                    )}
                                </div>

                                {/* Stops — compact single line with dots */}
                                {stopLine && (
                                    <div style={{ paddingBottom:10, marginBottom:10 }}>
                                        <div style={{ fontSize:10, fontWeight:700, color:theme.textMute, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>{tr("driverSchedule.labels.stops")}</div>
                                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                            {booking.stops.map((s,i)=>(
                                                <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                                                    <span style={{ width:18, height:18, borderRadius:"50%", background:theme.primarySoft, color:theme.primary, fontSize:10, fontWeight:800, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.order}</span>
                                                    <span style={{ fontSize:13, color:theme.text, fontWeight:600 }}>{s.location}</span>
                                                    {s.arrival_time && <span style={{ fontSize:11, color:theme.textMute }}>({s.arrival_time})</span>}
                                                    {i<booking.stops.length-1 && <span style={{ color:theme.textMute, fontSize:14, fontWeight:300, marginLeft:2 }}>→</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cancel reason */}
                                {cancelled && booking.cancel_reason && (
                                    <div style={{ padding:"10px 0" }}>
                                        <div style={{ fontSize:10, fontWeight:700, color:theme.danger, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{tr("driverSchedule.labels.cancelReason")}</div>
                                        <div style={{ fontSize:13, color:theme.text }}>{booking.cancel_reason}</div>
                                        {booking.cancelled_at && <div style={{ fontSize:11, color:theme.textMute, marginTop:3 }}>{booking.cancelled_at}</div>}
                                    </div>
                                )}

                                {/* No trip info at all */}
                                {!booking.trip_type && !booking.pickup_location && !stopLine && !cancelled && (
                                    <div style={{ fontSize:12, color:theme.textMute, padding:"8px 0" }}>{tr("driverSchedule.empty.noTripDetails")}</div>
                                )}
                            </div>
                        )}

                        {/* ── Passengers tab ── */}
                        {tab==="passengers" && (
                            <div>
                                {[{ ...booking.organizer, role: tr("driverSchedule.labels.organizer") }, ...(booking.attendees||[]).map(a=>({...a,role: tr("driverSchedule.labels.passenger")}))].map((p,i,arr)=>(
                                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<arr.length-1?`1px solid ${theme.border}`:"none" }}>
                                        <Av name={p.name} url={p.avatar_url} size={30}/>
                                        <span style={{ flex:1, fontSize:13, fontWeight:600, color:theme.text }}>{p.name}</span>
                                        <span style={{ fontSize:11, fontWeight:600, color:i===0?theme.primary:theme.textMute }}>{p.role}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Notes tab ── */}
                        {tab==="notes" && (
                            <div>
                                {(!booking.driver_notes||booking.driver_notes.length===0) ? (
                                    <div style={{ textAlign:"center", padding:"24px 0", color:theme.textMute, fontSize:12 }}>
                                        <div style={{ fontSize:22, marginBottom:8 }}>📝</div>{tr("driverSchedule.empty.notesAfterTripEnds")}
                                    </div>
                                ) : booking.driver_notes.map((n,i,arr)=>(
                                    <div key={i} style={{ padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${theme.border}`:"none" }}>
                                        <div style={{ fontSize:13, color:theme.text, lineHeight:1.6 }}>{n.note}</div>
                                        <div style={{ fontSize:11, color:theme.textMute, marginTop:3 }}>{n.created_at}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Action buttons ── */}
                        {!cancelled && !completed && (
                            <div style={{ display:"flex", gap:8, marginTop:14 }}>
                                <button onClick={()=>onCancel(booking)} style={{ padding:"9px 16px", borderRadius:10, border:`1px solid ${theme.danger}30`, background:"transparent", color:theme.danger, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{tr("driverSchedule.actions.cancelTrip")}</button>
                                {nextAct && (
                                    <button onClick={doAction} disabled={actLoading} style={{ padding:"9px 20px", borderRadius:10, border:"none", background:nextAct.color, color:"#fff", fontSize:13, fontWeight:700, cursor:actLoading?"not-allowed":"pointer", fontFamily:"inherit", opacity:actLoading?0.75:1, display:"flex", alignItems:"center", gap:7, transition:"opacity .15s" }}>
                                        {actLoading&&<Spinner size={13}/>}{nextAct.label}
                                    </button>
                                )}
                            </div>
                        )}

                        {isExpiredNotStarted && (
                            <div style={{
                                marginTop: 14,
                                padding: "10px 12px",
                                borderRadius: 10,
                                background: theme.dangerSoft,
                                color: theme.danger,
                                fontSize: 12,
                                fontWeight: 700,
                            }}>
                                {tr("driverSchedule.messages.tripTimePassed")}
                            </div>
                        )}

                        {completed && (
                            <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:theme.success }}>
                                {tr("driverSchedule.messages.tripCompleted")}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function DriverSchedule({ car, bookings: initial, date: initDate }) {
    const { t: tr, locale = "en-US" } = useTranslation();
    const dark = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);
    const DS = useMemo(() => makeDS(tr), [tr]);

    const [date, setDate]         = useState(initDate || toISO(new Date()));
    const [bookings, setBookings] = useState(initial || []);
    const [loading, setLoading]   = useState(false);
    const [cancelModal, setCancelModal] = useState(null);
    const [noteModal, setNoteModal]     = useState(null);

    const fetchBookings = useCallback(async d => {
        setLoading(true);
        try { const r = await window.apiFetch(`/driver/schedule/bookings?date=${d}`); const data = await r.json(); setBookings(data.bookings||[]); } catch {}
        setLoading(false);
    }, []);

    const changeDate = d => { setDate(d); fetchBookings(d); };
    const prevDay = () => changeDate(toISO(addDays(new Date(`${date}T00:00:00`), -1)));
    const nextDay = () => changeDate(toISO(addDays(new Date(`${date}T00:00:00`), 1)));
    const isToday = date === toISO(new Date());

    const handleStatus = (booking, newStatus, done) => {
        window.apiFetch(`/driver/schedule/${booking.id}/status`, {
            method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ driver_status: newStatus }),
        }).then(() => {
            if (newStatus === "ended") {
                setBookings(prev => prev.map(b => b.id===booking.id ? {...b, driver_status:"ended", status:"completed"} : b));
                setNoteModal(booking);
            } else {
                setBookings(prev => prev.map(b => b.id===booking.id ? {...b, driver_status:newStatus} : b));
            }
            done?.();
        }).catch(() => done?.());
    };

    const total = bookings.length;
    const done  = bookings.filter(b => b.status==="completed").length;
    const active = bookings.filter(b => b.driver_status==="on_the_way").length;

    if (!car) return (
        <AppLayout title={tr("driverSchedule.pageTitle")}>
            <Head title={tr("driverSchedule.pageTitle")}/>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center", padding:40 }}>
                <div style={{ fontSize:52, marginBottom:16 }}>🚗</div>
                <div style={{ fontSize:18, fontWeight:800, color:theme.text, marginBottom:8 }}>{tr("driverSchedule.empty.noCarAssigned")}</div>
                <div style={{ fontSize:13, color:theme.textMute, maxWidth:300, lineHeight:1.7 }}>{tr("driverSchedule.empty.contactHrCarAssigned")}</div>
            </div>
        </AppLayout>
    );

    return (
        <AppLayout title={tr("driverSchedule.pageTitle")}>
            <Head title={tr("driverSchedule.pageTitle")}/>
            <style>{`
                @keyframes ds-fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                @keyframes ds-modal { from{opacity:0;transform:translateY(12px)scale(.98)} to{opacity:1;transform:none} }
                @keyframes ds-spin  { to{transform:rotate(360deg)} }
                .ds-page { animation: ds-fade .3s ease; }
                *::-webkit-scrollbar { display:none; }
            `}</style>

            <div className="ds-page" style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>

                {/* ── Hero ── */}
                <div style={{
                    background: dark ? "linear-gradient(135deg,#0a0f1e,#1a1040)" : "linear-gradient(135deg,#3730a3,#6366f1)",
                    borderRadius:20, padding:"22px 28px", marginBottom:20, position:"relative", overflow:"hidden",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.20)",
                }}>
                    <div style={{ position:"absolute", top:-24, right:-24, fontSize:120, opacity:0.06, lineHeight:1, userSelect:"none" }}>🚗</div>
                    <div style={{ position:"relative", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                        <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>🚗</div>
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.6)", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:3 }}>{tr("driverSchedule.pageTitle")}</div>
                            <div style={{ fontSize:20, fontWeight:900, color:"#fff" }}>{car?.name}</div>
                            <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginTop:3 }}>
                                {[car?.plate_number, car?.location && `📍 ${car.location}`, car?.capacity && `👥 ${car.capacity} ${tr("driverSchedule.units.seats")}`].filter(Boolean).join("  ·  ")}
                            </div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                            {[{l:tr("driverSchedule.stats.total"),v:total,c:"#fff"},{l:tr("driverSchedule.stats.active"),v:active,c:"#a5b4fc"},{l:tr("driverSchedule.stats.done"),v:done,c:"#6ee7b7"}].map(s=>(
                                <div key={s.l} style={{ textAlign:"center", padding:"8px 14px", borderRadius:12, background:"rgba(255,255,255,0.12)" }}>
                                    <div style={{ fontSize:18, fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}</div>
                                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:600, marginTop:2 }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Date nav ── */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, background:theme.surface, borderRadius:14, padding:"10px 14px", border:`1px solid ${theme.border}`, boxShadow:theme.shadowSm }}>
                    <button onClick={prevDay} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${theme.border}`, background:theme.surfaceSoft, color:theme.textSoft, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                    <div style={{ flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:14, fontWeight:700, color:theme.text }}>{fmtDate(date, locale)}</div>
                        {isToday && <div style={{ fontSize:10, fontWeight:700, color:theme.primary, letterSpacing:".05em" }}>{tr("driverSchedule.labels.todayUpper")}</div>}
                    </div>
                    <button onClick={nextDay} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${theme.border}`, background:theme.surfaceSoft, color:theme.textSoft, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                    <input type="date" value={date} onChange={e=>changeDate(e.target.value)}
                        style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${theme.border}`, background:theme.inputBg, color:theme.text, fontSize:12, fontFamily:"inherit", cursor:"pointer", outline:"none" }}/>
                    {!isToday && <button onClick={()=>changeDate(toISO(new Date()))} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${theme.primary}30`, background:theme.primarySoft, color:theme.primary, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{tr("driverSchedule.actions.today")}</button>}
                </div>

                {/* ── Status legend ── */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                    {Object.entries(DS).map(([k,v])=><Pill key={k} label={v.label} color={v.color} bg={v.bg}/>)}
                </div>

                {/* ── List ── */}
                {loading ? (
                    <div style={{ textAlign:"center", padding:"56px", color:theme.textMute, fontSize:13 }}>
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><Spinner size={22} color={theme.primary}/></div>
                        {tr("driverSchedule.messages.loadingSchedule")}
                    </div>
                ) : bookings.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"52px 24px", color:theme.textMute, background:theme.surface, borderRadius:16, border:`1px solid ${theme.border}` }}>
                        <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                        <div style={{ fontWeight:700, fontSize:14, color:theme.textSoft, marginBottom:4 }}>{tr("driverSchedule.empty.noBookingsOn")} {fmtShort(date, locale)}</div>
                        <div style={{ fontSize:12 }}>{tr("driverSchedule.empty.freeOnThisDay")}</div>
                    </div>
                ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {bookings.map(b=>(
                            <BookingCard key={b.id} booking={b} onStatusUpdate={handleStatus} onCancel={setCancelModal} theme={theme} dark={dark} tr={tr} locale={locale}/>
                        ))}
                    </div>
                )}
            </div>

            {cancelModal && <CancelModal booking={cancelModal} onClose={()=>{ setCancelModal(null); fetchBookings(date); }} theme={theme} tr={tr} locale={locale}/>}
            {noteModal   && <NoteModal   booking={noteModal}   onClose={()=>{ setNoteModal(null);   fetchBookings(date); }} theme={theme} tr={tr}/>}
        </AppLayout>
    );
}