'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import ArticleTable from '@/components/admin/ArticleTable';
import { Status } from '@/types/database';

interface Article {
  id: string;
  title: string;
  slug: string;
  status: Status;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    author: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.author) params.append('author', filters.author);

      const response = await fetch(`/api/admin/articles?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data: ArticlesResponse = await response.json();
      setArticles(data.articles);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchArticles();
  }, [filters, pagination.page, fetchArticles]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      // Refresh articles list
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your blog articles
            </p>
          </div>
          <Link
            href="/admin/articles/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Article
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <ArticleTable
          articles={articles}
          loading={loading}
          filters={filters}
          pagination={pagination}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onDeleteArticle={handleDeleteArticle}
        />
      </div>
    </AdminLayout>
  );
}
