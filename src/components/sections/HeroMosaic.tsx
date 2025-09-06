import React from 'react';
import { FeaturedArticle } from '@/types/content';
import NewsletterPanel from './NewsletterPanel';
import FeaturedArticles from './FeaturedArticles';
import Container, { Section, Flex } from '@/components/ui/Container';
import { grid } from '@/lib/responsive';

interface HeroMosaicProps {
  featuredArticles: FeaturedArticle[];
  className?: string;
}

export default function HeroMosaic({ 
  featuredArticles, 
  className = '' 
}: HeroMosaicProps) {
  return (
    <Section 
      className={className}
      padding="md"
      data-testid="hero-mosaic"
      aria-label="Featured content and newsletter signup"
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
    </Section>
  );
}