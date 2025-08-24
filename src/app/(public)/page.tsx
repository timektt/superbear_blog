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
import { NewsletterSubscription } from '@/components/newsletter/NewsletterSubscription';
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
          title: MOCK_FEATURED.title,
          summary: MOCK_FEATURED.summary,
          category: MOCK_FEATURED.category.name,
          author: MOCK_FEATURED.author.name,
          date: MOCK_FEATURED.date,
          imageUrl: MOCK_FEATURED.imageUrl,
          slug: MOCK_FEATURED.slug,
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
          title: featured.title,
          summary: featured.summary || '',
          category: featured.category?.name || 'Tech',
          author: featured.author?.name || 'SuperBear Reporter',
          date: featured.createdAt ? new Date(featured.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          imageUrl: featured.image || featured.imageUrl || '/og-default.svg',
          slug: featured.slug,
        }}
        headlines={headlines.length > 0 ? headlines : MOCK_TOP_HEADLINES}
        latest={latest.length > 0 ? latest.map(article => ({
          id: article.id,
          title: article.title,
          category: article.category?.name || 'Tech',
          author: article.author?.name || 'SuperBear Reporter',
          date: article.createdAt ? new Date(article.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          slug: article.slug,
          imageUrl: article.image || article.imageUrl || '/og-default.svg',
          snippet: article.summary || '',
          tags: article.tags?.map(tag => tag.name) || [],
        })) : MOCK_LATEST}
      />
    );
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return (
      <HomeView
        featured={{
          title: MOCK_FEATURED.title,
          summary: MOCK_FEATURED.summary,
          category: MOCK_FEATURED.category.name,
          author: MOCK_FEATURED.author.name,
          date: MOCK_FEATURED.date,
          imageUrl: MOCK_FEATURED.imageUrl,
          slug: MOCK_FEATURED.slug,
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
    imageUrl: string;
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
    imageUrl: string;
    snippet?: string;
    tags: string[];
  }>;
}) {
  return (
    <>
      {/* Above the Fold - TechCrunch Style Hero Band */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Latest News Section - TechCrunch Style */}
      <section className="bg-white dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Latest News
            </h2>
            <Link
              href="/news"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
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
            {/* Latest List - Left 8-9 cols */}
            <div className="lg:col-span-9">
              <LatestList articles={latest.slice(0, 8)} />
            </div>

            {/* Right Rail - Right 3-4 cols */}
            <div className="lg:col-span-3">
              <RightRail title="Most Popular" items={mockRightRailItems} />
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

      {/* Newsletter Subscription */}
      <section className="bg-gray-50 dark:bg-gray-800 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Newsletter - Left 8 cols */}
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
                    Newsletter
                  </h2>
                </div>
                <NewsletterSubscription
                  source="homepage"
                  variant="compact"
                  utmSource="homepage"
                  utmCampaign="main_section"
                />
              </div>
            </div>

            {/* Right Rail continues */}
            <div className="lg:col-span-4">
              <RightRail
                title="Stay Connected"
                items={[
                  {
                    title: 'Join 10,000+ developers',
                    excerpt:
                      'Get curated tech news and insights delivered weekly',
                    timeAgo: 'Weekly',
                    slug: '#newsletter',
                  },
                  {
                    title: 'No spam, ever',
                    excerpt: 'Unsubscribe anytime with one click',
                    timeAgo: 'Promise',
                    slug: '#privacy',
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

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
