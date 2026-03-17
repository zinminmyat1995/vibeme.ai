import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { usePage, router } from '@inertiajs/react';

function Toast({ message, type, onClose }) {
    if (!message) return null;
    const bg    = type === 'success' ? '#d1fae5' : '#fee2e2';
    const color = type === 'success' ? '#059669' : '#dc2626';
    return (
        <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', alignItems:'center', gap:12, background:bg, border:`1px solid ${color}`, borderRadius:12, padding:'14px 20px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', minWidth:280 }}>
            <span style={{ width:24, height:24, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>{type === 'success' ? '✓' : '✕'}</span>
            <span style={{ fontSize:13, fontWeight:600, color, flex:1 }}>{message}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color, fontSize:18, padding:0 }}>×</button>
        </div>
    );
}

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
function calcWorkHours(checkIn, checkOut, lunchBreakHours) {
    if (!checkIn || !checkOut) return '';
    const diff = (timeToMinutes(checkOut) - timeToMinutes(checkIn)) / 60 - lunchBreakHours;
    return Math.max(0, Math.round(diff * 2) / 2);
}
function calcLateMinutes(checkIn, workStart) {
    if (!checkIn || !workStart) return 0;
    return Math.max(0, timeToMinutes(checkIn) - timeToMinutes(workStart));
}
function autoStatus(checkIn, checkOut, workStart) {
    if (!checkIn || !checkOut) return 'absent';
    return calcLateMinutes(checkIn, workStart) > 0 ? 'late' : 'present';
}
function chip(bg, color) {
    return { fontSize:8, fontWeight:700, color, background:bg, borderRadius:3, padding:'1px 4px', display:'inline-block', whiteSpace:'nowrap', marginBottom:1 };
}
function tagStyle(bg, color) {
    return { fontSize:10, fontWeight:700, background:bg, color, borderRadius:6, padding:'2px 8px', display:'inline-block' };
}

export default function AttendanceIndex({
    records = [], employees = [],
    selectedMonth, selectedYear, selectedEmployee,
    countryConfig = { work_hours_per_day:8, lunch_break_minutes:60, standard_start_time:'09:00' },
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

    const [saving, setSaving]           = useState(false);
    const [month, setMonth]             = useState(selectedMonth || new Date().getMonth() + 1);
    const [year, setYear]               = useState(selectedYear  || new Date().getFullYear());
    const [empId, setEmpId]             = useState(selectedEmployee || (employees[0]?.id || ''));
    const [showModal, setShowModal]     = useState(false);
    const [selected, setSelected]       = useState(null);
    const [toast, setToast]             = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    function showToast(msg, type='success') {
        setToast({ message:msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    // ── Auto-fetch when employee changes ──
    function fetchData(newEmpId, newMonth, newYear) {
        router.get('/payroll/attendance', {
            month: newMonth,
            year: newYear,
            employee_id: newEmpId,
        }, { preserveState: false });
    }

    function handleEmpChange(e) {
        const id = e.target.value;
        setEmpId(id);
        fetchData(id, month, year);
    }

    function handleMonthChange(e) {
        const m = Number(e.target.value);
        setMonth(m);
        fetchData(empId, m, year);
    }

    function handleYearChange(e) {
        const y = Number(e.target.value);
        setYear(y);
        fetchData(empId, month, y);
    }

    function handlePrevMonth() {
        let m = month, y = year;
        if (m === 1) { m = 12; y--; } else { m--; }
        setMonth(m); setYear(y);
        fetchData(empId, m, y);
    }

    function handleNextMonth() {
        let m = month, y = year;
        if (m === 12) { m = 1; y++; } else { m++; }
        setMonth(m); setYear(y);
        fetchData(empId, m, y);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay    = new Date(year, month - 1, 1).getDay();
    const stdHours    = countryConfig?.work_hours_per_day || 8;
    const workStart   = countryConfig?.standard_start_time || '09:00';
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

    // ── Monthly summary ──
    const monthlySummary = useMemo(() => {
        let workingDays = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const { isWeekend, isHoliday, isFuture } = getDayData(d);
            // Count only past + today working days for absent calculation
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
        const status = autoStatus(formData.check_in_time, formData.check_out_time, workStart);
        router.post('/payroll/attendance', { ...formData, status }, {
            onSuccess: () => { setShowModal(false); setSaving(false); showToast('Attendance saved!'); },
            onError:   (errs) => { setSaving(false); showToast(Object.values(errs)[0] || 'Error', 'error'); },
        });
    }

    return (
        <AppLayout title="Attendance">
            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
            <div style={s.wrap}>

                {/* ── Filter Row ── */}
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

                {selectedEmp && (
                    <div style={s.empCard}>
                        {/* Avatar */}
                        {selectedEmp.avatar_url ? (
                            <img
                                src={`/storage/${selectedEmp.avatar_url}`}
                                alt={selectedEmp.name}
                                style={{ width:56, height:56, borderRadius:14, objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }}
                            />
                        ) : (
                            <div style={{ ...s.empAvatar, width:56, height:56, borderRadius:14, fontSize:22 }}>
                                {selectedEmp.name?.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>

                            {/* Row 1: Name + Role */}
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                                <span style={{ fontSize:16, fontWeight:800, color:'#111827', letterSpacing:'-0.3px' }}>
                                    {selectedEmp.name}
                                </span>
                                {selectedEmp.role?.name && (
                                    <span style={{
                                        fontSize:11, fontWeight:700,
                                        color: selectedEmp.role.name === 'hr'         ? '#059669' :
                                            selectedEmp.role.name === 'admin'      ? '#7c3aed' :
                                            selectedEmp.role.name === 'management' ? '#2563eb' : '#6b7280',
                                        textTransform:'uppercase',
                                        letterSpacing:'0.6px',
                                    }}>
                                        {selectedEmp.role.name}
                                    </span>
                                )}
                            </div>

                            {/* Row 2: Position · Department · Period */}
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, flexWrap:'wrap' }}>
                                {selectedEmp.position && (
                                    <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>
                                        {selectedEmp.position}
                                    </span>
                                )}
                                {selectedEmp.position && selectedEmp.department && (
                                    <span style={{ color:'#d1d5db', fontSize:12 }}>·</span>
                                )}
                                {selectedEmp.department && (
                                    <span style={{ fontSize:12, fontWeight:500, color:'#6366f1' }}>
                                        {selectedEmp.department}
                                    </span>
                                )}
                                {(selectedEmp.position || selectedEmp.department) && (
                                    <span style={{ color:'#d1d5db', fontSize:12 }}>·</span>
                                )}
                                <span style={{ fontSize:12, color:'#9ca3af' }}>
                                    {MONTHS[month-1]} {year}
                                </span>
                                <span style={{ color:'#d1d5db', fontSize:12 }}>·</span>
                                <span style={{ fontSize:12, color:'#9ca3af' }}>
                                    {monthlySummary.workingDays} working days
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Calendar + Detail ── */}
                <div style={s.calWrapper}>
                    <div style={s.calCard}>
                        {/* Nav */}
                        <div style={s.calHeader}>
                            <button style={s.navBtn} onClick={handlePrevMonth}>‹</button>
                            <div style={s.calTitle}>{MONTHS[month-1]} {year}</div>
                            <button style={s.navBtn} onClick={handleNextMonth}>›</button>
                        </div>

                        <div style={s.calGrid}>
                            {DAYS.map((d,i) => (
                                <div key={d} style={{ ...s.dayHeader, color:(i===0||i===6)?'#dc2626':'#9ca3af' }}>{d}</div>
                            ))}
                            {Array.from({ length: firstDay }).map((_,i) => <div key={`e-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_,i) => {
                                const day = i + 1;
                                const { dateStr, record, isWeekend, isHoliday, holidayName, otRecord, leaveInfo, isFuture } = getDayData(day);
                                const isToday    = dateStr === today;
                                const isSelected = selectedDay?.dateStr === dateStr;
                                const isRed      = isWeekend || isHoliday;

                                // Absent = past working day with no record & no leave
                                const isAbsent = !isWeekend && !isHoliday && !isFuture && !record && !leaveInfo;

                                return (
                                    <div key={day} onClick={() => handleDayClick(day)} style={{
                                        ...s.dayCell,
                                        background: isRed ? '#fff5f5' : '#fff',
                                        border: isSelected
                                            ? '2px solid #7c3aed'
                                            : isToday
                                                ? '2px solid #a78bfa'
                                                : '1px solid #f0f0f0',
                                    }}>
                                        <div style={{
                                            fontSize:11, fontWeight: isToday ? 800 : 500,
                                            color: isRed ? '#dc2626' : isToday ? '#7c3aed' : '#374151',
                                            alignSelf:'flex-start',
                                        }}>{day}</div>

                                        {/* Holiday name */}
                                        {isHoliday && holidayName && (
                                            <div style={s.holidayName}>{holidayName}</div>
                                        )}

                                        {/* Absent indicator */}
                                        {isAbsent && (
                                            <div style={chip('#fee2e2','#dc2626')}>Absent</div>
                                        )}

                                        {/* Leave */}
                                        {leaveInfo && !isHoliday && (
                                            <div style={{
                                                fontSize:8, fontWeight:800,
                                                borderRadius:3, padding:'2px 4px',
                                                display:'inline-block', whiteSpace:'nowrap',
                                                marginBottom:1,
                                                ...(leaveInfo.is_half
                                                    ? leaveInfo.day_type === 'half_day_am'
                                                        ? { background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a' }
                                                        : { background:'#ede9fe', color:'#7c3aed', border:'1px solid #ddd6fe' }
                                                    : { background:'#fee2e2', color:'#dc2626', border:'1px solid #fecaca' }
                                                ),
                                            }}>
                                                {leaveInfo.is_half
                                                    ? leaveInfo.day_type === 'half_day_am'
                                                        ? 'AM Half'
                                                        : 'PM Half'
                                                    : 'Full Leave'
                                                }
                                            </div>
                                        )}

                                        {/* Work record */}
                                        {record && !isHoliday && !leaveInfo && (
                                            <>
                                                {record.work_hours_actual && (
                                                    <div style={chip('#eef2ff','#4f46e5')}>
                                                        WH: {record.work_hours_actual}h
                                                    </div>
                                                )}
                                                {record.late_minutes > 0 && (
                                                    <div style={chip('#fef3c7','#d97706')}>
                                                        Late: {record.late_minutes}m
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* OT */}
                                        {otRecord && (
                                            <div style={chip('#fdf4ff','#7c3aed')}>
                                                OT: {otRecord.hours_approved}h
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={s.legend}>
                            {[
                                { color:'#4f46e5', label:'Work Hours' },
                                { color:'#d97706', label:'Late' },
                                { color:'#7c3aed', label:'OT Approved' },
                                { color:'#059669', label:'Leave' },
                                { color:'#dc2626', label:'Absent/Weekend/Holiday' },
                            ].map(item => (
                                <div key={item.label} style={s.legendItem}>
                                    <span style={{ ...s.legendDot, background:item.color }} />
                                    <span style={s.legendLbl}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    {selectedDay ? (
                        <div style={s.detailPanel}>
                            <div style={s.detailHeader}>
                                <div style={s.detailDate}>
                                    {new Date(selectedDay.dateStr+'T00:00:00').toLocaleDateString('en-US',{
                                        weekday:'long', year:'numeric', month:'long', day:'numeric'
                                    })}
                                </div>
                                <button style={s.detailClose} onClick={() => setSelectedDay(null)}>✕</button>
                            </div>

                            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                                {selectedDay.isHoliday && (
                                    <span style={tagStyle('#fee2e2','#dc2626')}>{selectedDay.holidayName || 'Public Holiday'}</span>
                                )}
                                {selectedDay.isWeekend && (
                                    <span style={tagStyle('#fee2e2','#f87171')}>Weekend</span>
                                )}
                                {selectedDay.leaveInfo && (
                                    <span style={tagStyle('#d1fae5','#059669')}>
                                        {selectedDay.leaveInfo.is_half ? 'Half Leave' : 'Full Leave'} — {LEAVE_LABELS[selectedDay.leaveInfo.type] || selectedDay.leaveInfo.type}
                                    </span>
                                )}
                                {selectedDay.otRecord && (
                                    <span style={tagStyle('#fdf4ff','#7c3aed')}>
                                        OT: {selectedDay.otRecord.hours_approved}h Approved
                                    </span>
                                )}
                            </div>

                            {selectedDay.record ? (
                                <div style={{ display:'flex', flexDirection:'column' }}>
                                    <DR label="Employee"  val={selectedDay.record.user?.name || '—'} />
                                    <DR label="Status">
                                        <StatusPill status={selectedDay.record.status} />
                                    </DR>
                                    <DR label="Check In"  val={selectedDay.record.check_in_time  || '—'} />
                                    <DR label="Check Out" val={selectedDay.record.check_out_time || '—'} />
                                    <DR label="Work Hours">
                                        <span style={{ color:'#4f46e5', fontWeight:700, fontSize:13 }}>
                                            {selectedDay.record.work_hours_actual ? `${selectedDay.record.work_hours_actual} hrs` : '—'}
                                        </span>
                                    </DR>
                                    {selectedDay.record.late_minutes > 0 && (
                                        <DR label="Late">
                                            <span style={{ color:'#d97706', fontWeight:700, fontSize:13 }}>
                                                {selectedDay.record.late_minutes} min
                                            </span>
                                        </DR>
                                    )}
                                    {selectedDay.otRecord && (
                                        <DR label="OT Hours">
                                            <span style={{ color:'#7c3aed', fontWeight:700, fontSize:13 }}>
                                                {selectedDay.otRecord.hours_approved} hrs
                                            </span>
                                        </DR>
                                    )}
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
                                    {canManage && (
                                        <button style={{ ...s.btnPrimary, marginTop:10, justifyContent:'center', width:'100%' }}
                                            onClick={() => { setSelected(selectedDay); setShowModal(true); }}>
                                            ✏️ Edit
                                        </button>
                                    )}
                                </div>
                            ) : (
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
                            )}
                        </div>
                    ) : (
                        <div style={{ ...s.detailPanel, alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:12, minHeight:200 }}>
                            <div style={{ fontSize:24, color:'#d1d5db', marginBottom:6 }}>📅</div>
                            Click a day to view details
                        </div>
                    )}
                </div>

                {/* ── Monthly Summary ── */}
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

            {showModal && (
                <AttendanceModal
                    data={selected}
                    employees={employees}
                    saving={saving}
                    countryConfig={countryConfig}
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

function AttendanceModal({ data, employees, onClose, onSave, saving, countryConfig }) {
    const LUNCH_BREAK_HOURS = (countryConfig?.lunch_break_minutes || 60) / 60;
    const WORK_START        = countryConfig?.standard_start_time || '09:00';

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

    const set = (k, v) => {
        setForm(f => {
            const u = { ...f, [k]: v };
            if (k === 'check_in_time' || k === 'check_out_time') {
                const inT  = k === 'check_in_time'  ? v : f.check_in_time;
                const outT = k === 'check_out_time' ? v : f.check_out_time;
                u.work_hours_actual = calcWorkHours(inT, outT, LUNCH_BREAK_HOURS);
                if (k === 'check_in_time') u.late_minutes = calcLateMinutes(v, WORK_START);
            }
            return u;
        });
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    function validate() {
        const e = {};
        if (!form.user_id)        e.user_id        = 'Employee is required';
        if (!form.date)           e.date           = 'Date is required';
        if (!form.check_in_time)  e.check_in_time  = 'Check In is required';
        if (!form.check_out_time) e.check_out_time = 'Check Out is required';
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
                    <div style={m.title}>{data?.record ? 'Edit Attendance' : 'Add Attendance'}</div>
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
                        <input style={{ ...m.input, border: errors.date ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                            type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                        {errors.date && <span style={m.errMsg}>{errors.date}</span>}
                    </div>

                    <div style={m.row2}>
                        <div style={m.field}>
                            <label style={m.label}>Check In <span style={m.req}>*</span></label>
                            <input style={{ ...m.input, border: errors.check_in_time ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                type="time" value={form.check_in_time} onChange={e => set('check_in_time', e.target.value)} />
                            {errors.check_in_time && <span style={m.errMsg}>{errors.check_in_time}</span>}
                        </div>
                        <div style={m.field}>
                            <label style={m.label}>Check Out <span style={m.req}>*</span></label>
                            <input style={{ ...m.input, border: errors.check_out_time ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                type="time" value={form.check_out_time} onChange={e => set('check_out_time', e.target.value)} />
                            {errors.check_out_time && <span style={m.errMsg}>{errors.check_out_time}</span>}
                        </div>
                    </div>

                    <div style={m.row2}>
                        <div style={m.field}>
                            <label style={m.label}>Work Hours <span style={m.req}>*</span> <span style={m.autoTag}>auto</span></label>
                            <input style={{ ...m.input, border: errors.work_hours_actual ? '1.5px solid #dc2626' : '1px solid #e5e7eb' }}
                                type="number" step="0.5" value={form.work_hours_actual}
                                onChange={e => set('work_hours_actual', e.target.value)} placeholder="Auto" />
                            {errors.work_hours_actual && <span style={m.errMsg}>{errors.work_hours_actual}</span>}
                            <span style={m.hint}>Minus {countryConfig?.lunch_break_minutes||60}min lunch</span>
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
    btnFilter:     { background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#374151' },
    empCard:       { background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' },
    empAvatar:     { width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#a78bfa)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, flexShrink:0 },
    empStats:      { display:'flex', alignItems:'center', background:'#f9fafb', borderRadius:10, padding:'8px 14px' },
    empStat:       { display:'flex', flexDirection:'column', alignItems:'center', padding:'0 12px' },
    empStatLbl:    { fontSize:9, color:'#9ca3af', fontWeight:600, marginTop:2 },
    empStatDivider:{ width:1, height:28, background:'#e5e7eb' },
    calWrapper:    { display:'grid', gridTemplateColumns:'1fr 260px', gap:14 },
    calCard:       { background:'#fff', borderRadius:14, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
    calHeader:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
    calTitle:      { fontSize:14, fontWeight:800, color:'#111827' },
    navBtn:        { background:'#f3f4f6', border:'none', borderRadius:7, width:27, height:27, fontSize:15, cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' },
    calGrid:       { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 },
    dayHeader:     { textAlign:'center', fontSize:10, fontWeight:700, padding:'3px 0', letterSpacing:'0.3px' },
    dayCell:       { borderRadius:7, padding:'5px 4px', minHeight:66, display:'flex', flexDirection:'column', gap:2, cursor:'pointer', boxSizing:'border-box' },
    holidayName:   { fontSize:8, fontWeight:800, color:'#dc2626', textAlign:'center', lineHeight:1.3, wordBreak:'break-word', width:'100%', marginTop:2 },
    legend:        { display:'flex', gap:10, flexWrap:'wrap', marginTop:10, paddingTop:10, borderTop:'1px solid #f3f4f6' },
    legendItem:    { display:'flex', alignItems:'center', gap:4 },
    legendDot:     { width:6, height:6, borderRadius:'50%' },
    legendLbl:     { fontSize:10, color:'#6b7280', fontWeight:600 },
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