/**
 * Memory Monitoring and Optimization
 * Monitors memory usage and performs cleanup for container environments
 */

/**
 * Memory threshold configuration (in MB)
 */
const MEMORY_THRESHOLDS = {
    WARNING: 300,  // 300MB - log warning
    CRITICAL: 400, // 400MB - force garbage collection
    MAX: 450       // 450MB - emergency cleanup
};

/**
 * Get current memory usage in MB
 * @returns {Object} Memory usage statistics
 */
const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
        percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
};

/**
 * Force garbage collection if available
 */
const forceGarbageCollection = () => {
    if (global.gc) {
        console.log('🧹 Forcing garbage collection...');
        global.gc();
        
        const afterCleanup = getMemoryUsage();
        console.log(`✅ Memory after cleanup: ${afterCleanup.heapUsed}MB (${afterCleanup.percentage}%)`);
    } else {
        console.log('⚠️ Garbage collection not available. Start with --expose-gc flag.');
    }
};

/**
 * Check memory usage and perform cleanup if needed
 */
const checkMemoryUsage = () => {
    const memory = getMemoryUsage();
    
    if (memory.heapUsed > MEMORY_THRESHOLDS.MAX) {
        console.error(`🚨 CRITICAL: Memory usage at ${memory.heapUsed}MB (${memory.percentage}%)`);
        forceGarbageCollection();
        
        // If still critical after GC, log warning
        const afterGC = getMemoryUsage();
        if (afterGC.heapUsed > MEMORY_THRESHOLDS.CRITICAL) {
            console.error(`⚠️ Memory still high after cleanup: ${afterGC.heapUsed}MB`);
        }
    } else if (memory.heapUsed > MEMORY_THRESHOLDS.CRITICAL) {
        console.warn(`⚠️ High memory usage: ${memory.heapUsed}MB (${memory.percentage}%)`);
        forceGarbageCollection();
    } else if (memory.heapUsed > MEMORY_THRESHOLDS.WARNING) {
        console.log(`📊 Memory usage: ${memory.heapUsed}MB (${memory.percentage}%)`);
    }
    
    return memory;
};

/**
 * Start periodic memory monitoring
 * @param {number} interval - Check interval in milliseconds (default: 60000 = 1 minute)
 */
const startMemoryMonitoring = (interval = 60000) => {
    console.log(`📊 Starting memory monitoring (every ${interval / 1000}s)`);
    
    // Initial check
    checkMemoryUsage();
    
    // Periodic monitoring
    setInterval(() => {
        try {
            checkMemoryUsage();
        } catch (error) {
            console.error('❌ Error in memory monitoring:', error);
        }
    }, interval);
};

/**
 * Setup memory monitoring for Choreo environment
 */
const setupChoreoMemoryMonitoring = () => {
    // Check if memory monitoring is disabled
    if (process.env.DISABLE_MEMORY_MONITORING === 'true') {
        console.log('📊 Memory monitoring disabled by environment variable');
        return;
    }
    
    // Check if running in Choreo/container environment
    const isContainer = process.env.NODE_ENV === 'production' || 
                        process.env.CONTAINER === 'true' ||
                        process.env.KUBERNETES_SERVICE_HOST;
                        
    if (isContainer) {
        console.log('🐳 Container environment detected, enabling light memory monitoring');
        
        // Start monitoring every 2 minutes in production (less frequent)
        startMemoryMonitoring(120000);
        
        // Only log memory usage on shutdown - no other event monitoring
        process.on('SIGTERM', () => {
            console.log('📊 Memory usage before shutdown:', getMemoryUsage());
        });
        
    } else {
        console.log('💻 Development environment detected, basic memory monitoring enabled');
        startMemoryMonitoring(300000); // Every 5 minutes in development
    }
};

/**
 * Get memory status for health checks
 * @returns {Object} Memory status object
 */
const getMemoryStatus = () => {
    const memory = getMemoryUsage();
    let status = 'healthy';
    let message = `Memory usage: ${memory.heapUsed}MB (${memory.percentage}%)`;
    
    if (memory.heapUsed > MEMORY_THRESHOLDS.CRITICAL) {
        status = 'critical';
        message = `Critical memory usage: ${memory.heapUsed}MB`;
    } else if (memory.heapUsed > MEMORY_THRESHOLDS.WARNING) {
        status = 'warning';
        message = `High memory usage: ${memory.heapUsed}MB`;
    }
    
    return {
        status,
        message,
        usage: memory,
        thresholds: MEMORY_THRESHOLDS
    };
};

module.exports = {
    getMemoryUsage,
    checkMemoryUsage,
    startMemoryMonitoring,
    setupChoreoMemoryMonitoring,
    getMemoryStatus,
    forceGarbageCollection
};
