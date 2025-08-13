import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { AdminRole } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

export async function GET(request: NextRequest) {
  try {
    // Check authentication and role (EDITOR can view stats)
    const roleError = await requireRole(AdminRole.EDITOR);
    if (roleError) return roleError;

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get article counts by status
    const articleStats = await prisma.article.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Get total article count
    const totalArticles = await prisma.article.count();

    // Get recent activity (articles created in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentArticles = await prisma.article.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get recently published articles (published in the last 7 days)
    const recentlyPublished = await prisma.article.count({
      where: {
        publishedAt: {
          gte: sevenDaysAgo,
        },
        status: 'PUBLISHED',
      },
    });

    // Transform article stats into a more usable format
    const statusCounts = {
      DRAFT: 0,
      PUBLISHED: 0,
      ARCHIVED: 0,
    };

    articleStats.forEach((stat) => {
      statusCounts[stat.status as keyof typeof statusCounts] = stat._count.id;
    });

    // Get category distribution
    const categoryStats = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            articles: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: 5, // Top 5 categories
    });

    // Get author statistics
    const authorStats = await prisma.author.findMany({
      include: {
        _count: {
          select: {
            articles: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: 5, // Top 5 authors
    });

    const stats = {
      articles: {
        total: totalArticles,
        byStatus: statusCounts,
        recentlyCreated: recentArticles,
        recentlyPublished: recentlyPublished,
      },
      categories: categoryStats.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        articleCount: category._count.articles,
      })),
      authors: authorStats.map((author) => ({
        id: author.id,
        name: author.name,
        articleCount: author._count.articles,
      })),
      activity: {
        articlesCreatedLast7Days: recentArticles,
        articlesPublishedLast7Days: recentlyPublished,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
