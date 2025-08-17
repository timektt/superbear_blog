# Production Campaign Setup Guide

## Overview

This guide covers the setup and configuration of the email campaign system for production deployment, including content scheduling, analytics, and monitoring.

## Features Implemented

### 1. Content Scheduling System
- **Weekly Digest Automation**: Automatically creates and schedules weekly digest campaigns every Sunday at 9 AM
- **Article Aggregation**: Pulls top 5 articles from the past week for digest content
- **Template Management**: Uses configurable email templates with dynamic content
- **Duplicate Prevention**: Prevents multiple digests from being created in the same week

### 2. Analytics Dashboard
- **Campaign Performance Metrics**: Tracks sent, delivered, opened, clicked, bounced, and unsubscribed counts
- **Rate Calculations**: Automatically calculates delivery, open, click, and unsubscribe rates
- **Time-based Analysis**: Supports 7, 30, and 90-day analytics periods
- **Top Performers**: Identifies best-performing campaigns by open rate
- **Trends Overview**: Shows aggregate metrics over time

### 3. Database Integration
- **Safe Mode Support**: Gracefully handles database unavailability with mock data
- **Campaign Snapshots**: Stores historical performance data for analytics
- **Metadata Storage**: Preserves campaign context and article references

## API Endpoints

### Campaign Analytics
```
GET /api/admin/campaigns/analytics?days=7
POST /api/admin/campaigns/analytics
```

### Cron Processing
```
POST /api/cron/campaigns
GET /api/cron/campaigns (health check)
```

## Cron Job Configuration

### Weekly Digest Schedule
- **Trigger**: Every Sunday at 9:00 AM
- **Content**: Top 5 articles from the past 7 days
- **Delivery**: Scheduled for 10:00 AM same day
- **Template**: Uses "Weekly Digest Template" (auto-created if missing)

### Processing Schedule
```bash
# Recommended cron schedule for Vercel/production
0 * * * * curl -X POST https://your-domain.com/api/cron/campaigns \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Environment Variables

### Required for Production
```env
# Campaign System
CRON_SECRET=your-secure-cron-secret-here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Blog Name

# Database (already configured)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Email Service (choose one)
RESEND_API_KEY=re_...
SENDGRID_API_KEY=SG...
MAILGUN_API_KEY=key-...
```

### Optional Configuration
```env
# Analytics
ANALYTICS_RETENTION_DAYS=90
CAMPAIGN_BATCH_SIZE=100

# Rate Limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Schema

### Campaign Snapshots
```sql
-- Stores historical campaign performance data
CREATE TABLE "CampaignSnapshot" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "metrics" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

### Email Templates
```sql
-- Stores reusable email templates
CREATE TABLE "EmailTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "variables" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Campaign Success Rate**: % of campaigns sent successfully
2. **Weekly Digest Creation**: Ensure digests are created every Sunday
3. **Analytics API Response Time**: Monitor dashboard performance
4. **Database Connection Health**: Track safe mode activations

### Recommended Alerts
```yaml
# Example alert configuration
alerts:
  - name: "Campaign Failure Rate High"
    condition: "campaign_failure_rate > 5%"
    notification: "email, slack"
  
  - name: "Weekly Digest Missing"
    condition: "no_digest_created_sunday"
    notification: "email"
  
  - name: "Analytics API Slow"
    condition: "analytics_response_time > 5s"
    notification: "slack"
```

## Security Considerations

### Cron Job Security
- Use strong `CRON_SECRET` (32+ characters)
- Implement IP allowlisting for cron endpoints
- Rate limit cron job calls
- Log all cron job executions

### Data Protection
- Campaign snapshots contain aggregated data only
- No PII stored in analytics
- Automatic data retention cleanup
- GDPR compliance through data lifecycle management

## Troubleshooting

### Common Issues

#### Weekly Digest Not Created
1. Check cron job is running every hour
2. Verify `CRON_SECRET` is correct
3. Ensure articles exist in the past week
4. Check database connectivity

#### Analytics Not Loading
1. Verify database connection
2. Check campaign snapshot data exists
3. Review API authentication
4. Monitor for rate limiting

#### Performance Issues
1. Monitor database query performance
2. Check campaign snapshot table size
3. Implement data archiving if needed
4. Consider caching for frequently accessed data

### Debug Commands
```bash
# Test cron job manually
curl -X POST https://your-domain.com/api/cron/campaigns \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

# Check analytics API
curl -X GET https://your-domain.com/api/admin/campaigns/analytics?days=7 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Health check
curl -X GET https://your-domain.com/api/cron/campaigns \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Deployment Checklist

### Pre-deployment
- [ ] Set all required environment variables
- [ ] Configure cron job schedule
- [ ] Test email template rendering
- [ ] Verify database migrations
- [ ] Set up monitoring alerts

### Post-deployment
- [ ] Verify cron job execution
- [ ] Test weekly digest creation
- [ ] Check analytics dashboard
- [ ] Monitor error logs
- [ ] Validate email delivery

### Weekly Maintenance
- [ ] Review campaign performance metrics
- [ ] Check for failed campaigns
- [ ] Monitor database growth
- [ ] Update email templates if needed
- [ ] Review and archive old snapshots

## Performance Optimization

### Database Optimization
```sql
-- Recommended indexes for analytics queries
CREATE INDEX idx_campaign_snapshots_campaign_created 
ON "CampaignSnapshot" ("campaignId", "createdAt");

CREATE INDEX idx_email_campaigns_status_scheduled 
ON "EmailCampaign" ("status", "scheduledAt");

CREATE INDEX idx_articles_published_status 
ON "Article" ("publishedAt", "status");
```

### Caching Strategy
- Cache analytics data for 5 minutes
- Use Redis for campaign performance data
- Implement CDN for static email assets
- Cache email templates in memory

## Support & Maintenance

### Log Monitoring
Key log patterns to monitor:
- `Campaign scheduler completed`
- `Weekly digest campaign created`
- `Analytics dashboard loaded`
- `Database unavailable - using safe mode`

### Regular Tasks
- Weekly review of campaign performance
- Monthly cleanup of old snapshots
- Quarterly template optimization
- Annual security audit

For additional support, refer to the main documentation or contact the development team.