'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import {
  getOptimizedImageUrl,
  generateBlurDataURL,
  imageOptimizationConfig,
  measureImagePerformance,
  type OptimizedImageProps,
} from '@/lib/performance/image-optimization';

interface EnhancedImageProps extends OptimizedImageProps {
  variant?: 'hero' | 'thumbnail' | 'avatar' | 'lcp';
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  showLoadingState?: boolean;
  onLoadComplete?: () => void;
  onError?: () => void;
  className?: string;
}

/**
 * Optimized Image component with lazy loading, blur placeholder, and Core Web Vitals optimization
 */
export default function OptimizedImage({
  src,
  alt,
  variant = 'thumbnail',
  aspectRatio,
  showLoadingState = true,
  onLoadComplete,
  onError,
  className,
  priority,
  quality,
  format,
  blur = true,
  responsive = true,
  ...props
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority || false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get configuration based on variant
  const config = imageOptimizationConfig[variant];
  const finalPriority = priority ?? config.priority;
  const finalQuality = quality ?? config.quality;
  const finalSizes = props.sizes ?? config.sizes;
  const finalLoading = props.loading ?? (config as any).loading ?? 'lazy';

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (finalPriority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [finalPriority, isInView]);

  // Performance measurement
  useEffect(() => {
    if (imgRef.current && !hasError) {
      measureImagePerformance(imgRef.current);
    }
  }, [hasError]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate optimized image URL
  const optimizedSrc = getOptimizedImageUrl(src, {
    quality: finalQuality,
    format: format || 'auto',
  });

  // Generate blur placeholder
  const blurDataURL = blur ? generateBlurDataURL(src) : undefined;

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  const containerClasses = cn(
    'relative overflow-hidden',
    aspectRatio && aspectRatioClasses[aspectRatio],
    className
  );

  const imageClasses = cn(
    'transition-opacity duration-300',
    isLoading && showLoadingState ? 'opacity-0' : 'opacity-100'
  );

  // Error fallback
  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={cn(
          containerClasses,
          'bg-muted flex items-center justify-center text-muted-foreground'
        )}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        <div className="text-center p-4">
          <svg
            className="w-8 h-8 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isInView && !finalPriority) {
    return (
      <div
        ref={containerRef}
        className={cn(
          containerClasses,
          'bg-muted animate-pulse'
        )}
        role="img"
        aria-label={`Loading image: ${alt}`}
      >
        {showLoadingState && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Loading skeleton */}
      {isLoading && showLoadingState && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
        </div>
      )}

      {/* Optimized Image */}
      <Image
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        fill={!props.width && !props.height}
        priority={finalPriority}
        quality={finalQuality}
        sizes={responsive ? finalSizes : undefined}
        loading={finalLoading}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={imageClasses}
        {...props}
      />

      {/* Accessibility enhancements */}
      <div className="sr-only" aria-live="polite">
        {isLoading ? `Loading image: ${alt}` : `Image loaded: ${alt}`}
      </div>
    </div>
  );
}

/**
 * Specialized image components for different use cases
 */

export function HeroImage(props: Omit<EnhancedImageProps, 'variant'>) {
  return (
    <OptimizedImage
      {...props}
      variant="hero"
      priority={true}
      aspectRatio="video"
    />
  );
}

export function ThumbnailImage(props: Omit<EnhancedImageProps, 'variant'>) {
  return (
    <OptimizedImage
      {...props}
      variant="thumbnail"
      aspectRatio="video"
    />
  );
}

export function AvatarImage(props: Omit<EnhancedImageProps, 'variant'>) {
  return (
    <OptimizedImage
      {...props}
      variant="avatar"
      aspectRatio="square"
      className={cn('rounded-full', props.className)}
    />
  );
}

export function LCPImage(props: Omit<EnhancedImageProps, 'variant'>) {
  return (
    <OptimizedImage
      {...props}
      variant="lcp"
      priority={true}
    />
  );
}