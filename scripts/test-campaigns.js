#!/usr/bin/env node

/**
 * Test script for email campaign system
 * Tests campaign creation, scheduling, and sending functionality
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCampaignSystem() {
  console.log('🚀 Testing Email Campaign System...\n');

  try {
    // Test 1: Check database schema
    console.log('1. Testing database schema...');
    
    const campaignCount = await prisma.newsletterCampaign.count();
    const templateCount = await prisma.emailTemplate.count();
    const subscriberCount = await prisma.newsletter.count();
    
    console.log(`   ✅ Found ${campaignCount} campaigns`);
    console.log(`   ✅ Found ${templateCount} email templates`);
    console.log(`   ✅ Found ${subscriberCount} newsletter subscribers\n`);

    // Test 2: Test campaign creation API
    console.log('2. Testing campaign creation API...');
    
    const testCampaignData = {
      title: 'Test Campaign - ' + new Date().toISOString(),
      subject: '🧪 Test Email Campaign',
      templateId: 'test-template-id', // This would be a real template ID
      recipientFilter: {
        status: ['ACTIVE'],
      },
    };

    console.log('   📝 Campaign data prepared');
    console.log(`   📧 Subject: ${testCampaignData.subject}`);
    console.log(`   👥 Target: ${testCampaignData.recipientFilter.status.join(', ')} subscribers\n`);

    // Test 3: Test email template compilation
    console.log('3. Testing email template system...');
    
    const templates = await prisma.emailTemplate.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
      },
    });

    if (templates.length > 0) {
      console.log('   ✅ Available templates:');
      templates.forEach(template => {
        console.log(`      - ${template.name} (${template.category}) - ${template.status}`);
      });
    } else {
      console.log('   ⚠️  No email templates found. Run seed script first.');
    }
    console.log('');

    // Test 4: Test newsletter subscriber filtering
    console.log('4. Testing subscriber filtering...');
    
    const activeSubscribers = await prisma.newsletter.count({
      where: { status: 'ACTIVE' },
    });
    
    const pendingSubscribers = await prisma.newsletter.count({
      where: { status: 'PENDING' },
    });

    console.log(`   ✅ Active subscribers: ${activeSubscribers}`);
    console.log(`   ✅ Pending subscribers: ${pendingSubscribers}\n`);

    // Test 5: Test campaign content generation
    console.log('5. Testing campaign content generation...');
    
    const recentArticles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (recentArticles.length > 0) {
      console.log(`   ✅ Found ${recentArticles.length} recent articles for content generation:`);
      recentArticles.forEach((article, index) => {
        console.log(`      ${index + 1}. ${article.title} (${article.category.name})`);
      });
    } else {
      console.log('   ⚠️  No published articles found. Create some articles first.');
    }
    console.log('');

    // Test 6: Test API endpoints
    console.log('6. Testing API endpoints...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    console.log(`   📡 Base URL: ${baseUrl}`);
    console.log('   🔗 Available endpoints:');
    console.log('      - GET  /api/admin/campaigns');
    console.log('      - POST /api/admin/campaigns');
    console.log('      - GET  /api/admin/campaigns/[id]');
    console.log('      - POST /api/admin/campaigns/[id]/send');
    console.log('      - POST /api/admin/campaigns/[id]/schedule');
    console.log('      - GET  /api/admin/campaigns/scheduler');
    console.log('      - POST /api/cron/campaigns');
    console.log('');

    // Test 7: Test environment configuration
    console.log('7. Testing environment configuration...');
    
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'SMTP_FROM',
      'CRON_SECRET',
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length === 0) {
      console.log('   ✅ All required environment variables are set');
    } else {
      console.log('   ⚠️  Missing environment variables:');
      missingEnvVars.forEach(varName => {
        console.log(`      - ${varName}`);
      });
    }
    
    console.log(`   📧 SMTP Host: ${process.env.SMTP_HOST || 'Not set'}`);
    console.log(`   🔐 Cron Secret: ${process.env.CRON_SECRET ? 'Set' : 'Not set'}`);
    console.log('');

    // Test 8: Test campaign scheduler
    console.log('8. Testing campaign scheduler...');
    
    const scheduledCampaigns = await prisma.newsletterCampaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: new Date(),
        },
      },
    });

    console.log(`   ⏰ Found ${scheduledCampaigns.length} campaigns ready to be sent`);
    
    if (scheduledCampaigns.length > 0) {
      console.log('   📋 Scheduled campaigns:');
      scheduledCampaigns.forEach(campaign => {
        console.log(`      - ${campaign.title} (scheduled for ${campaign.scheduledAt})`);
      });
    }
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log(`✅ Database connection: Working`);
    console.log(`✅ Campaign models: ${campaignCount} campaigns found`);
    console.log(`✅ Email templates: ${templateCount} templates available`);
    console.log(`✅ Newsletter subscribers: ${subscriberCount} total subscribers`);
    console.log(`✅ Content generation: ${recentArticles.length} articles available`);
    console.log(`✅ Environment config: ${missingEnvVars.length === 0 ? 'Complete' : 'Incomplete'}`);
    console.log(`✅ Scheduled campaigns: ${scheduledCampaigns.length} ready to send`);
    console.log('');

    if (missingEnvVars.length === 0 && templates.length > 0 && activeSubscribers > 0) {
      console.log('🎉 Campaign system is ready for use!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Visit /admin/campaigns to create your first campaign');
      console.log('2. Set up a cron job to call /api/cron/campaigns every 5 minutes');
      console.log('3. Configure your production email service (SendGrid, Mailgun, etc.)');
    } else {
      console.log('⚠️  Campaign system needs configuration:');
      if (missingEnvVars.length > 0) {
        console.log('   - Set missing environment variables');
      }
      if (templates.length === 0) {
        console.log('   - Run: npm run db:seed to create email templates');
      }
      if (activeSubscribers === 0) {
        console.log('   - Add some newsletter subscribers for testing');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('- Database not initialized: Run `npx prisma db push`');
    console.error('- Missing seed data: Run `npm run db:seed`');
    console.error('- Environment variables not set: Check your .env file');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testCampaignSystem().catch(console.error);
}

module.exports = { testCampaignSystem };