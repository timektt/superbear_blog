import { searchArticles, highlightSearchTerms } from '@/lib/search-utils';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('search-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchArticles', () => {
    const mockArticles = [
      {
        id: '1',
        title: 'React Testing Guide',
        slug: 'react-testing-guide',
        summary: 'Learn how to test React components',
        content: { type: 'doc', content: [] },
        image: null,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        author: { name: 'John Doe', avatar: null },
        category: { name: 'Development', slug: 'development' },
        tags: [{ name: 'React', slug: 'react' }],
      },
    ];

    it('should search articles by title', async () => {
      mockPrisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await searchArticles('React');

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { status: 'PUBLISHED' },
            {
              OR: [
                { title: { contains: 'React', mode: 'insensitive' } },
                { summary: { contains: 'React', mode: 'insensitive' } },
              ],
            },
          ],
        },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
      });

      expect(result).toEqual(mockArticles);
    });

    it('should return empty array for empty query', async () => {
      const result = await searchArticles('');
      expect(result).toEqual([]);
      expect(mockPrisma.article.findMany).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrisma.article.findMany.mockRejectedValue(
        new Error('Database error')
      );

      await expect(searchArticles('React')).rejects.toThrow('Database error');
    });
  });

  describe('highlightSearchTerms', () => {
    it('should highlight single search term', () => {
      const text = 'React is a JavaScript library';
      const query = 'React';
      const result = highlightSearchTerms(text, query);

      expect(result).toBe('<mark>React</mark> is a JavaScript library');
    });

    it('should highlight multiple occurrences', () => {
      const text = 'React components make React development easier';
      const query = 'React';
      const result = highlightSearchTerms(text, query);

      expect(result).toBe(
        '<mark>React</mark> components make <mark>React</mark> development easier'
      );
    });

    it('should be case insensitive', () => {
      const text = 'React is awesome';
      const query = 'react';
      const result = highlightSearchTerms(text, query);

      expect(result).toBe('<mark>React</mark> is awesome');
    });

    it('should handle empty query', () => {
      const text = 'React is awesome';
      const query = '';
      const result = highlightSearchTerms(text, query);

      expect(result).toBe('React is awesome');
    });

    it('should handle special regex characters', () => {
      const text = 'Use React.js for development';
      const query = 'React.js';
      const result = highlightSearchTerms(text, query);

      expect(result).toBe('Use <mark>React.js</mark> for development');
    });
  });
});
