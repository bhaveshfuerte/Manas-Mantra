import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function EditCompany() {
    const location = useLocation();
    const navigate = useNavigate();
    const passedCompany = location.state?.company;
    const isViewMode = location.state?.viewMode || false;

    const [companyDetails, setCompanyDetails] = useState(
        passedCompany || { id: '', name: '', contactNumber: '', address: '', status: 'Active' }
    );

    useEffect(() => {
        if (!passedCompany) {
            navigate('/company/all-company', { replace: true });
        }
    }, [passedCompany, navigate]);

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
                alert(`Company Updated Successfully!`);
                navigate('/company/all-company');
            } else {
                alert('Failed to update company. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to the server.');
        }
    };

    if (!passedCompany) return <div style={{ padding: '2rem' }}>Redirecting...</div>;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>{isViewMode ? 'View Company' : 'Edit Company'}</h1>
                    <p>{isViewMode ? `Viewing details for ${passedCompany.name}.` : `Update details and settings for ${passedCompany.name}.`}</p>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/company/all-company')} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>
                    {isViewMode ? 'Back' : 'Cancel'}
                </button>
            </div>

            <div className="content-card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isViewMode} style={{ border: 'none', padding: 0, margin: 0 }}>
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
                    <div className="form-group">
                         <label>Status</label>
                         <select name="status" className="form-input" value={companyDetails.status} onChange={handleChange}>
                             <option value="Active">Active</option>
                             <option value="Deactive">Deactive</option>
                         </select>
                    </div>
                    </fieldset>
                    {!isViewMode && <button type="submit" className="btn-primary mt-4">Save Updates</button>}
                </form>
            </div>
        </div>
    );
}
