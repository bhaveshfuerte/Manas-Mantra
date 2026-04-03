import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function AdminSettings() {
    const [companyDetails, setCompanyDetails] = useState({ id: '', name: '', contactNumber: '', address: '', status: 'Active', logoBase64: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const fileInputRef = useRef(null);

    // Check logged in user synchronously for render checks
    const loggedInUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    })();

    useEffect(() => {
        let url = `/api/companies`;
        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            if (!loggedInUser.companyId || loggedInUser.companyId === 'all') {
                setIsLoading(false);
                return;
            }
            url += `?companyId=${loggedInUser.companyId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    setCompanies(data);
                    setCompanyDetails(data[0]); // default to first company
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching company", err);
                setIsLoading(false);
            });
    }, [loggedInUser.role, loggedInUser.companyId]);

    const handleChange = (e) => setCompanyDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleLogoChange = (e) => {
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
                    const resizedBase64 = canvas.toDataURL(file.type || 'image/png');
                    setCompanyDetails(prev => ({ ...prev, logoBase64: resizedBase64 }));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setCompanyDetails(prev => ({ ...prev, logoBase64: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/companies/${companyDetails.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyDetails)
            });
            if (res.ok) {
                alert(`Company Settings Updated Successfully!`);
                const localUser = JSON.parse(localStorage.getItem('user'));
                if (localUser) {
                    if (localUser.companyId === companyDetails.id || (localUser.role === 'Super Admin' && companies[0]?.id === companyDetails.id)) {
                        localUser.logoBase64 = companyDetails.logoBase64;
                        localStorage.setItem('user', JSON.stringify(localUser));
                        window.location.reload();
                    }
                }
            } else {
                const errText = await res.text();
                alert(`Failed to update company settings. Server returned: ${res.status} ${errText}`);
            }
        } catch (error) {
            console.error(error);
            alert(`Error connecting to the server: ${error.message}`);
        }
    };

    if (isLoading) return <div style={{ padding: '2rem' }}>Loading Admin Settings...</div>;

    if (loggedInUser.role !== 'Super Admin') {
        return (
            <div style={{ padding: '2rem' }}>
                <div className="page-header">
                    <h1>Access Denied</h1>
                    <p>Only the System Super Admin has the required clearance to modify core company root settings.</p>
                </div>
            </div>
        );
    }

    if (!companyDetails.id) {
        return (
            <div style={{ padding: '2rem' }}>
                <div className="page-header">
                    <h1>Admin Settings</h1>
                    <p>Admin Settings page not edit data of company this page is empty only Admin can edit their data.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <h1>Admin Settings</h1>
                <p>Edit your core company details and settings.</p>
            </div>

            <div className="content-card" style={{ maxWidth: '600px' }}>
                {loggedInUser.role === 'Super Admin' && companies.length > 1 && (
                    <div className="form-group" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <label>Select Company to Edit</label>
                        <select
                            className="form-input"
                            value={companyDetails.id}
                            onChange={(e) => {
                                const selected = companies.find(c => c.id === e.target.value);
                                if (selected) setCompanyDetails(selected);
                            }}
                        >
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <label style={{ width: '100%', textAlign: 'left', marginBottom: '1rem' }}>Company Logo</label>
                        <div
                            style={{
                                width: '150px',
                                height: '150px',
                                border: '2px dashed #cbd5e1',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                backgroundColor: '#f8fafc'
                            }}
                        >
                            {companyDetails.logoBase64 ? (
                                <>
                                    <img src={companyDetails.logoBase64} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <div onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                                    <ImageIcon size={32} style={{ marginBottom: '8px' }} />
                                    <span style={{ fontSize: '0.8rem' }}>Upload Logo</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleLogoChange}
                        />
                        <button
                            type="button"
                            className="btn-secondary"
                            style={{ marginTop: '1rem', width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <Upload size={14} /> Change Logo
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Company Name</label>
                        <input type="text" name="name" className="form-input" value={companyDetails.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Contact Number</label>
                        <input type="text" name="contactNumber" className="form-input" value={companyDetails.contactNumber} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <textarea name="address" className="form-input" rows="4" value={companyDetails.address} onChange={handleChange} required></textarea>
                    </div>
                    <button type="submit" className="btn-primary mt-4">Save Changes</button>
                </form>
            </div>
        </div>
    );
}
