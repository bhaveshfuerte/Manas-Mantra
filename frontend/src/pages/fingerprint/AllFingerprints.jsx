import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { Download, Loader2, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { squadaFont } from './font';

export default function AllFingerprints() {
    const [records, setRecords] = useState([]);
    const [downloadingId, setDownloadingId] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [searchName, setSearchName] = useState('');
    const navigate = useNavigate();

    const fetchRecords = () => {
        let url = `/api/fingerprints`;
        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            url += `?companyId=${loggedInUser.companyId}`;
        }
        fetch(url)
            .then(res => res.json())
            .then(data => setRecords(data))
            .catch(err => console.error("Error fetching fingerprints", err));
    };

    const loggedInUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    })();

    useEffect(() => {
        if (loggedInUser.role === 'Super Admin') {
            fetch(`/api/companies`)
                .then(res => res.json())
                .then(data => setCompanies(data))
                .catch(e => console.error(e));
        }
        fetchRecords();
    }, [loggedInUser.role, loggedInUser.companyId]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this fingerprint record? This will also remove all associated images permanently.")) return;
        try {
            const res = await fetch(`/api/fingerprints/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Record deleted successfully");
                fetchRecords();
            } else {
                alert("Failed to delete record");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server");
        }
    };

    const getBase64ImageFromUrl = async (imageUrl) => {
        try {

            const res = await fetch(imageUrl);
            const blob = await res.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const img = new Image();
                    img.onload = () => resolve({ dataUrl: reader.result, width: img.width, height: img.height });
                    img.onerror = reject;
                    img.src = reader.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const getImageMetadata = (base64Str) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ dataUrl: base64Str, width: img.width, height: img.height });
            img.onerror = reject;
            img.src = base64Str;
        });
    };

    const handleDownloadPDF = async (record) => {
        setDownloadingId(record.id);

        let photosData = record.photos || {};
        try {
            if (record.photosUrl) {
                try {
                    const res = await fetch(record.photosUrl);
                    if (res.ok) {
                        photosData = await res.json();
                    }
                } catch (err) {
                    console.error("Failed to load photo collection", err);
                }
            }

        let compName = "Manas Matrix";
        let compContact = "123-456-7890";
        let compAddress = "123 Business Avenue, Tech District";
        let compLogoBase64 = null;
        
        try {
            // First try matching the record's company ID
            let fetchedCompanyId = record.companyId && record.companyId !== 'unassigned' && record.companyId !== 'all' ? record.companyId : null;
            
            // If the record has no assigned company, assume they belong to the current logged-in user's company
            if (!fetchedCompanyId) {
                const localUser = JSON.parse(localStorage.getItem('user'));
                if (localUser && localUser.companyId && localUser.companyId !== 'all') {
                    fetchedCompanyId = localUser.companyId;
                }
            }

            if (fetchedCompanyId) {
                const compRes = await fetch(`/api/companies?companyId=${fetchedCompanyId}`);
                if (compRes.ok) {
                    const compData = await compRes.json();
                    if (compData.length > 0) {
                        compName = compData[0].name || compName;
                        compContact = compData[0].contactNumber || compContact;
                        compAddress = compData[0].address || compAddress;
                        compLogoBase64 = compData[0].logoBase64;
                    }
                }
            }
        } catch(e) {}

        let logoObj = null;
        try {
            if (compLogoBase64) {
                logoObj = await getImageMetadata(compLogoBase64);
            } else {
                const localUser = JSON.parse(localStorage.getItem('user'));
                if (localUser && localUser.logoBase64) {
                    logoObj = await getImageMetadata(localUser.logoBase64);
                }
            }
        } catch (e) {}

        const doc = new jsPDF({ format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Add Custom Font
        doc.addFileToVFS('SquadaOne.ttf', squadaFont);
        doc.addFont('SquadaOne.ttf', 'SquadaOne', 'normal');

        // 2. Background Frame Color (Light warm sand color)
        doc.setFillColor(248, 244, 240);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Draw geometric Swirls/Texture lines (Simple approximate background)
        doc.setDrawColor(241, 235, 228);
        doc.setLineWidth(20);
        doc.line(-10, -10, pageWidth + 20, pageHeight - 50);
        doc.line(-20, 50, pageWidth - 50, pageHeight + 20);

        // 3. Header Logo (Top Left)
        let didDrawLogo = false;
        let actualLogoWidth = 22; // Default width of the classic initials box

        if (logoObj) {
            let logoMaxWidth = 45;
            let logoMaxHeight = 25;
            let renderW = logoMaxWidth;
            let renderH = renderW * (logoObj.height / logoObj.width);
            if (renderH > logoMaxHeight) {
                renderH = logoMaxHeight;
                renderW = renderH * (logoObj.width / logoObj.height);
            }
            
            actualLogoWidth = renderW; // Store mathematically exact drawn width!

            let logoFormat = 'JPEG';
            const logLw = logoObj.dataUrl.toLowerCase();
            if (logLw.includes('image/png')) logoFormat = 'PNG';
            else if (logLw.includes('image/webp')) logoFormat = 'WEBP';

            try {
                doc.addImage(logoObj.dataUrl, logoFormat, 16, 16, renderW, renderH, undefined, 'NONE');
                didDrawLogo = true;
            } catch (err) {
                console.error("Failed to render custom logo:", err);
            }
        } 
        
        if (!didDrawLogo) {
            doc.setFillColor(114, 98, 85);
            doc.roundedRect(16, 16, 22, 22, 3, 3, 'F');
            const initials = compName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() || "BS";
            doc.setTextColor(255, 255, 255);
            doc.setFont('SquadaOne', 'normal');
            doc.setFontSize(22);
            doc.text(initials, 27, 32, { align: 'center' });
            actualLogoWidth = 22;
        }

        // 4. Company Name
        doc.setTextColor(89, 74, 59); // Dark Brown
        doc.setFontSize(22); // Reduced from 32 to prevent overlaying the right-side contact block
        // Logo starts at X=16. Add the exact width of the logo, plus 8mm of clean whitespace padding!
        const nameX = 16 + actualLogoWidth + 8;
        doc.text(compName.substring(0, 30), nameX, 33);

        // 5. Contact Details (Top Right)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        
        doc.setDrawColor(114, 98, 85);
        const iconX = pageWidth - 63;
        
        // Smart Phone 📱
        doc.setFillColor(114, 98, 85);
        doc.roundedRect(iconX, 14, 3.5, 6, 0.5, 0.5, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(iconX + 1.75, 18.5, 0.4, 'F');
        doc.rect(iconX + 0.5, 14.5, 2.5, 3.5, 'F');
        doc.text(compContact, iconX + 7, 18);

        // Envelope ✉️
        doc.setFillColor(114, 98, 85);
        doc.roundedRect(iconX, 22, 5, 3.5, 0.5, 0.5, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.4);
        doc.line(iconX + 0.5, 22.5, iconX + 2.5, 24); doc.line(iconX + 2.5, 24, iconX + 4.5, 22.5);
        doc.text("support@company.com", iconX + 7, 25);

        // Location Pin 📍
        doc.setFillColor(114, 98, 85);
        doc.circle(iconX + 2.5, 30.5, 1.8, 'F');
        doc.triangle(iconX + 0.9, 30.5, iconX + 4.1, 30.5, iconX + 2.5, 34, 'F');
        doc.setFillColor(255, 255, 255);
        doc.circle(iconX + 2.5, 30.5, 0.7, 'F');
        doc.text(compAddress.substring(0, 40), iconX + 7, 33);

        // 6. Section Ribbon "FINGER PRINT DATA"
        const ribbonColor = '#8c7d6e'; // Mid-brown
        doc.setFillColor(140, 125, 110);
        const ry = 45;
        // Left Ribbon Fold
        doc.triangle(35, ry + 6, 45, ry, 45, ry + 12, 'F');
        // Right Ribbon Fold
        doc.triangle(pageWidth - 35, ry + 6, pageWidth - 45, ry, pageWidth - 45, ry + 12, 'F');
        // Main Ribbon Rect
        doc.rect(45, ry, pageWidth - 90, 12, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("FINGER PRINT DATA", pageWidth / 2, ry + 8, { align: 'center' });

        // 7. Profile Information Details
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const detailsY = 75;
        const col1 = 20;
        const col2 = 65;
        doc.text("Company", col1, detailsY); doc.text(`: ${compName}`, col2, detailsY);
        doc.text("Name", col1, detailsY + 8); doc.text(`: ${record.name}`, col2, detailsY + 8);
        doc.text("Age", col1, detailsY + 16); doc.text(`: ${record.age || 'N/A'}`, col2, detailsY + 16);
        doc.text("Study/Occupation", col1, detailsY + 24); doc.text(`: ${record.study || 'N/A'}`, col2, detailsY + 24);
        doc.text("Father's Name", col1, detailsY + 32); doc.text(`: ${record.fatherName || 'N/A'}`, col2, detailsY + 32);
        doc.text("Contact", col1, detailsY + 40); doc.text(`: ${record.contactDetails || 'N/A'}`, col2, detailsY + 40);
        doc.text("Scan Date", col1, detailsY + 48); doc.text(`: ${new Date(record.scannedAt).toLocaleDateString()}`, col2, detailsY + 48);

        // Divider Line Below Info
        doc.setDrawColor(200, 190, 180);
        doc.setLineWidth(1);
        doc.line(20, detailsY + 56, pageWidth - 20, detailsY + 56);

        let currentY = detailsY + 62;
        const fingers = [
            'Left_Thumb', 'Left_Index', 'Left_Middle', 'Left_Ring', 'Left_Little',
            'Right_Thumb', 'Right_Index', 'Right_Middle', 'Right_Ring', 'Right_Little'
        ];

        const drawPosition = async (sourceContent, positionInfo, xOffset, imgRowY) => {
            if (!sourceContent) return;
            let imgObj = null;

            if (sourceContent.startsWith('/uploads') || sourceContent.startsWith('http')) {
                imgObj = await getBase64ImageFromUrl(sourceContent);
            } else if (sourceContent.startsWith('data:image')) {
                imgObj = await getImageMetadata(sourceContent);
            }

            if (imgObj) {
                const cellWidth = 60;
                const fixedWidth = 50; 
                const fixedHeight = 65; 
                const startX = 14;
                const finalX = startX + xOffset + ((cellWidth - fixedWidth) / 2);
                
                let renderW = fixedWidth;
                let renderH = fixedHeight;

                if (imgObj.width && imgObj.height) {
                    const imgRatio = imgObj.width / imgObj.height;
                    const boxRatio = fixedWidth / fixedHeight;

                    if (imgRatio > boxRatio) {
                        renderW = fixedWidth;
                        renderH = fixedWidth / imgRatio;
                    } else {
                        renderH = fixedHeight;
                        renderW = fixedHeight * imgRatio;
                    }
                }

                const imgX = finalX + (fixedWidth - renderW) / 2;
                const imgY = imgRowY + (fixedHeight - renderH) / 2;
                
                let format = 'JPEG';
                const lowerUrl = imgObj.dataUrl.toLowerCase();
                if (lowerUrl.includes('image/png')) format = 'PNG';
                else if (lowerUrl.includes('image/webp')) format = 'WEBP';
                
                try {
                    doc.addImage(imgObj.dataUrl, format, imgX, imgY, renderW, renderH, undefined, 'NONE');
                } catch(imgErr) {
                    console.error("Failed to inject image into PDF stream:", imgErr);
                }
                
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.rect(finalX, imgRowY, fixedWidth, fixedHeight); 

                doc.setFontSize(10);
                doc.text(positionInfo, startX + xOffset + (cellWidth / 2), imgRowY + fixedHeight + 6, { align: "center" });
            }
        };

        for (const finger of fingers) {
            const p = photosData[finger] || {};

            if (p.Left || p.Center || p.Right) {
                if (currentY > pageHeight - 100) {
                    doc.addPage();
                    doc.setFillColor(248, 244, 240);
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                    currentY = 20;
                }

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text(finger.replace('_', ' '), 14, currentY);
                doc.setFont("helvetica", "normal");

                const imgRowY = currentY + 8;

                if (p.Left) await drawPosition(p.Left, "Left Position", 0, imgRowY);
                if (p.Center) await drawPosition(p.Center, "Center Position", 60, imgRowY);
                if (p.Right) await drawPosition(p.Right, "Right Position", 120, imgRowY);

                currentY += 65 + 16;
            }
        }

        // 8. Footer across all pages
        const pages = doc.internal.getNumberOfPages();
        for (let j = 1; j <= pages; j++) {
            doc.setPage(j);
            
            // Minimalist Divider Line
            doc.setDrawColor(214, 203, 193);
            doc.setLineWidth(0.5);
            doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

            // Left side: Company Details & Page Numbers
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(89, 74, 59);
            doc.text(compName.toUpperCase(), 15, pageHeight - 17);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120, 120, 120);
            doc.text("Generated by Secured Biometric System", 15, pageHeight - 12);
            doc.text(`Page ${j} of ${pages}`, 15, pageHeight - 7);

            // Right side: Official Signature Line
            doc.setDrawColor(89, 74, 59);
            doc.setLineWidth(0.5);
            // Draw a 50mm wide line for the signature
            doc.line(pageWidth - 65, pageHeight - 13, pageWidth - 15, pageHeight - 13); 
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text("Authorized Signature", pageWidth - 40, pageHeight - 8, { align: "center" });
        }

        doc.save(`${record.name}_Fingerprint_Record.pdf`);
        } catch (fatalErr) {
            console.error("CRITICAL PDF GENERATION FAILURE:", fatalErr);
            alert("Error downloading PDF: The data contains an invalid or corrupted file format. Please clear the record and retake it.");
        } finally {
            setDownloadingId(null);
        }
    };

    const displayedRecords = searchName
        ? records.filter(r => {
            const searchVal = searchName.toLowerCase();
            const matchName = r.name?.toLowerCase().includes(searchVal);
            const comp = companies.find(c => c.id === r.companyId);
            const matchCompany = comp ? comp.name.toLowerCase().includes(searchVal) : false;
            return matchName || matchCompany;
        })
        : records;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>All Fingerprint Records</h1>
                    <p>List of all entered biometric profiles with high-quality PDF exports.</p>
                </div>
                {loggedInUser.role === 'Super Admin' && (
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <input 
                            type="text" 
                            className="form-input" 
                            style={{ margin: 0, minWidth: '250px' }}
                            placeholder="Search by Company or Name..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="content-card" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '800px' }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Contact</th>
                            <th>Scan Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedRecords.map(record => (
                            <tr key={record.id}>
                                <td data-label="ID">
                                    <div style={{ fontWeight: 600 }}>#{record.id.slice(-6)}</div>
                                </td>
                                <td data-label="Name">
                                    <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{record.name}</div>
                                </td>
                                <td data-label="Age">
                                    <div>{record.age || '-'}</div>
                                </td>
                                <td data-label="Contact">
                                    <div style={{ fontSize: '0.85rem' }}>{record.contactDetails || '-'}</div>
                                </td>
                                <td data-label="Scan Date">
                                    <div style={{ fontSize: '0.85rem' }}>{new Date(record.scannedAt).toLocaleDateString()}</div>
                                </td>
                                <td data-label="Actions">
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', width: '100%' }}>
                                        <button
                                            onClick={() => window.open(`/fingerprint/view/${record.id}`, '_blank')}
                                            className="btn-primary"
                                            style={{
                                                padding: '0.5rem',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#f1f5f9',
                                                color: '#475569'
                                            }}
                                            title="View Record"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/fingerprint/edit/${record.id}`)}
                                            className="btn-primary"
                                            style={{
                                                padding: '0.5rem',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#fef9c3',
                                                color: '#854d0e'
                                            }}
                                            title="Edit Record"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="btn-primary"
                                        style={{
                                            padding: '0.5rem',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#fee2e2',
                                            color: '#991b1b'
                                        }}
                                        title="Delete Record"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPDF(record)}
                                        disabled={downloadingId === record.id}
                                        className="btn-primary"
                                        style={{
                                            padding: '0.5rem',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: downloadingId === record.id ? 0.7 : 1
                                        }}
                                        title="Download PDF"
                                    >
                                        {downloadingId === record.id ? (
                                            <><Loader2 size={16} className="spinner" style={{ animation: 'spin 2s linear infinite' }} /></>
                                        ) : (
                                            <><Download size={16} /></>
                                        )}
                                    </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {displayedRecords.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem 1rem' }}>No records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
