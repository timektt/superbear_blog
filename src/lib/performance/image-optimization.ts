/**
 * Enhanced image optimization utilities for Cloudinary integration
 * Implements lazy loading, responsive images, and Core Web Vitals optimization
 */

import { ImageProps } from 'next/image';

// Performance monitoring for images
interface ImageLoadMetrics {
  src: string;
  loadTime: number;
  size: number;
  format: string;
  cached: boolean;
}

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blur?: boolean;
  responsive?: boolean;
}

/**
 * Generate optimized Cloudinary URL with transformations
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    blur?: boolean;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
  } = {}
): string {
  // If it's already a Cloudinary URL, enhance it
  if (src.includes('cloudinary.com')) {
    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      blur = false,
      crop = 'fill',
    } = options;

    // Build transformation string
    const transformations = [];
    
    if (width || height) {
      transformations.push(`c_${crop}`);
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
    }
    
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    
    if (blur) {
      transformations.push('e_blur:300');
    }

    // Insert transformations into Cloudinary URL
    const transformString = transformations.join(',');
    return src.replace('/upload/', `/upload/${transformString}/`);
  }

  // For non-Cloudinary images, return as-is
  return src;
}

/**
 * Generate responsive image sizes for different breakpoints
 */
export function getResponsiveSizes(
  breakpoints: { [key: string]: number } = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  }
): string {
  const sizes = [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 90vw',
    '(max-width: 1024px) 80vw',
    '(max-width: 1280px) 70vw',
    '60vw',
  ];

  return sizes.join(', ');
}

/**
 * Generate blur placeholder for images
 */
export function generateBlurDataURL(
  src: string,
  width: number = 10,
  height: number = 10
): string {
  if (src.includes('cloudinary.com')) {
    return getOptimizedImageUrl(src, {
      width,
      height,
      quality: 1,
      blur: true,
    });
  }

  // Fallback blur data URL
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`
  ).toString('base64')}`;
}

/**
 * Preload critical images for better LCP
 */
export function preloadImage(src: string, priority: boolean = false): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = priority ? 'preload' : 'prefetch';
  link.as = 'image';
  link.href = src;
  
  // Add to head
  document.head.appendChild(link);
}

/**
 * Intersection Observer for lazy loading images
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(
    options: IntersectionObserverInit = {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  ) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
        this.images.delete(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }

    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }

    img.classList.remove('lazy');
    img.classList.add('loaded');
  }

  observe(img: HTMLImageElement): void {
    if (this.observer) {
      this.images.add(img);
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

/**
 * Enhanced image performance metrics with detailed tracking
 */
export function measureImagePerformance(img: HTMLImageElement): void {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name === img.src) {
        const metrics: ImageLoadMetrics = {
          src: img.src,
          loadTime: entry.duration,
          size: (entry as any).transferSize || 0,
          format: img.src.includes('.webp') ? 'webp' : img.src.includes('.avif') ? 'avif' : 'jpg',
          cached: entry.duration < 50, // Likely cached if very fast
        };

        // Report to analytics
        if (window.gtag) {
          window.gtag('event', 'image_performance', {
            load_time: metrics.loadTime,
            image_size: metrics.size,
            image_format: metrics.format,
            was_cached: metrics.cached,
          });
        }

        // Store for Core Web Vitals correlation
        if ('performance' in window && 'mark' in performance) {
          performance.mark(`image-loaded-${Date.now()}`);
        }
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (e) {
    // Fallback to basic timing
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      if (window.gtag) {
        window.gtag('event', 'image_load_time', {
          load_time: loadTime,
          image_src: img.src,
        });
      }

      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };

    const handleError = () => {
      const errorTime = performance.now() - startTime;
      
      if (window.gtag) {
        window.gtag('event', 'image_load_error', {
          error_time: errorTime,
          image_src: img.src,
        });
      }

      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
  }
}

/**
 * Core Web Vitals optimization for images
 */
export const imageOptimizationConfig = {
  // Largest Contentful Paint (LCP) optimization
  lcp: {
    priority: true,
    quality: 90,
    format: 'auto' as const,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw',
  },
  
  // Above-the-fold images
  hero: {
    priority: true,
    quality: 85,
    format: 'auto' as const,
    loading: 'eager' as const,
    sizes: '100vw',
  },
  
  // Article thumbnails
  thumbnail: {
    priority: false,
    quality: 80,
    format: 'auto' as const,
    loading: 'lazy' as const,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  },
  
  // Avatar images
  avatar: {
    priority: false,
    quality: 75,
    format: 'auto' as const,
    loading: 'lazy' as const,
    sizes: '(max-width: 640px) 40px, 48px',
  },
} as const;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, parameters: Record<string, any>) => void;
  }
}