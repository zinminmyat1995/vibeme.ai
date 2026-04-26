import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage, router } from '@inertiajs/react';

// ── Theme hook (mirrors AppLayout) ────────────────────────────
function useTheme() {
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

function getTheme(dark) {
    if (dark) return {
        bg:             '#07111f',
        card:           'rgba(255,255,255,0.04)',
        cardBorder:     'rgba(148,163,184,0.10)',
        cardShadow:     '0 1px 3px rgba(0,0,0,0.3)',
        text:           '#f1f5f9',
        textSoft:       '#94a3b8',
        textMute:       '#475569',
        input:          'rgba(255,255,255,0.06)',
        inputBorder:    'rgba(148,163,184,0.15)',
        inputFocus:     '#6366f1',
        headerBg:       'rgba(8,20,40,0.95)',
        headerBorder:   'rgba(148,163,184,0.10)',
        dayBg:          'rgba(255,255,255,0.02)',
        dayBgWeekend:   'rgba(239,68,68,0.06)',
        dayBgToday:     'rgba(245,158,11,0.08)',
        dayBgSelected:  'rgba(99,102,241,0.15)',
        dayBorderSel:   '#6366f1',
        dayBorderToday: '#f59e0b',
        dayBorder:      'rgba(148,163,184,0.08)',
        navBtn:         'rgba(255,255,255,0.06)',
        navBtnColor:    '#94a3b8',
        modalBg:        '#0f1f35',
        modalBorder:    'rgba(148,163,184,0.12)',
        overlay:        'rgba(0,0,0,0.7)',
        detailBg:       'rgba(255,255,255,0.04)',
        detailBorder:   'rgba(148,163,184,0.08)',
        scrollThumb:    'rgba(255,255,255,0.08)',
        selectBg:       'rgba(255,255,255,0.06)',
        pillBg:         'rgba(99,102,241,0.15)',
        pillColor:      '#a5b4fc',
        empCardBg:      'rgba(255,255,255,0.04)',
        summaryBg:      'rgba(255,255,255,0.04)',
        absentColor:    '#ef4444',
    };
    return {
        bg:             '#eef4fb',
        card:           '#ffffff',
        cardBorder:     'rgba(15,23,42,0.06)',
        cardShadow:     '0 1px 6px rgba(15,23,42,0.06)',
        text:           '#0f172a',
        textSoft:       '#475569',
        textMute:       '#94a3b8',
        input:          '#f8fafc',
        inputBorder:    '#e2e8f0',
        inputFocus:     '#6366f1',
        headerBg:       'rgba(255,255,255,0.92)',
        headerBorder:   'rgba(15,23,42,0.06)',
        dayBg:          '#ffffff',
        dayBgWeekend:   '#fff5f5',
        dayBgToday:     '#fefce8',
        dayBgSelected:  '#ede9fe',
        dayBorderSel:   '#7c3aed',
        dayBorderToday: '#f59e0b',
        dayBorder:      '#f0f0f0',
        navBtn:         '#f3f4f6',
        navBtnColor:    '#6b7280',
        modalBg:        '#ffffff',
        modalBorder:    'rgba(15,23,42,0.08)',
        overlay:        'rgba(15,23,42,0.5)',
        detailBg:       '#f8fafc',
        detailBorder:   '#f1f5f9',
        scrollThumb:    'rgba(0,0,0,0.08)',
        selectBg:       '#ffffff',
        pillBg:         'rgba(99,102,241,0.08)',
        pillColor:      '#6366f1',
        empCardBg:      '#ffffff',
        summaryBg:      '#ffffff',
        absentColor:    '#ef4444',
    };
}

// ── Constants ─────────────────────────────────────────────────
const LEAVE_LABELS = {
    annual:'Annual Leave', medical:'Medical Leave', emergency:'Emergency Leave',
    unpaid:'Unpaid Leave', maternity:'Maternity Leave', paternity:'Paternity Leave',
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function timeToMinutes(t) {
    if (!t) return 0;
    const [h, min] = t.split(':').map(Number);
    return h * 60 + min;
}
function calcWorkHours(checkIn, checkOut, lunchStart, lunchEnd, workStart, workEnd) {
    if (!checkIn || !checkOut) return '';
    const inM  = timeToMinutes(checkIn);
    const outM = timeToMinutes(checkOut);
    if (outM <= inM) return '';
    const wsM = timeToMinutes(workStart || '08:00');
    const weM = timeToMinutes(workEnd   || '17:00');
    const effIn  = Math.max(inM, wsM);
    const effOut = Math.min(outM, weM);
    if (effOut <= effIn) return 0;
    const ls = timeToMinutes(lunchStart || '12:00');
    const le = timeToMinutes(lunchEnd   || '13:00');
    const lunchDeduct = Math.max(0, Math.min(effOut, le) - Math.max(effIn, ls));
    const workMins = effOut - effIn - lunchDeduct;
    return Math.max(0, Math.round((workMins / 60) * 100) / 100);
}
function calcLateMinutes(checkIn, workStart, lunchEnd) {
    if (!checkIn || !workStart) return 0;
    const inM  = timeToMinutes(checkIn);
    const wsM  = timeToMinutes(workStart);
    const leM  = timeToMinutes(lunchEnd || '13:00');
    if (inM >= leM) return 0;
    return Math.max(0, inM - wsM);
}
function autoStatus(checkIn, checkOut, workStart, lunchEnd) {
    if (!checkIn || !checkOut) return 'absent';
    return calcLateMinutes(checkIn, workStart, lunchEnd) > 0 ? 'late' : 'present';
}
function to12h(t) {
    if (!t) return '—';
    const [hStr, mStr] = t.substring(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    return `${h % 12 === 0 ? 12 : h % 12}:${m}${h >= 12 ? 'PM' : 'AM'}`;
}
function hToHM(h) {
    if (!h) return '—';
    const total = Math.round(parseFloat(h) * 60);
    const hrs   = Math.floor(total / 60);
    const mins  = total % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
}

// ── Tooltip ───────────────────────────────────────────────────
function CellTooltip({ text, children }) {
    const [show, setShow] = useState(false);
    return (
        <span style={{ position:'relative', display:'inline-block' }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}>
            {children}
            {show && text && (
                <span style={{
                    position:'absolute', bottom:'calc(100% + 6px)', left:'50%',
                    transform:'translateX(-50%)', background:'#1e293b', color:'#f8fafc',
                    fontSize:11, fontWeight:600, borderRadius:8, padding:'5px 10px',
                    whiteSpace:'nowrap', zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.22)',
                    pointerEvents:'none', lineHeight:1.5,
                }}>
                    {text}
                    <span style={{
                        position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)',
                        width:0, height:0, borderLeft:'5px solid transparent',
                        borderRight:'5px solid transparent', borderTop:'5px solid #1e293b',
                    }}/>
                </span>
            )}
        </span>
    );
}

// ── Custom Select ─────────────────────────────────────────────
function PremiumSelect({ value, onChange, options, placeholder, t, dropId, openId, setOpenId }) {
    // Support both: shared openId/setOpenId (mutual exclusion) or standalone
    const isControlled = dropId !== undefined && setOpenId !== undefined;
    const open = isControlled ? openId === dropId : false;
    const [localOpen, setLocalOpen] = useState(false);
    const actualOpen = isControlled ? open : localOpen;

    const setOpen = (val) => {
        if (isControlled) {
            val ? setOpenId(dropId) : setOpenId(null);
        } else {
            setLocalOpen(val);
        }
    };

    const selected = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const close = () => setOpen(false);
        if (actualOpen) window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [actualOpen]);

    return (
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setOpen(!actualOpen)}
                style={{
                    width: '100%', padding: '10px 14px', borderRadius: 12,
                    border: `1.5px solid ${open ? t.inputFocus : t.inputBorder}`,
                    background: t.input, color: selected ? t.text : t.textMute,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    outline: 'none', transition: 'border-color 0.15s',
                    boxShadow: open ? `0 0 0 3px ${t.inputFocus}22` : 'none',
                }}>
                <span>{selected ? selected.label : (placeholder || 'Select...')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMute} strokeWidth="2.5"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>
            {actualOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: t.modalBg, border: `1.5px solid ${t.inputBorder}`,
                    borderRadius: 12, zIndex: 9999, overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    maxHeight: 240, overflowY: 'auto',
                }}>
                    {options.map(opt => (
                        <button key={opt.value} type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                width: '100%', padding: '10px 14px',
                                background: String(value) === String(opt.value) ? `${t.inputFocus}15` : 'transparent',
                                border: 'none', cursor: 'pointer',
                                color: String(value) === String(opt.value) ? t.inputFocus : t.text,
                                fontSize: 13, fontWeight: String(value) === String(opt.value) ? 700 : 500,
                                textAlign: 'left', transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => { if (String(value) !== String(opt.value)) e.currentTarget.style.background = `${t.inputFocus}08`; }}
                            onMouseLeave={e => { if (String(value) !== String(opt.value)) e.currentTarget.style.background = 'transparent'; }}>
                            {String(value) === String(opt.value) && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.inputFocus} strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            )}
                            {String(value) !== String(opt.value) && <span style={{ width: 14 }}/>}
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AttendanceIndex({
    records = [], employees = [],
    selectedMonth, selectedYear, selectedEmployee,
    countryConfig = { work_hours_per_day:8, lunch_break_minutes:60, standard_start_time:'09:00', lunch_start:'12:00', lunch_end:'13:00' },
    publicHolidays = [],
    publicHolidayDetails = [],
    overtimeMap = {},
    leaveDateMap = {},
}) {
    const dark = useTheme();
    const t = getTheme(dark);

    const { auth } = usePage().props;
    const user     = auth?.user;
    const roleName = user?.role?.name || 'employee';
    const canManage  = roleName === 'hr';
    const canViewAll = ['hr','admin'].includes(roleName);

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [saving, setSaving]               = useState(false);
    const [deleting, setDeleting]           = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [month, setMonth]                 = useState(selectedMonth || new Date().getMonth() + 1);
    const [year, setYear]                   = useState(selectedYear  || new Date().getFullYear());
    const [empId, setEmpId] = useState(
        selectedEmployee
            ? String(selectedEmployee)
            : (canViewAll
                ? String(user?.id || employees[0]?.id || '')
                : String(user?.id || ''))
    );
    const [showModal, setShowModal]         = useState(false);
    const [selected, setSelected]           = useState(null);
    const [selectedDay, setSelectedDay]     = useState(null);

    useEffect(() => {
        if (canViewAll && !selectedEmployee) {
            const myId = String(user?.id || '');
            if (myId && myId !== String(employees[0]?.id || '')) {
                fetchData(myId, month, year);
            }
        }
    }, []);

    function fetchData(newEmpId, newMonth, newYear) {
        router.get('/payroll/attendance', {
            month: newMonth, year: newYear, employee_id: newEmpId,
        }, { preserveState: false });
    }
    function handleEmpChange(val)   { setEmpId(val); fetchData(val, month, year); }
    function handleMonthChange(val) { const m = Number(val); setMonth(m); fetchData(empId, m, year); }
    function handleYearChange(val)  { const y = Number(val); setYear(y); fetchData(empId, month, y); }
    function handlePrevMonth() {
        let m = month, y = year;
        if (m === 1) { m = 12; y--; } else { m--; }
        setMonth(m); setYear(y); fetchData(empId, m, y);
    }
    function handleNextMonth() {
        let m = month, y = year;
        if (m === 12) { m = 1; y++; } else { m++; }
        setMonth(m); setYear(y); fetchData(empId, m, y);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay    = new Date(year, month - 1, 1).getDay();
    const stdHours    = countryConfig?.work_hours_per_day || 8;
    const workStart   = countryConfig?.standard_start_time || '09:00';
    const lunchStart  = countryConfig?.lunch_start || '12:00';
    const lunchEnd    = countryConfig?.lunch_end   || '13:00';
    const today       = new Date().toISOString().split('T')[0];

    const recordMap = {};
    records.forEach(r => {
        const dk = r.date ? r.date.split('T')[0] : '';
        if (dk) recordMap[dk] = r;
    });
    const holidayMap = {};
    publicHolidayDetails.forEach(h => {
        const dk = h.date ? h.date.split('T')[0] : '';
        if (dk) holidayMap[dk] = h.name;
    });

    function pad(n) { return String(n).padStart(2, '0'); }
    function getDayData(day) {
        const dateStr     = `${year}-${pad(month)}-${pad(day)}`;
        const record      = recordMap[dateStr];
        const dow         = new Date(year, month - 1, day).getDay();
        const isWeekend   = dow === 0 || dow === 6;
        const isHoliday   = publicHolidays.includes(dateStr);
        const holidayName = holidayMap[dateStr] || null;
        const otRecord    = overtimeMap[dateStr] || null;
        const leaveInfo   = leaveDateMap[dateStr] || null;
        const isFuture    = dateStr > today;
        return { dateStr, record, isWeekend, isHoliday, holidayName, dow, otRecord, leaveInfo, isFuture };
    }

    const monthlySummary = useMemo(() => {
        let workingDays = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const { isWeekend, isHoliday, isFuture } = getDayData(d);
            if (!isWeekend && !isHoliday && !isFuture) workingDays++;
        }
        const presentDays  = records.filter(r => r.status === 'present' || r.status === 'late').length;
        const lateDays     = records.filter(r => r.status === 'late').length;

        const pad2 = n => String(n).padStart(2, '0');
        const monthPrefix = `${year}-${pad2(month)}`; // e.g. "2026-05"

        const totalOTHours = Object.entries(overtimeMap)
            .filter(([date]) => date.startsWith(monthPrefix))  // ← ဒီ month ဖြစ်မှ
            .reduce((s, [, ot]) => s + (parseFloat(ot.hours_approved) || 0), 0);

      
        const leaveDays = Object.values(leaveDateMap).reduce((sum, leaves) => {
            const arr = Array.isArray(leaves) ? leaves : [leaves];
            return sum + arr.reduce((s, l) => s + (parseFloat(l?.total_days) || 0), 0);
        }, 0);
        const absentDays   = Math.max(0, workingDays - presentDays - leaveDays);
        const totalLateMin = records.reduce((s, r) => s + (r.late_minutes || 0), 0);
        const totalWH      = records.reduce((s, r) => s + (parseFloat(r.work_hours_actual) || 0), 0);
        return { workingDays, presentDays, absentDays, lateDays, totalOTHours, leaveDays, totalLateMin, totalWH };
    }, [records, month, year, daysInMonth, leaveDateMap, publicHolidays, today]);

    const selectedEmp = employees.find(e => String(e.id) === String(empId));

    function handleDayClick(day) {
        setSelectedDay({ day, ...getDayData(day) });
    }

    function handleSave(formData) {
        setSaving(true);
        const status = autoStatus(formData.check_in_time, formData.check_out_time, workStart, lunchEnd);
        router.post('/payroll/attendance', { ...formData, status }, {
            onSuccess: () => {
                setShowModal(false); setSaving(false);
                if (selectedDay) {
                    setSelectedDay(prev => ({
                        ...prev,
                        record: { ...prev?.record, ...formData, status, user: prev?.record?.user }
                    }));
                }
            },
            onError: (errs) => {
                setSaving(false);
                const firstErr = Object.values(errs)[0] || 'Something went wrong.';
                const friendly = firstErr
                    .replace('check_in_time', 'Check In time')
                    .replace('check_out_time', 'Check Out time')
                    .replace(/must match the format.*/, 'must be in HH:MM format (e.g. 08:00)');
                window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: friendly, type: 'error' } }));
            },
        });
    }

    function handleDelete() {
        if (!selectedDay?.record) return;
        setDeleting(true);
        router.delete(`/payroll/attendance/${selectedDay.record.id}`, {
            onSuccess: () => { setDeleting(false); setShowDeleteConfirm(false); setSelectedDay(null); },
            onError:   () => { setDeleting(false); },
        });
    }

    const empOptions    = employees.map(e => ({ value: String(e.id), label: e.name }));
    const monthOptions  = MONTHS.map((m, i) => ({ value: String(i+1), label: m }));
    const yearOptions   = [2024,2025,2026,2027].map(y => ({ value: String(y), label: String(y) }));

    // Summary stat cards
    const stats = [
        { val: monthlySummary.workingDays,            label: 'Working Days',   color: '#6366f1',  icon: '📅' },
        { val: monthlySummary.presentDays,            label: 'Present',        color: '#10b981',  icon: '✅' },
        { val: monthlySummary.absentDays,             label: 'Absent',         color: '#ef4444',  icon: '❌' },
        { val: monthlySummary.lateDays,               label: 'Late Days',      color: '#f59e0b',  icon: '⏰' },
        { val: `${monthlySummary.totalOTHours}h`, label: 'OT Hours', color: '#8b5cf6', icon: '⚡' },
        { val: monthlySummary.leaveDays,              label: 'Leave Days',     color: '#10b981',  icon: '🏖️' },
        { val: `${monthlySummary.totalLateMin}m`,     label: 'Total Late',     color: '#f59e0b',  icon: '⚡' },
        { val: `${monthlySummary.totalWH.toFixed(1)}h`, label: 'Work Hours',  color: '#6366f1',  icon: '⏱️' },
        { val: publicHolidays.length,                 label: 'Holidays',       color: '#ef4444',  icon: '🎌' },
    ];

    return (
        <AppLayout title="Attendance">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
                .att-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
                .att-wrap ::-webkit-scrollbar { width: 0; height: 0; display: none; }
                .att-wrap * { scrollbar-width: none; -ms-overflow-style: none; }
                .att-day-cell:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
                .att-nav-btn:hover { background: rgba(99,102,241,0.12) !important; color: #6366f1 !important; }
                .stat-card:hover { transform: translateY(-2px); }
                .att-emp-row:hover { background: rgba(99,102,241,0.06) !important; }
                .att-modal-body::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="att-wrap" style={{ display:'flex', flexDirection:'column', gap:16, background: t.bg, minHeight:'100%' }}>

                {/* ── Filter Row ── */}
                <div style={{
                    display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
                    background: t.card, border: `1px solid ${t.cardBorder}`,
                    borderRadius: 16, padding: '12px 16px',
                    boxShadow: t.cardShadow,
                }}>
                    {canViewAll && (
                        <div style={{ minWidth: 180 }}>
                            <PremiumSelect
                                value={empId}
                                onChange={handleEmpChange}
                                options={empOptions}
                                placeholder="Select Employee"
                                t={t}
                                dropId="emp"
                                openId={openDropdownId}
                                setOpenId={setOpenDropdownId}
                            />
                        </div>
                    )}
                    <div style={{ minWidth: 140 }}>
                        <PremiumSelect
                            value={String(month)}
                            onChange={handleMonthChange}
                            options={monthOptions}
                            t={t}
                            dropId="month"
                            openId={openDropdownId}
                            setOpenId={setOpenDropdownId}
                        />
                    </div>
                    <div style={{ minWidth: 100 }}>
                        <PremiumSelect
                            value={String(year)}
                            onChange={handleYearChange}
                            options={yearOptions}
                            t={t}
                            dropId="year"
                            openId={openDropdownId}
                            setOpenId={setOpenDropdownId}
                        />
                    </div>
                    <div style={{ flex: 1 }} />
                    {canManage && (
                        <button
                            onClick={() => { setSelected(null); setShowModal(true); }}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', border: 'none', borderRadius: 12,
                                padding: '10px 20px', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Attendance
                        </button>
                    )}
                </div>

                {/* ── Employee Card ── */}
                {selectedEmp && (
                    <div style={{
                        background: t.empCardBg, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 16, padding: '16px 20px', boxShadow: t.cardShadow,
                        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                    }}>
                        {selectedEmp.avatar_url ? (
                            <img src={`/storage/${selectedEmp.avatar_url}`} alt={selectedEmp.name}
                                style={{ width:56, height:56, borderRadius:16, objectFit:'cover', flexShrink:0, border:`2px solid ${t.cardBorder}` }}/>
                        ) : (
                            <div style={{
                                width:56, height:56, borderRadius:16, flexShrink:0, fontSize:22, fontWeight:800,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'#fff',
                                display:'flex', alignItems:'center', justifyContent:'center',
                            }}>
                                {selectedEmp.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                                <span style={{ fontSize:16, fontWeight:800, color:t.text, letterSpacing:'-0.3px' }}>{selectedEmp.name}</span>
                                {selectedEmp.role?.name && (
                                    <span style={{
                                        fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px',
                                        padding:'3px 10px', borderRadius:99,
                                        background: t.pillBg, color: t.pillColor,
                                    }}>{selectedEmp.role.name}</span>
                                )}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, flexWrap:'wrap' }}>
                                {selectedEmp.position && <span style={{ fontSize:12, fontWeight:600, color:t.textSoft }}>{selectedEmp.position}</span>}
                                {selectedEmp.position && selectedEmp.department && <span style={{ color:t.textMute, fontSize:12 }}>·</span>}
                                {selectedEmp.department && <span style={{ fontSize:12, fontWeight:600, color:'#6366f1' }}>{selectedEmp.department}</span>}
                                <span style={{ color:t.textMute, fontSize:12 }}>·</span>
                                <span style={{ fontSize:12, color:t.textMute }}>{MONTHS[month-1]} {year}</span>
                                <span style={{ color:t.textMute, fontSize:12 }}>·</span>
                                <span style={{ fontSize:12, color:t.textMute, fontWeight:600 }}>{monthlySummary.workingDays} working days</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Calendar + Detail ── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 268px', gap:14 }}>
                    {/* Calendar */}
                    <div style={{
                        background: t.card, border: `1px solid ${t.cardBorder}`,
                        borderRadius: 18, padding: 18, boxShadow: t.cardShadow,
                    }}>
                        {/* Nav */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <button className="att-nav-btn" onClick={handlePrevMonth} style={{
                                background: t.navBtn, border:'none', borderRadius:10,
                                width:32, height:32, fontSize:16, cursor:'pointer',
                                color: t.navBtnColor, display:'flex', alignItems:'center', justifyContent:'center',
                                transition:'all 0.15s',
                            }}>‹</button>
                            <div style={{ fontSize:15, fontWeight:800, color:t.text, letterSpacing:'-0.3px' }}>
                                {MONTHS[month-1]} {year}
                            </div>
                            <button className="att-nav-btn" onClick={handleNextMonth} style={{
                                background: t.navBtn, border:'none', borderRadius:10,
                                width:32, height:32, fontSize:16, cursor:'pointer',
                                color: t.navBtnColor, display:'flex', alignItems:'center', justifyContent:'center',
                                transition:'all 0.15s',
                            }}>›</button>
                        </div>

                        {/* Day headers */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
                            {DAYS.map((d,i) => (
                                <div key={d} style={{
                                    textAlign:'center', fontSize:10, fontWeight:700,
                                    padding:'4px 0', letterSpacing:'0.5px',
                                    color: (i===0||i===6) ? '#ef4444' : t.textMute,
                                }}>{d}</div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
                            {Array.from({ length: firstDay }).map((_,i) => <div key={`e-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_,i) => {
                                const day = i + 1;
                                const { dateStr, record, isWeekend, isHoliday, holidayName, otRecord, leaveInfo, isFuture } = getDayData(day);
                                const isToday    = dateStr === today;
                                const isSelected = selectedDay?.dateStr === dateStr;
                                const isAbsent   = !isWeekend && !isHoliday && !isFuture && !record && !leaveInfo;

                                const cellBg = isSelected ? t.dayBgSelected
                                    : isToday   ? t.dayBgToday
                                    : (isWeekend || isHoliday) ? t.dayBgWeekend
                                    : t.dayBg;

                                const cellBorder = isSelected ? `2px solid ${t.dayBorderSel}`
                                    : isToday   ? `2px solid ${t.dayBorderToday}`
                                    : `1px solid ${t.dayBorder}`;

                                return (
                                    <div key={day} className="att-day-cell" onClick={() => handleDayClick(day)} style={{
                                        borderRadius: 10, padding: '6px 7px 5px',
                                        minHeight: 92, display: 'flex', flexDirection: 'column', gap: 1,
                                        cursor: 'pointer', boxSizing: 'border-box',
                                        background: cellBg, border: cellBorder,
                                        transition: 'all 0.15s',
                                        boxShadow: isSelected ? `0 0 0 3px ${t.dayBorderSel}22`
                                            : isToday ? `0 0 0 2px ${t.dayBorderToday}22` : 'none',
                                    }}>
                                        <div style={{
                                            fontSize:11, fontWeight: isToday ? 900 : 700,
                                            color: (isWeekend || isHoliday) ? '#ef4444'
                                                : isToday ? '#d97706'
                                                : isSelected ? '#6366f1'
                                                : t.textSoft,
                                            marginBottom:1,
                                        }}>{day}</div>

                                        {isHoliday && holidayName && (
                                            <div style={{
                                                fontSize:9, fontWeight:800, color:'#dc2626',
                                                textAlign:'center', lineHeight:1.4, wordBreak:'break-word', width:'100%',
                                                background: dark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                                                borderRadius:4, padding:'2px 3px', marginTop:1,
                                            }}>{holidayName}</div>
                                        )}

                                        {isAbsent && (
                                            <div style={{ fontSize:10, color:'#ef4444', fontWeight:700, marginTop:2 }}>Absent</div>
                                        )}

                                        {(() => {
                                            const rows = [];
                                            if (record?.check_in_time)    rows.push({ key:'in',    label:'In',    value: to12h(record.check_in_time),     color:'#6366f1', tip: null });
                                            if (record?.check_out_time)   rows.push({ key:'out',   label:'Out',   value: to12h(record.check_out_time),    color:'#6366f1', tip: null });
                                            if (record?.work_hours_actual) rows.push({ key:'wh',   label:'WH',    value: hToHM(record.work_hours_actual), color:'#10b981', tip: null });
                                            const leaveInfos = Array.isArray(leaveInfo) ? leaveInfo : (leaveInfo ? [leaveInfo] : []);
                                            leaveInfos.forEach((li, idx) => {
                                                const lv = li.is_half ? (li.day_type==='half_day_am' ? 'AM Half' : 'PM Half') : 'Full Day';
                                                const lc = li.is_half ? (li.day_type==='half_day_am' ? '#d97706' : '#7c3aed') : '#dc2626';
                                                rows.push({ key:`leave-${idx}`, label:'Leave', value: lv, color: lc, tip: li.reason || (LEAVE_LABELS[li.type] || li.type) });
                                            });
                                            if (otRecord && parseFloat(otRecord.hours_approved) > 0) {
                                                const ov = parseFloat(otRecord.hours_approved) % 1 === 0
                                                    ? `${parseInt(otRecord.hours_approved)}h` : hToHM(otRecord.hours_approved);
                                                rows.push({ key:'ot', label:'OT', value: ov, color:'#8b5cf6', tip: otRecord.reason || null });
                                            }
                                            if (record?.late_minutes > 0)
                                                rows.push({ key:'late', label:'Late', value: `${record.late_minutes}m`, color:'#f59e0b', tip: null });
                                            if (parseFloat(record?.short_hours) > 0)
                                                rows.push({ key:'short', label:'Short', value: hToHM(record.short_hours), color:'#ef4444', tip: null });
                                            if (!rows.length) return null;
                                            return (
                                                <table style={{ borderCollapse:'collapse', marginTop:3, tableLayout:'fixed', width:'100%' }}>
                                                    <tbody>
                                                        {rows.map(row => (
                                                            <tr key={row.key}>
                                                                <td style={{ fontSize:10, fontWeight:600, color:t.textMute, width:28, paddingBottom:1, verticalAlign:'top', lineHeight:'16px', whiteSpace:'nowrap' }}>{row.label}</td>
                                                                <td style={{ fontSize:10, fontWeight:600, color:t.textMute, width:10, paddingBottom:1, verticalAlign:'top', lineHeight:'16px', textAlign:'center' }}>:</td>
                                                                <td style={{ fontSize:10, fontWeight:700, color:row.color, paddingBottom:1, verticalAlign:'top', lineHeight:'16px' }}>
                                                                    {row.tip ? <CellTooltip text={row.tip}><span>{row.value}</span></CellTooltip> : row.value}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    {selectedDay ? (
                        <div style={{
                            background: t.card, border: `1px solid ${t.cardBorder}`,
                            borderRadius: 18, padding: 16, boxShadow: t.cardShadow,
                            display: 'flex', flexDirection: 'column', gap: 10,
                            overflowY: 'auto', maxHeight: 'calc(100vh - 300px)',
                        }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                <div>
                                    <div style={{ fontSize:12, fontWeight:800, color:t.text, lineHeight:1.4 }}>
                                        {new Date(selectedDay.dateStr+'T00:00:00').toLocaleDateString('en-US',{
                                            weekday:'long', month:'long', day:'numeric'
                                        })}
                                    </div>
                                    {selectedDay.isWeekend && (
                                        <span style={{
                                            display:'inline-block', marginTop:4,
                                            fontSize:9, fontWeight:800, color:'#dc2626',
                                            background: dark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                                            border:'1px solid #fecaca', borderRadius:99, padding:'2px 8px',
                                        }}>Weekend</span>
                                    )}
                                </div>
                                <button onClick={() => setSelectedDay(null)} style={{
                                    background: t.navBtn, border:'none', borderRadius:8,
                                    width:24, height:24, cursor:'pointer', fontSize:11,
                                    color:t.textMute, display:'flex', alignItems:'center', justifyContent:'center',
                                }}>✕</button>
                            </div>

                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                {selectedDay.isHoliday && (
                                    <div style={{
                                        display:'inline-flex', alignItems:'center', gap:7,
                                        background: dark ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg,#fef2f2,#fff1f1)',
                                        border: dark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
                                        borderRadius:10, padding:'7px 12px', width:'100%',
                                    }}>
                                        <span style={{ fontSize:15 }}>🎌</span>
                                        <div>
                                            <div style={{ fontSize:11, fontWeight:800, color:'#dc2626' }}>
                                                {selectedDay.holidayName || 'Public Holiday'}
                                            </div>
                                            <div style={{ fontSize:10, color:'#f87171', marginTop:1 }}>Public Holiday</div>
                                        </div>
                                    </div>
                                )}
                                {(() => {
                                    const leaveInfos = Array.isArray(selectedDay.leaveInfo)
                                        ? selectedDay.leaveInfo
                                        : (selectedDay.leaveInfo ? [selectedDay.leaveInfo] : []);
                                    return leaveInfos.map((li, idx) => {
                                        const typeLabel = LEAVE_LABELS[li.type] || li.type;
                                        const dayLabel  = li.day_type === 'half_day_am' ? 'AM Half Day'
                                                        : li.day_type === 'half_day_pm' ? 'PM Half Day' : 'Full Day';
                                        const colors = li.day_type === 'half_day_am'
                                            ? { bg: dark ? 'rgba(245,158,11,0.1)' : '#fefce8', color:'#d97706', border: dark ? 'rgba(245,158,11,0.2)' : '#fde047', icon:'🌤️' }
                                            : li.day_type === 'half_day_pm'
                                            ? { bg: dark ? 'rgba(124,58,237,0.1)' : '#f5f3ff', color:'#7c3aed', border: dark ? 'rgba(124,58,237,0.2)' : '#ddd6fe', icon:'🌙' }
                                            : { bg: dark ? 'rgba(239,68,68,0.1)' : '#fee2e2', color:'#dc2626', border: dark ? 'rgba(239,68,68,0.2)' : '#fca5a5', icon:'🏖️' };
                                        return (
                                            <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:10, padding:'8px 12px', width:'100%' }}>
                                                <span style={{ fontSize:16 }}>{colors.icon}</span>
                                                <div>
                                                    <div style={{ fontSize:12, fontWeight:800, color:colors.color }}>{dayLabel} Leave</div>
                                                    <div style={{ fontSize:10, color:colors.color, opacity:0.8, marginTop:1 }}>{typeLabel}</div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {selectedDay.record ? (
                                <div style={{ display:'flex', flexDirection:'column' }}>
                                    <DR label="Employee"  val={selectedDay.record.user?.name || '—'} t={t} />
                                    <DR label="Status" t={t}>
                                        <StatusPill status={selectedDay.record.status} dark={dark} />
                                    </DR>
                                    <DR label="Check In"  val={to12h(selectedDay.record.check_in_time)  || '—'} t={t} />
                                    <DR label="Check Out" val={to12h(selectedDay.record.check_out_time) || '—'} t={t} />
                                    <DR label="Work Hours" t={t}>
                                        <span style={{ color:'#6366f1', fontWeight:700, fontSize:13 }}>
                                            {selectedDay.record.work_hours_actual ? hToHM(selectedDay.record.work_hours_actual) : '—'}
                                        </span>
                                    </DR>
                                    {parseFloat(selectedDay.record.short_hours) > 0 && (
                                        <DR label="Short Hours" t={t}>
                                            <span style={{ color:'#ef4444', fontWeight:700, fontSize:13 }}>{hToHM(selectedDay.record.short_hours)} short</span>
                                        </DR>
                                    )}
                                    {selectedDay.record.late_minutes > 0 && (
                                        <DR label="Late" t={t}>
                                            <span style={{ color:'#f59e0b', fontWeight:700, fontSize:13 }}>{selectedDay.record.late_minutes} min</span>
                                        </DR>
                                    )}
                                    {selectedDay.otRecord && parseFloat(selectedDay.otRecord.hours_approved) > 0 && (() => {
                                        const ot   = selectedDay.otRecord;
                                        const h    = parseFloat(ot.hours_approved);
                                        const hLabel = Number.isInteger(h) ? `${h}h` : `${h}h`;
                                        const segs = ot.segments || [];
                                        return (
                                            <>
                                                <DR label="OT Hours" t={t}>
                                                    <span style={{ color:'#8b5cf6', fontWeight:700, fontSize:13 }}>{hLabel}</span>
                                                </DR>
                                                {segs.length > 0 && (
                                                    <div style={{ paddingTop:8, marginTop:2 }}>
                                                        <div style={{ fontSize:10, color:t.textMute, fontWeight:700, marginBottom:8, letterSpacing:'0.04em' }}>OVERTIME DETAIL</div>
                                                        <div style={{ borderTop:`1px solid ${t.detailBorder}`, paddingTop:6, display:'flex', flexDirection:'column', gap:8 }}>
                                                            {segs.map((seg, i) => {
                                                                const sh = parseFloat(seg.hours);
                                                                const shLabel = Number.isInteger(sh) ? `${sh}h` : `${sh}h`;
                                                                return (
                                                                    <div key={i}>
                                                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                                            <span style={{ fontSize:11, color:t.textMute, fontWeight:600 }}>{seg.title}</span>
                                                                            <span style={{ fontSize:12, fontWeight:700, color:'#8b5cf6' }}>{shLabel}</span>
                                                                        </div>
                                                                        <div style={{ fontSize:11, fontWeight:700, color:'#8b5cf6', marginTop:2 }}>
                                                                            {to12h(seg.start_time)} — {to12h(seg.end_time)}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    {parseFloat(selectedDay.record.work_hours_actual) > stdHours && !selectedDay.otRecord && (
                                        <div style={{
                                            background: dark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
                                            border: dark ? '1px solid rgba(245,158,11,0.2)' : '1px solid #fde68a',
                                            borderRadius:10, padding:'8px 10px', fontSize:11, color:'#92400e', marginTop:6,
                                        }}>
                                            ⚠️ Exceeds {stdHours}h standard. Consider OT request.
                                        </div>
                                    )}
                                    {selectedDay.record.note && (
                                        <div style={{ paddingTop:8, borderTop:`1px solid ${t.detailBorder}`, marginTop:4 }}>
                                            <div style={{ fontSize:10, color:t.textMute, fontWeight:700, marginBottom:3 }}>NOTE</div>
                                            <div style={{ fontSize:12, color:t.textSoft, fontStyle:'italic', lineHeight:1.5 }}>
                                                {selectedDay.record.note}
                                            </div>
                                        </div>
                                    )}
                                    {canManage && (
                                        <div style={{ display:'flex', gap:8, marginTop:12 }}>
                                            <button
                                                onClick={() => { setSelected(selectedDay); setShowModal(true); }}
                                                style={{
                                                    flex:1, background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                                    color:'#fff', border:'none', borderRadius:10,
                                                    padding:'9px 0', fontSize:12, fontWeight:700,
                                                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                                                    boxShadow:'0 4px 12px rgba(99,102,241,0.3)',
                                                }}>
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                style={{
                                                    flex:1, background:'transparent',
                                                    color:'#ef4444', border:'1.5px solid rgba(239,68,68,0.3)',
                                                    borderRadius:10, padding:'9px 0', fontSize:12, fontWeight:700,
                                                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                                                    transition:'all 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                !selectedDay.otRecord && !selectedDay.leaveInfo && (
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'20px 0', color:t.textMute, fontSize:12 }}>
                                        <div style={{ fontSize:28, opacity:0.4 }}>—</div>
                                        <div style={{ color:t.textMute, fontWeight:500, textAlign:'center' }}>
                                            {selectedDay.isWeekend || selectedDay.isHoliday
                                                ? 'No attendance required'
                                                : selectedDay.isFuture ? 'Future date'
                                                : 'Absent — No record'}
                                        </div>
                                        {canManage && !selectedDay.isWeekend && !selectedDay.isHoliday && !selectedDay.isFuture && (
                                            <button
                                                onClick={() => { setSelected(selectedDay); setShowModal(true); }}
                                                style={{
                                                    marginTop:4, background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                                    color:'#fff', border:'none', borderRadius:10,
                                                    padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer',
                                                }}>
                                                + Add Record
                                            </button>
                                        )}
                                    </div>
                                )
                            )}

                            {/* OT only day */}
                            {!selectedDay.record && selectedDay.otRecord && parseFloat(selectedDay.otRecord.hours_approved) > 0 && (() => {
                                const ot   = selectedDay.otRecord;
                                const h    = parseFloat(ot.hours_approved);
                                const hLabel = Number.isInteger(h) ? `${h}h` : `${h}h`;
                                const segs = ot.segments || [];
                                return (
                                    <div>
                                        <DR label="Employee" val={selectedEmp?.name || '—'} t={t} />
                                        <DR label="Status" t={t}>
                                            <span style={{ fontSize:11, fontWeight:700, background: dark ? 'rgba(139,92,246,0.15)' : '#fdf4ff', color:'#8b5cf6', borderRadius:99, padding:'2px 10px' }}>OT Only</span>
                                        </DR>
                                        <DR label="OT Hours" t={t}>
                                            <span style={{ color:'#8b5cf6', fontWeight:700, fontSize:13 }}>{hLabel}</span>
                                        </DR>
                                        {segs.length > 0 && (
                                            <div style={{ paddingTop:8, marginTop:2 }}>
                                                <div style={{ fontSize:10, color:t.textMute, fontWeight:700, marginBottom:8, letterSpacing:'0.04em' }}>OVERTIME DETAIL</div>
                                                <div style={{ borderTop:`1px solid ${t.detailBorder}`, paddingTop:6, display:'flex', flexDirection:'column', gap:8 }}>
                                                    {segs.map((seg, i) => {
                                                        const sh = parseFloat(seg.hours);
                                                        const shLabel = Number.isInteger(sh) ? `${sh}h` : `${sh}h`;
                                                        return (
                                                            <div key={i}>
                                                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                                    <span style={{ fontSize:11, color:t.textMute, fontWeight:600 }}>{seg.title}</span>
                                                                    <span style={{ fontSize:12, color:'#8b5cf6', fontWeight:700 }}>{shLabel}</span>
                                                                </div>
                                                                <div style={{ fontSize:11, fontWeight:700, color:'#8b5cf6', marginTop:2 }}>
                                                                    {to12h(seg.start_time)} — {to12h(seg.end_time)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div style={{
                            background: t.card, border: `1px solid ${t.cardBorder}`,
                            borderRadius: 18, padding: 16, boxShadow: t.cardShadow,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:t.textMute, fontSize:12, minHeight:200,
                            flexDirection:'column', gap:8,
                        }}>
                            <div style={{ fontSize:28, opacity:0.3 }}>📅</div>
                            <span>Click a day to view details</span>
                        </div>
                    )}
                </div>

                {/* ── Monthly Summary ── */}
                <div style={{
                    background: t.summaryBg, border: `1px solid ${t.cardBorder}`,
                    borderRadius: 18, padding: '16px 20px', boxShadow: t.cardShadow,
                }}>
                    <div style={{ fontSize:13, fontWeight:800, color:t.text, marginBottom:14, letterSpacing:'-0.2px' }}>
                        📊 {MONTHS[month-1]} {year} — Monthly Summary
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:10 }}>
                        {stats.map((item, i) => (
                            <div key={i} className="stat-card" style={{
                                textAlign:'center', padding:'12px 4px',
                                background: t.detailBg, borderRadius:12,
                                border:`1px solid ${t.cardBorder}`,
                                transition:'all 0.15s',
                                cursor:'default',
                            }}>
                                <div style={{ fontSize:16, marginBottom:4 }}>{item.icon}</div>
                                <div style={{ fontSize:16, fontWeight:900, color:item.color, letterSpacing:'-0.5px' }}>{item.val}</div>
                                <div style={{ fontSize:9, color:t.textMute, marginTop:3, fontWeight:600, letterSpacing:'0.3px' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Delete Confirm Modal ── */}
            {showDeleteConfirm && selectedDay?.record && (
                <div style={{
                    position:'fixed', inset:0, background:t.overlay,
                    display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
                    backdropFilter:'blur(8px)',
                }}>
                    <div style={{
                        background:t.modalBg, border:`1px solid ${t.modalBorder}`,
                        borderRadius:20, width:380, padding:'32px 28px 24px',
                        boxShadow:'0 24px 64px rgba(0,0,0,0.25)', textAlign:'center',
                    }}>
                        <div style={{
                            width:56, height:56, borderRadius:16,
                            background: dark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                            border: dark ? '1px solid rgba(239,68,68,0.2)' : 'none',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:26, margin:'0 auto 16px',
                        }}>🗑️</div>
                        <div style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:8 }}>Delete Attendance?</div>
                        <div style={{ fontSize:12, color:t.textMute, marginBottom:24, lineHeight:1.7 }}>
                            {new Date(selectedDay.dateStr+'T00:00:00').toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric' })}
                            <br/><span style={{ fontWeight:700, color:t.textSoft }}>{selectedDay.record.user?.name}</span>
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                            <button
                                style={{
                                    flex:1, background:'transparent', border:`1.5px solid ${t.inputBorder}`,
                                    borderRadius:12, padding:'11px', fontSize:13, fontWeight:600,
                                    cursor:'pointer', color:t.textSoft, transition:'all 0.15s',
                                }}
                                onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                                onMouseEnter={e => e.currentTarget.style.background = t.input}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Cancel
                            </button>
                            <button
                                style={{
                                    flex:1, background:'linear-gradient(135deg,#ef4444,#dc2626)',
                                    border:'none', borderRadius:12, padding:'11px',
                                    fontSize:13, fontWeight:700,
                                    cursor:deleting?'not-allowed':'pointer', color:'#fff',
                                    opacity:deleting?0.6:1, boxShadow:'0 4px 14px rgba(239,68,68,0.35)',
                                }}
                                onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <AttendanceModal
                    data={selected}
                    employees={employees}
                    saving={saving}
                    countryConfig={countryConfig}
                    leaveInfo={selected?.leaveInfo || null}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    dark={dark}
                    t={t}
                />
            )}
        </AppLayout>
    );
}

// ── Detail Row ────────────────────────────────────────────────
function DR({ label, val, children, t }) {
    return (
        <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'8px 0', borderBottom:`1px solid ${t.detailBorder}`,
        }}>
            <span style={{ fontSize:11, color:t.textMute, fontWeight:600 }}>{label}</span>
            {children || <span style={{ fontSize:12, color:t.textSoft, fontWeight:600 }}>{val}</span>}
        </div>
    );
}

// ── Status Pill ───────────────────────────────────────────────
function StatusPill({ status, dark }) {
    const cfg = {
        present:  { label:'Present',  bg: dark ? 'rgba(16,185,129,0.15)' : '#d1fae5', color:'#10b981' },
        absent:   { label:'Absent',   bg: dark ? 'rgba(239,68,68,0.15)' : '#fee2e2',  color:'#ef4444' },
        late:     { label:'Late',     bg: dark ? 'rgba(245,158,11,0.15)' : '#fef3c7', color:'#f59e0b' },
        half_day: { label:'Half Day', bg: dark ? 'rgba(59,130,246,0.15)' : '#dbeafe', color:'#3b82f6' },
    };
    const c = cfg[status] || cfg.present;
    return (
        <span style={{ fontSize:11, fontWeight:700, background:c.bg, color:c.color, borderRadius:99, padding:'3px 12px' }}>
            {c.label}
        </span>
    );
}


function TimePicker({ value, onChange, theme, dark, error, disabled = false }) {
    const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    const parseVal = (v) => {
        if (!v) return null;
        const [hStr, mStr] = v.split(':');
        const h24 = parseInt(hStr);
        if (isNaN(h24)) return null;
        const p   = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        return { h: String(h12).padStart(2, '0'), m: (mStr || '00').slice(0, 2), p };
    };

    const parsed = parseVal(value);
    const h = parsed?.h ?? '--';
    const m = parsed?.m ?? '--';
    const p = parsed?.p ?? 'AM';

    const emit = (nh, nm, np) => {
        if (disabled) return;
        const safeH = nh === '--' ? '08' : nh;
        const safeM = nm === '--' ? '00' : nm;
        let h24 = parseInt(safeH);
        if (isNaN(h24)) return;
        if (np === 'PM' && h24 !== 12) h24 += 12;
        if (np === 'AM' && h24 === 12) h24 = 0;
        onChange(`${String(h24).padStart(2, '0')}:${safeM}`);
    };

    const sel = {
        height: 40, border: 'none', background: 'transparent',
        color: disabled ? theme.textMute : theme.text,
        fontSize: 14, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', outline: 'none',
        appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        textAlign: 'center', padding: '0 4px',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
    };

    return (
        <>
            <style>{`
                .tp-att-sel::-webkit-scrollbar { display: none; }
                .tp-att-sel option {
                    background: ${dark ? '#1e2d4a' : '#ffffff'} !important;
                    color: ${dark ? '#f1f5f9' : '#0f172a'} !important;
                }
            `}</style>
            <div style={{
                display: 'inline-flex', alignItems: 'center',
                border: `1.5px solid ${error ? '#ef4444' : theme.inputBorder}`,
                borderRadius: 12, overflow: 'hidden',
                background: disabled
                    ? (dark ? 'rgba(255,255,255,0.03)' : '#f3f4f6')
                    : (dark ? 'rgba(255,255,255,0.06)' : '#fff'),
                height: 44, transition: 'border-color 0.15s',
                opacity: disabled ? 0.5 : 1,
                width: 'fit-content',
            }}>
                <div style={{ paddingLeft: 10, paddingRight: 4, color: theme.textMute, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                </div>

                <select className="tp-att-sel" value={h} disabled={disabled}
                    onChange={e => emit(e.target.value, m === '--' ? '00' : m, p)}
                    style={{ ...sel, width: 36 }}>
                    {!parsed && <option value="--">--</option>}
                    {hours.map(hv => <option key={hv} value={hv}>{hv}</option>)}
                </select>

                <span style={{ color: theme.textMute, fontWeight: 800, fontSize: 15, userSelect: 'none' }}>:</span>

                <select className="tp-att-sel" value={m} disabled={disabled}
                    onChange={e => emit(h === '--' ? '08' : h, e.target.value, p)}
                    style={{ ...sel, width: 36 }}>
                    {!parsed && <option value="--">--</option>}
                    {minutes.map(mv => <option key={mv} value={mv}>{mv}</option>)}
                </select>

                <div style={{ width: 1, height: 24, background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', margin: '0 4px', flexShrink: 0 }} />

                {['AM', 'PM'].map(period => (
                    <button key={period} type="button"
                        onClick={() => {
                            if (disabled) return;
                            if (!parsed) {
                                onChange(`${period === 'PM' ? '20' : '08'}:00`);
                                return;
                            }
                            emit(h, m, period);
                        }}
                        style={{
                            width: 36, height: '100%', border: 'none',
                            background: parsed && p === period
                                ? (dark ? 'rgba(99,102,241,0.35)' : '#ede9fe')
                                : 'transparent',
                            color: parsed && p === period ? theme.inputFocus : theme.textMute,
                            fontSize: 11, fontWeight: 800,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', transition: 'all .15s',
                            borderLeft: period === 'PM'
                                ? `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                                : 'none',
                            flexShrink: 0,
                        }}
                    >{period}</button>
                ))}
            </div>
        </>
    );
}

// ── Attendance Modal ──────────────────────────────────────────
function AttendanceModal({ data, employees, onClose, onSave, saving, countryConfig, leaveInfo, dark, t }) {
    const WORK_START  = countryConfig?.work_start || countryConfig?.standard_start_time || '08:00';
    const WORK_END    = countryConfig?.work_end   || '17:00';
    const LUNCH_START = countryConfig?.lunch_start || '12:00';
    const LUNCH_END   = countryConfig?.lunch_end   || '13:00';
    const isAmHalf    = leaveInfo?.day_type === 'half_day_am';
    const isPmHalf    = leaveInfo?.day_type === 'half_day_pm';
    const isEdit      = !!data?.record;

    const [modalOpenId, setModalOpenId] = useState(null);
    const [form, setForm] = useState({
        user_id:           data?.record?.user_id           || '',
        date:              data?.dateStr                   || '',
        check_in_time:     data?.record?.check_in_time     || '',
        check_out_time:    data?.record?.check_out_time    || '',
        work_hours_actual: data?.record?.work_hours_actual ?? '',
        late_minutes:      data?.record?.late_minutes      ?? 0,
        note:              data?.record?.note              || '',
    });
    const [errors, setErrors] = useState({});

    const normalizeTime = (t) => {
        if (!t) return '';
        if (!t.includes(':')) return t.length >= 2 ? `${t.padStart(2,'0')}:00` : '';
        const [h, min] = t.split(':');
        if (!h) return '';
        return `${h.padStart(2,'0')}:${(min || '00').padEnd(2,'0').substring(0,2)}`;
    };

    const set = (k, v) => {
        setForm(f => {
            const u = { ...f, [k]: v };
            if (k === 'check_in_time' || k === 'check_out_time') {
                const rawIn  = k === 'check_in_time'  ? v : f.check_in_time;
                const rawOut = k === 'check_out_time' ? v : f.check_out_time;
                const inT    = normalizeTime(rawIn);
                const outT   = normalizeTime(rawOut);
                if (inT && outT) {
                    const wh = calcWorkHours(inT, outT, LUNCH_START, LUNCH_END, WORK_START, WORK_END);
                    u.work_hours_actual = wh !== '' ? parseFloat(wh) : '';
                }
                if (k === 'check_in_time' && inT) {
                    u.late_minutes = calcLateMinutes(inT, WORK_START, LUNCH_END);
                }
            }
            return u;
        });
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    const fmt12 = (t) => {
        if (!t) return t;
        const [h, m] = t.split(':').map(Number);
        return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    function validate() {
        const e = {};
        if (!form.user_id)        e.user_id        = 'Employee is required';
        if (!form.date)           e.date           = 'Date is required';
        if (!form.check_in_time)  e.check_in_time  = 'Check In is required';
        if (isAmHalf && form.check_in_time && form.check_in_time < LUNCH_END)
            e.check_in_time = `AM Half Leave — check-in must be ${fmt12(LUNCH_END)} or later`;
        if (isPmHalf && form.check_in_time && form.check_in_time >= LUNCH_START)
            e.check_in_time = `PM Half Leave — check-in must be before ${fmt12(LUNCH_START)}`;
        if (!form.check_out_time) e.check_out_time = 'Check Out is required';
        if (isPmHalf && form.check_out_time && form.check_out_time > LUNCH_START)
            e.check_out_time = `PM Half Leave — check-out must be ${fmt12(LUNCH_START)} or earlier`;
        if (form.work_hours_actual === '' || form.work_hours_actual === null)
            e.work_hours_actual = 'Work Hours is required';
        if (form.late_minutes === '' || form.late_minutes === null)
            e.late_minutes = 'Late minutes is required';
        if (!form.note) e.note = 'Note is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    const empOptions = employees.map(e => ({ value: String(e.id), label: e.name }));

    // Shared input style
    const inputStyle = (hasError) => ({
        width: '100%', padding: '11px 14px', borderRadius: 12,
        border: `1.5px solid ${hasError ? '#ef4444' : t.inputBorder}`,
        background: t.input, color: t.text, fontSize: 13, fontWeight: 500,
        outline: 'none', transition: 'border-color 0.15s',
        boxSizing: 'border-box',
    });

    return (
        <div style={{
            position:'fixed', inset:0, background:t.overlay,
            display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:1000, backdropFilter:'blur(10px)',
        }}>
            <div style={{
                background: t.modalBg, border:`1px solid ${t.modalBorder}`,
                borderRadius: 24, width: 520, maxHeight:'90vh',
                overflow:'hidden', display:'flex', flexDirection:'column',
                boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            }}>
                {/* Header gradient */}
                <div style={{
                    padding: '20px 24px 18px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                    borderBottom: `1px solid ${t.modalBorder}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <div>
                        <div style={{ fontSize:16, fontWeight:900, color:t.text, letterSpacing:'-0.3px' }}>
                            {isEdit ? 'Edit Attendance' : 'Add Attendance'}
                        </div>
                        <div style={{ fontSize:11, color:t.textMute, marginTop:2, fontWeight:500 }}>
                            {isEdit ? 'Update attendance record' : 'Record employee attendance'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                        border: 'none', borderRadius: 10, width: 32, height: 32,
                        cursor: 'pointer', fontSize: 13, color: t.textMute,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}>
                        ✕
                    </button>
                </div>

                {/* Body — scrollable, scrollbar hidden */}
                <div style={{
                    padding: '20px 24px', overflowY: 'auto', flex: 1,
                    display: 'flex', flexDirection: 'column', gap: 16,
                    scrollbarWidth: 'none',        // ✅ Firefox
                    msOverflowStyle: 'none', 
                }}>
                    {/* Employee */}
                    <div>
                        <label style={{ fontSize:11, fontWeight:800, color:t.textSoft, display:'block', marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                            Employee <span style={{ color:'#ef4444' }}>*</span>
                        </label>
                        <PremiumSelect
                            value={form.user_id}
                            onChange={v => set('user_id', v)}
                            options={[{ value:'', label:'Select Employee' }, ...empOptions]}
                            placeholder="Select Employee"
                            t={t}
                            dropId="modal-emp"
                            openId={modalOpenId}
                            setOpenId={setModalOpenId}
                        />
                        {errors.user_id && <span style={{ fontSize:11, color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{errors.user_id}</span>}
                    </div>

                    {/* Date */}
                    <div>
                        <label style={{ fontSize:11, fontWeight:800, color:t.textSoft, display:'block', marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                            Date <span style={{ color:'#ef4444' }}>*</span>
                        </label>
                        <input
                            style={{
                                ...inputStyle(!!errors.date),
                                background: isEdit ? (dark ? 'rgba(255,255,255,0.03)' : '#f3f4f6') : t.input,
                                cursor: isEdit ? 'not-allowed' : 'default',
                                color: isEdit ? t.textMute : t.text,
                            }}
                            type="date" value={form.date}
                            onChange={e => !isEdit && set('date', e.target.value)}
                            readOnly={isEdit}
                            onFocus={e => { if (!isEdit) e.target.style.borderColor = t.inputFocus; e.target.style.boxShadow = `0 0 0 3px ${t.inputFocus}22`; }}
                            onBlur={e => { e.target.style.borderColor = errors.date ? '#ef4444' : t.inputBorder; e.target.style.boxShadow = 'none'; }}
                        />
                        {errors.date && <span style={{ fontSize:11, color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{errors.date}</span>}
                    </div>

                    {/* Check In / Out */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        <div>
                            <label style={{ fontSize:11, fontWeight:800, color:t.textSoft, display:'block', marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                                Check In <span style={{ color:'#ef4444' }}>*</span>
                            </label>
                            <TimePicker
                                value={form.check_in_time}
                                onChange={v => set('check_in_time', v)}
                                theme={t}
                                dark={dark}
                                error={!!errors.check_in_time}
                            />
                            {errors.check_in_time && <span style={{ fontSize:10, color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{errors.check_in_time}</span>}
                            {isAmHalf && !errors.check_in_time && <span style={{ fontSize:10, color:'#f59e0b', marginTop:3, display:'block' }}>⚠️ Must be {fmt12(LUNCH_END)} or later</span>}
                        </div>
                        <div>
                            <label style={{ fontSize:11, fontWeight:800, color:t.textSoft, display:'block', marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                                Check Out <span style={{ color:'#ef4444' }}>*</span>
                            </label>
                            <TimePicker
                                value={form.check_out_time}
                                onChange={v => set('check_out_time', v)}
                                theme={t}
                                dark={dark}
                                error={!!errors.check_out_time}
                            />
                            {errors.check_out_time && <span style={{ fontSize:10, color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{errors.check_out_time}</span>}
                            {isPmHalf && !errors.check_out_time && <span style={{ fontSize:10, color:'#f59e0b', marginTop:3, display:'block' }}>⚠️ Must be {fmt12(LUNCH_START)} or earlier</span>}
                        </div>
                    </div>

                    {/* Work Hours / Late */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        <div>
                            <label style={{ fontSize:11, fontWeight:800, color:t.textSoft, display:'flex', alignItems:'center', gap:6, marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                                Work Hours <span style={{ color:'#ef4444' }}>*</span>
                                <span style={{ fontSize:8, fontWeight:800, background:'rgba(59,130,246,0.15)', color:'#3b82f6', borderRadius:4, padding:'1px 6px', textTransform:'none', letterSpacing:0 }}>AUTO</span>
                            </label>
                            <div style={{
                                ...inputStyle(!!errors.work_hours_actual),
                                background: dark ? 'rgba(255,255,255,0.03)' : '#f3f4f6',
                                color: '#6366f1', fontWeight: 700, display:'flex', alignItems:'center',
                            }}>
                                {form.work_hours_actual !== '' && form.work_hours_actual !== null ? hToHM(form.work_hours_actual) : '—'}
                            </div>
                            {errors.work_hours_actual && <span style={{ fontSize:10, color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{errors.work_hours_actual}</span>}
                            <span style={{ fontSize:10, color:t.textMute, marginTop:3, display:'block' }}>Lunch: {LUNCH_START} — {LUNCH_END}</span>
                        </div>
                        <div>
                            <label style={{ fontSize:11, fontWeight:800, color:t.textSoft, display:'flex', alignItems:'center', gap:6, marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                                Late (min) <span style={{ color:'#ef4444' }}>*</span>
                                <span style={{ fontSize:8, fontWeight:800, background:'rgba(59,130,246,0.15)', color:'#3b82f6', borderRadius:4, padding:'1px 6px', textTransform:'none', letterSpacing:0 }}>AUTO</span>
                            </label>
                            <input
                                style={inputStyle(!!errors.late_minutes)}
                                type="number" value={form.late_minutes}
                                onChange={e => set('late_minutes', e.target.value)}
                                placeholder="Auto"
                                onFocus={e => { e.target.style.borderColor = t.inputFocus; e.target.style.boxShadow = `0 0 0 3px ${t.inputFocus}22`; }}
                                onBlur={e => { e.target.style.borderColor = errors.late_minutes ? '#ef4444' : t.inputBorder; e.target.style.boxShadow = 'none'; }}
                            />
                            {errors.late_minutes && <span style={{ fontSize:10, color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{errors.late_minutes}</span>}
                            <span style={{ fontSize:10, color:t.textMute, marginTop:3, display:'block' }}>Start: {WORK_START}</span>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label style={{ fontSize:11, fontWeight:800, color:t.textSoft, display:'block', marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                            Note <span style={{ color:'#ef4444' }}>*</span>
                        </label>
                        <textarea
                            style={{ ...inputStyle(!!errors.note), height:80, resize:'vertical', lineHeight:1.6 }}
                            value={form.note}
                            onChange={e => set('note', e.target.value)}
                            placeholder="Required note..."
                            onFocus={e => { e.target.style.borderColor = t.inputFocus; e.target.style.boxShadow = `0 0 0 3px ${t.inputFocus}22`; }}
                            onBlur={e => { e.target.style.borderColor = errors.note ? '#ef4444' : t.inputBorder; e.target.style.boxShadow = 'none'; }}
                        />
                        {errors.note && <span style={{ fontSize:11, color:'#ef4444', fontWeight:600, marginTop:4, display:'block' }}>{errors.note}</span>}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px 20px',
                    borderTop: `1px solid ${t.modalBorder}`,
                    display: 'flex', gap: 10, justifyContent: 'flex-end',
                    flexShrink: 0,
                    background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding:'10px 22px', borderRadius:12, fontSize:13, fontWeight:700,
                            border:`1.5px solid ${t.inputBorder}`, background:'transparent',
                            color:t.textSoft, cursor:'pointer', transition:'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = t.input}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Cancel
                    </button>
                    <button
                        onClick={() => { if (!validate()) return; onSave(form); }}
                        disabled={saving}
                        style={{
                            padding:'10px 26px', borderRadius:12, fontSize:13, fontWeight:700,
                            border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color:'#fff', cursor:saving?'not-allowed':'pointer',
                            opacity:saving?0.65:1, transition:'all 0.15s',
                            boxShadow:'0 4px 14px rgba(99,102,241,0.35)',
                        }}
                        onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.9'; }}
                        onMouseLeave={e => { if (!saving) e.currentTarget.style.opacity = '1'; }}>
                        {saving ? '⏳ Saving...' : '✅ Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}