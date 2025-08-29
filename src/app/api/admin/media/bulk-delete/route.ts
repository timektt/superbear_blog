import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const BulkDeleteSchema = z.object({
  mediaIds: z.array(z.string()).min(1).max(100), // Limit to 100 items per batch
  force: z.boolean().optional().default(false) // Force delete even if referenced
})

interface DeleteResult {
  id: string
  success: boolean
  error?: string
  referenceCount?: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { mediaIds, force } = BulkDeleteSchema.parse(body)

    // Get all media files with their reference counts
    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        id: { in: mediaIds }
      },
      include: {
        _count: {
          select: {
            references: true
          }
        }
      }
    })

    const results: DeleteResult[] = []
    const deletedIds: string[] = []
    const skippedIds: string[] = []

    // Process each media file
    for (const mediaFile of mediaFiles) {
      const result: DeleteResult = {
        id: mediaFile.id,
        success: false
      }

      // Check if file has references
      if (mediaFile._count.references > 0 && !force) {
        result.error = 'File is still referenced and cannot be deleted'
        result.referenceCount = mediaFile._count.references
        skippedIds.push(mediaFile.id)
      } else {
        try {
          // If force delete, remove references first
          if (force && mediaFile._count.references > 0) {
            await prisma.mediaReference.deleteMany({
              where: {
                mediaId: mediaFile.id
              }
            })
          }

          // Delete the media file
          await prisma.mediaFile.delete({
            where: { id: mediaFile.id }
          })

          result.success = true
          deletedIds.push(mediaFile.id)
        } catch (error) {
          console.error(`Error deleting media file ${mediaFile.id}:`, error)
          result.error = 'Failed to delete file from database'
          skippedIds.push(mediaFile.id)
        }
      }

      results.push(result)
    }

    // Handle media IDs that weren't found
    const foundIds = mediaFiles.map(f => f.id)
    const notFoundIds = mediaIds.filter(id => !foundIds.includes(id))
    
    for (const id of notFoundIds) {
      results.push({
        id,
        success: false,
        error: 'Media file not found'
      })
    }

    const summary = {
      total: mediaIds.length,
      deleted: deletedIds.length,
      skipped: skippedIds.length,
      notFound: notFoundIds.length,
      errors: results.filter(r => !r.success && r.error !== 'Media file not found').length
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary,
        deletedIds,
        skippedIds,
        notFoundIds
      }
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process bulk delete operation' },
      { status: 500 }
    )
  }
}