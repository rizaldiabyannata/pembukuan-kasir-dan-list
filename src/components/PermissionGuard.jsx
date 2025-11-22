"use client";

import React from "react";
import { useUser } from "@/hooks/useUser";

/**
 * PermissionGuard component for role-based UI rendering
 * Conditionally renders children based on user permissions
 */
export default function PermissionGuard({
  children,
  roles = [],
  permissions = [],
  fallback = null,
  requireAllPermissions = false,
}) {
  const { user, loading } = useUser();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // No user means not authenticated
  if (!user) {
    return fallback;
  }

  // Check role-based access
  if (roles.length > 0 && !roles.includes(user.role)) {
    return fallback;
  }

  // Check permission-based access
  if (permissions.length > 0) {
    // Import permissions dynamically to avoid circular dependencies
    import("@/lib/middleware").then(({ permissions: permissionFuncs }) => {
      const hasPermission = requireAllPermissions
        ? permissions.every((perm) => permissionFuncs[perm]?.(user))
        : permissions.some((perm) => permissionFuncs[perm]?.(user));

      if (!hasPermission) {
        return fallback;
      }
    });
  }

  // All checks passed, render children
  return children;
}

/**
 * AdminOnly component - only renders for ADMIN users
 */
export function AdminOnly({ children, fallback = null }) {
  return (
    <PermissionGuard roles={["ADMIN"]} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * OperatorOnly component - only renders for OPERATOR users
 */
export function OperatorOnly({ children, fallback = null }) {
  return (
    <PermissionGuard roles={["OPERATOR"]} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * HasPermission component - renders based on specific permissions
 */
export function HasPermission({
  children,
  permissions = [],
  requireAll = false,
  fallback = null,
}) {
  return (
    <PermissionGuard
      permissions={permissions}
      requireAllPermissions={requireAll}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}
