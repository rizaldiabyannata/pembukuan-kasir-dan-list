/**
 * Tests for session validation in route protection
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock auth.js module
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

// Mock middleware.js to avoid Next.js imports
jest.mock("../middleware.js", () => ({
  permissions: {
    canViewDashboard: jest.fn(),
    canViewTransactions: jest.fn(),
    canViewExpenses: jest.fn(),
    canViewFleet: jest.fn(),
    canViewDrivers: jest.fn(),
    canViewPackages: jest.fn(),
    canViewStaff: jest.fn(),
    canViewReports: jest.fn(),
    canViewUsers: jest.fn(),
    canViewAuditLogs: jest.fn(),
  },
}));

// Import after mocks are set up
import { validateSession, extractSessionToken } from "../route-protection.js";
import { verifyToken } from "../auth.js";
import { prisma } from "../prisma.js";

describe("Session Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateSession", () => {
    it("should return error for missing token", async () => {
      const result = await validateSession(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("NO_TOKEN");
      expect(result.message).toBe("Silakan login untuk melanjutkan");
    });

    it("should return error for invalid token format", async () => {
      verifyToken.mockRejectedValue(new Error("Invalid or expired token"));

      const result = await validateSession("invalid-token");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_TOKEN");
      expect(result.shouldClearCookie).toBe(true);
    });

    it("should return error for inactive user in JWT payload", async () => {
      const token = "valid-jwt-token";

      // Mock JWT payload with inactive user
      verifyToken.mockResolvedValue({
        userId: "user-123",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        role: "ADMIN",
        isActive: false, // Inactive user in JWT
      });

      const result = await validateSession(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("USER_INACTIVE");
      expect(result.shouldClearCookie).toBe(true);
    });

    it("should return valid session for valid JWT token with active user", async () => {
      const token = "valid-jwt-token";

      // Mock JWT payload with active user
      const mockPayload = {
        userId: "user-123",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        role: "ADMIN",
        isActive: true,
      };

      verifyToken.mockResolvedValue(mockPayload);

      const result = await validateSession(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
      expect(result.user).toEqual({
        id: mockPayload.userId,
        email: mockPayload.email,
        username: mockPayload.username,
        name: mockPayload.name,
        role: mockPayload.role,
        isActive: mockPayload.isActive,
      });
      expect(result.session).toEqual({ token });
    });

    it("should return valid session for OPERATOR role", async () => {
      const token = "valid-jwt-token";

      // Mock JWT payload with operator user
      const mockPayload = {
        userId: "user-456",
        email: "operator@example.com",
        username: "operator",
        name: "Operator User",
        role: "OPERATOR",
        isActive: true,
      };

      verifyToken.mockResolvedValue(mockPayload);

      const result = await validateSession(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
      expect(result.user.role).toBe("OPERATOR");
    });

    it("should handle JWT verification errors gracefully", async () => {
      const token = "malformed-token";

      verifyToken.mockRejectedValue(new Error("JWT malformed"));

      const result = await validateSession(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("VALIDATION_ERROR");
    });
  });

  describe("extractSessionToken", () => {
    // Helper to create a valid JWT-like token with role
    const createMockToken = (role) => {
      const payload = Buffer.from(JSON.stringify({ role })).toString("base64");
      return `header.${payload}.signature`;
    };

    it("should extract token from session_admin cookie with ADMIN role", () => {
      const adminToken = createMockToken("ADMIN");
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: adminToken };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(adminToken);
      expect(result.source).toBe("session_admin");
      expect(result.conflictingCookies).toEqual([]);
      expect(result.invalidCookies).toEqual([]);
    });

    it("should extract token from session_operator cookie with OPERATOR role", () => {
      const operatorToken = createMockToken("OPERATOR");
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_operator") return { value: operatorToken };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(operatorToken);
      expect(result.source).toBe("session_operator");
      expect(result.conflictingCookies).toEqual([]);
      expect(result.invalidCookies).toEqual([]);
    });

    it("should extract token from legacy session cookie", () => {
      const legacyToken = createMockToken("ADMIN");
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session") return { value: legacyToken };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(legacyToken);
      expect(result.source).toBe("session");
      expect(result.conflictingCookies).toEqual([]);
      expect(result.invalidCookies).toEqual([]);
    });

    it("should prioritize role-matched cookie over others", () => {
      const adminToken = createMockToken("ADMIN");
      const operatorToken = createMockToken("OPERATOR");
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: adminToken };
            if (name === "session_operator") return { value: operatorToken };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(adminToken);
      expect(result.source).toBe("session_admin");
      expect(result.conflictingCookies).toContain("session_operator");
    });

    it("should detect and mark conflicting cookies", () => {
      const adminToken = createMockToken("ADMIN");
      const operatorToken = createMockToken("OPERATOR");
      const legacyToken = createMockToken("ADMIN");
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: adminToken };
            if (name === "session_operator") return { value: operatorToken };
            if (name === "session") return { value: legacyToken };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(adminToken);
      expect(result.source).toBe("session_admin");
      expect(result.conflictingCookies).toContain("session_operator");
      expect(result.conflictingCookies).toContain("session");
      expect(result.shouldClearCookies).toEqual(result.conflictingCookies);
    });

    it("should detect invalid token formats", () => {
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: "invalid-token" };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(null);
      expect(result.source).toBe(null);
      expect(result.invalidCookies).toContain("session_admin");
      expect(result.shouldClearCookies).toContain("session_admin");
    });

    it("should handle mismatched cookie names (OPERATOR token in admin cookie)", () => {
      const operatorToken = createMockToken("OPERATOR");
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: operatorToken };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(operatorToken);
      expect(result.source).toBe("session_admin");
      // Should mark the misnamed cookie for cleanup
      expect(result.conflictingCookies).toContain("session_admin");
    });

    it("should return null when no cookies present", () => {
      const request = {
        cookies: {
          get: jest.fn(() => undefined),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(null);
      expect(result.source).toBe(null);
      expect(result.conflictingCookies).toEqual([]);
      expect(result.invalidCookies).toEqual([]);
    });

    it("should fallback to any valid token when role extraction fails", () => {
      // Token without role in payload
      const tokenWithoutRole = "header.eyJ1c2VySWQiOiIxMjMifQ.signature";
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: tokenWithoutRole };
            return undefined;
          }),
        },
      };

      const result = extractSessionToken(request);
      expect(result.token).toBe(tokenWithoutRole);
      expect(result.source).toBe("session_admin");
    });
  });
});
