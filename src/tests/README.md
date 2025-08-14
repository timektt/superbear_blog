# Testing Suite Documentation

This document describes the comprehensive testing suite implemented for the SuperBear Blog CMS platform.

## Overview

The testing suite includes:
- **Unit Tests**: Testing individual functions and components
- **Integration Tests**: Testing API routes and database operations
- **End-to-End Tests**: Testing complete user journeys
- **CI/CD Pipeline**: Automated testing on GitHub Actions

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── lib/                # Library function tests
│   │   ├── auth-utils.test.ts
│   │   ├── editor-utils.test.ts
│   │   ├── metadata-utils.test.ts
│   │   ├── search-utils.test.ts
│   │   └── validations.test.ts
│   └── components/         # Component tests
│       ├── ArticleCard.test.tsx
│       └── SearchBar.test.tsx
├── integration/            # Integration tests
│   └── api/               # API route tests
│       ├── articles.test.ts
│       └── admin-articles.test.ts
├── e2e/                   # End-to-end tests
│   ├── public-site.spec.ts
│   ├── admin-interface.spec.ts
│   └── authentication.spec.ts
└── utils/                 # Test utilities
    └── test-helpers.ts
```

## Test Categories

### Unit Tests

#### Library Functions
- **auth-utils.test.ts**: Tests password hashing and verification
- **editor-utils.test.ts**: Tests slug generation, content extraction, validation, and sanitization
- **metadata-utils.test.ts**: Tests SEO metadata generation for articles and site
- **search-utils.test.ts**: Tests article search functionality and text highlighting
- **validations.test.ts**: Tests Zod validation schemas for articles and login
- **article-validations.test.ts**: Tests comprehensive article validation rules, slug generation, content validation, and duplicate handling

#### Components
- **ArticleCard.test.tsx**: Tests article card rendering, accessibility, and edge cases
- **SearchBar.test.tsx**: Tests search input, debouncing, keyboard navigation, and accessibility
- **ErrorBoundary.test.tsx**: Tests error boundary component with fallback UI, development/production modes, and error logging
- **ArticleForm.test.tsx**: Tests article form error handling, validation, loading states, and user feedback

### Integration Tests

#### API Routes
- **articles.test.ts**: Tests public article API endpoints with pagination, filtering, and error handling
- **admin-articles.test.ts**: Tests admin article CRUD operations with authentication, including PATCH/DELETE operations, duplicate slug handling, tag validation, and Cloudinary image cleanup

### End-to-End Tests

#### User Journeys
- **public-site.spec.ts**: Tests public site navigation, article browsing, search, and filtering
- **admin-interface.spec.ts**: Tests admin dashboard, article management, and rich text editing
- **authentication.spec.ts**: Tests login/logout flows, session management, and access control
- **admin-rbac.spec.ts**: Tests role-based access control for different user roles (ADMIN, EDITOR, VIEWER)
- **csrf-protection.spec.ts**: Tests CSRF token validation on form submissions and sensitive operations
- **media-handling.spec.ts**: Tests image upload, deletion, error handling, and file validation workflows
- **theme-accessibility.spec.ts**: Tests theme switching, accessibility compliance, keyboard navigation, and ARIA landmarks

## Test Configuration

### Jest Configuration
- **jest.config.js**: Main Jest configuration with Next.js integration
- **jest.setup.js**: Global test setup with mocks and utilities
- **playwright.config.ts**: Playwright configuration for E2E tests

### Key Features
- TypeScript support
- Next.js integration
- Component testing with React Testing Library
- API testing with Supertest
- Database mocking with Prisma
- Authentication mocking with NextAuth
- Accessibility testing helpers
- Coverage reporting

## Running Tests

### All Tests
```bash
npm run test:all          # Run all test suites
```

### Individual Test Types
```bash
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests only
```

### Development
```bash
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:e2e:ui       # E2E tests with UI
```

## CI/CD Integration

### GitHub Actions Workflow
The `.github/workflows/ci.yml` file defines a comprehensive CI/CD pipeline:

1. **Test Job**:
   - Sets up PostgreSQL database
   - Installs dependencies
   - Runs linting and type checking
   - Executes unit and integration tests
   - Installs Playwright and runs E2E tests
   - Uploads test results and coverage

2. **Build Job**:
   - Builds the application
   - Uploads build artifacts

3. **Deploy Job**:
   - Deploys to Vercel
   - Runs database migrations
   - Sends deployment notifications

### Environment Variables
Required for CI/CD:
- `DATABASE_URL`: Test database connection
- `NEXTAUTH_SECRET`: Authentication secret
- `CLOUDINARY_*`: Image upload credentials
- `VERCEL_*`: Deployment credentials

## Test Utilities

### Helper Functions
The `tests/utils/test-helpers.ts` file provides:
- Custom render function with providers
- Mock data factories
- API response mocking
- Accessibility testing helpers
- Performance measurement utilities

### Mock Strategies
- **Prisma**: Database operations mocked per test
- **NextAuth**: Authentication state mocked
- **Cloudinary**: Image upload mocked
- **Next.js Router**: Navigation mocked

## Coverage Goals

### Target Coverage
- **Unit Tests**: 90%+ line coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user journeys covered

### Coverage Areas
- ✅ Authentication flows
- ✅ Article CRUD operations
- ✅ Search and filtering
- ✅ Rich text editing
- ✅ Image upload and management
- ✅ SEO metadata generation
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Role-based access control (RBAC)
- ✅ CSRF protection
- ✅ Error boundary handling
- ✅ Form validation and error states
- ✅ Theme switching and persistence
- ✅ Media file validation and cleanup
- ✅ Duplicate slug handling
- ✅ Tag validation and relationships

## Best Practices

### Test Writing
1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive Names**: Tests describe expected behavior
3. **Single Responsibility**: One assertion per test when possible
4. **Edge Cases**: Test error conditions and boundary cases
5. **Accessibility**: Include accessibility checks in component tests

### Mocking Strategy
1. **Minimal Mocking**: Mock only external dependencies
2. **Realistic Data**: Use realistic test data
3. **Error Scenarios**: Test both success and failure cases
4. **Cleanup**: Reset mocks between tests

### Performance
1. **Parallel Execution**: Tests run in parallel where possible
2. **Selective Testing**: Target specific test suites during development
3. **Fast Feedback**: Unit tests provide quick feedback
4. **Comprehensive Coverage**: E2E tests ensure full functionality

## Troubleshooting

### Common Issues
1. **Module Resolution**: Ensure `@/` alias is configured in Jest
2. **Async Operations**: Use proper async/await in tests
3. **Mock Cleanup**: Clear mocks between tests
4. **Database State**: Ensure clean database state for integration tests

### Debug Commands
```bash
npm run test:unit -- --verbose    # Verbose output
npm run test:e2e:headed           # E2E with browser UI
npm run test -- --detectOpenHandles  # Find async handle leaks
```

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: Screenshot comparison tests
2. **Performance Testing**: Load testing for API endpoints
3. **Security Testing**: Automated security vulnerability scanning
4. **Cross-browser Testing**: Extended browser support in E2E tests
5. **Mobile Testing**: Device-specific testing scenarios

### Monitoring
1. **Test Metrics**: Track test execution time and flakiness
2. **Coverage Trends**: Monitor coverage changes over time
3. **Failure Analysis**: Automated failure categorization
4. **Performance Benchmarks**: Track application performance metrics

This comprehensive testing suite ensures the reliability, accessibility, and performance of the SuperBear Blog platform across all user interactions and system components.