const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const backupPath = path.join(__dirname, '../backup_data.json');

// Wait for DB to be created by Server first? Or create it here? 
// Better to let server create it to ensure schema is correct.
// But we can check if it exists.

if (!fs.existsSync(dbPath)) {
    console.error("Database file not found! Please start the backend server first to create the schema.");
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const rawData = fs.readFileSync(backupPath);
const data = JSON.parse(rawData);

const tables = ['users', 'products', 'plots', 'schedules', 'diseases', 'consultations', 'notifications'];

db.serialize(() => {
    tables.forEach(table => {
        const rows = data[table];
        if (!rows || rows.length === 0) return;

        // console.log(`Restoring ${rows.length} rows to ${table}...`);

        // Get columns from first row
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(',');
        const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`);

        rows.forEach(row => {
            stmt.run(Object.values(row), (err) => {
                if (err) console.error(`Error inserting into ${table}:`, err.message);
            });
        });

        stmt.finalize();
    });
});

db.close((err) => {
    if (err) console.error(err.message);
    // else console.log('Restore completed successfully!');
});
