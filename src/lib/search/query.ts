/**
 * Search query utilities
 */

import { PrismaClient } from '@prisma/client';

export interface SearchParams {
  query: string;
  tag?: string;
  category?: string;
  limit?: number;
}

export interface SearchResult {
  articles: any[];
  total: number;
}

export async function searchArticles(
  prisma: PrismaClient,
  params: SearchParams
): Promise<SearchResult> {
  const { query, tag, category, limit = 20 } = params;
  
  const where: any = {
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() },
  };
  
  // Text search on title and summary
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { summary: { contains: query, mode: 'insensitive' } },
    ];
  }
  
  // Tag filter
  if (tag) {
    where.tags = {
      some: { slug: tag },
    };
  }
  
  // Category filter
  if (category) {
    where.category = { slug: category };
  }
  
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { 
        author: { select: { name: true } }, 
        category: { select: { name: true } }, 
        tags: { select: { name: true, slug: true } }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);
  
  return { articles, total };
}