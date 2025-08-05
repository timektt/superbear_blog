import { test, expect } from '@playwright/test';

test.describe('Admin Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      // Mock NextAuth session
      window.__NEXT_DATA__ = {
        props: {
          pageProps: {
            session: {
              user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
              expires: '2025-01-01T00:00:00.000Z',
            },
          },
        },
      };
    });

    // Mock admin articles API
    await page.route('**/api/admin/articles', async (route) => {
      if (route.request().method() === 'GET') {
        const mockArticles = [
          {
            id: '1',
            title: 'Draft Article',
            slug: 'draft-article',
            summary: 'This is a draft article',
            status: 'DRAFT',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
            author: { name: 'Admin User', avatar: null },
            category: { name: 'Development', slug: 'development' },
            tags: [{ name: 'React', slug: 'react' }],
          },
          {
            id: '2',
            title: 'Published Article',
            slug: 'published-article',
            summary: 'This is a published article',
            status: 'PUBLISHED',
            publishedAt: '2024-01-01T12:00:00Z',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T12:00:00Z',
            author: { name: 'Admin User', avatar: null },
            category: { name: 'AI', slug: 'ai' },
            tags: [{ name: 'Machine Learning', slug: 'machine-learning' }],
          },
        ];
        await route.fulfill({ json: mockArticles });
      } else if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        const newArticle = {
          id: '3',
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: { name: 'Admin User', avatar: null },
          category: { name: 'Development', slug: 'development' },
          tags: [],
        };
        await route.fulfill({ status: 201, json: newArticle });
      }
    });

    // Mock categories API
    await page.route('**/api/admin/categories', async (route) => {
      const mockCategories = [
        { id: '1', name: 'Development', slug: 'development' },
        { id: '2', name: 'AI', slug: 'ai' },
        { id: '3', name: 'Startup', slug: 'startup' },
      ];
      await route.fulfill({ json: mockCategories });
    });
  });

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/admin');

    // Check page title
    await expect(page).toHaveTitle(/Admin Dashboard/);

    // Check admin navigation
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Articles' })).toBeVisible();

    // Check welcome message
    await expect(page.getByText('Welcome back, Admin User')).toBeVisible();
  });

  test('should display articles list', async ({ page }) => {
    await page.goto('/admin/articles');

    // Check page heading
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();

    // Check articles table
    await expect(page.getByText('Draft Article')).toBeVisible();
    await expect(page.getByText('Published Article')).toBeVisible();

    // Check status badges
    await expect(page.getByText('DRAFT')).toBeVisible();
    await expect(page.getByText('PUBLISHED')).toBeVisible();

    // Check action buttons
    await expect(
      page.getByRole('button', { name: /edit/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /delete/i }).first()
    ).toBeVisible();
  });

  test('should create new article', async ({ page }) => {
    await page.goto('/admin/articles');

    // Click create new article button
    await page.getByRole('button', { name: 'New Article' }).click();

    // Should navigate to create form
    await expect(page).toHaveURL('/admin/articles/new');
    await expect(
      page.getByRole('heading', { name: 'Create Article' })
    ).toBeVisible();

    // Fill out form
    await page.getByLabel('Title').fill('New Test Article');
    await page.getByLabel('Summary').fill('This is a new test article');

    // Select category
    await page.getByLabel('Category').selectOption('1');

    // Set status
    await page.getByLabel('Status').selectOption('DRAFT');

    // Submit form
    await page.getByRole('button', { name: 'Create Article' }).click();

    // Should redirect to articles list
    await expect(page).toHaveURL('/admin/articles');
    await expect(page.getByText('Article created successfully')).toBeVisible();
  });

  test('should edit existing article', async ({ page }) => {
    // Mock individual article API
    await page.route('**/api/admin/articles/1', async (route) => {
      if (route.request().method() === 'GET') {
        const mockArticle = {
          id: '1',
          title: 'Draft Article',
          slug: 'draft-article',
          summary: 'This is a draft article',
          content: { type: 'doc', content: [] },
          status: 'DRAFT',
          categoryId: '1',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
          author: { name: 'Admin User', avatar: null },
          category: { name: 'Development', slug: 'development' },
          tags: [],
        };
        await route.fulfill({ json: mockArticle });
      } else if (route.request().method() === 'PATCH') {
        const body = await route.request().postDataJSON();
        const updatedArticle = {
          id: '1',
          title: body.title || 'Draft Article',
          slug: 'draft-article',
          summary: body.summary || 'This is a draft article',
          content: body.content || { type: 'doc', content: [] },
          status: body.status || 'DRAFT',
          categoryId: body.categoryId || '1',
          updatedAt: new Date().toISOString(),
          author: { name: 'Admin User', avatar: null },
          category: { name: 'Development', slug: 'development' },
          tags: [],
        };
        await route.fulfill({ json: updatedArticle });
      }
    });

    await page.goto('/admin/articles');

    // Click edit button for first article
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Should navigate to edit form
    await expect(page).toHaveURL('/admin/articles/1/edit');
    await expect(
      page.getByRole('heading', { name: 'Edit Article' })
    ).toBeVisible();

    // Form should be pre-filled
    await expect(page.getByLabel('Title')).toHaveValue('Draft Article');
    await expect(page.getByLabel('Summary')).toHaveValue(
      'This is a draft article'
    );

    // Update title
    await page.getByLabel('Title').fill('Updated Draft Article');

    // Submit form
    await page.getByRole('button', { name: 'Update Article' }).click();

    // Should redirect to articles list
    await expect(page).toHaveURL('/admin/articles');
    await expect(page.getByText('Article updated successfully')).toBeVisible();
  });

  test('should delete article with confirmation', async ({ page }) => {
    // Mock delete API
    await page.route('**/api/admin/articles/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      }
    });

    await page.goto('/admin/articles');

    // Click delete button
    await page
      .getByRole('button', { name: /delete/i })
      .first()
      .click();

    // Should show confirmation modal
    await expect(
      page.getByText('Are you sure you want to delete this article?')
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click();

    // Should show success message
    await expect(page.getByText('Article deleted successfully')).toBeVisible();
  });

  test('should use rich text editor', async ({ page }) => {
    await page.goto('/admin/articles/new');

    // Check that editor is present
    await expect(page.locator('.ProseMirror')).toBeVisible();

    // Check editor toolbar
    await expect(page.getByRole('button', { name: /bold/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /italic/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /heading/i })).toBeVisible();

    // Type in editor
    await page
      .locator('.ProseMirror')
      .fill('This is test content for the article.');

    // Use formatting
    await page.locator('.ProseMirror').selectText();
    await page.getByRole('button', { name: /bold/i }).click();

    // Content should be formatted
    await expect(page.locator('.ProseMirror strong')).toBeVisible();
  });

  test('should filter articles by status', async ({ page }) => {
    await page.goto('/admin/articles');

    // Check that both articles are visible initially
    await expect(page.getByText('Draft Article')).toBeVisible();
    await expect(page.getByText('Published Article')).toBeVisible();

    // Filter by draft status
    await page.getByLabel('Filter by status').selectOption('DRAFT');

    // Should only show draft articles
    await expect(page.getByText('Draft Article')).toBeVisible();
    await expect(page.getByText('Published Article')).not.toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('/admin/articles/new');

    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Article' }).click();

    // Should show validation errors
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Category is required')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');

    // Check mobile navigation
    const mobileMenu = page.getByRole('button', { name: /menu/i });
    await expect(mobileMenu).toBeVisible();

    // Open mobile menu
    await mobileMenu.click();
    await expect(page.getByRole('link', { name: 'Articles' })).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    await page.goto('/admin');

    // Click logout button
    await page.getByRole('button', { name: /logout/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL('/admin/login');
  });

  test('should require authentication', async ({ page }) => {
    // Clear authentication
    await page.addInitScript(() => {
      window.__NEXT_DATA__ = {
        props: {
          pageProps: {
            session: null,
          },
        },
      };
    });

    await page.goto('/admin/articles');

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login');
    await expect(
      page.getByRole('heading', { name: 'Admin Login' })
    ).toBeVisible();
  });
});
