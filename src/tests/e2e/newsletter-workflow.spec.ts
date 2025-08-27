import { test, expect } from '@playwright/test';

test.describe('Newsletter User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/newsletter/issues', async (route) => {
      const mockIssues = {
        issues: [
          {
            id: '1',
            title: 'Weekly Tech Roundup #5',
            slug: 'weekly-tech-roundup-5',
            summary:
              'This week we cover the latest in AI breakthroughs, startup funding rounds, and developer tools.',
            issueNumber: 5,
            publishedAt: '2024-01-15T10:00:00Z',
            author: { name: 'Jane Smith' },
          },
          {
            id: '2',
            title: 'Developer Tools Deep Dive #4',
            slug: 'developer-tools-deep-dive-4',
            summary:
              'An in-depth look at the newest developer tools and frameworks that are changing how we build software.',
            issueNumber: 4,
            publishedAt: '2024-01-08T10:00:00Z',
            author: { name: 'Mike Johnson' },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };
      await route.fulfill({ json: mockIssues });
    });

    await page.route(
      '**/api/newsletter/issues/weekly-tech-roundup-5',
      async (route) => {
        const mockIssue = {
          issue: {
            id: '1',
            title: 'Weekly Tech Roundup #5',
            slug: 'weekly-tech-roundup-5',
            summary:
              'This week we cover the latest in AI breakthroughs, startup funding rounds, and developer tools.',
            content: {
              type: 'doc',
              content: [
                {
                  type: 'heading',
                  attrs: { level: 2 },
                  content: [
                    { type: 'text', text: 'AI Breakthroughs This Week' },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'This week has been remarkable for AI development with several major announcements...',
                    },
                  ],
                },
                {
                  type: 'heading',
                  attrs: { level: 2 },
                  content: [{ type: 'text', text: 'Startup Funding Rounds' }],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Several promising startups secured significant funding this week...',
                    },
                  ],
                },
              ],
            },
            issueNumber: 5,
            publishedAt: '2024-01-15T10:00:00Z',
            author: { name: 'Jane Smith', avatar: null },
          },
        };
        await route.fulfill({ json: mockIssue });
      }
    );

    // Mock newsletter subscription API
    await page.route('**/api/newsletter/subscribe', async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();

      if (body.email === 'test@example.com') {
        await route.fulfill({
          json: {
            success: true,
            message:
              'Subscription successful! Please check your email to confirm.',
          },
        });
      } else if (body.email === 'existing@example.com') {
        await route.fulfill({
          status: 400,
          json: { error: 'Email already subscribed' },
        });
      } else {
        await route.fulfill({
          status: 400,
          json: { error: 'Invalid email address' },
        });
      }
    });
  });

  test('user can browse newsletter archive', async ({ page }) => {
    await page.goto('/newsletter');

    // Check page title and heading
    await expect(page).toHaveTitle(/Newsletter/);
    await expect(
      page.getByRole('heading', { name: /Newsletter/i })
    ).toBeVisible();

    // Check that newsletter issue cards are displayed
    await expect(page.getByText('Weekly Tech Roundup #5')).toBeVisible();
    await expect(page.getByText('Developer Tools Deep Dive #4')).toBeVisible();

    // Check issue numbers are displayed
    await expect(page.getByText('Issue #5')).toBeVisible();
    await expect(page.getByText('Issue #4')).toBeVisible();

    // Check summaries are displayed
    await expect(
      page.getByText(/This week we cover the latest in AI breakthroughs/)
    ).toBeVisible();
    await expect(
      page.getByText(/An in-depth look at the newest developer tools/)
    ).toBeVisible();

    // Check author names are displayed
    await expect(page.getByText('By Jane Smith')).toBeVisible();
    await expect(page.getByText('By Mike Johnson')).toBeVisible();

    // Check publication dates are displayed
    await expect(page.getByText('Jan 15, 2024')).toBeVisible();
    await expect(page.getByText('Jan 8, 2024')).toBeVisible();
  });

  test('user can subscribe to newsletter', async ({ page }) => {
    await page.goto('/newsletter');

    // Check that subscription form is visible
    await expect(
      page.getByRole('heading', { name: /Subscribe to our Newsletter/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Subscribe/i })
    ).toBeVisible();

    // Fill in email and subscribe
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByRole('button', { name: /Subscribe/i }).click();

    // Check for success message
    await expect(
      page.getByText(
        /Subscription successful! Please check your email to confirm/
      )
    ).toBeVisible();
  });

  test('newsletter subscription handles validation errors', async ({
    page,
  }) => {
    await page.goto('/newsletter');

    // Try to subscribe with invalid email
    await page.getByPlaceholder('Enter your email').fill('invalid-email');
    await page.getByRole('button', { name: /Subscribe/i }).click();

    // Check for error message
    await expect(page.getByText(/Invalid email address/)).toBeVisible();

    // Try to subscribe with already subscribed email
    await page
      .getByPlaceholder('Enter your email')
      .fill('existing@example.com');
    await page.getByRole('button', { name: /Subscribe/i }).click();

    // Check for already subscribed message
    await expect(page.getByText(/Email already subscribed/)).toBeVisible();
  });

  test('user can view newsletter issue details', async ({ page }) => {
    await page.goto('/newsletter');

    // Click on a newsletter issue
    await page.getByText('Weekly Tech Roundup #5').click();

    // Check that we're on the issue detail page
    await expect(page).toHaveURL('/newsletter/weekly-tech-roundup-5');
    await expect(
      page.getByRole('heading', { name: 'Weekly Tech Roundup #5' })
    ).toBeVisible();

    // Check issue metadata
    await expect(page.getByText('Issue #5')).toBeVisible();
    await expect(page.getByText('By Jane Smith')).toBeVisible();
    await expect(page.getByText('Jan 15, 2024')).toBeVisible();

    // Check that content sections are displayed
    await expect(
      page.getByRole('heading', { name: 'AI Breakthroughs This Week' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Startup Funding Rounds' })
    ).toBeVisible();

    // Check that content paragraphs are displayed
    await expect(
      page.getByText(/This week has been remarkable for AI development/)
    ).toBeVisible();
    await expect(
      page.getByText(/Several promising startups secured significant funding/)
    ).toBeVisible();
  });

  test('newsletter issue page has social sharing options', async ({ page }) => {
    await page.goto('/newsletter/weekly-tech-roundup-5');

    // Check for social sharing buttons
    await expect(
      page.getByRole('button', { name: /Share on Twitter/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Share on LinkedIn/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Copy Link/i })
    ).toBeVisible();

    // Test copy link functionality
    await page.getByRole('button', { name: /Copy Link/i }).click();
    await expect(page.getByText(/Link copied to clipboard/)).toBeVisible();
  });

  test('newsletter pages are accessible via keyboard navigation', async ({
    page,
  }) => {
    await page.goto('/newsletter');

    // Test keyboard navigation through newsletter cards
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be on the subscription email input
    const emailInput = page.getByPlaceholder('Enter your email');
    await expect(emailInput).toBeFocused();

    // Navigate to newsletter cards
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be on the first newsletter link
    const firstNewsletterLink = page.getByRole('link').first();
    await expect(firstNewsletterLink).toBeFocused();

    // Press Enter to navigate to issue
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/newsletter/weekly-tech-roundup-5');

    // Test keyboard navigation within newsletter content
    await page.keyboard.press('Tab');

    // Focus should be on social sharing buttons
    const shareButton = page.getByRole('button', { name: /Share on Twitter/i });
    await expect(shareButton).toBeFocused();
  });

  test('newsletter pages work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/newsletter');

    // Check that newsletter cards are responsive
    await expect(page.getByText('Weekly Tech Roundup #5')).toBeVisible();
    await expect(page.getByText('Issue #5')).toBeVisible();

    // Check that subscription form is responsive
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Subscribe/i })
    ).toBeVisible();

    // Navigate to issue detail
    await page.getByText('Weekly Tech Roundup #5').click();
    await expect(page).toHaveURL('/newsletter/weekly-tech-roundup-5');

    // Check that content is readable on mobile
    await expect(
      page.getByRole('heading', { name: 'AI Breakthroughs This Week' })
    ).toBeVisible();
    await expect(
      page.getByText(/This week has been remarkable for AI development/)
    ).toBeVisible();

    // Test mobile subscription form
    await page.goto('/newsletter');
    await page.getByPlaceholder('Enter your email').tap();
    await page.getByPlaceholder('Enter your email').fill('mobile@example.com');
    await page.getByRole('button', { name: /Subscribe/i }).tap();
  });

  test('newsletter archive supports pagination', async ({ page }) => {
    // Mock paginated response
    await page.route('**/api/newsletter/issues?page=2', async (route) => {
      const paginatedIssues = {
        issues: [
          {
            id: '3',
            title: 'Tech Trends Analysis #3',
            slug: 'tech-trends-analysis-3',
            summary: 'Analyzing the biggest tech trends of the month.',
            issueNumber: 3,
            publishedAt: '2024-01-01T10:00:00Z',
            author: { name: 'Sarah Wilson' },
          },
        ],
        pagination: {
          page: 2,
          limit: 10,
          total: 3,
          totalPages: 2,
        },
      };
      await route.fulfill({ json: paginatedIssues });
    });

    await page.goto('/newsletter');

    // Check for pagination controls
    await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
    await expect(page.getByText('Page 1 of 2')).toBeVisible();

    // Navigate to next page
    await page.getByRole('button', { name: /Next/i }).click();

    // Check that new content is loaded
    await expect(page.getByText('Tech Trends Analysis #3')).toBeVisible();
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
  });

  test('newsletter pages handle loading states', async ({ page }) => {
    // Delay API response to test loading states
    await page.route('**/api/newsletter/issues', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        json: {
          issues: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      });
    });

    await page.goto('/newsletter');

    // Check for loading skeleton or spinner
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();

    // Wait for loading to complete
    await expect(page.getByTestId('loading-skeleton')).not.toBeVisible({
      timeout: 2000,
    });
  });

  test('newsletter pages handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/newsletter/issues', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Internal Server Error' },
      });
    });

    await page.goto('/newsletter');

    // Check for error message
    await expect(
      page.getByText(/error loading newsletter issues/i)
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /try again/i })
    ).toBeVisible();
  });

  test('newsletter subscription form shows loading state', async ({ page }) => {
    // Delay subscription API response
    await page.route('**/api/newsletter/subscribe', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        json: { success: true, message: 'Subscription successful!' },
      });
    });

    await page.goto('/newsletter');

    // Fill in email and subscribe
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByRole('button', { name: /Subscribe/i }).click();

    // Check for loading state
    await expect(
      page.getByRole('button', { name: /Subscribing.../i })
    ).toBeVisible();

    // Wait for success message
    await expect(page.getByText(/Subscription successful!/)).toBeVisible({
      timeout: 2000,
    });
  });

  test('newsletter issue page shows related issues', async ({ page }) => {
    await page.goto('/newsletter/weekly-tech-roundup-5');

    // Check for related issues section
    await expect(
      page.getByRole('heading', { name: /More Newsletter Issues/i })
    ).toBeVisible();

    // Should show other recent issues
    await expect(page.getByText('Developer Tools Deep Dive #4')).toBeVisible();
  });
});
