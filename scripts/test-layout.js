#!/usr/bin/env node

/**
 * Simple test to verify Navbar and Footer are present on homepage
 */

const { chromium } = require('playwright');

async function testLayout() {
  console.log('🧪 Testing layout components...\n');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for navbar
    const navbar = await page.locator('[data-testid="navbar"]').first();
    const navbarVisible = await navbar.isVisible();
    console.log(`📍 Navbar present: ${navbarVisible ? '✅' : '❌'}`);
    
    // Check for footer
    const footer = await page.locator('[data-testid="footer"]').first();
    const footerVisible = await footer.isVisible();
    console.log(`📍 Footer present: ${footerVisible ? '✅' : '❌'}`);
    
    // Check theme toggle
    const themeToggle = await page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]').first();
    const themeToggleVisible = await themeToggle.isVisible();
    console.log(`🎨 Theme toggle present: ${themeToggleVisible ? '✅' : '❌'}`);
    
    // Test theme switching
    if (themeToggleVisible) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      console.log('🎨 Theme toggle clicked successfully ✅');
    }
    
    const allPassed = navbarVisible && footerVisible && themeToggleVisible;
    console.log(`\n🎯 Overall result: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    return allPassed;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testLayout().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testLayout };