// resources/js/Pages/Payroll/BankExport/Index.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { createPortal } from 'react-dom';

// ── Helpers ───────────────────────────────────────────────────────
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const fmt  = (v) => Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Global toast helper ───────────────────────────────────────────
const toast = (message, type = 'success') =>
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { message, type } }));

// ── Dark mode hook ────────────────────────────────────────────────
function useReactiveTheme() {
    const getDark = () => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'dark'
            || localStorage.getItem('vibeme-theme') === 'dark';
    };
    const [dark, setDark] = useState(getDark);
    useEffect(() => {
        const sync = () => setDark(getDark());
        window.addEventListener('vibeme-theme-change', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('vibeme-theme-change', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return dark;
}

// ── Theme tokens ──────────────────────────────────────────────────
function getTheme(dark) {
    if (dark) return {
        bg:          '#0b1324',
        surface:     '#1e293b',
        surfaceSoft: 'rgba(255,255,255,0.04)',
        border:      'rgba(148,163,184,0.12)',
        borderMed:   'rgba(148,163,184,0.2)',
        text:        '#f8fafc',
        textSoft:    '#cbd5e1',
        textMute:    '#64748b',
        inputBg:     'rgba(255,255,255,0.06)',
        inputBorder: 'rgba(148,163,184,0.18)',
        tableHead:   'rgba(255,255,255,0.03)',
        rowAlt:      'rgba(255,255,255,0.02)',
        shadow:      '0 1px 3px rgba(0,0,0,0.3)',
        primary:     '#8b5cf6',
        primarySoft: 'rgba(139,92,246,0.16)',
        success:     '#34d399',
        successSoft: 'rgba(52,211,153,0.14)',
        warning:     '#fbbf24',
        danger:      '#f87171',
        dangerSoft:  'rgba(248,113,113,0.14)',
        menuBg:      'linear-gradient(180deg,rgba(15,23,42,0.99) 0%,rgba(10,18,36,0.99) 100%)',
    };
    return {
        bg:          '#f1f5f9',
        surface:     '#ffffff',
        surfaceSoft: '#f8fafc',
        border:      '#e5e7eb',
        borderMed:   '#d1d5db',
        text:        '#111827',
        textSoft:    '#374151',
        textMute:    '#9ca3af',
        inputBg:     '#ffffff',
        inputBorder: '#e5e7eb',
        tableHead:   '#f9fafb',
        rowAlt:      '#fafafa',
        shadow:      '0 1px 3px rgba(0,0,0,0.06)',
        primary:     '#7c3aed',
        primarySoft: '#ede9fe',
        success:     '#059669',
        successSoft: '#d1fae5',
        warning:     '#d97706',
        danger:      '#dc2626',
        dangerSoft:  '#fef2f2',
        menuBg:      '#ffffff',
    };
}

// ── PremiumSelect ─────────────────────────────────────────────────
function PremiumSelect({ options = [], value = '', onChange, placeholder = 'Select…', disabled = false, width = 'auto', zIndex = 3000, dark, theme }) {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
    const triggerRef      = useRef(null);
    const menuRef         = useRef(null);
    const selected        = options.find(o => String(o.value) === String(value) && !o.disabled);

    useEffect(() => {
        const h = e => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    function handleOpen() {
        if (disabled) return;
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

    const triggerBg = dark
        ? 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.04) 100%)'
        : 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)';

    return (
        <>
            <button
                ref={triggerRef} type="button" onClick={handleOpen}
                style={{
                    width, height: 38, padding: '0 12px',
                    borderRadius: 8,
                    border: `1.5px solid ${open ? theme.primary : theme.inputBorder}`,
                    background: disabled ? theme.surfaceSoft : triggerBg,
                    color: selected ? theme.text : theme.textMute,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: selected ? 600 : 400,
                    boxShadow: open ? `0 0 0 3px ${dark ? 'rgba(139,92,246,0.18)' : 'rgba(124,58,237,0.12)'}` : 'none',
                    transition: 'all 0.16s', opacity: disabled ? 0.5 : 1, outline: 'none',
                    fontFamily: 'inherit',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected?.label ?? placeholder}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2.5"
                    style={{ flexShrink: 0, transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && createPortal(
                <div ref={menuRef} style={{
                    position: 'absolute', top: pos.top, left: pos.left, width: pos.width,
                    zIndex,
                    background: theme.menuBg,
                    border: `1px solid ${theme.borderMed}`,
                    borderRadius: 10,
                    boxShadow: dark
                        ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
                        : '0 16px 40px rgba(15,23,42,0.14)',
                    overflow: 'hidden',
                    animation: 'beDropIn 0.15s ease',
                    backdropFilter: dark ? 'blur(20px)' : 'none',
                }}>
                    <div style={{ maxHeight: 260, overflowY: 'auto', padding: '4px' }}>
                        {options.map(opt => {
                            const isSel = String(opt.value) === String(value);
                            return (
                                <button key={opt.value} type="button"
                                    onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                                    style={{
                                        width: '100%', padding: '8px 11px', border: 'none', borderRadius: 7,
                                        background: isSel ? (dark ? theme.primarySoft : '#ede9fe') : 'transparent',
                                        color: isSel ? theme.primary : opt.disabled ? theme.textMute : theme.text,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                        fontSize: 13, fontWeight: isSel ? 700 : 500,
                                        textAlign: 'left', marginBottom: 1,
                                        opacity: opt.disabled ? 0.45 : 1,
                                        transition: 'background 0.1s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => { if (!isSel && !opt.disabled) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f5f3ff'; }}
                                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span>{opt.label}</span>
                                    {isSel && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3">
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

// ── Spinner ───────────────────────────────────────────────────────
function Spinner({ size = 14, color = '#7c3aed' }) {
    return <div style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: '50%', animation: 'beSpin 0.7s linear infinite', flexShrink: 0 }} />;
}

// ── StatusPill ────────────────────────────────────────────────────
function StatusPill({ status, dark }) {
    const c = status === 'paid'
        ? { bg: dark ? 'rgba(52,211,153,0.16)' : '#d1fae5', color: dark ? '#34d399' : '#059669', label: 'Paid', dot: '#34d399' }
        : { bg: dark ? 'rgba(139,92,246,0.18)' : '#ede9fe', color: dark ? '#a78bfa' : '#7c3aed', label: 'Confirmed', dot: '#a78bfa' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: c.color, background: c.bg, borderRadius: 99, padding: '3px 10px', whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
            {c.label}
        </span>
    );
}

// ── Main ──────────────────────────────────────────────────────────
export default function BankExportIndex({ salaryRule, periodTemplates, employees }) {
    const dark  = useReactiveTheme();
    const theme = React.useMemo(() => getTheme(dark), [dark]);

    const now         = new Date();
    const cycle       = salaryRule?.pay_cycle ?? 'monthly';
    const periodCount = cycle === 'semi_monthly' ? 2 : cycle === 'ten_day' ? 3 : 1;
    const years       = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

    const defaultPeriodId = periodCount > 1 && periodTemplates.length > 0
        ? String(periodTemplates[0].id) : '';

    const [year,       setYear]       = useState(now.getFullYear());
    const [month,      setMonth]      = useState(now.getMonth() + 1);
    const [periodId,   setPeriodId]   = useState(defaultPeriodId);
    const [userId,     setUserId]     = useState('');
    const [preview,    setPreview]    = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [excelLoad,  setExcelLoad]  = useState(false);
    const [pdfLoad,    setPdfLoad]    = useState(false);
    const [paying,     setPaying]     = useState(null);
    const [markingAll, setMarkingAll] = useState(false);

    const buildParams = useCallback(() => {
        const p = new URLSearchParams();
        if (year)     p.set('year',      year);
        if (month)    p.set('month',     month);
        if (periodId) p.set('period_id', periodId);
        if (userId)   p.set('user_id',   userId);
        return p.toString();
    }, [year, month, periodId, userId]);

    const loadPreview = useCallback(async () => {
        setLoading(true);
        setPreview(null);
        try {
            const res  = await fetch(`/payroll/export/preview?${buildParams()}`);
            const data = await res.json();
            setPreview(data);
        } catch {
            toast('Failed to load preview', 'error');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => { loadPreview(); }, [loadPreview]);

    const download = async (type, setLoad) => {
        setLoad(true);
        try {
            const res = await fetch(`/payroll/export/${type}?${buildParams()}`, { headers: { 'X-CSRF-TOKEN': csrf() } });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Download failed');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `bank_transfer_${preview?.period_label?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'export'}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
            a.click();
            URL.revokeObjectURL(url);
            toast(`${type === 'excel' ? 'Excel' : 'PDF'} downloaded successfully!`);
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setLoad(false);
        }
    };

    const markAsPaid = async (recordId) => {
        setPaying(recordId);
        try {
            const res  = await fetch(`/payroll/export/mark-paid/${recordId}`, { method: 'PATCH', headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message ?? 'Failed');
            setPreview(prev => prev ? { ...prev, records: prev.records.map(r => r.id === recordId ? { ...r, status: 'paid' } : r) } : prev);
            toast('Marked as paid');
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setPaying(null);
        }
    };

    const markAllPaid = async () => {
        setMarkingAll(true);
        try {
            const res  = await fetch(`/payroll/export/mark-all-paid?${buildParams()}`, { method: 'PATCH', headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message ?? 'Failed');
            setPreview(prev => prev ? { ...prev, records: prev.records.map(r => ({ ...r, status: 'paid' })) } : prev);
            toast(`${data.updated ?? ''} records marked as paid`);
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setMarkingAll(false);
        }
    };

    const records    = preview?.records ?? [];
    const hasData    = records.length > 0;
    const currency   = preview?.currency ?? salaryRule?.currency_code ?? 'USD';
    const totalAmt   = preview?.total ?? 0;
    const hasPending = records.some(r => r.status !== 'paid');

    // ── Options ──
    const yearOpts   = years.map(y => ({ value: y, label: String(y) }));
    const monthOpts  = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
    const periodOpts = periodTemplates.map(p => ({ value: p.id, label: `Period ${p.period_number}` }));
    const empOpts    = [{ value: '', label: 'All Employees' }, ...employees.map(e => ({ value: e.id, label: e.name }))];

    return (
        <AppLayout title="Bank Export">
            <Head title="Bank Export" />
            <style>{`
                @keyframes beSpin   { to { transform: rotate(360deg) } }
                @keyframes beDropIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
                @keyframes beFadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
                .be-row:hover td { background: ${dark ? 'rgba(139,92,246,0.05)' : '#faf5ff'} !important; }
                .be-icon-btn:hover { opacity: 0.8; transform: translateY(-1px); }
            `}</style>

            <div style={{ animation: 'beFadeUp 0.25s ease' }}>

                {/* ── Filter card ───────────────────────────────── */}
                <div style={{ background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`, padding: '16px 20px', marginBottom: 16, boxShadow: theme.shadow }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: theme.textMute, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
                        Pay Period Filter
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

                        {/* Year */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year</div>
                            <PremiumSelect options={yearOpts} value={year} onChange={v => setYear(Number(v))} width={90} dark={dark} theme={theme} />
                        </div>

                        {/* Month */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Month</div>
                            <PremiumSelect options={monthOpts} value={month} onChange={v => setMonth(Number(v))} width={130} dark={dark} theme={theme} />
                        </div>

                        {/* Period */}
                        {periodCount > 1 && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Period</div>
                                <PremiumSelect options={periodOpts} value={periodId} onChange={v => setPeriodId(v)} width={120} dark={dark} theme={theme} />
                            </div>
                        )}

                        {/* Divider */}
                        <div style={{ width: 1, height: 38, background: theme.border, margin: '0 4px', alignSelf: 'flex-end' }} />

                        {/* Employee */}
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMute, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</div>
                            <PremiumSelect options={empOpts} value={userId} onChange={v => setUserId(v)} width={200} dark={dark} theme={theme} />
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={loadPreview} disabled={loading}
                            style={{ alignSelf: 'flex-end', height: 38, padding: '0 16px', borderRadius: 8, border: `1.5px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.textSoft, fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'all 0.15s' }}
                        >
                            {loading ? <><Spinner size={12} color={theme.textMute} />Loading…</> : <>🔄 Refresh</>}
                        </button>
                    </div>
                </div>

                {/* ── Main table card ───────────────────────────── */}
                <div style={{ background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.shadow }}>

                    {/* Toolbar */}
                    <div style={{ padding: '12px 18px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>

                        {/* Left */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Spinner size={13} />
                                    <span style={{ fontSize: 12, color: theme.textMute }}>Loading…</span>
                                </div>
                            ) : hasData ? (
                                <>
                                    <span style={{ background: theme.primary, color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 7, padding: '3px 10px' }}>
                                        {records.length} {records.length === 1 ? 'Record' : 'Records'}
                                    </span>
                                    <span style={{ fontSize: 11, color: theme.textMute }}>ready for transfer</span>
                                    {/* Total */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginLeft: 8 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMute }}>{currency}</span>
                                        <span style={{ fontSize: 18, fontWeight: 800, color: theme.success, letterSpacing: '-0.5px' }}>{fmt(totalAmt)}</span>
                                    </div>
                                </>
                            ) : (
                                <span style={{ fontSize: 12, color: theme.textMute }}>No confirmed records found</span>
                            )}
                        </div>

                        {/* Right — action buttons */}
                        {hasData && !loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                                {/* Excel */}
                                <button
                                    onClick={() => download('excel', setExcelLoad)} disabled={excelLoad}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 700, cursor: excelLoad ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', opacity: excelLoad ? 0.7 : 1 }}
                                >
                                    {excelLoad ? <Spinner size={12} color="#fff" /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>}
                                    {excelLoad ? 'Exporting…' : 'Excel'}
                                </button>

                                {/* PDF */}
                                <button
                                    onClick={() => download('pdf', setPdfLoad)} disabled={pdfLoad}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: pdfLoad ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', opacity: pdfLoad ? 0.7 : 1 }}
                                >
                                    {pdfLoad ? <Spinner size={12} color="#fff" /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>}
                                    {pdfLoad ? 'Generating…' : 'PDF'}
                                </button>

                                {/* Mark All Paid */}
                                {hasPending && (
                                    <>
                                        <div style={{ width: 1, height: 24, background: theme.border }} />
                                        <button
                                            onClick={markAllPaid} disabled={markingAll}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${theme.border}`, background: dark ? 'rgba(52,211,153,0.12)' : '#f0fdf4', color: dark ? '#34d399' : '#059669', fontSize: 12, fontWeight: 700, cursor: markingAll ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                        >
                                            {markingAll ? <><Spinner size={12} color={dark ? '#34d399' : '#059669'} />Saving…</> : <>✓ Mark All Paid</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <Spinner size={28} />
                            <span style={{ fontSize: 13, color: theme.textMute, fontWeight: 600 }}>Loading records…</span>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !hasData && (
                        <div style={{ padding: '56px 22px', textAlign: 'center' }}>
                            <div style={{ fontSize: 40, marginBottom: 14 }}>🏦</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 6 }}>No confirmed payroll records</div>
                            <div style={{ fontSize: 12, color: theme.textMute, lineHeight: 1.6 }}>
                                Payroll records must be <strong>confirmed</strong> before they appear here.<br />
                                Go to Payroll → Preview &amp; Approve to confirm records.
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    {!loading && hasData && (
                        <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: theme.tableHead, borderBottom: `2px solid ${theme.border}` }}>
                                        {[
                                            ['#',          'center', 40],
                                            ['Employee',   'left',   null],
                                            ['Bank',       'left',   null],
                                            ['Account No', 'left',   null],
                                            ['Dept',       'center', null],
                                            ['Status',     'center', 110],
                                            ['Net Salary', 'right',  160],
                                            ['',           'center', 80],
                                        ].map(([label, align, width]) => (
                                            <th key={label} style={{ padding: '10px 14px', textAlign: align, fontSize: 10, fontWeight: 800, color: theme.textMute, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', ...(width ? { width } : {}) }}>
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, i) => (
                                        <tr key={r.id ?? i} className="be-row" style={{ background: i % 2 === 0 ? theme.surface : theme.rowAlt, borderBottom: `1px solid ${theme.border}` }}>
                                            {/* # */}
                                            <td style={{ padding: '10px 14px', textAlign: 'center', color: theme.textMute, fontSize: 11, fontWeight: 600 }}>{i + 1}</td>

                                            {/* Employee */}
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ fontWeight: 700, color: theme.text, fontSize: 13 }}>{r.account_holder_name}</div>
                                                {r.employee_name !== r.account_holder_name && (
                                                    <div style={{ fontSize: 10, color: theme.textMute, marginTop: 1 }}>{r.employee_name}</div>
                                                )}
                                            </td>

                                            {/* Bank */}
                                            <td style={{ padding: '10px 14px', color: r.bank_name === '-' ? theme.warning : theme.textSoft }}>
                                                {r.bank_name === '-'
                                                    ? <span style={{ fontSize: 11, fontWeight: 600 }}>⚠ Not set</span>
                                                    : r.bank_name}
                                            </td>

                                            {/* Account */}
                                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', letterSpacing: '0.5px', color: r.account_number === '-' ? theme.warning : theme.textSoft }}>
                                                {r.account_number === '-'
                                                    ? <span style={{ fontSize: 11, fontWeight: 600 }}>⚠ Not set</span>
                                                    : r.account_number}
                                            </td>

                                            {/* Dept */}
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                {r.department && r.department !== '-'
                                                    ? <span style={{ background: theme.surfaceSoft, border: `1px solid ${theme.border}`, color: theme.textSoft, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{r.department}</span>
                                                    : <span style={{ color: theme.border }}>—</span>
                                                }
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                <StatusPill status={r.status} dark={dark} />
                                            </td>

                                            {/* Net Salary */}
                                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                                <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMute, marginRight: 4 }}>{currency}</span>
                                                <span style={{ fontSize: 14, fontWeight: 800, color: theme.success }}>{fmt(r.net_salary)}</span>
                                            </td>

                                            {/* Mark Paid */}
                                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                {r.status !== 'paid' ? (
                                                    <button
                                                        onClick={() => markAsPaid(r.id)}
                                                        disabled={paying === r.id}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: 'none', background: dark ? 'rgba(52,211,153,0.12)' : '#f0fdf4', color: dark ? '#34d399' : '#059669', fontSize: 11, fontWeight: 700, cursor: paying === r.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                                                    >
                                                        {paying === r.id ? <Spinner size={10} color={dark ? '#34d399' : '#059669'} /> : '✓'}
                                                        {paying === r.id ? '' : 'Paid'}
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: theme.textMute }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Info note ──────────────────────────────────── */}
                <div style={{ marginTop: 14, padding: '10px 16px', background: dark ? 'rgba(251,191,36,0.06)' : '#fffbeb', border: `1.5px solid ${dark ? 'rgba(251,191,36,0.2)' : '#fde68a'}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 11, color: dark ? '#fbbf24' : '#92400e', fontWeight: 500, lineHeight: 1.6 }}>
                        Only <strong>confirmed</strong> payroll records are included. Bank account details come from Employee Salary profiles.
                        Employees with missing bank info are marked with ⚠.
                    </span>
                </div>
            </div>
        </AppLayout>
    );
}