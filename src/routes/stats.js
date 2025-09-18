/**
 * Stats Routes
 * Handle user statistics and account information
 */

const express = require('express');
const { verifyApiKey, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getUserStats, getUserRequestHistory } = require('../services/userService');

const router = express.Router();

/**
 * GET /api/stats
 * Get user account statistics
 */
router.get('/', verifyApiKey, asyncHandler(async (req, res) => {
    try {
        const stats = await getUserStats(req.user.uid);
        
        res.json({
            success: true,
            ...stats,
            account_status: stats.status || 'active'
        });
    } catch (error) {
        console.error('Stats route error:', error);
        throw error;
    }
}));

/**
 * GET /api/stats/usage
 * Get detailed usage statistics
 */
router.get('/usage', verifyApiKey, asyncHandler(async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const parsedLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 records
        
        const stats = await getUserStats(req.user.uid);
        const requestHistory = await getUserRequestHistory(req.user.uid, parsedLimit);
        
        // Calculate usage analytics
        const totalRequests = stats.total_requests || 0;
        const recentRequests = requestHistory.length;
        const avgResponseTime = requestHistory.length > 0 
            ? requestHistory.reduce((sum, req) => sum + (req.responseTime || 0), 0) / requestHistory.length 
            : 0;
        
        res.json({
            success: true,
            account: {
                credits_remaining: stats.credits_remaining,
                total_requests: totalRequests,
                email: stats.email,
                created_at: stats.created_at,
                last_used: stats.last_used,
                status: stats.status || 'active'
            },
            usage: {
                recent_requests: recentRequests,
                avg_response_time_ms: Math.round(avgResponseTime),
                request_history: requestHistory.map(req => ({
                    request_id: req.requestId,
                    timestamp: req.timestamp,
                    message_preview: req.message?.substring(0, 100) + (req.message?.length > 100 ? '...' : ''),
                    response_length: req.responseLength,
                    response_time_ms: req.responseTime,
                    credits_used: req.creditsUsed || 1,
                    model: req.model
                }))
            },
            limits: {
                max_message_length: 10000,
                max_requests_per_hour: 1000,
                cost_per_request: 1
            }
        });
    } catch (error) {
        console.error('Usage stats route error:', error);
        throw error;
    }
}));

/**
 * GET /api/stats/summary
 * Get quick stats summary (lighter endpoint)
 */
router.get('/summary', verifyApiKey, asyncHandler(async (req, res) => {
    try {
        const stats = await getUserStats(req.user.uid);
        
        res.json({
            success: true,
            credits_remaining: stats.credits_remaining,
            total_requests: stats.total_requests || 0,
            account_status: stats.status || 'active',
            last_used: stats.last_used
        });
    } catch (error) {
        console.error('Summary stats route error:', error);
        throw error;
    }
}));

/**
 * GET /api/stats/public
 * Get public platform statistics (no auth required)
 */
router.get('/public', optionalAuth, asyncHandler(async (req, res) => {
    // This would typically come from a cache or aggregated data
    res.json({
        success: true,
        platform: {
            name: 'Apilage AI',
            version: '2.0.0',
            description: 'AI-powered educational platform for Sri Lankan students',
            features: [
                'Mathematical problem solving',
                'Physics explanations',
                'Code assistance',
                'Study planning',
                'O/L and A/L curriculum support'
            ],
            supported_subjects: [
                'Mathematics',
                'Physics',
                'Chemistry', 
                'Computer Science',
                'Programming'
            ]
        },
        service_status: 'operational',
        uptime: '99.9%'
    });
}));

module.exports = router;
