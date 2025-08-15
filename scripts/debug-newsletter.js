// Debug newsletter subscription issues
const { PrismaClient } = require('@prisma/client');

async function debugNewsletter() {
  console.log('🔍 Debugging newsletter subscription...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if Newsletter table exists
    console.log('2. Checking Newsletter table...');
    try {
      const count = await prisma.newsletter.count();
      console.log(`✅ Newsletter table exists with ${count} records`);
    } catch (error) {
      console.error('❌ Newsletter table error:', error.message);
      return;
    }
    
    // Test creating a newsletter subscription
    console.log('3. Testing newsletter subscription creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    try {
      const subscription = await prisma.newsletter.create({
        data: {
          email: testEmail,
          status: 'PENDING',
          verificationToken: 'test-token-' + Date.now(),
          source: 'debug-test'
        }
      });
      
      console.log('✅ Newsletter subscription created:', {
        id: subscription.id,
        email: subscription.email,
        status: subscription.status
      });
      
      // Clean up test data
      await prisma.newsletter.delete({
        where: { id: subscription.id }
      });
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      console.error('❌ Newsletter creation error:', error.message);
      console.error('Full error:', error);
    }
    
    // Test email configuration
    console.log('4. Testing email configuration...');
    const nodemailer = require('nodemailer');
    
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };
    
    console.log('Email config:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.auth.user ? '***' : 'NOT SET',
      pass: emailConfig.auth.pass ? '***' : 'NOT SET'
    });
    
    const transporter = nodemailer.createTransport(emailConfig);
    
    try {
      await transporter.verify();
      console.log('✅ Email configuration verified');
    } catch (error) {
      console.error('❌ Email configuration error:', error.message);
    }
    
    console.log('🎉 Debug completed successfully!');
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run debug
debugNewsletter();