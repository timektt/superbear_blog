import { Metadata } from 'next';
import Link from 'next/link';
import Hero from '@/components/sections/Hero';
import TopHeadlines from '@/components/sections/TopHeadlines';
import LatestList from '@/components/sections/LatestList';
import RightRail from '@/components/sections/RightRail';
import StorylinesStrip from '@/components/sections/StorylinesStrip';
import StartupsBlock from '@/components/sections/StartupsBlock';
import PodcastsBlock from '@/components/sections/PodcastsBlock';
import ExploreByCategory from '@/components/sections/ExploreByCategory';
import { generateMetadata as createMetadata } from '@/lib/metadata-utils';
import {
  mockFeaturedArticle,
  mockTopHeadlines,
  mockLatestArticles,
  mockRightRailItems,
  mockStorylinesItems,
  mockStartupsFeatured,
  mockStartupsSide,
  mockPodcastItems,
} from '@/lib/mockData';

export const metadata: Metadata = createMetadata({
  title: 'SuperBear Blog - Tech News for Developers',
  description:
    'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs. Discover AI & LLM news, developer tools, and startup insights.',
  url: '/',
});

export default function Home() {
  return (
    <>
      {/* Hero Band - TechCrunch Structure */}
      <section className="bg-white dark:bg-gray-900 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Featured Article - Left 8 cols */}
            <div className="lg:col-span-8">
              <Hero featuredArticle={mockFeaturedArticle} />
            </div>

            {/* Top Headlines - Right 4 cols */}
            <div className="lg:col-span-4">
              <TopHeadlines headlines={mockTopHeadlines} />
            </div>
          </div>
        </div>
      </section>

      {/* Latest News Section - TechCrunch List Layout */}
      <section className="bg-gray-50 dark:bg-gray-800 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="w-1 h-8 bg-indigo-600 rounded-full mr-4"></div>
              Latest News
            </h2>
            <Link
              href="/news"
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors duration-200"
            >
              See more
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Latest List - Left 8-9 cols */}
            <div className="lg:col-span-8">
              <LatestList articles={mockLatestArticles.slice(0, 6)} />
            </div>

            {/* Right Rail - Right 3-4 cols */}
            <div className="lg:col-span-4">
              <RightRail title="Most Popular" items={mockRightRailItems} />
            </div>
          </div>
        </div>
      </section>

      {/* Storylines / In Brief - Horizontal Scroller */}
      <StorylinesStrip items={mockStorylinesItems} />

      {/* Startups Section Block */}
      <StartupsBlock
        featuredArticle={mockStartupsFeatured}
        sideArticles={mockStartupsSide}
      />

      {/* Podcasts Section */}
      <PodcastsBlock title="Podcasts" items={mockPodcastItems} />

      {/* Explore by Category - Polished */}
      <ExploreByCategory />
    </>
  );
}
