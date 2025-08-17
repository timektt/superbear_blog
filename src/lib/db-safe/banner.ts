'use client';

import { IS_DB_CONFIGURED, IS_DEVELOPMENT } from '@/lib/env';

export interface SafeModeBannerProps {
  show?: boolean;
  message?: string;
  type?: 'info' | 'warning' | 'error';
  className?: string;
}

/**
 * Determines if safe mode banner should be shown
 */
export function shouldShowSafeModeBanner(): boolean {
  // Only show in development when DB is not configured
  return IS_DEVELOPMENT && !IS_DB_CONFIGURED;
}

/**
 * Safe mode banner component
 */
export function SafeModeBanner({
  show = shouldShowSafeModeBanner(),
  message = 'Running in safe mode with mock data - database not configured',
  type = 'info',
  className = '',
}: SafeModeBannerProps) {
  if (!show) {
    return null;
  }

  const baseClasses = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto max-w-md z-50 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm text-sm font-medium transition-all duration-300';
  
  const typeClasses = {
    info: 'bg-blue-500/10 border border-blue-400/30 text-blue-700 dark:text-blue-300',
    warning: 'bg-amber-500/10 border border-amber-400/30 text-amber-700 dark:text-amber-300',
    error: 'bg-red-500/10 border border-red-400/30 text-red-700 dark:text-red-300',
  };

  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          {type === 'info' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'warning' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
}

/**
 * Hook to get safe mode status
 */
export function useSafeModeStatus() {
  return {
    isDbConfigured: IS_DB_CONFIGURED,
    isDevelopment: IS_DEVELOPMENT,
    shouldShowBanner: shouldShowSafeModeBanner(),
    safeMode: !IS_DB_CONFIGURED,
  };
}