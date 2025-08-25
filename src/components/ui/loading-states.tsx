'use client';

import React from 'react';

interface LoadingStateProps {
  rows?: number;
  columns?: number;
  className?: string;
}

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

// Base skeleton component
export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-md ${className}`}
      role="status"
      aria-label="Loading..."
    >
      {children}
    </div>
  );
}

// Article List Loading State
export function ArticleListLoading({ rows = 5, className = '' }: LoadingStateProps) {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label="Loading articles...">
      <div className="sr-only">Loading articles...</div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 p-4 border border-border rounded-lg">
          {/* Image placeholder */}
          <Skeleton className="w-24 h-24 flex-shrink-0" />
          
          {/* Content placeholder */}
          <div className="flex-1 space-y-3">
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />
            
            {/* Summary */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            
            {/* Meta info */}
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Article Detail Loading State
export function ArticleDetailLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${className}`} role="status" aria-label="Loading article...">
      <div className="sr-only">Loading article...</div>
      
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      {/* Featured image */}
      <Skeleton className="w-full h-64" />
      
      {/* Content */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard Loading State
export function DashboardLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-8 ${className}`} role="status" aria-label="Loading dashboard...">
      <div className="sr-only">Loading dashboard...</div>
      
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-6 border border-border rounded-lg space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border border-border rounded-lg space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="p-6 border border-border rounded-lg space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

// Table Loading State
export function TableLoading({ rows = 10, columns = 5, className = '' }: LoadingStateProps) {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading table data...">
      <div className="sr-only">Loading table data...</div>
      
      {/* Table header */}
      <div className="grid gap-4 p-4 border-b border-border" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 p-4 border-b border-border" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Form Loading State
export function FormLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label="Loading form...">
      <div className="sr-only">Loading form...</div>
      
      {/* Form fields */}
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      {/* Action buttons */}
      <div className="flex gap-4 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

// Analytics Loading State
export function AnalyticsLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-8 ${className}`} role="status" aria-label="Loading analytics...">
      <div className="sr-only">Loading analytics...</div>
      
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-6 border border-border rounded-lg space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="space-y-6">
        <div className="p-6 border border-border rounded-lg space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-80 w-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 border border-border rounded-lg space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="p-6 border border-border rounded-lg space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Search Results Loading State
export function SearchResultsLoading({ rows = 8, className = '' }: LoadingStateProps) {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label="Loading search results...">
      <div className="sr-only">Loading search results...</div>
      
      {/* Search header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Results */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
          <Skeleton className="h-5 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic Grid Loading State
export function GridLoading({ 
  items = 12, 
  columns = 3, 
  aspectRatio = 'aspect-video',
  className = '' 
}: { 
  items?: number; 
  columns?: number; 
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div 
      className={`grid gap-6 ${className}`} 
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      role="status" 
      aria-label="Loading grid items..."
    >
      <div className="sr-only">Loading grid items...</div>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className={`w-full ${aspectRatio}`} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Page Loading State (full page)
export function PageLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`} role="status" aria-label="Loading page...">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    </div>
  );
}

// Simple Loading Spinner
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`} role="status" aria-label="Loading...">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}