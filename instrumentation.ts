export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side
    const { initSentry } = await import('./src/lib/sentry');
    initSentry();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Initialize Sentry for edge runtime
    const { initSentry } = await import('./src/lib/sentry');
    initSentry();
  }
}