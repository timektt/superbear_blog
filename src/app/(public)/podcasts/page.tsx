import { Suspense } from 'react';
import { Metadata } from 'next';
import { PodcastCard } from '@/components/podcast/PodcastCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import PageShell from '@/components/layout/PageShell';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Podcasts | SuperBear Blog',
  description:
    'Listen to our latest tech podcasts covering AI, development, startups, and more.',
  openGraph: {
    title: 'Podcasts | SuperBear Blog',
    description:
      'Listen to our latest tech podcasts covering AI, development, startups, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podcasts | SuperBear Blog',
    description:
      'Listen to our latest tech podcasts covering AI, development, startups, and more.',
  },
};

interface SearchParams {
  page?: string;
  category?: string;
  search?: string;
}

interface PodcastsPageProps {
  searchParams: Promise<SearchParams>;
}

async function getPodcasts(params: SearchParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page);
  if (params.category) searchParams.set('category', params.category);
  if (params.search) searchParams.set('search', params.search);

  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/podcasts?${searchParams}`,
    {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch podcasts');
  }

  return response.json();
}

async function getCategories() {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/categories`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.categories || [];
}

function PodcastsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PodcastFilters({
  categories,
  currentCategory,
  currentSearch,
}: {
  categories: any[];
  currentCategory?: string;
  currentSearch?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search podcasts..."
          defaultValue={currentSearch}
          className="pl-10"
          name="search"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={!currentCategory ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <a href="/podcasts">All</a>
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={currentCategory === category.slug ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <a href={`/podcasts?category=${category.slug}`}>{category.name}</a>
          </Button>
        ))}
      </div>
    </div>
  );
}

function PodcastGrid({ podcasts }: { podcasts: any[] }) {
  if (podcasts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No podcasts found
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {podcasts.map((podcast) => (
        <PodcastCard key={podcast.id} podcast={podcast} />
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showPages = 5;
  const startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  const endPage = Math.min(totalPages, startPage + showPages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      {currentPage > 1 && (
        <Button variant="outline" size="sm" asChild>
          <a href={`${baseUrl}&page=${currentPage - 1}`}>Previous</a>
        </Button>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <a href={`${baseUrl}&page=${page}`}>{page}</a>
        </Button>
      ))}

      {currentPage < totalPages && (
        <Button variant="outline" size="sm" asChild>
          <a href={`${baseUrl}&page=${currentPage + 1}`}>Next</a>
        </Button>
      )}
    </div>
  );
}

export default async function PodcastsPage({
  searchParams,
}: PodcastsPageProps) {
  const resolvedSearchParams = await searchParams;
  const [podcastsData, categories] = await Promise.all([
    getPodcasts(resolvedSearchParams),
    getCategories(),
  ]);

  const currentPage = parseInt(resolvedSearchParams.page || '1');
  const baseUrl = `/podcasts?${new URLSearchParams(
    Object.entries(resolvedSearchParams).filter(([key]) => key !== 'page')
  )}`;

  return (
    <PageShell
      title="Podcasts"
      subtitle="Listen to our latest tech podcasts covering AI, development, startups, and more."
    >
      <Suspense fallback={<div>Loading filters...</div>}>
        <PodcastFilters
          categories={categories}
          currentCategory={(await searchParams).category}
          currentSearch={(await searchParams).search}
        />
      </Suspense>

      <div className="bg-card rounded-xl p-6 border border-border mt-6">
        <Suspense fallback={<PodcastsLoading />}>
          <PodcastGrid podcasts={podcastsData.podcasts || []} />
        </Suspense>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={podcastsData.pagination?.totalPages || 1}
        baseUrl={baseUrl}
      />
    </PageShell>
  );
}
