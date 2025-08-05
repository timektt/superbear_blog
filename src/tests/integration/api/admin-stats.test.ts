import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/stats/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    author: {
      findMany: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe('/api/admin/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return admin statistics when authenticated', async () => {
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', name: 'Admin' },
    } as any);

    // Mock database responses
    (prisma.article.count as jest.Mock)
      .mockResolvedValueOnce(10) // total articles
      .mockResolvedValueOnce(3) // recent articles
      .mockResolvedValueOnce(2); // recently published

    (prisma.article.groupBy as jest.Mock).mockResolvedValue([
      { status: 'PUBLISHED', _count: { id: 5 } },
      { status: 'DRAFT', _count: { id: 3 } },
      { status: 'ARCHIVED', _count: { id: 2 } },
    ]);

    (prisma.category.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'AI & ML',
        slug: 'ai-ml',
        _count: { articles: 3 },
      },
      {
        id: '2',
        name: 'DevTools',
        slug: 'devtools',
        _count: { articles: 2 },
      },
    ]);

    (prisma.author.findMany as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'John Doe',
        _count: { articles: 5 },
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('articles');
    expect(data).toHaveProperty('categories');
    expect(data).toHaveProperty('authors');
    expect(data).toHaveProperty('activity');

    // Check articles structure
    expect(data.articles.total).toBe(10);
    expect(data.articles.byStatus).toEqual({
      DRAFT: 3,
      PUBLISHED: 5,
      ARCHIVED: 2,
    });
    expect(data.articles.recentlyCreated).toBe(3);
    expect(data.articles.recentlyPublished).toBe(2);

    // Check categories structure
    expect(data.categories).toHaveLength(2);
    expect(data.categories[0]).toEqual({
      id: '1',
      name: 'AI & ML',
      slug: 'ai-ml',
      articleCount: 3,
    });

    // Check authors structure
    expect(data.authors).toHaveLength(1);
    expect(data.authors[0]).toEqual({
      id: '1',
      name: 'John Doe',
      articleCount: 5,
    });

    // Check activity structure
    expect(data.activity.articlesCreatedLast7Days).toBe(3);
    expect(data.activity.articlesPublishedLast7Days).toBe(2);
  });

  it('should handle database errors gracefully', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', name: 'Admin' },
    } as any);

    // Mock database error
    (prisma.article.count as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle empty database correctly', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@example.com', name: 'Admin' },
    } as any);

    // Mock empty database responses
    (prisma.article.count as jest.Mock)
      .mockResolvedValueOnce(0) // total articles
      .mockResolvedValueOnce(0) // recent articles
      .mockResolvedValueOnce(0); // recently published

    (prisma.article.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.category.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.author.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.articles.total).toBe(0);
    expect(data.articles.byStatus).toEqual({
      DRAFT: 0,
      PUBLISHED: 0,
      ARCHIVED: 0,
    });
    expect(data.categories).toHaveLength(0);
    expect(data.authors).toHaveLength(0);
  });
});
