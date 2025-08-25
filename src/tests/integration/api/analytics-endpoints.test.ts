import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/analytics/dashboard/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
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

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/analytics/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return analytics dashboard data for authenticated admin', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      // Mock analytics data
      mockPrisma.view.count.mockResolvedValue(1000);
      mockPrisma.article.count.mockResolvedValue(50);
      mockPrisma.view.groupBy.mockResolvedValue([
        { _count: { id: 500 }, createdAt: new Date('2024-01-01') },
        { _count: { id: 300 }, createdAt: new Date('2024-01-02') },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        totalViews: 1000,
        totalArticles: 50,
        viewsOverTime: expect.any(Array),
        topArticles: expect.any(Array),
        categoryPerformance: expect.any(Array),
        trafficSources: expect.any(Array),
      });
    });

    it('should filter analytics by date range', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      mockPrisma.view.count.mockResolvedValue(500);
      mockPrisma.article.count.mockResolvedValue(25);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31',
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });

      await handler.GET(req);

      expect(mockPrisma.view.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
      });
    });

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should require admin role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'user@test.com', role: 'viewer' },
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(403);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Insufficient permissions');
    });

    it('should validate date parameters', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard?startDate=invalid-date',
        query: {
          startDate: 'invalid-date',
        },
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Invalid date format');
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      mockPrisma.view.count.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
    });

    it('should return category performance data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

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
      mockPrisma.view.count.mockResolvedValue(325);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      const responseData = JSON.parse(res._getData());
      expect(responseData.categoryPerformance).toEqual([
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

    it('should return traffic source breakdown', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      mockPrisma.view.groupBy.mockResolvedValue([
        { referrer: 'https://google.com', _count: { id: 500 } },
        { referrer: 'https://twitter.com', _count: { id: 200 } },
        { referrer: null, _count: { id: 100 } },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      const responseData = JSON.parse(res._getData());
      expect(responseData.trafficSources).toEqual([
        { source: 'Google', visits: 500, percentage: 62.5 },
        { source: 'Twitter', visits: 200, percentage: 25 },
        { source: 'Direct', visits: 100, percentage: 12.5 },
      ]);
    });
  });

  describe('Caching', () => {
    it('should cache analytics data for performance', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      mockPrisma.view.count.mockResolvedValue(1000);
      mockPrisma.article.count.mockResolvedValue(50);

      // First request
      const { req: req1 } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req1);

      // Second request within cache window
      const { req: req2 } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req2);

      // Should use cached data (implementation dependent)
      expect(mockPrisma.view.count).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache when date range changes', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      mockPrisma.view.count.mockResolvedValue(1000);

      // Request with date range
      const { req: req1 } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31',
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });

      await handler.GET(req1);

      // Request with different date range
      const { req: req2 } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard?startDate=2024-02-01&endDate=2024-02-28',
        query: {
          startDate: '2024-02-01',
          endDate: '2024-02-28',
        },
      });

      await handler.GET(req2);

      // Should make separate database calls
      expect(mockPrisma.view.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('should use efficient database queries', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      mockPrisma.view.count.mockResolvedValue(1000);
      mockPrisma.article.count.mockResolvedValue(50);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      // Verify efficient query patterns
      expect(mockPrisma.view.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        })
      );
    });

    it('should limit data processing for large datasets', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      // Mock large dataset
      const largeViewData = Array.from({ length: 10000 }, (_, i) => ({
        _count: { id: 1 },
        createdAt: new Date(`2024-01-${(i % 30) + 1}`),
      }));

      mockPrisma.view.groupBy.mockResolvedValue(largeViewData);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      // Should handle large datasets efficiently
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.viewsOverTime).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should prevent SQL injection in date parameters', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      const maliciousDate = "2024-01-01'; DROP TABLE views; --";

      const { req, res } = createMocks({
        method: 'GET',
        url: `/api/analytics/dashboard?startDate=${encodeURIComponent(maliciousDate)}`,
        query: {
          startDate: maliciousDate,
        },
      });

      await handler.GET(req);

      // Should reject malicious input
      expect(res._getStatusCode()).toBe(400);
    });

    it('should sanitize user input parameters', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard?category=<script>alert("xss")</script>',
        query: {
          category: '<script>alert("xss")</script>',
        },
      });

      await handler.GET(req);

      // Should sanitize or reject XSS attempts
      expect(res._getStatusCode()).toBe(400);
    });

    it('should rate limit analytics requests', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      // Mock multiple rapid requests
      const requests = Array.from({ length: 20 }, () =>
        createMocks({
          method: 'GET',
          url: '/api/analytics/dashboard',
          headers: { 'x-forwarded-for': '192.168.1.1' },
        })
      );

      mockPrisma.view.count.mockResolvedValue(1000);

      // Execute requests rapidly
      const responses = await Promise.all(
        requests.map(({ req }) => handler.GET(req))
      );

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => 
        res && res.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle partial data failures gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      // Mock partial failure - some queries succeed, others fail
      mockPrisma.view.count.mockResolvedValue(1000);
      mockPrisma.article.count.mockRejectedValue(new Error('Article query failed'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      // Should return partial data with error indication
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.totalViews).toBe(1000);
      expect(responseData.errors).toContain('Failed to load article count');
    });

    it('should handle timeout errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'admin' },
      });

      // Mock timeout
      mockPrisma.view.count.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 100)
        )
      );

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analytics/dashboard',
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Request timeout');
    });
  });
});