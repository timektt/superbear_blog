// Simple email test script
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing email configuration...');

  // Create test account (for development)
  const testAccount = await nodemailer.createTestAccount();
  console.log('📧 Test account created:', testAccount.user);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Send test email
  try {
    const info = await transporter.sendMail({
      from: `"SuperBear Blog" <${testAccount.user}>`,
      to: 'test@example.com',
      subject: 'Test Email from SuperBear Blog',
      text: 'This is a test email to verify email configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email</h2>
          <p>This is a test email to verify email configuration.</p>
          <p>If you can see this, the email system is working correctly!</p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
      testAccount: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    };
  } catch (error) {
    console.error('❌ Email test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run test if called directly
if (require.main === module) {
  testEmail()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Email test completed successfully!');
        console.log('📝 Update your .env file with these credentials:');
        console.log(`SMTP_USER=${result.testAccount.user}`);
        console.log(`SMTP_PASSWORD=${result.testAccount.pass}`);
        console.log(`\n🔗 View the test email: ${result.previewUrl}`);
      } else {
        console.log('\n💥 Email test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test script error:', error);
      process.exit(1);
    });
}

module.exports = testEmail;
