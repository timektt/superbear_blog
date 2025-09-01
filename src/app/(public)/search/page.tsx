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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Search Articles
          </h1>
          <SearchBar className="w-full max-w-3xl" onSearch={handleSearch} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Sort Options */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>

              {/* Categories */}
              {results.facets.categories.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    Categories
                  </h3>
                  <div className="space-y-3">
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
                        className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          category === cat.slug
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {results.facets.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    Tags
                  </h3>
                  <div className="space-y-3">
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
                        className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          tag === tagItem.slug
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>#{tagItem.name}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {tagItem.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors */}
              {results.facets.authors.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    Authors
                  </h3>
                  <div className="space-y-3">
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
                        className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          author === authorItem.name
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span>{authorItem.name}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {authorItem.count}
                        </span>
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
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {loading && results.articles.length === 0
                      ? 'Searching...'
                      : `${results.total} results`}
                    {query && ` for "${query}"`}
                  </p>

                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-3">
                      {category && (
                        <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Category: {category}
                          <button
                            onClick={() => updateURL({ q: query, tag, author })}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {tag && (
                        <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                          Tag: {tag}
                          <button
                            onClick={() =>
                              updateURL({ q: query, category, author })
                            }
                            className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors duration-200"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {author && (
                        <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Author: {author}
                          <button
                            onClick={() =>
                              updateURL({ q: query, tag, category })
                            }
                            className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors duration-200"
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
              <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {loading && results.articles.length === 0 ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-56 mb-6"></div>
                    <div className="space-y-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-5 w-3/4"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-4 w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.articles.length > 0 ? (
              <>
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {results.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {results.pagination.hasMore && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : hasResults ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400 dark:text-gray-500"
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
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                  Try adjusting your search terms or filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all duration-200"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400 dark:text-gray-500"
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
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Start searching
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
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
