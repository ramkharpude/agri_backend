const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// console.log("Reading products from:", dbPath);

db.serialize(() => {
    db.all("SELECT id, name, images FROM products ORDER BY id DESC LIMIT 5", (err, rows) => {
        if (err) {
            console.error("Error reading products:", err);
            return;
        }
        // console.log("Found", rows.length, "products:");
        rows.forEach(row => {
            // console.log(`ID: ${row.id}, Name: ${row.name}, Images: ${row.images} (Type: ${typeof row.images})`);
        });
    });
});

db.close();
