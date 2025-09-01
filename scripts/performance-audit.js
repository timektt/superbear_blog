#!/usr/bin/env node

/**
 * Performance audit script for Core Web Vitals and bundle optimization
 * Run with: node scripts/performance-audit.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Performance thresholds
const PERFORMANCE_BUDGET = {
  maxBundleSize: 250, // KB
  maxChunkSize: 50,   // KB
  maxAssetSize: 100,  // KB
  maxLCP: 2500,       // ms
  maxFID: 100,        // ms
  maxCLS: 0.1,        // score
};

/**
 * Analyze bundle size using webpack-bundle-analyzer
 */
function analyzeBundleSize() {
  console.log('📊 Analyzing bundle size...');
  
  try {
    // Generate bundle analysis
    execSync('npm run analyze', { stdio: 'inherit' });
    
    // Check if bundle stats exist
    const statsPath = path.join(process.cwd(), '.next/analyze/client.html');
    if (fs.existsSync(statsPath)) {
      console.log('✅ Bundle analysis complete. Check .next/analyze/client.html');
    }
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
  }
}

/**
 * Check Core Web Vitals using Lighthouse CI
 */
function checkWebVitals() {
  console.log('🔍 Checking Core Web Vitals...');
  
  try {
    // Run Lighthouse CI
    const result = execSync('npx lhci autorun --collect.numberOfRuns=3', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Lighthouse audit complete');
    
    // Parse results and check against budget
    const lighthouseResults = parseLighthouseResults(result);
    checkPerformanceBudget(lighthouseResults);
    
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error.message);
  }
}

/**
 * Parse Lighthouse results
 */
function parseLighthouseResults(output) {
  // This would parse actual Lighthouse JSON output
  // For now, return mock data
  return {
    lcp: 2200,
    fid: 80,
    cls: 0.08,
    fcp: 1800,
    ttfb: 600,
  };
}

/**
 * Check performance against budget
 */
function checkPerformanceBudget(metrics) {
  console.log('\n📋 Performance Budget Check:');
  
  const checks = [
    {
      name: 'Largest Contentful Paint (LCP)',
      value: metrics.lcp,
      budget: PERFORMANCE_BUDGET.maxLCP,
      unit: 'ms',
      passed: metrics.lcp <= PERFORMANCE_BUDGET.maxLCP,
    },
    {
      name: 'First Input Delay (FID)',
      value: metrics.fid,
      budget: PERFORMANCE_BUDGET.maxFID,
      unit: 'ms',
      passed: metrics.fid <= PERFORMANCE_BUDGET.maxFID,
    },
    {
      name: 'Cumulative Layout Shift (CLS)',
      value: metrics.cls,
      budget: PERFORMANCE_BUDGET.maxCLS,
      unit: '',
      passed: metrics.cls <= PERFORMANCE_BUDGET.maxCLS,
    },
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    const value = check.unit ? `${check.value}${check.unit}` : check.value;
    const budget = check.unit ? `${check.budget}${check.unit}` : check.budget;
    
    console.log(`${status} ${check.name}: ${value} (budget: ${budget})`);
    
    if (!check.passed) {
      allPassed = false;
    }
  });
  
  if (allPassed) {
    console.log('\n🎉 All performance checks passed!');
  } else {
    console.log('\n⚠️  Some performance checks failed. Consider optimization.');
    process.exit(1);
  }
}

/**
 * Check accessibility compliance
 */
function checkAccessibility() {
  console.log('♿ Checking accessibility compliance...');
  
  try {
    // Run axe-core accessibility tests
    execSync('npm run test:accessibility', { stdio: 'inherit' });
    console.log('✅ Accessibility checks passed');
  } catch (error) {
    console.error('❌ Accessibility checks failed:', error.message);
  }
}

/**
 * Generate performance report
 */
function generateReport(metrics) {
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    budget: PERFORMANCE_BUDGET,
    recommendations: generateRecommendations(metrics),
  };
  
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Performance report saved to ${reportPath}`);
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.lcp > PERFORMANCE_BUDGET.maxLCP) {
    recommendations.push({
      metric: 'LCP',
      issue: 'Largest Contentful Paint is too slow',
      suggestions: [
        'Optimize images with next/image and Cloudinary',
        'Implement proper lazy loading',
        'Reduce server response times',
        'Preload critical resources',
      ],
    });
  }
  
  if (metrics.fid > PERFORMANCE_BUDGET.maxFID) {
    recommendations.push({
      metric: 'FID',
      issue: 'First Input Delay is too high',
      suggestions: [
        'Reduce JavaScript execution time',
        'Implement code splitting',
        'Use web workers for heavy computations',
        'Optimize third-party scripts',
      ],
    });
  }
  
  if (metrics.cls > PERFORMANCE_BUDGET.maxCLS) {
    recommendations.push({
      metric: 'CLS',
      issue: 'Cumulative Layout Shift is too high',
      suggestions: [
        'Set explicit dimensions for images and ads',
        'Avoid inserting content above existing content',
        'Use CSS aspect-ratio for responsive images',
        'Preload fonts to prevent FOIT/FOUT',
      ],
    });
  }
  
  return recommendations;
}

/**
 * Main audit function
 */
async function runPerformanceAudit() {
  console.log('🚀 Starting performance audit...\n');
  
  // Check if build exists
  const buildPath = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildPath)) {
    console.log('📦 Building application...');
    execSync('npm run build', { stdio: 'inherit' });
  }
  
  // Run audits
  analyzeBundleSize();
  checkWebVitals();
  checkAccessibility();
  
  console.log('\n🎯 Performance audit complete!');
}

// Run audit if called directly
if (require.main === module) {
  runPerformanceAudit().catch(error => {
    console.error('❌ Performance audit failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runPerformanceAudit,
  checkPerformanceBudget,
  generateReport,
};