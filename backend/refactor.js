const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, 'src');

const dirs = [
    'config',
    'middlewares',
    'repositories',
    'services',
    'controllers',
    'routes'
];

dirs.forEach(d => {
    fs.mkdirSync(path.join(baseDir, d), { recursive: true });
});

const files = {
    'config/db.js': `const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database', err);
    else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        db.run(\`CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, value TEXT)\`);
        db.run(\`CREATE TABLE IF NOT EXISTS stocks (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT, brand TEXT, model TEXT, size TEXT, season TEXT, dot TEXT, minQty INTEGER, warehouse TEXT, location TEXT, qty INTEGER)\`);
        db.run(\`CREATE TABLE IF NOT EXISTS movements (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, sku TEXT, brand TEXT, model TEXT, warehouse TEXT, qty INTEGER, date TEXT)\`);
        db.run(\`CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, customerName TEXT, customerPhone TEXT, sku TEXT, brand TEXT, model TEXT, qty INTEGER, price REAL, date TEXT)\`);
        db.run(\`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password_hash TEXT, role TEXT)\`);

        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                const adminHash = bcrypt.hashSync('adana01', 10);
                db.run("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ['çapraz', adminHash, 'admin']);
            }
        });

        db.get("SELECT COUNT(*) as count FROM metadata", (err, row) => {
            if (row && row.count === 0) {
                const seedData = [
                    { cat: 'brands', val: 'Michelin' }, { cat: 'brands', val: 'Continental' }, { cat: 'brands', val: 'Pirelli' },
                    { cat: 'models', val: 'Pilot Sport 4' }, { cat: 'models', val: 'Primacy 4' },
                    { cat: 'sizes', val: '195/65 R15' }, { cat: 'sizes', val: '225/45 R17' },
                    { cat: 'seasons', val: 'Yaz' }, { cat: 'seasons', val: 'Kış' }, { cat: 'seasons', val: 'Dört Mevsim' },
                    { cat: 'warehouses', val: 'TK 1' }, { cat: 'warehouses', val: 'TK 2' }
                ];
                const stmt = db.prepare("INSERT INTO metadata (category, value) VALUES (?, ?)");
                seedData.forEach(item => stmt.run(item.cat, item.val));
                stmt.finalize();
            }
        });
    });
}

module.exports = db;`,

    'config/env.js': `module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'yildizlar-super-secret-key-2026'
};`,

    'middlewares/authMiddleware.js': `const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.status(401).json({ error: 'Oturum bulunamadı. Lütfen giriş yapın.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Oturum süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.' });
        req.user = user;
        next();
    });
};

exports.requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Bu işlem için admin yetkisi gereklidir.' });
    }
};`,

    'repositories/userRepository.js': `const db = require('../config/db');

exports.findByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};`,

    'services/authService.js': `const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

exports.login = async (username, password) => {
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error('Hatalı kullanıcı adı veya şifre!');

    const validPass = bcrypt.compareSync(password, user.password_hash);
    if (!validPass) throw new Error('Hatalı kullanıcı adı veya şifre!');

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    return { token, role: user.role, username: user.username };
};`,

    'controllers/authController.js': `const authService = require('../services/authService');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};`,

    'routes/authRoutes.js': `const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

module.exports = router;`,

    'repositories/metadataRepository.js': `const db = require('../config/db');

exports.getAll = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM metadata", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

exports.add = (category, value) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO metadata (category, value) VALUES (?, ?)", [category, value], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

exports.remove = (category, value) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM metadata WHERE category = ? AND value = ?", [category, value], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
};`,

    'services/metadataService.js': `const metadataRepository = require('../repositories/metadataRepository');

exports.getAllMetadata = async () => {
    const rows = await metadataRepository.getAll();
    const metadata = { brands: [], models: [], sizes: [], seasons: [], warehouses: [] };
    rows.forEach(r => {
        if (metadata[r.category]) metadata[r.category].push(r.value);
    });
    return metadata;
};

exports.addMetadataItem = async (category, item) => {
    return await metadataRepository.add(category, item);
};

exports.removeMetadataItem = async (category, item) => {
    await metadataRepository.remove(category, item);
};`,

    'controllers/metadataController.js': `const metadataService = require('../services/metadataService');

exports.getAll = async (req, res) => {
    try {
        const metadata = await metadataService.getAllMetadata();
        res.json(metadata);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.add = async (req, res) => {
    try {
        const { category, item } = req.body;
        const id = await metadataService.addMetadataItem(category, item);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { category, item } = req.body;
        await metadataService.removeMetadataItem(category, item);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};`,

    'routes/metadataRoutes.js': `const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadataController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', metadataController.getAll);
router.post('/', requireAdmin, metadataController.add);
router.delete('/', requireAdmin, metadataController.remove);

module.exports = router;`,

    'repositories/stockRepository.js': `const db = require('../config/db');

exports.getAll = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM stocks", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
};

exports.findBySkuAndWarehouse = (sku, warehouse) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM stocks WHERE sku = ? AND warehouse = ?", [sku, warehouse], (err, row) => {
            if (err) reject(err); else resolve(row);
        });
    });
};

exports.updateQuantity = (id, newQty, dot = null) => {
    return new Promise((resolve, reject) => {
        let query = "UPDATE stocks SET qty = ? WHERE id = ?";
        let params = [newQty, id];
        if (dot !== null) {
            query = "UPDATE stocks SET dot = ?, qty = ? WHERE id = ?";
            params = [dot, newQty, id];
        }
        db.run(query, params, function(err) {
            if (err) reject(err); else resolve();
        });
    });
};

exports.insert = (stockData) => {
    return new Promise((resolve, reject) => {
        db.run(\`INSERT INTO stocks (sku, brand, model, size, season, dot, minQty, warehouse, location, qty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
                [stockData.sku, stockData.brand, stockData.model, stockData.size, stockData.season, stockData.dot, stockData.minQty, stockData.warehouse, stockData.location, stockData.qty],
                function(err) {
            if (err) reject(err); else resolve(this.lastID);
        });
    });
};

exports.updateDetails = (sku, warehouse, details) => {
    return new Promise((resolve, reject) => {
        db.run(\`UPDATE stocks SET brand=?, model=?, size=?, season=?, dot=?, location=?, qty=?, minQty=? 
                WHERE sku=? AND warehouse=?\`,
                [details.brand, details.model, details.size, details.season, details.dot, details.location, details.qty, details.minQty, sku, warehouse], function(err) {
            if (err) reject(err); else resolve();
        });
    });
};

exports.remove = (sku, warehouse) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM stocks WHERE sku=? AND warehouse=?", [sku, warehouse], function(err) {
            if (err) reject(err); else resolve();
        });
    });
};`,

    'repositories/movementRepository.js': `const db = require('../config/db');

exports.getAll = (type) => {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM movements ORDER BY id DESC";
        let params = [];
        if (type && type !== 'ALL') {
            query = "SELECT * FROM movements WHERE type = ? ORDER BY id DESC";
            params.push(type);
        }
        db.all(query, params, (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
};

exports.insert = (mov) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO movements (type, sku, brand, model, warehouse, qty, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [mov.type, mov.sku, mov.brand, mov.model, mov.warehouse, mov.qty, mov.date], function(err) {
            if (err) reject(err); else resolve(this.lastID);
        });
    });
};`,

    'services/stockService.js': `const stockRepository = require('../repositories/stockRepository');
const movementRepository = require('../repositories/movementRepository');

const getDateStr = () => {
    const now = new Date();
    return \`\${now.getDate().toString().padStart(2,'0')}.\${(now.getMonth()+1).toString().padStart(2,'0')}.\${now.getFullYear()} \${now.getHours().toString().padStart(2,'0')}:\${now.getMinutes().toString().padStart(2,'0')}\`;
};

exports.getAllStocks = async () => {
    return await stockRepository.getAll();
};

exports.updateStockDetails = async (sku, warehouse, newDetails) => {
    await stockRepository.updateDetails(sku, warehouse, newDetails);
    
    // Log EDIT movement
    await movementRepository.insert({
        type: 'EDIT', sku, brand: newDetails.brand, model: newDetails.model, 
        warehouse, qty: newDetails.qty, date: getDateStr()
    });
};

exports.deleteStock = async (sku, warehouse) => {
    await stockRepository.remove(sku, warehouse);
};

exports.processMovement = async (mov) => {
    mov.brand = mov.brand || 'Bilinmiyor';
    mov.model = mov.model || '-';
    mov.date = getDateStr();

    await movementRepository.insert(mov);
    const existing = await stockRepository.findBySkuAndWarehouse(mov.sku, mov.warehouse);

    if (mov.type === 'IN') {
        if (existing) {
            const newQty = existing.qty + parseInt(mov.qty);
            await stockRepository.updateQuantity(existing.id, newQty, mov.dot || null);
        } else {
            await stockRepository.insert({
                sku: mov.sku, brand: mov.brand, model: mov.model, size: mov.size, 
                season: mov.season, dot: mov.dot, minQty: mov.minQty || 10, 
                warehouse: mov.warehouse, location: mov.location, qty: mov.qty
            });
        }
    } else if (mov.type === 'OUT') {
        if (existing) {
            const newQty = Math.max(0, existing.qty - parseInt(mov.qty));
            await stockRepository.updateQuantity(existing.id, newQty);
        } else {
            await stockRepository.insert({
                sku: mov.sku, brand: mov.brand, model: mov.model, size: '-', 
                season: '-', dot: '-', minQty: 10, 
                warehouse: mov.warehouse, location: mov.location || '-', qty: 0
            });
        }
    }
};

exports.bulkUpload = async (count) => {
    for(let i=0; i<count; i++) {
        const reqBody = {
            type: 'IN', sku: \`BLK-00\${i+1}\`, brand: 'Falken', model: 'Azenis', size: '235/45 R18',
            season: 'Yaz', dot: '1224', minQty: 10, warehouse: 'TK 1', location: \`Bulk-Raf-\${i}\`, qty: 20
        };
        await this.processMovement(reqBody);
    }
};`,

    'controllers/stockController.js': `const stockService = require('../services/stockService');

exports.getAll = async (req, res) => {
    try {
        const stocks = await stockService.getAllStocks();
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { sku, warehouse, newDetails } = req.body;
        await stockService.updateStockDetails(sku, warehouse, newDetails);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { sku, warehouse } = req.body;
        await stockService.deleteStock(sku, warehouse);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};`,

    'routes/stockRoutes.js': `const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', stockController.getAll);
router.put('/', requireAdmin, stockController.update);
router.delete('/', requireAdmin, stockController.remove);

module.exports = router;`,

    'controllers/movementController.js': `const stockService = require('../services/stockService');
const movementRepository = require('../repositories/movementRepository');

exports.getAll = async (req, res) => {
    try {
        const type = req.query.type || 'ALL';
        const rows = await movementRepository.getAll(type);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.process = async (req, res) => {
    try {
        await stockService.processMovement(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.bulkUpload = async (req, res) => {
    try {
        const count = req.body.count || 5;
        await stockService.bulkUpload(count);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};`,

    'routes/movementRoutes.js': `const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', movementController.getAll);
router.post('/', movementController.process);
router.post('/bulkUpload', requireAdmin, movementController.bulkUpload);

module.exports = router;`,

    'repositories/saleRepository.js': `const db = require('../config/db');

exports.getAll = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM sales ORDER BY id DESC", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
};

exports.insert = (sale) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO sales (customerName, customerPhone, sku, brand, model, qty, price, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [sale.customerName, sale.customerPhone, sale.sku, sale.brand, sale.model, sale.qty, sale.price, sale.date], function(err) {
            if (err) reject(err); else resolve(this.lastID);
        });
    });
};`,

    'services/saleService.js': `const saleRepository = require('../repositories/saleRepository');
const stockRepository = require('../repositories/stockRepository');
const movementRepository = require('../repositories/movementRepository');

const getDateStr = () => {
    const now = new Date();
    return \`\${now.getDate().toString().padStart(2,'0')}.\${(now.getMonth()+1).toString().padStart(2,'0')}.\${now.getFullYear()} \${now.getHours().toString().padStart(2,'0')}:\${now.getMinutes().toString().padStart(2,'0')}\`;
};

exports.getAllSales = async () => {
    return await saleRepository.getAll();
};

exports.processSale = async (s) => {
    const dateStr = getDateStr();
    const stock = await stockRepository.findBySkuAndWarehouse(s.sku, s.warehouse);
    const brand = stock ? stock.brand : 'Bilinmiyor';
    const model = stock ? stock.model : '-';

    s.brand = brand;
    s.model = model;
    s.date = dateStr;

    await saleRepository.insert(s);

    await movementRepository.insert({
        type: 'OUT', sku: s.sku, brand, model, warehouse: s.warehouse, qty: s.qty, date: dateStr
    });

    if (stock) {
        const newQty = Math.max(0, stock.qty - s.qty);
        await stockRepository.updateQuantity(stock.id, newQty);
    }
};`,

    'controllers/saleController.js': `const saleService = require('../services/saleService');

exports.getAll = async (req, res) => {
    try {
        const rows = await saleService.getAllSales();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.process = async (req, res) => {
    try {
        await saleService.processSale(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};`,

    'routes/saleRoutes.js': `const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.get('/', saleController.getAll);
router.post('/', saleController.process);

module.exports = router;`
};

for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(baseDir, file), content, 'utf8');
}

console.log('Refactor complete.');
