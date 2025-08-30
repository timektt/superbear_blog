# Media Management System Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when using the Media Management System. Issues are organized by category with step-by-step resolution instructions.

## Upload Issues

### File Upload Failures

#### Problem: "File too large" Error
**Symptoms:**
- Upload fails immediately with size error
- Progress bar doesn't appear
- Error message shows file size limit

**Solutions:**
1. **Check file size**: Maximum allowed is 10MB
   ```bash
   # Check file size on Windows
   dir "filename.jpg"
   
   # Check file size on Mac/Linux
   ls -lh filename.jpg
   ```

2. **Compress the image**:
   - Use online tools like TinyPNG or Squoosh
   - Reduce image dimensions if very large
   - Convert to JPEG if currently PNG (usually smaller)

3. **Split large uploads**:
   - Upload files one at a time instead of batch
   - Use smaller batches (5-10 files max)

#### Problem: "Invalid file type" Error
**Symptoms:**
- Upload rejected with format error
- File appears to be an image but fails validation
- Error mentions unsupported format

**Solutions:**
1. **Verify file format**:
   ```javascript
   // Supported formats
   const supportedFormats = [
     'image/jpeg', 'image/jpg', 'image/png', 
     'image/gif', 'image/webp', 'image/svg+xml'
   ]
   ```

2. **Check file extension**:
   - Ensure extension matches actual format
   - Rename .jpeg files to .jpg if needed
   - Remove any extra extensions (e.g., .jpg.txt)

3. **Convert format**:
   - Use image editor to save in supported format
   - Try converting to JPEG as most compatible option

#### Problem: Upload Hangs or Times Out
**Symptoms:**
- Progress bar stops at certain percentage
- Upload appears to freeze
- No error message displayed

**Solutions:**
1. **Check network connection**:
   ```bash
   # Test connection speed
   ping cloudinary.com
   
   # Check if behind firewall/proxy
   curl -I https://api.cloudinary.com/v1_1/
   ```

2. **Retry with smaller files**:
   - Try uploading a small test image first
   - Reduce image size/quality before upload
   - Upload files individually instead of batch

3. **Clear browser cache**:
   - Hard refresh (Ctrl+F5 / Cmd+Shift+R)
   - Clear browser cache and cookies
   - Try incognito/private browsing mode

4. **Check browser console**:
   ```javascript
   // Open browser console (F12) and look for errors
   // Common errors to look for:
   // - Network timeout errors
   // - CORS errors
   // - JavaScript errors
   ```

### Progress Tracking Issues

#### Problem: Progress Bar Not Updating
**Symptoms:**
- Upload starts but progress stays at 0%
- No visual feedback during upload
- Upload completes but progress never showed

**Solutions:**
1. **Enable debug mode**:
   ```javascript
   // Add to browser console
   localStorage.setItem('DEBUG_UPLOADS', 'true')
   // Refresh page and try upload again
   ```

2. **Check event listeners**:
   ```javascript
   // Verify progress events are firing
   const xhr = new XMLHttpRequest()
   xhr.upload.addEventListener('progress', (e) => {
     console.log(`Progress: ${(e.loaded / e.total) * 100}%`)
   })
   ```

3. **Browser compatibility**:
   - Try different browser (Chrome, Firefox, Safari)
   - Update browser to latest version
   - Disable browser extensions that might interfere

## Media Library Issues

### Gallery Loading Problems

#### Problem: Media Gallery Won't Load
**Symptoms:**
- Empty gallery despite having uploaded files
- Loading spinner never stops
- Error message about failed to fetch

**Solutions:**
1. **Check API endpoints**:
   ```bash
   # Test API directly
   curl -X GET "https://yoursite.com/api/admin/media" \
     -H "Cookie: your-session-cookie"
   ```

2. **Verify authentication**:
   - Ensure you're logged in with proper permissions
   - Check session hasn't expired
   - Try logging out and back in

3. **Database connection**:
   ```javascript
   // Check if database is accessible
   fetch('/api/health/database')
     .then(r => r.json())
     .then(data => console.log('DB Status:', data))
   ```

4. **Clear application cache**:
   - Clear browser cache completely
   - Clear service worker cache if applicable
   - Restart browser

#### Problem: Images Not Displaying
**Symptoms:**
- Gallery loads but shows broken image icons
- Thumbnails missing or corrupted
- Images work in some browsers but not others

**Solutions:**
1. **Check Cloudinary URLs**:
   ```javascript
   // Test image URL directly
   const testUrl = 'https://res.cloudinary.com/your-cloud/image/upload/...'
   fetch(testUrl)
     .then(r => console.log('Image status:', r.status))
     .catch(e => console.error('Image error:', e))
   ```

2. **Verify Cloudinary configuration**:
   ```bash
   # Check environment variables
   echo $CLOUDINARY_CLOUD_NAME
   echo $CLOUDINARY_API_KEY
   # Don't echo API_SECRET for security
   ```

3. **Test with different image sizes**:
   - Try loading original vs thumbnail versions
   - Check if specific transformations are failing
   - Test with different image formats

### Search and Filter Issues

#### Problem: Search Returns No Results
**Symptoms:**
- Search appears to work but returns empty results
- Filters don't seem to apply correctly
- Known files don't appear in search

**Solutions:**
1. **Check search syntax**:
   ```javascript
   // Search is case-insensitive and partial match
   // These should all work:
   // "hero" matches "hero-image.jpg"
   // "Hero" matches "hero-image.jpg"  
   // "image" matches "hero-image.jpg"
   ```

2. **Verify database indexes**:
   ```sql
   -- Check if search indexes exist
   EXPLAIN QUERY PLAN 
   SELECT * FROM media_files 
   WHERE filename LIKE '%search-term%';
   ```

3. **Test API directly**:
   ```bash
   curl "https://yoursite.com/api/admin/media?search=test" \
     -H "Cookie: your-session"
   ```

4. **Clear search cache**:
   - Try searching for something completely different
   - Clear browser cache
   - Refresh the page and try again

## Cleanup System Issues

### Orphan Detection Problems

#### Problem: Files Incorrectly Marked as Orphaned
**Symptoms:**
- Files still in use show as orphaned
- Cleanup wants to delete files that shouldn't be deleted
- Reference counting seems incorrect

**Solutions:**
1. **Manual reference check**:
   ```javascript
   // Check if image is actually referenced
   const publicId = 'your-image-public-id'
   fetch(`/api/admin/media/${publicId}/usage`)
     .then(r => r.json())
     .then(data => console.log('Usage:', data))
   ```

2. **Re-scan content references**:
   ```bash
   # Run reference extraction script
   npm run extract-media-references
   
   # Or via API
   curl -X POST "/api/admin/media/rescan-references" \
     -H "Content-Type: application/json"
   ```

3. **Check content formats**:
   - Verify all content types are being scanned
   - Check for references in custom fields
   - Look for references in draft content

4. **Database consistency check**:
   ```sql
   -- Check for orphaned references
   SELECT mr.* FROM media_references mr
   LEFT JOIN media_files mf ON mr.media_id = mf.id
   WHERE mf.id IS NULL;
   
   -- Check for missing references
   SELECT mf.* FROM media_files mf
   LEFT JOIN media_references mr ON mf.id = mr.media_id
   WHERE mr.id IS NULL;
   ```

#### Problem: Cleanup Operations Fail
**Symptoms:**
- Cleanup starts but doesn't complete
- Some files deleted but others remain
- Error messages about permissions or API failures

**Solutions:**
1. **Check Cloudinary permissions**:
   ```javascript
   // Test delete permission
   const cloudinary = require('cloudinary').v2
   cloudinary.api.delete_resources(['test-image'], (error, result) => {
     console.log('Delete test:', error || result)
   })
   ```

2. **Run cleanup in dry-run mode**:
   ```bash
   curl -X POST "/api/admin/media/cleanup" \
     -H "Content-Type: application/json" \
     -d '{"dryRun": true, "mediaIds": ["test-id"]}'
   ```

3. **Check cleanup logs**:
   ```bash
   # View cleanup operation logs
   tail -f logs/cleanup.log
   
   # Or check database
   SELECT * FROM cleanup_operations 
   ORDER BY created_at DESC LIMIT 10;
   ```

4. **Manual cleanup**:
   ```javascript
   // Delete individual files for testing
   fetch('/api/admin/media/specific-id', { method: 'DELETE' })
     .then(r => r.json())
     .then(data => console.log('Delete result:', data))
   ```

## Performance Issues

### Slow Upload Speeds

#### Problem: Uploads Take Too Long
**Symptoms:**
- Upload progress is very slow
- Large files timeout before completing
- Multiple uploads cause browser to freeze

**Solutions:**
1. **Check network speed**:
   ```bash
   # Test upload speed to Cloudinary
   curl -X POST "https://api.cloudinary.com/v1_1/demo/image/upload" \
     -F "file=@test-image.jpg" \
     -F "upload_preset=demo_preset" \
     -w "Time: %{time_total}s\n"
   ```

2. **Optimize upload settings**:
   ```javascript
   // Reduce concurrent uploads
   const uploadOptions = {
     maxConcurrentUploads: 2, // Reduce from default
     chunkSize: 1024 * 1024,  // 1MB chunks
     retryLimit: 3
   }
   ```

3. **Compress before upload**:
   ```javascript
   // Client-side compression
   const compressImage = (file, quality = 0.8) => {
     const canvas = document.createElement('canvas')
     const ctx = canvas.getContext('2d')
     // ... compression logic
   }
   ```

### Gallery Performance Issues

#### Problem: Media Gallery Loads Slowly
**Symptoms:**
- Gallery takes long time to display
- Scrolling is laggy or choppy
- Browser becomes unresponsive with large libraries

**Solutions:**
1. **Enable pagination**:
   ```javascript
   // Limit items per page
   const galleryOptions = {
     itemsPerPage: 20,
     enableInfiniteScroll: true,
     lazyLoadThumbnails: true
   }
   ```

2. **Optimize thumbnail loading**:
   ```javascript
   // Use smaller thumbnails
   const thumbnailUrl = cloudinary.url(publicId, {
     width: 200,
     height: 200,
     crop: 'fill',
     quality: 'auto:low'
   })
   ```

3. **Implement virtual scrolling**:
   ```javascript
   // Only render visible items
   const VirtualizedGallery = ({ items }) => {
     const [visibleRange, setVisibleRange] = useState([0, 20])
     // ... virtual scrolling logic
   }
   ```

4. **Add database indexes**:
   ```sql
   -- Optimize common queries
   CREATE INDEX idx_media_files_uploaded_at ON media_files(uploaded_at DESC);
   CREATE INDEX idx_media_files_folder ON media_files(folder);
   CREATE INDEX idx_media_files_filename ON media_files(filename);
   ```

## Integration Issues

### TipTap Editor Problems

#### Problem: Drag-and-Drop Not Working
**Symptoms:**
- Dragging files over editor shows no drop zone
- Dropped files don't upload
- No visual feedback during drag operation

**Solutions:**
1. **Check event handlers**:
   ```javascript
   // Verify drag events are registered
   editor.on('drop', (view, event, slice, moved) => {
     console.log('Drop event:', event)
     // Handle file drop
   })
   ```

2. **Test browser support**:
   ```javascript
   // Check drag-and-drop support
   const supportsDragDrop = 'draggable' in document.createElement('div')
   console.log('Drag-drop supported:', supportsDragDrop)
   ```

3. **Verify file handling**:
   ```javascript
   // Check if files are detected
   const handleDrop = (event) => {
     const files = Array.from(event.dataTransfer.files)
     console.log('Dropped files:', files)
   }
   ```

#### Problem: Paste from Clipboard Fails
**Symptoms:**
- Pasting images doesn't work
- Clipboard paste shows no response
- Only text paste works

**Solutions:**
1. **Check clipboard permissions**:
   ```javascript
   // Test clipboard access
   navigator.permissions.query({name: 'clipboard-read'})
     .then(result => console.log('Clipboard permission:', result.state))
   ```

2. **Verify paste handler**:
   ```javascript
   // Check paste event
   document.addEventListener('paste', (event) => {
     const items = Array.from(event.clipboardData.items)
     console.log('Paste items:', items)
   })
   ```

3. **Test different browsers**:
   - Chrome: Full clipboard support
   - Firefox: Limited clipboard support
   - Safari: Requires user permission

### Article Form Integration

#### Problem: Cover Images Not Saving
**Symptoms:**
- Cover image uploads but doesn't save with article
- Image appears during editing but disappears after save
- Form validation errors about missing cover image

**Solutions:**
1. **Check form data**:
   ```javascript
   // Verify cover image is in form data
   const formData = new FormData(form)
   console.log('Cover image:', formData.get('coverImage'))
   ```

2. **Verify API payload**:
   ```javascript
   // Check what's being sent to API
   const articleData = {
     title: 'Test Article',
     content: 'Content...',
     coverImage: 'image-public-id' // Should be publicId, not URL
   }
   ```

3. **Test reference tracking**:
   ```javascript
   // Verify references are being tracked
   fetch('/api/admin/articles/article-id/references')
     .then(r => r.json())
     .then(data => console.log('References:', data))
   ```

## Security Issues

### Permission Errors

#### Problem: "Access Denied" Errors
**Symptoms:**
- Can't access media management interface
- Upload buttons disabled or missing
- API returns 403 Forbidden errors

**Solutions:**
1. **Check user role**:
   ```javascript
   // Verify current user permissions
   fetch('/api/auth/session')
     .then(r => r.json())
     .then(session => console.log('User role:', session.user.role))
   ```

2. **Verify role permissions**:
   ```javascript
   // Check what roles can access media
   const mediaPermissions = {
     read: ['admin', 'editor', 'viewer'],
     write: ['admin', 'editor'],
     delete: ['admin']
   }
   ```

3. **Test with admin account**:
   - Try accessing with known admin account
   - Check if issue is role-specific
   - Verify role assignment in database

### File Security Issues

#### Problem: Uploaded Files Rejected by Security Scan
**Symptoms:**
- Upload fails with "security threat detected"
- Files appear safe but are rejected
- Inconsistent security scan results

**Solutions:**
1. **Check file headers**:
   ```bash
   # Examine file headers
   file -b --mime-type image.jpg
   hexdump -C image.jpg | head -5
   ```

2. **Strip metadata**:
   ```bash
   # Remove EXIF data
   exiftool -all= image.jpg
   
   # Or use online tools to clean metadata
   ```

3. **Test with known clean files**:
   - Try uploading a simple test image
   - Use images from trusted sources
   - Create new image in image editor

## Database Issues

### Connection Problems

#### Problem: Database Connection Failures
**Symptoms:**
- "Database connection failed" errors
- Intermittent loading issues
- Timeout errors during operations

**Solutions:**
1. **Check database status**:
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Check connection pool
   curl "/api/health/database"
   ```

2. **Verify connection string**:
   ```bash
   # Check environment variables (don't log sensitive data)
   echo "Database host: $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)"
   ```

3. **Check connection limits**:
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Check connection limit
   SHOW max_connections;
   ```

### Migration Issues

#### Problem: Database Schema Out of Sync
**Symptoms:**
- "Table doesn't exist" errors
- "Column not found" errors
- Migration failures

**Solutions:**
1. **Check migration status**:
   ```bash
   npx prisma migrate status
   npx prisma db push --preview-feature
   ```

2. **Reset and re-migrate**:
   ```bash
   # CAUTION: This will delete all data
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

3. **Manual schema check**:
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('media_files', 'media_references', 'cleanup_operations');
   ```

## Monitoring and Debugging

### Enable Debug Logging

1. **Environment variables**:
   ```bash
   DEBUG_MEDIA=true
   DEBUG_UPLOADS=true
   DEBUG_CLEANUP=true
   ```

2. **Browser console**:
   ```javascript
   // Enable client-side debugging
   localStorage.setItem('DEBUG_MEDIA', 'true')
   localStorage.setItem('DEBUG_UPLOADS', 'true')
   ```

3. **Server logs**:
   ```bash
   # View application logs
   tail -f logs/application.log | grep MEDIA
   
   # View error logs
   tail -f logs/error.log
   ```

### Health Check Endpoints

Test system components:

```bash
# Overall system health
curl "/api/health"

# Database health
curl "/api/health/database"

# Cloudinary health
curl "/api/health/cloudinary"

# Media system health
curl "/api/health/media"
```

### Performance Monitoring

1. **Upload metrics**:
   ```javascript
   // Track upload performance
   const startTime = Date.now()
   uploadImage(file).then(() => {
     const duration = Date.now() - startTime
     console.log(`Upload took ${duration}ms`)
   })
   ```

2. **Database query performance**:
   ```sql
   -- Enable query logging
   SET log_statement = 'all';
   SET log_min_duration_statement = 1000; -- Log slow queries
   ```

3. **Memory usage**:
   ```javascript
   // Monitor memory usage
   if (performance.memory) {
     console.log('Memory usage:', {
       used: performance.memory.usedJSHeapSize,
       total: performance.memory.totalJSHeapSize,
       limit: performance.memory.jsHeapSizeLimit
     })
   }
   ```

## Getting Additional Help

### Information to Collect

When reporting issues, include:

1. **Error messages**: Exact text of any error messages
2. **Browser information**: Browser type and version
3. **File details**: File size, format, and name
4. **Steps to reproduce**: Exact steps that cause the issue
5. **Console logs**: Any errors in browser console (F12)
6. **Network logs**: Failed network requests in browser dev tools

### Diagnostic Commands

Run these to gather system information:

```bash
# System information
node --version
npm --version
npx prisma --version

# Database status
npx prisma migrate status

# Environment check (don't log secrets)
env | grep -E "(NODE_ENV|DATABASE_URL|CLOUDINARY_CLOUD_NAME)"

# Application health
curl -s "/api/health" | jq .
```

### Contact Information

- **System Administrator**: Contact your admin for permission issues
- **Technical Support**: Include diagnostic information with support requests
- **Documentation**: Check API docs and integration guides
- **Community**: Search existing issues and solutions

### Emergency Procedures

If the media system is completely down:

1. **Check system status**: Verify if it's a general outage
2. **Fallback options**: Use direct Cloudinary upload if available
3. **Backup plan**: Have alternative image hosting ready
4. **Communication**: Notify users of any service disruptions
5. **Recovery**: Follow disaster recovery procedures if needed