import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
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

export default function AddFingerprint() {
    const [formData, setFormData] = useState(() => {
        const savedForm = localStorage.getItem('fp_form_data');
        return savedForm ? JSON.parse(savedForm) : { name: '', age: '', study: '', fatherName: '', contactDetails: '' };
    });

    const [photos, setPhotos] = useState(() => getInitialPhotos());

    const [uploadingSlot, setUploadingSlot] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef(null);
    const webcamRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeWebcamCapture, setActiveWebcamCapture] = useState(null);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Persist to local storage to survive mobile browser tab reloads
    useEffect(() => {
        localStorage.setItem('fp_form_data', JSON.stringify(formData));
    }, [formData]);

    // Removed fp_photos localStorage caching since uncompressed 12MP photos instantly crush the browser's 5MB localStorage limit and freeze the app!

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
                    setPhotos(prev => {
                        const updated = {
                            ...prev,
                            [finger]: {
                                ...prev[finger],
                                [pos]: uploadedUrl
                            }
                        };
                        focusNextMissingSlot(finger, pos, updated);
                        return updated;
                    });
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


    const focusNextMissingSlot = (currentFinger, currentPos, newPhotosState) => {
        let foundCurrent = false;
        for (const f of FINGERS) {
            for (const p of POSITIONS) {
                if (foundCurrent) {
                    if (!newPhotosState[f][p]) {
                        setTimeout(() => {
                            const btn = document.getElementById(`btn-${f}-${p}`);
                            if (btn) {
                                btn.focus();
                                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100);
                        return;
                    }
                }
                if (f === currentFinger && p === currentPos) {
                    foundCurrent = true;
                }
            }
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        const finger = e.target.dataset.finger;
        const pos = e.target.dataset.pos;

        if (!file || !finger || !pos) return;

        setUploadingSlot({ finger, pos });

        try {
            const uploadedUrl = await uploadSingleImage(file);
            setPhotos(prev => {
                const updated = {
                    ...prev,
                    [finger]: { ...prev[finger], [pos]: uploadedUrl }
                };
                focusNextMissingSlot(finger, pos, updated);
                return updated;
            });
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload photo to server.");
        } finally {
            e.target.value = ''; // Reset input to allow recapturing
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
        if (!formData.name) return alert("Please enter at least the candidate's name.");

        setIsSaving(true);
        try {
            let loggedInUser = {};
            try {
                loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
            } catch (e) {
                console.warn("Corrupted user in storage");
            }
            const payload = {
                ...formData,
                photos,
                userId: loggedInUser.id,
                companyId: loggedInUser.companyId
            };

            const res = await fetch(`/api/fingerprints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('All details and photos successfully saved in high quality to the server!');
                setFormData({ name: '', age: '', study: '', fatherName: '', contactDetails: '' });
                setPhotos(getInitialPhotos());
                localStorage.removeItem('fp_form_data');
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to save data. Server responded with: ${res.statusText} ${errData.message || ''}`);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert(`Error connecting to the server: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const totalSlots = FINGERS.length * POSITIONS.length;
    const uploadedCount = FINGERS.reduce(
        (acc, f) => acc + POSITIONS.reduce((a, p) => a + (photos[f][p] ? 1 : 0), 0),
        0
    );

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <h1>Add Fingerprint Record</h1>
                <p>Complete the profile details and capture all 30 high-quality photos.</p>
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
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Click on each position to open the respective back-camera and capture a high-quality photo.
                    </p>

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
                                                            id={`btn-${finger}-${pos}`}
                                                            type="button"
                                                            onClick={() => isCaptured ? removePhoto(finger, pos) : triggerCamera(finger, pos)}
                                                            className={`finger-pos-btn ${isCaptured ? 'captured' : ''}`}
                                                            title={isCaptured ? "Click to retake/remove" : "Click to capture"}
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
                        {isSaving ? <Loader2 size={20} style={{ animation: 'spin 2s linear infinite' }} /> : <Upload size={20} />}
                        {isSaving ? 'Saving Record...' : 'Save Entire Record to Database'}
                    </button>
                </div>
            </form>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {/* Desktop Fullscreen Camera Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <button className="close-modal" type="button" onClick={() => { setIsModalOpen(false); setActiveWebcamCapture(null); }}>
                        <X size={24} />
                    </button>
                    <div style={{ textAlign: 'center', color: 'white', marginBottom: '1rem', zIndex: 1000 }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Capturing {activeWebcamCapture?.finger.replace('_', ' ')}</h2>
                        <p>Position: <strong>{activeWebcamCapture?.pos}</strong></p>
                    </div>

                    <div className="camera-wrapper">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={0.85}
                            videoConstraints={{ facingMode: "environment", width: 1920, height: 1080 }}
                            width="100%"
                            style={{ objectFit: 'cover' }}
                        />
                        <div className="camera-overlay"></div>
                    </div>

                    <button type="button" onClick={captureFromWebcam} className="btn-primary mt-4" style={{ backgroundColor: 'var(--primary-color)', maxWidth: '300px', zIndex: 1000, display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Camera size={20} /> Capture Web Photo
                    </button>
                </div>
            )}
        </div>
    );
}
