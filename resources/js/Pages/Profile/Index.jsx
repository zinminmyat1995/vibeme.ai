// resources/js/Pages/Profile/Index.jsx

import { useState, useEffect, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/Contexts/LanguageContext';

// ── Theme (matches existing app pattern) ──────────────────────
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
        return () => {
            window.removeEventListener('vibeme-theme-change', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return dark;
}

function getTheme(dark) {
    if (dark) return {
        panelSolid:  '#0f1b34',
        panelSoft:   'rgba(255,255,255,0.04)',
        panelSofter: 'rgba(255,255,255,0.07)',
        border:      'rgba(148,163,184,0.13)',
        borderStrong:'rgba(148,163,184,0.25)',
        text:        '#f8fafc',
        textSoft:    '#cbd5e1',
        textMute:    '#64748b',
        shadow:      '0 20px 50px rgba(0,0,0,0.38)',
        shadowSoft:  '0 4px 16px rgba(0,0,0,0.22)',
        primary:     '#8b5cf6',
        primarySoft: 'rgba(139,92,246,0.16)',
        success:     '#10b981',
        successSoft: 'rgba(16,185,129,0.14)',
        warning:     '#fbbf24',
        warningSoft: 'rgba(251,191,36,0.14)',
        danger:      '#f87171',
        inputBg:     'rgba(255,255,255,0.06)',
        modalHeader: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
    };
    return {
        panelSolid:  '#ffffff',
        panelSoft:   '#f8fafc',
        panelSofter: '#f1f5f9',
        border:      'rgba(15,23,42,0.08)',
        borderStrong:'rgba(15,23,42,0.18)',
        text:        '#0f172a',
        textSoft:    '#475569',
        textMute:    '#94a3b8',
        shadow:      '0 20px 50px rgba(15,23,42,0.14)',
        shadowSoft:  '0 2px 8px rgba(15,23,42,0.06)',
        primary:     '#7c3aed',
        primarySoft: '#f3e8ff',
        success:     '#059669',
        successSoft: '#ecfdf5',
        warning:     '#d97706',
        warningSoft: '#fef3c7',
        danger:      '#ef4444',
        inputBg:     '#f8fafc',
        modalHeader: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
    };
}

// ── Helpers ────────────────────────────────────────────────────
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function maskPhone(phone) {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return phone;
    return phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4);
}

function maskSalary(amount, currency) {
    if (!amount && amount !== 0) return '—';
    return currency ? `${currency} ••••••` : '••••••';
}

function fmtSalary(amount, currency) {
    if (!amount && amount !== 0) return '—';
    const formatted = Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return currency ? `${currency} ${formatted}` : formatted;
}

function fmtAllowance(value, type) {
    if (type === 'percentage') return `${value}%`;
    return Number(value).toLocaleString('en-US');
}

function tenure(joinedDate, t) {
    if (!joinedDate) return null;
    const start = new Date(joinedDate);
    const now   = new Date();

    let years  = now.getFullYear() - start.getFullYear();
    let months = now.getMonth()    - start.getMonth();
    let days   = now.getDate()     - start.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    // year ထိရှိရင် → year + month + day
    if (years > 0) {
        const parts = [`${years}${t('profile.tenure.year')}`];
        if (months > 0) parts.push(`${months}${t('profile.tenure.month')}`);
        if (days   > 0) parts.push(`${days}${t('profile.tenure.day')}`);
        return parts.join(' ');
    }

    // month ထိရှိရင် → month + day
    if (months > 0) {
        const parts = [`${months}${t('profile.tenure.month')}`];
        if (days > 0) parts.push(`${days}${t('profile.tenure.day')}`);
        return parts.join(' ');
    }

    // day ထိရင် → day ပဲ
    if (days > 0) return `${days}${t('profile.tenure.day')}`;

    return t('profile.tenure.today');
}

const ROLE_COLORS = {
    admin:      { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', bgL: '#ede9fe' },
    hr:         { color: '#059669', bg: 'rgba(5,150,105,0.12)',  bgL: '#d1fae5' },
    management: { color: '#2563eb', bg: 'rgba(37,99,235,0.12)',  bgL: '#dbeafe' },
    employee:   { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  bgL: '#fef3c7' },
    driver:     { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  bgL: '#fef3c7' },
};

const EMP_TYPE_CFG = {
    probation:  { label: 'profile.employmentTypes.probation',  color: '#d97706', bg: '#fef3c7', bgD: 'rgba(217,119,6,0.16)' },
    permanent:  { label: 'profile.employmentTypes.permanent',  color: '#059669', bg: '#ecfdf5', bgD: 'rgba(5,150,105,0.16)' },
    contract:   { label: 'profile.employmentTypes.contract',   color: '#2563eb', bg: '#dbeafe', bgD: 'rgba(37,99,235,0.16)'  },
};

const COUNTRY_NAMES = {
    myanmar:  { flag: '🇲🇲', name: 'profile.countries.myanmar'  },
    vietnam:  { flag: '🇻🇳', name: 'profile.countries.vietnam'  },
    korea:    { flag: '🇰🇷', name: 'profile.countries.korea'    },
    cambodia: { flag: '🇰🇭', name: 'profile.countries.cambodia' },
    japan:    { flag: '🇯🇵', name: 'profile.countries.japan'    },
};

// ── Section Card ───────────────────────────────────────────────
function SectionCard({ title, icon, children, theme, dark }) {
    return (
        <div style={{
            background: dark ? theme.panelSolid : '#fff',
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            boxShadow: theme.shadowSoft,
            overflow: 'hidden',
        }}>
            {/* Section header */}
            <div style={{
                padding: '14px 22px',
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
                background: dark ? theme.panelSoft : theme.panelSofter,
            }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: theme.textMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {title}
                </span>
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {children}
            </div>
        </div>
    );
}

// ── Info Row ───────────────────────────────────────────────────
function InfoRow({ label, value, theme, secret, onToggle, revealed, extra, t }) {
    const chipLabel = {
        fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: theme.textMute, minWidth: 110, flexShrink: 0,
    };
    const chipValue = {
        fontSize: 13, fontWeight: 600, color: theme.text,
        lineHeight: 1.5,
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 28 }}>
            <span style={chipLabel}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                {(value !== undefined && value !== null && value !== '') && (
                    <span style={{ ...chipValue, fontFamily: secret && !revealed ? 'monospace' : 'inherit' }}>
                        {value}
                    </span>
                )}
                {extra}
                {secret && (
                    <button
                        onClick={onToggle}
                        title={revealed ? t('profile.actions.hide') : t('profile.actions.show')}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: theme.textMute, padding: '2px 4px', borderRadius: 6,
                            display: 'flex', alignItems: 'center',
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = theme.primary}
                        onMouseLeave={e => e.currentTarget.style.color = theme.textMute}
                    >
                        {revealed ? (
                            // Eye-off
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        ) : (
                            // Eye
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Divider ────────────────────────────────────────────────────
function Divider({ theme }) {
    return <div style={{ height: 1, background: theme.border, margin: '2px 0' }} />;
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, url, size = 90, theme }) {
    const [err, setErr] = useState(false);
    const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors   = ['#7c3aed', '#059669', '#2563eb', '#d97706', '#dc2626', '#0891b2'];
    const bg       = colors[(name?.charCodeAt(0) || 0) % colors.length];

    if (url && !err) {
        return (
            <img
                src={`/storage/${url}`}
                alt={name}
                onError={() => setErr(true)}
                style={{
                    width: size, height: size, borderRadius: '50%',
                    objectFit: 'cover', flexShrink: 0,
                    border: `3px solid ${theme.border}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
            />
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.36, fontWeight: 900, color: '#fff',
            flexShrink: 0,
            boxShadow: `0 4px 16px ${bg}44`,
            border: `3px solid ${theme.border}`,
            letterSpacing: '-1px',
        }}>
            {initials}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ProfileIndex({ profileUser, payrollProfile }) {
    const { t } = useTranslation();

    const dark  = useReactiveTheme();
    const theme = useMemo(() => getTheme(dark), [dark]);

    const [showPhone,  setShowPhone]  = useState(false);
    const [showSalary, setShowSalary] = useState(false);

    const roleCfg   = ROLE_COLORS[profileUser.role?.name] || ROLE_COLORS.employee;
    const empCfg    = EMP_TYPE_CFG[profileUser.employment_type] || EMP_TYPE_CFG.permanent;
    const countryCfg = COUNTRY_NAMES[profileUser.country] || { flag: '🌐', name: profileUser.country || '' };
    const tenureStr = tenure(profileUser.joined_date, t);

    return (
        <AppLayout title={t('profile.pageTitle')}>
            <Head title={t('profile.pageTitle')} />
            <style>{`
                @keyframes profFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'profFadeIn 0.3s ease' }}>

                {/* ── Hero Card ── */}
                <div style={{
                    background: dark ? theme.panelSolid : '#fff',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 22,
                    boxShadow: theme.shadowSoft,
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    {/* top accent bar */}
                    <div style={{
                        height: 4,
                        background: theme.modalHeader,
                    }} />

                    {/* background pattern */}
                    <div style={{
                        position: 'absolute', top: 0, right: 0,
                        width: 220, height: 120,
                        background: dark
                            ? 'radial-gradient(ellipse at top right, rgba(139,92,246,0.12) 0%, transparent 70%)'
                            : 'radial-gradient(ellipse at top right, rgba(124,58,237,0.07) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                        <Avatar name={profileUser.name} url={profileUser.avatar_url} size={88} theme={theme} />

                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                                <h1 style={{
                                    fontSize: 22, fontWeight: 900, color: theme.text,
                                    margin: 0, lineHeight: 1.2,
                                }}>
                                    {profileUser.name}
                                </h1>
                                {/* Role badge */}
                                <span style={{
                                    fontSize: 10, fontWeight: 800,
                                    color: roleCfg.color,
                                    background: dark ? roleCfg.bg : roleCfg.bgL,
                                    borderRadius: 99, padding: '3px 10px',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    {profileUser.role?.display_name || profileUser.role?.name || t('profile.fallback.employee')}
                                </span>
                                {/* Employment type */}
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: empCfg.color,
                                    background: dark ? empCfg.bgD : empCfg.bg,
                                    borderRadius: 99, padding: '3px 10px',
                                }}>
                                    {t(empCfg.label)}
                                </span>
                            </div>

                            {/* Position · Department */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                {profileUser.position && (
                                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.textSoft }}>
                                        {profileUser.position}
                                    </span>
                                )}
                                {profileUser.position && profileUser.department && (
                                    <span style={{ color: theme.border }}>·</span>
                                )}
                                {profileUser.department && (
                                    <span style={{ fontSize: 13, color: theme.textMute }}>
                                        {profileUser.department}
                                    </span>
                                )}
                            </div>

                            {/* Stat chips */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {profileUser.country && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: theme.textSoft,
                                        background: dark ? theme.panelSofter : theme.panelSofter,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 99, padding: '3px 10px',
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                    }}>
                                        {countryCfg.name?.startsWith?.('profile.') ? t(countryCfg.name) : countryCfg.name}
                                    </span>
                                )}
                                {tenureStr && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: theme.primary,
                                        background: dark ? theme.primarySoft : '#f3e8ff',
                                        border: `1px solid ${dark ? 'rgba(139,92,246,0.25)' : '#ddd6fe'}`,
                                        borderRadius: 99, padding: '3px 10px',
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                    }}>
                                        ⏱ {tenureStr}
                                    </span>
                                )}
                                {profileUser.is_active && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: theme.success,
                                        background: dark ? theme.successSoft : '#ecfdf5',
                                        border: `1px solid ${dark ? 'rgba(16,185,129,0.25)' : '#6ee7b7'}`,
                                        borderRadius: 99, padding: '3px 10px',
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                    }}>
                                        ● {t('profile.status.active')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Two Column Layout ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>

                    {/* ── Personal Information ── */}
                    <SectionCard title={t('profile.sections.personalInformation')} icon="👤" theme={theme} dark={dark}>
                        <InfoRow
                            label={t('profile.fields.fullName')}
                            value={profileUser.name}
                            theme={theme}
                            t={t}
                        />
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.email')}
                            value={profileUser.email}
                            theme={theme}
                            t={t}
                        />
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.phone')}
                            value={showPhone ? profileUser.phone || '—' : maskPhone(profileUser.phone)}
                            theme={theme}
                            secret={!!profileUser.phone}
                            revealed={showPhone}
                            onToggle={() => setShowPhone(v => !v)}
                            t={t}
                        />
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.dateOfBirth')}
                            value={fmtDate(profileUser.date_of_birth)}
                            theme={theme}
                            t={t}
                        />
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.country')}
                            value={profileUser.country
                                ? `${countryCfg.name?.startsWith?.('profile.') ? t(countryCfg.name) : countryCfg.name}`
                                : '—'}
                            theme={theme}
                            t={t}
                        />
                    </SectionCard>

                    {/* ── Work Information ── */}
                    <SectionCard title={t('profile.sections.workInformation')} icon="💼" theme={theme} dark={dark}>
                        <InfoRow
                            label={t('profile.fields.position')}
                            value={profileUser.position}
                            theme={theme}
                            t={t}
                        />
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.department')}
                            value={profileUser.department}
                            theme={theme}
                            t={t}
                        />
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.joinDate')}
                            value={fmtDate(profileUser.joined_date)}
                            theme={theme}
                            extra={tenureStr ? (
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: theme.primary,
                                    background: dark ? theme.primarySoft : '#f3e8ff',
                                    borderRadius: 99, padding: '1px 8px',
                                }}>
                                    {tenureStr}
                                </span>
                            ) : null}
                            t={t}
                        />
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.employment')}
                            theme={theme}
                            extra={
                                <span style={{
                                    fontSize: 11, fontWeight: 700,
                                    color: empCfg.color,
                                    background: dark ? empCfg.bgD : empCfg.bg,
                                    borderRadius: 99, padding: '2px 10px',
                                }}>
                                    {t(empCfg.label)}
                                </span>
                            }
                            t={t}
                        />
                        {profileUser.employment_type === 'contract' && profileUser.contract_end_date && (
                            <>
                                <Divider theme={theme} />
                                <InfoRow
                                    label={t('profile.fields.contractEnd')}
                                    value={fmtDate(profileUser.contract_end_date)}
                                    theme={theme}
                                    t={t}
                                />
                            </>
                        )}
                        <Divider theme={theme} />
                        <InfoRow
                            label={t('profile.fields.role')}
                            theme={theme}
                            extra={
                                <span style={{
                                    fontSize: 11, fontWeight: 700,
                                    color: roleCfg.color,
                                    background: dark ? roleCfg.bg : roleCfg.bgL,
                                    borderRadius: 99, padding: '2px 10px',
                                    textTransform: 'capitalize',
                                }}>
                                    {profileUser.role?.display_name || profileUser.role?.name || '—'}
                                </span>
                            }
                            t={t}
                        />
                    </SectionCard>

                    {/* ── Salary Information ── */}
                    {payrollProfile && (
                        <SectionCard title={t('profile.sections.salaryInformation')} icon="💰" theme={theme} dark={dark}>
                            <InfoRow
                                label={t('profile.fields.baseSalary')}
                                value={showSalary
                                    ? fmtSalary(payrollProfile.base_salary, payrollProfile.currency_code)
                                    : maskSalary(payrollProfile.base_salary, payrollProfile.currency_code)
                                }
                                theme={theme}
                                secret={true}
                                revealed={showSalary}
                                onToggle={() => setShowSalary(v => !v)}
                                t={t}
                            />
                            {payrollProfile.bank_name && (
                                <>
                                    <Divider theme={theme} />
                                    <InfoRow
                                        label={t('profile.fields.bank')}
                                        value={payrollProfile.bank_name}
                                        theme={theme}
                                        t={t}
                                    />
                                </>
                            )}
                            {payrollProfile.bank_account_holder_name && (
                                <>
                                    <Divider theme={theme} />
                                    <InfoRow
                                        label={t('profile.fields.accountName')}
                                        value={payrollProfile.bank_account_holder_name}
                                        theme={theme}
                                        t={t}
                                    />
                                </>
                            )}
                            {payrollProfile.bank_account_number && (
                                <>
                                    <Divider theme={theme} />
                                    <InfoRow
                                        label={t('profile.fields.accountNo')}
                                        value={payrollProfile.bank_account_number}
                                        theme={theme}
                                        t={t}
                                    />
                                </>
                            )}
                            {payrollProfile.bank_branch && (
                                <>
                                    <Divider theme={theme} />
                                    <InfoRow
                                        label={t('profile.fields.branch')}
                                        value={payrollProfile.bank_branch}
                                        theme={theme}
                                        t={t}
                                    />
                                </>
                            )}
                            {payrollProfile.effective_date && (
                                <>
                                    <Divider theme={theme} />
                                    <InfoRow
                                        label={t('profile.fields.effectiveDate')}
                                        value={fmtDate(payrollProfile.effective_date)}
                                        theme={theme}
                                        t={t}
                                    />
                                </>
                            )}

                            {/* Allowances */}
                            {payrollProfile.allowances?.length > 0 && (
                                <>
                                    <Divider theme={theme} />
                                    <div>
                                        <div style={{
                                            fontSize: 10, fontWeight: 700,
                                            color: theme.textMute, textTransform: 'uppercase',
                                            letterSpacing: '0.06em', marginBottom: 8,
                                        }}>
                                            {t('profile.fields.allowances')}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {payrollProfile.allowances.map(a => (
                                                <span key={a.id} style={{
                                                    fontSize: 11, fontWeight: 700,
                                                    color: theme.primary,
                                                    background: dark ? theme.primarySoft : '#f3e8ff',
                                                    border: `1px solid ${dark ? 'rgba(139,92,246,0.25)' : '#ddd6fe'}`,
                                                    borderRadius: 99, padding: '3px 10px',
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                }}>
                                                    {a.name}
                                                    {showSalary && (
                                                        <span style={{ color: theme.textMute, fontWeight: 600 }}>
                                                            · {fmtAllowance(a.value, a.type)}
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        {!showSalary && (
                                            <div style={{ fontSize: 10, color: theme.textMute, marginTop: 6 }}>
                                                {t('profile.messages.revealSalary')}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </SectionCard>
                    )}

                    {/* No payroll profile notice */}
                    {!payrollProfile && (
                        <SectionCard title={t('profile.sections.salaryInformation')} icon="💰" theme={theme} dark={dark}>
                            <div style={{
                                padding: '12px 0',
                                fontSize: 12, color: theme.textMute,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span>⚠️</span>
                                {t('profile.messages.noPayrollProfile')}
                            </div>
                        </SectionCard>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}