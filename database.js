const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, 'full_stack_todo.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            createdAt TEXT
        )`);

        // Todos Table
        db.run(`CREATE TABLE IF NOT EXISTS todos (
            id TEXT PRIMARY KEY,
            userId TEXT,
            title TEXT,
            description TEXT,
            isCompleted INTEGER,
            createdAt TEXT,
            reminderTime TEXT,
            tags TEXT,
            isFocus INTEGER DEFAULT 0,
            subtasks TEXT,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`, (err) => {
            if (!err) {
                // Attempt to add new columns if table exists (for migration)
                const columnsToAdd = [
                    { name: 'tags', type: 'TEXT' },
                    { name: 'isFocus', type: 'INTEGER DEFAULT 0' },
                    { name: 'subtasks', type: 'TEXT' }
                ];
                columnsToAdd.forEach(col => {
                    db.run(`ALTER TABLE todos ADD COLUMN ${col.name} ${col.type}`, (err) => {
                        // Ignore error if column already exists
                    });
                });
            }
        });

        // CheckIns Table
        db.run(`CREATE TABLE IF NOT EXISTS check_ins (
            id TEXT PRIMARY KEY,
            userId TEXT,
            checkInTime TEXT,
            note TEXT,
            mood INTEGER,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`, (err) => {
            if (!err) {
                // Migration for mood
                db.run(`ALTER TABLE check_ins ADD COLUMN mood INTEGER`, (err) => {});
            }
        });
    });
}

module.exports = db;
