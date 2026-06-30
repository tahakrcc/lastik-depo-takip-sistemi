const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

exports.login = async (username, password) => {
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error('Hatalı kullanıcı adı veya şifre!');

    const validPass = bcrypt.compareSync(password, user.password_hash);
    if (!validPass) throw new Error('Hatalı kullanıcı adı veya şifre!');

    let perms = [];
    if (user.permissions) {
        try { perms = JSON.parse(user.permissions); } catch(e){}
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, permissions: perms }, JWT_SECRET);
    return { token, role: user.role, username: user.username, permissions: perms };
};