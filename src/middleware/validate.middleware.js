const { errorResponse } = require('../utils/response');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Z\s]+$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (dateStr) => {
    if (!dateRegex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
};

const sendValidationError = (res, errors) => {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
};

const validateRegister = (req, res, next) => {
    const errors = [];
    const { name, email, password, role } = req.body;

    if (!name || name.trim() === '') {
        errors.push('Name is required');
    } else if (name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    } else if (name.trim().length > 50) {
        errors.push('Name must not exceed 50 characters');
    } else if (!nameRegex.test(name.trim())) {
        errors.push('Name must contain only letters and spaces');
    }

    if (!email || email.trim() === '') {
        errors.push('Email is required');
    } else if (!emailRegex.test(email.trim())) {
        errors.push('Invalid email format');
    }

    if (!password || password === '') {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    } else if (password.length > 100) {
        errors.push('Password must not exceed 100 characters');
    }

    if (role !== undefined && !['admin', 'analyst', 'viewer'].includes(role)) {
        errors.push("Role must be one of: 'admin', 'analyst', 'viewer'");
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateLogin = (req, res, next) => {
    const errors = [];
    const { email, password } = req.body;

    if (!email || email.trim() === '') {
        errors.push('Email is required');
    } else if (!emailRegex.test(email.trim())) {
        errors.push('Invalid email format');
    }

    if (!password || password.trim() === '') {
        errors.push('Password is required');
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateRecord = (req, res, next) => {
    const errors = [];
    const { amount, type, category, date, notes } = req.body;

    if (amount === undefined || amount === null) {
        errors.push('Amount is required');
    } else if (typeof amount !== 'number') {
        errors.push('Amount must be a number');
    } else if (amount <= 0) {
        errors.push('Amount must be greater than 0');
    } else if (amount > 999999999) {
        errors.push('Amount must not exceed 999,999,999');
    }

    if (!type || type.trim() === '') {
        errors.push('Type is required');
    } else if (!['income', 'expense'].includes(type)) {
        errors.push("Type must be 'income' or 'expense'");
    }

    if (!category || category.trim() === '') {
        errors.push('Category is required');
    } else if (category.trim().length < 2) {
        errors.push('Category must be at least 2 characters');
    } else if (category.trim().length > 50) {
        errors.push('Category must not exceed 50 characters');
    }

    if (!date || date.trim() === '') {
        errors.push('Date is required');
    } else if (!isValidDate(date)) {
        errors.push('Date must be a valid date in YYYY-MM-DD format');
    }

    if (notes !== undefined && notes.length > 500) {
        errors.push('Notes must not exceed 500 characters');
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateUpdateRecord = (req, res, next) => {
    const errors = [];
    const { amount, type, category, date, notes } = req.body;

    const hasFields = [amount, type, category, date, notes].some(f => f !== undefined);
    if (!hasFields) {
        return errorResponse(res, 'At least one field is required to update', 400);
    }

    if (amount !== undefined) {
        if (typeof amount !== 'number') {
            errors.push('Amount must be a number');
        } else if (amount <= 0) {
            errors.push('Amount must be greater than 0');
        } else if (amount > 999999999) {
            errors.push('Amount must not exceed 999,999,999');
        }
    }

    if (type !== undefined && !['income', 'expense'].includes(type)) {
        errors.push("Type must be 'income' or 'expense'");
    }

    if (category !== undefined) {
        if (category.trim() === '') {
            errors.push('Category cannot be empty');
        } else if (category.trim().length < 2) {
            errors.push('Category must be at least 2 characters');
        } else if (category.trim().length > 50) {
            errors.push('Category must not exceed 50 characters');
        }
    }

    if (date !== undefined && !isValidDate(date)) {
        errors.push('Date must be a valid date in YYYY-MM-DD format');
    }

    if (notes !== undefined && notes.length > 500) {
        errors.push('Notes must not exceed 500 characters');
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateUpdateUser = (req, res, next) => {
    const errors = [];
    const { name, email, role, status } = req.body;

    const hasFields = [name, email, role, status].some(f => f !== undefined);
    if (!hasFields) {
        return errorResponse(res, 'At least one field is required to update', 400);
    }

    if (name !== undefined) {
        if (name.trim().length < 2) {
            errors.push('Name must be at least 2 characters');
        } else if (name.trim().length > 50) {
            errors.push('Name must not exceed 50 characters');
        }
    }

    if (email !== undefined && !emailRegex.test(email.trim())) {
        errors.push('Invalid email format');
    }

    if (role !== undefined && !['admin', 'analyst', 'viewer'].includes(role)) {
        errors.push("Role must be one of: 'admin', 'analyst', 'viewer'");
    }

    if (status !== undefined && !['active', 'inactive'].includes(status)) {
        errors.push("Status must be 'active' or 'inactive'");
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateChangePassword = (req, res, next) => {
    const errors = [];
    const { current_password, new_password } = req.body;

    if (!current_password || current_password.trim() === '') {
        errors.push('Current password is required');
    }

    if (!new_password || new_password === '') {
        errors.push('New password is required');
    } else if (new_password.length < 6) {
        errors.push('New password must be at least 6 characters');
    } else if (new_password.length > 100) {
        errors.push('New password must not exceed 100 characters');
    }

    if (current_password && new_password && current_password === new_password) {
        errors.push('New password must be different from current password');
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateRecord,
    validateUpdateRecord,
    validateUpdateUser,
    validateChangePassword
};
