'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  title: string;
  category: string;
  author?: string;
  date?: string;
  imageUrl: string;
  slug?: string;
  snippet?: string;
  tags?: string[];
  variant?: 'default' | 'compact' | 'list';
  className?: string;
}

export default function ArticleCard({
  title,
  category,
  author,
  date,
  imageUrl,
  slug,
  snippet,
  tags,
  variant = 'default',
  className = '',
}: ArticleCardProps) {
  const href = `/news/${slug || 'article'}`;

  if (variant === 'compact') {
    return (
      <article className={`group ${className}`}>
        <Link href={href} className="block">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
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
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mb-1">
                {category}
              </span>

              <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-3 mb-1">
                {title}
              </h4>

              {date && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
      <article className={`group flex gap-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 rounded-lg transition-all duration-200 ${className}`}>
        <Link
          href={href}
          className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-lg"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
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
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {category}
            </span>
          </div>

          <Link 
            href={href}
            className="focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-md"
          >
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 mb-2 leading-tight">
              {title}
            </h3>
          </Link>

          {snippet && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 leading-relaxed">
              {snippet}
            </p>
          )}

          {(author || date) && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
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
    <article className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${className}`}>
      <Link href={href} className="block">
        {/* Article Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-sm">
              {category}
            </span>
          </div>
        </div>

        {/* Article Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 leading-tight">
            {title}
          </h3>

          {/* Snippet */}
          {snippet && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
              {snippet}
            </p>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 2).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Meta Info */}
          {(author || date) && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              {author && <span className="font-medium">{author}</span>}
              {date && <span>{date}</span>}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}