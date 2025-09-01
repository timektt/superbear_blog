'use client';
import ArticleCard from '@/components/ui/ArticleCard';

interface LatestArticle {
  id?: string;
  title: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  slug?: string;
  snippet?: string;
  tags?: string[];
}

interface LatestListProps {
  articles: LatestArticle[];
  isLoading?: boolean;
  className?: string;
}

// Enhanced skeleton for list items
function LatestListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex gap-6 py-6 border-b border-border last:border-b-0 animate-pulse">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-20 bg-muted rounded-full" />
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LatestList({ articles, isLoading = false, className = '' }: LatestListProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <LatestListSkeleton />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={`text-center py-16 px-4 ${className}`}>
        <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-2xl flex items-center justify-center">
          <svg
            className="w-12 h-12 text-muted-foreground"
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
        <h3 className="text-xl font-bold text-foreground mb-4">
          No articles found
        </h3>
        <p className="text-muted-foreground max-w-lg mx-auto">
          There are no published articles available. Check back later for new content!
        </p>
      </div>
    );
  }

  // Display up to 10 articles for better performance
  const displayArticles = articles.slice(0, 10);

  return (
    <div className={`space-y-0 ${className}`}>
      {displayArticles.map((article, index) => (
        <ArticleCard
          key={article.id || index}
          title={article.title}
          category={article.category}
          author={article.author}
          date={article.date}
          imageUrl={article.imageUrl}
          slug={article.slug || `article-${index + 1}`}
          snippet={article.snippet}
          tags={article.tags}
          variant="list"
          showAuthor={true}
          showCategory={true}
          showReadingTime={true}
        />
      ))}
    </div>
  );
}
