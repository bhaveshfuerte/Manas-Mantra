import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadSingleImage } from '../../utils/imageUpload';

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
    const [uploadingSlot, setUploadingSlot] = useState(null);
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

    const captureFromWebcam = useCallback(async () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc && activeWebcamCapture) {
                const { finger, pos } = activeWebcamCapture;
                setUploadingSlot({ finger, pos });
                try {
                    const uploadedUrl = await uploadSingleImage(imageSrc);
                    setPhotos(prev => ({
                        ...prev,
                        [finger]: {
                            ...prev[finger],
                            [pos]: uploadedUrl
                        }
                    }));
                } catch (e) {
                    alert("Failed to upload photo to server.");
                } finally {
                    setIsModalOpen(false);
                    setActiveWebcamCapture(null);
                    setUploadingSlot(null);
                }
            }
        }
    }, [webcamRef, activeWebcamCapture]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        const finger = e.target.dataset.finger;
        const pos = e.target.dataset.pos;

        if (!file || !finger || !pos) return;
        setUploadingSlot({ finger, pos });

        try {
            const uploadedUrl = await uploadSingleImage(file);
            setPhotos(prev => ({
                ...prev,
                [finger]: { ...prev[finger], [pos]: uploadedUrl }
            }));
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload photo to server.");
        } finally {
            e.target.value = '';
            setUploadingSlot(null);
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

    const totalSlots = FINGERS.length * POSITIONS.length;
    const uploadedCount = FINGERS.reduce(
        (acc, f) => acc + POSITIONS.reduce((a, p) => a + (photos[f][p] ? 1 : 0), 0),
        0
    );

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
                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Fingerprint Photos</h3>

                    <div style={{
                        position: 'sticky', top: 0, zIndex: 50,
                        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                        backgroundColor: '#f0f4ff', border: '1px solid var(--primary-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem'
                    }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
                            {uploadedCount} / {totalSlots} photos uploaded
                        </span>
                        <div style={{ flex: 1, minWidth: '100px', height: '8px', backgroundColor: '#dbe4ff', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${(uploadedCount / totalSlots) * 100}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.3s ease' }} />
                        </div>
                        {uploadingSlot && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                <Loader2 size={16} style={{ animation: 'spin 2s linear infinite' }} />
                                Uploading {uploadingSlot.finger.replace('_', ' ')} {uploadingSlot.pos}...
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {FINGERS.map(finger => (
                            <div key={finger} className="finger-card">
                                <div className="finger-title">{finger.replace('_', ' ')}</div>
                                <div className="finger-positions">
                                    {POSITIONS.map(pos => {
                                        const isCaptured = !!photos[finger][pos];
                                        return (
                                            <div key={`${finger}-${pos}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                {uploadingSlot?.finger === finger && uploadingSlot?.pos === pos ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', minHeight: '60px', backgroundColor: '#f0f4ff', borderRadius: '8px' }}>
                                                        <Loader2 size={24} style={{ animation: 'spin 2s linear infinite', color: 'var(--primary-color)' }} />
                                                        <span style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--primary-color)', fontWeight: 'bold' }}>Uploading...</span>
                                                    </div>
                                                ) : (
                                                    <>
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
                                                    </>
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
                    <button type="submit" disabled={isSaving || !!uploadingSlot} className="btn-primary" style={{ maxWidth: '400px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
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
                        <Webcam 
                            audio={false} 
                            ref={webcamRef} 
                            screenshotFormat="image/jpeg" 
                            screenshotQuality={0.85}
                            videoConstraints={{ facingMode: "environment", width: 1920, height: 1080 }} 
                            width="100%" 
                        />
                    </div>
                    <button type="button" onClick={captureFromWebcam} className="btn-primary mt-4">Capture Photo</button>
                </div>
            )}
        </div>
    );
}
