/**
 * Input Validation Utilities
 * Common validation functions for request data
 */

const { ValidationError } = require('../middleware/errorHandler');

/**
 * Validate message input for chat endpoint
 * @param {any} message - Message to validate
 * @returns {string} Validated message
 * @throws {ValidationError} If validation fails
 */
const validateMessage = (message) => {
    // Check if message exists
    if (message === undefined || message === null) {
        throw new ValidationError('Message is required');
    }
    
    // Check if message is string
    if (typeof message !== 'string') {
        throw new ValidationError('Message must be a string');
    }
    
    // Check if message is not empty
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
        throw new ValidationError('Message cannot be empty');
    }
    
    // Check message length
    if (message.length > 10000) {
        throw new ValidationError('Message too long. Maximum 10,000 characters allowed.');
    }
    
    // Check for potentially harmful content (basic check)
    const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /data:text\/html/gi
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(message)) {
            throw new ValidationError('Message contains potentially harmful content');
        }
    }
    
    return trimmedMessage;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {string} Validated email
 * @throws {ValidationError} If validation fails
 */
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        throw new ValidationError('Email is required and must be a string');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
    }
    
    if (email.length > 254) {
        throw new ValidationError('Email too long');
    }
    
    return email.toLowerCase().trim();
};

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {string} Validated API key
 * @throws {ValidationError} If validation fails
 */
const validateApiKey = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
        throw new ValidationError('API key is required and must be a string');
    }
    
    const trimmedKey = apiKey.trim();
    
    if (trimmedKey.length < 10) {
        throw new ValidationError('API key too short');
    }
    
    if (trimmedKey.length > 128) {
        throw new ValidationError('API key too long');
    }
    
    // Basic format check (alphanumeric and some special chars)
    const keyRegex = /^[A-Za-z0-9_-]+$/;
    if (!keyRegex.test(trimmedKey)) {
        throw new ValidationError('Invalid API key format');
    }
    
    return trimmedKey;
};

/**
 * Validate pagination parameters
 * @param {Object} params - Parameters to validate
 * @param {string|number} params.limit - Limit parameter
 * @param {string|number} params.offset - Offset parameter
 * @returns {Object} Validated pagination params
 */
const validatePagination = (params = {}) => {
    const result = {
        limit: 10,
        offset: 0
    };
    
    // Validate limit
    if (params.limit !== undefined) {
        const limit = parseInt(params.limit);
        if (isNaN(limit) || limit < 1) {
            throw new ValidationError('Limit must be a positive number');
        }
        if (limit > 100) {
            throw new ValidationError('Limit cannot exceed 100');
        }
        result.limit = limit;
    }
    
    // Validate offset
    if (params.offset !== undefined) {
        const offset = parseInt(params.offset);
        if (isNaN(offset) || offset < 0) {
            throw new ValidationError('Offset must be a non-negative number');
        }
        result.offset = offset;
    }
    
    return result;
};

/**
 * Validate request body size
 * @param {Object} body - Request body
 * @param {number} maxSize - Maximum allowed size in bytes
 * @throws {ValidationError} If body is too large
 */
const validateBodySize = (body, maxSize = 50000) => { // 50KB default
    const bodySize = JSON.stringify(body).length;
    if (bodySize > maxSize) {
        throw new ValidationError(`Request body too large. Maximum ${maxSize} bytes allowed.`);
    }
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
const sanitizeString = (input, options = {}) => {
    if (typeof input !== 'string') {
        return '';
    }
    
    let sanitized = input;
    
    // Trim whitespace
    if (options.trim !== false) {
        sanitized = sanitized.trim();
    }
    
    // Remove HTML tags
    if (options.stripHtml !== false) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    // Remove control characters
    if (options.removeControlChars !== false) {
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    }
    
    // Limit length
    if (options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
};

/**
 * Validate object has required fields
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredFields - Required field names
 * @throws {ValidationError} If required fields are missing
 */
const validateRequiredFields = (obj, requiredFields) => {
    if (!obj || typeof obj !== 'object') {
        throw new ValidationError('Invalid input object');
    }
    
    const missingFields = requiredFields.filter(field => 
        obj[field] === undefined || obj[field] === null || obj[field] === ''
    );
    
    if (missingFields.length > 0) {
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
};

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Field name for error message
 * @throws {ValidationError} If value is out of range
 */
const validateRange = (value, min, max, fieldName = 'Value') => {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`${fieldName} must be a valid number`);
    }
    
    if (value < min || value > max) {
        throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
    }
    
    return value;
};

module.exports = {
    validateMessage,
    validateEmail,
    validateApiKey,
    validatePagination,
    validateBodySize,
    sanitizeString,
    validateRequiredFields,
    validateRange
};
