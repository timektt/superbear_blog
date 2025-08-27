'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/ui/SearchBar';
import ArticleCard from '@/components/ui/ArticleCard';

interface SearchFacets {
  tags: Array<{ name: string; slug: string; count: number }>;
  authors: Array<{ name: string; count: number }>;
  categories: Array<{ name: string; slug: string; count: number }>;
}

interface SearchResult {
  articles: any[];
  total: number;
  facets: SearchFacets;
  query: {
    q: string;
    tag?: string;
    category?: string;
    author?: string;
    sortBy?: string;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const category = searchParams.get('category') || '';
  const author = searchParams.get('author') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';

  const [results, setResults] = useState<SearchResult>({
    articles: [],
    total: 0,
    facets: { tags: [], authors: [], categories: [] },
    query: { q: query, tag, category, author, sortBy },
    pagination: { limit: 20, offset: 0, hasMore: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query || tag || category || author) {
      performSearch();
    }
  }, [query, tag, category, author, sortBy]);

  const performSearch = async (offset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (tag) params.set('tag', tag);
      if (category) params.set('category', category);
      if (author) params.set('author', author);
      if (sortBy) params.set('sortBy', sortBy);
      params.set('limit', '20');
      params.set('offset', offset.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      if (offset === 0) {
        setResults(data);
      } else {
        // Append results for pagination
        setResults((prev) => ({
          ...data,
          articles: [...prev.articles, ...data.articles],
        }));
      }
    } catch (err) {
      setError('Failed to search articles. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    updateURL({ q: searchQuery });
  };

  const updateURL = (params: Record<string, string>) => {
    const url = new URL(window.location.href);

    // Clear existing search params
    url.searchParams.delete('q');
    url.searchParams.delete('tag');
    url.searchParams.delete('category');
    url.searchParams.delete('author');
    url.searchParams.delete('sortBy');

    // Add new params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    router.push(url.pathname + url.search);
  };

  const clearFilters = () => {
    updateURL({ q: query });
  };

  const loadMore = () => {
    if (results.pagination.hasMore && !loading) {
      performSearch(results.articles.length);
    }
  };

  const hasActiveFilters = tag || category || author;
  const hasResults = query || tag || category || author;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Search Articles
          </h1>
          <SearchBar className="w-full max-w-2xl" onSearch={handleSearch} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Sort Options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Sort by
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    updateURL({
                      q: query,
                      tag,
                      category,
                      author,
                      sortBy: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>

              {/* Categories */}
              {results.facets.categories.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {results.facets.categories.slice(0, 5).map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() =>
                          updateURL({
                            q: query,
                            category: category === cat.slug ? '' : cat.slug,
                            tag,
                            author,
                          })
                        }
                        className={`flex items-center justify-between w-full text-left px-2 py-1 rounded text-sm ${
                          category === cat.slug
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {results.facets.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Tags
                  </h3>
                  <div className="space-y-2">
                    {results.facets.tags.slice(0, 8).map((tagItem) => (
                      <button
                        key={tagItem.slug}
                        onClick={() =>
                          updateURL({
                            q: query,
                            tag: tag === tagItem.slug ? '' : tagItem.slug,
                            category,
                            author,
                          })
                        }
                        className={`flex items-center justify-between w-full text-left px-2 py-1 rounded text-sm ${
                          tag === tagItem.slug
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span>#{tagItem.name}</span>
                        <span className="text-xs">{tagItem.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors */}
              {results.facets.authors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Authors
                  </h3>
                  <div className="space-y-2">
                    {results.facets.authors.slice(0, 5).map((authorItem) => (
                      <button
                        key={authorItem.name}
                        onClick={() =>
                          updateURL({
                            q: query,
                            author:
                              author === authorItem.name ? '' : authorItem.name,
                            tag,
                            category,
                          })
                        }
                        className={`flex items-center justify-between w-full text-left px-2 py-1 rounded text-sm ${
                          author === authorItem.name
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{authorItem.name}</span>
                        <span className="text-xs">{authorItem.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {hasResults && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 dark:text-gray-400">
                    {loading && results.articles.length === 0
                      ? 'Searching...'
                      : `${results.total} results`}
                    {query && ` for "${query}"`}
                  </p>

                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                      {category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          Category: {category}
                          <button
                            onClick={() => updateURL({ q: query, tag, author })}
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-500"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {tag && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Tag: {tag}
                          <button
                            onClick={() =>
                              updateURL({ q: query, category, author })
                            }
                            className="ml-1 text-green-600 dark:text-green-400 hover:text-green-500"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {author && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          Author: {author}
                          <button
                            onClick={() =>
                              updateURL({ q: query, tag, category })
                            }
                            className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-500"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {loading && results.articles.length === 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.articles.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {results.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {results.pagination.hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : hasResults ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search terms or filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start searching
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a search term to find articles, tags, or categories.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
