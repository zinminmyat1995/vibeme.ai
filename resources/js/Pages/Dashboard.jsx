// resources/js/Pages/Admin/Dashboard.jsx

import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';

const stats = [
    { label: 'Total Employees', value: '48', change: '+3 this month', icon: '👥', color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Active Projects',  value: '12', change: '2 due soon',      icon: '◈',  color: '#2563eb', bg: '#dbeafe' },
    { label: 'Pending Proposals',value: '7',  change: '3 awaiting review',icon: '◇', color: '#059669', bg: '#d1fae5' },
    { label: 'Translations Today',value: '24',change: '+8 from yesterday',icon: '◎', color: '#d97706', bg: '#fef3c7' },
];

const activity = [
    { user: 'Zin Min Myat', action: 'Generated proposal for Q2 project',  time: '2m ago',  color: '#7c3aed', bg: '#ede9fe' },
    { user: 'So Yi',        action: 'Translated document to Khmer',        time: '15m ago', color: '#059669', bg: '#d1fae5' },
    { user: 'Tanaka Kenji', action: 'Sent smart mail to team',             time: '1h ago',  color: '#2563eb', bg: '#dbeafe' },
    { user: 'Nguyen Thi',   action: 'Updated employee assignment',         time: '2h ago',  color: '#d97706', bg: '#fef3c7' },
];

const quickItems = [
    { icon: '◎', label: 'Translate Doc',  color: '#d97706', bg: '#fef3c7' },
    { icon: '✦', label: 'Smart Mail',     color: '#2563eb', bg: '#dbeafe' },
    { icon: '⬡', label: 'AI Chat',        color: '#059669', bg: '#d1fae5' },
    { icon: '◇', label: 'New Proposal',   color: '#7c3aed', bg: '#ede9fe' },
];

export default function Dashboard() {
    const { auth } = usePage().props;
    const firstName = auth?.user?.name?.split(' ')[0] || 'there';
console.log('USER:', auth?.user?.name, 'ROLE:', auth?.user?.role?.name);
    return (
        <AppLayout title="Dashboard">
            <div style={s.page}>

                {/* Welcome Banner */}
                <div style={s.banner}>
                    <div>
                        <div style={s.bannerGreet}>Good morning, {firstName} 👋</div>
                        <div style={s.bannerSub}>Here's what's happening at Brycen Cambodia today.</div>
                    </div>
                    <div style={s.aiActive}>
                        <span style={s.greenDot} />
                        AI Systems Active
                    </div>
                </div>

                {/* Stats */}
                <div style={s.statsGrid}>
                    {stats.map(stat => (
                        <div key={stat.label} style={s.statCard}>
                            <div style={{ ...s.statIcon, background: stat.bg, color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
                            <div style={s.statLbl}>{stat.label}</div>
                            <div style={{ ...s.statChange, color: stat.color }}>{stat.change}</div>
                        </div>
                    ))}
                </div>

                {/* Bottom Row */}
                <div style={s.row2}>

                    {/* Recent Activity */}
                    <div style={s.card}>
                        <div style={s.cardHead}>
                            <span style={s.cardTitle}>Recent Activity</span>
                            <span style={s.liveBadge}>● LIVE</span>
                        </div>
                        <div style={s.actList}>
                            {activity.map((a, i) => (
                                <div key={i} style={s.actRow}>
                                    <div style={{ ...s.actAva, background: a.bg, color: a.color }}>
                                        {a.user.split(' ').map(n => n[0]).join('').slice(0,2)}
                                    </div>
                                    <div style={s.actInfo}>
                                        <div style={s.actUser}>{a.user}</div>
                                        <div style={s.actAction}>{a.action}</div>
                                    </div>
                                    <div style={s.actTime}>{a.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div style={s.card}>
                        <div style={s.cardHead}>
                            <span style={s.cardTitle}>Quick Access</span>
                        </div>
                        <div style={s.quickGrid}>
                            {quickItems.map(q => (
                                <button key={q.label} style={{ ...s.quickBtn, border: `1px solid ${q.bg}` }}>
                                    <span style={{ fontSize:24, color: q.color }}>{q.icon}</span>
                                    <span style={s.quickLbl}>{q.label}</span>
                                </button>
                            ))}
                        </div>

                        <div style={s.langBox}>
                            <div style={s.langTitle}>Supported Languages</div>
                            <div style={s.langRow}>
                                {['🇬🇧 EN','🇯🇵 JP','🇲🇲 MY','🇰🇭 KH','🇻🇳 VN','🇰🇷 KR'].map(l => (
                                    <span key={l} style={s.langTag}>{l}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}

const s = {
    page: { display:'flex', flexDirection:'column', gap:20 },
    banner: {
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)',
        border:'1px solid #c4b5fd', borderRadius:16, padding:'20px 24px',
    },
    bannerGreet: { fontSize:20, fontWeight:800, color:'#111827', marginBottom:4 },
    bannerSub:   { fontSize:13, color:'#6b7280' },
    aiActive: {
        display:'flex', alignItems:'center', gap:7,
        background:'#d1fae5', border:'1px solid #a7f3d0',
        color:'#065f46', fontSize:12, fontWeight:700,
        padding:'7px 16px', borderRadius:99,
    },
    greenDot: { width:8, height:8, background:'#059669', borderRadius:'50%', display:'inline-block' },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
    statCard: {
        background:'#ffffff', border:'1px solid #e5e7eb',
        borderRadius:16, padding:'20px', display:'flex', flexDirection:'column', gap:6,
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
    },
    statIcon: { width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:4 },
    statVal:  { fontSize:30, fontWeight:900, letterSpacing:'-1px' },
    statLbl:  { fontSize:12, color:'#6b7280', fontWeight:500 },
    statChange: { fontSize:11, fontWeight:700 },
    row2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
    card: { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:16, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
    cardHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
    cardTitle: { fontSize:14, fontWeight:800, color:'#111827' },
    liveBadge: { fontSize:10, fontWeight:800, color:'#059669', letterSpacing:'0.5px' },
    actList: { display:'flex', flexDirection:'column', gap:12 },
    actRow:  { display:'flex', alignItems:'center', gap:12 },
    actAva:  { width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 },
    actInfo: { flex:1, minWidth:0 },
    actUser: { fontSize:13, fontWeight:700, color:'#111827' },
    actAction: { fontSize:11, color:'#9ca3af', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    actTime: { fontSize:10, color:'#d1d5db', flexShrink:0 },
    quickGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 },
    quickBtn: {
        display:'flex', flexDirection:'column', alignItems:'center', gap:7,
        padding:'16px 10px', background:'#f9fafb',
        borderRadius:12, cursor:'pointer', transition:'all 0.12s',
    },
    quickLbl: { fontSize:11, color:'#374151', fontWeight:600 },
    langBox: { borderTop:'1px solid #f3f4f6', paddingTop:14 },
    langTitle: { fontSize:10, fontWeight:800, color:'#9ca3af', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 },
    langRow: { display:'flex', flexWrap:'wrap', gap:6 },
    langTag: { fontSize:11, color:'#6b7280', background:'#f3f4f6', border:'1px solid #e5e7eb', padding:'3px 10px', borderRadius:99 },
};