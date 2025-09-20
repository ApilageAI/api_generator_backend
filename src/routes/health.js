/**
 * Health Check Routes
 * System health monitoring and status endpoints
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { testConnection } = require('../config/database');
const { checkServiceHealth } = require('../services/geminiService');
const { getMemoryStatus } = require('../utils/memoryMonitor');

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
        // Quick readiness check - ensure app can handle requests
        const db = getDatabase();
        if (!db) {
            return res.status(503).json({
                success: false,
                status: 'not_ready',
                message: 'Database not initialized'
            });
        }

        res.json({
            success: true,
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'not_ready',
            error: error.message
        });
    }
}));

/**
 * GET /api/health/live
 * Kubernetes/Docker liveness probe  
 */
router.get('/live', (req, res) => {
    // Simple liveness check - just return OK if process is running
    res.json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * GET /api/health/choreo
 * Choreo-specific health check
 */
router.get('/choreo', asyncHandler(async (req, res) => {
    const uptime = process.uptime();
    const memoryStatus = getMemoryStatus();
    
    // Choreo health check with detailed info
    const healthData = {
        success: true,
        status: 'healthy',
        service: 'apilage-ai-backend',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(uptime),
        memory: {
            used_mb: memoryStatus.usage.heapUsed,
            total_mb: memoryStatus.usage.heapTotal,
            percentage: memoryStatus.usage.percentage,
            status: memoryStatus.status
        },
        environment: process.env.NODE_ENV || 'production',
        node_version: process.version
    };

    // Set overall status based on memory status
    if (memoryStatus.status === 'critical') {
        healthData.status = 'unhealthy';
        healthData.success = false;
        healthData.message = memoryStatus.message;
    } else if (memoryStatus.status === 'warning') {
        healthData.status = 'degraded';
        healthData.warning = memoryStatus.message;
    }

    // HTTP status code based on health status
    let statusCode = 200;
    if (healthData.status === 'unhealthy') {
        statusCode = 503;
    } else if (healthData.status === 'degraded') {
        statusCode = 207;
    }

    res.status(statusCode).json(healthData);
}));

module.exports = router;
