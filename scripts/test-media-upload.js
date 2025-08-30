#!/usr/bin/env node

/**
 * Media Upload Test Script
 * Tests the media upload functionality and API endpoints
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Create a test image if it doesn't exist
function createTestImage() {
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    return;
  }

  logInfo('Creating test image...');
  
  // Create a simple 1x1 pixel JPEG
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
    0xFF, 0xD9
  ]);

  fs.writeFileSync(TEST_IMAGE_PATH, jpegHeader);
  logSuccess('Test image created');
}

// Test upload endpoint
async function testUploadEndpoint() {
  logInfo('Testing upload endpoint...');

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('folder', 'test');

    const response = await fetch(`${BASE_URL}/api/upload-image`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      logSuccess('Upload endpoint test passed');
      return result.data;
    } else {
      logError(`Upload endpoint test failed: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logError(`Upload endpoint test failed: ${error.message}`);
    return null;
  }
}

// Test media API endpoints
async function testMediaAPI() {
  logInfo('Testing media API endpoints...');

  const endpoints = [
    { path: '/api/admin/media', method: 'GET', name: 'Media list' },
    { path: '/api/admin/media/orphans', method: 'GET', name: 'Orphaned media' },
    { path: '/api/health/media', method: 'GET', name: 'Media health check' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method
      });

      if (response.status === 401) {
        logWarning(`${endpoint.name}: Authentication required (expected)`);
      } else if (response.ok) {
        logSuccess(`${endpoint.name}: Accessible`);
      } else {
        logError(`${endpoint.name}: Failed (${response.status})`);
      }
    } catch (error) {
      logError(`${endpoint.name}: Error - ${error.message}`);
    }
  }
}

// Test file validation
async function testFileValidation() {
  logInfo('Testing file validation...');

  // Test with invalid file type
  try {
    const formData = new FormData();
    formData.append('file', Buffer.from('invalid content'), {
      filename: 'test.txt',
      contentType: 'text/plain'
    });

    const response = await fetch(`${BASE_URL}/api/upload-image`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok && result.error) {
      logSuccess('File validation: Correctly rejected invalid file type');
    } else {
      logWarning('File validation: Invalid file was accepted (potential issue)');
    }
  } catch (error) {
    logError(`File validation test failed: ${error.message}`);
  }

  // Test with oversized file (simulate)
  try {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const formData = new FormData();
    formData.append('file', largeBuffer, {
      filename: 'large.jpg',
      contentType: 'image/jpeg'
    });

    const response = await fetch(`${BASE_URL}/api/upload-image`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok && result.error && result.error.includes('large')) {
      logSuccess('File validation: Correctly rejected oversized file');
    } else {
      logWarning('File validation: Large file handling unclear');
    }
  } catch (error) {
    logWarning(`Large file test: ${error.message}`);
  }
}

// Test cleanup functionality
async function testCleanupAPI() {
  logInfo('Testing cleanup API...');

  try {
    // Test dry run cleanup
    const response = await fetch(`${BASE_URL}/api/admin/media/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dryRun: true,
        olderThanDays: 30
      })
    });

    if (response.status === 401) {
      logWarning('Cleanup API: Authentication required (expected)');
    } else if (response.ok) {
      const result = await response.json();
      logSuccess('Cleanup API: Accessible');
      logInfo(`Cleanup would process ${result.data?.processed || 0} files`);
    } else {
      logError(`Cleanup API: Failed (${response.status})`);
    }
  } catch (error) {
    logError(`Cleanup API test failed: ${error.message}`);
  }
}

// Test health endpoints
async function testHealthEndpoints() {
  logInfo('Testing health endpoints...');

  const healthEndpoints = [
    '/api/health',
    '/api/health/database',
    '/api/health/media'
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const result = await response.json();

      if (response.ok && result.status === 'healthy') {
        logSuccess(`Health check ${endpoint}: Healthy`);
      } else {
        logWarning(`Health check ${endpoint}: ${result.status || 'Unknown'}`);
      }
    } catch (error) {
      logError(`Health check ${endpoint}: Error - ${error.message}`);
    }
  }
}

// Test rate limiting
async function testRateLimiting() {
  logInfo('Testing rate limiting...');

  const requests = [];
  for (let i = 0; i < 15; i++) {
    requests.push(
      fetch(`${BASE_URL}/api/admin/media`, { method: 'GET' })
        .then(r => r.status)
        .catch(() => 500)
    );
  }

  try {
    const results = await Promise.all(requests);
    const rateLimited = results.filter(status => status === 429).length;

    if (rateLimited > 0) {
      logSuccess(`Rate limiting: Working (${rateLimited} requests rate limited)`);
    } else {
      logWarning('Rate limiting: No rate limiting detected (may be disabled)');
    }
  } catch (error) {
    logError(`Rate limiting test failed: ${error.message}`);
  }
}

// Performance test
async function testPerformance() {
  logInfo('Testing upload performance...');

  const startTime = Date.now();
  const uploadResult = await testUploadEndpoint();
  const endTime = Date.now();

  if (uploadResult) {
    const duration = endTime - startTime;
    logInfo(`Upload duration: ${duration}ms`);

    if (duration < 5000) {
      logSuccess('Upload performance: Good (< 5s)');
    } else if (duration < 10000) {
      logWarning('Upload performance: Acceptable (5-10s)');
    } else {
      logError('Upload performance: Slow (> 10s)');
    }
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Media Management System Test Suite', 'cyan');
  log('=====================================\n', 'cyan');

  // Setup
  createTestImage();

  // Run tests
  await testHealthEndpoints();
  await testUploadEndpoint();
  await testMediaAPI();
  await testFileValidation();
  await testCleanupAPI();
  await testRateLimiting();
  await testPerformance();

  // Cleanup
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    fs.unlinkSync(TEST_IMAGE_PATH);
    logInfo('Test image cleaned up');
  }

  log('\n✅ Test suite completed!', 'green');
  log('Check the results above for any issues.\n', 'cyan');
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testUploadEndpoint,
  testMediaAPI,
  testFileValidation,
  testCleanupAPI,
  testHealthEndpoints,
  testRateLimiting,
  testPerformance
};