# Production Runbook - superbear_blog

## Health Check & Monitoring

### Health Check Endpoint
```bash
# Basic health check
curl -i https://your-domain.com/api/health

# Expected responses:
# Status 200: {"status":"ok","timestamp":"...","database":{"status":"ok","responseTime":150}}
# Status 200: {"status":"degraded","timestamp":"...","database":{"status":"degraded","responseTime":800}}
# Status 503: {"status":"down","timestamp":"...","database":{"status":"down","error":"..."}}
```

### System Status Monitoring
```bash
# Get comprehensive system status
curl -i https://your-domain.com/api/system/status

# Expected response:
{
  "timestamp": "2025-08-17T10:30:00.000Z",
  "environment": "production",
  "database": {
    "configured": true,
    "connected": true,
    "safeMode": false
  },
  "circuitBreaker": {
    "state": "closed",
    "failures": 0,
    "successes": 142
  },
  "system": {
    "uptime": 3600,
    "memory": {"used": 128, "total": 256, "percentage": 50},
    "nodeVersion": "v18.17.0"
  }
}
```

## Circuit Breaker Management

### Check Circuit Breaker State
```bash
# Circuit breaker info is included in system status
curl https://your-domain.com/api/system/status | jq '.circuitBreaker'

# States:
# "closed" - Normal operation (healthy)
# "open" - Blocking requests (unhealthy) 
# "half-open" - Testing recovery (trial)
```

### Circuit Breaker Recovery
When circuit breaker is "open":
1. **Automatic Recovery**: Waits 30 seconds (BREAKER_RESET_MS), then tries "half-open"
2. **Manual Recovery**: Restart application to reset circuit breaker
3. **Database Fix**: Resolve underlying database issues

### Circuit Breaker Thresholds
- **Failure Threshold**: 5 consecutive failures (BREAKER_THRESHOLD)
- **Reset Timeout**: 30 seconds (BREAKER_RESET_MS)
- **Health Check Timeout**: 1200ms (DB_HEALTHCHECK_TIMEOUT_MS)

## Database Operations

### Safe Mode Detection
```bash
# Check if system is in safe mode
curl https://your-domain.com/api/system/status | jq '.database.safeMode'

# true = Using mock data (database unavailable)
# false = Using live database
```

### Database Recovery Steps
1. **Check Database Status**:
   ```bash
   curl https://your-domain.com/api/health | jq '.database'
   ```

2. **Verify Database Connection**:
   ```bash
   # Check DATABASE_URL environment variable
   echo $DATABASE_URL
   
   # Test direct connection (if accessible)
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Reset Circuit Breaker** (if needed):
   ```bash
   # Restart application to reset circuit breaker
   # Or wait for automatic reset (30 seconds)
   ```

## Cron Job Management

### Check Cron Status
```bash
# Cron status included in system status
curl https://your-domain.com/api/system/status | jq '.services.cron'

# Manual cron trigger (for testing)
curl -X POST https://your-domain.com/api/cron/campaigns
```

### Pause/Resume Cron Operations
Currently implemented cron jobs:
- **Weekly Digest**: Runs Sundays at 9 AM
- **Campaign Processing**: Processes scheduled campaigns

**Pause Method**: Set environment variable `ENABLE_MAINTENANCE_MODE=true`
**Resume Method**: Remove or set `ENABLE_MAINTENANCE_MODE=false`

## Incident Response

### Database Outage Response
1. **Immediate**: System automatically enters safe mode
2. **Monitoring**: Check `/api/health` and `/api/system/status`
3. **User Impact**: Public site continues with cached/mock data
4. **Recovery**: Fix database → circuit breaker auto-recovers

### High Memory Usage
```bash
# Check memory usage
curl https://your-domain.com/api/system/status | jq '.system.memory'

# If memory > 80%:
# 1. Check for memory leaks in logs
# 2. Restart application if needed
# 3. Scale up if persistent
```

### Performance Degradation
```bash
# Check response times in health check
curl https://your-domain.com/api/health | jq '.database.responseTime'

# If responseTime > 1000ms:
# 1. Database may be slow
# 2. Circuit breaker may open soon
# 3. Check database performance
```

## CI/CD Pipeline

### Pipeline Stages
```yaml
# .github/workflows/ci.yml runs:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (npm ci)
4. Generate Prisma client
5. Type checking (npm run type-check)
6. Linting (npm run lint) 
7. Tests (npm test)
8. Build (npm run build)
```

### Pipeline Troubleshooting
```bash
# Local pipeline simulation
npm ci
npx prisma generate
npm run type-check
npm run lint
npm test
npm run build
```

### Deployment Verification
```bash
# After deployment, verify:
curl https://your-domain.com/api/health
curl https://your-domain.com/
curl https://your-domain.com/news

# Check logs for errors
# Verify database migrations applied
```

## Environment Variables

### Required Production Variables
```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://your-domain.com

# Optional Circuit Breaker Tuning
DB_HEALTHCHECK_TIMEOUT_MS=1200  # Default: 1200ms
BREAKER_THRESHOLD=5             # Default: 5 failures
BREAKER_RESET_MS=30000          # Default: 30 seconds

# Optional Features
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
SENTRY_DSN=your-sentry-dsn
```

## Monitoring Alerts

### Recommended Alert Thresholds
- **Health Check**: Alert if status != "ok" for > 2 minutes
- **Circuit Breaker**: Alert if state = "open" 
- **Memory Usage**: Alert if > 80% for > 5 minutes
- **Response Time**: Alert if > 2000ms average over 5 minutes

### Log Monitoring
```bash
# Key log patterns to monitor:
# "Circuit breaker opened" - Database issues
# "Health check failed" - System degradation  
# "Database unavailable" - Safe mode activation
# "CSRF token mismatch" - Security issues
```

## Emergency Procedures

### Complete System Outage
1. Check health endpoint: `curl https://your-domain.com/api/health`
2. Check system status: `curl https://your-domain.com/api/system/status`
3. Review application logs for errors
4. Verify database connectivity
5. Restart application if needed
6. Check DNS/CDN if still unreachable

### Database Emergency
1. System automatically enters safe mode
2. Public site remains functional with cached data
3. Admin functions may be limited
4. Fix database connection
5. Circuit breaker will auto-recover

### Security Incident
1. Check for CSRF errors in logs
2. Verify request origins and headers
3. Check rate limiting effectiveness
4. Review authentication logs
5. Update security headers if needed