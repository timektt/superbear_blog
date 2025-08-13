import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';
import { authOptions } from './auth';

// Role hierarchy - higher numbers have more permissions
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  VIEWER: 1,
  AUTHOR: 2,
  EDITOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

/**
 * Check if a user has permission based on role hierarchy
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns boolean indicating if user has permission
 */
export function hasPermission(userRole: AdminRole, requiredRole: AdminRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get the current user's session
 * @returns Promise<Session | null>
 */
export async function getCurrentSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns Promise<boolean>
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session?.user;
}

/**
 * Get the current user's role
 * @returns Promise<AdminRole | null>
 */
export async function getCurrentUserRole(): Promise<AdminRole | null> {
  const session = await getCurrentSession();
  return session?.user?.role || null;
}

/**
 * Check if current user has required role
 * @param requiredRole - Minimum required role
 * @returns Promise<boolean>
 */
export async function hasRequiredRole(requiredRole: AdminRole): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  if (!userRole) return false;
  return hasPermission(userRole, requiredRole);
}

/**
 * Middleware function to require authentication
 * Returns 401 if not authenticated
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await getCurrentSession();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return null; // No error, user is authenticated
}

/**
 * Middleware function to require specific role
 * Returns 401 if not authenticated, 403 if insufficient permissions
 * @param requiredRole - Minimum required role
 */
export async function requireRole(requiredRole: AdminRole): Promise<NextResponse | null> {
  // First check authentication
  const authError = await requireAuth();
  if (authError) return authError;
  
  // Then check role permissions
  const userRole = await getCurrentUserRole();
  if (!userRole) {
    return NextResponse.json(
      { error: 'User role not found' },
      { status: 403 }
    );
  }
  
  if (!hasPermission(userRole, requiredRole)) {
    return NextResponse.json(
      { 
        error: 'Insufficient permissions',
        required: requiredRole,
        current: userRole
      },
      { status: 403 }
    );
  }
  
  return null; // No error, user has required permissions
}

/**
 * Higher-order function to wrap API routes with role requirements
 * @param handler - The API route handler
 * @param requiredRole - Minimum required role
 */
export function withRole(
  handler: (req: NextRequest) => Promise<NextResponse>,
  requiredRole: AdminRole
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const roleError = await requireRole(requiredRole);
    if (roleError) return roleError;
    
    return handler(req);
  };
}

/**
 * Higher-order function to wrap API routes with authentication requirement
 * @param handler - The API route handler
 */
export function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authError = await requireAuth();
    if (authError) return authError;
    
    return handler(req);
  };
}

/**
 * Check if user can perform specific actions based on role
 */
export const permissions = {
  // Content permissions
  canCreateArticles: (role: AdminRole) => hasPermission(role, AdminRole.AUTHOR),
  canEditOwnArticles: (role: AdminRole) => hasPermission(role, AdminRole.AUTHOR),
  canEditAllArticles: (role: AdminRole) => hasPermission(role, AdminRole.EDITOR),
  canPublishArticles: (role: AdminRole) => hasPermission(role, AdminRole.EDITOR),
  canDeleteArticles: (role: AdminRole) => hasPermission(role, AdminRole.EDITOR),
  
  // Category and tag permissions
  canManageCategories: (role: AdminRole) => hasPermission(role, AdminRole.EDITOR),
  canManageTags: (role: AdminRole) => hasPermission(role, AdminRole.EDITOR),
  
  // User management permissions
  canViewUsers: (role: AdminRole) => hasPermission(role, AdminRole.ADMIN),
  canCreateUsers: (role: AdminRole) => hasPermission(role, AdminRole.ADMIN),
  canEditUsers: (role: AdminRole) => hasPermission(role, AdminRole.ADMIN),
  canDeleteUsers: (role: AdminRole) => hasPermission(role, AdminRole.SUPER_ADMIN),
  
  // System permissions
  canViewStats: (role: AdminRole) => hasPermission(role, AdminRole.EDITOR),
  canManageSystem: (role: AdminRole) => hasPermission(role, AdminRole.SUPER_ADMIN),
};

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<AdminRole, string> = {
  VIEWER: 'Viewer',
  AUTHOR: 'Author',
  EDITOR: 'Editor',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  VIEWER: 'Can view content and statistics',
  AUTHOR: 'Can create and edit own articles',
  EDITOR: 'Can manage all content and publish articles',
  ADMIN: 'Can manage users and all content',
  SUPER_ADMIN: 'Full system access and user management',
};