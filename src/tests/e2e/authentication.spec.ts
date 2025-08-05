import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication API
    await page.route('**/api/auth/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/signin')) {
        // Mock successful login
        await route.fulfill({
          status: 200,
          json: {
            url: '/admin',
            user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
          },
        });
      } else if (url.includes('/signout')) {
        // Mock successful logout
        await route.fulfill({
          status: 200,
          json: { url: '/admin/login' },
        });
      } else if (url.includes('/session')) {
        // Mock session check
        const hasSession = route.request().headers()['authorization'];
        await route.fulfill({
          status: 200,
          json: hasSession
            ? {
                user: {
                  id: '1',
                  email: 'admin@example.com',
                  name: 'Admin User',
                },
                expires: '2025-01-01T00:00:00.000Z',
              }
            : null,
        });
      }
    });
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/admin/login');

    // Check page title and heading
    await expect(page).toHaveTitle(/Admin Login/);
    await expect(
      page.getByRole('heading', { name: 'Admin Login' })
    ).toBeVisible();

    // Check form elements
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should handle successful login', async ({ page }) => {
    await page.goto('/admin/login');

    // Fill login form
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.getByText('Welcome back, Admin User')).toBeVisible();
  });

  test('should handle login validation errors', async ({ page }) => {
    await page.goto('/admin/login');

    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show validation errors
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    // Mock failed login
    await page.route('**/api/auth/signin', async (route) => {
      await route.fulfill({
        status: 401,
        json: { error: 'Invalid credentials' },
      });
    });

    await page.goto('/admin/login');

    // Fill with invalid credentials
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show error message
    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/admin/login');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Mock no session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({ status: 200, json: null });
    });

    // Try to access protected route
    await page.goto('/admin/articles');

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login');
    await expect(
      page.getByRole('heading', { name: 'Admin Login' })
    ).toBeVisible();
  });

  test('should allow authenticated users to access admin routes', async ({
    page,
  }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
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
      await route.fulfill({ json: [] });
    });

    await page.goto('/admin/articles');

    // Should access the page successfully
    await expect(page).toHaveURL('/admin/articles');
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
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

    await page.goto('/admin');

    // Click logout button
    await page.getByRole('button', { name: /logout/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL('/admin/login');
    await expect(
      page.getByRole('heading', { name: 'Admin Login' })
    ).toBeVisible();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    // Mock persistent session
    await page.addInitScript(() => {
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

    await page.goto('/admin');

    // Verify user is logged in
    await expect(page.getByText('Welcome back, Admin User')).toBeVisible();

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page.getByText('Welcome back, Admin User')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // Mock expired session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
          expires: '2020-01-01T00:00:00.000Z', // Expired
        },
      });
    });

    await page.goto('/admin/articles');

    // Should redirect to login due to expired session
    await expect(page).toHaveURL('/admin/login');
    await expect(page.getByText('Your session has expired')).toBeVisible();
  });

  test('should prevent access to admin routes from public site', async ({
    page,
  }) => {
    await page.goto('/');

    // Try to navigate directly to admin route
    await page.goto('/admin/articles');

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login');
  });

  test('should handle network errors during authentication', async ({
    page,
  }) => {
    // Mock network error
    await page.route('**/api/auth/signin', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/admin/login');

    // Fill and submit form
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show network error message
    await expect(
      page.getByText('Network error. Please try again.')
    ).toBeVisible();
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/admin/login');

    // Check form labels
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');

    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Check form can be navigated with keyboard
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeFocused();
  });

  test('should remember login state in localStorage', async ({ page }) => {
    await page.goto('/admin/login');

    // Fill and submit form
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check that session is stored
    const sessionData = await page.evaluate(() =>
      localStorage.getItem('next-auth.session-token')
    );
    expect(sessionData).toBeTruthy();
  });
});
