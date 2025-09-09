'use client';

import React, { useState, useEffect } from 'react';
import { FeaturedArticle } from '@/types/content';
import NewsletterPanel from './NewsletterPanel';
import FeaturedArticles from './FeaturedArticles';
import Container, { Flex } from '@/components/ui/Container';

interface HeroMosaicProps {
  featuredArticles: FeaturedArticle[];
  className?: string;
}

// Loading skeleton for hero mosaic
function HeroMosaicSkeleton() {
  return (
    <section 
      className="py-8 md:py-12"
      data-testid="hero-mosaic"
      aria-label="Featured content and newsletter signup loading"
    >
      <Container size="xl" padding="md">
        {/* Mobile: Stacked Layout */}
        <Flex
          direction={{ default: 'col', md: 'row' }}
          gap="lg"
          align="start"
          className="md:hidden"
        >
          <div className="w-full h-80 bg-red-100 rounded-lg animate-pulse"></div>
          <div className="w-full space-y-4">
            <div className="w-full aspect-video h-80 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 gap-4">
              <div className="w-full aspect-video h-40 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-full aspect-video h-40 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </Flex>

        {/* Tablet: Adjusted Layout */}
        <Flex
          direction={{ default: 'row' }}
          gap="md"
          align="start"
          className="hidden md:flex lg:hidden"
        >
          <div className="w-5/12 flex-shrink-0 h-80 bg-red-100 rounded-lg animate-pulse"></div>
          <div className="w-7/12 flex-shrink-0 space-y-4">
            <div className="w-full aspect-video h-60 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="aspect-video h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </Flex>

        {/* Desktop: Side-by-side Layout */}
        <Flex
          direction={{ default: 'row' }}
          gap="lg"
          align="start"
          className="hidden lg:flex"
        >
          <div className="w-2/5 flex-shrink-0 h-96 bg-red-100 rounded-lg animate-pulse"></div>
          <div className="w-3/5 flex-shrink-0 space-y-4">
            <div className="w-full aspect-video h-72 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video h-36 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="aspect-video h-36 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </Flex>
      </Container>
    </section>
  );
}

export default function HeroMosaic({ 
  featuredArticles, 
  className = '' 
}: HeroMosaicProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for hero mosaic
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <HeroMosaicSkeleton />;
  }
  return (
    <section 
      className={`py-8 md:py-12 ${className}`}
      data-testid="hero-mosaic"
      aria-label="Featured content and newsletter signup"
      role="region"
    >
      <Container size="xl" padding="md">
        {/* Mobile: Stacked Layout */}
        <Flex
          direction={{ default: 'col', md: 'row' }}
          gap="lg"
          align="start"
          className="md:hidden"
        >
          {/* Newsletter Panel - Full width on mobile */}
          <div className="w-full">
            <NewsletterPanel className="touch-manipulation" />
          </div>
          
          {/* Featured Articles - Full width on mobile */}
          <div className="w-full">
            <FeaturedArticles articles={featuredArticles} />
          </div>
        </Flex>

        {/* Tablet: Adjusted Layout (5/7 split as per design) */}
        <Flex
          direction={{ default: 'row' }}
          gap="md"
          align="start"
          className="hidden md:flex lg:hidden"
        >
          {/* Newsletter Panel - 5/12 width on tablet */}
          <div className="w-5/12 flex-shrink-0">
            <NewsletterPanel className="touch-manipulation" />
          </div>
          
          {/* Featured Articles - 7/12 width on tablet */}
          <div className="w-7/12 flex-shrink-0">
            <FeaturedArticles articles={featuredArticles} />
          </div>
        </Flex>

        {/* Desktop: Side-by-side Layout (40/60 split) */}
        <Flex
          direction={{ default: 'row' }}
          gap="lg"
          align="start"
          className="hidden lg:flex"
        >
          {/* Newsletter Panel - 40% width on desktop */}
          <div className="w-2/5 flex-shrink-0">
            <NewsletterPanel className="touch-manipulation" />
          </div>
          
          {/* Featured Articles - 60% width on desktop */}
          <div className="w-3/5 flex-shrink-0">
            <FeaturedArticles articles={featuredArticles} />
          </div>
        </Flex>
      </Container>
    </section>
  );
}