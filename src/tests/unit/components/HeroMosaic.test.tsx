import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroMosaic from '@/components/sections/HeroMosaic';
import { FeaturedArticle } from '@/types/content';

// Mock the child components
jest.mock('@/components/sections/NewsletterPanel', () => {
  return function MockNewsletterPanel({ className }: { className?: string }) {
    return <div data-testid="newsletter-panel" className={className}>Newsletter Panel</div>;
  };
});

jest.mock('@/components/sections/FeaturedArticles', () => {
  return function MockFeaturedArticles({ articles }: { articles: FeaturedArticle[] }) {
    return <div data-testid="featured-articles">Featured Articles ({articles.length})</div>;
  };
});

const mockFeaturedArticles: FeaturedArticle[] = [
  {
    id: '1',
    title: 'Test Article 1',
    excerpt: 'Test excerpt 1',
    slug: 'test-article-1',
    coverUrl: 'https://example.com/image1.jpg',
    category: { id: '1', name: 'Tech', slug: 'tech' },
    publishedAt: new Date('2024-01-01'),
    author: { id: '1', name: 'Test Author' },
    featureRank: 1,
  },
  {
    id: '2',
    title: 'Test Article 2',
    excerpt: 'Test excerpt 2',
    slug: 'test-article-2',
    coverUrl: 'https://example.com/image2.jpg',
    category: { id: '2', name: 'AI', slug: 'ai' },
    publishedAt: new Date('2024-01-02'),
    author: { id: '2', name: 'Test Author 2' },
    featureRank: 2,
  },
];

describe('HeroMosaic', () => {
  it('renders without crashing', () => {
    render(<HeroMosaic featuredArticles={mockFeaturedArticles} />);
    
    expect(screen.getByTestId('hero-mosaic')).toBeInTheDocument();
    expect(screen.getByTestId('newsletter-panel')).toBeInTheDocument();
    expect(screen.getByTestId('featured-articles')).toBeInTheDocument();
  });

  it('passes featured articles to FeaturedArticles component', () => {
    render(<HeroMosaic featuredArticles={mockFeaturedArticles} />);
    
    expect(screen.getByText('Featured Articles (2)')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<HeroMosaic featuredArticles={mockFeaturedArticles} className="custom-class" />);
    
    const heroMosaic = screen.getByTestId('hero-mosaic');
    expect(heroMosaic).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<HeroMosaic featuredArticles={mockFeaturedArticles} />);
    
    const heroMosaic = screen.getByTestId('hero-mosaic');
    expect(heroMosaic).toHaveAttribute('aria-label', 'Featured content and newsletter signup');
  });

  it('applies touch-manipulation class to newsletter panels', () => {
    render(<HeroMosaic featuredArticles={mockFeaturedArticles} />);
    
    const newsletterPanels = screen.getAllByTestId('newsletter-panel');
    newsletterPanels.forEach(panel => {
      expect(panel).toHaveClass('touch-manipulation');
    });
  });
});