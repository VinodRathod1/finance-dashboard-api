const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

const initDatabase = () => {
    db.pragma('foreign_keys = ON');

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            created_at TEXT DEFAULT current_timestamp
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS financial_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_by INTEGER REFERENCES users(id),
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT current_timestamp,
            updated_at TEXT DEFAULT current_timestamp
        )
    `);

    const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    if (!adminExists) {
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync('admin123', salt);
        db.prepare(`
            INSERT INTO users (name, email, password_hash, role, status)
            VALUES (?, ?, ?, ?, ?)
        `).run('Super Admin', 'admin@finance.com', passwordHash, 'admin', 'active');
        console.log('Default Super Admin account created.');
    }

    console.log('Database tables initialized successfully.');
};

module.exports = { db, initDatabase };
