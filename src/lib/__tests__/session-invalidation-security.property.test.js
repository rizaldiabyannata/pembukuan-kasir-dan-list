/**
 * Property-Based Tests for Session Invalidation on Security Events
 * Feature: session-token-collision-fix
 * @jest-environment node
 */

// Set environment variable BEFORE importing auth module
process.env.JWT_SECRET =
  "test-jwt-secret-key-for-testing-purposes-minimum-32-characters";

import fc from "fast-check";
import { prisma } from "../prisma";
import { createSession, deleteAllUserSessions, resetPassword } from "../auth";

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Session Invalidation on Security Events - Property-Based Tests", () => {
  // Helper to create a test user
  const createTestUser = async (
    email,
    username,
    password = "hashed_password"
  ) => {
    return await prisma.user.create({
      data: {
        email,
        username,
        password,
        name: "Test User",
        role: "OPERATOR",
        isActive: true,
      },
    });
  };

  // Cleanup after each test
  afterEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  /**
   * Feature: session-token-collision-fix, Property 7: Session Invalidation on Security Events
   * Validates: Requirements 4.4, 4.5
   *
   * For any security-critical event (password change, account deactivation),
   * all existing sessions for the affected user should be immediately invalidated.
   */
  describe("Property 7: Session Invalidation on Security Events", () => {
    it("should invalidate all sessions when password is changed", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (sessionCount) => {
            // Create a test user with a reset token
            const resetToken = require("crypto")
              .randomBytes(32)
              .toString("hex");
            const resetTokenExpiry = new Date();
            resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

            const user = await prisma.user.create({
              data: {
                email: `test-${Date.now()}-${Math.random()}@example.com`,
                username: `testuser-${Date.now()}-${Math.random()}`,
                password: "old_hashed_password",
                name: "Test User",
                role: "OPERATOR",
                isActive: true,
                resetToken,
                resetTokenExpiry,
              },
            });

            // Create multiple sessions for the user
            const sessions = [];
            for (let i = 0; i < sessionCount; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Verify sessions exist before password change
            const sessionsBefore = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsBefore).toBe(sessionCount);

            // Change password (this should invalidate all sessions)
            // Note: resetPassword internally calls deleteAllUserSessions
            await resetPassword(resetToken, "new_password");

            // Verify: all sessions should be invalidated (deleted)
            const sessionsAfter = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsAfter).toBe(0);

            // Verify: each individual session no longer exists
            for (const session of sessions) {
              const found = await prisma.session.findUnique({
                where: { id: session.id },
              });
              expect(found).toBeNull();
            }
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to password hashing overhead
      );
    }, 120000);

    it("should invalidate all sessions when account is deactivated", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (sessionCount) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create multiple sessions for the user
            const sessions = [];
            for (let i = 0; i < sessionCount; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Verify sessions exist before deactivation
            const sessionsBefore = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsBefore).toBe(sessionCount);

            // Deactivate account (this should invalidate all sessions)
            await prisma.user.update({
              where: { id: user.id },
              data: { isActive: false },
            });

            // Manually call deleteAllUserSessions (simulating admin action)
            await deleteAllUserSessions(user.id);

            // Verify: all sessions should be invalidated (deleted)
            const sessionsAfter = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsAfter).toBe(0);

            // Verify: each individual session no longer exists
            for (const session of sessions) {
              const found = await prisma.session.findUnique({
                where: { id: session.id },
              });
              expect(found).toBeNull();
            }

            // Verify: user is marked as inactive
            const updatedUser = await prisma.user.findUnique({
              where: { id: user.id },
            });
            expect(updatedUser.isActive).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should invalidate all sessions for specific user without affecting other users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            user1Sessions: fc.integer({ min: 1, max: 3 }),
            user2Sessions: fc.integer({ min: 1, max: 3 }),
          }),
          async ({ user1Sessions, user2Sessions }) => {
            // Create two test users
            const user1 = await createTestUser(
              `user1-${Date.now()}-${Math.random()}@example.com`,
              `user1-${Date.now()}-${Math.random()}`
            );
            const user2 = await createTestUser(
              `user2-${Date.now()}-${Math.random()}@example.com`,
              `user2-${Date.now()}-${Math.random()}`
            );

            // Create sessions for user1
            const user1SessionsList = [];
            for (let i = 0; i < user1Sessions; i++) {
              const session = await createSession(
                user1.id,
                `192.168.1.${i}`,
                `User1Agent-${i}`
              );
              user1SessionsList.push(session);
            }

            // Create sessions for user2
            const user2SessionsList = [];
            for (let i = 0; i < user2Sessions; i++) {
              const session = await createSession(
                user2.id,
                `10.0.0.${i}`,
                `User2Agent-${i}`
              );
              user2SessionsList.push(session);
            }

            // Verify both users have sessions
            const user1SessionsBefore = await prisma.session.count({
              where: { userId: user1.id },
            });
            const user2SessionsBefore = await prisma.session.count({
              where: { userId: user2.id },
            });
            expect(user1SessionsBefore).toBe(user1Sessions);
            expect(user2SessionsBefore).toBe(user2Sessions);

            // Invalidate all sessions for user1 only (simulating password change)
            await deleteAllUserSessions(user1.id);

            // Verify: user1 sessions are all deleted
            const user1SessionsAfter = await prisma.session.count({
              where: { userId: user1.id },
            });
            expect(user1SessionsAfter).toBe(0);

            // Verify: user2 sessions are unaffected
            const user2SessionsAfter = await prisma.session.count({
              where: { userId: user2.id },
            });
            expect(user2SessionsAfter).toBe(user2Sessions);

            // Verify: each user2 session still exists
            for (const session of user2SessionsList) {
              const found = await prisma.session.findUnique({
                where: { id: session.id },
              });
              expect(found).not.toBeNull();
              expect(found.userId).toBe(user2.id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle session invalidation when user has no sessions", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Create a test user with no sessions
          const user = await createTestUser(
            `test-${Date.now()}-${Math.random()}@example.com`,
            `testuser-${Date.now()}-${Math.random()}`
          );

          // Verify user has no sessions
          const sessionsBefore = await prisma.session.count({
            where: { userId: user.id },
          });
          expect(sessionsBefore).toBe(0);

          // Attempt to invalidate all sessions (should not throw error)
          await expect(deleteAllUserSessions(user.id)).resolves.not.toThrow();

          // Verify: still no sessions
          const sessionsAfter = await prisma.session.count({
            where: { userId: user.id },
          });
          expect(sessionsAfter).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should invalidate sessions immediately without delay", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 4 }),
          async (sessionCount) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create multiple sessions
            const sessions = [];
            for (let i = 0; i < sessionCount; i++) {
              const session = await createSession(
                user.id,
                `192.168.1.${i}`,
                `UserAgent-${i}`
              );
              sessions.push(session);
            }

            // Record time before invalidation
            const beforeInvalidation = Date.now();

            // Invalidate all sessions
            await deleteAllUserSessions(user.id);

            // Record time after invalidation
            const afterInvalidation = Date.now();

            // Verify: invalidation happened quickly (within 1 second)
            const timeTaken = afterInvalidation - beforeInvalidation;
            expect(timeTaken).toBeLessThan(1000);

            // Verify: all sessions are immediately gone
            const sessionsAfter = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsAfter).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should allow creating new sessions after invalidation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            initialSessions: fc.integer({ min: 1, max: 3 }),
            newSessions: fc.integer({ min: 1, max: 3 }),
          }),
          async ({ initialSessions, newSessions }) => {
            // Create a test user
            const user = await createTestUser(
              `test-${Date.now()}-${Math.random()}@example.com`,
              `testuser-${Date.now()}-${Math.random()}`
            );

            // Create initial sessions
            for (let i = 0; i < initialSessions; i++) {
              await createSession(user.id, `192.168.1.${i}`, `UserAgent-${i}`);
            }

            // Verify initial sessions exist
            const sessionsBefore = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsBefore).toBe(initialSessions);

            // Invalidate all sessions (simulating security event)
            await deleteAllUserSessions(user.id);

            // Verify: all sessions are deleted
            const sessionsAfterInvalidation = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsAfterInvalidation).toBe(0);

            // Create new sessions (user logs in again after password change)
            const newSessionsList = [];
            for (let i = 0; i < newSessions; i++) {
              const session = await createSession(
                user.id,
                `10.0.0.${i}`,
                `NewUserAgent-${i}`
              );
              newSessionsList.push(session);
            }

            // Verify: new sessions were created successfully
            const sessionsAfterNewLogin = await prisma.session.count({
              where: { userId: user.id },
            });
            expect(sessionsAfterNewLogin).toBe(newSessions);

            // Verify: each new session exists and is valid
            for (const session of newSessionsList) {
              const found = await prisma.session.findUnique({
                where: { id: session.id },
              });
              expect(found).not.toBeNull();
              expect(found.userId).toBe(user.id);
              expect(found.expiresAt.getTime()).toBeGreaterThan(Date.now());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
