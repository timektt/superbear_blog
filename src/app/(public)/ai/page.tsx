import { Metadata } from 'next';
import { Suspense } from 'react';
import ListPageLayout from '@/components/sections/ListPageLayout';
import ListSkeleton from '@/components/ui/ListSkeleton';
import { getByCategory, getMostPopular } from '@/lib/publicData';
import { createListPageMetadata } from '@/lib/seo';

// Performance optimizations
export const revalidate = 60;
export const fetchCache = 'force-cache';

interface AIPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createListPageMetadata(
    'AI News',
    'Latest artificial intelligence news, machine learning updates, and AI research insights from SuperBear Blog.',
    '/ai'
  );
}

export default async function AIPage({ searchParams }: AIPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <AIPageContent page={page} />
    </Suspense>
  );
}

async function AIPageContent({ page }: { page: number }) {
  const [result, mostPopular] = await Promise.all([
    getByCategory('AI', { page, pageSize: 12 }),
    getMostPopular(5),
  ]);

  return (
    <ListPageLayout
      title="AI News"
      subtitle="Latest artificial intelligence developments and machine learning insights"
      result={result}
      mostPopular={mostPopular}
      basePath="/ai"
    />
  );
}

function CategoryPageSkeleton() {
  return (
    <section className="bg-background py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 bg-muted rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-5 bg-muted rounded w-80 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <ListSkeleton />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-full mb-1"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
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