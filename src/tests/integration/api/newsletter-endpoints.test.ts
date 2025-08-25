import { NextRequest } from 'next/server';
import { GET as getNewsletterIssues } from '@/app/api/newsletter/issues/route';
import { GET as getNewsletterIssue } from '@/app/api/newsletter/issues/[slug]/route';
import { GET as getAdminNewsletterIssues, POST as createNewsletterIssue } from '@/app/api/admin/newsletter/issues/route';
import { GET as getAdminNewsletterIssue, PUT as updateNewsletterIssue } from '@/app/api/admin/newsletter/issues/[id]/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  newsletterIssue: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

const mockNewsletterIssue = {
  id: '1',
  title: 'Weekly Tech Roundup',
  slug: 'weekly-tech-roundup-issue-5',
  summary: 'This week we cover the latest in AI, blockchain, and startup funding.',
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Newsletter content here' }],
      },
    ],
  },
  issueNumber: 5,
  status: 'PUBLISHED',
  publishedAt: new Date('2024-01-15T10:00:00Z'),
  sentAt: null,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  author: {
    id: '1',
    name: 'Jane Smith',
    avatar: null,
  },
};

describe('Newsletter API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/newsletter/issues', () => {
    it('returns published newsletter issues with pagination', async () => {
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([mockNewsletterIssue]);
      (prisma.newsletterIssue.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/newsletter/issues?page=1&limit=10');
      const response = await getNewsletterIssues(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.issues).toHaveLength(1);
      expect(data.issues[0]).toEqual(expect.objectContaining({
        title: 'Weekly Tech Roundup',
        slug: 'weekly-tech-roundup-issue-5',
        issueNumber: 5,
        status: 'PUBLISHED',
      }));
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('orders issues by issue number descending', async () => {
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([mockNewsletterIssue]);
      (prisma.newsletterIssue.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/newsletter/issues');
      await getNewsletterIssues(request);

      expect(prisma.newsletterIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { issueNumber: 'desc' },
        })
      );
    });

    it('only returns published issues', async () => {
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([mockNewsletterIssue]);
      (prisma.newsletterIssue.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/newsletter/issues');
      await getNewsletterIssues(request);

      expect(prisma.newsletterIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PUBLISHED' },
        })
      );
    });

    it('returns 500 on database error', async () => {
      (prisma.newsletterIssue.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/newsletter/issues');
      const response = await getNewsletterIssues(request);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/newsletter/issues/[slug]', () => {
    it('returns newsletter issue by slug', async () => {
      (prisma.newsletterIssue.findUnique as jest.Mock).mockResolvedValue(mockNewsletterIssue);

      const response = await getNewsletterIssue(
        new NextRequest('http://localhost:3000/api/newsletter/issues/weekly-tech-roundup-issue-5'),
        { params: { slug: 'weekly-tech-roundup-issue-5' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.issue).toEqual(expect.objectContaining({
        title: 'Weekly Tech Roundup',
        slug: 'weekly-tech-roundup-issue-5',
        issueNumber: 5,
      }));
    });

    it('returns 404 for non-existent issue', async () => {
      (prisma.newsletterIssue.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await getNewsletterIssue(
        new NextRequest('http://localhost:3000/api/newsletter/issues/non-existent'),
        { params: { slug: 'non-existent' } }
      );

      expect(response.status).toBe(404);
    });

    it('returns 404 for draft issue to public', async () => {
      const draftIssue = { ...mockNewsletterIssue, status: 'DRAFT' };
      (prisma.newsletterIssue.findUnique as jest.Mock).mockResolvedValue(draftIssue);

      const response = await getNewsletterIssue(
        new NextRequest('http://localhost:3000/api/newsletter/issues/weekly-tech-roundup-issue-5'),
        { params: { slug: 'weekly-tech-roundup-issue-5' } }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/newsletter/issues', () => {
    it('returns all newsletter issues for authenticated admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([mockNewsletterIssue]);
      (prisma.newsletterIssue.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues');
      const response = await getAdminNewsletterIssues(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.issues).toHaveLength(1);
    });

    it('returns 401 for unauthenticated user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues');
      const response = await getAdminNewsletterIssues(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 for non-admin user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'USER' },
      });

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues');
      const response = await getAdminNewsletterIssues(request);

      expect(response.status).toBe(403);
    });

    it('filters by status when provided', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([mockNewsletterIssue]);
      (prisma.newsletterIssue.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues?status=DRAFT');
      await getAdminNewsletterIssues(request);

      expect(prisma.newsletterIssue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'DRAFT' },
        })
      );
    });
  });

  describe('POST /api/admin/newsletter/issues', () => {
    const validIssueData = {
      title: 'New Newsletter Issue',
      slug: 'new-newsletter-issue',
      summary: 'New newsletter summary',
      content: { type: 'doc', content: [] },
      status: 'DRAFT',
    };

    it('creates new newsletter issue for authenticated admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.newsletterIssue.create as jest.Mock).mockResolvedValue({
        ...mockNewsletterIssue,
        ...validIssueData,
        issueNumber: 6,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues', {
        method: 'POST',
        body: JSON.stringify(validIssueData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createNewsletterIssue(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.issue.title).toBe('New Newsletter Issue');
      expect(data.issue.issueNumber).toBe(6);
    });

    it('auto-generates issue number', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([
        { issueNumber: 5 },
        { issueNumber: 4 },
      ]);
      (prisma.newsletterIssue.create as jest.Mock).mockResolvedValue({
        ...mockNewsletterIssue,
        ...validIssueData,
        issueNumber: 6,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues', {
        method: 'POST',
        body: JSON.stringify(validIssueData),
        headers: { 'Content-Type': 'application/json' },
      });

      await createNewsletterIssue(request);

      expect(prisma.newsletterIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            issueNumber: 6,
          }),
        })
      );
    });

    it('validates required fields', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });

      const invalidData = { title: '' }; // Missing required fields

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createNewsletterIssue(request);

      expect(response.status).toBe(400);
    });

    it('handles duplicate slug error', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.newsletterIssue.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues', {
        method: 'POST',
        body: JSON.stringify(validIssueData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await createNewsletterIssue(request);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/newsletter/issues/[id]', () => {
    const updateData = {
      title: 'Updated Newsletter Issue',
      summary: 'Updated summary',
    };

    it('updates existing newsletter issue for authenticated admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findUnique as jest.Mock).mockResolvedValue(mockNewsletterIssue);
      (prisma.newsletterIssue.update as jest.Mock).mockResolvedValue({
        ...mockNewsletterIssue,
        ...updateData,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await updateNewsletterIssue(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.issue.title).toBe('Updated Newsletter Issue');
    });

    it('returns 404 for non-existent issue', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues/999', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await updateNewsletterIssue(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
    });

    it('prevents editing sent newsletters', async () => {
      const sentIssue = { ...mockNewsletterIssue, sentAt: new Date() };
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' },
      });
      (prisma.newsletterIssue.findUnique as jest.Mock).mockResolvedValue(sentIssue);

      const request = new NextRequest('http://localhost:3000/api/admin/newsletter/issues/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await updateNewsletterIssue(request, { params: { id: '1' } });

      expect(response.status).toBe(400);
    });
  });
});