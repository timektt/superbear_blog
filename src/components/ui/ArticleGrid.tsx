'use client';

import ArticleCard from './ArticleCard';
import { Skeleton } from './skeleton';

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

interface ArticleGridProps {
  articles: Article[];
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'list' | 'featured';
  columns?: 1 | 2 | 3 | 4;
  showAuthor?: boolean;
  showCategory?: boolean;
  showReadingTime?: boolean;
  className?: string;
}

// Enhanced skeleton component for article cards
function ArticleCardSkeleton({ variant = 'default' }: { variant?: string }) {
  if (variant === 'list') {
    return (
      <div className="flex gap-6 py-6 border-b border-border last:border-b-0 animate-pulse">
        <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex gap-4 animate-pulse">
        <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="p-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ArticleGrid({
  articles,
  isLoading = false,
  variant = 'default',
  columns = 3,
  showAuthor = true,
  showCategory = true,
  showReadingTime = true,
  className = '',
}: ArticleGridProps) {
  // Generate grid classes based on columns and variant
  const getGridClasses = () => {
    if (variant === 'list') {
      return 'space-y-0'; // List layout doesn't use grid
    }
    
    const baseClasses = 'grid gap-6 sm:gap-8';
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    };
    
    return `${baseClasses} ${columnClasses[columns]}`;
  };

  if (isLoading) {
    const skeletonCount = variant === 'list' ? 8 : columns * 2;
    
    return (
      <div
        className={`${variant === 'list' ? 'space-y-0' : getGridClasses()} ${className}`}
        aria-label="Loading articles"
        role="status"
      >
        <span className="sr-only">Loading articles...</span>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ArticleCardSkeleton key={index} variant={variant} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={`text-center py-16 px-4 ${className}`}>
        <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-muted rounded-2xl flex items-center justify-center">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 tracking-tight">
          No articles found
        </h3>
        <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
          There are no published articles matching your criteria. Try adjusting
          your search or filters, or check back later for new content!
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${getGridClasses()} ${className}`}
      role="list"
      aria-label={`${articles.length} article${articles.length === 1 ? '' : 's'} found`}
    >
      {articles.map((article) => (
        <div key={article.id} role="listitem">
          <ArticleCard 
            article={article} 
            variant={variant}
            showAuthor={showAuthor}
            showCategory={showCategory}
            showReadingTime={showReadingTime}
          />
        </div>
      ))}
    </div>
  );
}
