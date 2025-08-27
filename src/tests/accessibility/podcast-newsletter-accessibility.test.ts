import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Podcast and Newsletter Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/podcasts', async (route) => {
      const mockPodcasts = {
        podcasts: [
          {
            id: '1',
            title: 'The Future of AI Development',
            slug: 'future-of-ai-development',
            description: 'A deep dive into the latest AI development trends.',
            coverImage: 'https://example.com/ai-podcast-cover.jpg',
            duration: 2400,
            episodeNumber: 15,
            publishedAt: '2024-01-15T10:00:00Z',
            author: { name: 'Dr. Sarah Chen' },
            category: { name: 'Technology', slug: 'technology' },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      await route.fulfill({ json: mockPodcasts });
    });

    await page.route('**/api/newsletter/issues', async (route) => {
      const mockIssues = {
        issues: [
          {
            id: '1',
            title: 'Weekly Tech Roundup #5',
            slug: 'weekly-tech-roundup-5',
            summary: 'This week we cover the latest in AI breakthroughs.',
            issueNumber: 5,
            publishedAt: '2024-01-15T10:00:00Z',
            author: { name: 'Jane Smith' },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      await route.fulfill({ json: mockIssues });
    });
  });

  test('podcast listing page meets accessibility standards', async ({
    page,
  }) => {
    await page.goto('/podcasts');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('podcast detail page meets accessibility standards', async ({
    page,
  }) => {
    await page.route(
      '**/api/podcasts/future-of-ai-development',
      async (route) => {
        const mockPodcast = {
          podcast: {
            id: '1',
            title: 'The Future of AI Development',
            slug: 'future-of-ai-development',
            description: 'A comprehensive discussion about AI development.',
            audioUrl: 'https://example.com/ai-podcast-audio.mp3',
            coverImage: 'https://example.com/ai-podcast-cover.jpg',
            duration: 2400,
            episodeNumber: 15,
            publishedAt: '2024-01-15T10:00:00Z',
            author: { name: 'Dr. Sarah Chen' },
            category: { name: 'Technology', slug: 'technology' },
            tags: [{ name: 'AI', slug: 'ai' }],
          },
        };
        await route.fulfill({ json: mockPodcast });
      }
    );

    await page.goto('/podcasts/future-of-ai-development');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('newsletter archive page meets accessibility standards', async ({
    page,
  }) => {
    await page.goto('/newsletter');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('newsletter issue page meets accessibility standards', async ({
    page,
  }) => {
    await page.route(
      '**/api/newsletter/issues/weekly-tech-roundup-5',
      async (route) => {
        const mockIssue = {
          issue: {
            id: '1',
            title: 'Weekly Tech Roundup #5',
            slug: 'weekly-tech-roundup-5',
            summary: 'This week we cover the latest in AI breakthroughs.',
            content: {
              type: 'doc',
              content: [
                {
                  type: 'heading',
                  attrs: { level: 2 },
                  content: [{ type: 'text', text: 'AI Breakthroughs' }],
                },
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Content here...' }],
                },
              ],
            },
            issueNumber: 5,
            publishedAt: '2024-01-15T10:00:00Z',
            author: { name: 'Jane Smith' },
          },
        };
        await route.fulfill({ json: mockIssue });
      }
    );

    await page.goto('/newsletter/weekly-tech-roundup-5');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('audio player has proper accessibility attributes', async ({ page }) => {
    await page.route(
      '**/api/podcasts/future-of-ai-development',
      async (route) => {
        const mockPodcast = {
          podcast: {
            id: '1',
            title: 'The Future of AI Development',
            slug: 'future-of-ai-development',
            audioUrl: 'https://example.com/ai-podcast-audio.mp3',
            duration: 2400,
            author: { name: 'Dr. Sarah Chen' },
          },
        };
        await route.fulfill({ json: mockPodcast });
      }
    );

    await page.goto('/podcasts/future-of-ai-development');

    // Check that audio player controls have proper labels
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByLabelText('Seek audio position')).toBeVisible();
    await expect(page.getByLabelText('Volume control')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mute' })).toBeVisible();

    // Check that sliders have proper ARIA attributes
    const seekSlider = page.getByLabelText('Seek audio position');
    await expect(seekSlider).toHaveAttribute('role', 'slider');
    await expect(seekSlider).toHaveAttribute('aria-valuemin');
    await expect(seekSlider).toHaveAttribute('aria-valuemax');

    const volumeSlider = page.getByLabelText('Volume control');
    await expect(volumeSlider).toHaveAttribute('role', 'slider');
    await expect(volumeSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(volumeSlider).toHaveAttribute('aria-valuemax', '1');
  });

  test('podcast cards have proper semantic structure', async ({ page }) => {
    await page.goto('/podcasts');

    // Check that podcast cards use proper heading hierarchy
    const podcastTitle = page.getByRole('heading', {
      name: 'The Future of AI Development',
    });
    await expect(podcastTitle).toBeVisible();

    // Check that links have descriptive text
    const podcastLink = page.getByRole('link', {
      name: /The Future of AI Development/,
    });
    await expect(podcastLink).toBeVisible();

    // Check that images have proper alt text
    const coverImage = page.getByAltText('The Future of AI Development cover');
    await expect(coverImage).toBeVisible();

    // Check that time elements have proper datetime attributes
    const timeElement = page.locator('time');
    await expect(timeElement).toHaveAttribute('datetime');
  });

  test('newsletter subscription form is accessible', async ({ page }) => {
    await page.goto('/newsletter');

    // Check that form has proper labels
    const emailInput = page.getByLabelText(/email/i);
    await expect(emailInput).toBeVisible();

    // Check that submit button is properly labeled
    const submitButton = page.getByRole('button', { name: /subscribe/i });
    await expect(submitButton).toBeVisible();

    // Check form validation messages are announced to screen readers
    await emailInput.fill('invalid-email');
    await submitButton.click();

    const errorMessage = page.getByRole('alert');
    await expect(errorMessage).toBeVisible();
  });

  test('keyboard navigation works throughout podcast pages', async ({
    page,
  }) => {
    await page.goto('/podcasts');

    // Test tab order through podcast cards
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );

    // Continue tabbing through interactive elements
    const interactiveElements = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const element = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label'),
        };
      });
      interactiveElements.push(element);
    }

    // Verify that all interactive elements are reachable
    const hasLinks = interactiveElements.some((el) => el.tagName === 'A');
    const hasButtons = interactiveElements.some(
      (el) => el.tagName === 'BUTTON'
    );

    expect(hasLinks).toBe(true);
    expect(hasButtons).toBe(true);
  });

  test('screen reader announcements work correctly', async ({ page }) => {
    await page.goto('/podcasts');

    // Check that page has proper title for screen readers
    await expect(page).toHaveTitle(/Podcasts/);

    // Check that main content area is properly labeled
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Check that navigation landmarks are present
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // Navigate to podcast detail and check announcements
    await page.route(
      '**/api/podcasts/future-of-ai-development',
      async (route) => {
        const mockPodcast = {
          podcast: {
            id: '1',
            title: 'The Future of AI Development',
            slug: 'future-of-ai-development',
            audioUrl: 'https://example.com/ai-podcast-audio.mp3',
            duration: 2400,
            author: { name: 'Dr. Sarah Chen' },
          },
        };
        await route.fulfill({ json: mockPodcast });
      }
    );

    await page
      .getByRole('link', { name: /The Future of AI Development/ })
      .click();

    // Check that page title updates for screen readers
    await expect(page).toHaveTitle(/The Future of AI Development/);

    // Check that audio player state changes are announced
    const playButton = page.getByRole('button', { name: 'Play' });
    await playButton.click();

    // After clicking play, button should announce new state
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('color contrast meets accessibility standards', async ({ page }) => {
    await page.goto('/podcasts');

    // Run axe-core specifically for color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.podcast-card')
      .analyze();

    // Check that there are no color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('focus indicators are visible and clear', async ({ page }) => {
    await page.goto('/podcasts');

    // Test focus indicators on interactive elements
    await page.keyboard.press('Tab');

    // Check that focused element has visible focus indicator
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check that focus indicator has sufficient contrast
    const focusStyles = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Verify that some form of focus indicator is present
    const hasFocusIndicator =
      focusStyles.outline !== 'none' ||
      focusStyles.boxShadow !== 'none' ||
      focusStyles.outlineWidth !== '0px';

    expect(hasFocusIndicator).toBe(true);
  });

  test('images have appropriate alt text', async ({ page }) => {
    await page.goto('/podcasts');

    // Check that all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const altText = await image.getAttribute('alt');

      // Alt text should exist and be descriptive
      expect(altText).toBeTruthy();
      expect(altText.length).toBeGreaterThan(0);
    }
  });

  test('form error messages are accessible', async ({ page }) => {
    await page.route('**/api/newsletter/subscribe', async (route) => {
      await route.fulfill({
        status: 400,
        json: { error: 'Invalid email address' },
      });
    });

    await page.goto('/newsletter');

    // Submit form with invalid data
    await page.getByPlaceholder('Enter your email').fill('invalid');
    await page.getByRole('button', { name: /Subscribe/i }).click();

    // Check that error message is properly associated with form field
    const errorMessage = page.getByRole('alert');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid email address');

    // Check that error message has proper ARIA attributes
    const errorId = await errorMessage.getAttribute('id');
    expect(errorId).toBeTruthy();

    // Check that form field references the error message
    const emailInput = page.getByPlaceholder('Enter your email');
    const describedBy = await emailInput.getAttribute('aria-describedby');
    expect(describedBy).toContain(errorId);
  });
});
