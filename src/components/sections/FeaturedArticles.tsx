'use client';

import React, { useState, useEffect } from 'react';
import { FeaturedArticle } from '@/types/content';
import FeaturedLarge from '@/components/ui/FeaturedLarge';
import FeaturedSmall from '@/components/ui/FeaturedSmall';

interface FeaturedArticlesProps {
  articles: FeaturedArticle[];
}

// Loading skeleton for featured articles
function FeaturedArticlesSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Large Featured Article Skeleton */}
      <div className="w-full aspect-video min-h-[320px] md:min-h-[360px] rounded-lg bg-gray-200 animate-pulse">
        <div className="h-full flex flex-col justify-end p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-16 bg-gray-300 rounded-full"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
              <div className="h-8 w-1/2 bg-gray-300 rounded"></div>
            </div>
            <div className="h-4 w-full bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>

      {/* Small Featured Articles Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="w-full aspect-video min-h-[180px] rounded-lg bg-gray-200 animate-pulse">
            <div className="h-full flex flex-col justify-end p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-12 bg-gray-300 rounded-full"></div>
                  <div className="h-3 w-16 bg-gray-300 rounded"></div>
                </div>
                <div className="h-5 w-full bg-gray-300 rounded"></div>
                <div className="h-5 w-3/4 bg-gray-300 rounded"></div>
                <div className="h-3 w-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for featured articles
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <FeaturedArticlesSkeleton />;
  }
  // Sort articles by feature rank and separate large from small
  const sortedArticles = articles.sort((a, b) => a.featureRank - b.featureRank);
  const largeArticle = sortedArticles.find(a => a.featureRank === 1);
  const smallArticles = sortedArticles.filter(a => a.featureRank > 1).slice(0, 2);

  // If no articles or no rank 1 article, use first article as large
  const displayLargeArticle = largeArticle || sortedArticles[0];
  const displaySmallArticles = largeArticle 
    ? smallArticles 
    : sortedArticles.slice(1, 3);

  if (!displayLargeArticle) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No featured articles available</p>
      </div>
    );
  }

  return (
    <section aria-label="Featured articles" role="region">
      <h2 id="featured-articles-heading" className="sr-only">Featured Articles</h2>
      <div 
        className="w-full space-y-4"
        role="group"
        aria-labelledby="featured-articles-heading"
      >
        {/* Large Featured Article */}
        <div className="w-full">
          <article aria-label={`Featured: ${displayLargeArticle.title}`}>
            <FeaturedLarge article={displayLargeArticle} />
          </article>
        </div>

        {/* Small Featured Articles */}
        {displaySmallArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displaySmallArticles.map((article) => (
              <article key={article.id} aria-label={`Featured: ${article.title}`}>
                <FeaturedSmall article={article} />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}