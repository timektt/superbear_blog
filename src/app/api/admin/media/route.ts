import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const MediaListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  format: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minSize: z.string().optional(),
  maxSize: z.string().optional(),
  usageStatus: z.enum(['all', 'used', 'orphaned']).optional().default('all'),
  sortBy: z.enum(['uploadedAt', 'filename', 'size']).optional().default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = MediaListQuerySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(query.page)
    const limit = Math.min(parseInt(query.limit), 100) // Cap at 100 items per page
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Search functionality
    if (query.search) {
      where.OR = [
        { filename: { contains: query.search, mode: 'insensitive' } },
        { originalFilename: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    // Format filter
    if (query.format) {
      where.format = { equals: query.format, mode: 'insensitive' }
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      where.uploadedAt = {}
      if (query.dateFrom) {
        where.uploadedAt.gte = new Date(query.dateFrom)
      }
      if (query.dateTo) {
        where.uploadedAt.lte = new Date(query.dateTo)
      }
    }

    // Size range filter
    if (query.minSize || query.maxSize) {
      where.size = {}
      if (query.minSize) {
        where.size.gte = parseInt(query.minSize)
      }
      if (query.maxSize) {
        where.size.lte = parseInt(query.maxSize)
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[query.sortBy] = query.sortOrder

    // Get media files with reference counts
    const [mediaFiles, totalCount] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              references: true
            }
          }
        }
      }),
      prisma.mediaFile.count({ where })
    ])

    // Filter by usage status if specified
    let filteredMediaFiles = mediaFiles
    if (query.usageStatus === 'used') {
      filteredMediaFiles = mediaFiles.filter(file => file._count.references > 0)
    } else if (query.usageStatus === 'orphaned') {
      filteredMediaFiles = mediaFiles.filter(file => file._count.references === 0)
    }

    // Format response for media gallery
    const formattedFiles = filteredMediaFiles.map(file => ({
      id: file.id,
      publicId: file.publicId,
      url: file.url,
      filename: file.filename,
      originalFilename: file.originalFilename,
      size: file.size,
      width: file.width,
      height: file.height,
      format: file.format,
      folder: file.folder,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy,
      referenceCount: file._count.references,
      isOrphaned: file._count.references === 0,
      metadata: file.metadata
    }))

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        files: formattedFiles,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          search: query.search,
          format: query.format,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          minSize: query.minSize,
          maxSize: query.maxSize,
          usageStatus: query.usageStatus,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder
        }
      }
    })

  } catch (error) {
    console.error('Media listing error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    )
  }
}