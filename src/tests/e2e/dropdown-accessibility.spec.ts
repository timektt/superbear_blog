import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dropdown Menu Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('dropdown panel has proper contrast and visibility', async ({ page }) => {
    // Open the More dropdown
    const moreButton = page.getByRole('button', { name: /more/i });
    await expect(moreButton).toBeVisible();
    await moreButton.click();

    // Wait for dropdown to appear
    const dropdown = page.getByRole('menu');
    await expect(dropdown).toBeVisible();

    // Check that dropdown has opaque background
    const dropdownBg = await dropdown.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        opacity: styles.opacity,
      };
    });

    // Should have a solid background color (not transparent)
    expect(dropdownBg.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(dropdownBg.backgroundColor).not.toBe('transparent');
    expect(dropdownBg.opacity).toBe('1');
  });

  test('dropdown menu items are readable in both themes', async ({ page }) => {
    // Test in light mode
    const moreButton = page.getByRole('button', { name: /more/i });
    await moreButton.click();

    const dropdown = page.getByRole('menu');
    await expect(dropdown).toBeVisible();

    const menuItem = page.getByRole('menuitem').first();
    await expect(menuItem).toBeVisible();

    // Get text color in light mode
    const lightTextColor = await menuItem.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Close dropdown
    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();

    // Toggle to dark mode
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Open dropdown again
    await moreButton.click();
    await expect(dropdown).toBeVisible();

    // Get text color in dark mode
    const darkTextColor = await menuItem.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Colors should be different between themes
    expect(lightTextColor).not.toBe(darkTextColor);
  });

  test('dropdown has proper z-index and appears above content', async ({ page }) => {
    const moreButton = page.getByRole('button', { name: /more/i });
    await moreButton.click();

    const dropdown = page.getByRole('menu');
    await expect(dropdown).toBeVisible();

    // Check z-index
    const zIndex = await dropdown.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Should have high z-index (50 or higher)
    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(50);
  });

  test('dropdown meets accessibility standards', async ({ page }) => {
    const moreButton = page.getByRole('button', { name: /more/i });
    await moreButton.click();

    const dropdown = page.getByRole('menu');
    await expect(dropdown).toBeVisible();

    // Run accessibility scan on the dropdown
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="menu"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dropdown keyboard navigation works correctly', async ({ page }) => {
    const moreButton = page.getByRole('button', { name: /more/i });
    
    // Focus the More button
    await moreButton.focus();
    await expect(moreButton).toBeFocused();

    // Open dropdown with Enter key
    await page.keyboard.press('Enter');
    
    const dropdown = page.getByRole('menu');
    await expect(dropdown).toBeVisible();

    // First menu item should be focusable
    const firstMenuItem = page.getByRole('menuitem').first();
    await expect(firstMenuItem).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();

    // Focus should return to More button
    await expect(moreButton).toBeFocused();
  });

  test('dropdown closes when clicking outside', async ({ page }) => {
    const moreButton = page.getByRole('button', { name: /more/i });
    await moreButton.click();

    const dropdown = page.getByRole('menu');
    await expect(dropdown).toBeVisible();

    // Click outside the dropdown
    await page.click('body', { position: { x: 10, y: 10 } });

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test('dropdown has proper ARIA attributes', async ({ page }) => {
    const moreButton = page.getByRole('button', { name: /more/i });
    
    // Check initial ARIA attributes
    await expect(moreButton).toHaveAttribute('aria-expanded', 'false');
    await expect(moreButton).toHaveAttribute('aria-haspopup', 'true');

    // Open dropdown
    await moreButton.click();

    // Check updated ARIA attributes
    await expect(moreButton).toHaveAttribute('aria-expanded', 'true');

    const dropdown = page.getByRole('menu');
    await expect(dropdown).toHaveAttribute('role', 'menu');
    await expect(dropdown).toHaveAttribute('aria-orientation', 'vertical');
  });

  test('dropdown menu items have proper roles', async ({ page }) => {
    const moreButton = page.getByRole('button', { name: /more/i });
    await moreButton.click();

    const dropdown = page.getByRole('menu');
    await expect(dropdown).toBeVisible();

    // Check that menu items have proper role
    const menuItems = page.getByRole('menuitem');
    const itemCount = await menuItems.count();
    
    expect(itemCount).toBeGreaterThan(0);

    // Each menu item should have the menuitem role
    for (let i = 0; i < itemCount; i++) {
      const item = menuItems.nth(i);
      await expect(item).toHaveAttribute('role', 'menuitem');
    }
  });
});