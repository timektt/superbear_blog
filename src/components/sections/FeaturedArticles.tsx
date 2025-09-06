import React from 'react';
import { FeaturedArticle } from '@/types/content';
import FeaturedLarge from '@/components/ui/FeaturedLarge';
import FeaturedSmall from '@/components/ui/FeaturedSmall';

interface FeaturedArticlesProps {
  articles: FeaturedArticle[];
}

export default function FeaturedArticles({ articles }: FeaturedArticlesProps) {
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
    <div className="w-full space-y-4">
      {/* Large Featured Article */}
      <div className="w-full">
        <FeaturedLarge article={displayLargeArticle} />
      </div>

      {/* Small Featured Articles */}
      {displaySmallArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displaySmallArticles.map((article) => (
            <FeaturedSmall key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}