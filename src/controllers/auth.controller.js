const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Register a new user
 */
const register = (req, res) => {
    try {
        const { name, email, password, role = 'viewer' } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return errorResponse(res, 'Name, email, and password are required', 400);
        }

        // 2. Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return errorResponse(res, 'Invalid email format', 400);
        }

        // 3. Validate password length
        if (password.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }

        // 4. Validate role
        const validRoles = ['admin', 'analyst', 'viewer'];
        if (!validRoles.includes(role)) {
            return errorResponse(res, 'Invalid role provided', 400);
        }

        // 5. Check if email already exists in users table
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return errorResponse(res, 'Email already exists', 409);
        }

        // 6. Hash password using bcryptjs with salt rounds 10
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        // 7. Insert new user into database
        const insertStmt = db.prepare(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `);
        const info = insertStmt.run(name, email, passwordHash, role);

        // 8. Return success response with user data (exclude password_hash)
        const newUser = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);

        return successResponse(res, newUser, 'User registered successfully', 201);
    } catch (error) {
        console.error('Register error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

/**
 * Login a user
 */
const login = (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate both fields are present
        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        // 2. Find user by email in users table
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        
        // 3. If not found return 401 error
        if (!user) {
            return errorResponse(res, 'Invalid credentials', 401);
        }

        // 4. Check if user status is 'active', if not return 403
        if (user.status !== 'active') {
            return errorResponse(res, 'Account is inactive', 403);
        }

        // 5. Compare password with bcryptjs
        const isMatch = bcrypt.compareSync(password, user.password_hash);
        
        // 6. If wrong return 401
        if (!isMatch) {
            return errorResponse(res, 'Invalid credentials', 401);
        }

        // 7. Generate JWT token using jsonwebtoken with payload
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        // sign with expiry of 7 days using JWT_SECRET
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // 8. Return success response with token and user info (exclude password_hash)
        delete user.password_hash;

        return successResponse(res, { token, user }, 'Login successful', 200);
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

module.exports = {
    register,
    login
};
