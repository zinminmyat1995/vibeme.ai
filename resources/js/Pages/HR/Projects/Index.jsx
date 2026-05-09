import { useState, useEffect, useMemo,useRef  } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { createPortal } from "react-dom";

// ── Theme ─────────────────────────────────────────────────────────────────────
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
        surface:       "rgba(15,26,50,0.95)",
        surfaceSoft:   "rgba(255,255,255,0.04)",
        surfaceSofter: "rgba(255,255,255,0.07)",
        border:        "rgba(148,163,184,0.10)",
        borderStrong:  "rgba(148,163,184,0.20)",
        text:          "#f1f5f9",
        textSoft:      "#94a3b8",
        textMute:      "#475569",
        input:         "rgba(255,255,255,0.06)",
        inputBorder:   "rgba(148,163,184,0.18)",
        primary:       "#6366f1",
        primarySoft:   "rgba(99,102,241,0.18)",
        danger:        "#f87171",
        dangerSoft:    "rgba(248,113,113,0.14)",
        success:       "#34d399",
        successSoft:   "rgba(52,211,153,0.14)",
        shadow:        "0 24px 64px rgba(0,0,0,0.5)",
        overlay:       "rgba(0,0,0,0.6)",
        rowHover:      "rgba(255,255,255,0.03)",
    };
    return {
        bg:            "#f8fafc",
        surface:       "#ffffff",
        surfaceSoft:   "#f8fafc",
        surfaceSofter: "#f1f5f9",
        border:        "rgba(15,23,42,0.08)",
        borderStrong:  "rgba(15,23,42,0.15)",
        text:          "#0f172a",
        textSoft:      "#475569",
        textMute:      "#94a3b8",
        input:         "#ffffff",
        inputBorder:   "rgba(15,23,42,0.15)",
        primary:       "#4f46e5",
        primarySoft:   "rgba(79,70,229,0.10)",
        danger:        "#ef4444",
        dangerSoft:    "rgba(239,68,68,0.08)",
        success:       "#059669",
        successSoft:   "rgba(5,150,105,0.08)",
        shadow:        "0 24px 60px rgba(15,23,42,0.12)",
        overlay:       "rgba(0,0,0,0.4)",
        rowHover:      "#f8fafc",
    };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS = {
    active:    { label: "Active",    color: "#059669", bg: "rgba(5,150,105,0.10)",  bgDark: "rgba(52,211,153,0.14)"  },
    upcoming:  { label: "Upcoming",  color: "#4f46e5", bg: "rgba(79,70,229,0.10)",  bgDark: "rgba(99,102,241,0.18)"  },
    completed: { label: "Completed", color: "#0891b2", bg: "rgba(8,145,178,0.10)",  bgDark: "rgba(34,211,238,0.14)"  },
    cancelled: { label: "Cancelled", color: "#dc2626", bg: "rgba(220,38,38,0.09)",  bgDark: "rgba(248,113,113,0.14)" },
};


// ── Small components ──────────────────────────────────────────────────────────
function StatusBadge({ status, dark }) {
    const cfg = STATUS[status] || STATUS.upcoming;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 99,
            background: dark ? cfg.bgDark : cfg.bg,
            fontSize: 11, fontWeight: 700, color: cfg.color,
            letterSpacing: "0.03em", whiteSpace: "nowrap",
        }}>
            <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: cfg.color, flexShrink: 0,
            }} />
            {cfg.label}
        </span>
    );
}

function Spinner() {
    return (
        <span style={{
            display: "inline-block", width: 13, height: 13,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff", borderRadius: "50%",
            animation: "hrpjSpin 0.7s linear infinite",
        }} />
    );
}

function Field({ label, error, children }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.07em",
                color: "var(--ft-mute)", marginBottom: 5,
            }}>
                {label}
            </label>
            {children}
            {error && (
                <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4, margin: "4px 0 0" }}>
                    {error}
                </p>
            )}
        </div>
    );
}
// ── Project Modal (Create / Edit) ─────────────────────────────────────────────
function ProjectModal({ project, clients, currencies, onClose, dark, theme }) {
    const isEdit = !!project;
    const [form, setForm] = useState({
        name:           project?.name           || "",
        description:    project?.description    || "",
        status:         project?.status         || "upcoming",
        start_date:     project?.start_date     ? project.start_date.slice(0, 10) : "",
        end_date:       project?.end_date       ? project.end_date.slice(0, 10)   : "",
        client_id:      project?.client_id      ? String(project.client_id) : "",
        contract_value: project?.contract_value || "",
        currency:       project?.currency       || (currencies[0]?.code || "USD"),
        est_team_size:  project?.est_team_size  || "",
        client_name: project?.client_name || "",
    });
    const [errors,  setErrors] = useState({});
    const [saving,  setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const inp = (err) => ({
        width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
        outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        background: dark ? "rgba(255,255,255,0.06)" : "#fff",
        border: `1.5px solid ${err ? "#ef4444" : dark ? "rgba(148,163,184,0.20)" : "rgba(15,23,42,0.15)"}`,
        color: theme.text, transition: "border-color 0.15s",
    });

    // Dropdown options
    const statusOptions = [
        { value: "upcoming",  label: "Upcoming"  },
        { value: "active",    label: "Active"    },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];
    const clientOptions = [
        { value: "", label: "— No client —" },
        ...clients.map(c => ({ value: String(c.id), label: c.company_name + (c.country ? ` (${c.country})` : "") })),
    ];
    const currencyOptions = currencies.map(c => ({ value: c.currency_code, label: c.currency_code }));

    const validate = () => {
        const e = {};
        if (!form.name)           e.name           = "Required";
        if (!form.start_date)     e.start_date     = "Required";
        if (!form.end_date)       e.end_date       = "Required";
        if (!form.contract_value) e.contract_value = "Required";   // ← ထည့်
        if (!form.currency)       e.currency       = "Required";   // ← ထည့်
        if (!form.est_team_size)  e.est_team_size  = "Required";   // ← ထည့်
        // ← ဒါထည့် — client_id လည်းမရွေး၊ client_name လည်းမရိုက်ရင် error
        if (!form.client_id && !form.client_name)
            e.client = "Please select or type a client name";
        if (form.start_date && form.end_date && form.end_date < form.start_date)
            e.end_date = "Must be after start date";
        if (form.contract_value && isNaN(Number(form.contract_value)))
            e.contract_value = "Must be a valid number";
        return e;
    };

    const submit = () => {
        const e = validate();
        if (Object.keys(e).length) return setErrors(e);
        setSaving(true);
        const payload = {
            name:           form.name,
            description:    form.description,
            status:         form.status,
            start_date:     form.start_date,
            end_date:       form.end_date,
            client_id:      form.client_id      || null,
            contract_value: form.contract_value || null,
            currency:       form.currency,
            est_team_size:  form.est_team_size  || null,
            client_name: form.client_name || null, 
        };
        const opts = {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   ()  => setSaving(false),
        };
        if (isEdit) router.put(`/hr/projects/${project.id}`, payload, opts);
        else        router.post("/hr/projects", payload, opts);
    };

    return createPortal(
        <div style={{
            position: "fixed", inset: 0, background: theme.overlay,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9000, padding: 20, backdropFilter: "blur(4px)",
        }}>
            <style>{`
                @keyframes hrpjSpin { to { transform: rotate(360deg); } }
                @keyframes hrpjIn   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                @keyframes hrpjSpin { to { transform: rotate(360deg); } }
                .hrpj-table-scroll::-webkit-scrollbar { display: none; }
                .hrpj-modal::-webkit-scrollbar { display: none; }
                .hrpj-modal { scrollbar-width: none; }
            `}</style>

            <div className="hrpj-modal" style={{
                background: dark ? "#0d1526" : "#fff",
                borderRadius: 16, width: "100%", maxWidth: 500,
                maxHeight: "88vh", overflowY: "auto",
                boxShadow: theme.shadow,
                border: `1px solid ${theme.border}`,
                animation: "hrpjIn 0.2s ease",
            }}>

                {/* ── Header — Leave Request style ── */}
                <div style={{ height: 4, background: isEdit ? "linear-gradient(90deg,#059669,#10b981)" : "linear-gradient(90deg,#4f46e5,#3b82f6)" }} />
                <div style={{
                    padding: "18px 22px 14px",
                    borderBottom: `1px solid ${theme.border}`,
                    position: "sticky", top: 0, zIndex: 2,
                    background: dark ? "#0d1526" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 11, fontSize: 17,
                            background: isEdit
                                ? (dark ? "rgba(16,185,129,0.15)" : "#d1fae5")
                                : (dark ? "rgba(99,102,241,0.15)" : "#e0e7ff"),
                            border: `1px solid ${isEdit ? (dark ? "rgba(16,185,129,0.3)" : "#6ee7b7") : (dark ? "rgba(99,102,241,0.3)" : "#a5b4fc")}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {isEdit ? "✏️" : "📋"}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>
                                {isEdit ? "Edit Project" : "New Project"}
                            </div>
                            <div style={{ fontSize: 11, color: theme.textMute, marginTop: 1 }}>
                                Project Management
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 28, height: 28, borderRadius: 7,
                        border: `1px solid ${theme.border}`,
                        background: theme.surfaceSoft, color: theme.textMute,
                        fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: "18px 22px", "--ft-mute": theme.textMute }}>

                    <Field label="Project Name *" error={errors.name}>
                        <input
                            value={form.name}
                            onChange={e => set("name", e.target.value)}
                            placeholder="e.g. CRM System v2"
                            style={inp(errors.name)}
                        />
                    </Field>

                    <Field label="Description">
                        <textarea
                            value={form.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Brief description..."
                            rows={3}
                            style={{ ...inp(false), resize: "vertical", minHeight: 68 }}
                        />
                    </Field>

                    <Field label="Status">
                        <PremiumSelect
                            value={form.status}
                            onChange={v => set("status", v)}
                            options={statusOptions}
                            dark={dark}
                            theme={theme}
                        />
                    </Field>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <Field label="Start Date *" error={errors.start_date}>
                            <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} style={inp(errors.start_date)} />
                        </Field>
                        <Field label="End Date *" error={errors.end_date}>
                            <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} style={inp(errors.end_date)} />
                        </Field>
                    </div>

                    {/* ── Contract & Budget ── */}
                    <div style={{ height: 1, background: theme.border, margin: "4px 0 16px" }} />
                    <p style={{ fontSize: 11, fontWeight: 800, color: theme.success, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                        Contract & Budget
                    </p>

                    {/* Client */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{
                            display: "block", fontSize: 11, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.07em",
                            color: theme.textMute, marginBottom: 5,
                        }}>
                            Client
                        </label>

                        {/* Dropdown — existing client ရွေးချင်ရင် */}
                        <PremiumSelect
                            value={form.client_id}
                            onChange={v => { set("client_id", v); if (v) set("client_name", ""); }}
                            options={clientOptions}
                            placeholder="Select existing client..."
                            dark={dark}
                            theme={theme}
                        />

                        {/* Divider */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
                            <div style={{ flex: 1, height: 1, background: theme.border }} />
                            <span style={{ fontSize: 10, color: theme.textMute, fontWeight: 700, letterSpacing: "0.05em" }}>
                                OR TYPE MANUALLY
                            </span>
                            <div style={{ flex: 1, height: 1, background: theme.border }} />
                        </div>

                        {/* Free text — ပြင်ပ client ရိုက်ထည့်ချင်ရင် */}
                        <input
                            value={form.client_name || ""}
                            onChange={e => {
                                set("client_name", e.target.value);
                                if (e.target.value) set("client_id", "");
                            }}
                            placeholder="Or type client name manually..."
                            style={{
                                width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                                background: dark ? "rgba(255,255,255,0.06)" : "#fff",
                                border: `1.5px solid ${dark ? "rgba(148,163,184,0.20)" : "rgba(15,23,42,0.15)"}`,
                                color: theme.text, transition: "border-color 0.15s",
                            }}
                        />

                        {errors.client && (
                            <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                                {errors.client}
                            </p>
                        )}
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 100px", gap:10, marginBottom:16 }}>
                        <Field label="Contract Value *" error={errors.contract_value}>
                            <input type="number" min="0" step="0.01" value={form.contract_value}
                                onChange={e => set("contract_value", e.target.value)}
                                placeholder="0.00" style={inp(errors.contract_value)} />
                        </Field>
                        <Field label="Currency *" error={errors.currency}>
                            <PremiumSelect value={form.currency} onChange={v => set("currency", v)}
                                options={currencyOptions} dark={dark} theme={theme} />
                        </Field>
                        <Field label="Team Size *" error={errors.est_team_size}>
                            <input type="number" min="1" max="999" value={form.est_team_size}
                                onChange={e => set("est_team_size", e.target.value)}
                                placeholder="e.g. 4" style={inp(errors.est_team_size)} />
                        </Field>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: "12px 22px 18px",
                    borderTop: `1px solid ${theme.border}`,
                    display: "flex", gap: 10, justifyContent: "flex-end",
                    position: "sticky", bottom: 0,
                    background: dark ? "#0d1526" : "#fff",
                }}>
                    <button onClick={onClose} style={{
                        padding: "10px 20px", borderRadius: 8,
                        border: `1.5px solid ${theme.border}`,
                        background: theme.surfaceSoft, color: theme.textSoft,
                        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={saving} style={{
                        padding: "10px 24px", borderRadius: 8, border: "none",
                        background: saving ? "#818cf8" : isEdit ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#4f46e5,#3b82f6)",
                        color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 7,
                        fontFamily: "inherit", transition: "all 0.15s",
                        boxShadow: saving ? "none" : "0 4px 14px rgba(79,70,229,0.3)",
                    }}>
                        {saving && <Spinner />}
                        {saving ? (isEdit ? "Updating…" : "Creating…") : (isEdit ? "Update Project" : "Create Project")}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ project, onClose, dark, theme }) {
    const [deleting, setDeleting] = useState(false);

    const confirm = () => {
        if (deleting) return;
        setDeleting(true);
        router.delete(`/hr/projects/${project.id}`, {
            preserveScroll: true,
            onSuccess: () => { setDeleting(false); onClose(); },
            onError:   ()  => setDeleting(false),
        });
    };

    return createPortal(
        <div style={{
            position: "fixed", inset: 0, background: theme.overlay,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9001, padding: 20, backdropFilter: "blur(4px)",
        }}>
            <div style={{
                background: dark ? "#0d1526" : "#fff",
                borderRadius: 16, width: "100%", maxWidth: 400,
                boxShadow: theme.shadow, border: `1px solid ${theme.border}`,
                overflow: "hidden",
            }}>
                <div style={{ height: 4, background: "#ef4444" }} />
                <div style={{ padding: "22px 22px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 11, fontSize: 17,
                            background: dark ? "rgba(248,113,113,0.14)" : "#fee2e2",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: `1px solid ${dark ? "rgba(248,113,113,0.25)" : "#fca5a5"}`,
                        }}>🗑</div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>Delete Project</div>
                            <div style={{ fontSize: 11, color: theme.textMute, marginTop: 1 }}>This cannot be undone</div>
                        </div>
                    </div>
                    <div style={{
                        background: dark ? "rgba(255,255,255,0.04)" : "#f9fafb",
                        border: `1px solid ${theme.border}`,
                        borderRadius: 10, padding: "12px 14px", marginBottom: 18,
                    }}>
                        <p style={{ fontSize: 13, color: theme.textSoft, margin: 0 }}>
                            Are you sure you want to delete{" "}
                            <strong style={{ color: theme.text }}>"{project.name}"</strong>?
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: "11px", background: theme.surfaceSoft,
                            border: `1.5px solid ${theme.border}`, borderRadius: 10,
                            color: theme.textSoft, fontSize: 13, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                        }}>
                            Cancel
                        </button>
                        <button onClick={confirm} disabled={deleting} style={{
                            flex: 2, padding: "11px", border: "none", borderRadius: 10,
                            background: deleting ? "#f87171" : "linear-gradient(135deg,#ef4444,#dc2626)",
                            color: "#fff", fontSize: 13, fontWeight: 700,
                            cursor: deleting ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                            fontFamily: "inherit",
                            boxShadow: deleting ? "none" : "0 4px 14px rgba(239,68,68,0.3)",
                        }}>
                            {deleting && <Spinner />}
                            {deleting ? "Deleting…" : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function ActionGlyph({ type, color }) {
    if (type === 'edit') {
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
        );
    }

    if (type === 'delete') {
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
        );
    }

    return null;
}

function ProjectRow({ project, dark, theme, isLast, onEdit, onDelete }) {
    const fmt = (d) => d
        ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—";
    const fmtMoney = (v, cur) => v
        ? `${cur || "USD"} ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : "—";

    return (
        <div
            style={{
                display: "flex", alignItems: "center",
                borderBottom: isLast ? "none" : `1px solid ${theme.border}`,
                padding: "13px 20px", gap: 12,
                transition: "background 0.15s",
                minWidth: 1100,
            }}
            onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
            {/* Project name */}
            <div style={{ flex: "0 0 250px", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {project.name}
                </div>
                {project.description && (
                    <div style={{ fontSize: 11, color: theme.textMute, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {project.description}
                    </div>
                )}
            </div>

            {/* Client */}
            <div style={{ flex: "0 0 220px", minWidth: 0 }}>
                <div style={{ fontSize: 12, color: theme.textSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {project.client?.company_name || project.client_name || <span style={{ color: theme.textMute }}>—</span>}
                </div>
            </div>

            {/* Contract value */}
            <div style={{ flex: "0 0 180px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
                    {fmtMoney(project.contract_value, project.currency)}
                </div>
            </div>

            {/* Timeline */}
            <div style={{ flex: "0 0 220px" }}>
                <div style={{ fontSize: 11, color: theme.textSoft }}>
                    {fmt(project.start_date)} → {fmt(project.end_date)}
                </div>
            </div>

            {/* Team */}
            <div style={{ flex: "0 0 180px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: theme.textSoft }}>
                    {project.est_team_size ? `${project.est_team_size} person` : "—"}
                </div>
            </div>

            {/* Status */}
            <div style={{ flex: "150px" }}>
                <StatusBadge status={project.status} dark={dark} />
            </div>

            {/* Actions — User role form button style */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                    onClick={() => onEdit(project)}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        border: `1px solid ${theme.border}`,
                        background: theme.panelSoft,
                        color: theme.textSoft,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ActionGlyph type="edit" color={theme.textSoft} />
                </button>
                <button
                    onClick={() => onDelete(project)}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        border: `1px solid ${theme.border}`,
                        background: theme.dangerSoft,
                        color: theme.danger,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ActionGlyph type="delete" color={theme.textSoft} />
                </button>
            </div>
        </div>
    );
}


// ── Premium Select ────────────────────────────────────────────────────────────
// ── Premium Dropdown (OT form မှာသုံးတဲ့ smart position) ──────────────────────
function PremiumSelect({ value, onChange, options, placeholder, dark, theme, width = "100%" }) {
    const [open, setOpen]   = useState(false);
    const [pos,  setPos]    = useState({ top: 0, left: 0, width: 0, above: false });
    const triggerRef        = useRef(null);
    const menuRef           = useRef(null);
    const selected          = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const handler = e => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function handleOpen() {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            const MENU_H     = Math.min(options.length * 42, 220);
            const GAP        = 4;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const above      = spaceBelow < MENU_H + GAP || spaceAbove > spaceBelow + 40;
            setPos({
                top:   above ? rect.top - MENU_H - GAP : rect.bottom + GAP,
                left:  rect.left,
                width: rect.width,
                above,
            });
        }
        setOpen(v => !v);
    }

    return (
        <>
            {/* Trigger */}
            <div
                ref={triggerRef}
                onClick={handleOpen}
                style={{
                    width, height: 40, padding: "0 12px", borderRadius: 8,
                    border: `1.5px solid ${open
                        ? theme.primary
                        : dark ? "rgba(148,163,184,0.20)" : "rgba(15,23,42,0.15)"}`,
                    background: dark
                        ? "linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))"
                        : "linear-gradient(180deg,#fff,#f8fafc)",
                    color: selected ? theme.text : theme.textMute,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    cursor: "pointer", fontSize: 13, fontWeight: selected ? 600 : 400,
                    boxShadow: open ? `0 0 0 3px ${theme.primarySoft}` : "none",
                    transition: "all 0.18s", outline: "none", userSelect: "none",
                    boxSizing: "border-box",
                }}
            >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    {selected ? selected.label : (placeholder || "— Select —")}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={theme.textMute} strokeWidth="2.5" strokeLinecap="round"
                    style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>

            {/* Dropdown — fixed position, escapes modal overflow */}
            {open && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: "fixed",
                        top:   pos.top,
                        left:  pos.left,
                        width: pos.width,
                        zIndex: 99999,
                        background: dark ? "#0f1e3a" : "#fff",
                        border: `1.5px solid ${dark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.12)"}`,
                        borderRadius: 10, overflow: "hidden",
                        boxShadow: dark
                            ? "0 16px 40px rgba(0,0,0,0.55)"
                            : "0 8px 32px rgba(15,23,42,0.14)",
                        maxHeight: 220, overflowY: "auto",
                        scrollbarWidth: "none",
                    }}
                >
                    <style>{`.hrpj-dd::-webkit-scrollbar{display:none}`}</style>
                    <div className="hrpj-dd" style={{ maxHeight: 220, overflowY: "auto" }}>
                        {options.map(opt => {
                            const isActive = String(opt.value) === String(value);
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    style={{
                                        padding: "10px 14px", fontSize: 13, cursor: "pointer",
                                        color:      isActive ? "#fff" : theme.text,
                                        background: isActive
                                            ? "linear-gradient(135deg,#4f46e5,#3b82f6)"
                                            : "transparent",
                                        fontWeight: isActive ? 700 : 400,
                                        transition: "background 0.12s",
                                    }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                                >
                                    {opt.label}
                                </div>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HRProjectsIndex({ projects: raw = [], clients = [], currencies = [] }) {
    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const projects = Array.isArray(raw) ? raw : [];

    const [search,    setSearch]    = useState("");
    const [statusF,   setStatusF]   = useState("all");
    const [modal,     setModal]     = useState(null);   // null | "create" | project object
    const [delTarget, setDelTarget] = useState(null);

    const filtered = useMemo(() => projects.filter(p => {
        const q      = search.toLowerCase();
        const matchQ = !q || p.name.toLowerCase().includes(q) || p.client?.company_name?.toLowerCase().includes(q);
        const matchS = statusF === "all" || p.status === statusF;
        return matchQ && matchS;
    }), [projects, search, statusF]);

    const counts = useMemo(() => ({
        all:       projects.length,
        active:    projects.filter(p => p.status === "active").length,
        upcoming:  projects.filter(p => p.status === "upcoming").length,
        completed: projects.filter(p => p.status === "completed").length,
        cancelled: projects.filter(p => p.status === "cancelled").length,
    }), [projects]);

    const totalValue = useMemo(() =>
        projects
            .filter(p => p.contract_value)
            .reduce((s, p) => s + Number(p.contract_value), 0)
    , [projects]);

    const inp = {
        padding: "9px 13px", fontSize: 13, borderRadius: 9, outline: "none",
        background: dark ? "rgba(255,255,255,0.06)" : "#fff",
        border: `1.5px solid ${dark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.13)"}`,
        color: theme.text, fontFamily: "inherit",
    };

    const TABS = [
        { key: "all",       label: `All (${counts.all})`             },
        { key: "active",    label: `Active (${counts.active})`       },
        { key: "upcoming",  label: `Upcoming (${counts.upcoming})`   },
        { key: "completed", label: `Completed (${counts.completed})` },
        { key: "cancelled", label: `Cancelled (${counts.cancelled})` },
    ];

    const COL_HEADS = [
        { label: "Project",        w: "250px" },
        { label: "Client",         w: "220px" },
        { label: "Contract Value", w: "180px" },
        { label: "Timeline",       w: "220px" },
        { label: "Team",           w: "180px",  align: "center" },
        { label: "Status",         w: "150px" },
        { label: "",               ml: "auto" },
    ];

    return (
        <AppLayout title="Project Management">
            <Head title="Project Management" />
            <style>{`@keyframes hrpjSpin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                {/* ── Stats banner ── */}
                <div style={{
                    background: dark
                        ? "linear-gradient(135deg,rgba(79,70,229,0.18),rgba(59,130,246,0.12))"
                        : "linear-gradient(135deg,#eef2ff,#e0f2fe)",
                    border: `1px solid ${dark ? "rgba(99,102,241,0.25)" : "#c7d2fe"}`,
                    borderRadius: 14, padding: "18px 24px", marginBottom: 20,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", gap: 32 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "#818cf8" : "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Projects</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: dark ? "#e0e7ff" : "#3730a3", marginTop: 2 }}>{projects.length}</div>
                        </div>
                        <div style={{ width: 1, background: dark ? "rgba(148,163,184,0.15)" : "#c7d2fe" }} />
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "#818cf8" : "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Contract Value</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: dark ? "#e0e7ff" : "#3730a3", marginTop: 2 }}>
                                {totalValue > 0 ? `USD ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                            </div>
                        </div>
                        <div style={{ width: 1, background: dark ? "rgba(148,163,184,0.15)" : "#c7d2fe" }} />
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "#34d399" : "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>Active</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: dark ? "#6ee7b7" : "#047857", marginTop: 2 }}>{counts.active}</div>
                        </div>
                        <div style={{ width: 1, background: dark ? "rgba(148,163,184,0.15)" : "#c7d2fe" }} />
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "#818cf8" : "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em" }}>Upcoming</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: dark ? "#e0e7ff" : "#3730a3", marginTop: 2 }}>{counts.upcoming}</div>
                        </div>
                    </div>
                </div>

                {/* ── Search + New Project ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by project name..."
                        style={{ ...inp, flex: 1, boxSizing: "border-box" }}
                    />
                    <button
                        onClick={() => setModal("create")}
                        style={{
                            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                            padding: "10px 18px", borderRadius: 10, border: "none",
                            background: "linear-gradient(135deg,#4f46e5,#3b82f6)",
                            color: "#fff", fontSize: 13, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                            boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        + New Project
                    </button>
                </div>

                {/* ── Status tabs ── */}
                <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${theme.border}`, marginBottom: 16 }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusF(tab.key)}
                            style={{
                                padding: "9px 16px", border: "none", background: "none",
                                fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                                fontWeight: statusF === tab.key ? 700 : 500,
                                color: statusF === tab.key ? theme.primary : theme.textSoft,
                                borderBottom: statusF === tab.key
                                    ? `2px solid ${theme.primary}`
                                    : "2px solid transparent",
                                transition: "all 0.15s", marginBottom: -1,
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Table ── */}
                <div style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 14,
                    overflow: "hidden",
                }}>
                <div className="hrpj-table-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    <div style={{ minWidth: 1100 }}>
                        {/* Header row */}
                        <div style={{
                            display: "flex", alignItems: "center",
                            padding: "10px 20px", gap: 12,
                            borderBottom: `1px solid ${theme.border}`,
                            background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                            minWidth: 1100, 
                        }}>
                            {COL_HEADS.map((h, i) => (
                                <div key={i} style={{
                                    flex:       h.ml ? "1 1 auto" : `0 0 ${h.w}`,
                                    marginLeft: h.ml || 0,
                                    fontSize: 10, fontWeight: 800,
                                    textTransform: "uppercase", letterSpacing: "0.07em",
                                    color: theme.textMute, textAlign: h.align || "left",
                                }}>
                                    {h.label}
                                </div>
                            ))}
                            </div>

                                {/* Empty state */}
                                {filtered.length === 0 ? (
                                    <div style={{ padding: "48px 20px", textAlign: "center", color: theme.textMute, fontSize: 13 }}>
                                        {search || statusF !== "all"
                                            ? "No projects match your filters."
                                            : "No projects yet — create your first project."}
                                    </div>
                                ) : (
                                    filtered.map((p, i) => (
                                        <ProjectRow
                                            key={p.id}
                                            project={p}
                                            dark={dark}
                                            theme={theme}
                                            isLast={i === filtered.length - 1}
                                            onEdit={proj  => setModal(proj)}
                                            onDelete={proj => setDelTarget(proj)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>  {/* minWidth wrapper */}
                    </div>  {/* overflowX wrapper */}
                </div>  {/* outer border div */}

            {/* ── Modals ── */}
            {modal !== null && (
                <ProjectModal
                    project={modal === "create" ? null : modal}
                    clients={clients}
                    currencies={currencies}
                    dark={dark}
                    theme={theme}
                    onClose={() => setModal(null)}
                />
            )}
            {delTarget && (
                <DeleteModal
                    project={delTarget}
                    dark={dark}
                    theme={theme}
                    onClose={() => setDelTarget(null)}
                />
            )}
        </AppLayout>
    );
}