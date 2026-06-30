const jwt = require('jsonwebtoken');
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
};

exports.requirePermission = (requiredPerm) => {
    return (req, res, next) => {
        if (req.user && req.user.role === 'admin') return next();
        if (req.user && req.user.permissions && req.user.permissions.includes(requiredPerm)) {
            return next();
        }
        return res.status(403).json({ error: 'Bu sayfaya/işleme erişim yetkiniz bulunmamaktadır.' });
    };
};