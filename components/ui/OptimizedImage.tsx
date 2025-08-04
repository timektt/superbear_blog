'use client';

import { useState } from 'react';
import {
  getOptimizedImageUrl,
  getPublicIdFromUrl,
} from '@/lib/cloudinary-client';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 'auto',
  className = '',
  priority = false,
  sizes,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const publicId = getPublicIdFromUrl(src);

  // Use Cloudinary optimization if it's a Cloudinary image
  const optimizedSrc = publicId
    ? getOptimizedImageUrl(publicId, width, height, quality)
    : src;

  // Generate responsive srcSet for Cloudinary images
  const generateSrcSet = (): string | undefined => {
    if (!publicId) return undefined;

    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    return breakpoints
      .map(
        (w) => `${getOptimizedImageUrl(publicId, w, undefined, quality)} ${w}w`
      )
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        srcSet={generateSrcSet()}
        sizes={sizes}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}
