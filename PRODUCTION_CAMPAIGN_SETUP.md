# 🚀 Production Campaign System Setup Guide

## Overview

This guide covers setting up the production-ready email campaign system with advanced features including:

- **Queue System**: Redis-based email delivery queue with domain throttling
- **Idempotency**: Prevents duplicate email sends
- **Snapshot System**: Freezes campaign content before sending
- **Suppression Management**: Handles bounces, complaints, and unsubscribes
- **Webhook Integration**: Real-time email event tracking
- **Domain Throttling**: Respects email provider limits

## 🔧 Production Setup

### 1. Database Migration

First, update your database schema with the new production models:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or create and run migration (recommended for production)
npx prisma migrate dev --name "add-production-campaign-features"
npx prisma migrate deploy
```

### 2. Environment Variables

Add these environment variables to your production environment:

```env
# Email Queue & Delivery
REDIS_URL="redis://your-redis-instance:6379"
EMAIL_BATCH_SIZE="50"
EMAIL_SEND_THROTTLE_MS="100"
EMAIL_MAX_ATTEMPTS="3"

# Domain Throttling (emails per minute)
GMAIL_THROTTLE_LIMIT="40"
OUTLOOK_THROTTLE_LIMIT="15"
YAHOO_THROTTLE_LIMIT="20"
DEFAULT_THROTTLE_LIMIT="30"

# Webhook Security
EMAIL_WEBHOOK_SECRET="your-secure-webhook-secret"

# Suppression & Compliance
ENABLE_SUPPRESSION_LIST="true"
SOFT_BOUNCE_CLEANUP_DAYS="30"
ENABLE_QUIET_HOURS="true"
DEFAULT_QUIET_HOURS_START="21"
DEFAULT_QUIET_HOURS_END="8"
DEFAULT_TIMEZONE="Asia/Bangkok"
```

### 3. Redis Setup

**Option A: Redis Cloud (Recommended)**
```bash
# Sign up at https://redis.com/
# Get connection URL and add to REDIS_URL
```

**Option B: Self-hosted Redis**
```bash
# Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or install locally
sudo apt-get install redis-server
```

**Option C: Upstash Redis (Serverless)**
```bash
# Sign up at https://upstash.com/
# Create Redis database
# Get connection URL for REDIS_URL
```

### 4. Email Provider Webhook Setup

Configure webhooks with your email service provider:

**SendGrid:**
```bash
# Webhook URL: https://yourdomain.com/api/webhooks/email?provider=sendgrid
# Events: delivered, open, click, bounce, dropped, spamreport, unsubscribe
```

**Mailgun:**
```bash
# Webhook URL: https://yourdomain.com/api/webhooks/email?provider=mailgun
# Events: delivered, opened, clicked, bounced, failed, complained, unsubscribed
```

**Postmark:**
```bash
# Webhook URL: https://yourdomain.com/api/webhooks/email?provider=postmark
# Events: Delivery, Open, Click, Bounce, SpamComplaint
```

### 5. Cron Job Setup

Set up cron jobs for automated processing:

**Vercel Cron (Recommended):**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/campaigns",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**External Cron Service:**
```bash
# Every 5 minutes
*/5 * * * * curl -X POST https://yourdomain.com/api/cron/campaigns \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🧪 Testing Production Setup

### 1. Test Database Schema

```bash
npm run campaigns:test
```

### 2. Test Queue System

```bash
# Check queue status
npm run campaigns:queue

# Process queue manually
npm run campaigns:process-queue
```

### 3. Test Suppression System

```bash
# Check suppression stats
npm run suppressions:stats

# Export suppression list
npm run suppressions:export
```

### 4. Test Webhook Endpoint

```bash
# Test webhook health
curl https://yourdomain.com/api/webhooks/email?provider=sendgrid

# Test webhook with sample data
curl -X POST https://yourdomain.com/api/webhooks/email?provider=sendgrid \
  -H "Content-Type: application/json" \
  -H "X-Signature: your-signature" \
  -d '[{"email":"test@example.com","event":"delivered","timestamp":1234567890}]'
```

## 📊 Production Monitoring

### 1. Queue Monitoring

Monitor queue health through admin dashboard:
- Queue size and processing rate
- Domain throttling status
- Failed job count
- Processing time metrics

### 2. Campaign Analytics

Track campaign performance:
- Delivery rates by domain
- Open and click rates
- Bounce and complaint rates
- Suppression list growth

### 3. System Health

Monitor system components:
- Database connection health
- Redis connection status
- Email service API status
- Webhook processing success rate

## 🔒 Security Considerations

### 1. Webhook Security

- Always verify webhook signatures
- Use HTTPS for all webhook endpoints
- Implement rate limiting on webhook endpoints
- Log and monitor webhook failures

### 2. Queue Security

- Secure Redis instance with authentication
- Use Redis ACLs to limit access
- Encrypt sensitive data in queue jobs
- Implement job timeout and cleanup

### 3. Suppression Compliance

- Honor unsubscribe requests immediately
- Maintain suppression list backups
- Implement GDPR data deletion
- Regular suppression list audits

## 🚀 Performance Optimization

### 1. Queue Optimization

```env
# Optimize for high volume
EMAIL_BATCH_SIZE="100"
EMAIL_SEND_THROTTLE_MS="50"
REDIS_MAX_CONNECTIONS="20"
```

### 2. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_campaign_deliveries_status ON campaign_deliveries(status);
CREATE INDEX idx_campaign_deliveries_campaign_id ON campaign_deliveries(campaign_id);
CREATE INDEX idx_newsletter_events_type_timestamp ON newsletter_events(type, timestamp);
CREATE INDEX idx_suppressions_email ON suppressions(email);
```

### 3. Caching Strategy

- Cache suppression list in Redis
- Cache domain throttle counters
- Cache campaign snapshots
- Implement query result caching

## 🔄 Deployment Checklist

### Pre-Deployment

- [ ] Database schema updated
- [ ] Environment variables configured
- [ ] Redis instance provisioned
- [ ] Webhook endpoints configured
- [ ] Cron jobs scheduled
- [ ] SSL certificates valid

### Post-Deployment

- [ ] Test campaign creation
- [ ] Test email sending
- [ ] Verify webhook processing
- [ ] Check queue processing
- [ ] Monitor suppression handling
- [ ] Validate analytics tracking

### Monitoring Setup

- [ ] Queue size alerts
- [ ] High bounce rate alerts
- [ ] Webhook failure alerts
- [ ] Database performance monitoring
- [ ] Redis memory usage monitoring

## 🆘 Troubleshooting

### Common Issues

**Queue Not Processing:**
- Check Redis connection
- Verify cron job is running
- Check queue worker logs
- Validate email service credentials

**High Bounce Rates:**
- Review suppression list
- Check email content quality
- Verify sender reputation
- Audit recipient list quality

**Webhook Failures:**
- Verify webhook signatures
- Check endpoint availability
- Review webhook payload format
- Monitor rate limiting

**Performance Issues:**
- Optimize database queries
- Increase Redis memory
- Adjust batch sizes
- Scale queue workers

### Debug Commands

```bash
# Check queue status
curl https://yourdomain.com/api/admin/campaigns/queue

# Process queue manually
curl -X POST https://yourdomain.com/api/admin/campaigns/queue/process

# Check suppression stats
curl https://yourdomain.com/api/admin/suppressions

# Test webhook endpoint
curl https://yourdomain.com/api/webhooks/email?provider=sendgrid
```

## 📈 Scaling Considerations

### High Volume Setup

For sending 100K+ emails per day:

1. **Multiple Queue Workers**
   - Deploy multiple instances
   - Use Redis Cluster
   - Implement worker coordination

2. **Database Optimization**
   - Use read replicas
   - Implement connection pooling
   - Optimize query performance

3. **Email Service Scaling**
   - Use multiple email providers
   - Implement provider failover
   - Monitor provider limits

### Enterprise Features

Consider implementing:
- Multi-tenant support
- Advanced segmentation
- Predictive analytics
- Machine learning optimization
- Real-time personalization

---

## 📞 Support

For production issues:
1. Check system health endpoints
2. Review application logs
3. Monitor queue and database metrics
4. Contact email service provider support
5. Escalate to development team

This production setup ensures reliable, scalable, and compliant email campaign delivery with comprehensive monitoring and error handling.