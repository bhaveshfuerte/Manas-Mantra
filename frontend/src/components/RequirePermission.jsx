function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        return null;
    }
}

function AccessDenied() {
    return (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
            <h2>Access Denied</h2>
            <p>You don't have permission to view this page.</p>
        </div>
    );
}

// Gate a route to only the module(s) an admin actually granted the user —
// the sidebar already hides links a user can't access, but nothing stopped
// direct navigation to the same URL. Mirrors the 'all'-wildcard convention
// Sidebar.jsx uses, but fails closed (missing permissions => no access).
export default function RequirePermission({ modules, requireSuperAdmin, children }) {
    const user = getCurrentUser();
    const permissions = user?.permissions || [];
    const isSuperAdmin = user?.role === 'Super Admin' || permissions.includes('all');

    if (requireSuperAdmin) {
        return isSuperAdmin ? children : <AccessDenied />;
    }

    const required = Array.isArray(modules) ? modules : [modules];
    const allowed = isSuperAdmin || required.some(m => permissions.includes(m));
    return allowed ? children : <AccessDenied />;
}
