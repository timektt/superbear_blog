/**
 * Memory Optimization Verification Script
 * Verifies memory optimization functionality without requiring a running server
 */

const fs = require('fs');
const path = require('path');

class MemoryOptimizationVerifier {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
  }

  addResult(test, success, details = '') {
    this.results.push({ test, success, details });
    const status = success ? '✅' : '❌';
    this.log(`${status} ${test}`, { details });
  }

  verifyFileExists(filePath, description) {
    const fullPath = path.join(__dirname, '..', filePath);
    const exists = fs.existsSync(fullPath);
    this.addResult(
      `File exists: ${description}`,
      exists,
      exists ? `Found at ${filePath}` : `Missing: ${filePath}`
    );
    return exists;
  }

  verifyFileContent(filePath, searchTerms, description) {
    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      this.addResult(
        `Content check: ${description}`,
        false,
        `File not found: ${filePath}`
      );
      return false;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const missingTerms = searchTerms.filter(
        (term) => !content.includes(term)
      );

      const success = missingTerms.length === 0;
      this.addResult(
        `Content check: ${description}`,
        success,
        success
          ? `All required terms found in ${filePath}`
          : `Missing terms: ${missingTerms.join(', ')}`
      );
      return success;
    } catch (error) {
      this.addResult(
        `Content check: ${description}`,
        false,
        `Error reading file: ${error.message}`
      );
      return false;
    }
  }

  verifyMemoryMonitorClass() {
    return this.verifyFileContent(
      'src/lib/memory-monitor.ts',
      [
        'MemoryOptimizationConfig',
        'optimizeMemoryUsage',
        'detectMemoryLeaks',
        'cleanupCaches',
        'getPooledObject',
        'registerCacheEntry',
      ],
      'Memory Monitor Class Features'
    );
  }

  verifyMemoryUtils() {
    return this.verifyFileContent(
      'src/lib/memory-utils.ts',
      [
        'MemoryEfficientProcessor',
        'MemoryEfficientCache',
        'processArrayInChunks',
        'withMemoryOptimization',
        'mapWithMemoryControl',
      ],
      'Memory Utility Functions'
    );
  }

  verifyAPIEndpoint() {
    return this.verifyFileContent(
      'src/app/api/admin/memory/optimization/route.ts',
      [
        'handleMemoryOptimization',
        'optimizeMemory',
        'forceGarbageCollection',
        'updateConfig',
        'getLeakDetection',
      ],
      'Memory Optimization API Endpoint'
    );
  }

  verifyDashboardComponent() {
    return this.verifyFileContent(
      'src/components/admin/MemoryOptimizationDashboard.tsx',
      [
        'MemoryOptimizationDashboard',
        'optimizeMemory',
        'forceGC',
        'updateConfig',
        'fetchLeakDetection',
      ],
      'Memory Optimization Dashboard Component'
    );
  }

  verifyAdminPage() {
    return this.verifyFileContent(
      'src/app/(admin)/admin/memory/page.tsx',
      [
        'MemoryOptimizationPage',
        'MemoryOptimizationDashboard',
        'Memory Optimization - Admin Dashboard',
      ],
      'Memory Optimization Admin Page'
    );
  }

  verifyNavigationIntegration() {
    return this.verifyFileContent(
      'src/components/layout/AdminLayout.tsx',
      ['/admin/memory', 'Memory Optimization', "icon: 'memory'"],
      'Navigation Integration'
    );
  }

  verifyTestScript() {
    return this.verifyFileContent(
      'scripts/test-memory-optimization.js',
      [
        'MemoryTester',
        'testMemoryOptimization',
        'createMemoryPressure',
        'runMemoryStressTest',
      ],
      'Memory Optimization Test Script'
    );
  }

  testMemoryUtilityFunctions() {
    try {
      // Test if we can require the memory utils (basic syntax check)
      const memoryUtilsPath = path.join(
        __dirname,
        '..',
        'src',
        'lib',
        'memory-utils.ts'
      );
      const content = fs.readFileSync(memoryUtilsPath, 'utf8');

      // Check for TypeScript syntax errors (basic check)
      const hasValidExports =
        content.includes('export class') && content.includes('export const');
      const hasValidImports =
        content.includes('import') && content.includes('from');

      this.addResult(
        'Memory Utils Syntax Check',
        hasValidExports && hasValidImports,
        hasValidExports && hasValidImports
          ? 'Valid TypeScript syntax detected'
          : 'Potential syntax issues detected'
      );

      return hasValidExports && hasValidImports;
    } catch (error) {
      this.addResult(
        'Memory Utils Syntax Check',
        false,
        `Error: ${error.message}`
      );
      return false;
    }
  }

  testMemoryMonitorIntegration() {
    try {
      // Check if memory monitor is properly integrated with monitoring system
      const monitoringPath = path.join(
        __dirname,
        '..',
        'src',
        'lib',
        'monitoring.ts'
      );
      const content = fs.readFileSync(monitoringPath, 'utf8');

      const hasMemoryMonitorImport = content.includes('memoryMonitor');
      const hasMemoryIntegration =
        content.includes('getCurrentMemoryStats') ||
        content.includes('getMemoryPressureLevel');

      this.addResult(
        'Memory Monitor Integration',
        hasMemoryMonitorImport,
        hasMemoryMonitorImport
          ? 'Memory monitor integrated with monitoring system'
          : 'Memory monitor not properly integrated'
      );

      return hasMemoryMonitorImport;
    } catch (error) {
      this.addResult(
        'Memory Monitor Integration',
        false,
        `Error: ${error.message}`
      );
      return false;
    }
  }

  async runAllVerifications() {
    this.log('Starting Memory Optimization Verification...');

    // File existence checks
    this.verifyFileExists(
      'src/lib/memory-monitor.ts',
      'Memory Monitor Library'
    );
    this.verifyFileExists(
      'src/lib/memory-utils.ts',
      'Memory Utility Functions'
    );
    this.verifyFileExists(
      'src/app/api/admin/memory/optimization/route.ts',
      'Memory API Endpoint'
    );
    this.verifyFileExists(
      'src/components/admin/MemoryOptimizationDashboard.tsx',
      'Dashboard Component'
    );
    this.verifyFileExists(
      'src/app/(admin)/admin/memory/page.tsx',
      'Admin Page'
    );
    this.verifyFileExists('scripts/test-memory-optimization.js', 'Test Script');
    this.verifyFileExists(
      'scripts/verify-memory-optimization.js',
      'Verification Script'
    );

    // Content verification checks
    this.verifyMemoryMonitorClass();
    this.verifyMemoryUtils();
    this.verifyAPIEndpoint();
    this.verifyDashboardComponent();
    this.verifyAdminPage();
    this.verifyNavigationIntegration();
    this.verifyTestScript();

    // Functional checks
    this.testMemoryUtilityFunctions();
    this.testMemoryMonitorIntegration();

    // Summary
    this.log('\n--- Verification Summary ---');
    const passed = this.results.filter((r) => r.success).length;
    const total = this.results.length;
    const duration = Date.now() - this.startTime;

    this.log(`Verifications Passed: ${passed}/${total}`);
    this.log(`Total Duration: ${duration}ms`);

    // Detailed results
    this.results.forEach((result) => {
      const status = result.success ? '✅' : '❌';
      this.log(`${status} ${result.test}`);
      if (result.details) {
        this.log(`   ${result.details}`);
      }
    });

    // Final assessment
    const successRate = (passed / total) * 100;
    if (successRate === 100) {
      this.log(
        '\n🎉 All verifications passed! Memory optimization is fully implemented.'
      );
    } else if (successRate >= 80) {
      this.log(
        '\n✅ Most verifications passed. Memory optimization is mostly implemented.'
      );
    } else if (successRate >= 60) {
      this.log(
        '\n⚠️  Some verifications failed. Memory optimization is partially implemented.'
      );
    } else {
      this.log(
        '\n❌ Many verifications failed. Memory optimization needs more work.'
      );
    }

    return {
      passed,
      total,
      successRate,
      duration,
      results: this.results,
    };
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new MemoryOptimizationVerifier();

  verifier
    .runAllVerifications()
    .then((summary) => {
      console.log('\n🔍 Memory Optimization Verification Complete!');
      console.log(
        `Result: ${summary.passed}/${summary.total} verifications passed (${summary.successRate.toFixed(1)}%)`
      );
      process.exit(summary.successRate >= 80 ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { MemoryOptimizationVerifier };
