// Safe Sentry initialization with error handling
try {
  const Sentry = require('@sentry/nextjs');
  
  const SENTRY_DSN = process.env.SENTRY_DSN;

  // Only initialize if DSN is provided
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        // Only add Prisma integration if available
        ...((() => {
          try {
            return [new Sentry.Integrations.Prisma()];
          } catch {
            return [];
          }
        })()),
      ],

      // Filter server-side errors
      beforeSend(event: any, hint: any) {
        const error = hint.originalException;

        if (error instanceof Error) {
          // Skip expected authentication errors
          if (
            error.message.includes('Unauthorized') ||
            error.message.includes('Authentication failed')
          ) {
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
  } else {
    console.info('Sentry DSN not configured, skipping server-side monitoring');
  }
} catch (error) {
  console.info('Sentry not available, continuing without server-side monitoring');
}
