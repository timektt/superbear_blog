import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { 
  mediaSecurityManager, 
  getMediaOperationFromRequest,
  requireMediaPermission,
  type UserRole 
} from '@/lib/media/media-security'
import { mediaCSRFProtection } from '@/lib/media/csrf-protection'
import { mediaQueryOptimizer } from '@/lib/media/query-optimizer'
import { mediaCache } from '@/lib/media/media-cache'

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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = session.user.role as UserRole
    const userId = session.user.id

    // Check permissions for media viewing
    const hasPermission = requireMediaPermission('media:view')(userRole)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view media' },
        { status: 403 }
      )
    }

    // Apply rate limiting
    const operation = getMediaOperationFromRequest(request.nextUrl.pathname, request.method)
    const rateLimitResult = await mediaSecurityManager.checkRateLimit(request, operation)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '300'
          }
        }
      )
    }

    // Log the operation for audit
    await mediaSecurityManager.logMediaOperation(
      request,
      {
        userRole,
        userId,
        operation,
        metadata: { action: 'list_media' }
      },
      true
    )

    const { searchParams } = new URL(request.url)
    const query = MediaListQuerySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(query.page)
    const limit = Math.min(parseInt(query.limit), 100) // Cap at 100 items per page

    // Use optimized query with caching
    const filters = {
      format: query.format ? [query.format] : undefined,
      uploadedAfter: query.dateFrom ? new Date(query.dateFrom) : undefined,
      uploadedBefore: query.dateTo ? new Date(query.dateTo) : undefined,
      sizeMin: query.minSize ? parseInt(query.minSize) : undefined,
      sizeMax: query.maxSize ? parseInt(query.maxSize) : undefined,
      hasReferences: query.usageStatus === 'used' ? true : 
                    query.usageStatus === 'orphaned' ? false : undefined,
    }

    let result
    if (query.search) {
      // Use search with facets
      result = await mediaQueryOptimizer.searchMedia(query.search, {
        page,
        pageSize: limit,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
        filters,
      })
    } else {
      // Use regular list query
      result = await mediaQueryOptimizer.getMediaList({
        page,
        pageSize: limit,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
        filters,
      })
    }

    // Format response for media gallery
    const formattedFiles = result.items.map(file => ({
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
      referenceCount: file.references?.length || 0,
      isOrphaned: !file.references || file.references.length === 0,
      metadata: file.metadata
    }))

    const totalPages = Math.ceil(result.totalCount / limit)
    const hasNextPage = result.hasMore
    const hasPrevPage = page > 1

    const response = {
      success: true,
      data: {
        files: formattedFiles,
        pagination: {
          page,
          limit,
          totalCount: result.totalCount,
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
        },
        fromCache: result.fromCache
      }
    }

    // Add facets for search results
    if ('facets' in result) {
      response.data.facets = result.facets
    }

    return NextResponse.json(response)

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