'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { cn } from '@/lib/utils'
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  CalendarIcon,
  HardDriveIcon,
  ImageIcon,
  SortAscIcon,
  SortDescIcon,
  RefreshCwIcon
} from 'lucide-react'
import { DateRange } from '@/components/ui/date-range-picker'

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

interface MediaSearchProps {
  filters: MediaSearchFilters
  onFiltersChange: (filters: MediaSearchFilters) => void
  onReset?: () => void
  className?: string
}

const FILE_FORMATS = [
  { value: '', label: 'All Formats' },
  { value: 'jpg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'gif', label: 'GIF' },
  { value: 'webp', label: 'WebP' },
  { value: 'svg', label: 'SVG' },
  { value: 'pdf', label: 'PDF' },
  { value: 'mp4', label: 'MP4' },
  { value: 'mov', label: 'MOV' },
  { value: 'avi', label: 'AVI' }
]

const USAGE_STATUS_OPTIONS = [
  { value: 'all', label: 'All Files' },
  { value: 'used', label: 'Used Files' },
  { value: 'orphaned', label: 'Unused Files' }
]

const SORT_OPTIONS = [
  { value: 'uploadedAt', label: 'Upload Date' },
  { value: 'filename', label: 'Filename' },
  { value: 'size', label: 'File Size' }
]

const SIZE_PRESETS = [
  { label: 'Any Size', min: undefined, max: undefined },
  { label: 'Small (< 1MB)', min: undefined, max: 1024 * 1024 },
  { label: 'Medium (1-10MB)', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { label: 'Large (> 10MB)', min: 10 * 1024 * 1024, max: undefined }
]

export function MediaSearch({
  filters,
  onFiltersChange,
  onReset,
  className
}: MediaSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customSizeMode, setCustomSizeMode] = useState(false)
  const [minSizeInput, setMinSizeInput] = useState('')
  const [maxSizeInput, setMaxSizeInput] = useState('')

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Parse file size input (supports KB, MB, GB)
  const parseFileSize = (input: string): number | undefined => {
    if (!input.trim()) return undefined
    
    const match = input.trim().match(/^(\d+(?:\.\d+)?)\s*(bytes?|kb|mb|gb)?$/i)
    if (!match) return undefined

    const value = parseFloat(match[1])
    const unit = (match[2] || 'bytes').toLowerCase()

    switch (unit) {
      case 'kb':
        return value * 1024
      case 'mb':
        return value * 1024 * 1024
      case 'gb':
        return value * 1024 * 1024 * 1024
      default:
        return value
    }
  }

  // Update filters
  const updateFilters = useCallback((updates: Partial<MediaSearchFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }, [filters, onFiltersChange])

  // Handle search input
  const handleSearchChange = (value: string) => {
    updateFilters({ search: value })
  }

  // Handle format change
  const handleFormatChange = (value: string) => {
    updateFilters({ format: value })
  }

  // Handle date range change
  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    updateFilters({ dateRange })
  }

  // Handle usage status change
  const handleUsageStatusChange = (value: 'all' | 'used' | 'orphaned') => {
    updateFilters({ usageStatus: value })
  }

  // Handle sort change
  const handleSortChange = (sortBy: 'uploadedAt' | 'filename' | 'size') => {
    updateFilters({ sortBy })
  }

  // Handle sort order toggle
  const handleSortOrderToggle = () => {
    updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
  }

  // Handle size preset change
  const handleSizePresetChange = (preset: typeof SIZE_PRESETS[0]) => {
    setCustomSizeMode(false)
    updateFilters({ minSize: preset.min, maxSize: preset.max })
  }

  // Handle custom size change
  const handleCustomSizeChange = () => {
    const minSize = parseFileSize(minSizeInput)
    const maxSize = parseFileSize(maxSizeInput)
    updateFilters({ minSize, maxSize })
  }

  // Handle reset
  const handleReset = () => {
    setShowAdvanced(false)
    setCustomSizeMode(false)
    setMinSizeInput('')
    setMaxSizeInput('')
    onReset?.()
  }

  // Check if any filters are active
  const hasActiveFilters = 
    filters.search ||
    filters.format ||
    filters.dateRange ||
    filters.minSize !== undefined ||
    filters.maxSize !== undefined ||
    filters.usageStatus !== 'all'

  // Update size inputs when filters change externally
  useEffect(() => {
    if (filters.minSize !== undefined) {
      setMinSizeInput(formatFileSize(filters.minSize))
    } else {
      setMinSizeInput('')
    }

    if (filters.maxSize !== undefined) {
      setMaxSizeInput(formatFileSize(filters.maxSize))
    } else {
      setMaxSizeInput('')
    }
  }, [filters.minSize, filters.maxSize])

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <SearchIcon className="w-5 h-5 mr-2" />
            Search & Filter Media
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by filename..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Filter */}
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <Select value={filters.format} onValueChange={handleFormatChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                {FILE_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Usage Status Filter */}
          <Select value={filters.usageStatus} onValueChange={handleUsageStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Usage Status" />
            </SelectTrigger>
            <SelectContent>
              {USAGE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Controls */}
          <div className="flex items-center space-x-1">
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSortOrderToggle}
              className="px-2"
            >
              {filters.sortOrder === 'asc' ? (
                <SortAscIcon className="w-4 h-4" />
              ) : (
                <SortDescIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Upload Date Range
              </label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={handleDateRangeChange}
                className="w-full"
              />
            </div>

            {/* File Size Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                File Size
              </label>
              
              {!customSizeMode ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {SIZE_PRESETS.map((preset, index) => {
                      const isActive = 
                        filters.minSize === preset.min && 
                        filters.maxSize === preset.max
                      
                      return (
                        <Button
                          key={index}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSizePresetChange(preset)}
                          className="text-xs"
                        >
                          {preset.label}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomSizeMode(true)}
                    className="text-xs"
                  >
                    Custom Size Range
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Min Size</label>
                      <Input
                        placeholder="e.g., 1MB"
                        value={minSizeInput}
                        onChange={(e) => setMinSizeInput(e.target.value)}
                        onBlur={handleCustomSizeChange}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Max Size</label>
                      <Input
                        placeholder="e.g., 10MB"
                        value={maxSizeInput}
                        onChange={(e) => setMaxSizeInput(e.target.value)}
                        onBlur={handleCustomSizeChange}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Supports: bytes, KB, MB, GB (e.g., "5MB", "1.5GB")
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomSizeMode(false)}
                      className="text-xs"
                    >
                      Use Presets
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs"
              >
                <XIcon className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  <SearchIcon className="w-3 h-3 mr-1" />
                  Search: "{filters.search}&quot;
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {filters.format && (
                <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Format: {filters.format.toUpperCase()}
                  <button
                    onClick={() => handleFormatChange('')}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              {filters.usageStatus !== 'all' && (
                <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  Status: {USAGE_STATUS_OPTIONS.find(o => o.value === filters.usageStatus)?.label}
                  <button
                    onClick={() => handleUsageStatusChange('all')}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              {filters.dateRange && (
                <div className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  Date Range
                  <button
                    onClick={() => handleDateRangeChange(undefined)}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              {(filters.minSize !== undefined || filters.maxSize !== undefined) && (
                <div className="flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                  <HardDriveIcon className="w-3 h-3 mr-1" />
                  Size: {filters.minSize ? formatFileSize(filters.minSize) : '0'} - {filters.maxSize ? formatFileSize(filters.maxSize) : '∞'}
                  <button
                    onClick={() => updateFilters({ minSize: undefined, maxSize: undefined })}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}