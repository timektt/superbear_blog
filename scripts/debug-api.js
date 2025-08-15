// Debug API route directly
const fetch = require('node-fetch');

async function debugAPI() {
  console.log('🔍 Debugging newsletter API route...');
  
  const testData = {
    email: `debug-${Date.now()}@example.com`,
    variant: 'compact',
    preferences: {
      frequency: 'weekly',
      categories: [],
      breakingNews: true
    }
  };
  
  console.log('📤 Sending request with data:', testData);
  
  try {
    const response = await fetch('http://localhost:3000/api/newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Script/1.0'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📧 Raw response:', responseText);
    
    try {
      const result = JSON.parse(responseText);
      console.log('📧 Parsed response:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response');
    }
    
    if (response.ok) {
      console.log('✅ API request successful!');
    } else {
      console.log('❌ API request failed');
    }
    
  } catch (error) {
    console.error('💥 API request error:', error.message);
    console.error('Full error:', error);
  }
}

// Run debug
debugAPI();