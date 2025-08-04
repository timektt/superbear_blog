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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border animate-pulse"
          >
            <div className="aspect-video w-full bg-gray-200 rounded-t-lg"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex gap-1">
                  <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                  <div className="h-5 bg-gray-200 rounded-full w-12"></div>
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
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No articles found
        </h3>
        <p className="text-gray-500">
          There are no published articles matching your criteria. Check back
          later for new content!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
