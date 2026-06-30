const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, 'src');

const files = {
    'repositories/userRepository.js': `const db = require('../config/db');

exports.findByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

exports.getAll = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT id, username, role, permissions FROM users WHERE role != 'admin'", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

exports.insert = (username, passwordHash, role, permissions) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO users (username, password_hash, role, permissions) VALUES (?, ?, ?, ?)",
            [username, passwordHash, role, permissions], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

exports.remove = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM users WHERE id = ? AND role != 'admin'", [id], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
};`,

    'services/userService.js': `const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async () => {
    return await userRepository.getAll();
};

exports.createUser = async (username, password, role, permissions) => {
    // Basic Input Validation
    if (!username || username.length < 3) throw new Error("Kullanıcı adı en az 3 karakter olmalıdır.");
    if (!password || password.length < 5) throw new Error("Şifre en az 5 karakter olmalıdır.");
    if (!Array.isArray(permissions)) throw new Error("Geçersiz yetki formatı.");

    const existing = await userRepository.findByUsername(username);
    if (existing) throw new Error("Bu kullanıcı adı zaten mevcut.");

    const passwordHash = bcrypt.hashSync(password, 10);
    const permString = JSON.stringify(permissions);

    return await userRepository.insert(username, passwordHash, role, permString);
};

exports.deleteUser = async (id) => {
    await userRepository.remove(id);
};`,

    'controllers/userController.js': `const userService = require('../services/userService');

exports.getAll = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        const mappedUsers = users.map(u => ({
            ...u,
            permissions: u.permissions ? JSON.parse(u.permissions) : []
        }));
        res.json(mappedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { username, password, permissions } = req.body;
        // Yeni eklenen personellerin rolü her zaman 'personnel' olur
        await userService.createUser(username, password, 'personnel', permissions);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.body;
        await userService.deleteUser(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};`,

    'routes/userRoutes.js': `const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', requireAdmin, userController.getAll);
router.post('/', requireAdmin, userController.create);
router.delete('/', requireAdmin, userController.remove);

module.exports = router;`
};

for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(baseDir, file), content, 'utf8');
}

console.log('User layer created.');
