#!/usr/bin/env node

/**
 * Visual Regression Check Script
 * 
 * This script helps verify that magazine layout components maintain their
 * visual appearance after updates. It provides a structured approach to
 * manual visual testing when automated tests can't run due to build issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Visual Regression Testing Helper');
console.log('=====================================\n');

// Check if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Component file paths to verify
const componentPaths = [
  'src/components/sections/TopHeader.tsx',
  'src/components/sections/HeroMosaic.tsx', 
  'src/components/sections/LatestNewsRail.tsx'
];

// Check if component files exist and have required features
function checkComponentFiles() {
  console.log('📁 Checking component files...\n');
  
  let allGood = true;
  
  componentPaths.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${filePath} - File not found`);
      allGood = false;
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for required features
    const checks = {
      'Loading state': content.includes('loading') && content.includes('useState'),
      'Test ID': content.includes('data-testid'),
      'Accessibility': content.includes('aria-') || content.includes('role='),
      'Next.js Image': content.includes('next/image') || content.includes('Image'),
      'Responsive classes': content.includes('md:') || content.includes('lg:')
    };
    
    console.log(`📄 ${path.basename(filePath)}:`);
    Object.entries(checks).forEach(([feature, hasFeature]) => {
      console.log(`  ${hasFeature ? '✅' : '❌'} ${feature}`);
      if (!hasFeature) allGood = false;
    });
    console.log('');
  });
  
  return allGood;
}

// Generate testing instructions
function generateTestingInstructions() {
  console.log('📋 Visual Testing Instructions');
  console.log('==============================\n');
  
  console.log('1. Start the development server:');
  console.log('   npm run dev\n');
  
  console.log('2. Open your browser to: http://localhost:3000\n');
  
  console.log('3. Test the following components:\n');
  
  const testScenarios = [
    {
      component: 'TopHeader',
      tests: [
        'Refresh page to see loading skeleton (red gradient)',
        'Verify loaded state has proper styling',
        'Test responsive behavior on mobile/tablet/desktop',
        'Check CTA button hover effects'
      ]
    },
    {
      component: 'HeroMosaic', 
      tests: [
        'Observe loading skeletons for both panels',
        'Verify responsive layout changes at breakpoints',
        'Check newsletter panel and featured articles alignment',
        'Test image loading and optimization'
      ]
    },
    {
      component: 'LatestNewsRail',
      tests: [
        'See skeleton cards during loading',
        'Test horizontal scrolling functionality', 
        'Verify navigation buttons work correctly',
        'Check article card hover and focus states',
        'Test touch/swipe on mobile devices'
      ]
    }
  ];
  
  testScenarios.forEach(scenario => {
    console.log(`🔍 ${scenario.component}:`);
    scenario.tests.forEach(test => {
      console.log(`   • ${test}`);
    });
    console.log('');
  });
  
  console.log('4. Use the detailed checklist in VISUAL_REGRESSION_CHECKLIST.md\n');
  
  console.log('5. Test in multiple browsers:');
  console.log('   • Chrome (latest)');
  console.log('   • Firefox (latest)');
  console.log('   • Safari/Edge (latest)\n');
}

// Main execution
async function main() {
  // Check component files
  const filesOk = checkComponentFiles();
  
  if (!filesOk) {
    console.log('⚠️  Some component files are missing required features.');
    console.log('   Please review the components before testing.\n');
  }
  
  // Check if dev server is running
  console.log('🌐 Checking development server...');
  const serverRunning = await checkDevServer();
  
  if (serverRunning) {
    console.log('✅ Development server is running at http://localhost:3000\n');
  } else {
    console.log('❌ Development server is not running');
    console.log('   Please start it with: npm run dev\n');
  }
  
  // Generate instructions
  generateTestingInstructions();
  
  // Final recommendations
  console.log('💡 Recommendations:');
  console.log('==================\n');
  
  if (!serverRunning) {
    console.log('• Start the development server first');
  }
  
  if (!filesOk) {
    console.log('• Review component implementations for missing features');
  }
  
  console.log('• Use browser DevTools to test different viewport sizes');
  console.log('• Check Network tab to verify image optimization');
  console.log('• Use Lighthouse to verify performance metrics');
  console.log('• Test with screen reader for accessibility verification');
  console.log('• Document any visual differences found\n');
  
  console.log('📝 Use VISUAL_REGRESSION_CHECKLIST.md for systematic testing');
  console.log('🎯 Focus on loading states, responsive design, and accessibility');
  
  // Exit with appropriate code
  process.exit(filesOk && serverRunning ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

// Run the script
main().catch(console.error);