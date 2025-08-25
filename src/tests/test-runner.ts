#!/usr/bin/env node

/**
 * Comprehensive Test Runner for CMS Platform Fixes
 * 
 * This script orchestrates all testing phases for MEGA TASK 4:
 * - Unit Tests
 * - Integration Tests  
 * - E2E Tests
 * - Security Audits
 * - Performance Tests
 * - Accessibility Tests
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  required: boolean;
  timeout?: number;
}

interface TestResults {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class TestRunner {
  private results: TestResults[] = [];
  private startTime: number = Date.now();

  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      command: 'npm run test:unit',
      description: 'Run unit tests for components, hooks, and utilities',
      required: true,
      timeout: 60000,
    },
    {
      name: 'Integration Tests',
      command: 'npm run test:integration',
      description: 'Run API endpoint and database integration tests',
      required: true,
      timeout: 120000,
    },
    {
      name: 'E2E Tests',
      command: 'npm run test:e2e',
      description: 'Run end-to-end user workflow tests',
      required: true,
      timeout: 300000,
    },
    {
      name: 'Security Tests',
      command: 'npm run test:security',
      description: 'Run security audit tests (CSRF, rate limiting, etc.)',
      required: true,
      timeout: 60000,
    },
    {
      name: 'Performance Tests',
      command: 'npm run test:performance',
      description: 'Run performance benchmark tests',
      required: false,
      timeout: 120000,
    },
    {
      name: 'Accessibility Tests',
      command: 'npm run test:accessibility',
      description: 'Run accessibility compliance tests',
      required: true,
      timeout: 60000,
    },
    {
      name: 'Dependency Audit',
      command: 'npm audit --audit-level=moderate',
      description: 'Check for security vulnerabilities in dependencies',
      required: true,
      timeout: 30000,
    },
    {
      name: 'Type Check',
      command: 'npm run type-check',
      description: 'Verify TypeScript type safety',
      required: true,
      timeout: 30000,
    },
  ];

  async runSuite(suite: TestSuite): Promise<TestResults> {
    const startTime = Date.now();
    
    console.log(`\n🧪 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);
    
    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        timeout: suite.timeout || 60000,
        stdio: 'pipe',
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${suite.name} passed (${duration}ms)`);
      
      return {
        suite: suite.name,
        passed: true,
        duration,
        output,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.log(`❌ ${suite.name} failed (${duration}ms)`);
      if (error.stdout) {
        console.log('STDOUT:', error.stdout);
      }
      if (error.stderr) {
        console.log('STDERR:', error.stderr);
      }
      
      return {
        suite: suite.name,
        passed: false,
        duration,
        output: error.stdout || '',
        error: error.stderr || error.message,
      };
    }
  }

  async runAll(options: { 
    skipOptional?: boolean;
    failFast?: boolean;
    parallel?: boolean;
  } = {}): Promise<void> {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=====================================\n');

    const suitesToRun = options.skipOptional 
      ? this.testSuites.filter(suite => suite.required)
      : this.testSuites;

    if (options.parallel) {
      // Run non-E2E tests in parallel for speed
      const parallelSuites = suitesToRun.filter(suite => suite.name !== 'E2E Tests');
      const e2eSuites = suitesToRun.filter(suite => suite.name === 'E2E Tests');

      // Run parallel suites
      if (parallelSuites.length > 0) {
        console.log('🔄 Running tests in parallel...\n');
        const parallelResults = await Promise.all(
          parallelSuites.map(suite => this.runSuite(suite))
        );
        this.results.push(...parallelResults);
      }

      // Run E2E tests sequentially (they need more resources)
      for (const suite of e2eSuites) {
        const result = await this.runSuite(suite);
        this.results.push(result);
        
        if (!result.passed && options.failFast) {
          break;
        }
      }
    } else {
      // Run all tests sequentially
      for (const suite of suitesToRun) {
        const result = await this.runSuite(suite);
        this.results.push(result);
        
        if (!result.passed && options.failFast) {
          break;
        }
      }
    }

    this.printSummary();
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Total: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`   • ${result.suite}: ${result.error || 'Unknown error'}`);
        });
    }

    // Performance metrics
    const slowTests = this.results
      .filter(r => r.duration > 30000)
      .sort((a, b) => b.duration - a.duration);

    if (slowTests.length > 0) {
      console.log('\n⚠️  Slow Tests (>30s):');
      slowTests.forEach(result => {
        console.log(`   • ${result.suite}: ${result.duration}ms`);
      });
    }

    // Coverage summary (if available)
    this.printCoverageSummary();

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }

  private printCoverageSummary(): void {
    const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (existsSync(coverageFile)) {
      try {
        const coverage = require(coverageFile);
        const total = coverage.total;
        
        console.log('\n📈 Coverage Summary:');
        console.log(`   Lines: ${total.lines.pct}%`);
        console.log(`   Functions: ${total.functions.pct}%`);
        console.log(`   Branches: ${total.branches.pct}%`);
        console.log(`   Statements: ${total.statements.pct}%`);
        
        if (total.lines.pct < 80) {
          console.log('⚠️  Line coverage below 80%');
        }
      } catch (error) {
        console.log('⚠️  Could not read coverage summary');
      }
    }
  }

  async runSpecific(suiteNames: string[]): Promise<void> {
    console.log(`🎯 Running specific test suites: ${suiteNames.join(', ')}`);
    
    const suitesToRun = this.testSuites.filter(suite => 
      suiteNames.some(name => 
        suite.name.toLowerCase().includes(name.toLowerCase())
      )
    );

    if (suitesToRun.length === 0) {
      console.log('❌ No matching test suites found');
      console.log('Available suites:');
      this.testSuites.forEach(suite => {
        console.log(`   • ${suite.name}`);
      });
      process.exit(1);
    }

    for (const suite of suitesToRun) {
      const result = await this.runSuite(suite);
      this.results.push(result);
    }

    this.printSummary();
  }

  listSuites(): void {
    console.log('📋 Available Test Suites:');
    console.log('=========================\n');
    
    this.testSuites.forEach(suite => {
      const required = suite.required ? '(Required)' : '(Optional)';
      console.log(`${suite.name} ${required}`);
      console.log(`   Command: ${suite.command}`);
      console.log(`   Description: ${suite.description}`);
      console.log('');
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.includes('--help') || args.includes('-h')) {
    console.log('CMS Platform Test Runner');
    console.log('========================\n');
    console.log('Usage:');
    console.log('  npm run test:all                    # Run all tests');
    console.log('  npm run test:all -- --skip-optional # Skip optional tests');
    console.log('  npm run test:all -- --fail-fast     # Stop on first failure');
    console.log('  npm run test:all -- --parallel      # Run tests in parallel');
    console.log('  npm run test:all -- --list          # List available test suites');
    console.log('  npm run test:all -- unit integration # Run specific suites');
    console.log('');
    return;
  }

  if (args.includes('--list')) {
    runner.listSuites();
    return;
  }

  const options = {
    skipOptional: args.includes('--skip-optional'),
    failFast: args.includes('--fail-fast'),
    parallel: args.includes('--parallel'),
  };

  // Filter out option flags to get suite names
  const suiteNames = args.filter(arg => !arg.startsWith('--'));

  if (suiteNames.length > 0) {
    await runner.runSpecific(suiteNames);
  } else {
    await runner.runAll(options);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };