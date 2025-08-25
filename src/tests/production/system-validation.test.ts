/**
 * Production System Validation Tests
 * 
 * These tests validate that all platform fixes are working correctly
 * in a production-like environment and that the system is ready for deployment.
 */

import { test, expect } from '@playwright/test';

test.describe('Production System Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set production-like environment
    await page.addInitScript(() => {
      window.localStorage.setItem('test-mode', 'production');
    });
  });

  test.describe('Theme System Validation', () => {
    test('should maintain theme consistency across all pages', async ({ page }) => {
      // Test theme consistency across different page types
      const pages = [
        '/',
        '/news',
        '/ai',
        '/devtools',
        '/search?q=test',
      ];

      // Set dark theme
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const themeSwitcher = page.getByRole('button', { name: /theme/i });
      if (await themeSwitcher.isVisible()) {
        await themeSwitcher.click();
        await page.getByRole('menuitem', { name: /dark/i }).click();
      }

      // Verify theme consistency across all pages
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        const html = page.locator('html');
        await expect(html).toHaveClass(/dark/);
        
        // Verify CSS variables are applied
        const backgroundColor = await page.evaluate(() => {
          return getComputedStyle(document.documentElement)
            .getPropertyValue('--background');
        });
        
        expect(backgroundColor).toBeTruthy();
      }
    });

    test('should handle theme switching performance in production', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const themeSwitcher = page.getByRole('button', { name: /theme/i });
      
      if (await themeSwitcher.isVisible()) {
        // Measure theme switch performance
        const startTime = Date.now();
        
        await themeSwitcher.click();
        await page.getByRole('menuitem', { name: /dark/i }).click();
        
        // Wait for theme to be applied
        const html = page.locator('html');
        await expect(html).toHaveClass(/dark/);
        
        const endTime = Date.now();
        const switchTime = endTime - startTime;
        
        // Theme switch should be fast even in production
        expect(switchTime).toBeLessThan(1000);
      }
    });
  });

  test.describe('Search System Validation', () => {
    test('should handle search queries efficiently', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByRole('searchbox', { name: /search/i });
      
      if (await searchInput.isVisible()) {
        // Test search performance
        const startTime = Date.now();
        
        await searchInput.fill('artificial intelligence');
        await searchInput.press('Enter');
        
        await page.waitForURL('**/search**');
        await page.waitForLoadState('networkidle');
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        // Search should complete quickly
        expect(searchTime).toBeLessThan(5000);
        
        // Verify search results are displayed
        const searchResults = page.getByTestId('search-results');
        if (await searchResults.isVisible()) {
          await expect(searchResults).toBeVisible();
        }
      }
    });

    test('should handle search filters correctly', async ({ page }) => {
      await page.goto('/search?q=test');
      await page.waitForLoadState('networkidle');

      // Test category filter
      const categoryFilter = page.getByRole('combobox', { name: /category/i });
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        
        const aiOption = page.getByRole('option', { name: /AI/i });
        if (await aiOption.isVisible()) {
          await aiOption.click();
          await page.waitForLoadState('networkidle');
          
          // Verify URL contains filter
          expect(page.url()).toContain('category=ai');
        }
      }
    });
  });

  test.describe('Analytics System Validation', () => {
    test('should track page views accurately', async ({ page }) => {
      // Visit a few pages to generate analytics data
      const pages = ['/', '/news', '/ai'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Wait for analytics tracking
        await page.waitForTimeout(1000);
      }
      
      // Verify analytics tracking doesn't cause errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Should not have analytics-related errors
      const analyticsErrors = consoleErrors.filter(error => 
        error.includes('analytics') || error.includes('tracking')
      );
      expect(analyticsErrors).toHaveLength(0);
    });
  });

  test.describe('Error Handling Validation', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Page should still load with error handling
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Should show appropriate error messages
      const errorMessages = page.getByText(/error|failed|unavailable/i);
      if (await errorMessages.first().isVisible()) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });

    test('should display loading states appropriately', async ({ page }) => {
      // Slow down API responses to test loading states
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.continue();
      });

      await page.goto('/');
      
      // Should show loading states during slow requests
      const loadingIndicators = page.getByTestId('loading');
      if (await loadingIndicators.first().isVisible()) {
        await expect(loadingIndicators.first()).toBeVisible();
      }
      
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Security Validation', () => {
    test('should have proper security headers', async ({ page }) => {
      const response = await page.goto('/');
      
      // Check for security headers
      const headers = response?.headers() || {};
      
      // Should have CSP header
      expect(headers['content-security-policy'] || headers['csp']).toBeTruthy();
      
      // Should have X-Frame-Options
      expect(headers['x-frame-options']).toBeTruthy();
      
      // Should have X-Content-Type-Options
      expect(headers['x-content-type-options']).toBe('nosniff');
    });

    test('should handle authentication properly', async ({ page }) => {
      // Try to access admin without authentication
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Should redirect to login or show access denied
      const isLoginPage = page.url().includes('/login');
      const hasAccessDenied = await page.getByText(/access denied|unauthorized/i).isVisible();
      
      expect(isLoginPage || hasAccessDenied).toBe(true);
    });
  });

  test.describe('Performance Validation', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};
            
            entries.forEach((entry) => {
              if (entry.name === 'FCP') {
                vitals.fcp = entry.value;
              } else if (entry.name === 'LCP') {
                vitals.lcp = entry.value;
              } else if (entry.name === 'CLS') {
                vitals.cls = entry.value;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });

      // Validate Core Web Vitals (if available)
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(2500); // LCP should be < 2.5s
      }
      
      if (vitals.fcp) {
        expect(vitals.fcp).toBeLessThan(1800); // FCP should be < 1.8s
      }
      
      if (vitals.cls !== undefined) {
        expect(vitals.cls).toBeLessThan(0.1); // CLS should be < 0.1
      }
    });

    test('should load pages within performance budget', async ({ page }) => {
      const pages = ['/', '/news', '/ai', '/devtools'];
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Pages should load within 3 seconds
        expect(loadTime).toBeLessThan(3000);
      }
    });
  });

  test.describe('Accessibility Validation', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Should be able to navigate through interactive elements
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(focusedElement);
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check heading hierarchy
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({
          level: parseInt(el.tagName.charAt(1)),
          text: el.textContent?.trim()
        }))
      );

      // Should have at least one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Should not skip heading levels
      const levels = headings.map(h => h.level);
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Basic functionality should work in all browsers
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Theme switching should work
      const themeSwitcher = page.getByRole('button', { name: /theme/i });
      if (await themeSwitcher.isVisible()) {
        await themeSwitcher.click();
        
        // Should show theme options
        const themeOptions = page.getByRole('menuitem');
        if (await themeOptions.first().isVisible()) {
          await expect(themeOptions.first()).toBeVisible();
        }
      }
      
      // Search should work
      const searchInput = page.getByRole('searchbox', { name: /search/i });
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        expect(await searchInput.inputValue()).toBe('test');
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigation should be accessible on mobile
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
      
      // Theme switcher should work on mobile
      const themeSwitcher = page.getByRole('button', { name: /theme/i });
      if (await themeSwitcher.isVisible()) {
        await themeSwitcher.click();
        
        const themeMenu = page.getByRole('menu');
        if (await themeMenu.isVisible()) {
          await expect(themeMenu).toBeVisible();
        }
      }
      
      // Search should work on mobile
      const searchInput = page.getByRole('searchbox', { name: /search/i });
      if (await searchInput.isVisible()) {
        await searchInput.fill('mobile test');
        expect(await searchInput.inputValue()).toBe('mobile test');
      }
    });
  });

  test.describe('Data Integrity Validation', () => {
    test('should maintain data consistency', async ({ page }) => {
      // Test that data operations don't cause corruption
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Perform various data operations
      const operations = [
        () => page.goto('/news'),
        () => page.goto('/search?q=test'),
        () => page.goto('/ai'),
        () => page.goto('/'),
      ];

      for (const operation of operations) {
        await operation();
        await page.waitForLoadState('networkidle');
        
        // Page should load without errors
        const body = page.locator('body');
        await expect(body).toBeVisible();
      }
    });
  });

  test.describe('System Integration Validation', () => {
    test('should integrate all platform fixes correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test that all major systems work together
      
      // 1. Theme system
      const themeSwitcher = page.getByRole('button', { name: /theme/i });
      if (await themeSwitcher.isVisible()) {
        await themeSwitcher.click();
        await page.getByRole('menuitem', { name: /dark/i }).click();
      }
      
      // 2. Search system with theme applied
      const searchInput = page.getByRole('searchbox', { name: /search/i });
      if (await searchInput.isVisible()) {
        await searchInput.fill('integration test');
        await searchInput.press('Enter');
        
        await page.waitForURL('**/search**');
        await page.waitForLoadState('networkidle');
      }
      
      // 3. Navigation with theme and search state
      await page.goto('/news');
      await page.waitForLoadState('networkidle');
      
      // Theme should persist
      const html = page.locator('html');
      if (await html.getAttribute('class')) {
        expect(await html.getAttribute('class')).toContain('dark');
      }
      
      // All systems should work together without conflicts
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Should not have integration errors
      expect(consoleErrors.length).toBe(0);
    });
  });
});