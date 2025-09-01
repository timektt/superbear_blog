import { Metadata } from 'next';
import { Suspense } from 'react';
import ListPageLayout from '@/components/sections/ListPageLayout';
import ListSkeleton from '@/components/ui/ListSkeleton';
import { getLatest, getMostPopular, getInBrief } from '@/lib/publicData';
import { createListPageMetadata } from '@/lib/seo';

// Performance optimizations
export const revalidate = 60;
export const fetchCache = 'force-cache';

interface NewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createListPageMetadata(
    'Latest News',
    'Stay updated with the latest technology news, AI developments, developer tools, and startup insights from SuperBear Blog.',
    '/news'
  );
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  return (
    <Suspense fallback={<NewsPageSkeleton />}>
      <NewsPageContent page={page} />
    </Suspense>
  );
}

async function NewsPageContent({ page }: { page: number }) {
  const [result, mostPopular, inBriefItems] = await Promise.all([
    getLatest({ page, pageSize: 12 }),
    getMostPopular(5),
    getInBrief(8),
  ]);

  return (
    <ListPageLayout
      title="Latest News"
      subtitle="Stay updated with the latest in tech, AI, and developer tools"
      inBriefItems={inBriefItems}
      result={result}
      mostPopular={mostPopular}
      basePath="/news"
      showInBrief={true}
    />
  );
}

function NewsPageSkeleton() {
  return (
    <section className="bg-white dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-96 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <ListSkeleton />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 mb-6 animate-pulse"></div>
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-4 animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
