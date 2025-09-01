'use client';

import { useState, useEffect } from 'react';
import CategoryNavigation from '@/components/ui/CategoryNavigation';
import ArticleGrid from '@/components/ui/ArticleGrid';
import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';

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
  count?: number;
}

interface CategoryFilteredArticlesProps {
  articles: Article[];
  categories?: Category[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  showViewToggle?: boolean;
  defaultView?: 'grid' | 'list';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export default function CategoryFilteredArticles({
  articles,
  categories = [],
  isLoading = false,
  title = "Latest Articles",
  description = "Discover the latest tech news and insights",
  showViewToggle = true,
  defaultView = 'grid',
  columns = 3,
  className = '',
}: CategoryFilteredArticlesProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(articles);

  // Filter articles by category
  useEffect(() => {
    if (activeCategory) {
      setFilteredArticles(articles.filter(article => article.category.slug === activeCategory));
    } else {
      setFilteredArticles(articles);
    }
  }, [activeCategory, articles]);

  // Add article counts to categories
  const categoriesWithCounts = categories.map(category => ({
    ...category,
    count: articles.filter(article => article.category.slug === category.slug).length,
  }));

  return (
    <section className={`bg-background py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-4">
            {title}
          </h2>
          {description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {description}
            </p>
          )}
        </div>

        {/* Category Navigation */}
        {categoriesWithCounts.length > 0 && (
          <div className="mb-8">
            <CategoryNavigation
              categories={categoriesWithCounts}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              showCounts={true}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {!isLoading && (
              <>
                Showing {filteredArticles.length} of {articles.length} articles
                {activeCategory && (
                  <span>
                    {' '}in{' '}
                    <span className="font-medium text-foreground">
                      {categories.find(cat => cat.slug === activeCategory)?.name}
                    </span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Articles Grid/List */}
        <ArticleGrid
          articles={filteredArticles}
          isLoading={isLoading}
          variant={viewMode === 'list' ? 'list' : 'default'}
          columns={columns}
          showAuthor={true}
          showCategory={!activeCategory} // Hide category badges when filtering by category
          showReadingTime={true}
        />

        {/* Empty state */}
        {!isLoading && filteredArticles.length === 0 && activeCategory && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No articles found
              </h3>
              <p className="text-sm">
                No articles found in the{' '}
                <span className="font-medium">
                  {categories.find(cat => cat.slug === activeCategory)?.name}
                </span>{' '}
                category.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveCategory('')}
              className="mt-4"
            >
              View all articles
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}