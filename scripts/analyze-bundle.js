#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Runs Next.js build with bundle analyzer and opens results
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 Starting bundle analysis...\n');

// Clean previous analysis
const analyzeDir = path.join(process.cwd(), 'analyze');
if (fs.existsSync(analyzeDir)) {
  fs.rmSync(analyzeDir, { recursive: true, force: true });
  console.log('🧹 Cleaned previous analysis results');
}

// Set environment variable for bundle analyzer
process.env.ANALYZE = 'true';

// Run build with analyzer
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ANALYZE: 'true' }
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Bundle analysis complete!');
    console.log('📊 Check the analyze/ directory for detailed reports');
    
    // List generated files
    if (fs.existsSync(analyzeDir)) {
      const files = fs.readdirSync(analyzeDir);
      console.log('\nGenerated files:');
      files.forEach(file => {
        console.log(`  - analyze/${file}`);
      });
    }
  } else {
    console.error('\n❌ Bundle analysis failed');
    process.exit(code);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Failed to start build process:', error);
  process.exit(1);
});