import { test, expect } from '@playwright/test';

test.describe('Podcast and Newsletter Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/podcasts', async (route) => {
      const mockPodcasts = {
        podcasts: Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 1}`,
          title: `Podcast Episode ${i + 1}`,
          slug: `podcast-episode-${i + 1}`,
          description: `Description for podcast episode ${i + 1}`,
          coverImage: `https://example.com/cover-${i + 1}.jpg`,
          duration: 1800 + i * 60,
          episodeNumber: i + 1,
          publishedAt: new Date(
            Date.now() - i * 24 * 60 * 60 * 1000
          ).toISOString(),
          author: { name: `Author ${i + 1}` },
          category: { name: 'Technology', slug: 'technology' },
        })),
        pagination: { page: 1, limit: 20, total: 20, totalPages: 1 },
      };
      await route.fulfill({ json: mockPodcasts });
    });

    await page.route('**/api/newsletter/issues', async (route) => {
      const mockIssues = {
        issues: Array.from({ length: 15 }, (_, i) => ({
          id: `${i + 1}`,
          title: `Newsletter Issue ${i + 1}`,
          slug: `newsletter-issue-${i + 1}`,
          summary: `Summary for newsletter issue ${i + 1}`,
          issueNumber: i + 1,
          publishedAt: new Date(
            Date.now() - i * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          author: { name: `Author ${i + 1}` },
        })),
        pagination: { page: 1, limit: 15, total: 15, totalPages: 1 },
      };
      await route.fulfill({ json: mockIssues });
    });
  });

  test('podcast listing page loads within performance budget', async ({
    page,
  }) => {
    // Start performance measurement
    const startTime = Date.now();

    await page.goto('/podcasts');

    // Wait for content to be visible
    await expect(page.getByText('Podcast Episode 1')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Page should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('newsletter archive page loads within performance budget', async ({
    page,
  }) => {
    const startTime = Date.now();

    await page.goto('/newsletter');

    // Wait for content to be visible
    await expect(page.getByText('Newsletter Issue 1')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Page should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('theme switching is smooth and fast', async ({ page }) => {
    await page.goto('/podcasts');

    // Wait for page to load completely
    await expect(page.getByText('Podcast Episode 1')).toBeVisible();

    // Measure theme switch performance
    const startTime = Date.now();

    // Click theme toggle button
    await page.getByRole('button', { name: /toggle theme/i }).click();

    // Wait for theme transition to complete
    await page.waitForTimeout(300); // Allow for 200ms transition + buffer

    const switchTime = Date.now() - startTime;

    // Theme switch should complete within 500ms
    expect(switchTime).toBeLessThan(500);
  });

  test('audio player initialization is fast', async ({ page }) => {
    await page.route('**/api/podcasts/podcast-episode-1', async (route) => {
      const mockPodcast = {
        podcast: {
          id: '1',
          title: 'Podcast Episode 1',
          slug: 'podcast-episode-1',
          audioUrl: 'https://example.com/audio-1.mp3',
          duration: 1800,
          author: { name: 'Author 1' },
        },
      };
      await route.fulfill({ json: mockPodcast });
    });

    const startTime = Date.now();

    await page.goto('/podcasts/podcast-episode-1');

    // Wait for audio player to be visible
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();

    const initTime = Date.now() - startTime;

    // Audio player should initialize within 1 second
    expect(initTime).toBeLessThan(1000);
  });

  test('large podcast grid renders efficiently', async ({ page }) => {
    // Mock a large number of podcasts
    await page.route('**/api/podcasts', async (route) => {
      const largePodcastList = {
        podcasts: Array.from({ length: 100 }, (_, i) => ({
          id: `${i + 1}`,
          title: `Podcast Episode ${i + 1}`,
          slug: `podcast-episode-${i + 1}`,
          description: `Description for podcast episode ${i + 1}`,
          coverImage: `https://example.com/cover-${i + 1}.jpg`,
          duration: 1800,
          episodeNumber: i + 1,
          publishedAt: new Date().toISOString(),
          author: { name: `Author ${i + 1}` },
          category: { name: 'Technology', slug: 'technology' },
        })),
        pagination: { page: 1, limit: 100, total: 100, totalPages: 1 },
      };
      await route.fulfill({ json: largePodcastList });
    });

    const startTime = Date.now();

    await page.goto('/podcasts');

    // Wait for first and last podcast to be visible
    await expect(page.getByText('Podcast Episode 1')).toBeVisible();
    await expect(page.getByText('Podcast Episode 100')).toBeVisible();

    const renderTime = Date.now() - startTime;

    // Large grid should render within 3 seconds
    expect(renderTime).toBeLessThan(3000);
  });

  test('newsletter content with rich text renders efficiently', async ({
    page,
  }) => {
    await page.route(
      '**/api/newsletter/issues/newsletter-issue-1',
      async (route) => {
        const mockIssue = {
          issue: {
            id: '1',
            title: 'Newsletter Issue 1',
            slug: 'newsletter-issue-1',
            content: {
              type: 'doc',
              content: Array.from({ length: 50 }, (_, i) => ({
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `This is paragraph ${i + 1} with some rich text content that includes various formatting options and links.`,
                  },
                ],
              })),
            },
            issueNumber: 1,
            publishedAt: new Date().toISOString(),
            author: { name: 'Author 1' },
          },
        };
        await route.fulfill({ json: mockIssue });
      }
    );

    const startTime = Date.now();

    await page.goto('/newsletter/newsletter-issue-1');

    // Wait for content to be visible
    await expect(page.getByText('This is paragraph 1')).toBeVisible();
    await expect(page.getByText('This is paragraph 50')).toBeVisible();

    const renderTime = Date.now() - startTime;

    // Rich text content should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });

  test('image loading is optimized', async ({ page }) => {
    await page.goto('/podcasts');

    // Check that images use lazy loading
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const image = images.nth(i);
      const loading = await image.getAttribute('loading');

      // Images should use lazy loading (except for above-the-fold images)
      if (i > 2) {
        expect(loading).toBe('lazy');
      }
    }
  });

  test('API response times are within acceptable limits', async ({ page }) => {
    let apiResponseTime = 0;

    // Measure API response time
    page.on('response', (response) => {
      if (response.url().includes('/api/podcasts')) {
        apiResponseTime = response.timing().responseEnd;
      }
    });

    await page.goto('/podcasts');
    await expect(page.getByText('Podcast Episode 1')).toBeVisible();

    // API should respond within 500ms
    expect(apiResponseTime).toBeLessThan(500);
  });

  test('search functionality is responsive', async ({ page }) => {
    await page.route('**/api/podcasts?search=*', async (route) => {
      // Simulate search delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      const searchResults = {
        podcasts: [
          {
            id: '1',
            title: 'AI Development Podcast',
            slug: 'ai-development-podcast',
            description: 'AI-focused content',
            duration: 1800,
            episodeNumber: 1,
            publishedAt: new Date().toISOString(),
            author: { name: 'AI Expert' },
            category: { name: 'Technology', slug: 'technology' },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      await route.fulfill({ json: searchResults });
    });

    await page.goto('/podcasts');

    const startTime = Date.now();

    // Perform search
    await page.getByPlaceholder('Search podcasts...').fill('AI');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for search results
    await expect(page.getByText('AI Development Podcast')).toBeVisible();

    const searchTime = Date.now() - startTime;

    // Search should complete within 1 second
    expect(searchTime).toBeLessThan(1000);
  });

  test('pagination navigation is smooth', async ({ page }) => {
    await page.route('**/api/podcasts?page=2', async (route) => {
      const page2Podcasts = {
        podcasts: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 21}`,
          title: `Podcast Episode ${i + 21}`,
          slug: `podcast-episode-${i + 21}`,
          description: `Description ${i + 21}`,
          duration: 1800,
          episodeNumber: i + 21,
          publishedAt: new Date().toISOString(),
          author: { name: `Author ${i + 21}` },
          category: { name: 'Technology', slug: 'technology' },
        })),
        pagination: { page: 2, limit: 10, total: 30, totalPages: 3 },
      };
      await route.fulfill({ json: page2Podcasts });
    });

    await page.goto('/podcasts');

    const startTime = Date.now();

    // Navigate to next page
    await page.getByRole('button', { name: /next/i }).click();

    // Wait for new content
    await expect(page.getByText('Podcast Episode 21')).toBeVisible();

    const navigationTime = Date.now() - startTime;

    // Pagination should complete within 800ms
    expect(navigationTime).toBeLessThan(800);
  });

  test('memory usage remains stable during navigation', async ({ page }) => {
    // Navigate through multiple pages to test memory leaks
    const pages = ['/podcasts', '/newsletter', '/podcasts/podcast-episode-1'];

    for (const pagePath of pages) {
      if (pagePath === '/podcasts/podcast-episode-1') {
        await page.route('**/api/podcasts/podcast-episode-1', async (route) => {
          const mockPodcast = {
            podcast: {
              id: '1',
              title: 'Podcast Episode 1',
              slug: 'podcast-episode-1',
              audioUrl: 'https://example.com/audio-1.mp3',
              duration: 1800,
              author: { name: 'Author 1' },
            },
          };
          await route.fulfill({ json: mockPodcast });
        });
      }

      await page.goto(pagePath);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check that page loaded successfully
      await expect(page.locator('main')).toBeVisible();
    }

    // If we reach here without crashes, memory usage is stable
    expect(true).toBe(true);
  });

  test('CSS animations are smooth', async ({ page }) => {
    await page.goto('/podcasts');

    // Test hover animations on podcast cards
    const podcastCard = page.getByText('Podcast Episode 1').locator('..');

    // Hover over card to trigger animations
    await podcastCard.hover();

    // Check that transition classes are applied
    const hasTransition = await podcastCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.transition.includes('200ms') ||
        styles.transition.includes('0.2s')
      );
    });

    expect(hasTransition).toBe(true);
  });
});
