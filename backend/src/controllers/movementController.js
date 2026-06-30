const stockService = require('../services/stockService');
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
};