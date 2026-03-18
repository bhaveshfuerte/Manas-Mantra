import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="app-layout">
            {/* Mobile Top Header */}
            <div className="mobile-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>ScannerApp</h2>
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
                <Sidebar onClose={closeSidebar} />
            </div>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
