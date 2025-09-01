'use client';

import { useState } from 'react';
import ArticleGrid from '@/components/ui/ArticleGrid';
import CategoryNavigation from '@/components/ui/CategoryNavigation';
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

interface EnhancedArticleGridProps {
  articles: Article[];
  categories?: Category[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  showCategoryFilter?: boolean;
  showViewToggle?: boolean;
  defaultView?: 'grid' | 'list';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export default function EnhancedArticleGrid({
  articles,
  categories = [],
  isLoading = false,
  title,
  description,
  showCategoryFilter = true,
  showViewToggle = true,
  defaultView = 'grid',
  columns = 3,
  className = '',
}: EnhancedArticleGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);

  // Filter articles by category
  const filteredArticles = activeCategory
    ? articles.filter(article => article.category.slug === activeCategory)
    : articles;

  // Add article counts to categories
  const categoriesWithCounts = categories.map(category => ({
    ...category,
    count: articles.filter(article => article.category.slug === category.slug).length,
  }));

  return (
    <section className={`space-y-8 ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="text-center space-y-4">
          {title && (
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      {(showCategoryFilter || showViewToggle) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Category Filter */}
          {showCategoryFilter && categoriesWithCounts.length > 0 && (
            <div className="flex-1 min-w-0">
              <CategoryNavigation
                categories={categoriesWithCounts}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                showCounts={true}
              />
            </div>
          )}

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
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
      )}

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

      {/* Results count */}
      {!isLoading && filteredArticles.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredArticles.length} of {articles.length} articles
          {activeCategory && (
            <span>
              {' '}in{' '}
              <span className="font-medium">
                {categories.find(cat => cat.slug === activeCategory)?.name}
              </span>
            </span>
          )}
        </div>
      )}
    </section>
  );
}