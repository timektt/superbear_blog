import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createHash, createHmac } from 'crypto';
import { logger } from '@/lib/logger';

// Enhanced security utilities for production

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token store (in production, use Redis)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// Webhook replay protection (in production, use Redis)
const webhookNonceStore = new Map<string, number>();

export interface SecurityConfig {
  rateLimits: {
    admin: { requests: number; windowMs: number };
    webhook: { requests: number; windowMs: number };
    cron: { requests: number; windowMs: number };
  };
  csrf: {
    enabled: boolean;
    tokenExpiry: number;
  };
  webhook: {
    timestampTolerance: number; // seconds
    requireSignature: boolean;
  };
  allowedIPs?: string[];
}

const defaultSecurityConfig: SecurityConfig = {
  rateLimits: {
    admin: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    webhook: { requests: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
    cron: { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  },
  csrf: {
    enabled: process.env.NODE_ENV === 'production',
    tokenExpiry: 60 * 60 * 1000, // 1 hour
  },
  webhook: {
    timestampTolerance: 300, // 5 minutes
    requireSignature: true,
  },
  allowedIPs: process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()),
};

// Enhanced rate limiting
export async function checkRateLimit(
  request: NextRequest,
  type: 'admin' | 'webhook' | 'cron',
  identifier?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const config = defaultSecurityConfig.rateLimits[type];
  const key = identifier || getClientIdentifier(request);
  const now = Date.now();
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: now + config.windowMs,
    };
  }
  
  if (current.count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: true,
    remaining: config.requests - current.count,
    resetTime: current.resetTime,
  };
}

// IP allowlist check
export function checkIPAllowlist(request: NextRequest): boolean {
  if (!defaultSecurityConfig.allowedIPs?.length) {
    return true; // No allowlist configured
  }
  
  const clientIP = getClientIP(request);
  if (!clientIP) {
    logger.warn('Unable to determine client IP for allowlist check');
    return false;
  }
  
  return defaultSecurityConfig.allowedIPs.includes(clientIP);
}

// Enhanced admin authentication with role-based access
export async function checkAdminAuth(
  request: NextRequest,
  requiredRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'VIEWER'
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { authorized: false, error: 'Not authenticated' };
    }
    
    // Check role if specified
    if (requiredRole) {
      const userRole = session.user.role || 'VIEWER';
      const roleHierarchy = ['VIEWER', 'AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'];
      const userLevel = roleHierarchy.indexOf(userRole);
      const requiredLevel = roleHierarchy.indexOf(requiredRole);
      
      if (userLevel < requiredLevel) {
        return { 
          authorized: false, 
          error: `Insufficient permissions. Required: ${requiredRole}, Current: ${userRole}` 
        };
      }
    }
    
    return { authorized: true, user: session.user };
    
  } catch (error) {
    logger.error('Admin authentication check failed', error as Error);
    return { authorized: false, error: 'Authentication check failed' };
  }
}

// CSRF token generation and validation
export function generateCSRFToken(sessionId: string): string {
  const token = createHash('sha256')
    .update(`${sessionId}:${Date.now()}:${Math.random()}`)
    .digest('hex');
    
  csrfTokenStore.set(sessionId, {
    token,
    expires: Date.now() + defaultSecurityConfig.csrf.tokenExpiry,
  });
  
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  if (!defaultSecurityConfig.csrf.enabled) {
    return true;
  }
  
  const stored = csrfTokenStore.get(sessionId);
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expires) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
}

// Enhanced webhook signature verification with replay protection
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  provider: 'sendgrid' | 'mailgun' | 'postmark' | 'resend',
  timestamp?: string
): { valid: boolean; error?: string } {
  try {
    // Check timestamp for replay protection
    if (timestamp) {
      const webhookTime = parseInt(timestamp) * 1000; // Convert to milliseconds
      const now = Date.now();
      const tolerance = defaultSecurityConfig.webhook.timestampTolerance * 1000;
      
      if (Math.abs(now - webhookTime) > tolerance) {
        return { valid: false, error: 'Webhook timestamp outside tolerance window' };
      }
      
      // Check for replay (nonce-based)
      const nonce = createHash('sha256').update(`${payload}:${timestamp}`).digest('hex');
      if (webhookNonceStore.has(nonce)) {
        return { valid: false, error: 'Webhook replay detected' };
      }
      
      // Store nonce (cleanup old ones)
      webhookNonceStore.set(nonce, now);
      cleanupOldNonces();
    }
    
    // Verify signature based on provider
    let expectedSignature: string;
    
    switch (provider) {
      case 'sendgrid':
        expectedSignature = createHmac('sha256', secret)
          .update(payload)
          .digest('base64');
        break;
        
      case 'mailgun':
        const [ts, token, hmacSig] = signature.split(',');
        const data = ts + token;
        expectedSignature = createHmac('sha256', secret)
          .update(data)
          .digest('hex');
        return { valid: hmacSig === expectedSignature };
        
      case 'postmark':
        expectedSignature = createHmac('sha256', secret)
          .update(payload)
          .digest('base64');
        break;
        
      case 'resend':
        expectedSignature = `sha256=${createHmac('sha256', secret)
          .update(payload)
          .digest('hex')}`;
        break;
        
      default:
        return { valid: false, error: `Unsupported provider: ${provider}` };
    }
    
    const isValid = signature === expectedSignature;
    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' };
    
  } catch (error) {
    logger.error('Webhook signature verification failed', error as Error);
    return { valid: false, error: 'Signature verification error' };
  }
}

// Utility functions
function getClientIdentifier(request: NextRequest): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function cleanupOldNonces(): void {
  const cutoff = Date.now() - (defaultSecurityConfig.webhook.timestampTolerance * 2 * 1000);
  for (const [nonce, timestamp] of webhookNonceStore.entries()) {
    if (timestamp < cutoff) {
      webhookNonceStore.delete(nonce);
    }
  }
}

// PII-safe logging utilities
export function hashPII(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

export function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  const piiFields = ['email', 'phone', 'address', 'name', 'ip'];
  
  for (const field of piiFields) {
    if (sanitized[field]) {
      sanitized[`${field}_hash`] = hashPII(sanitized[field]);
      delete sanitized[field];
    }
  }
  
  return sanitized;
}

// Environment validation with Zod
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
  EMAIL_WEBHOOK_SECRET: z.string().min(16, 'EMAIL_WEBHOOK_SECRET must be at least 16 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // Optional with defaults
  EMAIL_BATCH_SIZE: z.string().regex(/^\d+$/).optional(),
  EMAIL_SEND_THROTTLE_MS: z.string().regex(/^\d+$/).optional(),
  GMAIL_THROTTLE_LIMIT: z.string().regex(/^\d+$/).optional(),
  OUTLOOK_THROTTLE_LIMIT: z.string().regex(/^\d+$/).optional(),
  REDIS_URL: z.string().url().optional(),
});

export function validateEnvironment(): { valid: boolean; errors?: string[] } {
  try {
    envSchema.parse(process.env);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}