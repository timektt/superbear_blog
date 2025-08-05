'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={text || 'Loading'}
      >
        <span className="sr-only">{text || 'Loading...'}</span>
      </div>
      {text && (
        <p
          className={`mt-2 text-gray-600 ${textSizeClasses[size]}`}
          aria-live="polite"
        >
          {text}
        </p>
      )}
    </div>
  );
}
