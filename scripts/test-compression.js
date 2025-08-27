#!/usr/bin/env node

/**
 * Test script to verify API response compression
 * Tests both gzip and brotli compression on various endpoints
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_ENDPOINTS = [
  '/api/articles',
  '/api/search?q=javascript',
  '/api/system/compression',
  '/api/admin/campaigns/analytics?days=7',
];

// Test compression for a single endpoint
async function testEndpointCompression(endpoint, encoding = 'gzip') {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': encoding,
        'User-Agent': 'compression-test/1.0',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      let rawData = Buffer.alloc(0);

      res.on('data', (chunk) => {
        data += chunk;
        rawData = Buffer.concat([rawData, chunk]);
      });

      res.on('end', () => {
        const result = {
          endpoint,
          encoding,
          statusCode: res.statusCode,
          headers: res.headers,
          contentEncoding: res.headers['content-encoding'],
          contentLength: res.headers['content-length'],
          actualSize: rawData.length,
          isCompressed: res.headers['content-encoding'] === encoding,
          compressionRatio: res.headers['x-compression-ratio'],
          originalSize: res.headers['x-original-size'],
          compressedSize: res.headers['x-compressed-size'],
          cacheStatus: res.headers['x-cache'],
          vary: res.headers['vary'],
        };

        resolve(result);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Request timeout for ${endpoint}`));
    });

    req.end();
  });
}

// Test all endpoints with different encodings
async function runCompressionTests() {
  console.log('🗜️  Testing API Response Compression\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = [];
  const encodings = ['gzip', 'br', 'gzip, br'];

  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`Testing endpoint: ${endpoint}`);

    for (const encoding of encodings) {
      try {
        const result = await testEndpointCompression(endpoint, encoding);
        results.push(result);

        const status = result.statusCode === 200 ? '✅' : '❌';
        const compressed = result.isCompressed ? '🗜️' : '📄';
        const size = result.actualSize ? `${result.actualSize}B` : 'unknown';

        console.log(
          `  ${status} ${compressed} ${encoding.padEnd(10)} - ${size} - ${result.statusCode}`
        );

        if (result.compressionRatio) {
          console.log(`    💾 Compression: ${result.compressionRatio} savings`);
        }

        if (result.cacheStatus) {
          console.log(`    🎯 Cache: ${result.cacheStatus}`);
        }
      } catch (error) {
        console.log(`  ❌ ${encoding.padEnd(10)} - Error: ${error.message}`);
        results.push({
          endpoint,
          encoding,
          error: error.message,
        });
      }
    }

    console.log('');
  }

  // Summary
  console.log('\n📊 Compression Test Summary\n');

  const successful = results.filter((r) => r.statusCode === 200);
  const compressed = results.filter((r) => r.isCompressed);
  const withBrotli = results.filter((r) => r.contentEncoding === 'br');
  const withGzip = results.filter((r) => r.contentEncoding === 'gzip');

  console.log(`Total requests: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Compressed: ${compressed.length}`);
  console.log(`Brotli: ${withBrotli.length}`);
  console.log(`Gzip: ${withGzip.length}`);

  // Check for issues
  const issues = [];

  if (compressed.length === 0) {
    issues.push('⚠️  No responses were compressed');
  }

  if (withBrotli.length === 0 && withGzip.length > 0) {
    issues.push('⚠️  Brotli compression not working, falling back to gzip');
  }

  const missingVary = results.filter(
    (r) => r.statusCode === 200 && !r.vary?.includes('Accept-Encoding')
  );
  if (missingVary.length > 0) {
    issues.push('⚠️  Some responses missing "Vary: Accept-Encoding" header');
  }

  if (issues.length > 0) {
    console.log('\n🚨 Issues Found:\n');
    issues.forEach((issue) => console.log(issue));
  } else {
    console.log('\n✅ All compression tests passed!');
  }

  // Detailed results for debugging
  if (process.env.DEBUG) {
    console.log('\n🔍 Detailed Results:\n');
    console.log(JSON.stringify(results, null, 2));
  }
}

// Run tests
if (require.main === module) {
  runCompressionTests().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testEndpointCompression, runCompressionTests };
