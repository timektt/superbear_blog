import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get media file with detailed information
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      include: {
        references: {
          include: {
            // We'll need to join with actual content tables based on contentType
            // For now, we'll get the reference data and fetch content separately
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    // Get detailed usage information by fetching actual content
    const usageDetails = await Promise.all(
      mediaFile.references.map(async (ref) => {
        let contentDetails = null

        try {
          switch (ref.contentType) {
            case 'article':
              const article = await prisma.article.findUnique({
                where: { id: ref.contentId },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  status: true,
                  publishedAt: true,
                  updatedAt: true
                }
              })
              contentDetails = article ? {
                ...article,
                url: `/news/${article.slug}`,
                type: 'Article'
              } : null
              break

            case 'newsletter':
              const newsletter = await prisma.newsletterIssue.findUnique({
                where: { id: ref.contentId },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  status: true,
                  publishedAt: true,
                  updatedAt: true
                }
              })
              contentDetails = newsletter ? {
                ...newsletter,
                url: `/newsletter/${newsletter.slug}`,
                type: 'Newsletter'
              } : null
              break

            case 'podcast':
              const podcast = await prisma.podcast.findUnique({
                where: { id: ref.contentId },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  status: true,
                  publishedAt: true,
                  updatedAt: true
                }
              })
              contentDetails = podcast ? {
                ...podcast,
                url: `/podcasts/${podcast.slug}`,
                type: 'Podcast'
              } : null
              break
          }
        } catch (error) {
          console.error(`Error fetching ${ref.contentType} details:`, error)
        }

        return {
          id: ref.id,
          contentType: ref.contentType,
          contentId: ref.contentId,
          referenceContext: ref.referenceContext,
          createdAt: ref.createdAt,
          content: contentDetails
        }
      })
    )

    // Filter out references where content no longer exists
    const validUsageDetails = usageDetails.filter(usage => usage.content !== null)

    // Calculate statistics
    const stats = {
      totalReferences: validUsageDetails.length,
      referencesByType: {
        article: validUsageDetails.filter(u => u.contentType === 'article').length,
        newsletter: validUsageDetails.filter(u => u.contentType === 'newsletter').length,
        podcast: validUsageDetails.filter(u => u.contentType === 'podcast').length
      },
      referencesByContext: {
        content: validUsageDetails.filter(u => u.referenceContext === 'content').length,
        cover_image: validUsageDetails.filter(u => u.referenceContext === 'cover_image').length,
        thumbnail: validUsageDetails.filter(u => u.referenceContext === 'thumbnail').length
      },
      isOrphaned: validUsageDetails.length === 0,
      lastUsed: validUsageDetails.length > 0 
        ? Math.max(...validUsageDetails.map(u => new Date(u.createdAt).getTime()))
        : null
    }

    // Format detailed response
    const response = {
      id: mediaFile.id,
      publicId: mediaFile.publicId,
      url: mediaFile.url,
      filename: mediaFile.filename,
      originalFilename: mediaFile.originalFilename,
      size: mediaFile.size,
      width: mediaFile.width,
      height: mediaFile.height,
      format: mediaFile.format,
      folder: mediaFile.folder,
      uploadedAt: mediaFile.uploadedAt,
      uploadedBy: mediaFile.uploadedBy,
      createdAt: mediaFile.createdAt,
      updatedAt: mediaFile.updatedAt,
      metadata: mediaFile.metadata,
      usage: {
        statistics: stats,
        references: validUsageDetails
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Media details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media details' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if media file exists and get reference count
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            references: true
          }
        }
      }
    })

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if file is still referenced
    if (mediaFile._count.references > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete media file that is still in use',
          details: {
            referenceCount: mediaFile._count.references,
            message: 'Remove all references to this media file before deleting'
          }
        },
        { status: 409 }
      )
    }

    // Delete from database (this will also delete from Cloudinary via cleanup service)
    await prisma.mediaFile.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully'
    })

  } catch (error) {
    console.error('Media deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    )
  }
}