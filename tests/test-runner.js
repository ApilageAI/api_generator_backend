/**
 * Main Test Runner
 * Orchestrates all test suites and provides comprehensive reporting
 */

const HealthTests = require('./unit/health.test');
const APIIntegrationTests = require('./integration/api.test');
const StressTests = require('./load/stress.test');
const E2ESystemTests = require('./e2e/full-system.test');

class TestRunner {
    constructor() {
        this.results = {
            unit: null,
            integration: null,
            load: null,
            e2e: null
        };
        this.startTime = Date.now();
    }

    /**
     * Run all test suites
     * @param {Object} options - Test execution options
     */
    async runAllTests(options = {}) {
        const {
            includeUnit = true,
            includeIntegration = true,
            includeLoad = true,
            includeE2E = true,
            verbose = true
        } = options;

        console.log('🧪 APILAGE AI PLATFORM - COMPREHENSIVE TEST SUITE');
        console.log('====================================================\n');
        console.log(`🚀 Starting comprehensive tests at ${new Date().toISOString()}`);
        console.log(`📊 Test configuration: Unit=${includeUnit}, Integration=${includeIntegration}, Load=${includeLoad}, E2E=${includeE2E}\n`);

        const testSuites = [];

        try {
            // Unit Tests
            if (includeUnit) {
                console.log('🔬 RUNNING UNIT TESTS');
                console.log('===================');
                testSuites.push({
                    name: 'Unit Tests',
                    runner: async () => {
                        const healthTests = new HealthTests();
                        return await healthTests.runAll();
                    }
                });
            }

            // Integration Tests
            if (includeIntegration) {
                console.log('🔗 RUNNING INTEGRATION TESTS');
                console.log('===========================');
                testSuites.push({
                    name: 'Integration Tests',
                    runner: async () => {
                        const apiTests = new APIIntegrationTests();
                        return await apiTests.runAll();
                    }
                });
            }

            // Load Tests
            if (includeLoad) {
                console.log('⚡ RUNNING LOAD TESTS');
                console.log('===================');
                testSuites.push({
                    name: 'Load Tests',
                    runner: async () => {
                        const stressTests = new StressTests();
                        return await stressTests.runAll();
                    }
                });
            }

            // E2E Tests
            if (includeE2E) {
                console.log('🌐 RUNNING END-TO-END TESTS');
                console.log('=========================');
                testSuites.push({
                    name: 'E2E Tests',
                    runner: async () => {
                        const e2eTests = new E2ESystemTests();
                        return await e2eTests.runAll();
                    }
                });
            }

            // Execute all test suites
            for (const testSuite of testSuites) {
                console.log(`\n📋 Executing ${testSuite.name}...`);
                console.log('-'.repeat(50));
                
                try {
                    const result = await testSuite.runner();
                    this.results[testSuite.name.toLowerCase().replace(/\s+/g, '').replace('tests', '')] = result;
                    
                    if (result.success) {
                        console.log(`✅ ${testSuite.name} completed successfully`);
                    } else {
                        console.log(`⚠️  ${testSuite.name} completed with failures`);
                    }
                } catch (error) {
                    console.error(`💥 ${testSuite.name} failed with error:`, error.message);
                    this.results[testSuite.name.toLowerCase().replace(/\s+/g, '').replace('tests', '')] = {
                        success: false,
                        error: error.message,
                        total: 0,
                        passed: 0,
                        failed: 1
                    };
                }
                
                // Brief pause between test suites
                await this.wait(1000);
            }

            // Generate comprehensive report
            this.generateFinalReport();

        } catch (error) {
            console.error('💥 Test runner failed:', error.message);
            console.error(error.stack);
            return false;
        }

        return this.isOverallSuccess();
    }

    /**
     * Run quick smoke tests only
     */
    async runSmokeTests() {
        console.log('💨 SMOKE TESTS - QUICK VALIDATION');
        console.log('================================\n');

        try {
            const healthTests = new HealthTests();
            
            // Run only critical tests
            const result = await healthTests.testHelper.runTestSuite([
                { name: 'Server Startup', fn: async () => {
                    await healthTests.testHelper.startServer();
                    await healthTests.testHelper.wait(3000);
                }},
                { name: 'Basic Health Check', fn: () => healthTests.testLiveEndpoint() },
                { name: 'Debug Endpoint', fn: () => healthTests.testDebugEndpoint() }
            ]);

            await healthTests.testHelper.cleanup();

            if (result.success) {
                console.log('\n✅ Smoke tests passed - System is operational');
                return true;
            } else {
                console.log('\n❌ Smoke tests failed - System has issues');
                return false;
            }

        } catch (error) {
            console.error('💥 Smoke tests failed:', error.message);
            return false;
        }
    }

    /**
     * Generate comprehensive test report
     */
    generateFinalReport() {
        const totalDuration = Date.now() - this.startTime;
        
        console.log('\n');
        console.log('🎯 COMPREHENSIVE TEST REPORT');
        console.log('============================');
        console.log(`⏱️  Total execution time: ${(totalDuration / 1000).toFixed(2)} seconds`);
        console.log(`📅 Completed at: ${new Date().toISOString()}`);
        console.log('');

        // Summary table
        console.log('📊 TEST SUITE SUMMARY');
        console.log('--------------------');
        
        const suiteNames = ['unit', 'integration', 'load', 'e2e'];
        let overallPassed = 0;
        let overallFailed = 0;
        let overallTotal = 0;

        for (const suiteName of suiteNames) {
            const result = this.results[suiteName];
            
            if (result) {
                const status = result.success ? '✅' : '❌';
                const passed = result.passed || 0;
                const failed = result.failed || 0;
                const total = result.total || 0;
                
                console.log(`${status} ${suiteName.padEnd(12)} | ${passed.toString().padStart(3)}/${total.toString().padEnd(3)} passed | ${failed > 0 ? failed + ' failed' : 'All passed'}`);
                
                overallPassed += passed;
                overallFailed += failed;
                overallTotal += total;
            } else {
                console.log(`⚪ ${suiteName.padEnd(12)} | Skipped`);
            }
        }

        console.log('-'.repeat(50));
        console.log(`📈 OVERALL: ${overallPassed}/${overallTotal} tests passed (${((overallPassed/overallTotal)*100).toFixed(1)}%)`);
        
        if (overallFailed === 0) {
            console.log('🎉 ALL TESTS PASSED! System is fully operational and ready for deployment.');
        } else {
            console.log(`⚠️  ${overallFailed} tests failed. Review failures before deployment.`);
        }

        // Performance metrics
        console.log('\n🚀 PERFORMANCE METRICS');
        console.log('---------------------');
        
        if (this.results.load && this.results.load.success) {
            console.log('✅ High concurrency handling: PASSED');
            console.log('✅ Memory management: STABLE');
            console.log('✅ Response time consistency: GOOD');
        }

        // System readiness
        console.log('\n🎯 SYSTEM READINESS');
        console.log('------------------');
        
        const readinessChecks = [
            { name: 'Health endpoints', passed: this.results.unit?.success },
            { name: 'API integration', passed: this.results.integration?.success },
            { name: 'Load handling', passed: this.results.load?.success },
            { name: 'E2E system flow', passed: this.results.e2e?.success }
        ];

        readinessChecks.forEach(check => {
            if (check.passed !== undefined) {
                console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
            }
        });

        // Deployment readiness
        const deploymentReady = this.isOverallSuccess();
        console.log(`\n🚢 DEPLOYMENT STATUS: ${deploymentReady ? '✅ READY' : '❌ NOT READY'}`);
        
        if (deploymentReady) {
            console.log('🌟 Your application is fully tested and ready for Choreo deployment!');
        } else {
            console.log('⚠️  Fix failing tests before deploying to production.');
        }
    }

    /**
     * Check if overall test execution was successful
     */
    isOverallSuccess() {
        const executedResults = Object.values(this.results).filter(r => r !== null);
        return executedResults.length > 0 && executedResults.every(r => r.success);
    }

    /**
     * Wait for specified milliseconds
     */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Setup signal handlers for graceful exit
     */
    setupSignalHandlers() {
        const gracefulExit = (signal) => {
            console.log(`\n🛑 Received ${signal}, cleaning up tests...`);
            process.exit(1);
        };

        process.on('SIGINT', gracefulExit);
        process.on('SIGTERM', gracefulExit);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const testRunner = new TestRunner();
    
    testRunner.setupSignalHandlers();

    // Parse command line arguments
    const options = {
        includeUnit: !args.includes('--no-unit'),
        includeIntegration: !args.includes('--no-integration'),
        includeLoad: !args.includes('--no-load'),
        includeE2E: !args.includes('--no-e2e'),
        verbose: !args.includes('--quiet')
    };

    // Check for specific test modes
    if (args.includes('--smoke')) {
        // Run smoke tests only
        testRunner.runSmokeTests()
            .then(success => process.exit(success ? 0 : 1))
            .catch(() => process.exit(1));
    } else if (args.includes('--unit-only')) {
        // Run unit tests only
        options.includeIntegration = false;
        options.includeLoad = false;
        options.includeE2E = false;
        testRunner.runAllTests(options)
            .then(success => process.exit(success ? 0 : 1))
            .catch(() => process.exit(1));
    } else if (args.includes('--load-only')) {
        // Run load tests only
        options.includeUnit = false;
        options.includeIntegration = false;
        options.includeE2E = false;
        testRunner.runAllTests(options)
            .then(success => process.exit(success ? 0 : 1))
            .catch(() => process.exit(1));
    } else {
        // Run all tests
        testRunner.runAllTests(options)
            .then(success => process.exit(success ? 0 : 1))
            .catch(() => process.exit(1));
    }
}

module.exports = TestRunner;
