import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Signs/verifies login tokens. Falls back to a random secret generated at
// startup (rather than a hardcoded one) since this repo is public — a fixed
// fallback would let anyone forge a token for any user id. Set AUTH_SECRET in
// .env so logins survive a server restart instead of everyone being signed out.
let AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
    AUTH_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('AUTH_SECRET not set in .env — using a random secret for this run. Every user will need to log in again after the next restart until AUTH_SECRET is set.');
}

const signToken = (userId) => {
    const sig = crypto.createHmac('sha256', AUTH_SECRET).update(userId).digest('hex');
    return `${userId}.${sig}`;
};

const verifyToken = (token) => {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const idx = token.lastIndexOf('.');
    const userId = token.slice(0, idx);
    const sig = token.slice(idx + 1);
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(userId).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    return userId;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
// Photos are uploaded one-by-one as binary to /upload-single, so JSON bodies
// only ever carry small form data + image URLs. Keep these limits modest to
// protect the 1GB EC2 box from memory spikes (was 500mb, which risked OOM).
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JSON Database File persistence
const DB_FILE = path.join(__dirname, 'database.json');

let db = {
    users: [
        {
            id: 'super-admin',
            name: 'Super Admin',
            email: 'superadmin@manasmantra.com',
            password: 'admin',
            role: 'Super Admin',
            permissions: ['all'],
            companyId: 'all'
        }
    ],
    companies: [],
    fingerprints: []
};

if (fs.existsSync(DB_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        console.error("Error reading db file", e);
    }
} else {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const saveDb = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

// Helper to save base64 image
const saveBase64Image = (base64Str, dirPath, fileName) => {
    if (!base64Str) return null;
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const imgBuffer = Buffer.from(matches[2], 'base64');
    const filePath = path.join(dirPath, fileName + '.jpg');
    fs.writeFileSync(filePath, imgBuffer);
    return filePath;
};

// Auth routes (mocked)
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    const newUser = { id: Date.now().toString(), name, email, password };
    db.users.push(newUser);
    saveDb();
    res.status(201).json({ message: 'User registered successfully', user: newUser });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.status(200).json({ message: 'Login successful', token: signToken(user.id), user });
});

// Every route below this line requires a valid token, and non-Super-Admin
// users are confined to their own companyId — enforced here server-side
// rather than trusted from client-sent query params/body, since either can
// be edited freely in the browser (devtools/curl) regardless of what the UI shows.
const authenticate = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const userId = token && verifyToken(token);
    const user = userId ? db.users.find(u => u.id === userId) : null;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    req.authUser = user;
    next();
};
app.use('/api', authenticate);

// Company / Users Mock Routes
app.post('/api/companies', (req, res) => {
    const company = { id: Date.now().toString(), ...req.body };
    db.companies.push(company);
    saveDb();
    res.status(201).json({ message: 'Company created', company });
});
app.get('/api/companies', (req, res) => {
    const isSuperAdmin = req.authUser.role === 'Super Admin';
    // Non-Super-Admin can only ever see their own company, regardless of what
    // companyId the request asks for.
    const companyId = isSuperAdmin ? req.query.companyId : req.authUser.companyId;
    let filtered = db.companies;
    if (companyId) {
        filtered = filtered.filter(c => c.id === companyId);
    }
    res.status(200).json(filtered);
});

app.put('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const isSuperAdmin = req.authUser.role === 'Super Admin';
    if (!isSuperAdmin && req.authUser.companyId !== id) {
        return res.status(403).json({ message: 'You do not have access to this company' });
    }
    const index = db.companies.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ message: 'Company not found' });
    db.companies[index] = { ...db.companies[index], ...req.body };
    saveDb();
    res.status(200).json({ message: 'Company updated', company: db.companies[index] });
});

app.post('/api/users', (req, res) => {
    const { name, email, password, role, companyId, permissions } = req.body;
    const isSuperAdmin = req.authUser.role === 'Super Admin';

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role: role || 'User',
        // A non-Super-Admin can only ever create users inside their own company,
        // no matter what companyId the request body claims.
        companyId: isSuperAdmin ? (companyId || null) : req.authUser.companyId,
        permissions: permissions || []
    };
    db.users.push(newUser);
    saveDb();
    res.status(201).json({ message: 'User created successfully', user: newUser });
});

// Edit user
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const isSuperAdmin = req.authUser.role === 'Super Admin';
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ message: 'User not found' });
    if (!isSuperAdmin && db.users[index].companyId !== req.authUser.companyId) {
        return res.status(403).json({ message: 'You do not have access to this user' });
    }

    // Merge new fields, but a non-Super-Admin can't move a user to a different company.
    const update = { ...req.body };
    if (!isSuperAdmin) delete update.companyId;
    db.users[index] = { ...db.users[index], ...update };
    saveDb();
    res.status(200).json({ message: 'User updated', user: db.users[index] });
});

app.get('/api/users', (req, res) => {
    const isSuperAdmin = req.authUser.role === 'Super Admin';
    const companyId = isSuperAdmin ? req.query.companyId : req.authUser.companyId;
    let filtered = db.users;
    if (companyId) {
        filtered = filtered.filter(u => u.companyId === companyId);
    }
    res.status(200).json(filtered);
});

// Upload single photo immediately.
// The client compresses each image and sends it as raw binary (image/jpeg)
// instead of base64 JSON — this avoids the ~33% base64 inflation that pushed
// payloads past the proxy's 1MB limit and caused HTTP 413 errors.
app.post('/api/fingerprints/upload-single', express.raw({ type: '*/*', limit: '25mb' }), (req, res) => {
    try {
        const imgBuffer = req.body;
        if (!imgBuffer || !imgBuffer.length) {
            return res.status(400).json({ message: 'No image provided' });
        }

        const tempDir = path.join(__dirname, 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = `fp_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, imgBuffer);

        const url = `/uploads/temp/${fileName}`;
        res.status(200).json({ url });
    } catch (error) {
        console.error("Single upload error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Real Fingerprint API
app.post('/api/fingerprints', (req, res) => {
    try {
        const { name, gender, birthDate, city, study, fatherName, contactDetails, photos, userId } = req.body;
        const isSuperAdmin = req.authUser.role === 'Super Admin';
        // A non-Super-Admin can only ever file a record under their own company.
        const companyId = isSuperAdmin ? (req.body.companyId || 'unassigned') : req.authUser.companyId;

        const recordId = Date.now().toString();
        const dirPath = path.join(__dirname, 'uploads', 'fingerprints', name.replace(/\s+/g, '_') + '_' + recordId);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const collectionFileName = 'collection.json';
        let photosUrl = null;

        if (photos && typeof photos === 'object') {
            const collectionPath = path.join(dirPath, collectionFileName);
            // Save all 30 uncompressed photos into a single JSON "collection" to bypass slow network loading!
            fs.writeFileSync(collectionPath, JSON.stringify(photos));
            photosUrl = `/uploads/fingerprints/${name.replace(/\s+/g, '_')}_${recordId}/${collectionFileName}`;
        }

        const fp = {
            id: recordId,
            userId: userId || 'anonymous',
            companyId: companyId || 'unassigned',
            name, gender, birthDate, city, study, fatherName, contactDetails,
            photosUrl: photosUrl,
            photos: {}, // Retained empty for backwards compatibility shape
            scannedAt: new Date()
        };

        db.fingerprints.push(fp);
        saveDb();
        res.status(201).json({ message: 'Fingerprints record added successfully', fingerprint: fp });
    } catch (error) {
        console.error("FATAL FINGERPRINT POST ERROR:", error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});

app.get('/api/fingerprints', (req, res) => {
    const isSuperAdmin = req.authUser.role === 'Super Admin';
    const companyId = isSuperAdmin ? req.query.companyId : req.authUser.companyId;
    const { userId } = req.query;
    let filtered = db.fingerprints;

    if (companyId) {
        filtered = filtered.filter(f => f.companyId === companyId);
    }
    if (userId) {
        filtered = filtered.filter(f => f.userId === userId);
    }

    res.status(200).json(filtered);
});

app.get('/api/fingerprints/:id', (req, res) => {
    const record = db.fingerprints.find(f => f.id === req.params.id);
    if (!record) return res.status(404).json({ message: 'Fingerprint record not found' });
    if (req.authUser.role !== 'Super Admin' && record.companyId !== req.authUser.companyId) {
        return res.status(403).json({ message: 'You do not have access to this record' });
    }
    res.status(200).json(record);
});

app.put('/api/fingerprints/:id', (req, res) => {
    const { id } = req.params;
    const isSuperAdmin = req.authUser.role === 'Super Admin';
    const index = db.fingerprints.findIndex(f => f.id === id);
    if (index === -1) return res.status(404).json({ message: 'Fingerprint record not found' });
    if (!isSuperAdmin && db.fingerprints[index].companyId !== req.authUser.companyId) {
        return res.status(403).json({ message: 'You do not have access to this record' });
    }

    // A non-Super-Admin can't move a record to a different company.
    const update = { ...req.body };
    if (!isSuperAdmin) delete update.companyId;
    db.fingerprints[index] = { ...db.fingerprints[index], ...update, updatedAt: new Date() };
    saveDb();
    res.status(200).json({ message: 'Fingerprint record updated', fingerprint: db.fingerprints[index] });
});

app.delete('/api/fingerprints/:id', (req, res) => {
    const { id } = req.params;
    const isSuperAdmin = req.authUser.role === 'Super Admin';
    const index = db.fingerprints.findIndex(f => f.id === id);
    if (index === -1) return res.status(404).json({ message: 'Fingerprint record not found' });
    if (!isSuperAdmin && db.fingerprints[index].companyId !== req.authUser.companyId) {
        return res.status(403).json({ message: 'You do not have access to this record' });
    }

    // Optionally delete the physical folder too
    const record = db.fingerprints[index];
    const dirPath = path.join(__dirname, 'uploads', 'fingerprints', record.name.replace(/\s+/g, '_') + '_' + record.id);
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }

    db.fingerprints.splice(index, 1);
    saveDb();
    res.status(200).json({ message: 'Fingerprint record deleted successfully' });
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '../frontend/dist');
// Content-hashed build assets (filename changes whenever content does) can be cached forever.
app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true
}));
// index.html / sw.js / registerSW.js / manifest must always be revalidated so browsers
// pick up the current asset hashes right after a deploy instead of a stale reference.
app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
        if (/\.(html|webmanifest)$/.test(filePath) || /\/(sw|registerSW)\.js$/.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.set('Cache-Control', 'no-cache');
        res.sendFile(path.join(distPath, 'index.html'));
    } else {
        next();
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));
