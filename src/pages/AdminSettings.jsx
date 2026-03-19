import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function AdminSettings() {
    const location = useLocation();
    const passedCompany = location.state?.company;

    const [companyDetails, setCompanyDetails] = useState(
        passedCompany || { id: '', name: '', contactNumber: '', address: '', status: 'Active' }
    );
    const [isLoading, setIsLoading] = useState(!passedCompany);

    useEffect(() => {
        if (passedCompany) return; // Skip fetching if we already have it from navigation

        let loggedInUser = {};
        try {
            loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
        } catch (e) {
            console.error("Corrupted local user");
        }

        if (loggedInUser.companyId && loggedInUser.companyId !== 'all') {
            fetch(`/api/companies?companyId=${loggedInUser.companyId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setCompanyDetails(data[0]);
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching company", err);
                    setIsLoading(false);
                });
        } else if (loggedInUser.role === 'Super Admin') {
            fetch(`/api/companies`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setCompanyDetails(data[0]); 
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, []);

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

    if (!companyDetails.id) {
        return (
            <div style={{ padding: '2rem' }}>
                <div className="page-header">
                    <h1>Admin Settings</h1>
                    <p>No company assigned to your profile yet. Please create a company first.</p>
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
