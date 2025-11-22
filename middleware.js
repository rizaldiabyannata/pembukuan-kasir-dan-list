/**
 * Next.js Middleware
 * Server-side route protection for the Pembukuan Kasir & List application
 *
 * This middleware intercepts all requests before they reach route handlers,
 * performing authentication and authorization checks at the server level.
 *
 * Route Classification:
 * - Public routes: Accessible without authentication (login, password reset)
 * - Static assets: Bypass middleware (_next, images, favicon)
 * - API routes: Skip middleware (handled by API middleware)
 * - Protected routes: Require authentication and authorization
 *
 * Security Features:
 * - Session validation with JWT verification (edge-compatible)
 * - Role-based access control (ADMIN vs OPERATOR)
 * - Permission-based access control
 * - Console logging for unauthorized access attempts
 * - Clear error messages for access denial
 *
 * Edge Runtime Compatibility:
 * This middleware runs on edge runtime and uses JWT-only validation.
 * It does NOT access the database (Prisma) for performance and compatibility.
 * Full database validation and audit logging occur in API routes.
 *
 * Defense-in-Depth:
 * This middleware provides the first layer of protection. API endpoints
 * maintain their own protection using src/lib/middleware.js for defense-in-depth.
 */

import { NextResponse } from "next/server";
import {
  evaluateRouteAccess,
  isPublicRoute,
  isExcludedRoute,
  isApiRoute,
  getDefaultLandingPage,
  extractSessionToken,
} from "./src/lib/route-protection.js";

/**
 * Get client IP address from request
 * Checks multiple headers for proxy/load balancer scenarios
 */
function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "unknown"
  );
}

/**
 * Get user agent from request
 */
function getUserAgent(request) {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Create redirect response with error message
 * Error message is passed via query parameter for display on destination page
 *
 * Requirements 7.1, 7.2, 7.3, 7.4:
 * - Includes error messages in query parameters (7.4)
 * - Automatically URL-encodes messages for safety
 * - Determines redirect destination based on user role and error type (7.1, 7.2, 7.3)
 * - Clears invalid session cookies when appropriate
 *
 * @param {string} destination - Redirect destination path
 * @param {string} errorMessage - Error message to display (will be URL-encoded)
 * @param {NextRequest} request - Original request
 * @param {boolean} shouldClearCookie - Whether to clear session cookies
 * @returns {NextResponse} Redirect response with error parameter
 */
function createRedirectWithError(
  destination,
  errorMessage,
  request,
  shouldClearCookie = false
) {
  const url = request.nextUrl.clone();
  url.pathname = destination;

  // Add error message as query parameter
  // NextURL.searchParams.set() automatically handles URL encoding for safety
  if (errorMessage) {
    url.searchParams.set("error", errorMessage);
  }

  const response = NextResponse.redirect(url);

  // Clear session cookies if needed (expired/invalid sessions)
  // This ensures users with invalid sessions get a clean slate
  if (shouldClearCookie) {
    response.cookies.delete("session_admin");
    response.cookies.delete("session_operator");
    response.cookies.delete("session"); // Legacy cookie
  }

  return response;
}

/**
 * Log unauthorized access attempt to console
 * Note: Database audit logging is handled by API routes, not middleware
 * Middleware runs on edge runtime and cannot access Prisma
 *
 * @param {object} user - User object (may be null for unauthenticated)
 * @param {string} pathname - Attempted route path
 * @param {string} reason - Reason for denial
 * @param {NextRequest} request - Original request
 */
function logUnauthorizedAccess(user, pathname, reason, request) {
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  // Log to console for debugging
  // Full audit logging is handled by API routes which have database access
  console.warn("Access denied:", {
    userId: user?.id || null,
    userRole: user?.role || null,
    pathname,
    reason,
    ipAddress,
    userAgent: userAgent.substring(0, 50), // Truncate for readability
  });
}

/**
 * Handle protected route access
 * Validates session and checks permissions
 *
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} Response (allow or redirect)
 */
async function handleProtectedRoute(request) {
  const { pathname } = request.nextUrl;

  // Evaluate route access (session validation + permission check)
  const evaluation = await evaluateRouteAccess(request, pathname);

  // Access granted - allow request to proceed
  if (evaluation.allowed) {
    return NextResponse.next();
  }

  // Access denied - log and redirect
  const { user, reason, message, redirectTo, shouldClearCookie } = evaluation;

  // Log unauthorized access attempt to console
  logUnauthorizedAccess(user, pathname, reason, request);

  // Redirect with error message
  return createRedirectWithError(
    redirectTo || "/",
    message || "Akses ditolak",
    request,
    shouldClearCookie
  );
}

/**
 * Handle authenticated users accessing login page
 * Redirect them to their default landing page
 *
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} Response (redirect or allow)
 */
async function handleLoginPageAccess(request) {
  const token = extractSessionToken(request);

  // No token - allow access to login page
  if (!token) {
    return NextResponse.next();
  }

  // Validate session to get user role
  const { validateSession } = await import("./src/lib/route-protection.js");
  const sessionValidation = await validateSession(token);

  // Invalid session - allow access to login page
  if (!sessionValidation.valid) {
    return NextResponse.next();
  }

  // Valid session - redirect to default landing page
  const user = sessionValidation.user;
  const landingPage = getDefaultLandingPage(user.role);

  const url = request.nextUrl.clone();
  url.pathname = landingPage;
  return NextResponse.redirect(url);
}

/**
 * Main middleware function
 * Entry point for all requests
 *
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} Response
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Handle static assets and excluded routes (highest priority)
  // These bypass all middleware processing
  if (isExcludedRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Handle API routes
  // API routes have their own middleware (src/lib/middleware.js)
  if (isApiRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. Handle public routes
  // Special handling for login page (redirect if already authenticated)
  if (pathname === "/") {
    return await handleLoginPageAccess(request);
  }

  // Other public routes (password reset, etc.)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 4. Handle protected routes
  // Requires authentication and authorization
  return await handleProtectedRoute(request);
}

/**
 * Middleware configuration
 * Defines which routes the middleware should run on
 *
 * Matcher excludes:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico (favicon)
 *
 * All other routes are processed by middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
