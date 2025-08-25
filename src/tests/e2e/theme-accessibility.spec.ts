import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Theme Switching and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock session for admin pages
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-user',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        }),
      });
    });
  });

  test('should toggle theme and persist preference', async ({ page }) => {
    await page.goto('/');

    // Check initial theme (should be light by default)
    const htmlElement = page.locator('html');
    const initialClass = await htmlElement.getAttribute('class');
    
    // Find and click theme toggle button
    const themeToggle = page.locator('[aria-label*="theme"]').first();
    await expect(themeToggle).toBeVisible();
    
    await themeToggle.click();

    // Check that theme changed to dark
    await expect(htmlElement).toHaveClass(/dark/);

    // Reload page and check that theme persisted
    await page.reload();
    await expect(htmlElement).toHaveClass(/dark/);

    // Toggle back to light
    await themeToggle.click();
    await expect(htmlElement).not.toHaveClass(/dark/);
  });

  test('should not have flash of unstyled content (FOUC)', async ({ page }) => {
    // Navigate to page and immediately check for theme class
    await page.goto('/');
    
    // Check that html element has theme class immediately
    const htmlElement = page.locator('html');
    const hasThemeClass = await htmlElement.evaluate((el) => {
      return el.classList.contains('light') || el.classList.contains('dark');
    });
    
    expect(hasThemeClass).toBe(true);
  });

  test('should respect system theme preference', async ({ page, context }) => {
    // Set system to prefer dark mode
    await context.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/');
    
    // Should default to dark theme
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check that navigation is keyboard accessible
    await page.keyboard.press('Tab');
    
    // First focusable element should be navigation
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check that navigation has proper ARIA labels
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Check that navigation links are accessible
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      expect(href).toBeTruthy();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test('should have accessible forms in admin area', async ({ page }) => {
    // Mock required data for article form
    await page.route('**/api/admin/authors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'author-1', name: 'Test Author' }]),
      });
    });

    await page.route('**/api/admin/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'cat-1', name: 'Technology' }]),
      });
    });

    await page.route('**/api/admin/tags', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'tag-1', name: 'React' }]),
      });
    });

    await page.goto('/admin/articles/new');

    // Check that form fields have proper labels
    const titleInput = page.locator('input[name="title"]');
    const titleLabel = page.locator('label[for="title"]');
    
    await expect(titleInput).toBeVisible();
    await expect(titleLabel).toBeVisible();
    
    // Check that required fields are marked as such
    const requiredFields = page.locator('input[required], select[required], textarea[required]');
    const requiredCount = await requiredFields.count();
    
    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);
      const ariaRequired = await field.getAttribute('aria-required');
      const required = await field.getAttribute('required');
      
      expect(ariaRequired === 'true' || required !== null).toBe(true);
    }
  });

  test('should pass axe accessibility audit on homepage', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass axe accessibility audit on admin pages', async ({ page }) => {
    // Mock admin data
    await page.route('**/api/admin/articles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'article-1', title: 'Test Article', status: 'DRAFT' }
        ]),
      });
    });

    await page.goto('/admin/articles');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check that page has h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check heading hierarchy (h1 -> h2 -> h3, etc.)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingLevels = await headings.evaluateAll((elements) => {
      return elements.map(el => parseInt(el.tagName.charAt(1)));
    });

    // First heading should be h1
    expect(headingLevels[0]).toBe(1);

    // Check that headings don't skip levels
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      
      // Current level should not be more than 1 level deeper than previous
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
    }
  });

  test('should have proper color contrast in both themes', async ({ page }) => {
    // Test light theme
    await page.goto('/');
    
    let accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const lightThemeContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(lightThemeContrastViolations).toEqual([]);

    // Switch to dark theme
    const themeToggle = page.locator('[aria-label*="theme"]').first();
    await themeToggle.click();

    // Test dark theme
    accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const darkThemeContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(darkThemeContrastViolations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = page.locator(':focus');
      const isVisible = await focusedElement.isVisible().catch(() => false);
      
      if (isVisible) {
        // Check that focused element has visible focus indicator
        const focusedElementHandle = await focusedElement.elementHandle();
        if (focusedElementHandle) {
          const styles = await focusedElementHandle.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              outline: computed.outline,
              outlineWidth: computed.outlineWidth,
              boxShadow: computed.boxShadow,
            };
          });

          // Should have some form of focus indicator
          const hasFocusIndicator = 
            styles.outline !== 'none' || 
            styles.outlineWidth !== '0px' || 
            styles.boxShadow !== 'none';

          expect(hasFocusIndicator).toBe(true);
        }
      }
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();

    // Check for banner/header landmark
    const header = page.locator('header, [role="banner"]');
    await expect(header).toBeVisible();

    // Check for contentinfo/footer landmark
    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer).toBeVisible();
  });
});