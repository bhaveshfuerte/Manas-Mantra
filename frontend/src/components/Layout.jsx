import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isAuthenticated = !!localStorage.getItem('token');

    let user;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        user = {};
    }

    const [companyData, setCompanyData] = useState(null);

    useEffect(() => {
        if (user && user.companyId && user.companyId !== 'all') {
            fetch(`/api/companies?companyId=${user.companyId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setCompanyData(data[0]);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user?.companyId]);

    const globalName = companyData?.name || 'Manas-Mantra';
    const globalLogo = companyData?.logoBase64 || null;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="app-layout">
            {/* Mobile Top Header */}
            <div className="mobile-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{globalName}</h2>
                <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'white' }}>
                    {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Overlay to close sidebar on mobile */}
            {isSidebarOpen && (
                <div className="mobile-overlay open" onClick={closeSidebar}></div>
            )}

            {/* Sidebar Wrapper */}
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ zIndex: 100 }} onClick={closeSidebar}>
                {/* We use onClick inside sidebar wrapper to auto-close when an item is clicked, or let the user click items.
            Actually, better to modify Sidebar but we'll leave it simple. */}
                <Sidebar onClose={closeSidebar} globalName={globalName} globalLogo={globalLogo} />
            </div>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}