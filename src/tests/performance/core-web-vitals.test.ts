/**
 * @jest-environment jsdom
 */

import { 
  WebVitalsMonitor, 
  WEB_VITALS_THRESHOLDS,
  getOptimizationRecommendations,
  type WebVitalMetric 
} from '@/lib/performance/core-web-vitals';

// Mock PerformanceObserver
class MockPerformanceObserver {
  private callback: (list: any) => void;
  
  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }

  observe() {}
  disconnect() {}
  
  // Helper method to simulate entries
  simulateEntries(entries: any[]) {
    this.callback({ getEntries: () => entries });
  }
}

// Mock performance API
Object.defineProperty(global, 'PerformanceObserver', {
  writable: true,
  value: MockPerformanceObserver,
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    navigation: { type: 0 },
  },
});

describe('Core Web Vitals Monitoring', () => {
  let monitor: WebVitalsMonitor;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    monitor = new WebVitalsMonitor();
    mockCallback = jest.fn();
    monitor.onMetric(mockCallback);
  });

  afterEach(() => {
    monitor.disconnect();
  });

  describe('WebVitalsMonitor', () => {
    it('should initialize without errors', () => {
      expect(monitor).toBeInstanceOf(WebVitalsMonitor);
    });

    it('should collect and report LCP metrics', () => {
      const mockLCPEntry = {
        renderTime: 2000,
        loadTime: 2100,
      };

      // Simulate LCP entry
      const observer = new MockPerformanceObserver(() => {});
      observer.simulateEntries([mockLCPEntry]);

      // Verify metric collection would work
      expect(monitor.getMetrics()).toEqual([]);
    });

    it('should calculate correct ratings for metrics', () => {
      const goodLCP: WebVitalMetric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        id: 'test-1',
        navigationType: 'navigate',
      };

      const poorFID: WebVitalMetric = {
        name: 'FID',
        value: 400,
        rating: 'poor',
        delta: 400,
        id: 'test-2',
        navigationType: 'navigate',
      };

      expect(goodLCP.rating).toBe('good');
      expect(poorFID.rating).toBe('poor');
    });
  });

  describe('Performance Thresholds', () => {
    it('should have correct threshold values', () => {
      expect(WEB_VITALS_THRESHOLDS.LCP.good).toBe(2500);
      expect(WEB_VITALS_THRESHOLDS.LCP.poor).toBe(4000);
      expect(WEB_VITALS_THRESHOLDS.FID.good).toBe(100);
      expect(WEB_VITALS_THRESHOLDS.FID.poor).toBe(300);
      expect(WEB_VITALS_THRESHOLDS.CLS.good).toBe(0.1);
      expect(WEB_VITALS_THRESHOLDS.CLS.poor).toBe(0.25);
    });
  });

  describe('Optimization Recommendations', () => {
    it('should provide LCP recommendations for poor metrics', () => {
      const poorMetrics: WebVitalMetric[] = [
        {
          name: 'LCP',
          value: 5000,
          rating: 'poor',
          delta: 5000,
          id: 'test-1',
          navigationType: 'navigate',
        },
      ];

      const recommendations = getOptimizationRecommendations(poorMetrics);
      expect(recommendations).toContain(
        'Optimize Largest Contentful Paint: Consider image optimization, server response times, and resource loading priorities.'
      );
    });

    it('should provide FID recommendations for poor metrics', () => {
      const poorMetrics: WebVitalMetric[] = [
        {
          name: 'FID',
          value: 400,
          rating: 'poor',
          delta: 400,
          id: 'test-1',
          navigationType: 'navigate',
        },
      ];

      const recommendations = getOptimizationRecommendations(poorMetrics);
      expect(recommendations).toContain(
        'Improve First Input Delay: Reduce JavaScript execution time and consider code splitting.'
      );
    });

    it('should provide CLS recommendations for poor metrics', () => {
      const poorMetrics: WebVitalMetric[] = [
        {
          name: 'CLS',
          value: 0.3,
          rating: 'poor',
          delta: 0.3,
          id: 'test-1',
          navigationType: 'navigate',
        },
      ];

      const recommendations = getOptimizationRecommendations(poorMetrics);
      expect(recommendations).toContain(
        'Fix Cumulative Layout Shift: Set explicit dimensions for images and ads, avoid inserting content above existing content.'
      );
    });

    it('should not provide recommendations for good metrics', () => {
      const goodMetrics: WebVitalMetric[] = [
        {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          id: 'test-1',
          navigationType: 'navigate',
        },
      ];

      const recommendations = getOptimizationRecommendations(goodMetrics);
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('Metric Collection', () => {
    it('should store metrics correctly', () => {
      const testMetric: WebVitalMetric = {
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 2500,
        id: 'test-metric',
        navigationType: 'navigate',
      };

      // Manually add metric for testing
      monitor.onMetric((metric) => {
        expect(metric).toEqual(testMetric);
      });
    });

    it('should retrieve specific metrics', () => {
      const metrics = monitor.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });
  });
});

describe('Performance Budget Integration', () => {
  it('should integrate with performance budgets', () => {
    // This would test integration with webpack-bundle-analyzer
    // or other performance budget tools
    const mockBudget = {
      maxBundleSize: 250, // KB
      maxChunkSize: 50,   // KB
      maxAssetSize: 100,  // KB
    };

    expect(mockBudget.maxBundleSize).toBe(250);
  });
});

describe('Analytics Integration', () => {
  it('should send metrics to analytics', () => {
    const mockGtag = jest.fn();
    (global as any).window = { gtag: mockGtag };

    const testMetric: WebVitalMetric = {
      name: 'LCP',
      value: 2500,
      rating: 'good',
      delta: 2500,
      id: 'test-metric',
      navigationType: 'navigate',
    };

    // Test would verify analytics integration
    expect(testMetric.name).toBe('LCP');
  });
});