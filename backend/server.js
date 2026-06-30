if (typeof process !== 'undefined' && !process.getBuiltinModule) {
    process.getBuiltinModule = (name) => require(name);
}
if (typeof global.crypto === 'undefined' || !global.crypto) {
    global.crypto = require('crypto').webcrypto || require('crypto');
}
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto || require('crypto');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Connect to MongoDB
require('./src/config/db');
const { PORT } = require('./src/config/env');
const { authenticateToken, requirePermission } = require('./src/middlewares/authMiddleware');

const authRoutes = require('./src/routes/authRoutes');
const metadataRoutes = require('./src/routes/metadataRoutes');
const stockRoutes = require('./src/routes/stockRoutes');
const movementRoutes = require('./src/routes/movementRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Logging removed because packaged app filesystem is read-only

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: false // disabled to allow inline scripts in frontend-demo for now
}));
app.use(cors());
app.use(express.json());

// Rate Limiting to prevent Brute-Force and DDOS
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.'
});
app.use('/api/', apiLimiter);

// Auth Login Limiter (Stricter)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 login requests per windowMs
    message: 'Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.'
});

// API Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

app.use('/api/users', authenticateToken, userRoutes); // requireAdmin is inside userRoutes
app.use('/api/metadata', authenticateToken, metadataRoutes); 
app.use('/api/stocks', authenticateToken, requirePermission('stocks'), stockRoutes);
app.use('/api/movements', authenticateToken, requirePermission('movements'), movementRoutes);
app.use('/api/sales', authenticateToken, requirePermission('sales'), saleRoutes);

// System Shutdown Endpoint
app.post('/api/system/shutdown', (req, res) => {
    res.json({ success: true, message: 'Sistem kapatılıyor...' });
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

// Static Serving for Frontend
let frontendPath = path.join(__dirname, 'frontend-demo');
if (!fs.existsSync(frontendPath)) {
    frontendPath = path.resolve(__dirname, '../frontend-demo');
}
app.use(express.static(frontendPath));

// Fallback to index.html for SPA routing
app.use((req, res, next) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Server is running on ${url}`);
});
