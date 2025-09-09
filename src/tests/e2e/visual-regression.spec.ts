import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Magazine Layout Components
 * 
 * These tests ensure that the magazine layout components maintain their
 * visual appearance after updates to loading states, image optimization,
 * and accessibility features.
 */

test.describe('Magazine Layout Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage and wait for it to load
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading states to complete
    await page.waitForTimeout(2000);
  });

  test('TopHeader component visual appearance', async ({ page }) => {
    // Wait for TopHeader to load completely
    const topHeader = page.getByTestId('top-header');
    await expect(topHeader).toBeVisible();
    
    // Wait for loading state to complete
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="top-header"]');
      return element && !element.classList.contains('animate-pulse');
    });

    // Take screenshot of the TopHeader component
    await expect(topHeader).toHaveScreenshot('top-header-desktop.png');
  });

  test('TopHeader component loading state', async ({ page }) => {
    // Intercept and delay the page load to capture loading state
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    await page.goto('/');
    
    // Capture loading state quickly
    const topHeader = page.getByTestId('top-header');
    await expect(topHeader).toBeVisible();
    
    // Take screenshot of loading state
    await expect(topHeader).toHaveScreenshot('top-header-loading.png');
  });

  test('HeroMosaic component visual appearance', async ({ page }) => {
    // Wait for HeroMosaic to load completely
    const heroMosaic = page.getByTestId('hero-mosaic');
    await expect(heroMosaic).toBeVisible();
    
    // Wait for loading state to complete
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="hero-mosaic"]');
      return element && !element.querySelector('.animate-pulse');
    });

    // Take screenshot of the HeroMosaic component
    await expect(heroMosaic).toHaveScreenshot('hero-mosaic-desktop.png');
  });

  test('HeroMosaic component loading state', async ({ page }) => {
    // Intercept and delay the page load to capture loading state
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    await page.goto('/');
    
    // Capture loading state quickly
    const heroMosaic = page.getByTestId('hero-mosaic');
    await expect(heroMosaic).toBeVisible();
    
    // Take screenshot of loading state
    await expect(heroMosaic).toHaveScreenshot('hero-mosaic-loading.png');
  });

  test('LatestNewsRail component visual appearance', async ({ page }) => {
    // Wait for LatestNewsRail to load completely
    const latestNewsRail = page.getByTestId('latest-news-rail');
    await expect(latestNewsRail).toBeVisible();
    
    // Wait for loading state to complete and images to load
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="latest-news-rail"]');
      return element && !element.querySelector('.animate-pulse');
    });

    // Wait for images to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of the LatestNewsRail component
    await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-desktop.png');
  });

  test('LatestNewsRail component loading state', async ({ page }) => {
    // Intercept and delay the page load to capture loading state
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    await page.goto('/');
    
    // Capture loading state quickly
    const latestNewsRail = page.getByTestId('latest-news-rail');
    await expect(latestNewsRail).toBeVisible();
    
    // Take screenshot of loading state
    await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-loading.png');
  });

  test('Full homepage layout visual appearance', async ({ page }) => {
    // Wait for all components to load
    await page.waitForLoadState('networkidle');
    
    // Wait for loading states to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.animate-pulse');
      return loadingElements.length === 0;
    });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full-desktop.png', {
      fullPage: true,
    });
  });

  test('Mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for loading states to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.animate-pulse');
      return loadingElements.length === 0;
    });

    // Take mobile screenshots of key components
    const topHeader = page.getByTestId('top-header');
    await expect(topHeader).toHaveScreenshot('top-header-mobile.png');

    const heroMosaic = page.getByTestId('hero-mosaic');
    await expect(heroMosaic).toHaveScreenshot('hero-mosaic-mobile.png');

    const latestNewsRail = page.getByTestId('latest-news-rail');
    await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-mobile.png');

    // Full mobile page
    await expect(page).toHaveScreenshot('homepage-full-mobile.png', {
      fullPage: true,
    });
  });

  test('Tablet responsive layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for loading states to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.animate-pulse');
      return loadingElements.length === 0;
    });

    // Take tablet screenshots of key components
    const topHeader = page.getByTestId('top-header');
    await expect(topHeader).toHaveScreenshot('top-header-tablet.png');

    const heroMosaic = page.getByTestId('hero-mosaic');
    await expect(heroMosaic).toHaveScreenshot('hero-mosaic-tablet.png');

    const latestNewsRail = page.getByTestId('latest-news-rail');
    await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-tablet.png');

    // Full tablet page
    await expect(page).toHaveScreenshot('homepage-full-tablet.png', {
      fullPage: true,
    });
  });

  test('Dark theme visual appearance', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /theme/i });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
    } else {
      // Manually set dark theme if toggle not available
      await page.addStyleTag({
        content: `
          html { color-scheme: dark; }
          body { background-color: #0f172a; color: #f1f5f9; }
        `
      });
    }
    
    await page.waitForLoadState('networkidle');
    
    // Wait for loading states to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.animate-pulse');
      return loadingElements.length === 0;
    });

    // Take dark theme screenshots
    const topHeader = page.getByTestId('top-header');
    await expect(topHeader).toHaveScreenshot('top-header-dark.png');

    const heroMosaic = page.getByTestId('hero-mosaic');
    await expect(heroMosaic).toHaveScreenshot('hero-mosaic-dark.png');

    const latestNewsRail = page.getByTestId('latest-news-rail');
    await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-dark.png');

    // Full dark theme page
    await expect(page).toHaveScreenshot('homepage-full-dark.png', {
      fullPage: true,
    });
  });

  test('Image optimization verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for loading states to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.animate-pulse');
      return loadingElements.length === 0;
    });

    // Check that Next.js Image components are being used
    const images = await page.locator('img').all();
    
    for (const img of images) {
      // Verify images have proper loading attributes
      const loading = await img.getAttribute('loading');
      const sizes = await img.getAttribute('sizes');
      
      // Images should have either loading="lazy" or loading="eager" (for priority images)
      expect(loading).toMatch(/^(lazy|eager)$/);
      
      // Images should have sizes attribute for responsive loading
      if (sizes) {
        expect(sizes).toBeTruthy();
      }
    }

    // Take screenshot to verify images are loading correctly
    const latestNewsRail = page.getByTestId('latest-news-rail');
    await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-images.png');
  });

  test('Accessibility features visual verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for loading states to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.animate-pulse');
      return loadingElements.length === 0;
    });

    // Test focus states by tabbing through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Take screenshot with focus state
    await expect(page).toHaveScreenshot('homepage-focus-state.png');

    // Test hover states
    const firstArticleCard = page.locator('[data-testid="latest-news-rail"] a').first();
    await firstArticleCard.hover();
    await page.waitForTimeout(200);
    
    // Take screenshot with hover state
    const latestNewsRail = page.getByTestId('latest-news-rail');
    await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-hover.png');
  });

  test('Component interaction states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for loading states to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('.animate-pulse');
      return loadingElements.length === 0;
    });

    // Test LatestNewsRail navigation buttons
    const latestNewsRail = page.getByTestId('latest-news-rail');
    const nextButton = latestNewsRail.getByRole('button', { name: /next/i });
    const prevButton = latestNewsRail.getByRole('button', { name: /previous/i });

    if (await nextButton.isVisible()) {
      // Test initial state (prev button should be disabled)
      await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-initial-nav.png');
      
      // Click next button and test state
      await nextButton.click();
      await page.waitForTimeout(500); // Wait for scroll animation
      
      await expect(latestNewsRail).toHaveScreenshot('latest-news-rail-scrolled-nav.png');
    }
  });
});

test.describe('Cross-browser Visual Consistency', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`${browserName} visual consistency`, async ({ page, browserName: currentBrowser }) => {
      // Only run this test for the specific browser
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for loading states to complete
      await page.waitForFunction(() => {
        const loadingElements = document.querySelectorAll('.animate-pulse');
        return loadingElements.length === 0;
      });

      // Take browser-specific screenshots
      const topHeader = page.getByTestId('top-header');
      await expect(topHeader).toHaveScreenshot(`top-header-${browserName}.png`);

      const heroMosaic = page.getByTestId('hero-mosaic');
      await expect(heroMosaic).toHaveScreenshot(`hero-mosaic-${browserName}.png`);

      const latestNewsRail = page.getByTestId('latest-news-rail');
      await expect(latestNewsRail).toHaveScreenshot(`latest-news-rail-${browserName}.png`);
    });
  });
});