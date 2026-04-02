const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const register = (req, res) => {
    try {
        const { name, email, password, role = 'viewer' } = req.body;

        if (!name || !email || !password) {
            return errorResponse(res, 'Name, email, and password are required', 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return errorResponse(res, 'Invalid email format', 400);
        }

        if (password.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }

        const validRoles = ['admin', 'analyst', 'viewer'];
        if (!validRoles.includes(role)) {
            return errorResponse(res, 'Invalid role provided', 400);
        }

        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return errorResponse(res, 'Email already exists', 409);
        }

        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        const info = db.prepare(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `).run(name, email, passwordHash, role);

        const newUser = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);

        return successResponse(res, newUser, 'User registered successfully', 201);
    } catch (error) {
        console.error('Register error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

const login = (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return errorResponse(res, 'Invalid credentials', 401);
        }

        if (user.status !== 'active') {
            return errorResponse(res, 'Account is inactive', 403);
        }

        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
            return errorResponse(res, 'Invalid credentials', 401);
        }

        const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        delete user.password_hash;

        return successResponse(res, { token, user }, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

module.exports = { register, login };
