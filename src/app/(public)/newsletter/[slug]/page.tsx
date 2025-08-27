import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NewsletterSubscription } from '@/components/newsletter/NewsletterSubscription';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date';
import { Calendar, User, ArrowLeft, Share2, Mail } from 'lucide-react';

interface NewsletterIssuePageProps {
  params: {
    slug: string;
  };
}

async function getNewsletterIssue(slug: string) {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/newsletter/issues/${slug}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getRecentIssues(currentId?: string) {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/newsletter/issues?limit=3`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.issues || []).filter((issue: any) => issue.id !== currentId);
}

export async function generateMetadata({
  params,
}: NewsletterIssuePageProps): Promise<Metadata> {
  const issue = await getNewsletterIssue(params.slug);

  if (!issue) {
    return {
      title: 'Newsletter Issue Not Found',
    };
  }

  return {
    title: `${issue.title} - Issue #${issue.issueNumber} | SuperBear Blog`,
    description:
      issue.summary ||
      `Read newsletter issue #${issue.issueNumber} from SuperBear Blog`,
    openGraph: {
      title: `${issue.title} - Issue #${issue.issueNumber}`,
      description: issue.summary,
      type: 'article',
      publishedTime: issue.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${issue.title} - Issue #${issue.issueNumber}`,
      description: issue.summary,
    },
  };
}

export async function generateStaticParams() {
  // In a real app, you'd fetch all published newsletter issue slugs
  return [];
}

function renderContent(content: any) {
  if (typeof content === 'string') {
    return (
      <div className="prose prose-gray max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  // Handle Tiptap JSON content
  if (content && typeof content === 'object') {
    // For now, render as plain text. In a full implementation,
    // you'd use a proper Tiptap renderer
    return (
      <div className="prose prose-gray max-w-none">
        <p className="text-muted-foreground">
          Newsletter content (rich text rendering would be implemented here)
        </p>
      </div>
    );
  }

  return null;
}

export default async function NewsletterIssuePage({
  params,
}: NewsletterIssuePageProps) {
  const [issue, recentIssues] = await Promise.all([
    getNewsletterIssue(params.slug),
    getNewsletterIssue(params.slug).then((i) =>
      i ? getRecentIssues(i.id) : []
    ),
  ]);

  if (!issue) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: issue.title,
    description: issue.summary,
    url: `${process.env.NEXTAUTH_URL}/newsletter/${issue.slug}`,
    datePublished: issue.publishedAt,
    author: {
      '@type': 'Person',
      name: issue.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SuperBear Blog',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/newsletter">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Newsletter
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">Issue #{issue.issueNumber}</Badge>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <time dateTime={issue.publishedAt}>
                    {formatDate(issue.publishedAt)}
                  </time>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  <span>By {issue.author.name}</span>
                </div>
              </div>

              <h1 className="text-3xl font-bold leading-tight">
                {issue.title}
              </h1>

              {issue.summary && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {issue.summary}
                </p>
              )}
            </header>

            <div className="flex items-center gap-4 py-4 border-y">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Issue
              </Button>
            </div>

            <div className="prose prose-gray max-w-none">
              {renderContent(issue.content)}
            </div>

            {/* Newsletter CTA */}
            <div className="bg-muted/50 rounded-lg p-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Enjoyed this issue?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Subscribe to get future issues delivered directly to your
                    inbox.
                  </p>
                  <div className="max-w-md">
                    <NewsletterSubscription
                      variant="inline"
                      showBenefits={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            {recentIssues.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Recent Issues</h3>
                <div className="space-y-4">
                  {recentIssues.slice(0, 3).map((recentIssue: any) => (
                    <div key={recentIssue.id} className="border rounded-lg p-4">
                      <Link
                        href={`/newsletter/${recentIssue.slug}`}
                        className="block hover:bg-muted/50 transition-colors -m-4 p-4 rounded-lg"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Issue #{recentIssue.issueNumber}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(recentIssue.publishedAt)}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2">
                            {recentIssue.title}
                          </h4>
                          {recentIssue.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {recentIssue.summary}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  asChild
                >
                  <Link href="/newsletter">View All Issues</Link>
                </Button>
              </div>
            )}

            {/* Subscription sidebar */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Subscribe to Newsletter</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get weekly tech insights delivered to your inbox.
              </p>
              <NewsletterSubscription variant="sidebar" showBenefits={false} />
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
