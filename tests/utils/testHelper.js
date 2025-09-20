/**
 * Test Helper Utilities
 * Common utilities and helpers for all tests
 */

const http = require('http');
const { spawn } = require('child_process');

class TestHelper {
    constructor() {
        this.serverProcess = null;
        this.baseUrl = 'http://localhost:3000';
        this.testTimeout = 30000; // 30 seconds
    }

    /**
     * Make HTTP request with timeout and error handling
     * @param {string} path - Request path
     * @param {string} method - HTTP method
     * @param {string} data - Request body data
     * @param {number} timeout - Request timeout in ms
     * @returns {Promise<Object>} Response object
     */
    async makeRequest(path, method = 'GET', data = null, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: path,
                method: method,
                timeout: timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ApiPlatform-Test/1.0'
                }
            };

            if (data) {
                options.headers['Content-Length'] = Buffer.byteLength(data);
            }

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const parsedBody = body ? JSON.parse(body) : null;
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: body,
                            data: parsedBody
                        });
                    } catch (parseError) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: body,
                            data: null,
                            parseError: parseError.message
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${timeout}ms`));
            });
            
            if (data) {
                req.write(data);
            }
            
            req.end();
        });
    }

    /**
     * Start the server for testing
     * @param {Object} options - Server startup options
     * @returns {Promise<void>}
     */
    async startServer(options = {}) {
        const {
            port = 3000,
            timeout = 30000,
            env = {}
        } = options;

        return new Promise((resolve, reject) => {
            console.log(`🚀 Starting test server on port ${port}...`);
            
            this.serverProcess = spawn('node', ['src/app.js'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    PORT: port.toString(),
                    CONTAINER: 'true',
                    DISABLE_MEMORY_MONITORING: 'true',
                    ...env
                }
            });

            let output = '';
            let hasResolved = false;

            this.serverProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                if (text.includes('Apilage AI Platform is ready') && !hasResolved) {
                    hasResolved = true;
                    console.log('✅ Test server started successfully');
                    resolve();
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                const text = data.toString();
                // Only reject on actual errors, not warnings
                if (!text.toLowerCase().includes('warning') && !hasResolved) {
                    console.error('❌ Server startup error:', text.trim());
                    hasResolved = true;
                    reject(new Error(`Server error: ${text}`));
                }
            });

            this.serverProcess.on('exit', (code) => {
                if (code !== 0 && !hasResolved) {
                    hasResolved = true;
                    reject(new Error(`Server exited with code ${code}`));
                }
            });

            // Timeout fallback
            setTimeout(() => {
                if (!hasResolved) {
                    console.error('❌ Server startup timeout');
                    hasResolved = true;
                    reject(new Error('Server startup timeout'));
                }
            }, timeout);
        });
    }

    /**
     * Stop the test server gracefully
     * @param {number} timeout - Shutdown timeout in ms
     * @returns {Promise<void>}
     */
    async stopServer(timeout = 10000) {
        if (!this.serverProcess) {
            return;
        }

        return new Promise((resolve) => {
            console.log('🔄 Stopping test server...');
            
            this.serverProcess.kill('SIGTERM');
            
            const forceTimeout = setTimeout(() => {
                console.log('⚠️ Force killing server...');
                this.serverProcess.kill('SIGKILL');
                resolve();
            }, timeout);

            this.serverProcess.on('exit', () => {
                clearTimeout(forceTimeout);
                console.log('✅ Test server stopped');
                this.serverProcess = null;
                resolve();
            });
        });
    }

    /**
     * Wait for a specified amount of time
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if server is responding
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} retryDelay - Delay between retries in ms
     * @returns {Promise<boolean>}
     */
    async waitForServer(maxRetries = 10, retryDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await this.makeRequest('/api/health/live', 'GET', null, 2000);
                if (response.statusCode === 200) {
                    return true;
                }
            } catch (error) {
                // Server not ready yet, continue waiting
            }
            
            if (i < maxRetries - 1) {
                await this.wait(retryDelay);
            }
        }
        
        return false;
    }

    /**
     * Create test assertions
     * @param {boolean} condition - Condition to assert
     * @param {string} message - Error message if condition fails
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Run a test with proper error handling and timing
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     * @returns {Promise<Object>} Test result
     */
    async runTest(name, testFn) {
        const startTime = Date.now();
        
        try {
            console.log(`🔍 Running: ${name}`);
            await testFn();
            const duration = Date.now() - startTime;
            console.log(`✅ ${name} (${duration}ms)`);
            return { name, success: true, duration, error: null };
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`❌ ${name} failed: ${error.message} (${duration}ms)`);
            return { name, success: false, duration, error: error.message };
        }
    }

    /**
     * Run multiple tests in sequence
     * @param {Array<{name: string, fn: Function}>} tests - Array of test objects
     * @returns {Promise<Object>} Test results summary
     */
    async runTestSuite(tests) {
        console.log(`\n📋 Running test suite with ${tests.length} tests...\n`);
        
        const results = [];
        let passed = 0;
        let failed = 0;
        
        for (const test of tests) {
            const result = await this.runTest(test.name, test.fn);
            results.push(result);
            
            if (result.success) {
                passed++;
            } else {
                failed++;
            }
        }
        
        console.log(`\n📊 Test Results:`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
        
        return {
            total: tests.length,
            passed,
            failed,
            results,
            success: failed === 0
        };
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        await this.stopServer();
        
        // Clean up any other resources
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');
    }

    /**
     * Setup graceful cleanup on process exit
     */
    setupGracefulExit() {
        const cleanup = async () => {
            console.log('\n🧹 Cleaning up test resources...');
            await this.cleanup();
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('uncaughtException', async (error) => {
            console.error('💥 Uncaught exception in tests:', error);
            await this.cleanup();
            process.exit(1);
        });
    }
}

module.exports = TestHelper;
