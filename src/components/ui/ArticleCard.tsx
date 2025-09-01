'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, Calendar } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  image?: string | null;
  imageUrl?: string;
  publishedAt?: Date | null;
  author: {
    id?: string;
    name: string;
    avatar?: string | null;
  };
  category: {
    id?: string;
    name: string;
    slug?: string;
  };
  tags?: Array<{
    id?: string;
    name: string;
    slug?: string;
  }>;
}

interface ArticleCardProps {
  // Support both individual props and article object
  article?: Article;
  title?: string;
  category?: string;
  author?: string;
  date?: string;
  imageUrl?: string;
  slug?: string;
  snippet?: string;
  tags?: string[];
  variant?: 'default' | 'compact' | 'list' | 'featured';
  className?: string;
  showAuthor?: boolean;
  showCategory?: boolean;
  showReadingTime?: boolean;
}

// Category color mapping for consistent color coding
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'AI': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Startups': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'DevTools': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Open Source': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'News': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Tech': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[category] || colors['Tech'];
};

// Estimate reading time based on content length
const estimateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

export default function ArticleCard({
  article,
  title: propTitle,
  category: propCategory,
  author: propAuthor,
  date: propDate,
  imageUrl: propImageUrl,
  slug: propSlug,
  snippet: propSnippet,
  tags: propTags,
  variant = 'default',
  className = '',
  showAuthor = true,
  showCategory = true,
  showReadingTime = true,
}: ArticleCardProps) {
  // Use article props if provided, otherwise use individual props
  const title = article?.title || propTitle || '';
  const category = article?.category?.name || propCategory || '';
  const author = article?.author?.name || propAuthor || '';
  const authorAvatar = article?.author?.avatar || null;
  const date = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : propDate || '';
  const imageUrl =
    article?.image || article?.imageUrl || propImageUrl || '/og-default.svg';
  const slug = article?.slug || propSlug || '';
  const snippet = article?.summary || propSnippet || '';
  const tags = article?.tags?.map((tag) => tag.name) || propTags || [];
  const href = `/news/${slug || 'article'}`;
  
  // Calculate reading time
  const readingTime = showReadingTime && snippet 
    ? estimateReadingTime(snippet) 
    : null;

  if (variant === 'compact') {
    return (
      <article className={`group ${className}`}>
        <Link href={href} className="block">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="relative w-20 h-20 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="80px"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {showCategory && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(category)}`}>
                  {category}
                </span>
              )}

              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-2 leading-snug">
                {title}
              </h4>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {showAuthor && author && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{author}</span>
                  </div>
                )}
                {date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{date}</span>
                  </div>
                )}
                {readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{readingTime} min read</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'list') {
    return (
      <article
        className={`group flex gap-6 py-6 border-b border-border last:border-b-0 hover:bg-muted/30 -mx-4 px-4 rounded-xl transition-all duration-300 ${className}`}
      >
        <Link
          href={href}
          className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        >
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 overflow-hidden rounded-xl bg-muted">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 96px, 128px"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          {showCategory && (
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                {category}
              </span>
            </div>
          )}

          <Link
            href={href}
            className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
          >
            <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-3 leading-tight">
              {title}
            </h3>
          </Link>

          {snippet && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {snippet}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {showAuthor && author && (
              <div className="flex items-center gap-2">
                {authorAvatar ? (
                  <div className="relative w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={authorAvatar}
                      alt={author}
                      fill
                      className="object-cover"
                      sizes="20px"
                    />
                  </div>
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="font-medium">{author}</span>
              </div>
            )}
            {date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{date}</span>
              </div>
            )}
            {readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Featured variant for hero sections
  if (variant === 'featured') {
    return (
      <article
        className={`group bg-card rounded-2xl shadow-lg border border-border overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-500 ${className}`}
      >
        <Link href={href} className="block">
          {/* Article Image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />

            {/* Category Badge */}
            {showCategory && (
              <div className="absolute top-6 left-6">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm ${getCategoryColor(category)}`}>
                  {category}
                </span>
              </div>
            )}
          </div>

          {/* Article Content */}
          <div className="p-8">
            {/* Title */}
            <h3 className="text-2xl font-bold text-card-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
              {title}
            </h3>

            {/* Snippet */}
            {snippet && (
              <p className="text-muted-foreground text-base mb-6 line-clamp-3 leading-relaxed">
                {snippet}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {showAuthor && author && (
                <div className="flex items-center gap-2">
                  {authorAvatar ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={authorAvatar}
                        alt={author}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </div>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="font-medium">{author}</span>
                </div>
              )}
              {date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{date}</span>
                </div>
              )}
              {readingTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{readingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Default card variant
  return (
    <article
      className={`group bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${className}`}
    >
      <Link href={href} className="block">
        {/* Article Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Category Badge */}
          {showCategory && (
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getCategoryColor(category)}`}>
                {category}
              </span>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-bold text-card-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
            {title}
          </h3>

          {/* Snippet */}
          {snippet && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
              {snippet}
            </p>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 2).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {showAuthor && author && (
              <div className="flex items-center gap-2">
                {authorAvatar ? (
                  <div className="relative w-5 h-5 rounded-full overflow-hidden">
                    <Image
                      src={authorAvatar}
                      alt={author}
                      fill
                      className="object-cover"
                      sizes="20px"
                    />
                  </div>
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="font-medium">{author}</span>
              </div>
            )}
            {date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{date}</span>
              </div>
            )}
            {readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
