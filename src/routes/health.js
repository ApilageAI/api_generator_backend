/**
 * Health Check Routes
 * System health monitoring and status endpoints
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { testConnection } = require('../config/database');
const { checkServiceHealth } = require('../services/geminiService');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', asyncHandler(async (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        uptime_seconds: Math.floor(uptime),
        uptime_readable: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
    });
}));

/**
 * GET /api/health/detailed
 * Detailed health check with dependency status
 */
router.get('/detailed', asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const results = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {}
    };

    try {
        // Check database connection
        console.log('🔍 Checking database health...');
        const dbHealthy = await testConnection();
        results.checks.database = {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            response_time_ms: Date.now() - Date.now(), // Reset timer for each check
            service: 'Firebase Firestore'
        };
    } catch (error) {
        results.checks.database = {
            status: 'unhealthy',
            error: error.message,
            service: 'Firebase Firestore'
        };
        results.status = 'degraded';
    }

    try {
        // Check AI service
        console.log('🔍 Checking AI service health...');
        const aiHealthStart = Date.now();
        const aiHealth = await checkServiceHealth();
        results.checks.ai_service = {
            ...aiHealth,
            response_time_ms: Date.now() - aiHealthStart
        };
        
        if (aiHealth.status !== 'healthy') {
            results.status = results.status === 'healthy' ? 'degraded' : 'unhealthy';
        }
    } catch (error) {
        results.checks.ai_service = {
            status: 'unhealthy',
            error: error.message,
            service: 'Gemini AI'
        };
        results.status = 'unhealthy';
    }

    // System health
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    results.checks.system = {
        status: 'healthy',
        uptime_seconds: Math.floor(uptime),
        memory_usage_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        memory_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        memory_usage_percent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        cpu_user: cpuUsage.user,
        cpu_system: cpuUsage.system,
        node_version: process.version
    };

    // Overall response time
    results.total_check_time_ms = Date.now() - startTime;
    
    // Set final status based on all checks
    const unhealthyChecks = Object.values(results.checks).filter(check => check.status === 'unhealthy').length;
    if (unhealthyChecks > 0) {
        results.status = unhealthyChecks === Object.keys(results.checks).length ? 'unhealthy' : 'degraded';
        results.success = false;
    }

    // Set appropriate HTTP status code
    const statusCode = results.status === 'healthy' ? 200 : results.status === 'degraded' ? 207 : 503;
    
    res.status(statusCode).json(results);
}));

/**
 * GET /api/health/ready
 * Kubernetes/Docker readiness probe
 */
router.get('/ready', asyncHandler(async (req, res) => {
    try {
        // Quick checks for readiness
        const dbReady = await testConnection();
        
        if (dbReady) {
            res.json({
                success: true,
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                success: false,
                status: 'not_ready',
                reason: 'Database connection failed',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'not_ready',
            reason: error.message,
            timestamp: new Date().toISOString()
        });
    }
}));

/**
 * GET /api/health/live
 * Kubernetes/Docker liveness probe
 */
router.get('/live', (req, res) => {
    res.json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
