const userRepository = require('../repositories/userRepository');
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
};