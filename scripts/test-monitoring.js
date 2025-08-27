/**
 * Test script for monitoring system
 * Tests request/response monitoring, metrics collection, and health checks
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testMonitoring() {
  console.log('🔍 Testing monitoring system...\n');

  try {
    // Test 1: Generate some test requests
    console.log('1. Generating test requests...');
    const testRequests = [
      { path: '/api/health/monitoring', method: 'GET' },
      { path: '/api/articles', method: 'GET' },
      { path: '/api/search?q=test', method: 'GET' },
      { path: '/api/nonexistent', method: 'GET' }, // This should generate a 404
    ];

    for (const req of testRequests) {
      try {
        const response = await fetch(`${BASE_URL}${req.path}`, {
          method: req.method,
          headers: {
            'User-Agent': 'monitoring-test-script',
            'x-test-request': 'true',
          },
        });

        console.log(
          `   ${req.method} ${req.path} -> ${response.status} (${response.headers.get('x-response-time')}ms)`
        );

        // Check for monitoring headers
        const requestId = response.headers.get('x-request-id');
        const responseTime = response.headers.get('x-response-time');
        const traceId = response.headers.get('x-trace-id');

        if (requestId && responseTime && traceId) {
          console.log(
            `   ✅ Monitoring headers present: ID=${requestId.substring(0, 12)}..., Time=${responseTime}ms`
          );
        } else {
          console.log(`   ⚠️  Missing monitoring headers`);
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }

    // Test 2: Check health endpoint
    console.log('\n2. Testing health endpoint...');
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health/monitoring`);
      const healthData = await healthResponse.json();

      console.log(`   Status: ${healthData.status}`);
      console.log(`   Uptime: ${Math.floor(healthData.uptime / 1000)}s`);
      console.log(`   Response Time: ${healthData.responseTime?.toFixed(0)}ms`);
      console.log(`   Version: ${healthData.version}`);

      if (healthResponse.status === 200) {
        console.log('   ✅ Health check passed');
      } else {
        console.log('   ⚠️  Health check returned non-200 status');
      }
    } catch (error) {
      console.log(`   ❌ Health check failed: ${error.message}`);
    }

    // Test 3: Check admin monitoring endpoint (if accessible)
    console.log('\n3. Testing admin monitoring endpoint...');
    try {
      const monitoringResponse = await fetch(
        `${BASE_URL}/api/admin/monitoring?action=overview`
      );

      if (monitoringResponse.status === 401) {
        console.log(
          '   ⚠️  Admin monitoring requires authentication (expected)'
        );
      } else if (monitoringResponse.ok) {
        const monitoringData = await monitoringResponse.json();
        console.log('   ✅ Admin monitoring accessible');
        console.log(
          `   Total Requests: ${monitoringData.systemMetrics?.totalRequests || 0}`
        );
        console.log(
          `   Success Rate: ${monitoringData.systemMetrics?.successfulRequests || 0}/${monitoringData.systemMetrics?.totalRequests || 0}`
        );
        console.log(
          `   Recent Requests: ${monitoringData.recentRequests?.length || 0}`
        );
      } else {
        console.log(
          `   ❌ Admin monitoring returned ${monitoringResponse.status}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Admin monitoring failed: ${error.message}`);
    }

    // Test 4: Test slow request detection
    console.log('\n4. Testing slow request detection...');
    try {
      const slowResponse = await fetch(
        `${BASE_URL}/api/health/monitoring?delay=1500`,
        {
          headers: { 'x-test-slow-request': 'true' },
        }
      );

      const responseTime = slowResponse.headers.get('x-response-time');
      if (responseTime && parseInt(responseTime) > 1000) {
        console.log(`   ✅ Slow request detected: ${responseTime}ms`);
      } else {
        console.log(
          `   ⚠️  Response time: ${responseTime}ms (may not trigger slow request warning)`
        );
      }
    } catch (error) {
      console.log(`   ❌ Slow request test failed: ${error.message}`);
    }

    console.log('\n✅ Monitoring system test completed!');
    console.log('\nTo view detailed monitoring data:');
    console.log(`- Health: ${BASE_URL}/api/health/monitoring`);
    console.log(
      `- Admin Dashboard: ${BASE_URL}/admin/monitoring (requires auth)`
    );
  } catch (error) {
    console.error('❌ Monitoring test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMonitoring().catch(console.error);
