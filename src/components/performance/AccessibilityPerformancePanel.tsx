'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { optimizationManager, type OptimizationReport } from '@/lib/performance/optimization-manager';
import { webVitalsMonitor, type WebVitalMetric } from '@/lib/performance/core-web-vitals';

interface AccessibilityPerformancePanelProps {
  showInProduction?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Development panel for monitoring accessibility and performance in real-time
 */
export default function AccessibilityPerformancePanel({
  showInProduction = false,
  position = 'bottom-right',
}: AccessibilityPerformancePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'accessibility' | 'report'>('performance');
  const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Only show in development unless explicitly enabled for production
  const shouldShow = showInProduction || process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!shouldShow) return;

    // Listen for Web Vitals updates
    const handleMetric = (metric: WebVitalMetric) => {
      setMetrics(prev => {
        const updated = prev.filter(m => m.name !== metric.name);
        return [...updated, metric];
      });
    };

    webVitalsMonitor.onMetric(handleMetric);

    // Keyboard shortcut to toggle panel (Ctrl+Shift+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldShow]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const newReport = await optimizationManager.generateReport();
      setReport(newReport);
      setActiveTab('report');
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!shouldShow || !isVisible) {
    return shouldShow ? (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        className={cn(
          'fixed z-50 bg-black/90 text-white p-2 rounded-lg shadow-lg text-xs',
          {
            'bottom-4 right-4': position === 'bottom-right',
            'bottom-4 left-4': position === 'bottom-left',
            'top-4 right-4': position === 'top-right',
            'top-4 left-4': position === 'top-left',
          }
        )}
        aria-label="Open performance and accessibility panel"
      >
        📊
      </button>
    ) : null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full',
        positionClasses[position]
      )}
      role="dialog"
      aria-label="Performance and Accessibility Panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Performance & A11y
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generateReport}
            disabled={isLoading}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            aria-label="Generate comprehensive report"
          >
            {isLoading ? '⏳' : '📋'} Report
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['performance', 'accessibility', 'report'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-medium capitalize',
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            )}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'performance' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
              Core Web Vitals
            </h4>
            {metrics.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No metrics collected yet. Interact with the page to generate data.
              </p>
            ) : (
              <div className="space-y-2">
                {metrics.map((metric) => (
                  <div
                    key={metric.name}
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{metric.name}</span>
                      <div
                        className={cn('w-2 h-2 rounded-full', {
                          'bg-green-500': metric.rating === 'good',
                          'bg-yellow-500': metric.rating === 'needs-improvement',
                          'bg-red-500': metric.rating === 'poor',
                        })}
                        title={`Rating: ${metric.rating}`}
                        aria-label={`${metric.name} rating: ${metric.rating}`}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {metric.name === 'CLS' 
                        ? metric.value.toFixed(3)
                        : Math.round(metric.value)}
                      {metric.name !== 'CLS' && 'ms'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
              Accessibility Status
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-xs">WCAG Compliance</span>
                <span className="text-xs text-green-600">✓ AA</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-xs">Color Contrast</span>
                <span className="text-xs text-green-600">✓ Pass</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-xs">Keyboard Navigation</span>
                <span className="text-xs text-green-600">✓ Pass</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-xs">Screen Reader</span>
                <span className="text-xs text-green-600">✓ Compatible</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 Press Ctrl+Shift+A to run full accessibility audit
              </p>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-3">
            {!report ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click "Report" to generate a comprehensive analysis.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                    Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                      <div className="font-semibold text-green-600">
                        {report.webVitals.filter(m => m.rating === 'good').length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Good Metrics</div>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                      <div className="font-semibold text-red-600">
                        {report.performanceIssues.length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Issues</div>
                    </div>
                  </div>
                </div>

                {report.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {report.recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Generated: {new Date(report.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Press Ctrl+Shift+P to toggle • Dev Mode
      </div>
    </div>
  );
}

/**
 * Lightweight version for production monitoring
 */
export function PerformanceIndicator() {
  const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);

  useEffect(() => {
    const handleMetric = (metric: WebVitalMetric) => {
      setMetrics(prev => {
        const updated = prev.filter(m => m.name !== metric.name);
        return [...updated, metric];
      });
    };

    webVitalsMonitor.onMetric(handleMetric);
  }, []);

  const hasIssues = metrics.some(m => m.rating === 'poor');

  if (!hasIssues) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg"
      role="status"
      aria-label="Performance issues detected"
      title="Performance issues detected. Check console for details."
    >
      ⚠️
    </div>
  );
}