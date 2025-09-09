import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import {
  logSecurityEvent,
  SECURITY_HEADERS,
} from '@/lib/security';
import { 
  mediaSecurityManager, 
  requireMediaPermission,
  canUploadFileSize,
  type UserRole 
} from '@/lib/media/media-security';
import { mediaCSRFProtection } from '@/lib/media/csrf-protection';
import { uploadService } from '@/lib/media/upload-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      logSecurityEvent('UNAUTHORIZED_UPLOAD_ATTEMPT', {}, request);
      return NextResponse.json(
        { error: 'Authentication required' },
        {
          status: 401,
          headers: SECURITY_HEADERS,
        }
      );
    }

    const userRole = session.user.role as UserRole;
    const userId = session.user.id;
    const sessionId = (session.user as any).sessionId || 'no-session';

    // Check permissions for media upload
    const hasPermission = requireMediaPermission('media:upload')(userRole);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload media' },
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    // Apply rate limiting for upload operations
    const rateLimitResult = await mediaSecurityManager.checkRateLimit(request, 'upload');
    if (!rateLimitResult.allowed) {
      logSecurityEvent(
        'RATE_LIMIT_EXCEEDED',
        {
          endpoint: '/api/upload-image',
          remaining: rateLimitResult.remaining,
          operation: 'upload'
        },
        request
      );

      return NextResponse.json(
        { 
          error: 'Upload rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': rateLimitResult.retryAfter?.toString() || '300'
          },
        }
      );
    }

    // Validate CSRF token for upload operations
    const csrfValidation = await mediaCSRFProtection.validateToken(request, userId, sessionId);
    if (!csrfValidation.valid) {
      logSecurityEvent(
        'CSRF_VALIDATION_FAILED',
        {
          endpoint: '/api/upload-image',
          reason: csrfValidation.reason,
          userId
        },
        request
      );

      return NextResponse.json(
        { 
          error: 'CSRF validation failed',
          message: csrfValidation.reason
        },
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        {
          status: 400,
          headers: SECURITY_HEADERS,
        }
      );
    }

    // Check file size against user role limits
    if (!canUploadFileSize(userRole, file.size)) {
      const sizeLimit = mediaSecurityManager.getFileSizeLimit(userRole);
      logSecurityEvent(
        'FILE_SIZE_EXCEEDED',
        {
          fileName: file.name,
          fileSize: file.size,
          sizeLimit,
          userRole,
          userId
        },
        request
      );

      return NextResponse.json(
        { 
          error: `File size exceeds limit for your role`,
          maxSize: sizeLimit,
          currentSize: file.size
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Use the enhanced upload service with comprehensive validation
    const uploadResult = await uploadService.uploadImage(file, {
      folder: 'superbear_blog',
      validationOptions: {
        maxSize: mediaSecurityManager.getFileSizeLimit(userRole),
        stripExif: true,
        performMalwareScan: true
      }
    });

    // Log the upload operation
    await mediaSecurityManager.logMediaOperation(
      request,
      {
        userRole,
        userId,
        operation: 'upload',
        metadata: {
          filename: file.name,
          fileSize: file.size,
          uploadId: uploadResult.uploadId
        }
      },
      uploadResult.success,
      uploadResult.error
    );

    if (!uploadResult.success) {
      logSecurityEvent(
        'UPLOAD_FAILED',
        {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          error: uploadResult.error,
          validationResult: uploadResult.validationResult
        },
        request
      );

      return NextResponse.json(
        { 
          error: uploadResult.error,
          validationErrors: uploadResult.validationResult?.errors
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Generate new CSRF token for next request
    const newToken = await mediaCSRFProtection.generateToken(userId, sessionId);
    const response = NextResponse.json({
      success: true,
      data: uploadResult.data,
      validationWarnings: uploadResult.validationResult?.warnings
    });

    // Set new CSRF token in response
    mediaCSRFProtection.setTokenCookie(response, newToken);
    response.headers.set('X-CSRF-Token', newToken);

    return response;
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Log security event for upload failure
    logSecurityEvent(
      'UPLOAD_ERROR',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      request
    );

    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
