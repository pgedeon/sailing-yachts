/**
 * Role-Based Access Control (RBAC) System
 * 
 * Implements comprehensive permission management with roles,
 * permissions, and resource-based access control.
 */

const crypto = require('crypto');

class RBAC {
  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
    this.resourcePermissions = new Map();
    
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles and permissions
   */
  initializeDefaultRoles() {
    // Define permissions
    const permissions = [
      // System Management
      'system:read',
      'system:write',
      'system:delete',
      'system:manage-users',
      'system:manage-roles',
      'system:manage-settings',
      
      // Content Management
      'content:read',
      'content:write',
      'content:delete',
      'content:publish',
      'content:moderate',
      
      // User Management
      'users:read',
      'users:write',
      'users:delete',
      'users:manage-permissions',
      
      // Audit & Monitoring
      'audit:read',
      'audit:write',
      'audit:delete',
      'monitor:read',
      'monitor:write',
      
      // API Management
      'api:read',
      'api:write',
      'api:delete',
      'api:manage-keys',
      
      // Security Management
      'security:read',
      'security:write',
      'security:manage-2fa',
      'security:manage-audit'
    ];

    // Add all permissions
    permissions.forEach(permission => {
      this.permissions.set(permission, {
        name: permission,
        description: this.getPermissionDescription(permission),
        category: this.getPermissionCategory(permission)
      });
    });

    // Define roles
    const roles = [
      {
        name: 'super_admin',
        description: 'Super Administrator - Full system access',
        permissions: [
          // All system permissions
          'system:read', 'system:write', 'system:delete', 'system:manage-users', 'system:manage-roles', 'system:manage-settings',
          // All content permissions
          'content:read', 'content:write', 'content:delete', 'content:publish', 'content:moderate',
          // All user permissions
          'users:read', 'users:write', 'users:delete', 'users:manage-permissions',
          // All audit permissions
          'audit:read', 'audit:write', 'audit:delete', 'monitor:read', 'monitor:write',
          // All API permissions
          'api:read', 'api:write', 'api:delete', 'api:manage-keys',
          // All security permissions
          'security:read', 'security:write', 'security:manage-2fa', 'security:manage-audit'
        ],
        inherits: []
      },
      {
        name: 'admin',
        description: 'Administrator - Standard admin access',
        permissions: [
          'system:read',
          'content:read', 'content:write', 'content:publish',
          'users:read', 'users:write',
          'audit:read',
          'api:read', 'api:write',
          'security:read'
        ],
        inherits: []
      },
      {
        name: 'editor',
        description: 'Content Editor - Content management access',
        permissions: [
          'content:read', 'content:write', 'content:publish',
          'users:read'
        ],
        inherits: []
      },
      {
        name: 'moderator',
        description: 'Content Moderator - Content moderation access',
        permissions: [
          'content:read', 'content:moderate',
          'audit:read'
        ],
        inherits: []
      },
      {
        name: 'viewer',
        description: 'Viewer - Read-only access',
        permissions: [
          'content:read',
          'audit:read'
        ],
        inherits: []
      }
    ];

    // Add all roles
    roles.forEach(role => {
      this.roles.set(role.name, {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        inherits: role.inherits || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  }

  /**
   * Get permission description
   */
  getPermissionDescription(permission) {
    const descriptions = {
      'system:read': 'Read system information and settings',
      'system:write': 'Modify system settings and configuration',
      'system:delete': 'Delete system data and components',
      'system:manage-users': 'Manage user accounts and access',
      'system:manage-roles': 'Manage user roles and permissions',
      'system:manage-settings': 'Manage system-wide settings',
      
      'content:read': 'Read content and articles',
      'content:write': 'Create and edit content',
      'content:delete': 'Delete content and articles',
      'content:publish': 'Publish and unpublish content',
      'content:moderate': 'Moderate user-generated content',
      
      'users:read': 'View user information',
      'users:write': 'Modify user information',
      'users:delete': 'Delete user accounts',
      'users:manage-permissions': 'Manage user permissions',
      
      'audit:read': 'Read audit logs and activity',
      'audit:write': 'Write audit logs and activity',
      'audit:delete': 'Delete audit logs',
      'monitor:read': 'Read monitoring data and metrics',
      'monitor:write': 'Write monitoring data and metrics',
      
      'api:read': 'Read API information and keys',
      'api:write': 'Create and modify API configurations',
      'api:delete': 'Delete API configurations',
      'api:manage-keys': 'Manage API keys and tokens',
      
      'security:read': 'Read security settings and logs',
      'security:write': 'Modify security settings',
      'security:manage-2fa': 'Manage two-factor authentication',
      'security:manage-audit': 'Manage audit logging settings'
    };
    
    return descriptions[permission] || 'No description available';
  }

  /**
   * Get permission category
   */
  getPermissionCategory(permission) {
    if (permission.startsWith('system:')) return 'system';
    if (permission.startsWith('content:')) return 'content';
    if (permission.startsWith('users:')) return 'users';
    if (permission.startsWith('audit:')) return 'audit';
    if (permission.startsWith('monitor:')) return 'monitor';
    if (permission.startsWith('api:')) return 'api';
    if (permission.startsWith('security:')) return 'security';
    return 'other';
  }

  /**
   * Assign role to user
   */
  assignRole(userId, roleName) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role '${roleName}' does not exist`);
    }
    
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    
    this.userRoles.get(userId).add(roleName);
    return true;
  }

  /**
   * Remove role from user
   */
  removeRole(userId, roleName) {
    if (!this.userRoles.has(userId)) {
      return false;
    }
    
    return this.userRoles.get(userId).delete(roleName);
  }

  /**
   * Get all roles for a user
   */
  getUserRoles(userId) {
    if (!this.userRoles.has(userId)) {
      return [];
    }
    
    return Array.from(this.userRoles.get(userId));
  }

  /**
   * Get all effective permissions for a user (including inherited permissions)
   */
  getUserPermissions(userId) {
    const userRoles = this.getUserRoles(userId);
    const permissions = new Set();
    
    // Add permissions from all user roles
    userRoles.forEach(roleName => {
      const role = this.roles.get(roleName);
      if (role) {
        role.permissions.forEach(permission => {
          permissions.add(permission);
        });
        
        // Add permissions from inherited roles
        this.getInheritedPermissions(roleName).forEach(permission => {
          permissions.add(permission);
        });
      }
    });
    
    return Array.from(permissions);
  }

  /**
   * Get permissions inherited by a role
   */
  getInheritedPermissions(roleName) {
    const role = this.roles.get(roleName);
    if (!role) return [];
    
    const inheritedPermissions = new Set();
    
    // Recursively get permissions from inherited roles
    role.inherits.forEach(inheritedRoleName => {
      const inheritedRole = this.roles.get(inheritedRoleName);
      if (inheritedRole) {
        inheritedRole.permissions.forEach(permission => {
          inheritedPermissions.add(permission);
        });
        
        // Get permissions from the inherited role's inheritance chain
        this.getInheritedPermissions(inheritedRoleName).forEach(permission => {
          inheritedPermissions.add(permission);
        });
      }
    });
    
    return Array.from(inheritedPermissions);
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(userId, permission) {
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userId, permissions) {
    const userPermissions = this.getUserPermissions(userId);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(userId, permissions) {
    const userPermissions = this.getUserPermissions(userId);
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Create new role
   */
  createRole(name, description, permissions = [], inherits = []) {
    if (this.roles.has(name)) {
      throw new Error(`Role '${name}' already exists`);
    }
    
    // Validate all permissions exist
    permissions.forEach(permission => {
      if (!this.permissions.has(permission)) {
        throw new Error(`Permission '${permission}' does not exist`);
      }
    });
    
    this.roles.set(name, {
      name,
      description,
      permissions,
      inherits,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return true;
  }

  /**
   * Update role
   */
  updateRole(roleName, updates = {}) {
    const role = this.roles.get(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' does not exist`);
    }
    
    if (updates.permissions) {
      // Validate all permissions exist
      updates.permissions.forEach(permission => {
        if (!this.permissions.has(permission)) {
          throw new Error(`Permission '${permission}' does not exist`);
        }
      });
      role.permissions = updates.permissions;
    }
    
    if (updates.inherits) {
      role.inherits = updates.inherits;
    }
    
    if (updates.description) {
      role.description = updates.description;
    }
    
    role.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Delete role
   */
  deleteRole(roleName) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role '${roleName}' does not exist`);
    }
    
    // Remove role from all users
    for (const [userId, userRoles] of this.userRoles.entries()) {
      userRoles.delete(roleName);
    }
    
    this.roles.delete(roleName);
    return true;
  }

  /**
   * Create new permission
   */
  createPermission(name, description, category = 'other') {
    if (this.permissions.has(name)) {
      throw new Error(`Permission '${name}' already exists`);
    }
    
    this.permissions.set(name, {
      name,
      description,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return true;
  }

  /**
   * Get all roles
   */
  getAllRoles() {
    return Array.from(this.roles.values()).map(role => ({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      inherits: role.inherits,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));
  }

  /**
   * Get all permissions
   */
  getAllPermissions() {
    return Array.from(this.permissions.values());
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category) {
    return Array.from(this.permissions.values())
      .filter(permission => permission.category === category);
  }

  /**
   * Get role details
   */
  getRoleDetails(roleName) {
    const role = this.roles.get(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' does not exist`);
    }
    
    return {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      inherits: role.inherits,
      effectivePermissions: this.getInheritedPermissions(roleName),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    };
  }

  /**
   * Check if role can be safely deleted (not assigned to any users)
   */
  canSafelyDeleteRole(roleName) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role '${roleName}' does not exist`);
    }
    
    for (const userRoles of this.userRoles.values()) {
      if (userRoles.has(roleName)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get security-sensitive permissions
   */
  getSecurityPermissions() {
    return this.getPermissionsByCategory('security');
  }

  /**
   * Get administrative permissions
   */
  getAdministrativePermissions() {
    return this.getPermissionsByCategory('system');
  }
}

module.exports = RBAC;