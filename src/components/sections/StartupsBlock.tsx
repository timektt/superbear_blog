'use client';
import Link from 'next/link';
import Image from 'next/image';

interface StartupArticle {
  title: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  slug?: string;
  snippet?: string;
}

interface StartupsBlockProps {
  featuredArticle: StartupArticle;
  sideArticles: StartupArticle[];
  gridArticles?: StartupArticle[];
}

export default function StartupsBlock({
  featuredArticle,
  sideArticles,
  gridArticles = [],
}: StartupsBlockProps) {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-1 h-8 bg-orange-500 rounded-full mr-4"></div>
            Startups
          </h2>
          <Link
            href="/startups"
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold text-sm flex items-center transition-colors duration-200"
          >
            View All
            <svg
              className="ml-2 w-4 h-4"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Featured Article - 2/3 width */}
          <div className="lg:col-span-2">
            <article className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
              <Link
                href={`/news/${featuredArticle.slug || 'featured-startup'}`}
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={featuredArticle.imageUrl}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                      {featuredArticle.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                    {featuredArticle.title}
                  </h3>

                  {featuredArticle.snippet && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {featuredArticle.snippet}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">
                      {featuredArticle.author}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{featuredArticle.date}</span>
                  </div>
                </div>
              </Link>
            </article>
          </div>

          {/* Side Articles - 1/3 width */}
          <div className="space-y-6">
            {sideArticles.map((article, index) => (
              <article
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <Link href={`/news/${article.slug || `startup-${index + 1}`}`}>
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                      {article.title}
                    </h4>

                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{article.author}</span>
                      <span className="mx-2">•</span>
                      <span>{article.date}</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Optional Grid Articles */}
        {gridArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gridArticles.map((article, index) => (
              <article
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <Link
                  href={`/news/${article.slug || `startup-grid-${index + 1}`}`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 mb-2">
                        {article.category}
                      </span>

                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                        {article.title}
                      </h4>

                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{article.author}</span>
                        <span className="mx-2">•</span>
                        <span>{article.date}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
