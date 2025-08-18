'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SearchResult {
  articles: any[];
  total: number;
  query: {
    q: string;
    tag: string;
    category: string;
  };
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState('');
  
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = searchParams.get('tag') || '';
    const c = searchParams.get('category') || '';
    
    setQuery(q);
    setTag(t);
    setCategory(c);
    
    if (q || t || c) {
      performSearch(q, t, c);
    }
  }, [searchParams]);
  
  const performSearch = async (q: string, tag: string, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tag) params.set('tag', tag);
      if (category) params.set('category', category);
      
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults({ articles: [], total: 0, query: { q, tag, category } });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tag) params.set('tag', tag);
    if (category) params.set('category', category);
    
    window.history.pushState({}, '', `/search?${params}`);
    performSearch(query, tag, category);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Articles</h1>
      
      <form onSubmit={handleSearch} className="mb-8 space-y-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 border rounded"
          />
          <input
            type="text"
            placeholder="Tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-32 p-3 border rounded"
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-32 p-3 border rounded"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>
      
      {loading && <SearchSkeleton />}
      
      {results && !loading && (
        <div>
          <p className="text-gray-600 mb-4">
            Found {results.total} result{results.total !== 1 ? 's' : ''}
            {results.query.q && ` for "${results.query.q}"`}
          </p>
          
          {results.articles.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.articles.map((article) => (
                <article key={article.id} className="border-b pb-6">
                  <h2 className="text-xl font-semibold mb-2">
                    <Link href={`/news/${article.slug}`} className="text-blue-600 hover:underline">
                      {article.title}
                    </Link>
                  </h2>
                  {article.summary && (
                    <p className="text-gray-600 mb-2">{article.summary}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    {article.author?.name && `By ${article.author.name} • `}
                    {new Date(article.publishedAt).toLocaleDateString()}
                    {article.category && ` • ${article.category.name}`}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
      
      {!results && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-500">Enter keywords, tags, or categories to find articles</p>
        </div>
      )}
    </main>
  );
}