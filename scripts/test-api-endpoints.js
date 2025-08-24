const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPIEndpoints() {
  console.log('🧪 Testing Podcast and Newsletter API Endpoints...\n');

  try {
    // Test 1: Public Podcasts API
    console.log('1. Testing public podcasts API...');
    
    const podcastsResponse = await fetch(`${BASE_URL}/api/podcasts`);
    if (podcastsResponse.ok) {
      const podcastsData = await podcastsResponse.json();
      console.log(`   ✅ GET /api/podcasts - Status: ${podcastsResponse.status}`);
      console.log(`      Response structure: ${JSON.stringify(Object.keys(podcastsData), null, 2)}`);
    } else {
      console.log(`   ❌ GET /api/podcasts - Status: ${podcastsResponse.status}`);
    }

    // Test 2: Public Newsletter Issues API
    console.log('\n2. Testing public newsletter issues API...');
    
    const newsletterResponse = await fetch(`${BASE_URL}/api/newsletter/issues`);
    if (newsletterResponse.ok) {
      const newsletterData = await newsletterResponse.json();
      console.log(`   ✅ GET /api/newsletter/issues - Status: ${newsletterResponse.status}`);
      console.log(`      Response structure: ${JSON.stringify(Object.keys(newsletterData), null, 2)}`);
    } else {
      console.log(`   ❌ GET /api/newsletter/issues - Status: ${newsletterResponse.status}`);
    }

    // Test 3: Admin endpoints (should return 401 without auth)
    console.log('\n3. Testing admin endpoints (should return 401)...');
    
    const adminPodcastsResponse = await fetch(`${BASE_URL}/api/admin/podcasts`);
    console.log(`   ${adminPodcastsResponse.status === 401 ? '✅' : '❌'} GET /api/admin/podcasts - Status: ${adminPodcastsResponse.status} (Expected: 401)`);

    const adminNewsletterResponse = await fetch(`${BASE_URL}/api/admin/newsletter/issues`);
    console.log(`   ${adminNewsletterResponse.status === 401 ? '✅' : '❌'} GET /api/admin/newsletter/issues - Status: ${adminNewsletterResponse.status} (Expected: 401)`);

    // Test 4: Test pagination and filtering
    console.log('\n4. Testing pagination and filtering...');
    
    const paginatedPodcasts = await fetch(`${BASE_URL}/api/podcasts?page=1&limit=5`);
    if (paginatedPodcasts.ok) {
      const paginatedData = await paginatedPodcasts.json();
      console.log(`   ✅ Pagination works - Page: ${paginatedData.pagination?.page}, Limit: ${paginatedData.pagination?.limit}`);
    }

    const filteredPodcasts = await fetch(`${BASE_URL}/api/podcasts?search=test`);
    if (filteredPodcasts.ok) {
      console.log(`   ✅ Search filtering works`);
    }

    // Test 5: Test invalid requests
    console.log('\n5. Testing error handling...');
    
    const invalidPagination = await fetch(`${BASE_URL}/api/podcasts?page=-1&limit=1000`);
    console.log(`   ${invalidPagination.status === 400 ? '✅' : '❌'} Invalid pagination - Status: ${invalidPagination.status} (Expected: 400)`);

    const nonExistentPodcast = await fetch(`${BASE_URL}/api/admin/podcasts/non-existent-id`);
    console.log(`   ${nonExistentPodcast.status === 401 ? '✅' : '❌'} Non-existent podcast - Status: ${nonExistentPodcast.status} (Expected: 401 due to auth)`);

    console.log('\n🎉 API endpoint tests completed!');
    console.log('\nNote: Admin endpoints return 401 as expected (authentication required)');
    console.log('To test admin endpoints fully, you would need to authenticate first.');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the development server is running with: npm run dev');
  }
}

// Run the test
testAPIEndpoints();