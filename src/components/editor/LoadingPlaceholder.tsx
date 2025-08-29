'use client';

import { useEffect, useState } from 'react';

export interface LoadingPlaceholderProps {
  id: string;
  filename: string;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  onCancel?: () => void;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function LoadingPlaceholder({
  id,
  filename,
  message = 'Uploading...',
  showProgress = false,
  progress = 0,
  onCancel,
  size = 'md',
  animated = true
}: LoadingPlaceholderProps) {
  const [dots, setDots] = useState('');

  // Animate dots for loading effect
  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [animated]);

  const sizeConfig = {
    sm: {
      container: 'min-h-[80px] text-sm',
      icon: 'text-2xl',
      spinner: 'w-4 h-4',
      padding: 'p-3'
    },
    md: {
      container: 'min-h-[120px] text-base',
      icon: 'text-3xl',
      spinner: 'w-5 h-5',
      padding: 'p-4'
    },
    lg: {
      container: 'min-h-[160px] text-lg',
      icon: 'text-4xl',
      spinner: 'w-6 h-6',
      padding: 'p-6'
    }
  };

  const config = sizeConfig[size];

  return (
    <div
      id={id}
      className={`
        ${config.container} ${config.padding}
        bg-gradient-to-br from-blue-50 to-indigo-50
        border-2 border-dashed border-blue-300
        rounded-lg
        flex flex-col items-center justify-center
        text-blue-700
        relative
        overflow-hidden
      `}
    >
      {/* Animated background */}
      {animated && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center space-y-3">
        {/* Icon/Spinner */}
        <div className="flex justify-center">
          {animated ? (
            <div className={`${config.spinner} border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin`} />
          ) : (
            <span className={`${config.icon}`}>📤</span>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1">
          <div className="font-semibold">
            {message}{animated && dots}
          </div>
          <div className="text-sm opacity-80 truncate max-w-48" title={filename}>
            {filename}
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-full max-w-48 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Cancel button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="
              absolute top-2 right-2
              text-blue-400 hover:text-red-500
              transition-colors duration-200
              p-1 rounded-full
              hover:bg-white/50
            "
            title="Cancel upload"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Shimmer effect */}
      {animated && (
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// Multi-file loading placeholder
export interface MultiLoadingPlaceholderProps {
  id: string;
  files: Array<{
    filename: string;
    progress?: number;
    status?: 'pending' | 'uploading' | 'completed' | 'failed';
  }>;
  totalProgress: number;
  onCancel?: () => void;
  title?: string;
}

export function MultiLoadingPlaceholder({
  id,
  files,
  totalProgress,
  onCancel,
  title = 'Uploading files...'
}: MultiLoadingPlaceholderProps) {
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'failed').length;

  return (
    <div
      id={id}
      className="
        p-4 bg-gradient-to-br from-blue-50 to-indigo-50
        border-2 border-blue-300 rounded-lg
        space-y-4
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <div>
            <div className="font-semibold text-blue-700">{title}</div>
            <div className="text-sm text-blue-600">
              {completedFiles} of {files.length} completed
              {failedFiles > 0 && ` • ${failedFiles} failed`}
            </div>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-blue-400 hover:text-red-500 transition-colors p-1"
            title="Cancel all uploads"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-blue-700">
          <span>Overall Progress</span>
          <span>{totalProgress}%</span>
        </div>
        <div className="bg-blue-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* File list */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {files.map((file, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="flex-shrink-0">
              {file.status === 'completed' && <span className="text-green-600">✅</span>}
              {file.status === 'failed' && <span className="text-red-600">❌</span>}
              {file.status === 'uploading' && (
                <div className="w-3 h-3 border border-blue-400 border-t-blue-600 rounded-full animate-spin" />
              )}
              {file.status === 'pending' && <span className="text-gray-400">⏳</span>}
            </div>
            <div className="flex-1 truncate text-blue-700" title={file.filename}>
              {file.filename}
            </div>
            {file.progress !== undefined && file.status === 'uploading' && (
              <div className="text-xs text-blue-600 font-mono">
                {file.progress}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}