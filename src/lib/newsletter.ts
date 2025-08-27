import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';
import { generateVerificationToken } from '@/lib/auth-utils';
// import { reportError } from '@/lib/sentry';

// Re-export from auth-utils for consistency
export { generateVerificationToken } from '@/lib/auth-utils';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    // reportError(error as Error, { context: 'email_config_verification' });
    return false;
  }
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  try {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/verify?token=${token}`;

    const mailOptions = {
      from: {
        name: 'SuperBear Blog',
        address:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER ||
          'noreply@superbear.blog',
      },
      to: email,
      subject: 'Confirm your SuperBear Blog newsletter subscription',
      html: generateVerificationEmailHTML(verificationUrl),
      text: generateVerificationEmailText(verificationUrl),
    };

    // For development, just log the email
    if (process.env.NODE_ENV === 'development') {
      logger.info('Verification email would be sent', {
        to: email,
        verificationUrl,
      });
      console.log('📧 Verification Email:', verificationUrl);
      return;
    }

    // Send email in production
    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', result.messageId);
  } catch (error) {
    logger.error('Failed to send verification email', error as Error, {
      email,
    });
    // reportError(error as Error, { context: 'send_verification_email', email });
    throw new Error('Failed to send verification email');
  }
}

// Send welcome email after verification
export async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    const mailOptions = {
      from: {
        name: 'SuperBear Blog',
        address:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER ||
          'noreply@superbear.blog',
      },
      to: email,
      subject: 'Welcome to SuperBear Blog Newsletter! 🎉',
      html: generateWelcomeEmailHTML(),
      text: generateWelcomeEmailText(),
    };

    if (process.env.NODE_ENV === 'development') {
      logger.info('Welcome email would be sent', { to: email });
      console.log('📧 Welcome Email sent to:', email);
      return;
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
  } catch (error) {
    logger.error('Failed to send welcome email', error as Error, { email });
    // Don't throw error for welcome email failure
  }
}

// Generate verification email HTML
function generateVerificationEmailHTML(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm your subscription</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SuperBear Blog</div>
        </div>
        
        <h2>Confirm your newsletter subscription</h2>
        
        <p>Thank you for subscribing to the SuperBear Blog newsletter! We're excited to share the latest tech news, AI insights, and developer tools with you.</p>
        
        <p>To complete your subscription, please click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Confirm Subscription</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
        
        <p>If you didn't subscribe to our newsletter, you can safely ignore this email.</p>
        
        <div class="footer">
          <p>Best regards,<br>The SuperBear Blog Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate verification email text version
function generateVerificationEmailText(verificationUrl: string): string {
  return `
SuperBear Blog - Confirm your newsletter subscription

Thank you for subscribing to the SuperBear Blog newsletter! We're excited to share the latest tech news, AI insights, and developer tools with you.

To complete your subscription, please visit this link:
${verificationUrl}

If you didn't subscribe to our newsletter, you can safely ignore this email.

Best regards,
The SuperBear Blog Team
  `.trim();
}

// Generate welcome email HTML
function generateWelcomeEmailHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to SuperBear Blog!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .welcome-badge { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SuperBear Blog</div>
        </div>
        
        <div class="welcome-badge">
          <h2 style="margin: 0; color: white;">🎉 Welcome to SuperBear Blog!</h2>
          <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9);">Your subscription is now active</p>
        </div>
        
        <p>Welcome to the SuperBear Blog community! You're now subscribed to receive our curated tech news, AI insights, and developer tools updates.</p>
        
        <h3>What to expect:</h3>
        <ul>
          <li>🤖 Latest AI and machine learning news</li>
          <li>🛠️ Developer tools and open source projects</li>
          <li>🚀 Startup and tech industry insights</li>
          <li>📊 Deep-dive technical analysis</li>
        </ul>
        
        <p>While you're here, check out our latest content:</p>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/news" class="button">Browse Articles</a>
          <a href="${process.env.NEXTAUTH_URL}/ai" class="button">AI News</a>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The SuperBear Blog Team</p>
          <p><small>You can <a href="${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe">unsubscribe</a> at any time.</small></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate welcome email text version
function generateWelcomeEmailText(): string {
  return `
SuperBear Blog - Welcome! 🎉

Welcome to the SuperBear Blog community! You're now subscribed to receive our curated tech news, AI insights, and developer tools updates.

What to expect:
- Latest AI and machine learning news
- Developer tools and open source projects  
- Startup and tech industry insights
- Deep-dive technical analysis

Visit our website: ${process.env.NEXTAUTH_URL}

You can unsubscribe at any time by visiting:
${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe

Best regards,
The SuperBear Blog Team
  `.trim();
}

// Newsletter statistics
export async function getNewsletterStats() {
  const { prisma } = await import('@/lib/prisma');

  if (!prisma) {
    throw new Error('Database not available');
  }

  try {
    const stats = await prisma.newsletter.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const totalSubscribers = await prisma.newsletter.count();
    const activeSubscribers = await prisma.newsletter.count({
      where: { status: 'ACTIVE' },
    });

    const recentSubscriptions = await prisma.newsletter.count({
      where: {
        subscribedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    return {
      total: totalSubscribers,
      active: activeSubscribers,
      recent: recentSubscriptions,
      byStatus: stats.reduce((acc: Record<string, number>, stat: unknown) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Failed to get newsletter stats', error as Error);
    throw new Error('Failed to get newsletter statistics');
  }
}
