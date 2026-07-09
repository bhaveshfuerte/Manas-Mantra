import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Download } from 'lucide-react';

export default function ViewFingerprint() {
    const { id } = useParams();
    const [record, setRecord] = useState(null);
    const [photosData, setPhotosData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const res = await fetch(`/api/fingerprints/${id}`);
                if (!res.ok) throw new Error("Record not found");
                const data = await res.json();
                setRecord(data);

                let pData = data.photos || {};
                if (data.photosUrl) {
                    const colRes = await fetch(data.photosUrl);
                    if (colRes.ok) {
                        pData = await colRes.json();
                    }
                }
                setPhotosData(pData);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                setIsLoading(false);
            }
        };
        fetchRecord();
    }, [id]);

    if (isLoading) return <div style={{ padding: '2rem' }}><Loader2 className="spinner" /> Loading Record...</div>;
    if (!record) return <div style={{ padding: '2rem' }}>Record not found.</div>;

    const fingers = [
        'Left_Little', 'Left_Ring', 'Left_Middle', 'Left_Index', 'Left_Thumb',
        'Right_Thumb', 'Right_Index', 'Right_Middle', 'Right_Ring', 'Right_Little'
    ];
    const positions = ['Left', 'Center', 'Right'];

    const downloadSingleImage = (sourceUrl, fingerName, position) => {
        const link = document.createElement('a');
        link.href = sourceUrl;
        link.download = `${record.name}_${fingerName}_${position}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Record: {record.name}</h1>
                    <p>Manas-Matrix view of all biometric details and captured images.</p>
                </div>
            </div>

            <div className="content-card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Personal Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Age:</strong> {record.age || '-'}</div>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Occupation:</strong> {record.study || '-'}</div>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Father's Name:</strong> {record.fatherName || '-'}</div>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Contact:</strong> {record.contactDetails || '-'}</div>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Scan Date:</strong> {new Date(record.scannedAt).toLocaleString()}</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {fingers.map(finger => {
                    const p = photosData[finger] || {};
                    if (!p.Left && !p.Center && !p.Right) return null;

                    return (
                        <div key={finger} className="content-card">
                            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                {finger.replace('_', ' ')}
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
                                {positions.map(pos => {
                                    const src = p[pos];
                                    if (!src) return null;
                                    return (
                                        <div key={pos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <p style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{pos}</p>
                                            <img 
                                                src={src.startsWith('http') || src.startsWith('data:') || src.startsWith('/uploads') ? src : undefined} 
                                                alt={`${finger} ${pos}`}
                                                style={{ maxWidth: '280px', maxHeight: '350px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', backgroundColor: '#f8fafc' }}
                                            />
                                            <button
                                                onClick={() => downloadSingleImage(src, finger, pos)}
                                                className="btn-secondary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                                            >
                                                <Download size={14} /> Download Image
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            <style>{`
                .spinner { animation: spin 2s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
