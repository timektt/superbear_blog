import { test, expect } from '@playwright/test';

test.describe('Podcast User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/podcasts', async (route) => {
      const mockPodcasts = {
        podcasts: [
          {
            id: '1',
            title: 'The Future of AI Development',
            slug: 'future-of-ai-development',
            description: 'A deep dive into the latest AI development trends and their impact on software engineering.',
            coverImage: 'https://example.com/ai-podcast-cover.jpg',
            duration: 2400, // 40 minutes
            episodeNumber: 15,
            publishedAt: '2024-01-15T10:00:00Z',
            author: { name: 'Dr. Sarah Chen' },
            category: { name: 'Technology', slug: 'technology' },
          },
          {
            id: '2',
            title: 'Startup Funding Strategies',
            slug: 'startup-funding-strategies',
            description: 'Expert insights on securing funding for your tech startup in 2024.',
            coverImage: 'https://example.com/startup-podcast-cover.jpg',
            duration: 1800, // 30 minutes
            episodeNumber: 14,
            publishedAt: '2024-01-08T10:00:00Z',
            author: { name: 'Mark Rodriguez' },
            category: { name: 'Business', slug: 'business' },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };
      await route.fulfill({ json: mockPodcasts });
    });

    await page.route('**/api/podcasts/future-of-ai-development', async (route) => {
      const mockPodcast = {
        podcast: {
          id: '1',
          title: 'The Future of AI Development',
          slug: 'future-of-ai-development',
          description: 'A comprehensive discussion about the future of AI development, covering machine learning trends, ethical considerations, and the impact on software engineering practices.',
          summary: 'A deep dive into the latest AI development trends and their impact on software engineering.',
          audioUrl: 'https://example.com/ai-podcast-audio.mp3',
          coverImage: 'https://example.com/ai-podcast-cover.jpg',
          duration: 2400,
          episodeNumber: 15,
          seasonNumber: 1,
          publishedAt: '2024-01-15T10:00:00Z',
          author: { name: 'Dr. Sarah Chen', avatar: null },
          category: { name: 'Technology', slug: 'technology' },
          tags: [
            { name: 'AI', slug: 'ai' },
            { name: 'Machine Learning', slug: 'machine-learning' },
          ],
        },
      };
      await route.fulfill({ json: mockPodcast });
    });
  });

  test('user can browse podcast episodes', async ({ page }) => {
    await page.goto('/podcasts');

    // Check page title and heading
    await expect(page).toHaveTitle(/Podcasts/);
    await expect(page.getByRole('heading', { name: /Podcasts/i })).toBeVisible();

    // Check that podcast cards are displayed
    await expect(page.getByText('The Future of AI Development')).toBeVisible();
    await expect(page.getByText('Startup Funding Strategies')).toBeVisible();

    // Check episode numbers are displayed
    await expect(page.getByText('Episode 15')).toBeVisible();
    await expect(page.getByText('Episode 14')).toBeVisible();

    // Check durations are formatted correctly
    await expect(page.getByText('40:00')).toBeVisible();
    await expect(page.getByText('30:00')).toBeVisible();

    // Check author names are displayed
    await expect(page.getByText('By Dr. Sarah Chen')).toBeVisible();
    await expect(page.getByText('By Mark Rodriguez')).toBeVisible();

    // Check categories are displayed
    await expect(page.getByText('Technology')).toBeVisible();
    await expect(page.getByText('Business')).toBeVisible();
  });

  test('user can filter podcasts by category', async ({ page }) => {
    await page.goto('/podcasts');

    // Mock filtered API response
    await page.route('**/api/podcasts?category=technology', async (route) => {
      const filteredPodcasts = {
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
      await route.fulfill({ json: filteredPodcasts });
    });

    // Click on Technology filter
    await page.getByRole('button', { name: 'Technology' }).click();

    // Check that only technology podcasts are shown
    await expect(page.getByText('The Future of AI Development')).toBeVisible();
    await expect(page.getByText('Startup Funding Strategies')).not.toBeVisible();
  });

  test('user can search for podcasts', async ({ page }) => {
    await page.goto('/podcasts');

    // Mock search API response
    await page.route('**/api/podcasts?search=AI', async (route) => {
      const searchResults = {
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
      await route.fulfill({ json: searchResults });
    });

    // Search for AI podcasts
    await page.getByPlaceholder('Search podcasts...').fill('AI');
    await page.getByRole('button', { name: 'Search' }).click();

    // Check search results
    await expect(page.getByText('The Future of AI Development')).toBeVisible();
    await expect(page.getByText('Startup Funding Strategies')).not.toBeVisible();
  });

  test('user can view podcast episode details', async ({ page }) => {
    await page.goto('/podcasts');

    // Click on a podcast episode
    await page.getByText('The Future of AI Development').click();

    // Check that we're on the episode detail page
    await expect(page).toHaveURL('/podcasts/future-of-ai-development');
    await expect(page.getByRole('heading', { name: 'The Future of AI Development' })).toBeVisible();

    // Check episode metadata
    await expect(page.getByText('Episode 15')).toBeVisible();
    await expect(page.getByText('Season 1')).toBeVisible();
    await expect(page.getByText('40:00')).toBeVisible();
    await expect(page.getByText('By Dr. Sarah Chen')).toBeVisible();
    await expect(page.getByText('Technology')).toBeVisible();

    // Check tags
    await expect(page.getByText('AI')).toBeVisible();
    await expect(page.getByText('Machine Learning')).toBeVisible();

    // Check full description is displayed
    await expect(page.getByText(/comprehensive discussion about the future of AI development/)).toBeVisible();
  });

  test('user can interact with audio player', async ({ page }) => {
    await page.goto('/podcasts/future-of-ai-development');

    // Check that audio player is present
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByLabelText('Seek audio position')).toBeVisible();
    await expect(page.getByLabelText('Volume control')).toBeVisible();

    // Check time display
    await expect(page.getByText('00:00')).toBeVisible();
    await expect(page.getByText('40:00')).toBeVisible();

    // Test play button (note: actual audio playback testing is limited in E2E)
    await page.getByRole('button', { name: 'Play' }).click();
    
    // After clicking play, button should change to pause
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

    // Test mute button
    await page.getByRole('button', { name: 'Mute' }).click();
    await expect(page.getByRole('button', { name: 'Unmute' })).toBeVisible();
  });

  test('podcast pages are accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/podcasts');

    // Test keyboard navigation through podcast cards
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should be on the first podcast link
    const firstPodcastLink = page.getByRole('link').first();
    await expect(firstPodcastLink).toBeFocused();

    // Press Enter to navigate to episode
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/podcasts/future-of-ai-development');

    // Test keyboard navigation in audio player
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should be on play button
    const playButton = page.getByRole('button', { name: 'Play' });
    await expect(playButton).toBeFocused();

    // Press Space to play
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('podcast pages work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/podcasts');

    // Check that podcast cards are responsive
    await expect(page.getByText('The Future of AI Development')).toBeVisible();
    await expect(page.getByText('Episode 15')).toBeVisible();

    // Navigate to episode detail
    await page.getByText('The Future of AI Development').click();
    await expect(page).toHaveURL('/podcasts/future-of-ai-development');

    // Check that audio player is responsive
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByLabelText('Seek audio position')).toBeVisible();

    // Test touch interaction with play button
    await page.getByRole('button', { name: 'Play' }).tap();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('podcast pages handle loading states', async ({ page }) => {
    // Delay API response to test loading states
    await page.route('**/api/podcasts', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ json: { podcasts: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
    });

    await page.goto('/podcasts');

    // Check for loading skeleton or spinner
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();
    
    // Wait for loading to complete
    await expect(page.getByTestId('loading-skeleton')).not.toBeVisible({ timeout: 2000 });
  });

  test('podcast pages handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/podcasts', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'Internal Server Error' } });
    });

    await page.goto('/podcasts');

    // Check for error message
    await expect(page.getByText(/error loading podcasts/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });

  test('podcast episode page shows related episodes', async ({ page }) => {
    await page.goto('/podcasts/future-of-ai-development');

    // Check for related episodes section
    await expect(page.getByRole('heading', { name: /related episodes/i })).toBeVisible();
    
    // Should show other episodes from the same category or author
    await expect(page.getByText('Startup Funding Strategies')).toBeVisible();
  });
});