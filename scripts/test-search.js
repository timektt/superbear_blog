// Simple test script to verify search functionality
const testUrls = [
  'http://localhost:3000/api/articles',
  'http://localhost:3000/api/articles?search=test',
  'http://localhost:3000/api/articles?category=ai',
  'http://localhost:3000/api/articles?tags=javascript',
  'http://localhost:3000/api/articles?search=test&category=ai',
  'http://localhost:3000/api/categories',
  'http://localhost:3000/api/tags',
  'http://localhost:3000/api/search?q=test',
];

async function testEndpoints() {
  console.log('Testing search and filter endpoints...\n');

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      const status = response.status;

      if (status === 200) {
        const data = await response.json();
        console.log(
          `✅ Status: ${status} - Response: ${JSON.stringify(data).substring(0, 100)}...`
        );
      } else {
        console.log(`❌ Status: ${status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testEndpoints();
}

module.exports = { testEndpoints };
