// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:3000';

async function testAnalyticsAPI() {
  console.log('🧪 Testing Analytics API Endpoints...\n');

  try {
    // 1. Test analytics tracking endpoint
    console.log('1. Testing analytics tracking endpoint...');

    const trackingResponse = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test Browser/1.0',
      },
      body: JSON.stringify({
        type: 'view',
        articleId: 'cmedc8aka0000cnkk8t8rba8q', // Use the test article ID from previous test
        userAgent: 'Test Browser/1.0',
        referrer: 'https://google.com',
        metadata: {
          acceptLanguage: 'en-US',
          timezone: 'America/New_York',
          screenResolution: '1920x1080',
          viewportSize: '1200x800',
        },
      }),
    });

    if (trackingResponse.ok) {
      const trackingResult = await trackingResponse.json();
      console.log('✅ Tracking endpoint response:', trackingResult);
    } else {
      console.log(
        '❌ Tracking endpoint failed:',
        trackingResponse.status,
        await trackingResponse.text()
      );
    }

    // 2. Test interaction tracking
    console.log('\n2. Testing interaction tracking...');

    const interactionResponse = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test Browser/1.0',
      },
      body: JSON.stringify({
        type: 'interaction',
        articleId: 'cmedc8aka0000cnkk8t8rba8q',
        interactionType: 'LINK_CLICK',
        linkUrl: 'https://example.com',
        elementId: 'test-link',
        timeFromStart: 30000,
      }),
    });

    if (interactionResponse.ok) {
      const interactionResult = await interactionResponse.json();
      console.log('✅ Interaction tracking response:', interactionResult);
    } else {
      console.log(
        '❌ Interaction tracking failed:',
        interactionResponse.status,
        await interactionResponse.text()
      );
    }

    // 3. Test dashboard endpoint (requires admin auth - will fail without login)
    console.log(
      '\n3. Testing dashboard endpoint (without auth - should fail)...'
    );

    const dashboardResponse = await fetch(
      `${BASE_URL}/api/analytics/dashboard?range=week&limit=10`
    );

    if (dashboardResponse.status === 401) {
      console.log('✅ Dashboard endpoint correctly requires authentication');
    } else {
      console.log(
        '❌ Dashboard endpoint should require authentication, got:',
        dashboardResponse.status
      );
    }

    // 4. Test article analytics endpoint (requires admin auth - will fail without login)
    console.log(
      '\n4. Testing article analytics endpoint (without auth - should fail)...'
    );

    const articleAnalyticsResponse = await fetch(
      `${BASE_URL}/api/analytics/articles/cmedc8aka0000cnkk8t8rba8q`
    );

    if (articleAnalyticsResponse.status === 401) {
      console.log(
        '✅ Article analytics endpoint correctly requires authentication'
      );
    } else {
      console.log(
        '❌ Article analytics endpoint should require authentication, got:',
        articleAnalyticsResponse.status
      );
    }

    console.log('\n✅ Analytics API tests completed!');
  } catch (error) {
    console.error('❌ Analytics API test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testAnalyticsAPI()
    .then(() => {
      console.log('\n🎉 Analytics API testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Analytics API testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAnalyticsAPI };
