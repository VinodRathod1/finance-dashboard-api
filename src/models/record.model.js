const { db } = require('../config/db');

const findById = (id) => {
    return db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
};

const findAll = ({ type, category, start_date, end_date, page = 1, limit = 10 } = {}) => {
    const conditions = ['is_deleted = 0'];
    const params = [];

    if (type) { conditions.push('type = ?'); params.push(type); }
    if (category) { conditions.push('LOWER(category) = LOWER(?)'); params.push(category); }
    if (start_date) { conditions.push('date >= ?'); params.push(start_date); }
    if (end_date) { conditions.push('date <= ?'); params.push(end_date); }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const { total } = db.prepare(`SELECT COUNT(*) as total FROM financial_records WHERE ${whereClause}`).get(...params);

    const data = db.prepare(`
        SELECT * FROM financial_records
        WHERE ${whereClause}
        ORDER BY date DESC, created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return { data, total };
};

const create = ({ amount, type, category, date, notes, createdBy }) => {
    const info = db.prepare(`
        INSERT INTO financial_records (amount, type, category, date, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(amount, type, category, date, notes || null, createdBy);
    return db.prepare('SELECT * FROM financial_records WHERE id = ?').get(info.lastInsertRowid);
};

const update = (id, { amount, type, category, date, notes }) => {
    const existing = findById(id);
    if (!existing) return null;

    const updatedAmount   = amount   !== undefined ? amount          : existing.amount;
    const updatedType     = type     !== undefined ? type            : existing.type;
    const updatedCategory = category !== undefined ? category.trim() : existing.category;
    const updatedDate     = date     !== undefined ? date            : existing.date;
    const updatedNotes    = notes    !== undefined ? notes           : existing.notes;

    db.prepare(`
        UPDATE financial_records
        SET amount = ?, type = ?, category = ?, date = ?, notes = ?, updated_at = current_timestamp
        WHERE id = ?
    `).run(updatedAmount, updatedType, updatedCategory, updatedDate, updatedNotes, id);

    return db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);
};

const softDelete = (id) => {
    return db.prepare(`
        UPDATE financial_records SET is_deleted = 1, updated_at = current_timestamp WHERE id = ?
    `).run(id);
};

module.exports = { findById, findAll, create, update, softDelete };
