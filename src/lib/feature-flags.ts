/**
 * Feature Flag System
 * 
 * Centralized feature flag management for layout switching and development features.
 * Supports immediate effect when changing environment variables.
 */

export type LayoutMode = 'magazine' | 'classic';

/**
 * Get the current layout mode from environment variables
 * @returns The layout mode, defaults to 'classic' if not set or invalid
 */
export function getLayoutMode(): LayoutMode {
  const layoutMode = process.env.NEXT_PUBLIC_LAYOUT?.toLowerCase();
  
  // Validate the layout mode
  if (layoutMode === 'magazine' || layoutMode === 'classic') {
    return layoutMode;
  }
  
  // Default to classic layout
  return 'classic';
}

/**
 * Check if magazine layout is enabled
 * @returns true if magazine layout is active
 */
export function isMagazineLayout(): boolean {
  return getLayoutMode() === 'magazine';
}

/**
 * Check if classic layout is enabled
 * @returns true if classic layout is active
 */
export function isClassicLayout(): boolean {
  return getLayoutMode() === 'classic';
}

/**
 * Check if development overlays are enabled
 * @returns true if dev overlays should be shown
 */
export function isDevOverlaysEnabled(): boolean {
  // Only enable in development environment
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // Check the environment variable (default: disabled)
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEV_OVERLAYS;
  return enabled === '1' || enabled === 'true';
}

/**
 * Get feature flag configuration object
 * @returns Object containing all feature flag states
 */
export function getFeatureFlags() {
  return {
    layoutMode: getLayoutMode(),
    isMagazineLayout: isMagazineLayout(),
    isClassicLayout: isClassicLayout(),
    isDevOverlaysEnabled: isDevOverlaysEnabled(),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

/**
 * Development utility to log current feature flag state
 * Only logs in development when dev overlays are enabled
 */
export function logFeatureFlags(): void {
  if (isDevOverlaysEnabled()) {
    const flags = getFeatureFlags();
    console.log('🚩 Feature Flags:', flags);
  }
}