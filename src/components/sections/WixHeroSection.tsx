'use client';

import Link from 'next/link';
import OptimizedImage, {
  HeroImage,
  ThumbnailImage,
} from '@/components/ui/OptimizedImage';

interface Article {
  id?: string;
  title: string;
  summary: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  slug: string;
}

interface WixHeroSectionProps {
  featuredArticles: Article[];
}

export default function WixHeroSection({
  featuredArticles,
}: WixHeroSectionProps) {
  // Ensure we have at least one article for the main hero
  const mainFeatured = featuredArticles[0];
  const secondaryFeatured = featuredArticles.slice(1, 3);

  // Fallback if no articles provided
  if (!mainFeatured) {
    return (
      <section className="bg-white dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Featured Articles Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Check back soon for the latest tech news and insights.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-white dark:bg-gray-900 py-8 lg:py-12"
      aria-label="Featured articles"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Featured Article - Large Hero */}
          <article className="lg:col-span-8" role="article">
            <Link
              href={`/news/${mainFeatured.slug}`}
              className="group block relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 aspect-[16/9] hover:shadow-2xl transition-all duration-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              aria-label={`Read featured article: ${mainFeatured.title}`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <HeroImage
                  src={mainFeatured.imageUrl}
                  alt={mainFeatured.title}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
                {/* Category Badge */}
                <div className="mb-4">
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30 uppercase tracking-wide"
                    role="badge"
                    aria-label={`Category: ${mainFeatured.category}`}
                  >
                    {mainFeatured.category}
                  </span>
                </div>

                {/* Title - Modern Typography Hierarchy */}
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-blue-100 transition-colors duration-300"
                  id="hero-article-title"
                >
                  {mainFeatured.title}
                </h1>

                {/* Summary */}
                <p
                  className="text-gray-200 text-base sm:text-lg lg:text-xl mb-6 leading-relaxed line-clamp-2 max-w-3xl"
                  id="hero-article-summary"
                >
                  {mainFeatured.summary}
                </p>

                {/* Meta Info and CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Author and Date */}
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="font-medium">{mainFeatured.author}</span>
                    <span className="mx-2">•</span>
                    <span>{mainFeatured.date}</span>
                  </div>

                  {/* Wix-Style CTA Button */}
                  <div
                    className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full text-white font-semibold hover:bg-white/20 hover:border-white/50 transition-all duration-300 group-hover:scale-105"
                    role="button"
                    aria-label="Read full article"
                  >
                    <span className="mr-2">Read Article</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </article>

          {/* Secondary Featured Articles */}
          <aside
            className="lg:col-span-4 space-y-6"
            aria-label="Secondary featured articles"
          >
            {secondaryFeatured.length > 0 ? (
              secondaryFeatured.map((article, index) => (
                <SecondaryFeaturedCard
                  key={article.slug || index}
                  article={article}
                />
              ))
            ) : (
              // Fallback when no secondary articles
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  More Stories Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Stay tuned for more featured content.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

// Secondary Featured Article Card Component
function SecondaryFeaturedCard({ article }: { article: Article }) {
  return (
    <article role="article">
      <Link
        href={`/news/${article.slug}`}
        className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`Read secondary featured article: ${article.title}`}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <ThumbnailImage
            src={article.imageUrl}
            alt={article.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-white/90 text-gray-900 uppercase tracking-wide"
              role="badge"
              aria-label={`Category: ${article.category}`}
            >
              {article.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>

          {/* Meta Info */}
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
            <span className="font-medium">{article.author}</span>
            <span className="mx-2">•</span>
            <span>{article.date}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
