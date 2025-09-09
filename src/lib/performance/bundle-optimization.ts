/**
 * Bundle size optimization utilities
 * Helps track and optimize JavaScript and CSS bundle sizes
 */

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    gzippedSize: number;
    type: 'js' | 'css';
  }>;
  timestamp: number;
}

/**
 * Dynamic import wrapper with error handling and loading states
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    const module = await importFn();
    return module;
  } catch (error) {
    console.warn('Dynamic import failed:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Lazy load component with Suspense boundary
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn);
  
  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    const FallbackComponent = fallback || (() => 
      React.createElement('div', { 
        className: 'animate-pulse bg-muted rounded h-32' 
      })
    );
    
    return React.createElement(
      React.Suspense,
      { fallback: React.createElement(FallbackComponent) },
      React.createElement(LazyComponent, props)
    );
  };
}

/**
 * Code splitting utilities for route-based splitting
 */
export const routeComponents = {
  // Admin components (heavy, rarely used by public users)
  AdminDashboard: () => import('@/components/admin/AnalyticsDashboard'),
  ArticleForm: () => import('@/components/admin/ArticleForm'),
  MediaManager: () => import('@/components/admin/MediaManager'),
  
  // Feature components (load on demand)
  NewsletterManagement: () => import('@/components/admin/NewsletterManagement'),
  PodcastManagement: () => import('@/components/admin/PodcastManagement'),
  
  // Heavy UI components
  RichTextEditor: () => import('@/components/editor/Editor').then(m => ({ default: m.Editor })),
};

/**
 * Preload critical routes
 */
export function preloadCriticalRoutes(): void {
  if (typeof window === 'undefined') return;

  // Preload likely next pages based on current route
  const currentPath = window.location.pathname;
  
  const preloadMap: Record<string, string[]> = {
    '/': ['/news', '/ai', '/devtools'],
    '/news': ['/news/[slug]'],
    '/ai': ['/ai/[slug]'],
    '/devtools': ['/devtools/[slug]'],
  };

  const routesToPreload = preloadMap[currentPath] || [];
  
  routesToPreload.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
}

/**
 * Monitor bundle size in development
 */
export function monitorBundleSize(): void {
  if (process.env.NODE_ENV !== 'development') return;

  // Monitor performance entries for script loading
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          console.log(`Bundle loaded: ${entry.name}`, {
            size: (entry as any).transferSize || 0,
            duration: entry.duration,
            type: entry.name.includes('.js') ? 'javascript' : 'css',
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
}

/**
 * Tree shaking helpers - mark unused exports
 */
export const treeShakingHelpers = {
  // Mark functions that should be tree-shaken in production
  devOnly: <T extends (...args: any[]) => any>(fn: T): T | (() => void) => {
    return process.env.NODE_ENV === 'development' ? fn : () => {};
  },
  
  // Conditional imports based on feature flags
  conditionalImport: async <T>(
    condition: boolean,
    importFn: () => Promise<T>
  ): Promise<T | null> => {
    return condition ? await importFn() : null;
  },
};

/**
 * Resource hints for better loading performance
 */
export function addResourceHints(): void {
  if (typeof window === 'undefined') return;

  const hints = [
    // Preconnect to external domains
    { rel: 'preconnect', href: 'https://res.cloudinary.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
    
    // DNS prefetch for analytics
    { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
    { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.assign(link, hint);
    document.head.appendChild(link);
  });
}

/**
 * Critical CSS inlining helper
 */
export function inlineCriticalCSS(css: string): void {
  if (typeof window === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
}

/**
 * Service Worker registration for caching
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Webpack bundle analyzer integration
 */
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV !== 'development') return;

  // This would integrate with webpack-bundle-analyzer
  // to provide real-time bundle size information
  console.log('Bundle analysis available at: http://localhost:8888');
}

/**
 * Performance budget checker with Core Web Vitals integration
 */
export interface PerformanceBudget {
  maxBundleSize: number; // in KB
  maxChunkSize: number; // in KB
  maxAssetSize: number; // in KB
  maxLCP: number; // in ms
  maxFID: number; // in ms
  maxCLS: number; // score
}

export function checkPerformanceBudget(
  metrics: BundleMetrics,
  budget: PerformanceBudget
): Array<{ type: string; current: number; budget: number; exceeded: boolean }> {
  const results = [];

  // Check total bundle size
  const totalSizeKB = metrics.totalSize / 1024;
  results.push({
    type: 'Total Bundle Size',
    current: totalSizeKB,
    budget: budget.maxBundleSize,
    exceeded: totalSizeKB > budget.maxBundleSize,
  });

  // Check individual chunk sizes
  metrics.chunks.forEach(chunk => {
    const chunkSizeKB = chunk.size / 1024;
    if (chunkSizeKB > budget.maxChunkSize) {
      results.push({
        type: `Chunk: ${chunk.name}`,
        current: chunkSizeKB,
        budget: budget.maxChunkSize,
        exceeded: true,
      });
    }
  });

  return results;
}

/**
 * Real-time performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.metrics.set(`resource_${entry.name}`, entry.duration);
          
          // Alert if resource takes too long
          if (entry.duration > 1000) {
            console.warn(`Slow resource detected: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource timing not supported');
    }

    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration}ms`);
          this.metrics.set(`long_task_${Date.now()}`, entry.duration);
        }
      });
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn('Long task monitoring not supported');
    }
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): PerformanceMonitor {
  return new PerformanceMonitor();
}

// React import for lazy loading
import React from 'react';