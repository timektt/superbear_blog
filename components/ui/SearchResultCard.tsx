'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import OptimizedImage from './OptimizedImage';
import { highlightSearchTerm, createSearchExcerpt } from '@/lib/search-utils';

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

interface SearchResultCardProps {
  article: Article;
}

export default function SearchResultCard({ article }: SearchResultCardProps) {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const highlightedTitle = highlightSearchTerm(article.title, searchTerm);
  const highlightedSummary = article.summary 
    ? highlightSearchTerm(createSearchExcerpt(article.summary, searchTerm, 150), searchTerm)
    : '';

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        {article.image && (
          <div className="sm:w-48 sm:flex-shrink-0">
            <Link href={`/news/${article.slug}`}>
              <OptimizedImage
                src={article.image}
                alt={article.title}
                width={192}
                height={128}
                className="w-full h-32 sm:h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
              />
            </Link>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/news?category=${article.category.slug}`}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
            >
              {article.category.name}
            </Link>
            <time className="text-sm text-gray-500">
              {formatDate(article.publishedAt)}
            </time>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            <Link
              href={`/news/${article.slug}`}
              className="hover:text-indigo-600 transition-colors"
              dangerouslySetInnerHTML={{ __html: highlightedTitle }}
            />
          </h2>

          {highlightedSummary && (
            <p
              className="text-gray-600 mb-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedSummary }}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {article.author.avatar && (
                <OptimizedImage
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              <span className="text-sm text-gray-700">{article.author.name}</span>
            </div>

            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/news?tags=${tag.slug}`}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
                {article.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{article.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}