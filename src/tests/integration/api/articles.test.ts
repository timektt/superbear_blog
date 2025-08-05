import { GET } from '@/app/api/articles/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArticles = [
    {
      id: '1',
      title: 'Test Article 1',
      slug: 'test-article-1',
      summary: 'Test summary 1',
      content: { type: 'doc', content: [] },
      image: 'https://example.com/image1.jpg',
      status: 'PUBLISHED',
      publishedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      author: { name: 'John Doe', avatar: null },
      category: { name: 'Development', slug: 'development' },
      tags: [{ name: 'React', slug: 'react' }],
    },
  ];

  describe('GET /api/articles', () => {
    it('should return published articles', async () => {
      mockPrisma.article.findMany.mockResolvedValue(mockArticles as unknown);
      mockPrisma.article.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/articles', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.articles).toHaveLength(1);
      expect(data.articles[0].title).toBe('Test Article 1');
      expect(data.pagination.total).toBe(1);
    });

    it('should handle database errors', async () => {
      mockPrisma.article.findMany.mockRejectedValue(
        new Error('Database error')
      );

      const request = new Request('http://localhost:3000/api/articles', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch articles');
    });
  });
});