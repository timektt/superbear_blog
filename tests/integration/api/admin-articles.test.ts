import { createMocks } from 'node-mocks-http'
import { POST, GET } from '@/app/api/admin/articles/route'
import { PATCH, DELETE } from '@/app/api/admin/articles/[id]/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/admin/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSession = {
    user: { id: '1', email: 'admin@example.com', name: 'Admin User' },
  }

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
  }

  describe('POST /api/admin/articles', () => {
    it('should create article when authenticated', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.article.create.mockResolvedValue(mockArticle)

      const { req } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Article',
          slug: 'test-article',
          summary: 'Test summary',
          content: { type: 'doc', content: [] },
          categoryId: '1',
          status: 'DRAFT',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockArticle)
      expect(mockPrisma.article.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Article',
          slug: 'test-article',
          summary: 'Test summary',
          content: { type: 'doc', content: [] },
          categoryId: '1',
          status: 'DRAFT',
          authorId: '1',
        },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const { req } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Article',
        },
      })

      const response = await POST(req)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate required fields', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const { req } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
        },
      })

      const response = await POST(req)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })

    it('should handle database errors', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.article.create.mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Article',
          slug: 'test-article',
          summary: 'Test summary',
          content: { type: 'doc', content: [] },
          categoryId: '1',
          status: 'DRAFT',
        },
      })

      const response = await POST(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to create article')
    })
  })

  describe('GET /api/admin/articles', () => {
    it('should return all articles for admin', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.article.findMany.mockResolvedValue([mockArticle])

      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/articles',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([mockArticle])
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
        orderBy: { updatedAt: 'desc' },
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/articles',
      })

      const response = await GET(req)

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/admin/articles/[id]', () => {
    it('should update article when authenticated', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      const updatedArticle = { ...mockArticle, title: 'Updated Title' }
      mockPrisma.article.update.mockResolvedValue(updatedArticle)

      const { req } = createMocks({
        method: 'PATCH',
        body: {
          title: 'Updated Title',
        },
      })

      const response = await PATCH(req, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe('Updated Title')
      expect(mockPrisma.article.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'Updated Title' },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const { req } = createMocks({
        method: 'PATCH',
        body: { title: 'Updated Title' },
      })

      const response = await PATCH(req, { params: { id: '1' } })

      expect(response.status).toBe(401)
    })

    it('should return 404 when article not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.article.update.mockRejectedValue({ code: 'P2025' })

      const { req } = createMocks({
        method: 'PATCH',
        body: { title: 'Updated Title' },
      })

      const response = await PATCH(req, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Article not found')
    })
  })

  describe('DELETE /api/admin/articles/[id]', () => {
    it('should delete article when authenticated', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.article.delete.mockResolvedValue(mockArticle)

      const { req } = createMocks({
        method: 'DELETE',
      })

      const response = await DELETE(req, { params: { id: '1' } })

      expect(response.status).toBe(204)
      expect(mockPrisma.article.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const { req } = createMocks({
        method: 'DELETE',
      })

      const response = await DELETE(req, { params: { id: '1' } })

      expect(response.status).toBe(401)
    })

    it('should return 404 when article not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.article.delete.mockRejectedValue({ code: 'P2025' })

      const { req } = createMocks({
        method: 'DELETE',
      })

      const response = await DELETE(req, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Article not found')
    })
  })
})