/**
 * Compression utilities for manual testing and debugging
 */

import { gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionPercentage: string;
  method: 'gzip' | 'brotli';
  savings: number;
}

/**
 * Test compression on a string or buffer
 */
export async function testCompression(
  data: string | Buffer,
  method: 'gzip' | 'brotli' = 'gzip'
): Promise<CompressionResult> {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  const originalSize = buffer.length;

  let compressed: Buffer;

  if (method === 'brotli') {
    compressed = await brotliAsync(buffer, {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 6,
      },
    });
  } else {
    compressed = await gzipAsync(buffer, { level: 6 });
  }

  const compressedSize = compressed.length;
  const savings = originalSize - compressedSize;
  const compressionRatio = compressedSize / originalSize;
  const compressionPercentage =
    ((savings / originalSize) * 100).toFixed(2) + '%';

  return {
    originalSize,
    compressedSize,
    compressionRatio,
    compressionPercentage,
    method,
    savings,
  };
}

/**
 * Compare compression methods on the same data
 */
export async function compareCompression(data: string | Buffer): Promise<{
  gzip: CompressionResult;
  brotli: CompressionResult;
  winner: 'gzip' | 'brotli';
  difference: number;
}> {
  const [gzipResult, brotliResult] = await Promise.all([
    testCompression(data, 'gzip'),
    testCompression(data, 'brotli'),
  ]);

  const winner =
    brotliResult.compressedSize < gzipResult.compressedSize ? 'brotli' : 'gzip';
  const difference = Math.abs(
    gzipResult.compressedSize - brotliResult.compressedSize
  );

  return {
    gzip: gzipResult,
    brotli: brotliResult,
    winner,
    difference,
  };
}

/**
 * Generate sample JSON data for testing
 */
export function generateSampleData(
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  const baseArticle = {
    id: 'sample-id',
    title: 'Sample Article Title',
    slug: 'sample-article-title',
    summary:
      'This is a sample article summary that provides an overview of the content.',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    image: 'https://example.com/image.jpg',
    publishedAt: new Date().toISOString(),
    author: {
      id: 'author-id',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    category: {
      id: 'category-id',
      name: 'Technology',
      slug: 'technology',
    },
    tags: [
      { id: 'tag-1', name: 'JavaScript', slug: 'javascript' },
      { id: 'tag-2', name: 'React', slug: 'react' },
      { id: 'tag-3', name: 'Next.js', slug: 'nextjs' },
    ],
    metadata: {
      views: 1234,
      likes: 56,
      comments: 12,
      readTime: 5,
    },
  };

  let count: number;
  switch (size) {
    case 'small':
      count = 5;
      break;
    case 'large':
      count = 100;
      break;
    default:
      count = 25;
  }

  const articles = Array.from({ length: count }, (_, i) => ({
    ...baseArticle,
    id: `article-${i}`,
    title: `${baseArticle.title} ${i + 1}`,
    slug: `${baseArticle.slug}-${i + 1}`,
  }));

  return JSON.stringify(
    {
      articles,
      pagination: {
        page: 1,
        limit: count,
        total: count,
        pages: 1,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        size,
        count,
      },
    },
    null,
    2
  );
}

/**
 * Test compression on different types of API responses
 */
export async function testApiResponseCompression(): Promise<{
  small: { gzip: CompressionResult; brotli: CompressionResult };
  medium: { gzip: CompressionResult; brotli: CompressionResult };
  large: { gzip: CompressionResult; brotli: CompressionResult };
}> {
  const smallData = generateSampleData('small');
  const mediumData = generateSampleData('medium');
  const largeData = generateSampleData('large');

  const [smallResults, mediumResults, largeResults] = await Promise.all([
    compareCompression(smallData),
    compareCompression(mediumData),
    compareCompression(largeData),
  ]);

  return {
    small: { gzip: smallResults.gzip, brotli: smallResults.brotli },
    medium: { gzip: mediumResults.gzip, brotli: mediumResults.brotli },
    large: { gzip: largeResults.gzip, brotli: largeResults.brotli },
  };
}
