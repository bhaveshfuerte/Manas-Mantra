import React, { useState, useEffect } from 'react';
import { Eye, User, FileText, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [stats, setStats] = useState({ users: 0, companies: 0, scansToday: 0 });
    const [recentScans, setRecentScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                <div>
                    <h1>Manas-Matrix</h1>
                    <p>Welcome to ScannerApp centralized Manas-Matrix instance.</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Loading live metrics...
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
                        <div className="content-card" style={{ flex: '0 0 auto', minWidth: '240px', margin: 0 }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Total Users</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.users}</p>
                        </div>
                        <div className="content-card" style={{ flex: '0 0 auto', minWidth: '240px', margin: 0 }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Total Companies</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.companies}</p>
                        </div>
                        <div className="content-card" style={{ flex: '0 0 auto', minWidth: '240px', margin: 0 }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Scans Today</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.scansToday}</p>
                        </div>
                    </div>

                    <div className="content-card table-card">
                        <div className="table-card-header">
                            <h3>
                                <FileText size={20} color="var(--primary-color)" /> Recent Scans
                            </h3>
                            <button
                                onClick={() => navigate('/fingerprint/all')}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                View All <ChevronRight size={16} />
                            </button>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Study / Occupation</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentScans.length > 0 ? (
                                    recentScans.map(scan => (
                                        <tr key={scan.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <User size={18} color="var(--text-secondary)" />
                                                    </div>
                                                    <div>
                                                        <div className="cell-strong">{scan.name}</div>
                                                        <div className="cell-muted" style={{ fontSize: '0.75rem' }}>#{scan.id.slice(-6)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="cell-muted">{scan.study || 'N/A'}</td>
                                            <td className="cell-muted cell-nowrap">
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} />
                                                    {new Date(scan.scannedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                    {' • '}
                                                    {new Date(scan.scannedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge badge-success">Verified</span>
                                            </td>
                                            <td className="col-actions">
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => navigate(`/fingerprint/view/${scan.id}`)}
                                                        className="btn-icon btn-icon-view"
                                                        title="View Record"
                                                    >
                                                        <Eye />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="table-empty">
                                            <div style={{ marginBottom: '0.5rem' }}><FileText size={32} opacity={0.3} style={{ margin: '0 auto' }} /></div>
                                            No recent activity detected.
                                        </td>
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
