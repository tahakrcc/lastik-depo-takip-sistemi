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

exports.updateUser = async (id, newUsername, newPassword, newPermissions) => {
    if (!newUsername || newUsername.length < 3) throw new Error("Kullanıcı adı en az 3 karakter olmalıdır.");
    
    // Aynı kullanıcı adını başkası kullanıyor mu kontrolü
    const existing = await userRepository.findByUsername(newUsername);
    if (existing && existing.id !== id) {
        throw new Error("Bu kullanıcı adı başka biri tarafından kullanılıyor.");
    }

    const updateData = {
        username: newUsername,
    };

    if (newPassword && newPassword.length >= 5) {
        updateData.password_hash = bcrypt.hashSync(newPassword, 10);
    } else if (newPassword) {
        throw new Error("Yeni şifre en az 5 karakter olmalıdır.");
    }

    if (newPermissions && Array.isArray(newPermissions)) {
        updateData.permissions = JSON.stringify(newPermissions);
    }

    await userRepository.update(id, updateData);
};

exports.deleteUser = async (id) => {
    await userRepository.remove(id);
};