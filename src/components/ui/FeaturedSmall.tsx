import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FeaturedArticle } from '@/types/content';

interface FeaturedSmallProps {
  article: FeaturedArticle;
}

export default function FeaturedSmall({ article }: FeaturedSmallProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const imageUrl = article.coverUrl || '/placeholder-image.svg';

  return (
    <Link 
      href={`/news/${article.slug}`}
      className="group block w-full"
      aria-label={`Read article: ${article.title}`}
    >
      <article className="relative w-full min-h-[180px] rounded-lg overflow-hidden bg-gray-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 30vw, 25vw"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {/* Category and Date */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
              {article.category.name}
            </span>
            <span className="text-xs text-gray-200">
              {formatDate(article.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-red-300 transition-colors mb-2">
            {article.title}
          </h4>

          {/* Author and Reading Time */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>By {article.author.name}</span>
            {article.readingTime && (
              <span>{article.readingTime} min</span>
            )}
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </article>
    </Link>
  );
}