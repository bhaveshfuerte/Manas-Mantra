import React, { useState } from 'react';

export default function AddCompany() {
    const [formData, setFormData] = useState({
        name: '',
        contactNumber: '',
        address: '',
        status: 'Active'
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            const res = await fetch(`/api/companies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert(`Company ${formData.name} added successfully!`);
                setFormData({ name: '', contactNumber: '', address: '', status: 'Active' });
            } else {
                alert('Failed to add company. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to the server.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Add Company</h1>
                <p>Register a new company into the system.</p>
            </div>

            <div className="content-card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Company Name</label>
                        <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Contact Number</label>
                        <input type="text" name="contactNumber" className="form-input" value={formData.contactNumber} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <textarea name="address" className="form-input" rows="4" value={formData.address} onChange={handleChange} required></textarea>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                            <option value="Active">Active</option>
                            <option value="Deactive">Deactive</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-primary mt-4">Save Company</button>
                </form>
            </div>
        </div >
    );
}
