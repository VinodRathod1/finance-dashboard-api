const Database = require('better-sqlite3');
const path = require('path');

// Initialize the SQLite database (file-based)
const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

/**
 * Initializes the database tables if they do not exist
 */
const initDatabase = () => {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create users table
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            created_at TEXT DEFAULT current_timestamp
        )
    `;
    db.exec(createUsersTable);

    // Create financial_records table
    const createRecordsTable = `
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
    `;
    db.exec(createRecordsTable);

    console.log('Database tables initialized successfully.');
};

module.exports = {
    db,
    initDatabase
};
