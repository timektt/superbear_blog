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

  return (
    <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      <Link href={`/news/${article.slug}`} className="block">
        {/* Article Image */}
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
          {article.image ? (
            <OptimizedImage
              src={article.image}
              alt={article.title}
              width={400}
              height={225}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-indigo-200 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-indigo-600"
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
                <p className="text-xs text-indigo-600 font-medium">Article</p>
              </div>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="p-6">
          {/* Category and Date */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {article.category.name}
            </span>
            <time className="text-sm text-gray-500">
              {formatDate(article.publishedAt)}
            </time>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
            {article.title}
          </h3>

          {/* Summary */}
          {article.summary && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {article.summary}
            </p>
          )}

          {/* Author and Tags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {article.author.avatar ? (
                <OptimizedImage
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full mr-2"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
                  <span className="text-xs text-gray-600 font-medium">
                    {article.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-700 font-medium">
                {article.author.name}
              </span>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag.name}
                  </span>
                ))}
                {article.tags.length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
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
