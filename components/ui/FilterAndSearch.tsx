'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import TagFilter from './TagFilter';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: {
    articles: number;
  };
}

interface FilterAndSearchProps {
  className?: string;
}

export default function FilterAndSearch({
  className = '',
}: FilterAndSearchProps) {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if any filters are active
  const hasActiveFilters =
    searchParams.get('search') ||
    searchParams.get('category') ||
    searchParams.get('tags');

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    setIsLoading(true);
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags'),
      ]);

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Search Bar Skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>

        {/* Category Filter Skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 bg-gray-200 rounded-full animate-pulse"
                style={{ width: `${80 + Math.random() * 40}px` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Tag Filter Skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-8 bg-gray-200 rounded-full animate-pulse"
                style={{ width: `${60 + Math.random() * 30}px` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar */}
      <SearchBar className="w-full" />

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-blue-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Filters applied
              </span>
            </div>
            <Link
              href="/news"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </Link>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div>
        <CategoryFilter categories={categories} />
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <TagFilter tags={tags} />
        </div>
      )}
    </div>
  );
}