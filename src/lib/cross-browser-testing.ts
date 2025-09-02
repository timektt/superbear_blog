/**
 * Cross-browser testing and compatibility utilities
 * Provides feature detection, polyfills, and browser-specific optimizations
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  supportsModernFeatures: boolean;
}

export interface FeatureSupport {
  intersectionObserver: boolean;
  resizeObserver: boolean;
  webp: boolean;
  avif: boolean;
  backdropFilter: boolean;
  containerQueries: boolean;
  cssGrid: boolean;
  flexbox: boolean;
  customProperties: boolean;
  focusVisible: boolean;
  scrollBehavior: boolean;
  aspectRatio: boolean;
  gap: boolean;
  stickyPosition: boolean;
  webAnimations: boolean;
  serviceWorker: boolean;
  webShare: boolean;
  clipboardAPI: boolean;
}

/**
 * Detect browser information
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      version: '0',
      engine: 'unknown',
      platform: 'server',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      supportsModernFeatures: false,
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Browser detection
  let name = 'unknown';
  let version = '0';
  let engine = 'unknown';

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '0';
    engine = 'blink';
  } else if (userAgent.includes('Firefox')) {
    name = 'firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '0';
    engine = 'gecko';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || '0';
    engine = 'webkit';
  } else if (userAgent.includes('Edg')) {
    name = 'edge';
    version = userAgent.match(/Edg\/(\d+)/)?.[1] || '0';
    engine = 'blink';
  }

  // Device detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  // Modern features support (basic check)
  const supportsModernFeatures = 
    'IntersectionObserver' in window &&
    'ResizeObserver' in window &&
    CSS.supports('display', 'grid') &&
    CSS.supports('backdrop-filter', 'blur(10px)');

  return {
    name,
    version,
    engine,
    platform,
    isMobile,
    isTablet,
    isDesktop,
    supportsModernFeatures,
  };
}

/**
 * Check feature support across browsers
 */
export function checkFeatureSupport(): FeatureSupport {
  if (typeof window === 'undefined') {
    return {
      intersectionObserver: false,
      resizeObserver: false,
      webp: false,
      avif: false,
      backdropFilter: false,
      containerQueries: false,
      cssGrid: false,
      flexbox: false,
      customProperties: false,
      focusVisible: false,
      scrollBehavior: false,
      aspectRatio: false,
      gap: false,
      stickyPosition: false,
      webAnimations: false,
      serviceWorker: false,
      webShare: false,
      clipboardAPI: false,
    };
  }

  return {
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    webp: checkImageFormat('webp'),
    avif: checkImageFormat('avif'),
    backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
    containerQueries: CSS.supports('container-type', 'inline-size'),
    cssGrid: CSS.supports('display', 'grid'),
    flexbox: CSS.supports('display', 'flex'),
    customProperties: CSS.supports('--custom', 'property'),
    focusVisible: CSS.supports('selector(:focus-visible)'),
    scrollBehavior: CSS.supports('scroll-behavior', 'smooth'),
    aspectRatio: CSS.supports('aspect-ratio', '16/9'),
    gap: CSS.supports('gap', '1rem'),
    stickyPosition: CSS.supports('position', 'sticky'),
    webAnimations: 'animate' in document.createElement('div'),
    serviceWorker: 'serviceWorker' in navigator,
    webShare: 'share' in navigator,
    clipboardAPI: 'clipboard' in navigator,
  };
}

/**
 * Check image format support
 */
function checkImageFormat(format: 'webp' | 'avif'): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const dataURL = canvas.toDataURL(`image/${format}`);
    return dataURL.startsWith(`data:image/${format}`);
  } catch {
    return false;
  }
}

/**
 * Apply browser-specific optimizations
 */
export function applyBrowserOptimizations(): void {
  if (typeof window === 'undefined') return;

  const browser = detectBrowser();
  const features = checkFeatureSupport();

  // Add browser classes to document
  document.documentElement.classList.add(`browser-${browser.name}`);
  document.documentElement.classList.add(`engine-${browser.engine}`);
  
  if (browser.isMobile) document.documentElement.classList.add('is-mobile');
  if (browser.isTablet) document.documentElement.classList.add('is-tablet');
  if (browser.isDesktop) document.documentElement.classList.add('is-desktop');

  // Add feature support classes
  Object.entries(features).forEach(([feature, supported]) => {
    document.documentElement.classList.add(
      supported ? `supports-${feature}` : `no-${feature}`
    );
  });

  // Safari-specific optimizations
  if (browser.name === 'safari') {
    // Fix Safari's aggressive back/forward cache
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    });

    // Improve Safari scroll performance
    document.body.style.webkitOverflowScrolling = 'touch';
  }

  // Firefox-specific optimizations
  if (browser.name === 'firefox') {
    // Improve Firefox scroll performance
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  // Chrome-specific optimizations
  if (browser.name === 'chrome') {
    // Enable hardware acceleration for animations
    const style = document.createElement('style');
    style.textContent = `
      .animate-fade-in-up,
      .animate-fade-in-down,
      .animate-scale-in,
      .animate-slide-in-right {
        will-change: transform, opacity;
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);
  }

  // Polyfills for older browsers
  loadPolyfills(features);
}

/**
 * Load necessary polyfills
 */
async function loadPolyfills(features: FeatureSupport): Promise<void> {
  const polyfills: Promise<void>[] = [];

  // IntersectionObserver polyfill
  if (!features.intersectionObserver) {
    polyfills.push(
      import('intersection-observer').then(() => {
        console.log('IntersectionObserver polyfill loaded');
      }).catch(() => {
        console.warn('Failed to load IntersectionObserver polyfill');
      })
    );
  }

  // ResizeObserver polyfill
  if (!features.resizeObserver) {
    polyfills.push(
      import('@juggle/resize-observer').then(({ ResizeObserver }) => {
        window.ResizeObserver = ResizeObserver;
        console.log('ResizeObserver polyfill loaded');
      }).catch(() => {
        console.warn('Failed to load ResizeObserver polyfill');
      })
    );
  }

  // Focus-visible polyfill
  if (!features.focusVisible) {
    polyfills.push(
      import('focus-visible').then(() => {
        console.log('focus-visible polyfill loaded');
      }).catch(() => {
        console.warn('Failed to load focus-visible polyfill');
      })
    );
  }

  await Promise.allSettled(polyfills);
}

/**
 * Test responsive design across different screen sizes
 */
export function testResponsiveDesign(): void {
  if (typeof window === 'undefined') return;

  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  const currentWidth = window.innerWidth;
  let activeBreakpoint = 'xs';

  Object.entries(breakpoints).forEach(([name, width]) => {
    if (currentWidth >= width) {
      activeBreakpoint = name;
    }
  });

  document.documentElement.setAttribute('data-breakpoint', activeBreakpoint);
  
  // Log responsive information in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Current breakpoint: ${activeBreakpoint} (${currentWidth}px)`);
  }
}

/**
 * Test animations and transitions
 */
export function testAnimations(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    document.documentElement.classList.add('reduce-motion');
    return false;
  }

  // Test CSS animation support
  const testElement = document.createElement('div');
  testElement.style.animation = 'test 1s';
  
  const supportsAnimations = testElement.style.animation !== '';
  
  if (supportsAnimations) {
    document.documentElement.classList.add('supports-animations');
  } else {
    document.documentElement.classList.add('no-animations');
  }

  return supportsAnimations;
}

/**
 * Test color scheme support
 */
export function testColorScheme(): void {
  if (typeof window === 'undefined') return;

  const supportsColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
  
  if (supportsColorScheme) {
    document.documentElement.classList.add('supports-color-scheme');
    
    // Listen for color scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('prefers-dark');
      } else {
        document.documentElement.classList.remove('prefers-dark');
      }
    });
  }
}

/**
 * Initialize all cross-browser tests and optimizations
 */
export function initializeCrossBrowserSupport(): void {
  if (typeof window === 'undefined') return;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      runInitialization();
    });
  } else {
    runInitialization();
  }
}

function runInitialization(): void {
  applyBrowserOptimizations();
  testResponsiveDesign();
  testAnimations();
  testColorScheme();

  // Listen for resize events
  window.addEventListener('resize', testResponsiveDesign);

  // Log browser information in development
  if (process.env.NODE_ENV === 'development') {
    const browser = detectBrowser();
    const features = checkFeatureSupport();
    
    console.group('Cross-browser Support Information');
    console.log('Browser:', browser);
    console.log('Feature Support:', features);
    console.groupEnd();
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  private static marks: Map<string, number> = new Map();

  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  static measure(name: string, startMark: string, endMark?: string): number {
    if (typeof performance === 'undefined') return 0;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const entries = performance.getEntriesByName(name, 'measure');
      return entries[entries.length - 1]?.duration || 0;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return 0;
    }
  }

  static getNavigationTiming(): Record<string, number> {
    if (typeof performance === 'undefined' || !performance.navigation) {
      return {};
    }

    const timing = performance.timing;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domContentLoadedEventEnd - timing.navigationStart,
      load: timing.loadEventEnd - timing.navigationStart,
    };
  }

  static getCoreWebVitals(): Promise<Record<string, number>> {
    return new Promise((resolve) => {
      const vitals: Record<string, number> = {};

      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FID (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              vitals.fid = entry.processingStart - entry.startTime;
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // CLS (Cumulative Layout Shift)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            vitals.cls = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Resolve after a delay to collect metrics
          setTimeout(() => resolve(vitals), 3000);
        } catch (error) {
          console.warn('Core Web Vitals measurement failed:', error);
          resolve(vitals);
        }
      } else {
        resolve(vitals);
      }
    });
  }
}