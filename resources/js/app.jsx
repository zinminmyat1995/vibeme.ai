import './bootstrap'; 
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';

// ── Axios setup ──
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;      // ← ထည့်
axios.defaults.withXSRFToken = true;        // ← ထည့်

// ── interceptor ဖြုတ်ပြီး cookie-based CSRF သုံးမယ် ──
// axios.interceptors.request.use((config) => {
//     const token = document.querySelector('meta[name="csrf-token"]')?.content;
//     if (token) config.headers['X-CSRF-TOKEN'] = token;
//     return config;
// });

// ── Global fetch wrapper ──
window.apiFetch = async (url, options = {}) => {
    const token = document.querySelector('meta[name="csrf-token"]')?.content || '';
    return fetch(url, {
        ...options,
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