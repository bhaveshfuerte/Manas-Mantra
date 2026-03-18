import React, { useState, useEffect } from 'react';

export default function AllCompany() {
    const [companies, setCompanies] = useState([]);

    useEffect(() => {

        let loggedInUser = {};
        try {
            loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
        } catch (e) {
            console.error("Corrupted user");
        }

        let url = `/api/companies`;
        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            url += `?companyId=${loggedInUser.companyId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch(err => console.error("Error fetching companies:", err));
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1>All Companies</h1>
                <p>Manage all registered companies.</p>
            </div>

            <div className="content-card" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '800px' }}>
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Contact Number</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(c => (
                            <tr key={c.id}>
                                <td>{c.name}</td>
                                <td>{c.contactNumber}</td>
                                <td>{c.address}</td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        backgroundColor: c.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: c.status === 'Active' ? '#10b981' : '#ef4444'
                                    }}>
                                        {c.status || 'Active'}
                                    </span>
                                </td>
                                <td><button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', width: 'auto' }}>View</button></td>
                            </tr>
                        ))}
                        {companies.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>No companies found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
