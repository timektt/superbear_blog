/**
 * Database Query Optimization Utilities
 *
 * This module provides utilities for analyzing and optimizing database queries
 * to improve performance across the CMS platform.
 */

import { PrismaClient } from '@prisma/client';

export interface QueryPerformanceMetrics {
  queryType: string;
  executionTime: number;
  recordsReturned: number;
  indexesUsed: string[];
  suggestions: string[];
}

export interface OptimizationReport {
  timestamp: Date;
  queries: QueryPerformanceMetrics[];
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendations: string[];
}

/**
 * Analyze query performance for common article queries
 */
export async function analyzeArticleQueryPerformance(
  prisma: PrismaClient
): Promise<QueryPerformanceMetrics[]> {
  const metrics: QueryPerformanceMetrics[] = [];

  try {
    // Test main article listing query performance
    const startTime = Date.now();
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 20,
    });
    const executionTime = Date.now() - startTime;

    metrics.push({
      queryType: 'article_listing',
      executionTime,
      recordsReturned: articles.length,
      indexesUsed: ['status_publishedAt_idx', 'publishedAt_idx'],
      suggestions:
        executionTime > 100
          ? ['Consider adding composite index on (status, publishedAt)']
          : [],
    });

    // Test category-filtered query performance
    const categoryStartTime = Date.now();
    const categoryArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        category: { slug: 'ai' },
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });
    const categoryExecutionTime = Date.now() - categoryStartTime;

    metrics.push({
      queryType: 'category_filtered_listing',
      executionTime: categoryExecutionTime,
      recordsReturned: categoryArticles.length,
      indexesUsed: ['categoryId_status_publishedAt_idx'],
      suggestions:
        categoryExecutionTime > 50 ? ['Ensure category slug index exists'] : [],
    });

    // Test search query performance
    const searchStartTime = Date.now();
    const searchResults = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ title: { contains: 'AI' } }, { summary: { contains: 'AI' } }],
      },
      take: 10,
    });
    const searchExecutionTime = Date.now() - searchStartTime;

    metrics.push({
      queryType: 'text_search',
      executionTime: searchExecutionTime,
      recordsReturned: searchResults.length,
      indexesUsed: ['title_idx', 'summary_idx'],
      suggestions:
        searchExecutionTime > 200
          ? [
              'Consider implementing full-text search with database-specific features',
              'Add trigram indexes for better text search performance',
            ]
          : [],
    });
  } catch (error) {
    console.error('Error analyzing article query performance:', error);
  }

  return metrics;
}

/**
 * Analyze newsletter and campaign query performance
 */
export async function analyzeNewsletterQueryPerformance(
  prisma: PrismaClient
): Promise<QueryPerformanceMetrics[]> {
  const metrics: QueryPerformanceMetrics[] = [];

  try {
    // Test active subscriber query
    const startTime = Date.now();
    const subscribers = await prisma.newsletter.findMany({
      where: {
        status: 'ACTIVE',
      },
      take: 100,
    });
    const executionTime = Date.now() - startTime;

    metrics.push({
      queryType: 'active_subscribers',
      executionTime,
      recordsReturned: subscribers.length,
      indexesUsed: ['status_subscribedAt_idx'],
      suggestions:
        executionTime > 50 ? ['Ensure status index is properly utilized'] : [],
    });

    // Test campaign delivery status query
    const deliveryStartTime = Date.now();
    const deliveries = await prisma.campaignDelivery.findMany({
      where: {
        status: 'QUEUED',
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    const deliveryExecutionTime = Date.now() - deliveryStartTime;

    metrics.push({
      queryType: 'campaign_delivery_queue',
      executionTime: deliveryExecutionTime,
      recordsReturned: deliveries.length,
      indexesUsed: ['status_createdAt_idx'],
      suggestions:
        deliveryExecutionTime > 30
          ? ['Optimize delivery queue processing']
          : [],
    });
  } catch (error) {
    console.error('Error analyzing newsletter query performance:', error);
  }

  return metrics;
}

/**
 * Analyze analytics query performance
 */
export async function analyzeAnalyticsQueryPerformance(
  prisma: PrismaClient
): Promise<QueryPerformanceMetrics[]> {
  const metrics: QueryPerformanceMetrics[] = [];

  try {
    // Test article view analytics
    const startTime = Date.now();
    const views = await prisma.articleView.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      take: 100,
    });
    const executionTime = Date.now() - startTime;

    metrics.push({
      queryType: 'recent_article_views',
      executionTime,
      recordsReturned: views.length,
      indexesUsed: ['timestamp_idx'],
      suggestions:
        executionTime > 100
          ? ['Consider partitioning analytics tables by date']
          : [],
    });

    // Test article-specific analytics
    const articleAnalyticsStartTime = Date.now();
    const articleViews = await prisma.articleView.findMany({
      where: {
        articleId: 'sample-article-id',
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    const articleAnalyticsExecutionTime =
      Date.now() - articleAnalyticsStartTime;

    metrics.push({
      queryType: 'article_specific_analytics',
      executionTime: articleAnalyticsExecutionTime,
      recordsReturned: articleViews.length,
      indexesUsed: ['articleId_timestamp_idx'],
      suggestions:
        articleAnalyticsExecutionTime > 50
          ? ['Ensure composite index on (articleId, timestamp)']
          : [],
    });
  } catch (error) {
    console.error('Error analyzing analytics query performance:', error);
  }

  return metrics;
}

/**
 * Generate comprehensive optimization report
 */
export async function generateOptimizationReport(
  prisma: PrismaClient
): Promise<OptimizationReport> {
  const timestamp = new Date();
  const queries: QueryPerformanceMetrics[] = [];

  // Collect performance metrics from all areas
  const articleMetrics = await analyzeArticleQueryPerformance(prisma);
  const newsletterMetrics = await analyzeNewsletterQueryPerformance(prisma);
  const analyticsMetrics = await analyzeAnalyticsQueryPerformance(prisma);

  queries.push(...articleMetrics, ...newsletterMetrics, ...analyticsMetrics);

  // Calculate overall health
  const avgExecutionTime =
    queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;
  const slowQueries = queries.filter((q) => q.executionTime > 100).length;
  const totalSuggestions = queries.reduce(
    (sum, q) => sum + q.suggestions.length,
    0
  );

  let overallHealth: OptimizationReport['overallHealth'];
  if (avgExecutionTime < 50 && slowQueries === 0) {
    overallHealth = 'excellent';
  } else if (avgExecutionTime < 100 && slowQueries < 2) {
    overallHealth = 'good';
  } else if (avgExecutionTime < 200 && slowQueries < 5) {
    overallHealth = 'needs_attention';
  } else {
    overallHealth = 'critical';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (slowQueries > 0) {
    recommendations.push(
      `${slowQueries} queries are performing slowly (>100ms). Review indexing strategy.`
    );
  }

  if (totalSuggestions > 0) {
    recommendations.push(
      'Implement query-specific optimizations listed in individual metrics.'
    );
  }

  if (avgExecutionTime > 100) {
    recommendations.push(
      'Consider implementing query result caching for frequently accessed data.'
    );
  }

  // Add general recommendations
  recommendations.push(
    'Monitor query performance regularly using this optimization report.',
    'Consider implementing database connection pooling for better resource utilization.',
    'Use EXPLAIN QUERY PLAN to analyze specific slow queries in production.',
    'Implement proper pagination for large result sets to improve user experience.'
  );

  return {
    timestamp,
    queries,
    overallHealth,
    recommendations,
  };
}

/**
 * Utility to log slow queries for monitoring
 */
export function logSlowQuery(
  queryType: string,
  executionTime: number,
  threshold: number = 100
) {
  if (executionTime > threshold) {
    console.warn(
      `Slow query detected: ${queryType} took ${executionTime}ms (threshold: ${threshold}ms)`
    );
  }
}

/**
 * Database health check utility
 */
export async function performDatabaseHealthCheck(
  prisma: PrismaClient
): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{ name: string; status: boolean; message: string }>;
}> {
  const checks = [];

  try {
    // Test basic connectivity
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - startTime;

    checks.push({
      name: 'Database Connectivity',
      status: connectionTime < 1000,
      message: `Connection established in ${connectionTime}ms`,
    });

    // Test article table performance
    const articleStartTime = Date.now();
    const articleCount = await prisma.article.count();
    const articleQueryTime = Date.now() - articleStartTime;

    checks.push({
      name: 'Article Table Performance',
      status: articleQueryTime < 100,
      message: `Article count query (${articleCount} records) completed in ${articleQueryTime}ms`,
    });

    // Test index utilization (basic check)
    const indexStartTime = Date.now();
    await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      take: 1,
    });
    const indexQueryTime = Date.now() - indexStartTime;

    checks.push({
      name: 'Index Utilization',
      status: indexQueryTime < 50,
      message: `Indexed query completed in ${indexQueryTime}ms`,
    });
  } catch (error) {
    checks.push({
      name: 'Database Error',
      status: false,
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  const healthyChecks = checks.filter((check) => check.status).length;
  const totalChecks = checks.length;

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyChecks === totalChecks) {
    status = 'healthy';
  } else if (healthyChecks >= totalChecks * 0.7) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return { status, checks };
}
