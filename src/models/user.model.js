const { db } = require('../config/db');

const findById = (id) => {
    return db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(id);
};

const findByEmail = (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
};

const findAll = ({ role, status } = {}) => {
    const conditions = [];
    const params = [];

    if (role) { conditions.push('role = ?'); params.push(role); }
    if (status) { conditions.push('status = ?'); params.push(status); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    return db.prepare(`
        SELECT id, name, email, role, status, created_at
        FROM users ${whereClause}
        ORDER BY created_at DESC
    `).all(...params);
};

const create = ({ name, email, passwordHash, role }) => {
    const info = db.prepare(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    `).run(name, email, passwordHash, role);
    return findById(info.lastInsertRowid);
};

const update = (id, { name, email, role, status }) => {
    const existing = findById(id);
    if (!existing) return null;

    const updatedName   = name   !== undefined ? name   : existing.name;
    const updatedEmail  = email  !== undefined ? email  : existing.email;
    const updatedRole   = role   !== undefined ? role   : existing.role;
    const updatedStatus = status !== undefined ? status : existing.status;

    db.prepare(`
        UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?
    `).run(updatedName, updatedEmail, updatedRole, updatedStatus, id);

    return findById(id);
};

const updatePassword = (id, newHash) => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id);
};

const deleteById = (id) => {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
};

const emailExists = (email, excludeId = null) => {
    if (excludeId) {
        return db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, excludeId);
    }
    return db.prepare('SELECT id FROM users WHERE email = ?').get(email);
};

module.exports = { findById, findByEmail, findAll, create, update, updatePassword, deleteById, emailExists };
