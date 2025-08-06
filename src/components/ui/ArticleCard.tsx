'use client';

import Link from 'next/link';
import OptimizedImage from './OptimizedImage';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    image: string | null;
    publishedAt: Date | null;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    };
    tags: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatDateForScreenReader = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 group overflow-hidden">
      <Link
        href={`/news/${article.slug}`}
        className="block focus:outline-none"
        aria-label={`Read article: ${article.title}`}
      >
        {/* Article Image */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
          {article.image ? (
            <OptimizedImage
              src={article.image}
              alt={`Cover image for ${article.title}`}
              width={400}
              height={300}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <p
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-medium tracking-wide"
                  aria-hidden="true"
                >
                  Article
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="p-6">
          {/* Category and Date */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 w-fit tracking-wide"
              role="text"
              aria-label={`Category: ${article.category.name}`}
            >
              {article.category.name}
            </span>
            <time
              className="text-sm text-gray-500 dark:text-gray-400 font-medium"
              dateTime={article.publishedAt?.toISOString()}
              aria-label={`Published on ${formatDateForScreenReader(article.publishedAt)}`}
            >
              {formatDate(article.publishedAt)}
            </time>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight tracking-tight text-balance">
            {article.title}
          </h3>

          {/* Summary */}
          {article.summary && (
            <p className="text-gray-600 dark:text-gray-300 text-base mb-6 line-clamp-3 leading-relaxed text-balance">
              {article.summary}
            </p>
          )}

          {/* Author and Tags */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center min-w-0">
              {article.author.avatar ? (
                <OptimizedImage
                  src={article.author.avatar}
                  alt={`${article.author.name}'s avatar`}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full mr-3 flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mr-3 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <span className="text-sm text-white font-semibold">
                    {article.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span
                className="text-sm text-gray-700 dark:text-gray-300 font-semibold truncate tracking-wide"
                title={`By ${article.author.name}`}
              >
                {article.author.name}
              </span>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div
                className="flex flex-wrap gap-2"
                role="list"
                aria-label="Article tags"
              >
                {article.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 tracking-wide"
                    role="listitem"
                  >
                    {tag.name}
                  </span>
                ))}
                {article.tags.length > 2 && (
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 tracking-wide"
                    role="listitem"
                    aria-label={`${article.tags.length - 2} more tags`}
                  >
                    +{article.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
