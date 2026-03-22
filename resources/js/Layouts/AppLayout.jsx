// resources/js/Layouts/AppLayout.jsx

import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import GlobalToast from '@/Components/Toast';

const roleConfig = {
    admin:      { label: 'Administrator', color: '#7c3aed', bg: '#ede9fe', dot: '#7c3aed' },
    hr:         { label: 'HR Manager',    color: '#059669', bg: '#d1fae5', dot: '#059669' },
    management: { label: 'Management',    color: '#2563eb', bg: '#dbeafe', dot: '#2563eb' },
    employee:   { label: 'Employee',      color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
};

// All 8 features + Dashboard — route field ထည့်ထားတယ်
const menuItems = [
    {
        group: 'MAIN',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                ),
                label: 'Dashboard',
                route: '/dashboard',
                roles: ['admin','hr','management','employee'],
            },
        ]
    },
    {
        group: 'AI FEATURES',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                    </svg>
                ),
                label: 'Requirement Analysis',
                route: '/requirement-analysis',
                roles: ['admin','hr','management'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                ),
                label: 'Proposal Generator',
                route: '/proposals',
                roles: ['admin','hr','management'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                ),
                label: 'Document Translation',
                route: '/document-translation',
                roles: ['admin','hr','management','employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                ),
                label: 'Smart Mail',
                route: '/smart-mail',
                roles: ['admin','hr','management','employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                ),
                label: 'AI Chat',
                route: '/ai-chat',
                roles: ['admin','hr','management','employee'],
            },
        ]
    },
    {
        group: 'PAYROLL',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                ),
                label: 'Attendance',
                route: '/payroll/attendance',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                ),
                label: 'Leave Management',
                route: '/payroll/leaves',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                ),
                label: 'Overtime Management',
                route: '/payroll/overtimes',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                ),
                label: 'Payroll',
                route: '/payroll/records',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                ),
                label: 'Payslip',
                route: '/payroll/payslip',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                ),
                label: 'Bank Export',
                route: '/payroll/export',
                roles: ['hr'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                    </svg>
                ),
                label: 'HR Policy',
                route: '/payroll/hr-policy',
                roles: ['hr', 'admin'],
            },
        ]
    },
    {
        group: 'MANAGEMENT',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                ),
                label: 'Project Assignment',
                route: '/admin/assignments',
                roles: ['admin','management'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><circle cx="18" cy="9" r="2.5"/><path d="M18 6.5v5"/>
                    </svg>
                ),
                label: 'User & Roles',
                route: '/users',
                roles: ['admin','hr'],
            },
        ]
    }
];

function DefaultAvatar({ size = 40, color = '#9ca3af' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="16" r="7" fill={color} opacity="0.7"/>
            <ellipse cx="20" cy="34" rx="12" ry="7" fill={color} opacity="0.5"/>
        </svg>
    );
}

export default function AppLayout({ children, title = 'Dashboard' }) {
    const { auth, url } = usePage().props;
    const currentUrl = usePage().url; // current URL စစ်ဖို့
    const user = auth?.user;
    const roleName = user?.role?.name || 'employee';
    const role = roleConfig[roleName] || roleConfig.employee;
    const [collapsed, setCollapsed] = useState(false);

    const avatarUrl = user?.avatar_url ? `/storage/${user.avatar_url}` : null;

    function AvatarComp({ size = 40, borderRadius = 12 }) {
        if (avatarUrl) {
            return (
                <img src={avatarUrl} alt={user?.name}
                    style={{ width:size, height:size, borderRadius, objectFit:'cover', flexShrink:0 }} />
            );
        }
        return (
            <div style={{ width:size, height:size, borderRadius, background:role.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                <DefaultAvatar size={size * 0.85} color={role.color} />
            </div>
        );
    }

    // Current page စစ်တာ — route နဲ့ current URL တိုက်စစ်
    const isActive = (itemRoute) => {
        if (itemRoute === '/dashboard') return currentUrl === '/dashboard';
        return currentUrl.startsWith(itemRoute);
    };

    return (
        <div style={s.root}>
            <GlobalToast />
            {/* SIDEBAR */}
            <aside style={{ ...s.sidebar, width: collapsed ? 68 : 256 }}>

                {/* Logo */}
                <div style={s.logoRow}>
                    <div style={s.logoMark}>🤖</div>
                    {!collapsed && (
                        <div style={s.logoText}>
                            <span style={s.logoName}>VibeMe.AI</span>
                            <span style={s.logoSub}>BRYCEN CAMBODIA</span>
                        </div>
                    )}
                    <button style={s.toggleBtn} onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? '›' : '‹'}
                    </button>
                </div>

                {/* User Card */}
                {!collapsed ? (
                    <div style={s.userCard}>
                        <AvatarComp size={40} borderRadius={12} />
                        <div style={s.userMeta}>
                            <div style={s.uName}>{user?.name || 'Unknown'}</div>
                            <span style={{ ...s.rolePill, background:role.bg, color:role.color }}>
                                <span style={{ ...s.roleDot, background:role.dot }} />
                                {role.label}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{ display:'flex', justifyContent:'center', padding:'10px 0' }}>
                        <AvatarComp size={36} borderRadius={10} />
                    </div>
                )}

                <div style={s.hr} />

                {/* Nav */}
                <nav style={s.nav}>
                    {menuItems.map(group => (
                        <div key={group.group}>
                            {!collapsed && <div style={s.groupLbl}>{group.group}</div>}
                            {group.items
                                .filter(item => item.roles.includes(roleName))
                                .map(item => {
                                    const active = isActive(item.route);
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.route}
                                            title={collapsed ? item.label : ''}
                                            style={{
                                                ...s.navItem,
                                                background: active ? role.bg : 'transparent',
                                                justifyContent: collapsed ? 'center' : 'flex-start',
                                                padding: collapsed ? '10px 0' : '9px 16px',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <span style={{ color: active ? role.color : '#9ca3af', display:'flex', flexShrink:0 }}>
                                                {item.icon}
                                            </span>
                                            {!collapsed && (
                                                <span style={{ fontSize:13, color: active ? '#111827' : '#6b7280', fontWeight: active ? 700 : 500, flex:1, textAlign:'left' }}>
                                                    {item.label}
                                                </span>
                                            )}
                                            {active && !collapsed && (
                                                <span style={{ ...s.activeBar, background:role.color }} />
                                            )}
                                        </Link>
                                    );
                                })}
                        </div>
                    ))}
                </nav>

                {/* Sign Out */}
                <div style={s.sideFooter}>
                    <div style={s.hr} />
                    <Link
                        href="/logout" method="post" as="button"
                        style={{
                            ...s.signOutBtn,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '10px 0' : '9px 16px',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        {!collapsed && <span style={{ fontSize:13, color:'#ef4444', fontWeight:600 }}>Sign Out</span>}
                    </Link>
                </div>
            </aside>

            {/* MAIN */}
            <div style={s.main}>
                <header style={s.header}>
                    <div>
                        <div style={s.hTitle}>{title}</div>
                        <div style={s.hBread}>VibeMe.AI / {title}</div>
                    </div>
                    <div style={s.hRight}>
                        <div style={s.search}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input placeholder="Search anything..." style={s.searchInput} />
                        </div>
                        <button style={s.iconCircle}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            <span style={s.bell} />
                        </button>
                       
                    </div>
                </header>
                <main style={s.content}>{children}</main>
            </div>
        </div>
    );
}

const s = {
    root: { display:'flex', minHeight:'100vh', background:'#f8fafc', fontFamily:"'Outfit','Segoe UI',sans-serif" },
    sidebar: { background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflow:'hidden', transition:'width 0.22s ease', boxShadow:'2px 0 12px rgba(0,0,0,0.04)' },
    logoRow: { display:'flex', alignItems:'center', gap:10, padding:'18px 14px 14px' },
    logoMark: { fontSize:24, flexShrink:0 },
    logoText: { display:'flex', flexDirection:'column', flex:1 },
    logoName: { fontSize:15, fontWeight:800, color:'#111827', letterSpacing:'-0.4px' },
    logoSub:  { fontSize:9, fontWeight:700, color:'#9ca3af', letterSpacing:'1.2px' },
    toggleBtn: { marginLeft:'auto', background:'#f3f4f6', border:'none', color:'#6b7280', cursor:'pointer', width:26, height:26, borderRadius:8, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
    userCard: { display:'flex', alignItems:'center', gap:10, margin:'4px 10px 8px', padding:'10px 12px', background:'#f9fafb', borderRadius:12, border:'1px solid #e5e7eb' },
    userMeta: { flex:1, minWidth:0 },
    uName: { fontSize:13, fontWeight:700, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:4 },
    rolePill: { display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.4px' },
    roleDot: { width:5, height:5, borderRadius:'50%', flexShrink:0 },
    hr: { height:1, background:'#f3f4f6', margin:'4px 12px' },
    nav: { flex:1, overflowY:'auto', padding:'4px 0' },
    groupLbl: { fontSize:9, fontWeight:800, color:'#d1d5db', letterSpacing:'1.6px', padding:'10px 16px 3px' },
    navItem: { display:'flex', alignItems:'center', gap:10, border:'none', cursor:'pointer', transition:'background 0.12s', position:'relative', width:'100%' },
    activeBar: { position:'absolute', right:0, top:'18%', bottom:'18%', width:3, borderRadius:'3px 0 0 3px' },
    sideFooter: { paddingBottom:10 },
    signOutBtn: { width:'100%', display:'flex', alignItems:'center', gap:10, background:'transparent', border:'none', cursor:'pointer', textDecoration:'none' },
    main: { flex:1, display:'flex', flexDirection:'column', minWidth:0 },
    header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', height:62, background:'#fff', borderBottom:'1px solid #e5e7eb', position:'sticky', top:0, zIndex:10, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
    hTitle: { fontSize:16, fontWeight:800, color:'#111827', letterSpacing:'-0.3px' },
    hBread: { fontSize:11, color:'#9ca3af' },
    hRight: { display:'flex', alignItems:'center', gap:10 },
    search: { display:'flex', alignItems:'center', gap:8, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'7px 14px' },
    searchInput: { background:'transparent', border:'none', outline:'none', color:'#374151', fontSize:13, width:180 },
    iconCircle: { position:'relative', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
    bell: { position:'absolute', top:8, right:8, width:7, height:7, background:'#7c3aed', borderRadius:'50%', border:'2px solid #fff' },
    hUserChip: { display:'flex', alignItems:'center', gap:10, padding:'6px 12px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10 },
    hUName: { fontSize:13, fontWeight:700, color:'#111827' },
    hRole: { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' },
    content: { flex:1, padding:'26px 28px', background:'#f8fafc' },
};