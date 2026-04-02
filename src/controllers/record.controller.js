const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const isValidDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
};

const createRecord = (req, res) => {
    try {
        const { amount, type, category, date, notes } = req.body;
        const createdBy = req.user.id;

        if (amount === undefined || amount === null) {
            return errorResponse(res, 'Amount is required', 400);
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return errorResponse(res, 'Amount must be a positive number', 400);
        }
        if (!type || !['income', 'expense'].includes(type)) {
            return errorResponse(res, "Type must be either 'income' or 'expense'", 400);
        }
        if (!category || typeof category !== 'string' || category.trim() === '') {
            return errorResponse(res, 'Category is required and must be a non-empty string', 400);
        }
        if (!date || !isValidDate(date)) {
            return errorResponse(res, 'Date is required and must be in YYYY-MM-DD format', 400);
        }
        if (notes !== undefined && typeof notes !== 'string') {
            return errorResponse(res, 'Notes must be a string', 400);
        }

        const info = db.prepare(`
            INSERT INTO financial_records (amount, type, category, date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(amount, type, category.trim(), date, notes || null, createdBy);

        const newRecord = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(info.lastInsertRowid);

        return successResponse(res, newRecord, 'Financial record created successfully', 201);
    } catch (error) {
        console.error('createRecord error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getAllRecords = (req, res) => {
    try {
        const { type, category, start_date, end_date } = req.query;

        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 50) limit = 50;
        const offset = (page - 1) * limit;

        const conditions = ['is_deleted = 0'];
        const params = [];

        if (type) {
            if (!['income', 'expense'].includes(type)) {
                return errorResponse(res, "Type filter must be 'income' or 'expense'", 400);
            }
            conditions.push('type = ?');
            params.push(type);
        }

        if (category) {
            conditions.push('LOWER(category) = LOWER(?)');
            params.push(category);
        }

        if (start_date) {
            if (!isValidDate(start_date)) {
                return errorResponse(res, 'start_date must be in YYYY-MM-DD format', 400);
            }
            conditions.push('date >= ?');
            params.push(start_date);
        }

        if (end_date) {
            if (!isValidDate(end_date)) {
                return errorResponse(res, 'end_date must be in YYYY-MM-DD format', 400);
            }
            conditions.push('date <= ?');
            params.push(end_date);
        }

        const whereClause = conditions.join(' AND ');

        const { total } = db.prepare(`SELECT COUNT(*) as total FROM financial_records WHERE ${whereClause}`).get(...params);

        const records = db.prepare(`
            SELECT * FROM financial_records
            WHERE ${whereClause}
            ORDER BY date DESC, created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        return successResponse(res, {
            data: records,
            meta: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        }, 'Records fetched successfully');
    } catch (error) {
        console.error('getAllRecords error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getRecordById = (req, res) => {
    try {
        const { id } = req.params;
        const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);

        if (!record) {
            return errorResponse(res, 'Record not found', 404);
        }

        return successResponse(res, record, 'Record fetched successfully');
    } catch (error) {
        console.error('getRecordById error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const updateRecord = (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type, category, date, notes } = req.body;

        const existing = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
        if (!existing) {
            return errorResponse(res, 'Record not found', 404);
        }

        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            return errorResponse(res, 'Amount must be a positive number', 400);
        }
        if (type !== undefined && !['income', 'expense'].includes(type)) {
            return errorResponse(res, "Type must be either 'income' or 'expense'", 400);
        }
        if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
            return errorResponse(res, 'Category must be a non-empty string', 400);
        }
        if (date !== undefined && !isValidDate(date)) {
            return errorResponse(res, 'Date must be in YYYY-MM-DD format', 400);
        }
        if (notes !== undefined && typeof notes !== 'string') {
            return errorResponse(res, 'Notes must be a string', 400);
        }

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

        const updatedRecord = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);

        return successResponse(res, updatedRecord, 'Record updated successfully');
    } catch (error) {
        console.error('updateRecord error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const deleteRecord = (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
        if (!existing) {
            return errorResponse(res, 'Record not found', 404);
        }

        db.prepare('UPDATE financial_records SET is_deleted = 1, updated_at = current_timestamp WHERE id = ?').run(id);

        return successResponse(res, null, 'Record deleted successfully');
    } catch (error) {
        console.error('deleteRecord error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

module.exports = { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord };
