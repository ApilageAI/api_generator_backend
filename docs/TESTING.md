# 🧪 Testing Documentation

## Overview

The Apilage AI Platform includes a comprehensive testing suite designed to ensure reliability, performance, and stability across all deployment environments, especially Choreo.

## Test Structure

```
tests/
├── utils/
│   └── testHelper.js          # Common test utilities and server management
├── unit/
│   └── health.test.js         # Unit tests for health check endpoints
├── integration/
│   └── api.test.js           # API integration tests
├── load/
│   └── stress.test.js        # Load and performance tests
├── e2e/
│   └── full-system.test.js   # End-to-end system tests
└── test-runner.js            # Main test orchestrator
```

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Quick smoke test (2-3 minutes)
npm run test:smoke

# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# Load tests only (high intensity)
npm run test:load

# End-to-end tests only
npm run test:e2e

# Quick validation (no load/e2e tests)
npm run test:quick
```

## Test Categories

### 🔬 Unit Tests (`npm run test:unit`)
**Duration**: ~30 seconds  
**Coverage**: Individual endpoint functionality

- Health endpoint response structure
- API endpoint basic functionality
- Error handling for invalid requests
- CORS configuration validation
- Response time validation

**Key Tests:**
- `/api/health/live` - Always returns 200 OK
- `/api/health/debug` - Returns system diagnostics
- `/api/health/choreo` - Choreo-specific health data
- Error handling for 404s and invalid methods

### 🔗 Integration Tests (`npm run test:integration`)
**Duration**: ~1-2 minutes  
**Coverage**: Component interaction and system integration

- Server startup and initialization
- Database connectivity verification
- Authentication flow integration
- Cross-endpoint consistency
- Memory monitoring integration
- Logging system validation

**Key Tests:**
- Full server lifecycle
- Database connection health
- Authentication enforcement
- Error recovery and system stability

### ⚡ Load Tests (`npm run test:load`)
**Duration**: ~3-5 minutes  
**Coverage**: Performance under stress

- **Concurrent Requests**: 100-500 simultaneous requests
- **Rapid Fire**: 1,000+ requests in quick succession  
- **Sustained Load**: 30+ seconds of continuous requests
- **Mixed Endpoints**: Testing all endpoints simultaneously
- **Memory Usage**: Memory stability under load
- **Response Time**: Consistency under pressure

**Performance Benchmarks:**
- ✅ 500+ concurrent requests with 0% failure rate
- ✅ 1,000+ requests/second sustained throughput
- ✅ Sub-100ms average response times
- ✅ <50MB memory increase under extreme load

### 🌐 End-to-End Tests (`npm run test:e2e`)
**Duration**: ~2-3 minutes  
**Coverage**: Complete system workflows

- Complete server lifecycle (startup → operation → shutdown)
- Full API workflow simulation
- Error recovery and resilience
- Production environment simulation
- High-load system testing
- Graceful shutdown validation

**System Validation:**
- Server starts and becomes fully operational
- All endpoints work together seamlessly
- System recovers from various error conditions
- Production environment settings are respected
- Graceful shutdown completes in <10 seconds

## Test Results Interpretation

### Success Indicators ✅
```
🎉 All tests passed - System is fully operational
🚢 DEPLOYMENT STATUS: ✅ READY
🌟 Your application is ready for Choreo deployment!
```

### Warning Indicators ⚠️
```
⚠️ Some tests failed - Review failures before deployment
📊 Success Rate: 85% (review the 15% failures)
```

### Failure Indicators ❌
```
❌ Critical tests failed - System has issues
🚢 DEPLOYMENT STATUS: ❌ NOT READY
```

## Performance Benchmarks

### Expected Performance Metrics

| Metric | Target | Excellent | Acceptable |
|--------|--------|-----------|------------|
| Response Time | <50ms | <100ms | <500ms |
| Concurrent Requests | 500+ | 100+ | 50+ |
| Throughput | 1000+ req/s | 500+ req/s | 100+ req/s |
| Memory Usage | <50MB | <100MB | <200MB |
| Error Rate | 0% | <1% | <5% |
| Startup Time | <10s | <30s | <60s |

### Load Test Results Example
```
⚡ 500 requests completed in 827ms
✅ Successes: 500, ❌ Failures: 0  
📊 Average: 1.6ms per request
🔥 Rate: 1,196 requests/second
```

## Test Configuration

### Environment Variables
The test suite automatically sets these environment variables:
```bash
NODE_ENV=production
CONTAINER=true  
DISABLE_MEMORY_MONITORING=true
PORT=3000
```

### Test Timeouts
- Individual request timeout: 5 seconds
- Server startup timeout: 30 seconds
- Test suite timeout: 45 seconds per suite
- Graceful shutdown timeout: 10 seconds

## Choreo-Specific Testing

### Health Check Validation
Tests specifically validate Choreo health check requirements:
- `/api/health/live` - Primary liveness probe
- `/api/health/ready` - Readiness probe  
- `/api/health/debug` - Diagnostic information
- Response time consistency under load
- Error handling during startup

### Container Environment Testing
- Tests container detection and configuration
- Validates production environment settings
- Tests memory monitoring disable functionality
- Validates graceful shutdown behavior

## Troubleshooting Tests

### Common Issues

**1. Server Startup Timeout**
```bash
❌ Server startup timeout
```
**Solution**: Check environment variables and database connectivity

**2. High Memory Usage**
```bash
⚠️ Memory usage HIGH (over 200MB)
```
**Solution**: Review memory-intensive operations, check for leaks

**3. Load Test Failures**
```bash
❌ 15% failure rate under high concurrency
```
**Solution**: Check server resource limits, review error logs

**4. Integration Test Failures**
```bash
❌ Database connection integration failed
```
**Solution**: Verify Firebase configuration and connectivity

### Debug Mode

Run tests with additional logging:
```bash
# Enable debug output
DEBUG=true npm test

# Run specific test with verbose output
node tests/unit/health.test.js --verbose
```

### Test Logs Location
Tests output detailed logs during execution:
- Server startup logs
- Request/response details
- Performance metrics
- Error details and stack traces

## Continuous Integration

### Pre-deployment Testing
```bash
# Recommended CI pipeline
npm run test:smoke    # Quick validation (2 min)
npm run test:unit     # Unit tests (30s)
npm run test:integration  # Integration tests (2 min)
npm run test:load     # Performance validation (5 min)
```

### Quality Gates
- All unit tests must pass (100%)
- Integration tests must pass (100%)
- Load tests must achieve <5% error rate
- Memory usage must stay under 200MB
- Response times must stay under 100ms average

## Custom Test Development

### Adding New Tests

1. **Unit Tests**: Add to `tests/unit/`
2. **Integration Tests**: Add to `tests/integration/`
3. **Load Tests**: Add to `tests/load/`
4. **E2E Tests**: Add to `tests/e2e/`

### Using TestHelper
```javascript
const TestHelper = require('../utils/testHelper');

const testHelper = new TestHelper();

// Start server
await testHelper.startServer();

// Make request
const response = await testHelper.makeRequest('/api/health');

// Assert result
testHelper.assert(response.statusCode === 200, 'Should return 200');

// Cleanup
await testHelper.cleanup();
```

## Best Practices

### Test Organization
- Keep tests focused and single-purpose
- Use descriptive test names
- Group related tests in appropriate categories
- Clean up resources after each test

### Performance Testing
- Always test under realistic load conditions
- Monitor memory usage during tests  
- Validate response times under load
- Test error scenarios and recovery

### Reliability
- Tests should be deterministic and repeatable
- Handle async operations properly
- Clean up resources to prevent interference
- Use appropriate timeouts

## Monitoring and Metrics

The test suite provides detailed metrics:
- **Execution Time**: Per test and total suite
- **Success Rates**: Pass/fail ratios for each category  
- **Performance Metrics**: Response times, throughput, memory usage
- **System Health**: Before and after test execution
- **Resource Usage**: Memory, CPU, network utilization

These metrics help ensure your application is truly ready for production deployment on Choreo.
