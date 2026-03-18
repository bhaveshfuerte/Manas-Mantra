import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Fingerprint, LogOut, Building, List } from 'lucide-react';

export default function Sidebar({ onClose }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    let user;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = null;
    }
    const permissions = user?.permissions || ['all']; // Provide default fallback to avoid blank screen
    const hasAccess = (mod) => permissions.includes('all') || permissions.includes(mod);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="sidebar-header">
                <h2>
                    <Fingerprint className="text-primary" />
                    ScannerApp
                </h2>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hasAccess('dashboard') && (
                    <Link to="/" className={`menu-item ${isActive('/') ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>
                )}

                {(hasAccess('add-company') || hasAccess('all-company')) && (
                    <>
                        <div className="menu-section">
                            <div className="flex items-center gap-2">
                                <Building size={16} /> Company Mgmt
                            </div>
                        </div>
                        <div className="sub-menu">
                            {hasAccess('add-company') && <Link to="/company/add-company" className={`sub-menu-item ${isActive('/company/add-company') ? 'active' : ''}`}>Add Company</Link>}
                            {hasAccess('all-company') && <Link to="/company/all-company" className={`sub-menu-item ${isActive('/company/all-company') ? 'active' : ''}`}>All Company</Link>}
                        </div>
                    </>
                )}

                {(hasAccess('add-user') || hasAccess('all-users')) && (
                    <>
                        <div className="menu-section">
                            <div className="flex items-center gap-2">
                                <Users size={16} /> User Mgmt
                            </div>
                        </div>
                        <div className="sub-menu">
                            {hasAccess('add-user') && <Link to="/company/add-user" className={`sub-menu-item ${isActive('/company/add-user') ? 'active' : ''}`}>Add Users</Link>}
                            {hasAccess('all-users') && <Link to="/company/all-users" className={`sub-menu-item ${isActive('/company/all-users') ? 'active' : ''}`}>All Users</Link>}
                        </div>
                    </>
                )}

                {(hasAccess('add-fingerprint') || hasAccess('all-fingerprints')) && (
                    <>
                        <div className="menu-section">
                            <div className="flex items-center gap-2">
                                <Fingerprint size={16} /> Fingerprint
                            </div>
                        </div>
                        <div className="sub-menu">
                            {hasAccess('add-fingerprint') && <Link to="/fingerprint/add" className={`sub-menu-item ${isActive('/fingerprint/add') ? 'active' : ''}`}>Add Fingerprint</Link>}
                            {hasAccess('all-fingerprints') && <Link to="/fingerprint/all" className={`sub-menu-item ${isActive('/fingerprint/all') ? 'active' : ''}`}>All Records</Link>}
                        </div>
                    </>
                )}
            </nav>

            <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button onClick={handleLogout} className="menu-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--text-secondary)' }}>
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
}
