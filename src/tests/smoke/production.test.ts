import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Production Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check that the page loads
    await expect(page).toHaveTitle(/SuperBear Blog/);

    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible();

    // Check for main content
    await expect(page.locator('main')).toBeVisible();

    // Check that no console errors occurred
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('health endpoint responds correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health.status).toBe('healthy');
    expect(health.checks.database.status).toBe('ok');
  });

  test('articles API responds correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/articles`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('articles');
    expect(Array.isArray(data.articles)).toBe(true);
  });

  test('admin login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);

    await expect(page).toHaveTitle(/Login/);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('security headers are present', async ({ request }) => {
    const response = await request.get(BASE_URL);

    const headers = response.headers();

    // Check security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // Check HSTS in production
    if (process.env.NODE_ENV === 'production') {
      expect(headers['strict-transport-security']).toContain('max-age=');
    }
  });

  test('sitemap is accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
  });

  test('robots.txt is accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
  });

  test('favicon is accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/favicon.ico`);

    expect(response.status()).toBe(200);
  });

  test('performance metrics are acceptable', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};

          entries.forEach((entry) => {
            if (entry.name === 'FCP') {
              vitals.fcp = entry.value;
            }
            if (entry.name === 'LCP') {
              vitals.lcp = entry.value;
            }
            if (entry.name === 'CLS') {
              vitals.cls = entry.value;
            }
          });

          resolve(vitals);
        }).observe({ entryTypes: ['measure', 'navigation'] });

        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    // Basic performance assertions (adjust thresholds as needed)
    if (metrics && typeof metrics === 'object') {
      const metricsObj = metrics as Record<string, number>;
      if (metricsObj.lcp) {
        expect(metricsObj.lcp).toBeLessThan(4000); // LCP should be under 4s
      }
      if (metricsObj.cls) {
        expect(metricsObj.cls).toBeLessThan(0.25); // CLS should be under 0.25
      }
    }
  });

  test('admin routes require authentication', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/articles`);

    expect(response.status()).toBe(401);
  });

  test('rate limiting works', async ({ request }) => {
    // Make multiple rapid requests to trigger rate limiting
    const requests = Array.from({ length: 10 }, () =>
      request.get(`${BASE_URL}/api/articles`)
    );

    const responses = await Promise.all(requests);

    // All requests should succeed (rate limit is generous for public API)
    responses.forEach((response) => {
      expect([200, 429]).toContain(response.status());
    });

    // Check rate limit headers are present
    const lastResponse = responses[responses.length - 1];
    const headers = lastResponse.headers();

    if (lastResponse.status() === 200) {
      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
    }
  });
});
