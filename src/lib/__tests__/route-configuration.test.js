/**
 * Route Configuration Tests
 * Tests for route classification, pattern matching, and permission mapping
 */

import { describe, it, expect, jest } from "@jest/globals";

// Mock auth.js and prisma.js to avoid import issues
jest.mock("../auth.js", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("../prisma.js", () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
    },
  },
}));

import {
  ROUTE_RULES,
  isPublicRoute,
  isAdminOnlyRoute,
  isOperatorAllowedRoute,
  isExcludedRoute,
  classifyRoute,
  getRoutePermissions,
  getMostSpecificRoute,
  matchRoute,
} from "../route-protection.js";

describe("Route Configuration Structure", () => {
  describe("ROUTE_RULES structure", () => {
    test("should have all required route categories", () => {
      expect(ROUTE_RULES).toHaveProperty("public");
      expect(ROUTE_RULES).toHaveProperty("adminOnly");
      expect(ROUTE_RULES).toHaveProperty("operatorAllowed");
      expect(ROUTE_RULES).toHaveProperty("excluded");
    });

    test("public routes should have pattern and no permissions", () => {
      ROUTE_RULES.public.forEach((route) => {
        expect(route).toHaveProperty("pattern");
        expect(route).toHaveProperty("description");
        expect(route).toHaveProperty("permissions");
        expect(route.permissions).toBeNull();
      });
    });

    test("admin-only routes should have pattern and permissions", () => {
      ROUTE_RULES.adminOnly.forEach((route) => {
        expect(route).toHaveProperty("pattern");
        expect(route).toHaveProperty("description");
        expect(route).toHaveProperty("permissions");
        expect(Array.isArray(route.permissions)).toBe(true);
        expect(route.permissions.length).toBeGreaterThan(0);
      });
    });

    test("operator-allowed routes should have pattern and permissions", () => {
      ROUTE_RULES.operatorAllowed.forEach((route) => {
        expect(route).toHaveProperty("pattern");
        expect(route).toHaveProperty("description");
        expect(route).toHaveProperty("permissions");
        expect(Array.isArray(route.permissions)).toBe(true);
        expect(route.permissions.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Route pattern matching", () => {
    test("should match exact routes", () => {
      expect(matchRoute("/dashboard", "/dashboard")).toBe(true);
      expect(matchRoute("/transaksi", "/transaksi")).toBe(true);
    });

    test("should match prefix routes", () => {
      expect(matchRoute("/transaksi/123", "/transaksi")).toBe(true);
      expect(matchRoute("/dashboard/stats", "/dashboard")).toBe(true);
    });

    test("should not match unrelated routes", () => {
      expect(matchRoute("/dashboard", "/transaksi")).toBe(false);
      expect(matchRoute("/users", "/audit")).toBe(false);
    });

    test("should handle trailing slashes", () => {
      expect(matchRoute("/dashboard/", "/dashboard")).toBe(true);
      expect(matchRoute("/dashboard", "/dashboard/")).toBe(true);
    });
  });

  describe("Route classification", () => {
    test("should classify public routes correctly", () => {
      expect(isPublicRoute("/")).toBe(true);
      expect(isPublicRoute("/reset-password")).toBe(true);
      expect(isPublicRoute("/reset-password/verify")).toBe(true);
    });

    test("should classify admin-only routes correctly", () => {
      expect(isAdminOnlyRoute("/dashboard")).toBe(true);
      expect(isAdminOnlyRoute("/laporan")).toBe(true);
      expect(isAdminOnlyRoute("/users")).toBe(true);
      expect(isAdminOnlyRoute("/audit")).toBe(true);
    });

    test("should classify operator-allowed routes correctly", () => {
      expect(isOperatorAllowedRoute("/transaksi")).toBe(true);
      expect(isOperatorAllowedRoute("/pengeluaran")).toBe(true);
      expect(isOperatorAllowedRoute("/armada")).toBe(true);
      expect(isOperatorAllowedRoute("/sopir")).toBe(true);
      expect(isOperatorAllowedRoute("/paket")).toBe(true);
      expect(isOperatorAllowedRoute("/staff")).toBe(true);
    });

    test("should classify excluded routes correctly", () => {
      expect(isExcludedRoute("/_next/static/chunk.js")).toBe(true);
      expect(isExcludedRoute("/api/transactions")).toBe(true);
      expect(isExcludedRoute("/favicon.ico")).toBe(true);
    });
  });

  describe("Permission mapping", () => {
    test("should return correct permissions for admin-only routes", () => {
      expect(getRoutePermissions("/dashboard")).toEqual(["canViewDashboard"]);
      expect(getRoutePermissions("/laporan")).toEqual(["canViewReports"]);
      expect(getRoutePermissions("/users")).toEqual(["canViewUsers"]);
      expect(getRoutePermissions("/audit")).toEqual(["canViewAuditLogs"]);
    });

    test("should return correct permissions for operator-allowed routes", () => {
      expect(getRoutePermissions("/transaksi")).toEqual([
        "canViewTransactions",
      ]);
      expect(getRoutePermissions("/pengeluaran")).toEqual(["canViewExpenses"]);
      expect(getRoutePermissions("/armada")).toEqual(["canViewFleet"]);
      expect(getRoutePermissions("/sopir")).toEqual(["canViewDrivers"]);
      expect(getRoutePermissions("/paket")).toEqual(["canViewPackages"]);
      expect(getRoutePermissions("/staff")).toEqual(["canViewStaff"]);
    });

    test("should return null for public routes", () => {
      expect(getRoutePermissions("/")).toBeNull();
      expect(getRoutePermissions("/reset-password")).toBeNull();
    });
  });

  describe("classifyRoute function", () => {
    test("should classify excluded routes with correct metadata", () => {
      const result = classifyRoute("/_next/static/chunk.js");
      expect(result.type).toBe("excluded");
      expect(result.requiresAuth).toBe(false);
      expect(result.allowedRoles).toBeNull();
      expect(result.permissions).toBeNull();
    });

    test("should classify public routes with correct metadata", () => {
      const result = classifyRoute("/");
      expect(result.type).toBe("public");
      expect(result.requiresAuth).toBe(false);
      expect(result.allowedRoles).toBeNull();
      expect(result.permissions).toBeNull();
    });

    test("should classify admin-only routes with correct metadata", () => {
      const result = classifyRoute("/dashboard");
      expect(result.type).toBe("admin-only");
      expect(result.requiresAuth).toBe(true);
      expect(result.allowedRoles).toEqual(["ADMIN"]);
      expect(result.permissions).toEqual(["canViewDashboard"]);
    });

    test("should classify operator-allowed routes with correct metadata", () => {
      const result = classifyRoute("/transaksi");
      expect(result.type).toBe("operator-allowed");
      expect(result.requiresAuth).toBe(true);
      expect(result.allowedRoles).toEqual(["ADMIN", "OPERATOR"]);
      expect(result.permissions).toEqual(["canViewTransactions"]);
    });
  });

  describe("getMostSpecificRoute function", () => {
    test("should return most specific match for routes", () => {
      const result = getMostSpecificRoute("/dashboard");
      expect(result).not.toBeNull();
      expect(result.pattern).toBe("/dashboard");
      expect(result.category).toBe("admin-only");
      expect(result.permissions).toEqual(["canViewDashboard"]);
    });

    test("should handle routes with sub-paths", () => {
      const result = getMostSpecificRoute("/transaksi/123");
      expect(result).not.toBeNull();
      expect(result.pattern).toBe("/transaksi");
      expect(result.category).toBe("operator-allowed");
    });

    test("should return null for unmatched routes", () => {
      const result = getMostSpecificRoute("/unknown-route");
      expect(result).toBeNull();
    });
  });
});
