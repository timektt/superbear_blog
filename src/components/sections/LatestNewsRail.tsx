'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, User, Calendar } from 'lucide-react';
import type { Article } from '@/types/content';
import Container, {
  Section,
  Flex,
  TouchTarget,
} from '@/components/ui/Container';
import { typography, animations, scrollBehavior } from '@/lib/responsive';

interface LatestNewsRailProps {
  articles: Article[];
  showNavButtons?: boolean;
  className?: string;
}

// Category color mapping for consistent styling
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    AI: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    Startups:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    DevTools:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Open Source':
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    News: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Tech: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[category] || colors['Tech'];
};

// Format date for display
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Estimate reading time based on excerpt length
const estimateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Individual article card component for the rail
interface ArticleRailCardProps {
  article: Article;
}

function ArticleRailCard({ article }: ArticleRailCardProps) {
  const href = `/news/${article.slug}`;
  const imageUrl =
    article.coverUrl || article.imageUrl || '/placeholder-image.svg';
  const excerpt = article.excerpt || article.summary || '';
  const publishDate = article.publishedAt || article.createdAt;
  const readingTime = excerpt ? estimateReadingTime(excerpt) : null;

  return (
    <div className="flex-shrink-0 w-80 group">
      <Link
        href={href}
        className="block focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded-xl"
        aria-label={`Read article: ${article.title}`}
      >
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          {/* Article Image */}
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={`Featured image for ${article.title}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="320px"
              loading="lazy"
            />

            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getCategoryColor(article.category.name)}`}
              >
                {article.category.name}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
              {article.title}
            </h3>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2 leading-relaxed">
                {excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="font-medium">{article.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(publishDate)}</span>
              </div>
              {readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{readingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Loading skeleton for the rail
function LatestNewsRailSkeleton() {
  return (
    <div className="flex gap-6 overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex-shrink-0 w-80 animate-pulse">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="aspect-[16/9] bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-20 bg-muted rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-full bg-muted rounded" />
                <div className="h-5 w-3/4 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </div>
              <div className="flex gap-3">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LatestNewsRail({
  articles,
  showNavButtons = true,
  className = '',
}: LatestNewsRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check scroll position and update navigation button states
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll to previous articles
  const scrollToPrevious = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 320; // w-80 = 320px
    const gap = 24; // gap-6 = 24px
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth',
    });
  };

  // Scroll to next articles
  const scrollToNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 320; // w-80 = 320px
    const gap = 24; // gap-6 = 24px
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToPrevious();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToNext();
    }
  };

  // Set up scroll event listener and initial state
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    checkScrollPosition();
    setIsLoading(false);

    // Add scroll event listener
    container.addEventListener('scroll', checkScrollPosition);

    // Add resize event listener to recheck on window resize
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [articles]);

  if (isLoading) {
    return (
      <Section
        className={className}
        padding="md"
        data-testid="latest-news-rail"
      >
        <Container size="xl" padding="md">
          <Flex justify="between" align="center" className="mb-8">
            <h2
              className={`${typography.section.title} font-bold text-foreground`}
            >
              Latest News
            </h2>
          </Flex>
          <LatestNewsRailSkeleton />
        </Container>
      </Section>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <Section
        className={className}
        padding="md"
        data-testid="latest-news-rail"
      >
        <Container size="xl" padding="md">
          <Flex justify="between" align="center" className="mb-8">
            <h2
              className={`${typography.section.title} font-bold text-foreground`}
            >
              Latest News
            </h2>
          </Flex>
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-2xl flex items-center justify-center">
              <svg
                className="w-12 h-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4">
              No latest articles found
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              There are no published articles available. Check back later for
              new content!
            </p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section
      className={className}
      padding="md"
      data-testid="latest-news-rail"
    >
      <Container size="xl" padding="md">
        {/* Section Header */}
        <Flex justify="between" align="center" className="mb-8">
          <h2
            className={`${typography.section.title} font-bold text-foreground`}
          >
            Latest News
          </h2>

          {/* Navigation Buttons */}
          {showNavButtons && articles.length > 3 && (
            <Flex gap="sm">
              <TouchTarget size="md">
                <button
                  onClick={scrollToPrevious}
                  disabled={!canScrollLeft}
                  className={`p-2 rounded-full bg-background border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${animations.focus.ring}`}
                  aria-label="Scroll to previous articles"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </TouchTarget>
              <TouchTarget size="md">
                <button
                  onClick={scrollToNext}
                  disabled={!canScrollRight}
                  className={`p-2 rounded-full bg-background border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${animations.focus.ring}`}
                  aria-label="Scroll to next articles"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </TouchTarget>
            </Flex>
          )}
        </Flex>

        {/* Scrollable Articles Container */}
        <section aria-label="Latest News" role="region">
          <h2 id="latest-news-heading" className="sr-only">Latest News</h2>
          <div 
            role="group" 
            aria-labelledby="latest-news-heading"
            ref={scrollContainerRef}
            className={`${scrollBehavior.horizontal.container} pb-4`}
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <Flex gap="lg" className="min-w-max">
              {articles.slice(0, 12).map((article) => (
                <div key={article.id} style={{ scrollSnapAlign: 'start' }}>
                  <article 
                    aria-label={article.title}
                    className="flex-shrink-0"
                  >
                    <ArticleRailCard article={article} />
                  </article>
                </div>
              ))}
            </Flex>
          </div>
        </section>

        {/* Touch/Swipe Hint for Mobile */}
        <div className="mt-4 text-center sm:hidden">
          <p className="text-xs text-muted-foreground">
            Swipe left or right to see more articles
          </p>
        </div>
      </Container>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Section>
  );
}
