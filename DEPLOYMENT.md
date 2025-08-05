# Production Deployment Guide

This guide covers deploying the SuperBear Blog CMS to production environments.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Render, Supabase, or similar)
- Cloudinary account for image storage
- Vercel account for hosting (recommended)

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

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   COPY package.json package-lock.json* ./
   RUN npm ci --only=production
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 3000
   
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Build and Deploy:**
   ```bash
   docker build -t superbear-blog .
   docker run -p 3000:3000 --env-file .env.production superbear-blog
   ```

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