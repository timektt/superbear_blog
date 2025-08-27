import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  UserRole,
  Permission,
  hasPermission,
  checkResourcePermission,
  ResourcePermissionCheck,
} from './rbac';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function getAuthenticatedUser(
  request?: NextRequest
): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    role: session.user.role as UserRole,
  };
}

export function isAuthenticated(user: any): boolean {
  return !!user && !!user.role;
}

export function isAdmin(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

export function isSuperAdmin(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN';
}

export function isEditor(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return ['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
}

export function isAuthor(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return ['AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
}

/**
 * Check if user has a specific permission
 */
export function userHasPermission(
  user: AuthenticatedUser | null,
  permission: Permission
): boolean {
  if (!user) return false;
  return hasPermission(user.role, permission);
}

/**
 * Check if user has permission for a specific resource
 */
export function userHasResourcePermission(
  user: AuthenticatedUser | null,
  check: Omit<ResourcePermissionCheck, 'currentUserId'>
): boolean {
  if (!user) return false;
  return checkResourcePermission(user.role, {
    ...check,
    currentUserId: user.id,
  });
}

/**
 * Legacy requireAuth function for backward compatibility
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return session;
}

/**
 * Require authentication middleware
 */
export async function requireAuthUser(
  request?: NextRequest
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require specific permission middleware
 */
export async function requirePermission(
  permission: Permission,
  request?: NextRequest
): Promise<AuthenticatedUser> {
  const user = await requireAuthUser(request);
  if (!userHasPermission(user, permission)) {
    throw new Error(`Permission required: ${permission}`);
  }
  return user;
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(
  request?: NextRequest
): Promise<AuthenticatedUser> {
  const user = await requireAuthUser(request);
  if (!isAdmin(user)) {
    throw new Error('Admin access required');
  }
  return user;
}

/**
 * Require super admin role middleware
 */
export async function requireSuperAdmin(
  request?: NextRequest
): Promise<AuthenticatedUser> {
  const user = await requireAuthUser(request);
  if (!isSuperAdmin(user)) {
    throw new Error('Super admin access required');
  }
  return user;
}

/**
 * Create authorization error response
 */
export function createAuthError(message: string, status: number = 403) {
  return NextResponse.json({ error: message }, { status });
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * API route wrapper with authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await requireAuthUser();
      return await handler(user, ...args);
    } catch (error) {
      return createAuthError('Authentication required', 401);
    }
  };
}

/**
 * API route wrapper with permission check
 */
export function withPermission<T extends any[]>(
  permission: Permission,
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await requirePermission(permission);
      return await handler(user, ...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access denied';
      const status = message.includes('Authentication') ? 401 : 403;
      return createAuthError(message, status);
    }
  };
}

/**
 * API route wrapper with admin check
 */
export function withAdmin<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await requireAdmin();
      return await handler(user, ...args);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Admin access required';
      const status = message.includes('Authentication') ? 401 : 403;
      return createAuthError(message, status);
    }
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Newsletter verification token functions
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyToken(token: string, email: string): boolean {
  // In a production environment, you would store tokens in database with expiration
  // For now, we'll do basic validation
  return !!(token && token.length === 64 && email && email.includes('@'));
}
