import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Get all published articles
  const articles = await prisma.article.findMany({
    where: {
      status: Status.PUBLISHED,
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

  // Static pages
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
      priority: 0.9,
    },
  ];

  // Article pages
  const articlePages = articles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category pages (if you have category-specific pages)
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/news?category=${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages, ...categoryPages];
}
