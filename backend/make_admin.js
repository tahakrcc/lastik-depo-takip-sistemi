const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://gunesgozlemcisi_db_user:adana123@cluster0.azseniu.mongodb.net/inonu_site?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
    const User = require('./src/models/User');
    await User.updateOne({username: 'yildizlarotomotiv'}, {role: 'admin', permissions: '["all"]'});
    const users = await User.find({}, {password_hash: 0});
    console.log('Güncel Kullanıcılar:', users);
    process.exit(0);
}).catch(console.error);
