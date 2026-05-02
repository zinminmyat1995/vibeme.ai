import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

// ─────────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────────
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
        surface:      "rgba(15,26,50,0.95)",
        surfaceSoft:  "rgba(255,255,255,0.04)",
        surfaceSofter:"rgba(255,255,255,0.07)",
        border:       "rgba(148,163,184,0.10)",
        borderStrong: "rgba(148,163,184,0.18)",
        text:         "#f1f5f9",
        textSoft:     "#94a3b8",
        textMute:     "#475569",
        shadow:       "0 24px 64px rgba(0,0,0,0.48)",
        shadowSm:     "0 4px 16px rgba(0,0,0,0.28)",
        primary:      "#f59e0b",
        primarySoft:  "rgba(245,158,11,0.15)",
        success:      "#10b981",
        successSoft:  "rgba(16,185,129,0.15)",
        danger:       "#f87171",
        dangerSoft:   "rgba(248,113,113,0.15)",
        warning:      "#f59e0b",
        warningSoft:  "rgba(245,158,11,0.12)",
        blue:         "#60a5fa",
        blueSoft:     "rgba(96,165,250,0.15)",
        orange:       "#fb923c",
        orangeSoft:   "rgba(251,146,60,0.15)",
        inputBg:      "rgba(255,255,255,0.05)",
        overlay:      "rgba(2,8,23,0.75)",
    };
    return {
        bg:           "#f0f4fa",
        surface:      "#ffffff",
        surfaceSoft:  "#f8fafc",
        surfaceSofter:"#f1f5f9",
        border:       "rgba(15,23,42,0.08)",
        borderStrong: "rgba(15,23,42,0.14)",
        text:         "#0f172a",
        textSoft:     "#475569",
        textMute:     "#94a3b8",
        shadow:       "0 4px 24px rgba(15,23,42,0.08)",
        shadowSm:     "0 2px 8px rgba(15,23,42,0.06)",
        primary:      "#d97706",
        primarySoft:  "rgba(217,119,6,0.10)",
        success:      "#059669",
        successSoft:  "rgba(5,150,105,0.10)",
        danger:       "#dc2626",
        dangerSoft:   "rgba(220,38,38,0.08)",
        warning:      "#d97706",
        warningSoft:  "rgba(217,119,6,0.08)",
        blue:         "#2563eb",
        blueSoft:     "rgba(37,99,235,0.08)",
        orange:       "#ea580c",
        orangeSoft:   "rgba(234,88,12,0.08)",
        inputBg:      "#f8fafc",
        overlay:      "rgba(15,23,42,0.40)",
    };
}

// driver_status config
const STATUS_CONFIG = {
    start:      { label: "Not Started",  color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: "🕐", dot: "#94a3b8" },
    on_the_way: { label: "On The Way",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: "🚗", dot: "#3b82f6" },
    returned:   { label: "Returning",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "↩️", dot: "#f59e0b" },
    ended:      { label: "Completed",    color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "✅", dot: "#10b981" },
};

const TRIP_TYPE_LABEL = {
    one_way:    "One Way →",
    multi_stop: "Multi Stop ⤳",
    pickup:     "Pickup / Drop 📍",
    round_trip: "Round Trip ↩",
    wait_return:"Wait & Return 🔄",
};

const toISO = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toISOString().slice(0, 10);
};

const fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

// ─────────────────────────────────────────────────────────────────
// Small UI Helpers
// ─────────────────────────────────────────────────────────────────
function Avatar({ name, avatarUrl, size = 32 }) {
    const [err, setErr] = useState(false);
    const initials = (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const colors = ["#7c3aed","#2563eb","#059669","#d97706","#dc2626","#0891b2"];
    const color  = colors[(name || "").charCodeAt(0) % colors.length];
    const src    = avatarUrl ? (avatarUrl.startsWith("http") ? avatarUrl : `/storage/${avatarUrl}`) : null;
    if (src && !err) return <img src={src} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
    return <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.36, fontWeight: 800, flexShrink: 0 }}>{initials}</div>;
}

function StatusBadge({ status, theme }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.start;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: cfg.bg, fontSize: 11, fontWeight: 700, color: cfg.color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}

function BookingStatusBadge({ status, theme }) {
    const map = {
        approved:   { label: "Approved",   color: "#059669", bg: "rgba(5,150,105,0.10)" },
        waitlisted: { label: "Waitlisted", color: "#d97706", bg: "rgba(217,119,6,0.10)" },
        completed:  { label: "Completed",  color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
        cancelled:  { label: "Cancelled",  color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
    };
    const cfg = map[status] || map.approved;
    return (
        <span style={{ padding: "3px 9px", borderRadius: 20, background: cfg.bg, fontSize: 11, fontWeight: 700, color: cfg.color }}>
            {cfg.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────
// Cancel Modal
// ─────────────────────────────────────────────────────────────────
function CancelModal({ booking, onClose, theme, dark }) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const submit = () => {
        if (!reason.trim()) { setError("Cancel reason is required."); return; }
        setSubmitting(true);
        router.post(`/driver/schedule/${booking.id}/cancel`, { cancel_reason: reason }, {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onClose(); },
            onError: () => { setSubmitting(false); setError("Failed to cancel. Try again."); },
        });
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: theme.overlay, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 420, boxShadow: theme.shadow, border: `1px solid ${theme.border}`, animation: "ds-modal .22s ease" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: theme.dangerSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚫</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>Cancel Booking</div>
                        <div style={{ fontSize: 12, color: theme.textMute, marginTop: 2 }}>Organizer & attendees will be notified</div>
                    </div>
                </div>

                {/* Booking Info */}
                <div style={{ padding: "10px 14px", borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, marginBottom: 16, fontSize: 13 }}>
                    <div style={{ color: theme.textSoft }}>📅 {fmtDate(booking.booking_date)} · ⏰ {booking.start_time}{booking.end_time ? `–${booking.end_time}` : " (open-ended)"}</div>
                    <div style={{ color: theme.textMute, fontSize: 12, marginTop: 4 }}>Organizer: <strong style={{ color: theme.textSoft }}>{booking.organizer?.name}</strong></div>
                </div>

                {/* Reason */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: theme.textSoft, display: "block", marginBottom: 6 }}>Cancel Reason *</label>
                    <textarea
                        value={reason}
                        onChange={e => { setReason(e.target.value); setError(""); }}
                        placeholder="e.g. Car breakdown, tire puncture, engine issue…"
                        rows={3}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${error ? theme.danger : theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }}
                    />
                    {error && <p style={{ color: theme.danger, fontSize: 11, margin: "5px 0 0" }}>{error}</p>}
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
                    <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", background: theme.danger, color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? "Cancelling…" : "Confirm Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// End Trip Note Modal
// ─────────────────────────────────────────────────────────────────
function EndTripNoteModal({ booking, onClose, theme }) {
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const skip = () => onClose();

    const submit = () => {
        if (!note.trim()) { skip(); return; }
        setSubmitting(true);
        window.apiFetch(`/driver/schedule/${booking.id}/note`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note }),
        }).then(() => { setSubmitting(false); onClose(); })
          .catch(() => { setSubmitting(false); onClose(); });
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={skip}>
            <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 400, boxShadow: theme.shadow, border: `1px solid ${theme.border}`, animation: "ds-modal .22s ease" }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>Trip Completed!</div>
                    <div style={{ fontSize: 12, color: theme.textMute, marginTop: 4 }}>Add a note for this trip (optional)</div>
                </div>

                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Traffic delay on highway, passenger late 10 min, fuel refilled…"
                    rows={3}
                    autoFocus
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 16 }}
                />

                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={skip} style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Skip</button>
                    <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,#059669,#10b981)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        {submitting ? "Saving…" : "Save Note"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Booking Detail / Action Card
// ─────────────────────────────────────────────────────────────────
function BookingCard({ booking, onStatusUpdate, onCancel, theme, dark }) {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState("info");
    const status = booking.driver_status || "start";
    const cfg    = STATUS_CONFIG[status];
    const isCancelled = booking.status === "cancelled";
    const isCompleted = booking.status === "completed" || status === "ended";

    // Next action button
    const nextAction = !isCancelled && !isCompleted ? {
        start:      { label: "🚀 Start Trip",      next: "on_the_way", color: "#3b82f6",  glow: "rgba(59,130,246,0.3)" },
        on_the_way: { label: "↩️ Mark Returning",  next: "returned",   color: "#f59e0b",  glow: "rgba(245,158,11,0.3)" },
        returned:   { label: "✅ End Trip",         next: "ended",      color: "#059669",  glow: "rgba(5,150,105,0.3)" },
    }[status] : null;

    return (
        <div style={{ background: theme.surface, borderRadius: 20, border: `1px solid ${isCancelled ? theme.danger + "30" : theme.border}`, overflow: "hidden", boxShadow: theme.shadowSm, transition: "all .2s" }}>
            {/* Card Header */}
            <div onClick={() => setExpanded(v => !v)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                {/* Time Block */}
                <div style={{ flexShrink: 0, textAlign: "center", padding: "8px 14px", borderRadius: 14, background: isCancelled ? theme.dangerSoft : theme.primarySoft, minWidth: 70 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: isCancelled ? theme.danger : theme.primary, lineHeight: 1 }}>{booking.start_time}</div>
                    {booking.end_time && <div style={{ fontSize: 10, color: theme.textMute, marginTop: 3, fontWeight: 600 }}>{booking.end_time}</div>}
                    {!booking.end_time && <div style={{ fontSize: 10, color: theme.textMute, marginTop: 3 }}>open</div>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <BookingStatusBadge status={booking.status} theme={theme} />
                        {!isCancelled && <StatusBadge status={status} theme={theme} />}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booking.purpose}</div>
                    <div style={{ fontSize: 12, color: theme.textMute, marginTop: 2 }}>
                        {booking.organizer?.name}
                        {booking.attendees?.length > 0 && ` + ${booking.attendees.length} attendee${booking.attendees.length > 1 ? "s" : ""}`}
                    </div>
                </div>

                {/* Expand arrow */}
                <div style={{ fontSize: 12, color: theme.textMute, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div style={{ borderTop: `1px solid ${theme.border}` }}>
                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 4, padding: "12px 16px 0" }}>
                        {["info", "passengers", "notes"].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} style={{
                                padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                                border: "none", cursor: "pointer", fontFamily: "inherit",
                                background: activeTab === t ? theme.primary : "transparent",
                                color: activeTab === t ? "#fff" : theme.textMute,
                                transition: "all .15s",
                            }}>
                                {t === "info" ? "📋 Trip Info" : t === "passengers" ? `👥 Passengers (${(booking.attendees?.length || 0) + 1})` : `📝 Driver Notes (${booking.driver_notes?.length || 0})`}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: "14px 20px 20px" }}>
                        {/* Info Tab */}
                        {activeTab === "info" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {/* Trip details */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    {booking.trip_type && (
                                        <InfoRow label="Trip Type" value={TRIP_TYPE_LABEL[booking.trip_type] || booking.trip_type} theme={theme} />
                                    )}
                                    {booking.pickup_location && (
                                        <InfoRow label="Pickup From" value={booking.pickup_location} theme={theme} />
                                    )}
                                    {booking.return_time && (
                                        <InfoRow label="Return Time" value={booking.return_time} theme={theme} />
                                    )}
                                </div>

                                {/* Stops */}
                                {booking.stops?.length > 0 && (
                                    <div style={{ padding: "12px 14px", borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Destinations</div>
                                        {booking.stops.map((s, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < booking.stops.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                                                <div style={{ width: 22, height: 22, borderRadius: "50%", background: theme.primarySoft, color: theme.primary, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.order}</div>
                                                <div style={{ flex: 1, fontSize: 13, color: theme.text }}>{s.location}</div>
                                                {s.arrival_time && <div style={{ fontSize: 11, color: theme.textMute }}>{s.arrival_time}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cancel reason */}
                                {isCancelled && booking.cancel_reason && (
                                    <div style={{ padding: "10px 14px", borderRadius: 12, background: theme.dangerSoft, border: `1px solid ${theme.danger}30` }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.danger, marginBottom: 4 }}>CANCEL REASON</div>
                                        <div style={{ fontSize: 13, color: theme.text }}>{booking.cancel_reason}</div>
                                        {booking.cancelled_at && <div style={{ fontSize: 11, color: theme.textMute, marginTop: 4 }}>{booking.cancelled_at}</div>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Passengers Tab */}
                        {activeTab === "passengers" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {/* Organizer */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: theme.primarySoft, border: `1px solid ${theme.primary}20` }}>
                                    <Avatar name={booking.organizer?.name} avatarUrl={booking.organizer?.avatar_url} size={36} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{booking.organizer?.name}</div>
                                        <div style={{ fontSize: 11, color: theme.primary, fontWeight: 600 }}>Organizer</div>
                                    </div>
                                </div>
                                {/* Attendees */}
                                {booking.attendees?.map((a, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                                        <Avatar name={a.name} avatarUrl={a.avatar_url} size={36} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{a.name}</div>
                                            <div style={{ fontSize: 11, color: theme.textMute }}>Passenger</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Driver Notes Tab */}
                        {activeTab === "notes" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {booking.driver_notes?.length === 0 && (
                                    <div style={{ textAlign: "center", padding: "32px", color: theme.textMute, fontSize: 13 }}>
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
                                        <div>No driver notes yet.</div>
                                        <div style={{ fontSize: 11, marginTop: 4 }}>Notes are added after trip ends.</div>
                                    </div>
                                )}
                                {booking.driver_notes?.map((n, i) => (
                                    <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: theme.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>📝</div>
                                        <div>
                                            <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5 }}>{n.note}</div>
                                            <div style={{ fontSize: 11, color: theme.textMute, marginTop: 4 }}>{n.created_at}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!isCancelled && !isCompleted && (
                            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                                <button onClick={() => onCancel(booking)} style={{ padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${theme.danger}40`, background: "transparent", color: theme.danger, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                    🚫 Cancel Trip
                                </button>
                                {nextAction && (
                                    <button onClick={() => onStatusUpdate(booking, nextAction.next)} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${nextAction.color},${nextAction.color}cc)`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${nextAction.glow}` }}>
                                        {nextAction.label}
                                    </button>
                                )}
                            </div>
                        )}

                        {isCompleted && (
                            <div style={{ marginTop: 14, padding: "10px 16px", borderRadius: 12, background: theme.successSoft, border: `1px solid ${theme.success}30`, textAlign: "center", fontSize: 13, fontWeight: 600, color: theme.success }}>
                                ✅ Trip completed
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value, theme }) {
    return (
        <div style={{ padding: "8px 12px", borderRadius: 10, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>{value || "—"}</div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function DriverSchedule({ car, bookings: initialBookings, date: initialDate }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [date, setDate]         = useState(initialDate || toISO(new Date()));
    const [bookings, setBookings] = useState(initialBookings || []);
    const [loading, setLoading]   = useState(false);
    const [cancelModal, setCancelModal]     = useState(null);
    const [endNoteModal, setEndNoteModal]   = useState(null);

    // Fetch bookings when date changes
    const fetchBookings = useCallback(async (d) => {
        setLoading(true);
        try {
            const res  = await window.apiFetch(`/driver/schedule/bookings?date=${d}`);
            const data = await res.json();
            setBookings(data.bookings || []);
        } catch {}
        setLoading(false);
    }, []);

    const changeDate = (newDate) => {
        setDate(newDate);
        fetchBookings(newDate);
    };

    const prevDay = () => {
        const d = new Date(date + "T00:00:00");
        d.setDate(d.getDate() - 1);
        changeDate(toISO(d));
    };
    const nextDay = () => {
        const d = new Date(date + "T00:00:00");
        d.setDate(d.getDate() + 1);
        changeDate(toISO(d));
    };
    const goToday = () => changeDate(toISO(new Date()));

    const isToday = date === toISO(new Date());

    // Status update
    const handleStatusUpdate = (booking, newStatus) => {
        if (newStatus === "ended") {
            // Update first, then show note modal
            window.apiFetch(`/driver/schedule/${booking.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driver_status: newStatus }),
            }).then(() => {
                setBookings(prev => prev.map(b => b.id === booking.id
                    ? { ...b, driver_status: "ended", status: "completed" }
                    : b
                ));
                setEndNoteModal(booking);
            });
        } else {
            window.apiFetch(`/driver/schedule/${booking.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driver_status: newStatus }),
            }).then(() => {
                setBookings(prev => prev.map(b => b.id === booking.id
                    ? { ...b, driver_status: newStatus }
                    : b
                ));
            });
        }
    };

    // After note modal closes, refresh bookings
    const handleNoteClose = () => {
        setEndNoteModal(null);
        fetchBookings(date);
    };

    // Stats
    const total     = bookings.length;
    const completed = bookings.filter(b => b.status === "completed").length;
    const active    = bookings.filter(b => b.driver_status === "on_the_way").length;
    const pending   = bookings.filter(b => b.driver_status === "start" && b.status !== "cancelled").length;


    if (!car) {
        return (
            <AppLayout title="Trip Schedule">
                <Head title="Trip Schedule" />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>🚗</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 8 }}>No Car Assigned Yet</div>
                    <div style={{ fontSize: 14, color: theme.textMute, maxWidth: 340, lineHeight: 1.6 }}>
                        Your account hasn't been assigned to a vehicle yet.<br />
                        Please contact HR to get a car assigned to you.
                    </div>
                </div>
            </AppLayout>
        );
    }
    
    return (
        <AppLayout title="Trip Schedule">
            <Head title="Trip Schedule" />
            <style>{`
                @keyframes ds-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
                @keyframes ds-modal { from{opacity:0;transform:translateY(14px)scale(.97)} to{opacity:1;transform:none} }
                .ds-page { animation: ds-fade .3s ease; }
                *::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="ds-page" style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 40px" }}>

                {/* ── Hero Banner ── */}
                <div style={{
                    background: dark
                        ? "linear-gradient(135deg,#1a0a00,#2d1500,#1a0a00)"
                        : "linear-gradient(135deg,#92400e,#d97706,#f59e0b)",
                    borderRadius: 24, padding: "24px 28px", marginBottom: 24,
                    boxShadow: "0 8px 32px rgba(217,119,6,0.25)",
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", top: -20, right: -20, fontSize: 100, opacity: 0.08 }}>🚗</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, backdropFilter: "blur(10px)" }}>🚗</div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Trip Schedule</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{car?.name}</div>
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                                🪪 {car?.plate_number}
                                {car?.location && ` · 📍 ${car.location}`}
                                {car?.capacity && ` · 👥 ${car.capacity} seats`}
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                            {[
                                { label: "Today", value: total, color: "#fff" },
                                { label: "Active", value: active, color: "#fcd34d" },
                                { label: "Done", value: completed, color: "#6ee7b7" },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: "center", padding: "8px 14px", borderRadius: 14, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Date Navigator ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, background: theme.surface, borderRadius: 18, padding: "10px 16px", border: `1px solid ${theme.border}`, boxShadow: theme.shadowSm }}>
                    <button onClick={prevDay} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.textSoft, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>

                    <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>{fmtDate(date)}</div>
                        {isToday && <div style={{ fontSize: 11, fontWeight: 700, color: theme.primary, letterSpacing: ".05em" }}>TODAY</div>}
                    </div>

                    <button onClick={nextDay} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.textSoft, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>

                    <input type="date" value={date} onChange={e => changeDate(e.target.value)}
                        style={{ padding: "7px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 12, fontFamily: "inherit", cursor: "pointer", outline: "none" }} />

                    {!isToday && (
                        <button onClick={goToday} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${theme.primary}40`, background: theme.primarySoft, color: theme.primary, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Today</button>
                    )}
                </div>

                {/* ── Booking List ── */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: theme.textMute, fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                        Loading schedule…
                    </div>
                ) : bookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: theme.textMute, fontSize: 13, background: theme.surface, borderRadius: 20, border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: theme.textSoft }}>No bookings on {fmtDate(date)}</div>
                        <div style={{ fontSize: 12, marginTop: 6 }}>You're free on this day.</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Status legend */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: v.bg, fontSize: 11, fontWeight: 600, color: v.color }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.dot }} />
                                    {v.label}
                                </div>
                            ))}
                        </div>

                        {bookings.map(b => (
                            <BookingCard
                                key={b.id}
                                booking={b}
                                onStatusUpdate={handleStatusUpdate}
                                onCancel={setCancelModal}
                                theme={theme}
                                dark={dark}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {cancelModal && (
                <CancelModal
                    booking={cancelModal}
                    onClose={() => { setCancelModal(null); fetchBookings(date); }}
                    theme={theme}
                    dark={dark}
                />
            )}

            {/* End Trip Note Modal */}
            {endNoteModal && (
                <EndTripNoteModal
                    booking={endNoteModal}
                    onClose={handleNoteClose}
                    theme={theme}
                />
            )}
        </AppLayout>
    );
}