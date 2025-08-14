import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma(),
  ],
  
  // Filter server-side errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    if (error instanceof Error) {
      // Skip expected authentication errors
      if (error.message.includes('Unauthorized') || 
          error.message.includes('Authentication failed')) {
        return null;
      }
      
      // Skip validation errors (handled by application)
      if (error.message.includes('Validation error')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Server-specific settings
  maxBreadcrumbs: 50,
  attachStacktrace: true,
});