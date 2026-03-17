// resources/js/utils/api.js

export const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.content || '';

export const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            'X-CSRF-TOKEN':     csrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers,
        },
    });
    return res;
};

export const apiPost = async (url, body = {}) => {
    return apiFetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
    });
};