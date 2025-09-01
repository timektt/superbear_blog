'use client';

import { useEffect, useState } from 'react';
import { initWebVitals, webVitalsMonitor, type WebVitalMetric } from '@/lib/performance/core-web-vitals';

interface PerformanceMonitorProps {
  enableReporting?: boolean;
  showDebugInfo?: boolean;
}

/**
 * Performance monitoring component that tracks Core Web Vitals
 * and provides real-time performance insights
 */
export default function PerformanceMonitor({
  enableReporting = true,
  showDebugInfo = false,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);
  const [isVisible, setIsVisible] = useState(showDebugInfo);

  useEffect(() => {
    if (!enableReporting) return;

    // Initialize Web Vitals monitoring
    initWebVitals();

    // Listen for new metrics
    const handleMetric = (metric: WebVitalMetric) => {
      setMetrics(prev => {
        const updated = prev.filter(m => m.name !== metric.name);
        return [...updated, metric];
      });
    };

    webVitalsMonitor.onMetric(handleMetric);

    // Keyboard shortcut to toggle debug info (Ctrl+Shift+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      webVitalsMonitor.disconnect();
    };
  }, [enableReporting]);

  if (!isVisible || metrics.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Performance Metrics</h3>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          aria-label="Close performance monitor"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        {metrics.map((metric) => (
          <div key={metric.name} className="flex justify-between items-center">
            <span className="font-medium">{metric.name}:</span>
            <div className="flex items-center gap-2">
              <span>
                {metric.name === 'CLS' 
                  ? metric.value.toFixed(3)
                  : Math.round(metric.value)}
                {metric.name !== 'CLS' && 'ms'}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${
                  metric.rating === 'good'
                    ? 'bg-green-500'
                    : metric.rating === 'needs-improvement'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                title={`Rating: ${metric.rating}`}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

/**
 * Lightweight performance reporter that only sends data to analytics
 */
export function PerformanceReporter() {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}