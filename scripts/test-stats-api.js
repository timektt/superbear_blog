// Simple test to check if the stats API endpoint is working
// Note: This test assumes the server is running on localhost:3000

async function testStatsAPI() {
  try {
    console.log('Testing /api/admin/stats endpoint...');
    
    const response = await fetch('http://localhost:3000/api/admin/stats');
    
    if (!response.ok) {
      console.log(`API returned status: ${response.status}`);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Verify the structure
    if (data.articles && data.categories && data.authors && data.activity) {
      console.log('✅ API response has correct structure');
    } else {
      console.log('❌ API response structure is incorrect');
    }
    
  } catch (error) {
    console.error('Error testing stats API:', error.message);
  }
}

testStatsAPI();