export const uiTheme = {
    light: {
        bg: '#f4f7fb',
        panel: 'rgba(255,255,255,0.92)',
        panelSolid: '#ffffff',
        panelSoft: '#f8fafc',
        border: 'rgba(15,23,42,0.08)',
        borderStrong: 'rgba(15,23,42,0.12)',
        text: '#0f172a',
        textSoft: '#475569',
        textMute: '#94a3b8',
        shadow: '0 20px 45px rgba(15,23,42,0.08)',
        shadowSoft: '0 10px 25px rgba(15,23,42,0.06)',
        overlay: 'rgba(15, 23, 42, 0.34)',

        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primarySoft: '#f3e8ff',

        secondary: '#2563eb',
        secondaryHover: '#1d4ed8',
        secondarySoft: '#dbeafe',

        success: '#059669',
        successHover: '#047857',
        successSoft: '#d1fae5',

        warning: '#d97706',
        warningHover: '#b45309',
        warningSoft: '#fef3c7',

        danger: '#ef4444',
        dangerHover: '#dc2626',
        dangerSoft: '#fee2e2',

        inputBg: '#f8fafc',
        inputBorder: '#e5e7eb',
        inputFocus: '#7c3aed',
        tableHead: '#f8fafc',
        chipBg: '#ffffff',
        modalHeader: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)',
    },

    dark: {
        bg: '#081120',
        panel: 'rgba(11,23,48,0.88)',
        panelSolid: '#0f1b34',
        panelSoft: 'rgba(255,255,255,0.04)',
        border: 'rgba(148,163,184,0.14)',
        borderStrong: 'rgba(148,163,184,0.20)',
        text: '#f8fafc',
        textSoft: '#cbd5e1',
        textMute: '#94a3b8',
        shadow: '0 24px 55px rgba(0,0,0,0.34)',
        shadowSoft: '0 12px 28px rgba(0,0,0,0.24)',
        overlay: 'rgba(2, 8, 23, 0.58)',

        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primarySoft: 'rgba(139,92,246,0.16)',

        secondary: '#3b82f6',
        secondaryHover: '#2563eb',
        secondarySoft: 'rgba(59,130,246,0.16)',

        success: '#10b981',
        successHover: '#059669',
        successSoft: 'rgba(16,185,129,0.16)',

        warning: '#f59e0b',
        warningHover: '#d97706',
        warningSoft: 'rgba(245,158,11,0.16)',

        danger: '#f87171',
        dangerHover: '#ef4444',
        dangerSoft: 'rgba(248,113,113,0.16)',

        inputBg: 'rgba(255,255,255,0.04)',
        inputBorder: 'rgba(148,163,184,0.16)',
        inputFocus: '#8b5cf6',
        tableHead: 'rgba(255,255,255,0.03)',
        chipBg: 'rgba(255,255,255,0.04)',
        modalHeader: 'linear-gradient(135deg,#312e81 0%,#1d4ed8 100%)',
    }
};

export const getButtonStyles = (theme, variant = 'primary', disabled = false) => {
    const map = {
        primary: {
            background: disabled ? `${theme.primary}88` : theme.primary,
            color: '#fff',
            border: 'none',
            hoverBg: theme.primaryHover,
            shadow: `0 10px 24px ${theme.primary}33`,
        },
        secondary: {
            background: disabled ? `${theme.secondary}88` : theme.secondary,
            color: '#fff',
            border: 'none',
            hoverBg: theme.secondaryHover,
            shadow: `0 10px 24px ${theme.secondary}2e`,
        },
        success: {
            background: disabled ? `${theme.success}88` : theme.success,
            color: '#fff',
            border: 'none',
            hoverBg: theme.successHover,
            shadow: `0 10px 24px ${theme.success}2e`,
        },
        warning: {
            background: disabled ? `${theme.warning}88` : theme.warning,
            color: '#fff',
            border: 'none',
            hoverBg: theme.warningHover,
            shadow: `0 10px 24px ${theme.warning}2e`,
        },
        danger: {
            background: disabled ? `${theme.danger}88` : theme.danger,
            color: '#fff',
            border: 'none',
            hoverBg: theme.dangerHover,
            shadow: `0 10px 24px ${theme.danger}2e`,
        },
        ghost: {
            background: theme.panelSoft,
            color: theme.textSoft,
            border: `1px solid ${theme.border}`,
            hoverBg: theme.panel,
            shadow: 'none',
        },
        softDanger: {
            background: theme.dangerSoft,
            color: theme.danger,
            border: `1px solid ${theme.border}`,
            hoverBg: theme.dangerSoft,
            shadow: 'none',
        },
    };

    return map[variant] || map.primary;
};

export const controlStyles = (theme, hasError = false) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 14,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'all 0.18s ease',
    border: `1px solid ${hasError ? '#fca5a5' : theme.inputBorder}`,
    background: hasError
        ? (theme.bg === '#081120' ? 'rgba(127,29,29,0.12)' : '#fef2f2')
        : theme.inputBg,
    color: theme.text,
    boxShadow: 'none',
});

export const cardStyles = (theme) => ({
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: 20,
    boxShadow: theme.shadowSoft,
    backdropFilter: 'blur(14px)',
});