import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';

const PERMISSION_LABELS = {
    'dashboard': 'Manas-Matrix',
    'add-company': 'Add Company',
    'all-company': 'All Companies',
    'add-user': 'Add Users',
    'all-users': 'All Users',
    'add-fingerprint': 'Add Fingerprint',
    'all-fingerprints': 'All Records'
};

const ROLE_BADGE = {
    'Super Admin': 'badge-info',
    'Admin': 'badge-success'
};

export default function AllUsers() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    let loggedInUser = {};
    try {
        loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
    } catch (e) {
        console.error("Corrupted local user");
    }

    const fetchUsers = () => {
        let url = `/api/users`;
        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            url += `?companyId=${loggedInUser.companyId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error("Error fetching users:", err));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Mirrors the server's rules so the button only shows where a delete can succeed.
    const canDelete = (u) =>
        u.id !== loggedInUser.id &&
        u.id !== 'super-admin' &&
        (u.role !== 'Super Admin' || loggedInUser.role === 'Super Admin');

    const handleDelete = async (u) => {
        if (!window.confirm(`Are you sure you want to delete user "${u.name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                alert("User deleted successfully");
                fetchUsers();
            } else {
                alert(data.message || "Failed to delete user");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server");
        }
    };

    // `?.` only guards against null/undefined — a record whose name/email/role
    // came back as some other non-string value (e.g. a number) still throws on
    // .toLowerCase(). Coerce to string first so any value is safely searchable.
    const asText = (val) => (val == null ? '' : String(val)).toLowerCase();
    const query = searchQuery.toLowerCase();
    const displayedUsers = users.filter(u =>
        asText(u.name).includes(query) ||
        asText(u.email).includes(query) ||
        asText(u.role).includes(query)
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>All Users</h1>
                    <p>List of all registered system users.</p>
                </div>
                <input
                    type="text"
                    placeholder="Search users..."
                    className="form-input search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="content-card table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Company ID</th>
                            <th>Permissions</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedUsers.map(u => (
                            <tr key={u.id}>
                                <td className="cell-strong">{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`badge ${ROLE_BADGE[u.role] || 'badge-neutral'}`}>{u.role}</span>
                                </td>
                                <td className="cell-muted">{u.companyId || 'N/A (Super)'}</td>
                                <td className="cell-muted cell-wide">
                                    {u.permissions?.includes('all')
                                        ? 'Full Access'
                                        : (u.permissions?.map(pId => PERMISSION_LABELS[pId] || pId).join(', ') || 'None')
                                    }
                                </td>
                                <td className="col-actions">
                                    <div className="action-buttons">
                                        <button
                                            className="btn-icon btn-icon-view"
                                            onClick={() => navigate('/company/add-user', { state: { user: u, viewMode: true } })}
                                            title="View User"
                                        >
                                            <Eye />
                                        </button>
                                        <button
                                            className="btn-icon btn-icon-edit"
                                            onClick={() => navigate('/company/add-user', { state: { user: u } })}
                                            title="Edit User"
                                        >
                                            <Pencil />
                                        </button>
                                        {canDelete(u) && (
                                            <button
                                                className="btn-icon btn-icon-delete"
                                                onClick={() => handleDelete(u)}
                                                title="Delete User"
                                            >
                                                <Trash2 />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {displayedUsers.length === 0 && (
                            <tr>
                                <td colSpan="6" className="table-empty">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
