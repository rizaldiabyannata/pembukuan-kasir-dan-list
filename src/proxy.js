/**
 * Next.js Proxy (formerly Middleware)
 * Handles authentication, authorization, and security at the edge
 * Updated for Next.js 16+ using proxy convention
 */

import { NextResponse } from "next/server";
import { getSession } from "./lib/auth";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/api/auth/login"];

// Admin page routes that require ADMIN role
const ADMIN_PAGE_ROUTES = ["/dashboard", "/laporan", "/audit", "/users"];

// Operator-accessible page routes
const OPERATOR_PAGE_ROUTES = [
  "/armada",
  "/sopir",
  "/staff",
  "/paket",
  "/transaksi",
  "/pengeluaran",
];

// API paths that require authentication
const PROTECTED_API_PATHS = [
  "/api/dashboard",
  "/api/transactions",
  "/api/reports",
  "/api/vehicles",
  "/api/armada",
  "/api/packages",
  "/api/drivers",
  "/api/staff",
  "/api/expenses",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/me",
];

// Admin-only API paths
const ADMIN_API_PATHS = ["/api/auth/register", "/api/users", "/api/audit"];

/**
 * Extract session token from request cookies
 * @param {Request} request - Next.js request object
 * @returns {string|null} Session token or null
 */
function getTokenFromRequest(request) {
  const cookies = request.cookies;

  // Try role-specific cookies first
  const roleCookies = ["session_admin", "session_operator"];
  for (const cookieName of roleCookies) {
    const token = cookies.get(cookieName)?.value;
    if (token) return token;
  }

  // Fallback to general session cookie for backward compatibility
  return cookies.get("session")?.value || null;
}

export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if path requires ADMIN role
  const requiresAdmin =
    ADMIN_PAGE_ROUTES.some((path) => pathname.startsWith(path)) ||
    ADMIN_API_PATHS.some((path) => pathname.startsWith(path));

  // Check if path requires authentication (ADMIN or OPERATOR)
  const requiresAuth =
    requiresAdmin ||
    OPERATOR_PAGE_ROUTES.some((path) => pathname.startsWith(path)) ||
    PROTECTED_API_PATHS.some((path) => pathname.startsWith(path));

  if (!requiresAuth) {
    return addSecurityHeaders(NextResponse.next());
  }

  // For API routes, authentication is handled by individual route handlers
  // This proxy just adds security headers
  if (pathname.startsWith("/api/")) {
    return addSecurityHeaders(NextResponse.next());
  }

  // For page routes, check authentication and authorization
  const token = getTokenFromRequest(request);

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `🚫 No session token found for ${pathname}, redirecting to /`
      );
    }
    // Redirect to homepage (login page)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // For admin routes, validate session and check role
  if (requiresAdmin) {
    const session = await getSession(token);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `🚫 Admin access denied for ${pathname}, redirecting to /transaksi`
        );
      }
      // Redirect to transactions page for non-admin users
      return NextResponse.redirect(new URL("/transaksi", request.url));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response) {
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:", // Added blob: for file preview
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
