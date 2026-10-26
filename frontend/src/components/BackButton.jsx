import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Shared back button so every detail/edit page looks and behaves the same.
// Takes an explicit route instead of navigate(-1) so it still works when the
// page was opened directly (bookmark, refresh, pasted URL).
export default function BackButton({ to, label = 'Back' }) {
    const navigate = useNavigate();
    return (
        <button type="button" className="btn-back" onClick={() => navigate(to)}>
            <ArrowLeft size={16} />
            <span>{label}</span>
        </button>
    );
}
