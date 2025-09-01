/**
 * Comprehensive performance and accessibility optimization manager
 * Coordinates all optimization strategies for Core Web Vitals and WCAG compliance
 */

import { initWebVitals, webVitalsMonitor, type WebVitalMetric } from './core-web-vitals';
import { initPerformanceMonitoring, type PerformanceMonitor } from './bundle-optimization';
import { initAccessibilityMonitoring, type AccessibilityMonitor } from '../accessibility/testing-utils';
import { preloadCriticalRoutes, addResourceHints } from './bundle-optimization';

export interface OptimizationConfig {
  enableWebVitals: boolean;
  enableAccessibilityMonitoring: boolean;
  enablePerformanceMonitoring: boolean;
  enableResourceHints: boolean;
  enableCriticalRoutePreloading: boolean;
  reportToAnalytics: boolean;
}

export interface OptimizationReport {
  webVitals: WebVitalMetric[];
  performanceIssues: string[];
  accessibilityIssues: number;
  recommendations: string[];
  timestamp: number;
}

/**
 * Main optimization manager class
 */
export class OptimizationManager {
  private config: OptimizationConfig;
  private performanceMonitor?: PerformanceMonitor;
  private accessibilityMonitor?: AccessibilityMonitor;
  private isInitialized = false;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableWebVitals: true,
      enableAccessibilityMonitoring: process.env.NODE_ENV === 'development',
      enablePerformanceMonitoring: true,
      enableResourceHints: true,
      enableCriticalRoutePreloading: true,
      reportToAnalytics: process.env.NODE_ENV === 'production',
      ...config,
    };
  }

  /**
   * Initialize all optimization systems
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Initialize Web Vitals monitoring
      if (this.config.enableWebVitals) {
        initWebVitals();
        console.log('✅ Web Vitals monitoring initialized');
      }

      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor = initPerformanceMonitoring();
        console.log('✅ Performance monitoring initialized');
      }

      // Initialize accessibility monitoring (dev only)
      if (this.config.enableAccessibilityMonitoring) {
        this.accessibilityMonitor = initAccessibilityMonitoring();
        console.log('✅ Accessibility monitoring initialized');
      }

      // Add resource hints
      if (this.config.enableResourceHints) {
        addResourceHints();
        console.log('✅ Resource hints added');
      }

      // Preload critical routes
      if (this.config.enableCriticalRoutePreloading) {
        preloadCriticalRoutes();
        console.log('✅ Critical routes preloaded');
      }

      // Set up periodic reporting
      if (this.config.reportToAnalytics) {
        this.setupPeriodicReporting();
      }

      this.isInitialized = true;
      console.log('🚀 Optimization Manager fully initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Optimization Manager:', error);
    }
  }

  /**
   * Generate comprehensive optimization report
   */
  async generateReport(): Promise<OptimizationReport> {
    const webVitals = webVitalsMonitor.getMetrics();
    const performanceIssues: string[] = [];
    const recommendations: string[] = [];

    // Analyze Web Vitals
    webVitals.forEach(metric => {
      if (metric.rating === 'poor') {
        performanceIssues.push(`Poor ${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'}`);
        
        switch (metric.name) {
          case 'LCP':
            recommendations.push('Optimize images and reduce server response time for better LCP');
            break;
          case 'FID':
            recommendations.push('Reduce JavaScript execution time and implement code splitting');
            break;
          case 'CLS':
            recommendations.push('Set explicit dimensions for images and avoid layout shifts');
            break;
        }
      }
    });

    // Check performance metrics
    const performanceMetrics = this.performanceMonitor?.getMetrics();
    if (performanceMetrics) {
      for (const [key, value] of performanceMetrics) {
        if (key.includes('long_task') && value > 50) {
          performanceIssues.push(`Long task detected: ${value}ms`);
          recommendations.push('Break up long-running JavaScript tasks');
        }
      }
    }

    // Check accessibility issues
    const accessibilityIssues = this.accessibilityMonitor?.getIssues().length || 0;
    if (accessibilityIssues > 0) {
      recommendations.push(`Fix ${accessibilityIssues} accessibility issues for better WCAG compliance`);
    }

    return {
      webVitals,
      performanceIssues,
      accessibilityIssues,
      recommendations,
      timestamp: Date.now(),
    };
  }

  /**
   * Set up periodic reporting to analytics
   */
  private setupPeriodicReporting(): void {
    // Report metrics every 30 seconds
    setInterval(async () => {
      const report = await this.generateReport();
      
      // Send to analytics if there are issues
      if (report.performanceIssues.length > 0 || report.accessibilityIssues > 0) {
        this.sendReportToAnalytics(report);
      }
    }, 30000);

    // Report on page visibility change
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'hidden') {
        const report = await this.generateReport();
        this.sendReportToAnalytics(report);
      }
    });
  }

  /**
   * Send optimization report to analytics
   */
  private sendReportToAnalytics(report: OptimizationReport): void {
    if (typeof window !== 'undefined' && window.gtag) {
      // Send Web Vitals
      report.webVitals.forEach(metric => {
        window.gtag?.('event', 'web_vital', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
        });
      });

      // Send performance issues
      if (report.performanceIssues.length > 0) {
        window.gtag?.('event', 'performance_issue', {
          issue_count: report.performanceIssues.length,
          issues: report.performanceIssues.join(', '),
        });
      }

      // Send accessibility issues
      if (report.accessibilityIssues > 0) {
        window.gtag?.('event', 'accessibility_issue', {
          issue_count: report.accessibilityIssues,
        });
      }
    }

    // Also send to custom analytics endpoint
    fetch('/api/analytics/optimization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(() => {
      // Silently fail - don't block user experience
    });
  }

  /**
   * Get current optimization status
   */
  getStatus(): {
    initialized: boolean;
    webVitalsActive: boolean;
    performanceMonitoringActive: boolean;
    accessibilityMonitoringActive: boolean;
  } {
    return {
      initialized: this.isInitialized,
      webVitalsActive: this.config.enableWebVitals,
      performanceMonitoringActive: !!this.performanceMonitor,
      accessibilityMonitoringActive: !!this.accessibilityMonitor,
    };
  }

  /**
   * Cleanup all monitoring
   */
  cleanup(): void {
    this.performanceMonitor?.disconnect();
    this.accessibilityMonitor?.disconnect();
    webVitalsMonitor.disconnect();
    this.isInitialized = false;
  }
}

/**
 * Global optimization manager instance
 */
export const optimizationManager = new OptimizationManager();

/**
 * Initialize optimization with default config
 */
export async function initOptimization(config?: Partial<OptimizationConfig>): Promise<void> {
  if (config) {
    const manager = new OptimizationManager(config);
    await manager.initialize();
  } else {
    await optimizationManager.initialize();
  }
}

/**
 * Performance and accessibility testing utilities for development
 */
export const devTools = {
  /**
   * Run comprehensive audit
   */
  async audit(): Promise<OptimizationReport> {
    return await optimizationManager.generateReport();
  },

  /**
   * Test Core Web Vitals thresholds
   */
  testWebVitals(): void {
    const metrics = webVitalsMonitor.getMetrics();
    console.group('🔍 Core Web Vitals Status');
    
    if (metrics.length === 0) {
      console.log('⏳ No metrics collected yet. Interact with the page to generate metrics.');
    } else {
      metrics.forEach(metric => {
        const icon = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(`${icon} ${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`);
      });
    }
    
    console.groupEnd();
  },

  /**
   * Test accessibility compliance
   */
  async testAccessibility(): Promise<void> {
    const issues = optimizationManager.accessibilityMonitor?.getIssues() || [];
    
    console.group('♿ Accessibility Status');
    
    if (issues.length === 0) {
      console.log('✅ No accessibility issues detected');
    } else {
      console.log(`❌ ${issues.length} accessibility issues found:`);
      issues.forEach(issue => {
        console.log(`  • ${issue.description} (${issue.impact} impact)`);
      });
    }
    
    console.groupEnd();
  },

  /**
   * Get optimization status
   */
  status(): void {
    const status = optimizationManager.getStatus();
    console.group('🚀 Optimization Manager Status');
    console.log('Initialized:', status.initialized ? '✅' : '❌');
    console.log('Web Vitals:', status.webVitalsActive ? '✅' : '❌');
    console.log('Performance Monitoring:', status.performanceMonitoringActive ? '✅' : '❌');
    console.log('Accessibility Monitoring:', status.accessibilityMonitoringActive ? '✅' : '❌');
    console.groupEnd();
  },
};

// Make dev tools available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).optimizationDevTools = devTools;
  console.log('🛠️ Optimization dev tools available at window.optimizationDevTools');
}

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, parameters: Record<string, any>) => void;
    optimizationDevTools?: typeof devTools;
  }
}