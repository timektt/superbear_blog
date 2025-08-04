import { Suspense } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import NewsContent from './NewsContent';

export const metadata = {
  title: 'Tech News - SuperBear Blog',
  description:
    'Latest tech news, AI developments, and developer insights for builders and entrepreneurs.',
};

export default function NewsPage() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tech News</h1>
          <p className="text-lg text-gray-600">
            Stay updated with the latest in AI, developer tools, and startup
            ecosystem
          </p>
        </div>

        {/* Content */}
        <Suspense fallback={<NewsContentSkeleton />}>
          <NewsContent />
        </Suspense>
      </div>
    </PublicLayout>
  );
}

function NewsContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Category Filter Skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-10 bg-gray-200 rounded-full animate-pulse"
            style={{ width: `${80 + Math.random() * 40}px` }}
          ></div>
        ))}
      </div>

      {/* Articles Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border animate-pulse"
          >
            <div className="aspect-video w-full bg-gray-200 rounded-t-lg"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
