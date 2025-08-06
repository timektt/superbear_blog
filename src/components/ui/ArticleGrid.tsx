'use client';

import ArticleCard from './ArticleCard';

interface Article {
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
}

interface ArticleGridProps {
  articles: Article[];
  isLoading?: boolean;
}

export default function ArticleGrid({
  articles,
  isLoading = false,
}: ArticleGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        aria-label="Loading articles"
        role="status"
      >
        <span className="sr-only">Loading articles...</span>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse overflow-hidden"
            aria-hidden="true"
          >
            <div className="aspect-[4/3] w-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-16"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500"
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
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          No articles found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed text-balance">
          There are no published articles matching your criteria. Try adjusting
          your search or filters, or check back later for new content!
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
      role="list"
      aria-label={`${articles.length} article${articles.length === 1 ? '' : 's'} found`}
    >
      {articles.map((article) => (
        <div key={article.id} role="listitem">
          <ArticleCard article={article} />
        </div>
      ))}
    </div>
  );
}
