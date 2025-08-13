import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

// Performance optimizations
export const revalidate = 60;
export const fetchCache = 'force-cache';
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
import { SHOW_DB_SAFE_BANNER } from '@/lib/flags';
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
      <HomeView
        featured={{
          ...MOCK_FEATURED,
          category: MOCK_FEATURED.category.name,
          author: MOCK_FEATURED.author.name,
        }}
        headlines={MOCK_TOP_HEADLINES}
        latest={MOCK_LATEST}
      />
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
        featured={{
          ...featured,
          category: featured.category?.name || 'Tech',
          author: featured.author?.name || 'SuperBear Reporter',
        }}
        headlines={headlines.length > 0 ? headlines : MOCK_TOP_HEADLINES}
        latest={latest.length > 0 ? latest : MOCK_LATEST}
      />
    );
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return (
      <HomeView
        featured={{
          ...MOCK_FEATURED,
          category: MOCK_FEATURED.category.name,
          author: MOCK_FEATURED.author.name,
        }}
        headlines={MOCK_TOP_HEADLINES}
        latest={MOCK_LATEST}
      />
    );
  }
}

// Home View Component
function HomeView({
  featured,
  headlines,
  latest,
}: {
  featured: {
    title: string;
    summary: string;
    category: string;
    author: string;
    date: string;
    imageUrl?: string;
    slug?: string;
  };
  headlines: Array<{
    title: string;
    timeAgo: string;
    slug: string;
    createdAt?: Date;
  }>;
  latest: Array<{
    id: string;
    title: string;
    category: string;
    author: string;
    date: string;
    slug: string;
    imageUrl?: string;
    snippet?: string;
    tags: string[];
    status?: 'PUBLISHED' | 'DRAFT';
    createdAt?: Date;
  }>;
}) {
  return (
    <>
      {/* Above the Fold - Hero + Headlines */}
      <section className="bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Featured Article - Left 8 cols */}
            <div className="lg:col-span-8">
              <Hero featuredArticle={featured} />
            </div>

            {/* Top Headlines - Right 4 cols */}
            <div className="lg:col-span-4">
              <Suspense fallback={<TopHeadlinesSkeleton />}>
                <TopHeadlines headlines={headlines} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Below the Fold - Latest + Right Rail */}
      <section className="bg-muted py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              <div className="w-1 h-6 bg-red-600 rounded-full mr-3"></div>
              Latest News
            </h2>
            <Link
              href="/news"
              className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              See more
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Latest List - Left 8 cols */}
            <div className="lg:col-span-8">
              <div className="bg-card rounded-xl p-6">
                <LatestList articles={latest.slice(0, 8)} />
              </div>
            </div>

            {/* Right Rail - Right 4 cols */}
            <div className="lg:col-span-4">
              <Suspense fallback={<RightRailSkeleton />}>
                <RightRail title="Most Popular" items={mockRightRailItems} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Storylines Strip */}
      <StorylinesStrip items={mockStorylinesItems} />

      {/* Startups Section */}
      <StartupsBlock
        featuredArticle={mockStartupsFeatured}
        sideArticles={mockStartupsSide}
      />

      {/* Podcasts Section */}
      <PodcastsBlock title="Podcasts" items={mockPodcastItems} />

      {/* Explore by Category */}
      <ExploreByCategory />

      {/* DB-Safe Banner - Feature Flagged */}
      {!IS_DB_CONFIGURED && SHOW_DB_SAFE_BANNER && (
        <div className="fixed bottom-3 left-3 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300 text-xs backdrop-blur-sm z-50">
          DB-safe mode: using mock data
        </div>
      )}
    </>
  );
}

// Loading Skeletons
function TopHeadlinesSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="w-5 h-5 bg-muted rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-full mb-1"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RightRailSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-3 animate-pulse">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-full mb-1"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
