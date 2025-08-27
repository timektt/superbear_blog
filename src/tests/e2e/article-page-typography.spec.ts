import { test, expect } from '@playwright/test';

test.describe('Article Page Typography and Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Mock article data
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ json: { data: [] } });
    });
  });

  test('article content has proper width constraints', async ({ page }) => {
    await page.goto('/news/sample-article');

    // Wait for article content to load
    const articleContainer = page.locator('article').first();
    await expect(articleContainer).toBeVisible();

    // Check that the main content wrapper has max-width constraint
    const contentWrapper = page.locator('.max-w-3xl').first();
    await expect(contentWrapper).toBeVisible();

    // Verify width constraint is applied
    const width = await contentWrapper.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });

    // Should have a reasonable max-width (not 'none')
    expect(width).not.toBe('none');
    expect(width).toMatch(/\d+px/); // Should be a pixel value
  });

  test('article heading has proper typography', async ({ page }) => {
    await page.goto('/news/sample-article');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Check heading styles
    const headingStyles = await heading.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
      };
    });

    // Should have large font size
    const fontSize = parseFloat(headingStyles.fontSize);
    expect(fontSize).toBeGreaterThan(32); // At least 32px

    // Should be bold
    expect(parseInt(headingStyles.fontWeight)).toBeGreaterThanOrEqual(700);
  });

  test('article meta row is compact and well-formatted', async ({ page }) => {
    await page.goto('/news/sample-article');

    // Find the meta row (author and date info)
    const metaRow = page.locator('header').locator('div').last();
    await expect(metaRow).toBeVisible();

    // Check that it contains author and date
    await expect(metaRow).toContainText('By');

    // Check spacing and layout
    const metaStyles = await metaRow.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        alignItems: styles.alignItems,
        fontSize: styles.fontSize,
      };
    });

    // Should use flexbox for layout
    expect(metaStyles.display).toBe('flex');
    expect(metaStyles.alignItems).toBe('center');

    // Should have smaller font size than body text
    const fontSize = parseFloat(metaStyles.fontSize);
    expect(fontSize).toBeLessThan(16); // Smaller than base font size
  });

  test('article body text has proper line height and spacing', async ({
    page,
  }) => {
    await page.goto('/news/sample-article');

    // Find the prose content
    const proseContent = page.locator('.prose').first();
    await expect(proseContent).toBeVisible();

    const proseStyles = await proseContent.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        lineHeight: styles.lineHeight,
        fontSize: styles.fontSize,
      };
    });

    // Line height should be relaxed (1.6 or higher)
    const lineHeight = parseFloat(proseStyles.lineHeight);
    const fontSize = parseFloat(proseStyles.fontSize);
    const ratio = lineHeight / fontSize;

    expect(ratio).toBeGreaterThanOrEqual(1.6);
  });

  test('responsive typography works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/news/sample-article');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Check mobile heading size
    const mobileHeadingSize = await heading.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();

    // Check desktop heading size
    const desktopHeadingSize = await heading.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // Desktop should be larger than mobile
    expect(desktopHeadingSize).toBeGreaterThan(mobileHeadingSize);
  });

  test('article images have proper styling', async ({ page }) => {
    await page.goto('/news/sample-article');

    // Check if there are any images in the prose content
    const images = page.locator('.prose img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();

      const imageStyles = await firstImage.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          borderRadius: styles.borderRadius,
          border: styles.border,
        };
      });

      // Should have rounded corners
      expect(imageStyles.borderRadius).not.toBe('0px');

      // Should have a border
      expect(imageStyles.border).not.toBe('none');
      expect(imageStyles.border).not.toBe('0px');
    }
  });

  test('article content is readable in both themes', async ({ page }) => {
    await page.goto('/news/sample-article');

    const proseContent = page.locator('.prose').first();
    await expect(proseContent).toBeVisible();

    // Check light mode text color
    const lightTextColor = await proseContent.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Toggle to dark mode
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check dark mode text color
    const darkTextColor = await proseContent.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Colors should be different
    expect(lightTextColor).not.toBe(darkTextColor);

    // Neither should be transparent or invisible
    expect(lightTextColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(darkTextColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('article layout is centered and properly spaced', async ({ page }) => {
    await page.goto('/news/sample-article');

    const mainContainer = page.locator('.max-w-3xl.mx-auto').first();
    await expect(mainContainer).toBeVisible();

    // Check that container is centered
    const containerStyles = await mainContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        marginLeft: styles.marginLeft,
        marginRight: styles.marginRight,
        padding: styles.padding,
      };
    });

    // Should have auto margins for centering
    expect(containerStyles.marginLeft).toBe('auto');
    expect(containerStyles.marginRight).toBe('auto');
  });

  test('reading progress indicator works', async ({ page }) => {
    await page.goto('/news/sample-article');

    // Check if reading progress bar exists
    const progressBar = page.locator('.fixed.top-0.left-0.w-full.h-1');
    await expect(progressBar).toBeVisible();

    // Check initial state
    const initialWidth = await progressBar.locator('div').evaluate((el) => {
      return window.getComputedStyle(el).width;
    });

    // Scroll down
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    await page.waitForTimeout(200);

    // Check that progress updated
    const updatedWidth = await progressBar.locator('div').evaluate((el) => {
      return window.getComputedStyle(el).width;
    });

    // Progress should have changed
    expect(updatedWidth).not.toBe(initialWidth);
  });
});
