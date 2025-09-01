/**
 * Core Web Vitals monitoring and optimization utilities
 * Tracks LCP, FID, CLS, and other performance metrics
 */

export interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache';
}

export interface PerformanceThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  FCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
  INP: { good: number; poor: number };
}

// Web Vitals thresholds (in milliseconds for timing metrics)
export const WEB_VITALS_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric value
 */
function getRating(name: WebVitalMetric['name'], value: number): WebVitalMetric['rating'] {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Core Web Vitals monitoring class
 */
export class WebVitalsMonitor {
  private metrics: Map<string, WebVitalMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private callbacks: ((metric: WebVitalMetric) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  /**
   * Add callback for when metrics are collected
   */
  onMetric(callback: (metric: WebVitalMetric) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): WebVitalMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific metric
   */
  getMetric(name: WebVitalMetric['name']): WebVitalMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
    
    // Time to First Byte (TTFB)
    this.observeTTFB();
    
    // Interaction to Next Paint (INP)
    this.observeINP();
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime: number;
        loadTime: number;
      };

      if (lastEntry) {
        const value = lastEntry.renderTime || lastEntry.loadTime;
        this.reportMetric({
          name: 'LCP',
          value,
          rating: getRating('LCP', value),
          delta: value,
          id: this.generateId(),
          navigationType: this.getNavigationType(),
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('LCP', observer);
    } catch (e) {
      // Browser doesn't support LCP
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart && entry.startTime) {
          const value = entry.processingStart - entry.startTime;
          this.reportMetric({
            name: 'FID',
            value,
            rating: getRating('FID', value),
            delta: value,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('FID', observer);
    } catch (e) {
      // Browser doesn't support FID
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (
            sessionValue &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            this.reportMetric({
              name: 'CLS',
              value: clsValue,
              rating: getRating('CLS', clsValue),
              delta: clsValue,
              id: this.generateId(),
              navigationType: this.getNavigationType(),
            });
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('CLS', observer);
    } catch (e) {
      // Browser doesn't support CLS
    }
  }

  /**
   * Observe First Contentful Paint
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.reportMetric({
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
            delta: entry.startTime,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('FCP', observer);
    } catch (e) {
      // Browser doesn't support paint timing
    }
  }

  /**
   * Observe Time to First Byte
   */
  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.responseStart && entry.requestStart) {
          const value = entry.responseStart - entry.requestStart;
          this.reportMetric({
            name: 'TTFB',
            value,
            rating: getRating('TTFB', value),
            delta: value,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('TTFB', observer);
    } catch (e) {
      // Browser doesn't support navigation timing
    }
  }

  /**
   * Observe Interaction to Next Paint
   */
  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return;

    let longestInteraction = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.interactionId && entry.duration > longestInteraction) {
          longestInteraction = entry.duration;
          this.reportMetric({
            name: 'INP',
            value: longestInteraction,
            rating: getRating('INP', longestInteraction),
            delta: longestInteraction,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['event'] });
      this.observers.set('INP', observer);
    } catch (e) {
      // Browser doesn't support event timing
    }
  }

  /**
   * Report metric to callbacks
   */
  private reportMetric(metric: WebVitalMetric): void {
    this.metrics.set(metric.name, metric);
    this.callbacks.forEach(callback => callback(metric));
  }

  /**
   * Generate unique ID for metric
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get navigation type
   */
  private getNavigationType(): WebVitalMetric['navigationType'] {
    if ('navigation' in performance) {
      const nav = performance.navigation as any;
      switch (nav.type) {
        case 0: return 'navigate';
        case 1: return 'reload';
        case 2: return 'back-forward';
        default: return 'navigate';
      }
    }
    return 'navigate';
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Global Web Vitals monitor instance
 */
export const webVitalsMonitor = new WebVitalsMonitor();

/**
 * Send Web Vitals to analytics
 */
export function sendToAnalytics(metric: WebVitalMetric): void {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_parameter_1: metric.rating,
      custom_parameter_2: metric.navigationType,
    });
  }

  // Send to custom analytics endpoint
  if (typeof window !== 'undefined') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail - don't block user experience
    });
  }
}

/**
 * Performance optimization recommendations based on metrics
 */
export function getOptimizationRecommendations(metrics: WebVitalMetric[]): string[] {
  const recommendations: string[] = [];

  metrics.forEach(metric => {
    if (metric.rating === 'poor') {
      switch (metric.name) {
        case 'LCP':
          recommendations.push(
            'Optimize Largest Contentful Paint: Consider image optimization, server response times, and resource loading priorities.'
          );
          break;
        case 'FID':
          recommendations.push(
            'Improve First Input Delay: Reduce JavaScript execution time and consider code splitting.'
          );
          break;
        case 'CLS':
          recommendations.push(
            'Fix Cumulative Layout Shift: Set explicit dimensions for images and ads, avoid inserting content above existing content.'
          );
          break;
        case 'FCP':
          recommendations.push(
            'Optimize First Contentful Paint: Improve server response times and eliminate render-blocking resources.'
          );
          break;
        case 'TTFB':
          recommendations.push(
            'Reduce Time to First Byte: Optimize server performance, use CDN, and implement caching.'
          );
          break;
        case 'INP':
          recommendations.push(
            'Improve Interaction to Next Paint: Optimize event handlers and reduce main thread blocking.'
          );
          break;
      }
    }
  });

  return recommendations;
}

/**
 * Initialize Web Vitals monitoring with analytics
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  webVitalsMonitor.onMetric(sendToAnalytics);

  // Report metrics on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const metrics = webVitalsMonitor.getMetrics();
      metrics.forEach(sendToAnalytics);
    }
  });
}

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, parameters: Record<string, any>) => void;
  }
}