import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

const statusConfig = {
    active:    { label: "Active",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    upcoming:  { label: "Upcoming",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    completed: { label: "Completed", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
    cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function daysLeft(endDate, status) {
    if (status === "completed" || status === "cancelled") return null;
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0)   return { label: "Ended",          color: "#94a3b8" };
    if (diff === 0) return { label: "Ends today",      color: "#dc2626" };
    if (diff <= 3)  return { label: `${diff}d left`,   color: "#dc2626" };
    if (diff <= 7)  return { label: `${diff}d left`,   color: "#d97706" };
    return               { label: `${diff}d left`,     color: "#64748b" };
}

function progressPercent(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end   = new Date(endDate).getTime();
    const now   = Date.now();
    if (now <= start) return 0;
    if (now >= end)   return 100;
    return Math.round(((now - start) / (end - start)) * 100);
}

function Badge({ status }) {
    const cfg = statusConfig[status] || statusConfig.active;
    return (
        <span style={{
            fontSize: 11, fontWeight: 600, color: cfg.color,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            padding: "3px 10px", borderRadius: 12,
        }}>{cfg.label}</span>
    );
}

function AssignmentCard({ assignment }) {
    const cfg       = statusConfig[assignment.status] || statusConfig.active;
    const dl        = daysLeft(assignment.end_date, assignment.status);
    const pct       = progressPercent(assignment.start_date, assignment.end_date);
    const totalDays = Math.ceil((new Date(assignment.end_date) - new Date(assignment.start_date)) / (1000 * 60 * 60 * 24));
    const totalHours = totalDays * assignment.hours_per_day;

    return (
        <div style={{
            background: "#fff",
            border: `1px solid ${assignment.status === "active" ? cfg.border : "#e2e8f0"}`,
            borderRadius: 12, padding: 20,
            boxShadow: assignment.status === "active" ? `0 0 0 1px ${cfg.border}` : "0 1px 3px rgba(0,0,0,0.04)",
        }}>
            {/* Top accent */}
            <div style={{
                height: 3, borderRadius: "12px 12px 0 0",
                background: cfg.color,
                margin: "-20px -20px 16px -20px",
                opacity: assignment.status === "active" ? 1 : 0.3,
            }} />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                        {assignment.project?.name}
                    </h3>
                    {assignment.notes && (
                        <p style={{ fontSize: 12, color: "#94a3b8" }}>{assignment.notes}</p>
                    )}
                </div>
                <Badge status={assignment.status} />
            </div>

            {/* Progress bar (active only) */}
            {assignment.status === "active" && (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Progress</span>
                        <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                            width: `${pct}%`, height: "100%",
                            background: cfg.color, borderRadius: 3,
                            transition: "width 0.8s ease",
                        }} />
                    </div>
                </div>
            )}

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                    { label: "Start Date",    value: formatDate(assignment.start_date) },
                    { label: "End Date",      value: formatDate(assignment.end_date)   },
                    { label: "Hours / Day",   value: `${assignment.hours_per_day}h`    },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: "#f8fafc", border: "1px solid #f1f5f9",
                        borderRadius: 8, padding: "8px 10px",
                    }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingTop: 10, borderTop: "1px solid #f1f5f9",
            }}>
                <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                    ~{totalHours.toLocaleString()}h total · {totalDays} days
                </span>
                {dl && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: dl.color }}>{dl.label}</span>
                )}
            </div>
        </div>
    );
}

export default function MyAssignments({ assignments = [], auth }) {
    const active    = assignments.filter(a => a.status === "active");
    const upcoming  = assignments.filter(a => a.status === "upcoming");
    const completed = assignments.filter(a => a.status === "completed");

    const totalHoursActive = active.reduce((sum, a) => {
        const days = Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / (1000 * 60 * 60 * 24));
        return sum + days * a.hours_per_day;
    }, 0);

    return (
        <AppLayout title="My Assignments">
            <Head title="My Assignments" />

            <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100%" }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                        My Assignments
                    </h1>
                    <p style={{ fontSize: 13, color: "#64748b" }}>
                        {auth?.user?.name} · Your current project assignments
                    </p>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
                    {[
                        { label: "Active Projects",    value: active.length,                           color: "#16a34a", bg: "#f0fdf4" },
                        { label: "Upcoming Projects",  value: upcoming.length,                         color: "#2563eb", bg: "#eff6ff" },
                        { label: "Completed",          value: completed.length,                        color: "#7c3aed", bg: "#f5f3ff" },
                        { label: "Est. Active Hours",  value: `~${totalHoursActive.toLocaleString()}h`, color: "#d97706", bg: "#fffbeb" },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: s.bg, border: `1px solid ${s.color}20`,
                            borderRadius: 10, padding: "14px 16px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: s.color, marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {assignments.length === 0 ? (
                    <div style={{
                        background: "#fff", border: "1px solid #e2e8f0",
                        borderRadius: 12, padding: "80px", textAlign: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div style={{ fontSize: 15, color: "#94a3b8", fontWeight: 500 }}>No assignments yet</div>
                        <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>You will be notified when a project is assigned to you</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

                        {/* Active */}
                        {active.length > 0 && (
                            <section>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                                    <h2 style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Active ({active.length})
                                    </h2>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 14 }}>
                                    {active.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                                </div>
                            </section>
                        )}

                        {/* Upcoming */}
                        {upcoming.length > 0 && (
                            <section>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
                                    <h2 style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Upcoming ({upcoming.length})
                                    </h2>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 14 }}>
                                    {upcoming.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                                </div>
                            </section>
                        )}

                        {/* Completed */}
                        {completed.length > 0 && (
                            <section>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />
                                    <h2 style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Completed ({completed.length})
                                    </h2>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 14, opacity: 0.65 }}>
                                    {completed.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}