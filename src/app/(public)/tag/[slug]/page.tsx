import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ListPageLayout from '@/components/sections/ListPageLayout';
import ListSkeleton from '@/components/ui/ListSkeleton';
import { getByTag, getMostPopular } from '@/lib/publicData';
import { createTagPageMetadata } from '@/lib/seo';

// Performance optimizations
export const revalidate = 60;
export const fetchCache = 'force-cache';

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tagName = slug.replace(/-/g, ' ');
  return createTagPageMetadata(tagName);
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const page = parseInt(searchParamsResolved.page || '1', 10);

  if (!slug) {
    notFound();
  }

  return (
    <Suspense fallback={<TagPageSkeleton />}>
      <TagPageContent slug={slug} page={page} />
    </Suspense>
  );
}

async function TagPageContent({ slug, page }: { slug: string; page: number }) {
  const [result, mostPopular] = await Promise.all([
    getByTag(slug, { page, pageSize: 12 }),
    getMostPopular(5),
  ]);

  const tagName = slug.replace(/-/g, ' ');

  return (
    <ListPageLayout
      title={`#${tagName}`}
      subtitle={`Articles tagged with ${tagName}`}
      result={result}
      mostPopular={mostPopular}
      basePath={`/tag/${slug}`}
    />
  );
}

function TagPageSkeleton() {
  return (
    <section className="bg-white dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <ListSkeleton />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
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