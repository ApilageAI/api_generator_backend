/**
 * Gemini AI Service
 * Handle all Gemini AI API interactions
 */

const { generateResponse, testGeminiConnection } = require('../config/gemini');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Generate AI response from user message
 * @param {string} message - User message
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} AI response data
 */
const generateAIResponse = async (message, options = {}) => {
    try {
        // Validate message
        if (!message || typeof message !== 'string') {
            throw new ApiError('Message is required and must be a string', 400, 'INVALID_MESSAGE');
        }

        if (message.trim().length === 0) {
            throw new ApiError('Message cannot be empty', 400, 'EMPTY_MESSAGE');
        }

        if (message.length > 10000) {
            throw new ApiError('Message too long. Maximum 10,000 characters allowed.', 400, 'MESSAGE_TOO_LONG');
        }

        console.log(`🤖 Generating AI response for message: ${message.substring(0, 100)}...`);

        const startTime = Date.now();
        const aiResponse = await generateResponse(message, options);
        const responseTime = Date.now() - startTime;

        console.log(`✅ AI response generated in ${responseTime}ms`);

        return {
            response: aiResponse,
            responseTime,
            model: "gemini-2.0-flash",
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Gemini service error:', error);

        // Handle specific Gemini API errors
        if (error.response && error.response.data) {
            throw new ApiError(
                `AI service error: ${error.response.data.error?.message || 'Unknown error'}`,
                error.response.status || 500,
                error.response.data.error?.code || 'AI_SERVICE_ERROR'
            );
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            throw new ApiError(
                'AI service timeout. Please try again with a shorter message.',
                408,
                'AI_TIMEOUT'
            );
        }

        // Re-throw ApiError instances
        if (error instanceof ApiError) {
            throw error;
        }

        // Generic error
        throw new ApiError(
            'AI service temporarily unavailable. Please try again later.',
            503,
            'AI_SERVICE_UNAVAILABLE'
        );
    }
};

/**
 * Test Gemini AI service health
 * @returns {Promise<Object>} Service health status
 */
const checkServiceHealth = async () => {
    try {
        const isHealthy = await testGeminiConnection();
        return {
            service: 'gemini',
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Gemini health check failed:', error);
        return {
            service: 'gemini',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Get service statistics
 * @returns {Object} Service statistics
 */
const getServiceStats = () => {
    return {
        service: 'gemini',
        model: 'gemini-2.0-flash',
        maxTokens: 2048,
        timeout: 30000,
        features: [
            'Text generation',
            'Code assistance',
            'Math solutions',
            'Sri Lankan curriculum support'
        ]
    };
};

module.exports = {
    generateAIResponse,
    checkServiceHealth,
    getServiceStats
};
