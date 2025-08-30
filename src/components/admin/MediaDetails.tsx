'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  XIcon,
  DownloadIcon,
  ExternalLinkIcon,
  CalendarIcon,
  HardDriveIcon,
  ImageIcon,
  FileIcon,
  UserIcon,
  FolderIcon,
  TagIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  EditIcon,
  TrashIcon
} from 'lucide-react'

interface ContentReference {
  id: string
  contentType: string
  contentId: string
  referenceContext: string
  createdAt: string
  content: {
    id: string
    title: string
    slug: string
    status: string
    publishedAt?: string
    updatedAt: string
    url: string
    type: string
  } | null
}

interface MediaUsage {
  statistics: {
    totalReferences: number
    referencesByType: {
      article: number
      newsletter: number
      podcast: number
    }
    referencesByContext: {
      content: number
      cover_image: number
      thumbnail: number
    }
    isOrphaned: boolean
    lastUsed: number | null
  }
  references: ContentReference[]
}

interface MediaFileDetails {
  id: string
  publicId: string
  url: string
  filename: string
  originalFilename?: string
  size: number
  width?: number
  height?: number
  format: string
  folder: string
  uploadedAt: string
  uploadedBy?: string
  createdAt: string
  updatedAt: string
  metadata?: any
  usage: MediaUsage
}

interface MediaDetailsProps {
  fileId: string
  onClose?: () => void
  onDelete?: (fileId: string) => void
  onEdit?: (fileId: string) => void
  className?: string
}

export function MediaDetails({
  fileId,
  onClose,
  onDelete,
  onEdit,
  className
}: MediaDetailsProps) {
  const [file, setFile] = useState<MediaFileDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format relative date
  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  // Fetch file details
  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/media/${fileId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch media details')
        }

        const result = await response.json()
        
        if (result.success) {
          setFile(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch media details')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (fileId) {
      fetchFileDetails()
    }
  }, [fileId])

  // Handle delete
  const handleDelete = async () => {
    if (!file || deleting) return

    if (!confirm('Are you sure you want to delete this media file? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      
      const response = await fetch(`/api/admin/media/${file.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete media file')
      }

      onDelete?.(file.id)
      onClose?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete media file')
    } finally {
      setDeleting(false)
    }
  }

  // Render file preview
  const renderPreview = (file: MediaFileDetails) => {
    const isImage = file.format.toLowerCase().match(/^(jpg|jpeg|png|gif|webp|svg)$/)
    
    if (isImage && file.url) {
      return (
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={file.url}
            alt={file.filename}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )
    }

    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <FileIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Preview not available</p>
          <p className="text-xs text-gray-500 uppercase">{file.format} file</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="w-full h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <AlertTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Failed to load media details</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Media Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            {file.originalFilename || file.filename}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(file.url, '_blank')}
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(file.id)}
            >
              <EditIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {file.usage.statistics.isOrphaned && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      <Card>
        <CardContent className="p-6">
          {renderPreview(file)}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              File Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Filename</label>
                <p className="text-sm text-gray-900 break-all">{file.filename}</p>
              </div>
              {file.originalFilename && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Original Name</label>
                  <p className="text-sm text-gray-900 break-all">{file.originalFilename}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Format</label>
                <p className="text-sm text-gray-900 uppercase">{file.format}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Size</label>
                <p className="text-sm text-gray-900">{formatFileSize(file.size)}</p>
              </div>
            </div>

            {file.width && file.height && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Dimensions</label>
                  <p className="text-sm text-gray-900">{file.width} × {file.height}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Aspect Ratio</label>
                  <p className="text-sm text-gray-900">
                    {(file.width / file.height).toFixed(2)}:1
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Public ID</label>
                <p className="text-sm text-gray-900 font-mono break-all">{file.publicId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Folder</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <FolderIcon className="w-4 h-4 mr-1" />
                  {file.folder}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Uploaded</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {formatRelativeDate(file.uploadedAt)}
                </p>
                <p className="text-xs text-gray-500">{formatDate(file.uploadedAt)}</p>
              </div>
              {file.uploadedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Uploaded By</label>
                  <p className="text-sm text-gray-900 flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    {file.uploadedBy}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">URL</label>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-900 font-mono break-all flex-1">{file.url}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(file.url)}
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TagIcon className="w-5 h-5 mr-2" />
              Usage Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Usage Status */}
            <div className="flex items-center space-x-2">
              {file.usage.statistics.isOrphaned ? (
                <>
                  <AlertTriangleIcon className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">Unused File</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Used in {file.usage.statistics.totalReferences} places
                  </span>
                </>
              )}
            </div>

            {/* Usage Statistics */}
            {!file.usage.statistics.isOrphaned && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Usage by Content Type</label>
                  <div className="mt-1 space-y-1">
                    {file.usage.statistics.referencesByType.article > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Articles</span>
                        <span className="font-medium">{file.usage.statistics.referencesByType.article}</span>
                      </div>
                    )}
                    {file.usage.statistics.referencesByType.newsletter > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Newsletters</span>
                        <span className="font-medium">{file.usage.statistics.referencesByType.newsletter}</span>
                      </div>
                    )}
                    {file.usage.statistics.referencesByType.podcast > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Podcasts</span>
                        <span className="font-medium">{file.usage.statistics.referencesByType.podcast}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Usage by Context</label>
                  <div className="mt-1 space-y-1">
                    {file.usage.statistics.referencesByContext.content > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>In Content</span>
                        <span className="font-medium">{file.usage.statistics.referencesByContext.content}</span>
                      </div>
                    )}
                    {file.usage.statistics.referencesByContext.cover_image > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Cover Images</span>
                        <span className="font-medium">{file.usage.statistics.referencesByContext.cover_image}</span>
                      </div>
                    )}
                    {file.usage.statistics.referencesByContext.thumbnail > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Thumbnails</span>
                        <span className="font-medium">{file.usage.statistics.referencesByContext.thumbnail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {file.usage.statistics.lastUsed && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Used</label>
                    <p className="text-sm text-gray-900">
                      {formatRelativeDate(new Date(file.usage.statistics.lastUsed).toISOString())}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Details */}
      {!file.usage.statistics.isOrphaned && file.usage.references.length > 0 && (
        <UsageViewer usage={file.usage} />
      )}
    </div>
  )
}

// Usage Viewer Component
interface UsageViewerProps {
  usage: MediaUsage
  className?: string
}

export function UsageViewer({ usage, className }: UsageViewerProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getContextLabel = (context: string) => {
    switch (context) {
      case 'cover_image':
        return 'Cover Image'
      case 'thumbnail':
        return 'Thumbnail'
      case 'content':
        return 'Content'
      default:
        return context
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <EyeIcon className="w-5 h-5 mr-2" />
          Where This Media Is Used ({usage.statistics.totalReferences})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {usage.references.map((reference) => (
            <div
              key={reference.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">
                    {reference.content?.title || 'Unknown Content'}
                  </h4>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getStatusColor(reference.content?.status || 'unknown')
                  )}>
                    {reference.content?.status || 'Unknown'}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {getContextLabel(reference.referenceContext)}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span className="capitalize">{reference.content?.type || reference.contentType}</span>
                  <span>•</span>
                  <span>Added {formatDate(reference.createdAt)}</span>
                  {reference.content?.publishedAt && (
                    <>
                      <span>•</span>
                      <span>Published {formatDate(reference.content.publishedAt)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {reference.content?.url && (
                  <Link href={reference.content.url} target="_blank">
                    <Button variant="ghost" size="sm">
                      <ExternalLinkIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}