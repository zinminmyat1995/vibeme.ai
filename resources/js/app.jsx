import './bootstrap';
import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';

// ── Axios defaults ──────────────────────────────────────────────
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken   = true;

// ── Sync CSRF meta tag from Inertia shared prop on every navigation ──
// This fixes 419 on first API call after login (session regenerate).
router.on('success', (event) => {
    const token = event.detail?.page?.props?.csrf_token;
    if (token) {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) meta.setAttribute('content', token);
        // Also update axios default header
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
});

// ── Global fetch wrapper — always reads fresh token from meta ──
window.apiFetch = async (url, options = {}) => {
    const token = document.querySelector('meta[name="csrf-token"]')?.content || '';
    return fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers: {
            'X-CSRF-TOKEN':     token,
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers,
        },
    });
};

window.apiPost = async (url, body = {}) => {
    return window.apiFetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });
};

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        window.userId = props.initialPage?.props?.userId;
        createRoot(el).render(<App {...props} />);
    },
});