/**
 * Authentication Middleware
 * API key verification and user credit checking
 */

const { getDatabase } = require('../config/database');

/**
 * Middleware to verify API key and check credits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyApiKey = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // Check for Authorization header
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY',
                code: 'MISSING_AUTH_HEADER'
            });
        }

        const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Validate API key format
        if (!apiKey || apiKey.length < 10) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key format',
                code: 'INVALID_API_KEY_FORMAT'
            });
        }
        
        const db = getDatabase();
        
        // Find user by API key
        const usersSnapshot = await db.collection('users')
            .where('apiKey', '==', apiKey)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key',
                code: 'INVALID_API_KEY'
            });
        }

        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();

        // Check if user account is active
        if (userData.status && userData.status === 'suspended') {
            return res.status(403).json({
                success: false,
                error: 'Account suspended. Please contact support.',
                code: 'ACCOUNT_SUSPENDED'
            });
        }

        // Check credits
        if (userData.credits <= 0) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient credits. Please purchase more credits to continue using the API.',
                code: 'INSUFFICIENT_CREDITS',
                credits_remaining: 0
            });
        }

        // Attach user data to request object
        req.user = {
            uid: userDoc.id,
            ...userData
        };
        
        // Log API access
        console.log(`🔑 API Access: ${userData.email || 'Unknown'} (${userData.credits} credits)`);
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        // Handle specific database errors
        if (error.code === 'unavailable') {
            return res.status(503).json({
                success: false,
                error: 'Service temporarily unavailable. Please try again later.',
                code: 'SERVICE_UNAVAILABLE'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal server error during authentication',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without authentication
    }
    
    // If auth header is present, verify it
    return verifyApiKey(req, res, next);
};

/**
 * Middleware to check if user has admin privileges
 * Requires verifyApiKey to be called first
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Admin privileges required',
            code: 'ADMIN_REQUIRED'
        });
    }
    
    next();
};

/**
 * Middleware to validate API key format without database lookup
 * Useful for rate limiting before expensive database operations
 */
const validateApiKeyFormat = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid Authorization header',
            code: 'MISSING_AUTH_HEADER'
        });
    }

    const apiKey = authHeader.substring(7);
    
    if (!apiKey || apiKey.length < 10) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API key format',
            code: 'INVALID_API_KEY_FORMAT'
        });
    }
    
    next();
};

module.exports = {
    verifyApiKey,
    optionalAuth,
    requireAdmin,
    validateApiKeyFormat
};
