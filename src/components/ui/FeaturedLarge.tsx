'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FeaturedArticle } from '@/types/content';

interface FeaturedLargeProps {
  article: FeaturedArticle;
}

// Loading skeleton for large featured article
function FeaturedLargeSkeleton() {
  return (
    <div className="relative w-full aspect-video min-h-[320px] md:min-h-[360px] rounded-lg overflow-hidden bg-gray-200 animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-16 bg-gray-300 rounded-full"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
            <div className="h-8 w-1/2 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-full bg-gray-300 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-300 rounded"></div>
          </div>
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedLarge({ article }: FeaturedLargeProps) {
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Simulate component loading
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <FeaturedLargeSkeleton />;
  }
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
      <article className="relative w-full aspect-video min-h-[320px] md:min-h-[360px] rounded-lg overflow-hidden bg-gray-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <Image
            src={imageUrl}
            alt={article.title}
            width={400}
            height={225}
            priority={article.featureRank < 3}
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover w-full h-full transition-all duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.svg';
              setImageLoaded(true);
            }}
          />
        </div>

        {/* 70% Black Gradient Overlay from Bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

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

          {/* Title with proper line-clamp */}
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3 line-clamp-2 group-hover:text-red-300 transition-colors">
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
                  priority={false}
                  sizes="24px"
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