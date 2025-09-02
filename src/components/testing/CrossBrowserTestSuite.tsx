'use client';

import { useState, useEffect } from 'react';
import { 
  detectBrowser, 
  checkFeatureSupport, 
  PerformanceTester,
  type BrowserInfo,
  type FeatureSupport 
} from '@/lib/cross-browser-testing';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export default function CrossBrowserTestSuite() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [featureSupport, setFeatureSupport] = useState<FeatureSupport | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [coreWebVitals, setCoreWebVitals] = useState<Record<string, number>>({});

  useEffect(() => {
    setBrowserInfo(detectBrowser());
    setFeatureSupport(checkFeatureSupport());
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Browser Detection
    results.push({
      name: 'Browser Detection',
      status: browserInfo ? 'pass' : 'fail',
      message: browserInfo ? `Detected ${browserInfo.name} ${browserInfo.version}` : 'Failed to detect browser',
      details: browserInfo
    });

    // Test 2: Modern Features Support
    if (featureSupport) {
      const criticalFeatures = ['intersectionObserver', 'cssGrid', 'flexbox', 'customProperties'];
      const supportedCritical = criticalFeatures.filter(feature => featureSupport[feature as keyof FeatureSupport]);
      
      results.push({
        name: 'Critical Features Support',
        status: supportedCritical.length === criticalFeatures.length ? 'pass' : 'warning',
        message: `${supportedCritical.length}/${criticalFeatures.length} critical features supported`,
        details: featureSupport
      });
    }

    // Test 3: Responsive Design
    const viewportWidth = window.innerWidth;
    const isResponsive = viewportWidth >= 320 && viewportWidth <= 2560;
    results.push({
      name: 'Responsive Design',
      status: isResponsive ? 'pass' : 'warning',
      message: `Viewport width: ${viewportWidth}px`,
      details: { width: viewportWidth, height: window.innerHeight }
    });

    // Test 4: Animation Support
    const supportsAnimations = CSS.supports('animation', 'test 1s');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.push({
      name: 'Animation Support',
      status: supportsAnimations ? 'pass' : 'warning',
      message: prefersReducedMotion ? 'Reduced motion preferred' : 'Animations supported',
      details: { supportsAnimations, prefersReducedMotion }
    });

    // Test 5: Color Scheme Support
    const supportsDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
    results.push({
      name: 'Color Scheme Support',
      status: supportsDarkMode ? 'pass' : 'warning',
      message: supportsDarkMode ? 'Dark mode detection available' : 'No dark mode detection',
      details: { supportsDarkMode }
    });

    // Test 6: Touch Support
    const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    results.push({
      name: 'Touch Support',
      status: 'pass',
      message: supportsTouch ? 'Touch events supported' : 'Mouse-only device',
      details: { supportsTouch, maxTouchPoints: navigator.maxTouchPoints }
    });

    // Test 7: Network Information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    results.push({
      name: 'Network Information',
      status: connection ? 'pass' : 'warning',
      message: connection ? `Connection type: ${connection.effectiveType}` : 'Network info not available',
      details: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      } : null
    });

    // Test 8: Performance API
    const supportsPerformance = 'performance' in window && 'mark' in performance;
    if (supportsPerformance) {
      PerformanceTester.mark('test-start');
      await new Promise(resolve => setTimeout(resolve, 100));
      PerformanceTester.mark('test-end');
      const duration = PerformanceTester.measure('test-duration', 'test-start', 'test-end');
      
      results.push({
        name: 'Performance API',
        status: 'pass',
        message: `Performance measurement working (${duration.toFixed(2)}ms)`,
        details: { duration, navigationTiming: PerformanceTester.getNavigationTiming() }
      });
    } else {
      results.push({
        name: 'Performance API',
        status: 'warning',
        message: 'Performance API not available',
        details: null
      });
    }

    // Test 9: Core Web Vitals
    try {
      const vitals = await PerformanceTester.getCoreWebVitals();
      setCoreWebVitals(vitals);
      
      const hasGoodLCP = !vitals.lcp || vitals.lcp < 2500;
      const hasGoodFID = !vitals.fid || vitals.fid < 100;
      const hasGoodCLS = !vitals.cls || vitals.cls < 0.1;
      
      const vitalsPassed = [hasGoodLCP, hasGoodFID, hasGoodCLS].filter(Boolean).length;
      
      results.push({
        name: 'Core Web Vitals',
        status: vitalsPassed === 3 ? 'pass' : vitalsPassed >= 2 ? 'warning' : 'fail',
        message: `${vitalsPassed}/3 vitals within thresholds`,
        details: vitals
      });
    } catch (error) {
      results.push({
        name: 'Core Web Vitals',
        status: 'warning',
        message: 'Could not measure Core Web Vitals',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Test 10: Accessibility Features
    const supportsAriaLive = 'ariaLive' in document.createElement('div');
    const supportsFocusVisible = CSS.supports('selector(:focus-visible)');
    const supportsPreferredContrast = window.matchMedia('(prefers-contrast: high)').matches !== undefined;
    
    results.push({
      name: 'Accessibility Features',
      status: supportsAriaLive && supportsFocusVisible ? 'pass' : 'warning',
      message: 'Accessibility features checked',
      details: {
        ariaLive: supportsAriaLive,
        focusVisible: supportsFocusVisible,
        preferredContrast: supportsPreferredContrast
      }
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50 border-green-200';
      case 'fail': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cross-Browser Tests
            </h3>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Tests'}
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {browserInfo && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Browser Info</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>{browserInfo.name} {browserInfo.version}</div>
                <div>{browserInfo.engine} engine</div>
                <div>{browserInfo.platform}</div>
                <div>{browserInfo.isMobile ? 'Mobile' : browserInfo.isTablet ? 'Tablet' : 'Desktop'}</div>
              </div>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Test Results</h4>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border text-sm ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {getStatusIcon(result.status)} {result.name}
                      </span>
                    </div>
                    <div className="mt-1 text-xs opacity-75">
                      {result.message}
                    </div>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs opacity-60">
                          Details
                        </summary>
                        <pre className="mt-1 text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(coreWebVitals).length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Core Web Vitals</h4>
              <div className="text-sm space-y-1">
                {coreWebVitals.lcp && (
                  <div className={`${coreWebVitals.lcp < 2500 ? 'text-green-600' : 'text-red-600'}`}>
                    LCP: {coreWebVitals.lcp.toFixed(0)}ms
                  </div>
                )}
                {coreWebVitals.fid && (
                  <div className={`${coreWebVitals.fid < 100 ? 'text-green-600' : 'text-red-600'}`}>
                    FID: {coreWebVitals.fid.toFixed(0)}ms
                  </div>
                )}
                {coreWebVitals.cls && (
                  <div className={`${coreWebVitals.cls < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                    CLS: {coreWebVitals.cls.toFixed(3)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}