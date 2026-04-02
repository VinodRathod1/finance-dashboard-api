const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const getSummary = (req, res) => {
    try {
        const { total_income } = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total_income
            FROM financial_records WHERE type = 'income' AND is_deleted = 0
        `).get();

        const { total_expenses } = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total_expenses
            FROM financial_records WHERE type = 'expense' AND is_deleted = 0
        `).get();

        const { total_records } = db.prepare(`
            SELECT COUNT(*) as total_records
            FROM financial_records WHERE is_deleted = 0
        `).get();

        return successResponse(res, {
            total_income,
            total_expenses,
            net_balance: total_income - total_expenses,
            total_records
        }, 'Summary fetched successfully');
    } catch (error) {
        console.error('getSummary error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getCategoryWiseTotals = (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT category, type, ROUND(SUM(amount), 2) as total, COUNT(*) as count
            FROM financial_records
            WHERE is_deleted = 0
            GROUP BY category, type
            ORDER BY total DESC
        `).all();

        return successResponse(res, rows, 'Category wise totals fetched successfully');
    } catch (error) {
        console.error('getCategoryWiseTotals error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getMonthlyTrends = (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();

        if (isNaN(year) || year < 2000 || year > 2100) {
            return errorResponse(res, 'Year must be a valid 4-digit year (e.g., 2024)', 400);
        }

        const rows = db.prepare(`
            SELECT strftime('%Y-%m', date) as month, type, ROUND(SUM(amount), 2) as total, COUNT(*) as count
            FROM financial_records
            WHERE is_deleted = 0 AND strftime('%Y', date) = ?
            GROUP BY month, type
            ORDER BY month ASC
        `).all(String(year));

        return successResponse(res, rows, `Monthly trends for ${year} fetched successfully`);
    } catch (error) {
        console.error('getMonthlyTrends error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getRecentActivity = (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 5;
        if (limit < 1) limit = 5;
        if (limit > 20) limit = 20;

        const rows = db.prepare(`
            SELECT fr.id, fr.amount, fr.type, fr.category, fr.date, fr.notes, fr.created_at, u.name as created_by_name
            FROM financial_records fr
            LEFT JOIN users u ON fr.created_by = u.id
            WHERE fr.is_deleted = 0
            ORDER BY fr.created_at DESC
            LIMIT ?
        `).all(limit);

        return successResponse(res, rows, 'Recent activity fetched successfully');
    } catch (error) {
        console.error('getRecentActivity error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getWeeklyTrends = (req, res) => {
    try {
        let weeks = parseInt(req.query.weeks) || 4;
        if (weeks < 1) weeks = 4;
        if (weeks > 12) weeks = 12;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - weeks * 7);
        const startDateStr = startDate.toISOString().split('T')[0];

        const rows = db.prepare(`
            SELECT strftime('%Y-%W', date) as week, type, ROUND(SUM(amount), 2) as total, COUNT(*) as count
            FROM financial_records
            WHERE is_deleted = 0 AND date >= ?
            GROUP BY week, type
            ORDER BY week ASC
        `).all(startDateStr);

        return successResponse(res, rows, `Weekly trends for last ${weeks} weeks fetched successfully`);
    } catch (error) {
        console.error('getWeeklyTrends error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

module.exports = { getSummary, getCategoryWiseTotals, getMonthlyTrends, getRecentActivity, getWeeklyTrends };
