import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { mediaCSRFProtection } from '@/lib/media/csrf-protection'
import { requireMediaPermission, type UserRole } from '@/lib/media/media-security'

/**
 * Generate CSRF token for media operations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = session.user.role as UserRole
    const userId = session.user.id
    const sessionId = session.user.sessionId || 'no-session'

    // Check if user has any media permissions
    const hasAnyMediaPermission = 
      requireMediaPermission('media:view')(userRole) ||
      requireMediaPermission('media:upload')(userRole) ||
      requireMediaPermission('media:manage')(userRole)

    if (!hasAnyMediaPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions for media operations' },
        { status: 403 }
      )
    }

    // Generate CSRF token
    const token = await mediaCSRFProtection.generateToken(userId, sessionId)

    const response = NextResponse.json({
      success: true,
      token,
      expiresIn: 3600 // 1 hour
    })

    // Set token in cookie as well
    mediaCSRFProtection.setTokenCookie(response, token)

    return response

  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

/**
 * Validate existing CSRF token
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const sessionId = session.user.sessionId || 'no-session'

    // Validate the token from request
    const validation = await mediaCSRFProtection.validateToken(request, userId, sessionId)

    return NextResponse.json({
      valid: validation.valid,
      reason: validation.reason
    })

  } catch (error) {
    console.error('CSRF token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate CSRF token' },
      { status: 500 }
    )
  }
}