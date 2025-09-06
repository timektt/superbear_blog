/**
 * Smoke test to verify that the Cross-Browser Tests overlay is not present on the home page
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Overlay Absence', () => {
  test('should not show Cross-Browser Tests overlay on home page', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Assert that the overlay text is NOT present
    await expect(page.locator('text=Cross-Browser Tests')).not.toBeVisible();
    await expect(page.locator('text=Run Tests')).not.toBeVisible();
    
    // Verify that a known interactive element is clickable
    // Check if the main navigation or any interactive element exists and is clickable
    const interactiveElements = [
      'nav', // Navigation
      'button', // Any buttons
      'a[href]', // Links
      'input', // Form inputs
    ];
    
    let foundInteractiveElement = false;
    for (const selector of interactiveElements) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
        foundInteractiveElement = true;
        break;
      }
    }
    
    expect(foundInteractiveElement).toBe(true);
  });

  test('should not have fixed bottom-right overlay blocking interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that there's no fixed positioned element in the bottom-right corner
    // that could block interactions
    const fixedElements = await page.locator('[class*="fixed"][class*="bottom"][class*="right"]').all();
    
    for (const element of fixedElements) {
      const text = await element.textContent();
      // If there are fixed elements, they should not contain the overlay text
      expect(text).not.toContain('Cross-Browser Tests');
      expect(text).not.toContain('Run Tests');
    }
  });
});