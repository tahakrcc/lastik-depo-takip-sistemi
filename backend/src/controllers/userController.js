const userService = require('../services/userService');

exports.getAll = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        const mappedUsers = users.map(u => {
            const userObj = u.toJSON ? u.toJSON() : u;
            return {
                ...userObj,
                permissions: userObj.permissions ? JSON.parse(userObj.permissions) : []
            };
        });
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

exports.update = async (req, res) => {
    try {
        const { id, username, password, permissions } = req.body;
        await userService.updateUser(id, username, password, permissions);
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
};