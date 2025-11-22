/**
 * Tests for redirect handling with error messages
 * Requirements 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, jest } from "@jest/globals";

// Mock auth.js, prisma.js, and middleware.js to avoid import issues
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

jest.mock("../middleware.js", () => ({
  permissions: {
    canViewDashboard: jest.fn(),
    canViewReports: jest.fn(),
    canViewUsers: jest.fn(),
    canViewAuditLogs: jest.fn(),
    canViewTransactions: jest.fn(),
    canViewExpenses: jest.fn(),
    canViewFleet: jest.fn(),
    canViewDrivers: jest.fn(),
    canViewPackages: jest.fn(),
    canViewStaff: jest.fn(),
  },
}));

import {
  getRedirectDestination,
  getAccessDenialMessage,
  createRedirectInfo,
} from "../route-protection.js";

describe("Redirect Handling", () => {
  describe("getRedirectDestination", () => {
    it("should redirect unauthenticated users to login", () => {
      const destination = getRedirectDestination(null, "/dashboard", "NO_AUTH");
      expect(destination).toBe("/");
    });

    it("should redirect OPERATOR from admin routes to transactions page", () => {
      const user = { id: "1", role: "OPERATOR", name: "Test Operator" };
      const destination = getRedirectDestination(
        user,
        "/dashboard",
        "ROLE_MISMATCH"
      );
      expect(destination).toBe("/transaksi");
    });

    it("should redirect users with expired sessions to login", () => {
      const user = { id: "1", role: "OPERATOR", name: "Test Operator" };
      const destination = getRedirectDestination(
        user,
        "/transaksi",
        "SESSION_EXPIRED"
      );
      expect(destination).toBe("/");
    });

    it("should redirect users with invalid tokens to login", () => {
      const user = { id: "1", role: "ADMIN", name: "Test Admin" };
      const destination = getRedirectDestination(
        user,
        "/dashboard",
        "INVALID_TOKEN"
      );
      expect(destination).toBe("/");
    });

    it("should redirect ADMIN users with permission issues to dashboard", () => {
      const user = { id: "1", role: "ADMIN", name: "Test Admin" };
      const destination = getRedirectDestination(
        user,
        "/some-route",
        "INSUFFICIENT_PERMISSION"
      );
      expect(destination).toBe("/dashboard");
    });
  });

  describe("getAccessDenialMessage", () => {
    it("should return appropriate message for permission denied", () => {
      const message = getAccessDenialMessage("ROLE_MISMATCH");
      expect(message).toBe("Anda tidak memiliki akses ke halaman ini");
    });

    it("should return appropriate message for expired session", () => {
      const message = getAccessDenialMessage("SESSION_EXPIRED");
      expect(message).toBe("Sesi Anda telah berakhir");
    });

    it("should return appropriate message for invalid session", () => {
      const message = getAccessDenialMessage("INVALID_TOKEN");
      expect(message).toBe("Sesi tidak valid, silakan login kembali");
    });

    it("should return appropriate message for insufficient permission", () => {
      const message = getAccessDenialMessage("INSUFFICIENT_PERMISSION");
      expect(message).toBe(
        "Anda tidak memiliki izin untuk mengakses halaman ini"
      );
    });

    it("should include required roles in message when provided", () => {
      const message = getAccessDenialMessage("ROLE_MISMATCH", {
        requiredRoles: ["ADMIN"],
      });
      expect(message).toBe("Halaman ini hanya dapat diakses oleh ADMIN");
    });
  });

  describe("createRedirectInfo", () => {
    it("should create redirect info for unauthenticated user", () => {
      const info = createRedirectInfo(null, "/dashboard", "NO_AUTH");
      expect(info.redirectTo).toBe("/");
      expect(info.message).toBe("Silakan login untuk melanjutkan");
      expect(info.shouldClearCookie).toBe(false);
      expect(info.reason).toBe("NO_AUTH");
    });

    it("should create redirect info for OPERATOR accessing admin route", () => {
      const user = { id: "1", role: "OPERATOR", name: "Test Operator" };
      const info = createRedirectInfo(user, "/dashboard", "ROLE_MISMATCH");
      expect(info.redirectTo).toBe("/transaksi");
      expect(info.message).toBe("Anda tidak memiliki akses ke halaman ini");
      expect(info.shouldClearCookie).toBe(false);
      expect(info.reason).toBe("ROLE_MISMATCH");
    });

    it("should create redirect info with cookie clearing for expired session", () => {
      const user = { id: "1", role: "OPERATOR", name: "Test Operator" };
      const info = createRedirectInfo(user, "/transaksi", "SESSION_EXPIRED");
      expect(info.redirectTo).toBe("/");
      expect(info.message).toBe("Sesi Anda telah berakhir");
      expect(info.shouldClearCookie).toBe(true);
      expect(info.reason).toBe("SESSION_EXPIRED");
    });

    it("should create redirect info with cookie clearing for invalid token", () => {
      const user = { id: "1", role: "ADMIN", name: "Test Admin" };
      const info = createRedirectInfo(user, "/dashboard", "INVALID_TOKEN");
      expect(info.redirectTo).toBe("/");
      expect(info.message).toBe("Sesi tidak valid, silakan login kembali");
      expect(info.shouldClearCookie).toBe(true);
      expect(info.reason).toBe("INVALID_TOKEN");
    });

    it("should create redirect info with cookie clearing for inactive user", () => {
      const user = { id: "1", role: "ADMIN", name: "Test Admin" };
      const info = createRedirectInfo(user, "/dashboard", "USER_INACTIVE");
      expect(info.redirectTo).toBe("/");
      expect(info.message).toBe("Akun Anda tidak aktif");
      expect(info.shouldClearCookie).toBe(true);
      expect(info.reason).toBe("USER_INACTIVE");
    });
  });

  describe("Error Message Encoding", () => {
    it("should handle special characters in error messages", () => {
      // Test that messages with special characters can be used
      const message = getAccessDenialMessage("ROLE_MISMATCH", {
        requiredRoles: ["ADMIN", "SUPER_ADMIN"],
      });
      expect(message).toContain("atau");
      // URL encoding is handled by NextURL.searchParams.set() in middleware
      // This test just verifies the message is properly formatted
    });

    it("should handle Indonesian characters in error messages", () => {
      const message = getAccessDenialMessage("SESSION_EXPIRED");
      expect(message).toContain("Anda");
      expect(message).toContain("telah");
    });
  });
});
