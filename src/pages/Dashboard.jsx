import React from 'react';

export default function Dashboard() {
    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome to ScannerApp main dashboard.</p>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="content-card" style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Total Users</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>24</p>
                </div>
                <div className="content-card" style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Total Companies</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>5</p>
                </div>
                <div className="content-card" style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Scans Today</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>42</p>
                </div>
            </div>

            <div className="content-card">
                <h3 style={{ marginBottom: '1.5rem' }}>Recent Scans</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#1024</td>
                            <td>John Doe</td>
                            <td>2026-03-10</td>
                            <td><span style={{ color: 'var(--success)' }}>Success</span></td>
                        </tr>
                        <tr>
                            <td>#1023</td>
                            <td>Jane Smith</td>
                            <td>2026-03-10</td>
                            <td><span style={{ color: 'var(--success)' }}>Success</span></td>
                        </tr>
                        <tr>
                            <td>#1022</td>
                            <td>Alice Wang</td>
                            <td>2026-03-09</td>
                            <td><span style={{ color: 'var(--success)' }}>Success</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
