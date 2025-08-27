import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT =
  process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;

      if (error instanceof Error) {
        // Skip network errors in development
        if (
          process.env.NODE_ENV === 'development' &&
          error.message.includes('fetch')
        ) {
          return null;
        }

        // Skip authentication errors (handled by app)
        if (
          error.message.includes('Unauthorized') ||
          error.message.includes('Authentication')
        ) {
          return null;
        }
      }

      return event;
    },

    // Performance filtering
    beforeSendTransaction(event) {
      // Skip health check transactions
      if (event.transaction?.includes('/api/health')) {
        return null;
      }

      return event;
    },

    // Additional configuration
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Prisma({ client: undefined }), // Will be set later
    ],

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Capture unhandled rejections
    captureUnhandledRejections: true,

    // Capture uncaught exceptions
    captureUncaughtException: true,
  });
}

// Custom error reporting functions
export function reportError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}

export function reportMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.captureMessage(message, level);
}

export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    timestamp: Date.now() / 1000,
  });
}

export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

export { Sentry };
