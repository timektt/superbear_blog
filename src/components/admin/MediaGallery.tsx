'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { 
  CheckIcon, 
  DownloadIcon, 
  EyeIcon, 
  TrashIcon,
  ImageIcon,
  FileIcon,
  CalendarIcon,
  HardDriveIcon
} from 'lucide-react'

interface MediaFile {
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
  referenceCount: number
  isOrphaned: boolean
  metadata?: any
}

interface MediaGalleryProps {
  searchQuery?: string
  formatFilter?: string
  dateFromFilter?: string
  dateToFilter?: string
  minSizeFilter?: number
  maxSizeFilter?: number
  usageStatusFilter?: 'all' | 'used' | 'orphaned'
  sortBy?: 'uploadedAt' | 'filename' | 'size'
  sortOrder?: 'asc' | 'desc'
  onSelectionChange?: (selectedIds: string[]) => void
  onFileClick?: (file: MediaFile) => void
  onFileDelete?: (fileId: string) => void
  className?: string
}

export function MediaGallery({
  searchQuery = '',
  formatFilter = '',
  dateFromFilter = '',
  dateToFilter = '',
  minSizeFilter,
  maxSizeFilter,
  usageStatusFilter = 'all',
  sortBy = 'uploadedAt',
  sortOrder = 'desc',
  onSelectionChange,
  onFileClick,
  onFileDelete,
  className
}: MediaGalleryProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hasNextPage, setHasNextPage] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Build query parameters
  const buildQueryParams = (page: number = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      sortBy,
      sortOrder,
      usageStatus: usageStatusFilter
    })

    if (searchQuery) params.set('search', searchQuery)
    if (formatFilter) params.set('format', formatFilter)
    if (dateFromFilter) params.set('dateFrom', dateFromFilter)
    if (dateToFilter) params.set('dateTo', dateToFilter)
    if (minSizeFilter) params.set('minSize', minSizeFilter.toString())
    if (maxSizeFilter) params.set('maxSize', maxSizeFilter.toString())

    return params.toString()
  }

  // Fetch media files
  const fetchFiles = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const queryParams = buildQueryParams(page)
      const response = await fetch(`/api/admin/media?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch media files')
      }

      const result = await response.json()
      
      if (result.success) {
        const newFiles = result.data.files
        setFiles(prev => append ? [...prev, ...newFiles] : newFiles)
        setHasNextPage(result.data.pagination.hasNextPage)
        setCurrentPage(result.data.pagination.page)
      } else {
        throw new Error(result.error || 'Failed to fetch media files')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, formatFilter, dateFromFilter, dateToFilter, minSizeFilter, maxSizeFilter, usageStatusFilter, sortBy, sortOrder])

  // Load more files for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      fetchFiles(currentPage + 1, true)
    }
  }, [fetchFiles, loadingMore, hasNextPage, currentPage])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasNextPage, loadingMore, loadMore])

  // Fetch files when filters change
  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
    fetchFiles(1, false)
  }, [fetchFiles])

  // Handle selection changes
  const handleSelectionChange = (fileId: string, selected: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (selected) {
      newSelectedIds.add(fileId)
    } else {
      newSelectedIds.delete(fileId)
    }
    setSelectedIds(newSelectedIds)
    onSelectionChange?.(Array.from(newSelectedIds))
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set())
      onSelectionChange?.([])
    } else {
      const allIds = new Set(files.map(f => f.id))
      setSelectedIds(allIds)
      onSelectionChange?.(Array.from(allIds))
    }
  }

  // Handle file click
  const handleFileClick = (file: MediaFile, event: React.MouseEvent) => {
    // Prevent selection when clicking action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return
    }
    onFileClick?.(file)
  }

  // Handle file delete
  const handleFileDelete = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onFileDelete?.(fileId)
  }

  // Render file thumbnail
  const renderThumbnail = (file: MediaFile) => {
    const isImage = file.format.toLowerCase().match(/^(jpg|jpeg|png|gif|webp|svg)$/)
    
    if (isImage && file.url) {
      return (
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={file.url}
            alt={file.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
      )
    }

    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <FileIcon className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  if (loading && files.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-3">
                <Skeleton className="w-full h-32 mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Failed to load media files</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchFiles(1, false)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No media files found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection controls */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedIds.size === files.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedIds.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {files.length} files
          </div>
        </div>
      )}

      {/* Media grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {files.map((file) => {
          const isSelected = selectedIds.has(file.id)
          
          return (
            <Card
              key={file.id}
              className={cn(
                "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected && "ring-2 ring-blue-500 shadow-md"
              )}
              onClick={(e) => handleFileClick(file, e)}
            >
              <CardContent className="p-3">
                {/* Selection checkbox */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      isSelected 
                        ? "bg-blue-500 border-blue-500 text-white" 
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectionChange(file.id, !isSelected)
                    }}
                  >
                    {isSelected && <CheckIcon className="w-3 h-3" />}
                  </button>
                  
                  {/* Usage status indicator */}
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    file.isOrphaned 
                      ? "bg-orange-100 text-orange-800" 
                      : "bg-green-100 text-green-800"
                  )}>
                    {file.isOrphaned ? 'Unused' : `${file.referenceCount} refs`}
                  </div>
                </div>

                {/* Thumbnail */}
                {renderThumbnail(file)}

                {/* File info */}
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium truncate" title={file.filename}>
                    {file.originalFilename || file.filename}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span className="flex items-center">
                      <HardDriveIcon className="w-3 h-3 mr-1" />
                      {formatFileSize(file.size)}
                    </span>
                    <span>•</span>
                    <span className="uppercase">{file.format}</span>
                  </div>

                  {file.width && file.height && (
                    <div className="text-xs text-gray-500">
                      {file.width} × {file.height}
                    </div>
                  )}

                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {formatDate(file.uploadedAt)}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFileClick?.(file)
                    }}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(file.url, '_blank')
                    }}
                  >
                    <DownloadIcon className="w-4 h-4" />
                  </Button>

                  {file.isOrphaned && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleFileDelete(file.id, e)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-3">
                    <Skeleton className="w-full h-32 mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}