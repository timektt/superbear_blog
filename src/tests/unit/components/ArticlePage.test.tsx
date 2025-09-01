import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArticlePage from '@/app/(public)/news/[slug]/page';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  usePathname: () => '/news/test-article',
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock the SEO and sharing utilities
jest.mock('@/lib/seo/jsonld', () => ({
  generateArticleJsonLd: jest.fn(() => ({})),
  generateBreadcrumbJsonLd: jest.fn(() => ({})),
}));

jest.mock('@/lib/sharing/utm', () => ({
  generateShareUrls: jest.fn(() => ({
    twitter: 'https://twitter.com/share',
    facebook: 'https://facebook.com/share',
    linkedin: 'https://linkedin.com/share',
  })),
  addUtmParams: jest.fn((url) => url),
}));

// Mock the store utilities
jest.mock('@/lib/reactions/store', () => ({
  getStoredEmailHash: jest.fn(() => null),
  createEmailHash: jest.fn(() => 'mock-hash'),
  setStoredEmailHash: jest.fn(),
}));

jest.mock('@/lib/bookmarks/store', () => ({
  getStoredBookmarks: jest.fn(() => []),
  setStoredBookmarks: jest.fn(),
}));

jest.mock('@/lib/comments/store', () => ({
  sanitizeHtml: jest.fn((html) => html),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('ArticlePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 0, comments: [] }),
    });
  });

  it('renders loading state initially', () => {
    render(<ArticlePage params={{ slug: 'test-article' }} />);
    
    expect(screen.getByText('Back to articles')).toBeInTheDocument();
    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders article content after loading', async () => {
    render(<ArticlePage params={{ slug: 'test-article' }} />);
    
    // Wait for the article to load
    await waitFor(() => {
      expect(screen.getByText('Building Modern Web Applications with Next.js and TypeScript')).toBeInTheDocument();
    });

    // Check for article elements
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('15 min read')).toBeInTheDocument();
  });

  it('renders share buttons', async () => {
    render(<ArticlePage params={{ slug: 'test-article' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Share this article')).toBeInTheDocument();
    });

    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('renders comments section', async () => {
    render(<ArticlePage params={{ slug: 'test-article' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write a thoughtful comment...')).toBeInTheDocument();
    expect(screen.getByText('Post Comment')).toBeInTheDocument();
  });

  it('renders related articles section', async () => {
    render(<ArticlePage params={{ slug: 'test-article' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Related Articles')).toBeInTheDocument();
    });

    // Check for related article titles
    expect(screen.getByText('Understanding Modern Web Development')).toBeInTheDocument();
    expect(screen.getByText('The Future of AI in Software Development')).toBeInTheDocument();
    expect(screen.getByText('Building Scalable React Applications')).toBeInTheDocument();
  });

  it('renders reaction and bookmark buttons', async () => {
    render(<ArticlePage params={{ slug: 'test-article' }} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Like this article')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Bookmark this article')).toBeInTheDocument();
  });
});