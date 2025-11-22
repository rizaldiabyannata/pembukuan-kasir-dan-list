/**
 * Tests for route permission evaluation
 * Validates that permission evaluation uses middleware.js permission functions correctly
 */

// Mock auth.js to avoid jose ES module issues
jest.mock("../auth.js", () => ({
  verifyToken: jest.fn(),
}));

// Mock prisma
jest.mock("../prisma.js", () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock middleware.js with permission functions
jest.mock("../middleware.js", () => ({
  permissions: {
    canViewDashboard: (user) => ["ADMIN"].includes(user?.role),
    canViewReports: (user) => ["ADMIN"].includes(user?.role),
    canViewUsers: (user) => ["ADMIN"].includes(user?.role),
    canViewAuditLogs: (user) => ["ADMIN"].includes(user?.role),
    canViewTransactions: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
    canViewExpenses: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
    canViewFleet: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
    canViewDrivers: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
    canViewPackages: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
    canViewStaff: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  },
}));

import {
  checkRoutePermissions,
  checkRouteAccess,
  isRoleAllowedForRouteType,
  getAccessDenialMessage,
} from "../route-protection.js";

describe("Route Permission Evaluation", () => {
  describe("checkRoutePermissions", () => {
    it("should allow access when user has all required permissions", () => {
      const adminUser = { id: "1", role: "ADMIN", email: "admin@test.com" };
      const result = checkRoutePermissions(adminUser, ["canViewDashboard"]);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it("should deny access when user lacks required permission", () => {
      const operatorUser = {
        id: "2",
        role: "OPERATOR",
        email: "operator@test.com",
      };
      const result = checkRoutePermissions(operatorUser, ["canViewDashboard"]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("INSUFFICIENT_PERMISSION");
      expect(result.message).toBe("Anda tidak memiliki akses ke halaman ini");
    });

    it("should deny access when user is null", () => {
      const result = checkRoutePermissions(null, ["canViewDashboard"]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("NO_USER");
    });

    it("should allow access when no permissions required", () => {
      const operatorUser = {
        id: "2",
        role: "OPERATOR",
        email: "operator@test.com",
      };
      const result = checkRoutePermissions(operatorUser, []);

      expect(result.allowed).toBe(true);
    });

    it("should handle invalid permission function names", () => {
      const adminUser = { id: "1", role: "ADMIN", email: "admin@test.com" };
      const result = checkRoutePermissions(adminUser, [
        "nonExistentPermission",
      ]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("INVALID_PERMISSION");
    });
  });

  describe("checkRouteAccess", () => {
    it("should allow ADMIN access to admin-only routes", () => {
      const adminUser = { id: "1", role: "ADMIN", email: "admin@test.com" };
      const result = checkRouteAccess(adminUser, "/dashboard");

      expect(result.allowed).toBe(true);
      expect(result.routeType).toBe("admin-only");
    });

    it("should deny OPERATOR access to admin-only routes", () => {
      const operatorUser = {
        id: "2",
        role: "OPERATOR",
        email: "operator@test.com",
      };
      const result = checkRouteAccess(operatorUser, "/dashboard");

      expect(result.allowed).toBe(false);
      expect(result.routeType).toBe("admin-only");
      expect(result.reason).toBe("ROLE_MISMATCH");
      expect(result.redirectTo).toBe("/transaksi");
    });

    it("should allow OPERATOR access to operator-allowed routes", () => {
      const operatorUser = {
        id: "2",
        role: "OPERATOR",
        email: "operator@test.com",
      };
      const result = checkRouteAccess(operatorUser, "/transaksi");

      expect(result.allowed).toBe(true);
      expect(result.routeType).toBe("operator-allowed");
    });

    it("should allow ADMIN access to operator-allowed routes", () => {
      const adminUser = { id: "1", role: "ADMIN", email: "admin@test.com" };
      const result = checkRouteAccess(adminUser, "/transaksi");

      expect(result.allowed).toBe(true);
      expect(result.routeType).toBe("operator-allowed");
    });

    it("should allow anyone access to public routes", () => {
      const result = checkRouteAccess(null, "/");

      expect(result.allowed).toBe(true);
      expect(result.routeType).toBe("public");
    });

    it("should deny unauthenticated access to protected routes", () => {
      const result = checkRouteAccess(null, "/dashboard");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("NO_AUTH");
      expect(result.redirectTo).toBe("/");
    });
  });

  describe("isRoleAllowedForRouteType", () => {
    it("should allow ADMIN for admin-only routes", () => {
      expect(isRoleAllowedForRouteType("ADMIN", "admin-only")).toBe(true);
    });

    it("should deny OPERATOR for admin-only routes", () => {
      expect(isRoleAllowedForRouteType("OPERATOR", "admin-only")).toBe(false);
    });

    it("should allow both roles for operator-allowed routes", () => {
      expect(isRoleAllowedForRouteType("ADMIN", "operator-allowed")).toBe(true);
      expect(isRoleAllowedForRouteType("OPERATOR", "operator-allowed")).toBe(
        true
      );
    });

    it("should allow anyone for public routes", () => {
      expect(isRoleAllowedForRouteType("ADMIN", "public")).toBe(true);
      expect(isRoleAllowedForRouteType("OPERATOR", "public")).toBe(true);
      expect(isRoleAllowedForRouteType(null, "public")).toBe(true);
    });
  });

  describe("getAccessDenialMessage", () => {
    it("should return appropriate message for NO_AUTH", () => {
      const message = getAccessDenialMessage("NO_AUTH");
      expect(message).toBe("Silakan login untuk melanjutkan");
    });

    it("should return appropriate message for SESSION_EXPIRED", () => {
      const message = getAccessDenialMessage("SESSION_EXPIRED");
      expect(message).toBe("Sesi Anda telah berakhir");
    });

    it("should return appropriate message for ROLE_MISMATCH", () => {
      const message = getAccessDenialMessage("ROLE_MISMATCH", {
        requiredRoles: ["ADMIN"],
      });
      expect(message).toBe("Halaman ini hanya dapat diakses oleh ADMIN");
    });

    it("should return appropriate message for INSUFFICIENT_PERMISSION", () => {
      const message = getAccessDenialMessage("INSUFFICIENT_PERMISSION");
      expect(message).toBe(
        "Anda tidak memiliki izin untuk mengakses halaman ini"
      );
    });

    it("should return default message for unknown reason", () => {
      const message = getAccessDenialMessage("UNKNOWN_REASON");
      expect(message).toBe("Akses ditolak");
    });
  });
});
