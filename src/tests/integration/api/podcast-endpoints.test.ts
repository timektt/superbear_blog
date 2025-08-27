import { NextRequest } from 'next/server';
import { GET as getPodcasts } from '@/app/api/podcasts/route';
import { GET as getPodcast } from '@/app/api/podcasts/[slug]/route';
import {
  GET as getAdminPodcasts,
  POST as createPodcast,
} from '@/app/api/admin/podcasts/route';
import {
  GET as getAdminPodcast,
  PUT as updatePodcast,
  DELETE as deletePodcast,
} from '@/app/api/admin/podcasts/[id]/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  podcastEpisode: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

const mockPodcast = {
  id: '1',
  title: 'Test Podcast Episode',
  slug: 'test-podcast-episode',
  description: 'Test description',
  summary: 'Test summary',
  audioUrl: 'https://example.com/audio.mp3',
  coverImage: 'https://example.com/cover.jpg',
  duration: 1800,
  episodeNumber: 1,
  seasonNumber: 1,
  status: 'PUBLISHED',
  publishedAt: new Date('2024-01-15T10:00:00Z'),
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  author: {
    id: '1',
    name: 'John Doe',
    avatar: null,
  },
  category: {
    id: '1',
    name: 'Technology',
    slug: 'technology',
  },
  tags: [{ id: '1', name: 'AI', slug: 'ai' }],
};

describe('Podcast API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/podcasts', () => {
    it('returns published podcasts with pagination', async () => {
      (prisma.podcastEpisode.findMany as jest.Mock).mockResolvedValue([
        mockPodcast,
      ]);
      (prisma.podcastEpisode.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/podcasts?page=1&limit=10'
      );
      const response = await getPodcasts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.podcasts).toHaveLength(1);
      expect(data.podcasts[0]).toEqual(
        expect.objectContaining({
          title: 'Test Podcast Episode',
          slug: 'test-podcast-episode',
          status: 'PUBLISHED',
        })
      );
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('filters podcasts by category', async () => {
      (prisma.podcastEpisode.findMany as jest.Mock).mockResolvedValue([
        mockPodcast,
      ]);
      (prisma.podcastEpisode.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/podcasts?category=technology'
      );
      await getPodcasts(request);

      expect(prisma.podcastEpisode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 'technology' },
          }),
        })
      );
    });

    it('handles search query', async () => {
      (prisma.podcastEpisode.findMany as jest.Mock).mockResolvedValue([
        mockPodcast,
      ]);
      (prisma.podcastEpisode.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/podcasts?search=test'
      );
      await getPodcasts(request);

      expect(prisma.podcastEpisode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('returns 500 on database error', async () => {
      (prisma.podcastEpisode.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/podcasts');
      const response = await getPodcasts(request);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/podcasts/[slug]', () => {
    it('returns podcast by slug', async () => {
      (prisma.podcastEpisode.findUnique as jest.Mock).mockResolvedValue(
        mockPodcast
      );

      const response = await getPodcast(
        new NextRequest(
          'http://localhost:3000/api/podcasts/test-podcast-episode'
        ),
        { params: { slug: 'test-podcast-episode' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.podcast).toEqual(
        expect.objectContaining({
          title: 'Test Podcast Episode',
          slug: 'test-podcast-episode',
        })
      );
    });

    it('returns 404 for non-existent podcast', async () => {
      (prisma.podcastEpisode.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await getPodcast(
        new NextRequest('http://localhost:3000/api/podcasts/non-existent'),
        { params: { slug: 'non-existent' } }
      );

      expect(response.status).toBe(404);
    });

    it('returns 404 for draft podcast to public', async () => {
      const draftPodcast = { ...mockPodcast, status: 'DRAFT' };
      (prisma.podcastEpisode.findUnique as jest.Mock).mockResolvedValue(
        draftPodcast
      );

      const response = await getPodcast(
        new NextRequest(
          'http://localhost:3000/api/podcasts/test-podcast-episode'
        ),
        { params: { slug: 'test-podcast-episode' } }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/podcasts', () => {
    it('returns all podcasts for authenticated admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.podcastEpisode.findMany as jest.Mock).mockResolvedValue([
        mockPodcast,
      ]);
      (prisma.podcastEpisode.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts'
      );
      const response = await getAdminPodcasts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.podcasts).toHaveLength(1);
    });

    it('returns 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts'
      );
      const response = await getAdminPodcasts(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 for non-admin user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'USER' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts'
      );
      const response = await getAdminPodcasts(request);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/admin/podcasts', () => {
    const validPodcastData = {
      title: 'New Podcast Episode',
      slug: 'new-podcast-episode',
      description: 'New description',
      audioUrl: 'https://example.com/new-audio.mp3',
      status: 'DRAFT',
    };

    it('creates new podcast for authenticated admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.podcastEpisode.create as jest.Mock).mockResolvedValue({
        ...mockPodcast,
        ...validPodcastData,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts',
        {
          method: 'POST',
          body: JSON.stringify(validPodcastData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await createPodcast(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.podcast.title).toBe('New Podcast Episode');
      expect(prisma.podcastEpisode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining(validPodcastData),
        })
      );
    });

    it('validates required fields', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });

      const invalidData = { title: '' }; // Missing required fields

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await createPodcast(request);

      expect(response.status).toBe(400);
    });

    it('handles duplicate slug error', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.podcastEpisode.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts',
        {
          method: 'POST',
          body: JSON.stringify(validPodcastData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await createPodcast(request);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/podcasts/[id]', () => {
    const updateData = {
      title: 'Updated Podcast Episode',
      description: 'Updated description',
    };

    it('updates existing podcast for authenticated admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.podcastEpisode.findUnique as jest.Mock).mockResolvedValue(
        mockPodcast
      );
      (prisma.podcastEpisode.update as jest.Mock).mockResolvedValue({
        ...mockPodcast,
        ...updateData,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts/1',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await updatePodcast(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.podcast.title).toBe('Updated Podcast Episode');
    });

    it('returns 404 for non-existent podcast', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.podcastEpisode.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts/999',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await updatePodcast(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/podcasts/[id]', () => {
    it('deletes existing podcast for authenticated admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.podcastEpisode.findUnique as jest.Mock).mockResolvedValue(
        mockPodcast
      );
      (prisma.podcastEpisode.delete as jest.Mock).mockResolvedValue(
        mockPodcast
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts/1',
        {
          method: 'DELETE',
        }
      );

      const response = await deletePodcast(request, { params: { id: '1' } });

      expect(response.status).toBe(200);
      expect(prisma.podcastEpisode.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('returns 404 for non-existent podcast', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.podcastEpisode.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/podcasts/999',
        {
          method: 'DELETE',
        }
      );

      const response = await deletePodcast(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
    });
  });
});
