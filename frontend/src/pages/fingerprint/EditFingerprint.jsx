import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const FINGERS = [
    'Left_Thumb', 'Left_Index', 'Left_Middle', 'Left_Ring', 'Left_Little',
    'Right_Thumb', 'Right_Index', 'Right_Middle', 'Right_Ring', 'Right_Little'
];
const POSITIONS = ['Left', 'Center', 'Right'];

const getInitialPhotos = () => {
    const obj = {};
    FINGERS.forEach(f => {
        obj[f] = { Left: null, Center: null, Right: null };
    });
    return obj;
};

export default function EditFingerprint() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', age: '', study: '', fatherName: '', contactDetails: '' });
    const [photos, setPhotos] = useState(() => getInitialPhotos());
    const [isLoading, setIsLoading] = useState(true);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef(null);
    const webcamRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeWebcamCapture, setActiveWebcamCapture] = useState(null);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const res = await fetch(`/api/fingerprints/${id}`);
                if (!res.ok) throw new Error("Record not found");
                const data = await res.json();
                
                setFormData({
                    name: data.name || '',
                    age: data.age || '',
                    study: data.study || '',
                    fatherName: data.fatherName || '',
                    contactDetails: data.contactDetails || ''
                });

                let pData = data.photos || {};
                if (data.photosUrl) {
                    const colRes = await fetch(data.photosUrl);
                    if (colRes.ok) {
                        pData = await colRes.json();
                    }
                }
                setPhotos(prev => ({ ...prev, ...pData }));
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                alert("Error loading record data");
                navigate('/fingerprint/all');
            }
        };
        fetchRecord();
    }, [id, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const triggerCamera = (finger, pos) => {
        if (isMobile || window.innerWidth <= 768) {
            if (fileInputRef.current) {
                fileInputRef.current.dataset.finger = finger;
                fileInputRef.current.dataset.pos = pos;
                fileInputRef.current.click();
            }
        } else {
            setActiveWebcamCapture({ finger, pos });
            setIsModalOpen(true);
        }
    };

    const captureFromWebcam = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc && activeWebcamCapture) {
                setPhotos(prev => ({
                    ...prev,
                    [activeWebcamCapture.finger]: {
                        ...prev[activeWebcamCapture.finger],
                        [activeWebcamCapture.pos]: imageSrc
                    }
                }));
                setIsModalOpen(false);
                setActiveWebcamCapture(null);
            }
        }
    }, [webcamRef, activeWebcamCapture]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        const finger = e.target.dataset.finger;
        const pos = e.target.dataset.pos;

        if (!file || !finger || !pos) return;
        setIsCompressing(true);

        try {
            const reader = new FileReader();

            reader.onloadend = () => {
                setPhotos(prev => ({
                    ...prev,
                    [finger]: { ...prev[finger], [pos]: reader.result }
                }));
                e.target.value = '';
                setIsCompressing(false);
            };
            reader.readAsDataURL(file); // Read raw file directly for maximum quality
        } catch (err) {
            console.error("File read failed:", err);
            setIsCompressing(false);
        }
    };

    const removePhoto = (finger, pos) => {
        setPhotos(prev => ({
            ...prev, [finger]: { ...prev[finger], [pos]: null }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`/api/fingerprints/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, photos })
            });
            if (res.ok) {
                alert('Record updated successfully!');
                navigate('/fingerprint/all');
            } else {
                alert('Failed to update record');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to the server');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{ padding: '2rem' }}><Loader2 size={16} className="spinner" style={{ animation: 'spin 2s linear infinite' }} /> Loading record for editing...</div>;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/fingerprint/all')} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1>Edit Fingerprint Record</h1>
                    <p>Modify profile details or retake biometric photos for <strong>{formData.name}</strong>.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="content-card">
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Personal Details</h3>
                    <div className="dashboard-grid">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Age</label>
                            <input type="number" name="age" className="form-input" value={formData.age} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Study / Occupation</label>
                            <input type="text" name="study" className="form-input" value={formData.study} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Father's Name</label>
                            <input type="text" name="fatherName" className="form-input" value={formData.fatherName} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Contact Details</label>
                            <input type="text" name="contactDetails" className="form-input" value={formData.contactDetails} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                <div className="content-card">
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Fingerprint Photos</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {FINGERS.map(finger => (
                            <div key={finger} className="finger-card">
                                <div className="finger-title">{finger.replace('_', ' ')}</div>
                                <div className="finger-positions">
                                    {POSITIONS.map(pos => {
                                        const isCaptured = !!photos[finger][pos];
                                        return (
                                            <div key={`${finger}-${pos}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => isCaptured ? removePhoto(finger, pos) : triggerCamera(finger, pos)}
                                                    className={`finger-pos-btn ${isCaptured ? 'captured' : ''}`}
                                                    style={{ width: '100%' }}
                                                >
                                                    {isCaptured ? `✓ ${pos}` : pos}
                                                </button>
                                                {isCaptured && (
                                                    <img
                                                        src={photos[finger][pos]}
                                                        alt={`${finger} ${pos}`}
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', marginTop: '6px', borderRadius: '4px', border: '1px solid var(--success)' }}
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button type="submit" disabled={isSaving || isCompressing} className="btn-primary" style={{ maxWidth: '400px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        {isSaving ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 2s linear infinite' }} /> : <Upload size={20} />}
                        Save Changes
                    </button>
                </div>
            </form>

            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

            {isModalOpen && (
                <div className="modal-overlay">
                    <button className="close-modal" type="button" onClick={() => { setIsModalOpen(false); setActiveWebcamCapture(null); }}>
                        <X size={24} />
                    </button>
                    <div className="camera-wrapper">
                        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "environment" }} width="100%" />
                    </div>
                    <button type="button" onClick={captureFromWebcam} className="btn-primary mt-4">Capture Photo</button>
                </div>
            )}
        </div>
    );
}
