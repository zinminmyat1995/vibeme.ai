// resources/js/Pages/Performance/Index.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

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
        return () => { window.removeEventListener('vibeme-theme-change', sync); window.removeEventListener('storage', sync); };
    }, []);
    return dark;
}

function getTheme(dark) {
    if (dark) return {
        bg: '#080f1e', surface: 'rgba(13,22,42,0.95)', surfaceSoft: 'rgba(255,255,255,0.04)',
        surfaceHover: 'rgba(255,255,255,0.06)', border: 'rgba(148,163,184,0.10)',
        borderStrong: 'rgba(148,163,184,0.20)', text: '#f1f5f9', textSoft: '#94a3b8',
        textMute: '#475569', primary: '#7c3aed', primarySoft: 'rgba(124,58,237,0.16)',
        success: '#10b981', successSoft: 'rgba(16,185,129,0.14)',
        warning: '#f59e0b', warningSoft: 'rgba(245,158,11,0.14)',
        danger: '#f87171', dangerSoft: 'rgba(248,113,113,0.14)',
        shadow: '0 24px 60px rgba(0,0,0,0.45)', shadowSm: '0 4px 16px rgba(0,0,0,0.28)',
        tableHead: 'rgba(255,255,255,0.03)',
        triggerBg: 'linear-gradient(180deg,rgba(12,22,44,0.96) 0%,rgba(8,17,36,0.96) 100%)',
        menuBg: 'linear-gradient(180deg,rgba(5,17,38,0.99) 0%,rgba(3,12,28,0.99) 100%)',
        panelSolid: '#0b1324',
        ratingExcellent: { bg:'rgba(16,185,129,0.14)', text:'#34d399', border:'rgba(16,185,129,0.25)' },
        ratingGood:      { bg:'rgba(59,130,246,0.14)', text:'#60a5fa', border:'rgba(59,130,246,0.25)' },
        ratingAverage:   { bg:'rgba(245,158,11,0.14)', text:'#fbbf24', border:'rgba(245,158,11,0.25)' },
        ratingNeeds:     { bg:'rgba(249,115,22,0.14)', text:'#fb923c', border:'rgba(249,115,22,0.25)' },
        ratingPoor:      { bg:'rgba(239,68,68,0.14)',  text:'#f87171', border:'rgba(239,68,68,0.25)'  },
    };
    return {
        bg: '#f0f4fa', surface: '#ffffff', surfaceSoft: '#f8fafc',
        surfaceHover: '#f1f5f9', border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.16)', text: '#0f172a', textSoft: '#475569',
        textMute: '#94a3b8', primary: '#7c3aed', primarySoft: 'rgba(124,58,237,0.09)',
        success: '#059669', successSoft: 'rgba(5,150,105,0.08)',
        warning: '#d97706', warningSoft: 'rgba(217,119,6,0.08)',
        danger: '#dc2626', dangerSoft: 'rgba(220,38,38,0.08)',
        shadow: '0 1px 4px rgba(0,0,0,0.05)', shadowSm: '0 4px 14px rgba(15,23,42,0.08)',
        tableHead: '#f8fafc',
        triggerBg: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
        menuBg: '#ffffff',
        panelSolid: '#ffffff',
        ratingExcellent: { bg:'#d1fae5', text:'#065f46', border:'#6ee7b7' },
        ratingGood:      { bg:'#dbeafe', text:'#1e3a8a', border:'#93c5fd' },
        ratingAverage:   { bg:'#fef3c7', text:'#78350f', border:'#fcd34d' },
        ratingNeeds:     { bg:'#ffedd5', text:'#7c2d12', border:'#fdba74' },
        ratingPoor:      { bg:'#fee2e2', text:'#7f1d1d', border:'#fca5a5' },
    };
}

// ── PremiumDropdown ────────────────────────────────────────────
function PremiumDropdown({ options, value, onChange, placeholder='Select...', theme, dark, minWidth=140, zIndex=200 }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = options.find(o => String(o.value) === String(value));
    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div ref={ref} style={{ position:'relative', minWidth, zIndex }}>
            <button type="button" onClick={() => setOpen(v => !v)} style={{
                width:'100%', height:40, padding:'0 14px', borderRadius:12,
                border:`1px solid ${open ? theme.borderStrong : theme.border}`,
                background: theme.triggerBg, color: selected ? theme.text : theme.textMute,
                fontSize:13, fontWeight:500, cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'space-between', gap:8,
                fontFamily:'inherit', transition:'all .15s', boxShadow: open ? theme.shadowSm : 'none',
            }}>
                <span>{selected ? selected.label : placeholder}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s', color: theme.textMute, flexShrink:0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            {open && (
                <div style={{
                    position:'absolute', top:'calc(100% + 5px)', left:0, right:0, minWidth,
                    background: theme.menuBg, border:`1px solid ${theme.borderStrong}`,
                    borderRadius:12, boxShadow: theme.shadow, overflow:'hidden',
                    zIndex: zIndex+1, maxHeight:240, overflowY:'auto',
                }}>
                    {options.map((opt, i) => {
                        const isSel = String(opt.value) === String(value);
                        return (
                            <button key={opt.value} type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    width:'100%', padding:'10px 14px', border:'none',
                                    borderBottom: i < options.length-1 ? `1px solid ${theme.border}` : 'none',
                                    background: isSel ? theme.primarySoft : 'transparent',
                                    color: isSel ? theme.primary : theme.text,
                                    fontSize:13, fontWeight: isSel ? 600 : 400,
                                    cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                                    display:'flex', alignItems:'center', justifyContent:'space-between',
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = theme.surfaceHover; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {opt.label}
                                {isSel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Metric toggle pills ────────────────────────────────────────
const METRICS = [
    { key:'late',   label:'Late',     icon:'⏰', color:'#f87171', soft:'rgba(248,113,113,0.12)' },
    { key:'absent', label:'Absent',   icon:'📅', color:'#fb923c', soft:'rgba(251,146,60,0.12)'  },
    { key:'leave',  label:'Leave',    icon:'🏖️', color:'#fbbf24', soft:'rgba(251,191,36,0.12)'  },
    { key:'ot',     label:'Overtime', icon:'⚡', color:'#34d399', soft:'rgba(52,211,153,0.12)'  },
];

function MetricPills({ selected, onChange, theme }) {
    return (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:800, color:theme.textMute, textTransform:'uppercase', letterSpacing:'.08em', marginRight:4 }}>Metrics</span>
            {METRICS.map(m => {
                const active = selected.includes(m.key);
                return (
                    <button key={m.key} type="button"
                        onClick={() => onChange(active ? selected.filter(k => k !== m.key) : [...selected, m.key])}
                        style={{
                            display:'flex', alignItems:'center', gap:5,
                            padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:600,
                            cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                            border:`1.5px solid ${active ? m.color : theme.border}`,
                            background: active ? m.soft : 'transparent',
                            color: active ? m.color : theme.textSoft,
                        }}>
                        <span style={{ fontSize:11 }}>{m.icon}</span>
                        {m.label}
                    </button>
                );
            })}
        </div>
    );
}

// ── Rating badge ───────────────────────────────────────────────
function RatingBadge({ rating, theme }) {
    const map = {
        'Excellent': theme.ratingExcellent,
        'Good': theme.ratingGood,
        'Average': theme.ratingAverage,
        'Needs Improvement': theme.ratingNeeds,
        'Poor': theme.ratingPoor,
    };
    const cfg = map[rating] || theme.ratingAverage;
    return (
        <span style={{
            display:'inline-block', padding:'3px 10px', borderRadius:99,
            fontSize:11, fontWeight:700,
            background: cfg.bg, color: cfg.text, border:`1px solid ${cfg.border}`,
        }}>{rating || '—'}</span>
    );
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, avatarUrl, size=32 }) {
    const [imgError, setImgError] = useState(false);
    const initials = (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const colors = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2'];
    const color  = colors[(name||'').charCodeAt(0) % colors.length];

    // ── /storage/ prefix ထည့် (UserRoles.jsx pattern အတိုင်း) ──
    const src = avatarUrl
        ? (avatarUrl.startsWith('http') ? avatarUrl : `/storage/${avatarUrl}`)
        : null;

    const showInitials = !src || imgError;

    return showInitials ? (
        <div style={{
            width:size, height:size, borderRadius:'50%',
            background:color+'22', border:`1.5px solid ${color}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:size*0.34, fontWeight:700, color, flexShrink:0,
        }}>{initials}</div>
    ) : (
        <img
            src={src}
            alt={name}
            style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}
            onError={() => setImgError(true)}
        />
    );
}

// ── Horizontal bar ─────────────────────────────────────────────
function HBar({ value, max, color, theme }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:100 }}>
            <div style={{ flex:1, height:5, borderRadius:99, background:theme.border, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', borderRadius:99, background:color, transition:'width .4s ease' }}/>
            </div>
            <span style={{ fontSize:11, color:theme.textMute, minWidth:24, textAlign:'right', fontWeight:500 }}>{value}</span>
        </div>
    );
}

// ── PDF export ─────────────────────────────────────────────────
function ratingStyle(r) {
    const m = { 'Excellent':'#065f46:#d1fae5', 'Good':'#1e3a8a:#dbeafe', 'Average':'#78350f:#fef3c7', 'Needs Improvement':'#7c2d12:#ffedd5', 'Poor':'#7f1d1d:#fee2e2' };
    const [text,bg] = (m[r]||'#475569:#f1f5f9').split(':');
    return { text, bg };
}

const COMPANY_MAP = {
    cambodia: 'Brycen Cambodia',
    myanmar:  'Brycen Myanmar',
    japan:    'Brycen Japan',
    vietnam:  'Brycen Vietnam',
    korea:    'Brycen Korea',
};
 
function getCompanyName(countryName) {
    const key = (countryName || '').toLowerCase().trim();
    return COMPANY_MAP[key] || `Brycen ${countryName || 'International'}`;
}


function getRatingCfg(rating) {
    const map = {
        'Excellent':         { bg:'#d1fae5', text:'#065f46', border:'#6ee7b7' },
        'Good':              { bg:'#dbeafe', text:'#1e3a8a', border:'#93c5fd' },
        'Average':           { bg:'#fef3c7', text:'#78350f', border:'#fcd34d' },
        'Needs Improvement': { bg:'#ffedd5', text:'#7c2d12', border:'#fdba74' },
        'Poor':              { bg:'#fee2e2', text:'#7f1d1d', border:'#fca5a5' },
    };
    return map[rating] || { bg:'#f1f5f9', text:'#475569', border:'#cbd5e1' };
}



function exportPDF(results, year, countryName) {
    const company = getCompanyName(countryName);
    const date    = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    const total   = results.length;
 
    const ratingDist = { Excellent:0, Good:0, Average:0, 'Needs Improvement':0, Poor:0 };
    results.forEach(r => { if (ratingDist[r.rating] !== undefined) ratingDist[r.rating]++; });
 
    
      // Table rows — rating badge (not score number)
    const rows = results.map((r, i) => {
        const cfg   = getRatingCfg(r.rating);
        const rowBg = i % 2 === 0 ? '#ffffff' : '#fafafa';
        return `
        <tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:${rowBg}">
            <td style="padding:10px 14px;color:#94a3b8;font-weight:600;font-size:12px;border-bottom:1px solid #f1f5f9;width:36px">${i+1}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
                <div style="font-weight:700;font-size:13px;color:#0f172a">${r.name}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:1px">${r.department||'—'}</div>
            </td>
            <td style="-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:10px 14px;text-align:center;border-bottom:1px solid #f1f5f9">
                <span style="font-size:12px;font-weight:700;color:${
                    (r.attendance_rate||0) >= 80 ? '#10b981' :
                    (r.attendance_rate||0) >= 50 ? '#f59e0b' : '#ef4444'
                }">${r.present_days||0}/${r.working_days||0} (${r.attendance_rate||0}%)</span>
            </td>
            <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #f1f5f9;color:#ef4444;font-weight:700;font-size:13px">${r.late_days??0}</td>
            <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #f1f5f9;color:#f97316;font-weight:700;font-size:13px">${r.absent_days??0}</td>
            <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #f1f5f9;color:#eab308;font-weight:700;font-size:13px">${r.leave_days??0}</td>
            <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #f1f5f9;color:#10b981;font-weight:700;font-size:13px">${r.ot_hours??0}</td>
            <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #f1f5f9">
                <span style="-webkit-print-color-adjust:exact;print-color-adjust:exact;display:inline-block;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;background:${cfg.bg};color:${cfg.text};border:1px solid ${cfg.border}">
                    ${r.rating||'—'}
                </span>
            </td>
            <td style="padding:10px 14px;font-size:11.5px;color:#475569;line-height:1.5;border-bottom:1px solid #f1f5f9;width:220px;max-width:220px;word-wrap:break-word">${r.remark||'—'}</td>
        </tr>`;
    }).join('');
 
    // Summary distribution cards
    const summaryCards = Object.entries(ratingDist).map(([label, count]) => {
        const cfg = getRatingCfg(label);
        const pct = total > 0 ? Math.round((count/total)*100) : 0;
        return `
        <div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:${cfg.bg};border:1px solid ${cfg.border};border-radius:8px;padding:10px 14px;text-align:center;min-width:88px">
            <div style="font-size:20px;font-weight:800;color:${cfg.text};line-height:1">${count}</div>
            <div style="font-size:10px;font-weight:700;color:${cfg.text};margin-top:3px">${label}</div>
            <div style="font-size:10px;color:${cfg.text};opacity:0.6;margin-top:1px">${pct}%</div>
        </div>`;
    }).join('');
 
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Performance Review ${year} — ${company}</title>
<style>
  * {
    margin:0; padding:0; box-sizing:border-box;
    -webkit-print-color-adjust:exact !important;
    print-color-adjust:exact !important;
    color-adjust:exact !important;
  }
  @page { margin: 8mm; size: A4 landscape; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#f8fafc; color:#0f172a; }
  @media print {
    body { background:#fff; }
    .no-print { display:none !important; }
    .page { box-shadow:none !important; margin:0 !important; border-radius:0 !important; }
  }
</style>
</head>
<body>
 
<div class="page" style="max-width:900px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12)">
 
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#3b0764 0%,#5b21b6 45%,#7c3aed 100%);padding:26px 40px;position:relative;overflow:hidden">
    <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:rgba(255,255,255,0.04);border-radius:50%"></div>
    <div style="position:absolute;bottom:-60px;left:-20px;width:180px;height:180px;background:rgba(255,255,255,0.03);border-radius:50%"></div>
    <div style="position:relative">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.9);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:4px 14px;border-radius:99px;margin-bottom:16px">
        HR Performance Report
      </div>
      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:4px">${company}</div>
      <div style="font-size:15px;color:rgba(255,255,255,0.75);">Annual Performance Review — ${year}</div>
    </div>
  </div>
 
  <!-- Summary cards -->
  <div style="padding:24px 40px;border-bottom:1px solid #f1f5f9">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Rating Distribution</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${summaryCards}</div>
  </div>
 
  <!-- Table -->
  <div style="padding:0 0 32px">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">#</th>
          <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">Employee</th>
          <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">Attendance</th>
          <th style="padding:12px 14px;text-align:center;font-size:10px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">Late Days</th>
          <th style="padding:12px 14px;text-align:center;font-size:10px;font-weight:700;color:#fb923c;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">Absent</th>
          <th style="padding:12px 14px;text-align:center;font-size:10px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">Leave</th>
          <th style="padding:12px 14px;text-align:center;font-size:10px;font-weight:700;color:#34d399;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">OT Hrs</th>
          <th style="padding:12px 14px;text-align:center;font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0">Score</th>
          <th style="padding:9px 14px;text-align:left;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #e2e8f0;width:220px;max-width:220px">AI Remark</th>        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
 
  <!-- Footer -->
  <div style="padding:16px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#94a3b8">${company} · Confidential HR Document</div>
    <div style="font-size:11px;color:#94a3b8">Generated by VibeMe.AI · ${date}</div>
  </div>
 
</div>
 
<div class="no-print" style="text-align:center;padding:20px">
  <button onclick="window.print()" style="padding:12px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
    🖨️ Print / Save as PDF
  </button>
</div>
 
</body>
</html>`;
 
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.focus(), 200);
}


// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
export default function PerformanceIndex({
    metrics: initialMetrics,
    countries = [],
    selectedCountry,
    selectedYear,
    selectedFilters: initFilters,
    userRole,
    availableYears = [],
    countryName: initCountryName = '', 
}) {
    const dark  = useReactiveTheme();
    const theme = getTheme(dark);

    const [metrics,  setMetrics]  = useState(initialMetrics);
    const [year,     setYear]     = useState(selectedYear);
    const [country,  setCountry]  = useState(selectedCountry);
    const [filters,  setFilters]  = useState(Array.isArray(initFilters) && initFilters.length ? initFilters : ['late','absent','leave']);
    const [fetching, setFetching] = useState(false);

    // SSE analysis state
    const [analyzing,  setAnalyzing]  = useState(false);
    const [progress,   setProgress]   = useState(null);
    const [results,    setResults]    = useState([]);
    const [sseError,   setSseError]   = useState('');
    const [showResult, setShowResult] = useState(false);
    const esRef = useRef(null);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    const fetchMetrics = useCallback(async (y, c, f) => {
        const safeF = Array.isArray(f) && f.length ? f : ['late','absent','leave'];
        setFetching(true);
        try {
            const params = new URLSearchParams({ year:y, country_id:c, filters:safeF.join(',') });
            const res = await fetch(`/performance/metrics?${params}`, {
                headers:{ 'X-Requested-With':'XMLHttpRequest', 'X-CSRF-TOKEN':csrf() },
            });
            setMetrics(await res.json());
        } catch(e) { console.error(e); }
        finally { setFetching(false); }
    }, []);

    const handleYear    = v => { setYear(v);    setShowResult(false); setResults([]); fetchMetrics(v, country, filters); };
    const handleCountry = v => { setCountry(v); setShowResult(false); setResults([]); fetchMetrics(year, v, filters); };
    const handleFilters = v => {
        const safe = v.length ? v : ['late','absent','leave'];
        setFilters(safe); setShowResult(false); setResults([]);
        fetchMetrics(year, country, safe);
    };

    const startAnalysis = useCallback(() => {
        if (esRef.current) esRef.current.close();
        setAnalyzing(true); setResults([]); setProgress(null); setSseError(''); setShowResult(true);
        const params = new URLSearchParams({ year, country_id:country });
        const es = new EventSource(`/performance/analyze?${params}`);
        esRef.current = es;
        es.addEventListener('start',    e => { const d=JSON.parse(e.data); setProgress({current:0,total:d.total,name:''}); });
        es.addEventListener('progress', e => { const d=JSON.parse(e.data); setProgress({current:d.current,total:d.total,name:d.name}); });
        es.addEventListener('result',   e => { const d=JSON.parse(e.data); setResults(prev => [...prev,d]); });
        es.addEventListener('complete', e => { const d=JSON.parse(e.data); setResults(d.results); setAnalyzing(false); setProgress(null); es.close(); });
        es.addEventListener('error',    e => { try{setSseError(JSON.parse(e.data).message);}catch{setSseError('Connection error.');} setAnalyzing(false); es.close(); });
        es.onerror = () => { setAnalyzing(false); setSseError('Connection lost.'); es.close(); };
    }, [year, country]);

    useEffect(() => () => esRef.current?.close(), []);

    const employees    = metrics?.employees || [];
    const averages     = metrics?.averages  || {};
    const displayRows  = showResult && results.length > 0 ? results : employees;
    const maxLate      = Math.max(...employees.map(e => e.late_days   || 0), 1);
    const maxAbsent    = Math.max(...employees.map(e => e.absent_days || 0), 1);
    const maxLeave     = Math.max(...employees.map(e => e.leave_days  || 0), 1);
    const maxOT        = Math.max(...employees.map(e => e.ot_hours    || 0), 1);
    const progressPct  = progress ? Math.round((progress.current / progress.total) * 100) : 0;
    const countryName = initCountryName
        || countries.find(c => c.id === country)?.name
        || 'Country';
    const yearOpts     = availableYears.map(y => ({ value:y, label:String(y) }));
    const countryOpts  = countries.map(c => ({ value:c.id, label:c.name }));

    const kpis = [
        { label:'Total Employees', value:averages.total_employees||0, icon:'👥', color:theme.primary,  soft:theme.primarySoft  },
        { label:'Avg Late Days',   value:averages.avg_late_days||0,   icon:'⏰', color:'#f87171',      soft:'rgba(248,113,113,0.12)' },
        { label:'Avg Absent Days', value:averages.avg_absent_days||0, icon:'📅', color:'#fb923c',      soft:'rgba(251,146,60,0.12)'  },
        { label:'Avg Leave Days',  value:averages.avg_leave_days||0,  icon:'🏖️', color:'#fbbf24',      soft:'rgba(251,191,36,0.12)'  },
        { label:'Avg OT Hours',    value:averages.avg_ot_hours||0,    icon:'⚡', color:theme.success,  soft:theme.successSoft  },
    ];

    return (
        <AppLayout title="Performance Review">
            <Head title="Performance Review"/>
            <style>{`
                @keyframes pf-spin { to{transform:rotate(360deg)} }
                @keyframes pf-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                .pf-row:hover td { background:${dark?'rgba(124,58,237,0.05)':'#faf5ff'} !important; }
                .pf-row td { transition:background .12s; }
                .pf-pill-in { animation:pf-fade .2s ease both; }
                .pf-table-wrap::-webkit-scrollbar { display:none; }
            `}</style>

            <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'pf-fade .25s ease' }}>

                {/* ── KPI Strip ────────────────────────────────── */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                    {kpis.map(k => (
                        <div key={k.label} style={{
                            background: theme.surface, border:`1px solid ${theme.border}`,
                            borderRadius:14, padding:'16px 18px', position:'relative', overflow:'hidden',
                            boxShadow: theme.shadow,
                        }}>
                            <div style={{ position:'absolute', inset:0, background:k.soft, pointerEvents:'none' }}/>
                            <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                                background:`linear-gradient(90deg,${k.color},${k.color}66)` }}/>
                            <div style={{ position:'relative' }}>
                                <div style={{ fontSize:20, marginBottom:8 }}>{k.icon}</div>
                                <div style={{ fontSize:24, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
                                <div style={{ fontSize:11, color:theme.textMute, marginTop:4, fontWeight:500 }}>{k.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filter Bar ───────────────────────────────── */}
        
                <div style={{
                    background: dark
                        ? 'linear-gradient(135deg,rgba(15,25,50,0.9) 0%,rgba(10,18,38,0.95) 100%)'
                        : 'linear-gradient(135deg,rgba(255,255,255,0.95) 0%,rgba(248,250,255,0.98) 100%)',
                    border:`1px solid ${dark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)'}`,
                    borderRadius:16,
                    padding:'12px 18px',
                    boxShadow: dark
                        ? '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                        : '0 4px 20px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                    display:'flex', alignItems:'center', flexWrap:'wrap', gap:12,
                    position:'relative',
                }}>
                    {/* subtle purple glow top-left */}
                    <div style={{
                        position:'absolute', top:-20, left:-20, width:120, height:120,
                        background:'radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)',
                        pointerEvents:'none',
                    }}/>
                    {/* Year */}
                    <PremiumDropdown options={yearOpts} value={year} onChange={handleYear}
                        placeholder="Year" theme={theme} dark={dark} minWidth={110} />

                    {/* Country — admin only */}
                    {userRole === 'admin' && (
                        <PremiumDropdown options={countryOpts} value={country} onChange={handleCountry}
                            placeholder="Country" theme={theme} dark={dark} minWidth={150} />
                    )}

                    <div style={{ width:1, height:24, background:theme.border, flexShrink:0 }}/>

                    <MetricPills selected={filters} onChange={handleFilters} theme={theme} />

                    <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
                        {/* Export PDF */}
                        {showResult && results.length > 0 && !analyzing && (
                            <button onClick={() => exportPDF(results, year, countryName)} style={{
                                height:38, padding:'0 16px', borderRadius:10,
                                border:`1px solid ${theme.border}`, background:theme.surfaceSoft,
                                color:theme.textSoft, fontSize:12, fontWeight:600,
                                cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                                fontFamily:'inherit', transition:'all .15s',
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background=theme.surfaceHover}
                            onMouseLeave={e=>e.currentTarget.style.background=theme.surfaceSoft}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Export PDF
                            </button>
                        )}

                        {/* AI Analysis button */}
                        <button onClick={startAnalysis} disabled={analyzing || employees.length===0} style={{
                            height:38, padding:'0 18px', borderRadius:10, border:'none',
                            background: (analyzing||employees.length===0)
                                ? (dark?'rgba(124,58,237,0.2)':theme.primarySoft)
                                : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                            color: (analyzing||employees.length===0) ? theme.primary : '#fff',
                            fontSize:13, fontWeight:700, cursor:(analyzing||employees.length===0)?'default':'pointer',
                            display:'flex', alignItems:'center', gap:7, fontFamily:'inherit',
                            boxShadow:(analyzing||employees.length===0)?'none':'0 4px 14px rgba(124,58,237,0.35)',
                            transition:'all .2s',
                        }}>
                            {analyzing ? (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                        style={{animation:'pf-spin 1s linear infinite'}}>
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                    </svg>
                                    Analyzing {progress?.current||0}/{progress?.total||'—'}
                                </>
                            ) : (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                                    </svg>
                                    AI Analysis
                                </>
                            )}
                        </button>
                    </div>
                </div>

               
                {/* ── Main table ───────────────────────────────── */}
                <div style={{
                    background: dark ? theme.panelSolid : '#fff',
                    border:`1px solid ${theme.border}`, borderRadius:16,
                    overflow:'hidden', boxShadow:theme.shadow,
                }}>
                    {/* Table header bar */}
                    <div style={{
                        padding:'14px 20px', borderBottom:`1px solid ${theme.border}`,
                        display:'flex', alignItems:'center', gap:10,
                    }}>
                        <span style={{ fontSize:14, fontWeight:700, color:theme.text }}>
                            {showResult && results.length > 0 ? 'Analysis Results' : 'Employee Metrics'}
                        </span>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:99,
                            background:theme.primarySoft, color:theme.primary }}>
                            {displayRows.length} employees
                        </span>
                        {fetching && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textMute} strokeWidth="2"
                                style={{animation:'pf-spin 1s linear infinite', marginLeft:4}}>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                            </svg>
                        )}
                    </div>

                    {/* Scrollable table */}
                    <div className="pf-table-wrap" style={{ overflowX:'auto', scrollbarWidth:'none', msOverflowStyle:'none' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                            <thead>
                                <tr>
                                    {[
                                        { label:'#',          w:40  },
                                        { label:'Employee',   w:180 },
                                        { label:'Dept',       w:120 },
                                        { label:'Attendance',  w:150 },
                                        { label:'Late Days',  w:140 },
                                        { label:'Absent',     w:130 },
                                        { label:'Leave Days', w:130 },
                                        { label:'OT Hours',   w:130 },
                                        ...(showResult && results.length > 0
                                            ? [{ label:'Rating', w:140 }, { label:'Remark', w:260 }]
                                            : []
                                        ),
                                    ].map(h => (
                                        <th key={h.label} style={{
                                            padding:'10px 16px', textAlign:'left', minWidth:h.w,
                                            fontSize:10, fontWeight:800, letterSpacing:'.07em',
                                            textTransform:'uppercase', color:theme.textMute,
                                            background: theme.tableHead,
                                            borderBottom:`1px solid ${theme.border}`,
                                            whiteSpace:'nowrap',
                                        }}>{h.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayRows.length === 0 ? (
                                    <tr><td colSpan={10} style={{ padding:'48px 24px', textAlign:'center', color:theme.textMute }}>
                                        <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
                                        No employee data found for the selected filters.
                                    </td></tr>
                                ) : displayRows.map((emp, i) => (
                                    <tr key={emp.id||emp.user_id} className="pf-row" style={{ borderBottom:`1px solid ${theme.border}` }}>
                                        <td style={{ padding:'12px 16px', color:theme.textMute, fontWeight:600, fontSize:12 }}>{i+1}</td>
                                        <td style={{ padding:'12px 16px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                <Avatar name={emp.name} avatarUrl={emp.avatar_url} size={32}/>
                                                <span style={{ fontWeight:600, color:theme.text }}>{emp.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding:'12px 16px', color:theme.textSoft, fontSize:12 }}>{emp.department||'—'}</td>
                                        
                                        <td style={{ padding:'12px 16px' }}>
                                            <HBar
                                                value={emp.present_days||0}
                                                max={emp.working_days||1}
                                                color={
                                                    emp.working_days > 0 && (emp.present_days/emp.working_days) >= 0.8
                                                        ? '#10b981'
                                                        : emp.working_days > 0 && (emp.present_days/emp.working_days) >= 0.5
                                                            ? '#f59e0b'
                                                            : '#f87171'
                                                }
                                                theme={theme}
                                            />
                                        </td>
                                        <td style={{ padding:'12px 16px' }}><HBar value={emp.late_days||0}   max={maxLate}   color="#f87171" theme={theme}/></td>
                                        <td style={{ padding:'12px 16px' }}><HBar value={emp.absent_days||0} max={maxAbsent} color="#fb923c" theme={theme}/></td>
                                        <td style={{ padding:'12px 16px' }}><HBar value={emp.leave_days||0}  max={maxLeave}  color="#fbbf24" theme={theme}/></td>
                                        <td style={{ padding:'12px 16px' }}><HBar value={emp.ot_hours||0}    max={maxOT}     color="#34d399" theme={theme}/></td>
                                        {showResult && results.length > 0 && <>
                                            <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                                                {emp.rating ? <RatingBadge rating={emp.rating} theme={theme}/> : <span style={{color:theme.textMute,fontSize:12}}>—</span>}
                                            </td>
                                            <td style={{ padding:'12px 16px', fontSize:12, color:theme.textSoft, lineHeight:1.55, maxWidth:260 }}>
                                                {emp.remark||'—'}
                                            </td>
                                        </>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Error */}
                {sseError && (
                    <div style={{
                        padding:'12px 16px', borderRadius:12, fontSize:13,
                        background: dark?'rgba(239,68,68,0.12)':'#fee2e2',
                        border:`1px solid ${dark?'rgba(239,68,68,0.25)':'#fca5a5'}`,
                        color: dark?'#f87171':'#7f1d1d',
                    }}>{sseError}</div>
                )}
            </div>
        </AppLayout>
    );
}