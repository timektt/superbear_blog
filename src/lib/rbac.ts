/**
 * Role-Based Access Control (RBAC) System
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'VIEWER';

export type Permission =
  // Article permissions
  | 'articles:create'
  | 'articles:read'
  | 'articles:update'
  | 'articles:delete'
  | 'articles:publish'
  | 'articles:unpublish'

  // User management permissions
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'users:manage_roles'

  // System permissions
  | 'system:settings'
  | 'system:analytics'
  | 'system:logs'
  | 'system:maintenance'

  // Content management permissions
  | 'categories:manage'
  | 'tags:manage'
  | 'media:upload'
  | 'media:delete'

  // Campaign permissions
  | 'campaigns:create'
  | 'campaigns:read'
  | 'campaigns:update'
  | 'campaigns:delete'
  | 'campaigns:send'

  // Newsletter permissions
  | 'newsletter:manage'
  | 'newsletter:send'
  | 'newsletter:analytics';

/**
 * Role permission mappings
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // All permissions
    'articles:create',
    'articles:read',
    'articles:update',
    'articles:delete',
    'articles:publish',
    'articles:unpublish',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:manage_roles',
    'system:settings',
    'system:analytics',
    'system:logs',
    'system:maintenance',
    'categories:manage',
    'tags:manage',
    'media:upload',
    'media:delete',
    'campaigns:create',
    'campaigns:read',
    'campaigns:update',
    'campaigns:delete',
    'campaigns:send',
    'newsletter:manage',
    'newsletter:send',
    'newsletter:analytics',
  ],

  ADMIN: [
    // Most permissions except user role management and system maintenance
    'articles:create',
    'articles:read',
    'articles:update',
    'articles:delete',
    'articles:publish',
    'articles:unpublish',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'system:settings',
    'system:analytics',
    'system:logs',
    'categories:manage',
    'tags:manage',
    'media:upload',
    'media:delete',
    'campaigns:create',
    'campaigns:read',
    'campaigns:update',
    'campaigns:delete',
    'campaigns:send',
    'newsletter:manage',
    'newsletter:send',
    'newsletter:analytics',
  ],

  EDITOR: [
    // Content management and publishing
    'articles:create',
    'articles:read',
    'articles:update',
    'articles:delete',
    'articles:publish',
    'articles:unpublish',
    'users:read',
    'system:analytics',
    'categories:manage',
    'tags:manage',
    'media:upload',
    'media:delete',
    'campaigns:create',
    'campaigns:read',
    'campaigns:update',
    'campaigns:delete',
    'newsletter:manage',
    'newsletter:analytics',
  ],

  AUTHOR: [
    // Basic content creation and editing
    'articles:create',
    'articles:read',
    'articles:update',
    'users:read',
    'tags:manage',
    'media:upload',
    'campaigns:read',
    'newsletter:analytics',
  ],

  VIEWER: [
    // Read-only access
    'articles:read',
    'users:read',
    'system:analytics',
    'campaigns:read',
    'newsletter:analytics',
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    VIEWER: 1,
    AUTHOR: 2,
    EDITOR: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5,
  };

  const managerLevel = roleHierarchy[managerRole];
  const targetLevel = roleHierarchy[targetRole];

  // Super admins can manage anyone
  if (managerRole === 'SUPER_ADMIN') return true;

  // Admins can manage editors, authors, and viewers
  if (
    managerRole === 'ADMIN' &&
    targetRole !== 'SUPER_ADMIN' &&
    targetRole !== 'ADMIN'
  )
    return true;

  // Editors can manage authors and viewers
  if (
    managerRole === 'EDITOR' &&
    (targetRole === 'AUTHOR' || targetRole === 'VIEWER')
  )
    return true;

  return false;
}

/**
 * Get available roles that a user can assign
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case 'SUPER_ADMIN':
      return ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER'];
    case 'ADMIN':
      return ['EDITOR', 'AUTHOR', 'VIEWER'];
    case 'EDITOR':
      return ['AUTHOR', 'VIEWER'];
    default:
      return [];
  }
}

/**
 * Resource-based permission checking
 */
export interface ResourcePermissionCheck {
  resource: 'article' | 'user' | 'campaign' | 'system';
  action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'manage';
  resourceOwnerId?: string;
  currentUserId?: string;
}

/**
 * Check resource-specific permissions with ownership consideration
 */
export function checkResourcePermission(
  userRole: UserRole,
  check: ResourcePermissionCheck
): boolean {
  const { resource, action, resourceOwnerId, currentUserId } = check;

  // Map resource actions to permissions
  const permissionMap: Record<string, Permission> = {
    'article:create': 'articles:create',
    'article:read': 'articles:read',
    'article:update': 'articles:update',
    'article:delete': 'articles:delete',
    'article:publish': 'articles:publish',
    'user:create': 'users:create',
    'user:read': 'users:read',
    'user:update': 'users:update',
    'user:delete': 'users:delete',
    'user:manage': 'users:manage_roles',
    'campaign:create': 'campaigns:create',
    'campaign:read': 'campaigns:read',
    'campaign:update': 'campaigns:update',
    'campaign:delete': 'campaigns:delete',
    'system:manage': 'system:settings',
  };

  const permissionKey = `${resource}:${action}`;
  const permission = permissionMap[permissionKey];

  if (!permission) return false;

  // Check basic permission
  const hasBasicPermission = hasPermission(userRole, permission);
  if (!hasBasicPermission) return false;

  // For ownership-based resources, check if user owns the resource
  if (resourceOwnerId && currentUserId) {
    // Authors can only edit their own articles
    if (
      userRole === 'AUTHOR' &&
      resource === 'article' &&
      action === 'update'
    ) {
      return resourceOwnerId === currentUserId;
    }

    // Authors cannot delete articles (even their own)
    if (
      userRole === 'AUTHOR' &&
      resource === 'article' &&
      action === 'delete'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Middleware helper for API route protection
 */
export function requirePermission(permission: Permission) {
  return (userRole: UserRole | undefined): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };
}

/**
 * Middleware helper for resource-based protection
 */
export function requireResourcePermission(
  check: Omit<ResourcePermissionCheck, 'currentUserId'>
) {
  return (userRole: UserRole | undefined, currentUserId?: string): boolean => {
    if (!userRole) return false;
    return checkResourcePermission(userRole, { ...check, currentUserId });
  };
}
