/**
 * Route Protection Utilities
 * Handles route classification, pattern matching, and session token extraction
 * for Next.js middleware-based route protection
 *
 * Edge Runtime Compatible:
 * This module is designed to work in Next.js middleware (edge runtime).
 * It does NOT use Prisma or any database connections.
 * Session validation is done via JWT verification only.
 *
 * Security Model:
 * - Middleware (this file): JWT-based validation for route protection
 *   - Fast and edge-compatible
 *   - Validates token signature and expiration
 *   - Checks user role and permissions from JWT payload
 *   - Does NOT check if session was manually invalidated
 *   - Does NOT check if user status changed since JWT was issued
 *
 * - API Routes (auth.js): Full database validation for sensitive operations
 *   - Checks session exists in database
 *   - Validates session hasn't expired
 *   - Confirms user is still active
 *   - Verifies session hasn't been manually invalidated
 *
 * Defense in Depth:
 * Both layers work together to provide comprehensive security.
 * Middleware provides fast initial protection, API routes provide thorough validation.
 */

import { verifyToken } from "./auth.js";

/**
 * Route configuration with patterns and access rules
 * Routes are organized by access level with specificity ordering
 * Each route is mapped to permission functions from src/lib/middleware.js
 */
export const ROUTE_RULES = {
  // Public routes - accessible without authentication
  public: [
    {
      pattern: "/",
      description: "Login page",
      permissions: null,
    },
    {
      pattern: "/reset-password",
      description: "Password reset request",
      permissions: null,
    },
    {
      pattern: "/reset-password/verify",
      description: "Password reset verification",
      permissions: null,
    },
    {
      pattern: "/reset-password/new",
      description: "New password entry",
      permissions: null,
    },
  ],

  // Admin-only routes - require ADMIN role and specific permissions
  adminOnly: [
    {
      pattern: "/dashboard",
      description: "Dashboard with financial data",
      permissions: ["canViewDashboard"],
    },
    {
      pattern: "/laporan",
      description: "Financial reports",
      permissions: ["canViewReports"],
    },
    {
      pattern: "/users",
      description: "User management",
      permissions: ["canViewUsers"],
    },
    {
      pattern: "/audit",
      description: "Audit logs",
      permissions: ["canViewAuditLogs"],
    },
  ],

  // Operator-allowed routes - accessible by both ADMIN and OPERATOR
  operatorAllowed: [
    {
      pattern: "/transaksi",
      description: "Transaction management",
      permissions: ["canViewTransactions"],
    },
    {
      pattern: "/pengeluaran",
      description: "Expense management",
      permissions: ["canViewExpenses"],
    },
    {
      pattern: "/armada",
      description: "Fleet/vehicle viewing",
      permissions: ["canViewFleet"],
    },
    {
      pattern: "/sopir",
      description: "Driver viewing",
      permissions: ["canViewDrivers"],
    },
    {
      pattern: "/paket",
      description: "Package viewing",
      permissions: ["canViewPackages"],
    },
    {
      pattern: "/staff",
      description: "Staff viewing",
      permissions: ["canViewStaff"],
    },
  ],

  // Static assets and API routes (handled separately)
  excluded: ["/_next", "/api", "/favicon.ico", "/manifest.json"],
};

/**
 * Extract session token from request cookies
 * Checks multiple cookie formats for backward compatibility
 * Priority: session_admin > session_operator > session (legacy)
 *
 * @param {Request} request - Next.js request object
 * @returns {string|null} Session token or null if not found
 */
export function extractSessionToken(request) {
  const cookies = request.cookies;

  // Try role-specific cookies first (preferred)
  const adminToken = cookies.get("session_admin")?.value;
  if (adminToken) return adminToken;

  const operatorToken = cookies.get("session_operator")?.value;
  if (operatorToken) return operatorToken;

  // Fallback to legacy session cookie for backward compatibility
  const legacyToken = cookies.get("session")?.value;
  if (legacyToken) return legacyToken;

  return null;
}

/**
 * Check if a route is a public route
 * Public routes don't require authentication
 *
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if route is public
 */
export function isPublicRoute(pathname) {
  return ROUTE_RULES.public.some((route) =>
    matchRoute(pathname, route.pattern)
  );
}

/**
 * Check if a route is a static asset or excluded route
 * These routes bypass middleware processing
 *
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if route should be excluded
 */
export function isExcludedRoute(pathname) {
  return ROUTE_RULES.excluded.some((route) => pathname.startsWith(route));
}

/**
 * Check if a route is an API route
 * API routes have their own middleware and should be skipped
 *
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if route is an API route
 */
export function isApiRoute(pathname) {
  return pathname.startsWith("/api");
}

/**
 * Check if a route is admin-only
 * Admin-only routes require ADMIN role
 *
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if route requires ADMIN role
 */
export function isAdminOnlyRoute(pathname) {
  return ROUTE_RULES.adminOnly.some((route) =>
    matchRoute(pathname, route.pattern)
  );
}

/**
 * Check if a route is operator-allowed
 * Operator-allowed routes can be accessed by both ADMIN and OPERATOR
 *
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if route allows OPERATOR access
 */
export function isOperatorAllowedRoute(pathname) {
  return ROUTE_RULES.operatorAllowed.some((route) =>
    matchRoute(pathname, route.pattern)
  );
}

/**
 * Match a pathname against a route pattern
 * Supports exact matches and prefix matches
 *
 * Pattern types:
 * - Exact: "/dashboard" matches only "/dashboard"
 * - Prefix: "/transaksi" matches "/transaksi", "/transaksi/123", etc.
 *
 * @param {string} pathname - Request pathname to match
 * @param {string} pattern - Route pattern to match against
 * @returns {boolean} True if pathname matches pattern
 */
export function matchRoute(pathname, pattern) {
  // Normalize paths (remove trailing slashes for comparison)
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;
  const normalizedPattern =
    pattern.endsWith("/") && pattern !== "/" ? pattern.slice(0, -1) : pattern;

  // Exact match
  if (normalizedPath === normalizedPattern) {
    return true;
  }

  // Prefix match (e.g., "/transaksi" matches "/transaksi/123")
  if (normalizedPath.startsWith(normalizedPattern + "/")) {
    return true;
  }

  return false;
}

/**
 * Get required permissions for a route
 * Returns the permission function names that must be satisfied
 *
 * @param {string} pathname - Request pathname
 * @returns {string[]|null} Array of permission function names or null if no permissions required
 */
export function getRoutePermissions(pathname) {
  // Get the most specific matching route
  const match = getMostSpecificRoute(pathname);

  if (!match) {
    return null;
  }

  return match.permissions;
}

/**
 * Classify a route and determine access requirements
 * Returns the most specific classification for the route
 *
 * Classification priority (most to least specific):
 * 1. Excluded routes (static assets, API)
 * 2. Public routes
 * 3. Admin-only routes
 * 4. Operator-allowed routes
 * 5. Protected (default - requires auth but no specific rule)
 *
 * @param {string} pathname - Request pathname
 * @returns {object} Route classification with type and metadata
 */
export function classifyRoute(pathname) {
  // Check excluded routes first (highest priority)
  if (isExcludedRoute(pathname)) {
    return {
      type: "excluded",
      requiresAuth: false,
      allowedRoles: null,
      permissions: null,
      description: "Static asset or excluded route",
    };
  }

  // Check public routes
  if (isPublicRoute(pathname)) {
    return {
      type: "public",
      requiresAuth: false,
      allowedRoles: null,
      permissions: null,
      description: "Public route accessible without authentication",
    };
  }

  // Get the most specific route match for permission information
  const specificMatch = getMostSpecificRoute(pathname);

  // Check admin-only routes (more specific than operator-allowed)
  if (isAdminOnlyRoute(pathname)) {
    return {
      type: "admin-only",
      requiresAuth: true,
      allowedRoles: ["ADMIN"],
      permissions: specificMatch?.permissions || null,
      description: specificMatch?.description || "Admin-only route",
    };
  }

  // Check operator-allowed routes
  if (isOperatorAllowedRoute(pathname)) {
    return {
      type: "operator-allowed",
      requiresAuth: true,
      allowedRoles: ["ADMIN", "OPERATOR"],
      permissions: specificMatch?.permissions || null,
      description:
        specificMatch?.description || "Route accessible by ADMIN and OPERATOR",
    };
  }

  // Default: protected route (requires auth but no specific rule)
  return {
    type: "protected",
    requiresAuth: true,
    allowedRoles: ["ADMIN"], // Default to admin-only for safety
    permissions: null,
    description: "Protected route (default admin-only)",
  };
}

/**
 * Get the most specific matching route pattern
 * Used for determining which rule to apply when multiple patterns could match
 *
 * Specificity rules:
 * 1. Exact matches are more specific than prefix matches
 * 2. Longer paths are more specific than shorter paths
 * 3. Admin-only rules take precedence over operator-allowed
 *
 * @param {string} pathname - Request pathname
 * @returns {object|null} Most specific route match or null
 */
export function getMostSpecificRoute(pathname) {
  const matches = [];

  // Check all route categories
  const categories = [
    { name: "admin-only", routes: ROUTE_RULES.adminOnly, priority: 3 },
    {
      name: "operator-allowed",
      routes: ROUTE_RULES.operatorAllowed,
      priority: 2,
    },
    { name: "public", routes: ROUTE_RULES.public, priority: 1 },
  ];

  for (const category of categories) {
    for (const route of category.routes) {
      if (matchRoute(pathname, route.pattern)) {
        const isExact =
          pathname === route.pattern || pathname === route.pattern + "/";
        matches.push({
          category: category.name,
          pattern: route.pattern,
          permissions: route.permissions,
          description: route.description,
          priority: category.priority,
          specificity: route.pattern.length,
          isExact,
        });
      }
    }
  }

  if (matches.length === 0) {
    return null;
  }

  // Sort by specificity: exact > priority > length
  matches.sort((a, b) => {
    // Exact matches first
    if (a.isExact !== b.isExact) {
      return b.isExact ? 1 : -1;
    }
    // Then by priority (admin-only > operator-allowed > public)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Then by length (longer = more specific)
    return b.specificity - a.specificity;
  });

  return matches[0];
}

/**
 * Determine the default landing page for a user based on their role
 * Used for redirecting authenticated users from login page
 *
 * @param {string} role - User role (ADMIN or OPERATOR)
 * @returns {string} Default landing page path
 */
export function getDefaultLandingPage(role) {
  if (role === "ADMIN") {
    return "/dashboard";
  }
  if (role === "OPERATOR") {
    return "/transaksi";
  }
  // Fallback
  return "/dashboard";
}

/**
 * Determine the redirect destination for unauthorized access
 * Requirements 7.1, 7.2, 7.3:
 * - OPERATOR users denied admin access → redirect to transactions page (7.1)
 * - Users with expired sessions → redirect to login page (7.2)
 * - Users with invalid sessions → redirect to login page (7.3)
 *
 * @param {object|null} user - User object or null if not authenticated
 * @param {string} pathname - Original pathname that was blocked
 * @param {string} errorType - Type of error (optional, for context)
 * @returns {string} Redirect destination path
 */
export function getRedirectDestination(user, pathname, errorType = null) {
  // Session-related errors and user account issues always redirect to login
  if (
    errorType === "SESSION_EXPIRED" ||
    errorType === "INVALID_TOKEN" ||
    errorType === "SESSION_NOT_FOUND" ||
    errorType === "NO_TOKEN" ||
    errorType === "NO_AUTH" ||
    errorType === "USER_INACTIVE"
  ) {
    return "/";
  }

  // No user - redirect to login
  if (!user) {
    return "/";
  }

  // OPERATOR trying to access admin route - redirect to their default page
  if (user.role === "OPERATOR") {
    return getDefaultLandingPage("OPERATOR");
  }

  // ADMIN users with permission issues - redirect to dashboard
  if (user.role === "ADMIN") {
    return getDefaultLandingPage("ADMIN");
  }

  // Fallback to login
  return "/";
}

/**
 * Validate session token and retrieve user session
 * Edge-runtime compatible version that only validates JWT
 * Does NOT access database - suitable for middleware
 *
 * For edge runtime (middleware):
 * - Only verifies JWT token signature and expiration
 * - Extracts user data from JWT payload
 * - Does NOT check database for session existence or user status
 *
 * Note: API routes should use getSession() from auth.js for full validation
 *
 * @param {string} token - Session token to validate
 * @returns {Promise<object>} Validation result with session data or error
 */
export async function validateSession(token) {
  // Handle missing token
  if (!token) {
    return {
      valid: false,
      error: "NO_TOKEN",
      message: "Silakan login untuk melanjutkan",
      user: null,
      session: null,
    };
  }

  try {
    // Verify JWT token signature and expiration
    // This will throw if token is malformed or expired
    const payload = await verifyToken(token);

    // Extract user data from JWT payload
    // Note: This is less secure than database validation but necessary for edge runtime
    // API routes should still validate against database using getSession()
    const user = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      isActive: payload.isActive,
    };

    // Check if user is marked as inactive in JWT
    // (Note: This check is based on JWT data, not live database data)
    if (!user.isActive) {
      return {
        valid: false,
        error: "USER_INACTIVE",
        message: "Akun Anda tidak aktif",
        user: null,
        session: null,
        shouldClearCookie: true,
      };
    }

    // Session is valid (JWT-wise)
    // Note: This does NOT guarantee:
    // - Session exists in database
    // - Session hasn't been manually invalidated
    // - User status hasn't changed since JWT was issued
    // These checks should be done in API routes
    return {
      valid: true,
      error: null,
      message: null,
      user: user,
      session: { token },
    };
  } catch (error) {
    // Handle JWT verification errors (invalid signature, malformed token, etc.)
    if (error.message === "Invalid or expired token") {
      return {
        valid: false,
        error: "INVALID_TOKEN",
        message: "Sesi tidak valid, silakan login kembali",
        user: null,
        session: null,
        shouldClearCookie: true,
      };
    }

    // Handle unexpected errors
    console.error("Session validation error:", error);
    return {
      valid: false,
      error: "VALIDATION_ERROR",
      message: "Terjadi kesalahan, silakan login kembali",
      user: null,
      session: null,
    };
  }
}

/**
 * Validate session from request
 * Extracts token from cookies and validates it
 * Convenience wrapper around validateSession() for middleware use
 *
 * @param {Request} request - Next.js request object
 * @returns {Promise<object>} Validation result with session data or error
 */
export async function validateSessionFromRequest(request) {
  const token = extractSessionToken(request);
  return await validateSession(token);
}

/**
 * Permission Evaluator
 * Evaluates user permissions against route requirements
 * Uses permission functions from src/lib/middleware.js
 */

// Import permission functions from middleware
import { permissions } from "./middleware.js";

/**
 * Check if user has required permissions for a route
 * Uses permission functions defined in src/lib/middleware.js
 *
 * @param {object} user - User object with role and other properties
 * @param {string[]} requiredPermissions - Array of permission function names
 * @returns {object} Permission check result
 */
export function checkRoutePermissions(user, requiredPermissions) {
  if (!user) {
    return {
      allowed: false,
      reason: "NO_USER",
      message: "Silakan login untuk melanjutkan",
    };
  }

  // If no specific permissions required, just check if user is authenticated
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return {
      allowed: true,
      reason: null,
      message: null,
    };
  }

  // Check each required permission
  for (const permissionName of requiredPermissions) {
    const permissionFunction = permissions[permissionName];

    // Validate permission function exists
    if (!permissionFunction || typeof permissionFunction !== "function") {
      console.error(
        `Permission function '${permissionName}' not found in middleware.js`
      );
      return {
        allowed: false,
        reason: "INVALID_PERMISSION",
        message: "Terjadi kesalahan konfigurasi sistem",
      };
    }

    // Check if user has this permission
    if (!permissionFunction(user)) {
      return {
        allowed: false,
        reason: "INSUFFICIENT_PERMISSION",
        message: "Anda tidak memiliki akses ke halaman ini",
        missingPermission: permissionName,
      };
    }
  }

  // All permissions satisfied
  return {
    allowed: true,
    reason: null,
    message: null,
  };
}

/**
 * Check if user has access to a specific route
 * Combines route classification with permission checking
 *
 * @param {object} user - User object with role and other properties
 * @param {string} pathname - Request pathname
 * @returns {object} Access check result with redirect information
 */
export function checkRouteAccess(user, pathname) {
  // Classify the route
  const routeInfo = classifyRoute(pathname);

  // Public and excluded routes are always accessible
  if (routeInfo.type === "public" || routeInfo.type === "excluded") {
    return {
      allowed: true,
      routeType: routeInfo.type,
      reason: null,
      message: null,
      redirectTo: null,
    };
  }

  // Protected routes require authentication
  if (!user) {
    return {
      allowed: false,
      routeType: routeInfo.type,
      reason: "NO_AUTH",
      message: "Silakan login untuk melanjutkan",
      redirectTo: getRedirectDestination(null, pathname, "NO_AUTH"),
    };
  }

  // Check role-based access
  if (routeInfo.allowedRoles && !routeInfo.allowedRoles.includes(user.role)) {
    return {
      allowed: false,
      routeType: routeInfo.type,
      reason: "ROLE_MISMATCH",
      message: "Anda tidak memiliki akses ke halaman ini",
      redirectTo: getRedirectDestination(user, pathname, "ROLE_MISMATCH"),
      requiredRoles: routeInfo.allowedRoles,
      userRole: user.role,
    };
  }

  // Check permission-based access
  if (routeInfo.permissions) {
    const permissionCheck = checkRoutePermissions(user, routeInfo.permissions);

    if (!permissionCheck.allowed) {
      return {
        allowed: false,
        routeType: routeInfo.type,
        reason: permissionCheck.reason,
        message: permissionCheck.message,
        redirectTo: getRedirectDestination(
          user,
          pathname,
          permissionCheck.reason
        ),
        missingPermission: permissionCheck.missingPermission,
      };
    }
  }

  // Access granted
  return {
    allowed: true,
    routeType: routeInfo.type,
    reason: null,
    message: null,
    redirectTo: null,
  };
}

/**
 * Evaluate route access for middleware
 * Complete evaluation including session validation and permission checking
 * This is the main function used by Next.js middleware
 *
 * @param {Request} request - Next.js request object
 * @param {string} pathname - Request pathname
 * @returns {Promise<object>} Complete evaluation result with redirect information
 */
export async function evaluateRouteAccess(request, pathname) {
  // Step 1: Classify the route
  const routeInfo = classifyRoute(pathname);

  // Step 2: Handle public and excluded routes (no auth needed)
  if (routeInfo.type === "public" || routeInfo.type === "excluded") {
    return {
      allowed: true,
      routeType: routeInfo.type,
      requiresAuth: false,
      user: null,
      reason: null,
      message: null,
      redirectTo: null,
    };
  }

  // Step 3: Validate session for protected routes
  const sessionValidation = await validateSessionFromRequest(request);

  if (!sessionValidation.valid) {
    return {
      allowed: false,
      routeType: routeInfo.type,
      requiresAuth: true,
      user: null,
      reason: sessionValidation.error,
      message: sessionValidation.message,
      redirectTo: getRedirectDestination(
        null,
        pathname,
        sessionValidation.error
      ),
      shouldClearCookie: sessionValidation.shouldClearCookie || false,
    };
  }

  const user = sessionValidation.user;

  // Step 4: Check route access with user permissions
  const accessCheck = checkRouteAccess(user, pathname);

  return {
    allowed: accessCheck.allowed,
    routeType: accessCheck.routeType,
    requiresAuth: true,
    user: user,
    reason: accessCheck.reason,
    message: accessCheck.message,
    redirectTo: accessCheck.redirectTo,
    missingPermission: accessCheck.missingPermission,
    requiredRoles: accessCheck.requiredRoles,
    userRole: accessCheck.userRole,
  };
}

/**
 * Check if user role is allowed for a route type
 * Helper function for role-based access control
 *
 * @param {string} role - User role (ADMIN or OPERATOR)
 * @param {string} routeType - Route type from classifyRoute
 * @returns {boolean} True if role is allowed
 */
export function isRoleAllowedForRouteType(role, routeType) {
  switch (routeType) {
    case "public":
    case "excluded":
      return true;

    case "admin-only":
      return role === "ADMIN";

    case "operator-allowed":
      return role === "ADMIN" || role === "OPERATOR";

    case "protected":
      // Default protected routes are admin-only for safety
      return role === "ADMIN";

    default:
      return false;
  }
}

/**
 * Get error message for access denial
 * Provides user-friendly error messages based on denial reason
 * Requirements 7.1, 7.2, 7.3:
 * - Permission denied messages (7.1)
 * - Session expired messages (7.2)
 * - Invalid session messages (7.3)
 *
 * @param {string} reason - Denial reason code
 * @param {object} context - Additional context (role, permission, etc.)
 * @returns {string} User-friendly error message in Indonesian
 */
export function getAccessDenialMessage(reason, context = {}) {
  switch (reason) {
    case "NO_AUTH":
    case "NO_TOKEN":
      return "Silakan login untuk melanjutkan";

    case "SESSION_EXPIRED":
      return "Sesi Anda telah berakhir"; // Requirement 7.2

    case "INVALID_TOKEN":
    case "SESSION_NOT_FOUND":
      return "Sesi tidak valid, silakan login kembali"; // Requirement 7.3

    case "USER_INACTIVE":
      return "Akun Anda tidak aktif";

    case "ROLE_MISMATCH":
      if (context.requiredRoles && context.requiredRoles.length > 0) {
        return `Halaman ini hanya dapat diakses oleh ${context.requiredRoles.join(" atau ")}`;
      }
      return "Anda tidak memiliki akses ke halaman ini"; // Requirement 7.1

    case "INSUFFICIENT_PERMISSION":
      return "Anda tidak memiliki izin untuk mengakses halaman ini"; // Requirement 7.1

    case "INVALID_PERMISSION":
      return "Terjadi kesalahan konfigurasi sistem";

    case "VALIDATION_ERROR":
      return "Terjadi kesalahan, silakan login kembali";

    default:
      return "Akses ditolak";
  }
}

/**
 * Create redirect information for unauthorized access
 * Combines redirect destination, error message, and cookie clearing logic
 * Requirements 7.1, 7.2, 7.3, 7.4:
 * - Determines redirect destination based on user role and error type
 * - Provides appropriate error messages
 * - Handles cookie clearing for invalid sessions
 * - Encodes error messages for URL safety (handled by caller)
 *
 * @param {object|null} user - User object or null if not authenticated
 * @param {string} pathname - Original pathname that was blocked
 * @param {string} reason - Denial reason code
 * @param {object} context - Additional context (role, permission, etc.)
 * @returns {object} Redirect information with destination, message, and flags
 */
export function createRedirectInfo(user, pathname, reason, context = {}) {
  // Determine if we should clear cookies (invalid/expired sessions)
  const shouldClearCookie = [
    "SESSION_EXPIRED",
    "INVALID_TOKEN",
    "SESSION_NOT_FOUND",
    "USER_INACTIVE",
  ].includes(reason);

  // Get redirect destination based on user role and error type
  const redirectTo = getRedirectDestination(user, pathname, reason);

  // Get user-friendly error message
  const message = getAccessDenialMessage(reason, context);

  return {
    redirectTo,
    message,
    shouldClearCookie,
    reason,
  };
}
