const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '200mb' }));
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
    res.status(200).json({ message: 'Login successful', token: 'fake-jwt-token', user });
});

// Company / Users Mock Routes
app.post('/api/companies', (req, res) => {
    const company = { id: Date.now().toString(), ...req.body };
    db.companies.push(company);
    saveDb();
    res.status(201).json({ message: 'Company created', company });
});
app.get('/api/companies', (req, res) => {
    const { companyId } = req.query;
    let filtered = db.companies;
    if (companyId) {
        filtered = filtered.filter(c => c.id === companyId);
    }
    res.status(200).json(filtered);
});

app.post('/api/users', (req, res) => {
    const { name, email, password, role, companyId, permissions } = req.body;

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role: role || 'User',
        companyId: companyId || null,
        permissions: permissions || []
    };
    db.users.push(newUser);
    saveDb();
    res.status(201).json({ message: 'User created successfully', user: newUser });
});

// Edit user
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ message: 'User not found' });

    // Merge new fields
    db.users[index] = { ...db.users[index], ...req.body };
    saveDb();
    res.status(200).json({ message: 'User updated', user: db.users[index] });
});

app.get('/api/users', (req, res) => {
    const { companyId } = req.query;
    let filtered = db.users;
    if (companyId) {
        filtered = filtered.filter(u => u.companyId === companyId);
    }
    res.status(200).json(filtered);
});

// Real Fingerprint API
app.post('/api/fingerprints', (req, res) => {
    const { name, age, study, fatherName, contactDetails, photos, userId, companyId } = req.body;

    const recordId = Date.now().toString();
    const dirPath = path.join(__dirname, 'uploads', 'fingerprints', name.replace(/\s+/g, '_') + '_' + recordId);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const savedPhotosPaths = {};

    // photos corresponds to { ThumbL: { left: base64, center: base64, right: base64 }, ... }
    if (photos && typeof photos === 'object') {
        Object.keys(photos).forEach(finger => {
            savedPhotosPaths[finger] = {};
            const positions = photos[finger];
            Object.keys(positions).forEach(pos => {
                if (positions[pos]) {
                    const fileName = `${finger}_${pos}`;
                    const relativePath = saveBase64Image(positions[pos], dirPath, fileName);
                    if (relativePath) {
                        // Save just the relative URL for the DB
                        savedPhotosPaths[finger][pos] = `/uploads/fingerprints/${name.replace(/\s+/g, '_')}_${recordId}/${fileName}.jpg`;
                    }
                }
            });
        });
    }

    const fp = {
        id: recordId,
        userId: userId || 'anonymous',
        companyId: companyId || 'unassigned',
        name, age, study, fatherName, contactDetails,
        photos: savedPhotosPaths,
        scannedAt: new Date()
    };

    db.fingerprints.push(fp);
    saveDb();
    res.status(201).json({ message: 'Fingerprints record added successfully', fingerprint: fp });
});

app.get('/api/fingerprints', (req, res) => {
    const { companyId, userId } = req.query;
    let filtered = db.fingerprints;

    if (companyId) {
        filtered = filtered.filter(f => f.companyId === companyId);
    }
    if (userId) {
        filtered = filtered.filter(f => f.userId === userId);
    }

    res.status(200).json(filtered);
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(path.join(distPath, 'index.html'));
    } else {
        next();
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
