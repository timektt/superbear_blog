#!/usr/bin/env node

/**
 * Comprehensive Test Suite Runner for Podcast and Newsletter Features
 *
 * This script runs all tests related to the podcast and newsletter functionality
 * including unit tests, integration tests, E2E tests, accessibility tests, and performance tests.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  required: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests - Components',
    command:
      'npm run test:unit -- --testPathPattern="(PodcastCard|AudioPlayer|NewsletterIssueCard|PodcastForm|NewsletterIssueForm)"',
    description: 'Tests for podcast and newsletter React components',
    required: true,
  },
  {
    name: 'Integration Tests - API Endpoints',
    command:
      'npm run test:integration -- --testPathPattern="(podcast-endpoints|newsletter-endpoints)"',
    description: 'Tests for podcast and newsletter API routes',
    required: true,
  },
  {
    name: 'E2E Tests - User Workflows',
    command:
      'npx playwright test --grep "(podcast-workflow|newsletter-workflow)"',
    description: 'End-to-end tests for complete user journeys',
    required: true,
  },
  {
    name: 'Accessibility Tests',
    command: 'npx playwright test --grep "accessibility"',
    description: 'WCAG compliance and accessibility testing',
    required: true,
  },
  {
    name: 'Performance Tests',
    command: 'npx playwright test --grep "performance"',
    description: 'Performance benchmarks and optimization validation',
    required: false,
  },
  {
    name: 'Theme System Tests',
    command: 'npm run test:unit -- --testPathPattern="theme-system"',
    description: 'Tests for enhanced theme system functionality',
    required: true,
  },
];

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Podcast & Newsletter Test Suite\n');
    console.log('='.repeat(60));

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    this.printSummary();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n📋 Running: ${suite.name}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log(`⚡ Command: ${suite.command}\n`);

    const startTime = Date.now();
    let passed = false;
    let error: string | undefined;

    try {
      execSync(suite.command, {
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes timeout
      });
      passed = true;
      console.log(`✅ ${suite.name} - PASSED`);
    } catch (err) {
      passed = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      console.log(`❌ ${suite.name} - FAILED`);

      if (suite.required) {
        console.log(`🚨 Required test suite failed: ${suite.name}`);
      }
    }

    const duration = Date.now() - startTime;
    this.results.push({
      suite: suite.name,
      passed,
      duration,
      error,
    });
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter((r) => r.passed).length;
    const failedTests = this.results.filter((r) => !r.passed).length;
    const requiredFailures = this.results.filter(
      (r) => !r.passed && testSuites.find((s) => s.name === r.suite)?.required
    ).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(60));

    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`🚨 Required Failures: ${requiredFailures}`);

    console.log('\n📋 Detailed Results:');
    this.results.forEach((result) => {
      const status = result.passed ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`${status} ${result.suite} (${duration}s)`);

      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error.split('\n')[0]}`);
      }
    });

    // Overall result
    console.log('\n' + '='.repeat(60));
    if (requiredFailures === 0) {
      console.log('🎉 ALL REQUIRED TESTS PASSED!');
      console.log(
        '✨ Podcast and Newsletter features are ready for production'
      );
    } else {
      console.log('🚨 SOME REQUIRED TESTS FAILED!');
      console.log('⚠️  Please fix failing tests before deploying');
      process.exit(1);
    }
    console.log('='.repeat(60));
  }
}

// Validation functions
function validateEnvironment(): boolean {
  const requiredFiles = [
    'package.json',
    'jest.config.js',
    'playwright.config.ts',
  ];

  const missingFiles = requiredFiles.filter((file) => !existsSync(file));

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles.join(', '));
    return false;
  }

  return true;
}

function checkDependencies(): boolean {
  try {
    execSync('npm list jest @playwright/test', { stdio: 'pipe' });
    return true;
  } catch {
    console.error('❌ Missing required test dependencies');
    console.log('💡 Run: npm install --save-dev jest @playwright/test');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Validating test environment...');

  if (!validateEnvironment()) {
    process.exit(1);
  }

  if (!checkDependencies()) {
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');

  const runner = new TestRunner();
  await runner.runAllTests();
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Podcast & Newsletter Test Suite Runner

Usage: npm run test:podcast-newsletter [options]

Options:
  --help, -h     Show this help message
  --unit         Run only unit tests
  --integration  Run only integration tests
  --e2e          Run only E2E tests
  --accessibility Run only accessibility tests
  --performance  Run only performance tests

Examples:
  npm run test:podcast-newsletter
  npm run test:podcast-newsletter --unit
  npm run test:podcast-newsletter --e2e --accessibility
  `);
  process.exit(0);
}

// Filter test suites based on CLI arguments
if (args.length > 0) {
  const filteredSuites = testSuites.filter((suite) => {
    if (args.includes('--unit') && suite.name.includes('Unit Tests'))
      return true;
    if (
      args.includes('--integration') &&
      suite.name.includes('Integration Tests')
    )
      return true;
    if (args.includes('--e2e') && suite.name.includes('E2E Tests')) return true;
    if (
      args.includes('--accessibility') &&
      suite.name.includes('Accessibility')
    )
      return true;
    if (args.includes('--performance') && suite.name.includes('Performance'))
      return true;
    return false;
  });

  if (filteredSuites.length > 0) {
    testSuites.splice(0, testSuites.length, ...filteredSuites);
  }
}

// Run the test suite
main().catch((error) => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

export { TestRunner, testSuites };
