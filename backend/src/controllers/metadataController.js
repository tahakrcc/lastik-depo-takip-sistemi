const metadataService = require('../services/metadataService');

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
};