const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const getAllUsers = (req, res) => {
    try {
        const { role, status } = req.query;

        const conditions = [];
        const params = [];

        if (role) {
            if (!['admin', 'analyst', 'viewer'].includes(role)) {
                return errorResponse(res, "Role must be 'admin', 'analyst', or 'viewer'", 400);
            }
            conditions.push('role = ?');
            params.push(role);
        }

        if (status) {
            if (!['active', 'inactive'].includes(status)) {
                return errorResponse(res, "Status must be 'active' or 'inactive'", 400);
            }
            conditions.push('status = ?');
            params.push(status);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const users = db.prepare(`
            SELECT id, name, email, role, status, created_at
            FROM users ${whereClause}
            ORDER BY created_at DESC
        `).all(...params);

        return successResponse(res, users, 'Users fetched successfully');
    } catch (error) {
        console.error('getAllUsers error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getUserById = (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.id;
        const requesterRole = req.user.role;

        if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
            return errorResponse(res, 'Access denied', 403);
        }

        const user = db.prepare(`
            SELECT id, name, email, role, status, created_at FROM users WHERE id = ?
        `).get(id);

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, user, 'User fetched successfully');
    } catch (error) {
        console.error('getUserById error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const updateUser = (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.id;
        const requesterRole = req.user.role;
        const { name, email, role, status } = req.body;

        if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
            return errorResponse(res, 'Access denied', 403);
        }

        if (requesterRole !== 'admin' && (role !== undefined || status !== undefined)) {
            return errorResponse(res, 'You cannot change role or status', 403);
        }

        const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!existing) {
            return errorResponse(res, 'User not found', 404);
        }

        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return errorResponse(res, 'Invalid email format', 400);
            }

            const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
            if (emailTaken) {
                return errorResponse(res, 'Email already exists', 409);
            }
        }

        if (role !== undefined && !['admin', 'analyst', 'viewer'].includes(role)) {
            return errorResponse(res, "Role must be 'admin', 'analyst', or 'viewer'", 400);
        }

        if (status !== undefined && !['active', 'inactive'].includes(status)) {
            return errorResponse(res, "Status must be 'active' or 'inactive'", 400);
        }

        const updatedName   = name   !== undefined ? name   : existing.name;
        const updatedEmail  = email  !== undefined ? email  : existing.email;
        const updatedRole   = role   !== undefined ? role   : existing.role;
        const updatedStatus = status !== undefined ? status : existing.status;

        db.prepare(`
            UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?
        `).run(updatedName, updatedEmail, updatedRole, updatedStatus, id);

        const updatedUser = db.prepare(`
            SELECT id, name, email, role, status, created_at FROM users WHERE id = ?
        `).get(id);

        return successResponse(res, updatedUser, 'User updated successfully');
    } catch (error) {
        console.error('updateUser error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const deleteUser = (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.id;

        if (parseInt(id) === requesterId) {
            return errorResponse(res, 'You cannot delete your own account', 400);
        }

        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(id);

        return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
        console.error('deleteUser error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const changePassword = (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        if (!current_password || !new_password) {
            return errorResponse(res, 'Current password and new password are required', 400);
        }

        if (new_password.length < 6) {
            return errorResponse(res, 'New password must be at least 6 characters long', 400);
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        const isMatch = bcrypt.compareSync(current_password, user.password_hash);
        if (!isMatch) {
            return errorResponse(res, 'Current password is incorrect', 401);
        }

        const salt = bcrypt.genSaltSync(10);
        const newHash = bcrypt.hashSync(new_password, salt);

        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

        return successResponse(res, null, 'Password changed successfully');
    } catch (error) {
        console.error('changePassword error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const getMe = (req, res) => {
    try {
        const userId = req.user.id;

        const user = db.prepare(`
            SELECT id, name, email, role, status, created_at FROM users WHERE id = ?
        `).get(userId);

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, user, 'Profile fetched successfully');
    } catch (error) {
        console.error('getMe error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, changePassword, getMe };
