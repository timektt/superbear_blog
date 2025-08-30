# 🧪 Testing Overview

SuperBear Blog includes a comprehensive testing suite ensuring reliability, performance, and accessibility across all features.

## 📊 Testing Strategy

### 🎯 Testing Pyramid

```
                    🔺 E2E Tests (10%)
                   /   \
                  /     \
                 /       \
                /         \
               /           \
              /             \
             /               \
            🔺 Integration (20%)
           /                   \
          /                     \
         /                       \
        /                         \
       /                           \
      /                             \
     🔺 Unit Tests (70%)
```

### 📋 Test Categories

#### **🔬 Unit Tests (70%)**
- **Components**: React component testing with React Testing Library
- **Utilities**: Pure function testing with comprehensive edge cases
- **Hooks**: Custom React hooks testing with renderHook
- **Validation**: Zod schema validation testing
- **Business Logic**: Core application logic testing

#### **🔗 Integration Tests (20%)**
- **API Endpoints**: Full API route testing with database
- **Database Operations**: Prisma ORM integration testing
- **Authentication**: NextAuth.js integration testing
- **External Services**: Cloudinary, email service integration
- **Middleware**: Authentication, CSRF, rate limiting testing

#### **🎭 End-to-End Tests (10%)**
- **User Journeys**: Complete user workflow testing
- **Cross-browser**: Chrome, Firefox, Safari, Edge testing
- **Mobile Testing**: Responsive design and touch interactions
- **Accessibility**: Screen reader and keyboard navigation
- **Performance**: Core Web Vitals and load time testing

## 🧪 Test Suites

### **📁 Test Structure**
```
src/tests/
├── 🔬 unit/                    # Unit tests (fast, isolated)
│   ├── components/             # React component tests
│   ├── lib/                   # Utility function tests
│   └── hooks/                 # Custom hook tests
├── 🔗 integration/            # Integration tests (with DB)
│   ├── api/                   # API endpoint tests
│   └── media/                 # Media system tests
├── 🎭 e2e/                    # End-to-end tests (full browser)
│   ├── admin/                 # Admin interface tests
│   ├── public/                # Public site tests
│   └── workflows/             # User journey tests
├── ♿ accessibility/           # Accessibility compliance tests
├── ⚡ performance/             # Performance and load tests
├── 🔒 security/               # Security and vulnerability tests
└── 🚨 smoke/                  # Production smoke tests
```

### **🎯 Coverage Goals**

| Test Type | Coverage Target | Current Status |
|-----------|----------------|----------------|
| Unit Tests | 90%+ | ✅ 94% |
| Integration Tests | 85%+ | ✅ 88% |
| E2E Tests | Critical paths | ✅ 100% |
| Accessibility | WCAG 2.1 AA | ✅ Compliant |
| Performance | Core Web Vitals | ✅ All Green |

## 🚀 Running Tests

### **⚡ Quick Commands**
```bash
# Run all tests
npm run test:all

# Development testing
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report

# Specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # End-to-end tests only
npm run test:accessibility  # Accessibility tests only
npm run test:security      # Security tests only
npm run test:performance   # Performance tests only
```

### **🎭 E2E Testing Options**
```bash
# E2E test variations
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:headed    # Run in headed mode (visible browser)
npm run test:e2e:production # Production-specific tests
npm run test:smoke         # Quick smoke tests
```

### **📊 Specialized Test Suites**
```bash
# Feature-specific tests
npm run test:podcast-newsletter    # Podcast & newsletter features
npm run test:layout               # Layout component tests

# CI/CD optimized
npm run test:ci                   # Optimized for CI/CD pipeline
```

## 🔧 Test Configuration

### **⚙️ Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### **🎭 Playwright Configuration**
```javascript
// playwright.config.ts
export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  ]
})
```

## 📊 Test Examples

### **🔬 Unit Test Example**
```typescript
// src/tests/unit/lib/slug-generator.test.ts
import { generateSlug } from '@/lib/slug-generator'

describe('generateSlug', () => {
  it('should generate URL-friendly slug from title', () => {
    const title = 'The Future of AI Development'
    const slug = generateSlug(title)
    
    expect(slug).toBe('the-future-of-ai-development')
  })

  it('should handle special characters', () => {
    const title = 'React & Next.js: A Perfect Match!'
    const slug = generateSlug(title)
    
    expect(slug).toBe('react-nextjs-a-perfect-match')
  })

  it('should ensure uniqueness with existing slugs', async () => {
    const existingSlugs = ['ai-development', 'ai-development-1']
    const slug = await generateUniqueSlug('AI Development', existingSlugs)
    
    expect(slug).toBe('ai-development-2')
  })
})
```

### **🔗 Integration Test Example**
```typescript
// src/tests/integration/api/articles.test.ts
import { GET, POST } from '@/app/api/admin/articles/route'
import { createMockRequest } from '@/tests/utils/test-helpers'

describe('/api/admin/articles', () => {
  it('should create article with valid data', async () => {
    const articleData = {
      title: 'Test Article',
      content: { type: 'doc', content: [] },
      categoryId: 'category-id',
      status: 'PUBLISHED'
    }

    const request = createMockRequest('POST', articleData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.article.title).toBe('Test Article')
  })

  it('should validate required fields', async () => {
    const invalidData = { title: '' } // Missing required fields

    const request = createMockRequest('POST', invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})
```

### **🎭 E2E Test Example**
```typescript
// src/tests/e2e/admin-article-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin Article Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login')
    await page.fill('[data-testid="email"]', 'admin@superbear.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
  })

  test('should create new article', async ({ page }) => {
    await page.goto('/admin/articles/new')
    
    // Fill article form
    await page.fill('[data-testid="article-title"]', 'Test Article')
    await page.fill('[data-testid="article-content"]', 'This is test content')
    
    // Select category
    await page.selectOption('[data-testid="category-select"]', 'ai')
    
    // Publish article
    await page.click('[data-testid="publish-button"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/articles\/[\w-]+/)
  })

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/admin/articles/new')
    
    // Try to submit empty form
    await page.click('[data-testid="publish-button"]')
    
    // Check validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required')
    await expect(page.locator('[data-testid="content-error"]')).toContainText('Content is required')
  })
})
```

## ♿ Accessibility Testing

### **🎯 Accessibility Standards**
- **WCAG 2.1 AA Compliance** - All components meet accessibility standards
- **Screen Reader Support** - Proper ARIA labels and semantic HTML
- **Keyboard Navigation** - Full keyboard accessibility
- **Color Contrast** - 4.5:1 minimum contrast ratio
- **Focus Management** - Logical focus order and visible focus indicators

### **🧪 Accessibility Test Example**
```typescript
// src/tests/accessibility/keyboard-navigation.test.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Keyboard Navigation', () => {
  test('should navigate admin interface with keyboard only', async ({ page }) => {
    await page.goto('/admin/articles')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'main-nav')
    
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input')
    
    // Test accessibility with axe
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

## ⚡ Performance Testing

### **📊 Performance Metrics**
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Page Load Time**: <1.5s for critical pages
- **Bundle Size**: <200KB gzipped initial load
- **API Response Time**: <200ms average
- **Database Query Time**: <100ms average

### **🧪 Performance Test Example**
```typescript
// src/tests/performance/page-load-performance.test.ts
import { test, expect } from '@playwright/test'

test.describe('Page Load Performance', () => {
  test('homepage should load within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(1500) // 1.5 seconds
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          resolve(entries.map(entry => ({
            name: entry.name,
            value: entry.value
          })))
        }).observe({ entryTypes: ['web-vitals'] })
      })
    })
    
    // Validate metrics
    const lcp = metrics.find(m => m.name === 'LCP')
    expect(lcp?.value).toBeLessThan(2500) // 2.5 seconds
  })
})
```

## 🔒 Security Testing

### **🛡️ Security Test Categories**
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API abuse prevention
- **Input Validation**: SQL injection and XSS prevention
- **Authentication**: Login security and session management
- **Authorization**: Role-based access control testing

### **🧪 Security Test Example**
```typescript
// src/tests/security/csrf-protection.test.ts
import { test, expect } from '@playwright/test'

test.describe('CSRF Protection', () => {
  test('should reject requests without CSRF token', async ({ page }) => {
    // Try to make request without CSRF token
    const response = await page.evaluate(async () => {
      return fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' })
      })
    })
    
    expect(response.status).toBe(403)
  })

  test('should accept requests with valid CSRF token', async ({ page }) => {
    await page.goto('/admin/login')
    // Login process...
    
    // Get CSRF token
    const csrfToken = await page.evaluate(async () => {
      const response = await fetch('/api/csrf')
      const data = await response.json()
      return data.csrfToken
    })
    
    // Make request with CSRF token
    const response = await page.evaluate(async (token) => {
      return fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({
          title: 'Test Article',
          content: { type: 'doc', content: [] }
        })
      })
    }, csrfToken)
    
    expect(response.status).toBe(201)
  })
})
```

## 📊 Test Reporting

### **📈 Coverage Reports**
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### **📋 Test Results**
- **HTML Reports**: Generated for E2E tests with screenshots
- **Coverage Reports**: Line, branch, and function coverage
- **Performance Reports**: Core Web Vitals and timing metrics
- **Accessibility Reports**: WCAG compliance and violations

### **🚨 CI/CD Integration**
```yaml
# .github/workflows/ci.yml
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:e2e
    npm run test:accessibility
    npm run test:security

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## 🛠️ Test Utilities

### **🔧 Test Helpers**
```typescript
// src/tests/utils/test-helpers.ts
export function createMockRequest(method: string, body?: any) {
  return new Request('http://localhost:3000/api/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => (
      <SessionProvider session={mockSession}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </SessionProvider>
    )
  })
}
```

### **🎭 Mock Strategies**
- **Database**: Prisma client mocking with jest-mock-extended
- **Authentication**: NextAuth session mocking
- **External APIs**: Cloudinary and email service mocking
- **File System**: File upload and processing mocking

## 📋 Testing Checklist

### **✅ Before Committing**
- [ ] All tests pass locally
- [ ] Code coverage meets thresholds
- [ ] No accessibility violations
- [ ] Performance budgets met
- [ ] Security tests pass

### **✅ Before Deploying**
- [ ] Full test suite passes in CI
- [ ] E2E tests pass on staging
- [ ] Performance tests meet targets
- [ ] Security audit clean
- [ ] Accessibility compliance verified

## 🎯 Best Practices

### **📝 Writing Good Tests**
1. **Descriptive Names**: Test names should describe expected behavior
2. **Arrange-Act-Assert**: Clear test structure
3. **Single Responsibility**: One assertion per test when possible
4. **Edge Cases**: Test error conditions and boundary cases
5. **Realistic Data**: Use realistic test data and scenarios

### **🔧 Test Maintenance**
1. **Keep Tests Updated**: Update tests when code changes
2. **Remove Flaky Tests**: Fix or remove unreliable tests
3. **Optimize Performance**: Keep test suite fast and efficient
4. **Regular Review**: Review and refactor tests regularly

### **📊 Monitoring Test Health**
1. **Track Flakiness**: Monitor test reliability over time
2. **Performance Metrics**: Track test execution time
3. **Coverage Trends**: Monitor coverage changes
4. **Failure Analysis**: Analyze and categorize test failures

## 📚 Additional Resources

- **[Unit Testing Guide](UNIT_TESTING.md)** - Detailed unit testing guidelines
- **[Integration Testing Guide](INTEGRATION_TESTING.md)** - API and database testing
- **[E2E Testing Guide](E2E_TESTING.md)** - End-to-end testing with Playwright
- **[Accessibility Testing Guide](ACCESSIBILITY_TESTING.md)** - Accessibility compliance
- **[Performance Testing Guide](PERFORMANCE_TESTING.md)** - Performance and load testing

---

**Testing is not just about finding bugs - it's about building confidence in your code! 🧪✨**