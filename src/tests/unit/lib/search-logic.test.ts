import {
  searchArticles,
  parseSearchQuery,
  rankResults,
} from '@/lib/search/query';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Search Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseSearchQuery', () => {
    it('should parse simple search queries', () => {
      const result = parseSearchQuery('artificial intelligence');

      expect(result).toEqual({
        terms: ['artificial', 'intelligence'],
        phrases: [],
        excludeTerms: [],
        filters: {},
      });
    });

    it('should parse quoted phrases', () => {
      const result = parseSearchQuery('"machine learning" AI');

      expect(result).toEqual({
        terms: ['AI'],
        phrases: ['machine learning'],
        excludeTerms: [],
        filters: {},
      });
    });

    it('should parse exclude terms', () => {
      const result = parseSearchQuery('AI -blockchain -crypto');

      expect(result).toEqual({
        terms: ['AI'],
        phrases: [],
        excludeTerms: ['blockchain', 'crypto'],
        filters: {},
      });
    });

    it('should parse filter terms', () => {
      const result = parseSearchQuery('AI author:john category:tech tag:ml');

      expect(result).toEqual({
        terms: ['AI'],
        phrases: [],
        excludeTerms: [],
        filters: {
          author: 'john',
          category: 'tech',
          tag: 'ml',
        },
      });
    });

    it('should handle complex queries', () => {
      const result = parseSearchQuery(
        '"deep learning" AI -blockchain author:jane tag:neural'
      );

      expect(result).toEqual({
        terms: ['AI'],
        phrases: ['deep learning'],
        excludeTerms: ['blockchain'],
        filters: {
          author: 'jane',
          tag: 'neural',
        },
      });
    });

    it('should handle empty queries', () => {
      const result = parseSearchQuery('');

      expect(result).toEqual({
        terms: [],
        phrases: [],
        excludeTerms: [],
        filters: {},
      });
    });

    it('should normalize terms', () => {
      const result = parseSearchQuery('  ARTIFICIAL   Intelligence  ');

      expect(result).toEqual({
        terms: ['artificial', 'intelligence'],
        phrases: [],
        excludeTerms: [],
        filters: {},
      });
    });
  });

  describe('searchArticles', () => {
    const mockArticles = [
      {
        id: '1',
        title: 'Introduction to Artificial Intelligence',
        content: 'AI is transforming the world...',
        summary: 'A comprehensive guide to AI',
        slug: 'intro-to-ai',
        publishedAt: new Date('2024-01-15'),
        author: { name: 'John Doe', slug: 'john-doe' },
        category: { name: 'AI', slug: 'ai' },
        tags: [{ name: 'machine-learning', slug: 'ml' }],
      },
      {
        id: '2',
        title: 'Machine Learning Basics',
        content: 'ML is a subset of AI...',
        summary: 'Learn the fundamentals of ML',
        slug: 'ml-basics',
        publishedAt: new Date('2024-01-10'),
        author: { name: 'Jane Smith', slug: 'jane-smith' },
        category: { name: 'AI', slug: 'ai' },
        tags: [{ name: 'neural-networks', slug: 'neural' }],
      },
    ];

    it('should search articles by title and content', async () => {
      mockPrisma.article.findMany.mockResolvedValue(mockArticles);
      mockPrisma.article.count.mockResolvedValue(2);

      const result = await searchArticles({
        query: 'artificial intelligence',
        limit: 10,
        offset: 0,
      });

      expect(result.articles).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { published: true },
            {
              OR: [
                {
                  title: {
                    contains: 'artificial intelligence',
                    mode: 'insensitive',
                  },
                },
                {
                  content: {
                    contains: 'artificial intelligence',
                    mode: 'insensitive',
                  },
                },
                {
                  summary: {
                    contains: 'artificial intelligence',
                    mode: 'insensitive',
                  },
                },
              ],
            },
          ],
        },
        include: {
          author: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('should filter by category', async () => {
      mockPrisma.article.findMany.mockResolvedValue([mockArticles[0]]);
      mockPrisma.article.count.mockResolvedValue(1);

      const result = await searchArticles({
        query: 'AI',
        filters: { category: 'ai' },
        limit: 10,
        offset: 0,
      });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ category: { slug: 'ai' } }]),
          }),
        })
      );
    });

    it('should filter by author', async () => {
      mockPrisma.article.findMany.mockResolvedValue([mockArticles[1]]);
      mockPrisma.article.count.mockResolvedValue(1);

      const result = await searchArticles({
        query: 'machine learning',
        filters: { author: 'jane-smith' },
        limit: 10,
        offset: 0,
      });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ author: { slug: 'jane-smith' } }]),
          }),
        })
      );
    });

    it('should filter by tags', async () => {
      mockPrisma.article.findMany.mockResolvedValue([mockArticles[0]]);
      mockPrisma.article.count.mockResolvedValue(1);

      const result = await searchArticles({
        query: 'AI',
        filters: { tags: ['ml'] },
        limit: 10,
        offset: 0,
      });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { tags: { some: { slug: { in: ['ml'] } } } },
            ]),
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrisma.article.findMany.mockResolvedValue(mockArticles);
      mockPrisma.article.count.mockResolvedValue(2);

      const result = await searchArticles({
        query: 'AI',
        filters: {
          dateRange: { start: startDate, end: endDate },
        },
        limit: 10,
        offset: 0,
      });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                publishedAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            ]),
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      mockPrisma.article.findMany.mockResolvedValue([mockArticles[1]]);
      mockPrisma.article.count.mockResolvedValue(2);

      const result = await searchArticles({
        query: 'AI',
        limit: 1,
        offset: 1,
      });

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
          skip: 1,
        })
      );
    });

    it('should handle empty results', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      const result = await searchArticles({
        query: 'nonexistent topic',
        limit: 10,
        offset: 0,
      });

      expect(result.articles).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockPrisma.article.findMany.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        searchArticles({
          query: 'AI',
          limit: 10,
          offset: 0,
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('rankResults', () => {
    const mockResults = [
      {
        id: '1',
        title: 'Artificial Intelligence Guide',
        content:
          'This is a comprehensive guide about AI and machine learning...',
        summary: 'Learn about AI',
        publishedAt: new Date('2024-01-15'),
        views: 1000,
      },
      {
        id: '2',
        title: 'Machine Learning Basics',
        content: 'Introduction to ML concepts and artificial intelligence...',
        summary: 'ML fundamentals',
        publishedAt: new Date('2024-01-10'),
        views: 500,
      },
      {
        id: '3',
        title: 'Deep Learning Networks',
        content: 'Advanced topics in neural networks...',
        summary: 'Deep learning guide',
        publishedAt: new Date('2024-01-20'),
        views: 750,
      },
    ];

    it('should rank by relevance score', () => {
      const query = 'artificial intelligence';
      const ranked = rankResults(mockResults, query);

      // First result should have highest score (title + content match)
      expect(ranked[0].id).toBe('1');
      expect(ranked[0].relevanceScore).toBeGreaterThan(
        ranked[1].relevanceScore
      );
    });

    it('should boost title matches', () => {
      const query = 'machine learning';
      const ranked = rankResults(mockResults, query);

      // Second result has exact title match
      expect(ranked[0].id).toBe('2');
    });

    it('should consider recency in ranking', () => {
      const query = 'deep learning';
      const ranked = rankResults(mockResults, query);

      // Most recent article with matching content should rank high
      expect(ranked[0].id).toBe('3');
    });

    it('should factor in popularity (views)', () => {
      const query = 'guide';
      const ranked = rankResults(mockResults, query);

      // Higher view count should boost ranking
      const firstResult = ranked.find((r) => r.id === '1');
      const thirdResult = ranked.find((r) => r.id === '3');

      expect(firstResult?.relevanceScore).toBeGreaterThan(
        thirdResult?.relevanceScore || 0
      );
    });

    it('should handle empty query', () => {
      const ranked = rankResults(mockResults, '');

      // Should return results ordered by recency when no query
      expect(ranked[0].id).toBe('3'); // Most recent
      expect(ranked[1].id).toBe('1');
      expect(ranked[2].id).toBe('2'); // Oldest
    });

    it('should handle empty results', () => {
      const ranked = rankResults([], 'test query');

      expect(ranked).toHaveLength(0);
    });
  });

  describe('Search Performance', () => {
    it('should use database indexes efficiently', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      await searchArticles({
        query: 'AI machine learning',
        limit: 10,
        offset: 0,
      });

      // Verify that the query structure supports database indexing
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { published: true }, // Should use published index
            ]),
          }),
          orderBy: { publishedAt: 'desc' }, // Should use publishedAt index
        })
      );
    });

    it('should limit result sets appropriately', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      await searchArticles({
        query: 'test',
        limit: 100, // Large limit
        offset: 0,
      });

      // Should cap at reasonable limit
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Should be capped at max limit
        })
      );
    });
  });
});
