const authService = require('../services/authService');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};