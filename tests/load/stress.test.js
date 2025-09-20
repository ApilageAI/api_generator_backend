/**
 * Load and Stress Tests
 * Tests application performance under various load conditions
 */

const TestHelper = require('../utils/testHelper');

class StressTests {
    constructor() {
        this.testHelper = new TestHelper();
    }

    async runAll() {
        console.log('⚡ Load and Stress Tests\n');
        
        this.testHelper.setupGracefulExit();
        
        try {
            // Start server for testing
            await this.testHelper.startServer({ timeout: 45000 });
            await this.testHelper.wait(3000); // Allow full startup
            
            const tests = [
                { name: 'Concurrent Request Test (100 requests)', fn: () => this.testConcurrentRequests(100) },
                { name: 'High Concurrency Test (500 requests)', fn: () => this.testConcurrentRequests(500) },
                { name: 'Rapid Fire Test (1000 sequential)', fn: () => this.testRapidFireRequests(1000) },
                { name: 'Mixed Endpoint Load Test', fn: () => this.testMixedEndpointLoad() },
                { name: 'Sustained Load Test (30 seconds)', fn: () => this.testSustainedLoad(30) },
                { name: 'Memory Usage Under Load', fn: () => this.testMemoryUnderLoad() },
                { name: 'Response Time Consistency', fn: () => this.testResponseTimeConsistency() },
                { name: 'Error Rate Under Stress', fn: () => this.testErrorRateUnderStress() }
            ];
            
            const results = await this.testHelper.runTestSuite(tests);
            
            if (results.success) {
                console.log('\n🚀 All load tests passed!');
            } else {
                console.log('\n⚠️  Some load tests failed');
            }
            
            return results;
            
        } finally {
            await this.testHelper.cleanup();
        }
    }

    async testConcurrentRequests(count) {
        console.log(`    Making ${count} concurrent requests...`);
        
        const startTime = Date.now();
        const promises = [];
        
        for (let i = 0; i < count; i++) {
            promises.push(this.testHelper.makeRequest('/api/health/live'));
        }
        
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        const successes = results.filter(r => r.statusCode === 200).length;
        const failures = results.length - successes;
        
        console.log(`    ⚡ ${count} requests completed in ${duration}ms`);
        console.log(`    ✅ Successes: ${successes}, ❌ Failures: ${failures}`);
        console.log(`    📊 Average: ${(duration/count).toFixed(2)}ms per request`);
        console.log(`    🔥 Rate: ${Math.round(count/(duration/1000))} requests/second`);
        
        this.testHelper.assert(
            failures === 0,
            `All ${count} concurrent requests should succeed, but ${failures} failed`
        );
        
        this.testHelper.assert(
            duration < count * 10, // Should handle requests efficiently
            `${count} requests should complete in reasonable time (got ${duration}ms)`
        );
    }

    async testRapidFireRequests(count) {
        console.log(`    Making ${count} rapid-fire requests...`);
        
        const startTime = Date.now();
        let completed = 0;
        let failed = 0;
        
        // Fire requests as fast as possible without waiting
        for (let i = 0; i < count; i++) {
            this.testHelper.makeRequest('/api/health/live', 'GET', null, 2000)
                .then((response) => {
                    if (response.statusCode === 200) {
                        completed++;
                    } else {
                        failed++;
                    }
                })
                .catch(() => failed++);
        }
        
        // Wait for all to complete
        while (completed + failed < count) {
            await this.testHelper.wait(10);
        }
        
        const duration = Date.now() - startTime;
        
        console.log(`    ⚡ ${count} rapid-fire requests completed in ${duration}ms`);
        console.log(`    ✅ Successes: ${completed}, ❌ Failures: ${failed}`);
        console.log(`    🔥 Rate: ${Math.round(count/(duration/1000))} requests/second`);
        
        this.testHelper.assert(
            failed < count * 0.05, // Allow up to 5% failure rate for rapid-fire
            `Rapid-fire test should have low failure rate, got ${failed}/${count} failures`
        );
        
        this.testHelper.assert(
            completed > count * 0.95, // At least 95% should succeed
            `Most rapid-fire requests should succeed, got ${completed}/${count} successes`
        );
    }

    async testMixedEndpointLoad() {
        console.log(`    Testing mixed endpoint load...`);
        
        const endpoints = [
            '/api/health/live',
            '/api/health/debug',
            '/api/health',
            '/api/health/choreo'
        ];
        
        const startTime = Date.now();
        const promises = [];
        
        // Hit each endpoint multiple times simultaneously
        for (let i = 0; i < 50; i++) {
            for (const endpoint of endpoints) {
                promises.push(this.testHelper.makeRequest(endpoint));
            }
        }
        
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        const successes = results.filter(r => r.statusCode >= 200 && r.statusCode < 400).length;
        const serverErrors = results.filter(r => r.statusCode >= 500).length;
        
        console.log(`    ⚡ ${results.length} mixed requests completed in ${duration}ms`);
        console.log(`    ✅ Successes: ${successes}, 🔥 Server errors: ${serverErrors}`);
        console.log(`    📊 Endpoints tested: ${endpoints.join(', ')}`);
        
        this.testHelper.assert(
            serverErrors === 0,
            `Mixed endpoint load should not cause server errors, got ${serverErrors}`
        );
        
        this.testHelper.assert(
            successes > results.length * 0.9, // Allow for some 404s on ready endpoint
            `Most mixed endpoint requests should succeed`
        );
    }

    async testSustainedLoad(durationSeconds) {
        console.log(`    Testing sustained load for ${durationSeconds} seconds...`);
        
        const endTime = Date.now() + (durationSeconds * 1000);
        let totalRequests = 0;
        let successes = 0;
        let failures = 0;
        
        const batchSize = 10; // Process in small batches
        
        while (Date.now() < endTime) {
            const promises = [];
            
            for (let i = 0; i < batchSize; i++) {
                promises.push(
                    this.testHelper.makeRequest('/api/health/live', 'GET', null, 1000)
                        .then(response => response.statusCode === 200 ? 'success' : 'failure')
                        .catch(() => 'failure')
                );
            }
            
            const batchResults = await Promise.all(promises);
            totalRequests += batchSize;
            successes += batchResults.filter(r => r === 'success').length;
            failures += batchResults.filter(r => r === 'failure').length;
            
            // Small delay to prevent overwhelming
            await this.testHelper.wait(50);
        }
        
        const actualDuration = durationSeconds;
        const requestRate = Math.round(totalRequests / actualDuration);
        
        console.log(`    ⚡ Sustained load completed`);
        console.log(`    📊 Total requests: ${totalRequests}`);
        console.log(`    ✅ Successes: ${successes}, ❌ Failures: ${failures}`);
        console.log(`    🔥 Average rate: ${requestRate} requests/second`);
        
        this.testHelper.assert(
            failures < totalRequests * 0.05, // Allow up to 5% failure rate
            `Sustained load should maintain low failure rate, got ${failures}/${totalRequests}`
        );
        
        this.testHelper.assert(
            requestRate >= 10, // Should handle at least 10 requests per second
            `Sustained load should maintain reasonable request rate, got ${requestRate} req/s`
        );
    }

    async testMemoryUnderLoad() {
        console.log(`    Testing memory usage under load...`);
        
        // Get initial memory
        const initialResponse = await this.testHelper.makeRequest('/api/health/debug');
        const initialMemory = initialResponse.data.memory.heap_used_mb;
        
        console.log(`    📊 Initial memory: ${initialMemory}MB`);
        
        // Generate load
        const promises = [];
        for (let i = 0; i < 200; i++) {
            promises.push(this.testHelper.makeRequest('/api/health/debug'));
        }
        
        await Promise.all(promises);
        
        // Check final memory
        const finalResponse = await this.testHelper.makeRequest('/api/health/debug');
        const finalMemory = finalResponse.data.memory.heap_used_mb;
        const memoryIncrease = finalMemory - initialMemory;
        
        console.log(`    📊 Final memory: ${finalMemory}MB`);
        console.log(`    📈 Memory increase: ${memoryIncrease >= 0 ? '+' : ''}${memoryIncrease}MB`);
        
        this.testHelper.assert(
            memoryIncrease < 100, // Memory increase should be reasonable
            `Memory increase under load should be reasonable, got ${memoryIncrease}MB increase`
        );
        
        this.testHelper.assert(
            finalMemory < 200, // Total memory should stay reasonable
            `Total memory usage should stay reasonable, got ${finalMemory}MB`
        );
    }

    async testResponseTimeConsistency() {
        console.log(`    Testing response time consistency...`);
        
        const responseTimes = [];
        const sampleSize = 100;
        
        for (let i = 0; i < sampleSize; i++) {
            const startTime = Date.now();
            await this.testHelper.makeRequest('/api/health/live');
            const responseTime = Date.now() - startTime;
            responseTimes.push(responseTime);
            
            // Small delay between requests
            await this.testHelper.wait(10);
        }
        
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxResponseTime = Math.max(...responseTimes);
        const minResponseTime = Math.min(...responseTimes);
        
        // Calculate standard deviation
        const variance = responseTimes.reduce((acc, time) => acc + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length;
        const stdDeviation = Math.sqrt(variance);
        
        console.log(`    📊 Average response time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`    📊 Min/Max response time: ${minResponseTime}ms / ${maxResponseTime}ms`);
        console.log(`    📊 Standard deviation: ${stdDeviation.toFixed(2)}ms`);
        
        this.testHelper.assert(
            avgResponseTime < 100, // Average response time should be fast
            `Average response time should be reasonable, got ${avgResponseTime.toFixed(2)}ms`
        );
        
        this.testHelper.assert(
            maxResponseTime < 500, // Max response time shouldn't be too high
            `Maximum response time should be reasonable, got ${maxResponseTime}ms`
        );
        
        this.testHelper.assert(
            stdDeviation < avgResponseTime * 2, // Response times should be consistent
            `Response times should be consistent (low std deviation)`
        );
    }

    async testErrorRateUnderStress() {
        console.log(`    Testing error rate under extreme stress...`);
        
        // Create extreme load with very high concurrency
        const extremeLoad = 1000;
        const promises = [];
        
        for (let i = 0; i < extremeLoad; i++) {
            promises.push(
                this.testHelper.makeRequest('/api/health/live', 'GET', null, 3000)
                    .then(response => ({ success: response.statusCode === 200, error: null }))
                    .catch(error => ({ success: false, error: error.message }))
            );
        }
        
        const results = await Promise.all(promises);
        
        const successes = results.filter(r => r.success).length;
        const failures = results.filter(r => !r.success).length;
        const errorRate = (failures / extremeLoad) * 100;
        
        console.log(`    ⚡ ${extremeLoad} extreme load requests completed`);
        console.log(`    ✅ Successes: ${successes}`);
        console.log(`    ❌ Failures: ${failures}`);
        console.log(`    📊 Error rate: ${errorRate.toFixed(2)}%`);
        
        this.testHelper.assert(
            errorRate < 10, // Error rate should be less than 10% even under extreme stress
            `Error rate under extreme stress should be manageable, got ${errorRate.toFixed(2)}%`
        );
        
        this.testHelper.assert(
            successes > extremeLoad * 0.8, // At least 80% should succeed
            `Most requests should succeed even under extreme stress`
        );
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const stressTests = new StressTests();
    
    stressTests.runAll()
        .then((results) => {
            process.exit(results.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 Load tests failed:', error.message);
            process.exit(1);
        });
}

module.exports = StressTests;
