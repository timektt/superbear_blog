# 📧 Email Campaign System Guide

## Overview

The SuperBear Blog email campaign system provides automated email marketing capabilities with advanced features including:

- **Campaign Management**: Create, schedule, and send email campaigns
- **Template System**: Use pre-built or custom email templates
- **Automated Scheduling**: Schedule campaigns for future delivery
- **Analytics Tracking**: Monitor campaign performance and engagement
- **Subscriber Management**: Target specific subscriber segments
- **Content Generation**: Automatically generate newsletters from latest articles

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have:
- ✅ Email templates created (run `npm run db:seed` if needed)
- ✅ Newsletter subscribers (at least a few for testing)
- ✅ Published articles (for content generation)
- ✅ Email service configured (SMTP settings in `.env`)

### 2. Test the System

```bash
# Test campaign system functionality
npm run campaigns:test

# Test manual scheduler run
npm run campaigns:scheduler
```

### 3. Create Your First Campaign

1. Visit `/admin/campaigns` in your admin dashboard
2. Click "Create Campaign"
3. Fill in campaign details:
   - **Title**: Internal name for the campaign
   - **Subject**: Email subject line
   - **Template**: Choose from available email templates
   - **Recipients**: Select subscriber filters
   - **Scheduling**: Send now or schedule for later

## 📋 Campaign Management

### Creating Campaigns

**Via Admin Interface:**
1. Navigate to `/admin/campaigns`
2. Click "Create Campaign"
3. Configure campaign settings
4. Choose to send immediately or schedule

**Via API:**
```javascript
POST /api/admin/campaigns
{
  "title": "Weekly Tech Digest - January 2024",
  "subject": "🚀 Your Weekly Tech Update",
  "templateId": "template-id-here",
  "scheduledAt": "2024-01-15T10:00:00Z", // Optional
  "recipientFilter": {
    "status": ["ACTIVE"],
    "subscribedAfter": "2024-01-01T00:00:00Z"
  }
}
```

### Campaign Status Flow

```
DRAFT → SCHEDULED → SENDING → SENT
  ↓         ↓
CANCELLED ←─┘
```

- **DRAFT**: Campaign created but not sent
- **SCHEDULED**: Campaign scheduled for future delivery
- **SENDING**: Campaign currently being sent
- **SENT**: Campaign successfully sent
- **CANCELLED**: Campaign cancelled or failed

### Recipient Filtering

Target specific subscriber segments:

```javascript
{
  "recipientFilter": {
    "status": ["ACTIVE", "PENDING"],           // Subscription status
    "subscribedAfter": "2024-01-01T00:00:00Z", // Subscribed after date
    "subscribedBefore": "2024-12-31T23:59:59Z" // Subscribed before date
  }
}
```

## 🎨 Email Templates

### Available Template Categories

- **NEWSLETTER**: Regular newsletter templates
- **BREAKING_NEWS**: Urgent news alerts
- **WELCOME**: New subscriber onboarding
- **DIGEST**: Weekly/monthly digest
- **PROMOTIONAL**: Marketing campaigns
- **TRANSACTIONAL**: System emails

### Template Variables

Templates support dynamic content through Handlebars variables:

```handlebars
{{subscriber.name}}              <!-- Subscriber name -->
{{subscriber.email}}             <!-- Subscriber email -->
{{site.name}}                    <!-- Site name -->
{{site.url}}                     <!-- Site URL -->
{{campaign.subject}}             <!-- Campaign subject -->
{{campaign.unsubscribeUrl}}      <!-- Unsubscribe link -->

{{#each articles.latest}}        <!-- Latest articles -->
  {{title}}
  {{summary}}
  {{../site.url}}/news/{{slug}}
{{/each}}

{{#if articles.featured}}        <!-- Featured article -->
  {{articles.featured.title}}
  {{articles.featured.summary}}
{{/if}}
```

### Content Generation

The system automatically generates campaign content from:
- **Featured Article**: Most recent published article
- **Latest Articles**: 5 most recent articles (excluding featured)
- **Category Grouping**: Articles grouped by category
- **Author Information**: Article authors and metadata

## ⏰ Campaign Scheduling

### Automated Scheduling

Set up automated campaign processing:

**Option 1: Vercel Cron Jobs**
```javascript
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

**Option 2: External Cron Service**
```bash
# Call every 5 minutes
curl -X POST https://yourdomain.com/api/cron/campaigns \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Option 3: Manual Trigger**
```bash
# Trigger scheduler manually
npm run campaigns:cron
```

### Scheduling Rules

- Campaigns are checked every 5 minutes
- Scheduled time must be in the future
- System processes campaigns within 5 minutes of scheduled time
- Failed campaigns are marked as CANCELLED

## 📊 Analytics & Tracking

### Campaign Performance Metrics

- **Sent**: Total emails sent
- **Delivered**: Successfully delivered emails
- **Opened**: Email open rate tracking
- **Clicked**: Link click tracking
- **Bounced**: Bounced emails
- **Unsubscribed**: Unsubscribe rate

### Viewing Analytics

**Admin Dashboard:**
1. Go to `/admin/campaigns`
2. Click on any sent campaign
3. View performance metrics and timeline

**API Access:**
```javascript
GET /api/admin/campaigns/{campaignId}
// Returns campaign details with stats
```

## 🔧 Configuration

### Environment Variables

**Required:**
```env
# Email Service
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-api-key"
SMTP_FROM="SuperBear Blog <noreply@yourdomain.com>"

# Campaign Scheduler
CRON_SECRET="your-secure-cron-secret"
ENABLE_CAMPAIGN_SCHEDULER="true"
```

**Optional:**
```env
# Email Service Options
SMTP_SECURE="false"                    # Use TLS
EMAIL_BATCH_SIZE="50"                  # Emails per batch
EMAIL_BATCH_DELAY="1000"               # Delay between batches (ms)

# Campaign Settings
CAMPAIGN_DEFAULT_FROM_NAME="SuperBear Blog"
CAMPAIGN_MAX_RECIPIENTS="10000"        # Max recipients per campaign
CAMPAIGN_RETRY_ATTEMPTS="3"            # Retry failed sends
```

### Email Service Providers

**SendGrid:**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="SG.your-api-key"
```

**Mailgun:**
```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@yourdomain.com"
SMTP_PASSWORD="your-mailgun-password"
```

**Amazon SES:**
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-ses-access-key"
SMTP_PASSWORD="your-ses-secret-key"
```

## 🛠️ API Reference

### Campaign Endpoints

```javascript
// List campaigns
GET /api/admin/campaigns?page=1&limit=10

// Create campaign
POST /api/admin/campaigns
{
  "title": "Campaign Title",
  "subject": "Email Subject",
  "templateId": "template-id",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "recipientFilter": { ... }
}

// Get campaign details
GET /api/admin/campaigns/{id}

// Send campaign immediately
POST /api/admin/campaigns/{id}/send

// Schedule campaign
POST /api/admin/campaigns/{id}/schedule
{
  "scheduledAt": "2024-01-15T10:00:00Z"
}

// Delete campaign
DELETE /api/admin/campaigns/{id}
```

### Scheduler Endpoints

```javascript
// Get scheduler status
GET /api/admin/campaigns/scheduler

// Run scheduler manually (admin only)
POST /api/admin/campaigns/scheduler

// Cron job endpoint (requires CRON_SECRET)
POST /api/cron/campaigns
Headers: { "Authorization": "Bearer YOUR_CRON_SECRET" }
```

## 🧪 Testing

### Test Campaign System

```bash
# Run comprehensive system test
npm run campaigns:test
```

### Manual Testing Steps

1. **Create Test Campaign:**
   - Use a test email template
   - Target a small group of subscribers
   - Send immediately for quick feedback

2. **Test Scheduling:**
   - Create campaign scheduled 5 minutes in future
   - Monitor scheduler logs
   - Verify campaign sends automatically

3. **Test Content Generation:**
   - Ensure you have published articles
   - Create campaign with newsletter template
   - Verify articles appear in generated email

4. **Test Email Delivery:**
   - Check email service logs
   - Verify emails arrive in inbox
   - Test unsubscribe links work

## 🚨 Troubleshooting

### Common Issues

**Campaign Not Sending:**
- Check email service credentials
- Verify SMTP configuration
- Check campaign status and error logs
- Ensure recipients exist and are active

**Scheduled Campaigns Not Processing:**
- Verify cron job is running
- Check CRON_SECRET is correct
- Monitor scheduler endpoint logs
- Ensure scheduled time is in future

**Template Compilation Errors:**
- Verify template exists and is active
- Check Handlebars syntax in template
- Ensure all required variables are provided
- Test template with sample data

**No Recipients Found:**
- Check recipient filter criteria
- Verify newsletter subscribers exist
- Ensure subscriber status is correct
- Test with broader filter criteria

### Debug Commands

```bash
# Test email configuration
node scripts/test-email.js

# Test campaign system
npm run campaigns:test

# Check scheduler status
curl http://localhost:3000/api/admin/campaigns/scheduler

# Manual scheduler run
npm run campaigns:scheduler

# Test cron endpoint
npm run campaigns:cron
```

### Log Monitoring

Monitor these log entries:
- Campaign creation and sending
- Email delivery attempts
- Scheduler execution
- Template compilation
- Recipient filtering

## 🔒 Security Considerations

### Access Control
- All campaign endpoints require admin authentication
- Cron endpoints require secret token
- Subscriber data is protected and filtered

### Email Security
- DKIM/SPF/DMARC compliance ready
- Unsubscribe links in all emails
- Bounce and complaint handling
- Rate limiting to prevent abuse

### Data Protection
- Subscriber emails are encrypted
- Campaign content is sanitized
- Audit logs for all campaign actions
- GDPR compliance features

## 📈 Best Practices

### Campaign Creation
- Use descriptive campaign titles
- Write compelling subject lines
- Test with small groups first
- Schedule during optimal times

### Content Strategy
- Keep emails concise and valuable
- Include clear call-to-actions
- Use responsive email templates
- Personalize content when possible

### Performance Optimization
- Monitor delivery rates
- A/B test subject lines
- Segment subscribers effectively
- Clean inactive subscribers regularly

### Compliance
- Include unsubscribe links
- Honor unsubscribe requests immediately
- Maintain subscriber consent records
- Follow email marketing regulations

## 🎯 Advanced Features

### A/B Testing
- Create multiple campaign versions
- Test different subject lines
- Compare performance metrics
- Automatically send winning version

### Automation Rules
- Trigger campaigns based on events
- Welcome series for new subscribers
- Re-engagement campaigns
- Behavioral targeting

### Integration Options
- Webhook notifications
- External analytics platforms
- CRM system integration
- Social media cross-posting

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Run the test script: `npm run campaigns:test`
3. Review application logs
4. Create an issue in the project repository

The email campaign system is designed to be robust and scalable, supporting everything from simple newsletters to complex automated marketing sequences.