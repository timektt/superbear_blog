import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

// Performance optimizations
export const revalidate = 60; // Cache article payload for 1 minute
export const fetchCache = 'force-cache'; // Force caching for better performance

// Lazy load non-critical components
const SocialShareButtons = dynamic(
  () => import('@/components/ui/SocialShareButtons'),
  {
    loading: () => (
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ),
  }
);
import { RichContentRenderer } from '@/components/ui/RichContentRenderer';
import OptimizedImage from '@/components/ui/OptimizedImage';
import ArticleCard from '@/components/ui/ArticleCard';
import StructuredData from '@/components/ui/StructuredData';
import { getPrisma } from '@/lib/prisma';
import { IS_DB_CONFIGURED } from '@/lib/env';
import { MOCK_ARTICLE } from '@/lib/mockData';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const prisma = getPrisma();

  // DB-Safe Mode: Use mock data for metadata
  if (!IS_DB_CONFIGURED || !prisma) {
    return {
      title: `${MOCK_ARTICLE.title} - SuperBear Blog`,
      description: MOCK_ARTICLE.summary,
    };
  }

  try {
    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!article) {
      return {
        title: 'Article Not Found - SuperBear Blog',
      };
    }

    const title = `${article.title}`;
    const description =
      article.summary || `Read ${article.title} by ${article.author.name}`;
    const publishedTime = article.publishedAt?.toISOString();
    const modifiedTime = article.updatedAt.toISOString();
    const imageUrl = article.image || '/og-default.svg';
    const articleUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/news/${slug}`;

    return {
      title,
      description,
      authors: [{ name: article.author.name }],
      category: article.category.name,
      keywords: [
        'tech news',
        article.category.name,
        article.author.name,
        ...(article.tags?.map((tag) => tag.name) || []),
      ],
      alternates: {
        canonical: articleUrl,
      },
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime,
        modifiedTime,
        authors: [article.author.name],
        section: article.category.name,
        tags: article.tags?.map((tag) => tag.name) || [],
        url: articleUrl,
        siteName: 'SuperBear Blog',
        locale: 'en_US',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: article.title,
            type: 'image/png',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [
          {
            url: imageUrl,
            alt: article.title,
          },
        ],
        creator: '@superbear_blog', // Update with actual Twitter handle
        site: '@superbear_blog', // Update with actual Twitter handle
      },
      robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: false,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    return {
      title: `${MOCK_ARTICLE.title} - SuperBear Blog`,
      description: MOCK_ARTICLE.summary,
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const prisma = getPrisma();

  // DB-Safe Mode: Use mock data when database is not configured
  if (!IS_DB_CONFIGURED || !prisma) {
    return <ArticleView article={MOCK_ARTICLE} relatedArticles={[]} />;
  }

  try {
    // Fetch article with all related data
    const result = await prisma.article.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!result) {
      notFound();
    }

    // Get related articles from the same category
    const relatedArticles = await prisma.article.findMany({
      where: {
        categoryId: result.categoryId,
        status: 'PUBLISHED',
        id: {
          not: result.id,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 3,
    });

    return <ArticleView article={result} relatedArticles={relatedArticles} />;
  } catch {
    console.warn('Database query failed, falling back to mock data');
    return <ArticleView article={MOCK_ARTICLE} relatedArticles={[]} />;
  }
}

// Article View Component
function ArticleView({
  article,
  relatedArticles,
}: {
  article: {
    id: string;
    title: string;
    summary: string;
    slug: string;
    content: unknown;
    imageUrl?: string;
    author: { name: string; avatar?: string; bio?: string };
    category: { name: string };
    tags: Array<{ id: string; name: string }>;
    publishedAt?: Date;
    updatedAt?: Date;
  };
  relatedArticles: Array<{
    id: string;
    title: string;
    slug: string;
    summary?: string;
    image?: string;
    publishedAt?: Date;
    author: { name: string; avatar?: string };
    category: { name: string };
    tags: Array<{ id: string; name: string }>;
  }>;
}) {
  const articleUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/news/${article.slug}`;

  return (
    <>
      <StructuredData article={article} url={articleUrl} />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <header className="mb-8">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {article.category.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">
              {article.summary}
            </p>
          )}

          {/* Article Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
            {/* Author Info */}
            <div className="flex items-center gap-3">
              {article.author.avatar && (
                <OptimizedImage
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={48}
                  height={48}
                  className="rounded-full w-12 h-12 object-cover"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {article.author.name}
                </p>
                <p className="text-sm text-gray-500">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )
                    : 'Draft'}
                </p>
              </div>
            </div>

            {/* Social Share */}
            <SocialShareButtons
              url={articleUrl}
              title={article.title}
              description={article.summary || ''}
            />
          </div>

          {/* Cover Image */}
          {article.imageUrl && (
            <div className="mb-8">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                <OptimizedImage
                  src={article.imageUrl}
                  alt={article.title}
                  width={1024}
                  height={576}
                  priority
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="mb-12">
          <RichContentRenderer content={article.content as string} />
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        {article.author.bio && (
          <div className="mb-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              About the Author
            </h3>
            <div className="flex gap-4">
              {article.author.avatar && (
                <OptimizedImage
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={64}
                  height={64}
                  className="rounded-full flex-shrink-0 w-16 h-16 object-cover"
                />
              )}
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  {article.author.name}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {article.author.bio}
                </p>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.id} article={relatedArticle} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
