import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const BulkOperationSchema = z.object({
  operation: z.enum(['move', 'tag', 'update-metadata']),
  mediaIds: z.array(z.string()).min(1).max(100),
  data: z.record(z.any()) // Flexible data object for different operations
})

const MoveOperationSchema = z.object({
  folder: z.string().min(1)
})

const TagOperationSchema = z.object({
  tags: z.array(z.string()),
  action: z.enum(['add', 'remove', 'replace']).default('add')
})

const MetadataOperationSchema = z.object({
  metadata: z.record(z.any()),
  action: z.enum(['merge', 'replace']).default('merge')
})

interface OperationResult {
  id: string
  success: boolean
  error?: string
  updated?: any
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
    const { operation, mediaIds, data } = BulkOperationSchema.parse(body)

    // Validate operation-specific data
    let operationData: any
    switch (operation) {
      case 'move':
        operationData = MoveOperationSchema.parse(data)
        break
      case 'tag':
        operationData = TagOperationSchema.parse(data)
        break
      case 'update-metadata':
        operationData = MetadataOperationSchema.parse(data)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        )
    }

    // Get all media files
    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        id: { in: mediaIds }
      }
    })

    const results: OperationResult[] = []
    const updatedIds: string[] = []

    // Process each media file based on operation type
    for (const mediaFile of mediaFiles) {
      const result: OperationResult = {
        id: mediaFile.id,
        success: false
      }

      try {
        let updateData: any = {}

        switch (operation) {
          case 'move':
            updateData.folder = operationData.folder
            break

          case 'tag':
            // Handle tagging operations
            const currentMetadata = (mediaFile.metadata as any) || {}
            const currentTags = currentMetadata.tags || []
            
            let newTags: string[]
            switch (operationData.action) {
              case 'add':
                newTags = [...new Set([...currentTags, ...operationData.tags])]
                break
              case 'remove':
                newTags = currentTags.filter((tag: string) => !operationData.tags.includes(tag))
                break
              case 'replace':
                newTags = operationData.tags
                break
              default:
                newTags = currentTags
            }

            updateData.metadata = {
              ...currentMetadata,
              tags: newTags
            }
            break

          case 'update-metadata':
            const existingMetadata = (mediaFile.metadata as any) || {}
            
            if (operationData.action === 'merge') {
              updateData.metadata = {
                ...existingMetadata,
                ...operationData.metadata
              }
            } else {
              updateData.metadata = operationData.metadata
            }
            break
        }

        // Update the media file
        const updatedFile = await prisma.mediaFile.update({
          where: { id: mediaFile.id },
          data: {
            ...updateData,
            updatedAt: new Date()
          }
        })

        result.success = true
        result.updated = {
          folder: updatedFile.folder,
          metadata: updatedFile.metadata,
          updatedAt: updatedFile.updatedAt
        }
        updatedIds.push(mediaFile.id)

      } catch (error) {
        console.error(`Error updating media file ${mediaFile.id}:`, error)
        result.error = 'Failed to update media file'
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
      updated: updatedIds.length,
      failed: results.filter(r => !r.success && r.error !== 'Media file not found').length,
      notFound: notFoundIds.length
    }

    return NextResponse.json({
      success: true,
      data: {
        operation,
        results,
        summary,
        updatedIds,
        notFoundIds
      }
    })

  } catch (error) {
    console.error('Bulk operations error:', error)
    
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
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    )
  }
}

// GET endpoint to check operation progress (for future batch processing)
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
    const operationId = searchParams.get('operationId')

    if (!operationId) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      )
    }

    // For now, return a simple response
    // In the future, this could track actual background job progress
    return NextResponse.json({
      success: true,
      data: {
        operationId,
        status: 'completed',
        message: 'Bulk operations are processed synchronously'
      }
    })

  } catch (error) {
    console.error('Bulk operations status error:', error)
    return NextResponse.json(
      { error: 'Failed to get operation status' },
      { status: 500 }
    )
  }
}