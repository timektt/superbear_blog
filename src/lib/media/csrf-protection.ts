import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { logger } from '../logger'

// CSRF configuration
const CSRF_CONFIG = {
  tokenName: 'media-csrf-token',
  headerName: 'x-media-csrf-token',
  cookieName: 'media-csrf-token',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
  tokenExpiry: 3600, // 1 hour in seconds
  algorithm: 'HS256' as const
}

export interface CSRFTokenData {
  userId: string
  sessionId: string
  timestamp: number
  nonce: string
}

export interface CSRFValidationResult {
  valid: boolean
  reason?: string
  token?: string
}

/**
 * CSRF Protection Service for Media Operations
 */
export class MediaCSRFProtection {
  private readonly secret: Uint8Array

  constructor() {
    this.secret = new TextEncoder().encode(CSRF_CONFIG.secret)
  }

  /**
   * Generate a new CSRF token for media operations
   */
  async generateToken(userId: string, sessionId: string): Promise<string> {
    try {
      const tokenData: CSRFTokenData = {
        userId,
        sessionId,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: this.generateNonce()
      }

      const token = await new SignJWT(tokenData)
        .setProtectedHeader({ alg: CSRF_CONFIG.algorithm })
        .setIssuedAt()
        .setExpirationTime(`${CSRF_CONFIG.tokenExpiry}s`)
        .sign(this.secret)

      return token
    } catch (error) {
      logger.error('Failed to generate CSRF token:', error)
      throw new Error('CSRF token generation failed')
    }
  }

  /**
   * Validate CSRF token from request
   */
  async validateToken(
    request: NextRequest,
    userId: string,
    sessionId: string
  ): Promise<CSRFValidationResult> {
    try {
      // Get token from header or cookie
      const token = this.extractToken(request)
      
      if (!token) {
        return {
          valid: false,
          reason: 'CSRF token not found in request'
        }
      }

      // Verify and decode token
      const { payload } = await jwtVerify(token, this.secret)
      const tokenData = payload as unknown as CSRFTokenData

      // Validate token data
      if (!this.isValidTokenData(tokenData, userId, sessionId)) {
        return {
          valid: false,
          reason: 'Invalid token data'
        }
      }

      // Check token expiry (additional check beyond JWT expiry)
      if (this.isTokenExpired(tokenData)) {
        return {
          valid: false,
          reason: 'Token expired'
        }
      }

      return {
        valid: true,
        token
      }

    } catch (error) {
      logger.warn('CSRF token validation failed:', error)
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Token validation failed'
      }
    }
  }

  /**
   * Create response with CSRF token cookie
   */
  setTokenCookie(response: NextResponse, token: string): NextResponse {
    response.cookies.set(CSRF_CONFIG.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_CONFIG.tokenExpiry,
      path: '/api/admin/media'
    })

    return response
  }

  /**
   * Clear CSRF token cookie
   */
  clearTokenCookie(response: NextResponse): NextResponse {
    response.cookies.delete(CSRF_CONFIG.cookieName)
    return response
  }

  /**
   * Middleware helper for CSRF protection
   */
  async protectRoute(
    request: NextRequest,
    userId: string,
    sessionId: string
  ): Promise<{ allowed: boolean; response?: NextResponse }> {
    // Skip CSRF protection for GET requests (read-only operations)
    if (request.method === 'GET') {
      return { allowed: true }
    }

    // Skip CSRF protection in development (optional)
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_CSRF === 'true') {
      return { allowed: true }
    }

    const validation = await this.validateToken(request, userId, sessionId)

    if (!validation.valid) {
      logger.warn('CSRF protection blocked request:', {
        method: request.method,
        url: request.url,
        reason: validation.reason,
        userId
      })

      const response = NextResponse.json(
        {
          error: 'CSRF token validation failed',
          code: 'CSRF_INVALID',
          message: validation.reason || 'Invalid or missing CSRF token'
        },
        { status: 403 }
      )

      return { allowed: false, response }
    }

    return { allowed: true }
  }

  // Private helper methods

  private extractToken(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(CSRF_CONFIG.headerName)
    if (headerToken) {
      return headerToken
    }

    // Try cookie as fallback
    const cookieToken = request.cookies.get(CSRF_CONFIG.cookieName)?.value
    if (cookieToken) {
      return cookieToken
    }

    return null
  }

  private isValidTokenData(
    tokenData: CSRFTokenData,
    expectedUserId: string,
    expectedSessionId: string
  ): boolean {
    return (
      tokenData.userId === expectedUserId &&
      tokenData.sessionId === expectedSessionId &&
      typeof tokenData.timestamp === 'number' &&
      typeof tokenData.nonce === 'string' &&
      tokenData.nonce.length > 0
    )
  }

  private isTokenExpired(tokenData: CSRFTokenData): boolean {
    const now = Math.floor(Date.now() / 1000)
    const tokenAge = now - tokenData.timestamp
    return tokenAge > CSRF_CONFIG.tokenExpiry
  }

  private generateNonce(): string {
    // Generate a random nonce for additional security
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

// Export singleton instance
export const mediaCSRFProtection = new MediaCSRFProtection()

/**
 * Utility function to create CSRF-protected API response
 */
export async function createCSRFProtectedResponse(
  data: any,
  userId: string,
  sessionId: string,
  status: number = 200
): Promise<NextResponse> {
  const response = NextResponse.json(data, { status })
  
  try {
    // Generate new CSRF token for next request
    const token = await mediaCSRFProtection.generateToken(userId, sessionId)
    mediaCSRFProtection.setTokenCookie(response, token)
    
    // Also include token in response headers for client-side access
    response.headers.set('X-CSRF-Token', token)
  } catch (error) {
    logger.error('Failed to set CSRF token in response:', error)
  }

  return response
}

/**
 * Middleware wrapper for media API routes
 */
export function withCSRFProtection(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // Extract user info from request (implement based on your auth system)
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const sessionId = request.headers.get('x-session-id') || 'no-session'

    // Apply CSRF protection
    const protection = await mediaCSRFProtection.protectRoute(request, userId, sessionId)
    
    if (!protection.allowed) {
      return protection.response!
    }

    // Call the original handler
    return handler(request, context)
  }
}