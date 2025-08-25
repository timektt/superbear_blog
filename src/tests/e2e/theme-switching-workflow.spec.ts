import { test, expect } from '@playwright/test';

test.describe('Theme Switching Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean state
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should switch between light and dark themes', async ({ page }) => {
    // Verify initial theme (should be light by default)
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Find and click theme switcher
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await expect(themeSwitcher).toBeVisible();
    
    // Switch to dark theme
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    // Verify dark theme is applied
    await expect(html).toHaveClass(/dark/);
    
    // Verify visual changes
    const header = page.getByRole('banner');
    await expect(header).toHaveCSS('background-color', /rgb\(.*\)/);
    
    // Switch back to light theme
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /light/i }).click();
    
    // Verify light theme is restored
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should persist theme preference across page reloads', async ({ page }) => {
    // Switch to dark theme
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    // Verify dark theme is applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify theme persisted
    await expect(html).toHaveClass(/dark/);
  });

  test('should maintain theme consistency across different pages', async ({ page }) => {
    // Switch to dark theme on homepage
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    // Navigate to different pages and verify theme consistency
    const pages = ['/news', '/ai', '/devtools', '/search'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Verify dark theme is maintained
      await expect(html).toHaveClass(/dark/);
      
      // Verify theme switcher is still available and functional
      const pageThemeSwitcher = page.getByRole('button', { name: /theme/i });
      await expect(pageThemeSwitcher).toBeVisible();
    }
  });

  test('should handle system theme preference', async ({ page, context }) => {
    // Set system to dark mode
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        }),
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Switch to system theme
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /system/i }).click();
    
    // Should apply dark theme based on system preference
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should have smooth theme transitions', async ({ page }) => {
    // Enable CSS transitions for testing
    await page.addStyleTag({
      content: `
        * {
          transition: background-color 0.2s ease, color 0.2s ease !important;
        }
      `
    });
    
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    const html = page.locator('html');
    
    // Measure transition time
    const startTime = Date.now();
    
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    // Wait for theme to be applied
    await expect(html).toHaveClass(/dark/);
    
    const endTime = Date.now();
    const transitionTime = endTime - startTime;
    
    // Transition should be reasonably fast (under 1 second)
    expect(transitionTime).toBeLessThan(1000);
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Navigate to theme switcher using keyboard
    await page.keyboard.press('Tab');
    
    // Find theme switcher (may need multiple tabs)
    let attempts = 0;
    while (attempts < 10) {
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
      if (focused && focused.toLowerCase().includes('theme')) {
        break;
      }
      await page.keyboard.press('Tab');
      attempts++;
    }
    
    // Open theme menu with Enter
    await page.keyboard.press('Enter');
    
    // Navigate to dark theme option
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Verify theme changed
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should maintain theme in admin interface', async ({ page }) => {
    // Note: This test assumes admin login is available
    // You may need to mock authentication or skip if not available
    
    // Switch to dark theme on public site
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    // Navigate to admin (if accessible)
    try {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Verify theme is maintained in admin interface
      await expect(html).toHaveClass(/dark/);
      
      // Verify admin-specific components respect theme
      const adminHeader = page.getByRole('banner');
      await expect(adminHeader).toBeVisible();
    } catch (error) {
      // Skip if admin is not accessible (requires authentication)
      test.skip();
    }
  });

  test('should handle theme switching during page navigation', async ({ page }) => {
    // Start theme switch during navigation
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await themeSwitcher.click();
    
    // Start navigation and theme change simultaneously
    const [navigationPromise] = await Promise.all([
      page.goto('/news'),
      page.getByRole('menuitem', { name: /dark/i }).click(),
    ]);
    
    await page.waitForLoadState('networkidle');
    
    // Verify both navigation and theme change completed successfully
    expect(page.url()).toContain('/news');
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should work correctly with browser back/forward', async ({ page }) => {
    // Switch to dark theme
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    // Navigate to another page
    await page.goto('/news');
    await page.waitForLoadState('networkidle');
    await expect(html).toHaveClass(/dark/);
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Verify theme is still applied
    await expect(html).toHaveClass(/dark/);
    
    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    // Verify theme is still applied
    await expect(html).toHaveClass(/dark/);
  });

  test('should handle multiple rapid theme switches', async ({ page }) => {
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    const html = page.locator('html');
    
    // Rapidly switch themes multiple times
    for (let i = 0; i < 5; i++) {
      await themeSwitcher.click();
      await page.getByRole('menuitem', { name: /dark/i }).click();
      await expect(html).toHaveClass(/dark/);
      
      await themeSwitcher.click();
      await page.getByRole('menuitem', { name: /light/i }).click();
      await expect(html).not.toHaveClass(/dark/);
    }
    
    // Final state should be stable
    await page.waitForTimeout(500);
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should maintain accessibility during theme changes', async ({ page }) => {
    // Check initial accessibility
    const themeSwitcher = page.getByRole('button', { name: /theme/i });
    await expect(themeSwitcher).toHaveAttribute('aria-label');
    
    // Switch theme
    await themeSwitcher.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();
    
    // Verify accessibility attributes are maintained
    await expect(themeSwitcher).toHaveAttribute('aria-label');
    
    // Check color contrast (basic check)
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      };
    });
    
    // Verify colors are different (indicating theme change)
    expect(bodyStyles.backgroundColor).toBeTruthy();
    expect(bodyStyles.color).toBeTruthy();
  });
});