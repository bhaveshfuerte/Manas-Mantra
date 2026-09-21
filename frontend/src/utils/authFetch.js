// Backend routes now require a signed token (see backend/server.js authenticate
// middleware). Rather than editing every fetch() call across the app to attach
// it, patch window.fetch once at startup so every existing call keeps working.
const originalFetch = window.fetch.bind(window);

window.fetch = (url, options = {}) => {
    const isProtectedApiCall = typeof url === 'string' && url.startsWith('/api/') && !url.startsWith('/api/auth/');
    if (!isProtectedApiCall) return originalFetch(url, options);

    const token = localStorage.getItem('token');
    if (!token) return originalFetch(url, options);

    return originalFetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });
};
