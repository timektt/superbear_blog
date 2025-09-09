import { Metadata } from 'next';
import Link from 'next/link';
import { IS_DB_CONFIGURED } from '@/lib/env';
import { getAllMagazineData } from '@/lib/data/magazine';
import { getLayoutMode, isDevOverlaysEnabled, logFeatureFlags } from '@/lib/feature-flags';
import { logValidationResults } from '@/lib/utils/feature-flag-validator';
import TopHeader from '@/components/sections/TopHeader';
import HighlightTicker from '@/components/sections/HighlightTicker';
import HeroMosaic from '@/components/sections/HeroMosaic';
import LatestNewsRail from '@/components/sections/LatestNewsRail';
import CategoryExploration from '@/components/sections/CategoryExploration';
import LayoutDebugIndicator from '@/components/debug/LayoutDebugIndicator';

export const metadata: Metadata = {
  title: 'SuperBear Blog - Tech News for Developers',
  description:
    'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs. Discover AI & LLM news, developer tools, and startup insights.',
};

// Classic homepage layout component
function ClassicHomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            SuperBear Blog
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Tech News for Developers, AI Builders, and Tech Entrepreneurs
          </p>
          <Link
            href="/news"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Explore Articles
          </Link>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Latest News</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Mock Articles */}
            {[
              {
                title: "OpenAI launches GPT-5 with real-time voice + vision",
                summary: "Next-gen LLM adds multimodal reasoning, memory, and live assistant capabilities.",
                category: "AI",
                author: "SuperBear Reporter",
                date: "Aug 6, 2025",
                slug: "gpt5-rt-voice-vision"
              },
              {
                title: "GitHub Copilot adds team collaboration",
                summary: "Real-time pair programming and shared context for teams.",
                category: "DevTools", 
                author: "Jane Doe",
                date: "Aug 6, 2025",
                slug: "copilot-collab"
              },
              {
                title: "Vercel releases Edge Runtimes 2.0",
                summary: "Faster cold starts and streaming primitives.",
                category: "Open Source",
                author: "Alex Kim", 
                date: "Aug 6, 2025",
                slug: "vercel-edge-2"
              }
            ].map((article, index) => (
              <article key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-3 line-clamp-2">
                  <Link href={`/news/${article.slug}`} className="hover:text-primary transition-colors">
                    {article.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {article.summary}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{article.author}</span>
                  <span className="mx-2">•</span>
                  <span>{article.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Explore by Category</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "AI", count: 15, slug: "ai" },
              { name: "DevTools", count: 12, slug: "devtools" },
              { name: "Startups", count: 8, slug: "startups" },
              { name: "Open Source", count: 10, slug: "open-source" }
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/${category.slug}`}
                className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg transition-all hover:scale-105"
              >
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {category.name}
                </h3>
                <p className="text-muted-foreground">
                  {category.count} articles
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DB Safe Mode Banner */}
      {!IS_DB_CONFIGURED && (
        <div className="fixed bottom-4 left-4 bg-amber-500/10 border border-amber-400/30 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
          DB-safe mode: using mock data
        </div>
      )}

      {/* Layout Debug Indicator */}
      <LayoutDebugIndicator />
    </div>
  );
}

// Magazine homepage layout component
async function MagazineHomePage() {
  // Fetch all magazine data in parallel
  const magazineData = await getAllMagazineData(12);
  
  const {
    tickerArticles,
    featuredArticles,
    latestArticles,
    categories,
    success,
    errors
  } = magazineData;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header with Brand Hero */}
      <TopHeader
        title="SuperBear Blog"
        tagline="Tech News for Developers, AI Builders, and Tech Entrepreneurs"
        ctaText="Explore Articles"
        ctaHref="/news"
      />

      {/* Highlight Ticker */}
      <HighlightTicker
        articles={tickerArticles}
        autoScroll={true}
        scrollSpeed={50}
      />

      {/* Hero Mosaic: Newsletter Panel + Featured Articles */}
      <HeroMosaic
        featuredArticles={featuredArticles}
        className="py-8"
      />

      {/* Latest News Rail */}
      <LatestNewsRail
        articles={latestArticles}
        showNavButtons={true}
        className="py-8 bg-muted/30"
      />

      {/* Category Exploration */}
      <CategoryExploration
        categories={categories}
      />

      {/* DB Safe Mode Banner */}
      {!IS_DB_CONFIGURED && (
        <div className="fixed bottom-4 left-4 bg-amber-500/10 border border-amber-400/30 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
          DB-safe mode: using mock data
        </div>
      )}

      {/* Debug Info (only when dev overlays are enabled) */}
      {isDevOverlaysEnabled() && !success && errors.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-400/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm backdrop-blur-sm max-w-sm">
          <div className="font-semibold mb-1">Magazine Data Errors:</div>
          <ul className="text-xs space-y-1">
            {errors.slice(0, 3).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
            {errors.length > 3 && <li>• ... and {errors.length - 3} more</li>}
          </ul>
        </div>
      )}

      {/* Layout Debug Indicator */}
      <LayoutDebugIndicator />
    </div>
  );
}

// Main homepage component with feature flag logic
export default function Home() {
  // Log feature flags and validate configuration in development
  logFeatureFlags();
  logValidationResults();
  
  // Get the current layout mode using feature flag system
  const layoutMode = getLayoutMode();
  
  // Switch between magazine and classic layouts
  if (layoutMode === 'magazine') {
    return <MagazineHomePage />;
  }
  
  // Default to classic layout
  return <ClassicHomePage />;
}


