'use client';

import { useEffect, useState } from 'react';
import { 
  runAccessibilityAudit,
  testAccessibilityPerformance,
  testColorContrast,
  type AccessibilityTestResult 
} from '@/lib/accessibility/testing-utils';
import { 
  webVitalsMonitor, 
  initWebVitals, 
  type WebVitalMetric 
} from '@/lib/performance/core-web-vitals';
import { cn } from '@/lib/utils';

interface AccessibilityPerformancePanelProps {
  enabled?: boolean;
  showDebugInfo?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Combined accessibility and performance monitoring panel
 * Provides real-time insights into both performance metrics and accessibility compliance
 */
export default function AccessibilityPerformancePanel({
  enabled = process.env.NODE_ENV === 'development',
  showDebugInfo = false,
  position = 'bottom-right',
}: AccessibilityPerformancePanelProps) {
  const [isVisible, setIsVisible] = useState(showDebugInfo);
  const [activeTab, setActiveTab] = useState<'performance' | 'accessibility'>('performance');
  const [webVitals, setWebVitals] = useState<WebVitalMetric[]>([]);
  const [accessibilityAudit, setAccessibilityAudit] = useState<{
    results: AccessibilityTestResult[];
    summary: {
      errors: number;
      warnings: number;
      info: number;
    };
    passed: boolean;
  } | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    ariaAttributeCount: number;
    focusableElementCount: number;
    landmarkCount: number;
    headingCount: number;
    performanceImpact: 'low' | 'medium' | 'high';
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Initialize Web Vitals monitoring
    initWebVitals();

    // Listen for new metrics
    const handleMetric = (metric: WebVitalMetric) => {
      setWebVitals(prev => {
        const updated = prev.filter(m => m.name !== metric.name);
        return [...updated, metric];
      });
    };

    webVitalsMonitor.onMetric(handleMetric);

    // Run accessibility audit
    const runAudit = () => {
      const audit = runAccessibilityAudit();
      setAccessibilityAudit(audit);
      
      const perfMetrics = testAccessibilityPerformance();
      setPerformanceMetrics({
        ariaAttributeCount: perfMetrics.ariaQueries,
        focusableElementCount: perfMetrics.focusableElements,
        landmarkCount: 0,
        headingCount: 0,
        performanceImpact: perfMetrics.ariaQueries > 100 ? 'high' : perfMetrics.ariaQueries > 50 ? 'medium' : 'low',
      });
    };

    // Initial audit
    runAudit();

    // Re-audit on DOM changes (debounced)
    let auditTimeout: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(auditTimeout);
      auditTimeout = setTimeout(runAudit, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'aria-describedby', 'role', 'tabindex'],
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A for accessibility panel
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
        if (!isVisible) setActiveTab('accessibility');
      }
      // Ctrl+Shift+P for performance panel
      else if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
        if (!isVisible) setActiveTab('performance');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
      clearTimeout(auditTimeout);
      webVitalsMonitor.disconnect();
    };
  }, [enabled, isVisible]);

  if (!enabled || !isVisible) {
    return null;
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
        'fixed z-50 bg-black/95 text-white rounded-lg shadow-2xl max-w-md w-full max-h-96 overflow-hidden',
        positionClasses[position]
      )}
      role="dialog"
      aria-label="Accessibility and Performance Monitor"
      aria-modal="false"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-md p-1">
            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded transition-colors',
                activeTab === 'performance'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
              aria-pressed={activeTab === 'performance'}
            >
              Performance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accessibility')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded transition-colors',
                activeTab === 'accessibility'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
              aria-pressed={activeTab === 'accessibility'}
            >
              A11y
            </button>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white p-1 rounded"
          aria-label="Close monitor panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-80">
        {activeTab === 'performance' && (
          <PerformanceTab 
            webVitals={webVitals} 
            performanceMetrics={performanceMetrics}
          />
        )}
        
        {activeTab === 'accessibility' && (
          <AccessibilityTab 
            audit={accessibilityAudit}
            performanceMetrics={performanceMetrics}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between items-center">
          <span>Ctrl+Shift+{activeTab === 'performance' ? 'P' : 'A'}</span>
          <span className="flex items-center gap-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              webVitals.length > 0 ? 'bg-green-500' : 'bg-yellow-500'
            )} />
            {webVitals.length > 0 ? 'Active' : 'Loading'}
          </span>
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({ 
  webVitals, 
  performanceMetrics 
}: { 
  webVitals: WebVitalMetric[];
  performanceMetrics: unknown;
}) {
  return (
    <div className="space-y-4">
      {/* Core Web Vitals */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Core Web Vitals
        </h3>
        
        {webVitals.length === 0 ? (
          <p className="text-gray-400 text-xs">Collecting metrics...</p>
        ) : (
          <div className="space-y-2">
            {webVitals.map((metric) => (
              <div key={metric.name} className="flex justify-between items-center text-xs">
                <span className="font-medium">{metric.name}:</span>
                <div className="flex items-center gap-2">
                  <span>
                    {metric.name === 'CLS' 
                      ? metric.value.toFixed(3)
                      : Math.round(metric.value)}
                    {metric.name !== 'CLS' && 'ms'}
                  </span>
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      metric.rating === 'good' ? 'bg-green-500' :
                      metric.rating === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    title={`Rating: ${metric.rating}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Impact */}
      {performanceMetrics && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Performance Impact</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>ARIA Attributes:</span>
              <span>{performanceMetrics.ariaAttributeCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Focusable Elements:</span>
              <span>{performanceMetrics.focusableElementCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Impact Level:</span>
              <span className={cn(
                'capitalize',
                performanceMetrics.performanceImpact === 'low' ? 'text-green-400' :
                performanceMetrics.performanceImpact === 'medium' ? 'text-yellow-400' : 'text-red-400'
              )}>
                {performanceMetrics.performanceImpact}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccessibilityTab({ 
  audit, 
  performanceMetrics 
}: { 
  audit: {
    results: AccessibilityTestResult[];
    summary: {
      errors: number;
      warnings: number;
      info: number;
    };
    passed: boolean;
  } | null;
  performanceMetrics: {
    ariaAttributeCount: number;
    focusableElementCount: number;
    landmarkCount: number;
    headingCount: number;
    performanceImpact: 'low' | 'medium' | 'high';
  } | null;
}) {
  if (!audit) {
    return (
      <p className="text-gray-400 text-xs">Running accessibility audit...</p>
    );
  }

  const score = audit.passed ? 100 : Math.max(0, 100 - (audit.summary.errors * 10 + audit.summary.warnings * 5));

  return (
    <div className="space-y-4">
      {/* Score */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          Accessibility Score
        </h3>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            'text-2xl font-bold',
            score >= 90
              ? 'text-green-400'
              : score >= 70
                ? 'text-yellow-400'
                : 'text-red-400'
          )}>
            {score}
          </div>
          <div className="text-xs text-gray-400">
            <div>{audit.summary.errors} errors</div>
            <div>{audit.summary.warnings} warnings</div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {audit.results.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Issues</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {audit.results
              .slice(0, 5)
              .map((issue: AccessibilityTestResult, index: number) => (
                <div key={index} className="text-xs p-2 bg-gray-800 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      issue.severity === 'error'
                        ? 'bg-red-500'
                        : issue.severity === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    )} />
                    <span className="font-medium">
                      {issue.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-300">{issue.message}</p>
                </div>
              ))}
            {audit.results.length > 5 && (
              <p className="text-xs text-gray-400 text-center">
                +{audit.results.length - 5} more issues
              </p>
            )}
          </div>
        </div>
      )}

      {/* Semantic Structure */}
      {performanceMetrics && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Semantic Structure</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Landmarks:</span>
              <span>{performanceMetrics.landmarkCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Headings:</span>
              <span>{performanceMetrics.headingCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}