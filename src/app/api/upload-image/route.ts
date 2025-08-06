import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import {
  rateLimit,
  validateFileUpload,
  logSecurityEvent,
  SECURITY_HEADERS,
} from '@/lib/security';

// Rate limiter for file uploads (10 uploads per 15 minutes)
const uploadRateLimit = rateLimit(10, 15 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = uploadRateLimit(request);
    if (!rateLimitResult.allowed) {
      logSecurityEvent(
        'RATE_LIMIT_EXCEEDED',
        {
          endpoint: '/api/upload-image',
          remaining: rateLimitResult.remaining,
        },
        request
      );

      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        {
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': '900', // 15 minutes
          },
        }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      logSecurityEvent('UNAUTHORIZED_UPLOAD_ATTEMPT', {}, request);
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: SECURITY_HEADERS,
        }
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

    // Enhanced file validation
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      logSecurityEvent(
        'INVALID_FILE_UPLOAD',
        {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          error: validation.error,
        },
        request
      );

      return NextResponse.json(
        { error: validation.error },
        {
          status: 400,
          headers: SECURITY_HEADERS,
        }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadImage(buffer, 'articles');

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
