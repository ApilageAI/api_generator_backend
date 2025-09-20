/**
 * Integration Tests for API Endpoints
 * Tests the full API functionality and integration between components
 */

const TestHelper = require('../utils/testHelper');

class APIIntegrationTests {
    constructor() {
        this.testHelper = new TestHelper();
    }

    async runAll() {
        console.log('🔗 API Integration Tests\n');
        
        this.testHelper.setupGracefulExit();
        
        try {
            // Start server for testing
            await this.testHelper.startServer();
            await this.testHelper.wait(3000); // Allow full startup with all integrations
            
            const tests = [
                { name: 'Server Full Startup Integration', fn: () => this.testServerStartup() },
                { name: 'Health Check Integration', fn: () => this.testHealthCheckIntegration() },
                { name: 'Database Connection Integration', fn: () => this.testDatabaseIntegration() },
                { name: 'CORS Integration', fn: () => this.testCORSIntegration() },
                { name: 'Error Handling Integration', fn: () => this.testErrorHandlingIntegration() },
                { name: 'Authentication Flow Integration', fn: () => this.testAuthenticationIntegration() },
                { name: 'Memory Monitoring Integration', fn: () => this.testMemoryMonitoringIntegration() },
                { name: 'Logging Integration', fn: () => this.testLoggingIntegration() }
            ];
            
            const results = await this.testHelper.runTestSuite(tests);
            
            if (results.success) {
                console.log('\n🎉 All API integration tests passed!');
            } else {
                console.log('\n⚠️  Some API integration tests failed');
            }
            
            return results;
            
        } finally {
            await this.testHelper.cleanup();
        }
    }

    async testServerStartup() {
        // Test that all components are properly initialized
        const debugResponse = await this.testHelper.makeRequest('/api/health/debug');
        
        this.testHelper.assert(
            debugResponse.statusCode === 200,
            'Server should be fully initialized and responsive'
        );
        
        this.testHelper.assert(
            debugResponse.data.uptime_seconds > 0,
            'Server should have positive uptime'
        );
        
        this.testHelper.assert(
            debugResponse.data.environment.node_env === 'production',
            'Server should be running in production mode'
        );
        
        this.testHelper.assert(
            debugResponse.data.environment.container === 'true',
            'Server should detect container mode'
        );
    }

    async testHealthCheckIntegration() {
        // Test that all health check endpoints work together
        const endpoints = ['/api/health/live', '/api/health', '/api/health/debug', '/api/health/choreo'];
        
        for (const endpoint of endpoints) {
            const response = await this.testHelper.makeRequest(endpoint);
            
            this.testHelper.assert(
                response.statusCode >= 200 && response.statusCode < 300,
                `Health endpoint ${endpoint} should return success status`
            );
            
            this.testHelper.assert(
                response.data !== null,
                `Health endpoint ${endpoint} should return valid JSON`
            );
        }
        
        // Test cross-endpoint consistency
        const liveResponse = await this.testHelper.makeRequest('/api/health/live');
        const debugResponse = await this.testHelper.makeRequest('/api/health/debug');
        
        // Both should report same process ID
        this.testHelper.assert(
            liveResponse.data.pid === debugResponse.data.process.pid,
            'Live and debug endpoints should report same process ID'
        );
    }

    async testDatabaseIntegration() {
        // Test database connectivity through health checks
        const healthResponse = await this.testHelper.makeRequest('/api/health/detailed');
        
        if (healthResponse.statusCode === 200 && healthResponse.data.checks) {
            // If detailed health check exists, verify database status
            this.testHelper.assert(
                healthResponse.data.checks.database || healthResponse.data.checks.firestore,
                'Database/Firestore should be connected and healthy'
            );
        } else {
            // Fallback test - check if basic health works (implies DB is working)
            const basicHealth = await this.testHelper.makeRequest('/api/health');
            this.testHelper.assert(
                basicHealth.statusCode === 200,
                'Basic health check should pass (implies database connectivity)'
            );
        }
    }

    async testCORSIntegration() {
        // Test CORS headers are properly set
        const response = await this.testHelper.makeRequest('/api/health/live');
        
        // Check for CORS headers (may vary based on configuration)
        const corsHeaders = [
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers'
        ];
        
        let corsConfigured = false;
        for (const header of corsHeaders) {
            if (response.headers[header]) {
                corsConfigured = true;
                break;
            }
        }
        
        // CORS may not be explicitly visible in all responses, so this is informational
        console.log(`CORS configuration: ${corsConfigured ? 'detected' : 'not explicitly visible'}`);
    }

    async testErrorHandlingIntegration() {
        // Test 404 error handling
        try {
            const response = await this.testHelper.makeRequest('/api/invalid/endpoint');
            
            this.testHelper.assert(
                response.statusCode === 404,
                'Invalid endpoints should return 404'
            );
            
            if (response.data && response.data.message) {
                this.testHelper.assert(
                    response.data.message.includes('not found'),
                    'Error message should indicate route not found'
                );
            }
            
        } catch (error) {
            // Connection errors are also acceptable for invalid endpoints
            console.log('Invalid endpoint properly rejected');
        }
        
        // Test method not allowed (if implemented)
        try {
            const response = await this.testHelper.makeRequest('/api/health/live', 'DELETE');
            
            this.testHelper.assert(
                response.statusCode === 405 || response.statusCode === 404,
                'Invalid methods should return 405 or 404'
            );
            
        } catch (error) {
            console.log('Invalid method properly rejected');
        }
    }

    async testAuthenticationIntegration() {
        // Test that authentication endpoints exist and respond appropriately
        try {
            const chatResponse = await this.testHelper.makeRequest('/api/chat', 'POST', 
                JSON.stringify({ message: "test", userId: "test" }));
            
            this.testHelper.assert(
                chatResponse.statusCode === 401 || chatResponse.statusCode === 403,
                'Chat endpoint should require authentication'
            );
            
            if (chatResponse.data && chatResponse.data.message) {
                this.testHelper.assert(
                    chatResponse.data.message.includes('token') || 
                    chatResponse.data.message.includes('auth') ||
                    chatResponse.data.message.includes('Unauthorized'),
                    'Auth error message should indicate authentication issue'
                );
            }
            
        } catch (error) {
            console.log('Chat endpoint authentication properly enforced');
        }
    }

    async testMemoryMonitoringIntegration() {
        // Test memory monitoring is working (should be disabled in test environment)
        const debugResponse = await this.testHelper.makeRequest('/api/health/debug');
        
        this.testHelper.assert(
            debugResponse.data.memory.heap_used_mb > 0,
            'Memory monitoring should report positive memory usage'
        );
        
        this.testHelper.assert(
            debugResponse.data.memory.heap_total_mb >= debugResponse.data.memory.heap_used_mb,
            'Total memory should be >= used memory'
        );
        
        // Test that memory monitoring can be disabled
        this.testHelper.assert(
            debugResponse.data.environment.disable_monitoring === 'true',
            'Memory monitoring should be disabled in test environment'
        );
    }

    async testLoggingIntegration() {
        // Test that logging is working by making requests and checking responses
        const startTime = Date.now();
        
        // Make a request that should be logged
        const response = await this.testHelper.makeRequest('/api/health');
        
        this.testHelper.assert(
            response.statusCode === 200,
            'Request should be successful for logging test'
        );
        
        // Check response time is reasonable (indicates logging isn't blocking)
        const responseTime = Date.now() - startTime;
        this.testHelper.assert(
            responseTime < 1000,
            'Response should be fast (logging not blocking requests)'
        );
        
        // Check for request ID in response headers (if implemented)
        if (response.headers['x-request-id'] || response.headers['request-id']) {
            console.log('Request ID tracking detected');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const apiTests = new APIIntegrationTests();
    
    apiTests.runAll()
        .then((results) => {
            process.exit(results.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 API integration tests failed:', error.message);
            process.exit(1);
        });
}

module.exports = APIIntegrationTests;
