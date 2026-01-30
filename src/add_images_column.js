const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
// console.log("Using Database at:", dbPath);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // console.log("Checking 'products' table for 'images' column...");

    db.run("ALTER TABLE products ADD COLUMN images TEXT;", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                // console.log("Column 'images' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            // console.log("Successfully added 'images' column to 'products' table.");
        }
    });
});

db.close();
