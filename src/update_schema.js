
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath, err.message);
    } else {
        // console.log('Connected to the SQLite database.');
    }
});

// Run alterations
db.serialize(() => {
    // Add solution column
    db.run("ALTER TABLE diseases ADD COLUMN solution TEXT;", (err) => {
        if (err) {
            // console.log("Column 'solution' might already exist or error:", err.message);
        } else {
            // console.log("Column 'solution' added.");
        }
    });

    // Add consultantName column
    db.run("ALTER TABLE diseases ADD COLUMN consultantName TEXT;", (err) => {
        if (err) {
            // console.log("Column 'consultantName' might already exist or error:", err.message);
        } else {
            // console.log("Column 'consultantName' added.");
        }
    });
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    // console.log('Close the database connection.');
});
