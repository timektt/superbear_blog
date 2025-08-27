import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/articles/route';
import { PATCH, DELETE } from '@/app/api/admin/articles/[id]/route';
import { getServerSession } from 'next-auth';

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn(),
    },
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    author: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as any;
const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// Mock cloudinary
const mockCloudinary = require('cloudinary').v2;

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
    const validArticleData = {
      title: 'Test Article',
      slug: 'test-article',
      summary: 'A test article',
      content: JSON.stringify({ type: 'doc', content: [] }),
      status: 'DRAFT',
      authorId: 'author-1',
      categoryId: 'category-1',
      tagIds: ['tag-1'],
    };

    it('should create article when authenticated', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue(null); // No existing article with same slug
      mockPrisma.author.findUnique.mockResolvedValue({
        id: 'author-1',
        name: 'Admin User',
      });
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'category-1',
        name: 'Development',
      });
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }]);
      mockPrisma.article.create.mockResolvedValue({
        ...mockArticle,
        ...validArticleData,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles',
        {
          method: 'POST',
          body: JSON.stringify(validArticleData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockPrisma.article.create).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles',
        {
          method: 'POST',
          body: JSON.stringify(validArticleData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = {
        title: '', // Invalid: empty title
        content: 'invalid json',
        authorId: 'author-1',
        categoryId: 'category-1',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Validation error');
    });

    it('should return 400 for invalid tag IDs', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue(null);
      mockPrisma.author.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'category-1' });
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }]); // Only tag-1 exists

      const dataWithInvalidTags = {
        ...validArticleData,
        tagIds: ['tag-1', 'nonexistent-tag'],
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles',
        {
          method: 'POST',
          body: JSON.stringify(dataWithInvalidTags),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Tags not found: nonexistent-tag');
    });

    it('should handle duplicate slug by returning error', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      // Mock existing article with same slug
      mockPrisma.article.findUnique.mockResolvedValue({
        id: 'existing-article',
      });
      mockPrisma.author.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'category-1' });
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }]);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles',
        {
          method: 'POST',
          body: JSON.stringify(validArticleData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toContain('already exists');
    });
  });

  describe('PATCH /api/admin/articles/[id]', () => {
    const updateData = {
      title: 'Updated Article',
      slug: 'updated-article',
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'text', text: 'Updated content' }],
      }),
    };

    it('should update article successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue({
        id: 'article-1',
        title: 'Original Article',
        slug: 'original-article',
      });
      mockPrisma.article.update.mockResolvedValue({
        id: 'article-1',
        ...updateData,
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'article-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: expect.objectContaining(updateData),
        include: expect.any(Object),
      });
    });

    it('should return 404 when article not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/nonexistent',
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Article not found');
    });

    it('should return 400 for invalid update data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'article-1' });

      const invalidUpdateData = {
        slug: 'Invalid Slug!', // Invalid slug format
        content: 'invalid json',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1',
        {
          method: 'PATCH',
          body: JSON.stringify(invalidUpdateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'article-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Validation error');
    });

    it('should return 400 for invalid tag IDs in update', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'article-1' });
      mockPrisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }]); // Only tag-1 exists

      const updateWithInvalidTags = {
        tagIds: ['tag-1', 'nonexistent-tag'],
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1',
        {
          method: 'PATCH',
          body: JSON.stringify(updateWithInvalidTags),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'article-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Tags not found: nonexistent-tag');
    });
  });

  describe('DELETE /api/admin/articles/[id]', () => {
    it('should delete article and associated image successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      const articleWithImage = {
        id: 'article-1',
        title: 'Test Article',
        image:
          'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
      };

      mockPrisma.article.findUnique.mockResolvedValue(articleWithImage);
      mockPrisma.article.delete.mockResolvedValue(articleWithImage);
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'article-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Article deleted successfully');
      expect(mockPrisma.article.delete).toHaveBeenCalledWith({
        where: { id: 'article-1' },
      });
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith('sample');
    });

    it('should delete article without image successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      const articleWithoutImage = {
        id: 'article-1',
        title: 'Test Article',
        image: null,
      };

      mockPrisma.article.findUnique.mockResolvedValue(articleWithoutImage);
      mockPrisma.article.delete.mockResolvedValue(articleWithoutImage);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'article-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.article.delete).toHaveBeenCalled();
      expect(mockCloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary deletion failure gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      const articleWithImage = {
        id: 'article-1',
        title: 'Test Article',
        image:
          'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
      };

      mockPrisma.article.findUnique.mockResolvedValue(articleWithImage);
      mockPrisma.article.delete.mockResolvedValue(articleWithImage);
      mockCloudinary.uploader.destroy.mockRejectedValue(
        new Error('Cloudinary error')
      );

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/article-1',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'article-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.article.delete).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleting image from Cloudinary:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return 404 when article not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/articles/nonexistent',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Article not found');
      expect(mockPrisma.article.delete).not.toHaveBeenCalled();
    });
  });
});
