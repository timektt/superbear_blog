/**
 * Feature Flag Validation Utilities
 * 
 * Provides validation and error checking for feature flag configurations.
 * Helps catch configuration issues early in development.
 */

import { getLayoutMode, isDevOverlaysEnabled } from '@/lib/feature-flags';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate the current feature flag configuration
 * @returns Validation result with errors and warnings
 */
export function validateFeatureFlags(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate layout mode
  const layoutMode = getLayoutMode();
  const rawLayoutMode = process.env.NEXT_PUBLIC_LAYOUT;
  
  if (rawLayoutMode && rawLayoutMode !== layoutMode) {
    errors.push(`Invalid NEXT_PUBLIC_LAYOUT value: "${rawLayoutMode}". Must be "magazine" or "classic".`);
  }
  
  // Validate dev overlays setting
  const devOverlays = process.env.NEXT_PUBLIC_ENABLE_DEV_OVERLAYS;
  if (devOverlays && !['0', '1', 'true', 'false'].includes(devOverlays)) {
    warnings.push(`Invalid NEXT_PUBLIC_ENABLE_DEV_OVERLAYS value: "${devOverlays}". Should be "0", "1", "true", or "false".`);
  }
  
  // Environment-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (isDevOverlaysEnabled()) {
      warnings.push('Development overlays are enabled in production. Consider disabling for better performance.');
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    if (!rawLayoutMode) {
      warnings.push('NEXT_PUBLIC_LAYOUT not set. Using default "classic" layout.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results to console (development only)
 */
export function logValidationResults(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const result = validateFeatureFlags();
  
  if (result.errors.length > 0) {
    console.error('🚨 Feature Flag Errors:');
    result.errors.forEach(error => console.error(`  ❌ ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Feature Flag Warnings:');
    result.warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`));
  }
  
  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Feature flags configuration is valid');
  }
}

/**
 * Get a summary of current feature flag values
 * @returns Object containing current flag values and their sources
 */
export function getFeatureFlagSummary() {
  return {
    layout: {
      mode: getLayoutMode(),
      source: process.env.NEXT_PUBLIC_LAYOUT || 'default',
      isDefault: !process.env.NEXT_PUBLIC_LAYOUT,
    },
    development: {
      overlaysEnabled: isDevOverlaysEnabled(),
      source: process.env.NEXT_PUBLIC_ENABLE_DEV_OVERLAYS || 'default',
      isDefault: !process.env.NEXT_PUBLIC_ENABLE_DEV_OVERLAYS,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    },
  };
}