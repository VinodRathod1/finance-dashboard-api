const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
const authenticate = (req, res, next) => {
    try {
        // Extract Bearer token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'Access token required', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token using JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded user to req.user
        req.user = decoded;
        
        // Proceed to next middleware
        next();
    } catch (error) {
        // If invalid or expired return 401
        return errorResponse(res, 'Invalid or expired token', 401);
    }
};

module.exports = {
    authenticate
};
