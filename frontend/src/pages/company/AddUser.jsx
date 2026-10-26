import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import BackButton from '../../components/BackButton';

const PERMISSIONS_LIST = [
    { id: 'dashboard', label: 'Manas-Matrix' },
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
    const [showPassword, setShowPassword] = useState(false);
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
            <div className="page-header">
                <div>
                    <h1>{isViewMode ? 'View User' : isEditMode ? 'Edit User' : 'Add New User'}</h1>
                    <p>{isViewMode ? 'Viewing user details and permissions.' : isEditMode ? 'Modify existing user details and permissions.' : 'Register a new system user and configure their permissions.'}</p>
                </div>
                {isEditMode && <BackButton to="/company/all-users" />}
            </div>

            <div className="content-card form-card">
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isViewMode} style={{ border: 'none', padding: 0, margin: 0 }}>
                        <div className="form-grid">
                        <div className="form-group">
                            <label>User Full Name</label>
                            <input type="text" name="name" className="form-input" placeholder="Enter full name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" className="form-input" placeholder="Enter email address" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-field">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </button>
                            </div>
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
                            <div className="form-group full">
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
                            <div className="form-group full">
                                <label>Manas-Matrix & PDF Logo</label>
                                <input type="file" accept="image/*" className="form-input" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            const img = new Image();
                                            img.onload = () => {
                                                const canvas = document.createElement('canvas');
                                                const MAX_SIZE = 300;
                                                let width = img.width;
                                                let height = img.height;

                                                if (width > height && width > MAX_SIZE) {
                                                    height *= MAX_SIZE / width;
                                                    width = MAX_SIZE;
                                                } else if (height > MAX_SIZE) {
                                                    width *= MAX_SIZE / height;
                                                    height = MAX_SIZE;
                                                }

                                                canvas.width = width;
                                                canvas.height = height;
                                                const ctx = canvas.getContext('2d');
                                                ctx.drawImage(img, 0, 0, width, height);
                                                setFormData(prev => ({ ...prev, logoBase64: canvas.toDataURL(file.type || 'image/png') }));
                                            };
                                            img.src = reader.result;
                                        };
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
                        <div className="form-group">
                            <label>Module Access Permissions</label>
                            <div className="check-group">
                                {accessiblePermissions.map(mod => (
                                    <label key={mod.id} className="check-tile">
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
                    {!isViewMode && (
                        <div className="form-actions">
                            <button type="submit" className="btn-primary">{isEditMode ? 'Save Changes' : 'Save User'}</button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
