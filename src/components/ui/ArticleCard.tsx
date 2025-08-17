'use client';

import Link from 'next/link';
import Image from 'next/image';

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
  variant?: 'default' | 'compact' | 'list';
  className?: string;
}

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
}: ArticleCardProps) {
  // Use article props if provided, otherwise use individual props
  const title = article?.title || propTitle || '';
  const category = article?.category?.name || propCategory || '';
  const author = article?.author?.name || propAuthor || '';
  const date = article?.publishedAt 
    ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : propDate || '';
  const imageUrl = article?.image || article?.imageUrl || propImageUrl || '/og-default.svg';
  const slug = article?.slug || propSlug || '';
  const snippet = article?.summary || propSnippet || '';
  const tags = article?.tags?.map(tag => tag.name) || propTags || [];
  const href = `/news/${slug || 'article'}`;

  if (variant === 'compact') {
    return (
      <article className={`group ${className}`}>
        <Link href={href} className="block">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="64px"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground mb-1">
                {category}
              </span>

              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-3 mb-1">
                {title}
              </h4>

              {date && (
                <p className="text-xs text-muted-foreground">
                  {date}
                </p>
              )}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'list') {
    return (
      <article className={`group flex gap-4 py-4 border-b border-border last:border-b-0 hover:bg-muted/50 -mx-4 px-4 rounded-lg transition-all duration-200 ${className}`}>
        <Link
          href={href}
          className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-lg bg-muted">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 64px, 80px"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground uppercase tracking-wide">
              {category}
            </span>
          </div>

          <Link 
            href={href}
            className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
          >
            <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-2 leading-tight">
              {title}
            </h3>
          </Link>

          {snippet && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {snippet}
            </p>
          )}

          {(author || date) && (
            <div className="flex items-center text-xs text-muted-foreground">
              {author && <span className="font-medium">{author}</span>}
              {author && date && <span className="mx-2">•</span>}
              {date && <span>{date}</span>}
            </div>
          )}
        </div>
      </article>
    );
  }

  // Default card variant
  return (
    <article className={`group bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${className}`}>
      <Link href={href} className="block">
        {/* Article Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-background/90 text-foreground backdrop-blur-sm">
              {category}
            </span>
          </div>
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
                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Meta Info */}
          {(author || date) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {author && <span className="font-medium">{author}</span>}
              {date && <span>{date}</span>}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}