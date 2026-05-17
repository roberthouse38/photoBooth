const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(
    "./database.db",
    (err) => {
        if(err){
            console.log("hai, ada pesan kecil: " + err.message);
        } else {
            console.log("Ciee SQLite terhubung")
        }
    }
);

db.serialize(()=> {
    db.run(
        `CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            filter TEXT,
            layout TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    );
});

module.exports = db;

