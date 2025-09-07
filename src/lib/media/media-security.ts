import { NextRequest } from 'next/server'
import { rateLimit } from '../rate-limit'
import { hasPermission, type UserRole, type Permission } from '../rbac'
import { logger } from '../logger'

// Media-specific permissions
export type MediaPermission = 
  | 'media:upload'
  | 'media:view'
  | 'media:delete'
  | 'media:bulk_delete'
  | 'media:manage'
  | 'media:cleanup'
  | 'media:admin'

// Media operation types for audit logging
export type MediaOperation = 
  | 'upload'
  | 'view'
  | 'delete'
  | 'bulk_delete'
  | 'cleanup'
  | 'search'
  | 'metadata_update'

// Rate limiting configurations for media operations
export const MEDIA_RATE_LIMITS = {
  // Upload operations - stricter limits
  upload: {
    max: 10, // 10 uploads per window
    windowMs: 300000, // 5 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  
  // Bulk operations - very strict
  bulk_operations: {
    max: 3, // 3 bulk operations per window
    windowMs: 900000, // 15 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  
  // Cleanup operations - extremely strict
  cleanup: {
    max: 1, // 1 cleanup per window
    windowMs: 3600000, // 1 hour
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  
  // View/search operations - more lenient
  view: {
    max: 100, // 100 views per window
    windowMs: 300000, // 5 minutes
    skipSuccessfulRequests: true,
    skipFailedRequests: true
  },
  
  // General media API - moderate
  general: {
    max: 50, // 50 requests per window
    windowMs: 300000, // 5 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  }
} as const

// Media access control configuration
export const MEDIA_ACCESS_CONTROL = {
  // Role-based permissions for media operations
  rolePermissions: {
    SUPER_ADMIN: ['media:upload', 'media:view', 'media:delete', 'media:bulk_delete', 'media:manage', 'media:cleanup', 'media:admin'] as MediaPermission[],
    ADMIN: ['media:upload', 'media:view', 'media:delete', 'media:bulk_delete', 'media:manage', 'media:cleanup'] as MediaPermission[],
    EDITOR: ['media:upload', 'media:view', 'media:delete', 'media:manage'] as MediaPermission[],
    AUTHOR: ['media:upload', 'media:view'] as MediaPermission[],
    VIEWER: ['media:view'] as MediaPermission[]
  },
  
  // File size limits by role (in bytes)
  fileSizeLimits: {
    SUPER_ADMIN: 50 * 1024 * 1024, // 50MB
    ADMIN: 25 * 1024 * 1024, // 25MB
    EDITOR: 15 * 1024 * 1024, // 15MB
    AUTHOR: 10 * 1024 * 1024, // 10MB
    VIEWER: 0 // No upload permission
  },
  
  // Upload quota per day by role
  dailyUploadQuota: {
    SUPER_ADMIN: 1000,
    ADMIN: 500,
    EDITOR: 200,
    AUTHOR: 50,
    VIEWER: 0
  }
} as const

export interface MediaSecurityContext {
  userRole: UserRole
  userId: string
  operation: MediaOperation
  resourceId?: string
  metadata?: Record<string, any>
}

export interface MediaRateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface MediaAccessResult {
  allowed: boolean
  reason?: string
  requiredPermission?: MediaPermission
}

export interface MediaAuditLog {
  userId: string
  userRole: UserRole
  operation: MediaOperation
  resourceId?: string
  success: boolean
  timestamp: Date
  ipAddress: string
  userAgent: string
  metadata?: Record<string, any>
  error?: string
}

/**
 * Media Security Manager
 */
export class MediaSecurityManager {
  /**
   * Check rate limits for media operations
   */
  async checkRateLimit(
    request: NextRequest,
    operation: MediaOperation
  ): Promise<MediaRateLimitResult> {
    try {
      // Get appropriate rate limit config
      const config = this.getRateLimitConfig(operation)
      
      // Apply rate limiting
      const result = await rateLimit(request)
      
      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000)
      }
    } catch (error) {
      logger.error('Media rate limit check failed:', error as any)
      // Fail closed - deny access on error
      return {
        allowed: false,
        limit: 0,
        remaining: 0,
        resetTime: Date.now() + 300000, // 5 minutes
        retryAfter: 300
      }
    }
  }

  /**
   * Check access permissions for media operations
   */
  checkAccess(
    context: MediaSecurityContext
  ): MediaAccessResult {
    const { userRole, operation } = context
    
    try {
      // Get required permission for operation
      const requiredPermission = this.getRequiredPermission(operation)
      
      // Check if user role has the required permission
      const hasAccess = this.hasMediaPermission(userRole, requiredPermission)
      
      if (!hasAccess) {
        return {
          allowed: false,
          reason: `Insufficient permissions for ${operation} operation`,
          requiredPermission
        }
      }
      
      // Additional checks for specific operations
      if (operation === 'bulk_delete' && !this.canPerformBulkOperations(userRole)) {
        return {
          allowed: false,
          reason: 'Bulk operations not allowed for this role',
          requiredPermission: 'media:bulk_delete'
        }
      }
      
      if (operation === 'cleanup' && !this.canPerformCleanup(userRole)) {
        return {
          allowed: false,
          reason: 'Cleanup operations not allowed for this role',
          requiredPermission: 'media:cleanup'
        }
      }
      
      return { allowed: true }
      
    } catch (error) {
      logger.error('Media access check failed:', error as any)
      return {
        allowed: false,
        reason: 'Access check failed'
      }
    }
  }

  /**
   * Get file size limit for user role
   */
  getFileSizeLimit(userRole: UserRole): number {
    return MEDIA_ACCESS_CONTROL.fileSizeLimits[userRole] || 0
  }

  /**
   * Get daily upload quota for user role
   */
  getDailyUploadQuota(userRole: UserRole): number {
    return MEDIA_ACCESS_CONTROL.dailyUploadQuota[userRole] || 0
  }

  /**
   * Log media operation for audit trail
   */
  async logMediaOperation(
    request: NextRequest,
    context: MediaSecurityContext,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const auditLog: MediaAuditLog = {
        userId: context.userId,
        userRole: context.userRole,
        operation: context.operation,
        resourceId: context.resourceId,
        success,
        timestamp: new Date(),
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: context.metadata,
        error
      }
      
      // Log to application logger
      logger.info('Media operation audit', auditLog as any)
      
      // In production, you might want to store this in a dedicated audit log table
      // await this.storeAuditLog(auditLog)
      
    } catch (logError) {
      logger.error('Failed to log media operation:', logError as any)
    }
  }

  /**
   * Validate CSRF token for state-changing operations
   */
  async validateCSRFToken(
    request: NextRequest,
    operation: MediaOperation
  ): Promise<boolean> {
    // Skip CSRF validation for read-only operations
    if (operation === 'view' || operation === 'search') {
      return true
    }
    
    try {
      const csrfToken = request.headers.get('x-csrf-token')
      
      if (!csrfToken) {
        logger.warn('Missing CSRF token for media operation:', operation as any)
        return false
      }
      
      // Validate CSRF token (implement your CSRF validation logic)
      // This is a placeholder - implement actual CSRF validation
      return this.isValidCSRFToken(csrfToken)
      
    } catch (error) {
      logger.error('CSRF validation failed:', error as unknown)
      return false
    }
  }

  // Private helper methods

  private getRateLimitConfig(operation: MediaOperation) {
    switch (operation) {
      case 'upload':
        return MEDIA_RATE_LIMITS.upload
      case 'bulk_delete':
        return MEDIA_RATE_LIMITS.bulk_operations
      case 'cleanup':
        return MEDIA_RATE_LIMITS.cleanup
      case 'view':
      case 'search':
        return MEDIA_RATE_LIMITS.view
      default:
        return MEDIA_RATE_LIMITS.general
    }
  }

  private getRequiredPermission(operation: MediaOperation): MediaPermission {
    switch (operation) {
      case 'upload':
        return 'media:upload'
      case 'view':
      case 'search':
        return 'media:view'
      case 'delete':
        return 'media:delete'
      case 'bulk_delete':
        return 'media:bulk_delete'
      case 'cleanup':
        return 'media:cleanup'
      case 'metadata_update':
        return 'media:manage'
      default:
        return 'media:view'
    }
  }

  private hasMediaPermission(userRole: UserRole, permission: MediaPermission): boolean {
    const rolePermissions = MEDIA_ACCESS_CONTROL.rolePermissions[userRole] || []
    return rolePermissions.includes(permission)
  }

  private canPerformBulkOperations(userRole: UserRole): boolean {
    return ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole)
  }

  private canPerformCleanup(userRole: UserRole): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(userRole)
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')

    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()

    return 'unknown'
  }

  private isValidCSRFToken(token: string): boolean {
    // Placeholder CSRF validation
    // In production, implement proper CSRF token validation
    // This might involve checking against a stored token or validating a JWT
    return token.length > 10 && /^[a-zA-Z0-9_-]+$/.test(token)
  }
}

// Export singleton instance
export const mediaSecurityManager = new MediaSecurityManager()

// Utility functions for middleware and API routes

/**
 * Middleware helper for media route protection
 */
export function requireMediaPermission(permission: MediaPermission) {
  return (userRole: UserRole | undefined): boolean => {
    if (!userRole) return false
    const rolePermissions = MEDIA_ACCESS_CONTROL.rolePermissions[userRole] || []
    return rolePermissions.includes(permission)
  }
}

/**
 * Check if user can upload files of given size
 */
export function canUploadFileSize(userRole: UserRole, fileSize: number): boolean {
  const limit = MEDIA_ACCESS_CONTROL.fileSizeLimits[userRole] || 0
  return fileSize <= limit
}

/**
 * Get media operation from request path and method
 */
export function getMediaOperationFromRequest(
  pathname: string,
  method: string
): MediaOperation {
  if (method === 'GET') {
    if (pathname.includes('/search')) return 'search'
    return 'view'
  }
  
  if (method === 'POST') {
    if (pathname.includes('/upload')) return 'upload'
    if (pathname.includes('/bulk')) return 'bulk_delete'
    if (pathname.includes('/cleanup')) return 'cleanup'
  }
  
  if (method === 'DELETE') {
    return 'delete'
  }
  
  if (method === 'PUT' || method === 'PATCH') {
    return 'metadata_update'
  }
  
  return 'view'
}