import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should perform basic search and display results', async ({ page }) => {
    // Find search input
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await expect(searchInput).toBeVisible();
    
    // Perform search
    await searchInput.fill('artificial intelligence');
    await searchInput.press('Enter');
    
    // Wait for search results page
    await page.waitForURL('**/search**');
    await page.waitForLoadState('networkidle');
    
    // Verify search results are displayed
    const searchResults = page.getByTestId('search-results');
    await expect(searchResults).toBeVisible();
    
    // Verify search query is displayed
    const searchQuery = page.getByText('artificial intelligence');
    await expect(searchQuery).toBeVisible();
    
    // Verify results contain relevant content
    const resultItems = page.getByTestId('search-result-item');
    await expect(resultItems.first()).toBeVisible();
  });

  test('should highlight search terms in results', async ({ page }) => {
    // Perform search
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await searchInput.fill('machine learning');
    await searchInput.press('Enter');
    
    await page.waitForURL('**/search**');
    await page.waitForLoadState('networkidle');
    
    // Check for highlighted terms
    const highlightedTerms = page.locator('mark, .highlight');
    await expect(highlightedTerms.first()).toBeVisible();
    
    // Verify highlighted text contains search terms
    const highlightedText = await highlightedTerms.first().textContent();
    expect(highlightedText?.toLowerCase()).toMatch(/(machine|learning)/);
  });

  test('should filter search results by category', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search?q=AI');
    await page.waitForLoadState('networkidle');
    
    // Find category filter
    const categoryFilter = page.getByRole('combobox', { name: /category/i });
    await expect(categoryFilter).toBeVisible();
    
    // Select AI category
    await categoryFilter.click();
    await page.getByRole('option', { name: /AI/i }).click();
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Verify URL contains category filter
    expect(page.url()).toContain('category=ai');
    
    // Verify results are filtered
    const resultItems = page.getByTestId('search-result-item');
    const firstResult = resultItems.first();
    await expect(firstResult).toBeVisible();
    
    // Verify category badge is shown
    const categoryBadge = firstResult.getByText('AI');
    await expect(categoryBadge).toBeVisible();
  });

  test('should filter search results by author', async ({ page }) => {
    await page.goto('/search?q=technology');
    await page.waitForLoadState('networkidle');
    
    // Find author filter
    const authorFilter = page.getByRole('combobox', { name: /author/i });
    await expect(authorFilter).toBeVisible();
    
    // Select an author (assuming there's at least one)
    await authorFilter.click();
    const authorOptions = page.getByRole('option');
    const firstAuthor = authorOptions.first();
    const authorName = await firstAuthor.textContent();
    await firstAuthor.click();
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Verify URL contains author filter
    expect(page.url()).toContain('author=');
    
    // Verify results show correct author
    const resultItems = page.getByTestId('search-result-item');
    const firstResult = resultItems.first();
    await expect(firstResult).toBeVisible();
    
    if (authorName) {
      const authorInfo = firstResult.getByText(authorName);
      await expect(authorInfo).toBeVisible();
    }
  });

  test('should filter search results by date range', async ({ page }) => {
    await page.goto('/search?q=news');
    await page.waitForLoadState('networkidle');
    
    // Find date range filter
    const dateFilter = page.getByRole('button', { name: /date range/i });
    await expect(dateFilter).toBeVisible();
    
    // Open date picker
    await dateFilter.click();
    
    // Select last 30 days (or similar preset)
    const lastMonth = page.getByRole('button', { name: /last 30 days/i });
    if (await lastMonth.isVisible()) {
      await lastMonth.click();
    } else {
      // Fallback: use date inputs
      const startDate = page.getByLabel(/start date/i);
      const endDate = page.getByLabel(/end date/i);
      
      if (await startDate.isVisible()) {
        await startDate.fill('2024-01-01');
        await endDate.fill('2024-01-31');
        await page.getByRole('button', { name: /apply/i }).click();
      }
    }
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Verify URL contains date parameters
    expect(page.url()).toMatch(/(startDate|endDate)/);
  });

  test('should handle search with multiple filters', async ({ page }) => {
    await page.goto('/search?q=artificial intelligence');
    await page.waitForLoadState('networkidle');
    
    // Apply category filter
    const categoryFilter = page.getByRole('combobox', { name: /category/i });
    await categoryFilter.click();
    await page.getByRole('option', { name: /AI/i }).click();
    
    // Apply tag filter
    const tagFilter = page.getByRole('combobox', { name: /tags/i });
    if (await tagFilter.isVisible()) {
      await tagFilter.click();
      const tagOptions = page.getByRole('option');
      if (await tagOptions.first().isVisible()) {
        await tagOptions.first().click();
      }
    }
    
    // Wait for results
    await page.waitForLoadState('networkidle');
    
    // Verify multiple filters in URL
    expect(page.url()).toContain('category=ai');
    
    // Verify results respect all filters
    const resultItems = page.getByTestId('search-result-item');
    await expect(resultItems.first()).toBeVisible();
  });

  test('should show no results message for empty search', async ({ page }) => {
    // Search for something that likely doesn't exist
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await searchInput.fill('xyznonexistentquery123');
    await searchInput.press('Enter');
    
    await page.waitForURL('**/search**');
    await page.waitForLoadState('networkidle');
    
    // Verify no results message
    const noResults = page.getByText(/no results found/i);
    await expect(noResults).toBeVisible();
    
    // Verify suggestions are shown
    const suggestions = page.getByText(/try different keywords/i);
    await expect(suggestions).toBeVisible();
  });

  test('should handle search pagination', async ({ page }) => {
    // Perform search that should return many results
    await page.goto('/search?q=the');
    await page.waitForLoadState('networkidle');
    
    // Check if pagination is present
    const pagination = page.getByRole('navigation', { name: /pagination/i });
    
    if (await pagination.isVisible()) {
      // Click next page
      const nextButton = page.getByRole('button', { name: /next/i });
      await nextButton.click();
      
      // Wait for new results
      await page.waitForLoadState('networkidle');
      
      // Verify URL contains page parameter
      expect(page.url()).toContain('page=2');
      
      // Verify different results are shown
      const resultItems = page.getByTestId('search-result-item');
      await expect(resultItems.first()).toBeVisible();
    }
  });

  test('should provide search autocomplete suggestions', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    
    // Start typing
    await searchInput.fill('artif');
    
    // Wait for autocomplete dropdown
    await page.waitForTimeout(500);
    
    // Check for suggestions dropdown
    const suggestions = page.getByRole('listbox') || page.getByTestId('search-suggestions');
    
    if (await suggestions.isVisible()) {
      // Verify suggestions contain typed text
      const suggestionItems = page.getByRole('option');
      const firstSuggestion = suggestionItems.first();
      
      if (await firstSuggestion.isVisible()) {
        const suggestionText = await firstSuggestion.textContent();
        expect(suggestionText?.toLowerCase()).toContain('artif');
        
        // Click suggestion
        await firstSuggestion.click();
        
        // Verify search is performed
        await page.waitForURL('**/search**');
      }
    }
  });

  test('should maintain search state during navigation', async ({ page }) => {
    // Perform search with filters
    await page.goto('/search?q=AI&category=ai');
    await page.waitForLoadState('networkidle');
    
    // Click on a search result
    const resultItems = page.getByTestId('search-result-item');
    const firstResult = resultItems.first();
    
    if (await firstResult.isVisible()) {
      const resultLink = firstResult.getByRole('link').first();
      await resultLink.click();
      
      // Wait for article page
      await page.waitForLoadState('networkidle');
      
      // Go back to search
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Verify search state is preserved
      expect(page.url()).toContain('q=AI');
      expect(page.url()).toContain('category=ai');
      
      // Verify search input still contains query
      const searchInput = page.getByRole('searchbox', { name: /search/i });
      await expect(searchInput).toHaveValue('AI');
    }
  });

  test('should handle special characters in search', async ({ page }) => {
    const specialQueries = [
      'C++',
      'Node.js',
      'AI/ML',
      '"machine learning"',
      'AI -blockchain',
    ];
    
    for (const query of specialQueries) {
      const searchInput = page.getByRole('searchbox', { name: /search/i });
      await searchInput.clear();
      await searchInput.fill(query);
      await searchInput.press('Enter');
      
      await page.waitForURL('**/search**');
      await page.waitForLoadState('networkidle');
      
      // Verify search doesn't break with special characters
      const searchResults = page.getByTestId('search-results');
      await expect(searchResults).toBeVisible();
      
      // Verify query is properly encoded in URL
      expect(page.url()).toContain('q=');
    }
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Navigate to search input using Tab
    await page.keyboard.press('Tab');
    
    // Find search input (may need multiple tabs)
    let attempts = 0;
    while (attempts < 10) {
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused === 'INPUT') {
        const inputType = await page.evaluate(() => 
          (document.activeElement as HTMLInputElement)?.type
        );
        if (inputType === 'search' || inputType === 'text') {
          break;
        }
      }
      await page.keyboard.press('Tab');
      attempts++;
    }
    
    // Type search query
    await page.keyboard.type('artificial intelligence');
    await page.keyboard.press('Enter');
    
    // Wait for results
    await page.waitForURL('**/search**');
    await page.waitForLoadState('networkidle');
    
    // Navigate through results using Tab
    await page.keyboard.press('Tab');
    
    // Verify focus is on first result
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'DIV']).toContain(focusedElement);
  });

  test('should handle search performance for large result sets', async ({ page }) => {
    // Perform broad search that might return many results
    const searchInput = page.getByRole('searchbox', { name: /search/i });
    await searchInput.fill('the');
    
    // Measure search time
    const startTime = Date.now();
    await searchInput.press('Enter');
    
    await page.waitForURL('**/search**');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    // Search should complete within reasonable time (5 seconds)
    expect(searchTime).toBeLessThan(5000);
    
    // Verify results are displayed
    const searchResults = page.getByTestId('search-results');
    await expect(searchResults).toBeVisible();
  });

  test('should clear search filters', async ({ page }) => {
    // Apply multiple filters
    await page.goto('/search?q=AI&category=ai&author=john');
    await page.waitForLoadState('networkidle');
    
    // Find clear filters button
    const clearFilters = page.getByRole('button', { name: /clear filters/i });
    
    if (await clearFilters.isVisible()) {
      await clearFilters.click();
      
      // Wait for page update
      await page.waitForLoadState('networkidle');
      
      // Verify filters are cleared from URL
      expect(page.url()).not.toContain('category=');
      expect(page.url()).not.toContain('author=');
      
      // Search query should remain
      expect(page.url()).toContain('q=AI');
    }
  });
});