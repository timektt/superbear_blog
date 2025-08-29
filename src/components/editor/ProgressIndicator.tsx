'use client';

import { useEffect, useState } from 'react';

export interface ProgressIndicatorProps {
  id: string;
  filename: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  onCancel?: () => void;
  showCancel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
}

export function ProgressIndicator({
  id,
  filename,
  progress,
  status,
  error,
  onCancel,
  showCancel = true,
  size = 'md',
  variant = 'default'
}: ProgressIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after completion
  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!isVisible) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'failed':
      case 'cancelled':
        return '#ef4444'; // red
      case 'uploading':
      case 'processing':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏹️';
      case 'uploading':
        return '📤';
      case 'processing':
        return '⚙️';
      default:
        return '⏳';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Upload complete';
      case 'failed':
        return error || 'Upload failed';
      case 'cancelled':
        return 'Upload cancelled';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      default:
        return 'Preparing...';
    }
  };

  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4'
  };

  const progressBarHeight = {
    sm: '4px',
    md: '6px',
    lg: '8px'
  };

  if (variant === 'compact') {
    return (
      <div
        id={id}
        className={`inline-flex items-center gap-2 ${sizeClasses[size]} bg-gray-50 border border-gray-200 rounded-lg`}
        style={{ color: getStatusColor() }}
      >
        <span className="text-base">{getStatusIcon()}</span>
        <span className="font-medium truncate max-w-32">{filename}</span>
        {status === 'uploading' && (
          <span className="text-xs">{progress}%</span>
        )}
        {showCancel && onCancel && (status === 'uploading' || status === 'pending') && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Cancel upload"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        id={id}
        className={`${sizeClasses[size]} bg-white border border-gray-200 rounded-lg shadow-sm`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{getStatusIcon()}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate" title={filename}>
                {filename}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getStatusText()}
              </div>
            </div>
          </div>
          {showCancel && onCancel && (status === 'uploading' || status === 'pending') && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-red-500 transition-colors ml-2"
              title="Cancel upload"
            >
              ✕
            </button>
          )}
        </div>
        
        {(status === 'uploading' || status === 'processing') && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="bg-gray-200 rounded-full overflow-hidden" style={{ height: progressBarHeight[size] }}>
              <div
                className="bg-blue-500 transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: getStatusColor()
                }}
              />
            </div>
          </div>
        )}

        {error && status === 'failed' && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      id={id}
      className={`${sizeClasses[size]} bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg`}
      style={{ borderColor: getStatusColor() }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {status === 'uploading' && (
            <div
              className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
              style={{ width: '16px', height: '16px' }}
            />
          )}
          {status !== 'uploading' && (
            <span className="text-lg">{getStatusIcon()}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate" title={filename}>
            {filename}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {getStatusText()}
          </div>
          
          {(status === 'uploading' || status === 'processing') && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full overflow-hidden" style={{ height: progressBarHeight[size] }}>
                <div
                  className="transition-all duration-300 ease-out"
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: getStatusColor()
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {progress}% complete
              </div>
            </div>
          )}
        </div>

        {showCancel && onCancel && (status === 'uploading' || status === 'pending') && (
          <button
            onClick={onCancel}
            className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Cancel upload"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && status === 'failed' && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}