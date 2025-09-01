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

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
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
    <section className="bg-white dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 animate-pulse"></div>
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
