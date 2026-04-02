const { errorResponse } = require('../utils/response');

/**
 * Middleware factory that restricts access to specific roles.
 * Usage: requireRole('admin', 'analyst')
 * 
 * @param {...string} roles - List of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        // req.user is attached by the authenticate middleware
        if (!req.user) {
            return errorResponse(res, 'Unauthorized', 401);
        }

        // Check if the logged-in user's role is in the allowed roles list
        if (!roles.includes(req.user.role)) {
            return errorResponse(res, 'You do not have permission to perform this action', 403);
        }

        // Role is allowed, proceed to the next middleware or controller
        next();
    };
};

module.exports = {
    requireRole
};
