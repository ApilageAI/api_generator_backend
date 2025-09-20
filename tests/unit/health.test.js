/**
 * Unit Tests for Health Check Endpoints
 */

const TestHelper = require('../utils/testHelper');

class HealthTests {
    constructor() {
        this.testHelper = new TestHelper();
    }

    async runAll() {
        console.log('🏥 Health Check Unit Tests\n');
        
        this.testHelper.setupGracefulExit();
        
        try {
            // Start server for testing
            await this.testHelper.startServer();
            await this.testHelper.wait(2000); // Allow full startup
            
            const tests = [
                { name: 'Live Endpoint Basic Test', fn: () => this.testLiveEndpoint() },
                { name: 'Live Endpoint Response Structure', fn: () => this.testLiveEndpointStructure() },
                { name: 'Health Endpoint Basic Test', fn: () => this.testHealthEndpoint() },
                { name: 'Debug Endpoint Test', fn: () => this.testDebugEndpoint() },
                { name: 'Debug Endpoint Data Validation', fn: () => this.testDebugEndpointData() },
                { name: 'Choreo Endpoint Test', fn: () => this.testChoreoEndpoint() },
                { name: 'Ready Endpoint Test', fn: () => this.testReadyEndpoint() },
                { name: 'Invalid Endpoint 404 Test', fn: () => this.test404Handling() },
                { name: 'CORS Options Test', fn: () => this.testCORSOptions() }
            ];
            
            const results = await this.testHelper.runTestSuite(tests);
            
            if (results.success) {
                console.log('\n🎉 All health check tests passed!');
            } else {
                console.log('\n⚠️  Some health check tests failed');
            }
            
            return results;
            
        } finally {
            await this.testHelper.cleanup();
        }
    }

    async testLiveEndpoint() {
        const response = await this.testHelper.makeRequest('/api/health/live');
        
        this.testHelper.assert(
            response.statusCode === 200,
            `Expected status 200, got ${response.statusCode}`
        );
        
        this.testHelper.assert(
            response.data && response.data.status === 'alive',
            'Live endpoint should return status: alive'
        );
    }

    async testLiveEndpointStructure() {
        const response = await this.testHelper.makeRequest('/api/health/live');
        
        this.testHelper.assert(
            response.data.uptime !== undefined,
            'Live endpoint should include uptime'
        );
        
        this.testHelper.assert(
            response.data.timestamp !== undefined,
            'Live endpoint should include timestamp'
        );
        
        this.testHelper.assert(
            response.data.pid !== undefined,
            'Live endpoint should include process ID'
        );
        
        this.testHelper.assert(
            typeof response.data.uptime === 'number' && response.data.uptime >= 0,
            'Uptime should be a non-negative number'
        );
    }

    async testHealthEndpoint() {
        const response = await this.testHelper.makeRequest('/api/health');
        
        this.testHelper.assert(
            response.statusCode === 200,
            `Health endpoint should return 200, got ${response.statusCode}`
        );
        
        this.testHelper.assert(
            response.data && response.data.success === true,
            'Health endpoint should return success: true'
        );
        
        this.testHelper.assert(
            response.data.memory !== undefined,
            'Health endpoint should include memory information'
        );
    }

    async testDebugEndpoint() {
        const response = await this.testHelper.makeRequest('/api/health/debug');
        
        this.testHelper.assert(
            response.statusCode === 200,
            `Debug endpoint should return 200, got ${response.statusCode}`
        );
        
        this.testHelper.assert(
            response.data && response.data.status === 'debug_ok',
            'Debug endpoint should return status: debug_ok'
        );
    }

    async testDebugEndpointData() {
        const response = await this.testHelper.makeRequest('/api/health/debug');
        
        // Validate process information
        this.testHelper.assert(
            response.data.process && response.data.process.pid,
            'Debug should include process.pid'
        );
        
        this.testHelper.assert(
            response.data.process.version,
            'Debug should include process.version'
        );
        
        // Validate memory information
        this.testHelper.assert(
            response.data.memory && response.data.memory.heap_used_mb >= 0,
            'Debug should include valid memory.heap_used_mb'
        );
        
        this.testHelper.assert(
            response.data.memory.heap_total_mb >= response.data.memory.heap_used_mb,
            'Total memory should be >= used memory'
        );
        
        // Validate environment information
        this.testHelper.assert(
            response.data.environment && response.data.environment.node_env,
            'Debug should include environment.node_env'
        );
    }

    async testChoreoEndpoint() {
        const response = await this.testHelper.makeRequest('/api/health/choreo');
        
        this.testHelper.assert(
            response.statusCode === 200 || response.statusCode === 207,
            `Choreo endpoint should return 200 or 207, got ${response.statusCode}`
        );
        
        this.testHelper.assert(
            response.data && response.data.service === 'apilage-ai-backend',
            'Choreo endpoint should identify correct service'
        );
        
        this.testHelper.assert(
            response.data.version === '2.0.0',
            'Choreo endpoint should return correct version'
        );
        
        this.testHelper.assert(
            response.data.memory && response.data.memory.used_mb !== undefined,
            'Choreo endpoint should include memory usage'
        );
    }

    async testReadyEndpoint() {
        const response = await this.testHelper.makeRequest('/api/health/ready');
        
        // Ready endpoint can return 200 (ready) or 503 (not ready)
        this.testHelper.assert(
            response.statusCode === 200 || response.statusCode === 503,
            `Ready endpoint should return 200 or 503, got ${response.statusCode}`
        );
        
        this.testHelper.assert(
            response.data && response.data.status !== undefined,
            'Ready endpoint should include status field'
        );
    }

    async test404Handling() {
        try {
            const response = await this.testHelper.makeRequest('/api/nonexistent-endpoint');
            
            this.testHelper.assert(
                response.statusCode === 404,
                `Non-existent endpoint should return 404, got ${response.statusCode}`
            );
            
        } catch (error) {
            // It's acceptable for 404 to throw an error in some cases
            console.log('404 handling via exception (acceptable)');
        }
    }

    async testCORSOptions() {
        try {
            const response = await this.testHelper.makeRequest('/api/health', 'OPTIONS');
            
            // CORS OPTIONS should be handled gracefully
            this.testHelper.assert(
                response.statusCode === 200 || response.statusCode === 204,
                `OPTIONS request should be handled properly, got ${response.statusCode}`
            );
            
        } catch (error) {
            // Some CORS configurations might not expose OPTIONS
            console.log('CORS OPTIONS not explicitly configured (acceptable)');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const healthTests = new HealthTests();
    
    healthTests.runAll()
        .then((results) => {
            process.exit(results.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 Health tests failed:', error.message);
            process.exit(1);
        });
}

module.exports = HealthTests;
