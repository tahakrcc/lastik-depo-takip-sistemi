const User = require('../models/User');

exports.findByUsername = async (username) => {
    return await User.findOne({ username });
};

exports.getAll = async () => {
    return await User.find({ role: { $ne: 'admin' } }).select('id username role permissions');
};

exports.insert = async (username, passwordHash, role, permissions) => {
    const user = new User({ username, password_hash: passwordHash, role, permissions });
    const savedUser = await user.save();
    return savedUser.id;
};

exports.remove = async (id) => {
    await User.deleteOne({ _id: id, role: { $ne: 'admin' } });
};