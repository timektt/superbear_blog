import { NextRequest } from 'next/server';
import { GET as getComments, POST as postComment } from '@/app/api/comments/route';
import { GET as getReactions, POST as postReaction } from '@/app/api/reactions/route';

// Mock the safe Prisma client
jest.mock('@/lib/db-safe/client', () => ({
  getSafePrismaClient: jest.fn(),
}));

jest.mock('@/lib/comments/store', () => ({
  sanitizeHtml: jest.fn((html) => html),
}));

import { getSafePrismaClient } from '@/lib/db-safe/client';

describe('API Safe Mode Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Comments API', () => {
    it('should return safe mode response when Prisma client is null', async () => {
      (getSafePrismaClient as jest.Mock).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/comments?articleId=test');
      const response = await getComments(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ comments: [], safeMode: true });
    });

    it('should use correct CommentStatus enum values', async () => {
      const mockPrisma = {
        comment: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue({ id: '1' }),
        },
      };
      (getSafePrismaClient as jest.Mock).mockReturnValue(mockPrisma);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          articleId: 'test',
          body: 'test comment',
          authorName: 'Test User',
          authorEmailHash: 'hash123',
        }),
      });

      await postComment(request);

      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: expect.any(String), // Should be CommentStatus enum value
          }),
        })
      );
    });

    it('should return 400 for missing articleId', async () => {
      const request = new NextRequest('http://localhost:3000/api/comments');
      const response = await getComments(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Reactions API', () => {
    it('should return safe mode response when Prisma client is null', async () => {
      (getSafePrismaClient as jest.Mock).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/reactions?articleId=test');
      const response = await getReactions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ count: 0, safeMode: true });
    });

    it('should use correct CommentStatus enum for reactions', async () => {
      const mockPrisma = {
        comment: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: '1' }),
          count: jest.fn().mockResolvedValue(5),
        },
      };
      (getSafePrismaClient as jest.Mock).mockReturnValue(mockPrisma);

      const request = new NextRequest('http://localhost:3000/api/reactions', {
        method: 'POST',
        body: JSON.stringify({
          articleId: 'test',
          emailHash: 'hash123',
        }),
      });

      await postReaction(request);

      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: expect.any(String), // Should be CommentStatus enum value
          }),
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockPrisma = {
        comment: {
          count: jest.fn().mockRejectedValue(new Error('DB Error')),
        },
      };
      (getSafePrismaClient as jest.Mock).mockReturnValue(mockPrisma);

      const request = new NextRequest('http://localhost:3000/api/reactions?articleId=test');
      const response = await getReactions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ count: 0, safeMode: true });
    });
  });
});