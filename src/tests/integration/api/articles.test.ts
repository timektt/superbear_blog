import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/articles/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
    {
      id: '2',
      title: 'Test Article 2',
      slug: 'test-article-2',
      summary: 'Test summary 2',
      content: { type: 'doc', content: [] },
      image: null,
      status: 'PUBLISHED',
      publishedAt: new Date('2024-01-02'),
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      author: { name: 'Jane Smith', avatar: null },
      category: { name: 'AI', slug: 'ai' },
      tags: [{ name: 'Machine Learning', slug: 'machine-learning' }],
    },
  ]

  describe('GET /api/articles', () => {
    it('should return published articles', async () => {
      mockPrisma.article.findMany.mockResolvedValue(mockArticles)
      mockPrisma.article.count.mockResolvedValue(2)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/articles',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.articles).toEqual(mockArticles)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        where: { status: 'PUBLISHED' },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should handle pagination', async () => {
      mockPrisma.article.findMany.mockResolvedValue([mockArticles[0]])
      mockPrisma.article.count.mockResolvedValue(2)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/articles?page=2&limit=1',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(2)
      expect(data.limit).toBe(1)

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        where: { status: 'PUBLISHED' },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: 1,
        take: 1,
      })
    })

    it('should filter by category', async () => {
      mockPrisma.article.findMany.mockResolvedValue([mockArticles[0]])
      mockPrisma.article.count.mockResolvedValue(1)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/articles?category=development',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          category: { slug: 'development' },
        },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should filter by tags', async () => {
      mockPrisma.article.findMany.mockResolvedValue([mockArticles[0]])
      mockPrisma.article.count.mockResolvedValue(1)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/articles?tags=react,testing',
      })

      const response = await GET(req)

      expect(response.status).toBe(200)
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PUBLISHED',
          tags: {
            some: {
              slug: { in: ['react', 'testing'] },
            },
          },
        },
        include: {
          author: { select: { name: true, avatar: true } },
          category: { select: { name: true, slug: true } },
          tags: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should handle database errors', async () => {
      mockPrisma.article.findMany.mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/articles',
      })

      const response = await GET(req)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch articles')
    })

    it('should validate pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/articles?page=-1&limit=0',
      })

      const response = await GET(req)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid pagination parameters')
    })

    it('should limit maximum page size', async () => {
      mockPrisma.article.findMany.mockResolvedValue(mockArticles)
      mockPrisma.article.count.mockResolvedValue(2)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/articles?limit=1000',
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.limit).toBe(50) // Should be capped at maximum

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      )
    })
  })
})