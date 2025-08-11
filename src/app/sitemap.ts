import { MetadataRoute } from 'next';
import { getPrisma } from '@/lib/prisma';
import { IS_DB_CONFIGURED } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const prisma = getPrisma();

  // DB-Safe Mode: Return basic sitemap when database is not configured
  if (!IS_DB_CONFIGURED || !prisma) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/news`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/ai`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/devtools`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/open-source`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/startups`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ];
  }

  try {
    // Get all published articles
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Get all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
      },
    });

    const sitemap: MetadataRoute.Sitemap = [
      // Homepage
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      // News index
      {
        url: `${baseUrl}/news`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      // Individual articles
      ...articles.map((article) => ({
        url: `${baseUrl}/news/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      // Category pages
      ...categories.map((category) => ({
        url: `${baseUrl}/news?category=${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ];

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Fallback sitemap if database is unavailable
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/news`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];
  }
}
