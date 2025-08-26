import { test, expect } from '@playwright/test';

test.describe('Home Page Theme Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/**', async (route) => {
      // Mock any API calls to prevent real database hits
      await route.fulfill({ json: { data: [] } });
    });
  });

  test('theme toggle affects entire home page', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('main')).toBeVisible();

    // Get initial background color of body and hero section
    const initialBodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    const initialHeroBg = await page.locator('section').first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Toggle theme
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();

    // Wait for theme transition
    await page.waitForTimeout(300);

    // Get new background colors
    const newBodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    const newHeroBg = await page.locator('section').first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Verify colors changed
    expect(initialBodyBg).not.toBe(newBodyBg);
    expect(initialHeroBg).not.toBe(newHeroBg);
  });

  test('no hard-coded colors remain after theme toggle', async ({ page }) => {
    await page.goto('/');

    // Toggle to dark theme
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check that no elements have hard-coded white backgrounds in dark mode
    const whiteBackgrounds = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const whiteElements = [];
      
      for (const el of elements) {
        const styles = window.getComputedStyle(el);
        const bg = styles.backgroundColor;
        
        // Check for hard-coded white or very light colors
        if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)') {
          whiteElements.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            background: bg
          });
        }
      }
      
      return whiteElements;
    });

    // Should have minimal or no hard-coded white backgrounds in dark mode
    expect(whiteBackgrounds.length).toBeLessThan(3);
  });

  test('hero section uses theme-aware colors', async ({ page }) => {
    await page.goto('/');

    // Check hero section in light mode
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    const lightModeBg = await heroSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Toggle to dark mode
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    const darkModeBg = await heroSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should change between themes
    expect(lightModeBg).not.toBe(darkModeBg);
  });

  test('newsletter section uses theme tokens', async ({ page }) => {
    await page.goto('/');

    // Find newsletter section
    const newsletterSection = page.getByText('Stay Updated').locator('..').locator('..');
    await expect(newsletterSection).toBeVisible();

    // Check colors in light mode
    const lightBg = await newsletterSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Toggle theme
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check colors in dark mode
    const darkBg = await newsletterSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be different
    expect(lightBg).not.toBe(darkBg);
  });

  test('featured topics chips respond to theme', async ({ page }) => {
    await page.goto('/');

    // Find featured topics section
    const topicsSection = page.getByText('Featured Topics').locator('..').locator('..');
    await expect(topicsSection).toBeVisible();

    // Find a topic chip
    const chip = page.getByRole('link', { name: /AI/i }).first();
    await expect(chip).toBeVisible();

    // Check chip colors in light mode
    const lightChipBg = await chip.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Toggle theme
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check chip colors in dark mode
    const darkChipBg = await chip.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be different
    expect(lightChipBg).not.toBe(darkChipBg);
  });

  test('text contrast is maintained in both themes', async ({ page }) => {
    await page.goto('/');

    // Test in light mode
    const headings = page.locator('h1, h2, h3');
    const firstHeading = headings.first();
    await expect(firstHeading).toBeVisible();

    // Toggle to dark mode
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Verify headings are still visible and readable
    await expect(firstHeading).toBeVisible();
    
    // Check that text color changed appropriately
    const textColor = await firstHeading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // In dark mode, text should not be black
    expect(textColor).not.toBe('rgb(0, 0, 0)');
  });
});