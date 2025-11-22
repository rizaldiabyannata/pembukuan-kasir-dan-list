/**
 * Tests for session validation in route protection
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { validateSession, extractSessionToken } from "../route-protection.js";

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

// Import mocked modules
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

    it("should return error for expired session", async () => {
      const token = "valid-jwt-token";
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      verifyToken.mockResolvedValue({ userId: "user-123" });
      prisma.session.findUnique.mockResolvedValue({
        token,
        expiresAt: expiredDate,
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "ADMIN",
          isActive: true,
        },
      });

      const result = await validateSession(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("SESSION_EXPIRED");
      expect(result.shouldClearCookie).toBe(true);
    });

    it("should return error for inactive user", async () => {
      const token = "valid-jwt-token";
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      verifyToken.mockResolvedValue({ userId: "user-123" });
      prisma.session.findUnique.mockResolvedValue({
        token,
        expiresAt: futureDate,
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "ADMIN",
          isActive: false, // Inactive user
        },
      });

      const result = await validateSession(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("USER_INACTIVE");
      expect(result.shouldClearCookie).toBe(true);
    });

    it("should return error for non-existent session", async () => {
      const token = "valid-jwt-token";

      verifyToken.mockResolvedValue({ userId: "user-123" });
      prisma.session.findUnique.mockResolvedValue(null);

      const result = await validateSession(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("SESSION_NOT_FOUND");
    });

    it("should return valid session for valid token", async () => {
      const token = "valid-jwt-token";
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockSession = {
        token,
        expiresAt: futureDate,
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "ADMIN",
          isActive: true,
        },
      };

      verifyToken.mockResolvedValue({ userId: "user-123" });
      prisma.session.findUnique.mockResolvedValue(mockSession);

      const result = await validateSession(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
      expect(result.user).toEqual(mockSession.user);
      expect(result.session).toEqual(mockSession);
    });
  });

  describe("extractSessionToken", () => {
    it("should extract token from session_admin cookie", () => {
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: "admin-token" };
            return undefined;
          }),
        },
      };

      const token = extractSessionToken(request);
      expect(token).toBe("admin-token");
    });

    it("should extract token from session_operator cookie", () => {
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_operator") return { value: "operator-token" };
            return undefined;
          }),
        },
      };

      const token = extractSessionToken(request);
      expect(token).toBe("operator-token");
    });

    it("should extract token from legacy session cookie", () => {
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session") return { value: "legacy-token" };
            return undefined;
          }),
        },
      };

      const token = extractSessionToken(request);
      expect(token).toBe("legacy-token");
    });

    it("should prioritize session_admin over session_operator", () => {
      const request = {
        cookies: {
          get: jest.fn((name) => {
            if (name === "session_admin") return { value: "admin-token" };
            if (name === "session_operator") return { value: "operator-token" };
            return undefined;
          }),
        },
      };

      const token = extractSessionToken(request);
      expect(token).toBe("admin-token");
    });

    it("should return null when no cookies present", () => {
      const request = {
        cookies: {
          get: jest.fn(() => undefined),
        },
      };

      const token = extractSessionToken(request);
      expect(token).toBe(null);
    });
  });
});
