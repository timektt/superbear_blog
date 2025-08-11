'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ArticleGrid from '@/components/ui/ArticleGrid';
import SearchResultCard from '@/components/ui/SearchResultCard';
import FilterAndSearch from '@/components/ui/FilterAndSearch';
import Pagination from '@/components/ui/Pagination';

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

interface ArticlesResponse {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function NewsContent() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || '';
  const currentTags = searchParams.get('tags') || '';
  const currentSearch = searchParams.get('search') || '';

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '9',
      });

      if (currentCategory) {
        params.set('category', currentCategory);
      }

      if (currentTags) {
        params.set('tags', currentTags);
      }

      if (currentSearch) {
        params.set('search', currentSearch);
      }

      const response = await fetch(`/api/articles?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data: ArticlesResponse = await response.json();

      // Convert publishedAt strings to Date objects
      const articlesWithDates = data.articles.map((article) => ({
        ...article,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      }));

      setArticles(articlesWithDates);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentCategory, currentTags, currentSearch]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchArticles}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Check if we're in search mode
  const isSearchMode = currentSearch.trim().length > 0;
  const hasActiveFilters = currentCategory || currentTags || currentSearch;

  return (
    <div className="space-y-8">
      {/* Filter and Search Interface */}
      <FilterAndSearch />

      {/* Results Summary */}
      {!isLoading && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {articles.length > 0 ? (
              <>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} articles
                {hasActiveFilters && (
                  <span className="ml-1 text-indigo-600 font-medium">
                    (filtered)
                  </span>
                )}
              </>
            ) : hasActiveFilters ? (
              'No articles match your search criteria'
            ) : (
              'No articles available'
            )}
          </div>

          {hasActiveFilters && (
            <Link
              href="/news"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear all filters
            </Link>
          )}
        </div>
      )}

      {/* Articles Display */}
      {isSearchMode && !isLoading ? (
        // Search Results Layout
        <div className="space-y-4">
          {articles.map((article) => (
            <SearchResultCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        // Grid Layout for browsing
        <ArticleGrid articles={articles} isLoading={isLoading} />
      )}

      {/* Enhanced No Results Message */}
      {!isLoading && articles.length === 0 && hasActiveFilters && (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No articles found
          </h3>
          <p className="text-gray-500 mb-4">
            {currentSearch
              ? `No articles match "${currentSearch}". Try different keywords or remove some filters.`
              : 'No articles match your current filters. Try adjusting your selection.'}
          </p>
          <div className="space-x-4">
            <Link
              href="/news"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View all articles
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.pages > 1 && (
        <div className="mt-12">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            baseUrl="/news"
          />
        </div>
      )}
    </div>
  );
}
