// @ts-nocheck
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Content recommendation engine

export interface RecommendationOptions {
  limit?: number;
  excludeArticleIds?: string[];
  includeCategories?: string[];
  excludeCategories?: string[];
  minScore?: number;
}

export interface RecommendationResult {
  articleId: string;
  title: string;
  slug: string;
  score: number;
  reason: string;
  category?: string;
  publishedAt: Date;
  viewCount?: number;
}

// Generate recommendations for an article
export async function generateRecommendations(
  sourceArticleId: string,
  options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
  try {
    const {
      limit = 5,
      excludeArticleIds = [],
      includeCategories = [],
      excludeCategories = [],
      minScore = 0.1,
    } = options;

    // Get source article details
    const sourceArticle = await prisma?.article.findUnique({
      where: { id: sourceArticleId },
      include: {
        category: true,
        tags: true,
        stats: true,
      },
    });

    if (!sourceArticle) {
      throw new Error('Source article not found');
    }

    // Generate different types of recommendations
    const [similarContent, sameCategory, sameAuthor, trending, popular] =
      await Promise.all([
        getSimilarContentRecommendations(sourceArticle, limit),
        getSameCategoryRecommendations(sourceArticle, limit),
        getSameAuthorRecommendations(sourceArticle, limit),
        getTrendingRecommendations(limit),
        getPopularRecommendations(limit),
      ]);

    // Combine and score recommendations
    const allRecommendations = [
      ...similarContent.map((r) => ({
        ...r,
        reason: 'Similar Content',
        baseScore: 0.9,
      })),
      ...sameCategory.map((r) => ({
        ...r,
        reason: 'Same Category',
        baseScore: 0.7,
      })),
      ...sameAuthor.map((r) => ({
        ...r,
        reason: 'Same Author',
        baseScore: 0.6,
      })),
      ...trending.map((r) => ({
        ...r,
        reason: 'Trending Now',
        baseScore: 0.8,
      })),
      ...popular.map((r) => ({ ...r, reason: 'Popular', baseScore: 0.5 })),
    ];

    // Remove duplicates and excluded articles
    const uniqueRecommendations = allRecommendations
      .filter(
        (rec, index, self) =>
          self.findIndex((r) => r.articleId === rec.articleId) === index
      )
      .filter(
        (rec) =>
          rec.articleId !== sourceArticleId &&
          !excludeArticleIds.includes(rec.articleId)
      );

    // Calculate final scores
    const scoredRecommendations = uniqueRecommendations.map((rec) => {
      let finalScore = rec.baseScore;

      // Boost score based on view count
      if (rec.viewCount && rec.viewCount > 100) {
        finalScore += Math.min(0.2, rec.viewCount / 10000);
      }

      // Boost recent articles
      const daysSincePublished =
        (Date.now() - rec.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublished < 7) {
        finalScore += 0.1;
      }

      // Apply category filters
      if (
        includeCategories.length > 0 &&
        !includeCategories.includes(rec.category || '')
      ) {
        finalScore *= 0.5;
      }
      if (
        excludeCategories.length > 0 &&
        excludeCategories.includes(rec.category || '')
      ) {
        finalScore *= 0.3;
      }

      return {
        ...rec,
        score: Math.round(finalScore * 100) / 100,
      };
    });

    // Filter by minimum score and sort
    const filteredRecommendations = scoredRecommendations
      .filter((rec) => rec.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Store recommendations for performance tracking
    await storeRecommendations(sourceArticleId, filteredRecommendations);

    return filteredRecommendations;
  } catch (error) {
    logger.error('Failed to generate recommendations', error as Error, {
      sourceArticleId,
    });
    return [];
  }
}

// Get similar content based on tags and category
async function getSimilarContentRecommendations(
  sourceArticle: any,
  limit: number
): Promise<Omit<RecommendationResult, 'score' | 'reason'>[]> {
  const tagIds = sourceArticle.tags.map((tag: any) => tag.id);

  if (tagIds.length === 0) {
    return [];
  }

  const similarArticles =
    (await prisma?.article.findMany({
      where: {
        id: { not: sourceArticle.id },
        status: 'PUBLISHED',
        tags: {
          some: {
            id: { in: tagIds },
          },
        },
      },
      include: {
        category: true,
        stats: true,
        tags: true,
      },
      take: limit * 2, // Get more to allow for filtering
    })) || [];

  return similarArticles.map((article) => ({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category.name,
    publishedAt: article.publishedAt || article.createdAt,
    viewCount: article.stats?.totalViews || 0,
  }));
}

// Get articles from the same category
async function getSameCategoryRecommendations(
  sourceArticle: any,
  limit: number
): Promise<Omit<RecommendationResult, 'score' | 'reason'>[]> {
  const sameCategory =
    (await prisma?.article.findMany({
      where: {
        id: { not: sourceArticle.id },
        status: 'PUBLISHED',
        categoryId: sourceArticle.categoryId,
      },
      include: {
        category: true,
        stats: true,
      },
      orderBy: {
        stats: {
          totalViews: 'desc',
        },
      },
      take: limit,
    })) || [];

  return sameCategory.map((article) => ({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category.name,
    publishedAt: article.publishedAt || article.createdAt,
    viewCount: article.stats?.totalViews || 0,
  }));
}

// Get articles from the same author
async function getSameAuthorRecommendations(
  sourceArticle: any,
  limit: number
): Promise<Omit<RecommendationResult, 'score' | 'reason'>[]> {
  const sameAuthor =
    (await prisma?.article.findMany({
      where: {
        id: { not: sourceArticle.id },
        status: 'PUBLISHED',
        authorId: sourceArticle.authorId,
      },
      include: {
        category: true,
        stats: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    })) || [];

  return sameAuthor.map((article) => ({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category.name,
    publishedAt: article.publishedAt || article.createdAt,
    viewCount: article.stats?.totalViews || 0,
  }));
}

// Get currently trending articles
async function getTrendingRecommendations(
  limit: number
): Promise<Omit<RecommendationResult, 'score' | 'reason'>[]> {
  const trending =
    (await prisma?.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        category: true,
        stats: true,
      },
      orderBy: {
        stats: {
          viewsThisWeek: 'desc',
        },
      },
      take: limit,
    })) || [];

  return trending.map((article) => ({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category.name,
    publishedAt: article.publishedAt || article.createdAt,
    viewCount: article.stats?.totalViews || 0,
  }));
}

// Get popular articles overall
async function getPopularRecommendations(
  limit: number
): Promise<Omit<RecommendationResult, 'score' | 'reason'>[]> {
  const popular =
    (await prisma?.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        stats: true,
      },
      orderBy: {
        stats: {
          totalViews: 'desc',
        },
      },
      take: limit,
    })) || [];

  return popular.map((article) => ({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category.name,
    publishedAt: article.publishedAt || article.createdAt,
    viewCount: article.stats?.totalViews || 0,
  }));
}

// Store recommendations for performance tracking
async function storeRecommendations(
  sourceArticleId: string,
  recommendations: RecommendationResult[]
): Promise<void> {
  try {
    // Delete existing recommendations
    await prisma?.contentRecommendation.deleteMany({
      where: { sourceArticleId },
    });

    // Create new recommendations
    const recommendationData = recommendations.map((rec) => ({
      sourceArticleId,
      targetArticleId: rec.articleId,
      score: rec.score,
      reason: rec.reason as any,
    }));

    await prisma?.contentRecommendation.createMany({
      data: recommendationData,
    });
  } catch (error) {
    logger.error('Failed to store recommendations', error as Error, {
      sourceArticleId,
    });
  }
}

// Track recommendation click
export async function trackRecommendationClick(
  sourceArticleId: string,
  targetArticleId: string
): Promise<void> {
  try {
    await prisma?.contentRecommendation.updateMany({
      where: {
        sourceArticleId,
        targetArticleId,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    // Update click rate
    const recommendation = await prisma?.contentRecommendation.findFirst({
      where: {
        sourceArticleId,
        targetArticleId,
      },
    });

    if (recommendation && recommendation.impressions > 0) {
      const clickRate = recommendation.clicks / recommendation.impressions;
      await prisma?.contentRecommendation.update({
        where: { id: recommendation.id },
        data: { clickRate },
      });
    }
  } catch (error) {
    logger.error('Failed to track recommendation click', error as Error, {
      sourceArticleId,
      targetArticleId,
    });
  }
}

// Track recommendation impression
export async function trackRecommendationImpression(
  sourceArticleId: string,
  targetArticleIds: string[]
): Promise<void> {
  try {
    await prisma?.contentRecommendation.updateMany({
      where: {
        sourceArticleId,
        targetArticleId: { in: targetArticleIds },
      },
      data: {
        impressions: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to track recommendation impressions', error as Error, {
      sourceArticleId,
      targetArticleIds,
    });
  }
}

// Get recommendation performance
export async function getRecommendationPerformance(
  sourceArticleId?: string
): Promise<
  Array<{
    sourceArticleId: string;
    targetArticleId: string;
    sourceTitle: string;
    targetTitle: string;
    impressions: number;
    clicks: number;
    clickRate: number;
    score: number;
  }>
> {
  try {
    const recommendations =
      (await prisma?.contentRecommendation.findMany({
        where: sourceArticleId ? { sourceArticleId } : {},
        include: {
          sourceArticle: {
            select: { title: true },
          },
          targetArticle: {
            select: { title: true },
          },
        },
        orderBy: {
          clickRate: 'desc',
        },
      })) || [];

    return recommendations.map((rec) => ({
      sourceArticleId: rec.sourceArticleId,
      targetArticleId: rec.targetArticleId,
      sourceTitle: rec.sourceArticle.title,
      targetTitle: rec.targetArticle.title,
      impressions: rec.impressions,
      clicks: rec.clicks,
      clickRate: rec.clickRate || 0,
      score: rec.score,
    }));
  } catch (error) {
    logger.error('Failed to get recommendation performance', error as Error);
    return [];
  }
}

// Batch update recommendations for all articles
export async function updateAllRecommendations(): Promise<{
  updated: number;
  errors: number;
}> {
  try {
    const articles =
      (await prisma?.article.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true },
      })) || [];

    let updated = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        await generateRecommendations(article.id);
        updated++;
      } catch (error) {
        errors++;
        logger.error(
          'Failed to update recommendations for article',
          error as Error,
          {
            articleId: article.id,
          }
        );
      }
    }

    logger.info('Batch recommendation update completed', { updated, errors });

    return { updated, errors };
  } catch (error) {
    logger.error('Failed to batch update recommendations', error as Error);
    return { updated: 0, errors: 1 };
  }
}
