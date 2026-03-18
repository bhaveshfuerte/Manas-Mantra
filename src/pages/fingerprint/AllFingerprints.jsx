import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import { squadaFont } from './font';

export default function AllFingerprints() {
    const [records, setRecords] = useState([]);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {

        let loggedInUser = {};
        try {
            loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
        } catch (e) {
            console.error("User object in localStorage is corrupted");
        }

        let url = `/api/fingerprints`;

        if (loggedInUser.role === 'Admin' || loggedInUser.role === 'User') {
            url += `?companyId=${loggedInUser.companyId}`;
        }
        // Super Admins pull all records implicitly

        fetch(url)
            .then(res => res.json())
            .then(data => setRecords(data))
            .catch(err => console.error("Error fetching fingerprints", err));
    }, []);

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

    const handleDownloadPDF = async (record) => {
        setDownloadingId(record.id);
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
        const primaryBrownColor = '#594a3b';
        doc.setFillColor(114, 98, 85);
        doc.setDrawColor(114, 98, 85);
        doc.setLineWidth(1.5);

        // Custom simple geometric logo similar to the given swirl
        const cx = 25, cy = 25, r1 = 8, r2 = 14;
        doc.circle(cx, cy, 3, 'F');
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const xOffset = Math.cos(angle) * r1;
            const yOffset = Math.sin(angle) * r1;
            const edgeX = Math.cos(angle) * r2;
            const edgeY = Math.sin(angle) * r2;
            doc.line(cx + xOffset, cy + yOffset, cx + edgeX, cy + edgeY);
            doc.ellipse(cx + (xOffset * 1.4), cy + (yOffset * 1.4), 2, 4, 'F', (i * 60) + 90);
        }

        // 4. Company Name
        doc.setTextColor(89, 74, 59); // Dark Brown
        doc.setFont('SquadaOne', 'normal');
        doc.setFontSize(38);
        doc.text("Company Name", 45, 30);

        // 5. Contact Details (Top Right)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        const rightAlign = pageWidth - 14;
        // Mock icons using simple shapes
        doc.rect(pageWidth - 62, 14, 3, 5, 'S'); // Phone icon box
        doc.text("123-456-7890", pageWidth - 56, 18);

        doc.rect(pageWidth - 62, 22, 5, 3.5, 'S'); // Mail icon box
        doc.line(pageWidth - 62, 22, pageWidth - 59.5, 24); doc.line(pageWidth - 59.5, 24, pageWidth - 57, 22);
        doc.text("hello@reallygreatsite.com", pageWidth - 56, 25);

        doc.rect(pageWidth - 62, 30, 4, 4, 'S'); doc.triangle(pageWidth - 64, 30, pageWidth - 60, 27, pageWidth - 56, 30, 'S'); // Home icon
        doc.text("123 Anywhere St., Any City", pageWidth - 56, 33);

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
        doc.text("Name", col1, detailsY); doc.text(`: ${record.name}`, col2, detailsY);
        doc.text("Age", col1, detailsY + 8); doc.text(`: ${record.age || 'N/A'}`, col2, detailsY + 8);
        doc.text("Study/Occupation", col1, detailsY + 16); doc.text(`: ${record.study || 'N/A'}`, col2, detailsY + 16);
        doc.text("Father's Name", col1, detailsY + 24); doc.text(`: ${record.fatherName || 'N/A'}`, col2, detailsY + 24);
        doc.text("Contact", col1, detailsY + 32); doc.text(`: ${record.contactDetails || 'N/A'}`, col2, detailsY + 32);
        doc.text("Scan Date", col1, detailsY + 40); doc.text(`: ${new Date(record.scannedAt).toLocaleDateString()}`, col2, detailsY + 40);

        // Divider Line Below Info
        doc.setDrawColor(200, 190, 180);
        doc.setLineWidth(1);
        doc.line(20, detailsY + 48, pageWidth - 20, detailsY + 48);

        let currentY = detailsY + 60;
        const fingers = [
            'Left_Little', 'Left_Ring', 'Left_Middle', 'Left_Index', 'Left_Thumb',
            'Right_Thumb', 'Right_Index', 'Right_Middle', 'Right_Ring', 'Right_Little'
        ];

        for (const finger of fingers) {
            const p = record.photos?.[finger] || {};

            if (p.Left || p.Center || p.Right) {
                // Add new page if Y is getting too low
                if (currentY > pageHeight - 50) {
                    doc.addPage();
                    // Redraw background & footer on sequence pages
                    doc.setFillColor(248, 244, 240);
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                    currentY = 20;
                }

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text(finger.replace('_', ' '), 14, currentY);
                doc.setFont("helvetica", "normal");

                currentY += 8; // Move down for images

                let startX = 14;
                const cellWidth = 55;
                const maxWidth = 55;
                const maxHeight = 70;
                let maxRowHeightUsed = 0;

                const drawPosition = async (url, positionInfo, xOffset) => {
                    const imgObj = await getBase64ImageFromUrl(url);
                    if (imgObj) {
                        let renderWidth = maxWidth;
                        let renderHeight = renderWidth * (imgObj.height / imgObj.width);

                        // Limit height to maxHeight to prevent page overflow
                        if (renderHeight > maxHeight) {
                            renderHeight = maxHeight;
                            renderWidth = renderHeight * (imgObj.width / imgObj.height);
                        }

                        const finalX = startX + xOffset + ((cellWidth - renderWidth) / 2);
                        doc.addImage(imgObj.dataUrl, 'JPEG', finalX, currentY, renderWidth, renderHeight);

                        doc.setFontSize(10);
                        doc.text(positionInfo, startX + xOffset + (cellWidth / 2), currentY + renderHeight + 6, { align: "center" });

                        if (renderHeight > maxRowHeightUsed) maxRowHeightUsed = renderHeight;
                    }
                };

                if (p.Left) await drawPosition(p.Left, "Left Position", 0);
                if (p.Center) await drawPosition(p.Center, "Center Position", 60);
                if (p.Right) await drawPosition(p.Right, "Right Position", 120);

                if (maxRowHeightUsed === 0) maxRowHeightUsed = 40;
                currentY += maxRowHeightUsed + 16;
            }
        }

        // 8. Footer across all pages
        const pages = doc.internal.getNumberOfPages();
        for (let j = 1; j <= pages; j++) {
            doc.setPage(j);
            // Footer shadow background line
            doc.setDrawColor(214, 203, 193);
            doc.setLineWidth(6);
            doc.line(0, pageHeight, pageWidth, pageHeight);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(89, 74, 59);
            doc.text("[COMPANY NAME]", pageWidth / 2, pageHeight - 15, { align: "center" });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text("CEO", pageWidth / 2, pageHeight - 10, { align: "center" });
        }

        doc.save(`${record.name}_Fingerprint_Record.pdf`);
        setDownloadingId(null);
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <h1>All Fingerprint Records</h1>
                <p>List of all entered biometric profiles with high-quality PDF exports.</p>
            </div>

            <div className="content-card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
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
                        {records.map(record => (
                            <tr key={record.id}>
                                <td data-label="ID">{record.id.slice(-6)}</td>
                                <td data-label="Name"><strong>{record.name}</strong></td>
                                <td data-label="Age">{record.age || '-'}</td>
                                <td data-label="Contact">{record.contactDetails || '-'}</td>
                                <td data-label="Scan Date">{new Date(record.scannedAt).toLocaleDateString()}</td>
                                <td data-label="Actions">
                                    <button
                                        onClick={() => handleDownloadPDF(record)}
                                        disabled={downloadingId === record.id}
                                        className="btn-primary"
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            fontSize: '0.8rem',
                                            width: 'auto',
                                            display: 'flex',
                                            gap: '4px',
                                            alignItems: 'center',
                                            opacity: downloadingId === record.id ? 0.7 : 1
                                        }}
                                    >
                                        {downloadingId === record.id ? (
                                            <><Loader2 size={14} className="spinner" style={{ animation: 'spin 2s linear infinite' }} /> Generating PDF...</>
                                        ) : (
                                            <><Download size={14} /> Download PDF</>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {records.length === 0 && (
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
