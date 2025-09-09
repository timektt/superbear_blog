/**
 * Feature Flag Configuration
 * 
 * Centralized configuration for all feature flags used throughout the application.
 * This file defines the available feature flags and their default values.
 */

export interface FeatureFlagConfig {
  // Layout Configuration
  layout: {
    mode: 'magazine' | 'classic';
    enableMagazineLayout: boolean;
    enableClassicLayout: boolean;
  };
  
  // Development Features
  development: {
    enableDevOverlays: boolean;
    enableDebugLogging: boolean;
    showLayoutIndicator: boolean;
    showDataErrors: boolean;
  };
  
  // Performance Features
  performance: {
    enableImageOptimization: boolean;
    enableLazyLoading: boolean;
    enableCaching: boolean;
  };
  
  // UI Features
  ui: {
    enableDarkMode: boolean;
    enableAnimations: boolean;
    enableAccessibilityFeatures: boolean;
  };
}

/**
 * Get the complete feature flag configuration
 * @returns Complete feature flag configuration object
 */
export function getFeatureFlagConfig(): FeatureFlagConfig {
  const layoutMode = (process.env.NEXT_PUBLIC_LAYOUT?.toLowerCase() as 'magazine' | 'classic') || 'classic';
  const isDevOverlaysEnabled = process.env.NODE_ENV === 'development' && 
    (process.env.NEXT_PUBLIC_ENABLE_DEV_OVERLAYS === '1' || process.env.NEXT_PUBLIC_ENABLE_DEV_OVERLAYS === 'true');
  
  return {
    layout: {
      mode: layoutMode,
      enableMagazineLayout: layoutMode === 'magazine',
      enableClassicLayout: layoutMode === 'classic',
    },
    development: {
      enableDevOverlays: isDevOverlaysEnabled,
      enableDebugLogging: isDevOverlaysEnabled,
      showLayoutIndicator: isDevOverlaysEnabled,
      showDataErrors: isDevOverlaysEnabled,
    },
    performance: {
      enableImageOptimization: true,
      enableLazyLoading: true,
      enableCaching: process.env.NODE_ENV === 'production',
    },
    ui: {
      enableDarkMode: true,
      enableAnimations: true,
      enableAccessibilityFeatures: true,
    },
  };
}

/**
 * Check if a specific feature flag is enabled
 * @param flagPath - Dot notation path to the flag (e.g., 'layout.enableMagazineLayout')
 * @returns true if the flag is enabled
 */
export function isFeatureEnabled(flagPath: string): boolean {
  const config = getFeatureFlagConfig();
  const keys = flagPath.split('.');
  
  let current: any = config;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return Boolean(current);
}

/**
 * Get environment-specific feature flag overrides
 * @returns Object containing environment-specific overrides
 */
export function getEnvironmentOverrides() {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        development: {
          enableDebugLogging: true,
        },
        performance: {
          enableCaching: false,
        },
      };
    
    case 'production':
      return {
        development: {
          enableDevOverlays: false,
          enableDebugLogging: false,
          showLayoutIndicator: false,
          showDataErrors: false,
        },
        performance: {
          enableCaching: true,
          enableImageOptimization: true,
        },
      };
    
    case 'test':
      return {
        development: {
          enableDevOverlays: false,
          enableDebugLogging: false,
        },
        ui: {
          enableAnimations: false,
        },
      };
    
    default:
      return {};
  }
}