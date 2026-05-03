import { useMemo, useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import GlobalToast from '@/Components/Toast';
import NotificationBell from '@/Components/NotificationBell';
import HrChatbotWidget from '@/Components/HrChatbotWidget';

const roleConfig = {
    admin:      { label: 'Administrator', color: '#7c3aed', bg: '#ede9fe', dot: '#7c3aed' },
    hr:         { label: 'HR Manager',    color: '#059669', bg: '#d1fae5', dot: '#059669' },
    management: { label: 'Management',    color: '#2563eb', bg: '#dbeafe', dot: '#2563eb' },
    employee:   { label: 'Employee',      color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
    driver:     { label: 'Driver', color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
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
                roles: ['admin', 'hr', 'management', 'employee', 'driver'],
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
        group: 'OPERATIONS',
        items: [
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" rx="2"/>
                        <path d="M16 8h4l3 5v3h-7V8z"/>
                        <circle cx="5.5" cy="18.5" r="2.5"/>
                        <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                ),
                label: 'Trip Schedule',
                route: '/driver/schedule',
                roles: ['driver'],
            },
        ],
    },
    {
        group: 'PEOPLE & HR',
        items: [
            {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                    <line x1="9" y1="16" x2="13" y2="16"/>
                </svg>,
                label: 'Surveys',
                route: '/hr/surveys',
                roles: ['admin', 'hr'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                ),
                label: 'HR Alerts',
                route: '/hr-alerts',
                roles: ['hr'],
            },

            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                ),
                label: 'Performance Review',
                route: '/performance',
                roles: ['admin', 'hr', 'management'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z"/>
                        <path d="M8 6h4"/><path d="M8 10h4"/><path d="M8 14h3"/>
                        <path d="M18 9v6"/><path d="M15 12h6"/>
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
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <path d="M8 2v4M16 2v4M3 10h18"/>
                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
                    </svg>
                ),
                label: 'Bookings',
                route: '/bookings',
                roles: ['admin', 'hr', 'management', 'employee'],
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
                roles: ['admin', 'hr', 'management', 'employee', 'driver'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 7V3M16 7V3M4 11h16"/>
                        <rect x="3" y="5" width="18" height="16" rx="2"/>
                        <path d="M9 15l2 2 4-4"/>
                    </svg>
                ),
                label: 'Check In/Out Request',
                route: '/payroll/check-in-out-requests',
                roles: ['admin', 'hr', 'management', 'employee', 'driver'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                ),
                label: 'Leave Request',
                route: '/payroll/leaves',
                roles: ['admin', 'hr', 'management', 'employee', 'driver'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                ),
                label: 'Overtime Request',
                route: '/payroll/overtimes',
                roles: ['admin', 'hr', 'management', 'employee', 'driver'],
            },
            {
                icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                        <path d="M7 8h4M7 12h2"/>
                        <circle cx="17" cy="9" r="2"/>
                        <path d="M15 14s0-2 2-2 2 2 2 2"/>
                    </svg>
                ),
                label: 'Expense Request',
                route: '/payroll/expenses',
                roles: ['admin', 'hr', 'management', 'employee', 'driver'],
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
                roles: ['admin', 'hr', 'management', 'employee', 'driver'],
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

export default function AppLayout({ children, title = 'Dashboard',hideWidget = false  }) {
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
            window.dispatchEvent(new CustomEvent('vibeme-theme-change', { detail: { darkMode } }));
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
                <img src={avatarUrl} alt={user?.name} style={{
                    width: size, height: size, borderRadius,
                    objectFit: 'cover', flexShrink: 0,
                    border: darkMode ? '2px solid rgba(255,255,255,0.12)' : '2px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }} />
            );
        }
        return (
            <div style={{
                width: size, height: size, borderRadius,
                background: darkMode
                    ? 'linear-gradient(135deg,rgba(59,130,246,0.20),rgba(124,58,237,0.22))'
                    : role.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
                border: darkMode ? '2px solid rgba(255,255,255,0.10)' : '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            }}>
                <DefaultAvatar size={size * 0.8} color={darkMode ? '#93c5fd' : role.color} />
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
                headerBg: 'rgba(8,20,40,0.74)',
                headerBorder: 'rgba(148,163,184,0.10)',
                cardBg: 'rgba(255,255,255,0.05)',
                cardBgSoft: 'rgba(255,255,255,0.04)',
                cardBorder: 'rgba(148,163,184,0.12)',
                textPrimary: '#f8fafc',
                textMuted: '#94a3b8',
                navText: '#cbd5e1',
                navTextActive: '#ffffff',
                navIcon: '#94a3b8',
                activeBg: 'linear-gradient(135deg,rgba(59,130,246,0.20),rgba(124,58,237,0.18))',
                contentBg: 'radial-gradient(circle at top right,rgba(59,130,246,0.10),transparent 22%),linear-gradient(180deg,#091223 0%,#0a1427 100%)',
                iconBtnBg: 'rgba(255,255,255,0.05)',
                iconBtnBorder: 'rgba(148,163,184,0.14)',
                iconBtnColor: '#e2e8f0',
                subtleGlow: '0 14px 34px rgba(37,99,235,0.18)',
                signOut: '#fca5a5',
                signOutBg: 'linear-gradient(135deg,rgba(127,29,29,0.28),rgba(190,24,93,0.10))',
                signOutBorder: 'rgba(248,113,113,0.24)',
            };
        }
        return {
            rootBg: '#eef4fb',
            sidebarBg: 'linear-gradient(180deg,rgba(255,255,255,0.96) 0%,rgba(246,249,255,0.96) 100%)',
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
            activeBg: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(59,130,246,0.09))',
            contentBg: 'radial-gradient(circle at top right,rgba(124,58,237,0.07),transparent 20%),linear-gradient(180deg,#f9fbff 0%,#eef4fb 100%)',
            iconBtnBg: '#ffffff',
            iconBtnBorder: 'rgba(15,23,42,0.06)',
            iconBtnColor: '#334155',
            subtleGlow: '0 14px 34px rgba(124,58,237,0.10)',
            signOut: '#ef4444',
            signOutBg: 'linear-gradient(135deg,#fff1f2,#ffffff)',
            signOutBorder: 'rgba(239,68,68,0.14)',
        };
    }, [darkMode]);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            background: theme.rootBg,
            fontFamily: "'Outfit','Segoe UI',sans-serif",
            color: theme.textPrimary,
        }}>
            <style>{`
                .vibeme-nav-scroll { overflow-y:auto; scrollbar-width:none; -ms-overflow-style:none; }
                .vibeme-nav-scroll::-webkit-scrollbar { width:0; height:0; display:none; }
                @keyframes vbFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            <GlobalToast />

            {!hideWidget && <HrChatbotWidget user={user} darkMode={darkMode} />}

            {/* ── Sidebar ── */}
            <aside style={{
                width: collapsed ? 80 : 280,
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
            }}>

                {/* ── Profile Card ── */}
                <div style={{ padding: collapsed ? '14px 10px 10px' : '14px 14px 10px', flexShrink: 0 }}>
                    <div style={{
                        position: 'relative',
                        background: darkMode
                            ? 'linear-gradient(135deg,rgba(99,102,241,0.16) 0%,rgba(59,130,246,0.10) 100%)'
                            : 'linear-gradient(135deg,#eef2ff 0%,#e0f2fe 100%)',
                        border: `1px solid ${theme.cardBorder}`,
                        borderRadius: 18,
                        padding: collapsed ? '14px 8px' : '14px 14px',
                        overflow: 'hidden',
                    }}>
                        {/* Decorative blob */}
                        <div style={{
                            position: 'absolute', top: -16, right: -16,
                            width: 72, height: 72, borderRadius: '50%',
                            background: darkMode ? 'rgba(99,102,241,0.22)' : 'rgba(124,58,237,0.10)',
                            filter: 'blur(18px)', pointerEvents: 'none',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: -12, left: -12,
                            width: 56, height: 56, borderRadius: '50%',
                            background: darkMode ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.08)',
                            filter: 'blur(14px)', pointerEvents: 'none',
                        }} />

                        {/* Collapse toggle */}
                        <button onClick={() => setCollapsed(!collapsed)} style={{
                            position: 'absolute', top: 10, right: 10, zIndex: 2,
                            width: 24, height: 24, borderRadius: 99,
                            border: `1px solid ${theme.cardBorder}`,
                            background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
                            color: theme.textMuted,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 13, lineHeight: 1,
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                            transition: 'all 0.15s',
                        }}>
                            {collapsed ? '›' : '‹'}
                        </button>

                        {/* Avatar + Info */}
                        <div style={{
                            position: 'relative', zIndex: 1,
                            display: 'flex',
                            flexDirection: collapsed ? 'column' : 'row',
                            alignItems: 'center',
                            gap: collapsed ? 6 : 11,
                        }}>
                            {/* Avatar with online dot */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <AvatarComp size={collapsed ? 42 : 48} borderRadius={collapsed ? 13 : 15} />
                                <div style={{
                                    position: 'absolute', bottom: 1, right: 1,
                                    width: 9, height: 9, borderRadius: '50%',
                                    background: '#22c55e',
                                    border: `2px solid ${darkMode ? '#07111f' : '#eef2ff'}`,
                                    boxShadow: '0 0 0 1px #22c55e44',
                                }} />
                            </div>

                            {!collapsed && (
                                <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
                                    {/* Name */}
                                    <div style={{
                                        fontSize: 14, fontWeight: 900,
                                        color: theme.textPrimary,
                                        lineHeight: 1.25,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        letterSpacing: '-0.3px',
                                    }}>
                                        {user?.name || 'Unknown User'}
                                    </div>
                                    
                                    {/* Role badge */}
                                    <div style={{
                                        marginTop: 7,
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '4px 10px', borderRadius: 99,
                                        background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
                                        border: `1px solid ${darkMode ? role.color + '33' : role.color + '44'}`,
                                        backdropFilter: 'blur(8px)',
                                    }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: role.dot,
                                            boxShadow: `0 0 0 2px ${role.dot}33`,
                                            flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontSize: 10, fontWeight: 800,
                                            color: darkMode ? '#bfdbfe' : role.color,
                                            letterSpacing: '0.55px', textTransform: 'uppercase',
                                        }}>{role.label}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: theme.sidebarBorder, margin: collapsed ? '0 10px 6px' : '0 14px 6px', flexShrink: 0 }} />

                {/* ── Nav ── */}
                <nav className="vibeme-nav-scroll" style={{
                    flex: 1,
                    padding: collapsed ? '4px 8px 10px' : '4px 10px 10px',
                }}>
                    {menuItems.map(group => {
                        const visibleItems = group.items.filter(item => item.roles.includes(roleName));
                        if (!visibleItems.length) return null;
                        return (
                            <div key={group.group} style={{ marginBottom: 14 }}>
                                {!collapsed && (
                                    <div style={{
                                        fontSize: 10, fontWeight: 900, letterSpacing: '1.8px',
                                        color: theme.textMuted, padding: '8px 12px 6px',
                                    }}>
                                        {group.group}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gap: 5 }}>
                                    {visibleItems.map(item => {
                                        const active = isActive(item.route);
                                        return (
                                            <Link key={item.label} href={item.route}
                                                title={collapsed ? item.label : ''}
                                                style={{
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                                    gap: 12,
                                                    minHeight: 44,
                                                    padding: collapsed ? '0' : '0 13px',
                                                    borderRadius: 16,
                                                    textDecoration: 'none',
                                                    background: active ? theme.activeBg : 'transparent',
                                                    border: active ? `1px solid ${theme.cardBorder}` : '1px solid transparent',
                                                    boxShadow: active ? theme.subtleGlow : 'none',
                                                    transition: 'all 0.18s ease',
                                                    overflow: 'hidden',
                                                }}>
                                                <span style={{
                                                    width: 18, height: 18,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: active ? role.color : theme.navIcon,
                                                    flexShrink: 0,
                                                }}>
                                                    {item.icon}
                                                </span>
                                                {!collapsed && (
                                                    <span style={{
                                                        flex: 1, fontSize: 13.5,
                                                        fontWeight: active ? 800 : 600,
                                                        color: active ? theme.navTextActive : theme.navText,
                                                    }}>
                                                        {item.label}
                                                    </span>
                                                )}
                                                {active && (
                                                    <span style={{
                                                        position: 'absolute', left: 0, top: 10, bottom: 10,
                                                        width: 4, borderRadius: '0 999px 999px 0',
                                                        background: role.color,
                                                    }} />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* ── Sign Out Footer ── */}
                <div style={{ padding: collapsed ? '6px 10px 14px' : '6px 12px 14px', flexShrink: 0 }}>
                    <div style={{ height: 1, background: theme.sidebarBorder, marginBottom: 8 }} />
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        style={{
                            width: '100%',
                            minHeight: collapsed ? 48 : 54,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 11,
                            padding: collapsed ? '0' : '0 14px',
                            borderRadius: 16,
                            border: `1px solid ${theme.signOutBorder}`,
                            background: darkMode
                                ? 'linear-gradient(135deg,rgba(127,29,29,0.22),rgba(15,26,50,0.6))'
                                : 'linear-gradient(135deg,#fff5f5,#ffffff)',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                            backdropFilter: 'blur(10px)',
                            boxShadow: darkMode
                                ? '0 4px 16px rgba(127,29,29,0.18)'
                                : '0 4px 14px rgba(239,68,68,0.08)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = darkMode
                                ? '0 8px 22px rgba(127,29,29,0.30)'
                                : '0 8px 20px rgba(239,68,68,0.15)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = darkMode
                                ? '0 4px 16px rgba(127,29,29,0.18)'
                                : '0 4px 14px rgba(239,68,68,0.08)';
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: darkMode ? 'rgba(239,68,68,0.14)' : '#fee2e2',
                            border: `1px solid ${darkMode ? 'rgba(239,68,68,0.25)' : '#fca5a5'}`,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke={theme.signOut} strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        </div>

                        {!collapsed && (
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: theme.signOut, lineHeight: 1.25 }}>
                                    Sign Out
                                </div>
                                <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 2 }}>
                                    End current session
                                </div>
                            </div>
                        )}
                    </Link>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column',
                background: theme.contentBg,
            }}>
                {/* ── Header ── */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 999,
                    height: 72,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    background: theme.headerBg,
                    borderBottom: `1px solid ${theme.headerBorder}`,
                    backdropFilter: 'blur(18px)',
                }}>
                    {/* Left: Logo + divider + page title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Logo */}
                            <img
                                src="/images/main-logo.svg"
                                alt="VibeMe.AI"
                                style={{ height: 45, width: 'auto', marginTop: "10px" }}
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        {/* Divider */}
                        <div style={{
                            width: 1, height: 28,
                            background: darkMode ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.10)',
                            flexShrink: 0,
                        }} />
                        {/* Page title */}
                        <div>
                            <div style={{
                                fontSize: 19, fontWeight: 900,
                                letterSpacing: '-0.4px',
                                color: theme.textPrimary,
                                lineHeight: 1.2,
                            }}>
                                {title}
                            </div>
                            
                        </div>
                    </div>

                    {/* Right: Notification + Dark mode toggle — unchanged */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <NotificationBell userId={user?.id} theme={theme} darkMode={darkMode} />

                        <button
                            type="button"
                            onClick={() => setDarkMode(!darkMode)}
                            style={{
                                minWidth: 98, height: 42,
                                padding: '0 14px', borderRadius: 13,
                                border: `1px solid ${theme.iconBtnBorder}`,
                                background: theme.iconBtnBg,
                                color: theme.iconBtnColor,
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                                cursor: 'pointer',
                                boxShadow: '0 6px 18px rgba(0,0,0,0.07)',
                                fontWeight: 800, fontSize: 13,
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                            }}
                        >
                            {darkMode ? (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .28 0 .57.02.85A7 7 0 0 0 20.15 12c.28 0 .57 0 .85-.02Z"/>
                                    </svg>
                                    Dark
                                </>
                            ) : (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="4"/>
                                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                                    </svg>
                                    Light
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* ── Page content ── */}
                <main style={{ flex: 1, padding: 28, background: 'transparent' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}