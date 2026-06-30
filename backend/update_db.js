const db = require('./src/config/db');
setTimeout(() => {
    db.serialize(() => {
        db.run('ALTER TABLE users ADD COLUMN permissions TEXT', (err) => {
            if (err) console.log('Column may already exist');
            else console.log('Added permissions column');
        });
        db.run('UPDATE users SET permissions = ? WHERE username = ?', ['["all"]', 'çapraz'], () => {
            console.log('Admin updated');
            process.exit(0);
        });
    });
}, 500);
