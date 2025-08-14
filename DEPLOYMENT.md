# Production Deployment Guide

This guide covers deploying the SuperBear Blog CMS to production environments.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Render, Supabase, or similar)
- Cloudinary account for image storage
- Vercel account for hosting (recommended)
- Docker (optional, for containerized deployment)

## Pre-Deployment Validation

Before deploying to production, run the pre-deployment check:

```bash
# Windows
npm run deploy:validate

# This will check:
# - Environment variables
# - Code quality (TypeScript, ESLint, Prettier)
# - Build success
# - Database connectivity
# - Test suite
# - Security audit
```

## Environment Setup

### 1. Database Configuration

Create a PostgreSQL database on your preferred provider:

**Render (Recommended):**
1. Create a new PostgreSQL service
2. Copy the connection string
3. Set as `DATABASE_URL` in your environment

**Supabase:**
1. Create a new project
2. Go to Settings > Database
3. Copy the connection string
4. Set as `DATABASE_URL` in your environment

### 2. Environment Variables

Set the following environment variables in your deployment platform:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# Authentication
NEXTAUTH_SECRET="your-secure-random-string-here"
NEXTAUTH_URL="https://your-domain.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Optional: Monitoring
SENTRY_DSN="your-sentry-dsn"
VERCEL_ANALYTICS_ID="your-analytics-id"

# Environment
NODE_ENV="production"
```

### 3. Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables:**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all required environment variables
   - Ensure they're available for Production environment

3. **Database Migration:**
   ```bash
   # Run migrations on first deploy
   npx prisma migrate deploy
   
   # Seed initial data (optional)
   npm run db:seed
   ```

### Option 2: Docker Deployment

1. **Using Docker Compose (Recommended):**
   ```bash
   # Copy environment file
   cp .env.production.example .env.production
   # Edit .env.production with your values
   
   # Deploy with Docker Compose
   npm run deploy:docker:build
   
   # Or manually:
   docker-compose -f docker-compose.production.yml up --build -d
   ```

2. **Manual Docker Build:**
   ```bash
   # Build production image
   docker build -f Dockerfile.production -t superbear-blog .
   
   # Run container
   docker run -p 3000:3000 --env-file .env.production superbear-blog
   ```

3. **With Nginx Reverse Proxy:**
   The docker-compose setup includes Nginx with:
   - SSL termination
   - Rate limiting
   - Gzip compression
   - Security headers
   - Static file caching

## Database Migration

### Initial Setup

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Seed initial data
npm run db:seed
```

### Ongoing Migrations

```bash
# After schema changes, create migration
npx prisma migrate dev --name your-migration-name

# Deploy to production
npx prisma migrate deploy
```

## Performance Optimization

### 1. Enable Caching

The application includes optimized caching headers:
- Static assets: 1 year cache
- API routes: No cache
- Pages: ISR where applicable

### 2. Image Optimization

Images are automatically optimized through:
- Next.js Image component
- Cloudinary transformations
- WebP/AVIF format support

### 3. Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze
```

## Monitoring and Logging

### 1. Error Tracking

The application includes structured logging:
- Development: Console output
- Production: JSON structured logs
- Optional: Sentry integration

### 2. Performance Monitoring

- Vercel Analytics (built-in)
- Core Web Vitals tracking
- API response time monitoring

### 3. Health Checks

Create a health check endpoint:
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
```

## Security Considerations

### 1. Environment Security

- Never commit `.env` files
- Use secure random strings for secrets
- Rotate secrets regularly

### 2. Database Security

- Use connection pooling
- Enable SSL connections
- Regular backups

### 3. Application Security

- HTTPS enforced
- Security headers configured
- Input validation on all endpoints
- Rate limiting (consider adding)

## Backup Strategy

### 1. Database Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### 2. Media Backups

Cloudinary provides automatic backups and CDN distribution.

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Node.js version (18+)
   - Verify all environment variables
   - Run `npm run type-check`

2. **Database Connection:**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database exists

3. **Image Upload Issues:**
   - Verify Cloudinary credentials
   - Check API key permissions
   - Monitor upload limits

### Debug Commands

```bash
# Check database connection
npx prisma db pull

# Verify build
npm run build

# Test production build locally
npm run start
```

## Scaling Considerations

### 1. Database Scaling

- Connection pooling (PgBouncer)
- Read replicas for heavy read workloads
- Database indexing optimization

### 2. Application Scaling

- Horizontal scaling with load balancers
- CDN for static assets
- Edge functions for API routes

### 3. Monitoring Scaling

- Set up alerts for high CPU/memory usage
- Monitor database connection counts
- Track API response times

## Maintenance

### 1. Regular Updates

```bash
# Update dependencies
npm update

# Security audit
npm audit

# Update Prisma
npx prisma migrate dev
```

### 2. Performance Reviews

- Monthly bundle size analysis
- Database query optimization
- Image optimization review

### 3. Security Reviews

- Dependency vulnerability scans
- Environment variable rotation
- Access log reviews
## Ad
vanced CI/CD Pipeline

### GitHub Actions Workflow

The repository includes a comprehensive CI/CD pipeline with the following stages:

#### 1. Security Scanning
- Trivy vulnerability scanner
- npm audit for dependency vulnerabilities
- SARIF upload to GitHub Security tab

#### 2. Test Suite
- Unit tests with coverage reporting
- Integration tests with database
- End-to-end tests with Playwright
- Coverage upload to Codecov

#### 3. Build & Deploy
- Staging deployment (develop branch)
- Production deployment (main branch)
- Automated database migrations
- Post-deployment verification

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

```bash
# Vercel Deployment
VERCEL_TOKEN="your-vercel-token"
VERCEL_ORG_ID="your-vercel-org-id"
VERCEL_PROJECT_ID="your-vercel-project-id"

# Database URLs
DATABASE_URL="production-database-url"
STAGING_DATABASE_URL="staging-database-url"

# Monitoring & Error Tracking
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"

# Notifications
SLACK_WEBHOOK="your-slack-webhook-url"

# Code Coverage
CODECOV_TOKEN="your-codecov-token"
```

### Branch Strategy

- **main** → Production deployments
- **develop** → Staging deployments  
- **feature/** → Pull request testing

## Enhanced Security Features

### 1. Security Headers

The application automatically sets comprehensive security headers:

```typescript
// Configured in next.config.ts
headers: [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options', 
  'X-XSS-Protection',
  'Referrer-Policy',
  'Content-Security-Policy'
]
```

### 2. Rate Limiting

Built-in rate limiting with different limits per endpoint:

- Public API: 200 requests/15min
- Admin API: 50 requests/15min
- Auth endpoints: 10 requests/15min
- Upload endpoints: 20 requests/hour

### 3. RBAC (Role-Based Access Control)

User roles with specific permissions:

- **ADMIN**: Full system access
- **EDITOR**: Article management only
- **VIEWER**: Read-only access

### 4. CSRF Protection

- Automatic CSRF token validation
- Origin header verification
- SameSite cookie configuration

## Monitoring & Error Tracking

### Sentry Integration

The application includes comprehensive Sentry integration:

1. **Server-side error tracking**
2. **Client-side error tracking**
3. **Performance monitoring**
4. **Release tracking**
5. **User context tracking**

### Health Monitoring

Enhanced health check endpoint at `/api/health`:

- Database connectivity
- Memory usage monitoring
- Response time tracking
- External service status

### Performance Monitoring

- Core Web Vitals tracking
- Bundle size analysis
- Database query performance
- API response times

## Production Verification

### Automated Smoke Tests

Post-deployment verification includes:

```bash
# Run smoke tests
npm run test:smoke

# Run production E2E tests
npm run test:e2e:production
```

### Manual Verification Checklist

- [ ] Homepage loads correctly
- [ ] Admin authentication works
- [ ] Article CRUD operations function
- [ ] Image upload/management works
- [ ] Search functionality active
- [ ] Mobile responsiveness verified
- [ ] SEO meta tags present
- [ ] Analytics tracking active
- [ ] Error tracking functional

### Performance Benchmarks

Target Core Web Vitals:

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms  
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

## Advanced Configuration

### Environment-Specific Settings

The application supports multiple environments with specific configurations:

#### Production
- Optimized bundle with tree shaking
- Console.log removal (except errors/warnings)
- Sentry error tracking enabled
- Strict security headers
- Rate limiting enabled

#### Staging  
- Debug mode enabled
- Verbose logging
- Relaxed security for testing
- Performance monitoring active

#### Development
- Hot reloading
- Debug mode
- Detailed error messages
- No rate limiting

### Bundle Optimization

Production builds include:

- **Code splitting**: Automatic route-based splitting
- **Tree shaking**: Remove unused code
- **Minification**: Compress JS/CSS
- **Image optimization**: WebP/AVIF formats
- **Static optimization**: Pre-rendered pages

## Disaster Recovery

### Backup Strategy

#### Database Backups
- Automated daily backups
- Point-in-time recovery capability
- Cross-region replication
- Monthly backup testing

#### Application Backups
- Git repository as source of truth
- Environment variable backups
- Configuration backups

### Recovery Procedures

#### Database Recovery
```bash
# Point-in-time recovery
pg_restore --clean --if-exists -d $DATABASE_URL backup.dump

# Migration rollback if needed
npx prisma migrate reset --force
```

#### Application Recovery
```bash
# Rollback deployment
vercel rollback

# Emergency maintenance mode
# Set ENABLE_MAINTENANCE_MODE=true and redeploy
```

## Compliance & Auditing

### Security Compliance

- HTTPS enforcement
- Data encryption at rest and in transit
- Regular security audits
- Dependency vulnerability scanning
- Access logging and monitoring

### Performance Compliance

- Core Web Vitals monitoring
- Accessibility compliance (WCAG 2.1)
- SEO optimization
- Mobile responsiveness

### Data Protection

- GDPR compliance considerations
- User data encryption
- Secure session management
- Privacy policy implementation

## Support & Maintenance

### Regular Maintenance Schedule

#### Weekly
- [ ] Review error logs and metrics
- [ ] Check performance dashboards
- [ ] Monitor security alerts
- [ ] Verify backup integrity

#### Monthly  
- [ ] Update dependencies
- [ ] Security audit review
- [ ] Performance optimization review
- [ ] Database maintenance

#### Quarterly
- [ ] Comprehensive security review
- [ ] Disaster recovery testing
- [ ] Performance benchmarking
- [ ] Documentation updates

### Emergency Contacts

- **Technical Issues**: Create GitHub issue
- **Security Incidents**: security@your-domain.com
- **Production Outages**: Use incident response plan

### Monitoring Dashboards

- **Application Performance**: Vercel Dashboard
- **Error Tracking**: Sentry Dashboard  
- **Database Metrics**: Database provider dashboard
- **Uptime Monitoring**: Health check service
- **Security Monitoring**: GitHub Security tab

This comprehensive deployment guide ensures a secure, performant, and maintainable production deployment with full CI/CD automation and monitoring capabilities.