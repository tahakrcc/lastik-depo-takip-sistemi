const stockService = require('../services/stockService');

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
};