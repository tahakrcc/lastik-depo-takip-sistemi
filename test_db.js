const sqlite3 = require('sqlite3').verbose();
const dbPath = 'C:\\Users\\tk\\Desktop\\çapraz2\\dist\\database.sqlite';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database', err);
    else {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
            if (err) console.error(err);
            else console.log('Tables in dist/database.sqlite:', rows.map(r => r.name));
            
            db.all("SELECT * FROM metadata", [], (err, metadata) => {
                if(err) console.error("Error selecting metadata:", err.message);
                else console.log("Metadata count:", metadata.length);
            });
        });
    }
});
