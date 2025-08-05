import { POST } from '@/app/api/admin/articles/route';
import { getServerSession } from 'next-auth';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    author: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe('/api/admin/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSession = {
    user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
  };

  const mockArticle = {
    id: '1',
    title: 'Test Article',
    slug: 'test-article',
    summary: 'Test summary',
    content: { type: 'doc', content: [] },
    image: null,
    status: 'DRAFT',
    publishedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    authorId: '1',
    categoryId: '1',
    author: { name: 'Admin User', avatar: null },
    category: { name: 'Development', slug: 'development' },
    tags: [],
  };

  describe('POST /api/admin/articles', () => {
    it('should create article when authenticated', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue(null); // No existing article with same slug
      mockPrisma.author.findUnique.mockResolvedValue({
        id: '1',
        name: 'Admin User',
      });
      mockPrisma.category.findUnique.mockResolvedValue({
        id: '1',
        name: 'Development',
      });
      mockPrisma.article.create.mockResolvedValue(mockArticle as unknown);

      const requestBody = {
        title: 'Test Article',
        slug: 'test-article',
        summary: 'Test summary',
        content: { type: 'doc', content: [] },
        categoryId: '1',
        status: 'DRAFT',
        authorId: '1',
      };

      const request = new Request('http://localhost:3000/api/admin/articles', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Test Article');
    });

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/articles', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Article' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
