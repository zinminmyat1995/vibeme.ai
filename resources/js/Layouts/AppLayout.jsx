import { useMemo, useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import GlobalToast from '@/Components/Toast';
import NotificationBell from '@/Components/NotificationBell';

const roleConfig = {
    admin:      { label: 'Administrator', color: '#7c3aed', bg: '#ede9fe', dot: '#7c3aed' },
    hr:         { label: 'HR Manager',    color: '#059669', bg: '#d1fae5', dot: '#059669' },
    management: { label: 'Management',    color: '#2563eb', bg: '#dbeafe', dot: '#2563eb' },
    employee:   { label: 'Employee',      color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
};

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
                roles: ['admin', 'hr', 'management', 'employee'],
            },
        ]
    },
    {
        group: 'AI WORKSPACE',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                    </svg>
                ),
                label: 'Requirement Analysis',
                route: '/requirement-analysis',
                roles: ['admin', 'hr', 'management'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                ),
                label: 'Proposal Generator',
                route: '/proposals',
                roles: ['admin', 'hr', 'management'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                ),
                label: 'Document Translation',
                route: '/document-translation',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                ),
                label: 'Smart Mail',
                route: '/smart-mail',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                ),
                label: 'AI Chat',
                route: '/ai-chat',
                roles: ['admin', 'hr', 'management', 'employee'],
            },
        ]
    },
    {
        group: 'PEOPLE & HR',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z"/>
                        <path d="M8 6h4"/>
                        <path d="M8 10h4"/>
                        <path d="M8 14h3"/>
                        <path d="M18 9v6"/>
                        <path d="M15 12h6"/>
                    </svg>
                ),
                label: 'Recruitment',
                route: '/recruitment',
                roles: ['admin', 'hr'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                        <circle cx="18" cy="9" r="2.5"/>
                        <path d="M18 6.5v5"/>
                    </svg>
                ),
                label: 'User & Roles',
                route: '/users',
                roles: ['admin', 'hr'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                    </svg>
                ),
                label: 'HR Policy',
                route: '/payroll/hr-policy',
                roles: ['hr'],
            },
        ]
    },
    {
        group: 'WORK MANAGEMENT',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                ),
                label: 'Project Assignment',
                route: '/admin/assignments',
                roles: ['admin', 'management'],
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
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                        <line x1="17" y1="11" x2="22" y2="11"/>
                        <line x1="19.5" y1="8.5" x2="19.5" y2="13.5"/>
                    </svg>
                ),
                label: 'Employee Salary',
                route: '/payroll/employee-salary',
                roles: ['hr'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                ),
                label: 'Payroll',
                route: '/payroll/records',
                roles: ['hr'],
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                ),
                label: 'Bank Export',
                route: '/payroll/export',
                roles: ['hr'],
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
    const { auth } = usePage().props;
    const currentUrl = usePage().url;
    const user = auth?.user;
    const roleName = user?.role?.name || 'employee';
    const role = roleConfig[roleName] || roleConfig.employee;

    const [collapsed, setCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('vibeme-theme') === 'dark';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('vibeme-theme', darkMode ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
            window.dispatchEvent(new CustomEvent('vibeme-theme-change', {
                detail: { darkMode }
            }));
        }
    }, [darkMode]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !document.documentElement.getAttribute('data-theme')) {
            document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        }
    }, []);

    const avatarUrl = user?.avatar_url ? `/storage/${user.avatar_url}` : null;

    function AvatarComp({ size = 40, borderRadius = 16 }) {
        if (avatarUrl) {
            return (
                <img
                    src={avatarUrl}
                    alt={user?.name}
                    style={{
                        width: size,
                        height: size,
                        borderRadius,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.06)',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
                    }}
                />
            );
        }

        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius,
                    background: darkMode
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.20), rgba(124,58,237,0.22))'
                        : role.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.05)',
                }}
            >
                <DefaultAvatar size={size * 0.85} color={darkMode ? '#93c5fd' : role.color} />
            </div>
        );
    }

    const isActive = (itemRoute) => {
        if (itemRoute === '/dashboard') return currentUrl === '/dashboard';
        return currentUrl.startsWith(itemRoute);
    };

    const theme = useMemo(() => {
        if (darkMode) {
            return {
                rootBg: '#07111f',
                sidebarBg: 'linear-gradient(180deg, rgba(8,20,40,0.98) 0%, rgba(5,13,28,0.98) 100%)',
                sidebarBorder: 'rgba(148,163,184,0.12)',
                sidebarShadow: '0 24px 70px rgba(0,0,0,0.36)',
                headerBg: 'rgba(8, 20, 40, 0.74)',
                headerBorder: 'rgba(148,163,184,0.10)',
                cardBg: 'rgba(255,255,255,0.05)',
                cardBgSoft: 'rgba(255,255,255,0.04)',
                cardBorder: 'rgba(148,163,184,0.12)',
                textPrimary: '#f8fafc',
                textMuted: '#94a3b8',
                navText: '#cbd5e1',
                navTextActive: '#ffffff',
                navIcon: '#94a3b8',
                activeBg: 'linear-gradient(135deg, rgba(59,130,246,0.20), rgba(124,58,237,0.18))',
                contentBg: 'radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 22%), linear-gradient(180deg, #091223 0%, #0a1427 100%)',
                iconBtnBg: 'rgba(255,255,255,0.05)',
                iconBtnBorder: 'rgba(148,163,184,0.14)',
                iconBtnColor: '#e2e8f0',
                subtleGlow: '0 14px 34px rgba(37,99,235,0.18)',
                signOut: '#fca5a5',
                signOutBg: 'linear-gradient(135deg, rgba(127,29,29,0.28), rgba(190,24,93,0.10))',
                signOutBorder: 'rgba(248,113,113,0.24)',
            };
        }

        return {
            rootBg: '#eef4fb',
            sidebarBg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,249,255,0.96) 100%)',
            sidebarBorder: 'rgba(15,23,42,0.06)',
            sidebarShadow: '0 24px 70px rgba(15,23,42,0.08)',
            headerBg: 'rgba(255,255,255,0.78)',
            headerBorder: 'rgba(15,23,42,0.07)',
            cardBg: 'rgba(255,255,255,0.92)',
            cardBgSoft: '#ffffff',
            cardBorder: 'rgba(15,23,42,0.06)',
            textPrimary: '#0f172a',
            textMuted: '#94a3b8',
            navText: '#475569',
            navTextActive: '#0f172a',
            navIcon: '#94a3b8',
            activeBg: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.09))',
            contentBg: 'radial-gradient(circle at top right, rgba(124,58,237,0.07), transparent 20%), linear-gradient(180deg, #f9fbff 0%, #eef4fb 100%)',
            iconBtnBg: '#ffffff',
            iconBtnBorder: 'rgba(15,23,42,0.06)',
            iconBtnColor: '#334155',
            subtleGlow: '0 14px 34px rgba(124,58,237,0.10)',
            signOut: '#ef4444',
            signOutBg: 'linear-gradient(135deg, #fff1f2, #ffffff)',
            signOutBorder: 'rgba(239,68,68,0.14)',
        };
    }, [darkMode]);

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                background: theme.rootBg,
                fontFamily: "'Outfit','Segoe UI',sans-serif",
                color: theme.textPrimary,
            }}
        >
            <style>{`
                .vibeme-nav-scroll {
                    overflow-y: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .vibeme-nav-scroll::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                    display: none;
                }
            `}</style>

            <GlobalToast />

            <aside
                style={{
                    width: collapsed ? 92 : 300,
                    flexShrink: 0,
                    transition: 'width 0.25s ease',
                    background: theme.sidebarBg,
                    borderRight: `1px solid ${theme.sidebarBorder}`,
                    boxShadow: theme.sidebarShadow,
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    backdropFilter: 'blur(16px)',
                }}
            >
                <div style={{ padding: collapsed ? '18px 12px 10px' : '18px 16px 12px', position: 'relative' }}>
                    <div
                        style={{
                            background: theme.cardBg,
                            border: `1px solid ${theme.cardBorder}`,
                            borderRadius: 26,
                            padding: collapsed ? '14px 10px' : '18px',
                            boxShadow: theme.subtleGlow,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: darkMode
                                    ? 'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(124,58,237,0.10))'
                                    : 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.06))',
                                pointerEvents: 'none',
                            }}
                        />

                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                width: 32,
                                height: 32,
                                borderRadius: 999,
                                border: `1px solid ${theme.cardBorder}`,
                                background: theme.iconBtnBg,
                                color: theme.iconBtnColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 2,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.10)',
                            }}
                        >
                            {collapsed ? '›' : '‹'}
                        </button>

                        <div
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                alignItems: collapsed ? 'center' : 'flex-start',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                flexDirection: collapsed ? 'column' : 'row',
                                gap: collapsed ? 10 : 14,
                                minHeight: 74,
                            }}
                        >
                            <AvatarComp size={collapsed ? 50 : 60} borderRadius={18} />

                            {!collapsed && (
                                <div style={{ minWidth: 0, paddingRight: 30 }}>
                                    <div
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 900,
                                            color: theme.textPrimary,
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {user?.name || 'Unknown User'}
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 8,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 7,
                                            padding: '7px 13px',
                                            borderRadius: 999,
                                            background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                                            border: `1px solid ${theme.cardBorder}`,
                                            color: darkMode ? '#bfdbfe' : role.color,
                                            fontSize: 11,
                                            fontWeight: 900,
                                            letterSpacing: '0.7px',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 7,
                                                height: 7,
                                                borderRadius: '50%',
                                                background: role.dot,
                                            }}
                                        />
                                        {role.label}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ height: 1, background: theme.sidebarBorder, margin: collapsed ? '0 12px 8px' : '0 16px 8px' }} />

                <nav
                    className="vibeme-nav-scroll"
                    style={{
                        flex: 1,
                        padding: collapsed ? '4px 10px 12px' : '6px 12px 12px',
                    }}
                >
                    {menuItems.map(group => {
                        const visibleItems = group.items.filter(item => item.roles.includes(roleName));
                        if (!visibleItems.length) return null;

                        return (
                            <div key={group.group} style={{ marginBottom: 16 }}>
                                {!collapsed && (
                                    <div
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 900,
                                            letterSpacing: '1.8px',
                                            color: theme.textMuted,
                                            padding: '10px 12px 8px',
                                        }}
                                    >
                                        {group.group}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: 7 }}>
                                    {visibleItems.map(item => {
                                        const active = isActive(item.route);

                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.route}
                                                title={collapsed ? item.label : ''}
                                                style={{
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                                    gap: 12,
                                                    minHeight: 48,
                                                    padding: collapsed ? '0' : '0 14px',
                                                    borderRadius: 18,
                                                    textDecoration: 'none',
                                                    background: active ? theme.activeBg : 'transparent',
                                                    border: active ? `1px solid ${theme.cardBorder}` : '1px solid transparent',
                                                    boxShadow: active ? theme.subtleGlow : 'none',
                                                    transition: 'all 0.18s ease',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: active ? role.color : theme.navIcon,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {item.icon}
                                                </span>

                                                {!collapsed && (
                                                    <span
                                                        style={{
                                                            flex: 1,
                                                            fontSize: 13.5,
                                                            fontWeight: active ? 800 : 600,
                                                            color: active ? theme.navTextActive : theme.navText,
                                                        }}
                                                    >
                                                        {item.label}
                                                    </span>
                                                )}

                                                {active && (
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            left: 0,
                                                            top: 10,
                                                            bottom: 10,
                                                            width: 4,
                                                            borderRadius: '0 999px 999px 0',
                                                            background: role.color,
                                                        }}
                                                    />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div style={{ padding: collapsed ? '10px 10px 14px' : '10px 12px 14px' }}>
                    <div style={{ height: 1, background: theme.sidebarBorder, marginBottom: 10 }} />

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        style={{
                            width: '100%',
                            minHeight: collapsed ? 54 : 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 12,
                            padding: collapsed ? '0' : '0 16px',
                            borderRadius: 18,
                            border: `1px solid ${theme.signOutBorder}`,
                            background: theme.signOutBg,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            boxShadow: darkMode
                                ? '0 10px 25px rgba(127,29,29,0.18)'
                                : '0 12px 24px rgba(239,68,68,0.08)',
                        }}
                    >
                        <div
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: darkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                border: `1px solid ${theme.signOutBorder}`,
                                flexShrink: 0,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.signOut} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        </div>

                        {!collapsed && (
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 14, fontWeight: 900, color: theme.signOut }}>
                                    Sign Out
                                </div>
                                <div style={{ fontSize: 11, color: theme.textMuted }}>
                                    End current session
                                </div>
                            </div>
                        )}
                    </Link>
                </div>
            </aside>

            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    background: theme.contentBg,
                }}
            >
                <header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        height: 84,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 28px',
                        background: theme.headerBg,
                        borderBottom: `1px solid ${theme.headerBorder}`,
                        backdropFilter: 'blur(18px)',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: 900,
                                letterSpacing: '-0.5px',
                                color: theme.textPrimary,
                            }}
                        >
                            {title}
                        </div>
                        <div
                            style={{
                                marginTop: 4,
                                fontSize: 12,
                                color: theme.textMuted,
                            }}
                        >
                            VibeMe.AI / {title}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <NotificationBell userId={user?.id} theme={theme} darkMode={darkMode} />

                        <button
                            type="button"
                            onClick={() => setDarkMode(!darkMode)}
                            style={{
                                minWidth: 98,
                                height: 46,
                                padding: '0 14px',
                                borderRadius: 15,
                                border: `1px solid ${theme.iconBtnBorder}`,
                                background: theme.iconBtnBg,
                                color: theme.iconBtnColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                cursor: 'pointer',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                                fontWeight: 800,
                                fontSize: 13,
                            }}
                        >
                            {darkMode ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .28 0 .57.02.85A7 7 0 0 0 20.15 12c.28 0 .57 0 .85-.02Z" />
                                    </svg>
                                    Dark
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                                    </svg>
                                    Light
                                </>
                            )}
                        </button>
                    </div>
                </header>

                <main
                    style={{
                        flex: 1,
                        padding: 28,
                        background: 'transparent',
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}