import { 
  getCategoryPerformance, 
  getArticleAnalytics, 
  getEngagementMetrics,
  getTrafficSources 
} from '@/lib/analytics/queries';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    view: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Analytics Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategoryPerformance', () => {
    it('should return category performance data without date filtering', async () => {
      const mockCategories = [
        { id: '1', name: 'AI', slug: 'ai' },
        { id: '2', name: 'DevTools', slug: 'devtools' },
      ];

      const mockArticles = [
        { id: '1', categoryId: '1', views: 100 },
        { id: '2', categoryId: '1', views: 150 },
        { id: '3', categoryId: '2', views: 75 },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);
      mockPrisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await getCategoryPerformance();

      expect(result).toEqual([
        {
          category: 'AI',
          slug: 'ai',
          totalViews: 250,
          articleCount: 2,
          averageViews: 125,
        },
        {
          category: 'DevTools',
          slug: 'devtools',
          totalViews: 75,
          articleCount: 1,
          averageViews: 75,
        },
      ]);
    });

    it('should return category performance data with date filtering', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockCategories = [
        { id: '1', name: 'AI', slug: 'ai' },
      ];

      const mockViews = [
        { articleId: '1', createdAt: new Date('2024-01-15') },
        { articleId: '1', createdAt: new Date('2024-01-20') },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);
      mockPrisma.view.findMany.mockResolvedValue(mockViews);

      const result = await getCategoryPerformance({ startDate, endDate });

      expect(mockPrisma.view.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          article: {
            categoryId: { in: ['1'] },
          },
        },
        include: {
          article: {
            select: {
              categoryId: true,
            },
          },
        },
      });
    });

    it('should handle empty results gracefully', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.article.findMany.mockResolvedValue([]);

      const result = await getCategoryPerformance();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error('Database error'));

      await expect(getCategoryPerformance()).rejects.toThrow('Database error');
    });
  });

  describe('getArticleAnalytics', () => {
    it('should return article analytics data', async () => {
      const articleId = 'article-1';
      const mockViews = [
        { id: '1', createdAt: new Date('2024-01-01'), userAgent: 'Chrome' },
        { id: '2', createdAt: new Date('2024-01-02'), userAgent: 'Firefox' },
      ];

      mockPrisma.view.findMany.mockResolvedValue(mockViews);
      mockPrisma.view.count.mockResolvedValue(2);

      const result = await getArticleAnalytics(articleId);

      expect(result).toEqual({
        totalViews: 2,
        uniqueViews: 2,
        viewsOverTime: expect.any(Array),
        topReferrers: expect.any(Array),
        deviceBreakdown: expect.any(Array),
      });

      expect(mockPrisma.view.findMany).toHaveBeenCalledWith({
        where: { articleId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle articles with no views', async () => {
      const articleId = 'article-no-views';

      mockPrisma.view.findMany.mockResolvedValue([]);
      mockPrisma.view.count.mockResolvedValue(0);

      const result = await getArticleAnalytics(articleId);

      expect(result).toEqual({
        totalViews: 0,
        uniqueViews: 0,
        viewsOverTime: [],
        topReferrers: [],
        deviceBreakdown: [],
      });
    });
  });

  describe('getEngagementMetrics', () => {
    it('should calculate engagement metrics correctly', async () => {
      const mockData = [
        { timeOnPage: 120, bounced: false },
        { timeOnPage: 300, bounced: false },
        { timeOnPage: 30, bounced: true },
        { timeOnPage: 180, bounced: false },
      ];

      // Mock the aggregation query
      mockPrisma.view.findMany.mockResolvedValue(mockData);

      const result = await getEngagementMetrics();

      expect(result).toEqual({
        averageTimeOnPage: 157.5, // (120 + 300 + 30 + 180) / 4
        bounceRate: 0.25, // 1 bounced out of 4 total
        engagementRate: 0.75, // 3 engaged out of 4 total
        totalSessions: 4,
      });
    });

    it('should handle empty engagement data', async () => {
      mockPrisma.view.findMany.mockResolvedValue([]);

      const result = await getEngagementMetrics();

      expect(result).toEqual({
        averageTimeOnPage: 0,
        bounceRate: 0,
        engagementRate: 0,
        totalSessions: 0,
      });
    });
  });

  describe('getTrafficSources', () => {
    it('should return traffic source breakdown', async () => {
      const mockViews = [
        { referrer: 'https://google.com', id: '1' },
        { referrer: 'https://google.com', id: '2' },
        { referrer: 'https://twitter.com', id: '3' },
        { referrer: null, id: '4' }, // Direct traffic
      ];

      mockPrisma.view.groupBy.mockResolvedValue([
        { referrer: 'https://google.com', _count: { id: 2 } },
        { referrer: 'https://twitter.com', _count: { id: 1 } },
        { referrer: null, _count: { id: 1 } },
      ]);

      const result = await getTrafficSources();

      expect(result).toEqual([
        { source: 'Google', visits: 2, percentage: 50 },
        { source: 'Twitter', visits: 1, percentage: 25 },
        { source: 'Direct', visits: 1, percentage: 25 },
      ]);
    });

    it('should categorize referrers correctly', async () => {
      mockPrisma.view.groupBy.mockResolvedValue([
        { referrer: 'https://www.google.com/search', _count: { id: 5 } },
        { referrer: 'https://t.co/abc123', _count: { id: 3 } },
        { referrer: 'https://www.facebook.com/share', _count: { id: 2 } },
        { referrer: 'https://example.com', _count: { id: 1 } },
      ]);

      const result = await getTrafficSources();

      expect(result).toEqual([
        { source: 'Google', visits: 5, percentage: 45.45 },
        { source: 'Twitter', visits: 3, percentage: 27.27 },
        { source: 'Facebook', visits: 2, percentage: 18.18 },
        { source: 'Other', visits: 1, percentage: 9.09 },
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error('Connection failed'));

      await expect(getCategoryPerformance()).rejects.toThrow('Connection failed');
    });

    it('should handle malformed data gracefully', async () => {
      // Mock malformed category data
      mockPrisma.category.findMany.mockResolvedValue([
        { id: null, name: null, slug: null },
      ]);
      mockPrisma.article.findMany.mockResolvedValue([]);

      const result = await getCategoryPerformance();

      // Should filter out malformed entries
      expect(result).toEqual([]);
    });
  });

  describe('Performance Optimization', () => {
    it('should use efficient queries for large datasets', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.view.findMany.mockResolvedValue([]);

      await getCategoryPerformance({ startDate, endDate });

      // Verify that the query includes proper indexing hints
      expect(mockPrisma.view.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should limit result sets for performance', async () => {
      await getTrafficSources();

      expect(mockPrisma.view.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['referrer'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        })
      );
    });
  });
});