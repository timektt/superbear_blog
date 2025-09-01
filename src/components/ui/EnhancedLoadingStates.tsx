'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  rows?: number;
  columns?: number;
  className?: string;
}

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
}

// Enhanced base skeleton component with better accessibility
export function EnhancedSkeleton({ 
  className = '', 
  children, 
  'aria-label': ariaLabel = 'Loading...',
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-muted rounded-md', className)}
      role="status"
      aria-label={ariaLabel}
      {...props}
    >
      <span className="sr-only">{ariaLabel}</span>
      {children}
    </div>
  );
}

// Article Grid Loading State with improved accessibility
export function ArticleGridLoading({
  rows = 6,
  columns = 3,
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={cn('space-y-8', className)}
      role="status"
      aria-label="Loading articles..."
    >
      <div className="sr-only">Loading articles...</div>
      
      {/* Grid container */}
      <div 
        className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}
      >
        {Array.from({ length: rows }).map((_, index) => (
          <article
            key={index}
            className="space-y-4"
            aria-label={`Loading article ${index + 1}`}
          >
            {/* Image placeholder */}
            <EnhancedSkeleton 
              className="w-full aspect-video"
              aria-label="Loading article image"
            />

            {/* Content placeholder */}
            <div className="space-y-3">
              {/* Category badge */}
              <EnhancedSkeleton 
                className="h-5 w-20"
                aria-label="Loading category"
              />

              {/* Title */}
              <EnhancedSkeleton 
                className="h-6 w-full"
                aria-label="Loading article title"
              />
              <EnhancedSkeleton 
                className="h-6 w-3/4"
                aria-label="Loading article title continuation"
              />

              {/* Summary */}
              <div className="space-y-2">
                <EnhancedSkeleton 
                  className="h-4 w-full"
                  aria-label="Loading article summary"
                />
                <EnhancedSkeleton 
                  className="h-4 w-5/6"
                  aria-label="Loading article summary continuation"
                />
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4">
                <EnhancedSkeleton 
                  className="h-4 w-20"
                  aria-label="Loading author"
                />
                <EnhancedSkeleton 
                  className="h-4 w-16"
                  aria-label="Loading date"
                />
                <EnhancedSkeleton 
                  className="h-4 w-24"
                  aria-label="Loading reading time"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// Hero Section Loading State
export function HeroSectionLoading({ className = '' }: { className?: string }) {
  return (
    <section
      className={cn('py-8 lg:py-12', className)}
      role="status"
      aria-label="Loading hero section..."
    >
      <div className="sr-only">Loading featured articles...</div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main featured article */}
          <div className="lg:col-span-8">
            <div className="relative overflow-hidden rounded-2xl aspect-[16/9]">
              <EnhancedSkeleton 
                className="absolute inset-0"
                aria-label="Loading main featured article"
              />
              
              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
                <div className="space-y-4">
                  <EnhancedSkeleton 
                    className="h-6 w-24 bg-white/20"
                    aria-label="Loading category badge"
                  />
                  <EnhancedSkeleton 
                    className="h-8 w-3/4 bg-white/20"
                    aria-label="Loading main article title"
                  />
                  <EnhancedSkeleton 
                    className="h-6 w-full bg-white/20"
                    aria-label="Loading main article summary"
                  />
                  <div className="flex justify-between items-center">
                    <EnhancedSkeleton 
                      className="h-4 w-32 bg-white/20"
                      aria-label="Loading author and date"
                    />
                    <EnhancedSkeleton 
                      className="h-10 w-32 bg-white/20"
                      aria-label="Loading call-to-action button"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary featured articles */}
          <div className="lg:col-span-4 space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <article
                key={index}
                className="bg-background rounded-xl overflow-hidden border border-border"
                aria-label={`Loading secondary featured article ${index + 1}`}
              >
                <EnhancedSkeleton 
                  className="w-full aspect-[16/10]"
                  aria-label="Loading secondary article image"
                />
                <div className="p-4 space-y-3">
                  <EnhancedSkeleton 
                    className="h-5 w-3/4"
                    aria-label="Loading secondary article title"
                  />
                  <EnhancedSkeleton 
                    className="h-4 w-full"
                    aria-label="Loading secondary article summary"
                  />
                  <EnhancedSkeleton 
                    className="h-3 w-24"
                    aria-label="Loading secondary article meta"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Category Navigation Loading State
export function CategoryNavigationLoading({ className = '' }: { className?: string }) {
  return (
    <div
      className={cn('relative', className)}
      role="status"
      aria-label="Loading category navigation..."
    >
      <div className="sr-only">Loading categories...</div>
      
      <div className="flex gap-3 overflow-hidden pb-3 px-8 sm:px-12 md:px-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <EnhancedSkeleton
            key={index}
            className="flex-shrink-0 h-10 w-20 rounded-full"
            aria-label={`Loading category ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// Newsletter CTA Loading State
export function NewsletterCTALoading({ className = '' }: { className?: string }) {
  return (
    <section
      className={cn('py-16 lg:py-24', className)}
      role="status"
      aria-label="Loading newsletter signup..."
    >
      <div className="sr-only">Loading newsletter signup form...</div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-12 bg-muted/30">
          <div className="text-center space-y-8">
            {/* Icon */}
            <EnhancedSkeleton 
              className="w-16 h-16 rounded-full mx-auto"
              aria-label="Loading newsletter icon"
            />

            {/* Headline */}
            <div className="space-y-4">
              <EnhancedSkeleton 
                className="h-8 w-96 mx-auto"
                aria-label="Loading newsletter headline"
              />
              <EnhancedSkeleton 
                className="h-5 w-full max-w-2xl mx-auto"
                aria-label="Loading newsletter description"
              />
            </div>

            {/* Stats */}
            <div className="flex justify-center items-center gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center space-y-2">
                  <EnhancedSkeleton 
                    className="h-6 w-16 mx-auto"
                    aria-label={`Loading stat ${index + 1}`}
                  />
                  <EnhancedSkeleton 
                    className="h-4 w-12 mx-auto"
                    aria-label={`Loading stat label ${index + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <EnhancedSkeleton 
                  className="flex-1 h-12"
                  aria-label="Loading email input"
                />
                <EnhancedSkeleton 
                  className="h-12 w-32"
                  aria-label="Loading subscribe button"
                />
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center space-y-4">
                  <EnhancedSkeleton 
                    className="w-12 h-12 rounded-full mx-auto"
                    aria-label={`Loading benefit icon ${index + 1}`}
                  />
                  <EnhancedSkeleton 
                    className="h-5 w-32 mx-auto"
                    aria-label={`Loading benefit title ${index + 1}`}
                  />
                  <EnhancedSkeleton 
                    className="h-4 w-full"
                    aria-label={`Loading benefit description ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Enhanced Loading Spinner with accessibility
export function AccessibleLoadingSpinner({ 
  className = '',
  size = 'md',
  label = 'Loading...'
}: { 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label={label}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary',
          sizeClasses[size]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Page transition loading
export function PageTransitionLoading() {
  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      role="status"
      aria-label="Loading page..."
    >
      <div className="text-center space-y-4">
        <AccessibleLoadingSpinner size="lg" />
        <p className="text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}