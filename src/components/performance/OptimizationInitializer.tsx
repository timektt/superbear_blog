'use client';

import { useEffect } from 'react';
import { initOptimization } from '@/lib/performance/optimization-manager';

/**
 * Component to initialize performance and accessibility optimization systems
 */
export default function OptimizationInitializer() {
  useEffect(() => {
    // Initialize optimization systems
    initOptimization({
      enableWebVitals: true,
      enableAccessibilityMonitoring: process.env.NODE_ENV === 'development',
      enablePerformanceMonitoring: true,
      enableResourceHints: true,
      enableCriticalRoutePreloading: true,
      reportToAnalytics: process.env.NODE_ENV === 'production',
    }).catch((error) => {
      console.warn('Failed to initialize optimization systems:', error);
    });
  }, []);

  return null;
}