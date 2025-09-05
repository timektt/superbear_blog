import React from 'react';
import { FeaturedArticle } from '@/types/content';
import NewsletterPanel from './NewsletterPanel';
import FeaturedArticles from './FeaturedArticles';

interface HeroMosaicProps {
  featuredArticles: FeaturedArticle[];
  className?: string;
}

export default function HeroMosaic({ 
  featuredArticles, 
  className = '' 
}: HeroMosaicProps) {
  return (
    <section 
      className={`w-full py-8 md:py-12 ${className}`}
      data-testid="hero-mosaic"
      aria-label="Featured content and newsletter signup"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: Stacked Layout */}
        <div className="flex flex-col gap-6 md:hidden">
          {/* Newsletter Panel - Full width on mobile */}
          <div className="w-full">
            <NewsletterPanel className="touch-manipulation" />
          </div>
          
          {/* Featured Articles - Full width on mobile */}
          <div className="w-full">
            <FeaturedArticles articles={featuredArticles} />
          </div>
        </div>

        {/* Tablet: Adjusted Layout (5/7 split as per design) */}
        <div className="hidden md:flex lg:hidden md:gap-6 md:items-start">
          {/* Newsletter Panel - 5/12 width on tablet */}
          <div className="w-5/12 flex-shrink-0">
            <NewsletterPanel className="touch-manipulation" />
          </div>
          
          {/* Featured Articles - 7/12 width on tablet */}
          <div className="w-7/12 flex-shrink-0">
            <FeaturedArticles articles={featuredArticles} />
          </div>
        </div>

        {/* Desktop: Side-by-side Layout (40/60 split) */}
        <div className="hidden lg:flex lg:gap-8 lg:items-start">
          {/* Newsletter Panel - 40% width on desktop */}
          <div className="w-2/5 flex-shrink-0">
            <NewsletterPanel className="touch-manipulation" />
          </div>
          
          {/* Featured Articles - 60% width on desktop */}
          <div className="w-3/5 flex-shrink-0">
            <FeaturedArticles articles={featuredArticles} />
          </div>
        </div>
      </div>
    </section>
  );
}