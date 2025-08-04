'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleGrid from '@/components/ui/ArticleGrid';
import CategoryFilter from '@/components/ui/CategoryFilter';
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

interface Category {
  id: string;
  name: string;
  slug: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, currentCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticles = async () => {
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
  };

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
          onClick={fetchArticles}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <CategoryFilter categories={categories} />

      {/* Articles Grid */}
      <ArticleGrid articles={articles} isLoading={isLoading} />

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

      {/* Results Summary */}
      {!isLoading && articles.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} articles
          {currentCategory && (
            <span>
              {' '}
              in{' '}
              <span className="font-medium">
                {categories.find((cat) => cat.slug === currentCategory)?.name ||
                  currentCategory}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
