'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TickerArticle } from '../../types/content';

interface HighlightTickerProps {
  articles: TickerArticle[];
  autoScroll?: boolean;
  scrollSpeed?: number;
}

// Loading skeleton for highlight ticker
function HighlightTickerSkeleton() {
  return (
    <section 
      className="bg-red-50 border-y border-red-100"
      data-testid="highlight-ticker"
      aria-label="Breaking news ticker loading"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-20 h-6 bg-red-200 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-shrink-0">
                  <div className="h-5 w-48 bg-red-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-4 h-4 bg-red-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HighlightTicker({ 
  articles, 
  autoScroll = true, 
  scrollSpeed = 50 
}: HighlightTickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const animationRef = useRef<number | undefined>(undefined);

  // Fallback content when no ticker articles are available
  const fallbackArticles: TickerArticle[] = [
    { id: 'fallback', title: 'Breaking: Stay tuned for updates', slug: '#' }
  ];

  const displayArticles = articles.length > 0 ? articles : fallbackArticles;

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <HighlightTickerSkeleton />;
  }

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || isPaused || !scrollContainerRef.current) return;

    const animate = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (maxScroll <= 0) return;

        setScrollPosition(prev => {
          const newPosition = prev + (scrollSpeed / 60); // 60fps
          return newPosition >= maxScroll ? 0 : newPosition;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoScroll, isPaused, scrollSpeed]);

  // Apply scroll position
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  // Pause on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Pause on focus for accessibility
  const handleFocus = () => {
    setIsPaused(true);
  };

  const handleBlur = () => {
    setIsPaused(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 200;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        break;
      case 'ArrowRight':
        e.preventDefault();
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        break;
      case 'Home':
        e.preventDefault();
        container.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'End':
        e.preventDefault();
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        break;
    }
  };

  return (
    <section 
      className="bg-red-50 border-y border-red-100"
      data-testid="highlight-ticker"
      aria-label="Breaking news ticker"
      role="region"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Breaking News Label */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
              BREAKING
            </span>
          </div>

          {/* Scrolling Ticker Container */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-live="polite"
            aria-label="Breaking news articles"
          >
            <div className="flex gap-8 whitespace-nowrap">
              {/* Duplicate articles for seamless loop */}
              {[...displayArticles, ...displayArticles].map((article, index) => (
                <div
                  key={`${article.id}-${index}`}
                  className="flex-shrink-0"
                >
                  {article.slug === '#' ? (
                    <span className="text-red-800 font-medium hover:text-red-900 transition-colors">
                      {article.title}
                    </span>
                  ) : (
                    <Link
                      href={`/news/${article.slug}`}
                      className="text-red-800 font-medium hover:text-red-900 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                      tabIndex={-1} // Prevent tab navigation within scrolling content
                    >
                      {article.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Visual indicator for scrollable content */}
          <div className="flex-shrink-0 text-red-400">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </div>
        </div>

        {/* Screen reader instructions */}
        <div className="sr-only">
          Use arrow keys to navigate through breaking news articles. 
          Press Home to go to the beginning, End to go to the end.
        </div>
      </div>
    </section>
  );
}