# Visual Regression Testing Guide

This guide explains how to run and maintain visual regression tests for the SuperBear Blog magazine layout components.

## Overview

Visual regression tests ensure that UI components maintain their visual appearance after code changes. These tests capture screenshots of components and compare them against baseline images.

## Test Coverage

Our visual regression tests cover:

### Magazine Layout Components
- **TopHeader**: Hero section with loading states
- **HeroMosaic**: Featured articles and newsletter panel layout
- **LatestNewsRail**: Horizontal scrolling news rail with navigation

### Test Scenarios
- ✅ Desktop layout (1920x1080)
- ✅ Tablet layout (768x1024) 
- ✅ Mobile layout (375x667)
- ✅ Dark theme variations
- ✅ Loading states
- ✅ Hover and focus states
- ✅ Cross-browser consistency (Chrome, Firefox, Safari)

## Running Visual Tests

### Basic Commands

```bash
# Run all visual regression tests
npm run test:visual

# Run with UI mode for debugging
npm run test:visual -- --ui

# Run in headed mode to see browser
npm run test:visual -- --headed

# Update baseline screenshots (when changes are intentional)
npm run test:visual:update
```

### Specific Test Scenarios

```bash
# Test only desktop layouts
npm run test:visual -- --grep "desktop"

# Test only mobile layouts  
npm run test:visual -- --grep "mobile"

# Test only loading states
npm run test:visual -- --grep "loading"

# Test specific component
npm run test:visual -- --grep "TopHeader"
```

## Understanding Test Results

### Successful Tests
- ✅ Screenshots match baseline images within threshold (0.2% difference)
- ✅ All components render without visual regressions

### Failed Tests
- ❌ Visual differences detected above threshold
- ❌ Components missing or not rendering
- ❌ Layout shifts or styling issues

### Test Output
```
test-results/
├── visual-regression-spec-ts-magazine-layout-visual-regression-tests-topheader-component-visual-appearance-chromium/
│   ├── top-header-desktop-actual.png     # Current screenshot
│   ├── top-header-desktop-expected.png   # Baseline screenshot  
│   └── top-header-desktop-diff.png       # Difference highlight
```

## Updating Baselines

When visual changes are intentional (new features, design updates):

```bash
# Update all baselines
npm run test:visual:update

# Update specific test baselines
npm run test:visual:update -- --grep "TopHeader"

# Update for specific browser
npm run test:visual:update -- --project chromium
```

## Best Practices

### 1. Stable Test Environment
- Tests run against `http://localhost:3000`
- Ensure dev server is running: `npm run dev`
- Wait for loading states to complete
- Use consistent viewport sizes

### 2. Handling Dynamic Content
- Mock API responses for consistent data
- Wait for animations and transitions
- Use `waitForLoadState('networkidle')`
- Handle loading states explicitly

### 3. Cross-Browser Testing
- Tests run on Chrome, Firefox, and Safari
- Each browser may have slight rendering differences
- Threshold set to 0.2% to account for minor variations

### 4. Responsive Testing
- Test key breakpoints: mobile (375px), tablet (768px), desktop (1920px)
- Verify layout changes at breakpoints
- Test touch interactions on mobile

## Troubleshooting

### Common Issues

**1. Flaky Tests (Inconsistent Results)**
```bash
# Increase wait times for slow components
await page.waitForTimeout(2000);

# Wait for specific elements
await page.waitForSelector('[data-testid="component"]');

# Wait for network requests
await page.waitForLoadState('networkidle');
```

**2. Font Rendering Differences**
```bash
# Run tests with consistent font loading
await page.addStyleTag({
  content: `
    * { font-family: system-ui, -apple-system, sans-serif !important; }
  `
});
```

**3. Animation Interference**
```bash
# Disable animations for consistent screenshots
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
});
```

### Debugging Failed Tests

1. **View Test Results**
   ```bash
   npx playwright show-report
   ```

2. **Run in UI Mode**
   ```bash
   npm run test:visual -- --ui
   ```

3. **Compare Screenshots**
   - Check `test-results/` folder for diff images
   - Red areas show differences
   - Green areas show expected content

4. **Update Baselines if Changes are Correct**
   ```bash
   npm run test:visual:update -- --grep "failing-test-name"
   ```

## Integration with CI/CD

### GitHub Actions Setup
```yaml
- name: Run Visual Regression Tests
  run: |
    npm run build
    npm run test:visual
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: visual-test-results
    path: test-results/
```

### Baseline Management
- Store baseline screenshots in version control
- Update baselines in separate PRs for review
- Use branch-specific baselines for feature development

## Maintenance

### Regular Tasks
- [ ] Review and update baselines monthly
- [ ] Add tests for new components
- [ ] Update viewport sizes as needed
- [ ] Monitor test execution time
- [ ] Clean up old test artifacts

### Performance Optimization
- Run visual tests in parallel where possible
- Use selective testing for component-specific changes
- Optimize screenshot capture settings
- Cache baseline images appropriately

## Related Documentation
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-screenshots)
- [Testing Strategy Overview](../README.md)
- [Component Testing Guide](../unit/README.md)