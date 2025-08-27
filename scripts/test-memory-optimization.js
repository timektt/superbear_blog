/**
 * Memory Optimization Testing Script
 * Tests memory monitoring and optimization functionality
 */

const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  iterations: 10,
  memoryStressSize: 1000000, // 1MB of data per iteration
};

// Test utilities
class MemoryTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  formatBytes(bytes) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        heapUsedPercent: (usage.heapUsed / usage.heapTotal) * 100,
      };
    }
    return null;
  }

  async testMemoryMonitoringAPI() {
    this.log('Testing Memory Monitoring API...');

    try {
      // Test memory status endpoint
      const statusResponse = await fetch(
        `${TEST_CONFIG.baseUrl}/api/admin/memory/optimization?action=status`
      );
      if (!statusResponse.ok) {
        throw new Error(`Status API failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      this.log('Memory Status API Response:', {
        pressureLevel: statusData.pressureLevel,
        heapUsedPercent:
          statusData.currentStats?.heapUsedPercent?.toFixed(1) + '%',
        trend: statusData.trend?.trend,
      });

      // Test configuration endpoint
      const configResponse = await fetch(
        `${TEST_CONFIG.baseUrl}/api/admin/memory/optimization?action=config`
      );
      if (!configResponse.ok) {
        throw new Error(`Config API failed: ${configResponse.status}`);
      }

      const configData = await configResponse.json();
      this.log('Memory Config API Response:', {
        enableAutoGC: configData.config?.enableAutoGC,
        gcThreshold: configData.config?.gcThreshold + '%',
        enableCacheCleanup: configData.config?.enableCacheCleanup,
      });

      // Test leak detection endpoint
      const leakResponse = await fetch(
        `${TEST_CONFIG.baseUrl}/api/admin/memory/optimization?action=leak-detection`
      );
      if (!leakResponse.ok) {
        throw new Error(`Leak detection API failed: ${leakResponse.status}`);
      }

      const leakData = await leakResponse.json();
      this.log('Leak Detection API Response:', {
        hasLeak: leakData.leakDetection?.hasLeak,
        severity: leakData.leakDetection?.leakSeverity,
        detailsCount: leakData.leakDetection?.details?.length || 0,
      });

      return true;
    } catch (error) {
      this.log('Memory Monitoring API Test Failed:', { error: error.message });
      return false;
    }
  }

  async testMemoryOptimization() {
    this.log('Testing Memory Optimization...');

    try {
      const beforeMemory = this.getMemoryUsage();
      this.log('Memory Before Optimization:', {
        heapUsed: this.formatBytes(beforeMemory?.heapUsed || 0),
        heapUsedPercent: beforeMemory?.heapUsedPercent?.toFixed(1) + '%',
      });

      // Trigger memory optimization
      const optimizeResponse = await fetch(
        `${TEST_CONFIG.baseUrl}/api/admin/memory/optimization?action=optimize`,
        {
          method: 'POST',
        }
      );

      if (!optimizeResponse.ok) {
        throw new Error(`Optimization API failed: ${optimizeResponse.status}`);
      }

      const optimizeData = await optimizeResponse.json();
      this.log('Memory Optimization Result:', {
        success: optimizeData.success,
        memoryFreed: this.formatBytes(optimizeData.result?.memoryFreed || 0),
        optimizationsApplied:
          optimizeData.result?.optimizationsApplied?.length || 0,
      });

      // Wait a moment and check memory again
      await this.delay(1000);
      const afterMemory = this.getMemoryUsage();
      this.log('Memory After Optimization:', {
        heapUsed: this.formatBytes(afterMemory?.heapUsed || 0),
        heapUsedPercent: afterMemory?.heapUsedPercent?.toFixed(1) + '%',
      });

      return optimizeData.success;
    } catch (error) {
      this.log('Memory Optimization Test Failed:', { error: error.message });
      return false;
    }
  }

  async testForceGarbageCollection() {
    this.log('Testing Force Garbage Collection...');

    try {
      const beforeMemory = this.getMemoryUsage();

      // Trigger force GC
      const gcResponse = await fetch(
        `${TEST_CONFIG.baseUrl}/api/admin/memory/optimization?action=force-gc`,
        {
          method: 'POST',
        }
      );

      if (!gcResponse.ok) {
        throw new Error(`Force GC API failed: ${gcResponse.status}`);
      }

      const gcData = await gcResponse.json();
      this.log('Force GC Result:', {
        success: gcData.success,
        message: gcData.message,
        memoryFreed: this.formatBytes(gcData.memoryFreed || 0),
      });

      return gcData.success;
    } catch (error) {
      this.log('Force GC Test Failed:', { error: error.message });
      return false;
    }
  }

  async testConfigurationUpdate() {
    this.log('Testing Configuration Update...');

    try {
      // Update configuration
      const newConfig = {
        enableAutoGC: true,
        gcThreshold: 80,
        enableCacheCleanup: true,
        maxCacheSize: 2000,
      };

      const updateResponse = await fetch(
        `${TEST_CONFIG.baseUrl}/api/admin/memory/optimization?action=update-config`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: newConfig }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Config update API failed: ${updateResponse.status}`);
      }

      const updateData = await updateResponse.json();
      this.log('Config Update Result:', {
        success: updateData.success,
        gcThreshold: updateData.config?.gcThreshold,
        maxCacheSize: updateData.config?.maxCacheSize,
      });

      return updateData.success;
    } catch (error) {
      this.log('Config Update Test Failed:', { error: error.message });
      return false;
    }
  }

  async createMemoryPressure() {
    this.log('Creating Memory Pressure for Testing...');

    // Create large objects to increase memory usage
    const largeObjects = [];

    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      // Create 1MB of data
      const largeArray = new Array(TEST_CONFIG.memoryStressSize)
        .fill(0)
        .map((_, index) => ({
          id: index,
          data: `test-data-${i}-${index}`,
          timestamp: Date.now(),
          randomData: Math.random().toString(36).repeat(10),
        }));

      largeObjects.push(largeArray);

      const currentMemory = this.getMemoryUsage();
      this.log(`Memory Pressure Iteration ${i + 1}:`, {
        heapUsed: this.formatBytes(currentMemory?.heapUsed || 0),
        heapUsedPercent: currentMemory?.heapUsedPercent?.toFixed(1) + '%',
      });

      // Small delay to allow monitoring
      await this.delay(100);
    }

    return largeObjects;
  }

  async runMemoryStressTest() {
    this.log('Running Memory Stress Test...');

    try {
      // Create memory pressure
      const largeObjects = await this.createMemoryPressure();

      // Test optimization under pressure
      const optimizationResult = await this.testMemoryOptimization();

      // Clean up
      largeObjects.length = 0;

      // Force GC to clean up
      if (global.gc) {
        global.gc();
      }

      return optimizationResult;
    } catch (error) {
      this.log('Memory Stress Test Failed:', { error: error.message });
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting Memory Optimization Tests...');

    const tests = [
      {
        name: 'Memory Monitoring API',
        test: () => this.testMemoryMonitoringAPI(),
      },
      {
        name: 'Memory Optimization',
        test: () => this.testMemoryOptimization(),
      },
      {
        name: 'Force Garbage Collection',
        test: () => this.testForceGarbageCollection(),
      },
      {
        name: 'Configuration Update',
        test: () => this.testConfigurationUpdate(),
      },
      { name: 'Memory Stress Test', test: () => this.runMemoryStressTest() },
    ];

    const results = [];

    for (const { name, test } of tests) {
      this.log(`\n--- Running Test: ${name} ---`);
      const startTime = performance.now();

      try {
        const result = await test();
        const duration = performance.now() - startTime;

        results.push({
          name,
          success: result,
          duration: Math.round(duration),
        });

        this.log(
          `Test ${name}: ${result ? 'PASSED' : 'FAILED'} (${Math.round(duration)}ms)`
        );
      } catch (error) {
        const duration = performance.now() - startTime;
        results.push({
          name,
          success: false,
          duration: Math.round(duration),
          error: error.message,
        });

        this.log(`Test ${name}: FAILED (${Math.round(duration)}ms)`, {
          error: error.message,
        });
      }

      // Delay between tests
      await this.delay(1000);
    }

    // Summary
    this.log('\n--- Test Summary ---');
    const passed = results.filter((r) => r.success).length;
    const total = results.length;
    const totalDuration = Date.now() - this.startTime;

    this.log(`Tests Passed: ${passed}/${total}`);
    this.log(`Total Duration: ${totalDuration}ms`);

    results.forEach((result) => {
      const status = result.success ? '✅' : '❌';
      this.log(`${status} ${result.name}: ${result.duration}ms`);
      if (result.error) {
        this.log(`   Error: ${result.error}`);
      }
    });

    return {
      passed,
      total,
      duration: totalDuration,
      results,
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MemoryTester();

  tester
    .runAllTests()
    .then((summary) => {
      console.log('\n🎯 Memory Optimization Tests Complete!');
      console.log(`Result: ${summary.passed}/${summary.total} tests passed`);
      process.exit(summary.passed === summary.total ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { MemoryTester, TEST_CONFIG };
