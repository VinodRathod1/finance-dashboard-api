const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Helper: Validates an ISO date string (YYYY-MM-DD)
 * @param {string} dateStr
 * @returns {boolean}
 */
const isValidDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
};

/**
 * POST /api/v1/records
 * Create a new financial record.
 * Only admin and analyst roles can create records.
 */
const createRecord = (req, res) => {
    try {
        const { amount, type, category, date, notes } = req.body;
        const createdBy = req.user.id;

        // Validate: amount is present and is a positive number
        if (amount === undefined || amount === null) {
            return errorResponse(res, 'Amount is required', 400);
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return errorResponse(res, 'Amount must be a positive number', 400);
        }

        // Validate: type is either 'income' or 'expense'
        if (!type || !['income', 'expense'].includes(type)) {
            return errorResponse(res, "Type must be either 'income' or 'expense'", 400);
        }

        // Validate: category is present and non-empty string
        if (!category || typeof category !== 'string' || category.trim() === '') {
            return errorResponse(res, 'Category is required and must be a non-empty string', 400);
        }

        // Validate: date is present and valid ISO format (YYYY-MM-DD)
        if (!date || !isValidDate(date)) {
            return errorResponse(res, 'Date is required and must be in YYYY-MM-DD format', 400);
        }

        // Validate: notes is optional but must be a string if provided
        if (notes !== undefined && typeof notes !== 'string') {
            return errorResponse(res, 'Notes must be a string', 400);
        }

        // Insert record into database
        const insertStmt = db.prepare(`
            INSERT INTO financial_records (amount, type, category, date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const info = insertStmt.run(amount, type, category.trim(), date, notes || null, createdBy);

        // Fetch and return the newly created record
        const newRecord = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(info.lastInsertRowid);

        return successResponse(res, newRecord, 'Financial record created successfully', 201);
    } catch (error) {
        console.error('createRecord error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

/**
 * GET /api/v1/records
 * Get all financial records with optional filtering and pagination.
 * All roles can view records.
 * Supports query params: type, category, start_date, end_date, page, limit
 */
const getAllRecords = (req, res) => {
    try {
        const { type, category, start_date, end_date } = req.query;

        // Pagination parameters with defaults and max limit enforcement
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 50) limit = 50;
        const offset = (page - 1) * limit;

        // Dynamically build WHERE clause based on provided filters
        const conditions = ['is_deleted = 0'];
        const params = [];

        // Filter: type
        if (type) {
            if (!['income', 'expense'].includes(type)) {
                return errorResponse(res, "Type filter must be 'income' or 'expense'", 400);
            }
            conditions.push('type = ?');
            params.push(type);
        }

        // Filter: category (case-insensitive)
        if (category) {
            conditions.push('LOWER(category) = LOWER(?)');
            params.push(category);
        }

        // Filter: start_date
        if (start_date) {
            if (!isValidDate(start_date)) {
                return errorResponse(res, 'start_date must be in YYYY-MM-DD format', 400);
            }
            conditions.push('date >= ?');
            params.push(start_date);
        }

        // Filter: end_date
        if (end_date) {
            if (!isValidDate(end_date)) {
                return errorResponse(res, 'end_date must be in YYYY-MM-DD format', 400);
            }
            conditions.push('date <= ?');
            params.push(end_date);
        }

        const whereClause = conditions.join(' AND ');

        // Get total count for pagination meta
        const countQuery = `SELECT COUNT(*) as total FROM financial_records WHERE ${whereClause}`;
        const { total } = db.prepare(countQuery).get(...params);

        // Fetch paginated records
        const dataQuery = `
            SELECT * FROM financial_records
            WHERE ${whereClause}
            ORDER BY date DESC, created_at DESC
            LIMIT ? OFFSET ?
        `;
        const records = db.prepare(dataQuery).all(...params, limit, offset);

        const totalPages = Math.ceil(total / limit);

        return successResponse(res, {
            data: records,
            meta: {
                total,
                page,
                limit,
                total_pages: totalPages
            }
        }, 'Records fetched successfully');
    } catch (error) {
        console.error('getAllRecords error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

/**
 * GET /api/v1/records/:id
 * Get a single financial record by ID.
 * All roles can view a single record.
 */
const getRecordById = (req, res) => {
    try {
        const { id } = req.params;

        // Find record by id where is_deleted = 0
        const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);

        // Return 404 if not found
        if (!record) {
            return errorResponse(res, 'Record not found', 404);
        }

        return successResponse(res, record, 'Record fetched successfully');
    } catch (error) {
        console.error('getRecordById error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

/**
 * PUT /api/v1/records/:id
 * Update an existing financial record.
 * Only admin and analyst roles can update records.
 */
const updateRecord = (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type, category, date, notes } = req.body;

        // Check if the record exists and is not soft-deleted
        const existing = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
        if (!existing) {
            return errorResponse(res, 'Record not found', 404);
        }

        // Validate provided fields (only if they are included in the request body)
        if (amount !== undefined) {
            if (typeof amount !== 'number' || amount <= 0) {
                return errorResponse(res, 'Amount must be a positive number', 400);
            }
        }

        if (type !== undefined) {
            if (!['income', 'expense'].includes(type)) {
                return errorResponse(res, "Type must be either 'income' or 'expense'", 400);
            }
        }

        if (category !== undefined) {
            if (typeof category !== 'string' || category.trim() === '') {
                return errorResponse(res, 'Category must be a non-empty string', 400);
            }
        }

        if (date !== undefined) {
            if (!isValidDate(date)) {
                return errorResponse(res, 'Date must be in YYYY-MM-DD format', 400);
            }
        }

        if (notes !== undefined && typeof notes !== 'string') {
            return errorResponse(res, 'Notes must be a string', 400);
        }

        // Merge with existing values: use new value if provided, otherwise keep existing
        const updatedAmount   = amount   !== undefined ? amount            : existing.amount;
        const updatedType     = type     !== undefined ? type              : existing.type;
        const updatedCategory = category !== undefined ? category.trim()   : existing.category;
        const updatedDate     = date     !== undefined ? date              : existing.date;
        const updatedNotes    = notes    !== undefined ? notes             : existing.notes;

        // Update record and set updated_at to current timestamp
        db.prepare(`
            UPDATE financial_records
            SET amount = ?, type = ?, category = ?, date = ?, notes = ?, updated_at = current_timestamp
            WHERE id = ?
        `).run(updatedAmount, updatedType, updatedCategory, updatedDate, updatedNotes, id);

        // Return the updated record
        const updatedRecord = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);

        return successResponse(res, updatedRecord, 'Record updated successfully');
    } catch (error) {
        console.error('updateRecord error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

/**
 * DELETE /api/v1/records/:id
 * Soft delete a financial record (sets is_deleted = 1).
 * Only admin role can delete records.
 */
const deleteRecord = (req, res) => {
    try {
        const { id } = req.params;

        // Check if the record exists and is not already soft-deleted
        const existing = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
        if (!existing) {
            return errorResponse(res, 'Record not found', 404);
        }

        // Perform soft delete: set is_deleted = 1, do NOT remove the actual row
        db.prepare('UPDATE financial_records SET is_deleted = 1, updated_at = current_timestamp WHERE id = ?').run(id);

        return successResponse(res, null, 'Record deleted successfully');
    } catch (error) {
        console.error('deleteRecord error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

module.exports = {
    createRecord,
    getAllRecords,
    getRecordById,
    updateRecord,
    deleteRecord
};
