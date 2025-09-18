/**
 * Logger Utility
 * Structured logging configuration
 */

const { config } = require('../config/env');

/**
 * Log levels
 */
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

/**
 * Get current log level numeric value
 */
const getCurrentLogLevel = () => {
    return LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;
};

/**
 * Format timestamp
 * @returns {string} Formatted timestamp
 */
const formatTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatMessage = (level, message, meta = {}) => {
    const timestamp = formatTimestamp();
    const logLevel = level.toUpperCase().padEnd(5);
    
    let logMessage = `[${timestamp}] ${logLevel} ${message}`;
    
    if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Object} meta - Additional metadata
 */
const error = (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.error) {
        console.error(formatMessage('error', message, meta));
    }
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
const warn = (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.warn) {
        console.warn(formatMessage('warn', message, meta));
    }
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
const info = (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.info) {
        console.log(formatMessage('info', message, meta));
    }
};

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
const debug = (message, meta = {}) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.debug) {
        console.log(formatMessage('debug', message, meta));
    }
};

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
const logRequest = (req, res, duration) => {
    const meta = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        ...(req.user && { userId: req.user.uid })
    };
    
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
    
    if (res.statusCode >= 500) {
        error(message, meta);
    } else if (res.statusCode >= 400) {
        warn(message, meta);
    } else {
        info(message, meta);
    }
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logRequest(req, res, duration);
    });
    
    next();
};

/**
 * Log application startup
 * @param {number} port - Server port
 */
const logStartup = (port) => {
    info('🚀 Server Starting', {
        port,
        environment: config.server.nodeEnv,
        nodeVersion: process.version,
        timestamp: formatTimestamp()
    });
    
    info(`📊 Dashboard: http://localhost:${port}`);
    info(`📖 API Docs: http://localhost:${port}/api/docs`);
    info(`❤️  Health Check: http://localhost:${port}/api/health`);
};

/**
 * Log application shutdown
 * @param {string} signal - Shutdown signal
 */
const logShutdown = (signal) => {
    info('🛑 Server Shutting Down', { signal, timestamp: formatTimestamp() });
};

module.exports = {
    error,
    warn,
    info,
    debug,
    logRequest,
    requestLogger,
    logStartup,
    logShutdown,
    formatMessage,
    formatTimestamp,
    LOG_LEVELS,
    getCurrentLogLevel
};
