# Media Management System Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Media Management System in production environments. It covers all aspects from initial setup to ongoing maintenance.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- 2GB RAM
- 10GB storage space

**Recommended Requirements:**
- Node.js 18+ (LTS)
- PostgreSQL 15+
- Redis 7+
- 4GB RAM
- 50GB+ storage space
- CDN for image delivery

### External Services

**Required:**
- **Cloudinary Account**: For image storage and optimization
- **Database**: PostgreSQL instance with connection pooling
- **Redis**: For caching and session storage

**Optional:**
- **Monitoring**: Prometheus/Grafana for metrics
- **Alerting**: PagerDuty, Slack, or email notifications
- **CDN**: CloudFlare or similar for global delivery

## Environment Configuration

### Environment Variables

Copy and configure the environment variables:

```bash
cp .env.example .env.production
```

**Required Variables:**
```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Redis
REDIS_URL="redis://user:password@host:6379"
```

**Media System Configuration:**
```bash
# File Upload Limits
MAX_UPLOAD_SIZE="10485760"  # 10MB in bytes
SUPPORTED_IMAGE_FORMATS="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
DEFAULT_UPLOAD_FOLDER="uploads"

# Cleanup Configuration
ENABLE_AUTO_CLEANUP="true"
CLEANUP_SCHEDULE="0 2 * * 0"  # Weekly on Sunday at 2 AM
CLEANUP_ORPHAN_DAYS="30"

# Security Settings
ENABLE_MEDIA_SECURITY="true"
STRIP_EXIF_DATA="true"
ENABLE_RATE_LIMITING="true"
UPLOAD_RATE_LIMIT="10"
MEDIA_API_RATE_LIMIT="100"
CLEANUP_RATE_LIMIT="5"

# Monitoring
DEBUG_MEDIA="false"  # Set to true for debugging
```

### Cloudinary Setup

1. **Create Cloudinary Account**:
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Note your Cloud Name, API Key, and API Secret

2. **Configure Upload Presets**:
   ```javascript
   // Create upload preset in Cloudinary dashboard
   {
     "name": "media_management",
     "unsigned": false,
     "folder": "uploads",
     "transformation": [
       { "quality": "auto:good" },
       { "fetch_format": "auto" }
     ],
     "eager": [
       { "width": 300, "height": 200, "crop": "thumb" },
       { "width": 800, "height": 600, "crop": "limit" }
     ]
   }
   ```

3. **Set Security Settings**:
   - Enable secure URLs
   - Configure allowed domains
   - Set up webhook notifications (optional)

## Deployment Methods

### Method 1: Traditional Server Deployment

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash mediaapp
sudo usermod -aG sudo mediaapp
```

#### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/superbear_blog.git
cd superbear_blog

# Install dependencies
npm ci --only=production

# Set up environment
cp .env.example .env.production
# Edit .env.production with your values

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build
```

#### 3. Process Management

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'media-management-system',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Reverse Proxy Setup (Nginx)

```nginx
# /etc/nginx/sites-available/media-system
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # File upload size limit
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for large uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### Method 2: Docker Deployment

#### 1. Using Docker Compose

```bash
# Copy docker compose file
cp docker/docker-compose.media.yml docker-compose.yml

# Set up environment
cp .env.example .env

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs app
```

#### 2. Custom Docker Build

```bash
# Build image
docker build -f docker/media-system.dockerfile -t media-system:latest .

# Run container
docker run -d \
  --name media-system \
  --env-file .env.production \
  -p 3000:3000 \
  -v media_uploads:/app/uploads \
  media-system:latest
```

### Method 3: Cloud Platform Deployment

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add CLOUDINARY_CLOUD_NAME
# ... add all required variables
```

#### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

## Database Setup

### PostgreSQL Configuration

#### 1. Database Creation

```sql
-- Create database
CREATE DATABASE superbear_blog;

-- Create user
CREATE USER mediaapp WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE superbear_blog TO mediaapp;

-- Connect to database
\c superbear_blog

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO mediaapp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mediaapp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mediaapp;
```

#### 2. Connection Pooling (PgBouncer)

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
superbear_blog = host=localhost port=5432 dbname=superbear_blog

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = postgres
pool_mode = transaction
server_reset_query = DISCARD ALL
max_client_conn = 100
default_pool_size = 20
```

#### 3. Performance Tuning

```sql
-- Optimize for media operations
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
```

### Redis Configuration

```bash
# /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

## Automated Deployment

### Using the Deployment Script

#### Linux/macOS:
```bash
# Make script executable
chmod +x scripts/deploy-media-system.sh

# Run deployment
./scripts/deploy-media-system.sh
```

#### Windows (PowerShell):
```powershell
# Run deployment script
.\scripts\deploy-media-system.ps1

# Skip tests and build (for faster deployment)
.\scripts\deploy-media-system.ps1 -SkipTests -SkipBuild
```

### CI/CD Pipeline

#### GitHub Actions Example

```yaml
# .github/workflows/deploy-media-system.yml
name: Deploy Media Management System

on:
  push:
    branches: [main]
    paths:
      - 'src/lib/media/**'
      - 'src/app/api/admin/media/**'
      - 'src/components/admin/Media*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: |
        npm run test:unit
        npm run test:integration
      env:
        DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
        CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
        CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to production
      run: ./scripts/deploy-media-system.sh
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DIRECT_URL: ${{ secrets.DIRECT_URL }}
        NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
        NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
        CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
        CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
        CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
        REDIS_URL: ${{ secrets.REDIS_URL }}
```

## Monitoring and Alerting

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'media-system'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

rule_files:
  - "monitoring/media-system-alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboard

Import the dashboard configuration from `monitoring/media-system-alerts.yml` or create custom dashboards for:

- Upload performance metrics
- Storage usage trends
- Cleanup operation results
- API response times
- Error rates and alerts

### Log Aggregation

#### Using ELK Stack

```yaml
# logstash.conf
input {
  file {
    path => "/app/logs/*.log"
    start_position => "beginning"
    tags => ["media-system"]
  }
}

filter {
  if "media-system" in [tags] {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
    
    if [message] =~ /upload.*failed/ {
      mutate {
        add_tag => ["upload-error"]
      }
    }
    
    if [message] =~ /cleanup.*completed/ {
      mutate {
        add_tag => ["cleanup-success"]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "media-system-%{+YYYY.MM.dd}"
  }
}
```

## Scheduled Tasks

### Cron Jobs (Linux)

```bash
# Add to crontab
crontab -e

# Weekly cleanup on Sunday at 2 AM
0 2 * * 0 curl -X POST "https://yourdomain.com/api/cron/media-cleanup" -H "Authorization: Bearer $CRON_SECRET"

# Daily health check
0 6 * * * curl -f "https://yourdomain.com/api/health" || echo "Health check failed" | mail -s "Media System Alert" admin@yourdomain.com
```

### Windows Task Scheduler

```powershell
# Create scheduled task for cleanup
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-Command `"Invoke-RestMethod -Uri 'https://yourdomain.com/api/cron/media-cleanup' -Method Post -Headers @{'Authorization'='Bearer $env:CRON_SECRET'}`""

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2am

Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "MediaSystemCleanup" -Description "Weekly media cleanup"
```

## Security Considerations

### SSL/TLS Configuration

```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# Or use custom certificate
sudo cp your-cert.pem /etc/ssl/certs/
sudo cp your-key.pem /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/your-key.pem
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Block direct access to app
sudo ufw enable

# iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

### Environment Security

```bash
# Secure environment file
chmod 600 .env.production
chown mediaapp:mediaapp .env.production

# Use secrets management (example with Docker Swarm)
echo "your-secret-value" | docker secret create nextauth_secret -
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for media queries
CREATE INDEX CONCURRENTLY idx_media_files_uploaded_at_desc ON media_files(uploaded_at DESC);
CREATE INDEX CONCURRENTLY idx_media_files_folder_filename ON media_files(folder, filename);
CREATE INDEX CONCURRENTLY idx_media_references_content ON media_references(content_type, content_id);

-- Analyze tables
ANALYZE media_files;
ANALYZE media_references;
ANALYZE cleanup_operations;
```

### Redis Optimization

```bash
# Optimize Redis for media caching
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET save "900 1 300 10 60 10000"
redis-cli CONFIG REWRITE
```

### CDN Configuration

```javascript
// Cloudinary CDN optimization
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  secure: true,
  cdn_subdomain: true,
  secure_cdn_subdomain: true,
  cname: 'media.yourdomain.com' // Custom domain
}
```

## Backup and Recovery

### Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/media-system"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/media_db_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/media_db_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### Media Files Backup

```bash
# Sync Cloudinary to local backup
cloudinary-cli sync download --cloud-name $CLOUDINARY_CLOUD_NAME --api-key $CLOUDINARY_API_KEY --api-secret $CLOUDINARY_API_SECRET --destination /backups/media-files/
```

### Recovery Procedures

```bash
# Database recovery
psql $DATABASE_URL < backup_file.sql

# Application recovery
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart all
```

## Troubleshooting

### Common Issues

#### Upload Failures
```bash
# Check Cloudinary connectivity
curl -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/image/list"

# Check file permissions
ls -la uploads/
chmod 755 uploads/
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

#### Performance Issues
```bash
# Check system resources
htop
df -h
free -m

# Check application logs
tail -f logs/combined.log | grep ERROR
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set debug environment variables
export DEBUG_MEDIA=true
export DEBUG_UPLOADS=true
export DEBUG_CLEANUP=true

# Restart application
pm2 restart media-management-system
```

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor system health
- Check error logs
- Verify backup completion

**Weekly:**
- Review cleanup operation results
- Check storage usage trends
- Update security patches

**Monthly:**
- Review performance metrics
- Update dependencies
- Test disaster recovery procedures

### Update Procedures

```bash
# Update application
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart all

# Update system packages
sudo apt update && sudo apt upgrade -y
```

## Support and Documentation

### Getting Help

1. **Documentation**: Check API docs and troubleshooting guides
2. **Logs**: Review application and system logs
3. **Monitoring**: Check Grafana dashboards and alerts
4. **Health Checks**: Verify all health endpoints
5. **Community**: Search existing issues and solutions

### Emergency Contacts

- **System Administrator**: [contact info]
- **Database Administrator**: [contact info]
- **DevOps Team**: [contact info]
- **On-call Engineer**: [contact info]

### Escalation Procedures

1. **Level 1**: Check documentation and logs
2. **Level 2**: Contact system administrator
3. **Level 3**: Escalate to DevOps team
4. **Level 4**: Contact on-call engineer for critical issues