import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AllUsers() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {

        let loggedInUser = {};
        try {
            loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
        } catch (e) {
            console.error("Corrupted local user");
        }

        let url = `/api/users`;
        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            url += `?companyId=${loggedInUser.companyId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error("Error fetching users:", err));
    }, []);

    const displayedUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>All Users</h1>
                    <p>List of all registered system users.</p>
                </div>
                <div style={{ minWidth: '250px' }}>
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="form-input" 
                        style={{ margin: 0 }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="content-card" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '800px' }}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Company ID</th>
                            <th>Permissions</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedUsers.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: '500' }}>{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        backgroundColor: u.role === 'Super Admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        color: u.role === 'Super Admin' ? '#3b82f6' : '#10b981'
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>{u.companyId || 'N/A (Super)'}</td>
                                <td>
                                    {u.permissions?.includes('all') 
                                        ? 'Full Access' 
                                        : (u.permissions?.map(pId => {
                                            const match = [
                                                { id: 'dashboard', label: 'Dashboard' },
                                                { id: 'add-company', label: 'Add Company' },
                                                { id: 'all-company', label: 'All Companies' },
                                                { id: 'add-user', label: 'Add Users' },
                                                { id: 'all-users', label: 'All Users' },
                                                { id: 'add-fingerprint', label: 'Add Fingerprint' },
                                                { id: 'all-fingerprints', label: 'All Records' }
                                            ].find(m => m.id === pId);
                                            return match ? match.label : pId;
                                        }).join(', ') || 'None')
                                    }
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={() => navigate('/company/add-user', { state: { user: u, viewMode: true } })}
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', width: 'auto', backgroundColor: '#f1f5f9', color: '#475569' }}
                                        >
                                            View
                                        </button>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', width: 'auto' }}
                                            onClick={() => navigate('/company/add-user', { state: { user: u } })}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {displayedUsers.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
