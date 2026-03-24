import React, { useState, useEffect } from 'react';

export default function AdminSettings() {
    const [companyDetails, setCompanyDetails] = useState({ id: '', name: '', contactNumber: '', address: '', status: 'Active' });
    const [isLoading, setIsLoading] = useState(true);
    const [companies, setCompanies] = useState([]);

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
            } else {
                alert('Failed to update company settings. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to the server.');
        }
    };

    if (isLoading) return <div style={{ padding: '2rem' }}>Loading Admin Settings...</div>;

    // Removed restricted block, Super Admins can now edit directly

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
