# Build System Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting for build system issues in the SuperBear Blog project, with special focus on Sentry integration, error handling, and environment configuration.

## Common Build Issues

### 1. Sentry Configuration Errors

**Symptoms**:
- Build fails with Sentry import errors
- "Cannot resolve module @sentry/nextjs" errors
- Runtime errors related to Sentry initialization

**Root Causes**:
- Missing or incorrect Sentry environment variables
- Improper conditional imports in configuration files
- Development vs production configuration conflicts

**Solutions**:

#### Fix Sentry Client Configuration

```typescript
// sentry.client.config.ts
import { init } from '@sentry/nextjs'

// Only initialize Sentry if DSN is available
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Development vs Production settings
    debug: process.env.NODE_ENV === 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out development-only errors
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event:', event)
      }
      return event
    },
    
    // Integration configuration
    integrations: [
      // Only enable performance monitoring in production
      ...(process.env.NODE_ENV === 'production' ? [] : [])
    ]
  })
} else {
  console.warn('Sentry DSN not configured - error tracking disabled')
}
```

#### Fix Sentry Server Configuration

```typescript
// sentry.server.config.ts
import { init } from '@sentry/nextjs'

// Server-side Sentry initialization with error handling
try {
  if (process.env.SENTRY_DSN) {
    init({
      dsn: process.env.SENTRY_DSN,
      
      // Server-specific settings
      debug: process.env.NODE_ENV === 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Server environment info
      environment: process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
      
      // Error handling
      beforeSend(event) {
        // Log server errors for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('Server error captured by Sentry:', event)
        }
        return event
      }
    })
  }
} catch (error) {
  console.error('Failed to initialize Sentry:', error)
  // Continue without Sentry rather than crashing
}
```

#### Update Next.js Configuration

```typescript
// next.config.ts
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  // Your existing Next.js configuration
  experimental: {
    serverComponentsExternalPackages: ['@sentry/nextjs']
  },
  
  // Image configuration
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com']
  }
}

// Conditional Sentry configuration
const sentryWebpackPluginOptions = {
  // Only enable in production builds
  silent: process.env.NODE_ENV !== 'production',
  
  // Upload source maps only if auth token is available
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Organization and project
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Don't upload source maps in development
  dryRun: process.env.NODE_ENV === 'development'
}

// Export configuration with or without Sentry
export default process.env.SENTRY_DSN 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig
```

### 2. Environment Variable Issues

**Symptoms**:
- Build succeeds but runtime errors occur
- Features not working as expected
- Configuration not loading properly

**Diagnosis**:

```bash
# Check environment variables during build
echo "Checking environment variables..."
echo "NODE_ENV: $NODE_ENV"
echo "NEXT_PUBLIC_LAYOUT: $NEXT_PUBLIC_LAYOUT"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..." # Show first 20 chars only
echo "SENTRY_DSN configured: ${SENTRY_DSN:+yes}"
```

**Environment Variable Validation**:

```typescript
// lib/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  // Required in all environments
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Database (required)
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  
  // Authentication (required for admin features)
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Cloudinary (required for media uploads)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Public environment variables
  NEXT_PUBLIC_LAYOUT: z.enum(['classic', 'magazine']).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_DEBUG_LAYOUT: z.string().optional()
})

export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env)
    
    // Warn about missing optional but recommended variables
    const warnings: string[] = []
    
    if (!env.DATABASE_URL) {
      warnings.push('DATABASE_URL not configured - using safe mode')
    }
    
    if (!env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
      warnings.push('SENTRY_DSN not configured - error tracking disabled')
    }
    
    if (!env.CLOUDINARY_CLOUD_NAME) {
      warnings.push('Cloudinary not configured - image uploads disabled')
    }
    
    if (warnings.length > 0) {
      console.warn('Environment warnings:', warnings)
    }
    
    return { success: true, env, warnings }
  } catch (error) {
    console.error('Environment validation failed:', error)
    return { success: false, error }
  }
}

// Validate environment on startup
if (typeof window === 'undefined') {
  validateEnvironment()
}
```

### 3. TypeScript Build Errors

**Common Issues**:

```typescript
// Fix: Proper type definitions for environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      DATABASE_URL?: string
      DIRECT_URL?: string
      NEXTAUTH_SECRET?: string
      NEXTAUTH_URL?: string
      CLOUDINARY_CLOUD_NAME?: string
      CLOUDINARY_API_KEY?: string
      CLOUDINARY_API_SECRET?: string
      SENTRY_DSN?: string
      SENTRY_ORG?: string
      SENTRY_PROJECT?: string
      SENTRY_AUTH_TOKEN?: string
      NEXT_PUBLIC_LAYOUT?: 'classic' | 'magazine'
      NEXT_PUBLIC_SENTRY_DSN?: string
      NEXT_PUBLIC_DEBUG_LAYOUT?: string
    }
  }
}

export {}
```

**Fix: Strict TypeScript Configuration**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## Error Handling Implementation

### Centralized Error Handling System

```typescript
// lib/error-handling.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500)
    this.name = 'DatabaseError'
    
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

// Error handler utility
export function handleError(error: unknown): AppError {
  // If it's already an AppError, return as-is
  if (error instanceof AppError) {
    return error
  }
  
  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string }
    
    switch (prismaError.code) {
      case 'P2002':
        return new ValidationError('Unique constraint violation')
      case 'P2025':
        return new AppError('Record not found', 'NOT_FOUND', 404)
      default:
        return new DatabaseError(prismaError.message)
    }
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR')
  }
  
  // Handle unknown error types
  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR')
}

// Sentry integration
export function reportError(error: AppError, context?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error)
    if (context) {
      console.error('Context:', context)
    }
  }
  
  // Report to Sentry if available
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        errorCode: error.code,
        isOperational: error.isOperational
      },
      extra: context
    })
  }
}
```

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client'

import React from 'react'
import { reportError, AppError } from '@/lib/error-handling'

interface ErrorBoundaryState {
  hasError: boolean
  error?: AppError
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(error.message, 'COMPONENT_ERROR')
    
    return {
      hasError: true,
      error: appError
    }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = this.state.error || new AppError(error.message, 'COMPONENT_ERROR')
    
    reportError(appError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Something went wrong
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## Build Scripts and Automation

### Enhanced Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "npm run env:validate && next build",
    "build:analyze": "ANALYZE=true npm run build",
    "build:production": "NODE_ENV=production npm run build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "env:validate": "node scripts/validate-env.js",
    "build:check": "npm run type-check && npm run lint && npm run test",
    "prebuild": "npm run build:check"
  }
}
```

### Environment Validation Script

```javascript
// scripts/validate-env.js
const { validateEnvironment } = require('../lib/env-validation')

const result = validateEnvironment()

if (!result.success) {
  console.error('❌ Environment validation failed')
  console.error(result.error.message)
  process.exit(1)
}

if (result.warnings && result.warnings.length > 0) {
  console.warn('⚠️  Environment warnings:')
  result.warnings.forEach(warning => {
    console.warn(`  - ${warning}`)
  })
}

console.log('✅ Environment validation passed')
```

## Deployment Troubleshooting

### Vercel Deployment Issues

**Common Problems**:
1. Environment variables not set in Vercel dashboard
2. Build timeouts due to large bundle size
3. Sentry configuration issues in production

**Solutions**:

```bash
# Check Vercel environment variables
vercel env ls

# Add missing environment variables
vercel env add SENTRY_DSN production
vercel env add DATABASE_URL production

# Check build logs
vercel logs [deployment-url]
```

### Docker Deployment Issues

```dockerfile
# Dockerfile with proper error handling
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Validate environment before building
RUN npm run env:validate

# Build with error handling
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## Monitoring and Debugging

### Build Performance Monitoring

```typescript
// lib/build-monitor.ts
export function measureBuildTime<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = Date.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = Date.now() - start
      console.log(`Build operation "${operation}" took ${duration}ms`)
    })
  } else {
    const duration = Date.now() - start
    console.log(`Build operation "${operation}" took ${duration}ms`)
    return result
  }
}
```

### Debug Mode Configuration

```typescript
// lib/debug.ts
export const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_LAYOUT === 'true',
  
  log: (message: string, data?: any) => {
    if (DEBUG_CONFIG.enabled) {
      console.log(`[DEBUG] ${message}`, data)
    }
  },
  
  error: (message: string, error?: any) => {
    if (DEBUG_CONFIG.enabled) {
      console.error(`[DEBUG ERROR] ${message}`, error)
    }
  },
  
  time: (label: string) => {
    if (DEBUG_CONFIG.enabled) {
      console.time(`[DEBUG] ${label}`)
    }
  },
  
  timeEnd: (label: string) => {
    if (DEBUG_CONFIG.enabled) {
      console.timeEnd(`[DEBUG] ${label}`)
    }
  }
}
```

## Quick Reference

### Emergency Build Fixes

```bash
# 1. Clear all caches
rm -rf .next node_modules package-lock.json
npm install
npm run build

# 2. Skip Sentry temporarily
export SENTRY_DSN=""
npm run build

# 3. Check for TypeScript errors
npm run type-check

# 4. Validate environment
npm run env:validate

# 5. Test in safe mode
export DATABASE_URL=""
npm run dev
```

### Environment Variable Checklist

**Required for Basic Functionality**:
- [ ] `NODE_ENV` (development/production)
- [ ] `NEXTAUTH_SECRET` (32+ characters)
- [ ] `NEXTAUTH_URL` (full URL to your site)

**Required for Full Functionality**:
- [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] `DIRECT_URL` (Direct PostgreSQL connection)
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

**Optional but Recommended**:
- [ ] `SENTRY_DSN` (Error tracking)
- [ ] `NEXT_PUBLIC_LAYOUT` (Layout selection)
- [ ] `REDIS_URL` (Caching)

---

*Last updated: January 2025*  
*For urgent build issues: Check GitHub Issues or contact development team*  
*For Sentry-specific issues: Refer to Sentry documentation*