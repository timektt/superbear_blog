// Test newsletter API directly
const fetch = require('node-fetch');

async function testNewsletterAPI() {
  console.log('🧪 Testing newsletter subscription API...');

  const testData = {
    email: 'test@example.com',
    variant: 'compact',
    preferences: {
      frequency: 'weekly',
      categories: [],
      breakingNews: true,
    },
  };

  try {
    const response = await fetch(
      'http://localhost:3000/api/newsletter/subscribe',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      }
    );

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📧 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Newsletter subscription API is working!');
    } else {
      console.log('❌ Newsletter subscription API failed');
    }
  } catch (error) {
    console.error('💥 API test error:', error.message);
  }
}

// Run test
testNewsletterAPI();
