/**
 * Security utilities for the application
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const key = `rate_limit:${ip}`;
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    current.count++;
    return { allowed: true, remaining: maxRequests - current.count };
  };
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  
  // In production, implement proper CSRF token validation
  // This is a simplified version
  return token.length === 64 && /^[a-f0-9]+$/.test(token);
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHTML(content: string): string {
  // Remove script tags and event handlers
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
}

/**
 * Validate URL for safety
 */
export function isValidImageURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS
    if (parsedUrl.protocol !== 'https:') return false;
    
    // Only allow specific domains
    const allowedDomains = [
      'res.cloudinary.com',
      'cloudinary.com'
    ];
    
    const isAllowedDomain = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowedDomain) return false;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /onload=/i,
      /onerror=/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // Check file size
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images are allowed.' };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.php$/i,
    /\.jsp$/i,
    /\.asp$/i,
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { valid: false, error: 'Suspicious file name detected' };
  }
  
  return { valid: true };
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data
 */
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
}

/**
 * Verify hashed data
 */
export function verifyHashedData(data: string, hashedData: string): boolean {
  try {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  } catch {
    return false;
  }
}

/**
 * Content Security Policy headers
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-* needed for Next.js
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': CSP_HEADER,
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string, 
  details: Record<string, any>, 
  request?: NextRequest
) {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: request?.headers.get('x-forwarded-for') || 
        request?.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
    url: request?.url || 'unknown'
  };
  
  console.warn('SECURITY_EVENT:', JSON.stringify(logData));
  
  // In production, send to security monitoring service
  // Example: Sentry, DataDog, etc.
}