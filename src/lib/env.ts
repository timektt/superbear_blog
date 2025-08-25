import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  // Circuit breaker and health check configuration
  DB_HEALTHCHECK_TIMEOUT_MS: z.coerce.number().default(1200),
  BREAKER_THRESHOLD: z.coerce.number().default(5),
  BREAKER_RESET_MS: z.coerce.number().default(30000),
});

// Parse and validate environment variables
export const safeEnv = envSchema.parse(process.env);

/**
 * Robust database configuration detection
 * Supports file:/, postgres:/, mysql:/, and other database URLs
 */
export function isDatabaseConfigured(): boolean {
  const databaseUrl = safeEnv.DATABASE_URL;
  
  if (!databaseUrl || databaseUrl.trim() === '') {
    return false;
  }

  try {
    // Parse URL to validate format
    const url = new URL(databaseUrl);
    
    // Support common database protocols
    const supportedProtocols = [
      'file:', 
      'postgres:', 
      'postgresql:', 
      'mysql:', 
      'sqlite:', 
      'mongodb:',
      'redis:'
    ];
    
    const isValidProtocol = supportedProtocols.some(protocol => 
      url.protocol === protocol
    );
    
    if (!isValidProtocol) {
      return false;
    }

    // Special handling for file: URLs (SQLite)
    if (url.protocol === 'file:') {
      // For file URLs, just check if path exists
      return url.pathname && url.pathname !== '/';
    }

    // For network databases, check if hostname exists
    if (url.hostname && url.hostname !== '') {
      return true;
    }

    return false;
  } catch {
    // Invalid URL format
    return false;
  }
}

// Export computed flags
export const IS_DB_CONFIGURED = isDatabaseConfigured();
export const IS_PRODUCTION = safeEnv.NODE_ENV === 'production';
export const IS_DEVELOPMENT = safeEnv.NODE_ENV === 'development';
export const IS_TEST = safeEnv.NODE_ENV === 'test';

// Database connection status
export const DB_STATUS = {
  configured: IS_DB_CONFIGURED,
  url: IS_DB_CONFIGURED ? safeEnv.DATABASE_URL : null,
  safeMode: !IS_DB_CONFIGURED,
} as const;

// Environment info for debugging
export const ENV_INFO = {
  nodeEnv: safeEnv.NODE_ENV,
  hasDatabase: IS_DB_CONFIGURED,
  hasAuth: !!safeEnv.NEXTAUTH_SECRET,
  hasCloudinary: !!(
    safeEnv.CLOUDINARY_CLOUD_NAME && safeEnv.CLOUDINARY_API_KEY
  ),
  hasSentry: !!safeEnv.SENTRY_DSN,
} as const;