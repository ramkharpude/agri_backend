const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const backupPath = path.join(__dirname, '../backup_data.json');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

const tables = ['users', 'products', 'plots', 'schedules', 'diseases', 'consultations', 'notifications'];
const data = {};

let completed = 0;

tables.forEach(table => {
    db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
        if (err) {
            // console.log(`Table ${table} might not exist or empty:`, err.message);
            data[table] = [];
        } else {
            // console.log(`Backed up ${rows.length} rows from ${table}`);
            data[table] = rows;
        }

        completed++;
        if (completed === tables.length) {
            fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
            // console.log(`Backup completed! Data saved to ${backupPath}`);
            db.close();
        }
    });
});
