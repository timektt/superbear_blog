import { init } from '@sentry/nextjs'

try {
  if (process.env.SENTRY_DSN) {
    init({
      dsn: process.env.SENTRY_DSN,
      debug: process.env.NODE_ENV === 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    })
  }
} catch (error) {
  console.error('Sentry initialization failed:', error)
}
