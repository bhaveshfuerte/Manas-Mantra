import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PERMISSIONS_LIST = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'add-company', label: 'Add Company' },
    { id: 'all-company', label: 'All Companies' },
    { id: 'add-user', label: 'Add Users' },
    { id: 'all-users', label: 'All Users' },
    { id: 'add-fingerprint', label: 'Add Fingerprint' },
    { id: 'all-fingerprints', label: 'All Records (Vault)' }
];

export default function AddUser() {
    const location = useLocation();
    const navigate = useNavigate();
    const editUser = location.state?.user || null;
    const isViewMode = location.state?.viewMode || false;
    const isEditMode = !!editUser;

    const [formData, setFormData] = useState({
        name: editUser?.name || '',
        email: editUser?.email || '',
        password: editUser?.password || '',
        role: editUser?.role || 'User',
        companyId: editUser?.companyId || ''
    });

    const [permissions, setPermissions] = useState(editUser?.permissions || []);
    const [companies, setCompanies] = useState([]);

    const loggedInUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    })();

    const accessiblePermissions = PERMISSIONS_LIST.filter(mod => {
        if (mod.id === 'all-company' || mod.id === 'add-user') {
            return loggedInUser.role === 'Super Admin';
        }
        return true;
    });

    useEffect(() => {
        let url = `/api/companies`;
        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            url += `?companyId=${loggedInUser.companyId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setCompanies(data);
                // Auto-select company if they are not super admin and only have 1 choice
                if ((loggedInUser.role === 'Admin' || loggedInUser.role === 'User') && data.length > 0) {
                    setFormData(prev => ({ ...prev, companyId: data[0].id }));
                }
            })
            .catch(err => console.error("Error fetching companies:", err));
    }, [loggedInUser.role, loggedInUser.companyId]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handlePermissionToggle = (mod) => {
        if (permissions.includes(mod)) {
            setPermissions(permissions.filter(p => p !== mod));
        } else {
            setPermissions([...permissions, mod]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            // If super admin, allow all modules implicitly
            const finalPermissions = formData.role === 'Super Admin' ? ['all'] : permissions;
            const finalCompanyId = formData.role === 'Super Admin' ? null : formData.companyId;

            const endpoint = isEditMode ? `/api/users/${editUser.id}` : `/api/users`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, companyId: finalCompanyId, permissions: finalPermissions })
            });

            if (res.ok) {
                // Instantly update local storage and reload if editing own profile
                if (isEditMode && editUser.id === loggedInUser.id) {
                    const updatedUser = { ...loggedInUser, ...formData, permissions: finalPermissions, logoBase64: formData.logoBase64 };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    alert(`Your profile was updated successfully!`);
                    window.location.reload();
                    return;
                }

                alert(`User ${formData.name} ${isEditMode ? 'updated' : 'added'} successfully!`);
                if (isEditMode) {
                    navigate('/company/all-users');
                } else {
                    setFormData({ name: '', email: '', password: '', role: 'User', companyId: '' });
                    setPermissions([]);
                }
            } else {
                const err = await res.json();
                alert(`Failed to save user: ${err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to the server.');
        }
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>{isViewMode ? 'View User' : isEditMode ? 'Edit User' : 'Add New User'}</h1>
                    <p>{isViewMode ? 'Viewing user details and permissions.' : isEditMode ? 'Modify existing user details and permissions.' : 'Register a new system user and configure their permissions.'}</p>
                </div>
                {isViewMode && (
                    <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>
                        Back
                    </button>
                )}
            </div>

            <div className="content-card" style={{ maxWidth: '800px' }}>
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isViewMode} style={{ border: 'none', padding: 0, margin: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                            <label>User Full Name</label>
                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>System Role</label>
                            <select name="role" className="form-input" value={formData.role} onChange={handleChange}>
                                <option value="User">Standard User</option>
                                <option value="Admin">Branch Admin</option>
                                <option value="Super Admin">Super Admin</option>
                            </select>
                        </div>
                        {formData.role !== 'Super Admin' && (
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Assigned Company / Branch</label>
                                <select name="companyId" className="form-input" value={formData.companyId} onChange={handleChange} required>
                                    <option value="">-- Select a Company --</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {loggedInUser.role === 'Super Admin' && formData.role === 'Super Admin' && (
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Dashboard & PDF Logo</label>
                                <input type="file" accept="image/*" className="form-input" onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setFormData(prev => ({ ...prev, logoBase64: reader.result }));
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                                {formData.logoBase64 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img src={formData.logoBase64} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {formData.role !== 'Super Admin' && (
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ marginBottom: '1rem', display: 'block' }}>Module Access Permissions</label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {accessiblePermissions.map(mod => (
                                    <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <input
                                            type="checkbox"
                                            checked={permissions.includes(mod.id)}
                                            onChange={() => handlePermissionToggle(mod.id)}
                                        />
                                        {mod.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    </fieldset>
                    {!isViewMode && <button type="submit" className="btn-primary">{isEditMode ? 'Save Changes' : 'Save Secure User'}</button>}
                </form>
            </div>
        </div>
    );
}
