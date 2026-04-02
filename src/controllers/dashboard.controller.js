const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/v1/dashboard/summary
 * Returns overall financial summary.
 * All roles can access this.
 */
const getSummary = (req, res) => {
    try {
        // Calculate total income (sum of all income records)
        const incomeRow = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total_income
            FROM financial_records
            WHERE type = 'income' AND is_deleted = 0
        `).get();

        // Calculate total expenses (sum of all expense records)
        const expenseRow = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total_expenses
            FROM financial_records
            WHERE type = 'expense' AND is_deleted = 0
        `).get();

        // Count all non-deleted records
        const countRow = db.prepare(`
            SELECT COUNT(*) as total_records
            FROM financial_records
            WHERE is_deleted = 0
        `).get();

        const totalIncome   = incomeRow.total_income;
        const totalExpenses = expenseRow.total_expenses;
        const netBalance    = totalIncome - totalExpenses;

        return successResponse(res, {
            total_income:   totalIncome,
            total_expenses: totalExpenses,
            net_balance:    netBalance,
            total_records:  countRow.total_records
        }, 'Summary fetched successfully');
    } catch (error) {
        console.error('getSummary error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

/**
 * GET /api/v1/dashboard/category-totals
 * Returns totals grouped by category and type.
 * All roles can access this.
 */
const getCategoryWiseTotals = (req, res) => {
    try {
        // Group records by category and type to get totals and counts
        const rows = db.prepare(`
            SELECT
                category,
                type,
                ROUND(SUM(amount), 2) as total,
                COUNT(*) as count
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

/**
 * GET /api/v1/dashboard/monthly-trends
 * Returns monthly income and expense totals for a given year.
 * All roles can access this.
 * Optional query param: year (default: current year)
 */
const getMonthlyTrends = (req, res) => {
    try {
        // Default to current year if not provided
        const year = parseInt(req.query.year) || new Date().getFullYear();

        // Validate year is a reasonable 4-digit number
        if (isNaN(year) || year < 2000 || year > 2100) {
            return errorResponse(res, 'Year must be a valid 4-digit year (e.g., 2024)', 400);
        }

        // Use strftime to extract YYYY-MM from date field
        // Filter by the given year using strftime('%Y', date)
        const rows = db.prepare(`
            SELECT
                strftime('%Y-%m', date) as month,
                type,
                ROUND(SUM(amount), 2) as total,
                COUNT(*) as count
            FROM financial_records
            WHERE is_deleted = 0
              AND strftime('%Y', date) = ?
            GROUP BY month, type
            ORDER BY month ASC
        `).all(String(year));

        return successResponse(res, rows, `Monthly trends for ${year} fetched successfully`);
    } catch (error) {
        console.error('getMonthlyTrends error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

/**
 * GET /api/v1/dashboard/recent-activity
 * Returns the most recent financial records with creator's name.
 * All roles can access this.
 * Optional query param: limit (default: 5, max: 20)
 */
const getRecentActivity = (req, res) => {
    try {
        // Parse and clamp the limit parameter
        let limit = parseInt(req.query.limit) || 5;
        if (limit < 1) limit = 5;
        if (limit > 20) limit = 20;

        // Join financial_records with users to include the creator's name
        const rows = db.prepare(`
            SELECT
                fr.id,
                fr.amount,
                fr.type,
                fr.category,
                fr.date,
                fr.notes,
                fr.created_at,
                u.name as created_by_name
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

/**
 * GET /api/v1/dashboard/weekly-trends
 * Returns weekly income and expense totals for the last N weeks.
 * All roles can access this.
 * Optional query param: weeks (default: 4, max: 12)
 */
const getWeeklyTrends = (req, res) => {
    try {
        // Parse and clamp the weeks parameter
        let weeks = parseInt(req.query.weeks) || 4;
        if (weeks < 1) weeks = 4;
        if (weeks > 12) weeks = 12;

        // Calculate the start date: today minus N weeks
        // SQLite date arithmetic: date('now', '-N days')
        const daysBack = weeks * 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Group by week using strftime('%Y-%W', date)
        // Filter only records within the last N weeks
        const rows = db.prepare(`
            SELECT
                strftime('%Y-%W', date) as week,
                type,
                ROUND(SUM(amount), 2) as total,
                COUNT(*) as count
            FROM financial_records
            WHERE is_deleted = 0
              AND date >= ?
            GROUP BY week, type
            ORDER BY week ASC
        `).all(startDateStr);

        return successResponse(res, rows, `Weekly trends for last ${weeks} weeks fetched successfully`);
    } catch (error) {
        console.error('getWeeklyTrends error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

module.exports = {
    getSummary,
    getCategoryWiseTotals,
    getMonthlyTrends,
    getRecentActivity,
    getWeeklyTrends
};
