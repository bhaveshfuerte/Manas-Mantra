import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function AllCompany() {
    const [companies, setCompanies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    let loggedInUser = {};
    try {
        loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
    } catch (e) {
        console.error("Corrupted user");
    }
    const isSuperAdmin = loggedInUser.role === 'Super Admin';

    const fetchCompanies = () => {
        let url = `/api/companies`;
        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            url += `?companyId=${loggedInUser.companyId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch(err => console.error("Error fetching companies:", err));
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = async (c) => {
        if (!window.confirm(`Are you sure you want to delete company "${c.name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/companies/${c.id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                alert("Company deleted successfully");
                fetchCompanies();
            } else {
                alert(data.message || "Failed to delete company");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server");
        }
    };

    const displayedCompanies = companies.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.contactNumber?.includes(searchQuery) ||
        c.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>All Companies</h1>
                    <p>Manage all registered companies.</p>
                </div>
                <input
                    type="text"
                    placeholder="Search companies..."
                    className="form-input search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="content-card table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Contact Number</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th className="col-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedCompanies.map(c => (
                            <tr key={c.id}>
                                <td className="cell-strong">{c.name}</td>
                                <td>{c.contactNumber}</td>
                                <td className="cell-muted cell-wide">{c.address}</td>
                                <td>
                                    <span className={`badge ${(c.status || 'Active') === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                        {c.status || 'Active'}
                                    </span>
                                </td>
                                <td className="col-actions">
                                    <div className="action-buttons">
                                        <button
                                            className="btn-icon btn-icon-view"
                                            onClick={() => navigate('/company/edit-company', { state: { company: c, viewMode: true } })}
                                            title="View Company"
                                        >
                                            <Eye />
                                        </button>
                                        <button
                                            className="btn-icon btn-icon-edit"
                                            onClick={() => navigate('/company/edit-company', { state: { company: c } })}
                                            title="Edit Company"
                                        >
                                            <Pencil />
                                        </button>
                                        {isSuperAdmin && (
                                            <button
                                                className="btn-icon btn-icon-delete"
                                                onClick={() => handleDelete(c)}
                                                title="Delete Company"
                                            >
                                                <Trash2 />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {displayedCompanies.length === 0 && (
                            <tr>
                                <td colSpan="5" className="table-empty">No companies found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
