/**
 * Utility for formatting successful API responses
 * @param {Object} res - Express response object
 * @param {any} data - Payload data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Utility for formatting error API responses
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {any} errors - Detailed errors (optional)
 */
const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
    const response = {
        success: false,
        message,
    };
    
    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

module.exports = {
    successResponse,
    errorResponse
};
