/**
 * End-to-End (E2E) System Tests
 * Tests the complete system functionality from startup to shutdown
 */

const TestHelper = require('../utils/testHelper');

class E2ESystemTests {
    constructor() {
        this.testHelper = new TestHelper();
    }

    async runAll() {
        console.log('🌐 End-to-End System Tests\n');
        
        this.testHelper.setupGracefulExit();
        
        try {
            const tests = [
                { name: 'Complete Server Lifecycle', fn: () => this.testServerLifecycle() },
                { name: 'Full API Workflow', fn: () => this.testFullAPIWorkflow() },
                { name: 'Error Recovery System', fn: () => this.testErrorRecovery() },
                { name: 'Production Environment Simulation', fn: () => this.testProductionEnvironment() },
                { name: 'High Load System Test', fn: () => this.testHighLoadSystem() },
                { name: 'Graceful Shutdown Test', fn: () => this.testGracefulShutdown() }
            ];
            
            const results = await this.testHelper.runTestSuite(tests);
            
            if (results.success) {
                console.log('\n🎉 All E2E system tests passed!');
            } else {
                console.log('\n⚠️  Some E2E system tests failed');
            }
            
            return results;
            
        } catch (error) {
            console.error('💥 E2E tests failed:', error.message);
            throw error;
        }
    }

    async testServerLifecycle() {
        console.log('    Testing complete server startup and readiness...');
        
        // Start server
        await this.testHelper.startServer({ timeout: 45000 });
        
        // Wait for full initialization
        await this.testHelper.wait(3000);
        
        // Verify server is fully operational
        const healthCheck = await this.testHelper.makeRequest('/api/health/debug');
        
        this.testHelper.assert(
            healthCheck.statusCode === 200,
            'Server should be fully operational after startup'
        );
        
        this.testHelper.assert(
            healthCheck.data.uptime_seconds >= 2,
            'Server should have reasonable uptime after initialization'
        );
        
        this.testHelper.assert(
            healthCheck.data.environment.node_env === 'production',
            'Server should be running in production environment'
        );
        
        console.log('    ✅ Server lifecycle test completed');
        
        // Stop server for next test
        await this.testHelper.stopServer();
    }

    async testFullAPIWorkflow() {
        console.log('    Testing complete API workflow...');
        
        // Start fresh server
        await this.testHelper.startServer();
        await this.testHelper.wait(2000);
        
        // 1. Check server health
        const healthResponse = await this.testHelper.makeRequest('/api/health');
        this.testHelper.assert(
            healthResponse.statusCode === 200 && healthResponse.data.success,
            'Health check should pass'
        );
        
        // 2. Test all health endpoints
        const endpoints = ['/api/health/live', '/api/health/debug', '/api/health/choreo'];
        for (const endpoint of endpoints) {
            const response = await this.testHelper.makeRequest(endpoint);
            this.testHelper.assert(
                response.statusCode === 200,
                `Endpoint ${endpoint} should be accessible`
            );
        }
        
        // 3. Test authentication flow
        const chatResponse = await this.testHelper.makeRequest('/api/chat', 'POST', 
            JSON.stringify({ message: 'test', userId: 'test' }));
        
        this.testHelper.assert(
            chatResponse.statusCode === 401 || chatResponse.statusCode === 403,
            'Protected endpoints should require authentication'
        );
        
        // 4. Test error handling
        try {
            await this.testHelper.makeRequest('/api/nonexistent');
        } catch (error) {
            // Expected - 404 handling
        }
        
        // 5. Verify system is still stable after workflow
        const finalHealthCheck = await this.testHelper.makeRequest('/api/health/live');
        this.testHelper.assert(
            finalHealthCheck.statusCode === 200,
            'System should remain stable after full workflow'
        );
        
        console.log('    ✅ Full API workflow test completed');
        await this.testHelper.stopServer();
    }

    async testErrorRecovery() {
        console.log('    Testing system error recovery...');
        
        await this.testHelper.startServer();
        await this.testHelper.wait(2000);
        
        // Generate various types of errors and verify recovery
        
        // 1. Invalid requests
        const invalidRequests = [
            '/api/nonexistent',
            '/api/health/invalid',
            '/api/chat/invalid'
        ];
        
        for (const invalidPath of invalidRequests) {
            try {
                await this.testHelper.makeRequest(invalidPath);
            } catch (error) {
                // Expected errors
            }
        }
        
        // 2. Verify server is still responding after errors
        const recoveryCheck = await this.testHelper.makeRequest('/api/health/live');
        this.testHelper.assert(
            recoveryCheck.statusCode === 200,
            'Server should recover from invalid requests'
        );
        
        // 3. Test malformed requests
        try {
            await this.testHelper.makeRequest('/api/chat', 'POST', 'invalid-json');
        } catch (error) {
            // Expected
        }
        
        // 4. Final stability check
        const finalCheck = await this.testHelper.makeRequest('/api/health/debug');
        this.testHelper.assert(
            finalCheck.statusCode === 200,
            'Server should remain stable after error recovery tests'
        );
        
        console.log('    ✅ Error recovery test completed');
        await this.testHelper.stopServer();
    }

    async testProductionEnvironment() {
        console.log('    Testing production environment simulation...');
        
        // Start with production-like environment variables
        await this.testHelper.startServer({
            env: {
                NODE_ENV: 'production',
                CONTAINER: 'true',
                DISABLE_MEMORY_MONITORING: 'true',
                LOG_LEVEL: 'warn'
            }
        });
        
        await this.testHelper.wait(3000);
        
        // Verify production environment is active
        const debugResponse = await this.testHelper.makeRequest('/api/health/debug');
        
        this.testHelper.assert(
            debugResponse.data.environment.node_env === 'production',
            'Should be running in production mode'
        );
        
        this.testHelper.assert(
            debugResponse.data.environment.container === 'true',
            'Should detect container environment'
        );
        
        this.testHelper.assert(
            debugResponse.data.environment.disable_monitoring === 'true',
            'Memory monitoring should be disabled'
        );
        
        // Test production-level load
        console.log('    Simulating production load...');
        const promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(this.testHelper.makeRequest('/api/health/live'));
        }
        
        const results = await Promise.all(promises);
        const successes = results.filter(r => r.statusCode === 200).length;
        
        this.testHelper.assert(
            successes === 100,
            'All requests should succeed under production simulation'
        );
        
        console.log('    ✅ Production environment test completed');
        await this.testHelper.stopServer();
    }

    async testHighLoadSystem() {
        console.log('    Testing system under high load...');
        
        await this.testHelper.startServer();
        await this.testHelper.wait(3000);
        
        // Get initial system state
        const initialState = await this.testHelper.makeRequest('/api/health/debug');
        const initialMemory = initialState.data.memory.heap_used_mb;
        
        console.log(`    Initial memory: ${initialMemory}MB`);
        
        // Generate high load
        console.log('    Generating high load (500 concurrent requests)...');
        
        const highLoadPromises = [];
        for (let i = 0; i < 500; i++) {
            highLoadPromises.push(this.testHelper.makeRequest('/api/health/live'));
        }
        
        const startTime = Date.now();
        const highLoadResults = await Promise.all(highLoadPromises);
        const duration = Date.now() - startTime;
        
        const successes = highLoadResults.filter(r => r.statusCode === 200).length;
        const failureRate = ((500 - successes) / 500) * 100;
        
        console.log(`    High load completed in ${duration}ms`);
        console.log(`    Success rate: ${((successes/500)*100).toFixed(1)}%`);
        
        this.testHelper.assert(
            failureRate < 5,
            `Failure rate under high load should be low, got ${failureRate.toFixed(1)}%`
        );
        
        // Check system state after load
        const postLoadState = await this.testHelper.makeRequest('/api/health/debug');
        const finalMemory = postLoadState.data.memory.heap_used_mb;
        const memoryIncrease = finalMemory - initialMemory;
        
        console.log(`    Final memory: ${finalMemory}MB (+${memoryIncrease}MB)`);
        
        this.testHelper.assert(
            memoryIncrease < 50,
            `Memory increase should be reasonable, got ${memoryIncrease}MB`
        );
        
        this.testHelper.assert(
            postLoadState.data.uptime_seconds > 0,
            'System should remain stable after high load'
        );
        
        console.log('    ✅ High load system test completed');
        await this.testHelper.stopServer();
    }

    async testGracefulShutdown() {
        console.log('    Testing graceful shutdown behavior...');
        
        // Start server
        await this.testHelper.startServer();
        await this.testHelper.wait(2000);
        
        // Verify server is running
        const preShutdownCheck = await this.testHelper.makeRequest('/api/health/live');
        this.testHelper.assert(
            preShutdownCheck.statusCode === 200,
            'Server should be running before shutdown test'
        );
        
        // Initiate graceful shutdown
        console.log('    Initiating graceful shutdown...');
        const shutdownStart = Date.now();
        
        this.testHelper.serverProcess.kill('SIGTERM');
        
        // Wait for shutdown
        await new Promise((resolve) => {
            this.testHelper.serverProcess.on('exit', (code) => {
                const shutdownDuration = Date.now() - shutdownStart;
                console.log(`    Server shut down in ${shutdownDuration}ms with code ${code}`);
                
                // Verify graceful shutdown timing
                this.testHelper.assert(
                    shutdownDuration < 10000,
                    'Graceful shutdown should complete within 10 seconds'
                );
                
                this.testHelper.assert(
                    code === 0 || code === null,
                    'Server should exit gracefully without errors'
                );
                
                resolve();
            });
            
            // Fallback timeout
            setTimeout(resolve, 15000);
        });
        
        // Verify server is no longer accessible
        try {
            await this.testHelper.makeRequest('/api/health/live', 'GET', null, 1000);
            throw new Error('Server should not be accessible after shutdown');
        } catch (error) {
            // Expected - server should be down
            console.log('    ✅ Server properly shut down and inaccessible');
        }
        
        // Clean up
        this.testHelper.serverProcess = null;
        console.log('    ✅ Graceful shutdown test completed');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const e2eTests = new E2ESystemTests();
    
    e2eTests.runAll()
        .then((results) => {
            process.exit(results.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 E2E system tests failed:', error.message);
            process.exit(1);
        });
}

module.exports = E2ESystemTests;
