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
import { getPrisma } from '@/lib/prisma';
import { IS_DB_CONFIGURED } from '@/lib/env';
import {
  MOCK_FEATURED,
  MOCK_TOP_HEADLINES,
  MOCK_LATEST,
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

export default async function Home() {
  const prisma = getPrisma();

  // DB-Safe Mode: Use mock data when database is not configured
  if (!IS_DB_CONFIGURED || !prisma) {
    return (
      <>
        {/* DB-Safe Mode Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
              🔧 Running in DB-safe mode with mock data. Configure DATABASE_URL to load real content.
            </p>
          </div>
        </div>
        <HomeView 
          featured={MOCK_FEATURED} 
          headlines={MOCK_TOP_HEADLINES} 
          latest={MOCK_LATEST} 
        />
      </>
    );
  }

  // Real DB Mode: Fetch data from database
  try {
    const [featuredResults, headlines, latest] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { author: true, category: true },
      }),
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { title: true, slug: true, createdAt: true },
      }),
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 9,
        include: { author: true, category: true, tags: true },
      }),
    ]);

    const featured = featuredResults[0] || MOCK_FEATURED;
    
    return (
      <HomeView 
        featured={featured} 
        headlines={headlines.length > 0 ? headlines : MOCK_TOP_HEADLINES} 
        latest={latest.length > 0 ? latest : MOCK_LATEST} 
      />
    );
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return (
      <>
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-sm text-red-800 dark:text-red-200 text-center">
              ⚠️ Database connection failed. Displaying mock data.
            </p>
          </div>
        </div>
        <HomeView 
          featured={MOCK_FEATURED} 
          headlines={MOCK_TOP_HEADLINES} 
          latest={MOCK_LATEST} 
        />
      </>
    );
  }
}

// Home View Component
function HomeView({ featured, headlines, latest }: {
  featured: any;
  headlines: any[];
  latest: any[];
}) {
  return (
    <>
      {/* Hero Band - TechCrunch Structure */}
      <section className="bg-white dark:bg-gray-900 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Featured Article - Left 8 cols */}
            <div className="lg:col-span-8">
              <Hero featuredArticle={featured} />
            </div>

            {/* Top Headlines - Right 4 cols */}
            <div className="lg:col-span-4">
              <TopHeadlines headlines={headlines} />
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
              <LatestList articles={latest.slice(0, 6)} />
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
