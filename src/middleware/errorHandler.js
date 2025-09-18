/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const { isDevelopment } = require('../config/env');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation error class
 */
class ValidationError extends ApiError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

/**
 * Authentication error class
 */
class AuthenticationError extends ApiError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization error class
 */
class AuthorizationError extends ApiError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

/**
 * Rate limit error class
 */
class RateLimitError extends ApiError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}

/**
 * Format error response based on error type
 * @param {Error} error - The error object
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error) => {
    const baseResponse = {
        success: false,
        timestamp: new Date().toISOString()
    };

    // Handle custom API errors
    if (error instanceof ApiError) {
        return {
            ...baseResponse,
            error: error.message,
            code: error.code,
            ...(error.details && { details: error.details })
        };
    }

    // Handle Mongoose/MongoDB errors
    if (error.name === 'ValidationError') {
        return {
            ...baseResponse,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: Object.values(error.errors).map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            }))
        };
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return {
            ...baseResponse,
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        };
    }

    if (error.name === 'TokenExpiredError') {
        return {
            ...baseResponse,
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
        };
    }

    // Handle Axios errors (external API calls)
    if (error.response) {
        return {
            ...baseResponse,
            error: 'External service error',
            code: 'EXTERNAL_SERVICE_ERROR',
            details: isDevelopment() ? {
                status: error.response.status,
                data: error.response.data
            } : undefined
        };
    }

    // Handle network/timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
            ...baseResponse,
            error: 'Request timeout. Please try again.',
            code: 'TIMEOUT_ERROR'
        };
    }

    // Default server error
    return {
        ...baseResponse,
        error: isDevelopment() ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(isDevelopment() && { stack: error.stack })
    };
};

/**
 * Get HTTP status code from error
 * @param {Error} error - The error object
 * @returns {number} HTTP status code
 */
const getStatusCode = (error) => {
    if (error instanceof ApiError) {
        return error.statusCode;
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
        return 400;
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return 401;
    }

    // Axios errors
    if (error.response && error.response.status) {
        return error.response.status >= 400 && error.response.status < 500 ? 400 : 500;
    }

    // Network/timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return 408;
    }

    // Default to 500
    return 500;
};

/**
 * Log error with appropriate level
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 */
const logError = (error, req) => {
    const statusCode = getStatusCode(error);
    const logLevel = statusCode >= 500 ? 'error' : 'warn';
    
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        ...(req.user && { userId: req.user.uid }),
        timestamp: new Date().toISOString()
    };

    console[logLevel]('API Error:', errorInfo);
};

/**
 * Main error handling middleware
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (error, req, res, next) => {
    // Log the error
    logError(error, req);

    // Get status code and format response
    const statusCode = getStatusCode(error);
    const errorResponse = formatErrorResponse(error);

    // Send error response
    res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors (route not found)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(
        `Route ${req.method} ${req.originalUrl} not found`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
};

/**
 * Async error wrapper to catch promise rejections
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    ApiError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    errorHandler,
    notFoundHandler,
    asyncHandler,
    formatErrorResponse,
    getStatusCode,
    logError
};
