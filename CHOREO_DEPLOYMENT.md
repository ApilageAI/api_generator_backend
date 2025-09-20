# Choreo Deployment Guide

## Issues Fixed

### 1. **Application Crashes (SIGTERM)**
- **Problem**: App was receiving SIGTERM and crashing unexpectedly
- **Solution**: Enhanced graceful shutdown handling with proper timeout management

### 2. **503 NO_HEALTHY_SERVICE Errors**
- **Problem**: Choreo couldn't find healthy service instances after crashes
- **Solution**: Added proper health check endpoints and container lifecycle management

### 3. **Health Check Failures**
- **Problem**: Service wasn't responding to health checks properly
- **Solution**: Added multiple health check endpoints (`/ready`, `/live`, `/choreo`)

### 4. **Memory Issues**
- **Problem**: Potential memory leaks causing container crashes
- **Solution**: Added memory monitoring and automatic garbage collection

## New Health Check Endpoints

| Endpoint | Purpose | Choreo Usage |
|----------|---------|--------------|
| `/api/health` | Basic health check | General monitoring |
| `/api/health/ready` | Readiness probe | Container startup |
| `/api/health/live` | Liveness probe | Container health |
| `/api/health/choreo` | Choreo-specific check | Detailed status |

## Choreo Configuration

### Health Check Settings
```yaml
# Use these settings in your Choreo deployment
healthCheck:
  path: "/api/health"
  initialDelaySeconds: 30
  periodSeconds: 10
  
readinessProbe:
  path: "/api/health/ready"
  initialDelaySeconds: 15
  periodSeconds: 5
  
livenessProbe:
  path: "/api/health/live"
  initialDelaySeconds: 60
  periodSeconds: 30
```

### Resource Limits
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Environment Variables for Choreo

Add these to your Choreo environment:

```bash
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=384 --gc-interval=100
PORT=3000
CONTAINER=true
```

## Memory Optimization

The app now includes:
- **Automatic memory monitoring** every 30 seconds
- **Garbage collection triggers** when memory > 400MB
- **Memory warnings** at 300MB usage
- **Critical alerts** at 450MB usage

## Deployment Steps

1. **Push the updated code** with the fixes
2. **Configure health checks** in Choreo using the endpoints above
3. **Set resource limits** to prevent OOM kills
4. **Add environment variables** for container optimization
5. **Monitor logs** for memory usage and health status

## Monitoring

Watch for these log messages:
- `🛡️ Graceful shutdown handlers configured` - Startup success
- `📊 Memory usage: XXXmb` - Memory monitoring
- `✅ HTTP server closed gracefully` - Clean shutdown
- `🧹 Forcing garbage collection...` - Memory cleanup

## Troubleshooting

### Still getting 503 errors?
1. Check if health check endpoints are accessible
2. Verify environment variables are set
3. Increase `initialDelaySeconds` in health checks
4. Check memory usage in `/api/health/choreo`

### Memory issues?
1. Monitor `/api/health/choreo` for memory status
2. Look for garbage collection logs
3. Adjust `NODE_OPTIONS` memory limits if needed
4. Check for memory leaks in application code

### Graceful shutdown not working?
1. Verify SIGTERM handling in logs
2. Check if timeout is sufficient (10 seconds)
3. Monitor connection cleanup process
4. Ensure no long-running operations block shutdown

## Next Steps

1. Deploy with these fixes
2. Monitor health check endpoints
3. Watch memory usage patterns
4. Adjust resource limits based on actual usage
5. Set up alerting for health check failures
