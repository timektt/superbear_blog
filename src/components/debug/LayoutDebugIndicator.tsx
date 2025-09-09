/**
 * Layout Debug Indicator Component
 * 
 * Shows the current layout mode in development when debug overlays are enabled.
 * Only renders when NEXT_PUBLIC_ENABLE_DEV_OVERLAYS=1 in development.
 */

'use client';

import { useDevFeatures, useFeatureFlags } from '@/lib/hooks/useFeatureFlags';

interface LayoutDebugIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export default function LayoutDebugIndicator({ 
  position = 'top-right',
  className = '' 
}: LayoutDebugIndicatorProps) {
  const { layoutMode } = useFeatureFlags();
  const { showDebugInfo } = useDevFeatures();
  
  // Only show in development when debug overlays are enabled
  if (!showDebugInfo) {
    return null;
  }
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  const layoutColors = {
    magazine: 'bg-blue-500/10 border-blue-400/30 text-blue-700 dark:text-blue-300',
    classic: 'bg-purple-500/10 border-purple-400/30 text-purple-700 dark:text-purple-300',
  };
  
  return (
    <div 
      className={`
        fixed ${positionClasses[position]} 
        ${layoutColors[layoutMode]}
        px-3 py-2 rounded-lg text-xs backdrop-blur-sm border z-50
        ${className}
      `}
      role="status"
      aria-label={`Current layout: ${layoutMode} mode`}
    >
      Layout: {layoutMode === 'magazine' ? 'Magazine' : 'Classic'} Mode
    </div>
  );
}