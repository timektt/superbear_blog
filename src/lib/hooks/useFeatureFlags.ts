/**
 * React Hook for Feature Flags
 * 
 * Provides a React hook interface for accessing feature flags in client components.
 * Handles client-side feature flag state and updates.
 */

'use client';

import { useState, useEffect } from 'react';
import { getFeatureFlags, type LayoutMode } from '@/lib/feature-flags';

export interface UseFeatureFlagsReturn {
  layoutMode: LayoutMode;
  isMagazineLayout: boolean;
  isClassicLayout: boolean;
  isDevOverlaysEnabled: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  refreshFlags: () => void;
}

/**
 * Hook for accessing feature flags in client components
 * @returns Feature flag state and utilities
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [flags, setFlags] = useState(() => getFeatureFlags());
  
  // Refresh feature flags (useful for testing or dynamic updates)
  const refreshFlags = () => {
    setFlags(getFeatureFlags());
  };
  
  // Listen for environment variable changes (in development)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Check for changes every 5 seconds in development
      const interval = setInterval(() => {
        const newFlags = getFeatureFlags();
        if (JSON.stringify(newFlags) !== JSON.stringify(flags)) {
          setFlags(newFlags);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [flags]);
  
  return {
    ...flags,
    refreshFlags,
  };
}

/**
 * Hook for checking if a specific layout is active
 * @param layout - The layout to check for
 * @returns true if the specified layout is active
 */
export function useLayoutMode(layout: LayoutMode): boolean {
  const { layoutMode } = useFeatureFlags();
  return layoutMode === layout;
}

/**
 * Hook for development features
 * @returns Development-specific feature flags
 */
export function useDevFeatures() {
  const flags = useFeatureFlags();
  
  return {
    isDevOverlaysEnabled: flags.isDevOverlaysEnabled,
    isDevelopment: flags.isDevelopment,
    showDebugInfo: flags.isDevOverlaysEnabled && flags.isDevelopment,
  };
}