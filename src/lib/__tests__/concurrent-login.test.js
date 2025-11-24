/**
 * Integration Tests for Concurrent Login Handling
 * Feature: session-token-collision-fix
 * Validates: Requirements 1.2
 *
 * Tests that multiple simultaneous logins for the same user
 * succeed without collisions and create the correct number of sessions
 */

// Mock jose library to avoid TextEncoder issues in test environment
// We're testing the collision handling logic, not JWT generation itself
jest.mock("jose", () => {
  let tokenCounter = 0;
  return {
    SignJWT: jest.fn().mockImplementation(() => ({
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockImplementation(async () => {
        // Generate unique JWT tokens for testing
        tokenCounter++;
        return `mocked.jwt.token.${Date.now()}.${tokenCounter}.${Math.random()}`;
      }),
    })),
    jwtVerify: jest.fn().mockResolvedValue({ payload: {} }),
  };
});

import { createSession, deleteAllUserSessions, hashPassword } from "../auth";
import { prisma } from "../prisma";

describe("Concurrent Login Integration Tests", () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user for concurrent login tests
    const hashedPassword = await hashPassword("TestPassword123!");

    testUser = await prisma.user.create({
      data: {
        email: "concurrent-test@example.com",
        username: "concurrenttest",
        name: "Concurrent Test User",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up test user and sessions
    if (testUser && testUser.id) {
      await deleteAllUserSessions(testUser.id);
      await prisma.user
        .delete({
          where: { id: testUser.id },
        })
        .catch(() => {
          // User might already be deleted, ignore error
        });
    }
  });

  beforeEach(async () => {
    // Clean up sessions before each test
    await deleteAllUserSessions(testUser.id);
  });

  /**
   * Validates: Requirements 1.2
   * Test that multiple simultaneous logins for same user succeed without collisions
   */
  it("should handle 5 concurrent logins without collisions", async () => {
    const concurrentLogins = 5;
    const ipAddress = "127.0.0.1";
    const userAgent = "Mozilla/5.0 Test Browser";

    // Create multiple concurrent login attempts
    const loginPromises = Array.from({ length: concurrentLogins }, (_, i) =>
      createSession(testUser.id, `${ipAddress}-${i}`, `${userAgent}-${i}`)
    );

    // All logins should succeed
    const sessions = await Promise.all(loginPromises);

    // Verify all sessions were created
    expect(sessions).toHaveLength(concurrentLogins);
    sessions.forEach((session) => {
      expect(session).toBeDefined();
      expect(session.userId).toBe(testUser.id);
      expect(session.token).toBeDefined();
      expect(session.expiresAt).toBeDefined();
    });

    // Verify all tokens are unique
    const tokens = sessions.map((s) => s.token);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(concurrentLogins);

    // Verify correct number of sessions in database
    const dbSessions = await prisma.session.findMany({
      where: { userId: testUser.id },
    });
    expect(dbSessions).toHaveLength(concurrentLogins);
  });

  /**
   * Validates: Requirements 1.2
   * Test that rapid sequential logins succeed without collisions
   */
  it("should handle 10 rapid sequential logins without collisions", async () => {
    const rapidLogins = 10;
    const ipAddress = "192.168.1.1";
    const userAgent = "Chrome/120.0 Test";

    const sessions = [];

    // Create rapid sequential logins (no await between them initially)
    for (let i = 0; i < rapidLogins; i++) {
      const sessionPromise = createSession(
        testUser.id,
        `${ipAddress}-${i}`,
        `${userAgent}-${i}`
      );
      sessions.push(sessionPromise);
    }

    // Wait for all to complete
    const completedSessions = await Promise.all(sessions);

    // Verify all sessions were created
    expect(completedSessions).toHaveLength(rapidLogins);
    completedSessions.forEach((session) => {
      expect(session).toBeDefined();
      expect(session.userId).toBe(testUser.id);
      expect(session.token).toBeDefined();
    });

    // Verify all tokens are unique
    const tokens = completedSessions.map((s) => s.token);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(rapidLogins);

    // Verify correct number of sessions in database
    const dbSessions = await prisma.session.findMany({
      where: { userId: testUser.id },
    });
    expect(dbSessions).toHaveLength(rapidLogins);
  });

  /**
   * Validates: Requirements 1.2, 1.4
   * Test that concurrent logins from different IPs all succeed
   */
  it("should handle concurrent logins from different IPs", async () => {
    const concurrentLogins = 3;
    const ips = ["10.0.0.1", "10.0.0.2", "10.0.0.3"];
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Mozilla/5.0 (X11; Linux x86_64)",
    ];

    // Create concurrent logins from different IPs
    const loginPromises = ips.map((ip, i) =>
      createSession(testUser.id, ip, userAgents[i])
    );

    // All logins should succeed
    const sessions = await Promise.all(loginPromises);

    // Verify all sessions were created with correct IPs
    expect(sessions).toHaveLength(concurrentLogins);
    sessions.forEach((session, i) => {
      expect(session).toBeDefined();
      expect(session.userId).toBe(testUser.id);
      expect(session.ipAddress).toBe(ips[i]);
      expect(session.userAgent).toBe(userAgents[i]);
    });

    // Verify all tokens are unique
    const tokens = sessions.map((s) => s.token);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(concurrentLogins);

    // Verify correct number of sessions in database
    const dbSessions = await prisma.session.findMany({
      where: { userId: testUser.id },
    });
    expect(dbSessions).toHaveLength(concurrentLogins);
  });

  /**
   * Validates: Requirements 1.1, 1.4
   * Test that each successful login creates exactly one session
   */
  it("should create exactly one session per successful login", async () => {
    const ipAddress = "172.16.0.1";
    const userAgent = "Safari/17.0 Test";

    // Get initial session count
    const initialSessions = await prisma.session.findMany({
      where: { userId: testUser.id },
    });
    expect(initialSessions).toHaveLength(0);

    // Create first session
    const session1 = await createSession(testUser.id, ipAddress, userAgent);
    expect(session1).toBeDefined();

    // Verify exactly one session exists
    const afterFirst = await prisma.session.findMany({
      where: { userId: testUser.id },
    });
    expect(afterFirst).toHaveLength(1);

    // Create second session
    const session2 = await createSession(
      testUser.id,
      `${ipAddress}-2`,
      userAgent
    );
    expect(session2).toBeDefined();

    // Verify exactly two sessions exist
    const afterSecond = await prisma.session.findMany({
      where: { userId: testUser.id },
    });
    expect(afterSecond).toHaveLength(2);

    // Verify tokens are different
    expect(session1.token).not.toBe(session2.token);
  });

  /**
   * Validates: Requirements 1.2
   * Stress test with higher concurrency
   */
  it("should handle 20 concurrent logins without collisions", async () => {
    const concurrentLogins = 20;
    const ipAddress = "203.0.113.0";
    const userAgent = "Edge/120.0 Test";

    // Create many concurrent login attempts
    const loginPromises = Array.from({ length: concurrentLogins }, (_, i) =>
      createSession(testUser.id, `${ipAddress}.${i}`, `${userAgent}-${i}`)
    );

    // All logins should succeed
    const sessions = await Promise.all(loginPromises);

    // Verify all sessions were created
    expect(sessions).toHaveLength(concurrentLogins);

    // Verify all tokens are unique
    const tokens = sessions.map((s) => s.token);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(concurrentLogins);

    // Verify correct number of sessions in database
    const dbSessions = await prisma.session.findMany({
      where: { userId: testUser.id },
    });
    expect(dbSessions).toHaveLength(concurrentLogins);
  });
});
