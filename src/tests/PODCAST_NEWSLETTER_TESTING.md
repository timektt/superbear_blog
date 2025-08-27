# Podcast & Newsletter Testing Documentation

This document provides comprehensive information about testing the podcast and newsletter features implemented in MEGA TASK 5.

## Overview

The testing suite covers all aspects of the podcast and newsletter functionality including:

- **Unit Tests**: Individual component and utility function testing
- **Integration Tests**: API endpoint and database interaction testing  
- **E2E Tests**: Complete user workflow testing
- **Accessibility Tests**: WCAG compliance and screen reader compatibility
- **Performance Tests**: Load times, theme switching, and optimization validation

## Test Structure

```
src/tests/
├── unit/components/
│   ├── PodcastCard.test.tsx
│   ├── AudioPlayer.test.tsx
│   ├── NewsletterIssueCard.test.tsx
│   ├── PodcastForm.test.tsx
│   └── NewsletterIssueForm.test.tsx
├── integration/api/
│   ├── podcast-endpoints.test.ts
│   └── newsletter-endpoints.test.ts
├── e2e/
│   ├── podcast-workflow.spec.ts
│   └── newsletter-workflow.spec.ts
├── accessibility/
│   └── podcast-newsletter-accessibility.test.ts
├── performance/
│   └── podcast-newsletter-performance.test.ts
└── podcast-newsletter-test-suite.ts
```

## Running Tests

### Complete Test Suite
```bash
npm run test:podcast-newsletter
```

### Individual Test Categories
```bash
# Unit tests only
npm run test:podcast-newsletter:unit

# Integration tests only  
npm run test:podcast-newsletter:integration

# E2E tests only
npm run test:podcast-newsletter:e2e

# Accessibility tests only
npm run test:podcast-newsletter:accessibility

# Performance tests only
npm run test:podcast-newsletter:performance
```

### Manual Test Commands
```bash
# Unit tests
npm run test:unit -- --testPathPattern="(PodcastCard|AudioPlayer|NewsletterIssueCard|PodcastForm|NewsletterIssueForm)"

# Integration tests
npm run test:integration -- --testPathPattern="(podcast-endpoints|newsletter-endpoints)"

# E2E tests
npx playwright test --grep "(podcast-workflow|newsletter-workflow)"

# Accessibility tests
npx playwright test --grep "accessibility"

# Performance tests
npx playwright test --grep "performance"
```

## Test Coverage

### Unit Tests Coverage

#### PodcastCard Component
- ✅ Renders podcast information correctly
- ✅ Handles missing optional fields gracefully
- ✅ Uses placeholder image when coverImage is null
- ✅ Creates correct links to detail pages
- ✅ Applies hover effects and transitions
- ✅ Formats duration and dates correctly
- ✅ Truncates long descriptions appropriately

#### AudioPlayer Component
- ✅ Renders with basic controls
- ✅ Renders simple audio element when showControls=false
- ✅ Toggles play/pause functionality
- ✅ Handles volume control and muting
- ✅ Supports seek functionality
- ✅ Shows loading states appropriately
- ✅ Updates time display during playback
- ✅ Handles audio end events
- ✅ Supports autoPlay when specified

#### NewsletterIssueCard Component
- ✅ Renders newsletter issue information correctly
- ✅ Handles missing optional summary
- ✅ Creates correct links to issue pages
- ✅ Applies hover effects and transitions
- ✅ Displays icons and formatting correctly
- ✅ Formats issue numbers and dates
- ✅ Truncates long titles and summaries

#### PodcastForm Component
- ✅ Renders create and edit forms correctly
- ✅ Validates required fields
- ✅ Generates slugs automatically
- ✅ Handles form submission with valid data
- ✅ Manages tag selection
- ✅ Handles cancel and loading states
- ✅ Validates slug format
- ✅ Manages episode and season numbers
- ✅ Shows publish date field conditionally

#### NewsletterIssueForm Component
- ✅ Renders create and edit forms correctly
- ✅ Validates required fields
- ✅ Generates slugs automatically
- ✅ Handles form submission with valid data
- ✅ Manages summary character limits
- ✅ Shows appropriate action buttons
- ✅ Handles publish and send functionality
- ✅ Validates slug format
- ✅ Shows issue information correctly

### Integration Tests Coverage

#### Podcast API Endpoints
- ✅ GET /api/podcasts - Returns published podcasts with pagination
- ✅ GET /api/podcasts - Filters by category and search
- ✅ GET /api/podcasts/[slug] - Returns podcast by slug
- ✅ GET /api/podcasts/[slug] - Returns 404 for non-existent/draft podcasts
- ✅ GET /api/admin/podcasts - Returns all podcasts for authenticated admin
- ✅ GET /api/admin/podcasts - Returns 401/403 for unauthorized users
- ✅ POST /api/admin/podcasts - Creates new podcast for authenticated admin
- ✅ POST /api/admin/podcasts - Validates required fields and handles errors
- ✅ PUT /api/admin/podcasts/[id] - Updates existing podcast
- ✅ DELETE /api/admin/podcasts/[id] - Deletes existing podcast

#### Newsletter API Endpoints
- ✅ GET /api/newsletter/issues - Returns published issues with pagination
- ✅ GET /api/newsletter/issues - Orders by issue number descending
- ✅ GET /api/newsletter/issues/[slug] - Returns issue by slug
- ✅ GET /api/newsletter/issues/[slug] - Returns 404 for non-existent/draft issues
- ✅ GET /api/admin/newsletter/issues - Returns all issues for authenticated admin
- ✅ GET /api/admin/newsletter/issues - Filters by status when provided
- ✅ POST /api/admin/newsletter/issues - Creates new issue with auto-generated number
- ✅ POST /api/admin/newsletter/issues - Validates required fields and handles errors
- ✅ PUT /api/admin/newsletter/issues/[id] - Updates existing issue
- ✅ PUT /api/admin/newsletter/issues/[id] - Prevents editing sent newsletters

### E2E Tests Coverage

#### Podcast User Workflow
- ✅ User can browse podcast episodes
- ✅ User can filter podcasts by category
- ✅ User can search for podcasts
- ✅ User can view podcast episode details
- ✅ User can interact with audio player
- ✅ Keyboard navigation works correctly
- ✅ Mobile responsiveness functions properly
- ✅ Loading and error states are handled
- ✅ Related episodes are displayed

#### Newsletter User Workflow
- ✅ User can browse newsletter archive
- ✅ User can subscribe to newsletter
- ✅ Newsletter subscription handles validation errors
- ✅ User can view newsletter issue details
- ✅ Social sharing options are available
- ✅ Keyboard navigation works correctly
- ✅ Mobile responsiveness functions properly
- ✅ Pagination works correctly
- ✅ Loading and error states are handled

### Accessibility Tests Coverage
- ✅ Podcast listing page meets WCAG 2.1 AA standards
- ✅ Podcast detail page meets WCAG 2.1 AA standards
- ✅ Newsletter archive page meets WCAG 2.1 AA standards
- ✅ Newsletter issue page meets WCAG 2.1 AA standards
- ✅ Audio player has proper accessibility attributes
- ✅ Podcast cards have proper semantic structure
- ✅ Newsletter subscription form is accessible
- ✅ Keyboard navigation works throughout
- ✅ Screen reader announcements work correctly
- ✅ Color contrast meets accessibility standards
- ✅ Focus indicators are visible and clear
- ✅ Images have appropriate alt text
- ✅ Form error messages are accessible

### Performance Tests Coverage
- ✅ Podcast listing page loads within performance budget (< 2s)
- ✅ Newsletter archive page loads within performance budget (< 2s)
- ✅ Theme switching is smooth and fast (< 500ms)
- ✅ Audio player initialization is fast (< 1s)
- ✅ Large podcast grid renders efficiently (< 3s for 100 items)
- ✅ Newsletter rich text content renders efficiently (< 2s)
- ✅ Image loading is optimized with lazy loading
- ✅ API response times are within acceptable limits (< 500ms)
- ✅ Search functionality is responsive (< 1s)
- ✅ Pagination navigation is smooth (< 800ms)
- ✅ Memory usage remains stable during navigation
- ✅ CSS animations are smooth with proper transitions

## Test Configuration

### Jest Configuration
The project uses Jest for unit and integration tests with the following key configurations:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx,ts,tsx}',
    'src/lib/**/*.{js,ts}',
    'src/app/api/**/*.{js,ts}',
  ],
};
```

### Playwright Configuration
E2E, accessibility, and performance tests use Playwright:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

## Mocking Strategy

### API Mocking
Tests use consistent mocking strategies:

```typescript
// Example API mock for podcasts
await page.route('**/api/podcasts', async (route) => {
  const mockPodcasts = {
    podcasts: [
      {
        id: '1',
        title: 'Test Podcast',
        slug: 'test-podcast',
        // ... other properties
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };
  await route.fulfill({ json: mockPodcasts });
});
```

### Component Mocking
Unit tests mock external dependencies:

```typescript
// Mock external hooks and components
jest.mock('@/lib/hooks/useToast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
```

## Continuous Integration

### GitHub Actions Integration
The test suite integrates with CI/CD pipelines:

```yaml
# .github/workflows/test-podcast-newsletter.yml
name: Podcast & Newsletter Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:podcast-newsletter
```

### Pre-deployment Validation
Tests run automatically before deployment:

```bash
# Pre-deployment check
npm run deploy:check
# Includes: type-check, lint, test:podcast-newsletter, build:prod
```

## Quality Metrics

### Coverage Targets
- Unit Test Coverage: > 90%
- Integration Test Coverage: > 85%
- E2E Test Coverage: All critical user paths
- Accessibility Compliance: WCAG 2.1 AA
- Performance Budget: < 2s initial load, < 500ms interactions

### Success Criteria
All tests must pass for the following scenarios:
- ✅ New podcast episode creation and management
- ✅ Newsletter issue creation and publishing
- ✅ Public podcast browsing and playback
- ✅ Newsletter archive browsing and subscription
- ✅ Theme switching across all pages
- ✅ Mobile and desktop responsiveness
- ✅ Keyboard and screen reader accessibility
- ✅ Performance within established budgets

## Troubleshooting

### Common Issues

#### Test Timeouts
```bash
# Increase timeout for slow tests
npx playwright test --timeout=60000
```

#### Mock API Issues
```bash
# Clear Jest cache
npm test -- --clearCache
```

#### Accessibility Test Failures
```bash
# Run with detailed axe-core output
npx playwright test --grep "accessibility" --reporter=line
```

#### Performance Test Variations
```bash
# Run performance tests multiple times for consistency
for i in {1..3}; do npm run test:podcast-newsletter:performance; done
```

### Debug Mode
```bash
# Run tests in debug mode
npx playwright test --debug --grep "podcast-workflow"

# Run Jest tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Maintenance

### Regular Updates
- Update test data monthly to reflect realistic content
- Review performance budgets quarterly
- Update accessibility standards as WCAG evolves
- Refresh E2E test scenarios based on user feedback

### Test Data Management
- Use factories for consistent test data generation
- Maintain separate test databases for integration tests
- Clean up test artifacts after each test run
- Version control test fixtures and mock data

This comprehensive testing suite ensures that the podcast and newsletter features are robust, accessible, performant, and user-friendly across all supported platforms and devices.