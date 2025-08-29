'use client';

import { useState } from 'react';

export interface ErrorMessageProps {
  id?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  details?: string;
  showDetails?: boolean;
}

export function ErrorMessage({
  id,
  message,
  type = 'error',
  dismissible = true,
  onDismiss,
  actions,
  details,
  showDetails = false
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(showDetails);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const typeConfig = {
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      icon: '❌',
      title: 'Error'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      icon: '⚠️',
      title: 'Warning'
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      icon: 'ℹ️',
      title: 'Information'
    }
  };

  const config = typeConfig[type];

  const buttonVariants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <div
      id={id}
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg p-4 mb-4
        animate-slideIn
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <span className="text-lg">{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold mb-1">{config.title}</div>
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {message}
          </div>

          {/* Details */}
          {details && (
            <div className="mt-3">
              <button
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className="text-sm font-medium underline hover:no-underline focus:outline-none"
              >
                {detailsExpanded ? 'Hide details' : 'Show details'}
              </button>
              {detailsExpanded && (
                <div className="mt-2 p-3 bg-white/50 rounded border text-xs font-mono whitespace-pre-wrap">
                  {details}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1 rounded text-sm font-medium transition-colors
                    ${buttonVariants[action.variant || 'secondary']}
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 ${config.iconColor} hover:opacity-70
              transition-opacity p-1 rounded
            `}
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Specialized upload error component
export interface UploadErrorMessageProps {
  id?: string;
  filename: string;
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  uploadId?: string;
}

export function UploadErrorMessage({
  id,
  filename,
  error,
  onRetry,
  onDismiss,
  uploadId
}: UploadErrorMessageProps) {
  const actions = [];
  
  if (onRetry) {
    actions.push({
      label: 'Retry Upload',
      onClick: onRetry,
      variant: 'primary' as const
    });
  }

  return (
    <ErrorMessage
      id={id}
      type="error"
      message={`Failed to upload "${filename}"`}
      details={error}
      actions={actions}
      onDismiss={onDismiss}
    />
  );
}

// Validation error component
export interface ValidationErrorMessageProps {
  id?: string;
  files: Array<{
    filename: string;
    error: string;
  }>;
  onDismiss?: () => void;
}

export function ValidationErrorMessage({
  id,
  files,
  onDismiss
}: ValidationErrorMessageProps) {
  const message = files.length === 1 
    ? `Cannot upload "${files[0].filename}"`
    : `Cannot upload ${files.length} files`;

  const details = files.map(f => `• ${f.filename}: ${f.error}`).join('\n');

  return (
    <ErrorMessage
      id={id}
      type="warning"
      message={message}
      details={details}
      showDetails={files.length <= 3} // Auto-expand for small lists
      onDismiss={onDismiss}
    />
  );
}

// Success message component
export interface SuccessMessageProps {
  id?: string;
  message: string;
  autoHide?: boolean;
  hideDelay?: number;
  onDismiss?: () => void;
}

export function SuccessMessage({
  id,
  message,
  autoHide = true,
  hideDelay = 3000,
  onDismiss
}: SuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide functionality
  useState(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  });

  if (!isVisible) return null;

  return (
    <div
      id={id}
      className="
        bg-green-50 border border-green-200 text-green-800
        rounded-lg p-4 mb-4
        animate-slideIn
      "
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg text-green-600">✅</span>
        <div className="flex-1 font-medium">{message}</div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="text-green-600 hover:opacity-70 transition-opacity"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}