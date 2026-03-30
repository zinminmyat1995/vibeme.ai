// resources/js/Pages/Payroll/BankExport/Index.jsx
import { useState, useCallback, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ── Helpers ──────────────────────────────────────────────────────
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function Toast({ msg, type, onClose }) {
    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [msg]);

    if (!msg) return null;
    const bg     = type === 'error' ? '#fef2f2' : '#f0fdf4';
    const border = type === 'error' ? '#fca5a5' : '#86efac';
    const color  = type === 'error' ? '#dc2626' : '#16a34a';
    return (
        <div style={{ position:'fixed', top:20, right:24, zIndex:9999, background:bg, border:`1.5px solid ${border}`, borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', animation:'slideIn 0.2s ease', maxWidth:360 }}>
            <span style={{ fontSize:16 }}>{type === 'error' ? '⚠️' : '✅'}</span>
            <span style={{ fontSize:13, fontWeight:600, color, flex:1 }}>{msg}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color, fontSize:16, lineHeight:1 }}>×</button>
        </div>
    );
}

function Spinner({ size = 14, color = '#fff' }) {
    return (
        <span style={{ display:'inline-block', width:size, height:size, border:`2px solid ${color}33`, borderTop:`2px solid ${color}`, borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }} />
    );
}

function StatusBadge({ count, total, currency }) {
    const hasRecords = count > 0;
    return (
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, background: hasRecords ? '#f0fdf4' : '#fefce8', border:`1.5px solid ${hasRecords ? '#86efac' : '#fde047'}`, borderRadius:99, padding:'4px 12px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background: hasRecords ? '#22c55e' : '#eab308', display:'inline-block', flexShrink:0 }} />
                <span style={{ fontSize:12, fontWeight:700, color: hasRecords ? '#16a34a' : '#854d0e' }}>
                    {hasRecords ? `${count} Records Ready` : 'No Confirmed Records'}
                </span>
            </div>
            {hasRecords && (
                <div style={{ background:'#ede9fe', border:'1.5px solid #c4b5fd', borderRadius:99, padding:'4px 14px' }}>
                    {/* FIX 3: currency comes from salary_rules via backend, shown in badge */}
                    <span style={{ fontSize:12, fontWeight:800, color:'#6d28d9' }}>
                        Total: {currency} {Number(total).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function BankExportIndex({ salaryRule, periodTemplates, employees }) {
    const now          = new Date();
    const cycle        = salaryRule?.pay_cycle ?? 'monthly';
    const periodCount  = cycle === 'semi_monthly' ? 2 : cycle === 'ten_day' ? 3 : 1;
    const years        = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

    // FIX 1: For non-monthly, default to first period (no "All Periods" option)
    const defaultPeriodId = periodCount > 1 && periodTemplates.length > 0
        ? String(periodTemplates[0].id)
        : '';

    const [year,      setYear]      = useState(now.getFullYear());
    const [month,     setMonth]     = useState(now.getMonth() + 1);
    const [periodId,  setPeriodId]  = useState(defaultPeriodId);
    const [userId,    setUserId]    = useState('');

    const [preview,   setPreview]   = useState(null);
    const [loading,   setLoading]   = useState(false);
    const [excelLoad, setExcelLoad] = useState(false);
    const [pdfLoad,   setPdfLoad]   = useState(false);
    const [toast,     setToast]     = useState(null);
    const [paying,    setPaying]    = useState(null);
    const [markingAll, setMarkingAll] = useState(false);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const markAllPaid = async () => {
        setMarkingAll(true);
        try {
            const res = await fetch(`/payroll/export/mark-all-paid?${buildParams()}`, {
                method: 'PATCH',
                headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message ?? 'Failed');
            setPreview(prev => prev ? {
                ...prev,
                records: prev.records.map(r => ({ ...r, status: 'paid' })),
            } : prev);
            showToast(`${data.updated ?? ''} records marked as paid`);
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setMarkingAll(false);
        }
    };

    const markAsPaid = async (recordId) => {
        setPaying(recordId);
        try {
            const res = await fetch(`/payroll/export/mark-paid/${recordId}`, {
                method: 'PATCH',
                headers: { 'X-CSRF-TOKEN': csrf(), 'Content-Type': 'application/json' },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message ?? 'Failed to mark as paid');
            setPreview(prev => prev ? {
                ...prev,
                records: prev.records.map(r => r.id === recordId ? { ...r, status: 'paid' } : r),
            } : prev);
            showToast('Marked as paid successfully');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setPaying(null);
        }
    };

    // ── Build query params ──
    const buildParams = useCallback(() => {
        const p = new URLSearchParams();
        if (year)     p.set('year',      year);
        if (month)    p.set('month',     month);
        if (periodId) p.set('period_id', periodId);
        if (userId)   p.set('user_id',   userId);
        return p.toString();
    }, [year, month, periodId, userId]);

    // ── Load preview ──
    const loadPreview = useCallback(async () => {
        setLoading(true);
        setPreview(null);
        try {
            const res  = await fetch(`/payroll/export/preview?${buildParams()}`);
            const data = await res.json();
            setPreview(data);
        } catch {
            showToast('Failed to load preview', 'error');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    useEffect(() => { loadPreview(); }, [loadPreview]);

    // ── Download ──
    const download = async (type, setLoad) => {
        setLoad(true);
        try {
            const res = await fetch(`/payroll/export/${type}?${buildParams()}`, {
                headers: { 'X-CSRF-TOKEN': csrf() },
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.message ?? 'Download failed');
            }
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            const label = preview?.period_label?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'export';
            a.download = `bank_transfer_${label}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
            a.click();
            URL.revokeObjectURL(url);
            showToast(`${type === 'excel' ? 'Excel' : 'PDF'} downloaded successfully!`);
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setLoad(false);
        }
    };

    const sel = {
        padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb',
        fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff',
        cursor: 'pointer', outline: 'none',
    };

    const records = preview?.records ?? [];
    const hasData = records.length > 0;

    // FIX 3: currency comes from backend preview response, fallback to salaryRule
    const displayCurrency = preview?.currency ?? salaryRule?.currency_code ?? 'USD';

    return (
        <AppLayout title="Bank Export">
            <Head title="Bank Export" />
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg) } }
                @keyframes slideIn { from { opacity:0; transform: translateX(12px) } to { opacity:1; transform: translateX(0) } }
                @keyframes fadeUp  { from { opacity:0; transform: translateY(8px)  } to { opacity:1; transform: translateY(0) } }
                .be-row:hover td { background: #faf5ff !important; transition: background 0.1s; }
                .btn-excel:hover { background: linear-gradient(135deg,#047857,#059669) !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,0.35) !important; }
                .btn-pdf:hover   { background: linear-gradient(135deg,#b91c1c,#dc2626) !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(220,38,38,0.35) !important; }
                .filter-select:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
            `}</style>

            <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />

            <div style={{ margin: '0 auto', animation: 'fadeUp 0.3s ease' }}>

                {/* ── Filter Panel ── */}
                <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', padding:'18px 22px', marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>
                        🔍 Filter Records
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:10, flexWrap:'wrap' }}>

                        {/* Year */}
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Year</div>
                            <select value={year} onChange={e => setYear(Number(e.target.value))} style={sel} className="filter-select">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        {/* Month */}
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Month</div>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={sel} className="filter-select">
                                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                            </select>
                        </div>

                        {/* FIX 1: Period — only show for non-monthly, NO "All Periods" option */}
                        {periodCount > 1 && (
                            <div>
                                <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Period</div>
                                <select value={periodId} onChange={e => setPeriodId(e.target.value)} style={sel} className="filter-select">
                                    {periodTemplates.map(p => (
                                        <option key={p.id} value={p.id}>Period {p.period_number}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Divider */}
                        <div style={{ width:1, height:36, background:'#e5e7eb', margin:'0 4px' }} />

                        {/* Employee */}
                        <div>
                            <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Employee</div>
                            <select value={userId} onChange={e => setUserId(e.target.value)} style={{ ...sel, minWidth:200 }} className="filter-select">
                                <option value="">All Employees</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Refresh */}
                        <button onClick={loadPreview} disabled={loading} style={{ padding:'8px 16px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:6 }}>
                            {loading ? <><Spinner size={12} color="#6b7280" /> Loading…</> : '🔄 Refresh'}
                        </button>
                    </div>
                </div>



                {/* ── Preview Table ── */}
                <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>

                    {/* ── Table toolbar: count + period + total + export buttons ── */}
                    <div style={{ padding:'10px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>

                        {/* Left: count pill + "ready for transfer" + period label */}
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                            {loading ? (
                                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                    <Spinner size={12} color="#7c3aed" />
                                    <span style={{ fontSize:12, color:'#9ca3af' }}>Loading…</span>
                                </div>
                            ) : hasData ? (
                                <>
                                    <span style={{ display:'inline-flex', alignItems:'center', background:'#6d28d9', color:'#fff', fontSize:12, fontWeight:700, borderRadius:7, padding:'4px 11px', letterSpacing:'-0.1px' }}>
                                        {records.length} {records.length === 1 ? 'Record' : 'Records'}
                                    </span>
                                    <span style={{ fontSize:11, color:'#9ca3af' }}>ready for transfer</span>
                                   
                                </>
                            ) : (
                                <span style={{ fontSize:12, color:'#9ca3af' }}>No confirmed records found</span>
                            )}
                        </div>

                        {/* Right: total + thin divider + export buttons */}
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>

                            {/* Total amount */}
                            {hasData && !loading && (
                                <>
                                    <div>
                                        <div style={{ fontSize:9, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:1 }}>Total</div>
                                        <div style={{ fontSize:16, fontWeight:800, color:'#059669', letterSpacing:'-0.4px', lineHeight:1 }}>
                                            <span style={{ fontSize:10, fontWeight:600, color:'#6b7280', marginRight:3 }}>{displayCurrency}</span>
                                            {Number(preview?.total ?? 0).toLocaleString('en-US', { minimumFractionDigits:2 })}
                                        </div>
                                    </div>
                                    <div style={{ width:1, height:30, background:'#e5e7eb' }} />
                                </>
                            )}

                            {/* Excel button */}
                            <button
                                className="btn-excel"
                                onClick={() => download('excel', setExcelLoad)}
                                disabled={excelLoad || !hasData}
                                style={{
                                    display:'flex', alignItems:'center', gap:6,
                                    padding:'7px 13px', borderRadius:8, border:'none',
                                    background: hasData ? '#059669' : '#e5e7eb',
                                    color: hasData ? '#fff' : '#9ca3af',
                                    fontSize:12, fontWeight:700,
                                    cursor: hasData && !excelLoad ? 'pointer' : 'not-allowed',
                                    transition:'all 0.15s ease',
                                }}>
                                {excelLoad
                                    ? <Spinner size={12} />
                                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                                }
                                {excelLoad ? 'Exporting…' : 'Excel'}
                            </button>

                            {/* PDF button */}
                            <button
                                className="btn-pdf"
                                onClick={() => download('pdf', setPdfLoad)}
                                disabled={pdfLoad || !hasData}
                                style={{
                                    display:'flex', alignItems:'center', gap:6,
                                    padding:'7px 13px', borderRadius:8, border:'none',
                                    background: hasData ? '#dc2626' : '#e5e7eb',
                                    color: hasData ? '#fff' : '#9ca3af',
                                    fontSize:12, fontWeight:700,
                                    cursor: hasData && !pdfLoad ? 'pointer' : 'not-allowed',
                                    transition:'all 0.15s ease',
                                }}>
                                {pdfLoad
                                    ? <Spinner size={12} />
                                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                                }
                                {pdfLoad ? 'Generating…' : 'PDF'}
                            </button>

                            {/* Mark All Paid */}
                            {hasData && !loading && records.some(r => r.status !== 'paid') && (
                                <>
                                    <div style={{ width:1, height:24, background:'#e5e7eb' }} />
                                    <button
                                        onClick={markAllPaid}
                                        disabled={markingAll}
                                        style={{
                                            display:'flex', alignItems:'center', gap:6,
                                            padding:'7px 13px', borderRadius:8, border:'1px solid #e5e7eb',
                                            background:'#36599fff', color: markingAll ? '#ffffffff' : '#ffffffff',
                                            fontSize:12, fontWeight:700,
                                            cursor: markingAll ? 'not-allowed' : 'pointer',
                                            transition:'all 0.15s ease',
                                            whiteSpace:'nowrap',
                                        }}>
                                        {markingAll
                                            ? <><Spinner size={12} color="#9ca3af" /> Saving…</>
                                            : <>
                                                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
                                                    Pay Done
                                                </>
                                        }
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div style={{ padding:'40px 22px', textAlign:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#9ca3af', fontSize:13, fontWeight:600 }}>
                                <Spinner size={16} color="#7c3aed" />
                                Loading records…
                            </div>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !hasData && (
                        <div style={{ padding:'48px 22px', textAlign:'center' }}>
                            <div style={{ fontSize:36, marginBottom:12 }}>🏦</div>
                            <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:6 }}>No confirmed payroll records</div>
                            <div style={{ fontSize:12, color:'#9ca3af' }}>
                                Payroll records must be <strong>confirmed</strong> before they appear here.
                            </div>
                        </div>
                    )}

                    {/* Data table */}
                    {!loading && hasData && (
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead>
                                    <tr style={{ background:'#f9fafb', borderBottom:'2px solid #e5e7eb' }}>
                                        {/* FIX 2: Branch column removed */}
                                        {[
                                            ['#',                   'center', 40],
                                            ['Account Holder Name', 'left',   null],
                                            ['Bank Name',           'left',   null],
                                            ['Account Number',      'left',   null],
                                            ['Department',          'center', null],
                                            ['Status',              'center', 110],
                                            ['Net Salary',          'right',  150],
                                        ].map(([label, align, width]) => (
                                            <th key={label} style={{
                                                padding:'10px 14px', textAlign: align,
                                                fontSize:10, fontWeight:800, color:'#6b7280',
                                                textTransform:'uppercase', letterSpacing:'0.7px',
                                                ...(width ? { width } : {}),
                                            }}>{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, i) => (
                                        <tr key={i} className="be-row">
                                            <td style={{ padding:'10px 14px', textAlign:'center', fontSize:11, color:'#d1d5db', fontWeight:600 }}>{i + 1}</td>
                                            <td style={{ padding:'10px 14px' }}>
                                                <div style={{ fontWeight:700, fontSize:13, color:'#111827' }}>{r.account_holder_name}</div>
                                                {r.employee_name !== r.account_holder_name && (
                                                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>{r.employee_name}</div>
                                                )}
                                            </td>
                                            <td style={{ padding:'10px 14px', fontSize:12, color:'#374151' }}>
                                                {r.bank_name === '-'
                                                    ? <span style={{ color:'#f59e0b', fontSize:11, fontWeight:600 }}>⚠ Not set</span>
                                                    : r.bank_name}
                                            </td>
                                            <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:'#374151', letterSpacing:'0.5px' }}>
                                                {r.account_number === '-'
                                                    ? <span style={{ color:'#f59e0b', fontSize:11, fontWeight:600 }}>⚠ Not set</span>
                                                    : r.account_number}
                                            </td>
                                            {/* FIX 2: Branch td removed */}
                                            <td style={{ padding:'10px 14px', textAlign:'center', fontSize:11, color:'#6b7280' }}>
                                                {r.department && r.department !== '-'
                                                    ? <span style={{ background:'#f3f4f6', padding:'2px 8px', borderRadius:99, fontWeight:600 }}>{r.department}</span>
                                                    : '—'}
                                            </td>
                                            {/* Status label — read only */}
                                            <td style={{ padding:'10px 14px', textAlign:'center' }}>
                                                {r.status === 'paid' ? (
                                                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#059669', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:99, padding:'3px 9px' }}>
                                                        <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#7c3aed', background:'#ede9fe', border:'1px solid #c4b5fd', borderRadius:99, padding:'3px 9px' }}>
                                                        <span style={{ width:5, height:5, borderRadius:'50%', background:'#a78bfa', flexShrink:0 }} />
                                                        Confirmed
                                                    </span>
                                                )}
                                            </td>
                                            {/* Net Salary */}
                                            <td style={{ padding:'10px 14px', textAlign:'right' }}>
                                                <span style={{ fontSize:10, fontWeight:700, color:'#7c3aed', marginRight:5 }}>{displayCurrency}</span>
                                                <span style={{ fontSize:14, fontWeight:800, color:'#059669' }}>
                                                    {Number(r.net_salary).toLocaleString('en-US', { minimumFractionDigits:2 })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                {/* FIX 4: tfoot (duplicate total row) removed — total is shown in StatusBadge above */}

                            </table>
                        </div>
                    )}
                </div>

                {/* ── Info note ── */}
                <div style={{ marginTop:14, padding:'10px 16px', background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:14 }}>💡</span>
                    <span style={{ fontSize:11, color:'#92400e', fontWeight:500 }}>
                        Only <strong>confirmed</strong> payroll records are included. Bank account details come from Employee Salary profiles.
                        Employees with missing bank info are marked with ⚠.
                    </span>
                </div>

            </div>
        </AppLayout>
    );
}