/**
 * Smoke test to ensure homepage renders without being blank
 * This prevents regression of the theme provider visibility issue
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Rendering', () => {
  test('homepage should render content immediately', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the main heading is visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('SuperBear Blog');
    
    // Ensure the page is not blank by checking for key content
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    
    // Verify no infinite redirects (status should be 200)
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('homepage should not have theme loading class after mount', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to hydrate
    await page.waitForTimeout(500);
    
    // Check that theme-loading class is not present on the body or html
    const themeLoadingElements = page.locator('.theme-loading');
    await expect(themeLoadingElements).toHaveCount(0);
  });
});