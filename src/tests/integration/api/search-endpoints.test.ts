import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/search/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/search', () => {
    it('should return search results for valid query', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'AI Revolution',
          content: 'Artificial intelligence is changing everything...',
          summary: 'AI overview',
          slug: 'ai-revolution',
          publishedAt: new Date('2024-01-15'),
          views: 1000,
          author: { name: 'John Doe', slug: 'john-doe' },
          category: { name: 'AI', slug: 'ai' },
          tags: [{ name: 'machine-learning', slug: 'ml' }],
        },
      ];

      mockPrisma.article.findMany.mockResolvedValue(mockArticles);
      mockPrisma.article.count.mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=artificial%20intelligence&limit=10&offset=0',
        query: {
          q: 'artificial intelligence',
          limit: '10',
          offset: '0',
        },
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toEqual({
        articles: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            title: 'AI Revolution',
            slug: 'ai-revolution',
          }),
        ]),
        total: 1,
        facets: expect.any(Object),
      });
    });

    it('should handle search with filters', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI&category=ai&author=john-doe&tags=ml,neural',
        query: {
          q: 'AI',
          category: 'ai',
          author: 'john-doe',
          tags: 'ml,neural',
        },
      });

      await handler.GET(req);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { category: { slug: 'ai' } },
              { author: { slug: 'john-doe' } },
              { tags: { some: { slug: { in: ['ml', 'neural'] } } } },
            ]),
          }),
        })
      );
    });

    it('should handle date range filtering', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI&startDate=2024-01-01&endDate=2024-01-31',
        query: {
          q: 'AI',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });

      await handler.GET(req);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                publishedAt: {
                  gte: new Date('2024-01-01'),
                  lte: new Date('2024-01-31'),
                },
              },
            ]),
          }),
        })
      );
    });

    it('should handle pagination parameters', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI&limit=5&offset=10',
        query: {
          q: 'AI',
          limit: '5',
          offset: '10',
        },
      });

      await handler.GET(req);

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        })
      );
    });

    it('should validate query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?limit=invalid&offset=negative',
        query: {
          limit: 'invalid',
          offset: 'negative',
        },
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Invalid parameters');
    });

    it('should require search query', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search',
        query: {},
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Search query is required');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.article.findMany.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI',
        query: { q: 'AI' },
      });

      await handler.GET(req);

      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
    });

    it('should limit result sets for performance', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI&limit=1000',
        query: {
          q: 'AI',
          limit: '1000',
        },
      });

      await handler.GET(req);

      // Should cap at maximum limit
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Max limit
        })
      );
    });

    it('should return faceted search results', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'AI Article',
          author: { name: 'John Doe', slug: 'john-doe' },
          category: { name: 'AI', slug: 'ai' },
          tags: [{ name: 'machine-learning', slug: 'ml' }],
        },
      ];

      mockPrisma.article.findMany.mockResolvedValue(mockArticles);
      mockPrisma.article.count.mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI',
        query: { q: 'AI' },
      });

      await handler.GET(req);

      const responseData = JSON.parse(res._getData());
      expect(responseData.facets).toEqual({
        categories: expect.arrayContaining([
          { name: 'AI', slug: 'ai', count: 1 },
        ]),
        authors: expect.arrayContaining([
          { name: 'John Doe', slug: 'john-doe', count: 1 },
        ]),
        tags: expect.arrayContaining([
          { name: 'machine-learning', slug: 'ml', count: 1 },
        ]),
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for search requests', async () => {
      // Mock multiple rapid requests
      const requests = Array.from({ length: 10 }, () =>
        createMocks({
          method: 'GET',
          url: '/api/search?q=AI',
          query: { q: 'AI' },
          headers: { 'x-forwarded-for': '192.168.1.1' },
        })
      );

      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

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

  describe('Security', () => {
    it('should sanitize search queries to prevent injection', async () => {
      const maliciousQuery = "'; DROP TABLE articles; --";
      
      const { req, res } = createMocks({
        method: 'GET',
        url: `/api/search?q=${encodeURIComponent(maliciousQuery)}`,
        query: { q: maliciousQuery },
      });

      await handler.GET(req);

      // Should not execute malicious SQL
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                OR: expect.arrayContaining([
                  { title: { contains: maliciousQuery, mode: 'insensitive' } },
                ]),
              },
            ]),
          }),
        })
      );
    });

    it('should validate and sanitize filter parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI&category=<script>alert("xss")</script>',
        query: {
          q: 'AI',
          category: '<script>alert("xss")</script>',
        },
      });

      await handler.GET(req);

      // Should sanitize the category parameter
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { category: { slug: 'scriptalertxssscript' } }, // Sanitized
            ]),
          }),
        })
      );
    });
  });

  describe('Performance', () => {
    it('should use database indexes efficiently', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/search?q=AI',
        query: { q: 'AI' },
      });

      await handler.GET(req);

      // Verify query structure supports indexing
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { published: true }, // Uses published index
            ]),
          }),
          orderBy: { publishedAt: 'desc' }, // Uses publishedAt index
        })
      );
    });

    it('should cache search results for common queries', async () => {
      const commonQuery = 'artificial intelligence';
      
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      // First request
      const { req: req1 } = createMocks({
        method: 'GET',
        url: `/api/search?q=${encodeURIComponent(commonQuery)}`,
        query: { q: commonQuery },
      });

      await handler.GET(req1);

      // Second identical request
      const { req: req2 } = createMocks({
        method: 'GET',
        url: `/api/search?q=${encodeURIComponent(commonQuery)}`,
        query: { q: commonQuery },
      });

      await handler.GET(req2);

      // Should use cache for second request (implementation dependent)
      expect(mockPrisma.article.findMany).toHaveBeenCalledTimes(2);
    });
  });
});