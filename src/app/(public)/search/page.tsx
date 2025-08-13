import { Metadata } from 'next';
import { Suspense } from 'react';
import ListPageLayout from '@/components/sections/ListPageLayout';
import ListSkeleton from '@/components/ui/ListSkeleton';
import { searchArticles, getMostPopular } from '@/lib/publicData';
import { createSearchPageMetadata } from '@/lib/seo';

// Performance optimizations
export const revalidate = 60;
export const fetchCache = 'force-cache';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  return createSearchPageMetadata(params.q);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const page = parseInt(params.page || '1', 10);

  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent query={query} page={page} />
    </Suspense>
  );
}

async function SearchPageContent({ query, page }: { query: string; page: number }) {
  if (!query.trim()) {
    return <EmptySearchState />;
  }

  const [result, mostPopular] = await Promise.all([
    searchArticles(query, { page, pageSize: 12 }),
    getMostPopular(5),
  ]);

  return (
    <ListPageLayout
      title={`Search results for "${query}"`}
      subtitle={result.total > 0 ? undefined : 'No articles found matching your search'}
      result={result}
      mostPopular={mostPopular}
      basePath="/search"
    />
  );
}

function EmptySearchState() {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
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
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Search SuperBear Blog
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Find articles about AI, developer tools, startups, and more
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <SearchSuggestion href="/ai" label="AI News" />
          <SearchSuggestion href="/devtools" label="Developer Tools" />
          <SearchSuggestion href="/startups" label="Startup News" />
          <SearchSuggestion href="/open-source" label="Open Source" />
          <SearchSuggestion href="/search?q=machine+learning" label="Machine Learning" />
          <SearchSuggestion href="/search?q=javascript" label="JavaScript" />
        </div>
      </div>
    </section>
  );
}

function SearchSuggestion({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </span>
    </a>
  );
}

function SearchPageSkeleton() {
  return (
    <section className="bg-white dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <ListSkeleton />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}