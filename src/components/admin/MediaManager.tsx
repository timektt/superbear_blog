'use client'

import React, { useState, useCallback } from 'react'
import { MediaGallery } from './MediaGallery'
import { MediaDetails } from './MediaDetails'
import { MediaSearch } from './MediaSearch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ImageIcon,
  UploadIcon,
  TrashIcon,
  DownloadIcon,
  XIcon,
  FolderIcon
} from 'lucide-react'
import { DateRange } from '@/components/ui/date-range-picker'

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

interface MediaSearchFilters {
  search: string
  format: string
  dateRange: DateRange | undefined
  minSize: number | undefined
  maxSize: number | undefined
  usageStatus: 'all' | 'used' | 'orphaned'
  sortBy: 'uploadedAt' | 'filename' | 'size'
  sortOrder: 'asc' | 'desc'
}

interface MediaManagerProps {
  className?: string
}

export function MediaManager({ className }: MediaManagerProps) {
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [filters, setFilters] = useState<MediaSearchFilters>({
    search: '',
    format: '',
    dateRange: undefined,
    minSize: undefined,
    maxSize: undefined,
    usageStatus: 'all',
    sortBy: 'uploadedAt',
    sortOrder: 'desc'
  })

  // Handle file selection
  const handleFileClick = useCallback((file: MediaFile) => {
    setSelectedFile(file)
    setShowDetails(true)
  }, [])

  // Handle file deletion
  const handleFileDelete = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/admin/media/${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete media file')
      }

      // Remove from selected files if it was selected
      setSelectedIds(prev => prev.filter(id => id !== fileId))
      
      // Close details if this file was being viewed
      if (selectedFile?.id === fileId) {
        setShowDetails(false)
        setSelectedFile(null)
      }

      // Refresh the gallery by updating filters (triggers re-fetch)
      setFilters(prev => ({ ...prev }))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete media file')
    }
  }, [selectedFile])

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return

    const orphanedIds = selectedIds // In a real implementation, you'd filter for orphaned files
    
    if (orphanedIds.length === 0) {
      alert('Only unused files can be deleted. Please select unused files only.')
      return
    }

    if (!confirm(`Are you sure you want to delete ${orphanedIds.length} unused files? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/media/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileIds: orphanedIds })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete media files')
      }

      // Clear selection and refresh
      setSelectedIds([])
      setFilters(prev => ({ ...prev }))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete media files')
    }
  }, [selectedIds])

  // Handle bulk download
  const handleBulkDownload = useCallback(() => {
    if (selectedIds.length === 0) return

    // In a real implementation, you'd create a zip file or download individual files
    alert(`Bulk download of ${selectedIds.length} files would be implemented here.`)
  }, [selectedIds])

  // Handle filters reset
  const handleFiltersReset = useCallback(() => {
    setFilters({
      search: '',
      format: '',
      dateRange: undefined,
      minSize: undefined,
      maxSize: undefined,
      usageStatus: 'all',
      sortBy: 'uploadedAt',
      sortOrder: 'desc'
    })
  }, [])

  // Handle close details
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false)
    setSelectedFile(null)
  }, [])

  // Convert filters to gallery props
  const getGalleryFilters = () => {
    return {
      searchQuery: filters.search,
      formatFilter: filters.format,
      dateFromFilter: filters.dateRange?.from?.toISOString().split('T')[0] || '',
      dateToFilter: filters.dateRange?.to?.toISOString().split('T')[0] || '',
      minSizeFilter: filters.minSize,
      maxSizeFilter: filters.maxSize,
      usageStatusFilter: filters.usageStatus,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Manager</h1>
          <p className="text-gray-600 mt-1">
            Manage your uploaded media files, track usage, and clean up unused files
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
          <Button variant="outline">
            <FolderIcon className="w-4 h-4 mr-2" />
            Organize
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <MediaSearch
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleFiltersReset}
      />

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedIds.length} files selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDownload}
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete Unused
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                <XIcon className="w-4 h-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Gallery */}
        <div className={cn(
          "transition-all duration-300",
          showDetails ? "lg:col-span-2" : "lg:col-span-3"
        )}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Media Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MediaGallery
                {...getGalleryFilters()}
                onSelectionChange={setSelectedIds}
                onFileClick={handleFileClick}
                onFileDelete={handleFileDelete}
              />
            </CardContent>
          </Card>
        </div>

        {/* Media Details Panel */}
        {showDetails && selectedFile && (
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <MediaDetails
                  fileId={selectedFile.id}
                  onClose={handleCloseDetails}
                  onDelete={handleFileDelete}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}