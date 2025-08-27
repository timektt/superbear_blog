import { MetadataRoute } from 'next';
import { getSafePrismaClient } from '@/lib/db-safe/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const prisma = getSafePrismaClient();

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/podcasts`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/newsletter`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ];

  if (!prisma) {
    return staticPages;
  }

  try {
    const [articles, podcasts, newsletters] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 1000,
      }),
      prisma.podcastEpisode.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 1000,
      }),
      prisma.newsletterIssue.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 1000,
      }),
    ]);

    const articlePages = articles.map((article) => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const podcastPages = podcasts.map((podcast) => ({
      url: `${baseUrl}/podcasts/${podcast.slug}`,
      lastModified: podcast.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const newsletterPages = newsletters.map((newsletter) => ({
      url: `${baseUrl}/newsletter/${newsletter.slug}`,
      lastModified: newsletter.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [
      ...staticPages,
      ...articlePages,
      ...podcastPages,
      ...newsletterPages,
    ];
  } catch {
    return staticPages;
  }
}
