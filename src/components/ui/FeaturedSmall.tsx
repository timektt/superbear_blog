'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FeaturedArticle } from '@/types/content';

interface FeaturedSmallProps {
  article: FeaturedArticle;
}

// Loading skeleton for small featured article
function FeaturedSmallSkeleton() {
  return (
    <div className="relative w-full aspect-video min-h-[180px] rounded-lg overflow-hidden bg-gray-200 animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-gray-300 rounded-full"></div>
            <div className="h-3 w-16 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-5 w-full bg-gray-300 rounded"></div>
            <div className="h-5 w-3/4 bg-gray-300 rounded"></div>
          </div>
          <div className="h-3 w-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedSmall({ article }: FeaturedSmallProps) {
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Simulate component loading
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <FeaturedSmallSkeleton />;
  }
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
      <article className="relative w-full aspect-video min-h-[180px] rounded-lg overflow-hidden bg-gray-900">
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

          {/* Title with proper line-clamp */}
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