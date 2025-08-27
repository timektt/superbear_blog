import { Suspense } from 'react';
import { Metadata } from 'next';
import { NewsletterIssueCard } from '@/components/newsletter/NewsletterIssueCard';
import { NewsletterSubscription } from '@/components/newsletter/NewsletterSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Mail, Archive } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Newsletter | SuperBear Blog',
  description:
    'Subscribe to our weekly tech newsletter for curated insights on AI, development, startups, and more.',
  openGraph: {
    title: 'Newsletter | SuperBear Blog',
    description:
      'Subscribe to our weekly tech newsletter for curated insights on AI, development, startups, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Newsletter | SuperBear Blog',
    description:
      'Subscribe to our weekly tech newsletter for curated insights on AI, development, startups, and more.',
  },
};

interface SearchParams {
  page?: string;
}

interface NewsletterPageProps {
  searchParams: SearchParams;
}

async function getNewsletterIssues(params: SearchParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page);
  searchParams.set('limit', '12');

  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/newsletter/issues?${searchParams}`,
    {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    }
  );

  if (!response.ok) {
    return { issues: [], pagination: { page: 1, totalPages: 1, total: 0 } };
  }

  return response.json();
}

function NewsletterLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="border rounded-lg p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsletterGrid({ issues }: { issues: any[] }) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Archive className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No newsletter issues yet</h3>
        <p className="text-muted-foreground">
          Subscribe to be notified when we publish our first issue!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {issues.map((issue) => (
        <NewsletterIssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
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
          <a href={`/newsletter?page=${currentPage - 1}`}>Previous</a>
        </Button>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <a href={`/newsletter?page=${page}`}>{page}</a>
        </Button>
      ))}

      {currentPage < totalPages && (
        <Button variant="outline" size="sm" asChild>
          <a href={`/newsletter?page=${currentPage + 1}`}>Next</a>
        </Button>
      )}
    </div>
  );
}

export default async function NewsletterPage({
  searchParams,
}: NewsletterPageProps) {
  const newsletterData = await getNewsletterIssues(searchParams);
  const currentPage = parseInt(searchParams.page || '1');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">SuperBear Newsletter</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Get weekly curated tech insights, AI updates, development trends, and
          startup news delivered straight to your inbox.
        </p>
      </div>

      {/* Subscription Section */}
      <div className="max-w-2xl mx-auto mb-16">
        <NewsletterSubscription variant="inline" showBenefits={true} />
      </div>

      {/* Archive Section */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <Archive className="w-6 h-6 mr-3 text-primary" />
          <h2 className="text-2xl font-bold">Newsletter Archive</h2>
        </div>
        <p className="text-muted-foreground">
          Browse our previous newsletter issues to catch up on the latest tech
          insights.
        </p>
      </div>

      <Suspense fallback={<NewsletterLoading />}>
        <NewsletterGrid issues={newsletterData.issues || []} />
      </Suspense>

      <Pagination
        currentPage={currentPage}
        totalPages={newsletterData.pagination?.totalPages || 1}
      />

      {/* Bottom CTA */}
      {newsletterData.issues && newsletterData.issues.length > 0 && (
        <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            Don't miss out on future issues
          </h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of developers and tech enthusiasts who get our weekly
            insights.
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterSubscription variant="inline" showBenefits={false} />
          </div>
        </div>
      )}
    </div>
  );
}
