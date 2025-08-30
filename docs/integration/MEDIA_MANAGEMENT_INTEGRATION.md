# Media Management System Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Media Management System into your application components and workflows.

## Quick Start

### 1. Basic Upload Integration

The simplest way to add image upload to any component:

```typescript
import { useUploadService } from '@/lib/hooks/useUploadService'

export function MyComponent() {
  const { uploadImage, isUploading, progress, error } = useUploadService()
  
  const handleFileSelect = async (file: File) => {
    try {
      const result = await uploadImage(file, {
        folder: 'my-component',
        onProgress: (progress) => console.log(`${progress.percentage}% complete`)
      })
      
      console.log('Upload successful:', result.url)
    } catch (error) {
      console.error('Upload failed:', error.message)
    }
  }
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        disabled={isUploading}
      />
      {isUploading && <div>Uploading: {progress?.percentage}%</div>}
      {error && <div className="error">Error: {error}</div>}
    </div>
  )
}
```

### 2. TipTap Editor Integration

For rich text editors with drag-and-drop support:

```typescript
import { Editor } from '@tiptap/react'
import { useUploadService } from '@/lib/hooks/useUploadService'
import { useMediaTracking } from '@/lib/hooks/useMediaTracking'

export function RichTextEditor({ content, onChange }) {
  const { uploadImage } = useUploadService()
  const { extractReferences } = useMediaTracking()
  
  const editor = useEditor({
    extensions: [
      // ... your extensions
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      
      // Automatically track image references
      const references = extractReferences(html)
      console.log('Found image references:', references)
    }
  })
  
  // Handle drag and drop
  const handleDrop = async (event: DragEvent) => {
    const files = Array.from(event.dataTransfer?.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    for (const file of imageFiles) {
      try {
        const result = await uploadImage(file, { folder: 'editor' })
        editor?.chain().focus().setImage({ src: result.url }).run()
      } catch (error) {
        console.error('Failed to upload:', error)
      }
    }
  }
  
  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
```

### 3. Article Form Integration

Complete integration with content tracking:

```typescript
import { useMediaTracking } from '@/lib/hooks/useMediaTracking'
import { useUploadService } from '@/lib/hooks/useUploadService'

export function ArticleForm({ article, onSave }) {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    content: article?.content || '',
    coverImage: article?.coverImage || ''
  })
  
  const { uploadImage } = useUploadService()
  const { trackContentReferences, extractReferences } = useMediaTracking()
  
  const handleCoverImageUpload = async (file: File) => {
    try {
      const result = await uploadImage(file, { folder: 'covers' })
      setFormData(prev => ({ ...prev, coverImage: result.publicId }))
    } catch (error) {
      console.error('Cover upload failed:', error)
    }
  }
  
  const handleSave = async () => {
    try {
      // Save the article
      const savedArticle = await saveArticle(formData)
      
      // Track all media references
      const contentReferences = extractReferences(formData.content)
      const allReferences = formData.coverImage 
        ? [...contentReferences, formData.coverImage]
        : contentReferences
      
      await trackContentReferences(
        savedArticle.id,
        'article',
        allReferences
      )
      
      onSave(savedArticle)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }
  
  return (
    <form onSubmit={handleSave}>
      <input 
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Article title"
      />
      
      <div>
        <label>Cover Image:</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleCoverImageUpload(e.target.files[0])}
        />
        {formData.coverImage && (
          <img src={`/api/media/preview/${formData.coverImage}`} alt="Cover" />
        )}
      </div>
      
      <RichTextEditor 
        content={formData.content}
        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
      />
      
      <button type="submit">Save Article</button>
    </form>
  )
}
```

## Advanced Integration Patterns

### 1. Media Gallery Component

Build a reusable media browser:

```typescript
import { useState, useEffect } from 'react'
import { MediaFile, MediaFilters } from '@/types/media'

interface MediaGalleryProps {
  onSelect?: (media: MediaFile) => void
  multiSelect?: boolean
  filters?: Partial<MediaFilters>
}

export function MediaGallery({ onSelect, multiSelect = false, filters = {} }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [currentFilters, setCurrentFilters] = useState(filters)
  
  useEffect(() => {
    fetchMedia()
  }, [currentFilters])
  
  const fetchMedia = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(currentFilters as any)
      const response = await fetch(`/api/admin/media?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setMedia(data.data.media)
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSelect = (mediaFile: MediaFile) => {
    if (multiSelect) {
      setSelected(prev => 
        prev.includes(mediaFile.id) 
          ? prev.filter(id => id !== mediaFile.id)
          : [...prev, mediaFile.id]
      )
    } else {
      onSelect?.(mediaFile)
    }
  }
  
  const handleBulkDelete = async () => {
    if (!selected.length) return
    
    try {
      const response = await fetch('/api/admin/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaIds: selected })
      })
      
      const result = await response.json()
      if (result.success) {
        setMedia(prev => prev.filter(m => !selected.includes(m.id)))
        setSelected([])
      }
    } catch (error) {
      console.error('Bulk delete failed:', error)
    }
  }
  
  return (
    <div className="media-gallery">
      {/* Filters */}
      <div className="filters">
        <input 
          placeholder="Search files..."
          value={currentFilters.search || ''}
          onChange={(e) => setCurrentFilters(prev => ({ ...prev, search: e.target.value }))}
        />
        
        <select 
          value={currentFilters.format || ''}
          onChange={(e) => setCurrentFilters(prev => ({ ...prev, format: e.target.value }))}
        >
          <option value="">All formats</option>
          <option value="jpg">JPEG</option>
          <option value="png">PNG</option>
          <option value="gif">GIF</option>
        </select>
        
        <label>
          <input 
            type="checkbox"
            checked={currentFilters.orphaned || false}
            onChange={(e) => setCurrentFilters(prev => ({ ...prev, orphaned: e.target.checked }))}
          />
          Show orphaned only
        </label>
      </div>
      
      {/* Bulk actions */}
      {multiSelect && selected.length > 0 && (
        <div className="bulk-actions">
          <span>{selected.length} selected</span>
          <button onClick={handleBulkDelete}>Delete Selected</button>
        </div>
      )}
      
      {/* Media grid */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {media.map(item => (
            <div 
              key={item.id}
              className={`media-item ${selected.includes(item.id) ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
            >
              <img src={item.url} alt={item.filename} className="w-full h-32 object-cover" />
              <div className="info">
                <p className="filename">{item.filename}</p>
                <p className="size">{formatFileSize(item.size)}</p>
                <p className="references">{item.referenceCount} references</p>
                {item.isOrphaned && <span className="orphaned">Orphaned</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
```

### 2. Cleanup Management Interface

Administrative interface for cleanup operations:

```typescript
import { useState, useEffect } from 'react'
import { CleanupOperation, OrphanedMedia } from '@/types/media'

export function CleanupManager() {
  const [orphans, setOrphans] = useState<OrphanedMedia[]>([])
  const [operations, setOperations] = useState<CleanupOperation[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    fetchOrphans()
    fetchOperations()
  }, [])
  
  const fetchOrphans = async () => {
    try {
      const response = await fetch('/api/admin/media/orphans')
      const data = await response.json()
      if (data.success) {
        setOrphans(data.data.orphans)
      }
    } catch (error) {
      console.error('Failed to fetch orphans:', error)
    }
  }
  
  const fetchOperations = async () => {
    try {
      const response = await fetch('/api/admin/media/cleanup/history')
      const data = await response.json()
      if (data.success) {
        setOperations(data.data.operations)
      }
    } catch (error) {
      console.error('Failed to fetch operations:', error)
    }
  }
  
  const runCleanup = async (dryRun = false) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/media/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaIds: orphans.map(o => o.id),
          dryRun,
          olderThanDays: 30
        })
      })
      
      const result = await response.json()
      if (result.success) {
        console.log('Cleanup result:', result.data)
        if (!dryRun) {
          fetchOrphans() // Refresh orphans list
        }
        fetchOperations() // Refresh operations history
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const totalSize = orphans.reduce((sum, orphan) => sum + orphan.size, 0)
  
  return (
    <div className="cleanup-manager">
      <h2>Media Cleanup Manager</h2>
      
      {/* Orphans summary */}
      <div className="summary">
        <h3>Orphaned Files</h3>
        <p>{orphans.length} files totaling {formatFileSize(totalSize)}</p>
        
        <div className="actions">
          <button 
            onClick={() => runCleanup(true)}
            disabled={loading || orphans.length === 0}
          >
            Preview Cleanup (Dry Run)
          </button>
          <button 
            onClick={() => runCleanup(false)}
            disabled={loading || orphans.length === 0}
            className="danger"
          >
            Execute Cleanup
          </button>
        </div>
      </div>
      
      {/* Orphans list */}
      <div className="orphans-list">
        <h4>Orphaned Files</h4>
        {orphans.map(orphan => (
          <div key={orphan.id} className="orphan-item">
            <img src={orphan.url} alt={orphan.filename} className="thumbnail" />
            <div className="details">
              <p className="filename">{orphan.filename}</p>
              <p className="size">{formatFileSize(orphan.size)}</p>
              <p className="age">{orphan.daysSinceUpload} days old</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Operations history */}
      <div className="operations-history">
        <h4>Recent Operations</h4>
        {operations.map(op => (
          <div key={op.id} className="operation-item">
            <div className="operation-header">
              <span className={`status ${op.status}`}>{op.status}</span>
              <span className="date">{new Date(op.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="operation-details">
              <p>Processed: {op.filesProcessed} files</p>
              <p>Deleted: {op.filesDeleted} files</p>
              <p>Space freed: {formatFileSize(op.spaceFreed)}</p>
              {op.errorMessage && <p className="error">Error: {op.errorMessage}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. Progress Tracking Hook

Reusable hook for upload progress:

```typescript
import { useState, useCallback } from 'react'

interface UploadProgress {
  percentage: number
  loaded: number
  total: number
  speed?: number
  timeRemaining?: number
}

interface UploadState {
  isUploading: boolean
  progress: UploadProgress | null
  error: string | null
}

export function useUploadProgress() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: null,
    error: null
  })
  
  const startUpload = useCallback(() => {
    setState({
      isUploading: true,
      progress: { percentage: 0, loaded: 0, total: 0 },
      error: null
    })
  }, [])
  
  const updateProgress = useCallback((progress: UploadProgress) => {
    setState(prev => ({
      ...prev,
      progress
    }))
  }, [])
  
  const completeUpload = useCallback(() => {
    setState({
      isUploading: false,
      progress: { percentage: 100, loaded: 0, total: 0 },
      error: null
    })
  }, [])
  
  const failUpload = useCallback((error: string) => {
    setState({
      isUploading: false,
      progress: null,
      error
    })
  }, [])
  
  return {
    ...state,
    startUpload,
    updateProgress,
    completeUpload,
    failUpload
  }
}
```

## Testing Integration

### Unit Tests

Test your media integration components:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MediaGallery } from './MediaGallery'

// Mock the API
jest.mock('@/lib/api', () => ({
  fetchMedia: jest.fn()
}))

describe('MediaGallery', () => {
  it('should load and display media files', async () => {
    const mockMedia = [
      {
        id: '1',
        filename: 'test.jpg',
        url: 'https://example.com/test.jpg',
        size: 1024,
        referenceCount: 2
      }
    ]
    
    require('@/lib/api').fetchMedia.mockResolvedValue({
      success: true,
      data: { media: mockMedia }
    })
    
    render(<MediaGallery />)
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })
  })
  
  it('should handle file selection', async () => {
    const onSelect = jest.fn()
    const mockMedia = [
      {
        id: '1',
        filename: 'test.jpg',
        url: 'https://example.com/test.jpg'
      }
    ]
    
    require('@/lib/api').fetchMedia.mockResolvedValue({
      success: true,
      data: { media: mockMedia }
    })
    
    render(<MediaGallery onSelect={onSelect} />)
    
    await waitFor(() => {
      const mediaItem = screen.getByText('test.jpg')
      fireEvent.click(mediaItem)
      expect(onSelect).toHaveBeenCalledWith(mockMedia[0])
    })
  })
})
```

### Integration Tests

Test the complete upload workflow:

```typescript
import { uploadImage } from '@/lib/media/upload-service'
import { trackContentReferences } from '@/lib/media/media-tracker'

describe('Media Upload Integration', () => {
  it('should upload image and track references', async () => {
    // Create test file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    // Upload image
    const uploadResult = await uploadImage(file, { folder: 'test' })
    expect(uploadResult.success).toBe(true)
    expect(uploadResult.data.publicId).toBeDefined()
    
    // Track reference
    const content = `<img src="${uploadResult.data.url}" />`
    await trackContentReferences('test-article', 'article', content)
    
    // Verify tracking
    const usage = await getMediaUsage(uploadResult.data.publicId)
    expect(usage.totalReferences).toBe(1)
  })
})
```

## Performance Optimization

### 1. Image Optimization

Configure automatic optimization:

```typescript
// In your upload service configuration
const uploadOptions = {
  transformation: [
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
    { width: 1920, height: 1080, crop: 'limit' }
  ],
  eager: [
    { width: 300, height: 200, crop: 'thumb' }, // Thumbnail
    { width: 800, height: 600, crop: 'limit' }  // Medium size
  ]
}
```

### 2. Lazy Loading

Implement lazy loading for media galleries:

```typescript
import { useState, useEffect, useRef } from 'react'

export function LazyMediaGallery() {
  const [visibleItems, setVisibleItems] = useState(20)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver>()
  const lastItemRef = useRef<HTMLDivElement>()
  
  useEffect(() => {
    if (loading) return
    
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setLoading(true)
        setTimeout(() => {
          setVisibleItems(prev => prev + 20)
          setLoading(false)
        }, 500)
      }
    })
    
    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current)
    }
  }, [loading])
  
  return (
    <div className="media-grid">
      {media.slice(0, visibleItems).map((item, index) => (
        <div 
          key={item.id}
          ref={index === visibleItems - 1 ? lastItemRef : undefined}
          className="media-item"
        >
          <img src={item.url} alt={item.filename} loading="lazy" />
        </div>
      ))}
      {loading && <div>Loading more...</div>}
    </div>
  )
}
```

### 3. Caching Strategy

Implement client-side caching:

```typescript
import { useState, useEffect } from 'react'

const mediaCache = new Map()

export function useCachedMedia(filters: MediaFilters) {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const cacheKey = JSON.stringify(filters)
    
    // Check cache first
    if (mediaCache.has(cacheKey)) {
      setMedia(mediaCache.get(cacheKey))
      setLoading(false)
      return
    }
    
    // Fetch from API
    fetchMedia(filters).then(result => {
      mediaCache.set(cacheKey, result.data.media)
      setMedia(result.data.media)
      setLoading(false)
    })
  }, [filters])
  
  return { media, loading }
}
```

## Security Considerations

### 1. File Validation

Always validate files on both client and server:

```typescript
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 10MB)' }
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' }
  }
  
  return { valid: true }
}
```

### 2. Access Control

Implement proper permissions:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function checkMediaPermissions(action: 'read' | 'write' | 'delete') {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  const userRole = session.user.role
  
  switch (action) {
    case 'read':
      return ['admin', 'editor', 'viewer'].includes(userRole)
    case 'write':
      return ['admin', 'editor'].includes(userRole)
    case 'delete':
      return userRole === 'admin'
    default:
      return false
  }
}
```

## Deployment Checklist

Before deploying media management features:

- [ ] Configure Cloudinary credentials
- [ ] Set up database migrations
- [ ] Configure file upload limits
- [ ] Set up monitoring and alerting
- [ ] Test upload and cleanup workflows
- [ ] Verify security permissions
- [ ] Configure backup procedures
- [ ] Set up performance monitoring
- [ ] Test error handling scenarios
- [ ] Verify mobile responsiveness

## Support and Troubleshooting

For additional help:

1. Check the [API Documentation](./MEDIA_MANAGEMENT_API.md)
2. Review the [Troubleshooting Guide](./MEDIA_MANAGEMENT_TROUBLESHOOTING.md)
3. Enable debug logging with `DEBUG_MEDIA=true`
4. Check system health endpoints
5. Review error logs and monitoring dashboards