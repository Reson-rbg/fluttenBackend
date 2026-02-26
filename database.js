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
                db.run(`ALTER TABLE check_ins ADD COLUMN mood INTEGER`, (err) => {});
            }
        });

        // ===== V2.0 新增表 =====

        // 专注会话表
        db.run(`CREATE TABLE IF NOT EXISTS focus_sessions (
            id TEXT PRIMARY KEY,
            userId TEXT,
            todoId TEXT,
            startTime TEXT,
            endTime TEXT,
            duration INTEGER,
            FOREIGN KEY (userId) REFERENCES users (id),
            FOREIGN KEY (todoId) REFERENCES todos (id)
        )`);

        // 用户徽章表
        db.run(`CREATE TABLE IF NOT EXISTS user_badges (
            id TEXT PRIMARY KEY,
            userId TEXT,
            badgeKey TEXT,
            unlockedAt TEXT,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);

        // 任务模板表
        db.run(`CREATE TABLE IF NOT EXISTS task_templates (
            id TEXT PRIMARY KEY,
            userId TEXT,
            title TEXT,
            description TEXT,
            tags TEXT,
            isFocus INTEGER DEFAULT 0,
            createdAt TEXT,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);

        // 广场事件表 (匿名成就)
        db.run(`CREATE TABLE IF NOT EXISTS plaza_events (
            id TEXT PRIMARY KEY,
            userId TEXT,
            eventType TEXT,
            eventDescription TEXT,
            createdAt TEXT,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);

        // 用户设置表
        db.run(`CREATE TABLE IF NOT EXISTS user_settings (
            userId TEXT PRIMARY KEY,
            showOnPlaza INTEGER DEFAULT 0,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);
    });
}

module.exports = db;
