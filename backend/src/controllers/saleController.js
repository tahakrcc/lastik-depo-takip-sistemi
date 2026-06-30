const saleService = require('../services/saleService');

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
};