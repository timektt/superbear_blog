import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { RichContentRenderer } from '@/components/ui/RichContentRenderer';
import OptimizedImage from '@/components/ui/OptimizedImage';
import ArticleCard from '@/components/ui/ArticleCard';
import SocialShareButtons from '@/components/ui/SocialShareButtons';
import StructuredData from '@/components/ui/StructuredData';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: {
      slug,
      status: Status.PUBLISHED,
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
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  // Fetch article with all related data
  const result = await prisma.article.findUnique({
    where: {
      slug,
      status: Status.PUBLISHED,
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
      status: Status.PUBLISHED,
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

  const article = result;
  const articleUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/news/${article.slug}`;

  return (
    <PublicLayout>
      <StructuredData article={article} url={articleUrl} />
      <article className="max-w-4xl mx-auto">
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
                  className="rounded-full"
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
          {article.image && (
            <div className="mb-8">
              <OptimizedImage
                src={article.image}
                alt={article.title}
                width={1200}
                height={600}
                className="rounded-lg shadow-lg w-full"
              />
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
                  className="rounded-full flex-shrink-0"
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
        <section className="max-w-7xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.id} article={relatedArticle} />
            ))}
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
