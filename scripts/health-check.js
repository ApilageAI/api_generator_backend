#!/usr/bin/env node
/**
 * Health Check Script
 * Quick health check for the API server
 */

const http = require('http');

const checkEndpoint = (path, expectedStatus = 200) => {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    path,
                    status: res.statusCode,
                    success: res.statusCode === expectedStatus,
                    data: data ? JSON.parse(data) : null
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Request timeout')));
        req.end();
    });
};

const runHealthCheck = async () => {
    console.log('🏥 Apilage AI Platform - Health Check');
    console.log('====================================\n');

    const endpoints = [
        { path: '/api/health/live', name: 'Liveness Probe' },
        { path: '/api/health', name: 'Main Health Check' },
        { path: '/api/health/debug', name: 'Debug Endpoint' },
        { path: '/api/health/choreo', name: 'Choreo Health Check' }
    ];

    let allHealthy = true;

    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Checking ${endpoint.name}...`);
            const result = await checkEndpoint(endpoint.path);
            
            if (result.success) {
                console.log(`✅ ${endpoint.name}: HEALTHY (${result.status})`);
                
                // Show some useful info for debug endpoint
                if (endpoint.path === '/api/health/debug' && result.data) {
                    console.log(`   📊 Memory: ${result.data.memory.heap_used_mb}MB`);
                    console.log(`   ⏰ Uptime: ${result.data.uptime_seconds}s`);
                }
            } else {
                console.log(`❌ ${endpoint.name}: UNHEALTHY (${result.status})`);
                allHealthy = false;
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
            allHealthy = false;
        }
    }

    console.log('\n📊 Overall Health Status:');
    if (allHealthy) {
        console.log('✅ ALL SYSTEMS HEALTHY - Server is operational');
        process.exit(0);
    } else {
        console.log('❌ SOME ISSUES DETECTED - Check server logs');
        process.exit(1);
    }
};

// Handle CLI usage
if (require.main === module) {
    console.log('Connecting to http://localhost:3000...\n');
    runHealthCheck().catch(error => {
        console.error('💥 Health check failed:', error.message);
        console.log('\n💡 Make sure the server is running with: npm start');
        process.exit(1);
    });
}

module.exports = { checkEndpoint, runHealthCheck };
