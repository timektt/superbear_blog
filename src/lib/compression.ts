import { NextRequest, NextResponse } from 'next/server';
import { gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

interface CompressionOptions {
  threshold?: number; // Minimum response size to compress (bytes)
  level?: number; // Compression level (1-9 for gzip, 1-11 for brotli)
  enableBrotli?: boolean;
  enableGzip?: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  threshold: 1024, // 1KB minimum
  level: 6, // Balanced compression level
  enableBrotli: true,
  enableGzip: true,
};

/**
 * Determines the best compression method based on Accept-Encoding header
 */
function getBestCompression(
  acceptEncoding: string | null,
  options: CompressionOptions
): 'br' | 'gzip' | null {
  if (!acceptEncoding) return null;

  const encodings = acceptEncoding.toLowerCase();

  // Prefer Brotli if supported and enabled
  if (options.enableBrotli && encodings.includes('br')) {
    return 'br';
  }

  // Fall back to gzip if supported and enabled
  if (options.enableGzip && encodings.includes('gzip')) {
    return 'gzip';
  }

  return null;
}

/**
 * Compresses data using the specified algorithm
 */
async function compressData(
  data: Buffer,
  method: 'br' | 'gzip',
  level: number
): Promise<Buffer> {
  try {
    if (method === 'br') {
      return await brotliAsync(data, {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: Math.min(level, 11),
        },
      });
    } else {
      return await gzipAsync(data, { level: Math.min(level, 9) });
    }
  } catch (error) {
    console.error(`Compression failed with ${method}:`, error);
    return data; // Return original data if compression fails
  }
}

/**
 * Checks if content type should be compressed
 */
function shouldCompress(contentType: string | null): boolean {
  if (!contentType) return false;

  const compressibleTypes = [
    'application/json',
    'application/javascript',
    'application/xml',
    'text/html',
    'text/css',
    'text/javascript',
    'text/plain',
    'text/xml',
    'image/svg+xml',
  ];

  return compressibleTypes.some((type) => contentType.includes(type));
}

/**
 * Middleware to compress API responses
 */
export function withCompression(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: CompressionOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);

    // Skip compression for non-successful responses
    if (!response.ok) {
      return response;
    }

    const contentType = response.headers.get('content-type');

    // Skip compression for non-compressible content
    if (!shouldCompress(contentType)) {
      return response;
    }

    // Get response body
    const responseBody = await response.arrayBuffer();
    const bodyBuffer = Buffer.from(responseBody);

    // Skip compression if body is too small
    if (bodyBuffer.length < config.threshold!) {
      return new NextResponse(bodyBuffer, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // Determine compression method
    const acceptEncoding = req.headers.get('accept-encoding');
    const compressionMethod = getBestCompression(acceptEncoding, config);

    if (!compressionMethod) {
      return new NextResponse(bodyBuffer, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // Compress the response
    const compressedBody = await compressData(
      bodyBuffer,
      compressionMethod,
      config.level!
    );

    // Create new response with compressed body
    const newHeaders = new Headers(response.headers);
    newHeaders.set('content-encoding', compressionMethod);
    newHeaders.set('content-length', compressedBody.length.toString());
    newHeaders.set('vary', 'Accept-Encoding');

    // Add compression info for debugging
    if (process.env.NODE_ENV === 'development') {
      newHeaders.set(
        'x-compression-ratio',
        (
          ((bodyBuffer.length - compressedBody.length) / bodyBuffer.length) *
          100
        ).toFixed(2) + '%'
      );
      newHeaders.set('x-original-size', bodyBuffer.length.toString());
      newHeaders.set('x-compressed-size', compressedBody.length.toString());
    }

    return new NextResponse(compressedBody as BodyInit, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Higher-order function to wrap API route handlers with compression
 */
export function compressedApiRoute(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: CompressionOptions
) {
  return withCompression(handler, options);
}

/**
 * Utility to get compression stats for monitoring
 */
export function getCompressionStats() {
  return {
    supportedEncodings: ['br', 'gzip'],
    defaultThreshold: DEFAULT_OPTIONS.threshold,
    defaultLevel: DEFAULT_OPTIONS.level,
    compressibleTypes: [
      'application/json',
      'application/javascript',
      'application/xml',
      'text/html',
      'text/css',
      'text/javascript',
      'text/plain',
      'text/xml',
      'image/svg+xml',
    ],
  };
}
