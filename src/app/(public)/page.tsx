import { Metadata } from 'next';
import Link from 'next/link';
import Hero from '@/components/sections/Hero';
import WixHeroSection from '@/components/sections/WixHeroSection';
import TopHeadlines from '@/components/sections/TopHeadlines';
import LatestList from '@/components/sections/LatestList';
import RightRail from '@/components/sections/RightRail';
import StorylinesStrip from '@/components/sections/StorylinesStrip';
import StartupsBlock from '@/components/sections/StartupsBlock';
import PodcastsBlock from '@/components/sections/PodcastsBlock';
import ExploreByCategory from '@/components/sections/ExploreByCategory';
import CategoryFilteredArticles from '@/components/sections/CategoryFilteredArticles';
import { NewsletterCTA } from '@/components/sections/NewsletterCTA';
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
    const mockFeaturedArticles = [
      {
        id: MOCK_FEATURED.id,
        title: MOCK_FEATURED.title,
        summary: MOCK_FEATURED.summary,
        category: MOCK_FEATURED.category.name,
        author: MOCK_FEATURED.author.name,
        date: MOCK_FEATURED.date,
        imageUrl: MOCK_FEATURED.imageUrl,
        slug: MOCK_FEATURED.slug,
      },
      // Add secondary featured articles from MOCK_LATEST
      ...MOCK_LATEST.slice(0, 2).map(article => ({
        id: article.id,
        title: article.title,
        summary: article.snippet || '',
        category: article.category,
        author: article.author,
        date: article.date,
        imageUrl: article.imageUrl,
        slug: article.slug,
      }))
    ];

    // Mock categories for DB-safe mode
    const mockCategories = [
      { id: 'ai', name: 'AI', slug: 'ai', count: 3 },
      { id: 'devtools', name: 'DevTools', slug: 'devtools', count: 2 },
      { id: 'startups', name: 'Startups', slug: 'startups', count: 2 },
      { id: 'open-source', name: 'Open Source', slug: 'open-source', count: 1 },
    ];

    return (
      <HomeView
        featuredArticles={mockFeaturedArticles}
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
        categories={mockCategories}
        articlesForFiltering={MOCK_LATEST.map(article => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.snippet || '',
          image: article.imageUrl,
          createdAt: new Date(article.date),
          author: { id: 'mock', name: article.author, avatar: null },
          category: { 
            id: article.category.toLowerCase().replace(/\s+/g, '-'), 
            name: article.category, 
            slug: article.category.toLowerCase().replace(/\s+/g, '-') 
          },
          tags: article.tags?.map(tag => ({ 
            id: tag, 
            name: tag, 
            slug: tag.toLowerCase().replace(/\s+/g, '-') 
          })) || [],
        }))}
      />
    );
  }

  // Real DB Mode: Fetch data from database
  try {
    const [featuredResults, headlines, latest, categories] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 3, // Get 3 articles for hero section (1 main + 2 secondary)
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
        take: 12, // Increased to show more articles for category filtering
        include: { author: true, category: true, tags: true },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              articles: {
                where: {
                  status: 'PUBLISHED',
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Prepare featured articles for hero section
    const featuredArticles = featuredResults.length > 0 
      ? featuredResults.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || '',
          category: article.category?.name || 'Tech',
          author: article.author?.name || 'SuperBear Reporter',
          date: article.createdAt
            ? new Date(article.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          imageUrl: article.image || article.imageUrl || '/og-default.svg',
          slug: article.slug,
        }))
      : [
          {
            id: MOCK_FEATURED.id,
            title: MOCK_FEATURED.title,
            summary: MOCK_FEATURED.summary,
            category: MOCK_FEATURED.category.name,
            author: MOCK_FEATURED.author.name,
            date: MOCK_FEATURED.date,
            imageUrl: MOCK_FEATURED.imageUrl,
            slug: MOCK_FEATURED.slug,
          }
        ];

    const featured = featuredResults[0] || MOCK_FEATURED;

    // Filter categories that have published articles
    const categoriesWithArticles = categories.filter(
      (category) => category._count.articles > 0
    );

    return (
      <HomeView
        featuredArticles={featuredArticles}
        featured={{
          title: featured.title,
          summary: featured.summary || '',
          category: featured.category?.name || 'Tech',
          author: featured.author?.name || 'SuperBear Reporter',
          date: featured.createdAt
            ? new Date(featured.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          imageUrl: featured.image || featured.imageUrl || '/og-default.svg',
          slug: featured.slug,
        }}
        headlines={headlines.length > 0 ? headlines : MOCK_TOP_HEADLINES}
        latest={
          latest.length > 0
            ? latest.map((article) => ({
                id: article.id,
                title: article.title,
                category: article.category?.name || 'Tech',
                author: article.author?.name || 'SuperBear Reporter',
                date: article.createdAt
                  ? new Date(article.createdAt).toLocaleDateString()
                  : new Date().toLocaleDateString(),
                slug: article.slug,
                imageUrl:
                  article.image || article.imageUrl || '/og-default.svg',
                snippet: article.summary || '',
                tags: article.tags?.map((tag) => tag.name) || [],
              }))
            : MOCK_LATEST
        }
        categories={categoriesWithArticles.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat._count.articles,
        }))}
        articlesForFiltering={latest.length > 0 ? latest : []}
      />
    );
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    const mockFeaturedArticles = [
      {
        id: MOCK_FEATURED.id,
        title: MOCK_FEATURED.title,
        summary: MOCK_FEATURED.summary,
        category: MOCK_FEATURED.category.name,
        author: MOCK_FEATURED.author.name,
        date: MOCK_FEATURED.date,
        imageUrl: MOCK_FEATURED.imageUrl,
        slug: MOCK_FEATURED.slug,
      },
      // Add secondary featured articles from MOCK_LATEST
      ...MOCK_LATEST.slice(0, 2).map(article => ({
        id: article.id,
        title: article.title,
        summary: article.snippet || '',
        category: article.category,
        author: article.author,
        date: article.date,
        imageUrl: article.imageUrl,
        slug: article.slug,
      }))
    ];

    // Mock categories for error fallback
    const mockCategories = [
      { id: 'ai', name: 'AI', slug: 'ai', count: 3 },
      { id: 'devtools', name: 'DevTools', slug: 'devtools', count: 2 },
      { id: 'startups', name: 'Startups', slug: 'startups', count: 2 },
      { id: 'open-source', name: 'Open Source', slug: 'open-source', count: 1 },
    ];

    return (
      <HomeView
        featuredArticles={mockFeaturedArticles}
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
        categories={mockCategories}
        articlesForFiltering={MOCK_LATEST.map(article => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.snippet || '',
          image: article.imageUrl,
          createdAt: new Date(article.date),
          author: { id: 'mock', name: article.author, avatar: null },
          category: { 
            id: article.category.toLowerCase().replace(/\s+/g, '-'), 
            name: article.category, 
            slug: article.category.toLowerCase().replace(/\s+/g, '-') 
          },
          tags: article.tags?.map(tag => ({ 
            id: tag, 
            name: tag, 
            slug: tag.toLowerCase().replace(/\s+/g, '-') 
          })) || [],
        }))}
      />
    );
  }
}

// Home View Component
function HomeView({
  featuredArticles,
  featured,
  headlines,
  latest,
  categories = [],
  articlesForFiltering = [],
}: {
  featuredArticles: Array<{
    id: string;
    title: string;
    summary: string;
    category: string;
    author: string;
    date: string;
    imageUrl: string;
    slug: string;
  }>;
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
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
  articlesForFiltering?: any[];
}) {
      {/* New Wix-Inspired Hero Section */}
      <WixHeroSection featuredArticles={featuredArticles} />

      {/* Latest News Section */}
      <section className="bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Latest News</h2>
            <Link
              href="/news"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors duration-200"
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

      {/* Category Filtered Articles Section */}
      {categories.length > 0 && articlesForFiltering.length > 0 && (
        <CategoryFilteredArticles
          articles={articlesForFiltering.map(article => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            image: article.image || article.imageUrl,
            publishedAt: article.createdAt,
            author: {
              id: article.author?.id || 'unknown',
              name: article.author?.name || 'SuperBear Reporter',
              avatar: article.author?.avatar || null,
            },
            category: {
              id: article.category?.id || 'unknown',
              name: article.category?.name || 'Tech',
              slug: article.category?.slug || 'tech',
            },
            tags: article.tags?.map((tag: any) => ({
              id: tag.id || tag.name,
              name: tag.name,
              slug: tag.slug || tag.name.toLowerCase().replace(/\s+/g, '-'),
            })) || [],
          }))}
          categories={categories}
          title="Browse by Category"
          description="Filter articles by topic to find exactly what you're looking for"
          columns={3}
          className="border-t border-border"
        />
      )}

      {/* Storylines Strip */}
      <StorylinesStrip items={mockStorylinesItems} />

      {/* Startups Section */}
      <StartupsBlock
        featuredArticle={mockStartupsFeatured}
        sideArticles={mockStartupsSide}
      />

      {/* Podcasts Section */}
      <PodcastsBlock title="Podcasts" items={mockPodcastItems} />

      {/* Newsletter CTA Section */}
      <NewsletterCTA 
        variant="gradient"
        showTestimonials={true}
        showStats={true}
        className="bg-muted/20"
      />

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
