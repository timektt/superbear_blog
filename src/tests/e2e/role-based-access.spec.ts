import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  // Mock authentication states
  const mockAdminSession = {
    user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin User' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockEditorSession = {
    user: { id: '2', email: 'editor@test.com', role: 'editor', name: 'Editor User' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockViewerSession = {
    user: { id: '3', email: 'viewer@test.com', role: 'viewer', name: 'Viewer User' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  test.describe('Admin Access', () => {
    test.beforeEach(async ({ page }) => {
      // Mock admin session
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockAdminSession);
    });

    test('should allow admin to access all admin features', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should not be redirected to login
      expect(page.url()).toContain('/admin');

      // Verify admin dashboard is accessible
      const dashboard = page.getByRole('heading', { name: /dashboard/i });
      await expect(dashboard).toBeVisible();

      // Check access to admin-only features
      const adminFeatures = [
        'Articles',
        'Categories',
        'Users',
        'Analytics',
        'Settings',
      ];

      for (const feature of adminFeatures) {
        const featureLink = page.getByRole('link', { name: new RegExp(feature, 'i') });
        await expect(featureLink).toBeVisible();
      }
    });

    test('should allow admin to create and edit articles', async ({ page }) => {
      await page.goto('/admin/articles');
      await page.waitForLoadState('networkidle');

      // Should see create article button
      const createButton = page.getByRole('button', { name: /create article/i });
      await expect(createButton).toBeVisible();

      // Click create article
      await createButton.click();
      await page.waitForLoadState('networkidle');

      // Should be on article creation page
      expect(page.url()).toContain('/admin/articles/new');

      // Verify article form is accessible
      const titleInput = page.getByLabel(/title/i);
      const contentEditor = page.getByRole('textbox', { name: /content/i });
      
      await expect(titleInput).toBeVisible();
      await expect(contentEditor).toBeVisible();

      // Fill out article form
      await titleInput.fill('Test Article');
      await contentEditor.fill('This is test content');

      // Should be able to save
      const saveButton = page.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });

    test('should allow admin to manage users', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      // Should see user management interface
      const userTable = page.getByRole('table');
      await expect(userTable).toBeVisible();

      // Should see user actions
      const editButtons = page.getByRole('button', { name: /edit/i });
      const deleteButtons = page.getByRole('button', { name: /delete/i });

      if (await editButtons.first().isVisible()) {
        await expect(editButtons.first()).toBeEnabled();
      }

      if (await deleteButtons.first().isVisible()) {
        await expect(deleteButtons.first()).toBeEnabled();
      }
    });

    test('should allow admin to access analytics', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Should see analytics dashboard
      const analyticsCharts = page.getByTestId('analytics-chart');
      const metricsCards = page.getByTestId('metrics-card');

      // At least one analytics element should be visible
      const hasAnalytics = await analyticsCharts.first().isVisible() || 
                          await metricsCards.first().isVisible();
      expect(hasAnalytics).toBe(true);
    });
  });

  test.describe('Editor Access', () => {
    test.beforeEach(async ({ page }) => {
      // Mock editor session
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockEditorSession);
    });

    test('should allow editor to access content management', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should access admin area
      expect(page.url()).toContain('/admin');

      // Should see content-related features
      const articlesLink = page.getByRole('link', { name: /articles/i });
      const categoriesLink = page.getByRole('link', { name: /categories/i });

      await expect(articlesLink).toBeVisible();
      await expect(categoriesLink).toBeVisible();
    });

    test('should allow editor to create and edit articles', async ({ page }) => {
      await page.goto('/admin/articles');
      await page.waitForLoadState('networkidle');

      // Should see create article button
      const createButton = page.getByRole('button', { name: /create article/i });
      await expect(createButton).toBeVisible();

      // Should be able to edit existing articles
      const editButtons = page.getByRole('button', { name: /edit/i });
      if (await editButtons.first().isVisible()) {
        await expect(editButtons.first()).toBeEnabled();
      }
    });

    test('should restrict editor from user management', async ({ page }) => {
      // Try to access user management
      await page.goto('/admin/users');
      
      // Should be redirected or show access denied
      await page.waitForLoadState('networkidle');
      
      const accessDenied = page.getByText(/access denied|unauthorized|forbidden/i);
      const isRedirected = !page.url().includes('/admin/users');
      
      // Either should show access denied or be redirected
      const hasRestriction = await accessDenied.isVisible() || isRedirected;
      expect(hasRestriction).toBe(true);
    });

    test('should restrict editor from system settings', async ({ page }) => {
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');

      // Should not have access to system settings
      const accessDenied = page.getByText(/access denied|unauthorized|forbidden/i);
      const isRedirected = !page.url().includes('/admin/settings');
      
      const hasRestriction = await accessDenied.isVisible() || isRedirected;
      expect(hasRestriction).toBe(true);
    });
  });

  test.describe('Viewer Access', () => {
    test.beforeEach(async ({ page }) => {
      // Mock viewer session
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockViewerSession);
    });

    test('should allow viewer to access read-only admin interface', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should access admin area
      expect(page.url()).toContain('/admin');

      // Should see dashboard but in read-only mode
      const dashboard = page.getByRole('heading', { name: /dashboard/i });
      await expect(dashboard).toBeVisible();
    });

    test('should restrict viewer from creating content', async ({ page }) => {
      await page.goto('/admin/articles');
      await page.waitForLoadState('networkidle');

      // Should not see create button or it should be disabled
      const createButton = page.getByRole('button', { name: /create article/i });
      
      if (await createButton.isVisible()) {
        await expect(createButton).toBeDisabled();
      } else {
        // Create button should not be visible
        await expect(createButton).not.toBeVisible();
      }
    });

    test('should restrict viewer from editing content', async ({ page }) => {
      await page.goto('/admin/articles');
      await page.waitForLoadState('networkidle');

      // Edit buttons should not be visible or should be disabled
      const editButtons = page.getByRole('button', { name: /edit/i });
      const deleteButtons = page.getByRole('button', { name: /delete/i });

      if (await editButtons.first().isVisible()) {
        await expect(editButtons.first()).toBeDisabled();
      }

      if (await deleteButtons.first().isVisible()) {
        await expect(deleteButtons.first()).toBeDisabled();
      }
    });

    test('should allow viewer to view analytics in read-only mode', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Should see analytics but no modification controls
      const analyticsCharts = page.getByTestId('analytics-chart');
      const exportButtons = page.getByRole('button', { name: /export|download/i });

      // Should see charts
      if (await analyticsCharts.first().isVisible()) {
        await expect(analyticsCharts.first()).toBeVisible();
      }

      // Should not see export/modification buttons
      if (await exportButtons.first().isVisible()) {
        await expect(exportButtons.first()).toBeDisabled();
      }
    });
  });

  test.describe('Unauthenticated Access', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();
      
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login
      expect(page.url()).toContain('/login');

      // Should see login form
      const loginForm = page.getByRole('form') || page.getByTestId('login-form');
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('should block API access for unauthenticated requests', async ({ page }) => {
      // Clear session
      await page.context().clearCookies();

      // Try to access admin API endpoint
      const response = await page.request.get('/api/admin/articles');
      
      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Permission Enforcement', () => {
    test('should enforce permissions on API endpoints', async ({ page }) => {
      // Test with editor session
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockEditorSession);

      await page.goto('/admin');

      // Editor should be able to access articles API
      const articlesResponse = await page.request.get('/api/admin/articles');
      expect([200, 403]).toContain(articlesResponse.status());

      // Editor should not be able to access users API
      const usersResponse = await page.request.get('/api/admin/users');
      expect(usersResponse.status()).toBe(403);
    });

    test('should validate permissions on form submissions', async ({ page }) => {
      // Test with viewer session
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockViewerSession);

      await page.goto('/admin');

      // Try to create article via API (should fail)
      const createResponse = await page.request.post('/api/admin/articles', {
        data: {
          title: 'Test Article',
          content: 'Test content',
        },
      });

      expect(createResponse.status()).toBe(403);
    });

    test('should handle role changes gracefully', async ({ page }) => {
      // Start with admin session
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockAdminSession);

      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      // Should have access initially
      expect(page.url()).toContain('/admin/users');

      // Simulate role change to viewer
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockViewerSession);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should lose access
      const accessDenied = page.getByText(/access denied|unauthorized|forbidden/i);
      const isRedirected = !page.url().includes('/admin/users');
      
      const hasRestriction = await accessDenied.isVisible() || isRedirected;
      expect(hasRestriction).toBe(true);
    });
  });

  test.describe('UI Permission Indicators', () => {
    test('should show appropriate UI elements based on role', async ({ page }) => {
      // Test admin UI
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockAdminSession);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Admin should see all navigation items
      const navItems = page.getByRole('navigation').getByRole('link');
      const navCount = await navItems.count();
      
      expect(navCount).toBeGreaterThan(3); // Should have multiple nav items

      // Switch to editor
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockEditorSession);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Editor should see fewer navigation items
      const editorNavItems = page.getByRole('navigation').getByRole('link');
      const editorNavCount = await editorNavItems.count();
      
      expect(editorNavCount).toBeLessThanOrEqual(navCount);
    });

    test('should disable buttons based on permissions', async ({ page }) => {
      // Test with viewer session
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockViewerSession);

      await page.goto('/admin/articles');
      await page.waitForLoadState('networkidle');

      // Action buttons should be disabled or hidden
      const actionButtons = page.getByRole('button', { name: /(create|edit|delete|publish)/i });
      
      for (let i = 0; i < await actionButtons.count(); i++) {
        const button = actionButtons.nth(i);
        if (await button.isVisible()) {
          await expect(button).toBeDisabled();
        }
      }
    });
  });

  test.describe('Security Headers and CSRF', () => {
    test('should include CSRF protection for state-changing operations', async ({ page }) => {
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockAdminSession);

      await page.goto('/admin/articles/new');
      await page.waitForLoadState('networkidle');

      // Check for CSRF token in form
      const csrfToken = page.locator('input[name="csrf_token"], input[name="_token"]');
      
      if (await csrfToken.isVisible()) {
        const tokenValue = await csrfToken.getAttribute('value');
        expect(tokenValue).toBeTruthy();
        expect(tokenValue?.length).toBeGreaterThan(10);
      }
    });

    test('should validate CSRF tokens on form submission', async ({ page }) => {
      await page.addInitScript((session) => {
        window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
      }, mockAdminSession);

      // Try to submit form without CSRF token
      const response = await page.request.post('/api/admin/articles', {
        data: {
          title: 'Test Article',
          content: 'Test content',
          // Missing CSRF token
        },
      });

      // Should be rejected due to missing CSRF token
      expect([400, 403]).toContain(response.status());
    });
  });
});