# Media Management System API Documentation

## Overview

The Media Management System provides comprehensive APIs for handling image uploads, tracking media usage, and managing cleanup operations. All endpoints require proper authentication and follow RESTful conventions.

## Authentication

All admin endpoints require authentication via NextAuth session. Include the session token in requests:

```javascript
// Client-side usage
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
// Session automatically included in same-origin requests
```

## Upload Endpoints

### POST /api/upload-image

Upload a single image file with progress tracking and validation.

**Request:**
```javascript
const formData = new FormData()
formData.append('file', imageFile)
formData.append('folder', 'articles') // optional

const response = await fetch('/api/upload-image', {
  method: 'POST',
  body: formData
})
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "articles/image_abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "size": 245760
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "File too large. Maximum size is 10MB"
}
```

## Media Management Endpoints

### GET /api/admin/media

Retrieve paginated list of all uploaded media files.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by filename
- `format` (string): Filter by file format (jpg, png, gif, etc.)
- `folder` (string): Filter by folder
- `orphaned` (boolean): Filter orphaned files
- `dateFrom` (string): Filter by upload date (ISO format)
- `dateTo` (string): Filter by upload date (ISO format)

**Example Request:**
```javascript
const response = await fetch('/api/admin/media?page=1&limit=20&search=hero&orphaned=false')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "clx123abc",
        "publicId": "articles/hero_image_123",
        "url": "https://res.cloudinary.com/...",
        "filename": "hero-image.jpg",
        "originalFilename": "my-hero-image.jpg",
        "size": 245760,
        "width": 1920,
        "height": 1080,
        "format": "jpg",
        "folder": "articles",
        "uploadedBy": "user123",
        "uploadedAt": "2024-01-15T10:30:00Z",
        "metadata": {
          "alt": "Hero image for article"
        },
        "referenceCount": 3,
        "isOrphaned": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /api/admin/media/[id]

Get detailed information about a specific media file including usage references.

**Response:**
```json
{
  "success": true,
  "data": {
    "media": {
      "id": "clx123abc",
      "publicId": "articles/hero_image_123",
      "url": "https://res.cloudinary.com/...",
      "filename": "hero-image.jpg",
      "size": 245760,
      "format": "jpg",
      "uploadedAt": "2024-01-15T10:30:00Z"
    },
    "usage": {
      "totalReferences": 3,
      "references": [
        {
          "contentType": "article",
          "contentId": "article_456",
          "referenceContext": "content",
          "title": "Getting Started with AI",
          "url": "/news/getting-started-with-ai"
        },
        {
          "contentType": "article",
          "contentId": "article_789",
          "referenceContext": "cover_image",
          "title": "Machine Learning Basics",
          "url": "/news/machine-learning-basics"
        }
      ]
    }
  }
}
```

### DELETE /api/admin/media/[id]

Delete a specific media file. Will fail if the file is still referenced.

**Response (Success):**
```json
{
  "success": true,
  "message": "Media file deleted successfully"
}
```

**Response (Referenced File):**
```json
{
  "success": false,
  "error": "Cannot delete media file: still referenced in 3 locations",
  "references": [
    {
      "contentType": "article",
      "contentId": "article_456",
      "title": "Getting Started with AI"
    }
  ]
}
```

### POST /api/admin/media/bulk-delete

Delete multiple media files in a single operation.

**Request:**
```json
{
  "mediaIds": ["clx123abc", "clx456def", "clx789ghi"],
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": 2,
    "failed": 1,
    "errors": [
      {
        "mediaId": "clx123abc",
        "error": "File still referenced in content"
      }
    ]
  }
}
```

## Cleanup Endpoints

### GET /api/admin/media/orphans

Get list of orphaned media files (not referenced anywhere).

**Query Parameters:**
- `olderThan` (string): Only include files older than date (ISO format)
- `minSize` (number): Minimum file size in bytes
- `folder` (string): Filter by folder

**Response:**
```json
{
  "success": true,
  "data": {
    "orphans": [
      {
        "id": "clx123abc",
        "publicId": "temp/unused_image_123",
        "url": "https://res.cloudinary.com/...",
        "size": 145760,
        "uploadedAt": "2024-01-10T08:15:00Z",
        "daysSinceUpload": 15
      }
    ],
    "totalSize": 2457600,
    "totalCount": 25
  }
}
```

### POST /api/admin/media/cleanup

Execute cleanup operation to remove orphaned files.

**Request:**
```json
{
  "mediaIds": ["clx123abc", "clx456def"],
  "dryRun": false,
  "olderThanDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operationId": "cleanup_789xyz",
    "processed": 25,
    "deleted": 23,
    "failed": 2,
    "freedSpace": 2457600,
    "errors": [
      {
        "mediaId": "clx123abc",
        "error": "File not found in Cloudinary"
      }
    ]
  }
}
```

### GET /api/admin/media/cleanup/schedule

Get scheduled cleanup operations.

**Response:**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "schedule_123",
        "name": "Weekly Cleanup",
        "enabled": true,
        "cronExpression": "0 2 * * 0",
        "olderThanDays": 30,
        "minSizeBytes": 1024,
        "lastRun": "2024-01-14T02:00:00Z",
        "nextRun": "2024-01-21T02:00:00Z"
      }
    ]
  }
}
```

### POST /api/admin/media/cleanup/schedule

Create or update a cleanup schedule.

**Request:**
```json
{
  "name": "Weekly Cleanup",
  "enabled": true,
  "cronExpression": "0 2 * * 0",
  "olderThanDays": 30,
  "minSizeBytes": 1024,
  "folders": ["temp", "uploads"]
}
```

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error context"
  }
}
```

### Common Error Codes

- `UPLOAD_001`: File too large
- `UPLOAD_002`: Invalid file type
- `UPLOAD_003`: Upload failed
- `UPLOAD_004`: Storage quota exceeded
- `TRACK_001`: Tracking failed
- `TRACK_002`: Reference extraction failed
- `CLEANUP_001`: Cleanup operation failed
- `CLEANUP_002`: Orphan detection failed
- `CLEANUP_003`: Deletion failed
- `AUTH_001`: Authentication required
- `AUTH_002`: Insufficient permissions
- `VALIDATION_001`: Invalid request data

## Rate Limiting

Upload endpoints are rate limited to prevent abuse:

- **Upload endpoints**: 10 requests per minute per user
- **Media management**: 100 requests per minute per user
- **Cleanup operations**: 5 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642234567
```

## File Validation

### Supported Formats

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Maximum size**: 10MB per file
- **Maximum dimensions**: 4096x4096 pixels

### Security Validation

- File headers are validated (not just extensions)
- EXIF data is stripped for privacy
- Malicious content scanning is performed
- File names are sanitized

## Integration Examples

### TipTap Editor Integration

```javascript
import { useUploadService } from '@/lib/hooks/useUploadService'

function MyEditor() {
  const { uploadImage, progress, error } = useUploadService()
  
  const handleImageUpload = async (file) => {
    try {
      const result = await uploadImage(file, {
        folder: 'articles',
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress.percentage}%`)
        }
      })
      
      // Insert image into editor
      editor.chain().focus().setImage({ src: result.url }).run()
    } catch (error) {
      console.error('Upload failed:', error.message)
    }
  }
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => handleImageUpload(e.target.files[0])} 
      />
      {progress && <div>Uploading: {progress.percentage}%</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

### Article Form Integration

```javascript
import { useMediaTracking } from '@/lib/hooks/useMediaTracking'

function ArticleForm({ article }) {
  const { trackContentReferences } = useMediaTracking()
  
  const handleSave = async (formData) => {
    // Save article
    const savedArticle = await saveArticle(formData)
    
    // Track media references
    await trackContentReferences(
      savedArticle.id,
      'article',
      formData.content,
      formData.coverImage
    )
  }
}
```

### Media Gallery Component

```javascript
import { useState, useEffect } from 'react'

function MediaGallery() {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    format: '',
    orphaned: false
  })
  
  useEffect(() => {
    const fetchMedia = async () => {
      const params = new URLSearchParams(filters)
      const response = await fetch(`/api/admin/media?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setMedia(data.data.media)
      }
      setLoading(false)
    }
    
    fetchMedia()
  }, [filters])
  
  const handleDelete = async (mediaId) => {
    const response = await fetch(`/api/admin/media/${mediaId}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    if (result.success) {
      setMedia(media.filter(m => m.id !== mediaId))
    } else {
      alert(result.error)
    }
  }
  
  return (
    <div>
      {/* Search and filters */}
      <input 
        value={filters.search}
        onChange={(e) => setFilters({...filters, search: e.target.value})}
        placeholder="Search media..."
      />
      
      {/* Media grid */}
      <div className="grid grid-cols-4 gap-4">
        {media.map(item => (
          <div key={item.id} className="border rounded p-2">
            <img src={item.url} alt={item.filename} className="w-full h-32 object-cover" />
            <p className="text-sm">{item.filename}</p>
            <p className="text-xs text-gray-500">{item.referenceCount} references</p>
            <button onClick={() => handleDelete(item.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Troubleshooting

### Common Issues

#### Upload Failures

**Problem**: Images fail to upload with "Upload failed" error
**Solution**: 
1. Check file size (must be < 10MB)
2. Verify file format is supported
3. Ensure Cloudinary credentials are configured
4. Check network connectivity

#### Orphan Detection Issues

**Problem**: Files showing as orphaned when they're actually used
**Solution**:
1. Verify content references are properly tracked
2. Run reference extraction on existing content
3. Check for references in non-standard formats

#### Cleanup Operation Failures

**Problem**: Cleanup operations fail or delete wrong files
**Solution**:
1. Always run with `dryRun: true` first
2. Verify orphan detection results manually
3. Check Cloudinary API credentials and permissions

#### Performance Issues

**Problem**: Media gallery loads slowly with large libraries
**Solution**:
1. Implement proper pagination
2. Use image thumbnails for gallery view
3. Add database indexes for common queries
4. Consider CDN caching for thumbnails

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG_MEDIA=true npm run dev
```

This will log detailed information about:
- Upload operations and progress
- Reference extraction and tracking
- Cleanup operations and decisions
- API request/response details

### Health Checks

Monitor system health with these endpoints:

```javascript
// Check upload service health
const uploadHealth = await fetch('/api/health/upload')

// Check cleanup service health  
const cleanupHealth = await fetch('/api/health/cleanup')

// Check media tracking health
const trackingHealth = await fetch('/api/health/tracking')
```

## Migration Guide

### From Legacy Upload System

If migrating from an existing upload system:

1. **Audit existing media files**:
   ```javascript
   // Run audit script to identify untracked files
   npm run audit:media
   ```

2. **Import existing references**:
   ```javascript
   // Extract references from existing content
   npm run import:media-references
   ```

3. **Verify migration**:
   ```javascript
   // Check for orphaned files after migration
   npm run verify:media-migration
   ```

### Database Migration

The system requires these database tables:

```sql
-- Media files table
CREATE TABLE media_files (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  -- ... other fields
);

-- Media references table  
CREATE TABLE media_references (
  id TEXT PRIMARY KEY,
  media_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  -- ... other fields
);

-- Cleanup operations table
CREATE TABLE cleanup_operations (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL,
  -- ... other fields
);
```

Run migrations with:
```bash
npx prisma migrate deploy
```