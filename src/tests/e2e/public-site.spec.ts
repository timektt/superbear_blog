import { test, expect } from '@playwright/test';

test.describe('Public Site', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/articles', async (route) => {
      const mockArticles = {
        articles: [
          {
            id: '1',
            title: 'Test Article 1',
            slug: 'test-article-1',
            summary: 'This is a test article summary',
            image: 'https://example.com/image1.jpg',
            publishedAt: '2024-01-01T10:00:00Z',
            author: { name: 'John Doe', avatar: null },
            category: { name: 'Development', slug: 'development' },
            tags: [{ name: 'React', slug: 'react' }],
          },
          {
            id: '2',
            title: 'Test Article 2',
            slug: 'test-article-2',
            summary: 'Another test article',
            image: null,
            publishedAt: '2024-01-02T10:00:00Z',
            author: { name: 'Jane Smith', avatar: null },
            category: { name: 'AI', slug: 'ai' },
            tags: [{ name: 'Machine Learning', slug: 'machine-learning' }],
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      await route.fulfill({ json: mockArticles });
    });
  });

  test('should display homepage with articles', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/SuperBear Blog/);

    // Check navigation
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'SuperBear Blog' })
    ).toBeVisible();

    // Check articles are displayed
    await expect(page.getByText('Test Article 1')).toBeVisible();
    await expect(page.getByText('Test Article 2')).toBeVisible();
    await expect(
      page.getByText('This is a test article summary')
    ).toBeVisible();
  });

  test('should navigate to news page', async ({ page }) => {
    await page.goto('/');

    // Click on news link
    await page.getByRole('link', { name: 'News' }).click();

    // Should be on news page
    await expect(page).toHaveURL('/news');
    await expect(
      page.getByRole('heading', { name: 'Latest Tech News' })
    ).toBeVisible();
  });

  test('should display article cards with correct information', async ({
    page,
  }) => {
    await page.goto('/news');

    // Check first article card
    const firstArticle = page.getByRole('article').first();
    await expect(firstArticle.getByText('Test Article 1')).toBeVisible();
    await expect(firstArticle.getByText('John Doe')).toBeVisible();
    await expect(firstArticle.getByText('Development')).toBeVisible();
    await expect(firstArticle.getByText('React')).toBeVisible();
  });

  test('should navigate to individual article page', async ({ page }) => {
    // Mock individual article API
    await page.route('**/api/articles/test-article-1', async (route) => {
      const mockArticle = {
        id: '1',
        title: 'Test Article 1',
        slug: 'test-article-1',
        summary: 'This is a test article summary',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'This is the article content.' }],
            },
          ],
        },
        image: 'https://example.com/image1.jpg',
        publishedAt: '2024-01-01T10:00:00Z',
        author: { name: 'John Doe', avatar: null },
        category: { name: 'Development', slug: 'development' },
        tags: [{ name: 'React', slug: 'react' }],
      };
      await route.fulfill({ json: mockArticle });
    });

    await page.goto('/news');

    // Click on article link
    await page
      .getByRole('link', { name: /Test Article 1/ })
      .first()
      .click();

    // Should be on article page
    await expect(page).toHaveURL('/news/test-article-1');
    await expect(
      page.getByRole('heading', { name: 'Test Article 1' })
    ).toBeVisible();
    await expect(page.getByText('This is the article content.')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    // Mock search API
    await page.route('**/api/search*', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');

      const mockResults =
        query === 'React'
          ? [
              {
                id: '1',
                title: 'Test Article 1',
                slug: 'test-article-1',
                summary: 'This is a test article summary',
                image: 'https://example.com/image1.jpg',
                publishedAt: '2024-01-01T10:00:00Z',
                author: { name: 'John Doe', avatar: null },
                category: { name: 'Development', slug: 'development' },
                tags: [{ name: 'React', slug: 'react' }],
              },
            ]
          : [];

      await route.fulfill({ json: mockResults });
    });

    await page.goto('/news');

    // Use search bar
    const searchInput = page.getByPlaceholder('Search articles...');
    await searchInput.fill('React');
    await searchInput.press('Enter');

    // Should show search results
    await expect(page.getByText('Test Article 1')).toBeVisible();
  });

  test('should filter articles by category', async ({ page }) => {
    // Mock categories API
    await page.route('**/api/categories', async (route) => {
      const mockCategories = [
        { id: '1', name: 'Development', slug: 'development' },
        { id: '2', name: 'AI', slug: 'ai' },
      ];
      await route.fulfill({ json: mockCategories });
    });

    await page.goto('/news');

    // Click on category filter
    await page.getByText('Development').click();

    // Should filter articles
    await expect(page).toHaveURL(/category=development/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check mobile navigation
    const mobileMenu = page.getByRole('button', { name: /menu/i });
    await expect(mobileMenu).toBeVisible();

    // Open mobile menu
    await mobileMenu.click();
    await expect(page.getByRole('link', { name: 'News' })).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    await page.goto('/');

    // Check for skip link
    await expect(
      page.getByRole('link', { name: /skip to main content/i })
    ).toBeVisible();

    // Check heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Check article landmarks
    const articles = page.getByRole('article');
    await expect(articles.first()).toBeVisible();

    // Check image alt text
    const images = page.getByRole('img');
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('alt');
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Delay API response to test loading state
    await page.route('**/api/articles', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        json: { articles: [], total: 0, page: 1, limit: 10 },
      });
    });

    await page.goto('/news');

    // Should show loading state
    await expect(page.getByText(/loading/i)).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/articles', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'Server error' } });
    });

    await page.goto('/news');

    // Should show error message
    await expect(page.getByText(/error/i)).toBeVisible();
  });
});
