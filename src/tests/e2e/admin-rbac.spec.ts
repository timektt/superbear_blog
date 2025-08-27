import { test, expect } from '@playwright/test';

test.describe('Admin RBAC (Role-Based Access Control)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the session API to avoid real authentication
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user',
            email: 'test@example.com',
            role: 'VIEWER', // Default to VIEWER role
          },
        }),
      });
    });
  });

  test('should redirect VIEWER role from admin pages', async ({ page }) => {
    // Try to access admin dashboard
    await page.goto('/admin');

    // Should be redirected to login or access denied
    await expect(page).toHaveURL(/\/(login|unauthorized)/);
  });

  test('should allow EDITOR role to access article management', async ({
    page,
  }) => {
    // Mock session with EDITOR role
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'editor-user',
            email: 'editor@example.com',
            role: 'EDITOR',
          },
        }),
      });
    });

    // Mock articles API
    await page.route('**/api/admin/articles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/admin/articles');

    // Should be able to access articles page
    await expect(page.locator('h1')).toContainText('Articles');
    await expect(
      page.locator('[data-testid="create-article-button"]')
    ).toBeVisible();
  });

  test('should prevent EDITOR from accessing user management', async ({
    page,
  }) => {
    // Mock session with EDITOR role
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'editor-user',
            email: 'editor@example.com',
            role: 'EDITOR',
          },
        }),
      });
    });

    await page.goto('/admin/users');

    // Should be redirected or show access denied
    await expect(page).toHaveURL(/\/(login|unauthorized)/);
  });

  test('should allow ADMIN role full access', async ({ page }) => {
    // Mock session with ADMIN role
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

    // Mock various admin APIs
    await page.route('**/api/admin/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Test access to different admin sections
    const adminPages = [
      '/admin',
      '/admin/articles',
      '/admin/users',
      '/admin/settings',
    ];

    for (const adminPage of adminPages) {
      await page.goto(adminPage);
      // Should not be redirected to login
      await expect(page).not.toHaveURL(/\/login/);
    }
  });

  test('should show appropriate navigation based on role', async ({ page }) => {
    // Mock session with EDITOR role
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'editor-user',
            email: 'editor@example.com',
            role: 'EDITOR',
          },
        }),
      });
    });

    await page.route('**/api/admin/articles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/admin');

    // Should see article management link
    await expect(page.locator('nav a[href="/admin/articles"]')).toBeVisible();

    // Should not see user management link
    await expect(page.locator('nav a[href="/admin/users"]')).not.toBeVisible();
  });
});
