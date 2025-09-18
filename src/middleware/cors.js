/**
 * CORS Middleware Configuration
 * Cross-Origin Resource Sharing setup with environment-based origins
 */

const cors = require('cors');
const { config, isDevelopment } = require('../config/env');

/**
 * CORS configuration with dynamic origin validation
 */
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = config.cors.allowedOrigins;
        
        // Allow requests with no origin in development (mobile apps, curl, Postman)
        if (!origin && isDevelopment()) {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization'
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
    ]
};

/**
 * Development CORS - more permissive for local development
 */
const devCorsOptions = {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: '*'
};

/**
 * Get CORS middleware based on environment
 * @returns {Function} CORS middleware
 */
const getCorsMiddleware = () => {
    if (isDevelopment()) {
        console.log('🔓 Using development CORS settings (permissive)');
        return cors(devCorsOptions);
    } else {
        console.log('🔒 Using production CORS settings');
        console.log(`   Allowed origins: ${config.cors.allowedOrigins.join(', ')}`);
        return cors(corsOptions);
    }
};

/**
 * CORS error handler middleware
 */
const corsErrorHandler = (err, req, res, next) => {
    if (err.message.includes('CORS policy')) {
        return res.status(403).json({
            success: false,
            error: 'CORS policy violation',
            message: 'Origin not allowed',
            code: 'CORS_ERROR'
        });
    }
    next(err);
};

/**
 * Preflight handler for complex CORS requests
 */
const handlePreflight = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.status(200).end();
    }
    next();
};

module.exports = {
    corsOptions,
    devCorsOptions,
    getCorsMiddleware,
    corsErrorHandler,
    handlePreflight
};
