import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const csrf         = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';
const fmt          = (v, code='') => `${code ? code+' ' : ''}${Number(v??0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`.trim();

function Spinner({ color='#7c3aed', size=14 }) {
    return <div style={{ width:size, height:size, border:`2px solid ${color}33`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }} />;
}

function Toast({ msg, type, onClose }) {
    useEffect(() => { if (msg) { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); } }, [msg]);
    if (!msg) return null;
    const e = type === 'error';
    return (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:e?'#fef2f2':'#f0fdf4', border:`1px solid ${e?'#fca5a5':'#86efac'}`, borderRadius:12, padding:'12px 16px', color:e?'#991b1b':'#166534', fontSize:13, fontWeight:600, maxWidth:380, boxShadow:'0 8px 30px rgba(0,0,0,.12)', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:16 }}>{e?'❌':'✅'}</span>
            <span style={{ flex:1 }}>{msg}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'inherit', opacity:0.6 }}>×</button>
        </div>
    );
}

function DownloadBtn({ recordId, type, name, year, month, periodLabel, onToast }) {
    const [loading, setLoading] = useState(false);

    const download = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/payroll/payslip/${recordId}/${type}`, {
                headers: { 'X-CSRF-TOKEN': csrf() }
            });
            if (!res.ok) {
                const data = await res.json().catch(()=>({}));
                throw new Error(data.message ?? 'Download failed');
            }
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            // Use date range in filename
            const safeName = (name||'employee').replace(/\s+/g,'_').toLowerCase();
            const safeDate = (periodLabel||`${year}_${month}`).replace(/\s+–\s+/g,'_to_').replace(/\s+/g,'_');
            a.download = `payslip_${safeName}_${safeDate}.${type==='pdf'?'pdf':'xlsx'}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch(e) {
            onToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const isPdf = type === 'pdf';
    return (
        <button
            onClick={download}
            disabled={loading}
            style={{
                padding:'5px 14px',
                borderRadius:6,
                border: isPdf ? 'none' : '1.5px solid #059669',
                background: loading ? (isPdf?'#ddd6fe':'#d1fae5') : (isPdf?'#7c3aed':'#fff'),
                color: isPdf ? '#fff' : '#059669',
                fontSize:11,
                fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'inline-flex',
                alignItems:'center',
                gap:4,
                whiteSpace:'nowrap',
            }}
        >
            {loading ? <Spinner color={isPdf?'#fff':'#059669'} size={11}/> : <span>{isPdf?'📄':'📊'}</span>}
            {loading ? '...' : (isPdf?'PDF':'Excel')}
        </button>
    );
}

// Group records by user_id for rowspan
function groupByEmployee(records) {
    const map = new Map();
    records.forEach(r => {
        if (!map.has(r.user_id)) map.set(r.user_id, []);
        map.get(r.user_id).push(r);
    });
    const rows = [];
    let idx = 1;
    map.forEach((recs) => {
        recs.forEach((r, i) => {
            rows.push({ ...r, isFirst: i===0, rowspan: i===0 ? recs.length : 0, groupIdx: idx, isLast: i===recs.length-1 });
        });
        idx++;
    });
    return rows;
}

export default function PayslipIndex({ salaryRule, periodTemplates, employees, isHR }) {
    const now   = new Date();
    const cycle = salaryRule?.pay_cycle ?? 'monthly';
    const count = cycle==='semi_monthly'?2:cycle==='ten_day'?3:1;
    const years = Array.from({length:3},(_,i)=>now.getFullYear()-1+i);

    const [filterYear,   setFilterYear]   = useState(now.getFullYear());
    const [filterMonth,  setFilterMonth]  = useState(now.getMonth()+1);
    const [filterPeriod, setFilterPeriod] = useState('');
    const [search,       setSearch]       = useState('');

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast,   setToast]   = useState(null);

    const [bulkPdfLoading,   setBulkPdfLoading]   = useState(false);
    const [bulkExcelLoading, setBulkExcelLoading] = useState(false);

    const showToast = (msg, type='success') => setToast({ msg, type });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterYear)   params.set('year',      filterYear);
            if (filterMonth)  params.set('month',     filterMonth);
            if (filterPeriod) params.set('period_id', filterPeriod);
            const res  = await fetch(`/payroll/payslip/records?${params}`);
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load payslips', 'error');
        } finally {
            setLoading(false);
        }
    }, [filterYear, filterMonth, filterPeriod]);

    useEffect(() => { load(); }, [load]);

    const filtered = isHR && search.trim()
        ? records.filter(r =>
            r.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.department?.toLowerCase().includes(search.toLowerCase()) ||
            r.position?.toLowerCase().includes(search.toLowerCase())
          )
        : records;

    const grouped  = isHR
        ? groupByEmployee(filtered)
        : filtered.map((r,i) => ({...r, isFirst:true, rowspan:1, groupIdx:i+1, isLast:true}));

    const currency = filtered[0]?.currency ?? '';
    const totalNet = filtered.reduce((s,r) => s + (r.net_salary ?? 0), 0);

    // Build period dropdown label: "Period 1 (25 Feb – 10 Mar)" style
    // We get date labels from loaded records when available
    const periodDateLabels = {};
    records.forEach(r => {
        if (r.period_id && r.period_start && r.period_end) {
            periodDateLabels[r.period_id] = `${r.period_start} – ${r.period_end}`;
        }
    });

    const getPeriodLabel = (p) => {
        const label = periodDateLabels[p.id];
        return label ? label : `Period ${p.period_number}`;
    };

    const bulkDownload = async (type, setLoad, ext) => {
        setLoad(true);
        try {
            const params = new URLSearchParams();
            if (filterYear)   params.set('year',      filterYear);
            if (filterMonth)  params.set('month',     filterMonth);
            if (filterPeriod) params.set('period_id', filterPeriod);
            const res = await fetch(`/payroll/payslip/bulk/${type}?${params}`, {
                headers: { 'X-CSRF-TOKEN': csrf() }
            });
            if (!res.ok) {
                const data = await res.json().catch(()=>({}));
                throw new Error(data.message ?? 'Download failed');
            }
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `payslips_${filterYear}_${filterMonth?MONTHS_SHORT[filterMonth-1]:'all'}${ext}`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Download complete!', 'success');
        } catch(e) {
            showToast(e.message, 'error');
        } finally {
            setLoad(false);
        }
    };

    const S = { padding:'7px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:13, fontWeight:600, color:'#374151', background:'#fff', cursor:'pointer', outline:'none' };

    return (
        <AppLayout title="Payslip">
            <Head title="Payslip" />
            <style>{`
                @keyframes spin   { to { transform: rotate(360deg) } }
                @keyframes fadeIn { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
                .ps-row:hover td { background: #faf5ff !important; }
                .ps-row td { transition: background 0.1s; }
            `}</style>
            <Toast msg={toast?.msg} type={toast?.type} onClose={()=>setToast(null)} />

            <div className="min-h-screen bg-gray-50/60 pb-8">
                <div className="mx-auto">

                    {/* ── Period Filter Bar ── */}
                    <div style={{ background:'#fff', borderRadius:14, padding:'14px 20px', border:'1px solid #e5e7eb', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,.04)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px', flexShrink:0 }}>Pay Period</span>

                        <select value={filterYear} onChange={e=>setFilterYear(Number(e.target.value))} style={S}>
                            {years.map(y=><option key={y} value={y}>{y}</option>)}
                        </select>

                        <select value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))} style={S}>
                            <option value="">All Months</option>
                            {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                        </select>

                        {/* Period dropdown — show date range label if available */}
                        {count > 1 && (
                            <select value={filterPeriod} onChange={e=>setFilterPeriod(e.target.value)} style={S}>
                                <option value="">All Periods</option>
                                {periodTemplates.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {periodDateLabels[p.id]
                                            ? periodDateLabels[p.id]
                                            : `Period ${p.period_number}`
                                        }
                                    </option>
                                ))}
                            </select>
                        )}

                        <span style={{ fontSize:12, color:'#7c3aed', background:'#ede9fe', padding:'5px 12px', borderRadius:99, fontWeight:700 }}>
                            {cycle==='semi_monthly'?'SEMI-MONTHLY':cycle==='ten_day'?'10-DAY':'MONTHLY'}
                        </span>

                        <button onClick={load} disabled={loading} style={{ marginLeft:'auto', padding:'7px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
                            {loading ? <><Spinner size={12} color="#6b7280"/>Loading...</> : '🔄 Refresh'}
                        </button>
                    </div>

                    {/* ── Main Card ── */}
                    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,.04)', overflow:'hidden' }}>

                        {/* ── Toolbar ── */}
                        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                            {/* Left */}
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <span style={{ fontSize:13, fontWeight:800, color:'#111827' }}>
                                    {loading ? 'Loading...' : `${filtered.length} Payslip${filtered.length!==1?'s':''}`}
                                </span>
                                {!loading && filtered.length > 0 && (
                                    <>
                                       
                                        <span style={{ fontSize:12, fontWeight:700, color:'#7c3aed', background:'#ede9fe', padding:'3px 10px', borderRadius:99 }}>
                                            Total: {fmt(totalNet, currency)}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Right: search + bulk */}
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                                {isHR && (
                                    <div style={{ position:'relative' }}>
                                        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#9ca3af' }}>🔍</span>
                                        <input
                                            type="text"
                                            placeholder="Search employee..."
                                            value={search}
                                            onChange={e=>setSearch(e.target.value)}
                                            style={{ padding:'7px 30px 7px 30px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:12, color:'#374151', outline:'none', background:'#fff', width:210 }}
                                        />
                                        {search && (
                                            <button onClick={()=>setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14 }}>×</button>
                                        )}
                                    </div>
                                )}
                                {isHR && records.length > 0 && (
                                    <>
                                        <button
                                            onClick={()=>bulkDownload('pdf', setBulkPdfLoading, '.zip')}
                                            disabled={bulkPdfLoading}
                                            style={{ padding:'7px 14px', borderRadius:8, border:'none', background:bulkPdfLoading?'#ddd6fe':'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, cursor:bulkPdfLoading?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:6 }}
                                        >
                                            {bulkPdfLoading?<><Spinner color="#fff" size={12}/>Preparing...</>:'📦 All PDFs (ZIP)'}
                                        </button>
                                        <button
                                            onClick={()=>bulkDownload('excel', setBulkExcelLoading, '.xlsx')}
                                            disabled={bulkExcelLoading}
                                            style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #059669', background:bulkExcelLoading?'#d1fae5':'#fff', color:'#059669', fontSize:12, fontWeight:700, cursor:bulkExcelLoading?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:6 }}
                                        >
                                            {bulkExcelLoading?<><Spinner color="#059669" size={12}/>Preparing...</>:'📊 All Excel'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── Table ── */}
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead>
                                    <tr style={{ background:'#f9fafb', borderBottom:'2px solid #e5e7eb' }}>
                                        {isHR && <th style={{...TH, width:44, textAlign:'center'}}>#</th>}
                                        {isHR && <th style={TH}>Employee</th>}
                                        <th style={TH}>Pay Period</th>
                                        <th style={{...TH, textAlign:'right'}}>Net Salary</th>
                                        <th style={{...TH, textAlign:'center', width:160}}>Download</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={isHR?5:3} style={{ textAlign:'center', padding:56 }}>
                                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:'#7c3aed' }}>
                                                    <Spinner size={28}/><span style={{ fontSize:13, fontWeight:600 }}>Loading payslips...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : grouped.length === 0 ? (
                                        <tr>
                                            <td colSpan={isHR?5:3} style={{ textAlign:'center', padding:56, color:'#9ca3af', fontSize:13 }}>
                                                {search ? `No results for "${search}"` : 'No confirmed payslips for the selected period.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        grouped.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="ps-row"
                                                style={{
                                                    borderBottom: r.isLast ? '1px solid #e5e7eb' : '1px dashed #f3f4f6',
                                                    animation:'fadeIn 0.15s ease',
                                                }}
                                            >
                                                {/* # rowspan */}
                                                {isHR && r.isFirst && (
                                                    <td rowSpan={r.rowspan} style={{ ...TD, textAlign:'center', width:44, color:'#9ca3af', fontWeight:700, fontSize:11, borderRight:'1px solid #f3f4f6', background:'#fafafa', verticalAlign:'middle' }}>
                                                        {r.groupIdx}
                                                    </td>
                                                )}

                                                {/* Employee rowspan */}
                                                {isHR && r.isFirst && (
                                                    <td rowSpan={r.rowspan} style={{ ...TD, verticalAlign:'middle', borderRight:'1px solid #f3f4f6', background: r.rowspan>1?'#fdfcff':'#fff', minWidth:160 }}>
                                                        <div style={{ fontWeight:800, fontSize:13, color:'#111827' }}>{r.name}</div>
                                                        <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>
                                                            {r.position}{r.position&&r.department?' · ':''}{r.department}
                                                        </div>
                                                       
                                                    </td>
                                                )}

                                                {/* Pay Period — date range */}
                                                <td style={{ ...TD, paddingLeft: isHR ? 20 : TD.padding }}>
                                                    <div style={{ fontSize:12, fontWeight:700, color:'#374151' }}>
                                                        {r.period_start} – {r.period_end}
                                                    </div>
                                                    <div style={{ marginTop:3, display:'inline-flex', alignItems:'center', gap:4 }}>
                                                        <span style={{ fontSize:10, fontWeight:700, background:'#ede9fe', color:'#7c3aed', borderRadius:99, padding:'2px 8px' }}>Confirmed</span>
                                                    </div>
                                                </td>

                                                {/* Net Salary */}
                                                <td style={{ ...TD, textAlign:'right' }}>
                                                    <span style={{ fontSize:14, fontWeight:900, color: r.net_salary > 0 ? '#7c3aed' : '#9ca3af' }}>
                                                        {fmt(r.net_salary, r.currency)}
                                                    </span>
                                                </td>

                                                {/* Download */}
                                                <td style={{ ...TD, textAlign:'center', width:160 }}>
                                                    <div style={{ display:'inline-flex', gap:6 }}>
                                                        <DownloadBtn recordId={r.id} type="pdf"   name={r.name} year={r.year} month={r.month} periodLabel={r.period_label} onToast={showToast} />
                                                        <DownloadBtn recordId={r.id} type="excel" name={r.name} year={r.year} month={r.month} periodLabel={r.period_label} onToast={showToast} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}

const TH = {
    padding: '11px 16px',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
};

const TD = {
    padding: '12px 16px',
    verticalAlign: 'middle',
    fontSize: 12,
};