'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Search articles...',
  className = '',
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Initialize search term from URL
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    setSearchTerm(currentSearch);
  }, [searchParams]);

  const handleSearch = useCallback(
    (term: string) => {
      setIsSearching(true);
      const params = new URLSearchParams(searchParams.toString());

      if (term.trim()) {
        params.set('search', term.trim());
      } else {
        params.delete('search');
      }

      // Reset to first page when searching
      params.delete('page');

      const queryString = params.toString();
      const newUrl = queryString ? `/news?${queryString}` : '/news';

      router.push(newUrl);
      
      // Reset searching state after a short delay
      setTimeout(() => setIsSearching(false), 500);
    },
    [router, searchParams]
  );

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchTerm !== (searchParams.get('search') || '')) {
      handleSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, handleSearch, searchParams]);

  const handleClear = () => {
    setSearchTerm('');
    handleSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`} role="search">
      <label htmlFor="search-input" className="sr-only">
        Search articles
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <div className="animate-spin h-5 w-5 text-gray-400">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          ) : (
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
        <input
          id="search-input"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors duration-200"
          placeholder={placeholder}
          aria-label="Search articles"
          aria-describedby={searchTerm ? "search-clear-button" : undefined}
          autoComplete="off"
          spellCheck="false"
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              id="search-clear-button"
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md p-1 transition-colors duration-200"
              aria-label={`Clear search term: ${searchTerm}`}
              title="Clear search (Esc)"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      {searchTerm && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isSearching ? 'Searching...' : `Search results for "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}
