/**
 * Unit Tests for Session Collision Retry Logic
 * Feature: session-token-collision-fix
 */

import { createSessionWithRetry } from "../auth";
import { prisma } from "../prisma";

// Mock prisma
jest.mock("../prisma", () => ({
  prisma: {
    session: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock jose library
jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mocked.jwt.token"),
  })),
  jwtVerify: jest.fn(),
}));

describe("Session Collision Retry - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: session-token-collision-fix, Property 6: Collision Retry Success
   * Validates: Requirements 1.3
   */
  describe("Collision Retry Success", () => {
    it("should successfully create session after collision on first attempt", async () => {
      const sessionData = {
        userId: "user-123",
        token: "test-token",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        role: "ADMIN",
        isActive: true,
      };

      const mockSession = {
        ...sessionData,
        user: mockUser,
      };

      // Mock: First attempt fails with P2002, second succeeds
      prisma.session.create
        .mockRejectedValueOnce({
          code: "P2002",
          meta: { target: ["token"] },
        })
        .mockResolvedValueOnce(mockSession);

      // Mock user lookup for retry
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Should succeed after retry
      const result = await createSessionWithRetry(sessionData, 1, 3);

      // Verify session was created
      expect(result).toBeDefined();
      expect(result.userId).toBe("user-123");

      // Verify retry occurred (create called twice)
      expect(prisma.session.create).toHaveBeenCalledTimes(2);
    });

    it("should successfully create session after multiple collisions", async () => {
      const sessionData = {
        userId: "user-456",
        token: "test-token-2",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      const mockUser = {
        id: "user-456",
        email: "test2@example.com",
        username: "testuser2",
        name: "Test User 2",
        role: "OPERATOR",
        isActive: true,
      };

      const mockSession = {
        ...sessionData,
        user: mockUser,
      };

      // Mock: Fail twice, then succeed
      prisma.session.create
        .mockRejectedValueOnce({
          code: "P2002",
          meta: { target: ["token"] },
        })
        .mockRejectedValueOnce({
          code: "P2002",
          meta: { target: ["token"] },
        })
        .mockResolvedValueOnce(mockSession);

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Should succeed after retries
      const result = await createSessionWithRetry(sessionData, 1, 3);

      // Verify session was created
      expect(result).toBeDefined();
      expect(result.userId).toBe("user-456");

      // Verify correct number of attempts (3 total)
      expect(prisma.session.create).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * Validates: Requirements 1.5
   */
  describe("Max Retry Error Handling", () => {
    it("should throw error after max retries exceeded", async () => {
      const sessionData = {
        userId: "user-789",
        token: "test-token-3",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      const mockUser = {
        id: "user-789",
        email: "test3@example.com",
        username: "testuser3",
        name: "Test User 3",
        role: "ADMIN",
        isActive: true,
      };

      // Mock: Always fail with P2002
      prisma.session.create.mockRejectedValue({
        code: "P2002",
        meta: { target: ["token"] },
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Should throw error after max retries
      await expect(createSessionWithRetry(sessionData, 1, 3)).rejects.toThrow(
        "Unable to create session. Please try again."
      );

      // Verify all 3 attempts were made
      expect(prisma.session.create).toHaveBeenCalledTimes(3);
    });

    it("should return user-friendly error message", async () => {
      const sessionData = {
        userId: "user-999",
        token: "test-token-4",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      const mockUser = {
        id: "user-999",
        email: "test4@example.com",
        username: "testuser4",
        name: "Test User 4",
        role: "OPERATOR",
        isActive: true,
      };

      // Mock: Always fail with P2002
      prisma.session.create.mockRejectedValue({
        code: "P2002",
        meta: { target: ["token"] },
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Should throw with specific message
      try {
        await createSessionWithRetry(sessionData, 1, 3);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toBe(
          "Unable to create session. Please try again."
        );
      }
    });
  });

  describe("Non-collision Errors", () => {
    it("should re-throw non-P2002 errors immediately", async () => {
      const sessionData = {
        userId: "user-error",
        token: "test-token-error",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      };

      // Mock: Fail with different error
      prisma.session.create.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Should throw immediately without retries
      await expect(createSessionWithRetry(sessionData, 1, 3)).rejects.toThrow(
        "Database connection failed"
      );

      // Verify only one attempt was made
      expect(prisma.session.create).toHaveBeenCalledTimes(1);
    });
  });
});
