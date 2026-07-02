const User = require('../models/User');

exports.findByUsername = async (username) => {
    return await User.findOne({ username });
};

exports.getAll = async () => {
    // Admin hesabını da listelemek için filtreyi kaldırdık
    return await User.find().select('username role permissions');
};

exports.insert = async (username, passwordHash, role, permissions) => {
    const user = new User({ username, password_hash: passwordHash, role, permissions });
    const savedUser = await user.save();
    return savedUser.id;
};

exports.update = async (id, updateData) => {
    await User.updateOne({ _id: id }, { $set: updateData });
};

exports.remove = async (id) => {
    await User.deleteOne({ _id: id, role: { $ne: 'admin' } }); // Admin silinemesin diye güvenlik önlemi
};