'use client';

import { AlertTriangle, Database, RefreshCw } from 'lucide-react';

interface DbOfflineNoticeProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function DbOfflineNotice({
  title = 'Database Unavailable',
  message = 'The database is currently unavailable. The application is running in safe mode with limited functionality.',
  showRetry = true,
  onRetry,
  className = '',
}: DbOfflineNoticeProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-full">
            <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            {title}
          </h3>

          <p className="text-amber-700 dark:text-amber-300 mb-4 leading-relaxed">
            {message}
          </p>

          <div className="flex items-center space-x-4">
            {showRetry && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-amber-900"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </button>
            )}

            <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Limited functionality available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function DbOfflineInline({
  message = 'Database offline - using cached data',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full ${className}`}
    >
      <Database className="w-3 h-3 mr-1" />
      {message}
    </div>
  );
}
