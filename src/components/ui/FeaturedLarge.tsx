import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FeaturedArticle } from '@/types/content';

interface FeaturedLargeProps {
  article: FeaturedArticle;
}

export default function FeaturedLarge({ article }: FeaturedLargeProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const imageUrl = article.coverUrl || '/placeholder-image.svg';

  return (
    <Link 
      href={`/news/${article.slug}`}
      className="group block w-full"
      aria-label={`Read article: ${article.title}`}
    >
      <article className="relative w-full min-h-[320px] md:min-h-[360px] rounded-lg overflow-hidden bg-gray-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.svg';
            }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          {/* Category and Date */}
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
              {article.category.name}
            </span>
            <span className="text-sm text-gray-200">
              {formatDate(article.publishedAt)}
            </span>
            {article.readingTime && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-200">
                  {article.readingTime} min read
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3 line-clamp-3 group-hover:text-red-300 transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-gray-200 text-base leading-relaxed line-clamp-2 mb-4">
              {article.excerpt}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-2">
            {article.author.avatar && (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-sm text-gray-300">
              By {article.author.name}
            </span>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </article>
    </Link>
  );
}