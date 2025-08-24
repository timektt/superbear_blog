import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton, LoadingSpinner } from "./skeleton"

interface LoadingStateProps {
  className?: string;
  children?: React.ReactNode;
}

// Generic loading wrapper
function LoadingWrapper({ 
  isLoading, 
  fallback, 
  children 
}: { 
  isLoading: boolean; 
  fallback: React.ReactNode; 
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

// Button loading state
function ButtonLoading({ className, children, ...props }: LoadingStateProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={cn("inline-flex items-center justify-center", className)} 
      disabled 
      {...props}
    >
      <LoadingSpinner className="w-4 h-4 mr-2" />
      {children || "Loading..."}
    </button>
  );
}

// Form loading state
function FormLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

// Page loading state
function PageLoading({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Navigation loading state
function NavigationLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <Skeleton className="h-8 w-32" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-18" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

// Content loading states for different content types
function ContentLoading({ type, className }: { type: 'article' | 'podcast' | 'newsletter'; className?: string }) {
  switch (type) {
    case 'article':
      return (
        <div className={cn("space-y-4", className)}>
          <Skeleton className="h-48 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      );
    
    case 'podcast':
      return (
        <div className={cn("space-y-3", className)}>
          <div className="flex space-x-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      );
    
    case 'newsletter':
      return (
        <div className={cn("space-y-3", className)}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      );
    
    default:
      return <Skeleton className={cn("h-32 w-full", className)} />;
  }
}

// Error state component
function ErrorState({ 
  title = "Something went wrong", 
  message = "Please try again later", 
  onRetry,
  className 
}: { 
  title?: string; 
  message?: string; 
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center", className)}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <svg 
          className="w-6 h-6 text-destructive" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// Empty state component
function EmptyState({ 
  title = "No items found", 
  message = "There are no items to display", 
  action,
  className 
}: { 
  title?: string; 
  message?: string; 
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center", className)}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg 
          className="w-6 h-6 text-muted-foreground" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );
}

export {
  LoadingWrapper,
  ButtonLoading,
  FormLoading,
  PageLoading,
  NavigationLoading,
  ContentLoading,
  ErrorState,
  EmptyState
}