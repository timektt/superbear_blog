import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

// Mock session for testing
export const mockSession: Session = {
  user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
  expires: '2025-01-01T00:00:00.000Z',
};

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider session={mockSession}>{children}</SessionProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock article data factory
export const createMockArticle = (overrides = {}) => ({
  id: '1',
  title: 'Test Article',
  slug: 'test-article',
  summary: 'This is a test article summary',
  content: { type: 'doc', content: [] },
  image: 'https://example.com/image.jpg',
  status: 'PUBLISHED' as const,
  publishedAt: new Date('2024-01-01T10:00:00Z'),
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  author: {
    name: 'John Doe',
    avatar: null,
  },
  category: {
    name: 'Development',
    slug: 'development',
  },
  tags: [
    { name: 'React', slug: 'react' },
    { name: 'Testing', slug: 'testing' },
  ],
  ...overrides,
});

// Mock API response factory
export const createMockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Wait for async operations in tests
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock fetch for API testing
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(createMockApiResponse(response, status))
  ) as any;
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as any).mockClear();
  }
};

// Mock router for testing
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

// Mock search params
export const mockSearchParams = new URLSearchParams();

// Test database helpers
export const createTestDatabase = async () => {
  // This would set up a test database instance
  // Implementation depends on your testing strategy
};

export const cleanupTestDatabase = async () => {
  // This would clean up test data
  // Implementation depends on your testing strategy
};

// Accessibility testing helpers
export const checkAccessibility = async (container: HTMLElement) => {
  // Check for basic accessibility requirements
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const images = container.querySelectorAll('img');
  const links = container.querySelectorAll('a');
  const buttons = container.querySelectorAll('button');

  // Check heading hierarchy
  let previousLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (previousLevel > 0 && level > previousLevel + 1) {
      throw new Error(
        `Heading hierarchy violation: h${previousLevel} followed by h${level}`
      );
    }
    previousLevel = level;
  });

  // Check images have alt text
  images.forEach((img) => {
    if (!img.getAttribute('alt')) {
      throw new Error('Image missing alt attribute');
    }
  });

  // Check links have accessible names
  links.forEach((link) => {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute('aria-label');
    const hasTitle = link.getAttribute('title');

    if (!hasText && !hasAriaLabel && !hasTitle) {
      throw new Error('Link missing accessible name');
    }
  });

  // Check buttons have accessible names
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasTitle = button.getAttribute('title');

    if (!hasText && !hasAriaLabel && !hasTitle) {
      throw new Error('Button missing accessible name');
    }
  });
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Mock Cloudinary responses
export const mockCloudinaryUpload = (
  url = 'https://res.cloudinary.com/test/image/upload/v1/test.jpg'
) => ({
  secure_url: url,
  public_id: 'test',
  width: 1200,
  height: 630,
  format: 'jpg',
});

// Mock Prisma responses
export const mockPrismaResponse = (data: any) => ({
  ...data,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
});

// Error boundary testing
export const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return React.createElement('div', null, 'No error');
};
