// Safe Sentry initialization with error handling
try {
  const Sentry = require('@sentry/nextjs');
  
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Replay sessions for debugging
      replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
      replaysOnErrorSampleRate: 1.0,

      integrations: [
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
        new Sentry.BrowserTracing({
          // Performance monitoring for navigation
          routingInstrumentation: Sentry.nextRouterInstrumentation,
        }),
      ],

      // Filter out known client-side errors
      beforeSend(event: any, hint: any) {
        const error = hint.originalException;

        if (error instanceof Error) {
          // Skip network errors
          if (
            error.message.includes('NetworkError') ||
            error.message.includes('fetch')
          ) {
            return null;
          }

          // Skip ResizeObserver errors (common browser quirk)
          if (error.message.includes('ResizeObserver')) {
            return null;
          }

          // Skip non-Error objects
          if (typeof error !== 'object') {
            return null;
          }
        }

        return event;
      },

      // Release tracking
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

      // Debug mode in development
      debug: process.env.NODE_ENV === 'development',
    });
  } else {
    console.info('Sentry DSN not configured, skipping client-side monitoring');
  }
} catch (error) {
  console.info('Sentry not available, continuing without client-side monitoring');
}
