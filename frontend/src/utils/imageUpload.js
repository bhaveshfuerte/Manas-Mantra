// Shared image compression + single-image upload helpers.
//
// Goal: keep every per-photo upload small enough to never hit the live
// server's ~1MB proxy body limit (the old base64 JSON path inflated payloads
// by ~33% and regularly tripped HTTP 413 "Payload Too Large"). We compress on
// the client to a bounded JPEG and send it as raw binary (no base64), so each
// upload stays well under the limit and is fast to transfer.

const MAX_DIM = 1600;                 // longest edge in px — plenty for fingerprints
const TARGET_BYTES = 900 * 1024;      // keep safely under the 1MB proxy limit

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// Accepts a File/Blob (file input) or a data-URL string (webcam screenshot)
// and returns a compressed JPEG Blob bounded by MAX_DIM and TARGET_BYTES.
export async function compressToBlob(source, { maxDim = MAX_DIM, targetBytes = TARGET_BYTES } = {}) {
    const dataUrl = typeof source === 'string' ? source : await fileToDataUrl(source);
    const img = await loadImage(dataUrl);

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    const longest = Math.max(width, height);
    if (longest > maxDim) {
        const scale = maxDim / longest;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const toBlob = (quality) =>
        new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

    // Step the quality down until the encoded size fits the target.
    let quality = 0.85;
    let blob = await toBlob(quality);
    while (blob && blob.size > targetBytes && quality > 0.4) {
        quality -= 0.1;
        blob = await toBlob(quality);
    }

    // Last resort for unusually dense images: shrink dimensions once more.
    if (blob && blob.size > targetBytes) {
        canvas.width = Math.round(width * 0.7);
        canvas.height = Math.round(height * 0.7);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        blob = await toBlob(0.8);
    }

    return blob;
}

// Compress (if needed) and upload a single image as raw binary.
// Returns the server URL of the stored image.
export async function uploadSingleImage(source) {
    const blob = source instanceof Blob && source.type === 'image/jpeg' && source.size <= TARGET_BYTES
        ? source
        : await compressToBlob(source);

    const res = await fetch('/api/fingerprints/upload-single', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob
    });
    if (!res.ok) throw new Error(`Failed to upload image (status ${res.status})`);
    const data = await res.json();
    return data.url;
}
