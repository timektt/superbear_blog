import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit } from '@/lib/rate-limit';
import { validateCSRFMiddleware, validateOrigin } from '@/lib/csrf';
import { hasPermission, UserRole } from '@/lib/rbac';

// Define protected routes
const protectedRoutes = ['/admin'];
const apiRoutes = ['/api/admin'];

// Content Security Policy
const CSP_HEADER = [
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
  "frame-ancestors 'none'",
].join('; ');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Generate or extract request ID for logging context
  const requestId = request.headers.get('x-request-id') || 
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Security headers for all requests
  const response = NextResponse.next();
  
  // Add request ID to response headers for tracing
  response.headers.set('x-request-id', requestId);
  
  // Enhanced security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      rateLimitResult.remaining.toString()
    );
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
  }
  
  // Enhanced CSRF protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    // Validate origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }
    
    // CSRF token validation for admin routes
    if (pathname.startsWith('/api/admin')) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      
      const csrfValidation = await validateCSRFMiddleware(request, token?.id as string);
      if (!csrfValidation.valid) {
        return NextResponse.json(
          { error: csrfValidation.error || 'CSRF validation failed' },
          { status: 403, headers: { 'x-request-id': requestId } }
        );
      }
    }
  }
  
  // Authentication check for protected routes
  if (
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    apiRoutes.some((route) => pathname.startsWith(route))
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) {
      // Redirect to login for protected pages
      if (pathname.startsWith('/admin')) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Return 401 for API routes
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Enhanced role-based access control
    if (token && pathname.startsWith('/api/admin')) {
      const userRole = token.role as UserRole;
      
      // Permission-based access control
      const permissionMap: Record<string, string> = {
        '/api/admin/users': 'users:manage_roles',
        '/api/admin/settings': 'system:settings',
        '/api/admin/campaigns': 'campaigns:create',
        '/api/admin/newsletter': 'newsletter:manage',
        '/api/admin/media/cleanup': 'media:delete',
        '/api/admin/slugs': 'articles:create',
      };
      
      for (const [route, permission] of Object.entries(permissionMap)) {
        if (pathname.startsWith(route)) {
          if (!hasPermission(userRole, permission as any)) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
          break;
        }
      }
      
      // Method-specific permissions
      if (request.method === 'DELETE' && pathname.includes('/articles/')) {
        if (!hasPermission(userRole, 'articles:delete')) {
          return NextResponse.json(
            { error: 'Insufficient permissions to delete articles' },
            { status: 403 }
          );
        }
      }
      
      if (request.method === 'POST' && pathname.includes('/articles/')) {
        if (!hasPermission(userRole, 'articles:create')) {
          return NextResponse.json(
            { error: 'Insufficient permissions to create articles' },
            { status: 403 }
          );
        }
      }
    }
  }
  
  // Maintenance mode check
  if (
    process.env.ENABLE_MAINTENANCE_MODE === 'true' &&
    !pathname.startsWith('/api/health') &&
    !pathname.startsWith('/maintenance')
  ) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};