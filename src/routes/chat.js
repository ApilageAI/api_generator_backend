/**
 * Chat Routes
 * Handle AI chat interactions
 */

const express = require('express');
const { verifyApiKey } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateAIResponse } = require('../services/geminiService');
const { deductCredits, logUserRequest } = require('../services/userService');

const router = express.Router();

/**
 * POST /api/chat
 * Send a message to AI and get response
 */
router.post('/', verifyApiKey, asyncHandler(async (req, res) => {
    const { message } = req.body;
    const startTime = Date.now();

    try {
        // Generate AI response
        const aiResponseData = await generateAIResponse(message);
        
        // Deduct credits from user
        const updatedUser = await deductCredits(req.user.uid, 1);
        
        // Log the request for analytics
        const requestId = await logUserRequest(req.user.uid, {
            message,
            responseLength: aiResponseData.response.length,
            responseTime: aiResponseData.responseTime,
            creditsUsed: 1,
            model: aiResponseData.model,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        const totalTime = Date.now() - startTime;
        
        // Send success response
        res.json({
            success: true,
            response: aiResponseData.response,
            credits_remaining: updatedUser.credits,
            request_id: requestId,
            model: aiResponseData.model,
            response_time_ms: aiResponseData.responseTime,
            total_time_ms: totalTime,
            timestamp: aiResponseData.timestamp
        });

        console.log(`💬 Chat request completed in ${totalTime}ms`);
    } catch (error) {
        console.error('Chat route error:', error);
        throw error; // Will be handled by error middleware
    }
}));

/**
 * GET /api/chat/models
 * Get available AI models information
 */
router.get('/models', asyncHandler(async (req, res) => {
    res.json({
        success: true,
        models: [
            {
                id: 'gemini-2.0-flash',
                name: 'Gemini 2.0 Flash',
                description: 'Fast and efficient AI model optimized for educational content',
                max_tokens: 2048,
                features: [
                    'Text generation',
                    'Code assistance', 
                    'Mathematical problem solving',
                    'Sri Lankan curriculum support',
                    'LaTeX formatting'
                ],
                cost_per_request: 1
            }
        ],
        default_model: 'gemini-2.0-flash'
    });
}));

module.exports = router;
