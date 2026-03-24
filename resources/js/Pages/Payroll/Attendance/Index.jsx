import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage, router } from '@inertiajs/react';

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

    // Clamp to work window
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
function tagStyle(bg, color) {
    return { fontSize:10, fontWeight:700, background:bg, color, borderRadius:6, padding:'2px 8px', display:'inline-block' };
}
function to12h(t) {
    if (!t) return '—';
    const [hStr, mStr] = t.substring(0, 5).split(':');
    const h = parseInt(hStr, 10);
    const m = mStr ?? '00';
    return `${h % 12 === 0 ? 12 : h % 12}:${m}${h >= 12 ? 'PM' : 'AM'}`;
}

// 7.83h → "7h 50m", 8h → "8h", 0.5h → "30m"
function hToHM(h) {
    if (!h) return '—';
    const total = Math.round(parseFloat(h) * 60);
    const hrs   = Math.floor(total / 60);
    const mins  = total % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
}

function CellTooltip({ text, children }) {
    const [show, setShow] = useState(false);
    return (
        <span style={{ position:'relative', display:'inline-block' }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}>
            {children}
            {show && text && (
                <span style={{
                    position:'absolute',
                    bottom:'calc(100% + 6px)',
                    left:'50%',
                    transform:'translateX(-50%)',
                    background:'#1e293b',
                    color:'#f8fafc',
                    fontSize:11,
                    fontWeight:600,
                    borderRadius:8,
                    padding:'5px 10px',
                    whiteSpace:'nowrap',
                    zIndex:9999,
                    boxShadow:'0 4px 16px rgba(0,0,0,0.22)',
                    pointerEvents:'none',
                    lineHeight:1.5,
                    letterSpacing:'0.01em',
                }}>
                    {text}
                    <span style={{
                        position:'absolute',
                        top:'100%',
                        left:'50%',
                        transform:'translateX(-50%)',
                        width:0, height:0,
                        borderLeft:'5px solid transparent',
                        borderRight:'5px solid transparent',
                        borderTop:'5px solid #1e293b',
                    }}/>
                </span>
            )}
        </span>
    );
}

export default function AttendanceIndex({
    records = [], employees = [],
    selectedMonth, selectedYear, selectedEmployee,
    countryConfig = { work_hours_per_day:8, lunch_break_minutes:60, standard_start_time:'09:00', lunch_start:'12:00', lunch_end:'13:00' },
    publicHolidays = [],
    publicHolidayDetails = [],
    overtimeMap = {},
    leaveDateMap = {},
}) {
    const { auth } = usePage().props;
    const user     = auth?.user;
    const roleName = user?.role?.name || 'employee';
    const canManage  = roleName === 'hr';
    const canViewAll = ['hr','admin'].includes(roleName);

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

    // ── Auto-fetch with own ID on first load if HR/Admin ──
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
    function handleEmpChange(e)   { const id = e.target.value; setEmpId(id); fetchData(id, month, year); }
    function handleMonthChange(e) { const m = Number(e.target.value); setMonth(m); fetchData(empId, m, year); }
    function handleYearChange(e)  { const y = Number(e.target.value); setYear(y); fetchData(empId, month, y); }
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
        const halfDays     = records.filter(r => r.status === 'half_day').length;
        const leaveDays    = Object.values(leaveDateMap).length;
        const absentDays   = Math.max(0, workingDays - presentDays - leaveDays);
        const totalLateMin = records.reduce((s, r) => s + (r.late_minutes || 0), 0);
        const totalWH      = records.reduce((s, r) => s + (parseFloat(r.work_hours_actual) || 0), 0);
        return { workingDays, presentDays, absentDays, lateDays, halfDays, leaveDays, totalLateMin, totalWH };
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
                setShowModal(false);
                setSaving(false);
                // Detail panel ကို တန်းပြောင်း
                if (selectedDay) {
                    setSelectedDay(prev => ({
                        ...prev,
                        record: {
                            ...prev?.record,
                            ...formData,
                            status,
                            user: prev?.record?.user,
                        }
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
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: { message: friendly, type: 'error' }
                }));
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

    // ── Cell label row helper ──
    function CellRow({ label, value, labelColor, valueColor }) {
        return (
            <div style={{ display:'flex', alignItems:'baseline', gap:3, lineHeight:1.3 }}>
                <span style={{ fontSize:9, fontWeight:600, color: labelColor || '#9ca3af', flexShrink:0 }}>{label}</span>
                <span style={{ fontSize:9, fontWeight:700, color: valueColor || '#374151' }}>{value}</span>
            </div>
        );
    }

    return (
        <AppLayout title="Attendance">
            <div style={s.wrap}>

                {/* Filter Row */}
                <div style={s.filterRow}>
                    {canViewAll && (
                        <select style={s.select} value={empId} onChange={handleEmpChange}>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    )}
                    <select style={s.select} value={month} onChange={handleMonthChange}>
                        {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                    </select>
                    <select style={s.select} value={year} onChange={handleYearChange}>
                        {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div style={{ flex:1 }} />
                    {canManage && (
                        <button style={s.btnPrimary} onClick={() => { setSelected(null); setShowModal(true); }}>
                            + Add Attendance
                        </button>
                    )}
                </div>

                {/* Employee Card */}
                {selectedEmp && (
                    <div style={s.empCard}>
                        {selectedEmp.avatar_url ? (
                            <img src={`/storage/${selectedEmp.avatar_url}`} alt={selectedEmp.name}
                                style={{ width:56, height:56, borderRadius:14, objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }}/>
                        ) : (
                            <div style={{ ...s.empAvatar, width:56, height:56, borderRadius:14, fontSize:22 }}>
                                {selectedEmp.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                                <span style={{ fontSize:16, fontWeight:800, color:'#111827', letterSpacing:'-0.3px' }}>{selectedEmp.name}</span>
                                {selectedEmp.role?.name && (
                                    <span style={{
                                        fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px',
                                        color: selectedEmp.role.name==='hr' ? '#059669' : selectedEmp.role.name==='admin' ? '#7c3aed' : selectedEmp.role.name==='management' ? '#2563eb' : '#6b7280',
                                    }}>{selectedEmp.role.name}</span>
                                )}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, flexWrap:'wrap' }}>
                                {selectedEmp.position && <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{selectedEmp.position}</span>}
                                {selectedEmp.position && selectedEmp.department && <span style={{ color:'#d1d5db', fontSize:12 }}>·</span>}
                                {selectedEmp.department && <span style={{ fontSize:12, fontWeight:500, color:'#6366f1' }}>{selectedEmp.department}</span>}
                                {(selectedEmp.position || selectedEmp.department) && <span style={{ color:'#d1d5db', fontSize:12 }}>·</span>}
                                <span style={{ fontSize:12, color:'#9ca3af' }}>{MONTHS[month-1]} {year}</span>
                                <span style={{ color:'#d1d5db', fontSize:12 }}>·</span>
                                <span style={{ fontSize:12, color:'#9ca3af' }}>{monthlySummary.workingDays} working days</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Calendar + Detail */}
                <div style={s.calWrapper}>
                    <div style={s.calCard}>
                        {/* Nav */}
                        <div style={s.calHeader}>
                            <button style={s.navBtn} onClick={handlePrevMonth}>‹</button>
                            <div style={s.calTitle}>{MONTHS[month-1]} {year}</div>
                            <button style={s.navBtn} onClick={handleNextMonth}>›</button>
                        </div>

                        {/* Day headers */}
                        <div style={s.calGrid}>
                            {DAYS.map((d,i) => (
                                <div key={d} style={{ ...s.dayHeader, color:(i===0||i===6)?'#ef4444':'#9ca3af' }}>{d}</div>
                            ))}

                            {/* Empty cells */}
                            {Array.from({ length: firstDay }).map((_,i) => <div key={`e-${i}`} />)}

                            {/* Day cells */}
                            {Array.from({ length: daysInMonth }).map((_,i) => {
                                const day = i + 1;
                                const { dateStr, record, isWeekend, isHoliday, holidayName, otRecord, leaveInfo, isFuture } = getDayData(day);
                                const isToday    = dateStr === today;
                                const isSelected = selectedDay?.dateStr === dateStr;
                                const isRed      = isWeekend || isHoliday;
                                const isAbsent   = !isWeekend && !isHoliday && !isFuture && !record && !leaveInfo;

                                const cellBg = isSelected ? '#ede9fe'
                                    : isToday   ? '#fefce8'
                                    : isRed     ? '#fff5f5'
                                    : '#fff';

                                const cellBorder = isSelected ? '2px solid #7c3aed'
                                    : isToday   ? '2px solid #f59e0b'
                                    : '1px solid #f0f0f0';

                                return (
                                    <div key={day} onClick={() => handleDayClick(day)} style={{
                                        ...s.dayCell,
                                        background: cellBg,
                                        border: cellBorder,
                                        boxShadow: isSelected ? '0 0 0 3px rgba(124,58,237,0.1)' : isToday ? '0 0 0 2px rgba(245,158,11,0.1)' : 'none',
                                    }}>
                                        {/* Day number */}
                                        <div style={{
                                            fontSize:11, fontWeight: isToday ? 800 : 600,
                                            color: isRed ? '#ef4444' : isToday ? '#d97706' : isSelected ? '#7c3aed' : '#374151',
                                            marginBottom:2,
                                        }}>{day}</div>

                                        {/* Public holiday */}
                                        {isHoliday && holidayName && (
                                            <div style={{
                                                fontSize:10, fontWeight:800, color:'#dc2626',
                                                textAlign:'center', lineHeight:1.4,
                                                wordBreak:'break-word', width:'100%',
                                                background:'#fee2e2', borderRadius:4,
                                                padding:'2px 3px', marginTop:1,
                                            }}>{holidayName}</div>
                                        )}

                                        {/* Absent */}
                                        {isAbsent && (
                                            <div style={{ fontSize:11, color:'#ef4444', fontWeight:700, marginTop:2 }}>Absent</div>
                                        )}

                                        {/* Rows: label  :  value — table for alignment */}
                                        {(() => {
                                            const rows = [];
                                            if (record &&  record.check_in_time)
                                                rows.push({ key:'in',    label:'In',    value: to12h(record.check_in_time),   color:'#4f46e5', tip: null });
                                            if (record &&  record.check_out_time)
                                                rows.push({ key:'out',   label:'Out',   value: to12h(record.check_out_time),  color:'#4f46e5', tip: null });
                                            if (record &&  record.work_hours_actual)
                                                rows.push({ key:'wh',    label:'WH',    value: hToHM(record.work_hours_actual), color:'#059669', tip: null });
                                            if (leaveInfo && !isHoliday) {
                                                const lv = leaveInfo.is_half ? (leaveInfo.day_type==='half_day_am' ? 'AM Half' : 'PM Half') : 'Full Day';
                                                const lc = leaveInfo.is_half ? (leaveInfo.day_type==='half_day_am' ? '#d97706' : '#7c3aed') : '#dc2626';
                                                rows.push({ key:'leave', label:'Leave', value: lv, color: lc, tip: leaveInfo.reason || (LEAVE_LABELS[leaveInfo.type] || leaveInfo.type) });
                                            }
                                            if (otRecord) {
                                                const ov = parseFloat(otRecord.hours_approved) % 1 === 0
                                                    ? `${parseInt(otRecord.hours_approved)}h`
                                                    : hToHM(otRecord.hours_approved);
                                                rows.push({ key:'ot',    label:'OT',    value: ov,  color:'#7c3aed', tip: otRecord.reason || null });
                                            }
                                            if (record &&  record.late_minutes > 0)
                                                rows.push({ key:'late',  label:'Late',  value: `${record.late_minutes}m`, color:'#d97706', tip: null });
                                            if (record &&  parseFloat(record.short_hours) > 0)
                                                rows.push({ key:'short', label:'Short', value: hToHM(record.short_hours), color:'#dc2626', tip: null });
                                            if (!rows.length) return null;
                                            return (
                                                <table style={{ borderCollapse:'collapse', marginTop:3, tableLayout:'fixed', width:'100%' }}>
                                                    <tbody>
                                                        {rows.map(row => (
                                                            <tr key={row.key} style={{ cursor: row.tip ? 'pointer' : 'default', position:'relative' }}>
                                                                <td style={{ fontSize:11, fontWeight:600, color:'#9ca3af', width:28, paddingBottom:1, verticalAlign:'top', lineHeight:'17px', whiteSpace:'nowrap' }}>{row.label}</td>
                                                                <td style={{ fontSize:11, fontWeight:600, color:'#9ca3af', width:10, paddingBottom:1, verticalAlign:'top', lineHeight:'17px', textAlign:'center' }}>:</td>
                                                                <td style={{ fontSize:11, fontWeight:700, color:row.color, paddingBottom:1, verticalAlign:'top', lineHeight:'17px', position:'relative' }}>
                                                                    {row.tip ? (
                                                                        <CellTooltip text={row.tip}>
                                                                            <span>{row.value}</span>
                                                                        </CellTooltip>
                                                                    ) : row.value}
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
                        {/* Legend REMOVED */}
                    </div>

                    {/* ── Detail Panel — DO NOT MODIFY LOGIC ── */}
                    {selectedDay ? (
                        <div style={s.detailPanel}>
                        
                            <div style={s.detailHeader}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                                    <div style={s.detailDate}>
                                        {new Date(selectedDay.dateStr+'T00:00:00').toLocaleDateString('en-US',{
                                            weekday:'long', year:'numeric', month:'long', day:'numeric'
                                        })}
                                    </div>
                                    {selectedDay.isWeekend && (
                                        <span style={{
                                            fontSize: 10, fontWeight: 700,
                                            color: '#dc2626',
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: 6,
                                            padding: '2px 8px',
                                            letterSpacing: '0.3px',
                                        }}>Weekend</span>
                                    )}
                                </div>
                                <button style={s.detailClose} onClick={() => setSelectedDay(null)}>✕</button>
                            </div>

                            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                                {selectedDay.isHoliday && (
                                    <div style={{
                                        display:'inline-flex', alignItems:'center', gap:7,
                                        background:'linear-gradient(135deg,#fef2f2,#fff1f1)',
                                        border:'1px solid #fecaca',
                                        borderRadius:10, padding:'7px 12px',
                                    }}>
                                        <span style={{ fontSize:15 }}>🎌</span>
                                        <div>
                                            <div style={{ fontSize:11, fontWeight:800, color:'#dc2626', letterSpacing:'0.3px' }}>
                                                {selectedDay.holidayName || 'Public Holiday'}
                                            </div>
                                            <div style={{ fontSize:10, color:'#f87171', marginTop:1 }}>Public Holiday</div>
                                        </div>
                                    </div>
                                )}

                                {selectedDay.leaveInfo && (() => {
                                    const li = selectedDay.leaveInfo;
                                    const typeLabel = LEAVE_LABELS[li.type] || li.type;
                                    const dayLabel  = li.day_type === 'half_day_am' ? 'AM Half Day'
                                                    : li.day_type === 'half_day_pm' ? 'PM Half Day'
                                                    : 'Full Day';
                                    const colors = li.day_type === 'half_day_am'
                                        ? { bg:'#fefce8', color:'#d97706', border:'#fde047', icon:'🌤️' }
                                        : li.day_type === 'half_day_pm'
                                        ? { bg:'#f5f3ff', color:'#7c3aed', border:'#ddd6fe', icon:'🌙' }
                                        : { bg:'#fee2e2', color:'#dc2626', border:'#fca5a5', icon:'🏖️' };
                                    return (
                                        <div style={{ display:'flex', alignItems:'center', gap:8, background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:10, padding:'8px 12px' }}>
                                            <span style={{ fontSize:16 }}>{colors.icon}</span>
                                            <div>
                                                <div style={{ fontSize:12, fontWeight:800, color:colors.color }}>{dayLabel} Leave</div>
                                                <div style={{ fontSize:11, color:colors.color, opacity:0.8, marginTop:1 }}>{typeLabel}</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {selectedDay.record ? (
                                <div style={{ display:'flex', flexDirection:'column' }}>
                                    <DR label="Employee"  val={selectedDay.record.user?.name || '—'} />
                                    <DR label="Status">
                                        <StatusPill status={selectedDay.record.status} />
                                    </DR>
                                    <DR label="Check In"  val={to12h(selectedDay.record.check_in_time)  || '—'} />
                                    <DR label="Check Out" val={to12h(selectedDay.record.check_out_time) || '—'} />
                                    <DR label="Work Hours">
                                        <span style={{ color:'#4f46e5', fontWeight:700, fontSize:13 }}>
                                            {selectedDay.record.work_hours_actual ? hToHM(selectedDay.record.work_hours_actual) : '—'}
                                        </span>
                                    </DR>
                                    {parseFloat(selectedDay.record.short_hours) > 0 && (
                                        <DR label="Short Hours">
                                            <span style={{ color:'#dc2626', fontWeight:700, fontSize:13 }}>
                                                {hToHM(selectedDay.record.short_hours)} short
                                            </span>
                                        </DR>
                                    )}
                                    {selectedDay.record.late_minutes > 0 && (
                                        <DR label="Late">
                                            <span style={{ color:'#d97706', fontWeight:700, fontSize:13 }}>
                                                {selectedDay.record.late_minutes} min
                                            </span>
                                        </DR>
                                    )}
                                    {selectedDay.otRecord && (() => {
                                        const ot   = selectedDay.otRecord;
                                        const h    = parseFloat(ot.hours_approved);
                                        const hLabel = Number.isInteger(h) ? `${h}h` : `${h}h`;
                                        const segs = ot.segments || [];
                                        return (
                                            <>
                                                <DR label="OT Hours">
                                                    <span style={{ color:'#7c3aed', fontWeight:700, fontSize:13 }}>{hLabel}</span>
                                                </DR>
                                                {segs.length > 0 && (
                                                    <div style={{ paddingTop:8, marginTop:2 }}>
                                                        <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, marginBottom:8, letterSpacing:'0.04em' }}>OVERTIME DETAIL</div>
                                                        <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:6, display:'flex', flexDirection:'column', gap:8 }}>
                                                            {segs.map((seg, i) => {
                                                                const sh = parseFloat(seg.hours);
                                                                const shLabel = Number.isInteger(sh) ? `${sh}h` : `${sh}h`;
                                                                return (
                                                                    <div key={i}>
                                                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                                            <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>{seg.title}</span>
                                                                            <span style={{ fontSize:12, fontWeight:700, color:'#7c3aed' }}>{shLabel}</span>
                                                                        </div>
                                                                        <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginTop:2 }}>
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
                                        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#92400e', marginTop:6 }}>
                                            ⚠️ Exceeds {stdHours}h standard. Consider OT request.
                                        </div>
                                    )}
                                    {selectedDay.record.note && (
                                        <div style={{ paddingTop:8, borderTop:'1px solid #f3f4f6', marginTop:4 }}>
                                            <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, marginBottom:3 }}>NOTE</div>
                                            <div style={{ fontSize:12, color:'#6b7280', fontStyle:'italic', lineHeight:1.5 }}>
                                                {selectedDay.record.note}
                                            </div>
                                        </div>
                                    )}
                                    {/* ── Edit + Delete buttons 50/50 ── */}
                                    {canManage && (
                                        <div style={{ display:'flex', gap:8, marginTop:10 }}>
                                            <button
                                                style={{ flex:1, background:'#7c3aed', color:'#fff', border:'none', borderRadius:9, padding:'9px 0', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
                                                onClick={() => { setSelected(selectedDay); setShowModal(true); }}>
                                                ✏️ Edit
                                            </button>
                                            <button
                                                style={{ flex:1, background:'#fff', color:'#dc2626', border:'1.5px solid #fca5a5', borderRadius:9, padding:'9px 0', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
                                                onClick={() => setShowDeleteConfirm(true)}>
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                !selectedDay.otRecord && !selectedDay.leaveInfo && (
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'16px 0', color:'#9ca3af', fontSize:12 }}>
                                        <div style={{ fontSize:24, color:'#d1d5db' }}>—</div>
                                        {selectedDay.isWeekend || selectedDay.isHoliday
                                            ? 'No attendance required'
                                            : selectedDay.isFuture
                                                ? 'Future date'
                                                : 'Absent — No record'}
                                        {canManage && !selectedDay.isWeekend && !selectedDay.isHoliday && !selectedDay.isFuture && (
                                            <button style={{ ...s.btnPrimary, marginTop:6 }}
                                                onClick={() => { setSelected(selectedDay); setShowModal(true); }}>
                                                + Add Record
                                            </button>
                                        )}
                                    </div>
                                )
                            )}

                            {/* OT — record မရှိရင်လည်း ပြ */}
                            {!selectedDay.record && selectedDay.otRecord && (() => {
                                const ot   = selectedDay.otRecord;
                                const h    = parseFloat(ot.hours_approved);
                                const hLabel = Number.isInteger(h) ? `${h}h` : `${h}h`;
                                const segs = ot.segments || [];
                                return (
                                    <div>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f9fafb' }}>
                                            <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>Employee</span>
                                            <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{selectedEmp?.name || '—'}</span>
                                        </div>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f9fafb' }}>
                                            <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>Status</span>
                                            <span style={{ fontSize:11, fontWeight:700, background:'#fdf4ff', color:'#7c3aed', borderRadius:99, padding:'2px 10px' }}>OT Only</span>
                                        </div>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f9fafb' }}>
                                            <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>OT Hours</span>
                                            <span style={{ color:'#7c3aed', fontWeight:700, fontSize:13 }}>{hLabel}</span>
                                        </div>
                                        {segs.length > 0 && (
                                            <div style={{ paddingTop:8, marginTop:2 }}>
                                                <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, marginBottom:8, letterSpacing:'0.04em' }}>OVERTIME DETAIL</div>
                                                <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:6, display:'flex', flexDirection:'column', gap:8 }}>
                                                    {segs.map((seg, i) => {
                                                        const sh = parseFloat(seg.hours);
                                                        const shLabel = Number.isInteger(sh) ? `${sh}h` : `${sh}h`;
                                                        return (
                                                            <div key={i}>
                                                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                                    <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>{seg.title}</span>
                                                                    <span style={{ fontSize:12, color:'#7c3aed', fontWeight:700 }}>{shLabel}</span>
                                                                </div>
                                                                <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginTop:2 }}>
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
                        <div style={{ ...s.detailPanel, alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:12, minHeight:200 }}>
                            <div style={{ fontSize:24, color:'#d1d5db', marginBottom:6 }}>📅</div>
                            Click a day to view details
                        </div>
                    )}
                </div>

                {/* Monthly Summary */}
                <div style={s.summaryCard}>
                    <div style={s.summaryTitle}>📊 {MONTHS[month-1]} {year} — Monthly Summary</div>
                    <div style={s.summaryGrid}>
                        {[
                            { val: monthlySummary.workingDays,             label:'Working Days',    color:'#374151' },
                            { val: monthlySummary.presentDays,             label:'Present Days',    color:'#059669' },
                            { val: monthlySummary.absentDays,              label:'Absent Days',     color:'#dc2626' },
                            { val: monthlySummary.lateDays,                label:'Late Days',       color:'#d97706' },
                            { val: monthlySummary.halfDays,                label:'Half Days',       color:'#2563eb' },
                            { val: monthlySummary.leaveDays,               label:'Leave Days',      color:'#059669' },
                            { val: monthlySummary.totalLateMin+'m',        label:'Total Late',      color:'#f59e0b' },
                            { val: monthlySummary.totalWH.toFixed(1)+'h',  label:'Work Hours',      color:'#4f46e5' },
                            { val: publicHolidays.length,                  label:'Public Holidays', color:'#dc2626' },
                        ].map((item, i) => (
                            <div key={i} style={{ textAlign:'center' }}>
                                <div style={{ fontSize:18, fontWeight:800, color:item.color }}>{item.val}</div>
                                <div style={s.summaryLbl}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Delete Confirm Modal */}
            {showDeleteConfirm && selectedDay?.record && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
                    <div style={{ background:'#fff', borderRadius:16, width:360, padding:'28px 28px 24px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', textAlign:'center' }}>
                        <div style={{ width:52, height:52, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px' }}>🗑️</div>
                        <div style={{ fontSize:15, fontWeight:800, color:'#111827', marginBottom:6 }}>Delete Attendance?</div>
                        <div style={{ fontSize:12, color:'#6b7280', marginBottom:20, lineHeight:1.6 }}>
                            {new Date(selectedDay.dateStr+'T00:00:00').toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric' })}
                            <br/>{selectedDay.record.user?.name}
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                            <button style={{ flex:1, background:'#f3f4f6', border:'none', borderRadius:9, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#6b7280' }}
                                onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
                            <button style={{ flex:1, background:'#dc2626', border:'none', borderRadius:9, padding:'10px', fontSize:13, fontWeight:700, cursor:deleting?'not-allowed':'pointer', color:'#fff', opacity:deleting?0.6:1 }}
                                onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <AttendanceModal
                    data={selected}
                    employees={employees}
                    saving={saving}
                    countryConfig={countryConfig}
                    leaveInfo={selected?.leaveInfo || null}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </AppLayout>
    );
}

function DR({ label, val, children }) {
    return (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f9fafb' }}>
            <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>{label}</span>
            {children || <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{val}</span>}
        </div>
    );
}

function StatusPill({ status }) {
    const cfg = {
        present:  { label:'Present',  bg:'#d1fae5', color:'#059669' },
        absent:   { label:'Absent',   bg:'#fee2e2', color:'#dc2626' },
        late:     { label:'Late',     bg:'#fef3c7', color:'#d97706' },
        half_day: { label:'Half Day', bg:'#dbeafe', color:'#2563eb' },
    };
    const c = cfg[status] || cfg.present;
    return (
        <span style={{ fontSize:11, fontWeight:700, background:c.bg, color:c.color, borderRadius:99, padding:'2px 10px' }}>
            {c.label}
        </span>
    );
}

function AttendanceModal({ data, employees, onClose, onSave, saving, countryConfig, leaveInfo }) {
    const WORK_START  = countryConfig?.work_start || countryConfig?.standard_start_time || '08:00';
    const WORK_END    = countryConfig?.work_end   || '17:00';
    const LUNCH_START = countryConfig?.lunch_start || '12:00';
    const LUNCH_END   = countryConfig?.lunch_end   || '13:00';
    const isAmHalf    = leaveInfo?.day_type === 'half_day_am';
    const isPmHalf    = leaveInfo?.day_type === 'half_day_pm';
    const isEdit      = !!data?.record;

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
        // "08" → "08:00", "08:3" → "08:03", "08:30" → "08:30"
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
                                  e.late_minutes   = 'Late minutes is required';
        if (!form.note)           e.note           = 'Note is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    return (
        <div style={m.overlay}>
            <div style={m.modal}>
                <div style={m.header}>
                    <div style={m.title}>{isEdit ? 'Edit Attendance' : 'Add Attendance'}</div>
                    <button style={m.closeBtn} onClick={onClose}>✕</button>
                </div>
                <div style={m.body}>
                    <div style={m.field}>
                        <label style={m.label}>Employee <span style={m.req}>*</span></label>
                        <select style={{ ...m.input, border: errors.user_id ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                            value={form.user_id} onChange={e => set('user_id', e.target.value)}>
                            <option value="">Select Employee</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        {errors.user_id && <span style={m.errMsg}>{errors.user_id}</span>}
                    </div>

                    <div style={m.field}>
                        <label style={m.label}>Date <span style={m.req}>*</span></label>
                        <input
                            style={{ ...m.input, border: errors.date ? '1.5px solid #dc2626' : '1px solid #e5e7eb',
                                background: isEdit ? '#f3f4f6' : '#f9fafb',
                                cursor: isEdit ? 'not-allowed' : 'default' }}
                            type="date" value={form.date}
                            onChange={e => !isEdit && set('date', e.target.value)}
                            readOnly={isEdit}/>
                        {errors.date && <span style={m.errMsg}>{errors.date}</span>}
                    </div>

                    <div style={m.row2}>
                        <div style={m.field}>
                            <label style={m.label}>Check In <span style={m.req}>*</span></label>
                            <input style={{ ...m.input, border: errors.check_in_time ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                type="time"
                                min={isAmHalf ? LUNCH_END : undefined}
                                value={form.check_in_time}
                                onChange={e => set('check_in_time', e.target.value)} />
                            {errors.check_in_time && <span style={m.errMsg}>{errors.check_in_time}</span>}
                            {isAmHalf && !errors.check_in_time && <span style={{ fontSize:10, color:'#d97706' }}>⚠️ Must be {fmt12(LUNCH_END)} or later</span>}
                        </div>
                        <div style={m.field}>
                            <label style={m.label}>Check Out <span style={m.req}>*</span></label>
                            <input style={{ ...m.input, border: errors.check_out_time ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                type="time"
                                max={isPmHalf ? LUNCH_START : undefined}
                                value={form.check_out_time}
                                onChange={e => set('check_out_time', e.target.value)} />
                            {errors.check_out_time && <span style={m.errMsg}>{errors.check_out_time}</span>}
                            {isPmHalf && !errors.check_out_time && <span style={{ fontSize:10, color:'#d97706' }}>⚠️ Must be {fmt12(LUNCH_START)} or earlier</span>}
                        </div>
                    </div>

                    <div style={m.row2}>
                        <div style={m.field}>
                            <label style={m.label}>Work Hours <span style={m.req}>*</span> <span style={m.autoTag}>auto</span></label>
                            <div style={{ ...m.input, border: errors.work_hours_actual ? '1.5px solid #dc2626' : '1px solid #e5e7eb', background:'#f3f4f6', color:'#4f46e5', fontWeight:700 }}>
                                {form.work_hours_actual !== '' && form.work_hours_actual !== null ? hToHM(form.work_hours_actual) : '—'}
                            </div>
                            {errors.work_hours_actual && <span style={m.errMsg}>{errors.work_hours_actual}</span>}
                            <span style={m.hint}>Lunch: {LUNCH_START} — {LUNCH_END}</span>
                        </div>
                        <div style={m.field}>
                            <label style={m.label}>Late (min) <span style={m.req}>*</span> <span style={m.autoTag}>auto</span></label>
                            <input style={{ ...m.input, border: errors.late_minutes ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                type="number" value={form.late_minutes}
                                onChange={e => set('late_minutes', e.target.value)} placeholder="Auto" />
                            {errors.late_minutes && <span style={m.errMsg}>{errors.late_minutes}</span>}
                            <span style={m.hint}>Start: {WORK_START}</span>
                        </div>
                    </div>

                    <div style={m.field}>
                        <label style={m.label}>Note <span style={m.req}>*</span></label>
                        <textarea style={{ ...m.input, height:65, resize:'vertical', border: errors.note ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                            value={form.note} onChange={e => set('note', e.target.value)} placeholder="Required note..." />
                        {errors.note && <span style={m.errMsg}>{errors.note}</span>}
                    </div>
                </div>
                <div style={m.footer}>
                    <button style={m.btnCancel} onClick={onClose}>Cancel</button>
                    <button style={{ ...m.btnSave, opacity:saving?0.6:1, cursor:saving?'not-allowed':'pointer' }}
                        onClick={() => { if (!validate()) return; onSave(form); }} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const s = {
    wrap:          { display:'flex', flexDirection:'column', gap:16 },
    filterRow:     { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
    select:        { background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:'7px 11px', fontSize:13, color:'#374151', cursor:'pointer' },
    btnPrimary:    { background:'#7c3aed', color:'#fff', border:'none', borderRadius:9, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 },
    empCard:       { background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' },
    empAvatar:     { width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#a78bfa)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, flexShrink:0 },
    calWrapper:    { display:'grid', gridTemplateColumns:'1fr 260px', gap:14 },
    calCard:       { background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
    calHeader:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
    calTitle:      { fontSize:14, fontWeight:800, color:'#111827' },
    navBtn:        { background:'#f3f4f6', border:'none', borderRadius:7, width:27, height:27, fontSize:15, cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' },
    calGrid:       { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 },
    dayHeader:     { textAlign:'center', fontSize:10, fontWeight:700, padding:'3px 0', letterSpacing:'0.3px' },
    dayCell:       { borderRadius:8, padding:'6px 6px 5px', minHeight:92, display:'flex', flexDirection:'column', gap:1, cursor:'pointer', boxSizing:'border-box', transition:'box-shadow 0.1s' },
    detailPanel:   { background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:10 },
    detailHeader:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
    detailDate:    { fontSize:11, fontWeight:700, color:'#374151', lineHeight:1.5 },
    detailClose:   { background:'#f3f4f6', border:'none', borderRadius:6, width:22, height:22, cursor:'pointer', fontSize:10, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
    summaryCard:   { background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
    summaryTitle:  { fontSize:13, fontWeight:800, color:'#111827', marginBottom:12 },
    summaryGrid:   { display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:10 },
    summaryLbl:    { fontSize:10, color:'#9ca3af', marginTop:2, fontWeight:600 },
};

const m = {
    overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
    modal:     { background:'#fff', borderRadius:16, width:500, maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
    header:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px 14px', borderBottom:'1px solid #f3f4f6' },
    title:     { fontSize:15, fontWeight:800, color:'#111827' },
    closeBtn:  { background:'#f3f4f6', border:'none', borderRadius:7, width:27, height:27, cursor:'pointer', fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' },
    body:      { padding:'16px 22px', display:'flex', flexDirection:'column', gap:12 },
    field:     { display:'flex', flexDirection:'column', gap:4 },
    label:     { fontSize:11, fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:5 },
    req:       { color:'#dc2626', fontSize:12 },
    autoTag:   { fontSize:8, fontWeight:700, background:'#dbeafe', color:'#2563eb', borderRadius:3, padding:'1px 5px' },
    hint:      { fontSize:10, color:'#9ca3af' },
    errMsg:    { fontSize:11, color:'#dc2626', fontWeight:600 },
    input:     { background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 11px', fontSize:13, color:'#374151', outline:'none', width:'100%', boxSizing:'border-box' },
    row2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
    footer:    { display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 22px', borderTop:'1px solid #f3f4f6' },
    btnCancel: { background:'#f3f4f6', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#6b7280' },
    btnSave:   { background:'#7c3aed', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer', color:'#fff' },
};