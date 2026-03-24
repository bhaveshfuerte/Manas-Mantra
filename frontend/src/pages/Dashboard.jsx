import React, { useState, useEffect } from 'react';

export default function Dashboard() {
    const [stats, setStats] = useState({ users: 0, companies: 0, scansToday: 0 });
    const [recentScans, setRecentScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const loggedInUser = (() => {
                try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
            })();

            try {
                let uUrl = '/api/users';
                let cUrl = '/api/companies';
                let fUrl = '/api/fingerprints';

                if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
                    const cid = loggedInUser.companyId;
                    uUrl += `?companyId=${cid}`;
                    cUrl += `?companyId=${cid}`;
                    fUrl += `?companyId=${cid}`;
                }

                const [resU, resC, resF] = await Promise.all([
                    fetch(uUrl).then(res => res.json()),
                    fetch(cUrl).then(res => res.json()),
                    fetch(fUrl).then(res => res.json())
                ]);

                const todayStr = new Date().toDateString();
                const scansTodayCount = (Array.isArray(resF) ? resF : []).filter(f => new Date(f.scannedAt).toDateString() === todayStr).length;

                setStats({
                    users: Array.isArray(resU) ? resU.length : 0,
                    companies: Array.isArray(resC) ? resC.length : 0,
                    scansToday: scansTodayCount
                });

                // Extract chronological top 5 biometric scan reports
                const sortedF = Array.isArray(resF) ? [...resF].sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt)).slice(0, 5) : [];
                setRecentScans(sortedF);

            } catch (err) {
                console.error("Dashboard Metadata Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome to ScannerApp centralized dashboard instance.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Loading live metrics...
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-4 mb-4 dashboard-grid" style={{ marginBottom: '2rem' }}>
                        <div className="content-card" style={{ flex: 1, minWidth: '200px' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Total Users</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.users}</p>
                        </div>
                        <div className="content-card" style={{ flex: 1, minWidth: '200px' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Total Companies</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.companies}</p>
                        </div>
                        <div className="content-card" style={{ flex: 1, minWidth: '200px' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Scans Today</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.scansToday}</p>
                        </div>
                    </div>

                    <div className="content-card" style={{ overflowX: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Recent Scans</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID Sequence</th>
                                    <th>Citizen Name</th>
                                    <th>Date Scanned</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentScans.length > 0 ? (
                                    recentScans.map(scan => (
                                        <tr key={scan.id}>
                                            <td data-label="ID Sequence">#{scan.id.slice(-4)}</td>
                                            <td data-label="Citizen Name"><strong>{scan.name}</strong></td>
                                            <td data-label="Date Scanned">{new Date(scan.scannedAt).toLocaleDateString()} at {new Date(scan.scannedAt).toLocaleTimeString()}</td>
                                            <td data-label="Status"><span style={{ color: 'var(--success)' }}>Captured</span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem' }}>No recent scans found for your branch.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
